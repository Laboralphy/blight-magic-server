import { describe, expect, it } from 'vitest';
import { buildContainer, createConnectionScope } from '../src/boot/container';
import { readSettings } from '../src/boot/settings';

describe('container', () => {
    const container = buildContainer(readSettings({}));

    it('resolves every registration', () => {
        for (const name of Object.keys(container.registrations)) {
            if (name === 'sessionId' || name === 'clientConnection') {
                continue;
            }
            expect(() => container.resolve(name), name).not.toThrow();
        }
    });

    it('uses the connection registry as the client notifier', () => {
        expect(container.resolve('clientNotifier')).toBe(container.resolve('connectionRegistry'));
    });

    it('builds one ClientConnection per connection scope', async () => {
        const a = createConnectionScope(container, 's1');
        const b = createConnectionScope(container, 's2');
        expect(a.handler).not.toBe(b.handler);
        await a.dispose();
        await b.dispose();
    });
});
