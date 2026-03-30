/**
 * Unit Tests for Maintenance Jobs
 * Tests cleanup, health checks, follow-ups, automations, recall schedules
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

const {
  cleanupOldLogs,
  healthCheck,
  generateFollowUpReminders,
  processAutomations,
  processRecallSchedules,
} = await import('../../../src/jobs/maintenanceJobs.js');

describe('Maintenance Jobs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================================================
  // CLEANUP OLD LOGS
  // ===========================================================================

  describe('cleanupOldLogs', () => {
    it('should clean up audit logs, job logs, and sessions', async () => {
      mockQuery
        .mockResolvedValueOnce({ rowCount: 10 }) // audit_logs
        .mockResolvedValueOnce({ rowCount: 5 }) // job_logs
        .mockResolvedValueOnce({ rowCount: 3 }); // sessions

      const result = await cleanupOldLogs();

      expect(result.auditLogs).toBe(10);
      expect(result.jobLogs).toBe(5);
      expect(result.sessions).toBe(3);
    });

    it('should handle missing tables gracefully', async () => {
      mockQuery
        .mockRejectedValueOnce(new Error('audit_logs not found'))
        .mockRejectedValueOnce(new Error('job_logs not found'))
        .mockRejectedValueOnce(new Error('sessions not found'));

      const result = await cleanupOldLogs();

      expect(result.auditLogs).toBe(0);
      expect(result.jobLogs).toBe(0);
      expect(result.sessions).toBe(0);
    });

    it('should return zero counts when no old records exist', async () => {
      mockQuery
        .mockResolvedValueOnce({ rowCount: 0 })
        .mockResolvedValueOnce({ rowCount: 0 })
        .mockResolvedValueOnce({ rowCount: 0 });

      const result = await cleanupOldLogs();

      expect(result.auditLogs).toBe(0);
      expect(result.jobLogs).toBe(0);
      expect(result.sessions).toBe(0);
    });

    it('should handle partial table failures', async () => {
      mockQuery
        .mockResolvedValueOnce({ rowCount: 5 }) // audit_logs works
        .mockRejectedValueOnce(new Error('missing')) // job_logs fails
        .mockResolvedValueOnce({ rowCount: 2 }); // sessions works

      const result = await cleanupOldLogs();

      expect(result.auditLogs).toBe(5);
      expect(result.jobLogs).toBe(0);
      expect(result.sessions).toBe(2);
    });
  });

  // ===========================================================================
  // HEALTH CHECK
  // ===========================================================================

  describe('healthCheck', () => {
    it('should return healthy status when DB and comms are up', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ check: 1 }] });
      const services = {
        communicationsService: {
          checkConnectivity: jest.fn().mockResolvedValue({ overall: true }),
        },
      };

      const result = await healthCheck(services);

      expect(result.database).toBe(true);
      expect(result.communications).toBe(true);
      expect(result.timestamp).toBeDefined();
    });

    it('should return false for database when query fails', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Connection lost'));

      const result = await healthCheck({});

      expect(result.database).toBe(false);
    });

    it('should handle missing communications service', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ check: 1 }] });

      const result = await healthCheck({});

      expect(result.database).toBe(true);
      expect(result.communications).toBe(false);
    });

    it('should handle missing checkConnectivity method', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ check: 1 }] });
      const services = { communicationsService: {} };

      const result = await healthCheck(services);

      expect(result.communications).toBe(false);
    });

    it('should return false database when query returns empty', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await healthCheck({});

      expect(result.database).toBe(false);
    });
  });

  // ===========================================================================
  // GENERATE FOLLOW-UP REMINDERS
  // ===========================================================================

  describe('generateFollowUpReminders', () => {
    it('should skip when automations service is not available', async () => {
      const result = await generateFollowUpReminders({});

      expect(result.skipped).toBe(true);
    });

    it('should generate recalls and birthday reminders', async () => {
      const services = {
        automationsService: {
          checkDaysSinceVisitTriggers: jest.fn().mockResolvedValue({ processed: 5 }),
          checkBirthdayTriggers: jest.fn().mockResolvedValue({ processed: 2 }),
        },
      };

      const result = await generateFollowUpReminders(services);

      expect(result.recalls).toBe(5);
      expect(result.birthdays).toBe(2);
    });

    it('should handle null service responses', async () => {
      const services = {
        automationsService: {
          checkDaysSinceVisitTriggers: jest.fn().mockResolvedValue(null),
          checkBirthdayTriggers: jest.fn().mockResolvedValue(null),
        },
      };

      const result = await generateFollowUpReminders(services);

      expect(result.recalls).toBe(0);
      expect(result.birthdays).toBe(0);
    });

    it('should throw on error', async () => {
      const services = {
        automationsService: {
          checkDaysSinceVisitTriggers: jest.fn().mockRejectedValue(new Error('Automation error')),
        },
      };

      await expect(generateFollowUpReminders(services)).rejects.toThrow('Automation error');
    });
  });

  // ===========================================================================
  // PROCESS AUTOMATIONS
  // ===========================================================================

  describe('processAutomations', () => {
    it('should skip when automations service is not available', async () => {
      const result = await processAutomations({});

      expect(result.skipped).toBe(true);
    });

    it('should process automations and return result', async () => {
      const mockProcess = jest.fn().mockResolvedValue({ triggered: 3, actions: 5 });
      const services = { automationsService: { processAutomations: mockProcess } };

      const result = await processAutomations(services);

      expect(result).toEqual({ triggered: 3, actions: 5 });
    });

    it('should throw on error', async () => {
      const services = {
        automationsService: {
          processAutomations: jest.fn().mockRejectedValue(new Error('Process error')),
        },
      };

      await expect(processAutomations(services)).rejects.toThrow('Process error');
    });
  });

  // ===========================================================================
  // PROCESS RECALL SCHEDULES
  // ===========================================================================

  describe('processRecallSchedules', () => {
    it('should skip when recall engine is not available', async () => {
      const result = await processRecallSchedules({});

      expect(result.skipped).toBe(true);
    });

    it('should process recalls and return result', async () => {
      const mockProcess = jest.fn().mockResolvedValue({ processed: 10, sent: 8, skipped: 2 });
      const services = { recallEngine: { processRecalls: mockProcess } };

      const result = await processRecallSchedules(services);

      expect(result).toEqual({ processed: 10, sent: 8, skipped: 2 });
    });

    it('should throw on error', async () => {
      const services = {
        recallEngine: {
          processRecalls: jest.fn().mockRejectedValue(new Error('Recall error')),
        },
      };

      await expect(processRecallSchedules(services)).rejects.toThrow('Recall error');
    });
  });
});
