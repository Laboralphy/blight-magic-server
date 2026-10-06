import { beforeEach, describe, expect, it } from 'vitest';
import { TxatChatService } from '../src/infrastructure/chat/TxatChatService';
import { FakeClientNotifier } from './helpers/FakeClientNotifier';

describe('TxatChatService', () => {
    let notifier: FakeClientNotifier;
    let chat: TxatChatService;

    beforeEach(() => {
        notifier = new FakeClientNotifier();
        chat = new TxatChatService({ clientNotifier: notifier, clock: { now: () => 1 } });
        chat.registerUser('u1', 'alice');
        chat.registerUser('u2', 'bob');
        chat.joinRoom('u1', 'lobby');
        chat.joinRoom('u2', 'lobby');
    });

    it('tells a user which room it joined, and the others who arrived', () => {
        expect(notifier.to('u1')).toContainEqual({ type: 'chat.channel', channel: 'lobby' });
        expect(notifier.to('u1')).toContainEqual({
            type: 'chat.presence',
            channel: 'lobby',
            name: 'bob',
            event: 'joined',
        });
    });

    it('delivers a message to everyone in the room', () => {
        chat.post('u1', 'hi');
        for (const userId of ['u1', 'u2']) {
            expect(notifier.to(userId).at(-1)).toMatchObject({
                type: 'chat.message',
                channel: 'lobby',
                from: { id: 'u1', name: 'alice' },
                text: 'hi',
            });
        }
    });

    it('keeps a user in a single room : joining a game room leaves the lobby', () => {
        chat.joinRoom('u1', 'game:1');
        expect(notifier.to('u2')).toContainEqual({
            type: 'chat.presence',
            channel: 'lobby',
            name: 'alice',
            event: 'left',
        });
        notifier.messages.length = 0;
        chat.post('u1', 'in game');
        expect(notifier.to('u2')).toEqual([]);
        expect(notifier.to('u1')).toHaveLength(1);
    });

    it('announces on behalf of a game to the room members only', () => {
        chat.joinRoom('u1', 'game:1');
        notifier.messages.length = 0;
        chat.announce('game:1', 'arena', 'alice enters the arena.');
        expect(notifier.messages).toEqual([
            {
                userId: 'u1',
                message: {
                    type: 'chat.message',
                    channel: 'game:1',
                    from: { id: '', name: 'arena', color: '#9aa0a6' },
                    text: 'alice enters the arena.',
                    ts: 1,
                },
            },
        ]);
    });

    it('forgets unregistered users', () => {
        chat.unregisterUser('u1');
        expect(() => chat.post('u1', 'ghost')).toThrow('You are not in a chat room');
    });
});
