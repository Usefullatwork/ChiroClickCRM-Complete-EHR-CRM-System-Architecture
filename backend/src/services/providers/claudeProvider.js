/**
 * Claude AI Provider
 *
 * Anthropic SDK wrapper providing Claude API access as an optional cloud
 * enhancement layer. Supports prompt caching for clinical system prompts,
 * model mapping from Ollama task types, and streaming.
 *
 * Requires: CLAUDE_API_KEY env var. Without it, isAvailable() returns false.
 */

import logger from '../../utils/logger.js';
import { AIProviderBase } from './aiProvider.js';
import clinicalPromptCache from './clinicalPromptCache.js';

// Lazy-load the SDK to avoid import errors when not installed
let Anthropic = null;

/**
 * Model mapping: Ollama task-based models → Claude equivalents
 * Sonnet for quality tasks, Haiku for speed-sensitive tasks
 */
const CLAUDE_MODEL_MAP = {
  // Clinical documentation — needs quality
  'chiro-no-lora-v4': 'claude-sonnet-4-6',
  'chiro-no-lora-v2': 'claude-sonnet-4-6',
  'chiro-no-lora': 'claude-sonnet-4-6',
  'chiro-no': 'claude-sonnet-4-6',

  // Norwegian specialist — needs quality
  'chiro-norwegian-lora-v2': 'claude-sonnet-4-6',
  'chiro-norwegian-lora': 'claude-sonnet-4-6',
  'chiro-norwegian': 'claude-sonnet-4-6',

  // Medical reasoning — needs quality
  'chiro-medical-lora': 'claude-sonnet-4-6',
  'chiro-medical': 'claude-sonnet-4-6',

  // Fast autocomplete — use Haiku for speed
  'chiro-fast-lora': 'claude-haiku-4-5',
  'chiro-fast': 'claude-haiku-4-5',
};

/**
 * Default Claude model when no mapping exists
 */
const DEFAULT_CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-6';

/**
 * Clinical system prompt components that benefit from caching.
 * These are stable across requests and save ~90% on repeated calls.
 */
const CACHEABLE_SYSTEM_PROMPTS = {
  clinical_base: `Du er en klinisk assistent for kiropraktorer i Norge. Du skriver alltid på norsk bokmål med korrekt medisinsk terminologi. Følg norsk helsepersonelllov og retningslinjer fra Norsk Kiropraktorforening.`,
  safety_context: `VIKTIG: Identifiser alltid røde flagg (red flags) som krever umiddelbar henvisning. Nevrologiske utfall, cauda equina-syndrom, frakturer, infeksjon, og malignitet skal alltid flagges. Ved tvil, anbefal henvisning.`,
};

class ClaudeProvider extends AIProviderBase {
  constructor() {
    super('claude');
    this._client = null;
    this._apiKey = process.env.CLAUDE_API_KEY || null;
  }

  /**
   * Lazy-initialize the Anthropic client
   */
  async _getClient() {
    if (this._client) return this._client;
    if (!this._apiKey) return null;

    try {
      if (!Anthropic) {
        const sdk = await import('@anthropic-ai/sdk');
        Anthropic = sdk.default || sdk.Anthropic;
      }
      this._client = new Anthropic({ apiKey: this._apiKey });
      return this._client;
    } catch (error) {
      logger.error('Failed to initialize Anthropic SDK:', error.message);
      return null;
    }
  }

  /**
   * Map an Ollama model name to the corresponding Claude model
   */
  _mapModel(ollamaModel) {
    return CLAUDE_MODEL_MAP[ollamaModel] || DEFAULT_CLAUDE_MODEL;
  }

  /**
   * Build system prompt with cache_control markers for prompt caching.
   * Caching saves ~90% on repeated system prompts (charged at 1/10th rate).
   */
  _buildSystemMessages(systemPrompt, taskType) {
    // Try cache-based composition first
    const cachedMessages = clinicalPromptCache.buildCacheableMessages(taskType, systemPrompt);
    if (cachedMessages) {
      return cachedMessages;
    }

    // Fallback: original logic for unmapped task types
    const messages = [];

    // Add cacheable clinical base context
    if (
      taskType &&
      [
        'red_flag_analysis',
        'differential_diagnosis',
        'treatment_safety',
        'clinical_reasoning',
        'medication_interaction',
        'contraindication_check',
      ].includes(taskType)
    ) {
      messages.push({
        type: 'text',
        text: CACHEABLE_SYSTEM_PROMPTS.safety_context,
        cache_control: { type: 'ephemeral' },
      });
    }

    // Add the actual system prompt (may or may not be cacheable)
    if (systemPrompt) {
      // System prompts longer than 1024 tokens benefit from caching
      const shouldCache = systemPrompt.length > 500;
      const block = { type: 'text', text: systemPrompt };
      if (shouldCache) {
        block.cache_control = { type: 'ephemeral' };
      }
      messages.push(block);
    } else {
      // Use default clinical base when no system prompt provided
      messages.push({
        type: 'text',
        text: CACHEABLE_SYSTEM_PROMPTS.clinical_base,
        cache_control: { type: 'ephemeral' },
      });
    }

    return messages;
  }

  /**
   * Generate a completion via Claude API
   */
  async generate(prompt, systemPrompt = null, options = {}) {
    const { maxTokens = 500, temperature = 0.3, model, taskType } = options;
    const client = await this._getClient();
    if (!client) {
      throw new Error('Claude API not available (no API key or SDK initialization failed)');
    }

    const claudeModel = this._mapModel(model);
    const system = this._buildSystemMessages(systemPrompt, taskType);

    const startTime = Date.now();

    try {
      const response = await client.messages.create({
        model: claudeModel,
        max_tokens: maxTokens,
        temperature,
        system,
        messages: [{ role: 'user', content: prompt }],
      });

      const durationMs = Date.now() - startTime;
      const text = response.content
        .filter((block) => block.type === 'text')
        .map((block) => block.text)
        .join('');

      return {
        text,
        model: claudeModel,
        provider: 'claude',
        durationMs,
        usage: {
          inputTokens: response.usage?.input_tokens || 0,
          outputTokens: response.usage?.output_tokens || 0,
          cacheReadTokens: response.usage?.cache_read_input_tokens || 0,
          cacheCreationTokens: response.usage?.cache_creation_input_tokens || 0,
        },
      };
    } catch (error) {
      logger.error('Claude API error:', {
        message: error.message,
        status: error.status,
        model: claudeModel,
        taskType,
      });

      // Map Anthropic error codes to actionable messages
      if (error.status === 401) {
        throw new Error('Claude API authentication failed — check CLAUDE_API_KEY');
      }
      if (error.status === 429) {
        throw new Error('Claude API rate limited — try again later');
      }
      if (error.status === 529) {
        throw new Error('Claude API overloaded — try again later');
      }
      throw new Error(`Claude API error: ${error.message}`);
    }
  }

  /**
   * Stream a completion via Claude API, writing SSE chunks to Express response
   */
  async generateStream(model, prompt, res) {
    const client = await this._getClient();
    if (!client) {
      res.write(`data: ${JSON.stringify({ error: 'Claude API not available' })}\n\n`);
      res.end();
      return;
    }

    const claudeModel = this._mapModel(model);

    try {
      const stream = client.messages.stream({
        model: claudeModel,
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
        system: [
          {
            type: 'text',
            text: CACHEABLE_SYSTEM_PROMPTS.clinical_base,
            cache_control: { type: 'ephemeral' },
          },
        ],
      });

      stream.on('text', (text) => {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      });

      stream.on('end', () => {
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
      });

      stream.on('error', (error) => {
        logger.error('Claude stream error:', error.message);
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
      });
    } catch (error) {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }

  /**
   * Check if Claude API is available (has API key and SDK loads)
   */
  async isAvailable() {
    if (!this._apiKey) return false;
    const client = await this._getClient();
    return client !== null;
  }

  /**
   * Get Claude provider status
   */
  async getStatus() {
    if (!this._apiKey) {
      return {
        provider: 'claude',
        available: false,
        message: 'No CLAUDE_API_KEY configured',
      };
    }

    const client = await this._getClient();
    if (!client) {
      return {
        provider: 'claude',
        available: false,
        message: 'Failed to initialize Anthropic SDK',
      };
    }

    return {
      provider: 'claude',
      available: true,
      model: DEFAULT_CLAUDE_MODEL,
      message: `Claude API ready (model: ${DEFAULT_CLAUDE_MODEL})`,
    };
  }
}

export {
  ClaudeProvider,
  CLAUDE_MODEL_MAP,
  CACHEABLE_SYSTEM_PROMPTS,
  DEFAULT_CLAUDE_MODEL,
  clinicalPromptCache,
};
export default ClaudeProvider;
