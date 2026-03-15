import { describe, test, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { initPrisma, seedTestData, cleanDb } from '../../test-utils/db.js';
import * as testDb from '../../test-utils/db.js';
import { registerUser, createSpot, createCondition, authHeader } from '../../test-utils/helpers.js';

vi.mock('../services/email.service.js', () => ({
  sendEmail: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  sendEmailVerificationEmail: vi.fn(),
}));

vi.mock('../middleware/rateLimiter.js', () => ({
  rateLimit: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

// Mock socket emissions (they require server instance)
vi.mock('../socket/spotHandlers.js', () => ({ emitSpotCreated: vi.fn() }));
vi.mock('../socket/conditionHandlers.js', () => ({ emitConditionNew: vi.fn(), emitConditionConfirmed: vi.fn() }));
vi.mock('../socket/sessionHandlers.js', () => ({ emitSessionJoined: vi.fn(), emitSessionLeft: vi.fn() }));
vi.mock('../socket/adminHandlers.js', () => ({ emitModerationAction: vi.fn() }));
vi.mock('../socket/index.js', () => ({ getIO: () => ({ emit: vi.fn(), to: () => ({ emit: vi.fn() }) }) }));

const { default: app } = await import('../app.js');

let accessToken = '';
let secondToken = '';
let spotId = '';
let conditionId = '';

describe('Conditions', () => {
  beforeAll(async () => {
    await initPrisma();
    await cleanDb();
    await seedTestData();

    // Register two users
    const { res: res1 } = await registerUser(app, { username: 'cond-user-1' });
    accessToken = res1.body.data.accessToken;

    const { res: res2 } = await registerUser(app, { username: 'cond-user-2' });
    secondToken = res2.body.data.accessToken;

    // Create a spot for condition tests
    const spotRes = await createSpot(app, accessToken, {
      name: 'Condition Test Spot',
      lat: 36.01,
      lng: -5.60,
    });
    spotId = spotRes.body.data.id;
  });

  afterAll(async () => {
    await cleanDb();
    await testDb.prisma.$disconnect();
  });

  // ─── Create Condition ─────────────────────────────────────

  test('Create condition report → 201 with valid data', async () => {
    const res = await request(app)
      .post(`/api/v1/spots/${spotId}/conditions`)
      .set(authHeader(accessToken))
      .send({ waveHeight: 1.0, windSpeed: 12, windDirection: 180 });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.spotId).toBe(spotId);
    expect(res.body.data.waveHeight).toBe(1.0);
    expect(res.body.data.windSpeed).toBe(12);
    expect(res.body.data.windDirection).toBe(180);
    expect(res.body.data).toHaveProperty('createdAt');

    conditionId = res.body.data.id;
  });

  test('Create condition → 400 for invalid waveHeight (0.3 — not 0.5 increment)', async () => {
    const res = await request(app)
      .post(`/api/v1/spots/${spotId}/conditions`)
      .set(authHeader(accessToken))
      .send({ waveHeight: 0.3 });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('Create condition → 400 for windSpeed not 2-increment (3)', async () => {
    const res = await request(app)
      .post(`/api/v1/spots/${spotId}/conditions`)
      .set(authHeader(accessToken))
      .send({ windSpeed: 3 });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('Create condition → 400 for windDirection not 5-increment (7)', async () => {
    const res = await request(app)
      .post(`/api/v1/spots/${spotId}/conditions`)
      .set(authHeader(accessToken))
      .send({ windDirection: 7 });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('Create condition → 400 for out-of-range values (waveHeight: 3.0, windSpeed: 22)', async () => {
    const res = await request(app)
      .post(`/api/v1/spots/${spotId}/conditions`)
      .set(authHeader(accessToken))
      .send({ waveHeight: 3.0, windSpeed: 22 });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('Create condition → 401 without auth', async () => {
    const res = await request(app)
      .post(`/api/v1/spots/${spotId}/conditions`)
      .send({ waveHeight: 1.0 });

    expect(res.status).toBe(401);
  });

  // ─── Get Conditions ───────────────────────────────────────

  test('Get conditions → authenticated sees reporter info + hasConfirmed flag', async () => {
    const res = await request(app)
      .get(`/api/v1/spots/${spotId}/conditions`)
      .set(authHeader(accessToken));

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.meta.count).toBeGreaterThanOrEqual(1);

    const condition = res.body.data[0];
    expect(condition).toHaveProperty('reporter');
    expect(condition.reporter).toHaveProperty('id');
    expect(condition.reporter).toHaveProperty('username');
    expect(condition).toHaveProperty('hasConfirmed');
    expect(condition).toHaveProperty('confirmCount');
  });

  test('Get conditions → anonymous sees no reporter info', async () => {
    const res = await request(app)
      .get(`/api/v1/spots/${spotId}/conditions`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);

    const condition = res.body.data[0];
    expect(condition).not.toHaveProperty('reporter');
    expect(condition).toHaveProperty('confirmCount');
  });

  // ─── Confirm Condition ────────────────────────────────────

  test('Confirm condition → 201, returns confirmCount: 1', async () => {
    const res = await request(app)
      .post(`/api/v1/spots/${spotId}/conditions/${conditionId}/confirm`)
      .set(authHeader(secondToken));

    expect(res.status).toBe(201);
    expect(res.body.data.conditionId).toBe(conditionId);
    expect(res.body.data.confirmCount).toBe(1);
  });

  test('Confirm same condition again → 409 ALREADY_CONFIRMED', async () => {
    const res = await request(app)
      .post(`/api/v1/spots/${spotId}/conditions/${conditionId}/confirm`)
      .set(authHeader(secondToken));

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('ALREADY_CONFIRMED');
  });

  test('Confirm non-existent condition → should handle gracefully', async () => {
    const fakeConditionId = '00000000-0000-4000-a000-000000000099';
    const res = await request(app)
      .post(`/api/v1/spots/${spotId}/conditions/${fakeConditionId}/confirm`)
      .set(authHeader(secondToken));

    // Should be a server error or 404 — not a 201
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});
