/**
 * Cache Utility Tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import cache, { CacheKeys } from '../../src/utils/cache.js';

describe('Cache Utility', () => {
  beforeEach(() => {
    cache.clear();
  });

  describe('Basic Operations', () => {
    it('should set and get values', () => {
      cache.set('test-key', 'test-value');
      expect(cache.get('test-key')).toBe('test-value');
    });

    it('should return null for non-existent keys', () => {
      expect(cache.get('non-existent')).toBeNull();
    });

    it('should delete values', () => {
      cache.set('test-key', 'test-value');
      cache.delete('test-key');
      expect(cache.get('test-key')).toBeNull();
    });

    it('should clear all cache', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.clear();
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should expire keys after TTL', async () => {
      cache.set('temp-key', 'temp-value', 1); // 1 second TTL
      expect(cache.get('temp-key')).toBe('temp-value');

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));

      expect(cache.get('temp-key')).toBeNull();
    });

    it('should not expire keys with TTL 0 (permanent)', async () => {
      cache.set('perm-key', 'perm-value', 0);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(cache.get('perm-key')).toBe('perm-value');
    });
  });

  describe('Pattern Deletion', () => {
    it('should delete keys matching pattern', () => {
      cache.set('user:1:profile', 'data1');
      cache.set('user:2:profile', 'data2');
      cache.set('user:1:settings', 'data3');
      cache.set('product:1', 'data4');

      const deleted = cache.deletePattern('user:*:profile');

      expect(deleted).toBe(2);
      expect(cache.get('user:1:profile')).toBeNull();
      expect(cache.get('user:2:profile')).toBeNull();
      expect(cache.get('user:1:settings')).toBe('data3');
      expect(cache.get('product:1')).toBe('data4');
    });
  });

  describe('Get Or Set Pattern', () => {
    it('should fetch and cache value if not cached', async () => {
      const fetchFn = jest.fn(async () => 'fetched-value');

      const result = await cache.getOrSet('test-key', fetchFn);

      expect(result).toBe('fetched-value');
      expect(fetchFn).toHaveBeenCalledTimes(1);
      expect(cache.get('test-key')).toBe('fetched-value');
    });

    it('should return cached value without calling fetch function', async () => {
      cache.set('test-key', 'cached-value');
      const fetchFn = jest.fn(async () => 'fetched-value');

      const result = await cache.getOrSet('test-key', fetchFn);

      expect(result).toBe('cached-value');
      expect(fetchFn).not.toHaveBeenCalled();
    });
  });

  describe('Statistics', () => {
    it('should track hits and misses', () => {
      cache.set('key1', 'value1');

      cache.get('key1'); // hit
      cache.get('key2'); // miss
      cache.get('key1'); // hit

      const stats = cache.getStats();

      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe('66.67%');
    });

    it('should track sets and deletes', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.delete('key1');

      const stats = cache.getStats();

      expect(stats.sets).toBe(2);
      expect(stats.deletes).toBe(1);
    });
  });

  describe('Cache Keys Builder', () => {
    it('should build diagnosis code keys', () => {
      expect(CacheKeys.diagnosisCode('L03')).toBe('diagnosis:L03');
      expect(CacheKeys.diagnosisCodesList('ICPC2')).toBe('diagnosis:list:ICPC2');
      expect(CacheKeys.diagnosisCodesList()).toBe('diagnosis:list:all');
    });

    it('should build treatment code keys', () => {
      expect(CacheKeys.treatmentCode('L214')).toBe('treatment:L214');
      expect(CacheKeys.treatmentCodesList()).toBe('treatment:list:all');
    });

    it('should build patient stats keys', () => {
      const patientId = '123e4567-e89b-12d3-a456-426614174000';
      expect(CacheKeys.patientStats(patientId)).toBe(`patient:${patientId}:stats`);
    });

    it('should build KPI stats keys', () => {
      const key = CacheKeys.kpiStats('org123', '2024-01-01', '2024-01-31');
      expect(key).toBe('kpi:org123:2024-01-01:2024-01-31');
    });
  });
});
