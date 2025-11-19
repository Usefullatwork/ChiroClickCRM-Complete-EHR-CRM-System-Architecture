/**
 * API Client
 * Centralized API communication with ChiroClickCRM backend
 */

import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'
const API_TIMEOUT = import.meta.env.VITE_API_TIMEOUT || 30000

// Create axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - Add auth token and organization ID
apiClient.interceptors.request.use(
  (config) => {
    // Get auth token from Clerk
    const token = window.Clerk?.session?.getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Get organization ID from localStorage or state
    const organizationId = localStorage.getItem('organizationId')
    if (organizationId) {
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
  getByPatient: (patientId) => apiClient.get(`/patients/${patientId}/financial`),
  create: (data) => apiClient.post('/financial', data),
  recordPayment: (id, data) => apiClient.post(`/financial/${id}/payment`, data),
  generateInvoice: (id) => apiClient.post(`/financial/${id}/invoice`),
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

// Export default API client
export default apiClient
