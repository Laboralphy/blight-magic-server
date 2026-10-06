import http from 'node:http';
import type { AddressInfo } from 'node:net';
import type { AwilixContainer } from 'awilix';
import { buildContainer, type Cradle } from './container';
import type { BootSettings } from './settings';

/**
 * The main process : HTTP + WebSocket server, chat, and game child processes management
 */
export class Application {
    private container: AwilixContainer<Cradle> | undefined;
    private httpServer: http.Server | undefined;

    constructor(private readonly settings: BootSettings) {}

    async start(): Promise<AddressInfo> {
        const container = buildContainer(this.settings);
        this.container = container;
        const httpServer = http.createServer(container.resolve('koaApp').callback());
        this.httpServer = httpServer;
        container.resolve('webSocketGateway').attach(httpServer);
        container.resolve('gameEventBridge').start();

        await new Promise<void>((resolve, reject) => {
            httpServer.once('error', reject);
            httpServer.listen(this.settings.port, this.settings.host, () => resolve());
        });
        const address = httpServer.address() as AddressInfo;
        container
            .resolve('logger')
            .info(`main process ${process.pid} listening on ${address.address}:${address.port}`);
        return address;
    }

    async stop(): Promise<void> {
        const container = this.container;
        if (!container) {
            return;
        }
        await container.resolve('webSocketGateway').close();
        await container.resolve('gameProcessManager').shutdownAll();
        await new Promise<void>((resolve) => this.httpServer?.close(() => resolve()));
        await container.dispose();
        this.container = undefined;
    }
}
