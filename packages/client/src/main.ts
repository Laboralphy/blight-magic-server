import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { socket } from './services/socket';
import { ServerEventDispatcher } from './services/ServerEventDispatcher';
import { useSessionStore } from './stores/sessionStore';
import { useChatStore } from './stores/chatStore';
import { useGameStore } from './stores/gameStore';
import './style.css';

const app = createApp(App);
app.use(createPinia());
new ServerEventDispatcher(useSessionStore(), useChatStore(), useGameStore()).bind(socket);
app.mount('#app');
