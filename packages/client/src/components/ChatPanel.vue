<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';
import { useChatStore } from '../stores/chatStore';

const chat = useChatStore();
const text = ref('');
const log = ref<HTMLElement | null>(null);

function submit(): void {
    chat.say(text.value);
    text.value = '';
}

watch(
    () => chat.lines.length,
    async () => {
        await nextTick();
        log.value?.scrollTo({ top: log.value.scrollHeight });
    }
);
</script>

<template>
    <aside class="chat-panel">
        <div class="channel">#{{ chat.channel }}</div>
        <ol ref="log" class="log">
            <li v-for="line in chat.lines" :key="line.id" :class="line.kind">
                <template v-if="line.kind === 'message'">
                    <span class="from" :style="{ color: line.color }">{{ line.from }}</span>
                    {{ line.text }}
                </template>
                <template v-else>{{ line.text }}</template>
            </li>
        </ol>
        <form @submit.prevent="submit">
            <input
                v-model="text"
                autocomplete="off"
                maxlength="500"
                placeholder="Say something, or /help"
            />
        </form>
    </aside>
</template>

<style scoped>
.chat-panel {
    display: flex;
    flex-direction: column;
    min-height: 0;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: var(--panel);
}
.channel {
    padding: 6px 10px;
    border-bottom: 1px solid var(--border);
    color: var(--muted);
}
.log {
    flex: 1;
    overflow-y: auto;
    margin: 0;
    padding: 8px 10px;
    list-style: none;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
}
.from {
    font-weight: bold;
    margin-right: 4px;
}
.info {
    color: var(--muted);
}
.error {
    color: var(--error);
}
form {
    padding: 8px;
    border-top: 1px solid var(--border);
}
input {
    width: 100%;
    box-sizing: border-box;
}
</style>
