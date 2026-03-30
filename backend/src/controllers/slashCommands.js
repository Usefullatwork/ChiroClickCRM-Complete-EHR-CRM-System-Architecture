/**
 * Slash Commands Controller
 * CRUD for user-defined slash commands stored in DB
 */

import { query } from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Get all slash commands for the user's organization
 * GET /api/v1/slash-commands
 */
export const getSlashCommands = async (req, res) => {
  try {
    const { organizationId } = req;
    const result = await query(
      `SELECT id, command_trigger, output_text, category, user_id, created_at, updated_at
       FROM slash_commands
       WHERE organization_id = $1 AND deleted_at IS NULL
       ORDER BY category, command_trigger`,
      [organizationId]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    logger.error('Error getting slash commands:', error);
    res.status(500).json({ error: 'Failed to retrieve slash commands' });
  }
};

/**
 * Create a new slash command
 * POST /api/v1/slash-commands
 */
export const createSlashCommand = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const { command_trigger, output_text, category } = req.body;

    // Ensure trigger starts with /
    const trigger = command_trigger.startsWith('/') ? command_trigger : `/${command_trigger}`;

    // Check for duplicates within org
    const existing = await query(
      `SELECT id FROM slash_commands
       WHERE organization_id = $1 AND command_trigger = $2 AND deleted_at IS NULL`,
      [organizationId, trigger]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Command trigger already exists' });
    }

    const result = await query(
      `INSERT INTO slash_commands (organization_id, user_id, command_trigger, output_text, category)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, command_trigger, output_text, category, user_id, created_at`,
      [organizationId, user.id, trigger, output_text, category || 'general']
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    logger.error('Error creating slash command:', error);
    res.status(500).json({ error: 'Failed to create slash command' });
  }
};

/**
 * Update a slash command
 * PATCH /api/v1/slash-commands/:id
 */
export const updateSlashCommand = async (req, res) => {
  try {
    const { organizationId } = req;
    const { id } = req.params;
    const { command_trigger, output_text, category } = req.body;

    const sets = [];
    const params = [organizationId, id];
    let idx = 3;

    if (command_trigger !== undefined) {
      const trigger = command_trigger.startsWith('/') ? command_trigger : `/${command_trigger}`;
      sets.push(`command_trigger = $${idx++}`);
      params.push(trigger);
    }
    if (output_text !== undefined) {
      sets.push(`output_text = $${idx++}`);
      params.push(output_text);
    }
    if (category !== undefined) {
      sets.push(`category = $${idx++}`);
      params.push(category);
    }

    if (sets.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    sets.push('updated_at = NOW()');

    const result = await query(
      `UPDATE slash_commands SET ${sets.join(', ')}
       WHERE organization_id = $1 AND id = $2 AND deleted_at IS NULL
       RETURNING id, command_trigger, output_text, category, updated_at`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Slash command not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    logger.error('Error updating slash command:', error);
    res.status(500).json({ error: 'Failed to update slash command' });
  }
};

/**
 * Soft-delete a slash command
 * DELETE /api/v1/slash-commands/:id
 */
export const deleteSlashCommand = async (req, res) => {
  try {
    const { organizationId } = req;
    const { id } = req.params;

    const result = await query(
      `UPDATE slash_commands SET deleted_at = NOW()
       WHERE organization_id = $1 AND id = $2 AND deleted_at IS NULL
       RETURNING id`,
      [organizationId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Slash command not found' });
    }

    res.json({ success: true, message: 'Slash command deleted' });
  } catch (error) {
    logger.error('Error deleting slash command:', error);
    res.status(500).json({ error: 'Failed to delete slash command' });
  }
};

export default {
  getSlashCommands,
  createSlashCommand,
  updateSlashCommand,
  deleteSlashCommand,
};
