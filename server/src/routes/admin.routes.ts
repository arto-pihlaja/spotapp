import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod/v4';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';
import { createInvitationCodeSchema } from '../schemas/admin.schema.js';
import { createInvitationCode, listInvitationCodes, getUserProfile } from '../services/admin.service.js';
import { AppError } from '../utils/appError.js';

const router = Router();

// GET /users/:userId - ghost profile (auth required)
router.get('/users/:userId', requireAuth, async (req: Request, res: Response) => {
  const profile = await getUserProfile(req.params.userId as string);
  if (!profile) {
    throw new AppError(404, 'NOT_FOUND', 'User not found');
  }
  res.json({ data: profile });
});

// POST /admin/invitation-codes (admin only)
router.post(
  '/admin/invitation-codes',
  requireAuth,
  requireRole('ADMIN'),
  async (req: Request, res: Response) => {
    const result = createInvitationCodeSchema.safeParse(req.body);
    if (!result.success) {
      throw new AppError(400, 'VALIDATION_ERROR', z.prettifyError(result.error));
    }

    const code = await createInvitationCode(req.user!.userId, result.data.maxUses, result.data.expiresAt);
    res.status(201).json({ data: code });
  },
);

// GET /admin/invitation-codes (admin only)
router.get(
  '/admin/invitation-codes',
  requireAuth,
  requireRole('ADMIN'),
  async (_req: Request, res: Response) => {
    const codes = await listInvitationCodes();
    res.json({ data: codes, meta: { count: codes.length } });
  },
);

export default router;
