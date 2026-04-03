/**
 * Clinical Notes API
 * API client for SOAP documentation and clinical notes
 */

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

// Get the organization ID — aligned with App.jsx auto-login storage
const DESKTOP_ORG_ID = 'a0000000-0000-0000-0000-000000000001';
const getOrganizationId = () => {
  return localStorage.getItem('organizationId') || DESKTOP_ORG_ID;
};

// Create axios instance for clinical notes
const notesClient = axios.create({
  baseURL: `${API_URL}/notes`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor - Add organization ID
notesClient.interceptors.request.use(
  async (config) => {
    const organizationId = getOrganizationId();
    if (organizationId) {
      config.headers['X-Organization-Id'] = organizationId;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle errors
notesClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/sign-in';
    }
    return Promise.reject(error);
  }
);

/**
 * Clinical Notes API methods
 */
export const clinicalNotesAPI = {
  // Notes CRUD
  getAll: (params) => notesClient.get('/', { params }),
  getById: (id) => notesClient.get(`/${id}`),
  getByPatient: (patientId, params) => notesClient.get(`/patient/${patientId}`, { params }),
  create: (data) => notesClient.post('/', data),
  update: (id, data) => notesClient.patch(`/${id}`, data),
  delete: (id) => notesClient.delete(`/${id}`),

  // Draft management
  getDrafts: () => notesClient.get('/drafts'),
  autoSave: (id, data) => notesClient.post(`/${id}/autosave`, data),

  // Signing
  sign: (id) => notesClient.post(`/${id}/sign`),

  // Export/Generate
  generateFormatted: (id) => notesClient.post(`/${id}/generate`),

  // PDF Export
  downloadPDF: async (id) => {
    const response = await notesClient.get(`/${id}/pdf`, {
      responseType: 'blob',
    });
    return response;
  },

  // Amendments
  getHistory: (id) => notesClient.get(`/${id}/history`),
  createAmendment: (id, data) => notesClient.post(`/${id}/amend`, data),

  // Templates
  getTemplates: (params) => notesClient.get('/templates', { params }),

  // Search
  search: (query, params) => notesClient.get('/search', { params: { q: query, ...params } }),
};

export default clinicalNotesAPI;
