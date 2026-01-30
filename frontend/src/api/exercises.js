/**
 * Exercises API
 * Exercise library, prescriptions, and delivery
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

export const exercisesApi = {
  // ============================================================================
  // EXERCISE LIBRARY
  // ============================================================================

  /**
   * Get exercise categories with subcategories
   */
  async getCategories() {
    const response = await axiosInstance.get('/exercises/categories');
    return response.data;
  },

  /**
   * Get all exercises with optional filters
   * @param {object} params - Filter params (category, subcategory, bodyRegion, difficultyLevel, search, isActive, limit, offset)
   */
  async getExercises(params = {}) {
    const response = await axiosInstance.get('/exercises', { params });
    return response.data;
  },

  /**
   * Get exercise by ID
   * @param {string} id - Exercise ID
   */
  async getExerciseById(id) {
    const response = await axiosInstance.get(`/exercises/${id}`);
    return response.data;
  },

  /**
   * Create a new exercise
   * @param {object} exerciseData - Exercise data
   */
  async createExercise(exerciseData) {
    const response = await axiosInstance.post('/exercises', exerciseData);
    return response.data;
  },

  /**
   * Update an exercise
   * @param {string} id - Exercise ID
   * @param {object} exerciseData - Updated exercise data
   */
  async updateExercise(id, exerciseData) {
    const response = await axiosInstance.put(`/exercises/${id}`, exerciseData);
    return response.data;
  },

  /**
   * Delete an exercise (soft delete)
   * @param {string} id - Exercise ID
   */
  async deleteExercise(id) {
    const response = await axiosInstance.delete(`/exercises/${id}`);
    return response.data;
  },

  /**
   * Seed default exercises for organization
   */
  async seedDefaultExercises() {
    const response = await axiosInstance.post('/exercises/seed');
    return response.data;
  },

  // ============================================================================
  // TEMPLATES
  // ============================================================================

  /**
   * Get all exercise program templates
   * @param {object} params - Filter params (category, search)
   */
  async getTemplates(params = {}) {
    const response = await axiosInstance.get('/exercises/templates', { params });
    return response.data;
  },

  /**
   * Create a new exercise program template
   * @param {object} templateData - Template data including exercises
   */
  async createTemplate(templateData) {
    const response = await axiosInstance.post('/exercises/templates', templateData);
    return response.data;
  },

  /**
   * Update an exercise program template
   * @param {string} id - Template ID
   * @param {object} templateData - Updated template data
   */
  async updateTemplate(id, templateData) {
    const response = await axiosInstance.put(`/exercises/templates/${id}`, templateData);
    return response.data;
  },

  /**
   * Delete an exercise program template
   * @param {string} id - Template ID
   */
  async deleteTemplate(id) {
    const response = await axiosInstance.delete(`/exercises/templates/${id}`);
    return response.data;
  },

  // ============================================================================
  // PRESCRIPTIONS
  // ============================================================================

  /**
   * Create a new exercise prescription
   * @param {object} prescriptionData - Prescription data including exercises
   */
  async createPrescription(prescriptionData) {
    const response = await axiosInstance.post('/exercises/prescriptions', prescriptionData);
    return response.data;
  },

  /**
   * Get prescriptions for a patient
   * @param {string} patientId - Patient ID
   * @param {object} params - Optional filters (status: active, completed, cancelled, paused)
   */
  async getPatientPrescriptions(patientId, params = {}) {
    const response = await axiosInstance.get(`/exercises/prescriptions/patient/${patientId}`, { params });
    return response.data;
  },

  /**
   * Get prescription by ID
   * @param {string} id - Prescription ID
   */
  async getPrescriptionById(id) {
    const response = await axiosInstance.get(`/exercises/prescriptions/${id}`);
    return response.data;
  },

  /**
   * Update an existing prescription
   * @param {string} id - Prescription ID
   * @param {object} prescriptionData - Updated prescription data
   */
  async updatePrescription(id, prescriptionData) {
    const response = await axiosInstance.put(`/exercises/prescriptions/${id}`, prescriptionData);
    return response.data;
  },

  /**
   * Duplicate a prescription for the same or another patient
   * @param {string} id - Prescription ID to duplicate
   * @param {string} targetPatientId - Target patient ID (optional, uses same patient if not provided)
   */
  async duplicatePrescription(id, targetPatientId = null) {
    const response = await axiosInstance.post(`/exercises/prescriptions/${id}/duplicate`, {
      targetPatientId
    });
    return response.data;
  },

  /**
   * Update prescription status
   * @param {string} id - Prescription ID
   * @param {string} status - New status (active, completed, cancelled, paused)
   */
  async updatePrescriptionStatus(id, status) {
    const response = await axiosInstance.patch(`/exercises/prescriptions/${id}/status`, { status });
    return response.data;
  },

  /**
   * Get progress history for a prescription
   * @param {string} id - Prescription ID
   */
  async getProgressHistory(id) {
    const response = await axiosInstance.get(`/exercises/prescriptions/${id}/progress`);
    return response.data;
  },

  // ============================================================================
  // DELIVERY
  // ============================================================================

  /**
   * Generate and download prescription PDF
   * @param {string} id - Prescription ID
   */
  async generatePDF(id) {
    const response = await axiosInstance.get(`/exercises/prescriptions/${id}/pdf`, {
      responseType: 'blob'
    });
    return response.data;
  },

  /**
   * Send prescription via email to patient
   * @param {string} id - Prescription ID
   */
  async sendEmail(id) {
    const response = await axiosInstance.post(`/exercises/prescriptions/${id}/send-email`);
    return response.data;
  },

  /**
   * Send exercise reminder to patient
   * @param {string} id - Prescription ID
   */
  async sendReminder(id) {
    const response = await axiosInstance.post(`/exercises/prescriptions/${id}/send-reminder`);
    return response.data;
  },

  /**
   * Send portal link via SMS to patient
   * @param {string} id - Prescription ID
   */
  async sendSMS(id) {
    const response = await axiosInstance.post(`/exercises/prescriptions/${id}/send-sms`);
    return response.data;
  }
};

export default exercisesApi;
