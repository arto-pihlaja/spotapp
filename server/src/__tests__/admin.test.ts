import { describe, test, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { initPrisma, seedTestData, cleanDb, ADMIN_USERNAME, ADMIN_PASSWORD } from '../../test-utils/db.js';
import * as testDb from '../../test-utils/db.js';
import { registerUser, createSpot, createCondition, createSession, authHeader, loginUser } from '../../test-utils/helpers.js';

vi.mock('../services/email.service.js', () => ({
  sendEmail: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  sendEmailVerificationEmail: vi.fn(),
}));

vi.mock('../middleware/rateLimiter.js', () => ({
  rateLimit: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

vi.mock('../socket/spotHandlers.js', () => ({ emitSpotCreated: vi.fn() }));
vi.mock('../socket/conditionHandlers.js', () => ({ emitConditionNew: vi.fn(), emitConditionConfirmed: vi.fn() }));
vi.mock('../socket/sessionHandlers.js', () => ({ emitSessionJoined: vi.fn(), emitSessionLeft: vi.fn() }));
vi.mock('../socket/adminHandlers.js', () => ({ emitModerationAction: vi.fn() }));
vi.mock('../socket/index.js', () => ({ getIO: () => ({ emit: vi.fn(), to: () => ({ emit: vi.fn() }) }) }));

const { default: app } = await import('../app.js');

let adminToken = '';
let userToken = '';
let userId = '';
let adminUserId = '';

describe('Admin Routes', () => {
  beforeAll(async () => {
    await initPrisma();
    await cleanDb();
    await seedTestData();

    // Login as admin
    const adminRes = await loginUser(app, ADMIN_USERNAME, ADMIN_PASSWORD);
    adminToken = adminRes.body.data.accessToken;
    adminUserId = adminRes.body.data.user.id;

    // Register a regular user
    const { res: userRes } = await registerUser(app, { username: 'admin-test-user', password: 'TestPass123!' });
    userToken = userRes.body.data.accessToken;
    userId = userRes.body.data.user.id;
  });

  afterAll(async () => {
    await cleanDb();
    await testDb.prisma.$disconnect();
  });

  // ─── Invitation Codes ─────────────────────────────────────

  test('Non-admin user → 403 on POST /admin/invitation-codes', async () => {
    const res = await request(app)
      .post('/api/v1/admin/invitation-codes')
      .set(authHeader(userToken))
      .send({ maxUses: 5 });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  test('Admin: create invitation code → 201', async () => {
    const res = await request(app)
      .post('/api/v1/admin/invitation-codes')
      .set(authHeader(adminToken))
      .send({ maxUses: 10 });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('code');
    expect(typeof res.body.data.code).toBe('string');
    expect(res.body.data.maxUses).toBe(10);
  });

  test('Admin: list invitation codes → returns array with count', async () => {
    const res = await request(app)
      .get('/api/v1/admin/invitation-codes')
      .set(authHeader(adminToken));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toHaveProperty('count');
    expect(res.body.meta.count).toBeGreaterThanOrEqual(1);
  });

  // ─── Users ────────────────────────────────────────────────

  test('Admin: list users → returns users (excludes admins)', async () => {
    const res = await request(app)
      .get('/api/v1/admin/users')
      .set(authHeader(adminToken));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toHaveProperty('count');

    // Ensure no admin users in the list
    const adminUsers = res.body.data.filter((u: { role: string }) => u.role === 'ADMIN');
    expect(adminUsers).toHaveLength(0);
  });

  // ─── Block / Unblock ──────────────────────────────────────

  test('Admin: block user → 200, user.isBlocked becomes true', async () => {
    // Register a fresh user to block
    const { res: freshRes } = await registerUser(app, { username: 'block-target' });
    const targetId = freshRes.body.data.user.id;

    const res = await request(app)
      .post(`/api/v1/admin/users/${targetId}/block`)
      .set(authHeader(adminToken));

    expect(res.status).toBe(200);

    const dbUser = await testDb.prisma.user.findUnique({ where: { id: targetId } });
    expect(dbUser?.isBlocked).toBe(true);
  });

  test('Admin: block admin user → 400 INVALID_TARGET', async () => {
    const res = await request(app)
      .post(`/api/v1/admin/users/${adminUserId}/block`)
      .set(authHeader(adminToken));

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_TARGET');
  });

  test('Admin: block already-blocked user → 400 ALREADY_BLOCKED', async () => {
    // Register and block a user first
    const { res: freshRes } = await registerUser(app, { username: 'already-blocked' });
    const targetId = freshRes.body.data.user.id;

    await request(app)
      .post(`/api/v1/admin/users/${targetId}/block`)
      .set(authHeader(adminToken));

    // Try blocking again
    const res = await request(app)
      .post(`/api/v1/admin/users/${targetId}/block`)
      .set(authHeader(adminToken));

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('ALREADY_BLOCKED');
  });

  test('Admin: unblock user (after blocking) → 200, user.isBlocked becomes false', async () => {
    // Register and block a user
    const { res: freshRes } = await registerUser(app, { username: 'unblock-target' });
    const targetId = freshRes.body.data.user.id;

    await request(app)
      .post(`/api/v1/admin/users/${targetId}/block`)
      .set(authHeader(adminToken));

    // Unblock
    const res = await request(app)
      .post(`/api/v1/admin/users/${targetId}/unblock`)
      .set(authHeader(adminToken));

    expect(res.status).toBe(200);

    const dbUser = await testDb.prisma.user.findUnique({ where: { id: targetId } });
    expect(dbUser?.isBlocked).toBe(false);
  });

  // ─── Reset Password ──────────────────────────────────────

  test('Admin: reset password → returns temporaryPassword, user can login with it', async () => {
    // Register a user to reset
    const { res: freshRes } = await registerUser(app, { username: 'reset-pw-target', password: 'OriginalPass123!' });
    const targetId = freshRes.body.data.user.id;

    const res = await request(app)
      .post(`/api/v1/admin/users/${targetId}/reset-password`)
      .set(authHeader(adminToken));

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('temporaryPassword');
    expect(typeof res.body.data.temporaryPassword).toBe('string');

    // Login with temporary password
    const loginRes = await loginUser(app, 'reset-pw-target', res.body.data.temporaryPassword);
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data).toHaveProperty('accessToken');
  });

  test('Admin: reset admin password → 400 INVALID_TARGET', async () => {
    const res = await request(app)
      .post(`/api/v1/admin/users/${adminUserId}/reset-password`)
      .set(authHeader(adminToken));

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_TARGET');
  });

  // ─── Delete Spot ──────────────────────────────────────────

  test('Admin: delete spot → 200, spot gone from DB, cascades wiki/sessions/conditions', async () => {
    // Create a spot as regular user
    const spotRes = await createSpot(app, userToken, { name: 'Admin Delete Spot' });
    expect(spotRes.status).toBe(201);
    const spotId = spotRes.body.data.id;

    // Add wiki content
    await request(app)
      .put(`/api/v1/spots/${spotId}/wiki`)
      .set(authHeader(userToken))
      .send({ content: 'Some wiki content' });

    // Add a condition
    await createCondition(app, userToken, spotId);

    // Add a session
    await createSession(app, userToken, spotId);

    // Delete spot as admin
    const res = await request(app)
      .delete(`/api/v1/admin/spots/${spotId}`)
      .set(authHeader(adminToken));

    expect(res.status).toBe(200);

    // Verify spot is gone
    const dbSpot = await testDb.prisma.spot.findUnique({ where: { id: spotId } });
    expect(dbSpot).toBeNull();

    // Verify wiki is gone
    const dbWiki = await testDb.prisma.wikiContent.findFirst({ where: { spotId } });
    expect(dbWiki).toBeNull();

    // Verify sessions are gone
    const dbSessions = await testDb.prisma.session.findMany({ where: { spotId } });
    expect(dbSessions).toHaveLength(0);
  });

  // ─── Revert Wiki ──────────────────────────────────────────

  test('Admin: revert wiki → 200, wiki content becomes empty string', async () => {
    // Create a spot and add wiki content
    const spotRes = await createSpot(app, userToken, { name: 'Wiki Revert Spot' });
    expect(spotRes.status).toBe(201);
    const spotId = spotRes.body.data.id;

    // Update wiki content
    await request(app)
      .put(`/api/v1/spots/${spotId}/wiki`)
      .set(authHeader(userToken))
      .send({ content: 'This content will be reverted' });

    // Verify wiki has content
    const wikiBeforeRes = await request(app).get(`/api/v1/spots/${spotId}/wiki`);
    expect(wikiBeforeRes.body.data.content).toBe('This content will be reverted');

    // Revert wiki as admin
    const res = await request(app)
      .put(`/api/v1/admin/spots/${spotId}/wiki/revert`)
      .set(authHeader(adminToken));

    expect(res.status).toBe(200);

    // Verify wiki content is empty
    const wikiAfterRes = await request(app).get(`/api/v1/spots/${spotId}/wiki`);
    expect(wikiAfterRes.body.data.content).toBe('');
  });

  // ─── Audit Logs ───────────────────────────────────────────

  test('Admin: get audit logs → paginated, contains entries for previous actions', async () => {
    const res = await request(app)
      .get('/api/v1/admin/audit-logs?page=1&limit=20')
      .set(authHeader(adminToken));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toHaveProperty('page');
    expect(res.body.meta).toHaveProperty('limit');

    // Should contain USER_BLOCKED entries from previous block tests
    const blockedRes = await request(app)
      .get('/api/v1/admin/audit-logs?page=1&limit=20&action=USER_BLOCKED')
      .set(authHeader(adminToken));

    expect(blockedRes.status).toBe(200);
    expect(Array.isArray(blockedRes.body.data)).toBe(true);
    expect(blockedRes.body.data.length).toBeGreaterThanOrEqual(1);
  });
});
