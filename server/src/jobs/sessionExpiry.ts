import cron from 'node-cron';
import { deleteExpiredSessions } from '../services/sessions.service.js';
import { emitSessionExpired } from '../socket/sessionHandlers.js';
import { logger } from '../utils/logger.js';

export function startSessionExpiryJob(): void {
  // Run every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      const expired = await deleteExpiredSessions();

      if (expired.length > 0) {
        logger.info({ count: expired.length }, 'Expired sessions cleaned up');

        for (const { spotId, sessionId } of expired) {
          emitSessionExpired(spotId, sessionId);
        }
      }
    } catch (err) {
      logger.error({ err }, 'Session expiry job failed');
    }
  });

  logger.info('Session expiry job scheduled (every 5 minutes)');
}
