/**
 * Unit Tests for Automation Triggers & Auto-Accept Services
 * Tests: trigger evaluation, condition matching, auto-accept logic, scheduling rules
 */

import { jest } from '@jest/globals';

// ============================================================================
// MOCKS — declared before imports (resetMocks: true means re-assign in factory)
// ============================================================================

const mockQuery = jest.fn();
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
  default: {
    query: mockQuery,
    transaction: {
      start: mockTransactionStart,
      commit: mockTransactionCommit,
      rollback: mockTransactionRollback,
    },
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

const mockTriggerWorkflow = jest.fn();
const MOCK_TRIGGER_TYPES = {
  PATIENT_CREATED: 'PATIENT_CREATED',
  APPOINTMENT_SCHEDULED: 'APPOINTMENT_SCHEDULED',
  APPOINTMENT_COMPLETED: 'APPOINTMENT_COMPLETED',
  APPOINTMENT_MISSED: 'APPOINTMENT_MISSED',
  APPOINTMENT_CANCELLED: 'APPOINTMENT_CANCELLED',
  ENCOUNTER_CREATED: 'ENCOUNTER_CREATED',
  ENCOUNTER_SIGNED: 'ENCOUNTER_SIGNED',
  DAYS_SINCE_VISIT: 'DAYS_SINCE_VISIT',
  BIRTHDAY: 'BIRTHDAY',
  LIFECYCLE_CHANGE: 'LIFECYCLE_CHANGE',
  CUSTOM: 'CUSTOM',
};

jest.unstable_mockModule('../../../src/services/automations/index.js', () => ({
  triggerWorkflow: mockTriggerWorkflow,
  TRIGGER_TYPES: MOCK_TRIGGER_TYPES,
  evaluateTrigger: jest.fn(),
  evaluateConditions: jest.fn(),
  OPERATORS: {},
  ACTION_TYPES: {},
  executeActions: jest.fn(),
  getWorkflows: jest.fn(),
  getWorkflowById: jest.fn(),
  createWorkflow: jest.fn(),
  updateWorkflow: jest.fn(),
  deleteWorkflow: jest.fn(),
  toggleWorkflow: jest.fn(),
  getWorkflowExecutions: jest.fn(),
  processAutomations: jest.fn(),
  executeWorkflow: jest.fn(),
  testWorkflow: jest.fn(),
  checkAppointmentReminders: jest.fn(),
}));

const mockSendEmail = jest.fn();
jest.unstable_mockModule('../../../src/services/communication/email.js', () => ({
  sendEmail: mockSendEmail,
}));

// ============================================================================
// IMPORTS (after mocks)
// ============================================================================

const {
  processTimeTriggers,
  checkDaysSinceVisitTriggers,
  getPatientsNeedingRecall,
  checkBirthdayTriggers,
  getUpcomingBirthdays,
  checkAppointmentTriggers,
  getAppointmentsNeedingFollowUp,
  checkPatientCreatedTrigger,
  checkLifecycleChangeTrigger,
  getTriggerStats,
  getUpcomingTriggers,
} = await import('../../../src/services/practice/automationTriggers.js');

const {
  getSettings,
  upsertSettings,
  shouldAutoAcceptAppointment,
  autoAcceptAppointment,
  processPendingAppointments,
  shouldAutoAcceptReferral,
  autoAcceptReferral,
  processPendingReferrals,
  getAutoAcceptLog,
} = await import('../../../src/services/practice/autoAccept.js');

// ============================================================================
// AUTOMATION TRIGGERS
// ============================================================================

describe('Automation Triggers Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // processTimeTriggers
  // --------------------------------------------------------------------------
  describe('processTimeTriggers', () => {
    it('should aggregate results from days-since-visit and birthday checks', async () => {
      // checkDaysSinceVisitTriggers: no active workflows
      mockQuery.mockResolvedValueOnce({ rows: [] });
      // checkBirthdayTriggers: no active workflows
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await processTimeTriggers('org-1');

      expect(result.total).toBe(0);
      expect(result.daysSinceVisit).toEqual({
        processed: 0,
        message: 'No active DAYS_SINCE_VISIT workflows',
      });
      expect(result.birthday).toEqual({
        processed: 0,
        message: 'No active BIRTHDAY workflows',
      });
    });

    it('should work without organizationId (global processing)', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await processTimeTriggers();
      expect(result.total).toBe(0);
    });
  });

  // --------------------------------------------------------------------------
  // checkDaysSinceVisitTriggers
  // --------------------------------------------------------------------------
  describe('checkDaysSinceVisitTriggers', () => {
    it('should return early when no active workflows exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await checkDaysSinceVisitTriggers('org-1');
      expect(result.processed).toBe(0);
      expect(result.message).toContain('No active');
    });

    it('should trigger workflow for each matching patient', async () => {
      // Active workflow
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'wf-1',
            organization_id: 'org-1',
            trigger_type: 'DAYS_SINCE_VISIT',
            trigger_config: { days: 30 },
            max_runs_per_patient: 1,
            is_active: true,
          },
        ],
      });
      // Matching patients
      mockQuery.mockResolvedValueOnce({
        rows: [
          { id: 'pat-1', days_since_visit: '45' },
          { id: 'pat-2', days_since_visit: '60' },
        ],
      });

      mockTriggerWorkflow.mockResolvedValue({ triggered: 1 });

      const result = await checkDaysSinceVisitTriggers('org-1');

      expect(result.processed).toBe(2);
      expect(mockTriggerWorkflow).toHaveBeenCalledTimes(2);
      expect(mockTriggerWorkflow).toHaveBeenCalledWith(
        'org-1',
        'DAYS_SINCE_VISIT',
        expect.objectContaining({ patient_id: 'pat-1', days_since_visit: 45 })
      );
    });

    it('should continue processing other patients when one trigger fails', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'wf-1',
            organization_id: 'org-1',
            trigger_config: {},
            max_runs_per_patient: 1,
            is_active: true,
          },
        ],
      });
      mockQuery.mockResolvedValueOnce({
        rows: [
          { id: 'pat-1', days_since_visit: '50' },
          { id: 'pat-2', days_since_visit: '55' },
        ],
      });

      mockTriggerWorkflow
        .mockRejectedValueOnce(new Error('trigger failed'))
        .mockResolvedValueOnce({ triggered: 1 });

      const result = await checkDaysSinceVisitTriggers('org-1');
      // Only the second one succeeds
      expect(result.processed).toBe(1);
    });

    it('should use default 42 days when trigger_config has no days', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'wf-1',
            organization_id: 'org-1',
            trigger_config: {},
            max_runs_per_patient: 1,
            is_active: true,
          },
        ],
      });
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await checkDaysSinceVisitTriggers('org-1');

      // Second query should receive 42 as the days threshold (param index 1)
      const secondCall = mockQuery.mock.calls[1];
      expect(secondCall[1][1]).toBe(42);
    });
  });

  // --------------------------------------------------------------------------
  // getPatientsNeedingRecall
  // --------------------------------------------------------------------------
  describe('getPatientsNeedingRecall', () => {
    it('should return patient rows with default options', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'pat-1', first_name: 'Ola', last_name: 'Nordmann' }],
      });

      const result = await getPatientsNeedingRecall('org-1');

      expect(result).toHaveLength(1);
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('should sanitize sortBy to prevent injection', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await getPatientsNeedingRecall('org-1', { sortBy: 'DROP TABLE patients' });

      // Should fallback to last_visit_date since the invalid sort field is not in the whitelist
      const sqlUsed = mockQuery.mock.calls[0][0];
      expect(sqlUsed).toContain('last_visit_date');
      expect(sqlUsed).not.toContain('DROP TABLE');
    });

    it('should add lifecycle_stage filter when provided', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await getPatientsNeedingRecall('org-1', {
        includeLifecycleStages: ['ACTIVE', 'AT_RISK'],
      });

      const sqlUsed = mockQuery.mock.calls[0][0];
      expect(sqlUsed).toContain('lifecycle_stage');
    });
  });

  // --------------------------------------------------------------------------
  // checkBirthdayTriggers
  // --------------------------------------------------------------------------
  describe('checkBirthdayTriggers', () => {
    it('should return early when no active birthday workflows exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await checkBirthdayTriggers('org-1');
      expect(result.processed).toBe(0);
    });

    it('should trigger workflow for patients with matching birthdays', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'wf-1',
            organization_id: 'org-1',
            trigger_config: { days_before: 0 },
            max_runs_per_patient: 1,
            is_active: true,
          },
        ],
      });
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'pat-1',
            date_of_birth: '1985-03-27',
            age: '40',
          },
        ],
      });

      mockTriggerWorkflow.mockResolvedValue({ triggered: 1 });

      const result = await checkBirthdayTriggers('org-1');

      expect(result.processed).toBe(1);
      expect(mockTriggerWorkflow).toHaveBeenCalledWith(
        'org-1',
        'BIRTHDAY',
        expect.objectContaining({
          patient_id: 'pat-1',
          is_birthday: true,
          age: 41, // age they're turning
        })
      );
    });
  });

  // --------------------------------------------------------------------------
  // getUpcomingBirthdays
  // --------------------------------------------------------------------------
  describe('getUpcomingBirthdays', () => {
    it('should return upcoming birthday rows', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'pat-1', first_name: 'Kari', turning_age: 30, days_until_birthday: 3 }],
      });

      const result = await getUpcomingBirthdays('org-1', { daysAhead: 7 });
      expect(result).toHaveLength(1);
      expect(result[0].days_until_birthday).toBe(3);
    });
  });

  // --------------------------------------------------------------------------
  // checkAppointmentTriggers
  // --------------------------------------------------------------------------
  describe('checkAppointmentTriggers', () => {
    it('should trigger APPOINTMENT_COMPLETED for completed status', async () => {
      mockTriggerWorkflow.mockResolvedValue({ triggered: 1 });

      const appointment = {
        id: 'apt-1',
        patient_id: 'pat-1',
        status: 'COMPLETED',
        appointment_type: 'INITIAL',
        practitioner_id: 'prac-1',
        start_time: '2026-03-27T10:00:00Z',
      };

      const result = await checkAppointmentTriggers('org-1', appointment, 'SCHEDULED');

      expect(mockTriggerWorkflow).toHaveBeenCalledWith(
        'org-1',
        'APPOINTMENT_COMPLETED',
        expect.objectContaining({
          appointment_id: 'apt-1',
          patient_id: 'pat-1',
          status: 'COMPLETED',
          previous_status: 'SCHEDULED',
        })
      );
      expect(result).toEqual({ triggered: 1 });
    });

    it('should trigger APPOINTMENT_MISSED for NO_SHOW status', async () => {
      mockTriggerWorkflow.mockResolvedValue({ triggered: 1 });

      const appointment = {
        id: 'apt-2',
        patient_id: 'pat-2',
        status: 'NO_SHOW',
        appointment_type: 'FOLLOW_UP',
        practitioner_id: 'prac-1',
        start_time: '2026-03-27T14:00:00Z',
      };

      await checkAppointmentTriggers('org-1', appointment, 'SCHEDULED');

      expect(mockTriggerWorkflow).toHaveBeenCalledWith(
        'org-1',
        'APPOINTMENT_MISSED',
        expect.objectContaining({ appointment_id: 'apt-2' })
      );
    });

    it('should trigger APPOINTMENT_CANCELLED for cancelled status', async () => {
      mockTriggerWorkflow.mockResolvedValue({ triggered: 1 });

      const appointment = {
        id: 'apt-3',
        patient_id: 'pat-3',
        status: 'CANCELLED',
        appointment_type: 'INITIAL',
        practitioner_id: 'prac-1',
        start_time: '2026-03-28T09:00:00Z',
      };

      await checkAppointmentTriggers('org-1', appointment, 'CONFIRMED');

      expect(mockTriggerWorkflow).toHaveBeenCalledWith(
        'org-1',
        'APPOINTMENT_CANCELLED',
        expect.objectContaining({ appointment_id: 'apt-3' })
      );
    });

    it('should trigger APPOINTMENT_SCHEDULED for new scheduling', async () => {
      mockTriggerWorkflow.mockResolvedValue({ triggered: 1 });

      const appointment = {
        id: 'apt-4',
        patient_id: 'pat-4',
        status: 'SCHEDULED',
        appointment_type: 'INITIAL',
        practitioner_id: 'prac-1',
        start_time: '2026-03-29T11:00:00Z',
      };

      await checkAppointmentTriggers('org-1', appointment, null);

      expect(mockTriggerWorkflow).toHaveBeenCalledWith(
        'org-1',
        'APPOINTMENT_SCHEDULED',
        expect.objectContaining({ appointment_id: 'apt-4' })
      );
    });

    it('should not trigger when status change has no mapped trigger', async () => {
      const appointment = {
        id: 'apt-5',
        patient_id: 'pat-5',
        status: 'IN_PROGRESS',
        appointment_type: 'FOLLOW_UP',
        practitioner_id: 'prac-1',
        start_time: '2026-03-27T16:00:00Z',
      };

      const result = await checkAppointmentTriggers('org-1', appointment, 'SCHEDULED');

      expect(mockTriggerWorkflow).not.toHaveBeenCalled();
      expect(result).toEqual({ triggered: 0 });
    });

    it('should not trigger SCHEDULED when transitioning from CONFIRMED', async () => {
      const appointment = {
        id: 'apt-6',
        patient_id: 'pat-6',
        status: 'CONFIRMED',
        appointment_type: 'FOLLOW_UP',
        practitioner_id: 'prac-1',
        start_time: '2026-03-28T08:00:00Z',
      };

      // CONFIRMED with previousStatus = SCHEDULED should NOT re-trigger APPOINTMENT_SCHEDULED
      const result = await checkAppointmentTriggers('org-1', appointment, 'SCHEDULED');

      expect(mockTriggerWorkflow).not.toHaveBeenCalled();
      expect(result).toEqual({ triggered: 0 });
    });
  });

  // --------------------------------------------------------------------------
  // getAppointmentsNeedingFollowUp
  // --------------------------------------------------------------------------
  describe('getAppointmentsNeedingFollowUp', () => {
    it('should return follow-up appointments with defaults', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'apt-1', patient_name: 'Ola Nordmann', status: 'NO_SHOW' }],
      });

      const result = await getAppointmentsNeedingFollowUp('org-1');
      expect(result).toHaveLength(1);
    });
  });

  // --------------------------------------------------------------------------
  // checkPatientCreatedTrigger
  // --------------------------------------------------------------------------
  describe('checkPatientCreatedTrigger', () => {
    it('should trigger PATIENT_CREATED workflow', async () => {
      mockTriggerWorkflow.mockResolvedValue({ triggered: 1 });

      const result = await checkPatientCreatedTrigger('org-1', 'pat-1');

      expect(mockTriggerWorkflow).toHaveBeenCalledWith('org-1', 'PATIENT_CREATED', {
        patient_id: 'pat-1',
      });
      expect(result).toEqual({ triggered: 1 });
    });
  });

  // --------------------------------------------------------------------------
  // checkLifecycleChangeTrigger
  // --------------------------------------------------------------------------
  describe('checkLifecycleChangeTrigger', () => {
    it('should trigger when lifecycle actually changes', async () => {
      mockTriggerWorkflow.mockResolvedValue({ triggered: 1 });

      const result = await checkLifecycleChangeTrigger('org-1', 'pat-1', 'NEW', 'ACTIVE');

      expect(mockTriggerWorkflow).toHaveBeenCalledWith(
        'org-1',
        'LIFECYCLE_CHANGE',
        expect.objectContaining({
          patient_id: 'pat-1',
          previous_lifecycle: 'NEW',
          new_lifecycle: 'ACTIVE',
          lifecycle_changed: true,
        })
      );
      expect(result).toEqual({ triggered: 1 });
    });

    it('should skip trigger when lifecycle has not changed', async () => {
      const result = await checkLifecycleChangeTrigger('org-1', 'pat-1', 'ACTIVE', 'ACTIVE');

      expect(mockTriggerWorkflow).not.toHaveBeenCalled();
      expect(result).toEqual({ triggered: 0 });
    });
  });

  // --------------------------------------------------------------------------
  // getTriggerStats
  // --------------------------------------------------------------------------
  describe('getTriggerStats', () => {
    it('should return aggregated stats', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            trigger_type: 'DAYS_SINCE_VISIT',
            workflow_count: '2',
            active_workflows: '1',
            total_executions: '15',
            successful_executions: '12',
            failed_executions: '3',
          },
        ],
      });

      const result = await getTriggerStats('org-1');
      expect(result).toHaveLength(1);
      expect(result[0].trigger_type).toBe('DAYS_SINCE_VISIT');
    });
  });

  // --------------------------------------------------------------------------
  // getUpcomingTriggers
  // --------------------------------------------------------------------------
  describe('getUpcomingTriggers', () => {
    it('should combine birthdays, recalls, and active workflows', async () => {
      // getUpcomingBirthdays query
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'pat-1', first_name: 'Kari', days_until_birthday: 2 }],
      });
      // getPatientsNeedingRecall query
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'pat-2', first_name: 'Ola' }],
      });
      // Active workflows query
      mockQuery.mockResolvedValueOnce({
        rows: [
          { trigger_type: 'BIRTHDAY', count: '1' },
          { trigger_type: 'DAYS_SINCE_VISIT', count: '2' },
        ],
      });

      const result = await getUpcomingTriggers('org-1');

      expect(result.birthdays.count).toBe(1);
      expect(result.birthdays.has_active_workflow).toBe(true);
      expect(result.recalls.count).toBe(1);
      expect(result.recalls.has_active_workflow).toBe(true);
      expect(result.active_workflows).toEqual({
        BIRTHDAY: 1,
        DAYS_SINCE_VISIT: 2,
      });
    });
  });
});

// ============================================================================
// AUTO-ACCEPT SERVICE
// ============================================================================

describe('Auto-Accept Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // getSettings
  // --------------------------------------------------------------------------
  describe('getSettings', () => {
    it('should return settings row when it exists', async () => {
      const settingsRow = {
        organization_id: 'org-1',
        auto_accept_appointments: true,
        appointment_max_daily_limit: 10,
      };
      mockQuery.mockResolvedValueOnce({ rows: [settingsRow] });

      const result = await getSettings('org-1');
      expect(result).toEqual(settingsRow);
    });

    it('should return null when no settings exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await getSettings('org-1');
      expect(result).toBeNull();
    });
  });

  // --------------------------------------------------------------------------
  // upsertSettings
  // --------------------------------------------------------------------------
  describe('upsertSettings', () => {
    it('should insert/update settings and return the row', async () => {
      const returnedRow = { organization_id: 'org-1', auto_accept_appointments: true };
      mockQuery.mockResolvedValueOnce({ rows: [returnedRow] });

      const result = await upsertSettings('org-1', 'user-1', {
        autoAcceptAppointments: true,
        appointmentAcceptDelayMinutes: 5,
      });

      expect(result).toEqual(returnedRow);
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });
  });

  // --------------------------------------------------------------------------
  // shouldAutoAcceptAppointment
  // --------------------------------------------------------------------------
  describe('shouldAutoAcceptAppointment', () => {
    it('should reject when auto-accept is not enabled', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] }); // getSettings returns null

      const result = await shouldAutoAcceptAppointment('org-1', { appointment_type: 'INITIAL' });

      expect(result.shouldAccept).toBe(false);
      expect(result.reason).toContain('not enabled');
    });

    it('should reject excluded appointment types', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            auto_accept_appointments: true,
            appointment_types_excluded: ['EMERGENCY'],
            appointment_types_included: null,
            appointment_max_daily_limit: null,
            appointment_business_hours_only: false,
          },
        ],
      });

      const result = await shouldAutoAcceptAppointment('org-1', {
        appointment_type: 'EMERGENCY',
      });

      expect(result.shouldAccept).toBe(false);
      expect(result.reason).toContain('excluded');
    });

    it('should reject types not in the included list', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            auto_accept_appointments: true,
            appointment_types_excluded: null,
            appointment_types_included: ['FOLLOW_UP'],
            appointment_max_daily_limit: null,
            appointment_business_hours_only: false,
          },
        ],
      });

      const result = await shouldAutoAcceptAppointment('org-1', {
        appointment_type: 'INITIAL',
      });

      expect(result.shouldAccept).toBe(false);
      expect(result.reason).toContain('not in included');
    });

    it('should reject when daily limit is reached', async () => {
      // getSettings
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            auto_accept_appointments: true,
            appointment_types_excluded: null,
            appointment_types_included: null,
            appointment_max_daily_limit: 5,
            appointment_business_hours_only: false,
          },
        ],
      });
      // getDailyAutoAcceptCount returns 5
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '5' }] });

      const result = await shouldAutoAcceptAppointment('org-1', {
        appointment_type: 'FOLLOW_UP',
      });

      expect(result.shouldAccept).toBe(false);
      expect(result.reason).toContain('limit reached');
    });

    it('should reject weekend appointments when business hours required', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            auto_accept_appointments: true,
            appointment_types_excluded: null,
            appointment_types_included: null,
            appointment_max_daily_limit: null,
            appointment_business_hours_only: true,
          },
        ],
      });

      // Sunday
      const sunday = new Date('2026-03-29T10:00:00');
      const result = await shouldAutoAcceptAppointment('org-1', {
        appointment_type: 'FOLLOW_UP',
        start_time: sunday.toISOString(),
      });

      expect(result.shouldAccept).toBe(false);
      expect(result.reason).toContain('weekend');
    });

    it('should reject appointments outside business hours (before 8 AM)', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            auto_accept_appointments: true,
            appointment_types_excluded: null,
            appointment_types_included: null,
            appointment_max_daily_limit: null,
            appointment_business_hours_only: true,
          },
        ],
      });

      // Wednesday at 6 AM local
      const early = new Date(2026, 2, 25, 6, 0, 0); // month is 0-indexed, so 2 = March
      const result = await shouldAutoAcceptAppointment('org-1', {
        appointment_type: 'FOLLOW_UP',
        start_time: early.toISOString(),
      });

      expect(result.shouldAccept).toBe(false);
      expect(result.reason).toContain('outside business hours');
    });

    it('should accept appointment that passes all checks', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            auto_accept_appointments: true,
            appointment_types_excluded: null,
            appointment_types_included: null,
            appointment_max_daily_limit: null,
            appointment_business_hours_only: false,
          },
        ],
      });

      const result = await shouldAutoAcceptAppointment('org-1', {
        appointment_type: 'FOLLOW_UP',
        start_time: new Date().toISOString(),
      });

      expect(result.shouldAccept).toBe(true);
      expect(result.reason).toBeNull();
    });
  });

  // --------------------------------------------------------------------------
  // shouldAutoAcceptReferral
  // --------------------------------------------------------------------------
  describe('shouldAutoAcceptReferral', () => {
    it('should reject when referral auto-accept is not enabled', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] }); // no settings

      const result = await shouldAutoAcceptReferral('org-1', { source: 'GP' });

      expect(result.shouldAccept).toBe(false);
      expect(result.reason).toContain('not enabled');
    });

    it('should reject excluded referral sources', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            auto_accept_referrals: true,
            referral_sources_excluded: ['SPAM_SOURCE'],
            referral_sources_included: null,
            referral_require_complete_info: false,
          },
        ],
      });

      const result = await shouldAutoAcceptReferral('org-1', { source: 'SPAM_SOURCE' });

      expect(result.shouldAccept).toBe(false);
      expect(result.reason).toContain('excluded');
    });

    it('should reject referrals missing required info', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            auto_accept_referrals: true,
            referral_sources_excluded: null,
            referral_sources_included: null,
            referral_require_complete_info: true,
          },
        ],
      });

      const result = await shouldAutoAcceptReferral('org-1', {
        source: 'GP',
        patient_name: 'Ola Nordmann',
        // Missing referring_provider and reason
      });

      expect(result.shouldAccept).toBe(false);
      expect(result.reason).toContain('Missing required');
      expect(result.reason).toContain('referring_provider');
    });

    it('should accept referral when all checks pass', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            auto_accept_referrals: true,
            referral_sources_excluded: null,
            referral_sources_included: null,
            referral_require_complete_info: true,
          },
        ],
      });

      const result = await shouldAutoAcceptReferral('org-1', {
        source: 'GP',
        patient_name: 'Ola Nordmann',
        referring_provider: 'Dr. Hansen',
        reason: 'Lower back pain',
      });

      expect(result.shouldAccept).toBe(true);
      expect(result.reason).toBeNull();
    });
  });

  // --------------------------------------------------------------------------
  // autoAcceptAppointment
  // --------------------------------------------------------------------------
  describe('autoAcceptAppointment', () => {
    it('should throw when appointment is not found', async () => {
      const mockClient = { query: jest.fn().mockResolvedValueOnce({ rows: [] }) };
      mockTransactionStart.mockResolvedValue(mockClient);

      await expect(autoAcceptAppointment('org-1', 'apt-999')).rejects.toThrow(
        'Appointment not found'
      );
      expect(mockTransactionRollback).toHaveBeenCalledWith(mockClient);
    });
  });

  // --------------------------------------------------------------------------
  // processPendingAppointments
  // --------------------------------------------------------------------------
  describe('processPendingAppointments', () => {
    it('should process pending appointments for each org with auto-accept', async () => {
      // Get orgs with auto-accept enabled
      mockQuery.mockResolvedValueOnce({
        rows: [{ organization_id: 'org-1', appointment_accept_delay_minutes: 5 }],
      });
      // Get pending appointments for org-1
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'apt-1' }],
      });
      // autoAcceptAppointment calls — transaction start
      const mockClient = {
        query: jest
          .fn()
          // appointment lookup
          .mockResolvedValueOnce({
            rows: [
              {
                id: 'apt-1',
                organization_id: 'org-1',
                appointment_type: 'FOLLOW_UP',
                start_time: new Date().toISOString(),
                status: 'pending',
                patient_name: 'Test',
              },
            ],
          })
          // shouldAutoAcceptAppointment -> getSettings
          // (This goes through query mock, not client.query)
          // auto_accept_log insert
          .mockResolvedValueOnce({ rows: [] })
          // update appointment
          .mockResolvedValueOnce({ rows: [] }),
      };
      mockTransactionStart.mockResolvedValue(mockClient);

      // shouldAutoAcceptAppointment calls getSettings via query
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            auto_accept_appointments: true,
            appointment_types_excluded: null,
            appointment_types_included: null,
            appointment_max_daily_limit: null,
            appointment_business_hours_only: false,
            notify_on_auto_accept: false,
          },
        ],
      });

      await processPendingAppointments();

      expect(mockQuery).toHaveBeenCalled();
      expect(mockTransactionStart).toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // processPendingReferrals
  // --------------------------------------------------------------------------
  describe('processPendingReferrals', () => {
    it('should handle no orgs with referral auto-accept', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await processPendingReferrals();

      // Should only have called query once (to get orgs)
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });
  });

  // --------------------------------------------------------------------------
  // getAutoAcceptLog
  // --------------------------------------------------------------------------
  describe('getAutoAcceptLog', () => {
    it('should return log entries with default filters', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { id: 'log-1', resource_type: 'appointment', action: 'accepted' },
          { id: 'log-2', resource_type: 'referral', action: 'rejected' },
        ],
      });

      const result = await getAutoAcceptLog('org-1');
      expect(result).toHaveLength(2);
    });

    it('should apply resourceType and action filters', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'log-1', resource_type: 'appointment', action: 'accepted' }],
      });

      const result = await getAutoAcceptLog('org-1', {
        resourceType: 'appointment',
        action: 'accepted',
      });

      expect(result).toHaveLength(1);
      // Verify params include resourceType and action
      const params = mockQuery.mock.calls[0][1];
      expect(params).toContain('appointment');
      expect(params).toContain('accepted');
    });
  });
});
