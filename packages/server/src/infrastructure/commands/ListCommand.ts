import type { IClientNotifier } from '../../application/ports/IClientNotifier';
import type { ListGames } from '../../application/use-cases/games/ListGames';
import type { ICommand } from './ICommand';

export type ListCommandDeps = {
    listGames: ListGames;
    clientNotifier: IClientNotifier;
};

export class ListCommand implements ICommand {
    readonly name = 'list';
    readonly usage = '/list';
    readonly description = 'list running games';
    private readonly deps: ListCommandDeps;

    constructor({ listGames, clientNotifier }: ListCommandDeps) {
        this.deps = { listGames, clientNotifier };
    }

    execute(userId: string): void {
        const games = this.deps.listGames.execute();
        const text =
            games.length === 0
                ? 'No game running. Create one with /create {type} {name}'
                : [
                      'Games:',
                      ...games.map(
                          (g) => `  [${g.id}] ${g.name} (${g.type}) — ${g.players} player(s)`
                      ),
                  ].join('\n');
        this.deps.clientNotifier.info(userId, text);
    }
}
