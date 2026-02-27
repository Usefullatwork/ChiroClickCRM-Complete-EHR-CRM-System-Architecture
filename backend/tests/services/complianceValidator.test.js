/**
 * ComplianceValidator Tests
 * Verifies PII redaction, cloud API validation, and disclaimer handling
 */

import { jest } from '@jest/globals';

jest.unstable_mockModule('../../src/utils/logger.js', () => ({
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

const { redactPII, validateForCloudAPI, addDisclaimer, ensureCompliance, PII_PATTERNS } =
  await import('../../src/services/complianceValidator.js');

describe('ComplianceValidator', () => {
  describe('redactPII()', () => {
    it('should redact Norwegian fødselsnummer (11 digits)', () => {
      const result = redactPII('Pasient med fnr 01019012345 er innlagt');
      expect(result.redacted).toBe(true);
      expect(result.cleanText).toContain('[FØDSELSNUMMER FJERNET]');
      expect(result.cleanText).not.toContain('01019012345');
    });

    it('should redact phone numbers', () => {
      const result = redactPII('Ring pasienten på 41234567');
      expect(result.redacted).toBe(true);
      expect(result.cleanText).toContain('[TELEFON FJERNET]');
    });

    it('should redact phone numbers with +47 prefix', () => {
      const result = redactPII('Telefon: +47 91234567');
      expect(result.redacted).toBe(true);
      expect(result.cleanText).toContain('[TELEFON FJERNET]');
    });

    it('should redact email addresses', () => {
      const result = redactPII('Send rapport til pasient@example.com');
      expect(result.redacted).toBe(true);
      expect(result.cleanText).toContain('[E-POST FJERNET]');
    });

    it('should handle text without PII', () => {
      const result = redactPII('Pasienten har moderate korsryggsmerter');
      expect(result.redacted).toBe(false);
      expect(result.redactedItems).toHaveLength(0);
      expect(result.cleanText).toBe('Pasienten har moderate korsryggsmerter');
    });

    it('should handle null/empty input', () => {
      expect(redactPII(null).cleanText).toBeNull();
      expect(redactPII('').cleanText).toBe('');
      expect(redactPII(undefined).cleanText).toBeUndefined();
    });

    it('should redact multiple PII types in one text', () => {
      const text = 'Pasient 01019012345, tlf 91234567, epost test@test.no';
      const result = redactPII(text);
      expect(result.redacted).toBe(true);
      expect(result.redactedItems.length).toBeGreaterThanOrEqual(2);
    });

    it('should count redacted items correctly', () => {
      const text = 'Ring 91234567 eller 41234567 for avtale';
      const result = redactPII(text);
      const phoneItem = result.redactedItems.find((i) => i.type === 'phone');
      expect(phoneItem?.count).toBe(2);
    });
  });

  describe('validateForCloudAPI()', () => {
    it('should flag text containing PII', () => {
      const result = validateForCloudAPI('Pasient fnr 01019012345');
      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should pass clean text', () => {
      const result = validateForCloudAPI('Pasienten har moderate korsryggsmerter');
      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should reject empty text', () => {
      expect(validateForCloudAPI('').valid).toBe(false);
      expect(validateForCloudAPI(null).valid).toBe(false);
    });
  });

  describe('addDisclaimer()', () => {
    it('should add Norwegian disclaimer by default', () => {
      const result = addDisclaimer('AI-generert tekst');
      expect(result).toContain('kvalifisert helsepersonell');
    });

    it('should add English disclaimer when specified', () => {
      const result = addDisclaimer('AI-generated text', 'en');
      expect(result).toContain('qualified healthcare professional');
    });

    it('should handle null text', () => {
      expect(addDisclaimer(null)).toBeNull();
    });
  });

  describe('ensureCompliance()', () => {
    it('should auto-redact PII when autoRedact is true', () => {
      const result = ensureCompliance('Patient fnr 01019012345 report', { autoRedact: true });
      expect(result.compliant).toBe(true);
      expect(result.autoRedacted).toBe(true);
      expect(result.text).toContain('[FØDSELSNUMMER FJERNET]');
    });

    it('should report non-compliant when autoRedact is false', () => {
      const result = ensureCompliance('Patient fnr 01019012345', { autoRedact: false });
      expect(result.compliant).toBe(false);
    });

    it('should pass clean text through unchanged', () => {
      const result = ensureCompliance('Pasienten har korsryggsmerter');
      expect(result.compliant).toBe(true);
      expect(result.autoRedacted).toBe(false);
      expect(result.text).toBe('Pasienten har korsryggsmerter');
    });
  });

  describe('PII_PATTERNS', () => {
    it('should have patterns for common Norwegian PII types', () => {
      const types = PII_PATTERNS.map((p) => p.name);
      expect(types).toContain('fodselsnummer');
      expect(types).toContain('phone');
      expect(types).toContain('email');
    });
  });
});
