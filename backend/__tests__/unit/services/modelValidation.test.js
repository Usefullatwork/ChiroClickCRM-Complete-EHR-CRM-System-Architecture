/**
 * Unit Tests for Model Validation
 * Tests similarity calculation, validation examples, model validation, model testing
 */

import { jest } from '@jest/globals';

jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

const mockQuery = jest.fn();
jest.unstable_mockModule('../../../src/config/database.js', () => ({
  query: mockQuery,
  default: { query: mockQuery },
}));

jest.unstable_mockModule('../../../src/infrastructure/resilience/CircuitBreaker.js', () => ({
  CircuitBreakers: {
    ollama: { execute: jest.fn((fn) => fn()) },
  },
}));

jest.unstable_mockModule('child_process', () => ({
  exec: jest.fn(),
}));

// Mock global fetch
global.fetch = jest.fn();

const {
  calculateSimilarity,
  getValidationExamples,
  validateModel,
  testNewModel,
  getCurrentModelInfo,
} = await import('../../../src/application/services/modelValidation.js');

describe('Model Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  // ===========================================================================
  // CALCULATE SIMILARITY
  // ===========================================================================

  describe('calculateSimilarity', () => {
    it('should return 1 for identical texts', () => {
      const result = calculateSimilarity('hello world', 'hello world');

      expect(result).toBe(1);
    });

    it('should return 0 for completely different texts', () => {
      const result = calculateSimilarity('abc def', 'xyz uvw');

      expect(result).toBe(0);
    });

    it('should return 0 for null/empty inputs', () => {
      expect(calculateSimilarity(null, 'test')).toBe(0);
      expect(calculateSimilarity('test', null)).toBe(0);
      expect(calculateSimilarity('', 'test')).toBe(0);
      expect(calculateSimilarity('test', '')).toBe(0);
    });

    it('should be case insensitive', () => {
      const result = calculateSimilarity('Hello World', 'hello world');

      expect(result).toBe(1);
    });

    it('should return partial similarity for overlapping texts', () => {
      const result = calculateSimilarity('hello world foo', 'hello world bar');

      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(1);
    });

    it('should handle single word texts', () => {
      const same = calculateSimilarity('test', 'test');
      const different = calculateSimilarity('foo', 'bar');

      expect(same).toBe(1);
      expect(different).toBe(0);
    });

    it('should calculate Jaccard similarity correctly', () => {
      // words1 = {a, b, c}, words2 = {b, c, d}
      // intersection = {b, c}, union = {a, b, c, d}
      // similarity = 2/4 = 0.5
      const result = calculateSimilarity('a b c', 'b c d');

      expect(result).toBe(0.5);
    });

    it('should handle duplicate words correctly', () => {
      // Sets remove duplicates: {hello, world} vs {hello, hello, world} -> {hello, world}
      const result = calculateSimilarity('hello world', 'hello hello world');

      expect(result).toBe(1);
    });
  });

  // ===========================================================================
  // GET VALIDATION EXAMPLES
  // ===========================================================================

  describe('getValidationExamples', () => {
    it('should return validation examples from database', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { input: 'test prompt', expectedOutput: 'expected output' },
          { input: 'another prompt', expectedOutput: 'another output' },
        ],
      });

      const result = await getValidationExamples();

      expect(result).toHaveLength(2);
      expect(result[0].input).toBe('test prompt');
    });

    it('should return empty array on database error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB error'));

      const result = await getValidationExamples();

      expect(result).toEqual([]);
    });

    it('should return empty array when no accepted examples exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await getValidationExamples();

      expect(result).toEqual([]);
    });
  });

  // ===========================================================================
  // VALIDATE MODEL
  // ===========================================================================

  describe('validateModel', () => {
    it('should skip validation when insufficient examples', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { input: 'p1', expectedOutput: 'o1' },
          { input: 'p2', expectedOutput: 'o2' },
        ],
      });

      const result = await validateModel('test-model');

      expect(result.passed).toBe(true);
      expect(result.skipped).toBe(true);
    });

    it('should validate against test examples and check accuracy', async () => {
      const examples = Array.from({ length: 10 }, (_, i) => ({
        input: `prompt ${i}`,
        expectedOutput: `response ${i}`,
      }));
      mockQuery.mockResolvedValueOnce({ rows: examples });

      // Mock fetch for each validation call
      for (let i = 0; i < 10; i++) {
        global.fetch.mockResolvedValueOnce({
          json: jest.fn().mockResolvedValue({ response: `response ${i}` }),
        });
      }

      const result = await validateModel('test-model', { minValidationAccuracy: 0.5 });

      expect(result.totalExamples).toBe(10);
      expect(result.testedExamples).toBe(10);
      expect(typeof result.accuracy).toBe('string');
    });

    it('should fail when accuracy is below threshold', async () => {
      const examples = Array.from({ length: 10 }, (_, i) => ({
        input: `prompt ${i}`,
        expectedOutput: `expected ${i}`,
      }));
      mockQuery.mockResolvedValueOnce({ rows: examples });

      // Return completely different responses
      for (let i = 0; i < 10; i++) {
        global.fetch.mockResolvedValueOnce({
          json: jest.fn().mockResolvedValue({ response: 'unrelated garbage xyz' }),
        });
      }

      const result = await validateModel('bad-model', { minValidationAccuracy: 0.75 });

      expect(result.passed).toBe(false);
    });

    it('should use default minAccuracy of 0.75', async () => {
      mockQuery.mockResolvedValueOnce({ rows: Array(3).fill({ input: 'x', expectedOutput: 'y' }) });

      const result = await validateModel('model');

      expect(result.skipped).toBe(true); // Less than 5 examples
    });

    it('should handle individual validation example errors gracefully', async () => {
      const examples = Array.from({ length: 6 }, (_, i) => ({
        input: `prompt ${i}`,
        expectedOutput: `response ${i}`,
      }));
      mockQuery.mockResolvedValueOnce({ rows: examples });

      // Some succeed, some fail
      global.fetch
        .mockResolvedValueOnce({ json: jest.fn().mockResolvedValue({ response: 'response 0' }) })
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockResolvedValueOnce({ json: jest.fn().mockResolvedValue({ response: 'response 2' }) })
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockResolvedValueOnce({ json: jest.fn().mockResolvedValue({ response: 'response 4' }) })
        .mockResolvedValueOnce({ json: jest.fn().mockResolvedValue({ response: 'response 5' }) });

      const result = await validateModel('test-model');

      expect(result.testedExamples).toBe(6);
    });
  });

  // ===========================================================================
  // GET CURRENT MODEL INFO
  // ===========================================================================

  describe('getCurrentModelInfo', () => {
    it('should return model version from system_config', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ value: 'chiro-no-sft-dpo-v6' }],
      });
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          modelfile: 'FROM mistral:7b',
          parameters: 'temperature 0.7',
        }),
      });

      const result = await getCurrentModelInfo();

      expect(result.version).toBe('chiro-no-sft-dpo-v6');
    });

    it('should return default version when no config exists', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      global.fetch.mockResolvedValueOnce({
        ok: false,
      });

      const result = await getCurrentModelInfo();

      expect(result.version).toBe('chiro-no-sft-dpo-v5');
    });

    it('should handle errors gracefully', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB error'));

      const result = await getCurrentModelInfo();

      expect(result.version).toBe('unknown');
      expect(result.error).toBeDefined();
    });
  });
});
