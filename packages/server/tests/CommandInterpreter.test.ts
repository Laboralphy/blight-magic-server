import { describe, expect, it } from 'vitest';
import { CommandInterpreter } from '../src/infrastructure/commands/CommandInterpreter';
import type { ICommand } from '../src/infrastructure/commands/ICommand';
import { FakeClientNotifier } from './helpers/FakeClientNotifier';

class RecordingCommand implements ICommand {
    readonly name = 'echo';
    readonly usage = '/echo {text}';
    readonly description = 'records its arguments';
    readonly calls: { userId: string; args: string[] }[] = [];

    execute(userId: string, args: string[]): void {
        this.calls.push({ userId, args });
    }
}

describe('CommandInterpreter', () => {
    const notifier = new FakeClientNotifier();
    const echo = new RecordingCommand();
    const interpreter = new CommandInterpreter({ commands: [echo], clientNotifier: notifier });

    it('parses the command name case-insensitively and splits arguments', async () => {
        await interpreter.execute('u1', '/ECHO  a   b c');
        expect(echo.calls).toEqual([{ userId: 'u1', args: ['a', 'b', 'c'] }]);
    });

    it('rejects unknown commands', async () => {
        await expect(interpreter.execute('u1', '/nope')).rejects.toMatchObject({
            code: 'INVALID',
            message: 'Unknown command /nope. Type /help',
        });
    });

    it('lists commands on /help', async () => {
        await interpreter.execute('u1', '/help');
        const help = notifier.to('u1').at(-1);
        expect(help?.type).toBe('system.info');
        expect(help && 'text' in help && help.text).toContain(
            '/echo {text} — records its arguments'
        );
    });
});
