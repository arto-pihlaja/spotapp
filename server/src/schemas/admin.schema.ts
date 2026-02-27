import { z } from 'zod/v4';

export const createInvitationCodeSchema = z.object({
  maxUses: z.number().int().min(1).max(1000),
  expiresAt: z.string().datetime().optional(),
});

export type CreateInvitationCodeInput = z.infer<typeof createInvitationCodeSchema>;

export const listAuditLogsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  action: z.enum(['USER_BLOCKED', 'USER_UNBLOCKED', 'SPOT_DELETED', 'WIKI_REVERTED']).optional(),
});

export type ListAuditLogsInput = z.infer<typeof listAuditLogsSchema>;
