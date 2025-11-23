/**
 * Use Case: Create Patient
 * Encapsulates business logic for creating a new patient
 */

import { Patient } from '../entities/Patient.js';
import { ConflictError, ValidationError } from '../../utils/errors.js';
import { query } from '../../config/database.js';
import { encrypt } from '../../utils/encryption.js';
import logger from '../../utils/logger.js';

export class CreatePatientUseCase {
  /**
   * Execute the use case
   * @param {Object} patientData - Patient data
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Patient>} Created patient
   */
  async execute(patientData, organizationId) {
    // Create domain entity
    const patient = new Patient({
      ...patientData,
      organization_id: organizationId
    });

    // Validate business rules
    const validation = patient.validate();
    if (!validation.isValid) {
      throw new ValidationError('Patient validation failed', validation.errors);
    }

    // Check for duplicate SolvIT ID
    const existingPatient = await this.checkDuplicateSolvitId(
      patient.solvitId,
      organizationId
    );
    if (existingPatient) {
      throw new ConflictError('Patient', 'solvit_id', patient.solvitId);
    }

    // Encrypt personal number if provided
    const dbData = patient.toDatabase();
    if (patientData.personal_number) {
      dbData.encrypted_personal_number = encrypt(patientData.personal_number);
    }

    // Save to database
    const result = await query(
      `INSERT INTO patients (
        organization_id, solvit_id, first_name, last_name, date_of_birth,
        gender, email, phone, address, emergency_contact, red_flags,
        contraindications, allergies, current_medications, medical_history,
        status, category, referral_source, referring_doctor,
        insurance_type, insurance_number, has_nav_rights,
        consent_sms, consent_email, consent_data_storage, consent_marketing,
        encrypted_personal_number, preferred_contact_method, main_problem
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29
      ) RETURNING *`,
      [
        organizationId,
        dbData.solvit_id,
        dbData.first_name,
        dbData.last_name,
        dbData.date_of_birth,
        patientData.gender,
        dbData.email,
        dbData.phone,
        patientData.address ? JSON.stringify(patientData.address) : null,
        patientData.emergency_contact ? JSON.stringify(patientData.emergency_contact) : null,
        patientData.red_flags || [],
        patientData.contraindications || [],
        patientData.allergies || [],
        patientData.current_medications || [],
        patientData.medical_history,
        dbData.status,
        dbData.category,
        patientData.referral_source,
        patientData.referring_doctor,
        patientData.insurance_type,
        patientData.insurance_number,
        patientData.has_nav_rights || false,
        patientData.consent_sms || false,
        patientData.consent_email || false,
        patientData.consent_data_storage !== false,
        patientData.consent_marketing || false,
        dbData.encrypted_personal_number,
        dbData.preferred_contact_method,
        dbData.main_problem
      ]
    );

    logger.info('Patient created', {
      patientId: result.rows[0].id,
      solvitId: patient.solvitId,
      organizationId
    });

    return Patient.fromDatabase(result.rows[0]);
  }

  /**
   * Check if SolvIT ID already exists
   */
  async checkDuplicateSolvitId(solvitId, organizationId) {
    const result = await query(
      'SELECT id FROM patients WHERE solvit_id = $1 AND organization_id = $2',
      [solvitId, organizationId]
    );
    return result.rows.length > 0 ? result.rows[0] : null;
  }
}

export default CreatePatientUseCase;
