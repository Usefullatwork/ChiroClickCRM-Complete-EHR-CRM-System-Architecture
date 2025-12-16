/**
 * Full-Text Search Service
 * Provides advanced search capabilities using PostgreSQL tsvector
 */

import { query } from '../config/database.js';
import hybridCache, { CacheKeys } from '../utils/hybridCache.js';
import logger from '../utils/logger.js';

/**
 * Normalize search query for PostgreSQL full-text search
 * Handles Norwegian characters and creates proper tsquery
 */
const normalizeSearchQuery = (searchTerm) => {
  if (!searchTerm || searchTerm.trim().length === 0) {
    return null;
  }

  // Clean and normalize the search term
  let normalized = searchTerm
    .trim()
    .toLowerCase()
    // Replace Norwegian characters with alternatives for broader matching
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'o')
    .replace(/å/g, 'a')
    // Remove special characters except spaces
    .replace(/[^\w\s]/g, '')
    // Replace multiple spaces with single space
    .replace(/\s+/g, ' ');

  // Split into words and create OR query for flexibility
  const words = normalized.split(' ').filter((w) => w.length > 0);

  if (words.length === 0) {
    return null;
  }

  // Create prefix matching query (word:* for partial matching)
  return words.map((word) => `${word}:*`).join(' | ');
};

/**
 * Search patients using full-text search
 */
export const searchPatients = async (organizationId, searchTerm, options = {}) => {
  const { limit = 20, offset = 0, status = 'ACTIVE', includeInactive = false } = options;

  const tsQuery = normalizeSearchQuery(searchTerm);

  if (!tsQuery) {
    return { patients: [], total: 0 };
  }

  // Check cache first
  const cacheKey = CacheKeys.patientSearch(organizationId, `${searchTerm}:${status}:${offset}:${limit}`);
  const cached = await hybridCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // Build status filter
    let statusFilter = '';
    const params = [organizationId, tsQuery, limit, offset];

    if (!includeInactive) {
      statusFilter = status ? 'AND status = $5' : "AND status != 'INACTIVE'";
      if (status) params.push(status);
    }

    // Full-text search with ranking
    const result = await query(
      `SELECT
        id, solvit_id, first_name, last_name, date_of_birth,
        email, phone, status, category, last_visit_date,
        ts_rank(search_vector, to_tsquery('simple', $2)) as rank,
        ts_headline('simple',
          COALESCE(first_name, '') || ' ' || COALESCE(last_name, '') || ' ' || COALESCE(email, ''),
          to_tsquery('simple', $2),
          'StartSel=<mark>, StopSel=</mark>, MaxWords=35, MinWords=15'
        ) as headline
      FROM patients
      WHERE organization_id = $1
        AND search_vector @@ to_tsquery('simple', $2)
        ${statusFilter}
      ORDER BY rank DESC, last_name ASC
      LIMIT $3 OFFSET $4`,
      params
    );

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM patients
       WHERE organization_id = $1
       AND search_vector @@ to_tsquery('simple', $2)
       ${statusFilter}`,
      status && !includeInactive ? [organizationId, tsQuery, status] : [organizationId, tsQuery]
    );

    const response = {
      patients: result.rows,
      total: parseInt(countResult.rows[0].count),
      query: searchTerm,
    };

    // Cache for 2 minutes
    await hybridCache.set(cacheKey, response, 120);

    return response;
  } catch (error) {
    logger.error('Patient search error:', error);

    // Fallback to ILIKE search if full-text fails
    return fallbackPatientSearch(organizationId, searchTerm, options);
  }
};

/**
 * Fallback search using ILIKE (for when full-text search isn't available)
 */
const fallbackPatientSearch = async (organizationId, searchTerm, options = {}) => {
  const { limit = 20, offset = 0, status = 'ACTIVE' } = options;

  const searchPattern = `%${searchTerm}%`;

  const result = await query(
    `SELECT id, solvit_id, first_name, last_name, date_of_birth,
            email, phone, status, category, last_visit_date
     FROM patients
     WHERE organization_id = $1
       AND status = $4
       AND (
         first_name ILIKE $2 OR
         last_name ILIKE $2 OR
         email ILIKE $2 OR
         phone ILIKE $2 OR
         solvit_id ILIKE $2
       )
     ORDER BY last_name ASC
     LIMIT $3 OFFSET $5`,
    [organizationId, searchPattern, limit, status, offset]
  );

  return { patients: result.rows, total: result.rows.length, query: searchTerm, fallback: true };
};

/**
 * Search diagnosis codes using full-text search
 */
export const searchDiagnosis = async (searchTerm, options = {}) => {
  const { limit = 30, system = null } = options;

  const tsQuery = normalizeSearchQuery(searchTerm);

  if (!tsQuery) {
    return { codes: [], total: 0 };
  }

  // Check cache
  const cacheKey = CacheKeys.diagnosisSearch(`${searchTerm}:${system}:${limit}`);
  const cached = await hybridCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    let systemFilter = '';
    const params = [tsQuery, limit];

    if (system) {
      systemFilter = 'AND system = $3';
      params.push(system);
    }

    const result = await query(
      `SELECT
        code, description_no, description_en, system, category,
        ts_rank(search_vector, to_tsquery('simple', $1)) as rank,
        ts_headline('simple',
          COALESCE(description_no, '') || ' ' || COALESCE(description_en, ''),
          to_tsquery('simple', $1),
          'StartSel=<mark>, StopSel=</mark>, MaxWords=35'
        ) as headline
      FROM diagnosis_codes
      WHERE search_vector @@ to_tsquery('simple', $1)
        ${systemFilter}
      ORDER BY
        CASE WHEN code ILIKE $1 || '%' THEN 0 ELSE 1 END,
        rank DESC,
        code ASC
      LIMIT $2`,
      params
    );

    const response = {
      codes: result.rows,
      total: result.rows.length,
      query: searchTerm,
    };

    // Cache for 1 hour (diagnosis codes don't change often)
    await hybridCache.set(cacheKey, response, 3600);

    return response;
  } catch (error) {
    logger.error('Diagnosis search error:', error);

    // Fallback to ILIKE
    return fallbackDiagnosisSearch(searchTerm, options);
  }
};

/**
 * Fallback diagnosis search
 */
const fallbackDiagnosisSearch = async (searchTerm, options = {}) => {
  const { limit = 30, system = null } = options;

  const searchPattern = `%${searchTerm}%`;

  let systemFilter = '';
  const params = [searchPattern, limit];

  if (system) {
    systemFilter = 'AND system = $3';
    params.push(system);
  }

  const result = await query(
    `SELECT code, description_no, description_en, system, category
     FROM diagnosis_codes
     WHERE (
       code ILIKE $1 OR
       description_no ILIKE $1 OR
       description_en ILIKE $1
     )
     ${systemFilter}
     ORDER BY
       CASE WHEN code ILIKE $1 THEN 0 ELSE 1 END,
       code ASC
     LIMIT $2`,
    params
  );

  return { codes: result.rows, total: result.rows.length, query: searchTerm, fallback: true };
};

/**
 * Search clinical encounters (SOAP notes) using full-text search
 */
export const searchEncounters = async (organizationId, searchTerm, options = {}) => {
  const { limit = 20, offset = 0, patientId = null, practitionerId = null } = options;

  const tsQuery = normalizeSearchQuery(searchTerm);

  if (!tsQuery) {
    return { encounters: [], total: 0 };
  }

  try {
    let filters = '';
    const params = [organizationId, tsQuery, limit, offset];
    let paramIndex = 5;

    if (patientId) {
      filters += ` AND ce.patient_id = $${paramIndex}`;
      params.push(patientId);
      paramIndex++;
    }

    if (practitionerId) {
      filters += ` AND ce.practitioner_id = $${paramIndex}`;
      params.push(practitionerId);
    }

    const result = await query(
      `SELECT
        ce.id, ce.patient_id, ce.encounter_date, ce.encounter_type,
        ce.icpc_codes, ce.is_signed,
        p.first_name as patient_first_name, p.last_name as patient_last_name,
        ts_rank(ce.search_vector, to_tsquery('simple', $2)) as rank,
        ts_headline('simple',
          COALESCE(ce.subjective::text, '') || ' ' || COALESCE(ce.assessment::text, ''),
          to_tsquery('simple', $2),
          'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=20'
        ) as headline
      FROM clinical_encounters ce
      JOIN patients p ON p.id = ce.patient_id
      WHERE ce.organization_id = $1
        AND ce.search_vector @@ to_tsquery('simple', $2)
        ${filters}
      ORDER BY rank DESC, ce.encounter_date DESC
      LIMIT $3 OFFSET $4`,
      params
    );

    return {
      encounters: result.rows,
      total: result.rows.length,
      query: searchTerm,
    };
  } catch (error) {
    logger.error('Encounter search error:', error);
    return { encounters: [], total: 0, error: 'Search failed' };
  }
};

/**
 * Global search across all entities
 */
export const globalSearch = async (organizationId, searchTerm, options = {}) => {
  const { limit = 10 } = options;

  const [patients, encounters] = await Promise.all([
    searchPatients(organizationId, searchTerm, { limit }),
    searchEncounters(organizationId, searchTerm, { limit }),
  ]);

  // Also search diagnosis codes (not org-specific)
  const diagnosis = await searchDiagnosis(searchTerm, { limit });

  return {
    patients: patients.patients.slice(0, limit),
    encounters: encounters.encounters.slice(0, limit),
    diagnosis: diagnosis.codes.slice(0, limit),
    query: searchTerm,
  };
};

/**
 * Suggest search completions (autocomplete)
 */
export const suggestCompletions = async (organizationId, prefix, options = {}) => {
  const { limit = 5, entity = 'patient' } = options;

  if (!prefix || prefix.length < 2) {
    return [];
  }

  const searchPattern = `${prefix}%`;

  try {
    if (entity === 'patient') {
      const result = await query(
        `SELECT DISTINCT
          CASE
            WHEN first_name ILIKE $2 THEN first_name
            WHEN last_name ILIKE $2 THEN last_name
            ELSE first_name || ' ' || last_name
          END as suggestion
        FROM patients
        WHERE organization_id = $1
          AND status = 'ACTIVE'
          AND (first_name ILIKE $2 OR last_name ILIKE $2)
        LIMIT $3`,
        [organizationId, searchPattern, limit]
      );
      return result.rows.map((r) => r.suggestion);
    }

    if (entity === 'diagnosis') {
      const result = await query(
        `SELECT DISTINCT code || ' - ' || description_no as suggestion
         FROM diagnosis_codes
         WHERE code ILIKE $1 OR description_no ILIKE $1
         LIMIT $2`,
        [searchPattern, limit]
      );
      return result.rows.map((r) => r.suggestion);
    }

    return [];
  } catch (error) {
    logger.error('Suggestion error:', error);
    return [];
  }
};

export default {
  searchPatients,
  searchDiagnosis,
  searchEncounters,
  globalSearch,
  suggestCompletions,
};
