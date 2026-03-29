/**
 * API barrel export — re-exports all domain modules
 */

// Client utilities
export {
  default as default,
  setOrganizationId,
  getOrganizationId,
  clearOrganizationId,
  getApiBaseUrl,
  initializeCSRF,
  API_URL,
} from './client';

// Patient domain
export { patientsAPI, patientPortalAPI, gdprAPI, importAPI } from './patients';

// Billing domain
export { financialAPI, billingAPI, pdfAPI } from './billing';

// Clinical domain
export {
  encountersAPI,
  encounterValidationAPI,
  workflowAPI,
  appointmentsAPI,
  diagnosisAPI,
  treatmentsAPI,
  templatesAPI,
  examinationsAPI,
  spineTemplatesAPI,
  exercisesAPI,
  vestibularAPI,
  macrosAPI,
  outcomesAPI,
  treatmentPlansAPI,
  followUpsAPI,
  progressAPI,
  clinicalSettingsAPI,
} from './clinical';

// Communications domain
export {
  communicationsAPI,
  bulkCommunicationsAPI,
  schedulerAPI,
  notificationsAPI,
} from './communications';

// AI domain
export { aiAPI, aiFeedbackAPI, aiRetrainingAPI, curationAPI, trainingAPI } from './ai';

// Admin domain
export {
  authAPI,
  organizationAPI,
  usersAPI,
  dashboardAPI,
  kpiAPI,
  analyticsAPI,
  crmAPI,
  automationsAPI,
  auditLogsAPI,
  backupAPI,
  kioskAPI,
  autoAcceptAPI,
  portalAPI,
} from './admin';
