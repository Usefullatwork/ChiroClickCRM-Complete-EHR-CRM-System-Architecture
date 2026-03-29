/**
 * Unit Tests for Retraining Metrics
 * Tests training run recording, status queries, history
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
  recordTrainingRun,
  getLastTrainingRun,
  getTrainingHistory,
  getRetrainingStatus,
  getRetrainingHistory,
} = await import('../../../src/application/services/retrainingMetrics.js');

describe('Retraining Metrics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================================================
  // RECORD TRAINING RUN
  // ===========================================================================

  describe('recordTrainingRun', () => {
    it('should insert a new training run record', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      await recordTrainingRun('run-1', 'STARTED', {});

      expect(mockQuery).toHaveBeenCalledTimes(1);
      const args = mockQuery.mock.calls[0][1];
      expect(args[0]).toBe('run-1');
      expect(args[1]).toBe('STARTED');
    });

    it('should stringify metadata to JSON', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      await recordTrainingRun('run-2', 'COMPLETED', { accuracy: 0.95 });

      const args = mockQuery.mock.calls[0][1];
      expect(args[2]).toBe(JSON.stringify({ accuracy: 0.95 }));
    });

    it('should handle database error silently', async () => {
      mockQuery.mockRejectedValue(new Error('DB error'));

      await expect(recordTrainingRun('run-3', 'FAILED', {})).resolves.not.toThrow();
    });

    it('should use upsert (ON CONFLICT) for duplicate run IDs', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      await recordTrainingRun('run-4', 'COMPLETED', { updated: true });

      const sql = mockQuery.mock.calls[0][0];
      expect(sql).toContain('ON CONFLICT');
    });

    it('should set completed_at for COMPLETED status', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      await recordTrainingRun('run-5', 'COMPLETED', {});

      const sql = mockQuery.mock.calls[0][0];
      expect(sql).toContain('NOW()');
    });

    it('should set completed_at for FAILED status', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      await recordTrainingRun('run-6', 'FAILED', { error: 'Timeout' });

      const sql = mockQuery.mock.calls[0][0];
      // FAILED should also set completed_at to NOW()
      expect(sql).toContain('NOW()');
    });
  });

  // ===========================================================================
  // GET LAST TRAINING RUN
  // ===========================================================================

  describe('getLastTrainingRun', () => {
    it('should return the most recent completed run', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'run-10',
            status: 'COMPLETED',
            completed_at: '2026-03-25T00:00:00Z',
            metadata: '{"accuracy": 0.92}',
          },
        ],
      });

      const result = await getLastTrainingRun();

      expect(result.id).toBe('run-10');
      expect(result.status).toBe('COMPLETED');
    });

    it('should return null when no completed runs exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await getLastTrainingRun();

      expect(result).toBeNull();
    });

    it('should return null on database error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB error'));

      const result = await getLastTrainingRun();

      expect(result).toBeNull();
    });
  });

  // ===========================================================================
  // GET TRAINING HISTORY
  // ===========================================================================

  describe('getTrainingHistory', () => {
    it('should return training history with default limit', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { id: 'run-1', status: 'COMPLETED' },
          { id: 'run-2', status: 'FAILED' },
        ],
      });

      const result = await getTrainingHistory();

      expect(result).toHaveLength(2);
      expect(mockQuery.mock.calls[0][1]).toEqual([10]); // default limit
    });

    it('should use custom limit', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await getTrainingHistory(5);

      expect(mockQuery.mock.calls[0][1]).toEqual([5]);
    });

    it('should return empty array on error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Table missing'));

      const result = await getTrainingHistory();

      expect(result).toEqual([]);
    });
  });

  // ===========================================================================
  // GET RETRAINING STATUS
  // ===========================================================================

  describe('getRetrainingStatus', () => {
    it('should return current event and threshold metrics', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ id: 'evt-1', status: 'completed', trigger_type: 'manual' }],
        })
        .mockResolvedValueOnce({
          rows: [{ feedback_count: '45', rejection_count: '10' }],
        });

      const result = await getRetrainingStatus(false, 'v6');

      expect(result.currentEvent.id).toBe('evt-1');
      expect(result.currentModelVersion).toBe('v6');
      expect(result.isRetraining).toBe(false);
      expect(result.thresholds.currentFeedbackCount).toBe(45);
      expect(result.thresholds.currentRejectionCount).toBe(10);
    });

    it('should indicate threshold reached when feedback exceeds limit', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({
        rows: [{ feedback_count: '60', rejection_count: '5' }],
      });

      const result = await getRetrainingStatus(false, 'v5');

      expect(result.thresholds.thresholdReached).toBe(true);
    });

    it('should indicate threshold reached when rejections exceed limit', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({
        rows: [{ feedback_count: '10', rejection_count: '25' }],
      });

      const result = await getRetrainingStatus(false, 'v5');

      expect(result.thresholds.thresholdReached).toBe(true);
    });

    it('should indicate threshold not reached when below limits', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({
        rows: [{ feedback_count: '10', rejection_count: '5' }],
      });

      const result = await getRetrainingStatus(false, 'v5');

      expect(result.thresholds.thresholdReached).toBe(false);
    });

    it('should throw on database error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Connection lost'));

      await expect(getRetrainingStatus(false, 'v5')).rejects.toThrow('Connection lost');
    });

    it('should handle null event when no retraining events exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({
        rows: [{ feedback_count: '0', rejection_count: '0' }],
      });

      const result = await getRetrainingStatus(false, 'v5');

      expect(result.currentEvent).toBeNull();
    });

    it('should reflect isRetraining state', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({
        rows: [{ feedback_count: '0', rejection_count: '0' }],
      });

      const result = await getRetrainingStatus(true, 'v5');

      expect(result.isRetraining).toBe(true);
    });
  });

  // ===========================================================================
  // GET RETRAINING HISTORY
  // ===========================================================================

  describe('getRetrainingHistory', () => {
    it('should return retraining events with default limit', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { id: 'evt-1', model_version: 'v6', status: 'completed' },
          { id: 'evt-2', model_version: 'v5', status: 'failed' },
        ],
      });

      const result = await getRetrainingHistory();

      expect(result).toHaveLength(2);
      expect(mockQuery.mock.calls[0][1]).toEqual([20]); // default limit
    });

    it('should use custom limit', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await getRetrainingHistory(5);

      expect(mockQuery.mock.calls[0][1]).toEqual([5]);
    });

    it('should return empty array on error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Table missing'));

      const result = await getRetrainingHistory();

      expect(result).toEqual([]);
    });
  });
});
