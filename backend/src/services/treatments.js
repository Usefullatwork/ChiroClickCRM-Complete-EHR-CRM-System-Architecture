/**
 * Treatment Codes Service
 * Norwegian Takster (treatment codes) management
 */

import { query } from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Get all treatment codes
 */
export const getAllTreatmentCodes = async () => {
  try {
    const result = await query(
      `SELECT *
       FROM treatment_codes
       WHERE is_active = true
       ORDER BY commonly_used DESC, code ASC`,
      []
    );

    return result.rows;
  } catch (error) {
    logger.error('Error getting all treatment codes:', error);
    throw error;
  }
};

/**
 * Get commonly used treatment codes
 */
export const getCommonTreatmentCodes = async () => {
  try {
    const result = await query(
      `SELECT *
       FROM treatment_codes
       WHERE commonly_used = true AND is_active = true
       ORDER BY usage_count DESC, code ASC`,
      []
    );

    return result.rows;
  } catch (error) {
    logger.error('Error getting common treatment codes:', error);
    throw error;
  }
};

/**
 * Get treatment code by code
 */
export const getTreatmentCode = async (code) => {
  try {
    const result = await query(
      'SELECT * FROM treatment_codes WHERE code = $1',
      [code]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    logger.error('Error getting treatment code:', error);
    throw error;
  }
};

/**
 * Search treatment codes
 */
export const searchTreatmentCodes = async (searchTerm, limit = 10) => {
  try {
    const result = await query(
      `SELECT *
       FROM treatment_codes
       WHERE (code ILIKE $1 OR description ILIKE $1 OR description_en ILIKE $1)
         AND is_active = true
       ORDER BY commonly_used DESC, usage_count DESC, code ASC
       LIMIT $2`,
      [`%${searchTerm}%`, limit]
    );

    return result.rows;
  } catch (error) {
    logger.error('Error searching treatment codes:', error);
    throw error;
  }
};

/**
 * Increment usage count
 */
export const incrementTreatmentUsageCount = async (code) => {
  try {
    await query(
      'UPDATE treatment_codes SET usage_count = usage_count + 1 WHERE code = $1',
      [code]
    );

    logger.debug('Incremented treatment usage count for code:', code);
  } catch (error) {
    logger.error('Error incrementing treatment usage count:', error);
    // Don't throw - non-critical
  }
};

/**
 * Calculate price for treatments
 */
export const calculateTreatmentPrice = async (treatmentCodes) => {
  try {
    if (!treatmentCodes || treatmentCodes.length === 0) {
      return {
        grossAmount: 0,
        insuranceAmount: 0,
        patientAmount: 0
      };
    }

    const placeholders = treatmentCodes.map((_, i) => `$${i + 1}`).join(',');

    const result = await query(
      `SELECT
        SUM(default_price) as gross,
        SUM(insurance_reimbursement) as insurance
       FROM treatment_codes
       WHERE code IN (${placeholders})`,
      treatmentCodes
    );

    const gross = parseFloat(result.rows[0].gross) || 0;
    const insurance = parseFloat(result.rows[0].insurance) || 0;
    const patient = gross - insurance;

    return {
      grossAmount: gross,
      insuranceAmount: insurance,
      patientAmount: patient
    };
  } catch (error) {
    logger.error('Error calculating treatment price:', error);
    throw error;
  }
};

/**
 * Get treatment statistics for organization
 */
export const getTreatmentStatistics = async (organizationId, options = {}) => {
  const {
    startDate = null,
    endDate = null,
    limit = 10
  } = options;

  try {
    let whereClause = 'WHERE fm.organization_id = $1';
    const params = [organizationId];
    let paramIndex = 2;

    if (startDate) {
      params.push(startDate);
      whereClause += ` AND fm.created_at >= $${paramIndex}`;
      paramIndex++;
    }

    if (endDate) {
      params.push(endDate);
      whereClause += ` AND fm.created_at <= $${paramIndex}`;
      paramIndex++;
    }

    params.push(limit);

    const result = await query(
      `SELECT
        unnest(service_codes) as code,
        COUNT(*) as count,
        SUM(gross_amount) as total_revenue
      FROM financial_metrics fm
      ${whereClause}
        AND service_codes IS NOT NULL
        AND array_length(service_codes, 1) > 0
      GROUP BY code
      ORDER BY count DESC
      LIMIT $${paramIndex}`,
      params
    );

    // Get descriptions for the codes
    const treatments = result.rows;
    for (const item of treatments) {
      const codeResult = await query(
        'SELECT description FROM treatment_codes WHERE code = $1',
        [item.code]
      );
      if (codeResult.rows.length > 0) {
        item.description = codeResult.rows[0].description;
      }
    }

    return treatments;
  } catch (error) {
    logger.error('Error getting treatment statistics:', error);
    throw error;
  }
};

export default {
  getAllTreatmentCodes,
  getCommonTreatmentCodes,
  getTreatmentCode,
  searchTreatmentCodes,
  incrementTreatmentUsageCount,
  calculateTreatmentPrice,
  getTreatmentStatistics
};
