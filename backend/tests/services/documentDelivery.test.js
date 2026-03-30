/**
 * Document Delivery Service Tests
 * Tests PDF generation, portal document creation, and delivery via email/SMS
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// ── Mocks ────────────────────────────────────────────────────────────────

const mockQuery = jest.fn();

jest.unstable_mockModule('../../src/config/database.js', () => ({
  query: mockQuery,
  default: { query: mockQuery },
}));

jest.unstable_mockModule('../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

const mockGenerateTreatmentSummary = jest.fn();
const mockGenerateReferralLetter = jest.fn();
const mockGenerateSickNote = jest.fn();
const mockGenerateInvoice = jest.fn();

jest.unstable_mockModule('../../src/services/clinical/pdfGenerator.js', () => ({
  generateTreatmentSummary: mockGenerateTreatmentSummary,
  generateReferralLetter: mockGenerateReferralLetter,
  generateSickNote: mockGenerateSickNote,
  generateInvoice: mockGenerateInvoice,
}));

const mockSendEmail = jest.fn();
jest.unstable_mockModule('../../src/services/communication/emailService.js', () => ({
  sendEmail: mockSendEmail,
}));

const mockSendSMS = jest.fn();
jest.unstable_mockModule('../../src/services/communication/smsService.js', () => ({
  sendSMS: mockSendSMS,
}));

// ── Import after mocks ──────────────────────────────────────────────────

let deliverDocument;

beforeEach(async () => {
  jest.clearAllMocks();
  const mod = await import('../../src/services/communication/documentDelivery.js');
  deliverDocument = mod.deliverDocument;
});

// ── Test data ────────────────────────────────────────────────────────────

const ORG_ID = 'org-11111111-1111-1111-1111-111111111111';
const PATIENT_ID = 'pat-22222222-2222-2222-2222-222222222222';
const DOC_ID = 'doc-33333333-3333-3333-3333-333333333333';

const mockPatient = {
  id: PATIENT_ID,
  first_name: 'Ola',
  last_name: 'Nordmann',
  email: 'ola@test.no',
  phone: '+4712345678',
};

const mockPortalDoc = {
  id: 'pdoc-44444444',
  download_token: 'abc123tokenvalue',
  title: 'Behandlingssammendrag',
  token_expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
};

/**
 * Set up standard mock chain for a successful email delivery of treatment_summary.
 * The query mock is called in this order:
 * 1. Patient lookup
 * 2. Encounter lookup (for PDF generation)
 * 3. PDF generation (via generateTreatmentSummary mock)
 * 4. Portal document INSERT
 * 5. Communications INSERT (email)
 */
function setupEmailDeliveryMocks() {
  // 1. Patient lookup
  mockQuery.mockResolvedValueOnce({ rows: [mockPatient] });
  // 2. Encounter lookup (generatePdf → treatment_summary branch)
  mockQuery.mockResolvedValueOnce({ rows: [{ patient_id: PATIENT_ID }] });
  // 3. Portal document INSERT
  mockQuery.mockResolvedValueOnce({ rows: [mockPortalDoc] });
  // 4. Communications INSERT (email)
  mockQuery.mockResolvedValueOnce({ rows: [{ id: 'comm-1' }] });
  // 5. Push notification device_tokens lookup (sendPushToPatient)
  mockQuery.mockResolvedValueOnce({ rows: [] });

  mockGenerateTreatmentSummary.mockResolvedValue(Buffer.from('fake-pdf-content'));
  mockSendEmail.mockResolvedValue({ messageId: 'msg-1' });
}

/**
 * Set up standard mock chain for a successful SMS delivery.
 */
function setupSmsDeliveryMocks() {
  mockQuery.mockResolvedValueOnce({ rows: [mockPatient] });
  mockQuery.mockResolvedValueOnce({ rows: [{ patient_id: PATIENT_ID }] });
  mockQuery.mockResolvedValueOnce({ rows: [mockPortalDoc] });
  mockQuery.mockResolvedValueOnce({ rows: [{ id: 'comm-2' }] });
  // Push notification device_tokens lookup (sendPushToPatient)
  mockQuery.mockResolvedValueOnce({ rows: [] });

  mockGenerateTreatmentSummary.mockResolvedValue(Buffer.from('fake-pdf-content'));
  mockSendSMS.mockResolvedValue({ sid: 'sms-1' });
}

// ── Tests ────────────────────────────────────────────────────────────────

describe('DocumentDelivery Service', () => {
  describe('deliverDocument', () => {
    it('should deliver document via email', async () => {
      setupEmailDeliveryMocks();

      const result = await deliverDocument(
        ORG_ID,
        'treatment_summary',
        DOC_ID,
        PATIENT_ID,
        'email',
        { userId: 'user-1' }
      );

      expect(result.portalDocumentId).toBe(mockPortalDoc.id);
      expect(result.downloadToken).toBe(mockPortalDoc.download_token);
      expect(result.deliveryStatus.email).toBe(true);
      expect(result.deliveryStatus.sms).toBe(false);

      // Verify sendEmail was called with correct args
      expect(mockSendEmail).toHaveBeenCalledTimes(1);
      const emailArgs = mockSendEmail.mock.calls[0][0];
      expect(emailArgs.to).toBe('ola@test.no');
      expect(emailArgs.subject).toContain('Behandlingssammendrag');
      expect(emailArgs.html).toContain('Ola');
      expect(emailArgs.attachments).toHaveLength(1);
      expect(emailArgs.attachments[0].contentType).toBe('application/pdf');

      // Verify communications log (4th query call; 5th is push token lookup)
      expect(mockQuery).toHaveBeenCalledTimes(5);
      const commCall = mockQuery.mock.calls[3];
      expect(commCall[0]).toContain('INSERT INTO communications');
      expect(commCall[1]).toContain('EMAIL');

      expect(mockSendSMS).not.toHaveBeenCalled();
    });

    it('should deliver document via SMS', async () => {
      setupSmsDeliveryMocks();

      const result = await deliverDocument(ORG_ID, 'treatment_summary', DOC_ID, PATIENT_ID, 'sms', {
        userId: 'user-1',
      });

      expect(result.deliveryStatus.sms).toBe(true);
      expect(result.deliveryStatus.email).toBe(false);

      // Verify sendSMS was called with correct args
      expect(mockSendSMS).toHaveBeenCalledTimes(1);
      const smsArgs = mockSendSMS.mock.calls[0][0];
      expect(smsArgs.to).toBe('+4712345678');
      expect(smsArgs.message).toContain('Ola');
      expect(smsArgs.message).toContain(mockPortalDoc.download_token);

      // Verify portal_documents row created (3rd query call)
      const portalInsertCall = mockQuery.mock.calls[2];
      expect(portalInsertCall[0]).toContain('INSERT INTO portal_documents');

      expect(mockSendEmail).not.toHaveBeenCalled();
    });

    it('should deliver via both email and SMS', async () => {
      // Patient lookup
      mockQuery.mockResolvedValueOnce({ rows: [mockPatient] });
      // Encounter lookup
      mockQuery.mockResolvedValueOnce({ rows: [{ patient_id: PATIENT_ID }] });
      // Portal document INSERT
      mockQuery.mockResolvedValueOnce({ rows: [mockPortalDoc] });
      // Communications INSERT (email)
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'comm-1' }] });
      // Communications INSERT (sms)
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'comm-2' }] });
      // Push notification device_tokens lookup
      mockQuery.mockResolvedValueOnce({ rows: [] });

      mockGenerateTreatmentSummary.mockResolvedValue(Buffer.from('fake-pdf'));
      mockSendEmail.mockResolvedValue({ messageId: 'msg-1' });
      mockSendSMS.mockResolvedValue({ sid: 'sms-1' });

      const result = await deliverDocument(
        ORG_ID,
        'treatment_summary',
        DOC_ID,
        PATIENT_ID,
        'both',
        { userId: 'user-1' }
      );

      expect(result.deliveryStatus.email).toBe(true);
      expect(result.deliveryStatus.sms).toBe(true);
      expect(mockSendEmail).toHaveBeenCalledTimes(1);
      expect(mockSendSMS).toHaveBeenCalledTimes(1);
    });

    it('should throw when patient not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(
        deliverDocument(ORG_ID, 'treatment_summary', DOC_ID, PATIENT_ID, 'email')
      ).rejects.toThrow('Patient not found');
    });

    it('should throw for invalid document type', async () => {
      await expect(
        deliverDocument(ORG_ID, 'invalid_type', DOC_ID, PATIENT_ID, 'email')
      ).rejects.toThrow('Invalid document type: invalid_type');
    });

    it('should throw when patient has no email for email delivery', async () => {
      const patientNoEmail = { ...mockPatient, email: null };
      mockQuery.mockResolvedValueOnce({ rows: [patientNoEmail] });
      mockQuery.mockResolvedValueOnce({ rows: [{ patient_id: PATIENT_ID }] });
      mockQuery.mockResolvedValueOnce({ rows: [mockPortalDoc] });

      mockGenerateTreatmentSummary.mockResolvedValue(Buffer.from('fake-pdf'));

      await expect(
        deliverDocument(ORG_ID, 'treatment_summary', DOC_ID, PATIENT_ID, 'email')
      ).rejects.toThrow('Patient has no email address');
    });

    it('should throw when patient has no phone for SMS delivery', async () => {
      const patientNoPhone = { ...mockPatient, phone: null };
      mockQuery.mockResolvedValueOnce({ rows: [patientNoPhone] });
      mockQuery.mockResolvedValueOnce({ rows: [{ patient_id: PATIENT_ID }] });
      mockQuery.mockResolvedValueOnce({ rows: [mockPortalDoc] });

      mockGenerateTreatmentSummary.mockResolvedValue(Buffer.from('fake-pdf'));

      await expect(
        deliverDocument(ORG_ID, 'treatment_summary', DOC_ID, PATIENT_ID, 'sms')
      ).rejects.toThrow('Patient has no phone number');
    });
  });
});
