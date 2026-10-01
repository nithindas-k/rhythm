import Redis from 'ioredis';
import { env } from './env';
import { logger } from '../utils/logger';
import { EventEmitter } from 'events';

type CacheEntry =
  | { type: 'string'; value: string; expiresAt?: number }
  | { type: 'hash'; fields: Map<string, string>; expiresAt?: number };

// In-Memory Fallback Client when local Redis instance is not available
class InMemoryRedisFallback extends EventEmitter {
  private store = new Map<string, CacheEntry>();
  public status = 'ready';

  private cleanIfExpired(key: string): CacheEntry | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry;
  }

  async get(key: string): Promise<string | null> {
    const entry = this.cleanIfExpired(key);
    if (!entry || entry.type !== 'string') return null;
    return entry.value;
  }

  async set(key: string, value: string): Promise<'OK'> {
    this.store.set(key, { type: 'string', value });
    return 'OK';
  }

  async setex(key: string, seconds: number, value: string): Promise<'OK'> {
    const expiresAt = Date.now() + seconds * 1000;
    this.store.set(key, { type: 'string', value, expiresAt });
    return 'OK';
  }

  async exists(...keys: string[]): Promise<number> {
    let count = 0;
    for (const key of keys) {
      if (this.cleanIfExpired(key)) count++;
    }
    return count;
  }

  async del(...keys: string[]): Promise<number> {
    let deleted = 0;
    for (const key of keys) {
      if (this.store.delete(key)) deleted++;
    }
    return deleted;
  }

  async incr(key: string): Promise<number> {
    const current = await this.get(key);
    const num = (current ? parseInt(current, 10) || 0 : 0) + 1;
    await this.set(key, num.toString());
    return num;
  }

  async expire(key: string, seconds: number): Promise<number> {
    const entry = this.cleanIfExpired(key);
    if (!entry) return 0;
    entry.expiresAt = Date.now() + seconds * 1000;
    return 1;
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    const matched: string[] = [];

    for (const [key] of this.store.entries()) {
      if (this.cleanIfExpired(key) && regex.test(key)) {
        matched.push(key);
      }
    }
    return matched;
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    const entry = this.cleanIfExpired(key);
    if (!entry || entry.type !== 'hash') return {};
    return Object.fromEntries(entry.fields);
  }

  async hmset(key: string, ...args: any[]): Promise<'OK'> {
    let entry = this.cleanIfExpired(key);
    if (!entry || entry.type !== 'hash') {
      entry = { type: 'hash', fields: new Map<string, string>() };
      this.store.set(key, entry);
    }

    if (args.length === 1 && typeof args[0] === 'object' && args[0] !== null) {
      for (const [k, v] of Object.entries(args[0])) {
        entry.fields.set(k, String(v));
      }
    } else {
      for (let i = 0; i < args.length; i += 2) {
        if (args[i] !== undefined && args[i + 1] !== undefined) {
          entry.fields.set(String(args[i]), String(args[i + 1]));
        }
      }
    }
    return 'OK';
  }

  async hset(key: string, ...args: any[]): Promise<number> {
    await this.hmset(key, ...args);
    return 1;
  }

  async hincrby(key: string, field: string, increment: number): Promise<number> {
    let entry = this.cleanIfExpired(key);
    if (!entry || entry.type !== 'hash') {
      entry = { type: 'hash', fields: new Map<string, string>() };
      this.store.set(key, entry);
    }
    const curr = parseInt(entry.fields.get(field) || '0', 10) || 0;
    const next = curr + increment;
    entry.fields.set(field, String(next));
    return next;
  }

  pipeline(): any {
    const queue: Array<() => Promise<any>> = [];
    const pipe = {
      get: (key: string) => {
        queue.push(() => this.get(key));
        return pipe;
      },
      set: (key: string, val: string) => {
        queue.push(() => this.set(key, val));
        return pipe;
      },
      del: (...keys: string[]) => {
        queue.push(() => this.del(...keys));
        return pipe;
      },
      exec: async () => {
        const results: Array<[Error | null, any]> = [];
        for (const op of queue) {
          try {
            const res = await op();
            results.push([null, res]);
          } catch (err: any) {
            results.push([err as Error, null]);
          }
        }
        return results;
      },
    };
    return pipe;
  }

  async ping(): Promise<'PONG'> {
    return 'PONG';
  }

  async quit(): Promise<'OK'> {
    this.store.clear();
    return 'OK';
  }

  disconnect(): void {
    this.store.clear();
  }

  async psubscribe(..._patterns: string[]): Promise<void> {}
  async punsubscribe(..._patterns: string[]): Promise<void> {}
  async subscribe(..._channels: string[]): Promise<void> {}
  async unsubscribe(..._channels: string[]): Promise<void> {}

  duplicate(): this {
    return this;
  }
}

let redisClient: Redis;
let redisPubClient: Redis;
let redisSubClient: Redis;
let isExternalRedis = false;

function createClient(name: string): Redis {
  const client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    retryStrategy: () => null, // Don't keep retrying if offline
    connectTimeout: 1500,
    enableReadyCheck: false,
    lazyConnect: true,
  });

  client.on('error', () => {
    // Suppress unhandled error event noise when Redis server is offline
  });
  client.on('connect', () => logger.info(`Redis [${name}] connected`));
  return client;
}

export async function connectRedis(): Promise<void> {
  let candidateClient: Redis | null = null;
  try {
    candidateClient = createClient('main');
    await Promise.race([
      candidateClient.connect(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Redis connection timeout')), 2000)),
    ]);

    redisClient = candidateClient;
    redisPubClient = createClient('pub');
    redisSubClient = createClient('sub');

    await Promise.all([
      redisPubClient.connect(),
      redisSubClient.connect(),
    ]);

    isExternalRedis = true;
    logger.info('Connected to external Redis cluster successfully');
  } catch (err) {
    if (candidateClient) {
      try {
        candidateClient.disconnect();
      } catch {
        // ignore disconnect on failed client
      }
    }
    isExternalRedis = false;
    logger.info('Running in local mode: using resilient in-memory cache');
    const fallback = new InMemoryRedisFallback() as unknown as Redis;
    redisClient = fallback;
    redisPubClient = fallback;
    redisSubClient = fallback;
  }
}

export async function disconnectRedis(): Promise<void> {
  await Promise.all([
    redisClient?.quit(),
    redisPubClient?.quit(),
    redisSubClient?.quit(),
  ]);
  logger.info('Redis connections closed');
}

export function isExternalRedisConnected(): boolean {
  return isExternalRedis;
}

export function getRedisClient(): Redis {
  if (!redisClient) throw new Error('Redis not initialized. Call connectRedis() first.');
  return redisClient;
}

export function getRedisPubClient(): Redis {
  if (!redisPubClient) throw new Error('Redis pub client not initialized.');
  return redisPubClient;
}

export function getRedisSubClient(): Redis {
  if (!redisSubClient) throw new Error('Redis sub client not initialized.');
  return redisSubClient;
}
