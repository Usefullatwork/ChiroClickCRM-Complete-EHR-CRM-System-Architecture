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
 * @swagger
 * /fhir/metadata:
 *   get:
 *     summary: Retrieve FHIR CapabilityStatement
 *     description: >
 *       Returns the server's FHIR R4 CapabilityStatement (conformance resource)
 *       describing supported resources, interactions, and search parameters.
 *       This endpoint is public and does not require authentication.
 *     tags: [FHIR]
 *     responses:
 *       200:
 *         description: FHIR CapabilityStatement resource
 *         content:
 *           application/fhir+json:
 *             schema:
 *               type: object
 *               properties:
 *                 resourceType:
 *                   type: string
 *                   example: CapabilityStatement
 *                 status:
 *                   type: string
 *                   example: active
 *                 fhirVersion:
 *                   type: string
 *                   example: "4.0.1"
 *       500:
 *         description: Internal server error
 */
router.get('/metadata', fhirController.getCapabilityStatement);

// ============================================================================
// PATIENT RESOURCES
// ============================================================================

/**
 * @swagger
 * /fhir/Patient/{id}:
 *   get:
 *     summary: Read a FHIR Patient resource by ID
 *     description: >
 *       Returns a single patient represented as a FHIR R4 Patient resource.
 *       The ID corresponds to the internal patient record.
 *     tags: [FHIR]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Internal patient UUID
 *     responses:
 *       200:
 *         description: FHIR Patient resource
 *         content:
 *           application/fhir+json:
 *             schema:
 *               type: object
 *               properties:
 *                 resourceType:
 *                   type: string
 *                   example: Patient
 *                 id:
 *                   type: string
 *       400:
 *         description: Invalid patient ID format
 *       401:
 *         description: Unauthorized - valid Bearer token required
 *       404:
 *         description: Patient not found
 *       500:
 *         description: Internal server error
 */
router.get('/Patient/:id', requireAuth, validate(getPatientSchema), fhirController.getPatient);

/**
 * @swagger
 * /fhir/Patient:
 *   get:
 *     summary: Search FHIR Patient resources
 *     description: >
 *       Searches for patients using FHIR R4 search parameters.
 *       Returns a FHIR Bundle of type searchset containing matching Patient resources.
 *     tags: [FHIR]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Patient name (family or given), supports partial match
 *       - in: query
 *         name: identifier
 *         schema:
 *           type: string
 *         description: Patient identifier (e.g. national ID or SolvIt ID), format system|value
 *       - in: query
 *         name: birthdate
 *         schema:
 *           type: string
 *           format: date
 *         description: Patient date of birth (YYYY-MM-DD)
 *       - in: query
 *         name: gender
 *         schema:
 *           type: string
 *           enum: [male, female, other, unknown]
 *         description: Administrative gender
 *       - in: query
 *         name: phone
 *         schema:
 *           type: string
 *         description: Patient phone number
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *           format: email
 *         description: Patient email address
 *       - in: query
 *         name: _count
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Maximum number of results to return
 *       - in: query
 *         name: _offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Offset for pagination
 *     responses:
 *       200:
 *         description: FHIR Bundle (searchset) of Patient resources
 *         content:
 *           application/fhir+json:
 *             schema:
 *               type: object
 *               properties:
 *                 resourceType:
 *                   type: string
 *                   example: Bundle
 *                 type:
 *                   type: string
 *                   example: searchset
 *                 total:
 *                   type: integer
 *                 entry:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Invalid search parameters
 *       401:
 *         description: Unauthorized - valid Bearer token required
 *       500:
 *         description: Internal server error
 */
router.get('/Patient', requireAuth, validate(searchPatientsSchema), fhirController.searchPatients);

// ============================================================================
// ENCOUNTER RESOURCES
// ============================================================================

/**
 * @swagger
 * /fhir/Encounter/{id}:
 *   get:
 *     summary: Read a FHIR Encounter resource by ID
 *     description: >
 *       Returns a single clinical encounter represented as a FHIR R4 Encounter resource.
 *       Encounters correspond to clinical consultation records.
 *     tags: [FHIR]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Internal encounter UUID
 *     responses:
 *       200:
 *         description: FHIR Encounter resource
 *         content:
 *           application/fhir+json:
 *             schema:
 *               type: object
 *               properties:
 *                 resourceType:
 *                   type: string
 *                   example: Encounter
 *                 id:
 *                   type: string
 *       400:
 *         description: Invalid encounter ID format
 *       401:
 *         description: Unauthorized - valid Bearer token required
 *       404:
 *         description: Encounter not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/Encounter/:id',
  requireAuth,
  validate(getEncounterSchema),
  fhirController.getEncounter
);

/**
 * @swagger
 * /fhir/Encounter:
 *   get:
 *     summary: Search FHIR Encounter resources
 *     description: >
 *       Searches for encounters using FHIR R4 search parameters.
 *       Returns a FHIR Bundle of type searchset containing matching Encounter resources.
 *     tags: [FHIR]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: patient
 *         schema:
 *           type: string
 *         description: >
 *           Reference to the patient (e.g. Patient/{id}). Filters encounters
 *           belonging to the specified patient.
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *         description: >
 *           Encounter date filter. Supports FHIR date modifiers (eq, lt, gt, ge, le),
 *           e.g. ge2024-01-01 or eq2024-06-15.
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [planned, arrived, triaged, in-progress, onleave, finished, cancelled]
 *         description: Encounter status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Encounter type code
 *       - in: query
 *         name: _count
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Maximum number of results to return
 *       - in: query
 *         name: _offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Offset for pagination
 *     responses:
 *       200:
 *         description: FHIR Bundle (searchset) of Encounter resources
 *         content:
 *           application/fhir+json:
 *             schema:
 *               type: object
 *               properties:
 *                 resourceType:
 *                   type: string
 *                   example: Bundle
 *                 type:
 *                   type: string
 *                   example: searchset
 *                 total:
 *                   type: integer
 *                 entry:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Invalid search parameters
 *       401:
 *         description: Unauthorized - valid Bearer token required
 *       500:
 *         description: Internal server error
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
 * @swagger
 * /fhir/Condition/{id}:
 *   get:
 *     summary: Read a FHIR Condition resource by ID
 *     description: >
 *       Returns a single diagnosis/condition represented as a FHIR R4 Condition resource.
 *       Conditions correspond to ICD-10 diagnoses recorded during encounters.
 *     tags: [FHIR]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Internal condition UUID
 *     responses:
 *       200:
 *         description: FHIR Condition resource
 *         content:
 *           application/fhir+json:
 *             schema:
 *               type: object
 *               properties:
 *                 resourceType:
 *                   type: string
 *                   example: Condition
 *                 id:
 *                   type: string
 *       400:
 *         description: Invalid condition ID format
 *       401:
 *         description: Unauthorized - valid Bearer token required
 *       404:
 *         description: Condition not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/Condition/:id',
  requireAuth,
  validate(getConditionSchema),
  fhirController.getCondition
);

/**
 * @swagger
 * /fhir/Condition:
 *   get:
 *     summary: Search FHIR Condition resources
 *     description: >
 *       Searches for conditions (diagnoses) using FHIR R4 search parameters.
 *       Returns a FHIR Bundle of type searchset containing matching Condition resources.
 *     tags: [FHIR]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: patient
 *         schema:
 *           type: string
 *         description: >
 *           Reference to the patient (e.g. Patient/{id}). Filters conditions
 *           belonging to the specified patient.
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         description: Condition code (ICD-10 or SNOMED CT), format system|code
 *       - in: query
 *         name: clinical-status
 *         schema:
 *           type: string
 *           enum: [active, recurrence, relapse, inactive, remission, resolved]
 *         description: Clinical status of the condition
 *       - in: query
 *         name: onset-date
 *         schema:
 *           type: string
 *         description: Date of condition onset, supports FHIR date modifiers (eq, lt, gt, ge, le)
 *       - in: query
 *         name: encounter
 *         schema:
 *           type: string
 *         description: Reference to the encounter in which the condition was diagnosed
 *       - in: query
 *         name: _count
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Maximum number of results to return
 *       - in: query
 *         name: _offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Offset for pagination
 *     responses:
 *       200:
 *         description: FHIR Bundle (searchset) of Condition resources
 *         content:
 *           application/fhir+json:
 *             schema:
 *               type: object
 *               properties:
 *                 resourceType:
 *                   type: string
 *                   example: Bundle
 *                 type:
 *                   type: string
 *                   example: searchset
 *                 total:
 *                   type: integer
 *                 entry:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Invalid search parameters
 *       401:
 *         description: Unauthorized - valid Bearer token required
 *       500:
 *         description: Internal server error
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
 * @swagger
 * /fhir/Observation/{id}:
 *   get:
 *     summary: Read a FHIR Observation resource by ID
 *     description: >
 *       Returns a single clinical measurement or assessment represented as a FHIR R4
 *       Observation resource. Observations include vital signs, ROM measurements,
 *       orthopedic/neurological test results, and outcome scores.
 *     tags: [FHIR]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Internal observation UUID
 *     responses:
 *       200:
 *         description: FHIR Observation resource
 *         content:
 *           application/fhir+json:
 *             schema:
 *               type: object
 *               properties:
 *                 resourceType:
 *                   type: string
 *                   example: Observation
 *                 id:
 *                   type: string
 *       400:
 *         description: Invalid observation ID format
 *       401:
 *         description: Unauthorized - valid Bearer token required
 *       404:
 *         description: Observation not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/Observation/:id',
  requireAuth,
  validate(getObservationSchema),
  fhirController.getObservation
);

/**
 * @swagger
 * /fhir/Observation:
 *   get:
 *     summary: Search FHIR Observation resources
 *     description: >
 *       Searches for observations (measurements and assessments) using FHIR R4 search parameters.
 *       Returns a FHIR Bundle of type searchset containing matching Observation resources.
 *     tags: [FHIR]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: patient
 *         schema:
 *           type: string
 *         description: >
 *           Reference to the patient (e.g. Patient/{id}). Filters observations
 *           belonging to the specified patient.
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         description: Observation code (LOINC or SNOMED CT), format system|code
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *         description: Observation date, supports FHIR date modifiers (eq, lt, gt, ge, le)
 *       - in: query
 *         name: encounter
 *         schema:
 *           type: string
 *         description: Reference to the encounter in which the observation was recorded
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [vital-signs, laboratory, imaging, exam, survey, procedure, therapy, activity]
 *         description: Observation category
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [registered, preliminary, final, amended, corrected, cancelled, entered-in-error]
 *         description: Observation status
 *       - in: query
 *         name: _count
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Maximum number of results to return
 *       - in: query
 *         name: _offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Offset for pagination
 *     responses:
 *       200:
 *         description: FHIR Bundle (searchset) of Observation resources
 *         content:
 *           application/fhir+json:
 *             schema:
 *               type: object
 *               properties:
 *                 resourceType:
 *                   type: string
 *                   example: Bundle
 *                 type:
 *                   type: string
 *                   example: searchset
 *                 total:
 *                   type: integer
 *                 entry:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Invalid search parameters
 *       401:
 *         description: Unauthorized - valid Bearer token required
 *       500:
 *         description: Internal server error
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
 * @swagger
 * /fhir/Patient/{id}/$everything:
 *   get:
 *     summary: Retrieve complete patient record as a FHIR Bundle
 *     description: >
 *       Implements the FHIR $everything operation for Patient resources.
 *       Returns a FHIR Bundle (type: searchset) containing the Patient resource
 *       along with all associated resources: Encounters, Conditions, Observations,
 *       and other clinical data. Useful for data export and care continuity.
 *     tags: [FHIR]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Internal patient UUID
 *       - in: query
 *         name: start
 *         schema:
 *           type: string
 *           format: date
 *         description: >
 *           Only include resources with a date on or after this date (YYYY-MM-DD).
 *           Applies to Encounters, Observations, and Conditions.
 *       - in: query
 *         name: end
 *         schema:
 *           type: string
 *           format: date
 *         description: >
 *           Only include resources with a date on or before this date (YYYY-MM-DD).
 *       - in: query
 *         name: _count
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Maximum number of resources to include in the Bundle
 *     responses:
 *       200:
 *         description: FHIR Bundle containing all patient resources
 *         content:
 *           application/fhir+json:
 *             schema:
 *               type: object
 *               properties:
 *                 resourceType:
 *                   type: string
 *                   example: Bundle
 *                 type:
 *                   type: string
 *                   example: searchset
 *                 total:
 *                   type: integer
 *                 entry:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Invalid patient ID or query parameters
 *       401:
 *         description: Unauthorized - valid Bearer token required
 *       404:
 *         description: Patient not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/Patient/:id/\\$everything',
  requireAuth,
  validate(getPatientEverythingSchema),
  fhirController.getPatientEverything
);

/**
 * @swagger
 * /fhir:
 *   post:
 *     summary: Process a FHIR transaction or batch Bundle
 *     description: >
 *       Accepts a FHIR Bundle of type 'transaction' or 'batch' and processes the
 *       contained requests atomically (transaction) or individually (batch).
 *       Returns a FHIR Bundle of type 'transaction-response' or 'batch-response'
 *       with the result of each entry.
 *     tags: [FHIR]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/fhir+json:
 *           schema:
 *             type: object
 *             required:
 *               - resourceType
 *               - type
 *               - entry
 *             properties:
 *               resourceType:
 *                 type: string
 *                 example: Bundle
 *               type:
 *                 type: string
 *                 enum: [transaction, batch]
 *                 description: Bundle type - transaction for atomic processing, batch for individual
 *               entry:
 *                 type: array
 *                 description: Array of FHIR resources and request metadata
 *                 items:
 *                   type: object
 *                   properties:
 *                     resource:
 *                       type: object
 *                       description: The FHIR resource to process
 *                     request:
 *                       type: object
 *                       properties:
 *                         method:
 *                           type: string
 *                           enum: [GET, POST, PUT, DELETE]
 *                         url:
 *                           type: string
 *     responses:
 *       200:
 *         description: FHIR Bundle response with per-entry results
 *         content:
 *           application/fhir+json:
 *             schema:
 *               type: object
 *               properties:
 *                 resourceType:
 *                   type: string
 *                   example: Bundle
 *                 type:
 *                   type: string
 *                   example: transaction-response
 *                 entry:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Invalid Bundle format or unsupported resource types
 *       401:
 *         description: Unauthorized - valid Bearer token required
 *       422:
 *         description: Unprocessable entity - validation errors in Bundle entries
 *       500:
 *         description: Internal server error
 */
router.post('/', requireAuth, fhirController.processBundle);

// ============================================================================
// EXPORT OPERATIONS
// ============================================================================

/**
 * @swagger
 * /fhir/export/patient/{id}:
 *   get:
 *     summary: Export complete patient data as a FHIR Bundle
 *     description: >
 *       Exports a patient's complete clinical record as a FHIR R4 Bundle.
 *       Supports both JSON (application/fhir+json) and XML (application/fhir+xml)
 *       output formats via the _format query parameter or Accept header.
 *       The exported Bundle includes Patient demographics, all Encounters,
 *       Conditions, and Observations.
 *     tags: [FHIR]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Internal patient UUID
 *       - in: query
 *         name: _format
 *         schema:
 *           type: string
 *           enum: [json, xml, application/fhir+json, application/fhir+xml]
 *           default: json
 *         description: >
 *           Output format for the exported Bundle. Defaults to JSON.
 *           Can also be controlled via the Accept request header.
 *       - in: query
 *         name: start
 *         schema:
 *           type: string
 *           format: date
 *         description: >
 *           Only include clinical data on or after this date (YYYY-MM-DD).
 *       - in: query
 *         name: end
 *         schema:
 *           type: string
 *           format: date
 *         description: >
 *           Only include clinical data on or before this date (YYYY-MM-DD).
 *     responses:
 *       200:
 *         description: Exported FHIR Bundle in the requested format
 *         content:
 *           application/fhir+json:
 *             schema:
 *               type: object
 *               properties:
 *                 resourceType:
 *                   type: string
 *                   example: Bundle
 *                 type:
 *                   type: string
 *                   example: collection
 *                 entry:
 *                   type: array
 *                   items:
 *                     type: object
 *           application/fhir+xml:
 *             schema:
 *               type: string
 *               description: FHIR Bundle serialised as XML
 *       400:
 *         description: Invalid patient ID or query parameters
 *       401:
 *         description: Unauthorized - valid Bearer token required
 *       404:
 *         description: Patient not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/export/patient/:id',
  requireAuth,
  validate(exportPatientSchema),
  fhirController.exportPatient
);

export default router;
