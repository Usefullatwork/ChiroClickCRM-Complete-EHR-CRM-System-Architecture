/**
 * Automation Actions
 * Action type definitions, execution implementations, and helper functions
 */

import { query } from '../../config/database.js';
import logger from '../../utils/logger.js';
import * as communicationService from '../communications.js';

// =============================================================================
// ACTION TYPES
// =============================================================================

export const ACTION_TYPES = {
  SEND_SMS: 'SEND_SMS',
  SEND_EMAIL: 'SEND_EMAIL',
  CREATE_FOLLOW_UP: 'CREATE_FOLLOW_UP',
  UPDATE_STATUS: 'UPDATE_STATUS',
  UPDATE_LIFECYCLE: 'UPDATE_LIFECYCLE',
  NOTIFY_STAFF: 'NOTIFY_STAFF',
  ADD_TAG: 'ADD_TAG',
  CREATE_TASK: 'CREATE_TASK',
};

/**
 * Execute a list of workflow actions
 */
export const executeActions = async (organizationId, workflow, patient) => {
  const actions = workflow.actions || [];
  const results = [];

  for (const action of actions) {
    const result = await executeAction(organizationId, action, patient, null);
    results.push(result);
  }

  return results;
};

/**
 * Execute a single action
 */
export const executeAction = async (organizationId, action, patient, _executionId) => {
  try {
    switch (action.type) {
      case ACTION_TYPES.SEND_SMS:
        return await executeSendSMS(organizationId, action, patient);

      case ACTION_TYPES.SEND_EMAIL:
        return await executeSendEmail(organizationId, action, patient);

      case ACTION_TYPES.CREATE_FOLLOW_UP:
        return await executeCreateFollowUp(organizationId, action, patient);

      case ACTION_TYPES.UPDATE_STATUS:
        return await executeUpdateStatus(organizationId, action, patient);

      case ACTION_TYPES.UPDATE_LIFECYCLE:
        return await executeUpdateLifecycle(organizationId, action, patient);

      case ACTION_TYPES.NOTIFY_STAFF:
        return await executeNotifyStaff(organizationId, action, patient);

      case ACTION_TYPES.ADD_TAG:
        return await executeAddTag(organizationId, action, patient);

      case ACTION_TYPES.CREATE_TASK:
        return await executeCreateTask(organizationId, action, patient);

      default:
        logger.warn('Unknown action type:', action.type);
        return { success: false, error: 'Unknown action type' };
    }
  } catch (error) {
    logger.error('Error executing action:', { action, error: error.message });
    throw error;
  }
};

// =============================================================================
// ACTION IMPLEMENTATIONS
// =============================================================================

/**
 * Send SMS action
 */
const executeSendSMS = async (organizationId, action, patient) => {
  if (!patient?.phone) {
    logger.warn('Cannot send SMS - patient has no phone number');
    return { success: false, error: 'No phone number' };
  }

  const message = replaceVariables(action.message || action.template, patient);

  try {
    const result = await communicationService.sendSMS(
      organizationId,
      {
        patient_id: patient.id,
        recipient_phone: patient.phone,
        content: message,
        template_id: action.template_id,
      },
      null // System-generated
    );

    return { success: true, communicationId: result.id };
  } catch (error) {
    logger.error('Error sending SMS:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send Email action
 */
const executeSendEmail = async (organizationId, action, patient) => {
  if (!patient?.email) {
    logger.warn('Cannot send email - patient has no email address');
    return { success: false, error: 'No email address' };
  }

  const subject = replaceVariables(action.subject, patient);
  const body = replaceVariables(action.body || action.template, patient);

  try {
    const result = await communicationService.sendEmail(
      organizationId,
      {
        patient_id: patient.id,
        recipient_email: patient.email,
        subject: subject,
        content: body,
        template_id: action.template_id,
      },
      null // System-generated
    );

    return { success: true, communicationId: result.id };
  } catch (error) {
    logger.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create follow-up action
 */
const executeCreateFollowUp = async (organizationId, action, patient) => {
  const dueDate = calculateDueDate(action.due_in_days || 7);

  await query(
    `INSERT INTO follow_ups (
      organization_id,
      patient_id,
      follow_up_type,
      reason,
      priority,
      due_date,
      auto_generated,
      trigger_rule,
      assigned_to
    ) VALUES ($1, $2, $3, $4, $5, $6, true, $7, $8)`,
    [
      organizationId,
      patient.id,
      action.follow_up_type || 'CUSTOM',
      replaceVariables(action.reason || 'Automated follow-up', patient),
      action.priority || 'MEDIUM',
      dueDate,
      action.trigger_rule || 'Workflow automation',
      action.assigned_to || null,
    ]
  );

  return { success: true };
};

/**
 * Update patient status action
 */
const executeUpdateStatus = async (organizationId, action, patient) => {
  await query(
    `UPDATE patients SET status = $1, updated_at = NOW()
    WHERE id = $2 AND organization_id = $3`,
    [action.value, patient.id, organizationId]
  );

  return { success: true };
};

/**
 * Update patient lifecycle stage action
 */
const executeUpdateLifecycle = async (organizationId, action, patient) => {
  await query(
    `UPDATE patients SET lifecycle_stage = $1, updated_at = NOW()
    WHERE id = $2 AND organization_id = $3`,
    [action.value, patient.id, organizationId]
  );

  return { success: true };
};

/**
 * Notify staff action
 */
const executeNotifyStaff = async (organizationId, action, patient) => {
  const message = replaceVariables(action.message, patient);

  // Get staff to notify
  const staffIds = action.staff_ids || [];
  const roles = action.roles || ['ADMIN', 'PRACTITIONER'];

  let staffQuery = 'SELECT * FROM users WHERE organization_id = $1 AND is_active = true';
  const params = [organizationId];

  if (staffIds.length > 0) {
    params.push(staffIds);
    staffQuery += ` AND id = ANY($${params.length})`;
  } else {
    params.push(roles);
    staffQuery += ` AND role = ANY($${params.length})`;
  }

  const staffResult = await query(staffQuery, params);

  // Create notifications (could be expanded to send actual notifications)
  for (const staff of staffResult.rows) {
    await query(
      `INSERT INTO follow_ups (
        organization_id,
        patient_id,
        follow_up_type,
        reason,
        priority,
        due_date,
        assigned_to,
        auto_generated,
        trigger_rule
      ) VALUES ($1, $2, 'CUSTOM', $3, $4, NOW(), $5, true, 'Staff notification')`,
      [organizationId, patient?.id || null, message, action.priority || 'MEDIUM', staff.id]
    );
  }

  return { success: true, notifiedCount: staffResult.rows.length };
};

/**
 * Add tag action
 */
const executeAddTag = async (organizationId, action, patient) => {
  const tag = action.tag || action.value;

  await query(
    `UPDATE patients
    SET tags = COALESCE(tags, '[]'::jsonb) || $1::jsonb, updated_at = NOW()
    WHERE id = $2 AND organization_id = $3
    AND NOT (COALESCE(tags, '[]'::jsonb) @> $1::jsonb)`,
    [JSON.stringify([tag]), patient.id, organizationId]
  );

  return { success: true };
};

/**
 * Create task action
 */
const executeCreateTask = async (organizationId, action, patient) => {
  const dueDate = calculateDueDate(action.due_in_days || 1);

  await query(
    `INSERT INTO follow_ups (
      organization_id,
      patient_id,
      follow_up_type,
      reason,
      priority,
      due_date,
      auto_generated,
      trigger_rule,
      assigned_to
    ) VALUES ($1, $2, $3, $4, $5, $6, true, $7, $8)`,
    [
      organizationId,
      patient?.id || null,
      action.task_type || 'CUSTOM',
      replaceVariables(action.description || 'Automated task', patient),
      action.priority || 'MEDIUM',
      dueDate,
      action.trigger_rule || 'Workflow automation',
      action.assigned_to || null,
    ]
  );

  return { success: true };
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Replace template variables with patient data
 */
export const replaceVariables = (template, patient) => {
  if (!template) {
    return '';
  }

  const variables = {
    '{firstName}': patient?.first_name || '',
    '{lastName}': patient?.last_name || '',
    '{fullName}': `${patient?.first_name || ''} ${patient?.last_name || ''}`.trim(),
    '{email}': patient?.email || '',
    '{phone}': patient?.phone || '',
    '{lastVisit}': patient?.last_visit_date || '',
    '{totalVisits}': patient?.total_visits || 0,
    // Norwegian translations
    '{fornavn}': patient?.first_name || '',
    '{etternavn}': patient?.last_name || '',
    '{fulltNavn}': `${patient?.first_name || ''} ${patient?.last_name || ''}`.trim(),
    '{epost}': patient?.email || '',
    '{telefon}': patient?.phone || '',
  };

  let result = template;
  for (const [variable, value] of Object.entries(variables)) {
    result = result.split(variable).join(String(value));
  }

  return result;
};

/**
 * Calculate due date from days offset
 */
export const calculateDueDate = (daysFromNow) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
};

/**
 * Get preview of an action
 */
export const getActionPreview = (action, patient) => {
  switch (action.type) {
    case ACTION_TYPES.SEND_SMS:
      return {
        recipient: patient.phone,
        message: replaceVariables(action.message || action.template, patient),
      };

    case ACTION_TYPES.SEND_EMAIL:
      return {
        recipient: patient.email,
        subject: replaceVariables(action.subject, patient),
        body: replaceVariables(action.body || action.template, patient),
      };

    case ACTION_TYPES.CREATE_FOLLOW_UP:
      return {
        type: action.follow_up_type || 'CUSTOM',
        reason: replaceVariables(action.reason, patient),
        due_in_days: action.due_in_days || 7,
      };

    case ACTION_TYPES.UPDATE_STATUS:
    case ACTION_TYPES.UPDATE_LIFECYCLE:
      return { new_value: action.value };

    case ACTION_TYPES.NOTIFY_STAFF:
      return {
        message: replaceVariables(action.message, patient),
        roles: action.roles || ['ADMIN', 'PRACTITIONER'],
      };

    case ACTION_TYPES.ADD_TAG:
      return { tag: action.tag || action.value };

    default:
      return action;
  }
};
