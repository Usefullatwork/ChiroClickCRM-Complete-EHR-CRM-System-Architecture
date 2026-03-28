/**
 * Unit Tests for Email Service
 * Tests email sending, template compilation, bulk send, tracking, and error handling
 */

import { jest } from '@jest/globals';

// ── Set SMTP env vars so initializeTransporter() creates a transporter ────────
process.env.SMTP_HOST = 'smtp.test.local';
process.env.SMTP_PORT = '587';
process.env.SMTP_USER = 'testuser';
process.env.SMTP_PASSWORD = 'testpass';

// ── Mock database ─────────────────────────────────────────────────────────────
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

// ── Mock logger ───────────────────────────────────────────────────────────────
const mockLogInfo = jest.fn();
const mockLogWarn = jest.fn();
const mockLogError = jest.fn();
const mockLogDebug = jest.fn();

jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  default: {
    info: (...args) => mockLogInfo(...args),
    warn: (...args) => mockLogWarn(...args),
    error: (...args) => mockLogError(...args),
    debug: (...args) => mockLogDebug(...args),
  },
}));

// ── Mock nodemailer ───────────────────────────────────────────────────────────
// Use the delegation pattern to survive resetMocks:
// stable outer functions delegate to replaceable inner impls.
let sendMailImpl = () =>
  Promise.resolve({ messageId: 'test-msg-id', accepted: ['test@example.com'], rejected: [] });
let verifyImpl = () => Promise.resolve(true);

const mockSendMail = (...args) => sendMailImpl(...args);
const mockVerify = (...args) => {
  // Support both callback style (module-level init) and promise style (verifyConfiguration)
  if (typeof args[0] === 'function') {
    // callback style
    args[0](null, true);
    return;
  }
  return verifyImpl(...args);
};

// createTransport is called once at module init — return our mock transport
const mockTransportObject = {
  sendMail: mockSendMail,
  verify: mockVerify,
};

jest.unstable_mockModule('nodemailer', () => ({
  default: {
    createTransport: () => mockTransportObject,
  },
  createTransport: () => mockTransportObject,
}));

// ── Mock fs/promises ──────────────────────────────────────────────────────────
let readFileImpl = () => Promise.resolve('<html><body>Hello {{name}}</body></html>');

jest.unstable_mockModule('fs/promises', () => ({
  default: {
    readFile: (...args) => readFileImpl(...args),
  },
  readFile: (...args) => readFileImpl(...args),
}));

// ── Import after all mocks ───────────────────────────────────────────────────
const {
  sendEmail,
  sendTemplatedEmail,
  sendBulkEmails,
  compileTemplate,
  verifyConfiguration,
  trackOpen,
  trackClick,
  sendExerciseProgramEmail,
  sendAppointmentReminderEmail,
} = await import('../../../src/services/emailService.js');

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Email Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset delegation impls to defaults
    sendMailImpl = () =>
      Promise.resolve({ messageId: 'test-msg-id', accepted: ['test@example.com'], rejected: [] });
    verifyImpl = () => Promise.resolve(true);
    readFileImpl = () => Promise.resolve('<html><body>Hello {{name}}</body></html>');
    mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });
  });

  // ===========================================================================
  // compileTemplate
  // ===========================================================================

  describe('compileTemplate', () => {
    it('should replace simple {{variable}} placeholders', async () => {
      readFileImpl = () => Promise.resolve('<p>Hello {{name}}, welcome to {{clinic}}</p>');

      const result = await compileTemplate('test', { name: 'Ola', clinic: 'ChiroClick' });

      expect(result).toBe('<p>Hello Ola, welcome to ChiroClick</p>');
    });

    it('should handle conditional {{#if}} blocks', async () => {
      readFileImpl = () => Promise.resolve('<p>Hi{{#if showGreeting}} there{{/if}}</p>');

      const withCondition = await compileTemplate('test', { showGreeting: true });
      expect(withCondition).toBe('<p>Hi there</p>');

      const withoutCondition = await compileTemplate('test', { showGreeting: false });
      expect(withoutCondition).toBe('<p>Hi</p>');
    });

    it('should handle {{#each}} loops with item properties', async () => {
      readFileImpl = () =>
        Promise.resolve('<ul>{{#each items}}<li>{{name}}: {{value}}</li>{{/each}}</ul>');

      const result = await compileTemplate('test', {
        items: [
          { name: 'A', value: '1' },
          { name: 'B', value: '2' },
        ],
      });

      expect(result).toBe('<ul><li>A: 1</li><li>B: 2</li></ul>');
    });

    it('should replace {{@index}} and {{@number}} in loops', async () => {
      readFileImpl = () =>
        Promise.resolve('{{#each items}}<span>{{@index}}-{{@number}}</span>{{/each}}');

      const result = await compileTemplate('test', {
        items: [{ x: '1' }, { x: '2' }],
      });

      expect(result).toBe('<span>0-1</span><span>1-2</span>');
    });

    it('should throw when template file does not exist', async () => {
      readFileImpl = () => Promise.reject(new Error('ENOENT: file not found'));

      await expect(compileTemplate('nonexistent', {})).rejects.toThrow(
        'Failed to compile email template: nonexistent'
      );
    });

    it('should replace missing variables with empty string', async () => {
      readFileImpl = () => Promise.resolve('<p>Hello {{name}}</p>');

      const result = await compileTemplate('test', { name: undefined });
      expect(result).toBe('<p>Hello </p>');
    });
  });

  // ===========================================================================
  // sendEmail
  // ===========================================================================

  describe('sendEmail', () => {
    it('should throw when required fields are missing', async () => {
      await expect(sendEmail({ to: 'a@b.com', subject: 'Hi' })).rejects.toThrow(
        'Missing required email fields: to, subject, html'
      );

      await expect(sendEmail({ to: 'a@b.com', html: '<p>Hi</p>' })).rejects.toThrow(
        'Missing required email fields: to, subject, html'
      );

      await expect(sendEmail({ subject: 'Hi', html: '<p>Hi</p>' })).rejects.toThrow(
        'Missing required email fields: to, subject, html'
      );
    });

    it('should send email via transporter and return success result', async () => {
      const result = await sendEmail({
        to: 'patient@example.com',
        subject: 'Test',
        html: '<p>Hello</p>',
      });

      expect(result.success).toBe(true);
      expect(result.provider).toBe('smtp');
      expect(result.messageId).toBe('test-msg-id');
      expect(result.accepted).toEqual(['test@example.com']);
    });

    it('should auto-generate plain text from HTML (strip tags)', async () => {
      // sendEmail passes text through stripHtml internally; we just verify it doesn't crash
      const result = await sendEmail({
        to: 'patient@example.com',
        subject: 'Test',
        html: '<p>Hello <strong>World</strong></p>',
      });

      expect(result.success).toBe(true);
    });

    it('should propagate transporter errors', async () => {
      sendMailImpl = () => Promise.reject(new Error('SMTP connection refused'));

      await expect(
        sendEmail({ to: 'a@b.com', subject: 'Test', html: '<p>Hi</p>' })
      ).rejects.toThrow('SMTP connection refused');
    });

    it('should map attachments correctly', async () => {
      let capturedOptions;
      sendMailImpl = (opts) => {
        capturedOptions = opts;
        return Promise.resolve({ messageId: 'att-msg', accepted: [], rejected: [] });
      };

      await sendEmail({
        to: 'a@b.com',
        subject: 'With attachment',
        html: '<p>See attached</p>',
        attachments: [
          { filename: 'report.pdf', content: Buffer.from('pdf'), contentType: 'application/pdf' },
        ],
      });

      expect(capturedOptions.attachments).toHaveLength(1);
      expect(capturedOptions.attachments[0].filename).toBe('report.pdf');
      expect(capturedOptions.attachments[0].contentType).toBe('application/pdf');
    });
  });

  // ===========================================================================
  // sendTemplatedEmail
  // ===========================================================================

  describe('sendTemplatedEmail', () => {
    it('should compile template then send email', async () => {
      readFileImpl = () => Promise.resolve('<p>Hello {{patientName}}</p>');

      const result = await sendTemplatedEmail('welcome', {
        to: 'patient@example.com',
        subject: 'Welcome',
        variables: { patientName: 'Kari' },
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('test-msg-id');
    });
  });

  // ===========================================================================
  // sendBulkEmails
  // ===========================================================================

  describe('sendBulkEmails', () => {
    it('should send multiple emails and track results', async () => {
      const emails = [
        { to: 'a@b.com', subject: 'Test 1', html: '<p>1</p>' },
        { to: 'c@d.com', subject: 'Test 2', html: '<p>2</p>' },
      ];

      const result = await sendBulkEmails(emails, 0);

      expect(result.total).toBe(2);
      expect(result.sent).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.details).toHaveLength(2);
    });

    it('should count failures when individual emails throw', async () => {
      let callCount = 0;
      sendMailImpl = () => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Temporary failure'));
        }
        return Promise.resolve({ messageId: 'ok', accepted: [], rejected: [] });
      };

      const emails = [
        { to: 'fail@b.com', subject: 'Fail', html: '<p>fail</p>' },
        { to: 'ok@b.com', subject: 'OK', html: '<p>ok</p>' },
      ];

      const result = await sendBulkEmails(emails, 0);

      expect(result.total).toBe(2);
      expect(result.failed).toBe(1);
      expect(result.sent).toBe(1);
      expect(result.details[0].success).toBe(false);
      expect(result.details[0].error).toBe('Temporary failure');
    });
  });

  // ===========================================================================
  // trackOpen / trackClick
  // ===========================================================================

  describe('trackOpen', () => {
    it('should execute UPDATE query for email open tracking', async () => {
      mockQuery.mockResolvedValue({ rowCount: 1 });

      await trackOpen('email-123');

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('UPDATE communications'), [
        'email-123',
      ]);
    });

    it('should not throw when query fails (logs error instead)', async () => {
      mockQuery.mockRejectedValue(new Error('DB error'));

      // Should not throw
      await trackOpen('email-123');

      expect(mockLogError).toHaveBeenCalledWith('Error tracking email open:', expect.any(Error));
    });
  });

  describe('trackClick', () => {
    it('should execute UPDATE query for email click tracking', async () => {
      mockQuery.mockResolvedValue({ rowCount: 1 });

      await trackClick('email-456', 'https://example.com/link');

      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('UPDATE communications'), [
        'email-456',
      ]);
    });

    it('should not throw when query fails (logs error instead)', async () => {
      mockQuery.mockRejectedValue(new Error('DB error'));

      await trackClick('email-456', 'https://example.com/link');

      expect(mockLogError).toHaveBeenCalledWith('Error tracking email click:', expect.any(Error));
    });
  });

  // ===========================================================================
  // verifyConfiguration
  // ===========================================================================

  describe('verifyConfiguration', () => {
    it('should return configuration status object', async () => {
      const status = await verifyConfiguration();

      expect(status).toHaveProperty('configured');
      expect(status).toHaveProperty('verified');
      expect(status).toHaveProperty('host');
      expect(status).toHaveProperty('port');
      expect(status).toHaveProperty('secure');
    });
  });

  // ===========================================================================
  // sendExerciseProgramEmail
  // ===========================================================================

  describe('sendExerciseProgramEmail', () => {
    it('should format exercises and send templated email', async () => {
      readFileImpl = () =>
        Promise.resolve('<p>Hello {{patientFirstName}}, exercises: {{exerciseCount}}</p>');

      const result = await sendExerciseProgramEmail({
        patient: { firstName: 'Ola', lastName: 'Nordmann', email: 'ola@example.com' },
        prescription: {
          exercises: [
            { exercise: { nameNorwegian: 'Strekk', instructions: 'Strekk ut' }, sets: 3, reps: 10 },
          ],
          prescribed_by_name: 'Dr. Hansen',
          prescribed_at: '2026-01-15T10:00:00Z',
          patient_instructions: 'Gjor ovelsene daglig',
        },
        organization: { name: 'TestKlinikk', phone: '+47 12345678', email: 'klinikk@test.no' },
        portalLink: 'https://app.chiroclick.no/portal/abc',
      });

      expect(result.success).toBe(true);
    });

    it('should include PDF attachment when provided', async () => {
      readFileImpl = () => Promise.resolve('<p>{{patientFirstName}}</p>');
      let capturedOptions;
      sendMailImpl = (opts) => {
        capturedOptions = opts;
        return Promise.resolve({ messageId: 'pdf-msg', accepted: [], rejected: [] });
      };

      await sendExerciseProgramEmail({
        patient: { firstName: 'Kari', lastName: 'Olsen', email: 'kari@example.com' },
        prescription: { exercises: [], prescribed_by_name: 'Dr. Berg' },
        organization: { name: 'Klinikk' },
        portalLink: 'https://link',
        pdfAttachment: Buffer.from('fake-pdf'),
      });

      expect(capturedOptions.attachments).toHaveLength(1);
      expect(capturedOptions.attachments[0].contentType).toBe('application/pdf');
    });
  });

  // ===========================================================================
  // sendAppointmentReminderEmail
  // ===========================================================================

  describe('sendAppointmentReminderEmail', () => {
    it('should format appointment details and send reminder', async () => {
      readFileImpl = () =>
        Promise.resolve('<p>Hi {{patientFirstName}}, your appointment: {{appointmentDate}}</p>');

      const result = await sendAppointmentReminderEmail({
        patient: { firstName: 'Per', email: 'per@example.com' },
        appointment: {
          id: 'apt-1',
          start_time: '2026-04-01T14:30:00Z',
          type: 'Konsultasjon',
          duration: 30,
        },
        organization: { name: 'HelseKlinikk' },
        provider: { firstName: 'Dr', lastName: 'Hansen' },
      });

      expect(result.success).toBe(true);
    });
  });
});
