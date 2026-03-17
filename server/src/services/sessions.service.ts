import { prisma } from '../config/prisma.js';
import type { SessionType, SportType } from '@prisma/client';
import { SESSION_DURATION_MS, DUPLICATE_WINDOW_MS } from '../config/sessions.js';

interface CreateSessionParams {
  spotId: string;
  userId: string;
  type: 'now' | 'planned';
  sportType: SportType;
  scheduledAt?: string;
}

const sessionSelect = {
  id: true,
  spotId: true,
  type: true,
  sportType: true,
  scheduledAt: true,
  expiresAt: true,
  createdAt: true,
  user: { select: { id: true, username: true } },
} as const;

export async function createSession({
  spotId,
  userId,
  type,
  sportType,
  scheduledAt,
}: CreateSessionParams): Promise<{ session: SessionResult; created: boolean }> {
  const now = new Date();
  const sessionType: SessionType = type === 'now' ? 'NOW' : 'PLANNED';
  const scheduled = type === 'now' ? now : new Date(scheduledAt!);
  const expires = new Date((type === 'now' ? now : scheduled).getTime() + SESSION_DURATION_MS);

  // Check for duplicate: same user, same spot, active, scheduledAt within window
  const windowStart = new Date(scheduled.getTime() - DUPLICATE_WINDOW_MS);
  const windowEnd = new Date(scheduled.getTime() + DUPLICATE_WINDOW_MS);

  const existing = await prisma.session.findFirst({
    where: {
      spotId,
      userId,
      expiresAt: { gt: now },
      scheduledAt: { gte: windowStart, lte: windowEnd },
    },
    select: sessionSelect,
  });

  if (existing) {
    return { session: existing, created: false };
  }

  const session = await prisma.session.create({
    data: {
      spotId,
      userId,
      type: sessionType,
      sportType,
      scheduledAt: scheduled,
      expiresAt: expires,
    },
    select: sessionSelect,
  });

  return { session, created: true };
}

type SessionResult = Awaited<ReturnType<typeof prisma.session.findFirst<{ select: typeof sessionSelect }>>> extends infer T | null ? NonNullable<T> : never;

export async function getSessionsBySpot(spotId: string) {
  const now = new Date();

  return prisma.session.findMany({
    where: {
      spotId,
      expiresAt: { gt: now },
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
