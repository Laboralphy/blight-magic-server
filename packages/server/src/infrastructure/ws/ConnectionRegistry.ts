import { WebSocket } from 'ws';
import type { ServerMessage } from '@blight/protocol';
import type { IClientNotifier } from '../../application/ports/IClientNotifier';

/**
 * userId ↔ socket. A user id is the id of the connection that created it.
 */
export class ConnectionRegistry implements IClientNotifier {
    private readonly sockets = new Map<string, WebSocket>();

    bind(userId: string, socket: WebSocket): void {
        this.sockets.set(userId, socket);
    }

    unbind(userId: string): void {
        this.sockets.delete(userId);
    }

    get size(): number {
        return this.sockets.size;
    }

    send(userId: string, message: ServerMessage): void {
        this.write(this.sockets.get(userId), JSON.stringify(message));
    }

    sendMany(userIds: Iterable<string>, message: ServerMessage): void {
        const data = JSON.stringify(message);
        for (const userId of userIds) {
            this.write(this.sockets.get(userId), data);
        }
    }

    info(userId: string, text: string): void {
        this.send(userId, { type: 'system.info', text });
    }

    error(userId: string, text: string): void {
        this.send(userId, { type: 'system.error', text });
    }

    private write(socket: WebSocket | undefined, data: string): void {
        if (socket?.readyState === WebSocket.OPEN) {
            socket.send(data);
        }
    }
}
