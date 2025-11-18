/**
 * Follow-ups Service
 * Handles automated follow-up tracking and reminders
 */

import { query } from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Get all follow-ups with filters
 */
export const getAllFollowUps = async (organizationId, options = {}) => {
  const {
    page = 1,
    limit = 50,
    patientId = null,
    status = null,
    priority = null,
    dueDate = null
  } = options;

  const offset = (page - 1) * limit;
  let whereConditions = ['f.organization_id = $1'];
  let params = [organizationId];
  let paramIndex = 2;

  if (patientId) {
    whereConditions.push(`f.patient_id = $${paramIndex}`);
    params.push(patientId);
    paramIndex++;
  }

  if (status) {
    whereConditions.push(`f.status = $${paramIndex}`);
    params.push(status);
    paramIndex++;
  }

  if (priority) {
    whereConditions.push(`f.priority = $${paramIndex}`);
    params.push(priority);
    paramIndex++;
  }

  if (dueDate) {
    whereConditions.push(`f.due_date <= $${paramIndex}`);
    params.push(dueDate);
    paramIndex++;
  }

  const whereClause = whereConditions.join(' AND ');

  // Get total count
  const countResult = await query(
    `SELECT COUNT(*) FROM follow_ups f WHERE ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count);

  // Get paginated results
  const result = await query(
    `SELECT
      f.*,
      p.first_name || ' ' || p.last_name as patient_name,
      p.solvit_id,
      u.first_name || ' ' || u.last_name as assigned_to_name
    FROM follow_ups f
    JOIN patients p ON p.id = f.patient_id
    LEFT JOIN users u ON u.id = f.assigned_to
    WHERE ${whereClause}
    ORDER BY f.due_date ASC, f.priority DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...params, limit, offset]
  );

  return {
    followUps: result.rows,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get follow-up by ID
 */
export const getFollowUpById = async (organizationId, followUpId) => {
  const result = await query(
    `SELECT
      f.*,
      p.first_name || ' ' || p.last_name as patient_name,
      p.solvit_id,
      p.phone,
      p.email,
      u.first_name || ' ' || u.last_name as assigned_to_name
    FROM follow_ups f
    JOIN patients p ON p.id = f.patient_id
    LEFT JOIN users u ON u.id = f.assigned_to
    WHERE f.id = $1 AND f.organization_id = $2`,
    [followUpId, organizationId]
  );

  return result.rows[0] || null;
};

/**
 * Create new follow-up
 */
export const createFollowUp = async (organizationId, followUpData) => {
  const {
    patient_id,
    encounter_id = null,
    follow_up_type,
    reason,
    due_date,
    priority = 'MEDIUM',
    assigned_to = null,
    notes = ''
  } = followUpData;

  const result = await query(
    `INSERT INTO follow_ups (
      organization_id,
      patient_id,
      encounter_id,
      follow_up_type,
      reason,
      due_date,
      priority,
      assigned_to,
      notes,
      status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'PENDING')
    RETURNING *`,
    [
      organizationId,
      patient_id,
      encounter_id,
      follow_up_type,
      reason,
      due_date,
      priority,
      assigned_to,
      notes
    ]
  );

  logger.info(`Follow-up created: ${result.rows[0].id} for patient: ${patient_id}`);
  return result.rows[0];
};

/**
 * Update follow-up
 */
export const updateFollowUp = async (organizationId, followUpId, updateData) => {
  const {
    due_date,
    priority,
    assigned_to,
    notes,
    status
  } = updateData;

  const updates = [];
  const params = [followUpId, organizationId];
  let paramIndex = 3;

  if (due_date !== undefined) {
    updates.push(`due_date = $${paramIndex}`);
    params.push(due_date);
    paramIndex++;
  }

  if (priority !== undefined) {
    updates.push(`priority = $${paramIndex}`);
    params.push(priority);
    paramIndex++;
  }

  if (assigned_to !== undefined) {
    updates.push(`assigned_to = $${paramIndex}`);
    params.push(assigned_to);
    paramIndex++;
  }

  if (notes !== undefined) {
    updates.push(`notes = $${paramIndex}`);
    params.push(notes);
    paramIndex++;
  }

  if (status !== undefined) {
    updates.push(`status = $${paramIndex}`);
    params.push(status);
    paramIndex++;

    if (status === 'COMPLETED') {
      updates.push(`completed_at = NOW()`);
    }
  }

  if (updates.length === 0) {
    throw new Error('No fields to update');
  }

  const result = await query(
    `UPDATE follow_ups
    SET ${updates.join(', ')}, updated_at = NOW()
    WHERE id = $1 AND organization_id = $2
    RETURNING *`,
    params
  );

  if (result.rows.length === 0) {
    throw new Error('Follow-up not found');
  }

  logger.info(`Follow-up updated: ${followUpId}`);
  return result.rows[0];
};

/**
 * Complete follow-up
 */
export const completeFollowUp = async (organizationId, followUpId, completionNotes = '') => {
  const result = await query(
    `UPDATE follow_ups
    SET
      status = 'COMPLETED',
      completed_at = NOW(),
      notes = CASE
        WHEN $3 != '' THEN notes || E'\n\n' || 'Completed: ' || $3
        ELSE notes
      END,
      updated_at = NOW()
    WHERE id = $1 AND organization_id = $2
    RETURNING *`,
    [followUpId, organizationId, completionNotes]
  );

  if (result.rows.length === 0) {
    throw new Error('Follow-up not found');
  }

  logger.info(`Follow-up completed: ${followUpId}`);
  return result.rows[0];
};

/**
 * Get overdue follow-ups
 */
export const getOverdueFollowUps = async (organizationId) => {
  const result = await query(
    `SELECT
      f.*,
      p.first_name || ' ' || p.last_name as patient_name,
      p.solvit_id,
      p.phone,
      p.email
    FROM follow_ups f
    JOIN patients p ON p.id = f.patient_id
    WHERE f.organization_id = $1
      AND f.status = 'PENDING'
      AND f.due_date < NOW()
    ORDER BY f.due_date ASC, f.priority DESC`,
    [organizationId]
  );

  return result.rows;
};

/**
 * Get upcoming follow-ups (next 7 days)
 */
export const getUpcomingFollowUps = async (organizationId, days = 7) => {
  const result = await query(
    `SELECT
      f.*,
      p.first_name || ' ' || p.last_name as patient_name,
      p.solvit_id,
      p.phone,
      p.email
    FROM follow_ups f
    JOIN patients p ON p.id = f.patient_id
    WHERE f.organization_id = $1
      AND f.status = 'PENDING'
      AND f.due_date >= NOW()
      AND f.due_date <= NOW() + INTERVAL '${days} days'
    ORDER BY f.due_date ASC, f.priority DESC`,
    [organizationId]
  );

  return result.rows;
};

/**
 * Get follow-up statistics
 */
export const getFollowUpStats = async (organizationId) => {
  const result = await query(
    `SELECT
      COUNT(*) FILTER (WHERE status = 'PENDING') as pending_count,
      COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed_count,
      COUNT(*) FILTER (WHERE status = 'CANCELLED') as cancelled_count,
      COUNT(*) FILTER (WHERE status = 'PENDING' AND due_date < NOW()) as overdue_count,
      COUNT(*) FILTER (WHERE status = 'PENDING' AND due_date >= NOW() AND due_date <= NOW() + INTERVAL '7 days') as upcoming_count,
      COUNT(*) FILTER (WHERE priority = 'HIGH') as high_priority_count,
      AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 86400)::numeric(10,2) as avg_completion_days
    FROM follow_ups
    WHERE organization_id = $1
      AND created_at >= NOW() - INTERVAL '90 days'`,
    [organizationId]
  );

  return result.rows[0];
};

/**
 * Auto-create follow-ups based on encounter
 * Called after encounter is created/signed
 */
export const autoCreateFollowUps = async (organizationId, encounterId, patientId, plan) => {
  const followUps = [];

  // Parse plan for follow-up indicators
  const planLower = plan.follow_up?.toLowerCase() || '';

  // Check for specific follow-up timeframes
  const timeframes = [
    { pattern: /1\s*(week|uke)/i, days: 7, reason: 'Scheduled 1 week follow-up' },
    { pattern: /2\s*(week|uke)/i, days: 14, reason: 'Scheduled 2 week follow-up' },
    { pattern: /3\s*(week|uke)/i, days: 21, reason: 'Scheduled 3 week follow-up' },
    { pattern: /1\s*(month|måned)/i, days: 30, reason: 'Scheduled 1 month follow-up' },
    { pattern: /2\s*(month|måned)/i, days: 60, reason: 'Scheduled 2 month follow-up' }
  ];

  for (const timeframe of timeframes) {
    if (timeframe.pattern.test(planLower)) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + timeframe.days);

      const followUp = await createFollowUp(organizationId, {
        patient_id: patientId,
        encounter_id: encounterId,
        follow_up_type: 'APPOINTMENT',
        reason: timeframe.reason,
        due_date: dueDate.toISOString().split('T')[0],
        priority: 'MEDIUM'
      });

      followUps.push(followUp);
      logger.info(`Auto-created follow-up for encounter ${encounterId}: ${timeframe.reason}`);
    }
  }

  return followUps;
};

export default {
  getAllFollowUps,
  getFollowUpById,
  createFollowUp,
  updateFollowUp,
  completeFollowUp,
  getOverdueFollowUps,
  getUpcomingFollowUps,
  getFollowUpStats,
  autoCreateFollowUps
};
