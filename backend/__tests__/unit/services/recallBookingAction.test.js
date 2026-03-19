/**
 * Unit Tests for Recall Booking Action + Preference Checks
 * Tests SEND_BOOKING_LINK action type, recall pipeline booking links,
 * and exercise inactivity preference checks.
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
  default: {
    query: mockQuery,
    transaction: jest.fn(),
    getClient: jest.fn(),
    healthCheck: jest.fn().mockResolvedValue(true),
    closePool: jest.fn(),
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

// Mock SMS/email providers used by communications.js
const mockSmsSend = jest.fn().mockResolvedValue({ externalId: 'sms-ext-1', method: 'mock' });
const mockEmailSend = jest.fn().mockResolvedValue({ messageId: 'email-ext-1' });

jest.unstable_mockModule('../../../src/services/providers/smsProvider.js', () => ({
  createSmsProvider: () => ({
    name: 'mock',
    send: mockSmsSend,
    checkConnection: jest.fn().mockResolvedValue({ connected: true }),
  }),
}));

jest.unstable_mockModule('../../../src/services/providers/emailProvider.js', () => ({
  createEmailProvider: () => ({
    name: 'mock',
    send: mockEmailSend,
    checkConnection: jest.fn().mockResolvedValue({ connected: true }),
  }),
}));

jest.unstable_mockModule('../../../src/config/constants.js', () => ({
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DEFAULT_PAGE_SIZE_LARGE: 50,
}));

const mockCreateNotification = jest.fn().mockResolvedValue({ id: 'notif-1' });
const mockNotifyByRole = jest.fn().mockResolvedValue([]);

jest.unstable_mockModule('../../../src/services/notifications.js', () => ({
  createNotification: mockCreateNotification,
  notifyByRole: mockNotifyByRole,
  NOTIFICATION_TYPES: {
    RECALL_ALERT: 'RECALL_ALERT',
    STAFF_NOTIFICATION: 'STAFF_NOTIFICATION',
  },
  default: {
    createNotification: mockCreateNotification,
    notifyByRole: mockNotifyByRole,
    NOTIFICATION_TYPES: {
      RECALL_ALERT: 'RECALL_ALERT',
      STAFF_NOTIFICATION: 'STAFF_NOTIFICATION',
    },
  },
}));

let executeAction, ACTION_TYPES, processRecalls, checkExerciseInactivity;

beforeAll(async () => {
  const actions = await import('../../../src/services/automations/actions.js');
  executeAction = actions.executeAction;
  ACTION_TYPES = actions.ACTION_TYPES;

  const recall = await import('../../../src/services/recallEngine.js');
  processRecalls = recall.processRecalls;

  const comms = await import('../../../src/services/automatedComms.js');
  checkExerciseInactivity = comms.checkExerciseInactivity;
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('SEND_BOOKING_LINK action', () => {
  const orgId = 'org-test-001';

  test('sends SMS with generated booking link when patient has phone', async () => {
    // Ensure SMS provider mock returns valid result
    mockSmsSend.mockResolvedValue({ externalId: 'sms-ext-1', method: 'mock' });
    // Mock the sendSMS DB insert (communications.js logs sent messages)
    mockQuery.mockResolvedValue({ rows: [{ id: 'comm-1' }], rowCount: 1 });

    const result = await executeAction(
      orgId,
      {
        type: ACTION_TYPES.SEND_BOOKING_LINK,
        message: 'Bestill ny time her: {bookingLink}',
      },
      {
        id: 'patient-1',
        first_name: 'Ola',
        last_name: 'Nordmann',
        phone: '+4799887766',
      }
    );

    expect(result.success).toBe(true);
    expect(result.bookingLink).toBeDefined();
    expect(result.bookingLink).toContain('/portal/book?patient_id=patient-1');
    expect(result.bookingLink).toMatch(/&token=[a-f0-9]+/);

    // Verify SMS provider was called (via communicationService.sendSMS → smsProvider.send)
    // smsProvider.send(phone, content) — content is the second arg
    expect(mockSmsSend).toHaveBeenCalled();
    const smsCall = mockSmsSend.mock.calls[0];
    expect(smsCall[1]).toContain('/portal/book');
  });

  test('returns failure when patient has no phone or email', async () => {
    const result = await executeAction(
      orgId,
      {
        type: ACTION_TYPES.SEND_BOOKING_LINK,
        message: 'Bestill her: {bookingLink}',
      },
      {
        id: 'patient-2',
        first_name: 'Kari',
        last_name: 'Hansen',
      }
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe('No contact method');
    expect(mockSmsSend).not.toHaveBeenCalled();
    expect(mockEmailSend).not.toHaveBeenCalled();
  });

  test('ACTION_TYPES includes SEND_BOOKING_LINK', () => {
    expect(ACTION_TYPES.SEND_BOOKING_LINK).toBe('SEND_BOOKING_LINK');
  });
});

describe('processRecalls booking link integration', () => {
  test('sends booking link when org setting is enabled and patient has phone', async () => {
    // Call sequence for processRecalls:
    // 1. SELECT due recalls (main query)
    // 2. createNotification (mocked separately)
    // 3. SELECT org settings for booking link
    // 4. SELECT patient comm prefs (may throw)
    // 5. executeAction → sendSMS → DB queries

    let callCount = 0;
    mockQuery.mockImplementation((sql) => {
      callCount++;
      // Main recall query
      if (sql.includes('follow_up_type') && sql.includes('RECALL') && sql.includes('PENDING')) {
        return {
          rows: [
            {
              id: 'recall-1',
              organization_id: 'org-1',
              patient_id: 'patient-1',
              reason: 'Recall: 90 dager',
              due_date: '2026-01-01',
              first_name: 'Ola',
              last_name: 'Nordmann',
              phone: '+4799887766',
              email: null,
              preferred_therapist_id: 'user-1',
            },
          ],
        };
      }
      // Org settings query for booking link
      if (sql.includes('recall_booking_link_enabled')) {
        return { rows: [{ enabled: 'true' }] };
      }
      // Patient comm prefs (table may not exist — throw)
      if (sql.includes('patient_communication_preferences')) {
        const err = new Error('relation "patient_communication_preferences" does not exist');
        throw err;
      }
      // Default — return empty for any other queries (sendSMS internals)
      return { rows: [{ id: 'comm-1' }], rowCount: 1 };
    });

    const result = await processRecalls();

    expect(result.total).toBe(1);
    expect(result.bookingSent).toBe(1);
    // Verify SMS provider was called for the booking link
    expect(mockSmsSend).toHaveBeenCalled();
  });

  test('skips booking link when patient recall_enabled preference is false', async () => {
    mockQuery.mockImplementation((sql) => {
      if (sql.includes('follow_up_type') && sql.includes('RECALL') && sql.includes('PENDING')) {
        return {
          rows: [
            {
              id: 'recall-2',
              organization_id: 'org-1',
              patient_id: 'patient-2',
              reason: 'Recall: 90 dager',
              due_date: '2026-01-01',
              first_name: 'Kari',
              last_name: 'Hansen',
              phone: '+4799001122',
              email: 'kari@example.com',
              preferred_therapist_id: 'user-1',
            },
          ],
        };
      }
      if (sql.includes('recall_booking_link_enabled')) {
        return { rows: [{ enabled: 'true' }] };
      }
      if (sql.includes('patient_communication_preferences')) {
        return { rows: [{ recall_enabled: false }] };
      }
      return { rows: [{ id: 'comm-1' }], rowCount: 1 };
    });

    const result = await processRecalls();

    expect(result.total).toBe(1);
    expect(result.bookingSent).toBe(0);
    // SMS should NOT be called for booking (only notification was sent to practitioner)
    expect(mockSmsSend).not.toHaveBeenCalled();
  });
});

describe('checkExerciseInactivity preference checks', () => {
  test('skips patient when exercise_reminder_enabled preference is false', async () => {
    mockQuery.mockImplementation((sql) => {
      // Main exercise inactivity query
      if (sql.includes('exercise_programs')) {
        return {
          rows: [
            {
              patient_id: 'patient-3',
              first_name: 'Per',
              last_name: 'Olsen',
              phone: '+4799334455',
              organization_id: 'org-1',
              clinic_name: 'Klinikk A',
              portal_link: 'https://portal.example.com',
              days_since_login: 10,
            },
          ],
        };
      }
      // Patient preference — exercise reminders disabled
      if (sql.includes('exercise_reminder_enabled')) {
        return { rows: [{ exercise_reminder_enabled: false }] };
      }
      // Message template query
      if (sql.includes('message_templates')) {
        return { rows: [] };
      }
      // Queue insert — should NOT be called
      if (sql.includes('communication_queue')) {
        return { rows: [{ id: 'queue-1' }] };
      }
      return { rows: [] };
    });

    const result = await checkExerciseInactivity(7);

    // No messages should have been queued
    expect(result.count).toBe(0);
    // Verify no INSERT into communication_queue happened
    const insertCalls = mockQuery.mock.calls.filter(
      ([sql]) => typeof sql === 'string' && sql.includes('INSERT INTO communication_queue')
    );
    expect(insertCalls.length).toBe(0);
  });
});
