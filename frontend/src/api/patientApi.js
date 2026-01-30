/**
 * Patient Portal API
 * API client for patient portal endpoints - no authentication required, token-based access
 */

import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'

const axiosInstance = axios.create({
  baseURL: `${API_BASE}/patient-portal`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
})

// Handle errors globally
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error

    if (!response) {
      throw new Error('Nettverksfeil - sjekk internettforbindelsen din')
    }

    // Return the error response for handling in components
    const errorMessage = response.data?.message || response.data?.error || 'En feil oppstod'
    const enhancedError = new Error(errorMessage)
    enhancedError.status = response.status
    enhancedError.data = response.data

    throw enhancedError
  }
)

export const patientApi = {
  // ============================================================================
  // TOKEN VALIDATION
  // ============================================================================

  /**
   * Validate a portal access token
   * @param {string} token - Portal access token from URL
   * @returns {Promise<object>} Token validation result with patient/clinic info
   */
  async validateToken(token) {
    const response = await axiosInstance.get(`/validate/${token}`)
    return response.data
  },

  // ============================================================================
  // PRESCRIPTIONS
  // ============================================================================

  /**
   * Get all prescriptions for the patient
   * @param {string} token - Portal access token
   * @returns {Promise<object>} Patient info and list of prescriptions
   */
  async getPrescriptions(token) {
    const response = await axiosInstance.get(`/${token}/prescriptions`)
    return response.data
  },

  /**
   * Get a specific prescription with all exercises
   * @param {string} token - Portal access token
   * @param {string} prescriptionId - Prescription UUID
   * @returns {Promise<object>} Prescription detail with exercises
   */
  async getPrescription(token, prescriptionId) {
    const response = await axiosInstance.get(`/${token}/prescriptions/${prescriptionId}`)
    return response.data
  },

  // ============================================================================
  // EXERCISES
  // ============================================================================

  /**
   * Get detailed info for a specific exercise
   * @param {string} token - Portal access token
   * @param {string} prescriptionId - Prescription UUID
   * @param {string} exerciseId - Exercise UUID
   * @returns {Promise<object>} Exercise detail with progress history
   */
  async getExercise(token, prescriptionId, exerciseId) {
    const response = await axiosInstance.get(
      `/${token}/prescriptions/${prescriptionId}/exercises/${exerciseId}`
    )
    return response.data
  },

  // ============================================================================
  // PROGRESS TRACKING
  // ============================================================================

  /**
   * Record exercise completion
   * @param {string} token - Portal access token
   * @param {string} prescriptionId - Prescription UUID
   * @param {string} exerciseId - Exercise UUID
   * @param {object} progressData - Progress data
   * @returns {Promise<object>} Recorded progress
   */
  async recordProgress(token, prescriptionId, exerciseId, progressData) {
    const response = await axiosInstance.post(
      `/${token}/prescriptions/${prescriptionId}/exercises/${exerciseId}/progress`,
      progressData
    )
    return response.data
  },

  /**
   * Get progress history for a prescription
   * @param {string} token - Portal access token
   * @param {string} prescriptionId - Prescription UUID
   * @param {object} options - Query options (limit, offset)
   * @returns {Promise<object>} Progress history with stats
   */
  async getProgressHistory(token, prescriptionId, options = {}) {
    const params = new URLSearchParams()
    if (options.limit) params.append('limit', options.limit)
    if (options.offset) params.append('offset', options.offset)

    const response = await axiosInstance.get(
      `/${token}/prescriptions/${prescriptionId}/progress${params.toString() ? '?' + params.toString() : ''}`
    )
    return response.data
  },

  /**
   * Get daily progress summary
   * @param {string} token - Portal access token
   * @param {string} prescriptionId - Prescription UUID
   * @param {string} date - Optional date (YYYY-MM-DD), defaults to today
   * @returns {Promise<object>} Daily summary
   */
  async getDailySummary(token, prescriptionId, date = null) {
    const params = date ? `?date=${date}` : ''
    const response = await axiosInstance.get(
      `/${token}/prescriptions/${prescriptionId}/daily-summary${params}`
    )
    return response.data
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get token from URL search params
 * @returns {string|null} Token or null if not found
 */
export const getTokenFromUrl = () => {
  const params = new URLSearchParams(window.location.search)
  return params.get('token')
}

/**
 * Store token in session storage for navigation
 * @param {string} token - Access token
 */
export const storeToken = (token) => {
  if (token) {
    sessionStorage.setItem('portalToken', token)
  }
}

/**
 * Get stored token from session storage
 * @returns {string|null} Stored token or null
 */
export const getStoredToken = () => {
  return sessionStorage.getItem('portalToken')
}

/**
 * Clear stored token
 */
export const clearStoredToken = () => {
  sessionStorage.removeItem('portalToken')
}

/**
 * Build portal URL with token
 * @param {string} path - Path within portal
 * @param {string} token - Access token
 * @returns {string} Full URL with token
 */
export const buildPortalUrl = (path, token) => {
  return `${path}?token=${token}`
}

export default patientApi
