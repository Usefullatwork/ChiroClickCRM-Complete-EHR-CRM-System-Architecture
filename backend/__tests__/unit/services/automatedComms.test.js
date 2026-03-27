/**
 * Unit Tests for Automated Communications Service
 * Tests template resolution, variable substitution, message queuing,
 * delivery logging, reminder checks, preference filtering, and automation stats.
 */

import { jest } from '@jest/globals';

// Mock database
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

// Import after mocking
const {
  substituteVariables,
  getOrganizationSettings,
  getTemplate,
  queueMessage,
  logSentMessage,
  checkAppointmentReminders24h,
  checkAppointmentReminders1h,
  checkExerciseInactivity,
  checkFollowUpReminders,
  checkBirthdayGreetings,
  checkDaysSinceVisit,
  runAutomatedChecks,
  getAutomationStats,
} = await import('../../../src/services/automatedComms.js');

describe('Automated Communications Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── substituteVariables ──────────────────────────────────

  describe('substituteVariables', () => {
    it('should replace all template variables with values', () => {
      const template = 'Hei {{patient_first_name}}! Time kl {{appointment_time}}.';
      const variables = {
        patient_first_name: 'Ola',
        appointment_time: '14:30',
      };

      const result = substituteVariables(template, variables);

      expect(result).toBe('Hei Ola! Time kl 14:30.');
    });

    it('should return empty string for null/undefined template', () => {
      expect(substituteVariables(null, {})).toBe('');
      expect(substituteVariables(undefined, {})).toBe('');
    });

    it('should replace missing variable values with empty string', () => {
      const template = 'Hei {{patient_first_name}}! Ring {{clinic_phone}}.';
      const variables = { patient_first_name: 'Kari', clinic_phone: null };

      const result = substituteVariables(template, variables);

      expect(result).toBe('Hei Kari! Ring .');
    });

    it('should replace multiple occurrences of the same variable', () => {
      const template = '{{name}} og {{name}} igjen';
      const result = substituteVariables(template, { name: 'Ola' });

      expect(result).toBe('Ola og Ola igjen');
    });
  });

  // ─── getOrganizationSettings ──────────────────────────────

  describe('getOrganizationSettings', () => {
    it('should return organization settings from database', async () => {
      const orgData = {
        name: 'Klinikk AS',
        phone: '+4712345678',
        email: 'klinikk@test.no',
        settings: {},
      };
      mockQuery.mockResolvedValueOnce({ rows: [orgData] });

      const result = await getOrganizationSettings('org-1');

      expect(result).toEqual(orgData);
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('FROM organizations'), [
        'org-1',
      ]);
    });

    it('should return empty object when organization not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await getOrganizationSettings('org-missing');

      expect(result).toEqual({});
    });

    it('should return empty object on database error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB down'));

      const result = await getOrganizationSettings('org-1');

      expect(result).toEqual({});
    });
  });

  // ─── getTemplate ──────────────────────────────────────────

  describe('getTemplate', () => {
    it('should return org-specific template when available', async () => {
      const customTemplate = {
        id: 'tmpl-1',
        organization_id: 'org-1',
        name: 'Custom reminder',
        body: 'Custom body {{patient_first_name}}',
        trigger_type: 'APPOINTMENT_24H',
        is_active: true,
      };
      mockQuery.mockResolvedValueOnce({ rows: [customTemplate] });

      const result = await getTemplate('org-1', 'APPOINTMENT_24H');

      expect(result).toEqual(customTemplate);
    });

    it('should fall back to default template when no org template exists', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await getTemplate('org-1', 'APPOINTMENT_24H');

      expect(result).not.toBeNull();
      expect(result.name).toBe('24-timers paminnelse');
      expect(result.category).toBe('appointment_reminder');
    });

    it('should return null for unknown template type with no DB match', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await getTemplate('org-1', 'NONEXISTENT_TYPE');

      expect(result).toBeNull();
    });

    it('should fall back to default on database error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Query failed'));

      const result = await getTemplate('org-1', 'BIRTHDAY');

      expect(result).not.toBeNull();
      expect(result.name).toBe('Gratulerer med dagen!');
    });
  });

  // ─── queueMessage ─────────────────────────────────────────

  describe('queueMessage', () => {
    it('should insert message into communication_queue and return id', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'queue-1' }] });

      const messageData = {
        type: 'SMS',
        content: 'Hei Ola! Husk timen.',
        triggerType: 'APPOINTMENT_24H',
        priority: 'high',
      };

      const id = await queueMessage('org-1', 'pat-1', messageData);

      expect(id).toBe('queue-1');
      expect(mockQuery).toHaveBeenCalledTimes(1);
      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain('INSERT INTO communication_queue');
      expect(params[0]).toBe('org-1');
      expect(params[1]).toBe('pat-1');
      expect(params[2]).toBe('SMS');
      expect(params[3]).toBe('Hei Ola! Husk timen.');
    });

    it('should use default type SMS and priority normal when not provided', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'queue-2' }] });

      await queueMessage('org-1', 'pat-1', { content: 'Hello' });

      const params = mockQuery.mock.calls[0][1];
      expect(params[2]).toBe('SMS'); // type default
      expect(params[8]).toBe('normal'); // priority default
    });

    it('should throw on database error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Insert failed'));

      await expect(queueMessage('org-1', 'pat-1', { content: 'test' })).rejects.toThrow(
        'Insert failed'
      );
    });
  });

  // ─── logSentMessage ───────────────────────────────────────

  describe('logSentMessage', () => {
    it('should insert into sent_messages and return id', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'sent-1' }] });

      const data = {
        patientId: 'pat-1',
        type: 'SMS',
        phone: '+4712345678',
        content: 'Test content',
        isAutomated: true,
        status: 'SENT',
      };

      const id = await logSentMessage('org-1', data);

      expect(id).toBe('sent-1');
      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain('INSERT INTO sent_messages');
      expect(params[0]).toBe('org-1');
      expect(params[1]).toBe('pat-1');
      expect(params[2]).toBe('SMS');
      expect(params[3]).toBe('+4712345678');
    });

    it('should default isAutomated to true when not explicitly false', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'sent-2' }] });

      await logSentMessage('org-1', {
        patientId: 'pat-1',
        type: 'SMS',
        content: 'x',
      });

      const params = mockQuery.mock.calls[0][1];
      // isAutomated param is index 9 (data.isAutomated !== false)
      expect(params[9]).toBe(true);
    });

    it('should throw on database error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Log failed'));

      await expect(
        logSentMessage('org-1', { patientId: 'p', type: 'SMS', content: 'x' })
      ).rejects.toThrow('Log failed');
    });
  });

  // ─── checkAppointmentReminders24h ─────────────────────────

  describe('checkAppointmentReminders24h', () => {
    it('should queue messages for appointments 24h away', async () => {
      // First query: find appointments
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            appointment_id: 'apt-1',
            start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            organization_id: 'org-1',
            patient_id: 'pat-1',
            first_name: 'Ola',
            last_name: 'Nordmann',
            phone: '+4712345678',
            email: 'ola@test.no',
            provider_first_name: 'Dr.',
            provider_last_name: 'Hansen',
            clinic_name: 'Klinikk AS',
            clinic_phone: '+4798765432',
          },
        ],
      });
      // getTemplate query (org-specific) -> fallback to default
      mockQuery.mockResolvedValueOnce({ rows: [] });
      // queueMessage INSERT
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'queue-1' }] });

      const result = await checkAppointmentReminders24h();

      expect(result.count).toBe(1);
      expect(result.queued).toHaveLength(1);
      expect(result.queued[0].patientId).toBe('pat-1');
      expect(result.queued[0].appointmentId).toBe('apt-1');
    });

    it('should return empty when no appointments are due', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await checkAppointmentReminders24h();

      expect(result.count).toBe(0);
      expect(result.queued).toEqual([]);
    });
  });

  // ─── checkAppointmentReminders1h ──────────────────────────

  describe('checkAppointmentReminders1h', () => {
    it('should queue 1h reminders for upcoming appointments', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            appointment_id: 'apt-2',
            start_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            organization_id: 'org-1',
            patient_id: 'pat-2',
            first_name: 'Kari',
            last_name: 'Nordmann',
            phone: '+4711111111',
            clinic_name: 'Klinikk AS',
          },
        ],
      });
      // getTemplate -> fallback
      mockQuery.mockResolvedValueOnce({ rows: [] });
      // queueMessage INSERT
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'queue-2' }] });

      const result = await checkAppointmentReminders1h();

      expect(result.count).toBe(1);
      expect(result.queued[0].patientId).toBe('pat-2');
    });
  });

  // ─── checkExerciseInactivity ──────────────────────────────

  describe('checkExerciseInactivity', () => {
    it('should queue messages for inactive exercise patients', async () => {
      // Main query: find inactive patients
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            patient_id: 'pat-3',
            first_name: 'Per',
            last_name: 'Hansen',
            phone: '+4722222222',
            organization_id: 'org-1',
            clinic_name: 'Klinikk AS',
            portal_link: 'https://portal.test.no',
            days_since_login: 10,
          },
        ],
      });
      // Patient preference check
      mockQuery.mockResolvedValueOnce({ rows: [{ exercise_reminder_enabled: true }] });
      // Org settings check
      mockQuery.mockResolvedValueOnce({ rows: [{ enabled: 'true' }] });
      // getTemplate -> fallback
      mockQuery.mockResolvedValueOnce({ rows: [] });
      // queueMessage INSERT
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'queue-3' }] });

      const result = await checkExerciseInactivity(7);

      expect(result.count).toBe(1);
      expect(result.queued[0].patientId).toBe('pat-3');
    });

    it('should skip patients who disabled exercise reminders', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            patient_id: 'pat-4',
            first_name: 'Lise',
            last_name: 'Berg',
            phone: '+4733333333',
            organization_id: 'org-1',
            clinic_name: 'Klinikk AS',
            portal_link: null,
            days_since_login: 14,
          },
        ],
      });
      // Patient preference check: disabled
      mockQuery.mockResolvedValueOnce({ rows: [{ exercise_reminder_enabled: false }] });

      const result = await checkExerciseInactivity(7);

      expect(result.count).toBe(0);
      expect(result.queued).toEqual([]);
    });

    it('should skip patients when org has exercise reminders disabled', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            patient_id: 'pat-5',
            first_name: 'Erik',
            last_name: 'Sund',
            phone: '+4744444444',
            organization_id: 'org-2',
            clinic_name: 'Annen Klinikk',
            portal_link: null,
            days_since_login: 20,
          },
        ],
      });
      // Patient preference: enabled (or no row)
      mockQuery.mockResolvedValueOnce({ rows: [] });
      // Org settings: disabled
      mockQuery.mockResolvedValueOnce({ rows: [{ enabled: 'false' }] });

      const result = await checkExerciseInactivity(7);

      expect(result.count).toBe(0);
      expect(result.queued).toEqual([]);
    });
  });

  // ─── checkFollowUpReminders ───────────────────────────────

  describe('checkFollowUpReminders', () => {
    it('should queue reminders for overdue follow-ups', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            followup_id: 'fu-1',
            due_date: '2026-03-20',
            patient_id: 'pat-6',
            first_name: 'Mari',
            last_name: 'Olsen',
            phone: '+4755555555',
            organization_id: 'org-1',
            clinic_name: 'Klinikk AS',
            clinic_phone: '+4798765432',
          },
        ],
      });
      // getTemplate -> fallback
      mockQuery.mockResolvedValueOnce({ rows: [] });
      // queueMessage INSERT
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'queue-6' }] });

      const result = await checkFollowUpReminders();

      expect(result.count).toBe(1);
      expect(result.queued[0].followupId).toBe('fu-1');
    });
  });

  // ─── checkBirthdayGreetings ───────────────────────────────

  describe('checkBirthdayGreetings', () => {
    it('should queue birthday greetings for patients with birthdays today', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            patient_id: 'pat-7',
            first_name: 'Anna',
            last_name: 'Vik',
            phone: '+4766666666',
            organization_id: 'org-1',
            clinic_name: 'Klinikk AS',
          },
        ],
      });
      // getTemplate -> fallback
      mockQuery.mockResolvedValueOnce({ rows: [] });
      // queueMessage INSERT
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'queue-7' }] });

      const result = await checkBirthdayGreetings();

      expect(result.count).toBe(1);
      expect(result.queued[0].patientId).toBe('pat-7');
    });

    it('should return empty when no birthdays today', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await checkBirthdayGreetings();

      expect(result.count).toBe(0);
      expect(result.queued).toEqual([]);
    });
  });

  // ─── checkDaysSinceVisit ──────────────────────────────────

  describe('checkDaysSinceVisit', () => {
    it('should queue recall messages for patients inactive N days', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            patient_id: 'pat-8',
            first_name: 'Jon',
            last_name: 'Berg',
            phone: '+4777777777',
            organization_id: 'org-1',
            clinic_name: 'Klinikk AS',
            clinic_phone: '+4798765432',
            last_visit: '2025-12-01',
            days_since_visit: 95,
          },
        ],
      });
      // getTemplate -> fallback
      mockQuery.mockResolvedValueOnce({ rows: [] });
      // queueMessage INSERT
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'queue-8' }] });

      const result = await checkDaysSinceVisit(90);

      expect(result.count).toBe(1);
      expect(result.queued[0].patientId).toBe('pat-8');
    });
  });

  // ─── runAutomatedChecks ───────────────────────────────────

  describe('runAutomatedChecks', () => {
    it('should run all checks and aggregate results', async () => {
      // Each check does: find query (empty) => count 0
      // 6 checks, each returns empty rows
      mockQuery.mockResolvedValue({ rows: [] });

      const results = await runAutomatedChecks();

      expect(results).toHaveProperty('appointment24h');
      expect(results).toHaveProperty('appointment1h');
      expect(results).toHaveProperty('exerciseInactive');
      expect(results).toHaveProperty('followupDue');
      expect(results).toHaveProperty('birthday');
      expect(results).toHaveProperty('daysSinceVisit');
      // All counts should be 0 when no rows returned
      expect(results.appointment24h.count).toBe(0);
      expect(results.appointment24h.error).toBeNull();
    });

    it('should capture errors per check without stopping others', async () => {
      // First check (24h) fails, rest return empty
      mockQuery
        .mockRejectedValueOnce(new Error('24h check failed'))
        .mockResolvedValue({ rows: [] });

      const results = await runAutomatedChecks();

      expect(results.appointment24h.error).toBe('24h check failed');
      // Other checks should still run
      expect(results.appointment1h.error).toBeNull();
    });
  });

  // ─── getAutomationStats ───────────────────────────────────

  describe('getAutomationStats', () => {
    it('should return aggregated stats for an organization', async () => {
      const statsRows = [
        {
          trigger_type: 'APPOINTMENT_24H',
          total_sent: '50',
          successful: '48',
          failed: '2',
          last_sent: '2026-03-27',
        },
        {
          trigger_type: 'BIRTHDAY',
          total_sent: '10',
          successful: '10',
          failed: '0',
          last_sent: '2026-03-27',
        },
      ];
      mockQuery.mockResolvedValueOnce({ rows: statsRows });

      const result = await getAutomationStats('org-1');

      expect(result).toHaveLength(2);
      expect(result[0].trigger_type).toBe('APPOINTMENT_24H');
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('FROM sent_messages'), [
        'org-1',
      ]);
    });

    it('should throw on database error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Stats failed'));

      await expect(getAutomationStats('org-1')).rejects.toThrow('Stats failed');
    });
  });
});
