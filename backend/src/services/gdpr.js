/**
 * GDPR Compliance Service
 * Handles data subject rights: access, portability, erasure, rectification
 */

import { query, transaction } from '../config/database.js';
import { decrypt } from '../utils/encryption.js';
import logger from '../utils/logger.js';

/**
 * Create GDPR request
 */
export const createGDPRRequest = async (organizationId, requestData) => {
  const {
    patient_id,
    request_type,
    request_details = '',
    requester_email,
    requester_phone,
  } = requestData;

  const result = await query(
    `INSERT INTO gdpr_requests (
      organization_id,
      patient_id,
      request_type,
      request_details,
      requester_email,
      requester_phone,
      status
    ) VALUES ($1, $2, $3, $4, $5, $6, 'PENDING')
    RETURNING *`,
    [organizationId, patient_id, request_type, request_details, requester_email, requester_phone]
  );

  logger.info(
    `GDPR request created: ${result.rows[0].id} - Type: ${request_type} for patient: ${patient_id}`
  );
  return result.rows[0];
};

/**
 * Get all GDPR requests
 */
export const getAllGDPRRequests = async (organizationId, options = {}) => {
  const { page = 1, limit = 50, status = null, requestType = null } = options;

  const offset = (page - 1) * limit;
  const whereConditions = ['gr.organization_id = $1'];
  const params = [organizationId];
  let paramIndex = 2;

  if (status) {
    whereConditions.push(`gr.status = $${paramIndex}`);
    params.push(status);
    paramIndex++;
  }

  if (requestType) {
    whereConditions.push(`gr.request_type = $${paramIndex}`);
    params.push(requestType);
    paramIndex++;
  }

  const whereClause = whereConditions.join(' AND ');

  const countResult = await query(
    `SELECT COUNT(*) FROM gdpr_requests gr WHERE ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count);

  const result = await query(
    `SELECT
      gr.*,
      p.first_name || ' ' || p.last_name as patient_name,
      p.solvit_id
    FROM gdpr_requests gr
    JOIN patients p ON p.id = gr.patient_id
    WHERE ${whereClause}
    ORDER BY gr.created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...params, limit, offset]
  );

  return {
    requests: result.rows,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Process data access request (Article 15 - Right to Access)
 * Returns all personal data for a patient
 */
export const processDataAccessRequest = async (organizationId, patientId) => {
  try {
    // Get patient data
    const patientResult = await query(
      `SELECT * FROM patients WHERE id = $1 AND organization_id = $2`,
      [patientId, organizationId]
    );

    if (patientResult.rows.length === 0) {
      throw new Error('Patient not found');
    }

    const patient = patientResult.rows[0];

    // Decrypt personal number if exists
    if (patient.encrypted_personal_number) {
      try {
        patient.personal_number = decrypt(patient.encrypted_personal_number);
        delete patient.encrypted_personal_number;
      } catch (error) {
        logger.error('Failed to decrypt personal number:', error);
        patient.personal_number = '[ENCRYPTED]';
      }
    }

    // Get all encounters
    const encountersResult = await query(
      `SELECT * FROM clinical_encounters WHERE patient_id = $1 AND organization_id = $2 ORDER BY encounter_date DESC`,
      [patientId, organizationId]
    );

    // Get all measurements
    const measurementsResult = await query(
      `SELECT cm.* FROM clinical_measurements cm
       JOIN clinical_encounters ce ON ce.id = cm.encounter_id
       WHERE ce.patient_id = $1 AND ce.organization_id = $2`,
      [patientId, organizationId]
    );

    // Get all appointments
    const appointmentsResult = await query(
      `SELECT * FROM appointments WHERE patient_id = $1 AND organization_id = $2 ORDER BY start_time DESC`,
      [patientId, organizationId]
    );

    // Get all communications
    const communicationsResult = await query(
      `SELECT * FROM communications WHERE patient_id = $1 AND organization_id = $2 ORDER BY sent_at DESC`,
      [patientId, organizationId]
    );

    // Get all financial records
    const financialResult = await query(
      `SELECT * FROM financial_metrics WHERE patient_id = $1 AND organization_id = $2 ORDER BY created_at DESC`,
      [patientId, organizationId]
    );

    // Get all follow-ups
    const followUpsResult = await query(
      `SELECT * FROM follow_ups WHERE patient_id = $1 AND organization_id = $2 ORDER BY due_date DESC`,
      [patientId, organizationId]
    );

    // Get all audit logs related to this patient
    const auditResult = await query(
      `SELECT * FROM audit_logs WHERE resource_type = 'PATIENT' AND resource_id = $1 AND organization_id = $2 ORDER BY created_at DESC`,
      [patientId, organizationId]
    );

    const exportData = {
      patient: patient,
      encounters: encountersResult.rows,
      measurements: measurementsResult.rows,
      appointments: appointmentsResult.rows,
      communications: communicationsResult.rows,
      financial_records: financialResult.rows,
      follow_ups: followUpsResult.rows,
      audit_trail: auditResult.rows,
      export_date: new Date().toISOString(),
      organization_id: organizationId,
    };

    logger.info(`Data access request processed for patient: ${patientId}`);
    return exportData;
  } catch (error) {
    logger.error('Error processing data access request:', error);
    throw error;
  }
};

/**
 * Process data portability request (Article 20 - Right to Data Portability)
 * Returns data in structured, machine-readable format (JSON)
 */
export const processDataPortabilityRequest = async (organizationId, patientId) => {
  const data = await processDataAccessRequest(organizationId, patientId);

  // Convert to portable format (already JSON)
  const portableData = {
    format: 'JSON',
    version: '1.0',
    standard: 'FHIR-inspired', // Could be mapped to FHIR in production
    exported_at: new Date().toISOString(),
    data: data,
  };

  logger.info(`Data portability request processed for patient: ${patientId}`);
  return portableData;
};

/**
 * Process erasure request (Article 17 - Right to Erasure / "Right to be Forgotten")
 * NOTE: Medical records may have legal retention requirements in Norway
 */
export const processErasureRequest = async (organizationId, patientId, requestId) => {
  try {
    return await transaction(async (client) => {
      // Norwegian law requires medical records to be kept for 10 years
      // Check if records are old enough to delete
      const patientResult = await client.query(
        `SELECT created_at FROM patients WHERE id = $1 AND organization_id = $2`,
        [patientId, organizationId]
      );

      if (patientResult.rows.length === 0) {
        throw new Error('Patient not found');
      }

      const createdDate = new Date(patientResult.rows[0].created_at);
      const tenYearsAgo = new Date();
      tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);

      if (createdDate > tenYearsAgo) {
        // Cannot delete - update request status
        await client.query(
          `UPDATE gdpr_requests
           SET status = 'REJECTED',
               response = 'Medical records must be retained for 10 years under Norwegian law (Pasientjournalloven)',
               completed_at = NOW()
           WHERE id = $1`,
          [requestId]
        );

        return {
          status: 'REJECTED',
          reason: 'LEGAL_RETENTION_PERIOD',
          message: 'Medical records must be retained for 10 years under Norwegian law',
          retention_expires: new Date(
            createdDate.getFullYear() + 10,
            createdDate.getMonth(),
            createdDate.getDate()
          ),
        };
      }

      // Anonymize instead of delete to maintain referential integrity
      await client.query(
        `UPDATE patients
         SET
           encrypted_personal_number = NULL,
           first_name = 'ANONYMIZED',
           last_name = 'ANONYMIZED',
           email = NULL,
           phone = NULL,
           address = NULL,
           postal_code = NULL,
           city = NULL,
           emergency_contact_name = NULL,
           emergency_contact_phone = NULL,
           status = 'INACTIVE',
           updated_at = NOW()
         WHERE id = $1 AND organization_id = $2`,
        [patientId, organizationId]
      );

      // Anonymize communications
      await client.query(
        `UPDATE communications
         SET content = '[REDACTED]', recipient_phone = NULL, recipient_email = NULL
         WHERE patient_id = $1 AND organization_id = $2`,
        [patientId, organizationId]
      );

      // Update request status
      await client.query(
        `UPDATE gdpr_requests
         SET status = 'COMPLETED',
             response = 'Patient data anonymized successfully',
             completed_at = NOW()
         WHERE id = $1`,
        [requestId]
      );

      logger.info(`Erasure request processed (anonymized) for patient: ${patientId}`);

      return {
        status: 'COMPLETED',
        action: 'ANONYMIZED',
        message: 'Patient data has been anonymized while maintaining clinical record integrity',
      };
    });
  } catch (error) {
    logger.error('Error processing erasure request:', error);
    throw error;
  }
};

/**
 * Update consent preferences
 */
export const updateConsent = async (organizationId, patientId, consentData) => {
  const { consent_sms, consent_email, consent_marketing, consent_data_storage } = consentData;

  const updates = [];
  const params = [patientId, organizationId];
  let paramIndex = 3;

  if (consent_sms !== undefined) {
    updates.push(`consent_sms = $${paramIndex}`);
    params.push(consent_sms);
    paramIndex++;
  }

  if (consent_email !== undefined) {
    updates.push(`consent_email = $${paramIndex}`);
    params.push(consent_email);
    paramIndex++;
  }

  if (consent_marketing !== undefined) {
    updates.push(`consent_marketing = $${paramIndex}`);
    params.push(consent_marketing);
    paramIndex++;
  }

  if (consent_data_storage !== undefined) {
    updates.push(`consent_data_storage = $${paramIndex}`);
    params.push(consent_data_storage);
    paramIndex++;
  }

  if (updates.length === 0) {
    throw new Error('No consent fields to update');
  }

  const result = await query(
    `UPDATE patients
     SET ${updates.join(', ')}, consent_date = NOW(), updated_at = NOW()
     WHERE id = $1 AND organization_id = $2
     RETURNING *`,
    params
  );

  if (result.rows.length === 0) {
    throw new Error('Patient not found');
  }

  logger.info(`Consent updated for patient: ${patientId}`);
  return result.rows[0];
};

/**
 * Get consent audit trail
 */
export const getConsentAuditTrail = async (organizationId, patientId) => {
  const result = await query(
    `SELECT
      created_at,
      action,
      changes,
      user_email,
      ip_address
    FROM audit_logs
    WHERE organization_id = $1
      AND resource_type = 'PATIENT'
      AND resource_id = $2
      AND (changes->>'consent_sms' IS NOT NULL
           OR changes->>'consent_email' IS NOT NULL
           OR changes->>'consent_marketing' IS NOT NULL
           OR changes->>'consent_data_storage' IS NOT NULL)
    ORDER BY created_at DESC`,
    [organizationId, patientId]
  );

  return result.rows;
};

/**
 * Update GDPR request status
 */
export const updateGDPRRequestStatus = async (organizationId, requestId, status, response = '') => {
  const result = await query(
    `UPDATE gdpr_requests
     SET status = $1, response = $2, completed_at = CASE WHEN $1 IN ('COMPLETED', 'REJECTED') THEN NOW() ELSE NULL END, updated_at = NOW()
     WHERE id = $3 AND organization_id = $4
     RETURNING *`,
    [status, response, requestId, organizationId]
  );

  if (result.rows.length === 0) {
    throw new Error('GDPR request not found');
  }

  logger.info(`GDPR request ${requestId} status updated to: ${status}`);
  return result.rows[0];
};

export default {
  createGDPRRequest,
  getAllGDPRRequests,
  processDataAccessRequest,
  processDataPortabilityRequest,
  processErasureRequest,
  updateConsent,
  getConsentAuditTrail,
  updateGDPRRequestStatus,
};
