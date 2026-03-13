import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod/v4';
import { requestResetSchema, executeResetSchema } from '../schemas/passwordReset.schema.js';
import { requestPasswordReset, executePasswordReset } from '../services/passwordReset.service.js';
import { rateLimit } from '../middleware/rateLimiter.js';
import { AppError } from '../utils/appError.js';

const router = Router();

// POST /auth/forgot-password
router.post(
  '/auth/forgot-password',
  rateLimit(3, 60_000),
  async (req: Request, res: Response) => {
    const result = requestResetSchema.safeParse(req.body);
    if (!result.success) {
      throw new AppError(400, 'VALIDATION_ERROR', z.prettifyError(result.error));
    }

    await requestPasswordReset(result.data.email);

    // Always return generic success to prevent email enumeration
    res.json({ data: { message: 'If that email is registered, you will receive a reset link.' } });
  },
);

// POST /auth/reset-password
router.post(
  '/auth/reset-password',
  rateLimit(5, 60_000),
  async (req: Request, res: Response) => {
    const result = executeResetSchema.safeParse(req.body);
    if (!result.success) {
      throw new AppError(400, 'VALIDATION_ERROR', z.prettifyError(result.error));
    }

    await executePasswordReset(result.data.token, result.data.newPassword);

    res.json({ data: { message: 'Password has been reset successfully.' } });
  },
);

export default router;
