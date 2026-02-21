import { prisma } from '../config/prisma.js';

interface Viewport {
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
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
