import type { ServerMessage } from '@blight/protocol';
import type { IGameHost } from '../src/child/IGameHost';

export class FakeGameHost implements IGameHost {
    readonly sent: { userId: string; message: ServerMessage }[] = [];
    readonly broadcasts: ServerMessage[] = [];
    readonly chat: string[] = [];

    send(userId: string, message: ServerMessage): void {
        this.sent.push({ userId, message });
    }

    broadcast(message: ServerMessage): void {
        this.broadcasts.push(message);
    }

    postChat(text: string): void {
        this.chat.push(text);
    }

    lastState() {
        const last = this.broadcasts.at(-1);
        if (last?.type !== 'game.state') {
            throw new Error('no game.state broadcast');
        }
        return last.state;
    }
}
