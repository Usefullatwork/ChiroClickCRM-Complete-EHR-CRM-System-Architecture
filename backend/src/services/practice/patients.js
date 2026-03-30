/**
 * Patient Service
 * Business logic for patient management
 *
 * Barrel re-export — all functions split into domain modules:
 *   patientCrud.js   — CRUD operations (create, read, update, delete, export)
 *   patientSearch.js  — Basic and advanced search
 *   patientStats.js   — Statistics and follow-up management
 */

export {
  getAllPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
  getActiveContactsForExport,
} from './patientCrud.js';

export { searchPatients, advancedSearchPatients } from './patientSearch.js';

export { getPatientStatistics, getPatientsNeedingFollowUp } from './patientStats.js';

export default {
  getAllPatients: (await import('./patientCrud.js')).getAllPatients,
  getPatientById: (await import('./patientCrud.js')).getPatientById,
  createPatient: (await import('./patientCrud.js')).createPatient,
  updatePatient: (await import('./patientCrud.js')).updatePatient,
  deletePatient: (await import('./patientCrud.js')).deletePatient,
  searchPatients: (await import('./patientSearch.js')).searchPatients,
  advancedSearchPatients: (await import('./patientSearch.js')).advancedSearchPatients,
  getPatientStatistics: (await import('./patientStats.js')).getPatientStatistics,
  getPatientsNeedingFollowUp: (await import('./patientStats.js')).getPatientsNeedingFollowUp,
  getActiveContactsForExport: (await import('./patientCrud.js')).getActiveContactsForExport,
};
