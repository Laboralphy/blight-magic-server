/**
 * Composition root — the ONLY file that knows both the ports and their implementations.
 *
 * Wiring mistakes are caught at compile time, not on the first resolve():
 *  1. Classes declare their own `XxxDeps` type ; `singleton(X)` only compiles if the Cradle
 *     provides every dependency of X with a compatible type.
 *  2. `registrations` is typed `Registrations<Cradle>` : forgetting a Cradle entry is a type error.
 *  3. `strict: true` : a singleton depending on a connection-scoped registration throws.
 */
import {
    asClass,
    asFunction,
    asValue,
    type AwilixContainer,
    createContainer,
    InjectionMode,
    type Resolver,
} from 'awilix';
import { GameProcessLauncher, GameProcessManager } from '@blight/games';

import type { IUserRepository } from '../domain/ports/IUserRepository';
import type { IChatService } from '../application/ports/IChatService';
import type { IClientNotifier } from '../application/ports/IClientNotifier';
import type { IClock } from '../application/ports/IClock';
import type { IGameProcessManager } from '../application/ports/IGameProcessManager';
import type { IIdGenerator } from '../application/ports/IIdGenerator';
import type { ILogger } from '../application/ports/ILogger';

import { LoginUser } from '../application/use-cases/session/LoginUser';
import { LogoutUser } from '../application/use-cases/session/LogoutUser';
import { PostChatMessage } from '../application/use-cases/chat/PostChatMessage';
import { CreateGame } from '../application/use-cases/games/CreateGame';
import { ListGames } from '../application/use-cases/games/ListGames';
import { JoinGame } from '../application/use-cases/games/JoinGame';
import { LeaveGame } from '../application/use-cases/games/LeaveGame';
import { RelayGameInput } from '../application/use-cases/games/RelayGameInput';
import { RelayGameOutput } from '../application/use-cases/games/RelayGameOutput';
import { HandleGameExit } from '../application/use-cases/games/HandleGameExit';

import { InMemoryUserRepository } from '../infrastructure/persistence/InMemoryUserRepository';
import { UuidGenerator } from '../infrastructure/services/UuidGenerator';
import { SystemClock } from '../infrastructure/services/SystemClock';
import { ConsoleLogger } from '../infrastructure/services/ConsoleLogger';
import { TxatChatService } from '../infrastructure/chat/TxatChatService';
import type { ICommand } from '../infrastructure/commands/ICommand';
import { CommandInterpreter } from '../infrastructure/commands/CommandInterpreter';
import { CreateCommand } from '../infrastructure/commands/CreateCommand';
import { ListCommand } from '../infrastructure/commands/ListCommand';
import { JoinCommand } from '../infrastructure/commands/JoinCommand';
import { LeaveCommand } from '../infrastructure/commands/LeaveCommand';
import { ConnectionRegistry } from '../infrastructure/ws/ConnectionRegistry';
import { ClientConnection } from '../infrastructure/ws/ClientConnection';
import { WebSocketGateway } from '../infrastructure/ws/WebSocketGateway';
import type {
    ConnectionScope,
    ConnectionScopeFactory,
} from '../infrastructure/ws/ConnectionScopeFactory';
import { GameEventBridge } from '../infrastructure/games/GameEventBridge';
import { KoaApp } from '../infrastructure/web/KoaApp';
import type { WebSettings } from '../infrastructure/web/WebSettings';

import type { BootSettings } from './settings';

/** Everything resolvable from the root container. Ports are typed as interfaces. */
export interface Cradle {
    // values
    webSettings: WebSettings;

    // services
    logger: ILogger;
    clock: IClock;
    idGenerator: IIdGenerator;
    userRepository: IUserRepository;
    connectionRegistry: ConnectionRegistry;
    clientNotifier: IClientNotifier;
    chatService: IChatService;
    gameProcessManager: IGameProcessManager;

    // use cases
    loginUser: LoginUser;
    logoutUser: LogoutUser;
    postChatMessage: PostChatMessage;
    createGame: CreateGame;
    listGames: ListGames;
    joinGame: JoinGame;
    leaveGame: LeaveGame;
    relayGameInput: RelayGameInput;
    relayGameOutput: RelayGameOutput;
    handleGameExit: HandleGameExit;

    // chat commands
    createCommand: CreateCommand;
    listCommand: ListCommand;
    joinCommand: JoinCommand;
    leaveCommand: LeaveCommand;
    commands: ICommand[];
    commandInterpreter: CommandInterpreter;

    // delivery
    connectionScopeFactory: ConnectionScopeFactory;
    webSocketGateway: WebSocketGateway;
    gameEventBridge: GameEventBridge;
    koaApp: KoaApp;
}

/** One WebSocket connection */
export interface ConnectionCradle extends Cradle {
    sessionId: string;
    clientConnection: ClientConnection;
}

type Registrations<C> = { [K in keyof C]: Resolver<C[K]> };

/*
 * Awilix's own `Constructor<T>` is `new (...args: any[])` ; requiring `new (cradle: Cradle) => T`
 * makes TypeScript check, by parameter contravariance, that `Cradle` satisfies the class's deps.
 */
const singleton = <T>(cls: new (cradle: Cradle) => T) => asClass(cls).singleton();
const scoped = <T>(cls: new (cradle: ConnectionCradle) => T) => asClass(cls).scoped();

export function buildContainer(boot: BootSettings): AwilixContainer<Cradle> {
    const container = createContainer<Cradle>({
        injectionMode: InjectionMode.PROXY,
        strict: true,
    });

    const registrations: Registrations<Cradle> = {
        webSettings: asValue({ clientDist: boot.clientDist }),

        logger: singleton(ConsoleLogger),
        clock: singleton(SystemClock),
        idGenerator: singleton(UuidGenerator),
        userRepository: singleton(InMemoryUserRepository),
        connectionRegistry: singleton(ConnectionRegistry),
        // the registry is the notifier : same instance under its port name
        clientNotifier: asFunction(
            ({ connectionRegistry }: Cradle) => connectionRegistry
        ).singleton(),
        chatService: singleton(TxatChatService),
        gameProcessManager: asFunction(
            (): IGameProcessManager =>
                new GameProcessManager(new GameProcessLauncher(), {
                    readyTimeoutMs: boot.gameReadyTimeoutMs,
                })
        ).singleton(),

        loginUser: singleton(LoginUser),
        logoutUser: singleton(LogoutUser),
        postChatMessage: singleton(PostChatMessage),
        createGame: singleton(CreateGame),
        listGames: singleton(ListGames),
        joinGame: singleton(JoinGame),
        leaveGame: singleton(LeaveGame),
        relayGameInput: singleton(RelayGameInput),
        relayGameOutput: singleton(RelayGameOutput),
        handleGameExit: singleton(HandleGameExit),

        createCommand: singleton(CreateCommand),
        listCommand: singleton(ListCommand),
        joinCommand: singleton(JoinCommand),
        leaveCommand: singleton(LeaveCommand),
        commands: asFunction(
            ({ createCommand, listCommand, joinCommand, leaveCommand }: Cradle) => [
                createCommand,
                listCommand,
                joinCommand,
                leaveCommand,
            ]
        ).singleton(),
        commandInterpreter: singleton(CommandInterpreter),

        connectionScopeFactory: asValue((sessionId: string) =>
            createConnectionScope(container, sessionId)
        ),
        webSocketGateway: singleton(WebSocketGateway),
        gameEventBridge: singleton(GameEventBridge),
        koaApp: singleton(KoaApp),
    };
    container.register(registrations);

    // Scoped registrations live on the root and are instantiated once per scope.
    // `sessionId` itself is only known per connection, see createConnectionScope().
    const connectionRegistrations: Registrations<
        Omit<ConnectionCradle, keyof Cradle | 'sessionId'>
    > = {
        clientConnection: scoped(ClientConnection),
    };
    container.register(connectionRegistrations);

    return container;
}

export function createConnectionScope(
    container: AwilixContainer<Cradle>,
    sessionId: string
): ConnectionScope {
    const scope = container.createScope<ConnectionCradle>();
    scope.register({ sessionId: asValue(sessionId) });
    return {
        handler: scope.resolve('clientConnection'),
        dispose: () => scope.dispose(),
    };
}
