import Constants from 'expo-constants';
import { Platform } from 'react-native';

function getServerUrl(): string {
  // 1. Explicit env var always wins
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (envUrl) {
    if (__DEV__) console.log(`[SpotApp] API URL (env): ${envUrl}`);
    return envUrl;
  }

  // 2. On native + dev: extract host IP from Expo dev server
  if (__DEV__ && Platform.OS !== 'web') {
    // Try multiple paths — varies by Expo SDK version and launch mode
    const hostUri =
      Constants.expoConfig?.hostUri ??
      (Constants as any).manifest?.debuggerHost ??
      (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;

    if (__DEV__) {
      console.log(`[SpotApp] hostUri: ${hostUri ?? 'undefined'}`);
      console.log(`[SpotApp] expoConfig keys: ${JSON.stringify(Object.keys(Constants.expoConfig ?? {}))}`);
    }

    if (hostUri) {
      const host = hostUri.split(':')[0];
      // Skip tunnel URLs — they only serve Metro, not the API
      if (!host.includes('.') || /^\d+\.\d+\.\d+\.\d+$/.test(host)) {
        const url = `http://${host}:3000`;
        console.log(`[SpotApp] API URL (auto-detected): ${url}`);
        return url;
      }
      if (__DEV__) console.log(`[SpotApp] Skipped tunnel/hostname: ${host}`);
    }
  }

  // 3. Fallback: localhost (works for web & simulators)
  const fallback = 'http://localhost:3000';
  if (__DEV__) console.log(`[SpotApp] API URL (fallback): ${fallback}`);
  return fallback;
}

export const SERVER_URL = getServerUrl();
