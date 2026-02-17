/**
 * Cache Manager - Unified caching with Redis and In-Memory fallback
 * Implements Cache-Aside and Write-Through patterns
 *
 * @module infrastructure/cache/CacheManager
 */

import logger from '../../utils/logger.js';
import { getRedisClient, isRedisConnected } from '../../config/redis.js';

/**
 * Cache Manager with multi-level caching support
 */
export class CacheManager {
  /**
   * @param {Object} options
   * @param {number} options.defaultTTL - Default TTL in seconds (default: 3600)
   * @param {string} options.prefix - Key prefix (default: 'chiro')
   * @param {boolean} options.useLocalFallback - Use in-memory when Redis unavailable (default: true)
   */
  constructor(options = {}) {
    this.defaultTTL = options.defaultTTL || 3600;
    this.prefix = options.prefix || 'chiro';
    this.useLocalFallback = options.useLocalFallback !== false;

    // In-memory fallback cache
    this.localCache = new Map();
    this.localTTLs = new Map();

    // Statistics
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      redisErrors: 0,
      localFallbacks: 0,
    };

    // Clean expired local entries every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanExpiredLocal();
      },
      5 * 60 * 1000
    );

    logger.info('CacheManager initialized', { prefix: this.prefix });
  }

  /**
   * Build cache key with prefix
   * @private
   */
  buildKey(key) {
    return `${this.prefix}:${key}`;
  }

  /**
   * Get value from cache (Cache-Aside pattern)
   * @param {string} key - Cache key
   * @returns {Promise<any|null>} Cached value or null
   */
  async get(key) {
    const fullKey = this.buildKey(key);

    // Try Redis first
    if (isRedisConnected()) {
      try {
        const redis = getRedisClient();
        const value = await redis.get(fullKey);

        if (value) {
          this.stats.hits++;
          logger.debug(`Cache HIT (Redis): ${key}`);
          return JSON.parse(value);
        }
      } catch (error) {
        this.stats.redisErrors++;
        logger.warn(`Redis GET error: ${error.message}`);
      }
    }

    // Try local fallback
    if (this.useLocalFallback && this.localCache.has(fullKey)) {
      const ttl = this.localTTLs.get(fullKey);
      if (!ttl || ttl > Date.now()) {
        this.stats.hits++;
        this.stats.localFallbacks++;
        logger.debug(`Cache HIT (local): ${key}`);
        return this.localCache.get(fullKey);
      }
      // Expired
      this.localCache.delete(fullKey);
      this.localTTLs.delete(fullKey);
    }

    this.stats.misses++;
    logger.debug(`Cache MISS: ${key}`);
    return null;
  }

  /**
   * Set value in cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - TTL in seconds (default: defaultTTL)
   */
  async set(key, value, ttl = this.defaultTTL) {
    const fullKey = this.buildKey(key);
    const serialized = JSON.stringify(value);

    this.stats.sets++;

    // Try Redis first
    if (isRedisConnected()) {
      try {
        const redis = getRedisClient();
        if (ttl > 0) {
          await redis.setex(fullKey, ttl, serialized);
        } else {
          await redis.set(fullKey, serialized);
        }
        logger.debug(`Cache SET (Redis): ${key}, TTL: ${ttl}s`);
      } catch (error) {
        this.stats.redisErrors++;
        logger.warn(`Redis SET error: ${error.message}`);
      }
    }

    // Always set in local for fallback
    if (this.useLocalFallback) {
      this.localCache.set(fullKey, value);
      if (ttl > 0) {
        this.localTTLs.set(fullKey, Date.now() + ttl * 1000);
      }
    }
  }

  /**
   * Get or Set (Cache-Aside pattern with loader)
   * @param {string} key - Cache key
   * @param {Function} loadFn - Async function to load data if not cached
   * @param {number} ttl - TTL in seconds
   * @returns {Promise<any>} Cached or loaded value
   */
  async getOrSet(key, loadFn, ttl = this.defaultTTL) {
    // Check cache first
    let value = await this.get(key);

    if (value !== null) {
      return value;
    }

    // Load from source
    value = await loadFn();

    // Cache the result
    if (value !== undefined && value !== null) {
      await this.set(key, value, ttl);
    }

    return value;
  }

  /**
   * Write-Through pattern - update cache and persist together
   * @param {string} key - Cache key
   * @param {any} value - Value to cache and persist
   * @param {Function} persistFn - Async function to persist data
   * @param {number} ttl - TTL in seconds
   */
  async writeThrough(key, value, persistFn, ttl = this.defaultTTL) {
    // Persist first
    const persisted = await persistFn(value);

    // Then cache
    await this.set(key, persisted || value, ttl);

    return persisted || value;
  }

  /**
   * Delete value from cache
   * @param {string} key - Cache key
   */
  async delete(key) {
    const fullKey = this.buildKey(key);

    this.stats.deletes++;

    // Delete from Redis
    if (isRedisConnected()) {
      try {
        const redis = getRedisClient();
        await redis.del(fullKey);
        logger.debug(`Cache DELETE (Redis): ${key}`);
      } catch (error) {
        this.stats.redisErrors++;
        logger.warn(`Redis DELETE error: ${error.message}`);
      }
    }

    // Delete from local
    this.localCache.delete(fullKey);
    this.localTTLs.delete(fullKey);
  }

  /**
   * Delete all keys matching pattern
   * @param {string} pattern - Pattern with wildcards (*)
   */
  async deletePattern(pattern) {
    const fullPattern = this.buildKey(pattern);

    // Delete from Redis using SCAN + DEL
    if (isRedisConnected()) {
      try {
        const redis = getRedisClient();
        let cursor = '0';
        let deletedCount = 0;

        do {
          const [newCursor, keys] = await redis.scan(
            cursor,
            'MATCH',
            fullPattern.replace(/\*/g, '*'),
            'COUNT',
            100
          );
          cursor = newCursor;

          if (keys.length > 0) {
            await redis.del(...keys);
            deletedCount += keys.length;
          }
        } while (cursor !== '0');

        logger.debug(`Cache DELETE PATTERN (Redis): ${pattern}, count: ${deletedCount}`);
      } catch (error) {
        this.stats.redisErrors++;
        logger.warn(`Redis DELETE PATTERN error: ${error.message}`);
      }
    }

    // Delete from local
    const regex = new RegExp(`^${fullPattern.replace(/\*/g, '.*')}$`);
    for (const key of this.localCache.keys()) {
      if (regex.test(key)) {
        this.localCache.delete(key);
        this.localTTLs.delete(key);
      }
    }
  }

  /**
   * Invalidate cache for an entity by ID
   * Useful after updates/deletes
   * @param {string} entityType - Entity type (patient, appointment, etc.)
   * @param {string} entityId - Entity ID
   */
  async invalidateEntity(entityType, entityId) {
    await this.deletePattern(`${entityType}:${entityId}:*`);
    await this.delete(`${entityType}:${entityId}`);
  }

  /**
   * Clean expired local cache entries
   * @private
   */
  cleanExpiredLocal() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, ttl] of this.localTTLs.entries()) {
      if (ttl <= now) {
        this.localCache.delete(key);
        this.localTTLs.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug(`Cleaned ${cleaned} expired local cache entries`);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate =
      this.stats.hits + this.stats.misses > 0
        ? ((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100).toFixed(2)
        : 0;

    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      localCacheSize: this.localCache.size,
      redisConnected: isRedisConnected(),
    };
  }

  /**
   * Clear all cache
   */
  async clear() {
    // Clear Redis (only prefix keys)
    if (isRedisConnected()) {
      await this.deletePattern('*');
    }

    // Clear local
    this.localCache.clear();
    this.localTTLs.clear();

    logger.info('CacheManager cleared');
  }

  /**
   * Shutdown cleanup
   */
  shutdown() {
    clearInterval(this.cleanupInterval);
    logger.info('CacheManager shutdown');
  }
}

// Create singleton instance
export const cacheManager = new CacheManager();

/**
 * Pre-defined cache key builders for consistent naming
 */
export const CacheKeys = {
  // Patient
  patient: (id) => `patient:${id}`,
  patientList: (orgId, page, filters) => `patients:${orgId}:${page}:${JSON.stringify(filters)}`,
  patientStats: (id) => `patient:${id}:stats`,

  // Appointments
  appointment: (id) => `appointment:${id}`,
  appointmentsByDate: (orgId, date) => `appointments:${orgId}:${date}`,
  todayAppointments: (orgId) => `appointments:${orgId}:today`,

  // Templates
  template: (id) => `template:${id}`,
  templatesByType: (orgId, type) => `templates:${orgId}:${type}`,

  // Diagnosis codes
  diagnosisCode: (code) => `diagnosis:code:${code}`,
  diagnosisList: (system) => `diagnosis:list:${system}`,

  // AI
  aiSuggestion: (contextHash) => `ai:suggestion:${contextHash}`,
  aiMetrics: () => 'ai:metrics:dashboard',
  aiModel: () => 'ai:model:current',

  // Organization
  orgSettings: (orgId) => `org:${orgId}:settings`,
  orgUsers: (orgId) => `org:${orgId}:users`,

  // KPI
  kpiStats: (orgId, startDate, endDate) => `kpi:${orgId}:${startDate}:${endDate}`,
  dashboardStats: (orgId) => `dashboard:${orgId}:stats`,
};

/**
 * TTL presets for different data types
 */
export const CacheTTL = {
  SHORT: 60, // 1 minute - volatile data
  MEDIUM: 300, // 5 minutes - moderately stable
  DEFAULT: 3600, // 1 hour - stable data
  LONG: 7200, // 2 hours - infrequently changing
  DAY: 86400, // 24 hours - static reference data
  WEEK: 604800, // 7 days - very static data
};

export default { cacheManager, CacheKeys, CacheTTL };
