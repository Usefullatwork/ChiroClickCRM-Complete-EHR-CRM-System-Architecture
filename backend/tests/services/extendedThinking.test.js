/**
 * Extended Thinking Service Tests
 * Tests for Claude extended thinking clinical reasoning
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Stable mock functions
const mockCreate = jest.fn();

// Mock @anthropic-ai/sdk
jest.unstable_mockModule('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic {
    constructor() {
      this.messages = { create: mockCreate };
    }
  },
}));

// Mock logger
jest.unstable_mockModule('../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('Extended Thinking Service', () => {
  let analyzeWithThinking, differentialDiagnosis, analyzeRedFlagsWithThinking;

  beforeEach(async () => {
    process.env.CLAUDE_API_KEY = 'test-api-key';
    mockCreate.mockReset();

    // Re-import to get fresh module
    const mod = await import('../../src/services/extendedThinking.js');
    analyzeWithThinking = mod.analyzeWithThinking;
    differentialDiagnosis = mod.differentialDiagnosis;
    analyzeRedFlagsWithThinking = mod.analyzeRedFlagsWithThinking;
  });

  afterEach(() => {
    delete process.env.CLAUDE_API_KEY;
  });

  describe('analyzeWithThinking', () => {
    it('should extract thinking and text blocks from response', async () => {
      mockCreate.mockResolvedValue({
        content: [
          { type: 'thinking', thinking: 'Step 1: Consider symptoms...\nStep 2: Evaluate...' },
          { type: 'text', text: 'Based on the analysis, the primary diagnosis is...' },
        ],
        usage: { input_tokens: 100, output_tokens: 200 },
      });

      const result = await analyzeWithThinking('Test prompt');

      expect(result.reasoning).toBe('Step 1: Consider symptoms...\nStep 2: Evaluate...');
      expect(result.answer).toBe('Based on the analysis, the primary diagnosis is...');
      expect(result.usage.inputTokens).toBe(100);
      expect(result.usage.outputTokens).toBe(200);
    });

    it('should concatenate multiple text blocks', async () => {
      mockCreate.mockResolvedValue({
        content: [
          { type: 'thinking', thinking: 'Reasoning here' },
          { type: 'text', text: 'Part 1. ' },
          { type: 'text', text: 'Part 2.' },
        ],
        usage: { input_tokens: 50, output_tokens: 80 },
      });

      const result = await analyzeWithThinking('Test');

      expect(result.answer).toBe('Part 1. Part 2.');
    });

    it('should handle response with no thinking block', async () => {
      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'Direct answer' }],
        usage: { input_tokens: 30, output_tokens: 20 },
      });

      const result = await analyzeWithThinking('Test');

      expect(result.reasoning).toBe('');
      expect(result.answer).toBe('Direct answer');
    });

    it('should throw if CLAUDE_API_KEY is not set', async () => {
      delete process.env.CLAUDE_API_KEY;

      await expect(analyzeWithThinking('Test')).rejects.toThrow(
        'Extended thinking requires CLAUDE_API_KEY'
      );
    });

    it('should pass thinking budget to API', async () => {
      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'OK' }],
        usage: {},
      });

      await analyzeWithThinking('Test', { maxThinkingTokens: 10000, maxOutputTokens: 3000 });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          thinking: { type: 'enabled', budget_tokens: 10000 },
          max_tokens: 13000,
        })
      );
    });

    it('should use specified model', async () => {
      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'OK' }],
        usage: {},
      });

      await analyzeWithThinking('Test', { model: 'claude-opus-4-6' });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ model: 'claude-opus-4-6' })
      );
    });

    it('should handle missing usage gracefully', async () => {
      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'OK' }],
      });

      const result = await analyzeWithThinking('Test');

      expect(result.usage.inputTokens).toBe(0);
      expect(result.usage.outputTokens).toBe(0);
    });
  });

  describe('differentialDiagnosis', () => {
    it('should build prompt from SOAP data and return result with taskType', async () => {
      mockCreate.mockResolvedValue({
        content: [
          { type: 'thinking', thinking: 'Evaluating differential...' },
          { type: 'text', text: '1. L75 - Lumbago\n2. L86 - Discus' },
        ],
        usage: { input_tokens: 200, output_tokens: 300 },
      });

      const result = await differentialDiagnosis(
        { subjective: 'Low back pain', objective: 'SLR positive left' },
        { age: 45, gender: 'Male' }
      );

      expect(result.taskType).toBe('differential_diagnosis');
      expect(result.reasoning).toBe('Evaluating differential...');
      expect(result.answer).toContain('L75');
    });

    it('should use higher thinking budget (8000)', async () => {
      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'OK' }],
        usage: {},
      });

      await differentialDiagnosis({ subjective: 'test' });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          thinking: { type: 'enabled', budget_tokens: 8000 },
        })
      );
    });

    it('should handle empty patient data', async () => {
      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'Diagnosis list' }],
        usage: {},
      });

      const result = await differentialDiagnosis({ subjective: 'Neck pain' });

      expect(result.answer).toBe('Diagnosis list');
      expect(result.taskType).toBe('differential_diagnosis');
    });
  });

  describe('analyzeRedFlagsWithThinking', () => {
    it('should analyze red flags with thinking and return result', async () => {
      mockCreate.mockResolvedValue({
        content: [
          { type: 'thinking', thinking: 'Checking for cauda equina...' },
          { type: 'text', text: 'Cauda equina: LAV\nFraktur: LAV' },
        ],
        usage: { input_tokens: 150, output_tokens: 100 },
      });

      const result = await analyzeRedFlagsWithThinking(
        { subjective: 'Back pain', objective: 'Normal neuro' },
        { age: 30 }
      );

      expect(result.taskType).toBe('red_flag_analysis');
      expect(result.reasoning).toContain('cauda equina');
      expect(result.answer).toContain('LAV');
    });

    it('should use 5000 thinking token budget', async () => {
      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'OK' }],
        usage: {},
      });

      await analyzeRedFlagsWithThinking({ subjective: 'test' });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          thinking: { type: 'enabled', budget_tokens: 5000 },
        })
      );
    });
  });
});
