import { prisma } from '../config/prisma.js';

const CONDITION_EXPIRY_HOURS = 12;

export async function deleteExpiredConditions() {
  const cutoff = new Date(Date.now() - CONDITION_EXPIRY_HOURS * 60 * 60 * 1000);

  const expired = await prisma.conditionReport.findMany({
    where: { createdAt: { lt: cutoff } },
    select: { id: true, spotId: true },
  });

  if (expired.length > 0) {
    const expiredIds = expired.map((r) => r.id);

    await prisma.$transaction([
      prisma.conditionConfirmation.deleteMany({
        where: { conditionReportId: { in: expiredIds } },
      }),
      prisma.conditionReport.deleteMany({
        where: { id: { in: expiredIds } },
      }),
    ]);
  }

  return expired.map((r) => ({ spotId: r.spotId, conditionId: r.id }));
}

interface CreateConditionParams {
  spotId: string;
  userId: string;
  waveHeight?: number;
  windSpeed?: number;
  windDirection?: string;
}

export async function createConditionReport({
  spotId,
  userId,
  waveHeight,
  windSpeed,
  windDirection,
}: CreateConditionParams) {
  return prisma.conditionReport.create({
    data: {
      spotId,
      userId,
      waveHeight: waveHeight ?? null,
      windSpeed: windSpeed ?? null,
      windDirection: windDirection ?? null,
    },
    select: {
      id: true,
      spotId: true,
      waveHeight: true,
      windSpeed: true,
      windDirection: true,
      createdAt: true,
      user: { select: { id: true, username: true } },
    },
  });
}

export async function getConditionsBySpot(spotId: string, userId?: string) {
  const cutoff = new Date(Date.now() - CONDITION_EXPIRY_HOURS * 60 * 60 * 1000);
  return prisma.conditionReport.findMany({
    where: { spotId, createdAt: { gte: cutoff } },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      spotId: true,
      waveHeight: true,
      windSpeed: true,
      windDirection: true,
      createdAt: true,
      user: { select: { id: true, username: true } },
      _count: { select: { confirmations: true } },
      ...(userId
        ? { confirmations: { where: { userId }, select: { id: true } } }
        : {}),
    },
  });
}

export async function confirmCondition(conditionReportId: string, userId: string) {
  await prisma.conditionConfirmation.create({
    data: { conditionReportId, userId },
  });

  const report = await prisma.conditionReport.findUniqueOrThrow({
    where: { id: conditionReportId },
    select: { _count: { select: { confirmations: true } } },
  });

  return report._count.confirmations;
}
