/**
 * AI Analytics Extended Controller Tests
 * Verifies cross-table analytics: cost-per-suggestion, provider-value, cache-trends
 */

import { jest } from '@jest/globals';

jest.unstable_mockModule('../../src/utils/logger.js', () => ({
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

const mockQuery = jest.fn();
jest.unstable_mockModule('../../src/config/database.js', () => ({
  query: mockQuery,
}));

const { getCostPerSuggestion, getProviderValue, getCacheTrends } =
  await import('../../src/controllers/aiAnalytics.js');

describe('AI Analytics Extended - Cross-table Endpoints', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { query: {}, organizationId: 'org-123' };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    mockQuery.mockResolvedValue({ rows: [] });
  });

  // =========================================================================
  // getCostPerSuggestion
  // =========================================================================
  describe('getCostPerSuggestion', () => {
    it('should return joined cost+quality data grouped by type and provider', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            suggestion_type: 'SOAP_COMPLETION',
            provider: 'claude',
            total_suggestions: '150',
            approved_count: '120',
            approval_rate: '80.0',
            avg_cost_usd: '0.003400',
            cost_per_approved_suggestion: '0.004250',
            avg_latency_ms: '1200',
          },
        ],
      });

      await getCostPerSuggestion(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [
          expect.objectContaining({
            suggestion_type: 'SOAP_COMPLETION',
            provider: 'claude',
            total_suggestions: '150',
            approved_count: '120',
          }),
        ],
      });
    });

    it('should handle startDate/endDate query params', async () => {
      req.query = { startDate: '2026-02-01', endDate: '2026-02-28' };
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await getCostPerSuggestion(req, res);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('s.created_at >= $2'),
        expect.arrayContaining(['org-123', '2026-02-01', '2026-02-28'])
      );
    });

    it('should return empty array when ai_api_usage table does not exist', async () => {
      mockQuery.mockRejectedValueOnce(new Error('relation "ai_api_usage" does not exist'));

      await getCostPerSuggestion(req, res);

      expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
    });

    it('should return empty array when ai_suggestions table does not exist', async () => {
      mockQuery.mockRejectedValueOnce(new Error('relation "ai_suggestions" does not exist'));

      await getCostPerSuggestion(req, res);

      expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
    });

    it('should return cost_per_approved_suggestion as null when approved_count is 0', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            suggestion_type: 'red_flag_analysis',
            provider: 'claude',
            total_suggestions: '10',
            approved_count: '0',
            approval_rate: '0',
            avg_cost_usd: '0.005000',
            cost_per_approved_suggestion: null,
            avg_latency_ms: '900',
          },
        ],
      });

      await getCostPerSuggestion(req, res);

      const data = res.json.mock.calls[0][0].data;
      expect(data[0].cost_per_approved_suggestion).toBeNull();
    });

    it('should return 500 on unexpected database error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('connection refused'));

      await getCostPerSuggestion(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to get cost per suggestion',
      });
    });
  });

  // =========================================================================
  // getProviderValue
  // =========================================================================
  describe('getProviderValue', () => {
    it('should return provider comparison with quality + cost merged', async () => {
      // Query 1: cost data
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            provider: 'claude',
            model: 'claude-sonnet-4-6',
            total_requests: '500',
            avg_cost_per_request: '0.004500',
            avg_latency_ms: '1400',
            total_cost: '2.2500',
            cache_hit_rate: '42.3',
          },
        ],
      });
      // Query 2: quality data
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            model_name: 'claude-sonnet-4-6',
            avg_confidence: '0.870',
            total_suggestions: '400',
            approved_count: '314',
            approval_rate: '78.5',
          },
        ],
      });

      await getProviderValue(req, res);

      const data = res.json.mock.calls[0][0].data;
      expect(data).toHaveLength(1);
      expect(data[0]).toEqual(
        expect.objectContaining({
          provider: 'claude',
          model: 'claude-sonnet-4-6',
          avg_confidence: '0.870',
          approval_rate: '78.5',
          cache_hit_rate: '42.3',
        })
      );
    });

    it('should calculate suggestions_per_dollar correctly', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            provider: 'claude',
            model: 'claude-sonnet-4-6',
            total_requests: '100',
            avg_cost_per_request: '0.020000',
            avg_latency_ms: '1000',
            total_cost: '2.0000',
            cache_hit_rate: '0',
          },
        ],
      });
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            model_name: 'claude-sonnet-4-6',
            avg_confidence: '0.800',
            total_suggestions: '100',
            approved_count: '20',
            approval_rate: '20.0',
          },
        ],
      });

      await getProviderValue(req, res);

      const data = res.json.mock.calls[0][0].data;
      // 20 approved / $2.00 = 10.0 suggestions per dollar
      expect(data[0].suggestions_per_dollar).toBe(10);
    });

    it('should handle Ollama zero cost (suggestions_per_dollar = null)', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            provider: 'ollama',
            model: 'chiro-no',
            total_requests: '2000',
            avg_cost_per_request: '0.000000',
            avg_latency_ms: '850',
            total_cost: '0.0000',
            cache_hit_rate: '0',
          },
        ],
      });
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            model_name: 'chiro-no',
            avg_confidence: '0.720',
            total_suggestions: '2000',
            approved_count: '1304',
            approval_rate: '65.2',
          },
        ],
      });

      await getProviderValue(req, res);

      const data = res.json.mock.calls[0][0].data;
      expect(data[0].suggestions_per_dollar).toBeNull();
    });

    it('should support days query param', async () => {
      req.query = { days: '7' };
      mockQuery.mockResolvedValueOnce({ rows: [] });
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await getProviderValue(req, res);

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('INTERVAL'), ['org-123', 7]);
    });

    it('should cap days at 365', async () => {
      req.query = { days: '999' };
      mockQuery.mockResolvedValueOnce({ rows: [] });
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await getProviderValue(req, res);

      expect(mockQuery).toHaveBeenCalledWith(expect.any(String), ['org-123', 365]);
    });

    it('should return empty array when tables do not exist', async () => {
      mockQuery.mockRejectedValueOnce(new Error('relation "ai_api_usage" does not exist'));

      await getProviderValue(req, res);

      expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
    });
  });

  // =========================================================================
  // getCacheTrends
  // =========================================================================
  describe('getCacheTrends', () => {
    it('should return daily cache utilization data', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            date: '2026-02-27',
            model: 'claude-sonnet-4-6',
            total_requests: '45',
            cache_reads: '12500',
            cache_read_pct: '38.5',
            estimated_savings_usd: '0.033750',
          },
        ],
      });

      await getCacheTrends(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [
          expect.objectContaining({
            date: '2026-02-27',
            model: 'claude-sonnet-4-6',
            total_requests: '45',
          }),
        ],
      });
    });

    it('should calculate estimated_savings_usd for Sonnet model', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            date: '2026-02-27',
            model: 'claude-sonnet-4-6',
            total_requests: '100',
            cache_reads: '1000000',
            cache_read_pct: '50.0',
            // Sonnet: 1M tokens * (3.0 - 0.3) / 1M = $2.70
            estimated_savings_usd: '2.700000',
          },
        ],
      });

      await getCacheTrends(req, res);

      const data = res.json.mock.calls[0][0].data;
      expect(data[0].estimated_savings_usd).toBe('2.700000');
    });

    it('should calculate estimated_savings_usd for Haiku model', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            date: '2026-02-27',
            model: 'claude-haiku-4-5',
            total_requests: '200',
            cache_reads: '1000000',
            cache_read_pct: '60.0',
            // Haiku: 1M tokens * (0.8 - 0.08) / 1M = $0.72
            estimated_savings_usd: '0.720000',
          },
        ],
      });

      await getCacheTrends(req, res);

      const data = res.json.mock.calls[0][0].data;
      expect(data[0].estimated_savings_usd).toBe('0.720000');
    });

    it('should support days query param', async () => {
      req.query = { days: '14' };
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await getCacheTrends(req, res);

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('INTERVAL'), [14]);
    });

    it('should default days to 30 when not provided', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await getCacheTrends(req, res);

      expect(mockQuery).toHaveBeenCalledWith(expect.any(String), [30]);
    });

    it('should return empty array when table does not exist', async () => {
      mockQuery.mockRejectedValueOnce(new Error('relation "ai_api_usage" does not exist'));

      await getCacheTrends(req, res);

      expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
    });
  });
});
