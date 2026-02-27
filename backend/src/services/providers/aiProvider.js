/**
 * AI Provider Interface Contract
 *
 * Defines the common interface that all AI providers (Ollama, Claude, etc.)
 * must implement. Used by aiProviderFactory to create interchangeable providers.
 *
 * Pattern: Strategy Pattern — same interface, different implementations.
 * Follows the emailProvider.js factory pattern established in this codebase.
 */

/**
 * @typedef {Object} GenerateOptions
 * @property {number} [maxTokens=500] - Maximum tokens to generate
 * @property {number} [temperature=0.3] - Sampling temperature
 * @property {string} [taskType] - Clinical task type for model routing
 * @property {string} [model] - Specific model override
 * @property {boolean} [stream=false] - Whether to stream the response
 */

/**
 * @typedef {Object} GenerateResult
 * @property {string} text - Generated text
 * @property {string} model - Model that generated the response
 * @property {string} provider - Provider name ('ollama' or 'claude')
 * @property {number} [durationMs] - Request duration in milliseconds
 * @property {Object} [usage] - Token usage details
 * @property {number} [usage.inputTokens] - Input tokens consumed
 * @property {number} [usage.outputTokens] - Output tokens generated
 * @property {number} [usage.cacheReadTokens] - Tokens served from cache
 */

/**
 * @typedef {Object} ProviderStatus
 * @property {string} provider - Provider name
 * @property {boolean} available - Whether the provider is currently reachable
 * @property {string} [model] - Current/default model
 * @property {string} [message] - Human-readable status message
 * @property {Object} [budget] - Budget info (Claude only)
 */

/**
 * Base class documenting the provider contract.
 * Not enforced at runtime (JS has no interfaces), but serves as documentation
 * and a safety net — calling unimplemented methods throws clear errors.
 */
export class AIProviderBase {
  constructor(name) {
    this.name = name;
  }

  /**
   * Generate a completion from a prompt
   * @param {string} prompt - The user/clinical prompt
   * @param {string|null} systemPrompt - Optional system prompt
   * @param {GenerateOptions} options - Generation options
   * @returns {Promise<GenerateResult>}
   */
  async generate(_prompt, _systemPrompt, _options) {
    throw new Error(`${this.name}: generate() not implemented`);
  }

  /**
   * Generate a streaming completion, writing SSE chunks to an Express response
   * @param {string} model - Model to use
   * @param {string} prompt - The prompt
   * @param {import('express').Response} res - Express response for SSE
   * @returns {Promise<void>}
   */
  async generateStream(_model, _prompt, _res) {
    throw new Error(`${this.name}: generateStream() not implemented`);
  }

  /**
   * Check if the provider is currently available
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    throw new Error(`${this.name}: isAvailable() not implemented`);
  }

  /**
   * Get detailed provider status
   * @returns {Promise<ProviderStatus>}
   */
  async getStatus() {
    throw new Error(`${this.name}: getStatus() not implemented`);
  }
}

export default AIProviderBase;
