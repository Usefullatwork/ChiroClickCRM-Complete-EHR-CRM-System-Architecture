import {
  encryptFodselsnummer,
  decryptFodselsnummer,
  maskFodselsnummer,
  validateFodselsnummer,
  hashFodselsnummer
} from '../../../src/utils/encryption.js';

describe('Encryption Utils', () => {
  describe('encryptFodselsnummer', () => {
    it('should encrypt a valid fødselsnummer', () => {
      const fodselsnummer = '01010199999';
      const encrypted = encryptFodselsnummer(fodselsnummer);

      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(fodselsnummer);
      expect(encrypted).toContain(':'); // IV:encrypted format
    });

    it('should produce different encrypted values for the same input (random IV)', () => {
      const fodselsnummer = '01010199999';
      const encrypted1 = encryptFodselsnummer(fodselsnummer);
      const encrypted2 = encryptFodselsnummer(fodselsnummer);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should handle null or undefined input', () => {
      expect(encryptFodselsnummer(null)).toBeNull();
      expect(encryptFodselsnummer(undefined)).toBeNull();
    });
  });

  describe('decryptFodselsnummer', () => {
    it('should decrypt an encrypted fødselsnummer', () => {
      const original = '01010199999';
      const encrypted = encryptFodselsnummer(original);
      const decrypted = decryptFodselsnummer(encrypted);

      expect(decrypted).toBe(original);
    });

    it('should handle invalid encrypted data', () => {
      expect(() => decryptFodselsnummer('invalid')).toThrow();
    });

    it('should handle null or undefined input', () => {
      expect(decryptFodselsnummer(null)).toBeNull();
      expect(decryptFodselsnummer(undefined)).toBeNull();
    });
  });

  describe('maskFodselsnummer', () => {
    it('should mask middle digits', () => {
      const fodselsnummer = '01010199999';
      const masked = maskFodselsnummer(fodselsnummer);

      expect(masked).toBe('010101*****');
    });

    it('should handle null input', () => {
      expect(maskFodselsnummer(null)).toBeNull();
    });
  });

  describe('validateFodselsnummer', () => {
    it('should validate correct format (11 digits)', () => {
      expect(validateFodselsnummer('01010199999')).toBe(true);
      expect(validateFodselsnummer('31129912345')).toBe(true);
    });

    it('should reject invalid formats', () => {
      expect(validateFodselsnummer('123')).toBe(false);
      expect(validateFodselsnummer('abc12345678')).toBe(false);
      expect(validateFodselsnummer('01010199999 extra')).toBe(false);
    });

    it('should reject invalid dates', () => {
      expect(validateFodselsnummer('00010199999')).toBe(false); // Day 00
      expect(validateFodselsnummer('32010199999')).toBe(false); // Day 32
      expect(validateFodselsnummer('01000199999')).toBe(false); // Month 00
      expect(validateFodselsnummer('01130199999')).toBe(false); // Month 13
    });

    it('should handle null or undefined input', () => {
      expect(validateFodselsnummer(null)).toBe(false);
      expect(validateFodselsnummer(undefined)).toBe(false);
    });
  });

  describe('hashFodselsnummer', () => {
    it('should produce consistent hash for same input', () => {
      const fodselsnummer = '01010199999';
      const hash1 = hashFodselsnummer(fodselsnummer);
      const hash2 = hashFodselsnummer(fodselsnummer);

      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different inputs', () => {
      const hash1 = hashFodselsnummer('01010199999');
      const hash2 = hashFodselsnummer('01010100000');

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('Encryption round-trip integrity', () => {
    const testCases = [
      '01010199999',
      '31129912345',
      '15068512345',
      '29029612345'
    ];

    testCases.forEach(fodselsnummer => {
      it(`should maintain integrity for ${fodselsnummer}`, () => {
        const encrypted = encryptFodselsnummer(fodselsnummer);
        const decrypted = decryptFodselsnummer(encrypted);

        expect(decrypted).toBe(fodselsnummer);
      });
    });
  });
});
