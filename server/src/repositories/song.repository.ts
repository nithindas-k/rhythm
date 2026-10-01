import { injectable } from 'tsyringe';
import mongoose from 'mongoose';
import { Song, ISong, MusicProvider } from '../models/Song.model';
import { ISongRepository, SongQueryOptions } from './interfaces/ISongRepository';
import { getRedisClient } from '../config/redis';
import { CACHE_KEYS } from '../constants/cacheKeys';
import { TTL } from '../constants/limits';
import crypto from 'crypto';

@injectable()
export class SongRepository implements ISongRepository {
  async findById(id: string): Promise<ISong | null> {
    if (!mongoose.isValidObjectId(id)) return null;
    return Song.findById(id).lean<ISong>().exec();
  }

  async search(options: SongQueryOptions): Promise<ISong[]> {
    const { q, genre, sort, cursor, limit } = options;

    // Cache key based on query hash
    const queryHash = crypto
      .createHash('md5')
      .update(JSON.stringify(options))
      .digest('hex');
    const redis = getRedisClient();
    const cached = await redis.get(CACHE_KEYS.SONGS_SEARCH(queryHash));
    if (cached) return JSON.parse(cached) as ISong[];

    const filter: Record<string, unknown> = {};

    if (q) filter.$text = { $search: q };
    if (genre) filter.genre = genre;

    // Cursor pagination
    if (cursor) {
      if (sort === 'trending') {
        filter.playCount = { $lt: Number(cursor) };
      } else {
        const dir = sort === 'oldest' ? '$gt' : '$lt';
        filter._id = { [dir]: new mongoose.Types.ObjectId(cursor) };
      }
    }

    const sortObj: Record<string, 1 | -1> =
      sort === 'trending'
        ? { playCount: -1 }
        : sort === 'oldest'
        ? { _id: 1 }
        : { _id: -1 };

    const results = await Song.find(filter)
      .sort(sortObj)
      .limit(limit)
      .lean<ISong[]>()
      .exec();

    await redis.setex(CACHE_KEYS.SONGS_SEARCH(queryHash), TTL.SONGS_SEARCH, JSON.stringify(results));
    return results;
  }

  async findTrending(limit: number): Promise<ISong[]> {
    const redis = getRedisClient();
    const cached = await redis.get(CACHE_KEYS.SONGS_TRENDING());
    if (cached) return JSON.parse(cached) as ISong[];

    const results = await Song.find()
      .sort({ playCount: -1 })
      .limit(limit)
      .lean<ISong[]>()
      .exec();

    await redis.setex(CACHE_KEYS.SONGS_TRENDING(), TTL.SONGS_TRENDING, JSON.stringify(results));
    return results;
  }

  async incrementPlayCount(id: string): Promise<void> {
    // Buffer in Redis — flushed to Mongo periodically (Phase 7)
    const redis = getRedisClient();
    await redis.incr(CACHE_KEYS.SONG_PLAY_COUNT(id));
    // Also update Mongo directly for correctness (buffered incr is additive on flush)
    await Song.findByIdAndUpdate(id, { $inc: { playCount: 1 } }).exec();
  }

  async findByProviderId(provider: string, providerId: string): Promise<ISong | null> {
    return Song.findOne({ provider: provider as MusicProvider, providerId }).lean<ISong>().exec();
  }



  async upsertByProvider(data: Partial<ISong>): Promise<ISong> {
    const filter = { provider: data.provider as MusicProvider, providerId: data.providerId };
    const doc = await Song.findOneAndUpdate(
      filter,
      { $set: data },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean<ISong>().exec();
    return doc as ISong;
  }

  async create(data: Partial<ISong>): Promise<ISong> {
    const song = new Song(data);
    return (await song.save()).toObject() as ISong;
  }

  async findManyByIds(ids: string[]): Promise<ISong[]> {
    const objectIds = ids
      .filter((id) => mongoose.isValidObjectId(id))
      .map((id) => new mongoose.Types.ObjectId(id));
    return Song.find({ _id: { $in: objectIds } }).lean<ISong[]>().exec();
  }

  async findManyByProviderIds(providerIds: string[]): Promise<ISong[]> {
    return Song.find({ providerId: { $in: providerIds } }).lean<ISong[]>().exec();
  }
}
