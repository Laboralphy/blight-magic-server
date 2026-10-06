/**
 * Command line arguments given to a game child process: `--id <id> --type <type> --name <name>`
 */
export interface GameProcessArgs {
    id: string;
    type: string;
    name: string;
}
