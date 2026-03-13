import { api } from '@/lib/apiClient';
import type { MeResponse } from '../types';

export async function requestPasswordReset(email: string) {
  const res = await api.post<{ message: string }>('/auth/forgot-password', { email });
  return res.data;
}

export async function executePasswordReset(token: string, newPassword: string) {
  const res = await api.post<{ message: string }>('/auth/reset-password', { token, newPassword });
  return res.data;
}

export async function setEmail(email: string) {
  const res = await api.post<{ message: string }>('/users/me/email', { email });
  return res.data;
}

export async function verifyEmail(token: string) {
  const res = await api.post<{ message: string }>('/auth/verify-email', { token });
  return res.data;
}

export async function fetchMe(): Promise<MeResponse> {
  const res = await api.get<MeResponse>('/users/me');
  return res.data;
}
