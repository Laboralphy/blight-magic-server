<script setup lang="ts">
import { useSessionStore } from './stores/sessionStore';
import LoginView from './views/LoginView.vue';
import MainView from './views/MainView.vue';

const session = useSessionStore();
</script>

<template>
    <MainView v-if="session.loggedIn" />
    <LoginView v-else />
</template>
