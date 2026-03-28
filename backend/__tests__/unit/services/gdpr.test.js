/**
 * Unit Tests for GDPR Service
 * Tests data subject rights: access, portability, erasure, consent management
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

// Mock encryption — decrypt returns a known plaintext
jest.unstable_mockModule('../../../src/utils/encryption.js', () => ({
  decrypt: jest.fn().mockReturnValue('12345678901'),
  encrypt: jest.fn().mockReturnValue('iv:encrypted'),
  hash: jest.fn().mockReturnValue('hashed'),
  default: {
    decrypt: jest.fn().mockReturnValue('12345678901'),
    encrypt: jest.fn().mockReturnValue('iv:encrypted'),
    hash: jest.fn().mockReturnValue('hashed'),
  },
}));

// Import AFTER mocks
const gdprService = await import('../../../src/services/gdpr.js');
const encryptionModule = await import('../../../src/utils/encryption.js');

// =============================================================================
// TEST DATA HELPERS
// =============================================================================

const ORG_ID = 'org-test-001';
const PATIENT_ID = 'pat-test-001';
const REQUEST_ID = 'req-test-001';

const makePatientRow = (overrides = {}) => ({
  id: PATIENT_ID,
  organization_id: ORG_ID,
  solvit_id: 'SOL-001',
  encrypted_personal_number: null,
  first_name: 'Ola',
  last_name: 'Nordmann',
  date_of_birth: '1985-06-15',
  email: 'ola@example.com',
  phone: '+4799999999',
  created_at: new Date('2010-01-01').toISOString(),
  ...overrides,
});

// =============================================================================
// SUITE
// =============================================================================

describe('GDPR Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Restore decrypt default after clearAllMocks wipes mockReturnValue
    encryptionModule.decrypt.mockReturnValue('12345678901');
  });

  // ---------------------------------------------------------------------------
  // createGDPRRequest
  // ---------------------------------------------------------------------------

  describe('createGDPRRequest', () => {
    it('should insert a GDPR request and return the new row', async () => {
      const newRow = {
        id: REQUEST_ID,
        organization_id: ORG_ID,
        patient_id: PATIENT_ID,
        request_type: 'ACCESS',
        status: 'PENDING',
      };
      mockQuery.mockResolvedValueOnce({ rows: [newRow] });

      const result = await gdprService.createGDPRRequest(ORG_ID, {
        patient_id: PATIENT_ID,
        request_type: 'ACCESS',
        requester_email: 'ola@example.com',
        requester_phone: '+4799999999',
      });

      expect(result).toEqual(newRow);
      expect(mockQuery).toHaveBeenCalledTimes(1);
      // Verify organization_id isolation — it must appear in params
      const [, params] = mockQuery.mock.calls[0];
      expect(params[0]).toBe(ORG_ID);
      expect(params[1]).toBe(PATIENT_ID);
      expect(params[2]).toBe('ACCESS');
    });

    it('should default request_details to empty string when not provided', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: REQUEST_ID, request_details: '' }] });

      await gdprService.createGDPRRequest(ORG_ID, {
        patient_id: PATIENT_ID,
        request_type: 'ERASURE',
        requester_email: 'ola@example.com',
      });

      const [, params] = mockQuery.mock.calls[0];
      expect(params[3]).toBe(''); // request_details
    });

    it('should propagate database errors', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB connection failed'));

      await expect(
        gdprService.createGDPRRequest(ORG_ID, {
          patient_id: PATIENT_ID,
          request_type: 'ACCESS',
          requester_email: 'ola@example.com',
        })
      ).rejects.toThrow('DB connection failed');
    });
  });

  // ---------------------------------------------------------------------------
  // getAllGDPRRequests
  // ---------------------------------------------------------------------------

  describe('getAllGDPRRequests', () => {
    it('should return paginated requests with patient info', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '3' }] }) // count query
        .mockResolvedValueOnce({
          rows: [
            { id: 'req-1', request_type: 'ACCESS', patient_name: 'Ola Nordmann' },
            { id: 'req-2', request_type: 'ERASURE', patient_name: 'Kari Hansen' },
          ],
        }); // data query

      const result = await gdprService.getAllGDPRRequests(ORG_ID, { page: 1, limit: 10 });

      expect(result.requests).toHaveLength(2);
      expect(result.pagination.total).toBe(3);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.pages).toBe(1);
    });

    it('should apply status filter when provided', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'req-1', status: 'PENDING' }] });

      await gdprService.getAllGDPRRequests(ORG_ID, { status: 'PENDING' });

      const [countSql, countParams] = mockQuery.mock.calls[0];
      expect(countSql).toContain('gr.status');
      expect(countParams).toContain('PENDING');
    });

    it('should apply requestType filter when provided', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'req-1', request_type: 'ERASURE' }] });

      await gdprService.getAllGDPRRequests(ORG_ID, { requestType: 'ERASURE' });

      const [countSql, countParams] = mockQuery.mock.calls[0];
      expect(countSql).toContain('gr.request_type');
      expect(countParams).toContain('ERASURE');
    });

    it('should always include organization_id in WHERE clause', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({ rows: [] });

      await gdprService.getAllGDPRRequests(ORG_ID);

      const [, countParams] = mockQuery.mock.calls[0];
      expect(countParams[0]).toBe(ORG_ID);
    });
  });

  // ---------------------------------------------------------------------------
  // processDataAccessRequest
  // ---------------------------------------------------------------------------

  describe('processDataAccessRequest', () => {
    const buildAccessMocks = (patientRow = makePatientRow()) => {
      // 8 sequential queries: patient, encounters, measurements, appointments,
      // communications, financial, follow-ups, audit
      mockQuery
        .mockResolvedValueOnce({ rows: [patientRow] }) // patient
        .mockResolvedValueOnce({ rows: [] }) // encounters
        .mockResolvedValueOnce({ rows: [] }) // measurements
        .mockResolvedValueOnce({ rows: [] }) // appointments
        .mockResolvedValueOnce({ rows: [] }) // communications
        .mockResolvedValueOnce({ rows: [] }) // financial
        .mockResolvedValueOnce({ rows: [] }) // follow-ups
        .mockResolvedValueOnce({ rows: [] }); // audit
    };

    it('should return all required data categories', async () => {
      buildAccessMocks();

      const result = await gdprService.processDataAccessRequest(ORG_ID, PATIENT_ID);

      expect(result).toHaveProperty('patient');
      expect(result).toHaveProperty('encounters');
      expect(result).toHaveProperty('measurements');
      expect(result).toHaveProperty('appointments');
      expect(result).toHaveProperty('communications');
      expect(result).toHaveProperty('financial_records');
      expect(result).toHaveProperty('follow_ups');
      expect(result).toHaveProperty('audit_trail');
      expect(result).toHaveProperty('export_date');
      expect(result.organization_id).toBe(ORG_ID);
    });

    it('should throw when patient is not found in the organization', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] }); // patient not found

      await expect(gdprService.processDataAccessRequest(ORG_ID, 'pat-unknown')).rejects.toThrow(
        'Patient not found'
      );
    });

    it('should decrypt encrypted_personal_number when present', async () => {
      const patientWithPnr = makePatientRow({ encrypted_personal_number: 'iv:encryptedvalue' });
      buildAccessMocks(patientWithPnr);

      const result = await gdprService.processDataAccessRequest(ORG_ID, PATIENT_ID);

      // After decryption: personal_number is set, encrypted_personal_number is removed
      expect(result.patient.personal_number).toBe('12345678901');
      expect(result.patient).not.toHaveProperty('encrypted_personal_number');
    });

    it('should fall back to [ENCRYPTED] when decryption fails', async () => {
      encryptionModule.decrypt.mockImplementationOnce(() => {
        throw new Error('Decryption key mismatch');
      });

      const patientWithPnr = makePatientRow({ encrypted_personal_number: 'bad:data' });
      buildAccessMocks(patientWithPnr);

      const result = await gdprService.processDataAccessRequest(ORG_ID, PATIENT_ID);

      expect(result.patient.personal_number).toBe('[ENCRYPTED]');
    });

    it('should enforce organization_id isolation in every query', async () => {
      buildAccessMocks();

      await gdprService.processDataAccessRequest(ORG_ID, PATIENT_ID);

      // All 8 queries must include organizationId as a parameter
      expect(mockQuery).toHaveBeenCalledTimes(8);
      for (const call of mockQuery.mock.calls) {
        const params = call[1];
        expect(params).toContain(ORG_ID);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // processDataPortabilityRequest
  // ---------------------------------------------------------------------------

  describe('processDataPortabilityRequest', () => {
    it('should wrap access data in a portable format envelope', async () => {
      // 8 queries for the inner processDataAccessRequest call
      mockQuery
        .mockResolvedValueOnce({ rows: [makePatientRow()] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await gdprService.processDataPortabilityRequest(ORG_ID, PATIENT_ID);

      expect(result.format).toBe('JSON');
      expect(result.version).toBe('1.0');
      expect(result).toHaveProperty('exported_at');
      expect(result).toHaveProperty('data');
      expect(result.data).toHaveProperty('patient');
    });

    it('should propagate errors from processDataAccessRequest', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] }); // patient not found

      await expect(gdprService.processDataPortabilityRequest(ORG_ID, PATIENT_ID)).rejects.toThrow(
        'Patient not found'
      );
    });
  });

  // ---------------------------------------------------------------------------
  // processErasureRequest
  // ---------------------------------------------------------------------------

  describe('processErasureRequest', () => {
    const setupTransactionMock = (clientQueryResponses) => {
      const mockClientQuery = jest.fn();
      clientQueryResponses.forEach((response) => {
        mockClientQuery.mockResolvedValueOnce(response);
      });
      const mockClient = { query: mockClientQuery };
      mockTransaction.mockImplementation(async (cb) => cb(mockClient));
      return mockClientQuery;
    };

    it('should anonymize patient data when records are older than 10 years', async () => {
      // created_at is 15 years ago — old enough to anonymize
      const oldDate = new Date();
      oldDate.setFullYear(oldDate.getFullYear() - 15);

      const clientQuery = setupTransactionMock([
        { rows: [{ created_at: oldDate.toISOString() }] }, // patient lookup
        { rows: [] }, // anonymize patients
        { rows: [] }, // anonymize communications
        { rows: [] }, // update gdpr_requests
      ]);

      const result = await gdprService.processErasureRequest(ORG_ID, PATIENT_ID, REQUEST_ID);

      expect(result.status).toBe('COMPLETED');
      expect(result.action).toBe('ANONYMIZED');
      // anonymize patients query must include both patientId and organizationId
      const anonymizeCall = clientQuery.mock.calls[1];
      expect(anonymizeCall[1]).toEqual([PATIENT_ID, ORG_ID]);
    });

    it('should reject erasure when records are within the 10-year retention window', async () => {
      // created_at is only 2 years ago — cannot delete yet
      const recentDate = new Date();
      recentDate.setFullYear(recentDate.getFullYear() - 2);

      const clientQuery = setupTransactionMock([
        { rows: [{ created_at: recentDate.toISOString() }] }, // patient lookup
        { rows: [] }, // update status REJECTED
      ]);

      const result = await gdprService.processErasureRequest(ORG_ID, PATIENT_ID, REQUEST_ID);

      expect(result.status).toBe('REJECTED');
      expect(result.reason).toBe('LEGAL_RETENTION_PERIOD');
      expect(result).toHaveProperty('retention_expires');
      // Verify only 2 queries run (no anonymization)
      expect(clientQuery).toHaveBeenCalledTimes(2);
    });

    it('should throw when patient is not found during erasure check', async () => {
      setupTransactionMock([
        { rows: [] }, // patient not found
      ]);

      await expect(
        gdprService.processErasureRequest(ORG_ID, PATIENT_ID, REQUEST_ID)
      ).rejects.toThrow('Patient not found');
    });

    it('should check patient existence with organization_id isolation', async () => {
      const recentDate = new Date();
      recentDate.setFullYear(recentDate.getFullYear() - 2);

      const clientQuery = setupTransactionMock([
        { rows: [{ created_at: recentDate.toISOString() }] },
        { rows: [] },
      ]);

      await gdprService.processErasureRequest(ORG_ID, PATIENT_ID, REQUEST_ID);

      const [, patientLookupParams] = clientQuery.mock.calls[0];
      expect(patientLookupParams).toContain(PATIENT_ID);
      expect(patientLookupParams).toContain(ORG_ID);
    });

    it('should propagate transaction errors', async () => {
      mockTransaction.mockRejectedValueOnce(new Error('Transaction rollback'));

      await expect(
        gdprService.processErasureRequest(ORG_ID, PATIENT_ID, REQUEST_ID)
      ).rejects.toThrow('Transaction rollback');
    });
  });

  // ---------------------------------------------------------------------------
  // updateConsent
  // ---------------------------------------------------------------------------

  describe('updateConsent', () => {
    it('should update consent fields and return updated patient row', async () => {
      const updatedRow = {
        id: PATIENT_ID,
        organization_id: ORG_ID,
        consent_sms: true,
        consent_email: false,
        consent_marketing: true,
        consent_data_storage: true,
      };
      mockQuery.mockResolvedValueOnce({ rows: [updatedRow] });

      const result = await gdprService.updateConsent(ORG_ID, PATIENT_ID, {
        consent_sms: true,
        consent_email: false,
        consent_marketing: true,
        consent_data_storage: true,
      });

      expect(result).toEqual(updatedRow);
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('should include only provided consent fields in the SET clause', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: PATIENT_ID, consent_sms: true }] });

      await gdprService.updateConsent(ORG_ID, PATIENT_ID, { consent_sms: true });

      const [sql] = mockQuery.mock.calls[0];
      expect(sql).toContain('consent_sms');
      expect(sql).not.toContain('consent_email');
      expect(sql).not.toContain('consent_marketing');
      expect(sql).not.toContain('consent_data_storage');
    });

    it('should throw when no consent fields are provided', async () => {
      await expect(gdprService.updateConsent(ORG_ID, PATIENT_ID, {})).rejects.toThrow(
        'No consent fields to update'
      );

      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('should throw when patient is not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(
        gdprService.updateConsent(ORG_ID, PATIENT_ID, { consent_sms: false })
      ).rejects.toThrow('Patient not found');
    });

    it('should enforce organization_id isolation in the query params', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: PATIENT_ID }] });

      await gdprService.updateConsent(ORG_ID, PATIENT_ID, { consent_marketing: false });

      const [, params] = mockQuery.mock.calls[0];
      expect(params[0]).toBe(PATIENT_ID);
      expect(params[1]).toBe(ORG_ID);
    });
  });

  // ---------------------------------------------------------------------------
  // getConsentAuditTrail
  // ---------------------------------------------------------------------------

  describe('getConsentAuditTrail', () => {
    it('should return consent-related audit log rows', async () => {
      const auditRows = [
        { created_at: '2026-01-01T10:00:00Z', action: 'UPDATE', changes: { consent_sms: true } },
      ];
      mockQuery.mockResolvedValueOnce({ rows: auditRows });

      const result = await gdprService.getConsentAuditTrail(ORG_ID, PATIENT_ID);

      expect(result).toEqual(auditRows);
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('should enforce organization_id and patient_id isolation', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await gdprService.getConsentAuditTrail(ORG_ID, PATIENT_ID);

      const [, params] = mockQuery.mock.calls[0];
      expect(params[0]).toBe(ORG_ID);
      expect(params[1]).toBe(PATIENT_ID);
    });

    it('should return empty array when no consent changes exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await gdprService.getConsentAuditTrail(ORG_ID, PATIENT_ID);

      expect(result).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // updateGDPRRequestStatus
  // ---------------------------------------------------------------------------

  describe('updateGDPRRequestStatus', () => {
    it('should update status and return updated request', async () => {
      const updatedRow = { id: REQUEST_ID, status: 'COMPLETED', response: 'Done' };
      mockQuery.mockResolvedValueOnce({ rows: [updatedRow] });

      const result = await gdprService.updateGDPRRequestStatus(
        ORG_ID,
        REQUEST_ID,
        'COMPLETED',
        'Done'
      );

      expect(result).toEqual(updatedRow);
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('should use NOW() for completed_at when status is COMPLETED', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: REQUEST_ID }] });

      await gdprService.updateGDPRRequestStatus(ORG_ID, REQUEST_ID, 'COMPLETED');

      const [sql] = mockQuery.mock.calls[0];
      expect(sql).toContain('completed_at = NOW()');
    });

    it('should use NOW() for completed_at when status is REJECTED', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: REQUEST_ID }] });

      await gdprService.updateGDPRRequestStatus(ORG_ID, REQUEST_ID, 'REJECTED', 'Legal hold');

      const [sql] = mockQuery.mock.calls[0];
      expect(sql).toContain('completed_at = NOW()');
    });

    it('should use NULL for completed_at when status is IN_PROGRESS', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: REQUEST_ID }] });

      await gdprService.updateGDPRRequestStatus(ORG_ID, REQUEST_ID, 'IN_PROGRESS');

      const [sql] = mockQuery.mock.calls[0];
      expect(sql).toContain('completed_at = NULL');
    });

    it('should throw when request is not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(
        gdprService.updateGDPRRequestStatus(ORG_ID, REQUEST_ID, 'COMPLETED')
      ).rejects.toThrow('GDPR request not found');
    });

    it('should enforce organization_id isolation in query params', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: REQUEST_ID }] });

      await gdprService.updateGDPRRequestStatus(ORG_ID, REQUEST_ID, 'COMPLETED', 'ok');

      const [, params] = mockQuery.mock.calls[0];
      expect(params).toContain(ORG_ID);
      expect(params).toContain(REQUEST_ID);
    });
  });
});
