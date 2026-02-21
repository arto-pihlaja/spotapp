import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthUser {
  id: string;
  username: string;
  role: string;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  setTokens: (accessToken: string, refreshToken: string, user: AuthUser) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setTokens: (accessToken, refreshToken, user) =>
        set({ accessToken, refreshToken, user }),
      clearAuth: () =>
        set({ accessToken: null, refreshToken: null, user: null }),
    }),
    {
      name: 'spotapp-auth',
      getStorage: () => AsyncStorage,
      partialize: (state) =>
        ({
          accessToken: state.accessToken,
          refreshToken: state.refreshToken,
          user: state.user,
        }) as AuthState,
    },
  ),
);
