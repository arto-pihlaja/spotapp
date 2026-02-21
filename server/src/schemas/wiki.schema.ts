import { z } from 'zod/v4';

export const wikiSpotIdParamSchema = z.object({
  spotId: z.string().uuid(),
});

export const updateWikiSchema = z.object({
  content: z.string().max(50000),
});
