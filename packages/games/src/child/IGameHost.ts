import type { ServerMessage } from '@blight/protocol';

/**
 * What a game can do towards the outside world.
 * In a child process this is backed by the IPC channel to the main process.
 */
export interface IGameHost {
    /** deliver a message to one player */
    send(userId: string, message: ServerMessage): void;
    /** deliver a message to every player of the game */
    broadcast(message: ServerMessage): void;
    /** post a line on the game's chat channel, on behalf of the game */
    postChat(text: string): void;
}
