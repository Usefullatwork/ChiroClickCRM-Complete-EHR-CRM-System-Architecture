/**
 * Unit Tests for Appointment Reminders Service
 * Tests scheduling, processing, cancellation, org settings, and patient preferences
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

const mockSendSMS = jest.fn();
const mockSendEmail = jest.fn();

jest.unstable_mockModule('../../../src/services/communications.js', () => ({
  sendSMS: mockSendSMS,
  sendEmail: mockSendEmail,
}));

// Import after mocking
const { scheduleReminder, processReminders, cancelReminders } =
  await import('../../../src/services/appointmentReminders.js');

describe('Appointment Reminders Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create reminder entries for a future appointment', async () => {
    // Org setting check — no setting row means proceed
    mockQuery.mockResolvedValueOnce({ rows: [{}] });
    // INSERT for 24h reminder
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 'rem-1', hours_before: 24, status: 'PENDING' }],
    });
    // INSERT for 48h reminder
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 'rem-2', hours_before: 48, status: 'PENDING' }],
    });

    const futureDate = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
    const appointment = {
      id: 'apt-1',
      organization_id: 'org-1',
      patient_id: 'pat-1',
      start_time: futureDate,
    };

    const result = await scheduleReminder(appointment, [24, 48]);

    expect(result).toHaveLength(2);
    // First call is org settings, second/third are INSERTs
    const insertCall = mockQuery.mock.calls[1];
    expect(insertCall[0]).toContain('INSERT INTO appointment_reminders');
    expect(insertCall[1]).toContain('apt-1');
  });

  it('should skip past send times', async () => {
    // Org setting check
    mockQuery.mockResolvedValueOnce({ rows: [{}] });

    const pastDate = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const appointment = {
      id: 'apt-2',
      organization_id: 'org-1',
      patient_id: 'pat-1',
      start_time: pastDate,
    };

    const result = await scheduleReminder(appointment, [24]);

    expect(result).toHaveLength(0);
    // Only the org settings query should be called, no INSERT
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  it('should return empty when org setting disabled', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ enabled: 'false' }] });

    const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    const appointment = {
      id: 'apt-3',
      organization_id: 'org-1',
      patient_id: 'pat-1',
      start_time: futureDate,
    };

    const result = await scheduleReminder(appointment, [24]);

    expect(result).toEqual([]);
    // Only org settings query, no INSERT
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  it('should send SMS for due reminders', async () => {
    // SELECT due reminders
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 'rem-1',
          patient_id: 'pat-1',
          reminder_type: 'SMS',
          organization_id: 'org-1',
          appointment_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          appointment_type: 'consultation',
          patient_first_name: 'Ola',
          patient_last_name: 'Nordmann',
          patient_phone: '+4712345678',
          patient_email: null,
        },
      ],
    });
    // Patient prefs query — no prefs row means proceed
    mockQuery.mockResolvedValueOnce({ rows: [] });
    // sendSMS resolves
    mockSendSMS.mockResolvedValueOnce({ id: 'sms-1' });
    // UPDATE to SENT
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'rem-1' }] });

    const result = await processReminders();

    expect(result.sent).toBe(1);
    expect(result.failed).toBe(0);
    expect(mockSendSMS).toHaveBeenCalledTimes(1);
    expect(mockSendSMS.mock.calls[0][1].recipient_phone).toBe('+4712345678');
    // Verify UPDATE to SENT was called
    const updateCall = mockQuery.mock.calls[2];
    expect(updateCall[0]).toContain("status = 'SENT'");
  });

  it('should skip patients who opted out', async () => {
    // SELECT due reminders
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 'rem-2',
          patient_id: 'pat-2',
          reminder_type: 'SMS',
          organization_id: 'org-1',
          appointment_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          appointment_type: 'consultation',
          patient_first_name: 'Kari',
          patient_last_name: 'Hansen',
          patient_phone: '+4798765432',
          patient_email: null,
        },
      ],
    });
    // Patient prefs — opted out
    mockQuery.mockResolvedValueOnce({
      rows: [{ reminder_enabled: false, sms_enabled: true, email_enabled: true }],
    });
    // UPDATE to CANCELLED
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'rem-2' }] });

    const result = await processReminders();

    // Should not have sent anything
    expect(mockSendSMS).not.toHaveBeenCalled();
    // Should have cancelled the reminder
    const cancelCall = mockQuery.mock.calls[2];
    expect(cancelCall[0]).toContain("status = 'CANCELLED'");
    expect(cancelCall[0]).toContain('Patient opted out');
  });

  it('should cancel pending reminders for an appointment', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 'rem-1' }, { id: 'rem-2' }],
    });

    const count = await cancelReminders('apt-cancel-1');

    expect(count).toBe(2);
    expect(mockQuery).toHaveBeenCalledTimes(1);
    const sqlCall = mockQuery.mock.calls[0];
    expect(sqlCall[0]).toContain("SET status = 'CANCELLED'");
    expect(sqlCall[1]).toContain('apt-cancel-1');
  });
});
