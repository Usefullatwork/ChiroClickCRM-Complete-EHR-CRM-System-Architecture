/**
 * ClaudeProvider Tests
 * Verifies Anthropic SDK wrapper: generate, stream, caching, error handling
 */

import { jest } from '@jest/globals';

// Mock database (clinicalPromptCache → redFlagEngine → database import chain)
jest.unstable_mockModule('../../../src/config/database.js', () => ({
  query: jest.fn(),
  default: { query: jest.fn() },
}));

// Mock logger
jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Shared mock functions that we'll re-setup in beforeEach
let mockCreate;
let mockStream;

jest.unstable_mockModule('@anthropic-ai/sdk', () => ({
  default: function MockAnthropic() {
    return { messages: { create: mockCreate, stream: mockStream } };
  },
  Anthropic: function MockAnthropic() {
    return { messages: { create: mockCreate, stream: mockStream } };
  },
}));

// Set API key before import
process.env.CLAUDE_API_KEY = 'test-api-key';

const { ClaudeProvider, CLAUDE_MODEL_MAP, clinicalPromptCache } =
  await import('../../../src/services/providers/claudeProvider.js');

describe('ClaudeProvider', () => {
  let provider;

  beforeEach(() => {
    // Re-create mock functions (resetMocks clears implementations)
    mockCreate = jest.fn();
    mockStream = jest.fn();

    provider = new ClaudeProvider();
    provider._apiKey = 'test-api-key';
    provider._client = null; // Force re-init to pick up fresh mocks
  });

  describe('generate()', () => {
    it('should return structured result from Claude API', async () => {
      mockCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: 'Pasienten har moderate korsryggsmerter.' }],
        usage: {
          input_tokens: 200,
          output_tokens: 35,
          cache_read_input_tokens: 50,
          cache_creation_input_tokens: 150,
        },
      });

      const result = await provider.generate('Skriv vurdering', null, {
        model: 'chiro-no-lora-v4',
        maxTokens: 500,
        temperature: 0.3,
        taskType: 'soap_notes',
      });

      expect(result.text).toBe('Pasienten har moderate korsryggsmerter.');
      expect(result.provider).toBe('claude');
      expect(result.model).toBe('claude-sonnet-4-6');
      expect(result.usage.inputTokens).toBe(200);
      expect(result.usage.outputTokens).toBe(35);
      expect(result.usage.cacheReadTokens).toBe(50);
      expect(result.usage.cacheCreationTokens).toBe(150);
    });

    it('should map Ollama models to Claude equivalents', async () => {
      mockCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: 'ok' }],
        usage: { input_tokens: 10, output_tokens: 5 },
      });

      await provider.generate('test', null, { model: 'chiro-fast' });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ model: 'claude-haiku-4-5' })
      );
    });

    it('should use sonnet for medical models', async () => {
      mockCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: 'ok' }],
        usage: { input_tokens: 10, output_tokens: 5 },
      });

      await provider.generate('test', null, { model: 'chiro-medical' });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ model: 'claude-sonnet-4-6' })
      );
    });

    it('should add safety context for red flag tasks', async () => {
      mockCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: 'Røde flagg identifisert' }],
        usage: { input_tokens: 50, output_tokens: 20 },
      });

      await provider.generate('Analyser røde flagg', null, {
        model: 'chiro-medical',
        taskType: 'red_flag_analysis',
      });

      const call = mockCreate.mock.calls[0][0];
      const systemTexts = call.system.map((s) => s.text);
      expect(systemTexts.some((t) => t.includes('røde flagg'))).toBe(true);
    });

    it('should apply cache_control to long system prompts', async () => {
      mockCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: 'ok' }],
        usage: { input_tokens: 10, output_tokens: 5 },
      });

      const longPrompt = 'A'.repeat(600);
      await provider.generate('test', longPrompt, {});

      const call = mockCreate.mock.calls[0][0];
      const cachedBlocks = call.system.filter((s) => s.cache_control);
      expect(cachedBlocks.length).toBeGreaterThan(0);
    });

    it('should handle 401 authentication errors', async () => {
      const authError = new Error('Unauthorized');
      authError.status = 401;
      mockCreate.mockRejectedValueOnce(authError);

      await expect(provider.generate('test', null, {})).rejects.toThrow(
        'Claude API authentication failed'
      );
    });

    it('should handle 429 rate limit errors', async () => {
      const rateError = new Error('Rate limited');
      rateError.status = 429;
      mockCreate.mockRejectedValueOnce(rateError);

      await expect(provider.generate('test', null, {})).rejects.toThrow('Claude API rate limited');
    });

    it('should handle 529 overload errors', async () => {
      const overloadError = new Error('Overloaded');
      overloadError.status = 529;
      mockCreate.mockRejectedValueOnce(overloadError);

      await expect(provider.generate('test', null, {})).rejects.toThrow('Claude API overloaded');
    });

    it('should throw when no API key configured', async () => {
      provider._apiKey = null;
      provider._client = null;

      await expect(provider.generate('test', null, {})).rejects.toThrow('Claude API not available');
    });

    it('should concatenate multiple text blocks in response', async () => {
      mockCreate.mockResolvedValueOnce({
        content: [
          { type: 'text', text: 'First part. ' },
          { type: 'text', text: 'Second part.' },
        ],
        usage: { input_tokens: 10, output_tokens: 15 },
      });

      const result = await provider.generate('test', null, {});
      expect(result.text).toBe('First part. Second part.');
    });
  });

  describe('generateStream()', () => {
    it('should handle SSE streaming from Claude', async () => {
      const mockStreamObj = {
        on: jest.fn((event, handler) => {
          if (event === 'text') {
            handler('Del ');
            handler('en.');
          }
          if (event === 'end') {
            handler();
          }
          return mockStreamObj;
        }),
      };
      mockStream.mockReturnValue(mockStreamObj);

      const res = { write: jest.fn(), end: jest.fn() };
      await provider.generateStream('chiro-no', 'prompt', res);

      expect(res.write).toHaveBeenCalledWith(expect.stringContaining('"text":"Del "'));
      expect(res.write).toHaveBeenCalledWith(expect.stringContaining('"text":"en."'));
      expect(res.write).toHaveBeenCalledWith(expect.stringContaining('"done":true'));
      expect(res.end).toHaveBeenCalled();
    });

    it('should handle stream errors gracefully', async () => {
      mockStream.mockImplementation(() => {
        throw new Error('stream init failed');
      });

      const res = { write: jest.fn(), end: jest.fn() };
      await provider.generateStream('chiro-no', 'prompt', res);

      expect(res.write).toHaveBeenCalledWith(
        expect.stringContaining('"error":"stream init failed"')
      );
      expect(res.end).toHaveBeenCalled();
    });

    it('should send error when no API key', async () => {
      provider._apiKey = null;
      provider._client = null;

      const res = { write: jest.fn(), end: jest.fn() };
      await provider.generateStream('chiro-no', 'prompt', res);

      expect(res.write).toHaveBeenCalledWith(
        expect.stringContaining('"error":"Claude API not available"')
      );
    });
  });

  describe('isAvailable()', () => {
    it('should return false without API key', async () => {
      provider._apiKey = null;
      expect(await provider.isAvailable()).toBe(false);
    });

    it('should return true with valid API key and SDK', async () => {
      expect(await provider.isAvailable()).toBe(true);
    });
  });

  describe('getStatus()', () => {
    it('should report available with API key', async () => {
      const status = await provider.getStatus();
      expect(status.provider).toBe('claude');
      expect(status.available).toBe(true);
    });

    it('should report unavailable without API key', async () => {
      provider._apiKey = null;
      provider._client = null;
      const status = await provider.getStatus();
      expect(status.available).toBe(false);
      expect(status.message).toContain('No CLAUDE_API_KEY');
    });
  });

  describe('CLAUDE_MODEL_MAP', () => {
    it('should map chiro-fast to haiku', () => {
      expect(CLAUDE_MODEL_MAP['chiro-fast']).toBe('claude-haiku-4-5');
    });

    it('should map clinical models to sonnet', () => {
      expect(CLAUDE_MODEL_MAP['chiro-no-sft-dpo-v5']).toBe('claude-sonnet-4-6');
      expect(CLAUDE_MODEL_MAP['chiro-medical']).toBe('claude-sonnet-4-6');
      expect(CLAUDE_MODEL_MAP['chiro-norwegian-lora-v2']).toBe('claude-sonnet-4-6');
    });
  });

  describe('_buildSystemMessages() with cache', () => {
    it('should use cache for known taskType (spell_check)', async () => {
      mockCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: 'korrigert tekst' }],
        usage: { input_tokens: 50, output_tokens: 10 },
      });

      await provider.generate('test', null, { taskType: 'spell_check' });

      const call = mockCreate.mock.calls[0][0];
      const systemTexts = call.system.map((s) => s.text);
      expect(systemTexts.some((t) => t.includes('klinisk assistent'))).toBe(true);
      expect(systemTexts.some((t) => t.includes('stavefeil'))).toBe(true);
    });

    it('should fall back to original logic for unknown taskType', async () => {
      mockCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: 'ok' }],
        usage: { input_tokens: 10, output_tokens: 5 },
      });

      await provider.generate('test', null, { taskType: 'unknown_task' });

      const call = mockCreate.mock.calls[0][0];
      // Original logic: no safety_context for unknown type, uses clinical_base fallback
      expect(call.system.length).toBeGreaterThan(0);
      expect(call.system[0].text).toContain('klinisk assistent');
    });

    it('should compose letter prompts with base + type-specific', async () => {
      mockCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: 'Medisinsk erklæring generert' }],
        usage: { input_tokens: 100, output_tokens: 30 },
      });

      await provider.generate('Generer brev', null, {
        taskType: 'letter_MEDICAL_CERTIFICATE',
      });

      const call = mockCreate.mock.calls[0][0];
      const systemTexts = call.system.map((s) => s.text);
      expect(systemTexts.some((t) => t.includes('VIKTIGE RETNINGSLINJER'))).toBe(true);
      expect(systemTexts.some((t) => t.includes('MEDISINSK ERKLÆRING'))).toBe(true);
    });
  });

  describe('clinicalPromptCache export', () => {
    it('should export clinicalPromptCache from claudeProvider', () => {
      expect(clinicalPromptCache).toBeDefined();
      expect(typeof clinicalPromptCache.buildCacheableMessages).toBe('function');
      expect(typeof clinicalPromptCache.getStats).toBe('function');
    });
  });
});
