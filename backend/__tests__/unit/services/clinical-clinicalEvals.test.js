/**
 * Unit Tests for Clinical Evals Service (src/services/clinical/clinicalEvals.js)
 * Tests comparative evaluation, grading, batch evals, and summary stats
 */

import { jest } from '@jest/globals';

const mockQuery = jest.fn();

jest.unstable_mockModule('../../../src/config/database.js', () => ({
  query: mockQuery,
  default: { query: mockQuery },
}));

jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

const mockOllamaGenerate = jest.fn();
jest.unstable_mockModule('../../../src/services/providers/ollamaProvider.js', () => ({
  OllamaProvider: class {
    generate = mockOllamaGenerate;
  },
}));

const mockClaudeGenerate = jest.fn();
jest.unstable_mockModule('../../../src/services/providers/claudeProvider.js', () => ({
  ClaudeProvider: class {
    generate = mockClaudeGenerate;
  },
}));

jest.unstable_mockModule('../../../src/services/providers/aiProviderFactory.js', () => ({
  getAIProvider: jest.fn(() => ({})),
}));

const mockMessagesCreate = jest.fn();
jest.unstable_mockModule('@anthropic-ai/sdk', () => ({
  default: class {
    constructor() {
      this.messages = { create: mockMessagesCreate };
    }
  },
}));

const { runComparison, runEvalBatch, getEvalSummary, GRADING_SYSTEM } =
  await import('../../../src/services/clinical/clinicalEvals.js');

describe('clinicalEvals', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CLAUDE_API_KEY = 'test-key';
  });

  afterEach(() => {
    delete process.env.CLAUDE_API_KEY;
  });

  // ===========================================================================
  // GRADING_SYSTEM
  // ===========================================================================
  describe('GRADING_SYSTEM', () => {
    it('should be a non-empty Norwegian grading rubric string', () => {
      expect(typeof GRADING_SYSTEM).toBe('string');
      expect(GRADING_SYSTEM.length).toBeGreaterThan(50);
      expect(GRADING_SYSTEM).toContain('Klinisk nøyaktighet');
    });
  });

  // ===========================================================================
  // runComparison
  // ===========================================================================
  describe('runComparison', () => {
    it('should run both Ollama and Claude and return results', async () => {
      mockOllamaGenerate.mockResolvedValue({
        text: 'Ollama output',
        durationMs: 100,
        model: 'local',
      });
      mockClaudeGenerate.mockResolvedValue({
        text: 'Claude output',
        durationMs: 200,
        model: 'claude',
      });
      mockMessagesCreate.mockResolvedValue({
        content: [{ type: 'text', text: '{"svar_a": {}, "svar_b": {}}' }],
      });

      const result = await runComparison('Test prompt');
      expect(result.ollama).toBeDefined();
      expect(result.ollama.text).toBe('Ollama output');
      expect(result.claude).toBeDefined();
      expect(result.claude.text).toBe('Claude output');
      expect(result.grades).toBeDefined();
    });

    it('should handle Ollama failure gracefully', async () => {
      mockOllamaGenerate.mockRejectedValue(new Error('Ollama offline'));
      mockClaudeGenerate.mockResolvedValue({
        text: 'Claude output',
        durationMs: 200,
        model: 'claude',
      });

      const result = await runComparison('Test prompt');
      expect(result.ollama.error).toBe('Ollama offline');
      expect(result.claude.text).toBe('Claude output');
    });

    it('should handle Claude failure gracefully', async () => {
      mockOllamaGenerate.mockResolvedValue({
        text: 'Ollama output',
        durationMs: 100,
        model: 'local',
      });
      mockClaudeGenerate.mockRejectedValue(new Error('Claude unavailable'));

      const result = await runComparison('Test prompt');
      expect(result.ollama.text).toBe('Ollama output');
      expect(result.claude.error).toBe('Claude unavailable');
    });

    it('should skip grading if either output is missing', async () => {
      mockOllamaGenerate.mockRejectedValue(new Error('fail'));
      mockClaudeGenerate.mockRejectedValue(new Error('fail'));

      const result = await runComparison('Test prompt');
      expect(result.grades).toBeNull();
    });

    it('should handle grading failure gracefully', async () => {
      mockOllamaGenerate.mockResolvedValue({ text: 'A', durationMs: 50, model: 'x' });
      mockClaudeGenerate.mockResolvedValue({ text: 'B', durationMs: 50, model: 'y' });
      mockMessagesCreate.mockRejectedValue(new Error('Grading failed'));

      const result = await runComparison('Test prompt');
      expect(result.grades).toEqual({ error: 'Grading failed' });
    });

    it('should handle non-JSON grading response', async () => {
      mockOllamaGenerate.mockResolvedValue({ text: 'A', durationMs: 50, model: 'x' });
      mockClaudeGenerate.mockResolvedValue({ text: 'B', durationMs: 50, model: 'y' });
      mockMessagesCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'This is not JSON' }],
      });

      const result = await runComparison('Test prompt');
      expect(result.grades).toEqual({ raw: 'This is not JSON' });
    });
  });

  // ===========================================================================
  // runEvalBatch
  // ===========================================================================
  describe('runEvalBatch', () => {
    it('should run multiple test cases', async () => {
      mockOllamaGenerate.mockResolvedValue({ text: 'A', durationMs: 50, model: 'x' });
      mockClaudeGenerate.mockResolvedValue({ text: 'B', durationMs: 50, model: 'y' });
      mockMessagesCreate.mockResolvedValue({
        content: [{ type: 'text', text: '{}' }],
      });
      mockQuery.mockResolvedValue({ rows: [] });

      const results = await runEvalBatch([
        { id: 'test-1', prompt: 'Prompt 1' },
        { id: 'test-2', prompt: 'Prompt 2' },
      ]);

      expect(results.length).toBe(2);
      expect(results[0].id).toBe('test-1');
      expect(results[1].id).toBe('test-2');
    });

    it('should capture errors per test case', async () => {
      mockOllamaGenerate.mockRejectedValue(new Error('fail'));
      mockClaudeGenerate.mockRejectedValue(new Error('fail'));
      mockQuery.mockResolvedValue({ rows: [] });

      const results = await runEvalBatch([{ id: 'fail-case', prompt: 'x' }]);
      expect(results.length).toBe(1);
      // Result should still have id
      expect(results[0].id).toBe('fail-case');
    });
  });

  // ===========================================================================
  // getEvalSummary
  // ===========================================================================
  describe('getEvalSummary', () => {
    it('should return summary stats from database', async () => {
      mockQuery.mockResolvedValue({
        rows: [{ total_evals: '5', avg_duration_ms: 150 }],
      });

      const summary = await getEvalSummary();
      expect(summary.total_evals).toBe('5');
      expect(summary.avg_duration_ms).toBe(150);
    });

    it('should return defaults on database error', async () => {
      mockQuery.mockRejectedValue(new Error('Table not found'));

      const summary = await getEvalSummary();
      expect(summary.total_evals).toBe(0);
      expect(summary.avg_duration_ms).toBe(0);
    });

    it('should return defaults when no rows', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const summary = await getEvalSummary();
      expect(summary.total_evals).toBe(0);
    });
  });
});
