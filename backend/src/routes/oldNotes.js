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
  createFollowUpFromItem,
} from '../controllers/oldNotes.js';
import { authenticate } from '../middleware/auth.js';
import validate from '../middleware/validation.js';
import {
  patientIdParamSchema,
  noteIdParamSchema,
  itemIdParamSchema,
  batchIdParamSchema,
  updateSoapDataSchema,
  reviewNoteSchema,
  updateItemStatusSchema,
  assignItemSchema,
} from '../validators/oldNotes.validators.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Patient-specific note routes
router.post('/patients/:patientId/old-notes', validate(patientIdParamSchema), uploadNote);
router.post(
  '/patients/:patientId/old-notes/batch',
  validate(patientIdParamSchema),
  uploadMultipleNotes
);
router.get('/patients/:patientId/old-notes', validate(patientIdParamSchema), getPatientNotes);

// Patient-specific actionable items and communication history
router.get(
  '/patients/:patientId/old-notes/actionable-items',
  validate(patientIdParamSchema),
  getPatientActionableItems
);
router.get(
  '/patients/:patientId/old-notes/communication-history',
  validate(patientIdParamSchema),
  getPatientCommunicationHistory
);

// Individual note operations
router.get('/old-notes/:noteId', validate(noteIdParamSchema), getNote);
router.post('/old-notes/:noteId/process', validate(noteIdParamSchema), processNote);
router.put('/old-notes/:noteId/review', validate(reviewNoteSchema), reviewNoteHandler);
router.put('/old-notes/:noteId/soap', validate(updateSoapDataSchema), updateSoapData);
router.post('/old-notes/:noteId/convert', validate(noteIdParamSchema), convertNoteToEncounter);
router.delete('/old-notes/:noteId', validate(noteIdParamSchema), deleteNote);

// Note-specific actionable items and communication history
router.get('/old-notes/:noteId/actionable-items', validate(noteIdParamSchema), getActionableItems);
router.get(
  '/old-notes/:noteId/communication-history',
  validate(noteIdParamSchema),
  getCommunicationHistory
);

// Actionable item operations
router.post(
  '/old-notes/actionable-items/:itemId/complete',
  validate(itemIdParamSchema),
  completeItem
);
router.post(
  '/old-notes/actionable-items/:itemId/uncomplete',
  validate(itemIdParamSchema),
  uncompleteItem
);
router.put(
  '/old-notes/actionable-items/:itemId/status',
  validate(updateItemStatusSchema),
  updateItemStatus
);
router.put('/old-notes/actionable-items/:itemId/assign', validate(assignItemSchema), assignItem);
router.delete('/old-notes/actionable-items/:itemId', validate(itemIdParamSchema), deleteItem);
router.post(
  '/old-notes/actionable-items/:itemId/create-followup',
  validate(itemIdParamSchema),
  createFollowUpFromItem
);

// Batch operations
router.get('/old-notes/batches/:batchId', validate(batchIdParamSchema), getBatch);
router.post('/old-notes/batches/:batchId/process', validate(batchIdParamSchema), processBatch);

export default router;
