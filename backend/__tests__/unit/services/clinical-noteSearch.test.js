/**
 * Unit Tests for Note Search (src/services/clinical/noteSearch.js)
 * Tests full-text search across clinical notes
 */

import { jest } from '@jest/globals';

const mockQuery = jest.fn();

jest.unstable_mockModule('../../../src/config/database.js', () => ({
  query: mockQuery,
  default: { query: mockQuery },
}));

jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

const { searchNotes } = await import('../../../src/services/clinical/noteSearch.js');

describe('noteSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchNotes', () => {
    it('should search using text search vector', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'n1', rank: 0.9 }] });
      const result = await searchNotes('org-1', 'back pain');
      expect(result).toHaveLength(1);
      expect(mockQuery.mock.calls[0][0]).toContain('search_vector');
      expect(mockQuery.mock.calls[0][0]).toContain('ts_rank');
    });

    it('should filter by patientId when provided', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await searchNotes('org-1', 'neck', { patientId: 'p-1' });
      expect(mockQuery.mock.calls[0][0]).toContain('cn.patient_id');
    });

    it('should respect limit option', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await searchNotes('org-1', 'pain', { limit: 5 });
      expect(mockQuery.mock.calls[0][1]).toContain(5);
    });

    it('should order by rank DESC', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await searchNotes('org-1', 'test');
      expect(mockQuery.mock.calls[0][0]).toContain('ORDER BY rank DESC');
    });

    it('should use default limit of 20', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await searchNotes('org-1', 'query');
      expect(mockQuery.mock.calls[0][1]).toContain(20);
    });

    it('should pass organizationId as first param', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await searchNotes('org-1', 'query');
      expect(mockQuery.mock.calls[0][1][0]).toBe('org-1');
    });

    it('should pass search query as second param', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await searchNotes('org-1', 'korsrygg smerte');
      expect(mockQuery.mock.calls[0][1][1]).toBe('korsrygg smerte');
    });

    it('should throw on database error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB error'));
      await expect(searchNotes('org-1', 'test')).rejects.toThrow('DB error');
    });

    it('should return empty array when no results', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const result = await searchNotes('org-1', 'nonexistent');
      expect(result).toEqual([]);
    });

    it('should return multiple results sorted by rank', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { id: 'n1', rank: 0.9 },
          { id: 'n2', rank: 0.5 },
        ],
      });
      const result = await searchNotes('org-1', 'rygg');
      expect(result).toHaveLength(2);
    });
  });
});
