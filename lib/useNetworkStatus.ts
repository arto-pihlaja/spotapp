import { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useUIStore } from '@/stores/useUIStore';
import { flushOfflineQueue } from './offlineQueue';
import { queryClient } from './queryClient';
import { BASE_URL } from './apiClient';

async function pingApi(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${BASE_URL}/health`, { signal: controller.signal });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}

export function useNetworkStatus() {
  useEffect(() => {
    let wasOffline = false;

    // Start optimistic — NetInfo.fetch() often returns false on iOS at startup.
    // The listener below will correct the state if we're actually offline.
    useUIStore.getState().setOffline(false);

    const unsubscribe = NetInfo.addEventListener((state) => {
      void (async () => {
        let offline = state.isConnected === false;
        if (offline) {
          const apiReachable = await pingApi();
          if (apiReachable) offline = false;
        }
        useUIStore.getState().setOffline(offline);

        // Reconnected — flush queue and refresh data
        if (wasOffline && !offline) {
          flushOfflineQueue().then(() => {
            queryClient.invalidateQueries();
          });
        }

        wasOffline = offline;
      })();
    });

    return () => {
      unsubscribe();
    };
  }, []);
}
