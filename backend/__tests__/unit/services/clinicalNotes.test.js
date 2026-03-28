/**
 * Tests for Clinical Notes Service
 * Tests SOAP documentation, signing, drafts, amendments, and formatting
 */

import { jest } from '@jest/globals';

// Mock database (named export: query)
const mockQuery = jest.fn();

jest.unstable_mockModule('../../../src/config/database.js', () => ({
  query: mockQuery,
  transaction: jest.fn(),
  getClient: jest.fn(),
  healthCheck: jest.fn().mockResolvedValue(true),
  closePool: jest.fn(),
  setTenantContext: jest.fn(),
  clearTenantContext: jest.fn(),
  queryWithTenant: jest.fn(),
  default: {
    query: mockQuery,
    transaction: jest.fn(),
    getClient: jest.fn(),
    healthCheck: jest.fn().mockResolvedValue(true),
    closePool: jest.fn(),
    setTenantContext: jest.fn(),
    clearTenantContext: jest.fn(),
    queryWithTenant: jest.fn(),
  },
}));

// Mock logger
jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock noteValidator
const mockValidate = jest.fn();
jest.unstable_mockModule('../../../src/services/noteValidator.js', () => ({
  validate: mockValidate,
  default: { validate: mockValidate },
}));

// Mock pdfkit (dynamic import in generateNotePDF)
import { EventEmitter } from 'events';

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

// Import service AFTER mocks
const {
  getAllNotes,
  getNoteById,
  getPatientNotes,
  createNote,
  updateNote,
  autoSaveDraft,
  signNote,
  deleteNote,
  generateFormattedNote,
  generateNotePDF,
  getNoteTemplates,
  getUserDrafts,
  searchNotes,
  getNoteHistory,
  createAmendment,
} = await import('../../../src/services/clinicalNotes.js');

describe('Clinical Notes Service', () => {
  const ORG_ID = 'org-test-001';
  const NOTE_ID = 'note-001';
  const USER_ID = 'user-001';
  const PATIENT_ID = 'patient-001';

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset default validate return for createNote tests
    mockValidate.mockReturnValue({
      valid: true,
      canSave: true,
      warnings: [],
      errors: [],
      redFlags: [],
      suggestions: [],
      completenessScore: 75,
    });
  });

  // ============================================================
  // getAllNotes
  // ============================================================
  describe('getAllNotes', () => {
    it('should return paginated notes with defaults', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '2' }] }) // count query
        .mockResolvedValueOnce({ rows: [{ id: 'n1' }, { id: 'n2' }] }); // data query

      const result = await getAllNotes(ORG_ID);

      expect(result.notes).toHaveLength(2);
      expect(result.pagination).toMatchObject({
        page: 1,
        limit: 20,
        total: 2,
        pages: 1,
      });
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    it('should apply patientId filter', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'n1' }] });

      await getAllNotes(ORG_ID, { patientId: PATIENT_ID });

      const countSql = mockQuery.mock.calls[0][0];
      expect(countSql).toContain('cn.patient_id = $2');
      expect(mockQuery.mock.calls[0][1]).toContain(PATIENT_ID);
    });

    it('should apply date range filters', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({ rows: [] });

      await getAllNotes(ORG_ID, {
        startDate: '2025-01-01',
        endDate: '2025-12-31',
      });

      const countSql = mockQuery.mock.calls[0][0];
      expect(countSql).toContain('cn.note_date >= $');
      expect(countSql).toContain('cn.note_date <= $');
    });

    it('should apply noteType, templateType, status filters', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({ rows: [] });

      await getAllNotes(ORG_ID, {
        noteType: 'SOAP',
        templateType: 'standard',
        status: 'signed',
      });

      const countSql = mockQuery.mock.calls[0][0];
      expect(countSql).toContain('cn.note_type = $');
      expect(countSql).toContain('cn.template_type = $');
      expect(countSql).toContain('cn.status = $');
    });

    it('should handle search filter', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({ rows: [] });

      await getAllNotes(ORG_ID, { search: 'back pain' });

      const countSql = mockQuery.mock.calls[0][0];
      expect(countSql).toContain('search_vector');
    });

    it('should throw on database error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB down'));

      await expect(getAllNotes(ORG_ID)).rejects.toThrow('DB down');
    });
  });

  // ============================================================
  // getNoteById
  // ============================================================
  describe('getNoteById', () => {
    it('should return a note when found', async () => {
      const mockNote = { id: NOTE_ID, patient_name: 'Ola Nordmann' };
      mockQuery.mockResolvedValueOnce({ rows: [mockNote] });

      const result = await getNoteById(ORG_ID, NOTE_ID);

      expect(result).toEqual(mockNote);
      expect(mockQuery.mock.calls[0][1]).toEqual([ORG_ID, NOTE_ID]);
    });

    it('should return null when note not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await getNoteById(ORG_ID, 'nonexistent');

      expect(result).toBeNull();
    });

    it('should throw on database error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Connection lost'));

      await expect(getNoteById(ORG_ID, NOTE_ID)).rejects.toThrow('Connection lost');
    });
  });

  // ============================================================
  // getPatientNotes
  // ============================================================
  describe('getPatientNotes', () => {
    it('should return notes for a patient excluding drafts by default', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'n1' }, { id: 'n2' }] });

      const result = await getPatientNotes(ORG_ID, PATIENT_ID);

      expect(result).toHaveLength(2);
      const sql = mockQuery.mock.calls[0][0];
      expect(sql).toContain('cn.is_draft = false');
    });

    it('should include drafts when option is set', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await getPatientNotes(ORG_ID, PATIENT_ID, { includesDrafts: true });

      const sql = mockQuery.mock.calls[0][0];
      expect(sql).not.toContain('cn.is_draft = false');
    });

    it('should respect limit option', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await getPatientNotes(ORG_ID, PATIENT_ID, { limit: 5 });

      expect(mockQuery.mock.calls[0][1]).toContain(5);
    });
  });

  // ============================================================
  // createNote
  // ============================================================
  describe('createNote', () => {
    const validNoteData = {
      patient_id: PATIENT_ID,
      subjective: { chief_complaint: 'Low back pain' },
      objective: { observation: 'Reduced ROM in lumbar spine' },
      assessment: { clinical_reasoning: 'Mechanical LBP' },
      plan: { treatment: 'Spinal manipulation' },
    };

    it('should create a note when validation passes', async () => {
      const createdNote = { id: NOTE_ID, ...validNoteData };
      mockQuery.mockResolvedValueOnce({ rows: [createdNote] });

      const result = await createNote(ORG_ID, validNoteData, USER_ID);

      expect(result.id).toBe(NOTE_ID);
      expect(mockValidate).toHaveBeenCalledWith(validNoteData, 'SOAP');
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('should attach validation warnings/redFlags when present', async () => {
      mockValidate.mockReturnValue({
        valid: true,
        canSave: true,
        warnings: ['Missing objective'],
        errors: [],
        redFlags: ['Cauda equina symptoms'],
        suggestions: ['Add ICPC code'],
        completenessScore: 40,
      });
      const createdNote = { id: NOTE_ID };
      mockQuery.mockResolvedValueOnce({ rows: [createdNote] });

      const result = await createNote(ORG_ID, validNoteData, USER_ID);

      expect(result._validation).toBeDefined();
      expect(result._validation.warnings).toContain('Missing objective');
      expect(result._validation.redFlags).toContain('Cauda equina symptoms');
    });

    it('should throw BusinessLogicError when validation fails (canSave=false)', async () => {
      mockValidate.mockReturnValue({
        valid: false,
        canSave: false,
        warnings: [],
        errors: ['Chief complaint missing'],
        redFlags: [],
        suggestions: [],
        completenessScore: 0,
      });

      await expect(createNote(ORG_ID, validNoteData, USER_ID)).rejects.toThrow('Validation failed');
    });

    it('should use note_type from noteData for validation', async () => {
      const noteWithType = { ...validNoteData, note_type: 'INITIAL' };
      mockQuery.mockResolvedValueOnce({ rows: [{ id: NOTE_ID }] });

      await createNote(ORG_ID, noteWithType, USER_ID);

      expect(mockValidate).toHaveBeenCalledWith(noteWithType, 'INITIAL');
    });

    it('should throw on database error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Insert failed'));

      await expect(createNote(ORG_ID, validNoteData, USER_ID)).rejects.toThrow('Insert failed');
    });
  });

  // ============================================================
  // updateNote
  // ============================================================
  describe('updateNote', () => {
    it('should update a draft note', async () => {
      // First query: check existing note
      mockQuery.mockResolvedValueOnce({
        rows: [{ signed_at: null, is_draft: true }],
      });
      // Second query: update
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: NOTE_ID, subjective: '{}' }],
      });

      const result = await updateNote(
        ORG_ID,
        NOTE_ID,
        { subjective: { chief_complaint: 'Updated' } },
        USER_ID
      );

      expect(result.id).toBe(NOTE_ID);
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    it('should return null when note not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await updateNote(ORG_ID, 'nonexistent', { subjective: {} }, USER_ID);

      expect(result).toBeNull();
    });

    it('should throw BusinessLogicError when note is signed', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ signed_at: '2025-01-01T00:00:00Z', is_draft: false }],
      });

      await expect(updateNote(ORG_ID, NOTE_ID, { subjective: {} }, USER_ID)).rejects.toThrow(
        'Cannot update signed note'
      );
    });

    it('should throw when no fields to update', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ signed_at: null, is_draft: true }],
      });

      await expect(
        updateNote(ORG_ID, NOTE_ID, { unknown_field: 'ignored' }, USER_ID)
      ).rejects.toThrow('No fields to update');
    });

    it('should JSON-stringify json fields', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ signed_at: null, is_draft: true }],
      });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: NOTE_ID }] });

      await updateNote(
        ORG_ID,
        NOTE_ID,
        {
          subjective: { chief_complaint: 'Back pain' },
          plan: { treatment: 'Manipulation' },
        },
        USER_ID
      );

      const updateParams = mockQuery.mock.calls[1][1];
      // JSON fields should be stringified
      expect(updateParams).toContain(JSON.stringify({ chief_complaint: 'Back pain' }));
      expect(updateParams).toContain(JSON.stringify({ treatment: 'Manipulation' }));
    });
  });

  // ============================================================
  // autoSaveDraft
  // ============================================================
  describe('autoSaveDraft', () => {
    it('should auto-save draft data', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: NOTE_ID, draft_saved_at: '2025-06-01T12:00:00Z' }],
      });

      const result = await autoSaveDraft(ORG_ID, NOTE_ID, { partial: true }, USER_ID);

      expect(result.id).toBe(NOTE_ID);
      const sql = mockQuery.mock.calls[0][0];
      expect(sql).toContain('auto_save_data');
      expect(sql).toContain('signed_at IS NULL');
    });

    it('should throw when note not found or already signed', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(autoSaveDraft(ORG_ID, NOTE_ID, {}, USER_ID)).rejects.toThrow(
        'Note not found or already signed'
      );
    });
  });

  // ============================================================
  // signNote
  // ============================================================
  describe('signNote', () => {
    it('should sign an unsigned note', async () => {
      // First query: fetch note for hash
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: NOTE_ID,
            organization_id: ORG_ID,
            signed_at: null,
            subjective: '{}',
            objective: '{}',
            assessment: '{}',
            plan: '{}',
            icd10_codes: [],
            icpc_codes: [],
          },
        ],
      });
      // Second query: update with signature
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: NOTE_ID, signed_at: '2025-06-01', status: 'signed' }],
      });

      const result = await signNote(ORG_ID, NOTE_ID, USER_ID);

      expect(result.status).toBe('signed');
      expect(mockQuery).toHaveBeenCalledTimes(2);
      // Verify signature hash was passed
      const updateParams = mockQuery.mock.calls[1][1];
      expect(updateParams[3]).toBeDefined(); // signature_hash
      expect(typeof updateParams[3]).toBe('string');
    });

    it('should throw when note not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(signNote(ORG_ID, NOTE_ID, USER_ID)).rejects.toThrow('Note not found');
    });

    it('should throw BusinessLogicError when note is already signed', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: NOTE_ID,
            signed_at: '2025-01-01T00:00:00Z',
            subjective: '{}',
            objective: '{}',
            assessment: '{}',
            plan: '{}',
            icd10_codes: [],
            icpc_codes: [],
          },
        ],
      });

      await expect(signNote(ORG_ID, NOTE_ID, USER_ID)).rejects.toThrow('already signed');
    });

    it('should throw when update returns empty (race condition)', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: NOTE_ID,
            signed_at: null,
            subjective: '{}',
            objective: '{}',
            assessment: '{}',
            plan: '{}',
            icd10_codes: [],
            icpc_codes: [],
          },
        ],
      });
      mockQuery.mockResolvedValueOnce({ rows: [] }); // concurrent sign

      await expect(signNote(ORG_ID, NOTE_ID, USER_ID)).rejects.toThrow('already signed');
    });
  });

  // ============================================================
  // deleteNote
  // ============================================================
  describe('deleteNote', () => {
    it('should delete a draft note', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: NOTE_ID }] });

      const result = await deleteNote(ORG_ID, NOTE_ID, USER_ID);

      expect(result).toEqual({ deleted: true, id: NOTE_ID });
      const sql = mockQuery.mock.calls[0][0];
      expect(sql).toContain('DELETE');
      expect(sql).toContain('signed_at IS NULL');
    });

    it('should throw when note not found or signed', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(deleteNote(ORG_ID, NOTE_ID, USER_ID)).rejects.toThrow(
        'Note not found or cannot delete signed notes'
      );
    });
  });

  // ============================================================
  // generateFormattedNote
  // ============================================================
  describe('generateFormattedNote', () => {
    it('should generate formatted Norwegian text', async () => {
      // getNoteById internal call
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: NOTE_ID,
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
          },
        ],
      });
      // update query for storing generated_note
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const formatted = await generateFormattedNote(ORG_ID, NOTE_ID);

      expect(formatted).toContain('KLINISK NOTAT');
      expect(formatted).toContain('Ola Nordmann');
      expect(formatted).toContain('Dr. Hansen');
      expect(formatted).toContain('HPR: HPR123');
      expect(formatted).toContain('SUBJEKTIVT (S)');
      expect(formatted).toContain('Ryggsmerter');
      expect(formatted).toContain('OBJEKTIVT (O)');
      expect(formatted).toContain('VURDERING (A)');
      expect(formatted).toContain('PLAN (P)');
      expect(formatted).toContain('VAS ved start: 7/10');
      expect(formatted).toContain('VAS ved slutt: 3/10');
      expect(formatted).toContain('L03');
      expect(formatted).toContain('M54.5');
    });

    it('should throw when note not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(generateFormattedNote(ORG_ID, 'missing')).rejects.toThrow('Note not found');
    });

    it('should include vestibular data when template is VESTIBULAR', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: NOTE_ID,
            patient_name: 'Kari Nordmann',
            practitioner_name: 'Dr. Berg',
            note_date: '2025-06-01',
            template_type: 'VESTIBULAR',
            subjective: {},
            objective: {},
            assessment: {},
            plan: {},
            vas_pain_start: null,
            vas_pain_end: null,
            icpc_codes: [],
            icd10_codes: [],
            signed_at: null,
            vestibular_data: {
              primary_diagnosis: 'BPPV',
              dhi_score: 42,
              maneuvers_performed: [{ type: 'Epley' }],
            },
          },
        ],
      });
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const formatted = await generateFormattedNote(ORG_ID, NOTE_ID);

      expect(formatted).toContain('VESTIBULAR VURDERING');
      expect(formatted).toContain('BPPV');
      expect(formatted).toContain('42/100');
      expect(formatted).toContain('Epley');
    });
  });

  // ============================================================
  // getNoteTemplates
  // ============================================================
  describe('getNoteTemplates', () => {
    it('should return active templates by default', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 't1', name: 'SOAP Standard' }] });

      const result = await getNoteTemplates(ORG_ID);

      expect(result).toHaveLength(1);
      const sql = mockQuery.mock.calls[0][0];
      expect(sql).toContain('is_active = true');
    });

    it('should include inactive templates when activeOnly is false', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await getNoteTemplates(ORG_ID, { activeOnly: false });

      const sql = mockQuery.mock.calls[0][0];
      expect(sql).not.toContain('is_active = true');
    });

    it('should filter by templateType and category', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await getNoteTemplates(ORG_ID, { templateType: 'VESTIBULAR', category: 'specialty' });

      const sql = mockQuery.mock.calls[0][0];
      expect(sql).toContain('template_type = $');
      expect(sql).toContain('category = $');
    });
  });

  // ============================================================
  // getUserDrafts
  // ============================================================
  describe('getUserDrafts', () => {
    it('should return draft notes for a practitioner', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'n1', is_draft: true, patient_name: 'Test' }],
      });

      const result = await getUserDrafts(ORG_ID, USER_ID);

      expect(result).toHaveLength(1);
      const sql = mockQuery.mock.calls[0][0];
      expect(sql).toContain('cn.is_draft = true');
      expect(sql).toContain('cn.signed_at IS NULL');
      expect(mockQuery.mock.calls[0][1]).toEqual([ORG_ID, USER_ID]);
    });

    it('should throw on database error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB error'));

      await expect(getUserDrafts(ORG_ID, USER_ID)).rejects.toThrow('DB error');
    });
  });

  // ============================================================
  // searchNotes
  // ============================================================
  describe('searchNotes', () => {
    it('should search using text search vector', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'n1', rank: 0.9 }],
      });

      const result = await searchNotes(ORG_ID, 'back pain');

      expect(result).toHaveLength(1);
      const sql = mockQuery.mock.calls[0][0];
      expect(sql).toContain('search_vector');
      expect(sql).toContain('ts_rank');
      expect(sql).toContain('ORDER BY rank DESC');
    });

    it('should filter by patientId when provided', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await searchNotes(ORG_ID, 'neck pain', { patientId: PATIENT_ID });

      const sql = mockQuery.mock.calls[0][0];
      expect(sql).toContain('cn.patient_id = $');
    });

    it('should respect limit option', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await searchNotes(ORG_ID, 'pain', { limit: 5 });

      expect(mockQuery.mock.calls[0][1]).toContain(5);
    });
  });

  // ============================================================
  // getNoteHistory
  // ============================================================
  describe('getNoteHistory', () => {
    it('should return amendment history', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'a1',
            version: 1,
            amendment_text: 'Added diagnosis',
            amended_by_name: 'Dr. Hansen',
          },
        ],
      });

      const result = await getNoteHistory(ORG_ID, NOTE_ID);

      expect(result).toHaveLength(1);
      expect(result[0].amendment_text).toBe('Added diagnosis');
      expect(mockQuery.mock.calls[0][1]).toEqual([ORG_ID, NOTE_ID]);
    });

    it('should return empty array when no amendments', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await getNoteHistory(ORG_ID, NOTE_ID);

      expect(result).toEqual([]);
    });
  });

  // ============================================================
  // createAmendment
  // ============================================================
  describe('createAmendment', () => {
    it('should create amendment for a signed note', async () => {
      // First: check note is signed
      mockQuery.mockResolvedValueOnce({
        rows: [{ signed_at: '2025-01-01T00:00:00Z' }],
      });
      // Second: insert amendment
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'amend-1', note_id: NOTE_ID, amendment_text: 'Correction' }],
      });
      // Third: update note has_amendments flag
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await createAmendment(
        ORG_ID,
        NOTE_ID,
        {
          text: 'Correction',
          reason: 'Error in diagnosis',
        },
        USER_ID
      );

      expect(result.id).toBe('amend-1');
      expect(mockQuery).toHaveBeenCalledTimes(3);
    });

    it('should throw when note not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(
        createAmendment(ORG_ID, 'missing', { text: 'x', reason: 'y' }, USER_ID)
      ).rejects.toThrow('Note not found');
    });

    it('should throw BusinessLogicError when note is not signed', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ signed_at: null }],
      });

      await expect(
        createAmendment(ORG_ID, NOTE_ID, { text: 'x', reason: 'y' }, USER_ID)
      ).rejects.toThrow('Can only amend signed notes');
    });
  });

  // ============================================================
  // generateNotePDF
  // ============================================================
  describe('generateNotePDF', () => {
    it('should generate a PDF buffer', async () => {
      // getNoteById internal query
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: NOTE_ID,
            patient_name: 'Ola Nordmann',
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

      const pdfBuffer = await generateNotePDF(ORG_ID, NOTE_ID);

      expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
    });

    it('should throw when note not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(generateNotePDF(ORG_ID, 'missing')).rejects.toThrow('Note not found');
    });
  });
});
