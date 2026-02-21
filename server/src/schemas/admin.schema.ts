import { z } from 'zod/v4';

export const createInvitationCodeSchema = z.object({
  maxUses: z.number().int().min(1).max(1000),
  expiresAt: z.string().datetime().optional(),
});

export type CreateInvitationCodeInput = z.infer<typeof createInvitationCodeSchema>;
