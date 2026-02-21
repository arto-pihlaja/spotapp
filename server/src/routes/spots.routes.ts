import { Router } from 'express';
import type { Request, Response } from 'express';
import { viewportQuerySchema } from '../schemas/spots.schema.js';
import { getSpotsByViewport } from '../services/spots.service.js';
import { AppError } from '../utils/appError.js';
import { z } from 'zod/v4';

const router = Router();

router.get('/spots', async (req: Request, res: Response) => {
  const result = viewportQuerySchema.safeParse(req.query);
  if (!result.success) {
    throw new AppError(400, 'VALIDATION_ERROR', z.prettifyError(result.error));
  }

  const spots = await getSpotsByViewport(result.data.viewport);

  res.json({
    data: spots,
    meta: { count: spots.length },
  });
});

export default router;
