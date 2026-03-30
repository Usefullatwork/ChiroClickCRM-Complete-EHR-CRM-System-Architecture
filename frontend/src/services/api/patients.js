/**
 * Patient API — CRUD, search, merge, statistics
 */
import apiClient from './client';

export const patientsAPI = {
  getAll: (params) => apiClient.get('/patients', { params }),
  getById: (id) => apiClient.get(`/patients/${id}`),
  create: (data) => apiClient.post('/patients', data),
  update: (id, data) => apiClient.patch(`/patients/${id}`, data),
  delete: (id) => apiClient.delete(`/patients/${id}`),
  search: (query) => apiClient.get('/patients/search', { params: { q: query } }),
  getStatistics: (id) => apiClient.get(`/patients/${id}/statistics`),
};

export const patientPortalAPI = {
  loginWithPin: (pin, patientId) => apiClient.post('/patient-portal/auth/pin', { pin, patientId }),
  getProfile: () => apiClient.get('/patient-portal/profile'),
  updateProfile: (data) => apiClient.put('/patient-portal/profile', data),
  getAppointments: () => apiClient.get('/patient-portal/appointments'),
  requestAppointment: (data) => apiClient.post('/patient-portal/appointments/request', data),
  cancelAppointment: (id) => apiClient.post(`/patient-portal/appointments/${id}/cancel`),
  getExercises: () => apiClient.get('/patient-portal/exercises'),
  logCompliance: (id, data) => apiClient.post(`/patient-portal/exercises/${id}/compliance`, data),
  getOutcomes: () => apiClient.get('/patient-portal/outcomes'),
  submitOutcome: (data) => apiClient.post('/patient-portal/outcomes', data),
  logout: () => apiClient.post('/patient-portal/logout'),
  getDocuments: () => apiClient.get('/patient-portal/documents'),
  downloadDocument: (token) =>
    apiClient.get(`/patient-portal/documents/${token}/download`, { responseType: 'blob' }),
  getAvailableSlots: (date, practitionerId) =>
    apiClient.get('/patient-portal/available-slots', {
      params: { date, practitioner_id: practitionerId },
    }),
  rescheduleAppointment: (id, data) =>
    apiClient.patch(`/patient-portal/appointments/${id}/reschedule`, data),
  getMessages: (params) => apiClient.get('/patient-portal/messages', { params }),
  sendMessage: (data) => apiClient.post('/patient-portal/messages', data),
  markMessageRead: (id) => apiClient.patch(`/patient-portal/messages/${id}/read`),
  getCommunicationPreferences: () => apiClient.get('/patient-portal/communication-preferences'),
  updateCommunicationPreferences: (data) =>
    apiClient.put('/patient-portal/communication-preferences', data),
};

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
