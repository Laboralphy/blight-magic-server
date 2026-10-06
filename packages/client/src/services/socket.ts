import { SocketClient } from './SocketClient';

/**
 * The application's single connection to the main process (proxied by Vite in development)
 */
export const socket = new SocketClient(
    () => `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`
);
