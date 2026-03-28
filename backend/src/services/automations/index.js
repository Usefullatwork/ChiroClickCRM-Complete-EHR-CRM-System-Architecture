/**
 * Automation Service - Re-exports all sub-modules for backward compatibility
 * Also wires domain events to automation triggers
 */

export * from './triggers.js';
export * from './conditions.js';
export * from './actions.js';
export * from './engine.js';

import { eventBus, DOMAIN_EVENTS } from '../../domain/events/index.js';
import {
  triggerWorkflow,
  getWorkflows,
  getWorkflowById,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  toggleWorkflow,
  getWorkflowExecutions,
  processAutomations,
  executeWorkflow,
  testWorkflow,
  checkAppointmentReminders,
} from './engine.js';
import { TRIGGER_TYPES, evaluateTrigger } from './triggers.js';
import { OPERATORS, evaluateConditions } from './conditions.js';
import { ACTION_TYPES, executeActions } from './actions.js';
import { checkDaysSinceVisitTriggers, checkBirthdayTriggers } from '../automationTriggers.js';
import logger from '../../utils/logger.js';

// Wire encounter domain events to automation engine
eventBus.on(
  DOMAIN_EVENTS.ENCOUNTER_CREATED,
  async (event) => {
    const orgId = event.metadata?.organizationId;
    if (!orgId) {
      return;
    }
    try {
      await triggerWorkflow(orgId, TRIGGER_TYPES.ENCOUNTER_CREATED, event.payload);
    } catch (err) {
      logger.error('Automation trigger failed for ENCOUNTER_CREATED:', { error: err.message });
    }
  },
  { suppressErrors: true }
);

eventBus.on(
  DOMAIN_EVENTS.ENCOUNTER_SIGNED,
  async (event) => {
    const orgId = event.metadata?.organizationId;
    if (!orgId) {
      return;
    }
    try {
      await triggerWorkflow(orgId, TRIGGER_TYPES.ENCOUNTER_SIGNED, event.payload);
    } catch (err) {
      logger.error('Automation trigger failed for ENCOUNTER_SIGNED:', { error: err.message });
    }
  },
  { suppressErrors: true }
);

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
  checkDaysSinceVisitTriggers,
  checkBirthdayTriggers,
};
