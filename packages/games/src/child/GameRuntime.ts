import type { GameProcessArgs, ParentToChild } from '@blight/protocol';
import type { IGame } from './IGame';
import { GameFactory } from './GameFactory';
import type { ParentChannel } from './ParentChannel';

/**
 * Glue between the IPC channel and the game, inside a child process
 */
export class GameRuntime {
    private readonly game: IGame;

    constructor(
        args: GameProcessArgs,
        private readonly channel: ParentChannel,
        factory: GameFactory = new GameFactory()
    ) {
        this.game = factory.create(args.type, args.id, channel);
    }

    run(): void {
        this.channel.onMessage((message) => this.dispatch(message));
        this.channel.onParentGone(() => this.terminate());
        this.game.start();
        this.channel.post({ type: 'ready' });
    }

    private dispatch(message: ParentToChild): void {
        switch (message.type) {
            case 'player.join':
                this.game.addPlayer(message.userId, message.name);
                break;
            case 'player.leave':
                this.game.removePlayer(message.userId);
                break;
            case 'player.input':
                this.game.handleInput(message.userId, message.seq, message.dir);
                break;
            case 'shutdown':
                this.terminate();
                break;
        }
    }

    private terminate(): void {
        this.game.stop();
        process.exit(0);
    }
}
