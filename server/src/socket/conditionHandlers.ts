import { getIO } from './index.js';

export function emitConditionNew(spotId: string, condition: unknown): void {
  getIO().to(`spot:${spotId}`).emit('condition:new', { spotId, condition });
}

export function emitConditionConfirmed(spotId: string, conditionId: string, confirmCount: number): void {
  getIO().to(`spot:${spotId}`).emit('condition:confirmed', { spotId, conditionId, confirmCount });
}
