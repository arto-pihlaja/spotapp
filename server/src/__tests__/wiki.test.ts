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

let token = '';
let spotId = '';
let username = '';

describe('Wiki API', () => {
  beforeAll(async () => {
    await initPrisma();
    await cleanDb();
    await seedTestData();

    // Register a user
    username = 'wiki-user-' + Date.now();
    const { res } = await registerUser(app, { username });
    token = res.body.data.accessToken;

    // Create a spot (which auto-creates an empty wiki)
    const spotRes = await createSpot(app, token);
    spotId = spotRes.body.data.id;
  });

  afterAll(async () => {
    await cleanDb();
    await testDb.prisma.$disconnect();
  });

  // ─── Get Wiki ─────────────────────────────────────────────────

  test('Get wiki → returns content (empty after spot creation)', async () => {
    const res = await request(app)
      .get(`/api/v1/spots/${spotId}/wiki`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('content');
    expect(typeof res.body.data.content).toBe('string');
  });

  test('Get wiki for non-existent spot → 404', async () => {
    const fakeSpotId = 'a0000000-0000-4000-a000-000000000099';

    const res = await request(app)
      .get(`/api/v1/spots/${fakeSpotId}/wiki`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  // ─── Update Wiki ──────────────────────────────────────────────

  test('Update wiki → 200, content updated, updatedBy matches user', async () => {
    const newContent = 'This is the wiki content for the test spot.';

    const res = await request(app)
      .put(`/api/v1/spots/${spotId}/wiki`)
      .set(authHeader(token))
      .send({ content: newContent });

    expect(res.status).toBe(200);
    expect(res.body.data.content).toBe(newContent);
    expect(res.body.data.updatedBy).toBe(username);
    expect(res.body.data.updatedAt).toBeTruthy();
  });

  test('Update wiki upsert → works even if wiki was deleted', async () => {
    // Delete the wiki record directly to simulate missing wiki
    await testDb.prisma.wikiContent.deleteMany({ where: { spotId } });

    const upsertContent = 'Upserted wiki content after deletion.';

    const res = await request(app)
      .put(`/api/v1/spots/${spotId}/wiki`)
      .set(authHeader(token))
      .send({ content: upsertContent });

    expect(res.status).toBe(200);
    expect(res.body.data.content).toBe(upsertContent);
    expect(res.body.data.updatedBy).toBe(username);
  });

  test('Update wiki → 401 without auth', async () => {
    const res = await request(app)
      .put(`/api/v1/spots/${spotId}/wiki`)
      .send({ content: 'Should not work' });

    expect(res.status).toBe(401);
  });

  // ─── Get Wiki After Update ────────────────────────────────────

  test('Get wiki after update → shows new content + editor info', async () => {
    const updatedContent = 'Final updated wiki content.';

    await request(app)
      .put(`/api/v1/spots/${spotId}/wiki`)
      .set(authHeader(token))
      .send({ content: updatedContent });

    const res = await request(app)
      .get(`/api/v1/spots/${spotId}/wiki`);

    expect(res.status).toBe(200);
    expect(res.body.data.content).toBe(updatedContent);
    expect(res.body.data.updatedBy).toBe(username);
    expect(res.body.data.updatedAt).toBeTruthy();
  });
});
