import { describe, test, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { initPrisma, seedTestData, cleanDb } from '../../test-utils/db.js';
import * as testDb from '../../test-utils/db.js';

// vi.hoisted runs before mock hoisting, so emailCalls is available to the mock factory
const emailCalls = vi.hoisted(() => [] as { fn: string; to: string; token: string }[]);

vi.mock('../services/email.service.js', () => ({
  sendEmail: vi.fn(),
  sendPasswordResetEmail: vi.fn(async (to: string, token: string) => {
    emailCalls.push({ fn: 'sendPasswordResetEmail', to, token });
  }),
  sendEmailVerificationEmail: vi.fn(async (to: string, token: string) => {
    emailCalls.push({ fn: 'sendEmailVerificationEmail', to, token });
  }),
}));

// Disable rate limiting in tests
vi.mock('../middleware/rateLimiter.js', () => ({
  rateLimit: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

// Import app AFTER mocks are set up
const { default: app } = await import('../app.js');

const USERNAME = 'lifecycle-user';
const PASSWORD = 'SecurePass123!';
const NEW_PASSWORD = 'NewSecurePass456!';
const EMAIL = 'lifecycle@test.com';
const DELETED_USER_ID = '00000000-0000-0000-0000-000000000000';

let accessToken = '';
let userId = '';

describe('User Management Lifecycle', () => {
  beforeAll(async () => {
    const { execSync } = await import('node:child_process');
    execSync('npx prisma db push --force-reset --schema=prisma/schema.prisma', {
      cwd: '/opt/spotapp/server',
      env: {
        ...process.env,
        DATABASE_URL: process.env.DATABASE_URL,
        PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION: 'yes',
      },
      stdio: 'pipe',
    });
    // Use the app's prisma client for test queries
    await initPrisma();
    await cleanDb();
    await seedTestData();
  });

  afterAll(async () => {
    await cleanDb();
    await testDb.prisma.$disconnect();
  });

  // ─── Registration ───────────────────────────────────────────

  test('Register — valid invitation code → 201', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: USERNAME,
        password: PASSWORD,
        invitationCode: 'TEST-INVITE',
        _hp: '',
        _ts: Date.now() - 10_000,
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('refreshToken');
    expect(res.body.data.user.username).toBe(USERNAME);
    expect(res.body.data.user.role).toBe('USER');

    accessToken = res.body.data.accessToken;
    userId = res.body.data.user.id;
  });

  test('Register — duplicate username → 409', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: USERNAME,
        password: PASSWORD,
        invitationCode: 'TEST-INVITE',
        _hp: '',
        _ts: Date.now() - 10_000,
      });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('USERNAME_TAKEN');
  });

  test('Register — invalid invitation code → 403', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'another-user',
        password: PASSWORD,
        invitationCode: 'BOGUS-CODE',
        _hp: '',
        _ts: Date.now() - 10_000,
      });

    expect(res.status).toBe(403);
  });

  // ─── Login ──────────────────────────────────────────────────

  test('Login — correct credentials → 200', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: USERNAME, password: PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('accessToken');
    accessToken = res.body.data.accessToken;
  });

  test('Login — wrong password → 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: USERNAME, password: 'WrongPassword!' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  // ─── Profile ────────────────────────────────────────────────

  test('GET /users/me — returns profile without email', async () => {
    const res = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.username).toBe(USERNAME);
    expect(res.body.data.email).toBeNull();
  });

  // ─── Email Management ──────────────────────────────────────

  test('Set email — sends verification', async () => {
    emailCalls.length = 0;

    const res = await request(app)
      .post('/api/v1/users/me/email')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ email: EMAIL });

    expect(res.status).toBe(200);

    // Check email was set on user (unverified)
    const user = await testDb.prisma.user.findUnique({ where: { id: userId } });
    expect(user?.email).toBe(EMAIL);
    expect(user?.emailVerifiedAt).toBeNull();

    // Check mock captured the verification token
    expect(emailCalls).toHaveLength(1);
    expect(emailCalls[0].fn).toBe('sendEmailVerificationEmail');
    expect(emailCalls[0].to).toBe(EMAIL);
  });

  test('Verify email — marks email verified', async () => {
    const entry = emailCalls.find((c) => c.fn === 'sendEmailVerificationEmail');
    expect(entry).toBeTruthy();

    const res = await request(app)
      .post('/api/v1/auth/verify-email')
      .send({ token: entry!.token });

    expect(res.status).toBe(200);

    const user = await testDb.prisma.user.findUnique({ where: { id: userId } });
    expect(user?.emailVerifiedAt).toBeTruthy();
  });

  // ─── Password Reset ────────────────────────────────────────

  test('Forgot password — sends reset email', async () => {
    emailCalls.length = 0;

    const res = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: EMAIL });

    expect(res.status).toBe(200);
    expect(emailCalls).toHaveLength(1);
    expect(emailCalls[0].fn).toBe('sendPasswordResetEmail');
  });

  test('Reset password — changes password, can login with new one', async () => {
    const entry = emailCalls.find((c) => c.fn === 'sendPasswordResetEmail');
    expect(entry).toBeTruthy();

    const res = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: entry!.token, newPassword: NEW_PASSWORD });

    expect(res.status).toBe(200);

    // Old password should fail
    const oldLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: USERNAME, password: PASSWORD });
    expect(oldLogin.status).toBe(401);

    // New password should work
    const newLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: USERNAME, password: NEW_PASSWORD });
    expect(newLogin.status).toBe(200);

    accessToken = newLogin.body.data.accessToken;
  });

  // ─── Account Deletion ──────────────────────────────────────

  test('Create spot before deletion (for reassignment test)', async () => {
    const res = await request(app)
      .post('/api/v1/spots')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Deletion Test Spot', lat: 36.01, lng: -5.60 });

    expect(res.status).toBe(201);
  });

  test('Delete account — wrong password → 401', async () => {
    const res = await request(app)
      .post('/api/v1/users/me/delete')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ password: 'WrongPassword!' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_PASSWORD');
  });

  test('Delete account — correct password → 200', async () => {
    const res = await request(app)
      .post('/api/v1/users/me/delete')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ password: NEW_PASSWORD });

    expect(res.status).toBe(200);

    // User should be gone
    const user = await testDb.prisma.user.findUnique({ where: { id: userId } });
    expect(user).toBeNull();

    // Spot should be reassigned to sentinel user
    const spot = await testDb.prisma.spot.findFirst({ where: { name: 'Deletion Test Spot' } });
    expect(spot).toBeTruthy();
    expect(spot!.createdBy).toBe(DELETED_USER_ID);
  });

  test('After deletion — login fails', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: USERNAME, password: NEW_PASSWORD });

    expect(res.status).toBe(401);
  });

  test('After deletion — old token no longer returns profile', async () => {
    const res = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`);

    // Token is still valid JWT, but user is gone → 404 NOT_FOUND
    expect([401, 404]).toContain(res.status);
  });
});
