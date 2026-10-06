/**
 * Every failure a use case can report on purpose.
 *
 * Use cases throw a DomainError with a machine-readable `code` ; each delivery adapter
 * (WebSocket, HTTP…) maps codes to its own vocabulary in one place.
 */
export const ERROR_CODES = ['NOT_FOUND', 'ALREADY_EXISTS', 'UNAUTHORIZED', 'INVALID'] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export class DomainError extends Error {
    constructor(
        readonly code: ErrorCode,
        message: string
    ) {
        super(message);
        this.name = 'DomainError';
    }

    static notFound(what: string, key: string): DomainError {
        return new DomainError('NOT_FOUND', `${what} not found: ${key}`);
    }

    static alreadyExists(what: string, value: string): DomainError {
        return new DomainError('ALREADY_EXISTS', `${what} already exists: ${value}`);
    }

    static invalid(message: string): DomainError {
        return new DomainError('INVALID', message);
    }
}
