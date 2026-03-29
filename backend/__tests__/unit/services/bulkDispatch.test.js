/**
 * Unit Tests for Bulk Dispatch Service
 * Tests queue creation, processing, rate limiting, retry logic, and batch statistics
 */

import { jest } from '@jest/globals';

// ---- Mocks ----
let queryImpl = () => Promise.resolve({ rows: [] });
const mockQuery = (...args) => queryImpl(...args);

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

let sendSMSImpl = () => Promise.resolve({ id: 'sms-1', external_id: 'ext-sms-1' });
let sendEmailImpl = () => Promise.resolve({ id: 'email-1', external_id: 'ext-email-1' });

jest.unstable_mockModule('../../../src/services/communication/communications.js', () => ({
  sendSMS: (...args) => sendSMSImpl(...args),
  sendEmail: (...args) => sendEmailImpl(...args),
}));

jest.unstable_mockModule('../../../src/services/communication/bulkTemplating.js', () => ({
  personalizeTemplate: jest.fn((tpl, _p, _c) => tpl || ''),
}));

let uuidCounter = 0;
jest.unstable_mockModule('uuid', () => ({
  v4: () => `test-uuid-${++uuidCounter}`,
}));

// ---- Import under test ----
const { queueBulkCommunications, processCommunicationQueue } =
  await import('../../../src/services/communication/bulkDispatch.js');

// ---- Helpers ----
const ORG_ID = 'org-test-001';

function makePatient(overrides = {}) {
  return {
    id: 'patient-1',
    first_name: 'Ola',
    last_name: 'Nordmann',
    email: 'ola@example.com',
    phone: '+4712345678',
    date_of_birth: '1990-01-15',
    last_visit_date: '2026-03-01',
    status: 'active',
    consent_sms: true,
    consent_email: true,
    ...overrides,
  };
}

// ---- Tests ----

describe('bulkDispatch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    uuidCounter = 0;
    queryImpl = () => Promise.resolve({ rows: [] });
    sendSMSImpl = () => Promise.resolve({ id: 'sms-1', external_id: 'ext-sms-1' });
    sendEmailImpl = () => Promise.resolve({ id: 'email-1', external_id: 'ext-email-1' });
  });

  // ─── queueBulkCommunications ──────────────────────────────

  describe('queueBulkCommunications', () => {
    it('should queue SMS for patients with valid phone and consent', async () => {
      const patient = makePatient();
      let callCount = 0;
      queryImpl = async (sql) => {
        callCount++;
        if (sql.includes('message_templates')) {
          return {
            rows: [{ id: 'tpl-1', subject: 'Hei', body: 'Hello {firstName}', type: 'SMS' }],
          };
        }
        if (sql.includes('FROM patients')) {
          return { rows: [patient] };
        }
        return { rows: [] };
      };

      const result = await queueBulkCommunications(ORG_ID, ['patient-1'], 'tpl-1', 'SMS', {
        userId: 'user-1',
      });

      expect(result.batchId).toBe('test-uuid-1');
      expect(result.status).toBe('PENDING');
      expect(result.totalCount).toBe(1);
      expect(result.skippedCount).toBe(0);
    });

    it('should skip patients without phone for SMS', async () => {
      const patient = makePatient({ phone: null });
      queryImpl = async (sql) => {
        if (sql.includes('message_templates')) {
          return { rows: [{ id: 'tpl-1', subject: '', body: 'Hello', type: 'SMS' }] };
        }
        if (sql.includes('FROM patients')) {
          return { rows: [patient] };
        }
        return { rows: [] };
      };

      const result = await queueBulkCommunications(ORG_ID, ['patient-1'], 'tpl-1', 'SMS');

      expect(result.totalCount).toBe(0);
      expect(result.skippedCount).toBe(1);
      expect(result.skippedPatients[0].reason).toContain('SMS');
    });

    it('should skip patients without email consent for EMAIL', async () => {
      const patient = makePatient({ consent_email: false });
      queryImpl = async (sql) => {
        if (sql.includes('message_templates')) {
          return { rows: [{ id: 'tpl-1', subject: 'Subj', body: 'Body', type: 'EMAIL' }] };
        }
        if (sql.includes('FROM patients')) {
          return { rows: [patient] };
        }
        return { rows: [] };
      };

      const result = await queueBulkCommunications(ORG_ID, ['patient-1'], 'tpl-1', 'EMAIL');

      expect(result.totalCount).toBe(0);
      expect(result.skippedCount).toBe(1);
      expect(result.skippedPatients[0].reason).toContain('e-post');
    });

    it('should throw if template not found', async () => {
      queryImpl = async (sql) => {
        if (sql.includes('message_templates')) {
          return { rows: [] };
        }
        return { rows: [] };
      };

      await expect(
        queueBulkCommunications(ORG_ID, ['patient-1'], 'nonexistent', 'SMS')
      ).rejects.toThrow('Template not found or inactive');
    });

    it('should set SCHEDULED status when scheduledAt is provided', async () => {
      const patient = makePatient();
      queryImpl = async (sql) => {
        if (sql.includes('message_templates')) {
          return { rows: [{ id: 'tpl-1', subject: '', body: 'Hi', type: 'SMS' }] };
        }
        if (sql.includes('FROM patients')) {
          return { rows: [patient] };
        }
        return { rows: [] };
      };

      const result = await queueBulkCommunications(ORG_ID, ['patient-1'], 'tpl-1', 'SMS', {
        scheduledAt: new Date('2026-04-01T10:00:00Z'),
      });

      expect(result.status).toBe('SCHEDULED');
    });

    it('should queue EMAIL for patients with valid email and consent', async () => {
      const patient = makePatient();
      queryImpl = async (sql) => {
        if (sql.includes('message_templates')) {
          return { rows: [{ id: 'tpl-1', subject: 'Subj', body: 'Body', type: 'EMAIL' }] };
        }
        if (sql.includes('FROM patients')) {
          return { rows: [patient] };
        }
        return { rows: [] };
      };

      const result = await queueBulkCommunications(ORG_ID, ['patient-1'], 'tpl-1', 'EMAIL', {
        userId: 'user-1',
      });

      expect(result.totalCount).toBe(1);
      expect(result.skippedCount).toBe(0);
    });

    it('should use custom message when no template provided', async () => {
      const patient = makePatient();
      queryImpl = async (sql) => {
        if (sql.includes('FROM patients')) {
          return { rows: [patient] };
        }
        return { rows: [] };
      };

      const result = await queueBulkCommunications(ORG_ID, ['patient-1'], null, 'SMS', {
        customMessage: 'Custom hello',
        customSubject: 'Custom subject',
      });

      expect(result.totalCount).toBe(1);
    });

    it('should handle multiple patients with mixed consent', async () => {
      const p1 = makePatient({ id: 'p-1' });
      const p2 = makePatient({ id: 'p-2', consent_sms: false });
      const p3 = makePatient({ id: 'p-3', phone: null });
      queryImpl = async (sql) => {
        if (sql.includes('message_templates')) {
          return { rows: [{ id: 'tpl-1', subject: '', body: 'Hi', type: 'SMS' }] };
        }
        if (sql.includes('FROM patients')) {
          return { rows: [p1, p2, p3] };
        }
        return { rows: [] };
      };

      const result = await queueBulkCommunications(ORG_ID, ['p-1', 'p-2', 'p-3'], 'tpl-1', 'SMS');

      expect(result.totalCount).toBe(1);
      expect(result.skippedCount).toBe(2);
    });

    it('should record skipped patients in bulk_communication_skipped', async () => {
      const p1 = makePatient({ id: 'p-1', phone: null });
      const insertSkippedCalls = [];
      queryImpl = async (sql, params) => {
        if (sql.includes('message_templates')) {
          return { rows: [{ id: 'tpl-1', subject: '', body: 'Hi', type: 'SMS' }] };
        }
        if (sql.includes('FROM patients')) {
          return { rows: [p1] };
        }
        if (sql.includes('bulk_communication_skipped')) {
          insertSkippedCalls.push(params);
        }
        return { rows: [] };
      };

      await queueBulkCommunications(ORG_ID, ['p-1'], 'tpl-1', 'SMS');

      expect(insertSkippedCalls.length).toBe(1);
    });

    it('should propagate database errors', async () => {
      queryImpl = async () => {
        throw new Error('DB connection lost');
      };

      await expect(queueBulkCommunications(ORG_ID, ['patient-1'], 'tpl-1', 'SMS')).rejects.toThrow(
        'DB connection lost'
      );
    });
  });

  // ─── processCommunicationQueue ──────────────────────────────

  describe('processCommunicationQueue', () => {
    it('should return early when no pending items', async () => {
      queryImpl = async () => ({ rows: [] });

      const result = await processCommunicationQueue(10);

      expect(result.processed).toBe(0);
      expect(result.message).toContain('No pending');
    });

    it('should process SMS items and mark as SENT', async () => {
      const queueItem = {
        id: 'q-1',
        batch_id: 'batch-1',
        patient_id: 'p-1',
        type: 'SMS',
        organization_id: ORG_ID,
        recipient_phone: '+4712345678',
        content: 'Hello',
        retry_count: 0,
      };
      let updateCalls = [];
      queryImpl = async (sql, params) => {
        if (sql.includes('FROM bulk_communication_queue q') && sql.includes('SKIP LOCKED')) {
          return { rows: [queueItem] };
        }
        if (sql.includes('hour_count')) {
          return { rows: [{ hour_count: '0', day_count: '0' }] };
        }
        if (sql.includes('UPDATE bulk_communication_queue SET status')) {
          updateCalls.push({ sql, params });
        }
        if (sql.includes('FROM bulk_communication_queue WHERE batch_id')) {
          return { rows: [{ sent: '1', failed: '0', pending: '0', processing: '0' }] };
        }
        return { rows: [] };
      };

      const result = await processCommunicationQueue(10);

      expect(result.processed).toBe(1);
      expect(result.failed).toBe(0);
    });

    it('should process EMAIL items', async () => {
      const queueItem = {
        id: 'q-1',
        batch_id: 'batch-1',
        patient_id: 'p-1',
        type: 'EMAIL',
        organization_id: ORG_ID,
        recipient_email: 'test@example.com',
        subject: 'Test',
        content: 'Hello',
        retry_count: 0,
      };
      queryImpl = async (sql) => {
        if (sql.includes('SKIP LOCKED')) return { rows: [queueItem] };
        if (sql.includes('hour_count')) return { rows: [{ hour_count: '0', day_count: '0' }] };
        if (sql.includes('FROM bulk_communication_queue WHERE batch_id'))
          return { rows: [{ sent: '1', failed: '0', pending: '0', processing: '0' }] };
        return { rows: [] };
      };

      const result = await processCommunicationQueue(10);
      expect(result.processed).toBe(1);
    });

    it('should skip processing when rate limited', async () => {
      const queueItem = {
        id: 'q-1',
        batch_id: 'batch-1',
        organization_id: ORG_ID,
        type: 'SMS',
        retry_count: 0,
      };
      queryImpl = async (sql) => {
        if (sql.includes('SKIP LOCKED')) return { rows: [queueItem] };
        if (sql.includes('hour_count')) return { rows: [{ hour_count: '999', day_count: '999' }] };
        return { rows: [] };
      };

      const result = await processCommunicationQueue(10);
      expect(result.processed).toBe(0);
      expect(result.message).toContain('Rate limit');
    });

    it('should retry on retryable errors', async () => {
      const queueItem = {
        id: 'q-1',
        batch_id: 'batch-1',
        patient_id: 'p-1',
        type: 'SMS',
        organization_id: ORG_ID,
        recipient_phone: '+4712345678',
        content: 'Hi',
        retry_count: 0,
      };
      sendSMSImpl = () => Promise.reject(new Error('NETWORK_ERROR'));
      let retryCalled = false;
      queryImpl = async (sql, params) => {
        if (sql.includes('SKIP LOCKED')) return { rows: [queueItem] };
        if (sql.includes('hour_count')) return { rows: [{ hour_count: '0', day_count: '0' }] };
        if (sql.includes('retry_count = retry_count + 1')) retryCalled = true;
        if (sql.includes('FROM bulk_communication_queue WHERE batch_id'))
          return { rows: [{ sent: '0', failed: '0', pending: '1', processing: '0' }] };
        return { rows: [] };
      };

      await processCommunicationQueue(10);
      expect(retryCalled).toBe(true);
    });

    it('should mark as FAILED when max retries exceeded', async () => {
      const queueItem = {
        id: 'q-1',
        batch_id: 'batch-1',
        patient_id: 'p-1',
        type: 'SMS',
        organization_id: ORG_ID,
        recipient_phone: '+4712345678',
        content: 'Hi',
        retry_count: 2, // maxRetries - 1
      };
      sendSMSImpl = () => Promise.reject(new Error('NETWORK_ERROR'));
      let failedCalled = false;
      queryImpl = async (sql) => {
        if (sql.includes('SKIP LOCKED')) return { rows: [queueItem] };
        if (sql.includes('hour_count')) return { rows: [{ hour_count: '0', day_count: '0' }] };
        if (sql.includes("status = 'FAILED'")) failedCalled = true;
        if (sql.includes('FROM bulk_communication_queue WHERE batch_id'))
          return { rows: [{ sent: '0', failed: '1', pending: '0', processing: '0' }] };
        return { rows: [] };
      };

      const result = await processCommunicationQueue(10);
      expect(failedCalled).toBe(true);
      expect(result.failed).toBe(1);
    });

    it('should mark as FAILED on non-retryable errors', async () => {
      const queueItem = {
        id: 'q-1',
        batch_id: 'batch-1',
        patient_id: 'p-1',
        type: 'SMS',
        organization_id: ORG_ID,
        recipient_phone: '+4712345678',
        content: 'Hi',
        retry_count: 0,
      };
      sendSMSImpl = () => Promise.reject(new Error('INVALID_RECIPIENT'));
      let failedCalled = false;
      queryImpl = async (sql) => {
        if (sql.includes('SKIP LOCKED')) return { rows: [queueItem] };
        if (sql.includes('hour_count')) return { rows: [{ hour_count: '0', day_count: '0' }] };
        if (sql.includes("status = 'FAILED'")) failedCalled = true;
        if (sql.includes('FROM bulk_communication_queue WHERE batch_id'))
          return { rows: [{ sent: '0', failed: '1', pending: '0', processing: '0' }] };
        return { rows: [] };
      };

      await processCommunicationQueue(10);
      expect(failedCalled).toBe(true);
    });
  });
});
