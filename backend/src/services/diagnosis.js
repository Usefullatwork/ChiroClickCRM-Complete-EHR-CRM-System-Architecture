/**
 * Diagnosis Codes Service
 * ICPC-2 and ICD-10 code management
 */

import { query } from '../config/database.js';
import logger from '../utils/logger.js';
import cache, { CacheKeys } from '../utils/cache.js';

/**
 * Search diagnosis codes
 */
export const searchDiagnosisCodes = async (searchTerm, options = {}) => {
  const {
    system = null, // 'ICPC2' or 'ICD10'
    chapter = null, // 'L', 'N', etc.
    limit = 20,
  } = options;

  try {
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (searchTerm) {
      params.push(`%${searchTerm}%`);
      whereClause += ` AND (
        code ILIKE $${paramIndex} OR
        description_no ILIKE $${paramIndex} OR
        description_en ILIKE $${paramIndex}
      )`;
      paramIndex++;
    }

    if (system) {
      params.push(system);
      whereClause += ` AND system = $${paramIndex}`;
      paramIndex++;
    }

    if (chapter) {
      params.push(chapter);
      whereClause += ` AND chapter = $${paramIndex}`;
      paramIndex++;
    }

    params.push(limit);

    const result = await query(
      `SELECT *
       FROM diagnosis_codes
       ${whereClause}
       ORDER BY commonly_used DESC, usage_count DESC, code ASC
       LIMIT $${paramIndex}`,
      params
    );

    return result.rows;
  } catch (error) {
    logger.error('Error searching diagnosis codes:', error);
    throw error;
  }
};

/**
 * Get commonly used diagnosis codes (cached for 10 minutes)
 */
export const getCommonDiagnosisCodes = async (system = null) => {
  const cacheKey = CacheKeys.diagnosisCodesList(system);

  return cache.getOrSet(
    cacheKey,
    async () => {
      try {
        let whereClause = 'WHERE commonly_used = true';
        const params = [];

        if (system) {
          params.push(system);
          whereClause += ` AND system = $1`;
        }

        const result = await query(
          `SELECT *
         FROM diagnosis_codes
         ${whereClause}
         ORDER BY usage_count DESC, code ASC
         LIMIT 30`,
          params
        );

        return result.rows;
      } catch (error) {
        logger.error('Error getting common diagnosis codes:', error);
        throw error;
      }
    },
    600
  );
};

/**
 * Get diagnosis code by code
 */
export const getDiagnosisCode = async (code) => {
  try {
    const result = await query('SELECT * FROM diagnosis_codes WHERE code = $1', [code]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    logger.error('Error getting diagnosis code:', error);
    throw error;
  }
};

/**
 * Get ICPC-2 codes for chiropractic (L & N chapters)
 */
export const getChiropracticCodes = async () => {
  try {
    const result = await query(
      `SELECT *
       FROM diagnosis_codes
       WHERE system = 'ICPC2' AND chapter IN ('L', 'N')
       ORDER BY commonly_used DESC, chapter, code`,
      []
    );

    // Group by chapter
    const grouped = {
      L: result.rows.filter((r) => r.chapter === 'L'),
      N: result.rows.filter((r) => r.chapter === 'N'),
    };

    return grouped;
  } catch (error) {
    logger.error('Error getting chiropractic codes:', error);
    throw error;
  }
};

/**
 * Get ICD-10 mapping for ICPC-2 code
 */
export const getICD10Mapping = async (icpc2Code) => {
  try {
    const result = await query(
      `SELECT icd10_mapping FROM diagnosis_codes WHERE code = $1 AND system = 'ICPC2'`,
      [icpc2Code]
    );

    if (result.rows.length === 0 || !result.rows[0].icd10_mapping) {
      return null;
    }

    const icd10Code = result.rows[0].icd10_mapping;

    // Get full ICD-10 details
    const icd10Result = await query(
      `SELECT * FROM diagnosis_codes WHERE code = $1 AND system = 'ICD10'`,
      [icd10Code]
    );

    return icd10Result.rows[0] || null;
  } catch (error) {
    logger.error('Error getting ICD-10 mapping:', error);
    throw error;
  }
};

/**
 * Increment usage count for a diagnosis code
 */
export const incrementUsageCount = async (code) => {
  try {
    await query('UPDATE diagnosis_codes SET usage_count = usage_count + 1 WHERE code = $1', [code]);

    logger.debug('Incremented usage count for code:', code);
  } catch (error) {
    logger.error('Error incrementing usage count:', error);
    // Don't throw - this is a non-critical operation
  }
};

/**
 * Get diagnosis statistics for organization
 */
export const getDiagnosisStatistics = async (organizationId, options = {}) => {
  const { startDate = null, endDate = null, limit = 10 } = options;

  try {
    let whereClause = 'WHERE ce.organization_id = $1';
    const params = [organizationId];
    let paramIndex = 2;

    if (startDate) {
      params.push(startDate);
      whereClause += ` AND ce.encounter_date >= $${paramIndex}`;
      paramIndex++;
    }

    if (endDate) {
      params.push(endDate);
      whereClause += ` AND ce.encounter_date <= $${paramIndex}`;
      paramIndex++;
    }

    params.push(limit);

    // Get most common ICPC-2 codes with descriptions in ONE query
    const icpc2Result = await query(
      `SELECT
        code_usage.code,
        code_usage.count,
        dc.description_no as description
      FROM (
        SELECT
          unnest(icpc_codes) as code,
          COUNT(*) as count
        FROM clinical_encounters ce
        ${whereClause}
          AND icpc_codes IS NOT NULL
          AND array_length(icpc_codes, 1) > 0
        GROUP BY code
      ) code_usage
      LEFT JOIN diagnosis_codes dc ON dc.code = code_usage.code
      ORDER BY code_usage.count DESC
      LIMIT $${paramIndex}`,
      params
    );

    return {
      topDiagnoses: icpc2Result.rows,
      totalEncounters: icpc2Result.rows.reduce((sum, item) => sum + parseInt(item.count), 0),
    };
  } catch (error) {
    logger.error('Error getting diagnosis statistics:', error);
    throw error;
  }
};

export default {
  searchDiagnosisCodes,
  getCommonDiagnosisCodes,
  getDiagnosisCode,
  getChiropracticCodes,
  getICD10Mapping,
  incrementUsageCount,
  getDiagnosisStatistics,
};
