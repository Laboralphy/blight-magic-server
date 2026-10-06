<script setup lang="ts">
import { ref } from 'vue';
import { useSessionStore } from '../stores/sessionStore';

const session = useSessionStore();
const name = ref(session.name);

function submit(): void {
    if (name.value.trim()) {
        session.login(name.value.trim());
    }
}
</script>

<template>
    <main class="login">
        <h1>Blight Magic</h1>
        <form @submit.prevent="submit">
            <label for="login-name">Your name</label>
            <input
                id="login-name"
                v-model="name"
                autofocus
                autocomplete="off"
                maxlength="20"
                placeholder="letters, digits, _ and -"
            />
            <button type="submit" :disabled="session.pending || !name.trim()">Enter</button>
        </form>
        <p v-if="session.error" class="error">{{ session.error }}</p>
    </main>
</template>

<style scoped>
.login {
    max-width: 320px;
    margin: 15vh auto 0;
    padding: 0 16px;
}
form {
    display: flex;
    flex-direction: column;
    gap: 8px;
}
.error {
    color: var(--error);
    white-space: pre-line;
}
</style>
