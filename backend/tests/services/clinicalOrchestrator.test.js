/**
 * Clinical Orchestrator Tests
 * Verifies multi-step orchestration: safety screening, parallel assessments, synthesis, halt on critical.
 */

import { jest } from '@jest/globals';

// Mock logger
jest.unstable_mockModule('../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock provider
let mockGenerate;
const mockProvider = {
  generate: (...args) => mockGenerate(...args),
};

jest.unstable_mockModule('../../src/services/providers/aiProviderFactory.js', () => ({
  getAIProvider: () => mockProvider,
}));

const { orchestrate, parseSafetyResult } =
  await import('../../src/services/clinicalOrchestrator.js');

describe('ClinicalOrchestrator', () => {
  const patientData = { age: 45, name: 'Test Pasient' };
  const soapData = {
    subjective: 'Smerter i korsrygg i 3 uker',
    objective: 'Redusert fleksjon, lokalisert ømhet L4-L5',
    assessment: 'Lumbago, uspesifikk',
    plan: 'Manipulasjon, øvelser, kontroll om 2 uker',
  };

  beforeEach(() => {
    mockGenerate = jest.fn();
    delete process.env.CLAUDE_FALLBACK_MODE;
  });

  describe('orchestrate() — normal pipeline', () => {
    it('should run safety + clinical + differential by default', async () => {
      // Safety response
      mockGenerate
        .mockResolvedValueOnce({ text: 'Risikonivå: LAV. Ingen røde flagg.', provider: 'ollama' })
        // Clinical
        .mockResolvedValueOnce({
          text: 'Klinisk sammendrag: Pasient med lumbago...',
          provider: 'ollama',
        })
        // Differential
        .mockResolvedValueOnce({
          text: 'Differensial: 1. Lumbago 2. Skiveprolaps',
          provider: 'ollama',
        });

      const result = await orchestrate(patientData, soapData);

      expect(result.halted).toBe(false);
      expect(result.safety.riskLevel).toBe('LOW');
      expect(result.clinical).toContain('Klinisk sammendrag');
      expect(result.differential).toContain('Differensial');
      expect(result.letter).toBeUndefined();
      expect(result.synthesis).toBeNull();
      expect(result.steps.length).toBeGreaterThanOrEqual(3);
      expect(result.totalTime).toBeGreaterThanOrEqual(0);
    });

    it('should include letter draft when requested', async () => {
      mockGenerate
        .mockResolvedValueOnce({ text: 'Lav risiko', provider: 'ollama' })
        .mockResolvedValueOnce({ text: 'Klinisk: ...', provider: 'ollama' })
        .mockResolvedValueOnce({ text: 'Diff: ...', provider: 'ollama' })
        .mockResolvedValueOnce({ text: 'Henvisning til ortoped...', provider: 'ollama' });

      const result = await orchestrate(patientData, soapData, { includeLetterDraft: true });

      expect(result.letter).toContain('Henvisning');
      expect(mockGenerate).toHaveBeenCalledTimes(4);
    });

    it('should skip differential when disabled', async () => {
      mockGenerate
        .mockResolvedValueOnce({ text: 'Lav risiko', provider: 'ollama' })
        .mockResolvedValueOnce({ text: 'Klinisk: ...', provider: 'ollama' });

      const result = await orchestrate(patientData, soapData, { includeDifferential: false });

      expect(result.differential).toBeUndefined();
      expect(mockGenerate).toHaveBeenCalledTimes(2);
    });
  });

  describe('orchestrate() — critical halt', () => {
    it('should halt pipeline on CRITICAL risk level', async () => {
      mockGenerate.mockResolvedValueOnce({
        text: 'KRITISK: Mistanke om cauda equina syndrom. Umiddelbar henvisning.',
        provider: 'ollama',
      });

      const result = await orchestrate(patientData, soapData);

      expect(result.halted).toBe(true);
      expect(result.haltReason).toContain('Kritisk risiko');
      expect(result.safety.riskLevel).toBe('CRITICAL');
      expect(result.clinical).toBeUndefined();
      expect(result.differential).toBeUndefined();
      // Only safety step should have run
      expect(mockGenerate).toHaveBeenCalledTimes(1);
    });
  });

  describe('orchestrate() — provider failures', () => {
    it('should handle safety screening failure gracefully', async () => {
      mockGenerate
        .mockRejectedValueOnce(new Error('Ollama connection refused'))
        // Clinical + differential still run
        .mockResolvedValueOnce({ text: 'Klinisk...', provider: 'ollama' })
        .mockResolvedValueOnce({ text: 'Diff...', provider: 'ollama' });

      const result = await orchestrate(patientData, soapData);

      expect(result.halted).toBe(false);
      expect(result.safety.riskLevel).toBe('UNKNOWN');
      expect(result.safety.error).toContain('connection refused');
      expect(result.clinical).toBe('Klinisk...');
      const safetyStep = result.steps.find((s) => s.step === 'safety');
      expect(safetyStep.status).toBe('error');
    });

    it('should handle assessment failure gracefully', async () => {
      mockGenerate
        .mockResolvedValueOnce({ text: 'Lav risiko', provider: 'ollama' })
        // Clinical fails
        .mockRejectedValueOnce(new Error('model not loaded'))
        // Differential succeeds
        .mockResolvedValueOnce({ text: 'Diff result', provider: 'ollama' });

      const result = await orchestrate(patientData, soapData);

      expect(result.halted).toBe(false);
      expect(result.clinical).toBeUndefined();
      expect(result.differential).toBe('Diff result');
      const errorStep = result.steps.find((s) => s.status === 'error' && s.step === 'assessment');
      expect(errorStep).toBeDefined();
    });
  });

  describe('orchestrate() — synthesis step', () => {
    it('should run synthesis when Claude is enabled and multiple results exist', async () => {
      process.env.CLAUDE_FALLBACK_MODE = 'fallback';

      mockGenerate
        .mockResolvedValueOnce({ text: 'Lav risiko', provider: 'ollama' })
        .mockResolvedValueOnce({ text: 'Klinisk: lumbago', provider: 'ollama' })
        .mockResolvedValueOnce({ text: 'Diff: prolaps, stenose', provider: 'ollama' })
        // Synthesis
        .mockResolvedValueOnce({ text: 'Samlet vurdering: Pasient med...', provider: 'claude' });

      const result = await orchestrate(patientData, soapData);

      expect(result.synthesis).toContain('Samlet vurdering');
      const synthStep = result.steps.find((s) => s.step === 'synthesis');
      expect(synthStep.status).toBe('completed');
      expect(synthStep.provider).toBe('claude');
    });

    it('should skip synthesis when Claude is disabled', async () => {
      process.env.CLAUDE_FALLBACK_MODE = 'disabled';

      mockGenerate
        .mockResolvedValueOnce({ text: 'Lav', provider: 'ollama' })
        .mockResolvedValueOnce({ text: 'K', provider: 'ollama' })
        .mockResolvedValueOnce({ text: 'D', provider: 'ollama' });

      const result = await orchestrate(patientData, soapData);

      expect(result.synthesis).toBeNull();
      expect(mockGenerate).toHaveBeenCalledTimes(3);
    });

    it('should handle synthesis failure gracefully', async () => {
      process.env.CLAUDE_FALLBACK_MODE = 'preferred';

      mockGenerate
        .mockResolvedValueOnce({ text: 'Lav', provider: 'ollama' })
        .mockResolvedValueOnce({ text: 'Klinisk', provider: 'ollama' })
        .mockResolvedValueOnce({ text: 'Diff', provider: 'ollama' })
        .mockRejectedValueOnce(new Error('Claude rate limited'));

      const result = await orchestrate(patientData, soapData);

      expect(result.synthesis).toBeNull();
      const synthStep = result.steps.find((s) => s.step === 'synthesis');
      expect(synthStep.status).toBe('error');
      expect(synthStep.error).toContain('rate limited');
    });
  });

  describe('orchestrate() — prompt building', () => {
    it('should include patient age in safety prompt', async () => {
      mockGenerate
        .mockResolvedValueOnce({ text: 'Lav', provider: 'ollama' })
        .mockResolvedValueOnce({ text: 'K', provider: 'ollama' })
        .mockResolvedValueOnce({ text: 'D', provider: 'ollama' });

      await orchestrate(patientData, soapData);

      const safetyCall = mockGenerate.mock.calls[0];
      expect(safetyCall[0]).toContain('Alder: 45');
    });

    it('should handle missing patient age', async () => {
      mockGenerate
        .mockResolvedValueOnce({ text: 'Lav', provider: 'ollama' })
        .mockResolvedValueOnce({ text: 'K', provider: 'ollama' })
        .mockResolvedValueOnce({ text: 'D', provider: 'ollama' });

      await orchestrate({}, soapData);

      const safetyCall = mockGenerate.mock.calls[0];
      expect(safetyCall[0]).not.toContain('Alder:');
    });

    it('should pass correct task types to provider', async () => {
      mockGenerate
        .mockResolvedValueOnce({ text: 'Lav', provider: 'ollama' })
        .mockResolvedValueOnce({ text: 'K', provider: 'ollama' })
        .mockResolvedValueOnce({ text: 'D', provider: 'ollama' });

      await orchestrate(patientData, soapData);

      // Safety
      expect(mockGenerate.mock.calls[0][2].taskType).toBe('red_flag_analysis');
      // Clinical
      expect(mockGenerate.mock.calls[1][2].taskType).toBe('clinical_summary');
      // Differential
      expect(mockGenerate.mock.calls[2][2].taskType).toBe('differential_diagnosis');
    });
  });

  describe('parseSafetyResult()', () => {
    it('should parse KRITISK as CRITICAL', () => {
      const result = parseSafetyResult('KRITISK: Cauda equina syndrom.');
      expect(result.riskLevel).toBe('CRITICAL');
      expect(result.canTreat).toBe(false);
    });

    it('should parse CRITICAL as CRITICAL', () => {
      const result = parseSafetyResult('Risk level: CRITICAL');
      expect(result.riskLevel).toBe('CRITICAL');
      expect(result.canTreat).toBe(false);
    });

    it('should parse HØY as HIGH', () => {
      const result = parseSafetyResult('Risikonivå: HØY');
      expect(result.riskLevel).toBe('HIGH');
      expect(result.canTreat).toBe(true);
    });

    it('should parse MODERAT as MODERATE', () => {
      const result = parseSafetyResult('Moderat risiko identifisert.');
      expect(result.riskLevel).toBe('MODERATE');
      expect(result.canTreat).toBe(true);
    });

    it('should default to LOW for unrecognized text', () => {
      const result = parseSafetyResult('Ingen røde flagg funnet.');
      expect(result.riskLevel).toBe('LOW');
      expect(result.canTreat).toBe(true);
    });

    it('should include rawText in result', () => {
      const text = 'Some safety analysis text';
      const result = parseSafetyResult(text);
      expect(result.rawText).toBe(text);
    });
  });
});
