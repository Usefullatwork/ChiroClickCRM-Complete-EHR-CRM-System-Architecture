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
 * Validate Norwegian fødselsnummer (11 digits) with full Modulus 11 checksum
 * @param {string} fodselsnummer - Norwegian personal ID
 * @returns {boolean} True if valid
 */
export const validateFodselsnummer = (fodselsnummer) => {
  if (!fodselsnummer) return false;

  // Remove any spaces or dashes
  const cleaned = fodselsnummer.replace(/[\s-]/g, '');

  // Must be exactly 11 digits
  if (!/^\d{11}$/.test(cleaned)) {
    return false;
  }

  // Extract digits as array of numbers
  const digits = cleaned.split('').map(d => parseInt(d, 10));

  // Extract date parts (DDMMYY)
  const day = parseInt(cleaned.substring(0, 2));
  const month = parseInt(cleaned.substring(2, 4));

  // Basic date validation (day 1-31, month 1-12)
  // Note: D-numbers add 40 to day, H-numbers add 40 to month
  const isDNumber = day > 40 && day <= 71;
  const isHNumber = month > 40 && month <= 52;

  const actualDay = isDNumber ? day - 40 : day;
  const actualMonth = isHNumber ? month - 40 : month;

  if (actualDay < 1 || actualDay > 31 || actualMonth < 1 || actualMonth > 12) {
    return false;
  }

  // Modulus 11 validation - Control digit 1 (k1)
  // Weights for first control digit: 3, 7, 6, 1, 8, 9, 4, 5, 2
  const weights1 = [3, 7, 6, 1, 8, 9, 4, 5, 2];
  let sum1 = 0;
  for (let i = 0; i < 9; i++) {
    sum1 += digits[i] * weights1[i];
  }

  let k1 = 11 - (sum1 % 11);
  if (k1 === 11) k1 = 0;
  if (k1 === 10) return false; // Invalid number

  // Check first control digit
  if (k1 !== digits[9]) {
    return false;
  }

  // Modulus 11 validation - Control digit 2 (k2)
  // Weights for second control digit: 5, 4, 3, 2, 7, 6, 5, 4, 3, 2
  const weights2 = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let sum2 = 0;
  for (let i = 0; i < 10; i++) {
    sum2 += digits[i] * weights2[i];
  }

  let k2 = 11 - (sum2 % 11);
  if (k2 === 11) k2 = 0;
  if (k2 === 10) return false; // Invalid number

  // Check second control digit
  if (k2 !== digits[10]) {
    return false;
  }

  return true;
};

/**
 * Extract information from a valid fødselsnummer
 * @param {string} fodselsnummer - Norwegian personal ID
 * @returns {object|null} Extracted info or null if invalid
 */
export const parseFodselsnummer = (fodselsnummer) => {
  if (!validateFodselsnummer(fodselsnummer)) {
    return null;
  }

  const cleaned = fodselsnummer.replace(/[\s-]/g, '');

  let day = parseInt(cleaned.substring(0, 2));
  let month = parseInt(cleaned.substring(2, 4));
  const yearPart = parseInt(cleaned.substring(4, 6));
  const individualNumber = parseInt(cleaned.substring(6, 9));

  // Detect D-number (temporary ID for foreigners) - day += 40
  const isDNumber = day > 40;
  if (isDNumber) day -= 40;

  // Detect H-number (auxiliary number) - month += 40
  const isHNumber = month > 40;
  if (isHNumber) month -= 40;

  // Determine century based on individual number
  // 000-499: 1900-1999
  // 500-749: 1854-1899 or 2000-2039
  // 750-899: 1854-1899 or 2000-2039
  // 900-999: 1940-1999
  let century;
  if (individualNumber < 500) {
    century = yearPart < 40 ? 2000 : 1900;
  } else if (individualNumber < 750) {
    century = yearPart < 40 ? 2000 : 1800;
  } else if (individualNumber < 900) {
    century = yearPart < 40 ? 2000 : 1800;
  } else {
    century = 1900; // 900-999 only valid for 1940-1999
  }

  const fullYear = century + yearPart;

  // Gender: odd individual number = male, even = female
  const isMale = individualNumber % 2 === 1;

  return {
    birthDate: new Date(fullYear, month - 1, day),
    day,
    month,
    year: fullYear,
    gender: isMale ? 'MALE' : 'FEMALE',
    isDNumber,
    isHNumber,
    individualNumber
  };
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
  parseFodselsnummer,
  maskSensitive
};
