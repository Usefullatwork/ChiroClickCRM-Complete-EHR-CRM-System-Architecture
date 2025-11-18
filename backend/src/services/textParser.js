/**
 * Text Parser Service
 * Parse pasted text data and extract patient information
 * Used for copying data from Solvit or other sources
 */

import logger from '../utils/logger.js';

/**
 * Parse Norwegian phone number
 */
const parseNorwegianPhone = (text) => {
  if (!text) return null;

  // Remove all non-digits
  const digits = text.replace(/\D/g, '');

  // Norwegian mobile: 8 digits starting with 4-9
  if (/^[4-9]\d{7}$/.test(digits)) {
    return digits;
  }

  // With country code
  if (/^47[4-9]\d{7}$/.test(digits)) {
    return digits.substring(2);
  }

  return null;
};

/**
 * Parse Norwegian personnummer (national ID)
 */
const parseNationalId = (text) => {
  if (!text) return null;

  const digits = text.replace(/\s/g, '');

  // Norwegian personnummer: 11 digits (DDMMYYXXXXX)
  if (/^\d{11}$/.test(digits)) {
    return digits;
  }

  return null;
};

/**
 * Parse date in various Norwegian formats
 */
const parseNorwegianDate = (text) => {
  if (!text) return null;

  // DD.MM.YYYY or DD/MM/YYYY
  const match = text.match(/(\d{1,2})[./](\d{1,2})[./](\d{4})/);
  if (match) {
    const [, day, month, year] = match;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  return null;
};

/**
 * Extract patient data from pasted text
 * Supports various formats (table, form, free text)
 */
export const extractPatientFromText = (text) => {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);

  const patient = {
    solvit_id: null,
    first_name: null,
    last_name: null,
    date_of_birth: null,
    national_id: null,
    phone: null,
    email: null,
    address_street: null,
    address_postal_code: null,
    address_city: null,
    gender: null,
    notes: []
  };

  for (const line of lines) {
    // Try to extract email
    const emailMatch = line.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch && !patient.email) {
      patient.email = emailMatch[1];
    }

    // Try to extract phone
    const phoneMatch = line.match(/(\+?47)?[\s-]?([4-9]\d{2})[\s-]?(\d{2})[\s-]?(\d{3})/);
    if (phoneMatch && !patient.phone) {
      patient.phone = parseNorwegianPhone(line);
    }

    // Try to extract national ID (personnummer)
    const nationalIdMatch = line.match(/\b(\d{6}[\s-]?\d{5})\b/);
    if (nationalIdMatch && !patient.national_id) {
      patient.national_id = parseNationalId(nationalIdMatch[1]);

      // Extract date of birth from personnummer
      if (patient.national_id && !patient.date_of_birth) {
        const day = patient.national_id.substring(0, 2);
        const month = patient.national_id.substring(2, 4);
        let year = patient.national_id.substring(4, 6);

        // Determine century
        const centuryDigit = parseInt(patient.national_id.substring(6, 7));
        if (centuryDigit >= 5 && centuryDigit <= 9) {
          year = '19' + year;
        } else {
          year = '20' + year;
        }

        patient.date_of_birth = `${year}-${month}-${day}`;
      }
    }

    // Try to extract address
    const addressMatch = line.match(/^([A-ZÆØÅ][a-zæøå]+(?:\s+[A-ZÆØÅ][a-zæøå]+)*)\s+(\d+[A-Za-z]?)/);
    if (addressMatch && !patient.address_street) {
      patient.address_street = `${addressMatch[1]} ${addressMatch[2]}`;
    }

    // Try to extract postal code and city
    const postalMatch = line.match(/\b(\d{4})\s+([A-ZÆØÅ][A-ZÆØÅA-Za-zæøå\s-]+)/);
    if (postalMatch && !patient.address_postal_code) {
      patient.address_postal_code = postalMatch[1];
      patient.address_city = postalMatch[2].trim();
    }

    // Try to extract Solvit ID
    const idMatch = line.match(/\b([0-9]{6,7})\b/);
    if (idMatch && !patient.solvit_id) {
      patient.solvit_id = idMatch[1];
    }

    // Collect other lines as notes
    if (!emailMatch && !phoneMatch && !nationalIdMatch && !addressMatch && !postalMatch) {
      patient.notes.push(line);
    }
  }

  // Join notes
  patient.notes = patient.notes.join(' ');

  logger.info('Patient data extracted from text:', { hasEmail: !!patient.email, hasPhone: !!patient.phone });
  return patient;
};

/**
 * Parse table-formatted patient list (like the Solvit export)
 * Format: Patient ID | First Name | Last Name | Last Appointment | Contact
 */
export const parsePatientTable = (text) => {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);

  // Skip header row
  const dataLines = lines.slice(1);

  const patients = [];

  for (const line of dataLines) {
    // Split by tabs or multiple spaces
    const columns = line.split(/\t+|\s{2,}/);

    if (columns.length >= 3) {
      const patient = {
        solvit_id: columns[0]?.trim() || null,
        first_name: columns[1]?.trim() || null,
        last_name: columns[2]?.trim() || null,
        last_visit_date: columns[3] ? parseNorwegianDate(columns[3].trim()) : null,
        contact_info: columns[4]?.trim() || null
      };

      // Try to parse contact info
      if (patient.contact_info) {
        const phone = parseNorwegianPhone(patient.contact_info);
        if (phone) {
          patient.phone = phone;
        }

        const emailMatch = patient.contact_info.match(/([^\s@]+@[^\s@]+\.[^\s@]+)/);
        if (emailMatch) {
          patient.email = emailMatch[1];
        }
      }

      patients.push(patient);
    }
  }

  logger.info('Patient table parsed:', { count: patients.length });
  return patients;
};

/**
 * Smart text parser - detects format and routes to appropriate parser
 */
export const parsePatientData = (text) => {
  // Check if it's a table format
  if (text.includes('Patient ID') || text.includes('Solvit') || text.includes('Fornavn')) {
    return { type: 'table', patients: parsePatientTable(text) };
  }

  // Otherwise treat as single patient free text
  return { type: 'single', patient: extractPatientFromText(text) };
};

export default {
  extractPatientFromText,
  parsePatientTable,
  parsePatientData,
  parseNorwegianPhone,
  parseNationalId,
  parseNorwegianDate
};
