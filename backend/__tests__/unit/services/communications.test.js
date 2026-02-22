/**
 * Unit Tests for Communications Service
 * Tests SMS/email sending, template rendering, pagination, statistics
 */

import { jest } from '@jest/globals';

// Mock database
const mockQuery = jest.fn();

jest.unstable_mockModule('../../../src/config/database.js', () => ({
  query: mockQuery,
  transaction: jest.fn(),
  getClient: jest.fn(),
  healthCheck: jest.fn().mockResolvedValue(true),
  closePool: jest.fn(),
  setTenantContext: jest.fn(),
  clearTenantContext: jest.fn(),
  queryWithTenant: jest.fn(),
  default: {
    query: mockQuery,
    transaction: jest.fn(),
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

// Mock SMS and Email providers
// These are created once and persist because the communications module captures
// the provider object at import time. We use stable functions that delegate to
// replaceable inner functions so resetMocks doesn't break them.
let smsSendImpl = () => Promise.resolve({ externalId: 'sms-ext-1', method: 'mock' });
let smsCheckImpl = () => Promise.resolve({ connected: true });
let emailSendImpl = () => Promise.resolve({ messageId: 'email-ext-1' });
let emailCheckImpl = () => Promise.resolve({ connected: true });

const mockSmsSend = (...args) => smsSendImpl(...args);
const mockSmsCheck = (...args) => smsCheckImpl(...args);
const mockEmailSend = (...args) => emailSendImpl(...args);
const mockEmailCheck = (...args) => emailCheckImpl(...args);

jest.unstable_mockModule('../../../src/services/providers/smsProvider.js', () => ({
  createSmsProvider: () => ({
    name: 'mock',
    send: mockSmsSend,
    checkConnection: mockSmsCheck,
  }),
}));

jest.unstable_mockModule('../../../src/services/providers/emailProvider.js', () => ({
  createEmailProvider: () => ({
    name: 'mock',
    send: mockEmailSend,
    checkConnection: mockEmailCheck,
  }),
}));

// Import after mocking
const commsService = await import('../../../src/services/communications.js');

describe('Communications Service', () => {
  const testOrgId = 'org-test-001';

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset provider implementations to defaults
    smsSendImpl = () => Promise.resolve({ externalId: 'sms-ext-1', method: 'mock' });
    smsCheckImpl = () => Promise.resolve({ connected: true });
    emailSendImpl = () => Promise.resolve({ messageId: 'email-ext-1' });
    emailCheckImpl = () => Promise.resolve({ connected: true });
  });

  // =============================================================================
  // GET ALL COMMUNICATIONS
  // =============================================================================

  describe('getAllCommunications', () => {
    it('should return paginated communications with defaults', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '3' }] }).mockResolvedValueOnce({
        rows: [
          { id: 'com-1', type: 'SMS', patient_name: 'Ola Nordmann' },
          { id: 'com-2', type: 'EMAIL', patient_name: 'Kari Hansen' },
          { id: 'com-3', type: 'SMS', patient_name: 'Per Olsen' },
        ],
      });

      const result = await commsService.getAllCommunications(testOrgId);

      expect(result.communications).toHaveLength(3);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.total).toBe(3);
    });

    it('should filter by type', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '2' }] }).mockResolvedValueOnce({
        rows: [
          { id: 'com-1', type: 'SMS' },
          { id: 'com-2', type: 'SMS' },
        ],
      });

      const result = await commsService.getAllCommunications(testOrgId, { type: 'SMS' });

      expect(result.communications).toHaveLength(2);
      const whereParams = mockQuery.mock.calls[0][1];
      expect(whereParams).toContain('SMS');
    });

    it('should filter by patient ID', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'com-1' }] });

      await commsService.getAllCommunications(testOrgId, { patientId: 'pat-123' });

      const whereParams = mockQuery.mock.calls[0][1];
      expect(whereParams).toContain('pat-123');
    });

    it('should filter by date range', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '5' }] })
        .mockResolvedValueOnce({ rows: [] });

      await commsService.getAllCommunications(testOrgId, {
        startDate: '2026-02-01',
        endDate: '2026-02-28',
      });

      const countParams = mockQuery.mock.calls[0][1];
      expect(countParams).toContain('2026-02-01');
      expect(countParams).toContain('2026-02-28');
    });

    it('should handle empty result', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await commsService.getAllCommunications(testOrgId);

      expect(result.communications).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.pages).toBe(0);
    });

    it('should throw on database error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB error'));

      await expect(commsService.getAllCommunications(testOrgId)).rejects.toThrow('DB error');
    });
  });

  // =============================================================================
  // SEND SMS
  // =============================================================================

  describe('sendSMS', () => {
    it('should send SMS and log in database', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'com-sms-1',
            type: 'SMS',
            direction: 'OUTBOUND',
            content: 'Test message',
          },
        ],
      });

      const result = await commsService.sendSMS(
        testOrgId,
        {
          patient_id: 'pat-1',
          recipient_phone: '+4712345678',
          content: 'Test message',
        },
        'user-1'
      );

      expect(result).toBeDefined();
      expect(result.type).toBe('SMS');
      expect(result.provider).toBe('mock');
    });

    it('should log failed SMS attempts', async () => {
      smsSendImpl = () => Promise.reject(new Error('SMS delivery failed'));
      // Failed attempt insert
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(
        commsService.sendSMS(
          testOrgId,
          {
            patient_id: 'pat-1',
            recipient_phone: '+4712345678',
            content: 'Test',
          },
          'user-1'
        )
      ).rejects.toThrow('SMS delivery failed');

      // Should log the failed attempt
      expect(mockQuery).toHaveBeenCalledTimes(1);
      const failedInsert = mockQuery.mock.calls[0][0];
      expect(failedInsert).toContain('failure_reason');
    });
  });

  // =============================================================================
  // SEND EMAIL
  // =============================================================================

  describe('sendEmail', () => {
    it('should send email and log in database', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'com-email-1',
            type: 'EMAIL',
            direction: 'OUTBOUND',
            subject: 'Test subject',
          },
        ],
      });

      const result = await commsService.sendEmail(
        testOrgId,
        {
          patient_id: 'pat-1',
          recipient_email: 'test@example.com',
          subject: 'Test subject',
          content: 'Test body',
        },
        'user-1'
      );

      expect(result).toBeDefined();
      expect(result.type).toBe('EMAIL');
    });

    it('should log failed email attempts', async () => {
      emailSendImpl = () => Promise.reject(new Error('Email delivery failed'));
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(
        commsService.sendEmail(
          testOrgId,
          {
            patient_id: 'pat-1',
            recipient_email: 'test@example.com',
            subject: 'Test',
            content: 'Body',
          },
          'user-1'
        )
      ).rejects.toThrow('Email delivery failed');
    });
  });

  // =============================================================================
  // TEMPLATES
  // =============================================================================

  describe('getTemplates', () => {
    it('should return active templates for organization', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { id: 'tpl-1', name: 'Appointment Reminder', type: 'SMS' },
          { id: 'tpl-2', name: 'Welcome Email', type: 'EMAIL' },
        ],
      });

      const result = await commsService.getTemplates(testOrgId);

      expect(result).toHaveLength(2);
    });

    it('should filter by type', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'tpl-1', name: 'SMS Template', type: 'SMS' }],
      });

      const result = await commsService.getTemplates(testOrgId, 'SMS');

      expect(result).toHaveLength(1);
      const queryParams = mockQuery.mock.calls[0][1];
      expect(queryParams).toContain('SMS');
    });
  });

  describe('createTemplate', () => {
    it('should create a message template', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'tpl-new',
            name: 'New Template',
            type: 'SMS',
            body: 'Hello {{name}}!',
          },
        ],
      });

      const result = await commsService.createTemplate(testOrgId, {
        name: 'New Template',
        type: 'SMS',
        body: 'Hello {{name}}!',
        language: 'NO',
      });

      expect(result).toBeDefined();
      expect(result.name).toBe('New Template');
    });
  });

  // =============================================================================
  // STATISTICS
  // =============================================================================

  describe('getCommunicationStats', () => {
    it('should return communication statistics by type', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            type: 'SMS',
            total: '10',
            delivered: '9',
            failed: '1',
            opened: '0',
            clicked: '0',
            resulted_in_booking: '3',
          },
          {
            type: 'EMAIL',
            total: '5',
            delivered: '5',
            failed: '0',
            opened: '4',
            clicked: '2',
            resulted_in_booking: '1',
          },
        ],
      });

      const result = await commsService.getCommunicationStats(
        testOrgId,
        '2026-02-01',
        '2026-02-28'
      );

      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('SMS');
      expect(result[1].type).toBe('EMAIL');
    });

    it('should throw on database error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Stats error'));

      await expect(
        commsService.getCommunicationStats(testOrgId, '2026-02-01', '2026-02-28')
      ).rejects.toThrow('Stats error');
    });
  });

  // =============================================================================
  // CONNECTIVITY CHECK
  // =============================================================================

  describe('checkConnectivity', () => {
    it('should return connectivity status for both providers', async () => {
      const result = await commsService.checkConnectivity();

      expect(result).toBeDefined();
      expect(result.phone).toBeDefined();
      expect(result.email).toBeDefined();
      expect(result.overall).toBe(true);
    });

    it('should report disconnected when providers fail', async () => {
      smsCheckImpl = () => Promise.resolve({ connected: false });
      emailCheckImpl = () => Promise.resolve({ connected: false });

      const result = await commsService.checkConnectivity();

      expect(result.overall).toBe(false);
    });
  });
});
