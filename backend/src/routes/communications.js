/**
 * Communications Routes
 */

import express from 'express';
import * as communicationController from '../controllers/communications.js';
import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js';
import { smsLimiter, emailLimiter, perPatientLimiter } from '../middleware/rateLimiting.js';
import validate from '../middleware/validation.js';
import {
  sendSMSSchema,
  sendEmailSchema,
  getCommunicationHistorySchema,
  createTemplateSchema,
} from '../validators/communication.validators.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireOrganization);

/**
 * @swagger
 * /communications:
 *   get:
 *     summary: Get all communications with filters
 *     tags: [Communications]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: patientId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: channel
 *         schema:
 *           type: string
 *           enum: [sms, email]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, sent, delivered, failed]
 *     responses:
 *       200:
 *         description: Communication history
 */
router.get(
  '/',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  validate(getCommunicationHistorySchema),
  communicationController.getCommunications
);

/**
 * @swagger
 * /communications/sms:
 *   post:
 *     summary: Send SMS to patient
 *     tags: [Communications]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [patientId, message]
 *             properties:
 *               patientId:
 *                 type: string
 *                 format: uuid
 *               message:
 *                 type: string
 *               templateId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: SMS sent or queued
 *       429:
 *         description: Rate limit exceeded
 */
router.post(
  '/sms',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  smsLimiter, // 10 SMS per hour per user
  perPatientLimiter, // 3 messages per patient per day
  validate(sendSMSSchema),
  communicationController.sendSMS
);

/**
 * @swagger
 * /communications/email:
 *   post:
 *     summary: Send email to patient
 *     tags: [Communications]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [patientId, subject, body]
 *             properties:
 *               patientId:
 *                 type: string
 *                 format: uuid
 *               subject:
 *                 type: string
 *               body:
 *                 type: string
 *               templateId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Email sent or queued
 *       429:
 *         description: Rate limit exceeded
 */
router.post(
  '/email',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  emailLimiter, // 20 emails per hour per user
  perPatientLimiter, // 3 messages per patient per day
  validate(sendEmailSchema),
  communicationController.sendEmail
);

/**
 * @swagger
 * /communications/templates:
 *   get:
 *     summary: Get message templates
 *     tags: [Communications]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of message templates
 */
router.get(
  '/templates',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  communicationController.getTemplates
);

/**
 * @swagger
 * /communications/templates:
 *   post:
 *     summary: Create a message template
 *     tags: [Communications]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, channel, body]
 *             properties:
 *               name:
 *                 type: string
 *               channel:
 *                 type: string
 *                 enum: [sms, email]
 *               subject:
 *                 type: string
 *               body:
 *                 type: string
 *     responses:
 *       201:
 *         description: Template created
 */
router.post(
  '/templates',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(createTemplateSchema),
  communicationController.createTemplate
);

/**
 * @swagger
 * /communications/stats:
 *   get:
 *     summary: Get communication statistics
 *     tags: [Communications]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Communication delivery statistics
 */
router.get('/stats', requireRole(['ADMIN', 'PRACTITIONER']), communicationController.getStats);

export default router;
