/**
 * Audit Logger Middleware Tests
 * Tests for GDPR Article 30 compliant audit logging
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock the audit utility
jest.unstable_mockModule('../../src/utils/audit.js', () => ({
  logAudit: jest.fn().mockResolvedValue(true)
}));

// Mock the logger
jest.unstable_mockModule('../../src/utils/logger.js', () => ({
  default: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn()
  }
}));

// Import after mocking
const { auditLogger, auditSensitiveAccess, auditBulkOperation } = await import('../../src/middleware/auditLogger.js');
const { logAudit } = await import('../../src/utils/audit.js');

describe('Audit Logger Middleware', () => {

  let mockReq;
  let mockRes;
  let nextFn;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      method: 'GET',
      path: '/api/v1/patients/123',
      params: { id: '123' },
      body: {},
      query: {},
      ip: '192.168.1.1',
      get: jest.fn().mockReturnValue('Mozilla/5.0'),
      user: {
        id: 'user-123',
        email: 'test@example.com',
        role: 'PRACTITIONER'
      },
      organizationId: 'org-123',
      connection: { remoteAddress: '192.168.1.1' }
    };

    mockRes = {
      statusCode: 200,
      json: jest.fn().mockReturnThis()
    };

    nextFn = jest.fn();
  });

  describe('auditLogger', () => {
    it('should call next() for non-auditable requests', async () => {
      mockReq.path = '/api/v1/health';
      mockReq.method = 'GET';

      await auditLogger(mockReq, mockRes, nextFn);

      expect(nextFn).toHaveBeenCalled();
    });

    it('should intercept JSON response for auditable requests', async () => {
      mockReq.path = '/api/v1/patients/123';
      mockReq.method = 'GET';

      await auditLogger(mockReq, mockRes, nextFn);

      expect(nextFn).toHaveBeenCalled();
      expect(mockRes.json).toBeDefined();
    });

    it('should audit patient read operations', async () => {
      mockReq.path = '/api/v1/patients/123';
      mockReq.method = 'GET';

      await auditLogger(mockReq, mockRes, nextFn);

      // Trigger the intercepted json method
      mockRes.json({ id: '123', name: 'Test Patient' });

      // Wait for setImmediate
      await new Promise(resolve => setImmediate(resolve));

      expect(logAudit).toHaveBeenCalled();
    });

    it('should audit POST operations', async () => {
      mockReq.path = '/api/v1/patients';
      mockReq.method = 'POST';
      mockReq.body = { first_name: 'Test', last_name: 'Patient' };

      await auditLogger(mockReq, mockRes, nextFn);
      mockRes.json({ id: '456', first_name: 'Test' });

      await new Promise(resolve => setImmediate(resolve));

      expect(logAudit).toHaveBeenCalled();
    });

    it('should audit DELETE operations', async () => {
      mockReq.path = '/api/v1/patients/123';
      mockReq.method = 'DELETE';

      await auditLogger(mockReq, mockRes, nextFn);
      mockRes.json({ success: true });

      await new Promise(resolve => setImmediate(resolve));

      expect(logAudit).toHaveBeenCalled();
    });

    it('should audit PATCH operations with changes', async () => {
      mockReq.path = '/api/v1/patients/123';
      mockReq.method = 'PATCH';
      mockReq.body = { first_name: 'NewName' };
      mockReq.auditOldValues = { first_name: 'OldName' };

      await auditLogger(mockReq, mockRes, nextFn);
      mockRes.json({ id: '123', first_name: 'NewName' });

      await new Promise(resolve => setImmediate(resolve));

      expect(logAudit).toHaveBeenCalled();
    });

    it('should skip static asset requests', async () => {
      mockReq.path = '/static/image.png';
      mockReq.method = 'GET';

      await auditLogger(mockReq, mockRes, nextFn);

      expect(nextFn).toHaveBeenCalled();
    });
  });

  describe('auditSensitiveAccess', () => {
    it('should require reason for decrypt endpoints', () => {
      mockReq.path = '/api/v1/patients/123/decrypt';
      mockReq.body = {}; // No reason provided

      auditSensitiveAccess(mockReq, mockRes, nextFn);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'BadRequestError',
          code: 'AUDIT_REASON_REQUIRED'
        })
      );
      expect(nextFn).not.toHaveBeenCalled();
    });

    it('should allow access with reason in body', () => {
      mockReq.path = '/api/v1/patients/123/decrypt';
      mockReq.body = { reason: 'Patient requested data access' };

      auditSensitiveAccess(mockReq, mockRes, nextFn);

      expect(mockReq.auditReason).toBe('Patient requested data access');
      expect(nextFn).toHaveBeenCalled();
    });

    it('should allow access with reason in query', () => {
      mockReq.path = '/api/v1/patients/123/decrypt';
      mockReq.body = {};
      mockReq.query = { reason: 'Medical emergency' };

      auditSensitiveAccess(mockReq, mockRes, nextFn);

      expect(mockReq.auditReason).toBe('Medical emergency');
      expect(nextFn).toHaveBeenCalled();
    });

    it('should allow non-decrypt endpoints without reason', () => {
      mockReq.path = '/api/v1/patients/123';

      auditSensitiveAccess(mockReq, mockRes, nextFn);

      expect(nextFn).toHaveBeenCalled();
    });
  });

  describe('auditBulkOperation', () => {
    it('should log bulk operations with resource IDs', async () => {
      const resourceIds = ['id-1', 'id-2', 'id-3'];

      await auditBulkOperation(mockReq, 'DELETE', 'PATIENT', resourceIds, {
        reason: 'Bulk anonymization'
      });

      expect(logAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'DELETE',
          resourceType: 'PATIENT',
          resourceId: null,
          metadata: expect.objectContaining({
            bulkOperation: true,
            affectedCount: 3,
            resourceIds: ['id-1', 'id-2', 'id-3']
          })
        })
      );
    });

    it('should limit logged resource IDs to 100', async () => {
      const resourceIds = Array.from({ length: 150 }, (_, i) => `id-${i}`);

      await auditBulkOperation(mockReq, 'UPDATE', 'PATIENT', resourceIds);

      expect(logAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            affectedCount: 150,
            resourceIds: expect.arrayContaining([expect.stringContaining('id-')])
          })
        })
      );

      // Check that only 100 IDs are logged
      const call = logAudit.mock.calls[0][0];
      expect(call.metadata.resourceIds.length).toBe(100);
    });
  });

  describe('Resource Type Extraction', () => {
    const testPaths = [
      { path: '/api/v1/patients/123', expected: 'PATIENT' },
      { path: '/api/v1/appointments/456', expected: 'APPOINTMENT' },
      { path: '/api/v1/communications', expected: 'COMMUNICATION' },
      { path: '/api/v1/follow-ups/789', expected: 'FOLLOW_UP' },
      { path: '/api/v1/encounters', expected: 'CLINICAL_ENCOUNTER' },
      { path: '/api/v1/gdpr/requests', expected: 'GDPR_REQUEST' }
    ];

    testPaths.forEach(({ path, expected }) => {
      it(`should extract ${expected} from ${path}`, async () => {
        mockReq.path = path;
        mockReq.method = 'GET';

        await auditLogger(mockReq, mockRes, nextFn);
        mockRes.json({ data: [] });

        await new Promise(resolve => setImmediate(resolve));

        expect(logAudit).toHaveBeenCalledWith(
          expect.objectContaining({
            resourceType: expected
          })
        );
      });
    });
  });
});
