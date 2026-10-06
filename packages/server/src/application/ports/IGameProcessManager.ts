import type { ChildToParent, Direction, GameSummary } from '@blight/protocol';

/**
 * Manages game child processes. Implemented by @blight/games (GameProcessManager).
 * A player is in at most one game at a time.
 */
export interface IGameProcessManager {
    create(type: string, name: string): Promise<GameSummary>;
    list(): GameSummary[];
    get(gameId: string): GameSummary | undefined;
    pidOf(gameId: string): number | undefined;
    findGameOfPlayer(userId: string): string | undefined;
    playerIds(gameId: string): string[];
    addPlayer(gameId: string, userId: string, name: string): GameSummary;
    removePlayer(gameId: string, userId: string): void;
    sendInput(gameId: string, userId: string, seq: number, dir: Direction): void;
    onChildMessage(listener: (gameId: string, message: ChildToParent) => void): void;
    onGameExit(listener: (gameId: string, playerIds: string[], code: number | null) => void): void;
    shutdownAll(): Promise<void>;
}
