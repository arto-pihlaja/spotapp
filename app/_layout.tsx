import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient, asyncStoragePersister } from '@/lib/queryClient';
import { useSocket } from '@/lib/useSocket';
import { useNetworkStatus } from '@/lib/useNetworkStatus';
import { restoreQueueToUI } from '@/lib/offlineQueue';
import OfflineBanner from '@/components/OfflineBanner';
import Toast from '@/components/Toast';

function SocketProvider({ children }: { children: React.ReactNode }) {
  useSocket();
  return <>{children}</>;
}

function NetworkWatcher() {
  useNetworkStatus();
  useEffect(() => {
    restoreQueueToUI();
  }, []);
  return null;
}

export default function RootLayout() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: asyncStoragePersister,
        maxAge: 1000 * 60 * 60 * 24, // 24 hours
      }}
    >
      <NetworkWatcher />
      <SocketProvider>
        <OfflineBanner />
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(admin)" options={{ title: 'Admin' }} />
          <Stack.Screen name="spot/[spotId]" options={{ title: 'Spot Details' }} />
        </Stack>
        <Toast />
        <StatusBar style="auto" />
      </SocketProvider>
    </PersistQueryClientProvider>
  );
}
