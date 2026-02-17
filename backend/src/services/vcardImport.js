/**
 * vCard Import Service
 * Parse vCard (.vcf) files and convert to patient format
 */

import logger from '../utils/logger.js';

/**
 * Parse a single vCard entry
 * @param {string} vcardText - Raw vCard text for one contact
 * @returns {Object} Parsed patient data
 */
const parseVCardEntry = (vcardText) => {
  const patient = {
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    home_phone: '',
    work_phone: '',
    address_street: '',
    address_postal_code: '',
    address_city: '',
    country: '',
    date_of_birth: null,
    notes: '',
    organization: '',
  };

  const lines = vcardText.split(/\r?\n/);

  for (const line of lines) {
    // Skip empty lines
    if (!line.trim()) {
      continue;
    }

    // Parse property and value
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) {
      continue;
    }

    let property = line.substring(0, colonIndex).toUpperCase();
    let value = line.substring(colonIndex + 1).trim();

    // Handle property parameters (e.g., TEL;TYPE=CELL)
    const params = {};
    if (property.includes(';')) {
      const parts = property.split(';');
      property = parts[0];
      parts.slice(1).forEach((param) => {
        const [key, val] = param.split('=');
        params[key?.toUpperCase()] = val?.toUpperCase() || true;
      });
    }

    // Unescape special characters
    value = value
      .replace(/\\n/gi, '\n')
      .replace(/\\,/g, ',')
      .replace(/\\;/g, ';')
      .replace(/\\\\/g, '\\');

    switch (property) {
      case 'N': {
        // N:Last;First;Middle;Prefix;Suffix
        const nameParts = value.split(';');
        patient.last_name = nameParts[0] || '';
        patient.first_name = nameParts[1] || '';
        break;
      }

      case 'FN':
        // Full name - use as fallback if N is not present
        if (!patient.first_name && !patient.last_name) {
          const fullNameParts = value.split(' ');
          patient.first_name = fullNameParts[0] || '';
          patient.last_name = fullNameParts.slice(1).join(' ') || '';
        }
        break;

      case 'EMAIL':
        if (!patient.email) {
          patient.email = value;
        }
        break;

      case 'TEL': {
        const phoneType = params.TYPE || '';
        const cleanPhone = value.replace(/[\s\-()]/g, '');

        if (phoneType.includes('CELL') || phoneType.includes('MOBILE')) {
          patient.phone = cleanPhone;
        } else if (phoneType.includes('HOME')) {
          patient.home_phone = cleanPhone;
        } else if (phoneType.includes('WORK')) {
          patient.work_phone = cleanPhone;
        } else if (!patient.phone) {
          // Default to main phone if no type specified
          patient.phone = cleanPhone;
        }
        break;
      }

      case 'ADR': {
        // ADR:;;Street;City;State;PostalCode;Country
        const addrParts = value.split(';');
        patient.address_street = addrParts[2] || '';
        patient.address_city = addrParts[3] || '';
        // State is addrParts[4]
        patient.address_postal_code = addrParts[5] || '';
        patient.country = addrParts[6] || '';
        break;
      }

      case 'BDAY':
        // Birthday in format YYYYMMDD or YYYY-MM-DD
        try {
          const dateStr = value.replace(/\D/g, ''); // Remove non-digits
          if (dateStr.length === 8) {
            patient.date_of_birth = `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
          }
        } catch (e) {
          logger.warn('Failed to parse birthday:', value);
        }
        break;

      case 'NOTE':
        patient.notes = value;
        break;

      case 'ORG':
        patient.organization = value.split(';')[0];
        break;

      case 'TITLE':
        patient.job_title = value;
        break;
    }
  }

  return patient;
};

/**
 * Parse a vCard file containing one or more contacts
 * @param {string} vcfContent - Raw .vcf file content
 * @returns {Array} Array of parsed patient objects
 */
export const parseVCard = (vcfContent) => {
  const patients = [];

  // Split file into individual vCards
  const vcardPattern = /BEGIN:VCARD[\s\S]*?END:VCARD/gi;
  const vcards = vcfContent.match(vcardPattern) || [];

  for (const vcard of vcards) {
    try {
      const patient = parseVCardEntry(vcard);

      // Only include if we have at least a name
      if (patient.first_name || patient.last_name) {
        patients.push(patient);
      }
    } catch (error) {
      logger.warn('Failed to parse vCard entry:', error.message);
    }
  }

  return patients;
};

/**
 * Convert patient data to vCard format
 * @param {Object} patient - Patient object
 * @returns {string} vCard formatted string
 */
export const patientToVCard = (patient) => {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${patient.last_name || ''};${patient.first_name || ''};;;`,
    `FN:${patient.first_name || ''} ${patient.last_name || ''}`.trim(),
  ];

  if (patient.email) {
    lines.push(`EMAIL;TYPE=HOME:${patient.email}`);
  }

  if (patient.phone) {
    lines.push(`TEL;TYPE=CELL:${patient.phone}`);
  }

  if (patient.home_phone) {
    lines.push(`TEL;TYPE=HOME:${patient.home_phone}`);
  }

  if (patient.work_phone) {
    lines.push(`TEL;TYPE=WORK:${patient.work_phone}`);
  }

  if (patient.address_street || patient.address_city || patient.address_postal_code) {
    lines.push(
      `ADR;TYPE=HOME:;;${patient.address_street || ''};${patient.address_city || ''};;${patient.address_postal_code || ''};${patient.country || 'Norway'}`
    );
  }

  if (patient.date_of_birth) {
    const dob = patient.date_of_birth.replace(/-/g, '');
    lines.push(`BDAY:${dob}`);
  }

  if (patient.notes || patient.internal_notes) {
    const note = (patient.notes || patient.internal_notes).replace(/\n/g, '\\n');
    lines.push(`NOTE:${note}`);
  }

  lines.push('END:VCARD');

  return lines.join('\r\n');
};

/**
 * Export multiple patients to vCard format
 * @param {Array} patients - Array of patient objects
 * @returns {string} vCard file content
 */
export const patientsToVCard = (patients) =>
  patients.map((patient) => patientToVCard(patient)).join('\r\n\r\n');

/**
 * Validate and normalize phone number for Norway
 * @param {string} phone - Phone number
 * @returns {string} Normalized phone number
 */
export const normalizeNorwegianPhone = (phone) => {
  if (!phone) {
    return '';
  }

  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');

  // Remove country code if present
  if (cleaned.startsWith('+47')) {
    cleaned = cleaned.substring(3);
  } else if (cleaned.startsWith('0047')) {
    cleaned = cleaned.substring(4);
  } else if (cleaned.startsWith('47') && cleaned.length > 10) {
    cleaned = cleaned.substring(2);
  }

  // Norwegian mobile numbers start with 4 or 9
  // Landlines can start with 2, 3, 5, 6, 7
  if (cleaned.length === 8 && /^[2-9]/.test(cleaned)) {
    return cleaned;
  }

  return phone; // Return original if not valid Norwegian
};

export default {
  parseVCard,
  patientToVCard,
  patientsToVCard,
  normalizeNorwegianPhone,
};
