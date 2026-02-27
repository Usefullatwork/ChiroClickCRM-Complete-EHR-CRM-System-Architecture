/**
 * AI Provider Factory
 *
 * Creates the appropriate AI provider based on environment configuration.
 * Supports four modes via CLAUDE_FALLBACK_MODE:
 *   - disabled (default): Ollama only — identical to current behavior
 *   - fallback: Ollama primary, Claude if Ollama fails
 *   - preferred: Claude primary, Ollama fallback
 *   - claude_only: Claude only, no Ollama
 *
 * Follows the emailProvider.js factory pattern established in this codebase.
 */

import logger from '../../utils/logger.js';
import { OllamaProvider } from './ollamaProvider.js';
import { ClaudeProvider } from './claudeProvider.js';
import budgetTracker from './budgetTracker.js';

/**
 * FallbackProvider wraps two providers with automatic failover.
 * On primary failure, transparently retries with the secondary provider.
 */
class FallbackProvider {
  constructor(primary, secondary, name = 'fallback') {
    this.name = name;
    this.primary = primary;
    this.secondary = secondary;
  }

  async generate(prompt, systemPrompt, options) {
    // Budget check for Claude (whether primary or secondary)
    const claudeProvider = [this.primary, this.secondary].find((p) => p?.name === 'claude');
    if (claudeProvider === this.primary) {
      const budget = budgetTracker.canSpend();
      if (!budget.allowed) {
        logger.warn('Claude budget exceeded, falling back to secondary', { reason: budget.reason });
        if (this.secondary) {
          return this.secondary.generate(prompt, systemPrompt, options);
        }
        throw new Error(budget.reason);
      }
    }

    try {
      const result = await this.primary.generate(prompt, systemPrompt, options);

      // Track Claude spend
      if (result.provider === 'claude' && result.usage) {
        await budgetTracker.recordUsage({
          model: result.model,
          inputTokens: result.usage.inputTokens,
          outputTokens: result.usage.outputTokens,
          cacheReadTokens: result.usage.cacheReadTokens || 0,
          cacheCreationTokens: result.usage.cacheCreationTokens || 0,
          taskType: options.taskType,
          durationMs: result.durationMs,
          organizationId: options.organizationId,
        });
      }

      return result;
    } catch (primaryError) {
      if (!this.secondary) throw primaryError;

      logger.warn(
        `Primary provider (${this.primary.name}) failed, falling back to ${this.secondary.name}`,
        {
          error: primaryError.message,
        }
      );

      try {
        const result = await this.secondary.generate(prompt, systemPrompt, options);

        // Track Claude spend on secondary path
        if (result.provider === 'claude' && result.usage) {
          await budgetTracker.recordUsage({
            model: result.model,
            inputTokens: result.usage.inputTokens,
            outputTokens: result.usage.outputTokens,
            cacheReadTokens: result.usage.cacheReadTokens || 0,
            cacheCreationTokens: result.usage.cacheCreationTokens || 0,
            taskType: options.taskType,
            durationMs: result.durationMs,
            organizationId: options.organizationId,
          });
        }

        return result;
      } catch (secondaryError) {
        logger.error(`Both providers failed`, {
          primary: primaryError.message,
          secondary: secondaryError.message,
        });
        throw primaryError; // Throw original error
      }
    }
  }

  async generateStream(model, prompt, res) {
    // Streaming uses the primary provider only — no failover mid-stream
    return this.primary.generateStream(model, prompt, res);
  }

  async isAvailable() {
    return (
      (await this.primary.isAvailable()) ||
      (this.secondary ? await this.secondary.isAvailable() : false)
    );
  }

  async getStatus() {
    const primaryStatus = await this.primary.getStatus();
    const secondaryStatus = this.secondary ? await this.secondary.getStatus() : null;
    const budget = budgetTracker.getStatus();

    return {
      provider: this.name,
      mode: process.env.CLAUDE_FALLBACK_MODE || 'disabled',
      primary: primaryStatus,
      secondary: secondaryStatus,
      budget,
      available: primaryStatus.available || (secondaryStatus?.available ?? false),
    };
  }
}

/**
 * Factory: creates the appropriate provider based on CLAUDE_FALLBACK_MODE
 */
export function createAIProvider() {
  const mode = (process.env.CLAUDE_FALLBACK_MODE || 'disabled').toLowerCase();

  const ollama = new OllamaProvider();
  const claude = new ClaudeProvider();

  switch (mode) {
    case 'disabled':
      logger.info('AI Provider: Ollama only (Claude disabled)');
      return ollama;

    case 'fallback':
      logger.info('AI Provider: Ollama primary, Claude fallback');
      return new FallbackProvider(ollama, claude, 'ollama+claude');

    case 'preferred':
      logger.info('AI Provider: Claude primary, Ollama fallback');
      return new FallbackProvider(claude, ollama, 'claude+ollama');

    case 'claude_only':
      logger.info('AI Provider: Claude only (no Ollama fallback)');
      return claude;

    default:
      logger.warn(`Unknown CLAUDE_FALLBACK_MODE "${mode}", defaulting to Ollama only`);
      return ollama;
  }
}

// Create and export the singleton provider instance
let _provider = null;

export function getAIProvider() {
  if (!_provider) {
    _provider = createAIProvider();
  }
  return _provider;
}

// Allow resetting for tests
export function _resetProvider() {
  _provider = null;
}

export { FallbackProvider, OllamaProvider, ClaudeProvider };
