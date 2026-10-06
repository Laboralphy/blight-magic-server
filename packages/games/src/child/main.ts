/**
 * Entry point of a game child process, forked by GameProcessLauncher
 */
import { parseArgs } from 'node:util';
import { GameRuntime } from './GameRuntime';
import { ParentChannel } from './ParentChannel';

const { values } = parseArgs({
    options: {
        id: { type: 'string' },
        type: { type: 'string', default: 'dot' },
        name: { type: 'string', default: '' },
    },
});

if (!values.id) {
    console.error('game child: missing --id');
    process.exit(1);
}

new GameRuntime(
    { id: values.id, type: values.type, name: values.name },
    new ParentChannel(process)
).run();
