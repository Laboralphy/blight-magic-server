/**
 * Chat rooms : a user is always in exactly one room, the lobby or the room of the game they play
 */
export const LOBBY_ROOM = 'lobby';

export function gameRoom(gameId: string): string {
    return `game:${gameId}`;
}
