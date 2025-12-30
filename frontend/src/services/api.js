/**
 * API Client
 * Centralized API communication with ChiroClickCRM backend
 */

import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'
const API_TIMEOUT = import.meta.env.VITE_API_TIMEOUT || 30000

// Secure organization storage using sessionStorage (more secure than localStorage)
// Organization ID is cleared when browser tab is closed
const ORG_STORAGE_KEY = 'org_session'

/**
 * Securely store organization ID
 * Uses sessionStorage which is cleared when the browser tab closes
 * @param {string} organizationId - The organization ID to store
 */
export const setOrganizationId = (organizationId) => {
  if (!organizationId) {
    sessionStorage.removeItem(ORG_STORAGE_KEY)
    return
  }
  // Store with timestamp for potential expiry checks
  const data = {
    id: organizationId,
    ts: Date.now()
  }
  sessionStorage.setItem(ORG_STORAGE_KEY, btoa(JSON.stringify(data)))
}

/**
 * Retrieve organization ID from secure storage
 * @returns {string|null} The organization ID or null if not set
 */
export const getOrganizationId = () => {
  try {
    const stored = sessionStorage.getItem(ORG_STORAGE_KEY)
    if (!stored) {
      // Fallback to localStorage for migration (remove after initial deployment)
      const legacyId = localStorage.getItem('organizationId')
      if (legacyId) {
        setOrganizationId(legacyId)
        localStorage.removeItem('organizationId') // Clean up legacy storage
        return legacyId
      }
      return null
    }
    const data = JSON.parse(atob(stored))
    // Optional: Add expiry check (e.g., 24 hours)
    const MAX_AGE = 24 * 60 * 60 * 1000 // 24 hours
    if (Date.now() - data.ts > MAX_AGE) {
      sessionStorage.removeItem(ORG_STORAGE_KEY)
      return null
    }
    return data.id
  } catch {
    sessionStorage.removeItem(ORG_STORAGE_KEY)
    return null
  }
}

/**
 * Clear organization ID from storage
 */
export const clearOrganizationId = () => {
  sessionStorage.removeItem(ORG_STORAGE_KEY)
  localStorage.removeItem('organizationId') // Clean up legacy storage
}

// Create axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable cookies for secure session handling
})

// Request interceptor - Add auth token and organization ID
apiClient.interceptors.request.use(
  async (config) => {
    // Get auth token from Clerk (async for proper token refresh)
    try {
      const token = await window.Clerk?.session?.getToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    } catch (error) {
      console.error('Failed to get auth token:', error)
    }

    // Get organization ID from secure storage
    const organizationId = getOrganizationId()
    if (!organizationId) {
      // Organization ID is required for most API calls
      // Allow some endpoints without org ID (e.g., organization selection)
      const exemptPaths = ['/organizations', '/users/me']
      const isExempt = exemptPaths.some(path => config.url?.includes(path))

      if (!isExempt) {
        console.error('Organization ID is missing. Please select an organization.')
        return Promise.reject(new Error('Organization ID is required. Please select an organization in settings.'))
      }
    } else {
      config.headers['X-Organization-Id'] = organizationId
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response

      switch (status) {
        case 401:
          // Unauthorized - redirect to login
          window.location.href = '/sign-in'
          break
        case 403:
          // Forbidden
          console.error('Access denied:', data.message)
          break
        case 404:
          // Not found
          console.error('Resource not found:', data.message)
          break
        case 429:
          // Rate limit exceeded
          console.error('Too many requests:', data.message)
          break
        case 500:
          // Server error
          console.error('Server error:', data.message)
          break
        default:
          console.error('API error:', data.message)
      }
    } else if (error.request) {
      // Request made but no response
      console.error('Network error: No response from server')
    } else {
      // Something else happened
      console.error('Request error:', error.message)
    }

    return Promise.reject(error)
  }
)

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
}

// Clinical Encounters
export const encountersAPI = {
  getAll: (params) => apiClient.get('/encounters', { params }),
  getById: (id) => apiClient.get(`/encounters/${id}`),
  getByPatient: (patientId) => apiClient.get(`/patients/${patientId}/encounters`),
  create: (data) => apiClient.post('/encounters', data),
  update: (id, data) => apiClient.patch(`/encounters/${id}`, data),
  sign: (id) => apiClient.post(`/encounters/${id}/sign`),
  generateNote: (id) => apiClient.post(`/encounters/${id}/generate-note`),
}

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
}

// Communications
export const communicationsAPI = {
  getAll: (params) => apiClient.get('/communications', { params }),
  getById: (id) => apiClient.get(`/communications/${id}`),
  getByPatient: (patientId) => apiClient.get(`/patients/${patientId}/communications`),
  sendSMS: (data) => apiClient.post('/communications/sms', data),
  sendEmail: (data) => apiClient.post('/communications/email', data),
  getTemplates: () => apiClient.get('/communications/templates'),
}

// Follow-ups
export const followUpsAPI = {
  getAll: (params) => apiClient.get('/followups', { params }),
  getById: (id) => apiClient.get(`/followups/${id}`),
  create: (data) => apiClient.post('/followups', data),
  update: (id, data) => apiClient.patch(`/followups/${id}`, data),
  complete: (id, notes) => apiClient.post(`/followups/${id}/complete`, { notes }),
  skip: (id, reason) => apiClient.post(`/followups/${id}/skip`, { reason }),
  getPatientsNeedingFollowUp: () => apiClient.get('/followups/patients/needingFollowUp'),
  markPatientAsContacted: (patientId, method) => apiClient.post(`/followups/patients/${patientId}/contacted`, { method }),
}

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
}

// Dashboard
export const dashboardAPI = {
  getStats: () => apiClient.get('/dashboard/stats'),
  getTodayAppointments: () => apiClient.get('/dashboard/appointments/today'),
  getPendingTasks: () => apiClient.get('/dashboard/tasks/pending'),
}

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
  getDetailedKPIs: (startDate, endDate) => apiClient.get('/kpi/detailed', { params: { startDate, endDate } }),
  getCategoryBreakdown: (startDate, endDate) => apiClient.get('/kpi/category-breakdown', { params: { startDate, endDate } }),
  getGeographicDistribution: (startDate, endDate) => apiClient.get('/kpi/geographic', { params: { startDate, endDate } }),
  importData: (data) => apiClient.post('/kpi/import', { data }),
}

// Diagnosis Codes
export const diagnosisAPI = {
  search: (query) => apiClient.get('/diagnosis/search', { params: { q: query } }),
  getCommon: () => apiClient.get('/diagnosis/common'),
  getByCode: (code) => apiClient.get(`/diagnosis/${code}`),
}

// Treatment Codes
export const treatmentsAPI = {
  getAll: () => apiClient.get('/treatments'),
  getCommon: () => apiClient.get('/treatments/common'),
  getByCode: (code) => apiClient.get(`/treatments/${code}`),
}

// Organization
export const organizationAPI = {
  getCurrent: () => apiClient.get('/organizations/current'),
  update: (data) => apiClient.patch('/organizations/current', data),
  getUsers: () => apiClient.get('/organizations/current/users'),
  inviteUser: (data) => apiClient.post('/organizations/current/invite', data),
}

// Users
export const usersAPI = {
  getCurrent: () => apiClient.get('/users/me'),
  update: (data) => apiClient.patch('/users/me', data),
  getAll: () => apiClient.get('/users'),
}

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
  search: (query, language = 'NO') => apiClient.get('/templates/search', { params: { q: query, language } }),

  // Orthopedic Tests Library
  getTestsLibrary: (params) => apiClient.get('/templates/tests/library', { params }),
  getTestByCode: (code, language = 'NO') => apiClient.get(`/templates/tests/${code}`, { params: { language } }),

  // User Preferences
  getUserPreferences: () => apiClient.get('/templates/preferences/user'),
  addFavorite: (templateId) => apiClient.post(`/templates/preferences/favorites/${templateId}`),
  removeFavorite: (templateId) => apiClient.delete(`/templates/preferences/favorites/${templateId}`),

  // Clinical Phrases
  getPhrases: (params) => apiClient.get('/templates/phrases', { params }),
  getPhrasesByRegion: (region, language = 'NO') => apiClient.get(`/templates/phrases/byregion/${region}`, { params: { language } }),
}

// Structured Examinations
export const examinationsAPI = {
  // Protocols
  getBodyRegions: (language = 'NO') => apiClient.get('/examinations/protocols/body-regions', { params: { language } }),
  getCategories: (language = 'NO') => apiClient.get('/examinations/protocols/categories', { params: { language } }),
  getAllProtocols: (params) => apiClient.get('/examinations/protocols', { params }),
  getProtocolById: (id) => apiClient.get(`/examinations/protocols/${id}`),
  searchProtocols: (query, language = 'NO', limit = 50) => apiClient.get('/examinations/protocols/search', { params: { query, language, limit } }),
  getProtocolsByRegion: (region, language = 'NO') => apiClient.get(`/examinations/protocols/by-region/${region}`, { params: { language } }),
  getProtocolsByCategory: (category, language = 'NO') => apiClient.get(`/examinations/protocols/by-category/${category}`, { params: { language } }),

  // Findings
  getFindingsByEncounter: (encounterId) => apiClient.get(`/examinations/findings/encounter/${encounterId}`),
  getFindingById: (id) => apiClient.get(`/examinations/findings/${id}`),
  createFinding: (data) => apiClient.post('/examinations/findings', data),
  createBatchFindings: (findings) => apiClient.post('/examinations/findings/batch', { findings }),
  updateFinding: (id, data) => apiClient.patch(`/examinations/findings/${id}`, data),
  deleteFinding: (id) => apiClient.delete(`/examinations/findings/${id}`),

  // Summaries & Red Flags
  getExaminationSummary: (encounterId) => apiClient.get(`/examinations/summary/${encounterId}`),
  getRedFlags: (encounterId) => apiClient.get(`/examinations/red-flags/${encounterId}`),

  // Template Sets
  getAllTemplateSets: (language = 'NO') => apiClient.get('/examinations/template-sets', { params: { language } }),
  getTemplateSetsByComplaint: (complaint, language = 'NO') => apiClient.get(`/examinations/template-sets/by-complaint/${complaint}`, { params: { language } }),
  getTemplateSetById: (id) => apiClient.get(`/examinations/template-sets/${id}`),
  createTemplateSet: (data) => apiClient.post('/examinations/template-sets', data),
  incrementTemplateSetUsage: (id) => apiClient.post(`/examinations/template-sets/${id}/use`),
}

// PDF Generation
export const pdfAPI = {
  generateInvoice: (financialMetricId) => apiClient.post(`/pdf/invoice/${financialMetricId}`),
  generatePatientLetter: (encounterId, letterType) => apiClient.post(`/pdf/letter/${encounterId}`, { letterType }),
}

// GDPR
export const gdprAPI = {
  getRequests: () => apiClient.get('/gdpr/requests'),
  createRequest: (data) => apiClient.post('/gdpr/requests', data),
  updateRequestStatus: (requestId, data) => apiClient.patch(`/gdpr/requests/${requestId}/status`, data),
  exportPatientData: (patientId) => apiClient.get(`/gdpr/patient/${patientId}/data-access`),
  exportDataPortability: (patientId) => apiClient.get(`/gdpr/patient/${patientId}/data-portability`),
  processErasure: (requestId) => apiClient.post(`/gdpr/requests/${requestId}/erasure`),
  updateConsent: (patientId, data) => apiClient.patch(`/gdpr/patient/${patientId}/consent`, data),
  getConsentAudit: (patientId) => apiClient.get(`/gdpr/patient/${patientId}/consent-audit`),
}

// AI Clinical Assistant
export const aiAPI = {
  // Get AI service status
  getStatus: () => apiClient.get('/ai/status'),
  // Generate SOAP note suggestions
  generateSuggestions: (chiefComplaint, section = 'subjective') =>
    apiClient.post('/ai/soap-suggestions', { chiefComplaint, section }),
  // Suggest diagnosis codes based on clinical data
  suggestDiagnosis: (soapData) =>
    apiClient.post('/ai/suggest-diagnosis', soapData),
  // Analyze for red flags
  analyzeRedFlags: (patientData, soapData) =>
    apiClient.post('/ai/analyze-red-flags', { patientData, soapData }),
  // Generate clinical summary
  generateSummary: (encounter) =>
    apiClient.post('/ai/generate-summary', encounter),
  // Spell check Norwegian text
  spellCheck: (text) =>
    apiClient.post('/ai/spell-check', { text }),
}

// Export default API client
export default apiClient
