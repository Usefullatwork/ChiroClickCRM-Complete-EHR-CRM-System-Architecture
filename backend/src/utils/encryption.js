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
 * Norwegian Fødselsnummer Validation with Modulo 11 Algorithm
 *
 * Fødselsnummer format: DDMMYYIIIKK (11 digits)
 * - DD = day (01-31, or 41-71 for D-numbers)
 * - MM = month (01-12, or 41-52 for H-numbers)
 * - YY = year (00-99)
 * - III = individual number (determines century and gender)
 * - KK = two control digits (Modulo 11 checksum)
 *
 * D-numbers: For temporary residents, day + 40 (e.g., day 01 becomes 41)
 * H-numbers: For healthcare use, month + 40 (e.g., month 01 becomes 41)
 */

// Weight arrays for Modulo 11 calculation
const WEIGHTS_K1 = [3, 7, 6, 1, 8, 9, 4, 5, 2];
const WEIGHTS_K2 = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

/**
 * Calculate control digit using Modulo 11 algorithm
 * @param {number[]} digits - Array of digits to calculate from
 * @param {number[]} weights - Weight array for calculation
 * @returns {number|null} Control digit (0-9), or null if invalid (remainder = 1)
 */
const calculateControlDigit = (digits, weights) => {
  const sum = digits.reduce((acc, digit, index) => {
    return acc + digit * weights[index];
  }, 0);

  const remainder = sum % 11;

  if (remainder === 0) {
    return 0;
  } else if (remainder === 1) {
    // Invalid - no valid control digit exists
    return null;
  } else {
    return 11 - remainder;
  }
};

/**
 * Determine century from individual number and year
 * Based on Norwegian rules for fødselsnummer
 * @param {number} year - Two-digit year (00-99)
 * @param {number} individualNumber - Three-digit individual number (000-999)
 * @returns {number} Full century year (1800, 1900, or 2000)
 */
const determineCentury = (year, individualNumber) => {
  // Individual numbers 000-499: 1900-1999
  if (individualNumber >= 0 && individualNumber <= 499) {
    return 1900;
  }

  // Individual numbers 500-749:
  // - Years 00-39: 2000-2039
  // - Years 54-99: 1854-1899
  if (individualNumber >= 500 && individualNumber <= 749) {
    if (year >= 0 && year <= 39) {
      return 2000;
    } else if (year >= 54 && year <= 99) {
      return 1800;
    }
  }

  // Individual numbers 750-899:
  // - Years 00-39: 2000-2039 (extended range for future births)
  if (individualNumber >= 750 && individualNumber <= 899) {
    if (year >= 0 && year <= 39) {
      return 2000;
    }
  }

  // Individual numbers 900-999:
  // - Years 00-39: 2000-2039
  // - Years 40-99: 1940-1999
  if (individualNumber >= 900 && individualNumber <= 999) {
    if (year >= 0 && year <= 39) {
      return 2000;
    } else if (year >= 40 && year <= 99) {
      return 1900;
    }
  }

  // Default fallback
  return 1900;
};

/**
 * Validate Norwegian fødselsnummer with full Modulo 11 checksum
 * Supports regular fødselsnummer, D-numbers, and H-numbers
 * @param {string} fodselsnummer - Norwegian personal ID (11 digits)
 * @returns {boolean} True if valid
 */
export const validateFodselsnummer = (fodselsnummer) => {
  const result = validateFodselsnummerDetailed(fodselsnummer);
  return result.valid;
};

/**
 * Detailed validation of Norwegian fødselsnummer
 * Returns comprehensive information about the ID number
 * @param {string} fodselsnummer - Norwegian personal ID (11 digits)
 * @returns {Object} Validation result with details
 */
export const validateFodselsnummerDetailed = (fodselsnummer) => {
  const result = {
    valid: false,
    type: null, // 'fodselsnummer', 'd-number', 'h-number'
    gender: null, // 'male', 'female'
    birthDate: null, // Date object
    age: null, // Calculated age
    error: null
  };

  if (!fodselsnummer) {
    result.error = 'Fødselsnummer is required';
    return result;
  }

  // Remove any spaces, dashes, or dots
  const cleaned = fodselsnummer.replace(/[\s\-\.]/g, '');

  // Must be exactly 11 digits
  if (!/^\d{11}$/.test(cleaned)) {
    result.error = 'Fødselsnummer must be exactly 11 digits';
    return result;
  }

  // Convert to array of integers
  const digits = cleaned.split('').map(d => parseInt(d, 10));

  // Extract components
  let day = parseInt(cleaned.substring(0, 2), 10);
  let month = parseInt(cleaned.substring(2, 4), 10);
  const year = parseInt(cleaned.substring(4, 6), 10);
  const individualNumber = parseInt(cleaned.substring(6, 9), 10);
  const controlDigit1 = digits[9];
  const controlDigit2 = digits[10];

  // Determine number type and adjust day/month
  let isDNumber = false;
  let isHNumber = false;

  // D-number: day is increased by 40 (day 01 becomes 41)
  if (day >= 41 && day <= 71) {
    isDNumber = true;
    day -= 40;
    result.type = 'd-number';
  }

  // H-number: month is increased by 40 (month 01 becomes 41)
  if (month >= 41 && month <= 52) {
    isHNumber = true;
    month -= 40;
    result.type = 'h-number';
  }

  // Cannot be both D-number and H-number
  if (isDNumber && isHNumber) {
    result.error = 'Invalid format: cannot be both D-number and H-number';
    return result;
  }

  // Set type if regular fødselsnummer
  if (!isDNumber && !isHNumber) {
    result.type = 'fodselsnummer';
  }

  // Validate day (1-31)
  if (day < 1 || day > 31) {
    result.error = `Invalid day: ${day}`;
    return result;
  }

  // Validate month (1-12)
  if (month < 1 || month > 12) {
    result.error = `Invalid month: ${month}`;
    return result;
  }

  // Calculate first control digit (K1)
  const firstNineDigits = digits.slice(0, 9);
  const calculatedK1 = calculateControlDigit(firstNineDigits, WEIGHTS_K1);

  if (calculatedK1 === null) {
    result.error = 'Invalid fødselsnummer: no valid control digit K1 exists';
    return result;
  }

  if (calculatedK1 !== controlDigit1) {
    result.error = `Invalid control digit K1: expected ${calculatedK1}, got ${controlDigit1}`;
    return result;
  }

  // Calculate second control digit (K2)
  const firstTenDigits = digits.slice(0, 10);
  const calculatedK2 = calculateControlDigit(firstTenDigits, WEIGHTS_K2);

  if (calculatedK2 === null) {
    result.error = 'Invalid fødselsnummer: no valid control digit K2 exists';
    return result;
  }

  if (calculatedK2 !== controlDigit2) {
    result.error = `Invalid control digit K2: expected ${calculatedK2}, got ${controlDigit2}`;
    return result;
  }

  // Determine gender from individual number (odd = male, even = female)
  result.gender = individualNumber % 2 === 1 ? 'male' : 'female';

  // Determine full birth year
  const century = determineCentury(year, individualNumber);
  const fullYear = century + year;

  // Create birth date
  const birthDate = new Date(fullYear, month - 1, day);

  // Validate the date is real (handles invalid dates like Feb 30)
  if (birthDate.getDate() !== day ||
      birthDate.getMonth() !== month - 1 ||
      birthDate.getFullYear() !== fullYear) {
    result.error = `Invalid date: ${day}.${month}.${fullYear}`;
    return result;
  }

  // Validate birth date is not in the future
  const today = new Date();
  if (birthDate > today) {
    result.error = 'Birth date cannot be in the future';
    return result;
  }

  result.birthDate = birthDate;

  // Calculate age
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  result.age = age;

  result.valid = true;
  return result;
};

/**
 * Extract birth date from fødselsnummer without full validation
 * Useful for quick lookups when validation has already been done
 * @param {string} fodselsnummer - Norwegian personal ID
 * @returns {Date|null} Birth date or null if format is invalid
 */
export const extractBirthDateFromFodselsnummer = (fodselsnummer) => {
  if (!fodselsnummer) return null;

  const cleaned = fodselsnummer.replace(/[\s\-\.]/g, '');
  if (!/^\d{11}$/.test(cleaned)) return null;

  let day = parseInt(cleaned.substring(0, 2), 10);
  let month = parseInt(cleaned.substring(2, 4), 10);
  const year = parseInt(cleaned.substring(4, 6), 10);
  const individualNumber = parseInt(cleaned.substring(6, 9), 10);

  // Adjust for D-number
  if (day >= 41 && day <= 71) {
    day -= 40;
  }

  // Adjust for H-number
  if (month >= 41 && month <= 52) {
    month -= 40;
  }

  const century = determineCentury(year, individualNumber);
  const fullYear = century + year;

  return new Date(fullYear, month - 1, day);
};

/**
 * Extract gender from fødselsnummer
 * @param {string} fodselsnummer - Norwegian personal ID
 * @returns {string|null} 'male', 'female', or null if invalid
 */
export const extractGenderFromFodselsnummer = (fodselsnummer) => {
  if (!fodselsnummer) return null;

  const cleaned = fodselsnummer.replace(/[\s\-\.]/g, '');
  if (!/^\d{11}$/.test(cleaned)) return null;

  const individualNumber = parseInt(cleaned.substring(6, 9), 10);
  return individualNumber % 2 === 1 ? 'male' : 'female';
};

/**
 * Check if fødselsnummer is a D-number (temporary resident)
 * @param {string} fodselsnummer - Norwegian personal ID
 * @returns {boolean} True if D-number
 */
export const isDNumber = (fodselsnummer) => {
  if (!fodselsnummer) return false;

  const cleaned = fodselsnummer.replace(/[\s\-\.]/g, '');
  if (!/^\d{11}$/.test(cleaned)) return false;

  const day = parseInt(cleaned.substring(0, 2), 10);
  return day >= 41 && day <= 71;
};

/**
 * Check if fødselsnummer is an H-number (healthcare use)
 * @param {string} fodselsnummer - Norwegian personal ID
 * @returns {boolean} True if H-number
 */
export const isHNumber = (fodselsnummer) => {
  if (!fodselsnummer) return false;

  const cleaned = fodselsnummer.replace(/[\s\-\.]/g, '');
  if (!/^\d{11}$/.test(cleaned)) return false;

  const month = parseInt(cleaned.substring(2, 4), 10);
  return month >= 41 && month <= 52;
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
  validateFodselsnummerDetailed,
  extractBirthDateFromFodselsnummer,
  extractGenderFromFodselsnummer,
  isDNumber,
  isHNumber,
  maskSensitive
};
