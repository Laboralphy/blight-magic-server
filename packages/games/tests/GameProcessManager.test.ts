import { afterEach, describe, expect, it } from 'vitest';
import type { ChildToParent, GameState } from '@blight/protocol';
import { GameProcessLauncher } from '../src/host/GameProcessLauncher';
import { GameProcessManager } from '../src/host/GameProcessManager';

/**
 * Feasibility proof : real child processes, real IPC
 */
describe('GameProcessManager (forks real child processes)', () => {
    const manager = new GameProcessManager(new GameProcessLauncher());

    afterEach(async () => {
        await manager.shutdownAll();
    });

    function nextMessage(
        predicate: (gameId: string, message: ChildToParent) => boolean
    ): Promise<ChildToParent> {
        return new Promise((resolve) => {
            manager.onChildMessage((gameId, message) => {
                if (predicate(gameId, message)) {
                    resolve(message);
                }
            });
        });
    }

    function nextState(gameId: string, accept: (state: GameState) => boolean): Promise<GameState> {
        return nextMessage(
            (id, m) =>
                id === gameId &&
                m.type === 'broadcast' &&
                m.message.type === 'game.state' &&
                accept(m.message.state)
        ).then((m) => (m as { message: { state: GameState } }).message.state);
    }

    it('spawns a game, relays players and inputs, and shuts it down', async () => {
        const game = await manager.create('dot', 'arena');
        expect(manager.list()).toEqual([{ id: game.id, name: 'arena', type: 'dot', players: 0 }]);
        expect(manager.pidOf(game.id)).not.toBe(process.pid);

        const joined = nextState(game.id, (s) => s.players.length === 1);
        const chat = nextMessage((id, m) => id === game.id && m.type === 'chat.post');
        manager.addPlayer(game.id, 'u1', 'alice');
        const first = await joined;
        expect(await chat).toEqual({ type: 'chat.post', text: 'alice enters the arena.' });
        expect(manager.findGameOfPlayer('u1')).toBe(game.id);

        const moved = nextState(game.id, (s) => s.players[0]!.ackSeq === 0);
        manager.sendInput(game.id, 'u1', 0, first.players[0]!.x > 0 ? 'left' : 'right');
        const second = await moved;
        expect(Math.abs(second.players[0]!.x - first.players[0]!.x)).toBe(1);

        await manager.shutdownAll();
        expect(manager.list()).toEqual([]);
    });

    it('reports a crashed game with the players it had', async () => {
        const game = await manager.create('dot', 'doomed');
        manager.addPlayer(game.id, 'u1', 'alice');
        manager.addPlayer(game.id, 'u2', 'bob');
        const exited = new Promise<{ gameId: string; playerIds: string[] }>((resolve) =>
            manager.onGameExit((gameId, playerIds) => resolve({ gameId, playerIds }))
        );
        process.kill(manager.pidOf(game.id)!, 'SIGKILL');
        expect(await exited).toEqual({ gameId: game.id, playerIds: ['u1', 'u2'] });
        expect(manager.get(game.id)).toBeUndefined();
    });

    it('hides a game until its process is ready', async () => {
        const creating = manager.create('dot', 'slow');
        expect(manager.count()).toBe(1);
        expect(manager.list()).toEqual([]);
        const game = await creating;
        expect(manager.list().map((g) => g.id)).toEqual([game.id]);
    });

    it('shuts a game down when its last player leaves', async () => {
        const game = await manager.create('dot', 'short-lived');
        manager.addPlayer(game.id, 'u1', 'alice');
        manager.addPlayer(game.id, 'u2', 'bob');
        const exited = new Promise<{ gameId: string; code: number | null }>((resolve) =>
            manager.onGameExit((gameId, _playerIds, code) => resolve({ gameId, code }))
        );
        manager.removePlayer(game.id, 'u1');
        expect(manager.get(game.id)).toBeDefined();
        manager.removePlayer(game.id, 'u2');
        // closing : already invisible, even before the process is gone
        expect(manager.get(game.id)).toBeUndefined();
        expect(() => manager.addPlayer(game.id, 'u3', 'carol')).toThrow('not running');
        expect(await exited).toEqual({ gameId: game.id, code: 0 });
        expect(manager.count()).toBe(0);
    });

    it('hosts several independent games in separate processes', async () => {
        const a = await manager.create('dot', 'a');
        const b = await manager.create('dot', 'b');
        expect(manager.pidOf(a.id)).not.toBe(manager.pidOf(b.id));
        expect(manager.list().map((g) => g.name)).toEqual(['a', 'b']);
    });
});
