/**
 * Bulk Communication — Dispatch & Queue Processing
 * Queue creation, processing, rate limiting, and retry logic
 */

import { query } from '../../config/database.js';
import logger from '../../utils/logger.js';
import * as communicationService from './communications.js';
import { v4 as uuidv4 } from 'uuid';
import { personalizeTemplate } from './bulkTemplating.js';

// Rate limiting configuration
const RATE_LIMITS = {
  SMS: { perMinute: 5, perHour: 50, perDay: 200 },
  EMAIL: { perMinute: 10, perHour: 100, perDay: 500 },
};

const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelayMs: [5000, 30000, 120000],
  retryableErrors: ['NETWORK_ERROR', 'TIMEOUT', 'RATE_LIMITED', 'TEMPORARY_FAILURE'],
};

/**
 * Queue bulk communications for a list of patients
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

    let template = null;
    if (templateId) {
      const templateResult = await query(
        `SELECT id, subject, body, type FROM message_templates WHERE id = $1 AND organization_id = $2 AND is_active = true`,
        [templateId, organizationId]
      );
      if (templateResult.rows.length === 0) {
        throw new Error('Template not found or inactive');
      }
      template = templateResult.rows[0];
    }

    const patientsResult = await query(
      `SELECT id, first_name, last_name, email, phone, date_of_birth, last_visit_date, status, consent_sms, consent_email
      FROM patients WHERE organization_id = $1 AND id = ANY($2)`,
      [organizationId, patientIds]
    );
    const patients = patientsResult.rows;

    const validPatients = patients.filter((p) => {
      if (type === 'SMS') {
        return p.phone && p.consent_sms !== false;
      }
      if (type === 'EMAIL') {
        return p.email && p.consent_email !== false;
      }
      return false;
    });
    const skippedPatients = patients.filter((p) => !validPatients.includes(p));

    await query(
      `INSERT INTO bulk_communication_batches (id, organization_id, template_id, type, status, total_count, pending_count, scheduled_at, priority, created_by, custom_subject, custom_message, clinic_info)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
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

    const queueItems = validPatients.map((patient) => {
      const messageContent = customMessage || template?.body || '';
      const subject = customSubject || template?.subject || '';
      return {
        batchId,
        patientId: patient.id,
        type,
        recipientPhone: type === 'SMS' ? patient.phone : null,
        recipientEmail: type === 'EMAIL' ? patient.email : null,
        subject: personalizeTemplate(subject, patient, clinicInfo),
        content: personalizeTemplate(messageContent, patient, clinicInfo),
        scheduledAt,
      };
    });

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
        `INSERT INTO bulk_communication_queue (batch_id, patient_id, type, recipient_phone, recipient_email, subject, content, scheduled_at) VALUES ${values.join(', ')}`,
        params
      );
    }

    if (skippedPatients.length > 0) {
      await query(
        `INSERT INTO bulk_communication_skipped (batch_id, patient_id, reason) SELECT $1, unnest($2::uuid[]), $3`,
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
 * Process pending items in the communication queue
 */
export const processCommunicationQueue = async (batchSize = 10) => {
  const processedItems = [];
  const failedItems = [];
  let processedCount = 0;

  try {
    const pendingResult = await query(
      `SELECT q.*, b.organization_id, b.type as batch_type, b.clinic_info
      FROM bulk_communication_queue q
      JOIN bulk_communication_batches b ON b.id = q.batch_id
      WHERE q.status = 'PENDING' AND (q.scheduled_at IS NULL OR q.scheduled_at <= NOW())
        AND q.retry_count < $1 AND b.status IN ('PENDING', 'PROCESSING', 'SCHEDULED')
      ORDER BY CASE b.priority WHEN 'HIGH' THEN 1 WHEN 'NORMAL' THEN 2 WHEN 'LOW' THEN 3 END,
        q.created_at ASC LIMIT $2 FOR UPDATE SKIP LOCKED`,
      [RETRY_CONFIG.maxRetries, batchSize]
    );

    if (pendingResult.rows.length === 0) {
      return { processed: 0, failed: 0, message: 'No pending items to process' };
    }

    const canProcess = await checkRateLimits(pendingResult.rows[0].organization_id);
    if (!canProcess) {
      logger.info('Rate limit reached, skipping processing');
      return { processed: 0, failed: 0, message: 'Rate limit reached, will retry later' };
    }

    const batchIds = [...new Set(pendingResult.rows.map((r) => r.batch_id))];
    await query(
      `UPDATE bulk_communication_batches SET status = 'PROCESSING', started_at = COALESCE(started_at, NOW()) WHERE id = ANY($1) AND status != 'PROCESSING'`,
      [batchIds]
    );

    for (const item of pendingResult.rows) {
      try {
        await query(
          `UPDATE bulk_communication_queue SET status = 'PROCESSING', processed_at = NOW() WHERE id = $1`,
          [item.id]
        );

        let result;
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

        await query(
          `UPDATE bulk_communication_queue SET status = 'SENT', sent_at = NOW(), external_id = $2 WHERE id = $1`,
          [item.id, result?.external_id || result?.id]
        );
        processedItems.push(item.id);
        processedCount++;
        await sleep(200);
      } catch (error) {
        logger.error('Error processing queue item:', { itemId: item.id, error: error.message });
        const isRetryable = RETRY_CONFIG.retryableErrors.some(
          (e) => error.message?.includes(e) || error.code?.includes(e)
        );
        if (isRetryable && item.retry_count < RETRY_CONFIG.maxRetries - 1) {
          const nextRetryAt = new Date(Date.now() + RETRY_CONFIG.retryDelayMs[item.retry_count]);
          await query(
            `UPDATE bulk_communication_queue SET status = 'PENDING', retry_count = retry_count + 1, last_error = $2, scheduled_at = $3 WHERE id = $1`,
            [item.id, error.message, nextRetryAt]
          );
        } else {
          await query(
            `UPDATE bulk_communication_queue SET status = 'FAILED', failed_at = NOW(), last_error = $2 WHERE id = $1`,
            [item.id, error.message]
          );
          failedItems.push(item.id);
        }
      }
    }

    for (const batchId of batchIds) {
      await updateBatchStatistics(batchId);
    }
    logger.info('Queue processing completed', {
      processed: processedCount,
      failed: failedItems.length,
    });
    return { processed: processedCount, failed: failedItems.length, processedItems, failedItems };
  } catch (error) {
    logger.error('Error in processCommunicationQueue:', error);
    throw error;
  }
};

// Helper functions

async function checkRateLimits(organizationId) {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const result = await query(
    `SELECT COUNT(*) FILTER (WHERE sent_at >= $2) as hour_count, COUNT(*) FILTER (WHERE sent_at >= $3) as day_count
    FROM bulk_communication_queue q JOIN bulk_communication_batches b ON b.id = q.batch_id
    WHERE b.organization_id = $1 AND q.status = 'SENT'`,
    [organizationId, oneHourAgo, oneDayAgo]
  );
  const { hour_count, day_count } = result.rows[0];
  const totalLimit = RATE_LIMITS.SMS.perHour + RATE_LIMITS.EMAIL.perHour;
  const dayLimit = RATE_LIMITS.SMS.perDay + RATE_LIMITS.EMAIL.perDay;
  return parseInt(hour_count) < totalLimit && parseInt(day_count) < dayLimit;
}

async function updateBatchStatistics(batchId) {
  const statsResult = await query(
    `SELECT COUNT(*) FILTER (WHERE status = 'SENT') as sent, COUNT(*) FILTER (WHERE status = 'FAILED') as failed,
     COUNT(*) FILTER (WHERE status = 'PENDING') as pending, COUNT(*) FILTER (WHERE status = 'PROCESSING') as processing
    FROM bulk_communication_queue WHERE batch_id = $1`,
    [batchId]
  );
  const stats = statsResult.rows[0];
  const allCompleted = parseInt(stats.pending) === 0 && parseInt(stats.processing) === 0;
  let newStatus = 'PROCESSING';
  if (allCompleted) {
    newStatus = parseInt(stats.failed) > 0 ? 'COMPLETED_WITH_ERRORS' : 'COMPLETED';
  }

  await query(
    `UPDATE bulk_communication_batches SET sent_count = $2, failed_count = $3, pending_count = $4, status = $5,
     completed_at = CASE WHEN $5 IN ('COMPLETED', 'COMPLETED_WITH_ERRORS') THEN NOW() ELSE completed_at END WHERE id = $1`,
    [batchId, stats.sent, stats.failed, stats.pending, newStatus]
  );
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
