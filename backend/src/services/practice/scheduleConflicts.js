/**
 * Schedule Conflicts — Decision management for scheduling conflicts.
 *
 * @module services/practice/scheduleConflicts
 */

import { query } from '../../config/database.js';
import logger from '../../utils/logger.js';

/**
 * Get pending decisions for user
 */
export async function getPendingDecisions(organizationId) {
  const result = await query(
    `
    SELECT
      sd.*,
      sc.communication_type,
      sc.trigger_type,
      sc.custom_message,
      p.first_name,
      p.last_name,
      p.phone,
      a_new.appointment_date as new_appointment_date,
      a_new.appointment_time as new_appointment_time
    FROM scheduler_decisions sd
    JOIN scheduled_communications sc ON sc.id = sd.scheduled_communication_id
    JOIN patients p ON p.id = sd.patient_id
    LEFT JOIN appointments a_new ON a_new.id = sc.conflict_appointment_id
    WHERE sd.organization_id = $1
    AND sd.status = 'pending'
    ORDER BY sd.priority ASC, sd.created_at ASC
  `,
    [organizationId]
  );

  return result.rows;
}

/**
 * Resolve a scheduling decision
 */
export async function resolveDecision(decisionId, decision, userId, note = null) {
  // Get the decision and scheduled communication
  const decisionResult = await query(
    `
    SELECT sd.*, sc.scheduled_date, sc.trigger_days_after
    FROM scheduler_decisions sd
    JOIN scheduled_communications sc ON sc.id = sd.scheduled_communication_id
    WHERE sd.id = $1
  `,
    [decisionId]
  );

  if (decisionResult.rows.length === 0) {
    throw new Error('Decision not found');
  }

  const decisionRecord = decisionResult.rows[0];

  // Update decision record
  await query(
    `
    UPDATE scheduler_decisions
    SET status = 'approved', decision = $1, decided_by = $2, decided_at = NOW(), decision_note = $3
    WHERE id = $4
  `,
    [decision, userId, note, decisionId]
  );

  // Handle based on decision
  switch (decision) {
    case 'extend':
      // Extend the scheduled communication to new date
      await query(
        `
        UPDATE scheduled_communications
        SET
          scheduled_date = $1,
          status = 'pending',
          conflict_resolution = 'extended',
          resolved_by = $2,
          resolved_at = NOW(),
          updated_at = NOW()
        WHERE id = $3
      `,
        [decisionRecord.suggested_new_date, userId, decisionRecord.scheduled_communication_id]
      );
      logger.info(
        `Extended scheduled communication ${decisionRecord.scheduled_communication_id} to ${decisionRecord.suggested_new_date}`
      );
      break;

    case 'cancel':
      // Cancel the scheduled communication
      await query(
        `
        UPDATE scheduled_communications
        SET
          status = 'cancelled',
          conflict_resolution = 'user_cancelled',
          resolved_by = $1,
          resolved_at = NOW(),
          updated_at = NOW()
        WHERE id = $2
      `,
        [userId, decisionRecord.scheduled_communication_id]
      );
      logger.info(`Cancelled scheduled communication ${decisionRecord.scheduled_communication_id}`);
      break;

    case 'send_anyway':
      // Keep original date, mark conflict as resolved
      await query(
        `
        UPDATE scheduled_communications
        SET
          status = 'pending',
          conflict_resolution = 'sent_anyway',
          resolved_by = $1,
          resolved_at = NOW(),
          updated_at = NOW()
        WHERE id = $2
      `,
        [userId, decisionRecord.scheduled_communication_id]
      );
      logger.info(
        `Keeping original date for scheduled communication ${decisionRecord.scheduled_communication_id}`
      );
      break;
  }

  return { success: true, decision };
}

/**
 * Bulk resolve decisions
 */
export async function bulkResolveDecisions(decisionIds, decision, userId) {
  const results = [];
  for (const id of decisionIds) {
    try {
      const result = await resolveDecision(id, decision, userId);
      results.push({ id, ...result });
    } catch (error) {
      results.push({ id, success: false, error: error.message });
    }
  }
  return results;
}
