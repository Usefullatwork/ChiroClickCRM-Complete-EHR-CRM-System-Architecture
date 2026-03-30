/**
 * Unit Tests for Document Delivery Service
 * Tests PDF generation, portal document creation, email/SMS/push delivery pipeline
 */

import { jest } from '@jest/globals';

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
jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// ── Mock PDF generator ────────────────────────────────────────────────────────
const mockGenerateTreatmentSummary = jest.fn();
const mockGenerateReferralLetter = jest.fn();
const mockGenerateSickNote = jest.fn();
const mockGenerateInvoice = jest.fn();

jest.unstable_mockModule('../../../src/services/clinical/pdfGenerator.js', () => ({
  generateTreatmentSummary: mockGenerateTreatmentSummary,
  generateReferralLetter: mockGenerateReferralLetter,
  generateSickNote: mockGenerateSickNote,
  generateInvoice: mockGenerateInvoice,
}));

// ── Mock email service ────────────────────────────────────────────────────────
const mockSendEmail = jest.fn();

jest.unstable_mockModule('../../../src/services/communication/emailService.js', () => ({
  sendEmail: mockSendEmail,
  default: { sendEmail: mockSendEmail },
}));

// ── Mock SMS service ──────────────────────────────────────────────────────────
const mockSendSMS = jest.fn();

jest.unstable_mockModule('../../../src/services/communication/smsService.js', () => ({
  sendSMS: mockSendSMS,
  default: { sendSMS: mockSendSMS },
}));

// ── Mock push notification (dynamic import — best-effort) ─────────────────────
const mockSendPushToPatient = jest.fn();

jest.unstable_mockModule('../../../src/services/communication/pushNotification.js', () => ({
  sendPushToPatient: mockSendPushToPatient,
  default: { sendPushToPatient: mockSendPushToPatient },
}));

// ── Mock exercise delivery (dynamic import for exercise_prescription) ─────────
const mockGeneratePrescriptionPDF = jest.fn();

jest.unstable_mockModule('../../../src/services/clinical/exerciseDelivery.js', () => ({
  generatePrescriptionPDF: mockGeneratePrescriptionPDF,
  default: { generatePrescriptionPDF: mockGeneratePrescriptionPDF },
}));

// ── Import after all mocks are set up ─────────────────────────────────────────
const { generatePdf, deliverDocument } =
  await import('../../../src/services/communication/documentDelivery.js');

// ── Test constants ─────────────────────────────────────────────────────────────
const ORG_ID = 'org-aaa-111';
const PATIENT_ID = 'pat-bbb-222';
const DOC_ID = 'doc-ccc-333';
const USER_ID = 'user-ddd-444';
const FAKE_BUFFER = Buffer.from('%PDF-1.4 fake content');

const MOCK_PATIENT = {
  id: PATIENT_ID,
  first_name: 'Ola',
  last_name: 'Nordmann',
  email: 'ola@example.no',
  phone: '+4799887766',
};

const MOCK_PORTAL_DOC = {
  id: 'pdoc-111',
  download_token: 'tok-aabbccddee',
  title: 'Behandlingssammendrag',
  token_expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000),
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Wire the three queries required by deliverDocument for email delivery:
 *   1. patients SELECT
 *   2. encounter/invoice SELECT inside generatePdf
 *   3. INSERT into portal_documents
 *   4. INSERT into communications (email log)
 */
function setupEmailDeliveryMocks(pdfBuffer = FAKE_BUFFER) {
  // 1. Patient lookup
  mockQuery.mockResolvedValueOnce({ rows: [MOCK_PATIENT] });
  // 2. Encounter lookup inside generatePdf (treatment_summary path)
  mockQuery.mockResolvedValueOnce({ rows: [{ patient_id: PATIENT_ID }] });
  // 3. Portal document insert
  mockQuery.mockResolvedValueOnce({ rows: [MOCK_PORTAL_DOC] });
  // 4. Communication log insert
  mockQuery.mockResolvedValueOnce({ rows: [{ id: 'comm-001' }] });

  mockGenerateTreatmentSummary.mockResolvedValue(pdfBuffer);
  mockSendEmail.mockResolvedValue({ messageId: 'msg-001' });
  mockSendPushToPatient.mockResolvedValue({ success: true, mock: true });
}

// =============================================================================
// generatePdf
// =============================================================================

describe('generatePdf', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('generates a treatment_summary PDF and returns buffer + filename', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ patient_id: PATIENT_ID }] });
    mockGenerateTreatmentSummary.mockResolvedValue(FAKE_BUFFER);

    const result = await generatePdf('treatment_summary', DOC_ID, ORG_ID);

    expect(result.buffer).toBe(FAKE_BUFFER);
    expect(result.filename).toMatch(/^treatment_summary_/);
    expect(result.filename).toMatch(/\.pdf$/);
    expect(mockGenerateTreatmentSummary).toHaveBeenCalledWith(PATIENT_ID, ORG_ID);
  });

  it('throws when encounter not found for treatment_summary', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await expect(generatePdf('treatment_summary', DOC_ID, ORG_ID)).rejects.toThrow(
      'Encounter not found for treatment summary'
    );
  });

  it('generates a referral_letter PDF', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: DOC_ID, organization_id: ORG_ID }] });
    mockGenerateReferralLetter.mockResolvedValue(FAKE_BUFFER);

    const result = await generatePdf('referral_letter', DOC_ID, ORG_ID);

    expect(result.buffer).toBe(FAKE_BUFFER);
    expect(mockGenerateReferralLetter).toHaveBeenCalledWith({
      orgId: ORG_ID,
      encounterId: DOC_ID,
    });
  });

  it('throws when encounter not found for referral_letter', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await expect(generatePdf('referral_letter', DOC_ID, ORG_ID)).rejects.toThrow(
      'Encounter not found for referral letter'
    );
  });

  it('generates a sick_note PDF', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ patient_id: PATIENT_ID }] });
    mockGenerateSickNote.mockResolvedValue(FAKE_BUFFER);

    const result = await generatePdf('sick_note', DOC_ID, ORG_ID);

    expect(result.buffer).toBe(FAKE_BUFFER);
    expect(mockGenerateSickNote).toHaveBeenCalledWith({
      patientId: PATIENT_ID,
      orgId: ORG_ID,
      encounterId: DOC_ID,
    });
  });

  it('throws when encounter not found for sick_note', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await expect(generatePdf('sick_note', DOC_ID, ORG_ID)).rejects.toThrow(
      'Encounter not found for sick note'
    );
  });

  it('generates an invoice PDF', async () => {
    const invoiceRow = { id: DOC_ID, organization_id: ORG_ID, patient_id: PATIENT_ID };
    mockQuery.mockResolvedValueOnce({ rows: [invoiceRow] });
    mockGenerateInvoice.mockResolvedValue(FAKE_BUFFER);

    const result = await generatePdf('invoice', DOC_ID, ORG_ID);

    expect(result.buffer).toBe(FAKE_BUFFER);
    expect(mockGenerateInvoice).toHaveBeenCalledWith(invoiceRow);
  });

  it('throws when invoice not found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await expect(generatePdf('invoice', DOC_ID, ORG_ID)).rejects.toThrow('Invoice not found');
  });

  it('generates an exercise_prescription PDF via dynamic import', async () => {
    mockGeneratePrescriptionPDF.mockResolvedValue(FAKE_BUFFER);

    const result = await generatePdf('exercise_prescription', DOC_ID, ORG_ID);

    expect(result.buffer).toBe(FAKE_BUFFER);
    expect(mockGeneratePrescriptionPDF).toHaveBeenCalledWith(ORG_ID, DOC_ID);
  });

  it('throws for unsupported document type', async () => {
    await expect(generatePdf('unknown_type', DOC_ID, ORG_ID)).rejects.toThrow(
      'Unsupported document type for PDF generation: unknown_type'
    );
  });
});

// =============================================================================
// deliverDocument
// =============================================================================

describe('deliverDocument', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Validation ──────────────────────────────────────────────────────────────

  it('throws for an invalid document type', async () => {
    await expect(deliverDocument(ORG_ID, 'bad_type', DOC_ID, PATIENT_ID, 'email')).rejects.toThrow(
      'Invalid document type: bad_type'
    );

    // No DB calls should have been made
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('throws when patient is not found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await expect(
      deliverDocument(ORG_ID, 'treatment_summary', DOC_ID, PATIENT_ID, 'email')
    ).rejects.toThrow('Patient not found');
  });

  // ── Email delivery ──────────────────────────────────────────────────────────

  it('delivers a document via email and returns delivery status', async () => {
    setupEmailDeliveryMocks();

    const result = await deliverDocument(ORG_ID, 'treatment_summary', DOC_ID, PATIENT_ID, 'email', {
      userId: USER_ID,
    });

    expect(result.deliveryStatus.email).toBe(true);
    expect(result.deliveryStatus.sms).toBe(false);
    expect(result.portalDocumentId).toBe(MOCK_PORTAL_DOC.id);
    expect(result.downloadToken).toBe(MOCK_PORTAL_DOC.download_token);

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    const emailCall = mockSendEmail.mock.calls[0][0];
    expect(emailCall.to).toBe(MOCK_PATIENT.email);
    expect(emailCall.subject).toContain('Behandlingssammendrag');
    expect(emailCall.attachments).toHaveLength(1);
    expect(emailCall.attachments[0].contentType).toBe('application/pdf');
  });

  it('throws when email delivery is requested but patient has no email', async () => {
    // 1. Patient lookup — patient without email
    mockQuery.mockResolvedValueOnce({
      rows: [{ ...MOCK_PATIENT, email: null }],
    });
    // 2. Encounter lookup for generatePdf
    mockQuery.mockResolvedValueOnce({ rows: [{ patient_id: PATIENT_ID }] });
    // 3. Portal document insert
    mockQuery.mockResolvedValueOnce({ rows: [MOCK_PORTAL_DOC] });

    mockGenerateTreatmentSummary.mockResolvedValue(FAKE_BUFFER);

    await expect(
      deliverDocument(ORG_ID, 'treatment_summary', DOC_ID, PATIENT_ID, 'email')
    ).rejects.toThrow('Patient has no email address');
  });

  // ── SMS delivery ────────────────────────────────────────────────────────────

  it('delivers a document via SMS and returns delivery status', async () => {
    // 1. Patient lookup
    mockQuery.mockResolvedValueOnce({ rows: [MOCK_PATIENT] });
    // 2. Encounter lookup
    mockQuery.mockResolvedValueOnce({ rows: [{ patient_id: PATIENT_ID }] });
    // 3. Portal doc insert
    mockQuery.mockResolvedValueOnce({ rows: [MOCK_PORTAL_DOC] });
    // 4. SMS communication log
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'comm-sms-001' }] });

    mockGenerateTreatmentSummary.mockResolvedValue(FAKE_BUFFER);
    mockSendSMS.mockResolvedValue({ externalId: 'sms-ext-1' });
    mockSendPushToPatient.mockResolvedValue({ success: true, mock: true });

    const result = await deliverDocument(ORG_ID, 'treatment_summary', DOC_ID, PATIENT_ID, 'sms', {
      userId: USER_ID,
    });

    expect(result.deliveryStatus.sms).toBe(true);
    expect(result.deliveryStatus.email).toBe(false);

    expect(mockSendSMS).toHaveBeenCalledTimes(1);
    const smsCall = mockSendSMS.mock.calls[0][0];
    expect(smsCall.to).toBe(MOCK_PATIENT.phone);
    expect(smsCall.message).toContain(MOCK_PATIENT.first_name);
    expect(smsCall.message).toContain('Behandlingssammendrag');
  });

  it('throws when SMS delivery is requested but patient has no phone', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ ...MOCK_PATIENT, phone: null }],
    });
    mockQuery.mockResolvedValueOnce({ rows: [{ patient_id: PATIENT_ID }] });
    mockQuery.mockResolvedValueOnce({ rows: [MOCK_PORTAL_DOC] });
    mockGenerateTreatmentSummary.mockResolvedValue(FAKE_BUFFER);

    await expect(
      deliverDocument(ORG_ID, 'treatment_summary', DOC_ID, PATIENT_ID, 'sms')
    ).rejects.toThrow('Patient has no phone number');
  });

  // ── Both channels ───────────────────────────────────────────────────────────

  it('delivers via both email and SMS when method is "both"', async () => {
    // 1. Patient
    mockQuery.mockResolvedValueOnce({ rows: [MOCK_PATIENT] });
    // 2. Encounter
    mockQuery.mockResolvedValueOnce({ rows: [{ patient_id: PATIENT_ID }] });
    // 3. Portal doc
    mockQuery.mockResolvedValueOnce({ rows: [MOCK_PORTAL_DOC] });
    // 4. Email communication log
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'comm-email-001' }] });
    // 5. SMS communication log
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'comm-sms-001' }] });

    mockGenerateTreatmentSummary.mockResolvedValue(FAKE_BUFFER);
    mockSendEmail.mockResolvedValue({ messageId: 'msg-001' });
    mockSendSMS.mockResolvedValue({ externalId: 'sms-ext-1' });
    mockSendPushToPatient.mockResolvedValue({ success: true, mock: true });

    const result = await deliverDocument(ORG_ID, 'treatment_summary', DOC_ID, PATIENT_ID, 'both', {
      userId: USER_ID,
    });

    expect(result.deliveryStatus.email).toBe(true);
    expect(result.deliveryStatus.sms).toBe(true);
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockSendSMS).toHaveBeenCalledTimes(1);
  });

  // ── Push notification ───────────────────────────────────────────────────────

  it('sends push notification as best-effort (does not throw if push fails)', async () => {
    setupEmailDeliveryMocks();
    mockSendPushToPatient.mockRejectedValue(new Error('Push service unavailable'));

    // Should not throw — push is best-effort
    const result = await deliverDocument(ORG_ID, 'treatment_summary', DOC_ID, PATIENT_ID, 'email', {
      userId: USER_ID,
    });

    expect(result.deliveryStatus.email).toBe(true);
  });

  // ── Communication logging ───────────────────────────────────────────────────

  it('logs a communication record for each delivered channel', async () => {
    setupEmailDeliveryMocks();

    await deliverDocument(ORG_ID, 'treatment_summary', DOC_ID, PATIENT_ID, 'email', {
      userId: USER_ID,
    });

    // Calls: patient SELECT, encounter SELECT, portal INSERT, comm INSERT
    const communicationInsert = mockQuery.mock.calls[3][0];
    expect(communicationInsert).toContain('INSERT INTO communications');
    const communicationParams = mockQuery.mock.calls[3][1];
    expect(communicationParams).toContain('EMAIL');
    expect(communicationParams).toContain(ORG_ID);
    expect(communicationParams).toContain(PATIENT_ID);
  });

  // ── Portal document creation ────────────────────────────────────────────────

  it('inserts a portal document with a download token', async () => {
    setupEmailDeliveryMocks();

    await deliverDocument(ORG_ID, 'treatment_summary', DOC_ID, PATIENT_ID, 'email', {
      userId: USER_ID,
    });

    const portalInsert = mockQuery.mock.calls[2][0];
    expect(portalInsert).toContain('INSERT INTO portal_documents');
    const portalParams = mockQuery.mock.calls[2][1];
    expect(portalParams).toContain(ORG_ID);
    expect(portalParams).toContain(PATIENT_ID);
    expect(portalParams).toContain('treatment_summary');
  });

  // ── Invoice delivery ────────────────────────────────────────────────────────

  it('delivers an invoice PDF via email', async () => {
    const invoiceRow = { id: DOC_ID, organization_id: ORG_ID, patient_id: PATIENT_ID };

    // 1. Patient
    mockQuery.mockResolvedValueOnce({ rows: [MOCK_PATIENT] });
    // 2. Invoice SELECT
    mockQuery.mockResolvedValueOnce({ rows: [invoiceRow] });
    // 3. Portal doc insert
    mockQuery.mockResolvedValueOnce({ rows: [{ ...MOCK_PORTAL_DOC, title: 'Faktura' }] });
    // 4. Email comm log
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'comm-inv-001' }] });

    mockGenerateInvoice.mockResolvedValue(FAKE_BUFFER);
    mockSendEmail.mockResolvedValue({ messageId: 'msg-inv-001' });
    mockSendPushToPatient.mockResolvedValue({ success: true, mock: true });

    const result = await deliverDocument(ORG_ID, 'invoice', DOC_ID, PATIENT_ID, 'email');

    expect(result.deliveryStatus.email).toBe(true);
    expect(mockGenerateInvoice).toHaveBeenCalledWith(invoiceRow);
  });
});
