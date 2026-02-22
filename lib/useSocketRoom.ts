import { useEffect } from 'react';
import { getSocket } from '@/lib/socket';

export function useSocketRoom(prefix: string, id: string | null): void {
  useEffect(() => {
    if (!id) return;

    const socket = getSocket();
    const event = `${prefix}:join` as 'spot:join';
    const leaveEvent = `${prefix}:leave` as 'spot:leave';

    socket.emit(event, id);

    return () => {
      socket.emit(leaveEvent, id);
    };
  }, [prefix, id]);
}
