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

/**
 * @swagger
 * tags:
 *   name: Old Notes Import
 *   description: Import and process legacy patient journal notes
 */

/**
 * @swagger
 * /patients/{patientId}/old-notes:
 *   post:
 *     summary: Upload a single legacy journal note for a patient
 *     tags: [Old Notes Import]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the patient to attach the note to
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: Raw text content of the legacy journal note
 *               filename:
 *                 type: string
 *                 description: Original filename of the note (defaults to "manual-upload.txt")
 *                 example: journal-2021-03-15.txt
 *               processImmediately:
 *                 type: boolean
 *                 description: If true, the note is immediately processed by the AI pipeline after upload
 *                 default: false
 *     responses:
 *       201:
 *         description: Note uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 note:
 *                   $ref: '#/components/schemas/OldNote'
 *                 processed:
 *                   type: boolean
 *                   description: Whether AI processing was triggered
 *                 aiResult:
 *                   description: AI processing result, null if processImmediately was false
 *                   nullable: true
 *                   $ref: '#/components/schemas/AiProcessResult'
 *       400:
 *         description: Note content is missing
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized — missing or invalid token
 *       404:
 *         description: Patient not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/patients/:patientId/old-notes', validate(patientIdParamSchema), uploadNote);

/**
 * @swagger
 * /patients/{patientId}/old-notes/batch:
 *   post:
 *     summary: Upload multiple legacy journal notes for a patient in a single batch
 *     tags: [Old Notes Import]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the patient to attach the notes to
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - notes
 *             properties:
 *               notes:
 *                 type: array
 *                 description: Array of note objects to import
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - content
 *                   properties:
 *                     content:
 *                       type: string
 *                       description: Raw text content of the note
 *                     filename:
 *                       type: string
 *                       description: Original filename of the note
 *               batchName:
 *                 type: string
 *                 description: Optional human-readable name for this import batch
 *                 example: "March 2021 Import"
 *               processImmediately:
 *                 type: boolean
 *                 description: If true, the entire batch is processed by the AI pipeline after upload
 *                 default: false
 *     responses:
 *       201:
 *         description: Batch uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 batch:
 *                   $ref: '#/components/schemas/NoteBatch'
 *                 notes:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/OldNote'
 *                 processed:
 *                   type: boolean
 *                 processResult:
 *                   nullable: true
 *                   $ref: '#/components/schemas/AiProcessResult'
 *       400:
 *         description: Notes array is missing or empty
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized — missing or invalid token
 *       404:
 *         description: Patient not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/patients/:patientId/old-notes/batch',
  validate(patientIdParamSchema),
  uploadMultipleNotes
);

/**
 * @swagger
 * /patients/{patientId}/old-notes:
 *   get:
 *     summary: Retrieve all imported legacy notes for a patient
 *     tags: [Old Notes Import]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the patient
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processed, approved, rejected, needs_review]
 *         description: Filter notes by processing status
 *       - in: query
 *         name: approved
 *         schema:
 *           type: boolean
 *         description: Filter by approval state (true = approved, false = not approved)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of notes to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of notes to skip (for pagination)
 *     responses:
 *       200:
 *         description: List of imported notes for the patient
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 notes:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/OldNote'
 *                 total:
 *                   type: integer
 *                   description: Total count of matching notes
 *       401:
 *         description: Unauthorized — missing or invalid token
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/patients/:patientId/old-notes', validate(patientIdParamSchema), getPatientNotes);

/**
 * @swagger
 * /patients/{patientId}/old-notes/actionable-items:
 *   get:
 *     summary: Retrieve all actionable items across all legacy notes for a patient
 *     tags: [Old Notes Import]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the patient
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter items by status (e.g. pending, in_progress, done)
 *       - in: query
 *         name: itemType
 *         schema:
 *           type: string
 *         description: Filter items by type (e.g. referral, follow_up, test)
 *       - in: query
 *         name: includeCompleted
 *         schema:
 *           type: boolean
 *           default: false
 *         description: When true, completed items are included in the response
 *     responses:
 *       200:
 *         description: List of actionable items for the patient
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ActionableItem'
 *       401:
 *         description: Unauthorized — missing or invalid token
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/patients/:patientId/old-notes/actionable-items',
  validate(patientIdParamSchema),
  getPatientActionableItems
);

/**
 * @swagger
 * /patients/{patientId}/old-notes/communication-history:
 *   get:
 *     summary: Retrieve communication history across all legacy notes for a patient
 *     tags: [Old Notes Import]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the patient
 *     responses:
 *       200:
 *         description: Communication history for the patient
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CommunicationHistoryEntry'
 *       401:
 *         description: Unauthorized — missing or invalid token
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/patients/:patientId/old-notes/communication-history',
  validate(patientIdParamSchema),
  getPatientCommunicationHistory
);

/**
 * @swagger
 * /old-notes/{noteId}:
 *   get:
 *     summary: Retrieve a single imported legacy note by ID
 *     tags: [Old Notes Import]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: noteId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the legacy note
 *     responses:
 *       200:
 *         description: The requested legacy note
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OldNote'
 *       401:
 *         description: Unauthorized — missing or invalid token
 *       404:
 *         description: Note not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/old-notes/:noteId', validate(noteIdParamSchema), getNote);

/**
 * @swagger
 * /old-notes/{noteId}/process:
 *   post:
 *     summary: Trigger AI processing for a single legacy note
 *     description: Sends the note through the AI pipeline to extract SOAP data, actionable items, and communication history.
 *     tags: [Old Notes Import]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: noteId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the legacy note to process
 *     responses:
 *       200:
 *         description: AI processing result for the note
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AiProcessResult'
 *       401:
 *         description: Unauthorized — missing or invalid token
 *       404:
 *         description: Note not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/old-notes/:noteId/process', validate(noteIdParamSchema), processNote);

/**
 * @swagger
 * /old-notes/{noteId}/review:
 *   put:
 *     summary: Review and approve or reject a processed legacy note
 *     tags: [Old Notes Import]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: noteId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the legacy note to review
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [approved, rejected, needs_review]
 *                 description: Review decision for the note
 *               reviewNotes:
 *                 type: string
 *                 maxLength: 2000
 *                 description: Optional reviewer comments or reasons for the decision
 *     responses:
 *       200:
 *         description: Note updated with review outcome
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OldNote'
 *       401:
 *         description: Unauthorized — missing or invalid token
 *       404:
 *         description: Note not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/old-notes/:noteId/review', validate(reviewNoteSchema), reviewNoteHandler);

/**
 * @swagger
 * /old-notes/{noteId}/soap:
 *   put:
 *     summary: Update SOAP data on a legacy note before approval
 *     description: Allows manual editing of AI-extracted SOAP fields (subjective, objective, assessment, plan) prior to approval. At least one SOAP field must be supplied.
 *     tags: [Old Notes Import]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: noteId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the legacy note
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - soapData
 *             properties:
 *               soapData:
 *                 type: object
 *                 description: Object containing one or more SOAP sections to update
 *                 minProperties: 1
 *                 properties:
 *                   subjective:
 *                     type: object
 *                     description: Patient-reported symptoms and history
 *                   objective:
 *                     type: object
 *                     description: Clinical examination findings
 *                   assessment:
 *                     type: object
 *                     description: Diagnosis and clinical impression
 *                   plan:
 *                     type: object
 *                     description: Treatment plan and next steps
 *     responses:
 *       200:
 *         description: Note with updated SOAP data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OldNote'
 *       400:
 *         description: soapData field is missing from the request body
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized — missing or invalid token
 *       404:
 *         description: Note not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/old-notes/:noteId/soap', validate(updateSoapDataSchema), updateSoapData);

/**
 * @swagger
 * /old-notes/{noteId}/convert:
 *   post:
 *     summary: Convert an approved legacy note into a clinical encounter
 *     description: Transforms the AI-processed and approved SOAP data from the legacy note into a full clinical encounter record.
 *     tags: [Old Notes Import]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: noteId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the approved legacy note to convert
 *     responses:
 *       200:
 *         description: Newly created clinical encounter derived from the legacy note
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: Clinical encounter record
 *       401:
 *         description: Unauthorized — missing or invalid token
 *       404:
 *         description: Note not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error or note not eligible for conversion (e.g. not yet approved)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/old-notes/:noteId/convert', validate(noteIdParamSchema), convertNoteToEncounter);

/**
 * @swagger
 * /old-notes/{noteId}:
 *   delete:
 *     summary: Delete an imported legacy note
 *     tags: [Old Notes Import]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: noteId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the legacy note to delete
 *     responses:
 *       200:
 *         description: Note deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: Unauthorized — missing or invalid token
 *       404:
 *         description: Note not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/old-notes/:noteId', validate(noteIdParamSchema), deleteNote);

/**
 * @swagger
 * /old-notes/{noteId}/actionable-items:
 *   get:
 *     summary: Retrieve all actionable items extracted from a specific legacy note
 *     tags: [Old Notes Import]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: noteId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the legacy note
 *     responses:
 *       200:
 *         description: List of actionable items for the note
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ActionableItem'
 *       401:
 *         description: Unauthorized — missing or invalid token
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/old-notes/:noteId/actionable-items', validate(noteIdParamSchema), getActionableItems);

/**
 * @swagger
 * /old-notes/{noteId}/communication-history:
 *   get:
 *     summary: Retrieve communication history extracted from a specific legacy note
 *     tags: [Old Notes Import]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: noteId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the legacy note
 *     responses:
 *       200:
 *         description: Communication history entries for the note
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CommunicationHistoryEntry'
 *       401:
 *         description: Unauthorized — missing or invalid token
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/old-notes/:noteId/communication-history',
  validate(noteIdParamSchema),
  getCommunicationHistory
);

/**
 * @swagger
 * /old-notes/actionable-items/{itemId}/complete:
 *   post:
 *     summary: Mark an actionable item as complete
 *     tags: [Old Notes Import]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the actionable item to complete
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *                 description: Optional completion notes or comments
 *     responses:
 *       200:
 *         description: Actionable item marked as complete
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ActionableItem'
 *       401:
 *         description: Unauthorized — missing or invalid token
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/old-notes/actionable-items/:itemId/complete',
  validate(itemIdParamSchema),
  completeItem
);

/**
 * @swagger
 * /old-notes/actionable-items/{itemId}/uncomplete:
 *   post:
 *     summary: Revert a completed actionable item back to incomplete
 *     tags: [Old Notes Import]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the actionable item to uncomplete
 *     responses:
 *       200:
 *         description: Actionable item reverted to incomplete
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ActionableItem'
 *       401:
 *         description: Unauthorized — missing or invalid token
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/old-notes/actionable-items/:itemId/uncomplete',
  validate(itemIdParamSchema),
  uncompleteItem
);

/**
 * @swagger
 * /old-notes/actionable-items/{itemId}/status:
 *   put:
 *     summary: Update the status of an actionable item
 *     tags: [Old Notes Import]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the actionable item
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 description: New status value for the actionable item (e.g. pending, in_progress, done, cancelled)
 *     responses:
 *       200:
 *         description: Actionable item with updated status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ActionableItem'
 *       401:
 *         description: Unauthorized — missing or invalid token
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  '/old-notes/actionable-items/:itemId/status',
  validate(updateItemStatusSchema),
  updateItemStatus
);

/**
 * @swagger
 * /old-notes/actionable-items/{itemId}/assign:
 *   put:
 *     summary: Assign an actionable item to a user
 *     tags: [Old Notes Import]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the actionable item to assign
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - assigneeId
 *             properties:
 *               assigneeId:
 *                 type: string
 *                 format: uuid
 *                 description: UUID of the user to assign this item to
 *     responses:
 *       200:
 *         description: Actionable item updated with assignee
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ActionableItem'
 *       401:
 *         description: Unauthorized — missing or invalid token
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/old-notes/actionable-items/:itemId/assign', validate(assignItemSchema), assignItem);

/**
 * @swagger
 * /old-notes/actionable-items/{itemId}:
 *   delete:
 *     summary: Delete an actionable item
 *     tags: [Old Notes Import]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the actionable item to delete
 *     responses:
 *       200:
 *         description: Actionable item deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: Unauthorized — missing or invalid token
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/old-notes/actionable-items/:itemId', validate(itemIdParamSchema), deleteItem);

/**
 * @swagger
 * /old-notes/actionable-items/{itemId}/create-followup:
 *   post:
 *     summary: Create a follow-up appointment or task from an actionable item
 *     description: Converts an actionable item into a follow-up record (e.g. an appointment or task) linked to the originating patient.
 *     tags: [Old Notes Import]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the actionable item to create a follow-up from
 *     responses:
 *       200:
 *         description: Follow-up record created from the actionable item
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: The newly created follow-up record
 *       401:
 *         description: Unauthorized — missing or invalid token
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/old-notes/actionable-items/:itemId/create-followup',
  validate(itemIdParamSchema),
  createFollowUpFromItem
);

/**
 * @swagger
 * /old-notes/batches/{batchId}:
 *   get:
 *     summary: Retrieve information about an import batch
 *     tags: [Old Notes Import]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: batchId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the import batch
 *     responses:
 *       200:
 *         description: Batch information including status and associated notes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NoteBatch'
 *       401:
 *         description: Unauthorized — missing or invalid token
 *       404:
 *         description: Batch not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/old-notes/batches/:batchId', validate(batchIdParamSchema), getBatch);

/**
 * @swagger
 * /old-notes/batches/{batchId}/process:
 *   post:
 *     summary: Trigger AI processing for all notes in a batch
 *     description: Runs the AI pipeline across every note in the specified import batch using the associated patient's context.
 *     tags: [Old Notes Import]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: batchId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID of the import batch to process
 *     responses:
 *       200:
 *         description: AI processing results for all notes in the batch
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AiProcessResult'
 *       401:
 *         description: Unauthorized — missing or invalid token
 *       404:
 *         description: Batch not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/old-notes/batches/:batchId/process', validate(batchIdParamSchema), processBatch);

/**
 * @swagger
 * components:
 *   schemas:
 *     OldNote:
 *       type: object
 *       description: An imported legacy patient journal note
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier of the note
 *         patient_id:
 *           type: string
 *           format: uuid
 *           description: UUID of the patient this note belongs to
 *         organization_id:
 *           type: string
 *           format: uuid
 *           description: UUID of the organization that owns the note
 *         original_content:
 *           type: string
 *           description: Raw text content as originally uploaded
 *         original_filename:
 *           type: string
 *           description: Filename of the uploaded note
 *         status:
 *           type: string
 *           enum: [pending, processed, approved, rejected, needs_review]
 *           description: Current processing/review status of the note
 *         approved:
 *           type: boolean
 *           description: Whether the note has been approved by a reviewer
 *         soap_data:
 *           type: object
 *           nullable: true
 *           description: AI-extracted SOAP content
 *           properties:
 *             subjective:
 *               type: object
 *             objective:
 *               type: object
 *             assessment:
 *               type: object
 *             plan:
 *               type: object
 *         batch_id:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: UUID of the import batch this note belongs to (if any)
 *         uploaded_by:
 *           type: string
 *           format: uuid
 *           description: UUID of the user who uploaded the note
 *         reviewed_by:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: UUID of the user who reviewed the note
 *         review_notes:
 *           type: string
 *           nullable: true
 *           description: Reviewer comments
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *
 *     NoteBatch:
 *       type: object
 *       description: A batch grouping multiple imported legacy notes
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier of the batch
 *         patient_id:
 *           type: string
 *           format: uuid
 *           description: UUID of the patient the batch belongs to
 *         organization_id:
 *           type: string
 *           format: uuid
 *         batch_name:
 *           type: string
 *           nullable: true
 *           description: Human-readable label for the batch
 *         status:
 *           type: string
 *           description: Overall processing status of the batch
 *         note_count:
 *           type: integer
 *           description: Total number of notes in the batch
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *
 *     AiProcessResult:
 *       type: object
 *       description: Result returned after AI processing of a note or batch
 *       properties:
 *         success:
 *           type: boolean
 *         processed_count:
 *           type: integer
 *           description: Number of notes successfully processed
 *         failed_count:
 *           type: integer
 *           description: Number of notes that failed processing
 *         results:
 *           type: array
 *           items:
 *             type: object
 *             description: Per-note processing outcome
 *
 *     ActionableItem:
 *       type: object
 *       description: A task or action extracted from a legacy note by the AI
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         note_id:
 *           type: string
 *           format: uuid
 *           description: UUID of the source legacy note
 *         patient_id:
 *           type: string
 *           format: uuid
 *         item_type:
 *           type: string
 *           description: Category of the actionable item (e.g. referral, follow_up, test)
 *         description:
 *           type: string
 *           description: Human-readable description of the action required
 *         status:
 *           type: string
 *           description: Current status of the item (e.g. pending, in_progress, done, cancelled)
 *         completed:
 *           type: boolean
 *           description: Whether the item has been marked as complete
 *         completed_by:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         completed_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         assigned_to:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: UUID of the user assigned to this item
 *         completion_notes:
 *           type: string
 *           nullable: true
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *
 *     CommunicationHistoryEntry:
 *       type: object
 *       description: A communication event extracted from a legacy note
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         note_id:
 *           type: string
 *           format: uuid
 *           description: UUID of the source legacy note
 *         patient_id:
 *           type: string
 *           format: uuid
 *         communication_type:
 *           type: string
 *           description: Type of communication (e.g. phone, letter, email, referral)
 *         summary:
 *           type: string
 *           description: Brief summary of the communication event
 *         date:
 *           type: string
 *           format: date
 *           nullable: true
 *           description: Date the communication occurred (if extractable from source note)
 *         created_at:
 *           type: string
 *           format: date-time
 *
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Human-readable error message
 */

export default router;
