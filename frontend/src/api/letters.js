/**
 * Letters API
 * Clinical letter generation, templates, and history
 */

import apiClient from '../services/api/client';

export const lettersApi = {
  /**
   * Get available letter types
   */
  async getLetterTypes() {
    const response = await apiClient.get('/ai/letter-types');
    return response.data;
  },

  /**
   * Generate a letter using AI
   * @param {string} letterType - Type of letter (e.g., 'MEDICAL_CERTIFICATE', 'VESTIBULAR_REFERRAL')
   * @param {object} data - Letter context data (patient, clinical findings, etc.)
   */
  async generateLetter(letterType, data) {
    const response = await apiClient.post('/ai/generate-letter', {
      letterType,
      ...data,
    });
    return response.data;
  },

  /**
   * Get AI suggestions for letter content
   * @param {object} context - Clinical context for suggestions
   */
  async suggestLetterContent(context) {
    const response = await apiClient.post('/ai/suggest-letter-content', context);
    return response.data;
  },

  /**
   * Save a generated letter to patient record
   * @param {object} letterData - Complete letter data to save
   */
  async saveLetter(letterData) {
    const response = await apiClient.post('/ai/letters/save', letterData);
    return response.data;
  },

  /**
   * Get letter history for a patient
   * @param {string} patientId - Patient ID
   * @param {object} params - Optional filters (type, status, limit)
   */
  async getPatientLetters(patientId, params = {}) {
    const response = await apiClient.get(`/ai/letters/patient/${patientId}`, { params });
    return response.data;
  },

  /**
   * Update letter status
   * @param {string} letterId - Letter ID
   * @param {string} status - New status (DRAFT, FINALIZED, SENT, ARCHIVED)
   */
  async updateLetterStatus(letterId, status) {
    const response = await apiClient.patch(`/ai/letters/${letterId}/status`, { status });
    return response.data;
  },
};

export default lettersApi;
