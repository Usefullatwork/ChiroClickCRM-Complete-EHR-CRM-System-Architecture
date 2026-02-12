/**
 * Treatment Plans Service Tests
 * Tests plan creation, milestones, sessions, and progress calculation
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// Mock database module
const mockQuery = jest.fn();

jest.unstable_mockModule('../../src/config/database.js', () => ({
  query: mockQuery,
  getClient: jest.fn(),
  transaction: jest.fn(),
  savepoint: jest.fn(),
  healthCheck: jest.fn().mockResolvedValue(true),
  closePool: jest.fn(),
  setTenantContext: jest.fn(),
  clearTenantContext: jest.fn(),
  queryWithTenant: jest.fn(),
  pool: null,
  initPGlite: null,
  execSQL: null,
  default: { query: mockQuery },
}));

jest.unstable_mockModule('../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Dynamic import after mocks
let treatmentPlans;

beforeEach(async () => {
  jest.clearAllMocks();
  treatmentPlans = await import('../../src/services/treatmentPlans.js');
});

describe('Treatment Plans Service', () => {
  // =========================================================================
  // createPlan
  // =========================================================================
  describe('createPlan', () => {
    test('should create a plan with all required fields', async () => {
      const planId = 'plan-uuid-1';
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: planId,
            patient_id: 'patient-1',
            organization_id: 'org-1',
            practitioner_id: 'prac-1',
            title: 'Low Back Pain Rehab',
            status: 'active',
            total_sessions: 12,
            completed_sessions: 0,
            start_date: '2026-01-15',
          },
        ],
      });

      const result = await treatmentPlans.createPlan({
        patientId: 'patient-1',
        organizationId: 'org-1',
        practitionerId: 'prac-1',
        title: 'Low Back Pain Rehab',
        startDate: '2026-01-15',
        totalSessions: 12,
      });

      expect(result.id).toBe(planId);
      expect(result.title).toBe('Low Back Pain Rehab');
      expect(result.status).toBe('active');
      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(mockQuery.mock.calls[0][0]).toContain('INSERT INTO treatment_plans');
    });

    test('should throw on missing required fields', async () => {
      await expect(
        treatmentPlans.createPlan({
          patientId: 'patient-1',
          // missing organizationId, practitionerId, title, startDate
        })
      ).rejects.toThrow('Missing required fields');
    });

    test('should throw on missing title', async () => {
      await expect(
        treatmentPlans.createPlan({
          patientId: 'p',
          organizationId: 'o',
          practitionerId: 'pr',
          startDate: '2026-01-01',
          // missing title
        })
      ).rejects.toThrow('Missing required fields');
    });

    test('should store goals as JSON', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'plan-1', goals: '["Reduce pain","Improve mobility"]' }],
      });

      await treatmentPlans.createPlan({
        patientId: 'p',
        organizationId: 'o',
        practitionerId: 'pr',
        title: 'Test',
        startDate: '2026-01-01',
        goals: ['Reduce pain', 'Improve mobility'],
      });

      // Check that goals were JSON-stringified in the query params
      const params = mockQuery.mock.calls[0][1];
      expect(params).toContain('["Reduce pain","Improve mobility"]');
    });

    test('should default status to active', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'plan-1', status: 'active' }],
      });

      await treatmentPlans.createPlan({
        patientId: 'p',
        organizationId: 'o',
        practitionerId: 'pr',
        title: 'Test',
        startDate: '2026-01-01',
      });

      const params = mockQuery.mock.calls[0][1];
      expect(params).toContain('active');
    });
  });

  // =========================================================================
  // getPlan
  // =========================================================================
  describe('getPlan', () => {
    test('should return plan with milestones and sessions', async () => {
      // First query: plan
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'plan-1', title: 'Test Plan', status: 'active' }],
      });
      // Second query (Promise.all): milestones
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'ms-1', title: 'Week 4 review', status: 'pending' }],
      });
      // Third query (Promise.all): sessions
      mockQuery.mockResolvedValueOnce({
        rows: [
          { id: 's-1', session_number: 1, status: 'completed' },
          { id: 's-2', session_number: 2, status: 'scheduled' },
        ],
      });

      const result = await treatmentPlans.getPlan('plan-1', 'org-1');

      expect(result.title).toBe('Test Plan');
      expect(result.milestones).toHaveLength(1);
      expect(result.sessions).toHaveLength(2);
    });

    test('should return null for non-existent plan', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await treatmentPlans.getPlan('nonexistent', 'org-1');
      expect(result).toBeNull();
    });

    test('should filter by organization_id', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await treatmentPlans.getPlan('plan-1', 'org-1');

      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain('organization_id = $2');
      expect(params).toEqual(['plan-1', 'org-1']);
    });
  });

  // =========================================================================
  // getPatientPlans
  // =========================================================================
  describe('getPatientPlans', () => {
    test('should get all plans for a patient', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { id: 'plan-1', title: 'Plan A', status: 'active' },
          { id: 'plan-2', title: 'Plan B', status: 'completed' },
        ],
      });

      const result = await treatmentPlans.getPatientPlans('patient-1', 'org-1');

      expect(result).toHaveLength(2);
      expect(mockQuery.mock.calls[0][1]).toEqual(['patient-1', 'org-1']);
    });

    test('should filter by status when provided', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'plan-1', status: 'active' }] });

      await treatmentPlans.getPatientPlans('patient-1', 'org-1', 'active');

      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain('status = $3');
      expect(params).toEqual(['patient-1', 'org-1', 'active']);
    });

    test('should not filter by status when not provided', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await treatmentPlans.getPatientPlans('patient-1', 'org-1');

      const [sql] = mockQuery.mock.calls[0];
      expect(sql).not.toContain('status = $3');
    });
  });

  // =========================================================================
  // updatePlan
  // =========================================================================
  describe('updatePlan', () => {
    test('should update plan fields', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'plan-1', title: 'Updated Title', status: 'active' }],
      });

      const result = await treatmentPlans.updatePlan('plan-1', 'org-1', {
        title: 'Updated Title',
      });

      expect(result.title).toBe('Updated Title');
      const [sql] = mockQuery.mock.calls[0];
      expect(sql).toContain('title = $3');
      expect(sql).toContain('updated_at = NOW()');
    });

    test('should convert camelCase keys to snake_case', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'plan-1', total_sessions: 20 }],
      });

      await treatmentPlans.updatePlan('plan-1', 'org-1', {
        totalSessions: 20,
      });

      const [sql] = mockQuery.mock.calls[0];
      expect(sql).toContain('total_sessions');
    });

    test('should return null for non-existent plan', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await treatmentPlans.updatePlan('nonexistent', 'org-1', { title: 'X' });
      expect(result).toBeNull();
    });

    test('should throw on empty updates', async () => {
      await expect(treatmentPlans.updatePlan('plan-1', 'org-1', {})).rejects.toThrow(
        'No valid fields'
      );
    });

    test('should ignore unknown fields', async () => {
      await expect(
        treatmentPlans.updatePlan('plan-1', 'org-1', {
          unknownField: 'value',
        })
      ).rejects.toThrow('No valid fields');
    });

    test('should handle status changes', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'plan-1', status: 'completed' }],
      });

      await treatmentPlans.updatePlan('plan-1', 'org-1', { status: 'completed' });

      const params = mockQuery.mock.calls[0][1];
      expect(params).toContain('completed');
    });
  });

  // =========================================================================
  // addMilestone
  // =========================================================================
  describe('addMilestone', () => {
    test('should add a milestone to a plan', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'ms-1', plan_id: 'plan-1', title: 'ODI < 20%', status: 'pending' }],
      });

      const result = await treatmentPlans.addMilestone('plan-1', {
        title: 'ODI < 20%',
        targetDate: '2026-03-01',
        outcomeMeasure: 'ODI',
        targetScore: 20,
      });

      expect(result.title).toBe('ODI < 20%');
      expect(result.status).toBe('pending');
    });

    test('should throw on missing title', async () => {
      await expect(treatmentPlans.addMilestone('plan-1', {})).rejects.toThrow('title is required');
    });

    test('should accept milestone without optional fields', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'ms-1', title: 'Basic milestone' }],
      });

      const result = await treatmentPlans.addMilestone('plan-1', {
        title: 'Basic milestone',
      });

      expect(result.title).toBe('Basic milestone');
    });
  });

  // =========================================================================
  // updateMilestone
  // =========================================================================
  describe('updateMilestone', () => {
    test('should update milestone status', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'ms-1', status: 'achieved', completed_at: '2026-02-01' }],
      });

      const result = await treatmentPlans.updateMilestone('ms-1', { status: 'achieved' });

      expect(result.status).toBe('achieved');
      const [sql] = mockQuery.mock.calls[0];
      expect(sql).toContain('completed_at = NOW()');
    });

    test('should return null for non-existent milestone', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await treatmentPlans.updateMilestone('nonexistent', { status: 'achieved' });
      expect(result).toBeNull();
    });

    test('should throw on empty updates', async () => {
      await expect(treatmentPlans.updateMilestone('ms-1', {})).rejects.toThrow('No valid fields');
    });

    test('should update actual_score', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'ms-1', actual_score: 15.5 }],
      });

      await treatmentPlans.updateMilestone('ms-1', { actualScore: 15.5 });

      const [sql] = mockQuery.mock.calls[0];
      expect(sql).toContain('actual_score');
    });
  });

  // =========================================================================
  // addSession
  // =========================================================================
  describe('addSession', () => {
    test('should add a session to a plan', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 's-1', plan_id: 'plan-1', session_number: 1, status: 'scheduled' }],
      });

      const result = await treatmentPlans.addSession('plan-1', {
        sessionNumber: 1,
        scheduledDate: '2026-01-20',
      });

      expect(result.session_number).toBe(1);
      expect(result.status).toBe('scheduled');
    });

    test('should throw on missing session number', async () => {
      await expect(treatmentPlans.addSession('plan-1', {})).rejects.toThrow(
        'Session number is required'
      );
    });
  });

  // =========================================================================
  // completeSession
  // =========================================================================
  describe('completeSession', () => {
    test('should mark session as completed and increment plan count', async () => {
      // First query: update session
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 's-1', plan_id: 'plan-1', status: 'completed', completed_date: '2026-01-20' }],
      });
      // Second query: increment completed_sessions
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await treatmentPlans.completeSession('s-1', { encounterId: 'enc-1' });

      expect(result.status).toBe('completed');
      expect(mockQuery).toHaveBeenCalledTimes(2);

      const [sql2] = mockQuery.mock.calls[1];
      expect(sql2).toContain('completed_sessions = completed_sessions + 1');
    });

    test('should return null for non-existent session', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await treatmentPlans.completeSession('nonexistent');
      expect(result).toBeNull();
      // Should not attempt to update plan count
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    test('should work without encounter data', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 's-1', plan_id: 'plan-1', status: 'completed' }],
      });
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await treatmentPlans.completeSession('s-1');

      expect(result.status).toBe('completed');
    });
  });

  // =========================================================================
  // getPlanProgress
  // =========================================================================
  describe('getPlanProgress', () => {
    test('should calculate progress correctly', async () => {
      // Plan query
      mockQuery.mockResolvedValueOnce({
        rows: [{ total_sessions: 12, completed_sessions: 6, status: 'active' }],
      });
      // Milestones aggregation query
      mockQuery.mockResolvedValueOnce({
        rows: [{ total: '3', achieved: '1', missed: '0', pending: '1', in_progress: '1' }],
      });

      const result = await treatmentPlans.getPlanProgress('plan-1');

      expect(result.planStatus).toBe('active');
      expect(result.sessions.total).toBe(12);
      expect(result.sessions.completed).toBe(6);
      expect(result.sessions.percentage).toBe(50);
      expect(result.milestones.total).toBe(3);
      expect(result.milestones.achieved).toBe(1);
      expect(result.milestones.inProgress).toBe(1);
    });

    test('should return null for non-existent plan', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await treatmentPlans.getPlanProgress('nonexistent');
      expect(result).toBeNull();
    });

    test('should handle 0 total sessions', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ total_sessions: null, completed_sessions: 0, status: 'draft' }],
      });
      mockQuery.mockResolvedValueOnce({
        rows: [{ total: '0', achieved: '0', missed: '0', pending: '0', in_progress: '0' }],
      });

      const result = await treatmentPlans.getPlanProgress('plan-1');

      expect(result.sessions.percentage).toBe(0);
      expect(result.milestones.total).toBe(0);
    });

    test('should handle 100% completion', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ total_sessions: 8, completed_sessions: 8, status: 'completed' }],
      });
      mockQuery.mockResolvedValueOnce({
        rows: [{ total: '2', achieved: '2', missed: '0', pending: '0', in_progress: '0' }],
      });

      const result = await treatmentPlans.getPlanProgress('plan-1');

      expect(result.sessions.percentage).toBe(100);
      expect(result.milestones.achieved).toBe(2);
    });
  });
});
