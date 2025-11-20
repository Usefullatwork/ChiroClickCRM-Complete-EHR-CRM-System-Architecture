import * as gdprService from '../../../src/services/gdpr.js';
import db from '../../../src/config/database.js';

jest.mock('../../../src/config/database.js');

describe('GDPR Service', () => {
  const mockOrgId = '123e4567-e89b-12d3-a456-426614174000';
  const mockPatientId = '123e4567-e89b-12d3-a456-426614174001';
  const mockUserId = '123e4567-e89b-12d3-a456-426614174002';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createGDPRRequest', () => {
    it('should create a data access request (Article 15)', async () => {
      const requestData = {
        patient_id: mockPatientId,
        request_type: 'ACCESS',
        requester_email: 'patient@example.com'
      };

      db.query = jest.fn().mockResolvedValue({
        rows: [{
          id: 'request-123',
          ...requestData,
          status: 'PENDING',
          created_at: new Date()
        }]
      });

      const result = await gdprService.createGDPRRequest(mockOrgId, requestData);

      expect(result).toBeDefined();
      expect(result.request_type).toBe('ACCESS');
      expect(result.status).toBe('PENDING');
    });

    it('should create a data erasure request (Article 17)', async () => {
      const requestData = {
        patient_id: mockPatientId,
        request_type: 'ERASURE',
        requester_email: 'patient@example.com'
      };

      db.query = jest.fn().mockResolvedValue({
        rows: [{
          id: 'request-124',
          ...requestData,
          status: 'PENDING'
        }]
      });

      const result = await gdprService.createGDPRRequest(mockOrgId, requestData);

      expect(result.request_type).toBe('ERASURE');
    });

    it('should validate request type', async () => {
      const invalidRequest = {
        patient_id: mockPatientId,
        request_type: 'INVALID_TYPE'
      };

      await expect(
        gdprService.createGDPRRequest(mockOrgId, invalidRequest)
      ).rejects.toThrow();
    });
  });

  describe('processDataAccessRequest', () => {
    it('should export all patient data', async () => {
      // Mock patient data
      db.query = jest.fn()
        .mockResolvedValueOnce({ // Patient
          rows: [{
            id: mockPatientId,
            first_name: 'Test',
            last_name: 'Patient',
            email: 'test@example.com'
          }]
        })
        .mockResolvedValueOnce({ // Encounters
          rows: [
            { id: 'enc-1', encounter_date: '2024-01-15', chief_complaint: 'Low back pain' }
          ]
        })
        .mockResolvedValueOnce({ // Appointments
          rows: [
            { id: 'apt-1', start_time: '2024-01-15T10:00:00' }
          ]
        })
        .mockResolvedValueOnce({ // Communications
          rows: []
        })
        .mockResolvedValueOnce({ // Financial
          rows: []
        });

      const result = await gdprService.processDataAccessRequest(mockOrgId, mockPatientId);

      expect(result).toBeDefined();
      expect(result.patient).toBeDefined();
      expect(result.encounters).toHaveLength(1);
      expect(result.appointments).toHaveLength(1);
    });

    it('should include audit trail in export', async () => {
      db.query = jest.fn()
        .mockResolvedValueOnce({ rows: [{ id: mockPatientId }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ // Audit logs
          rows: [
            { action: 'CREATE', timestamp: '2024-01-01T00:00:00' }
          ]
        });

      const result = await gdprService.processDataAccessRequest(mockOrgId, mockPatientId);

      expect(result.audit_trail).toBeDefined();
    });
  });

  describe('processDataPortabilityRequest', () => {
    it('should export data in JSON format (Article 20)', async () => {
      db.query = jest.fn().mockResolvedValue({
        rows: [{
          id: mockPatientId,
          first_name: 'Test',
          last_name: 'Patient'
        }]
      });

      const result = await gdprService.processDataPortabilityRequest(mockOrgId, mockPatientId);

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      // Should be machine-readable format
      expect(result.patient).toBeDefined();
    });
  });

  describe('processErasureRequest', () => {
    it('should anonymize patient data', async () => {
      db.query = jest.fn().mockResolvedValue({ rowCount: 1 });

      await gdprService.processErasureRequest(mockOrgId, mockPatientId, mockUserId);

      expect(db.query).toHaveBeenCalled();
      // Verify UPDATE queries for anonymization
      const calls = db.query.mock.calls;
      const hasUpdateQuery = calls.some(call => call[0].includes('UPDATE'));
      expect(hasUpdateQuery).toBe(true);
    });

    it('should preserve legal retention data', async () => {
      db.query = jest.fn().mockResolvedValue({ rowCount: 1 });

      await gdprService.processErasureRequest(mockOrgId, mockPatientId, mockUserId);

      // Verify we don't hard-delete encounters (legal requirement)
      const calls = db.query.mock.calls;
      const hasHardDelete = calls.some(call =>
        call[0].includes('DELETE FROM clinical_encounters')
      );
      expect(hasHardDelete).toBe(false);
    });

    it('should create audit log for erasure', async () => {
      db.query = jest.fn().mockResolvedValue({ rowCount: 1 });

      await gdprService.processErasureRequest(mockOrgId, mockPatientId, mockUserId);

      // Verify audit log creation
      const auditCalls = db.query.mock.calls.filter(call =>
        call[0].includes('INSERT INTO audit_logs')
      );
      expect(auditCalls.length).toBeGreaterThan(0);
    });
  });

  describe('updatePatientConsent', () => {
    it('should update consent preferences', async () => {
      const consentData = {
        consent_sms: true,
        consent_email: true,
        consent_marketing: false
      };

      db.query = jest.fn().mockResolvedValue({
        rows: [{
          id: mockPatientId,
          ...consentData,
          consent_updated_at: new Date()
        }]
      });

      const result = await gdprService.updatePatientConsent(
        mockOrgId,
        mockPatientId,
        consentData
      );

      expect(result.consent_sms).toBe(true);
      expect(result.consent_marketing).toBe(false);
    });

    it('should audit consent changes', async () => {
      const consentData = {
        consent_sms: false
      };

      db.query = jest.fn().mockResolvedValue({ rows: [{}] });

      await gdprService.updatePatientConsent(mockOrgId, mockPatientId, consentData);

      // Verify audit trail
      const auditCalls = db.query.mock.calls.filter(call =>
        call[0].includes('audit_logs')
      );
      expect(auditCalls.length).toBeGreaterThan(0);
    });
  });

  describe('getConsentAuditTrail', () => {
    it('should retrieve consent change history', async () => {
      db.query = jest.fn().mockResolvedValue({
        rows: [
          {
            timestamp: '2024-01-01T00:00:00',
            action: 'UPDATE',
            old_value: { consent_sms: false },
            new_value: { consent_sms: true }
          }
        ]
      });

      const trail = await gdprService.getConsentAuditTrail(mockOrgId, mockPatientId);

      expect(trail).toHaveLength(1);
      expect(trail[0].action).toBe('UPDATE');
    });
  });

  describe('GDPR Request Status Updates', () => {
    it('should update request status', async () => {
      const requestId = 'request-123';

      db.query = jest.fn().mockResolvedValue({
        rows: [{
          id: requestId,
          status: 'COMPLETED',
          completed_at: new Date()
        }]
      });

      const result = await gdprService.updateRequestStatus(
        mockOrgId,
        requestId,
        'COMPLETED',
        mockUserId
      );

      expect(result.status).toBe('COMPLETED');
      expect(result.completed_at).toBeDefined();
    });

    it('should track who processed the request', async () => {
      const requestId = 'request-123';

      db.query = jest.fn().mockResolvedValue({
        rows: [{
          id: requestId,
          status: 'COMPLETED',
          processed_by: mockUserId
        }]
      });

      const result = await gdprService.updateRequestStatus(
        mockOrgId,
        requestId,
        'COMPLETED',
        mockUserId
      );

      expect(result.processed_by).toBe(mockUserId);
    });
  });
});
