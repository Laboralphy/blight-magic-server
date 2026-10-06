/**
 * Chat system, hosted by the main process only.
 * Every user is in exactly one room at a time (the lobby, or a game room) ;
 * joining a room leaves the previous one.
 */
export interface IChatService {
    registerUser(userId: string, name: string): void;
    unregisterUser(userId: string): void;
    /** join a room, creating it if needed */
    joinRoom(userId: string, roomId: string): void;
    /** post a message in the user's current room */
    post(userId: string, text: string): void;
    /** post a message in a room on behalf of the system (or a game) */
    announce(roomId: string, author: string, text: string): void;
    closeRoom(roomId: string): void;
}
