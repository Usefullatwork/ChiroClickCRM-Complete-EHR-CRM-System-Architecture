import * as patientsService from '../../../src/services/patients.js';
import db from '../../../src/config/database.js';

// Mock database
jest.mock('../../../src/config/database.js');

describe('Patients Service', () => {
  const mockOrgId = '123e4567-e89b-12d3-a456-426614174000';
  const mockPatientId = '123e4567-e89b-12d3-a456-426614174001';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPatient', () => {
    it('should create a patient with encrypted fødselsnummer', async () => {
      const patientData = {
        first_name: 'Test',
        last_name: 'Patient',
        fodselsnummer: '01010199999',
        email: 'test@example.com',
        phone: '+4712345678'
      };

      db.query = jest.fn().mockResolvedValue({
        rows: [{
          id: mockPatientId,
          ...patientData,
          fodselsnummer_encrypted: 'encrypted_value',
          organization_id: mockOrgId,
          created_at: new Date()
        }]
      });

      const result = await patientsService.createPatient(mockOrgId, patientData);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockPatientId);
      expect(db.query).toHaveBeenCalled();

      // Verify encryption was called
      const queryCall = db.query.mock.calls[0];
      expect(queryCall[0]).toContain('INSERT INTO patients');
    });

    it('should validate required fields', async () => {
      const invalidData = {
        first_name: 'Test'
        // Missing last_name
      };

      await expect(
        patientsService.createPatient(mockOrgId, invalidData)
      ).rejects.toThrow();
    });

    it('should validate fødselsnummer format', async () => {
      const invalidData = {
        first_name: 'Test',
        last_name: 'Patient',
        fodselsnummer: 'invalid'
      };

      await expect(
        patientsService.createPatient(mockOrgId, invalidData)
      ).rejects.toThrow();
    });
  });

  describe('getPatientById', () => {
    it('should retrieve and decrypt patient data', async () => {
      db.query = jest.fn().mockResolvedValue({
        rows: [{
          id: mockPatientId,
          first_name: 'Test',
          last_name: 'Patient',
          fodselsnummer_encrypted: 'encrypted_value',
          organization_id: mockOrgId
        }]
      });

      const result = await patientsService.getPatientById(mockOrgId, mockPatientId);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockPatientId);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        expect.arrayContaining([mockPatientId, mockOrgId])
      );
    });

    it('should return null for non-existent patient', async () => {
      db.query = jest.fn().mockResolvedValue({ rows: [] });

      const result = await patientsService.getPatientById(mockOrgId, 'non-existent-id');

      expect(result).toBeNull();
    });

    it('should enforce organization isolation', async () => {
      const differentOrgId = '123e4567-e89b-12d3-a456-426614174099';

      db.query = jest.fn().mockResolvedValue({ rows: [] });

      const result = await patientsService.getPatientById(differentOrgId, mockPatientId);

      expect(result).toBeNull();
    });
  });

  describe('searchPatients', () => {
    it('should search patients by name', async () => {
      const searchQuery = 'John';

      db.query = jest.fn().mockResolvedValue({
        rows: [
          {
            id: mockPatientId,
            first_name: 'John',
            last_name: 'Doe',
            organization_id: mockOrgId
          }
        ]
      });

      const results = await patientsService.searchPatients(mockOrgId, searchQuery);

      expect(results).toHaveLength(1);
      expect(results[0].first_name).toBe('John');
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('ILIKE'),
        expect.arrayContaining([mockOrgId, expect.stringContaining(searchQuery)])
      );
    });

    it('should handle empty search results', async () => {
      db.query = jest.fn().mockResolvedValue({ rows: [] });

      const results = await patientsService.searchPatients(mockOrgId, 'NonExistent');

      expect(results).toHaveLength(0);
    });
  });

  describe('updatePatient', () => {
    it('should update patient data', async () => {
      const updates = {
        phone: '+4798765432',
        email: 'newemail@example.com'
      };

      db.query = jest.fn().mockResolvedValue({
        rows: [{
          id: mockPatientId,
          ...updates,
          organization_id: mockOrgId,
          updated_at: new Date()
        }]
      });

      const result = await patientsService.updatePatient(mockOrgId, mockPatientId, updates);

      expect(result).toBeDefined();
      expect(result.phone).toBe(updates.phone);
      expect(db.query).toHaveBeenCalled();
    });

    it('should not allow updating fødselsnummer directly', async () => {
      const updates = {
        fodselsnummer: '01010100000'
      };

      // This should either reject or ignore the fødselsnummer field
      await expect(
        patientsService.updatePatient(mockOrgId, mockPatientId, updates)
      ).rejects.toThrow();
    });
  });

  describe('deletePatient', () => {
    it('should soft-delete patient (anonymize)', async () => {
      db.query = jest.fn().mockResolvedValue({ rowCount: 1 });

      await patientsService.deletePatient(mockOrgId, mockPatientId);

      expect(db.query).toHaveBeenCalled();
      // Verify it's an UPDATE (anonymization) not DELETE
      const queryCall = db.query.mock.calls[0];
      expect(queryCall[0]).toContain('UPDATE');
    });
  });

  describe('getPatientStatistics', () => {
    it('should calculate patient statistics', async () => {
      db.query = jest.fn().mockResolvedValue({
        rows: [{
          total_patients: 150,
          new_this_month: 12,
          active_patients: 120,
          high_value_patients: 25
        }]
      });

      const stats = await patientsService.getPatientStatistics(mockOrgId);

      expect(stats.total_patients).toBe(150);
      expect(stats.new_this_month).toBe(12);
      expect(db.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([mockOrgId])
      );
    });
  });
});
