/**
 * Exercise Controller
 * HTTP request handlers for exercise library and prescription endpoints
 *
 * @module controllers/exercises
 */

import exerciseLibraryService from '../services/exerciseLibrary.js';
import exerciseDeliveryService from '../services/exerciseDelivery.js';
import _logger from '../utils/logger.js';
import { logAudit } from '../utils/audit.js';

// ============================================================================
// EXERCISE LIBRARY CRUD
// ============================================================================

/**
 * Get all exercises
 * @route GET /api/v1/exercises
 */
export const getExercises = async (req, res) => {
  const { organizationId } = req;
  const { category, subcategory, bodyRegion, difficultyLevel, search, isActive, limit, offset } =
    req.query;

  const exercises = await exerciseLibraryService.getExercises(organizationId, {
    category,
    subcategory,
    bodyRegion,
    difficultyLevel,
    search,
    isActive: isActive === 'false' ? false : isActive === 'true' ? true : null,
    limit: parseInt(limit) || 100,
    offset: parseInt(offset) || 0,
  });

  res.json({
    success: true,
    data: exercises,
    count: exercises.length,
  });
};

/**
 * Get exercise by ID
 * @route GET /api/v1/exercises/:id
 */
export const getExerciseById = async (req, res) => {
  const { organizationId } = req;
  const { id } = req.params;

  const exercise = await exerciseLibraryService.getExerciseById(organizationId, id);

  if (!exercise) {
    return res.status(404).json({ error: 'Exercise not found' });
  }

  res.json({
    success: true,
    data: exercise,
  });
};

/**
 * Create a new exercise
 * @route POST /api/v1/exercises
 */
export const createExercise = async (req, res) => {
  const { organizationId, user } = req;

  const exercise = await exerciseLibraryService.createExercise(organizationId, user.id, req.body);

  await logAudit({
    organizationId,
    userId: user.id,
    action: 'CREATE',
    resourceType: 'EXERCISE',
    resourceId: exercise.id,
    details: { name: exercise.name },
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  });

  res.status(201).json({
    success: true,
    data: exercise,
  });
};

/**
 * Update an exercise
 * @route PUT /api/v1/exercises/:id
 */
export const updateExercise = async (req, res) => {
  const { organizationId, user } = req;
  const { id } = req.params;

  const exercise = await exerciseLibraryService.updateExercise(organizationId, id, req.body);

  if (!exercise) {
    return res.status(404).json({ error: 'Exercise not found' });
  }

  await logAudit({
    organizationId,
    userId: user.id,
    action: 'UPDATE',
    resourceType: 'EXERCISE',
    resourceId: id,
    details: req.body,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  });

  res.json({
    success: true,
    data: exercise,
  });
};

/**
 * Delete an exercise (soft delete)
 * @route DELETE /api/v1/exercises/:id
 */
export const deleteExercise = async (req, res) => {
  const { organizationId, user } = req;
  const { id } = req.params;

  const deleted = await exerciseLibraryService.deleteExercise(organizationId, id);

  if (!deleted) {
    return res.status(404).json({ error: 'Exercise not found' });
  }

  await logAudit({
    organizationId,
    userId: user.id,
    action: 'DELETE',
    resourceType: 'EXERCISE',
    resourceId: id,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  });

  res.json({
    success: true,
    message: 'Exercise deleted successfully',
  });
};

/**
 * Get exercise categories
 * @route GET /api/v1/exercises/categories
 */
export const getCategories = async (req, res) => {
  const { organizationId } = req;

  const categories = await exerciseLibraryService.getCategories(organizationId);

  res.json({
    success: true,
    data: categories,
  });
};

/**
 * Seed default exercises for organization
 * @route POST /api/v1/exercises/seed
 */
export const seedDefaultExercises = async (req, res) => {
  const { organizationId, user } = req;

  await exerciseLibraryService.seedDefaultExercises(organizationId);

  await logAudit({
    organizationId,
    userId: user.id,
    action: 'SEED',
    resourceType: 'EXERCISE_LIBRARY',
    details: { action: 'Seeded default exercises' },
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  });

  res.json({
    success: true,
    message: 'Default exercises seeded successfully',
  });
};

// ============================================================================
// TEMPLATES
// ============================================================================

/**
 * Get all exercise program templates
 * @route GET /api/v1/exercises/templates
 */
export const getTemplates = async (req, res) => {
  const { organizationId } = req;
  const { category, search } = req.query;

  const templates = await exerciseLibraryService.getTemplates(organizationId, {
    category,
    search,
  });

  res.json({
    success: true,
    data: templates,
  });
};

/**
 * Create a new exercise program template
 * @route POST /api/v1/exercises/templates
 */
export const createTemplate = async (req, res) => {
  const { organizationId, user } = req;

  const template = await exerciseLibraryService.createTemplate(organizationId, {
    ...req.body,
    createdBy: user.id,
  });

  await logAudit({
    organizationId,
    userId: user.id,
    action: 'CREATE',
    resourceType: 'EXERCISE_TEMPLATE',
    resourceId: template.id,
    details: { name: template.name },
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  });

  res.status(201).json({
    success: true,
    data: template,
  });
};

/**
 * Update an exercise program template
 * @route PUT /api/v1/exercises/templates/:id
 */
export const updateTemplate = async (req, res) => {
  const { organizationId, user } = req;
  const { id } = req.params;

  const template = await exerciseLibraryService.updateTemplate(organizationId, id, req.body);

  if (!template) {
    return res.status(404).json({ error: 'Template not found' });
  }

  await logAudit({
    organizationId,
    userId: user.id,
    action: 'UPDATE',
    resourceType: 'EXERCISE_TEMPLATE',
    resourceId: id,
    details: req.body,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  });

  res.json({
    success: true,
    data: template,
  });
};

/**
 * Delete an exercise program template
 * @route DELETE /api/v1/exercises/templates/:id
 */
export const deleteTemplate = async (req, res) => {
  const { organizationId, user } = req;
  const { id } = req.params;

  const deleted = await exerciseLibraryService.deleteTemplate(organizationId, id);

  if (!deleted) {
    return res.status(404).json({ error: 'Template not found' });
  }

  await logAudit({
    organizationId,
    userId: user.id,
    action: 'DELETE',
    resourceType: 'EXERCISE_TEMPLATE',
    resourceId: id,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  });

  res.json({
    success: true,
    message: 'Template deleted successfully',
  });
};

// ============================================================================
// PRESCRIPTIONS
// ============================================================================

/**
 * Create a new prescription
 * @route POST /api/v1/exercises/prescriptions
 */
export const createPrescription = async (req, res) => {
  const { organizationId, user } = req;

  const prescription = await exerciseLibraryService.createPrescription(organizationId, {
    ...req.body,
    prescribedBy: user.id,
  });

  await logAudit({
    organizationId,
    userId: user.id,
    action: 'CREATE',
    resourceType: 'EXERCISE_PRESCRIPTION',
    resourceId: prescription.id,
    details: {
      patientId: req.body.patientId,
      exerciseCount: req.body.exercises?.length || 0,
    },
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  });

  res.status(201).json({
    success: true,
    data: prescription,
  });
};

/**
 * Get prescriptions for a patient
 * @route GET /api/v1/exercises/prescriptions/patient/:patientId
 */
export const getPatientPrescriptions = async (req, res) => {
  const { organizationId } = req;
  const { patientId } = req.params;
  const { status } = req.query;

  const prescriptions = await exerciseLibraryService.getPatientPrescriptions(
    organizationId,
    patientId,
    status
  );

  res.json({
    success: true,
    data: prescriptions,
  });
};

/**
 * Get prescription by ID
 * @route GET /api/v1/exercises/prescriptions/:id
 */
export const getPrescriptionById = async (req, res) => {
  const { organizationId } = req;
  const { id } = req.params;

  const prescription = await exerciseLibraryService.getPrescriptionById(organizationId, id);

  if (!prescription) {
    return res.status(404).json({ error: 'Prescription not found' });
  }

  res.json({
    success: true,
    data: prescription,
  });
};

/**
 * Update an existing prescription
 * @route PUT /api/v1/exercises/prescriptions/:id
 */
export const updatePrescription = async (req, res) => {
  const { organizationId, user } = req;
  const { id } = req.params;

  const prescription = await exerciseLibraryService.updatePrescription(
    organizationId,
    id,
    req.body
  );

  if (!prescription) {
    return res.status(404).json({ error: 'Prescription not found' });
  }

  await logAudit({
    organizationId,
    userId: user.id,
    action: 'UPDATE',
    resourceType: 'EXERCISE_PRESCRIPTION',
    resourceId: id,
    details: {
      exerciseCount: req.body.exercises?.length || 0,
    },
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  });

  res.json({
    success: true,
    data: prescription,
  });
};

/**
 * Duplicate a prescription for the same or another patient
 * @route POST /api/v1/exercises/prescriptions/:id/duplicate
 */
export const duplicatePrescription = async (req, res) => {
  const { organizationId, user } = req;
  const { id } = req.params;
  const { targetPatientId } = req.body;

  const prescription = await exerciseLibraryService.duplicatePrescription(
    organizationId,
    id,
    targetPatientId,
    user.id
  );

  await logAudit({
    organizationId,
    userId: user.id,
    action: 'DUPLICATE',
    resourceType: 'EXERCISE_PRESCRIPTION',
    resourceId: prescription.id,
    details: {
      sourceId: id,
      targetPatientId,
    },
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  });

  res.status(201).json({
    success: true,
    data: prescription,
  });
};

/**
 * Update prescription status
 * @route PATCH /api/v1/exercises/prescriptions/:id/status
 */
export const updatePrescriptionStatus = async (req, res) => {
  const { organizationId, user } = req;
  const { id } = req.params;
  const { status } = req.body;

  const prescription = await exerciseLibraryService.updatePrescriptionStatus(
    organizationId,
    id,
    status
  );

  if (!prescription) {
    return res.status(404).json({ error: 'Prescription not found' });
  }

  await logAudit({
    organizationId,
    userId: user.id,
    action: 'UPDATE_STATUS',
    resourceType: 'EXERCISE_PRESCRIPTION',
    resourceId: id,
    details: { status },
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  });

  res.json({
    success: true,
    data: prescription,
  });
};

/**
 * Get progress history for a prescription
 * @route GET /api/v1/exercises/prescriptions/:id/progress
 */
export const getProgressHistory = async (req, res) => {
  const { organizationId } = req;
  const { id } = req.params;

  const progress = await exerciseLibraryService.getProgressHistory(organizationId, id);

  res.json({
    success: true,
    data: progress,
  });
};

// ============================================================================
// DELIVERY
// ============================================================================

/**
 * Generate prescription PDF
 * @route GET /api/v1/exercises/prescriptions/:id/pdf
 */
export const generatePDF = async (req, res) => {
  const { organizationId } = req;
  const { id } = req.params;

  const pdfBuffer = await exerciseDeliveryService.generatePrescriptionPDF(organizationId, id);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="exercise-program-${id}.pdf"`);
  res.send(pdfBuffer);
};

/**
 * Send prescription via email
 * @route POST /api/v1/exercises/prescriptions/:id/send-email
 */
export const sendEmail = async (req, res) => {
  const { organizationId, user } = req;
  const { id } = req.params;

  const result = await exerciseDeliveryService.sendPrescriptionEmail(organizationId, id);

  await logAudit({
    organizationId,
    userId: user.id,
    action: 'SEND_EMAIL',
    resourceType: 'EXERCISE_PRESCRIPTION',
    resourceId: id,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  });

  res.json({
    success: true,
    message: 'Email sent successfully',
    data: result,
  });
};

/**
 * Send exercise reminder
 * @route POST /api/v1/exercises/prescriptions/:id/send-reminder
 */
export const sendReminder = async (req, res) => {
  const { organizationId, user } = req;
  const { id } = req.params;

  const result = await exerciseDeliveryService.sendExerciseReminder(organizationId, id);

  await logAudit({
    organizationId,
    userId: user.id,
    action: 'SEND_REMINDER',
    resourceType: 'EXERCISE_PRESCRIPTION',
    resourceId: id,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  });

  res.json({
    success: true,
    message: 'Reminder sent successfully',
    data: result,
  });
};

/**
 * Send portal link via SMS
 * @route POST /api/v1/exercises/prescriptions/:id/send-sms
 */
export const sendSMS = async (req, res) => {
  const { organizationId, user } = req;
  const { id } = req.params;

  const result = await exerciseDeliveryService.sendPortalSMS(organizationId, id);

  await logAudit({
    organizationId,
    userId: user.id,
    action: 'SEND_SMS',
    resourceType: 'EXERCISE_PRESCRIPTION',
    resourceId: id,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  });

  res.json({
    success: true,
    message: 'SMS sent successfully',
    data: result,
  });
};

export default {
  // Library
  getExercises,
  getExerciseById,
  createExercise,
  updateExercise,
  deleteExercise,
  getCategories,
  seedDefaultExercises,

  // Templates
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,

  // Prescriptions
  createPrescription,
  getPatientPrescriptions,
  getPrescriptionById,
  updatePrescription,
  duplicatePrescription,
  updatePrescriptionStatus,
  getProgressHistory,

  // Delivery
  generatePDF,
  sendEmail,
  sendReminder,
  sendSMS,
};
