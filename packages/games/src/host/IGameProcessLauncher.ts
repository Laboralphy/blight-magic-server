import type { ChildProcess } from 'node:child_process';
import type { GameProcessArgs } from '@blight/protocol';

/**
 * Starts the OS process hosting a game
 */
export interface IGameProcessLauncher {
    launch(args: GameProcessArgs): ChildProcess;
}
