/**
 * Clinical Templates Service
 * Manages reusable clinical text snippets for SOAP documentation
 */

import { query } from '../config/database.js';
import _logger from '../config/logger.js';

/**
 * Get all templates for an organization
 */
export const getAllTemplates = async (organizationId, options = {}) => {
  const {
    category,
    subcategory,
    soapSection,
    language = 'NO',
    favoritesOnly = false,
    search,
    limit = 100,
    offset = 0,
  } = options;

  let sql = `
    SELECT
      id,
      category,
      subcategory,
      template_name,
      template_text,
      language,
      soap_section,
      is_system,
      is_favorite,
      usage_count,
      created_at
    FROM clinical_templates
    WHERE (organization_id = $1 OR is_system = true)
      AND language = $2
  `;

  const params = [organizationId, language];
  let paramCount = 2;

  if (category) {
    paramCount++;
    sql += ` AND category = $${paramCount}`;
    params.push(category);
  }

  if (subcategory) {
    paramCount++;
    sql += ` AND subcategory = $${paramCount}`;
    params.push(subcategory);
  }

  if (soapSection) {
    paramCount++;
    sql += ` AND soap_section = $${paramCount}`;
    params.push(soapSection);
  }

  if (favoritesOnly) {
    sql += ` AND is_favorite = true`;
  }

  if (search) {
    paramCount++;
    sql += ` AND (
      to_tsvector('norwegian', template_name || ' ' || template_text)
      @@ plainto_tsquery('norwegian', $${paramCount})
      OR template_name ILIKE $${paramCount + 1}
      OR template_text ILIKE $${paramCount + 1}
    )`;
    params.push(search);
    params.push(`%${search}%`);
    paramCount += 2;
  }

  sql += ` ORDER BY
    is_favorite DESC,
    usage_count DESC,
    category,
    subcategory,
    template_name
  `;

  paramCount++;
  sql += ` LIMIT $${paramCount}`;
  params.push(limit);

  paramCount++;
  sql += ` OFFSET $${paramCount}`;
  params.push(offset);

  const result = await query(sql, params);

  // Get total count
  const countResult = await query(
    `SELECT COUNT(*) as total
     FROM clinical_templates
     WHERE (organization_id = $1 OR is_system = true)
       AND language = $2`,
    [organizationId, language]
  );

  return {
    templates: result.rows,
    total: parseInt(countResult.rows[0].total),
    limit,
    offset,
  };
};

/**
 * Get templates grouped by category
 */
export const getTemplatesByCategory = async (organizationId, language = 'NO') => {
  const result = await query(
    `SELECT
      category,
      subcategory,
      json_agg(
        json_build_object(
          'id', id,
          'name', template_name,
          'text', template_text,
          'soapSection', soap_section,
          'isFavorite', is_favorite,
          'usageCount', usage_count
        ) ORDER BY is_favorite DESC, usage_count DESC, template_name
      ) as templates
    FROM clinical_templates
    WHERE (organization_id = $1 OR is_system = true)
      AND language = $2
    GROUP BY category, subcategory
    ORDER BY category, subcategory`,
    [organizationId, language]
  );

  // Organize into nested structure
  const organized = {};
  result.rows.forEach((row) => {
    if (!organized[row.category]) {
      organized[row.category] = {};
    }
    organized[row.category][row.subcategory || 'General'] = row.templates;
  });

  return organized;
};

/**
 * Get template by ID
 */
export const getTemplateById = async (organizationId, templateId) => {
  const result = await query(
    `SELECT * FROM clinical_templates
     WHERE id = $1
       AND (organization_id = $2 OR is_system = true)`,
    [templateId, organizationId]
  );

  if (result.rows.length === 0) {
    throw new Error('Template not found');
  }

  return result.rows[0];
};

/**
 * Create new template
 */
export const createTemplate = async (organizationId, userId, templateData) => {
  const {
    category,
    subcategory,
    templateName,
    templateText,
    language = 'NO',
    soapSection,
    isFavorite = false,
  } = templateData;

  const result = await query(
    `INSERT INTO clinical_templates (
      organization_id,
      category,
      subcategory,
      template_name,
      template_text,
      language,
      soap_section,
      is_favorite,
      created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *`,
    [
      organizationId,
      category,
      subcategory,
      templateName,
      templateText,
      language,
      soapSection,
      isFavorite,
      userId,
    ]
  );

  return result.rows[0];
};

/**
 * Update template
 */
export const updateTemplate = async (organizationId, templateId, updates) => {
  const template = await getTemplateById(organizationId, templateId);

  if (template.is_system) {
    throw new Error('Cannot modify system templates');
  }

  if (template.organization_id !== organizationId) {
    throw new Error('Cannot modify templates from other organizations');
  }

  const { category, subcategory, templateName, templateText, soapSection, isFavorite } = updates;

  const result = await query(
    `UPDATE clinical_templates
     SET
       category = COALESCE($1, category),
       subcategory = COALESCE($2, subcategory),
       template_name = COALESCE($3, template_name),
       template_text = COALESCE($4, template_text),
       soap_section = COALESCE($5, soap_section),
       is_favorite = COALESCE($6, is_favorite)
     WHERE id = $7
     RETURNING *`,
    [category, subcategory, templateName, templateText, soapSection, isFavorite, templateId]
  );

  return result.rows[0];
};

/**
 * Delete template
 */
export const deleteTemplate = async (organizationId, templateId) => {
  const template = await getTemplateById(organizationId, templateId);

  if (template.is_system) {
    throw new Error('Cannot delete system templates');
  }

  if (template.organization_id !== organizationId) {
    throw new Error('Cannot delete templates from other organizations');
  }

  await query(`DELETE FROM clinical_templates WHERE id = $1`, [templateId]);

  return { message: 'Template deleted successfully' };
};

/**
 * Toggle favorite status
 */
export const toggleFavorite = async (organizationId, templateId) => {
  const result = await query(
    `UPDATE clinical_templates
     SET is_favorite = NOT is_favorite
     WHERE id = $1
       AND (organization_id = $2 OR is_system = true)
     RETURNING *`,
    [templateId, organizationId]
  );

  if (result.rows.length === 0) {
    throw new Error('Template not found');
  }

  return result.rows[0];
};

/**
 * Increment usage count
 */
export const incrementUsage = async (templateId) => {
  await query(`SELECT increment_template_usage($1)`, [templateId]);
};

/**
 * Get template categories
 */
export const getCategories = async (organizationId, language = 'NO') => {
  const result = await query(
    `SELECT DISTINCT
      category,
      COUNT(*) as template_count
    FROM clinical_templates
    WHERE (organization_id = $1 OR is_system = true)
      AND language = $2
    GROUP BY category
    ORDER BY category`,
    [organizationId, language]
  );

  return result.rows;
};

/**
 * Search templates
 */
export const searchTemplates = async (organizationId, searchQuery, language = 'NO') => {
  const result = await query(
    `SELECT
      id,
      category,
      subcategory,
      template_name,
      template_text,
      soap_section,
      is_favorite,
      usage_count,
      ts_rank(
        to_tsvector('norwegian', template_name || ' ' || template_text),
        plainto_tsquery('norwegian', $3)
      ) as rank
    FROM clinical_templates
    WHERE (organization_id = $1 OR is_system = true)
      AND language = $2
      AND (
        to_tsvector('norwegian', template_name || ' ' || template_text)
        @@ plainto_tsquery('norwegian', $3)
        OR template_name ILIKE $4
        OR template_text ILIKE $4
      )
    ORDER BY rank DESC, is_favorite DESC, usage_count DESC
    LIMIT 50`,
    [organizationId, language, searchQuery, `%${searchQuery}%`]
  );

  return result.rows;
};

/**
 * Get orthopedic tests library
 */
export const getTestsLibrary = async (filters = {}) => {
  const { testCategory, bodyRegion, system, search, language = 'NO' } = filters;

  let sql = `
    SELECT
      id,
      code,
      CASE
        WHEN $1 = 'EN' THEN test_name_en
        ELSE test_name_no
      END as test_name,
      test_category,
      body_region,
      system,
      CASE
        WHEN $1 = 'EN' THEN description_en
        ELSE description_no
      END as description,
      CASE
        WHEN $1 = 'EN' THEN procedure_en
        ELSE procedure_no
      END as procedure,
      CASE
        WHEN $1 = 'EN' THEN positive_finding_en
        ELSE positive_finding_no
      END as positive_finding,
      indicates_conditions,
      sensitivity,
      specificity,
      result_type,
      result_options
    FROM clinical_tests_library
    WHERE 1=1
  `;

  const params = [language];
  let paramCount = 1;

  if (testCategory) {
    paramCount++;
    sql += ` AND test_category = $${paramCount}`;
    params.push(testCategory);
  }

  if (bodyRegion) {
    paramCount++;
    sql += ` AND body_region = $${paramCount}`;
    params.push(bodyRegion);
  }

  if (system) {
    paramCount++;
    sql += ` AND system = $${paramCount}`;
    params.push(system);
  }

  if (search) {
    paramCount++;
    sql += ` AND (
      test_name_en ILIKE $${paramCount}
      OR test_name_no ILIKE $${paramCount}
      OR description_en ILIKE $${paramCount}
      OR description_no ILIKE $${paramCount}
    )`;
    params.push(`%${search}%`);
  }

  sql += ` ORDER BY body_region, test_category, test_name_en`;

  const result = await query(sql, params);
  return result.rows;
};

/**
 * Get specific test by code
 */
export const getTestByCode = async (code, language = 'NO') => {
  const result = await query(
    `SELECT
      id,
      code,
      CASE
        WHEN $2 = 'EN' THEN test_name_en
        ELSE test_name_no
      END as test_name,
      test_category,
      body_region,
      system,
      CASE
        WHEN $2 = 'EN' THEN description_en
        ELSE description_no
      END as description,
      CASE
        WHEN $2 = 'EN' THEN procedure_en
        ELSE procedure_no
      END as procedure,
      CASE
        WHEN $2 = 'EN' THEN positive_finding_en
        ELSE positive_finding_no
      END as positive_finding,
      CASE
        WHEN $2 = 'EN' THEN negative_finding_en
        ELSE negative_finding_no
      END as negative_finding,
      indicates_conditions,
      sensitivity,
      specificity,
      likelihood_ratio_positive,
      likelihood_ratio_negative,
      result_type,
      result_options,
      interpretation_guide
    FROM clinical_tests_library
    WHERE code = $1`,
    [code, language]
  );

  if (result.rows.length === 0) {
    throw new Error('Test not found');
  }

  return result.rows[0];
};

/**
 * Get user template preferences
 */
export const getUserPreferences = async (userId, organizationId) => {
  const result = await query(
    `SELECT
      id,
      user_id,
      favorite_template_ids,
      frequently_used,
      preferred_language,
      ui_preferences
    FROM user_template_preferences
    WHERE user_id = $1 AND organization_id = $2`,
    [userId, organizationId]
  );

  if (result.rows.length === 0) {
    // Create default preferences if they don't exist
    const newPrefs = await query(
      `INSERT INTO user_template_preferences (
        user_id,
        organization_id,
        favorite_template_ids,
        frequently_used,
        preferred_language,
        ui_preferences
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [userId, organizationId, [], [], 'NO', {}]
    );
    return newPrefs.rows[0];
  }

  return result.rows[0];
};

/**
 * Add template to user favorites
 */
export const addFavoriteTemplate = async (userId, organizationId, templateId) => {
  await query(
    `UPDATE user_template_preferences
     SET favorite_template_ids = array_append(favorite_template_ids, $3::uuid)
     WHERE user_id = $1 AND organization_id = $2
       AND NOT ($3::uuid = ANY(favorite_template_ids))`,
    [userId, organizationId, templateId]
  );

  // Track usage
  await query(
    `INSERT INTO template_usage_analytics (
      template_id,
      user_id,
      used_at
    ) VALUES ($1, $2, NOW())`,
    [templateId, userId]
  );
};

/**
 * Remove template from user favorites
 */
export const removeFavoriteTemplate = async (userId, organizationId, templateId) => {
  await query(
    `UPDATE user_template_preferences
     SET favorite_template_ids = array_remove(favorite_template_ids, $3::uuid)
     WHERE user_id = $1 AND organization_id = $2`,
    [userId, organizationId, templateId]
  );
};

/**
 * Get clinical phrases
 */
export const getPhrases = async (organizationId, options = {}) => {
  const { category, language = 'NO', search } = options;

  let sql = `
    SELECT
      id,
      code,
      category,
      CASE
        WHEN $2 = 'EN' THEN phrase_en
        ELSE phrase_no
      END as phrase,
      context_tags,
      body_region,
      variables
    FROM template_phrases
    WHERE (organization_id = $1 OR organization_id IS NULL)
  `;

  const params = [organizationId, language];
  let paramCount = 2;

  if (category) {
    paramCount++;
    sql += ` AND category = $${paramCount}`;
    params.push(category);
  }

  if (search) {
    paramCount++;
    sql += ` AND (
      phrase_en ILIKE $${paramCount}
      OR phrase_no ILIKE $${paramCount}
      OR $${paramCount + 1} = ANY(context_tags)
    )`;
    params.push(`%${search}%`, search);
    paramCount += 2;
  }

  sql += ` ORDER BY category, phrase`;

  const result = await query(sql, params);
  return result.rows;
};

/**
 * Get phrases by body region
 */
export const getPhrasesByRegion = async (organizationId, region, language = 'NO') => {
  const result = await query(
    `SELECT
      id,
      code,
      category,
      CASE
        WHEN $3 = 'EN' THEN phrase_en
        ELSE phrase_no
      END as phrase,
      context_tags,
      body_region,
      variables
    FROM template_phrases
    WHERE (organization_id = $1 OR organization_id IS NULL)
      AND body_region = $2
    ORDER BY category, phrase`,
    [organizationId, region, language]
  );

  return result.rows;
};

/**
 * Get red flags library
 */
export const getRedFlags = async (filters = {}) => {
  const { pathologyCategory, bodyRegion, significanceLevel, language = 'NO' } = filters;

  let sql = `
    SELECT
      id,
      code,
      CASE
        WHEN $1 = 'EN' THEN flag_name_en
        ELSE flag_name_no
      END as flag_name,
      pathology_category,
      body_region,
      CASE
        WHEN $1 = 'EN' THEN description_en
        ELSE description_no
      END as description,
      significance_level,
      age_min,
      age_max,
      CASE
        WHEN $1 = 'EN' THEN clinical_context_en
        ELSE clinical_context_no
      END as clinical_context,
      CASE
        WHEN $1 = 'EN' THEN recommended_action_en
        ELSE recommended_action_no
      END as recommended_action,
      evidence_level,
      references
    FROM red_flags_library
    WHERE 1=1
  `;

  const params = [language];
  let paramCount = 1;

  if (pathologyCategory) {
    paramCount++;
    sql += ` AND pathology_category = $${paramCount}`;
    params.push(pathologyCategory);
  }

  if (bodyRegion) {
    paramCount++;
    sql += ` AND (body_region = $${paramCount} OR body_region IS NULL)`;
    params.push(bodyRegion);
  }

  if (significanceLevel) {
    paramCount++;
    sql += ` AND significance_level = $${paramCount}`;
    params.push(significanceLevel);
  }

  sql += ` ORDER BY
    CASE significance_level
      WHEN 'HIGH' THEN 1
      WHEN 'MODERATE' THEN 2
      WHEN 'LOW' THEN 3
    END,
    pathology_category,
    flag_name`;

  const result = await query(sql, params);
  return result.rows;
};

/**
 * Screen patient for red flags
 */
export const screenRedFlags = async (patientData, symptoms, findings) => {
  const { age, gender } = patientData;

  // Get all relevant red flags based on symptoms and findings
  const _flagsFound = [];

  // Check age-specific red flags
  const ageResult = await query(
    `SELECT
      code,
      flag_name_no as flag_name,
      pathology_category,
      description_no as description,
      significance_level,
      recommended_action_no as recommended_action
    FROM red_flags_library
    WHERE (age_min IS NULL OR age_min <= $1)
      AND (age_max IS NULL OR age_max >= $1)`,
    [age]
  );

  // Build screening result
  const screening = {
    patientAge: age,
    patientGender: gender,
    screeningDate: new Date(),
    redFlagsIdentified: [],
    riskLevel: 'LOW',
    recommendedActions: [],
  };

  // Analyze symptoms and findings against red flags database
  const allFlags = ageResult.rows;

  for (const flag of allFlags) {
    // Check if symptoms or findings match this red flag
    let isPresent = false;

    if (symptoms && Array.isArray(symptoms)) {
      isPresent = symptoms.some((symptom) =>
        flag.description.toLowerCase().includes(symptom.toLowerCase())
      );
    }

    if (!isPresent && findings && Array.isArray(findings)) {
      isPresent = findings.some((finding) =>
        flag.description.toLowerCase().includes(finding.toLowerCase())
      );
    }

    if (isPresent) {
      screening.redFlagsIdentified.push({
        code: flag.code,
        name: flag.flag_name,
        category: flag.pathology_category,
        significance: flag.significance_level,
        action: flag.recommended_action,
      });

      // Update risk level
      if (flag.significance_level === 'HIGH' && screening.riskLevel !== 'HIGH') {
        screening.riskLevel = 'HIGH';
      } else if (flag.significance_level === 'MODERATE' && screening.riskLevel === 'LOW') {
        screening.riskLevel = 'MODERATE';
      }

      // Add recommended action if not already present
      if (
        flag.recommended_action &&
        !screening.recommendedActions.includes(flag.recommended_action)
      ) {
        screening.recommendedActions.push(flag.recommended_action);
      }
    }
  }

  return screening;
};

/**
 * Get test clusters
 */
export const getTestClusters = async (filters = {}) => {
  const { bodyRegion, language = 'NO' } = filters;

  let sql = `
    SELECT
      id,
      code,
      CASE
        WHEN $1 = 'EN' THEN cluster_name_en
        ELSE cluster_name_no
      END as cluster_name,
      body_region,
      suspected_condition,
      test_codes,
      CASE
        WHEN $1 = 'EN' THEN interpretation_en
        ELSE interpretation_no
      END as interpretation,
      sensitivity,
      specificity,
      positive_likelihood_ratio,
      negative_likelihood_ratio,
      evidence_quality,
      references
    FROM test_clusters
    WHERE 1=1
  `;

  const params = [language];
  let paramCount = 1;

  if (bodyRegion) {
    paramCount++;
    sql += ` AND body_region = $${paramCount}`;
    params.push(bodyRegion);
  }

  sql += ` ORDER BY body_region, cluster_name`;

  const result = await query(sql, params);
  return result.rows;
};

/**
 * Get test cluster by condition
 */
export const getTestClusterByCondition = async (condition, language = 'NO') => {
  const result = await query(
    `SELECT
      id,
      code,
      CASE
        WHEN $2 = 'EN' THEN cluster_name_en
        ELSE cluster_name_no
      END as cluster_name,
      body_region,
      suspected_condition,
      test_codes,
      CASE
        WHEN $2 = 'EN' THEN description_en
        ELSE description_no
      END as description,
      CASE
        WHEN $2 = 'EN' THEN interpretation_en
        ELSE interpretation_no
      END as interpretation,
      sensitivity,
      specificity,
      positive_likelihood_ratio,
      negative_likelihood_ratio,
      evidence_quality,
      references
    FROM test_clusters
    WHERE suspected_condition ILIKE $1
       OR code = $1
    ORDER BY evidence_quality DESC
    LIMIT 1`,
    [`%${condition}%`, language]
  );

  if (result.rows.length === 0) {
    throw new Error('Cluster not found');
  }

  return result.rows[0];
};

/**
 * Get FMS (Functional Movement Screen) templates
 */
export const getFMSTemplates = async (language = 'NO') => {
  const result = await query(
    `SELECT
      id,
      code,
      CASE
        WHEN $1 = 'EN' THEN name_en
        ELSE name_no
      END as name,
      category_id,
      template_type,
      CASE
        WHEN $1 = 'EN' THEN content_en
        ELSE content_no
      END as content,
      template_data,
      sort_order
    FROM clinical_templates
    WHERE code LIKE 'fms_%'
    ORDER BY sort_order`,
    [language]
  );

  return result.rows;
};

export default {
  getAllTemplates,
  getTemplatesByCategory,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  toggleFavorite,
  incrementUsage,
  getCategories,
  searchTemplates,
  getTestsLibrary,
  getTestByCode,
  getUserPreferences,
  addFavoriteTemplate,
  removeFavoriteTemplate,
  getPhrases,
  getPhrasesByRegion,
  getRedFlags,
  screenRedFlags,
  getTestClusters,
  getTestClusterByCondition,
  getFMSTemplates,
};
