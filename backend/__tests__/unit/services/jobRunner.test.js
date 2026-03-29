/**
 * Unit Tests for Job Runner
 * Tests job execution, overlap prevention, timeout handling, logging
 */

import { jest } from '@jest/globals';

jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

const mockQuery = jest.fn();
jest.unstable_mockModule('../../../src/config/database.js', () => ({
  query: mockQuery,
  default: { query: mockQuery },
}));

const { executeJob, logJobExecution, runningJobs, scheduledJobs, loadServices } =
  await import('../../../src/jobs/jobRunner.js');

describe('Job Runner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    runningJobs.clear();
    scheduledJobs.clear();
  });

  // ===========================================================================
  // EXECUTE JOB
  // ===========================================================================

  describe('executeJob', () => {
    it('should execute handler and return result', async () => {
      mockQuery.mockResolvedValue({ rows: [] });
      const handler = jest.fn().mockResolvedValue({ processed: 5 });

      const result = await executeJob('test-job', handler);

      expect(result).toEqual({ processed: 5 });
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should prevent overlapping execution of same job', async () => {
      mockQuery.mockResolvedValue({ rows: [] });
      let resolveFirst;
      const firstHandler = jest.fn(
        () =>
          new Promise((resolve) => {
            resolveFirst = resolve;
          })
      );
      const secondHandler = jest.fn().mockResolvedValue({ done: true });

      const firstPromise = executeJob('overlap-test', firstHandler);
      const secondResult = await executeJob('overlap-test', secondHandler);

      expect(secondResult).toBeNull();
      expect(secondHandler).not.toHaveBeenCalled();

      resolveFirst({ done: true });
      await firstPromise;
    });

    it('should allow execution after previous job completes', async () => {
      mockQuery.mockResolvedValue({ rows: [] });
      const handler1 = jest.fn().mockResolvedValue({ run: 1 });
      const handler2 = jest.fn().mockResolvedValue({ run: 2 });

      await executeJob('sequential-job', handler1);
      const result = await executeJob('sequential-job', handler2);

      expect(result).toEqual({ run: 2 });
    });

    it('should return null and log error on handler failure', async () => {
      mockQuery.mockResolvedValue({ rows: [] });
      const handler = jest.fn().mockRejectedValue(new Error('Handler crashed'));

      const result = await executeJob('fail-job', handler);

      expect(result).toBeNull();
    });

    it('should return null on timeout', async () => {
      mockQuery.mockResolvedValue({ rows: [] });
      const slowHandler = jest.fn(() => new Promise((resolve) => setTimeout(resolve, 5000)));

      const result = await executeJob('timeout-job', slowHandler, 50);

      expect(result).toBeNull();
    });

    it('should clean up runningJobs after success', async () => {
      mockQuery.mockResolvedValue({ rows: [] });
      const handler = jest.fn().mockResolvedValue({});

      await executeJob('cleanup-test', handler);

      expect(runningJobs.has('cleanup-test')).toBe(false);
    });

    it('should clean up runningJobs after failure', async () => {
      mockQuery.mockResolvedValue({ rows: [] });
      const handler = jest.fn().mockRejectedValue(new Error('Fail'));

      await executeJob('fail-cleanup', handler);

      expect(runningJobs.has('fail-cleanup')).toBe(false);
    });

    it('should update scheduledJobs metadata on success', async () => {
      mockQuery.mockResolvedValue({ rows: [] });
      scheduledJobs.set('meta-job', { lastRun: null, lastStatus: null });
      const handler = jest.fn().mockResolvedValue({});

      await executeJob('meta-job', handler);

      const info = scheduledJobs.get('meta-job');
      expect(info.lastStatus).toBe('success');
      expect(info.lastRun).toBeInstanceOf(Date);
    });

    it('should update scheduledJobs metadata on failure', async () => {
      mockQuery.mockResolvedValue({ rows: [] });
      scheduledJobs.set('fail-meta-job', { lastRun: null, lastStatus: null });
      const handler = jest.fn().mockRejectedValue(new Error('Boom'));

      await executeJob('fail-meta-job', handler);

      const info = scheduledJobs.get('fail-meta-job');
      expect(info.lastStatus).toBe('failed');
      expect(info.lastError).toBe('Boom');
    });

    it('should allow different jobs to run concurrently', async () => {
      mockQuery.mockResolvedValue({ rows: [] });
      const handler1 = jest.fn().mockResolvedValue({ job: 'a' });
      const handler2 = jest.fn().mockResolvedValue({ job: 'b' });

      const [r1, r2] = await Promise.all([
        executeJob('job-a', handler1),
        executeJob('job-b', handler2),
      ]);

      expect(r1).toEqual({ job: 'a' });
      expect(r2).toEqual({ job: 'b' });
    });
  });

  // ===========================================================================
  // LOG JOB EXECUTION
  // ===========================================================================

  describe('logJobExecution', () => {
    it('should insert log entry on success', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      await logJobExecution('test-job', 'test_123', 'success', 500, { items: 5 });

      expect(mockQuery).toHaveBeenCalledTimes(1);
      const args = mockQuery.mock.calls[0][1];
      expect(args[0]).toBe('test-job');
      expect(args[2]).toBe('success');
    });

    it('should log failure with error message', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      await logJobExecution('test-job', 'test_456', 'failed', 100, null, 'Job timeout');

      const args = mockQuery.mock.calls[0][1];
      expect(args[2]).toBe('failed');
      expect(args[5]).toBe('Job timeout');
    });

    it('should handle database error silently', async () => {
      mockQuery.mockRejectedValue(new Error('Table not found'));

      await expect(logJobExecution('test-job', 'test_789', 'success', 50)).resolves.not.toThrow();
    });

    it('should stringify result object', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      await logJobExecution('test-job', 'id', 'success', 100, { count: 10 });

      const args = mockQuery.mock.calls[0][1];
      expect(args[4]).toBe(JSON.stringify({ count: 10 }));
    });

    it('should pass null for result when not provided', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      await logJobExecution('test-job', 'id', 'success', 100);

      const args = mockQuery.mock.calls[0][1];
      expect(args[4]).toBeNull();
    });
  });

  // ===========================================================================
  // LOAD SERVICES
  // ===========================================================================

  describe('loadServices', () => {
    it('should return object with service keys', async () => {
      const services = await loadServices();

      expect(services).toHaveProperty('aiLearningService');
      expect(services).toHaveProperty('automationsService');
      expect(services).toHaveProperty('communicationsService');
      expect(services).toHaveProperty('smartSchedulerService');
      expect(services).toHaveProperty('recallEngine');
    });

    it('should handle missing services gracefully', async () => {
      // loadServices uses dynamic import which may fail for missing modules
      const services = await loadServices();

      // Should not throw, and services that fail to load should be null
      expect(typeof services).toBe('object');
    });
  });
});
