/**
 * Unit Tests for AI Jobs
 * Tests daily metrics, retraining checks, weekly digest, backup
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

const { updateDailyAIMetrics, checkRetrainingNeeded, sendWeeklyAIDigest, backupTrainingData } =
  await import('../../../src/jobs/aiJobs.js');

describe('AI Jobs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================================================
  // UPDATE DAILY AI METRICS
  // ===========================================================================

  describe('updateDailyAIMetrics', () => {
    it('should skip when AI learning service is not available', async () => {
      const result = await updateDailyAIMetrics({});

      expect(result.skipped).toBe(true);
      expect(result.reason).toBe('service_not_available');
    });

    it('should update metrics and return results', async () => {
      const mockUpdateMetrics = jest.fn().mockResolvedValue({});
      const services = {
        aiLearningService: { updateDailyMetrics: mockUpdateMetrics },
      };
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            suggestion_type: 'soap_note',
            total: '10',
            accepted: '8',
            avg_confidence: '0.85',
            avg_rating: '4.2',
          },
        ],
      });

      const result = await updateDailyAIMetrics(services);

      expect(result.metrics).toHaveLength(1);
      expect(result.date).toBeDefined();
      expect(mockUpdateMetrics).toHaveBeenCalledTimes(1);
    });

    it('should use yesterday as the metrics date', async () => {
      const mockUpdateMetrics = jest.fn().mockResolvedValue({});
      const services = {
        aiLearningService: { updateDailyMetrics: mockUpdateMetrics },
      };
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await updateDailyAIMetrics(services);

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(result.date).toBe(yesterday.toISOString().split('T')[0]);
    });

    it('should throw on error', async () => {
      const services = {
        aiLearningService: {
          updateDailyMetrics: jest.fn().mockRejectedValue(new Error('Metrics fail')),
        },
      };

      await expect(updateDailyAIMetrics(services)).rejects.toThrow('Metrics fail');
    });
  });

  // ===========================================================================
  // CHECK RETRAINING NEEDED
  // ===========================================================================

  describe('checkRetrainingNeeded', () => {
    it('should skip when AI services are not available', async () => {
      const result = await checkRetrainingNeeded({});

      expect(result.skipped).toBe(true);
    });

    it('should skip when only one AI service is available', async () => {
      const result = await checkRetrainingNeeded({
        aiLearningService: {},
        aiRetrainingService: null,
      });

      expect(result.skipped).toBe(true);
    });

    it('should check and return triggered result', async () => {
      const mockCheck = jest
        .fn()
        .mockResolvedValue({ triggered: true, reason: 'threshold reached' });
      const services = {
        aiLearningService: {},
        aiRetrainingService: { checkAndTriggerRetraining: mockCheck },
      };

      const result = await checkRetrainingNeeded(services);

      expect(result.triggered).toBe(true);
    });

    it('should return not triggered result', async () => {
      const mockCheck = jest
        .fn()
        .mockResolvedValue({ triggered: false, reason: 'not enough data' });
      const services = {
        aiLearningService: {},
        aiRetrainingService: { checkAndTriggerRetraining: mockCheck },
      };

      const result = await checkRetrainingNeeded(services);

      expect(result.triggered).toBe(false);
    });

    it('should throw on error', async () => {
      const services = {
        aiLearningService: {},
        aiRetrainingService: {
          checkAndTriggerRetraining: jest.fn().mockRejectedValue(new Error('Check failed')),
        },
      };

      await expect(checkRetrainingNeeded(services)).rejects.toThrow('Check failed');
    });
  });

  // ===========================================================================
  // SEND WEEKLY AI DIGEST
  // ===========================================================================

  describe('sendWeeklyAIDigest', () => {
    it('should skip when report service is not available', async () => {
      const result = await sendWeeklyAIDigest({});

      expect(result.skipped).toBe(true);
    });

    it('should generate and return digest stats', async () => {
      const mockGenerate = jest.fn().mockResolvedValue({
        stats: { totalSuggestions: 150, acceptanceRate: 0.82 },
      });
      const services = { reportService: { generateWeeklyAIDigest: mockGenerate } };

      const result = await sendWeeklyAIDigest(services);

      expect(result.totalSuggestions).toBe(150);
      expect(result.acceptanceRate).toBe(0.82);
    });

    it('should throw on error', async () => {
      const services = {
        reportService: {
          generateWeeklyAIDigest: jest.fn().mockRejectedValue(new Error('Report failed')),
        },
      };

      await expect(sendWeeklyAIDigest(services)).rejects.toThrow('Report failed');
    });
  });

  // ===========================================================================
  // BACKUP TRAINING DATA
  // ===========================================================================

  describe('backupTrainingData', () => {
    it('should skip when AI learning service is not available', async () => {
      const result = await backupTrainingData({});

      expect(result.skipped).toBe(true);
    });

    it('should throw on export error', async () => {
      const services = {
        aiLearningService: {
          exportFeedbackForTraining: jest.fn().mockRejectedValue(new Error('Export failed')),
        },
      };

      await expect(backupTrainingData(services)).rejects.toThrow('Export failed');
    });
  });
});
