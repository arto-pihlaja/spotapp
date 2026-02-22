import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useSocket } from '@/lib/useSocket';

function SocketProvider({ children }: { children: React.ReactNode }) {
  useSocket();
  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SocketProvider>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(admin)" options={{ title: 'Admin' }} />
          <Stack.Screen name="spot/[spotId]" options={{ title: 'Spot Details' }} />
        </Stack>
        <StatusBar style="auto" />
      </SocketProvider>
    </QueryClientProvider>
  );
}
