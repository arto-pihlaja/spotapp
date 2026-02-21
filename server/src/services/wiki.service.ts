import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/appError.js';

export async function updateWiki(spotId: string, content: string, userId: string) {
  const spot = await prisma.spot.findUnique({ where: { id: spotId } });
  if (!spot) {
    throw new AppError(404, 'NOT_FOUND', 'Spot not found');
  }

  const wiki = await prisma.wikiContent.upsert({
    where: { spotId },
    update: { content, updatedBy: userId },
    create: { spotId, content, updatedBy: userId },
    select: {
      content: true,
      updatedAt: true,
      editor: { select: { username: true } },
    },
  });

  return {
    content: wiki.content,
    updatedAt: wiki.updatedAt,
    updatedBy: wiki.editor.username,
  };
}

export async function getWikiBySpotId(spotId: string) {
  const spot = await prisma.spot.findUnique({
    where: { id: spotId },
    select: {
      id: true,
      wikiContent: {
        select: {
          content: true,
          updatedAt: true,
          editor: { select: { username: true } },
        },
      },
    },
  });

  if (!spot) {
    throw new AppError(404, 'NOT_FOUND', 'Spot not found');
  }

  if (!spot.wikiContent) {
    return { content: '', updatedAt: null, updatedBy: null };
  }

  return {
    content: spot.wikiContent.content,
    updatedAt: spot.wikiContent.updatedAt,
    updatedBy: spot.wikiContent.editor.username,
  };
}
