import { describe, expect, it } from 'vitest';
import { ClientMessageSchema, ParentToChildSchema, ServerMessageSchema } from '../src';

describe('ClientMessageSchema', () => {
    it('accepts a valid login and trims the name', () => {
        const msg = ClientMessageSchema.parse({ type: 'auth.login', name: '  alice ' });
        expect(msg).toEqual({ type: 'auth.login', name: 'alice' });
    });

    it('rejects names with forbidden characters', () => {
        expect(ClientMessageSchema.safeParse({ type: 'auth.login', name: 'a b' }).success).toBe(
            false
        );
    });

    it('rejects unknown directions and unknown types', () => {
        expect(
            ClientMessageSchema.safeParse({ type: 'game.input', seq: 1, dir: 'jump' }).success
        ).toBe(false);
        expect(ClientMessageSchema.safeParse({ type: 'nope' }).success).toBe(false);
    });
});

describe('ServerMessageSchema', () => {
    it('round-trips a game state through JSON', () => {
        const msg = {
            type: 'game.state' as const,
            state: {
                gameId: 'g1',
                tick: 3,
                arena: { width: 64, height: 64 },
                players: [{ id: 'u1', name: 'alice', color: '#f00', x: 1, y: 2, ackSeq: 7 }],
            },
        };
        expect(ServerMessageSchema.parse(JSON.parse(JSON.stringify(msg)))).toEqual(msg);
    });
});

describe('ParentToChildSchema', () => {
    it('accepts a player input', () => {
        const msg = { type: 'player.input', userId: 'u1', seq: 0, dir: 'up' };
        expect(ParentToChildSchema.parse(msg)).toEqual(msg);
    });
});
