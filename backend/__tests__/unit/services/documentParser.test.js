/**
 * Unit Tests for Document Parser Service
 * Tests PDF parsing, Word parsing, SOAP extraction, chiropractic terms, and chunking
 */

import { jest } from '@jest/globals';

// ---- Mocks ----
jest.unstable_mockModule('fs', () => ({
  default: {
    readFileSync: jest.fn(),
    statSync: jest.fn(() => ({ size: 1024 })),
    readdirSync: jest.fn(() => []),
  },
  readFileSync: jest.fn(),
  statSync: jest.fn(() => ({ size: 1024 })),
  readdirSync: jest.fn(() => []),
}));

jest.unstable_mockModule('pdf-parse', () => ({
  default: jest.fn(),
}));

jest.unstable_mockModule('mammoth', () => ({
  default: {
    extractRawText: jest.fn(),
  },
}));

jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

const fs = (await import('fs')).default;
const pdfParse = (await import('pdf-parse')).default;
const mammoth = (await import('mammoth')).default;

const {
  parsePDF,
  parseWord,
  parseDocument,
  extractSOAPNotes,
  extractChiropracticTerms,
  chunkTextForTraining,
  parseDirectory,
} = await import('../../../src/services/communication/documentParser.js');

// ---- Tests ----

describe('documentParser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── parsePDF ──────────────────────────────────

  describe('parsePDF', () => {
    it('should parse a PDF and return text with metadata', async () => {
      fs.readFileSync.mockReturnValue(Buffer.from('fake-pdf'));
      pdfParse.mockResolvedValue({
        text: 'Pasientjournal for Ola',
        numpages: 3,
        info: {
          Title: 'Journal',
          Author: 'Dr. Hansen',
          Subject: null,
          Keywords: null,
          CreationDate: '2026-01-01',
        },
      });

      const result = await parsePDF('/tmp/test.pdf');

      expect(result.text).toBe('Pasientjournal for Ola');
      expect(result.numPages).toBe(3);
      expect(result.metadata.title).toBe('Journal');
      expect(result.metadata.author).toBe('Dr. Hansen');
    });

    it('should throw on parse failure', async () => {
      fs.readFileSync.mockReturnValue(Buffer.from('bad'));
      pdfParse.mockRejectedValue(new Error('Corrupt PDF'));

      await expect(parsePDF('/tmp/bad.pdf')).rejects.toThrow('Failed to parse PDF');
    });

    it('should handle PDF with no info metadata', async () => {
      fs.readFileSync.mockReturnValue(Buffer.from('pdf'));
      pdfParse.mockResolvedValue({
        text: 'Content',
        numpages: 1,
        info: {},
      });

      const result = await parsePDF('/tmp/noinfo.pdf');
      expect(result.metadata.title).toBeNull();
      expect(result.metadata.author).toBeNull();
    });
  });

  // ─── parseWord ──────────────────────────────────

  describe('parseWord', () => {
    it('should extract raw text from a Word document', async () => {
      mammoth.extractRawText.mockResolvedValue({
        value: 'This is a Word document text',
        messages: [],
      });
      fs.statSync.mockReturnValue({ size: 1024 });

      const result = await parseWord('/tmp/test.docx');

      expect(result.text).toBe('This is a Word document text');
      expect(result.metadata.fileName).toBe('test.docx');
      expect(result.metadata.size).toBe(1024);
    });

    it('should throw on extraction failure', async () => {
      mammoth.extractRawText.mockRejectedValue(new Error('Invalid docx'));

      await expect(parseWord('/tmp/bad.docx')).rejects.toThrow('Failed to parse Word document');
    });

    it('should include mammoth warning messages', async () => {
      mammoth.extractRawText.mockResolvedValue({
        value: 'Text',
        messages: [{ type: 'warning', message: 'Missing style' }],
      });
      fs.statSync.mockReturnValue({ size: 512 });

      const result = await parseWord('/tmp/warn.docx');
      expect(result.messages).toHaveLength(1);
    });
  });

  // ─── parseDocument ──────────────────────────────────

  describe('parseDocument', () => {
    it('should route .pdf to parsePDF', async () => {
      fs.readFileSync.mockReturnValue(Buffer.from('pdf'));
      pdfParse.mockResolvedValue({ text: 'PDF text', numpages: 1, info: {} });

      const result = await parseDocument('/tmp/test.pdf');
      expect(result.text).toBe('PDF text');
    });

    it('should route .docx to parseWord', async () => {
      mammoth.extractRawText.mockResolvedValue({ value: 'Word text', messages: [] });
      fs.statSync.mockReturnValue({ size: 2048 });

      const result = await parseDocument('/tmp/test.docx');
      expect(result.text).toBe('Word text');
    });

    it('should route .doc to parseWord', async () => {
      mammoth.extractRawText.mockResolvedValue({ value: 'Old Word', messages: [] });
      fs.statSync.mockReturnValue({ size: 2048 });

      const result = await parseDocument('/tmp/test.doc');
      expect(result.text).toBe('Old Word');
    });

    it('should throw for unsupported file types', async () => {
      await expect(parseDocument('/tmp/test.txt')).rejects.toThrow('Unsupported file type: .txt');
    });

    it('should throw for .csv files', async () => {
      await expect(parseDocument('/tmp/data.csv')).rejects.toThrow('Unsupported file type');
    });
  });

  // ─── extractSOAPNotes ──────────────────────────────────

  describe('extractSOAPNotes', () => {
    it('should extract all SOAP sections from text', () => {
      const text =
        'Subjective: Low back pain for 2 weeks\nObjective: Tenderness L4-L5\nAssessment: Lumbar disc herniation\nPlan: Manual therapy 2x/week';

      const result = extractSOAPNotes(text);

      expect(result.subjective).toContain('Low back pain');
      expect(result.objective).toContain('Tenderness');
      expect(result.assessment).toContain('Lumbar disc');
      expect(result.plan).toContain('Manual therapy');
    });

    it('should handle text with only some SOAP sections', () => {
      const text = 'Subjective: Headache\nPlan: Rest and hydration';

      const result = extractSOAPNotes(text);

      expect(result.subjective).toContain('Headache');
      expect(result.objective).toBeNull();
      expect(result.assessment).toBeNull();
      expect(result.plan).toContain('Rest');
    });

    it('should preserve raw text', () => {
      const text = 'Some clinical notes without SOAP format';
      const result = extractSOAPNotes(text);
      expect(result.raw).toBe(text);
    });

    it('should return null for all sections when no SOAP format', () => {
      const text = 'Random clinical notes that are not in SOAP format.';
      const result = extractSOAPNotes(text);
      expect(result.subjective).toBeNull();
      expect(result.objective).toBeNull();
      expect(result.assessment).toBeNull();
      expect(result.plan).toBeNull();
    });

    it('should handle case-insensitive SOAP headers', () => {
      const text = 'SUBJECTIVE: pain\nOBJECTIVE: findings\nassessment: diagnosis\nplan: treatment';
      const result = extractSOAPNotes(text);
      expect(result.subjective).toContain('pain');
      expect(result.plan).toContain('treatment');
    });
  });

  // ─── extractChiropracticTerms ──────────────────────────────

  describe('extractChiropracticTerms', () => {
    it('should extract Norwegian anatomical terms', () => {
      const text = 'Pasienten klager over smerter i nakke og korsrygg. Skulder er stiv.';
      const result = extractChiropracticTerms(text);

      expect(result.anatomicalTerms.map((t) => t.term)).toContain('nakke');
      expect(result.anatomicalTerms.map((t) => t.term)).toContain('korsrygg');
      expect(result.anatomicalTerms.map((t) => t.term)).toContain('skulder');
    });

    it('should extract symptoms', () => {
      const text = 'Pasienten har hodepine og stivhet i nakken. Svimmelhet rapportert.';
      const result = extractChiropracticTerms(text);

      const symptoms = result.symptoms.map((s) => s.term);
      expect(symptoms).toContain('hodepine');
      expect(symptoms).toContain('stivhet');
      expect(symptoms).toContain('svimmelhet');
    });

    it('should extract treatment terms', () => {
      const text = 'Behandling: manipulasjon av cervicale segmenter, bløtdelsbehandling av nakke.';
      const result = extractChiropracticTerms(text);

      const treatments = result.treatments.map((t) => t.term);
      expect(treatments).toContain('manipulasjon');
      expect(treatments).toContain('bløtdelsbehandling');
    });

    it('should count multiple occurrences', () => {
      const text = 'Smerte i nakke. Nakke er stiv. Smerter ved bevegelse av nakke.';
      const result = extractChiropracticTerms(text);

      const nakke = result.anatomicalTerms.find((t) => t.term === 'nakke');
      expect(nakke.count).toBe(3);
    });

    it('should sort terms by frequency', () => {
      const text = 'Smerte smerte smerte hodepine hodepine stivhet';
      const result = extractChiropracticTerms(text);

      expect(result.symptoms[0].term).toBe('smerte');
      expect(result.symptoms[0].count).toBe(3);
    });

    it('should handle text with no chiropractic terms', () => {
      const text = 'Today is a sunny day in Oslo.';
      const result = extractChiropracticTerms(text);

      expect(result.anatomicalTerms).toHaveLength(0);
      expect(result.symptoms).toHaveLength(0);
      expect(result.treatments).toHaveLength(0);
    });

    it('should detect Latin anatomical terms', () => {
      const text =
        'Cervical manipulation performed. Thoracic spine mobilized. Lumbar segment adjusted.';
      const result = extractChiropracticTerms(text);

      const terms = result.anatomicalTerms.map((t) => t.term);
      expect(terms).toContain('cervical');
      expect(terms).toContain('thoracic');
      expect(terms).toContain('lumbar');
    });
  });

  // ─── chunkTextForTraining ──────────────────────────────

  describe('chunkTextForTraining', () => {
    it('should split text into chunks of specified size', () => {
      const words = Array(100).fill('word').join(' ');
      const chunks = chunkTextForTraining(words, 30, 5);

      expect(chunks.length).toBeGreaterThan(1);
      chunks.forEach((chunk) => {
        const wordCount = chunk.split(/\s+/).length;
        expect(wordCount).toBeLessThanOrEqual(30);
      });
    });

    it('should return single chunk for short text', () => {
      const text = 'Short text here';
      const chunks = chunkTextForTraining(text, 512, 50);

      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toBe('Short text here');
    });

    it('should apply overlap between chunks', () => {
      const words = Array(100).fill('word').join(' ');
      const chunksNoOverlap = chunkTextForTraining(words, 50, 0);
      const chunksWithOverlap = chunkTextForTraining(words, 50, 10);

      expect(chunksWithOverlap.length).toBeGreaterThan(chunksNoOverlap.length);
    });

    it('should handle empty text', () => {
      const chunks = chunkTextForTraining('', 512, 50);
      expect(chunks).toHaveLength(0);
    });

    it('should use default chunk size', () => {
      const words = Array(600).fill('w').join(' ');
      const chunks = chunkTextForTraining(words);

      expect(chunks.length).toBeGreaterThan(1);
    });
  });

  // ─── parseDirectory ──────────────────────────────────

  describe('parseDirectory', () => {
    it('should return empty results for empty directory', async () => {
      fs.readdirSync.mockReturnValue([]);

      const result = await parseDirectory('/tmp/empty');
      expect(result.documents).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.errorCount).toBe(0);
    });

    it('should skip unsupported file types', async () => {
      fs.readdirSync.mockReturnValue([
        { name: 'file.txt', isDirectory: () => false, isFile: () => true },
        { name: 'file.jpg', isDirectory: () => false, isFile: () => true },
      ]);

      const result = await parseDirectory('/tmp/mixed');
      expect(result.documents).toHaveLength(0);
    });
  });
});
