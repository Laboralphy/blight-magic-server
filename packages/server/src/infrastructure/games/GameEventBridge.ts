import type { IGameProcessManager } from '../../application/ports/IGameProcessManager';
import type { ILogger } from '../../application/ports/ILogger';
import type { HandleGameExit } from '../../application/use-cases/games/HandleGameExit';
import type { RelayGameOutput } from '../../application/use-cases/games/RelayGameOutput';

export type GameEventBridgeDeps = {
    gameProcessManager: IGameProcessManager;
    relayGameOutput: RelayGameOutput;
    handleGameExit: HandleGameExit;
    logger: ILogger;
};

/**
 * Turns events coming from game child processes into use case calls
 */
export class GameEventBridge {
    private readonly deps: GameEventBridgeDeps;

    constructor({
        gameProcessManager,
        relayGameOutput,
        handleGameExit,
        logger,
    }: GameEventBridgeDeps) {
        this.deps = { gameProcessManager, relayGameOutput, handleGameExit, logger };
    }

    start(): void {
        const { gameProcessManager, relayGameOutput, handleGameExit, logger } = this.deps;
        gameProcessManager.onChildMessage((gameId, message) => {
            try {
                relayGameOutput.execute(gameId, message);
            } catch (e) {
                logger.error(`relaying a message of game ${gameId}`, e);
            }
        });
        gameProcessManager.onGameExit((gameId, playerIds, code) => {
            try {
                handleGameExit.execute(gameId, playerIds, code);
            } catch (e) {
                logger.error(`handling the exit of game ${gameId}`, e);
            }
        });
    }
}
