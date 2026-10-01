import { getRedisClient } from '../../config/redis';
import { CACHE_KEYS } from '../../constants/cacheKeys';
import { TTL } from '../../constants/limits';
import { PlaybackStateDto } from '../../dtos/room/room.dto';

export class RedisPlaybackManager {
  /**
   * Retrieves authoritative playback state for a room.
   * If playing, calculates the current estimated positionMs based on elapsed time.
   */
  static async getState(roomCode: string): Promise<PlaybackStateDto | null> {
    const redis = getRedisClient();
    const key = CACHE_KEYS.ROOM_STATE(roomCode.toUpperCase());
    const data = await redis.hgetall(key);

    if (!data || Object.keys(data).length === 0) {
      return null;
    }

    const isPlaying = data['isPlaying'] === 'true';
    const serverTimestamp = Number(data['serverTimestamp'] ?? Date.now());
    const basePositionMs = Number(data['positionMs'] ?? 0);
    const version = Number(data['version'] ?? 0);
    const trackId = data['trackId'] || undefined;

    // If currently playing, compute current position on the fly
    const elapsed = isPlaying ? Math.max(0, Date.now() - serverTimestamp) : 0;
    const currentPositionMs = basePositionMs + elapsed;

    return {
      trackId,
      isPlaying,
      positionMs: currentPositionMs,
      serverTimestamp: Date.now(),
      version,
    };
  }

  /**
   * Updates playback state in Redis atomically.
   */
  static async setState(
    roomCode: string,
    updates: {
      trackId?: string;
      isPlaying: boolean;
      positionMs: number;
      scheduledAt?: number;
    }
  ): Promise<PlaybackStateDto> {
    const redis = getRedisClient();
    const key = CACHE_KEYS.ROOM_STATE(roomCode.toUpperCase());
    const now = updates.scheduledAt ?? Date.now();

    // Increment version atomically
    const newVersion = await redis.hincrby(key, 'version', 1);

    await redis.hmset(key, {
      trackId: updates.trackId ?? '',
      isPlaying: String(updates.isPlaying),
      positionMs: String(Math.floor(updates.positionMs)),
      serverTimestamp: String(now),
    });

    await redis.expire(key, TTL.ROOM_STATE);

    return {
      trackId: updates.trackId,
      isPlaying: updates.isPlaying,
      positionMs: Math.floor(updates.positionMs),
      serverTimestamp: now,
      version: newVersion,
      scheduledAt: updates.scheduledAt,
    };
  }

  /**
   * Cleans up room state when room ends.
   */
  static async deleteState(roomCode: string): Promise<void> {
    const redis = getRedisClient();
    await redis.del(CACHE_KEYS.ROOM_STATE(roomCode.toUpperCase()));
  }
}
