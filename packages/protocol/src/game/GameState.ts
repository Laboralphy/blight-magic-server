import { z } from 'zod';

export const PlayerStateSchema = z.object({
    id: z.string(),
    name: z.string(),
    color: z.string(),
    x: z.number(),
    y: z.number(),
    /**
     * Sequence number of the last input of this player processed by the server.
     * The owning client uses it to reconcile its predicted position.
     */
    ackSeq: z.number().int(),
});
export type PlayerState = z.infer<typeof PlayerStateSchema>;

export const ArenaSchema = z.object({
    width: z.number().int().positive(),
    height: z.number().int().positive(),
});
export type Arena = z.infer<typeof ArenaSchema>;

export const GameStateSchema = z.object({
    gameId: z.string(),
    tick: z.number().int().nonnegative(),
    arena: ArenaSchema,
    players: z.array(PlayerStateSchema),
});
export type GameState = z.infer<typeof GameStateSchema>;
