/**
 * FHIR R4 API Routes
 * RESTful endpoints for FHIR resource access
 */

import express from 'express';
import * as fhirController from '../controllers/fhir.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

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
router.get('/Patient/:id', requireAuth, fhirController.getPatient);

/**
 * GET /fhir/Patient
 * Search patients
 */
router.get('/Patient', requireAuth, fhirController.searchPatients);

// ============================================================================
// ENCOUNTER RESOURCES
// ============================================================================

/**
 * GET /fhir/Encounter/:id
 * Get encounter as FHIR resource
 */
router.get('/Encounter/:id', requireAuth, fhirController.getEncounter);

/**
 * GET /fhir/Encounter
 * Search encounters
 */
router.get('/Encounter', requireAuth, fhirController.searchEncounters);

// ============================================================================
// CONDITION RESOURCES (Diagnoses)
// ============================================================================

/**
 * GET /fhir/Condition/:id
 * Get condition as FHIR resource
 */
router.get('/Condition/:id', requireAuth, fhirController.getCondition);

/**
 * GET /fhir/Condition
 * Search conditions
 */
router.get('/Condition', requireAuth, fhirController.searchConditions);

// ============================================================================
// OBSERVATION RESOURCES (Measurements)
// ============================================================================

/**
 * GET /fhir/Observation/:id
 * Get observation as FHIR resource
 */
router.get('/Observation/:id', requireAuth, fhirController.getObservation);

/**
 * GET /fhir/Observation
 * Search observations
 */
router.get('/Observation', requireAuth, fhirController.searchObservations);

// ============================================================================
// BUNDLE OPERATIONS
// ============================================================================

/**
 * GET /fhir/Patient/:id/$everything
 * Get complete patient record as FHIR Bundle
 */
router.get('/Patient/:id/\\$everything', requireAuth, fhirController.getPatientEverything);

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
router.get('/export/patient/:id', requireAuth, fhirController.exportPatient);

export default router;
