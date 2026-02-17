/**
 * Import Routes
 * Excel import, text parsing, and data import endpoints
 */

import express from 'express';
import multer from 'multer';
import * as importController from '../controllers/import.js';
import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js';
import validate from '../middleware/validation.js';
import {
  importPatientsExcelSchema,
  parseTextSchema,
  importPatientsFromTextSchema,
} from '../validators/import.validators.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireOrganization);

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only Excel and CSV files are allowed.'));
    }
  },
});

/**
 * @swagger
 * /import/patients/excel:
 *   post:
 *     summary: Import patients from Excel file
 *     tags: [Import]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Excel or CSV file (max 10MB)
 *     responses:
 *       200:
 *         description: Import results with success/error counts
 *       400:
 *         description: Invalid file type
 */
router.post(
  '/patients/excel',
  requireRole(['ADMIN', 'PRACTITIONER']),
  upload.single('file'),
  validate(importPatientsExcelSchema),
  importController.importPatientsExcel
);

/**
 * @swagger
 * /import/patients/template:
 *   get:
 *     summary: Download Excel import template
 *     tags: [Import]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Excel template file
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get(
  '/patients/template',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  importController.downloadTemplate
);

/**
 * @swagger
 * /import/patients/parse-text:
 *   post:
 *     summary: Parse patient data from pasted text
 *     tags: [Import]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [text]
 *             properties:
 *               text:
 *                 type: string
 *                 description: Raw text to parse for patient data
 *     responses:
 *       200:
 *         description: Parsed patient data for review
 */
router.post(
  '/patients/parse-text',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  validate(parseTextSchema),
  importController.parseText
);

/**
 * @swagger
 * /import/patients/from-text:
 *   post:
 *     summary: Import patients from parsed text data
 *     tags: [Import]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [patients]
 *             properties:
 *               patients:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Patient'
 *     responses:
 *       200:
 *         description: Import results
 */
router.post(
  '/patients/from-text',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(importPatientsFromTextSchema),
  importController.importPatientsFromText
);

export default router;
