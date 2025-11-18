/**
 * Patient Service
 * Business logic for patient management
 */

import { query, transaction } from '../config/database.js';
import { encrypt, decrypt, maskSensitive } from '../utils/encryption.js';
import logger from '../utils/logger.js';

/**
 * Get all patients for an organization with pagination and filters
 */
export const getAllPatients = async (organizationId, options = {}) => {
  const {
    page = 1,
    limit = 20,
    search = '',
    status = '',
    category = '',
    sortBy = 'last_name',
    sortOrder = 'asc'
  } = options;

  const offset = (page - 1) * limit;

  try {
    // Build WHERE clause
    let whereClause = 'WHERE p.organization_id = $1';
    const params = [organizationId];
    let paramIndex = 2;

    if (search) {
      params.push(`%${search}%`);
      whereClause += ` AND (
        p.first_name ILIKE $${paramIndex} OR
        p.last_name ILIKE $${paramIndex} OR
        p.email ILIKE $${paramIndex} OR
        p.phone ILIKE $${paramIndex} OR
        p.solvit_id ILIKE $${paramIndex}
      )`;
      paramIndex++;
    }

    if (status) {
      params.push(status);
      whereClause += ` AND p.status = $${paramIndex}`;
      paramIndex++;
    }

    if (category) {
      params.push(category);
      whereClause += ` AND p.category = $${paramIndex}`;
      paramIndex++;
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM patients p ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get patients with pagination
    params.push(limit, offset);
    const result = await query(
      `SELECT
        p.*,
        COUNT(DISTINCT ce.id) as total_encounters,
        COUNT(DISTINCT a.id) FILTER (WHERE a.start_time >= NOW()) as upcoming_appointments,
        MAX(ce.encounter_date) as last_encounter_date
      FROM patients p
      LEFT JOIN clinical_encounters ce ON ce.patient_id = p.id
      LEFT JOIN appointments a ON a.patient_id = p.id
      ${whereClause}
      GROUP BY p.id
      ORDER BY p.${sortBy} ${sortOrder.toUpperCase()}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    // Mask sensitive data
    const patients = result.rows.map(patient => ({
      ...patient,
      encrypted_personal_number: patient.encrypted_personal_number
        ? maskSensitive(patient.encrypted_personal_number, 3)
        : null
    }));

    return {
      patients,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error('Error getting patients:', error);
    throw error;
  }
};

/**
 * Get patient by ID
 */
export const getPatientById = async (organizationId, patientId) => {
  try {
    const result = await query(
      `SELECT
        p.*,
        COUNT(DISTINCT ce.id) as total_encounters,
        COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'COMPLETED') as completed_appointments,
        COUNT(DISTINCT a.id) FILTER (WHERE a.start_time >= NOW()) as upcoming_appointments,
        MAX(ce.encounter_date) as last_encounter_date,
        MIN(ce.encounter_date) as first_encounter_date,
        SUM(fm.patient_amount) as total_paid
      FROM patients p
      LEFT JOIN clinical_encounters ce ON ce.patient_id = p.id
      LEFT JOIN appointments a ON a.patient_id = p.id
      LEFT JOIN financial_metrics fm ON fm.patient_id = p.id
      WHERE p.organization_id = $1 AND p.id = $2
      GROUP BY p.id`,
      [organizationId, patientId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const patient = result.rows[0];

    // Decrypt personal number if present
    if (patient.encrypted_personal_number) {
      patient.decrypted_personal_number = decrypt(patient.encrypted_personal_number);
      patient.masked_personal_number = maskSensitive(patient.decrypted_personal_number, 3);
      delete patient.encrypted_personal_number;
    }

    return patient;
  } catch (error) {
    logger.error('Error getting patient:', error);
    throw error;
  }
};

/**
 * Create new patient
 */
export const createPatient = async (organizationId, patientData) => {
  try {
    // Encrypt personal number if provided
    let encryptedPersonalNumber = null;
    if (patientData.personal_number) {
      encryptedPersonalNumber = encrypt(patientData.personal_number);
    }

    const result = await query(
      `INSERT INTO patients (
        organization_id,
        solvit_id,
        encrypted_personal_number,
        first_name,
        last_name,
        date_of_birth,
        gender,
        email,
        phone,
        address,
        emergency_contact,
        red_flags,
        contraindications,
        allergies,
        current_medications,
        medical_history,
        status,
        category,
        referral_source,
        referring_doctor,
        insurance_type,
        insurance_number,
        has_nav_rights,
        consent_sms,
        consent_email,
        consent_data_storage,
        consent_marketing,
        consent_date,
        first_visit_date,
        internal_notes
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
        $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30
      ) RETURNING *`,
      [
        organizationId,
        patientData.solvit_id,
        encryptedPersonalNumber,
        patientData.first_name,
        patientData.last_name,
        patientData.date_of_birth,
        patientData.gender,
        patientData.email || null,
        patientData.phone || null,
        patientData.address ? JSON.stringify(patientData.address) : null,
        patientData.emergency_contact ? JSON.stringify(patientData.emergency_contact) : null,
        patientData.red_flags || [],
        patientData.contraindications || [],
        patientData.allergies || [],
        patientData.current_medications || [],
        patientData.medical_history || null,
        patientData.status || 'ACTIVE',
        patientData.category || null,
        patientData.referral_source || null,
        patientData.referring_doctor || null,
        patientData.insurance_type || null,
        patientData.insurance_number || null,
        patientData.has_nav_rights || false,
        patientData.consent_sms || false,
        patientData.consent_email || false,
        patientData.consent_data_storage !== false,
        patientData.consent_marketing || false,
        patientData.consent_date || new Date(),
        patientData.first_visit_date || null,
        patientData.internal_notes || null
      ]
    );

    logger.info('Patient created:', {
      organizationId,
      patientId: result.rows[0].id,
      solvitId: result.rows[0].solvit_id
    });

    return result.rows[0];
  } catch (error) {
    logger.error('Error creating patient:', error);
    throw error;
  }
};

/**
 * Update patient
 */
export const updatePatient = async (organizationId, patientId, patientData) => {
  try {
    // Encrypt personal number if being updated
    if (patientData.personal_number) {
      patientData.encrypted_personal_number = encrypt(patientData.personal_number);
      delete patientData.personal_number;
    }

    // Build UPDATE clause dynamically
    const updateFields = [];
    const params = [organizationId, patientId];
    let paramIndex = 3;

    const allowedFields = [
      'first_name', 'last_name', 'date_of_birth', 'gender', 'email', 'phone',
      'address', 'emergency_contact', 'red_flags', 'contraindications',
      'allergies', 'current_medications', 'medical_history', 'status',
      'category', 'referral_source', 'referring_doctor', 'insurance_type',
      'insurance_number', 'has_nav_rights', 'consent_sms', 'consent_email',
      'consent_marketing', 'internal_notes', 'encrypted_personal_number'
    ];

    for (const field of allowedFields) {
      if (patientData[field] !== undefined) {
        updateFields.push(`${field} = $${paramIndex}`);
        params.push(patientData[field]);
        paramIndex++;
      }
    }

    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }

    const result = await query(
      `UPDATE patients
       SET ${updateFields.join(', ')}, updated_at = NOW()
       WHERE organization_id = $1 AND id = $2
       RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return null;
    }

    logger.info('Patient updated:', {
      organizationId,
      patientId,
      fieldsUpdated: updateFields.length
    });

    return result.rows[0];
  } catch (error) {
    logger.error('Error updating patient:', error);
    throw error;
  }
};

/**
 * Delete patient (soft delete - set status to inactive)
 */
export const deletePatient = async (organizationId, patientId) => {
  try {
    const result = await query(
      `UPDATE patients
       SET status = 'INACTIVE', updated_at = NOW()
       WHERE organization_id = $1 AND id = $2
       RETURNING *`,
      [organizationId, patientId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    logger.info('Patient soft deleted:', {
      organizationId,
      patientId
    });

    return result.rows[0];
  } catch (error) {
    logger.error('Error deleting patient:', error);
    throw error;
  }
};

/**
 * Search patients
 */
export const searchPatients = async (organizationId, searchTerm, limit = 10) => {
  try {
    const result = await query(
      `SELECT
        id,
        solvit_id,
        first_name,
        last_name,
        date_of_birth,
        email,
        phone,
        status,
        last_visit_date
      FROM patients
      WHERE organization_id = $1
        AND (
          first_name ILIKE $2 OR
          last_name ILIKE $2 OR
          email ILIKE $2 OR
          phone ILIKE $2 OR
          solvit_id ILIKE $2
        )
        AND status = 'ACTIVE'
      ORDER BY last_name, first_name
      LIMIT $3`,
      [organizationId, `%${searchTerm}%`, limit]
    );

    return result.rows;
  } catch (error) {
    logger.error('Error searching patients:', error);
    throw error;
  }
};

/**
 * Get patient statistics
 */
export const getPatientStatistics = async (organizationId, patientId) => {
  try {
    // Get visit statistics
    const visitsResult = await query(
      `SELECT
        COUNT(*) as total_visits,
        COUNT(*) FILTER (WHERE encounter_type = 'INITIAL') as initial_visits,
        COUNT(*) FILTER (WHERE encounter_type = 'FOLLOWUP') as followup_visits,
        AVG(duration_minutes) as avg_duration,
        MIN(encounter_date) as first_visit,
        MAX(encounter_date) as last_visit
      FROM clinical_encounters
      WHERE organization_id = $1 AND patient_id = $2`,
      [organizationId, patientId]
    );

    // Get diagnosis statistics
    const diagnosisResult = await query(
      `SELECT
        unnest(icpc_codes) as code,
        COUNT(*) as frequency
      FROM clinical_encounters
      WHERE organization_id = $1 AND patient_id = $2
        AND icpc_codes IS NOT NULL
      GROUP BY code
      ORDER BY frequency DESC
      LIMIT 5`,
      [organizationId, patientId]
    );

    // Get financial statistics
    const financialResult = await query(
      `SELECT
        SUM(gross_amount) as total_gross,
        SUM(patient_amount) as total_paid,
        SUM(insurance_amount) as total_insurance,
        COUNT(*) as total_transactions
      FROM financial_metrics
      WHERE organization_id = $1 AND patient_id = $2`,
      [organizationId, patientId]
    );

    // Get appointment statistics
    const appointmentResult = await query(
      `SELECT
        COUNT(*) as total_appointments,
        COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed,
        COUNT(*) FILTER (WHERE status = 'NO_SHOW') as no_shows,
        COUNT(*) FILTER (WHERE status = 'CANCELLED') as cancelled
      FROM appointments
      WHERE organization_id = $1 AND patient_id = $2`,
      [organizationId, patientId]
    );

    return {
      visits: visitsResult.rows[0],
      topDiagnoses: diagnosisResult.rows,
      financial: financialResult.rows[0],
      appointments: appointmentResult.rows[0]
    };
  } catch (error) {
    logger.error('Error getting patient statistics:', error);
    throw error;
  }
};

/**
 * Get patients requiring follow-up
 */
export const getPatientsNeedingFollowUp = async (organizationId, daysInactive = 90) => {
  try {
    const result = await query(
      `SELECT
        p.*,
        EXTRACT(DAY FROM NOW() - p.last_visit_date) as days_since_visit
      FROM patients p
      WHERE p.organization_id = $1
        AND p.status = 'ACTIVE'
        AND p.last_visit_date < NOW() - INTERVAL '1 day' * $2
        AND NOT EXISTS (
          SELECT 1 FROM follow_ups f
          WHERE f.patient_id = p.id
            AND f.status = 'PENDING'
            AND f.type IN ('RECALL_3M', 'RECALL_6M')
        )
      ORDER BY p.last_visit_date ASC
      LIMIT 50`,
      [organizationId, daysInactive]
    );

    return result.rows;
  } catch (error) {
    logger.error('Error getting patients needing follow-up:', error);
    throw error;
  }
};

export default {
  getAllPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
  searchPatients,
  getPatientStatistics,
  getPatientsNeedingFollowUp
};
