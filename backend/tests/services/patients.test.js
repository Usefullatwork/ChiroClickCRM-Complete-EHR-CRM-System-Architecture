/**
 * Patients Service Tests
 * Unit tests for patient management business logic
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Mock the database module
jest.unstable_mockModule('../../src/config/database.js', () => ({
  query: jest.fn(),
  transaction: jest.fn()
}));

// Mock the encryption module
jest.unstable_mockModule('../../src/utils/encryption.js', () => ({
  encrypt: jest.fn((text) => `encrypted:${text}`),
  decrypt: jest.fn((text) => text.replace('encrypted:', '')),
  maskSensitive: jest.fn((text) => '****'),
  default: {
    encrypt: jest.fn((text) => `encrypted:${text}`),
    decrypt: jest.fn((text) => text.replace('encrypted:', '')),
    maskSensitive: jest.fn((text) => '****')
  }
}));

// Mock logger
jest.unstable_mockModule('../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

describe('Patients Service', () => {
  let patientsService;
  let db;

  beforeEach(async () => {
    // Clear all mocks
    jest.clearAllMocks();

    // Import after mocking
    db = await import('../../src/config/database.js');
    patientsService = await import('../../src/services/patients.js');
  });

  describe('getAllPatients', () => {
    it('should return patients with pagination', async () => {
      const mockPatients = [
        { id: '1', first_name: 'John', last_name: 'Doe' },
        { id: '2', first_name: 'Jane', last_name: 'Smith' }
      ];

      // Mock count query
      db.query.mockResolvedValueOnce({ rows: [{ count: '2' }] });
      // Mock patients query
      db.query.mockResolvedValueOnce({ rows: mockPatients });

      const result = await patientsService.getAllPatients('org-123', { page: 1, limit: 10 });

      expect(result.patients).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
      expect(db.query).toHaveBeenCalledTimes(2);
    });

    it('should apply search filter', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ count: '1' }] });
      db.query.mockResolvedValueOnce({ rows: [{ id: '1', first_name: 'John', last_name: 'Doe' }] });

      await patientsService.getAllPatients('org-123', { search: 'John' });

      // Check that search parameter was included
      expect(db.query.mock.calls[0][0]).toContain('ILIKE');
      expect(db.query.mock.calls[0][1]).toContain('%John%');
    });

    it('should apply status filter', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ count: '1' }] });
      db.query.mockResolvedValueOnce({ rows: [] });

      await patientsService.getAllPatients('org-123', { status: 'ACTIVE' });

      expect(db.query.mock.calls[0][0]).toContain('p.status');
      expect(db.query.mock.calls[0][1]).toContain('ACTIVE');
    });
  });

  describe('getPatientById', () => {
    it('should return a patient by ID', async () => {
      const mockPatient = {
        id: '1',
        first_name: 'John',
        last_name: 'Doe',
        encrypted_personal_number: 'encrypted:12345678901'
      };

      db.query.mockResolvedValueOnce({ rows: [mockPatient] });

      const result = await patientsService.getPatientById('org-123', '1');

      expect(result.first_name).toBe('John');
      expect(result.last_name).toBe('Doe');
    });

    it('should return null for non-existent patient', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const result = await patientsService.getPatientById('org-123', 'non-existent');

      expect(result).toBeNull();
    });
  });

  describe('createPatient', () => {
    it('should create a new patient', async () => {
      const newPatient = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '+4712345678'
      };

      const mockCreatedPatient = { id: '1', ...newPatient };
      db.query.mockResolvedValueOnce({ rows: [mockCreatedPatient] });

      const result = await patientsService.createPatient('org-123', newPatient);

      expect(result.id).toBe('1');
      expect(result.first_name).toBe('John');
      expect(db.query).toHaveBeenCalledTimes(1);
    });

    it('should encrypt personal number when provided', async () => {
      const encryption = await import('../../src/utils/encryption.js');

      const newPatient = {
        first_name: 'John',
        last_name: 'Doe',
        personal_number: '12345678901'
      };

      db.query.mockResolvedValueOnce({ rows: [{ id: '1', ...newPatient }] });

      await patientsService.createPatient('org-123', newPatient);

      expect(encryption.encrypt).toHaveBeenCalledWith('12345678901');
    });
  });

  describe('updatePatient', () => {
    it('should update patient fields', async () => {
      const updates = { first_name: 'Johnny' };
      const mockUpdatedPatient = { id: '1', first_name: 'Johnny', last_name: 'Doe' };

      db.query.mockResolvedValueOnce({ rows: [mockUpdatedPatient] });

      const result = await patientsService.updatePatient('org-123', '1', updates);

      expect(result.first_name).toBe('Johnny');
      expect(db.query.mock.calls[0][0]).toContain('UPDATE patients');
    });

    it('should return null for non-existent patient', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const result = await patientsService.updatePatient('org-123', 'non-existent', { first_name: 'Test' });

      expect(result).toBeNull();
    });

    it('should throw error when no fields to update', async () => {
      await expect(patientsService.updatePatient('org-123', '1', {}))
        .rejects.toThrow('No fields to update');
    });
  });

  describe('deletePatient', () => {
    it('should soft delete patient (set status to INACTIVE)', async () => {
      const mockDeletedPatient = { id: '1', status: 'INACTIVE' };
      db.query.mockResolvedValueOnce({ rows: [mockDeletedPatient] });

      const result = await patientsService.deletePatient('org-123', '1');

      expect(result.status).toBe('INACTIVE');
      expect(db.query.mock.calls[0][0]).toContain("status = 'INACTIVE'");
    });

    it('should return null for non-existent patient', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const result = await patientsService.deletePatient('org-123', 'non-existent');

      expect(result).toBeNull();
    });
  });

  describe('searchPatients', () => {
    it('should search patients by term', async () => {
      const mockPatients = [{ id: '1', first_name: 'John', last_name: 'Doe' }];
      db.query.mockResolvedValueOnce({ rows: mockPatients });

      const result = await patientsService.searchPatients('org-123', 'John', 10);

      expect(result).toHaveLength(1);
      expect(db.query.mock.calls[0][1]).toContain('%John%');
    });
  });

  describe('getPatientStatistics', () => {
    it('should return patient statistics', async () => {
      // Mock visits query
      db.query.mockResolvedValueOnce({
        rows: [{ total_visits: '10', initial_visits: '1', followup_visits: '9' }]
      });
      // Mock diagnosis query
      db.query.mockResolvedValueOnce({ rows: [{ code: 'L03', frequency: '5' }] });
      // Mock financial query
      db.query.mockResolvedValueOnce({
        rows: [{ total_gross: '5000', total_paid: '4000', total_insurance: '1000' }]
      });
      // Mock appointment query
      db.query.mockResolvedValueOnce({
        rows: [{ total_appointments: '12', completed: '10', no_shows: '1', cancelled: '1' }]
      });

      const result = await patientsService.getPatientStatistics('org-123', '1');

      expect(result.visits.total_visits).toBe('10');
      expect(result.topDiagnoses).toHaveLength(1);
      expect(result.financial.total_gross).toBe('5000');
      expect(result.appointments.total_appointments).toBe('12');
    });
  });
});
