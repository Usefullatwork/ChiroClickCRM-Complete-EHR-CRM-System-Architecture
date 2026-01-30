/**
 * Exercise Library Service Tests
 * Unit tests for the exercise library service with mocked database
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  createMockQuery,
  createMockTransaction,
  createTestExercise,
  createTestPrescription,
  createTestUser,
  createMany,
} from '../setup.js';

// Mock the database module
const mockQuery = jest.fn();
const mockTransaction = {
  start: jest.fn(),
  commit: jest.fn(),
  rollback: jest.fn(),
};

jest.unstable_mockModule('../../src/config/database.js', () => ({
  query: mockQuery,
  transaction: mockTransaction,
}));

// Import after mocking
const exerciseLibraryService = await import('../../src/services/exerciseLibrary.js');

describe('Exercise Library Service', () => {
  const organizationId = 'test-org-id-456';
  const userId = 'test-user-id-789';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // GET EXERCISES TESTS
  // ============================================================================

  describe('getExercises', () => {
    it('should return all exercises for an organization', async () => {
      const mockExercises = createMany(createTestExercise, 5);
      mockQuery.mockResolvedValueOnce({ rows: mockExercises });

      const result = await exerciseLibraryService.getExercises(organizationId);

      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(5);
      expect(result[0]).toHaveProperty('name');
    });

    it('should filter by category', async () => {
      const mockExercises = [createTestExercise({ category: 'Nakke' })];
      mockQuery.mockResolvedValueOnce({ rows: mockExercises });

      const result = await exerciseLibraryService.getExercises(organizationId, {
        category: 'Nakke',
      });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('category = $'),
        expect.arrayContaining(['Nakke'])
      );
      expect(result).toHaveLength(1);
    });

    it('should filter by difficulty level', async () => {
      const mockExercises = [createTestExercise({ difficulty_level: 'beginner' })];
      mockQuery.mockResolvedValueOnce({ rows: mockExercises });

      const result = await exerciseLibraryService.getExercises(organizationId, {
        difficultyLevel: 'beginner',
      });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('difficulty_level = $'),
        expect.arrayContaining(['beginner'])
      );
    });

    it('should filter by body region', async () => {
      const mockExercises = [createTestExercise({ body_region: 'cervical' })];
      mockQuery.mockResolvedValueOnce({ rows: mockExercises });

      const result = await exerciseLibraryService.getExercises(organizationId, {
        bodyRegion: 'cervical',
      });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('body_region = $'),
        expect.arrayContaining(['cervical'])
      );
    });

    it('should support search functionality', async () => {
      const mockExercises = [createTestExercise({ name: 'Nakkestrekning' })];
      mockQuery.mockResolvedValueOnce({ rows: mockExercises });

      const result = await exerciseLibraryService.getExercises(organizationId, {
        search: 'nakke',
      });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('ILIKE'),
        expect.arrayContaining(['%nakke%'])
      );
    });

    it('should filter by active status', async () => {
      const mockExercises = [createTestExercise({ is_active: true })];
      mockQuery.mockResolvedValueOnce({ rows: mockExercises });

      const result = await exerciseLibraryService.getExercises(organizationId, {
        isActive: true,
      });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('is_active = $'),
        expect.arrayContaining([true])
      );
    });

    it('should support pagination with limit and offset', async () => {
      const mockExercises = createMany(createTestExercise, 10);
      mockQuery.mockResolvedValueOnce({ rows: mockExercises.slice(0, 5) });

      const result = await exerciseLibraryService.getExercises(organizationId, {
        limit: 5,
        offset: 0,
      });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT'),
        expect.arrayContaining([5, 0])
      );
      expect(result).toHaveLength(5);
    });

    it('should throw error on database failure', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Database connection failed'));

      await expect(
        exerciseLibraryService.getExercises(organizationId)
      ).rejects.toThrow('Database connection failed');
    });
  });

  // ============================================================================
  // GET EXERCISE BY ID TESTS
  // ============================================================================

  describe('getExerciseById', () => {
    it('should return exercise when found', async () => {
      const mockExercise = createTestExercise();
      mockQuery.mockResolvedValueOnce({ rows: [mockExercise] });

      const result = await exerciseLibraryService.getExerciseById(
        organizationId,
        mockExercise.id
      );

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE organization_id = $1 AND id = $2'),
        [organizationId, mockExercise.id]
      );
      expect(result).toEqual(mockExercise);
    });

    it('should return null when exercise not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await exerciseLibraryService.getExerciseById(
        organizationId,
        'non-existent-id'
      );

      expect(result).toBeNull();
    });
  });

  // ============================================================================
  // CREATE EXERCISE TESTS
  // ============================================================================

  describe('createExercise', () => {
    it('should create a new exercise', async () => {
      const exerciseData = {
        name: 'New Exercise',
        nameNorwegian: 'Ny Ovelse',
        category: 'Nakke',
        difficultyLevel: 'beginner',
        instructions: 'Test instructions',
      };

      const createdExercise = createTestExercise({ ...exerciseData });
      mockQuery.mockResolvedValueOnce({ rows: [createdExercise] });

      const result = await exerciseLibraryService.createExercise(
        organizationId,
        userId,
        exerciseData
      );

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO exercise_library'),
        expect.arrayContaining([organizationId, exerciseData.name])
      );
      expect(result).toHaveProperty('id');
    });

    it('should use default values for optional fields', async () => {
      const exerciseData = {
        name: 'Minimal Exercise',
      };

      const createdExercise = createTestExercise({
        name: 'Minimal Exercise',
        sets_default: 3,
        reps_default: 10,
        difficulty_level: 'beginner',
      });
      mockQuery.mockResolvedValueOnce({ rows: [createdExercise] });

      const result = await exerciseLibraryService.createExercise(
        organizationId,
        userId,
        exerciseData
      );

      expect(result.sets_default).toBe(3);
      expect(result.reps_default).toBe(10);
    });

    it('should throw error on database failure', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Insert failed'));

      await expect(
        exerciseLibraryService.createExercise(organizationId, userId, {
          name: 'Test',
        })
      ).rejects.toThrow('Insert failed');
    });
  });

  // ============================================================================
  // UPDATE EXERCISE TESTS
  // ============================================================================

  describe('updateExercise', () => {
    it('should update exercise fields', async () => {
      const exerciseId = 'test-exercise-id';
      const updateData = {
        name: 'Updated Name',
        category: 'Skulder',
      };

      const updatedExercise = createTestExercise({ ...updateData });
      mockQuery.mockResolvedValueOnce({ rows: [updatedExercise] });

      const result = await exerciseLibraryService.updateExercise(
        organizationId,
        exerciseId,
        updateData
      );

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE exercise_library'),
        expect.arrayContaining([updateData.name, updateData.category])
      );
      expect(result.name).toBe('Updated Name');
    });

    it('should return null when exercise not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await exerciseLibraryService.updateExercise(
        organizationId,
        'non-existent-id',
        { name: 'Updated' }
      );

      expect(result).toBeNull();
    });

    it('should throw error when no valid fields provided', async () => {
      await expect(
        exerciseLibraryService.updateExercise(organizationId, 'test-id', {})
      ).rejects.toThrow('No valid fields to update');
    });

    it('should convert camelCase to snake_case for database', async () => {
      const updateData = {
        difficultyLevel: 'intermediate',
        bodyRegion: 'lumbar',
      };

      const updatedExercise = createTestExercise({
        difficulty_level: 'intermediate',
        body_region: 'lumbar',
      });
      mockQuery.mockResolvedValueOnce({ rows: [updatedExercise] });

      await exerciseLibraryService.updateExercise(
        organizationId,
        'test-id',
        updateData
      );

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('difficulty_level'),
        expect.any(Array)
      );
    });
  });

  // ============================================================================
  // DELETE EXERCISE TESTS
  // ============================================================================

  describe('deleteExercise', () => {
    it('should soft delete exercise by setting is_active to false', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'test-id' }] });

      const result = await exerciseLibraryService.deleteExercise(
        organizationId,
        'test-id'
      );

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE exercise_library SET is_active = false'),
        [organizationId, 'test-id']
      );
      expect(result).toBe(true);
    });

    it('should return false when exercise not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await exerciseLibraryService.deleteExercise(
        organizationId,
        'non-existent-id'
      );

      expect(result).toBe(false);
    });
  });

  // ============================================================================
  // GET CATEGORIES TESTS
  // ============================================================================

  describe('getCategories', () => {
    it('should return distinct categories with counts', async () => {
      const mockCategories = [
        { category: 'Nakke', subcategories: ['Mobilitet', 'Styrke'], exercise_count: '5' },
        { category: 'Skulder', subcategories: ['Stabilitet'], exercise_count: '3' },
      ];
      mockQuery.mockResolvedValueOnce({ rows: mockCategories });

      const result = await exerciseLibraryService.getCategories(organizationId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT DISTINCT category'),
        [organizationId]
      );
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('category');
      expect(result[0]).toHaveProperty('subcategories');
      expect(result[0]).toHaveProperty('exercise_count');
    });
  });

  // ============================================================================
  // CREATE PRESCRIPTION TESTS
  // ============================================================================

  describe('createPrescription', () => {
    const mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };

    beforeEach(() => {
      mockTransaction.start.mockResolvedValue(mockClient);
      mockTransaction.commit.mockResolvedValue(true);
      mockTransaction.rollback.mockResolvedValue(true);
    });

    it('should create prescription with exercises', async () => {
      const prescriptionData = {
        patientId: 'patient-123',
        encounterId: 'encounter-123',
        prescribedBy: userId,
        exercises: [
          { exerciseId: 'ex-1', sets: 3, reps: 10 },
          { exerciseId: 'ex-2', sets: 2, reps: 15 },
        ],
      };

      const mockPrescription = createTestPrescription();
      mockClient.query
        .mockResolvedValueOnce({ rows: [mockPrescription] }) // Insert prescription
        .mockResolvedValueOnce({ rows: [] }) // Insert exercise 1
        .mockResolvedValueOnce({ rows: [] }) // Update usage count 1
        .mockResolvedValueOnce({ rows: [] }) // Insert exercise 2
        .mockResolvedValueOnce({ rows: [] }); // Update usage count 2

      const result = await exerciseLibraryService.createPrescription(
        organizationId,
        prescriptionData
      );

      expect(mockTransaction.start).toHaveBeenCalled();
      expect(mockClient.query).toHaveBeenCalled();
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(result).toHaveProperty('id');
    });

    it('should rollback transaction on error', async () => {
      const prescriptionData = {
        patientId: 'patient-123',
        exercises: [{ exerciseId: 'ex-1' }],
      };

      mockClient.query.mockRejectedValueOnce(new Error('Insert failed'));

      await expect(
        exerciseLibraryService.createPrescription(organizationId, prescriptionData)
      ).rejects.toThrow('Insert failed');

      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it('should increment exercise usage count', async () => {
      const prescriptionData = {
        patientId: 'patient-123',
        exercises: [{ exerciseId: 'ex-1' }],
      };

      mockClient.query
        .mockResolvedValueOnce({ rows: [createTestPrescription()] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      await exerciseLibraryService.createPrescription(
        organizationId,
        prescriptionData
      );

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('usage_count = usage_count + 1'),
        ['ex-1']
      );
    });
  });

  // ============================================================================
  // GET PATIENT PRESCRIPTIONS TESTS
  // ============================================================================

  describe('getPatientPrescriptions', () => {
    it('should return prescriptions for a patient', async () => {
      const mockPrescriptions = [
        createTestPrescription({ status: 'active' }),
        createTestPrescription({ id: 'rx-2', status: 'completed' }),
      ];
      mockQuery.mockResolvedValueOnce({ rows: mockPrescriptions });

      const result = await exerciseLibraryService.getPatientPrescriptions(
        organizationId,
        'patient-123'
      );

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('patient_id = $2'),
        expect.arrayContaining([organizationId, 'patient-123'])
      );
      expect(result).toHaveLength(2);
    });

    it('should filter by status when provided', async () => {
      const mockPrescriptions = [createTestPrescription({ status: 'active' })];
      mockQuery.mockResolvedValueOnce({ rows: mockPrescriptions });

      const result = await exerciseLibraryService.getPatientPrescriptions(
        organizationId,
        'patient-123',
        'active'
      );

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('status = $3'),
        expect.arrayContaining(['active'])
      );
    });
  });

  // ============================================================================
  // UPDATE PRESCRIPTION STATUS TESTS
  // ============================================================================

  describe('updatePrescriptionStatus', () => {
    it('should update prescription status', async () => {
      const mockPrescription = createTestPrescription({ status: 'completed' });
      mockQuery.mockResolvedValueOnce({ rows: [mockPrescription] });

      const result = await exerciseLibraryService.updatePrescriptionStatus(
        organizationId,
        'rx-123',
        'completed'
      );

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE exercise_prescriptions'),
        ['completed', organizationId, 'rx-123']
      );
      expect(result.status).toBe('completed');
    });

    it('should throw error for invalid status', async () => {
      await expect(
        exerciseLibraryService.updatePrescriptionStatus(
          organizationId,
          'rx-123',
          'invalid_status'
        )
      ).rejects.toThrow('Invalid status');
    });

    it('should accept valid statuses', async () => {
      const validStatuses = ['active', 'completed', 'cancelled', 'paused'];

      for (const status of validStatuses) {
        mockQuery.mockResolvedValueOnce({
          rows: [createTestPrescription({ status })],
        });

        const result = await exerciseLibraryService.updatePrescriptionStatus(
          organizationId,
          'rx-123',
          status
        );

        expect(result.status).toBe(status);
      }
    });
  });

  // ============================================================================
  // PORTAL TOKEN TESTS
  // ============================================================================

  describe('getPrescriptionByPortalToken', () => {
    it('should return prescription for valid token', async () => {
      const mockPrescription = createTestPrescription({
        clinic_name: 'Test Clinic',
        clinic_phone: '+47 12345678',
      });
      mockQuery
        .mockResolvedValueOnce({ rows: [mockPrescription] })
        .mockResolvedValueOnce({ rows: [] }); // Update view count

      const result = await exerciseLibraryService.getPrescriptionByPortalToken(
        'valid-token'
      );

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('portal_access_token = $1'),
        ['valid-token']
      );
      expect(result).toBeTruthy();
    });

    it('should return null for expired or invalid token', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await exerciseLibraryService.getPrescriptionByPortalToken(
        'invalid-token'
      );

      expect(result).toBeNull();
    });

    it('should update view count on successful access', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [createTestPrescription()] })
        .mockResolvedValueOnce({ rows: [] });

      await exerciseLibraryService.getPrescriptionByPortalToken('valid-token');

      expect(mockQuery).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('portal_view_count = portal_view_count + 1'),
        ['valid-token']
      );
    });
  });

  // ============================================================================
  // RECORD PROGRESS TESTS
  // ============================================================================

  describe('recordProgress', () => {
    it('should record exercise progress', async () => {
      const progressData = {
        exerciseId: 'ex-123',
        setsCompleted: 3,
        repsCompleted: 10,
        difficultyRating: 3,
        painRating: 2,
        notes: 'Felt good',
      };

      mockQuery
        .mockResolvedValueOnce({
          rows: [{ id: 'rx-123', patient_id: 'patient-123' }],
        })
        .mockResolvedValueOnce({
          rows: [{ id: 'progress-123', ...progressData }],
        });

      const result = await exerciseLibraryService.recordProgress(
        'valid-token',
        progressData
      );

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO exercise_progress'),
        expect.arrayContaining([
          progressData.setsCompleted,
          progressData.repsCompleted,
        ])
      );
      expect(result).toHaveProperty('id');
    });

    it('should throw error for invalid token', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(
        exerciseLibraryService.recordProgress('invalid-token', {})
      ).rejects.toThrow('Invalid or expired access token');
    });
  });

  // ============================================================================
  // GET PROGRESS HISTORY TESTS
  // ============================================================================

  describe('getProgressHistory', () => {
    it('should return progress history for prescription', async () => {
      const mockProgress = [
        {
          id: 'p-1',
          exercise_name: 'Nakkestrekning',
          completed_at: new Date().toISOString(),
        },
        {
          id: 'p-2',
          exercise_name: 'Skulderrotasjon',
          completed_at: new Date().toISOString(),
        },
      ];
      mockQuery.mockResolvedValueOnce({ rows: mockProgress });

      const result = await exerciseLibraryService.getProgressHistory(
        organizationId,
        'rx-123'
      );

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('FROM exercise_progress'),
        [organizationId, 'rx-123']
      );
      expect(result).toHaveLength(2);
    });
  });
});
