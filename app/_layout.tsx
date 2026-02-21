import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(admin)" options={{ title: 'Admin' }} />
        <Stack.Screen name="spot/[spotId]" options={{ title: 'Spot Details' }} />
      </Stack>
      <StatusBar style="auto" />
    </QueryClientProvider>
  );
}
