import type { GameSummary } from '@blight/protocol';
import type { IUserRepository } from '../../../domain/ports/IUserRepository';
import type { IChatService } from '../../ports/IChatService';
import type { IClientNotifier } from '../../ports/IClientNotifier';
import type { IGameProcessManager } from '../../ports/IGameProcessManager';
import { gameRoom } from '../../../domain/entities/Rooms';
import { DomainError } from '../../../domain/errors/DomainError';

export type JoinGameDeps = {
    userRepository: IUserRepository;
    gameProcessManager: IGameProcessManager;
    chatService: IChatService;
    clientNotifier: IClientNotifier;
};

/**
 * Routes a user to a game process, leaving its previous game if any
 */
export class JoinGame {
    private readonly deps: JoinGameDeps;

    constructor({ userRepository, gameProcessManager, chatService, clientNotifier }: JoinGameDeps) {
        this.deps = { userRepository, gameProcessManager, chatService, clientNotifier };
    }

    async execute(userId: string, gameId: string): Promise<GameSummary> {
        const { userRepository, gameProcessManager, chatService, clientNotifier } = this.deps;
        const user = await userRepository.findById(userId);
        if (!user) {
            throw DomainError.notFound('User', userId);
        }
        if (!gameProcessManager.get(gameId)) {
            throw DomainError.notFound('Game', gameId);
        }
        const currentGameId = gameProcessManager.findGameOfPlayer(userId);
        if (currentGameId === gameId) {
            throw DomainError.invalid(`You are already in game ${gameId}`);
        }
        if (currentGameId !== undefined) {
            gameProcessManager.removePlayer(currentGameId, userId);
            clientNotifier.send(userId, {
                type: 'game.left',
                gameId: currentGameId,
                reason: 'joined another game',
            });
        }
        const game = gameProcessManager.addPlayer(gameId, userId, user.name);
        clientNotifier.send(userId, { type: 'game.joined', game });
        chatService.joinRoom(userId, gameRoom(gameId));
        return game;
    }
}
