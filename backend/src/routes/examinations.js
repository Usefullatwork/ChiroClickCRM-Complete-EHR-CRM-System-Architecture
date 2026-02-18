/**
 * Structured Examination Routes
 * API endpoints for examination protocols and findings management
 */

import express from 'express';
import * as examinationController from '../controllers/examinations.js';
import { authenticate } from '../middleware/auth.js';
import validate from '../middleware/validation.js';
import {
  searchProtocolsSchema,
  getProtocolsByRegionSchema,
  getProtocolsByCategorySchema,
  getProtocolByIdSchema,
  getFindingsByEncounterSchema,
  getFindingByIdSchema,
  createFindingSchema,
  updateFindingSchema,
  deleteFindingSchema,
  createBatchFindingsSchema,
  getSummarySchema,
  getRedFlagsSchema,
  getTemplateSetByIdSchema,
  getTemplateSetsByComplaintSchema,
  createTemplateSetSchema,
  incrementUsageSchema,
} from '../validators/examination.validators.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// ============================================================================
// EXAMINATION PROTOCOLS
// ============================================================================

/**
 * @swagger
 * /examinations/protocols/body-regions:
 *   get:
 *     summary: Get all available body regions for examination protocols
 *     tags: [Examinations]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of body regions returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["cervical", "thoracic", "lumbar", "shoulder", "hip", "knee"]
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       500:
 *         description: Internal server error
 */
// GET /api/v1/examinations/protocols/body-regions
router.get('/protocols/body-regions', examinationController.getBodyRegions);

/**
 * @swagger
 * /examinations/protocols/categories:
 *   get:
 *     summary: Get all available categories for examination protocols
 *     tags: [Examinations]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of protocol categories returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["orthopedic", "neurological", "range-of-motion", "muscle-strength", "special-tests"]
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       500:
 *         description: Internal server error
 */
// GET /api/v1/examinations/protocols/categories
router.get('/protocols/categories', examinationController.getCategories);

/**
 * @swagger
 * /examinations/protocols/search:
 *   get:
 *     summary: Search examination protocols by keyword, body region, or category
 *     tags: [Examinations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *           maxLength: 200
 *         description: Keyword search query for protocol name or description
 *       - in: query
 *         name: bodyRegion
 *         schema:
 *           type: string
 *           maxLength: 50
 *         description: Filter protocols by body region (e.g. cervical, lumbar)
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           maxLength: 50
 *         description: Filter protocols by category (e.g. orthopedic, neurological)
 *     responses:
 *       200:
 *         description: Matching protocols returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ExaminationProtocol'
 *       400:
 *         description: Invalid query parameters
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       500:
 *         description: Internal server error
 */
// GET /api/v1/examinations/protocols/search
router.get(
  '/protocols/search',
  validate(searchProtocolsSchema),
  examinationController.searchProtocols
);

/**
 * @swagger
 * /examinations/protocols/by-region/{region}:
 *   get:
 *     summary: Get all examination protocols for a specific body region
 *     tags: [Examinations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: region
 *         required: true
 *         schema:
 *           type: string
 *           maxLength: 50
 *         description: Body region identifier (e.g. cervical, lumbar, shoulder)
 *     responses:
 *       200:
 *         description: Protocols for the specified region returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ExaminationProtocol'
 *       400:
 *         description: Invalid region parameter
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       404:
 *         description: No protocols found for the specified region
 *       500:
 *         description: Internal server error
 */
// GET /api/v1/examinations/protocols/by-region/:region
router.get(
  '/protocols/by-region/:region',
  validate(getProtocolsByRegionSchema),
  examinationController.getProtocolsByRegion
);

/**
 * @swagger
 * /examinations/protocols/by-category/{category}:
 *   get:
 *     summary: Get all examination protocols within a specific category
 *     tags: [Examinations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *           maxLength: 50
 *         description: Protocol category (e.g. orthopedic, neurological, range-of-motion)
 *     responses:
 *       200:
 *         description: Protocols for the specified category returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ExaminationProtocol'
 *       400:
 *         description: Invalid category parameter
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       404:
 *         description: No protocols found for the specified category
 *       500:
 *         description: Internal server error
 */
// GET /api/v1/examinations/protocols/by-category/:category
router.get(
  '/protocols/by-category/:category',
  validate(getProtocolsByCategorySchema),
  examinationController.getProtocolsByCategory
);

/**
 * @swagger
 * /examinations/protocols:
 *   get:
 *     summary: Get all examination protocols
 *     tags: [Examinations]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Full list of examination protocols returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ExaminationProtocol'
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       500:
 *         description: Internal server error
 */
// GET /api/v1/examinations/protocols
router.get('/protocols', examinationController.getAllProtocols);

/**
 * @swagger
 * /examinations/protocols/{id}:
 *   get:
 *     summary: Get a single examination protocol by ID
 *     tags: [Examinations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the examination protocol
 *     responses:
 *       200:
 *         description: Examination protocol returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ExaminationProtocol'
 *       400:
 *         description: Invalid UUID format
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       404:
 *         description: Protocol not found
 *       500:
 *         description: Internal server error
 */
// GET /api/v1/examinations/protocols/:id
router.get(
  '/protocols/:id',
  validate(getProtocolByIdSchema),
  examinationController.getProtocolById
);

// ============================================================================
// EXAMINATION FINDINGS
// ============================================================================

/**
 * @swagger
 * /examinations/findings/encounter/{encounterId}:
 *   get:
 *     summary: Get all examination findings for a specific clinical encounter
 *     tags: [Examinations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: encounterId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the clinical encounter
 *     responses:
 *       200:
 *         description: Examination findings for the encounter returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ExaminationFinding'
 *       400:
 *         description: Invalid encounter UUID format
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       404:
 *         description: Encounter not found
 *       500:
 *         description: Internal server error
 */
// GET /api/v1/examinations/findings/encounter/:encounterId
router.get(
  '/findings/encounter/:encounterId',
  validate(getFindingsByEncounterSchema),
  examinationController.getFindingsByEncounter
);

/**
 * @swagger
 * /examinations/findings/{id}:
 *   get:
 *     summary: Get a single examination finding by ID
 *     tags: [Examinations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the examination finding
 *     responses:
 *       200:
 *         description: Examination finding returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ExaminationFinding'
 *       400:
 *         description: Invalid UUID format
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       404:
 *         description: Finding not found
 *       500:
 *         description: Internal server error
 */
// GET /api/v1/examinations/findings/:id
router.get('/findings/:id', validate(getFindingByIdSchema), examinationController.getFindingById);

/**
 * @swagger
 * /examinations/findings:
 *   post:
 *     summary: Create a new examination finding for a clinical encounter
 *     tags: [Examinations]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - encounterId
 *               - testName
 *               - result
 *             properties:
 *               encounterId:
 *                 type: string
 *                 format: uuid
 *                 description: UUID of the clinical encounter this finding belongs to
 *               protocolId:
 *                 type: string
 *                 format: uuid
 *                 description: Optional UUID of the examination protocol used
 *               testName:
 *                 type: string
 *                 maxLength: 255
 *                 description: Name of the clinical test performed (e.g. Spurling, SLR)
 *               bodyRegion:
 *                 type: string
 *                 maxLength: 50
 *                 description: Body region examined (e.g. cervical, lumbar)
 *               side:
 *                 type: string
 *                 enum: [left, right, bilateral, midline]
 *                 description: Side of the body tested
 *               result:
 *                 type: string
 *                 maxLength: 50
 *                 description: Outcome of the test (e.g. positive, negative, 4/5)
 *               value:
 *                 oneOf:
 *                   - type: string
 *                   - type: number
 *                 description: Numeric or string measurement value (e.g. 45 for ROM in degrees)
 *               unit:
 *                 type: string
 *                 maxLength: 20
 *                 description: Unit of the measured value (e.g. degrees, kg)
 *               notes:
 *                 type: string
 *                 maxLength: 2000
 *                 description: Free-text clinical notes about this finding
 *               isRedFlag:
 *                 type: boolean
 *                 default: false
 *                 description: Whether this finding constitutes a clinical red flag
 *     responses:
 *       201:
 *         description: Examination finding created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ExaminationFinding'
 *       400:
 *         description: Validation error - missing required fields or invalid values
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       500:
 *         description: Internal server error
 */
// POST /api/v1/examinations/findings
router.post('/findings', validate(createFindingSchema), examinationController.createFinding);

/**
 * @swagger
 * /examinations/findings/{id}:
 *   patch:
 *     summary: Update an existing examination finding
 *     tags: [Examinations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the examination finding to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             minProperties: 1
 *             properties:
 *               result:
 *                 type: string
 *                 maxLength: 50
 *                 description: Updated test result
 *               value:
 *                 oneOf:
 *                   - type: string
 *                   - type: number
 *                 description: Updated measurement value
 *               unit:
 *                 type: string
 *                 maxLength: 20
 *                 description: Updated unit of measurement
 *               notes:
 *                 type: string
 *                 maxLength: 2000
 *                 description: Updated clinical notes
 *               isRedFlag:
 *                 type: boolean
 *                 description: Updated red flag status
 *     responses:
 *       200:
 *         description: Examination finding updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ExaminationFinding'
 *       400:
 *         description: Validation error - invalid UUID or empty update body
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       404:
 *         description: Finding not found
 *       500:
 *         description: Internal server error
 */
// PATCH /api/v1/examinations/findings/:id
router.patch('/findings/:id', validate(updateFindingSchema), examinationController.updateFinding);

/**
 * @swagger
 * /examinations/findings/{id}:
 *   delete:
 *     summary: Delete an examination finding by ID
 *     tags: [Examinations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the examination finding to delete
 *     responses:
 *       200:
 *         description: Examination finding deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Finding deleted successfully
 *       400:
 *         description: Invalid UUID format
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       404:
 *         description: Finding not found
 *       500:
 *         description: Internal server error
 */
// DELETE /api/v1/examinations/findings/:id
router.delete('/findings/:id', validate(deleteFindingSchema), examinationController.deleteFinding);

/**
 * @swagger
 * /examinations/findings/batch:
 *   post:
 *     summary: Create multiple examination findings for an encounter in a single request
 *     tags: [Examinations]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - encounterId
 *               - findings
 *             properties:
 *               encounterId:
 *                 type: string
 *                 format: uuid
 *                 description: UUID of the clinical encounter all findings belong to
 *               findings:
 *                 type: array
 *                 minItems: 1
 *                 description: Array of findings to create; minimum 1 item required
 *                 items:
 *                   type: object
 *                   required:
 *                     - testName
 *                     - result
 *                   properties:
 *                     protocolId:
 *                       type: string
 *                       format: uuid
 *                       description: Optional UUID of the examination protocol used
 *                     testName:
 *                       type: string
 *                       maxLength: 255
 *                       description: Name of the clinical test performed
 *                     bodyRegion:
 *                       type: string
 *                       maxLength: 50
 *                       description: Body region examined
 *                     side:
 *                       type: string
 *                       enum: [left, right, bilateral, midline]
 *                       description: Side of the body tested
 *                     result:
 *                       type: string
 *                       maxLength: 50
 *                       description: Outcome of the test
 *                     value:
 *                       oneOf:
 *                         - type: string
 *                         - type: number
 *                       description: Measurement value
 *                     unit:
 *                       type: string
 *                       maxLength: 20
 *                       description: Unit of the measured value
 *                     notes:
 *                       type: string
 *                       maxLength: 2000
 *                       description: Free-text clinical notes
 *                     isRedFlag:
 *                       type: boolean
 *                       default: false
 *                       description: Whether this finding is a clinical red flag
 *     responses:
 *       201:
 *         description: All examination findings created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ExaminationFinding'
 *       400:
 *         description: Validation error - invalid encounter UUID or malformed findings array
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       500:
 *         description: Internal server error
 */
// POST /api/v1/examinations/findings/batch
router.post(
  '/findings/batch',
  validate(createBatchFindingsSchema),
  examinationController.createBatchFindings
);

// ============================================================================
// EXAMINATION SUMMARIES & RED FLAGS
// ============================================================================

/**
 * @swagger
 * /examinations/summary/{encounterId}:
 *   get:
 *     summary: Get a compiled examination summary for a clinical encounter
 *     tags: [Examinations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: encounterId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the clinical encounter to summarise
 *     responses:
 *       200:
 *         description: Examination summary returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     encounterId:
 *                       type: string
 *                       format: uuid
 *                     totalFindings:
 *                       type: integer
 *                     positiveTests:
 *                       type: integer
 *                     negativeTests:
 *                       type: integer
 *                     redFlagCount:
 *                       type: integer
 *                     findingsByRegion:
 *                       type: object
 *                       additionalProperties:
 *                         type: array
 *                         items:
 *                           $ref: '#/components/schemas/ExaminationFinding'
 *       400:
 *         description: Invalid encounter UUID format
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       404:
 *         description: Encounter not found
 *       500:
 *         description: Internal server error
 */
// GET /api/v1/examinations/summary/:encounterId
router.get(
  '/summary/:encounterId',
  validate(getSummarySchema),
  examinationController.getExaminationSummary
);

/**
 * @swagger
 * /examinations/red-flags/{encounterId}:
 *   get:
 *     summary: Get all red-flag examination findings for a clinical encounter
 *     tags: [Examinations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: encounterId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the clinical encounter to check for red flags
 *     responses:
 *       200:
 *         description: Red-flag findings returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ExaminationFinding'
 *       400:
 *         description: Invalid encounter UUID format
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       404:
 *         description: Encounter not found
 *       500:
 *         description: Internal server error
 */
// GET /api/v1/examinations/red-flags/:encounterId
router.get(
  '/red-flags/:encounterId',
  validate(getRedFlagsSchema),
  examinationController.getRedFlags
);

// ============================================================================
// EXAMINATION TEMPLATE SETS
// ============================================================================

/**
 * @swagger
 * /examinations/template-sets:
 *   get:
 *     summary: Get all examination template sets
 *     tags: [Examinations]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Full list of template sets returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ExaminationTemplateSet'
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       500:
 *         description: Internal server error
 */
// GET /api/v1/examinations/template-sets
router.get('/template-sets', examinationController.getAllTemplateSets);

/**
 * @swagger
 * /examinations/template-sets/by-complaint/{complaint}:
 *   get:
 *     summary: Get all examination template sets associated with a chief complaint
 *     tags: [Examinations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: complaint
 *         required: true
 *         schema:
 *           type: string
 *           maxLength: 100
 *         description: Chief complaint to filter template sets by (e.g. low-back-pain, neck-pain)
 *     responses:
 *       200:
 *         description: Template sets for the specified complaint returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ExaminationTemplateSet'
 *       400:
 *         description: Invalid complaint parameter
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       404:
 *         description: No template sets found for the specified complaint
 *       500:
 *         description: Internal server error
 */
// GET /api/v1/examinations/template-sets/by-complaint/:complaint
router.get(
  '/template-sets/by-complaint/:complaint',
  validate(getTemplateSetsByComplaintSchema),
  examinationController.getTemplateSetsByComplaint
);

/**
 * @swagger
 * /examinations/template-sets/{id}:
 *   get:
 *     summary: Get a single examination template set by ID
 *     tags: [Examinations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the examination template set
 *     responses:
 *       200:
 *         description: Template set returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ExaminationTemplateSet'
 *       400:
 *         description: Invalid UUID format
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       404:
 *         description: Template set not found
 *       500:
 *         description: Internal server error
 */
// GET /api/v1/examinations/template-sets/:id
router.get(
  '/template-sets/:id',
  validate(getTemplateSetByIdSchema),
  examinationController.getTemplateSetById
);

/**
 * @swagger
 * /examinations/template-sets:
 *   post:
 *     summary: Create a new examination template set
 *     tags: [Examinations]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - protocols
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *                 description: Display name of the template set
 *               complaint:
 *                 type: string
 *                 maxLength: 100
 *                 description: Chief complaint this template set is designed for
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Optional description of the template set's clinical purpose
 *               protocols:
 *                 type: array
 *                 minItems: 1
 *                 description: Ordered list of protocols to include in this template set
 *                 items:
 *                   type: object
 *                   required:
 *                     - protocolId
 *                   properties:
 *                     protocolId:
 *                       type: string
 *                       format: uuid
 *                       description: UUID of the examination protocol to include
 *                     order:
 *                       type: integer
 *                       minimum: 0
 *                       description: Display order of this protocol within the set
 *     responses:
 *       201:
 *         description: Template set created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ExaminationTemplateSet'
 *       400:
 *         description: Validation error - missing required fields or invalid protocol UUIDs
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       500:
 *         description: Internal server error
 */
// POST /api/v1/examinations/template-sets
router.post(
  '/template-sets',
  validate(createTemplateSetSchema),
  examinationController.createTemplateSet
);

/**
 * @swagger
 * /examinations/template-sets/{id}/use:
 *   post:
 *     summary: Increment the usage counter for an examination template set
 *     description: Records that a practitioner applied this template set during an encounter. Used to surface frequently used sets.
 *     tags: [Examinations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the examination template set to record usage for
 *     responses:
 *       200:
 *         description: Usage counter incremented successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     usageCount:
 *                       type: integer
 *                       description: Updated total usage count
 *       400:
 *         description: Invalid UUID format
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       404:
 *         description: Template set not found
 *       500:
 *         description: Internal server error
 */
// POST /api/v1/examinations/template-sets/:id/use
router.post(
  '/template-sets/:id/use',
  validate(incrementUsageSchema),
  examinationController.incrementTemplateSetUsage
);

export default router;
