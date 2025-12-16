/**
 * Encryption Utilities
 * For sensitive data like Norwegian fødselsnummer (personal ID)
 * Uses AES-256-CBC encryption
 */

import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const ALGORITHM = process.env.ENCRYPTION_ALGORITHM || 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

// Validate encryption key
if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
  console.error('⚠️  WARNING: ENCRYPTION_KEY must be exactly 32 characters long');
  console.error('⚠️  Please set a proper ENCRYPTION_KEY in your .env file');
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
    console.error('Encryption error:', error);
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
    console.error('Decryption error:', error);
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
 * Validate Norwegian fødselsnummer (11 digits)
 * Implements full Modulo 11 checksum validation
 * @param {string} fodselsnummer - Norwegian personal ID
 * @returns {boolean} True if valid format and checksum
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

  // Basic date validation (accounting for D-numbers where day += 40)
  const actualDay = day > 40 ? day - 40 : day;
  if (actualDay < 1 || actualDay > 31 || month < 1 || month > 12) {
    return false;
  }

  // Modulo 11 checksum validation
  // First check digit (position 10) - weights: 3, 7, 6, 1, 8, 9, 4, 5, 2
  const weights1 = [3, 7, 6, 1, 8, 9, 4, 5, 2];
  let sum1 = 0;
  for (let i = 0; i < 9; i++) {
    sum1 += parseInt(cleaned[i]) * weights1[i];
  }
  const remainder1 = sum1 % 11;
  const checkDigit1 = remainder1 === 0 ? 0 : 11 - remainder1;

  // If remainder results in 10, the fødselsnummer is invalid
  if (checkDigit1 === 10) {
    return false;
  }

  if (parseInt(cleaned[9]) !== checkDigit1) {
    return false;
  }

  // Second check digit (position 11) - weights: 5, 4, 3, 2, 7, 6, 5, 4, 3, 2
  const weights2 = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let sum2 = 0;
  for (let i = 0; i < 10; i++) {
    sum2 += parseInt(cleaned[i]) * weights2[i];
  }
  const remainder2 = sum2 % 11;
  const checkDigit2 = remainder2 === 0 ? 0 : 11 - remainder2;

  // If remainder results in 10, the fødselsnummer is invalid
  if (checkDigit2 === 10) {
    return false;
  }

  if (parseInt(cleaned[10]) !== checkDigit2) {
    return false;
  }

  return true;
};

/**
 * Determine the century from fødselsnummer individual number
 * @param {string} fodselsnummer - Norwegian personal ID
 * @returns {number|null} Full 4-digit birth year or null if invalid
 */
export const getBirthYearFromFodselsnummer = (fodselsnummer) => {
  if (!validateFodselsnummer(fodselsnummer)) return null;

  const cleaned = fodselsnummer.replace(/[\s-]/g, '');
  const yearDigits = parseInt(cleaned.substring(4, 6));
  const individualNumber = parseInt(cleaned.substring(6, 9));

  // Determine century based on individual number range
  // 000-499: 1900-1999
  // 500-749: 1854-1899 (historical) or 2000-2039
  // 750-899: 1854-1899 (historical) or 2000-2039
  // 900-999: 1940-1999

  let century;
  if (individualNumber >= 0 && individualNumber <= 499) {
    century = 1900;
  } else if (individualNumber >= 500 && individualNumber <= 749) {
    century = yearDigits >= 54 ? 1800 : 2000;
  } else if (individualNumber >= 750 && individualNumber <= 899) {
    century = yearDigits >= 54 ? 1800 : 2000;
  } else {
    century = yearDigits >= 40 ? 1900 : 2000;
  }

  return century + yearDigits;
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
  getBirthYearFromFodselsnummer,
  maskSensitive
};
