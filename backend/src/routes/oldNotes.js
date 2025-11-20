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
  processBatch
} from '../controllers/oldNotes.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Patient-specific note routes
router.post('/patients/:patientId/old-notes', uploadNote);
router.post('/patients/:patientId/old-notes/batch', uploadMultipleNotes);
router.get('/patients/:patientId/old-notes', getPatientNotes);

// Individual note operations
router.get('/old-notes/:noteId', getNote);
router.post('/old-notes/:noteId/process', processNote);
router.put('/old-notes/:noteId/review', reviewNoteHandler);
router.put('/old-notes/:noteId/soap', updateSoapData);
router.post('/old-notes/:noteId/convert', convertNoteToEncounter);
router.delete('/old-notes/:noteId', deleteNote);

// Batch operations
router.get('/old-notes/batches/:batchId', getBatch);
router.post('/old-notes/batches/:batchId/process', processBatch);

export default router;
