/**
 * Unit Tests for AI Prompt Builder
 * Tests spell check, SOAP suggestions, diagnosis codes, red flag analysis,
 * clinical summaries, journal organization, merge notes, field prompts,
 * streaming, and AI status.
 */

import { jest } from '@jest/globals';

// ── Mock logger ────────────────────────────────────────────────────────────────
jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// ── Mock database ──────────────────────────────────────────────────────────────
const mockQuery = jest.fn();
jest.unstable_mockModule('../../../src/config/database.js', () => ({
  query: mockQuery,
  default: { query: mockQuery },
}));

// ── Mock clinical validation ───────────────────────────────────────────────────
const mockValidateClinicalContent = jest.fn();
const mockCheckRedFlagsInContent = jest.fn();
const mockCheckMedicationWarnings = jest.fn();
jest.unstable_mockModule('../../../src/services/clinicalValidation.js', () => ({
  validateClinicalContent: mockValidateClinicalContent,
  checkRedFlagsInContent: mockCheckRedFlagsInContent,
  checkMedicationWarnings: mockCheckMedicationWarnings,
}));

// ── Mock AI provider factory ───────────────────────────────────────────────────
const mockGenerate = jest.fn();
const mockGenerateStream = jest.fn();
jest.unstable_mockModule('../../../src/services/providers/aiProviderFactory.js', () => ({
  getAIProvider: () => ({
    generate: mockGenerate,
    generateStream: mockGenerateStream,
  }),
}));

// ── Mock circuit breaker registry ──────────────────────────────────────────────
const mockBreaker = { requestTimeout: 0 };
jest.unstable_mockModule(
  '../../../src/infrastructure/resilience/CircuitBreakerRegistry.js',
  () => ({
    default: {
      getBreaker: jest.fn(() => mockBreaker),
    },
  })
);

// ── Mock modelRouter ───────────────────────────────────────────────────────────
const mockGetModelForTask = jest.fn();
const mockIsAIAvailable = jest.fn();
const mockCalculateConfidence = jest.fn();
const mockExtractCompletionText = jest.fn();
jest.unstable_mockModule('../../../src/services/ai/modelRouter.js', () => ({
  AI_MODEL: 'chiro-no-sft-dpo-v6',
  AI_ENABLED: false,
  OLLAMA_BASE_URL: 'http://localhost:11434',
  MODEL_CONFIG: {
    'chiro-no-sft-dpo-v6': {
      name: 'chiro-no-sft-dpo-v6',
      description: 'Test model',
      temperature: 0.3,
    },
    'chiro-no-sft-dpo-v5': {
      name: 'chiro-no-sft-dpo-v5',
      description: 'Fallback model',
      temperature: 0.3,
    },
  },
  MODEL_ROUTING: { soap_notes: 'chiro-no-sft-dpo-v6' },
  AB_SPLIT_CONFIG: {},
  getModelForTask: mockGetModelForTask,
  isAIAvailable: mockIsAIAvailable,
  calculateConfidence: mockCalculateConfidence,
  extractCompletionText: mockExtractCompletionText,
}));

// ── Mock guardrails ────────────────────────────────────────────────────────────
jest.unstable_mockModule('../../../src/services/ai/guardrails.js', () => ({
  guardrailsService: null,
  guardrailsAvailable: false,
  GUARDRAILS_ENABLED: false,
  checkGuardrailsForTask: jest.fn(() => ({ canProceed: true, required: false, available: false })),
  applyFallbackInputValidation: jest.fn((prompt) => ({
    proceed: true,
    sanitized: prompt,
    issues: [],
  })),
}));

// ── Mock RAG retrieval ─────────────────────────────────────────────────────────
jest.unstable_mockModule('../../../src/services/ai/ragRetrieval.js', () => ({
  augmentWithRAG: jest.fn(async (prompt) => ({
    augmentedPrompt: prompt,
    ragContext: null,
  })),
  ragService: null,
  RAG_ENABLED: false,
}));

// ── Mock session memory ────────────────────────────────────────────────────────
jest.unstable_mockModule('../../../src/services/ai/sessionMemory.js', () => ({
  recordLearning: jest.fn(),
}));

// ── Mock system prompts ────────────────────────────────────────────────────────
jest.unstable_mockModule('../../../src/services/ai/systemPrompts.js', () => ({
  SPELL_CHECK_PROMPT: 'spell-check-system-prompt',
  SOAP_PROMPTS: {
    subjective: 'soap-subjective-system-prompt',
    objective: 'soap-objective-system-prompt',
    assessment: 'soap-assessment-system-prompt',
    plan: 'soap-plan-system-prompt',
  },
  buildDiagnosisPrompt: jest.fn((codes) => `diagnosis-system-prompt: ${codes}`),
  RED_FLAG_PROMPT: 'red-flag-system-prompt',
  CLINICAL_SUMMARY_PROMPT: 'clinical-summary-system-prompt',
  JOURNAL_ORGANIZATION_PROMPT: 'journal-org-system-prompt',
  MERGE_NOTES_PROMPT: 'merge-notes-system-prompt',
  SMS_CONSTRAINT: 'Max 160 tegn.',
}));

// ── Mock axios ─────────────────────────────────────────────────────────────────
const mockAxiosGet = jest.fn();
jest.unstable_mockModule('axios', () => ({
  default: { get: mockAxiosGet },
}));

// ── Import mocked modules we need to re-setup in beforeEach ────────────────────
const guardrailsMod = await import('../../../src/services/ai/guardrails.js');
const ragMod = await import('../../../src/services/ai/ragRetrieval.js');

// ── Import module under test ───────────────────────────────────────────────────
const {
  spellCheckNorwegian,
  generateSOAPSuggestions,
  suggestDiagnosisCodes,
  analyzeRedFlags,
  generateClinicalSummary,
  learnFromOutcome,
  organizeOldJournalNotes,
  organizeMultipleNotes,
  mergeOrganizedNotes,
  getAIStatus,
  buildFieldPrompt,
  generateCompletionStream,
  generateCompletion,
} = await import('../../../src/services/ai/promptBuilder.js');

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Make AI "available" by having isAIAvailable return true */
const enableAI = () => {
  mockIsAIAvailable.mockReturnValue(true);
  mockGetModelForTask.mockResolvedValue({
    model: 'chiro-no-sft-dpo-v6',
    abVariant: null,
  });
  mockCalculateConfidence.mockReturnValue({ score: 0.85, level: 'HIGH' });
};

/** Standard provider response */
const providerResult = (text = 'AI response') => ({
  text,
  model: 'chiro-no-sft-dpo-v6',
  durationMs: 123,
});

// ════════════════════════════════════════════════════════════════════════════════
// TESTS
// ════════════════════════════════════════════════════════════════════════════════

describe('ai/promptBuilder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: AI unavailable (test env has AI_ENABLED=false)
    mockIsAIAvailable.mockReturnValue(false);

    // resetMocks: true clears mock implementations between tests.
    // Re-set the guardrails and RAG mock return values that generateCompletion depends on.
    guardrailsMod.checkGuardrailsForTask.mockReturnValue({
      canProceed: true,
      required: false,
      available: false,
    });
    guardrailsMod.applyFallbackInputValidation.mockReturnValue({
      proceed: true,
      sanitized: 'test',
      issues: [],
    });
    ragMod.augmentWithRAG.mockImplementation(async (prompt) => ({
      augmentedPrompt: prompt,
      ragContext: null,
    }));
  });

  // ─── Module exports ──────────────────────────────────────────────────────────

  describe('module exports', () => {
    it('exports all expected functions', () => {
      expect(typeof spellCheckNorwegian).toBe('function');
      expect(typeof generateSOAPSuggestions).toBe('function');
      expect(typeof suggestDiagnosisCodes).toBe('function');
      expect(typeof analyzeRedFlags).toBe('function');
      expect(typeof generateClinicalSummary).toBe('function');
      expect(typeof learnFromOutcome).toBe('function');
      expect(typeof organizeOldJournalNotes).toBe('function');
      expect(typeof organizeMultipleNotes).toBe('function');
      expect(typeof mergeOrganizedNotes).toBe('function');
      expect(typeof getAIStatus).toBe('function');
      expect(typeof buildFieldPrompt).toBe('function');
      expect(typeof generateCompletionStream).toBe('function');
      expect(typeof generateCompletion).toBe('function');
    });
  });

  // ─── buildFieldPrompt (pure, synchronous) ────────────────────────────────────

  describe('buildFieldPrompt', () => {
    it('generates a prompt string for a given field type', () => {
      const result = buildFieldPrompt('palpasjon');
      expect(result).toContain('palpasjon');
      expect(result).toContain('klinisk dokumentasjon');
    });

    it('includes chief complaint when provided in context', () => {
      const result = buildFieldPrompt('observasjon', { chiefComplaint: 'Korsryggsmerter' });
      expect(result).toContain('Korsryggsmerter');
      expect(result).toContain('observasjon');
    });

    it('works without context', () => {
      const result = buildFieldPrompt('ROM', {});
      expect(result).toContain('ROM');
      expect(result).not.toContain('Basert på hovedklage');
    });
  });

  // ─── spellCheckNorwegian ─────────────────────────────────────────────────────

  describe('spellCheckNorwegian', () => {
    it('returns original text unchanged when AI is unavailable', async () => {
      const result = await spellCheckNorwegian('Pasient kjem inn med smerter');
      expect(result).toEqual({
        original: 'Pasient kjem inn med smerter',
        corrected: 'Pasient kjem inn med smerter',
        hasChanges: false,
        aiAvailable: false,
      });
    });

    it('returns corrected text when AI is available', async () => {
      enableAI();
      mockGenerate.mockResolvedValue(providerResult('Pasient kommer inn med smerter'));
      mockExtractCompletionText.mockReturnValue('Pasient kommer inn med smerter');
      // logSuggestion calls query (non-blocking) — let it succeed silently
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await spellCheckNorwegian('Pasient kjem inn med smerter');
      expect(result.corrected).toBe('Pasient kommer inn med smerter');
      expect(result.hasChanges).toBe(true);
      expect(result.aiAvailable).toBe(true);
    });

    it('reports hasChanges=false when corrected text matches original', async () => {
      enableAI();
      const text = 'Korrekt norsk tekst';
      mockGenerate.mockResolvedValue(providerResult(text));
      mockExtractCompletionText.mockReturnValue(text);
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await spellCheckNorwegian(text);
      expect(result.hasChanges).toBe(false);
      expect(result.aiAvailable).toBe(true);
    });

    it('returns fallback on AI error', async () => {
      enableAI();
      mockGenerate.mockRejectedValue(new Error('Ollama timeout'));

      const result = await spellCheckNorwegian('test');
      expect(result.aiAvailable).toBe(false);
      expect(result.error).toBe('Ollama timeout');
      expect(result.corrected).toBe('test');
    });
  });

  // ─── generateSOAPSuggestions ─────────────────────────────────────────────────

  describe('generateSOAPSuggestions', () => {
    it('returns empty suggestion when AI is unavailable', async () => {
      const result = await generateSOAPSuggestions('Korsryggsmerter', 'subjective');
      expect(result.aiAvailable).toBe(false);
      expect(result.suggestion).toBe('');
      expect(result.section).toBe('subjective');
    });

    it('returns error for invalid SOAP section when AI is available', async () => {
      enableAI();
      const result = await generateSOAPSuggestions('Korsryggsmerter', 'invalid_section');
      expect(result.error).toBe('Invalid section');
      expect(result.aiAvailable).toBe(false);
    });

    it('generates SOAP suggestion for a valid section', async () => {
      enableAI();
      mockGenerate.mockResolvedValue(providerResult('Pasienten rapporterer smerter i korsryggen.'));
      mockExtractCompletionText.mockReturnValue('Pasienten rapporterer smerter i korsryggen.');
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await generateSOAPSuggestions('Korsryggsmerter', 'subjective');
      expect(result.aiAvailable).toBe(true);
      expect(result.suggestion).toBe('Pasienten rapporterer smerter i korsryggen.');
      expect(result.section).toBe('subjective');
    });

    it('returns fallback on AI error', async () => {
      enableAI();
      mockGenerate.mockRejectedValue(new Error('Provider error'));

      const result = await generateSOAPSuggestions('Smerter', 'plan');
      expect(result.aiAvailable).toBe(false);
      expect(result.error).toBe('Provider error');
    });
  });

  // ─── suggestDiagnosisCodes ───────────────────────────────────────────────────

  describe('suggestDiagnosisCodes', () => {
    const soapData = {
      subjective: { chief_complaint: 'Korsryggsmerter', history: 'Gradvis debut' },
      objective: { observation: 'Redusert fleksjon', palpation: 'Palpasjon L4-L5' },
      assessment: { clinical_reasoning: 'Mekanisk korsryggsmerte' },
    };

    it('returns empty codes when AI is unavailable', async () => {
      const result = await suggestDiagnosisCodes(soapData);
      expect(result.aiAvailable).toBe(false);
      expect(result.codes).toEqual([]);
    });

    it('returns database error when codes query fails', async () => {
      enableAI();
      mockQuery.mockRejectedValueOnce(new Error('DB connection lost'));

      const result = await suggestDiagnosisCodes(soapData);
      expect(result.aiAvailable).toBe(false);
      expect(result.error).toBe('Database unavailable');
    });

    it('suggests matching ICPC-2 codes from AI response', async () => {
      enableAI();
      mockQuery.mockResolvedValueOnce({
        rows: [
          { code: 'L03', description_no: 'Korsryggsmerter', chapter: 'L' },
          { code: 'L84', description_no: 'Ryggsmerte uten utstråling', chapter: 'L' },
        ],
      });
      mockGenerate.mockResolvedValue(providerResult('L03 - Korsryggsmerter er mest relevant.'));
      mockExtractCompletionText.mockReturnValue('L03 - Korsryggsmerter er mest relevant.');
      mockQuery.mockResolvedValue({ rows: [] }); // logSuggestion

      const result = await suggestDiagnosisCodes(soapData);
      expect(result.aiAvailable).toBe(true);
      expect(result.codes).toContain('L03');
      expect(result.codes).not.toContain('L84');
    });

    it('returns fallback on AI generation error', async () => {
      enableAI();
      mockQuery.mockResolvedValueOnce({
        rows: [{ code: 'L03', description_no: 'Test', chapter: 'L' }],
      });
      mockGenerate.mockRejectedValue(new Error('timeout'));

      const result = await suggestDiagnosisCodes(soapData);
      expect(result.aiAvailable).toBe(false);
      expect(result.error).toBe('timeout');
    });
  });

  // ─── analyzeRedFlags ─────────────────────────────────────────────────────────

  describe('analyzeRedFlags', () => {
    const patientData = {
      id: 'p1',
      age: 45,
      medical_history: 'Frisk',
      current_medications: [],
    };
    const soapData = {
      subjective: { chief_complaint: 'Korsryggsmerter', history: '' },
      objective: { observation: '', ortho_tests: '' },
      assessment: { clinical_reasoning: '' },
    };

    it('returns CRITICAL result when clinical validation detects critical flags', async () => {
      mockCheckRedFlagsInContent.mockReturnValue([
        { flag: 'cauda_equina', severity: 'CRITICAL', message: 'Cauda Equina' },
      ]);
      mockCheckMedicationWarnings.mockReturnValue([]);
      mockValidateClinicalContent.mockResolvedValue({
        riskLevel: 'CRITICAL',
        hasRedFlags: true,
        requiresReview: true,
        confidence: 0.95,
      });

      const result = await analyzeRedFlags(patientData, soapData);
      expect(result.riskLevel).toBe('CRITICAL');
      expect(result.canTreat).toBe(false);
      expect(result.recommendReferral).toBe(true);
      expect(result.source).toBe('clinical_validation');
    });

    it('returns clinical_validation_only when AI unavailable and no critical flags', async () => {
      mockCheckRedFlagsInContent.mockReturnValue([]);
      mockCheckMedicationWarnings.mockReturnValue([]);
      mockValidateClinicalContent.mockResolvedValue({
        riskLevel: 'LOW',
        hasRedFlags: false,
        requiresReview: false,
        confidence: 0.8,
      });

      const result = await analyzeRedFlags(patientData, soapData);
      expect(result.source).toBe('clinical_validation_only');
      expect(result.aiAvailable).toBe(false);
      expect(result.canTreat).toBe(true);
    });

    it('performs combined AI + rule-based analysis when AI available', async () => {
      enableAI();
      mockCheckRedFlagsInContent.mockReturnValue([]);
      mockCheckMedicationWarnings.mockReturnValue([]);
      mockValidateClinicalContent.mockResolvedValue({
        riskLevel: 'LOW',
        hasRedFlags: false,
        requiresReview: false,
        confidence: 0.8,
      });
      mockGenerate.mockResolvedValue(providerResult('Ingen røde flagg. Trygt å behandle.'));
      mockExtractCompletionText.mockReturnValue('Ingen røde flagg. Trygt å behandle.');
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await analyzeRedFlags(patientData, soapData);
      expect(result.source).toBe('combined');
      expect(result.aiAvailable).toBe(true);
      expect(result.riskLevel).toBe('LOW');
    });

    it('escalates to CRITICAL when AI mentions akutt henvisning', async () => {
      enableAI();
      mockCheckRedFlagsInContent.mockReturnValue([]);
      mockCheckMedicationWarnings.mockReturnValue([]);
      mockValidateClinicalContent.mockResolvedValue({
        riskLevel: 'LOW',
        hasRedFlags: false,
        requiresReview: false,
        confidence: 0.8,
      });
      mockGenerate.mockResolvedValue(providerResult('Akutt henvisning nødvendig pga symptomer.'));
      mockExtractCompletionText.mockReturnValue('Akutt henvisning nødvendig pga symptomer.');
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await analyzeRedFlags(patientData, soapData);
      expect(result.riskLevel).toBe('CRITICAL');
      expect(result.canTreat).toBe(false);
      expect(result.recommendReferral).toBe(true);
    });

    it('escalates to HIGH when AI mentions utredning', async () => {
      enableAI();
      mockCheckRedFlagsInContent.mockReturnValue([]);
      mockCheckMedicationWarnings.mockReturnValue([]);
      mockValidateClinicalContent.mockResolvedValue({
        riskLevel: 'LOW',
        hasRedFlags: false,
        requiresReview: false,
        confidence: 0.8,
      });
      mockGenerate.mockResolvedValue(providerResult('Anbefaler videre utredning.'));
      mockExtractCompletionText.mockReturnValue('Anbefaler videre utredning.');
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await analyzeRedFlags(patientData, soapData);
      expect(result.riskLevel).toBe('HIGH');
    });

    it('returns fallback on AI error during analysis', async () => {
      enableAI();
      mockCheckRedFlagsInContent.mockReturnValue([]);
      mockCheckMedicationWarnings.mockReturnValue([]);
      mockValidateClinicalContent.mockResolvedValue({
        riskLevel: 'MODERATE',
        hasRedFlags: false,
        requiresReview: false,
        confidence: 0.7,
      });
      mockGenerate.mockRejectedValue(new Error('AI failed'));

      const result = await analyzeRedFlags(patientData, soapData);
      expect(result.aiAvailable).toBe(false);
      expect(result.source).toBe('clinical_validation_only');
      expect(result.error).toBe('AI failed');
    });
  });

  // ─── generateClinicalSummary ─────────────────────────────────────────────────

  describe('generateClinicalSummary', () => {
    const encounter = {
      id: 'enc-1',
      subjective: { chief_complaint: 'Korsryggsmerter', history: '' },
      objective: { observation: '', palpasjon: '', rom: '' },
      assessment: { clinical_reasoning: '' },
      icpc_codes: ['L03'],
      plan: { treatment: 'Manipulasjon', follow_up: '1 uke' },
    };

    it('returns empty summary when AI unavailable', async () => {
      const result = await generateClinicalSummary(encounter);
      expect(result.aiAvailable).toBe(false);
      expect(result.summary).toBe('');
      expect(result.encounterId).toBe('enc-1');
    });

    it('generates summary when AI is available', async () => {
      enableAI();
      const summaryText = 'Pasienten kom med korsryggsmerter. Manipulasjon utført.';
      mockGenerate.mockResolvedValue(providerResult(summaryText));
      mockExtractCompletionText.mockReturnValue(summaryText);
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await generateClinicalSummary(encounter);
      expect(result.aiAvailable).toBe(true);
      expect(result.summary).toBe(summaryText);
    });

    it('returns fallback on error', async () => {
      enableAI();
      mockGenerate.mockRejectedValue(new Error('summary fail'));

      const result = await generateClinicalSummary(encounter);
      expect(result.aiAvailable).toBe(false);
      expect(result.error).toBe('summary fail');
    });
  });

  // ─── learnFromOutcome ────────────────────────────────────────────────────────

  describe('learnFromOutcome', () => {
    it('stores learning data and returns success', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await learnFromOutcome('enc-1', { improved: true });
      expect(result.success).toBe(true);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO ai_learning_data'),
        ['enc-1', JSON.stringify({ improved: true })]
      );
    });

    it('returns failure on database error', async () => {
      mockQuery.mockRejectedValue(new Error('DB write failed'));

      const result = await learnFromOutcome('enc-1', {});
      expect(result.success).toBe(false);
      expect(result.error).toBe('DB write failed');
    });
  });

  // ─── organizeOldJournalNotes ─────────────────────────────────────────────────

  describe('organizeOldJournalNotes', () => {
    it('returns unavailable when AI is off', async () => {
      const result = await organizeOldJournalNotes('some text');
      expect(result.aiAvailable).toBe(false);
      expect(result.success).toBe(false);
    });

    it('organizes journal notes into structured JSON', async () => {
      enableAI();
      const jsonResponse = JSON.stringify({
        soap: { subjective: { chief_complaint: 'Rygg' } },
        actionable_items: [],
      });
      mockGenerate.mockResolvedValue(providerResult(jsonResponse));
      mockExtractCompletionText.mockReturnValue(jsonResponse);
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await organizeOldJournalNotes('Gammel notat om ryggsmerter');
      expect(result.success).toBe(true);
      expect(result.organizedData.soap.subjective.chief_complaint).toBe('Rygg');
    });

    it('handles non-JSON AI response gracefully', async () => {
      enableAI();
      mockGenerate.mockResolvedValue(providerResult('Not valid JSON at all'));
      mockExtractCompletionText.mockReturnValue('Not valid JSON at all');
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await organizeOldJournalNotes('Test text');
      expect(result.success).toBe(true);
      expect(result.organizedData.structured_data.parsing_error).toBe(true);
    });

    it('returns failure on AI error', async () => {
      enableAI();
      mockGenerate.mockRejectedValue(new Error('Organize failed'));

      const result = await organizeOldJournalNotes('notes');
      expect(result.success).toBe(false);
      expect(result.aiAvailable).toBe(false);
    });
  });

  // ─── organizeMultipleNotes ───────────────────────────────────────────────────

  describe('organizeMultipleNotes', () => {
    it('returns all failed when AI is unavailable', async () => {
      const notes = [
        { id: 'n1', content: 'Note 1' },
        { id: 'n2', content: 'Note 2' },
      ];
      const result = await organizeMultipleNotes(notes);
      expect(result.totalNotes).toBe(2);
      expect(result.successfullyProcessed).toBe(0);
      expect(result.results[0].error).toBe('AI is disabled');
    });
  });

  // ─── mergeOrganizedNotes ─────────────────────────────────────────────────────

  describe('mergeOrganizedNotes', () => {
    it('returns unavailable when AI is off', async () => {
      const result = await mergeOrganizedNotes([{ soap: {} }]);
      expect(result.aiAvailable).toBe(false);
      expect(result.success).toBe(false);
    });

    it('merges notes when AI is available', async () => {
      enableAI();
      const mergedText = 'Sammenslått pasienthistorikk';
      mockGenerate.mockResolvedValue(providerResult(mergedText));
      mockExtractCompletionText.mockReturnValue(mergedText);
      mockQuery.mockResolvedValue({ rows: [] });

      const notes = [
        { soap: { subjective: {} }, suggested_date: '2026-01-01' },
        { soap: { subjective: {} }, suggested_date: '2026-02-01' },
      ];
      const result = await mergeOrganizedNotes(notes, { first_name: 'Ola' });
      expect(result.success).toBe(true);
      expect(result.mergedNote).toBe(mergedText);
      expect(result.sourceNotesCount).toBe(2);
      expect(result.dateRange.earliest).toBe('2026-01-01');
      expect(result.dateRange.latest).toBe('2026-02-01');
    });

    it('returns failure on AI error', async () => {
      enableAI();
      mockGenerate.mockRejectedValue(new Error('merge fail'));

      const result = await mergeOrganizedNotes([{ soap: {} }]);
      expect(result.success).toBe(false);
      expect(result.error).toBe('merge fail');
    });
  });

  // ─── getAIStatus ─────────────────────────────────────────────────────────────

  describe('getAIStatus', () => {
    // AI_ENABLED is captured at module load time from envSetup (AI_ENABLED=false)
    it('returns disabled status when AI_ENABLED is false', async () => {
      const result = await getAIStatus();
      expect(result.available).toBe(false);
      expect(result.enabled).toBe(false);
      expect(result.message).toContain('AI_ENABLED=false');
    });
  });

  // ─── generateCompletionStream ────────────────────────────────────────────────

  describe('generateCompletionStream', () => {
    it('delegates to provider generateStream', async () => {
      const fakeRes = { write: jest.fn(), end: jest.fn() };
      mockGenerateStream.mockResolvedValue(undefined);

      await generateCompletionStream('chiro-no-sft-dpo-v6', 'test prompt', fakeRes);
      expect(mockGenerateStream).toHaveBeenCalledWith(
        'chiro-no-sft-dpo-v6',
        'test prompt',
        fakeRes
      );
    });
  });
});
