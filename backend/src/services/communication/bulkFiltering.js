/**
 * Bulk Communication — Filtering & Queue Management
 * Queue status, batch management, pending queue, and batch listing
 */

import { query } from '../../config/database.js';
import logger from '../../utils/logger.js';

/**
 * Get status of a specific batch
 */
export const getQueueStatus = async (organizationId, batchId) => {
  try {
    const batchResult = await query(
      `SELECT id, status, type, priority, created_at, scheduled_at, started_at, completed_at, total_count
       FROM bulk_communication_batches WHERE id = $1 AND organization_id = $2`,
      [batchId, organizationId]
    );

    if (batchResult.rows.length === 0) {
      throw new Error('Batch not found');
    }
    const batch = batchResult.rows[0];

    const statsResult = await query(
      `SELECT status, COUNT(*) as count FROM bulk_communication_queue WHERE batch_id = $1 GROUP BY status`,
      [batchId]
    );

    const stats = { pending: 0, processing: 0, sent: 0, failed: 0, total: 0 };
    statsResult.rows.forEach((row) => {
      stats[row.status.toLowerCase()] = parseInt(row.count);
      stats.total += parseInt(row.count);
    });

    const skippedResult = await query(
      `SELECT s.patient_id, s.reason, p.first_name, p.last_name
      FROM bulk_communication_skipped s JOIN patients p ON p.id = s.patient_id WHERE s.batch_id = $1`,
      [batchId]
    );

    const failedResult = await query(
      `SELECT q.patient_id, q.last_error, q.failed_at, p.first_name, p.last_name
      FROM bulk_communication_queue q JOIN patients p ON p.id = q.patient_id
      WHERE q.batch_id = $1 AND q.status = 'FAILED' ORDER BY q.failed_at DESC LIMIT 10`,
      [batchId]
    );

    const progressPercentage =
      stats.total > 0 ? Math.round(((stats.sent + stats.failed) / stats.total) * 100) : 0;

    return {
      batchId: batch.id,
      status: batch.status,
      type: batch.type,
      priority: batch.priority,
      createdAt: batch.created_at,
      scheduledAt: batch.scheduled_at,
      startedAt: batch.started_at,
      completedAt: batch.completed_at,
      totalCount: batch.total_count,
      stats,
      progressPercentage,
      skippedPatients: skippedResult.rows.map((r) => ({
        id: r.patient_id,
        name: `${r.first_name} ${r.last_name}`,
        reason: r.reason,
      })),
      recentFailures: failedResult.rows.map((r) => ({
        patientId: r.patient_id,
        name: `${r.first_name} ${r.last_name}`,
        error: r.last_error,
        failedAt: r.failed_at,
      })),
      estimatedCompletionTime: estimateCompletionTime(stats.pending, batch.type),
    };
  } catch (error) {
    logger.error('Error getting queue status:', error);
    throw error;
  }
};

/**
 * Cancel a batch and all pending items
 */
export const cancelBatch = async (organizationId, batchId) => {
  try {
    const batchResult = await query(
      `SELECT id, status FROM bulk_communication_batches WHERE id = $1 AND organization_id = $2`,
      [batchId, organizationId]
    );
    if (batchResult.rows.length === 0) {
      throw new Error('Batch not found');
    }

    const batch = batchResult.rows[0];
    if (['COMPLETED', 'CANCELLED'].includes(batch.status)) {
      throw new Error(`Cannot cancel batch with status ${batch.status}`);
    }

    const pendingCountResult = await query(
      `SELECT COUNT(*) FROM bulk_communication_queue WHERE batch_id = $1 AND status IN ('PENDING', 'PROCESSING')`,
      [batchId]
    );
    const pendingCount = parseInt(pendingCountResult.rows[0].count);

    await query(
      `UPDATE bulk_communication_queue SET status = 'CANCELLED', cancelled_at = NOW() WHERE batch_id = $1 AND status IN ('PENDING', 'PROCESSING')`,
      [batchId]
    );
    await query(
      `UPDATE bulk_communication_batches SET status = 'CANCELLED', completed_at = NOW() WHERE id = $1`,
      [batchId]
    );

    logger.info('Batch cancelled', { batchId, cancelledItems: pendingCount });
    return {
      batchId,
      status: 'CANCELLED',
      cancelledItems: pendingCount,
      message: `Batch cancelled. ${pendingCount} pending items were cancelled.`,
    };
  } catch (error) {
    logger.error('Error cancelling batch:', error);
    throw error;
  }
};

/**
 * Get all pending queue items for an organization
 */
export const getPendingQueue = async (organizationId, options = {}) => {
  const { page = 1, limit = 20, status = null, batchId = null } = options;
  const offset = (page - 1) * limit;

  try {
    let whereClause = 'WHERE b.organization_id = $1';
    const params = [organizationId];
    let paramIndex = 2;

    if (status) {
      params.push(status);
      whereClause += ` AND q.status = $${paramIndex}`;
      paramIndex++;
    }
    if (batchId) {
      params.push(batchId);
      whereClause += ` AND q.batch_id = $${paramIndex}`;
      paramIndex++;
    }

    const countResult = await query(
      `SELECT COUNT(*) FROM bulk_communication_queue q JOIN bulk_communication_batches b ON b.id = q.batch_id ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    params.push(limit, offset);
    const result = await query(
      `SELECT q.*, b.type as batch_type, b.priority, p.first_name, p.last_name, p.phone, p.email
      FROM bulk_communication_queue q
      JOIN bulk_communication_batches b ON b.id = q.batch_id
      JOIN patients p ON p.id = q.patient_id
      ${whereClause} ORDER BY q.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    return {
      items: result.rows.map((row) => ({
        id: row.id,
        batchId: row.batch_id,
        patientId: row.patient_id,
        patientName: `${row.first_name} ${row.last_name}`,
        type: row.type,
        status: row.status,
        recipient: row.type === 'SMS' ? row.recipient_phone : row.recipient_email,
        content: row.content,
        subject: row.subject,
        scheduledAt: row.scheduled_at,
        sentAt: row.sent_at,
        failedAt: row.failed_at,
        retryCount: row.retry_count,
        lastError: row.last_error,
        priority: row.priority,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  } catch (error) {
    logger.error('Error getting pending queue:', error);
    throw error;
  }
};

/**
 * Get all batches for an organization
 */
export const getBatches = async (organizationId, options = {}) => {
  const { page = 1, limit = 20, status = null } = options;
  const offset = (page - 1) * limit;

  try {
    let whereClause = 'WHERE organization_id = $1';
    const params = [organizationId];
    let paramIndex = 2;
    if (status) {
      params.push(status);
      whereClause += ` AND status = $${paramIndex}`;
      paramIndex++;
    }

    const countResult = await query(
      `SELECT COUNT(*) FROM bulk_communication_batches ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    params.push(limit, offset);
    const result = await query(
      `SELECT b.*,
        (SELECT COUNT(*) FROM bulk_communication_queue WHERE batch_id = b.id AND status = 'SENT') as sent_count,
        (SELECT COUNT(*) FROM bulk_communication_queue WHERE batch_id = b.id AND status = 'FAILED') as failed_count,
        (SELECT COUNT(*) FROM bulk_communication_queue WHERE batch_id = b.id AND status = 'PENDING') as pending_count,
        u.first_name || ' ' || u.last_name as created_by_name
      FROM bulk_communication_batches b LEFT JOIN users u ON u.id = b.created_by
      ${whereClause} ORDER BY b.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    return {
      batches: result.rows.map((row) => ({
        id: row.id,
        type: row.type,
        status: row.status,
        priority: row.priority,
        totalCount: row.total_count,
        sentCount: parseInt(row.sent_count),
        failedCount: parseInt(row.failed_count),
        pendingCount: parseInt(row.pending_count),
        createdAt: row.created_at,
        scheduledAt: row.scheduled_at,
        startedAt: row.started_at,
        completedAt: row.completed_at,
        createdByName: row.created_by_name,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  } catch (error) {
    logger.error('Error getting batches:', error);
    throw error;
  }
};

/**
 * Estimate completion time based on pending count and rate limits
 */
function estimateCompletionTime(pendingCount, type) {
  if (pendingCount === 0) {
    return null;
  }
  const RATE_LIMITS = { SMS: { perMinute: 5 }, EMAIL: { perMinute: 10 } };
  const ratePerMinute = type === 'SMS' ? RATE_LIMITS.SMS.perMinute : RATE_LIMITS.EMAIL.perMinute;
  const minutes = Math.ceil(pendingCount / ratePerMinute);
  return new Date(Date.now() + minutes * 60 * 1000);
}
