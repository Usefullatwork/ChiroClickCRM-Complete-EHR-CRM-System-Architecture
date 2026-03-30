/**
 * Unit Tests for Excel Import Service and Text Parser Service
 * Tests Excel parsing, column mapping, validation, patient import,
 * text extraction, phone/date/nationalId parsing, table parsing
 */

import { jest } from '@jest/globals';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockQuery = jest.fn();

jest.unstable_mockModule('../../../src/config/database.js', () => ({
  query: mockQuery,
  transaction: jest.fn(),
  getClient: jest.fn(),
  healthCheck: jest.fn().mockResolvedValue(true),
  closePool: jest.fn(),
  setTenantContext: jest.fn(),
  clearTenantContext: jest.fn(),
  queryWithTenant: jest.fn(),
  default: {
    query: mockQuery,
    transaction: jest.fn(),
    getClient: jest.fn(),
    healthCheck: jest.fn().mockResolvedValue(true),
    closePool: jest.fn(),
    setTenantContext: jest.fn(),
    clearTenantContext: jest.fn(),
    queryWithTenant: jest.fn(),
  },
}));

jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Build a fake ExcelJS workbook that behaves like the real one.
// parseExcelFile calls workbook.xlsx.load(buffer), then reads worksheets[0].
const buildMockWorkbook = (sheetName, headerRow, dataRows) => {
  const rows = [];

  // Row 1: headers
  const headerCells = headerRow.map((h, idx) => ({ value: h, text: h, colNumber: idx + 1 }));
  rows.push({
    rowNumber: 1,
    eachCell: (cb) => headerCells.forEach((c) => cb(c, c.colNumber)),
  });

  // Subsequent rows: data
  dataRows.forEach((dataObj, rowIdx) => {
    const cells = headerRow.map((h, idx) => {
      const val = dataObj[h] ?? null;
      return { value: val, text: val != null ? String(val) : '', colNumber: idx + 1 };
    });
    rows.push({
      rowNumber: rowIdx + 2,
      eachCell: (cb) => cells.filter((c) => c.value != null).forEach((c) => cb(c, c.colNumber)),
    });
  });

  return {
    xlsx: {
      load: jest.fn().mockResolvedValue(undefined),
      writeBuffer: jest.fn().mockResolvedValue(Buffer.from('fake-xlsx')),
    },
    worksheets: [
      {
        name: sheetName,
        eachRow: (cb) => rows.forEach((r) => cb(r, r.rowNumber)),
        columns: null,
        addRow: jest.fn(),
      },
    ],
    addWorksheet: jest.fn().mockImplementation(() => ({
      name: 'Patients',
      columns: null,
      addRow: jest.fn(),
    })),
  };
};

let mockWorkbook;

jest.unstable_mockModule('exceljs', () => {
  const WorkbookClass = function () {
    // Return whatever mockWorkbook is set to at call-time
    Object.assign(this, mockWorkbook);
  };
  return { default: { Workbook: WorkbookClass } };
});

// ---------------------------------------------------------------------------
// Dynamic imports after mocking
// ---------------------------------------------------------------------------

const { parseExcelFile, importPatientsFromExcel, generatePatientTemplate } =
  await import('../../../src/services/practice/excelImport.js');

const textParserModule = await import('../../../src/services/training/textParser.js');
const { extractPatientFromText, parsePatientTable, parsePatientData } = textParserModule;

const { parseNorwegianPhone, parseNationalId, parseNorwegianDate } = textParserModule.default;

// ===========================================================================
// EXCEL IMPORT SERVICE
// ===========================================================================

describe('Excel Import Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // parseExcelFile
  // -------------------------------------------------------------------------

  describe('parseExcelFile', () => {
    it('should parse rows into objects using first row as headers', async () => {
      mockWorkbook = buildMockWorkbook(
        'Sheet1',
        ['First Name', 'Last Name', 'Phone'],
        [
          { 'First Name': 'Ola', 'Last Name': 'Nordmann', Phone: '91234567' },
          { 'First Name': 'Kari', 'Last Name': 'Hansen', Phone: '98765432' },
        ]
      );

      const result = await parseExcelFile(Buffer.from('x'), 'xlsx');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        'First Name': 'Ola',
        'Last Name': 'Nordmann',
        Phone: '91234567',
      });
      expect(result[1]).toEqual({ 'First Name': 'Kari', 'Last Name': 'Hansen', Phone: '98765432' });
    });

    it('should return empty array for a sheet with only headers', async () => {
      mockWorkbook = buildMockWorkbook('EmptySheet', ['Name', 'Email'], []);
      const result = await parseExcelFile(Buffer.from('x'), 'xlsx');
      expect(result).toEqual([]);
    });

    it('should throw descriptive error when file is corrupt', async () => {
      mockWorkbook = {
        xlsx: {
          load: jest.fn().mockRejectedValue(new Error('Corrupt file')),
        },
        worksheets: [],
      };

      await expect(parseExcelFile(Buffer.from('bad'), 'xlsx')).rejects.toThrow(
        'Failed to parse Excel file'
      );
    });
  });

  // -------------------------------------------------------------------------
  // importPatientsFromExcel — column mapping & normalization
  // -------------------------------------------------------------------------

  describe('importPatientsFromExcel — column mapping', () => {
    it('should map Norwegian column names to patient fields', async () => {
      mockWorkbook = buildMockWorkbook(
        'Pasienter',
        [
          'For Navn',
          'Etter Navn',
          'Telefonnummer',
          'E-post',
          'Pasient Status',
          'Språk',
          'Behandlingstype',
        ],
        [
          {
            'For Navn': 'Ola',
            'Etter Navn': 'Nordmann',
            Telefonnummer: '91234567',
            'E-post': 'ola@example.com',
            'Pasient Status': 'Inaktiv',
            Språk: 'Norsk',
            Behandlingstype: 'Kiropraktor',
          },
        ]
      );

      const result = await importPatientsFromExcel('org-1', Buffer.from('x'), 'user-1', {
        dryRun: true,
      });

      expect(result.total).toBe(1);
      expect(result.imported).toBe(1);
      expect(result.errors).toHaveLength(0);
    });

    it('should normalize status Ferdig to FINISHED', async () => {
      mockWorkbook = buildMockWorkbook(
        'Sheet1',
        ['First Name', 'Last Name', 'Phone', 'Pasient Status'],
        [
          {
            'First Name': 'Test',
            'Last Name': 'User',
            Phone: '91234567',
            'Pasient Status': 'Ferdig',
          },
        ]
      );

      const result = await importPatientsFromExcel('org-1', Buffer.from('x'), 'user-1', {
        dryRun: true,
      });

      expect(result.imported).toBe(1);
      expect(result.errors).toHaveLength(0);
    });

    it('should normalize contact method Melding to SMS', async () => {
      mockWorkbook = buildMockWorkbook(
        'Sheet1',
        ['First Name', 'Last Name', 'Email', 'Ønsker Kontakt På'],
        [
          {
            'First Name': 'Test',
            'Last Name': 'User',
            Email: 'test@test.no',
            'Ønsker Kontakt På': 'Melding',
          },
        ]
      );

      const result = await importPatientsFromExcel('org-1', Buffer.from('x'), 'user-1', {
        dryRun: true,
      });

      expect(result.imported).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // importPatientsFromExcel — validation
  // -------------------------------------------------------------------------

  describe('importPatientsFromExcel — validation', () => {
    it('should reject rows missing first name', async () => {
      mockWorkbook = buildMockWorkbook(
        'Sheet1',
        ['Last Name', 'Phone'],
        [{ 'Last Name': 'Nordmann', Phone: '91234567' }]
      );

      const result = await importPatientsFromExcel('org-1', Buffer.from('x'), 'user-1', {
        dryRun: true,
      });

      expect(result.skipped).toBe(1);
      expect(result.errors).toEqual(
        expect.arrayContaining([expect.stringContaining('Missing first name')])
      );
    });

    it('should reject rows missing both phone and email', async () => {
      mockWorkbook = buildMockWorkbook(
        'Sheet1',
        ['First Name', 'Last Name'],
        [{ 'First Name': 'Ola', 'Last Name': 'Nordmann' }]
      );

      const result = await importPatientsFromExcel('org-1', Buffer.from('x'), 'user-1', {
        dryRun: true,
      });

      expect(result.skipped).toBe(1);
      expect(result.errors).toEqual(
        expect.arrayContaining([expect.stringContaining('Must have either phone or email')])
      );
    });

    it('should reject invalid Norwegian phone numbers', async () => {
      mockWorkbook = buildMockWorkbook(
        'Sheet1',
        ['First Name', 'Last Name', 'Phone'],
        [{ 'First Name': 'Ola', 'Last Name': 'Nordmann', Phone: '12345678' }]
      );

      const result = await importPatientsFromExcel('org-1', Buffer.from('x'), 'user-1', {
        dryRun: true,
      });

      expect(result.skipped).toBe(1);
      expect(result.errors).toEqual(
        expect.arrayContaining([expect.stringContaining('Invalid Norwegian phone number')])
      );
    });

    it('should reject invalid email addresses', async () => {
      mockWorkbook = buildMockWorkbook(
        'Sheet1',
        ['First Name', 'Last Name', 'Email'],
        [{ 'First Name': 'Ola', 'Last Name': 'Nordmann', Email: 'not-an-email' }]
      );

      const result = await importPatientsFromExcel('org-1', Buffer.from('x'), 'user-1', {
        dryRun: true,
      });

      expect(result.skipped).toBe(1);
      expect(result.errors).toEqual(
        expect.arrayContaining([expect.stringContaining('Invalid email')])
      );
    });

    it('should reject invalid date of birth', async () => {
      mockWorkbook = buildMockWorkbook(
        'Sheet1',
        ['First Name', 'Last Name', 'Phone', 'Date_of_birth'],
        [
          {
            'First Name': 'Ola',
            'Last Name': 'Nordmann',
            Phone: '91234567',
            Date_of_birth: 'not-a-date',
          },
        ]
      );

      const result = await importPatientsFromExcel('org-1', Buffer.from('x'), 'user-1', {
        dryRun: true,
      });

      expect(result.skipped).toBe(1);
      expect(result.errors).toEqual(
        expect.arrayContaining([expect.stringContaining('Invalid date of birth')])
      );
    });
  });

  // -------------------------------------------------------------------------
  // importPatientsFromExcel — database operations
  // -------------------------------------------------------------------------

  describe('importPatientsFromExcel — database operations', () => {
    it('should insert new patient when no duplicate found', async () => {
      mockWorkbook = buildMockWorkbook(
        'Sheet1',
        ['First Name', 'Last Name', 'Phone'],
        [{ 'First Name': 'Ola', 'Last Name': 'Nordmann', Phone: '91234567' }]
      );

      // No duplicate found (all three lookup queries return empty)
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await importPatientsFromExcel('org-1', Buffer.from('x'), 'user-1');

      expect(result.imported).toBe(1);
      expect(result.skipped).toBe(0);
      // Should have called query for INSERT
      const insertCall = mockQuery.mock.calls.find((c) => c[0].includes('INSERT INTO patients'));
      expect(insertCall).toBeDefined();
    });

    it('should skip duplicate patient when skipDuplicates is true', async () => {
      mockWorkbook = buildMockWorkbook(
        'Sheet1',
        ['First Name', 'Last Name', 'Phone', 'Solvit_ID'],
        [{ 'First Name': 'Ola', 'Last Name': 'Nordmann', Phone: '91234567', Solvit_ID: 'SOL-1' }]
      );

      // Duplicate found by solvit_id
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'existing-id' }] });

      const result = await importPatientsFromExcel('org-1', Buffer.from('x'), 'user-1', {
        skipDuplicates: true,
      });

      expect(result.skipped).toBe(1);
      expect(result.imported).toBe(0);
    });

    it('should update existing patient when updateExisting is true', async () => {
      mockWorkbook = buildMockWorkbook(
        'Sheet1',
        ['First Name', 'Last Name', 'Phone', 'Solvit_ID'],
        [{ 'First Name': 'Ola', 'Last Name': 'Nordmann', Phone: '91234567', Solvit_ID: 'SOL-1' }]
      );

      // Duplicate found
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'existing-id' }] });
      // UPDATE query
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await importPatientsFromExcel('org-1', Buffer.from('x'), 'user-1', {
        updateExisting: true,
      });

      expect(result.updated).toBe(1);
      expect(result.imported).toBe(0);
      const updateCall = mockQuery.mock.calls.find((c) => c[0].includes('UPDATE patients'));
      expect(updateCall).toBeDefined();
    });

    it('should report error and skip row when DB insert fails', async () => {
      mockWorkbook = buildMockWorkbook(
        'Sheet1',
        ['First Name', 'Last Name', 'Email'],
        [{ 'First Name': 'Ola', 'Last Name': 'Nordmann', Email: 'ola@test.no' }]
      );

      // The patient has no solvit_id and no national_id, and no date_of_birth,
      // so only the INSERT fires — mock it to fail.
      mockQuery.mockRejectedValueOnce(new Error('DB constraint violation'));

      const result = await importPatientsFromExcel('org-1', Buffer.from('x'), 'user-1');

      expect(result.skipped).toBe(1);
      expect(result.errors).toEqual(
        expect.arrayContaining([expect.stringContaining('DB constraint violation')])
      );
    });
  });

  // -------------------------------------------------------------------------
  // generatePatientTemplate
  // -------------------------------------------------------------------------

  describe('generatePatientTemplate', () => {
    it('should return a Buffer', async () => {
      const mockWorksheet = { columns: null, addRow: jest.fn() };
      mockWorkbook = {
        xlsx: {
          load: jest.fn(),
          writeBuffer: jest.fn().mockResolvedValue(Buffer.from('fake-template')),
        },
        worksheets: [],
        addWorksheet: jest.fn().mockReturnValue(mockWorksheet),
      };

      const buffer = await generatePatientTemplate();
      expect(Buffer.isBuffer(buffer)).toBe(true);
    });
  });
});

// ===========================================================================
// TEXT PARSER SERVICE
// ===========================================================================

describe('Text Parser Service', () => {
  // -------------------------------------------------------------------------
  // parseNorwegianPhone
  // -------------------------------------------------------------------------

  describe('parseNorwegianPhone', () => {
    it('should parse valid 8-digit Norwegian mobile number', () => {
      expect(parseNorwegianPhone('91234567')).toBe('91234567');
    });

    it('should strip +47 country code', () => {
      expect(parseNorwegianPhone('+4791234567')).toBe('91234567');
    });

    it('should strip spaces', () => {
      expect(parseNorwegianPhone('912 34 567')).toBe('91234567');
    });

    it('should return null for invalid number starting with 1-3', () => {
      expect(parseNorwegianPhone('12345678')).toBeNull();
    });

    it('should return null for null/empty input', () => {
      expect(parseNorwegianPhone(null)).toBeNull();
      expect(parseNorwegianPhone('')).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // parseNationalId
  // -------------------------------------------------------------------------

  describe('parseNationalId', () => {
    it('should parse valid 11-digit personnummer', () => {
      expect(parseNationalId('01010112345')).toBe('01010112345');
    });

    it('should strip spaces in the middle', () => {
      expect(parseNationalId('01010 112345')).toBe('01010112345');
    });

    it('should return null for too-short input', () => {
      expect(parseNationalId('0101011234')).toBeNull();
    });

    it('should return null for null input', () => {
      expect(parseNationalId(null)).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // parseNorwegianDate
  // -------------------------------------------------------------------------

  describe('parseNorwegianDate', () => {
    it('should parse DD.MM.YYYY format', () => {
      expect(parseNorwegianDate('15.01.1980')).toBe('1980-01-15');
    });

    it('should parse DD/MM/YYYY format', () => {
      expect(parseNorwegianDate('2/3/2000')).toBe('2000-03-02');
    });

    it('should pass through ISO YYYY-MM-DD format', () => {
      expect(parseNorwegianDate('1980-01-15')).toBe('1980-01-15');
    });

    it('should return null for unrecognized format', () => {
      expect(parseNorwegianDate('January 15, 1980')).toBeNull();
    });

    it('should return null for null input', () => {
      expect(parseNorwegianDate(null)).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // extractPatientFromText
  // -------------------------------------------------------------------------

  describe('extractPatientFromText', () => {
    it('should extract email from free text', () => {
      const result = extractPatientFromText('Kontakt meg på ola@example.com');
      expect(result.email).toBe('ola@example.com');
    });

    it('should extract Norwegian phone number', () => {
      const result = extractPatientFromText('Telefon: +47 912 34 567');
      expect(result.phone).toBe('91234567');
    });

    it('should extract personnummer and derive date of birth', () => {
      const text = 'Personnummer: 15018012345';
      const result = extractPatientFromText(text);
      expect(result.national_id).toBe('15018012345');
      // DOB extracted from first 6 digits: 15-01-80, century digit 1 → 20xx
      expect(result.date_of_birth).toBe('2080-01-15');
    });

    it('should extract personnummer with century digit 5-9 as 19xx', () => {
      // Personnummer: 010150 5xxxx → century digit 5 → 1950
      const text = 'ID: 01015056789';
      const result = extractPatientFromText(text);
      expect(result.national_id).toBe('01015056789');
      expect(result.date_of_birth).toBe('1950-01-01');
    });

    it('should extract postal code and city', () => {
      const result = extractPatientFromText('0001 Oslo');
      expect(result.address_postal_code).toBe('0001');
      expect(result.address_city).toBe('Oslo');
    });

    it('should collect unmatched lines as notes', () => {
      const result = extractPatientFromText('Har vondt i ryggen\nSovner dårlig');
      expect(result.notes).toContain('Har vondt i ryggen');
      expect(result.notes).toContain('Sovner dårlig');
    });
  });

  // -------------------------------------------------------------------------
  // parsePatientTable
  // -------------------------------------------------------------------------

  describe('parsePatientTable', () => {
    it('should parse tab-separated patient table', () => {
      const text = [
        'Patient ID\tFirst Name\tLast Name\tLast Visit\tEmail\tPhone',
        'SOL-1\tOla\tNordmann\t15.01.2025\tola@test.no\t91234567',
        'SOL-2\tKari\tHansen\t20.02.2025\tkari@test.no\t98765432',
      ].join('\n');

      const patients = parsePatientTable(text);
      expect(patients).toHaveLength(2);
      expect(patients[0].solvit_id).toBe('SOL-1');
      expect(patients[0].first_name).toBe('Ola');
      expect(patients[0].last_name).toBe('Nordmann');
      expect(patients[0].last_visit_date).toBe('2025-01-15');
      expect(patients[0].email).toBe('ola@test.no');
      expect(patients[0].phone).toBe('91234567');
    });

    it('should normalize status Inaktiv to INACTIVE', () => {
      // Columns (tab-separated): 0=id 1=first 2=last 3=visit 4=email 5=phone 6=therapist 7=contact 8=status
      // Use space placeholders for empty cols since split(/\t+/) collapses consecutive tabs
      const text = [
        'ID\tFN\tLN\tVisit\tEmail\tPhone\tTherapist\tContact\tStatus',
        'S1\tOla\tN\t \tola@t.no\t91234567\t \t \tInaktiv',
      ].join('\n');

      const patients = parsePatientTable(text);
      expect(patients[0].patient_status).toBe('Inaktiv');
      expect(patients[0].status).toBe('INACTIVE');
    });

    it('should normalize language Norsk to NO and Engelsk to EN', () => {
      // Columns: 0-8 then 9=language
      const text = [
        'ID\tFN\tLN\tVisit\tEmail\tPhone\tTherapist\tContact\tStatus\tLang',
        'S1\tOla\tN\t \tola@t.no\t91234567\t \t \tAktiv\tNorsk',
        'S2\tJohn\tD\t \tjohn@t.no\t98765432\t \t \tAktiv\tEngelsk',
      ].join('\n');

      const patients = parsePatientTable(text);
      expect(patients[0].language).toBe('NO');
      expect(patients[1].language).toBe('EN');
    });

    it('should normalize treatment types', () => {
      // Columns: 0-10 then 11=treatment_type
      const text = [
        'ID\tFN\tLN\tVisit\tEmail\tPhone\tTherapist\tContact\tStatus\tLang\tProblem\tTreatment',
        'S1\tA\tB\t \ta@t.no\t91234567\t \t \t \t \t \tKiropraktor',
        'S2\tC\tD\t \tc@t.no\t98765432\t \t \t \t \t \tNevrobehandling',
      ].join('\n');

      const patients = parsePatientTable(text);
      expect(patients[0].treatment_type).toBe('KIROPRAKTOR');
      expect(patients[1].treatment_type).toBe('NEVROBEHANDLING');
    });

    it('should skip lines with fewer than 3 columns', () => {
      const text = 'Header1\tHeader2\tHeader3\nAB\n';
      const patients = parsePatientTable(text);
      expect(patients).toHaveLength(0);
    });

    it('should normalize contact method BARN to NO_CONTACT', () => {
      // Column 7 = preferred_contact_method
      const text = [
        'ID\tFN\tLN\tVisit\tEmail\tPhone\tTherapist\tContact',
        'S1\tOla\tN\t \tola@t.no\t91234567\t \tBARN - ikke kontakt',
      ].join('\n');

      const patients = parsePatientTable(text);
      expect(patients[0].preferred_contact_method).toBe('NO_CONTACT');
    });
  });

  // -------------------------------------------------------------------------
  // parsePatientData (smart router)
  // -------------------------------------------------------------------------

  describe('parsePatientData', () => {
    it('should route to table parser when text contains "Patient ID"', () => {
      const text = 'Patient ID\tFirst\tLast\nS1\tOla\tN';
      const result = parsePatientData(text);
      expect(result.type).toBe('table');
      expect(result.patients).toHaveLength(1);
    });

    it('should route to table parser when text contains "Solvit"', () => {
      const text = 'Solvit\tFN\tLN\nS1\tOla\tN';
      const result = parsePatientData(text);
      expect(result.type).toBe('table');
    });

    it('should route to table parser when text contains "Fornavn"', () => {
      const text = 'Fornavn\tEtternavn\tTelefon\nOla\tN\t91234567';
      const result = parsePatientData(text);
      expect(result.type).toBe('table');
    });

    it('should route to single-patient parser for free text', () => {
      const text = 'ola@test.no\nTelefon 91234567';
      const result = parsePatientData(text);
      expect(result.type).toBe('single');
      expect(result.patient.email).toBe('ola@test.no');
    });
  });
});
