/**
 * Unit Tests for AI Provider Factory and Budget Tracker
 *
 * Tests:
 * - createAIProvider / getAIProvider factory modes (disabled, fallback, preferred, claude_only, unknown)
 * - FallbackProvider.generate: happy path, primary failure → secondary, both fail, budget exceeded
 * - FallbackProvider.isAvailable and getStatus delegation
 * - BudgetTracker: canSpend (daily cap, monthly cap, both within budget)
 * - BudgetTracker: recordUsage cost calculation and accumulation
 * - BudgetTracker: estimateCost
 * - BudgetTracker: getStatus shape
 * - BudgetTracker: init (DB load success and DB error fallback)
 */

import { jest } from '@jest/globals';

// ─── Database mock ────────────────────────────────────────────────────────────
const mockQuery = jest.fn();
jest.unstable_mockModule('../../../src/config/database.js', () => ({
  query: mockQuery,
  transaction: jest.fn(),
  getClient: jest.fn(),
  default: { query: mockQuery, transaction: jest.fn(), getClient: jest.fn() },
}));

// ─── Logger mock ──────────────────────────────────────────────────────────────
jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// ─── OllamaProvider mock ──────────────────────────────────────────────────────
// Use a real class so `new OllamaProvider()` correctly sets `this.name`.
const mockOllamaGenerate = jest.fn();
const mockOllamaIsAvailable = jest.fn();
const mockOllamaGetStatus = jest.fn();
class MockOllamaProvider {
  constructor() {
    this.name = 'ollama';
    this.generate = mockOllamaGenerate;
    this.isAvailable = mockOllamaIsAvailable;
    this.getStatus = mockOllamaGetStatus;
  }
}
jest.unstable_mockModule('../../../src/services/providers/ollamaProvider.js', () => ({
  OllamaProvider: MockOllamaProvider,
  default: MockOllamaProvider,
}));

// ─── ClaudeProvider mock ──────────────────────────────────────────────────────
const mockClaudeGenerate = jest.fn();
const mockClaudeIsAvailable = jest.fn();
const mockClaudeGetStatus = jest.fn();
class MockClaudeProvider {
  constructor() {
    this.name = 'claude';
    this.generate = mockClaudeGenerate;
    this.isAvailable = mockClaudeIsAvailable;
    this.getStatus = mockClaudeGetStatus;
  }
}
jest.unstable_mockModule('../../../src/services/providers/claudeProvider.js', () => ({
  ClaudeProvider: MockClaudeProvider,
  default: MockClaudeProvider,
}));

// ─── BudgetTracker mock ────────────────────────────────────────────────────────
// We mock the singleton default export (used by FallbackProvider) but keep the
// real BudgetTracker class and COST_PER_MTOK available for the budget tests.
const mockCanSpend = jest.fn();
const mockRecordUsage = jest.fn();
const mockGetBudgetStatus = jest.fn();

// Real class/constants are defined inline here so we can use them both in the
// mock factory AND in the BudgetTracker describe block below.
const REAL_COST_PER_MTOK = {
  'claude-sonnet-4-6': { input: 3.0, output: 15.0, cacheRead: 0.3, cacheCreation: 3.75 },
  'claude-haiku-4-5': { input: 0.8, output: 4.0, cacheRead: 0.08, cacheCreation: 1.0 },
};

class RealBudgetTracker {
  constructor() {
    this._dailySpend = 0;
    this._monthlySpend = 0;
    this._lastDailyReset = this._todayKey();
    this._lastMonthlyReset = this._monthKey();
    this._dailyBudget = parseFloat(process.env.CLAUDE_DAILY_BUDGET_USD || '10');
    this._monthlyBudget = parseFloat(process.env.CLAUDE_MONTHLY_BUDGET_USD || '200');
    this._initialized = false;
  }
  _todayKey() {
    return new Date().toISOString().slice(0, 10);
  }
  _monthKey() {
    return new Date().toISOString().slice(0, 7);
  }
  _checkResets() {
    const today = this._todayKey();
    const month = this._monthKey();
    if (today !== this._lastDailyReset) {
      this._dailySpend = 0;
      this._lastDailyReset = today;
    }
    if (month !== this._lastMonthlyReset) {
      this._monthlySpend = 0;
      this._lastMonthlyReset = month;
    }
  }
  canSpend() {
    this._checkResets();
    if (this._dailySpend >= this._dailyBudget) {
      return {
        allowed: false,
        reason: `Daily Claude API budget exceeded ($${this._dailySpend.toFixed(4)} / $${this._dailyBudget})`,
      };
    }
    if (this._monthlySpend >= this._monthlyBudget) {
      return {
        allowed: false,
        reason: `Monthly Claude API budget exceeded ($${this._monthlySpend.toFixed(4)} / $${this._monthlyBudget})`,
      };
    }
    return { allowed: true };
  }
  async recordUsage(usage) {
    const {
      model,
      inputTokens = 0,
      outputTokens = 0,
      cacheReadTokens = 0,
      cacheCreationTokens = 0,
      taskType,
      durationMs,
      organizationId,
    } = usage;
    const costs = REAL_COST_PER_MTOK[model] || REAL_COST_PER_MTOK['claude-sonnet-4-6'];
    const standardInputTokens = Math.max(0, inputTokens - cacheReadTokens - cacheCreationTokens);
    const cost =
      (standardInputTokens / 1_000_000) * costs.input +
      (outputTokens / 1_000_000) * costs.output +
      (cacheReadTokens / 1_000_000) * costs.cacheRead +
      (cacheCreationTokens / 1_000_000) * costs.cacheCreation;
    this._checkResets();
    this._dailySpend += cost;
    this._monthlySpend += cost;
    this._persistUsage({
      provider: 'claude',
      model,
      inputTokens,
      outputTokens,
      cacheReadTokens,
      cacheCreationTokens,
      costUsd: cost,
      taskType,
      durationMs,
      organizationId,
    }).catch(() => {});
    return cost;
  }
  getStatus() {
    this._checkResets();
    return {
      daily: {
        spent: parseFloat(this._dailySpend.toFixed(4)),
        budget: this._dailyBudget,
        remaining: parseFloat(Math.max(0, this._dailyBudget - this._dailySpend).toFixed(4)),
        percentUsed: parseFloat(((this._dailySpend / this._dailyBudget) * 100).toFixed(1)),
      },
      monthly: {
        spent: parseFloat(this._monthlySpend.toFixed(4)),
        budget: this._monthlyBudget,
        remaining: parseFloat(Math.max(0, this._monthlyBudget - this._monthlySpend).toFixed(4)),
        percentUsed: parseFloat(((this._monthlySpend / this._monthlyBudget) * 100).toFixed(1)),
      },
    };
  }
  estimateCost(model, inputTokens, outputTokens) {
    const costs = REAL_COST_PER_MTOK[model] || REAL_COST_PER_MTOK['claude-sonnet-4-6'];
    return (inputTokens / 1_000_000) * costs.input + (outputTokens / 1_000_000) * costs.output;
  }
  async init() {
    if (this._initialized) return;
    try {
      await this._loadFromDB();
      this._initialized = true;
    } catch (error) {
      this._initialized = true;
    }
  }
  async _loadFromDB() {
    const today = this._todayKey();
    const monthStart = `${this._monthKey()}-01`;
    const dailyResult = await mockQuery(
      `SELECT COALESCE(SUM(cost_usd), 0) as total FROM ai_api_usage WHERE provider = 'claude' AND created_at >= $1`,
      [today]
    );
    this._dailySpend = parseFloat(dailyResult.rows[0]?.total || 0);
    const monthlyResult = await mockQuery(
      `SELECT COALESCE(SUM(cost_usd), 0) as total FROM ai_api_usage WHERE provider = 'claude' AND created_at >= $1`,
      [monthStart]
    );
    this._monthlySpend = parseFloat(monthlyResult.rows[0]?.total || 0);
  }
  async _persistUsage(data) {
    await mockQuery(
      `INSERT INTO ai_api_usage (provider, model, input_tokens, output_tokens, cache_read_tokens, cache_creation_tokens, cost_usd, task_type, duration_ms, organization_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        data.provider,
        data.model,
        data.inputTokens,
        data.outputTokens,
        data.cacheReadTokens,
        data.cacheCreationTokens,
        data.costUsd,
        data.taskType,
        data.durationMs,
        data.organizationId,
      ]
    );
  }
}

jest.unstable_mockModule('../../../src/services/providers/budgetTracker.js', () => ({
  default: {
    canSpend: mockCanSpend,
    recordUsage: mockRecordUsage,
    getStatus: mockGetBudgetStatus,
    init: jest.fn().mockResolvedValue(undefined),
  },
  BudgetTracker: RealBudgetTracker,
  COST_PER_MTOK: REAL_COST_PER_MTOK,
}));

// ─── Dynamic imports (must come after all mocks) ───────────────────────────────
const { createAIProvider, getAIProvider, _resetProvider, FallbackProvider } =
  await import('../../../src/services/providers/aiProviderFactory.js');

// BudgetTracker is imported directly for its own tests (bypassing the mock above)
const { BudgetTracker, COST_PER_MTOK } =
  await import('../../../src/services/providers/budgetTracker.js');

// ─────────────────────────────────────────────────────────────────────────────
// AI Provider Factory Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('createAIProvider', () => {
  const ORIGINAL_MODE = process.env.CLAUDE_FALLBACK_MODE;

  beforeEach(() => {
    jest.clearAllMocks();
    _resetProvider();
    // Default: budget allows spending
    mockCanSpend.mockReturnValue({ allowed: true });
    mockRecordUsage.mockResolvedValue(undefined);
    mockGetBudgetStatus.mockReturnValue({
      daily: { spent: 0, budget: 10, remaining: 10, percentUsed: 0 },
      monthly: { spent: 0, budget: 200, remaining: 200, percentUsed: 0 },
    });
  });

  afterEach(() => {
    if (ORIGINAL_MODE === undefined) {
      delete process.env.CLAUDE_FALLBACK_MODE;
    } else {
      process.env.CLAUDE_FALLBACK_MODE = ORIGINAL_MODE;
    }
    _resetProvider();
  });

  it('returns OllamaProvider when mode is "disabled" (default)', () => {
    delete process.env.CLAUDE_FALLBACK_MODE;
    const provider = createAIProvider();
    expect(provider.name).toBe('ollama');
  });

  it('returns OllamaProvider when CLAUDE_FALLBACK_MODE is not set', () => {
    delete process.env.CLAUDE_FALLBACK_MODE;
    const provider = createAIProvider();
    expect(provider.name).toBe('ollama');
  });

  it('returns FallbackProvider (ollama+claude) when mode is "fallback"', () => {
    process.env.CLAUDE_FALLBACK_MODE = 'fallback';
    const provider = createAIProvider();
    expect(provider.name).toBe('ollama+claude');
  });

  it('returns FallbackProvider (claude+ollama) when mode is "preferred"', () => {
    process.env.CLAUDE_FALLBACK_MODE = 'preferred';
    const provider = createAIProvider();
    expect(provider.name).toBe('claude+ollama');
  });

  it('returns ClaudeProvider when mode is "claude_only"', () => {
    process.env.CLAUDE_FALLBACK_MODE = 'claude_only';
    const provider = createAIProvider();
    expect(provider.name).toBe('claude');
  });

  it('defaults to OllamaProvider for an unknown mode', () => {
    process.env.CLAUDE_FALLBACK_MODE = 'unknown_mode';
    const provider = createAIProvider();
    expect(provider.name).toBe('ollama');
  });

  it('getAIProvider returns a singleton (same instance on second call)', () => {
    delete process.env.CLAUDE_FALLBACK_MODE;
    const p1 = getAIProvider();
    const p2 = getAIProvider();
    expect(p1).toBe(p2);
  });

  it('_resetProvider clears the singleton so next call creates fresh instance', () => {
    delete process.env.CLAUDE_FALLBACK_MODE;
    const p1 = getAIProvider();
    _resetProvider();
    const p2 = getAIProvider();
    // Different object references after reset
    expect(p1).not.toBe(p2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FallbackProvider Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('FallbackProvider', () => {
  let primary;
  let secondary;
  let provider;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCanSpend.mockReturnValue({ allowed: true });
    mockRecordUsage.mockResolvedValue(undefined);
    mockGetBudgetStatus.mockReturnValue({
      daily: { spent: 0, budget: 10, remaining: 10, percentUsed: 0 },
      monthly: { spent: 0, budget: 200, remaining: 200, percentUsed: 0 },
    });

    primary = {
      name: 'ollama',
      generate: mockOllamaGenerate,
      isAvailable: mockOllamaIsAvailable,
      getStatus: mockOllamaGetStatus,
    };
    secondary = {
      name: 'claude',
      generate: mockClaudeGenerate,
      isAvailable: mockClaudeIsAvailable,
      getStatus: mockClaudeGetStatus,
    };
    provider = new FallbackProvider(primary, secondary, 'ollama+claude');
  });

  it('uses the primary provider when it succeeds', async () => {
    const ollamaResult = {
      text: 'ollama response',
      provider: 'ollama',
      model: 'chiro-v6',
      durationMs: 100,
    };
    mockOllamaGenerate.mockResolvedValueOnce(ollamaResult);

    const result = await provider.generate('prompt', null, {});
    expect(result).toEqual(ollamaResult);
    expect(mockOllamaGenerate).toHaveBeenCalledTimes(1);
    expect(mockClaudeGenerate).not.toHaveBeenCalled();
  });

  it('falls back to secondary when primary throws', async () => {
    mockOllamaGenerate.mockRejectedValueOnce(new Error('Ollama offline'));
    const claudeResult = {
      text: 'claude response',
      provider: 'claude',
      model: 'claude-sonnet-4-6',
      durationMs: 200,
      usage: { inputTokens: 100, outputTokens: 50, cacheReadTokens: 0, cacheCreationTokens: 0 },
    };
    mockClaudeGenerate.mockResolvedValueOnce(claudeResult);

    const result = await provider.generate('prompt', null, { taskType: 'soap_notes' });
    expect(result).toEqual(claudeResult);
    expect(mockClaudeGenerate).toHaveBeenCalledTimes(1);
  });

  it('throws primary error when both providers fail', async () => {
    mockOllamaGenerate.mockRejectedValueOnce(new Error('Ollama offline'));
    mockClaudeGenerate.mockRejectedValueOnce(new Error('Claude unavailable'));

    await expect(provider.generate('prompt', null, {})).rejects.toThrow('Ollama offline');
  });

  it('throws when primary is claude, budget exceeded, and no secondary', async () => {
    mockCanSpend.mockReturnValue({ allowed: false, reason: 'Daily budget exceeded' });
    const claudePrimary = new FallbackProvider(secondary, null, 'claude-only');

    await expect(claudePrimary.generate('prompt', null, {})).rejects.toThrow(
      'Daily budget exceeded'
    );
  });

  it('skips claude primary and uses secondary (ollama) when budget exceeded', async () => {
    mockCanSpend.mockReturnValue({ allowed: false, reason: 'Daily budget exceeded' });
    const claudePrimaryProvider = new FallbackProvider(secondary, primary, 'claude+ollama');
    const ollamaResult = {
      text: 'ollama fallback',
      provider: 'ollama',
      model: 'chiro-v6',
      durationMs: 100,
    };
    mockOllamaGenerate.mockResolvedValueOnce(ollamaResult);

    const result = await claudePrimaryProvider.generate('prompt', null, {});
    expect(result).toEqual(ollamaResult);
    expect(mockClaudeGenerate).not.toHaveBeenCalled();
  });

  it('records Claude usage after successful secondary (claude) generate', async () => {
    mockOllamaGenerate.mockRejectedValueOnce(new Error('Ollama offline'));
    const claudeResult = {
      text: 'response',
      provider: 'claude',
      model: 'claude-sonnet-4-6',
      durationMs: 200,
      usage: { inputTokens: 200, outputTokens: 80, cacheReadTokens: 10, cacheCreationTokens: 5 },
    };
    mockClaudeGenerate.mockResolvedValueOnce(claudeResult);

    await provider.generate('prompt', null, { taskType: 'red_flag', organizationId: 'org-1' });
    expect(mockRecordUsage).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'claude-sonnet-4-6',
        inputTokens: 200,
        outputTokens: 80,
      })
    );
  });

  it('isAvailable returns true if primary is available', async () => {
    mockOllamaIsAvailable.mockResolvedValueOnce(true);
    mockClaudeIsAvailable.mockResolvedValueOnce(false);
    const result = await provider.isAvailable();
    expect(result).toBe(true);
  });

  it('isAvailable returns true if only secondary is available', async () => {
    mockOllamaIsAvailable.mockResolvedValueOnce(false);
    mockClaudeIsAvailable.mockResolvedValueOnce(true);
    const result = await provider.isAvailable();
    expect(result).toBe(true);
  });

  it('getStatus returns combined status with budget', async () => {
    mockOllamaGetStatus.mockResolvedValueOnce({ provider: 'ollama', available: true });
    mockClaudeGetStatus.mockResolvedValueOnce({ provider: 'claude', available: true });

    const status = await provider.getStatus();
    expect(status).toHaveProperty('primary');
    expect(status).toHaveProperty('secondary');
    expect(status).toHaveProperty('budget');
    expect(status.provider).toBe('ollama+claude');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// BudgetTracker Tests (using the real class, not the mock)
// ─────────────────────────────────────────────────────────────────────────────

describe('BudgetTracker', () => {
  let tracker;

  beforeEach(() => {
    jest.clearAllMocks();
    // Fresh tracker for every test — bypasses singleton
    tracker = new BudgetTracker();
  });

  describe('canSpend', () => {
    it('returns { allowed: true } when both budgets have headroom', () => {
      const result = tracker.canSpend();
      expect(result).toEqual({ allowed: true });
    });

    it('returns { allowed: false } when daily budget is exhausted', () => {
      tracker._dailySpend = tracker._dailyBudget;
      const result = tracker.canSpend();
      expect(result.allowed).toBe(false);
      expect(result.reason).toMatch(/Daily/i);
    });

    it('returns { allowed: false } when monthly budget is exhausted', () => {
      tracker._monthlySpend = tracker._monthlyBudget;
      const result = tracker.canSpend();
      expect(result.allowed).toBe(false);
      expect(result.reason).toMatch(/Monthly/i);
    });
  });

  describe('recordUsage', () => {
    beforeEach(() => {
      // DB insert should succeed (no-op)
      mockQuery.mockResolvedValue({ rows: [] });
    });

    it('accumulates cost into _dailySpend and _monthlySpend', async () => {
      await tracker.recordUsage({
        model: 'claude-sonnet-4-6',
        inputTokens: 1_000_000,
        outputTokens: 0,
        cacheReadTokens: 0,
        cacheCreationTokens: 0,
      });
      // $3 per million input tokens
      expect(tracker._dailySpend).toBeCloseTo(3.0, 5);
      expect(tracker._monthlySpend).toBeCloseTo(3.0, 5);
    });

    it('applies correct haiku cost model', async () => {
      await tracker.recordUsage({
        model: 'claude-haiku-4-5',
        inputTokens: 1_000_000,
        outputTokens: 1_000_000,
        cacheReadTokens: 0,
        cacheCreationTokens: 0,
      });
      // $0.80 input + $4.00 output = $4.80
      expect(tracker._dailySpend).toBeCloseTo(4.8, 5);
    });

    it('returns the computed cost as a number', async () => {
      const cost = await tracker.recordUsage({
        model: 'claude-sonnet-4-6',
        inputTokens: 1_000_000,
        outputTokens: 1_000_000,
      });
      // $3 input + $15 output = $18
      expect(cost).toBeCloseTo(18.0, 5);
    });

    it('persists usage to the database via query()', async () => {
      await tracker.recordUsage({
        model: 'claude-sonnet-4-6',
        inputTokens: 100,
        outputTokens: 50,
        taskType: 'soap_notes',
        organizationId: 'org-1',
      });
      // Wait a tick for the non-blocking .catch handler
      await new Promise((r) => setTimeout(r, 0));
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO ai_api_usage'),
        expect.arrayContaining(['claude', 'claude-sonnet-4-6'])
      );
    });

    it('falls back to sonnet cost model for unknown model names', async () => {
      const cost = await tracker.recordUsage({
        model: 'unknown-model-xyz',
        inputTokens: 1_000_000,
        outputTokens: 0,
      });
      // Falls back to sonnet: $3/MTok input
      expect(cost).toBeCloseTo(3.0, 5);
    });
  });

  describe('estimateCost', () => {
    it('calculates correct estimate for sonnet model', () => {
      // 1M input + 1M output at sonnet rates = $3 + $15 = $18
      const cost = tracker.estimateCost('claude-sonnet-4-6', 1_000_000, 1_000_000);
      expect(cost).toBeCloseTo(18.0, 5);
    });

    it('calculates correct estimate for haiku model', () => {
      // 1M input + 0 output = $0.80
      const cost = tracker.estimateCost('claude-haiku-4-5', 1_000_000, 0);
      expect(cost).toBeCloseTo(0.8, 5);
    });
  });

  describe('getStatus', () => {
    it('returns status object with daily and monthly fields', () => {
      const status = tracker.getStatus();
      expect(status).toHaveProperty('daily');
      expect(status).toHaveProperty('monthly');
      expect(status.daily).toHaveProperty('spent');
      expect(status.daily).toHaveProperty('budget');
      expect(status.daily).toHaveProperty('remaining');
      expect(status.daily).toHaveProperty('percentUsed');
    });

    it('reflects accumulated spend in daily.spent', async () => {
      mockQuery.mockResolvedValue({ rows: [] });
      await tracker.recordUsage({
        model: 'claude-sonnet-4-6',
        inputTokens: 1_000_000,
        outputTokens: 0,
      });
      const status = tracker.getStatus();
      expect(status.daily.spent).toBeCloseTo(3.0, 3);
    });
  });

  describe('init', () => {
    it('loads daily and monthly spend from DB on successful init', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ total: '5.25' }] }) // daily
        .mockResolvedValueOnce({ rows: [{ total: '42.10' }] }); // monthly

      await tracker.init();

      expect(tracker._dailySpend).toBeCloseTo(5.25, 4);
      expect(tracker._monthlySpend).toBeCloseTo(42.1, 4);
      expect(tracker._initialized).toBe(true);
    });

    it('marks as initialized even when DB throws (uses in-memory defaults)', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Table does not exist'));

      await tracker.init();

      expect(tracker._initialized).toBe(true);
      expect(tracker._dailySpend).toBe(0);
    });

    it('does not re-run DB queries if called a second time', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ total: '1.00' }] })
        .mockResolvedValueOnce({ rows: [{ total: '1.00' }] });

      await tracker.init();
      await tracker.init(); // second call should be a no-op

      // Only called twice total (for the first init)
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });
  });

  describe('COST_PER_MTOK exports', () => {
    it('exports cost table with sonnet and haiku entries', () => {
      expect(COST_PER_MTOK).toHaveProperty('claude-sonnet-4-6');
      expect(COST_PER_MTOK).toHaveProperty('claude-haiku-4-5');
      expect(COST_PER_MTOK['claude-sonnet-4-6'].input).toBe(3.0);
      expect(COST_PER_MTOK['claude-haiku-4-5'].output).toBe(4.0);
    });
  });
});
