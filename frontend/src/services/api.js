/**
 * API Client — thin barrel re-exporting from domain modules
 * All API methods have been split into:
 *   - api/client.js       — axios instance, interceptors, org storage
 *   - api/patients.js     — patient CRUD, search, GDPR, import
 *   - api/billing.js      — invoices, payments, HELFO, financial
 *   - api/clinical.js     — encounters, SOAP, diagnoses, examinations, exercises
 *   - api/communications.js — email, SMS, bulk, scheduler
 *   - api/ai.js           — AI suggestions, training, feedback
 *   - api/admin.js        — auth, users, orgs, dashboard, CRM, automations
 */
export * from './api/index.js';
export { default } from './api/index.js';
