import type { ChildToParent, Direction, GameSummary } from '@blight/protocol';
import { GameProcess } from './GameProcess';
import type { IGameProcessLauncher } from './IGameProcessLauncher';

export type ChildMessageListener = (gameId: string, message: ChildToParent) => void;
export type GameExitListener = (gameId: string, playerIds: string[], code: number | null) => void;

export interface GameProcessManagerOptions {
    readyTimeoutMs?: number;
}

/**
 * Creates, tracks and destroys the game child processes.
 * A player is in at most one game at a time.
 */
export class GameProcessManager {
    private readonly games = new Map<string, GameProcess>();
    private readonly messageListeners: ChildMessageListener[] = [];
    private readonly exitListeners: GameExitListener[] = [];
    private readonly readyTimeoutMs: number;
    private lastId = 0;

    constructor(
        private readonly launcher: IGameProcessLauncher,
        options: GameProcessManagerOptions = {}
    ) {
        this.readyTimeoutMs = options.readyTimeoutMs ?? 10000;
    }

    /**
     * Spawn a new game process and wait until it is ready
     */
    async create(type: string, name: string): Promise<GameSummary> {
        const id = String(++this.lastId);
        const game = new GameProcess(
            { id, type, name },
            this.launcher.launch({ id, type, name }),
            this.readyTimeoutMs
        );
        this.games.set(id, game);
        game.onMessage((message) => this.messageListeners.forEach((l) => l(id, message)));
        game.onExit((code) => {
            this.games.delete(id);
            const playerIds = game.playerIds;
            this.exitListeners.forEach((l) => l(id, playerIds, code));
        });
        try {
            await game.waitReady();
        } catch (e) {
            game.kill();
            throw e;
        }
        return game.summary();
    }

    list(): GameSummary[] {
        return [...this.games.values()].map((game) => game.summary());
    }

    get(gameId: string): GameSummary | undefined {
        return this.games.get(gameId)?.summary();
    }

    pidOf(gameId: string): number | undefined {
        return this.games.get(gameId)?.pid;
    }

    findGameOfPlayer(userId: string): string | undefined {
        for (const game of this.games.values()) {
            if (game.hasPlayer(userId)) {
                return game.id;
            }
        }
        return undefined;
    }

    playerIds(gameId: string): string[] {
        return this.games.get(gameId)?.playerIds ?? [];
    }

    addPlayer(gameId: string, userId: string, name: string): GameSummary {
        const game = this.require(gameId);
        game.addPlayer(userId, name);
        return game.summary();
    }

    removePlayer(gameId: string, userId: string): void {
        this.games.get(gameId)?.removePlayer(userId);
    }

    sendInput(gameId: string, userId: string, seq: number, dir: Direction): void {
        this.games.get(gameId)?.sendInput(userId, seq, dir);
    }

    onChildMessage(listener: ChildMessageListener): void {
        this.messageListeners.push(listener);
    }

    onGameExit(listener: GameExitListener): void {
        this.exitListeners.push(listener);
    }

    async shutdownAll(): Promise<void> {
        await Promise.all([...this.games.values()].map((game) => game.shutdown()));
    }

    private require(gameId: string): GameProcess {
        const game = this.games.get(gameId);
        if (!game) {
            throw new Error(`game ${gameId} does not exist`);
        }
        return game;
    }
}
