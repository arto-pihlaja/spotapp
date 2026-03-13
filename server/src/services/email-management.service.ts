import crypto from 'node:crypto';
import { prisma } from '../config/prisma.js';
import { sendEmailVerificationEmail } from './email.service.js';
import { AppError } from '../utils/appError.js';

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function setEmail(userId: string, email: string): Promise<void> {
  // Check email not taken by another user
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existing && existing.id !== userId) {
    throw new AppError(409, 'EMAIL_TAKEN', 'This email is already in use');
  }

  // Save email on user, null out emailVerifiedAt
  await prisma.user.update({
    where: { id: userId },
    data: { email, emailVerifiedAt: null },
  });

  // Delete old verification tokens for this user
  await prisma.emailVerificationToken.deleteMany({
    where: { userId, usedAt: null },
  });

  // Generate and send verification token
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);

  await prisma.emailVerificationToken.create({
    data: {
      userId,
      email,
      tokenHash,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
  });

  await sendEmailVerificationEmail(email, rawToken);
}

export async function verifyEmail(token: string): Promise<void> {
  const tokenHash = hashToken(token);

  const verificationToken = await prisma.emailVerificationToken.findFirst({
    where: {
      tokenHash,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (!verificationToken) {
    throw new AppError(400, 'INVALID_TOKEN', 'Invalid or expired verification token');
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: verificationToken.userId },
      data: {
        email: verificationToken.email,
        emailVerifiedAt: new Date(),
      },
    }),
    prisma.emailVerificationToken.update({
      where: { id: verificationToken.id },
      data: { usedAt: new Date() },
    }),
  ]);
}
