import { System, TXAT_ERRORS, TXAT_EVENTS, TxatError } from '@laboralphy/o876-txat';
import type { IChatService } from '../../application/ports/IChatService';
import type { IClientNotifier } from '../../application/ports/IClientNotifier';
import type { IClock } from '../../application/ports/IClock';
import { LOBBY_ROOM } from '../../domain/entities/Rooms';
import { DomainError } from '../../domain/errors/DomainError';

export type TxatChatServiceDeps = {
    clientNotifier: IClientNotifier;
    clock: IClock;
};

/**
 * Chat backed by @laboralphy/o876-txat.
 * Rooms share the same txat tag, so joining a room automatically leaves the previous one.
 */
export class TxatChatService implements IChatService {
    private static readonly ROOM_TAG = 'room';
    private static readonly ANNOUNCE_COLOR = '#9aa0a6';
    private readonly deps: TxatChatServiceDeps;
    private readonly system = new System();

    constructor({ clientNotifier, clock }: TxatChatServiceDeps) {
        this.deps = { clientNotifier, clock };
        this.system.addChannel(LOBBY_ROOM, { tag: TxatChatService.ROOM_TAG, persistent: true });
        this.forwardEvents();
    }

    registerUser(userId: string, name: string): void {
        this.system.registerUser(userId, name);
    }

    unregisterUser(userId: string): void {
        if (this.system.isUserRegistered(userId)) {
            this.system.unregisterUser(userId);
        }
    }

    joinRoom(userId: string, roomId: string): void {
        if (!this.system.isChannelExists(roomId)) {
            this.system.addChannel(roomId, { tag: TxatChatService.ROOM_TAG });
        }
        if (!this.system.getChannel(roomId).getUser(userId)) {
            this.system.userJoinChannel(userId, roomId);
        }
    }

    post(userId: string, text: string): void {
        const room = this.currentRoom(userId);
        if (room === undefined) {
            throw DomainError.invalid('You are not in a chat room');
        }
        try {
            this.system.postMessage(userId, room, text);
        } catch (e) {
            if (e instanceof TxatError && e.code === TXAT_ERRORS.WRITE_DENIED) {
                throw DomainError.invalid('You may not write in this room');
            }
            throw e;
        }
    }

    announce(roomId: string, author: string, text: string): void {
        if (!this.system.isChannelExists(roomId)) {
            return;
        }
        const recipients = this.system.getChannel(roomId).users.map((presence) => presence.id);
        this.deps.clientNotifier.sendMany(recipients, {
            type: 'chat.message',
            channel: roomId,
            from: { id: '', name: author, color: TxatChatService.ANNOUNCE_COLOR },
            text,
            ts: this.deps.clock.now(),
        });
    }

    closeRoom(roomId: string): void {
        if (roomId !== LOBBY_ROOM && this.system.isChannelExists(roomId)) {
            this.system.removeChannel(roomId);
        }
    }

    private currentRoom(userId: string): string | undefined {
        if (!this.system.isUserRegistered(userId)) {
            return undefined;
        }
        for (const channel of this.system.getUser(userId).joinedChannels) {
            if (channel.tag === TxatChatService.ROOM_TAG) {
                return channel.id;
            }
        }
        return undefined;
    }

    /**
     * txat emits one event per recipient : each one becomes a message to that client
     */
    private forwardEvents(): void {
        const { clientNotifier } = this.deps;
        const events = this.system.events;
        events.on(TXAT_EVENTS.MESSAGE_POST, ({ recv, idChannel, user, message }) =>
            clientNotifier.send(recv, {
                type: 'chat.message',
                channel: idChannel,
                from: { id: user.id, name: user.name, color: user.color },
                text: message.content,
                ts: message.ts,
            })
        );
        events.on(TXAT_EVENTS.YOU_JOINED, ({ recv, idChannel }) =>
            clientNotifier.send(recv, { type: 'chat.channel', channel: idChannel })
        );
        events.on(TXAT_EVENTS.USER_JOINED, ({ recv, idChannel, user }) => {
            if (recv !== user.id) {
                clientNotifier.send(recv, {
                    type: 'chat.presence',
                    channel: idChannel,
                    name: user.name,
                    event: 'joined',
                });
            }
        });
        events.on(TXAT_EVENTS.USER_LEFT, ({ recv, idChannel, user }) => {
            if (recv !== user.id) {
                clientNotifier.send(recv, {
                    type: 'chat.presence',
                    channel: idChannel,
                    name: user.name,
                    event: 'left',
                });
            }
        });
    }
}
