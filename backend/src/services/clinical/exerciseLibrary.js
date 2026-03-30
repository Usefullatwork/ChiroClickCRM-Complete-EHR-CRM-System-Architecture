/**
 * Exercise Library Service
 * Provides exercise management, prescription, and patient portal functionality
 *
 * Barrel re-export — all functions split into domain modules:
 *   exerciseSearch.js      — CRUD operations for exercise library
 *   exerciseCategories.js  — Category listing and default seeding
 *   exerciseMedia.js       — Prescriptions, portal access, and progress tracking
 *
 * @module services/exerciseLibrary
 */

export {
  getExercises,
  getExerciseById,
  createExercise,
  updateExercise,
  deleteExercise,
} from './exerciseSearch.js';

export { getCategories, seedDefaultExercises } from './exerciseCategories.js';

export {
  createPrescription,
  getPatientPrescriptions,
  getPrescriptionById,
  updatePrescriptionStatus,
  updatePrescriptionEmailStatus,
  getPrescriptionByPortalToken,
  recordProgress,
  getProgressHistory,
} from './exerciseMedia.js';

// Export default for service
export default {
  // Exercise library
  getExercises: (await import('./exerciseSearch.js')).getExercises,
  getExerciseById: (await import('./exerciseSearch.js')).getExerciseById,
  createExercise: (await import('./exerciseSearch.js')).createExercise,
  updateExercise: (await import('./exerciseSearch.js')).updateExercise,
  deleteExercise: (await import('./exerciseSearch.js')).deleteExercise,
  getCategories: (await import('./exerciseCategories.js')).getCategories,
  seedDefaultExercises: (await import('./exerciseCategories.js')).seedDefaultExercises,

  // Prescriptions
  createPrescription: (await import('./exerciseMedia.js')).createPrescription,
  getPatientPrescriptions: (await import('./exerciseMedia.js')).getPatientPrescriptions,
  getPrescriptionById: (await import('./exerciseMedia.js')).getPrescriptionById,
  updatePrescriptionStatus: (await import('./exerciseMedia.js')).updatePrescriptionStatus,
  updatePrescriptionEmailStatus: (await import('./exerciseMedia.js')).updatePrescriptionEmailStatus,

  // Patient portal
  getPrescriptionByPortalToken: (await import('./exerciseMedia.js')).getPrescriptionByPortalToken,
  recordProgress: (await import('./exerciseMedia.js')).recordProgress,
  getProgressHistory: (await import('./exerciseMedia.js')).getProgressHistory,
};
