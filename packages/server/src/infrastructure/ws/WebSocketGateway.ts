import type { Server } from 'node:http';
import { type WebSocket, WebSocketServer } from 'ws';
import type { IIdGenerator } from '../../application/ports/IIdGenerator';
import type { ILogger } from '../../application/ports/ILogger';
import type { ConnectionRegistry } from './ConnectionRegistry';
import type { ConnectionScopeFactory } from './ConnectionScopeFactory';

export type WebSocketGatewayDeps = {
    connectionRegistry: ConnectionRegistry;
    connectionScopeFactory: ConnectionScopeFactory;
    idGenerator: IIdGenerator;
    logger: ILogger;
};

/**
 * The single WebSocket entry point of the server : every client connects here,
 * including clients playing in a game child process (gateway relay model).
 */
export class WebSocketGateway {
    /**
     * Largest client message accepted ; beyond it, ws closes the connection with code 1009.
     * The biggest legitimate message is a 500-character chat line.
     */
    private static readonly MAX_PAYLOAD = 64 * 1024;
    private readonly deps: WebSocketGatewayDeps;
    private server: WebSocketServer | undefined;

    constructor({
        connectionRegistry,
        connectionScopeFactory,
        idGenerator,
        logger,
    }: WebSocketGatewayDeps) {
        this.deps = { connectionRegistry, connectionScopeFactory, idGenerator, logger };
    }

    attach(httpServer: Server, path = '/ws'): void {
        this.server = new WebSocketServer({
            server: httpServer,
            path,
            maxPayload: WebSocketGateway.MAX_PAYLOAD,
        });
        this.server.on('connection', (socket) => this.onConnection(socket));
    }

    async close(): Promise<void> {
        const server = this.server;
        if (!server) {
            return;
        }
        for (const client of server.clients) {
            client.terminate();
        }
        await new Promise<void>((resolve) => server.close(() => resolve()));
    }

    private onConnection(socket: WebSocket): void {
        const { connectionRegistry, connectionScopeFactory, idGenerator, logger } = this.deps;
        const sessionId = idGenerator.generate();
        const scope = connectionScopeFactory(sessionId);
        connectionRegistry.bind(sessionId, socket);

        // Messages of one connection are handled strictly in order, even if a handler is async
        let queue = Promise.resolve();
        const enqueue = (task: () => Promise<void>) => {
            queue = queue.then(task).catch((e: unknown) => logger.error('connection task', e));
        };

        socket.on('message', (data) => enqueue(() => scope.handler.handleMessage(String(data))));
        socket.on('error', (e) => logger.error(`socket ${sessionId}`, e));
        socket.on('close', () =>
            enqueue(async () => {
                await scope.handler.handleClose();
                connectionRegistry.unbind(sessionId);
                await scope.dispose();
            })
        );
    }
}
