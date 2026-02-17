/**
 * Treatment Codes Service
 * Norwegian Takster (treatment codes) management
 */

import { query } from '../config/database.js';
import logger from '../utils/logger.js';
import cache, { CacheKeys } from '../utils/cache.js';

/**
 * Get all treatment codes (cached for 10 minutes)
 */
export const getAllTreatmentCodes = async () => {
  const cacheKey = CacheKeys.treatmentCodesList();

  return cache.getOrSet(
    cacheKey,
    async () => {
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
    },
    600
  );
};

/**
 * Get commonly used treatment codes (cached for 10 minutes)
 */
export const getCommonTreatmentCodes = async () => {
  const cacheKey = 'treatment:list:common';

  return cache.getOrSet(
    cacheKey,
    async () => {
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
    },
    600
  );
};

/**
 * Get treatment code by code
 */
export const getTreatmentCode = async (code) => {
  try {
    const result = await query('SELECT * FROM treatment_codes WHERE code = $1', [code]);

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
    await query('UPDATE treatment_codes SET usage_count = usage_count + 1 WHERE code = $1', [code]);

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
        patientAmount: 0,
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
      patientAmount: patient,
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
  const { startDate = null, endDate = null, limit = 10 } = options;

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

    // Get treatment statistics with descriptions in ONE query
    const result = await query(
      `SELECT
        code_usage.code,
        code_usage.count,
        code_usage.total_revenue,
        tc.description
      FROM (
        SELECT
          unnest(service_codes) as code,
          COUNT(*) as count,
          SUM(gross_amount) as total_revenue
        FROM financial_metrics fm
        ${whereClause}
          AND service_codes IS NOT NULL
          AND array_length(service_codes, 1) > 0
        GROUP BY code
      ) code_usage
      LEFT JOIN treatment_codes tc ON tc.code = code_usage.code
      ORDER BY code_usage.count DESC
      LIMIT $${paramIndex}`,
      params
    );

    return result.rows;
  } catch (error) {
    logger.error('Error getting treatment statistics:', error);
    throw error;
  }
};

/**
 * Map treatment data into the encounter's plan section.
 * Merges treatment descriptions, exercises, advice, and follow-up into the plan.
 *
 * @param {object} existingPlan - Current plan section of the encounter
 * @param {object} treatmentData - Incoming treatment data
 * @returns {object} Updated plan section
 */
export const mapTreatmentsToPlan = (existingPlan, treatmentData) => {
  const plan = { ...existingPlan };

  if (treatmentData.treatment_description) {
    plan.treatment = treatmentData.treatment_description;
  }

  if (treatmentData.treatments && treatmentData.treatments.length > 0) {
    const treatmentDescriptions = treatmentData.treatments
      .map((t) => {
        let desc = t.description || t.code || '';
        if (t.region) {
          desc += ` (${t.region})`;
        }
        if (t.notes) {
          desc += ` - ${t.notes}`;
        }
        return desc;
      })
      .filter(Boolean);

    plan.treatments_performed = [
      ...(existingPlan.treatments_performed || []),
      ...treatmentDescriptions,
    ];
  }

  if (treatmentData.exercises) {
    plan.exercises = treatmentData.exercises;
  }
  if (treatmentData.advice) {
    plan.advice = treatmentData.advice;
  }
  if (treatmentData.follow_up) {
    plan.follow_up = treatmentData.follow_up;
  }
  if (treatmentData.referral) {
    plan.referral = treatmentData.referral;
  }

  return plan;
};

export default {
  getAllTreatmentCodes,
  getCommonTreatmentCodes,
  getTreatmentCode,
  searchTreatmentCodes,
  incrementTreatmentUsageCount,
  calculateTreatmentPrice,
  getTreatmentStatistics,
  mapTreatmentsToPlan,
};
