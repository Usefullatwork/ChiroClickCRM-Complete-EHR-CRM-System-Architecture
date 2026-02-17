/**
 * FHIR R4 API Routes
 * RESTful endpoints for FHIR resource access
 */

import express from 'express';
import * as fhirController from '../controllers/fhir.js';
import { requireAuth } from '../middleware/auth.js';
import validate from '../middleware/validation.js';
import {
  getPatientSchema,
  searchPatientsSchema,
  getEncounterSchema,
  searchEncountersSchema,
  getConditionSchema,
  searchConditionsSchema,
  getObservationSchema,
  searchObservationsSchema,
  getPatientEverythingSchema,
  exportPatientSchema,
} from '../validators/fhir.validators.js';

const router = express.Router();

// ============================================================================
// CAPABILITY STATEMENT (Metadata)
// ============================================================================

/**
 * GET /fhir/metadata
 * Returns FHIR CapabilityStatement
 */
router.get('/metadata', fhirController.getCapabilityStatement);

// ============================================================================
// PATIENT RESOURCES
// ============================================================================

/**
 * GET /fhir/Patient/:id
 * Get patient as FHIR resource
 */
router.get('/Patient/:id', requireAuth, validate(getPatientSchema), fhirController.getPatient);

/**
 * GET /fhir/Patient
 * Search patients
 */
router.get('/Patient', requireAuth, validate(searchPatientsSchema), fhirController.searchPatients);

// ============================================================================
// ENCOUNTER RESOURCES
// ============================================================================

/**
 * GET /fhir/Encounter/:id
 * Get encounter as FHIR resource
 */
router.get(
  '/Encounter/:id',
  requireAuth,
  validate(getEncounterSchema),
  fhirController.getEncounter
);

/**
 * GET /fhir/Encounter
 * Search encounters
 */
router.get(
  '/Encounter',
  requireAuth,
  validate(searchEncountersSchema),
  fhirController.searchEncounters
);

// ============================================================================
// CONDITION RESOURCES (Diagnoses)
// ============================================================================

/**
 * GET /fhir/Condition/:id
 * Get condition as FHIR resource
 */
router.get(
  '/Condition/:id',
  requireAuth,
  validate(getConditionSchema),
  fhirController.getCondition
);

/**
 * GET /fhir/Condition
 * Search conditions
 */
router.get(
  '/Condition',
  requireAuth,
  validate(searchConditionsSchema),
  fhirController.searchConditions
);

// ============================================================================
// OBSERVATION RESOURCES (Measurements)
// ============================================================================

/**
 * GET /fhir/Observation/:id
 * Get observation as FHIR resource
 */
router.get(
  '/Observation/:id',
  requireAuth,
  validate(getObservationSchema),
  fhirController.getObservation
);

/**
 * GET /fhir/Observation
 * Search observations
 */
router.get(
  '/Observation',
  requireAuth,
  validate(searchObservationsSchema),
  fhirController.searchObservations
);

// ============================================================================
// BUNDLE OPERATIONS
// ============================================================================

/**
 * GET /fhir/Patient/:id/$everything
 * Get complete patient record as FHIR Bundle
 */
router.get(
  '/Patient/:id/\\$everything',
  requireAuth,
  validate(getPatientEverythingSchema),
  fhirController.getPatientEverything
);

/**
 * POST /fhir
 * Process FHIR Bundle (transaction)
 */
router.post('/', requireAuth, fhirController.processBundle);

// ============================================================================
// EXPORT OPERATIONS
// ============================================================================

/**
 * GET /fhir/export/patient/:id
 * Export patient data as FHIR Bundle (JSON or XML)
 */
router.get(
  '/export/patient/:id',
  requireAuth,
  validate(exportPatientSchema),
  fhirController.exportPatient
);

export default router;
