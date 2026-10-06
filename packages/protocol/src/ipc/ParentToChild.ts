import { z } from 'zod';
import { DirectionSchema } from '../game/Direction';

/**
 * IPC messages sent by the main process to a game child process
 */
export const ParentToChildSchema = z.discriminatedUnion('type', [
    z.object({
        type: z.literal('player.join'),
        userId: z.string(),
        name: z.string(),
    }),
    z.object({
        type: z.literal('player.leave'),
        userId: z.string(),
    }),
    z.object({
        type: z.literal('player.input'),
        userId: z.string(),
        seq: z.number().int().nonnegative(),
        dir: DirectionSchema,
    }),
    z.object({
        type: z.literal('shutdown'),
    }),
]);
export type ParentToChild = z.infer<typeof ParentToChildSchema>;
