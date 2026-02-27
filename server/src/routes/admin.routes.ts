import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod/v4';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';
import { createInvitationCodeSchema, listAuditLogsSchema } from '../schemas/admin.schema.js';
import { createInvitationCode, listInvitationCodes, getUserProfile, listUsers, blockUser, unblockUser, deleteSpot, revertWiki, listSpots, listAuditLogs } from '../services/admin.service.js';
import { emitModerationAction } from '../socket/adminHandlers.js';
import { getIO } from '../socket/index.js';
import { prisma } from '../config/prisma.js';
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

// GET /admin/users (admin only)
router.get(
  '/admin/users',
  requireAuth,
  requireRole('ADMIN'),
  async (_req: Request, res: Response) => {
    const users = await listUsers();
    res.json({ data: users, meta: { count: users.length } });
  },
);

// POST /admin/users/:userId/block (admin only)
router.post(
  '/admin/users/:userId/block',
  requireAuth,
  requireRole('ADMIN'),
  async (req: Request, res: Response) => {
    const userId = req.params.userId as string;
    const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true, isBlocked: true } });
    if (!target) {
      throw new AppError(404, 'NOT_FOUND', 'User not found');
    }
    if (target.role === 'ADMIN') {
      throw new AppError(400, 'INVALID_TARGET', 'Cannot block an admin user');
    }
    if (target.isBlocked) {
      throw new AppError(400, 'ALREADY_BLOCKED', 'User is already blocked');
    }

    const result = await blockUser(userId, req.user!.userId);

    emitModerationAction({
      action: 'USER_BLOCKED',
      targetType: 'USER',
      targetId: userId,
      adminId: req.user!.userId,
      timestamp: new Date().toISOString(),
    });

    res.json({ data: result });
  },
);

// POST /admin/users/:userId/unblock (admin only)
router.post(
  '/admin/users/:userId/unblock',
  requireAuth,
  requireRole('ADMIN'),
  async (req: Request, res: Response) => {
    const userId = req.params.userId as string;
    const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true, isBlocked: true } });
    if (!target) {
      throw new AppError(404, 'NOT_FOUND', 'User not found');
    }
    if (target.role === 'ADMIN') {
      throw new AppError(400, 'INVALID_TARGET', 'Cannot modify an admin user');
    }
    if (!target.isBlocked) {
      throw new AppError(400, 'NOT_BLOCKED', 'User is not blocked');
    }

    const result = await unblockUser(userId, req.user!.userId);

    emitModerationAction({
      action: 'USER_UNBLOCKED',
      targetType: 'USER',
      targetId: userId,
      adminId: req.user!.userId,
      timestamp: new Date().toISOString(),
    });

    res.json({ data: result });
  },
);

// GET /admin/spots (admin only)
router.get(
  '/admin/spots',
  requireAuth,
  requireRole('ADMIN'),
  async (_req: Request, res: Response) => {
    const spots = await listSpots();
    res.json({ data: spots, meta: { count: spots.length } });
  },
);

// DELETE /admin/spots/:spotId (admin only)
router.delete(
  '/admin/spots/:spotId',
  requireAuth,
  requireRole('ADMIN'),
  async (req: Request, res: Response) => {
    const spotId = req.params.spotId as string;
    const spot = await prisma.spot.findUnique({ where: { id: spotId }, select: { id: true } });
    if (!spot) {
      throw new AppError(404, 'NOT_FOUND', 'Spot not found');
    }

    const result = await deleteSpot(spotId, req.user!.userId);

    getIO().emit('spot:deleted', { spotId });
    emitModerationAction({
      action: 'SPOT_DELETED',
      targetType: 'SPOT',
      targetId: spotId,
      adminId: req.user!.userId,
      timestamp: new Date().toISOString(),
    });

    res.json({ data: result });
  },
);

// PUT /admin/spots/:spotId/wiki/revert (admin only)
router.put(
  '/admin/spots/:spotId/wiki/revert',
  requireAuth,
  requireRole('ADMIN'),
  async (req: Request, res: Response) => {
    const spotId = req.params.spotId as string;
    const spot = await prisma.spot.findUnique({ where: { id: spotId }, select: { id: true } });
    if (!spot) {
      throw new AppError(404, 'NOT_FOUND', 'Spot not found');
    }

    const result = await revertWiki(spotId, req.user!.userId);
    if (!result) {
      throw new AppError(404, 'NOT_FOUND', 'Wiki content not found for this spot');
    }

    getIO().to(`spot:${spotId}`).emit('spot:updated', { spot: { id: spotId, wikiReverted: true } });
    emitModerationAction({
      action: 'WIKI_REVERTED',
      targetType: 'WIKI',
      targetId: spotId,
      adminId: req.user!.userId,
      timestamp: new Date().toISOString(),
    });

    res.json({ data: result });
  },
);

// GET /admin/audit-logs (admin only)
router.get(
  '/admin/audit-logs',
  requireAuth,
  requireRole('ADMIN'),
  async (req: Request, res: Response) => {
    const result = listAuditLogsSchema.safeParse(req.query);
    if (!result.success) {
      throw new AppError(400, 'VALIDATION_ERROR', z.prettifyError(result.error));
    }

    const { logs, meta } = await listAuditLogs(result.data);
    res.json({ data: logs, meta });
  },
);

export default router;
