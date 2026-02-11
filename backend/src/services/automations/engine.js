/**
 * Automation Engine
 * Workflow CRUD, execution, processing engine, and scheduling
 */

import { query } from '../../config/database.js';
import logger from '../../utils/logger.js';
import { TRIGGER_TYPES, evaluateTrigger } from './triggers.js';
import { evaluateConditions } from './conditions.js';
import { executeAction, getActionPreview } from './actions.js';

// =============================================================================
// WORKFLOW CRUD OPERATIONS
// =============================================================================

/**
 * Get all workflows for an organization
 */
export const getWorkflows = async (organizationId, options = {}) => {
  const { isActive = null, triggerType = null, page = 1, limit = 50 } = options;
  const offset = (page - 1) * limit;

  try {
    let whereClause = 'WHERE w.organization_id = $1';
    const params = [organizationId];
    let paramIndex = 2;

    if (isActive !== null) {
      params.push(isActive);
      whereClause += ` AND w.is_active = $${paramIndex}`;
      paramIndex++;
    }

    if (triggerType) {
      params.push(triggerType);
      whereClause += ` AND w.trigger_type = $${paramIndex}`;
      paramIndex++;
    }

    // Get total count
    const countResult = await query(`SELECT COUNT(*) FROM workflows w ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count);

    // Get workflows with stats
    params.push(limit, offset);
    const result = await query(
      `SELECT
        w.*,
        u.first_name || ' ' || u.last_name as created_by_name,
        (SELECT COUNT(*) FROM workflow_executions we WHERE we.workflow_id = w.id) as execution_count,
        (SELECT COUNT(*) FROM workflow_executions we WHERE we.workflow_id = w.id AND we.status = 'COMPLETED') as successful_count,
        (SELECT MAX(we.created_at) FROM workflow_executions we WHERE we.workflow_id = w.id) as last_execution
      FROM workflows w
      LEFT JOIN users u ON u.id = w.created_by
      ${whereClause}
      ORDER BY w.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    return {
      workflows: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Error getting workflows:', error);
    throw error;
  }
};

/**
 * Get a single workflow by ID
 */
export const getWorkflowById = async (organizationId, workflowId) => {
  try {
    const result = await query(
      `SELECT
        w.*,
        u.first_name || ' ' || u.last_name as created_by_name
      FROM workflows w
      LEFT JOIN users u ON u.id = w.created_by
      WHERE w.id = $1 AND w.organization_id = $2`,
      [workflowId, organizationId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    logger.error('Error getting workflow:', error);
    throw error;
  }
};

/**
 * Create a new workflow
 */
export const createWorkflow = async (organizationId, workflowData, userId) => {
  try {
    const result = await query(
      `INSERT INTO workflows (
        organization_id,
        name,
        description,
        trigger_type,
        trigger_config,
        conditions,
        actions,
        is_active,
        max_runs_per_patient,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        organizationId,
        workflowData.name,
        workflowData.description || null,
        workflowData.trigger_type,
        JSON.stringify(workflowData.trigger_config || {}),
        JSON.stringify(workflowData.conditions || []),
        JSON.stringify(workflowData.actions || []),
        workflowData.is_active !== false,
        workflowData.max_runs_per_patient || 1,
        userId,
      ]
    );

    logger.info('Workflow created:', {
      organizationId,
      workflowId: result.rows[0].id,
      name: workflowData.name,
      triggerType: workflowData.trigger_type,
    });

    return result.rows[0];
  } catch (error) {
    logger.error('Error creating workflow:', error);
    throw error;
  }
};

/**
 * Update an existing workflow
 */
export const updateWorkflow = async (organizationId, workflowId, updates) => {
  try {
    const updateFields = [];
    const params = [workflowId, organizationId];
    let paramIndex = 3;

    const allowedFields = [
      'name',
      'description',
      'trigger_type',
      'trigger_config',
      'conditions',
      'actions',
      'is_active',
      'max_runs_per_patient',
    ];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        let value = updates[field];
        if (['trigger_config', 'conditions', 'actions'].includes(field)) {
          value = JSON.stringify(value);
        }
        params.push(value);
        updateFields.push(`${field} = $${paramIndex}`);
        paramIndex++;
      }
    }

    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }

    updateFields.push('updated_at = NOW()');

    const result = await query(
      `UPDATE workflows
      SET ${updateFields.join(', ')}
      WHERE id = $1 AND organization_id = $2
      RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return null;
    }

    logger.info('Workflow updated:', {
      organizationId,
      workflowId,
      fields: Object.keys(updates),
    });

    return result.rows[0];
  } catch (error) {
    logger.error('Error updating workflow:', error);
    throw error;
  }
};

/**
 * Delete a workflow
 */
export const deleteWorkflow = async (organizationId, workflowId) => {
  try {
    const result = await query(
      `DELETE FROM workflows
      WHERE id = $1 AND organization_id = $2
      RETURNING id`,
      [workflowId, organizationId]
    );

    if (result.rows.length === 0) {
      return false;
    }

    logger.info('Workflow deleted:', { organizationId, workflowId });
    return true;
  } catch (error) {
    logger.error('Error deleting workflow:', error);
    throw error;
  }
};

/**
 * Toggle workflow active status
 */
export const toggleWorkflow = async (organizationId, workflowId) => {
  try {
    const result = await query(
      `UPDATE workflows
      SET is_active = NOT is_active, updated_at = NOW()
      WHERE id = $1 AND organization_id = $2
      RETURNING *`,
      [workflowId, organizationId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    logger.info('Workflow toggled:', {
      organizationId,
      workflowId,
      isActive: result.rows[0].is_active,
    });

    return result.rows[0];
  } catch (error) {
    logger.error('Error toggling workflow:', error);
    throw error;
  }
};

// =============================================================================
// EXECUTION HISTORY
// =============================================================================

/**
 * Get execution history for a workflow
 */
export const getWorkflowExecutions = async (organizationId, workflowId, options = {}) => {
  const { page = 1, limit = 50, status = null } = options;
  const offset = (page - 1) * limit;

  try {
    // Verify workflow belongs to organization
    const workflowCheck = await query(
      'SELECT id FROM workflows WHERE id = $1 AND organization_id = $2',
      [workflowId, organizationId]
    );

    if (workflowCheck.rows.length === 0) {
      return null;
    }

    let whereClause = 'WHERE we.workflow_id = $1';
    const params = [workflowId];
    let paramIndex = 2;

    if (status) {
      params.push(status);
      whereClause += ` AND we.status = $${paramIndex}`;
      paramIndex++;
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM workflow_executions we ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get executions
    params.push(limit, offset);
    const result = await query(
      `SELECT
        we.*,
        p.first_name || ' ' || p.last_name as patient_name,
        p.phone as patient_phone,
        p.email as patient_email
      FROM workflow_executions we
      LEFT JOIN patients p ON p.id = we.patient_id
      ${whereClause}
      ORDER BY we.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    return {
      executions: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Error getting workflow executions:', error);
    throw error;
  }
};

// =============================================================================
// WORKFLOW PROCESSING ENGINE
// =============================================================================

/**
 * Main processing loop - Process all pending automations
 * Should be called by a scheduled job (e.g., every 5 minutes)
 */
export const processAutomations = async (organizationId = null) => {
  try {
    logger.info('Starting automation processing', { organizationId });

    // Process scheduled actions that are due
    await processScheduledActions(organizationId);

    // Process time-based triggers (DAYS_SINCE_VISIT, BIRTHDAY)
    await processTimeTriggers(organizationId);

    logger.info('Automation processing complete');
    return { success: true };
  } catch (error) {
    logger.error('Error in automation processing:', error);
    throw error;
  }
};

/**
 * Process scheduled workflow actions that are due
 */
const processScheduledActions = async (organizationId = null) => {
  try {
    let whereClause = `WHERE wsa.status = 'PENDING' AND wsa.scheduled_for <= NOW()`;
    const params = [];

    if (organizationId) {
      params.push(organizationId);
      whereClause += ` AND w.organization_id = $1`;
    }

    const result = await query(
      `SELECT
        wsa.*,
        we.patient_id,
        we.lead_id,
        w.organization_id
      FROM workflow_scheduled_actions wsa
      JOIN workflow_executions we ON we.id = wsa.execution_id
      JOIN workflows w ON w.id = we.workflow_id
      ${whereClause}
      ORDER BY wsa.scheduled_for ASC
      LIMIT 100`,
      params
    );

    for (const scheduledAction of result.rows) {
      try {
        // Mark as processing
        await query(`UPDATE workflow_scheduled_actions SET status = 'PROCESSING' WHERE id = $1`, [
          scheduledAction.id,
        ]);

        // Get patient data
        const patientResult = await query('SELECT * FROM patients WHERE id = $1', [
          scheduledAction.patient_id,
        ]);
        const patient = patientResult.rows[0];

        // Execute the action
        await executeAction(
          scheduledAction.organization_id,
          scheduledAction.action_config,
          patient,
          scheduledAction.execution_id
        );

        // Mark as completed
        await query(
          `UPDATE workflow_scheduled_actions
          SET status = 'COMPLETED', completed_at = NOW()
          WHERE id = $1`,
          [scheduledAction.id]
        );
      } catch (actionError) {
        logger.error('Error processing scheduled action:', {
          actionId: scheduledAction.id,
          error: actionError.message,
        });

        await query(
          `UPDATE workflow_scheduled_actions
          SET status = 'FAILED', error_message = $2
          WHERE id = $1`,
          [scheduledAction.id, actionError.message]
        );
      }
    }

    return result.rows.length;
  } catch (error) {
    logger.error('Error processing scheduled actions:', error);
    throw error;
  }
};

/**
 * Process time-based triggers
 */
const processTimeTriggers = async (organizationId = null) => {
  // This is handled by automationTriggers.js
  // Called separately to check DAYS_SINCE_VISIT and BIRTHDAY triggers
  return { processed: 0 };
};

/**
 * Trigger a workflow based on an event
 */
export const triggerWorkflow = async (organizationId, triggerType, eventData) => {
  try {
    logger.info('Workflow trigger received:', { organizationId, triggerType, eventData });

    // Find matching active workflows
    const workflowsResult = await query(
      `SELECT * FROM workflows
      WHERE organization_id = $1
        AND trigger_type = $2
        AND is_active = true`,
      [organizationId, triggerType]
    );

    const workflows = workflowsResult.rows;

    if (workflows.length === 0) {
      logger.debug('No matching workflows found');
      return { triggered: 0 };
    }

    let triggeredCount = 0;

    for (const workflow of workflows) {
      // Get patient data
      let patient = null;
      if (eventData.patient_id) {
        const patientResult = await query(
          'SELECT * FROM patients WHERE id = $1 AND organization_id = $2',
          [eventData.patient_id, organizationId]
        );
        patient = patientResult.rows[0];
      }

      // Check if trigger matches
      if (!evaluateTrigger(workflow, eventData)) {
        continue;
      }

      // Check conditions
      if (patient && !evaluateConditions(workflow, patient)) {
        continue;
      }

      // Check max runs per patient
      if (workflow.max_runs_per_patient > 0 && patient) {
        const executionCount = await query(
          `SELECT COUNT(*) FROM workflow_executions
          WHERE workflow_id = $1 AND patient_id = $2 AND status IN ('COMPLETED', 'RUNNING')`,
          [workflow.id, patient.id]
        );

        if (parseInt(executionCount.rows[0].count) >= workflow.max_runs_per_patient) {
          logger.debug('Max runs reached for patient', {
            workflowId: workflow.id,
            patientId: patient.id,
          });
          continue;
        }
      }

      // Execute the workflow
      await executeWorkflow(organizationId, workflow, patient, eventData);
      triggeredCount++;
    }

    return { triggered: triggeredCount };
  } catch (error) {
    logger.error('Error triggering workflow:', error);
    throw error;
  }
};

/**
 * Execute a workflow for a patient
 */
export const executeWorkflow = async (organizationId, workflow, patient, triggerData) => {
  try {
    const actions = workflow.actions || [];

    // Create execution record
    const executionResult = await query(
      `INSERT INTO workflow_executions (
        workflow_id,
        patient_id,
        lead_id,
        trigger_type,
        trigger_data,
        status,
        total_steps,
        started_at
      ) VALUES ($1, $2, $3, $4, $5, 'RUNNING', $6, NOW())
      RETURNING *`,
      [
        workflow.id,
        patient?.id || null,
        triggerData.lead_id || null,
        workflow.trigger_type,
        JSON.stringify(triggerData),
        actions.length,
      ]
    );

    const execution = executionResult.rows[0];
    const completedActions = [];

    try {
      for (let i = 0; i < actions.length; i++) {
        const action = actions[i];

        // Check for delay
        if (action.delay_hours && action.delay_hours > 0) {
          // Schedule the action for later
          await scheduleAction(execution.id, action, action.delay_hours);
          completedActions.push({
            ...action,
            status: 'SCHEDULED',
            scheduled_for: new Date(Date.now() + action.delay_hours * 60 * 60 * 1000),
          });
        } else {
          // Execute immediately
          await executeAction(organizationId, action, patient, execution.id);
          completedActions.push({
            ...action,
            status: 'COMPLETED',
            completed_at: new Date(),
          });
        }

        // Update progress
        await query(
          `UPDATE workflow_executions
          SET current_step = $2, actions_completed = $3
          WHERE id = $1`,
          [execution.id, i + 1, JSON.stringify(completedActions)]
        );
      }

      // Mark execution as completed
      await query(
        `UPDATE workflow_executions
        SET status = 'COMPLETED', completed_at = NOW(), actions_completed = $2
        WHERE id = $1`,
        [execution.id, JSON.stringify(completedActions)]
      );

      // Update workflow stats
      await query(
        `UPDATE workflows
        SET total_runs = total_runs + 1, successful_runs = successful_runs + 1
        WHERE id = $1`,
        [workflow.id]
      );

      logger.info('Workflow executed successfully:', {
        workflowId: workflow.id,
        executionId: execution.id,
        patientId: patient?.id,
      });

      return execution;
    } catch (actionError) {
      // Mark execution as failed
      await query(
        `UPDATE workflow_executions
        SET status = 'FAILED', error_message = $2, actions_completed = $3
        WHERE id = $1`,
        [execution.id, actionError.message, JSON.stringify(completedActions)]
      );

      // Update workflow stats
      await query(
        `UPDATE workflows
        SET total_runs = total_runs + 1, failed_runs = failed_runs + 1
        WHERE id = $1`,
        [workflow.id]
      );

      throw actionError;
    }
  } catch (error) {
    logger.error('Error executing workflow:', error);
    throw error;
  }
};

/**
 * Schedule an action for later execution
 */
const scheduleAction = async (executionId, action, delayHours) => {
  const scheduledFor = new Date(Date.now() + delayHours * 60 * 60 * 1000);

  await query(
    `INSERT INTO workflow_scheduled_actions (
      execution_id,
      action_type,
      action_config,
      scheduled_for
    ) VALUES ($1, $2, $3, $4)`,
    [executionId, action.type, JSON.stringify(action), scheduledFor]
  );

  logger.info('Action scheduled:', {
    executionId,
    actionType: action.type,
    scheduledFor,
  });
};

/**
 * Test workflow without executing
 */
export const testWorkflow = async (organizationId, workflowData, testPatientId) => {
  try {
    // Get test patient
    const patientResult = await query(
      'SELECT * FROM patients WHERE id = $1 AND organization_id = $2',
      [testPatientId, organizationId]
    );

    if (patientResult.rows.length === 0) {
      return { success: false, error: 'Test patient not found' };
    }

    const patient = patientResult.rows[0];

    // Evaluate conditions
    const conditionsPass = evaluateConditions(workflowData, patient);

    // Preview actions without executing
    const actionPreviews = (workflowData.actions || []).map((action) => ({
      type: action.type,
      preview: getActionPreview(action, patient),
      delay_hours: action.delay_hours || 0,
    }));

    return {
      success: true,
      patient: {
        id: patient.id,
        name: `${patient.first_name} ${patient.last_name}`,
        email: patient.email,
        phone: patient.phone,
      },
      conditions_pass: conditionsPass,
      actions: actionPreviews,
    };
  } catch (error) {
    logger.error('Error testing workflow:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check and send appointment reminders
 * Called by scheduler hourly
 */
export const checkAppointmentReminders = async () => {
  // Get appointments in next 24-48 hours that haven't had reminders
  const result = await query(`
    SELECT
      a.id, a.patient_id, a.organization_id, a.appointment_date, a.appointment_time,
      p.first_name, p.last_name, p.phone, p.email
    FROM appointments a
    JOIN patients p ON p.id = a.patient_id
    WHERE a.appointment_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '2 days'
    AND a.status = 'scheduled'
    AND a.reminder_sent IS NOT TRUE
  `);

  let sent = 0;
  for (const appt of result.rows) {
    try {
      await triggerWorkflow(appt.organization_id, TRIGGER_TYPES.APPOINTMENT_SCHEDULED, {
        patient_id: appt.patient_id,
        appointment: appt,
        reminder: true,
      });

      await query('UPDATE appointments SET reminder_sent = true WHERE id = $1', [appt.id]);
      sent++;
    } catch (err) {
      logger.error(`Failed to send reminder for appointment ${appt.id}:`, err);
    }
  }

  return { checked: result.rows.length, sent };
};
