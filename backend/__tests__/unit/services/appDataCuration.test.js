/**
 * Unit Tests for Application Data Curation (application/services/dataCuration.js)
 * Tests hash function, prompt builder, JSONL export
 */

import { jest } from '@jest/globals';

jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

const mockQuery = jest.fn();
jest.unstable_mockModule('../../../src/config/database.js', () => ({
  query: mockQuery,
  default: { query: mockQuery },
}));

// Mock fs/promises
const mockMkdir = jest.fn().mockResolvedValue(undefined);
const mockWriteFile = jest.fn().mockResolvedValue(undefined);
jest.unstable_mockModule('fs/promises', () => ({
  default: { mkdir: mockMkdir, writeFile: mockWriteFile },
  mkdir: mockMkdir,
  writeFile: mockWriteFile,
}));

const { hashTrainingData, buildPromptFromContext, exportFeedbackToTrainingFormat } =
  await import('../../../src/application/services/dataCuration.js');

describe('Application Data Curation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================================================
  // HASH TRAINING DATA
  // ===========================================================================

  describe('hashTrainingData', () => {
    it('should return a hex string for any input', () => {
      const result = hashTrainingData('test data');

      expect(typeof result).toBe('string');
      expect(result).toMatch(/^[0-9a-f]+$/);
    });

    it('should return consistent hash for same input', () => {
      const hash1 = hashTrainingData('consistent input');
      const hash2 = hashTrainingData('consistent input');

      expect(hash1).toBe(hash2);
    });

    it('should return different hash for different input', () => {
      const hash1 = hashTrainingData('input A');
      const hash2 = hashTrainingData('input B');

      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty string', () => {
      const result = hashTrainingData('');

      expect(typeof result).toBe('string');
      expect(result).toBe('0');
    });

    it('should handle long input', () => {
      const longInput = 'x'.repeat(10000);
      const result = hashTrainingData(longInput);

      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle Norwegian characters', () => {
      const result = hashTrainingData('Kiropraktor øvelse å behandle');

      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // BUILD PROMPT FROM CONTEXT
  // ===========================================================================

  describe('buildPromptFromContext', () => {
    it('should build subjective SOAP prompt', () => {
      const result = buildPromptFromContext('soap_subjective', {
        chiefComplaint: 'Korsryggsmerter',
      });

      expect(result).toContain('Korsryggsmerter');
      expect(result).toContain('subjektiv');
    });

    it('should build objective SOAP prompt', () => {
      const result = buildPromptFromContext('soap_objective', {
        findings: 'SLR positiv',
      });

      expect(result).toContain('SLR positiv');
    });

    it('should build assessment prompt', () => {
      const result = buildPromptFromContext('soap_assessment', {
        symptoms: 'Lumbalgi',
      });

      expect(result).toContain('Lumbalgi');
    });

    it('should build plan prompt', () => {
      const result = buildPromptFromContext('soap_plan', {
        diagnosis: 'Prolaps L4/L5',
      });

      expect(result).toContain('Prolaps L4/L5');
    });

    it('should build SMS reminder prompt', () => {
      const result = buildPromptFromContext('sms_reminder', { tone: 'vennlig' });

      expect(result).toContain('vennlig');
      expect(result).toContain('SMS');
    });

    it('should build SMS followup prompt', () => {
      const result = buildPromptFromContext('sms_followup', { tone: 'empatisk' });

      expect(result).toContain('empatisk');
    });

    it('should build clinical phrase prompt', () => {
      const result = buildPromptFromContext('clinical_phrase', {
        phraseType: 'leddmobilisering',
      });

      expect(result).toContain('leddmobilisering');
    });

    it('should build vestibular documentation prompt', () => {
      const result = buildPromptFromContext('vestibular_documentation', {
        tests: 'Dix-Hallpike',
      });

      expect(result).toContain('Dix-Hallpike');
    });

    it('should handle unknown type with JSON fallback', () => {
      const result = buildPromptFromContext('unknown_type', { foo: 'bar' });

      expect(result).toContain('unknown_type');
      expect(result).toContain('bar');
    });

    it('should handle null context', () => {
      const result = buildPromptFromContext('soap_subjective', null);

      expect(result).toContain('ikke spesifisert');
    });

    it('should use defaults when context fields are missing', () => {
      const result = buildPromptFromContext('sms_reminder', {});

      expect(result).toContain('vennlig'); // default tone
    });
  });

  // ===========================================================================
  // EXPORT FEEDBACK TO TRAINING FORMAT
  // ===========================================================================

  describe('exportFeedbackToTrainingFormat', () => {
    it('should export accepted feedback as training examples', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'fb-1',
            suggestion_type: 'soap_subjective',
            original_suggestion: 'AI generated text',
            user_correction: null,
            accepted: true,
            correction_type: null,
            user_rating: 4,
            context_data: { chiefComplaint: 'Test' },
            confidence_score: 0.9,
          },
        ],
      });

      const result = await exportFeedbackToTrainingFormat({ minRating: 3, days: 30 });

      expect(result.examplesCount).toBe(1);
      expect(result.breakdown.accepted).toBe(1);
      expect(result.processedFeedbackIds).toContain('fb-1');
      expect(mockWriteFile).toHaveBeenCalledTimes(1);
    });

    it('should prefer user correction over original when available', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'fb-2',
            suggestion_type: 'soap_subjective',
            original_suggestion: 'Original',
            user_correction: 'Corrected text',
            accepted: true,
            correction_type: 'minor',
            user_rating: 5,
            context_data: {},
            confidence_score: 0.8,
          },
        ],
      });

      const result = await exportFeedbackToTrainingFormat();

      expect(result.breakdown.corrected).toBe(1);
    });

    it('should include rejected feedback when includeRejected is true', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'fb-3',
            suggestion_type: 'sms_reminder',
            original_suggestion: 'Bad suggestion',
            user_correction: null,
            accepted: false,
            correction_type: null,
            user_rating: 1,
            context_data: {},
            confidence_score: 0.5,
          },
        ],
      });

      const result = await exportFeedbackToTrainingFormat({ includeRejected: true });

      expect(result.breakdown.rejected).toBe(1);
    });

    it('should handle empty feedback result', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await exportFeedbackToTrainingFormat();

      expect(result.examplesCount).toBe(0);
      expect(result.processedFeedbackIds).toEqual([]);
    });

    it('should create output directory and write JSONL file', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'fb-4',
            suggestion_type: 'soap_plan',
            original_suggestion: 'Treatment plan',
            user_correction: null,
            accepted: true,
            correction_type: null,
            user_rating: 4,
            context_data: { diagnosis: 'L84' },
            confidence_score: 0.85,
          },
        ],
      });

      const result = await exportFeedbackToTrainingFormat();

      expect(mockMkdir).toHaveBeenCalledTimes(2); // training dir + feedback subdir
      expect(result.outputPath).toContain('feedback_');
      expect(result.outputPath).toContain('.jsonl');
    });

    it('should handle mixed feedback types', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'fb-5',
            suggestion_type: 'soap_subjective',
            original_suggestion: 'A',
            user_correction: null,
            accepted: true,
            correction_type: null,
            user_rating: 4,
            context_data: {},
            confidence_score: 0.9,
          },
          {
            id: 'fb-6',
            suggestion_type: 'soap_objective',
            original_suggestion: 'B',
            user_correction: 'B corrected',
            accepted: true,
            correction_type: 'minor',
            user_rating: 5,
            context_data: {},
            confidence_score: 0.85,
          },
          {
            id: 'fb-7',
            suggestion_type: 'sms_reminder',
            original_suggestion: 'C',
            user_correction: null,
            accepted: false,
            correction_type: null,
            user_rating: 2,
            context_data: {},
            confidence_score: 0.4,
          },
        ],
      });

      const result = await exportFeedbackToTrainingFormat({ includeRejected: true });

      expect(result.examplesCount).toBe(3);
      expect(result.breakdown.accepted).toBe(1);
      expect(result.breakdown.corrected).toBe(1);
      expect(result.breakdown.rejected).toBe(1);
    });
  });
});
