// Re-export the app's prisma client so tests use the same DB connection
// This is imported dynamically to ensure test env is loaded first
let _prisma: import('@prisma/client').PrismaClient;

export async function getPrisma() {
  if (!_prisma) {
    const mod = await import('../src/config/prisma.js');
    _prisma = mod.prisma;
  }
  return _prisma;
}

// For convenience in beforeAll/afterAll (call after dynamic import resolves)
export let prisma: import('@prisma/client').PrismaClient;

export async function initPrisma() {
  prisma = await getPrisma();
}

const DELETED_USER_ID = '00000000-0000-0000-0000-000000000000';

export const ADMIN_USERNAME = 'test-admin-active';
export const ADMIN_PASSWORD = 'AdminPass123!';

/** Ensure sentinel [deleted] user, admin user, and a test invitation code exist. */
export async function seedTestData() {
  await prisma.user.upsert({
    where: { id: DELETED_USER_ID },
    update: {},
    create: {
      id: DELETED_USER_ID,
      username: '[deleted]',
      passwordHash: 'NOLOGIN',
      role: 'USER',
      isBlocked: true,
    },
  });

  const admin = await prisma.user.upsert({
    where: { username: 'test-admin' },
    update: {},
    create: {
      username: 'test-admin',
      passwordHash: 'NOLOGIN',
      role: 'ADMIN',
      isBlocked: true,
    },
  });

  // Loginable admin user for admin tests
  const bcrypt = await import('bcryptjs');
  const adminHash = await bcrypt.default.hash(ADMIN_PASSWORD, 4); // low rounds for speed
  await prisma.user.upsert({
    where: { username: ADMIN_USERNAME },
    update: { passwordHash: adminHash },
    create: {
      username: ADMIN_USERNAME,
      passwordHash: adminHash,
      role: 'ADMIN',
    },
  });

  await prisma.invitationCode.upsert({
    where: { code: 'TEST-INVITE' },
    update: { currentUses: 0 },
    create: {
      code: 'TEST-INVITE',
      maxUses: 100,
      createdBy: admin.id,
    },
  });
}

/** Delete all test data in FK-safe order. */
export async function cleanDb() {
  await prisma.conditionConfirmation.deleteMany();
  await prisma.conditionReport.deleteMany();
  await prisma.session.deleteMany();
  await prisma.wikiContent.deleteMany();
  await prisma.spot.deleteMany();
  await prisma.emailVerificationToken.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.invitationCode.deleteMany();
  await prisma.user.deleteMany({
    where: { id: { not: DELETED_USER_ID } },
  });
}
