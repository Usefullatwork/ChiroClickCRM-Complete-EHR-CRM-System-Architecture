/**
 * Unit Tests for Template Renderer (src/services/clinical/templateRenderer.js)
 * Tests clinical test library, red flags, test clusters, and screening
 */

import { jest } from '@jest/globals';

const mockQuery = jest.fn();

jest.unstable_mockModule('../../../src/config/database.js', () => ({
  query: mockQuery,
  default: { query: mockQuery },
}));

const {
  getTestsLibrary,
  getTestByCode,
  getRedFlags,
  screenRedFlags,
  getTestClusters,
  getTestClusterByCondition,
} = await import('../../../src/services/clinical/templateRenderer.js');

describe('templateRenderer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================================================
  // getTestsLibrary
  // ===========================================================================
  describe('getTestsLibrary', () => {
    it('should return all tests with default language', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 't1', test_name: 'SLR' }] });
      const result = await getTestsLibrary();
      expect(result).toHaveLength(1);
      expect(mockQuery.mock.calls[0][1][0]).toBe('NO');
    });

    it('should filter by testCategory', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await getTestsLibrary({ testCategory: 'orthopedic' });
      expect(mockQuery.mock.calls[0][0]).toContain('test_category');
    });

    it('should filter by bodyRegion', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await getTestsLibrary({ bodyRegion: 'lumbar' });
      expect(mockQuery.mock.calls[0][0]).toContain('body_region');
    });

    it('should filter by system', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await getTestsLibrary({ system: 'neurological' });
      expect(mockQuery.mock.calls[0][0]).toContain('system');
    });

    it('should apply search filter', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await getTestsLibrary({ search: 'SLR' });
      expect(mockQuery.mock.calls[0][0]).toContain('ILIKE');
    });

    it('should use EN language when specified', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await getTestsLibrary({ language: 'EN' });
      expect(mockQuery.mock.calls[0][1][0]).toBe('EN');
    });
  });

  // ===========================================================================
  // getTestByCode
  // ===========================================================================
  describe('getTestByCode', () => {
    it('should return test by code', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 't1', code: 'SLR', test_name: 'Straight Leg Raise' }],
      });
      const result = await getTestByCode('SLR');
      expect(result.code).toBe('SLR');
    });

    it('should throw when test not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(getTestByCode('MISSING')).rejects.toThrow('Test not found');
    });

    it('should use specified language', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 't1' }] });
      await getTestByCode('SLR', 'EN');
      expect(mockQuery.mock.calls[0][1][1]).toBe('EN');
    });
  });

  // ===========================================================================
  // getRedFlags
  // ===========================================================================
  describe('getRedFlags', () => {
    it('should return all red flags', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'rf1', flag_name: 'Cauda equina' }] });
      const result = await getRedFlags();
      expect(result).toHaveLength(1);
    });

    it('should filter by pathologyCategory', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await getRedFlags({ pathologyCategory: 'neurological' });
      expect(mockQuery.mock.calls[0][0]).toContain('pathology_category');
    });

    it('should filter by bodyRegion', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await getRedFlags({ bodyRegion: 'lumbar' });
      expect(mockQuery.mock.calls[0][0]).toContain('body_region');
    });

    it('should filter by significanceLevel', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await getRedFlags({ significanceLevel: 'HIGH' });
      expect(mockQuery.mock.calls[0][0]).toContain('significance_level');
    });

    it('should order by significance level priority', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await getRedFlags();
      expect(mockQuery.mock.calls[0][0]).toContain("WHEN 'HIGH' THEN 1");
    });
  });

  // ===========================================================================
  // screenRedFlags
  // ===========================================================================
  describe('screenRedFlags', () => {
    it('should screen patient for red flags and return LOW risk when none found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await screenRedFlags({ age: 35, gender: 'M' }, ['back pain'], []);
      expect(result.riskLevel).toBe('LOW');
      expect(result.redFlagsIdentified).toEqual([]);
    });

    it('should identify matching red flags from symptoms', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            code: 'RF001',
            flag_name: 'Nattlig smerte',
            pathology_category: 'malignancy',
            description: 'nattlig smerte',
            significance_level: 'HIGH',
            recommended_action: 'Utredning',
          },
        ],
      });

      const result = await screenRedFlags({ age: 55, gender: 'F' }, ['nattlig smerte'], []);
      expect(result.redFlagsIdentified.length).toBeGreaterThan(0);
      expect(result.riskLevel).toBe('HIGH');
    });

    it('should identify matching red flags from findings', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            code: 'RF002',
            flag_name: 'Test',
            pathology_category: 'neuro',
            description: 'weakness',
            significance_level: 'MODERATE',
            recommended_action: 'Monitor',
          },
        ],
      });

      const result = await screenRedFlags({ age: 40, gender: 'M' }, [], ['weakness']);
      expect(result.redFlagsIdentified.length).toBeGreaterThan(0);
      expect(result.riskLevel).toBe('MODERATE');
    });

    it('should include recommended actions', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            code: 'RF001',
            flag_name: 'Test',
            pathology_category: 'test',
            description: 'symptom match',
            significance_level: 'HIGH',
            recommended_action: 'Refer urgently',
          },
        ],
      });

      const result = await screenRedFlags({ age: 60, gender: 'F' }, ['symptom match'], []);
      expect(result.recommendedActions).toContain('Refer urgently');
    });

    it('should set screening date', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const result = await screenRedFlags({ age: 30, gender: 'M' }, [], []);
      expect(result.screeningDate).toBeInstanceOf(Date);
    });

    it('should handle null symptoms array', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            code: 'RF001',
            flag_name: 'Test',
            pathology_category: 'test',
            description: 'test',
            significance_level: 'LOW',
            recommended_action: null,
          },
        ],
      });

      const result = await screenRedFlags({ age: 30, gender: 'M' }, null, null);
      expect(result.riskLevel).toBe('LOW');
    });
  });

  // ===========================================================================
  // getTestClusters
  // ===========================================================================
  describe('getTestClusters', () => {
    it('should return test clusters', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'tc1', cluster_name: 'Lumbar Cluster' }] });
      const result = await getTestClusters();
      expect(result).toHaveLength(1);
    });

    it('should filter by bodyRegion', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await getTestClusters({ bodyRegion: 'cervical' });
      expect(mockQuery.mock.calls[0][0]).toContain('body_region');
    });
  });

  // ===========================================================================
  // getTestClusterByCondition
  // ===========================================================================
  describe('getTestClusterByCondition', () => {
    it('should return cluster by condition', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'tc1', suspected_condition: 'lumbar stenosis' }],
      });
      const result = await getTestClusterByCondition('lumbar stenosis');
      expect(result.suspected_condition).toContain('lumbar stenosis');
    });

    it('should throw when cluster not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(getTestClusterByCondition('unknown')).rejects.toThrow('Cluster not found');
    });
  });
});
