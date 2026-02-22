import { getIO } from './index.js';

export function emitSpotCreated(spot: unknown): void {
  getIO().emit('spot:created', { spot });
}

export function emitSpotUpdated(spot: unknown): void {
  getIO().emit('spot:updated', { spot });
}
