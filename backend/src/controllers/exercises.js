/**
 * Exercise Controller
 * HTTP request handlers for exercise library and prescription endpoints
 *
 * @module controllers/exercises
 */

import exerciseLibraryService from '../services/exerciseLibrary.js'
import exerciseDeliveryService from '../services/exerciseDelivery.js'
import logger from '../utils/logger.js'
import { logAudit } from '../utils/audit.js'

// ============================================================================
// EXERCISE LIBRARY CRUD
// ============================================================================

/**
 * Get all exercises
 * @route GET /api/v1/exercises
 */
export const getExercises = async (req, res) => {
  try {
    const { organizationId } = req
    const {
      category,
      subcategory,
      bodyRegion,
      difficultyLevel,
      search,
      isActive,
      limit,
      offset
    } = req.query

    const exercises = await exerciseLibraryService.getExercises(organizationId, {
      category,
      subcategory,
      bodyRegion,
      difficultyLevel,
      search,
      isActive: isActive === 'false' ? false : isActive === 'true' ? true : null,
      limit: parseInt(limit) || 100,
      offset: parseInt(offset) || 0
    })

    res.json({
      success: true,
      data: exercises,
      count: exercises.length
    })
  } catch (error) {
    logger.error('Error getting exercises:', error)
    res.status(500).json({ error: 'Failed to retrieve exercises' })
  }
}

/**
 * Get exercise by ID
 * @route GET /api/v1/exercises/:id
 */
export const getExerciseById = async (req, res) => {
  try {
    const { organizationId } = req
    const { id } = req.params

    const exercise = await exerciseLibraryService.getExerciseById(organizationId, id)

    if (!exercise) {
      return res.status(404).json({ error: 'Exercise not found' })
    }

    res.json({
      success: true,
      data: exercise
    })
  } catch (error) {
    logger.error('Error getting exercise by ID:', error)
    res.status(500).json({ error: 'Failed to retrieve exercise' })
  }
}

/**
 * Create a new exercise
 * @route POST /api/v1/exercises
 */
export const createExercise = async (req, res) => {
  try {
    const { organizationId, user } = req

    const exercise = await exerciseLibraryService.createExercise(
      organizationId,
      user.id,
      req.body
    )

    await logAudit({
      organizationId,
      userId: user.id,
      action: 'CREATE',
      resourceType: 'EXERCISE',
      resourceId: exercise.id,
      details: { name: exercise.name },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    })

    res.status(201).json({
      success: true,
      data: exercise
    })
  } catch (error) {
    logger.error('Error creating exercise:', error)
    res.status(500).json({ error: 'Failed to create exercise' })
  }
}

/**
 * Update an exercise
 * @route PUT /api/v1/exercises/:id
 */
export const updateExercise = async (req, res) => {
  try {
    const { organizationId, user } = req
    const { id } = req.params

    const exercise = await exerciseLibraryService.updateExercise(
      organizationId,
      id,
      req.body
    )

    if (!exercise) {
      return res.status(404).json({ error: 'Exercise not found' })
    }

    await logAudit({
      organizationId,
      userId: user.id,
      action: 'UPDATE',
      resourceType: 'EXERCISE',
      resourceId: id,
      details: req.body,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    })

    res.json({
      success: true,
      data: exercise
    })
  } catch (error) {
    logger.error('Error updating exercise:', error)
    res.status(500).json({ error: 'Failed to update exercise' })
  }
}

/**
 * Delete an exercise (soft delete)
 * @route DELETE /api/v1/exercises/:id
 */
export const deleteExercise = async (req, res) => {
  try {
    const { organizationId, user } = req
    const { id } = req.params

    const deleted = await exerciseLibraryService.deleteExercise(organizationId, id)

    if (!deleted) {
      return res.status(404).json({ error: 'Exercise not found' })
    }

    await logAudit({
      organizationId,
      userId: user.id,
      action: 'DELETE',
      resourceType: 'EXERCISE',
      resourceId: id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    })

    res.json({
      success: true,
      message: 'Exercise deleted successfully'
    })
  } catch (error) {
    logger.error('Error deleting exercise:', error)
    res.status(500).json({ error: 'Failed to delete exercise' })
  }
}

/**
 * Get exercise categories
 * @route GET /api/v1/exercises/categories
 */
export const getCategories = async (req, res) => {
  try {
    const { organizationId } = req

    const categories = await exerciseLibraryService.getCategories(organizationId)

    res.json({
      success: true,
      data: categories
    })
  } catch (error) {
    logger.error('Error getting exercise categories:', error)
    res.status(500).json({ error: 'Failed to retrieve categories' })
  }
}

/**
 * Seed default exercises for organization
 * @route POST /api/v1/exercises/seed
 */
export const seedDefaultExercises = async (req, res) => {
  try {
    const { organizationId, user } = req

    await exerciseLibraryService.seedDefaultExercises(organizationId)

    await logAudit({
      organizationId,
      userId: user.id,
      action: 'SEED',
      resourceType: 'EXERCISE_LIBRARY',
      details: { action: 'Seeded default exercises' },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    })

    res.json({
      success: true,
      message: 'Default exercises seeded successfully'
    })
  } catch (error) {
    logger.error('Error seeding default exercises:', error)
    res.status(500).json({ error: 'Failed to seed default exercises' })
  }
}

// ============================================================================
// TEMPLATES
// ============================================================================

/**
 * Get all exercise program templates
 * @route GET /api/v1/exercises/templates
 */
export const getTemplates = async (req, res) => {
  try {
    const { organizationId } = req
    const { category, search } = req.query

    const templates = await exerciseLibraryService.getTemplates(organizationId, {
      category,
      search
    })

    res.json({
      success: true,
      data: templates
    })
  } catch (error) {
    logger.error('Error getting templates:', error)
    res.status(500).json({ error: 'Failed to retrieve templates' })
  }
}

/**
 * Create a new exercise program template
 * @route POST /api/v1/exercises/templates
 */
export const createTemplate = async (req, res) => {
  try {
    const { organizationId, user } = req

    const template = await exerciseLibraryService.createTemplate(organizationId, {
      ...req.body,
      createdBy: user.id
    })

    await logAudit({
      organizationId,
      userId: user.id,
      action: 'CREATE',
      resourceType: 'EXERCISE_TEMPLATE',
      resourceId: template.id,
      details: { name: template.name },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    })

    res.status(201).json({
      success: true,
      data: template
    })
  } catch (error) {
    logger.error('Error creating template:', error)
    res.status(500).json({ error: 'Failed to create template' })
  }
}

/**
 * Update an exercise program template
 * @route PUT /api/v1/exercises/templates/:id
 */
export const updateTemplate = async (req, res) => {
  try {
    const { organizationId, user } = req
    const { id } = req.params

    const template = await exerciseLibraryService.updateTemplate(organizationId, id, req.body)

    if (!template) {
      return res.status(404).json({ error: 'Template not found' })
    }

    await logAudit({
      organizationId,
      userId: user.id,
      action: 'UPDATE',
      resourceType: 'EXERCISE_TEMPLATE',
      resourceId: id,
      details: req.body,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    })

    res.json({
      success: true,
      data: template
    })
  } catch (error) {
    logger.error('Error updating template:', error)
    res.status(500).json({ error: 'Failed to update template' })
  }
}

/**
 * Delete an exercise program template
 * @route DELETE /api/v1/exercises/templates/:id
 */
export const deleteTemplate = async (req, res) => {
  try {
    const { organizationId, user } = req
    const { id } = req.params

    const deleted = await exerciseLibraryService.deleteTemplate(organizationId, id)

    if (!deleted) {
      return res.status(404).json({ error: 'Template not found' })
    }

    await logAudit({
      organizationId,
      userId: user.id,
      action: 'DELETE',
      resourceType: 'EXERCISE_TEMPLATE',
      resourceId: id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    })

    res.json({
      success: true,
      message: 'Template deleted successfully'
    })
  } catch (error) {
    logger.error('Error deleting template:', error)
    res.status(500).json({ error: 'Failed to delete template' })
  }
}

// ============================================================================
// PRESCRIPTIONS
// ============================================================================

/**
 * Create a new prescription
 * @route POST /api/v1/exercises/prescriptions
 */
export const createPrescription = async (req, res) => {
  try {
    const { organizationId, user } = req

    const prescription = await exerciseLibraryService.createPrescription(organizationId, {
      ...req.body,
      prescribedBy: user.id
    })

    await logAudit({
      organizationId,
      userId: user.id,
      action: 'CREATE',
      resourceType: 'EXERCISE_PRESCRIPTION',
      resourceId: prescription.id,
      details: {
        patientId: req.body.patientId,
        exerciseCount: req.body.exercises?.length || 0
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    })

    res.status(201).json({
      success: true,
      data: prescription
    })
  } catch (error) {
    logger.error('Error creating prescription:', error)
    res.status(500).json({ error: 'Failed to create prescription' })
  }
}

/**
 * Get prescriptions for a patient
 * @route GET /api/v1/exercises/prescriptions/patient/:patientId
 */
export const getPatientPrescriptions = async (req, res) => {
  try {
    const { organizationId } = req
    const { patientId } = req.params
    const { status } = req.query

    const prescriptions = await exerciseLibraryService.getPatientPrescriptions(
      organizationId,
      patientId,
      status
    )

    res.json({
      success: true,
      data: prescriptions
    })
  } catch (error) {
    logger.error('Error getting patient prescriptions:', error)
    res.status(500).json({ error: 'Failed to retrieve prescriptions' })
  }
}

/**
 * Get prescription by ID
 * @route GET /api/v1/exercises/prescriptions/:id
 */
export const getPrescriptionById = async (req, res) => {
  try {
    const { organizationId } = req
    const { id } = req.params

    const prescription = await exerciseLibraryService.getPrescriptionById(organizationId, id)

    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' })
    }

    res.json({
      success: true,
      data: prescription
    })
  } catch (error) {
    logger.error('Error getting prescription by ID:', error)
    res.status(500).json({ error: 'Failed to retrieve prescription' })
  }
}

/**
 * Update an existing prescription
 * @route PUT /api/v1/exercises/prescriptions/:id
 */
export const updatePrescription = async (req, res) => {
  try {
    const { organizationId, user } = req
    const { id } = req.params

    const prescription = await exerciseLibraryService.updatePrescription(organizationId, id, req.body)

    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' })
    }

    await logAudit({
      organizationId,
      userId: user.id,
      action: 'UPDATE',
      resourceType: 'EXERCISE_PRESCRIPTION',
      resourceId: id,
      details: {
        exerciseCount: req.body.exercises?.length || 0
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    })

    res.json({
      success: true,
      data: prescription
    })
  } catch (error) {
    logger.error('Error updating prescription:', error)
    res.status(500).json({ error: 'Failed to update prescription' })
  }
}

/**
 * Duplicate a prescription for the same or another patient
 * @route POST /api/v1/exercises/prescriptions/:id/duplicate
 */
export const duplicatePrescription = async (req, res) => {
  try {
    const { organizationId, user } = req
    const { id } = req.params
    const { targetPatientId } = req.body

    const prescription = await exerciseLibraryService.duplicatePrescription(
      organizationId,
      id,
      targetPatientId,
      user.id
    )

    await logAudit({
      organizationId,
      userId: user.id,
      action: 'DUPLICATE',
      resourceType: 'EXERCISE_PRESCRIPTION',
      resourceId: prescription.id,
      details: {
        sourceId: id,
        targetPatientId
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    })

    res.status(201).json({
      success: true,
      data: prescription
    })
  } catch (error) {
    logger.error('Error duplicating prescription:', error)
    res.status(500).json({ error: 'Failed to duplicate prescription' })
  }
}

/**
 * Update prescription status
 * @route PATCH /api/v1/exercises/prescriptions/:id/status
 */
export const updatePrescriptionStatus = async (req, res) => {
  try {
    const { organizationId, user } = req
    const { id } = req.params
    const { status } = req.body

    const prescription = await exerciseLibraryService.updatePrescriptionStatus(
      organizationId,
      id,
      status
    )

    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' })
    }

    await logAudit({
      organizationId,
      userId: user.id,
      action: 'UPDATE_STATUS',
      resourceType: 'EXERCISE_PRESCRIPTION',
      resourceId: id,
      details: { status },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    })

    res.json({
      success: true,
      data: prescription
    })
  } catch (error) {
    logger.error('Error updating prescription status:', error)
    res.status(500).json({ error: 'Failed to update prescription status' })
  }
}

/**
 * Get progress history for a prescription
 * @route GET /api/v1/exercises/prescriptions/:id/progress
 */
export const getProgressHistory = async (req, res) => {
  try {
    const { organizationId } = req
    const { id } = req.params

    const progress = await exerciseLibraryService.getProgressHistory(organizationId, id)

    res.json({
      success: true,
      data: progress
    })
  } catch (error) {
    logger.error('Error getting progress history:', error)
    res.status(500).json({ error: 'Failed to retrieve progress history' })
  }
}

// ============================================================================
// ALIASES (for patient routes compatibility)
// ============================================================================

/**
 * Alias for getPatientPrescriptions
 * @route GET /api/v1/patients/:patientId/exercises
 */
export const getPatientExercises = getPatientPrescriptions;

/**
 * Alias for createPrescription
 * @route POST /api/v1/patients/:patientId/exercises
 */
export const prescribe = createPrescription;

/**
 * Assign an exercise program to a patient
 * @route POST /api/v1/patients/:patientId/programs
 */
export const assignProgram = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const { patientId } = req.params;
    const { programId, startDate, notes } = req.body;

    // For now, use createPrescription with program exercises
    // This would need a proper implementation to copy exercises from a program template
    const prescription = await exerciseLibraryService.createPrescription(organizationId, {
      patientId,
      templateId: programId,
      startDate,
      notes,
      prescribedBy: user.id
    });

    await logAudit({
      organizationId,
      userId: user.id,
      action: 'ASSIGN_PROGRAM',
      resourceType: 'EXERCISE_PROGRAM',
      resourceId: prescription.id,
      details: { patientId, programId },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(201).json({
      success: true,
      data: prescription
    });
  } catch (error) {
    logger.error('Error assigning program:', error);
    res.status(500).json({ error: 'Failed to assign program' });
  }
};

// ============================================================================
// DELIVERY
// ============================================================================

/**
 * Generate prescription PDF
 * @route GET /api/v1/exercises/prescriptions/:id/pdf
 */
export const generatePDF = async (req, res) => {
  try {
    const { organizationId } = req
    const { id } = req.params

    const pdfBuffer = await exerciseDeliveryService.generatePrescriptionPDF(organizationId, id)

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="exercise-program-${id}.pdf"`)
    res.send(pdfBuffer)
  } catch (error) {
    logger.error('Error generating prescription PDF:', error)
    res.status(500).json({ error: 'Failed to generate PDF' })
  }
}

/**
 * Send prescription via email
 * @route POST /api/v1/exercises/prescriptions/:id/send-email
 */
export const sendEmail = async (req, res) => {
  try {
    const { organizationId, user } = req
    const { id } = req.params

    const result = await exerciseDeliveryService.sendPrescriptionEmail(organizationId, id)

    await logAudit({
      organizationId,
      userId: user.id,
      action: 'SEND_EMAIL',
      resourceType: 'EXERCISE_PRESCRIPTION',
      resourceId: id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    })

    res.json({
      success: true,
      message: 'Email sent successfully',
      data: result
    })
  } catch (error) {
    logger.error('Error sending prescription email:', error)
    res.status(500).json({ error: error.message || 'Failed to send email' })
  }
}

/**
 * Send exercise reminder
 * @route POST /api/v1/exercises/prescriptions/:id/send-reminder
 */
export const sendReminder = async (req, res) => {
  try {
    const { organizationId, user } = req
    const { id } = req.params

    const result = await exerciseDeliveryService.sendExerciseReminder(organizationId, id)

    await logAudit({
      organizationId,
      userId: user.id,
      action: 'SEND_REMINDER',
      resourceType: 'EXERCISE_PRESCRIPTION',
      resourceId: id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    })

    res.json({
      success: true,
      message: 'Reminder sent successfully',
      data: result
    })
  } catch (error) {
    logger.error('Error sending exercise reminder:', error)
    res.status(500).json({ error: error.message || 'Failed to send reminder' })
  }
}

/**
 * Send portal link via SMS
 * @route POST /api/v1/exercises/prescriptions/:id/send-sms
 */
export const sendSMS = async (req, res) => {
  try {
    const { organizationId, user } = req
    const { id } = req.params

    const result = await exerciseDeliveryService.sendPortalSMS(organizationId, id)

    await logAudit({
      organizationId,
      userId: user.id,
      action: 'SEND_SMS',
      resourceType: 'EXERCISE_PRESCRIPTION',
      resourceId: id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    })

    res.json({
      success: true,
      message: 'SMS sent successfully',
      data: result
    })
  } catch (error) {
    logger.error('Error sending portal SMS:', error)
    res.status(500).json({ error: error.message || 'Failed to send SMS' })
  }
}

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

  // Aliases for patient routes compatibility
  getPatientExercises: getPatientPrescriptions,
  prescribe: createPrescription,
  assignProgram
}
