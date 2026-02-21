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

export async function getSpotsByViewport(viewport: Viewport) {
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
    },
    orderBy: { name: 'asc' },
  });

  return spots;
}
