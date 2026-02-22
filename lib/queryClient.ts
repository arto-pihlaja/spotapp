import { QueryClient } from '@tanstack/react-query';
import type { Persister, PersistedClient } from '@tanstack/react-query-persist-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // 30 seconds
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const CACHE_KEY = 'spotapp-query-cache';
let throttleTimer: ReturnType<typeof setTimeout> | undefined;

export const asyncStoragePersister: Persister = {
  persistClient: (client: PersistedClient) => {
    return new Promise<void>((resolve) => {
      if (throttleTimer) clearTimeout(throttleTimer);
      throttleTimer = setTimeout(() => {
        AsyncStorage.setItem(CACHE_KEY, JSON.stringify(client)).then(() => resolve());
      }, 1000);
    });
  },
  restoreClient: async () => {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as PersistedClient) : undefined;
  },
  removeClient: () => AsyncStorage.removeItem(CACHE_KEY),
};
