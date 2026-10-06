import type { GameSummary } from '@blight/protocol';
import type { IGameProcessManager } from '../../ports/IGameProcessManager';

export type ListGamesDeps = {
    gameProcessManager: IGameProcessManager;
};

export class ListGames {
    private readonly deps: ListGamesDeps;

    constructor({ gameProcessManager }: ListGamesDeps) {
        this.deps = { gameProcessManager };
    }

    execute(): GameSummary[] {
        return this.deps.gameProcessManager.list();
    }
}
