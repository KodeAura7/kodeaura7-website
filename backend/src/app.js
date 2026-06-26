import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import apiRoutes from './routes/index.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.corsOrigin, credentials: false }));
  app.use(express.json({ limit: '50kb' }));
  app.use(
    rateLimit({
      windowMs: env.rateLimitWindowMs,
      max: env.rateLimitMax,
      standardHeaders: true,
      legacyHeaders: false
    })
  );

  app.use('/api', apiRoutes);
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
