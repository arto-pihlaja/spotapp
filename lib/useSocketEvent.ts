import { useEffect } from 'react';
import { getSocket } from '@/lib/socket';
import type { ServerToClientEvents } from '@/types/socket';

export function useSocketEvent<E extends keyof ServerToClientEvents>(
  event: E,
  handler: ServerToClientEvents[E],
  enabled = true,
): void {
  useEffect(() => {
    if (!enabled) return;

    const socket = getSocket();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    socket.on(event, handler as any);

    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      socket.off(event, handler as any);
    };
  }, [event, handler, enabled]);
}
