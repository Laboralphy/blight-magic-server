import type { IChatService } from '../../ports/IChatService';
import type { IClientNotifier } from '../../ports/IClientNotifier';
import type { IGameProcessManager } from '../../ports/IGameProcessManager';
import { LOBBY_ROOM } from '../../../domain/entities/Rooms';
import { DomainError } from '../../../domain/errors/DomainError';

export type LeaveGameDeps = {
    gameProcessManager: IGameProcessManager;
    chatService: IChatService;
    clientNotifier: IClientNotifier;
};

/**
 * Disconnects a user from its game process and sends it back to the lobby
 */
export class LeaveGame {
    private readonly deps: LeaveGameDeps;

    constructor({ gameProcessManager, chatService, clientNotifier }: LeaveGameDeps) {
        this.deps = { gameProcessManager, chatService, clientNotifier };
    }

    execute(userId: string): void {
        const { gameProcessManager, chatService, clientNotifier } = this.deps;
        const gameId = gameProcessManager.findGameOfPlayer(userId);
        if (gameId === undefined) {
            throw DomainError.invalid('You are not in a game');
        }
        gameProcessManager.removePlayer(gameId, userId);
        clientNotifier.send(userId, { type: 'game.left', gameId, reason: 'left' });
        chatService.joinRoom(userId, LOBBY_ROOM);
    }
}
