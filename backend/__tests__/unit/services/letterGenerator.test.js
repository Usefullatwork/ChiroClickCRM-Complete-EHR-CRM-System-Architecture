/**
 * Unit Tests for Letter Generator Service
 * Tests letter generation, suggestions, CRUD, formatting, and type definitions
 */

import { jest } from '@jest/globals';

// Mock database
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

// Mock axios for Ollama API calls
const mockAxiosPost = jest.fn();
jest.unstable_mockModule('axios', () => ({
  default: {
    post: mockAxiosPost,
  },
}));

// Import after mocking
const {
  LETTER_TYPES,
  generateLetter,
  suggestLetterContent,
  getLetterTypes,
  saveLetter,
  getLetterHistory,
  updateLetterStatus,
} = await import('../../../src/services/clinical/letterGenerator.js');

describe('Letter Generator Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Re-assign default implementations after resetMocks wipes them
    mockQuery.mockResolvedValue({ rows: [] });
    mockAxiosPost.mockResolvedValue({
      data: { response: 'Generated letter content [dato] [navn]' },
    });
  });

  // ─── LETTER_TYPES constant ──────────────────────────────────────────────────

  describe('LETTER_TYPES', () => {
    it('should define all 7 letter types', () => {
      const typeIds = Object.keys(LETTER_TYPES);
      expect(typeIds).toEqual(
        expect.arrayContaining([
          'MEDICAL_CERTIFICATE',
          'UNIVERSITY_LETTER',
          'VESTIBULAR_REFERRAL',
          'HEADACHE_REFERRAL',
          'MEMBERSHIP_FREEZE',
          'CLINICAL_NOTE',
          'WORK_DECLARATION',
        ])
      );
      expect(typeIds).toHaveLength(7);
    });

    it('each type should have required metadata fields', () => {
      for (const [key, type] of Object.entries(LETTER_TYPES)) {
        expect(type).toHaveProperty('id', key);
        expect(type).toHaveProperty('name');
        expect(type).toHaveProperty('nameEn');
        expect(type).toHaveProperty('description');
        expect(type).toHaveProperty('requiredFields');
        expect(type).toHaveProperty('template');
        expect(Array.isArray(type.requiredFields)).toBe(true);
      }
    });
  });

  // ─── getLetterTypes ─────────────────────────────────────────────────────────

  describe('getLetterTypes', () => {
    it('should return an array of all letter types with expected shape', () => {
      const types = getLetterTypes();
      expect(Array.isArray(types)).toBe(true);
      expect(types).toHaveLength(7);

      for (const t of types) {
        expect(t).toHaveProperty('id');
        expect(t).toHaveProperty('name');
        expect(t).toHaveProperty('nameEn');
        expect(t).toHaveProperty('description');
        expect(t).toHaveProperty('requiredFields');
        // Should NOT expose internal template field
        expect(t).not.toHaveProperty('template');
      }
    });
  });

  // ─── generateLetter ─────────────────────────────────────────────────────────

  describe('generateLetter', () => {
    const baseData = {
      patient: { name: 'Ola Nordmann', dateOfBirth: '01.01.1990' },
      diagnosis: 'L03 Korsryggssmerter',
      purpose: 'Medisinsk dokumentasjon',
      provider: { name: 'Dr. Hansen', hprNumber: 'HPR12345' },
      clinic: { name: 'Oslo Kiropraktorklinikk' },
    };

    it('should generate a medical certificate successfully', async () => {
      mockAxiosPost.mockResolvedValue({
        data: { response: 'MEDISINSK ERKLÆRING\n[dato]\n[navn]\nInnhold her' },
      });

      const result = await generateLetter('MEDICAL_CERTIFICATE', baseData);

      expect(result.success).toBe(true);
      expect(result.letterType).toBe('MEDICAL_CERTIFICATE');
      expect(result.letterTypeName).toBe('Medisinsk erklæring');
      expect(result.content).toBeDefined();
      expect(result.rawContent).toBeDefined();
      expect(result.generatedAt).toBeDefined();
      expect(result.model).toBeDefined();
      // Verify axios was called with Ollama endpoint
      expect(mockAxiosPost).toHaveBeenCalledTimes(1);
      expect(mockAxiosPost.mock.calls[0][0]).toContain('/api/generate');
    });

    it('should throw for unknown letter type', async () => {
      await expect(generateLetter('NONEXISTENT_TYPE', baseData)).rejects.toThrow(
        'Unknown letter type: NONEXISTENT_TYPE'
      );
    });

    it('should fall back to template when AI call fails', async () => {
      mockAxiosPost.mockRejectedValue(new Error('Connection refused'));

      const result = await generateLetter('MEDICAL_CERTIFICATE', baseData);

      expect(result.success).toBe(true);
      expect(result.letterType).toBe('MEDICAL_CERTIFICATE');
      expect(result.model).toBe('template-fallback');
      expect(result.aiGenerated).toBe(false);
      expect(result.content).toBeDefined();
    });

    it('should post-process placeholders in generated content', async () => {
      mockAxiosPost.mockResolvedValue({
        data: {
          response:
            '[dato] - Pasient: [navn] [pasientnavn]\nBehandler: [behandler] [kiropraktor]\nHPR: [hpr] [hpr-nummer]\nKlinikk: [klinikk]',
        },
      });

      const result = await generateLetter('MEDICAL_CERTIFICATE', baseData);

      expect(result.success).toBe(true);
      // Placeholders should be replaced with actual data
      expect(result.content).toContain('Ola Nordmann');
      expect(result.content).toContain('Dr. Hansen');
      expect(result.content).toContain('HPR12345');
      expect(result.content).toContain('Oslo Kiropraktorklinikk');
      // [dato] should be replaced with today's date in DD.MM.YYYY format
      expect(result.content).not.toContain('[dato]');
      expect(result.content).not.toContain('[navn]');
    });

    it('should include type-specific data in prompt for vestibular referral', async () => {
      const vestibularData = {
        ...baseData,
        symptoms: 'Svimmelhet og kvalme',
        vngResults: 'Positiv Dix-Hallpike høyre',
        findings: 'Nystagmus ved posisjonsendring',
      };

      await generateLetter('VESTIBULAR_REFERRAL', vestibularData);

      const promptArg = mockAxiosPost.mock.calls[0][1].prompt;
      expect(promptArg).toContain('Svimmelhet og kvalme');
      expect(promptArg).toContain('Positiv Dix-Hallpike høyre');
    });

    it('should include type-specific data in prompt for headache referral', async () => {
      const headacheData = {
        ...baseData,
        headacheType: 'Migrene uten aura',
        frequency: '3-4 ganger per uke',
        triggers: 'Stress, lys, søvnmangel',
      };

      await generateLetter('HEADACHE_REFERRAL', headacheData);

      const promptArg = mockAxiosPost.mock.calls[0][1].prompt;
      expect(promptArg).toContain('Migrene uten aura');
      expect(promptArg).toContain('3-4 ganger per uke');
      expect(promptArg).toContain('Stress, lys, søvnmangel');
    });

    it('should include work-specific data in prompt for work declaration', async () => {
      const workData = {
        ...baseData,
        workCapacity: '50% stilling',
        restrictions: 'Ingen tunge løft over 5 kg',
      };

      await generateLetter('WORK_DECLARATION', workData);

      const promptArg = mockAxiosPost.mock.calls[0][1].prompt;
      expect(promptArg).toContain('50% stilling');
      expect(promptArg).toContain('Ingen tunge løft over 5 kg');
    });

    it('should include university-specific data in prompt', async () => {
      const uniData = {
        ...baseData,
        institution: 'Universitetet i Oslo',
        examDate: '15.06.2026',
      };

      await generateLetter('UNIVERSITY_LETTER', uniData);

      const promptArg = mockAxiosPost.mock.calls[0][1].prompt;
      expect(promptArg).toContain('Universitetet i Oslo');
      expect(promptArg).toContain('15.06.2026');
    });
  });

  // ─── suggestLetterContent ───────────────────────────────────────────────────

  describe('suggestLetterContent', () => {
    it('should return suggestions from clinical context', async () => {
      mockAxiosPost.mockResolvedValue({
        data: { response: '1. Inkluder kliniske funn\n2. Fremhev diagnose' },
      });

      const result = await suggestLetterContent({
        soap: {
          subjective: { chief_complaint: 'Ryggsmerter', history: '2 uker' },
          objective: { observation: 'Redusert ROM', palpation: 'Spenning L4-L5' },
          assessment: { clinical_reasoning: 'Mekanisk ryggsmerte' },
        },
        diagnosis: 'L03 Korsryggssmerter',
      });

      expect(result.success).toBe(true);
      expect(result.suggestion).toBeDefined();
      expect(typeof result.suggestion).toBe('string');
      expect(mockAxiosPost).toHaveBeenCalledTimes(1);
    });

    it('should return failure when AI is unavailable', async () => {
      mockAxiosPost.mockRejectedValue(new Error('Ollama offline'));

      const result = await suggestLetterContent({
        soap: { subjective: { chief_complaint: 'Test' } },
        diagnosis: 'Test',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle missing SOAP fields gracefully', async () => {
      mockAxiosPost.mockResolvedValue({
        data: { response: 'Suggestions based on limited data' },
      });

      const result = await suggestLetterContent({
        soap: {},
        diagnosis: 'L03',
      });

      expect(result.success).toBe(true);
      // Should not throw when optional SOAP fields are missing
      const promptArg = mockAxiosPost.mock.calls[0][1].prompt;
      expect(promptArg).toContain('Ikke oppgitt');
    });
  });

  // ─── saveLetter ─────────────────────────────────────────────────────────────

  describe('saveLetter', () => {
    it('should insert letter into database and return the row', async () => {
      const savedRow = {
        id: 'letter-1',
        organization_id: 'org-1',
        patient_id: 'pat-1',
        letter_type: 'MEDICAL_CERTIFICATE',
        content: 'Letter content',
      };
      mockQuery.mockResolvedValue({ rows: [savedRow] });

      const result = await saveLetter('org-1', 'pat-1', {
        letterType: 'MEDICAL_CERTIFICATE',
        content: 'Letter content',
        letterTypeName: 'Medisinsk erklæring',
        generatedAt: '2026-03-27T10:00:00Z',
        model: 'chiro-no-sft-dpo-v5',
      });

      expect(result).toEqual(savedRow);
      expect(mockQuery).toHaveBeenCalledTimes(1);
      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain('INSERT INTO generated_letters');
      expect(params[0]).toBe('org-1');
      expect(params[1]).toBe('pat-1');
      expect(params[2]).toBe('MEDICAL_CERTIFICATE');
      expect(params[3]).toBe('Letter content');
      // metadata is JSON-stringified
      expect(JSON.parse(params[4])).toHaveProperty('letterTypeName', 'Medisinsk erklæring');
    });

    it('should propagate database errors', async () => {
      mockQuery.mockRejectedValue(new Error('DB connection lost'));

      await expect(
        saveLetter('org-1', 'pat-1', {
          letterType: 'MEDICAL_CERTIFICATE',
          content: 'test',
        })
      ).rejects.toThrow('DB connection lost');
    });
  });

  // ─── getLetterHistory ───────────────────────────────────────────────────────

  describe('getLetterHistory', () => {
    it('should return letter history for a patient', async () => {
      const mockRows = [
        { id: 'l-1', letter_type: 'MEDICAL_CERTIFICATE', created_at: '2026-03-27' },
        { id: 'l-2', letter_type: 'VESTIBULAR_REFERRAL', created_at: '2026-03-26' },
      ];
      mockQuery.mockResolvedValue({ rows: mockRows });

      const result = await getLetterHistory('org-1', 'pat-1');

      expect(result).toEqual(mockRows);
      expect(result).toHaveLength(2);
      expect(mockQuery).toHaveBeenCalledTimes(1);
      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain('FROM generated_letters');
      expect(sql).toContain('ORDER BY created_at DESC');
      expect(params).toEqual(['org-1', 'pat-1']);
    });

    it('should propagate database errors', async () => {
      mockQuery.mockRejectedValue(new Error('Query timeout'));

      await expect(getLetterHistory('org-1', 'pat-1')).rejects.toThrow('Query timeout');
    });
  });

  // ─── updateLetterStatus ────────────────────────────────────────────────────

  describe('updateLetterStatus', () => {
    it('should update status in generated_letters table', async () => {
      mockQuery.mockResolvedValue({ rowCount: 1 });

      await updateLetterStatus('letter-1', 'FINALIZED', 'org-1');

      expect(mockQuery).toHaveBeenCalledTimes(1);
      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain('UPDATE generated_letters');
      expect(sql).toContain('SET status = $1');
      expect(sql).toContain('WHERE id = $2 AND organization_id = $3');
      expect(params).toEqual(['FINALIZED', 'letter-1', 'org-1']);
    });

    it('should propagate database errors', async () => {
      mockQuery.mockRejectedValue(new Error('Connection refused'));

      await expect(updateLetterStatus('letter-1', 'SENT', 'org-1')).rejects.toThrow(
        'Connection refused'
      );
    });
  });
});
