import { z } from 'zod/v4';

export const sessionParamsSchema = z.object({
  spotId: z.string().uuid(),
});

export const sessionIdParamsSchema = z.object({
  spotId: z.string().uuid(),
  sessionId: z.string().uuid(),
});

export const createSessionSchema = z.object({
  type: z.enum(['now', 'planned']),
  sportType: z.enum(['WING_FOIL', 'WINDSURF', 'KITE', 'OTHER']),
  scheduledAt: z.iso.datetime().optional(),
}).refine(
  (data) => data.type === 'now' || data.scheduledAt != null,
  { message: 'scheduledAt is required for planned sessions' },
);

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
