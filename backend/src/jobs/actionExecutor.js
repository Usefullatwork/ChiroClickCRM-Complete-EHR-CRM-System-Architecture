/**
 * Action Executor
 * Executes workflow actions like sending SMS, email, creating follow-ups, etc.
 */

import { query } from '../config/database.js';
import logger from '../utils/logger.js';
import * as communicationsService from '../services/communications.js';
import * as followupsService from '../services/followups.js';

/**
 * Execute a workflow action
 * @param {string} organizationId - Organization context
 * @param {string} actionType - Type of action to execute
 * @param {object} config - Action configuration
 * @param {object} context - Execution context (patientId, leadId, etc.)
 */
export const executeAction = async (organizationId, actionType, config, context = {}) => {
  const { patientId, leadId, executionId } = context;

  logger.info(`[ActionExecutor] Executing ${actionType}`, { organizationId, patientId, config });

  try {
    let result;

    switch (actionType) {
      case 'SEND_SMS':
        result = await executeSendSMS(organizationId, config, context);
        break;

      case 'SEND_EMAIL':
        result = await executeSendEmail(organizationId, config, context);
        break;

      case 'CREATE_FOLLOW_UP':
        result = await executeCreateFollowUp(organizationId, config, context);
        break;

      case 'UPDATE_PATIENT':
        result = await executeUpdatePatient(organizationId, config, context);
        break;

      case 'CREATE_TASK':
        result = await executeCreateTask(organizationId, config, context);
        break;

      case 'ADD_TAG':
        result = await executeAddTag(organizationId, config, context);
        break;

      case 'REMOVE_TAG':
        result = await executeRemoveTag(organizationId, config, context);
        break;

      case 'UPDATE_LIFECYCLE':
        result = await executeUpdateLifecycle(organizationId, config, context);
        break;

      case 'LOG_ACTIVITY':
        result = await executeLogActivity(organizationId, config, context);
        break;

      default:
        throw new Error(`Unknown action type: ${actionType}`);
    }

    // Log successful action execution
    if (executionId) {
      await logActionResult(executionId, actionType, 'SUCCESS', result);
    }

    return result;
  } catch (error) {
    logger.error(`[ActionExecutor] Failed ${actionType}:`, error);

    // Log failed action execution
    if (executionId) {
      await logActionResult(executionId, actionType, 'FAILED', null, error.message);
    }

    throw error;
  }
};

/**
 * Log action result to workflow execution
 */
const logActionResult = async (executionId, actionType, status, result, error = null) => {
  try {
    await query(
      `UPDATE workflow_executions
       SET actions_completed = actions_completed || $2::jsonb,
           current_step = current_step + 1,
           updated_at = NOW()
       WHERE id = $1`,
      [
        executionId,
        JSON.stringify([{
          type: actionType,
          status,
          result,
          error,
          executedAt: new Date().toISOString()
        }])
      ]
    );
  } catch (err) {
    logger.error('Failed to log action result:', err);
  }
};

// ============================================================================
// ACTION IMPLEMENTATIONS
// ============================================================================

/**
 * Send SMS to patient
 */
const executeSendSMS = async (organizationId, config, context) => {
  const { patientId } = context;
  const { template, message, templateId } = config;

  // Get patient details
  const patientResult = await query(
    `SELECT id, first_name, last_name, phone, email, preferred_language
     FROM patients WHERE id = $1 AND organization_id = $2`,
    [patientId, organizationId]
  );

  if (patientResult.rows.length === 0) {
    throw new Error(`Patient not found: ${patientId}`);
  }

  const patient = patientResult.rows[0];

  if (!patient.phone) {
    throw new Error(`Patient has no phone number: ${patientId}`);
  }

  // Get message content
  let content = message;

  if (templateId) {
    const templateResult = await query(
      `SELECT body FROM message_templates WHERE id = $1`,
      [templateId]
    );
    if (templateResult.rows.length > 0) {
      content = templateResult.rows[0].body;
    }
  } else if (template) {
    // Look up template by name
    const templateResult = await query(
      `SELECT body FROM message_templates
       WHERE organization_id = $1 AND name = $2 AND is_active = true`,
      [organizationId, template]
    );
    if (templateResult.rows.length > 0) {
      content = templateResult.rows[0].body;
    }
  }

  // Replace variables in content
  content = replaceVariables(content, patient);

  // Send SMS via communications service
  const result = await communicationsService.sendSMS(
    organizationId,
    {
      patient_id: patientId,
      recipient_phone: patient.phone,
      content,
      template_id: templateId
    },
    null // System user
  );

  return { messageId: result.id, phone: patient.phone };
};

/**
 * Send email to patient
 */
const executeSendEmail = async (organizationId, config, context) => {
  const { patientId } = context;
  const { template, subject, body, templateId } = config;

  // Get patient details
  const patientResult = await query(
    `SELECT id, first_name, last_name, phone, email, preferred_language
     FROM patients WHERE id = $1 AND organization_id = $2`,
    [patientId, organizationId]
  );

  if (patientResult.rows.length === 0) {
    throw new Error(`Patient not found: ${patientId}`);
  }

  const patient = patientResult.rows[0];

  if (!patient.email) {
    throw new Error(`Patient has no email: ${patientId}`);
  }

  // Get email content
  let emailSubject = subject || 'Melding fra klinikken';
  let emailBody = body;

  if (templateId) {
    const templateResult = await query(
      `SELECT subject, body FROM message_templates WHERE id = $1`,
      [templateId]
    );
    if (templateResult.rows.length > 0) {
      emailSubject = templateResult.rows[0].subject || emailSubject;
      emailBody = templateResult.rows[0].body;
    }
  } else if (template) {
    const templateResult = await query(
      `SELECT subject, body FROM message_templates
       WHERE organization_id = $1 AND name = $2 AND is_active = true`,
      [organizationId, template]
    );
    if (templateResult.rows.length > 0) {
      emailSubject = templateResult.rows[0].subject || emailSubject;
      emailBody = templateResult.rows[0].body;
    }
  }

  // Replace variables
  emailSubject = replaceVariables(emailSubject, patient);
  emailBody = replaceVariables(emailBody, patient);

  // Send email via communications service
  const result = await communicationsService.sendEmail(
    organizationId,
    {
      patient_id: patientId,
      recipient_email: patient.email,
      subject: emailSubject,
      content: emailBody,
      template_id: templateId
    },
    null // System user
  );

  return { messageId: result.id, email: patient.email };
};

/**
 * Create a follow-up task
 */
const executeCreateFollowUp = async (organizationId, config, context) => {
  const { patientId } = context;
  const {
    followUpType = 'CUSTOM',
    reason = 'Automated follow-up',
    dueDays = 7,
    priority = 'MEDIUM',
    assignTo
  } = config;

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + dueDays);

  const followUp = await followupsService.createFollowUp(organizationId, {
    patient_id: patientId,
    follow_up_type: followUpType,
    reason,
    due_date: dueDate.toISOString().split('T')[0],
    priority,
    assigned_to: assignTo,
    notes: 'Auto-generated by workflow'
  });

  return { followUpId: followUp.id, dueDate: followUp.due_date };
};

/**
 * Update patient fields
 */
const executeUpdatePatient = async (organizationId, config, context) => {
  const { patientId } = context;
  const { field, value } = config;

  // Whitelist of allowed fields to update
  const allowedFields = [
    'lifecycle_stage', 'engagement_score', 'is_vip',
    'should_be_followed_up', 'preferred_contact_method',
    'needs_feedback', 'last_contact_date'
  ];

  if (!allowedFields.includes(field)) {
    throw new Error(`Field not allowed for update: ${field}`);
  }

  const result = await query(
    `UPDATE patients
     SET ${field} = $3, updated_at = NOW()
     WHERE id = $1 AND organization_id = $2
     RETURNING id, ${field}`,
    [patientId, organizationId, value]
  );

  if (result.rows.length === 0) {
    throw new Error(`Patient not found: ${patientId}`);
  }

  return { patientId, field, value: result.rows[0][field] };
};

/**
 * Create a staff task
 */
const executeCreateTask = async (organizationId, config, context) => {
  const { patientId } = context;
  const {
    taskType = 'CALL',
    title,
    description = '',
    dueDays = 1,
    priority = 'MEDIUM',
    assignTo
  } = config;

  // Get patient name for task title
  const patientResult = await query(
    `SELECT first_name, last_name FROM patients WHERE id = $1`,
    [patientId]
  );

  const patientName = patientResult.rows.length > 0
    ? `${patientResult.rows[0].first_name} ${patientResult.rows[0].last_name}`
    : 'Unknown Patient';

  const taskTitle = title || `${taskType}: ${patientName}`;

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + dueDays);

  // Create follow-up as a task (using follow_ups table with type CUSTOM)
  const result = await query(
    `INSERT INTO follow_ups (
      organization_id, patient_id, follow_up_type, reason,
      due_date, priority, assigned_to, notes, status
    ) VALUES ($1, $2, 'CUSTOM', $3, $4, $5, $6, $7, 'PENDING')
    RETURNING *`,
    [
      organizationId,
      patientId,
      taskTitle,
      dueDate.toISOString().split('T')[0],
      priority,
      assignTo,
      `Task type: ${taskType}\n${description}`
    ]
  );

  return { taskId: result.rows[0].id, title: taskTitle, dueDate };
};

/**
 * Add tag to patient
 */
const executeAddTag = async (organizationId, config, context) => {
  const { patientId } = context;
  const { tag } = config;

  if (!tag) {
    throw new Error('Tag is required');
  }

  const result = await query(
    `UPDATE patients
     SET tags = COALESCE(tags, '[]'::jsonb) || $3::jsonb,
         updated_at = NOW()
     WHERE id = $1 AND organization_id = $2
       AND NOT (COALESCE(tags, '[]'::jsonb) ? $4)
     RETURNING id, tags`,
    [patientId, organizationId, JSON.stringify([tag]), tag]
  );

  return { patientId, tag, added: result.rowCount > 0 };
};

/**
 * Remove tag from patient
 */
const executeRemoveTag = async (organizationId, config, context) => {
  const { patientId } = context;
  const { tag } = config;

  if (!tag) {
    throw new Error('Tag is required');
  }

  const result = await query(
    `UPDATE patients
     SET tags = COALESCE(tags, '[]'::jsonb) - $3,
         updated_at = NOW()
     WHERE id = $1 AND organization_id = $2
     RETURNING id, tags`,
    [patientId, organizationId, tag]
  );

  return { patientId, tag, removed: result.rowCount > 0 };
};

/**
 * Update patient lifecycle stage
 */
const executeUpdateLifecycle = async (organizationId, config, context) => {
  const { patientId } = context;
  const { stage } = config;

  const validStages = ['NEW', 'ONBOARDING', 'ACTIVE', 'AT_RISK', 'INACTIVE', 'LOST', 'REACTIVATED'];

  if (!validStages.includes(stage)) {
    throw new Error(`Invalid lifecycle stage: ${stage}`);
  }

  const result = await query(
    `UPDATE patients
     SET lifecycle_stage = $3, updated_at = NOW()
     WHERE id = $1 AND organization_id = $2
     RETURNING id, lifecycle_stage`,
    [patientId, organizationId, stage]
  );

  if (result.rows.length === 0) {
    throw new Error(`Patient not found: ${patientId}`);
  }

  return { patientId, stage };
};

/**
 * Log an activity for lead
 */
const executeLogActivity = async (organizationId, config, context) => {
  const { leadId } = context;
  const { activityType, description } = config;

  if (!leadId) {
    throw new Error('Lead ID required for activity logging');
  }

  const result = await query(
    `INSERT INTO lead_activities (lead_id, activity_type, description)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [leadId, activityType, description]
  );

  return { activityId: result.rows[0].id };
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Replace template variables with patient data
 */
const replaceVariables = (text, patient) => {
  if (!text) return '';

  const variables = {
    '{patient_name}': `${patient.first_name} ${patient.last_name}`.trim(),
    '{first_name}': patient.first_name || '',
    '{last_name}': patient.last_name || '',
    '{fornavn}': patient.first_name || '',
    '{etternavn}': patient.last_name || '',
    '{phone}': patient.phone || '',
    '{email}': patient.email || ''
  };

  let result = text;
  for (const [variable, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(variable, 'gi'), value);
  }

  return result;
};

/**
 * Schedule a delayed action
 */
export const scheduleDelayedAction = async (executionId, actionType, config, delayHours) => {
  const scheduledFor = new Date();
  scheduledFor.setHours(scheduledFor.getHours() + delayHours);

  const result = await query(
    `INSERT INTO workflow_scheduled_actions (execution_id, action_type, action_config, scheduled_for)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [executionId, actionType, config, scheduledFor]
  );

  return result.rows[0];
};

export default {
  executeAction,
  scheduleDelayedAction
};
