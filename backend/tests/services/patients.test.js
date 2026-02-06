/**
 * Patient Service Tests
 * Tests for patient CRUD and business logic
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock the database module
const mockQuery = jest.fn();
const mockTransaction = jest.fn();

jest.unstable_mockModule('../../src/config/database.js', () => ({
  query: mockQuery,
  transaction: mockTransaction,
  default: { query: mockQuery, transaction: mockTransaction },
}));

// Mock logger
jest.unstable_mockModule('../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Set encryption key before importing (must be exactly 32 characters for AES-256)
process.env.ENCRYPTION_KEY = 'abcdefghijklmnopqrstuvwxyz123456';

// Import the service after mocks are set up
const patientService = await import('../../src/services/patients.js');

describe('Patient Service', () => {
  const testOrgId = 'test-org-id-456';
  const testPatientId = 'test-patient-id-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllPatients', () => {
    it('should return paginated patients', async () => {
      const mockPatients = [
        {
          id: 'patient-1',
          first_name: 'John',
          last_name: 'Doe',
          status: 'ACTIVE',
          total_encounters: 5,
          upcoming_appointments: 1,
        },
        {
          id: 'patient-2',
          first_name: 'Jane',
          last_name: 'Smith',
          status: 'ACTIVE',
          total_encounters: 3,
          upcoming_appointments: 0,
        },
      ];

      // Mock count query
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '2' }] });
      // Mock patients query
      mockQuery.mockResolvedValueOnce({ rows: mockPatients });

      const result = await patientService.getAllPatients(testOrgId);

      expect(result.patients).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(20);
    });

    it('should apply search filter', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '1' }] });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'patient-1', first_name: 'John' }] });

      await patientService.getAllPatients(testOrgId, { search: 'John' });

      expect(mockQuery).toHaveBeenCalledTimes(2);
      const countQuery = mockQuery.mock.calls[0][0];
      expect(countQuery).toContain('ILIKE');
    });

    it('should apply status filter', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '1' }] });
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await patientService.getAllPatients(testOrgId, { status: 'ACTIVE' });

      const countQuery = mockQuery.mock.calls[0][0];
      expect(countQuery).toContain('status = $');
    });

    it('should mask encrypted personal numbers', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '1' }] });
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'patient-1', encrypted_personal_number: 'encrypted_value' }],
      });

      const result = await patientService.getAllPatients(testOrgId);

      expect(result.patients[0].encrypted_personal_number).toContain('*');
    });
  });

  describe('getPatientById', () => {
    it('should return patient with statistics', async () => {
      const mockPatient = {
        id: testPatientId,
        first_name: 'John',
        last_name: 'Doe',
        total_encounters: 5,
        completed_appointments: 10,
      };

      mockQuery.mockResolvedValueOnce({ rows: [mockPatient] });

      const result = await patientService.getPatientById(testOrgId, testPatientId);

      expect(result).toBeDefined();
      expect(result.id).toBe(testPatientId);
      expect(result.first_name).toBe('John');
    });

    it('should return null for non-existent patient', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await patientService.getPatientById(testOrgId, 'non-existent-id');

      expect(result).toBeNull();
    });

    it('should decrypt and mask personal number', async () => {
      const { encrypt } = await import('../../src/utils/encryption.js');
      const encryptedNumber = encrypt('12345678901');

      mockQuery.mockResolvedValueOnce({
        rows: [{ id: testPatientId, encrypted_personal_number: encryptedNumber }],
      });

      const result = await patientService.getPatientById(testOrgId, testPatientId);

      expect(result.decrypted_personal_number).toBe('12345678901');
      expect(result.masked_personal_number).toContain('*');
      expect(result.encrypted_personal_number).toBeUndefined();
    });
  });

  describe('createPatient', () => {
    it('should create a new patient', async () => {
      const patientData = {
        solvit_id: 'SOL001',
        first_name: 'John',
        last_name: 'Doe',
        date_of_birth: '1985-06-15',
        gender: 'M',
        email: 'john@example.com',
        phone: '+4712345678',
      };

      const createdPatient = { id: 'new-patient-id', ...patientData };
      mockQuery.mockResolvedValueOnce({ rows: [createdPatient] });

      const result = await patientService.createPatient(testOrgId, patientData);

      expect(result).toBeDefined();
      expect(result.id).toBe('new-patient-id');
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('should encrypt personal number when provided', async () => {
      const patientData = {
        solvit_id: 'SOL001',
        first_name: 'John',
        last_name: 'Doe',
        date_of_birth: '1985-06-15',
        personal_number: '12345678901',
      };

      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'new-id', ...patientData }] });

      await patientService.createPatient(testOrgId, patientData);

      const queryParams = mockQuery.mock.calls[0][1];
      // The encrypted personal number should be at index 2 (after org_id and solvit_id)
      expect(queryParams[2]).toBeDefined();
      expect(queryParams[2]).toContain(':'); // Encrypted format includes IV separator
    });

    it('should set default values', async () => {
      const patientData = {
        solvit_id: 'SOL001',
        first_name: 'John',
        last_name: 'Doe',
        date_of_birth: '1985-06-15',
      };

      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'new-id', status: 'ACTIVE' }] });

      await patientService.createPatient(testOrgId, patientData);

      const queryParams = mockQuery.mock.calls[0][1];
      // Status should default to 'ACTIVE'
      expect(queryParams).toContain('ACTIVE');
    });
  });

  describe('updatePatient', () => {
    it('should update patient fields', async () => {
      const updates = {
        first_name: 'Jane',
        email: 'jane@example.com',
      };

      mockQuery.mockResolvedValueOnce({
        rows: [{ id: testPatientId, first_name: 'Jane', email: 'jane@example.com' }],
      });

      const result = await patientService.updatePatient(testOrgId, testPatientId, updates);

      expect(result).toBeDefined();
      expect(result.first_name).toBe('Jane');
    });

    it('should return null for non-existent patient', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await patientService.updatePatient(testOrgId, 'non-existent', {
        first_name: 'Test',
      });

      expect(result).toBeNull();
    });

    it('should encrypt personal number when updating', async () => {
      const updates = {
        personal_number: '98765432109',
      };

      mockQuery.mockResolvedValueOnce({ rows: [{ id: testPatientId }] });

      await patientService.updatePatient(testOrgId, testPatientId, updates);

      const queryParams = mockQuery.mock.calls[0][1];
      // Find the encrypted value in params
      const encryptedParam = queryParams.find((p) => typeof p === 'string' && p.includes(':'));
      expect(encryptedParam).toBeDefined();
    });

    it('should throw error when no fields to update', async () => {
      await expect(patientService.updatePatient(testOrgId, testPatientId, {})).rejects.toThrow(
        'No fields to update'
      );
    });
  });

  describe('deletePatient', () => {
    it('should soft delete patient by setting status to INACTIVE', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: testPatientId, status: 'INACTIVE' }],
      });

      const result = await patientService.deletePatient(testOrgId, testPatientId);

      expect(result).toBeDefined();
      expect(result.status).toBe('INACTIVE');
      expect(mockQuery.mock.calls[0][0]).toContain("status = 'INACTIVE'");
    });

    it('should return null for non-existent patient', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await patientService.deletePatient(testOrgId, 'non-existent');

      expect(result).toBeNull();
    });
  });

  describe('searchPatients', () => {
    it('should search patients by term', async () => {
      const mockResults = [
        { id: 'p1', first_name: 'John', last_name: 'Doe' },
        { id: 'p2', first_name: 'Johnny', last_name: 'Smith' },
      ];

      mockQuery.mockResolvedValueOnce({ rows: mockResults });

      const result = await patientService.searchPatients(testOrgId, 'John');

      expect(result).toHaveLength(2);
      expect(mockQuery.mock.calls[0][0]).toContain('ILIKE');
    });

    it('should respect limit parameter', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await patientService.searchPatients(testOrgId, 'Test', 5);

      const queryParams = mockQuery.mock.calls[0][1];
      expect(queryParams).toContain(5);
    });
  });

  describe('getPatientStatistics', () => {
    it('should return comprehensive statistics', async () => {
      // Mock visits query
      mockQuery.mockResolvedValueOnce({
        rows: [{ total_visits: 10, initial_visits: 1, followup_visits: 9, avg_duration: 30 }],
      });
      // Mock diagnosis query
      mockQuery.mockResolvedValueOnce({
        rows: [{ code: 'L84', frequency: 5 }],
      });
      // Mock financial query
      mockQuery.mockResolvedValueOnce({
        rows: [{ total_gross: 5000, total_paid: 1000, total_insurance: 4000 }],
      });
      // Mock appointment query
      mockQuery.mockResolvedValueOnce({
        rows: [{ total_appointments: 12, completed: 10, no_shows: 1, cancelled: 1 }],
      });

      const result = await patientService.getPatientStatistics(testOrgId, testPatientId);

      expect(result.visits).toBeDefined();
      expect(result.topDiagnoses).toBeDefined();
      expect(result.financial).toBeDefined();
      expect(result.appointments).toBeDefined();
    });
  });

  describe('getPatientsNeedingFollowUp', () => {
    it('should return patients needing follow-up', async () => {
      const mockPatients = [
        { id: 'p1', first_name: 'John', last_visit_date: '2023-01-01', days_since_visit: 180 },
      ];

      mockQuery.mockResolvedValueOnce({ rows: mockPatients });

      const result = await patientService.getPatientsNeedingFollowUp(testOrgId);

      expect(result).toHaveLength(1);
      expect(result[0].days_since_visit).toBe(180);
    });

    it('should use custom days inactive parameter', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await patientService.getPatientsNeedingFollowUp(testOrgId, 30);

      const queryParams = mockQuery.mock.calls[0][1];
      expect(queryParams).toContain(30);
    });
  });
});
