/**
 * CSV Import Service
 * Parse and import CSV files with flexible column mapping
 */

import logger from '../utils/logger.js';

/**
 * Standard field mappings - common column headers to patient fields
 */
export const STANDARD_MAPPINGS = {
  // First name variations
  first_name: 'first_name',
  firstname: 'first_name',
  'first name': 'first_name',
  fornavn: 'first_name',
  'given name': 'first_name',
  givenname: 'first_name',

  // Last name variations
  last_name: 'last_name',
  lastname: 'last_name',
  'last name': 'last_name',
  etternavn: 'last_name',
  'family name': 'last_name',
  familyname: 'last_name',
  surname: 'last_name',

  // Email variations
  email: 'email',
  'e-mail': 'email',
  epost: 'email',
  'e-post': 'email',
  'email address': 'email',

  // Phone variations
  phone: 'phone',
  telefon: 'phone',
  mobile: 'phone',
  mobil: 'phone',
  cell: 'phone',
  mobiltelefon: 'phone',
  'phone number': 'phone',
  phonenumber: 'phone',

  // Home phone
  home_phone: 'home_phone',
  'home phone': 'home_phone',
  hjemmetelefon: 'home_phone',

  // Work phone
  work_phone: 'work_phone',
  'work phone': 'work_phone',
  arbeidstelefon: 'work_phone',
  'jobb telefon': 'work_phone',

  // Address
  address: 'address_street',
  street: 'address_street',
  'street address': 'address_street',
  adresse: 'address_street',
  gateadresse: 'address_street',

  // City
  city: 'address_city',
  by: 'address_city',
  sted: 'address_city',
  poststed: 'address_city',

  // Postal code
  postal_code: 'address_postal_code',
  postalcode: 'address_postal_code',
  zip: 'address_postal_code',
  zipcode: 'address_postal_code',
  postnummer: 'address_postal_code',
  'post code': 'address_postal_code',

  // Country
  country: 'country',
  land: 'country',

  // Date of birth
  date_of_birth: 'date_of_birth',
  dateofbirth: 'date_of_birth',
  dob: 'date_of_birth',
  birthday: 'date_of_birth',
  birthdate: 'date_of_birth',
  'birth date': 'date_of_birth',
  fødselsdato: 'date_of_birth',
  fodselsdato: 'date_of_birth',

  // Gender
  gender: 'gender',
  sex: 'gender',
  kjønn: 'gender',
  kjonn: 'gender',

  // National ID (Norwegian fødselsnummer)
  national_id: 'personal_number',
  nationalid: 'personal_number',
  personal_number: 'personal_number',
  personnummer: 'personal_number',
  fødselsnummer: 'personal_number',
  fodselsnummer: 'personal_number',
  fnr: 'personal_number',
  ssn: 'personal_number',

  // Notes
  notes: 'notes',
  notat: 'notes',
  notater: 'notes',
  comments: 'notes',
  kommentar: 'notes',

  // External IDs
  solvit_id: 'solvit_id',
  solvitid: 'solvit_id',
  external_id: 'solvit_id',
  externalid: 'solvit_id',

  // Category
  category: 'category',
  kategori: 'category',

  // Status
  status: 'status',

  // Referral
  referral_source: 'referral_source',
  referred_by: 'referral_source',
  henvist_av: 'referral_source',

  // Emergency contact
  emergency_contact: 'emergency_contact_name',
  emergency_name: 'emergency_contact_name',
  nøkontakt: 'emergency_contact_name',
  pårørende: 'emergency_contact_name',
  emergency_phone: 'emergency_contact_phone',
  nøkontakt_telefon: 'emergency_contact_phone',
};

/**
 * Patient field definitions with metadata
 */
export const PATIENT_FIELDS = [
  { field: 'first_name', label: 'First Name', labelNo: 'Fornavn', required: true },
  { field: 'last_name', label: 'Last Name', labelNo: 'Etternavn', required: true },
  { field: 'email', label: 'Email', labelNo: 'E-post', required: false },
  { field: 'phone', label: 'Mobile Phone', labelNo: 'Mobil', required: false },
  { field: 'home_phone', label: 'Home Phone', labelNo: 'Hjemmetelefon', required: false },
  { field: 'work_phone', label: 'Work Phone', labelNo: 'Arbeidstelefon', required: false },
  { field: 'address_street', label: 'Street Address', labelNo: 'Gateadresse', required: false },
  { field: 'address_city', label: 'City', labelNo: 'Poststed', required: false },
  { field: 'address_postal_code', label: 'Postal Code', labelNo: 'Postnummer', required: false },
  { field: 'country', label: 'Country', labelNo: 'Land', required: false },
  { field: 'date_of_birth', label: 'Date of Birth', labelNo: 'Fødselsdato', required: false },
  { field: 'gender', label: 'Gender', labelNo: 'Kjønn', required: false },
  { field: 'personal_number', label: 'National ID', labelNo: 'Fødselsnummer', required: false },
  { field: 'notes', label: 'Notes', labelNo: 'Notater', required: false },
  { field: 'solvit_id', label: 'External ID', labelNo: 'Ekstern ID', required: false },
  { field: 'category', label: 'Category', labelNo: 'Kategori', required: false },
  { field: 'status', label: 'Status', labelNo: 'Status', required: false },
  { field: 'referral_source', label: 'Referral Source', labelNo: 'Henvist av', required: false },
  {
    field: 'emergency_contact_name',
    label: 'Emergency Contact',
    labelNo: 'Pårørende',
    required: false,
  },
  {
    field: 'emergency_contact_phone',
    label: 'Emergency Phone',
    labelNo: 'Pårørende telefon',
    required: false,
  },
];

/**
 * Detect delimiter in CSV content
 */
const detectDelimiter = (content) => {
  const firstLine = content.split('\n')[0];
  const delimiters = [',', ';', '\t', '|'];
  let maxCount = 0;
  let detected = ',';

  for (const delimiter of delimiters) {
    const count = (firstLine.match(new RegExp(`\\${delimiter}`, 'g')) || []).length;
    if (count > maxCount) {
      maxCount = count;
      detected = delimiter;
    }
  }

  return detected;
};

/**
 * Parse a CSV line respecting quoted fields
 */
const parseCSVLine = (line, delimiter) => {
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  fields.push(current.trim());
  return fields;
};

/**
 * Parse CSV content into rows
 * @param {string} content - CSV file content
 * @param {Object} options - Parse options
 * @returns {Object} Parsed data with headers and rows
 */
export const parseCSV = (content, options = {}) => {
  const {
    delimiter = null, // Auto-detect if null
    hasHeader = true,
    _encoding = 'utf-8',
  } = options;

  // Normalize line endings
  const normalizedContent = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Detect delimiter if not specified
  const actualDelimiter = delimiter || detectDelimiter(normalizedContent);

  // Split into lines and filter empty ones
  const lines = normalizedContent.split('\n').filter((line) => line.trim());

  if (lines.length === 0) {
    return { headers: [], rows: [], delimiter: actualDelimiter };
  }

  // Parse header row
  const headers = hasHeader
    ? parseCSVLine(lines[0], actualDelimiter)
    : lines[0].split(actualDelimiter).map((_, i) => `Column ${i + 1}`);

  // Parse data rows
  const startIndex = hasHeader ? 1 : 0;
  const rows = [];

  for (let i = startIndex; i < lines.length; i++) {
    const values = parseCSVLine(lines[i], actualDelimiter);

    // Skip completely empty rows
    if (values.every((v) => !v)) {
      continue;
    }

    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    rows.push(row);
  }

  return {
    headers,
    rows,
    delimiter: actualDelimiter,
    rowCount: rows.length,
  };
};

/**
 * Auto-detect column mappings based on header names
 * @param {Array} headers - CSV column headers
 * @returns {Object} Mapping of CSV columns to patient fields
 */
export const autoDetectMappings = (headers) => {
  const mappings = {};

  for (const header of headers) {
    const normalized = header.toLowerCase().trim();

    // Check direct match
    if (STANDARD_MAPPINGS[normalized]) {
      mappings[header] = STANDARD_MAPPINGS[normalized];
      continue;
    }

    // Check partial match
    for (const [key, value] of Object.entries(STANDARD_MAPPINGS)) {
      if (normalized.includes(key) || key.includes(normalized)) {
        mappings[header] = value;
        break;
      }
    }
  }

  return mappings;
};

/**
 * Apply column mappings to convert CSV rows to patient objects
 * @param {Array} rows - CSV rows
 * @param {Object} mappings - Column to field mappings
 * @returns {Array} Array of patient objects
 */
export const applyMappings = (rows, mappings) =>
  rows.map((row, index) => {
    const patient = { _sourceRowIndex: index + 1 };

    for (const [csvColumn, patientField] of Object.entries(mappings)) {
      if (patientField && row[csvColumn] !== undefined) {
        let value = row[csvColumn];

        // Apply field-specific transformations
        value = transformFieldValue(patientField, value);

        patient[patientField] = value;
      }
    }

    return patient;
  });

/**
 * Transform field values based on field type
 */
const transformFieldValue = (field, value) => {
  if (!value) {
    return value;
  }

  switch (field) {
    case 'date_of_birth':
      return parseDateValue(value);

    case 'gender':
      return parseGenderValue(value);

    case 'phone':
    case 'home_phone':
    case 'work_phone':
    case 'emergency_contact_phone':
      return normalizePhone(value);

    case 'email':
      return value.toLowerCase().trim();

    case 'address_postal_code':
      return value.replace(/\D/g, ''); // Remove non-digits

    case 'status':
      return parseStatusValue(value);

    case 'category':
      return parseCategoryValue(value);

    default:
      return value.trim();
  }
};

/**
 * Parse various date formats to ISO format
 */
const parseDateValue = (value) => {
  if (!value) {
    return null;
  }

  // Try common formats
  const _formats = [
    // ISO format
    /^(\d{4})-(\d{2})-(\d{2})$/,
    // Norwegian format DD.MM.YYYY
    /^(\d{2})\.(\d{2})\.(\d{4})$/,
    // US format MM/DD/YYYY
    /^(\d{2})\/(\d{2})\/(\d{4})$/,
    // European format DD/MM/YYYY
    /^(\d{2})\/(\d{2})\/(\d{4})$/,
  ];

  // ISO format YYYY-MM-DD
  let match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    return value;
  }

  // Norwegian format DD.MM.YYYY
  match = value.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (match) {
    return `${match[3]}-${match[2]}-${match[1]}`;
  }

  // European format DD/MM/YYYY
  match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) {
    return `${match[3]}-${match[2]}-${match[1]}`;
  }

  // Compact format DDMMYYYY
  match = value.match(/^(\d{2})(\d{2})(\d{4})$/);
  if (match) {
    return `${match[3]}-${match[2]}-${match[1]}`;
  }

  // Try native Date parsing as fallback
  try {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch (e) {
    // Ignore
  }

  logger.warn(`Unable to parse date: ${value}`);
  return null;
};

/**
 * Normalize gender value
 */
const parseGenderValue = (value) => {
  const normalized = value.toLowerCase().trim();

  if (['m', 'male', 'mann', 'gutt', 'men'].includes(normalized)) {
    return 'M';
  }
  if (['f', 'female', 'kvinne', 'jente', 'women', 'k'].includes(normalized)) {
    return 'F';
  }
  if (['other', 'annet', 'x'].includes(normalized)) {
    return 'O';
  }

  return null;
};

/**
 * Normalize phone number
 */
const normalizePhone = (value) => {
  if (!value) {
    return '';
  }

  // Remove common formatting characters
  let cleaned = value.replace(/[\s\-\(\)\.]/g, '');

  // Remove Norwegian country code if present
  if (cleaned.startsWith('+47')) {
    cleaned = cleaned.substring(3);
  } else if (cleaned.startsWith('0047')) {
    cleaned = cleaned.substring(4);
  }

  return cleaned;
};

/**
 * Parse status value
 */
const parseStatusValue = (value) => {
  const normalized = value.toLowerCase().trim();

  if (['active', 'aktiv', 'a'].includes(normalized)) {
    return 'ACTIVE';
  }
  if (['inactive', 'inaktiv', 'i'].includes(normalized)) {
    return 'INACTIVE';
  }
  if (['finished', 'ferdig', 'avsluttet', 'f'].includes(normalized)) {
    return 'FINISHED';
  }
  if (['deceased', 'død', 'd'].includes(normalized)) {
    return 'DECEASED';
  }

  return 'ACTIVE'; // Default
};

/**
 * Parse category value
 */
const parseCategoryValue = (value) => {
  const normalized = value.toUpperCase().trim();

  if (['OSLO', 'O'].includes(normalized)) {
    return 'OSLO';
  }
  if (['OUTSIDE_OSLO', 'OUTSIDE', 'UTENFOR'].includes(normalized)) {
    return 'OUTSIDE_OSLO';
  }
  if (['TRAVELING', 'REISENDE', 'T'].includes(normalized)) {
    return 'TRAVELING';
  }
  if (['REFERRED', 'HENVIST', 'R'].includes(normalized)) {
    return 'REFERRED';
  }

  return null;
};

/**
 * Validate parsed patients
 * @param {Array} patients - Parsed patient objects
 * @returns {Object} Validation results
 */
export const validateParsedPatients = (patients) => {
  const results = {
    valid: [],
    invalid: [],
    warnings: [],
  };

  for (const patient of patients) {
    const errors = [];
    const warnings = [];

    // Required fields
    if (!patient.first_name && !patient.last_name) {
      errors.push('Missing name (first or last name required)');
    }

    // Contact info recommended
    if (!patient.phone && !patient.email) {
      warnings.push('No contact info (phone or email)');
    }

    // Validate email format if provided
    if (patient.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patient.email)) {
      errors.push(`Invalid email format: ${patient.email}`);
    }

    // Validate date of birth if provided
    if (patient.date_of_birth) {
      const dob = new Date(patient.date_of_birth);
      if (isNaN(dob.getTime())) {
        errors.push(`Invalid date of birth: ${patient.date_of_birth}`);
      } else if (dob > new Date()) {
        errors.push('Date of birth cannot be in the future');
      }
    }

    // Add to appropriate array
    if (errors.length > 0) {
      results.invalid.push({
        patient,
        row: patient._sourceRowIndex,
        errors,
      });
    } else {
      results.valid.push(patient);
      if (warnings.length > 0) {
        results.warnings.push({
          patient,
          row: patient._sourceRowIndex,
          warnings,
        });
      }
    }
  }

  return results;
};

/**
 * Save column mapping template for reuse
 */
export const createMappingTemplate = (name, mappings, metadata = {}) => ({
  name,
  mappings,
  createdAt: new Date().toISOString(),
  ...metadata,
});

export default {
  parseCSV,
  autoDetectMappings,
  applyMappings,
  validateParsedPatients,
  createMappingTemplate,
  STANDARD_MAPPINGS,
  PATIENT_FIELDS,
};
