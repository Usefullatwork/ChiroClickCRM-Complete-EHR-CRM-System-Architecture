/**
 * Excel Import Service
 * Import patients from Excel/CSV files
 */

import ExcelJS from 'exceljs';
import { query } from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Parse Excel/CSV file
 */
export const parseExcelFile = async (buffer, fileType) => {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.worksheets[0];
    const sheetName = worksheet.name;

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
            // Get formatted text value instead of raw to match previous behavior
            rowObj[headers[colNumber]] = cell.text || cell.value || null;
          }
        });
        data.push(rowObj);
      }
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
      const key = Object.keys(row).find((k) => k.toLowerCase().trim() === name.toLowerCase());
      if (key && row[key]) return row[key];
    }
    return null;
  };

  // Map basic patient data
  const patient = {
    solvit_id: findColumn(
      row,
      'pasient id',
      'solvit_id',
      'solvitid',
      'solvit id',
      'id',
      'patient id'
    ),
    first_name: findColumn(row, 'for navn', 'fornavn', 'first_name', 'firstname', 'first name'),
    last_name: findColumn(
      row,
      'etter navn',
      'etternavn',
      'last_name',
      'lastname',
      'last name',
      'surname'
    ),
    date_of_birth: findColumn(
      row,
      'date_of_birth',
      'dateofbirth',
      'birth_date',
      'fødselsdato',
      'dob',
      'birthdate'
    ),
    national_id: findColumn(
      row,
      'national_id',
      'nationalid',
      'personnummer',
      'ssn',
      'fnr',
      'fodselsnummer'
    ),
    phone: findColumn(row, 'telefonnummer', 'phone', 'telefon', 'mobile', 'mobil', 'phone_number'),
    email: findColumn(row, 'e-post', 'email', 'epost', 'e-mail'),
    address_street: findColumn(
      row,
      'address_street',
      'street',
      'address',
      'adresse',
      'gateadresse'
    ),
    address_postal_code: findColumn(
      row,
      'address_postal_code',
      'postal_code',
      'postnummer',
      'zip',
      'postcode'
    ),
    address_city: findColumn(row, 'address_city', 'city', 'by', 'poststed'),
    gender: findColumn(row, 'gender', 'kjønn', 'sex'),
    emergency_contact_name: findColumn(
      row,
      'emergency_contact_name',
      'emergency_name',
      'pårørende',
      'next_of_kin'
    ),
    emergency_contact_phone: findColumn(
      row,
      'emergency_contact_phone',
      'emergency_phone',
      'pårørende_telefon'
    ),
    category: findColumn(row, 'category', 'kategori', 'patient_category'),

    // CRM fields from Excel
    preferred_therapist: findColumn(
      row,
      'pasient orginal terapaut',
      'preferred_therapist',
      'therapist',
      'terapeut'
    ),
    preferred_contact_method: findColumn(
      row,
      'ønsker kontakt på',
      'preferred_contact',
      'contact_method'
    ),
    patient_status: findColumn(row, 'pasient status', 'status'),
    language: findColumn(row, 'språk', 'language', 'lang'),
    main_problem: findColumn(row, 'hovedproblem', 'main_problem', 'chief_complaint', 'problem'),
    treatment_type: findColumn(row, 'behandlingstype', 'treatment_type', 'treatment'),
    general_notes: findColumn(
      row,
      'generelle notater',
      'general_notes',
      'notes',
      'notater',
      'comments'
    ),
    should_be_followed_up: findColumn(
      row,
      'burde vært fulgt opp',
      'follow_up_date',
      'should_follow_up'
    ),
    last_visit_date: findColumn(row, 'siste besøk dato', 'last_visit', 'last_appointment'),
    referral_source: findColumn(row, 'henvisningskilde', 'referral_source', 'referral'),
  };

  // Normalize status
  if (patient.patient_status === 'Inaktiv') patient.status = 'INACTIVE';
  else if (patient.patient_status === 'Ferdig') patient.status = 'FINISHED';
  else if (patient.patient_status) patient.status = 'ACTIVE';

  // Normalize language
  if (patient.language === 'Norsk') patient.language = 'NO';
  else if (patient.language === 'Engelsk') patient.language = 'EN';

  // Normalize treatment type
  if (patient.treatment_type === 'Kiropraktor') patient.treatment_type = 'KIROPRAKTOR';
  else if (patient.treatment_type === 'Nevrobehandling') patient.treatment_type = 'NEVROBEHANDLING';
  else if (patient.treatment_type === 'Muskelbehandling')
    patient.treatment_type = 'MUSKELBEHANDLING';

  // Normalize contact method
  if (patient.preferred_contact_method === 'Melding') patient.preferred_contact_method = 'SMS';
  else if (patient.preferred_contact_method?.includes('BARN'))
    patient.preferred_contact_method = 'NO_CONTACT';

  return patient;
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
  const { skipDuplicates = true, updateExisting = false, dryRun = false } = options;

  try {
    // Parse Excel file
    const rows = await parseExcelFile(fileBuffer);

    const results = {
      total: rows.length,
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: [],
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
                patient.notes,
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
              userId,
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
export const generatePatientTemplate = async () => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Patients');

  const columns = [
    'Solvit ID',
    'First Name',
    'Last Name',
    'Date of Birth',
    'National ID',
    'Phone',
    'Email',
    'Address Street',
    'Postal Code',
    'City',
    'Gender',
    'Emergency Contact Name',
    'Emergency Contact Phone',
    'Category',
    'Notes',
  ];

  worksheet.columns = columns.map((name) => ({ header: name, key: name, width: 18 }));

  worksheet.addRow({
    'Solvit ID': '12345',
    'First Name': 'Ola',
    'Last Name': 'Nordmann',
    'Date of Birth': '1980-01-15',
    'National ID': '15018012345',
    Phone: '98765432',
    Email: 'ola@example.com',
    'Address Street': 'Storgata 1',
    'Postal Code': '0001',
    City: 'Oslo',
    Gender: 'M',
    'Emergency Contact Name': 'Kari Nordmann',
    'Emergency Contact Phone': '98765433',
    Category: 'OSLO',
    Notes: 'Existing patient from Solvit',
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};

export default {
  parseExcelFile,
  importPatientsFromExcel,
  generatePatientTemplate,
};
