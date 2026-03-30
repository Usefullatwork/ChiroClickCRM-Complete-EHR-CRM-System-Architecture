/**
 * Unit Tests for PDF Generator Service
 * Tests Norwegian-format PDF generation for treatment summaries,
 * referral letters, sick notes, and invoices.
 */

import { jest } from '@jest/globals';

// ── Mock database ──────────────────────────────────────────────────────
const mockQuery = jest.fn();

jest.unstable_mockModule('../../../src/config/database.js', () => ({
  query: mockQuery,
  default: { query: mockQuery },
}));

// ── Mock logger ────────────────────────────────────────────────────────
jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// ── Mock fs ────────────────────────────────────────────────────────────
jest.unstable_mockModule('fs', () => ({
  default: {
    existsSync: jest.fn().mockReturnValue(false),
    readFileSync: jest.fn(),
  },
  existsSync: jest.fn().mockReturnValue(false),
  readFileSync: jest.fn(),
}));

// ── Mock pdfkit ────────────────────────────────────────────────────────
// Because resetMocks: true clears mockImplementation between tests,
// we create the mock doc fresh inside the factory each time it's called.
// The factory itself is stable — only the PDFDocument mock fn gets reset.
// We work around resetMocks by using a wrapper that always delegates
// to createMockDoc, which we control.

function createMockDoc() {
  const listeners = {};
  const doc = {
    fontSize: jest.fn().mockReturnThis(),
    font: jest.fn().mockReturnThis(),
    text: jest.fn().mockReturnThis(),
    moveDown: jest.fn().mockReturnThis(),
    moveTo: jest.fn().mockReturnThis(),
    lineTo: jest.fn().mockReturnThis(),
    lineWidth: jest.fn().mockReturnThis(),
    stroke: jest.fn().mockReturnThis(),
    rect: jest.fn().mockReturnThis(),
    fill: jest.fn().mockReturnThis(),
    fillColor: jest.fn().mockReturnThis(),
    registerFont: jest.fn().mockReturnThis(),
    addPage: jest.fn().mockReturnThis(),
    switchToPage: jest.fn().mockReturnThis(),
    bufferedPageRange: jest.fn().mockReturnValue({ start: 0, count: 1 }),
    y: 100,
    page: { height: 842, width: 595 },
    on: jest.fn((event, cb) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(cb);
      return doc;
    }),
    end: jest.fn(() => {
      const dataListeners = listeners['data'] || [];
      const endListeners = listeners['end'] || [];
      const chunk = Buffer.from('mock-pdf-content');
      for (const cb of dataListeners) cb(chunk);
      for (const cb of endListeners) cb();
    }),
    _listeners: listeners,
  };
  return doc;
}

// We store PDFDocument ref so we can re-apply mockImplementation in beforeEach
let MockPDFDocument;

jest.unstable_mockModule('pdfkit', () => {
  MockPDFDocument = jest.fn().mockImplementation(() => createMockDoc());
  return { default: MockPDFDocument };
});

// ── Import service after all mocks ─────────────────────────────────────
const {
  formatNorwegianDate,
  formatNorwegianCurrency,
  generateTreatmentSummary,
  generateReferralLetter,
  generateSickNote,
  generateInvoice,
} = await import('../../../src/services/clinical/pdfGenerator.js');

// ── Test data factories ────────────────────────────────────────────────
function makePatientRow(overrides = {}) {
  return {
    id: 'pat-001',
    first_name: 'Ola',
    last_name: 'Nordmann',
    date_of_birth: '1985-06-15',
    phone: '+47 91234567',
    email: 'ola@example.no',
    solvit_id: 'SOL-12345',
    address: { street: 'Storgata 1', postal_code: '0150', city: 'Oslo' },
    clinic_name: 'Oslo Kiropraktorklinikk',
    clinic_address: 'Karl Johans gate 10, 0154 Oslo',
    clinic_phone: '+47 22334455',
    clinic_email: 'post@klinikk.no',
    org_number: '912345678',
    ...overrides,
  };
}

function makeEncounterRow(overrides = {}) {
  return {
    id: 'enc-001',
    encounter_date: '2026-03-15',
    encounter_type: 'INITIAL',
    subjective: { chief_complaint: 'Korsryggsmerte', history: 'Vondt i 2 uker' },
    objective: {
      observation: 'Redusert lordose',
      palpation: 'Oemhet L4-L5',
      ortho_tests: 'SLR positiv 40 grader',
      neuro_tests: 'Intakt',
      rom: 'Fleksjon redusert 50%',
    },
    assessment: { clinical_reasoning: 'Lumbalt fasettleddssyndrom' },
    plan: { treatment: 'Manipulasjon + oevelser', advice: 'Unnga tungt loeft' },
    icpc_codes: ['L03'],
    icd10_codes: ['M54.5'],
    vas_pain_start: 7,
    vas_pain_end: 4,
    practitioner_name: 'Kari Kiansen',
    ...overrides,
  };
}

function makeReferralEncounterRow(overrides = {}) {
  return {
    ...makeEncounterRow(),
    first_name: 'Ola',
    last_name: 'Nordmann',
    date_of_birth: '1985-06-15',
    phone: '+47 91234567',
    email: 'ola@example.no',
    solvit_id: 'SOL-12345',
    clinic_name: 'Oslo Kiropraktorklinikk',
    clinic_address: 'Karl Johans gate 10, 0154 Oslo',
    clinic_phone: '+47 22334455',
    clinic_email: 'post@klinikk.no',
    org_number: '912345678',
    hpr_number: 'HPR-9876543',
    ...overrides,
  };
}

// ════════════════════════════════════════════════════════════════════════
// Tests
// ════════════════════════════════════════════════════════════════════════

describe('pdfGenerator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Re-apply the PDFDocument mock implementation after resetMocks clears it
    MockPDFDocument.mockImplementation(() => createMockDoc());
  });

  // ── formatNorwegianDate ────────────────────────────────────────────
  describe('formatNorwegianDate', () => {
    it('should format a valid date as dd.mm.yyyy', () => {
      const result = formatNorwegianDate('2026-03-15');
      expect(result).toBe('15.03.2026');
    });

    it('should return empty string for null/undefined', () => {
      expect(formatNorwegianDate(null)).toBe('');
      expect(formatNorwegianDate(undefined)).toBe('');
    });

    it('should return empty string for invalid date', () => {
      expect(formatNorwegianDate('not-a-date')).toBe('');
    });

    it('should pad single-digit day and month with leading zeros', () => {
      const result = formatNorwegianDate('2026-01-05');
      expect(result).toBe('05.01.2026');
    });

    it('should handle Date objects', () => {
      const d = new Date(2026, 11, 24); // Dec 24, 2026
      const result = formatNorwegianDate(d);
      expect(result).toBe('24.12.2026');
    });
  });

  // ── formatNorwegianCurrency ────────────────────────────────────────
  describe('formatNorwegianCurrency', () => {
    it('should format a simple amount with comma decimal and kr suffix', () => {
      expect(formatNorwegianCurrency(500)).toBe('500,00 kr');
    });

    it('should use space as thousands separator', () => {
      expect(formatNorwegianCurrency(1234.5)).toBe('1 234,50 kr');
    });

    it('should return 0,00 kr for null/undefined', () => {
      expect(formatNorwegianCurrency(null)).toBe('0,00 kr');
      expect(formatNorwegianCurrency(undefined)).toBe('0,00 kr');
    });

    it('should handle zero', () => {
      expect(formatNorwegianCurrency(0)).toBe('0,00 kr');
    });

    it('should handle large amounts', () => {
      expect(formatNorwegianCurrency(1000000)).toBe('1 000 000,00 kr');
    });

    it('should handle string numeric input', () => {
      expect(formatNorwegianCurrency('750')).toBe('750,00 kr');
    });
  });

  // ── generateTreatmentSummary ───────────────────────────────────────
  describe('generateTreatmentSummary', () => {
    it('should return a Buffer when patient and encounters exist', async () => {
      const patientRow = makePatientRow();
      const encounterRows = [makeEncounterRow()];

      mockQuery
        .mockResolvedValueOnce({ rows: [patientRow] })
        .mockResolvedValueOnce({ rows: encounterRows })
        .mockResolvedValueOnce({ rows: [] });

      const result = await generateTreatmentSummary('pat-001', 'org-001');

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
      expect(mockQuery).toHaveBeenCalledTimes(3);
    });

    it('should throw when patient not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(generateTreatmentSummary('pat-missing', 'org-001')).rejects.toThrow(
        'Patient not found'
      );
    });

    it('should pass maxEncounters option to query LIMIT', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [makePatientRow()] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      await generateTreatmentSummary('pat-001', 'org-001', { maxEncounters: 5 });

      const encounterCall = mockQuery.mock.calls[1];
      expect(encounterCall[1]).toEqual(['pat-001', 'org-001', 5]);
    });

    it('should handle outcome_scores table not existing gracefully', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [makePatientRow()] })
        .mockResolvedValueOnce({ rows: [] })
        .mockRejectedValueOnce(new Error('relation "outcome_scores" does not exist'));

      const result = await generateTreatmentSummary('pat-001', 'org-001');
      expect(result).toBeInstanceOf(Buffer);
    });
  });

  // ── generateReferralLetter ─────────────────────────────────────────
  describe('generateReferralLetter', () => {
    it('should return a Buffer for valid referral data', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [makeReferralEncounterRow()] });

      const result = await generateReferralLetter({
        patientId: 'pat-001',
        orgId: 'org-001',
        encounterId: 'enc-001',
        recipientName: 'Dr. Spesialist',
        recipientAddress: 'Sykehusveien 5, 0450 Oslo',
        reasonForReferral: 'MR-utredning anbefales',
        relevantFindings: 'Positiv SLR, redusert ROM',
      });

      expect(result).toBeInstanceOf(Buffer);
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('should throw when encounter not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(
        generateReferralLetter({
          patientId: 'pat-001',
          orgId: 'org-001',
          encounterId: 'enc-missing',
          recipientName: 'Dr. Spesialist',
        })
      ).rejects.toThrow('Encounter not found');
    });

    it('should include relevantTestResults section when provided', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [makeReferralEncounterRow()] });

      const result = await generateReferralLetter({
        patientId: 'pat-001',
        orgId: 'org-001',
        encounterId: 'enc-001',
        recipientName: 'Dr. Spesialist',
        relevantTestResults: 'MR viser prolaps L4-L5',
      });

      expect(result).toBeInstanceOf(Buffer);
    });
  });

  // ── generateSickNote ───────────────────────────────────────────────
  describe('generateSickNote', () => {
    it('should return a Buffer for valid sick note data', async () => {
      const patientRow = makePatientRow({
        practitioner_name: 'Kari Kiansen',
        hpr_number: 'HPR-9876543',
        encrypted_personal_number: 'encrypted-fnr',
      });
      mockQuery.mockResolvedValueOnce({ rows: [patientRow] });

      const result = await generateSickNote({
        patientId: 'pat-001',
        orgId: 'org-001',
        encounterId: 'enc-001',
        diagnosisCode: 'M54.5',
        diagnosisText: 'Korsryggsmerte',
        startDate: '2026-03-15',
        endDate: '2026-03-29',
        percentage: 50,
        functionalAssessment: 'Kan utfoere lett kontorarbeid',
        workRestrictions: 'Unnga tungt loeft over 5 kg',
      });

      expect(result).toBeInstanceOf(Buffer);
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('should throw when patient not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(
        generateSickNote({
          patientId: 'pat-missing',
          orgId: 'org-001',
          encounterId: 'enc-001',
          diagnosisCode: 'M54.5',
          diagnosisText: 'Korsryggsmerte',
          startDate: '2026-03-15',
          endDate: '2026-03-29',
        })
      ).rejects.toThrow('Patient not found');
    });

    it('should default percentage to 100 when not provided', async () => {
      const patientRow = makePatientRow({ practitioner_name: 'Kari Kiansen' });
      mockQuery.mockResolvedValueOnce({ rows: [patientRow] });

      const result = await generateSickNote({
        patientId: 'pat-001',
        orgId: 'org-001',
        encounterId: 'enc-001',
        diagnosisCode: 'M54.5',
        diagnosisText: 'Korsryggsmerte',
        startDate: '2026-03-15',
        endDate: '2026-03-29',
      });

      expect(result).toBeInstanceOf(Buffer);
    });
  });

  // ── generateInvoice ────────────────────────────────────────────────
  describe('generateInvoice', () => {
    it('should return a Buffer with line items', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [makePatientRow()] });

      const result = await generateInvoice({
        orgId: 'org-001',
        patientId: 'pat-001',
        invoiceNumber: 'F-2026-000001',
        invoiceDate: '2026-03-15',
        dueDate: '2026-03-29',
        lineItems: [
          { date: '2026-03-15', service: 'Forstegangsundersokelse', icpcCode: 'L03', amount: 750 },
          { date: '2026-03-15', service: 'Manipulasjonsbehandling', icpcCode: 'L03', amount: 550 },
        ],
        vatRate: 0,
        accountNumber: '1234.56.78901',
        kidNumber: '00001234567',
      });

      expect(result).toBeInstanceOf(Buffer);
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('should throw when patient not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(
        generateInvoice({
          orgId: 'org-001',
          patientId: 'pat-missing',
          lineItems: [],
        })
      ).rejects.toThrow('Patient not found');
    });

    it('should handle empty line items', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [makePatientRow()] });

      const result = await generateInvoice({
        orgId: 'org-001',
        patientId: 'pat-001',
        lineItems: [],
      });

      expect(result).toBeInstanceOf(Buffer);
    });

    it('should handle VAT rate greater than zero', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [makePatientRow()] });

      const result = await generateInvoice({
        orgId: 'org-001',
        patientId: 'pat-001',
        lineItems: [{ date: '2026-03-15', service: 'Ergonomisk utstyr', amount: 1000 }],
        vatRate: 25,
      });

      expect(result).toBeInstanceOf(Buffer);
    });

    it('should handle insurance company billing', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [makePatientRow()] });

      const result = await generateInvoice({
        orgId: 'org-001',
        patientId: 'pat-001',
        lineItems: [{ date: '2026-03-15', service: 'Behandling', amount: 500 }],
        insuranceCompany: 'Tryg Forsikring AS',
      });

      expect(result).toBeInstanceOf(Buffer);
    });
  });
});
