import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Application } from '../src/boot/Application';
import { readSettings } from '../src/boot/settings';
import { TestClient } from './helpers/TestClient';

/**
 * Whole system : HTTP + WebSocket main process, real game child processes
 */
describe('end to end', () => {
    const app = new Application({ ...readSettings({}), port: 0, host: '127.0.0.1' });
    let base = '';
    let url = '';
    const clients: TestClient[] = [];

    async function login(name: string): Promise<TestClient> {
        const client = await TestClient.connect(url);
        clients.push(client);
        client.send({ type: 'auth.login', name });
        await client.expect('auth.welcome');
        await client.expect('chat.channel', (m) => m.channel === 'lobby');
        return client;
    }

    beforeAll(async () => {
        const address = await app.start();
        base = `http://127.0.0.1:${address.port}`;
        url = `ws://127.0.0.1:${address.port}/ws`;
    });

    afterAll(async () => {
        clients.forEach((c) => c.close());
        await app.stop();
    });

    it('serves the health endpoint', async () => {
        const response = await fetch(`${base}/api/health`);
        expect(await response.json()).toEqual({ status: 'ok' });
    });

    it('refuses chat before login and duplicate names', async () => {
        const anonymous = await TestClient.connect(url);
        clients.push(anonymous);
        anonymous.say('hello');
        expect((await anonymous.expect('system.error')).text).toBe('Please log in first');

        await login('carol');
        anonymous.send({ type: 'auth.login', name: 'Carol' });
        expect((await anonymous.expect('auth.error')).reason).toContain('already exists');
    });

    it('chats, creates, joins, plays and leaves a game', async () => {
        const alice = await login('alice');
        const bob = await login('bob');

        alice.say('hi bob');
        const chat = await bob.expect('chat.message', (m) => m.text === 'hi bob');
        expect(chat.from.name).toBe('alice');

        alice.say('/create dot arena');
        const joined = await alice.expect('game.joined');
        expect(joined.game).toMatchObject({ name: 'arena', type: 'dot', players: 1 });
        const gameId = joined.game.id;
        await alice.expect('chat.channel', (m) => m.channel === `game:${gameId}`);
        await alice.expect('game.state', (m) => m.state.players.length === 1);

        const games = (await (await fetch(`${base}/api/games`)).json()) as unknown[];
        expect(games).toEqual([{ id: gameId, name: 'arena', type: 'dot', players: 1 }]);

        bob.say(`/join ${gameId}`);
        await bob.expect('game.joined', (m) => m.game.id === gameId);
        // the game announces arrivals on its own chat room, through the main process
        await alice.expect('chat.message', (m) => m.text === 'bob enters the arena.');
        const both = await alice.expect('game.state', (m) => m.state.players.length === 2);

        const bobBefore = both.state.players.find((p) => p.name === 'bob')!;
        bob.send({ type: 'game.input', seq: 0, dir: bobBefore.x > 0 ? 'left' : 'right' });
        // alice sees bob move : input went bob → main → child → main → alice
        const moved = await alice.expect('game.state', (m) =>
            m.state.players.some((p) => p.name === 'bob' && p.ackSeq === 0)
        );
        const bobAfter = moved.state.players.find((p) => p.name === 'bob')!;
        expect(Math.abs(bobAfter.x - bobBefore.x)).toBe(1);

        bob.say('/leave');
        await bob.expect('game.left', (m) => m.gameId === gameId);
        await bob.expect('chat.channel', (m) => m.channel === 'lobby');
        await alice.expect('game.state', (m) => m.state.players.length === 1);

        bob.say('/list');
        const list = await bob.expect('system.info', (m) => m.text.startsWith('Games:'));
        expect(list.text).toContain(`[${gameId}] arena (dot) — 1 player(s)`);
    });
});
