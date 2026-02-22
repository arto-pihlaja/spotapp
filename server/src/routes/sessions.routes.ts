import { Router } from 'express';
import type { Request, Response } from 'express';
import { createSessionSchema, sessionParamsSchema, sessionIdParamsSchema } from '../schemas/sessions.schema.js';
import { createSession, getSessionsBySpot, deleteSession } from '../services/sessions.service.js';
import { requireAuth, optionalAuth } from '../middleware/authMiddleware.js';
import { AppError } from '../utils/appError.js';
import { emitSessionJoined, emitSessionLeft } from '../socket/sessionHandlers.js';
import { z } from 'zod/v4';

const router = Router();

// GET /spots/:spotId/sessions — list active sessions for a spot
router.get('/spots/:spotId/sessions', optionalAuth, async (req: Request, res: Response) => {
  const params = sessionParamsSchema.safeParse(req.params);
  if (!params.success) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid spot ID format');
  }

  const sessions = await getSessionsBySpot(params.data.spotId);

  if (!req.user) {
    // Anonymous: return count only
    res.json({ data: { sessionCount: sessions.length } });
    return;
  }

  const data = sessions.map((s) => ({
    id: s.id,
    spotId: s.spotId,
    type: s.type,
    sportType: s.sportType,
    scheduledAt: s.scheduledAt,
    expiresAt: s.expiresAt,
    createdAt: s.createdAt,
    user: s.user,
    isOwn: s.userId === req.user!.userId,
  }));

  res.json({ data, meta: { count: data.length } });
});

// POST /spots/:spotId/sessions — create a session
router.post('/spots/:spotId/sessions', requireAuth, async (req: Request, res: Response) => {
  const params = sessionParamsSchema.safeParse(req.params);
  if (!params.success) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid spot ID format');
  }

  const body = createSessionSchema.safeParse(req.body);
  if (!body.success) {
    throw new AppError(400, 'VALIDATION_ERROR', z.prettifyError(body.error));
  }

  const session = await createSession({
    spotId: params.data.spotId,
    userId: req.user!.userId,
    type: body.data.type,
    sportType: body.data.sportType,
    scheduledAt: body.data.scheduledAt,
  });

  const responseData = {
    ...session,
    isOwn: true,
  };

  res.status(201).json({ data: responseData });

  // Broadcast after response
  emitSessionJoined(params.data.spotId, responseData);
});

// DELETE /spots/:spotId/sessions/:sessionId — leave/delete own session
router.delete('/spots/:spotId/sessions/:sessionId', requireAuth, async (req: Request, res: Response) => {
  const params = sessionIdParamsSchema.safeParse(req.params);
  if (!params.success) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid spot or session ID format');
  }

  const deleted = await deleteSession(params.data.sessionId, req.user!.userId);
  if (!deleted) {
    throw new AppError(404, 'NOT_FOUND', 'Session not found or not yours');
  }

  res.json({ data: { sessionId: params.data.sessionId } });

  // Broadcast after response
  emitSessionLeft(params.data.spotId, params.data.sessionId);
});

export default router;
