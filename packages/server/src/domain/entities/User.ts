import { z } from 'zod';

/**
 * A connected user. For the POC a user only lives as long as its connection :
 * its id is the connection (session) id.
 */
export const UserSchema = z
    .object({
        id: z.string().min(1),
        name: z.string().min(1),
        tsConnected: z.number().int(),
    })
    .strict();

export type User = z.infer<typeof UserSchema>;
