/**
 * Clinical Notes Routes
 * API endpoints for SOAP documentation and clinical notes
 */

import express from 'express';
import * as clinicalNotesService from '../services/clinicalNotes.js';
import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js';
import { validate as validateNote } from '../services/noteValidator.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Apply authentication and organization middleware to all routes
router.use(requireAuth);
router.use(requireOrganization);

/**
 * @route   POST /api/v1/notes/validate
 * @desc    Validate SOAP note data without saving
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.post('/validate', requireRole(['ADMIN', 'PRACTITIONER']), async (req, res) => {
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
});

/**
 * @route   GET /api/v1/notes
 * @desc    Get all clinical notes with filters
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get('/', requireRole(['ADMIN', 'PRACTITIONER']), async (req, res) => {
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
});

/**
 * @route   GET /api/v1/notes/templates
 * @desc    Get available note templates
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get('/templates', requireRole(['ADMIN', 'PRACTITIONER']), async (req, res) => {
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
});

/**
 * @route   GET /api/v1/notes/drafts
 * @desc    Get current user's draft notes
 * @access  Private (ADMIN, PRACTITIONER)
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
 * @route   GET /api/v1/notes/search
 * @desc    Search clinical notes
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get('/search', requireRole(['ADMIN', 'PRACTITIONER']), async (req, res) => {
  try {
    const { q, patientId, limit } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

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
});

/**
 * @route   GET /api/v1/notes/patient/:patientId
 * @desc    Get notes for a specific patient
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get('/patient/:patientId', requireRole(['ADMIN', 'PRACTITIONER']), async (req, res) => {
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
});

/**
 * @route   GET /api/v1/notes/:id
 * @desc    Get clinical note by ID
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get('/:id', requireRole(['ADMIN', 'PRACTITIONER']), async (req, res) => {
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
});

/**
 * @route   POST /api/v1/notes
 * @desc    Create new clinical note
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.post('/', requireRole(['ADMIN', 'PRACTITIONER']), async (req, res) => {
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
});

/**
 * @route   PATCH /api/v1/notes/:id
 * @desc    Update clinical note
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.patch('/:id', requireRole(['ADMIN', 'PRACTITIONER']), async (req, res) => {
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
});

/**
 * @route   POST /api/v1/notes/:id/autosave
 * @desc    Auto-save draft note
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.post('/:id/autosave', requireRole(['ADMIN', 'PRACTITIONER']), async (req, res) => {
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
});

/**
 * @route   POST /api/v1/notes/:id/sign
 * @desc    Sign clinical note (makes it immutable)
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.post('/:id/sign', requireRole(['ADMIN', 'PRACTITIONER']), async (req, res) => {
  try {
    const note = await clinicalNotesService.signNote(req.organizationId, req.params.id, req.userId);

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
});

/**
 * @route   POST /api/v1/notes/:id/generate
 * @desc    Generate formatted note for export/print
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.post('/:id/generate', requireRole(['ADMIN', 'PRACTITIONER']), async (req, res) => {
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
});

/**
 * @route   GET /api/v1/notes/:id/pdf
 * @desc    Generate and download PDF version of clinical note
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get('/:id/pdf', requireRole(['ADMIN', 'PRACTITIONER']), async (req, res) => {
  try {
    const pdfBuffer = await clinicalNotesService.generateNotePDF(req.organizationId, req.params.id);

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
});

/**
 * @route   GET /api/v1/notes/:id/history
 * @desc    Get amendment history for a clinical note
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.get('/:id/history', requireRole(['ADMIN', 'PRACTITIONER']), async (req, res) => {
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
});

/**
 * @route   POST /api/v1/notes/:id/amend
 * @desc    Create an amendment for a signed clinical note
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.post('/:id/amend', requireRole(['ADMIN', 'PRACTITIONER']), async (req, res) => {
  try {
    const { text, reason } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Amendment text is required',
      });
    }

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
});

/**
 * @route   DELETE /api/v1/notes/:id
 * @desc    Delete clinical note (only drafts)
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.delete('/:id', requireRole(['ADMIN', 'PRACTITIONER']), async (req, res) => {
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
});

export default router;
