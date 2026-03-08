import cron from 'node-cron';
import { deleteExpiredConditions } from '../services/conditions.service.js';
import { emitConditionExpired } from '../socket/conditionHandlers.js';
import { logger } from '../utils/logger.js';

export async function startConditionExpiryJob(): Promise<void> {
  // Run cleanup immediately on startup
  try {
    const expired = await deleteExpiredConditions();
    if (expired.length > 0) {
      logger.info({ count: expired.length }, 'Startup: cleaned up expired condition reports');
      for (const { spotId, conditionId } of expired) {
        emitConditionExpired(spotId, conditionId);
      }
    }
  } catch (err) {
    logger.error({ err }, 'Startup condition cleanup failed');
  }

  // Run every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      const expired = await deleteExpiredConditions();

      if (expired.length > 0) {
        logger.info({ count: expired.length }, 'Expired condition reports cleaned up');

        for (const { spotId, conditionId } of expired) {
          emitConditionExpired(spotId, conditionId);
        }
      }
    } catch (err) {
      logger.error({ err }, 'Condition expiry job failed');
    }
  });

  logger.info('Condition expiry job scheduled (every 5 minutes)');
}
