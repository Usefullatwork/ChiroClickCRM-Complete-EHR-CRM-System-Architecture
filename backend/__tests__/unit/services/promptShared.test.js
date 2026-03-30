/**
 * Unit Tests for Prompt Shared Infrastructure
 * Tests generateCompletion, getAIStatus, buildFieldPrompt, generateCompletionStream
 */

import { jest } from '@jest/globals';

// ── Mock logger ──────────────────────────────────────────────────────────────
jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// ── Mock database ────────────────────────────────────────────────────────────
const mockQuery = jest.fn();
jest.unstable_mockModule('../../../src/config/database.js', () => ({
  query: mockQuery,
  default: { query: mockQuery },
}));

// ── Mock AI provider factory ─────────────────────────────────────────────────
const mockGenerate = jest.fn();
const mockGenerateStream = jest.fn();
jest.unstable_mockModule('../../../src/services/providers/aiProviderFactory.js', () => ({
  getAIProvider: () => ({
    generate: mockGenerate,
    generateStream: mockGenerateStream,
  }),
}));

// ── Mock circuit breaker ─────────────────────────────────────────────────────
const mockBreaker = { requestTimeout: 0 };
jest.unstable_mockModule(
  '../../../src/infrastructure/resilience/CircuitBreakerRegistry.js',
  () => ({
    default: { getBreaker: jest.fn(() => mockBreaker) },
  })
);

// ── Mock modelRouter ─────────────────────────────────────────────────────────
const mockGetModelForTask = jest.fn();
const mockIsAIAvailable = jest.fn();
const mockCalculateConfidence = jest.fn();
const mockExtractCompletionText = jest.fn();
jest.unstable_mockModule('../../../src/services/ai/modelRouter.js', () => ({
  AI_MODEL: 'chiro-no-sft-dpo-v6',
  AI_ENABLED: true,
  OLLAMA_BASE_URL: 'http://localhost:11434',
  MODEL_CONFIG: {
    'chiro-no-sft-dpo-v6': { name: 'v6', description: 'Test model', temperature: 0.3 },
    'chiro-no-sft-dpo-v5': { name: 'v5', description: 'Fallback', temperature: 0.3 },
  },
  MODEL_ROUTING: { soap_notes: 'chiro-no-sft-dpo-v6' },
  AB_SPLIT_CONFIG: {},
  getModelForTask: mockGetModelForTask,
  isAIAvailable: mockIsAIAvailable,
  calculateConfidence: mockCalculateConfidence,
  extractCompletionText: mockExtractCompletionText,
}));

// ── Mock guardrails ──────────────────────────────────────────────────────────
const mockCheckGuardrailsForTask = jest.fn();
const mockApplyFallbackInputValidation = jest.fn();
jest.unstable_mockModule('../../../src/services/ai/guardrails.js', () => ({
  guardrailsService: null,
  guardrailsAvailable: false,
  GUARDRAILS_ENABLED: false,
  checkGuardrailsForTask: mockCheckGuardrailsForTask,
  applyFallbackInputValidation: mockApplyFallbackInputValidation,
}));

// ── Mock ragRetrieval ────────────────────────────────────────────────────────
const mockAugmentWithRAG = jest.fn();
jest.unstable_mockModule('../../../src/services/ai/ragRetrieval.js', () => ({
  augmentWithRAG: mockAugmentWithRAG,
  ragService: null,
  RAG_ENABLED: false,
}));

// ── Mock sessionMemory ───────────────────────────────────────────────────────
jest.unstable_mockModule('../../../src/services/ai/sessionMemory.js', () => ({
  recordLearning: jest.fn(),
}));

// ── Mock systemPrompts ───────────────────────────────────────────────────────
jest.unstable_mockModule('../../../src/services/ai/systemPrompts.js', () => ({
  SMS_CONSTRAINT: 'VIKTIG: Maks 160 tegn.',
}));

// ── Mock axios ───────────────────────────────────────────────────────────────
jest.unstable_mockModule('axios', () => ({
  default: { get: jest.fn() },
}));

const { generateCompletion, getAIStatus, buildFieldPrompt, generateCompletionStream } =
  await import('../../../src/services/ai/promptShared.js');

const axios = (await import('axios')).default;

describe('Prompt Shared Infrastructure', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetModelForTask.mockResolvedValue({ model: 'chiro-no-sft-dpo-v6', abVariant: null });
    mockCalculateConfidence.mockReturnValue({ score: 0.85, level: 'high' });
    mockCheckGuardrailsForTask.mockReturnValue({
      canProceed: true,
      required: false,
      available: false,
    });
    mockApplyFallbackInputValidation.mockReturnValue({ proceed: true, sanitized: '', issues: [] });
    mockAugmentWithRAG.mockImplementation((prompt) =>
      Promise.resolve({ augmentedPrompt: prompt, ragContext: null })
    );
  });

  // ===========================================================================
  // GENERATE COMPLETION
  // ===========================================================================

  describe('generateCompletion', () => {
    it('should generate completion with default options', async () => {
      mockGenerate.mockResolvedValue({ text: 'AI output text', model: 'v6' });

      const result = await generateCompletion('Test prompt');

      expect(result.text).toBe('AI output text');
      expect(result.confidence).toEqual({ score: 0.85, level: 'high' });
    });

    it('should route model based on taskType', async () => {
      mockGetModelForTask.mockResolvedValue({ model: 'chiro-no-sft-dpo-v6', abVariant: 'A' });
      mockGenerate.mockResolvedValue({ text: 'Output' });

      await generateCompletion('Prompt', null, { taskType: 'soap_notes' });

      expect(mockGetModelForTask).toHaveBeenCalledWith('soap_notes');
    });

    it('should append SMS constraint for patient_communication tasks', async () => {
      mockGenerate.mockResolvedValue({ text: 'SMS response' });

      await generateCompletion('SMS prompt', 'base system prompt', {
        taskType: 'patient_communication',
      });

      const systemPromptArg = mockGenerate.mock.calls[0][1];
      expect(systemPromptArg).toContain('VIKTIG: Maks 160 tegn.');
    });

    it('should log suggestion when organizationId and taskType provided', async () => {
      mockGenerate.mockResolvedValue({ text: 'Output', durationMs: 100 });
      mockQuery.mockResolvedValue({ rows: [] });

      await generateCompletion('Prompt', null, {
        taskType: 'soap_notes',
        organizationId: 'org-1',
      });

      // logSuggestion is fire-and-forget, but query should be called
      // Wait a tick for the non-blocking call
      await new Promise((r) => setTimeout(r, 10));
      expect(mockQuery).toHaveBeenCalled();
    });

    it('should pass temperature from options when provided', async () => {
      mockGenerate.mockResolvedValue({ text: 'Output' });

      await generateCompletion('Prompt', null, { temperature: 0.9 });

      const genOptions = mockGenerate.mock.calls[0][2];
      expect(genOptions.temperature).toBe(0.9);
    });

    it('should use model config temperature as default', async () => {
      mockGenerate.mockResolvedValue({ text: 'Output' });

      await generateCompletion('Prompt');

      const genOptions = mockGenerate.mock.calls[0][2];
      expect(genOptions.temperature).toBe(0.3);
    });
  });

  // ===========================================================================
  // GET AI STATUS
  // ===========================================================================

  describe('getAIStatus', () => {
    it('should return available status when Ollama responds', async () => {
      axios.get.mockResolvedValue({
        data: {
          models: [{ name: 'chiro-no-sft-dpo-v5:latest' }, { name: 'chiro-fast:latest' }],
        },
      });

      const result = await getAIStatus();

      expect(result.available).toBe(true);
      expect(result.enabled).toBe(true);
      expect(result.provider).toBe('ollama');
      expect(result.models).toBeDefined();
    });

    it('should return unavailable when Ollama request fails', async () => {
      axios.get.mockRejectedValue(new Error('Connection refused'));

      const result = await getAIStatus();

      expect(result.available).toBe(false);
      expect(result.enabled).toBe(true);
      expect(result.error).toBe('Connection refused');
    });

    it('should check model installation status against expected models', async () => {
      axios.get.mockResolvedValue({
        data: {
          models: [{ name: 'chiro-no-sft-dpo-v5:latest' }],
        },
      });

      const result = await getAIStatus();

      expect(result.modelStatus['chiro-no-sft-dpo-v5'].installed).toBe(true);
      expect(result.modelStatus['chiro-fast'].installed).toBe(false);
    });

    it('should include guardrails and RAG status', async () => {
      axios.get.mockResolvedValue({ data: { models: [] } });

      const result = await getAIStatus();

      expect(result.guardrails).toBeDefined();
      expect(result.rag).toBeDefined();
    });
  });

  // ===========================================================================
  // BUILD FIELD PROMPT
  // ===========================================================================

  describe('buildFieldPrompt', () => {
    it('should generate basic field prompt without context', () => {
      const result = buildFieldPrompt('observation');

      expect(result).toContain('observation');
      expect(result).toContain('klinisk dokumentasjon');
    });

    it('should include chief complaint when provided in context', () => {
      const result = buildFieldPrompt('palpasjon', { chiefComplaint: 'Korsryggsmerter' });

      expect(result).toContain('Korsryggsmerter');
    });

    it('should work with empty context', () => {
      const result = buildFieldPrompt('ROM', {});

      expect(result).toContain('ROM');
    });
  });

  // ===========================================================================
  // GENERATE COMPLETION STREAM
  // ===========================================================================

  describe('generateCompletionStream', () => {
    it('should delegate to provider generateStream', async () => {
      const mockRes = { write: jest.fn(), end: jest.fn() };
      mockGenerateStream.mockResolvedValue(undefined);

      await generateCompletionStream('model-name', 'prompt', mockRes);

      expect(mockGenerateStream).toHaveBeenCalledWith('model-name', 'prompt', mockRes);
    });
  });
});
