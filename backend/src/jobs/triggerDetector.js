/**
 * Trigger Detector
 * Detects workflow triggers and starts workflow executions
 */

import { query } from '../config/database.js';
import logger from '../utils/logger.js';
import { scheduleDelayedAction } from './actionExecutor.js';

/**
 * Detect and trigger workflows for an event
 * @param {string} organizationId - Organization context
 * @param {string} triggerType - Type of trigger event
 * @param {object} data - Event data (patientId, appointmentId, etc.)
 */
export const detectAndTriggerWorkflows = async (organizationId, triggerType, data = {}) => {
  logger.info(`[TriggerDetector] Detecting workflows for ${triggerType}`, { organizationId, data });

  try {
    // Find active workflows matching this trigger
    const workflowsResult = await query(
      `SELECT * FROM workflows
       WHERE organization_id = $1
         AND trigger_type = $2
         AND is_active = true`,
      [organizationId, triggerType]
    );

    if (workflowsResult.rows.length === 0) {
      return { triggered: 0 };
    }

    let triggered = 0;

    for (const workflow of workflowsResult.rows) {
      try {
        // Check if conditions are met
        if (!(await checkConditions(organizationId, workflow.conditions, data))) {
          logger.debug(`[TriggerDetector] Conditions not met for workflow ${workflow.id}`);
          continue;
        }

        // Check max runs per patient
        if (workflow.max_runs_per_patient > 0 && data.patientId) {
          const runsResult = await query(
            `SELECT COUNT(*) as count FROM workflow_executions
             WHERE workflow_id = $1 AND patient_id = $2`,
            [workflow.id, data.patientId]
          );
          if (parseInt(runsResult.rows[0].count) >= workflow.max_runs_per_patient) {
            logger.debug(`[TriggerDetector] Max runs reached for workflow ${workflow.id}`);
            continue;
          }
        }

        // Create workflow execution
        await executeWorkflow(workflow, data);
        triggered++;
      } catch (error) {
        logger.error(`[TriggerDetector] Error processing workflow ${workflow.id}:`, error);
      }
    }

    return { triggered };
  } catch (error) {
    logger.error(`[TriggerDetector] Failed to detect workflows:`, error);
    throw error;
  }
};

/**
 * Check if workflow conditions are met
 */
const checkConditions = async (organizationId, conditions, data) => {
  if (!conditions || conditions.length === 0) {
    return true; // No conditions = always pass
  }

  const { patientId, leadId } = data;

  // Get patient or lead data for condition checking
  let entity = null;

  if (patientId) {
    const result = await query(`SELECT * FROM patients WHERE id = $1 AND organization_id = $2`, [
      patientId,
      organizationId,
    ]);
    entity = result.rows[0];
  } else if (leadId) {
    const result = await query(`SELECT * FROM leads WHERE id = $1 AND organization_id = $2`, [
      leadId,
      organizationId,
    ]);
    entity = result.rows[0];
  }

  if (!entity) {
    return false;
  }

  // Check each condition
  for (const condition of conditions) {
    const { field, operator, value } = condition;
    const fieldValue = entity[field];

    let passed = false;

    switch (operator) {
      case 'equals':
        passed = fieldValue === value;
        break;
      case 'not_equals':
        passed = fieldValue !== value;
        break;
      case 'contains':
        passed = String(fieldValue).includes(value);
        break;
      case 'not_contains':
        passed = !String(fieldValue).includes(value);
        break;
      case 'greater_than':
        passed = Number(fieldValue) > Number(value);
        break;
      case 'less_than':
        passed = Number(fieldValue) < Number(value);
        break;
      case 'is_empty':
        passed = !fieldValue || fieldValue === '';
        break;
      case 'is_not_empty':
        passed = fieldValue && fieldValue !== '';
        break;
      case 'in':
        passed = Array.isArray(value) && value.includes(fieldValue);
        break;
      case 'not_in':
        passed = Array.isArray(value) && !value.includes(fieldValue);
        break;
      default:
        logger.warn(`[TriggerDetector] Unknown operator: ${operator}`);
        passed = true;
    }

    if (!passed) {
      return false; // All conditions must pass (AND logic)
    }
  }

  return true;
};

/**
 * Execute a workflow by creating execution and scheduling actions
 */
const executeWorkflow = async (workflow, data) => {
  const { patientId, leadId } = data;

  // Create execution record
  const executionResult = await query(
    `INSERT INTO workflow_executions (
      workflow_id, patient_id, lead_id, trigger_type, trigger_data,
      status, total_steps, started_at
    ) VALUES ($1, $2, $3, $4, $5, 'RUNNING', $6, NOW())
    RETURNING *`,
    [
      workflow.id,
      patientId || null,
      leadId || null,
      workflow.trigger_type,
      data,
      workflow.actions?.length || 0,
    ]
  );

  const execution = executionResult.rows[0];

  logger.info(`[TriggerDetector] Created execution ${execution.id} for workflow ${workflow.name}`);

  // Process actions
  const actions = workflow.actions || [];

  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];
    const delayHours = action.delay_hours || 0;

    if (delayHours > 0) {
      // Schedule for later
      await scheduleDelayedAction(execution.id, action.type, action, delayHours);
      logger.info(`[TriggerDetector] Scheduled action ${action.type} for ${delayHours}h later`);
    } else {
      // Execute immediately (first immediate action only, rest get scheduled)
      if (i === 0 || (actions[i - 1]?.delay_hours || 0) === 0) {
        await scheduleDelayedAction(
          execution.id,
          action.type,
          action,
          0 // Will be picked up by scheduler on next run
        );
      }
    }
  }

  // Update workflow stats
  await query(
    `UPDATE workflows SET total_runs = total_runs + 1, updated_at = NOW() WHERE id = $1`,
    [workflow.id]
  );

  return execution;
};

// ============================================================================
// TRIGGER EVENT HELPERS
// ============================================================================

/**
 * Called when a new patient is created
 */
export const onPatientCreated = async (organizationId, patientId) =>
  await detectAndTriggerWorkflows(organizationId, 'NEW_PATIENT', { patientId });

/**
 * Called when an appointment is booked
 */
export const onAppointmentBooked = async (organizationId, patientId, appointmentId) =>
  await detectAndTriggerWorkflows(organizationId, 'APPOINTMENT_BOOKED', {
    patientId,
    appointmentId,
  });

/**
 * Called when an encounter is completed/signed
 */
export const onAppointmentCompleted = async (organizationId, patientId, encounterId) =>
  await detectAndTriggerWorkflows(organizationId, 'APPOINTMENT_COMPLETED', {
    patientId,
    encounterId,
  });

/**
 * Called when an appointment is cancelled
 */
export const onAppointmentCancelled = async (organizationId, patientId, appointmentId) =>
  await detectAndTriggerWorkflows(organizationId, 'APPOINTMENT_CANCELLED', {
    patientId,
    appointmentId,
  });

/**
 * Called when patient doesn't show
 */
export const onAppointmentNoShow = async (organizationId, patientId, appointmentId) =>
  await detectAndTriggerWorkflows(organizationId, 'APPOINTMENT_NO_SHOW', {
    patientId,
    appointmentId,
  });

/**
 * Called when a lead is created
 */
export const onLeadCreated = async (organizationId, leadId) =>
  await detectAndTriggerWorkflows(organizationId, 'LEAD_CREATED', { leadId });

/**
 * Called when patient lifecycle changes
 */
export const onLifecycleChange = async (organizationId, patientId, oldStage, newStage) =>
  await detectAndTriggerWorkflows(organizationId, 'LIFECYCLE_CHANGE', {
    patientId,
    oldStage,
    newStage,
  });

/**
 * Called when a survey is completed
 */
export const onSurveyCompleted = async (organizationId, patientId, surveyId, responseId) =>
  await detectAndTriggerWorkflows(organizationId, 'SURVEY_COMPLETED', {
    patientId,
    surveyId,
    responseId,
  });

/**
 * Called when a referral is received
 */
export const onReferralReceived = async (organizationId, referralId, referredPatientId) =>
  await detectAndTriggerWorkflows(organizationId, 'REFERRAL_RECEIVED', {
    referralId,
    patientId: referredPatientId,
  });

// ============================================================================
// BATCH TRIGGER DETECTION (for scheduled checks)
// ============================================================================

/**
 * Find patients who match "days since visit" triggers
 */
export const detectDaysSinceVisit = async () => {
  // Get all active workflows with DAYS_SINCE_VISIT trigger
  const workflowsResult = await query(
    `SELECT w.*, w.organization_id as org_id
     FROM workflows w
     WHERE w.trigger_type = 'DAYS_SINCE_VISIT'
       AND w.is_active = true`
  );

  let triggered = 0;

  for (const workflow of workflowsResult.rows) {
    const daysSince = workflow.trigger_config?.days_since || 30;

    // Find patients who match
    const patientsResult = await query(
      `SELECT id FROM patients
       WHERE organization_id = $1
         AND last_visit_date = CURRENT_DATE - make_interval(days => $2)
         AND status = 'ACTIVE'`,
      [workflow.org_id, daysSince]
    );

    for (const patient of patientsResult.rows) {
      try {
        // Check max runs
        if (workflow.max_runs_per_patient > 0) {
          const runsResult = await query(
            `SELECT COUNT(*) as count FROM workflow_executions
             WHERE workflow_id = $1 AND patient_id = $2`,
            [workflow.id, patient.id]
          );
          if (parseInt(runsResult.rows[0].count) >= workflow.max_runs_per_patient) {
            continue;
          }
        }

        await executeWorkflow(workflow, { patientId: patient.id });
        triggered++;
      } catch (error) {
        logger.error(
          `[TriggerDetector] Error triggering days_since for patient ${patient.id}:`,
          error
        );
      }
    }
  }

  return { triggered };
};

export default {
  detectAndTriggerWorkflows,
  onPatientCreated,
  onAppointmentBooked,
  onAppointmentCompleted,
  onAppointmentCancelled,
  onAppointmentNoShow,
  onLeadCreated,
  onLifecycleChange,
  onSurveyCompleted,
  onReferralReceived,
  detectDaysSinceVisit,
};
