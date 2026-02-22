import { io, Socket } from 'socket.io-client';
import { Platform } from 'react-native';
import type { ServerToClientEvents, ClientToServerEvents } from '@/types/socket';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const SERVER_URL = Platform.select({
  web: 'http://localhost:3000',
  default: 'http://10.0.2.2:3000', // Android emulator → host
});

let socket: TypedSocket | null = null;

export function getSocket(): TypedSocket {
  if (!socket) {
    socket = io(SERVER_URL, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    }) as TypedSocket;
  }
  return socket;
}

export function connectSocket(): void {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
}

export function disconnectSocket(): void {
  if (socket?.connected) {
    socket.disconnect();
  }
}
