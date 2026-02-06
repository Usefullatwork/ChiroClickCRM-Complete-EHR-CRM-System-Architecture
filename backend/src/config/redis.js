/**
 * Cache Configuration Router
 * Routes to in-memory cache (desktop) or Redis (SaaS).
 *
 * CACHE_ENGINE=memory  -> In-memory Map-based cache (default for desktop)
 * CACHE_ENGINE=redis   -> Redis client (for SaaS/Docker)
 */

import dotenv from 'dotenv';
dotenv.config();

const CACHE_ENGINE = process.env.CACHE_ENGINE ||
  (process.env.DESKTOP_MODE === 'true' ? 'memory' : 'redis');

let cacheModule;

if (CACHE_ENGINE === 'memory') {
  cacheModule = await import('./memory-cache.js');
} else {
  // Dynamic import of the real Redis module
  // Only loaded when CACHE_ENGINE=redis
  try {
    const { createClient } = await import('redis');
    const logger = (await import('../utils/logger.js')).default;

    const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
    const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;
    const REDIS_DB = parseInt(process.env.REDIS_DB || '0');
    const REDIS_KEY_PREFIX = process.env.REDIS_KEY_PREFIX || 'chiroclickcrm:';

    let client = null;
    let isConnected = false;

    const initRedis = async () => {
      if (client && isConnected) return client;
      client = createClient({
        url: REDIS_URL,
        password: REDIS_PASSWORD,
        database: REDIS_DB,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) return new Error('Max reconnection attempts');
            return Math.min(retries * 100, 3000);
          },
        },
      });
      client.on('error', (err) => { logger.error('Redis error:', err); isConnected = false; });
      client.on('ready', () => { isConnected = true; });
      client.on('end', () => { isConnected = false; });
      await client.connect();
      return client;
    };

    const getRedisClient = async () => { if (!client || !isConnected) await initRedis(); return client; };
    const prefixKey = (key) => `${REDIS_KEY_PREFIX}${key}`;

    cacheModule = {
      initRedis,
      getRedisClient,
      isRedisAvailable: () => isConnected,
      isRedisConnected: () => isConnected,
      closeRedis: async () => { if (client) { await client.quit(); client = null; isConnected = false; } },
      redisHealthCheck: async () => {
        try { return client && isConnected && (await client.ping()) === 'PONG'; }
        catch { return false; }
      },
      redisCache: {
        async get(key) { try { const v = await (await getRedisClient()).get(prefixKey(key)); return v ? JSON.parse(v) : null; } catch { return null; } },
        async set(key, value, ttl = 300) { try { const c = await getRedisClient(); ttl > 0 ? await c.setEx(prefixKey(key), ttl, JSON.stringify(value)) : await c.set(prefixKey(key), JSON.stringify(value)); return true; } catch { return false; } },
        async del(key) { try { await (await getRedisClient()).del(prefixKey(key)); return true; } catch { return false; } },
        async delPattern(pattern) { try { const c = await getRedisClient(); const keys = await c.keys(prefixKey(pattern)); if (keys.length) await c.del(keys); return keys.length; } catch { return 0; } },
        async getOrSet(key, fetchFn, ttl = 300) { const cached = await this.get(key); if (cached !== null) return cached; const v = await fetchFn(); await this.set(key, v, ttl); return v; },
        async exists(key) { try { return await (await getRedisClient()).exists(prefixKey(key)); } catch { return false; } },
        async expire(key, ttl) { try { await (await getRedisClient()).expire(prefixKey(key), ttl); return true; } catch { return false; } },
        async incr(key) { try { return await (await getRedisClient()).incr(prefixKey(key)); } catch { return null; } },
        async ttl(key) { try { return await (await getRedisClient()).ttl(prefixKey(key)); } catch { return -1; } },
      },
      redisRateLimiter: {
        async checkLimit(identifier, limit, windowSeconds) {
          try {
            const c = await getRedisClient();
            const key = prefixKey(`ratelimit:${identifier}`);
            const now = Date.now();
            await c.zRemRangeByScore(key, 0, now - windowSeconds * 1000);
            const count = await c.zCard(key);
            if (count >= limit) return { allowed: false, remaining: 0, resetAt: now };
            await c.zAdd(key, { score: now, value: `${now}` });
            await c.expire(key, windowSeconds);
            return { allowed: true, remaining: limit - count - 1, resetAt: now + windowSeconds * 1000 };
          } catch { return { allowed: true, remaining: limit, resetAt: Date.now() }; }
        },
      },
      redisSession: {
        async set(sid, data, ttl = 86400) { return cacheModule.redisCache.set(`session:${sid}`, data, ttl); },
        async get(sid) { return cacheModule.redisCache.get(`session:${sid}`); },
        async del(sid) { return cacheModule.redisCache.del(`session:${sid}`); },
        async touch(sid, ttl = 86400) { return cacheModule.redisCache.expire(`session:${sid}`, ttl); },
      },
    };

    logger.info('Redis cache engine loaded');
  } catch (error) {
    // Redis not available, fall back to memory cache
    const logger = (await import('../utils/logger.js')).default;
    logger.warn('Redis not available, falling back to memory cache:', error.message);
    cacheModule = await import('./memory-cache.js');
  }
}

export const initRedis = cacheModule.initRedis;
export const getRedisClient = cacheModule.getRedisClient;
export const isRedisAvailable = cacheModule.isRedisAvailable;
export const isRedisConnected = cacheModule.isRedisConnected || cacheModule.isRedisAvailable;
export const closeRedis = cacheModule.closeRedis;
export const redisHealthCheck = cacheModule.redisHealthCheck;
export const redisCache = cacheModule.redisCache;
export const redisRateLimiter = cacheModule.redisRateLimiter;
export const redisSession = cacheModule.redisSession;

export default {
  initRedis,
  getRedisClient,
  isRedisAvailable,
  closeRedis,
  redisHealthCheck,
  redisCache,
  redisRateLimiter,
  redisSession,
};
