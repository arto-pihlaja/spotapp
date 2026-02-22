import { prisma } from '../config/prisma.js';
import type { SessionType, SportType } from '@prisma/client';

interface CreateSessionParams {
  spotId: string;
  userId: string;
  type: 'now' | 'planned';
  sportType: SportType;
  scheduledAt?: string;
}

export async function createSession({
  spotId,
  userId,
  type,
  sportType,
  scheduledAt,
}: CreateSessionParams) {
  const now = new Date();
  const sessionType: SessionType = type === 'now' ? 'NOW' : 'PLANNED';
  const scheduled = type === 'now' ? now : new Date(scheduledAt!);
  const expires = type === 'now' ? new Date(now.getTime() + 90 * 60 * 1000) : null;

  return prisma.session.create({
    data: {
      spotId,
      userId,
      type: sessionType,
      sportType,
      scheduledAt: scheduled,
      expiresAt: expires,
    },
    select: {
      id: true,
      spotId: true,
      type: true,
      sportType: true,
      scheduledAt: true,
      expiresAt: true,
      createdAt: true,
      user: { select: { id: true, username: true } },
    },
  });
}

export async function getSessionsBySpot(spotId: string) {
  const now = new Date();

  return prisma.session.findMany({
    where: {
      spotId,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: now } },
      ],
    },
    orderBy: { scheduledAt: 'asc' },
    select: {
      id: true,
      spotId: true,
      type: true,
      sportType: true,
      scheduledAt: true,
      expiresAt: true,
      createdAt: true,
      userId: true,
      user: { select: { id: true, username: true } },
    },
  });
}

export async function deleteExpiredSessions(): Promise<{ spotId: string; sessionId: string }[]> {
  const now = new Date();

  const expired = await prisma.session.findMany({
    where: {
      type: 'NOW',
      expiresAt: { lte: now },
    },
    select: { id: true, spotId: true },
  });

  if (expired.length === 0) return [];

  await prisma.session.deleteMany({
    where: {
      id: { in: expired.map((s) => s.id) },
    },
  });

  return expired.map((s) => ({ spotId: s.spotId, sessionId: s.id }));
}

export async function deleteSession(sessionId: string, userId: string) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: { userId: true, spotId: true },
  });

  if (!session) return null;
  if (session.userId !== userId) return null;

  await prisma.session.delete({ where: { id: sessionId } });
  return session;
}
