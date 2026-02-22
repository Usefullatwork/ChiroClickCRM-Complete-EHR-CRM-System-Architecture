/**
 * Unit Tests for Exercises Service
 * Tests exercise library CRUD, prescriptions, patient exercises
 */

import { jest } from '@jest/globals';

// Mock database
const mockQuery = jest.fn();

jest.unstable_mockModule('../../../src/config/database.js', () => ({
  query: mockQuery,
  transaction: jest.fn(),
  getClient: jest.fn(),
  healthCheck: jest.fn().mockResolvedValue(true),
  closePool: jest.fn(),
  setTenantContext: jest.fn(),
  clearTenantContext: jest.fn(),
  queryWithTenant: jest.fn(),
  default: {
    query: mockQuery,
    transaction: jest.fn(),
    getClient: jest.fn(),
    healthCheck: jest.fn().mockResolvedValue(true),
    closePool: jest.fn(),
    setTenantContext: jest.fn(),
    clearTenantContext: jest.fn(),
    queryWithTenant: jest.fn(),
  },
}));

jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Import after mocking
const exercisesService = await import('../../../src/services/exercises.js');

describe('Exercises Service', () => {
  const testOrgId = 'org-test-001';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =============================================================================
  // GET ALL EXERCISES
  // =============================================================================

  describe('getAllExercises', () => {
    it('should return paginated exercises with defaults', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '3' }] }).mockResolvedValueOnce({
        rows: [
          {
            id: 'ex-1',
            name_no: 'Hakeinndragning',
            category: 'strengthening',
            body_region: 'cervical',
          },
          {
            id: 'ex-2',
            name_no: 'Sideliggende planke',
            category: 'strengthening',
            body_region: 'core',
          },
          { id: 'ex-3', name_no: 'Cat-Cow', category: 'mobility', body_region: 'lumbar' },
        ],
      });

      const result = await exercisesService.getAllExercises(testOrgId);

      expect(result.data).toHaveLength(3);
      expect(result.pagination.total).toBe(3);
    });

    it('should filter by category', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'ex-1', category: 'stretching' }] });

      const result = await exercisesService.getAllExercises(testOrgId, { category: 'stretching' });

      expect(result.data).toHaveLength(1);
      const countParams = mockQuery.mock.calls[0][1];
      expect(countParams).toContain('stretching');
    });

    it('should filter by body region', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '2' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'ex-1' }, { id: 'ex-2' }] });

      await exercisesService.getAllExercises(testOrgId, { bodyRegion: 'cervical' });

      const countParams = mockQuery.mock.calls[0][1];
      expect(countParams).toContain('cervical');
    });

    it('should search by name or code', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'ex-1', name_no: 'Hakeinndragning' }] });

      await exercisesService.getAllExercises(testOrgId, { search: 'Hake' });

      const countParams = mockQuery.mock.calls[0][1];
      expect(countParams).toContain('%Hake%');
    });

    it('should filter by difficulty', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'ex-1', difficulty: 'beginner' }] });

      await exercisesService.getAllExercises(testOrgId, { difficulty: 'beginner' });

      const countParams = mockQuery.mock.calls[0][1];
      expect(countParams).toContain('beginner');
    });

    it('should handle empty result', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await exercisesService.getAllExercises(testOrgId);

      expect(result.data).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });

    it('should throw on database error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB error'));

      await expect(exercisesService.getAllExercises(testOrgId)).rejects.toThrow('DB error');
    });
  });

  // =============================================================================
  // GET EXERCISE BY ID
  // =============================================================================

  describe('getExerciseById', () => {
    it('should return exercise with created_by name', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'ex-123',
            name_no: 'Hakeinndragning',
            category: 'strengthening',
            body_region: 'cervical',
            created_by_name: 'Dr. Hansen',
          },
        ],
      });

      const result = await exercisesService.getExerciseById('ex-123', testOrgId);

      expect(result).toBeDefined();
      expect(result.name_no).toBe('Hakeinndragning');
      expect(result.created_by_name).toBe('Dr. Hansen');
    });

    it('should return null for non-existent exercise', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await exercisesService.getExerciseById('non-existent', testOrgId);

      expect(result).toBeNull();
    });

    it('should throw on database error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Fetch error'));

      await expect(exercisesService.getExerciseById('ex-123', testOrgId)).rejects.toThrow(
        'Fetch error'
      );
    });
  });

  // =============================================================================
  // GET EXERCISE BY CODE
  // =============================================================================

  describe('getExerciseByCode', () => {
    it('should return exercise by code', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'ex-1', code: 'CHIN-TUCK-01', name_no: 'Hakeinndragning' }],
      });

      const result = await exercisesService.getExerciseByCode('CHIN-TUCK-01', testOrgId);

      expect(result).toBeDefined();
      expect(result.code).toBe('CHIN-TUCK-01');
    });

    it('should return null for unknown code', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await exercisesService.getExerciseByCode('NONEXISTENT', testOrgId);

      expect(result).toBeNull();
    });
  });

  // =============================================================================
  // PRESCRIBE EXERCISE
  // =============================================================================

  describe('prescribeExercise', () => {
    it('should create a prescription and update favorites', async () => {
      // INSERT prescription
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'presc-1',
            patient_id: 'pat-1',
            exercise_id: 'ex-1',
            exercise_name: 'Hakeinndragning',
            sets: 3,
            reps: 10,
            frequency: 'daily',
            duration_weeks: 6,
          },
        ],
      });
      // UPDATE favorites (upsert)
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await exercisesService.prescribeExercise(testOrgId, {
        patient_id: 'pat-1',
        encounter_id: 'enc-1',
        prescribed_by: 'prac-1',
        exercise_id: 'ex-1',
        exercise_code: 'CHIN-TUCK-01',
        exercise_name: 'Hakeinndragning',
        exercise_instructions: 'Trekk haken inn',
        sets: 3,
        reps: 10,
        frequency: 'daily',
        duration_weeks: 6,
      });

      expect(result).toBeDefined();
      expect(result.id).toBe('presc-1');
      expect(result.sets).toBe(3);
      expect(result.reps).toBe(10);
      expect(mockQuery).toHaveBeenCalledTimes(2); // INSERT + favorites upsert
    });

    it('should skip favorites update when no exercise_id', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'presc-2',
            patient_id: 'pat-1',
            exercise_name: 'Custom exercise',
          },
        ],
      });

      await exercisesService.prescribeExercise(testOrgId, {
        patient_id: 'pat-1',
        encounter_id: 'enc-1',
        prescribed_by: 'prac-1',
        exercise_name: 'Custom exercise',
        exercise_instructions: 'Do the thing',
        sets: 2,
        reps: 15,
      });

      // Should only call INSERT (no favorites upsert)
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('should throw on database error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Insert failed'));

      await expect(
        exercisesService.prescribeExercise(testOrgId, {
          patient_id: 'pat-1',
          prescribed_by: 'prac-1',
          exercise_name: 'Test',
          sets: 3,
          reps: 10,
        })
      ).rejects.toThrow('Insert failed');
    });
  });

  // =============================================================================
  // GET PATIENT EXERCISES
  // =============================================================================

  describe('getPatientExercises', () => {
    it('should return active exercises for patient', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '2' }] }).mockResolvedValueOnce({
        rows: [
          { id: 'presc-1', exercise_name: 'Chin Tuck', status: 'active' },
          { id: 'presc-2', exercise_name: 'Side Plank', status: 'active' },
        ],
      });

      const result = await exercisesService.getPatientExercises('pat-1', testOrgId);

      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });

    it('should return empty array for patient with no exercises', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await exercisesService.getPatientExercises('pat-new', testOrgId);

      expect(result.data).toHaveLength(0);
    });

    it('should throw on database error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB error'));

      await expect(exercisesService.getPatientExercises('pat-1', testOrgId)).rejects.toThrow(
        'DB error'
      );
    });
  });

  // =============================================================================
  // CREATE EXERCISE
  // =============================================================================

  describe('createExercise', () => {
    it('should create a new exercise', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'ex-new',
            name_no: 'Ny Ovelse',
            name_en: 'New Exercise',
            category: 'strengthening',
            body_region: 'lumbar',
            difficulty: 'beginner',
          },
        ],
      });

      const result = await exercisesService.createExercise(
        testOrgId,
        {
          code: 'NEW-EX-01',
          name_no: 'Ny Ovelse',
          name_en: 'New Exercise',
          category: 'strengthening',
          body_region: 'lumbar',
          instructions_no: 'Gjor slik...',
          instructions_en: 'Do this...',
        },
        'prac-1'
      );

      expect(result).toBeDefined();
      expect(result.id).toBe('ex-new');
      expect(result.name_no).toBe('Ny Ovelse');
    });
  });
});
