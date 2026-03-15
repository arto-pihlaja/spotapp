import { describe, test, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { initPrisma, seedTestData, cleanDb } from '../../test-utils/db.js';
import * as testDb from '../../test-utils/db.js';
import { registerUser, createSpot, createCondition, createSession, authHeader } from '../../test-utils/helpers.js';

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

let token1 = '';
let token2 = '';
let spotId = '';
let sessionId = '';

describe('Sessions API', () => {
  beforeAll(async () => {
    await initPrisma();
    await cleanDb();
    await seedTestData();

    // Register two users
    const { res: res1 } = await registerUser(app, { username: 'session-user-1' });
    token1 = res1.body.data.accessToken;

    const { res: res2 } = await registerUser(app, { username: 'session-user-2' });
    token2 = res2.body.data.accessToken;

    // Create a spot
    const spotRes = await createSpot(app, token1);
    spotId = spotRes.body.data.id;
  });

  afterAll(async () => {
    await cleanDb();
    await testDb.prisma.$disconnect();
  });

  // ─── Create Sessions ─────────────────────────────────────────

  test('Create NOW session → 201, expiresAt roughly now + 90 minutes', async () => {
    const before = Date.now();

    const res = await request(app)
      .post(`/api/v1/spots/${spotId}/sessions`)
      .set(authHeader(token1))
      .send({ type: 'now', sportType: 'WING_FOIL' });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.type).toBe('NOW');
    expect(res.body.data.sportType).toBe('WING_FOIL');

    const expiresAt = new Date(res.body.data.expiresAt).getTime();
    const expectedExpiry = before + 90 * 60 * 1000;
    // Allow 10 seconds tolerance
    expect(expiresAt).toBeGreaterThan(expectedExpiry - 10_000);
    expect(expiresAt).toBeLessThan(expectedExpiry + 10_000);

    sessionId = res.body.data.id;
  });

  test('Create PLANNED session → 201, expiresAt = scheduledAt + 90min', async () => {
    const scheduledAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // 2 hours from now

    const res = await request(app)
      .post(`/api/v1/spots/${spotId}/sessions`)
      .set(authHeader(token1))
      .send({ type: 'planned', sportType: 'WINDSURF', scheduledAt });

    expect(res.status).toBe(201);
    expect(res.body.data.type).toBe('PLANNED');
    expect(res.body.data.sportType).toBe('WINDSURF');

    const scheduledTime = new Date(scheduledAt).getTime();
    const expiresAt = new Date(res.body.data.expiresAt).getTime();
    // expiresAt should be scheduledAt + 90 min
    expect(expiresAt).toBe(scheduledTime + 90 * 60 * 1000);
  });

  test('Create PLANNED session without scheduledAt → 400', async () => {
    const res = await request(app)
      .post(`/api/v1/spots/${spotId}/sessions`)
      .set(authHeader(token1))
      .send({ type: 'planned', sportType: 'KITE' });

    expect(res.status).toBe(400);
  });

  test('Create session without auth → 401', async () => {
    const res = await request(app)
      .post(`/api/v1/spots/${spotId}/sessions`)
      .send({ type: 'now', sportType: 'OTHER' });

    expect(res.status).toBe(401);
  });

  // ─── Get Sessions ─────────────────────────────────────────────

  test('Get sessions (authenticated) → returns session details with isOwn flag', async () => {
    const res = await request(app)
      .get(`/api/v1/spots/${spotId}/sessions`)
      .set(authHeader(token1));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.meta).toHaveProperty('count');

    // Check that isOwn is present
    const ownSession = res.body.data.find((s: { id: string }) => s.id === sessionId);
    expect(ownSession).toBeTruthy();
    expect(ownSession.isOwn).toBe(true);
  });

  test('Get sessions (anonymous, no auth header) → returns { sessionCount }', async () => {
    const res = await request(app)
      .get(`/api/v1/spots/${spotId}/sessions`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('sessionCount');
    expect(typeof res.body.data.sessionCount).toBe('number');
    expect(res.body.data.sessionCount).toBeGreaterThanOrEqual(1);
  });

  // ─── Delete Sessions ──────────────────────────────────────────

  test('Delete own session → 200, returns { sessionId }', async () => {
    // Create a fresh session to delete
    const createRes = await request(app)
      .post(`/api/v1/spots/${spotId}/sessions`)
      .set(authHeader(token1))
      .send({ type: 'now', sportType: 'WING_FOIL' });

    const newSessionId = createRes.body.data.id;

    const res = await request(app)
      .delete(`/api/v1/spots/${spotId}/sessions/${newSessionId}`)
      .set(authHeader(token1));

    expect(res.status).toBe(200);
    expect(res.body.data.sessionId).toBe(newSessionId);
  });

  test("Delete another user's session → 404 NOT_FOUND", async () => {
    // User 1 creates a session
    const createRes = await request(app)
      .post(`/api/v1/spots/${spotId}/sessions`)
      .set(authHeader(token1))
      .send({ type: 'now', sportType: 'KITE' });

    const user1SessionId = createRes.body.data.id;

    // User 2 tries to delete it
    const res = await request(app)
      .delete(`/api/v1/spots/${spotId}/sessions/${user1SessionId}`)
      .set(authHeader(token2));

    expect(res.status).toBe(404);
    expect(res.body.error.message).toBe('Session not found or not yours');
  });

  test('Delete non-existent session → 404', async () => {
    const fakeId = 'a0000000-0000-4000-a000-000000000099';

    const res = await request(app)
      .delete(`/api/v1/spots/${spotId}/sessions/${fakeId}`)
      .set(authHeader(token1));

    expect(res.status).toBe(404);
  });
});
