import type { IClientNotifier } from '../../application/ports/IClientNotifier';
import type { LeaveGame } from '../../application/use-cases/games/LeaveGame';
import type { ICommand } from './ICommand';

export type LeaveCommandDeps = {
    leaveGame: LeaveGame;
    clientNotifier: IClientNotifier;
};

export class LeaveCommand implements ICommand {
    readonly name = 'leave';
    readonly usage = '/leave';
    readonly description = 'leave the current game and go back to the lobby';
    private readonly deps: LeaveCommandDeps;

    constructor({ leaveGame, clientNotifier }: LeaveCommandDeps) {
        this.deps = { leaveGame, clientNotifier };
    }

    execute(userId: string): void {
        this.deps.leaveGame.execute(userId);
        this.deps.clientNotifier.info(userId, 'Back to the lobby.');
    }
}
