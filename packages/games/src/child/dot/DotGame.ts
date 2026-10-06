import type { Arena, Direction, GameState } from '@blight/protocol';
import { AbstractGame } from '../AbstractGame';
import type { IGameHost } from '../IGameHost';
import { DotPlayer } from './DotPlayer';

export interface DotGameOptions {
    arena?: Arena;
    tickRate?: number;
    /** inputs applied per player and per tick */
    inputsPerTick?: number;
    random?: () => number;
}

/**
 * The simplest possible game : every player is a coloured dot in a square arena
 */
export class DotGame extends AbstractGame {
    private readonly players = new Map<string, DotPlayer>();
    private readonly arena: Arena;
    private readonly inputsPerTick: number;
    private readonly random: () => number;

    constructor(id: string, host: IGameHost, options: DotGameOptions = {}) {
        super(id, host, options.tickRate ?? 20);
        this.arena = options.arena ?? { width: 64, height: 64 };
        this.inputsPerTick = options.inputsPerTick ?? 2;
        this.random = options.random ?? Math.random;
    }

    addPlayer(userId: string, name: string): void {
        if (this.players.has(userId)) {
            return;
        }
        const color = `hsl(${Math.floor(this.random() * 360)}, 80%, 55%)`;
        const x = Math.floor(this.random() * this.arena.width);
        const y = Math.floor(this.random() * this.arena.height);
        this.players.set(userId, new DotPlayer(userId, name, color, x, y));
        this.markDirty();
        this.host.postChat(`${name} enters the arena.`);
    }

    removePlayer(userId: string): void {
        const player = this.players.get(userId);
        if (player) {
            this.players.delete(userId);
            this.markDirty();
            this.host.postChat(`${player.name} leaves the arena.`);
        }
    }

    handleInput(userId: string, seq: number, dir: Direction): void {
        this.players.get(userId)?.queueInput(seq, dir);
    }

    protected update(): void {
        for (const player of this.players.values()) {
            if (player.applyInputs(this.arena, this.inputsPerTick)) {
                this.markDirty();
            }
        }
    }

    protected snapshot(): GameState {
        return {
            gameId: this.id,
            tick: this.tick,
            arena: this.arena,
            players: [...this.players.values()].map((player) => player.toState()),
        };
    }
}
