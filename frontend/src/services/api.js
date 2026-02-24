/**
 * API Client
 * Centralized API communication with ChiroClickCRM backend
 */

import axios from 'axios';
import logger from '../utils/logger';

const log = logger.scope('API');

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
const API_TIMEOUT = import.meta.env.VITE_API_TIMEOUT || 30000;

/**
 * Get the base API URL (without /api/v1 suffix) for use outside the axios client
 */
export const getApiBaseUrl = () => {
  const url = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
  return url.replace(/\/api\/v1\/?$/, '');
};

// Secure organization storage using sessionStorage (more secure than localStorage)
// Organization ID is cleared when browser tab is closed
const ORG_STORAGE_KEY = 'org_session';

/**
 * Securely store organization ID
 * Uses sessionStorage which is cleared when the browser tab closes
 * @param {string} organizationId - The organization ID to store
 */
export const setOrganizationId = (organizationId) => {
  if (!organizationId) {
    sessionStorage.removeItem(ORG_STORAGE_KEY);
    return;
  }
  // Store with timestamp for potential expiry checks
  const data = {
    id: organizationId,
    ts: Date.now(),
  };
  sessionStorage.setItem(ORG_STORAGE_KEY, btoa(JSON.stringify(data)));
};

// Default organization ID for desktop/development mode
const DEV_ORGANIZATION_ID = 'a0000000-0000-0000-0000-000000000001';

/**
 * Retrieve organization ID from secure storage
 * @returns {string|null} The organization ID or null if not set
 */
export const getOrganizationId = () => {
  try {
    const stored = sessionStorage.getItem(ORG_STORAGE_KEY);
    if (!stored) {
      // Fallback to localStorage for migration (remove after initial deployment)
      const legacyId = localStorage.getItem('organizationId');
      if (legacyId) {
        setOrganizationId(legacyId);
        localStorage.removeItem('organizationId'); // Clean up legacy storage
        return legacyId;
      }
      // Use default organization ID in development mode
      if (import.meta.env.DEV) {
        return DEV_ORGANIZATION_ID;
      }
      return null;
    }
    const data = JSON.parse(atob(stored));
    // Optional: Add expiry check (e.g., 24 hours)
    const MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours
    if (Date.now() - data.ts > MAX_AGE) {
      sessionStorage.removeItem(ORG_STORAGE_KEY);
      return null;
    }
    return data.id;
  } catch {
    sessionStorage.removeItem(ORG_STORAGE_KEY);
    return null;
  }
};

/**
 * Clear organization ID from storage
 */
export const clearOrganizationId = () => {
  sessionStorage.removeItem(ORG_STORAGE_KEY);
  localStorage.removeItem('organizationId'); // Clean up legacy storage
};

/**
 * Initialize CSRF protection
 * Fetches CSRF token from the server and stores it for subsequent requests
 * Note: Currently a no-op as backend uses session-based auth
 */
export const initializeCSRF = async () => {
  // CSRF is not needed when using JWT/Bearer token authentication
  // This is a placeholder for future CSRF implementation if needed
  log.debug('API client initialized');
  return true;
};

// Create axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable cookies for secure session handling
});

// CSRF token interceptor - reads XSRF-TOKEN cookie and sends as header
apiClient.interceptors.request.use((config) => {
  const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
  if (match) {
    config.headers['X-XSRF-TOKEN'] = match[1];
  }
  return config;
});

// Request interceptor - Add organization ID header
apiClient.interceptors.request.use(
  async (config) => {
    // Get organization ID from secure storage
    const organizationId = getOrganizationId();
    if (!organizationId) {
      // Organization ID is required for most API calls
      // Allow some endpoints without org ID (e.g., organization selection)
      const exemptPaths = ['/organizations', '/users/me'];
      const isExempt = exemptPaths.some((path) => config.url?.includes(path));

      if (!isExempt) {
        log.error('Organization ID is missing. Please select an organization.');
        return Promise.reject(
          new Error('Organization ID is required. Please select an organization in settings.')
        );
      }
    } else {
      config.headers['X-Organization-Id'] = organizationId;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // Unauthorized - log warning (desktop mode has no external login page)
          log.warn('401 Unauthorized - session may have expired');
          break;
        case 403:
          // Forbidden
          log.error('Access denied', { message: data.message });
          break;
        case 404:
          // Not found
          log.warn('Resource not found', { message: data.message });
          break;
        case 429:
          // Rate limit exceeded
          log.warn('Too many requests', { message: data.message });
          break;
        case 500:
          // Server error
          log.error('Server error', { message: data.message });
          break;
        default:
          log.error('API error', { status, message: data.message });
      }
    } else if (error.request) {
      // Request made but no response
      log.error('Network error: No response from server');
    } else {
      // Something else happened
      log.error('Request error', { message: error.message });
    }

    return Promise.reject(error);
  }
);

// ============================================================================
// API METHODS
// ============================================================================

// Patients
export const patientsAPI = {
  getAll: (params) => apiClient.get('/patients', { params }),
  getById: (id) => apiClient.get(`/patients/${id}`),
  create: (data) => apiClient.post('/patients', data),
  update: (id, data) => apiClient.patch(`/patients/${id}`, data),
  delete: (id) => apiClient.delete(`/patients/${id}`),
  search: (query) => apiClient.get('/patients/search', { params: { q: query } }),
  getStatistics: (id) => apiClient.get(`/patients/${id}/statistics`),
};

// Clinical Encounters
export const encountersAPI = {
  getAll: (params) => apiClient.get('/encounters', { params }),
  getById: (id) => apiClient.get(`/encounters/${id}`),
  getByPatient: (patientId) => apiClient.get(`/patients/${patientId}/encounters`),
  create: (data) => apiClient.post('/encounters', data),
  update: (id, data) => apiClient.patch(`/encounters/${id}`, data),
  sign: (id) => apiClient.post(`/encounters/${id}/sign`),
  generateNote: (id) => apiClient.post(`/encounters/${id}/generate-note`),
  // SALT (Same As Last Time) - get last similar encounter for quick documentation
  getLastSimilar: (patientId, options = {}) =>
    apiClient.get(`/patients/${patientId}/encounters/last-similar`, { params: options }),
  // Amendments for signed encounters
  getAmendments: (encounterId) => apiClient.get(`/encounters/${encounterId}/amendments`),
  createAmendment: (encounterId, data) =>
    apiClient.post(`/encounters/${encounterId}/amendments`, data),
  signAmendment: (encounterId, amendmentId) =>
    apiClient.post(`/encounters/${encounterId}/amendments/${amendmentId}/sign`),
  deleteAmendment: (encounterId, amendmentId) =>
    apiClient.delete(`/encounters/${encounterId}/amendments/${amendmentId}`),
};

// Appointments
export const appointmentsAPI = {
  getAll: (params) => apiClient.get('/appointments', { params }),
  getById: (id) => apiClient.get(`/appointments/${id}`),
  getByDate: (date) => apiClient.get('/appointments', { params: { date } }),
  create: (data) => apiClient.post('/appointments', data),
  update: (id, data) => apiClient.patch(`/appointments/${id}`, data),
  cancel: (id, reason) => apiClient.post(`/appointments/${id}/cancel`, { reason }),
  confirm: (id) => apiClient.post(`/appointments/${id}/confirm`),
  checkIn: (id) => apiClient.post(`/appointments/${id}/check-in`),
};

// Communications
export const communicationsAPI = {
  getAll: (params) => apiClient.get('/communications', { params }),
  getById: (id) => apiClient.get(`/communications/${id}`),
  getByPatient: (patientId) => apiClient.get(`/patients/${patientId}/communications`),
  sendSMS: (data) => apiClient.post('/communications/sms', data),
  sendEmail: (data) => apiClient.post('/communications/email', data),
  getTemplates: () => apiClient.get('/communications/templates'),
};

// Follow-ups
export const followUpsAPI = {
  getAll: (params) => apiClient.get('/followups', { params }),
  getById: (id) => apiClient.get(`/followups/${id}`),
  create: (data) => apiClient.post('/followups', data),
  update: (id, data) => apiClient.patch(`/followups/${id}`, data),
  complete: (id, notes) => apiClient.post(`/followups/${id}/complete`, { notes }),
  skip: (id, reason) => apiClient.post(`/followups/${id}/skip`, { reason }),
  getPatientsNeedingFollowUp: () => apiClient.get('/followups/patients/needingFollowUp'),
  markPatientAsContacted: (patientId, method) =>
    apiClient.post(`/followups/patients/${patientId}/contacted`, { method }),
  getRecallSchedule: (patientId) => apiClient.get(`/followups/recall-schedule/${patientId}`),
  getRecallRules: () => apiClient.get('/followups/recall-rules'),
  updateRecallRules: (rules) => apiClient.post('/followups/recall-rules', rules),
};

// Financial
export const financialAPI = {
  getAll: (params) => apiClient.get('/financial', { params }),
  getById: (id) => apiClient.get(`/financial/${id}`),
  getByPatient: (patientId) => apiClient.get(`/financial/patient/${patientId}`),
  create: (data) => apiClient.post('/financial', data),
  updatePaymentStatus: (id, data) => apiClient.patch(`/financial/${id}/payment-status`, data),
  getSummary: (params) => apiClient.get('/financial/summary', { params }),
  getRevenueByCode: (params) => apiClient.get('/financial/revenue-by-code', { params }),
  getPaymentMethods: (params) => apiClient.get('/financial/payment-methods', { params }),
  getOutstanding: (params) => apiClient.get('/financial/outstanding', { params }),
  getDailyRevenueChart: (params) => apiClient.get('/financial/chart/daily-revenue', { params }),
  generateInvoiceNumber: () => apiClient.get('/financial/invoice-number'),
};

// Dashboard
export const dashboardAPI = {
  getStats: () => apiClient.get('/dashboard/stats'),
  getTodayAppointments: () => apiClient.get('/dashboard/appointments/today'),
  getPendingTasks: () => apiClient.get('/dashboard/tasks/pending'),
  getRevenueTrend: (params) => apiClient.get('/dashboard/revenue-trend', { params }),
  getUtilization: (params) => apiClient.get('/dashboard/utilization', { params }),
  getNoShowTrend: (params) => apiClient.get('/dashboard/no-show-trend', { params }),
  getPatientFlow: (params) => apiClient.get('/dashboard/patient-flow', { params }),
};

// KPI Dashboard
export const kpiAPI = {
  getDashboard: (params) => apiClient.get('/kpi/dashboard', { params }),
  getDaily: (date) => apiClient.get('/kpi/daily', { params: { date } }),
  getWeekly: (startDate) => apiClient.get('/kpi/weekly', { params: { startDate } }),
  getMonthly: (month, year) => apiClient.get('/kpi/monthly', { params: { month, year } }),
  getPatientRetention: () => apiClient.get('/kpi/retention'),
  getRebookingRate: () => apiClient.get('/kpi/rebooking-rate'),
  getTopDiagnoses: (limit) => apiClient.get('/kpi/top-diagnoses', { params: { limit } }),
  // Detailed KPI tracking
  getDetailedKPIs: (startDate, endDate) =>
    apiClient.get('/kpi/detailed', { params: { startDate, endDate } }),
  getCategoryBreakdown: (startDate, endDate) =>
    apiClient.get('/kpi/category-breakdown', { params: { startDate, endDate } }),
  getGeographicDistribution: (startDate, endDate) =>
    apiClient.get('/kpi/geographic', { params: { startDate, endDate } }),
  importData: (data) => apiClient.post('/kpi/import', { data }),
};

// Diagnosis Codes
export const diagnosisAPI = {
  search: (query) => apiClient.get('/diagnosis/search', { params: { q: query } }),
  getCommon: () => apiClient.get('/diagnosis/common'),
  getByCode: (code) => apiClient.get(`/diagnosis/${code}`),
};

// Treatment Codes
export const treatmentsAPI = {
  getAll: () => apiClient.get('/treatments'),
  getCommon: () => apiClient.get('/treatments/common'),
  getByCode: (code) => apiClient.get(`/treatments/${code}`),
};

// Organization
export const organizationAPI = {
  getCurrent: () => apiClient.get('/organizations/current'),
  update: (data) => apiClient.patch('/organizations/current', data),
  getUsers: () => apiClient.get('/organizations/current/users'),
  inviteUser: (data) => apiClient.post('/organizations/current/invite', data),
};

// Users
export const usersAPI = {
  getCurrent: () => apiClient.get('/users/me'),
  update: (data) => apiClient.patch('/users/me', data),
  getAll: () => apiClient.get('/users'),
};

// Clinical Templates
export const templatesAPI = {
  getAll: (params) => apiClient.get('/templates', { params }),
  getByCategory: (params) => apiClient.get('/templates/by-category', { params }),
  getById: (id) => apiClient.get(`/templates/${id}`),
  create: (data) => apiClient.post('/templates', data),
  update: (id, data) => apiClient.patch(`/templates/${id}`, data),
  delete: (id) => apiClient.delete(`/templates/${id}`),
  toggleFavorite: (id) => apiClient.post(`/templates/${id}/favorite`),
  trackUsage: (id, data) => apiClient.post(`/templates/${id}/use`, data),
  incrementUsage: (id) => apiClient.post(`/templates/${id}/use`),
  getCategories: (params) => apiClient.get('/templates/categories', { params }),
  search: (query, language = 'NO') =>
    apiClient.get('/templates/search', { params: { q: query, language } }),

  // Orthopedic Tests Library
  getTestsLibrary: (params) => apiClient.get('/templates/tests/library', { params }),
  getTestByCode: (code, language = 'NO') =>
    apiClient.get(`/templates/tests/${code}`, { params: { language } }),

  // User Preferences
  getUserPreferences: () => apiClient.get('/templates/preferences/user'),
  addFavorite: (templateId) => apiClient.post(`/templates/preferences/favorites/${templateId}`),
  removeFavorite: (templateId) =>
    apiClient.delete(`/templates/preferences/favorites/${templateId}`),

  // Clinical Phrases
  getPhrases: (params) => apiClient.get('/templates/phrases', { params }),
  getPhrasesByRegion: (region, language = 'NO') =>
    apiClient.get(`/templates/phrases/byregion/${region}`, { params: { language } }),
};

// Structured Examinations
export const examinationsAPI = {
  // Protocols
  getBodyRegions: (language = 'NO') =>
    apiClient.get('/examinations/protocols/body-regions', { params: { language } }),
  getCategories: (language = 'NO') =>
    apiClient.get('/examinations/protocols/categories', { params: { language } }),
  getAllProtocols: (params) => apiClient.get('/examinations/protocols', { params }),
  getProtocolById: (id) => apiClient.get(`/examinations/protocols/${id}`),
  searchProtocols: (query, language = 'NO', limit = 50) =>
    apiClient.get('/examinations/protocols/search', { params: { query, language, limit } }),
  getProtocolsByRegion: (region, language = 'NO') =>
    apiClient.get(`/examinations/protocols/by-region/${region}`, { params: { language } }),
  getProtocolsByCategory: (category, language = 'NO') =>
    apiClient.get(`/examinations/protocols/by-category/${category}`, { params: { language } }),

  // Findings
  getFindingsByEncounter: (encounterId) =>
    apiClient.get(`/examinations/findings/encounter/${encounterId}`),
  getFindingById: (id) => apiClient.get(`/examinations/findings/${id}`),
  createFinding: (data) => apiClient.post('/examinations/findings', data),
  createBatchFindings: (findings) => apiClient.post('/examinations/findings/batch', { findings }),
  updateFinding: (id, data) => apiClient.patch(`/examinations/findings/${id}`, data),
  deleteFinding: (id) => apiClient.delete(`/examinations/findings/${id}`),

  // Summaries & Red Flags
  getExaminationSummary: (encounterId) => apiClient.get(`/examinations/summary/${encounterId}`),
  getRedFlags: (encounterId) => apiClient.get(`/examinations/red-flags/${encounterId}`),

  // Template Sets
  getAllTemplateSets: (language = 'NO') =>
    apiClient.get('/examinations/template-sets', { params: { language } }),
  getTemplateSetsByComplaint: (complaint, language = 'NO') =>
    apiClient.get(`/examinations/template-sets/by-complaint/${complaint}`, {
      params: { language },
    }),
  getTemplateSetById: (id) => apiClient.get(`/examinations/template-sets/${id}`),
  createTemplateSet: (data) => apiClient.post('/examinations/template-sets', data),
  incrementTemplateSetUsage: (id) => apiClient.post(`/examinations/template-sets/${id}/use`),
};

// PDF Generation
export const pdfAPI = {
  generateInvoice: (financialMetricId) => apiClient.post(`/pdf/invoice/${financialMetricId}`),
  generatePatientLetter: (encounterId, letterType) =>
    apiClient.post(`/pdf/letter/${encounterId}`, { letterType }),
};

// GDPR
export const gdprAPI = {
  getRequests: () => apiClient.get('/gdpr/requests'),
  createRequest: (data) => apiClient.post('/gdpr/requests', data),
  updateRequestStatus: (requestId, data) =>
    apiClient.patch(`/gdpr/requests/${requestId}/status`, data),
  exportPatientData: (patientId) => apiClient.get(`/gdpr/patient/${patientId}/data-access`),
  exportDataPortability: (patientId) =>
    apiClient.get(`/gdpr/patient/${patientId}/data-portability`),
  processErasure: (requestId) => apiClient.post(`/gdpr/requests/${requestId}/erasure`),
  updateConsent: (patientId, data) => apiClient.patch(`/gdpr/patient/${patientId}/consent`, data),
  getConsentAudit: (patientId) => apiClient.get(`/gdpr/patient/${patientId}/consent-audit`),
};

// CRM - Customer Relationship Management
export const crmAPI = {
  // Overview
  getOverview: () => apiClient.get('/crm/overview'),

  // Leads
  getLeads: (params) => apiClient.get('/crm/leads', { params }),
  getLead: (id) => apiClient.get(`/crm/leads/${id}`),
  createLead: (data) => apiClient.post('/crm/leads', data),
  updateLead: (id, data) => apiClient.put(`/crm/leads/${id}`, data),
  convertLead: (id, data) => apiClient.post(`/crm/leads/${id}/convert`, data),
  getLeadPipeline: () => apiClient.get('/crm/leads/pipeline'),

  // Patient Lifecycle
  getLifecycleStats: () => apiClient.get('/crm/lifecycle/stats'),
  getPatientsByLifecycle: (params) => apiClient.get('/crm/lifecycle', { params }),
  updatePatientLifecycle: (patientId, data) => apiClient.put(`/crm/lifecycle/${patientId}`, data),

  // Referrals
  getReferrals: (params) => apiClient.get('/crm/referrals', { params }),
  createReferral: (data) => apiClient.post('/crm/referrals', data),
  updateReferral: (id, data) => apiClient.put(`/crm/referrals/${id}`, data),
  getReferralStats: () => apiClient.get('/crm/referrals/stats'),

  // Surveys
  getSurveys: () => apiClient.get('/crm/surveys'),
  createSurvey: (data) => apiClient.post('/crm/surveys', data),
  getSurveyResponses: (surveyId, params) =>
    apiClient.get(`/crm/surveys/${surveyId}/responses`, { params }),
  getNPSStats: (period) => apiClient.get('/crm/surveys/nps/stats', { params: { period } }),

  // Communications
  getCommunications: (params) => apiClient.get('/crm/communications', { params }),
  logCommunication: (data) => apiClient.post('/crm/communications', data),

  // Campaigns
  getCampaigns: (params) => apiClient.get('/crm/campaigns', { params }),
  getCampaign: (id) => apiClient.get(`/crm/campaigns/${id}`),
  createCampaign: (data) => apiClient.post('/crm/campaigns', data),
  updateCampaign: (id, data) => apiClient.put(`/crm/campaigns/${id}`, data),
  launchCampaign: (id) => apiClient.post(`/crm/campaigns/${id}/launch`),
  getCampaignStats: (id) => apiClient.get(`/crm/campaigns/${id}/stats`),

  // Workflows
  getWorkflows: () => apiClient.get('/crm/workflows'),
  getWorkflow: (id) => apiClient.get(`/crm/workflows/${id}`),
  createWorkflow: (data) => apiClient.post('/crm/workflows', data),
  updateWorkflow: (id, data) => apiClient.put(`/crm/workflows/${id}`, data),
  toggleWorkflow: (id) => apiClient.post(`/crm/workflows/${id}/toggle`),

  // Retention
  getRetentionDashboard: (period) => apiClient.get('/crm/retention', { params: { period } }),
  getChurnAnalysis: () => apiClient.get('/crm/retention/churn'),
  getCohortRetention: (months) => apiClient.get('/crm/retention/cohorts', { params: { months } }),

  // Waitlist
  getWaitlist: (params) => apiClient.get('/crm/waitlist', { params }),
  addToWaitlist: (data) => apiClient.post('/crm/waitlist', data),
  updateWaitlistEntry: (id, data) => apiClient.put(`/crm/waitlist/${id}`, data),
  notifyWaitlist: (data) => apiClient.post('/crm/waitlist/notify', data),

  // Settings
  getSettings: () => apiClient.get('/crm/settings'),
  updateSettings: (data) => apiClient.put('/crm/settings', data),
};

// Authentication
export const authAPI = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
  devLogin: () => apiClient.post('/auth/dev-login'),
  register: (data) => apiClient.post('/auth/register', data),
  logout: () => apiClient.post('/auth/logout'),
  getCurrentUser: () => apiClient.get('/auth/me'),
  verifyEmail: (token) => apiClient.post('/auth/verify-email', { token }),
  requestPasswordReset: (email) => apiClient.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => apiClient.post('/auth/reset-password', { token, password }),
};

// AI Clinical Assistant - see aiAPI below (line ~730)

// AI Feedback & Learning
export const aiFeedbackAPI = {
  // Submit feedback on AI suggestion
  submitFeedback: (data) => apiClient.post('/ai/feedback', data),
  // Get user's feedback history
  getMyFeedback: (params) => apiClient.get('/ai/feedback/me', { params }),
  // Get user's feedback stats
  getMyStats: () => apiClient.get('/ai/feedback/me/stats'),
  // Get overall AI performance metrics (admin)
  getPerformanceMetrics: (params) => apiClient.get('/ai/performance', { params }),
  // Get suggestions needing review (admin)
  getSuggestionsNeedingReview: (limit) =>
    apiClient.get('/ai/suggestions/review', { params: { limit } }),
  // Get common corrections (admin)
  getCommonCorrections: (params) => apiClient.get('/ai/corrections/common', { params }),
  // Trigger manual retraining (admin)
  triggerRetraining: () => apiClient.post('/ai/retraining/trigger'),
  // Get retraining status
  getRetrainingStatus: () => apiClient.get('/ai/retraining/status'),
  // Get retraining history
  getRetrainingHistory: () => apiClient.get('/ai/retraining/history'),
  // Rollback to previous model
  rollbackModel: (versionId) => apiClient.post(`/ai/model/rollback/${versionId}`),
  // Export feedback for training
  exportFeedback: (format = 'jsonl') =>
    apiClient.get('/ai/feedback/export', { params: { format } }),
};

// Data Import
export const importAPI = {
  // Excel import
  downloadTemplate: () => apiClient.get('/import/patients/template', { responseType: 'blob' }),
  importExcel: (file, options = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    Object.entries(options).forEach(([key, value]) => formData.append(key, value));
    return apiClient.post('/import/patients/excel', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Text import
  parseText: (text) => apiClient.post('/import/patients/parse-text', { text }),
  importFromText: (patients, options = {}) =>
    apiClient.post('/import/patients/from-text', { patients, ...options }),

  // CSV import
  parseCSV: (file, options = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    Object.entries(options).forEach(([key, value]) => formData.append(key, String(value)));
    return apiClient.post('/import/patients/csv/parse', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  importCSV: (file, mappings, options = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mappings', JSON.stringify(mappings));
    Object.entries(options).forEach(([key, value]) => formData.append(key, String(value)));
    return apiClient.post('/import/patients/csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // vCard import/export
  parseVCard: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/import/patients/vcard/parse', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  importVCard: (file, options = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    Object.entries(options).forEach(([key, value]) => formData.append(key, String(value)));
    return apiClient.post('/import/patients/vcard', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  exportVCard: (patientIds = []) =>
    apiClient.post('/import/patients/vcard/export', { patientIds }, { responseType: 'blob' }),

  // Google Contacts
  importGoogleContacts: (contacts, options = {}) =>
    apiClient.post('/import/patients/google', { contacts, ...options }),

  // Mapping templates
  getMappingTemplates: () => apiClient.get('/import/mapping-templates'),
  saveMappingTemplate: (name, mappings) =>
    apiClient.post('/import/mapping-templates', { name, mappings }),
};

// Bulk Communications
export const bulkCommunicationsAPI = {
  // Queue bulk communications
  queueBulk: (data) => apiClient.post('/communications/bulk-send', data),
  // Get batch status
  getBatchStatus: (batchId) => apiClient.get(`/communications/queue/status/${batchId}`),
  // Cancel a batch
  cancelBatch: (batchId) => apiClient.post(`/communications/queue/cancel/${batchId}`),
  // Get pending queue items
  getPendingQueue: (params) => apiClient.get('/communications/queue/pending', { params }),
  // Preview personalized messages
  previewBulk: (data) => apiClient.post('/communications/bulk-preview', data),
};

// Billing API - Norwegian Healthcare Invoicing
export const billingAPI = {
  // Takst Codes
  getTakstCodes: () => apiClient.get('/billing/takst-codes'),
  getTakstCode: (code) => apiClient.get(`/billing/takst-codes/${code}`),
  calculateTotals: (data) => apiClient.post('/billing/calculate', data),

  // Invoices
  getInvoices: (params) => apiClient.get('/billing/invoices', { params }),
  getInvoice: (id) => apiClient.get(`/billing/invoices/${id}`),
  createInvoice: (data) => apiClient.post('/billing/invoices', data),
  updateInvoice: (id, data) => apiClient.patch(`/billing/invoices/${id}`, data),
  finalizeInvoice: (id) => apiClient.post(`/billing/invoices/${id}/finalize`),
  cancelInvoice: (id, data) => apiClient.post(`/billing/invoices/${id}/cancel`, data),
  getInvoiceHTML: (id) => apiClient.get(`/billing/invoices/${id}/html`),
  getStatistics: (params) => apiClient.get('/billing/invoices/statistics', { params }),
  generateInvoiceNumber: () => apiClient.get('/billing/invoices/number'),
  updateOverdueInvoices: () => apiClient.post('/billing/invoices/update-overdue'),

  // Payments
  getInvoicePayments: (invoiceId) => apiClient.get(`/billing/invoices/${invoiceId}/payments`),
  recordPayment: (invoiceId, data) =>
    apiClient.post(`/billing/invoices/${invoiceId}/payments`, data),

  // HELFO Reports
  getHelfoReport: (params) => apiClient.get('/billing/helfo-report', { params }),
};

// Analytics Dashboard
export const analyticsAPI = {
  // Comprehensive dashboard data
  getDashboard: (params) => apiClient.get('/analytics/dashboard', { params }),
  // Patient statistics
  getPatientStats: () => apiClient.get('/analytics/patients'),
  // Appointment statistics
  getAppointmentStats: () => apiClient.get('/analytics/appointments'),
  // Revenue statistics
  getRevenueStats: (params) => apiClient.get('/analytics/revenue', { params }),
  // Top prescribed exercises
  getTopExercises: (limit = 10) => apiClient.get('/analytics/exercises/top', { params: { limit } }),
  // Exercise compliance statistics
  getExerciseCompliance: () => apiClient.get('/analytics/exercises/compliance'),
  // Patient volume trends
  getPatientTrends: () => apiClient.get('/analytics/trends/patients'),
  // Export to CSV
  exportCSV: (type, params) =>
    apiClient.get(`/analytics/export/${type}`, {
      params,
      responseType: 'blob',
    }),
};

// Progress Tracking / Fremgangssporing
export const progressAPI = {
  // Patient progress analytics
  getPatientStats: (patientId, params) =>
    apiClient.get(`/progress/patient/${patientId}/stats`, { params }),
  getWeeklyCompliance: (patientId, weeks = 12) =>
    apiClient.get(`/progress/patient/${patientId}/weekly`, { params: { weeks } }),
  getDailyProgress: (patientId, months = 3) =>
    apiClient.get(`/progress/patient/${patientId}/daily`, { params: { months } }),
  getPainHistory: (patientId, days = 90) =>
    apiClient.get(`/progress/patient/${patientId}/pain`, { params: { days } }),
  logPainEntry: (patientId, painLevel, notes) =>
    apiClient.post(`/progress/patient/${patientId}/pain`, { painLevel, notes }),

  // Therapist/Clinic analytics
  getAllPatientsCompliance: (params) => apiClient.get('/progress/compliance', { params }),
  getClinicOverview: () => apiClient.get('/progress/overview'),
};

// Workflow Automation
export const automationsAPI = {
  // Workflows CRUD
  getWorkflows: (params) => apiClient.get('/automations/workflows', { params }),
  getWorkflow: (id) => apiClient.get(`/automations/workflows/${id}`),
  createWorkflow: (data) => apiClient.post('/automations/workflows', data),
  updateWorkflow: (id, data) => apiClient.put(`/automations/workflows/${id}`, data),
  deleteWorkflow: (id) => apiClient.delete(`/automations/workflows/${id}`),
  toggleWorkflow: (id) => apiClient.post(`/automations/workflows/${id}/toggle`),

  // Execution history
  getWorkflowExecutions: (workflowId, params) =>
    apiClient.get(`/automations/workflows/${workflowId}/executions`, { params }),
  getExecutions: (params) => apiClient.get('/automations/executions', { params }),

  // Testing
  testWorkflow: (data) => apiClient.post('/automations/workflows/test', data),

  // Configuration
  getTriggers: () => apiClient.get('/automations/triggers'),
  getActions: () => apiClient.get('/automations/actions'),

  // Statistics
  getStats: () => apiClient.get('/automations/stats'),

  // Manual processing (admin)
  processAutomations: () => apiClient.post('/automations/process'),
  processTimeTriggers: () => apiClient.post('/automations/process-time-triggers'),
};

// Spine Templates (Quick-Click Palpation)
export const spineTemplatesAPI = {
  // Get all templates (with org customizations merged with defaults)
  getAll: (params) => apiClient.get('/spine-templates', { params }),
  // Get templates grouped by segment (for UI)
  getGrouped: (language = 'NO') =>
    apiClient.get('/spine-templates/grouped', { params: { language } }),
  // Get available segments
  getSegments: () => apiClient.get('/spine-templates/segments'),
  // Get available directions
  getDirections: () => apiClient.get('/spine-templates/directions'),
  // Get specific template by segment and direction
  getBySegmentDirection: (segment, direction, params) =>
    apiClient.get(`/spine-templates/${segment}/${direction}`, { params }),
  // Create/update custom template
  create: (data) => apiClient.post('/spine-templates', data),
  // Bulk update templates
  bulkUpdate: (templates) => apiClient.post('/spine-templates/bulk', { templates }),
  // Update single template
  update: (id, data) => apiClient.patch(`/spine-templates/${id}`, data),
  // Delete custom template (revert to default)
  delete: (id) => apiClient.delete(`/spine-templates/${id}`),
  // Reset all to defaults
  resetToDefaults: (language = 'NO') =>
    apiClient.post('/spine-templates/reset', null, { params: { language } }),
};

// Clinical Settings API
export const clinicalSettingsAPI = {
  // Get all clinical settings
  getAll: () => apiClient.get('/clinical-settings'),
  // Get default settings reference
  getDefaults: () => apiClient.get('/clinical-settings/defaults'),
  // Update clinical settings (partial update)
  update: (settings) => apiClient.patch('/clinical-settings', settings),
  // Update specific section
  updateSection: (section, data) => apiClient.patch(`/clinical-settings/${section}`, data),
  // Reset all to defaults
  reset: () => apiClient.post('/clinical-settings/reset'),
  // Adjustment notation
  getAdjustmentTemplates: () => apiClient.get('/clinical-settings/adjustment/templates'),
  setAdjustmentStyle: (style) => apiClient.put('/clinical-settings/adjustment/style', { style }),
  // Test settings
  updateTestSettings: (testType, settings) =>
    apiClient.patch(`/clinical-settings/tests/${testType}`, settings),
  // Letter settings
  updateLetterSettings: (settings) => apiClient.patch('/clinical-settings/letters', settings),
};

// AI Retraining Pipeline Management
export const aiRetrainingAPI = {
  triggerRetraining: (opts) => apiClient.post('/ai-retraining/trigger-retraining', opts),
  getStatus: () => apiClient.get('/ai-retraining/status'),
  getHistory: (limit) => apiClient.get('/ai-retraining/history', { params: { limit } }),
  exportFeedback: (opts) => apiClient.post('/ai-retraining/export-feedback', opts),
  rollbackModel: (v) => apiClient.post('/ai-retraining/model/rollback', { targetVersion: v }),
  testModel: (m) => apiClient.post('/ai-retraining/model/test', { modelName: m }),
  generatePairs: (d) => apiClient.post('/ai-retraining/rlaif/generate-pairs', d),
  getRLAIFStats: () => apiClient.get('/ai-retraining/rlaif/stats'),
  getSchedulerStatus: () => apiClient.get('/ai-retraining/scheduler/status'),
};

// Data Curation for Training
export const curationAPI = {
  getFeedback: (params) => apiClient.get('/training/curation/feedback', { params }),
  getStats: () => apiClient.get('/training/curation/stats'),
  approve: (id, data) => apiClient.post(`/training/curation/approve/${id}`, data),
  reject: (id) => apiClient.post(`/training/curation/reject/${id}`),
  bulk: (data) => apiClient.post('/training/curation/bulk', data),
};

// AI Training Management
export const trainingAPI = {
  getStatus: () => apiClient.get('/training/status'),
  getData: () => apiClient.get('/training/data'),
  addExamples: (jsonlContent, targetFile) =>
    apiClient.post('/training/add-examples', { jsonlContent, targetFile }),
  rebuild: () => apiClient.post('/training/rebuild'),
  backup: () => apiClient.post('/training/backup'),
  restore: () => apiClient.post('/training/restore'),
  testModel: (model, prompt) => apiClient.get(`/training/test/${model}`, { params: { prompt } }),
  getAnalyticsPerformance: (params) => apiClient.get('/training/analytics/performance', { params }),
  getAnalyticsUsage: (params) => apiClient.get('/training/analytics/usage', { params }),
  getAnalyticsSuggestions: (params) => apiClient.get('/training/analytics/suggestions', { params }),
  getAnalyticsRedFlags: (params) => apiClient.get('/training/analytics/red-flags', { params }),
  getAnalyticsComparison: (params) => apiClient.get('/training/analytics/comparison', { params }),
};

// AI Service
export const aiAPI = {
  getStatus: () => apiClient.get('/ai/status'),
  spellCheck: (text) => apiClient.post('/ai/spell-check', { text }),
  generateSOAPSuggestion: (chiefComplaint, section) =>
    apiClient.post('/ai/soap-suggestion', { chiefComplaint, section }),
  suggestDiagnosis: (soapData) => apiClient.post('/ai/suggest-diagnosis', { soapData }),
  analyzeRedFlags: (patientData, soapData) =>
    apiClient.post('/ai/analyze-red-flags', { patientData, soapData }),
  generateClinicalSummary: (encounter) => apiClient.post('/ai/clinical-summary', { encounter }),
  generateField: (fieldType, context, language) =>
    apiClient.post('/ai/generate-field', { fieldType, context, language }),
  // Streaming endpoint - uses fetch directly for SSE support
  getStreamUrl: () => `${API_URL}/ai/generate-field-stream`,
  // Feedback on AI suggestions (thumbs up/down, corrections)
  submitFeedback: (data) => apiClient.post('/ai/feedback', data),
  recordOutcomeFeedback: (data) => apiClient.post('/ai/outcome-feedback', data),
};

// Macros API - Clinical text hot buttons
export const macrosAPI = {
  getMatrix: () => apiClient.get('/macros'),
  search: (query) => apiClient.get('/macros/search', { params: { q: query } }),
  getFavorites: () => apiClient.get('/macros/favorites'),
  create: (data) => apiClient.post('/macros', data),
  update: (id, data) => apiClient.patch(`/macros/${id}`, data),
  delete: (id) => apiClient.delete(`/macros/${id}`),
  expand: (id, patientContext) => apiClient.post(`/macros/${id}/expand`, { patientContext }),
  toggleFavorite: (id) => apiClient.post(`/macros/${id}/favorite`),
  recordUsage: (id) => apiClient.post(`/macros/${id}/usage`),
};

// Exercise Library API
export const exercisesAPI = {
  // Exercise Library CRUD
  getAll: (params) => apiClient.get('/exercises', { params }),
  getById: (id) => apiClient.get(`/exercises/${id}`),
  create: (data) => apiClient.post('/exercises', data),
  update: (id, data) => apiClient.patch(`/exercises/${id}`, data),
  delete: (id) => apiClient.delete(`/exercises/${id}`),

  // Categories and Regions
  getCategories: () => apiClient.get('/exercises/categories'),
  getBodyRegions: () => apiClient.get('/exercises/body-regions'),

  // User favorites and recent
  getFavorites: (limit = 20) => apiClient.get('/exercises/favorites', { params: { limit } }),
  getRecentlyUsed: (limit = 10) => apiClient.get('/exercises/recent', { params: { limit } }),

  // Statistics
  getStats: () => apiClient.get('/exercises/stats'),
  getTopPrescribed: (limit = 10) =>
    apiClient.get('/exercises/top-prescribed', { params: { limit } }),
  getComplianceStats: (days = 30) => apiClient.get('/exercises/compliance', { params: { days } }),

  // Exercise Programs
  getPrograms: (params) => apiClient.get('/exercises/programs', { params }),
  getProgramById: (id) => apiClient.get(`/exercises/programs/${id}`),
  createProgram: (data) => apiClient.post('/exercises/programs', data),
  updateProgram: (id, data) => apiClient.patch(`/exercises/programs/${id}`, data),
  deleteProgram: (id) => apiClient.delete(`/exercises/programs/${id}`),

  // Prescriptions
  getPrescriptionById: (id) => apiClient.get(`/exercises/prescriptions/${id}`),
  updatePrescription: (id, data) => apiClient.patch(`/exercises/prescriptions/${id}`, data),
  logCompliance: (id, data) => apiClient.post(`/exercises/prescriptions/${id}/compliance`, data),
  discontinuePrescription: (id, reason) =>
    apiClient.post(`/exercises/prescriptions/${id}/discontinue`, { reason }),
  completePrescription: (id) => apiClient.post(`/exercises/prescriptions/${id}/complete`),

  // Patient-specific
  getPatientExercises: (patientId, params) =>
    apiClient.get(`/patients/${patientId}/exercises`, { params }),
  prescribeToPatient: (patientId, data) => apiClient.post(`/patients/${patientId}/exercises`, data),
  assignProgramToPatient: (patientId, data) =>
    apiClient.post(`/patients/${patientId}/programs`, data),

  // PDF generation
  getPatientExercisePDF: (patientId) =>
    apiClient.get(`/patients/${patientId}/exercises/pdf`, {
      responseType: 'blob',
    }),
};

// Vestibular / VNG Assessments API
export const vestibularAPI = {
  create: (data) => apiClient.post('/vestibular', data),
  getById: (id) => apiClient.get(`/vestibular/${id}`),
  getByPatient: (patientId) => apiClient.get(`/vestibular/patient/${patientId}`),
  getByEncounter: (encounterId) => apiClient.get(`/vestibular/encounter/${encounterId}`),
  update: (id, data) => apiClient.patch(`/vestibular/${id}`, data),
  delete: (id) => apiClient.delete(`/vestibular/${id}`),
  getBPPVTrends: (patientId) => apiClient.get(`/vestibular/patient/${patientId}/bppv-trends`),
};

// Scheduler API
export const schedulerAPI = {
  schedule: (data) => apiClient.post('/scheduler/communications', data),
  getPending: (params) => apiClient.get('/scheduler/pending', { params }),
  checkConflicts: (data) => apiClient.post('/scheduler/check-conflicts', data),
  getDecisions: (params) => apiClient.get('/scheduler/decisions', { params }),
  resolveDecision: (id, data) => apiClient.post(`/scheduler/decisions/${id}`, data),
  getTodaysMessages: () => apiClient.get('/scheduler/today'),
  sendApproved: (messageIds) => apiClient.post('/scheduler/send', { messageIds }),
  cancelMessage: (id) => apiClient.delete(`/scheduler/messages/${id}`),
};

// Notifications API
export const notificationsAPI = {
  getAll: (params) => apiClient.get('/notifications', { params }),
  getUnreadCount: () => apiClient.get('/notifications/unread-count'),
  markRead: (id) => apiClient.put(`/notifications/${id}/read`),
  markAllRead: () => apiClient.put('/notifications/read-all'),
  delete: (id) => apiClient.delete(`/notifications/${id}`),
};

// Patient Portal API
export const patientPortalAPI = {
  loginWithPin: (pin, patientId) => apiClient.post('/patient-portal/auth/pin', { pin, patientId }),
  getProfile: () => apiClient.get('/patient-portal/profile'),
  getAppointments: () => apiClient.get('/patient-portal/appointments'),
  getExercises: () => apiClient.get('/patient-portal/exercises'),
  logCompliance: (id, data) => apiClient.post(`/patient-portal/exercises/${id}/compliance`, data),
};

// Encounter Validation API
export const encounterValidationAPI = {
  validate: (data) => apiClient.post('/encounters/validate', data),
  validateNote: (data) => apiClient.post('/encounters/validate-note', data),
};

// Clinical Workflow API
export const workflowAPI = {
  startEncounter: (data) => apiClient.post('/encounters/workflow/start', data),
  recordExam: (encounterId, data) =>
    apiClient.post(`/encounters/${encounterId}/workflow/exam`, data),
  recordTreatment: (encounterId, data) =>
    apiClient.post(`/encounters/${encounterId}/workflow/treatment`, data),
  finalize: (encounterId, data) =>
    apiClient.post(`/encounters/${encounterId}/workflow/finalize`, data),
  getContext: (encounterId) => apiClient.get(`/encounters/${encounterId}/workflow/context`),
};

// Kiosk API
export const kioskAPI = {
  checkIn: (data) => apiClient.post('/kiosk/check-in', data),
  getIntake: (appointmentId) => apiClient.get(`/kiosk/intake/${appointmentId}`),
  submitIntake: (appointmentId, data) => apiClient.post(`/kiosk/intake/${appointmentId}`, data),
  submitConsent: (appointmentId, data) => apiClient.post(`/kiosk/consent/${appointmentId}`, data),
  getQueue: () => apiClient.get('/kiosk/queue'),
};

export const treatmentPlansAPI = {
  getPatientPlans: (patientId, status) =>
    apiClient.get(`/treatment-plans/patient/${patientId}`, { params: { status } }),
  getPlan: (id) => apiClient.get(`/treatment-plans/${id}`),
  createPlan: (data) => apiClient.post('/treatment-plans', data),
  updatePlan: (id, data) => apiClient.patch(`/treatment-plans/${id}`, data),
  getPlanProgress: (id) => apiClient.get(`/treatment-plans/${id}/progress`),
  addMilestone: (planId, data) => apiClient.post(`/treatment-plans/${planId}/milestones`, data),
  updateMilestone: (milestoneId, data) =>
    apiClient.patch(`/treatment-plans/milestones/${milestoneId}`, data),
  addSession: (planId, data) => apiClient.post(`/treatment-plans/${planId}/sessions`, data),
  completeSession: (sessionId, data) =>
    apiClient.post(`/treatment-plans/sessions/${sessionId}/complete`, data),
};

// Outcomes / Questionnaires API
export const outcomesAPI = {
  submitQuestionnaire: (data) => apiClient.post('/outcomes/questionnaires', data),
  getPatientQuestionnaires: (patientId, params) =>
    apiClient.get(`/outcomes/questionnaires/patient/${patientId}`, { params }),
  getQuestionnaireById: (id) => apiClient.get(`/outcomes/questionnaires/${id}`),
  getPatientTrend: (patientId, params) =>
    apiClient.get(`/outcomes/questionnaires/patient/${patientId}/trend`, { params }),
  deleteQuestionnaire: (id) => apiClient.delete(`/outcomes/questionnaires/${id}`),
  // Existing outcome endpoints
  getPatientSummary: (patientId) => apiClient.get(`/outcomes/patient/${patientId}/summary`),
  getPatientLongitudinal: (patientId) =>
    apiClient.get(`/outcomes/patient/${patientId}/longitudinal`),
};

// Auto-Accept API
export const autoAcceptAPI = {
  getSettings: () => apiClient.get('/auto-accept/settings'),
  updateSettings: (data) => apiClient.put('/auto-accept/settings', data),
  getLog: (params) => apiClient.get('/auto-accept/log', { params }),
  evaluate: (appointmentId) => apiClient.post('/auto-accept/evaluate', { appointmentId }),
  toggleAppointments: () => apiClient.post('/auto-accept/toggle/appointments'),
  toggleReferrals: () => apiClient.post('/auto-accept/toggle/referrals'),
  processPending: () => apiClient.post('/auto-accept/process'),
};

// Portal API (practitioner-facing patient portal management)
export const portalAPI = {
  getPatientDashboard: (patientId) => apiClient.get(`/portal/patient/${patientId}`),
  getPatientAppointments: (patientId, params) =>
    apiClient.get(`/portal/patient/${patientId}/appointments`, { params }),
  createPatientAppointment: (patientId, data) =>
    apiClient.post(`/portal/patient/${patientId}/appointments`, data),
  getPatientExercises: (patientId) => apiClient.get(`/portal/patient/${patientId}/exercises`),
  getPatientOutcomes: (patientId) => apiClient.get(`/portal/patient/${patientId}/outcomes`),
  generateMagicLink: (patientId) => apiClient.post('/portal/auth/magic-link', { patientId }),
  setPortalAccess: (patientId, pin) =>
    apiClient.post(`/portal/patient/${patientId}/portal-access`, { pin }),
};

// Export API URL for streaming endpoints
export { API_URL };

// Export default API client
export default apiClient;
