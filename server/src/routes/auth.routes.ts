import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod/v4';
import { registerSchema, loginSchema, refreshSchema } from '../schemas/auth.schema.js';
import { register, login, refresh } from '../services/auth.service.js';
import { rateLimit } from '../middleware/rateLimiter.js';
import { honeypotCheck, timeCheck } from '../middleware/antiBot.js';
import { AppError } from '../utils/appError.js';

const router = Router();

// POST /auth/register
router.post(
  '/auth/register',
  rateLimit(10, 60_000), // 10 per minute per IP
  honeypotCheck,
  timeCheck(5_000), // Must take >5s
  async (req: Request, res: Response) => {
    const result = registerSchema.safeParse(req.body);
    if (!result.success) {
      throw new AppError(400, 'VALIDATION_ERROR', z.prettifyError(result.error));
    }

    const tokens = await register({
      username: result.data.username,
      password: result.data.password,
      invitationCode: result.data.invitationCode,
    });

    res.status(201).json({ data: tokens });
  },
);

// POST /auth/login
router.post('/auth/login', rateLimit(5, 60_000), async (req: Request, res: Response) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    throw new AppError(400, 'VALIDATION_ERROR', z.prettifyError(result.error));
  }

  const tokens = await login(result.data.username, result.data.password);
  res.json({ data: tokens });
});

// POST /auth/refresh
router.post('/auth/refresh', rateLimit(20, 60_000), async (req: Request, res: Response) => {
  const result = refreshSchema.safeParse(req.body);
  if (!result.success) {
    throw new AppError(400, 'VALIDATION_ERROR', z.prettifyError(result.error));
  }

  const tokens = await refresh(result.data.refreshToken);
  res.json({ data: tokens });
});

export default router;
