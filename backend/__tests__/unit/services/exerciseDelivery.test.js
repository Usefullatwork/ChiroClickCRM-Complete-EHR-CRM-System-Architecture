/**
 * Unit Tests for Exercise Delivery Service
 * Tests PDF generation, email delivery, exercise reminders, and SMS portal links
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

// ── Mock PDFDocument ──────────────────────────────────────────────────────────
// Use delegation pattern so jest.clearAllMocks() does not break chaining.
// The outer functions are stable; the inner `textCalls` array captures arguments.
const textCalls = [];
let onDataCb = null;
let onEndCb = null;
let onErrorCb = null;

const mockPDFInstance = {};

// All chainable methods return mockPDFInstance
const chainMethods = [
  'fontSize',
  'font',
  'text',
  'moveDown',
  'moveTo',
  'lineTo',
  'stroke',
  'strokeColor',
  'fillColor',
  'addPage',
];
for (const m of chainMethods) {
  mockPDFInstance[m] = jest.fn((...args) => {
    if (m === 'text') textCalls.push(args);
    return mockPDFInstance;
  });
}

mockPDFInstance.on = jest.fn((event, cb) => {
  if (event === 'data') onDataCb = cb;
  if (event === 'end') onEndCb = cb;
  if (event === 'error') onErrorCb = cb;
});

mockPDFInstance.end = jest.fn(() => {
  if (onDataCb) onDataCb(Buffer.from('fake-pdf-chunk'));
  if (onEndCb) onEndCb();
});

mockPDFInstance.y = 100;

const mockPDFConstructor = jest.fn(() => mockPDFInstance);

jest.unstable_mockModule('pdfkit', () => ({
  default: mockPDFConstructor,
}));

/**
 * Re-wire all mock implementations after jest.clearAllMocks().
 * Must be called inside every beforeEach.
 */
function resetPDFMock() {
  textCalls.length = 0;
  onDataCb = null;
  onEndCb = null;
  onErrorCb = null;

  // Re-establish constructor
  mockPDFConstructor.mockImplementation(() => mockPDFInstance);

  for (const m of chainMethods) {
    mockPDFInstance[m].mockImplementation((...args) => {
      if (m === 'text') textCalls.push(args);
      return mockPDFInstance;
    });
  }

  mockPDFInstance.on.mockImplementation((event, cb) => {
    if (event === 'data') onDataCb = cb;
    if (event === 'end') onEndCb = cb;
    if (event === 'error') onErrorCb = cb;
  });

  mockPDFInstance.end.mockImplementation(() => {
    if (onDataCb) onDataCb(Buffer.from('fake-pdf-chunk'));
    if (onEndCb) onEndCb();
  });
}

// ── Mock email service ────────────────────────────────────────────────────────
const mockSendEmail = jest.fn();

jest.unstable_mockModule('../../../src/services/communication/emailService.js', () => ({
  sendEmail: mockSendEmail,
  default: { sendEmail: mockSendEmail },
}));

// ── Mock exercise library service ─────────────────────────────────────────────
const mockGetPrescriptionById = jest.fn();
const mockUpdatePrescriptionEmailStatus = jest.fn();

jest.unstable_mockModule('../../../src/services/clinical/exerciseLibrary.js', () => ({
  default: {
    getPrescriptionById: mockGetPrescriptionById,
    updatePrescriptionEmailStatus: mockUpdatePrescriptionEmailStatus,
  },
  getPrescriptionById: mockGetPrescriptionById,
  updatePrescriptionEmailStatus: mockUpdatePrescriptionEmailStatus,
}));

// ── Mock SMS service (dynamically imported in source) ─────────────────────────
const mockSendSMS = jest.fn();

jest.unstable_mockModule('../../../src/services/communication/smsService.js', () => ({
  sendSMS: mockSendSMS,
  default: { sendSMS: mockSendSMS },
}));

// ── Import after all mocks are set up ─────────────────────────────────────────
const { generatePrescriptionPDF, sendPrescriptionEmail, sendExerciseReminder, sendPortalSMS } =
  await import('../../../src/services/clinical/exerciseDelivery.js');

// ── Test constants ────────────────────────────────────────────────────────────
const ORG_ID = 'org-test-001';
const PRESCRIPTION_ID = 'presc-test-001';
const PATIENT_ID = 'pat-test-001';

const MOCK_ORG = {
  name: 'Test Klinikk',
  address: 'Testveien 1, 0123 Oslo',
  phone: '+4722334455',
  email: 'klinikk@test.no',
  logo_url: null,
};

const MOCK_PRESCRIPTION = {
  id: PRESCRIPTION_ID,
  patient_id: PATIENT_ID,
  patient_name: 'Ola Nordmann',
  patient_email: 'ola@example.no',
  prescribed_by_name: 'Dr. Hansen',
  prescribed_at: '2026-01-15T10:00:00Z',
  patient_instructions: 'Gjor ovelsene to ganger daglig',
  portal_access_token: 'tok-abc-123',
  exercises: [
    {
      sets: 3,
      reps: 12,
      holdSeconds: null,
      frequencyPerDay: 2,
      customInstructions: null,
      exercise: {
        name: 'Bridge',
        nameNorwegian: 'Broovelse',
        category: 'Styrke',
        difficultyLevel: 'beginner',
        instructions: 'Lie on your back and lift hips',
        instructionsNorwegian: 'Ligg pa ryggen og loft hoftene',
        precautions: [],
      },
    },
  ],
};

// =============================================================================
// generatePrescriptionPDF
// =============================================================================

describe('generatePrescriptionPDF', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetPDFMock();
  });

  it('should generate a PDF buffer for a valid prescription', async () => {
    mockGetPrescriptionById.mockResolvedValue(MOCK_PRESCRIPTION);
    mockQuery.mockResolvedValueOnce({ rows: [MOCK_ORG] });

    const result = await generatePrescriptionPDF(ORG_ID, PRESCRIPTION_ID);

    expect(Buffer.isBuffer(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(mockGetPrescriptionById).toHaveBeenCalledWith(ORG_ID, PRESCRIPTION_ID);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('SELECT name, address, phone, email, logo_url'),
      [ORG_ID]
    );
  });

  it('should throw when prescription is not found', async () => {
    mockGetPrescriptionById.mockResolvedValue(null);

    await expect(generatePrescriptionPDF(ORG_ID, PRESCRIPTION_ID)).rejects.toThrow(
      'Prescription not found'
    );
  });

  it('should render exercise details including Norwegian names', async () => {
    mockGetPrescriptionById.mockResolvedValue(MOCK_PRESCRIPTION);
    mockQuery.mockResolvedValueOnce({ rows: [MOCK_ORG] });

    await generatePrescriptionPDF(ORG_ID, PRESCRIPTION_ID);

    // Check captured text calls for the Norwegian exercise name
    const hasExerciseName = textCalls.some(
      (args) => typeof args[0] === 'string' && args[0].includes('Broovelse')
    );
    expect(hasExerciseName).toBe(true);
  });

  it('should render patient instructions when present', async () => {
    mockGetPrescriptionById.mockResolvedValue(MOCK_PRESCRIPTION);
    mockQuery.mockResolvedValueOnce({ rows: [MOCK_ORG] });

    await generatePrescriptionPDF(ORG_ID, PRESCRIPTION_ID);

    const hasInstructions = textCalls.some(
      (args) => args[0] === MOCK_PRESCRIPTION.patient_instructions
    );
    expect(hasInstructions).toBe(true);
  });

  it('should render precautions when exercise has them', async () => {
    const prescriptionWithPrecautions = {
      ...MOCK_PRESCRIPTION,
      exercises: [
        {
          ...MOCK_PRESCRIPTION.exercises[0],
          exercise: {
            ...MOCK_PRESCRIPTION.exercises[0].exercise,
            precautions: ['Unnga ved akutt smerte', 'Stopp ved svimmelhet'],
          },
        },
      ],
    };
    mockGetPrescriptionById.mockResolvedValue(prescriptionWithPrecautions);
    mockQuery.mockResolvedValueOnce({ rows: [MOCK_ORG] });

    await generatePrescriptionPDF(ORG_ID, PRESCRIPTION_ID);

    const hasPrecautions = textCalls.some(
      (args) => typeof args[0] === 'string' && args[0].includes('Unnga ved akutt smerte')
    );
    expect(hasPrecautions).toBe(true);
  });
});

// =============================================================================
// sendPrescriptionEmail
// =============================================================================

describe('sendPrescriptionEmail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetPDFMock();
  });

  it('should send email with PDF attachment and return success', async () => {
    mockGetPrescriptionById.mockResolvedValue(MOCK_PRESCRIPTION);
    // First call for sendPrescriptionEmail org lookup, second for generatePrescriptionPDF org lookup
    mockQuery.mockResolvedValueOnce({ rows: [MOCK_ORG] });
    mockQuery.mockResolvedValueOnce({ rows: [MOCK_ORG] });
    mockSendEmail.mockResolvedValue({ messageId: 'msg-001' });
    mockUpdatePrescriptionEmailStatus.mockResolvedValue(undefined);

    const result = await sendPrescriptionEmail(ORG_ID, PRESCRIPTION_ID);

    expect(result.success).toBe(true);
    expect(result.messageId).toBe('msg-001');
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'ola@example.no',
        subject: expect.stringContaining('Test Klinikk'),
        attachments: expect.arrayContaining([
          expect.objectContaining({
            contentType: 'application/pdf',
          }),
        ]),
      })
    );
    expect(mockUpdatePrescriptionEmailStatus).toHaveBeenCalledWith(PRESCRIPTION_ID, true);
  });

  it('should throw when prescription is not found', async () => {
    mockGetPrescriptionById.mockResolvedValue(null);

    await expect(sendPrescriptionEmail(ORG_ID, PRESCRIPTION_ID)).rejects.toThrow(
      'Prescription not found'
    );
  });

  it('should throw when patient has no email address', async () => {
    const noEmailPrescription = { ...MOCK_PRESCRIPTION, patient_email: null };
    mockGetPrescriptionById.mockResolvedValue(noEmailPrescription);

    await expect(sendPrescriptionEmail(ORG_ID, PRESCRIPTION_ID)).rejects.toThrow(
      'Patient does not have an email address'
    );
  });

  it('should mark email status as failed when send throws', async () => {
    mockGetPrescriptionById.mockResolvedValue(MOCK_PRESCRIPTION);
    mockQuery.mockResolvedValueOnce({ rows: [MOCK_ORG] });
    mockQuery.mockResolvedValueOnce({ rows: [MOCK_ORG] });
    mockSendEmail.mockRejectedValue(new Error('SMTP connection failed'));
    mockUpdatePrescriptionEmailStatus.mockResolvedValue(undefined);

    await expect(sendPrescriptionEmail(ORG_ID, PRESCRIPTION_ID)).rejects.toThrow(
      'SMTP connection failed'
    );
    expect(mockUpdatePrescriptionEmailStatus).toHaveBeenCalledWith(PRESCRIPTION_ID, false);
  });
});

// =============================================================================
// sendExerciseReminder
// =============================================================================

describe('sendExerciseReminder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should send a reminder email and return success', async () => {
    mockGetPrescriptionById.mockResolvedValue(MOCK_PRESCRIPTION);
    mockQuery.mockResolvedValueOnce({ rows: [MOCK_ORG] });
    mockSendEmail.mockResolvedValue({ messageId: 'msg-reminder-001' });

    const result = await sendExerciseReminder(ORG_ID, PRESCRIPTION_ID);

    expect(result.success).toBe(true);
    expect(result.messageId).toBe('msg-reminder-001');
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'ola@example.no',
        subject: expect.stringContaining('minnelse'),
      })
    );
  });

  it('should throw when prescription not found', async () => {
    mockGetPrescriptionById.mockResolvedValue(null);

    await expect(sendExerciseReminder(ORG_ID, PRESCRIPTION_ID)).rejects.toThrow(
      'Prescription not found or patient has no email'
    );
  });

  it('should throw when patient has no email', async () => {
    const noEmailPrescription = { ...MOCK_PRESCRIPTION, patient_email: null };
    mockGetPrescriptionById.mockResolvedValue(noEmailPrescription);

    await expect(sendExerciseReminder(ORG_ID, PRESCRIPTION_ID)).rejects.toThrow(
      'Prescription not found or patient has no email'
    );
  });
});

// =============================================================================
// sendPortalSMS
// =============================================================================

describe('sendPortalSMS', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should send SMS with portal link and return success', async () => {
    mockGetPrescriptionById.mockResolvedValue(MOCK_PRESCRIPTION);
    mockQuery.mockResolvedValueOnce({ rows: [{ phone: '+4799887766' }] });
    mockSendSMS.mockResolvedValue({ success: true });

    const result = await sendPortalSMS(ORG_ID, PRESCRIPTION_ID);

    expect(result.success).toBe(true);
    expect(mockSendSMS).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: ORG_ID,
        to: '+4799887766',
        message: expect.stringContaining('tok-abc-123'),
      })
    );
  });

  it('should throw when prescription not found', async () => {
    mockGetPrescriptionById.mockResolvedValue(null);

    await expect(sendPortalSMS(ORG_ID, PRESCRIPTION_ID)).rejects.toThrow('Prescription not found');
  });

  it('should throw when patient has no phone number', async () => {
    mockGetPrescriptionById.mockResolvedValue(MOCK_PRESCRIPTION);
    mockQuery.mockResolvedValueOnce({ rows: [{ phone: null }] });

    await expect(sendPortalSMS(ORG_ID, PRESCRIPTION_ID)).rejects.toThrow(
      'Patient does not have a phone number'
    );
  });

  it('should throw when patient row does not exist', async () => {
    mockGetPrescriptionById.mockResolvedValue(MOCK_PRESCRIPTION);
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await expect(sendPortalSMS(ORG_ID, PRESCRIPTION_ID)).rejects.toThrow(
      'Patient does not have a phone number'
    );
  });
});
