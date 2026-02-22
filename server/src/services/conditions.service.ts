import { prisma } from '../config/prisma.js';

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
  return prisma.conditionReport.findMany({
    where: { spotId },
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
