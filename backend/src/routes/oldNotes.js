/**
 * Old Journal Notes Routes
 * API endpoints for importing and processing old patient journal notes
 */

import express from 'express';
import {
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
} from '../controllers/oldNotes.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Patient-specific note routes
router.post('/patients/:patientId/old-notes', uploadNote);
router.post('/patients/:patientId/old-notes/batch', uploadMultipleNotes);
router.get('/patients/:patientId/old-notes', getPatientNotes);

// Patient-specific actionable items and communication history
router.get('/patients/:patientId/old-notes/actionable-items', getPatientActionableItems);
router.get('/patients/:patientId/old-notes/communication-history', getPatientCommunicationHistory);

// Individual note operations
router.get('/old-notes/:noteId', getNote);
router.post('/old-notes/:noteId/process', processNote);
router.put('/old-notes/:noteId/review', reviewNoteHandler);
router.put('/old-notes/:noteId/soap', updateSoapData);
router.post('/old-notes/:noteId/convert', convertNoteToEncounter);
router.delete('/old-notes/:noteId', deleteNote);

// Note-specific actionable items and communication history
router.get('/old-notes/:noteId/actionable-items', getActionableItems);
router.get('/old-notes/:noteId/communication-history', getCommunicationHistory);

// Actionable item operations
router.post('/old-notes/actionable-items/:itemId/complete', completeItem);
router.post('/old-notes/actionable-items/:itemId/uncomplete', uncompleteItem);
router.put('/old-notes/actionable-items/:itemId/status', updateItemStatus);
router.put('/old-notes/actionable-items/:itemId/assign', assignItem);
router.delete('/old-notes/actionable-items/:itemId', deleteItem);
router.post('/old-notes/actionable-items/:itemId/create-followup', createFollowUpFromItem);

// Batch operations
router.get('/old-notes/batches/:batchId', getBatch);
router.post('/old-notes/batches/:batchId/process', processBatch);

export default router;
