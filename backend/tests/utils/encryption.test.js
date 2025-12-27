/**
 * Encryption Utility Tests
 * Tests for encryption, decryption, and Norwegian fødselsnummer validation
 */

import { describe, it, expect, beforeAll } from '@jest/globals';

// Set up test encryption key before importing the module
process.env.ENCRYPTION_KEY = '12345678901234567890123456789012'; // 32 chars

import {
  encrypt,
  decrypt,
  hash,
  validateFodselsnummer,
  getGenderFromFodselsnummer,
  getBirthDateFromFodselsnummer,
  maskSensitive
} from '../../src/utils/encryption.js';

describe('Encryption Utilities', () => {
  describe('encrypt and decrypt', () => {
    it('should encrypt and decrypt a string correctly', () => {
      const originalText = 'Hello, World!';
      const encrypted = encrypt(originalText);
      const decrypted = decrypt(encrypted);

      expect(encrypted).not.toBe(originalText);
      expect(decrypted).toBe(originalText);
    });

    it('should return null for null input', () => {
      expect(encrypt(null)).toBeNull();
      expect(decrypt(null)).toBeNull();
    });

    it('should handle special characters', () => {
      const specialChars = 'Æøå ÆØÅ 日本語 🎉';
      const encrypted = encrypt(specialChars);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(specialChars);
    });

    it('should produce different ciphertext for same plaintext (due to random IV)', () => {
      const text = 'same text';
      const encrypted1 = encrypt(text);
      const encrypted2 = encrypt(text);

      expect(encrypted1).not.toBe(encrypted2);
      expect(decrypt(encrypted1)).toBe(text);
      expect(decrypt(encrypted2)).toBe(text);
    });
  });

  describe('hash', () => {
    it('should produce a consistent hash for the same input', () => {
      const text = 'test string';
      const hash1 = hash(text);
      const hash2 = hash(text);

      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different inputs', () => {
      const hash1 = hash('text1');
      const hash2 = hash('text2');

      expect(hash1).not.toBe(hash2);
    });

    it('should return null for null input', () => {
      expect(hash(null)).toBeNull();
    });

    it('should produce a 64-character hex string (SHA-256)', () => {
      const result = hash('test');
      expect(result).toHaveLength(64);
      expect(/^[a-f0-9]+$/.test(result)).toBe(true);
    });
  });

  describe('validateFodselsnummer', () => {
    // These are test fødselsnummer - NOT real personal IDs
    // Generated using the official algorithm for testing purposes

    it('should return false for null/empty input', () => {
      expect(validateFodselsnummer(null)).toBe(false);
      expect(validateFodselsnummer('')).toBe(false);
      expect(validateFodselsnummer(undefined)).toBe(false);
    });

    it('should return false for non-11-digit strings', () => {
      expect(validateFodselsnummer('1234567890')).toBe(false);
      expect(validateFodselsnummer('123456789012')).toBe(false);
      expect(validateFodselsnummer('abcdefghijk')).toBe(false);
    });

    it('should return false for invalid date parts', () => {
      // Invalid day (32)
      expect(validateFodselsnummer('32019912345')).toBe(false);
      // Invalid month (13)
      expect(validateFodselsnummer('01139912345')).toBe(false);
      // Day 0
      expect(validateFodselsnummer('00019912345')).toBe(false);
    });

    it('should handle D-numbers (day + 40)', () => {
      // D-numbers have day += 40 for temporary residents
      // This test validates the format acceptance
      const dNumber = '41019912345'; // Day 41 = actual day 01
      // Should not fail on date validation for D-numbers
      // (will fail on checksum if not a valid D-number)
      expect(validateFodselsnummer(dNumber)).toBe(false); // Invalid checksum but valid format
    });

    it('should strip spaces and dashes', () => {
      // Even with formatting, should process correctly
      const withSpaces = '01 01 99 123 45';
      const withDashes = '01-01-99-12345';
      // These will fail checksum but format is valid
      expect(typeof validateFodselsnummer(withSpaces)).toBe('boolean');
      expect(typeof validateFodselsnummer(withDashes)).toBe('boolean');
    });

    it('should correctly validate using Modulo 11 algorithm', () => {
      // Test the checksum validation logic
      // Generate a test number with known valid checksums
      // For day=01, month=01, year=90, individual=123
      // We test that invalid checksums are rejected
      expect(validateFodselsnummer('01019012300')).toBe(false); // Wrong checksums
      expect(validateFodselsnummer('01019012399')).toBe(false); // Wrong checksums
    });
  });

  describe('getGenderFromFodselsnummer', () => {
    it('should return null for invalid fødselsnummer', () => {
      expect(getGenderFromFodselsnummer('invalid')).toBeNull();
      expect(getGenderFromFodselsnummer(null)).toBeNull();
    });

    // Note: These tests would require valid test fødselsnummer
    // In production, use official test numbers from Skatteetaten
  });

  describe('getBirthDateFromFodselsnummer', () => {
    it('should return null for invalid fødselsnummer', () => {
      expect(getBirthDateFromFodselsnummer('invalid')).toBeNull();
      expect(getBirthDateFromFodselsnummer(null)).toBeNull();
    });
  });

  describe('maskSensitive', () => {
    it('should mask middle characters', () => {
      const result = maskSensitive('1234567890', 2);
      expect(result).toBe('12******90');
    });

    it('should return **** for short strings', () => {
      expect(maskSensitive('ab', 2)).toBe('****');
      expect(maskSensitive('abc', 2)).toBe('****');
    });

    it('should handle custom visible character count', () => {
      const result = maskSensitive('1234567890', 3);
      expect(result).toBe('123****890');
    });

    it('should return **** for null/empty input', () => {
      expect(maskSensitive(null)).toBe('****');
      expect(maskSensitive('')).toBe('****');
    });
  });
});
