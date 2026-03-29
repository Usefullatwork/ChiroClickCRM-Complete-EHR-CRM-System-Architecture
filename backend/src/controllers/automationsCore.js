/**
 * Automations Controller — Core CRUD
 * Workflow CRUD, toggling, and execution history
 */

import * as automationService from '../services/automations/index.js';
import { logAudit } from '../utils/audit.js';
import logger from '../utils/logger.js';

export const getWorkflows = async (req, res) => {
  try {
    const { organizationId } = req;
    const { isActive, triggerType, page, limit } = req.query;
    const options = {
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : null,
      triggerType: triggerType || null,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
    };
    const result = await automationService.getWorkflows(organizationId, options);
    res.json(result);
  } catch (error) {
    logger.error('Error in getWorkflows controller:', error);
    res.status(500).json({ error: 'Failed to retrieve workflows' });
  }
};

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

export const createWorkflow = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const workflowData = req.body;
    if (!workflowData.name) {
      return res.status(400).json({ error: 'Workflow name is required' });
    }
    if (!workflowData.trigger_type) {
      return res.status(400).json({ error: 'Trigger type is required' });
    }

    const validTriggerTypes = Object.values(automationService.TRIGGER_TYPES);
    if (!validTriggerTypes.includes(workflowData.trigger_type)) {
      return res
        .status(400)
        .json({ error: 'Invalid trigger type', valid_types: validTriggerTypes });
    }

    if (workflowData.actions && workflowData.actions.length > 0) {
      const validActionTypes = Object.values(automationService.ACTION_TYPES);
      for (const action of workflowData.actions) {
        if (!validActionTypes.includes(action.type)) {
          return res
            .status(400)
            .json({ error: `Invalid action type: ${action.type}`, valid_types: validActionTypes });
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
      userAgent: req.get('user-agent'),
    });
    res.status(201).json(workflow);
  } catch (error) {
    logger.error('Error in createWorkflow controller:', error);
    res.status(500).json({ error: 'Failed to create workflow' });
  }
};

export const updateWorkflow = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const { id } = req.params;
    const updates = req.body;

    if (updates.trigger_type) {
      const validTriggerTypes = Object.values(automationService.TRIGGER_TYPES);
      if (!validTriggerTypes.includes(updates.trigger_type)) {
        return res
          .status(400)
          .json({ error: 'Invalid trigger type', valid_types: validTriggerTypes });
      }
    }
    if (updates.actions && updates.actions.length > 0) {
      const validActionTypes = Object.values(automationService.ACTION_TYPES);
      for (const action of updates.actions) {
        if (!validActionTypes.includes(action.type)) {
          return res
            .status(400)
            .json({ error: `Invalid action type: ${action.type}`, valid_types: validActionTypes });
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
      userAgent: req.get('user-agent'),
    });
    res.json(workflow);
  } catch (error) {
    logger.error('Error in updateWorkflow controller:', error);
    res.status(500).json({ error: 'Failed to update workflow' });
  }
};

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
      userAgent: req.get('user-agent'),
    });
    res.json({ success: true, message: 'Workflow deleted' });
  } catch (error) {
    logger.error('Error in deleteWorkflow controller:', error);
    res.status(500).json({ error: 'Failed to delete workflow' });
  }
};

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
      userAgent: req.get('user-agent'),
    });
    res.json(workflow);
  } catch (error) {
    logger.error('Error in toggleWorkflow controller:', error);
    res.status(500).json({ error: 'Failed to toggle workflow' });
  }
};

export const getWorkflowExecutions = async (req, res) => {
  try {
    const { organizationId } = req;
    const { id } = req.params;
    const { page, limit, status } = req.query;
    const options = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
      status: status || null,
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
