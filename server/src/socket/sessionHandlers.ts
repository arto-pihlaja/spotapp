import { getIO } from './index.js';

export function emitSessionJoined(spotId: string, session: unknown): void {
  getIO().to(`spot:${spotId}`).emit('session:joined', { spotId, session });
}

export function emitSessionLeft(spotId: string, sessionId: string): void {
  getIO().to(`spot:${spotId}`).emit('session:left', { spotId, sessionId });
}

export function emitSessionExpired(spotId: string, sessionId: string): void {
  getIO().to(`spot:${spotId}`).emit('session:expired', { spotId, sessionId });
}
