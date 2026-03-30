/**
 * Unit Tests for Recall Engine Service
 * Tests recall rules, schedule calculation, treatment-plan recalls, patient scheduling, and batch processing
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

const mockCreateNotification = jest.fn();
jest.unstable_mockModule('../../../src/services/communication/notifications.js', () => ({
  createNotification: mockCreateNotification,
  default: { createNotification: mockCreateNotification },
}));

const mockExecuteAction = jest.fn();
jest.unstable_mockModule('../../../src/services/automations/actions.js', () => ({
  executeAction: mockExecuteAction,
  ACTION_TYPES: {
    SEND_BOOKING_LINK: 'SEND_BOOKING_LINK',
    SEND_SMS: 'SEND_SMS',
    SEND_EMAIL: 'SEND_EMAIL',
  },
  default: { executeAction: mockExecuteAction },
}));

// Import after mocking
const recallEngine = await import('../../../src/services/practice/recallEngine.js');

describe('Recall Engine Service', () => {
  const testOrgId = 'org-test-001';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =============================================================================
  // GET RECALL RULES
  // =============================================================================

  describe('getRecallRules', () => {
    it('should return default rules when no org overrides exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const rules = await recallEngine.getRecallRules(testOrgId);

      expect(rules).toBeDefined();
      expect(rules.acute_pain).toBeDefined();
      expect(rules.acute_pain.intervals).toEqual([14, 42]);
      expect(rules.chronic_pain.intervals).toEqual([90, 180, 365]);
      expect(rules.maintenance.intervals).toEqual([28, 56]);
    });

    it('should merge org overrides on top of defaults', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            setting_value: JSON.stringify({
              acute_pain: { label: 'Custom Acute', intervals: [7, 21], description: 'Custom' },
            }),
          },
        ],
      });

      const rules = await recallEngine.getRecallRules(testOrgId);

      // Overridden
      expect(rules.acute_pain.label).toBe('Custom Acute');
      expect(rules.acute_pain.intervals).toEqual([7, 21]);
      // Defaults preserved
      expect(rules.chronic_pain).toBeDefined();
      expect(rules.maintenance).toBeDefined();
    });

    it('should handle setting_value as object (not string)', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            setting_value: {
              vestibular: {
                label: 'Custom Vestibular',
                intervals: [10, 30],
                description: 'Custom',
              },
            },
          },
        ],
      });

      const rules = await recallEngine.getRecallRules(testOrgId);

      expect(rules.vestibular.label).toBe('Custom Vestibular');
      expect(rules.vestibular.intervals).toEqual([10, 30]);
    });

    it('should return defaults when table does not exist', async () => {
      mockQuery.mockRejectedValueOnce(new Error('relation "organization_settings" does not exist'));

      const rules = await recallEngine.getRecallRules(testOrgId);

      expect(rules).toBeDefined();
      expect(rules.acute_pain).toBeDefined();
    });

    it('should return defaults on generic database error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Connection refused'));

      const rules = await recallEngine.getRecallRules(testOrgId);

      expect(rules).toBeDefined();
      expect(rules.chronic_pain).toBeDefined();
    });
  });

  // =============================================================================
  // UPDATE RECALL RULES
  // =============================================================================

  describe('updateRecallRules', () => {
    it('should upsert rules and return merged result', async () => {
      // First call: the INSERT/UPSERT
      mockQuery.mockResolvedValueOnce({ rows: [] });
      // Second call: getRecallRules re-fetches
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            setting_value: JSON.stringify({
              acute_pain: { label: 'Updated', intervals: [10, 30], description: 'Updated rule' },
            }),
          },
        ],
      });

      const newRules = {
        acute_pain: { label: 'Updated', intervals: [10, 30], description: 'Updated rule' },
      };

      const result = await recallEngine.updateRecallRules(testOrgId, newRules);

      expect(result.acute_pain.label).toBe('Updated');
      expect(result.chronic_pain).toBeDefined();
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    it('should return merged defaults when table does not exist', async () => {
      mockQuery.mockRejectedValueOnce(new Error('relation "organization_settings" does not exist'));

      const newRules = { custom: { label: 'Test', intervals: [5], description: 'Test' } };
      const result = await recallEngine.updateRecallRules(testOrgId, newRules);

      expect(result.custom).toBeDefined();
      expect(result.acute_pain).toBeDefined();
    });

    it('should throw on non-table-missing errors', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Disk full'));

      await expect(recallEngine.updateRecallRules(testOrgId, { test: {} })).rejects.toThrow(
        'Disk full'
      );
    });
  });

  // =============================================================================
  // GET RECALL SCHEDULE
  // =============================================================================

  describe('getRecallSchedule', () => {
    it('should calculate upcoming recalls from treatment plans', async () => {
      // Treatment plans query
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'tp-1',
            diagnosis: 'Lower back pain',
            category: 'acute_pain',
            status: 'ACTIVE',
            start_date: '2026-01-01',
            end_date: '2026-02-01',
          },
        ],
      });
      // Follow-ups query
      mockQuery.mockResolvedValueOnce({ rows: [] });
      // getRecallRules query (inside getRecallSchedule)
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await recallEngine.getRecallSchedule(testOrgId, 'pat-1');

      expect(result.patientId).toBe('pat-1');
      expect(result.plans).toHaveLength(1);
      expect(result.upcomingRecalls.length).toBeGreaterThan(0);
      // acute_pain has intervals [14, 42], so 2 recall entries from end_date
      expect(result.upcomingRecalls).toHaveLength(2);
      expect(result.upcomingRecalls[0].category).toBe('acute_pain');
    });

    it('should mark existing follow-ups within 3-day window', async () => {
      // The plan end_date + 14 days = 2026-02-15
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'tp-1',
            diagnosis: 'Back pain',
            category: 'acute_pain',
            start_date: '2026-01-01',
            end_date: '2026-02-01',
          },
        ],
      });
      // Existing follow-up on 2026-02-15 (exact match for 14-day interval)
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'fu-existing',
            follow_up_type: 'RECALL',
            reason: 'Recall',
            due_date: '2026-02-15',
            status: 'PENDING',
            created_at: '2026-01-15',
          },
        ],
      });
      // getRecallRules
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await recallEngine.getRecallSchedule(testOrgId, 'pat-1');

      const matchedRecall = result.upcomingRecalls.find((r) => r.intervalDays === 14);
      expect(matchedRecall.hasFollowUp).toBe(true);
      expect(matchedRecall.followUpId).toBe('fu-existing');
      expect(matchedRecall.followUpStatus).toBe('PENDING');
    });

    it('should use start_date when end_date is null', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'tp-1',
            diagnosis: 'Ongoing',
            category: 'chronic_pain',
            start_date: '2026-03-01',
            end_date: null,
          },
        ],
      });
      mockQuery.mockResolvedValueOnce({ rows: [] });
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await recallEngine.getRecallSchedule(testOrgId, 'pat-1');

      expect(result.upcomingRecalls.length).toBeGreaterThan(0);
      // chronic_pain intervals: [90, 180, 365]
      expect(result.upcomingRecalls).toHaveLength(3);
    });

    it('should default to chronic_pain when category is null', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'tp-1',
            diagnosis: 'Unknown',
            category: null,
            start_date: '2026-03-01',
            end_date: null,
          },
        ],
      });
      mockQuery.mockResolvedValueOnce({ rows: [] });
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await recallEngine.getRecallSchedule(testOrgId, 'pat-1');

      // Should use chronic_pain intervals [90, 180, 365]
      expect(result.upcomingRecalls).toHaveLength(3);
      expect(result.upcomingRecalls[0].category).toBe('chronic_pain');
    });

    it('should return empty when tables do not exist', async () => {
      mockQuery.mockRejectedValueOnce(new Error('relation "treatment_plans" does not exist'));

      const result = await recallEngine.getRecallSchedule(testOrgId, 'pat-1');

      expect(result.plans).toEqual([]);
      expect(result.existingFollowUps).toEqual([]);
      expect(result.upcomingRecalls).toEqual([]);
    });
  });

  // =============================================================================
  // CREATE RECALL FROM TREATMENT PLAN
  // =============================================================================

  describe('createRecallFromTreatmentPlan', () => {
    it('should create recall follow-ups for each interval in the rule', async () => {
      // Fetch plan
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'tp-1',
            patient_id: 'pat-1',
            diagnosis: 'Acute back pain',
            category: 'acute_pain',
            end_date: '2026-03-01',
            first_name: 'Ola',
            last_name: 'Nordmann',
          },
        ],
      });
      // getRecallRules
      mockQuery.mockResolvedValueOnce({ rows: [] });
      // Two inserts (acute_pain has [14, 42])
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: 'fu-recall-1', follow_up_type: 'RECALL' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'fu-recall-2', follow_up_type: 'RECALL' }] });

      const result = await recallEngine.createRecallFromTreatmentPlan(testOrgId, 'tp-1');

      expect(result).toHaveLength(2);
      expect(result[0].follow_up_type).toBe('RECALL');
    });

    it('should return empty array when plan not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await recallEngine.createRecallFromTreatmentPlan(testOrgId, 'non-existent');

      expect(result).toEqual([]);
    });

    it('should return empty array for unknown category rule', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'tp-1',
            patient_id: 'pat-1',
            category: 'unknown_category',
            first_name: 'Ola',
            last_name: 'Nordmann',
          },
        ],
      });
      // getRecallRules returns defaults (no 'unknown_category')
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await recallEngine.createRecallFromTreatmentPlan(testOrgId, 'tp-1');

      expect(result).toEqual([]);
    });

    it('should handle table-not-found gracefully', async () => {
      mockQuery.mockRejectedValueOnce(new Error('relation "treatment_plans" does not exist'));

      const result = await recallEngine.createRecallFromTreatmentPlan(testOrgId, 'tp-1');

      expect(result).toEqual([]);
    });
  });

  // =============================================================================
  // SCHEDULE PATIENT RECALL
  // =============================================================================

  describe('schedulePatientRecall', () => {
    it('should create follow-ups for each interval in the category', async () => {
      // getRecallRules
      mockQuery.mockResolvedValueOnce({ rows: [] });
      // maintenance has [28, 56] → 2 inserts
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: 'fu-1', follow_up_type: 'RECALL' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'fu-2', follow_up_type: 'RECALL' }] });

      const result = await recallEngine.schedulePatientRecall(testOrgId, 'pat-1', 'maintenance');

      expect(result).toHaveLength(2);
      expect(mockQuery).toHaveBeenCalledTimes(3); // 1 rules + 2 inserts
    });

    it('should use custom start date when provided', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      // vestibular has [7, 21, 60]
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: 'fu-1' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'fu-2' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'fu-3' }] });

      const result = await recallEngine.schedulePatientRecall(
        testOrgId,
        'pat-1',
        'vestibular',
        '2026-04-01'
      );

      expect(result).toHaveLength(3);
    });

    it('should throw for unknown recall category', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(
        recallEngine.schedulePatientRecall(testOrgId, 'pat-1', 'nonexistent_category')
      ).rejects.toThrow('Unknown recall category: nonexistent_category');
    });
  });

  // =============================================================================
  // PROCESS RECALLS (CRON JOB)
  // =============================================================================

  describe('processRecalls', () => {
    it('should process due recalls and create notifications', async () => {
      // Due recalls query
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'fu-1',
            organization_id: testOrgId,
            patient_id: 'pat-1',
            reason: 'Recall: Akutt smerte (14 dager)',
            due_date: '2026-03-25',
            first_name: 'Ola',
            last_name: 'Nordmann',
            phone: '+4712345678',
            email: 'ola@test.no',
            preferred_therapist_id: 'user-1',
          },
        ],
      });

      mockCreateNotification.mockResolvedValueOnce({});

      // Org settings query (booking link enabled)
      mockQuery.mockResolvedValueOnce({
        rows: [{ enabled: 'true' }],
      });

      // Patient communication preferences (not opted out)
      mockQuery.mockResolvedValueOnce({
        rows: [{ recall_enabled: true }],
      });

      mockExecuteAction.mockResolvedValueOnce({});

      const result = await recallEngine.processRecalls();

      expect(result.total).toBe(1);
      expect(result.notified).toBe(1);
      expect(result.bookingSent).toBe(1);
      expect(result.errors).toBe(0);
      expect(mockCreateNotification).toHaveBeenCalledTimes(1);
      expect(mockExecuteAction).toHaveBeenCalledTimes(1);
    });

    it('should skip notification when no preferred therapist', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'fu-1',
            organization_id: testOrgId,
            patient_id: 'pat-1',
            reason: 'Recall test',
            due_date: '2026-03-25',
            first_name: 'Kari',
            last_name: 'Nordmann',
            phone: '+4712345678',
            email: null,
            preferred_therapist_id: null,
          },
        ],
      });

      // Org settings
      mockQuery.mockResolvedValueOnce({ rows: [{ enabled: 'true' }] });
      // Patient prefs
      mockQuery.mockResolvedValueOnce({ rows: [] });

      mockExecuteAction.mockResolvedValueOnce({});

      const result = await recallEngine.processRecalls();

      expect(result.notified).toBe(0);
      expect(mockCreateNotification).not.toHaveBeenCalled();
    });

    it('should skip booking link when patient opted out', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'fu-1',
            organization_id: testOrgId,
            patient_id: 'pat-1',
            reason: 'Recall test',
            due_date: '2026-03-25',
            first_name: 'Per',
            last_name: 'Hansen',
            phone: '+4712345678',
            email: 'per@test.no',
            preferred_therapist_id: 'user-1',
          },
        ],
      });

      mockCreateNotification.mockResolvedValueOnce({});

      // Org settings: booking enabled
      mockQuery.mockResolvedValueOnce({ rows: [{ enabled: 'true' }] });
      // Patient opted out
      mockQuery.mockResolvedValueOnce({ rows: [{ recall_enabled: false }] });

      const result = await recallEngine.processRecalls();

      expect(result.notified).toBe(1);
      expect(result.bookingSent).toBe(0);
      expect(mockExecuteAction).not.toHaveBeenCalled();
    });

    it('should skip booking link when org has it disabled', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'fu-1',
            organization_id: testOrgId,
            patient_id: 'pat-1',
            reason: 'Recall test',
            due_date: '2026-03-25',
            first_name: 'Lise',
            last_name: 'Berg',
            phone: '+4712345678',
            email: 'lise@test.no',
            preferred_therapist_id: 'user-1',
          },
        ],
      });

      mockCreateNotification.mockResolvedValueOnce({});

      // Org settings: booking disabled
      mockQuery.mockResolvedValueOnce({ rows: [{ enabled: 'false' }] });

      const result = await recallEngine.processRecalls();

      expect(result.bookingSent).toBe(0);
      expect(mockExecuteAction).not.toHaveBeenCalled();
    });

    it('should return zero totals when no due recalls', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await recallEngine.processRecalls();

      expect(result.total).toBe(0);
      expect(result.notified).toBe(0);
      expect(result.bookingSent).toBe(0);
      expect(result.errors).toBe(0);
    });

    it('should handle table-not-found gracefully', async () => {
      mockQuery.mockRejectedValueOnce(new Error('relation "follow_ups" does not exist'));

      const result = await recallEngine.processRecalls();

      expect(result.total).toBe(0);
      expect(result.skipped).toBe(true);
    });

    it('should count errors when notification fails', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'fu-1',
            organization_id: testOrgId,
            patient_id: 'pat-1',
            reason: 'Recall',
            due_date: '2026-03-25',
            first_name: 'Ola',
            last_name: 'Nordmann',
            phone: '+4712345678',
            email: null,
            preferred_therapist_id: 'user-1',
          },
        ],
      });

      mockCreateNotification.mockRejectedValueOnce(new Error('Notification service down'));

      // Org settings
      mockQuery.mockResolvedValueOnce({ rows: [{ enabled: 'true' }] });
      // Patient prefs
      mockQuery.mockResolvedValueOnce({ rows: [] });

      mockExecuteAction.mockResolvedValueOnce({});

      const result = await recallEngine.processRecalls();

      expect(result.errors).toBe(1);
      expect(result.notified).toBe(0);
    });
  });
});
