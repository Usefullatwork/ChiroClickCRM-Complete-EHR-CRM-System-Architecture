/**
 * Follow-ups Routes
 */

import express from 'express';
import * as followUpController from '../controllers/followups.js';
import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import {
  createFollowUpSchema,
  updateFollowUpSchema,
  completeFollowUpSchema,
  getFollowUpsSchema,
} from '../validators/followup.validators.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireOrganization);

/**
 * @swagger
 * /followups:
 *   get:
 *     summary: Get all follow-ups with filters
 *     tags: [Follow-ups]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, skipped]
 *       - in: query
 *         name: patientId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: dueBefore
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Follow-up list
 */
router.get(
  '/',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  validate(getFollowUpsSchema),
  followUpController.getFollowUps
);

/**
 * @swagger
 * /followups/overdue:
 *   get:
 *     summary: Get overdue follow-ups
 *     tags: [Follow-ups]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Overdue follow-ups
 */
router.get(
  '/overdue',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  followUpController.getOverdue
);

/**
 * @swagger
 * /followups/upcoming:
 *   get:
 *     summary: Get upcoming follow-ups
 *     tags: [Follow-ups]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Upcoming follow-ups
 */
router.get(
  '/upcoming',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  followUpController.getUpcoming
);

/**
 * @swagger
 * /followups/stats:
 *   get:
 *     summary: Get follow-up statistics
 *     tags: [Follow-ups]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Follow-up statistics
 */
router.get('/stats', requireRole(['ADMIN', 'PRACTITIONER']), followUpController.getStats);

/**
 * @swagger
 * /followups/patients/needingFollowUp:
 *   get:
 *     summary: Get patients needing follow-up
 *     tags: [Follow-ups]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Patients needing follow-up
 */
router.get(
  '/patients/needingFollowUp',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  followUpController.getPatientsNeedingFollowUp
);

/**
 * @swagger
 * /followups/patients/{patientId}/contacted:
 *   post:
 *     summary: Mark patient as contacted for follow-up
 *     tags: [Follow-ups]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Patient marked as contacted
 */
router.post(
  '/patients/:patientId/contacted',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  followUpController.markPatientAsContacted
);

/**
 * @swagger
 * /followups/recall-schedule/{patientId}:
 *   get:
 *     summary: Get recall schedule for a patient
 *     tags: [Follow-ups]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Patient's recall schedule
 */
router.get(
  '/recall-schedule/:patientId',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  followUpController.getRecallSchedule
);

/**
 * @swagger
 * /followups/recall-rules:
 *   get:
 *     summary: Get organization recall rules
 *     tags: [Follow-ups]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Recall rules configuration
 */
router.get(
  '/recall-rules',
  requireRole(['ADMIN', 'PRACTITIONER']),
  followUpController.getRecallRules
);

/**
 * @swagger
 * /followups/recall-rules:
 *   post:
 *     summary: Update organization recall rules
 *     tags: [Follow-ups]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Recall rules updated
 */
router.post('/recall-rules', requireRole(['ADMIN']), followUpController.updateRecallRules);

/**
 * @swagger
 * /followups/{id}:
 *   get:
 *     summary: Get follow-up by ID
 *     tags: [Follow-ups]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Follow-up details
 *       404:
 *         description: Follow-up not found
 */
router.get(
  '/:id',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  followUpController.getFollowUp
);

/**
 * @swagger
 * /followups:
 *   post:
 *     summary: Create new follow-up
 *     tags: [Follow-ups]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [patient_id, due_date, type]
 *             properties:
 *               patient_id:
 *                 type: string
 *                 format: uuid
 *               due_date:
 *                 type: string
 *                 format: date
 *               type:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Follow-up created
 */
router.post(
  '/',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  validate(createFollowUpSchema),
  followUpController.createFollowUp
);

/**
 * @swagger
 * /followups/{id}:
 *   patch:
 *     summary: Update follow-up
 *     tags: [Follow-ups]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Follow-up updated
 *       404:
 *         description: Follow-up not found
 */
router.patch(
  '/:id',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  validate(updateFollowUpSchema),
  followUpController.updateFollowUp
);

/**
 * @swagger
 * /followups/{id}/complete:
 *   post:
 *     summary: Complete a follow-up
 *     tags: [Follow-ups]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Follow-up completed
 *       404:
 *         description: Follow-up not found
 */
router.post(
  '/:id/complete',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  validate(completeFollowUpSchema),
  followUpController.completeFollowUp
);

/**
 * @swagger
 * /followups/{id}/skip:
 *   post:
 *     summary: Skip follow-up with reason
 *     tags: [Follow-ups]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Follow-up skipped
 *       404:
 *         description: Follow-up not found
 */
router.post(
  '/:id/skip',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  followUpController.skipFollowUp
);

export default router;
