/**
 * Unit Tests for Clinical Agent Service
 * Tests the clinical pipeline delegation and quick suggestion features.
 */

import { jest } from '@jest/globals';

// ─── Mock dependencies BEFORE importing module under test ────────────────────

const mockOrchestrate = jest.fn();
jest.unstable_mockModule('../../../src/services/clinical/clinicalOrchestrator.js', () => ({
  orchestrate: mockOrchestrate,
}));

const mockGenerateCompletion = jest.fn();
const mockExtractCompletionText = jest.fn();
jest.unstable_mockModule('../../../src/services/ai/index.js', () => ({
  generateCompletion: mockGenerateCompletion,
  extractCompletionText: mockExtractCompletionText,
}));

jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// ─── Import AFTER mocks are registered ───────────────────────────────────────

const { runClinicalPipeline, quickSuggestion } =
  await import('../../../src/services/clinical/clinicalAgent.js');

const logger = (await import('../../../src/utils/logger.js')).default;

// ─── Shared fixtures ─────────────────────────────────────────────────────────

const PATIENT_DATA = {
  age: 45,
  name: 'Ola Nordmann',
  gender: 'male',
};

const SOAP_DATA = {
  subjective: 'Lower back pain radiating to left leg',
  objective: 'Positive SLR left 40 degrees',
  assessment: 'L5 radiculopathy suspected',
  plan: 'MRI referral, follow up in 2 weeks',
};

const ORCHESTRATOR_SUCCESS = {
  steps: [
    { step: 'safety_screening', provider: 'ollama', status: 'completed' },
    { step: 'clinical_analysis', provider: 'ollama', status: 'completed' },
    { step: 'synthesis', provider: 'claude', status: 'completed' },
  ],
  totalTime: 4200,
  safety: { riskLevel: 'MODERATE', canTreat: true, flags: ['radiculopathy'] },
  clinical: 'Clinical analysis result text',
  synthesis: 'Polished synthesis combining all results',
  halted: false,
  haltReason: null,
};

const ORCHESTRATOR_HALTED = {
  steps: [{ step: 'safety_screening', provider: 'ollama', status: 'completed' }],
  totalTime: 800,
  safety: { riskLevel: 'HIGH', canTreat: false, flags: ['cauda_equina'] },
  clinical: '',
  synthesis: null,
  halted: true,
  haltReason: 'Safety screening halted pipeline: cauda equina suspected',
};

// =============================================================================
// runClinicalPipeline
// =============================================================================

describe('runClinicalPipeline', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('delegates to orchestrator and maps result to legacy shape', async () => {
    mockOrchestrate.mockResolvedValueOnce(ORCHESTRATOR_SUCCESS);

    const result = await runClinicalPipeline(PATIENT_DATA, SOAP_DATA);

    expect(mockOrchestrate).toHaveBeenCalledWith(PATIENT_DATA, SOAP_DATA, {
      language: 'no',
      includeDifferential: true,
      includeLetterDraft: false,
    });
    expect(result.steps).toHaveLength(3);
    expect(result.steps[0]).toEqual({
      step: 'safety_screening',
      model: 'ollama',
      success: true,
    });
    expect(result.totalTime).toBe(4200);
    expect(result.safety).toEqual(ORCHESTRATOR_SUCCESS.safety);
    expect(result.clinical).toBe('Clinical analysis result text');
    expect(result.polished).toBe('Polished synthesis combining all results');
    expect(result.halted).toBe(false);
    expect(result.haltReason).toBe('');
  });

  it('passes language option through to orchestrator', async () => {
    mockOrchestrate.mockResolvedValueOnce(ORCHESTRATOR_SUCCESS);

    await runClinicalPipeline(PATIENT_DATA, SOAP_DATA, { language: 'en' });

    expect(mockOrchestrate).toHaveBeenCalledWith(
      PATIENT_DATA,
      SOAP_DATA,
      expect.objectContaining({ language: 'en' })
    );
  });

  it('defaults language to "no" when not specified', async () => {
    mockOrchestrate.mockResolvedValueOnce(ORCHESTRATOR_SUCCESS);

    await runClinicalPipeline(PATIENT_DATA, SOAP_DATA);

    expect(mockOrchestrate).toHaveBeenCalledWith(
      PATIENT_DATA,
      SOAP_DATA,
      expect.objectContaining({ language: 'no' })
    );
  });

  it('maps halted pipeline result correctly', async () => {
    mockOrchestrate.mockResolvedValueOnce(ORCHESTRATOR_HALTED);

    const result = await runClinicalPipeline(PATIENT_DATA, SOAP_DATA);

    expect(result.halted).toBe(true);
    expect(result.haltReason).toContain('cauda equina');
    expect(result.safety.canTreat).toBe(false);
    expect(result.clinical).toBe('');
    // When synthesis is null, polished falls back to clinical
    expect(result.polished).toBe('');
  });

  it('maps step errors to legacy shape with error property', async () => {
    const resultWithError = {
      ...ORCHESTRATOR_SUCCESS,
      steps: [
        { step: 'safety_screening', provider: 'ollama', status: 'completed' },
        { step: 'synthesis', provider: 'claude', status: 'failed', error: 'API rate limited' },
      ],
    };
    mockOrchestrate.mockResolvedValueOnce(resultWithError);

    const result = await runClinicalPipeline(PATIENT_DATA, SOAP_DATA);

    expect(result.steps[1]).toEqual({
      step: 'synthesis',
      model: 'claude',
      success: false,
      error: 'API rate limited',
    });
  });

  it('returns error shape when orchestrator throws', async () => {
    mockOrchestrate.mockRejectedValueOnce(new Error('Ollama unreachable'));

    const result = await runClinicalPipeline(PATIENT_DATA, SOAP_DATA);

    expect(result.halted).toBe(true);
    expect(result.haltReason).toContain('Ollama unreachable');
    expect(result.safety.riskLevel).toBe('UNKNOWN');
    expect(result.safety.canTreat).toBe(false);
    expect(result.steps).toHaveLength(1);
    expect(result.steps[0]).toEqual({
      step: 'pipeline',
      model: 'none',
      success: false,
      error: 'Ollama unreachable',
    });
    expect(result.totalTime).toBeGreaterThanOrEqual(0);
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Clinical pipeline failed'),
      expect.any(Error)
    );
  });

  it('falls back to clinical when synthesis is missing', async () => {
    const noSynthesis = {
      ...ORCHESTRATOR_SUCCESS,
      synthesis: null,
      clinical: 'Raw clinical text only',
    };
    mockOrchestrate.mockResolvedValueOnce(noSynthesis);

    const result = await runClinicalPipeline(PATIENT_DATA, SOAP_DATA);

    expect(result.polished).toBe('Raw clinical text only');
    expect(result.clinical).toBe('Raw clinical text only');
  });
});

// =============================================================================
// quickSuggestion
// =============================================================================

describe('quickSuggestion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns suggestion text on successful AI completion', async () => {
    const aiResult = { model: 'test', text: 'completion response' };
    mockGenerateCompletion.mockResolvedValueOnce(aiResult);
    mockExtractCompletionText.mockReturnValueOnce('radikulopati i venstre ben');

    const result = await quickSuggestion('Pasienten har');

    expect(result.success).toBe(true);
    expect(result.suggestion).toBe('radikulopati i venstre ben');
    expect(mockGenerateCompletion).toHaveBeenCalledWith(
      expect.stringContaining('Pasienten har'),
      expect.any(String),
      expect.objectContaining({
        taskType: 'autocomplete',
        maxTokens: 150,
        skipGuardrails: true,
      })
    );
  });

  it('passes fieldType as taskType to generateCompletion', async () => {
    mockGenerateCompletion.mockResolvedValueOnce({});
    mockExtractCompletionText.mockReturnValueOnce('suggestion');

    await quickSuggestion('Test text', 'soap_objective');

    expect(mockGenerateCompletion).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.objectContaining({ taskType: 'soap_objective' })
    );
  });

  it('returns error shape when AI call fails', async () => {
    mockGenerateCompletion.mockRejectedValueOnce(new Error('Model offline'));

    const result = await quickSuggestion('Partial text');

    expect(result.success).toBe(false);
    expect(result.suggestion).toBe('');
    expect(result.error).toBe('Model offline');
  });

  it('defaults fieldType to autocomplete', async () => {
    mockGenerateCompletion.mockResolvedValueOnce({});
    mockExtractCompletionText.mockReturnValueOnce('');

    await quickSuggestion('test');

    expect(mockGenerateCompletion).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.objectContaining({ taskType: 'autocomplete' })
    );
  });
});
