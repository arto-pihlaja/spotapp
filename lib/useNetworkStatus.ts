import { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useUIStore } from '@/stores/useUIStore';
import { flushOfflineQueue } from './offlineQueue';
import { queryClient } from './queryClient';

export function useNetworkStatus() {
  useEffect(() => {
    let wasOffline = false;

    // Set initial state
    NetInfo.fetch().then((state) => {
      const offline = !state.isConnected;
      wasOffline = offline;
      useUIStore.getState().setOffline(offline);
    });

    const unsubscribe = NetInfo.addEventListener((state) => {
      const offline = !state.isConnected;
      useUIStore.getState().setOffline(offline);

      // Reconnected — flush queue and refresh data
      if (wasOffline && !offline) {
        flushOfflineQueue().then(() => {
          queryClient.invalidateQueries();
        });
      }

      wasOffline = offline;
    });

    return () => {
      unsubscribe();
    };
  }, []);
}
