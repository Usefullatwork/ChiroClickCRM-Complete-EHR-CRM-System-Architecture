/**
 * Unit Tests for Compliance Validator (src/services/clinical/complianceValidator.js)
 * Tests Norwegian GDPR PII redaction, cloud API validation, disclaimer injection,
 * and the full compliance pipeline.
 */

import { jest } from '@jest/globals';

// Mock logger — no database dependency in this service
jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Import after mocks
const {
  redactPII,
  validateForCloudAPI,
  addDisclaimer,
  ensureCompliance,
  PII_PATTERNS,
  CLINICAL_DISCLAIMER,
} = await import('../../../src/services/clinical/complianceValidator.js');

const logger = (await import('../../../src/utils/logger.js')).default;

describe('complianceValidator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================================================
  // MODULE EXPORTS
  // ===========================================================================

  describe('module exports', () => {
    it('should export redactPII as a function', () => {
      expect(typeof redactPII).toBe('function');
    });

    it('should export validateForCloudAPI as a function', () => {
      expect(typeof validateForCloudAPI).toBe('function');
    });

    it('should export addDisclaimer as a function', () => {
      expect(typeof addDisclaimer).toBe('function');
    });

    it('should export ensureCompliance as a function', () => {
      expect(typeof ensureCompliance).toBe('function');
    });

    it('should export PII_PATTERNS as a non-empty array', () => {
      expect(Array.isArray(PII_PATTERNS)).toBe(true);
      expect(PII_PATTERNS.length).toBeGreaterThan(0);
    });

    it('should export CLINICAL_DISCLAIMER with Norwegian and English keys', () => {
      expect(CLINICAL_DISCLAIMER).toHaveProperty('no');
      expect(CLINICAL_DISCLAIMER).toHaveProperty('en');
      expect(typeof CLINICAL_DISCLAIMER.no).toBe('string');
      expect(typeof CLINICAL_DISCLAIMER.en).toBe('string');
    });
  });

  // ===========================================================================
  // redactPII
  // ===========================================================================

  describe('redactPII', () => {
    it('should return original value unchanged for null input', () => {
      const result = redactPII(null);
      expect(result.cleanText).toBeNull();
      expect(result.redacted).toBe(false);
      expect(result.redactedItems).toEqual([]);
    });

    it('should return original value unchanged for non-string input', () => {
      const result = redactPII(42);
      expect(result.cleanText).toBe(42);
      expect(result.redacted).toBe(false);
    });

    it('should return unchanged text when no PII is present', () => {
      const text = 'Patient reports lower back pain since three weeks.';
      const result = redactPII(text);
      expect(result.cleanText).toBe(text);
      expect(result.redacted).toBe(false);
      expect(result.redactedItems).toHaveLength(0);
    });

    it('should redact Norwegian fødselsnummer (11-digit national ID)', () => {
      const text = 'Pasient fødselsnummer 010190 12345 presenterte seg i dag.';
      const result = redactPII(text);
      expect(result.redacted).toBe(true);
      expect(result.cleanText).toContain('[FØDSELSNUMMER FJERNET]');
      expect(result.cleanText).not.toMatch(/\b\d{6}\s?\d{5}\b/);
    });

    it('should redact Norwegian mobile phone number starting with 4 or 9', () => {
      const text = 'Ring meg på 91234567 for time.';
      const result = redactPII(text);
      expect(result.redacted).toBe(true);
      expect(result.cleanText).toContain('[TELEFON FJERNET]');
      expect(result.redactedItems.some((i) => i.type === 'phone')).toBe(true);
    });

    it('should redact email address', () => {
      const text = 'Send epost til pasient@example.com angående time.';
      const result = redactPII(text);
      expect(result.redacted).toBe(true);
      expect(result.cleanText).toContain('[E-POST FJERNET]');
      expect(result.redactedItems.some((i) => i.type === 'email')).toBe(true);
    });

    it('should redact Norwegian bank account number', () => {
      const text = 'Konto 1234 56 78901 ble belastet.';
      const result = redactPII(text);
      expect(result.redacted).toBe(true);
      expect(result.cleanText).toContain('[KONTONUMMER FJERNET]');
      expect(result.redactedItems.some((i) => i.type === 'bankAccount')).toBe(true);
    });

    it('should report correct count of redacted items when multiple match', () => {
      const text = 'Epost: a@b.com og c@d.no — to adresser.';
      const result = redactPII(text);
      const emailItem = result.redactedItems.find((i) => i.type === 'email');
      expect(emailItem).toBeDefined();
      expect(emailItem.count).toBe(2);
    });

    it('should call logger.info when PII is redacted', () => {
      redactPII('Kontakt oss på test@clinic.no');
      expect(logger.info).toHaveBeenCalledWith(
        'PII redacted before cloud API call',
        expect.objectContaining({ types: expect.any(Array) })
      );
    });

    it('should NOT call logger.info when no PII is found', () => {
      redactPII('Pasienten har smerter i ryggen.');
      expect(logger.info).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // validateForCloudAPI
  // ===========================================================================

  describe('validateForCloudAPI', () => {
    it('should return valid=false for null input', () => {
      const result = validateForCloudAPI(null);
      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Empty or invalid text');
    });

    it('should return valid=false for empty string', () => {
      const result = validateForCloudAPI('');
      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Empty or invalid text');
    });

    it('should return valid=true for clean clinical text', () => {
      const result = validateForCloudAPI('Patient has cervicogenic headache, onset 2 weeks ago.');
      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should return valid=false when text contains PII', () => {
      const result = validateForCloudAPI('Pasient epost: pasient@test.no');
      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues[0]).toMatch(/PII/i);
    });

    it('should list detected PII types in the issues message', () => {
      const result = validateForCloudAPI('Ring 41234567 eller epost x@y.no');
      const issueText = result.issues[0];
      expect(issueText).toMatch(/phone|email/);
    });
  });

  // ===========================================================================
  // addDisclaimer
  // ===========================================================================

  describe('addDisclaimer', () => {
    it('should append Norwegian disclaimer by default', () => {
      const result = addDisclaimer('Behandlingsanbefaling her.');
      expect(result).toContain(CLINICAL_DISCLAIMER.no);
      expect(result).toContain('---');
    });

    it('should append English disclaimer when language is "en"', () => {
      const result = addDisclaimer('Treatment recommendation here.', 'en');
      expect(result).toContain(CLINICAL_DISCLAIMER.en);
    });

    it('should fall back to Norwegian disclaimer for unknown language code', () => {
      const result = addDisclaimer('Some text.', 'de');
      expect(result).toContain(CLINICAL_DISCLAIMER.no);
    });

    it('should return the original value unchanged for falsy input', () => {
      expect(addDisclaimer(null)).toBeNull();
      expect(addDisclaimer('')).toBe('');
      expect(addDisclaimer(undefined)).toBeUndefined();
    });

    it('should separate original text and disclaimer with newlines and a separator', () => {
      const result = addDisclaimer('Body text.', 'no');
      expect(result).toMatch(/Body text\.\n\n---\n/);
    });
  });

  // ===========================================================================
  // ensureCompliance
  // ===========================================================================

  describe('ensureCompliance', () => {
    it('should return compliant=true and autoRedacted=false for clean text', () => {
      const result = ensureCompliance('Klinisk vurdering uten persondata.');
      expect(result.compliant).toBe(true);
      expect(result.autoRedacted).toBe(false);
      expect(result.text).toBe('Klinisk vurdering uten persondata.');
    });

    it('should auto-redact PII and return compliant=true when autoRedact=true (default)', () => {
      const result = ensureCompliance('Pasient epost: john@test.no — vurder tilstand.');
      expect(result.compliant).toBe(true);
      expect(result.autoRedacted).toBe(true);
      expect(result.text).toContain('[E-POST FJERNET]');
      expect(result.redactedItems.length).toBeGreaterThan(0);
    });

    it('should return compliant=false when autoRedact=false and PII is present', () => {
      const result = ensureCompliance('Epost: test@clinic.no', { autoRedact: false });
      expect(result.compliant).toBe(false);
      expect(result.autoRedacted).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should include issues array when text is not compliant and autoRedact is off', () => {
      const result = ensureCompliance('Ring 91234567 nå', { autoRedact: false });
      expect(Array.isArray(result.issues)).toBe(true);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should preserve original text in result when text is already clean', () => {
      const text = 'Ingen PII her.';
      const result = ensureCompliance(text, { autoRedact: false });
      expect(result.text).toBe(text);
    });
  });
});
