import { createServer } from 'node:http';
import app from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { setupSocket } from './socket/index.js';
import { startSessionExpiryJob } from './jobs/sessionExpiry.js';
import { startConditionExpiryJob } from './jobs/conditionExpiry.js';

const server = createServer(app);

setupSocket(server);
startSessionExpiryJob();
startConditionExpiryJob();

server.listen(env.PORT, () => {
  logger.info(`Server listening on port ${env.PORT} [${env.NODE_ENV}]`);
});
