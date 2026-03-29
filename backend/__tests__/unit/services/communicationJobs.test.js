/**
 * Unit Tests for Communication Jobs
 * Tests queue processing, appointment reminders, smart scheduling
 */

import { jest } from '@jest/globals';

jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

const mockQuery = jest.fn();
jest.unstable_mockModule('../../../src/config/database.js', () => ({
  query: mockQuery,
  default: { query: mockQuery },
}));

const {
  processCommunicationQueue,
  sendAppointmentReminders,
  processSmartScheduledComms,
  processAppointmentRemindersQueue,
} = await import('../../../src/jobs/communicationJobs.js');

describe('Communication Jobs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================================================
  // PROCESS COMMUNICATION QUEUE
  // ===========================================================================

  describe('processCommunicationQueue', () => {
    it('should skip when no communication services are available', async () => {
      const result = await processCommunicationQueue({});

      expect(result.skipped).toBe(true);
      expect(result.reason).toBe('service_not_available');
    });

    it('should process pending SMS items', async () => {
      const mockSendSMS = jest.fn().mockResolvedValue({});
      const services = {
        communicationsService: { sendSMS: mockSendSMS },
        bulkCommunicationService: {},
      };

      mockQuery
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'cq-1',
              patient_id: 'pat-1',
              type: 'SMS',
              phone: '+4712345678',
              email: null,
              content: 'Reminder',
              template_id: null,
              organization_id: 'org-1',
              subject: null,
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [{ patient_id: 'pat-1', sms_enabled: true }] })
        .mockResolvedValueOnce({ rows: [] }); // UPDATE sent

      const result = await processCommunicationQueue(services);

      expect(result.processed).toBe(1);
      expect(result.sent).toBe(1);
      expect(mockSendSMS).toHaveBeenCalledTimes(1);
    });

    it('should skip communication when patient opted out', async () => {
      const services = {
        communicationsService: { sendSMS: jest.fn() },
        bulkCommunicationService: {},
      };

      mockQuery
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'cq-2',
              patient_id: 'pat-2',
              type: 'SMS',
              phone: '+4798765432',
              content: 'Msg',
              organization_id: 'org-1',
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [{ patient_id: 'pat-2', sms_enabled: false }] })
        .mockResolvedValueOnce({ rows: [] }); // UPDATE skipped

      const result = await processCommunicationQueue(services);

      expect(result.skipped).toBe(1);
      expect(result.sent).toBe(0);
    });

    it('should handle send failure with retry logic', async () => {
      const mockSendSMS = jest.fn().mockRejectedValue(new Error('Gateway error'));
      const services = {
        communicationsService: { sendSMS: mockSendSMS },
        bulkCommunicationService: {},
      };

      mockQuery
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'cq-3',
              patient_id: 'pat-3',
              type: 'SMS',
              phone: '+4711111111',
              content: 'Test',
              organization_id: 'org-1',
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [{ patient_id: 'pat-3', sms_enabled: true }] })
        .mockResolvedValueOnce({ rows: [] }); // UPDATE retry

      const result = await processCommunicationQueue(services);

      expect(result.failed).toBe(1);
    });

    it('should process EMAIL type items', async () => {
      const mockSendEmail = jest.fn().mockResolvedValue({});
      const services = {
        communicationsService: { sendEmail: mockSendEmail },
        bulkCommunicationService: {},
      };

      mockQuery
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'cq-4',
              patient_id: 'pat-4',
              type: 'EMAIL',
              phone: null,
              email: 'test@example.com',
              content: 'Email content',
              subject: 'Reminder',
              template_id: null,
              organization_id: 'org-1',
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [{ patient_id: 'pat-4', email_enabled: true }] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await processCommunicationQueue(services);

      expect(result.sent).toBe(1);
      expect(mockSendEmail).toHaveBeenCalledTimes(1);
    });

    it('should handle empty queue', async () => {
      const services = {
        communicationsService: {},
        bulkCommunicationService: {},
      };

      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await processCommunicationQueue(services);

      expect(result.processed).toBe(0);
    });

    it('should throw on database error', async () => {
      const services = {
        communicationsService: {},
        bulkCommunicationService: {},
      };

      mockQuery.mockRejectedValueOnce(new Error('DB connection lost'));

      await expect(processCommunicationQueue(services)).rejects.toThrow('DB connection lost');
    });

    it('should fail when missing contact info for type', async () => {
      const services = {
        communicationsService: { sendSMS: jest.fn() },
        bulkCommunicationService: {},
      };

      mockQuery
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'cq-5',
              patient_id: 'pat-5',
              type: 'SMS',
              phone: null,
              email: null,
              content: 'Test',
              organization_id: 'org-1',
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [{ patient_id: 'pat-5', sms_enabled: true }] })
        .mockResolvedValueOnce({ rows: [] }); // UPDATE retry/failed

      const result = await processCommunicationQueue(services);

      expect(result.failed).toBe(1);
    });
  });

  // ===========================================================================
  // SEND APPOINTMENT REMINDERS
  // ===========================================================================

  describe('sendAppointmentReminders', () => {
    it('should skip when automations service is not available', async () => {
      const result = await sendAppointmentReminders({});

      expect(result.skipped).toBe(true);
    });

    it('should call checkAppointmentReminders on automations service', async () => {
      const mockCheck = jest.fn().mockResolvedValue({ sent: 3 });
      const services = { automationsService: { checkAppointmentReminders: mockCheck } };

      const result = await sendAppointmentReminders(services);

      expect(result).toEqual({ sent: 3 });
      expect(mockCheck).toHaveBeenCalledTimes(1);
    });

    it('should throw on service error', async () => {
      const services = {
        automationsService: {
          checkAppointmentReminders: jest.fn().mockRejectedValue(new Error('Service error')),
        },
      };

      await expect(sendAppointmentReminders(services)).rejects.toThrow('Service error');
    });
  });

  // ===========================================================================
  // PROCESS SMART SCHEDULED COMMS
  // ===========================================================================

  describe('processSmartScheduledComms', () => {
    it('should skip when smart scheduler service is not available', async () => {
      const result = await processSmartScheduledComms({});

      expect(result.skipped).toBe(true);
    });

    it('should call processDueCommunications on scheduler service', async () => {
      const mockProcess = jest.fn().mockResolvedValue({ sent: 2, failed: 0 });
      const services = { smartSchedulerService: { processDueCommunications: mockProcess } };

      const result = await processSmartScheduledComms(services);

      expect(result).toEqual({ sent: 2, failed: 0 });
    });

    it('should throw on service error', async () => {
      const services = {
        smartSchedulerService: {
          processDueCommunications: jest.fn().mockRejectedValue(new Error('Timeout')),
        },
      };

      await expect(processSmartScheduledComms(services)).rejects.toThrow('Timeout');
    });
  });

  // ===========================================================================
  // PROCESS APPOINTMENT REMINDERS QUEUE
  // ===========================================================================

  describe('processAppointmentRemindersQueue', () => {
    it('should skip when appointment reminders service is not available', async () => {
      const result = await processAppointmentRemindersQueue({});

      expect(result.skipped).toBe(true);
    });

    it('should call processReminders on appointment reminders service', async () => {
      const mockProcess = jest.fn().mockResolvedValue({ sent: 5, skipped: 1 });
      const services = { appointmentRemindersService: { processReminders: mockProcess } };

      const result = await processAppointmentRemindersQueue(services);

      expect(result).toEqual({ sent: 5, skipped: 1 });
    });

    it('should throw on service error', async () => {
      const services = {
        appointmentRemindersService: {
          processReminders: jest.fn().mockRejectedValue(new Error('Queue failed')),
        },
      };

      await expect(processAppointmentRemindersQueue(services)).rejects.toThrow('Queue failed');
    });
  });
});
