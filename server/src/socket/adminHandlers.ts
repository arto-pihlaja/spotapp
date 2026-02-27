import { getIO } from './index.js';

export function emitModerationAction(payload: {
  action: string;
  targetType: string;
  targetId: string;
  adminId: string;
  timestamp: string;
}): void {
  getIO().emit('moderation:action', payload);
}
