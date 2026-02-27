import { api, BASE_URL } from '@/lib/apiClient';
import type { LoginResponse } from '../types';

export async function loginUser(input: { username: string; password: string }): Promise<LoginResponse> {
  const res = await api.post<LoginResponse>('/auth/login', input);
  return res.data;
}

/**
 * Refresh tokens using a refresh token. Calls fetch directly to avoid
 * circular 401 handling in the API client.
 */
export async function refreshTokens(refreshToken: string): Promise<LoginResponse> {
  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(json?.error?.message ?? 'Token refresh failed');
  }

  if (!json?.data) {
    throw new Error('Invalid refresh response');
  }

  return json.data as LoginResponse;
}
