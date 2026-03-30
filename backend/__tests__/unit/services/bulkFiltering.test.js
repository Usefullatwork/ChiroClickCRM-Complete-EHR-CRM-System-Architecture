/**
 * Unit Tests for Bulk Filtering Service
 * Tests queue status, batch management, pending queue, batch listing, and cancellation
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

// ---- Import under test ----
const { getQueueStatus, cancelBatch, getPendingQueue, getBatches } =
  await import('../../../src/services/communication/bulkFiltering.js');

// ---- Helpers ----
const ORG_ID = 'org-test-001';
const BATCH_ID = 'batch-001';

// ---- Tests ----

describe('bulkFiltering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    queryImpl = () => Promise.resolve({ rows: [] });
  });

  // ─── getQueueStatus ──────────────────────────────────

  describe('getQueueStatus', () => {
    it('should return batch status with statistics', async () => {
      queryImpl = async (sql) => {
        if (sql.includes('FROM bulk_communication_batches WHERE')) {
          return {
            rows: [
              {
                id: BATCH_ID,
                status: 'PROCESSING',
                type: 'SMS',
                priority: 'NORMAL',
                created_at: new Date(),
                scheduled_at: null,
                started_at: new Date(),
                completed_at: null,
                total_count: 10,
              },
            ],
          };
        }
        if (sql.includes('GROUP BY status')) {
          return {
            rows: [
              { status: 'SENT', count: '5' },
              { status: 'PENDING', count: '3' },
              { status: 'FAILED', count: '2' },
            ],
          };
        }
        if (sql.includes('bulk_communication_skipped')) {
          return { rows: [] };
        }
        if (sql.includes("status = 'FAILED'")) {
          return { rows: [] };
        }
        return { rows: [] };
      };

      const result = await getQueueStatus(ORG_ID, BATCH_ID);

      expect(result.batchId).toBe(BATCH_ID);
      expect(result.status).toBe('PROCESSING');
      expect(result.stats.sent).toBe(5);
      expect(result.stats.pending).toBe(3);
      expect(result.stats.failed).toBe(2);
      expect(result.stats.total).toBe(10);
    });

    it('should throw when batch not found', async () => {
      queryImpl = async () => ({ rows: [] });

      await expect(getQueueStatus(ORG_ID, 'nonexistent')).rejects.toThrow('Batch not found');
    });

    it('should calculate progress percentage', async () => {
      queryImpl = async (sql) => {
        if (sql.includes('FROM bulk_communication_batches WHERE')) {
          return {
            rows: [
              {
                id: BATCH_ID,
                status: 'PROCESSING',
                type: 'SMS',
                priority: 'NORMAL',
                created_at: new Date(),
                scheduled_at: null,
                started_at: new Date(),
                completed_at: null,
                total_count: 10,
              },
            ],
          };
        }
        if (sql.includes('GROUP BY status')) {
          return {
            rows: [
              { status: 'SENT', count: '7' },
              { status: 'FAILED', count: '1' },
              { status: 'PENDING', count: '2' },
            ],
          };
        }
        if (sql.includes('bulk_communication_skipped')) return { rows: [] };
        if (sql.includes("status = 'FAILED'")) return { rows: [] };
        return { rows: [] };
      };

      const result = await getQueueStatus(ORG_ID, BATCH_ID);
      expect(result.progressPercentage).toBe(80); // (7+1)/10 * 100
    });

    it('should return zero progress when total is zero', async () => {
      queryImpl = async (sql) => {
        if (sql.includes('FROM bulk_communication_batches WHERE')) {
          return {
            rows: [
              {
                id: BATCH_ID,
                status: 'PENDING',
                type: 'SMS',
                priority: 'NORMAL',
                created_at: new Date(),
                scheduled_at: null,
                started_at: null,
                completed_at: null,
                total_count: 0,
              },
            ],
          };
        }
        if (sql.includes('GROUP BY status')) return { rows: [] };
        if (sql.includes('bulk_communication_skipped')) return { rows: [] };
        if (sql.includes("status = 'FAILED'")) return { rows: [] };
        return { rows: [] };
      };

      const result = await getQueueStatus(ORG_ID, BATCH_ID);
      expect(result.progressPercentage).toBe(0);
    });

    it('should include skipped patients in response', async () => {
      queryImpl = async (sql) => {
        if (sql.includes('FROM bulk_communication_batches WHERE')) {
          return {
            rows: [
              {
                id: BATCH_ID,
                status: 'COMPLETED',
                type: 'SMS',
                priority: 'NORMAL',
                created_at: new Date(),
                scheduled_at: null,
                started_at: new Date(),
                completed_at: new Date(),
                total_count: 5,
              },
            ],
          };
        }
        if (sql.includes('GROUP BY status')) return { rows: [{ status: 'SENT', count: '5' }] };
        if (sql.includes('bulk_communication_skipped')) {
          return {
            rows: [
              {
                patient_id: 'p-1',
                reason: 'Missing phone',
                first_name: 'Kari',
                last_name: 'Hansen',
              },
            ],
          };
        }
        if (sql.includes("status = 'FAILED'")) return { rows: [] };
        return { rows: [] };
      };

      const result = await getQueueStatus(ORG_ID, BATCH_ID);
      expect(result.skippedPatients).toHaveLength(1);
      expect(result.skippedPatients[0].name).toBe('Kari Hansen');
    });

    it('should include recent failures in response', async () => {
      queryImpl = async (sql) => {
        if (sql.includes('FROM bulk_communication_batches WHERE')) {
          return {
            rows: [
              {
                id: BATCH_ID,
                status: 'COMPLETED_WITH_ERRORS',
                type: 'EMAIL',
                priority: 'HIGH',
                created_at: new Date(),
                scheduled_at: null,
                started_at: new Date(),
                completed_at: new Date(),
                total_count: 10,
              },
            ],
          };
        }
        if (sql.includes('GROUP BY status'))
          return {
            rows: [
              { status: 'SENT', count: '8' },
              { status: 'FAILED', count: '2' },
            ],
          };
        if (sql.includes('bulk_communication_skipped')) return { rows: [] };
        if (sql.includes("status = 'FAILED'")) {
          return {
            rows: [
              {
                patient_id: 'p-2',
                last_error: 'Bounce',
                failed_at: new Date(),
                first_name: 'Per',
                last_name: 'Olsen',
              },
            ],
          };
        }
        return { rows: [] };
      };

      const result = await getQueueStatus(ORG_ID, BATCH_ID);
      expect(result.recentFailures).toHaveLength(1);
      expect(result.recentFailures[0].error).toBe('Bounce');
    });

    it('should include estimated completion time for pending items', async () => {
      queryImpl = async (sql) => {
        if (sql.includes('FROM bulk_communication_batches WHERE')) {
          return {
            rows: [
              {
                id: BATCH_ID,
                status: 'PROCESSING',
                type: 'SMS',
                priority: 'NORMAL',
                created_at: new Date(),
                scheduled_at: null,
                started_at: new Date(),
                completed_at: null,
                total_count: 20,
              },
            ],
          };
        }
        if (sql.includes('GROUP BY status'))
          return {
            rows: [
              { status: 'SENT', count: '5' },
              { status: 'PENDING', count: '15' },
            ],
          };
        if (sql.includes('bulk_communication_skipped')) return { rows: [] };
        if (sql.includes("status = 'FAILED'")) return { rows: [] };
        return { rows: [] };
      };

      const result = await getQueueStatus(ORG_ID, BATCH_ID);
      expect(result.estimatedCompletionTime).toBeInstanceOf(Date);
    });
  });

  // ─── cancelBatch ──────────────────────────────────

  describe('cancelBatch', () => {
    it('should cancel a PENDING batch', async () => {
      queryImpl = async (sql) => {
        if (sql.includes('SELECT id, status FROM bulk_communication_batches')) {
          return { rows: [{ id: BATCH_ID, status: 'PENDING' }] };
        }
        if (sql.includes('SELECT COUNT')) {
          return { rows: [{ count: '5' }] };
        }
        return { rows: [] };
      };

      const result = await cancelBatch(ORG_ID, BATCH_ID);
      expect(result.status).toBe('CANCELLED');
      expect(result.cancelledItems).toBe(5);
    });

    it('should throw for non-existent batch', async () => {
      queryImpl = async () => ({ rows: [] });
      await expect(cancelBatch(ORG_ID, 'fake')).rejects.toThrow('Batch not found');
    });

    it('should throw when batch is already COMPLETED', async () => {
      queryImpl = async (sql) => {
        if (sql.includes('SELECT id, status')) {
          return { rows: [{ id: BATCH_ID, status: 'COMPLETED' }] };
        }
        return { rows: [] };
      };

      await expect(cancelBatch(ORG_ID, BATCH_ID)).rejects.toThrow('Cannot cancel batch');
    });

    it('should throw when batch is already CANCELLED', async () => {
      queryImpl = async (sql) => {
        if (sql.includes('SELECT id, status')) {
          return { rows: [{ id: BATCH_ID, status: 'CANCELLED' }] };
        }
        return { rows: [] };
      };

      await expect(cancelBatch(ORG_ID, BATCH_ID)).rejects.toThrow('Cannot cancel batch');
    });
  });

  // ─── getPendingQueue ──────────────────────────────────

  describe('getPendingQueue', () => {
    it('should return paginated pending queue items', async () => {
      queryImpl = async (sql) => {
        if (sql.includes('SELECT COUNT')) return { rows: [{ count: '1' }] };
        if (sql.includes('FROM bulk_communication_queue q')) {
          return {
            rows: [
              {
                id: 'q-1',
                batch_id: BATCH_ID,
                patient_id: 'p-1',
                first_name: 'Ola',
                last_name: 'Nordmann',
                type: 'SMS',
                status: 'PENDING',
                recipient_phone: '+4712345678',
                recipient_email: null,
                content: 'Hi',
                subject: null,
                scheduled_at: null,
                sent_at: null,
                failed_at: null,
                retry_count: 0,
                last_error: null,
                priority: 'NORMAL',
              },
            ],
          };
        }
        return { rows: [] };
      };

      const result = await getPendingQueue(ORG_ID);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].patientName).toBe('Ola Nordmann');
      expect(result.pagination.total).toBe(1);
    });

    it('should filter by status when provided', async () => {
      let capturedParams;
      queryImpl = async (sql, params) => {
        if (sql.includes('SELECT COUNT')) {
          capturedParams = params;
          return { rows: [{ count: '0' }] };
        }
        return { rows: [] };
      };

      await getPendingQueue(ORG_ID, { status: 'FAILED' });
      expect(capturedParams).toContain('FAILED');
    });

    it('should filter by batchId when provided', async () => {
      let capturedParams;
      queryImpl = async (sql, params) => {
        if (sql.includes('SELECT COUNT')) {
          capturedParams = params;
          return { rows: [{ count: '0' }] };
        }
        return { rows: [] };
      };

      await getPendingQueue(ORG_ID, { batchId: 'batch-x' });
      expect(capturedParams).toContain('batch-x');
    });

    it('should respect page and limit options', async () => {
      queryImpl = async (sql) => {
        if (sql.includes('SELECT COUNT')) return { rows: [{ count: '50' }] };
        return { rows: [] };
      };

      const result = await getPendingQueue(ORG_ID, { page: 2, limit: 10 });
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.pages).toBe(5);
    });
  });

  // ─── getBatches ──────────────────────────────────

  describe('getBatches', () => {
    it('should return paginated batch list', async () => {
      queryImpl = async (sql) => {
        // COUNT query comes first - it does NOT include FROM ... b (alias)
        if (sql.includes('SELECT COUNT') && !sql.includes('LEFT JOIN')) {
          return { rows: [{ count: '2' }] };
        }
        // Main query has LEFT JOIN and selects b.*
        if (sql.includes('LEFT JOIN users u')) {
          return {
            rows: [
              {
                id: 'b-1',
                type: 'SMS',
                status: 'COMPLETED',
                priority: 'NORMAL',
                total_count: 10,
                sent_count: '10',
                failed_count: '0',
                pending_count: '0',
                created_at: new Date(),
                scheduled_at: null,
                started_at: new Date(),
                completed_at: new Date(),
                created_by_name: 'Admin User',
              },
              {
                id: 'b-2',
                type: 'EMAIL',
                status: 'PENDING',
                priority: 'HIGH',
                total_count: 5,
                sent_count: '0',
                failed_count: '0',
                pending_count: '5',
                created_at: new Date(),
                scheduled_at: null,
                started_at: null,
                completed_at: null,
                created_by_name: 'Admin User',
              },
            ],
          };
        }
        return { rows: [] };
      };

      const result = await getBatches(ORG_ID);
      expect(result.batches).toHaveLength(2);
      expect(result.batches[0].sentCount).toBe(10);
      expect(result.pagination.total).toBe(2);
    });

    it('should filter by status when provided', async () => {
      let capturedParams;
      queryImpl = async (sql, params) => {
        if (sql.includes('SELECT COUNT')) {
          capturedParams = params;
          return { rows: [{ count: '0' }] };
        }
        return { rows: [] };
      };

      await getBatches(ORG_ID, { status: 'COMPLETED' });
      expect(capturedParams).toContain('COMPLETED');
    });

    it('should propagate database errors', async () => {
      queryImpl = async () => {
        throw new Error('Connection timeout');
      };
      await expect(getBatches(ORG_ID)).rejects.toThrow('Connection timeout');
    });
  });
});
