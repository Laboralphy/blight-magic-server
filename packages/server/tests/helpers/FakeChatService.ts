import type { IChatService } from '../../src/application/ports/IChatService';

export class FakeChatService implements IChatService {
    readonly rooms = new Map<string, string>();
    readonly registered = new Map<string, string>();
    readonly posts: { userId: string; text: string }[] = [];
    readonly announcements: { roomId: string; author: string; text: string }[] = [];
    readonly closedRooms: string[] = [];

    registerUser(userId: string, name: string): void {
        this.registered.set(userId, name);
    }

    unregisterUser(userId: string): void {
        this.registered.delete(userId);
        this.rooms.delete(userId);
    }

    joinRoom(userId: string, roomId: string): void {
        this.rooms.set(userId, roomId);
    }

    post(userId: string, text: string): void {
        this.posts.push({ userId, text });
    }

    announce(roomId: string, author: string, text: string): void {
        this.announcements.push({ roomId, author, text });
    }

    closeRoom(roomId: string): void {
        this.closedRooms.push(roomId);
    }
}
