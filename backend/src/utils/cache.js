/**
 * In-Memory Cache Utility
 * Simple caching strategy for frequently accessed data
 * Can be extended to Redis in production
 */

import logger from './logger.js';

class Cache {
  constructor() {
    this.store = new Map();
    this.ttls = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    };
  }

  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {any|null} Cached value or null
   */
  get(key) {
    // Check if key exists and hasn't expired
    if (this.store.has(key)) {
      const ttl = this.ttls.get(key);
      if (!ttl || ttl > Date.now()) {
        this.stats.hits++;
        return this.store.get(key);
      }
      // Key expired, remove it
      this.delete(key);
    }

    this.stats.misses++;
    return null;
  }

  /**
   * Set value in cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in seconds (default: 300)
   */
  set(key, value, ttl = 300) {
    this.store.set(key, value);
    if (ttl > 0) {
      this.ttls.set(key, Date.now() + (ttl * 1000));
    }
    this.stats.sets++;

    logger.debug('Cache set', { key, ttl });
  }

  /**
   * Delete value from cache
   * @param {string} key - Cache key
   */
  delete(key) {
    const existed = this.store.delete(key);
    this.ttls.delete(key);
    if (existed) {
      this.stats.deletes++;
      logger.debug('Cache delete', { key });
    }
  }

  /**
   * Delete all keys matching pattern
   * @param {string} pattern - Key pattern (supports wildcards *)
   */
  deletePattern(pattern) {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    let count = 0;

    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.delete(key);
        count++;
      }
    }

    logger.debug('Cache delete pattern', { pattern, count });
    return count;
  }

  /**
   * Clear all cache
   */
  clear() {
    const size = this.store.size;
    this.store.clear();
    this.ttls.clear();
    logger.info('Cache cleared', { size });
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
      : 0;

    return {
      ...this.stats,
      size: this.store.size,
      hitRate: `${hitRate}%`
    };
  }

  /**
   * Get or set value (cache-aside pattern)
   * @param {string} key - Cache key
   * @param {Function} fetchFn - Function to fetch data if not cached
   * @param {number} ttl - Time to live in seconds
   */
  async getOrSet(key, fetchFn, ttl = 300) {
    const cached = this.get(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fetchFn();
    this.set(key, value, ttl);
    return value;
  }

  /**
   * Clean expired entries
   */
  cleanExpired() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, ttl] of this.ttls.entries()) {
      if (ttl <= now) {
        this.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info('Cleaned expired cache entries', { cleaned });
    }

    return cleaned;
  }
}

// Create singleton instance
const cache = new Cache();

// Clean expired entries every 5 minutes
setInterval(() => {
  cache.cleanExpired();
}, 5 * 60 * 1000);

// Log cache stats every hour in development
if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    logger.debug('Cache stats', cache.getStats());
  }, 60 * 60 * 1000);
}

/**
 * Cache key builders for consistent naming
 */
export const CacheKeys = {
  diagnosisCode: (code) => `diagnosis:${code}`,
  diagnosisCodesList: (system) => `diagnosis:list:${system || 'all'}`,
  treatmentCode: (code) => `treatment:${code}`,
  treatmentCodesList: () => 'treatment:list:all',
  patientStats: (patientId) => `patient:${patientId}:stats`,
  organizationSettings: (orgId) => `org:${orgId}:settings`,
  messageTemplate: (templateId) => `template:${templateId}`,
  kpiStats: (orgId, startDate, endDate) => `kpi:${orgId}:${startDate}:${endDate}`
};

export default cache;
