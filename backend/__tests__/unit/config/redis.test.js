import { getCache, setCache, deleteCache, cacheQuery, redisHealthCheck } from '../../../src/config/redis.js';
import { createClient } from 'redis';

// Mock Redis client
jest.mock('redis', () => ({
  createClient: jest.fn()
}));

describe('Redis Configuration', () => {
  let mockRedisClient;

  beforeEach(() => {
    mockRedisClient = {
      connect: jest.fn().mockResolvedValue(undefined),
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      keys: jest.fn(),
      ping: jest.fn(),
      quit: jest.fn(),
      on: jest.fn()
    };

    createClient.mockReturnValue(mockRedisClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCache', () => {
    it('should return cached data when available', async () => {
      const testData = { id: '123', name: 'Test Patient' };
      mockRedisClient.get.mockResolvedValue(JSON.stringify(testData));

      const result = await getCache('test-key');

      expect(result).toEqual(testData);
      expect(mockRedisClient.get).toHaveBeenCalledWith('test-key');
    });

    it('should return null when cache miss', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const result = await getCache('non-existent-key');

      expect(result).toBeNull();
    });

    it('should return null when Redis unavailable', async () => {
      mockRedisClient.get.mockRejectedValue(new Error('Redis connection failed'));

      const result = await getCache('test-key');

      expect(result).toBeNull();
    });
  });

  describe('setCache', () => {
    it('should cache data with default TTL', async () => {
      const testData = { id: '123', name: 'Test Patient' };
      mockRedisClient.set.mockResolvedValue('OK');

      const result = await setCache('test-key', testData);

      expect(result).toBe(true);
      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'test-key',
        JSON.stringify(testData),
        { EX: 300 }
      );
    });

    it('should cache data with custom TTL', async () => {
      const testData = { id: '123' };
      mockRedisClient.set.mockResolvedValue('OK');

      await setCache('test-key', testData, 600);

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'test-key',
        JSON.stringify(testData),
        { EX: 600 }
      );
    });

    it('should return false when Redis unavailable', async () => {
      mockRedisClient.set.mockRejectedValue(new Error('Redis error'));

      const result = await setCache('test-key', { data: 'test' });

      expect(result).toBe(false);
    });
  });

  describe('deleteCache', () => {
    it('should delete single key', async () => {
      mockRedisClient.del.mockResolvedValue(1);

      const result = await deleteCache('test-key');

      expect(result).toBe(true);
      expect(mockRedisClient.del).toHaveBeenCalledWith('test-key');
    });

    it('should delete keys matching pattern', async () => {
      mockRedisClient.keys.mockResolvedValue(['key1', 'key2', 'key3']);
      mockRedisClient.del.mockResolvedValue(3);

      const result = await deleteCache('org:123:*');

      expect(mockRedisClient.keys).toHaveBeenCalledWith('org:123:*');
      expect(mockRedisClient.del).toHaveBeenCalledWith(['key1', 'key2', 'key3']);
      expect(result).toBe(true);
    });

    it('should handle empty pattern results', async () => {
      mockRedisClient.keys.mockResolvedValue([]);

      const result = await deleteCache('org:999:*');

      expect(mockRedisClient.keys).toHaveBeenCalledWith('org:999:*');
      expect(mockRedisClient.del).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  describe('cacheQuery', () => {
    it('should return cached data if available', async () => {
      const cachedData = { patients: [{ id: '1', name: 'John' }] };
      mockRedisClient.get.mockResolvedValue(JSON.stringify(cachedData));

      const queryFn = jest.fn();
      const result = await cacheQuery('patients-list', queryFn, 300);

      expect(result).toEqual(cachedData);
      expect(queryFn).not.toHaveBeenCalled();
    });

    it('should execute query and cache result on cache miss', async () => {
      mockRedisClient.get.mockResolvedValue(null);
      mockRedisClient.set.mockResolvedValue('OK');

      const queryData = { patients: [{ id: '2', name: 'Jane' }] };
      const queryFn = jest.fn().mockResolvedValue(queryData);

      const result = await cacheQuery('patients-list', queryFn, 300);

      expect(result).toEqual(queryData);
      expect(queryFn).toHaveBeenCalled();
      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'patients-list',
        JSON.stringify(queryData),
        { EX: 300 }
      );
    });

    it('should handle query function errors', async () => {
      mockRedisClient.get.mockResolvedValue(null);
      const queryFn = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(cacheQuery('test-key', queryFn)).rejects.toThrow('Database error');
    });
  });

  describe('redisHealthCheck', () => {
    it('should return true when Redis is healthy', async () => {
      mockRedisClient.ping.mockResolvedValue('PONG');

      const result = await redisHealthCheck();

      expect(result).toBe(true);
      expect(mockRedisClient.ping).toHaveBeenCalled();
    });

    it('should return false when Redis ping fails', async () => {
      mockRedisClient.ping.mockRejectedValue(new Error('Connection failed'));

      const result = await redisHealthCheck();

      expect(result).toBe(false);
    });

    it('should return false when Redis client not initialized', async () => {
      createClient.mockReturnValue(null);

      const result = await redisHealthCheck();

      expect(result).toBe(false);
    });
  });
});
