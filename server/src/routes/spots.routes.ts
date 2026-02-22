import { Router } from 'express';
import type { Request, Response } from 'express';
import { viewportQuerySchema, createSpotSchema, spotIdParamSchema } from '../schemas/spots.schema.js';
import { getSpotsByViewport, getSpotById, createSpot } from '../services/spots.service.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { AppError } from '../utils/appError.js';
import { emitSpotCreated } from '../socket/spotHandlers.js';
import { z } from 'zod/v4';

const router = Router();

router.get('/spots', async (req: Request, res: Response) => {
  const result = viewportQuerySchema.safeParse(req.query);
  if (!result.success) {
    throw new AppError(400, 'VALIDATION_ERROR', z.prettifyError(result.error));
  }

  const spots = await getSpotsByViewport(result.data.viewport, {
    timeFrom: result.data.timeFrom,
    timeTo: result.data.timeTo,
  });

  res.json({
    data: spots,
    meta: { count: spots.length },
  });
});

router.get('/spots/:spotId', async (req: Request, res: Response) => {
  const result = spotIdParamSchema.safeParse(req.params);
  if (!result.success) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid spot ID format');
  }

  const spot = await getSpotById(result.data.spotId);
  if (!spot) {
    throw new AppError(404, 'NOT_FOUND', 'Spot not found');
  }

  res.json({ data: spot });
});

router.post('/spots', requireAuth, async (req: Request, res: Response) => {
  const result = createSpotSchema.safeParse(req.body);
  if (!result.success) {
    throw new AppError(400, 'VALIDATION_ERROR', z.prettifyError(result.error));
  }

  const spot = await createSpot({
    ...result.data,
    userId: req.user!.userId,
  });

  res.status(201).json({ data: spot });

  emitSpotCreated(spot);
});

export default router;
