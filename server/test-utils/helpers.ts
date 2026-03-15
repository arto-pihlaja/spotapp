import type { Express } from 'express';
import request from 'supertest';

interface RegisterOverrides {
  username?: string;
  password?: string;
  invitationCode?: string;
}

export async function registerUser(app: Express, overrides: RegisterOverrides = {}) {
  const body = {
    username: overrides.username ?? 'testuser-' + Date.now(),
    password: overrides.password ?? 'TestPass123!',
    invitationCode: overrides.invitationCode ?? 'TEST-INVITE',
    _hp: '',
    _ts: Date.now() - 10_000, // bypass timeCheck(5000)
  };

  const res = await request(app).post('/api/v1/auth/register').send(body);
  return { res, body };
}

export async function loginUser(app: Express, username: string, password: string) {
  return request(app).post('/api/v1/auth/login').send({ username, password });
}

export function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function createSpot(app: Express, token: string, overrides?: { name?: string; lat?: number; lng?: number }) {
  return request(app)
    .post('/api/v1/spots')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: overrides?.name ?? 'Test Spot ' + Date.now(),
      lat: overrides?.lat ?? 36.01,
      lng: overrides?.lng ?? -5.60,
    });
}

export async function createCondition(
  app: Express,
  token: string,
  spotId: string,
  overrides?: { waveHeight?: number; windSpeed?: number; windDirection?: number },
) {
  return request(app)
    .post(`/api/v1/spots/${spotId}/conditions`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      waveHeight: overrides?.waveHeight ?? 1.0,
      windSpeed: overrides?.windSpeed ?? 12,
      windDirection: overrides?.windDirection ?? 180,
    });
}

export async function createSession(
  app: Express,
  token: string,
  spotId: string,
  overrides?: { type?: string; sportType?: string; scheduledAt?: string },
) {
  return request(app)
    .post(`/api/v1/spots/${spotId}/sessions`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      type: overrides?.type ?? 'now',
      sportType: overrides?.sportType ?? 'WING_FOIL',
      ...(overrides?.scheduledAt ? { scheduledAt: overrides.scheduledAt } : {}),
    });
}
