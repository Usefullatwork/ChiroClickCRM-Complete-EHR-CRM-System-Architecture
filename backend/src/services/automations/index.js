/**
 * Automation Service - Re-exports all sub-modules for backward compatibility
 */

export * from './triggers.js';
export * from './conditions.js';
export * from './actions.js';
export * from './engine.js';

// Preserve default export for backward compatibility
import { TRIGGER_TYPES, evaluateTrigger } from './triggers.js';
import { OPERATORS, evaluateConditions } from './conditions.js';
import { ACTION_TYPES, executeActions } from './actions.js';
import {
  getWorkflows,
  getWorkflowById,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  toggleWorkflow,
  getWorkflowExecutions,
  processAutomations,
  triggerWorkflow,
  executeWorkflow,
  testWorkflow,
  checkAppointmentReminders,
} from './engine.js';

export default {
  TRIGGER_TYPES,
  ACTION_TYPES,
  OPERATORS,
  getWorkflows,
  getWorkflowById,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  toggleWorkflow,
  getWorkflowExecutions,
  processAutomations,
  triggerWorkflow,
  evaluateTrigger,
  evaluateConditions,
  executeWorkflow,
  executeActions,
  testWorkflow,
  checkAppointmentReminders,
};
