import { randomUUID } from 'node:crypto';
import type { IIdGenerator } from '../../application/ports/IIdGenerator';

export class UuidGenerator implements IIdGenerator {
    generate(): string {
        return randomUUID();
    }
}
