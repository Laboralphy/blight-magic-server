import { type ChildProcess, fork } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import type { GameProcessArgs } from '@blight/protocol';
import type { IGameProcessLauncher } from './IGameProcessLauncher';

/**
 * Forks `child/main.ts` with the tsx loader, so children run TypeScript sources like the main process
 */
export class GameProcessLauncher implements IGameProcessLauncher {
    private readonly entry = fileURLToPath(new URL('../child/main.ts', import.meta.url));
    private readonly loader = import.meta.resolve('tsx');

    launch(args: GameProcessArgs): ChildProcess {
        return fork(this.entry, ['--id', args.id, '--type', args.type, '--name', args.name], {
            execArgv: ['--import', this.loader],
            serialization: 'advanced',
            stdio: ['ignore', 'inherit', 'inherit', 'ipc'],
        });
    }
}
