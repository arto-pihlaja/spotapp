import crypto from 'node:crypto';
import { prisma } from '../config/prisma.js';

export async function createInvitationCode(adminId: string, maxUses: number, expiresAt?: string) {
  const code = crypto.randomBytes(8).toString('base64url').toUpperCase();

  return prisma.invitationCode.create({
    data: {
      code,
      maxUses,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdBy: adminId,
    },
  });
}

export async function listInvitationCodes() {
  return prisma.invitationCode.findMany({
    orderBy: { code: 'asc' },
    include: { creator: { select: { username: true } } },
  });
}

export async function blockUser(userId: string, adminId: string) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: userId },
      data: { isBlocked: true },
      select: { id: true, username: true, isBlocked: true },
    });

    await tx.session.deleteMany({ where: { userId } });
    await tx.conditionConfirmation.deleteMany({ where: { userId } });
    await tx.conditionReport.deleteMany({ where: { userId } });

    await tx.auditLog.create({
      data: {
        action: 'USER_BLOCKED',
        targetType: 'USER',
        targetId: userId,
        adminId,
      },
    });

    return { userId: user.id, username: user.username, isBlocked: user.isBlocked };
  });
}

export async function unblockUser(userId: string, adminId: string) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: userId },
      data: { isBlocked: false },
      select: { id: true, username: true, isBlocked: true },
    });

    await tx.auditLog.create({
      data: {
        action: 'USER_UNBLOCKED',
        targetType: 'USER',
        targetId: userId,
        adminId,
      },
    });

    return { userId: user.id, username: user.username, isBlocked: user.isBlocked };
  });
}

export async function listUsers() {
  const users = await prisma.user.findMany({
    where: { role: 'USER' },
    select: {
      id: true,
      username: true,
      role: true,
      isBlocked: true,
      createdAt: true,
      _count: {
        select: {
          sessions: true,
          conditionReports: true,
        },
      },
    },
    orderBy: { username: 'asc' },
  });

  return users.map((u) => ({
    id: u.id,
    username: u.username,
    role: u.role,
    isBlocked: u.isBlocked,
    createdAt: u.createdAt,
    stats: {
      sessionCount: u._count.sessions,
      conditionReportCount: u._count.conditionReports,
    },
  }));
}

export async function deleteSpot(spotId: string, adminId: string) {
  return prisma.$transaction(async (tx) => {
    const spot = await tx.spot.findUnique({
      where: { id: spotId },
      select: { id: true, name: true },
    });

    if (!spot) return null;

    // Cascade delete in FK-safe order
    const conditionReportIds = await tx.conditionReport.findMany({
      where: { spotId },
      select: { id: true },
    });
    if (conditionReportIds.length > 0) {
      await tx.conditionConfirmation.deleteMany({
        where: { conditionReportId: { in: conditionReportIds.map((r) => r.id) } },
      });
    }
    await tx.conditionReport.deleteMany({ where: { spotId } });
    await tx.session.deleteMany({ where: { spotId } });
    await tx.wikiContent.deleteMany({ where: { spotId } });
    await tx.spot.delete({ where: { id: spotId } });

    await tx.auditLog.create({
      data: {
        action: 'SPOT_DELETED',
        targetType: 'SPOT',
        targetId: spotId,
        adminId,
        metadata: { spotName: spot.name },
      },
    });

    return { spotId: spot.id, spotName: spot.name };
  });
}

export async function revertWiki(spotId: string, adminId: string) {
  return prisma.$transaction(async (tx) => {
    const wiki = await tx.wikiContent.findUnique({
      where: { spotId },
      select: { id: true, content: true },
    });

    if (!wiki) return null;

    const updated = await tx.wikiContent.update({
      where: { spotId },
      data: { content: '', updatedBy: adminId },
      select: { id: true, spotId: true, content: true, updatedAt: true },
    });

    await tx.auditLog.create({
      data: {
        action: 'WIKI_REVERTED',
        targetType: 'WIKI',
        targetId: wiki.id,
        adminId,
        metadata: { spotId, previousContentLength: wiki.content.length },
      },
    });

    return updated;
  });
}

export async function listSpots() {
  const spots = await prisma.spot.findMany({
    select: {
      id: true,
      name: true,
      latitude: true,
      longitude: true,
      createdAt: true,
      creator: { select: { username: true } },
      wikiContent: { select: { id: true, content: true } },
      _count: {
        select: {
          sessions: true,
          conditionReports: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  return spots.map((s) => ({
    id: s.id,
    name: s.name,
    latitude: s.latitude,
    longitude: s.longitude,
    createdAt: s.createdAt,
    creator: s.creator,
    hasWiki: s.wikiContent !== null && s.wikiContent.content.length > 0,
    sessionCount: s._count.sessions,
    conditionReportCount: s._count.conditionReports,
  }));
}

export async function listAuditLogs(options: { page?: number; limit?: number; action?: string }) {
  const page = options.page ?? 1;
  const limit = options.limit ?? 20;
  const skip = (page - 1) * limit;

  const where = options.action ? { action: options.action as any } : {};

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: { admin: { select: { username: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs: logs.map((log) => ({
      id: log.id,
      action: log.action,
      targetType: log.targetType,
      targetId: log.targetId,
      adminUsername: log.admin.username,
      metadata: log.metadata,
      createdAt: log.createdAt,
    })),
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}

export async function getUserProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      photoUrl: true,
      externalLink: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) return null;

  const [sessionCount, spotsVisited] = await Promise.all([
    prisma.session.count({ where: { userId } }),
    prisma.session.groupBy({ by: ['spotId'], where: { userId } }).then((r) => r.length),
  ]);

  return { ...user, stats: { sessionCount, spotsVisited } };
}
