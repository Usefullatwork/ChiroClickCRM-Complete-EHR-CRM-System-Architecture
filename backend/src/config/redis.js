/**
 * Redis Configuration for Caching
 * Improves performance by caching frequently accessed data
 */

import { createClient } from 'redis';
import logger from '../utils/logger.js';

let redisClient = null;
let isConnected = false;

/**
 * Initialize Redis connection
 */
export const initRedis = async () => {
  if (!process.env.REDIS_URL) {
    logger.warn('Redis not configured - caching disabled');
    return null;
  }

  try {
    redisClient = createClient({
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Redis max reconnection attempts reached');
            return new Error('Redis unavailable');
          }
          return Math.min(retries * 100, 3000);
        }
      }
    });

    redisClient.on('error', (err) => {
      logger.error('Redis client error', { error: err.message });
      isConnected = false;
    });

    redisClient.on('connect', () => {
      logger.info('✓ Redis connected successfully');
      isConnected = true;
    });

    redisClient.on('ready', () => {
      logger.info('✓ Redis ready to accept commands');
    });

    await redisClient.connect();

    return redisClient;
  } catch (error) {
    logger.error('Failed to initialize Redis', { error: error.message });
    return null;
  }
};

/**
 * Get cached data
 * @param {string} key - Cache key
 * @returns {Promise<any>} Cached data or null
 */
export const getCache = async (key) => {
  if (!isConnected || !redisClient) {
    return null;
  }

  try {
    const data = await redisClient.get(key);
    if (data) {
      logger.debug('Cache hit', { key });
      return JSON.parse(data);
    }
    logger.debug('Cache miss', { key });
    return null;
  } catch (error) {
    logger.error('Redis GET error', { key, error: error.message });
    return null; // Fail gracefully
  }
};

/**
 * Set cache data
 * @param {string} key - Cache key
 * @param {any} value - Data to cache
 * @param {number} ttl - Time to live in seconds (default: 5 minutes)
 */
export const setCache = async (key, value, ttl = 300) => {
  if (!isConnected || !redisClient) {
    return false;
  }

  try {
    await redisClient.set(key, JSON.stringify(value), {
      EX: ttl
    });
    logger.debug('Cache set', { key, ttl });
    return true;
  } catch (error) {
    logger.error('Redis SET error', { key, error: error.message });
    return false;
  }
};

/**
 * Delete cached data
 * @param {string} key - Cache key or pattern
 */
export const deleteCache = async (key) => {
  if (!isConnected || !redisClient) {
    return false;
  }

  try {
    // If key contains wildcard, delete all matching keys
    if (key.includes('*')) {
      const keys = await redisClient.keys(key);
      if (keys.length > 0) {
        await redisClient.del(keys);
        logger.debug('Cache pattern deleted', { pattern: key, count: keys.length });
      }
    } else {
      await redisClient.del(key);
      logger.debug('Cache deleted', { key });
    }
    return true;
  } catch (error) {
    logger.error('Redis DEL error', { key, error: error.message });
    return false;
  }
};

/**
 * Invalidate caches for an organization
 * @param {string} organizationId - Organization UUID
 */
export const invalidateOrganizationCache = async (organizationId) => {
  await deleteCache(`org:${organizationId}:*`);
};

/**
 * Cache wrapper for database queries
 * @param {string} key - Cache key
 * @param {Function} queryFn - Function that returns the data
 * @param {number} ttl - Time to live in seconds
 */
export const cacheQuery = async (key, queryFn, ttl = 300) => {
  // Try to get from cache first
  const cached = await getCache(key);
  if (cached !== null) {
    return cached;
  }

  // Execute query
  const data = await queryFn();

  // Store in cache
  await setCache(key, data, ttl);

  return data;
};

/**
 * Close Redis connection
 */
export const closeRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
    logger.info('✓ Redis connection closed');
  }
};

/**
 * Health check
 */
export const redisHealthCheck = async () => {
  if (!redisClient || !isConnected) {
    return false;
  }

  try {
    await redisClient.ping();
    return true;
  } catch (error) {
    return false;
  }
};

export default {
  initRedis,
  getCache,
  setCache,
  deleteCache,
  invalidateOrganizationCache,
  cacheQuery,
  closeRedis,
  redisHealthCheck
};
