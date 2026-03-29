/**
 * Unit Tests for Bulk Templating Service
 * Tests template personalization, message preview, and variable listing
 */

import { jest } from '@jest/globals';

// ---- Mocks ----
let queryImpl = () => Promise.resolve({ rows: [] });
const mockQuery = (...args) => queryImpl(...args);

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

// ---- Import under test ----
const { personalizeTemplate, previewMessage, getAvailableVariables } =
  await import('../../../src/services/communication/bulkTemplating.js');

// ---- Helpers ----
const ORG_ID = 'org-test-001';

function makePatient(overrides = {}) {
  return {
    first_name: 'Ola',
    last_name: 'Nordmann',
    phone: '+4712345678',
    email: 'ola@example.com',
    date_of_birth: '1990-01-15',
    last_visit_date: '2026-03-01',
    next_appointment: '2026-04-10',
    ...overrides,
  };
}

// ---- Tests ----

describe('bulkTemplating', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    queryImpl = () => Promise.resolve({ rows: [] });
  });

  // ─── personalizeTemplate ──────────────────────────────

  describe('personalizeTemplate', () => {
    it('should replace {firstName} with patient first name', () => {
      const result = personalizeTemplate('Hei {firstName}!', makePatient());
      expect(result).toBe('Hei Ola!');
    });

    it('should replace {lastName} with patient last name', () => {
      const result = personalizeTemplate('Pasient: {lastName}', makePatient());
      expect(result).toBe('Pasient: Nordmann');
    });

    it('should replace {fullName} with combined name', () => {
      const result = personalizeTemplate('Hei {fullName}!', makePatient());
      expect(result).toBe('Hei Ola Nordmann!');
    });

    it('should replace {phone} and {email}', () => {
      const result = personalizeTemplate('Ring {phone} eller mail {email}', makePatient());
      expect(result).toContain('+4712345678');
      expect(result).toContain('ola@example.com');
    });

    it('should replace {clinicName} from clinic info', () => {
      const result = personalizeTemplate('Hilsen {clinicName}', makePatient(), {
        name: 'Oslo Kiropraktikk',
      });
      expect(result).toBe('Hilsen Oslo Kiropraktikk');
    });

    it('should replace {clinicPhone} from clinic info', () => {
      const result = personalizeTemplate('Ring oss: {clinicPhone}', makePatient(), {
        phone: '+4722334455',
      });
      expect(result).toBe('Ring oss: +4722334455');
    });

    it('should replace {clinicEmail} from clinic info', () => {
      const result = personalizeTemplate('Mail: {clinicEmail}', makePatient(), {
        email: 'post@klinikk.no',
      });
      expect(result).toBe('Mail: post@klinikk.no');
    });

    it('should replace {clinicAddress} from clinic info', () => {
      const result = personalizeTemplate('Adresse: {clinicAddress}', makePatient(), {
        address: 'Storgata 1',
      });
      expect(result).toBe('Adresse: Storgata 1');
    });

    it('should replace multiple variables in one template', () => {
      const tpl = 'Hei {firstName} {lastName}! Ring {clinicPhone} for time.';
      const result = personalizeTemplate(tpl, makePatient(), { phone: '+4711111111' });
      expect(result).toBe('Hei Ola Nordmann! Ring +4711111111 for time.');
    });

    it('should return empty string for null template', () => {
      expect(personalizeTemplate(null, makePatient())).toBe('');
    });

    it('should return empty string for undefined template', () => {
      expect(personalizeTemplate(undefined, makePatient())).toBe('');
    });

    it('should handle missing patient fields gracefully', () => {
      const result = personalizeTemplate('Hei {firstName}!', { last_name: 'Test' });
      expect(result).toBe('Hei !');
    });

    it('should replace {dateOfBirth} with nb-NO formatted date', () => {
      const result = personalizeTemplate('Fodt: {dateOfBirth}', makePatient());
      expect(result).toMatch(/\d{1,2}\.\d{1,2}\.\d{4}/); // Norwegian date format
    });

    it('should replace {lastVisit} with nb-NO formatted date', () => {
      const result = personalizeTemplate('Siste besok: {lastVisit}', makePatient());
      expect(result).toMatch(/\d{1,2}\.\d{1,2}\.\d{4}/);
    });

    it('should replace {today} with current date', () => {
      const result = personalizeTemplate('Dato: {today}', makePatient());
      expect(result).toMatch(/\d{1,2}\.\d{1,2}\.\d{4}/);
    });

    it('should replace {currentYear} with current year', () => {
      const result = personalizeTemplate('Year: {currentYear}', makePatient());
      expect(result).toBe(`Year: ${new Date().getFullYear()}`);
    });

    it('should replace multiple occurrences of the same variable', () => {
      const result = personalizeTemplate('{firstName} er her. Hei {firstName}!', makePatient());
      expect(result).toBe('Ola er her. Hei Ola!');
    });

    it('should leave unknown placeholders as-is', () => {
      const result = personalizeTemplate('Hei {unknownVar}!', makePatient());
      expect(result).toBe('Hei {unknownVar}!');
    });
  });

  // ─── previewMessage ──────────────────────────────

  describe('previewMessage', () => {
    it('should return personalized preview with character count', async () => {
      queryImpl = async () => ({
        rows: [
          {
            id: 'p-1',
            first_name: 'Kari',
            last_name: 'Hansen',
            phone: '+4700000000',
            email: 'kari@test.no',
            date_of_birth: '1985-05-20',
            last_visit_date: '2026-02-15',
          },
        ],
      });

      const result = await previewMessage(ORG_ID, 'p-1', 'Hei {firstName}!');
      expect(result.personalizedContent).toBe('Hei Kari!');
      expect(result.patientName).toBe('Kari Hansen');
      expect(result.characterCount).toBe(9);
      expect(result.smsSegments).toBe(1);
    });

    it('should throw when patient not found', async () => {
      queryImpl = async () => ({ rows: [] });
      await expect(previewMessage(ORG_ID, 'fake', 'Hi')).rejects.toThrow('Patient not found');
    });

    it('should calculate SMS segments for long messages', async () => {
      queryImpl = async () => ({
        rows: [
          {
            id: 'p-1',
            first_name: 'A',
            last_name: 'B',
            phone: '+47',
            email: '',
            date_of_birth: null,
            last_visit_date: null,
          },
        ],
      });

      const longContent = 'X'.repeat(320); // 2 SMS segments
      const result = await previewMessage(ORG_ID, 'p-1', longContent);
      expect(result.smsSegments).toBe(2);
    });

    it('should include clinic info in personalization', async () => {
      queryImpl = async () => ({
        rows: [
          {
            id: 'p-1',
            first_name: 'Per',
            last_name: 'Olsen',
            phone: '+47',
            email: '',
            date_of_birth: null,
            last_visit_date: null,
          },
        ],
      });

      const result = await previewMessage(ORG_ID, 'p-1', 'Hilsen {clinicName}', {
        name: 'TestKlinikk',
      });
      expect(result.personalizedContent).toBe('Hilsen TestKlinikk');
    });

    it('should return original content alongside personalized', async () => {
      queryImpl = async () => ({
        rows: [
          {
            id: 'p-1',
            first_name: 'Ola',
            last_name: 'N',
            phone: '+47',
            email: '',
            date_of_birth: null,
            last_visit_date: null,
          },
        ],
      });

      const result = await previewMessage(ORG_ID, 'p-1', 'Hei {firstName}!');
      expect(result.originalContent).toBe('Hei {firstName}!');
    });
  });

  // ─── getAvailableVariables ──────────────────────────────

  describe('getAvailableVariables', () => {
    it('should return all available template variables', () => {
      const variables = getAvailableVariables();
      expect(variables.length).toBeGreaterThanOrEqual(10);
    });

    it('should include firstName variable', () => {
      const variables = getAvailableVariables();
      const firstNameVar = variables.find((v) => v.variable === '{firstName}');
      expect(firstNameVar).toBeDefined();
      expect(firstNameVar.description).toBeTruthy();
    });

    it('should include clinic variables', () => {
      const variables = getAvailableVariables();
      const clinicVars = variables.filter((v) => v.variable.includes('clinic'));
      expect(clinicVars.length).toBeGreaterThanOrEqual(3);
    });

    it('should include Norwegian descriptions', () => {
      const variables = getAvailableVariables();
      const firstNameVar = variables.find((v) => v.variable === '{firstName}');
      expect(firstNameVar.description).toContain('Pasientens');
    });
  });
});
