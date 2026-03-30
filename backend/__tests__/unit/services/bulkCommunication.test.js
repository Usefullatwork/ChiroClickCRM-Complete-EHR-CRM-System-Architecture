/**
 * Unit Tests for Bulk Communication Service
 * Tests queuing, personalization, processing, status, cancellation, batches, preview
 */

import { jest } from '@jest/globals';

// ---- Mocks ----

// Because resetMocks: true wipes .mockResolvedValue between tests,
// we use delegate functions that survive reset. Each test sets the *Impl vars.
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

let uuidCounter = 0;
jest.unstable_mockModule('uuid', () => ({
  v4: () => `test-uuid-${++uuidCounter}`,
}));

// ---- Import under test ----
const {
  queueBulkCommunications,
  personalizeTemplate,
  processCommunicationQueue,
  getQueueStatus,
  cancelBatch,
  getPendingQueue,
  getBatches,
  previewMessage,
  getAvailableVariables,
} = await import('../../../src/services/communication/bulkCommunication.js');

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

describe('bulkCommunication', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    uuidCounter = 0;
    queryImpl = () => Promise.resolve({ rows: [] });
    sendSMSImpl = () => Promise.resolve({ id: 'sms-1', external_id: 'ext-sms-1' });
    sendEmailImpl = () => Promise.resolve({ id: 'email-1', external_id: 'ext-email-1' });
  });

  // ========== personalizeTemplate ==========

  describe('personalizeTemplate', () => {
    it('should return empty string for null/undefined template', () => {
      expect(personalizeTemplate(null, {})).toBe('');
      expect(personalizeTemplate(undefined, {})).toBe('');
    });

    it('should replace firstName and lastName variables', () => {
      const patient = makePatient();
      const result = personalizeTemplate('Hei {firstName} {lastName}!', patient);
      expect(result).toBe('Hei Ola Nordmann!');
    });

    it('should replace fullName variable', () => {
      const patient = makePatient();
      const result = personalizeTemplate('Hei {fullName}!', patient);
      expect(result).toBe('Hei Ola Nordmann!');
    });

    it('should replace clinic variables from clinicInfo', () => {
      const patient = makePatient();
      const clinic = { name: 'Test Klinikk', phone: '+4798765432' };
      const result = personalizeTemplate('Kontakt {clinicName} på {clinicPhone}', patient, clinic);
      expect(result).toBe('Kontakt Test Klinikk på +4798765432');
    });

    it('should replace currentYear variable', () => {
      const result = personalizeTemplate('År: {currentYear}', {});
      expect(result).toBe(`År: ${new Date().getFullYear()}`);
    });

    it('should handle missing patient fields gracefully', () => {
      const result = personalizeTemplate('Hei {firstName}!', {});
      expect(result).toBe('Hei !');
    });

    it('should replace multiple occurrences of the same variable', () => {
      const patient = makePatient();
      const result = personalizeTemplate('{firstName} og {firstName}', patient);
      expect(result).toBe('Ola og Ola');
    });

    it('should leave text without variables unchanged', () => {
      const result = personalizeTemplate('Ingen variabler her', makePatient());
      expect(result).toBe('Ingen variabler her');
    });
  });

  // ========== getAvailableVariables ==========

  describe('getAvailableVariables', () => {
    it('should return all template variables with descriptions', () => {
      const vars = getAvailableVariables();
      expect(Array.isArray(vars)).toBe(true);
      expect(vars.length).toBeGreaterThanOrEqual(12);
      const varNames = vars.map((v) => v.variable);
      expect(varNames).toContain('{firstName}');
      expect(varNames).toContain('{clinicName}');
      expect(varNames).toContain('{today}');
      vars.forEach((v) => {
        expect(v).toHaveProperty('variable');
        expect(v).toHaveProperty('description');
        expect(typeof v.description).toBe('string');
      });
    });
  });

  // ========== queueBulkCommunications ==========

  describe('queueBulkCommunications', () => {
    it('should throw if template not found', async () => {
      // First call: template lookup returns empty
      queryImpl = () => Promise.resolve({ rows: [] });

      await expect(
        queueBulkCommunications(ORG_ID, ['p1'], 'tmpl-1', 'SMS', { userId: 'u1' })
      ).rejects.toThrow('Template not found or inactive');
    });

    it('should queue SMS for valid patients and skip those without phone', async () => {
      const patientWithPhone = makePatient({ id: 'p1' });
      const patientNoPhone = makePatient({ id: 'p2', phone: null });

      const callTracker = [];
      queryImpl = (...args) => {
        callTracker.push(args);
        const sql = typeof args[0] === 'string' ? args[0] : '';

        // Template lookup
        if (sql.includes('message_templates')) {
          return Promise.resolve({
            rows: [{ id: 'tmpl-1', subject: 'Sub', body: 'Hei {firstName}', type: 'SMS' }],
          });
        }
        // Patient lookup
        if (sql.includes('FROM patients')) {
          return Promise.resolve({ rows: [patientWithPhone, patientNoPhone] });
        }
        // Everything else (INSERT, etc.)
        return Promise.resolve({ rows: [] });
      };

      const result = await queueBulkCommunications(ORG_ID, ['p1', 'p2'], 'tmpl-1', 'SMS', {
        userId: 'u1',
      });

      expect(result.batchId).toBe('test-uuid-1');
      expect(result.status).toBe('PENDING');
      expect(result.totalCount).toBe(1);
      expect(result.skippedCount).toBe(1);
      expect(result.skippedPatients).toHaveLength(1);
      expect(result.skippedPatients[0].id).toBe('p2');
    });

    it('should set status to SCHEDULED when scheduledAt is provided', async () => {
      const patient = makePatient({ id: 'p1' });
      const scheduledAt = '2026-04-01T10:00:00Z';

      queryImpl = (...args) => {
        const sql = typeof args[0] === 'string' ? args[0] : '';
        if (sql.includes('message_templates')) {
          return Promise.resolve({
            rows: [{ id: 'tmpl-1', subject: 'Sub', body: 'Hei', type: 'SMS' }],
          });
        }
        if (sql.includes('FROM patients')) {
          return Promise.resolve({ rows: [patient] });
        }
        return Promise.resolve({ rows: [] });
      };

      const result = await queueBulkCommunications(ORG_ID, ['p1'], 'tmpl-1', 'SMS', {
        userId: 'u1',
        scheduledAt,
      });

      expect(result.status).toBe('SCHEDULED');
      expect(result.scheduledAt).toBe(scheduledAt);
    });

    it('should use customMessage when no templateId provided', async () => {
      const patient = makePatient({ id: 'p1' });

      const insertedContent = [];
      queryImpl = (...args) => {
        const sql = typeof args[0] === 'string' ? args[0] : '';
        if (sql.includes('FROM patients')) {
          return Promise.resolve({ rows: [patient] });
        }
        if (sql.includes('INSERT INTO bulk_communication_queue')) {
          // Capture content parameter (index 6 in the flat params = content)
          insertedContent.push(args[1]);
        }
        return Promise.resolve({ rows: [] });
      };

      const result = await queueBulkCommunications(ORG_ID, ['p1'], null, 'EMAIL', {
        userId: 'u1',
        customMessage: 'Hei {firstName}, velkommen!',
        customSubject: 'Velkommen',
      });

      expect(result.totalCount).toBe(1);
      // The queue insert params should contain the personalized content
      expect(insertedContent.length).toBeGreaterThan(0);
    });

    it('should filter EMAIL patients without email or consent', async () => {
      const validPatient = makePatient({ id: 'p1' });
      const noEmail = makePatient({ id: 'p2', email: null });
      const noConsent = makePatient({ id: 'p3', consent_email: false });

      queryImpl = (...args) => {
        const sql = typeof args[0] === 'string' ? args[0] : '';
        if (sql.includes('FROM patients')) {
          return Promise.resolve({ rows: [validPatient, noEmail, noConsent] });
        }
        return Promise.resolve({ rows: [] });
      };

      const result = await queueBulkCommunications(ORG_ID, ['p1', 'p2', 'p3'], null, 'EMAIL', {
        userId: 'u1',
        customMessage: 'Test',
      });

      expect(result.totalCount).toBe(1);
      expect(result.skippedCount).toBe(2);
    });
  });

  // ========== processCommunicationQueue ==========

  describe('processCommunicationQueue', () => {
    it('should return no-op result when no pending items', async () => {
      queryImpl = () => Promise.resolve({ rows: [] });

      const result = await processCommunicationQueue(10);
      expect(result.processed).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.message).toBe('No pending items to process');
    });

    it('should return rate limit message when rate limited', async () => {
      let callCount = 0;
      queryImpl = (...args) => {
        callCount++;
        const sql = typeof args[0] === 'string' ? args[0] : '';
        // First call: pending items
        if (sql.includes('bulk_communication_queue q') && sql.includes('FOR UPDATE')) {
          return Promise.resolve({
            rows: [
              {
                id: 'q1',
                batch_id: 'b1',
                organization_id: ORG_ID,
                type: 'SMS',
                patient_id: 'p1',
                recipient_phone: '+4712345678',
                content: 'test',
                subject: null,
                clinic_info: '{}',
                retry_count: 0,
              },
            ],
          });
        }
        // Rate limit check: return high counts to trigger limit
        if (sql.includes('FILTER')) {
          return Promise.resolve({
            rows: [{ hour_count: '999', day_count: '999' }],
          });
        }
        return Promise.resolve({ rows: [] });
      };

      const result = await processCommunicationQueue(10);
      expect(result.processed).toBe(0);
      expect(result.message).toBe('Rate limit reached, will retry later');
    });

    it('should process SMS items successfully', async () => {
      queryImpl = (...args) => {
        const sql = typeof args[0] === 'string' ? args[0] : '';
        // Pending items query
        if (sql.includes('FOR UPDATE')) {
          return Promise.resolve({
            rows: [
              {
                id: 'q1',
                batch_id: 'b1',
                organization_id: ORG_ID,
                type: 'SMS',
                patient_id: 'p1',
                recipient_phone: '+4712345678',
                content: 'Hello',
                subject: null,
                clinic_info: '{}',
                retry_count: 0,
              },
            ],
          });
        }
        // Rate limit check
        if (sql.includes('FILTER') && sql.includes('sent_at')) {
          return Promise.resolve({
            rows: [{ hour_count: '0', day_count: '0' }],
          });
        }
        // Batch stats
        if (sql.includes('FILTER') && sql.includes("status = 'SENT'")) {
          return Promise.resolve({
            rows: [{ sent: '1', failed: '0', pending: '0', processing: '0', total: '1' }],
          });
        }
        return Promise.resolve({ rows: [] });
      };

      const result = await processCommunicationQueue(10);
      expect(result.processed).toBe(1);
      expect(result.failed).toBe(0);
      expect(result.processedItems).toContain('q1');
    });

    it('should handle send failure with retryable error', async () => {
      sendSMSImpl = () => Promise.reject(new Error('NETWORK_ERROR: connection refused'));

      queryImpl = (...args) => {
        const sql = typeof args[0] === 'string' ? args[0] : '';
        if (sql.includes('FOR UPDATE')) {
          return Promise.resolve({
            rows: [
              {
                id: 'q1',
                batch_id: 'b1',
                organization_id: ORG_ID,
                type: 'SMS',
                patient_id: 'p1',
                recipient_phone: '+4712345678',
                content: 'Hello',
                subject: null,
                clinic_info: '{}',
                retry_count: 0,
              },
            ],
          });
        }
        if (sql.includes('FILTER') && sql.includes('sent_at')) {
          return Promise.resolve({
            rows: [{ hour_count: '0', day_count: '0' }],
          });
        }
        if (sql.includes('FILTER') && sql.includes("status = 'SENT'")) {
          return Promise.resolve({
            rows: [{ sent: '0', failed: '0', pending: '1', processing: '0', total: '1' }],
          });
        }
        return Promise.resolve({ rows: [] });
      };

      const result = await processCommunicationQueue(10);
      // Item was retried (retry_count 0 < maxRetries-1=2), so not in failedItems
      expect(result.processed).toBe(0);
      expect(result.failed).toBe(0);
    });

    it('should mark item as failed on non-retryable error', async () => {
      sendEmailImpl = () => Promise.reject(new Error('INVALID_RECIPIENT'));

      queryImpl = (...args) => {
        const sql = typeof args[0] === 'string' ? args[0] : '';
        if (sql.includes('FOR UPDATE')) {
          return Promise.resolve({
            rows: [
              {
                id: 'q1',
                batch_id: 'b1',
                organization_id: ORG_ID,
                type: 'EMAIL',
                patient_id: 'p1',
                recipient_email: 'bad@example.com',
                content: 'Hello',
                subject: 'Test',
                clinic_info: '{}',
                retry_count: 0,
              },
            ],
          });
        }
        if (sql.includes('FILTER') && sql.includes('sent_at')) {
          return Promise.resolve({ rows: [{ hour_count: '0', day_count: '0' }] });
        }
        if (sql.includes('FILTER') && sql.includes("status = 'SENT'")) {
          return Promise.resolve({
            rows: [{ sent: '0', failed: '1', pending: '0', processing: '0', total: '1' }],
          });
        }
        return Promise.resolve({ rows: [] });
      };

      const result = await processCommunicationQueue(10);
      expect(result.failed).toBe(1);
      expect(result.failedItems).toContain('q1');
    });
  });

  // ========== getQueueStatus ==========

  describe('getQueueStatus', () => {
    it('should throw when batch not found', async () => {
      queryImpl = () => Promise.resolve({ rows: [] });
      await expect(getQueueStatus(ORG_ID, 'nonexistent')).rejects.toThrow('Batch not found');
    });

    it('should return batch status with stats and progress', async () => {
      queryImpl = (...args) => {
        const sql = typeof args[0] === 'string' ? args[0] : '';
        // Batch lookup
        if (sql.includes('bulk_communication_batches') && sql.includes('WHERE id')) {
          return Promise.resolve({
            rows: [
              {
                id: 'b1',
                status: 'PROCESSING',
                type: 'SMS',
                priority: 'NORMAL',
                created_at: '2026-03-01',
                scheduled_at: null,
                started_at: '2026-03-01',
                completed_at: null,
                total_count: 10,
              },
            ],
          });
        }
        // Queue stats
        if (sql.includes('GROUP BY status')) {
          return Promise.resolve({
            rows: [
              { status: 'SENT', count: '7' },
              { status: 'PENDING', count: '2' },
              { status: 'FAILED', count: '1' },
            ],
          });
        }
        // Skipped patients
        if (sql.includes('bulk_communication_skipped')) {
          return Promise.resolve({
            rows: [
              {
                patient_id: 'p-skip-1',
                reason: 'Missing phone',
                first_name: 'Kari',
                last_name: 'Hansen',
              },
            ],
          });
        }
        // Failed items
        if (sql.includes("status = 'FAILED'") && sql.includes('ORDER BY')) {
          return Promise.resolve({
            rows: [
              {
                patient_id: 'p-fail-1',
                last_error: 'timeout',
                failed_at: '2026-03-01',
                first_name: 'Per',
                last_name: 'Olsen',
              },
            ],
          });
        }
        return Promise.resolve({ rows: [] });
      };

      const status = await getQueueStatus(ORG_ID, 'b1');
      expect(status.batchId).toBe('b1');
      expect(status.status).toBe('PROCESSING');
      expect(status.stats.sent).toBe(7);
      expect(status.stats.pending).toBe(2);
      expect(status.stats.failed).toBe(1);
      expect(status.stats.total).toBe(10);
      expect(status.progressPercentage).toBe(80); // (7+1)/10 * 100
      expect(status.skippedPatients).toHaveLength(1);
      expect(status.skippedPatients[0].name).toBe('Kari Hansen');
      expect(status.recentFailures).toHaveLength(1);
      expect(status.recentFailures[0].error).toBe('timeout');
      expect(status.estimatedCompletionTime).not.toBeNull();
    });
  });

  // ========== cancelBatch ==========

  describe('cancelBatch', () => {
    it('should throw when batch not found', async () => {
      queryImpl = () => Promise.resolve({ rows: [] });
      await expect(cancelBatch(ORG_ID, 'nonexistent')).rejects.toThrow('Batch not found');
    });

    it('should throw when batch is already completed', async () => {
      queryImpl = () => Promise.resolve({ rows: [{ id: 'b1', status: 'COMPLETED' }] });

      await expect(cancelBatch(ORG_ID, 'b1')).rejects.toThrow(
        'Cannot cancel batch with status COMPLETED'
      );
    });

    it('should throw when batch is already cancelled', async () => {
      queryImpl = () => Promise.resolve({ rows: [{ id: 'b1', status: 'CANCELLED' }] });

      await expect(cancelBatch(ORG_ID, 'b1')).rejects.toThrow(
        'Cannot cancel batch with status CANCELLED'
      );
    });

    it('should cancel pending batch and return result', async () => {
      let callIndex = 0;
      queryImpl = (...args) => {
        callIndex++;
        const sql = typeof args[0] === 'string' ? args[0] : '';
        // Batch lookup
        if (sql.includes('SELECT id, status') && sql.includes('bulk_communication_batches')) {
          return Promise.resolve({ rows: [{ id: 'b1', status: 'PENDING' }] });
        }
        // Count pending items
        if (sql.includes('COUNT(*)') && sql.includes("'PENDING'")) {
          return Promise.resolve({ rows: [{ count: '5' }] });
        }
        return Promise.resolve({ rows: [] });
      };

      const result = await cancelBatch(ORG_ID, 'b1');
      expect(result.batchId).toBe('b1');
      expect(result.status).toBe('CANCELLED');
      expect(result.cancelledItems).toBe(5);
      expect(result.message).toContain('5 pending items');
    });
  });

  // ========== getPendingQueue ==========

  describe('getPendingQueue', () => {
    it('should return paginated queue items', async () => {
      queryImpl = (...args) => {
        const sql = typeof args[0] === 'string' ? args[0] : '';
        if (sql.includes('COUNT(*)')) {
          return Promise.resolve({ rows: [{ count: '25' }] });
        }
        if (sql.includes('LIMIT')) {
          return Promise.resolve({
            rows: [
              {
                id: 'qi-1',
                batch_id: 'b1',
                patient_id: 'p1',
                first_name: 'Ola',
                last_name: 'Nordmann',
                type: 'SMS',
                status: 'PENDING',
                recipient_phone: '+4712345678',
                recipient_email: null,
                content: 'Hei',
                subject: null,
                scheduled_at: null,
                sent_at: null,
                failed_at: null,
                retry_count: 0,
                last_error: null,
                priority: 'NORMAL',
              },
            ],
          });
        }
        return Promise.resolve({ rows: [] });
      };

      const result = await getPendingQueue(ORG_ID, { page: 1, limit: 20 });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].patientName).toBe('Ola Nordmann');
      expect(result.items[0].recipient).toBe('+4712345678');
      expect(result.pagination.total).toBe(25);
      expect(result.pagination.pages).toBe(2);
    });

    it('should pass status and batchId filters when provided', async () => {
      const capturedParams = [];
      queryImpl = (...args) => {
        capturedParams.push(args);
        const sql = typeof args[0] === 'string' ? args[0] : '';
        if (sql.includes('COUNT(*)')) {
          return Promise.resolve({ rows: [{ count: '3' }] });
        }
        return Promise.resolve({ rows: [] });
      };

      await getPendingQueue(ORG_ID, { status: 'FAILED', batchId: 'b1' });

      // The count query should have org_id, status, batchId as params
      const countCall = capturedParams.find(
        (c) => typeof c[0] === 'string' && c[0].includes('COUNT(*)')
      );
      expect(countCall[1]).toContain(ORG_ID);
      expect(countCall[1]).toContain('FAILED');
      expect(countCall[1]).toContain('b1');
    });
  });

  // ========== getBatches ==========

  describe('getBatches', () => {
    it('should return paginated batches with statistics', async () => {
      let isCountQuery = true;
      queryImpl = (...args) => {
        const sql = typeof args[0] === 'string' ? args[0] : '';
        // First query is the simple COUNT, second is the batches query with LIMIT
        if (sql.includes('COUNT(*)') && !sql.includes('LEFT JOIN')) {
          return Promise.resolve({ rows: [{ count: '2' }] });
        }
        // The main batches query has LEFT JOIN users
        if (sql.includes('LEFT JOIN')) {
          return Promise.resolve({
            rows: [
              {
                id: 'b1',
                type: 'SMS',
                status: 'COMPLETED',
                priority: 'NORMAL',
                total_count: 10,
                sent_count: '8',
                failed_count: '2',
                pending_count: '0',
                created_at: '2026-03-01',
                scheduled_at: null,
                started_at: '2026-03-01',
                completed_at: '2026-03-01',
                created_by_name: 'Admin User',
              },
            ],
          });
        }
        return Promise.resolve({ rows: [] });
      };

      const result = await getBatches(ORG_ID);
      expect(result.batches).toHaveLength(1);
      expect(result.batches[0].sentCount).toBe(8);
      expect(result.batches[0].failedCount).toBe(2);
      expect(result.batches[0].createdByName).toBe('Admin User');
      expect(result.pagination.total).toBe(2);
    });

    it('should filter by status when provided', async () => {
      const capturedParams = [];
      queryImpl = (...args) => {
        capturedParams.push(args);
        const sql = typeof args[0] === 'string' ? args[0] : '';
        if (sql.includes('COUNT(*)')) {
          return Promise.resolve({ rows: [{ count: '1' }] });
        }
        return Promise.resolve({ rows: [] });
      };

      await getBatches(ORG_ID, { status: 'PENDING' });

      const countCall = capturedParams.find(
        (c) => typeof c[0] === 'string' && c[0].includes('COUNT(*)')
      );
      expect(countCall[1]).toContain('PENDING');
    });
  });

  // ========== previewMessage ==========

  describe('previewMessage', () => {
    it('should throw when patient not found', async () => {
      queryImpl = () => Promise.resolve({ rows: [] });
      await expect(previewMessage(ORG_ID, 'bad-id', 'Hello')).rejects.toThrow('Patient not found');
    });

    it('should return personalized preview with character count and SMS segments', async () => {
      queryImpl = () =>
        Promise.resolve({
          rows: [
            {
              id: 'p1',
              first_name: 'Ola',
              last_name: 'Nordmann',
              phone: '+4712345678',
              email: 'ola@example.com',
              date_of_birth: '1990-01-15',
              last_visit_date: '2026-03-01',
            },
          ],
        });

      const result = await previewMessage(ORG_ID, 'p1', 'Hei {firstName}, velkommen!', {
        name: 'Test Klinikk',
      });

      expect(result.patientId).toBe('p1');
      expect(result.patientName).toBe('Ola Nordmann');
      expect(result.personalizedContent).toBe('Hei Ola, velkommen!');
      expect(result.originalContent).toBe('Hei {firstName}, velkommen!');
      expect(result.characterCount).toBe('Hei Ola, velkommen!'.length);
      expect(result.smsSegments).toBe(1);
    });

    it('should calculate multiple SMS segments for long messages', async () => {
      queryImpl = () =>
        Promise.resolve({
          rows: [
            {
              id: 'p1',
              first_name: 'Ola',
              last_name: 'Nordmann',
              phone: '+4712345678',
              email: 'ola@example.com',
              date_of_birth: null,
              last_visit_date: null,
            },
          ],
        });

      // Create a message > 160 chars
      const longText = 'A'.repeat(321);
      const result = await previewMessage(ORG_ID, 'p1', longText);

      expect(result.characterCount).toBe(321);
      expect(result.smsSegments).toBe(3); // ceil(321/160) = 3
    });
  });
});
