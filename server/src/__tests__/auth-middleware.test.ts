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

let userToken = '';
let spotId = '';

describe('Auth Middleware', () => {
  beforeAll(async () => {
    await initPrisma();
    await cleanDb();
    await seedTestData();

    // Register a regular user and create a spot for optionalAuth tests
    const { res } = await registerUser(app, { username: 'middleware-test-user' });
    userToken = res.body.data.accessToken;

    const spotRes = await createSpot(app, userToken, { name: 'Middleware Test Spot' });
    spotId = spotRes.body.data.id;
  });

  afterAll(async () => {
    await cleanDb();
    await testDb.prisma.$disconnect();
  });

  // ─── requireAuth ──────────────────────────────────────────

  test('No auth header on protected route → 401 UNAUTHORIZED', async () => {
    const res = await request(app).get('/api/v1/users/me');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  test('Invalid/malformed token → 401 UNAUTHORIZED', async () => {
    const res = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', 'Bearer not-a-valid-jwt-token');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  test('Expired token → 401', async () => {
    const jwt = await import('jsonwebtoken');
    const { env } = await import('../config/env.js');

    // Sign a token that expires immediately (0 seconds)
    const expiredToken = jwt.default.sign(
      { userId: '00000000-0000-0000-0000-000000000001', role: 'USER' },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '0s' },
    );

    // Small delay to ensure token is expired
    await new Promise((resolve) => setTimeout(resolve, 50));

    const res = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  test('Blocked user token → 403 ACCOUNT_BLOCKED', async () => {
    // Register a fresh user
    const { res: regRes } = await registerUser(app, { username: 'blocked-middleware-user' });
    const blockedUserId = regRes.body.data.user.id;
    const blockedToken = regRes.body.data.accessToken;

    // Block the user directly in DB
    await testDb.prisma.user.update({
      where: { id: blockedUserId },
      data: { isBlocked: true },
    });

    // Try to access a protected route
    const res = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${blockedToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('ACCOUNT_BLOCKED');
  });

  // ─── requireRole ──────────────────────────────────────────

  test('Admin role required → regular user gets 403 FORBIDDEN', async () => {
    const res = await request(app)
      .get('/api/v1/admin/users')
      .set(authHeader(userToken));

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  // ─── optionalAuth ─────────────────────────────────────────

  test('optionalAuth route (GET /spots/:spotId) → works without auth header', async () => {
    const res = await request(app).get(`/api/v1/spots/${spotId}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('id', spotId);
  });

  test('optionalAuth route with expired token → 401 UNAUTHORIZED', async () => {
    const jwt = await import('jsonwebtoken');
    const { env } = await import('../config/env.js');

    const expiredToken = jwt.default.sign(
      { userId: '00000000-0000-0000-0000-000000000001', role: 'USER' },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '0s' },
    );

    await new Promise((resolve) => setTimeout(resolve, 50));

    const res = await request(app)
      .get(`/api/v1/spots/${spotId}`)
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  test('optionalAuth route → works with valid auth header', async () => {
    const res = await request(app)
      .get(`/api/v1/spots/${spotId}`)
      .set(authHeader(userToken));

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('id', spotId);
  });
});
