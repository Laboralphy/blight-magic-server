import type { Direction } from '@blight/protocol';
import type { IGameProcessManager } from '../../ports/IGameProcessManager';

export type RelayGameInputDeps = {
    gameProcessManager: IGameProcessManager;
};

/**
 * Forwards a player input to the process of its game. Hot path : no lookup besides the game.
 */
export class RelayGameInput {
    private readonly deps: RelayGameInputDeps;

    constructor({ gameProcessManager }: RelayGameInputDeps) {
        this.deps = { gameProcessManager };
    }

    execute(userId: string, seq: number, dir: Direction): void {
        const { gameProcessManager } = this.deps;
        const gameId = gameProcessManager.findGameOfPlayer(userId);
        if (gameId !== undefined) {
            gameProcessManager.sendInput(gameId, userId, seq, dir);
        }
    }
}
