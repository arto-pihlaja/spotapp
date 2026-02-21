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
