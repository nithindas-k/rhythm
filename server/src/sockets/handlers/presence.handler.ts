import { Server, Socket } from 'socket.io';
import { getRedisClient } from '../../config/redis';
import { CACHE_KEYS } from '../../constants/cacheKeys';
import { TTL } from '../../constants/limits';
import { SOCKET_EVENTS } from '../../constants/socketEvents';
import { AuthenticatedSocket } from '../middlewares/socketAuth';
import { logger } from '../../utils/logger';

export function registerPresenceHandlers(io: Server, socket: AuthenticatedSocket): void {
  const userId = socket.data.user?.id;
  if (!userId) return;

  const redis = getRedisClient();

  // Mark user online in Redis
  const markOnline = async () => {
    try {
      await redis.setex(CACHE_KEYS.USER_PRESENCE(userId), TTL.USER_PRESENCE, 'online');
      socket.broadcast.emit(SOCKET_EVENTS.PRESENCE_ONLINE, { userId });
    } catch (err) {
      logger.error({ err, userId }, 'Error marking user online');
    }
  };

  markOnline();

  // On disconnect, mark offline
  socket.on('disconnect', async () => {
    try {
      await redis.del(CACHE_KEYS.USER_PRESENCE(userId));
      socket.broadcast.emit(SOCKET_EVENTS.PRESENCE_OFFLINE, { userId });
    } catch (err) {
      logger.error({ err, userId }, 'Error handling user presence on disconnect');
    }
  });
}
