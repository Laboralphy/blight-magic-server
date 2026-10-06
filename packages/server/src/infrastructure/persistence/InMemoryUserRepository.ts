import type { User } from '../../domain/entities/User';
import type { IUserRepository } from '../../domain/ports/IUserRepository';

export class InMemoryUserRepository implements IUserRepository {
    private readonly users = new Map<string, User>();

    async save(user: User): Promise<void> {
        this.users.set(user.id, user);
    }

    async remove(id: string): Promise<void> {
        this.users.delete(id);
    }

    async findById(id: string): Promise<User | undefined> {
        return this.users.get(id);
    }

    async findByName(name: string): Promise<User | undefined> {
        const lowerName = name.toLowerCase();
        for (const user of this.users.values()) {
            if (user.name.toLowerCase() === lowerName) {
                return user;
            }
        }
        return undefined;
    }
}
