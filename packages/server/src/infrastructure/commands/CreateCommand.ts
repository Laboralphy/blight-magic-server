import type { IClientNotifier } from '../../application/ports/IClientNotifier';
import type { CreateGame } from '../../application/use-cases/games/CreateGame';
import { DomainError } from '../../domain/errors/DomainError';
import type { ICommand } from './ICommand';

export type CreateCommandDeps = {
    createGame: CreateGame;
    clientNotifier: IClientNotifier;
};

export class CreateCommand implements ICommand {
    readonly name = 'create';
    readonly usage = '/create {type} {name}';
    readonly description = 'start a new game process and join it';
    private readonly deps: CreateCommandDeps;

    constructor({ createGame, clientNotifier }: CreateCommandDeps) {
        this.deps = { createGame, clientNotifier };
    }

    async execute(userId: string, args: string[]): Promise<void> {
        const [type, ...nameParts] = args;
        if (!type || nameParts.length === 0) {
            throw DomainError.invalid(`Usage: ${this.usage}`);
        }
        const name = nameParts.join(' ');
        this.deps.clientNotifier.info(userId, `Starting game "${name}"…`);
        const game = await this.deps.createGame.execute(userId, type, name);
        this.deps.clientNotifier.info(userId, `Game ${game.id} "${game.name}" created.`);
    }
}
