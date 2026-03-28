/**
 * Unit Tests for Amendments Service
 * Tests createAmendment, getEncounterAmendments, signAmendment, deleteAmendment
 */

import { jest } from '@jest/globals';

const mockQuery = jest.fn();

jest.unstable_mockModule('../../../src/config/database.js', () => ({
  query: mockQuery,
  transaction: jest.fn(),
  getClient: jest.fn(),
  default: {
    query: mockQuery,
    transaction: jest.fn(),
    getClient: jest.fn(),
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

const amendmentsModule = await import('../../../src/services/clinical/amendments.js');
const { createAmendment, getEncounterAmendments, signAmendment, deleteAmendment } =
  amendmentsModule;

const loggerModule = await import('../../../src/utils/logger.js');
const logger = loggerModule.default;

describe('Amendments Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================================================
  // createAmendment
  // ===========================================================================

  describe('createAmendment', () => {
    it('should create an amendment for a signed encounter and return the new row', async () => {
      const signedEncounter = { signed_at: '2026-01-01T10:00:00Z' };
      const newAmendment = {
        id: 'amend-001',
        encounter_id: 'enc-1',
        organization_id: 'org-1',
        author_id: 'user-1',
        amendment_type: 'ADDENDUM',
        reason: 'Missed detail',
        content: 'Patient also reported headache.',
        affected_sections: ['[]'],
      };
      mockQuery
        .mockResolvedValueOnce({ rows: [signedEncounter] })
        .mockResolvedValueOnce({ rows: [newAmendment] });

      const result = await createAmendment('org-1', 'enc-1', 'user-1', {
        amendment_type: 'ADDENDUM',
        reason: 'Missed detail',
        content: 'Patient also reported headache.',
        affected_sections: ['subjective'],
      });

      expect(result).toEqual(newAmendment);
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    it('should use ADDENDUM as default amendment_type when not provided', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ signed_at: '2026-01-01T10:00:00Z' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'amend-002', amendment_type: 'ADDENDUM' }] });

      await createAmendment('org-1', 'enc-1', 'user-1', {
        content: 'Some addendum text.',
      });

      const [, insertParams] = mockQuery.mock.calls[1];
      expect(insertParams[3]).toBe('ADDENDUM');
    });

    it('should serialize affected_sections as JSON string in the INSERT', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ signed_at: '2026-01-01T10:00:00Z' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'amend-003' }] });

      const sections = ['objective', 'assessment'];
      await createAmendment('org-1', 'enc-1', 'user-1', {
        content: 'Updated objective findings.',
        affected_sections: sections,
      });

      const [, insertParams] = mockQuery.mock.calls[1];
      expect(insertParams[6]).toBe(JSON.stringify(sections));
    });

    it('should serialize empty array for affected_sections when not provided', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ signed_at: '2026-01-01T10:00:00Z' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'amend-004' }] });

      await createAmendment('org-1', 'enc-1', 'user-1', {
        content: 'No specific section.',
      });

      const [, insertParams] = mockQuery.mock.calls[1];
      expect(insertParams[6]).toBe(JSON.stringify([]));
    });

    it('should pass null for reason when not provided', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ signed_at: '2026-01-01T10:00:00Z' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'amend-005' }] });

      await createAmendment('org-1', 'enc-1', 'user-1', {
        content: 'Content without reason.',
      });

      const [, insertParams] = mockQuery.mock.calls[1];
      expect(insertParams[4]).toBeNull();
    });

    it('should throw BusinessLogicError when encounter is not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(
        createAmendment('org-1', 'enc-missing', 'user-1', { content: 'Test' })
      ).rejects.toMatchObject({
        message: 'Encounter not found',
        statusCode: 422,
      });
    });

    it('should throw BusinessLogicError when encounter is not signed', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ signed_at: null }] });

      await expect(
        createAmendment('org-1', 'enc-unsigned', 'user-1', { content: 'Test' })
      ).rejects.toMatchObject({
        message: expect.stringContaining('unsigned encounter'),
        statusCode: 422,
      });
    });

    it('should log error and rethrow when the INSERT query fails', async () => {
      const dbError = new Error('DB connection lost');
      mockQuery
        .mockResolvedValueOnce({ rows: [{ signed_at: '2026-01-01T10:00:00Z' }] })
        .mockRejectedValueOnce(dbError);

      await expect(
        createAmendment('org-1', 'enc-1', 'user-1', { content: 'Test' })
      ).rejects.toThrow('DB connection lost');

      expect(logger.error).toHaveBeenCalled();
    });

    it('should log info after successful creation', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ signed_at: '2026-01-01T10:00:00Z' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'amend-006' }] });

      await createAmendment('org-1', 'enc-1', 'user-1', {
        amendment_type: 'CORRECTION',
        content: 'Corrected details.',
      });

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Amendment created'),
        expect.objectContaining({ amendmentId: 'amend-006' })
      );
    });
  });

  // ===========================================================================
  // getEncounterAmendments
  // ===========================================================================

  describe('getEncounterAmendments', () => {
    it('should return all amendments for an encounter ordered by created_at', async () => {
      const fakeRows = [
        { id: 'amend-1', author_name: 'Dr. Olsen', signed_by_name: null },
        { id: 'amend-2', author_name: 'Dr. Berg', signed_by_name: 'Dr. Berg' },
      ];
      mockQuery.mockResolvedValueOnce({ rows: fakeRows });

      const result = await getEncounterAmendments('org-1', 'enc-1');

      expect(result).toEqual(fakeRows);
      expect(mockQuery).toHaveBeenCalledTimes(1);
      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toMatch(/FROM encounter_amendments ea/);
      expect(sql).toMatch(/ORDER BY ea\.created_at ASC/);
      expect(params[0]).toBe('org-1');
      expect(params[1]).toBe('enc-1');
    });

    it('should return an empty array when no amendments exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await getEncounterAmendments('org-1', 'enc-no-amendments');

      expect(result).toEqual([]);
    });

    it('should join author and signed_by user names', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await getEncounterAmendments('org-1', 'enc-1');

      const [sql] = mockQuery.mock.calls[0];
      expect(sql).toMatch(/LEFT JOIN users u ON u\.id = ea\.author_id/);
      expect(sql).toMatch(/LEFT JOIN users su ON su\.id = ea\.signed_by/);
    });

    it('should log error and rethrow when the query fails', async () => {
      const dbError = new Error('Query timeout');
      mockQuery.mockRejectedValueOnce(dbError);

      await expect(getEncounterAmendments('org-1', 'enc-1')).rejects.toThrow('Query timeout');

      expect(logger.error).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // signAmendment
  // ===========================================================================

  describe('signAmendment', () => {
    it('should sign an unsigned amendment and return the updated row', async () => {
      const signedRow = {
        id: 'amend-10',
        signed_at: new Date().toISOString(),
        signed_by: 'user-2',
      };
      mockQuery.mockResolvedValueOnce({ rows: [signedRow] });

      const result = await signAmendment('org-1', 'amend-10', 'user-2');

      expect(result).toEqual(signedRow);
      expect(mockQuery).toHaveBeenCalledTimes(1);
      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toMatch(/UPDATE encounter_amendments/);
      expect(sql).toMatch(/signed_at = NOW\(\)/);
      expect(sql).toMatch(/signed_at IS NULL/);
      expect(params[0]).toBe('org-1');
      expect(params[1]).toBe('amend-10');
      expect(params[2]).toBe('user-2');
    });

    it('should throw BusinessLogicError when amendment is not found or already signed', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(signAmendment('org-1', 'amend-already-signed', 'user-2')).rejects.toMatchObject({
        message: 'Amendment not found or already signed',
        statusCode: 422,
      });
    });

    it('should log info with organizationId, amendmentId, and signedBy after signing', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'amend-11', signed_by: 'user-3' }] });

      await signAmendment('org-1', 'amend-11', 'user-3');

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Amendment signed'),
        expect.objectContaining({
          organizationId: 'org-1',
          amendmentId: 'amend-11',
          signedBy: 'user-3',
        })
      );
    });

    it('should log error and rethrow when the UPDATE query fails', async () => {
      const dbError = new Error('Lock timeout');
      mockQuery.mockRejectedValueOnce(dbError);

      await expect(signAmendment('org-1', 'amend-10', 'user-2')).rejects.toThrow('Lock timeout');

      expect(logger.error).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // deleteAmendment
  // ===========================================================================

  describe('deleteAmendment', () => {
    it('should delete an unsigned amendment authored by the user and return true', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'amend-20' }] });

      const result = await deleteAmendment('org-1', 'amend-20', 'user-1');

      expect(result).toBe(true);
      expect(mockQuery).toHaveBeenCalledTimes(1);
      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toMatch(/DELETE FROM encounter_amendments/);
      expect(sql).toMatch(/author_id = \$3/);
      expect(sql).toMatch(/signed_at IS NULL/);
      expect(params[0]).toBe('org-1');
      expect(params[1]).toBe('amend-20');
      expect(params[2]).toBe('user-1');
    });

    it('should throw BusinessLogicError when amendment is already signed', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(deleteAmendment('org-1', 'amend-signed', 'user-1')).rejects.toMatchObject({
        message: expect.stringContaining('already signed'),
        statusCode: 422,
      });
    });

    it('should throw BusinessLogicError when user is not the author', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(deleteAmendment('org-1', 'amend-20', 'different-user')).rejects.toMatchObject({
        message: expect.stringContaining('not the author'),
        statusCode: 422,
      });
    });

    it('should throw BusinessLogicError when amendment does not exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(deleteAmendment('org-1', 'amend-missing', 'user-1')).rejects.toMatchObject({
        message: expect.stringContaining('not found'),
        statusCode: 422,
      });
    });

    it('should log info with organizationId, amendmentId, and deletedBy after deletion', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'amend-21' }] });

      await deleteAmendment('org-1', 'amend-21', 'user-5');

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Amendment deleted'),
        expect.objectContaining({
          organizationId: 'org-1',
          amendmentId: 'amend-21',
          deletedBy: 'user-5',
        })
      );
    });

    it('should log error and rethrow when the DELETE query fails', async () => {
      const dbError = new Error('Constraint violation');
      mockQuery.mockRejectedValueOnce(dbError);

      await expect(deleteAmendment('org-1', 'amend-20', 'user-1')).rejects.toThrow(
        'Constraint violation'
      );

      expect(logger.error).toHaveBeenCalled();
    });
  });
});
