import { beforeEach, describe, expect, it } from 'vitest';
import { DotGame } from '../src/child/dot/DotGame';
import { FakeGameHost } from './FakeGameHost';

describe('DotGame', () => {
    let host: FakeGameHost;
    let game: DotGame;

    beforeEach(() => {
        host = new FakeGameHost();
        // random() = 0.5 → spawn at the middle of a 10x10 arena
        game = new DotGame('g1', host, {
            arena: { width: 10, height: 10 },
            inputsPerTick: 2,
            random: () => 0.5,
        });
    });

    it('broadcasts the new player and announces it on chat', () => {
        game.addPlayer('u1', 'alice');
        game.step();
        expect(host.chat).toEqual(['alice enters the arena.']);
        expect(host.lastState().players).toEqual([
            { id: 'u1', name: 'alice', color: 'hsl(180, 80%, 55%)', x: 5, y: 5, ackSeq: -1 },
        ]);
    });

    it('applies inputs and acknowledges their sequence number', () => {
        game.addPlayer('u1', 'alice');
        game.handleInput('u1', 0, 'right');
        game.handleInput('u1', 1, 'up');
        game.step();
        expect(host.lastState().players[0]).toMatchObject({ x: 6, y: 4, ackSeq: 1 });
    });

    it('applies at most inputsPerTick inputs per tick', () => {
        game.addPlayer('u1', 'alice');
        for (let seq = 0; seq < 3; ++seq) {
            game.handleInput('u1', seq, 'left');
        }
        game.step();
        expect(host.lastState().players[0]).toMatchObject({ x: 3, ackSeq: 1 });
        game.step();
        expect(host.lastState().players[0]).toMatchObject({ x: 2, ackSeq: 2 });
    });

    it('ignores replayed sequence numbers', () => {
        game.addPlayer('u1', 'alice');
        game.handleInput('u1', 0, 'left');
        game.step();
        game.handleInput('u1', 0, 'left');
        game.step();
        expect(host.lastState().players[0]).toMatchObject({ x: 4 });
    });

    it('clamps players to the arena', () => {
        game.addPlayer('u1', 'alice');
        for (let seq = 0; seq < 10; ++seq) {
            game.handleInput('u1', seq, 'down');
            game.step();
        }
        expect(host.lastState().players[0]).toMatchObject({ y: 9 });
    });

    it('does not broadcast when nothing changed', () => {
        game.addPlayer('u1', 'alice');
        game.step();
        game.step();
        game.step();
        expect(host.broadcasts).toHaveLength(1);
    });

    it('removes a player', () => {
        game.addPlayer('u1', 'alice');
        game.removePlayer('u1');
        game.step();
        expect(host.lastState().players).toEqual([]);
        expect(host.chat.at(-1)).toBe('alice leaves the arena.');
    });
});
