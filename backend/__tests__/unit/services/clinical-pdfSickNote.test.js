/**
 * Unit Tests for PDF Sick Note (src/services/clinical/pdfSickNote.js)
 * Tests sick note and invoice PDF generation
 */

import { jest } from '@jest/globals';
import { EventEmitter } from 'events';

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

const mockExistsSync = jest.fn().mockReturnValue(false);
jest.unstable_mockModule('fs', () => ({
  default: { existsSync: mockExistsSync, readFileSync: jest.fn() },
  existsSync: mockExistsSync,
  readFileSync: jest.fn(),
}));

class MockPDFDocument extends EventEmitter {
  constructor() {
    super();
    this.fontSize = jest.fn().mockReturnThis();
    this.font = jest.fn().mockReturnThis();
    this.fillColor = jest.fn().mockReturnThis();
    this.text = jest.fn().mockReturnThis();
    this.moveDown = jest.fn().mockReturnThis();
    this.moveTo = jest.fn().mockReturnThis();
    this.lineTo = jest.fn().mockReturnThis();
    this.stroke = jest.fn().mockReturnThis();
    this.lineWidth = jest.fn().mockReturnThis();
    this.rect = jest.fn().mockReturnThis();
    this.fill = jest.fn().mockReturnThis();
    this.registerFont = jest.fn();
    this.switchToPage = jest.fn().mockReturnThis();
    this.addPage = jest.fn().mockReturnThis();
    this.bufferedPageRange = jest.fn().mockReturnValue({ start: 0, count: 1 });
    this.y = 100;
    this.page = { height: 842, width: 595 };
    this.end = jest.fn(() => {
      process.nextTick(() => {
        this.emit('data', Buffer.from('mock-sick-pdf'));
        this.emit('end');
      });
    });
  }
}

jest.unstable_mockModule('pdfkit', () => ({
  default: MockPDFDocument,
}));

const { generateSickNote, generateInvoice } =
  await import('../../../src/services/clinical/pdfSickNote.js');

describe('pdfSickNote', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockPatientRow = {
    first_name: 'Kari',
    last_name: 'Nordmann',
    date_of_birth: '1985-03-20',
    phone: '+4712345678',
    email: 'kari@test.no',
    address: 'Lilleveien 5, 0571 Oslo',
    solvit_id: 'SOL-002',
    clinic_name: 'Test Klinikk',
    clinic_address: 'Storgata 1',
    clinic_phone: '+4798765432',
    clinic_email: 'klinikk@test.no',
    org_number: '123456789',
    practitioner_name: 'Dr. Berg',
    hpr_number: 'HPR456',
  };

  // ===========================================================================
  // generateSickNote
  // ===========================================================================
  describe('generateSickNote', () => {
    it('should generate a sick note PDF buffer', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockPatientRow] });

      const buffer = await generateSickNote({
        patientId: 'p-1',
        orgId: 'org-1',
        encounterId: 'enc-1',
        diagnosisCode: 'M54.5',
        diagnosisText: 'Lumbago',
        startDate: '2025-06-01',
        endDate: '2025-06-14',
        percentage: 100,
      });

      expect(Buffer.isBuffer(buffer)).toBe(true);
    });

    it('should throw when patient not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(generateSickNote({ patientId: 'missing', orgId: 'org-1' })).rejects.toThrow(
        'Patient not found'
      );
    });

    it('should handle partial sick note data', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockPatientRow] });

      const buffer = await generateSickNote({
        patientId: 'p-1',
        orgId: 'org-1',
        percentage: 50,
      });

      expect(Buffer.isBuffer(buffer)).toBe(true);
    });

    it('should include work restrictions when provided', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockPatientRow] });

      const buffer = await generateSickNote({
        patientId: 'p-1',
        orgId: 'org-1',
        workRestrictions: 'Ingen tunge løft',
      });

      expect(Buffer.isBuffer(buffer)).toBe(true);
    });

    it('should include functional assessment when provided', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockPatientRow] });

      const buffer = await generateSickNote({
        patientId: 'p-1',
        orgId: 'org-1',
        functionalAssessment: 'Redusert evne til å sitte lenge',
      });

      expect(Buffer.isBuffer(buffer)).toBe(true);
    });

    it('should handle address as object', async () => {
      const rowWithObjAddr = {
        ...mockPatientRow,
        address: { street: 'Lilleveien 5', postal_code: '0571', city: 'Oslo' },
      };
      mockQuery.mockResolvedValueOnce({ rows: [rowWithObjAddr] });

      const buffer = await generateSickNote({ patientId: 'p-1', orgId: 'org-1' });
      expect(Buffer.isBuffer(buffer)).toBe(true);
    });
  });

  // ===========================================================================
  // generateInvoice
  // ===========================================================================
  describe('generateInvoice', () => {
    it('should generate an invoice PDF buffer', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockPatientRow] });

      const buffer = await generateInvoice({
        orgId: 'org-1',
        patientId: 'p-1',
        lineItems: [{ date: '2025-06-01', service: 'Konsultasjon', icpcCode: 'L03', amount: 650 }],
      });

      expect(Buffer.isBuffer(buffer)).toBe(true);
    });

    it('should throw when patient not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(
        generateInvoice({ orgId: 'org-1', patientId: 'missing', lineItems: [] })
      ).rejects.toThrow('Patient not found');
    });

    it('should calculate VAT when vatRate > 0', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockPatientRow] });

      const buffer = await generateInvoice({
        orgId: 'org-1',
        patientId: 'p-1',
        vatRate: 25,
        lineItems: [{ date: '2025-06-01', service: 'Test', amount: 1000 }],
      });

      expect(Buffer.isBuffer(buffer)).toBe(true);
    });

    it('should handle insurance company billing', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockPatientRow] });

      const buffer = await generateInvoice({
        orgId: 'org-1',
        patientId: 'p-1',
        insuranceCompany: 'Trygg Forsikring',
        lineItems: [],
      });

      expect(Buffer.isBuffer(buffer)).toBe(true);
    });

    it('should generate default invoice number when not provided', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockPatientRow] });

      const buffer = await generateInvoice({
        orgId: 'org-1',
        patientId: 'p-1',
        lineItems: [],
      });

      expect(Buffer.isBuffer(buffer)).toBe(true);
    });
  });
});
