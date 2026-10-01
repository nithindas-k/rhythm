import 'reflect-metadata';
import express, { Application, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';

import { env } from './config/env';
import { corsOriginDelegate } from './config/cors';
import { requestLogger } from './middlewares/requestLogger';
import { apiRateLimiter } from './middlewares/rateLimiter';
import { globalErrorHandler } from './middlewares/globalErrorHandler';
import { ROUTES } from './constants/routes';
import { HTTP_STATUS } from './constants/statusCodes';
import { sendError } from './utils/responseHelper';
import { MESSAGES } from './constants/messages';
import rootRouter from './routes/index';

export function createApp(): Application {
  const app = express();

  // ── Reverse Proxy Trust (Required for Render, Heroku, etc.) ─────────────────
  app.set('trust proxy', 1);

  // ── Security headers ────────────────────────────────────────────────────────
  app.use(helmet());

  // ── CORS ────────────────────────────────────────────────────────────────────
  app.use(
    cors({
      origin: corsOriginDelegate,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // ── Compression ─────────────────────────────────────────────────────────────
  app.use(compression());

  // ── Body parsing ────────────────────────────────────────────────────────────
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser(env.COOKIE_SECRET));

  // ── Request logging ─────────────────────────────────────────────────────────
  app.use(requestLogger);

  // ── Rate limiting ───────────────────────────────────────────────────────────
  app.use(ROUTES.BASE, apiRateLimiter);

  // ── API routes ──────────────────────────────────────────────────────────────
  app.use(ROUTES.BASE, rootRouter);

  // ── 404 handler ─────────────────────────────────────────────────────────────
  app.use((_req: Request, res: Response) => {
    sendError(res, MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  });

  // ── Global error handler (must be last) ─────────────────────────────────────
  app.use(
    (err: unknown, req: Request, res: Response, next: NextFunction) => {
      globalErrorHandler(err, req, res, next);
    }
  );

  return app;
}
