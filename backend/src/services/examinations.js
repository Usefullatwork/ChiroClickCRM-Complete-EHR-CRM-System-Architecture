/**
 * Structured Examination Service
 * Manages examination protocols and findings
 */

import { query } from '../config/database.js';
import logger from '../config/logger.js';

// ============================================================================
// EXAMINATION PROTOCOLS
// ============================================================================

/**
 * Get all unique body regions
 */
export const getBodyRegions = async (language = 'NO') => {
  const sql = `
    SELECT DISTINCT body_region
    FROM examination_protocols
    WHERE language = $1
      AND is_system = true
    ORDER BY body_region
  `;

  const result = await query(sql, [language]);
  return result.rows.map(row => row.body_region);
};

/**
 * Get all unique categories
 */
export const getCategories = async (language = 'NO') => {
  const sql = `
    SELECT DISTINCT category
    FROM examination_protocols
    WHERE language = $1
      AND is_system = true
    ORDER BY category
  `;

  const result = await query(sql, [language]);
  return result.rows.map(row => row.category);
};

/**
 * Get all examination protocols
 */
export const getAllProtocols = async (options = {}) => {
  const {
    bodyRegion,
    category,
    language = 'NO',
    search,
    redFlagsOnly = false,
    limit = 100,
    offset = 0
  } = options;

  let sql = `
    SELECT *
    FROM examination_protocols
    WHERE language = $1
      AND is_system = true
  `;

  const params = [language];
  let paramCount = 1;

  if (bodyRegion) {
    paramCount++;
    sql += ` AND body_region = $${paramCount}`;
    params.push(bodyRegion);
  }

  if (category) {
    paramCount++;
    sql += ` AND category = $${paramCount}`;
    params.push(category);
  }

  if (redFlagsOnly) {
    sql += ` AND is_red_flag = true`;
  }

  if (search) {
    paramCount++;
    sql += ` AND (
      to_tsvector('norwegian', COALESCE(test_name, '') || ' ' || COALESCE(test_name_no, '') || ' ' || COALESCE(description_no, ''))
      @@ plainto_tsquery('norwegian', $${paramCount})
      OR test_name ILIKE $${paramCount + 1}
      OR test_name_no ILIKE $${paramCount + 1}
    )`;
    params.push(search);
    params.push(`%${search}%`);
    paramCount += 1;
  }

  sql += ` ORDER BY
    body_region,
    category,
    display_order,
    test_name_no
  `;

  paramCount++;
  sql += ` LIMIT $${paramCount}`;
  params.push(limit);

  paramCount++;
  sql += ` OFFSET $${paramCount}`;
  params.push(offset);

  const result = await query(sql, params);
  return {
    protocols: result.rows,
    total: result.rows.length
  };
};

/**
 * Get examination protocol by ID
 */
export const getProtocolById = async (id) => {
  const sql = `
    SELECT *
    FROM examination_protocols
    WHERE id = $1
  `;

  const result = await query(sql, [id]);

  if (result.rows.length === 0) {
    throw new Error('Protocol not found');
  }

  return result.rows[0];
};

/**
 * Search examination protocols using full-text search
 */
export const searchProtocols = async (searchQuery, language = 'NO', limit = 50) => {
  const sql = `
    SELECT *
    FROM examination_protocols
    WHERE language = $1
      AND is_system = true
      AND (
        to_tsvector('norwegian', COALESCE(test_name, '') || ' ' || COALESCE(test_name_no, '') || ' ' || COALESCE(description_no, ''))
        @@ plainto_tsquery('norwegian', $2)
        OR test_name ILIKE $3
        OR test_name_no ILIKE $3
      )
    ORDER BY
      is_red_flag DESC,
      body_region,
      category,
      display_order
    LIMIT $4
  `;

  const result = await query(sql, [language, searchQuery, `%${searchQuery}%`, limit]);
  return result.rows;
};

/**
 * Get protocols by body region grouped by category
 */
export const getProtocolsByRegion = async (bodyRegion, language = 'NO') => {
  const sql = `
    SELECT *
    FROM examination_protocols
    WHERE body_region = $1
      AND language = $2
      AND is_system = true
    ORDER BY category, display_order, test_name_no
  `;

  const result = await query(sql, [bodyRegion, language]);

  // Group by category
  const grouped = {};
  result.rows.forEach(protocol => {
    if (!grouped[protocol.category]) {
      grouped[protocol.category] = [];
    }
    grouped[protocol.category].push(protocol);
  });

  return grouped;
};

/**
 * Get protocols by category
 */
export const getProtocolsByCategory = async (category, language = 'NO') => {
  const sql = `
    SELECT *
    FROM examination_protocols
    WHERE category = $1
      AND language = $2
      AND is_system = true
    ORDER BY body_region, display_order, test_name_no
  `;

  const result = await query(sql, [category, language]);
  return result.rows;
};

// ============================================================================
// EXAMINATION FINDINGS
// ============================================================================

/**
 * Get findings by encounter
 */
export const getFindingsByEncounter = async (organizationId, encounterId) => {
  const sql = `
    SELECT
      f.*,
      p.test_name,
      p.test_name_no,
      p.description_no,
      p.positive_indication_no
    FROM structured_examination_findings f
    LEFT JOIN examination_protocols p ON f.protocol_id = p.id
    INNER JOIN clinical_encounters e ON f.encounter_id = e.id
    INNER JOIN patients pt ON e.patient_id = pt.id
    WHERE f.encounter_id = $1
      AND pt.organization_id = $2
    ORDER BY f.body_region, f.category, f.created_at
  `;

  const result = await query(sql, [encounterId, organizationId]);
  return result.rows;
};

/**
 * Get finding by ID
 */
export const getFindingById = async (organizationId, id) => {
  const sql = `
    SELECT f.*
    FROM structured_examination_findings f
    INNER JOIN clinical_encounters e ON f.encounter_id = e.id
    INNER JOIN patients pt ON e.patient_id = pt.id
    WHERE f.id = $1
      AND pt.organization_id = $2
  `;

  const result = await query(sql, [id, organizationId]);

  if (result.rows.length === 0) {
    throw new Error('Finding not found');
  }

  return result.rows[0];
};

/**
 * Create new examination finding
 */
export const createFinding = async (organizationId, userId, findingData) => {
  const {
    encounter_id,
    protocol_id,
    body_region,
    category,
    test_name,
    result,
    laterality,
    severity,
    findings_text,
    clinician_notes,
    measurement_value,
    measurement_unit,
    pain_score,
    pain_location
  } = findingData;

  // Verify encounter belongs to organization
  const verifyResult = await query(`
    SELECT e.id
    FROM clinical_encounters e
    INNER JOIN patients p ON e.patient_id = p.id
    WHERE e.id = $1 AND p.organization_id = $2
  `, [encounter_id, organizationId]);

  if (verifyResult.rows.length === 0) {
    throw new Error('Encounter not found or access denied');
  }

  const sql = `
    INSERT INTO structured_examination_findings (
      encounter_id,
      protocol_id,
      body_region,
      category,
      test_name,
      result,
      laterality,
      severity,
      findings_text,
      clinician_notes,
      measurement_value,
      measurement_unit,
      pain_score,
      pain_location,
      examined_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    RETURNING *
  `;

  const result = await query(sql, [
    encounter_id,
    protocol_id,
    body_region,
    category,
    test_name,
    result,
    laterality,
    severity,
    findings_text,
    clinician_notes,
    measurement_value,
    measurement_unit,
    pain_score,
    pain_location,
    userId
  ]);

  return result.rows[0];
};

/**
 * Update examination finding
 */
export const updateFinding = async (organizationId, id, updateData) => {
  // Verify finding belongs to organization
  const verifyResult = await query(`
    SELECT f.id
    FROM structured_examination_findings f
    INNER JOIN clinical_encounters e ON f.encounter_id = e.id
    INNER JOIN patients p ON e.patient_id = p.id
    WHERE f.id = $1 AND p.organization_id = $2
  `, [id, organizationId]);

  if (verifyResult.rows.length === 0) {
    throw new Error('Finding not found or access denied');
  }

  const fields = [];
  const values = [];
  let paramCount = 0;

  const allowedFields = [
    'result', 'laterality', 'severity', 'findings_text', 'clinician_notes',
    'measurement_value', 'measurement_unit', 'pain_score', 'pain_location'
  ];

  allowedFields.forEach(field => {
    if (updateData[field] !== undefined) {
      paramCount++;
      fields.push(`${field} = $${paramCount}`);
      values.push(updateData[field]);
    }
  });

  if (fields.length === 0) {
    throw new Error('No valid fields to update');
  }

  paramCount++;
  values.push(id);

  const sql = `
    UPDATE structured_examination_findings
    SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
    WHERE id = $${paramCount}
    RETURNING *
  `;

  const result = await query(sql, values);
  return result.rows[0];
};

/**
 * Delete examination finding
 */
export const deleteFinding = async (organizationId, id) => {
  // Verify finding belongs to organization
  const verifyResult = await query(`
    SELECT f.id
    FROM structured_examination_findings f
    INNER JOIN clinical_encounters e ON f.encounter_id = e.id
    INNER JOIN patients p ON e.patient_id = p.id
    WHERE f.id = $1 AND p.organization_id = $2
  `, [id, organizationId]);

  if (verifyResult.rows.length === 0) {
    throw new Error('Finding not found or access denied');
  }

  await query('DELETE FROM structured_examination_findings WHERE id = $1', [id]);
};

/**
 * Create multiple findings in batch
 */
export const createBatchFindings = async (organizationId, userId, findingsArray) => {
  const results = [];

  for (const findingData of findingsArray) {
    try {
      const finding = await createFinding(organizationId, userId, findingData);
      results.push({ success: true, finding });
    } catch (error) {
      logger.error('Error creating finding in batch:', error);
      results.push({ success: false, error: error.message, data: findingData });
    }
  }

  return results;
};

// ============================================================================
// EXAMINATION SUMMARIES & RED FLAGS
// ============================================================================

/**
 * Get examination summary for encounter
 */
export const getExaminationSummary = async (organizationId, encounterId) => {
  // Verify encounter belongs to organization
  const verifyResult = await query(`
    SELECT e.id
    FROM clinical_encounters e
    INNER JOIN patients p ON e.patient_id = p.id
    WHERE e.id = $1 AND p.organization_id = $2
  `, [encounterId, organizationId]);

  if (verifyResult.rows.length === 0) {
    throw new Error('Encounter not found or access denied');
  }

  const sql = `SELECT generate_examination_summary($1) as summary`;
  const result = await query(sql, [encounterId]);

  return result.rows[0]?.summary || '';
};

/**
 * Get red flags for encounter
 */
export const getRedFlags = async (organizationId, encounterId) => {
  // Verify encounter belongs to organization
  const verifyResult = await query(`
    SELECT e.id
    FROM clinical_encounters e
    INNER JOIN patients p ON e.patient_id = p.id
    WHERE e.id = $1 AND p.organization_id = $2
  `, [encounterId, organizationId]);

  if (verifyResult.rows.length === 0) {
    throw new Error('Encounter not found or access denied');
  }

  const sql = `SELECT * FROM check_examination_red_flags($1)`;
  const result = await query(sql, [encounterId]);

  return result.rows;
};

// ============================================================================
// EXAMINATION TEMPLATE SETS
// ============================================================================

/**
 * Get all template sets
 */
export const getAllTemplateSets = async (language = 'NO') => {
  const sql = `
    SELECT *
    FROM examination_template_sets
    WHERE language = $1
      AND is_system = true
    ORDER BY usage_count DESC, template_name_no
  `;

  const result = await query(sql, [language]);
  return result.rows;
};

/**
 * Get template sets by chief complaint
 */
export const getTemplateSetsByComplaint = async (complaint, language = 'NO') => {
  const sql = `
    SELECT *
    FROM examination_template_sets
    WHERE (chief_complaint = $1 OR chief_complaint_no = $1)
      AND language = $2
      AND is_system = true
    ORDER BY usage_count DESC
  `;

  const result = await query(sql, [complaint, language]);
  return result.rows;
};

/**
 * Get template set by ID
 */
export const getTemplateSetById = async (id) => {
  const sql = `SELECT * FROM examination_template_sets WHERE id = $1`;
  const result = await query(sql, [id]);

  if (result.rows.length === 0) {
    throw new Error('Template set not found');
  }

  return result.rows[0];
};

/**
 * Create new template set
 */
export const createTemplateSet = async (setData) => {
  const {
    template_name,
    template_name_no,
    description,
    description_no,
    chief_complaint,
    chief_complaint_no,
    protocol_ids,
    language = 'NO'
  } = setData;

  const sql = `
    INSERT INTO examination_template_sets (
      template_name,
      template_name_no,
      description,
      description_no,
      chief_complaint,
      chief_complaint_no,
      protocol_ids,
      language,
      is_system
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false)
    RETURNING *
  `;

  const result = await query(sql, [
    template_name,
    template_name_no,
    description,
    description_no,
    chief_complaint,
    chief_complaint_no,
    protocol_ids,
    language
  ]);

  return result.rows[0];
};

/**
 * Increment template set usage count
 */
export const incrementTemplateSetUsage = async (id) => {
  const sql = `
    UPDATE examination_template_sets
    SET usage_count = usage_count + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
  `;

  await query(sql, [id]);
};
