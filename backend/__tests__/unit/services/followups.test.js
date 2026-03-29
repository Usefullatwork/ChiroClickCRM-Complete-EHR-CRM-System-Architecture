/**
 * Unit Tests for Follow-ups Service
 * Tests follow-up CRUD, completion, skipping, overdue/upcoming queries, stats, and auto-creation
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
const followupsService = await import('../../../src/services/practice/followups.js');

describe('Follow-ups Service', () => {
  const testOrgId = 'org-test-001';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =============================================================================
  // GET ALL FOLLOW-UPS
  // =============================================================================

  describe('getAllFollowUps', () => {
    it('should return paginated follow-ups with defaults', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '5' }] }).mockResolvedValueOnce({
        rows: [
          { id: 'fu-1', status: 'PENDING', patient_name: 'Ola Nordmann' },
          { id: 'fu-2', status: 'PENDING', patient_name: 'Kari Nordmann' },
          { id: 'fu-3', status: 'COMPLETED', patient_name: 'Per Hansen' },
          { id: 'fu-4', status: 'PENDING', patient_name: 'Lise Berg' },
          { id: 'fu-5', status: 'CANCELLED', patient_name: 'Erik Dahl' },
        ],
      });

      const result = await followupsService.getAllFollowUps(testOrgId);

      expect(result.followUps).toHaveLength(5);
      expect(result.pagination.total).toBe(5);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(50);
      expect(result.pagination.pages).toBe(1);
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    it('should apply patient filter', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '1' }] }).mockResolvedValueOnce({
        rows: [{ id: 'fu-1', patient_id: 'pat-1', patient_name: 'Ola Nordmann' }],
      });

      const result = await followupsService.getAllFollowUps(testOrgId, { patientId: 'pat-1' });

      expect(result.followUps).toHaveLength(1);
      const countParams = mockQuery.mock.calls[0][1];
      expect(countParams).toContain('pat-1');
    });

    it('should apply status and priority filters', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '2' }] }).mockResolvedValueOnce({
        rows: [{ id: 'fu-1' }, { id: 'fu-2' }],
      });

      await followupsService.getAllFollowUps(testOrgId, {
        status: 'PENDING',
        priority: 'HIGH',
      });

      const countParams = mockQuery.mock.calls[0][1];
      expect(countParams).toContain('PENDING');
      expect(countParams).toContain('HIGH');
    });

    it('should apply due date filter', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({ rows: [] });

      await followupsService.getAllFollowUps(testOrgId, { dueDate: '2026-04-01' });

      const countParams = mockQuery.mock.calls[0][1];
      expect(countParams).toContain('2026-04-01');
    });

    it('should handle empty result', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await followupsService.getAllFollowUps(testOrgId);

      expect(result.followUps).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.pages).toBe(0);
    });
  });

  // =============================================================================
  // GET FOLLOW-UP BY ID
  // =============================================================================

  describe('getFollowUpById', () => {
    it('should return follow-up with patient and assignee details', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'fu-123',
            organization_id: testOrgId,
            patient_id: 'pat-1',
            patient_name: 'Ola Nordmann',
            assigned_to_name: 'Dr. Hansen',
            status: 'PENDING',
            due_date: '2026-04-01',
          },
        ],
      });

      const result = await followupsService.getFollowUpById(testOrgId, 'fu-123');

      expect(result).toBeDefined();
      expect(result.id).toBe('fu-123');
      expect(result.patient_name).toBe('Ola Nordmann');
      expect(result.assigned_to_name).toBe('Dr. Hansen');
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('should return null for non-existent follow-up', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await followupsService.getFollowUpById(testOrgId, 'non-existent');

      expect(result).toBeNull();
    });
  });

  // =============================================================================
  // CREATE FOLLOW-UP
  // =============================================================================

  describe('createFollowUp', () => {
    it('should create a follow-up with all required fields', async () => {
      const newFollowUp = {
        id: 'fu-new',
        organization_id: testOrgId,
        patient_id: 'pat-1',
        follow_up_type: 'APPOINTMENT',
        reason: 'Post-treatment check',
        due_date: '2026-04-15',
        priority: 'MEDIUM',
        status: 'PENDING',
      };

      mockQuery.mockResolvedValueOnce({ rows: [newFollowUp] });

      const result = await followupsService.createFollowUp(testOrgId, {
        patient_id: 'pat-1',
        follow_up_type: 'APPOINTMENT',
        reason: 'Post-treatment check',
        due_date: '2026-04-15',
      });

      expect(result).toBeDefined();
      expect(result.id).toBe('fu-new');
      expect(result.status).toBe('PENDING');
      expect(result.priority).toBe('MEDIUM');
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('should use default priority MEDIUM when not specified', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'fu-1', priority: 'MEDIUM' }],
      });

      await followupsService.createFollowUp(testOrgId, {
        patient_id: 'pat-1',
        follow_up_type: 'PHONE_CALL',
        reason: 'Check progress',
        due_date: '2026-04-10',
      });

      const queryParams = mockQuery.mock.calls[0][1];
      // priority is the 7th param (index 6)
      expect(queryParams[6]).toBe('MEDIUM');
    });

    it('should accept optional encounter_id and assigned_to', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'fu-2',
            encounter_id: 'enc-1',
            assigned_to: 'user-1',
            priority: 'HIGH',
          },
        ],
      });

      const result = await followupsService.createFollowUp(testOrgId, {
        patient_id: 'pat-1',
        encounter_id: 'enc-1',
        follow_up_type: 'APPOINTMENT',
        reason: 'Urgent recheck',
        due_date: '2026-04-05',
        priority: 'HIGH',
        assigned_to: 'user-1',
      });

      expect(result.encounter_id).toBe('enc-1');
      expect(result.assigned_to).toBe('user-1');
      expect(result.priority).toBe('HIGH');
    });

    it('should throw on database error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Insert failed'));

      await expect(
        followupsService.createFollowUp(testOrgId, {
          patient_id: 'pat-1',
          follow_up_type: 'APPOINTMENT',
          reason: 'Test',
          due_date: '2026-04-15',
        })
      ).rejects.toThrow('Insert failed');
    });
  });

  // =============================================================================
  // UPDATE FOLLOW-UP
  // =============================================================================

  describe('updateFollowUp', () => {
    it('should update allowed fields', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'fu-123',
            priority: 'HIGH',
            notes: 'Updated notes',
            status: 'PENDING',
          },
        ],
      });

      const result = await followupsService.updateFollowUp(testOrgId, 'fu-123', {
        priority: 'HIGH',
        notes: 'Updated notes',
      });

      expect(result).toBeDefined();
      expect(result.priority).toBe('HIGH');
      expect(result.notes).toBe('Updated notes');
    });

    it('should throw when no fields to update', async () => {
      await expect(followupsService.updateFollowUp(testOrgId, 'fu-123', {})).rejects.toThrow(
        'No fields to update'
      );
    });

    it('should throw for non-existent follow-up', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(
        followupsService.updateFollowUp(testOrgId, 'non-existent', {
          priority: 'HIGH',
        })
      ).rejects.toThrow('Follow-up not found');
    });

    it('should set completed_at when status is COMPLETED', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'fu-123', status: 'COMPLETED', completed_at: '2026-03-27' }],
      });

      await followupsService.updateFollowUp(testOrgId, 'fu-123', {
        status: 'COMPLETED',
      });

      const queryStr = mockQuery.mock.calls[0][0];
      expect(queryStr).toContain('completed_at = NOW()');
    });
  });

  // =============================================================================
  // COMPLETE FOLLOW-UP
  // =============================================================================

  describe('completeFollowUp', () => {
    it('should complete a follow-up with notes', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'fu-123',
            status: 'COMPLETED',
            completed_at: '2026-03-27T10:00:00Z',
          },
        ],
      });

      const result = await followupsService.completeFollowUp(
        testOrgId,
        'fu-123',
        'Patient responded well'
      );

      expect(result).toBeDefined();
      expect(result.status).toBe('COMPLETED');
      expect(mockQuery).toHaveBeenCalledWith(expect.any(String), [
        'fu-123',
        testOrgId,
        'Patient responded well',
      ]);
    });

    it('should complete without notes', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'fu-123', status: 'COMPLETED' }],
      });

      const result = await followupsService.completeFollowUp(testOrgId, 'fu-123');

      expect(result.status).toBe('COMPLETED');
      expect(mockQuery).toHaveBeenCalledWith(expect.any(String), ['fu-123', testOrgId, '']);
    });

    it('should throw for non-existent follow-up', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(followupsService.completeFollowUp(testOrgId, 'non-existent')).rejects.toThrow(
        'Follow-up not found'
      );
    });
  });

  // =============================================================================
  // SKIP FOLLOW-UP
  // =============================================================================

  describe('skipFollowUp', () => {
    it('should skip a follow-up with reason', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'fu-123', status: 'SKIPPED' }],
      });

      const result = await followupsService.skipFollowUp(testOrgId, 'fu-123', 'Patient cancelled');

      expect(result.status).toBe('SKIPPED');
      expect(mockQuery).toHaveBeenCalledWith(expect.any(String), [
        'fu-123',
        testOrgId,
        'Patient cancelled',
      ]);
    });

    it('should throw for non-existent follow-up', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(
        followupsService.skipFollowUp(testOrgId, 'non-existent', 'Test')
      ).rejects.toThrow('Follow-up not found');
    });
  });

  // =============================================================================
  // OVERDUE & UPCOMING
  // =============================================================================

  describe('getOverdueFollowUps', () => {
    it('should return overdue follow-ups', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { id: 'fu-1', due_date: '2026-03-20', patient_name: 'Ola Nordmann' },
          { id: 'fu-2', due_date: '2026-03-15', patient_name: 'Kari Nordmann' },
        ],
      });

      const result = await followupsService.getOverdueFollowUps(testOrgId);

      expect(result).toHaveLength(2);
      expect(mockQuery).toHaveBeenCalledWith(expect.any(String), [testOrgId]);
    });

    it('should return empty array when no overdue', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await followupsService.getOverdueFollowUps(testOrgId);

      expect(result).toHaveLength(0);
    });
  });

  describe('getUpcomingFollowUps', () => {
    it('should return upcoming follow-ups with default 7 days', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'fu-1', due_date: '2026-03-30' }],
      });

      const result = await followupsService.getUpcomingFollowUps(testOrgId);

      expect(result).toHaveLength(1);
      expect(mockQuery).toHaveBeenCalledWith(expect.any(String), [testOrgId, 7]);
    });

    it('should accept custom days parameter', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await followupsService.getUpcomingFollowUps(testOrgId, 14);

      expect(mockQuery).toHaveBeenCalledWith(expect.any(String), [testOrgId, 14]);
    });
  });

  // =============================================================================
  // FOLLOW-UP STATS
  // =============================================================================

  describe('getFollowUpStats', () => {
    it('should return follow-up statistics', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            pending_count: '10',
            completed_count: '25',
            cancelled_count: '3',
            overdue_count: '2',
            upcoming_count: '5',
            high_priority_count: '4',
            avg_completion_days: '3.50',
          },
        ],
      });

      const result = await followupsService.getFollowUpStats(testOrgId);

      expect(result.pending_count).toBe('10');
      expect(result.completed_count).toBe('25');
      expect(result.overdue_count).toBe('2');
      expect(result.avg_completion_days).toBe('3.50');
    });
  });

  // =============================================================================
  // PATIENTS NEEDING FOLLOW-UP
  // =============================================================================

  describe('getPatientsNeedingFollowUp', () => {
    it('should return patients with upcoming follow-up dates', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'pat-1',
            first_name: 'Ola',
            last_name: 'Nordmann',
            follow_up_date: '2026-03-28',
            main_problem: 'Lower back pain',
          },
        ],
      });

      const result = await followupsService.getPatientsNeedingFollowUp(testOrgId);

      expect(result).toHaveLength(1);
      expect(result[0].first_name).toBe('Ola');
      expect(result[0].main_problem).toBe('Lower back pain');
    });
  });

  // =============================================================================
  // MARK PATIENT AS CONTACTED
  // =============================================================================

  describe('markPatientAsContacted', () => {
    it('should clear follow-up flags for the patient', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'pat-1',
            should_be_followed_up: null,
            needs_feedback: false,
          },
        ],
      });

      const result = await followupsService.markPatientAsContacted(testOrgId, 'pat-1', 'SMS');

      expect(result).toBeDefined();
      expect(result.should_be_followed_up).toBeNull();
      expect(result.needs_feedback).toBe(false);
    });

    it('should throw for non-existent patient', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(
        followupsService.markPatientAsContacted(testOrgId, 'non-existent')
      ).rejects.toThrow('Patient not found');
    });
  });

  // =============================================================================
  // AUTO-CREATE FOLLOW-UPS
  // =============================================================================

  describe('autoCreateFollowUps', () => {
    it('should create follow-up when plan contains "1 week"', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'fu-auto-1',
            follow_up_type: 'APPOINTMENT',
            reason: 'Scheduled 1 week follow-up',
            priority: 'MEDIUM',
            status: 'PENDING',
          },
        ],
      });

      const plan = { follow_up: 'Re-evaluate in 1 week' };
      const result = await followupsService.autoCreateFollowUps(testOrgId, 'enc-1', 'pat-1', plan);

      expect(result).toHaveLength(1);
      expect(result[0].reason).toBe('Scheduled 1 week follow-up');
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('should create follow-up for Norwegian "uke" keyword', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'fu-auto-2',
            reason: 'Scheduled 2 week follow-up',
            status: 'PENDING',
          },
        ],
      });

      const plan = { follow_up: 'Kontroll om 2 uker' };
      const result = await followupsService.autoCreateFollowUps(testOrgId, 'enc-1', 'pat-1', plan);

      expect(result).toHaveLength(1);
      expect(result[0].reason).toBe('Scheduled 2 week follow-up');
    });

    it('should create multiple follow-ups for multiple timeframes', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ id: 'fu-1', reason: 'Scheduled 1 week follow-up' }],
        })
        .mockResolvedValueOnce({
          rows: [{ id: 'fu-2', reason: 'Scheduled 1 month follow-up' }],
        });

      const plan = { follow_up: '1 week check then 1 month re-evaluation' };
      const result = await followupsService.autoCreateFollowUps(testOrgId, 'enc-1', 'pat-1', plan);

      expect(result).toHaveLength(2);
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    it('should return empty array when plan has no follow-up keywords', async () => {
      const plan = { follow_up: 'Continue as needed' };
      const result = await followupsService.autoCreateFollowUps(testOrgId, 'enc-1', 'pat-1', plan);

      expect(result).toHaveLength(0);
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('should return empty array when follow_up field is missing', async () => {
      const plan = {};
      const result = await followupsService.autoCreateFollowUps(testOrgId, 'enc-1', 'pat-1', plan);

      expect(result).toHaveLength(0);
    });
  });
});
