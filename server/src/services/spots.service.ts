import { prisma } from '../config/prisma.js';

interface Viewport {
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
}

interface CreateSpotParams {
  name: string;
  lat: number;
  lng: number;
  userId: string;
}

export async function createSpot({ name, lat, lng, userId }: CreateSpotParams) {
  return prisma.$transaction(async (tx) => {
    const spot = await tx.spot.create({
      data: {
        name,
        latitude: lat,
        longitude: lng,
        createdBy: userId,
      },
      select: {
        id: true,
        name: true,
        latitude: true,
        longitude: true,
        createdAt: true,
      },
    });

    await tx.wikiContent.create({
      data: {
        spotId: spot.id,
        content: '',
        updatedBy: userId,
      },
    });

    return spot;
  });
}

export async function getSpotById(spotId: string) {
  return prisma.spot.findUnique({
    where: { id: spotId },
    select: {
      id: true,
      name: true,
      latitude: true,
      longitude: true,
      createdAt: true,
      creator: { select: { id: true, username: true } },
      wikiContent: { select: { content: true, updatedAt: true } },
    },
  });
}

interface TimeFilter {
  timeFrom?: string;
  timeTo?: string;
}

export async function getSpotsByViewport(viewport: Viewport, timeFilter?: TimeFilter) {
  const spots = await prisma.spot.findMany({
    where: {
      latitude: { gte: viewport.swLat, lte: viewport.neLat },
      longitude: { gte: viewport.swLng, lte: viewport.neLng },
    },
    select: {
      id: true,
      name: true,
      latitude: true,
      longitude: true,
      createdAt: true,
      conditionReports: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          waveHeight: true,
          windSpeed: true,
          windDirection: true,
          createdAt: true,
        },
      },
      _count: {
        select: {
          sessions: {
            where: {
              AND: [
                // Not expired
                {
                  OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: new Date() } },
                  ],
                },
                // Within time window (if specified)
                ...(timeFilter?.timeFrom
                  ? [{ scheduledAt: { gte: new Date(timeFilter.timeFrom) } }]
                  : []),
                ...(timeFilter?.timeTo
                  ? [{ scheduledAt: { lte: new Date(timeFilter.timeTo) } }]
                  : []),
              ],
            },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  return spots.map((spot) => ({
    id: spot.id,
    name: spot.name,
    latitude: spot.latitude,
    longitude: spot.longitude,
    createdAt: spot.createdAt,
    sessionCount: spot._count.sessions,
    latestCondition: spot.conditionReports[0]
      ? {
          waveHeight: spot.conditionReports[0].waveHeight,
          windSpeed: spot.conditionReports[0].windSpeed,
          windDirection: spot.conditionReports[0].windDirection,
          createdAt: spot.conditionReports[0].createdAt,
        }
      : null,
  }));
}
