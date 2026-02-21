import { Router } from 'express';
import type { Request, Response } from 'express';
import { wikiSpotIdParamSchema, updateWikiSchema } from '../schemas/wiki.schema.js';
import { getWikiBySpotId, updateWiki } from '../services/wiki.service.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { AppError } from '../utils/appError.js';

const router = Router();

router.get('/spots/:spotId/wiki', async (req: Request, res: Response) => {
  const result = wikiSpotIdParamSchema.safeParse(req.params);
  if (!result.success) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid spot ID format');
  }

  const wiki = await getWikiBySpotId(result.data.spotId);

  res.json({ data: wiki });
});

router.put('/spots/:spotId/wiki', requireAuth, async (req: Request, res: Response) => {
  const paramResult = wikiSpotIdParamSchema.safeParse(req.params);
  if (!paramResult.success) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid spot ID format');
  }

  const bodyResult = updateWikiSchema.safeParse(req.body);
  if (!bodyResult.success) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid wiki content');
  }

  const wiki = await updateWiki(
    paramResult.data.spotId,
    bodyResult.data.content,
    req.user!.userId,
  );

  res.json({ data: wiki });
});

export default router;
