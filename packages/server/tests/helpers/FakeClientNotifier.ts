import type { ServerMessage } from '@blight/protocol';
import type { IClientNotifier } from '../../src/application/ports/IClientNotifier';

export class FakeClientNotifier implements IClientNotifier {
    readonly messages: { userId: string; message: ServerMessage }[] = [];

    send(userId: string, message: ServerMessage): void {
        this.messages.push({ userId, message });
    }

    sendMany(userIds: Iterable<string>, message: ServerMessage): void {
        for (const userId of userIds) {
            this.send(userId, message);
        }
    }

    info(userId: string, text: string): void {
        this.send(userId, { type: 'system.info', text });
    }

    error(userId: string, text: string): void {
        this.send(userId, { type: 'system.error', text });
    }

    to(userId: string): ServerMessage[] {
        return this.messages.filter((m) => m.userId === userId).map((m) => m.message);
    }
}
