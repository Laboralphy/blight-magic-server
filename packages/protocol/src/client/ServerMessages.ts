import { z } from 'zod';
import { GameSummarySchema } from '../game/GameSummary';
import { GameStateSchema } from '../game/GameState';

/**
 * Messages sent by the main process to a browser client, over the WebSocket.
 * Game children produce some of them (game.state) ; main only relays those.
 */
export const ServerMessageSchema = z.discriminatedUnion('type', [
    z.object({
        type: z.literal('auth.welcome'),
        userId: z.string(),
        name: z.string(),
    }),
    z.object({
        type: z.literal('auth.error'),
        reason: z.string(),
    }),
    z.object({
        type: z.literal('chat.message'),
        channel: z.string(),
        from: z.object({ id: z.string(), name: z.string(), color: z.string() }),
        text: z.string(),
        ts: z.number(),
    }),
    z.object({
        type: z.literal('chat.channel'),
        channel: z.string(),
    }),
    z.object({
        type: z.literal('chat.presence'),
        channel: z.string(),
        name: z.string(),
        event: z.enum(['joined', 'left']),
    }),
    z.object({
        type: z.literal('system.info'),
        text: z.string(),
    }),
    z.object({
        type: z.literal('system.error'),
        text: z.string(),
    }),
    z.object({
        type: z.literal('game.joined'),
        game: GameSummarySchema,
    }),
    z.object({
        type: z.literal('game.left'),
        gameId: z.string(),
        reason: z.string(),
    }),
    z.object({
        type: z.literal('game.state'),
        state: GameStateSchema,
    }),
]);
export type ServerMessage = z.infer<typeof ServerMessageSchema>;
export type ServerMessageOf<T extends ServerMessage['type']> = Extract<ServerMessage, { type: T }>;
