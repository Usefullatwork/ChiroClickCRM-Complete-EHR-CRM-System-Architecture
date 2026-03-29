/**
 * Admin API — settings, users, orgs, audit logs, dashboard, analytics, CRM, kiosk, automations
 */
import apiClient from './client';

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

export const organizationAPI = {
  getCurrent: () => apiClient.get('/organizations/current'),
  update: (data) => apiClient.patch('/organizations/current', data),
  getUsers: () => apiClient.get('/organizations/current/users'),
  inviteUser: (data) => apiClient.post('/organizations/current/invite', data),
};

export const usersAPI = {
  getCurrent: () => apiClient.get('/users/me'),
  update: (data) => apiClient.patch('/users/me', data),
  getAll: () => apiClient.get('/users'),
};

export const dashboardAPI = {
  getStats: () => apiClient.get('/dashboard/stats'),
  getTodayAppointments: () => apiClient.get('/dashboard/appointments/today'),
  getPendingTasks: () => apiClient.get('/dashboard/tasks/pending'),
  getRevenueTrend: (params) => apiClient.get('/dashboard/revenue-trend', { params }),
  getUtilization: (params) => apiClient.get('/dashboard/utilization', { params }),
  getNoShowTrend: (params) => apiClient.get('/dashboard/no-show-trend', { params }),
  getPatientFlow: (params) => apiClient.get('/dashboard/patient-flow', { params }),
};

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
  getChurnAnalysis: (params) => apiClient.get('/crm/retention/churn', { params }),
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

export const auditLogsAPI = {
  getAll: (params) => apiClient.get('/audit-logs', { params }),
  getById: (id) => apiClient.get(`/audit-logs/${id}`),
};

export const backupAPI = {
  list: () => apiClient.get('/backup'),
  create: () => apiClient.post('/backup'),
  restore: (filename) => apiClient.post('/backup/restore', { filename }),
  status: () => apiClient.get('/backup/status'),
  updateSettings: (settings) => apiClient.put('/backup/settings', settings),
};

export const kioskAPI = {
  checkIn: (data) => apiClient.post('/kiosk/check-in', data),
  getIntake: (appointmentId) => apiClient.get(`/kiosk/intake/${appointmentId}`),
  submitIntake: (appointmentId, data) => apiClient.post(`/kiosk/intake/${appointmentId}`, data),
  submitConsent: (appointmentId, data) => apiClient.post(`/kiosk/consent/${appointmentId}`, data),
  getQueue: () => apiClient.get('/kiosk/queue'),
};

export const autoAcceptAPI = {
  getSettings: () => apiClient.get('/auto-accept/settings'),
  updateSettings: (data) => apiClient.put('/auto-accept/settings', data),
  getLog: (params) => apiClient.get('/auto-accept/log', { params }),
  evaluate: (appointmentId) => apiClient.post('/auto-accept/evaluate', { appointmentId }),
  toggleAppointments: () => apiClient.post('/auto-accept/toggle/appointments'),
  toggleReferrals: () => apiClient.post('/auto-accept/toggle/referrals'),
  processPending: () => apiClient.post('/auto-accept/process'),
};

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
  getBookingRequests: (params) => apiClient.get('/portal/booking-requests', { params }),
  handleBookingRequest: (id, data) => apiClient.patch(`/portal/booking-requests/${id}`, data),
  getBookingRequestCount: () => apiClient.get('/portal/booking-requests/count'),
  getPatientMessages: (patientId, params) =>
    apiClient.get(`/portal/patient/${patientId}/messages`, { params }),
  sendPatientMessage: (patientId, data) =>
    apiClient.post(`/portal/patient/${patientId}/messages`, data),
};
