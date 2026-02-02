/**
 * Redis Client Configuration
 * Provides Redis connection for caching and session storage
 */

import { createClient } from 'redis';
import logger from '../utils/logger.js';

// Redis configuration from environment
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;
const REDIS_DB = parseInt(process.env.REDIS_DB || '0');
const REDIS_KEY_PREFIX = process.env.REDIS_KEY_PREFIX || 'chiroclickcrm:';

// Create Redis client
let client = null;
let isConnected = false;

/**
 * Initialize Redis connection
 */
export const initRedis = async () => {
  if (client && isConnected) {
    return client;
  }

  try {
    client = createClient({
      url: REDIS_URL,
      password: REDIS_PASSWORD,
      database: REDIS_DB,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Redis: Max reconnection attempts reached');
            return new Error('Max reconnection attempts reached');
          }
          const delay = Math.min(retries * 100, 3000);
          logger.warn(`Redis: Reconnecting in ${delay}ms (attempt ${retries})`);
          return delay;
        },
      },
    });

    client.on('error', (err) => {
      logger.error('Redis Client Error:', err);
      isConnected = false;
    });

    client.on('connect', () => {
      logger.info('Redis: Connecting...');
    });

    client.on('ready', () => {
      logger.info('Redis: Connected and ready');
      isConnected = true;
    });

    client.on('end', () => {
      logger.info('Redis: Connection closed');
      isConnected = false;
    });

    await client.connect();
    return client;
  } catch (error) {
    logger.error('Redis: Failed to connect', error);
    throw error;
  }
};

/**
 * Get Redis client (initializes if needed)
 */
export const getRedisClient = async () => {
  if (!client || !isConnected) {
    await initRedis();
  }
  return client;
};

/**
 * Check if Redis is available
 */
export const isRedisAvailable = () => isConnected;

/**
 * Alias for isRedisAvailable (for backwards compatibility)
 */
export const isRedisConnected = () => isConnected;

/**
 * Close Redis connection
 */
export const closeRedis = async () => {
  if (client) {
    await client.quit();
    client = null;
    isConnected = false;
    logger.info('Redis: Connection closed gracefully');
  }
};

/**
 * Redis health check
 */
export const redisHealthCheck = async () => {
  try {
    if (!client || !isConnected) {
      return false;
    }
    const result = await client.ping();
    return result === 'PONG';
  } catch (error) {
    logger.error('Redis health check failed:', error);
    return false;
  }
};

/**
 * Prefixed key helper
 */
export const prefixKey = (key) => `${REDIS_KEY_PREFIX}${key}`;

/**
 * Redis Cache Operations
 */
export const redisCache = {
  /**
   * Get value from Redis
   */
  async get(key) {
    try {
      const client = await getRedisClient();
      const value = await client.get(prefixKey(key));
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Redis GET error:', error);
      return null;
    }
  },

  /**
   * Set value in Redis with optional TTL
   */
  async set(key, value, ttlSeconds = 300) {
    try {
      const client = await getRedisClient();
      const serialized = JSON.stringify(value);
      if (ttlSeconds > 0) {
        await client.setEx(prefixKey(key), ttlSeconds, serialized);
      } else {
        await client.set(prefixKey(key), serialized);
      }
      return true;
    } catch (error) {
      logger.error('Redis SET error:', error);
      return false;
    }
  },

  /**
   * Delete key from Redis
   */
  async del(key) {
    try {
      const client = await getRedisClient();
      await client.del(prefixKey(key));
      return true;
    } catch (error) {
      logger.error('Redis DEL error:', error);
      return false;
    }
  },

  /**
   * Delete keys matching pattern
   */
  async delPattern(pattern) {
    try {
      const client = await getRedisClient();
      const keys = await client.keys(prefixKey(pattern));
      if (keys.length > 0) {
        await client.del(keys);
      }
      return keys.length;
    } catch (error) {
      logger.error('Redis DEL pattern error:', error);
      return 0;
    }
  },

  /**
   * Get or set value (cache-aside pattern)
   */
  async getOrSet(key, fetchFn, ttlSeconds = 300) {
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fetchFn();
    await this.set(key, value, ttlSeconds);
    return value;
  },

  /**
   * Check if key exists
   */
  async exists(key) {
    try {
      const client = await getRedisClient();
      return await client.exists(prefixKey(key));
    } catch (error) {
      logger.error('Redis EXISTS error:', error);
      return false;
    }
  },

  /**
   * Set expiry on existing key
   */
  async expire(key, ttlSeconds) {
    try {
      const client = await getRedisClient();
      await client.expire(prefixKey(key), ttlSeconds);
      return true;
    } catch (error) {
      logger.error('Redis EXPIRE error:', error);
      return false;
    }
  },

  /**
   * Increment counter
   */
  async incr(key) {
    try {
      const client = await getRedisClient();
      return await client.incr(prefixKey(key));
    } catch (error) {
      logger.error('Redis INCR error:', error);
      return null;
    }
  },

  /**
   * Get TTL for key
   */
  async ttl(key) {
    try {
      const client = await getRedisClient();
      return await client.ttl(prefixKey(key));
    } catch (error) {
      logger.error('Redis TTL error:', error);
      return -1;
    }
  },
};

/**
 * Redis Rate Limiting Helper
 */
export const redisRateLimiter = {
  /**
   * Check rate limit using sliding window
   */
  async checkLimit(identifier, limit, windowSeconds) {
    try {
      const client = await getRedisClient();
      const key = prefixKey(`ratelimit:${identifier}`);
      const now = Date.now();
      const windowStart = now - windowSeconds * 1000;

      // Remove old entries
      await client.zRemRangeByScore(key, 0, windowStart);

      // Count current entries
      const count = await client.zCard(key);

      if (count >= limit) {
        return { allowed: false, remaining: 0, resetAt: windowStart + windowSeconds * 1000 };
      }

      // Add new entry
      await client.zAdd(key, { score: now, value: `${now}` });
      await client.expire(key, windowSeconds);

      return { allowed: true, remaining: limit - count - 1, resetAt: now + windowSeconds * 1000 };
    } catch (error) {
      logger.error('Redis rate limit error:', error);
      // Fail open - allow request if Redis is unavailable
      return { allowed: true, remaining: limit, resetAt: Date.now() };
    }
  },
};

/**
 * Redis Session Store Helper
 */
export const redisSession = {
  /**
   * Store session data
   */
  async set(sessionId, data, ttlSeconds = 86400) {
    return redisCache.set(`session:${sessionId}`, data, ttlSeconds);
  },

  /**
   * Get session data
   */
  async get(sessionId) {
    return redisCache.get(`session:${sessionId}`);
  },

  /**
   * Delete session
   */
  async del(sessionId) {
    return redisCache.del(`session:${sessionId}`);
  },

  /**
   * Refresh session TTL
   */
  async touch(sessionId, ttlSeconds = 86400) {
    return redisCache.expire(`session:${sessionId}`, ttlSeconds);
  },
};

export default {
  initRedis,
  getRedisClient,
  isRedisAvailable,
  isRedisConnected,
  closeRedis,
  redisHealthCheck,
  redisCache,
  redisRateLimiter,
  redisSession,
};
