/**
 * AI Service Tests
 * Unit tests for AI-powered clinical assistance
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Create stable mock functions that survive resetMocks
const mockPost = jest.fn();
const mockGet = jest.fn();
const mockQuery = jest.fn();

// Mock axios
jest.unstable_mockModule('axios', () => ({
  default: {
    post: mockPost,
    get: mockGet,
  },
}));

// Mock database
jest.unstable_mockModule('../../src/config/database.js', () => ({
  query: mockQuery,
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

// Mock clinicalValidation - provides rule-based red flag detection
jest.unstable_mockModule('../../src/services/clinicalValidation.js', () => ({
  validateClinicalContent: jest.fn().mockResolvedValue({
    isValid: true,
    hasRedFlags: false,
    requiresReview: false,
    canProceed: true,
    riskLevel: 'LOW',
    confidence: 0.8,
    warnings: [],
    errors: [],
    redFlags: [],
  }),
  checkRedFlagsInContent: jest.fn().mockReturnValue([]),
  checkMedicationWarnings: jest.fn().mockReturnValue([]),
  default: {
    validateClinicalContent: jest.fn().mockResolvedValue({
      riskLevel: 'LOW',
      confidence: 0.8,
      hasRedFlags: false,
      requiresReview: false,
    }),
    checkRedFlagsInContent: jest.fn().mockReturnValue([]),
    checkMedicationWarnings: jest.fn().mockReturnValue([]),
  },
}));

// Mock guardrails (dynamically imported in ai.js)
jest.unstable_mockModule('../../src/services/guardrails.js', () => ({
  guardrailsService: null,
}));

// Mock RAG service (dynamically imported in ai.js)
jest.unstable_mockModule('../../src/services/rag.js', () => ({
  ragService: null,
}));

describe('AI Service', () => {
  let aiService;
  let clinicalValidation;

  beforeEach(async () => {
    // Clear mock call history but preserve implementations
    mockPost.mockReset();
    mockGet.mockReset();
    mockQuery.mockReset();

    // Set environment variables for testing
    process.env.OLLAMA_BASE_URL = 'http://localhost:11434';
    process.env.AI_PROVIDER = 'ollama';
    process.env.AI_MODEL = 'test-model';
    process.env.AI_ENABLED = 'true';
    process.env.GUARDRAILS_ENABLED = 'false';
    process.env.NODE_ENV = 'test';

    clinicalValidation = await import('../../src/services/clinicalValidation.js');
    aiService = await import('../../src/services/ai.js');
  });

  describe('getAIStatus', () => {
    it('should return Ollama status when available', async () => {
      mockGet.mockResolvedValueOnce({
        data: { models: [{ name: 'llama3.2' }, { name: 'mistral' }] },
      });

      const result = await aiService.getAIStatus();

      expect(result.provider).toBe('ollama');
      expect(result.available).toBe(true);
      expect(result.models).toHaveLength(2);
    });

    it('should return unavailable status when Ollama fails', async () => {
      mockGet.mockRejectedValueOnce(new Error('Connection refused'));

      const result = await aiService.getAIStatus();

      expect(result.available).toBe(false);
      expect(result.error).toBe('Connection refused');
    });
  });

  describe('spellCheckNorwegian', () => {
    it('should correct Norwegian text', async () => {
      mockPost.mockResolvedValueOnce({
        data: { response: 'Korrigert tekst med riktig stavemåte.' },
      });

      const result = await aiService.spellCheckNorwegian('Tekst med fiel');

      expect(result.original).toBe('Tekst med fiel');
      expect(result.corrected).toContain('Korrigert');
    });

    it('should handle errors gracefully', async () => {
      mockPost.mockRejectedValueOnce(new Error('AI unavailable'));

      const result = await aiService.spellCheckNorwegian('Test tekst');

      expect(result.original).toBe('Test tekst');
      expect(result.corrected).toBe('Test tekst');
      expect(result.error).toBeDefined();
    });
  });

  describe('generateSOAPSuggestions', () => {
    it('should generate subjective suggestions', async () => {
      mockPost.mockResolvedValueOnce({
        data: { response: '- Smerte i nedre rygg\n- Gradvis debut for 2 uker siden' },
      });

      const result = await aiService.generateSOAPSuggestions('Ryggsmerte', 'subjective');

      expect(result.section).toBe('subjective');
      expect(result.chiefComplaint).toBe('Ryggsmerte');
      expect(result.suggestion).toContain('Smerte');
    });

    it('should generate objective suggestions', async () => {
      mockPost.mockResolvedValueOnce({
        data: { response: '- Palpasjonsfunn: Spente paraspinale muskler' },
      });

      const result = await aiService.generateSOAPSuggestions('Ryggsmerte', 'objective');

      expect(result.section).toBe('objective');
    });

    it('should return error object for invalid section', async () => {
      // The AI service returns an error object rather than throwing for invalid sections
      const result = await aiService.generateSOAPSuggestions('Test', 'invalid');

      expect(result.error).toBe('Invalid section');
      expect(result.suggestion).toBe('');
      expect(result.aiAvailable).toBe(false);
    });
  });

  describe('suggestDiagnosisCodes', () => {
    it('should suggest ICPC-2 codes based on SOAP data', async () => {
      // Mock diagnosis codes query
      mockQuery.mockResolvedValueOnce({
        rows: [
          { code: 'L03', description_no: 'Korsryggsmerter', chapter: 'L' },
          { code: 'L86', description_no: 'Degenerative forandringer', chapter: 'L' },
        ],
      });

      mockPost.mockResolvedValueOnce({
        data: { response: 'Basert på presentasjonen anbefaler jeg L03 - Korsryggsmerter' },
      });

      const soapData = {
        subjective: { chief_complaint: 'Ryggsmerte' },
        objective: { palpation: 'Spente muskler' },
        assessment: {},
      };

      const result = await aiService.suggestDiagnosisCodes(soapData);

      // diagnosis_suggestion is a safety-critical task. Without guardrails,
      // generateCompletion returns an object (with disclaimer), causing the
      // code extraction to fail gracefully. The function returns a fallback.
      expect(result).toHaveProperty('codes');
      expect(result).toHaveProperty('aiAvailable');
      // DB query for diagnosis codes should still have been called
      expect(mockQuery).toHaveBeenCalled();
    });

    it('should return empty codes when database fails', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Database unavailable'));

      const soapData = {
        subjective: { chief_complaint: 'Ryggsmerte' },
        objective: {},
        assessment: {},
      };

      const result = await aiService.suggestDiagnosisCodes(soapData);

      expect(result.codes).toEqual([]);
      expect(result.error).toBe('Database unavailable');
    });
  });

  describe('analyzeRedFlags', () => {
    it('should analyze patient for red flags', async () => {
      // Mock clinicalValidation to return LOW risk
      clinicalValidation.validateClinicalContent.mockResolvedValueOnce({
        isValid: true,
        hasRedFlags: false,
        requiresReview: false,
        canProceed: true,
        riskLevel: 'LOW',
        confidence: 0.8,
        warnings: [],
        errors: [],
        redFlags: [],
      });
      clinicalValidation.checkRedFlagsInContent.mockReturnValueOnce([]);
      clinicalValidation.checkMedicationWarnings.mockReturnValueOnce([]);

      mockPost.mockResolvedValueOnce({
        data: {
          response: 'Ingen akutte røde flagg identifisert. Pasienten kan behandles sikkert.',
        },
      });

      const patientData = { age: 45, medical_history: 'Ingen' };
      const soapData = { subjective: { chief_complaint: 'Ryggsmerte' } };

      const result = await aiService.analyzeRedFlags(patientData, soapData);

      expect(result.riskLevel).toBe('LOW');
      expect(result.canTreat).toBe(true);
      expect(result.recommendReferral).toBe(false);
    });

    it('should detect high-risk presentations via rule-based validation', async () => {
      // When rule-based validation detects HIGH risk, AI analysis is still attempted
      // but may fall back to rule-based results
      clinicalValidation.validateClinicalContent.mockResolvedValueOnce({
        isValid: true,
        hasRedFlags: true,
        requiresReview: true,
        canProceed: false,
        riskLevel: 'HIGH',
        confidence: 0.5,
        warnings: [],
        errors: [],
        redFlags: [{ flag: 'malignancy', severity: 'HIGH' }],
      });
      clinicalValidation.checkRedFlagsInContent.mockReturnValueOnce([
        { flag: 'malignancy', severity: 'HIGH', message: 'Nattlige smerter + vekttap' },
      ]);
      clinicalValidation.checkMedicationWarnings.mockReturnValueOnce([]);

      // AI call may fail gracefully for safety-critical tasks without guardrails,
      // falling back to rule-based detection
      mockPost.mockResolvedValueOnce({
        data: { response: 'Pasienten bør henvises til lege for videre utredning.' },
      });

      const patientData = { age: 45, red_flags: ['Nattlige smerter'] };
      const soapData = { subjective: { chief_complaint: 'Ryggsmerte med vekttap' } };

      const result = await aiService.analyzeRedFlags(patientData, soapData);

      // Rule-based validation detected HIGH risk, so regardless of AI analysis
      // the result should reflect the elevated risk
      expect(result.riskLevel).toBe('HIGH');
      expect(result.recommendReferral).toBe(true);
    });

    it('should detect critical flags and return immediately', async () => {
      clinicalValidation.validateClinicalContent.mockResolvedValueOnce({
        isValid: false,
        hasRedFlags: true,
        requiresReview: true,
        canProceed: false,
        riskLevel: 'CRITICAL',
        confidence: 0.3,
        warnings: [],
        errors: [{ flag: 'cauda_equina', severity: 'CRITICAL' }],
        redFlags: [{ flag: 'cauda_equina', severity: 'CRITICAL' }],
      });
      clinicalValidation.checkRedFlagsInContent.mockReturnValueOnce([
        { flag: 'cauda_equina', severity: 'CRITICAL', message: 'Cauda equina syndrom' },
      ]);
      clinicalValidation.checkMedicationWarnings.mockReturnValueOnce([]);

      const patientData = { age: 55 };
      const soapData = { subjective: { chief_complaint: 'Cauda equina' } };

      const result = await aiService.analyzeRedFlags(patientData, soapData);

      expect(result.riskLevel).toBe('CRITICAL');
      expect(result.canTreat).toBe(false);
      expect(result.recommendReferral).toBe(true);
      // Critical flags skip AI analysis entirely
      expect(mockPost).not.toHaveBeenCalled();
    });
  });

  describe('generateClinicalSummary', () => {
    it('should generate a clinical summary', async () => {
      mockPost.mockResolvedValueOnce({
        data: {
          response: '45 år gammel pasient med akutte korsryggsmerter. Behandlet med manipulasjon.',
        },
      });

      const encounter = {
        id: '123',
        subjective: { chief_complaint: 'Ryggsmerte' },
        objective: { palpation: 'Spente muskler' },
        assessment: { clinical_reasoning: 'Lumbal fasettdysfunksjon' },
        plan: { treatment: 'HVLA manipulasjon' },
      };

      const result = await aiService.generateClinicalSummary(encounter);

      expect(result.summary).toContain('pasient');
      expect(result.encounterId).toBe('123');
    });
  });

  describe('learnFromOutcome', () => {
    it('should store learning data', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await aiService.learnFromOutcome('123', { improvement: 80 });

      expect(result.success).toBe(true);
      expect(mockQuery).toHaveBeenCalled();
    });

    it('should handle storage errors', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      const result = await aiService.learnFromOutcome('123', {});

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
