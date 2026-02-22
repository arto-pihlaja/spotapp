import { Router } from 'express';
import type { Request, Response } from 'express';
import { createConditionSchema, conditionParamsSchema, confirmParamsSchema } from '../schemas/conditions.schema.js';
import { createConditionReport, getConditionsBySpot, confirmCondition } from '../services/conditions.service.js';
import { requireAuth, optionalAuth } from '../middleware/authMiddleware.js';
import { AppError } from '../utils/appError.js';
import { emitConditionNew, emitConditionConfirmed } from '../socket/conditionHandlers.js';
import { z } from 'zod/v4';
import { Prisma } from '@prisma/client';

const router = Router();

// GET /spots/:spotId/conditions — list recent conditions for a spot
router.get('/spots/:spotId/conditions', optionalAuth, async (req: Request, res: Response) => {
  const params = conditionParamsSchema.safeParse(req.params);
  if (!params.success) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid spot ID format');
  }

  const conditions = await getConditionsBySpot(params.data.spotId, req.user?.userId);

  // Shape response based on auth status
  const data = conditions.map((c) => ({
    id: c.id,
    spotId: c.spotId,
    waveHeight: c.waveHeight,
    windSpeed: c.windSpeed,
    windDirection: c.windDirection != null ? Number(c.windDirection) : null,
    createdAt: c.createdAt,
    confirmCount: c._count.confirmations,
    ...(req.user ? { reporter: c.user } : {}),
    ...('confirmations' in c ? { hasConfirmed: (c.confirmations as unknown[]).length > 0 } : {}),
  }));

  res.json({ data, meta: { count: data.length } });
});

// POST /spots/:spotId/conditions — submit a condition report
router.post('/spots/:spotId/conditions', requireAuth, async (req: Request, res: Response) => {
  const params = conditionParamsSchema.safeParse(req.params);
  if (!params.success) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid spot ID format');
  }

  const body = createConditionSchema.safeParse(req.body);
  if (!body.success) {
    throw new AppError(400, 'VALIDATION_ERROR', z.prettifyError(body.error));
  }

  const condition = await createConditionReport({
    spotId: params.data.spotId,
    userId: req.user!.userId,
    waveHeight: body.data.waveHeight,
    windSpeed: body.data.windSpeed,
    windDirection: body.data.windDirection != null ? String(body.data.windDirection) : undefined,
  });

  const responseData = {
    ...condition,
    windDirection: condition.windDirection != null ? Number(condition.windDirection) : null,
  };
  res.status(201).json({ data: responseData });

  // Broadcast after response
  emitConditionNew(params.data.spotId, responseData);
});

// POST /spots/:spotId/conditions/:conditionId/confirm — confirm a condition report
router.post('/spots/:spotId/conditions/:conditionId/confirm', requireAuth, async (req: Request, res: Response) => {
  const params = confirmParamsSchema.safeParse(req.params);
  if (!params.success) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid spot or condition ID format');
  }

  try {
    const confirmCount = await confirmCondition(params.data.conditionId, req.user!.userId);
    res.status(201).json({ data: { conditionId: params.data.conditionId, confirmCount } });

    // Broadcast after response
    emitConditionConfirmed(params.data.spotId, params.data.conditionId, confirmCount);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new AppError(409, 'ALREADY_CONFIRMED', 'You have already confirmed this report');
    }
    throw err;
  }
});

export default router;
