/**
 * Smart Communication Scheduler Service
 *
 * Barrel re-export — all functions split into domain modules:
 *   scheduleOptimizer.js    — Core scheduling, follow-up rules, processing, import
 *   scheduleConflicts.js    — Decision management for conflicts
 *   scheduleAvailability.js — Rules, stats, and message management
 */

export {
  scheduleCommuncation,
  scheduleFollowUpAfterVisit,
  processDueCommunications,
  importAppointments,
} from './scheduleOptimizer.js';

export { getPendingDecisions, resolveDecision, bulkResolveDecisions } from './scheduleConflicts.js';

export {
  getCommunicationRules,
  updateCommunicationRule,
  getPatientScheduledComms,
  getSchedulerStats,
  getTodaysMessages,
  cancelScheduledMessage,
  sendApprovedMessages,
} from './scheduleAvailability.js';

export default {
  scheduleCommuncation: (await import('./scheduleOptimizer.js')).scheduleCommuncation,
  scheduleFollowUpAfterVisit: (await import('./scheduleOptimizer.js')).scheduleFollowUpAfterVisit,
  getPendingDecisions: (await import('./scheduleConflicts.js')).getPendingDecisions,
  resolveDecision: (await import('./scheduleConflicts.js')).resolveDecision,
  bulkResolveDecisions: (await import('./scheduleConflicts.js')).bulkResolveDecisions,
  processDueCommunications: (await import('./scheduleOptimizer.js')).processDueCommunications,
  importAppointments: (await import('./scheduleOptimizer.js')).importAppointments,
  getCommunicationRules: (await import('./scheduleAvailability.js')).getCommunicationRules,
  updateCommunicationRule: (await import('./scheduleAvailability.js')).updateCommunicationRule,
  getPatientScheduledComms: (await import('./scheduleAvailability.js')).getPatientScheduledComms,
  getSchedulerStats: (await import('./scheduleAvailability.js')).getSchedulerStats,
  getTodaysMessages: (await import('./scheduleAvailability.js')).getTodaysMessages,
  cancelScheduledMessage: (await import('./scheduleAvailability.js')).cancelScheduledMessage,
  sendApprovedMessages: (await import('./scheduleAvailability.js')).sendApprovedMessages,
};
