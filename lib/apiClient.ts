import { Platform } from 'react-native';
import { useAuthStore } from '@/stores/useAuthStore';

const BASE_URL = Platform.select({
  web: 'http://localhost:3000/api/v1',
  default: 'http://10.0.2.2:3000/api/v1', // Android emulator → host
});

interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
  error?: { code: string; message: string };
}

class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const url = `${BASE_URL}${path}`;
  const token = useAuthStore.getState().accessToken;

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  const json = await res.json();

  if (!res.ok) {
    throw new ApiError(res.status, json.error?.code ?? 'UNKNOWN', json.error?.message ?? 'Request failed');
  }

  return json as ApiResponse<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
