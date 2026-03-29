/**
 * Unit Tests for Exercise Prescriptions (src/services/clinical/exercisePrescriptions.js)
 * Tests prescribe, get, update, compliance, discontinue, complete
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
  prescribeExercise,
  getPatientExercises,
  getPrescriptionById,
  updatePrescription,
  logCompliance,
  discontinuePrescription,
  completePrescription,
} = await import('../../../src/services/clinical/exercisePrescriptions.js');

describe('exercisePrescriptions', () => {
  const ORG_ID = 'org-1';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================================================
  // prescribeExercise
  // ===========================================================================
  describe('prescribeExercise', () => {
    it('should insert prescription and update favorites', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: 'rx-1', patient_id: 'p-1' }] })
        .mockResolvedValueOnce({ rows: [] }); // favorites upsert

      const result = await prescribeExercise(ORG_ID, {
        patient_id: 'p-1',
        prescribed_by: 'user-1',
        exercise_id: 'e-1',
        exercise_code: 'CT-001',
        exercise_name: 'Chin Tuck',
        sets: 3,
        reps: 10,
      });

      expect(result.id).toBe('rx-1');
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    it('should skip favorites update when exercise_id is missing', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'rx-2' }] });

      await prescribeExercise(ORG_ID, {
        patient_id: 'p-1',
        prescribed_by: 'user-1',
        exercise_name: 'Custom Exercise',
        sets: 2,
        reps: 15,
      });

      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('should throw on database error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Insert failed'));
      await expect(prescribeExercise(ORG_ID, { patient_id: 'p-1' })).rejects.toThrow(
        'Insert failed'
      );
    });
  });

  // ===========================================================================
  // getPatientExercises
  // ===========================================================================
  describe('getPatientExercises', () => {
    it('should return paginated patient exercises', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '2' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'rx-1' }, { id: 'rx-2' }] });

      const result = await getPatientExercises('p-1', ORG_ID);
      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });

    it('should apply status filter', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({ rows: [] });

      await getPatientExercises('p-1', ORG_ID, { status: 'completed' });
      expect(mockQuery.mock.calls[0][0]).toContain('pep.status');
    });

    it('should skip status filter when includeCompleted is true', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({ rows: [] });

      await getPatientExercises('p-1', ORG_ID, { includeCompleted: true });
      expect(mockQuery.mock.calls[0][0]).not.toContain('pep.status');
    });
  });

  // ===========================================================================
  // getPrescriptionById
  // ===========================================================================
  describe('getPrescriptionById', () => {
    it('should return prescription when found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'rx-1' }] });
      const result = await getPrescriptionById('rx-1', ORG_ID);
      expect(result.id).toBe('rx-1');
    });

    it('should return null when not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const result = await getPrescriptionById('missing', ORG_ID);
      expect(result).toBeNull();
    });
  });

  // ===========================================================================
  // updatePrescription
  // ===========================================================================
  describe('updatePrescription', () => {
    it('should update allowed fields', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'rx-1', sets: 4 }] });
      const result = await updatePrescription('rx-1', ORG_ID, { sets: 4 });
      expect(result.sets).toBe(4);
    });

    it('should throw when no valid fields', async () => {
      await expect(updatePrescription('rx-1', ORG_ID, { bad_field: 1 })).rejects.toThrow(
        'No valid fields to update'
      );
    });

    it('should return null when not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const result = await updatePrescription('missing', ORG_ID, { sets: 4 });
      expect(result).toBeNull();
    });
  });

  // ===========================================================================
  // logCompliance
  // ===========================================================================
  describe('logCompliance', () => {
    it('should append compliance log entry', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'rx-1' }] });
      const result = await logCompliance('rx-1', ORG_ID, {
        completed: true,
        pain_level: 3,
        notes: 'Felt good',
      });
      expect(result.id).toBe('rx-1');
      expect(mockQuery.mock.calls[0][0]).toContain('compliance_log');
    });

    it('should return null when prescription not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const result = await logCompliance('missing', ORG_ID, { completed: true });
      expect(result).toBeNull();
    });
  });

  // ===========================================================================
  // discontinuePrescription
  // ===========================================================================
  describe('discontinuePrescription', () => {
    it('should set status to discontinued', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'rx-1', status: 'discontinued' }] });
      const result = await discontinuePrescription('rx-1', ORG_ID, 'user-1', 'Patient request');
      expect(result.status).toBe('discontinued');
    });

    it('should return null when not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const result = await discontinuePrescription('missing', ORG_ID, 'user-1', 'reason');
      expect(result).toBeNull();
    });
  });

  // ===========================================================================
  // completePrescription
  // ===========================================================================
  describe('completePrescription', () => {
    it('should set status to completed', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'rx-1', status: 'completed' }] });
      const result = await completePrescription('rx-1', ORG_ID);
      expect(result.status).toBe('completed');
    });

    it('should return null when not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const result = await completePrescription('missing', ORG_ID);
      expect(result).toBeNull();
    });
  });
});
