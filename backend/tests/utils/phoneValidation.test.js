/**
 * Phone Validation Utility Tests
 * Tests for Norwegian and international phone number validation
 */

import { describe, it, expect } from '@jest/globals';
import {
  cleanPhoneNumber,
  extractCountryCode,
  validateNorwegianPhone,
  validatePhoneNumber,
  formatPhoneNumber,
  getSupportedCountryCodes,
  getCountryByISO,
  isMobileNumber,
  validatePhoneLenient,
  validatePhoneWithOptions,
  normalizePhoneForSearch,
  createSearchablePhoneVariants,
  COUNTRY_CODES
} from '../../src/utils/phoneValidation.js';

describe('Phone Validation Utility', () => {

  describe('cleanPhoneNumber', () => {
    it('should remove spaces', () => {
      expect(cleanPhoneNumber('123 456 789')).toBe('123456789');
    });

    it('should remove dashes', () => {
      expect(cleanPhoneNumber('123-456-789')).toBe('123456789');
    });

    it('should remove parentheses', () => {
      expect(cleanPhoneNumber('(123) 456-789')).toBe('123456789');
    });

    it('should remove dots', () => {
      expect(cleanPhoneNumber('123.456.789')).toBe('123456789');
    });

    it('should handle empty input', () => {
      expect(cleanPhoneNumber('')).toBe('');
      expect(cleanPhoneNumber(null)).toBe('');
      expect(cleanPhoneNumber(undefined)).toBe('');
    });

    it('should preserve plus sign', () => {
      expect(cleanPhoneNumber('+47 123 45 678')).toBe('+4712345678');
    });
  });

  describe('extractCountryCode', () => {
    it('should extract Norwegian country code', () => {
      const result = extractCountryCode('+4712345678');
      expect(result.countryCode).toBe('+47');
      expect(result.nationalNumber).toBe('12345678');
    });

    it('should extract Swedish country code', () => {
      const result = extractCountryCode('+46701234567');
      expect(result.countryCode).toBe('+46');
      expect(result.nationalNumber).toBe('701234567');
    });

    it('should extract Finnish country code (3-digit)', () => {
      const result = extractCountryCode('+358401234567');
      expect(result.countryCode).toBe('+358');
      expect(result.nationalNumber).toBe('401234567');
    });

    it('should use default country code when none provided', () => {
      const result = extractCountryCode('12345678');
      expect(result.countryCode).toBe('+47'); // Default is Norway
      expect(result.nationalNumber).toBe('12345678');
    });

    it('should remove leading zero from national number', () => {
      const result = extractCountryCode('012345678');
      expect(result.nationalNumber).toBe('12345678');
    });
  });

  describe('validateNorwegianPhone', () => {
    describe('Valid Norwegian numbers', () => {
      it('should accept 8-digit mobile number starting with 4', () => {
        const result = validateNorwegianPhone('41234567');
        expect(result.valid).toBe(true);
        expect(result.type).toBe('mobile');
      });

      it('should accept 8-digit mobile number starting with 9', () => {
        const result = validateNorwegianPhone('91234567');
        expect(result.valid).toBe(true);
        expect(result.type).toBe('mobile');
      });

      it('should accept landline numbers', () => {
        const prefixes = ['2', '3', '5', '6', '7'];
        prefixes.forEach(prefix => {
          const result = validateNorwegianPhone(`${prefix}1234567`);
          expect(result.valid).toBe(true);
          expect(result.type).toBe('landline');
        });
      });

      it('should accept number with +47 prefix', () => {
        const result = validateNorwegianPhone('+4741234567');
        expect(result.valid).toBe(true);
        expect(result.fullNumber).toBe('+4741234567');
      });

      it('should accept number with 0047 prefix', () => {
        const result = validateNorwegianPhone('004741234567');
        expect(result.valid).toBe(true);
      });

      it('should accept formatted numbers', () => {
        const result = validateNorwegianPhone('+47 412 34 567');
        expect(result.valid).toBe(true);
      });

      it('should format correctly', () => {
        const result = validateNorwegianPhone('41234567');
        expect(result.formatted).toBe('+47 412 34 567');
      });
    });

    describe('Invalid Norwegian numbers', () => {
      it('should reject numbers shorter than 8 digits', () => {
        const result = validateNorwegianPhone('1234567');
        expect(result.valid).toBe(false);
        expect(result.error).toContain('8 digits');
      });

      it('should reject numbers longer than 8 digits', () => {
        const result = validateNorwegianPhone('123456789');
        expect(result.valid).toBe(false);
      });

      it('should reject invalid prefix (0)', () => {
        const result = validateNorwegianPhone('01234567');
        expect(result.valid).toBe(false);
      });

      it('should reject invalid prefix (1)', () => {
        const result = validateNorwegianPhone('11234567');
        expect(result.valid).toBe(false);
      });

      it('should reject invalid prefix (8)', () => {
        const result = validateNorwegianPhone('81234567');
        expect(result.valid).toBe(false);
      });
    });
  });

  describe('validatePhoneNumber', () => {
    describe('Norwegian numbers', () => {
      it('should validate 8-digit Norwegian number', () => {
        const result = validatePhoneNumber('41234567');
        expect(result.valid).toBe(true);
        expect(result.country).toBe('Norway');
        expect(result.countryCode).toBe('+47');
      });

      it('should validate with explicit +47', () => {
        const result = validatePhoneNumber('+4741234567');
        expect(result.valid).toBe(true);
      });
    });

    describe('Swedish numbers', () => {
      it('should validate 9-digit Swedish mobile', () => {
        const result = validatePhoneNumber('+46701234567');
        expect(result.valid).toBe(true);
        expect(result.country).toBe('Sweden');
      });
    });

    describe('Danish numbers', () => {
      it('should validate 8-digit Danish number', () => {
        const result = validatePhoneNumber('+4512345678');
        expect(result.valid).toBe(true);
        expect(result.country).toBe('Denmark');
      });
    });

    describe('UK numbers', () => {
      it('should validate 10-digit UK mobile', () => {
        const result = validatePhoneNumber('+447123456789');
        expect(result.valid).toBe(true);
        expect(result.country).toBe('United Kingdom');
      });
    });

    describe('US/Canada numbers', () => {
      it('should validate 10-digit US number', () => {
        const result = validatePhoneNumber('+12025551234');
        expect(result.valid).toBe(true);
        expect(result.country).toBe('USA/Canada');
      });
    });

    describe('German numbers', () => {
      it('should validate German mobile', () => {
        const result = validatePhoneNumber('+491512345678');
        expect(result.valid).toBe(true);
        expect(result.country).toBe('Germany');
      });
    });

    describe('Error handling', () => {
      it('should reject empty phone', () => {
        const result = validatePhoneNumber('');
        expect(result.valid).toBe(false);
        expect(result.error).toContain('required');
      });

      it('should reject null phone', () => {
        const result = validatePhoneNumber(null);
        expect(result.valid).toBe(false);
      });

      it('should reject too short numbers', () => {
        const result = validatePhoneNumber('+471234'); // Too short for Norway
        expect(result.valid).toBe(false);
        expect(result.error).toContain('at least');
      });

      it('should reject too long numbers', () => {
        const result = validatePhoneNumber('+471234567890'); // Too long for Norway
        expect(result.valid).toBe(false);
        expect(result.error).toContain('at most');
      });

      it('should reject non-numeric characters', () => {
        const result = validatePhoneNumber('+47ABCD1234');
        expect(result.valid).toBe(false);
        expect(result.error).toContain('digits');
      });
    });

    describe('Default country code', () => {
      it('should use Norway (+47) as default', () => {
        const result = validatePhoneNumber('41234567');
        expect(result.countryCode).toBe('+47');
      });

      it('should allow overriding default country code', () => {
        const result = validatePhoneNumber('701234567', '+46');
        expect(result.countryCode).toBe('+46');
        expect(result.country).toBe('Sweden');
      });
    });
  });

  describe('formatPhoneNumber', () => {
    it('should format as international (default)', () => {
      const result = formatPhoneNumber('+4741234567');
      expect(result).toBe('+47 412 34 567');
    });

    it('should format as E.164', () => {
      const result = formatPhoneNumber('41234567', 'e164');
      expect(result).toBe('+4741234567');
    });

    it('should format as national', () => {
      const result = formatPhoneNumber('+4741234567', 'national');
      expect(result).toBe('41234567');
    });

    it('should return original for invalid numbers', () => {
      const result = formatPhoneNumber('invalid');
      expect(result).toBe('invalid');
    });
  });

  describe('getSupportedCountryCodes', () => {
    it('should return array of country codes', () => {
      const codes = getSupportedCountryCodes();
      expect(Array.isArray(codes)).toBe(true);
      expect(codes.length).toBeGreaterThan(0);
    });

    it('should include Norway', () => {
      const codes = getSupportedCountryCodes();
      const norway = codes.find(c => c.countryCode === 'NO');
      expect(norway).toBeDefined();
      expect(norway.code).toBe('+47');
    });

    it('should be sorted alphabetically by country', () => {
      const codes = getSupportedCountryCodes();
      const countries = codes.map(c => c.country);
      const sorted = [...countries].sort();
      expect(countries).toEqual(sorted);
    });

    it('should have code, country, and countryCode fields', () => {
      const codes = getSupportedCountryCodes();
      codes.forEach(c => {
        expect(c).toHaveProperty('code');
        expect(c).toHaveProperty('country');
        expect(c).toHaveProperty('countryCode');
      });
    });
  });

  describe('getCountryByISO', () => {
    it('should find Norway by ISO code', () => {
      const result = getCountryByISO('NO');
      expect(result).toBeDefined();
      expect(result.code).toBe('+47');
      expect(result.country).toBe('Norway');
    });

    it('should find Sweden by ISO code', () => {
      const result = getCountryByISO('SE');
      expect(result).toBeDefined();
      expect(result.code).toBe('+46');
    });

    it('should be case-insensitive', () => {
      const result = getCountryByISO('no');
      expect(result).toBeDefined();
      expect(result.code).toBe('+47');
    });

    it('should return null for unknown ISO code', () => {
      const result = getCountryByISO('XX');
      expect(result).toBeNull();
    });

    it('should handle null/undefined', () => {
      expect(getCountryByISO(null)).toBeNull();
      expect(getCountryByISO(undefined)).toBeNull();
    });
  });

  describe('isMobileNumber', () => {
    it('should detect Norwegian mobile (starting with 4)', () => {
      const result = isMobileNumber('+4741234567');
      expect(result).toBe(true);
    });

    it('should detect Norwegian mobile (starting with 9)', () => {
      const result = isMobileNumber('+4791234567');
      expect(result).toBe(true);
    });

    it('should detect Norwegian landline', () => {
      const result = isMobileNumber('+4721234567');
      expect(result).toBe(false);
    });

    it('should detect Swedish mobile (starting with 7)', () => {
      const result = isMobileNumber('+46701234567');
      expect(result).toBe(true);
    });

    it('should return null for invalid numbers', () => {
      const result = isMobileNumber('invalid');
      expect(result).toBeNull();
    });
  });

  describe('COUNTRY_CODES configuration', () => {
    it('should have Norway configured correctly', () => {
      const norway = COUNTRY_CODES['+47'];
      expect(norway).toBeDefined();
      expect(norway.minLength).toBe(8);
      expect(norway.maxLength).toBe(8);
      expect(norway.countryCode).toBe('NO');
    });

    it('should have mobile prefixes for countries that support detection', () => {
      const norway = COUNTRY_CODES['+47'];
      expect(norway.mobilePrefix).toEqual(['4', '9']);

      const sweden = COUNTRY_CODES['+46'];
      expect(sweden.mobilePrefix).toEqual(['7']);
    });

    it('should have all Nordic countries', () => {
      expect(COUNTRY_CODES['+47']).toBeDefined(); // Norway
      expect(COUNTRY_CODES['+46']).toBeDefined(); // Sweden
      expect(COUNTRY_CODES['+45']).toBeDefined(); // Denmark
      expect(COUNTRY_CODES['+358']).toBeDefined(); // Finland
      expect(COUNTRY_CODES['+354']).toBeDefined(); // Iceland
    });
  });

  describe('validatePhoneLenient', () => {
    it('should accept phone with 7+ digits', () => {
      const result = validatePhoneLenient('1234567');
      expect(result.valid).toBe(true);
      expect(result.mode).toBe('lenient');
    });

    it('should reject phone with less than 7 digits', () => {
      const result = validatePhoneLenient('123456');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('at least 7');
    });

    it('should reject phone with more than 15 digits', () => {
      const result = validatePhoneLenient('1234567890123456');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('at most 15');
    });

    it('should add default country code when not provided', () => {
      const result = validatePhoneLenient('12345678');
      expect(result.fullNumber).toBe('+4712345678');
    });

    it('should preserve existing country code', () => {
      const result = validatePhoneLenient('+4612345678');
      expect(result.fullNumber).toBe('+4612345678');
    });

    it('should reject empty input', () => {
      const result = validatePhoneLenient('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('required');
    });

    it('should accept numbers with different formatting', () => {
      const result = validatePhoneLenient('+47 123 45 678');
      expect(result.valid).toBe(true);
    });
  });

  describe('validatePhoneWithOptions', () => {
    describe('mode: strict', () => {
      it('should validate Norwegian numbers strictly', () => {
        const result = validatePhoneWithOptions('41234567', { mode: 'strict' });
        expect(result.valid).toBe(true);
        expect(result.country).toBe('Norway');
      });

      it('should reject invalid Norwegian numbers', () => {
        const result = validatePhoneWithOptions('1234567', { mode: 'strict' });
        expect(result.valid).toBe(false);
      });
    });

    describe('mode: lenient', () => {
      it('should accept any 7-15 digit number', () => {
        const result = validatePhoneWithOptions('1234567', { mode: 'lenient' });
        expect(result.valid).toBe(true);
        expect(result.mode).toBe('lenient');
      });

      it('should accept international format', () => {
        const result = validatePhoneWithOptions('+1234567890', { mode: 'lenient' });
        expect(result.valid).toBe(true);
      });
    });

    describe('mode: format-only', () => {
      it('should accept any non-empty input', () => {
        const result = validatePhoneWithOptions('123', { mode: 'format-only' });
        expect(result.valid).toBe(true);
        expect(result.mode).toBe('format-only');
      });

      it('should add default country code', () => {
        const result = validatePhoneWithOptions('12345', { mode: 'format-only' });
        expect(result.formatted).toBe('+4712345');
      });

      it('should reject empty input', () => {
        const result = validatePhoneWithOptions('', { mode: 'format-only' });
        expect(result.valid).toBe(false);
      });

      it('should preserve existing country code', () => {
        const result = validatePhoneWithOptions('+46123', { mode: 'format-only' });
        expect(result.formatted).toBe('+46123');
      });
    });

    describe('default options', () => {
      it('should use default mode when not specified', () => {
        const result = validatePhoneWithOptions('41234567');
        expect(result.valid).toBe(true);
      });

      it('should allow overriding default country code', () => {
        const result = validatePhoneWithOptions('701234567', {
          mode: 'strict',
          defaultCountryCode: '+46'
        });
        expect(result.countryCode).toBe('+46');
      });
    });
  });

  describe('normalizePhoneForSearch', () => {
    it('should remove all non-digit characters', () => {
      expect(normalizePhoneForSearch('+47 123 45 678')).toBe('4712345678');
    });

    it('should remove dashes and parentheses', () => {
      expect(normalizePhoneForSearch('(123) 456-7890')).toBe('1234567890');
    });

    it('should handle empty input', () => {
      expect(normalizePhoneForSearch('')).toBe('');
      expect(normalizePhoneForSearch(null)).toBe('');
      expect(normalizePhoneForSearch(undefined)).toBe('');
    });

    it('should preserve only digits', () => {
      expect(normalizePhoneForSearch('abc123def456')).toBe('123456');
    });
  });

  describe('createSearchablePhoneVariants', () => {
    it('should create all variant formats', () => {
      const result = createSearchablePhoneVariants('+4741234567');
      expect(result).toHaveProperty('e164');
      expect(result).toHaveProperty('national');
      expect(result).toHaveProperty('digits');
      expect(result).toHaveProperty('formatted');
    });

    it('should normalize Norwegian number correctly', () => {
      const result = createSearchablePhoneVariants('41234567');
      expect(result.e164).toBe('+4741234567');
      expect(result.digits).toBe('4741234567');
    });

    it('should extract national number', () => {
      const result = createSearchablePhoneVariants('+4741234567');
      expect(result.national).toBe('41234567');
    });

    it('should handle invalid input gracefully', () => {
      const result = createSearchablePhoneVariants('');
      expect(result.e164).toBe('');
      expect(result.national).toBe('');
      expect(result.digits).toBe('');
    });

    it('should handle null input', () => {
      const result = createSearchablePhoneVariants(null);
      expect(result).toHaveProperty('e164');
      expect(result).toHaveProperty('digits');
    });

    it('should preserve formatted version', () => {
      const result = createSearchablePhoneVariants('+47 412 34 567');
      expect(result.formatted).toBeDefined();
    });
  });
});
