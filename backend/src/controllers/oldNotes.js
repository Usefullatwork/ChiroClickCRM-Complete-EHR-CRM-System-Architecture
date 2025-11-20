/**
 * Old Journal Notes Controller
 * Handles HTTP requests for importing and processing old patient journal notes
 */

import logger from '../utils/logger.js';
import {
  importJournalNote,
  importMultipleNotes,
  processNoteWithAI,
  processBatchWithAI,
  getPatientImportedNotes,
  getImportedNoteById,
  reviewNote,
  convertToEncounter,
  getBatchInfo,
  deleteImportedNote,
  updateNoteSoapData,
  getActionableItemsByNote,
  getActionableItemsByPatient,
  updateActionableItemStatus,
  completeActionableItem,
  uncompleteActionableItem,
  assignActionableItem,
  deleteActionableItem,
  getCommunicationHistoryByNote,
  getCommunicationHistoryByPatient,
  createFollowUpFromActionableItem
} from '../services/oldNotes.js';
import { query } from '../config/database.js';

/**
 * Upload and import a single old journal note (text content)
 */
export const uploadNote = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { content, filename, processImmediately = false } = req.body;
    const userId = req.user.id;
    const organizationId = req.user.organization_id;

    if (!content) {
      return res.status(400).json({ error: 'Note content is required' });
    }

    // Get patient context for AI processing
    const patientResult = await query(
      `SELECT id, first_name, last_name, date_of_birth, medical_history
       FROM patients WHERE id = $1 AND organization_id = $2`,
      [patientId, organizationId]
    );

    if (patientResult.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const patient = patientResult.rows[0];

    // Calculate age
    const age = patient.date_of_birth
      ? new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()
      : null;

    // Import the note
    const note = await importJournalNote({
      patientId,
      organizationId,
      originalContent: content,
      originalFilename: filename || 'manual-upload.txt',
      uploadedBy: userId
    });

    // Process with AI if requested
    let processResult = null;
    if (processImmediately) {
      const patientContext = {
        first_name: patient.first_name,
        last_name: patient.last_name,
        age,
        medical_history: patient.medical_history
      };

      processResult = await processNoteWithAI(note.id, patientContext);
    }

    res.status(201).json({
      note,
      processed: processImmediately,
      aiResult: processResult
    });

  } catch (error) {
    logger.error('Upload note error:', error);
    res.status(500).json({ error: 'Failed to upload note' });
  }
};

/**
 * Upload and import multiple notes at once
 */
export const uploadMultipleNotes = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { notes, batchName, processImmediately = false } = req.body;
    const userId = req.user.id;
    const organizationId = req.user.organization_id;

    if (!notes || !Array.isArray(notes) || notes.length === 0) {
      return res.status(400).json({ error: 'Notes array is required' });
    }

    // Get patient context
    const patientResult = await query(
      `SELECT id, first_name, last_name, date_of_birth, medical_history
       FROM patients WHERE id = $1 AND organization_id = $2`,
      [patientId, organizationId]
    );

    if (patientResult.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const patient = patientResult.rows[0];
    const age = patient.date_of_birth
      ? new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()
      : null;

    // Import all notes
    const importResult = await importMultipleNotes(
      notes,
      patientId,
      organizationId,
      userId,
      batchName
    );

    // Process batch with AI if requested
    let processResult = null;
    if (processImmediately) {
      const patientContext = {
        first_name: patient.first_name,
        last_name: patient.last_name,
        age,
        medical_history: patient.medical_history
      };

      processResult = await processBatchWithAI(importResult.batch.id, patientContext);
    }

    res.status(201).json({
      batch: importResult.batch,
      notes: importResult.notes,
      processed: processImmediately,
      processResult
    });

  } catch (error) {
    logger.error('Upload multiple notes error:', error);
    res.status(500).json({ error: 'Failed to upload notes' });
  }
};

/**
 * Process a note with AI
 */
export const processNote = async (req, res) => {
  try {
    const { noteId } = req.params;
    const organizationId = req.user.organization_id;

    // Get note to verify it belongs to this organization
    const note = await getImportedNoteById(noteId, organizationId);

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Get patient context
    const patientResult = await query(
      `SELECT id, first_name, last_name, date_of_birth, medical_history
       FROM patients WHERE id = $1`,
      [note.patient_id]
    );

    const patient = patientResult.rows[0];
    const age = patient.date_of_birth
      ? new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()
      : null;

    const patientContext = {
      first_name: patient.first_name,
      last_name: patient.last_name,
      age,
      medical_history: patient.medical_history
    };

    const result = await processNoteWithAI(noteId, patientContext);

    res.json(result);

  } catch (error) {
    logger.error('Process note error:', error);
    res.status(500).json({ error: 'Failed to process note' });
  }
};

/**
 * Get all imported notes for a patient
 */
export const getPatientNotes = async (req, res) => {
  try {
    const { patientId } = req.params;
    const organizationId = req.user.organization_id;
    const { status, approved, limit, offset } = req.query;

    const filters = {
      status,
      approved: approved !== undefined ? approved === 'true' : undefined,
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0
    };

    const result = await getPatientImportedNotes(patientId, organizationId, filters);

    res.json(result);

  } catch (error) {
    logger.error('Get patient notes error:', error);
    res.status(500).json({ error: 'Failed to retrieve notes' });
  }
};

/**
 * Get a single imported note
 */
export const getNote = async (req, res) => {
  try {
    const { noteId } = req.params;
    const organizationId = req.user.organization_id;

    const note = await getImportedNoteById(noteId, organizationId);

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json(note);

  } catch (error) {
    logger.error('Get note error:', error);
    res.status(500).json({ error: 'Failed to retrieve note' });
  }
};

/**
 * Review and approve/reject a note
 */
export const reviewNoteHandler = async (req, res) => {
  try {
    const { noteId } = req.params;
    const { approved, reviewNotes } = req.body;
    const userId = req.user.id;
    const organizationId = req.user.organization_id;

    // Verify note exists and belongs to this organization
    const note = await getImportedNoteById(noteId, organizationId);

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const reviewedNote = await reviewNote(noteId, {
      reviewedBy: userId,
      approved,
      reviewNotes
    });

    res.json(reviewedNote);

  } catch (error) {
    logger.error('Review note error:', error);
    res.status(500).json({ error: 'Failed to review note' });
  }
};

/**
 * Convert an approved note to a clinical encounter
 */
export const convertNoteToEncounter = async (req, res) => {
  try {
    const { noteId } = req.params;
    const userId = req.user.id;
    const organizationId = req.user.organization_id;

    const result = await convertToEncounter(noteId, userId, organizationId);

    res.json(result);

  } catch (error) {
    logger.error('Convert note to encounter error:', error);
    res.status(500).json({ error: error.message || 'Failed to convert note' });
  }
};

/**
 * Get batch information
 */
export const getBatch = async (req, res) => {
  try {
    const { batchId } = req.params;
    const organizationId = req.user.organization_id;

    const batch = await getBatchInfo(batchId, organizationId);

    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    res.json(batch);

  } catch (error) {
    logger.error('Get batch error:', error);
    res.status(500).json({ error: 'Failed to retrieve batch' });
  }
};

/**
 * Delete an imported note
 */
export const deleteNote = async (req, res) => {
  try {
    const { noteId } = req.params;
    const organizationId = req.user.organization_id;

    await deleteImportedNote(noteId, organizationId);

    res.json({ success: true });

  } catch (error) {
    logger.error('Delete note error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete note' });
  }
};

/**
 * Update SOAP data for a note (manual editing before approval)
 */
export const updateSoapData = async (req, res) => {
  try {
    const { noteId } = req.params;
    const { soapData } = req.body;
    const organizationId = req.user.organization_id;

    if (!soapData) {
      return res.status(400).json({ error: 'SOAP data is required' });
    }

    const updatedNote = await updateNoteSoapData(noteId, organizationId, soapData);

    res.json(updatedNote);

  } catch (error) {
    logger.error('Update SOAP data error:', error);
    res.status(500).json({ error: 'Failed to update SOAP data' });
  }
};

/**
 * Process entire batch with AI
 */
export const processBatch = async (req, res) => {
  try {
    const { batchId } = req.params;
    const organizationId = req.user.organization_id;

    // Get batch to verify it exists and get patient
    const batch = await getBatchInfo(batchId, organizationId);

    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    // Get patient context
    const patientResult = await query(
      `SELECT id, first_name, last_name, date_of_birth, medical_history
       FROM patients WHERE id = $1`,
      [batch.patient_id]
    );

    const patient = patientResult.rows[0];
    const age = patient.date_of_birth
      ? new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()
      : null;

    const patientContext = {
      first_name: patient.first_name,
      last_name: patient.last_name,
      age,
      medical_history: patient.medical_history
    };

    const result = await processBatchWithAI(batchId, patientContext);

    res.json(result);

  } catch (error) {
    logger.error('Process batch error:', error);
    res.status(500).json({ error: 'Failed to process batch' });
  }
};

/**
 * Get actionable items for a note
 */
export const getActionableItems = async (req, res) => {
  try {
    const { noteId } = req.params;
    const organizationId = req.user.organization_id;

    const items = await getActionableItemsByNote(noteId, organizationId);
    res.json(items);

  } catch (error) {
    logger.error('Get actionable items error:', error);
    res.status(500).json({ error: 'Failed to retrieve actionable items' });
  }
};

/**
 * Get all actionable items for a patient
 */
export const getPatientActionableItems = async (req, res) => {
  try {
    const { patientId } = req.params;
    const organizationId = req.user.organization_id;
    const { status, itemType, includeCompleted } = req.query;

    const filters = {
      status,
      itemType,
      includeCompleted: includeCompleted === 'true'
    };

    const items = await getActionableItemsByPatient(patientId, organizationId, filters);
    res.json(items);

  } catch (error) {
    logger.error('Get patient actionable items error:', error);
    res.status(500).json({ error: 'Failed to retrieve actionable items' });
  }
};

/**
 * Complete an actionable item (check the box)
 */
export const completeItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { notes } = req.body;
    const userId = req.user.id;

    const item = await completeActionableItem(itemId, userId, notes);
    res.json(item);

  } catch (error) {
    logger.error('Complete item error:', error);
    res.status(500).json({ error: 'Failed to complete item' });
  }
};

/**
 * Uncomplete an actionable item (uncheck the box)
 */
export const uncompleteItem = async (req, res) => {
  try {
    const { itemId } = req.params;

    const item = await uncompleteActionableItem(itemId);
    res.json(item);

  } catch (error) {
    logger.error('Uncomplete item error:', error);
    res.status(500).json({ error: 'Failed to uncomplete item' });
  }
};

/**
 * Update item status
 */
export const updateItemStatus = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    const item = await updateActionableItemStatus(itemId, status, userId);
    res.json(item);

  } catch (error) {
    logger.error('Update item status error:', error);
    res.status(500).json({ error: 'Failed to update item status' });
  }
};

/**
 * Assign item to user
 */
export const assignItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { userId } = req.body;

    const item = await assignActionableItem(itemId, userId);
    res.json(item);

  } catch (error) {
    logger.error('Assign item error:', error);
    res.status(500).json({ error: 'Failed to assign item' });
  }
};

/**
 * Delete actionable item
 */
export const deleteItem = async (req, res) => {
  try {
    const { itemId } = req.params;

    await deleteActionableItem(itemId);
    res.json({ success: true });

  } catch (error) {
    logger.error('Delete item error:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
};

/**
 * Get communication history for a note
 */
export const getCommunicationHistory = async (req, res) => {
  try {
    const { noteId } = req.params;
    const organizationId = req.user.organization_id;

    const history = await getCommunicationHistoryByNote(noteId, organizationId);
    res.json(history);

  } catch (error) {
    logger.error('Get communication history error:', error);
    res.status(500).json({ error: 'Failed to retrieve communication history' });
  }
};

/**
 * Get communication history for a patient
 */
export const getPatientCommunicationHistory = async (req, res) => {
  try {
    const { patientId } = req.params;
    const organizationId = req.user.organization_id;

    const history = await getCommunicationHistoryByPatient(patientId, organizationId);
    res.json(history);

  } catch (error) {
    logger.error('Get patient communication history error:', error);
    res.status(500).json({ error: 'Failed to retrieve communication history' });
  }
};

/**
 * Create follow-up from actionable item
 */
export const createFollowUpFromItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user.id;

    const followUp = await createFollowUpFromActionableItem(itemId, userId);
    res.json(followUp);

  } catch (error) {
    logger.error('Create follow-up from item error:', error);
    res.status(500).json({ error: 'Failed to create follow-up' });
  }
};

export default {
  uploadNote,
  uploadMultipleNotes,
  processNote,
  getPatientNotes,
  getNote,
  reviewNoteHandler,
  convertNoteToEncounter,
  getBatch,
  deleteNote,
  updateSoapData,
  processBatch,
  getActionableItems,
  getPatientActionableItems,
  completeItem,
  uncompleteItem,
  updateItemStatus,
  assignItem,
  deleteItem,
  getCommunicationHistory,
  getPatientCommunicationHistory,
  createFollowUpFromItem
};
