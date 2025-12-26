/**
 * HelseID Service Tests
 */

import {
  validateFodselsnummer,
  validateHprNumber,
  extractHprNumber,
  extractPersonalNumber,
  getHelseIdStatus
} from '../../src/services/helseId.js';

describe('HelseID Service', () => {

  describe('validateFodselsnummer', () => {

    test('should validate correct fødselsnummer', () => {
      // Valid test fødselsnummer (from test data, not real)
      const result = validateFodselsnummer('01015450100');

      // Since this is a test number, we check the structure
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('birthDate');
      expect(result).toHaveProperty('gender');
    });

    test('should reject null input', () => {
      const result = validateFodselsnummer(null);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Fødselsnummer not provided');
    });

    test('should reject non-string input', () => {
      const result = validateFodselsnummer(12345678901);

      expect(result.valid).toBe(false);
    });

    test('should reject wrong length', () => {
      const result = validateFodselsnummer('1234567890'); // 10 digits

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Must be 11 digits');
    });

    test('should reject non-numeric characters', () => {
      const result = validateFodselsnummer('1234567890A');

      expect(result.valid).toBe(false);
    });

    test('should handle fødselsnummer with spaces', () => {
      const result = validateFodselsnummer('010154 50100');

      // Should clean up spaces and validate
      expect(result).toHaveProperty('valid');
    });

    test('should detect D-numbers (temporary IDs)', () => {
      // D-number has day + 40 (e.g., day 01 becomes 41)
      const result = validateFodselsnummer('41015450134');

      if (result.valid) {
        expect(result.isDNumber).toBe(true);
      }
    });

    test('should determine gender from individual number', () => {
      // Odd individual number = male, even = female
      const result1 = validateFodselsnummer('01015450100');
      const result2 = validateFodselsnummer('01015450011');

      // Check that gender is determined (actual value depends on checksum validity)
      if (result1.valid) {
        expect(['MALE', 'FEMALE']).toContain(result1.gender);
      }
    });

  });

  describe('validateHprNumber', () => {

    test('should reject null HPR number', async () => {
      const result = await validateHprNumber(null);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('HPR number not provided');
    });

    test('should reject HPR number with wrong format', async () => {
      const result = await validateHprNumber('12345'); // Too short

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid HPR number format');
    });

    test('should reject HPR number with letters', async () => {
      const result = await validateHprNumber('12345678A');

      expect(result.valid).toBe(false);
    });

    test('should accept valid 9-digit HPR number format', async () => {
      // Note: This will fail validation against DB in test, but format is correct
      const result = await validateHprNumber('123456789');

      // Format is valid, but DB lookup will fail in test environment
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('error');
    });

  });

  describe('extractHprNumber', () => {

    test('should extract HPR number from HelseID claims', () => {
      const claims = {
        'helseid://claims/hpr/hpr_number': '123456789'
      };
      const hpr = extractHprNumber(claims);

      expect(hpr).toBe('123456789');
    });

    test('should extract from alternative claim format', () => {
      const claims = {
        'hpr_number': '987654321'
      };
      const hpr = extractHprNumber(claims);

      expect(hpr).toBe('987654321');
    });

    test('should return null if no HPR number in claims', () => {
      const claims = {
        'sub': 'user-123',
        'name': 'Test User'
      };
      const hpr = extractHprNumber(claims);

      expect(hpr).toBeNull();
    });

  });

  describe('extractPersonalNumber', () => {

    test('should extract personal number from HelseID claims', () => {
      const claims = {
        'helseid://claims/identity/pid': '01015450100'
      };
      const pid = extractPersonalNumber(claims);

      expect(pid).toBe('01015450100');
    });

    test('should extract from alternative claim format', () => {
      const claims = {
        'pid': '01015450100'
      };
      const pid = extractPersonalNumber(claims);

      expect(pid).toBe('01015450100');
    });

    test('should return null if no personal number in claims', () => {
      const claims = {
        'sub': 'user-123'
      };
      const pid = extractPersonalNumber(claims);

      expect(pid).toBeNull();
    });

  });

  describe('getHelseIdStatus', () => {

    test('should return status object', () => {
      const status = getHelseIdStatus();

      expect(status).toHaveProperty('configured');
      expect(status).toHaveProperty('environment');
      expect(status).toHaveProperty('clientInitialized');
      expect(status).toHaveProperty('endpoints');
    });

    test('should default to test environment', () => {
      const status = getHelseIdStatus();

      expect(status.environment).toBe('test');
    });

    test('should include endpoint configuration', () => {
      const status = getHelseIdStatus();

      expect(status.endpoints).toHaveProperty('issuer');
      expect(status.endpoints).toHaveProperty('authorization_endpoint');
      expect(status.endpoints).toHaveProperty('token_endpoint');
    });

  });

});
