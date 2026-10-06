import type { ChildProcess } from 'node:child_process';
import type {
    ChildToParent,
    Direction,
    GameProcessArgs,
    GameSummary,
    ParentToChild,
} from '@blight/protocol';

/**
 * starting : forked, not ready yet · running : accepts players · closing : asked to shut down
 */
type GameProcessState = 'starting' | 'running' | 'closing' | 'exited';

/**
 * Main-process handle on one game child process : lifecycle, membership and typed IPC
 */
export class GameProcess {
    /** userId → display name */
    private readonly players = new Map<string, string>();
    private readonly readyPromise: Promise<void>;
    private state: GameProcessState = 'starting';

    constructor(
        private readonly args: GameProcessArgs,
        private readonly child: ChildProcess,
        readyTimeoutMs: number
    ) {
        this.child.once('exit', () => {
            this.state = 'exited';
        });
        this.readyPromise = this.watchReady(readyTimeoutMs);
    }

    get id(): string {
        return this.args.id;
    }

    get pid(): number | undefined {
        return this.child.pid;
    }

    get alive(): boolean {
        return this.state !== 'exited';
    }

    /**
     * Ready and not shutting down : the only state in which the game is visible and joinable
     */
    get running(): boolean {
        return this.state === 'running';
    }

    /**
     * Resolves when the child has announced it is ready ; rejects if it dies or times out first
     */
    waitReady(): Promise<void> {
        return this.readyPromise;
    }

    onMessage(listener: (message: ChildToParent) => void): void {
        this.child.on('message', (message) => listener(message as ChildToParent));
    }

    onExit(listener: (code: number | null, signal: NodeJS.Signals | null) => void): void {
        this.child.once('exit', listener);
    }

    addPlayer(userId: string, name: string): void {
        this.players.set(userId, name);
        this.send({ type: 'player.join', userId, name });
    }

    removePlayer(userId: string): void {
        if (this.players.delete(userId)) {
            this.send({ type: 'player.leave', userId });
        }
    }

    hasPlayer(userId: string): boolean {
        return this.players.has(userId);
    }

    get playerCount(): number {
        return this.players.size;
    }

    get playerIds(): string[] {
        return [...this.players.keys()];
    }

    sendInput(userId: string, seq: number, dir: Direction): void {
        if (this.players.has(userId)) {
            this.send({ type: 'player.input', userId, seq, dir });
        }
    }

    summary(): GameSummary {
        return {
            id: this.args.id,
            name: this.args.name,
            type: this.args.type,
            players: this.players.size,
        };
    }

    /**
     * Ask the child to stop, and kill it if it does not comply in time
     */
    async shutdown(timeoutMs = 2000): Promise<void> {
        if (this.state === 'exited') {
            return;
        }
        this.state = 'closing';
        const exited = new Promise<void>((resolve) => this.child.once('exit', () => resolve()));
        this.send({ type: 'shutdown' });
        const timer = setTimeout(() => this.child.kill('SIGKILL'), timeoutMs);
        await exited;
        clearTimeout(timer);
    }

    kill(): void {
        this.child.kill('SIGKILL');
    }

    private send(message: ParentToChild): void {
        if (this.state !== 'exited' && this.child.connected) {
            this.child.send(message);
        }
    }

    private watchReady(timeoutMs: number): Promise<void> {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                cleanup();
                reject(new Error(`game ${this.id} was not ready after ${timeoutMs} ms`));
            }, timeoutMs);
            const onMessage = (message: ChildToParent) => {
                if (message.type === 'ready') {
                    cleanup();
                    if (this.state === 'starting') {
                        this.state = 'running';
                    }
                    resolve();
                }
            };
            const onExit = (code: number | null) => {
                cleanup();
                reject(new Error(`game ${this.id} exited before being ready (code ${code})`));
            };
            const cleanup = () => {
                clearTimeout(timer);
                this.child.off('message', onMessage);
                this.child.off('exit', onExit);
            };
            this.child.on('message', onMessage);
            this.child.once('exit', onExit);
        });
    }
}
