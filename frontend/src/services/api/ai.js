/**
 * AI API — AI suggestions, model management, training, feedback
 */
import apiClient from './client';
import { API_BASE_URL } from '../../config/api';

export const aiAPI = {
  getStatus: () => apiClient.get('/ai/status'),
  spellCheck: (text) => apiClient.post('/ai/spell-check', { text }),
  generateSOAPSuggestion: (chiefComplaint, section) =>
    apiClient.post('/ai/soap-suggestion', { chiefComplaint, section }),
  suggestDiagnosis: (soapData) => apiClient.post('/ai/suggest-diagnosis', { soapData }),
  analyzeRedFlags: (patientData, soapData) =>
    apiClient.post('/ai/analyze-red-flags', { patientData, soapData }),
  generateClinicalSummary: (encounter) => apiClient.post('/ai/clinical-summary', { encounter }),
  generateField: (fieldType, context, language) =>
    apiClient.post('/ai/generate-field', { fieldType, context, language }),
  // Streaming endpoint - uses fetch directly for SSE support
  getStreamUrl: () => `${API_BASE_URL}/ai/generate-field-stream`,
  // Feedback on AI suggestions (thumbs up/down, corrections)
  submitFeedback: (data) => apiClient.post('/ai/feedback', data),
  recordOutcomeFeedback: (data) => apiClient.post('/ai/outcome-feedback', data),
  // Claude extended thinking analysis (differential diagnosis, red flags)
  extendedAnalysis: (data) => apiClient.post('/ai/extended-analysis', data),
  // Claude vision image analysis (X-ray, MRI, posture)
  analyzeImage: (data) => apiClient.post('/ai/analyze-image', data),
  // Claude tool_use structured extraction (SOAP, diagnoses)
  extractStructured: (data) => apiClient.post('/ai/extract-structured', data),
  // Multi-provider clinical pipeline (safety -> parallel assessments -> synthesis)
  clinicalPipeline: (data) => apiClient.post('/ai/clinical-pipeline', data),
};

export const aiFeedbackAPI = {
  // Submit feedback on AI suggestion
  submitFeedback: (data) => apiClient.post('/ai/feedback', data),
  // Get user's feedback history
  getMyFeedback: (params) => apiClient.get('/ai/feedback/me', { params }),
  // Get user's feedback stats
  getMyStats: () => apiClient.get('/ai/feedback/me/stats'),
  // Get overall AI performance metrics (admin)
  getPerformanceMetrics: (params) => apiClient.get('/ai/performance', { params }),
  // Get suggestions needing review (admin)
  getSuggestionsNeedingReview: (limit) =>
    apiClient.get('/ai/suggestions/review', { params: { limit } }),
  // Get common corrections (admin)
  getCommonCorrections: (params) => apiClient.get('/ai/corrections/common', { params }),
  // Trigger manual retraining (admin)
  triggerRetraining: () => apiClient.post('/ai/retraining/trigger'),
  // Get retraining status
  getRetrainingStatus: () => apiClient.get('/ai/retraining/status'),
  // Get retraining history
  getRetrainingHistory: () => apiClient.get('/ai/retraining/history'),
  // Rollback to previous model
  rollbackModel: (versionId) => apiClient.post(`/ai/model/rollback/${versionId}`),
  // Export feedback for training
  exportFeedback: (format = 'jsonl') =>
    apiClient.get('/ai/feedback/export', { params: { format } }),
};

export const aiRetrainingAPI = {
  triggerRetraining: (opts) => apiClient.post('/ai-retraining/trigger-retraining', opts),
  getStatus: () => apiClient.get('/ai-retraining/status'),
  getHistory: (limit) => apiClient.get('/ai-retraining/history', { params: { limit } }),
  exportFeedback: (opts) => apiClient.post('/ai-retraining/export-feedback', opts),
  rollbackModel: (v) => apiClient.post('/ai-retraining/model/rollback', { targetVersion: v }),
  testModel: (m) => apiClient.post('/ai-retraining/model/test', { modelName: m }),
  generatePairs: (d) => apiClient.post('/ai-retraining/rlaif/generate-pairs', d),
  getRLAIFStats: () => apiClient.get('/ai-retraining/rlaif/stats'),
  getSchedulerStatus: () => apiClient.get('/ai-retraining/scheduler/status'),
};

export const curationAPI = {
  getFeedback: (params) => apiClient.get('/training/curation/feedback', { params }),
  getStats: () => apiClient.get('/training/curation/stats'),
  approve: (id, data) => apiClient.post(`/training/curation/approve/${id}`, data),
  reject: (id) => apiClient.post(`/training/curation/reject/${id}`),
  bulk: (data) => apiClient.post('/training/curation/bulk', data),
};

export const trainingAPI = {
  getStatus: () => apiClient.get('/training/status'),
  getData: () => apiClient.get('/training/data'),
  addExamples: (jsonlContent, targetFile) =>
    apiClient.post('/training/add-examples', { jsonlContent, targetFile }),
  rebuild: () => apiClient.post('/training/rebuild'),
  backup: () => apiClient.post('/training/backup'),
  restore: () => apiClient.post('/training/restore'),
  testModel: (model, prompt) => apiClient.get(`/training/test/${model}`, { params: { prompt } }),
  getAnalyticsPerformance: (params) => apiClient.get('/training/analytics/performance', { params }),
  getAnalyticsUsage: (params) => apiClient.get('/training/analytics/usage', { params }),
  getAnalyticsSuggestions: (params) => apiClient.get('/training/analytics/suggestions', { params }),
  getAnalyticsRedFlags: (params) => apiClient.get('/training/analytics/red-flags', { params }),
  getAnalyticsComparison: (params) => apiClient.get('/training/analytics/comparison', { params }),
  getCostPerSuggestion: (params) =>
    apiClient.get('/training/analytics/cost-per-suggestion', { params }),
  getProviderValue: (params) => apiClient.get('/training/analytics/provider-value', { params }),
  getCacheTrends: (params) => apiClient.get('/training/analytics/cache-trends', { params }),
};
