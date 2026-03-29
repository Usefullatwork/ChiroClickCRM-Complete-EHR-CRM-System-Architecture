/**
 * Unit Tests for Journal Prompts Service
 * Tests old journal organization, batch processing, and note merging
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

const mockIsAIAvailable = jest.fn();
const mockExtractCompletionText = jest.fn();
const mockGenerateCompletion = jest.fn();

jest.unstable_mockModule('../../../src/services/ai/promptShared.js', () => ({
  isAIAvailable: mockIsAIAvailable,
  extractCompletionText: mockExtractCompletionText,
  AI_MODEL: 'chiro-no-sft-dpo-v6',
  generateCompletion: mockGenerateCompletion,
}));

jest.unstable_mockModule('../../../src/services/ai/systemPrompts.js', () => ({
  JOURNAL_ORGANIZATION_PROMPT: 'mock-journal-prompt',
  MERGE_NOTES_PROMPT: 'mock-merge-prompt',
}));

const { organizeOldJournalNotes, organizeMultipleNotes, mergeOrganizedNotes } =
  await import('../../../src/services/ai/journalPrompts.js');

describe('Journal Prompts Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================================================
  // ORGANIZE OLD JOURNAL NOTES
  // ===========================================================================

  describe('organizeOldJournalNotes', () => {
    it('should return failure when AI is unavailable', async () => {
      mockIsAIAvailable.mockReturnValue(false);

      const result = await organizeOldJournalNotes('note content');

      expect(result.success).toBe(false);
      expect(result.aiAvailable).toBe(false);
      expect(result.organizedData).toBeNull();
    });

    it('should organize notes and parse valid JSON response', async () => {
      mockIsAIAvailable.mockReturnValue(true);
      const organizedJson = {
        structured_data: { dates: ['2026-01-01'] },
        soap: { subjective: { chief_complaint: 'Ryggsmerte' } },
        actionable_items: [],
        tags: ['follow_up'],
        confidence_score: 0.85,
      };
      mockGenerateCompletion.mockResolvedValue({});
      mockExtractCompletionText.mockReturnValue(JSON.stringify(organizedJson));

      const result = await organizeOldJournalNotes('Old unstructured note');

      expect(result.success).toBe(true);
      expect(result.organizedData.soap.subjective.chief_complaint).toBe('Ryggsmerte');
      expect(result.aiAvailable).toBe(true);
      expect(result.model).toBe('chiro-no-sft-dpo-v6');
    });

    it('should handle invalid JSON response with fallback structure', async () => {
      mockIsAIAvailable.mockReturnValue(true);
      mockGenerateCompletion.mockResolvedValue({});
      mockExtractCompletionText.mockReturnValue('Not valid JSON at all');

      const result = await organizeOldJournalNotes('Some note');

      expect(result.success).toBe(true);
      expect(result.organizedData.structured_data.parsing_error).toBe(true);
      expect(result.organizedData.confidence_score).toBe(0.3);
    });

    it('should include patient context in prompt', async () => {
      mockIsAIAvailable.mockReturnValue(true);
      mockGenerateCompletion.mockResolvedValue({});
      mockExtractCompletionText.mockReturnValue('{}');

      await organizeOldJournalNotes('note', {
        first_name: 'Ola',
        last_name: 'Nordmann',
        age: 45,
        medical_history: 'Prolaps L4/L5',
      });

      const promptArg = mockGenerateCompletion.mock.calls[0][0];
      expect(promptArg).toContain('Ola');
      expect(promptArg).toContain('Nordmann');
      expect(promptArg).toContain('45');
    });

    it('should handle AI generation error', async () => {
      mockIsAIAvailable.mockReturnValue(true);
      mockGenerateCompletion.mockRejectedValue(new Error('Connection refused'));

      const result = await organizeOldJournalNotes('note');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Connection refused');
      expect(result.aiAvailable).toBe(false);
    });

    it('should extract JSON from markdown code block response', async () => {
      mockIsAIAvailable.mockReturnValue(true);
      mockGenerateCompletion.mockResolvedValue({});
      const jsonBlock = '```json\n{"soap":{"subjective":{"chief_complaint":"Test"}}}\n```';
      mockExtractCompletionText.mockReturnValue(jsonBlock);

      const result = await organizeOldJournalNotes('note');

      expect(result.success).toBe(true);
      expect(result.organizedData.soap.subjective.chief_complaint).toBe('Test');
    });
  });

  // ===========================================================================
  // ORGANIZE MULTIPLE NOTES
  // ===========================================================================

  describe('organizeMultipleNotes', () => {
    it('should return all failed when AI is unavailable', async () => {
      mockIsAIAvailable.mockReturnValue(false);

      const notes = [
        { id: 'n-1', content: 'Note 1' },
        { id: 'n-2', content: 'Note 2' },
      ];
      const result = await organizeMultipleNotes(notes);

      expect(result.totalNotes).toBe(2);
      expect(result.successfullyProcessed).toBe(0);
      expect(result.results[0].error).toBe('AI is disabled');
      expect(result.aiAvailable).toBe(false);
    });

    it('should process each note sequentially', async () => {
      mockIsAIAvailable.mockReturnValue(true);
      mockGenerateCompletion.mockResolvedValue({});
      mockExtractCompletionText.mockReturnValue('{"soap":{}}');

      const notes = [
        { id: 'n-1', content: 'First note', filename: 'note1.txt' },
        { id: 'n-2', content: 'Second note', filename: 'note2.txt' },
      ];

      const result = await organizeMultipleNotes(notes, { first_name: 'Test' });

      expect(result.totalNotes).toBe(2);
      expect(result.successfullyProcessed).toBe(2);
      expect(result.results[0].noteId).toBe('n-1');
      expect(result.results[1].noteId).toBe('n-2');
    });

    it('should track individual note errors without stopping batch', async () => {
      mockIsAIAvailable.mockReturnValue(true);
      mockGenerateCompletion.mockRejectedValueOnce(new Error('Timeout')).mockResolvedValueOnce({});
      mockExtractCompletionText.mockReturnValue('{}');

      const notes = [
        { id: 'n-1', content: 'Bad note' },
        { id: 'n-2', content: 'Good note' },
      ];

      const result = await organizeMultipleNotes(notes);

      expect(result.totalNotes).toBe(2);
      expect(result.results[0].success).toBe(false);
      expect(result.results[1].success).toBe(true);
    });

    it('should handle notes without id or filename', async () => {
      mockIsAIAvailable.mockReturnValue(true);
      mockGenerateCompletion.mockResolvedValue({});
      mockExtractCompletionText.mockReturnValue('{}');

      const notes = [{ content: 'content only' }];
      const result = await organizeMultipleNotes(notes);

      expect(result.results[0].noteId).toBeNull();
      expect(result.results[0].filename).toBeNull();
    });

    it('should count only successful notes', async () => {
      mockIsAIAvailable.mockReturnValue(true);
      mockGenerateCompletion
        .mockRejectedValueOnce(new Error('Fail'))
        .mockRejectedValueOnce(new Error('Fail'))
        .mockResolvedValueOnce({});
      mockExtractCompletionText.mockReturnValue('{}');

      const notes = [
        { id: '1', content: 'a' },
        { id: '2', content: 'b' },
        { id: '3', content: 'c' },
      ];

      const result = await organizeMultipleNotes(notes);

      expect(result.successfullyProcessed).toBe(1);
    });
  });

  // ===========================================================================
  // MERGE ORGANIZED NOTES
  // ===========================================================================

  describe('mergeOrganizedNotes', () => {
    it('should return failure when AI is unavailable', async () => {
      mockIsAIAvailable.mockReturnValue(false);

      const result = await mergeOrganizedNotes([{ soap: {} }]);

      expect(result.success).toBe(false);
      expect(result.aiAvailable).toBe(false);
      expect(result.error).toBe('AI is disabled');
    });

    it('should merge notes and return date range', async () => {
      mockIsAIAvailable.mockReturnValue(true);
      mockGenerateCompletion.mockResolvedValue({});
      mockExtractCompletionText.mockReturnValue('Samlet SOAP-notat for pasienten...');

      const notes = [
        { soap: {}, suggested_date: '2025-01-01' },
        { soap: {}, suggested_date: '2025-06-15' },
        { soap: {}, suggested_date: '2025-03-10' },
      ];

      const result = await mergeOrganizedNotes(notes, { first_name: 'Ola' });

      expect(result.success).toBe(true);
      expect(result.mergedNote).toBe('Samlet SOAP-notat for pasienten...');
      expect(result.sourceNotesCount).toBe(3);
      expect(result.dateRange.earliest).toBe('2025-01-01');
      expect(result.dateRange.latest).toBe('2025-06-15');
      expect(result.aiAvailable).toBe(true);
    });

    it('should handle AI error during merge', async () => {
      mockIsAIAvailable.mockReturnValue(true);
      mockGenerateCompletion.mockRejectedValue(new Error('Model overloaded'));

      const result = await mergeOrganizedNotes([{ soap: {} }]);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Model overloaded');
    });

    it('should handle notes without dates', async () => {
      mockIsAIAvailable.mockReturnValue(true);
      mockGenerateCompletion.mockResolvedValue({});
      mockExtractCompletionText.mockReturnValue('Merged content');

      const notes = [{ soap: {} }, { soap: {} }];
      const result = await mergeOrganizedNotes(notes);

      expect(result.dateRange.earliest).toBeFalsy();
      expect(result.dateRange.latest).toBeFalsy();
    });
  });
});
