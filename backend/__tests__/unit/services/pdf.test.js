/**
 * Unit Tests for PDF Generation Service
 * Tests generatePatientLetter, generateInvoice, generateCustomPDF, generateExerciseHandout
 */

import { jest } from '@jest/globals';

// Mock database
const mockQuery = jest.fn();

jest.unstable_mockModule('../../../src/config/database.js', () => ({
  query: mockQuery,
  default: { query: mockQuery },
}));

jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Build a chainable mock PDFDocument
function createMockDoc() {
  const doc = {
    fontSize: jest.fn().mockReturnThis(),
    font: jest.fn().mockReturnThis(),
    text: jest.fn().mockReturnThis(),
    moveDown: jest.fn().mockReturnThis(),
    moveTo: jest.fn().mockReturnThis(),
    lineTo: jest.fn().mockReturnThis(),
    stroke: jest.fn().mockReturnThis(),
    rect: jest.fn().mockReturnThis(),
    fill: jest.fn().mockReturnThis(),
    fillColor: jest.fn().mockReturnThis(),
    registerFont: jest.fn().mockReturnThis(),
    image: jest.fn().mockReturnThis(),
    addPage: jest.fn().mockReturnThis(),
    list: jest.fn().mockReturnThis(),
    dash: jest.fn().mockReturnThis(),
    undash: jest.fn().mockReturnThis(),
    end: jest.fn(),
    on: jest.fn(),
    y: 100,
    page: { height: 800 },
    // EventEmitter-like behavior for pdfToBuffer
    _events: {},
  };

  // Implement on/end to support pdfToBuffer promise resolution
  doc.on.mockImplementation((event, handler) => {
    doc._events[event] = handler;
    return doc;
  });

  doc.end.mockImplementation(() => {
    // Simulate data + end events asynchronously
    const dataHandler = doc._events['data'];
    const endHandler = doc._events['end'];
    if (dataHandler) {
      dataHandler(Buffer.from('mock-pdf-content'));
    }
    if (endHandler) {
      endHandler();
    }
  });

  return doc;
}

const MockPDFDocument = jest.fn().mockImplementation(() => createMockDoc());

jest.unstable_mockModule('pdfkit', () => ({
  default: MockPDFDocument,
}));

// Mock fs for font path checking
jest.unstable_mockModule('fs', () => ({
  default: {
    existsSync: jest.fn().mockReturnValue(false),
    readFileSync: jest.fn(),
  },
  existsSync: jest.fn().mockReturnValue(false),
  readFileSync: jest.fn(),
}));

// Mock http/https for fetchImageBuffer
jest.unstable_mockModule('https', () => ({
  default: { get: jest.fn() },
}));

jest.unstable_mockModule('http', () => ({
  default: { get: jest.fn() },
}));

// Import after mocking
const pdfService = await import('../../../src/services/clinical/pdf.js');
const { generatePatientLetter, generateInvoice, generateCustomPDF, generateExerciseHandout } =
  pdfService;

describe('PDF Service', () => {
  const testOrgId = 'org-test-001';

  beforeEach(() => {
    jest.clearAllMocks();
    // Re-wire MockPDFDocument to produce a fresh mock doc each call
    MockPDFDocument.mockImplementation(() => createMockDoc());
  });

  // ===================== generatePatientLetter =====================

  describe('generatePatientLetter', () => {
    const encounterId = 'enc-001';
    const encounterRow = {
      id: encounterId,
      organization_id: testOrgId,
      first_name: 'Ola',
      last_name: 'Nordmann',
      date_of_birth: '1985-06-15',
      address: 'Storgata 1',
      postal_code: '0100',
      city: 'Oslo',
      clinic_name: 'Test Klinikk',
      clinic_address: 'Klinikkveien 5',
      clinic_phone: '+47 22 33 44 55',
      org_number: '123456789',
      practitioner_name: 'Dr. Hansen',
      hpr_number: 'HPR-123',
      icpc_codes: ['L03', 'L84'],
      assessment: { clinical_reasoning: 'Klinisk vurdering utført.' },
      plan: { advice: 'Følg behandlingsplan.', referrals: 'Ortoped', treatment: 'Manipulasjon' },
      subjective: { chief_complaint: 'Ryggsmerter', history: 'Langvarig plage' },
      objective: { observation: 'Normal holdning', palpation: 'Ømhet L4-L5' },
    };

    it('should generate a SICK_LEAVE letter', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [encounterRow] });

      const result = await generatePatientLetter(testOrgId, encounterId, 'SICK_LEAVE');

      expect(result).toBeDefined();
      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.contentType).toBe('application/pdf');
      expect(result.filename).toContain('SICK_LEAVE');
      expect(result.filename).toContain('Nordmann');
      expect(result.letter_type).toBe('SICK_LEAVE');
      expect(result.encounter_id).toBe(encounterId);
    });

    it('should generate a REFERRAL letter', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [encounterRow] });

      const result = await generatePatientLetter(testOrgId, encounterId, 'REFERRAL');

      expect(result).toBeDefined();
      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.filename).toContain('REFERRAL');
      expect(result.letter_type).toBe('REFERRAL');
    });

    it('should generate a TREATMENT_SUMMARY letter', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [encounterRow] });

      const result = await generatePatientLetter(testOrgId, encounterId, 'TREATMENT_SUMMARY');

      expect(result).toBeDefined();
      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.filename).toContain('TREATMENT_SUMMARY');
      expect(result.letter_type).toBe('TREATMENT_SUMMARY');
    });

    it('should throw for unknown letter type', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [encounterRow] });

      await expect(generatePatientLetter(testOrgId, encounterId, 'INVALID_TYPE')).rejects.toThrow(
        'Unknown letter type: INVALID_TYPE'
      );
    });

    it('should throw when encounter is not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(generatePatientLetter(testOrgId, encounterId, 'SICK_LEAVE')).rejects.toThrow(
        'Encounter not found'
      );
    });

    it('should propagate database errors', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB connection failed'));

      await expect(generatePatientLetter(testOrgId, encounterId, 'SICK_LEAVE')).rejects.toThrow(
        'DB connection failed'
      );
    });
  });

  // ===================== generateInvoice =====================

  describe('generateInvoice', () => {
    const financialMetricId = 'fm-001';
    const invoiceRow = {
      id: financialMetricId,
      organization_id: testOrgId,
      first_name: 'Kari',
      last_name: 'Olsen',
      address: 'Lilleveien 3',
      postal_code: '0200',
      city: 'Bergen',
      clinic_name: 'Bergen Klinikk',
      clinic_address: 'Klinikkgaten 10',
      clinic_phone: '+47 55 66 77 88',
      clinic_email: 'post@bergenklinikk.no',
      org_number: '987654321',
      invoice_number: 'INV-2026-001',
      created_at: '2026-03-15T10:00:00Z',
      treatment_codes: [
        { code: '1a', description: 'Undersøkelse', price: 650 },
        { code: '2a', description: 'Behandling', price: 450 },
      ],
      gross_amount: 1100,
      insurance_amount: 300,
      patient_amount: 800,
      payment_status: 'PENDING',
    };

    it('should generate an invoice PDF with correct metadata', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [invoiceRow] });

      const result = await generateInvoice(testOrgId, financialMetricId);

      expect(result).toBeDefined();
      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.contentType).toBe('application/pdf');
      expect(result.filename).toContain('Faktura');
      expect(result.filename).toContain('INV-2026-001');
      expect(result.invoice_number).toBe('INV-2026-001');
    });

    it('should handle treatment_codes as JSON string', async () => {
      const rowWithStringCodes = {
        ...invoiceRow,
        treatment_codes: JSON.stringify(invoiceRow.treatment_codes),
      };
      mockQuery.mockResolvedValueOnce({ rows: [rowWithStringCodes] });

      const result = await generateInvoice(testOrgId, financialMetricId);

      expect(result).toBeDefined();
      expect(result.buffer).toBeInstanceOf(Buffer);
    });

    it('should handle empty treatment_codes', async () => {
      const rowNoTreatmentCodes = {
        ...invoiceRow,
        treatment_codes: null,
      };
      mockQuery.mockResolvedValueOnce({ rows: [rowNoTreatmentCodes] });

      const result = await generateInvoice(testOrgId, financialMetricId);

      expect(result).toBeDefined();
      expect(result.buffer).toBeInstanceOf(Buffer);
    });

    it('should throw when financial metric not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(generateInvoice(testOrgId, financialMetricId)).rejects.toThrow(
        'Financial metric not found'
      );
    });

    it('should propagate database errors on invoice generation', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Query timeout'));

      await expect(generateInvoice(testOrgId, financialMetricId)).rejects.toThrow('Query timeout');
    });
  });

  // ===================== generateCustomPDF =====================

  describe('generateCustomPDF', () => {
    it('should generate a basic custom PDF with title and content', async () => {
      const result = await generateCustomPDF({
        title: 'Testdokument',
        content: 'Dette er innholdet i dokumentet.',
      });

      expect(result).toBeDefined();
      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.contentType).toBe('application/pdf');
      expect(result.filename).toContain('Testdokument');
    });

    it('should include clinic info when provided', async () => {
      const result = await generateCustomPDF({
        title: 'Brev',
        content: 'Innhold',
        clinic: { name: 'Test Klinikk', address: 'Adresse 1' },
      });

      expect(result).toBeDefined();
      expect(result.buffer).toBeInstanceOf(Buffer);
    });

    it('should include patient info when provided', async () => {
      const result = await generateCustomPDF({
        title: 'Pasientbrev',
        content: 'Kjære pasient...',
        patient: {
          first_name: 'Per',
          last_name: 'Pansen',
          date_of_birth: '1970-01-01',
        },
      });

      expect(result).toBeDefined();
      expect(result.buffer).toBeInstanceOf(Buffer);
    });

    it('should include practitioner signature when provided', async () => {
      const result = await generateCustomPDF({
        title: 'Attest',
        content: 'Bekreftelse.',
        practitioner: { practitioner_name: 'Dr. Berg', hpr_number: 'HPR-456' },
      });

      expect(result).toBeDefined();
      expect(result.buffer).toBeInstanceOf(Buffer);
    });

    it('should use default title when not provided', async () => {
      const result = await generateCustomPDF({
        content: 'Bare innhold',
      });

      expect(result).toBeDefined();
      expect(result.filename).toContain('document');
    });
  });

  // ===================== generateExerciseHandout =====================

  describe('generateExerciseHandout', () => {
    const patientId = 'pat-001';
    const patientRow = {
      id: patientId,
      first_name: 'Erik',
      last_name: 'Berg',
      date_of_birth: '1990-03-20',
      clinic_name: 'Oslo Klinikk',
      clinic_address: 'Storgata 5',
      clinic_phone: '+47 99 88 77 66',
    };

    const exerciseRows = [
      {
        exercise_name: 'Kneløft',
        exercise_code: 'EX-001',
        sets: 3,
        reps: 10,
        hold_seconds: null,
        frequency: 'daily',
        exercise_instructions: 'Løft kneet opp og ned.',
        instructions_no: 'Løft kneet sakte opp.',
        instructions_en: null,
        custom_instructions: 'Start forsiktig.',
        image_url: null,
        thumbnail_url: null,
        video_url: null,
        precautions: null,
        contraindications: null,
      },
      {
        exercise_name: 'Ryggstrekk',
        exercise_code: 'EX-002',
        sets: 2,
        reps: 15,
        hold_seconds: 5,
        frequency: '3x_week',
        exercise_instructions: 'Strekk ryggen.',
        instructions_no: null,
        instructions_en: 'Extend your back.',
        custom_instructions: null,
        image_url: null,
        thumbnail_url: null,
        video_url: 'https://example.com/video',
        precautions: 'Vær forsiktig med tung belastning.',
        contraindications: 'Akutt prolaps.',
      },
    ];

    it('should generate an exercise handout with exercises', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [patientRow] })
        .mockResolvedValueOnce({ rows: exerciseRows });

      const result = await generateExerciseHandout(testOrgId, patientId);

      expect(result).toBeDefined();
      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.contentType).toBe('application/pdf');
      expect(result.filename).toContain('Ovelsesprogram');
      expect(result.filename).toContain('Berg');
      expect(result.patientId).toBe(patientId);
      expect(result.exerciseCount).toBe(2);
    });

    it('should handle patient with no exercises', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [patientRow] }).mockResolvedValueOnce({ rows: [] });

      const result = await generateExerciseHandout(testOrgId, patientId);

      expect(result).toBeDefined();
      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.exerciseCount).toBe(0);
    });

    it('should throw when patient not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(generateExerciseHandout(testOrgId, patientId)).rejects.toThrow(
        'Patient not found'
      );
    });

    it('should propagate database errors on exercise handout', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB unavailable'));

      await expect(generateExerciseHandout(testOrgId, patientId)).rejects.toThrow('DB unavailable');
    });
  });
});
