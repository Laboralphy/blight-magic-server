import { defineStore } from 'pinia';
import { ref } from 'vue';
import { socket } from '../services/socket';

export type ChatLine =
    | { kind: 'message'; id: number; channel: string; from: string; color: string; text: string }
    | { kind: 'info' | 'error'; id: number; text: string };

/** a chat line before it gets its id (distributes over the union, unlike Omit) */
type NewChatLine = ChatLine extends infer L ? (L extends ChatLine ? Omit<L, 'id'> : never) : never;

const MAX_LINES = 500;

export const useChatStore = defineStore('chat', () => {
    const channel = ref('');
    const lines = ref<ChatLine[]>([]);
    let lastId = 0;

    function push(line: NewChatLine): void {
        lines.value.push({ ...line, id: ++lastId });
        if (lines.value.length > MAX_LINES) {
            lines.value.splice(0, lines.value.length - MAX_LINES);
        }
    }

    function say(text: string): void {
        const trimmed = text.trim();
        if (trimmed) {
            socket.send({ type: 'chat.say', text: trimmed });
        }
    }

    function message(channelId: string, from: string, color: string, text: string): void {
        push({ kind: 'message', channel: channelId, from, color, text });
    }

    function info(text: string): void {
        push({ kind: 'info', text });
    }

    function error(text: string): void {
        push({ kind: 'error', text });
    }

    function enteredChannel(channelId: string): void {
        channel.value = channelId;
        info(`You are now in #${channelId}`);
    }

    function clear(): void {
        lines.value = [];
        channel.value = '';
    }

    return { channel, lines, say, message, info, error, enteredChannel, clear };
});
