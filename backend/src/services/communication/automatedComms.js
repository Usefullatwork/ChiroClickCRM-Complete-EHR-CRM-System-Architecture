/**
 * Automated Communications Service
 *
 * Barrel re-export — all functions split into domain modules:
 *   commsTemplating.js  — Templates, variable substitution, message queuing
 *   commsScheduling.js  — Appointment, exercise, and follow-up reminder checks
 *   commsDelivery.js    — Birthday, visit recall, batch runner, and stats
 */

export {
  substituteVariables,
  getOrganizationSettings,
  getTemplate,
  queueMessage,
  logSentMessage,
} from './commsTemplating.js';

export {
  checkAppointmentReminders24h,
  checkAppointmentReminders1h,
  checkExerciseInactivity,
  checkFollowUpReminders,
} from './commsScheduling.js';

export {
  checkBirthdayGreetings,
  checkDaysSinceVisit,
  runAutomatedChecks,
  getAutomationStats,
} from './commsDelivery.js';

export default {
  substituteVariables: (await import('./commsTemplating.js')).substituteVariables,
  getTemplate: (await import('./commsTemplating.js')).getTemplate,
  queueMessage: (await import('./commsTemplating.js')).queueMessage,
  logSentMessage: (await import('./commsTemplating.js')).logSentMessage,
  checkAppointmentReminders24h: (await import('./commsScheduling.js')).checkAppointmentReminders24h,
  checkAppointmentReminders1h: (await import('./commsScheduling.js')).checkAppointmentReminders1h,
  checkExerciseInactivity: (await import('./commsScheduling.js')).checkExerciseInactivity,
  checkFollowUpReminders: (await import('./commsScheduling.js')).checkFollowUpReminders,
  checkBirthdayGreetings: (await import('./commsDelivery.js')).checkBirthdayGreetings,
  checkDaysSinceVisit: (await import('./commsDelivery.js')).checkDaysSinceVisit,
  runAutomatedChecks: (await import('./commsDelivery.js')).runAutomatedChecks,
  getAutomationStats: (await import('./commsDelivery.js')).getAutomationStats,
};
