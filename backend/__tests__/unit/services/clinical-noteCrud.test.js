/**
 * Unit Tests for Note CRUD Service (src/services/clinical/noteCrud.js)
 * Tests note creation, reading, updating, signing, deletion, templates, drafts, amendments
 */

import { jest } from '@jest/globals';

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
  BusinessLogicError: class BusinessLogicError extends Error {
    constructor(message, statusCode = 422) {
      super(message);
      this.statusCode = statusCode;
    }
  },
}));

const mockValidate = jest.fn();
jest.unstable_mockModule('../../../src/services/clinical/noteValidator.js', () => ({
  validate: mockValidate,
  default: { validate: mockValidate },
}));

const {
  getAllNotes,
  getNoteById,
  getPatientNotes,
  createNote,
  updateNote,
  autoSaveDraft,
  signNote,
  deleteNote,
  getNoteTemplates,
  getUserDrafts,
  getNoteHistory,
  createAmendment,
} = await import('../../../src/services/clinical/noteCrud.js');

describe('noteCrud', () => {
  const ORG_ID = 'org-1';
  const NOTE_ID = 'note-1';
  const USER_ID = 'user-1';

  beforeEach(() => {
    jest.clearAllMocks();
    mockValidate.mockReturnValue({
      valid: true,
      canSave: true,
      warnings: [],
      errors: [],
      redFlags: [],
      suggestions: [],
      completenessScore: 80,
    });
  });

  // ===========================================================================
  // getAllNotes
  // ===========================================================================
  describe('getAllNotes', () => {
    it('should return paginated notes', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '2' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'n1' }, { id: 'n2' }] });

      const result = await getAllNotes(ORG_ID);
      expect(result.notes).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });

    it('should apply patientId filter', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'n1' }] });

      await getAllNotes(ORG_ID, { patientId: 'p-1' });
      expect(mockQuery.mock.calls[0][0]).toContain('cn.patient_id');
    });

    it('should apply date range filters', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({ rows: [] });

      await getAllNotes(ORG_ID, { startDate: '2025-01-01', endDate: '2025-12-31' });
      expect(mockQuery.mock.calls[0][0]).toContain('cn.note_date >=');
      expect(mockQuery.mock.calls[0][0]).toContain('cn.note_date <=');
    });

    it('should apply search filter using search_vector', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({ rows: [] });

      await getAllNotes(ORG_ID, { search: 'back pain' });
      expect(mockQuery.mock.calls[0][0]).toContain('search_vector');
    });

    it('should throw on database error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB down'));
      await expect(getAllNotes(ORG_ID)).rejects.toThrow('DB down');
    });
  });

  // ===========================================================================
  // getNoteById
  // ===========================================================================
  describe('getNoteById', () => {
    it('should return note when found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: NOTE_ID }] });
      const result = await getNoteById(ORG_ID, NOTE_ID);
      expect(result.id).toBe(NOTE_ID);
    });

    it('should return null when not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const result = await getNoteById(ORG_ID, 'missing');
      expect(result).toBeNull();
    });
  });

  // ===========================================================================
  // createNote
  // ===========================================================================
  describe('createNote', () => {
    it('should create note when validation passes', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: NOTE_ID }] });
      const result = await createNote(
        ORG_ID,
        { patient_id: 'p-1', subjective: { chief_complaint: 'Back pain' } },
        USER_ID
      );
      expect(result.id).toBe(NOTE_ID);
    });

    it('should throw when validation fails (canSave=false)', async () => {
      mockValidate.mockReturnValue({
        valid: false,
        canSave: false,
        errors: ['Missing fields'],
        warnings: [],
        redFlags: [],
        suggestions: [],
        completenessScore: 0,
      });
      await expect(createNote(ORG_ID, {}, USER_ID)).rejects.toThrow('Validation failed');
    });

    it('should attach _validation when warnings/redFlags present', async () => {
      mockValidate.mockReturnValue({
        valid: true,
        canSave: true,
        warnings: ['Short note'],
        errors: [],
        redFlags: ['Cauda equina'],
        suggestions: [],
        completenessScore: 30,
      });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: NOTE_ID }] });

      const result = await createNote(ORG_ID, { patient_id: 'p-1' }, USER_ID);
      expect(result._validation).toBeDefined();
      expect(result._validation.redFlags).toContain('Cauda equina');
    });
  });

  // ===========================================================================
  // updateNote
  // ===========================================================================
  describe('updateNote', () => {
    it('should update draft note', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ signed_at: null, is_draft: true }] })
        .mockResolvedValueOnce({ rows: [{ id: NOTE_ID }] });

      const result = await updateNote(
        ORG_ID,
        NOTE_ID,
        { subjective: { chief_complaint: 'Updated' } },
        USER_ID
      );
      expect(result.id).toBe(NOTE_ID);
    });

    it('should return null when note not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const result = await updateNote(ORG_ID, 'missing', {}, USER_ID);
      expect(result).toBeNull();
    });

    it('should throw when note is signed', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ signed_at: '2025-01-01', is_draft: false }] });
      await expect(updateNote(ORG_ID, NOTE_ID, {}, USER_ID)).rejects.toThrow(
        'Cannot update signed note'
      );
    });

    it('should throw when no fields to update', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ signed_at: null, is_draft: true }] });
      await expect(updateNote(ORG_ID, NOTE_ID, { unknown: 'x' }, USER_ID)).rejects.toThrow(
        'No fields to update'
      );
    });
  });

  // ===========================================================================
  // signNote
  // ===========================================================================
  describe('signNote', () => {
    it('should sign unsigned note', async () => {
      mockQuery
        .mockResolvedValueOnce({
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
        })
        .mockResolvedValueOnce({ rows: [{ id: NOTE_ID, status: 'signed' }] });

      const result = await signNote(ORG_ID, NOTE_ID, USER_ID);
      expect(result.status).toBe('signed');
    });

    it('should throw when note not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(signNote(ORG_ID, 'missing', USER_ID)).rejects.toThrow('Note not found');
    });

    it('should throw when already signed', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: NOTE_ID,
            signed_at: '2025-01-01',
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
  });

  // ===========================================================================
  // deleteNote
  // ===========================================================================
  describe('deleteNote', () => {
    it('should delete draft note', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: NOTE_ID }] });
      const result = await deleteNote(ORG_ID, NOTE_ID, USER_ID);
      expect(result.deleted).toBe(true);
    });

    it('should throw when note not found or signed', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(deleteNote(ORG_ID, 'missing', USER_ID)).rejects.toThrow(
        'cannot delete signed notes'
      );
    });
  });

  // ===========================================================================
  // autoSaveDraft
  // ===========================================================================
  describe('autoSaveDraft', () => {
    it('should auto-save draft data', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: NOTE_ID, draft_saved_at: '2025-01-01' }] });
      const result = await autoSaveDraft(ORG_ID, NOTE_ID, { partial: true }, USER_ID);
      expect(result.id).toBe(NOTE_ID);
    });

    it('should throw when note not found or signed', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(autoSaveDraft(ORG_ID, NOTE_ID, {}, USER_ID)).rejects.toThrow(
        'Note not found or already signed'
      );
    });
  });

  // ===========================================================================
  // getNoteTemplates / getUserDrafts / getNoteHistory / createAmendment
  // ===========================================================================
  describe('getNoteTemplates', () => {
    it('should return active templates', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 't1' }] });
      const result = await getNoteTemplates(ORG_ID);
      expect(result).toHaveLength(1);
      expect(mockQuery.mock.calls[0][0]).toContain('is_active = true');
    });
  });

  describe('getUserDrafts', () => {
    it('should return draft notes for user', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'n1' }] });
      const result = await getUserDrafts(ORG_ID, USER_ID);
      expect(result).toHaveLength(1);
    });
  });

  describe('getNoteHistory', () => {
    it('should return amendment history', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'a1' }] });
      const result = await getNoteHistory(ORG_ID, NOTE_ID);
      expect(result).toHaveLength(1);
    });
  });

  describe('createAmendment', () => {
    it('should create amendment for signed note', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ signed_at: '2025-01-01' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'amend-1' }] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await createAmendment(
        ORG_ID,
        NOTE_ID,
        { text: 'Correction', reason: 'Error' },
        USER_ID
      );
      expect(result.id).toBe('amend-1');
    });

    it('should throw when note not signed', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ signed_at: null }] });
      await expect(
        createAmendment(ORG_ID, NOTE_ID, { text: 'x', reason: 'y' }, USER_ID)
      ).rejects.toThrow('Can only amend signed notes');
    });
  });
});
