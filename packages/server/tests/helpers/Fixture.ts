import { InMemoryUserRepository } from '../../src/infrastructure/persistence/InMemoryUserRepository';
import { LoginUser } from '../../src/application/use-cases/session/LoginUser';
import { LogoutUser } from '../../src/application/use-cases/session/LogoutUser';
import { JoinGame } from '../../src/application/use-cases/games/JoinGame';
import { LeaveGame } from '../../src/application/use-cases/games/LeaveGame';
import { CreateGame } from '../../src/application/use-cases/games/CreateGame';
import { RelayGameInput } from '../../src/application/use-cases/games/RelayGameInput';
import { RelayGameOutput } from '../../src/application/use-cases/games/RelayGameOutput';
import { HandleGameExit } from '../../src/application/use-cases/games/HandleGameExit';
import type { ILogger } from '../../src/application/ports/ILogger';
import { FakeChatService } from './FakeChatService';
import { FakeClientNotifier } from './FakeClientNotifier';
import { FakeGameProcessManager } from './FakeGameProcessManager';

/**
 * Use cases wired by hand on fakes : no container, no process, no socket
 */
export class Fixture {
    readonly userRepository = new InMemoryUserRepository();
    readonly chatService = new FakeChatService();
    readonly clientNotifier = new FakeClientNotifier();
    readonly gameProcessManager = new FakeGameProcessManager();
    readonly clock = { now: () => 1000 };
    readonly gameSettings = { maxGames: 2 };
    readonly errors: string[] = [];
    readonly logger: ILogger = {
        info: () => {},
        error: (message) => this.errors.push(message),
    };

    readonly loginUser = new LoginUser(this);
    readonly logoutUser = new LogoutUser(this);
    readonly joinGame = new JoinGame(this);
    readonly leaveGame = new LeaveGame(this);
    readonly createGame = new CreateGame(this);
    readonly relayGameInput = new RelayGameInput(this);
    readonly relayGameOutput = new RelayGameOutput(this);
    readonly handleGameExit = new HandleGameExit(this);
}
