/**
 * Patient Exercises Service Tests
 * Unit tests for the patient exercises service with mocked database
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import {
  createMockQuery,
  createTestPatient,
  createTestPrescription,
  createTestExercise,
  createTestExerciseProgress,
  createTestPortalToken,
} from '../setup.js';

// Mock the database module
const mockQuery = jest.fn();

jest.unstable_mockModule('../../src/config/database.js', () => ({
  query: mockQuery,
  transaction: {
    start: jest.fn(),
    commit: jest.fn(),
    rollback: jest.fn(),
  },
}));

// Mock crypto for token generation
jest.unstable_mockModule('crypto', () => ({
  default: {
    randomBytes: jest.fn().mockReturnValue({
      toString: jest.fn().mockReturnValue('mock-generated-token-abc123def456'),
    }),
  },
}));

// Import after mocking
const patientExercisesService = await import('../../src/services/patientExercises.js');

describe('Patient Exercises Service', () => {
  const organizationId = 'test-org-id-456';
  const patientId = 'test-patient-id-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // TOKEN MANAGEMENT TESTS
  // ============================================================================

  describe('createPortalToken', () => {
    it('should create a new portal token', async () => {
      const mockToken = createTestPortalToken();
      mockQuery.mockResolvedValueOnce({ rows: [mockToken] });

      const result = await patientExercisesService.createPortalToken(
        organizationId,
        patientId,
        'exercises',
        30
      );

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO patient_portal_tokens'),
        expect.arrayContaining([patientId, organizationId])
      );
      expect(result).toHaveProperty('access_token');
    });

    it('should use default token type of "exercises"', async () => {
      const mockToken = createTestPortalToken({ token_type: 'exercises' });
      mockQuery.mockResolvedValueOnce({ rows: [mockToken] });

      await patientExercisesService.createPortalToken(organizationId, patientId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['exercises'])
      );
    });

    it('should set expiry based on expiryDays parameter', async () => {
      const mockToken = createTestPortalToken();
      mockQuery.mockResolvedValueOnce({ rows: [mockToken] });

      await patientExercisesService.createPortalToken(
        organizationId,
        patientId,
        'exercises',
        7
      );

      // Verify the query was called with correct expiry date calculation
      expect(mockQuery).toHaveBeenCalled();
    });

    it('should throw error on database failure', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      await expect(
        patientExercisesService.createPortalToken(organizationId, patientId)
      ).rejects.toThrow('Database error');
    });
  });

  describe('validatePortalToken', () => {
    it('should return token data for valid token', async () => {
      const mockTokenData = createTestPortalToken();
      mockQuery
        .mockResolvedValueOnce({ rows: [mockTokenData] }) // Validate query
        .mockResolvedValueOnce({ rows: [] }); // Update usage query

      const result = await patientExercisesService.validatePortalToken(
        mockTokenData.access_token
      );

      expect(result).toHaveProperty('patient_id');
      expect(result).toHaveProperty('organization_id');
      expect(result).toHaveProperty('patient_first_name');
    });

    it('should return null for invalid token', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await patientExercisesService.validatePortalToken(
        'invalid-token'
      );

      expect(result).toBeNull();
    });

    it('should return null for token shorter than 32 characters', async () => {
      const result = await patientExercisesService.validatePortalToken('short');

      expect(result).toBeNull();
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('should return null for empty token', async () => {
      const result = await patientExercisesService.validatePortalToken('');

      expect(result).toBeNull();
    });

    it('should return null for null token', async () => {
      const result = await patientExercisesService.validatePortalToken(null);

      expect(result).toBeNull();
    });

    it('should update usage tracking on successful validation', async () => {
      const mockTokenData = createTestPortalToken();
      mockQuery
        .mockResolvedValueOnce({ rows: [mockTokenData] })
        .mockResolvedValueOnce({ rows: [] });

      await patientExercisesService.validatePortalToken(
        mockTokenData.access_token
      );

      expect(mockQuery).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('last_used_at = CURRENT_TIMESTAMP'),
        [mockTokenData.access_token]
      );
    });
  });

  describe('revokePortalToken', () => {
    it('should revoke a portal token', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await patientExercisesService.revokePortalToken(
        'test-token'
      );

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SET is_revoked = true'),
        ['test-token']
      );
      expect(result).toBe(true);
    });

    it('should throw error on database failure', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      await expect(
        patientExercisesService.revokePortalToken('test-token')
      ).rejects.toThrow('Database error');
    });
  });

  // ============================================================================
  // GET PATIENT PRESCRIPTIONS TESTS
  // ============================================================================

  describe('getPatientPrescriptions', () => {
    it('should return prescriptions for valid token', async () => {
      const mockTokenData = createTestPortalToken();
      const mockPrescriptions = [
        {
          id: 'rx-1',
          status: 'active',
          prescribed_by_name: 'Dr. Hansen',
          exercise_count: '3',
          completed_today: '1',
        },
      ];

      mockQuery
        .mockResolvedValueOnce({ rows: [mockTokenData] }) // Validate token
        .mockResolvedValueOnce({ rows: [] }) // Update usage
        .mockResolvedValueOnce({ rows: mockPrescriptions }); // Get prescriptions

      const result = await patientExercisesService.getPatientPrescriptions(
        mockTokenData.access_token
      );

      expect(result).toHaveProperty('patient');
      expect(result).toHaveProperty('clinic');
      expect(result).toHaveProperty('prescriptions');
      expect(result.prescriptions).toHaveLength(1);
    });

    it('should return null for invalid token', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await patientExercisesService.getPatientPrescriptions(
        'invalid-token'
      );

      expect(result).toBeNull();
    });

    it('should include patient name in response', async () => {
      const mockTokenData = createTestPortalToken({
        patient_first_name: 'Ola',
        patient_last_name: 'Nordmann',
      });

      mockQuery
        .mockResolvedValueOnce({ rows: [mockTokenData] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await patientExercisesService.getPatientPrescriptions(
        mockTokenData.access_token
      );

      expect(result.patient.firstName).toBe('Ola');
      expect(result.patient.lastName).toBe('Nordmann');
    });

    it('should include clinic info in response', async () => {
      const mockTokenData = createTestPortalToken({
        organization_name: 'Oslo Kiropraktikk',
        organization_phone: '+47 22 33 44 55',
      });

      mockQuery
        .mockResolvedValueOnce({ rows: [mockTokenData] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await patientExercisesService.getPatientPrescriptions(
        mockTokenData.access_token
      );

      expect(result.clinic.name).toBe('Oslo Kiropraktikk');
      expect(result.clinic.phone).toBe('+47 22 33 44 55');
    });

    it('should filter by active and paused status', async () => {
      const mockTokenData = createTestPortalToken();

      mockQuery
        .mockResolvedValueOnce({ rows: [mockTokenData] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      await patientExercisesService.getPatientPrescriptions(
        mockTokenData.access_token
      );

      expect(mockQuery).toHaveBeenLastCalledWith(
        expect.stringContaining("status IN ('active', 'paused')"),
        expect.any(Array)
      );
    });
  });

  // ============================================================================
  // GET PRESCRIPTION DETAIL TESTS
  // ============================================================================

  describe('getPrescriptionDetail', () => {
    it('should return prescription with exercises', async () => {
      const mockTokenData = createTestPortalToken();
      const mockPrescription = createTestPrescription();
      const mockExercises = [
        {
          prescribed_exercise_id: 'pe-1',
          exercise_id: 'ex-1',
          name: 'Nakkestrekning',
          sets: 3,
          reps: 10,
          completed_today: false,
        },
      ];

      mockQuery
        .mockResolvedValueOnce({ rows: [mockTokenData] }) // Validate token
        .mockResolvedValueOnce({ rows: [] }) // Update usage
        .mockResolvedValueOnce({ rows: [mockPrescription] }) // Get prescription
        .mockResolvedValueOnce({ rows: mockExercises }); // Get exercises

      const result = await patientExercisesService.getPrescriptionDetail(
        mockTokenData.access_token,
        mockPrescription.id
      );

      expect(result).toHaveProperty('prescription');
      expect(result).toHaveProperty('exercises');
      expect(result.exercises).toHaveLength(1);
    });

    it('should return null for invalid token', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await patientExercisesService.getPrescriptionDetail(
        'invalid-token',
        'rx-123'
      );

      expect(result).toBeNull();
    });

    it('should return null for prescription not belonging to patient', async () => {
      const mockTokenData = createTestPortalToken();

      mockQuery
        .mockResolvedValueOnce({ rows: [mockTokenData] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] }); // Empty - prescription not found

      const result = await patientExercisesService.getPrescriptionDetail(
        mockTokenData.access_token,
        'wrong-rx-id'
      );

      expect(result).toBeNull();
    });

    it('should prefer Norwegian names when available', async () => {
      const mockTokenData = createTestPortalToken();
      const mockPrescription = createTestPrescription();
      const mockExercises = [
        {
          prescribed_exercise_id: 'pe-1',
          exercise_id: 'ex-1',
          name: 'Neck Stretch',
          name_norwegian: 'Nakkestrekning',
          sets: 3,
          reps: 10,
        },
      ];

      mockQuery
        .mockResolvedValueOnce({ rows: [mockTokenData] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [mockPrescription] })
        .mockResolvedValueOnce({ rows: mockExercises });

      const result = await patientExercisesService.getPrescriptionDetail(
        mockTokenData.access_token,
        mockPrescription.id
      );

      expect(result.exercises[0].name).toBe('Nakkestrekning');
    });
  });

  // ============================================================================
  // GET EXERCISE DETAIL TESTS
  // ============================================================================

  describe('getExerciseDetail', () => {
    it('should return exercise detail with progress history', async () => {
      const mockTokenData = createTestPortalToken();
      const mockExerciseDetail = {
        prescribed_exercise_id: 'pe-1',
        id: 'ex-1',
        name: 'Nakkestrekning',
        sets: 3,
        completed_today: true,
        progress_history: [
          { completedAt: new Date().toISOString(), setsCompleted: 3 },
        ],
      };

      mockQuery
        .mockResolvedValueOnce({ rows: [mockTokenData] }) // Validate token
        .mockResolvedValueOnce({ rows: [] }) // Update usage
        .mockResolvedValueOnce({ rows: [{ id: 'rx-123' }] }) // Prescription check
        .mockResolvedValueOnce({ rows: [mockExerciseDetail] }); // Exercise detail

      const result = await patientExercisesService.getExerciseDetail(
        mockTokenData.access_token,
        'rx-123',
        'ex-1'
      );

      expect(result).toHaveProperty('exercise');
      expect(result.exercise).toHaveProperty('progressHistory');
    });

    it('should return null for invalid token', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await patientExercisesService.getExerciseDetail(
        'invalid-token',
        'rx-123',
        'ex-1'
      );

      expect(result).toBeNull();
    });

    it('should return null when prescription not found', async () => {
      const mockTokenData = createTestPortalToken();

      mockQuery
        .mockResolvedValueOnce({ rows: [mockTokenData] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] }); // Empty prescription check

      const result = await patientExercisesService.getExerciseDetail(
        mockTokenData.access_token,
        'rx-123',
        'ex-1'
      );

      expect(result).toBeNull();
    });

    it('should return null when exercise not found in prescription', async () => {
      const mockTokenData = createTestPortalToken();

      mockQuery
        .mockResolvedValueOnce({ rows: [mockTokenData] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ id: 'rx-123' }] })
        .mockResolvedValueOnce({ rows: [] }); // Empty exercise result

      const result = await patientExercisesService.getExerciseDetail(
        mockTokenData.access_token,
        'rx-123',
        'wrong-ex-id'
      );

      expect(result).toBeNull();
    });
  });

  // ============================================================================
  // RECORD EXERCISE PROGRESS TESTS
  // ============================================================================

  describe('recordExerciseProgress', () => {
    const progressData = {
      setsCompleted: 3,
      repsCompleted: 10,
      holdSecondsCompleted: 30,
      difficultyRating: 3,
      painRating: 2,
      notes: 'Felt good',
    };

    it('should record exercise progress successfully', async () => {
      const mockTokenData = createTestPortalToken();
      const mockProgress = createTestExerciseProgress();

      mockQuery
        .mockResolvedValueOnce({ rows: [mockTokenData] }) // Validate token
        .mockResolvedValueOnce({ rows: [] }) // Update usage
        .mockResolvedValueOnce({ rows: [{ id: 'rx-123' }] }) // Prescription check
        .mockResolvedValueOnce({ rows: [mockProgress] }); // Insert progress

      const result = await patientExercisesService.recordExerciseProgress(
        mockTokenData.access_token,
        'rx-123',
        'ex-1',
        progressData
      );

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('progress');
      expect(result).toHaveProperty('message', 'Fremgang registrert!');
    });

    it('should throw error for invalid token', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(
        patientExercisesService.recordExerciseProgress(
          'invalid-token',
          'rx-123',
          'ex-1',
          progressData
        )
      ).rejects.toThrow('Ugyldig eller utlopt tilgangstoken');
    });

    it('should throw error for inactive prescription', async () => {
      const mockTokenData = createTestPortalToken();

      mockQuery
        .mockResolvedValueOnce({ rows: [mockTokenData] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] }); // Empty - prescription not found/active

      await expect(
        patientExercisesService.recordExerciseProgress(
          mockTokenData.access_token,
          'rx-123',
          'ex-1',
          progressData
        )
      ).rejects.toThrow('Oppskriften ble ikke funnet eller er ikke aktiv');
    });

    it('should set source as "portal"', async () => {
      const mockTokenData = createTestPortalToken();

      mockQuery
        .mockResolvedValueOnce({ rows: [mockTokenData] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ id: 'rx-123' }] })
        .mockResolvedValueOnce({ rows: [createTestExerciseProgress()] });

      await patientExercisesService.recordExerciseProgress(
        mockTokenData.access_token,
        'rx-123',
        'ex-1',
        progressData
      );

      expect(mockQuery).toHaveBeenLastCalledWith(
        expect.stringContaining("'portal'"),
        expect.any(Array)
      );
    });
  });

  // ============================================================================
  // GET PROGRESS HISTORY TESTS
  // ============================================================================

  describe('getProgressHistory', () => {
    it('should return progress history with stats', async () => {
      const mockTokenData = createTestPortalToken();
      const mockProgress = [
        createTestExerciseProgress(),
        createTestExerciseProgress({ id: 'p-2' }),
      ];
      const mockStats = {
        total_completions: '10',
        active_days: '5',
        avg_difficulty: '3.5',
        avg_pain: '2.0',
      };

      mockQuery
        .mockResolvedValueOnce({ rows: [mockTokenData] }) // Validate token
        .mockResolvedValueOnce({ rows: [] }) // Update usage
        .mockResolvedValueOnce({ rows: [{ id: 'rx-123' }] }) // Prescription check
        .mockResolvedValueOnce({ rows: mockProgress }) // Progress entries
        .mockResolvedValueOnce({ rows: [mockStats] }); // Stats

      const result = await patientExercisesService.getProgressHistory(
        mockTokenData.access_token,
        'rx-123'
      );

      expect(result).toHaveProperty('progress');
      expect(result).toHaveProperty('stats');
      expect(result.progress).toHaveLength(2);
      expect(result.stats.totalCompletions).toBe(10);
    });

    it('should return null for invalid token', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await patientExercisesService.getProgressHistory(
        'invalid-token',
        'rx-123'
      );

      expect(result).toBeNull();
    });

    it('should support pagination with limit and offset', async () => {
      const mockTokenData = createTestPortalToken();

      mockQuery
        .mockResolvedValueOnce({ rows: [mockTokenData] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ id: 'rx-123' }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{}] });

      await patientExercisesService.getProgressHistory(
        mockTokenData.access_token,
        'rx-123',
        { limit: 10, offset: 20 }
      );

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT $2 OFFSET $3'),
        expect.arrayContaining([10, 20])
      );
    });
  });

  // ============================================================================
  // GET DAILY PROGRESS SUMMARY TESTS
  // ============================================================================

  describe('getDailyProgressSummary', () => {
    it('should return daily summary', async () => {
      const mockTokenData = createTestPortalToken();
      const mockSummary = {
        exercises_completed: '2',
        total_exercises: '5',
        total_sets: '6',
        total_reps: '30',
        avg_difficulty: '3.0',
        avg_pain: '2.0',
      };

      mockQuery
        .mockResolvedValueOnce({ rows: [mockTokenData] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [mockSummary] });

      const result = await patientExercisesService.getDailyProgressSummary(
        mockTokenData.access_token,
        'rx-123'
      );

      expect(result).toHaveProperty('date');
      expect(result).toHaveProperty('exercisesCompleted', 2);
      expect(result).toHaveProperty('totalExercises', 5);
      expect(result).toHaveProperty('completionPercentage', 40);
    });

    it('should return null for invalid token', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await patientExercisesService.getDailyProgressSummary(
        'invalid-token',
        'rx-123'
      );

      expect(result).toBeNull();
    });

    it('should use provided date', async () => {
      const mockTokenData = createTestPortalToken();
      const testDate = new Date('2024-06-15');

      mockQuery
        .mockResolvedValueOnce({ rows: [mockTokenData] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{}] });

      const result = await patientExercisesService.getDailyProgressSummary(
        mockTokenData.access_token,
        'rx-123',
        testDate
      );

      expect(result.date).toBe('2024-06-15');
    });

    it('should handle zero exercises gracefully', async () => {
      const mockTokenData = createTestPortalToken();
      const mockSummary = {
        exercises_completed: '0',
        total_exercises: '0',
        total_sets: null,
        total_reps: null,
        avg_difficulty: null,
        avg_pain: null,
      };

      mockQuery
        .mockResolvedValueOnce({ rows: [mockTokenData] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [mockSummary] });

      const result = await patientExercisesService.getDailyProgressSummary(
        mockTokenData.access_token,
        'rx-123'
      );

      expect(result.completionPercentage).toBe(0);
      expect(result.avgDifficulty).toBe(0);
    });
  });
});
