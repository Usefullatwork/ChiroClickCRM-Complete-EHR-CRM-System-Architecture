/**
 * Spine Templates Controller
 * Handles CRUD operations for spine palpation text templates
 */

import { query } from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Get all spine templates for an organization
 * Merges organization custom templates with system defaults
 */
export const getAll = async (req, res) => {
  try {
    const organizationId = req.organizationId;
    const { segment, direction, finding_type, language = 'NO' } = req.query;

    // Build query - get org templates first, then defaults for missing
    let sql = `
      WITH org_templates AS (
        SELECT * FROM spine_text_templates
        WHERE organization_id = $1 AND language = $2
      ),
      default_templates AS (
        SELECT * FROM spine_text_templates
        WHERE is_default = true AND language = $2
      )
      SELECT
        COALESCE(o.id, d.id) as id,
        COALESCE(o.segment, d.segment) as segment,
        COALESCE(o.direction, d.direction) as direction,
        COALESCE(o.finding_type, d.finding_type) as finding_type,
        COALESCE(o.text_template, d.text_template) as text_template,
        COALESCE(o.language, d.language) as language,
        CASE WHEN o.id IS NOT NULL THEN false ELSE true END as is_default,
        COALESCE(o.sort_order, d.sort_order) as sort_order,
        COALESCE(o.created_at, d.created_at) as created_at,
        COALESCE(o.updated_at, d.updated_at) as updated_at
      FROM default_templates d
      LEFT JOIN org_templates o
        ON d.segment = o.segment
        AND d.direction = o.direction
        AND d.finding_type = o.finding_type
    `;

    const params = [organizationId, language];
    const conditions = [];
    let paramIndex = 3;

    if (segment) {
      conditions.push(`(COALESCE(o.segment, d.segment) = $${paramIndex})`);
      params.push(segment);
      paramIndex++;
    }

    if (direction) {
      conditions.push(`(COALESCE(o.direction, d.direction) = $${paramIndex})`);
      params.push(direction);
      paramIndex++;
    }

    if (finding_type) {
      conditions.push(`(COALESCE(o.finding_type, d.finding_type) = $${paramIndex})`);
      params.push(finding_type);
      paramIndex++;
    }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    sql += ` ORDER BY sort_order ASC, segment ASC, direction ASC`;

    const result = await query(sql, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    logger.error('Error fetching spine templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch spine templates',
      message: error.message,
    });
  }
};

/**
 * Get all templates grouped by segment (for UI display)
 */
export const getGroupedBySegment = async (req, res) => {
  try {
    const organizationId = req.organizationId;
    const { language = 'NO' } = req.query;

    const sql = `
      WITH org_templates AS (
        SELECT * FROM spine_text_templates
        WHERE organization_id = $1 AND language = $2
      ),
      default_templates AS (
        SELECT * FROM spine_text_templates
        WHERE is_default = true AND language = $2
      )
      SELECT
        COALESCE(o.id, d.id) as id,
        COALESCE(o.segment, d.segment) as segment,
        COALESCE(o.direction, d.direction) as direction,
        COALESCE(o.finding_type, d.finding_type) as finding_type,
        COALESCE(o.text_template, d.text_template) as text_template,
        CASE WHEN o.id IS NOT NULL THEN false ELSE true END as is_default,
        COALESCE(o.sort_order, d.sort_order) as sort_order
      FROM default_templates d
      LEFT JOIN org_templates o
        ON d.segment = o.segment
        AND d.direction = o.direction
        AND d.finding_type = o.finding_type
      ORDER BY sort_order ASC
    `;

    const result = await query(sql, [organizationId, language]);

    // Group by segment
    const grouped = result.rows.reduce((acc, template) => {
      if (!acc[template.segment]) {
        acc[template.segment] = [];
      }
      acc[template.segment].push(template);
      return acc;
    }, {});

    res.json({
      success: true,
      data: grouped,
      segments: Object.keys(grouped),
    });
  } catch (error) {
    logger.error('Error fetching grouped spine templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch spine templates',
      message: error.message,
    });
  }
};

/**
 * Get template for specific segment and direction
 */
export const getBySegmentDirection = async (req, res) => {
  try {
    const organizationId = req.organizationId;
    const { segment, direction } = req.params;
    const { finding_type = 'palpation', language = 'NO' } = req.query;

    // First try to get org-specific template
    let sql = `
      SELECT * FROM spine_text_templates
      WHERE organization_id = $1
        AND segment = $2
        AND direction = $3
        AND finding_type = $4
        AND language = $5
    `;
    let result = await query(sql, [organizationId, segment, direction, finding_type, language]);

    // If not found, get default
    if (result.rows.length === 0) {
      sql = `
        SELECT * FROM spine_text_templates
        WHERE is_default = true
          AND segment = $1
          AND direction = $2
          AND finding_type = $3
          AND language = $4
      `;
      result = await query(sql, [segment, direction, finding_type, language]);
    }

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Template not found',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    logger.error('Error fetching spine template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch spine template',
      message: error.message,
    });
  }
};

/**
 * Create custom template for organization
 */
export const create = async (req, res) => {
  try {
    const organizationId = req.organizationId;
    const {
      segment,
      direction,
      finding_type = 'palpation',
      text_template,
      language = 'NO',
      sort_order = 0,
    } = req.body;

    if (!segment || !direction || !text_template) {
      return res.status(400).json({
        success: false,
        error: 'segment, direction, and text_template are required',
      });
    }

    const sql = `
      INSERT INTO spine_text_templates
        (organization_id, segment, direction, finding_type, text_template, language, is_default, sort_order)
      VALUES ($1, $2, $3, $4, $5, $6, false, $7)
      ON CONFLICT (organization_id, segment, direction, finding_type, language)
      DO UPDATE SET
        text_template = EXCLUDED.text_template,
        sort_order = EXCLUDED.sort_order,
        updated_at = NOW()
      RETURNING *
    `;

    const result = await query(sql, [
      organizationId,
      segment,
      direction,
      finding_type,
      text_template,
      language,
      sort_order,
    ]);

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    logger.error('Error creating spine template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create spine template',
      message: error.message,
    });
  }
};

/**
 * Update existing template
 */
export const update = async (req, res) => {
  try {
    const organizationId = req.organizationId;
    const { id } = req.params;
    const { text_template, sort_order } = req.body;

    if (!text_template) {
      return res.status(400).json({
        success: false,
        error: 'text_template is required',
      });
    }

    // First, try to update an org-specific template
    const updateSql = `
      UPDATE spine_text_templates
      SET text_template = $1, sort_order = COALESCE($2, sort_order), updated_at = NOW()
      WHERE id = $3 AND organization_id = $4
      RETURNING *
    `;

    let result = await query(updateSql, [text_template, sort_order, id, organizationId]);

    // If no org template found, check if it's a default template and create an org override
    if (result.rows.length === 0) {
      // Check if this is a default template
      const checkSql = `SELECT * FROM spine_text_templates WHERE id = $1 AND is_default = true`;
      const checkResult = await query(checkSql, [id]);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Template not found',
        });
      }

      // Create an org-specific override from the default template
      const defaultTemplate = checkResult.rows[0];
      const insertSql = `
        INSERT INTO spine_text_templates
          (organization_id, segment, direction, finding_type, text_template, language, is_default, sort_order)
        VALUES ($1, $2, $3, $4, $5, $6, false, $7)
        ON CONFLICT (organization_id, segment, direction, finding_type, language)
        DO UPDATE SET
          text_template = EXCLUDED.text_template,
          sort_order = EXCLUDED.sort_order,
          updated_at = NOW()
        RETURNING *
      `;

      result = await query(insertSql, [
        organizationId,
        defaultTemplate.segment,
        defaultTemplate.direction,
        defaultTemplate.finding_type,
        text_template,
        defaultTemplate.language,
        sort_order || defaultTemplate.sort_order,
      ]);
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    logger.error('Error updating spine template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update spine template',
      message: error.message,
    });
  }
};

/**
 * Delete custom template (revert to default)
 */
export const remove = async (req, res) => {
  try {
    const organizationId = req.organizationId;
    const { id } = req.params;

    const sql = `
      DELETE FROM spine_text_templates
      WHERE id = $1 AND organization_id = $2 AND is_default = false
      RETURNING *
    `;

    const result = await query(sql, [id, organizationId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Template not found, not owned by organization, or is a default template',
      });
    }

    res.json({
      success: true,
      message: 'Template deleted, will revert to default',
    });
  } catch (error) {
    logger.error('Error deleting spine template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete spine template',
      message: error.message,
    });
  }
};

/**
 * Bulk update templates (for settings UI)
 */
export const bulkUpdate = async (req, res) => {
  try {
    const organizationId = req.organizationId;
    const { templates } = req.body;

    if (!Array.isArray(templates)) {
      return res.status(400).json({
        success: false,
        error: 'templates array is required',
      });
    }

    const results = [];
    for (const template of templates) {
      const {
        segment,
        direction,
        finding_type = 'palpation',
        text_template,
        language = 'NO',
        sort_order = 0,
      } = template;

      if (!segment || !direction || !text_template) {
        continue;
      }

      const sql = `
        INSERT INTO spine_text_templates
          (organization_id, segment, direction, finding_type, text_template, language, is_default, sort_order)
        VALUES ($1, $2, $3, $4, $5, $6, false, $7)
        ON CONFLICT (organization_id, segment, direction, finding_type, language)
        DO UPDATE SET
          text_template = EXCLUDED.text_template,
          sort_order = EXCLUDED.sort_order,
          updated_at = NOW()
        RETURNING *
      `;

      const result = await query(sql, [
        organizationId,
        segment,
        direction,
        finding_type,
        text_template,
        language,
        sort_order,
      ]);

      if (result.rows.length > 0) {
        results.push(result.rows[0]);
      }
    }

    res.json({
      success: true,
      data: results,
      count: results.length,
    });
  } catch (error) {
    logger.error('Error bulk updating spine templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to bulk update spine templates',
      message: error.message,
    });
  }
};

/**
 * Reset organization templates to defaults
 */
export const resetToDefaults = async (req, res) => {
  try {
    const organizationId = req.organizationId;
    const { language = 'NO' } = req.query;

    const sql = `
      DELETE FROM spine_text_templates
      WHERE organization_id = $1 AND language = $2 AND is_default = false
    `;

    await query(sql, [organizationId, language]);

    res.json({
      success: true,
      message: 'All custom templates deleted, reverted to defaults',
    });
  } catch (error) {
    logger.error('Error resetting spine templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset spine templates',
      message: error.message,
    });
  }
};

/**
 * Get available segments list
 */
export const getSegments = async (req, res) => {
  try {
    const sql = `
      SELECT DISTINCT segment, MIN(sort_order) as sort_order
      FROM spine_text_templates
      WHERE is_default = true
      GROUP BY segment
      ORDER BY MIN(sort_order) ASC
    `;

    const result = await query(sql);

    res.json({
      success: true,
      data: result.rows.map((r) => r.segment),
    });
  } catch (error) {
    logger.error('Error fetching segments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch segments',
      message: error.message,
    });
  }
};

/**
 * Get available directions list
 */
export const getDirections = async (req, res) => {
  try {
    const sql = `
      SELECT DISTINCT direction
      FROM spine_text_templates
      WHERE is_default = true
      ORDER BY direction ASC
    `;

    const result = await query(sql);

    res.json({
      success: true,
      data: result.rows.map((r) => r.direction),
    });
  } catch (error) {
    logger.error('Error fetching directions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch directions',
      message: error.message,
    });
  }
};
