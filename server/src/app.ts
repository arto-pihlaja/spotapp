import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { pinoHttp } from 'pino-http';
import { corsOptions } from './config/cors.js';
import { logger } from './utils/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import healthRoutes from './routes/health.routes.js';
import spotsRoutes from './routes/spots.routes.js';
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';

const app = express();

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());
app.use(pinoHttp({ logger }));

// Routes
app.use('/api/v1', healthRoutes);
app.use('/api/v1', spotsRoutes);
app.use('/api/v1', authRoutes);
app.use('/api/v1', adminRoutes);

// Error handler
app.use(errorHandler);

export default app;
