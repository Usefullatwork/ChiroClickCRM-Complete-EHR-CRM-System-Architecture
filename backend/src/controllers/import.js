/**
 * Import Controller
 * Handle Excel imports, text parsing, and data imports
 */

import * as excelImportService from '../services/excelImport.js';
import * as textParserService from '../services/textParser.js';
import * as patientService from '../services/patients.js';
import { query } from '../config/database.js';
import { validateFodselsnummerDetailed } from '../utils/encryption.js';
import logger from '../utils/logger.js';

/**
 * Import patients from Excel file
 */
export const importPatientsExcel = async (req, res) => {
  try {
    const { organizationId, userId } = req;
    const { skipDuplicates, updateExisting, dryRun } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    const results = await excelImportService.importPatientsFromExcel(
      organizationId,
      req.file.buffer,
      userId,
      {
        skipDuplicates: skipDuplicates !== 'false',
        updateExisting: updateExisting === 'true',
        dryRun: dryRun === 'true',
      }
    );

    res.json({
      success: true,
      data: results,
      message: `Import completed: ${results.imported} imported, ${results.updated} updated, ${results.skipped} skipped`,
    });
  } catch (error) {
    logger.error('Error in importPatientsExcel controller:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to import patients',
    });
  }
};

/**
 * Download Excel import template
 */
export const downloadTemplate = async (req, res) => {
  try {
    const buffer = await excelImportService.generatePatientTemplate();

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename=patient_import_template.xlsx');
    res.send(buffer);
  } catch (error) {
    logger.error('Error in downloadTemplate controller:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate template',
    });
  }
};

/**
 * Parse patient data from pasted text
 */
export const parseText = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'No text provided',
      });
    }

    const result = textParserService.parsePatientData(text);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Error in parseText controller:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to parse text',
    });
  }
};

/**
 * Validate patient data before import
 * @param {Object} patient - Patient data object
 * @param {number} index - Patient index for error messages
 * @returns {Object} Validation result with errors array and enriched patient data
 */
const validatePatientData = (patient, index) => {
  const errors = [];
  const enrichedPatient = { ...patient };

  // Required fields validation
  if (!patient.first_name) {
    errors.push(`Patient ${index}: Missing first name`);
  }
  if (!patient.last_name) {
    errors.push(`Patient ${index}: Missing last name`);
  }

  // Phone or email required for contact
  if (!patient.phone && !patient.email) {
    errors.push(`Patient ${index}: Must have either phone or email`);
  }

  // Validate and enrich from Norwegian fødselsnummer if provided
  if (patient.national_id || patient.personal_number) {
    const nationalId = patient.national_id || patient.personal_number;
    const validation = validateFodselsnummerDetailed(nationalId);

    if (!validation.valid) {
      errors.push(`Patient ${index}: Invalid fødselsnummer - ${validation.error}`);
    } else {
      // Enrich patient data from validated fødselsnummer
      enrichedPatient.personal_number = nationalId;

      // Auto-fill birth date if not provided
      if (!enrichedPatient.date_of_birth && validation.birthDate) {
        enrichedPatient.date_of_birth = validation.birthDate.toISOString().split('T')[0];
      }

      // Auto-fill gender if not provided
      if (!enrichedPatient.gender && validation.gender) {
        enrichedPatient.gender = validation.gender === 'male' ? 'M' : 'F';
      }
    }
  }

  // Validate phone format (Norwegian)
  if (patient.phone) {
    const cleanPhone = patient.phone.replace(/[\s-]/g, '');
    if (!/^(\+47)?[4-9]\d{7}$/.test(cleanPhone)) {
      errors.push(`Patient ${index}: Invalid Norwegian phone number: ${patient.phone}`);
    } else {
      // Normalize phone number (remove country code for storage)
      enrichedPatient.phone = cleanPhone.replace(/^\+47/, '');
    }
  }

  // Validate email format
  if (patient.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patient.email)) {
    errors.push(`Patient ${index}: Invalid email format: ${patient.email}`);
  }

  // Validate date of birth if provided
  if (patient.date_of_birth) {
    const dob = new Date(patient.date_of_birth);
    if (isNaN(dob.getTime())) {
      errors.push(`Patient ${index}: Invalid date of birth: ${patient.date_of_birth}`);
    } else if (dob > new Date()) {
      errors.push(`Patient ${index}: Date of birth cannot be in the future`);
    }
  }

  return { errors, enrichedPatient };
};

/**
 * Check for duplicate patient in database
 * @param {string} organizationId - Organization ID
 * @param {Object} patient - Patient data
 * @returns {Object|null} Existing patient or null
 */
const findExistingPatient = async (organizationId, patient) => {
  // Check by Solvit ID first (most reliable)
  if (patient.solvit_id) {
    const result = await query(
      'SELECT id, first_name, last_name FROM patients WHERE organization_id = $1 AND solvit_id = $2',
      [organizationId, patient.solvit_id]
    );
    if (result.rows.length > 0) {
      return { ...result.rows[0], matchedBy: 'solvit_id' };
    }
  }

  // Check by personal number (fødselsnummer)
  if (patient.personal_number) {
    const _result = await query(
      'SELECT id, first_name, last_name FROM patients WHERE organization_id = $1 AND encrypted_personal_number IS NOT NULL',
      [organizationId]
    );
    // Note: Full check would require decryption - for now we skip this to avoid performance issues
  }

  // Check by email
  if (patient.email) {
    const result = await query(
      'SELECT id, first_name, last_name FROM patients WHERE organization_id = $1 AND LOWER(email) = LOWER($2)',
      [organizationId, patient.email]
    );
    if (result.rows.length > 0) {
      return { ...result.rows[0], matchedBy: 'email' };
    }
  }

  // Check by phone
  if (patient.phone) {
    const cleanPhone = patient.phone.replace(/[\s+-]/g, '').replace(/^47/, '');
    const result = await query(
      `SELECT id, first_name, last_name FROM patients
       WHERE organization_id = $1
       AND REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '+47', '') = $2`,
      [organizationId, cleanPhone]
    );
    if (result.rows.length > 0) {
      return { ...result.rows[0], matchedBy: 'phone' };
    }
  }

  // Check by name + date of birth
  if (patient.first_name && patient.last_name && patient.date_of_birth) {
    const result = await query(
      `SELECT id, first_name, last_name FROM patients
       WHERE organization_id = $1
       AND LOWER(first_name) = LOWER($2)
       AND LOWER(last_name) = LOWER($3)
       AND date_of_birth = $4`,
      [organizationId, patient.first_name, patient.last_name, patient.date_of_birth]
    );
    if (result.rows.length > 0) {
      return { ...result.rows[0], matchedBy: 'name_and_dob' };
    }
  }

  return null;
};

/**
 * Import patients from parsed text
 * Supports options for duplicate handling and dry run mode
 */
export const importPatientsFromText = async (req, res) => {
  try {
    const { organizationId, userId } = req;
    const { patients, skipDuplicates = true, updateExisting = false, dryRun = false } = req.body;

    if (!patients || !Array.isArray(patients)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid patients data. Expected an array of patient objects.',
      });
    }

    if (patients.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No patients provided for import',
      });
    }

    // Initialize results tracking
    const results = {
      total: patients.length,
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: [],
      duplicates: [],
      importedPatients: [],
    };

    logger.info('Starting text-based patient import', {
      organizationId,
      userId,
      patientCount: patients.length,
      options: { skipDuplicates, updateExisting, dryRun },
    });

    for (let i = 0; i < patients.length; i++) {
      const patientIndex = i + 1;
      const patient = patients[i];

      try {
        // Step 1: Validate patient data
        const { errors: validationErrors, enrichedPatient } = validatePatientData(
          patient,
          patientIndex
        );

        if (validationErrors.length > 0) {
          results.errors.push(...validationErrors);
          results.skipped++;
          continue;
        }

        // Step 2: Check for duplicates
        const existingPatient = await findExistingPatient(organizationId, enrichedPatient);

        if (existingPatient) {
          results.duplicates.push({
            index: patientIndex,
            name: `${enrichedPatient.first_name} ${enrichedPatient.last_name}`,
            matchedBy: existingPatient.matchedBy,
            existingId: existingPatient.id,
          });

          if (updateExisting && !dryRun) {
            // Update existing patient
            const _updatedPatient = await patientService.updatePatient(
              organizationId,
              existingPatient.id,
              {
                first_name: enrichedPatient.first_name,
                last_name: enrichedPatient.last_name,
                date_of_birth: enrichedPatient.date_of_birth,
                gender: enrichedPatient.gender,
                email: enrichedPatient.email,
                phone: enrichedPatient.phone,
                address: enrichedPatient.address_street
                  ? {
                      street: enrichedPatient.address_street,
                      postalCode: enrichedPatient.address_postal_code,
                      city: enrichedPatient.address_city,
                    }
                  : undefined,
                personal_number: enrichedPatient.personal_number,
                internal_notes: enrichedPatient.notes || enrichedPatient.general_notes,
              }
            );
            results.updated++;
            logger.info(`Updated existing patient ${existingPatient.id}`, { patientIndex });
          } else if (skipDuplicates) {
            results.skipped++;
          } else {
            results.errors.push(
              `Patient ${patientIndex}: Duplicate found (matched by ${existingPatient.matchedBy})`
            );
            results.skipped++;
          }
          continue;
        }

        // Step 3: Create new patient (skip if dry run)
        if (dryRun) {
          results.imported++;
          continue;
        }

        // Build patient data object for creation
        const patientData = {
          solvit_id: enrichedPatient.solvit_id,
          first_name: enrichedPatient.first_name,
          last_name: enrichedPatient.last_name,
          date_of_birth: enrichedPatient.date_of_birth,
          gender: enrichedPatient.gender,
          email: enrichedPatient.email,
          phone: enrichedPatient.phone,
          personal_number: enrichedPatient.personal_number,
          address: enrichedPatient.address_street
            ? {
                street: enrichedPatient.address_street,
                postalCode: enrichedPatient.address_postal_code,
                city: enrichedPatient.address_city,
              }
            : null,
          status: enrichedPatient.status || 'ACTIVE',
          category: enrichedPatient.category,
          referral_source: enrichedPatient.referral_source,
          internal_notes: enrichedPatient.notes || enrichedPatient.general_notes,
          consent_data_storage: true,
          consent_date: new Date(),
        };

        // Create the patient using the patient service
        const newPatient = await patientService.createPatient(organizationId, patientData);

        results.imported++;
        results.importedPatients.push({
          id: newPatient.id,
          name: `${newPatient.first_name} ${newPatient.last_name}`,
          solvit_id: newPatient.solvit_id,
        });

        logger.info(`Created new patient ${newPatient.id}`, {
          patientIndex,
          name: `${newPatient.first_name} ${newPatient.last_name}`,
        });
      } catch (error) {
        logger.error(`Error importing patient ${patientIndex}:`, error);
        results.errors.push(`Patient ${patientIndex}: ${error.message}`);
        results.skipped++;
      }
    }

    // Log final results
    logger.info('Text-based patient import completed', {
      organizationId,
      userId,
      results: {
        total: results.total,
        imported: results.imported,
        updated: results.updated,
        skipped: results.skipped,
        errors: results.errors.length,
        duplicates: results.duplicates.length,
      },
      dryRun,
    });

    // Build response message
    const messageParts = [];
    if (results.imported > 0) {
      messageParts.push(`${results.imported} imported`);
    }
    if (results.updated > 0) {
      messageParts.push(`${results.updated} updated`);
    }
    if (results.skipped > 0) {
      messageParts.push(`${results.skipped} skipped`);
    }
    if (results.errors.length > 0) {
      messageParts.push(`${results.errors.length} errors`);
    }

    res.json({
      success: true,
      data: {
        total: results.total,
        imported: results.imported,
        updated: results.updated,
        skipped: results.skipped,
        errors: results.errors,
        duplicates: results.duplicates,
        importedPatients: dryRun ? [] : results.importedPatients,
      },
      message: dryRun
        ? `Dry run completed: ${messageParts.join(', ')}`
        : `Import completed: ${messageParts.join(', ')}`,
    });
  } catch (error) {
    logger.error('Error in importPatientsFromText controller:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to import patients from text',
    });
  }
};

export default {
  importPatientsExcel,
  downloadTemplate,
  parseText,
  importPatientsFromText,
};
