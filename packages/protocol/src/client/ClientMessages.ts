import { z } from 'zod';
import { DirectionSchema } from '../game/Direction';

/**
 * Messages sent by a browser client to the main process, over the WebSocket
 */
export const ClientMessageSchema = z.discriminatedUnion('type', [
    z.object({
        type: z.literal('auth.login'),
        name: z
            .string()
            .trim()
            .min(2)
            .max(20)
            .regex(/^[\w-]+$/, 'letters, digits, "_" and "-" only'),
    }),
    z.object({
        type: z.literal('chat.say'),
        text: z.string().trim().min(1).max(500),
    }),
    z.object({
        type: z.literal('game.input'),
        seq: z.number().int().nonnegative(),
        dir: DirectionSchema,
    }),
]);
export type ClientMessage = z.infer<typeof ClientMessageSchema>;
export type ClientMessageOf<T extends ClientMessage['type']> = Extract<ClientMessage, { type: T }>;
