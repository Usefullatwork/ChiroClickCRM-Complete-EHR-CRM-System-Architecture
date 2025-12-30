/**
 * Norwegian Fødselsnummer Validation (Frontend)
 * Implements Mod11 algorithm for checksum validation
 *
 * SECURITY NOTE: This is client-side validation only.
 * Backend validation (backend/src/utils/norwegianIdValidation.js) is authoritative.
 */

/**
 * Validate Norwegian fødselsnummer using Mod11 algorithm
 * @param {string} fnr - 11-digit fødselsnummer
 * @returns {boolean} - True if valid
 */
export const validateFodselsnummer = (fnr) => {
  if (!fnr) return false;

  // Remove spaces and dashes
  const cleaned = fnr.replace(/[\s-]/g, '');

  // Must be exactly 11 digits
  if (!/^\d{11}$/.test(cleaned)) {
    return false;
  }

  // Extract date parts
  let day = parseInt(cleaned.substring(0, 2));
  const month = parseInt(cleaned.substring(2, 4));
  const year = parseInt(cleaned.substring(4, 6));

  // Check for D-number (day + 40)
  const isDNumber = day > 40;
  if (isDNumber) {
    day -= 40;
  }

  // Basic date validation
  if (day < 1 || day > 31 || month < 1 || month > 12) {
    return false;
  }

  // Validate first control digit (K1)
  const weights1 = [3, 7, 6, 1, 8, 9, 4, 5, 2];
  let sum1 = 0;
  for (let i = 0; i < 9; i++) {
    sum1 += parseInt(cleaned[i]) * weights1[i];
  }
  const k1 = sum1 % 11 === 0 ? 0 : 11 - (sum1 % 11);

  if (k1 === 10 || k1 !== parseInt(cleaned[9])) {
    return false;
  }

  // Validate second control digit (K2)
  const weights2 = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let sum2 = 0;
  for (let i = 0; i < 10; i++) {
    sum2 += parseInt(cleaned[i]) * weights2[i];
  }
  const k2 = sum2 % 11 === 0 ? 0 : 11 - (sum2 % 11);

  if (k2 === 10 || k2 !== parseInt(cleaned[10])) {
    return false;
  }

  return true;
};

/**
 * Check if fødselsnummer is a D-number (temporary ID for foreigners)
 * @param {string} fnr - Fødselsnummer
 * @returns {boolean}
 */
export const isDNumber = (fnr) => {
  if (!fnr) return false;
  const cleaned = fnr.replace(/[\s-]/g, '');
  if (cleaned.length !== 11) return false;

  const day = parseInt(cleaned.substring(0, 2));
  return day > 40;
};

/**
 * Extract birth date from fødselsnummer
 * @param {string} fnr - Fødselsnummer
 * @returns {Date|null} - Birth date or null if invalid
 */
export const extractBirthDate = (fnr) => {
  if (!validateFodselsnummer(fnr)) return null;

  const cleaned = fnr.replace(/[\s-]/g, '');

  let day = parseInt(cleaned.substring(0, 2));
  const month = parseInt(cleaned.substring(2, 4));
  let year = parseInt(cleaned.substring(4, 6));
  const individnummer = parseInt(cleaned.substring(6, 9));

  // Handle D-numbers
  if (day > 40) {
    day -= 40;
  }

  // Determine century from individnummer
  let century;
  if (individnummer >= 0 && individnummer <= 499) {
    century = 1900;
  } else if (individnummer >= 500 && individnummer <= 749) {
    century = year >= 54 ? 1800 : 1900;
  } else if (individnummer >= 750 && individnummer <= 899) {
    century = 2000;
  } else {
    century = year >= 40 ? 1900 : 2000;
  }

  const fullYear = century + year;

  try {
    const date = new Date(fullYear, month - 1, day);
    // Validate date is real
    if (date.getDate() !== day || date.getMonth() !== month - 1) {
      return null;
    }
    return date;
  } catch {
    return null;
  }
};

/**
 * Extract gender from fødselsnummer
 * @param {string} fnr - Fødselsnummer
 * @returns {string|null} - 'M' for male, 'F' for female, null if invalid
 */
export const extractGender = (fnr) => {
  if (!validateFodselsnummer(fnr)) return null;

  const cleaned = fnr.replace(/[\s-]/g, '');
  const genderDigit = parseInt(cleaned[8]); // Digit 9 (0-indexed position 8)

  return genderDigit % 2 === 0 ? 'F' : 'M';
};

/**
 * Calculate age from fødselsnummer
 * @param {string} fnr - Fødselsnummer
 * @returns {number|null} - Age in years, or null if invalid
 */
export const calculateAge = (fnr) => {
  const birthDate = extractBirthDate(fnr);
  if (!birthDate) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
};

/**
 * Format fødselsnummer for display (with dash)
 * @param {string} fnr - Fødselsnummer
 * @returns {string} - Formatted as DDMMYY-XXXXX
 */
export const formatFodselsnummer = (fnr) => {
  if (!fnr) return '';
  const cleaned = fnr.replace(/[\s-]/g, '');
  if (cleaned.length !== 11) return fnr;

  return `${cleaned.substring(0, 6)}-${cleaned.substring(6)}`;
};

/**
 * Mask fødselsnummer for display (privacy)
 * @param {string} fnr - Fødselsnummer
 * @param {number} visibleStart - Visible chars at start (default 2)
 * @param {number} visibleEnd - Visible chars at end (default 2)
 * @returns {string} - Masked fødselsnummer
 */
export const maskFodselsnummer = (fnr, visibleStart = 2, visibleEnd = 2) => {
  if (!fnr) return '***';
  const cleaned = fnr.replace(/[\s-]/g, '');
  if (cleaned.length !== 11) return '***';

  const start = cleaned.substring(0, visibleStart);
  const end = cleaned.substring(11 - visibleEnd);
  const masked = '*'.repeat(11 - visibleStart - visibleEnd);

  return `${start}${masked}${end}`;
};

/**
 * Validate and provide detailed error messages
 * @param {string} fnr - Fødselsnummer
 * @returns {object} - { valid: boolean, errors: string[], sanitized: string }
 */
export const validateAndSanitize = (fnr) => {
  const result = {
    valid: false,
    errors: [],
    sanitized: '',
    birthDate: null,
    age: null,
    gender: null,
    isDNumber: false
  };

  if (!fnr) {
    result.errors.push('Fødselsnummer is required');
    return result;
  }

  // Sanitize
  const cleaned = fnr.replace(/[\s-]/g, '');
  result.sanitized = cleaned;

  // Check length
  if (cleaned.length !== 11) {
    result.errors.push('Fødselsnummer must be 11 digits');
    return result;
  }

  // Check digits only
  if (!/^\d{11}$/.test(cleaned)) {
    result.errors.push('Fødselsnummer must contain only digits');
    return result;
  }

  // Validate checksum
  if (!validateFodselsnummer(cleaned)) {
    result.errors.push('Invalid fødselsnummer (checksum validation failed)');
    return result;
  }

  // Extract information
  result.valid = true;
  result.birthDate = extractBirthDate(cleaned);
  result.age = calculateAge(cleaned);
  result.gender = extractGender(cleaned);
  result.isDNumber = isDNumber(cleaned);

  return result;
};

export default {
  validateFodselsnummer,
  isDNumber,
  extractBirthDate,
  extractGender,
  calculateAge,
  formatFodselsnummer,
  maskFodselsnummer,
  validateAndSanitize
};
