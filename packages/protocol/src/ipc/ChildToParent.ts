import type { ServerMessage } from '../client/ServerMessages';

/**
 * IPC messages sent by a game child process to the main process.
 * Children are trusted (spawned by main), so these are typed but not validated at runtime :
 * game.state snapshots flow at tick rate and must stay cheap to relay.
 */
export type ChildToParent =
    | { type: 'ready' }
    /** deliver a message to one player of this game */
    | { type: 'send'; userId: string; message: ServerMessage }
    /** deliver a message to every player of this game */
    | { type: 'broadcast'; message: ServerMessage }
    /** post a message on this game's chat channel, on behalf of the game */
    | { type: 'chat.post'; text: string }
    | { type: 'error'; text: string };
