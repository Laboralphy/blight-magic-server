import WebSocket from 'ws';
import type { ClientMessage, ServerMessage } from '@blight/protocol';

/**
 * A scripted WebSocket client that records everything the server sends
 */
export class TestClient {
    readonly received: ServerMessage[] = [];
    private readonly socket: WebSocket;
    private waiters: {
        predicate: (m: ServerMessage) => boolean;
        resolve: (m: ServerMessage) => void;
    }[] = [];
    private cursor = 0;

    private constructor(url: string) {
        this.socket = new WebSocket(url);
        this.socket.on('message', (data) => {
            const message = JSON.parse(String(data)) as ServerMessage;
            this.received.push(message);
            this.waiters = this.waiters.filter((w) => {
                if (w.predicate(message)) {
                    w.resolve(message);
                    return false;
                }
                return true;
            });
        });
    }

    static async connect(url: string): Promise<TestClient> {
        const client = new TestClient(url);
        await new Promise((resolve, reject) => {
            client.socket.once('open', resolve);
            client.socket.once('error', reject);
        });
        return client;
    }

    send(message: ClientMessage): void {
        this.socket.send(JSON.stringify(message));
    }

    say(text: string): void {
        this.send({ type: 'chat.say', text });
    }

    /**
     * Wait for a message received after the previous expect() call
     */
    expect<T extends ServerMessage['type']>(
        type: T,
        accept: (m: Extract<ServerMessage, { type: T }>) => boolean = () => true,
        timeoutMs = 5000
    ): Promise<Extract<ServerMessage, { type: T }>> {
        const predicate = (m: ServerMessage) =>
            m.type === type && accept(m as Extract<ServerMessage, { type: T }>);
        const index = this.received.slice(this.cursor).findIndex(predicate);
        if (index >= 0) {
            this.cursor += index + 1;
            return Promise.resolve(
                this.received[this.cursor - 1] as Extract<ServerMessage, { type: T }>
            );
        }
        return new Promise((resolve, reject) => {
            const timer = setTimeout(
                () => reject(new Error(`timeout waiting for ${type}`)),
                timeoutMs
            );
            this.waiters.push({
                predicate,
                resolve: (m) => {
                    clearTimeout(timer);
                    this.cursor = this.received.length;
                    resolve(m as Extract<ServerMessage, { type: T }>);
                },
            });
        });
    }

    close(): void {
        this.socket.close();
    }
}
