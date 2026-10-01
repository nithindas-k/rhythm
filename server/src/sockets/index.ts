import http from 'http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { getRedisClient, isExternalRedisConnected } from '../config/redis';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { socketAuthMiddleware, AuthenticatedSocket } from './middlewares/socketAuth';
import { registerPresenceHandlers } from './handlers/presence.handler';
import { registerSyncHandlers } from './handlers/sync.handler';
import { registerRoomHandlers } from './handlers/room.handler';

let ioInstance: Server | null = null;

export function initSocketServer(httpServer: http.Server): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

    // Redis adapter for horizontal scaling across nodes in production
    if (isExternalRedisConnected()) {
      try {
        const pubClient = getRedisClient();
        const subClient = pubClient.duplicate();
        io.adapter(createAdapter(pubClient, subClient));
        logger.info('Socket.IO Redis adapter attached');
      } catch (err) {
        logger.warn({ err }, 'Failed to initialize Socket.IO Redis adapter, continuing without clustering');
      }
    } else {
      logger.info('Socket.IO running in single-node mode (in-memory adapter)');
    }

  // Authentication handshake middleware
  io.use(socketAuthMiddleware);

  // Connection lifecycle & handler registration
  io.on('connection', (socket) => {
    const authSocket = socket as AuthenticatedSocket;
    const userId = authSocket.data.user?.id;
    logger.debug({ socketId: socket.id, userId }, 'Socket connected');

    // Join personal user room for direct user-targeted notifications
    if (userId) {
      socket.join(`user:${userId}`);
    }

    registerPresenceHandlers(io, authSocket);
    registerSyncHandlers(authSocket);
    registerRoomHandlers(io, authSocket);
  });

  ioInstance = io;
  return io;
}

export function getIO(): Server {
  if (!ioInstance) {
    throw new Error('Socket.IO has not been initialized yet');
  }
  return ioInstance;
}
