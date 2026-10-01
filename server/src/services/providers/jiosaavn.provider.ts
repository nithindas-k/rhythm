import { injectable } from 'tsyringe';
import crypto from 'crypto';
import { IMusicProvider, ProviderTrack } from '../interfaces/IMusicProvider';
import { logger } from '../../utils/logger';
import { getRedisClient } from '../../config/redis';
import { CACHE_KEYS } from '../../constants/cacheKeys';
import { TTL } from '../../constants/limits';
import { JIOSAAVN_CONFIG } from '../../constants/providers';

// ─── JioSaavn API response shape ─────────────────────────────────────────────

interface JioSaavnSong {
  id: string;
  song: string;               // title
  primary_artists: string;    // artist(s)
  album: string;
  image: string;              // cover art URL
  duration: string;           // seconds as string e.g. "305"
  language: string;           // "tamil", "hindi", etc.
  media_url: string;          // direct AAC URL – this is what we play
  media_preview_url: string;  // 96kbps preview
  perma_url: string;          // JioSaavn song page URL
  play_count: number;
  has_lyrics: string;         // "true" | "false"
}

@injectable()
export class JioSaavnProvider implements IMusicProvider {
  private readonly baseUrl = JIOSAAVN_CONFIG.BASE_URL;

  // ─── Search ──────────────────────────────────────────────────────────────────
  async searchTracks(query: string, limit: number = JIOSAAVN_CONFIG.DEFAULT_SEARCH_LIMIT): Promise<ProviderTrack[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    // 1. Redis cache check
    const queryHash = crypto.createHash('md5').update(trimmed.toLowerCase()).digest('hex');
    const cacheKey = CACHE_KEYS.JIOSAAVN_SEARCH(queryHash);
    const redis = getRedisClient();

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        logger.debug({ query: trimmed }, 'JioSaavn search cache hit');
        return JSON.parse(cached) as ProviderTrack[];
      }
    } catch (err) {
      logger.warn({ err }, 'Redis error on JioSaavn search cache read');
    }

    // 2. Fetch from JioSaavn wrapper
    try {
      const url = `${this.baseUrl}/result/?query=${encodeURIComponent(trimmed)}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });

      if (!res.ok) {
        logger.warn({ status: res.status, query: trimmed }, 'JioSaavn API returned non-OK status');
        return [];
      }

      const json = await res.json() as JioSaavnSong[] | { error?: string };

      if (!Array.isArray(json)) {
        logger.warn({ query: trimmed, json }, 'JioSaavn API returned unexpected shape');
        return [];
      }

      const tracks: ProviderTrack[] = json
        .filter((s) => s.id && s.song && s.media_url)
        .slice(0, limit)
        .map((s) => this.mapToProviderTrack(s));

      // 3. Cache results
      try {
        await redis.setex(cacheKey, TTL.JIOSAAVN_SEARCH, JSON.stringify(tracks));
      } catch (err) {
        logger.warn({ err }, 'Redis error on JioSaavn search cache write');
      }

      return tracks;
    } catch (err) {
      logger.error({ err, query: trimmed }, 'JioSaavn searchTracks failed');
      return [];
    }
  }

  // ─── Get by ID ───────────────────────────────────────────────────────────────
  async getTrackById(id: string): Promise<ProviderTrack | null> {
    // Check Redis single-track cache first
    const cacheKey = CACHE_KEYS.JIOSAAVN_TRACK(id);
    const redis = getRedisClient();

    try {
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached) as ProviderTrack;
    } catch {
      // ignore
    }

    try {
      // The wrapper's /song/?query= endpoint accepts the raw song ID or perma_url directly
      const url = `${this.baseUrl}/song/?query=${encodeURIComponent(id)}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });

      if (!res.ok) return null;

      const json = await res.json() as JioSaavnSong | JioSaavnSong[] | { error?: string };

      const song: JioSaavnSong | undefined = Array.isArray(json) ? json[0] : (json as JioSaavnSong);
      if (!song || !song.id) return null;

      const track = this.mapToProviderTrack(song);

      try {
        await redis.setex(cacheKey, TTL.JIOSAAVN_SEARCH, JSON.stringify(track));
      } catch {
        // ignore
      }

      return track;
    } catch (err) {
      logger.error({ err, id }, 'JioSaavn getTrackById failed');
      return null;
    }
  }

  // ─── Mapping helper ───────────────────────────────────────────────────────────
  private mapToProviderTrack(s: JioSaavnSong): ProviderTrack {
    return {
      providerId: s.id,
      provider: 'jiosaavn',
      title: s.song,
      artist: s.primary_artists || 'Unknown Artist',
      album: s.album || undefined,
      genre: s.language || undefined,
      durationMs: (parseInt(s.duration, 10) || 0) * 1000,
      coverUrl: s.image?.replace('150x150', '500x500') || undefined,
      audioUrl: s.media_url,         // Direct AAC URL — plays via HTML <audio>
      previewUrl: s.media_preview_url || undefined,
      permaUrl: s.perma_url || undefined,
    };
  }
}
