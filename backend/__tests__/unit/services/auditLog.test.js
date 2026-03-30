/**
 * Unit Tests for Audit Log Service
 * Tests logAction, logEncounterAction, logAISuggestion, logPatientAccess,
 * getAuditTrail, getUserActivitySummary, getFailedLoginAttempts, cleanupOldLogs
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

jest.unstable_mockModule('../../../src/services/communication/notifications.js', () => ({
  notifyByRole: jest.fn().mockResolvedValue(undefined),
  NOTIFICATION_TYPES: { SECURITY_ALERT: 'SECURITY_ALERT' },
}));

const auditLogModule = await import('../../../src/services/practice/auditLog.js');
const {
  logAction,
  logEncounterAction,
  logAISuggestion,
  logPatientAccess,
  getAuditTrail,
  getUserActivitySummary,
  getFailedLoginAttempts,
  cleanupOldLogs,
  ACTION_TYPES,
} = auditLogModule;

const loggerModule = await import('../../../src/utils/logger.js');
const logger = loggerModule.default;

describe('Audit Log Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================================================
  // ACTION_TYPES constant
  // ===========================================================================

  describe('ACTION_TYPES', () => {
    it('should export all expected action type constants', () => {
      expect(ACTION_TYPES.ENCOUNTER_CREATE).toBe('encounter.create');
      expect(ACTION_TYPES.PATIENT_READ).toBe('patient.read');
      expect(ACTION_TYPES.USER_LOGIN).toBe('user.login');
      expect(ACTION_TYPES.USER_LOGIN_FAILED).toBe('user.login.failed');
      expect(ACTION_TYPES.AI_SUGGESTION_ACCEPT).toBe('ai.suggestion.accept');
      expect(ACTION_TYPES.AI_SUGGESTION_REJECT).toBe('ai.suggestion.reject');
      expect(ACTION_TYPES.AI_SUGGESTION_MODIFY).toBe('ai.suggestion.modify');
    });
  });

  // ===========================================================================
  // logAction
  // ===========================================================================

  describe('logAction', () => {
    it('should insert audit log entry and return the new row', async () => {
      const fakeRow = {
        id: 'log-001',
        action_type: 'patient.create',
        user_id: 'user-1',
        resource_type: 'patient',
        resource_id: 'patient-99',
        success: true,
      };
      mockQuery.mockResolvedValueOnce({ rows: [fakeRow] });

      const result = await logAction(ACTION_TYPES.PATIENT_CREATE, 'user-1', {
        resourceType: 'patient',
        resourceId: 'patient-99',
      });

      expect(result).toEqual(fakeRow);
      expect(mockQuery).toHaveBeenCalledTimes(1);
      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toMatch(/INSERT INTO audit_log/);
      expect(params[0]).toBe(ACTION_TYPES.PATIENT_CREATE);
      expect(params[1]).toBe('user-1');
      expect(params[2]).toBe('patient');
      expect(params[3]).toBe('patient-99');
    });

    it('should serialize changes as JSON string when provided', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'log-002' }] });
      const changes = { before: { name: 'Old' }, after: { name: 'New' } };

      await logAction(ACTION_TYPES.PATIENT_UPDATE, 'user-2', {
        resourceType: 'patient',
        resourceId: 'patient-10',
        changes,
      });

      const params = mockQuery.mock.calls[0][1];
      expect(params[4]).toBe(JSON.stringify(changes));
    });

    it('should pass null for changes when not provided', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'log-003' }] });

      await logAction(ACTION_TYPES.PATIENT_READ, 'user-3', {
        resourceType: 'patient',
        resourceId: 'patient-5',
      });

      const params = mockQuery.mock.calls[0][1];
      expect(params[4]).toBeNull();
    });

    it('should include ipAddress, userAgent, and sessionId in query params', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'log-004' }] });

      await logAction(ACTION_TYPES.USER_LOGIN, 'user-4', {
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        sessionId: 'session-abc',
      });

      const params = mockQuery.mock.calls[0][1];
      expect(params[6]).toBe('192.168.1.1');
      expect(params[7]).toBe('Mozilla/5.0');
      expect(params[8]).toBe('session-abc');
    });

    it('should record success=false and errorMessage when provided', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'log-005' }] });

      await logAction(ACTION_TYPES.USER_LOGIN_FAILED, 'user-5', {
        success: false,
        errorMessage: 'Invalid credentials',
      });

      const params = mockQuery.mock.calls[0][1];
      expect(params[9]).toBe(false);
      expect(params[10]).toBe('Invalid credentials');
    });

    it('should return null and log error when DB insert fails', async () => {
      const dbError = new Error('connection refused');
      // First call: the INSERT fails; second call: alertAuditFailure INSERT to system_alerts
      mockQuery.mockRejectedValueOnce(dbError);
      // alertAuditFailure also queries for organizations and then system_alerts
      mockQuery.mockResolvedValueOnce({ rows: [] }); // system_alerts ON CONFLICT
      mockQuery.mockResolvedValueOnce({ rows: [] }); // organizations SELECT

      const result = await logAction(ACTION_TYPES.ENCOUNTER_CREATE, 'user-6');

      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalled();
    });

    it('should not throw when DB fails — caller should not crash', async () => {
      mockQuery.mockRejectedValue(new Error('DB down'));

      await expect(logAction(ACTION_TYPES.ENCOUNTER_UPDATE, 'user-7')).resolves.toBeNull();
    });
  });

  // ===========================================================================
  // logEncounterAction
  // ===========================================================================

  describe('logEncounterAction', () => {
    it('should call logAction with resourceType=clinical_encounter and the encounterId', async () => {
      const fakeRow = { id: 'log-enc-1', resource_type: 'clinical_encounter' };
      mockQuery.mockResolvedValueOnce({ rows: [fakeRow] });

      const result = await logEncounterAction(ACTION_TYPES.ENCOUNTER_CREATE, 'user-8', 'enc-42', {
        ipAddress: '10.0.0.1',
      });

      expect(result).toEqual(fakeRow);
      const params = mockQuery.mock.calls[0][1];
      expect(params[2]).toBe('clinical_encounter');
      expect(params[3]).toBe('enc-42');
    });
  });

  // ===========================================================================
  // logAISuggestion
  // ===========================================================================

  describe('logAISuggestion', () => {
    it('should log AI_SUGGESTION_ACCEPT when accepted=true', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'log-ai-1' }] });

      await logAISuggestion('user-9', {
        suggestionType: 'soap_subjective',
        originalText: 'Old',
        suggestedText: 'New',
        finalText: 'New',
        confidence: 0.95,
        accepted: true,
        modified: false,
        encounterId: 'enc-1',
      });

      const params = mockQuery.mock.calls[0][1];
      expect(params[0]).toBe(ACTION_TYPES.AI_SUGGESTION_ACCEPT);
    });

    it('should log AI_SUGGESTION_MODIFY when accepted=false and modified=true', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'log-ai-2' }] });

      await logAISuggestion('user-10', {
        suggestionType: 'soap_objective',
        originalText: 'A',
        suggestedText: 'B',
        finalText: 'C',
        confidence: 0.7,
        accepted: false,
        modified: true,
        encounterId: 'enc-2',
      });

      const params = mockQuery.mock.calls[0][1];
      expect(params[0]).toBe(ACTION_TYPES.AI_SUGGESTION_MODIFY);
    });

    it('should log AI_SUGGESTION_REJECT when accepted=false and modified=false', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'log-ai-3' }] });

      await logAISuggestion('user-11', {
        suggestionType: 'soap_assessment',
        originalText: 'X',
        suggestedText: 'Y',
        finalText: null,
        confidence: 0.5,
        accepted: false,
        modified: false,
        encounterId: 'enc-3',
      });

      const params = mockQuery.mock.calls[0][1];
      expect(params[0]).toBe(ACTION_TYPES.AI_SUGGESTION_REJECT);
    });

    it('should store original/suggested/final/confidence in changes JSON', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'log-ai-4' }] });

      await logAISuggestion('user-12', {
        suggestionType: 'plan',
        originalText: 'orig',
        suggestedText: 'sugg',
        finalText: 'final',
        confidence: 0.88,
        accepted: true,
        modified: false,
        encounterId: 'enc-4',
      });

      const params = mockQuery.mock.calls[0][1];
      const changes = JSON.parse(params[4]);
      expect(changes.original).toBe('orig');
      expect(changes.suggested).toBe('sugg');
      expect(changes.final).toBe('final');
      expect(changes.confidence).toBe(0.88);
    });
  });

  // ===========================================================================
  // logPatientAccess
  // ===========================================================================

  describe('logPatientAccess', () => {
    it('should log PATIENT_READ with resourceType=patient and the given reason', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'log-pa-1' }] });

      await logPatientAccess(
        'user-13',
        'patient-77',
        'scheduled appointment',
        '10.0.0.5',
        'TestAgent/1.0'
      );

      const params = mockQuery.mock.calls[0][1];
      expect(params[0]).toBe(ACTION_TYPES.PATIENT_READ);
      expect(params[1]).toBe('user-13');
      expect(params[2]).toBe('patient');
      expect(params[3]).toBe('patient-77');
      expect(params[6]).toBe('10.0.0.5');
      expect(params[7]).toBe('TestAgent/1.0');
      const metadata = JSON.parse(params[5]);
      expect(metadata.reason).toBe('scheduled appointment');
    });
  });

  // ===========================================================================
  // getAuditTrail
  // ===========================================================================

  describe('getAuditTrail', () => {
    it('should return rows from audit_log joined with users', async () => {
      const fakeRows = [{ id: 'log-1', action_type: 'patient.read', user_name: 'Dr. Smith' }];
      mockQuery.mockResolvedValueOnce({ rows: fakeRows });

      const result = await getAuditTrail('patient', 'patient-5');

      expect(result).toEqual(fakeRows);
      const [sql] = mockQuery.mock.calls[0];
      expect(sql).toMatch(/FROM audit_log al/);
      expect(sql).toMatch(/LEFT JOIN users u/);
    });

    it('should append date filters when startDate and endDate are provided', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const start = new Date('2026-01-01');
      const end = new Date('2026-03-31');

      await getAuditTrail('clinical_encounter', 'enc-10', {
        startDate: start,
        endDate: end,
      });

      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toMatch(/created_at >= \$/);
      expect(sql).toMatch(/created_at <= \$/);
      expect(params).toContain(start);
      expect(params).toContain(end);
    });

    it('should filter by userId when provided', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await getAuditTrail('patient', 'p-1', { userId: 'user-99' });

      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toMatch(/al\.user_id = \$/);
      expect(params).toContain('user-99');
    });

    it('should filter by actionTypes array when provided', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const types = ['patient.read', 'patient.update'];

      await getAuditTrail('patient', 'p-2', { actionTypes: types });

      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toMatch(/action_type = ANY\(\$/);
      expect(params).toContain(types);
    });
  });

  // ===========================================================================
  // getUserActivitySummary
  // ===========================================================================

  describe('getUserActivitySummary', () => {
    it('should return grouped action counts for the given user', async () => {
      const fakeRows = [{ action_type: 'patient.read', count: '12', last_action: new Date() }];
      mockQuery.mockResolvedValueOnce({ rows: fakeRows });

      const result = await getUserActivitySummary('user-20', 7);

      expect(result).toEqual(fakeRows);
      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toMatch(/GROUP BY action_type/);
      expect(params[0]).toBe('user-20');
      expect(params[1]).toBe(7);
    });
  });

  // ===========================================================================
  // getFailedLoginAttempts
  // ===========================================================================

  describe('getFailedLoginAttempts', () => {
    it('should return IP addresses with 3+ failed logins within the time window', async () => {
      const fakeRows = [
        {
          ip_address: '203.0.113.5',
          attempt_count: '5',
          last_attempt: new Date(),
          usernames_tried: ['alice', 'bob'],
        },
      ];
      mockQuery.mockResolvedValueOnce({ rows: fakeRows });

      const result = await getFailedLoginAttempts('30 minutes');

      expect(result).toEqual(fakeRows);
      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toMatch(/HAVING COUNT\(\*\) >= 3/);
      expect(params[0]).toBe(ACTION_TYPES.USER_LOGIN_FAILED);
      expect(params[1]).toBe('30 minutes');
    });
  });

  // ===========================================================================
  // cleanupOldLogs
  // ===========================================================================

  describe('cleanupOldLogs', () => {
    it('should delete old entries and return the row count', async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 42, rows: [] });

      const deleted = await cleanupOldLogs(10);

      expect(deleted).toBe(42);
      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toMatch(/DELETE FROM audit_log/);
      expect(params[0]).toBe(10);
    });

    it('should use default retention of 10 years when not specified', async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 0, rows: [] });

      await cleanupOldLogs();

      const params = mockQuery.mock.calls[0][1];
      expect(params[0]).toBe(10);
    });

    it('should log an info message with the count of cleaned-up entries', async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 7, rows: [] });

      await cleanupOldLogs(5);

      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('7'));
    });
  });
});
