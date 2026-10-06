import type { Arena, Direction, PlayerState } from '@blight/protocol';

interface PendingInput {
    seq: number;
    dir: Direction;
}

const MAX_PENDING_INPUTS = 10;

/**
 * A player of the dot game : a coloured dot moving one cell per input
 */
export class DotPlayer {
    private readonly pendingInputs: PendingInput[] = [];
    private ackSeq = -1;

    constructor(
        readonly id: string,
        readonly name: string,
        readonly color: string,
        private x: number,
        private y: number
    ) {}

    /**
     * Queue an input ; it will be applied on the next ticks.
     * Excess inputs are dropped, which caps how fast a (cheating) client can move.
     */
    queueInput(seq: number, dir: Direction): void {
        if (seq > this.ackSeq && this.pendingInputs.length < MAX_PENDING_INPUTS) {
            this.pendingInputs.push({ seq, dir });
        }
    }

    /**
     * Apply at most `max` queued inputs, clamped to the arena
     * @return true if anything changed
     */
    applyInputs(arena: Arena, max: number): boolean {
        const inputs = this.pendingInputs.splice(0, max);
        for (const { seq, dir } of inputs) {
            this.move(dir, arena);
            this.ackSeq = seq;
        }
        return inputs.length > 0;
    }

    private move(dir: Direction, arena: Arena): void {
        switch (dir) {
            case 'up':
                this.y = Math.max(0, this.y - 1);
                break;
            case 'down':
                this.y = Math.min(arena.height - 1, this.y + 1);
                break;
            case 'left':
                this.x = Math.max(0, this.x - 1);
                break;
            case 'right':
                this.x = Math.min(arena.width - 1, this.x + 1);
                break;
        }
    }

    toState(): PlayerState {
        return {
            id: this.id,
            name: this.name,
            color: this.color,
            x: this.x,
            y: this.y,
            ackSeq: this.ackSeq,
        };
    }
}
