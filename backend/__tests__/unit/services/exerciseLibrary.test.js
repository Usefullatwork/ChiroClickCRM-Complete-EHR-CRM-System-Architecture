/**
 * Unit Tests for Exercise Library Service
 * Tests CRUD operations, search/filter, categories, prescriptions,
 * patient portal, and progress tracking.
 */

import { jest } from '@jest/globals';

// Mock database
const mockQuery = jest.fn();
const mockClientQuery = jest.fn();
const mockTransactionStart = jest.fn();
const mockTransactionCommit = jest.fn();
const mockTransactionRollback = jest.fn();

jest.unstable_mockModule('../../../src/config/database.js', () => ({
  query: mockQuery,
  transaction: {
    start: mockTransactionStart,
    commit: mockTransactionCommit,
    rollback: mockTransactionRollback,
  },
  getClient: jest.fn(),
  default: {
    query: mockQuery,
    transaction: {
      start: mockTransactionStart,
      commit: mockTransactionCommit,
      rollback: mockTransactionRollback,
    },
    getClient: jest.fn(),
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
const {
  getExercises,
  getExerciseById,
  createExercise,
  updateExercise,
  deleteExercise,
  getCategories,
  createPrescription,
  getPatientPrescriptions,
  getPrescriptionById,
  updatePrescriptionStatus,
  updatePrescriptionEmailStatus,
  getPrescriptionByPortalToken,
  recordProgress,
  getProgressHistory,
} = await import('../../../src/services/clinical/exerciseLibrary.js');

const ORG_ID = 'org-test-001';
const USER_ID = 'user-test-001';
const EXERCISE_ID = 'ex-001';
const PATIENT_ID = 'pat-001';
const PRESCRIPTION_ID = 'rx-001';

describe('Exercise Library Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Re-wire transaction mock client after resetMocks clears implementations
    mockTransactionStart.mockResolvedValue({ query: mockClientQuery });
    mockTransactionCommit.mockResolvedValue(undefined);
    mockTransactionRollback.mockResolvedValue(undefined);
  });

  // ==========================================================================
  // EXERCISE LIBRARY CRUD
  // ==========================================================================

  describe('getExercises', () => {
    it('should return exercises for an organization with default filters', async () => {
      const exercises = [{ id: EXERCISE_ID, name: 'Hamstring Stretch', category: 'stretching' }];
      mockQuery.mockResolvedValue({ rows: exercises });

      const result = await getExercises(ORG_ID);

      expect(result).toEqual(exercises);
      expect(mockQuery).toHaveBeenCalledTimes(1);
      const [sql, params] = mockQuery.mock.calls[0];
      expect(params[0]).toBe(ORG_ID);
      // Default isActive = true
      expect(params[1]).toBe(true);
      // Default limit and offset
      expect(params).toContain(100);
      expect(params).toContain(0);
    });

    it('should apply category filter', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      await getExercises(ORG_ID, { category: 'stretching' });

      const [sql, params] = mockQuery.mock.calls[0];
      expect(params).toContain('stretching');
      expect(sql).toContain('category');
    });

    it('should apply bodyRegion filter', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      await getExercises(ORG_ID, { bodyRegion: 'lumbar_spine' });

      const [sql, params] = mockQuery.mock.calls[0];
      expect(params).toContain('lumbar_spine');
      expect(sql).toContain('body_region');
    });

    it('should apply search filter with text search and ILIKE', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      await getExercises(ORG_ID, { search: 'hamstring' });

      const [sql, params] = mockQuery.mock.calls[0];
      expect(params).toContain('hamstring');
      expect(params).toContain('%hamstring%');
      expect(sql).toContain('ILIKE');
    });

    it('should apply difficultyLevel filter', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      await getExercises(ORG_ID, { difficultyLevel: 'advanced' });

      const [sql, params] = mockQuery.mock.calls[0];
      expect(params).toContain('advanced');
      expect(sql).toContain('difficulty_level');
    });

    it('should apply custom limit and offset', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      await getExercises(ORG_ID, { limit: 25, offset: 50 });

      const [, params] = mockQuery.mock.calls[0];
      expect(params).toContain(25);
      expect(params).toContain(50);
    });

    it('should throw and log on database error', async () => {
      const dbError = new Error('Connection lost');
      mockQuery.mockRejectedValue(dbError);

      await expect(getExercises(ORG_ID)).rejects.toThrow('Connection lost');
    });
  });

  describe('getExerciseById', () => {
    it('should return a single exercise by ID', async () => {
      const exercise = { id: EXERCISE_ID, name: 'Cat-Cow' };
      mockQuery.mockResolvedValue({ rows: [exercise] });

      const result = await getExerciseById(ORG_ID, EXERCISE_ID);

      expect(result).toEqual(exercise);
      const [, params] = mockQuery.mock.calls[0];
      expect(params).toEqual([ORG_ID, EXERCISE_ID]);
    });

    it('should return null when exercise not found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await getExerciseById(ORG_ID, 'nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('createExercise', () => {
    it('should insert a new exercise and return it', async () => {
      const newExercise = { id: 'ex-new', name: 'Bird Dog' };
      mockQuery.mockResolvedValue({ rows: [newExercise] });

      const exerciseData = {
        name: 'Bird Dog',
        nameNorwegian: 'Fugelhund',
        description: 'Stability exercise',
        category: 'strengthening',
        bodyRegion: 'lumbar_spine',
      };

      const result = await createExercise(ORG_ID, USER_ID, exerciseData);

      expect(result).toEqual(newExercise);
      expect(mockQuery).toHaveBeenCalledTimes(1);
      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain('INSERT INTO exercise_library');
      expect(params[0]).toBe(ORG_ID);
      // userId is the last param (created_by)
      expect(params[params.length - 1]).toBe(USER_ID);
    });

    it('should apply defaults for optional numeric fields', async () => {
      mockQuery.mockResolvedValue({ rows: [{ id: 'ex-new' }] });

      const exerciseData = { name: 'Plank' };

      await createExercise(ORG_ID, USER_ID, exerciseData);

      const [, params] = mockQuery.mock.calls[0];
      // difficultyLevel default = 'beginner' (index 8)
      expect(params[8]).toBe('beginner');
      // setsDefault = 3 (index 11)
      expect(params[11]).toBe(3);
      // repsDefault = 10 (index 12)
      expect(params[12]).toBe(10);
      // frequencyPerDay = 1 (index 14)
      expect(params[14]).toBe(1);
      // frequencyPerWeek = 7 (index 15)
      expect(params[15]).toBe(7);
      // durationWeeks = 4 (index 16)
      expect(params[16]).toBe(4);
    });

    it('should throw on database error', async () => {
      mockQuery.mockRejectedValue(new Error('Duplicate key'));

      await expect(createExercise(ORG_ID, USER_ID, { name: 'Dup' })).rejects.toThrow(
        'Duplicate key'
      );
    });
  });

  describe('updateExercise', () => {
    it('should update allowed fields and return updated exercise', async () => {
      const updated = { id: EXERCISE_ID, name: 'Updated Stretch' };
      mockQuery.mockResolvedValue({ rows: [updated] });

      const result = await updateExercise(ORG_ID, EXERCISE_ID, {
        name: 'Updated Stretch',
        category: 'mobility',
      });

      expect(result).toEqual(updated);
      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain('UPDATE exercise_library');
      expect(params).toContain('Updated Stretch');
      expect(params).toContain('mobility');
    });

    it('should return null when exercise not found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await updateExercise(ORG_ID, 'nonexistent', {
        name: 'Nope',
      });

      expect(result).toBeNull();
    });

    it('should throw when no valid fields provided', async () => {
      await expect(updateExercise(ORG_ID, EXERCISE_ID, { invalidField: 'nope' })).rejects.toThrow(
        'No valid fields to update'
      );
    });

    it('should convert camelCase keys to snake_case for allowed fields', async () => {
      mockQuery.mockResolvedValue({ rows: [{ id: EXERCISE_ID }] });

      await updateExercise(ORG_ID, EXERCISE_ID, {
        bodyRegion: 'cervical',
        difficultyLevel: 'intermediate',
        displayOrder: 5,
      });

      const [sql] = mockQuery.mock.calls[0];
      expect(sql).toContain('body_region');
      expect(sql).toContain('difficulty_level');
      expect(sql).toContain('display_order');
    });
  });

  describe('deleteExercise', () => {
    it('should soft-delete an exercise and return true', async () => {
      mockQuery.mockResolvedValue({ rows: [{ id: EXERCISE_ID }] });

      const result = await deleteExercise(ORG_ID, EXERCISE_ID);

      expect(result).toBe(true);
      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain('is_active = false');
      expect(params).toEqual([ORG_ID, EXERCISE_ID]);
    });

    it('should return false when exercise not found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await deleteExercise(ORG_ID, 'nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('getCategories', () => {
    it('should return distinct categories with subcategories and counts', async () => {
      const categories = [
        { category: 'stretching', subcategories: ['hamstring', 'quad'], exercise_count: 5 },
        { category: 'strengthening', subcategories: null, exercise_count: 3 },
      ];
      mockQuery.mockResolvedValue({ rows: categories });

      const result = await getCategories(ORG_ID);

      expect(result).toEqual(categories);
      expect(result).toHaveLength(2);
      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain('DISTINCT category');
      expect(params).toEqual([ORG_ID]);
    });
  });

  // ==========================================================================
  // PRESCRIPTIONS
  // ==========================================================================

  describe('createPrescription', () => {
    it('should create prescription with exercises in a transaction', async () => {
      const prescription = { id: PRESCRIPTION_ID, patient_id: PATIENT_ID };
      mockClientQuery
        .mockResolvedValueOnce({ rows: [prescription] }) // INSERT prescription
        .mockResolvedValueOnce({ rows: [] }) // INSERT prescribed_exercise
        .mockResolvedValueOnce({ rows: [] }); // UPDATE usage_count

      const prescriptionData = {
        patientId: PATIENT_ID,
        prescribedBy: USER_ID,
        exercises: [{ exerciseId: EXERCISE_ID, sets: 3, reps: 10 }],
      };

      const result = await createPrescription(ORG_ID, prescriptionData);

      expect(result).toEqual(prescription);
      expect(mockTransactionStart).toHaveBeenCalledTimes(1);
      expect(mockTransactionCommit).toHaveBeenCalledTimes(1);
      // 1 prescription insert + 1 exercise insert + 1 usage update
      expect(mockClientQuery).toHaveBeenCalledTimes(3);
    });

    it('should rollback transaction on error', async () => {
      mockClientQuery.mockRejectedValue(new Error('Insert failed'));

      const prescriptionData = {
        patientId: PATIENT_ID,
        prescribedBy: USER_ID,
        exercises: [],
      };

      await expect(createPrescription(ORG_ID, prescriptionData)).rejects.toThrow('Insert failed');
      expect(mockTransactionRollback).toHaveBeenCalledTimes(1);
    });
  });

  describe('getPatientPrescriptions', () => {
    it('should return prescriptions for a patient', async () => {
      const prescriptions = [{ id: PRESCRIPTION_ID, status: 'active' }];
      mockQuery.mockResolvedValue({ rows: prescriptions });

      const result = await getPatientPrescriptions(ORG_ID, PATIENT_ID);

      expect(result).toEqual(prescriptions);
      const [, params] = mockQuery.mock.calls[0];
      expect(params).toEqual([ORG_ID, PATIENT_ID]);
    });

    it('should filter by status when provided', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      await getPatientPrescriptions(ORG_ID, PATIENT_ID, 'completed');

      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain('p.status = $3');
      expect(params).toEqual([ORG_ID, PATIENT_ID, 'completed']);
    });
  });

  describe('getPrescriptionById', () => {
    it('should return prescription with exercises', async () => {
      const prescription = { id: PRESCRIPTION_ID, exercises: [] };
      mockQuery.mockResolvedValue({ rows: [prescription] });

      const result = await getPrescriptionById(ORG_ID, PRESCRIPTION_ID);

      expect(result).toEqual(prescription);
      const [, params] = mockQuery.mock.calls[0];
      expect(params).toEqual([ORG_ID, PRESCRIPTION_ID]);
    });

    it('should return null when prescription not found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await getPrescriptionById(ORG_ID, 'nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('updatePrescriptionStatus', () => {
    it('should update status for valid status values', async () => {
      const updated = { id: PRESCRIPTION_ID, status: 'completed' };
      mockQuery.mockResolvedValue({ rows: [updated] });

      const result = await updatePrescriptionStatus(ORG_ID, PRESCRIPTION_ID, 'completed');

      expect(result).toEqual(updated);
      const [, params] = mockQuery.mock.calls[0];
      expect(params).toEqual(['completed', ORG_ID, PRESCRIPTION_ID]);
    });

    it('should throw for invalid status value', async () => {
      await expect(
        updatePrescriptionStatus(ORG_ID, PRESCRIPTION_ID, 'invalid_status')
      ).rejects.toThrow('Invalid status: invalid_status');
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('should return null when prescription not found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await updatePrescriptionStatus(ORG_ID, 'nonexistent', 'paused');

      expect(result).toBeNull();
    });
  });

  describe('updatePrescriptionEmailStatus', () => {
    it('should update email delivery status and return true', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await updatePrescriptionEmailStatus(PRESCRIPTION_ID, true);

      expect(result).toBe(true);
      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain('email_sent_at');
      expect(sql).toContain('email_delivered');
      expect(params).toEqual([true, PRESCRIPTION_ID]);
    });
  });

  // ==========================================================================
  // PATIENT PORTAL
  // ==========================================================================

  describe('getPrescriptionByPortalToken', () => {
    it('should return prescription and increment view count for valid token', async () => {
      const prescription = { id: PRESCRIPTION_ID, status: 'active' };
      mockQuery
        .mockResolvedValueOnce({ rows: [prescription] }) // SELECT prescription
        .mockResolvedValueOnce({ rows: [] }); // UPDATE view count

      const result = await getPrescriptionByPortalToken('valid-token');

      expect(result).toEqual(prescription);
      expect(mockQuery).toHaveBeenCalledTimes(2);
      // Second call updates view count
      const [updateSql] = mockQuery.mock.calls[1];
      expect(updateSql).toContain('portal_view_count');
    });

    it('should return null for expired or invalid token without updating count', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await getPrescriptionByPortalToken('expired-token');

      expect(result).toBeNull();
      // Only the SELECT query, no view count update
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });
  });

  describe('recordProgress', () => {
    it('should record exercise progress for valid token', async () => {
      const progress = { id: 'prog-001', sets_completed: 3 };
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: PRESCRIPTION_ID, patient_id: PATIENT_ID }] })
        .mockResolvedValueOnce({ rows: [progress] });

      const result = await recordProgress('valid-token', {
        exerciseId: EXERCISE_ID,
        setsCompleted: 3,
        repsCompleted: 10,
        difficultyRating: 4,
        painRating: 2,
        notes: 'Felt good',
      });

      expect(result).toEqual(progress);
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    it('should throw for invalid or expired token', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      await expect(recordProgress('bad-token', { exerciseId: EXERCISE_ID })).rejects.toThrow(
        'Invalid or expired access token'
      );
    });
  });

  describe('getProgressHistory', () => {
    it('should return progress entries for a prescription', async () => {
      const history = [
        { id: 'prog-001', exercise_name: 'Plank', sets_completed: 3 },
        { id: 'prog-002', exercise_name: 'Plank', sets_completed: 2 },
      ];
      mockQuery.mockResolvedValue({ rows: history });

      const result = await getProgressHistory(ORG_ID, PRESCRIPTION_ID);

      expect(result).toEqual(history);
      expect(result).toHaveLength(2);
      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain('exercise_progress');
      expect(params).toEqual([ORG_ID, PRESCRIPTION_ID]);
    });
  });
});
