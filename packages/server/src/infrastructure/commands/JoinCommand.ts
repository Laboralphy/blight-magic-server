import type { IClientNotifier } from '../../application/ports/IClientNotifier';
import type { JoinGame } from '../../application/use-cases/games/JoinGame';
import { DomainError } from '../../domain/errors/DomainError';
import type { ICommand } from './ICommand';

export type JoinCommandDeps = {
    joinGame: JoinGame;
    clientNotifier: IClientNotifier;
};

export class JoinCommand implements ICommand {
    readonly name = 'join';
    readonly usage = '/join {game_id}';
    readonly description = 'join a running game';
    private readonly deps: JoinCommandDeps;

    constructor({ joinGame, clientNotifier }: JoinCommandDeps) {
        this.deps = { joinGame, clientNotifier };
    }

    async execute(userId: string, args: string[]): Promise<void> {
        const [gameId] = args;
        if (!gameId) {
            throw DomainError.invalid(`Usage: ${this.usage}`);
        }
        const game = await this.deps.joinGame.execute(userId, gameId);
        this.deps.clientNotifier.info(userId, `You joined game ${game.id} "${game.name}".`);
    }
}
