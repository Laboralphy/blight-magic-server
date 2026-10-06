import type { Direction } from '@blight/protocol';

/**
 * A game hosted in a child process
 */
export interface IGame {
    start(): void;
    stop(): void;
    addPlayer(userId: string, name: string): void;
    removePlayer(userId: string): void;
    handleInput(userId: string, seq: number, dir: Direction): void;
}
