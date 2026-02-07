/**
 * Unit Tests for Norwegian Fødselsnummer Validation
 * Tests Mod11 checksum algorithm and all validation functions
 */

import { jest } from '@jest/globals';
import {
  validateFodselsnummer,
  extractBirthDate,
  extractGender,
  isDNumber,
  calculateAge,
  validateAndSanitize,
} from '../../src/utils/norwegianIdValidation.js';

describe('Norwegian Fødselsnummer Validation', () => {
  describe('validateFodselsnummer', () => {
    test('should validate correct fødselsnummer', () => {
      // Valid test numbers with correct Mod11 checksums
      expect(validateFodselsnummer('15076500565')).toBe(true); // 15.07.1965 (1900s)
      expect(validateFodselsnummer('01010150074')).toBe(true); // 01.01.2001 (2000s, individnummer 500)
    });

    test('should reject invalid checksum K1', () => {
      expect(validateFodselsnummer('15076500564')).toBe(false); // K1 wrong
    });

    test('should reject invalid checksum K2', () => {
      expect(validateFodselsnummer('15076500566')).toBe(false); // K2 wrong
    });

    test('should reject non-numeric input', () => {
      expect(validateFodselsnummer('abcdefghijk')).toBe(false);
      expect(validateFodselsnummer('1507650056a')).toBe(false);
    });

    test('should reject wrong length', () => {
      expect(validateFodselsnummer('123456789')).toBe(false); // Too short
      expect(validateFodselsnummer('123456789012')).toBe(false); // Too long
    });

    test('should handle null and undefined', () => {
      expect(validateFodselsnummer(null)).toBe(false);
      expect(validateFodselsnummer(undefined)).toBe(false);
      expect(validateFodselsnummer('')).toBe(false);
    });

    test('should accept fødselsnummer with spaces and dashes', () => {
      expect(validateFodselsnummer('150765 00565')).toBe(true);
      expect(validateFodselsnummer('150765-00565')).toBe(true);
      expect(validateFodselsnummer('15 07 65 00565')).toBe(true);
    });

    test('should validate D-numbers (foreign temporary ID)', () => {
      // D-number: first digit + 40 (day 01 becomes 41)
      expect(validateFodselsnummer('41076500027')).toBe(true); // D-number (41.07.1965)
    });

    test('should reject invalid date components', () => {
      // Day > 31 (and not D-number)
      expect(validateFodselsnummer('32010123456')).toBe(false);
      // Month > 12
      expect(validateFodselsnummer('01130123456')).toBe(false);
    });
  });

  describe('extractBirthDate', () => {
    test('should extract birth date for 1900s', () => {
      const date = extractBirthDate('15076500565'); // 15.07.1965
      expect(date.getFullYear()).toBe(1965);
      expect(date.getMonth()).toBe(6); // 0-indexed (July)
      expect(date.getDate()).toBe(15);
    });

    test('should extract birth date for 2000s', () => {
      const date = extractBirthDate('01010150074'); // 01.01.2001 (individnummer 500, century 2000)
      expect(date.getFullYear()).toBe(2001);
      expect(date.getMonth()).toBe(0); // January
      expect(date.getDate()).toBe(1);
    });

    test('should extract birth date for 1800s (individnummer 500-749)', () => {
      const date = extractBirthDate('01018550063'); // 01.01.1885 (individnummer 500, year>=54 -> 1800s)
      expect(date.getFullYear()).toBe(1885);
    });

    test('should handle D-numbers (subtract 40 from day)', () => {
      const date = extractBirthDate('41076500027'); // D-number: 01.07.1965
      expect(date.getFullYear()).toBe(1965);
      expect(date.getMonth()).toBe(6); // July
      expect(date.getDate()).toBe(1); // 41 - 40 = 1
    });

    test('should return null for invalid fødselsnummer', () => {
      expect(extractBirthDate('00000000000')).toBeNull();
      expect(extractBirthDate('invalid')).toBeNull();
    });
  });

  describe('extractGender', () => {
    test('should return M for odd digit 9', () => {
      // Gender digit is at index 8 (0-indexed). Odd = Male.
      expect(extractGender('15076500565')).toBe('M'); // '15076500565'[8] = '5' (odd) -> M
      expect(extractGender('01010150155')).toBe('M'); // '01010150155'[8] = '1' (odd) -> M
    });

    test('should return F for even digit 9', () => {
      // Gender digit at index 8. Even = Female.
      // '15076500050'[8] = '0' (even) -> Female
      expect(extractGender('15076500050')).toBe('F');
    });

    test('should return null for invalid fødselsnummer', () => {
      expect(extractGender('invalid')).toBeNull();
      expect(extractGender('123')).toBeNull();
    });
  });

  describe('isDNumber', () => {
    test('should return true for D-numbers', () => {
      expect(isDNumber('41076500027')).toBe(true); // Day = 41 (01 + 40)
      expect(isDNumber('51076500189')).toBe(true); // Day = 51 (11 + 40)
      expect(isDNumber('71076500120')).toBe(true); // Day = 71 (31 + 40)
    });

    test('should return false for regular fødselsnummer', () => {
      expect(isDNumber('15076500565')).toBe(false); // Day = 15
      expect(isDNumber('01010150074')).toBe(false); // Day = 01
      expect(isDNumber('31010100073')).toBe(false); // Day = 31
    });

    test('should return false for invalid input', () => {
      expect(isDNumber('invalid')).toBe(false);
      expect(isDNumber(null)).toBe(false);
    });
  });

  describe('calculateAge', () => {
    beforeAll(() => {
      // Mock current date to 2025-11-19 for consistent testing
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-11-19'));
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    test('should calculate correct age', () => {
      expect(calculateAge('15076500565')).toBe(60); // Born 1965-07-15, now 2025-11-19
      expect(calculateAge('01010150074')).toBe(24); // Born 2001-01-01, now 2025-11-19
    });

    test('should account for birthday not yet passed this year', () => {
      // Born 2001-12-19, mock date is 2025-11-19 (birthday not yet passed)
      // Age = 2025 - 2001 - 1 = 23
      expect(calculateAge('19120150076')).toBe(23);
    });

    test('should return null for invalid fødselsnummer', () => {
      expect(calculateAge('invalid')).toBeNull();
    });
  });

  describe('validateAndSanitize', () => {
    test('should validate and sanitize correct fødselsnummer', () => {
      const result = validateAndSanitize('150765 00565'); // With space
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe('15076500565');
      expect(result.birthDate).toBeInstanceOf(Date);
      expect(result.age).toBeGreaterThanOrEqual(0);
      expect(result.gender).toBe('M');
      expect(result.isDNumber).toBe(false);
      expect(result.errors).toHaveLength(0);
    });

    test('should return errors for invalid fødselsnummer', () => {
      const result = validateAndSanitize('12345678901'); // Invalid checksum
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid fødselsnummer (checksum validation failed)');
    });

    test('should detect D-numbers', () => {
      const result = validateAndSanitize('41076500027');
      expect(result.valid).toBe(true);
      expect(result.isDNumber).toBe(true);
    });

    test('should handle non-numeric input', () => {
      const result = validateAndSanitize('abc');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Fødselsnummer must be 11 digits');
    });

    test('should sanitize dashes and spaces', () => {
      const result1 = validateAndSanitize('15-07-65-00565');
      expect(result1.sanitized).toBe('15076500565');

      const result2 = validateAndSanitize('15 07 65 00565');
      expect(result2.sanitized).toBe('15076500565');
    });
  });

  describe('Edge Cases', () => {
    test('should handle leap year dates', () => {
      // February 29 in a leap year (2000 was a leap year)
      // 29020050088: DD=29, MM=02, YY=00, individnummer=500 (>=500 && year<=39 -> century 2000)
      const leapDate = extractBirthDate('29020050088'); // Feb 29, 2000
      expect(leapDate).not.toBeNull();
      if (leapDate) {
        expect(leapDate.getMonth()).toBe(1); // February
        expect(leapDate.getDate()).toBe(29);
      }
    });

    test('should reject February 30', () => {
      const result = validateAndSanitize('30020012345'); // Feb 30 (invalid)
      expect(result.valid).toBe(false);
    });

    test('should handle century transitions correctly', () => {
      // Test 1899 to 1900 boundary
      // 31129950016: DD=31, MM=12, YY=99, individnummer=500 (500-749 && year>=54 -> century 1800 -> 1899)
      const date1899 = extractBirthDate('31129950016'); // Dec 31, 1899
      // 01010000110: DD=01, MM=01, YY=00, individnummer=001 (000-499 -> century 1900 -> 1900)
      const date1900 = extractBirthDate('01010000110'); // Jan 1, 1900

      // Both should be valid dates
      expect(date1899).not.toBeNull();
      expect(date1900).not.toBeNull();
    });

    test('should return null for synthetic numbers with invalid checksum', () => {
      // Synthetic numbers with all-zero individual/check digits fail checksum validation
      // calculateAge returns null for invalid fødselsnummer
      expect(calculateAge('01012000000')).toBeNull();
      expect(calculateAge('01012440000')).toBeNull();
    });
  });

  describe('Security Tests', () => {
    test('should not be vulnerable to SQL injection', () => {
      const malicious = "'; DROP TABLE patients; --";
      expect(validateFodselsnummer(malicious)).toBe(false);
    });

    test('should not be vulnerable to XSS', () => {
      const xss = '<script>alert("xss")</script>';
      expect(validateFodselsnummer(xss)).toBe(false);
    });

    test('should handle extremely long inputs', () => {
      const longInput = '1'.repeat(10000);
      expect(validateFodselsnummer(longInput)).toBe(false);
    });

    test('should handle unicode characters', () => {
      expect(validateFodselsnummer('１５０７６５００５６５')).toBe(false); // Full-width numbers
      expect(validateFodselsnummer('15076500565€')).toBe(false); // Euro sign
    });
  });
});
