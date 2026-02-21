import { api } from '@/lib/apiClient';
import type { LoginResponse } from '../types';

export async function loginUser(input: { username: string; password: string }): Promise<LoginResponse> {
  const res = await api.post<LoginResponse>('/auth/login', input);
  return res.data;
}
