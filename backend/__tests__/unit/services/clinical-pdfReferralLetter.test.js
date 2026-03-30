/**
 * Unit Tests for PDF Referral Letter (src/services/clinical/pdfReferralLetter.js)
 * Tests referral letter generation
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
        this.emit('data', Buffer.from('mock-referral-pdf'));
        this.emit('end');
      });
    });
  }
}

jest.unstable_mockModule('pdfkit', () => ({
  default: MockPDFDocument,
}));

const { generateReferralLetter } =
  await import('../../../src/services/clinical/pdfReferralLetter.js');

describe('pdfReferralLetter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockEncounterRow = {
    first_name: 'Ola',
    last_name: 'Nordmann',
    date_of_birth: '1980-05-15',
    phone: '+4712345678',
    email: 'ola@example.com',
    solvit_id: 'SOL-001',
    clinic_name: 'Test Klinikk',
    clinic_address: 'Storgata 1',
    clinic_phone: '+4798765432',
    clinic_email: 'klinikk@test.no',
    org_number: '123456789',
    practitioner_name: 'Dr. Hansen',
    hpr_number: 'HPR123',
    icpc_codes: ['L03'],
    icd10_codes: ['M54.5'],
    subjective: { history: 'Smerter i 3 uker' },
    objective: { observation: 'Redusert ROM', palpation: 'Øm L4-L5' },
    assessment: { clinical_reasoning: 'Lumbal dysfunksjon' },
  };

  describe('generateReferralLetter', () => {
    it('should generate a PDF buffer for referral letter', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockEncounterRow] });

      const buffer = await generateReferralLetter({
        orgId: 'org-1',
        encounterId: 'enc-1',
        recipientName: 'Dr. Spesialist',
        reasonForReferral: 'Videre utredning av lumbal smerte',
      });

      expect(Buffer.isBuffer(buffer)).toBe(true);
    });

    it('should throw when encounter not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(
        generateReferralLetter({ orgId: 'org-1', encounterId: 'missing' })
      ).rejects.toThrow('Encounter not found');
    });

    it('should include recipient address when provided', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockEncounterRow] });

      const buffer = await generateReferralLetter({
        orgId: 'org-1',
        encounterId: 'enc-1',
        recipientName: 'Dr. Spesialist',
        recipientAddress: 'Spesialistveien 42',
        reasonForReferral: 'Utredning',
      });

      expect(Buffer.isBuffer(buffer)).toBe(true);
    });

    it('should include relevant findings when provided', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockEncounterRow] });

      const buffer = await generateReferralLetter({
        orgId: 'org-1',
        encounterId: 'enc-1',
        relevantFindings: 'Positiv SLR bilateralt',
        reasonForReferral: 'Utredning',
      });

      expect(Buffer.isBuffer(buffer)).toBe(true);
    });

    it('should include test results when provided', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockEncounterRow] });

      const buffer = await generateReferralLetter({
        orgId: 'org-1',
        encounterId: 'enc-1',
        relevantTestResults: 'MR viser diskusprolaps L4-L5',
        reasonForReferral: 'Utredning',
      });

      expect(Buffer.isBuffer(buffer)).toBe(true);
    });

    it('should build findings from encounter data when not explicitly provided', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockEncounterRow] });

      const buffer = await generateReferralLetter({
        orgId: 'org-1',
        encounterId: 'enc-1',
        reasonForReferral: 'Utredning',
      });

      expect(Buffer.isBuffer(buffer)).toBe(true);
    });

    it('should handle encounter with minimal data', async () => {
      const minimalRow = {
        ...mockEncounterRow,
        hpr_number: null,
        icpc_codes: null,
        icd10_codes: null,
        subjective: null,
        objective: null,
        assessment: null,
      };
      mockQuery.mockResolvedValueOnce({ rows: [minimalRow] });

      const buffer = await generateReferralLetter({
        orgId: 'org-1',
        encounterId: 'enc-1',
        reasonForReferral: 'Utredning',
      });

      expect(Buffer.isBuffer(buffer)).toBe(true);
    });

    it('should use default referral reason when not provided', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockEncounterRow] });

      const buffer = await generateReferralLetter({
        orgId: 'org-1',
        encounterId: 'enc-1',
      });

      expect(Buffer.isBuffer(buffer)).toBe(true);
    });

    it('should handle address as object', async () => {
      const rowWithObjAddr = {
        ...mockEncounterRow,
        clinic_address: { street: 'Storgata 1', postal_code: '0123', city: 'Oslo' },
      };
      mockQuery.mockResolvedValueOnce({ rows: [rowWithObjAddr] });

      const buffer = await generateReferralLetter({
        orgId: 'org-1',
        encounterId: 'enc-1',
        reasonForReferral: 'Utredning',
      });

      expect(Buffer.isBuffer(buffer)).toBe(true);
    });

    it('should pass correct params to database query', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockEncounterRow] });

      await generateReferralLetter({
        orgId: 'org-1',
        encounterId: 'enc-1',
        reasonForReferral: 'Test',
      });

      expect(mockQuery.mock.calls[0][1]).toEqual(['enc-1', 'org-1']);
    });
  });
});
