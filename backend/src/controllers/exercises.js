/**
 * Exercise Controller
 * Handles HTTP requests for exercise library, prescriptions, and programs
 */

import * as exerciseService from '../services/exercises.js';
import { logAudit } from '../utils/audit.js';
import logger from '../utils/logger.js';

// ============================================================================
// EXERCISE LIBRARY
// ============================================================================

/**
 * Get all exercises
 * GET /api/v1/exercises
 */
export const getAll = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50,
      category: req.query.category || null,
      bodyRegion: req.query.bodyRegion || req.query.body_region || null,
      difficulty: req.query.difficulty || null,
      search: req.query.search || req.query.q || null,
      tags: req.query.tags ? req.query.tags.split(',') : null,
      includeGlobal: req.query.includeGlobal !== 'false',
      activeOnly: req.query.activeOnly !== 'false'
    };

    const result = await exerciseService.getAllExercises(organizationId, options);

    res.json(result);
  } catch (error) {
    logger.error('Error in getAll exercises controller:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve exercises'
    });
  }
};

/**
 * Get exercise by ID
 * GET /api/v1/exercises/:id
 */
export const getById = async (req, res) => {
  try {
    const { organizationId } = req;
    const { id } = req.params;

    const exercise = await exerciseService.getExerciseById(id, organizationId);

    if (!exercise) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Exercise not found'
      });
    }

    res.json(exercise);
  } catch (error) {
    logger.error('Error in getById exercises controller:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve exercise'
    });
  }
};

/**
 * Create a new exercise
 * POST /api/v1/exercises
 */
export const create = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const exerciseData = req.body;

    // Check for required fields
    if (!exerciseData.code || !exerciseData.name_no || !exerciseData.category || !exerciseData.body_region || !exerciseData.instructions_no) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required fields: code, name_no, category, body_region, instructions_no'
      });
    }

    const exercise = await exerciseService.createExercise(organizationId, exerciseData, user.id);

    await logAudit({
      organizationId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'CREATE',
      resourceType: 'EXERCISE',
      resourceId: exercise.id,
      changes: { new: exerciseData },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(201).json(exercise);
  } catch (error) {
    logger.error('Error in create exercise controller:', error);

    if (error.code === '23505') {
      return res.status(409).json({
        error: 'Conflict',
        message: 'An exercise with this code already exists'
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create exercise'
    });
  }
};

/**
 * Update an exercise
 * PATCH /api/v1/exercises/:id
 */
export const update = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const { id } = req.params;
    const updates = req.body;

    const oldExercise = await exerciseService.getExerciseById(id, organizationId);
    if (!oldExercise) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Exercise not found'
      });
    }

    // Prevent updating global exercises unless user is admin
    if (oldExercise.is_global && user.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Cannot modify global exercises'
      });
    }

    const exercise = await exerciseService.updateExercise(id, organizationId, updates);

    await logAudit({
      organizationId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'UPDATE',
      resourceType: 'EXERCISE',
      resourceId: id,
      changes: { old: oldExercise, new: updates },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json(exercise);
  } catch (error) {
    logger.error('Error in update exercise controller:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update exercise'
    });
  }
};

/**
 * Delete an exercise (soft delete)
 * DELETE /api/v1/exercises/:id
 */
export const deleteExercise = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const { id } = req.params;

    const exercise = await exerciseService.getExerciseById(id, organizationId);
    if (!exercise) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Exercise not found'
      });
    }

    // Prevent deleting global exercises
    if (exercise.is_global) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Cannot delete global exercises'
      });
    }

    await exerciseService.deleteExercise(id, organizationId);

    await logAudit({
      organizationId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'DELETE',
      resourceType: 'EXERCISE',
      resourceId: id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({ message: 'Exercise deleted successfully' });
  } catch (error) {
    logger.error('Error in delete exercise controller:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete exercise'
    });
  }
};

/**
 * Get exercise categories
 * GET /api/v1/exercises/categories
 */
export const getCategories = async (req, res) => {
  try {
    const categories = await exerciseService.getCategories();
    res.json(categories);
  } catch (error) {
    logger.error('Error in getCategories controller:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve categories'
    });
  }
};

/**
 * Get body regions
 * GET /api/v1/exercises/body-regions
 */
export const getBodyRegions = async (req, res) => {
  try {
    const regions = await exerciseService.getBodyRegions();
    res.json(regions);
  } catch (error) {
    logger.error('Error in getBodyRegions controller:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve body regions'
    });
  }
};

/**
 * Get user's favorite exercises
 * GET /api/v1/exercises/favorites
 */
export const getFavorites = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const limit = parseInt(req.query.limit) || 20;

    const favorites = await exerciseService.getUserFavorites(user.id, organizationId, limit);
    res.json(favorites);
  } catch (error) {
    logger.error('Error in getFavorites controller:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve favorites'
    });
  }
};

/**
 * Get recently used exercises
 * GET /api/v1/exercises/recent
 */
export const getRecentlyUsed = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const limit = parseInt(req.query.limit) || 10;

    const recent = await exerciseService.getRecentlyUsed(user.id, organizationId, limit);
    res.json(recent);
  } catch (error) {
    logger.error('Error in getRecentlyUsed controller:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve recent exercises'
    });
  }
};

/**
 * Get exercise statistics
 * GET /api/v1/exercises/stats
 */
export const getStats = async (req, res) => {
  try {
    const { organizationId } = req;
    const stats = await exerciseService.getExerciseStats(organizationId);
    res.json(stats);
  } catch (error) {
    logger.error('Error in getStats controller:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve exercise statistics'
    });
  }
};

/**
 * Get top prescribed exercises
 * GET /api/v1/exercises/top-prescribed
 */
export const getTopPrescribed = async (req, res) => {
  try {
    const { organizationId } = req;
    const limit = parseInt(req.query.limit) || 10;

    const topExercises = await exerciseService.getTopPrescribedExercises(organizationId, limit);
    res.json(topExercises);
  } catch (error) {
    logger.error('Error in getTopPrescribed controller:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve top prescribed exercises'
    });
  }
};

// ============================================================================
// EXERCISE PROGRAMS
// ============================================================================

/**
 * Get all exercise programs
 * GET /api/v1/exercises/programs
 */
export const getPrograms = async (req, res) => {
  try {
    const { organizationId } = req;
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      targetCondition: req.query.targetCondition || req.query.condition || null,
      bodyRegion: req.query.bodyRegion || req.query.body_region || null,
      includeGlobal: req.query.includeGlobal !== 'false',
      activeOnly: req.query.activeOnly !== 'false'
    };

    const result = await exerciseService.getAllPrograms(organizationId, options);
    res.json(result);
  } catch (error) {
    logger.error('Error in getPrograms controller:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve exercise programs'
    });
  }
};

/**
 * Get program by ID
 * GET /api/v1/exercises/programs/:id
 */
export const getProgram = async (req, res) => {
  try {
    const { organizationId } = req;
    const { id } = req.params;

    const program = await exerciseService.getProgramById(id, organizationId);

    if (!program) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Exercise program not found'
      });
    }

    res.json(program);
  } catch (error) {
    logger.error('Error in getProgram controller:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve exercise program'
    });
  }
};

/**
 * Create an exercise program
 * POST /api/v1/exercises/programs
 */
export const createProgram = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const programData = req.body;

    if (!programData.name_no) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Program name (name_no) is required'
      });
    }

    const program = await exerciseService.createProgram(organizationId, programData, user.id);

    await logAudit({
      organizationId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'CREATE',
      resourceType: 'EXERCISE_PROGRAM',
      resourceId: program.id,
      changes: { new: programData },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(201).json(program);
  } catch (error) {
    logger.error('Error in createProgram controller:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create exercise program'
    });
  }
};

/**
 * Update an exercise program
 * PATCH /api/v1/exercises/programs/:id
 */
export const updateProgram = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const { id } = req.params;
    const updates = req.body;

    const oldProgram = await exerciseService.getProgramById(id, organizationId);
    if (!oldProgram) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Exercise program not found'
      });
    }

    if (oldProgram.is_global && user.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Cannot modify global programs'
      });
    }

    const program = await exerciseService.updateProgram(id, organizationId, updates);

    await logAudit({
      organizationId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'UPDATE',
      resourceType: 'EXERCISE_PROGRAM',
      resourceId: id,
      changes: { old: oldProgram, new: updates },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json(program);
  } catch (error) {
    logger.error('Error in updateProgram controller:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update exercise program'
    });
  }
};

/**
 * Delete an exercise program
 * DELETE /api/v1/exercises/programs/:id
 */
export const deleteProgram = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const { id } = req.params;

    const program = await exerciseService.getProgramById(id, organizationId);
    if (!program) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Exercise program not found'
      });
    }

    if (program.is_global) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Cannot delete global programs'
      });
    }

    await exerciseService.deleteProgram(id, organizationId);

    await logAudit({
      organizationId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'DELETE',
      resourceType: 'EXERCISE_PROGRAM',
      resourceId: id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({ message: 'Exercise program deleted successfully' });
  } catch (error) {
    logger.error('Error in deleteProgram controller:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete exercise program'
    });
  }
};

// ============================================================================
// PATIENT PRESCRIPTIONS
// ============================================================================

/**
 * Prescribe exercise to a patient
 * POST /api/v1/patients/:patientId/exercises
 */
export const prescribe = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const { patientId } = req.params;
    const prescriptionData = req.body;

    if (!prescriptionData.exercise_code || !prescriptionData.exercise_name) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'exercise_code and exercise_name are required'
      });
    }

    const prescription = await exerciseService.prescribeExercise(organizationId, {
      ...prescriptionData,
      patient_id: patientId,
      prescribed_by: user.id
    });

    await logAudit({
      organizationId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'CREATE',
      resourceType: 'EXERCISE_PRESCRIPTION',
      resourceId: prescription.id,
      details: { patient_id: patientId, exercise: prescriptionData.exercise_code },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(201).json(prescription);
  } catch (error) {
    logger.error('Error in prescribe controller:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to prescribe exercise'
    });
  }
};

/**
 * Get patient's exercises
 * GET /api/v1/patients/:patientId/exercises
 */
export const getPatientExercises = async (req, res) => {
  try {
    const { organizationId } = req;
    const { patientId } = req.params;
    const options = {
      status: req.query.status || 'active',
      includeCompleted: req.query.includeCompleted === 'true',
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50
    };

    const result = await exerciseService.getPatientExercises(patientId, organizationId, options);
    res.json(result);
  } catch (error) {
    logger.error('Error in getPatientExercises controller:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve patient exercises'
    });
  }
};

/**
 * Get prescription by ID
 * GET /api/v1/exercises/prescriptions/:id
 */
export const getPrescription = async (req, res) => {
  try {
    const { organizationId } = req;
    const { id } = req.params;

    const prescription = await exerciseService.getPrescriptionById(id, organizationId);

    if (!prescription) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Prescription not found'
      });
    }

    res.json(prescription);
  } catch (error) {
    logger.error('Error in getPrescription controller:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve prescription'
    });
  }
};

/**
 * Update prescription
 * PATCH /api/v1/exercises/prescriptions/:id
 */
export const updatePrescription = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const { id } = req.params;
    const updates = req.body;

    const prescription = await exerciseService.updatePrescription(id, organizationId, updates);

    if (!prescription) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Prescription not found'
      });
    }

    await logAudit({
      organizationId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'UPDATE',
      resourceType: 'EXERCISE_PRESCRIPTION',
      resourceId: id,
      changes: { new: updates },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json(prescription);
  } catch (error) {
    logger.error('Error in updatePrescription controller:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update prescription'
    });
  }
};

/**
 * Log compliance for a prescription
 * POST /api/v1/exercises/prescriptions/:id/compliance
 */
export const logCompliance = async (req, res) => {
  try {
    const { organizationId } = req;
    const { id } = req.params;
    const complianceData = req.body;

    const prescription = await exerciseService.logCompliance(id, organizationId, complianceData);

    if (!prescription) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Prescription not found'
      });
    }

    res.json(prescription);
  } catch (error) {
    logger.error('Error in logCompliance controller:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to log compliance'
    });
  }
};

/**
 * Discontinue a prescription
 * POST /api/v1/exercises/prescriptions/:id/discontinue
 */
export const discontinue = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const { id } = req.params;
    const { reason } = req.body;

    const prescription = await exerciseService.discontinuePrescription(id, organizationId, user.id, reason);

    if (!prescription) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Prescription not found'
      });
    }

    await logAudit({
      organizationId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'UPDATE',
      resourceType: 'EXERCISE_PRESCRIPTION',
      resourceId: id,
      details: { action: 'discontinue', reason },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json(prescription);
  } catch (error) {
    logger.error('Error in discontinue controller:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to discontinue prescription'
    });
  }
};

/**
 * Mark prescription as completed
 * POST /api/v1/exercises/prescriptions/:id/complete
 */
export const complete = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const { id } = req.params;

    const prescription = await exerciseService.completePrescription(id, organizationId);

    if (!prescription) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Prescription not found'
      });
    }

    await logAudit({
      organizationId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'UPDATE',
      resourceType: 'EXERCISE_PRESCRIPTION',
      resourceId: id,
      details: { action: 'complete' },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json(prescription);
  } catch (error) {
    logger.error('Error in complete controller:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to complete prescription'
    });
  }
};

/**
 * Assign a program to a patient
 * POST /api/v1/patients/:patientId/programs
 */
export const assignProgram = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const { patientId } = req.params;
    const assignmentData = req.body;

    if (!assignmentData.program_id) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'program_id is required'
      });
    }

    const assignment = await exerciseService.assignProgramToPatient(organizationId, {
      ...assignmentData,
      patient_id: patientId,
      prescribed_by: user.id
    });

    await logAudit({
      organizationId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'CREATE',
      resourceType: 'PATIENT_PROGRAM',
      resourceId: assignment.id,
      details: { patient_id: patientId, program_id: assignmentData.program_id },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(201).json(assignment);
  } catch (error) {
    logger.error('Error in assignProgram controller:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to assign program to patient'
    });
  }
};

/**
 * Get compliance statistics
 * GET /api/v1/exercises/compliance
 */
export const getComplianceStats = async (req, res) => {
  try {
    const { organizationId } = req;
    const days = parseInt(req.query.days) || 30;

    const stats = await exerciseService.getComplianceStats(organizationId, days);
    res.json(stats);
  } catch (error) {
    logger.error('Error in getComplianceStats controller:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve compliance statistics'
    });
  }
};

export default {
  // Exercise Library
  getAll,
  getById,
  create,
  update,
  deleteExercise,
  getCategories,
  getBodyRegions,
  getFavorites,
  getRecentlyUsed,
  getStats,
  getTopPrescribed,
  // Programs
  getPrograms,
  getProgram,
  createProgram,
  updateProgram,
  deleteProgram,
  // Prescriptions
  prescribe,
  getPatientExercises,
  getPrescription,
  updatePrescription,
  logCompliance,
  discontinue,
  complete,
  assignProgram,
  getComplianceStats
};
