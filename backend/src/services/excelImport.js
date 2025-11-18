/**
 * Excel Import Service
 * Import patients from Excel/CSV files
 */

import XLSX from 'xlsx';
import { query } from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Parse Excel/CSV file
 */
export const parseExcelFile = (buffer, fileType) => {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet, {
      raw: false, // Get formatted values
      defval: null // Default value for empty cells
    });

    logger.info('Excel file parsed:', { rows: data.length, sheet: sheetName });
    return data;
  } catch (error) {
    logger.error('Error parsing Excel file:', error);
    throw new Error('Failed to parse Excel file');
  }
};

/**
 * Map Excel columns to database fields
 * Supports various column name formats
 */
const mapExcelRowToPatient = (row) => {
  // Helper to find column (case-insensitive, handles variations)
  const findColumn = (row, ...names) => {
    for (const name of names) {
      const key = Object.keys(row).find(k =>
        k.toLowerCase().trim() === name.toLowerCase()
      );
      if (key && row[key]) return row[key];
    }
    return null;
  };

  return {
    solvit_id: findColumn(row, 'solvit_id', 'solvitid', 'solvit id', 'id', 'patient id'),
    first_name: findColumn(row, 'first_name', 'firstname', 'fornavn', 'first name'),
    last_name: findColumn(row, 'last_name', 'lastname', 'etternavn', 'last name', 'surname'),
    date_of_birth: findColumn(row, 'date_of_birth', 'dateofbirth', 'birth_date', 'fødselsdato', 'dob', 'birthdate'),
    national_id: findColumn(row, 'national_id', 'nationalid', 'personnummer', 'ssn', 'fnr', 'fodselsnummer'),
    phone: findColumn(row, 'phone', 'telefon', 'mobile', 'mobil', 'phone_number'),
    email: findColumn(row, 'email', 'epost', 'e-post', 'e-mail'),
    address_street: findColumn(row, 'address_street', 'street', 'address', 'adresse', 'gateadresse'),
    address_postal_code: findColumn(row, 'address_postal_code', 'postal_code', 'postnummer', 'zip', 'postcode'),
    address_city: findColumn(row, 'address_city', 'city', 'by', 'poststed'),
    gender: findColumn(row, 'gender', 'kjønn', 'sex'),
    emergency_contact_name: findColumn(row, 'emergency_contact_name', 'emergency_name', 'pårørende', 'next_of_kin'),
    emergency_contact_phone: findColumn(row, 'emergency_contact_phone', 'emergency_phone', 'pårørende_telefon'),
    category: findColumn(row, 'category', 'kategori', 'patient_category'),
    notes: findColumn(row, 'notes', 'notater', 'comments', 'kommentarer')
  };
};

/**
 * Validate patient data
 */
const validatePatient = (patient, rowIndex) => {
  const errors = [];

  // Required fields
  if (!patient.first_name) errors.push(`Row ${rowIndex}: Missing first name`);
  if (!patient.last_name) errors.push(`Row ${rowIndex}: Missing last name`);

  // Phone or email required
  if (!patient.phone && !patient.email) {
    errors.push(`Row ${rowIndex}: Must have either phone or email`);
  }

  // Validate phone format (Norwegian)
  if (patient.phone) {
    const cleanPhone = patient.phone.replace(/\s/g, '');
    if (!/^(\+47)?[4-9]\d{7}$/.test(cleanPhone)) {
      errors.push(`Row ${rowIndex}: Invalid Norwegian phone number: ${patient.phone}`);
    }
  }

  // Validate email format
  if (patient.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patient.email)) {
    errors.push(`Row ${rowIndex}: Invalid email: ${patient.email}`);
  }

  // Validate date of birth
  if (patient.date_of_birth) {
    const dob = new Date(patient.date_of_birth);
    if (isNaN(dob.getTime())) {
      errors.push(`Row ${rowIndex}: Invalid date of birth: ${patient.date_of_birth}`);
    }
  }

  return errors;
};

/**
 * Import patients from Excel file
 */
export const importPatientsFromExcel = async (organizationId, fileBuffer, userId, options = {}) => {
  const {
    skipDuplicates = true,
    updateExisting = false,
    dryRun = false
  } = options;

  try {
    // Parse Excel file
    const rows = parseExcelFile(fileBuffer);

    const results = {
      total: rows.length,
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: []
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const patient = mapExcelRowToPatient(row);

      // Validate
      const validationErrors = validatePatient(patient, i + 2); // +2 for header row
      if (validationErrors.length > 0) {
        results.errors.push(...validationErrors);
        results.skipped++;
        continue;
      }

      if (dryRun) {
        results.imported++;
        continue;
      }

      try {
        // Check for existing patient
        let existingPatient = null;

        if (patient.solvit_id) {
          const solvitCheck = await query(
            'SELECT id FROM patients WHERE organization_id = $1 AND solvit_id = $2',
            [organizationId, patient.solvit_id]
          );
          if (solvitCheck.rows.length > 0) {
            existingPatient = solvitCheck.rows[0];
          }
        }

        // Check by national ID
        if (!existingPatient && patient.national_id) {
          const nationalIdCheck = await query(
            'SELECT id FROM patients WHERE organization_id = $1 AND national_id = $2',
            [organizationId, patient.national_id]
          );
          if (nationalIdCheck.rows.length > 0) {
            existingPatient = nationalIdCheck.rows[0];
          }
        }

        // Check by name and date of birth
        if (!existingPatient && patient.first_name && patient.last_name && patient.date_of_birth) {
          const nameCheck = await query(
            `SELECT id FROM patients
             WHERE organization_id = $1
               AND LOWER(first_name) = LOWER($2)
               AND LOWER(last_name) = LOWER($3)
               AND date_of_birth = $4`,
            [organizationId, patient.first_name, patient.last_name, patient.date_of_birth]
          );
          if (nameCheck.rows.length > 0) {
            existingPatient = nameCheck.rows[0];
          }
        }

        if (existingPatient) {
          if (updateExisting) {
            // Update existing patient
            await query(
              `UPDATE patients SET
                first_name = COALESCE($3, first_name),
                last_name = COALESCE($4, last_name),
                date_of_birth = COALESCE($5, date_of_birth),
                national_id = COALESCE($6, national_id),
                phone = COALESCE($7, phone),
                email = COALESCE($8, email),
                address_street = COALESCE($9, address_street),
                address_postal_code = COALESCE($10, address_postal_code),
                address_city = COALESCE($11, address_city),
                gender = COALESCE($12, gender),
                emergency_contact_name = COALESCE($13, emergency_contact_name),
                emergency_contact_phone = COALESCE($14, emergency_contact_phone),
                category = COALESCE($15, category),
                notes = COALESCE($16, notes),
                updated_at = NOW()
               WHERE organization_id = $1 AND id = $2`,
              [
                organizationId,
                existingPatient.id,
                patient.first_name,
                patient.last_name,
                patient.date_of_birth,
                patient.national_id,
                patient.phone,
                patient.email,
                patient.address_street,
                patient.address_postal_code,
                patient.address_city,
                patient.gender,
                patient.emergency_contact_name,
                patient.emergency_contact_phone,
                patient.category,
                patient.notes
              ]
            );
            results.updated++;
          } else if (skipDuplicates) {
            results.skipped++;
          } else {
            results.errors.push(`Row ${i + 2}: Duplicate patient found`);
            results.skipped++;
          }
        } else {
          // Insert new patient
          await query(
            `INSERT INTO patients (
              organization_id,
              solvit_id,
              first_name,
              last_name,
              date_of_birth,
              national_id,
              phone,
              email,
              address_street,
              address_postal_code,
              address_city,
              gender,
              emergency_contact_name,
              emergency_contact_phone,
              category,
              status,
              notes,
              created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'ACTIVE', $16, $17)`,
            [
              organizationId,
              patient.solvit_id,
              patient.first_name,
              patient.last_name,
              patient.date_of_birth,
              patient.national_id,
              patient.phone,
              patient.email,
              patient.address_street,
              patient.address_postal_code,
              patient.address_city,
              patient.gender,
              patient.emergency_contact_name,
              patient.emergency_contact_phone,
              patient.category,
              patient.notes,
              userId
            ]
          );
          results.imported++;
        }
      } catch (error) {
        logger.error(`Error importing patient row ${i + 2}:`, error);
        results.errors.push(`Row ${i + 2}: ${error.message}`);
        results.skipped++;
      }
    }

    logger.info('Patient import completed:', results);
    return results;
  } catch (error) {
    logger.error('Error in importPatientsFromExcel:', error);
    throw error;
  }
};

/**
 * Generate Excel template for patient import
 */
export const generatePatientTemplate = () => {
  const template = [
    {
      'Solvit ID': '12345',
      'First Name': 'Ola',
      'Last Name': 'Nordmann',
      'Date of Birth': '1980-01-15',
      'National ID': '15018012345',
      'Phone': '98765432',
      'Email': 'ola@example.com',
      'Address Street': 'Storgata 1',
      'Postal Code': '0001',
      'City': 'Oslo',
      'Gender': 'M',
      'Emergency Contact Name': 'Kari Nordmann',
      'Emergency Contact Phone': '98765433',
      'Category': 'OSLO',
      'Notes': 'Existing patient from Solvit'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(template);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Patients');

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
};

export default {
  parseExcelFile,
  importPatientsFromExcel,
  generatePatientTemplate
};
