/**
 * BudgetTracker Tests
 * Verifies budget enforcement, cost calculation, and reset behavior
 */

import { jest } from '@jest/globals';

// Mock logger
jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock database
const mockQuery = jest.fn().mockResolvedValue({ rows: [{ total: 0 }] });
jest.unstable_mockModule('../../../src/config/database.js', () => ({
  query: mockQuery,
}));

const { BudgetTracker, COST_PER_MTOK } =
  await import('../../../src/services/providers/budgetTracker.js');

describe('BudgetTracker', () => {
  let tracker;

  beforeEach(() => {
    tracker = new BudgetTracker();
    tracker._dailyBudget = 10;
    tracker._monthlyBudget = 200;
    jest.clearAllMocks();
  });

  describe('canSpend()', () => {
    it('should allow spending when under budget', () => {
      tracker._dailySpend = 5;
      tracker._monthlySpend = 100;

      const result = tracker.canSpend();
      expect(result.allowed).toBe(true);
    });

    it('should block when daily budget exceeded', () => {
      tracker._dailySpend = 10.01;

      const result = tracker.canSpend();
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Daily');
    });

    it('should block when monthly budget exceeded', () => {
      tracker._monthlySpend = 200.01;

      const result = tracker.canSpend();
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Monthly');
    });

    it('should block at exact daily budget', () => {
      tracker._dailySpend = 10;
      const result = tracker.canSpend();
      expect(result.allowed).toBe(false);
    });
  });

  describe('recordUsage()', () => {
    it('should calculate sonnet cost correctly', async () => {
      const cost = await tracker.recordUsage({
        model: 'claude-sonnet-4-6',
        inputTokens: 1000,
        outputTokens: 500,
        cacheReadTokens: 0,
        cacheCreationTokens: 0,
      });

      // Input: 1000/1M * $3 = $0.003, Output: 500/1M * $15 = $0.0075
      const expectedCost = (1000 / 1_000_000) * 3.0 + (500 / 1_000_000) * 15.0;
      expect(cost).toBeCloseTo(expectedCost, 6);
    });

    it('should calculate haiku cost correctly', async () => {
      const cost = await tracker.recordUsage({
        model: 'claude-haiku-4-5',
        inputTokens: 1000,
        outputTokens: 500,
        cacheReadTokens: 0,
        cacheCreationTokens: 0,
      });

      const expectedCost = (1000 / 1_000_000) * 0.8 + (500 / 1_000_000) * 4.0;
      expect(cost).toBeCloseTo(expectedCost, 6);
    });

    it('should account for cache read discounts', async () => {
      const cost = await tracker.recordUsage({
        model: 'claude-sonnet-4-6',
        inputTokens: 1000,
        outputTokens: 100,
        cacheReadTokens: 800,
        cacheCreationTokens: 0,
      });

      // Standard input: 1000 - 800 = 200 tokens at $3/MTok
      // Cache read: 800 tokens at $0.30/MTok
      // Output: 100 tokens at $15/MTok
      const expected = (200 / 1_000_000) * 3.0 + (100 / 1_000_000) * 15.0 + (800 / 1_000_000) * 0.3;
      expect(cost).toBeCloseTo(expected, 6);
    });

    it('should account for cache creation surcharge', async () => {
      const cost = await tracker.recordUsage({
        model: 'claude-sonnet-4-6',
        inputTokens: 1000,
        outputTokens: 100,
        cacheReadTokens: 0,
        cacheCreationTokens: 500,
      });

      // Standard input: 1000 - 500 = 500 tokens at $3/MTok
      // Cache creation: 500 tokens at $3.75/MTok
      // Output: 100 tokens at $15/MTok
      const expected =
        (500 / 1_000_000) * 3.0 + (100 / 1_000_000) * 15.0 + (500 / 1_000_000) * 3.75;
      expect(cost).toBeCloseTo(expected, 6);
    });

    it('should accumulate daily and monthly spend', async () => {
      await tracker.recordUsage({
        model: 'claude-sonnet-4-6',
        inputTokens: 1_000_000,
        outputTokens: 0,
        cacheReadTokens: 0,
        cacheCreationTokens: 0,
      });

      expect(tracker._dailySpend).toBeCloseTo(3.0, 4);
      expect(tracker._monthlySpend).toBeCloseTo(3.0, 4);

      await tracker.recordUsage({
        model: 'claude-sonnet-4-6',
        inputTokens: 0,
        outputTokens: 1_000_000,
        cacheReadTokens: 0,
        cacheCreationTokens: 0,
      });

      expect(tracker._dailySpend).toBeCloseTo(18.0, 4); // 3 + 15
      expect(tracker._monthlySpend).toBeCloseTo(18.0, 4);
    });

    it('should persist usage to database', async () => {
      await tracker.recordUsage({
        model: 'claude-sonnet-4-6',
        inputTokens: 100,
        outputTokens: 50,
        cacheReadTokens: 0,
        cacheCreationTokens: 0,
        taskType: 'soap_notes',
        durationMs: 1500,
        organizationId: 'org-123',
      });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO ai_api_usage'),
        expect.arrayContaining(['claude', 'claude-sonnet-4-6', 100, 50, 0, 0])
      );
    });
  });

  describe('getStatus()', () => {
    it('should return daily and monthly budget status', () => {
      tracker._dailySpend = 2.5;
      tracker._monthlySpend = 50;

      const status = tracker.getStatus();

      expect(status.daily.spent).toBe(2.5);
      expect(status.daily.budget).toBe(10);
      expect(status.daily.remaining).toBe(7.5);
      expect(status.daily.percentUsed).toBe(25);

      expect(status.monthly.spent).toBe(50);
      expect(status.monthly.budget).toBe(200);
      expect(status.monthly.remaining).toBe(150);
      expect(status.monthly.percentUsed).toBe(25);
    });
  });

  describe('estimateCost()', () => {
    it('should estimate cost without recording', () => {
      const cost = tracker.estimateCost('claude-sonnet-4-6', 1_000_000, 100_000);
      // Input: 1M * $3/MTok = $3, Output: 0.1M * $15/MTok = $1.5
      expect(cost).toBeCloseTo(4.5, 4);
    });

    it('should fall back to sonnet pricing for unknown models', () => {
      const cost = tracker.estimateCost('unknown-model', 1_000_000, 0);
      expect(cost).toBeCloseTo(3.0, 4);
    });
  });

  describe('daily/monthly reset', () => {
    it('should reset daily spend on new day', () => {
      tracker._dailySpend = 8.0;
      tracker._lastDailyReset = '2025-01-01';

      const result = tracker.canSpend();
      expect(result.allowed).toBe(true);
      expect(tracker._dailySpend).toBe(0);
    });

    it('should reset monthly spend on new month', () => {
      tracker._monthlySpend = 150;
      tracker._lastMonthlyReset = '2025-01';

      const result = tracker.canSpend();
      expect(result.allowed).toBe(true);
      expect(tracker._monthlySpend).toBe(0);
    });
  });

  describe('init()', () => {
    it('should load from database without error', async () => {
      mockQuery.mockResolvedValue({ rows: [{ total: '5.50' }] });

      const freshTracker = new BudgetTracker();
      await freshTracker.init();

      expect(freshTracker._initialized).toBe(true);
    });

    it('should handle missing table gracefully', async () => {
      mockQuery.mockRejectedValueOnce(new Error('relation "ai_api_usage" does not exist'));

      const freshTracker = new BudgetTracker();
      await freshTracker.init();

      expect(freshTracker._initialized).toBe(true);
      expect(freshTracker._dailySpend).toBe(0);
    });

    it('should only initialize once', async () => {
      const freshTracker = new BudgetTracker();
      await freshTracker.init();
      await freshTracker.init();

      // Should only query DB once
      expect(mockQuery.mock.calls.length).toBeLessThanOrEqual(2); // daily + monthly
    });
  });

  describe('COST_PER_MTOK', () => {
    it('should have entries for sonnet and haiku', () => {
      expect(COST_PER_MTOK['claude-sonnet-4-6']).toBeDefined();
      expect(COST_PER_MTOK['claude-haiku-4-5']).toBeDefined();
    });

    it('should have cache pricing lower than standard input', () => {
      const sonnet = COST_PER_MTOK['claude-sonnet-4-6'];
      expect(sonnet.cacheRead).toBeLessThan(sonnet.input);
      expect(sonnet.cacheCreation).toBeGreaterThan(sonnet.input);
    });
  });
});
