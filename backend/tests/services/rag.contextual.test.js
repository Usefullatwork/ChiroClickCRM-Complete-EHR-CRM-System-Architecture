/**
 * RAG Contextual Retrieval Tests
 * Tests contextualizeChunk: with API key (mock SDK), without API key (template fallback), SDK load failure.
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

// Mock database pool (needed by rag.js imports)
jest.unstable_mockModule('../../src/db/index.js', () => ({
  pool: { query: jest.fn(), connect: jest.fn() },
}));

// Mock embeddings service (needed by rag.js imports)
jest.unstable_mockModule('../../src/services/embeddings.js', () => ({
  embeddingsService: { embed: jest.fn(), healthCheck: jest.fn() },
  toPgVector: jest.fn(),
}));

// Shared mock for Anthropic SDK
let mockCreate;
let shouldFailImport = false;

jest.unstable_mockModule('@anthropic-ai/sdk', () => {
  if (shouldFailImport) {
    throw new Error('Cannot find module @anthropic-ai/sdk');
  }
  return {
    default: function MockAnthropic() {
      return { messages: { create: mockCreate } };
    },
    Anthropic: function MockAnthropic() {
      return { messages: { create: mockCreate } };
    },
  };
});

const { RAGService } = await import('../../src/services/rag.js');

describe('RAGService.contextualizeChunk()', () => {
  let rag;

  beforeEach(() => {
    rag = new RAGService();
    mockCreate = jest.fn();
    shouldFailImport = false;
  });

  describe('without API key (template fallback)', () => {
    beforeEach(() => {
      delete process.env.CLAUDE_API_KEY;
    });

    afterEach(() => {
      delete process.env.CLAUDE_API_KEY;
    });

    it('should return raw chunk when no metadata', async () => {
      const result = await rag.contextualizeChunk('Pasient har smerter', 'Full doc text');
      expect(result).toBe('Pasient har smerter');
    });

    it('should prefix with noteType when available', async () => {
      const result = await rag.contextualizeChunk('Pasient har smerter', 'Full doc text', {
        noteType: 'clinical_encounter',
      });
      expect(result).toBe('[clinical_encounter] Pasient har smerter');
    });

    it('should include visitDate with noteType', async () => {
      const result = await rag.contextualizeChunk('Pasient har smerter', 'Full doc text', {
        noteType: 'clinical_encounter',
        visitDate: '2026-02-27',
      });
      expect(result).toBe('[clinical_encounter - 2026-02-27] Pasient har smerter');
    });

    it('should return raw chunk when only visitDate (no noteType)', async () => {
      const result = await rag.contextualizeChunk('Chunk text', 'Doc text', {
        visitDate: '2026-02-27',
      });
      expect(result).toBe('Chunk text');
    });
  });

  describe('with API key (Claude Haiku)', () => {
    beforeEach(() => {
      process.env.CLAUDE_API_KEY = 'test-key';
    });

    afterEach(() => {
      delete process.env.CLAUDE_API_KEY;
    });

    it('should prepend Claude-generated context to chunk', async () => {
      mockCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: 'Denne teksten beskriver pasientens subjektive plager.' }],
      });

      const result = await rag.contextualizeChunk(
        'Smerter i korsrygg siden forrige uke.',
        'S: Smerter i korsrygg. O: Redusert fleksjon. A: Lumbago. P: Øvelser.'
      );

      expect(result).toBe(
        'Denne teksten beskriver pasientens subjektive plager.\nSmerter i korsrygg siden forrige uke.'
      );

      // Verify SDK call
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'claude-haiku-4-5',
          max_tokens: 100,
          system: expect.arrayContaining([
            expect.objectContaining({
              type: 'text',
              cache_control: { type: 'ephemeral' },
            }),
          ]),
        })
      );
    });

    it('should truncate fullDocument to 8000 chars for system prompt', async () => {
      mockCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: 'Context' }],
      });

      const longDoc = 'A'.repeat(10000);
      await rag.contextualizeChunk('chunk', longDoc);

      const systemText = mockCreate.mock.calls[0][0].system[0].text;
      expect(systemText.length).toBe(8000);
    });

    it('should fall back to raw chunk on API error', async () => {
      mockCreate.mockRejectedValueOnce(new Error('Rate limited'));

      const result = await rag.contextualizeChunk('Chunk text', 'Doc text');
      expect(result).toBe('Chunk text');
    });

    it('should concatenate multiple text blocks from response', async () => {
      mockCreate.mockResolvedValueOnce({
        content: [
          { type: 'text', text: 'Part 1. ' },
          { type: 'text', text: 'Part 2.' },
        ],
      });

      const result = await rag.contextualizeChunk('Chunk', 'Doc');
      expect(result).toBe('Part 1. Part 2.\nChunk');
    });

    it('should filter non-text blocks from response', async () => {
      mockCreate.mockResolvedValueOnce({
        content: [
          { type: 'text', text: 'Context text' },
          { type: 'tool_use', id: 'tool_1', name: 'search' },
        ],
      });

      const result = await rag.contextualizeChunk('Chunk', 'Doc');
      expect(result).toBe('Context text\nChunk');
    });
  });
});
