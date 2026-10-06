import { z } from 'zod';

/**
 * Public description of a running game, as listed by /list
 */
export const GameSummarySchema = z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    players: z.number().int().nonnegative(),
});
export type GameSummary = z.infer<typeof GameSummarySchema>;
