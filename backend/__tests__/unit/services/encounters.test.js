/**
 * Tests for Clinical Encounters Service
 * Tests the business logic for SOAP notes and clinical documentation
 *
 * Updated to match actual service API signatures and database exports
 */

import { jest } from '@jest/globals';

// Mock database with correct named exports
const mockQuery = jest.fn();
const mockTransaction = jest.fn();

jest.unstable_mockModule('../../../src/config/database.js', () => ({
  query: mockQuery,
  transaction: mockTransaction,
  getClient: jest.fn(),
  healthCheck: jest.fn().mockResolvedValue(true),
  closePool: jest.fn(),
  setTenantContext: jest.fn(),
  clearTenantContext: jest.fn(),
  queryWithTenant: jest.fn(),
  default: {
    query: mockQuery,
    transaction: mockTransaction,
    getClient: jest.fn(),
    healthCheck: jest.fn().mockResolvedValue(true),
    closePool: jest.fn(),
    setTenantContext: jest.fn(),
    clearTenantContext: jest.fn(),
    queryWithTenant: jest.fn(),
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

// Import after mocking
const encountersService = await import('../../../src/services/encounters.js');

describe('Encounters Service', () => {
  const testOrgId = 'org-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createEncounter', () => {
    it('should create a new clinical encounter', async () => {
      const mockEncounter = {
        id: 'enc-123',
        organization_id: testOrgId,
        patient_id: 'pat-123',
        practitioner_id: 'prac-123',
        encounter_type: 'INITIAL',
        encounter_date: new Date().toISOString(),
        subjective: { chief_complaint: 'Low back pain' },
        objective: {},
        assessment: {},
        plan: {},
      };

      mockQuery.mockResolvedValueOnce({ rows: [mockEncounter] });

      const result = await encountersService.createEncounter(testOrgId, {
        patient_id: 'pat-123',
        practitioner_id: 'prac-123',
        encounter_type: 'INITIAL',
        subjective: { chief_complaint: 'Low back pain' },
      });

      expect(result).toBeDefined();
      expect(result.id).toBe('enc-123');
      expect(mockQuery).toHaveBeenCalled();
    });
  });

  describe('getEncounterById', () => {
    it('should retrieve an encounter by ID', async () => {
      const mockEncounter = {
        id: 'enc-123',
        organization_id: testOrgId,
        patient_id: 'pat-123',
        practitioner_id: 'prac-123',
        encounter_type: 'FOLLOWUP',
        subjective: { chief_complaint: 'Follow-up for LBP' },
        objective: { palpation: 'Improved' },
        assessment: { diagnosis: 'Improving' },
        plan: { treatment: 'Continue exercises' },
      };

      mockQuery.mockResolvedValueOnce({ rows: [mockEncounter] });

      const result = await encountersService.getEncounterById(testOrgId, 'enc-123');

      expect(result).toBeDefined();
      expect(result.id).toBe('enc-123');
      expect(result.patient_id).toBe('pat-123');
    });

    it('should return null for non-existent encounter', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await encountersService.getEncounterById(testOrgId, 'non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getAllEncounters', () => {
    it('should return paginated encounter list', async () => {
      const mockEncounters = [
        { id: 'enc-1', patient_id: 'pat-1', encounter_type: 'INITIAL' },
        { id: 'enc-2', patient_id: 'pat-2', encounter_type: 'FOLLOWUP' },
      ];

      // Count query
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '2' }] });
      // Data query
      mockQuery.mockResolvedValueOnce({ rows: mockEncounters });

      const result = await encountersService.getAllEncounters(testOrgId, { page: 1, limit: 20 });

      expect(result).toBeDefined();
      expect(result.encounters).toHaveLength(2);
    });
  });

  describe('signEncounter', () => {
    it('should sign an encounter and make it immutable', async () => {
      const signedAt = new Date().toISOString();
      const mockSigned = {
        id: 'enc-123',
        organization_id: testOrgId,
        signed_at: signedAt,
        signed_by: 'prac-123',
        is_current: true,
      };

      // signEncounter does a single UPDATE...RETURNING query
      mockQuery.mockResolvedValueOnce({ rows: [mockSigned] });

      const result = await encountersService.signEncounter(testOrgId, 'enc-123', 'prac-123');

      expect(result).toBeDefined();
      expect(result.signed_at).toBe(signedAt);
      expect(result.signed_by).toBe('prac-123');
    });

    it('should throw if encounter not found or already signed', async () => {
      // Returns empty rows (encounter not found or already signed)
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(
        encountersService.signEncounter(testOrgId, 'enc-999', 'prac-123')
      ).rejects.toThrow(/not found|already signed/i);
    });
  });

  describe('updateEncounter', () => {
    it('should update encounter notes', async () => {
      const mockUpdated = {
        id: 'enc-123',
        subjective: { chief_complaint: 'Updated complaint' },
        objective: { findings: 'Updated findings' },
        assessment: { diagnosis: 'Updated assessment' },
        plan: { treatment: 'Updated plan' },
      };

      // First query: check signed status (returns unsigned encounter)
      mockQuery.mockResolvedValueOnce({
        rows: [{ signed_at: null }],
      });
      // Second query: actual update
      mockQuery.mockResolvedValueOnce({ rows: [mockUpdated] });

      const result = await encountersService.updateEncounter(testOrgId, 'enc-123', {
        subjective: { chief_complaint: 'Updated complaint' },
      });

      expect(result).toBeDefined();
      expect(result.subjective.chief_complaint).toBe('Updated complaint');
    });

    it('should throw if encounter is signed', async () => {
      // First query: check signed status (returns signed encounter)
      mockQuery.mockResolvedValueOnce({
        rows: [{ signed_at: new Date().toISOString() }],
      });

      await expect(
        encountersService.updateEncounter(testOrgId, 'enc-123', {
          subjective: { chief_complaint: 'Test' },
        })
      ).rejects.toThrow(/signed/i);
    });

    it('should return null for non-existent encounter', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await encountersService.updateEncounter(testOrgId, 'non-existent', {
        subjective: { chief_complaint: 'Test' },
      });

      expect(result).toBeNull();
    });

    it('should throw when no fields to update', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ signed_at: null }],
      });

      await expect(
        encountersService.updateEncounter(testOrgId, 'enc-123', {
          invalid_field: 'test',
        })
      ).rejects.toThrow(/No fields to update/i);
    });
  });

  // =============================================================================
  // GET PATIENT ENCOUNTERS
  // =============================================================================

  describe('getPatientEncounters', () => {
    it('should return encounters for a patient', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { id: 'enc-1', encounter_type: 'INITIAL', practitioner_name: 'Dr. Smith' },
          { id: 'enc-2', encounter_type: 'FOLLOWUP', practitioner_name: 'Dr. Smith' },
        ],
      });

      const result = await encountersService.getPatientEncounters(testOrgId, 'pat-123');

      expect(result).toHaveLength(2);
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('should respect limit parameter', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'enc-1' }] });

      await encountersService.getPatientEncounters(testOrgId, 'pat-123', 5);

      const queryCall = mockQuery.mock.calls[0];
      expect(queryCall[1]).toContain(5);
    });

    it('should return empty array for patient with no encounters', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await encountersService.getPatientEncounters(testOrgId, 'pat-new');

      expect(result).toHaveLength(0);
    });

    it('should throw on database error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB error'));

      await expect(encountersService.getPatientEncounters(testOrgId, 'pat-123')).rejects.toThrow(
        'DB error'
      );
    });
  });

  // =============================================================================
  // GET ALL ENCOUNTERS (ADDITIONAL TESTS)
  // =============================================================================

  describe('getAllEncounters - filters', () => {
    it('should filter by patient ID', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'enc-1' }] });

      const result = await encountersService.getAllEncounters(testOrgId, {
        patientId: 'pat-123',
      });

      expect(result.encounters).toHaveLength(1);
      const countQuery = mockQuery.mock.calls[0];
      expect(countQuery[1]).toContain('pat-123');
    });

    it('should filter by encounter type', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '3' }] }).mockResolvedValueOnce({
        rows: [{ id: 'e1' }, { id: 'e2' }, { id: 'e3' }],
      });

      const result = await encountersService.getAllEncounters(testOrgId, {
        encounterType: 'FOLLOWUP',
      });

      expect(result.encounters).toHaveLength(3);
      const countQuery = mockQuery.mock.calls[0];
      expect(countQuery[1]).toContain('FOLLOWUP');
    });

    it('should filter by signed status', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '2' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'e1' }, { id: 'e2' }] });

      await encountersService.getAllEncounters(testOrgId, { signed: true });

      const countQuery = mockQuery.mock.calls[0][0];
      expect(countQuery).toContain('signed_at IS NOT NULL');
    });

    it('should filter unsigned encounters', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'e1' }] });

      await encountersService.getAllEncounters(testOrgId, { signed: false });

      const countQuery = mockQuery.mock.calls[0][0];
      expect(countQuery).toContain('signed_at IS NULL');
    });

    it('should handle pagination correctly', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '100' }] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await encountersService.getAllEncounters(testOrgId, {
        page: 5,
        limit: 10,
      });

      expect(result.pagination.page).toBe(5);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.total).toBe(100);
      expect(result.pagination.pages).toBe(10);
    });

    it('should throw on database error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB error'));

      await expect(encountersService.getAllEncounters(testOrgId, {})).rejects.toThrow('DB error');
    });
  });

  // =============================================================================
  // GET PATIENT ENCOUNTER HISTORY
  // =============================================================================

  describe('getPatientEncounterHistory', () => {
    it('should return encounter history', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'enc-1',
            encounter_date: '2026-02-01',
            encounter_type: 'FOLLOWUP',
            vas_pain_start: 5,
            vas_pain_end: 3,
          },
          {
            id: 'enc-2',
            encounter_date: '2026-01-15',
            encounter_type: 'INITIAL',
            vas_pain_start: 7,
            vas_pain_end: 5,
          },
        ],
      });

      const result = await encountersService.getPatientEncounterHistory(testOrgId, 'pat-123');

      expect(result).toHaveLength(2);
      expect(result[0].vas_pain_start).toBe(5);
    });

    it('should return empty array for new patient', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await encountersService.getPatientEncounterHistory(testOrgId, 'pat-new');

      expect(result).toHaveLength(0);
    });

    it('should throw on database error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('History error'));

      await expect(
        encountersService.getPatientEncounterHistory(testOrgId, 'pat-123')
      ).rejects.toThrow('History error');
    });
  });

  // =============================================================================
  // CHECK RED FLAGS
  // =============================================================================

  describe('checkRedFlags', () => {
    it('should return alerts for patient with red flags', async () => {
      // Patient query
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            red_flags: ['Cauda equina symptoms'],
            contraindications: ['Severe osteoporosis'],
            current_medications: [],
            date_of_birth: '1980-01-01',
          },
        ],
      });
      // Recent visits query
      mockQuery.mockResolvedValueOnce({ rows: [{ recent_visits: '2' }] });

      const result = await encountersService.checkRedFlags('pat-123', {});

      expect(result.alerts).toContain('Red flag: Cauda equina symptoms');
      expect(result.alerts).toContain('Contraindication: Severe osteoporosis');
    });

    it('should warn about anticoagulant medications', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            red_flags: [],
            contraindications: [],
            current_medications: ['Warfarin 5mg'],
            date_of_birth: '1960-01-01',
          },
        ],
      });
      mockQuery.mockResolvedValueOnce({ rows: [{ recent_visits: '1' }] });

      const result = await encountersService.checkRedFlags('pat-123', {});

      expect(result.warnings.some((w) => w.includes('anticoagulant'))).toBe(true);
    });

    it('should warn about excessive visits', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            red_flags: [],
            contraindications: [],
            current_medications: [],
            date_of_birth: '1990-01-01',
          },
        ],
      });
      mockQuery.mockResolvedValueOnce({ rows: [{ recent_visits: '8' }] });

      const result = await encountersService.checkRedFlags('pat-123', {});

      expect(result.warnings.some((w) => w.includes('>6 visits'))).toBe(true);
    });

    it('should return empty alerts/warnings for healthy patient', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            red_flags: [],
            contraindications: [],
            current_medications: [],
            date_of_birth: '1990-01-01',
          },
        ],
      });
      mockQuery.mockResolvedValueOnce({ rows: [{ recent_visits: '2' }] });

      const result = await encountersService.checkRedFlags('pat-123', {});

      expect(result.alerts).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should return empty results for non-existent patient', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await encountersService.checkRedFlags('non-existent', {});

      expect(result.alerts).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should throw on database error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Red flags error'));

      await expect(encountersService.checkRedFlags('pat-123', {})).rejects.toThrow(
        'Red flags error'
      );
    });
  });
});
