import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Direction, GameState, GameSummary } from '@blight/protocol';
import { socket } from '../services/socket';

export const useGameStore = defineStore('game', () => {
    const current = ref<GameSummary | null>(null);
    const state = ref<GameState | null>(null);
    let nextSeq = 0;

    function joined(game: GameSummary): void {
        current.value = game;
        state.value = null;
        nextSeq = 0;
    }

    function left(gameId: string): void {
        if (current.value?.id === gameId) {
            current.value = null;
            state.value = null;
        }
    }

    function stateReceived(newState: GameState): void {
        if (current.value?.id === newState.gameId) {
            state.value = newState;
        }
    }

    /**
     * Send a move ; the sequence number lets the server acknowledge it (ackSeq),
     * which client-side prediction will rely on.
     */
    function move(dir: Direction): void {
        if (current.value) {
            socket.send({ type: 'game.input', seq: nextSeq++, dir });
        }
    }

    function reset(): void {
        current.value = null;
        state.value = null;
    }

    return { current, state, joined, left, stateReceived, move, reset };
});
