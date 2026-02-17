/**
 * Cache Middleware
 * Provides response caching and cache headers for API endpoints
 */

import cache, { _CacheKeys } from '../utils/cache.js';
import logger from '../utils/logger.js';

/**
 * Response caching middleware
 * Caches GET request responses for specified duration
 *
 * @param {Object} options - Cache options
 * @param {number} options.ttl - Time to live in seconds (default: 300)
 * @param {Function} options.keyGenerator - Custom cache key generator
 * @param {Function} options.condition - Condition function to determine if response should be cached
 */
export const cacheResponse = (options = {}) => {
  const { ttl = 300, keyGenerator = null, condition = () => true } = options;

  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key
    const cacheKey = keyGenerator
      ? keyGenerator(req)
      : `response:${req.organizationId}:${req.originalUrl}`;

    // Check cache
    const cached = cache.get(cacheKey);
    if (cached) {
      res.set('X-Cache', 'HIT');
      res.set('X-Cache-Key', cacheKey);
      return res.json(cached);
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to cache response
    res.json = (data) => {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300 && condition(req, res, data)) {
        cache.set(cacheKey, data, ttl);
        res.set('X-Cache', 'MISS');
        res.set('X-Cache-TTL', ttl.toString());
      }
      return originalJson(data);
    };

    next();
  };
};

/**
 * Cache control headers middleware
 * Sets appropriate Cache-Control headers based on route type
 *
 * @param {Object} options - Cache control options
 * @param {number} options.maxAge - Max age in seconds for browser cache
 * @param {boolean} options.private - Whether cache is private (default: true for API)
 * @param {boolean} options.noCache - Disable caching entirely
 */
export const cacheControl = (options = {}) => {
  const { maxAge = 0, isPrivate = true, noCache = false, mustRevalidate = true } = options;

  return (req, res, next) => {
    if (noCache) {
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
    } else if (maxAge > 0) {
      const directives = [
        isPrivate ? 'private' : 'public',
        `max-age=${maxAge}`,
        mustRevalidate ? 'must-revalidate' : '',
      ]
        .filter(Boolean)
        .join(', ');

      res.set('Cache-Control', directives);
    } else {
      res.set('Cache-Control', 'private, no-cache');
    }

    next();
  };
};

/**
 * ETag middleware
 * Generates and validates ETags for response caching
 */
export const etag = () => (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = (data) => {
    // Generate simple ETag based on JSON content
    const content = JSON.stringify(data);
    const hash = Buffer.from(content).toString('base64').slice(0, 27);
    const etagValue = `"${hash}"`;

    // Check If-None-Match header
    const ifNoneMatch = req.get('If-None-Match');
    if (ifNoneMatch === etagValue) {
      return res.status(304).end();
    }

    res.set('ETag', etagValue);
    return originalJson(data);
  };

  next();
};

/**
 * Cache invalidation helpers
 */
export const invalidateCache = {
  /**
   * Invalidate patient-related caches
   */
  patient: (organizationId, patientId) => {
    cache.deletePattern(`patient:${patientId}:*`);
    cache.deletePattern(`response:${organizationId}:*/patients/${patientId}*`);
    cache.deletePattern(`response:${organizationId}:*/patients?*`);
    logger.debug('Invalidated patient cache', { organizationId, patientId });
  },

  /**
   * Invalidate encounter-related caches
   */
  encounter: (organizationId, patientId) => {
    cache.deletePattern(`response:${organizationId}:*/encounters*`);
    if (patientId) {
      cache.deletePattern(`response:${organizationId}:*/patients/${patientId}/encounters*`);
    }
    logger.debug('Invalidated encounter cache', { organizationId, patientId });
  },

  /**
   * Invalidate appointment-related caches
   */
  appointment: (organizationId) => {
    cache.deletePattern(`response:${organizationId}:*/appointments*`);
    logger.debug('Invalidated appointment cache', { organizationId });
  },

  /**
   * Invalidate KPI caches
   */
  kpi: (organizationId) => {
    cache.deletePattern(`kpi:${organizationId}:*`);
    cache.deletePattern(`response:${organizationId}:*/kpi*`);
    logger.debug('Invalidated KPI cache', { organizationId });
  },

  /**
   * Invalidate all organization caches
   */
  organization: (organizationId) => {
    cache.deletePattern(`*:${organizationId}:*`);
    cache.deletePattern(`response:${organizationId}:*`);
    logger.debug('Invalidated organization cache', { organizationId });
  },

  /**
   * Invalidate reference data caches
   */
  referenceData: () => {
    cache.deletePattern('diagnosis:*');
    cache.deletePattern('treatment:*');
    cache.deletePattern('template:*');
    logger.debug('Invalidated reference data cache');
  },
};

/**
 * Pre-configured cache middleware for common routes
 */
export const cachePresets = {
  // Reference data - cache for 1 hour
  referenceData: cacheResponse({ ttl: 3600 }),

  // Patient list - cache for 1 minute
  patientList: cacheResponse({ ttl: 60 }),

  // Patient details - cache for 5 minutes
  patientDetails: cacheResponse({ ttl: 300 }),

  // KPI dashboard - cache for 5 minutes
  kpi: cacheResponse({ ttl: 300 }),

  // No cache for sensitive operations
  noCache: cacheControl({ noCache: true }),
};

export default {
  cacheResponse,
  cacheControl,
  etag,
  invalidateCache,
  cachePresets,
};
