/**
 * Hybrid Cache Utility
 * Uses Redis when available, falls back to in-memory cache
 */

import logger from './logger.js';
import { redisCache, isRedisAvailable, initRedis } from '../config/redis.js';

// In-memory fallback cache
class MemoryCache {
  constructor() {
    this.store = new Map();
    this.ttls = new Map();
    this.stats = { hits: 0, misses: 0, sets: 0, deletes: 0 };
  }

  get(key) {
    if (this.store.has(key)) {
      const ttl = this.ttls.get(key);
      if (!ttl || ttl > Date.now()) {
        this.stats.hits++;
        return this.store.get(key);
      }
      this.delete(key);
    }
    this.stats.misses++;
    return null;
  }

  set(key, value, ttlSeconds = 300) {
    this.store.set(key, value);
    if (ttlSeconds > 0) {
      this.ttls.set(key, Date.now() + ttlSeconds * 1000);
    }
    this.stats.sets++;
  }

  delete(key) {
    const existed = this.store.delete(key);
    this.ttls.delete(key);
    if (existed) {
      this.stats.deletes++;
    }
    return existed;
  }

  deletePattern(pattern) {
    const regex = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`);
    let count = 0;
    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.delete(key);
        count++;
      }
    }
    return count;
  }

  clear() {
    const size = this.store.size;
    this.store.clear();
    this.ttls.clear();
    return size;
  }

  getStats() {
    const hitRate =
      this.stats.hits + this.stats.misses > 0
        ? ((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100).toFixed(2)
        : 0;
    return { ...this.stats, size: this.store.size, hitRate: `${hitRate}%`, backend: 'memory' };
  }

  cleanExpired() {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, ttl] of this.ttls.entries()) {
      if (ttl <= now) {
        this.delete(key);
        cleaned++;
      }
    }
    return cleaned;
  }
}

const memoryCache = new MemoryCache();

// Track if Redis initialization was attempted
let redisInitialized = false;

/**
 * Initialize cache (attempts Redis connection)
 */
export const initCache = async () => {
  if (redisInitialized) {
    return;
  }

  try {
    if (process.env.REDIS_URL || process.env.REDIS_ENABLED === 'true') {
      await initRedis();
      logger.info('Cache: Using Redis backend');
    } else {
      logger.info('Cache: Using in-memory backend (REDIS_URL not configured)');
    }
  } catch (error) {
    logger.warn('Cache: Redis unavailable, using in-memory fallback', error.message);
  }

  redisInitialized = true;
};

/**
 * Hybrid Cache - Redis with memory fallback
 */
const hybridCache = {
  /**
   * Get value from cache
   */
  async get(key) {
    if (isRedisAvailable()) {
      try {
        return await redisCache.get(key);
      } catch (error) {
        logger.warn('Redis GET failed, using memory cache:', error.message);
      }
    }
    return memoryCache.get(key);
  },

  /**
   * Set value in cache
   */
  async set(key, value, ttlSeconds = 300) {
    // Always set in memory cache for fast access
    memoryCache.set(key, value, ttlSeconds);

    if (isRedisAvailable()) {
      try {
        await redisCache.set(key, value, ttlSeconds);
      } catch (error) {
        logger.warn('Redis SET failed:', error.message);
      }
    }
  },

  /**
   * Delete value from cache
   */
  async del(key) {
    memoryCache.delete(key);

    if (isRedisAvailable()) {
      try {
        await redisCache.del(key);
      } catch (error) {
        logger.warn('Redis DEL failed:', error.message);
      }
    }
  },

  /**
   * Delete keys matching pattern
   */
  async delPattern(pattern) {
    const memDeleted = memoryCache.deletePattern(pattern);

    if (isRedisAvailable()) {
      try {
        const redisDeleted = await redisCache.delPattern(pattern);
        return Math.max(memDeleted, redisDeleted);
      } catch (error) {
        logger.warn('Redis DEL pattern failed:', error.message);
      }
    }

    return memDeleted;
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
   * Clear all cache
   */
  async clear() {
    const memCleared = memoryCache.clear();

    if (isRedisAvailable()) {
      try {
        await redisCache.delPattern('*');
      } catch (error) {
        logger.warn('Redis clear failed:', error.message);
      }
    }

    return memCleared;
  },

  /**
   * Get cache statistics
   */
  getStats() {
    const stats = memoryCache.getStats();
    stats.redisAvailable = isRedisAvailable();
    stats.backend = isRedisAvailable() ? 'redis+memory' : 'memory';
    return stats;
  },

  /**
   * Check if key exists
   */
  async exists(key) {
    if (isRedisAvailable()) {
      try {
        return await redisCache.exists(key);
      } catch (error) {
        logger.warn('Redis EXISTS failed:', error.message);
      }
    }
    return memoryCache.store.has(key);
  },
};

// Clean expired entries periodically for memory cache
setInterval(
  () => {
    memoryCache.cleanExpired();
  },
  5 * 60 * 1000
);

/**
 * Cache key builders for consistent naming
 */
export const CacheKeys = {
  // Reference data
  diagnosisCode: (code) => `diagnosis:${code}`,
  diagnosisCodesList: (system) => `diagnosis:list:${system || 'all'}`,
  diagnosisSearch: (query) => `diagnosis:search:${query.toLowerCase()}`,
  treatmentCode: (code) => `treatment:${code}`,
  treatmentCodesList: () => 'treatment:list:all',

  // Patient data
  patient: (patientId) => `patient:${patientId}`,
  patientStats: (patientId) => `patient:${patientId}:stats`,
  patientSearch: (orgId, query) => `patient:search:${orgId}:${query.toLowerCase()}`,

  // Organization data
  organizationSettings: (orgId) => `org:${orgId}:settings`,
  organizationUsers: (orgId) => `org:${orgId}:users`,

  // Templates
  messageTemplate: (templateId) => `template:${templateId}`,
  templatesList: (orgId) => `templates:list:${orgId}`,

  // KPI data
  kpiDaily: (orgId, date) => `kpi:${orgId}:daily:${date}`,
  kpiWeekly: (orgId, startDate) => `kpi:${orgId}:weekly:${startDate}`,
  kpiMonthly: (orgId, month, year) => `kpi:${orgId}:monthly:${year}-${month}`,
  kpiDashboard: (orgId) => `kpi:${orgId}:dashboard`,

  // Response caching
  apiResponse: (orgId, path) => `response:${orgId}:${path}`,
};

export default hybridCache;
