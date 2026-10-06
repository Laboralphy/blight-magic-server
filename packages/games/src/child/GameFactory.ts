import type { IGame } from './IGame';
import type { IGameHost } from './IGameHost';
import { DotGame } from './dot/DotGame';

type GameConstructor = (id: string, host: IGameHost) => IGame;

/**
 * Builds a game from its type string.
 * The type is not meaningful yet : every unknown type falls back to the dot game.
 */
export class GameFactory {
    private readonly constructors = new Map<string, GameConstructor>([
        ['dot', (id, host) => new DotGame(id, host)],
    ]);
    private readonly fallbackType = 'dot';

    create(type: string, id: string, host: IGameHost): IGame {
        const build = this.constructors.get(type) ?? this.constructors.get(this.fallbackType);
        if (!build) {
            throw new Error(`no game registered for type "${type}"`);
        }
        return build(id, host);
    }
}
