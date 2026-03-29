/**
 * Clinical API — encounters, SOAP, notes, diagnoses, examinations, exercises, outcomes
 */
import apiClient from './client';

export const encountersAPI = {
  getAll: (params) => apiClient.get('/encounters', { params }),
  getById: (id) => apiClient.get(`/encounters/${id}`),
  getByPatient: (patientId) => apiClient.get(`/patients/${patientId}/encounters`),
  create: (data) => apiClient.post('/encounters', data),
  update: (id, data) => apiClient.patch(`/encounters/${id}`, data),
  sign: (id) => apiClient.post(`/encounters/${id}/sign`),
  generateNote: (id) => apiClient.post(`/encounters/${id}/generate-note`),
  // SALT (Same As Last Time) - get last similar encounter for quick documentation
  getLastSimilar: (patientId, options = {}) =>
    apiClient.get(`/patients/${patientId}/encounters/last-similar`, { params: options }),
  // Amendments for signed encounters
  getAmendments: (encounterId) => apiClient.get(`/encounters/${encounterId}/amendments`),
  createAmendment: (encounterId, data) =>
    apiClient.post(`/encounters/${encounterId}/amendments`, data),
  signAmendment: (encounterId, amendmentId) =>
    apiClient.post(`/encounters/${encounterId}/amendments/${amendmentId}/sign`),
  deleteAmendment: (encounterId, amendmentId) =>
    apiClient.delete(`/encounters/${encounterId}/amendments/${amendmentId}`),
  // Anatomy findings
  getAnatomyFindings: (encounterId) => apiClient.get(`/encounters/${encounterId}/anatomy-findings`),
  saveAnatomyFindings: (encounterId, findings) =>
    apiClient.post(`/encounters/${encounterId}/anatomy-findings`, { findings }),
  getLatestAnatomyFindings: (patientId) =>
    apiClient.get(`/encounters/patient/${patientId}/latest-anatomy-findings`),
  // Assessment-first: diagnosis-to-findings map
  getDiagnosisFindings: (diagnosisCode) =>
    apiClient.get(`/encounters/diagnosis-findings/${encodeURIComponent(diagnosisCode)}`),
  // Reverse lookup: suggest diagnosis codes from anatomy findings
  getCodesFromFindings: (bodyRegions) =>
    apiClient.post('/encounters/codes-from-findings', { bodyRegions }),
};

export const encounterValidationAPI = {
  validate: (data) => apiClient.post('/encounters/validate', data),
  validateNote: (data) => apiClient.post('/encounters/validate-note', data),
};

export const workflowAPI = {
  startEncounter: (data) => apiClient.post('/encounters/workflow/start', data),
  recordExam: (encounterId, data) =>
    apiClient.post(`/encounters/${encounterId}/workflow/exam`, data),
  recordTreatment: (encounterId, data) =>
    apiClient.post(`/encounters/${encounterId}/workflow/treatment`, data),
  finalize: (encounterId, data) =>
    apiClient.post(`/encounters/${encounterId}/workflow/finalize`, data),
  getContext: (encounterId) => apiClient.get(`/encounters/${encounterId}/workflow/context`),
};

export const appointmentsAPI = {
  getAll: (params) => apiClient.get('/appointments', { params }),
  getById: (id) => apiClient.get(`/appointments/${id}`),
  getByDate: (date) => apiClient.get('/appointments', { params: { date } }),
  create: (data) => apiClient.post('/appointments', data),
  update: (id, data) => apiClient.patch(`/appointments/${id}`, data),
  cancel: (id, reason) => apiClient.post(`/appointments/${id}/cancel`, { reason }),
  confirm: (id) => apiClient.post(`/appointments/${id}/confirm`),
  checkIn: (id) => apiClient.post(`/appointments/${id}/check-in`),
};

export const diagnosisAPI = {
  search: (query) => apiClient.get('/diagnosis/search', { params: { q: query } }),
  getCommon: () => apiClient.get('/diagnosis/common'),
  getByCode: (code) => apiClient.get(`/diagnosis/${code}`),
};

export const treatmentsAPI = {
  getAll: () => apiClient.get('/treatments'),
  getCommon: () => apiClient.get('/treatments/common'),
  getByCode: (code) => apiClient.get(`/treatments/${code}`),
};

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
  search: (query, language = 'NO') =>
    apiClient.get('/templates/search', { params: { q: query, language } }),

  // Orthopedic Tests Library
  getTestsLibrary: (params) => apiClient.get('/templates/tests/library', { params }),
  getTestByCode: (code, language = 'NO') =>
    apiClient.get(`/templates/tests/${code}`, { params: { language } }),

  // User Preferences
  getUserPreferences: () => apiClient.get('/templates/preferences/user'),
  addFavorite: (templateId) => apiClient.post(`/templates/preferences/favorites/${templateId}`),
  removeFavorite: (templateId) =>
    apiClient.delete(`/templates/preferences/favorites/${templateId}`),

  // Clinical Phrases
  getPhrases: (params) => apiClient.get('/templates/phrases', { params }),
  getPhrasesByRegion: (region, language = 'NO') =>
    apiClient.get(`/templates/phrases/byregion/${region}`, { params: { language } }),
};

export const examinationsAPI = {
  // Protocols
  getBodyRegions: (language = 'NO') =>
    apiClient.get('/examinations/protocols/body-regions', { params: { language } }),
  getCategories: (language = 'NO') =>
    apiClient.get('/examinations/protocols/categories', { params: { language } }),
  getAllProtocols: (params) => apiClient.get('/examinations/protocols', { params }),
  getProtocolById: (id) => apiClient.get(`/examinations/protocols/${id}`),
  searchProtocols: (query, language = 'NO', limit = 50) =>
    apiClient.get('/examinations/protocols/search', { params: { query, language, limit } }),
  getProtocolsByRegion: (region, language = 'NO') =>
    apiClient.get(`/examinations/protocols/by-region/${region}`, { params: { language } }),
  getProtocolsByCategory: (category, language = 'NO') =>
    apiClient.get(`/examinations/protocols/by-category/${category}`, { params: { language } }),

  // Findings
  getFindingsByEncounter: (encounterId) =>
    apiClient.get(`/examinations/findings/encounter/${encounterId}`),
  getFindingById: (id) => apiClient.get(`/examinations/findings/${id}`),
  createFinding: (data) => apiClient.post('/examinations/findings', data),
  createBatchFindings: (findings) => apiClient.post('/examinations/findings/batch', { findings }),
  updateFinding: (id, data) => apiClient.patch(`/examinations/findings/${id}`, data),
  deleteFinding: (id) => apiClient.delete(`/examinations/findings/${id}`),

  // Summaries & Red Flags
  getExaminationSummary: (encounterId) => apiClient.get(`/examinations/summary/${encounterId}`),
  getRedFlags: (encounterId) => apiClient.get(`/examinations/red-flags/${encounterId}`),

  // Template Sets
  getAllTemplateSets: (language = 'NO') =>
    apiClient.get('/examinations/template-sets', { params: { language } }),
  getTemplateSetsByComplaint: (complaint, language = 'NO') =>
    apiClient.get(`/examinations/template-sets/by-complaint/${complaint}`, {
      params: { language },
    }),
  getTemplateSetById: (id) => apiClient.get(`/examinations/template-sets/${id}`),
  createTemplateSet: (data) => apiClient.post('/examinations/template-sets', data),
  incrementTemplateSetUsage: (id) => apiClient.post(`/examinations/template-sets/${id}/use`),
};

export const spineTemplatesAPI = {
  // Get all templates (with org customizations merged with defaults)
  getAll: (params) => apiClient.get('/spine-templates', { params }),
  // Get templates grouped by segment (for UI)
  getGrouped: (language = 'NO') =>
    apiClient.get('/spine-templates/grouped', { params: { language } }),
  // Get available segments
  getSegments: () => apiClient.get('/spine-templates/segments'),
  // Get available directions
  getDirections: () => apiClient.get('/spine-templates/directions'),
  // Get specific template by segment and direction
  getBySegmentDirection: (segment, direction, params) =>
    apiClient.get(`/spine-templates/${segment}/${direction}`, { params }),
  // Create/update custom template
  create: (data) => apiClient.post('/spine-templates', data),
  // Bulk update templates
  bulkUpdate: (templates) => apiClient.post('/spine-templates/bulk', { templates }),
  // Update single template
  update: (id, data) => apiClient.patch(`/spine-templates/${id}`, data),
  // Delete custom template (revert to default)
  delete: (id) => apiClient.delete(`/spine-templates/${id}`),
  // Reset all to defaults
  resetToDefaults: (language = 'NO') =>
    apiClient.post('/spine-templates/reset', null, { params: { language } }),
};

export const exercisesAPI = {
  // Exercise Library CRUD
  getAll: (params) => apiClient.get('/exercises', { params }),
  getById: (id) => apiClient.get(`/exercises/${id}`),
  create: (data) => apiClient.post('/exercises', data),
  update: (id, data) => apiClient.patch(`/exercises/${id}`, data),
  delete: (id) => apiClient.delete(`/exercises/${id}`),

  // Categories and Regions
  getCategories: () => apiClient.get('/exercises/categories'),
  getBodyRegions: () => apiClient.get('/exercises/body-regions'),

  // User favorites and recent
  getFavorites: (limit = 20) => apiClient.get('/exercises/favorites', { params: { limit } }),
  getRecentlyUsed: (limit = 10) => apiClient.get('/exercises/recent', { params: { limit } }),

  // Statistics
  getStats: () => apiClient.get('/exercises/stats'),
  getTopPrescribed: (limit = 10) =>
    apiClient.get('/exercises/top-prescribed', { params: { limit } }),
  getComplianceStats: (days = 30) => apiClient.get('/exercises/compliance', { params: { days } }),

  // Exercise Programs
  getPrograms: (params) => apiClient.get('/exercises/programs', { params }),
  getProgramById: (id) => apiClient.get(`/exercises/programs/${id}`),
  createProgram: (data) => apiClient.post('/exercises/programs', data),
  updateProgram: (id, data) => apiClient.patch(`/exercises/programs/${id}`, data),
  deleteProgram: (id) => apiClient.delete(`/exercises/programs/${id}`),

  // Prescriptions
  getPrescriptionById: (id) => apiClient.get(`/exercises/prescriptions/${id}`),
  updatePrescription: (id, data) => apiClient.patch(`/exercises/prescriptions/${id}`, data),
  logCompliance: (id, data) => apiClient.post(`/exercises/prescriptions/${id}/compliance`, data),
  discontinuePrescription: (id, reason) =>
    apiClient.post(`/exercises/prescriptions/${id}/discontinue`, { reason }),
  completePrescription: (id) => apiClient.post(`/exercises/prescriptions/${id}/complete`),

  // Patient-specific
  getPatientExercises: (patientId, params) =>
    apiClient.get(`/patients/${patientId}/exercises`, { params }),
  prescribeToPatient: (patientId, data) => apiClient.post(`/patients/${patientId}/exercises`, data),
  assignProgramToPatient: (patientId, data) =>
    apiClient.post(`/patients/${patientId}/programs`, data),

  // PDF generation
  getPatientExercisePDF: (patientId) =>
    apiClient.get(`/patients/${patientId}/exercises/pdf`, {
      responseType: 'blob',
    }),
  deliverPrescription: (id, data) => apiClient.post(`/exercises/prescriptions/${id}/deliver`, data),
};

export const vestibularAPI = {
  create: (data) => apiClient.post('/vestibular', data),
  getById: (id) => apiClient.get(`/vestibular/${id}`),
  getByPatient: (patientId) => apiClient.get(`/vestibular/patient/${patientId}`),
  getByEncounter: (encounterId) => apiClient.get(`/vestibular/encounter/${encounterId}`),
  update: (id, data) => apiClient.patch(`/vestibular/${id}`, data),
  delete: (id) => apiClient.delete(`/vestibular/${id}`),
  getBPPVTrends: (patientId) => apiClient.get(`/vestibular/patient/${patientId}/bppv-trends`),
};

export const macrosAPI = {
  getMatrix: () => apiClient.get('/macros'),
  search: (query) => apiClient.get('/macros/search', { params: { q: query } }),
  getFavorites: () => apiClient.get('/macros/favorites'),
  create: (data) => apiClient.post('/macros', data),
  update: (id, data) => apiClient.patch(`/macros/${id}`, data),
  delete: (id) => apiClient.delete(`/macros/${id}`),
  expand: (id, patientContext) => apiClient.post(`/macros/${id}/expand`, { patientContext }),
  toggleFavorite: (id) => apiClient.post(`/macros/${id}/favorite`),
  recordUsage: (id) => apiClient.post(`/macros/${id}/usage`),
};

export const outcomesAPI = {
  submitQuestionnaire: (data) => apiClient.post('/outcomes/questionnaires', data),
  getPatientQuestionnaires: (patientId, params) =>
    apiClient.get(`/outcomes/questionnaires/patient/${patientId}`, { params }),
  getQuestionnaireById: (id) => apiClient.get(`/outcomes/questionnaires/${id}`),
  getPatientTrend: (patientId, params) =>
    apiClient.get(`/outcomes/questionnaires/patient/${patientId}/trend`, { params }),
  deleteQuestionnaire: (id) => apiClient.delete(`/outcomes/questionnaires/${id}`),
  // Existing outcome endpoints
  getPatientSummary: (patientId) => apiClient.get(`/outcomes/patient/${patientId}/summary`),
  getPatientLongitudinal: (patientId) =>
    apiClient.get(`/outcomes/patient/${patientId}/longitudinal`),
};

export const treatmentPlansAPI = {
  getPatientPlans: (patientId, status) =>
    apiClient.get(`/treatment-plans/patient/${patientId}`, { params: { status } }),
  getPlan: (id) => apiClient.get(`/treatment-plans/${id}`),
  createPlan: (data) => apiClient.post('/treatment-plans', data),
  updatePlan: (id, data) => apiClient.patch(`/treatment-plans/${id}`, data),
  getPlanProgress: (id) => apiClient.get(`/treatment-plans/${id}/progress`),
  addMilestone: (planId, data) => apiClient.post(`/treatment-plans/${planId}/milestones`, data),
  updateMilestone: (milestoneId, data) =>
    apiClient.patch(`/treatment-plans/milestones/${milestoneId}`, data),
  addSession: (planId, data) => apiClient.post(`/treatment-plans/${planId}/sessions`, data),
  completeSession: (sessionId, data) =>
    apiClient.post(`/treatment-plans/sessions/${sessionId}/complete`, data),
};

export const followUpsAPI = {
  getAll: (params) => apiClient.get('/followups', { params }),
  getById: (id) => apiClient.get(`/followups/${id}`),
  create: (data) => apiClient.post('/followups', data),
  update: (id, data) => apiClient.patch(`/followups/${id}`, data),
  complete: (id, notes) => apiClient.post(`/followups/${id}/complete`, { notes }),
  skip: (id, reason) => apiClient.post(`/followups/${id}/skip`, { reason }),
  getPatientsNeedingFollowUp: () => apiClient.get('/followups/patients/needingFollowUp'),
  markPatientAsContacted: (patientId, method) =>
    apiClient.post(`/followups/patients/${patientId}/contacted`, { method }),
  getRecallSchedule: (patientId) => apiClient.get(`/followups/recall-schedule/${patientId}`),
  getRecallRules: () => apiClient.get('/followups/recall-rules'),
  updateRecallRules: (rules) => apiClient.post('/followups/recall-rules', rules),
};

export const progressAPI = {
  // Patient progress analytics
  getPatientStats: (patientId, params) =>
    apiClient.get(`/progress/patient/${patientId}/stats`, { params }),
  getWeeklyCompliance: (patientId, weeks = 12) =>
    apiClient.get(`/progress/patient/${patientId}/weekly`, { params: { weeks } }),
  getDailyProgress: (patientId, months = 3) =>
    apiClient.get(`/progress/patient/${patientId}/daily`, { params: { months } }),
  getPainHistory: (patientId, days = 90) =>
    apiClient.get(`/progress/patient/${patientId}/pain`, { params: { days } }),
  logPainEntry: (patientId, painLevel, notes) =>
    apiClient.post(`/progress/patient/${patientId}/pain`, { painLevel, notes }),

  // Therapist/Clinic analytics
  getAllPatientsCompliance: (params) => apiClient.get('/progress/compliance', { params }),
  getClinicOverview: () => apiClient.get('/progress/overview'),
};

export const clinicalSettingsAPI = {
  // Get all clinical settings
  getAll: () => apiClient.get('/clinical-settings'),
  // Get default settings reference
  getDefaults: () => apiClient.get('/clinical-settings/defaults'),
  // Update clinical settings (partial update)
  update: (settings) => apiClient.patch('/clinical-settings', settings),
  // Update specific section
  updateSection: (section, data) => apiClient.patch(`/clinical-settings/${section}`, data),
  // Reset all to defaults
  reset: () => apiClient.post('/clinical-settings/reset'),
  // Adjustment notation
  getAdjustmentTemplates: () => apiClient.get('/clinical-settings/adjustment/templates'),
  setAdjustmentStyle: (style) => apiClient.put('/clinical-settings/adjustment/style', { style }),
  // Test settings
  updateTestSettings: (testType, settings) =>
    apiClient.patch(`/clinical-settings/tests/${testType}`, settings),
  // Letter settings
  updateLetterSettings: (settings) => apiClient.patch('/clinical-settings/letters', settings),
};
