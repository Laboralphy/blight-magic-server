import type { IClientNotifier } from '../../application/ports/IClientNotifier';
import { DomainError } from '../../domain/errors/DomainError';
import type { ICommand } from './ICommand';

export type CommandInterpreterDeps = {
    commands: ICommand[];
    clientNotifier: IClientNotifier;
};

/**
 * Minimalist command line interpreter for chat lines starting with "/".
 * "/help" is built in and lists the registered commands.
 */
export class CommandInterpreter {
    private readonly commands = new Map<string, ICommand>();
    private readonly clientNotifier: IClientNotifier;

    constructor({ commands, clientNotifier }: CommandInterpreterDeps) {
        this.clientNotifier = clientNotifier;
        for (const command of commands) {
            this.commands.set(command.name, command);
        }
    }

    async execute(userId: string, line: string): Promise<void> {
        const [name = '', ...args] = line.replace(/^\//, '').trim().split(/\s+/);
        const commandName = name.toLowerCase();
        if (commandName === 'help' || commandName === '') {
            this.help(userId);
            return;
        }
        const command = this.commands.get(commandName);
        if (!command) {
            throw DomainError.invalid(`Unknown command /${commandName}. Type /help`);
        }
        await command.execute(userId, args);
    }

    private help(userId: string): void {
        const lines = [...this.commands.values()].map((c) => `${c.usage} — ${c.description}`);
        this.clientNotifier.info(userId, ['Commands:', ...lines, '/help — this list'].join('\n'));
    }
}
