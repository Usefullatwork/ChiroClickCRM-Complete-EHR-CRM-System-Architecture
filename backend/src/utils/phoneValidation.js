/**
 * Phone Number Validation Utility
 * Supports Norwegian (+47) as default and international country codes
 *
 * Validation Modes:
 * - 'strict': Full validation with country code rules (default)
 * - 'lenient': Accept any number with 7-15 digits
 * - 'format-only': Just clean and format, no validation
 */

// Default country code from environment or Norway
const DEFAULT_COUNTRY_CODE = process.env.DEFAULT_COUNTRY_CODE || '+47';

// Validation mode from environment
const PHONE_VALIDATION_MODE = process.env.PHONE_VALIDATION_MODE || 'strict';

/**
 * Country code configurations with validation rules
 * Format: { code, country, minLength, maxLength, mobilePrefix (optional) }
 */
export const COUNTRY_CODES = {
  // Nordic Countries
  '+47': {
    code: '+47',
    country: 'Norway',
    countryCode: 'NO',
    minLength: 8,
    maxLength: 8,
    mobilePrefix: ['4', '9'],
  },
  '+46': {
    code: '+46',
    country: 'Sweden',
    countryCode: 'SE',
    minLength: 9,
    maxLength: 9,
    mobilePrefix: ['7'],
  },
  '+45': { code: '+45', country: 'Denmark', countryCode: 'DK', minLength: 8, maxLength: 8 },
  '+358': {
    code: '+358',
    country: 'Finland',
    countryCode: 'FI',
    minLength: 9,
    maxLength: 10,
    mobilePrefix: ['4', '5'],
  },
  '+354': { code: '+354', country: 'Iceland', countryCode: 'IS', minLength: 7, maxLength: 7 },

  // European Countries
  '+44': {
    code: '+44',
    country: 'United Kingdom',
    countryCode: 'GB',
    minLength: 10,
    maxLength: 10,
    mobilePrefix: ['7'],
  },
  '+49': {
    code: '+49',
    country: 'Germany',
    countryCode: 'DE',
    minLength: 10,
    maxLength: 11,
    mobilePrefix: ['15', '16', '17'],
  },
  '+33': {
    code: '+33',
    country: 'France',
    countryCode: 'FR',
    minLength: 9,
    maxLength: 9,
    mobilePrefix: ['6', '7'],
  },
  '+34': {
    code: '+34',
    country: 'Spain',
    countryCode: 'ES',
    minLength: 9,
    maxLength: 9,
    mobilePrefix: ['6', '7'],
  },
  '+39': {
    code: '+39',
    country: 'Italy',
    countryCode: 'IT',
    minLength: 9,
    maxLength: 10,
    mobilePrefix: ['3'],
  },
  '+31': {
    code: '+31',
    country: 'Netherlands',
    countryCode: 'NL',
    minLength: 9,
    maxLength: 9,
    mobilePrefix: ['6'],
  },
  '+32': {
    code: '+32',
    country: 'Belgium',
    countryCode: 'BE',
    minLength: 9,
    maxLength: 9,
    mobilePrefix: ['4'],
  },
  '+41': {
    code: '+41',
    country: 'Switzerland',
    countryCode: 'CH',
    minLength: 9,
    maxLength: 9,
    mobilePrefix: ['7'],
  },
  '+43': {
    code: '+43',
    country: 'Austria',
    countryCode: 'AT',
    minLength: 10,
    maxLength: 13,
    mobilePrefix: ['6'],
  },
  '+48': {
    code: '+48',
    country: 'Poland',
    countryCode: 'PL',
    minLength: 9,
    maxLength: 9,
    mobilePrefix: ['5', '6', '7', '8'],
  },
  '+351': {
    code: '+351',
    country: 'Portugal',
    countryCode: 'PT',
    minLength: 9,
    maxLength: 9,
    mobilePrefix: ['9'],
  },
  '+353': {
    code: '+353',
    country: 'Ireland',
    countryCode: 'IE',
    minLength: 9,
    maxLength: 9,
    mobilePrefix: ['8'],
  },
  '+30': {
    code: '+30',
    country: 'Greece',
    countryCode: 'GR',
    minLength: 10,
    maxLength: 10,
    mobilePrefix: ['6'],
  },
  '+420': {
    code: '+420',
    country: 'Czech Republic',
    countryCode: 'CZ',
    minLength: 9,
    maxLength: 9,
    mobilePrefix: ['6', '7'],
  },
  '+36': {
    code: '+36',
    country: 'Hungary',
    countryCode: 'HU',
    minLength: 9,
    maxLength: 9,
    mobilePrefix: ['2', '3', '7'],
  },
  '+40': {
    code: '+40',
    country: 'Romania',
    countryCode: 'RO',
    minLength: 9,
    maxLength: 9,
    mobilePrefix: ['7'],
  },

  // North America
  '+1': { code: '+1', country: 'USA/Canada', countryCode: 'US', minLength: 10, maxLength: 10 },

  // Other Common
  '+61': {
    code: '+61',
    country: 'Australia',
    countryCode: 'AU',
    minLength: 9,
    maxLength: 9,
    mobilePrefix: ['4'],
  },
  '+64': {
    code: '+64',
    country: 'New Zealand',
    countryCode: 'NZ',
    minLength: 9,
    maxLength: 10,
    mobilePrefix: ['2'],
  },
  '+81': {
    code: '+81',
    country: 'Japan',
    countryCode: 'JP',
    minLength: 10,
    maxLength: 10,
    mobilePrefix: ['7', '8', '9'],
  },
  '+86': {
    code: '+86',
    country: 'China',
    countryCode: 'CN',
    minLength: 11,
    maxLength: 11,
    mobilePrefix: ['1'],
  },
  '+91': { code: '+91', country: 'India', countryCode: 'IN', minLength: 10, maxLength: 10 },
  '+82': {
    code: '+82',
    country: 'South Korea',
    countryCode: 'KR',
    minLength: 9,
    maxLength: 10,
    mobilePrefix: ['1'],
  },
  '+65': { code: '+65', country: 'Singapore', countryCode: 'SG', minLength: 8, maxLength: 8 },
  '+971': {
    code: '+971',
    country: 'UAE',
    countryCode: 'AE',
    minLength: 9,
    maxLength: 9,
    mobilePrefix: ['5'],
  },
  '+972': {
    code: '+972',
    country: 'Israel',
    countryCode: 'IL',
    minLength: 9,
    maxLength: 9,
    mobilePrefix: ['5'],
  },
  '+27': {
    code: '+27',
    country: 'South Africa',
    countryCode: 'ZA',
    minLength: 9,
    maxLength: 9,
    mobilePrefix: ['6', '7', '8'],
  },
  '+55': {
    code: '+55',
    country: 'Brazil',
    countryCode: 'BR',
    minLength: 10,
    maxLength: 11,
    mobilePrefix: ['9'],
  },
  '+52': { code: '+52', country: 'Mexico', countryCode: 'MX', minLength: 10, maxLength: 10 },
};

/**
 * Clean phone number - remove spaces, dashes, parentheses
 * @param {string} phone - Raw phone number
 * @returns {string} Cleaned phone number
 */
export const cleanPhoneNumber = (phone) => {
  if (!phone) {
    return '';
  }
  return phone.replace(/[\s().-]/g, '');
};

/**
 * Extract country code from phone number
 * @param {string} phone - Phone number (may include country code)
 * @returns {{ countryCode: string, nationalNumber: string, config: object } | null}
 */
export const extractCountryCode = (phone) => {
  const cleaned = cleanPhoneNumber(phone);

  if (!cleaned.startsWith('+')) {
    // No country code, assume default
    return {
      countryCode: DEFAULT_COUNTRY_CODE,
      nationalNumber: cleaned.replace(/^0/, ''), // Remove leading 0 if present
      config: COUNTRY_CODES[DEFAULT_COUNTRY_CODE],
    };
  }

  // Try to match country codes (longest first for codes like +358 vs +35)
  const sortedCodes = Object.keys(COUNTRY_CODES).sort((a, b) => b.length - a.length);

  for (const code of sortedCodes) {
    if (cleaned.startsWith(code)) {
      return {
        countryCode: code,
        nationalNumber: cleaned.substring(code.length).replace(/^0/, ''),
        config: COUNTRY_CODES[code],
      };
    }
  }

  // Unknown country code
  return null;
};

/**
 * Validate Norwegian phone number (8 digits)
 * @param {string} phone - Phone number
 * @returns {{ valid: boolean, error?: string, formatted?: string }}
 */
export const validateNorwegianPhone = (phone) => {
  const cleaned = cleanPhoneNumber(phone);

  // Remove +47 or 0047 prefix if present
  const nationalNumber = cleaned.replace(/^\+47/, '').replace(/^0047/, '').replace(/^0/, ''); // Remove leading 0

  // Must be exactly 8 digits
  if (!/^\d{8}$/.test(nationalNumber)) {
    return {
      valid: false,
      error: 'Norwegian phone numbers must be exactly 8 digits',
    };
  }

  // Check if it's a valid mobile or landline prefix
  const firstDigit = nationalNumber[0];
  const isMobile = ['4', '9'].includes(firstDigit); // Mobile numbers start with 4 or 9
  const isLandline = ['2', '3', '5', '6', '7'].includes(firstDigit); // Landlines

  if (!isMobile && !isLandline) {
    return {
      valid: false,
      error: 'Invalid Norwegian phone number prefix',
    };
  }

  return {
    valid: true,
    formatted: `+47 ${nationalNumber.substring(0, 3)} ${nationalNumber.substring(3, 5)} ${nationalNumber.substring(5)}`,
    nationalNumber,
    fullNumber: `+47${nationalNumber}`,
    type: isMobile ? 'mobile' : 'landline',
  };
};

/**
 * Validate phone number with any supported country code
 * @param {string} phone - Phone number (with or without country code)
 * @param {string} defaultCountryCode - Default country code to use if none provided
 * @returns {{ valid: boolean, error?: string, formatted?: string, country?: string }}
 */
export const validatePhoneNumber = (phone, defaultCountryCode = DEFAULT_COUNTRY_CODE) => {
  if (!phone) {
    return { valid: false, error: 'Phone number is required' };
  }

  const cleaned = cleanPhoneNumber(phone);

  // Try to extract country code
  let extracted;
  if (cleaned.startsWith('+')) {
    extracted = extractCountryCode(cleaned);
  } else {
    // No country code prefix - use the provided default
    const nationalNumber = cleaned.replace(/^0/, '');
    extracted = {
      countryCode: defaultCountryCode,
      nationalNumber,
      config: COUNTRY_CODES[defaultCountryCode],
    };
  }

  if (!extracted || !extracted.config) {
    return {
      valid: false,
      error: 'Unknown or unsupported country code',
    };
  }

  const { countryCode, nationalNumber, config } = extracted;

  // Validate length
  if (nationalNumber.length < config.minLength) {
    return {
      valid: false,
      error: `${config.country} phone numbers must be at least ${config.minLength} digits`,
    };
  }

  if (nationalNumber.length > config.maxLength) {
    return {
      valid: false,
      error: `${config.country} phone numbers must be at most ${config.maxLength} digits`,
    };
  }

  // Check if only digits
  if (!/^\d+$/.test(nationalNumber)) {
    return {
      valid: false,
      error: 'Phone number must contain only digits',
    };
  }

  // Format the number
  const fullNumber = `${countryCode}${nationalNumber}`;
  let formatted;

  // Special formatting for Norwegian numbers
  if (countryCode === '+47' && nationalNumber.length === 8) {
    formatted = `+47 ${nationalNumber.substring(0, 3)} ${nationalNumber.substring(3, 5)} ${nationalNumber.substring(5)}`;
  } else {
    // Generic formatting: country code + space + number
    formatted = `${countryCode} ${nationalNumber}`;
  }

  return {
    valid: true,
    formatted,
    fullNumber,
    nationalNumber,
    countryCode,
    country: config.country,
    countryCodeISO: config.countryCode,
  };
};

/**
 * Format phone number for display
 * @param {string} phone - Phone number
 * @param {string} format - Format type ('international', 'national', 'e164')
 * @returns {string} Formatted phone number
 */
export const formatPhoneNumber = (phone, format = 'international') => {
  const result = validatePhoneNumber(phone);

  if (!result.valid) {
    return phone; // Return original if invalid
  }

  switch (format) {
    case 'e164':
      return result.fullNumber; // +4712345678
    case 'national':
      return result.nationalNumber; // 12345678
    case 'international':
    default:
      return result.formatted; // +47 123 45 678
  }
};

/**
 * Get list of all supported country codes for dropdown/selection
 * @returns {Array<{ code: string, country: string, countryCode: string }>}
 */
export const getSupportedCountryCodes = () =>
  Object.values(COUNTRY_CODES)
    .map(({ code, country, countryCode }) => ({ code, country, countryCode }))
    .sort((a, b) => (a.country < b.country ? -1 : a.country > b.country ? 1 : 0));

/**
 * Get country code config by ISO country code
 * @param {string} isoCode - ISO country code (e.g., 'NO', 'SE', 'US')
 * @returns {object|null} Country code configuration
 */
export const getCountryByISO = (isoCode) => {
  const upperCode = (isoCode || '').toUpperCase();
  return Object.values(COUNTRY_CODES).find((c) => c.countryCode === upperCode) || null;
};

/**
 * Check if phone number is mobile (where detectable)
 * @param {string} phone - Phone number
 * @returns {boolean|null} true if mobile, false if landline, null if unknown
 */
export const isMobileNumber = (phone) => {
  const result = validatePhoneNumber(phone);

  if (!result.valid) {
    return null;
  }

  const config = COUNTRY_CODES[result.countryCode];
  if (!config || !config.mobilePrefix) {
    return null;
  }

  const firstDigits = result.nationalNumber.substring(0, 2);
  return config.mobilePrefix.some((prefix) => firstDigits.startsWith(prefix));
};

/**
 * Lenient phone validation - accepts any number with 7-15 digits
 * Use when strict validation is too restrictive
 * @param {string} phone - Phone number
 * @param {string} defaultCountryCode - Default country code
 * @returns {{ valid: boolean, error?: string, formatted?: string }}
 */
export const validatePhoneLenient = (phone, defaultCountryCode = DEFAULT_COUNTRY_CODE) => {
  if (!phone) {
    return { valid: false, error: 'Phone number is required' };
  }

  const cleaned = cleanPhoneNumber(phone);

  // Extract just digits
  const digitsOnly = cleaned.replace(/\D/g, '');

  // Must have between 7 and 15 digits (ITU-T E.164 standard)
  if (digitsOnly.length < 7) {
    return {
      valid: false,
      error: 'Phone number must have at least 7 digits',
    };
  }

  if (digitsOnly.length > 15) {
    return {
      valid: false,
      error: 'Phone number must have at most 15 digits',
    };
  }

  // Format with country code if not present
  let fullNumber;
  if (cleaned.startsWith('+')) {
    fullNumber = cleaned;
  } else {
    fullNumber = `${defaultCountryCode}${digitsOnly}`;
  }

  return {
    valid: true,
    formatted: fullNumber,
    fullNumber,
    digitsOnly,
    mode: 'lenient',
  };
};

/**
 * Validate phone with configurable mode
 * @param {string} phone - Phone number
 * @param {object} options - Validation options
 * @param {string} options.mode - 'strict', 'lenient', or 'format-only'
 * @param {string} options.defaultCountryCode - Default country code
 * @returns {{ valid: boolean, error?: string, formatted?: string }}
 */
export const validatePhoneWithOptions = (phone, options = {}) => {
  const { mode = PHONE_VALIDATION_MODE, defaultCountryCode = DEFAULT_COUNTRY_CODE } = options;

  switch (mode) {
    case 'format-only': {
      // Just clean and format, always valid if non-empty
      if (!phone) {
        return { valid: false, error: 'Phone number is required' };
      }
      const cleaned = cleanPhoneNumber(phone);
      return {
        valid: true,
        formatted: cleaned.startsWith('+') ? cleaned : `${defaultCountryCode}${cleaned}`,
        fullNumber: cleaned.startsWith('+') ? cleaned : `${defaultCountryCode}${cleaned}`,
        mode: 'format-only',
      };
    }

    case 'lenient':
      return validatePhoneLenient(phone, defaultCountryCode);

    case 'strict':
    default:
      return validatePhoneNumber(phone, defaultCountryCode);
  }
};

/**
 * Normalize phone number for database search
 * Removes all non-digit characters for consistent searching
 * @param {string} phone - Phone number
 * @returns {string} Normalized phone number (digits only)
 */
export const normalizePhoneForSearch = (phone) => {
  if (!phone) {
    return '';
  }
  return phone.replace(/\D/g, '');
};

/**
 * Create searchable phone variants for database indexing
 * Returns multiple formats to enable flexible searching
 * @param {string} phone - Phone number
 * @returns {{ e164: string, national: string, digits: string, formatted: string }}
 */
export const createSearchablePhoneVariants = (phone) => {
  const result = validatePhoneWithOptions(phone, { mode: 'lenient' });

  if (!result.valid) {
    const cleaned = cleanPhoneNumber(phone || '');
    return {
      e164: '',
      national: cleaned,
      digits: cleaned.replace(/\D/g, ''),
      formatted: phone || '',
    };
  }

  const digits = result.fullNumber.replace(/\D/g, '');
  const nationalDigits = digits.replace(/^47/, ''); // Remove Norwegian prefix

  return {
    e164: result.fullNumber,
    national: nationalDigits,
    digits: digits,
    formatted: result.formatted,
  };
};

/**
 * Search for phone number in a list
 * Matches partial numbers and different formats
 * @param {string} searchQuery - Phone number to search for
 * @param {string[]} phoneNumbers - List of phone numbers to search in
 * @returns {string[]} Matching phone numbers
 */
export const searchPhoneNumbers = (searchQuery, phoneNumbers) => {
  if (!searchQuery || !phoneNumbers?.length) {
    return [];
  }

  const queryDigits = normalizePhoneForSearch(searchQuery);

  if (queryDigits.length < 3) {
    return [];
  } // Require at least 3 digits

  return phoneNumbers.filter((phone) => {
    const phoneDigits = normalizePhoneForSearch(phone);
    // Match if query digits appear anywhere in the phone number
    return phoneDigits.includes(queryDigits) || queryDigits.includes(phoneDigits);
  });
};

export default {
  COUNTRY_CODES,
  DEFAULT_COUNTRY_CODE,
  PHONE_VALIDATION_MODE,
  cleanPhoneNumber,
  extractCountryCode,
  validateNorwegianPhone,
  validatePhoneNumber,
  validatePhoneLenient,
  validatePhoneWithOptions,
  formatPhoneNumber,
  getSupportedCountryCodes,
  getCountryByISO,
  isMobileNumber,
  normalizePhoneForSearch,
  createSearchablePhoneVariants,
  searchPhoneNumbers,
};
