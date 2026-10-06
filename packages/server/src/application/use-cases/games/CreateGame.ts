import type { GameSummary } from '@blight/protocol';
import type { IGameProcessManager } from '../../ports/IGameProcessManager';
import type { ILogger } from '../../ports/ILogger';
import type { JoinGame } from './JoinGame';

export type CreateGameDeps = {
    gameProcessManager: IGameProcessManager;
    joinGame: JoinGame;
    logger: ILogger;
};

/**
 * Spawns a new game process, then puts its creator in it
 */
export class CreateGame {
    private readonly deps: CreateGameDeps;

    constructor({ gameProcessManager, joinGame, logger }: CreateGameDeps) {
        this.deps = { gameProcessManager, joinGame, logger };
    }

    async execute(userId: string, type: string, name: string): Promise<GameSummary> {
        const { gameProcessManager, joinGame, logger } = this.deps;
        const game = await gameProcessManager.create(type, name);
        logger.info(
            `game ${game.id} "${game.name}" (${game.type}) started, pid ${gameProcessManager.pidOf(game.id)}`
        );
        return joinGame.execute(userId, game.id);
    }
}
