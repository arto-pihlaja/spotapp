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
