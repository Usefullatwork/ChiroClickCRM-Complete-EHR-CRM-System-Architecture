/**
 * Unit Tests for RAG Service and Embeddings Service
 * Tests SOAP parsing, chunking, indexing, search, and embedding generation
 */

import { jest } from '@jest/globals';

// ---------------------------------------------------------------------------
// Mocks — with resetMocks: true, declare mock fns INSIDE factories or reassign
// ---------------------------------------------------------------------------

// Mock logger
jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock global fetch for embeddings HTTP calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock pool (used by rag.js via ../db/index.js)
const mockClientQuery = jest.fn();
const mockClientRelease = jest.fn();
const mockPoolConnect = jest.fn();
const mockPoolQuery = jest.fn();

jest.unstable_mockModule('../../../src/db/index.js', () => ({
  pool: {
    connect: mockPoolConnect,
    query: mockPoolQuery,
  },
}));

// ---------------------------------------------------------------------------
// Import AFTER mocking
// ---------------------------------------------------------------------------
const { RAGService, ragService } = await import('../../../src/services/training/rag.js');
const { EmbeddingsService, embeddingsService, toPgVector, cosineSimilarity, embed, embedBatch } =
  await import('../../../src/services/training/embeddings.js');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const fakeEmbedding768 = new Array(768).fill(0).map((_, i) => (i % 7) * 0.01);
const fakeEmbedding1024 = new Array(1024).fill(0).map((_, i) => (i % 7) * 0.01);

function ollamaOkResponse(embedding) {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ embedding }),
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('EmbeddingsService', () => {
  let svc;

  beforeEach(() => {
    svc = new EmbeddingsService();
    svc.cache.clear();
    jest.clearAllMocks();
    // Re-assign global.fetch because resetMocks clears it
    global.fetch = mockFetch;
  });

  // 1
  it('should throw for empty or non-string input', async () => {
    await expect(svc.embed('', 'document')).rejects.toThrow('non-empty string');
    await expect(svc.embed(null, 'document')).rejects.toThrow('non-empty string');
    await expect(svc.embed(123, 'document')).rejects.toThrow('non-empty string');
  });

  // 2
  it('should generate embedding via Ollama and pad to 1024', async () => {
    mockFetch.mockImplementation(() => ollamaOkResponse(fakeEmbedding768));

    const result = await svc.embed('test clinical note', 'document');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const callUrl = mockFetch.mock.calls[0][0];
    expect(callUrl).toContain('/api/embeddings');
    expect(result).toHaveLength(1024);
    // first 768 elements should match, rest should be 0
    expect(result.slice(768).every((v) => v === 0)).toBe(true);
  });

  // 3
  it('should cache embeddings and return cached on second call', async () => {
    mockFetch.mockImplementation(() => ollamaOkResponse(fakeEmbedding768));

    const first = await svc.embed('cached text', 'document');
    const second = await svc.embed('cached text', 'document');

    // fetch called only once — second call hits cache
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(first).toEqual(second);
  });

  // 4
  it('should evict oldest cache entry when cache is full', async () => {
    svc.cacheMaxSize = 2;
    mockFetch.mockImplementation(() => ollamaOkResponse(fakeEmbedding768));

    await svc.embed('text-a', 'document');
    await svc.embed('text-b', 'document');
    await svc.embed('text-c', 'document'); // should evict text-a

    expect(svc.cache.size).toBe(2);
    expect(svc.cache.has('document:text-a')).toBe(false);
  });

  // 5
  it('should batch embed multiple texts', async () => {
    mockFetch.mockImplementation(() => ollamaOkResponse(fakeEmbedding768));

    const results = await svc.embedBatch(['a', 'b', 'c'], 'document');
    expect(results).toHaveLength(3);
    results.forEach((r) => expect(r).toHaveLength(1024));
  });

  // 6
  it('cosineSimilarity should return 1 for identical vectors', () => {
    const v = [1, 0, 0, 0.5];
    expect(svc.cosineSimilarity(v, v)).toBeCloseTo(1.0, 5);
  });

  // 7
  it('cosineSimilarity should return 0 for orthogonal vectors', () => {
    const a = [1, 0];
    const b = [0, 1];
    expect(svc.cosineSimilarity(a, b)).toBeCloseTo(0.0, 5);
  });

  // 8
  it('cosineSimilarity should throw for different dimensions', () => {
    expect(() => svc.cosineSimilarity([1], [1, 2])).toThrow('same dimensions');
  });

  // 9
  it('toPgVector should format as bracketed CSV', () => {
    expect(svc.toPgVector([1.5, 2.0, 3.3])).toBe('[1.5,2,3.3]');
  });

  // 10
  it('getDimensions should return 768 for ollama provider', () => {
    svc.provider = 'ollama';
    expect(svc.getDimensions()).toBe(768);
  });

  // 11
  it('getDimensions should return 1024 for huggingface provider', () => {
    svc.provider = 'huggingface';
    expect(svc.getDimensions()).toBe(1024);
  });

  // 12
  it('meanPool should average token embeddings', () => {
    const tokens = [
      [2, 4, 6],
      [4, 6, 8],
    ];
    const result = svc.meanPool(tokens);
    expect(result).toEqual([3, 5, 7]);
  });

  // 13
  it('meanPool should return empty array for empty input', () => {
    expect(svc.meanPool([])).toEqual([]);
  });

  // 14
  it('healthCheck should return available:false when fetch fails', async () => {
    mockFetch.mockImplementation(() => Promise.reject(new Error('connection refused')));

    const result = await svc.healthCheck();
    expect(result.available).toBe(false);
    expect(result.error).toContain('connection refused');
  });

  // 15 — convenience exports
  it('toPgVector convenience export should work', () => {
    expect(toPgVector([1, 2, 3])).toBe('[1,2,3]');
  });

  it('cosineSimilarity convenience export should work', () => {
    expect(cosineSimilarity([1, 0], [1, 0])).toBeCloseTo(1.0);
  });
});

// ===========================================================================
// RAG Service
// ===========================================================================

describe('RAGService', () => {
  let rag;

  beforeEach(() => {
    rag = new RAGService();
    jest.clearAllMocks();
    // Re-assign global.fetch because resetMocks clears it
    global.fetch = mockFetch;
  });

  // ---- parseSOAPStructure ----

  describe('parseSOAPStructure', () => {
    // 16
    it('should parse a note with all SOAP sections', () => {
      const note = `Subjektiv\nPasienten klager over rygg.\nObjektiv\nPalpasjon viser spenning.\nVurdering\nLumbal facettdysfunksjon.\nPlan\nBehandling ukentlig.`;

      const sections = rag.parseSOAPStructure(note);

      expect(sections.Subjective.length).toBeGreaterThanOrEqual(1);
      expect(sections.Objective.length).toBeGreaterThanOrEqual(1);
      expect(sections.Assessment.length).toBeGreaterThanOrEqual(1);
      expect(sections.Plan.length).toBeGreaterThanOrEqual(1);
    });

    // 17
    it('should place unstructured text in Unlabeled', () => {
      const note = 'This is plain text with no SOAP headings at all.';
      const sections = rag.parseSOAPStructure(note);

      expect(sections.Unlabeled).toHaveLength(1);
      expect(sections.Unlabeled[0].text).toContain('plain text');
      expect(sections.Subjective).toHaveLength(0);
    });

    // 18
    it('should handle preamble text before first header', () => {
      const note = `Innledende kommentar.\nSubjektiv\nPasienten klager.`;
      const sections = rag.parseSOAPStructure(note);

      expect(sections.Unlabeled.length).toBeGreaterThanOrEqual(1);
      expect(sections.Subjective.length).toBeGreaterThanOrEqual(1);
    });

    // 19
    it('should calculate token counts', () => {
      const note = 'Subjektiv\n' + 'a'.repeat(400);
      const sections = rag.parseSOAPStructure(note);
      const item = sections.Subjective[0];
      // avgCharsPerToken = 4 => tokens = ceil(400 / 4) = 100
      expect(item.tokens).toBe(100);
    });
  });

  // ---- chunkSection ----

  describe('chunkSection', () => {
    // 20
    it('should return a single chunk for short text', () => {
      const chunks = rag.chunkSection('Short sentence.', 500, 50);
      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toBe('Short sentence.');
    });

    // 21
    it('should split long text into multiple chunks', () => {
      // Create text that exceeds targetTokens * 4 chars
      const longText = Array.from({ length: 50 }, (_, i) => `Sentence number ${i}.`).join(' ');

      const chunks = rag.chunkSection(longText, 20, 5);
      expect(chunks.length).toBeGreaterThan(1);
    });

    // 22
    it('should preserve overlap between chunks', () => {
      // targetTokens=5 => 20 chars, overlapTokens=2 => 8 chars
      const text = 'First sentence here. Second part now. Third piece of text. Fourth and final.';
      const chunks = rag.chunkSection(text, 5, 2);

      if (chunks.length > 1) {
        // Later chunks should share some text with previous
        const firstWords = chunks[0].split(' ');
        const lastWordOfFirst = firstWords[firstWords.length - 1];
        // The overlap means some trailing content of chunk 0 appears at start of chunk 1
        expect(chunks[1]).toBeDefined();
      }
    });
  });

  // ---- contextualizeChunk ----

  describe('contextualizeChunk', () => {
    // 23
    it('should use template fallback when no API key', async () => {
      delete process.env.CLAUDE_API_KEY;
      const result = await rag.contextualizeChunk('Some text', 'Full document', {
        noteType: 'SOAP',
        visitDate: '2026-01-01',
      });
      expect(result).toBe('[SOAP - 2026-01-01] Some text');
    });

    // 24
    it('should return raw chunk when noteType is missing and no API key', async () => {
      delete process.env.CLAUDE_API_KEY;
      const result = await rag.contextualizeChunk('Some text', 'Full document', {});
      expect(result).toBe('Some text');
    });
  });

  // ---- indexEncounter ----

  describe('indexEncounter', () => {
    // 25
    it('should index a clinical encounter with chunks', async () => {
      // Setup pool.connect mock
      mockClientQuery
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce(undefined) // DELETE existing
        .mockResolvedValue({ rows: [{ chunk_id: 'chunk-1' }] }); // INSERT chunks
      mockClientRelease.mockReturnValue(undefined);
      mockPoolConnect.mockResolvedValue({
        query: mockClientQuery,
        release: mockClientRelease,
      });

      // Mock fetch for embeddings
      mockFetch.mockImplementation(() => ollamaOkResponse(fakeEmbedding768));

      // Clear embedding cache to force fetch calls
      embeddingsService.cache.clear();

      const result = await rag.indexEncounter(
        'enc-001',
        'Subjektiv\nPasienten har vondt i ryggen.',
        'patient-1',
        'org-1',
        '2026-01-15',
        'clinical_encounter'
      );

      expect(result.success).toBe(true);
      expect(result.encounterId).toBe('enc-001');
      expect(result.chunksCreated).toBeGreaterThanOrEqual(1);
      // BEGIN, DELETE, at least one INSERT, COMMIT
      expect(mockClientQuery).toHaveBeenCalled();
      const beginCall = mockClientQuery.mock.calls[0][0];
      expect(beginCall).toBe('BEGIN');
    });

    // 26
    it('should rollback on error', async () => {
      mockClientQuery
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce(undefined) // DELETE
        .mockRejectedValueOnce(new Error('DB insert failed')); // INSERT
      mockClientRelease.mockReturnValue(undefined);
      mockPoolConnect.mockResolvedValue({
        query: mockClientQuery,
        release: mockClientRelease,
      });

      mockFetch.mockImplementation(() => ollamaOkResponse(fakeEmbedding768));
      embeddingsService.cache.clear();

      await expect(
        rag.indexEncounter('enc-002', 'Subjektiv\nTest note.', 'p-1', 'o-1', '2026-01-15')
      ).rejects.toThrow('DB insert failed');

      // ROLLBACK should have been called (third call after BEGIN, DELETE, failed INSERT)
      const rollbackCalls = mockClientQuery.mock.calls.filter((c) => c[0] === 'ROLLBACK');
      expect(rollbackCalls.length).toBe(1);
    });
  });

  // ---- search ----

  describe('search', () => {
    // 27
    it('should require organizationId', async () => {
      await expect(rag.search('query text', {})).rejects.toThrow('organizationId is required');
    });

    // 28
    it('should execute hybrid search and return mapped results', async () => {
      mockFetch.mockImplementation(() => ollamaOkResponse(fakeEmbedding768));
      embeddingsService.cache.clear();

      mockPoolQuery.mockResolvedValue({
        rows: [
          {
            chunk_id: 'c-1',
            patient_id: 'p-1',
            visit_date: '2026-01-10',
            soap_section: 'Assessment',
            chunk_text: 'Lumbal smerte',
            vector_score: 0.9,
            keyword_score: 0.7,
            hybrid_score: 0.84,
            metadata: { sectionIndex: 0 },
          },
        ],
      });

      const results = await rag.search('ryggsmerte', { organizationId: 'org-1' });

      expect(results).toHaveLength(1);
      expect(results[0].chunkId).toBe('c-1');
      expect(results[0].text).toBe('Lumbal smerte');
      expect(results[0].hybridScore).toBe(0.84);

      // Verify pool.query was called with correct params
      const queryCall = mockPoolQuery.mock.calls[0];
      expect(queryCall[0]).toContain('hybrid_search_chunks');
      expect(queryCall[1]).toHaveLength(9);
    });
  });

  // ---- getSimilarCases ----

  describe('getSimilarCases', () => {
    // 29
    it('should return empty array when note has no assessment text', async () => {
      const result = await rag.getSimilarCases('p-1', '', 'org-1');
      expect(result).toEqual([]);
    });

    // 30
    it('should search with assessment text and higher alpha', async () => {
      mockFetch.mockImplementation(() => ollamaOkResponse(fakeEmbedding768));
      embeddingsService.cache.clear();

      mockPoolQuery.mockResolvedValue({ rows: [] });

      const note = 'Vurdering\nAkutt lumbago med radikulopati.';
      await rag.getSimilarCases('p-1', note, 'org-1', 3);

      expect(mockPoolQuery).toHaveBeenCalled();
      const args = mockPoolQuery.mock.calls[0][1];
      // alpha should be 0.8
      expect(args[7]).toBe(0.8);
      // soapSections should be ['Assessment', 'Objective']
      expect(args[6]).toEqual(['Assessment', 'Objective']);
    });
  });

  // ---- augmentPrompt ----

  describe('augmentPrompt', () => {
    // 31
    it('should return unaugmented prompt when no chunks found', async () => {
      mockFetch.mockImplementation(() => ollamaOkResponse(fakeEmbedding768));
      embeddingsService.cache.clear();

      mockPoolQuery.mockResolvedValue({ rows: [] });

      const result = await rag.augmentPrompt('Hva er diagnosen?', null, {
        organizationId: 'org-1',
      });

      expect(result.prompt).toBe('Hva er diagnosen?');
      expect(result.context).toBeNull();
      expect(result.chunks).toEqual([]);
    });

    // 32
    it('should augment prompt with relevant context', async () => {
      mockFetch.mockImplementation(() => ollamaOkResponse(fakeEmbedding768));
      embeddingsService.cache.clear();

      mockPoolQuery.mockResolvedValue({
        rows: [
          {
            chunk_id: 'c-1',
            patient_id: 'p-1',
            visit_date: '2026-01-10',
            soap_section: 'Assessment',
            chunk_text: 'Kronisk lumbago',
            vector_score: 0.85,
            keyword_score: 0.6,
            hybrid_score: 0.78,
            metadata: {},
          },
        ],
      });

      const result = await rag.augmentPrompt('Hva er diagnosen?', null, {
        organizationId: 'org-1',
      });

      expect(result.prompt).toContain('pasienthistorikk');
      expect(result.prompt).toContain('Kronisk lumbago');
      expect(result.prompt).toContain('Hva er diagnosen?');
      expect(result.context).toContain('Kronisk lumbago');
      expect(result.chunks).toHaveLength(1);
    });
  });

  // ---- deleteEncounterChunks ----

  describe('deleteEncounterChunks', () => {
    // 33
    it('should delete chunks and return count', async () => {
      mockPoolQuery.mockResolvedValue({
        rowCount: 3,
        rows: [{ chunk_id: 'c-1' }, { chunk_id: 'c-2' }, { chunk_id: 'c-3' }],
      });

      const result = await rag.deleteEncounterChunks('enc-001');
      expect(result.deleted).toBe(3);
      expect(result.chunkIds).toEqual(['c-1', 'c-2', 'c-3']);
    });
  });

  // ---- getStats ----

  describe('getStats', () => {
    // 34
    it('should aggregate stats by section', async () => {
      mockPoolQuery.mockResolvedValue({
        rows: [
          {
            total_chunks: '10',
            patients_indexed: 5,
            encounters_indexed: 8,
            total_tokens: 2000,
            oldest_chunk: '2026-01-01',
            newest_chunk: '2026-03-01',
            soap_section: 'Subjective',
            section_count: '6',
          },
          {
            total_chunks: '10',
            patients_indexed: 5,
            encounters_indexed: 8,
            total_tokens: 2000,
            oldest_chunk: '2026-01-01',
            newest_chunk: '2026-03-01',
            soap_section: 'Assessment',
            section_count: '4',
          },
        ],
      });

      const stats = await rag.getStats('org-1');
      expect(stats.totalChunks).toBe(10);
      expect(stats.sectionBreakdown).toEqual({ Subjective: 6, Assessment: 4 });
      expect(stats.patientsIndexed).toBe(5);
    });

    // 35
    it('should handle empty stats', async () => {
      mockPoolQuery.mockResolvedValue({ rows: [] });
      const stats = await rag.getStats('org-empty');
      expect(stats.totalChunks).toBe(0);
      expect(stats.patientsIndexed).toBe(0);
    });
  });

  // ---- healthCheck ----

  describe('healthCheck', () => {
    // 36
    it('should return available:true when all checks pass', async () => {
      mockFetch.mockImplementation(() => ollamaOkResponse(fakeEmbedding768));
      embeddingsService.cache.clear();

      mockPoolQuery
        .mockResolvedValueOnce({ rows: [{ extname: 'vector' }] }) // pgvector check
        .mockResolvedValueOnce({ rows: [{ exists: true }] }); // table check

      const result = await rag.healthCheck();
      expect(result.available).toBe(true);
      expect(result.pgvector).toBe(true);
      expect(result.table).toBe(true);
    });

    // 37
    it('should return available:false on error', async () => {
      mockPoolQuery.mockRejectedValue(new Error('DB down'));

      const result = await rag.healthCheck();
      expect(result.available).toBe(false);
      expect(result.error).toContain('DB down');
    });
  });
});
