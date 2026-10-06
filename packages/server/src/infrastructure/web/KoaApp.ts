import fs from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import Koa from 'koa';
import { Router } from '@koa/router';
import serve from 'koa-static';
import type { ListGames } from '../../application/use-cases/games/ListGames';
import type { WebSettings } from './WebSettings';

export type KoaAppDeps = {
    listGames: ListGames;
    webSettings: WebSettings;
};

/**
 * HTTP side : a tiny JSON API, plus the built client in production
 * (in development, the Vite dev server serves the client and proxies /api and /ws here)
 */
export class KoaApp {
    private readonly app = new Koa();

    constructor({ listGames, webSettings }: KoaAppDeps) {
        const router = new Router({ prefix: '/api' });
        router.get('/health', (ctx) => {
            ctx.body = { status: 'ok' };
        });
        router.get('/games', (ctx) => {
            ctx.body = listGames.execute();
        });
        this.app.use(router.routes()).use(router.allowedMethods());
        if (fs.existsSync(webSettings.clientDist)) {
            this.app.use(serve(webSettings.clientDist));
        }
    }

    callback(): (req: IncomingMessage, res: ServerResponse) => Promise<void> {
        return this.app.callback();
    }
}
