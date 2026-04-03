/**
 * Clinical Notes API
 * API client for SOAP documentation and clinical notes
 */

import apiClient from '../services/api/client';

/**
 * Clinical Notes API methods
 */
export const clinicalNotesAPI = {
  // Notes CRUD
  getAll: (params) => apiClient.get('/notes', { params }),
  getById: (id) => apiClient.get(`/notes/${id}`),
  getByPatient: (patientId, params) => apiClient.get(`/notes/patient/${patientId}`, { params }),
  create: (data) => apiClient.post('/notes', data),
  update: (id, data) => apiClient.patch(`/notes/${id}`, data),
  delete: (id) => apiClient.delete(`/notes/${id}`),

  // Draft management
  getDrafts: () => apiClient.get('/notes/drafts'),
  autoSave: (id, data) => apiClient.post(`/notes/${id}/autosave`, data),

  // Signing
  sign: (id) => apiClient.post(`/notes/${id}/sign`),

  // Export/Generate
  generateFormatted: (id) => apiClient.post(`/notes/${id}/generate`),

  // PDF Export
  downloadPDF: async (id) => {
    const response = await apiClient.get(`/notes/${id}/pdf`, {
      responseType: 'blob',
    });
    return response;
  },

  // Amendments
  getHistory: (id) => apiClient.get(`/notes/${id}/history`),
  createAmendment: (id, data) => apiClient.post(`/notes/${id}/amend`, data),

  // Templates
  getTemplates: (params) => apiClient.get('/notes/templates', { params }),

  // Search
  search: (query, params) => apiClient.get('/notes/search', { params: { q: query, ...params } }),
};

export default clinicalNotesAPI;
