import type { Direction, GameState } from '@blight/protocol';
import type { IGame } from './IGame';
import type { IGameHost } from './IGameHost';

/**
 * Fixed-rate, server-authoritative game loop.
 * Subclasses mutate their state in update() and call markDirty() ;
 * a snapshot is broadcast at the end of every tick in which something changed.
 */
export abstract class AbstractGame implements IGame {
    private timer: NodeJS.Timeout | undefined;
    private dirty = true;
    protected tick = 0;

    protected constructor(
        protected readonly id: string,
        protected readonly host: IGameHost,
        private readonly tickRate: number
    ) {}

    start(): void {
        if (this.timer === undefined) {
            this.timer = setInterval(() => this.step(), 1000 / this.tickRate);
        }
    }

    stop(): void {
        clearInterval(this.timer);
        this.timer = undefined;
    }

    /**
     * Advance the simulation by one tick. Public so tests can drive the loop by hand.
     */
    step(): void {
        ++this.tick;
        this.update();
        if (this.dirty) {
            this.dirty = false;
            this.host.broadcast({ type: 'game.state', state: this.snapshot() });
        }
    }

    protected markDirty(): void {
        this.dirty = true;
    }

    abstract addPlayer(userId: string, name: string): void;
    abstract removePlayer(userId: string): void;
    abstract handleInput(userId: string, seq: number, dir: Direction): void;
    protected abstract update(): void;
    protected abstract snapshot(): GameState;
}
