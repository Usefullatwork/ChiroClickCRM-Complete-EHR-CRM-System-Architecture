/**
 * Unit Tests for Encryption Key Validation
 * Verifies that PHI encryption keys are properly validated
 * across production, development, desktop, and test environments.
 */

import { jest } from '@jest/globals';

// Mock logger before importing the module under test
const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  default: mockLogger,
}));

/**
 * Helper: import a fresh copy of validateEncryptionKey with the given env vars.
 * Jest ESM caching makes re-importing tricky, so we call the function directly
 * after setting env vars — the function reads process.env at call-time.
 */
async function loadValidator() {
  const mod = await import('../../../src/utils/encryption.js');
  return mod.validateEncryptionKey;
}

// Snapshot original env values so we can restore after each test
const originalEnv = { ...process.env };

afterEach(() => {
  // Restore original env
  process.env.NODE_ENV = originalEnv.NODE_ENV;
  process.env.DESKTOP_MODE = originalEnv.DESKTOP_MODE;
  process.env.ENCRYPTION_KEY = originalEnv.ENCRYPTION_KEY;
  jest.clearAllMocks();
});

describe('validateEncryptionKey', () => {
  let validateEncryptionKey;

  beforeAll(async () => {
    validateEncryptionKey = await loadValidator();
  });

  // -------------------------------------------------------------------------
  // Production mode (NODE_ENV=production, DESKTOP_MODE unset)
  // -------------------------------------------------------------------------
  describe('production mode (non-desktop)', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
      delete process.env.DESKTOP_MODE;
    });

    it('should throw when ENCRYPTION_KEY is missing', () => {
      delete process.env.ENCRYPTION_KEY;

      expect(() => validateEncryptionKey()).toThrow('FATAL');
      expect(() => validateEncryptionKey()).toThrow('not set');
    });

    it('should throw when ENCRYPTION_KEY is empty string', () => {
      process.env.ENCRYPTION_KEY = '';

      expect(() => validateEncryptionKey()).toThrow('FATAL');
    });

    it('should throw when ENCRYPTION_KEY is wrong length (too short)', () => {
      process.env.ENCRYPTION_KEY = 'tooshort';

      expect(() => validateEncryptionKey()).toThrow('FATAL');
      expect(() => validateEncryptionKey()).toThrow('32 characters');
    });

    it('should throw when ENCRYPTION_KEY is wrong length (too long)', () => {
      process.env.ENCRYPTION_KEY = 'a'.repeat(64);

      expect(() => validateEncryptionKey()).toThrow('FATAL');
      expect(() => validateEncryptionKey()).toThrow('32 characters');
    });

    it('should throw when ENCRYPTION_KEY is a known weak value (all zeros)', () => {
      process.env.ENCRYPTION_KEY = '00000000000000000000000000000000';

      expect(() => validateEncryptionKey()).toThrow('FATAL');
      expect(() => validateEncryptionKey()).toThrow('weak');
    });

    it('should throw when ENCRYPTION_KEY is a known weak value (sequential digits)', () => {
      process.env.ENCRYPTION_KEY = '12345678901234567890123456789012';

      expect(() => validateEncryptionKey()).toThrow('FATAL');
    });

    it('should pass with a valid 32-char key', () => {
      process.env.ENCRYPTION_KEY = 'MyStr0ng!Encrypt1onK3y2026Safe!!';

      const result = validateEncryptionKey();

      expect(result.valid).toBe(true);
      expect(result.reason).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // Development / test mode
  // -------------------------------------------------------------------------
  describe('development mode', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
      delete process.env.DESKTOP_MODE;
    });

    it('should warn but NOT throw when ENCRYPTION_KEY is missing', () => {
      delete process.env.ENCRYPTION_KEY;

      const result = validateEncryptionKey();

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('missing');
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should warn but NOT throw when ENCRYPTION_KEY is wrong length', () => {
      process.env.ENCRYPTION_KEY = 'short';

      const result = validateEncryptionKey();

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('invalid_length');
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should warn but NOT throw when ENCRYPTION_KEY is weak', () => {
      process.env.ENCRYPTION_KEY = '00000000000000000000000000000000';

      const result = validateEncryptionKey();

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('weak_key');
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should pass with a valid key', () => {
      process.env.ENCRYPTION_KEY = 'DevK3yF0rL0calD3v3l0pment!!!2026';

      const result = validateEncryptionKey();

      expect(result.valid).toBe(true);
    });
  });

  describe('test mode', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'test';
      delete process.env.DESKTOP_MODE;
    });

    it('should warn but NOT throw when ENCRYPTION_KEY is missing', () => {
      delete process.env.ENCRYPTION_KEY;

      const result = validateEncryptionKey();

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('missing');
    });
  });

  // -------------------------------------------------------------------------
  // Desktop mode (DESKTOP_MODE=true) — auto-generated key from machine ID
  // -------------------------------------------------------------------------
  describe('desktop mode (Electron)', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
      process.env.DESKTOP_MODE = 'true';
    });

    it('should NOT throw in production+desktop when key is missing', () => {
      delete process.env.ENCRYPTION_KEY;

      const result = validateEncryptionKey();

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('missing');
      // Key point: no throw, only warning
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should NOT throw in production+desktop when key is wrong length', () => {
      process.env.ENCRYPTION_KEY = 'auto-gen-short';

      const result = validateEncryptionKey();

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('invalid_length');
    });

    it('should pass with a valid auto-generated 32-char key', () => {
      process.env.ENCRYPTION_KEY = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6';

      const result = validateEncryptionKey();

      expect(result.valid).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------------
  describe('edge cases', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
      delete process.env.DESKTOP_MODE;
    });

    it('should never log the actual key value', () => {
      const secretKey = 'SuperS3cretK3y!NeverLogTh1s!!!AB';
      process.env.ENCRYPTION_KEY = secretKey;

      validateEncryptionKey();

      // Check all logger calls — none should contain the actual key
      const allCalls = [
        ...mockLogger.info.mock.calls,
        ...mockLogger.warn.mock.calls,
        ...mockLogger.error.mock.calls,
        ...mockLogger.debug.mock.calls,
      ];

      for (const callArgs of allCalls) {
        const logOutput = callArgs.join(' ');
        expect(logOutput).not.toContain(secretKey);
      }
    });

    it('should reject all-ones weak key', () => {
      process.env.ENCRYPTION_KEY = '11111111111111111111111111111111';

      expect(() => validateEncryptionKey()).toThrow('FATAL');
    });

    it('should reject all-a weak key', () => {
      process.env.ENCRYPTION_KEY = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

      expect(() => validateEncryptionKey()).toThrow('FATAL');
    });

    it('should reject test1234 repeated weak key', () => {
      process.env.ENCRYPTION_KEY = 'test1234test1234test1234test1234';

      expect(() => validateEncryptionKey()).toThrow('FATAL');
    });

    it('should accept a key that is not in the weak list', () => {
      process.env.ENCRYPTION_KEY = 'Pr0duct10nR3adyK3y!ChiroClick26X';

      const result = validateEncryptionKey();

      expect(result.valid).toBe(true);
    });
  });
});
