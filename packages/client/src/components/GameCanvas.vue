<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import type { Direction, GameState } from '@blight/protocol';
import { useGameStore } from '../stores/gameStore';
import { useSessionStore } from '../stores/sessionStore';

const KEYS: Record<string, Direction> = {
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',
    z: 'up',
    w: 'up',
    s: 'down',
    q: 'left',
    a: 'left',
    d: 'right',
};
const SIZE = 512;

const game = useGameStore();
const session = useSessionStore();
const canvas = ref<HTMLCanvasElement | null>(null);

function onKey(event: KeyboardEvent): void {
    const dir = KEYS[event.key];
    if (dir) {
        event.preventDefault();
        game.move(dir);
    }
}

function draw(state: GameState | null): void {
    const ctx = canvas.value?.getContext('2d');
    if (!ctx) {
        return;
    }
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, SIZE, SIZE);
    if (!state) {
        return;
    }
    const cell = SIZE / Math.max(state.arena.width, state.arena.height);
    ctx.strokeStyle = '#3d444d';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, state.arena.width * cell - 2, state.arena.height * cell - 2);
    for (const player of state.players) {
        const cx = (player.x + 0.5) * cell;
        const cy = (player.y + 0.5) * cell;
        ctx.fillStyle = player.color;
        ctx.beginPath();
        ctx.arc(cx, cy, cell * 0.6, 0, Math.PI * 2);
        ctx.fill();
        if (player.id === session.userId) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        ctx.fillStyle = '#e6edf3';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(player.name, cx, cy - cell - 4);
    }
}

onMounted(() => {
    draw(game.state);
    canvas.value?.focus();
});
watch(() => game.state, draw);
</script>

<template>
    <canvas
        ref="canvas"
        class="game-canvas"
        :width="SIZE"
        :height="SIZE"
        tabindex="0"
        title="Click here, then use the arrow keys"
        @keydown="onKey"
    />
    <p class="hint">Click the arena, then move with the arrow keys (or ZQSD / WASD).</p>
</template>

<style scoped>
.game-canvas {
    width: 100%;
    max-width: 512px;
    aspect-ratio: 1;
    border-radius: 6px;
    outline: none;
    border: 2px solid var(--border);
}
.game-canvas:focus {
    border-color: var(--accent);
}
.hint {
    margin: 0;
    color: var(--muted);
}
</style>
