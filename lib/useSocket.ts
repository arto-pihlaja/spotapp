import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket';

export function useSocket(): void {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    connectSocket();

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        const s = getSocket();
        if (!s.connected) {
          connectSocket();
        }
      }
      appState.current = nextState;
    });

    return () => {
      subscription.remove();
      disconnectSocket();
    };
  }, []);
}
