/**
 * In-Memory Cache
 * Map-based cache with TTL support. Drop-in replacement for Redis cache.
 * Used in desktop/standalone mode when Redis is not available.
 */

import logger from '../utils/logger.js';

const store = new Map();
const timers = new Map();

const KEY_PREFIX = 'chiroclickcrm:';

const prefixKey = (key) => `${KEY_PREFIX}${key}`;

/**
 * Set a value with optional TTL
 */
const set = (key, value, ttlSeconds = 0) => {
  const prefixed = prefixKey(key);
  // Clear existing timer
  if (timers.has(prefixed)) {
    clearTimeout(timers.get(prefixed));
    timers.delete(prefixed);
  }
  store.set(prefixed, JSON.stringify(value));
  if (ttlSeconds > 0) {
    const timer = setTimeout(() => {
      store.delete(prefixed);
      timers.delete(prefixed);
    }, ttlSeconds * 1000);
    timer.unref?.(); // Don't keep process alive for cache cleanup
    timers.set(prefixed, timer);
  }
};

/**
 * Get a value
 */
const get = (key) => {
  const prefixed = prefixKey(key);
  const value = store.get(prefixed);
  if (value === undefined) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

/**
 * Delete a key
 */
const del = (key) => {
  const prefixed = prefixKey(key);
  if (timers.has(prefixed)) {
    clearTimeout(timers.get(prefixed));
    timers.delete(prefixed);
  }
  return store.delete(prefixed);
};

/**
 * Delete keys matching a glob pattern (simple * wildcard)
 */
const delPattern = (pattern) => {
  const prefixed = prefixKey(pattern);
  const regex = new RegExp('^' + prefixed.replace(/\*/g, '.*') + '$');
  let count = 0;
  for (const key of store.keys()) {
    if (regex.test(key)) {
      if (timers.has(key)) {
        clearTimeout(timers.get(key));
        timers.delete(key);
      }
      store.delete(key);
      count++;
    }
  }
  return count;
};

/**
 * Check if key exists
 */
const exists = (key) => store.has(prefixKey(key));

/**
 * Increment a counter
 */
const incr = (key) => {
  const prefixed = prefixKey(key);
  const current = parseInt(store.get(prefixed) || '0', 10);
  const next = current + 1;
  store.set(prefixed, String(next));
  return next;
};

/**
 * Set expiry on existing key
 */
const expire = (key, ttlSeconds) => {
  const prefixed = prefixKey(key);
  if (!store.has(prefixed)) return false;
  if (timers.has(prefixed)) {
    clearTimeout(timers.get(prefixed));
  }
  const timer = setTimeout(() => {
    store.delete(prefixed);
    timers.delete(prefixed);
  }, ttlSeconds * 1000);
  timer.unref?.();
  timers.set(prefixed, timer);
  return true;
};

/**
 * Clear all keys
 */
const flushAll = () => {
  for (const timer of timers.values()) {
    clearTimeout(timer);
  }
  store.clear();
  timers.clear();
};

// ============================================================================
// Redis-compatible API exports
// ============================================================================

export const initRedis = async () => {
  logger.info('Memory cache initialized (standalone mode)');
  return true;
};

export const getRedisClient = async () => null;
export const isRedisAvailable = () => true;
export const isRedisConnected = () => true;
export const closeRedis = async () => {
  flushAll();
  logger.info('Memory cache cleared');
};

export const redisHealthCheck = async () => true;

export const redisCache = {
  async get(key) { return get(key); },
  async set(key, value, ttlSeconds = 300) {
    set(key, value, ttlSeconds);
    return true;
  },
  async del(key) { del(key); return true; },
  async delPattern(pattern) { return delPattern(pattern); },
  async getOrSet(key, fetchFn, ttlSeconds = 300) {
    const cached = get(key);
    if (cached !== null) return cached;
    const value = await fetchFn();
    set(key, value, ttlSeconds);
    return value;
  },
  async exists(key) { return exists(key); },
  async expire(key, ttlSeconds) { return expire(key, ttlSeconds); },
  async incr(key) { return incr(key); },
  async ttl(key) { return -1; }, // TTL not tracked precisely in memory
};

export const redisRateLimiter = {
  async checkLimit(identifier, limit, windowSeconds) {
    const key = `ratelimit:${identifier}`;
    const now = Date.now();
    const prefixed = prefixKey(key);

    // Get or create the sliding window array
    let entries = [];
    try {
      const stored = store.get(prefixed);
      if (stored) entries = JSON.parse(stored);
    } catch { /* ignore */ }

    // Remove old entries outside window
    const windowStart = now - windowSeconds * 1000;
    entries = entries.filter(ts => ts > windowStart);

    if (entries.length >= limit) {
      return { allowed: false, remaining: 0, resetAt: windowStart + windowSeconds * 1000 };
    }

    entries.push(now);
    store.set(prefixed, JSON.stringify(entries));

    // Auto-expire
    if (timers.has(prefixed)) clearTimeout(timers.get(prefixed));
    const timer = setTimeout(() => {
      store.delete(prefixed);
      timers.delete(prefixed);
    }, windowSeconds * 1000);
    timer.unref?.();
    timers.set(prefixed, timer);

    return { allowed: true, remaining: limit - entries.length, resetAt: now + windowSeconds * 1000 };
  },
};

export const redisSession = {
  async set(sessionId, data, ttlSeconds = 86400) {
    return redisCache.set(`session:${sessionId}`, data, ttlSeconds);
  },
  async get(sessionId) {
    return redisCache.get(`session:${sessionId}`);
  },
  async del(sessionId) {
    return redisCache.del(`session:${sessionId}`);
  },
  async touch(sessionId, ttlSeconds = 86400) {
    return redisCache.expire(`session:${sessionId}`, ttlSeconds);
  },
};

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
