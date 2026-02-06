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
  });
});
