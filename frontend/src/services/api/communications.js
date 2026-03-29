/**
 * Communications API — email, SMS, templates, bulk messaging, scheduler
 */
import apiClient from './client';

export const communicationsAPI = {
  getAll: (params) => apiClient.get('/communications', { params }),
  getById: (id) => apiClient.get(`/communications/${id}`),
  getByPatient: (patientId) => apiClient.get(`/patients/${patientId}/communications`),
  sendSMS: (data) => apiClient.post('/communications/sms', data),
  sendEmail: (data) => apiClient.post('/communications/email', data),
  getTemplates: () => apiClient.get('/communications/templates'),
};

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

export const notificationsAPI = {
  getAll: (params) => apiClient.get('/notifications', { params }),
  getUnreadCount: () => apiClient.get('/notifications/unread-count'),
  markRead: (id) => apiClient.put(`/notifications/${id}/read`),
  markAllRead: () => apiClient.put('/notifications/read-all'),
  delete: (id) => apiClient.delete(`/notifications/${id}`),
};
