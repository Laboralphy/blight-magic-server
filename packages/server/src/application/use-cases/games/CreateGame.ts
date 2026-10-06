import type { GameSummary } from '@blight/protocol';
import type { IGameProcessManager } from '../../ports/IGameProcessManager';
import type { ILogger } from '../../ports/ILogger';
import type { GameSettings } from '../../settings/GameSettings';
import { DomainError } from '../../../domain/errors/DomainError';
import type { JoinGame } from './JoinGame';

export type CreateGameDeps = {
    gameProcessManager: IGameProcessManager;
    joinGame: JoinGame;
    gameSettings: GameSettings;
    logger: ILogger;
};

/**
 * Spawns a new game process, then puts its creator in it.
 * Joining it leaves the creator's previous game, which closes if it becomes empty :
 * a user cannot pile up games, and the total is capped by `maxGames`.
 */
export class CreateGame {
    private readonly deps: CreateGameDeps;

    constructor({ gameProcessManager, joinGame, gameSettings, logger }: CreateGameDeps) {
        this.deps = { gameProcessManager, joinGame, gameSettings, logger };
    }

    async execute(userId: string, type: string, name: string): Promise<GameSummary> {
        const { gameProcessManager, joinGame, gameSettings, logger } = this.deps;
        if (gameProcessManager.count() >= gameSettings.maxGames) {
            throw DomainError.invalid(
                `The server already hosts ${gameSettings.maxGames} games. Join one with /list and /join`
            );
        }
        const game = await gameProcessManager.create(type, name);
        logger.info(
            `game ${game.id} "${game.name}" (${game.type}) started, pid ${gameProcessManager.pidOf(game.id)}`
        );
        return joinGame.execute(userId, game.id);
    }
}
