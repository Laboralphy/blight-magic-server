/**
 * A chat command, typed as "/name arg1 arg2…"
 */
export interface ICommand {
    readonly name: string;
    readonly usage: string;
    readonly description: string;
    execute(userId: string, args: string[]): Promise<void> | void;
}
