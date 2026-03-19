/**
 * Compliance Rules Controller
 * CRUD for data-driven compliance rules
 */

import { query } from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Get all active compliance rules for the organization
 * GET /api/v1/compliance-rules
 */
export const getComplianceRules = async (req, res) => {
  try {
    const { organizationId } = req;
    const { rule_type, active_only } = req.query;

    let sql = `SELECT id, rule_type, rule_key, rule_config, is_active, severity, created_at, updated_at
               FROM compliance_rules WHERE organization_id = $1`;
    const params = [organizationId];
    let idx = 2;

    if (active_only !== 'false') {
      sql += ` AND is_active = true`;
    }
    if (rule_type) {
      sql += ` AND rule_type = $${idx++}`;
      params.push(rule_type);
    }

    sql += ' ORDER BY rule_type, rule_key';

    const result = await query(sql, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    logger.error('Error getting compliance rules:', error);
    res.status(500).json({ error: 'Failed to retrieve compliance rules' });
  }
};

/**
 * Create a compliance rule
 * POST /api/v1/compliance-rules
 */
export const createComplianceRule = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const { rule_type, rule_key, rule_config, severity } = req.body;

    const result = await query(
      `INSERT INTO compliance_rules (organization_id, rule_type, rule_key, rule_config, severity, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, rule_type, rule_key, rule_config, is_active, severity, created_at`,
      [
        organizationId,
        rule_type,
        rule_key,
        JSON.stringify(rule_config || {}),
        severity || 'medium',
        user.id,
      ]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Rule with this type and key already exists' });
    }
    logger.error('Error creating compliance rule:', error);
    res.status(500).json({ error: 'Failed to create compliance rule' });
  }
};

/**
 * Update a compliance rule
 * PATCH /api/v1/compliance-rules/:id
 */
export const updateComplianceRule = async (req, res) => {
  try {
    const { organizationId } = req;
    const { id } = req.params;
    const { rule_config, is_active, severity } = req.body;

    const sets = [];
    const params = [organizationId, id];
    let idx = 3;

    if (rule_config !== undefined) {
      sets.push(`rule_config = $${idx++}`);
      params.push(JSON.stringify(rule_config));
    }
    if (is_active !== undefined) {
      sets.push(`is_active = $${idx++}`);
      params.push(is_active);
    }
    if (severity !== undefined) {
      sets.push(`severity = $${idx++}`);
      params.push(severity);
    }

    if (sets.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    sets.push('updated_at = NOW()');

    const result = await query(
      `UPDATE compliance_rules SET ${sets.join(', ')}
       WHERE organization_id = $1 AND id = $2
       RETURNING id, rule_type, rule_key, rule_config, is_active, severity, updated_at`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Compliance rule not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    logger.error('Error updating compliance rule:', error);
    res.status(500).json({ error: 'Failed to update compliance rule' });
  }
};

/**
 * Delete a compliance rule
 * DELETE /api/v1/compliance-rules/:id
 */
export const deleteComplianceRule = async (req, res) => {
  try {
    const { organizationId } = req;
    const { id } = req.params;

    const result = await query(
      `DELETE FROM compliance_rules WHERE organization_id = $1 AND id = $2 RETURNING id`,
      [organizationId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Compliance rule not found' });
    }

    res.json({ success: true, message: 'Compliance rule deleted' });
  } catch (error) {
    logger.error('Error deleting compliance rule:', error);
    res.status(500).json({ error: 'Failed to delete compliance rule' });
  }
};

export default {
  getComplianceRules,
  createComplianceRule,
  updateComplianceRule,
  deleteComplianceRule,
};
