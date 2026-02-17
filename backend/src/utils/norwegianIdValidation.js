/**
 * Norwegian Personnummer (Fødselsnummer) Validation
 *
 * Norwegian national ID numbers follow a specific format:
 * DDMMYY-XXXXX (11 digits total)
 *
 * - DD: Day (01-31)
 * - MM: Month (01-12)
 * - YY: Year (last 2 digits)
 * - XXXXX: Individual number (5 digits)
 *   - First 3 digits (individnummer) indicate century and gender
 *   - Last 2 digits are control digits (Mod11 checksum)
 *
 * CRITICAL: This validation is legally required for Norwegian healthcare systems
 */

/**
 * Validate Norwegian fødselsnummer using Mod11 algorithm
 * @param {string} fnr - 11-digit fødselsnummer
 * @returns {boolean} - True if valid
 */
export const validateFodselsnummer = (fnr) => {
  if (!fnr || typeof fnr !== 'string') {
    return false;
  }

  // Remove any spaces or dashes
  fnr = fnr.replace(/[\s-]/g, '');

  // Must be exactly 11 digits
  if (!/^\d{11}$/.test(fnr)) {
    return false;
  }

  // Extract date components
  const day = parseInt(fnr.substring(0, 2));
  const month = parseInt(fnr.substring(2, 4));
  const year = parseInt(fnr.substring(4, 6));
  const individnummer = parseInt(fnr.substring(6, 9));

  // Validate day (1-31, some special numbers 40-71 for D-number)
  if ((day < 1 || day > 31) && (day < 41 || day > 71)) {
    return false;
  }

  // Validate month (1-12)
  if (month < 1 || month > 12) {
    return false;
  }

  // Determine century from individnummer (used for range validation)
  let _century;
  if (individnummer >= 0 && individnummer <= 499) {
    _century = 1900;
  } else if (individnummer >= 500 && individnummer <= 749 && year >= 54) {
    _century = 1800;
  } else if (individnummer >= 500 && individnummer <= 999 && year <= 39) {
    _century = 2000;
  } else if (individnummer >= 900 && individnummer <= 999 && year >= 40) {
    _century = 1900;
  } else {
    return false;
  }

  // Validate date (basic check - doesn't check for Feb 30 etc, but good enough)
  const actualDay = day > 40 ? day - 40 : day; // D-number adjustment
  if (actualDay > 31 || actualDay < 1) {
    return false;
  }

  // First control digit (K1) - Mod11 algorithm
  const weights1 = [3, 7, 6, 1, 8, 9, 4, 5, 2];
  let sum1 = 0;
  for (let i = 0; i < 9; i++) {
    sum1 += parseInt(fnr[i]) * weights1[i];
  }

  const remainder1 = sum1 % 11;
  const k1 = remainder1 === 0 ? 0 : 11 - remainder1;

  // K1 cannot be 10 (invalid number)
  if (k1 === 10) {
    return false;
  }

  if (k1 !== parseInt(fnr[9])) {
    return false;
  }

  // Second control digit (K2) - Mod11 algorithm
  const weights2 = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let sum2 = 0;
  for (let i = 0; i < 10; i++) {
    sum2 += parseInt(fnr[i]) * weights2[i];
  }

  const remainder2 = sum2 % 11;
  const k2 = remainder2 === 0 ? 0 : 11 - remainder2;

  // K2 cannot be 10 (invalid number)
  if (k2 === 10) {
    return false;
  }

  if (k2 !== parseInt(fnr[10])) {
    return false;
  }

  return true;
};

/**
 * Extract birth date from fødselsnummer
 * @param {string} fnr - 11-digit fødselsnummer
 * @returns {Date|null} - Birth date or null if invalid
 */
export const extractBirthDate = (fnr) => {
  if (!validateFodselsnummer(fnr)) {
    return null;
  }

  fnr = fnr.replace(/[\s-]/g, '');

  const day = parseInt(fnr.substring(0, 2));
  const month = parseInt(fnr.substring(2, 4)) - 1; // JavaScript months are 0-indexed
  const year = parseInt(fnr.substring(4, 6));
  const individnummer = parseInt(fnr.substring(6, 9));

  // Adjust for D-number (day + 40)
  const actualDay = day > 40 ? day - 40 : day;

  // Determine century
  let century;
  if (individnummer >= 0 && individnummer <= 499) {
    century = 1900;
  } else if (individnummer >= 500 && individnummer <= 749 && year >= 54) {
    century = 1800;
  } else if (individnummer >= 500 && individnummer <= 999 && year <= 39) {
    century = 2000;
  } else if (individnummer >= 900 && individnummer <= 999 && year >= 40) {
    century = 1900;
  }

  const fullYear = century + year;

  return new Date(fullYear, month, actualDay);
};

/**
 * Extract gender from fødselsnummer
 * @param {string} fnr - 11-digit fødselsnummer
 * @returns {string|null} - 'M' for male, 'F' for female, null if invalid
 */
export const extractGender = (fnr) => {
  if (!validateFodselsnummer(fnr)) {
    return null;
  }

  fnr = fnr.replace(/[\s-]/g, '');

  // 9th digit (index 8) determines gender
  // Even = female, Odd = male
  const genderDigit = parseInt(fnr[8]);

  return genderDigit % 2 === 0 ? 'F' : 'M';
};

/**
 * Check if fødselsnummer is a D-number (temporary number for foreign nationals)
 * @param {string} fnr - 11-digit fødselsnummer
 * @returns {boolean} - True if D-number
 */
export const isDNumber = (fnr) => {
  if (!validateFodselsnummer(fnr)) {
    return false;
  }

  fnr = fnr.replace(/[\s-]/g, '');
  const day = parseInt(fnr.substring(0, 2));

  // D-numbers have day + 40
  return day > 40 && day <= 71;
};

/**
 * Format fødselsnummer for display (with dash)
 * @param {string} fnr - 11-digit fødselsnummer
 * @returns {string} - Formatted as DDMMYY-XXXXX
 */
export const formatFodselsnummer = (fnr) => {
  fnr = fnr.replace(/[\s-]/g, '');

  if (fnr.length !== 11) {
    return fnr;
  }

  return `${fnr.substring(0, 6)}-${fnr.substring(6)}`;
};

/**
 * Calculate age from fødselsnummer
 * @param {string} fnr - 11-digit fødselsnummer
 * @returns {number|null} - Age in years, null if invalid
 */
export const calculateAge = (fnr) => {
  const birthDate = extractBirthDate(fnr);

  if (!birthDate) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  // Adjust if birthday hasn't occurred this year
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
};

/**
 * Validate and sanitize fødselsnummer for storage
 * @param {string} fnr - Fødselsnummer to validate
 * @returns {Object} - { valid, sanitized, birthDate, age, gender, isDNumber, errors }
 */
export const validateAndSanitize = (fnr) => {
  const errors = [];

  if (!fnr || typeof fnr !== 'string') {
    return {
      valid: false,
      sanitized: null,
      birthDate: null,
      age: null,
      gender: null,
      isDNumber: false,
      errors: ['Fødselsnummer is required'],
    };
  }

  // Remove whitespace and dashes
  const sanitized = fnr.replace(/[\s-]/g, '');

  // Validate format
  if (!/^\d{11}$/.test(sanitized)) {
    errors.push('Fødselsnummer must be 11 digits');
    return {
      valid: false,
      sanitized,
      birthDate: null,
      age: null,
      gender: null,
      isDNumber: false,
      errors,
    };
  }

  // Validate checksum
  if (!validateFodselsnummer(sanitized)) {
    errors.push('Invalid fødselsnummer (checksum validation failed)');
    return {
      valid: false,
      sanitized,
      birthDate: null,
      age: null,
      gender: null,
      isDNumber: false,
      errors,
    };
  }

  const birthDate = extractBirthDate(sanitized);
  const age = calculateAge(sanitized);
  const gender = extractGender(sanitized);
  const dNumber = isDNumber(sanitized);

  // Check if person is too young (< 0 years old means future date)
  if (age !== null && age < 0) {
    errors.push('Invalid birth date (future date)');
  }

  // Check if person is too old (> 130 years is likely an error)
  if (age !== null && age > 130) {
    errors.push('Invalid birth date (too old)');
  }

  // Validate actual date (reject Feb 30, etc.)
  if (birthDate) {
    const day = parseInt(sanitized.substring(0, 2));
    const month = parseInt(sanitized.substring(2, 4));
    const actualDay = day > 40 ? day - 40 : day;
    if (birthDate.getDate() !== actualDay || birthDate.getMonth() !== month - 1) {
      errors.push('Invalid date (day does not exist in month)');
    }
  }

  return {
    valid: errors.length === 0,
    sanitized,
    birthDate,
    age,
    gender,
    isDNumber: dNumber,
    errors,
  };
};

export default {
  validateFodselsnummer,
  extractBirthDate,
  extractGender,
  isDNumber,
  formatFodselsnummer,
  calculateAge,
  validateAndSanitize,
};
