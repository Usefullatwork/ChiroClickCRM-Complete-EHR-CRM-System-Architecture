/**
 * Unit Tests for Exercise CRUD Service (src/services/clinical/exerciseCrud.js)
 * Tests exercise library CRUD, categories, favorites, recently used
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

const {
  getAllExercises,
  getExerciseById,
  getExerciseByCode,
  createExercise,
  updateExercise,
  deleteExercise,
  getCategories,
  getBodyRegions,
  getUserFavorites,
  getRecentlyUsed,
} = await import('../../../src/services/clinical/exerciseCrud.js');

describe('exerciseCrud', () => {
  const ORG_ID = 'org-1';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================================================
  // getAllExercises
  // ===========================================================================
  describe('getAllExercises', () => {
    it('should return paginated exercises with defaults', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '3' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'e1' }, { id: 'e2' }, { id: 'e3' }] });

      const result = await getAllExercises(ORG_ID);
      expect(result.data).toHaveLength(3);
      expect(result.pagination.total).toBe(3);
      expect(result.pagination.page).toBe(1);
    });

    it('should apply category filter', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'e1' }] });

      await getAllExercises(ORG_ID, { category: 'stretching' });
      expect(mockQuery.mock.calls[0][0]).toContain('e.category');
    });

    it('should apply search filter with ILIKE', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({ rows: [] });

      await getAllExercises(ORG_ID, { search: 'chin tuck' });
      expect(mockQuery.mock.calls[0][0]).toContain('ILIKE');
    });

    it('should include global exercises by default', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({ rows: [] });

      await getAllExercises(ORG_ID);
      expect(mockQuery.mock.calls[0][0]).toContain('is_global = true');
    });

    it('should exclude global exercises when includeGlobal=false', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({ rows: [] });

      await getAllExercises(ORG_ID, { includeGlobal: false });
      expect(mockQuery.mock.calls[0][0]).not.toContain('is_global = true');
    });

    it('should throw on database error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB error'));
      await expect(getAllExercises(ORG_ID)).rejects.toThrow('DB error');
    });
  });

  // ===========================================================================
  // getExerciseById
  // ===========================================================================
  describe('getExerciseById', () => {
    it('should return exercise when found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'e1', name_no: 'Chin tuck' }] });
      const result = await getExerciseById('e1', ORG_ID);
      expect(result.id).toBe('e1');
    });

    it('should return null when not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const result = await getExerciseById('missing', ORG_ID);
      expect(result).toBeNull();
    });
  });

  // ===========================================================================
  // getExerciseByCode
  // ===========================================================================
  describe('getExerciseByCode', () => {
    it('should return exercise by code', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'e1', code: 'CT-001' }] });
      const result = await getExerciseByCode('CT-001', ORG_ID);
      expect(result.code).toBe('CT-001');
    });

    it('should return null when code not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const result = await getExerciseByCode('MISSING', ORG_ID);
      expect(result).toBeNull();
    });
  });

  // ===========================================================================
  // createExercise
  // ===========================================================================
  describe('createExercise', () => {
    it('should create exercise and return new row', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'new-1', code: 'EX-001' }] });
      const result = await createExercise(
        ORG_ID,
        { code: 'EX-001', name_no: 'Test', category: 'stretching', body_region: 'cervical' },
        'user-1'
      );
      expect(result.id).toBe('new-1');
    });

    it('should throw on database error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Duplicate code'));
      await expect(createExercise(ORG_ID, { code: 'EX-001' }, 'user-1')).rejects.toThrow(
        'Duplicate code'
      );
    });
  });

  // ===========================================================================
  // updateExercise
  // ===========================================================================
  describe('updateExercise', () => {
    it('should update allowed fields and return result', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'e1', name_no: 'Updated' }] });
      const result = await updateExercise('e1', ORG_ID, { name_no: 'Updated' });
      expect(result.name_no).toBe('Updated');
    });

    it('should return null when exercise not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const result = await updateExercise('missing', ORG_ID, { name_no: 'x' });
      expect(result).toBeNull();
    });

    it('should throw when no valid fields to update', async () => {
      await expect(updateExercise('e1', ORG_ID, { invalid_field: 'x' })).rejects.toThrow(
        'No valid fields to update'
      );
    });
  });

  // ===========================================================================
  // deleteExercise (soft delete)
  // ===========================================================================
  describe('deleteExercise', () => {
    it('should soft delete and return success', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'e1' }] });
      const result = await deleteExercise('e1', ORG_ID);
      expect(result.success).toBe(true);
    });

    it('should return null when exercise not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const result = await deleteExercise('missing', ORG_ID);
      expect(result).toBeNull();
    });
  });

  // ===========================================================================
  // getCategories / getBodyRegions
  // ===========================================================================
  describe('getCategories', () => {
    it('should return static category list', async () => {
      const categories = await getCategories();
      expect(categories.length).toBeGreaterThan(0);
      expect(categories[0]).toHaveProperty('id');
      expect(categories[0]).toHaveProperty('name_no');
      expect(categories[0]).toHaveProperty('name_en');
    });
  });

  describe('getBodyRegions', () => {
    it('should return static body region list', async () => {
      const regions = await getBodyRegions();
      expect(regions.length).toBeGreaterThan(0);
      expect(regions.find((r) => r.id === 'cervical')).toBeDefined();
    });
  });

  // ===========================================================================
  // getUserFavorites / getRecentlyUsed
  // ===========================================================================
  describe('getUserFavorites', () => {
    it('should return user favorite exercises', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'e1', usage_count: 5 }] });
      const result = await getUserFavorites('user-1', ORG_ID);
      expect(result).toHaveLength(1);
    });
  });

  describe('getRecentlyUsed', () => {
    it('should return recently used exercises', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'e1' }] });
      const result = await getRecentlyUsed('user-1', ORG_ID);
      expect(result).toHaveLength(1);
    });
  });
});
