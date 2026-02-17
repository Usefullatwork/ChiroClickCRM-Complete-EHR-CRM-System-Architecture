/**
 * Bulk Communication Service
 * Handles queuing, processing, and tracking of bulk SMS/Email communications
 * Supports personalization, rate limiting, and retry logic
 */

import { query } from '../config/database.js';
import logger from '../utils/logger.js';
import * as communicationService from './communications.js';
import { v4 as uuidv4 } from 'uuid';

// Rate limiting configuration
const RATE_LIMITS = {
  SMS: {
    perMinute: 5,
    perHour: 50,
    perDay: 200,
  },
  EMAIL: {
    perMinute: 10,
    perHour: 100,
    perDay: 500,
  },
};

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelayMs: [5000, 30000, 120000], // 5s, 30s, 2min
  retryableErrors: ['NETWORK_ERROR', 'TIMEOUT', 'RATE_LIMITED', 'TEMPORARY_FAILURE'],
};

// Available template variables
const TEMPLATE_VARIABLES = {
  '{firstName}': (patient) => patient.first_name || '',
  '{lastName}': (patient) => patient.last_name || '',
  '{fullName}': (patient) => `${patient.first_name || ''} ${patient.last_name || ''}`.trim(),
  '{phone}': (patient) => patient.phone || '',
  '{email}': (patient) => patient.email || '',
  '{dateOfBirth}': (patient) =>
    patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString('nb-NO') : '',
  '{lastVisit}': (patient) =>
    patient.last_visit_date ? new Date(patient.last_visit_date).toLocaleDateString('nb-NO') : '',
  '{nextAppointment}': (patient) =>
    patient.next_appointment ? new Date(patient.next_appointment).toLocaleDateString('nb-NO') : '',
  '{clinicName}': (patient, clinic) => clinic?.name || '',
  '{clinicPhone}': (patient, clinic) => clinic?.phone || '',
  '{clinicEmail}': (patient, clinic) => clinic?.email || '',
  '{clinicAddress}': (patient, clinic) => clinic?.address || '',
  '{today}': () => new Date().toLocaleDateString('nb-NO'),
  '{currentYear}': () => new Date().getFullYear().toString(),
};

/**
 * Queue bulk communications for a list of patients
 * @param {string} organizationId - Organization ID
 * @param {string[]} patientIds - Array of patient IDs
 * @param {string} templateId - Message template ID
 * @param {string} type - Communication type (SMS or EMAIL)
 * @param {object} options - Additional options
 * @returns {Promise<object>} Batch information
 */
export const queueBulkCommunications = async (
  organizationId,
  patientIds,
  templateId,
  type,
  options = {}
) => {
  const {
    scheduledAt = null,
    priority = 'NORMAL',
    userId,
    customSubject = null,
    customMessage = null,
    clinicInfo = {},
  } = options;

  const batchId = uuidv4();

  try {
    logger.info('Queuing bulk communications', {
      organizationId,
      batchId,
      patientCount: patientIds.length,
      type,
      templateId,
    });

    // Get template if templateId provided
    let template = null;
    if (templateId) {
      const templateResult = await query(
        `SELECT * FROM message_templates WHERE id = $1 AND organization_id = $2 AND is_active = true`,
        [templateId, organizationId]
      );
      if (templateResult.rows.length === 0) {
        throw new Error('Template not found or inactive');
      }
      template = templateResult.rows[0];
    }

    // Get patient details
    const patientsResult = await query(
      `SELECT
        id, first_name, last_name, email, phone, date_of_birth,
        last_visit_date, status, consent_sms, consent_email
      FROM patients
      WHERE organization_id = $1 AND id = ANY($2)`,
      [organizationId, patientIds]
    );

    const patients = patientsResult.rows;

    // Validate patients have required contact info and consent
    const validPatients = patients.filter((patient) => {
      if (type === 'SMS') {
        return patient.phone && patient.consent_sms !== false;
      } else if (type === 'EMAIL') {
        return patient.email && patient.consent_email !== false;
      }
      return false;
    });

    const skippedPatients = patients.filter((patient) => !validPatients.includes(patient));

    // Create batch record
    await query(
      `INSERT INTO bulk_communication_batches (
        id, organization_id, template_id, type, status,
        total_count, pending_count, scheduled_at, priority,
        created_by, custom_subject, custom_message, clinic_info
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        batchId,
        organizationId,
        templateId,
        type,
        scheduledAt ? 'SCHEDULED' : 'PENDING',
        validPatients.length,
        validPatients.length,
        scheduledAt,
        priority,
        userId,
        customSubject,
        customMessage,
        JSON.stringify(clinicInfo),
      ]
    );

    // Queue individual communications
    const queueItems = validPatients.map((patient) => {
      const messageContent = customMessage || template?.body || '';
      const subject = customSubject || template?.subject || '';
      const personalizedContent = personalizeTemplate(messageContent, patient, clinicInfo);
      const personalizedSubject = personalizeTemplate(subject, patient, clinicInfo);

      return {
        batchId,
        patientId: patient.id,
        type,
        recipientPhone: type === 'SMS' ? patient.phone : null,
        recipientEmail: type === 'EMAIL' ? patient.email : null,
        subject: personalizedSubject,
        content: personalizedContent,
        scheduledAt,
      };
    });

    // Insert queue items in batches of 100
    const chunkSize = 100;
    for (let i = 0; i < queueItems.length; i += chunkSize) {
      const chunk = queueItems.slice(i, i + chunkSize);
      const values = chunk.map((item, idx) => {
        const offset = i + idx;
        return `($${offset * 8 + 1}, $${offset * 8 + 2}, $${offset * 8 + 3}, $${offset * 8 + 4}, $${offset * 8 + 5}, $${offset * 8 + 6}, $${offset * 8 + 7}, $${offset * 8 + 8})`;
      });

      const params = chunk.flatMap((item) => [
        batchId,
        item.patientId,
        item.type,
        item.recipientPhone,
        item.recipientEmail,
        item.subject,
        item.content,
        item.scheduledAt,
      ]);

      await query(
        `INSERT INTO bulk_communication_queue (
          batch_id, patient_id, type, recipient_phone, recipient_email,
          subject, content, scheduled_at
        ) VALUES ${values.join(', ')}`,
        params
      );
    }

    // Log skipped patients
    if (skippedPatients.length > 0) {
      await query(
        `INSERT INTO bulk_communication_skipped (
          batch_id, patient_id, reason
        ) SELECT $1, unnest($2::uuid[]), $3`,
        [
          batchId,
          skippedPatients.map((p) => p.id),
          type === 'SMS' ? 'Missing phone or SMS consent' : 'Missing email or email consent',
        ]
      );
    }

    logger.info('Bulk communications queued', {
      batchId,
      queued: validPatients.length,
      skipped: skippedPatients.length,
    });

    return {
      batchId,
      status: scheduledAt ? 'SCHEDULED' : 'PENDING',
      totalCount: validPatients.length,
      skippedCount: skippedPatients.length,
      skippedPatients: skippedPatients.map((p) => ({
        id: p.id,
        name: `${p.first_name} ${p.last_name}`,
        reason:
          type === 'SMS'
            ? 'Mangler telefon eller SMS-samtykke'
            : 'Mangler e-post eller e-postsamtykke',
      })),
      scheduledAt,
    };
  } catch (error) {
    logger.error('Error queuing bulk communications:', error);
    throw error;
  }
};

/**
 * Personalize template with patient variables
 * @param {string} template - Template text with variables
 * @param {object} patient - Patient data
 * @param {object} clinicInfo - Clinic information
 * @returns {string} Personalized message
 */
export const personalizeTemplate = (template, patient, clinicInfo = {}) => {
  if (!template) {
    return '';
  }

  let result = template;

  for (const [variable, resolver] of Object.entries(TEMPLATE_VARIABLES)) {
    if (result.includes(variable)) {
      try {
        const value = resolver(patient, clinicInfo);
        result = result.replace(new RegExp(variable.replace(/[{}]/g, '\\$&'), 'g'), value);
      } catch (error) {
        logger.warn('Error resolving template variable:', { variable, error: error.message });
        result = result.replace(new RegExp(variable.replace(/[{}]/g, '\\$&'), 'g'), '');
      }
    }
  }

  return result;
};

/**
 * Process pending items in the communication queue
 * @param {number} batchSize - Number of items to process per run
 * @returns {Promise<object>} Processing result
 */
export const processCommunicationQueue = async (batchSize = 10) => {
  const processedItems = [];
  const failedItems = [];
  let processedCount = 0;

  try {
    // Get pending items that are ready to send
    const pendingResult = await query(
      `SELECT q.*, b.organization_id, b.type as batch_type, b.clinic_info
      FROM bulk_communication_queue q
      JOIN bulk_communication_batches b ON b.id = q.batch_id
      WHERE q.status = 'PENDING'
        AND (q.scheduled_at IS NULL OR q.scheduled_at <= NOW())
        AND q.retry_count < $1
        AND b.status IN ('PENDING', 'PROCESSING', 'SCHEDULED')
      ORDER BY
        CASE b.priority
          WHEN 'HIGH' THEN 1
          WHEN 'NORMAL' THEN 2
          WHEN 'LOW' THEN 3
        END,
        q.created_at ASC
      LIMIT $2
      FOR UPDATE SKIP LOCKED`,
      [RETRY_CONFIG.maxRetries, batchSize]
    );

    if (pendingResult.rows.length === 0) {
      return { processed: 0, failed: 0, message: 'No pending items to process' };
    }

    // Check rate limits before processing
    const canProcess = await checkRateLimits(pendingResult.rows[0].organization_id);
    if (!canProcess) {
      logger.info('Rate limit reached, skipping processing');
      return { processed: 0, failed: 0, message: 'Rate limit reached, will retry later' };
    }

    // Update batch status to PROCESSING
    const batchIds = [...new Set(pendingResult.rows.map((r) => r.batch_id))];
    await query(
      `UPDATE bulk_communication_batches
      SET status = 'PROCESSING', started_at = COALESCE(started_at, NOW())
      WHERE id = ANY($1) AND status != 'PROCESSING'`,
      [batchIds]
    );

    // Process each item
    for (const item of pendingResult.rows) {
      try {
        // Mark as processing
        await query(
          `UPDATE bulk_communication_queue SET status = 'PROCESSING', processed_at = NOW() WHERE id = $1`,
          [item.id]
        );

        // Send the communication
        let result;
        const _clinicInfo =
          typeof item.clinic_info === 'string'
            ? JSON.parse(item.clinic_info)
            : item.clinic_info || {};

        if (item.type === 'SMS') {
          result = await communicationService.sendSMS(
            item.organization_id,
            {
              patient_id: item.patient_id,
              recipient_phone: item.recipient_phone,
              content: item.content,
              template_id: null,
            },
            null
          );
        } else if (item.type === 'EMAIL') {
          result = await communicationService.sendEmail(
            item.organization_id,
            {
              patient_id: item.patient_id,
              recipient_email: item.recipient_email,
              subject: item.subject,
              content: item.content,
              template_id: null,
            },
            null
          );
        }

        // Mark as sent
        await query(
          `UPDATE bulk_communication_queue
          SET status = 'SENT', sent_at = NOW(), external_id = $2
          WHERE id = $1`,
          [item.id, result?.external_id || result?.id]
        );

        processedItems.push(item.id);
        processedCount++;

        // Add delay between sends to respect rate limits
        await sleep(200);
      } catch (error) {
        logger.error('Error processing queue item:', {
          itemId: item.id,
          error: error.message,
        });

        const isRetryable = RETRY_CONFIG.retryableErrors.some(
          (e) => error.message?.includes(e) || error.code?.includes(e)
        );

        if (isRetryable && item.retry_count < RETRY_CONFIG.maxRetries - 1) {
          // Schedule retry
          const nextRetryAt = new Date(Date.now() + RETRY_CONFIG.retryDelayMs[item.retry_count]);
          await query(
            `UPDATE bulk_communication_queue
            SET status = 'PENDING', retry_count = retry_count + 1,
                last_error = $2, scheduled_at = $3
            WHERE id = $1`,
            [item.id, error.message, nextRetryAt]
          );
        } else {
          // Mark as failed
          await query(
            `UPDATE bulk_communication_queue
            SET status = 'FAILED', failed_at = NOW(), last_error = $2
            WHERE id = $1`,
            [item.id, error.message]
          );
          failedItems.push(item.id);
        }
      }
    }

    // Update batch statistics
    for (const batchId of batchIds) {
      await updateBatchStatistics(batchId);
    }

    logger.info('Queue processing completed', {
      processed: processedCount,
      failed: failedItems.length,
    });

    return {
      processed: processedCount,
      failed: failedItems.length,
      processedItems,
      failedItems,
    };
  } catch (error) {
    logger.error('Error in processCommunicationQueue:', error);
    throw error;
  }
};

/**
 * Get status of a specific batch
 * @param {string} organizationId - Organization ID
 * @param {string} batchId - Batch ID
 * @returns {Promise<object>} Batch status details
 */
export const getQueueStatus = async (organizationId, batchId) => {
  try {
    // Get batch info
    const batchResult = await query(
      `SELECT * FROM bulk_communication_batches WHERE id = $1 AND organization_id = $2`,
      [batchId, organizationId]
    );

    if (batchResult.rows.length === 0) {
      throw new Error('Batch not found');
    }

    const batch = batchResult.rows[0];

    // Get queue item statistics
    const statsResult = await query(
      `SELECT
        status,
        COUNT(*) as count
      FROM bulk_communication_queue
      WHERE batch_id = $1
      GROUP BY status`,
      [batchId]
    );

    const stats = {
      pending: 0,
      processing: 0,
      sent: 0,
      failed: 0,
      total: 0,
    };

    statsResult.rows.forEach((row) => {
      stats[row.status.toLowerCase()] = parseInt(row.count);
      stats.total += parseInt(row.count);
    });

    // Get skipped patients
    const skippedResult = await query(
      `SELECT s.patient_id, s.reason, p.first_name, p.last_name
      FROM bulk_communication_skipped s
      JOIN patients p ON p.id = s.patient_id
      WHERE s.batch_id = $1`,
      [batchId]
    );

    // Get recent failed items
    const failedResult = await query(
      `SELECT q.patient_id, q.last_error, q.failed_at, p.first_name, p.last_name
      FROM bulk_communication_queue q
      JOIN patients p ON p.id = q.patient_id
      WHERE q.batch_id = $1 AND q.status = 'FAILED'
      ORDER BY q.failed_at DESC
      LIMIT 10`,
      [batchId]
    );

    // Calculate progress percentage
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
 * @param {string} organizationId - Organization ID
 * @param {string} batchId - Batch ID
 * @returns {Promise<object>} Cancellation result
 */
export const cancelBatch = async (organizationId, batchId) => {
  try {
    // Verify batch belongs to organization
    const batchResult = await query(
      `SELECT * FROM bulk_communication_batches WHERE id = $1 AND organization_id = $2`,
      [batchId, organizationId]
    );

    if (batchResult.rows.length === 0) {
      throw new Error('Batch not found');
    }

    const batch = batchResult.rows[0];

    if (['COMPLETED', 'CANCELLED'].includes(batch.status)) {
      throw new Error(`Cannot cancel batch with status ${batch.status}`);
    }

    // Count items to be cancelled
    const pendingCountResult = await query(
      `SELECT COUNT(*) FROM bulk_communication_queue
      WHERE batch_id = $1 AND status IN ('PENDING', 'PROCESSING')`,
      [batchId]
    );
    const pendingCount = parseInt(pendingCountResult.rows[0].count);

    // Cancel pending queue items
    await query(
      `UPDATE bulk_communication_queue
      SET status = 'CANCELLED', cancelled_at = NOW()
      WHERE batch_id = $1 AND status IN ('PENDING', 'PROCESSING')`,
      [batchId]
    );

    // Update batch status
    await query(
      `UPDATE bulk_communication_batches
      SET status = 'CANCELLED', completed_at = NOW()
      WHERE id = $1`,
      [batchId]
    );

    logger.info('Batch cancelled', {
      batchId,
      cancelledItems: pendingCount,
    });

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
 * @param {string} organizationId - Organization ID
 * @param {object} options - Filter options
 * @returns {Promise<object>} Pending items with pagination
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

    // Get count
    const countResult = await query(
      `SELECT COUNT(*) FROM bulk_communication_queue q
      JOIN bulk_communication_batches b ON b.id = q.batch_id
      ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get items
    params.push(limit, offset);
    const result = await query(
      `SELECT
        q.*,
        b.type as batch_type,
        b.priority,
        p.first_name,
        p.last_name,
        p.phone,
        p.email
      FROM bulk_communication_queue q
      JOIN bulk_communication_batches b ON b.id = q.batch_id
      JOIN patients p ON p.id = q.patient_id
      ${whereClause}
      ORDER BY q.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
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
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Error getting pending queue:', error);
    throw error;
  }
};

/**
 * Get all batches for an organization
 * @param {string} organizationId - Organization ID
 * @param {object} options - Filter options
 * @returns {Promise<object>} Batches with pagination
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

    // Get count
    const countResult = await query(
      `SELECT COUNT(*) FROM bulk_communication_batches ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get batches with statistics
    params.push(limit, offset);
    const result = await query(
      `SELECT
        b.*,
        (SELECT COUNT(*) FROM bulk_communication_queue WHERE batch_id = b.id AND status = 'SENT') as sent_count,
        (SELECT COUNT(*) FROM bulk_communication_queue WHERE batch_id = b.id AND status = 'FAILED') as failed_count,
        (SELECT COUNT(*) FROM bulk_communication_queue WHERE batch_id = b.id AND status = 'PENDING') as pending_count,
        u.first_name || ' ' || u.last_name as created_by_name
      FROM bulk_communication_batches b
      LEFT JOIN users u ON u.id = b.created_by
      ${whereClause}
      ORDER BY b.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
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
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Error getting batches:', error);
    throw error;
  }
};

/**
 * Preview personalized message for a patient
 * @param {string} organizationId - Organization ID
 * @param {string} patientId - Patient ID
 * @param {string} templateContent - Template content with variables
 * @param {object} clinicInfo - Clinic information
 * @returns {Promise<object>} Preview result
 */
export const previewMessage = async (
  organizationId,
  patientId,
  templateContent,
  clinicInfo = {}
) => {
  try {
    const patientResult = await query(
      `SELECT * FROM patients WHERE id = $1 AND organization_id = $2`,
      [patientId, organizationId]
    );

    if (patientResult.rows.length === 0) {
      throw new Error('Patient not found');
    }

    const patient = patientResult.rows[0];
    const personalizedContent = personalizeTemplate(templateContent, patient, clinicInfo);

    return {
      patientId,
      patientName: `${patient.first_name} ${patient.last_name}`,
      originalContent: templateContent,
      personalizedContent,
      characterCount: personalizedContent.length,
      smsSegments: Math.ceil(personalizedContent.length / 160),
    };
  } catch (error) {
    logger.error('Error previewing message:', error);
    throw error;
  }
};

// Helper functions

/**
 * Check rate limits for sending
 */
async function checkRateLimits(organizationId) {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const result = await query(
    `SELECT
      COUNT(*) FILTER (WHERE sent_at >= $2) as hour_count,
      COUNT(*) FILTER (WHERE sent_at >= $3) as day_count
    FROM bulk_communication_queue q
    JOIN bulk_communication_batches b ON b.id = q.batch_id
    WHERE b.organization_id = $1 AND q.status = 'SENT'`,
    [organizationId, oneHourAgo, oneDayAgo]
  );

  const { hour_count, day_count } = result.rows[0];
  const totalLimit = RATE_LIMITS.SMS.perHour + RATE_LIMITS.EMAIL.perHour;
  const dayLimit = RATE_LIMITS.SMS.perDay + RATE_LIMITS.EMAIL.perDay;

  return parseInt(hour_count) < totalLimit && parseInt(day_count) < dayLimit;
}

/**
 * Update batch statistics after processing
 */
async function updateBatchStatistics(batchId) {
  const statsResult = await query(
    `SELECT
      COUNT(*) FILTER (WHERE status = 'SENT') as sent,
      COUNT(*) FILTER (WHERE status = 'FAILED') as failed,
      COUNT(*) FILTER (WHERE status = 'PENDING') as pending,
      COUNT(*) FILTER (WHERE status = 'PROCESSING') as processing,
      COUNT(*) as total
    FROM bulk_communication_queue
    WHERE batch_id = $1`,
    [batchId]
  );

  const stats = statsResult.rows[0];
  const allCompleted = parseInt(stats.pending) === 0 && parseInt(stats.processing) === 0;

  let newStatus = 'PROCESSING';
  if (allCompleted) {
    newStatus = parseInt(stats.failed) > 0 ? 'COMPLETED_WITH_ERRORS' : 'COMPLETED';
  }

  await query(
    `UPDATE bulk_communication_batches
    SET
      sent_count = $2,
      failed_count = $3,
      pending_count = $4,
      status = $5,
      completed_at = CASE WHEN $5 IN ('COMPLETED', 'COMPLETED_WITH_ERRORS') THEN NOW() ELSE completed_at END
    WHERE id = $1`,
    [batchId, stats.sent, stats.failed, stats.pending, newStatus]
  );
}

/**
 * Estimate completion time based on pending count and rate limits
 */
function estimateCompletionTime(pendingCount, type) {
  if (pendingCount === 0) {
    return null;
  }

  const ratePerMinute = type === 'SMS' ? RATE_LIMITS.SMS.perMinute : RATE_LIMITS.EMAIL.perMinute;
  const minutes = Math.ceil(pendingCount / ratePerMinute);

  return new Date(Date.now() + minutes * 60 * 1000);
}

/**
 * Sleep helper for rate limiting
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Get available template variables
 */
export const getAvailableVariables = () =>
  Object.keys(TEMPLATE_VARIABLES).map((variable) => ({
    variable,
    description: getVariableDescription(variable),
  }));

function getVariableDescription(variable) {
  const descriptions = {
    '{firstName}': 'Pasientens fornavn',
    '{lastName}': 'Pasientens etternavn',
    '{fullName}': 'Pasientens fulle navn',
    '{phone}': 'Pasientens telefonnummer',
    '{email}': 'Pasientens e-postadresse',
    '{dateOfBirth}': 'Pasientens fodselsdato',
    '{lastVisit}': 'Dato for siste besok',
    '{nextAppointment}': 'Dato for neste avtale',
    '{clinicName}': 'Klinikkens navn',
    '{clinicPhone}': 'Klinikkens telefonnummer',
    '{clinicEmail}': 'Klinikkens e-postadresse',
    '{clinicAddress}': 'Klinikkens adresse',
    '{today}': 'Dagens dato',
    '{currentYear}': 'Innevarende ar',
  };
  return descriptions[variable] || variable;
}

export default {
  queueBulkCommunications,
  processCommunicationQueue,
  getQueueStatus,
  cancelBatch,
  getPendingQueue,
  getBatches,
  previewMessage,
  personalizeTemplate,
  getAvailableVariables,
};
