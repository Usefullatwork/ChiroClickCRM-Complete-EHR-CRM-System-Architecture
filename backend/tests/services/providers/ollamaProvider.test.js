/**
 * OllamaProvider Tests
 * Verifies extracted Ollama logic works identically to the original inline code
 */

import { jest } from '@jest/globals';

// Mock axios
const mockPost = jest.fn();
const mockGet = jest.fn();
jest.unstable_mockModule('axios', () => ({
  default: { post: mockPost, get: mockGet },
  post: mockPost,
  get: mockGet,
}));

// Mock circuit breaker
jest.unstable_mockModule(
  '../../../src/infrastructure/resilience/CircuitBreakerRegistry.js',
  () => ({
    default: {
      getBreaker: () => ({
        requestTimeout: 35000,
        execute: (fn) => fn(),
      }),
    },
  })
);

// Mock logger
jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

const { OllamaProvider } = await import('../../../src/services/providers/ollamaProvider.js');

describe('OllamaProvider', () => {
  let provider;

  beforeEach(() => {
    provider = new OllamaProvider();
    jest.clearAllMocks();
  });

  describe('generate()', () => {
    it('should return structured result with text and metadata', async () => {
      mockPost.mockResolvedValueOnce({
        data: {
          response: 'Pasienten presenterer med korsryggsmerter.',
          total_duration: 2500000000, // 2.5s in nanoseconds
          prompt_eval_count: 150,
          eval_count: 42,
        },
      });

      const result = await provider.generate('Skriv subjektiv', null, {
        model: 'chiro-no',
        maxTokens: 500,
        temperature: 0.3,
      });

      expect(result).toEqual({
        text: 'Pasienten presenterer med korsryggsmerter.',
        model: 'chiro-no',
        provider: 'ollama',
        durationMs: 2500,
        usage: {
          inputTokens: 150,
          outputTokens: 42,
          cacheReadTokens: 0,
        },
      });
    });

    it('should send correct payload to Ollama API', async () => {
      mockPost.mockResolvedValueOnce({
        data: { response: 'test', total_duration: 1000000000 },
      });

      await provider.generate('test prompt', 'system prompt', {
        model: 'chiro-fast',
        maxTokens: 200,
        temperature: 0.5,
      });

      expect(mockPost).toHaveBeenCalledWith(
        expect.stringContaining('/api/generate'),
        expect.objectContaining({
          model: 'chiro-fast',
          prompt: 'system prompt\n\ntest prompt',
          stream: false,
          options: { temperature: 0.5, num_predict: 200 },
        }),
        expect.objectContaining({ timeout: expect.any(Number) })
      );
    });

    it('should prepend system prompt when provided', async () => {
      mockPost.mockResolvedValueOnce({
        data: { response: 'output', total_duration: 1000000000 },
      });

      await provider.generate('user prompt', 'Du er en klinisk assistent', {});

      const payload = mockPost.mock.calls[0][1];
      expect(payload.prompt).toBe('Du er en klinisk assistent\n\nuser prompt');
    });

    it('should use prompt directly when no system prompt', async () => {
      mockPost.mockResolvedValueOnce({
        data: { response: 'output', total_duration: 1000000000 },
      });

      await provider.generate('bare prompt', null, {});

      const payload = mockPost.mock.calls[0][1];
      expect(payload.prompt).toBe('bare prompt');
    });

    it('should retry once on timeout errors', async () => {
      const timeoutError = new Error('timeout');
      timeoutError.code = 'ECONNABORTED';

      mockPost.mockRejectedValueOnce(timeoutError).mockResolvedValueOnce({
        data: { response: 'success after retry', total_duration: 1000000000 },
      });

      const result = await provider.generate('prompt', null, { model: 'chiro-no' });
      expect(result.text).toBe('success after retry');
      expect(mockPost).toHaveBeenCalledTimes(2);
    });

    it('should throw immediately on non-timeout errors', async () => {
      mockPost.mockRejectedValueOnce(new Error('connection refused'));

      await expect(provider.generate('prompt', null, {})).rejects.toThrow('AI service unavailable');
      expect(mockPost).toHaveBeenCalledTimes(1);
    });

    it('should throw after all retries exhausted on timeout', async () => {
      const timeoutError = new Error('timeout');
      timeoutError.code = 'ETIMEDOUT';

      mockPost.mockRejectedValue(timeoutError);

      await expect(provider.generate('prompt', null, {})).rejects.toThrow(
        'AI service unavailable (timeout after retries)'
      );
      expect(mockPost).toHaveBeenCalledTimes(2); // initial + 1 retry
    });

    it('should default to chiro-no-sft-dpo-v5 model when none specified', async () => {
      mockPost.mockResolvedValueOnce({
        data: { response: 'output', total_duration: 1000000000 },
      });

      await provider.generate('prompt', null, {});

      const payload = mockPost.mock.calls[0][1];
      expect(payload.model).toBe('chiro-no-sft-dpo-v5');
    });
  });

  describe('generateStream()', () => {
    it('should write SSE chunks to response', async () => {
      const chunks = [
        JSON.stringify({ response: 'Hei' }),
        JSON.stringify({ response: ' verden' }),
        JSON.stringify({ done: true }),
      ];

      const mockStream = {
        on: jest.fn((event, handler) => {
          if (event === 'data') {
            chunks.forEach((chunk) => handler(Buffer.from(chunk)));
          }
        }),
      };

      mockPost.mockResolvedValueOnce({ data: mockStream });

      const res = { write: jest.fn(), end: jest.fn() };
      await provider.generateStream('chiro-no', 'prompt', res);

      expect(res.write).toHaveBeenCalledWith(expect.stringContaining('"text":"Hei"'));
      expect(res.write).toHaveBeenCalledWith(expect.stringContaining('"text":" verden"'));
      expect(res.write).toHaveBeenCalledWith(expect.stringContaining('"done":true'));
      expect(res.end).toHaveBeenCalled();
    });

    it('should handle stream errors', async () => {
      mockPost.mockRejectedValueOnce(new Error('stream failed'));

      const res = { write: jest.fn(), end: jest.fn() };
      await provider.generateStream('chiro-no', 'prompt', res);

      expect(res.write).toHaveBeenCalledWith(expect.stringContaining('"error":"stream failed"'));
      expect(res.end).toHaveBeenCalled();
    });
  });

  describe('isAvailable()', () => {
    it('should return true when Ollama responds', async () => {
      mockGet.mockResolvedValueOnce({ status: 200 });
      expect(await provider.isAvailable()).toBe(true);
    });

    it('should return false when Ollama is unreachable', async () => {
      mockGet.mockRejectedValueOnce(new Error('ECONNREFUSED'));
      expect(await provider.isAvailable()).toBe(false);
    });
  });

  describe('getStatus()', () => {
    it('should return model list when available', async () => {
      mockGet.mockResolvedValueOnce({
        data: { models: [{ name: 'chiro-no' }, { name: 'chiro-fast' }] },
      });

      const status = await provider.getStatus();
      expect(status.provider).toBe('ollama');
      expect(status.available).toBe(true);
      expect(status.models).toEqual(['chiro-no', 'chiro-fast']);
    });

    it('should return unavailable when Ollama is down', async () => {
      mockGet.mockRejectedValueOnce(new Error('ECONNREFUSED'));

      const status = await provider.getStatus();
      expect(status.provider).toBe('ollama');
      expect(status.available).toBe(false);
    });
  });
});
