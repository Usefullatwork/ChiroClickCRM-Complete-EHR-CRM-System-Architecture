import { cacheMiddleware, invalidateCacheMiddleware } from '../../../src/middleware/caching.js';
import * as redis from '../../../src/config/redis.js';

jest.mock('../../../src/config/redis.js');

describe('Caching Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      method: 'GET',
      originalUrl: '/api/v1/patients',
      headers: {
        'x-organization-id': 'org-123'
      }
    };

    res = {
      json: jest.fn(),
      statusCode: 200
    };

    next = jest.fn();

    process.env.REDIS_URL = 'redis://localhost:6379';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('cacheMiddleware', () => {
    it('should serve cached response when available', async () => {
      const cachedData = { patients: [{ id: '1', name: 'John' }] };
      redis.getCache.mockResolvedValue(cachedData);

      const middleware = cacheMiddleware(300);
      await middleware(req, res, next);

      expect(redis.getCache).toHaveBeenCalledWith('api:org-123:/api/v1/patients');
      expect(res.json).toHaveBeenCalledWith(cachedData);
      expect(next).not.toHaveBeenCalled();
    });

    it('should proceed to next middleware on cache miss', async () => {
      redis.getCache.mockResolvedValue(null);
      redis.setCache.mockResolvedValue(true);

      const middleware = cacheMiddleware(300);
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should cache successful responses', async () => {
      redis.getCache.mockResolvedValue(null);
      redis.setCache.mockResolvedValue(true);

      const middleware = cacheMiddleware(600);
      await middleware(req, res, next);

      // Simulate response
      const responseData = { patients: [] };
      const originalJson = res.json;

      // Call the overridden json method
      await res.json(responseData);

      expect(redis.setCache).toHaveBeenCalledWith(
        'api:org-123:/api/v1/patients',
        responseData,
        600
      );
    });

    it('should not cache non-GET requests', async () => {
      req.method = 'POST';

      const middleware = cacheMiddleware(300);
      await middleware(req, res, next);

      expect(redis.getCache).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('should not cache when Redis URL not configured', async () => {
      delete process.env.REDIS_URL;

      const middleware = cacheMiddleware(300);
      await middleware(req, res, next);

      expect(redis.getCache).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('should not cache error responses', async () => {
      redis.getCache.mockResolvedValue(null);
      res.statusCode = 500;

      const middleware = cacheMiddleware(300);
      await middleware(req, res, next);

      const errorData = { error: 'Internal Server Error' };
      await res.json(errorData);

      expect(redis.setCache).not.toHaveBeenCalled();
    });

    it('should handle cache errors gracefully', async () => {
      redis.getCache.mockRejectedValue(new Error('Redis connection failed'));

      const middleware = cacheMiddleware(300);
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('invalidateCacheMiddleware', () => {
    it('should invalidate cache on POST requests', async () => {
      req.method = 'POST';
      req.originalUrl = '/api/v1/patients';
      res.statusCode = 201;
      redis.deleteCache.mockResolvedValue(true);

      const middleware = invalidateCacheMiddleware();
      await middleware(req, res, next);

      // Simulate response
      await res.json({ id: 'new-patient' });

      expect(redis.deleteCache).toHaveBeenCalledWith('api:org-123:*/api/v1/patients*');
      expect(next).toHaveBeenCalled();
    });

    it('should invalidate cache on PUT requests', async () => {
      req.method = 'PUT';
      req.originalUrl = '/api/v1/patients/123';
      redis.deleteCache.mockResolvedValue(true);

      const middleware = invalidateCacheMiddleware();
      await middleware(req, res, next);

      await res.json({ id: '123', updated: true });

      expect(redis.deleteCache).toHaveBeenCalledWith('api:org-123:*/api/v1/patients*');
    });

    it('should invalidate cache on PATCH requests', async () => {
      req.method = 'PATCH';
      req.originalUrl = '/api/v1/encounters/456';
      redis.deleteCache.mockResolvedValue(true);

      const middleware = invalidateCacheMiddleware();
      await middleware(req, res, next);

      await res.json({ id: '456', patched: true });

      expect(redis.deleteCache).toHaveBeenCalledWith('api:org-123:*/api/v1/encounters*');
    });

    it('should invalidate cache on DELETE requests', async () => {
      req.method = 'DELETE';
      req.originalUrl = '/api/v1/patients/789';
      redis.deleteCache.mockResolvedValue(true);

      const middleware = invalidateCacheMiddleware();
      await middleware(req, res, next);

      await res.json({ success: true });

      expect(redis.deleteCache).toHaveBeenCalledWith('api:org-123:*/api/v1/patients*');
    });

    it('should not invalidate on GET requests', async () => {
      req.method = 'GET';

      const middleware = invalidateCacheMiddleware();
      await middleware(req, res, next);

      expect(redis.deleteCache).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('should not invalidate on error responses', async () => {
      req.method = 'POST';
      res.statusCode = 400;

      const middleware = invalidateCacheMiddleware();
      await middleware(req, res, next);

      await res.json({ error: 'Bad Request' });

      expect(redis.deleteCache).not.toHaveBeenCalled();
    });

    it('should handle cache invalidation errors gracefully', async () => {
      req.method = 'POST';
      redis.deleteCache.mockRejectedValue(new Error('Redis error'));

      const middleware = invalidateCacheMiddleware();
      await middleware(req, res, next);

      // Should not throw error
      await expect(res.json({ success: true })).resolves.not.toThrow();
    });
  });
});
