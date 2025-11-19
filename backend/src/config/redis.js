/**
 * Redis Caching Configuration
 * Improves performance by caching frequently accessed data
 *
 * Cache Strategy:
 * - Patient data: 5 minutes (frequently updated)
 * - Templates: 1 hour (rarely change)
 * - Static data (ICPC codes, etc.): 24 hours
 * - Session data: As needed
 */

import { Redis } from 'ioredis';

const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),

  // Connection settings
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  enableOfflineQueue: true,

  // Reconnection
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },

  // Timeouts
  connectTimeout: 10000,
  commandTimeout: 5000,

  // Logging
  lazyConnect: false,
  showFriendlyErrorStack: process.env.NODE_ENV !== 'production'
};

// Main Redis client
export const redis = new Redis(REDIS_CONFIG);

// Subscriber client (for pub/sub)
export const redisSubscriber = new Redis(REDIS_CONFIG);

// Publisher client (for pub/sub)
export const redisPublisher = new Redis(REDIS_CONFIG);

// Connection event handlers
redis.on('connect', () => {
  console.log('✅ Redis connected');
});

redis.on('ready', () => {
  console.log('✅ Redis ready');
});

redis.on('error', (error) => {
  console.error('❌ Redis error:', error);
});

redis.on('close', () => {
  console.warn('⚠️  Redis connection closed');
});

redis.on('reconnecting', () => {
  console.log('🔄 Redis reconnecting...');
});

/**
 * Cache TTL (time-to-live) presets
 */
export const TTL = {
  MINUTE: 60,
  FIVE_MINUTES: 300,
  FIFTEEN_MINUTES: 900,
  HOUR: 3600,
  DAY: 86400,
  WEEK: 604800
};

/**
 * Enhanced cache wrapper with additional features
 */
export const cache = {
  /**
   * Get value from cache
   */
  async get(key) {
    try {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },

  /**
   * Set value in cache
   */
  async set(key, value, ttl = TTL.FIVE_MINUTES) {
    try {
      await redis.setex(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  },

  /**
   * Delete from cache
   */
  async del(key) {
    try {
      await redis.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  },

  /**
   * Delete multiple keys matching pattern
   */
  async delPattern(pattern) {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      return keys.length;
    } catch (error) {
      console.error('Cache delete pattern error:', error);
      return 0;
    }
  },

  /**
   * Check if key exists
   */
  async exists(key) {
    try {
      return await redis.exists(key) === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  },

  /**
   * Get remaining TTL
   */
  async ttl(key) {
    try {
      return await redis.ttl(key);
    } catch (error) {
      console.error('Cache TTL error:', error);
      return -1;
    }
  },

  /**
   * Get or set (cache-aside pattern)
   * If key exists, return cached value
   * If not, execute fetchFunction, cache result, and return
   */
  async getOrSet(key, fetchFunction, ttl = TTL.FIVE_MINUTES) {
    try {
      // Try to get from cache first
      const cached = await this.get(key);
      if (cached !== null) {
        return cached;
      }

      // Cache miss - fetch data
      const data = await fetchFunction();

      // Store in cache
      await this.set(key, data, ttl);

      return data;
    } catch (error) {
      console.error('Cache getOrSet error:', error);
      // On error, just fetch without caching
      return await fetchFunction();
    }
  },

  /**
   * Increment counter
   */
  async incr(key, by = 1) {
    try {
      return await redis.incrby(key, by);
    } catch (error) {
      console.error('Cache incr error:', error);
      return null;
    }
  },

  /**
   * Decrement counter
   */
  async decr(key, by = 1) {
    try {
      return await redis.decrby(key, by);
    } catch (error) {
      console.error('Cache decr error:', error);
      return null;
    }
  },

  /**
   * Set with expiration at specific time
   */
  async setAt(key, value, timestamp) {
    try {
      const now = Math.floor(Date.now() / 1000);
      const ttl = timestamp - now;
      if (ttl > 0) {
        await redis.setex(key, ttl, JSON.stringify(value));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Cache setAt error:', error);
      return false;
    }
  },

  /**
   * Store in hash
   */
  async hset(key, field, value) {
    try {
      await redis.hset(key, field, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Cache hset error:', error);
      return false;
    }
  },

  /**
   * Get from hash
   */
  async hget(key, field) {
    try {
      const value = await redis.hget(key, field);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache hget error:', error);
      return null;
    }
  },

  /**
   * Get all from hash
   */
  async hgetall(key) {
    try {
      const data = await redis.hgetall(key);
      const result = {};
      for (const [field, value] of Object.entries(data)) {
        try {
          result[field] = JSON.parse(value);
        } catch {
          result[field] = value;
        }
      }
      return result;
    } catch (error) {
      console.error('Cache hgetall error:', error);
      return {};
    }
  }
};

/**
 * Specialized cache functions for common use cases
 */

/**
 * Cache patient data
 */
export const cachePatient = {
  key: (patientId) => `patient:${patientId}`,

  async get(patientId) {
    return await cache.get(this.key(patientId));
  },

  async set(patientId, patientData) {
    return await cache.set(this.key(patientId), patientData, TTL.FIVE_MINUTES);
  },

  async invalidate(patientId) {
    return await cache.del(this.key(patientId));
  }
};

/**
 * Cache clinical encounters
 */
export const cacheEncounter = {
  key: (encounterId) => `encounter:${encounterId}`,
  patientKey: (patientId) => `patient:${patientId}:encounters`,

  async get(encounterId) {
    return await cache.get(this.key(encounterId));
  },

  async set(encounterId, encounterData) {
    return await cache.set(this.key(encounterId), encounterData, TTL.FIVE_MINUTES);
  },

  async invalidate(encounterId, patientId = null) {
    await cache.del(this.key(encounterId));
    if (patientId) {
      await cache.del(this.patientKey(patientId));
    }
  }
};

/**
 * Cache templates
 */
export const cacheTemplate = {
  key: (templateId) => `template:${templateId}`,
  categoryKey: (category) => `templates:category:${category}`,

  async get(templateId) {
    return await cache.get(this.key(templateId));
  },

  async set(templateId, templateData) {
    return await cache.set(this.key(templateId), templateData, TTL.HOUR);
  },

  async invalidate(templateId, category = null) {
    await cache.del(this.key(templateId));
    if (category) {
      await cache.del(this.categoryKey(category));
    }
  },

  async invalidateAll() {
    return await cache.delPattern('template:*');
  }
};

/**
 * Session management
 */
export const cacheSession = {
  key: (sessionId) => `session:${sessionId}`,

  async get(sessionId) {
    return await cache.get(this.key(sessionId));
  },

  async set(sessionId, sessionData, ttl = TTL.DAY) {
    return await cache.set(this.key(sessionId), sessionData, ttl);
  },

  async destroy(sessionId) {
    return await cache.del(this.key(sessionId));
  },

  async touch(sessionId, ttl = TTL.DAY) {
    const key = this.key(sessionId);
    return await redis.expire(key, ttl);
  }
};

/**
 * Rate limiting
 */
export const rateLimit = {
  key: (identifier, action) => `ratelimit:${action}:${identifier}`,

  async check(identifier, action, limit, windowSeconds) {
    const key = this.key(identifier, action);
    const current = await cache.incr(key);

    if (current === 1) {
      // First request in window - set expiration
      await redis.expire(key, windowSeconds);
    }

    return {
      allowed: current <= limit,
      current,
      limit,
      resetIn: await redis.ttl(key)
    };
  },

  async reset(identifier, action) {
    return await cache.del(this.key(identifier, action));
  }
};

/**
 * Cache statistics
 */
export const getCacheStats = async () => {
  try {
    const info = await redis.info('stats');
    const memory = await redis.info('memory');

    return {
      totalKeys: await redis.dbsize(),
      memory: memory,
      stats: info,
      connected: redis.status === 'ready'
    };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return null;
  }
};

/**
 * Clear all cache
 */
export const clearAllCache = async () => {
  try {
    await redis.flushdb();
    console.log('✅ All cache cleared');
    return true;
  } catch (error) {
    console.error('Error clearing cache:', error);
    return false;
  }
};

/**
 * Graceful shutdown
 */
export const closeRedis = async () => {
  try {
    await redis.quit();
    await redisSubscriber.quit();
    await redisPublisher.quit();
    console.log('✅ Redis connections closed');
  } catch (error) {
    console.error('Error closing Redis:', error);
  }
};

export default {
  redis,
  redisSubscriber,
  redisPublisher,
  cache,
  cachePatient,
  cacheEncounter,
  cacheTemplate,
  cacheSession,
  rateLimit,
  getCacheStats,
  clearAllCache,
  closeRedis,
  TTL
};
