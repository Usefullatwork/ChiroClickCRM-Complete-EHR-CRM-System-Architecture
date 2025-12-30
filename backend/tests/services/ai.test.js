/**
 * AI Service Tests
 * Unit tests for AI-powered clinical assistance
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock axios
jest.unstable_mockModule('axios', () => ({
  default: {
    post: jest.fn(),
    get: jest.fn()
  }
}));

// Mock database
jest.unstable_mockModule('../../src/config/database.js', () => ({
  query: jest.fn()
}));

// Mock logger
jest.unstable_mockModule('../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

describe('AI Service', () => {
  let aiService;
  let axios;
  let db;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Set environment variables for testing
    process.env.OLLAMA_BASE_URL = 'http://localhost:11434';
    process.env.AI_PROVIDER = 'ollama';
    process.env.AI_MODEL = 'test-model';

    axios = await import('axios');
    db = await import('../../src/config/database.js');
    aiService = await import('../../src/services/ai.js');
  });

  describe('getAIStatus', () => {
    it('should return Ollama status when available', async () => {
      axios.default.get.mockResolvedValueOnce({
        data: { models: [{ name: 'llama3.2' }, { name: 'mistral' }] }
      });

      const result = await aiService.getAIStatus();

      expect(result.provider).toBe('ollama');
      expect(result.available).toBe(true);
      expect(result.models).toHaveLength(2);
    });

    it('should return unavailable status when Ollama fails', async () => {
      axios.default.get.mockRejectedValueOnce(new Error('Connection refused'));

      const result = await aiService.getAIStatus();

      expect(result.available).toBe(false);
      expect(result.error).toBe('Connection refused');
    });
  });

  describe('spellCheckNorwegian', () => {
    it('should correct Norwegian text', async () => {
      axios.default.post.mockResolvedValueOnce({
        data: { response: 'Korrigert tekst med riktig stavemåte.' }
      });

      const result = await aiService.spellCheckNorwegian('Tekst med fiel');

      expect(result.original).toBe('Tekst med fiel');
      expect(result.corrected).toContain('Korrigert');
    });

    it('should handle errors gracefully', async () => {
      axios.default.post.mockRejectedValueOnce(new Error('AI unavailable'));

      const result = await aiService.spellCheckNorwegian('Test tekst');

      expect(result.original).toBe('Test tekst');
      expect(result.corrected).toBe('Test tekst');
      expect(result.error).toBeDefined();
    });
  });

  describe('generateSOAPSuggestions', () => {
    it('should generate subjective suggestions', async () => {
      axios.default.post.mockResolvedValueOnce({
        data: { response: '- Smerte i nedre rygg\n- Gradvis debut for 2 uker siden' }
      });

      const result = await aiService.generateSOAPSuggestions('Ryggsmerte', 'subjective');

      expect(result.section).toBe('subjective');
      expect(result.chiefComplaint).toBe('Ryggsmerte');
      expect(result.suggestion).toContain('Smerte');
    });

    it('should generate objective suggestions', async () => {
      axios.default.post.mockResolvedValueOnce({
        data: { response: '- Palpasjonsfunn: Spente paraspinale muskler' }
      });

      const result = await aiService.generateSOAPSuggestions('Ryggsmerte', 'objective');

      expect(result.section).toBe('objective');
    });

    it('should handle invalid section', async () => {
      await expect(aiService.generateSOAPSuggestions('Test', 'invalid'))
        .rejects.toThrow('Invalid section');
    });
  });

  describe('suggestDiagnosisCodes', () => {
    it('should suggest ICPC-2 codes based on SOAP data', async () => {
      // Mock diagnosis codes query
      db.query.mockResolvedValueOnce({
        rows: [
          { code: 'L03', description_no: 'Korsryggsmerter', chapter: 'L' },
          { code: 'L86', description_no: 'Degenerative forandringer', chapter: 'L' }
        ]
      });

      axios.default.post.mockResolvedValueOnce({
        data: { response: 'Basert på presentasjonen anbefaler jeg L03 - Korsryggsmerter' }
      });

      const soapData = {
        subjective: { chief_complaint: 'Ryggsmerte' },
        objective: { palpation: 'Spente muskler' },
        assessment: {}
      };

      const result = await aiService.suggestDiagnosisCodes(soapData);

      expect(result.codes).toContain('L03');
      expect(result.reasoning).toContain('L03');
    });
  });

  describe('analyzeRedFlags', () => {
    it('should analyze patient for red flags', async () => {
      axios.default.post.mockResolvedValueOnce({
        data: { response: 'Ingen akutte røde flagg identifisert. Pasienten kan behandles sikkert.' }
      });

      const patientData = { age: 45, medical_history: 'Ingen' };
      const soapData = { subjective: { chief_complaint: 'Ryggsmerte' } };

      const result = await aiService.analyzeRedFlags(patientData, soapData);

      expect(result.riskLevel).toBe('LOW');
      expect(result.canTreat).toBe(true);
      expect(result.recommendReferral).toBe(false);
    });

    it('should detect high-risk presentations', async () => {
      axios.default.post.mockResolvedValueOnce({
        data: { response: 'Pasienten bør henvises til lege for videre utredning.' }
      });

      const patientData = { age: 45, red_flags: ['Nattlige smerter'] };
      const soapData = { subjective: { chief_complaint: 'Ryggsmerte med vekttap' } };

      const result = await aiService.analyzeRedFlags(patientData, soapData);

      expect(result.riskLevel).toBe('HIGH');
      expect(result.recommendReferral).toBe(true);
    });
  });

  describe('generateClinicalSummary', () => {
    it('should generate a clinical summary', async () => {
      axios.default.post.mockResolvedValueOnce({
        data: { response: '45 år gammel pasient med akutte korsryggsmerter. Behandlet med manipulasjon.' }
      });

      const encounter = {
        id: '123',
        subjective: { chief_complaint: 'Ryggsmerte' },
        objective: { palpation: 'Spente muskler' },
        assessment: { clinical_reasoning: 'Lumbal fasettdysfunksjon' },
        plan: { treatment: 'HVLA manipulasjon' }
      };

      const result = await aiService.generateClinicalSummary(encounter);

      expect(result.summary).toContain('pasient');
      expect(result.encounterId).toBe('123');
    });
  });

  describe('learnFromOutcome', () => {
    it('should store learning data', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const result = await aiService.learnFromOutcome('123', { improvement: 80 });

      expect(result.success).toBe(true);
      expect(db.query).toHaveBeenCalled();
    });

    it('should handle storage errors', async () => {
      db.query.mockRejectedValueOnce(new Error('Database error'));

      const result = await aiService.learnFromOutcome('123', {});

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
