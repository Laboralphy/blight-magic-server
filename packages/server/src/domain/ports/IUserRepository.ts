import type { User } from '../entities/User';

export interface IUserRepository {
    save(user: User): Promise<void>;
    remove(id: string): Promise<void>;
    findById(id: string): Promise<User | undefined>;
    /** case-insensitive */
    findByName(name: string): Promise<User | undefined>;
}
