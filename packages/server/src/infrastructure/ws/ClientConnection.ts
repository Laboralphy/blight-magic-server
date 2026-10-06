import { type ClientMessage, ClientMessageSchema } from '@blight/protocol';
import { z } from 'zod';
import type { IClientNotifier } from '../../application/ports/IClientNotifier';
import type { ILogger } from '../../application/ports/ILogger';
import type { LoginUser } from '../../application/use-cases/session/LoginUser';
import type { LogoutUser } from '../../application/use-cases/session/LogoutUser';
import type { PostChatMessage } from '../../application/use-cases/chat/PostChatMessage';
import type { RelayGameInput } from '../../application/use-cases/games/RelayGameInput';
import { DomainError } from '../../domain/errors/DomainError';
import type { CommandInterpreter } from '../commands/CommandInterpreter';
import type { IConnectionHandler } from './IConnectionHandler';

export type ClientConnectionDeps = {
    sessionId: string;
    loginUser: LoginUser;
    logoutUser: LogoutUser;
    postChatMessage: PostChatMessage;
    relayGameInput: RelayGameInput;
    commandInterpreter: CommandInterpreter;
    clientNotifier: IClientNotifier;
    logger: ILogger;
};

/**
 * Connection-scoped controller : validates client messages and dispatches them to use cases
 */
export class ClientConnection implements IConnectionHandler {
    private readonly deps: ClientConnectionDeps;
    private loggedIn = false;

    constructor({
        sessionId,
        loginUser,
        logoutUser,
        postChatMessage,
        relayGameInput,
        commandInterpreter,
        clientNotifier,
        logger,
    }: ClientConnectionDeps) {
        this.deps = {
            sessionId,
            loginUser,
            logoutUser,
            postChatMessage,
            relayGameInput,
            commandInterpreter,
            clientNotifier,
            logger,
        };
    }

    async handleMessage(raw: string): Promise<void> {
        const { sessionId, clientNotifier } = this.deps;
        let data: unknown;
        try {
            data = JSON.parse(raw);
        } catch {
            clientNotifier.error(sessionId, 'Malformed message');
            return;
        }
        const parsed = ClientMessageSchema.safeParse(data);
        if (!parsed.success) {
            const reason = z.prettifyError(parsed.error);
            if ((data as { type?: unknown } | null)?.type === 'auth.login') {
                clientNotifier.send(sessionId, { type: 'auth.error', reason });
            } else {
                clientNotifier.error(sessionId, `Invalid message: ${reason}`);
            }
            return;
        }
        try {
            await this.dispatch(parsed.data);
        } catch (e) {
            this.report(e);
        }
    }

    async handleClose(): Promise<void> {
        if (this.loggedIn) {
            this.loggedIn = false;
            await this.deps.logoutUser.execute(this.deps.sessionId);
        }
    }

    private async dispatch(message: ClientMessage): Promise<void> {
        const { sessionId } = this.deps;
        if (message.type === 'auth.login') {
            await this.login(message.name);
            return;
        }
        if (!this.loggedIn) {
            throw new DomainError('UNAUTHORIZED', 'Please log in first');
        }
        switch (message.type) {
            case 'chat.say':
                if (message.text.startsWith('/')) {
                    await this.deps.commandInterpreter.execute(sessionId, message.text);
                } else {
                    this.deps.postChatMessage.execute(sessionId, message.text);
                }
                break;
            case 'game.input':
                this.deps.relayGameInput.execute(sessionId, message.seq, message.dir);
                break;
        }
    }

    private async login(name: string): Promise<void> {
        const { sessionId, loginUser, clientNotifier, logger } = this.deps;
        if (this.loggedIn) {
            throw DomainError.invalid('Already logged in');
        }
        try {
            await loginUser.execute(sessionId, name);
            this.loggedIn = true;
            logger.info(`${name} logged in`);
        } catch (e) {
            if (e instanceof DomainError) {
                clientNotifier.send(sessionId, { type: 'auth.error', reason: e.message });
            } else {
                throw e;
            }
        }
    }

    private report(e: unknown): void {
        const { sessionId, clientNotifier, logger } = this.deps;
        if (e instanceof DomainError) {
            clientNotifier.error(sessionId, e.message);
        } else {
            logger.error(`session ${sessionId}`, e);
            clientNotifier.error(sessionId, 'Internal server error');
        }
    }
}
