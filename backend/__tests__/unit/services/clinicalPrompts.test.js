/**
 * Unit Tests for Clinical Prompts Service
 * Tests spell check, SOAP suggestions, diagnosis codes, red flags, clinical summaries, learning
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

// ── Mock clinicalValidation ──────────────────────────────────────────────────
const mockValidateClinicalContent = jest.fn();
const mockCheckRedFlagsInContent = jest.fn();
const mockCheckMedicationWarnings = jest.fn();
jest.unstable_mockModule('../../../src/services/clinical/clinicalValidation.js', () => ({
  validateClinicalContent: mockValidateClinicalContent,
  checkRedFlagsInContent: mockCheckRedFlagsInContent,
  checkMedicationWarnings: mockCheckMedicationWarnings,
}));

// ── Mock promptShared ────────────────────────────────────────────────────────
const mockIsAIAvailable = jest.fn();
const mockExtractCompletionText = jest.fn();
const mockGenerateCompletion = jest.fn();
jest.unstable_mockModule('../../../src/services/ai/promptShared.js', () => ({
  isAIAvailable: mockIsAIAvailable,
  extractCompletionText: mockExtractCompletionText,
  generateCompletion: mockGenerateCompletion,
}));

// ── Mock systemPrompts ───────────────────────────────────────────────────────
jest.unstable_mockModule('../../../src/services/ai/systemPrompts.js', () => ({
  SPELL_CHECK_PROMPT: 'mock-spell-check-prompt',
  SOAP_PROMPTS: {
    subjective: 'mock-subjective-prompt',
    objective: 'mock-objective-prompt',
    assessment: 'mock-assessment-prompt',
    plan: 'mock-plan-prompt',
  },
  buildDiagnosisPrompt: jest.fn((codes) => `mock-diagnosis-prompt with ${codes}`),
  RED_FLAG_PROMPT: 'mock-red-flag-prompt',
  CLINICAL_SUMMARY_PROMPT: 'mock-summary-prompt',
}));

// ── Import after mocking ─────────────────────────────────────────────────────
const {
  spellCheckNorwegian,
  generateSOAPSuggestions,
  suggestDiagnosisCodes,
  analyzeRedFlags,
  generateClinicalSummary,
  learnFromOutcome,
} = await import('../../../src/services/ai/clinicalPrompts.js');

describe('Clinical Prompts Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================================================
  // SPELL CHECK
  // ===========================================================================

  describe('spellCheckNorwegian', () => {
    it('should return unchanged text when AI is unavailable', async () => {
      mockIsAIAvailable.mockReturnValue(false);

      const result = await spellCheckNorwegian('test tekst');

      expect(result.original).toBe('test tekst');
      expect(result.corrected).toBe('test tekst');
      expect(result.hasChanges).toBe(false);
      expect(result.aiAvailable).toBe(false);
    });

    it('should return corrected text when AI is available', async () => {
      mockIsAIAvailable.mockReturnValue(true);
      mockGenerateCompletion.mockResolvedValue({ confidence: 0.95 });
      mockExtractCompletionText.mockReturnValue('korrigert tekst');

      const result = await spellCheckNorwegian('feil tekst');

      expect(result.corrected).toBe('korrigert tekst');
      expect(result.hasChanges).toBe(true);
      expect(result.aiAvailable).toBe(true);
      expect(result.confidence).toBe(0.95);
    });

    it('should detect no changes when corrected text matches original', async () => {
      mockIsAIAvailable.mockReturnValue(true);
      mockGenerateCompletion.mockResolvedValue({});
      mockExtractCompletionText.mockReturnValue('same text');

      const result = await spellCheckNorwegian('same text');

      expect(result.hasChanges).toBe(false);
    });

    it('should handle AI errors gracefully', async () => {
      mockIsAIAvailable.mockReturnValue(true);
      mockGenerateCompletion.mockRejectedValue(new Error('Ollama timeout'));

      const result = await spellCheckNorwegian('tekst');

      expect(result.corrected).toBe('tekst');
      expect(result.hasChanges).toBe(false);
      expect(result.aiAvailable).toBe(false);
      expect(result.error).toBe('Ollama timeout');
    });

    it('should trim whitespace from corrected text', async () => {
      mockIsAIAvailable.mockReturnValue(true);
      mockGenerateCompletion.mockResolvedValue({});
      mockExtractCompletionText.mockReturnValue('  trimmed  ');

      const result = await spellCheckNorwegian('trimmed');

      expect(result.corrected).toBe('trimmed');
    });
  });

  // ===========================================================================
  // SOAP SUGGESTIONS
  // ===========================================================================

  describe('generateSOAPSuggestions', () => {
    it('should return empty suggestion when AI is unavailable', async () => {
      mockIsAIAvailable.mockReturnValue(false);

      const result = await generateSOAPSuggestions('Korsryggsmerter', 'subjective');

      expect(result.suggestion).toBe('');
      expect(result.aiAvailable).toBe(false);
      expect(result.section).toBe('subjective');
    });

    it('should return error for invalid section', async () => {
      mockIsAIAvailable.mockReturnValue(true);

      const result = await generateSOAPSuggestions('Korsryggsmerter', 'invalid_section');

      expect(result.error).toBe('Invalid section');
      expect(result.aiAvailable).toBe(false);
    });

    it('should generate subjective SOAP suggestion', async () => {
      mockIsAIAvailable.mockReturnValue(true);
      mockGenerateCompletion.mockResolvedValue({ confidence: 0.85, metadata: { model: 'v6' } });
      mockExtractCompletionText.mockReturnValue('Pasienten rapporterer smerter...');

      const result = await generateSOAPSuggestions('Korsryggsmerter', 'subjective');

      expect(result.suggestion).toBe('Pasienten rapporterer smerter...');
      expect(result.aiAvailable).toBe(true);
      expect(result.confidence).toBe(0.85);
    });

    it('should generate objective SOAP suggestion', async () => {
      mockIsAIAvailable.mockReturnValue(true);
      mockGenerateCompletion.mockResolvedValue({});
      mockExtractCompletionText.mockReturnValue('SLR positiv venstre');

      const result = await generateSOAPSuggestions('Isjias', 'objective');

      expect(result.suggestion).toBe('SLR positiv venstre');
      expect(result.section).toBe('objective');
    });

    it('should handle AI errors gracefully for SOAP', async () => {
      mockIsAIAvailable.mockReturnValue(true);
      mockGenerateCompletion.mockRejectedValue(new Error('Model error'));

      const result = await generateSOAPSuggestions('Hodepine', 'assessment');

      expect(result.suggestion).toBe('');
      expect(result.aiAvailable).toBe(false);
      expect(result.error).toBe('Model error');
    });

    it('should default to subjective section', async () => {
      mockIsAIAvailable.mockReturnValue(true);
      mockGenerateCompletion.mockResolvedValue({});
      mockExtractCompletionText.mockReturnValue('test');

      const result = await generateSOAPSuggestions('Nakkesmerter');

      expect(result.section).toBe('subjective');
    });
  });

  // ===========================================================================
  // SUGGEST DIAGNOSIS CODES
  // ===========================================================================

  describe('suggestDiagnosisCodes', () => {
    it('should return empty result when AI is unavailable', async () => {
      mockIsAIAvailable.mockReturnValue(false);

      const result = await suggestDiagnosisCodes({});

      expect(result.codes).toEqual([]);
      expect(result.aiAvailable).toBe(false);
    });

    it('should return empty result on database error', async () => {
      mockIsAIAvailable.mockReturnValue(true);
      mockQuery.mockRejectedValueOnce(new Error('DB connection lost'));

      const result = await suggestDiagnosisCodes({});

      expect(result.codes).toEqual([]);
      expect(result.error).toBe('Database unavailable');
    });

    it('should suggest matching ICPC-2 codes from AI response', async () => {
      mockIsAIAvailable.mockReturnValue(true);
      mockQuery.mockResolvedValueOnce({
        rows: [
          { code: 'L84', description_no: 'Ryggsmerte', chapter: 'L' },
          { code: 'L86', description_no: 'Isjias', chapter: 'L' },
        ],
      });
      mockGenerateCompletion.mockResolvedValue({ confidence: 0.9 });
      mockExtractCompletionText.mockReturnValue('Foreslår L84 basert på kliniske funn.');

      const result = await suggestDiagnosisCodes({
        subjective: { chief_complaint: 'Korsryggsmerter', history: '' },
        objective: { observation: '', palpation: '' },
        assessment: { clinical_reasoning: '' },
      });

      expect(result.codes).toContain('L84');
      expect(result.codes).not.toContain('L86');
      expect(result.aiAvailable).toBe(true);
    });

    it('should return multiple codes when AI mentions them', async () => {
      mockIsAIAvailable.mockReturnValue(true);
      mockQuery.mockResolvedValueOnce({
        rows: [
          { code: 'L84', description_no: 'Ryggsmerte', chapter: 'L' },
          { code: 'L86', description_no: 'Isjias', chapter: 'L' },
        ],
      });
      mockGenerateCompletion.mockResolvedValue({});
      mockExtractCompletionText.mockReturnValue('L84 og L86 er relevante koder.');

      const result = await suggestDiagnosisCodes({
        subjective: {},
        objective: {},
        assessment: {},
      });

      expect(result.codes).toEqual(['L84', 'L86']);
    });

    it('should handle AI error during diagnosis suggestion', async () => {
      mockIsAIAvailable.mockReturnValue(true);
      mockQuery.mockResolvedValueOnce({ rows: [] });
      mockGenerateCompletion.mockRejectedValue(new Error('Timeout'));

      const result = await suggestDiagnosisCodes({
        subjective: {},
        objective: {},
        assessment: {},
      });

      expect(result.codes).toEqual([]);
      expect(result.error).toBe('Timeout');
    });
  });

  // ===========================================================================
  // ANALYZE RED FLAGS
  // ===========================================================================

  describe('analyzeRedFlags', () => {
    const patientData = {
      id: 'pat-1',
      age: 45,
      medical_history: 'ingen',
      current_medications: [],
      red_flags: [],
      contraindications: [],
    };
    const soapData = {
      subjective: { chief_complaint: 'Korsryggsmerter', history: '' },
      objective: { observation: '', ortho_tests: '' },
      assessment: { clinical_reasoning: '' },
    };

    it('should return CRITICAL when clinical validation detects critical risk', async () => {
      mockCheckRedFlagsInContent.mockReturnValue([
        { flag: 'cauda_equina', severity: 'CRITICAL', message: 'Cauda equina symptomer' },
      ]);
      mockCheckMedicationWarnings.mockReturnValue([]);
      mockValidateClinicalContent.mockResolvedValue({
        riskLevel: 'CRITICAL',
        hasRedFlags: true,
        requiresReview: true,
        confidence: 0.99,
      });
      mockIsAIAvailable.mockReturnValue(true);

      const result = await analyzeRedFlags(patientData, soapData);

      expect(result.riskLevel).toBe('CRITICAL');
      expect(result.canTreat).toBe(false);
      expect(result.recommendReferral).toBe(true);
      expect(result.requiresImmediateAction).toBe(true);
      expect(result.source).toBe('clinical_validation');
    });

    it('should return rule-based result when AI is unavailable', async () => {
      mockCheckRedFlagsInContent.mockReturnValue([]);
      mockCheckMedicationWarnings.mockReturnValue([]);
      mockValidateClinicalContent.mockResolvedValue({
        riskLevel: 'LOW',
        hasRedFlags: false,
        requiresReview: false,
        confidence: 0.8,
      });
      mockIsAIAvailable.mockReturnValue(false);

      const result = await analyzeRedFlags(patientData, soapData);

      expect(result.source).toBe('clinical_validation_only');
      expect(result.aiAvailable).toBe(false);
      expect(result.canTreat).toBe(true);
    });

    it('should escalate to HIGH when AI mentions referral keywords', async () => {
      mockCheckRedFlagsInContent.mockReturnValue([]);
      mockCheckMedicationWarnings.mockReturnValue([]);
      mockValidateClinicalContent.mockResolvedValue({
        riskLevel: 'MODERATE',
        hasRedFlags: false,
        requiresReview: false,
        confidence: 0.75,
      });
      mockIsAIAvailable.mockReturnValue(true);
      mockGenerateCompletion.mockResolvedValue({ confidence: 0.8 });
      mockExtractCompletionText.mockReturnValue('Bør henvise til lege for videre utredning');

      const result = await analyzeRedFlags(patientData, soapData);

      expect(result.riskLevel).toBe('HIGH');
      expect(result.recommendReferral).toBe(true);
      expect(result.source).toBe('combined');
    });

    it('should escalate to CRITICAL when AI mentions cauda equina', async () => {
      mockCheckRedFlagsInContent.mockReturnValue([]);
      mockCheckMedicationWarnings.mockReturnValue([]);
      mockValidateClinicalContent.mockResolvedValue({
        riskLevel: 'MODERATE',
        hasRedFlags: false,
        requiresReview: false,
        confidence: 0.7,
      });
      mockIsAIAvailable.mockReturnValue(true);
      mockGenerateCompletion.mockResolvedValue({});
      mockExtractCompletionText.mockReturnValue('Mulig cauda equina syndrom — akutt henvisning');

      const result = await analyzeRedFlags(patientData, soapData);

      expect(result.riskLevel).toBe('CRITICAL');
    });

    it('should handle AI error and fall back to clinical validation', async () => {
      mockCheckRedFlagsInContent.mockReturnValue([]);
      mockCheckMedicationWarnings.mockReturnValue([]);
      mockValidateClinicalContent.mockResolvedValue({
        riskLevel: 'LOW',
        hasRedFlags: false,
        requiresReview: false,
        confidence: 0.6,
      });
      mockIsAIAvailable.mockReturnValue(true);
      mockGenerateCompletion.mockRejectedValue(new Error('Model unavailable'));

      const result = await analyzeRedFlags(patientData, soapData);

      expect(result.source).toBe('clinical_validation_only');
      expect(result.aiAvailable).toBe(false);
      expect(result.error).toBe('Model unavailable');
    });

    it('should handle red flag check error gracefully', async () => {
      mockCheckRedFlagsInContent.mockImplementation(() => {
        throw new Error('Validation library error');
      });
      mockCheckMedicationWarnings.mockReturnValue([]);
      mockValidateClinicalContent.mockResolvedValue({
        riskLevel: 'LOW',
        hasRedFlags: false,
        requiresReview: false,
      });
      mockIsAIAvailable.mockReturnValue(false);

      const result = await analyzeRedFlags(patientData, soapData);

      expect(result).toBeDefined();
      expect(result.detectedFlags).toEqual([]);
    });
  });

  // ===========================================================================
  // CLINICAL SUMMARY
  // ===========================================================================

  describe('generateClinicalSummary', () => {
    const encounter = {
      id: 'enc-1',
      subjective: { chief_complaint: 'Korsryggsmerter', history: '' },
      objective: { observation: '', palpasjon: '', rom: '' },
      assessment: { clinical_reasoning: '' },
      icpc_codes: ['L84'],
      plan: { treatment: 'Manipulasjon', follow_up: '2 uker' },
    };

    it('should return empty summary when AI is unavailable', async () => {
      mockIsAIAvailable.mockReturnValue(false);

      const result = await generateClinicalSummary(encounter);

      expect(result.summary).toBe('');
      expect(result.encounterId).toBe('enc-1');
      expect(result.aiAvailable).toBe(false);
    });

    it('should generate clinical summary when AI is available', async () => {
      mockIsAIAvailable.mockReturnValue(true);
      mockGenerateCompletion.mockResolvedValue({ confidence: 0.85 });
      mockExtractCompletionText.mockReturnValue(
        'Pasient med korsryggsmerter behandlet med manipulasjon.'
      );

      const result = await generateClinicalSummary(encounter);

      expect(result.summary).toBe('Pasient med korsryggsmerter behandlet med manipulasjon.');
      expect(result.aiAvailable).toBe(true);
      expect(result.confidence).toBe(0.85);
    });

    it('should handle AI error for summary', async () => {
      mockIsAIAvailable.mockReturnValue(true);
      mockGenerateCompletion.mockRejectedValue(new Error('Rate limited'));

      const result = await generateClinicalSummary(encounter);

      expect(result.summary).toBe('');
      expect(result.aiAvailable).toBe(false);
      expect(result.error).toBe('Rate limited');
    });
  });

  // ===========================================================================
  // LEARN FROM OUTCOME
  // ===========================================================================

  describe('learnFromOutcome', () => {
    it('should store learning data successfully', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await learnFromOutcome('enc-1', { outcome: 'improved' });

      expect(result.success).toBe(true);
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('should handle database error gracefully', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB error'));

      const result = await learnFromOutcome('enc-1', { outcome: 'test' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('DB error');
    });

    it('should pass encounter ID and stringified outcome data to query', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await learnFromOutcome('enc-42', { rating: 5, improved: true });

      const args = mockQuery.mock.calls[0][1];
      expect(args[0]).toBe('enc-42');
      expect(args[1]).toBe(JSON.stringify({ rating: 5, improved: true }));
    });
  });
});
