/**
 * Data Curation Service
 * Business logic for curating AI feedback into training data
 */

import { query } from '../config/database.js';
import logger from '../utils/logger.js';

const log = logger;

/**
 * Get feedback entries for curation with pagination and filters
 */
export async function getFeedbackForCuration(orgId, filters = {}) {
  const {
    page = 1,
    limit = 20,
    type,
    minRating,
    maxRating,
    status = 'pending',
    startDate,
    endDate,
  } = filters;

  const offset = (page - 1) * limit;
  const conditions = ['f.organization_id = $1'];
  const params = [orgId];
  let idx = 2;

  if (type) {
    conditions.push(`f.suggestion_type = $${idx++}`);
    params.push(type);
  }
  if (minRating) {
    conditions.push(`f.user_rating >= $${idx++}`);
    params.push(parseInt(minRating));
  }
  if (maxRating) {
    conditions.push(`f.user_rating <= $${idx++}`);
    params.push(parseInt(maxRating));
  }
  if (status && status !== 'all') {
    conditions.push(`f.training_status = $${idx++}`);
    params.push(status);
  }
  if (startDate) {
    conditions.push(`f.created_at >= $${idx++}`);
    params.push(startDate);
  }
  if (endDate) {
    conditions.push(`f.created_at <= $${idx++}`);
    params.push(endDate);
  }

  const where = conditions.join(' AND ');

  const [dataResult, countResult] = await Promise.all([
    query(
      `SELECT f.id, f.suggestion_type, f.original_suggestion, f.user_correction,
              f.accepted, f.correction_type, f.confidence_score, f.user_rating,
              f.feedback_notes, f.model_name, f.training_status,
              f.processed_for_training, f.created_at
       FROM ai_feedback f
       WHERE ${where}
       ORDER BY f.created_at DESC
       LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, limit, offset]
    ),
    query(`SELECT COUNT(*) as total FROM ai_feedback f WHERE ${where}`, params),
  ]);

  return {
    data: dataResult.rows,
    total: parseInt(countResult.rows[0].total),
    page,
    limit,
    totalPages: Math.ceil(parseInt(countResult.rows[0].total) / limit),
  };
}

/**
 * Get aggregate curation statistics
 */
export async function getCurationStats(orgId) {
  const result = await query(
    `SELECT
       COUNT(*) FILTER (WHERE training_status = 'pending') as pending,
       COUNT(*) FILTER (WHERE training_status = 'approved') as approved,
       COUNT(*) FILTER (WHERE training_status = 'rejected') as rejected,
       COUNT(*) FILTER (WHERE training_status = 'exported') as exported,
       COUNT(*) as total
     FROM ai_feedback
     WHERE organization_id = $1`,
    [orgId]
  );

  const byType = await query(
    `SELECT suggestion_type, COUNT(*) as count,
            COUNT(*) FILTER (WHERE training_status = 'pending') as pending
     FROM ai_feedback
     WHERE organization_id = $1
     GROUP BY suggestion_type
     ORDER BY count DESC`,
    [orgId]
  );

  const avgRating = await query(
    `SELECT ROUND(AVG(user_rating)::numeric, 2) as avg_rating
     FROM ai_feedback
     WHERE organization_id = $1 AND user_rating IS NOT NULL`,
    [orgId]
  );

  return {
    ...result.rows[0],
    byType: byType.rows,
    avgRating: avgRating.rows[0]?.avg_rating || null,
  };
}

/**
 * Approve a feedback entry for training
 */
export async function approveFeedback(orgId, id, editedText) {
  const updates = ["training_status = 'approved'", 'updated_at = NOW()'];
  const params = [orgId, id];
  let idx = 3;

  if (editedText !== undefined && editedText !== null) {
    updates.push(`user_correction = $${idx++}`);
    params.push(editedText);
  }

  const result = await query(
    `UPDATE ai_feedback
     SET ${updates.join(', ')}
     WHERE organization_id = $1 AND id = $2
     RETURNING id, training_status`,
    params
  );

  if (result.rows.length === 0) {
    throw new Error('Feedback entry not found');
  }

  log.info('Feedback approved for training', { id });
  return result.rows[0];
}

/**
 * Reject a feedback entry from training
 */
export async function rejectFeedback(orgId, id) {
  const result = await query(
    `UPDATE ai_feedback
     SET training_status = 'rejected', processed_for_training = true, updated_at = NOW()
     WHERE organization_id = $1 AND id = $2
     RETURNING id, training_status`,
    [orgId, id]
  );

  if (result.rows.length === 0) {
    throw new Error('Feedback entry not found');
  }

  log.info('Feedback rejected from training', { id });
  return result.rows[0];
}

/**
 * Bulk approve or reject feedback entries
 */
export async function bulkAction(orgId, ids, action) {
  if (!['approve', 'reject'].includes(action)) {
    throw new Error('Invalid action. Must be "approve" or "reject".');
  }
  if (!ids || ids.length === 0) {
    throw new Error('No IDs provided');
  }

  const status = action === 'approve' ? 'approved' : 'rejected';
  const processedFlag = action === 'reject';

  // Build parameterized IN clause
  const placeholders = ids.map((_, i) => `$${i + 3}`).join(', ');
  const result = await query(
    `UPDATE ai_feedback
     SET training_status = $1, processed_for_training = $2, updated_at = NOW()
     WHERE organization_id = $${ids.length + 3}
       AND id IN (${placeholders})
     RETURNING id`,
    [status, processedFlag, ...ids, orgId]
  );

  log.info(`Bulk ${action} completed`, { count: result.rows.length });
  return { updated: result.rows.length, action };
}

/**
 * Export approved feedback as JSONL training format
 */
export async function exportApprovedAsJsonl(orgId) {
  const result = await query(
    `SELECT suggestion_type, original_suggestion, user_correction,
            confidence_score, model_name, context_data
     FROM ai_feedback
     WHERE organization_id = $1
       AND training_status = 'approved'
       AND processed_for_training = false
     ORDER BY created_at ASC`,
    [orgId]
  );

  const lines = result.rows.map((row) => {
    const prompt = row.context_data?.chief_complaint
      ? `Skriv ${row.suggestion_type} for pasient med ${row.context_data.chief_complaint}`
      : `Generer ${row.suggestion_type}`;

    return JSON.stringify({
      prompt,
      response: row.user_correction || row.original_suggestion,
      metadata: {
        type: row.suggestion_type,
        model: row.model_name,
        confidence: row.confidence_score,
      },
    });
  });

  // Mark exported entries
  if (result.rows.length > 0) {
    await query(
      `UPDATE ai_feedback
       SET training_status = 'exported', processed_for_training = true, updated_at = NOW()
       WHERE organization_id = $1
         AND training_status = 'approved'
         AND processed_for_training = false`,
      [orgId]
    );
  }

  log.info('Exported approved feedback as JSONL', { count: lines.length });
  return { jsonl: lines.join('\n'), count: lines.length };
}
