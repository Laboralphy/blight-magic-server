import type { ClientMessage, ServerMessage } from '@blight/protocol';

export type SocketStatus = 'closed' | 'connecting' | 'open';

type Handler<T extends ServerMessage['type']> = (
    message: Extract<ServerMessage, { type: T }>
) => void;

/**
 * Typed wrapper around the browser WebSocket : one connection to the main process
 */
export class SocketClient {
    private socket: WebSocket | undefined;
    private readonly handlers = new Map<string, ((message: ServerMessage) => void)[]>();
    private readonly statusListeners: ((status: SocketStatus) => void)[] = [];

    /**
     * @param url resolved at connection time (so this module loads outside a browser, e.g. in tests)
     */
    constructor(private readonly url: () => string) {}

    /**
     * Open the connection ; resolves once it is open
     */
    connect(): Promise<void> {
        this.close();
        this.setStatus('connecting');
        const socket = new WebSocket(this.url());
        this.socket = socket;
        socket.addEventListener('message', (event) => this.dispatch(String(event.data)));
        socket.addEventListener('close', () => {
            if (this.socket === socket) {
                this.socket = undefined;
                this.setStatus('closed');
            }
        });
        return new Promise((resolve, reject) => {
            socket.addEventListener('open', () => {
                this.setStatus('open');
                resolve();
            });
            socket.addEventListener('error', () => reject(new Error('Cannot reach the server')));
        });
    }

    close(): void {
        this.socket?.close();
        this.socket = undefined;
    }

    send(message: ClientMessage): void {
        if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(message));
        }
    }

    on<T extends ServerMessage['type']>(type: T, handler: Handler<T>): void {
        const list = this.handlers.get(type) ?? [];
        list.push(handler as (message: ServerMessage) => void);
        this.handlers.set(type, list);
    }

    onStatus(listener: (status: SocketStatus) => void): void {
        this.statusListeners.push(listener);
    }

    private dispatch(data: string): void {
        const message = JSON.parse(data) as ServerMessage;
        this.handlers.get(message.type)?.forEach((handler) => handler(message));
    }

    private setStatus(status: SocketStatus): void {
        this.statusListeners.forEach((listener) => listener(status));
    }
}
