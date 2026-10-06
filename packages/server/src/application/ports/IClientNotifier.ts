import type { ServerMessage } from '@blight/protocol';

/**
 * Pushes messages to connected clients
 */
export interface IClientNotifier {
    send(userId: string, message: ServerMessage): void;
    /** same message to many users : implementations serialize it only once */
    sendMany(userIds: Iterable<string>, message: ServerMessage): void;
    info(userId: string, text: string): void;
    error(userId: string, text: string): void;
}
