import { getRedisClient } from '../config/redis';
import { Song } from '../models/Song.model';
import { CACHE_KEYS } from '../constants/cacheKeys';
import { logger } from './logger';

export class PlayCountFlusher {
  private static intervalHandle: NodeJS.Timeout | null = null;

  /**
   * Flushes Redis buffered play counts into MongoDB and invalidates trending cache.
   */
  static async flush(): Promise<void> {
    try {
      const redis = getRedisClient();
      const keys = await redis.keys('song:playcount:*');

      if (keys.length === 0) return;

      const pipeline = redis.pipeline();
      for (const key of keys) {
        pipeline.get(key);
      }
      const results = await pipeline.exec();

      if (!results) return;

      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const [err, countStr] = results[i];
        if (err || !countStr) continue;

        const count = parseInt(String(countStr), 10);
        const songId = key.replace('song:playcount:', '');

        if (count > 0) {
          await Song.findByIdAndUpdate(songId, {
            $inc: { playCount: count },
          }).exec();

          // Reset the counter in Redis
          await redis.del(key);
        }
      }

      // Invalidate trending cache so fresh counts are reflected
      await redis.del(CACHE_KEYS.SONGS_TRENDING());
      logger.debug({ flushedCount: keys.length }, 'Flushed song play counts to database');
    } catch (err) {
      logger.error({ err }, 'Error flushing song play counts');
    }
  }

  /**
   * Starts periodic flushing interval.
   */
  static start(intervalMs: number = 60_000): void {
    if (this.intervalHandle) return;
    this.intervalHandle = setInterval(() => {
      this.flush().catch((err) => logger.error({ err }, 'Play count flush failed'));
    }, intervalMs);
    this.intervalHandle.unref();
  }

  /**
   * Stops periodic flushing interval.
   */
  static stop(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }
}
