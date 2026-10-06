<script setup lang="ts">
import { useGameStore } from '../stores/gameStore';
import { useSessionStore } from '../stores/sessionStore';
import ChatPanel from '../components/ChatPanel.vue';
import GameCanvas from '../components/GameCanvas.vue';

const session = useSessionStore();
const game = useGameStore();
</script>

<template>
    <div class="main">
        <section class="stage">
            <header>
                <strong>{{ session.name }}</strong>
                <span v-if="game.current">
                    — game {{ game.current.id }} « {{ game.current.name }} » ({{
                        game.current.type
                    }})
                </span>
                <span v-else> — lobby</span>
            </header>
            <GameCanvas v-if="game.current" />
            <div v-else class="lobby">
                <p>You are in the lobby.</p>
                <p>
                    Type <code>/create dot arena</code> to start a game, <code>/list</code> to see
                    running games, <code>/help</code> for all commands.
                </p>
            </div>
        </section>
        <ChatPanel class="chat" />
    </div>
</template>

<style scoped>
.main {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(280px, 400px);
    gap: 16px;
    height: 100vh;
    padding: 16px;
    box-sizing: border-box;
}
.stage {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-height: 0;
}
.lobby {
    color: var(--muted);
}
@media (max-width: 720px) {
    .main {
        grid-template-columns: 1fr;
        grid-template-rows: auto minmax(240px, 1fr);
        height: auto;
        min-height: 100vh;
    }
}
</style>
