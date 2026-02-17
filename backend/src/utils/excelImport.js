/**
 * Excel Import Utility
 * Imports patient data from Excel files
 */

import { readFile } from 'fs/promises';
import ExcelJS from 'exceljs';
import { createPatient } from '../services/patients.js';
// encryption available via ./encryption.js
import logger from './logger.js';

/**
 * Parse Excel file and return rows
 * @param {string} filePath - Path to Excel file
 * @returns {Promise<Array>} Array of patient data objects
 */
export const parseExcelFile = async (filePath) => {
  try {
    // Read the file
    const buffer = await readFile(filePath);

    // Parse Excel
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    // Get first sheet
    const worksheet = workbook.worksheets[0];

    // Convert to JSON: first row is headers
    const data = [];
    const headers = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        row.eachCell((cell, colNumber) => {
          headers[colNumber] = cell.value;
        });
      } else {
        const rowObj = {};
        row.eachCell((cell, colNumber) => {
          if (headers[colNumber]) {
            rowObj[headers[colNumber]] = cell.value;
          }
        });
        data.push(rowObj);
      }
    });

    logger.info(`Parsed Excel file: ${data.length} rows found`);

    return data;
  } catch (error) {
    logger.error('Error parsing Excel file:', error);
    throw new Error(`Failed to parse Excel file: ${error.message}`);
  }
};

/**
 * Map Excel columns to patient object
 * Adjust column names based on your Excel structure
 */
const mapExcelRowToPatient = (row) => ({
  solvit_id:
    row['SolvIt ID'] ||
    row['Patient ID'] ||
    `IMPORT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  first_name: row['First Name'] || row['Fornavn'] || '',
  last_name: row['Last Name'] || row['Etternavn'] || '',
  date_of_birth: row['Date of Birth'] || row['Fødselsdato'] || null,
  gender: normalizeGender(row['Gender'] || row['Kjønn']),
  email: row['Email'] || row['E-post'] || null,
  phone: normalizePhone(row['Phone'] || row['Telefon']),
  personal_number: row['Personal Number'] || row['Fødselsnummer'] || null,

  // Address
  address: {
    street: row['Address'] || row['Adresse'] || '',
    postal_code: row['Postal Code'] || row['Postnummer'] || '',
    city: row['City'] || row['Poststed'] || '',
    country: row['Country'] || 'Norway',
  },

  // Medical information
  red_flags: parseArray(row['Red Flags'] || row['Røde Flagg']),
  contraindications: parseArray(row['Contraindications'] || row['Kontraindikasjoner']),
  allergies: parseArray(row['Allergies'] || row['Allergier']),
  current_medications: parseArray(row['Medications'] || row['Medisiner']),
  medical_history: row['Medical History'] || row['Medisinsk Historie'] || null,

  // Status and category
  status: normalizeStatus(row['Status']),
  category: normalizeCategory(row['Category'] || row['Kategori']),

  // Referral
  referral_source: row['Referral Source'] || row['Henvisning Fra'] || null,
  referring_doctor: row['Referring Doctor'] || row['Henvisende Lege'] || null,

  // Insurance
  insurance_type: row['Insurance Type'] || row['Forsikring'] || null,
  insurance_number: row['Insurance Number'] || row['Forsikringsnummer'] || null,
  has_nav_rights: parseBoolean(row['NAV Rights'] || row['NAV Rettigheter']),

  // Consent (default to true for data storage, false for communications)
  consent_sms: parseBoolean(row['SMS Consent'] || row['SMS Samtykke']),
  consent_email: parseBoolean(row['Email Consent'] || row['Epost Samtykke']),
  consent_data_storage: true, // Always true for imported patients
  consent_marketing: false, // Default false
  consent_date: new Date(),

  // Notes
  internal_notes: row['Notes'] || row['Notater'] || null,

  // First visit
  first_visit_date: row['First Visit'] || row['Første Besøk'] || null,
});

/**
 * Helper functions for data normalization
 */
const normalizeGender = (gender) => {
  if (!gender) {
    return 'OTHER';
  }
  const normalized = gender.toString().toUpperCase();
  if (['M', 'MALE', 'MANN', 'MAN'].includes(normalized)) {
    return 'MALE';
  }
  if (['F', 'FEMALE', 'KVINNE', 'WOMAN'].includes(normalized)) {
    return 'FEMALE';
  }
  return 'OTHER';
};

const normalizePhone = (phone) => {
  if (!phone) {
    return null;
  }
  // Remove all non-numeric characters
  const cleaned = phone.toString().replace(/\D/g, '');
  // Add +47 if Norwegian number without country code
  if (cleaned.length === 8) {
    return `+47${cleaned}`;
  }
  return `+${cleaned}`;
};

const normalizeStatus = (status) => {
  if (!status) {
    return 'ACTIVE';
  }
  const normalized = status.toString().toUpperCase();
  if (['ACTIVE', 'INACTIVE', 'FINISHED', 'DECEASED'].includes(normalized)) {
    return normalized;
  }
  return 'ACTIVE';
};

const normalizeCategory = (category) => {
  if (!category) {
    return null;
  }
  const normalized = category.toString().toUpperCase();
  if (['OSLO', 'OUTSIDE_OSLO', 'TRAVELING', 'REFERRED'].includes(normalized)) {
    return normalized;
  }
  return null;
};

const parseArray = (value) => {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value;
  }
  // Split by comma, semicolon, or newline
  return value
    .toString()
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const parseBoolean = (value) => {
  if (typeof value === 'boolean') {
    return value;
  }
  if (!value) {
    return false;
  }
  const normalized = value.toString().toLowerCase();
  return ['yes', 'true', '1', 'ja', 'y'].includes(normalized);
};

/**
 * Import patients from Excel file
 * @param {string} filePath - Path to Excel file
 * @param {string} organizationId - Organization ID
 * @param {object} options - Import options
 * @returns {Promise<object>} Import results
 */
export const importPatientsFromExcel = async (filePath, organizationId, options = {}) => {
  const { skipDuplicates = true, dryRun = false, onProgress = null } = options;

  const results = {
    total: 0,
    imported: 0,
    skipped: 0,
    errors: [],
    patients: [],
  };

  try {
    // Parse Excel file
    const rows = await parseExcelFile(filePath);
    results.total = rows.length;

    logger.info(`Starting import of ${rows.length} patients`, {
      organizationId,
      dryRun,
      skipDuplicates,
    });

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      try {
        // Map Excel row to patient object
        const patientData = mapExcelRowToPatient(row);

        // Validate required fields
        if (!patientData.first_name || !patientData.last_name) {
          results.errors.push({
            row: i + 2, // +2 because Excel rows start at 1 and we have header
            error: 'Missing required fields: first_name or last_name',
            data: row,
          });
          results.skipped++;
          continue;
        }

        // Check for duplicates if skipDuplicates is true
        if (skipDuplicates) {
          // This would require checking the database
          // For now, we'll just log it
          logger.debug(`Checking for duplicate: ${patientData.solvit_id}`);
        }

        // Import patient (unless dry run)
        if (!dryRun) {
          const patient = await createPatient(organizationId, patientData);
          results.patients.push(patient);
          results.imported++;

          logger.info(`Imported patient ${i + 1}/${rows.length}:`, {
            id: patient.id,
            name: `${patient.first_name} ${patient.last_name}`,
          });
        } else {
          results.imported++;
          logger.info(`[DRY RUN] Would import patient ${i + 1}/${rows.length}:`, {
            name: `${patientData.first_name} ${patientData.last_name}`,
          });
        }

        // Call progress callback
        if (onProgress) {
          onProgress({
            current: i + 1,
            total: rows.length,
            patient: patientData,
          });
        }
      } catch (error) {
        logger.error(`Error importing patient at row ${i + 2}:`, error);
        results.errors.push({
          row: i + 2,
          error: error.message,
          data: row,
        });
        results.skipped++;
      }
    }

    logger.info('Import completed:', {
      total: results.total,
      imported: results.imported,
      skipped: results.skipped,
      errors: results.errors.length,
    });

    return results;
  } catch (error) {
    logger.error('Fatal error during import:', error);
    throw error;
  }
};

/**
 * Generate Excel template for patient import
 * @returns {Promise<Buffer>} Excel file buffer
 */
export const generateImportTemplate = async () => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Patients');

  const columns = [
    'SolvIt ID',
    'First Name',
    'Last Name',
    'Date of Birth',
    'Gender',
    'Email',
    'Phone',
    'Personal Number',
    'Address',
    'Postal Code',
    'City',
    'Country',
    'Red Flags',
    'Contraindications',
    'Allergies',
    'Medications',
    'Medical History',
    'Status',
    'Category',
    'Referral Source',
    'Referring Doctor',
    'Insurance Type',
    'Insurance Number',
    'NAV Rights',
    'SMS Consent',
    'Email Consent',
    'Notes',
    'First Visit',
  ];

  worksheet.columns = columns.map((name) => ({ header: name, key: name, width: 18 }));

  worksheet.addRow({
    'SolvIt ID': 'SOLVIT-001',
    'First Name': 'Ola',
    'Last Name': 'Nordmann',
    'Date of Birth': '1980-01-15',
    Gender: 'Male',
    Email: 'ola@example.com',
    Phone: '98765432',
    'Personal Number': '15018012345',
    Address: 'Storgata 1',
    'Postal Code': '0150',
    City: 'Oslo',
    Country: 'Norway',
    'Red Flags': 'Osteoporosis',
    Contraindications: 'Recent surgery',
    Allergies: 'Penicillin',
    Medications: 'Aspirin, Vitamin D',
    'Medical History': 'Previous lower back pain',
    Status: 'Active',
    Category: 'Oslo',
    'Referral Source': 'GP',
    'Referring Doctor': 'Dr. Hansen',
    'Insurance Type': 'NAV',
    'Insurance Number': 'INS-12345',
    'NAV Rights': 'Yes',
    'SMS Consent': 'Yes',
    'Email Consent': 'Yes',
    Notes: 'Prefers morning appointments',
    'First Visit': '2024-01-10',
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};

export default {
  parseExcelFile,
  importPatientsFromExcel,
  generateImportTemplate,
};
