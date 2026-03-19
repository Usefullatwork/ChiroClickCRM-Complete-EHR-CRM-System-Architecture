/**
 * Feature Gate Middleware Tests
 * Verifies module gating, caching, fallback, and cache clearing.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

const mockQuery = jest.fn();
const mockCacheGet = jest.fn();
const mockCacheSet = jest.fn();
const mockCacheDelete = jest.fn();

// Mock database
jest.unstable_mockModule('../../src/config/database.js', () => ({
  query: mockQuery,
}));

// Mock cache
jest.unstable_mockModule('../../src/utils/cache.js', () => ({
  default: {
    get: mockCacheGet,
    set: mockCacheSet,
    delete: mockCacheDelete,
  },
}));

// Mock logger
jest.unstable_mockModule('../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

const { requireModule, clearModuleCache } = await import('../../src/middleware/featureGate.js');

describe('featureGate', () => {
  let req, res, next;

  beforeEach(() => {
    mockQuery.mockReset();
    mockCacheGet.mockReset();
    mockCacheSet.mockReset();
    mockCacheDelete.mockReset();
    req = { user: { organization_id: 'org1' } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  describe('requireModule()', () => {
    it('should always call next() for core_ehr', async () => {
      req.user = {}; // no org ID needed
      await requireModule('core_ehr')(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 403 when organizationId is missing', async () => {
      req.user = {};
      await requireModule('exercise_rx')(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'MODULE_NOT_ENABLED' })
      );
    });

    it('should return 403 when module is not enabled in org settings', async () => {
      mockCacheGet.mockReturnValue(null);
      mockQuery.mockResolvedValue({
        rows: [{ settings: { enabled_modules: { core_ehr: true, exercise_rx: false } } }],
      });
      await requireModule('exercise_rx')(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should call next() when module is enabled', async () => {
      mockCacheGet.mockReturnValue(null);
      mockQuery.mockResolvedValue({
        rows: [{ settings: { enabled_modules: { core_ehr: true, exercise_rx: true } } }],
      });
      await requireModule('exercise_rx')(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should use cache on second call (no DB query)', async () => {
      mockCacheGet.mockReturnValue({ core_ehr: true, clinical_ai: true });
      await requireModule('clinical_ai')(req, res, next);
      expect(mockQuery).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('should fall back to {core_ehr: true} on DB error', async () => {
      mockCacheGet.mockReturnValue(null);
      mockQuery.mockRejectedValue(new Error('DB error'));
      // clinical_ai not in fallback, so 403
      await requireModule('clinical_ai')(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should read req.user.organization_id (snake_case)', async () => {
      req.user = { organization_id: 'org-snake' };
      mockCacheGet.mockReturnValue({ exercise_rx: true });
      await requireModule('exercise_rx')(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should read req.user.organizationId (camelCase fallback)', async () => {
      req.user = { organizationId: 'org-camel' };
      mockCacheGet.mockReturnValue({ exercise_rx: true });
      await requireModule('exercise_rx')(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should set cache with TTL after DB fetch', async () => {
      mockCacheGet.mockReturnValue(null);
      mockQuery.mockResolvedValue({
        rows: [{ settings: { enabled_modules: { core_ehr: true, clinical_ai: true } } }],
      });
      await requireModule('clinical_ai')(req, res, next);
      expect(mockCacheSet).toHaveBeenCalledWith(
        'org_modules_org1',
        { core_ehr: true, clinical_ai: true },
        300
      );
    });
  });

  describe('clearModuleCache()', () => {
    it('should delete the correct cache key', () => {
      clearModuleCache('org123');
      expect(mockCacheDelete).toHaveBeenCalledWith('org_modules_org123');
    });
  });
});
