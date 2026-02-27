/**
 * Ollama AI Provider
 *
 * Extracts Ollama-specific generation logic from ai.js into a standalone provider.
 * Handles both synchronous and streaming completions via the Ollama HTTP API.
 *
 * This is the default (free, local, offline) provider. No API key required.
 */

import axios from 'axios';
import logger from '../../utils/logger.js';
import circuitBreakerRegistry from '../../infrastructure/resilience/CircuitBreakerRegistry.js';
import { AIProviderBase } from './aiProvider.js';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_TIMEOUT_MS = parseInt(process.env.AI_TIMEOUT || '30000', 10);
const OLLAMA_RETRY_BACKOFF_MS = 2000;
const OLLAMA_MAX_RETRIES = 1;
const KEEP_ALIVE = process.env.AI_KEEP_ALIVE || '2m';

let currentLoadedModel = null;

class OllamaProvider extends AIProviderBase {
  constructor() {
    super('ollama');
    this._breaker = circuitBreakerRegistry.getBreaker('ollama');
    this._breaker.requestTimeout = OLLAMA_TIMEOUT_MS + 5000;
  }

  /**
   * Generate a completion via Ollama /api/generate
   * Includes retry logic: 1 retry with 2s backoff for timeout errors only
   */
  async generate(prompt, systemPrompt = null, options = {}) {
    const { maxTokens = 500, temperature = 0.3, model } = options;
    const selectedModel = model || process.env.AI_MODEL || 'chiro-no';

    const ollamaPayload = {
      model: selectedModel,
      prompt: systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt,
      stream: false,
      keep_alive: KEEP_ALIVE,
      options: {
        temperature,
        num_predict: maxTokens,
      },
    };

    let lastError = null;
    for (let attempt = 0; attempt <= OLLAMA_MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          logger.warn(`Ollama retry attempt ${attempt} for model "${selectedModel}"`, {
            previousError: lastError?.message,
          });
          await new Promise((resolve) => setTimeout(resolve, OLLAMA_RETRY_BACKOFF_MS));
        }

        if (currentLoadedModel && currentLoadedModel !== selectedModel) {
          logger.debug(`Model switch: ${currentLoadedModel} → ${selectedModel}`);
        }

        const startTime = Date.now();
        const response = await this._breaker.execute(() =>
          axios.post(`${OLLAMA_BASE_URL}/api/generate`, ollamaPayload, {
            timeout: OLLAMA_TIMEOUT_MS,
          })
        );

        currentLoadedModel = selectedModel;
        const durationMs = response.data.total_duration
          ? Math.round(response.data.total_duration / 1e6)
          : Date.now() - startTime;

        return {
          text: response.data.response,
          model: selectedModel,
          provider: 'ollama',
          durationMs,
          usage: {
            inputTokens: response.data.prompt_eval_count || 0,
            outputTokens: response.data.eval_count || 0,
            cacheReadTokens: 0,
          },
        };
      } catch (error) {
        lastError = error;
        const isTimeout =
          error.code === 'ECONNABORTED' ||
          error.code === 'ETIMEDOUT' ||
          (error.message && error.message.includes('timeout'));

        if (isTimeout) {
          logger.warn('Ollama request timed out', {
            model: selectedModel,
            attempt: attempt + 1,
            timeoutMs: OLLAMA_TIMEOUT_MS,
          });
          continue;
        }

        // Non-timeout errors: do not retry
        logger.error('Ollama completion error:', error.message);
        throw new Error('AI service unavailable');
      }
    }

    logger.error('Ollama completion failed after all retries', {
      model: selectedModel,
      retries: OLLAMA_MAX_RETRIES,
      error: lastError.message,
    });
    throw new Error('AI service unavailable (timeout after retries)');
  }

  /**
   * Stream a completion via Ollama /api/generate with stream: true
   * Writes SSE chunks directly to the Express response
   */
  async generateStream(model, prompt, res) {
    const selectedModel = model || process.env.AI_MODEL || 'chiro-no';

    try {
      const response = await this._breaker.execute(() =>
        axios.post(
          `${OLLAMA_BASE_URL}/api/generate`,
          {
            model: selectedModel,
            prompt,
            stream: true,
            keep_alive: KEEP_ALIVE,
          },
          { responseType: 'stream', timeout: OLLAMA_TIMEOUT_MS }
        )
      );

      response.data.on('data', (chunk) => {
        try {
          const parsed = JSON.parse(chunk.toString());
          if (parsed.response) {
            res.write(`data: ${JSON.stringify({ text: parsed.response })}\n\n`);
          }
          if (parsed.done) {
            res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
            res.end();
          }
        } catch (_e) {
          // Skip unparseable chunks
        }
      });

      response.data.on('error', (err) => {
        res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
        res.end();
      });
    } catch (error) {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }

  /**
   * Check if Ollama is reachable
   */
  async isAvailable() {
    try {
      const response = await axios.get(`${OLLAMA_BASE_URL}/api/tags`, {
        timeout: 5000,
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }

  /**
   * Get detailed Ollama status including available models
   */
  async getStatus() {
    try {
      const response = await axios.get(`${OLLAMA_BASE_URL}/api/tags`, {
        timeout: 5000,
      });
      const models = (response.data?.models || []).map((m) => m.name);
      return {
        provider: 'ollama',
        available: true,
        model: process.env.AI_MODEL || 'chiro-no',
        models,
        message: `Ollama running with ${models.length} models`,
      };
    } catch (error) {
      return {
        provider: 'ollama',
        available: false,
        model: process.env.AI_MODEL || 'chiro-no',
        message: `Ollama unavailable: ${error.message}`,
      };
    }
  }
}

export { OllamaProvider };
export default OllamaProvider;
