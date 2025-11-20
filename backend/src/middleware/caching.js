/**
 * Caching Middleware
 * Caches API responses for GET requests
 */

import { getCache, setCache } from '../config/redis.js';
import logger from '../utils/logger.js';

/**
 * Cache GET requests
 * @param {number} ttl - Time to live in seconds (default: 5 minutes)
 */
export const cacheMiddleware = (ttl = 300) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Don't cache if Redis is not configured
    if (!process.env.REDIS_URL) {
      return next();
    }

    try {
      // Generate cache key from URL and organization
      const organizationId = req.headers['x-organization-id'];
      const cacheKey = `api:${organizationId}:${req.originalUrl}`;

      // Try to get from cache
      const cachedResponse = await getCache(cacheKey);

      if (cachedResponse) {
        logger.debug('Serving from cache', { key: cacheKey });
        return res.json(cachedResponse);
      }

      // Store original res.json function
      const originalJson = res.json.bind(res);

      // Override res.json to cache the response
      res.json = (body) => {
        // Only cache successful responses
        if (res.statusCode === 200) {
          setCache(cacheKey, body, ttl).catch(err => {
            logger.error('Failed to cache response', { error: err.message });
          });
        }

        return originalJson(body);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error', { error: error.message });
      next(); // Proceed without caching
    }
  };
};

/**
 * Cache invalidation middleware
 * Invalidates cache on data mutations (POST, PUT, PATCH, DELETE)
 */
export const invalidateCacheMiddleware = () => {
  return async (req, res, next) => {
    const { deleteCache } = await import('../config/redis.js');

    // Only invalidate on mutations
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      const organizationId = req.headers['x-organization-id'];

      // Store original res.json
      const originalJson = res.json.bind(res);

      res.json = (body) => {
        // Invalidate related caches on successful mutation
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const resource = req.originalUrl.split('/')[3]; // e.g., 'patients', 'encounters'
          deleteCache(`api:${organizationId}:*/api/v1/${resource}*`).catch(err => {
            logger.error('Failed to invalidate cache', { error: err.message });
          });
        }

        return originalJson(body);
      };
    }

    next();
  };
};

export default {
  cacheMiddleware,
  invalidateCacheMiddleware
};
