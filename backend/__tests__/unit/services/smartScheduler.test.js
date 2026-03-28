/**
 * Unit Tests for Smart Scheduler Service
 * Tests communication scheduling, follow-up logic, conflict resolution,
 * decision management, appointment import, and message processing.
 */

import { jest } from '@jest/globals';

const mockQuery = jest.fn();

jest.unstable_mockModule('../../../src/config/database.js', () => ({
  query: mockQuery,
  transaction: jest.fn(),
  getClient: jest.fn(),
  default: { query: mockQuery, transaction: jest.fn(), getClient: jest.fn() },
}));

jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

const mockSendSMS = jest.fn();

jest.unstable_mockModule('../../../src/services/communication/communications.js', () => ({
  sendSMS: mockSendSMS,
  default: { sendSMS: mockSendSMS },
}));

const {
  scheduleCommuncation,
  scheduleFollowUpAfterVisit,
  getPendingDecisions,
  resolveDecision,
  bulkResolveDecisions,
  processDueCommunications,
  importAppointments,
  getCommunicationRules,
  updateCommunicationRule,
  getPatientScheduledComms,
  getSchedulerStats,
  getTodaysMessages,
  cancelScheduledMessage,
  sendApprovedMessages,
} = await import('../../../src/services/practice/smartScheduler.js');

const ORG_ID = 'org-1';
const PATIENT_ID = 'pat-1';
const APPT_ID = 'appt-1';

describe('Smart Scheduler Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── scheduleCommuncation ────────────────────────────────────────────────────

  describe('scheduleCommuncation', () => {
    it('should insert a scheduled communication and return the row', async () => {
      const row = {
        id: 'sc-1',
        patient_id: PATIENT_ID,
        scheduled_date: '2026-04-01',
        communication_type: 'sms',
      };
      mockQuery.mockResolvedValueOnce({ rows: [row] });

      const result = await scheduleCommuncation({
        organizationId: ORG_ID,
        patientId: PATIENT_ID,
        communicationType: 'sms',
        templateId: null,
        customMessage: 'Hei {fornavn}',
        scheduledDate: '2026-04-01',
        scheduledTime: '10:00:00',
        triggerType: 'follow_up',
        triggerAppointmentId: APPT_ID,
        triggerDaysAfter: 7,
        createdBy: 'user-1',
      });

      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(result).toEqual(row);
    });

    it('should use default scheduledTime of 10:00:00 when not provided', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'sc-2' }] });

      await scheduleCommuncation({
        organizationId: ORG_ID,
        patientId: PATIENT_ID,
        scheduledDate: '2026-04-01',
      });

      const callArgs = mockQuery.mock.calls[0][1];
      // index 6 is scheduled_time
      expect(callArgs[6]).toBe('10:00:00');
    });
  });

  // ── scheduleFollowUpAfterVisit ──────────────────────────────────────────────

  describe('scheduleFollowUpAfterVisit', () => {
    it('should return null when appointment is not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await scheduleFollowUpAfterVisit(APPT_ID, ORG_ID);

      expect(result).toBeNull();
    });

    it('should schedule follow-ups for each active rule', async () => {
      // Appointment query
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: APPT_ID,
            patient_id: PATIENT_ID,
            appointment_date: '2026-03-01',
            first_name: 'Ola',
            last_name: 'Nordmann',
            phone: '+4712345678',
          },
        ],
      });
      // Rules query — one rule, no condition on no-future-appt
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'rule-1',
            communication_type: 'sms',
            template_id: null,
            default_message: 'Hei {fornavn}',
            trigger_days: 7,
            condition_no_appointment_scheduled: false,
          },
        ],
      });
      // scheduleCommuncation INSERT
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'sc-10' }] });

      const result = await scheduleFollowUpAfterVisit(APPT_ID, ORG_ID);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ id: 'sc-10' });
    });

    it('should skip rule when patient already has a future appointment', async () => {
      // Appointment query
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: APPT_ID,
            patient_id: PATIENT_ID,
            appointment_date: '2026-03-01',
          },
        ],
      });
      // Rules query — one rule requiring no future appt
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'rule-2',
            communication_type: 'sms',
            trigger_days: 7,
            condition_no_appointment_scheduled: true,
          },
        ],
      });
      // Future appointment check — patient has one
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'future-appt' }] });

      const result = await scheduleFollowUpAfterVisit(APPT_ID, ORG_ID);

      expect(result).toHaveLength(0);
    });

    it('should schedule when condition_no_appointment_scheduled is true but no future appt exists', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: APPT_ID,
            patient_id: PATIENT_ID,
            appointment_date: '2026-03-01',
          },
        ],
      });
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'rule-3',
            communication_type: 'sms',
            template_id: null,
            default_message: 'Kom tilbake',
            trigger_days: 14,
            condition_no_appointment_scheduled: true,
          },
        ],
      });
      // No future appointments
      mockQuery.mockResolvedValueOnce({ rows: [] });
      // INSERT
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'sc-11' }] });

      const result = await scheduleFollowUpAfterVisit(APPT_ID, ORG_ID);

      expect(result).toHaveLength(1);
    });
  });

  // ── getPendingDecisions ─────────────────────────────────────────────────────

  describe('getPendingDecisions', () => {
    it('should return pending decisions for an organization', async () => {
      const rows = [
        { id: 'dec-1', status: 'pending', first_name: 'Ola' },
        { id: 'dec-2', status: 'pending', first_name: 'Kari' },
      ];
      mockQuery.mockResolvedValueOnce({ rows });

      const result = await getPendingDecisions(ORG_ID);

      expect(result).toEqual(rows);
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no pending decisions exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await getPendingDecisions(ORG_ID);

      expect(result).toEqual([]);
    });
  });

  // ── resolveDecision ─────────────────────────────────────────────────────────

  describe('resolveDecision', () => {
    it('should throw when decision record is not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(resolveDecision('missing-id', 'extend', 'user-1')).rejects.toThrow(
        'Decision not found'
      );
    });

    it('should handle extend decision and update communication date', async () => {
      const decisionRecord = {
        id: 'dec-1',
        scheduled_communication_id: 'sc-1',
        suggested_new_date: '2026-04-15',
        scheduled_date: '2026-04-01',
        trigger_days_after: 7,
      };
      mockQuery.mockResolvedValueOnce({ rows: [decisionRecord] }); // fetch decision
      mockQuery.mockResolvedValueOnce({ rows: [] }); // update scheduler_decisions
      mockQuery.mockResolvedValueOnce({ rows: [] }); // update scheduled_communications

      const result = await resolveDecision('dec-1', 'extend', 'user-1');

      expect(result).toEqual({ success: true, decision: 'extend' });
      expect(mockQuery).toHaveBeenCalledTimes(3);
    });

    it('should handle cancel decision and mark communication cancelled', async () => {
      const decisionRecord = {
        id: 'dec-2',
        scheduled_communication_id: 'sc-2',
        suggested_new_date: null,
      };
      mockQuery.mockResolvedValueOnce({ rows: [decisionRecord] });
      mockQuery.mockResolvedValueOnce({ rows: [] });
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await resolveDecision('dec-2', 'cancel', 'user-1', 'No longer needed');

      expect(result).toEqual({ success: true, decision: 'cancel' });
    });

    it('should handle send_anyway decision and keep original date', async () => {
      const decisionRecord = {
        id: 'dec-3',
        scheduled_communication_id: 'sc-3',
        suggested_new_date: null,
      };
      mockQuery.mockResolvedValueOnce({ rows: [decisionRecord] });
      mockQuery.mockResolvedValueOnce({ rows: [] });
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await resolveDecision('dec-3', 'send_anyway', 'user-1');

      expect(result).toEqual({ success: true, decision: 'send_anyway' });
    });
  });

  // ── bulkResolveDecisions ────────────────────────────────────────────────────

  describe('bulkResolveDecisions', () => {
    it('should resolve multiple decisions and return results for each', async () => {
      // For dec-1: fetch, update decisions, update comms
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'dec-1', scheduled_communication_id: 'sc-1', suggested_new_date: null }],
      });
      mockQuery.mockResolvedValueOnce({ rows: [] });
      mockQuery.mockResolvedValueOnce({ rows: [] });

      // For dec-2: fetch, update decisions, update comms
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'dec-2', scheduled_communication_id: 'sc-2', suggested_new_date: null }],
      });
      mockQuery.mockResolvedValueOnce({ rows: [] });
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const results = await bulkResolveDecisions(['dec-1', 'dec-2'], 'cancel', 'user-1');

      expect(results).toHaveLength(2);
      expect(results[0]).toMatchObject({ id: 'dec-1', success: true });
      expect(results[1]).toMatchObject({ id: 'dec-2', success: true });
    });

    it('should include error entry for failed decisions without stopping', async () => {
      // dec-1 fails (not found)
      mockQuery.mockResolvedValueOnce({ rows: [] });
      // dec-2 succeeds
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'dec-2', scheduled_communication_id: 'sc-2', suggested_new_date: null }],
      });
      mockQuery.mockResolvedValueOnce({ rows: [] });
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const results = await bulkResolveDecisions(['dec-1', 'dec-2'], 'cancel', 'user-1');

      expect(results[0]).toMatchObject({
        id: 'dec-1',
        success: false,
        error: 'Decision not found',
      });
      expect(results[1]).toMatchObject({ id: 'dec-2', success: true });
    });
  });

  // ── processDueCommunications ────────────────────────────────────────────────

  describe('processDueCommunications', () => {
    it('should return zero counts when no due communications exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await processDueCommunications();

      expect(result).toEqual({ sent: 0, failed: 0, details: { sent: [], failed: [] } });
    });

    it('should auto-cancel communication when patient has a future appointment', async () => {
      const comm = {
        id: 'sc-5',
        patient_id: PATIENT_ID,
        communication_type: 'sms',
        phone: '+4712345678',
        custom_message: 'Hei',
        first_name: 'Ola',
        last_name: 'Nordmann',
        org_name: 'Klinikk',
        org_phone: '+4799999999',
        settings: {},
        trigger_type: 'follow_up',
        organization_id: ORG_ID,
      };
      mockQuery.mockResolvedValueOnce({ rows: [comm] }); // due comms query
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'future-appt', appointment_date: '2026-05-01' }],
      }); // has future appt
      mockQuery.mockResolvedValueOnce({ rows: [] }); // UPDATE auto-cancel

      const result = await processDueCommunications();

      expect(result.sent).toBe(0);
      expect(mockSendSMS).not.toHaveBeenCalled();
    });

    it('should send SMS and mark as sent for due communication without future appointment', async () => {
      const comm = {
        id: 'sc-6',
        patient_id: PATIENT_ID,
        communication_type: 'sms',
        phone: '+4712345678',
        custom_message: 'Hei {fornavn}, klinikk: {klinikk}',
        first_name: 'Ola',
        last_name: 'Nordmann',
        org_name: 'Klinikk AS',
        org_phone: '+4799999999',
        settings: { booking_url: 'https://book.example.com' },
        trigger_type: 'follow_up',
        organization_id: ORG_ID,
      };
      mockQuery.mockResolvedValueOnce({ rows: [comm] }); // due comms
      mockQuery.mockResolvedValueOnce({ rows: [] }); // no future appt
      mockSendSMS.mockResolvedValueOnce({});
      mockQuery.mockResolvedValueOnce({ rows: [] }); // UPDATE sent

      const result = await processDueCommunications();

      expect(result.sent).toBe(1);
      expect(result.failed).toBe(0);
      expect(mockSendSMS).toHaveBeenCalledTimes(1);
    });

    it('should track failed communications without throwing', async () => {
      const comm = {
        id: 'sc-7',
        patient_id: PATIENT_ID,
        communication_type: 'sms',
        phone: '+4712345678',
        custom_message: 'Test',
        first_name: 'Kari',
        last_name: 'Nilsen',
        org_name: 'Klinikk',
        org_phone: null,
        settings: null,
        trigger_type: 'follow_up',
        organization_id: ORG_ID,
      };
      mockQuery.mockResolvedValueOnce({ rows: [comm] });
      mockQuery.mockResolvedValueOnce({ rows: [] }); // no future appt
      mockSendSMS.mockRejectedValueOnce(new Error('SMS gateway error'));

      const result = await processDueCommunications();

      expect(result.sent).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.details.failed[0]).toMatchObject({ id: 'sc-7', error: 'SMS gateway error' });
    });
  });

  // ── importAppointments ──────────────────────────────────────────────────────

  describe('importAppointments', () => {
    it('should create new patient and appointment when neither exists', async () => {
      const appt = {
        firstName: 'Ola',
        lastName: 'Nordmann',
        phone: '+4712345678',
        email: 'ola@example.com',
        date: '2026-04-10',
        time: '09:00',
        duration: 30,
        status: 'scheduled',
        visitType: 'behandling',
        notes: '',
      };
      mockQuery.mockResolvedValueOnce({ rows: [] }); // patient search — not found
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'new-pat' }] }); // INSERT patient
      mockQuery.mockResolvedValueOnce({ rows: [] }); // appointment search — not found
      mockQuery.mockResolvedValueOnce({ rows: [] }); // INSERT appointment
      mockQuery.mockResolvedValueOnce({ rows: [] }); // INSERT import log

      const stats = await importAppointments(ORG_ID, [appt], 'solvitjournal', 'user-1');

      expect(stats.created).toBe(1);
      expect(stats.patientsCreated).toBe(1);
      expect(stats.errors).toBe(0);
    });

    it('should update existing appointment when patient and appointment both exist', async () => {
      const appt = {
        firstName: 'Kari',
        lastName: 'Nilsen',
        phone: '+4798765432',
        email: 'kari@example.com',
        date: '2026-04-10',
        time: '10:00',
        status: 'completed',
        visitType: 'behandling',
        notes: 'Follow-up',
      };
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'existing-pat' }] }); // patient found
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'existing-appt' }] }); // appointment found
      mockQuery.mockResolvedValueOnce({ rows: [] }); // UPDATE appointment
      mockQuery.mockResolvedValueOnce({ rows: [] }); // INSERT import log

      const stats = await importAppointments(ORG_ID, [appt], 'solvitjournal', 'user-1');

      expect(stats.updated).toBe(1);
      expect(stats.patientsCreated).toBe(0);
    });

    it('should count errors and continue processing remaining appointments', async () => {
      const appts = [
        { firstName: 'Error', lastName: 'Case', phone: null, date: '2026-04-10', time: '09:00' },
        {
          firstName: 'Good',
          lastName: 'Case',
          phone: '+4711111111',
          email: 'good@example.com',
          date: '2026-04-11',
          time: '11:00',
          duration: 30,
          status: 'scheduled',
          visitType: 'behandling',
          notes: '',
        },
      ];
      // First appointment: patient search throws
      mockQuery.mockRejectedValueOnce(new Error('DB timeout'));
      // Second appointment: patient search, INSERT patient, appt search, INSERT appt
      mockQuery.mockResolvedValueOnce({ rows: [] });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'new-pat-2' }] });
      mockQuery.mockResolvedValueOnce({ rows: [] });
      mockQuery.mockResolvedValueOnce({ rows: [] });
      // Import log
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const stats = await importAppointments(ORG_ID, appts, 'solvitjournal', 'user-1');

      expect(stats.errors).toBe(1);
      expect(stats.created).toBe(1);
      expect(stats.errorLog).toHaveLength(1);
    });
  });

  // ── getCommunicationRules ───────────────────────────────────────────────────

  describe('getCommunicationRules', () => {
    it('should return communication rules for an organization', async () => {
      const rows = [
        { id: 'rule-1', name: '7-day follow-up', trigger_type: 'after_visit', trigger_days: 7 },
      ];
      mockQuery.mockResolvedValueOnce({ rows });

      const result = await getCommunicationRules(ORG_ID);

      expect(result).toEqual(rows);
    });
  });

  // ── updateCommunicationRule ─────────────────────────────────────────────────

  describe('updateCommunicationRule', () => {
    it('should return null when no allowed fields are provided', async () => {
      const result = await updateCommunicationRule('rule-1', { unknown_field: 'value' });

      expect(result).toBeNull();
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('should update allowed fields and return updated row', async () => {
      const updated = { id: 'rule-1', is_active: false, trigger_days: 14 };
      mockQuery.mockResolvedValueOnce({ rows: [updated] });

      const result = await updateCommunicationRule('rule-1', {
        is_active: false,
        trigger_days: 14,
      });

      expect(result).toEqual(updated);
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });
  });

  // ── getSchedulerStats ───────────────────────────────────────────────────────

  describe('getSchedulerStats', () => {
    it('should return combined stats with pending decisions count as integer', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { pending_count: '3', conflicts_count: '1', sent_last_week: '5', cancelled_count: '2' },
        ],
      });
      mockQuery.mockResolvedValueOnce({ rows: [{ pending_decisions: '4' }] });

      const result = await getSchedulerStats(ORG_ID);

      expect(result.pending_decisions).toBe(4);
      expect(result.pending_count).toBe('3');
    });
  });

  // ── cancelScheduledMessage ──────────────────────────────────────────────────

  describe('cancelScheduledMessage', () => {
    it('should cancel a message and return success', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await cancelScheduledMessage('msg-1', 'user-1');

      expect(result).toEqual({ success: true, cancelled: true });
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });
  });

  // ── sendApprovedMessages ────────────────────────────────────────────────────

  describe('sendApprovedMessages', () => {
    it('should send SMS for each approved message and return counts', async () => {
      const comm = {
        id: 'sc-20',
        patient_id: PATIENT_ID,
        communication_type: 'sms',
        phone: '+4712345678',
        custom_message: 'Hei {fornavn} fra {klinikk}',
        first_name: 'Ola',
        last_name: 'Nordmann',
        org_name: 'Klinikk',
        org_phone: null,
        settings: null,
        trigger_type: 'follow_up',
        organization_id: ORG_ID,
      };
      mockQuery.mockResolvedValueOnce({ rows: [comm] }); // SELECT
      mockSendSMS.mockResolvedValueOnce({});
      mockQuery.mockResolvedValueOnce({ rows: [] }); // UPDATE sent

      const result = await sendApprovedMessages(ORG_ID, ['sc-20']);

      expect(result.sent).toBe(1);
      expect(result.failed).toBe(0);
      expect(result.total).toBe(1);
    });

    it('should count failed messages when SMS throws', async () => {
      const comm = {
        id: 'sc-21',
        patient_id: PATIENT_ID,
        communication_type: 'sms',
        phone: '+4712345678',
        custom_message: 'Test',
        first_name: 'Kari',
        last_name: 'Nilsen',
        org_name: 'Klinikk',
        org_phone: null,
        settings: null,
        trigger_type: 'follow_up',
        organization_id: ORG_ID,
      };
      mockQuery.mockResolvedValueOnce({ rows: [comm] });
      mockSendSMS.mockRejectedValueOnce(new Error('Provider error'));

      const result = await sendApprovedMessages(ORG_ID, ['sc-21']);

      expect(result.sent).toBe(0);
      expect(result.failed).toBe(1);
    });

    it('should return zero sent when message has no phone number', async () => {
      const comm = {
        id: 'sc-22',
        patient_id: PATIENT_ID,
        communication_type: 'sms',
        phone: null,
        custom_message: 'Test',
        first_name: 'Jan',
        last_name: 'Hansen',
        org_name: 'Klinikk',
        org_phone: null,
        settings: null,
        trigger_type: 'follow_up',
        organization_id: ORG_ID,
      };
      mockQuery.mockResolvedValueOnce({ rows: [comm] });

      const result = await sendApprovedMessages(ORG_ID, ['sc-22']);

      expect(result.sent).toBe(0);
      expect(mockSendSMS).not.toHaveBeenCalled();
    });
  });

  // ── getPatientScheduledComms / getTodaysMessages ────────────────────────────

  describe('getPatientScheduledComms', () => {
    it('should return all scheduled communications for a patient', async () => {
      const rows = [{ id: 'sc-30', scheduled_date: '2026-04-01', status: 'pending' }];
      mockQuery.mockResolvedValueOnce({ rows });

      const result = await getPatientScheduledComms(PATIENT_ID);

      expect(result).toEqual(rows);
    });
  });

  describe('getTodaysMessages', () => {
    it('should return pending messages scheduled for today', async () => {
      const rows = [{ id: 'sc-40', scheduled_time: '10:00:00', first_name: 'Ola' }];
      mockQuery.mockResolvedValueOnce({ rows });

      const result = await getTodaysMessages(ORG_ID);

      expect(result).toEqual(rows);
    });
  });
});
