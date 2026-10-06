import path from 'node:path';

export type BootSettings = {
    port: number;
    host: string;
    clientDist: string;
    /** how long a game child process may take to announce it is ready */
    gameReadyTimeoutMs: number;
};

/** Reads the environment once, at boot. Nothing below this file sees `process.env`. */
export function readSettings(env: NodeJS.ProcessEnv = process.env): BootSettings {
    return {
        port: Number.parseInt(env.PORT ?? '3000', 10),
        host: env.HOST ?? '0.0.0.0',
        clientDist: path.resolve(
            env.CLIENT_DIST ?? path.join(import.meta.dirname, '../../../client/dist')
        ),
        gameReadyTimeoutMs: Number.parseInt(env.GAME_READY_TIMEOUT_MS ?? '10000', 10),
    };
}
