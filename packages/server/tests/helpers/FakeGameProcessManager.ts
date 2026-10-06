import type { ChildToParent, Direction, GameSummary } from '@blight/protocol';
import type { IGameProcessManager } from '../../src/application/ports/IGameProcessManager';

/**
 * In-process stand-in for the real manager : no child process.
 * Games are running as soon as created, and vanish when their last player leaves.
 */
export class FakeGameProcessManager implements IGameProcessManager {
    readonly games = new Map<string, { summary: GameSummary; players: Set<string> }>();
    readonly inputs: { gameId: string; userId: string; seq: number; dir: Direction }[] = [];
    private lastId = 0;

    async create(type: string, name: string): Promise<GameSummary> {
        const id = String(++this.lastId);
        this.games.set(id, { summary: { id, type, name, players: 0 }, players: new Set() });
        return this.get(id)!;
    }

    list(): GameSummary[] {
        return [...this.games.keys()].map((id) => this.get(id)!);
    }

    count(): number {
        return this.games.size;
    }

    get(gameId: string): GameSummary | undefined {
        const game = this.games.get(gameId);
        return game && { ...game.summary, players: game.players.size };
    }

    pidOf(): number | undefined {
        return 12345;
    }

    findGameOfPlayer(userId: string): string | undefined {
        return [...this.games.entries()].find(([, g]) => g.players.has(userId))?.[0];
    }

    playerIds(gameId: string): string[] {
        return [...(this.games.get(gameId)?.players ?? [])];
    }

    addPlayer(gameId: string, userId: string): GameSummary {
        this.games.get(gameId)!.players.add(userId);
        return this.get(gameId)!;
    }

    removePlayer(gameId: string, userId: string): void {
        const game = this.games.get(gameId);
        if (game?.players.delete(userId) && game.players.size === 0) {
            this.games.delete(gameId);
        }
    }

    sendInput(gameId: string, userId: string, seq: number, dir: Direction): void {
        this.inputs.push({ gameId, userId, seq, dir });
    }

    onChildMessage(_listener: (gameId: string, message: ChildToParent) => void): void {}

    onGameExit(
        _listener: (gameId: string, playerIds: string[], code: number | null) => void
    ): void {}

    async shutdownAll(): Promise<void> {
        this.games.clear();
    }
}
