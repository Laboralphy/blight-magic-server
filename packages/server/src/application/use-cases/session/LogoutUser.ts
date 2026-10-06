import type { IUserRepository } from '../../../domain/ports/IUserRepository';
import type { IChatService } from '../../ports/IChatService';
import type { IGameProcessManager } from '../../ports/IGameProcessManager';

export type LogoutUserDeps = {
    userRepository: IUserRepository;
    chatService: IChatService;
    gameProcessManager: IGameProcessManager;
};

/**
 * Called when a connection closes : removes the user from its game and from the chat
 */
export class LogoutUser {
    private readonly deps: LogoutUserDeps;

    constructor({ userRepository, chatService, gameProcessManager }: LogoutUserDeps) {
        this.deps = { userRepository, chatService, gameProcessManager };
    }

    async execute(userId: string): Promise<void> {
        const { userRepository, chatService, gameProcessManager } = this.deps;
        if (!(await userRepository.findById(userId))) {
            return;
        }
        const gameId = gameProcessManager.findGameOfPlayer(userId);
        if (gameId !== undefined) {
            gameProcessManager.removePlayer(gameId, userId);
        }
        chatService.unregisterUser(userId);
        await userRepository.remove(userId);
    }
}
