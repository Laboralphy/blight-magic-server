import type { ILogger } from '../../application/ports/ILogger';

export class ConsoleLogger implements ILogger {
    info(message: string): void {
        console.log(`[${new Date().toISOString()}] ${message}`);
    }

    error(message: string, error?: unknown): void {
        console.error(`[${new Date().toISOString()}] ERROR ${message}`, error ?? '');
    }
}
