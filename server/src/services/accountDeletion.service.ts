import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/appError.js';
import { logger } from '../utils/logger.js';

const DELETED_USER_ID = '00000000-0000-0000-0000-000000000000';

export async function deleteAccount(userId: string, password: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(404, 'NOT_FOUND', 'User not found');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new AppError(401, 'INVALID_PASSWORD', 'Incorrect password');

  await prisma.$transaction(async (tx) => {
    // 1. Delete tokens
    await tx.emailVerificationToken.deleteMany({ where: { userId } });
    await tx.passwordResetToken.deleteMany({ where: { userId } });

    // 2. Delete condition confirmations by this user
    await tx.conditionConfirmation.deleteMany({ where: { userId } });

    // 3. Delete confirmations on this user's reports, then the reports
    const reportIds = (
      await tx.conditionReport.findMany({
        where: { userId },
        select: { id: true },
      })
    ).map((r) => r.id);

    if (reportIds.length > 0) {
      await tx.conditionConfirmation.deleteMany({
        where: { conditionReportId: { in: reportIds } },
      });
    }
    await tx.conditionReport.deleteMany({ where: { userId } });

    // 4. Delete sessions
    await tx.session.deleteMany({ where: { userId } });

    // 5. Reassign wiki content to sentinel user
    await tx.wikiContent.updateMany({
      where: { updatedBy: userId },
      data: { updatedBy: DELETED_USER_ID },
    });

    // 6. Reassign spots to sentinel user
    await tx.spot.updateMany({
      where: { createdBy: userId },
      data: { createdBy: DELETED_USER_ID },
    });

    // 7. Delete invitation codes
    await tx.invitationCode.deleteMany({ where: { createdBy: userId } });

    // 8. Delete audit logs where user was admin
    await tx.auditLog.deleteMany({ where: { adminId: userId } });

    // 9. Delete user
    await tx.user.delete({ where: { id: userId } });
  });

  logger.info({ userId, username: user.username }, 'Account deleted by user request');
}
