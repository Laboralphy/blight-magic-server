import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { SocketStatus } from '../services/SocketClient';
import { socket } from '../services/socket';

export const useSessionStore = defineStore('session', () => {
    const status = ref<SocketStatus>('closed');
    const userId = ref<string | null>(null);
    const name = ref('');
    const error = ref('');
    const pending = ref(false);

    const loggedIn = computed(() => userId.value !== null);

    async function login(loginName: string): Promise<void> {
        error.value = '';
        pending.value = true;
        try {
            if (status.value !== 'open') {
                await socket.connect();
            }
            socket.send({ type: 'auth.login', name: loginName });
        } catch (e) {
            error.value = e instanceof Error ? e.message : String(e);
            pending.value = false;
        }
    }

    function welcomed(id: string, loginName: string): void {
        userId.value = id;
        name.value = loginName;
        pending.value = false;
    }

    function rejected(reason: string): void {
        error.value = reason;
        pending.value = false;
    }

    function statusChanged(newStatus: SocketStatus): void {
        status.value = newStatus;
        if (newStatus === 'closed') {
            if (userId.value !== null) {
                error.value = 'Disconnected from the server';
            }
            userId.value = null;
            pending.value = false;
        }
    }

    return {
        status,
        userId,
        name,
        error,
        pending,
        loggedIn,
        login,
        welcomed,
        rejected,
        statusChanged,
    };
});
