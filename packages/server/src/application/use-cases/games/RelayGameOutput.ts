import type { ChildToParent } from '@blight/protocol';
import type { IChatService } from '../../ports/IChatService';
import type { IClientNotifier } from '../../ports/IClientNotifier';
import type { IGameProcessManager } from '../../ports/IGameProcessManager';
import type { ILogger } from '../../ports/ILogger';
import { gameRoom } from '../../../domain/entities/Rooms';

export type RelayGameOutputDeps = {
    gameProcessManager: IGameProcessManager;
    chatService: IChatService;
    clientNotifier: IClientNotifier;
    logger: ILogger;
};

/**
 * Delivers what a game process says : messages to its players, and announcements to its chat room
 */
export class RelayGameOutput {
    private readonly deps: RelayGameOutputDeps;

    constructor({ gameProcessManager, chatService, clientNotifier, logger }: RelayGameOutputDeps) {
        this.deps = { gameProcessManager, chatService, clientNotifier, logger };
    }

    execute(gameId: string, message: ChildToParent): void {
        const { gameProcessManager, chatService, clientNotifier, logger } = this.deps;
        switch (message.type) {
            case 'send':
                clientNotifier.send(message.userId, message.message);
                break;
            case 'broadcast':
                clientNotifier.sendMany(gameProcessManager.playerIds(gameId), message.message);
                break;
            case 'chat.post': {
                const game = gameProcessManager.get(gameId);
                chatService.announce(
                    gameRoom(gameId),
                    game?.name ?? `game ${gameId}`,
                    message.text
                );
                break;
            }
            case 'error':
                logger.error(`game ${gameId}: ${message.text}`);
                break;
            case 'ready':
                break;
        }
    }
}
