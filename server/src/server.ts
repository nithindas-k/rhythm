import 'reflect-metadata';
import http from 'http';
import { createApp } from './app';
import { connectDB, disconnectDB } from './config/db';
import { connectRedis, disconnectRedis } from './config/redis';
import { env } from './config/env';
import { logger } from './utils/logger';

import { initSocketServer } from './sockets/index';
import { PlayCountFlusher } from './utils/playCountFlusher';

async function bootstrap(): Promise<void> {
  // 1. Connect data stores
  await connectDB();
  await connectRedis();

  // 2. Start background tasks
  PlayCountFlusher.start(60_000);

  // 3. Create Express app
  const app = createApp();

  // 4. Create HTTP server
  const httpServer = http.createServer(app);

  // 5. Initialize Socket.IO with Redis adapter & auth
  const io = initSocketServer(httpServer);

  // 6. Start listening
  httpServer.listen(env.PORT, () => {
    logger.info(`🎵  Rhythm API running on port ${env.PORT} [${env.NODE_ENV}]`);
    logger.info(`📡  Health: http://localhost:${env.PORT}/api/v1/health`);
    logger.info(`⚡  WebSocket server listening on port ${env.PORT}`);
  });

  // ── Graceful shutdown ────────────────────────────────────────────────────────
  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} received — shutting down gracefully…`);

    // Stop background tasks
    PlayCountFlusher.stop();

    // Stop accepting new connections
    httpServer.close(async () => {
      logger.info('HTTP server closed');

      try {
        await disconnectDB();
        await disconnectRedis();
        logger.info('All connections closed — exiting');
        process.exit(0);
      } catch (err) {
        logger.error({ err }, 'Error during shutdown');
        process.exit(1);
      }
    });

    // Force exit after 10 seconds if graceful shutdown hangs
    setTimeout(() => {
      logger.error('Graceful shutdown timed out — forcing exit');
      process.exit(1);
    }, 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // ── Unhandled rejections & exceptions ────────────────────────────────────────
  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled promise rejection');
    // Let the process crash so the process manager (PM2/Docker) can restart it
    process.exit(1);
  });

  process.on('uncaughtException', (err) => {
    logger.error({ err }, 'Uncaught exception');
    process.exit(1);
  });
}

bootstrap().catch((err) => {
  logger.error({ err }, 'Failed to bootstrap server');
  process.exit(1);
});

