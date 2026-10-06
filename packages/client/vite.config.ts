import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

const serverUrl = process.env.SERVER_URL ?? 'http://localhost:3000';

export default defineConfig({
    plugins: [vue()],
    server: {
        port: 5173,
        proxy: {
            '/api': serverUrl,
            '/ws': { target: serverUrl.replace(/^http/, 'ws'), ws: true },
        },
    },
});
