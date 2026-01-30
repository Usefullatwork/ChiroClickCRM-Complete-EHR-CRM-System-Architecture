/**
 * Letters API
 * Clinical letter generation, templates, and history
 */

import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

const axiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add auth header
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  const orgId = localStorage.getItem('organizationId');
  if (orgId) {
    config.headers['X-Organization-Id'] = orgId;
  }
  return config;
});

export const lettersApi = {
  /**
   * Get available letter types
   */
  async getLetterTypes() {
    const response = await axiosInstance.get('/ai/letter-types');
    return response.data;
  },

  /**
   * Generate a letter using AI
   * @param {string} letterType - Type of letter (e.g., 'MEDICAL_CERTIFICATE', 'VESTIBULAR_REFERRAL')
   * @param {object} data - Letter context data (patient, clinical findings, etc.)
   */
  async generateLetter(letterType, data) {
    const response = await axiosInstance.post('/ai/generate-letter', {
      letterType,
      ...data
    });
    return response.data;
  },

  /**
   * Get AI suggestions for letter content
   * @param {object} context - Clinical context for suggestions
   */
  async suggestLetterContent(context) {
    const response = await axiosInstance.post('/ai/suggest-letter-content', context);
    return response.data;
  },

  /**
   * Save a generated letter to patient record
   * @param {object} letterData - Complete letter data to save
   */
  async saveLetter(letterData) {
    const response = await axiosInstance.post('/ai/letters/save', letterData);
    return response.data;
  },

  /**
   * Get letter history for a patient
   * @param {string} patientId - Patient ID
   * @param {object} params - Optional filters (type, status, limit)
   */
  async getPatientLetters(patientId, params = {}) {
    const response = await axiosInstance.get(`/ai/letters/patient/${patientId}`, { params });
    return response.data;
  },

  /**
   * Update letter status
   * @param {string} letterId - Letter ID
   * @param {string} status - New status (DRAFT, FINALIZED, SENT, ARCHIVED)
   */
  async updateLetterStatus(letterId, status) {
    const response = await axiosInstance.patch(`/ai/letters/${letterId}/status`, { status });
    return response.data;
  }
};

export default lettersApi;
