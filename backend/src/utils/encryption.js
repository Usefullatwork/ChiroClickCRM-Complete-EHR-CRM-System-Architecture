/**
 * Encryption Utilities
 * For sensitive data like Norwegian fødselsnummer (personal ID)
 * Uses AES-256-CBC encryption
 */

import crypto from 'crypto';
import dotenv from 'dotenv';
import logger from './logger.js';

dotenv.config();

const ALGORITHM = process.env.ENCRYPTION_ALGORITHM || 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

// Validate encryption key
if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
  logger.error('⚠️  WARNING: ENCRYPTION_KEY must be exactly 32 characters long');
  logger.error('⚠️  Please set a proper ENCRYPTION_KEY in your .env file');
  throw new Error('Invalid ENCRYPTION_KEY configuration');
}

/**
 * Encrypt sensitive data
 * @param {string} text - Plain text to encrypt
 * @returns {string} Encrypted text with IV prepended (hex format)
 */
export const encrypt = (text) => {
  if (!text) return null;

  try {
    // Generate random initialization vector
    const iv = crypto.randomBytes(16);

    // Create cipher
    const cipher = crypto.createCipheriv(
      ALGORITHM,
      Buffer.from(ENCRYPTION_KEY),
      iv
    );

    // Encrypt the text
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Return IV + encrypted data (IV is needed for decryption)
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    logger.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypt sensitive data
 * @param {string} encryptedText - Encrypted text with IV (hex format)
 * @returns {string} Decrypted plain text
 */
export const decrypt = (encryptedText) => {
  if (!encryptedText) return null;

  try {
    // Split IV and encrypted data
    const parts = encryptedText.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];

    // Create decipher
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      Buffer.from(ENCRYPTION_KEY),
      iv
    );

    // Decrypt the text
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    logger.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};

/**
 * Hash data (one-way, for comparison only)
 * Useful for searching without decrypting
 * @param {string} text - Text to hash
 * @returns {string} SHA-256 hash (hex format)
 */
export const hash = (text) => {
  if (!text) return null;

  return crypto
    .createHash('sha256')
    .update(text)
    .digest('hex');
};

/**
 * Validate Norwegian fødselsnummer checksum (Modulo 11)
 * @param {string} fodselsnummer - Cleaned 11-digit fødselsnummer
 * @returns {boolean} True if checksum is valid
 */
const validateFodselsnummerChecksum = (fodselsnummer) => {
  // Weights for first check digit (K1)
  const weights1 = [3, 7, 6, 1, 8, 9, 4, 5, 2];
  // Weights for second check digit (K2)
  const weights2 = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

  // Calculate K1 (check digit 1)
  let sum1 = 0;
  for (let i = 0; i < 9; i++) {
    sum1 += parseInt(fodselsnummer[i]) * weights1[i];
  }
  const k1 = 11 - (sum1 % 11);
  const expectedK1 = k1 === 11 ? 0 : k1;

  if (parseInt(fodselsnummer[9]) !== expectedK1) {
    return false;
  }

  // Calculate K2 (check digit 2)
  let sum2 = 0;
  for (let i = 0; i < 10; i++) {
    sum2 += parseInt(fodselsnummer[i]) * weights2[i];
  }
  const k2 = 11 - (sum2 % 11);
  const expectedK2 = k2 === 11 ? 0 : k2;

  if (parseInt(fodselsnummer[10]) !== expectedK2) {
    return false;
  }

  // Special case: if either checksum equals 10, the number is invalid
  if (k1 === 10 || k2 === 10) {
    return false;
  }

  return true;
};

/**
 * Validate Norwegian fødselsnummer (11 digits)
 * @param {string} fodselsnummer - Norwegian personal ID
 * @returns {boolean} True if valid format
 */
export const validateFodselsnummer = (fodselsnummer) => {
  if (!fodselsnummer) return false;

  // Remove any spaces or dashes
  const cleaned = fodselsnummer.replace(/[\s-]/g, '');

  // Must be exactly 11 digits
  if (!/^\d{11}$/.test(cleaned)) {
    return false;
  }

  // Extract date parts (DDMMYY)
  const day = parseInt(cleaned.substring(0, 2));
  const month = parseInt(cleaned.substring(2, 4));
  const year = parseInt(cleaned.substring(4, 6));

  // Basic date validation
  if (day < 1 || day > 31 || month < 1 || month > 12) {
    return false;
  }

  // Implement Modulo 11 checksum validation
  // Norwegian fødselsnummer uses two check digits (K1 at pos 9, K2 at pos 10)
  return validateFodselsnummerChecksum(cleaned);
};

/**
 * Mask sensitive data for logging/display
 * @param {string} text - Sensitive text
 * @param {number} visibleChars - Number of characters to show at start
 * @returns {string} Masked text (e.g., "12****5678")
 */
export const maskSensitive = (text, visibleChars = 2) => {
  if (!text || text.length <= visibleChars * 2) {
    return '****';
  }

  const start = text.substring(0, visibleChars);
  const end = text.substring(text.length - visibleChars);
  const masked = '*'.repeat(text.length - (visibleChars * 2));

  return start + masked + end;
};

export default {
  encrypt,
  decrypt,
  hash,
  validateFodselsnummer,
  maskSensitive
};
