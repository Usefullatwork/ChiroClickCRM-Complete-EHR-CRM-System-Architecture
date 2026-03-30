/**
 * Unit Tests for PDF Treatment Summary (src/services/clinical/pdfTreatmentSummary.js)
 * Tests treatment summary PDF generation with encounter history
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
        this.emit('data', Buffer.from('mock-summary-pdf'));
        this.emit('end');
      });
    });
  }
}

jest.unstable_mockModule('pdfkit', () => ({
  default: MockPDFDocument,
}));

const { generateTreatmentSummary } =
  await import('../../../src/services/clinical/pdfTreatmentSummary.js');

describe('pdfTreatmentSummary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockPatientRow = {
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
  };

  const mockEncounters = [
    {
      id: 'enc-1',
      encounter_date: '2025-06-01',
      encounter_type: 'INITIAL',
      subjective: { chief_complaint: 'Ryggsmerter' },
      objective: {},
      assessment: { clinical_reasoning: 'Lumbal dysfunksjon' },
      plan: { treatment: 'Mobilisering' },
      icpc_codes: ['L03'],
      icd10_codes: ['M54.5'],
      vas_pain_start: 7,
      vas_pain_end: 4,
      practitioner_name: 'Dr. Hansen',
    },
  ];

  describe('generateTreatmentSummary', () => {
    it('should generate a treatment summary PDF buffer', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [mockPatientRow] })
        .mockResolvedValueOnce({ rows: mockEncounters })
        .mockResolvedValueOnce({ rows: [] }); // outcome scores

      const buffer = await generateTreatmentSummary('p-1', 'org-1');
      expect(Buffer.isBuffer(buffer)).toBe(true);
    });

    it('should throw when patient not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await expect(generateTreatmentSummary('missing', 'org-1')).rejects.toThrow(
        'Patient not found'
      );
    });

    it('should handle empty encounter history', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [mockPatientRow] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      const buffer = await generateTreatmentSummary('p-1', 'org-1');
      expect(Buffer.isBuffer(buffer)).toBe(true);
    });

    it('should include outcome scores when available', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [mockPatientRow] })
        .mockResolvedValueOnce({ rows: mockEncounters })
        .mockResolvedValueOnce({
          rows: [
            {
              assessed_at: '2025-06-01',
              questionnaire_type: 'NDI',
              score: 15,
              severity: 'Moderate',
            },
          ],
        });

      const buffer = await generateTreatmentSummary('p-1', 'org-1');
      expect(Buffer.isBuffer(buffer)).toBe(true);
    });

    it('should respect maxEncounters option', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [mockPatientRow] })
        .mockResolvedValueOnce({ rows: mockEncounters })
        .mockResolvedValueOnce({ rows: [] });

      await generateTreatmentSummary('p-1', 'org-1', { maxEncounters: 5 });
      const encounterQueryParams = mockQuery.mock.calls[1][1];
      expect(encounterQueryParams[2]).toBe(5);
    });

    it('should handle outcome scores table not existing', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [mockPatientRow] })
        .mockResolvedValueOnce({ rows: mockEncounters })
        .mockRejectedValueOnce(new Error('Table not found'));

      const buffer = await generateTreatmentSummary('p-1', 'org-1');
      expect(Buffer.isBuffer(buffer)).toBe(true);
    });

    it('should handle multiple encounters', async () => {
      const multipleEnc = [
        ...mockEncounters,
        {
          ...mockEncounters[0],
          id: 'enc-2',
          encounter_type: 'FOLLOWUP',
          encounter_date: '2025-06-08',
        },
      ];
      mockQuery
        .mockResolvedValueOnce({ rows: [mockPatientRow] })
        .mockResolvedValueOnce({ rows: multipleEnc })
        .mockResolvedValueOnce({ rows: [] });

      const buffer = await generateTreatmentSummary('p-1', 'org-1');
      expect(Buffer.isBuffer(buffer)).toBe(true);
    });

    it('should pass correct params to patient query', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [mockPatientRow] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      await generateTreatmentSummary('p-1', 'org-1');
      expect(mockQuery.mock.calls[0][1]).toEqual(['p-1', 'org-1']);
    });

    it('should use default maxEncounters of 20', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [mockPatientRow] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      await generateTreatmentSummary('p-1', 'org-1');
      expect(mockQuery.mock.calls[1][1][2]).toBe(20);
    });
  });
});
