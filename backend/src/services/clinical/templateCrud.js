/**
 * Clinical Template CRUD
 * Core template management: get, create, update, delete, favorites, search
 */

import { query } from '../../config/database.js';

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
    SELECT id, category, subcategory, template_name, template_text,
           language, soap_section, is_system, is_favorite, usage_count, created_at
    FROM clinical_templates
    WHERE (organization_id = $1 OR is_system = true) AND language = $2
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
      to_tsvector('norwegian', template_name || ' ' || template_text) @@ plainto_tsquery('norwegian', $${paramCount})
      OR template_name ILIKE $${paramCount + 1} OR template_text ILIKE $${paramCount + 1}
    )`;
    params.push(search);
    params.push(`%${search}%`);
    paramCount += 2;
  }

  sql += ` ORDER BY is_favorite DESC, usage_count DESC, category, subcategory, template_name`;
  paramCount++;
  sql += ` LIMIT $${paramCount}`;
  params.push(limit);
  paramCount++;
  sql += ` OFFSET $${paramCount}`;
  params.push(offset);

  const result = await query(sql, params);
  const countResult = await query(
    `SELECT COUNT(*) as total FROM clinical_templates
     WHERE (organization_id = $1 OR is_system = true) AND language = $2`,
    [organizationId, language]
  );

  return { templates: result.rows, total: parseInt(countResult.rows[0].total), limit, offset };
};

/**
 * Get templates grouped by category
 */
export const getTemplatesByCategory = async (organizationId, language = 'NO') => {
  const result = await query(
    `SELECT category, subcategory,
      json_agg(
        json_build_object('id', id, 'name', template_name, 'text', template_text,
          'soapSection', soap_section, 'isFavorite', is_favorite, 'usageCount', usage_count)
        ORDER BY is_favorite DESC, usage_count DESC, template_name
      ) as templates
    FROM clinical_templates
    WHERE (organization_id = $1 OR is_system = true) AND language = $2
    GROUP BY category, subcategory ORDER BY category, subcategory`,
    [organizationId, language]
  );

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
    `SELECT id, organization_id, category, subcategory, template_name, template_text,
            language, soap_section, is_system, is_favorite, usage_count, created_by, created_at, updated_at
     FROM clinical_templates WHERE id = $1 AND (organization_id = $2 OR is_system = true)`,
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
    `INSERT INTO clinical_templates (organization_id, category, subcategory, template_name, template_text,
      language, soap_section, is_favorite, created_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
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
    `UPDATE clinical_templates SET
      category = COALESCE($1, category), subcategory = COALESCE($2, subcategory),
      template_name = COALESCE($3, template_name), template_text = COALESCE($4, template_text),
      soap_section = COALESCE($5, soap_section), is_favorite = COALESCE($6, is_favorite)
    WHERE id = $7 RETURNING *`,
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
    `UPDATE clinical_templates SET is_favorite = NOT is_favorite
     WHERE id = $1 AND (organization_id = $2 OR is_system = true) RETURNING *`,
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
    `SELECT DISTINCT category, COUNT(*) as template_count
    FROM clinical_templates WHERE (organization_id = $1 OR is_system = true) AND language = $2
    GROUP BY category ORDER BY category`,
    [organizationId, language]
  );
  return result.rows;
};

/**
 * Search templates
 */
export const searchTemplates = async (organizationId, searchQuery, language = 'NO') => {
  const result = await query(
    `SELECT id, category, subcategory, template_name, template_text, soap_section, is_favorite, usage_count,
      ts_rank(to_tsvector('norwegian', template_name || ' ' || template_text), plainto_tsquery('norwegian', $3)) as rank
    FROM clinical_templates
    WHERE (organization_id = $1 OR is_system = true) AND language = $2
      AND (to_tsvector('norwegian', template_name || ' ' || template_text) @@ plainto_tsquery('norwegian', $3)
           OR template_name ILIKE $4 OR template_text ILIKE $4)
    ORDER BY rank DESC, is_favorite DESC, usage_count DESC LIMIT 50`,
    [organizationId, language, searchQuery, `%${searchQuery}%`]
  );
  return result.rows;
};

/**
 * Get user template preferences
 */
export const getUserPreferences = async (userId, organizationId) => {
  const result = await query(
    `SELECT id, user_id, favorite_template_ids, frequently_used, preferred_language, ui_preferences
    FROM user_template_preferences WHERE user_id = $1 AND organization_id = $2`,
    [userId, organizationId]
  );
  if (result.rows.length === 0) {
    const newPrefs = await query(
      `INSERT INTO user_template_preferences (user_id, organization_id, favorite_template_ids, frequently_used, preferred_language, ui_preferences)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
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
    `UPDATE user_template_preferences SET favorite_template_ids = array_append(favorite_template_ids, $3::uuid)
     WHERE user_id = $1 AND organization_id = $2 AND NOT ($3::uuid = ANY(favorite_template_ids))`,
    [userId, organizationId, templateId]
  );
  await query(
    `INSERT INTO template_usage_analytics (template_id, user_id, used_at) VALUES ($1, $2, NOW())`,
    [templateId, userId]
  );
};

/**
 * Remove template from user favorites
 */
export const removeFavoriteTemplate = async (userId, organizationId, templateId) => {
  await query(
    `UPDATE user_template_preferences SET favorite_template_ids = array_remove(favorite_template_ids, $3::uuid)
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
    SELECT id, code, category,
      CASE WHEN $2 = 'EN' THEN phrase_en ELSE phrase_no END as phrase,
      context_tags, body_region, variables
    FROM template_phrases WHERE (organization_id = $1 OR organization_id IS NULL)
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
    sql += ` AND (phrase_en ILIKE $${paramCount} OR phrase_no ILIKE $${paramCount} OR $${paramCount + 1} = ANY(context_tags))`;
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
    `SELECT id, code, category,
      CASE WHEN $3 = 'EN' THEN phrase_en ELSE phrase_no END as phrase,
      context_tags, body_region, variables
    FROM template_phrases
    WHERE (organization_id = $1 OR organization_id IS NULL) AND body_region = $2
    ORDER BY category, phrase`,
    [organizationId, region, language]
  );
  return result.rows;
};

/**
 * Get FMS templates
 */
export const getFMSTemplates = async (language = 'NO') => {
  const result = await query(
    `SELECT id, code,
      CASE WHEN $1 = 'EN' THEN name_en ELSE name_no END as name,
      category_id, template_type,
      CASE WHEN $1 = 'EN' THEN content_en ELSE content_no END as content,
      template_data, sort_order
    FROM clinical_templates WHERE code LIKE 'fms_%' ORDER BY sort_order`,
    [language]
  );
  return result.rows;
};
