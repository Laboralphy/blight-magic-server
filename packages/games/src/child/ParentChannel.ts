import { type ChildToParent, type ParentToChild, ParentToChildSchema } from '@blight/protocol';
import type { ServerMessage } from '@blight/protocol';
import type { IGameHost } from './IGameHost';

/**
 * The child side of the IPC channel with the main process.
 * Validates what comes in, and gives the game a typed way to talk back.
 */
export class ParentChannel implements IGameHost {
    constructor(private readonly proc: NodeJS.Process) {
        if (!proc.send) {
            throw new Error('ParentChannel: this process was not spawned with an IPC channel');
        }
    }

    /**
     * Subscribe to validated messages from the main process
     */
    onMessage(handler: (message: ParentToChild) => void): void {
        this.proc.on('message', (raw: unknown) => {
            const parsed = ParentToChildSchema.safeParse(raw);
            if (parsed.success) {
                handler(parsed.data);
            } else {
                this.post({ type: 'error', text: `invalid IPC message: ${parsed.error.message}` });
            }
        });
    }

    /**
     * Called once when the main process goes away (crash or exit) : the game must not survive it
     */
    onParentGone(handler: () => void): void {
        this.proc.on('disconnect', handler);
    }

    post(message: ChildToParent): void {
        if (this.proc.connected) {
            this.proc.send!(message);
        }
    }

    send(userId: string, message: ServerMessage): void {
        this.post({ type: 'send', userId, message });
    }

    broadcast(message: ServerMessage): void {
        this.post({ type: 'broadcast', message });
    }

    postChat(text: string): void {
        this.post({ type: 'chat.post', text });
    }
}
