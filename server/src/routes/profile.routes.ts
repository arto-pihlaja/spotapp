import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod/v4';
import { requireAuth } from '../middleware/authMiddleware.js';
import { setEmailSchema, verifyEmailSchema } from '../schemas/passwordReset.schema.js';
import { setEmail, verifyEmail } from '../services/email-management.service.js';
import { prisma } from '../config/prisma.js';
import { rateLimit } from '../middleware/rateLimiter.js';
import { AppError } from '../utils/appError.js';

const router = Router();

// GET /users/me
router.get('/users/me', requireAuth, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: {
      id: true,
      username: true,
      email: true,
      emailVerifiedAt: true,
      photoUrl: true,
      externalLink: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AppError(404, 'NOT_FOUND', 'User not found');
  }

  res.json({ data: user });
});

// POST /users/me/email
router.post(
  '/users/me/email',
  requireAuth,
  rateLimit(3, 60_000),
  async (req: Request, res: Response) => {
    const result = setEmailSchema.safeParse(req.body);
    if (!result.success) {
      throw new AppError(400, 'VALIDATION_ERROR', z.prettifyError(result.error));
    }

    await setEmail(req.user!.userId, result.data.email);

    res.json({ data: { message: 'Verification email sent.' } });
  },
);

// POST /auth/verify-email
router.post(
  '/auth/verify-email',
  rateLimit(5, 60_000),
  async (req: Request, res: Response) => {
    const result = verifyEmailSchema.safeParse(req.body);
    if (!result.success) {
      throw new AppError(400, 'VALIDATION_ERROR', z.prettifyError(result.error));
    }

    await verifyEmail(result.data.token);

    res.json({ data: { message: 'Email verified successfully.' } });
  },
);

export default router;
