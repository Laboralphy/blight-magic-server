import type { IConnectionHandler } from './IConnectionHandler';

/**
 * One DI scope per connection ; implemented by the composition root
 */
export type ConnectionScope = {
    handler: IConnectionHandler;
    dispose(): Promise<void>;
};

export type ConnectionScopeFactory = (sessionId: string) => ConnectionScope;
