/**
 * Exercise Library Service — Barrel re-export
 * Sub-modules: exerciseCrud.js, exercisePrescriptions.js, exercisePrograms.js
 */

// Exercise Library CRUD
export {
  getAllExercises,
  getExerciseById,
  getExerciseByCode,
  createExercise,
  updateExercise,
  deleteExercise,
  getCategories,
  getBodyRegions,
  getUserFavorites,
  getRecentlyUsed,
} from './exerciseCrud.js';

// Patient Prescriptions
export {
  prescribeExercise,
  getPatientExercises,
  getPrescriptionById,
  updatePrescription,
  logCompliance,
  discontinuePrescription,
  completePrescription,
} from './exercisePrescriptions.js';

// Exercise Programs & Statistics
export {
  getAllPrograms,
  getProgramById,
  createProgram,
  updateProgram,
  deleteProgram,
  assignProgramToPatient,
  getExerciseStats,
  getTopPrescribedExercises,
  getComplianceStats,
} from './exercisePrograms.js';

// Default export for backward compatibility
import * as exerciseCrud from './exerciseCrud.js';
import * as exercisePrescriptions from './exercisePrescriptions.js';
import * as exercisePrograms from './exercisePrograms.js';

export default {
  ...exerciseCrud,
  ...exercisePrescriptions,
  ...exercisePrograms,
};
