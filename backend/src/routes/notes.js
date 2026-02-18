/**
 * Clinical Notes Routes
 * API endpoints for SOAP documentation and clinical notes
 */

import express from 'express';
import * as clinicalNotesService from '../services/clinicalNotes.js';
import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js';
import { validate as validateNote } from '../services/noteValidator.js';
import validate from '../middleware/validation.js';
import {
  listNotesSchema,
  getTemplatesSchema,
  searchNotesSchema,
  getPatientNotesSchema,
  getNoteByIdSchema,
  createNoteSchema,
  updateNoteSchema,
  validateNoteSchema,
  autosaveNoteSchema,
  signNoteSchema,
  generateNoteSchema,
  amendNoteSchema,
  deleteNoteSchema,
} from '../validators/note.validators.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Apply authentication and organization middleware to all routes
router.use(requireAuth);
router.use(requireOrganization);

/**
 * @swagger
 * /notes/validate:
 *   post:
 *     summary: Validate SOAP note data without saving
 *     description: Validates the structure and content of SOAP note data for a given encounter type without persisting it to the database.
 *     tags:
 *       - Clinical Notes
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               encounterType:
 *                 type: string
 *                 description: The type of encounter (e.g. SOAP). Defaults to SOAP if omitted.
 *                 example: SOAP
 *               subjective:
 *                 type: string
 *                 description: Subjective section of the SOAP note.
 *               objective:
 *                 type: string
 *                 description: Objective section of the SOAP note.
 *               assessment:
 *                 type: string
 *                 description: Assessment section of the SOAP note.
 *               plan:
 *                 type: string
 *                 description: Plan section of the SOAP note.
 *     responses:
 *       200:
 *         description: Validation result returned successfully.
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
 *                   description: Validation details including any errors or warnings.
 *       400:
 *         description: Invalid request body.
 *       401:
 *         description: Unauthorized. Valid Bearer token required.
 *       500:
 *         description: Internal server error while validating note data.
 */
router.post(
  '/validate',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(validateNoteSchema),
  async (req, res) => {
    try {
      const { encounterType, ...soapData } = req.body;
      const validation = validateNote(soapData, encounterType || 'SOAP');

      res.json({
        success: true,
        data: validation,
      });
    } catch (error) {
      logger.error('Error validating note data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to validate note data',
        error: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /notes:
 *   get:
 *     summary: Get all clinical notes with filters
 *     description: Returns a paginated list of all clinical notes for the organization, with optional filtering by patient, practitioner, date range, type, status, and search query.
 *     tags:
 *       - Clinical Notes
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of results per page.
 *       - in: query
 *         name: patientId
 *         schema:
 *           type: string
 *         description: Filter by patient UUID.
 *       - in: query
 *         name: practitionerId
 *         schema:
 *           type: string
 *         description: Filter by practitioner UUID.
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter notes on or after this date (ISO 8601).
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter notes on or before this date (ISO 8601).
 *       - in: query
 *         name: noteType
 *         schema:
 *           type: string
 *         description: Filter by note type.
 *       - in: query
 *         name: templateType
 *         schema:
 *           type: string
 *         description: Filter by template type.
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by note status.
 *       - in: query
 *         name: isDraft
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filter by draft status. Omit to return all.
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Full-text search query.
 *     responses:
 *       200:
 *         description: List of clinical notes returned successfully.
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
 *                     type: object
 *                 pagination:
 *                   type: object
 *                   description: Pagination metadata (page, limit, total, totalPages).
 *       401:
 *         description: Unauthorized. Valid Bearer token required.
 *       500:
 *         description: Internal server error while retrieving clinical notes.
 */
router.get(
  '/',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(listNotesSchema),
  async (req, res) => {
    try {
      const result = await clinicalNotesService.getAllNotes(req.organizationId, {
        page: req.query.page,
        limit: req.query.limit,
        patientId: req.query.patientId,
        practitionerId: req.query.practitionerId,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        noteType: req.query.noteType,
        templateType: req.query.templateType,
        status: req.query.status,
        isDraft: req.query.isDraft === 'true' ? true : req.query.isDraft === 'false' ? false : null,
        search: req.query.search,
      });

      res.json({
        success: true,
        data: result.notes,
        pagination: result.pagination,
      });
    } catch (error) {
      logger.error('Error getting clinical notes:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get clinical notes',
        error: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /notes/templates:
 *   get:
 *     summary: Get available note templates
 *     description: Returns all note templates available to the organization, with optional filtering by template type, category, and active status.
 *     tags:
 *       - Clinical Notes
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: templateType
 *         schema:
 *           type: string
 *         description: Filter by template type (e.g. SOAP, DAP).
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by template category.
 *       - in: query
 *         name: activeOnly
 *         schema:
 *           type: string
 *           enum: [true, false]
 *           default: "true"
 *         description: When set to false, includes inactive templates. Defaults to true.
 *     responses:
 *       200:
 *         description: List of note templates returned successfully.
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
 *                     type: object
 *       401:
 *         description: Unauthorized. Valid Bearer token required.
 *       500:
 *         description: Internal server error while retrieving note templates.
 */
router.get(
  '/templates',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(getTemplatesSchema),
  async (req, res) => {
    try {
      const templates = await clinicalNotesService.getNoteTemplates(req.organizationId, {
        templateType: req.query.templateType,
        category: req.query.category,
        activeOnly: req.query.activeOnly !== 'false',
      });

      res.json({
        success: true,
        data: templates,
      });
    } catch (error) {
      logger.error('Error getting note templates:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get note templates',
        error: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /notes/drafts:
 *   get:
 *     summary: Get current user's draft notes
 *     description: Returns all unsaved or in-progress draft clinical notes belonging to the authenticated user within the organization.
 *     tags:
 *       - Clinical Notes
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of draft notes returned successfully.
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
 *                     type: object
 *       401:
 *         description: Unauthorized. Valid Bearer token required.
 *       500:
 *         description: Internal server error while retrieving draft notes.
 */
router.get('/drafts', requireRole(['ADMIN', 'PRACTITIONER']), async (req, res) => {
  try {
    const drafts = await clinicalNotesService.getUserDrafts(req.organizationId, req.userId);

    res.json({
      success: true,
      data: drafts,
    });
  } catch (error) {
    logger.error('Error getting draft notes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get draft notes',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /notes/search:
 *   get:
 *     summary: Search clinical notes
 *     description: Performs a full-text search across clinical notes for the organization. Optionally scoped to a specific patient.
 *     tags:
 *       - Clinical Notes
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query string.
 *       - in: query
 *         name: patientId
 *         schema:
 *           type: string
 *         description: Restrict search to a specific patient UUID.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Maximum number of results to return.
 *     responses:
 *       200:
 *         description: Search results returned successfully.
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
 *                     type: object
 *       400:
 *         description: Missing or invalid query parameters.
 *       401:
 *         description: Unauthorized. Valid Bearer token required.
 *       500:
 *         description: Internal server error while searching notes.
 */
router.get(
  '/search',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(searchNotesSchema),
  async (req, res) => {
    try {
      const { q, patientId, limit } = req.query;

      const notes = await clinicalNotesService.searchNotes(req.organizationId, q, {
        patientId,
        limit: parseInt(limit) || 20,
      });

      res.json({
        success: true,
        data: notes,
      });
    } catch (error) {
      logger.error('Error searching notes:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search notes',
        error: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /notes/patient/{patientId}:
 *   get:
 *     summary: Get notes for a specific patient
 *     description: Returns clinical notes associated with a given patient. Optionally includes draft notes.
 *     tags:
 *       - Clinical Notes
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID of the patient whose notes to retrieve.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Maximum number of notes to return.
 *       - in: query
 *         name: includeDrafts
 *         schema:
 *           type: string
 *           enum: [true, false]
 *           default: "false"
 *         description: When true, includes draft notes in the response.
 *     responses:
 *       200:
 *         description: Patient notes returned successfully.
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
 *                     type: object
 *       401:
 *         description: Unauthorized. Valid Bearer token required.
 *       404:
 *         description: Patient not found.
 *       500:
 *         description: Internal server error while retrieving patient notes.
 */
router.get(
  '/patient/:patientId',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(getPatientNotesSchema),
  async (req, res) => {
    try {
      const notes = await clinicalNotesService.getPatientNotes(
        req.organizationId,
        req.params.patientId,
        {
          limit: parseInt(req.query.limit) || 20,
          includesDrafts: req.query.includeDrafts === 'true',
        }
      );

      res.json({
        success: true,
        data: notes,
      });
    } catch (error) {
      logger.error('Error getting patient notes:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get patient notes',
        error: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /notes/{id}:
 *   get:
 *     summary: Get clinical note by ID
 *     description: Returns a single clinical note identified by its UUID.
 *     tags:
 *       - Clinical Notes
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID of the clinical note to retrieve.
 *     responses:
 *       200:
 *         description: Clinical note returned successfully.
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
 *                   description: The clinical note object.
 *       401:
 *         description: Unauthorized. Valid Bearer token required.
 *       404:
 *         description: Clinical note not found.
 *       500:
 *         description: Internal server error while retrieving the clinical note.
 */
router.get(
  '/:id',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(getNoteByIdSchema),
  async (req, res) => {
    try {
      const note = await clinicalNotesService.getNoteById(req.organizationId, req.params.id);

      if (!note) {
        return res.status(404).json({
          success: false,
          message: 'Clinical note not found',
        });
      }

      res.json({
        success: true,
        data: note,
      });
    } catch (error) {
      logger.error('Error getting clinical note:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get clinical note',
        error: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /notes:
 *   post:
 *     summary: Create new clinical note
 *     description: Creates a new clinical note for the organization. The note is associated with the authenticated user as author.
 *     tags:
 *       - Clinical Notes
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patientId
 *             properties:
 *               patientId:
 *                 type: string
 *                 description: UUID of the patient this note belongs to.
 *               encounterType:
 *                 type: string
 *                 description: Type of clinical encounter (e.g. SOAP).
 *               subjective:
 *                 type: string
 *               objective:
 *                 type: string
 *               assessment:
 *                 type: string
 *               plan:
 *                 type: string
 *               isDraft:
 *                 type: boolean
 *                 description: Whether to save as a draft. Defaults to false.
 *     responses:
 *       201:
 *         description: Clinical note created successfully.
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
 *                   description: The newly created clinical note.
 *                 message:
 *                   type: string
 *                   example: Clinical note created successfully
 *       400:
 *         description: Invalid request body.
 *       401:
 *         description: Unauthorized. Valid Bearer token required.
 *       500:
 *         description: Internal server error while creating clinical note.
 */
router.post(
  '/',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(createNoteSchema),
  async (req, res) => {
    try {
      const note = await clinicalNotesService.createNote(req.organizationId, req.body, req.userId);

      res.status(201).json({
        success: true,
        data: note,
        message: 'Clinical note created successfully',
      });
    } catch (error) {
      logger.error('Error creating clinical note:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create clinical note',
        error: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /notes/{id}:
 *   patch:
 *     summary: Update clinical note
 *     description: Updates fields on an existing clinical note. Only draft notes can be edited; signed notes must use the amend endpoint.
 *     tags:
 *       - Clinical Notes
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID of the clinical note to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               subjective:
 *                 type: string
 *               objective:
 *                 type: string
 *               assessment:
 *                 type: string
 *               plan:
 *                 type: string
 *               isDraft:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Clinical note updated successfully.
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
 *                   description: The updated clinical note.
 *                 message:
 *                   type: string
 *                   example: Clinical note updated successfully
 *       400:
 *         description: Business logic error (e.g. attempting to edit a signed note).
 *       401:
 *         description: Unauthorized. Valid Bearer token required.
 *       404:
 *         description: Clinical note not found.
 *       500:
 *         description: Internal server error while updating clinical note.
 */
router.patch(
  '/:id',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(updateNoteSchema),
  async (req, res) => {
    try {
      const note = await clinicalNotesService.updateNote(
        req.organizationId,
        req.params.id,
        req.body,
        req.userId
      );

      if (!note) {
        return res.status(404).json({
          success: false,
          message: 'Clinical note not found',
        });
      }

      res.json({
        success: true,
        data: note,
        message: 'Clinical note updated successfully',
      });
    } catch (error) {
      logger.error('Error updating clinical note:', error);

      if (error.name === 'BusinessLogicError') {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update clinical note',
        error: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /notes/{id}/autosave:
 *   post:
 *     summary: Auto-save draft note
 *     description: Persists an in-progress draft note without finalizing it. Intended for periodic background saves from the client.
 *     tags:
 *       - Clinical Notes
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID of the clinical note draft to auto-save.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Partial or complete SOAP note fields to persist.
 *             properties:
 *               subjective:
 *                 type: string
 *               objective:
 *                 type: string
 *               assessment:
 *                 type: string
 *               plan:
 *                 type: string
 *     responses:
 *       200:
 *         description: Draft auto-saved successfully.
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
 *                   description: The auto-saved draft state.
 *                 message:
 *                   type: string
 *                   example: Draft auto-saved
 *       400:
 *         description: Invalid request body.
 *       401:
 *         description: Unauthorized. Valid Bearer token required.
 *       404:
 *         description: Clinical note not found.
 *       500:
 *         description: Internal server error while auto-saving draft.
 */
router.post(
  '/:id/autosave',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(autosaveNoteSchema),
  async (req, res) => {
    try {
      const result = await clinicalNotesService.autoSaveDraft(
        req.organizationId,
        req.params.id,
        req.body,
        req.userId
      );

      res.json({
        success: true,
        data: result,
        message: 'Draft auto-saved',
      });
    } catch (error) {
      logger.error('Error auto-saving draft:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to auto-save draft',
        error: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /notes/{id}/sign:
 *   post:
 *     summary: Sign clinical note (makes it immutable)
 *     description: Finalizes a clinical note by signing it. Once signed, the note is locked and can no longer be edited directly. Use the amend endpoint for post-signing corrections.
 *     tags:
 *       - Clinical Notes
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID of the clinical note to sign.
 *     responses:
 *       200:
 *         description: Clinical note signed successfully.
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
 *                   description: The signed clinical note.
 *                 message:
 *                   type: string
 *                   example: Clinical note signed successfully
 *       400:
 *         description: Business logic error (e.g. note is already signed or incomplete).
 *       401:
 *         description: Unauthorized. Valid Bearer token required.
 *       404:
 *         description: Clinical note not found.
 *       500:
 *         description: Internal server error while signing clinical note.
 */
router.post(
  '/:id/sign',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(signNoteSchema),
  async (req, res) => {
    try {
      const note = await clinicalNotesService.signNote(
        req.organizationId,
        req.params.id,
        req.userId
      );

      res.json({
        success: true,
        data: note,
        message: 'Clinical note signed successfully',
      });
    } catch (error) {
      logger.error('Error signing clinical note:', error);

      if (error.name === 'BusinessLogicError') {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to sign clinical note',
        error: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /notes/{id}/generate:
 *   post:
 *     summary: Generate formatted note for export or print
 *     description: Generates a human-readable formatted version of a clinical note suitable for export or printing. Returns the formatted text representation.
 *     tags:
 *       - Clinical Notes
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID of the clinical note to format.
 *     responses:
 *       200:
 *         description: Formatted note generated successfully.
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
 *                     formatted_note:
 *                       type: string
 *                       description: The formatted note text.
 *                 message:
 *                   type: string
 *                   example: Formatted note generated
 *       401:
 *         description: Unauthorized. Valid Bearer token required.
 *       404:
 *         description: Clinical note not found.
 *       500:
 *         description: Internal server error while generating formatted note.
 */
router.post(
  '/:id/generate',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(generateNoteSchema),
  async (req, res) => {
    try {
      const formattedNote = await clinicalNotesService.generateFormattedNote(
        req.organizationId,
        req.params.id
      );

      res.json({
        success: true,
        data: { formatted_note: formattedNote },
        message: 'Formatted note generated',
      });
    } catch (error) {
      logger.error('Error generating formatted note:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate formatted note',
        error: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /notes/{id}/pdf:
 *   get:
 *     summary: Generate and download PDF version of clinical note
 *     description: Generates a PDF document for the specified clinical note and returns it as a binary file download. The filename includes the patient name and note date.
 *     tags:
 *       - Clinical Notes
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID of the clinical note to export as PDF.
 *     responses:
 *       200:
 *         description: PDF file generated and returned as a binary download.
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Unauthorized. Valid Bearer token required.
 *       404:
 *         description: Clinical note not found.
 *       500:
 *         description: Internal server error while generating PDF.
 */
router.get(
  '/:id/pdf',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(getNoteByIdSchema),
  async (req, res) => {
    try {
      const pdfBuffer = await clinicalNotesService.generateNotePDF(
        req.organizationId,
        req.params.id
      );

      // Get note for filename
      const note = await clinicalNotesService.getNoteById(req.organizationId, req.params.id);

      if (!note) {
        return res.status(404).json({
          success: false,
          message: 'Clinical note not found',
        });
      }

      // Format filename
      const dateStr = new Date(note.note_date).toISOString().split('T')[0];
      const patientName = note.patient_name.replace(/\s+/g, '_');
      const filename = `Klinisk_Notat_${patientName}_${dateStr}.pdf`;

      // Set headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);

      res.send(pdfBuffer);
    } catch (error) {
      logger.error('Error generating PDF:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate PDF',
        error: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /notes/{id}/history:
 *   get:
 *     summary: Get amendment history for a clinical note
 *     description: Returns the full amendment history for a signed clinical note, including all past amendments with their text, reason, and timestamp.
 *     tags:
 *       - Clinical Notes
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID of the clinical note whose history to retrieve.
 *     responses:
 *       200:
 *         description: Amendment history returned successfully.
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
 *                     type: object
 *                     description: An amendment entry with text, reason, author, and timestamp.
 *       401:
 *         description: Unauthorized. Valid Bearer token required.
 *       404:
 *         description: Clinical note not found.
 *       500:
 *         description: Internal server error while retrieving note history.
 */
router.get(
  '/:id/history',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(getNoteByIdSchema),
  async (req, res) => {
    try {
      const history = await clinicalNotesService.getNoteHistory(req.organizationId, req.params.id);

      res.json({
        success: true,
        data: history,
      });
    } catch (error) {
      logger.error('Error getting note history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get note history',
        error: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /notes/{id}/amend:
 *   post:
 *     summary: Create an amendment for a signed clinical note
 *     description: Adds an amendment to an already-signed clinical note. The original note remains immutable; the amendment is appended as a separate record with the amendment text and reason.
 *     tags:
 *       - Clinical Notes
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID of the signed clinical note to amend.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *               - reason
 *             properties:
 *               text:
 *                 type: string
 *                 description: The amendment text to append to the note.
 *               reason:
 *                 type: string
 *                 description: The clinical or administrative reason for the amendment.
 *     responses:
 *       201:
 *         description: Amendment created successfully.
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
 *                   description: The newly created amendment record.
 *                 message:
 *                   type: string
 *                   example: Amendment created successfully
 *       400:
 *         description: Business logic error (e.g. note is not signed or missing required fields).
 *       401:
 *         description: Unauthorized. Valid Bearer token required.
 *       404:
 *         description: Clinical note not found.
 *       500:
 *         description: Internal server error while creating amendment.
 */
router.post(
  '/:id/amend',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(amendNoteSchema),
  async (req, res) => {
    try {
      const { text, reason } = req.body;

      const amendment = await clinicalNotesService.createAmendment(
        req.organizationId,
        req.params.id,
        { text, reason },
        req.userId
      );

      res.status(201).json({
        success: true,
        data: amendment,
        message: 'Amendment created successfully',
      });
    } catch (error) {
      logger.error('Error creating amendment:', error);

      if (error.name === 'BusinessLogicError') {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to create amendment',
        error: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /notes/{id}:
 *   delete:
 *     summary: Delete clinical note
 *     description: Permanently deletes a clinical note. Only draft notes can be deleted; signed notes cannot be removed.
 *     tags:
 *       - Clinical Notes
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID of the draft clinical note to delete.
 *     responses:
 *       200:
 *         description: Clinical note deleted successfully.
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
 *                   example: Clinical note deleted successfully
 *       400:
 *         description: Business logic error (e.g. attempting to delete a signed note).
 *       401:
 *         description: Unauthorized. Valid Bearer token required.
 *       404:
 *         description: Clinical note not found.
 *       500:
 *         description: Internal server error while deleting clinical note.
 */
router.delete(
  '/:id',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(deleteNoteSchema),
  async (req, res) => {
    try {
      await clinicalNotesService.deleteNote(req.organizationId, req.params.id, req.userId);

      res.json({
        success: true,
        message: 'Clinical note deleted successfully',
      });
    } catch (error) {
      logger.error('Error deleting clinical note:', error);

      if (error.name === 'BusinessLogicError') {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to delete clinical note',
        error: error.message,
      });
    }
  }
);

export default router;
