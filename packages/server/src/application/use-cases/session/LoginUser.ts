import type { IUserRepository } from '../../../domain/ports/IUserRepository';
import type { IChatService } from '../../ports/IChatService';
import type { IClientNotifier } from '../../ports/IClientNotifier';
import type { IClock } from '../../ports/IClock';
import { type User, UserSchema } from '../../../domain/entities/User';
import { LOBBY_ROOM } from '../../../domain/entities/Rooms';
import { DomainError } from '../../../domain/errors/DomainError';

export type LoginUserDeps = {
    userRepository: IUserRepository;
    chatService: IChatService;
    clientNotifier: IClientNotifier;
    clock: IClock;
};

/**
 * Identifies a connection by a name (no password for the POC) and puts the user in the lobby
 */
export class LoginUser {
    private readonly deps: LoginUserDeps;

    constructor({ userRepository, chatService, clientNotifier, clock }: LoginUserDeps) {
        this.deps = { userRepository, chatService, clientNotifier, clock };
    }

    async execute(sessionId: string, name: string): Promise<User> {
        const { userRepository, chatService, clientNotifier, clock } = this.deps;
        if (await userRepository.findById(sessionId)) {
            throw DomainError.invalid('Already logged in');
        }
        if (await userRepository.findByName(name)) {
            throw DomainError.alreadyExists('User name', name);
        }
        const user = UserSchema.parse({ id: sessionId, name, tsConnected: clock.now() });
        await userRepository.save(user);
        clientNotifier.send(user.id, { type: 'auth.welcome', userId: user.id, name: user.name });
        chatService.registerUser(user.id, user.name);
        chatService.joinRoom(user.id, LOBBY_ROOM);
        return user;
    }
}
