import { Application } from './boot/Application';
import { readSettings } from './boot/settings';

const app = new Application(readSettings());
await app.start();

let stopping = false;
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.on(signal, () => {
        if (stopping) {
            return;
        }
        stopping = true;
        console.log(`${signal} received, shutting down game processes…`);
        app.stop().then(
            () => process.exit(0),
            (e: unknown) => {
                console.error(e);
                process.exit(1);
            }
        );
    });
}
