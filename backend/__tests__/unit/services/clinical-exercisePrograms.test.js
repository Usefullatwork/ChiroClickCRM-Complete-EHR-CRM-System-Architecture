/**
 * Unit Tests for Exercise Programs (src/services/clinical/exercisePrograms.js)
 * Tests program CRUD, assignment, and statistics
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

jest.unstable_mockModule('../../../src/services/clinical/exercisePrescriptions.js', () => ({
  prescribeExercise: jest.fn().mockResolvedValue({ id: 'rx-mock' }),
}));

const {
  getAllPrograms,
  getProgramById,
  createProgram,
  updateProgram,
  deleteProgram,
  assignProgramToPatient,
  getExerciseStats,
  getTopPrescribedExercises,
  getComplianceStats,
} = await import('../../../src/services/clinical/exercisePrograms.js');

describe('exercisePrograms', () => {
  const ORG_ID = 'org-1';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================================================
  // getAllPrograms
  // ===========================================================================
  describe('getAllPrograms', () => {
    it('should return paginated programs', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '2' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'p1' }, { id: 'p2' }] });

      const result = await getAllPrograms(ORG_ID);
      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });

    it('should apply targetCondition filter', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({ rows: [] });

      await getAllPrograms(ORG_ID, { targetCondition: 'neck_pain' });
      expect(mockQuery.mock.calls[0][0]).toContain('target_condition');
    });

    it('should throw on database error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB error'));
      await expect(getAllPrograms(ORG_ID)).rejects.toThrow('DB error');
    });
  });

  // ===========================================================================
  // getProgramById
  // ===========================================================================
  describe('getProgramById', () => {
    it('should return program when found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'p1', name_no: 'Test' }] });
      const result = await getProgramById('p1', ORG_ID);
      expect(result.id).toBe('p1');
    });

    it('should return null when not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const result = await getProgramById('missing', ORG_ID);
      expect(result).toBeNull();
    });
  });

  // ===========================================================================
  // createProgram
  // ===========================================================================
  describe('createProgram', () => {
    it('should create program and return row', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'new-p1' }] });
      const result = await createProgram(
        ORG_ID,
        { name_no: 'Nakkeprogram', exercises: [{ exercise_id: 'e1' }] },
        'user-1'
      );
      expect(result.id).toBe('new-p1');
    });

    it('should JSON-stringify exercises', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'new-p2' }] });
      await createProgram(ORG_ID, { exercises: [{ exercise_id: 'e1' }] }, 'user-1');
      const params = mockQuery.mock.calls[0][1];
      expect(typeof params[8]).toBe('string'); // exercises param is JSON string
    });
  });

  // ===========================================================================
  // updateProgram
  // ===========================================================================
  describe('updateProgram', () => {
    it('should update allowed fields', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'p1', name_no: 'Updated' }] });
      const result = await updateProgram('p1', ORG_ID, { name_no: 'Updated' });
      expect(result.name_no).toBe('Updated');
    });

    it('should throw when no valid fields', async () => {
      await expect(updateProgram('p1', ORG_ID, { bad: 'x' })).rejects.toThrow(
        'No valid fields to update'
      );
    });

    it('should return null when not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const result = await updateProgram('missing', ORG_ID, { name_no: 'x' });
      expect(result).toBeNull();
    });
  });

  // ===========================================================================
  // deleteProgram
  // ===========================================================================
  describe('deleteProgram', () => {
    it('should soft-delete program', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'p1' }] });
      const result = await deleteProgram('p1', ORG_ID);
      expect(result.success).toBe(true);
    });

    it('should return null when not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const result = await deleteProgram('missing', ORG_ID);
      expect(result).toBeNull();
    });
  });

  // ===========================================================================
  // assignProgramToPatient
  // ===========================================================================
  describe('assignProgramToPatient', () => {
    it('should assign program and prescribe exercises', async () => {
      // getProgramById
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'p1',
            name_no: 'Test',
            description_no: 'Desc',
            exercises: [{ exercise_id: 'e1', exercise_name: 'Ex1', sets: 3, reps: 10 }],
            duration_weeks: 6,
          },
        ],
      });
      // insert patient_exercise_programs
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'assign-1' }] });
      // prescribeExercise is mocked
      // update usage_count
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await assignProgramToPatient(ORG_ID, {
        patient_id: 'pat-1',
        program_id: 'p1',
        prescribed_by: 'user-1',
      });
      expect(result.id).toBe('assign-1');
    });

    it('should throw when program not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(
        assignProgramToPatient(ORG_ID, {
          patient_id: 'pat-1',
          program_id: 'missing',
          prescribed_by: 'user-1',
        })
      ).rejects.toThrow('Program not found');
    });
  });

  // ===========================================================================
  // getExerciseStats
  // ===========================================================================
  describe('getExerciseStats', () => {
    it('should return aggregate stats', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            total_exercises: '10',
            active_prescriptions: '5',
            total_programs: '3',
            patients_with_exercises: '8',
          },
        ],
      });
      const result = await getExerciseStats(ORG_ID);
      expect(result.total_exercises).toBe('10');
    });
  });

  // ===========================================================================
  // getTopPrescribedExercises
  // ===========================================================================
  describe('getTopPrescribedExercises', () => {
    it('should return top prescribed exercises', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ exercise_code: 'CT-001', exercise_name: 'Chin Tuck', prescription_count: '20' }],
      });
      const result = await getTopPrescribedExercises(ORG_ID);
      expect(result.length).toBe(1);
    });
  });

  // ===========================================================================
  // getComplianceStats
  // ===========================================================================
  describe('getComplianceStats', () => {
    it('should return compliance stats', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'rx-1', compliance_percent: 75 }] });
      const result = await getComplianceStats(ORG_ID, 30);
      expect(result.length).toBe(1);
    });
  });
});
