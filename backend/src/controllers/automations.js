/**
 * Automations Controller — Barrel re-export
 * Sub-modules: automationsCore.js, automationsWorkflow.js
 */

export {
  getWorkflows,
  getWorkflowById,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  toggleWorkflow,
  getWorkflowExecutions,
  testWorkflow,
} from './automationsCore.js';

export {
  getAllExecutions,
  getTriggerTypes,
  getActionTypes,
  getStats,
  processAutomations,
  processTimeTriggers,
} from './automationsWorkflow.js';

import * as core from './automationsCore.js';
import * as workflow from './automationsWorkflow.js';

export default { ...core, ...workflow };
