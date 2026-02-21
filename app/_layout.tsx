import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <Stack>
        <Stack.Screen name="index" options={{ title: 'SpotApp' }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(admin)" options={{ title: 'Admin' }} />
        <Stack.Screen name="spot/[spotId]" options={{ title: 'Spot Details' }} />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
