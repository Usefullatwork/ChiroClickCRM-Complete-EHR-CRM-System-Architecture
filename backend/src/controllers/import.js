/**
 * Import Controller
 * Handle Excel imports, text parsing, and data imports
 */

import * as excelImportService from '../services/excelImport.js';
import * as textParserService from '../services/textParser.js';
import { createPatient } from '../services/patients.js';
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
        error: 'No file uploaded'
      });
    }

    const results = await excelImportService.importPatientsFromExcel(
      organizationId,
      req.file.buffer,
      userId,
      {
        skipDuplicates: skipDuplicates !== 'false',
        updateExisting: updateExisting === 'true',
        dryRun: dryRun === 'true'
      }
    );

    res.json({
      success: true,
      data: results,
      message: `Import completed: ${results.imported} imported, ${results.updated} updated, ${results.skipped} skipped`
    });
  } catch (error) {
    logger.error('Error in importPatientsExcel controller:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to import patients'
    });
  }
};

/**
 * Download Excel import template
 */
export const downloadTemplate = async (req, res) => {
  try {
    const buffer = excelImportService.generatePatientTemplate();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=patient_import_template.xlsx');
    res.send(buffer);
  } catch (error) {
    logger.error('Error in downloadTemplate controller:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate template'
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
        error: 'No text provided'
      });
    }

    const result = textParserService.parsePatientData(text);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error in parseText controller:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to parse text'
    });
  }
};

/**
 * Import patients from parsed text
 */
export const importPatientsFromText = async (req, res) => {
  try {
    const { organizationId, userId } = req;
    const { patients } = req.body;

    if (!patients || !Array.isArray(patients)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid patients data'
      });
    }

    // Validate and import each patient
    const results = {
      total: patients.length,
      imported: 0,
      errors: []
    };

    for (let i = 0; i < patients.length; i++) {
      const patient = patients[i];

      try {
        // Basic validation
        if (!patient.first_name || !patient.last_name) {
          results.errors.push(`Patient ${i + 1}: Missing name`);
          continue;
        }

        // Import to database using patient service
        await createPatient(organizationId, {
          first_name: patient.first_name,
          last_name: patient.last_name,
          date_of_birth: patient.date_of_birth || null,
          gender: patient.gender || null,
          email: patient.email || null,
          phone: patient.phone || null,
          address: patient.address || null,
          personal_number: patient.personal_number || null,
          status: 'ACTIVE',
          consent_data_storage: true,
          consent_date: new Date().toISOString(),
          first_visit_date: new Date().toISOString().split('T')[0]
        });
        results.imported++;
      } catch (error) {
        logger.error(`Error importing patient ${i + 1}:`, error);
        results.errors.push(`Patient ${i + 1}: ${error.message}`);
      }
    }

    res.json({
      success: true,
      data: results,
      message: `Import completed: ${results.imported} imported, ${results.errors.length} failed`
    });
  } catch (error) {
    logger.error('Error in importPatientsFromText controller:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to import patients from text'
    });
  }
};

export default {
  importPatientsExcel,
  downloadTemplate,
  parseText,
  importPatientsFromText
};
