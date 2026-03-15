import { describe, test, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { initPrisma, seedTestData, cleanDb } from '../../test-utils/db.js';
import * as testDb from '../../test-utils/db.js';
import { registerUser, createSpot, authHeader } from '../../test-utils/helpers.js';

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
let spotId = '';

describe('Spots CRUD', () => {
  beforeAll(async () => {
    await initPrisma();
    await cleanDb();
    await seedTestData();

    // Register a user for authenticated tests
    const { res } = await registerUser(app, { username: 'spots-test-user' });
    accessToken = res.body.data.accessToken;
  });

  afterAll(async () => {
    await cleanDb();
    await testDb.prisma.$disconnect();
  });

  // ─── Create Spot ──────────────────────────────────────────

  test('Create spot → 201, returns spot with expected fields and creates wiki content', async () => {
    const res = await request(app)
      .post('/api/v1/spots')
      .set(authHeader(accessToken))
      .send({ name: 'Tarifa Beach', lat: 36.01, lng: -5.60 });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.name).toBe('Tarifa Beach');
    expect(res.body.data.latitude).toBe(36.01);
    expect(res.body.data.longitude).toBe(-5.60);
    expect(res.body.data).toHaveProperty('createdAt');

    spotId = res.body.data.id;

    // Verify wiki content was created in the database
    const wiki = await testDb.prisma.wikiContent.findUnique({ where: { spotId } });
    expect(wiki).toBeTruthy();
    expect(wiki!.content).toBe('');
  });

  test('Create spot → 400 for name too short (1 char)', async () => {
    const res = await request(app)
      .post('/api/v1/spots')
      .set(authHeader(accessToken))
      .send({ name: 'X', lat: 36.01, lng: -5.60 });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('Create spot → 400 for lat out of range (91)', async () => {
    const res = await request(app)
      .post('/api/v1/spots')
      .set(authHeader(accessToken))
      .send({ name: 'Bad Lat Spot', lat: 91, lng: -5.60 });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('Create spot → 401 without auth', async () => {
    const res = await request(app)
      .post('/api/v1/spots')
      .send({ name: 'No Auth Spot', lat: 36.01, lng: -5.60 });

    expect(res.status).toBe(401);
  });

  // ─── Get Spot by ID ───────────────────────────────────────

  test('Get spot by ID → 200, includes wikiContent', async () => {
    const res = await request(app)
      .get(`/api/v1/spots/${spotId}`)
      .set(authHeader(accessToken));

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(spotId);
    expect(res.body.data.name).toBe('Tarifa Beach');
    expect(res.body.data).toHaveProperty('wikiContent');
    expect(res.body.data.wikiContent).toHaveProperty('content');
  });

  test('Get spot by ID → 404 for non-existent UUID', async () => {
    const fakeId = '00000000-0000-4000-a000-000000000001';
    const res = await request(app)
      .get(`/api/v1/spots/${fakeId}`)
      .set(authHeader(accessToken));

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  test('Get spot by ID → authenticated sees creator info', async () => {
    const res = await request(app)
      .get(`/api/v1/spots/${spotId}`)
      .set(authHeader(accessToken));

    expect(res.status).toBe(200);
    expect(res.body.data.creator).toBeTruthy();
    expect(res.body.data.creator).toHaveProperty('id');
    expect(res.body.data.creator).toHaveProperty('username');
  });

  test('Get spot by ID → anonymous sees creator: null', async () => {
    const res = await request(app)
      .get(`/api/v1/spots/${spotId}`);

    expect(res.status).toBe(200);
    expect(res.body.data.creator).toBeNull();
  });

  // ─── Get Spots by Viewport ────────────────────────────────

  test('Get spots by viewport → returns spots within bounds', async () => {
    // Create a second spot at known coordinates
    const res2 = await createSpot(app, accessToken, {
      name: 'Valdevaqueros',
      lat: 36.08,
      lng: -5.68,
    });
    expect(res2.status).toBe(201);

    // Query viewport that includes both spots (Tarifa area: ~35.9-36.2 lat, ~-5.8 to -5.4 lng)
    const res = await request(app)
      .get('/api/v1/spots')
      .query({ viewport: '35.9,-5.8,36.2,-5.4' });

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    expect(res.body.meta.count).toBeGreaterThanOrEqual(2);

    const names = res.body.data.map((s: { name: string }) => s.name);
    expect(names).toContain('Tarifa Beach');
    expect(names).toContain('Valdevaqueros');
  });

  test('Get spots by viewport → 400 for missing viewport param', async () => {
    const res = await request(app).get('/api/v1/spots');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
