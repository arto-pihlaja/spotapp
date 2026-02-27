import { Platform } from 'react-native';
import { useAuthStore } from '@/stores/useAuthStore';
import { refreshTokens } from '@/features/auth/api/auth';

export const BASE_URL = Platform.select({
  web: 'http://localhost:3000/api/v1',
  default: 'http://10.0.2.2:3000/api/v1', // Android emulator → host
});

interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
  error?: { code: string; message: string };
}

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Mutex to prevent concurrent refresh attempts
let refreshPromise: Promise<void> | null = null;

async function request<T>(path: string, options?: RequestInit, isRetry = false): Promise<ApiResponse<T>> {
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

  // Handle 401: attempt token refresh (only once)
  if (res.status === 401 && !isRetry) {
    const storedRefreshToken = useAuthStore.getState().refreshToken;

    if (storedRefreshToken) {
      try {
        // Use mutex so concurrent 401s share a single refresh request
        if (!refreshPromise) {
          refreshPromise = refreshTokens(storedRefreshToken).then((data) => {
            useAuthStore.getState().setTokens(data.accessToken, data.refreshToken, data.user);
          });
        }
        await refreshPromise;
      } catch {
        useAuthStore.getState().clearAuth();
        throw new ApiError(401, 'TOKEN_REFRESH_FAILED', 'Session expired');
      } finally {
        refreshPromise = null;
      }

      // Retry original request with new token
      return request<T>(path, options, true);
    }

    // No refresh token — can't recover
    throw new ApiError(401, 'UNAUTHORIZED', 'Not authenticated');
  }

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
