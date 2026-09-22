import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from '@config/env';
import { requestLogger } from '@middlewares/requestLogger.middleware';
import { apiRateLimiter } from '@middlewares/rateLimiter.middleware';
import { notFoundHandler } from '@middlewares/notFound.middleware';
import { errorHandler } from '@middlewares/error.middleware';
import routes from '@routes/index';

export function createApp(): Express {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ALLOWED_ORIGINS, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(requestLogger);
  app.use(env.API_PREFIX, apiRateLimiter);
  app.use(env.API_PREFIX, routes);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
