/**
 * Clinical Evals Tests
 * Verifies comparison evaluation pipeline, grading, and batch eval
 */

import { jest } from '@jest/globals';

jest.unstable_mockModule('../../src/utils/logger.js', () => ({
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

let mockQuery = jest.fn();
jest.unstable_mockModule('../../src/config/database.js', () => ({
  query: (...args) => mockQuery(...args),
}));

// Use plain function factories — jest.fn().mockImplementation() gets cleared by resetMocks
let mockOllamaGenerate = jest.fn();
let mockClaudeGenerate = jest.fn();

jest.unstable_mockModule('../../src/services/providers/ollamaProvider.js', () => ({
  OllamaProvider: function MockOllamaProvider() {
    return { generate: mockOllamaGenerate };
  },
}));

jest.unstable_mockModule('../../src/services/providers/claudeProvider.js', () => ({
  ClaudeProvider: function MockClaudeProvider() {
    return { generate: mockClaudeGenerate };
  },
}));

// Mock factory
jest.unstable_mockModule('../../src/services/providers/aiProviderFactory.js', () => ({
  getAIProvider: () => ({
    generate: (...args) => mockOllamaGenerate(...args),
  }),
}));

// Mock Anthropic SDK for grading
let mockGradingCreate = jest.fn();
jest.unstable_mockModule('@anthropic-ai/sdk', () => ({
  default: function MockAnthropic() {
    return { messages: { create: mockGradingCreate } };
  },
}));

process.env.CLAUDE_API_KEY = 'test-key';

const { runComparison, runEvalBatch, getEvalSummary } =
  await import('../../src/services/clinicalEvals.js');

describe('ClinicalEvals', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reassign to fresh jest.fn() instances after resetMocks clears the old ones
    mockOllamaGenerate = jest.fn().mockResolvedValue({
      text: 'Ollama: Pasienten har moderate smerter',
      durationMs: 2500,
      model: 'chiro-no',
    });
    mockClaudeGenerate = jest.fn().mockResolvedValue({
      text: 'Claude: Pasienten presenterer med moderate korsryggsmerter',
      durationMs: 1200,
      model: 'claude-sonnet-4-6',
    });
    mockGradingCreate = jest.fn().mockResolvedValue({
      content: [
        {
          type: 'text',
          text: '{"svar_a": {"accuracy": 3, "relevance": 4, "completeness": 3, "language": 3, "safety": 4, "overall": 3.4}, "svar_b": {"accuracy": 5, "relevance": 5, "completeness": 4, "language": 5, "safety": 5, "overall": 4.8}}',
        },
      ],
      usage: { input_tokens: 500, output_tokens: 200 },
    });
    mockQuery = jest.fn().mockResolvedValue({ rows: [{ total_evals: 0, avg_duration_ms: 0 }] });
  });

  describe('runComparison()', () => {
    it('should run both providers and return results', async () => {
      const results = await runComparison('Skriv vurdering for korsrygg');

      expect(results.ollama).toBeDefined();
      expect(results.ollama.text).toContain('Ollama');
      expect(results.claude).toBeDefined();
      expect(results.claude.text).toContain('Claude');
    });

    it('should grade both outputs when available', async () => {
      const results = await runComparison('Test prompt');

      expect(results.grades).toBeDefined();
      expect(results.grades.svar_a).toBeDefined();
      expect(results.grades.svar_b).toBeDefined();
    });

    it('should handle Ollama failure gracefully', async () => {
      mockOllamaGenerate.mockRejectedValueOnce(new Error('Ollama down'));

      const results = await runComparison('Test prompt');

      expect(results.ollama.error).toBe('Ollama down');
      expect(results.claude.text).toBeDefined();
    });

    it('should handle Claude failure gracefully', async () => {
      mockClaudeGenerate.mockRejectedValueOnce(new Error('API key invalid'));

      const results = await runComparison('Test prompt');

      expect(results.ollama.text).toBeDefined();
      expect(results.claude.error).toBe('API key invalid');
    });

    it('should skip grading when one provider fails', async () => {
      mockOllamaGenerate.mockRejectedValueOnce(new Error('down'));

      const results = await runComparison('Test');

      // Grading requires both outputs
      expect(results.grades).toBeNull();
    });
  });

  describe('runEvalBatch()', () => {
    it('should process multiple test cases', async () => {
      const testCases = [
        { id: 'test-1', prompt: 'Prompt 1', taskType: 'soap_notes' },
        { id: 'test-2', prompt: 'Prompt 2', taskType: 'red_flag_analysis' },
      ];

      const results = await runEvalBatch(testCases);

      expect(results).toHaveLength(2);
      expect(results[0].id).toBe('test-1');
      expect(results[1].id).toBe('test-2');
    });

    it('should handle individual test case failures', async () => {
      mockOllamaGenerate
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce({ text: 'ok', durationMs: 100, model: 'chiro-no' });

      const testCases = [
        { id: 'fail-case', prompt: 'Bad prompt' },
        { id: 'good-case', prompt: 'Good prompt' },
      ];

      const results = await runEvalBatch(testCases);
      expect(results).toHaveLength(2);
    });
  });

  describe('getEvalSummary()', () => {
    it('should return summary statistics', async () => {
      const summary = await getEvalSummary();
      expect(summary).toHaveProperty('total_evals');
      expect(summary).toHaveProperty('avg_duration_ms');
    });
  });
});
