/**
 * Automations Controller
 * CRUD endpoints for workflow automation management
 */

import * as automationService from '../services/automations.js';
import * as triggerService from '../services/automationTriggers.js';
import { logAudit } from '../utils/audit.js';
import logger from '../utils/logger.js';

// =============================================================================
// WORKFLOW CRUD
// =============================================================================

/**
 * @route   GET /api/v1/automations/workflows
 * @desc    Get all workflows for the organization
 * @access  Private (ADMIN, PRACTITIONER)
 */
export const getWorkflows = async (req, res) => {
  try {
    const { organizationId } = req;
    const { isActive, triggerType, page, limit } = req.query;

    const options = {
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : null,
      triggerType: triggerType || null,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50
    };

    const result = await automationService.getWorkflows(organizationId, options);
    res.json(result);
  } catch (error) {
    logger.error('Error in getWorkflows controller:', error);
    res.status(500).json({ error: 'Failed to retrieve workflows' });
  }
};

/**
 * @route   GET /api/v1/automations/workflows/:id
 * @desc    Get a single workflow by ID
 * @access  Private (ADMIN, PRACTITIONER)
 */
export const getWorkflowById = async (req, res) => {
  try {
    const { organizationId } = req;
    const { id } = req.params;

    const workflow = await automationService.getWorkflowById(organizationId, id);

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    res.json(workflow);
  } catch (error) {
    logger.error('Error in getWorkflowById controller:', error);
    res.status(500).json({ error: 'Failed to retrieve workflow' });
  }
};

/**
 * @route   POST /api/v1/automations/workflows
 * @desc    Create a new workflow
 * @access  Private (ADMIN, PRACTITIONER)
 */
export const createWorkflow = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const workflowData = req.body;

    // Validate required fields
    if (!workflowData.name) {
      return res.status(400).json({ error: 'Workflow name is required' });
    }

    if (!workflowData.trigger_type) {
      return res.status(400).json({ error: 'Trigger type is required' });
    }

    // Validate trigger type
    const validTriggerTypes = Object.values(automationService.TRIGGER_TYPES);
    if (!validTriggerTypes.includes(workflowData.trigger_type)) {
      return res.status(400).json({
        error: 'Invalid trigger type',
        valid_types: validTriggerTypes
      });
    }

    // Validate actions if provided
    if (workflowData.actions && workflowData.actions.length > 0) {
      const validActionTypes = Object.values(automationService.ACTION_TYPES);
      for (const action of workflowData.actions) {
        if (!validActionTypes.includes(action.type)) {
          return res.status(400).json({
            error: `Invalid action type: ${action.type}`,
            valid_types: validActionTypes
          });
        }
      }
    }

    const workflow = await automationService.createWorkflow(organizationId, workflowData, user.id);

    await logAudit({
      organizationId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'CREATE',
      resourceType: 'WORKFLOW',
      resourceId: workflow.id,
      details: { name: workflowData.name, trigger_type: workflowData.trigger_type },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(201).json(workflow);
  } catch (error) {
    logger.error('Error in createWorkflow controller:', error);
    res.status(500).json({ error: 'Failed to create workflow' });
  }
};

/**
 * @route   PUT /api/v1/automations/workflows/:id
 * @desc    Update an existing workflow
 * @access  Private (ADMIN, PRACTITIONER)
 */
export const updateWorkflow = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const { id } = req.params;
    const updates = req.body;

    // Validate trigger type if being updated
    if (updates.trigger_type) {
      const validTriggerTypes = Object.values(automationService.TRIGGER_TYPES);
      if (!validTriggerTypes.includes(updates.trigger_type)) {
        return res.status(400).json({
          error: 'Invalid trigger type',
          valid_types: validTriggerTypes
        });
      }
    }

    // Validate actions if being updated
    if (updates.actions && updates.actions.length > 0) {
      const validActionTypes = Object.values(automationService.ACTION_TYPES);
      for (const action of updates.actions) {
        if (!validActionTypes.includes(action.type)) {
          return res.status(400).json({
            error: `Invalid action type: ${action.type}`,
            valid_types: validActionTypes
          });
        }
      }
    }

    const workflow = await automationService.updateWorkflow(organizationId, id, updates);

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    await logAudit({
      organizationId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'UPDATE',
      resourceType: 'WORKFLOW',
      resourceId: id,
      details: { fields_updated: Object.keys(updates) },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json(workflow);
  } catch (error) {
    logger.error('Error in updateWorkflow controller:', error);
    res.status(500).json({ error: 'Failed to update workflow' });
  }
};

/**
 * @route   DELETE /api/v1/automations/workflows/:id
 * @desc    Delete a workflow
 * @access  Private (ADMIN)
 */
export const deleteWorkflow = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const { id } = req.params;

    const deleted = await automationService.deleteWorkflow(organizationId, id);

    if (!deleted) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    await logAudit({
      organizationId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'DELETE',
      resourceType: 'WORKFLOW',
      resourceId: id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({ success: true, message: 'Workflow deleted' });
  } catch (error) {
    logger.error('Error in deleteWorkflow controller:', error);
    res.status(500).json({ error: 'Failed to delete workflow' });
  }
};

/**
 * @route   POST /api/v1/automations/workflows/:id/toggle
 * @desc    Toggle workflow active status
 * @access  Private (ADMIN, PRACTITIONER)
 */
export const toggleWorkflow = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const { id } = req.params;

    const workflow = await automationService.toggleWorkflow(organizationId, id);

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    await logAudit({
      organizationId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'UPDATE',
      resourceType: 'WORKFLOW',
      resourceId: id,
      details: { toggled_active: workflow.is_active },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json(workflow);
  } catch (error) {
    logger.error('Error in toggleWorkflow controller:', error);
    res.status(500).json({ error: 'Failed to toggle workflow' });
  }
};

// =============================================================================
// EXECUTION HISTORY
// =============================================================================

/**
 * @route   GET /api/v1/automations/workflows/:id/executions
 * @desc    Get execution history for a workflow
 * @access  Private (ADMIN, PRACTITIONER)
 */
export const getWorkflowExecutions = async (req, res) => {
  try {
    const { organizationId } = req;
    const { id } = req.params;
    const { page, limit, status } = req.query;

    const options = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
      status: status || null
    };

    const result = await automationService.getWorkflowExecutions(organizationId, id, options);

    if (!result) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    res.json(result);
  } catch (error) {
    logger.error('Error in getWorkflowExecutions controller:', error);
    res.status(500).json({ error: 'Failed to retrieve execution history' });
  }
};

/**
 * @route   GET /api/v1/automations/executions
 * @desc    Get all recent executions across all workflows
 * @access  Private (ADMIN, PRACTITIONER)
 */
export const getAllExecutions = async (req, res) => {
  try {
    const { organizationId } = req;
    const { page, limit, status, workflowId } = req.query;

    const offset = ((parseInt(page) || 1) - 1) * (parseInt(limit) || 50);

    let whereClause = 'WHERE w.organization_id = $1';
    const params = [organizationId];
    let paramIndex = 2;

    if (status) {
      params.push(status);
      whereClause += ` AND we.status = $${paramIndex}`;
      paramIndex++;
    }

    if (workflowId) {
      params.push(workflowId);
      whereClause += ` AND we.workflow_id = $${paramIndex}`;
      paramIndex++;
    }

    // Use dynamic import to get query function
    const { query } = await import('../config/database.js');

    params.push(parseInt(limit) || 50, offset);

    const result = await query(
      `SELECT
        we.*,
        w.name as workflow_name,
        w.trigger_type,
        p.first_name || ' ' || p.last_name as patient_name
      FROM workflow_executions we
      JOIN workflows w ON w.id = we.workflow_id
      LEFT JOIN patients p ON p.id = we.patient_id
      ${whereClause}
      ORDER BY we.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM workflow_executions we
      JOIN workflows w ON w.id = we.workflow_id
      ${whereClause}`,
      params.slice(0, -2)
    );

    res.json({
      executions: result.rows,
      pagination: {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 50,
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(parseInt(countResult.rows[0].count) / (parseInt(limit) || 50))
      }
    });
  } catch (error) {
    logger.error('Error in getAllExecutions controller:', error);
    res.status(500).json({ error: 'Failed to retrieve executions' });
  }
};

// =============================================================================
// TESTING
// =============================================================================

/**
 * @route   POST /api/v1/automations/workflows/test
 * @desc    Test workflow without executing actions
 * @access  Private (ADMIN, PRACTITIONER)
 */
export const testWorkflow = async (req, res) => {
  try {
    const { organizationId } = req;
    const { workflow, patient_id } = req.body;

    if (!workflow) {
      return res.status(400).json({ error: 'Workflow configuration is required' });
    }

    if (!patient_id) {
      return res.status(400).json({ error: 'Test patient ID is required' });
    }

    const result = await automationService.testWorkflow(organizationId, workflow, patient_id);
    res.json(result);
  } catch (error) {
    logger.error('Error in testWorkflow controller:', error);
    res.status(500).json({ error: 'Failed to test workflow' });
  }
};

// =============================================================================
// TRIGGERS & STATS
// =============================================================================

/**
 * @route   GET /api/v1/automations/triggers
 * @desc    Get available trigger types and their configurations
 * @access  Private (ADMIN, PRACTITIONER)
 */
export const getTriggerTypes = async (req, res) => {
  try {
    const triggerTypes = Object.entries(automationService.TRIGGER_TYPES).map(([key, value]) => ({
      id: value,
      name: key,
      label: formatTriggerLabel(value),
      label_no: formatTriggerLabelNorwegian(value),
      config_schema: getTriggerConfigSchema(value)
    }));

    res.json({ trigger_types: triggerTypes });
  } catch (error) {
    logger.error('Error in getTriggerTypes controller:', error);
    res.status(500).json({ error: 'Failed to retrieve trigger types' });
  }
};

/**
 * @route   GET /api/v1/automations/actions
 * @desc    Get available action types and their configurations
 * @access  Private (ADMIN, PRACTITIONER)
 */
export const getActionTypes = async (req, res) => {
  try {
    const actionTypes = Object.entries(automationService.ACTION_TYPES).map(([key, value]) => ({
      id: value,
      name: key,
      label: formatActionLabel(value),
      label_no: formatActionLabelNorwegian(value),
      config_schema: getActionConfigSchema(value)
    }));

    res.json({ action_types: actionTypes });
  } catch (error) {
    logger.error('Error in getActionTypes controller:', error);
    res.status(500).json({ error: 'Failed to retrieve action types' });
  }
};

/**
 * @route   GET /api/v1/automations/stats
 * @desc    Get automation statistics
 * @access  Private (ADMIN, PRACTITIONER)
 */
export const getStats = async (req, res) => {
  try {
    const { organizationId } = req;

    const stats = await triggerService.getTriggerStats(organizationId);
    const upcoming = await triggerService.getUpcomingTriggers(organizationId);

    res.json({
      trigger_stats: stats,
      upcoming_triggers: upcoming
    });
  } catch (error) {
    logger.error('Error in getStats controller:', error);
    res.status(500).json({ error: 'Failed to retrieve statistics' });
  }
};

/**
 * @route   POST /api/v1/automations/process
 * @desc    Manually trigger automation processing (for testing)
 * @access  Private (ADMIN)
 */
export const processAutomations = async (req, res) => {
  try {
    const { organizationId, user } = req;

    // Only allow in development or for admins
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can manually trigger processing' });
    }

    const result = await automationService.processAutomations(organizationId);

    await logAudit({
      organizationId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'EXECUTE',
      resourceType: 'AUTOMATION_PROCESS',
      details: result,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json(result);
  } catch (error) {
    logger.error('Error in processAutomations controller:', error);
    res.status(500).json({ error: 'Failed to process automations' });
  }
};

/**
 * @route   POST /api/v1/automations/process-time-triggers
 * @desc    Manually trigger time-based automation processing
 * @access  Private (ADMIN)
 */
export const processTimeTriggers = async (req, res) => {
  try {
    const { organizationId, user } = req;

    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can manually trigger processing' });
    }

    const result = await triggerService.processTimeTriggers(organizationId);

    await logAudit({
      organizationId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'EXECUTE',
      resourceType: 'TIME_TRIGGER_PROCESS',
      details: result,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json(result);
  } catch (error) {
    logger.error('Error in processTimeTriggers controller:', error);
    res.status(500).json({ error: 'Failed to process time triggers' });
  }
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Format trigger type label (English)
 */
const formatTriggerLabel = (triggerType) => {
  const labels = {
    PATIENT_CREATED: 'Patient Created',
    APPOINTMENT_SCHEDULED: 'Appointment Scheduled',
    APPOINTMENT_COMPLETED: 'Appointment Completed',
    APPOINTMENT_MISSED: 'Appointment Missed (No Show)',
    APPOINTMENT_CANCELLED: 'Appointment Cancelled',
    DAYS_SINCE_VISIT: 'Days Since Last Visit',
    BIRTHDAY: 'Patient Birthday',
    LIFECYCLE_CHANGE: 'Lifecycle Stage Changed',
    CUSTOM: 'Custom Trigger'
  };
  return labels[triggerType] || triggerType;
};

/**
 * Format trigger type label (Norwegian)
 */
const formatTriggerLabelNorwegian = (triggerType) => {
  const labels = {
    PATIENT_CREATED: 'Ny pasient opprettet',
    APPOINTMENT_SCHEDULED: 'Time bestilt',
    APPOINTMENT_COMPLETED: 'Time fullfort',
    APPOINTMENT_MISSED: 'Uteblitt fra time',
    APPOINTMENT_CANCELLED: 'Time avbestilt',
    DAYS_SINCE_VISIT: 'Dager siden siste besok',
    BIRTHDAY: 'Pasientens bursdag',
    LIFECYCLE_CHANGE: 'Livssyklusstatus endret',
    CUSTOM: 'Egendefinert trigger'
  };
  return labels[triggerType] || triggerType;
};

/**
 * Format action type label (English)
 */
const formatActionLabel = (actionType) => {
  const labels = {
    SEND_SMS: 'Send SMS',
    SEND_EMAIL: 'Send Email',
    CREATE_FOLLOW_UP: 'Create Follow-up Task',
    UPDATE_STATUS: 'Update Patient Status',
    UPDATE_LIFECYCLE: 'Update Lifecycle Stage',
    NOTIFY_STAFF: 'Notify Staff',
    ADD_TAG: 'Add Patient Tag',
    CREATE_TASK: 'Create Task'
  };
  return labels[actionType] || actionType;
};

/**
 * Format action type label (Norwegian)
 */
const formatActionLabelNorwegian = (actionType) => {
  const labels = {
    SEND_SMS: 'Send SMS',
    SEND_EMAIL: 'Send e-post',
    CREATE_FOLLOW_UP: 'Opprett oppfolgingsoppgave',
    UPDATE_STATUS: 'Oppdater pasientstatus',
    UPDATE_LIFECYCLE: 'Oppdater livssyklusstatus',
    NOTIFY_STAFF: 'Varsle ansatte',
    ADD_TAG: 'Legg til pasientetikett',
    CREATE_TASK: 'Opprett oppgave'
  };
  return labels[actionType] || actionType;
};

/**
 * Get configuration schema for trigger type
 */
const getTriggerConfigSchema = (triggerType) => {
  const schemas = {
    PATIENT_CREATED: {},
    APPOINTMENT_SCHEDULED: {
      appointment_type: { type: 'string', label: 'Appointment Type', label_no: 'Timetype' }
    },
    APPOINTMENT_COMPLETED: {
      appointment_type: { type: 'string', label: 'Appointment Type', label_no: 'Timetype' }
    },
    APPOINTMENT_MISSED: {},
    APPOINTMENT_CANCELLED: {},
    DAYS_SINCE_VISIT: {
      days: { type: 'number', label: 'Days Since Last Visit', label_no: 'Dager siden siste besok', default: 42 },
      exclude_statuses: { type: 'array', label: 'Exclude Statuses', label_no: 'Ekskluder statuser' }
    },
    BIRTHDAY: {
      days_before: { type: 'number', label: 'Days Before Birthday', label_no: 'Dager for bursdag', default: 0 }
    },
    LIFECYCLE_CHANGE: {
      from_stage: { type: 'string', label: 'From Stage', label_no: 'Fra status' },
      to_stage: { type: 'string', label: 'To Stage', label_no: 'Til status' }
    },
    CUSTOM: {
      event_type: { type: 'string', label: 'Event Type', label_no: 'Hendelsestype' }
    }
  };
  return schemas[triggerType] || {};
};

/**
 * Get configuration schema for action type
 */
const getActionConfigSchema = (actionType) => {
  const schemas = {
    SEND_SMS: {
      message: { type: 'text', label: 'Message', label_no: 'Melding', required: true },
      template_id: { type: 'uuid', label: 'Template ID', label_no: 'Mal-ID' },
      delay_hours: { type: 'number', label: 'Delay (hours)', label_no: 'Forsinkelse (timer)', default: 0 }
    },
    SEND_EMAIL: {
      subject: { type: 'string', label: 'Subject', label_no: 'Emne', required: true },
      body: { type: 'text', label: 'Body', label_no: 'Innhold', required: true },
      template_id: { type: 'uuid', label: 'Template ID', label_no: 'Mal-ID' },
      delay_hours: { type: 'number', label: 'Delay (hours)', label_no: 'Forsinkelse (timer)', default: 0 }
    },
    CREATE_FOLLOW_UP: {
      follow_up_type: { type: 'string', label: 'Follow-up Type', label_no: 'Oppfolgingstype', default: 'CUSTOM' },
      reason: { type: 'string', label: 'Reason', label_no: 'Arsak' },
      priority: { type: 'string', label: 'Priority', label_no: 'Prioritet', options: ['HIGH', 'MEDIUM', 'LOW'], default: 'MEDIUM' },
      due_in_days: { type: 'number', label: 'Due In Days', label_no: 'Forfall om dager', default: 7 },
      assigned_to: { type: 'uuid', label: 'Assign To', label_no: 'Tildel til' }
    },
    UPDATE_STATUS: {
      value: { type: 'string', label: 'New Status', label_no: 'Ny status', options: ['ACTIVE', 'INACTIVE', 'FINISHED'], required: true }
    },
    UPDATE_LIFECYCLE: {
      value: { type: 'string', label: 'New Stage', label_no: 'Ny status', options: ['NEW', 'ONBOARDING', 'ACTIVE', 'AT_RISK', 'INACTIVE', 'LOST', 'REACTIVATED'], required: true }
    },
    NOTIFY_STAFF: {
      message: { type: 'text', label: 'Notification Message', label_no: 'Varslingsmelding', required: true },
      roles: { type: 'array', label: 'Notify Roles', label_no: 'Varsle roller', default: ['ADMIN', 'PRACTITIONER'] },
      staff_ids: { type: 'array', label: 'Specific Staff', label_no: 'Spesifikke ansatte' },
      priority: { type: 'string', label: 'Priority', label_no: 'Prioritet', options: ['HIGH', 'MEDIUM', 'LOW'], default: 'MEDIUM' }
    },
    ADD_TAG: {
      tag: { type: 'string', label: 'Tag', label_no: 'Etikett', required: true }
    },
    CREATE_TASK: {
      task_type: { type: 'string', label: 'Task Type', label_no: 'Oppgavetype', default: 'CUSTOM' },
      description: { type: 'string', label: 'Description', label_no: 'Beskrivelse', required: true },
      priority: { type: 'string', label: 'Priority', label_no: 'Prioritet', options: ['HIGH', 'MEDIUM', 'LOW'], default: 'MEDIUM' },
      due_in_days: { type: 'number', label: 'Due In Days', label_no: 'Forfall om dager', default: 1 },
      assigned_to: { type: 'uuid', label: 'Assign To', label_no: 'Tildel til' }
    }
  };
  return schemas[actionType] || {};
};

export default {
  getWorkflows,
  getWorkflowById,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  toggleWorkflow,
  getWorkflowExecutions,
  getAllExecutions,
  testWorkflow,
  getTriggerTypes,
  getActionTypes,
  getStats,
  processAutomations,
  processTimeTriggers
};
