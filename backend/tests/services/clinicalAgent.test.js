/**
 * Clinical Agent Tests
 * Verifies delegation to orchestrator, result mapping, error handling,
 * backward compatibility, and independent quickSuggestion operation.
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

// Mock orchestrator — factory pattern for beforeEach reassignment
let mockOrchestrate;
jest.unstable_mockModule('../../src/services/clinicalOrchestrator.js', () => ({
  orchestrate: (...args) => mockOrchestrate(...args),
}));

// Mock ai.js — needed by quickSuggestion
let mockGenerateCompletion;
let mockExtractCompletionText;
jest.unstable_mockModule('../../src/services/ai.js', () => ({
  generateCompletion: (...args) => mockGenerateCompletion(...args),
  extractCompletionText: (...args) => mockExtractCompletionText(...args),
}));

const { runClinicalPipeline, quickSuggestion } =
  await import('../../src/services/clinicalAgent.js');

describe('ClinicalAgent', () => {
  const patientData = { age: 45, name: 'Test Pasient' };
  const soapData = {
    subjective: 'Smerter i korsrygg i 3 uker',
    objective: 'Redusert fleksjon, lokalisert ømhet L4-L5',
    assessment: 'Lumbago, uspesifikk',
    plan: 'Manipulasjon, øvelser, kontroll om 2 uker',
  };

  beforeEach(() => {
    mockOrchestrate = jest.fn();
    mockGenerateCompletion = jest.fn();
    mockExtractCompletionText = jest.fn();
  });

  // Helper: standard orchestrator success result
  const makeOrchResult = (overrides = {}) => ({
    halted: false,
    haltReason: undefined,
    safety: { riskLevel: 'LOW', canTreat: true, flags: [] },
    clinical: 'Klinisk sammendrag: Pasient med lumbago...',
    differential: 'Differensial: 1. Lumbago 2. Prolaps',
    letter: undefined,
    synthesis: null,
    steps: [
      { step: 'safety', status: 'completed', provider: 'ollama' },
      { step: 'clinical', status: 'completed', provider: 'ollama' },
      { step: 'differential', status: 'completed', provider: 'ollama' },
    ],
    totalTime: 1200,
    ...overrides,
  });

  // =========================================================
  // Group 1: Delegation
  // =========================================================
  describe('runClinicalPipeline() — delegation', () => {
    it('should call orchestrate() with mapped options', async () => {
      mockOrchestrate.mockResolvedValue(makeOrchResult());

      await runClinicalPipeline(patientData, soapData, { language: 'en' });

      expect(mockOrchestrate).toHaveBeenCalledWith(patientData, soapData, {
        language: 'en',
        includeDifferential: true,
        includeLetterDraft: false,
      });
    });

    it('should forward patientData and soapData unchanged', async () => {
      mockOrchestrate.mockResolvedValue(makeOrchResult());

      await runClinicalPipeline(patientData, soapData);

      const [pd, sd] = mockOrchestrate.mock.calls[0];
      expect(pd).toBe(patientData);
      expect(sd).toBe(soapData);
    });

    it('should default language to "no"', async () => {
      mockOrchestrate.mockResolvedValue(makeOrchResult());

      await runClinicalPipeline(patientData, soapData);

      expect(mockOrchestrate.mock.calls[0][2].language).toBe('no');
    });

    it('should default includeDifferential: true, includeLetterDraft: false', async () => {
      mockOrchestrate.mockResolvedValue(makeOrchResult());

      await runClinicalPipeline(patientData, soapData);

      const opts = mockOrchestrate.mock.calls[0][2];
      expect(opts.includeDifferential).toBe(true);
      expect(opts.includeLetterDraft).toBe(false);
    });

    it('should NOT call ai.js functions directly', async () => {
      mockOrchestrate.mockResolvedValue(makeOrchResult());

      await runClinicalPipeline(patientData, soapData);

      expect(mockGenerateCompletion).not.toHaveBeenCalled();
      expect(mockExtractCompletionText).not.toHaveBeenCalled();
    });
  });

  // =========================================================
  // Group 2: Result mapping
  // =========================================================
  describe('runClinicalPipeline() — result mapping', () => {
    it('should map orchestrator.clinical → result.clinical', async () => {
      mockOrchestrate.mockResolvedValue(makeOrchResult({ clinical: 'Klinisk vurdering her' }));

      const result = await runClinicalPipeline(patientData, soapData);

      expect(result.clinical).toBe('Klinisk vurdering her');
    });

    it('should map orchestrator.synthesis → result.polished when synthesis exists', async () => {
      mockOrchestrate.mockResolvedValue(
        makeOrchResult({ synthesis: 'Syntetisert sammendrag', clinical: 'Rå klinisk' })
      );

      const result = await runClinicalPipeline(patientData, soapData);

      expect(result.polished).toBe('Syntetisert sammendrag');
    });

    it('should fall back to clinical for polished when no synthesis', async () => {
      mockOrchestrate.mockResolvedValue(
        makeOrchResult({ synthesis: null, clinical: 'Klinisk tekst' })
      );

      const result = await runClinicalPipeline(patientData, soapData);

      expect(result.polished).toBe('Klinisk tekst');
    });

    it('should map step status "completed" → success: true', async () => {
      mockOrchestrate.mockResolvedValue(makeOrchResult());

      const result = await runClinicalPipeline(patientData, soapData);

      expect(result.steps[0].success).toBe(true);
    });

    it('should map step provider → model', async () => {
      mockOrchestrate.mockResolvedValue(makeOrchResult());

      const result = await runClinicalPipeline(patientData, soapData);

      expect(result.steps[0].model).toBe('ollama');
      expect(result.steps[0]).not.toHaveProperty('provider');
    });
  });

  // =========================================================
  // Group 3: Safety halt
  // =========================================================
  describe('runClinicalPipeline() — safety halt', () => {
    it('should return halted: true when orchestrator halts', async () => {
      mockOrchestrate.mockResolvedValue(
        makeOrchResult({
          halted: true,
          haltReason: 'Kritisk risiko identifisert: cauda equina',
          safety: { riskLevel: 'CRITICAL', canTreat: false, flags: ['cauda equina'] },
          clinical: undefined,
          differential: undefined,
          steps: [{ step: 'safety', status: 'completed', provider: 'ollama' }],
        })
      );

      const result = await runClinicalPipeline(patientData, soapData);

      expect(result.halted).toBe(true);
      expect(result.haltReason).toContain('Kritisk risiko');
    });

    it('should return halted: false for non-critical risk', async () => {
      mockOrchestrate.mockResolvedValue(makeOrchResult());

      const result = await runClinicalPipeline(patientData, soapData);

      expect(result.halted).toBe(false);
    });

    it('should preserve haltReason from orchestrator', async () => {
      const reason = 'Kritisk risiko identifisert: mistanke om fraktur';
      mockOrchestrate.mockResolvedValue(makeOrchResult({ halted: true, haltReason: reason }));

      const result = await runClinicalPipeline(patientData, soapData);

      expect(result.haltReason).toBe(reason);
    });
  });

  // =========================================================
  // Group 4: Error handling
  // =========================================================
  describe('runClinicalPipeline() — error handling', () => {
    it('should return graceful error object when orchestrate throws', async () => {
      mockOrchestrate.mockRejectedValue(new Error('Ollama connection refused'));

      const result = await runClinicalPipeline(patientData, soapData);

      expect(result.halted).toBe(true);
      expect(result.haltReason).toContain('Ollama connection refused');
      expect(result.steps).toHaveLength(1);
      expect(result.steps[0].success).toBe(false);
    });

    it('should set safety to UNKNOWN with canTreat: false on error', async () => {
      mockOrchestrate.mockRejectedValue(new Error('timeout'));

      const result = await runClinicalPipeline(patientData, soapData);

      expect(result.safety.riskLevel).toBe('UNKNOWN');
      expect(result.safety.canTreat).toBe(false);
    });

    it('should include error message in haltReason', async () => {
      mockOrchestrate.mockRejectedValue(new Error('model not loaded'));

      const result = await runClinicalPipeline(patientData, soapData);

      expect(result.haltReason).toBe('Pipeline error: model not loaded');
    });
  });

  // =========================================================
  // Group 5: Backward compatibility
  // =========================================================
  describe('runClinicalPipeline() — backward compatibility', () => {
    it('should have all required fields in return shape', async () => {
      mockOrchestrate.mockResolvedValue(makeOrchResult());

      const result = await runClinicalPipeline(patientData, soapData);

      expect(result).toHaveProperty('steps');
      expect(result).toHaveProperty('totalTime');
      expect(result).toHaveProperty('safety');
      expect(result).toHaveProperty('clinical');
      expect(result).toHaveProperty('polished');
      expect(result).toHaveProperty('halted');
      expect(result).toHaveProperty('haltReason');
    });

    it('should have correct step item shape', async () => {
      mockOrchestrate.mockResolvedValue(makeOrchResult());

      const result = await runClinicalPipeline(patientData, soapData);

      const step = result.steps[0];
      expect(step).toHaveProperty('step');
      expect(step).toHaveProperty('model');
      expect(step).toHaveProperty('success');
    });

    it('should include error in step item when present', async () => {
      mockOrchestrate.mockResolvedValue(
        makeOrchResult({
          steps: [{ step: 'safety', status: 'error', error: 'timeout', provider: 'ollama' }],
        })
      );

      const result = await runClinicalPipeline(patientData, soapData);

      expect(result.steps[0].error).toBe('timeout');
      expect(result.steps[0].success).toBe(false);
    });

    it('should return totalTime as a number', async () => {
      mockOrchestrate.mockResolvedValue(makeOrchResult({ totalTime: 850 }));

      const result = await runClinicalPipeline(patientData, soapData);

      expect(typeof result.totalTime).toBe('number');
      expect(result.totalTime).toBe(850);
    });
  });

  // =========================================================
  // Group 6: quickSuggestion — independent operation
  // =========================================================
  describe('quickSuggestion() — independent operation', () => {
    it('should call generateCompletion, NOT orchestrate', async () => {
      mockGenerateCompletion.mockResolvedValue({ text: 'completed text' });
      mockExtractCompletionText.mockReturnValue('completed text');

      await quickSuggestion('Pasient med');

      expect(mockGenerateCompletion).toHaveBeenCalled();
      expect(mockOrchestrate).not.toHaveBeenCalled();
    });

    it('should return { suggestion, success: true } on success', async () => {
      mockGenerateCompletion.mockResolvedValue({ text: 'nakkesmerter' });
      mockExtractCompletionText.mockReturnValue('nakkesmerter');

      const result = await quickSuggestion('Pasient med');

      expect(result.suggestion).toBe('nakkesmerter');
      expect(result.success).toBe(true);
    });

    it('should return { suggestion: "", success: false, error } on failure', async () => {
      mockGenerateCompletion.mockRejectedValue(new Error('Ollama down'));

      const result = await quickSuggestion('Pasient med');

      expect(result.suggestion).toBe('');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Ollama down');
    });
  });
});
