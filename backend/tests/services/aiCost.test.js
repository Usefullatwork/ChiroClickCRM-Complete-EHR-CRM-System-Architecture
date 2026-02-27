/**
 * AI Cost Controller Tests
 * Verifies cost analytics endpoints: budget, task breakdown, cache, trend
 */

import { jest } from '@jest/globals';

jest.unstable_mockModule('../../src/utils/logger.js', () => ({
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

const mockQuery = jest.fn();
jest.unstable_mockModule('../../src/config/database.js', () => ({
  query: mockQuery,
}));

const mockBudgetTracker = {
  getStatus: jest.fn(),
};
jest.unstable_mockModule('../../src/services/providers/budgetTracker.js', () => ({
  default: mockBudgetTracker,
}));

const {
  getBudgetStatus,
  getCostByTask,
  getCacheEfficiency,
  getDailyCostTrend,
  getProviderComparison,
} = await import('../../src/controllers/aiCost.js');

describe('AI Cost Controller', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { query: {}, organizationId: 'org-123' };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    mockBudgetTracker.getStatus.mockReturnValue({
      daily: { spent: 2.5, budget: 10, remaining: 7.5, percentUsed: 25 },
      monthly: { spent: 50, budget: 200, remaining: 150, percentUsed: 25 },
    });
    mockQuery.mockResolvedValue({ rows: [] });
  });

  describe('getBudgetStatus', () => {
    it('should return budget status from tracker', async () => {
      await getBudgetStatus(req, res);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          daily: expect.objectContaining({ spent: 2.5, budget: 10 }),
          monthly: expect.objectContaining({ spent: 50, budget: 200 }),
        }),
      });
    });
  });

  describe('getCostByTask', () => {
    it('should return cost breakdown', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            task_type: 'soap_notes',
            provider: 'claude',
            model: 'claude-sonnet-4-6',
            request_count: '10',
            total_cost_usd: '0.05',
            avg_cost_per_request: '0.005',
          },
        ],
      });

      await getCostByTask(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.arrayContaining([expect.objectContaining({ task_type: 'soap_notes' })]),
      });
    });

    it('should handle date filters', async () => {
      req.query = { startDate: '2026-02-01', endDate: '2026-02-28' };
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await getCostByTask(req, res);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('created_at >='),
        expect.arrayContaining(['2026-02-01', '2026-02-28'])
      );
    });

    it('should handle missing table gracefully', async () => {
      mockQuery.mockRejectedValueOnce(new Error('relation "ai_api_usage" does not exist'));

      await getCostByTask(req, res);

      expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
    });
  });

  describe('getCacheEfficiency', () => {
    it('should return cache metrics', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ model: 'claude-sonnet-4-6', total_requests: '100', cache_hit_rate_pct: '45.2' }],
      });

      await getCacheEfficiency(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.arrayContaining([expect.objectContaining({ model: 'claude-sonnet-4-6' })]),
      });
    });
  });

  describe('getDailyCostTrend', () => {
    it('should return daily trend data', async () => {
      req.query = { days: '7' };
      mockQuery.mockResolvedValueOnce({
        rows: [{ date: '2026-02-27', provider: 'claude', cost_usd: '1.50' }],
      });

      await getDailyCostTrend(req, res);

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('INTERVAL'), [7]);
    });

    it('should cap at 365 days', async () => {
      req.query = { days: '999' };
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await getDailyCostTrend(req, res);

      expect(mockQuery).toHaveBeenCalledWith(expect.any(String), [365]);
    });
  });

  describe('getProviderComparison', () => {
    it('should return provider side-by-side data', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { provider: 'claude', total_requests: '50', total_cost_usd: '2.50' },
          { provider: 'ollama', total_requests: '200', total_cost_usd: '0' },
        ],
      });

      await getProviderComparison(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({ provider: 'claude' }),
          expect.objectContaining({ provider: 'ollama' }),
        ]),
      });
    });
  });
});
