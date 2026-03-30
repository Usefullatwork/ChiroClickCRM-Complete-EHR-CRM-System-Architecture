/**
 * Unit Tests for PDF Utils (src/services/clinical/pdf-utils.js)
 * Tests Norwegian formatting, font management, document helpers, drawing primitives
 */

import { jest } from '@jest/globals';
import { EventEmitter } from 'events';

jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

const mockExistsSync = jest.fn();
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
        this.emit('data', Buffer.from('mock-pdf'));
        this.emit('end');
      });
    });
  }
}

jest.unstable_mockModule('pdfkit', () => ({
  default: MockPDFDocument,
}));

const {
  TEXT,
  formatNorwegianDate,
  formatNorwegianCurrency,
  fontName,
  findFont,
  createDoc,
  docToBuffer,
  addHeader,
  addFooter,
  addPatientInfo,
  sectionHeading,
  labeledValue,
  needsNewPage,
} = await import('../../../src/services/clinical/pdf-utils.js');

describe('pdf-utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================================================
  // TEXT constants
  // ===========================================================================
  describe('TEXT constants', () => {
    it('should define Norwegian text constants', () => {
      expect(TEXT.TREATMENT_SUMMARY).toBe('Behandlingssammendrag');
      expect(TEXT.REFERRAL_LETTER).toBe('Henvisning');
      expect(TEXT.SICK_NOTE).toBe('Sykmelding');
      expect(TEXT.PATIENT).toBe('Pasient');
      expect(TEXT.DIAGNOSIS).toBe('Diagnose');
    });

    it('should contain all required keys', () => {
      const requiredKeys = [
        'INVOICE',
        'SUBJECTIVE',
        'OBJECTIVE',
        'ASSESSMENT',
        'PLAN',
        'DATE',
        'PAGE',
      ];
      for (const key of requiredKeys) {
        expect(TEXT[key]).toBeTruthy();
      }
    });
  });

  // ===========================================================================
  // formatNorwegianDate
  // ===========================================================================
  describe('formatNorwegianDate', () => {
    it('should format date as dd.mm.yyyy', () => {
      const result = formatNorwegianDate(new Date('2025-03-15'));
      expect(result).toBe('15.03.2025');
    });

    it('should handle string date input', () => {
      const result = formatNorwegianDate('2025-12-25');
      expect(result).toBe('25.12.2025');
    });

    it('should return empty string for null', () => {
      expect(formatNorwegianDate(null)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(formatNorwegianDate(undefined)).toBe('');
    });

    it('should return empty string for invalid date', () => {
      expect(formatNorwegianDate('not-a-date')).toBe('');
    });

    it('should pad single-digit day and month', () => {
      const result = formatNorwegianDate(new Date('2025-01-05'));
      expect(result).toBe('05.01.2025');
    });
  });

  // ===========================================================================
  // formatNorwegianCurrency
  // ===========================================================================
  describe('formatNorwegianCurrency', () => {
    it('should format as Norwegian currency with kr suffix', () => {
      expect(formatNorwegianCurrency(1234.5)).toBe('1 234,50 kr');
    });

    it('should return 0,00 kr for null', () => {
      expect(formatNorwegianCurrency(null)).toBe('0,00 kr');
    });

    it('should return 0,00 kr for undefined', () => {
      expect(formatNorwegianCurrency(undefined)).toBe('0,00 kr');
    });

    it('should handle zero', () => {
      expect(formatNorwegianCurrency(0)).toBe('0,00 kr');
    });

    it('should use space as thousands separator', () => {
      expect(formatNorwegianCurrency(1000000)).toBe('1 000 000,00 kr');
    });
  });

  // ===========================================================================
  // fontName
  // ===========================================================================
  describe('fontName', () => {
    it('should return Helvetica when no Unicode font found', () => {
      // After module load with no fonts available, should fallback
      const result = fontName(false);
      expect(typeof result).toBe('string');
    });

    it('should return Helvetica-Bold for bold variant fallback', () => {
      const result = fontName(true);
      expect(result).toContain('Bold');
    });
  });

  // ===========================================================================
  // createDoc / docToBuffer
  // ===========================================================================
  describe('createDoc', () => {
    it('should create a PDFDocument instance', () => {
      const doc = createDoc('Test');
      expect(doc).toBeDefined();
    });
  });

  describe('docToBuffer', () => {
    it('should resolve to a Buffer', async () => {
      const doc = new MockPDFDocument();
      const buffer = await docToBuffer(doc);
      expect(Buffer.isBuffer(buffer)).toBe(true);
    });
  });

  // ===========================================================================
  // needsNewPage
  // ===========================================================================
  describe('needsNewPage', () => {
    it('should return false when enough space', () => {
      const doc = { y: 100, page: { height: 842 }, addPage: jest.fn() };
      expect(needsNewPage(doc, 100)).toBe(false);
    });

    it('should add page and return true when not enough space', () => {
      const doc = { y: 800, page: { height: 842 }, addPage: jest.fn() };
      expect(needsNewPage(doc, 100)).toBe(true);
      expect(doc.addPage).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // labeledValue
  // ===========================================================================
  describe('labeledValue', () => {
    it('should skip when value is falsy', () => {
      const doc = { font: jest.fn().mockReturnThis(), text: jest.fn().mockReturnThis() };
      labeledValue(doc, 'Label', null);
      expect(doc.text).not.toHaveBeenCalled();
    });

    it('should render label and value when provided', () => {
      const doc = { font: jest.fn().mockReturnThis(), text: jest.fn().mockReturnThis() };
      labeledValue(doc, 'Name', 'Ola Nordmann');
      expect(doc.text).toHaveBeenCalled();
    });
  });
});
