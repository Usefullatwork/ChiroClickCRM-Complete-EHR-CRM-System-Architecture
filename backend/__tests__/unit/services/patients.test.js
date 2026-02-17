/**
 * Unit Tests for Patients Service
 * Tests CRUD operations, search, statistics, and follow-up queries
 */

import { jest } from '@jest/globals';

// Mock database
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

const mockEncrypt = jest.fn();
const mockDecrypt = jest.fn();
const mockMaskSensitive = jest.fn();

jest.unstable_mockModule('../../../src/utils/encryption.js', () => ({
  encrypt: mockEncrypt,
  decrypt: mockDecrypt,
  maskSensitive: mockMaskSensitive,
  default: {
    encrypt: mockEncrypt,
    decrypt: mockDecrypt,
    maskSensitive: mockMaskSensitive,
  },
}));

const patientsService = await import('../../../src/services/patients.js');

describe('Patients Service', () => {
  const testOrgId = 'org-test-123';

  beforeEach(() => {
    jest.clearAllMocks();
    // Re-setup encryption mock implementations (resetMocks clears them)
    mockEncrypt.mockImplementation((text) => (text ? `encrypted:${text}` : null));
    mockDecrypt.mockImplementation((text) => (text ? text.replace('encrypted:', '') : null));
    mockMaskSensitive.mockImplementation((text) => (text ? '***masked***' : null));
  });

  // =============================================================================
  // GET ALL PATIENTS
  // =============================================================================

  describe('getAllPatients', () => {
    it('should return paginated patient list with defaults', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '2' }] }).mockResolvedValueOnce({
        rows: [
          { id: 'p1', first_name: 'John', last_name: 'Doe', encrypted_personal_number: null },
          { id: 'p2', first_name: 'Jane', last_name: 'Smith', encrypted_personal_number: null },
        ],
      });

      const result = await patientsService.getAllPatients(testOrgId);

      expect(result.patients).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(20);
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    it('should apply search filter', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '1' }] }).mockResolvedValueOnce({
        rows: [{ id: 'p1', first_name: 'John', last_name: 'Doe', encrypted_personal_number: null }],
      });

      const result = await patientsService.getAllPatients(testOrgId, { search: 'John' });

      expect(result.patients).toHaveLength(1);
      // Verify search parameter was included
      const countCall = mockQuery.mock.calls[0];
      expect(countCall[1]).toContain('%John%');
    });

    it('should apply status filter', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '1' }] }).mockResolvedValueOnce({
        rows: [
          { id: 'p1', first_name: 'Active', last_name: 'Patient', encrypted_personal_number: null },
        ],
      });

      const result = await patientsService.getAllPatients(testOrgId, { status: 'ACTIVE' });

      expect(result.patients).toHaveLength(1);
      const countCall = mockQuery.mock.calls[0];
      expect(countCall[1]).toContain('ACTIVE');
    });

    it('should apply category filter', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await patientsService.getAllPatients(testOrgId, { category: 'VIP' });

      expect(result.patients).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });

    it('should handle pagination options', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '50' }] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await patientsService.getAllPatients(testOrgId, { page: 3, limit: 10 });

      expect(result.pagination.page).toBe(3);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.total).toBe(50);
      expect(result.pagination.pages).toBe(5);
    });

    it('should mask encrypted personal numbers', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '1' }] }).mockResolvedValueOnce({
        rows: [
          { id: 'p1', first_name: 'Test', encrypted_personal_number: 'encrypted:12345678901' },
        ],
      });

      const result = await patientsService.getAllPatients(testOrgId);

      expect(result.patients[0].encrypted_personal_number).toBe('***masked***');
    });

    it('should throw on database error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB connection failed'));

      await expect(patientsService.getAllPatients(testOrgId)).rejects.toThrow(
        'DB connection failed'
      );
    });
  });

  // =============================================================================
  // GET PATIENT BY ID
  // =============================================================================

  describe('getPatientById', () => {
    it('should return patient with decrypted personal number', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'p1',
            first_name: 'John',
            last_name: 'Doe',
            encrypted_personal_number: 'encrypted:12345678901',
            total_encounters: '5',
          },
        ],
      });

      const result = await patientsService.getPatientById(testOrgId, 'p1');

      expect(result).toBeDefined();
      expect(result.id).toBe('p1');
      expect(result.decrypted_personal_number).toBe('12345678901');
      expect(result.masked_personal_number).toBe('***masked***');
      // encrypted_personal_number should be deleted
      expect(result.encrypted_personal_number).toBeUndefined();
    });

    it('should return null for non-existent patient', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await patientsService.getPatientById(testOrgId, 'non-existent');

      expect(result).toBeNull();
    });

    it('should return patient without personal number if not stored', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'p1', first_name: 'Jane', encrypted_personal_number: null }],
      });

      const result = await patientsService.getPatientById(testOrgId, 'p1');

      expect(result).toBeDefined();
      expect(result.decrypted_personal_number).toBeUndefined();
    });

    it('should throw on database error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB error'));

      await expect(patientsService.getPatientById(testOrgId, 'p1')).rejects.toThrow('DB error');
    });
  });

  // =============================================================================
  // CREATE PATIENT
  // =============================================================================

  describe('createPatient', () => {
    it('should create a patient with minimal data', async () => {
      const mockPatient = {
        id: 'new-p1',
        organization_id: testOrgId,
        first_name: 'New',
        last_name: 'Patient',
        solvit_id: 'SOL-001',
      };

      mockQuery.mockResolvedValueOnce({ rows: [mockPatient] });

      const result = await patientsService.createPatient(testOrgId, {
        first_name: 'New',
        last_name: 'Patient',
        solvit_id: 'SOL-001',
        date_of_birth: '1990-01-01',
      });

      expect(result).toBeDefined();
      expect(result.id).toBe('new-p1');
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('should encrypt personal number when provided', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'p1' }] });

      await patientsService.createPatient(testOrgId, {
        first_name: 'Test',
        last_name: 'User',
        solvit_id: 'SOL-002',
        date_of_birth: '1985-06-15',
        personal_number: '12345678901',
      });

      const queryCall = mockQuery.mock.calls[0];
      // The encrypted personal number should be in the params
      expect(queryCall[1]).toContain('encrypted:12345678901');
    });

    it('should set default values for optional fields', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'p1', status: 'ACTIVE' }] });

      await patientsService.createPatient(testOrgId, {
        first_name: 'Min',
        last_name: 'Patient',
        solvit_id: 'SOL-003',
        date_of_birth: '2000-01-01',
      });

      const queryCall = mockQuery.mock.calls[0];
      const params = queryCall[1];
      // status default = 'ACTIVE'
      expect(params).toContain('ACTIVE');
    });

    it('should throw on database error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Unique constraint violation'));

      await expect(
        patientsService.createPatient(testOrgId, {
          first_name: 'Dup',
          last_name: 'Patient',
          solvit_id: 'SOL-DUP',
          date_of_birth: '1990-01-01',
        })
      ).rejects.toThrow('Unique constraint violation');
    });
  });

  // =============================================================================
  // UPDATE PATIENT
  // =============================================================================

  describe('updatePatient', () => {
    it('should update allowed fields', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'p1', first_name: 'Updated', last_name: 'Name' }],
      });

      const result = await patientsService.updatePatient(testOrgId, 'p1', {
        first_name: 'Updated',
        last_name: 'Name',
      });

      expect(result).toBeDefined();
      expect(result.first_name).toBe('Updated');
    });

    it('should encrypt personal number during update', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'p1' }] });

      await patientsService.updatePatient(testOrgId, 'p1', {
        personal_number: '99988877766',
      });

      const queryCall = mockQuery.mock.calls[0];
      expect(queryCall[1]).toContain('encrypted:99988877766');
    });

    it('should return null for non-existent patient', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await patientsService.updatePatient(testOrgId, 'non-existent', {
        first_name: 'Test',
      });

      expect(result).toBeNull();
    });

    it('should throw when no fields to update', async () => {
      await expect(
        patientsService.updatePatient(testOrgId, 'p1', { invalid_field: 'value' })
      ).rejects.toThrow('No fields to update');
    });

    it('should throw on database error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB error'));

      await expect(
        patientsService.updatePatient(testOrgId, 'p1', { first_name: 'Test' })
      ).rejects.toThrow('DB error');
    });
  });

  // =============================================================================
  // DELETE PATIENT (SOFT DELETE)
  // =============================================================================

  describe('deletePatient', () => {
    it('should soft delete by setting status to INACTIVE', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'p1', status: 'INACTIVE' }],
      });

      const result = await patientsService.deletePatient(testOrgId, 'p1');

      expect(result).toBeDefined();
      expect(result.status).toBe('INACTIVE');
      const queryCall = mockQuery.mock.calls[0];
      expect(queryCall[0]).toContain('INACTIVE');
    });

    it('should return null for non-existent patient', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await patientsService.deletePatient(testOrgId, 'non-existent');

      expect(result).toBeNull();
    });

    it('should throw on database error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB error'));

      await expect(patientsService.deletePatient(testOrgId, 'p1')).rejects.toThrow('DB error');
    });
  });

  // =============================================================================
  // SEARCH PATIENTS
  // =============================================================================

  describe('searchPatients', () => {
    it('should search patients by term', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { id: 'p1', first_name: 'John', last_name: 'Doe' },
          { id: 'p2', first_name: 'Johnny', last_name: 'Walker' },
        ],
      });

      const result = await patientsService.searchPatients(testOrgId, 'John');

      expect(result).toHaveLength(2);
      const queryCall = mockQuery.mock.calls[0];
      expect(queryCall[1]).toContain('%John%');
    });

    it('should respect limit parameter', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'p1' }] });

      await patientsService.searchPatients(testOrgId, 'test', 5);

      const queryCall = mockQuery.mock.calls[0];
      expect(queryCall[1]).toContain(5);
    });

    it('should return empty array when no matches', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await patientsService.searchPatients(testOrgId, 'nonexistent');

      expect(result).toHaveLength(0);
    });

    it('should throw on database error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Search error'));

      await expect(patientsService.searchPatients(testOrgId, 'test')).rejects.toThrow(
        'Search error'
      );
    });
  });

  // =============================================================================
  // ADVANCED SEARCH
  // =============================================================================

  describe('advancedSearchPatients', () => {
    it('should search with general query', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '1' }] }).mockResolvedValueOnce({
        rows: [{ id: 'p1', first_name: 'Test', encrypted_personal_number: null }],
      });

      const result = await patientsService.advancedSearchPatients(testOrgId, { q: 'Test' });

      expect(result.patients).toHaveLength(1);
      expect(result.filters_applied.q).toBe('Test');
    });

    it('should filter by date of birth range', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await patientsService.advancedSearchPatients(testOrgId, {
        dob_from: '1980-01-01',
        dob_to: '1999-12-31',
      });

      expect(result.patients).toHaveLength(0);
      expect(result.pagination).toBeDefined();
    });

    it('should filter by status', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '3' }] }).mockResolvedValueOnce({
        rows: [
          { id: 'p1', encrypted_personal_number: null },
          { id: 'p2', encrypted_personal_number: null },
          { id: 'p3', encrypted_personal_number: null },
        ],
      });

      const result = await patientsService.advancedSearchPatients(testOrgId, { status: 'ACTIVE' });

      expect(result.patients).toHaveLength(3);
    });

    it('should use safe sort column validation', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({ rows: [] });

      // Using an invalid sort column should fall back to last_name
      await patientsService.advancedSearchPatients(testOrgId, {
        sort_by: 'DROP TABLE patients;--',
        sort_order: 'desc',
      });

      const dataQuery = mockQuery.mock.calls[1][0];
      expect(dataQuery).toContain('p.last_name');
      expect(dataQuery).not.toContain('DROP TABLE');
    });

    it('should throw on database error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Advanced search error'));

      await expect(
        patientsService.advancedSearchPatients(testOrgId, { q: 'test' })
      ).rejects.toThrow('Advanced search error');
    });
  });

  // =============================================================================
  // GET PATIENT STATISTICS
  // =============================================================================

  describe('getPatientStatistics', () => {
    it('should return combined statistics', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [
            {
              total_visits: '10',
              initial_visits: '1',
              followup_visits: '9',
              avg_duration: '30',
              first_visit: '2025-01-01',
              last_visit: '2026-02-01',
              total_gross: '5000',
              total_paid: '3000',
              total_insurance: '2000',
              total_transactions: '10',
              total_appointments: '12',
              completed: '10',
              no_shows: '1',
              cancelled: '1',
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [
            { code: 'L03', frequency: '5' },
            { code: 'L84', frequency: '3' },
          ],
        });

      const result = await patientsService.getPatientStatistics(testOrgId, 'p1');

      expect(result.visits.total_visits).toBe('10');
      expect(result.financial.total_paid).toBe('3000');
      expect(result.appointments.no_shows).toBe('1');
      expect(result.topDiagnoses).toHaveLength(2);
    });

    it('should throw on database error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Stats error'));

      await expect(patientsService.getPatientStatistics(testOrgId, 'p1')).rejects.toThrow(
        'Stats error'
      );
    });
  });

  // =============================================================================
  // GET PATIENTS NEEDING FOLLOW UP
  // =============================================================================

  describe('getPatientsNeedingFollowUp', () => {
    it('should return patients needing follow-up', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'p1', first_name: 'Old', last_name: 'Patient', days_since_visit: 95 }],
      });

      const result = await patientsService.getPatientsNeedingFollowUp(testOrgId);

      expect(result).toHaveLength(1);
      expect(result[0].days_since_visit).toBe(95);
    });

    it('should use custom daysInactive parameter', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await patientsService.getPatientsNeedingFollowUp(testOrgId, 180);

      const queryCall = mockQuery.mock.calls[0];
      expect(queryCall[1]).toContain(180);
    });

    it('should return empty array when no patients need follow-up', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await patientsService.getPatientsNeedingFollowUp(testOrgId);

      expect(result).toHaveLength(0);
    });

    it('should throw on database error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Followup error'));

      await expect(patientsService.getPatientsNeedingFollowUp(testOrgId)).rejects.toThrow(
        'Followup error'
      );
    });
  });
});
