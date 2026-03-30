/**
 * Unit Tests for Note Formatting (src/services/clinical/noteFormatting.js)
 * Tests formatted note generation and PDF generation
 */

import { jest } from '@jest/globals';
import { EventEmitter } from 'events';

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

jest.unstable_mockModule('../../../src/utils/errors.js', () => ({
  BusinessLogicError: class extends Error {
    constructor(msg) {
      super(msg);
      this.statusCode = 422;
    }
  },
}));

const mockValidate = jest
  .fn()
  .mockReturnValue({
    valid: true,
    canSave: true,
    warnings: [],
    errors: [],
    redFlags: [],
    suggestions: [],
    completenessScore: 80,
  });
jest.unstable_mockModule('../../../src/services/clinical/noteValidator.js', () => ({
  validate: mockValidate,
  default: { validate: mockValidate },
}));

class MockPDFDocument extends EventEmitter {
  constructor() {
    super();
    this.fontSize = jest.fn().mockReturnThis();
    this.font = jest.fn().mockReturnThis();
    this.fillColor = jest.fn().mockReturnThis();
    this.text = jest.fn().mockReturnThis();
    this.moveDown = jest.fn().mockReturnThis();
    this.moveTo = jest.fn().mockReturnThis();
    this.lineTo = jest.fn().mockReturnThis();
    this.stroke = jest.fn().mockReturnThis();
    this.rect = jest.fn().mockReturnThis();
    this.switchToPage = jest.fn().mockReturnThis();
    this.bufferedPageRange = jest.fn().mockReturnValue({ start: 0, count: 1 });
    this.y = 100;
    this.page = { height: 842, width: 595 };
    this.end = jest.fn(() => {
      process.nextTick(() => {
        this.emit('data', Buffer.from('mock-pdf'));
        this.emit('end');
      });
    });
  }
}

jest.unstable_mockModule('pdfkit', () => ({
  default: MockPDFDocument,
}));

const { generateFormattedNote, generateNotePDF } =
  await import('../../../src/services/clinical/noteFormatting.js');

describe('noteFormatting', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================================================
  // generateFormattedNote
  // ===========================================================================
  describe('generateFormattedNote', () => {
    const mockNote = {
      id: 'note-1',
      patient_name: 'Ola Nordmann',
      practitioner_name: 'Dr. Hansen',
      hpr_number: 'HPR123',
      note_date: '2025-06-01',
      template_type: 'SOAP',
      subjective: { chief_complaint: 'Ryggsmerter' },
      objective: { observation: 'Redusert ROM' },
      assessment: { clinical_reasoning: 'Mekanisk LBP' },
      plan: { treatment: 'Manipulasjon' },
      vas_pain_start: 7,
      vas_pain_end: 3,
      icpc_codes: ['L03'],
      icd10_codes: ['M54.5'],
      signed_at: null,
      vestibular_data: null,
    };

    it('should generate formatted note with SOAP headers', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockNote] });
      mockQuery.mockResolvedValueOnce({ rows: [] }); // update generated_note

      const formatted = await generateFormattedNote('org-1', 'note-1');
      expect(formatted).toContain('KLINISK NOTAT');
      expect(formatted).toContain('Ola Nordmann');
      expect(formatted).toContain('Dr. Hansen');
      expect(formatted).toContain('SUBJEKTIVT (S)');
      expect(formatted).toContain('OBJEKTIVT (O)');
      expect(formatted).toContain('VURDERING (A)');
      expect(formatted).toContain('PLAN (P)');
    });

    it('should include VAS scores when present', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockNote] });
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const formatted = await generateFormattedNote('org-1', 'note-1');
      expect(formatted).toContain('VAS ved start: 7/10');
      expect(formatted).toContain('VAS ved slutt: 3/10');
    });

    it('should include ICPC and ICD codes', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockNote] });
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const formatted = await generateFormattedNote('org-1', 'note-1');
      expect(formatted).toContain('L03');
      expect(formatted).toContain('M54.5');
    });

    it('should include vestibular data for VESTIBULAR template', async () => {
      const vestibularNote = {
        ...mockNote,
        template_type: 'VESTIBULAR',
        vestibular_data: {
          primary_diagnosis: 'BPPV',
          dhi_score: 42,
          maneuvers_performed: [{ type: 'Epley' }],
        },
      };
      mockQuery.mockResolvedValueOnce({ rows: [vestibularNote] });
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const formatted = await generateFormattedNote('org-1', 'note-1');
      expect(formatted).toContain('VESTIBULAR VURDERING');
      expect(formatted).toContain('BPPV');
      expect(formatted).toContain('42/100');
    });

    it('should throw when note not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(generateFormattedNote('org-1', 'missing')).rejects.toThrow('Note not found');
    });

    it('should include signature block when signed', async () => {
      const signedNote = {
        ...mockNote,
        signed_at: '2025-06-01T12:00:00Z',
        signed_by_name: 'Dr. Hansen',
      };
      mockQuery.mockResolvedValueOnce({ rows: [signedNote] });
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const formatted = await generateFormattedNote('org-1', 'note-1');
      expect(formatted).toContain('Signert');
      expect(formatted).toContain('Dr. Hansen');
    });

    it('should include HPR number', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockNote] });
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const formatted = await generateFormattedNote('org-1', 'note-1');
      expect(formatted).toContain('HPR: HPR123');
    });

    it('should store generated note in database', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockNote] });
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await generateFormattedNote('org-1', 'note-1');
      expect(mockQuery).toHaveBeenCalledTimes(2);
      expect(mockQuery.mock.calls[1][0]).toContain('UPDATE clinical_notes SET generated_note');
    });
  });

  // ===========================================================================
  // generateNotePDF
  // ===========================================================================
  describe('generateNotePDF', () => {
    it('should generate a PDF buffer', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'note-1',
            patient_name: 'Ola',
            practitioner_name: 'Dr. Hansen',
            note_date: '2025-06-01',
            template_type: 'SOAP',
            subjective: '{}',
            objective: '{}',
            assessment: '{}',
            plan: '{}',
            vas_pain_start: null,
            vas_pain_end: null,
            icpc_codes: [],
            icd10_codes: [],
            signed_at: null,
            vestibular_data: null,
            date_of_birth: '1990-01-01',
            hpr_number: null,
            duration_minutes: 30,
            draft_saved_at: '2025-06-01',
            updated_at: '2025-06-01',
            signed_by_name: null,
            signature_hash: null,
            prescribed_exercises: [],
          },
        ],
      });

      const pdfBuffer = await generateNotePDF('org-1', 'note-1');
      expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
    });

    it('should throw when note not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(generateNotePDF('org-1', 'missing')).rejects.toThrow('Note not found');
    });
  });
});
