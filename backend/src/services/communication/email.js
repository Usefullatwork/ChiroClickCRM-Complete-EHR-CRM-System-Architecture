/**
 * Email Service — Re-export Barrel
 *
 * All email functionality now lives in emailService.js.
 * This file preserves backward compatibility for any imports from './email.js'.
 *
 * @module services/communication/email
 * @deprecated Import from './emailService.js' instead
 */

export {
  sendEmail,
  sendBulkEmails,
  sendTemplatedEmail,
  sendExerciseProgramEmail,
  sendAppointmentReminderEmail,
  compileTemplate,
  verifyConfiguration,
  trackOpen,
  trackClick,
} from './emailService.js';

export { default } from './emailService.js';
