/**
 * Unit Tests for Encryption Utilities
 * Tests encrypt/decrypt, hash, maskSensitive, and fodselsnummer validation
 */

import { jest } from '@jest/globals';

// Mock logger to avoid side effects
jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Import after mocking
const encryption = await import('../../../src/utils/encryption.js');
const {
  encrypt,
  decrypt,
  hash,
  maskSensitive,
  validateFodselsnummer,
  validateFodselsnummerDetailed,
  validateFodselsnummerWithDOB,
  getBirthYearFromFodselsnummer,
} = encryption;

describe('Encryption Utilities', () => {
  // =============================================================================
  // ENCRYPT / DECRYPT
  // =============================================================================

  describe('encrypt', () => {
    it('should return null for null input', () => {
      expect(encrypt(null)).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(encrypt('')).toBeNull();
    });

    it('should encrypt a simple string', () => {
      const result = encrypt('hello');
      expect(result).toBeDefined();
      expect(result).not.toBe('hello');
      expect(result).toContain(':');
    });

    it('should produce different ciphertext for same plaintext (random IV)', () => {
      const result1 = encrypt('same text');
      const result2 = encrypt('same text');
      expect(result1).not.toBe(result2);
    });

    it('should encrypt Norwegian characters', () => {
      const result = encrypt('Hei, dette er norsk: , , ');
      expect(result).toBeDefined();
      expect(result).toContain(':');
    });

    it('should encrypt a long string', () => {
      const longText = 'a'.repeat(10000);
      const result = encrypt(longText);
      expect(result).toBeDefined();
      expect(result).toContain(':');
    });

    it('should encrypt special characters', () => {
      const result = encrypt('!@#$%^&*()_+-=[]{}|;:,.<>?');
      expect(result).toBeDefined();
      expect(result).toContain(':');
    });

    it('should return hex format with IV:ciphertext', () => {
      const result = encrypt('test');
      const parts = result.split(':');
      expect(parts).toHaveLength(2);
      // IV should be 32 hex chars (16 bytes)
      expect(parts[0]).toMatch(/^[0-9a-f]{32}$/);
      // Ciphertext should be hex
      expect(parts[1]).toMatch(/^[0-9a-f]+$/);
    });
  });

  describe('decrypt', () => {
    it('should return null for null input', () => {
      expect(decrypt(null)).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(decrypt('')).toBeNull();
    });

    it('should decrypt an encrypted string', () => {
      const original = 'Hello, World!';
      const encrypted = encrypt(original);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(original);
    });

    it('should round-trip Norwegian characters', () => {
      const original = 'Norsk tekst med , , ';
      const encrypted = encrypt(original);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(original);
    });

    it('should round-trip special characters', () => {
      const original = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`"\'';
      const encrypted = encrypt(original);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(original);
    });

    it('should round-trip a long string', () => {
      const original = 'x'.repeat(5000);
      const encrypted = encrypt(original);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(original);
    });

    it('should throw for invalid encrypted data format (no colon)', () => {
      expect(() => decrypt('invaliddata')).toThrow('Failed to decrypt data');
    });

    it('should throw for corrupted ciphertext', () => {
      const encrypted = encrypt('test');
      const corrupted = encrypted.slice(0, -4) + 'zzzz';
      expect(() => decrypt(corrupted)).toThrow('Failed to decrypt data');
    });
  });

  // =============================================================================
  // HASH
  // =============================================================================

  describe('hash', () => {
    it('should return null for null input', () => {
      expect(hash(null)).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(hash('')).toBeNull();
    });

    it('should produce a 64-character hex string (SHA-256)', () => {
      const result = hash('test');
      expect(result).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should produce consistent hashes for same input', () => {
      const hash1 = hash('consistent');
      const hash2 = hash('consistent');
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different input', () => {
      const hash1 = hash('input1');
      const hash2 = hash('input2');
      expect(hash1).not.toBe(hash2);
    });

    it('should hash Norwegian characters', () => {
      const result = hash('norsk tekst med ae oe aa');
      expect(result).toMatch(/^[0-9a-f]{64}$/);
    });
  });

  // =============================================================================
  // MASK SENSITIVE
  // =============================================================================

  describe('maskSensitive', () => {
    it('should return **** for null input', () => {
      expect(maskSensitive(null)).toBe('****');
    });

    it('should return **** for empty string', () => {
      expect(maskSensitive('')).toBe('****');
    });

    it('should return **** for short strings (length <= visibleChars * 2)', () => {
      expect(maskSensitive('ab', 2)).toBe('****');
      expect(maskSensitive('abcd', 2)).toBe('****');
    });

    it('should mask middle characters with default visibleChars=2', () => {
      const result = maskSensitive('1234567890');
      expect(result).toBe('12******90');
    });

    it('should mask with custom visibleChars', () => {
      const result = maskSensitive('1234567890', 3);
      expect(result).toBe('123****890');
    });

    it('should handle fodselsnummer-length input', () => {
      const result = maskSensitive('12345678901', 3);
      expect(result).toBe('123*****901');
    });
  });

  // =============================================================================
  // VALIDATE FODSELSNUMMER
  // =============================================================================

  describe('validateFodselsnummer', () => {
    it('should return false for null', () => {
      expect(validateFodselsnummer(null)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(validateFodselsnummer('')).toBe(false);
    });

    it('should return false for non-digit input', () => {
      expect(validateFodselsnummer('abcdefghijk')).toBe(false);
    });

    it('should return false for wrong length', () => {
      expect(validateFodselsnummer('1234567890')).toBe(false);
      expect(validateFodselsnummer('123456789012')).toBe(false);
    });

    it('should return false for invalid day (0)', () => {
      expect(validateFodselsnummer('00019012345')).toBe(false);
    });

    it('should return false for invalid month (13)', () => {
      expect(validateFodselsnummer('01139012345')).toBe(false);
    });

    it('should return false for invalid month (0)', () => {
      expect(validateFodselsnummer('01009012345')).toBe(false);
    });

    it('should handle spaces and dashes in input', () => {
      // If the cleaned version would be invalid, should return false
      expect(validateFodselsnummer('123-45-67890')).toBe(false);
    });

    it('should return false for invalid checksum', () => {
      // Valid date but wrong check digits
      expect(validateFodselsnummer('01019000000')).toBe(false);
    });
  });

  describe('validateFodselsnummerDetailed', () => {
    it('should return error for null input', () => {
      const result = validateFodselsnummerDetailed(null);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return error for wrong length', () => {
      const result = validateFodselsnummerDetailed('12345');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('11 siffer');
    });

    it('should return error for invalid day', () => {
      const result = validateFodselsnummerDetailed('00019012345');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('dag');
    });

    it('should return error for invalid month', () => {
      const result = validateFodselsnummerDetailed('01139012345');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return error for invalid checksum', () => {
      const result = validateFodselsnummerDetailed('01019000000');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('kontrollsiffer');
    });
  });

  describe('getBirthYearFromFodselsnummer', () => {
    it('should return null for invalid fodselsnummer', () => {
      expect(getBirthYearFromFodselsnummer(null)).toBeNull();
      expect(getBirthYearFromFodselsnummer('invalid')).toBeNull();
    });
  });

  describe('validateFodselsnummerWithDOB', () => {
    it('should return false for invalid fodselsnummer', () => {
      expect(validateFodselsnummerWithDOB('invalid', '1990-01-01')).toBe(false);
    });

    it('should return false for invalid date of birth', () => {
      // Even if fodselsnummer were valid, invalid DOB string should return false
      expect(validateFodselsnummerWithDOB('01019000000', 'not-a-date')).toBe(false);
    });
  });
});
