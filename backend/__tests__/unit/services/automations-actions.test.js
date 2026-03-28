/**
 * Unit Tests for Automation Actions Service
 * Tests all 9 action types: SEND_SMS, SEND_EMAIL, CREATE_FOLLOW_UP, UPDATE_STATUS,
 * UPDATE_LIFECYCLE, NOTIFY_STAFF, ADD_TAG, CREATE_TASK, SEND_BOOKING_LINK
 * Also tests helper functions: replaceVariables, calculateDueDate, getActionPreview
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

// Mock SMS/Email provider layer (used by communications.js)
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

// Mock websocket used by notifications.js
jest.unstable_mockModule('../../../src/services/communication/websocket.js', () => ({
  sendToUser: jest.fn(),
  default: { sendToUser: jest.fn() },
}));

// Mock notifications service
const mockCreateNotification = jest.fn().mockResolvedValue({ id: 'notif-1' });

jest.unstable_mockModule('../../../src/services/communication/notifications.js', () => ({
  createNotification: mockCreateNotification,
  NOTIFICATION_TYPES: {
    STAFF_NOTIFICATION: 'STAFF_NOTIFICATION',
    RECALL_ALERT: 'RECALL_ALERT',
    NEW_LEAD: 'NEW_LEAD',
    OVERDUE_PATIENT: 'OVERDUE_PATIENT',
    EXERCISE_NONCOMPLIANCE: 'EXERCISE_NONCOMPLIANCE',
    APPOINTMENT_REMINDER: 'APPOINTMENT_REMINDER',
    SYSTEM: 'SYSTEM',
    WORKFLOW: 'WORKFLOW',
    SECURITY_ALERT: 'SECURITY_ALERT',
    AI_RETRAINING_READY: 'AI_RETRAINING_READY',
    SYSTEM_ERROR: 'SYSTEM_ERROR',
    BOOKING_REQUEST: 'BOOKING_REQUEST',
    BOOKING_CONFIRMED: 'BOOKING_CONFIRMED',
    BOOKING_REJECTED: 'BOOKING_REJECTED',
    NEW_PATIENT_MESSAGE: 'NEW_PATIENT_MESSAGE',
  },
  default: {
    createNotification: mockCreateNotification,
    NOTIFICATION_TYPES: { STAFF_NOTIFICATION: 'STAFF_NOTIFICATION' },
  },
}));

// Import the module under test AFTER all mocks
let executeAction,
  executeActions,
  ACTION_TYPES,
  replaceVariables,
  calculateDueDate,
  getActionPreview;

beforeAll(async () => {
  const mod = await import('../../../src/services/automations/actions.js');
  executeAction = mod.executeAction;
  executeActions = mod.executeActions;
  ACTION_TYPES = mod.ACTION_TYPES;
  replaceVariables = mod.replaceVariables;
  calculateDueDate = mod.calculateDueDate;
  getActionPreview = mod.getActionPreview;
});

beforeEach(() => {
  jest.clearAllMocks();
  mockQuery.mockResolvedValue({ rows: [{ id: 'row-1' }], rowCount: 1 });
  mockSmsSend.mockResolvedValue({ externalId: 'sms-ext-1', method: 'mock' });
  mockEmailSend.mockResolvedValue({ messageId: 'email-ext-1' });
  mockCreateNotification.mockResolvedValue({ id: 'notif-1' });
});

// =============================================================================
// HELPER: shared fixtures
// =============================================================================

const ORG_ID = 'org-test-001';

const PATIENT = {
  id: 'patient-1',
  first_name: 'Ola',
  last_name: 'Nordmann',
  email: 'ola@example.com',
  phone: '+4799887766',
  last_visit_date: '2026-01-15',
  total_visits: 12,
};

// =============================================================================
// ACTION_TYPES constant
// =============================================================================

describe('ACTION_TYPES', () => {
  test('exports all 9 expected action type keys', () => {
    const expectedKeys = [
      'SEND_SMS',
      'SEND_EMAIL',
      'CREATE_FOLLOW_UP',
      'UPDATE_STATUS',
      'UPDATE_LIFECYCLE',
      'NOTIFY_STAFF',
      'ADD_TAG',
      'CREATE_TASK',
      'SEND_BOOKING_LINK',
    ];
    for (const key of expectedKeys) {
      expect(ACTION_TYPES[key]).toBe(key);
    }
  });
});

// =============================================================================
// SEND_SMS action
// =============================================================================

describe('executeAction — SEND_SMS', () => {
  test('sends SMS and returns communicationId when patient has phone', async () => {
    const result = await executeAction(
      ORG_ID,
      { type: ACTION_TYPES.SEND_SMS, message: 'Hei {firstName}, dette er en påminnelse.' },
      PATIENT,
      null
    );

    expect(result.success).toBe(true);
    expect(result.communicationId).toBeDefined();
    expect(mockSmsSend).toHaveBeenCalledTimes(1);
    const [phone, content] = mockSmsSend.mock.calls[0];
    expect(phone).toBe(PATIENT.phone);
    expect(content).toContain('Ola');
  });

  test('returns failure without sending when patient has no phone', async () => {
    const result = await executeAction(
      ORG_ID,
      { type: ACTION_TYPES.SEND_SMS, message: 'Test' },
      { ...PATIENT, phone: null },
      null
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe('No phone number');
    expect(mockSmsSend).not.toHaveBeenCalled();
  });

  test('returns failure and logs error when SMS provider throws', async () => {
    mockSmsSend.mockRejectedValueOnce(new Error('Provider unavailable'));

    const result = await executeAction(
      ORG_ID,
      { type: ACTION_TYPES.SEND_SMS, message: 'Test SMS' },
      PATIENT,
      null
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe('Provider unavailable');
  });
});

// =============================================================================
// SEND_EMAIL action
// =============================================================================

describe('executeAction — SEND_EMAIL', () => {
  test('sends email and returns communicationId when patient has email', async () => {
    const result = await executeAction(
      ORG_ID,
      {
        type: ACTION_TYPES.SEND_EMAIL,
        subject: 'Hei {firstName}',
        body: 'Vi ønsker deg velkommen tilbake.',
      },
      PATIENT,
      null
    );

    expect(result.success).toBe(true);
    expect(result.communicationId).toBeDefined();
    expect(mockEmailSend).toHaveBeenCalledTimes(1);
  });

  test('returns failure without sending when patient has no email', async () => {
    const result = await executeAction(
      ORG_ID,
      { type: ACTION_TYPES.SEND_EMAIL, subject: 'Test', body: 'Body' },
      { ...PATIENT, email: null },
      null
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe('No email address');
    expect(mockEmailSend).not.toHaveBeenCalled();
  });

  test('returns failure and logs error when email provider throws', async () => {
    mockEmailSend.mockRejectedValueOnce(new Error('SMTP timeout'));

    const result = await executeAction(
      ORG_ID,
      { type: ACTION_TYPES.SEND_EMAIL, subject: 'Test', body: 'Body' },
      PATIENT,
      null
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe('SMTP timeout');
  });
});

// =============================================================================
// CREATE_FOLLOW_UP action
// =============================================================================

describe('executeAction — CREATE_FOLLOW_UP', () => {
  test('inserts follow_up row with defaults and returns success', async () => {
    const result = await executeAction(
      ORG_ID,
      { type: ACTION_TYPES.CREATE_FOLLOW_UP },
      PATIENT,
      null
    );

    expect(result.success).toBe(true);
    expect(mockQuery).toHaveBeenCalledTimes(1);
    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toContain('INSERT INTO follow_ups');
    expect(params[0]).toBe(ORG_ID);
    expect(params[1]).toBe(PATIENT.id);
    // Default follow_up_type = 'CUSTOM', priority = 'MEDIUM', auto_generated = true
    expect(params[2]).toBe('CUSTOM');
    expect(params[4]).toBe('MEDIUM');
  });

  test('uses custom due_in_days, follow_up_type and priority from action', async () => {
    await executeAction(
      ORG_ID,
      {
        type: ACTION_TYPES.CREATE_FOLLOW_UP,
        due_in_days: 14,
        follow_up_type: 'RECALL',
        reason: 'Planlagt recall for {firstName}',
        priority: 'HIGH',
        assigned_to: 'user-42',
      },
      PATIENT,
      null
    );

    const [, params] = mockQuery.mock.calls[0];
    expect(params[2]).toBe('RECALL');
    expect(params[3]).toContain('Ola'); // reason with variable replaced
    expect(params[4]).toBe('HIGH');
    expect(params[7]).toBe('user-42');
  });
});

// =============================================================================
// UPDATE_STATUS action
// =============================================================================

describe('executeAction — UPDATE_STATUS', () => {
  test('updates patient status and returns success', async () => {
    const result = await executeAction(
      ORG_ID,
      { type: ACTION_TYPES.UPDATE_STATUS, value: 'INACTIVE' },
      PATIENT,
      null
    );

    expect(result.success).toBe(true);
    expect(mockQuery).toHaveBeenCalledTimes(1);
    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toContain('UPDATE patients SET status');
    expect(params[0]).toBe('INACTIVE');
    expect(params[1]).toBe(PATIENT.id);
    expect(params[2]).toBe(ORG_ID);
  });
});

// =============================================================================
// UPDATE_LIFECYCLE action
// =============================================================================

describe('executeAction — UPDATE_LIFECYCLE', () => {
  test('updates patient lifecycle_stage and returns success', async () => {
    const result = await executeAction(
      ORG_ID,
      { type: ACTION_TYPES.UPDATE_LIFECYCLE, value: 'CHURNED' },
      PATIENT,
      null
    );

    expect(result.success).toBe(true);
    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toContain('UPDATE patients SET lifecycle_stage');
    expect(params[0]).toBe('CHURNED');
  });
});

// =============================================================================
// NOTIFY_STAFF action
// =============================================================================

describe('executeAction — NOTIFY_STAFF', () => {
  test('queries staff by default roles and creates follow_up + notification for each', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 'staff-1' }, { id: 'staff-2' }] }) // staff query
      .mockResolvedValue({ rows: [], rowCount: 1 }); // follow_up inserts

    const result = await executeAction(
      ORG_ID,
      { type: ACTION_TYPES.NOTIFY_STAFF, message: 'Ny pasient: {fullName}' },
      PATIENT,
      null
    );

    expect(result.success).toBe(true);
    expect(result.notifiedCount).toBe(2);
    // First call = SELECT staff; next 2 calls = INSERT follow_up for each staff
    expect(mockQuery).toHaveBeenCalledTimes(3);
    expect(mockCreateNotification).toHaveBeenCalledTimes(2);
  });

  test('queries staff by specific staff_ids when provided', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'staff-99' }] }).mockResolvedValue({ rows: [] });

    await executeAction(
      ORG_ID,
      {
        type: ACTION_TYPES.NOTIFY_STAFF,
        message: 'Alert',
        staff_ids: ['staff-99'],
      },
      PATIENT,
      null
    );

    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toContain('AND id = ANY');
    expect(params[1]).toEqual(['staff-99']);
  });

  test('returns notifiedCount 0 when no staff matched', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const result = await executeAction(
      ORG_ID,
      { type: ACTION_TYPES.NOTIFY_STAFF, message: 'Alert' },
      PATIENT,
      null
    );

    expect(result.success).toBe(true);
    expect(result.notifiedCount).toBe(0);
    expect(mockCreateNotification).not.toHaveBeenCalled();
  });
});

// =============================================================================
// ADD_TAG action
// =============================================================================

describe('executeAction — ADD_TAG', () => {
  test('updates patient tags and returns success using action.tag', async () => {
    const result = await executeAction(
      ORG_ID,
      { type: ACTION_TYPES.ADD_TAG, tag: 'vip' },
      PATIENT,
      null
    );

    expect(result.success).toBe(true);
    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toContain('UPDATE patients');
    expect(sql).toContain('tags');
    expect(params[0]).toBe(JSON.stringify(['vip']));
  });

  test('falls back to action.value when action.tag is not set', async () => {
    await executeAction(
      ORG_ID,
      { type: ACTION_TYPES.ADD_TAG, value: 'recall-candidate' },
      PATIENT,
      null
    );

    const [, params] = mockQuery.mock.calls[0];
    expect(params[0]).toBe(JSON.stringify(['recall-candidate']));
  });
});

// =============================================================================
// CREATE_TASK action
// =============================================================================

describe('executeAction — CREATE_TASK', () => {
  test('inserts follow_up task row with defaults and returns success', async () => {
    const result = await executeAction(ORG_ID, { type: ACTION_TYPES.CREATE_TASK }, PATIENT, null);

    expect(result.success).toBe(true);
    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toContain('INSERT INTO follow_ups');
    expect(params[2]).toBe('CUSTOM'); // default task_type
    expect(params[4]).toBe('MEDIUM'); // default priority
  });

  test('uses custom task_type, description, priority and assigned_to', async () => {
    await executeAction(
      ORG_ID,
      {
        type: ACTION_TYPES.CREATE_TASK,
        task_type: 'CALL',
        description: 'Ring {firstName} for oppfølging',
        priority: 'HIGH',
        due_in_days: 3,
        assigned_to: 'user-7',
      },
      PATIENT,
      null
    );

    const [, params] = mockQuery.mock.calls[0];
    expect(params[2]).toBe('CALL');
    expect(params[3]).toContain('Ola');
    expect(params[4]).toBe('HIGH');
    expect(params[7]).toBe('user-7');
  });
});

// =============================================================================
// SEND_BOOKING_LINK action
// =============================================================================

describe('executeAction — SEND_BOOKING_LINK', () => {
  test('sends SMS with generated booking link when patient has phone', async () => {
    const result = await executeAction(
      ORG_ID,
      { type: ACTION_TYPES.SEND_BOOKING_LINK, message: 'Bestill time: {bookingLink}' },
      PATIENT,
      null
    );

    expect(result.success).toBe(true);
    expect(result.bookingLink).toBeDefined();
    expect(result.bookingLink).toContain('/portal/book?patient_id=patient-1');
    expect(result.bookingLink).toMatch(/token=[a-f0-9]{32}/);
    expect(mockSmsSend).toHaveBeenCalledTimes(1);
    const [, content] = mockSmsSend.mock.calls[0];
    expect(content).toContain('/portal/book');
  });

  test('sends email with booking link when patient has no phone but has email', async () => {
    const result = await executeAction(
      ORG_ID,
      { type: ACTION_TYPES.SEND_BOOKING_LINK, message: 'Bestill time: {bookingLink}' },
      { ...PATIENT, phone: null },
      null
    );

    expect(result.success).toBe(true);
    expect(result.bookingLink).toContain('/portal/book');
    expect(mockSmsSend).not.toHaveBeenCalled();
    expect(mockEmailSend).toHaveBeenCalledTimes(1);
  });

  test('returns failure when patient has neither phone nor email', async () => {
    const result = await executeAction(
      ORG_ID,
      { type: ACTION_TYPES.SEND_BOOKING_LINK, message: 'Bestill: {bookingLink}' },
      { id: 'patient-2', first_name: 'Kari', last_name: 'Hansen' },
      null
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe('No contact method');
    expect(mockSmsSend).not.toHaveBeenCalled();
    expect(mockEmailSend).not.toHaveBeenCalled();
  });

  test('returns failure when communication provider throws', async () => {
    mockSmsSend.mockRejectedValueOnce(new Error('Gateway down'));

    const result = await executeAction(
      ORG_ID,
      { type: ACTION_TYPES.SEND_BOOKING_LINK, message: 'Link: {bookingLink}' },
      PATIENT,
      null
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe('Gateway down');
  });
});

// =============================================================================
// Unknown action type
// =============================================================================

describe('executeAction — unknown type', () => {
  test('returns failure with error message for unknown action type', async () => {
    const result = await executeAction(ORG_ID, { type: 'DOES_NOT_EXIST' }, PATIENT, null);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Unknown action type');
  });
});

// =============================================================================
// executeActions (multi-action orchestrator)
// =============================================================================

describe('executeActions', () => {
  test('executes all actions in sequence and returns array of results', async () => {
    const workflow = {
      actions: [
        { type: ACTION_TYPES.UPDATE_STATUS, value: 'ACTIVE' },
        { type: ACTION_TYPES.ADD_TAG, tag: 'returning' },
      ],
    };

    const results = await executeActions(ORG_ID, workflow, PATIENT);

    expect(results).toHaveLength(2);
    expect(results[0].success).toBe(true);
    expect(results[1].success).toBe(true);
    expect(mockQuery).toHaveBeenCalledTimes(2);
  });

  test('returns empty array when workflow has no actions', async () => {
    const results = await executeActions(ORG_ID, {}, PATIENT);
    expect(results).toEqual([]);
  });
});

// =============================================================================
// replaceVariables helper
// =============================================================================

describe('replaceVariables', () => {
  test('replaces English variable placeholders with patient data', () => {
    const template = 'Hello {firstName} {lastName}, your email is {email}';
    const result = replaceVariables(template, PATIENT);
    expect(result).toBe('Hello Ola Nordmann, your email is ola@example.com');
  });

  test('replaces Norwegian variable placeholders', () => {
    const template = 'Hei {fornavn} {etternavn}, din telefon er {telefon}';
    const result = replaceVariables(template, PATIENT);
    expect(result).toBe('Hei Ola Nordmann, din telefon er +4799887766');
  });

  test('replaces {bookingLink} and {bestillingslenke} with bookingLink field', () => {
    const patient = { ...PATIENT, bookingLink: 'https://portal/book?patient_id=1' };
    expect(replaceVariables('{bookingLink}', patient)).toBe('https://portal/book?patient_id=1');
    expect(replaceVariables('{bestillingslenke}', patient)).toBe(
      'https://portal/book?patient_id=1'
    );
  });

  test('returns empty string when template is null or undefined', () => {
    expect(replaceVariables(null, PATIENT)).toBe('');
    expect(replaceVariables(undefined, PATIENT)).toBe('');
  });

  test('handles missing patient fields gracefully with empty strings', () => {
    const result = replaceVariables('{firstName} {lastName}', {});
    expect(result).toBe(' ');
  });

  test('replaces {totalVisits} with numeric value', () => {
    const result = replaceVariables('Du har hatt {totalVisits} besøk', PATIENT);
    expect(result).toBe('Du har hatt 12 besøk');
  });
});

// =============================================================================
// calculateDueDate helper
// =============================================================================

describe('calculateDueDate', () => {
  test('returns a date string in YYYY-MM-DD format', () => {
    const result = calculateDueDate(7);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('calculates correct number of days in the future', () => {
    const today = new Date();
    const expected = new Date(today);
    expected.setDate(expected.getDate() + 10);
    const expectedStr = expected.toISOString().split('T')[0];

    expect(calculateDueDate(10)).toBe(expectedStr);
  });

  test('calculates correct date for 0 days (today)', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(calculateDueDate(0)).toBe(today);
  });
});

// =============================================================================
// getActionPreview helper
// =============================================================================

describe('getActionPreview', () => {
  test('returns SMS preview with recipient and resolved message', () => {
    const preview = getActionPreview(
      { type: ACTION_TYPES.SEND_SMS, message: 'Hei {firstName}' },
      PATIENT
    );
    expect(preview.recipient).toBe(PATIENT.phone);
    expect(preview.message).toContain('Ola');
  });

  test('returns email preview with subject and body resolved', () => {
    const preview = getActionPreview(
      { type: ACTION_TYPES.SEND_EMAIL, subject: 'Hei {firstName}', body: 'Velkommen {lastName}' },
      PATIENT
    );
    expect(preview.recipient).toBe(PATIENT.email);
    expect(preview.subject).toContain('Ola');
    expect(preview.body).toContain('Nordmann');
  });

  test('returns follow-up preview with type, reason and due_in_days', () => {
    const preview = getActionPreview(
      {
        type: ACTION_TYPES.CREATE_FOLLOW_UP,
        follow_up_type: 'RECALL',
        reason: 'Ring {firstName}',
        due_in_days: 30,
      },
      PATIENT
    );
    expect(preview.type).toBe('RECALL');
    expect(preview.reason).toContain('Ola');
    expect(preview.due_in_days).toBe(30);
  });

  test('returns new_value for UPDATE_STATUS and UPDATE_LIFECYCLE', () => {
    expect(
      getActionPreview({ type: ACTION_TYPES.UPDATE_STATUS, value: 'INACTIVE' }, PATIENT)
    ).toEqual({ new_value: 'INACTIVE' });
    expect(
      getActionPreview({ type: ACTION_TYPES.UPDATE_LIFECYCLE, value: 'CHURNED' }, PATIENT)
    ).toEqual({ new_value: 'CHURNED' });
  });

  test('returns tag for ADD_TAG preview', () => {
    const preview = getActionPreview({ type: ACTION_TYPES.ADD_TAG, tag: 'priority' }, PATIENT);
    expect(preview.tag).toBe('priority');
  });

  test('returns raw action for unknown type', () => {
    const action = { type: 'UNKNOWN_XYZ', foo: 'bar' };
    const preview = getActionPreview(action, PATIENT);
    expect(preview).toEqual(action);
  });
});
