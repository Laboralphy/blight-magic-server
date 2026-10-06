import type { IChatService } from '../../ports/IChatService';
import type { IClientNotifier } from '../../ports/IClientNotifier';
import type { ILogger } from '../../ports/ILogger';
import { gameRoom, LOBBY_ROOM } from '../../../domain/entities/Rooms';

export type HandleGameExitDeps = {
    chatService: IChatService;
    clientNotifier: IClientNotifier;
    logger: ILogger;
};

/**
 * A game process is gone (shut down or crashed) : its players are sent back to the lobby
 */
export class HandleGameExit {
    private readonly deps: HandleGameExitDeps;

    constructor({ chatService, clientNotifier, logger }: HandleGameExitDeps) {
        this.deps = { chatService, clientNotifier, logger };
    }

    execute(gameId: string, playerIds: string[], code: number | null): void {
        const { chatService, clientNotifier, logger } = this.deps;
        const crashed = code !== 0;
        logger.info(`game ${gameId} exited (code ${code})`);
        const reason = crashed ? 'the game process crashed' : 'the game was closed';
        for (const userId of playerIds) {
            clientNotifier.send(userId, { type: 'game.left', gameId, reason });
            if (crashed) {
                clientNotifier.error(userId, `Game ${gameId}: ${reason}. Back to the lobby.`);
            }
            chatService.joinRoom(userId, LOBBY_ROOM);
        }
        chatService.closeRoom(gameRoom(gameId));
    }
}
