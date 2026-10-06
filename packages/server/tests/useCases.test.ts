import { beforeEach, describe, expect, it } from 'vitest';
import { DomainError } from '../src/domain/errors/DomainError';
import { Fixture } from './helpers/Fixture';

describe('use cases', () => {
    let f: Fixture;

    beforeEach(async () => {
        f = new Fixture();
        await f.loginUser.execute('u1', 'alice');
        await f.loginUser.execute('u2', 'bob');
    });

    describe('LoginUser', () => {
        it('welcomes the user and puts it in the lobby', () => {
            expect(f.clientNotifier.to('u1')[0]).toEqual({
                type: 'auth.welcome',
                userId: 'u1',
                name: 'alice',
            });
            expect(f.chatService.rooms.get('u1')).toBe('lobby');
        });

        it('rejects a name already in use, case-insensitively', async () => {
            await expect(f.loginUser.execute('u3', 'ALICE')).rejects.toMatchObject({
                code: 'ALREADY_EXISTS',
            });
        });
    });

    describe('CreateGame / JoinGame / LeaveGame', () => {
        it('creates a game and puts its creator in it', async () => {
            const game = await f.createGame.execute('u1', 'dot', 'arena');
            expect(f.gameProcessManager.findGameOfPlayer('u1')).toBe(game.id);
            expect(f.chatService.rooms.get('u1')).toBe(`game:${game.id}`);
            expect(f.clientNotifier.to('u1').at(-1)).toEqual({
                type: 'game.joined',
                game: { id: game.id, name: 'arena', type: 'dot', players: 1 },
            });
        });

        it('leaves the previous game when joining another one', async () => {
            const a = await f.createGame.execute('u1', 'dot', 'a');
            const b = await f.createGame.execute('u2', 'dot', 'b');
            await f.joinGame.execute('u1', b.id);
            expect(f.gameProcessManager.playerIds(a.id)).toEqual([]);
            expect(f.gameProcessManager.playerIds(b.id)).toEqual(['u2', 'u1']);
            expect(f.clientNotifier.to('u1')).toContainEqual({
                type: 'game.left',
                gameId: a.id,
                reason: 'joined another game',
            });
        });

        it('refuses unknown games and joining twice', async () => {
            await expect(f.joinGame.execute('u1', '42')).rejects.toMatchObject({
                code: 'NOT_FOUND',
            });
            const game = await f.createGame.execute('u1', 'dot', 'a');
            await expect(f.joinGame.execute('u1', game.id)).rejects.toBeInstanceOf(DomainError);
        });

        it('sends a leaving player back to the lobby', async () => {
            const game = await f.createGame.execute('u1', 'dot', 'a');
            f.leaveGame.execute('u1');
            expect(f.gameProcessManager.playerIds(game.id)).toEqual([]);
            expect(f.chatService.rooms.get('u1')).toBe('lobby');
            expect(() => f.leaveGame.execute('u1')).toThrow('You are not in a game');
        });
    });

    describe('LogoutUser', () => {
        it('removes the user from its game, the chat and the repository', async () => {
            const game = await f.createGame.execute('u1', 'dot', 'a');
            await f.logoutUser.execute('u1');
            expect(f.gameProcessManager.playerIds(game.id)).toEqual([]);
            expect(f.chatService.registered.has('u1')).toBe(false);
            expect(await f.userRepository.findById('u1')).toBeUndefined();
            // the name is free again
            await f.loginUser.execute('u3', 'alice');
        });
    });

    describe('relaying game traffic', () => {
        it('forwards inputs only for players in a game', async () => {
            f.relayGameInput.execute('u1', 0, 'up');
            expect(f.gameProcessManager.inputs).toEqual([]);
            const game = await f.createGame.execute('u1', 'dot', 'a');
            f.relayGameInput.execute('u1', 1, 'up');
            expect(f.gameProcessManager.inputs).toEqual([
                { gameId: game.id, userId: 'u1', seq: 1, dir: 'up' },
            ]);
        });

        it('broadcasts game output to the players of that game only', async () => {
            const game = await f.createGame.execute('u1', 'dot', 'a');
            const state = {
                type: 'game.state' as const,
                state: { gameId: game.id, tick: 1, arena: { width: 4, height: 4 }, players: [] },
            };
            f.relayGameOutput.execute(game.id, { type: 'broadcast', message: state });
            expect(f.clientNotifier.to('u1').at(-1)).toEqual(state);
            expect(f.clientNotifier.to('u2')).not.toContainEqual(state);
        });

        it('turns game chat posts into announcements in the game room', async () => {
            const game = await f.createGame.execute('u1', 'dot', 'arena');
            f.relayGameOutput.execute(game.id, { type: 'chat.post', text: 'hello' });
            expect(f.chatService.announcements).toEqual([
                { roomId: `game:${game.id}`, author: 'arena', text: 'hello' },
            ]);
        });
    });

    describe('HandleGameExit', () => {
        it('sends players of a crashed game back to the lobby', async () => {
            const game = await f.createGame.execute('u1', 'dot', 'a');
            f.handleGameExit.execute(game.id, ['u1'], null);
            expect(f.chatService.rooms.get('u1')).toBe('lobby');
            expect(f.chatService.closedRooms).toEqual([`game:${game.id}`]);
            expect(f.clientNotifier.to('u1')).toContainEqual({
                type: 'game.left',
                gameId: game.id,
                reason: 'the game process crashed',
            });
        });
    });
});
