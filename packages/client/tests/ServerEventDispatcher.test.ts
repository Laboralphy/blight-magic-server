import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import type { ServerMessage } from '@blight/protocol';
import type { SocketStatus } from '../src/services/SocketClient';
import {
    type IServerEventSource,
    ServerEventDispatcher,
} from '../src/services/ServerEventDispatcher';
import { useSessionStore } from '../src/stores/sessionStore';
import { useChatStore } from '../src/stores/chatStore';
import { useGameStore } from '../src/stores/gameStore';

class FakeSource implements IServerEventSource {
    private readonly handlers = new Map<string, (message: ServerMessage) => void>();
    private statusListener: (status: SocketStatus) => void = () => {};

    on<T extends ServerMessage['type']>(
        type: T,
        handler: (message: Extract<ServerMessage, { type: T }>) => void
    ): void {
        this.handlers.set(type, handler as (message: ServerMessage) => void);
    }

    onStatus(listener: (status: SocketStatus) => void): void {
        this.statusListener = listener;
    }

    emit(message: ServerMessage): void {
        this.handlers.get(message.type)?.(message);
    }

    status(status: SocketStatus): void {
        this.statusListener(status);
    }
}

describe('ServerEventDispatcher', () => {
    let source: FakeSource;

    beforeEach(() => {
        setActivePinia(createPinia());
        source = new FakeSource();
        new ServerEventDispatcher(useSessionStore(), useChatStore(), useGameStore()).bind(source);
    });

    it('logs the user in on welcome', () => {
        source.emit({ type: 'auth.welcome', userId: 'u1', name: 'alice' });
        expect(useSessionStore().loggedIn).toBe(true);
        expect(useSessionStore().name).toBe('alice');
    });

    it('fills the chat log', () => {
        source.emit({ type: 'chat.channel', channel: 'lobby' });
        source.emit({
            type: 'chat.message',
            channel: 'lobby',
            from: { id: 'u2', name: 'bob', color: 'red' },
            text: 'hi',
            ts: 0,
        });
        const chat = useChatStore();
        expect(chat.channel).toBe('lobby');
        expect(chat.lines.at(-1)).toMatchObject({ kind: 'message', from: 'bob', text: 'hi' });
    });

    it('tracks the current game and ignores states of other games', () => {
        const game = useGameStore();
        source.emit({ type: 'game.joined', game: { id: '1', name: 'a', type: 'dot', players: 1 } });
        const state = { gameId: '1', tick: 1, arena: { width: 4, height: 4 }, players: [] };
        source.emit({ type: 'game.state', state });
        source.emit({ type: 'game.state', state: { ...state, gameId: '2', tick: 9 } });
        expect(game.state).toEqual(state);
        source.emit({ type: 'game.left', gameId: '1', reason: 'left' });
        expect(game.current).toBeNull();
    });

    it('logs the user out when the socket closes', () => {
        source.emit({ type: 'auth.welcome', userId: 'u1', name: 'alice' });
        source.emit({ type: 'game.joined', game: { id: '1', name: 'a', type: 'dot', players: 1 } });
        source.status('closed');
        expect(useSessionStore().loggedIn).toBe(false);
        expect(useSessionStore().error).toBe('Disconnected from the server');
        expect(useGameStore().current).toBeNull();
    });
});
