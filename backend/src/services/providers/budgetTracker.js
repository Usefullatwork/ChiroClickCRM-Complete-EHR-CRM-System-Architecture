/**
 * Claude API Budget Tracker
 *
 * Tracks daily/monthly Claude API spend and enforces hard limits.
 * Uses the ai_api_usage table for persistent tracking, with in-memory
 * accumulator for fast path checking (flushed to DB periodically).
 *
 * Cost model (as of 2026-02):
 * - Sonnet: $3/MTok input, $15/MTok output
 * - Haiku: $0.80/MTok input, $4/MTok output
 * - Cache read: 90% discount on input tokens
 * - Cache creation: 25% surcharge on input tokens
 */

import logger from '../../utils/logger.js';
import { query } from '../../config/database.js';

/**
 * Cost per million tokens by model (USD)
 */
const COST_PER_MTOK = {
  'claude-sonnet-4-6': { input: 3.0, output: 15.0, cacheRead: 0.3, cacheCreation: 3.75 },
  'claude-haiku-4-5': { input: 0.8, output: 4.0, cacheRead: 0.08, cacheCreation: 1.0 },
};

const DEFAULT_DAILY_BUDGET_USD = parseFloat(process.env.CLAUDE_DAILY_BUDGET_USD || '10');
const DEFAULT_MONTHLY_BUDGET_USD = parseFloat(process.env.CLAUDE_MONTHLY_BUDGET_USD || '200');

class BudgetTracker {
  constructor() {
    this._dailySpend = 0;
    this._monthlySpend = 0;
    this._lastDailyReset = this._todayKey();
    this._lastMonthlyReset = this._monthKey();
    this._dailyBudget = DEFAULT_DAILY_BUDGET_USD;
    this._monthlyBudget = DEFAULT_MONTHLY_BUDGET_USD;
    this._initialized = false;
  }

  /**
   * Initialize from database (call once at startup)
   */
  async init() {
    if (this._initialized) {
      return;
    }
    try {
      await this._loadFromDB();
      this._initialized = true;
    } catch (error) {
      // Table may not exist yet — use in-memory defaults
      logger.warn('BudgetTracker: could not load from DB, using in-memory tracking', {
        error: error.message,
      });
      this._initialized = true;
    }
  }

  /**
   * Check if a request is within budget. Returns { allowed, reason? }
   */
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

  /**
   * Record token usage and calculate cost
   */
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
    const costs = COST_PER_MTOK[model] || COST_PER_MTOK['claude-sonnet-4-6'];

    // Standard input tokens (minus cached ones)
    const standardInputTokens = Math.max(0, inputTokens - cacheReadTokens - cacheCreationTokens);
    const cost =
      (standardInputTokens / 1_000_000) * costs.input +
      (outputTokens / 1_000_000) * costs.output +
      (cacheReadTokens / 1_000_000) * costs.cacheRead +
      (cacheCreationTokens / 1_000_000) * costs.cacheCreation;

    this._checkResets();
    this._dailySpend += cost;
    this._monthlySpend += cost;

    // Persist to database (non-blocking)
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
    }).catch((err) => logger.warn('Failed to persist Claude API usage:', err.message));

    return cost;
  }

  /**
   * Get current budget status
   */
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

  /**
   * Calculate cost for a given usage (without recording it)
   */
  estimateCost(model, inputTokens, outputTokens) {
    const costs = COST_PER_MTOK[model] || COST_PER_MTOK['claude-sonnet-4-6'];
    return (inputTokens / 1_000_000) * costs.input + (outputTokens / 1_000_000) * costs.output;
  }

  // --- Internal helpers ---

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

  async _loadFromDB() {
    const today = this._todayKey();
    const monthStart = `${this._monthKey()}-01`;

    const dailyResult = await query(
      `SELECT COALESCE(SUM(cost_usd), 0) as total FROM ai_api_usage WHERE provider = 'claude' AND created_at >= $1`,
      [today]
    );
    this._dailySpend = parseFloat(dailyResult.rows[0]?.total || 0);

    const monthlyResult = await query(
      `SELECT COALESCE(SUM(cost_usd), 0) as total FROM ai_api_usage WHERE provider = 'claude' AND created_at >= $1`,
      [monthStart]
    );
    this._monthlySpend = parseFloat(monthlyResult.rows[0]?.total || 0);
  }

  async _persistUsage(data) {
    await query(
      `INSERT INTO ai_api_usage (provider, model, input_tokens, output_tokens, cache_read_tokens, cache_creation_tokens, cost_usd, task_type, duration_ms, organization_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
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

// Singleton
const budgetTracker = new BudgetTracker();

export { BudgetTracker, COST_PER_MTOK };
export default budgetTracker;
