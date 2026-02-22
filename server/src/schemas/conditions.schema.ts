import { z } from 'zod/v4';

export const createConditionSchema = z.object({
  waveHeight: z.number().min(0).max(2.5).multipleOf(0.5).optional(),
  windSpeed: z.number().min(0).max(20).multipleOf(2).optional(),
  windDirection: z.number().int().min(0).max(355).multipleOf(5).optional(),
});

export type CreateConditionInput = z.infer<typeof createConditionSchema>;

export const conditionParamsSchema = z.object({
  spotId: z.string().uuid(),
});

export const confirmParamsSchema = z.object({
  spotId: z.string().uuid(),
  conditionId: z.string().uuid(),
});
