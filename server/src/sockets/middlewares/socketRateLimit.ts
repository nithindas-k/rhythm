import { getRedisClient } from '../../config/redis';
import { CACHE_KEYS } from '../../constants/cacheKeys';
import { SOCKET_RATE_LIMITS } from '../../constants/limits';

export class SocketRateLimiter {
  /**
   * Checks if an event from a socket is rate limited.
   * Returns true if allowed, false if limit exceeded.
   */
  static async checkRateLimit(
    socketId: string,
    event: string,
    limit: number = SOCKET_RATE_LIMITS.PLAYBACK_EVENTS_PER_SECOND,
    windowSec: number = 1
  ): Promise<boolean> {
    try {
      const redis = getRedisClient();
      const key = CACHE_KEYS.RATE_LIMIT_SOCKET(socketId, event);
      const current = await redis.incr(key);

      if (current === 1) {
        await redis.expire(key, windowSec);
      }

      return current <= limit;
    } catch {
      // In case of Redis error, fail open to avoid disrupting user experience
      return true;
    }
  }
}
