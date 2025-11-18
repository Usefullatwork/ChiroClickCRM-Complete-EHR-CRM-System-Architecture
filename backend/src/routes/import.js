/**
 * Import Routes
 * Excel import, text parsing, and data import endpoints
 */

import express from 'express';
import multer from 'multer';
import * as importController from '../controllers/import.js';
import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireOrganization);

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only Excel and CSV files are allowed.'));
    }
  }
});

/**
 * @route   POST /api/v1/import/patients/excel
 * @desc    Import patients from Excel file
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.post('/patients/excel',
  requireRole(['ADMIN', 'PRACTITIONER']),
  upload.single('file'),
  importController.importPatientsExcel
);

/**
 * @route   GET /api/v1/import/patients/template
 * @desc    Download Excel import template
 * @access  Private (ADMIN, PRACTITIONER, ASSISTANT)
 */
router.get('/patients/template',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  importController.downloadTemplate
);

/**
 * @route   POST /api/v1/import/patients/parse-text
 * @desc    Parse patient data from pasted text
 * @access  Private (ADMIN, PRACTITIONER, ASSISTANT)
 */
router.post('/patients/parse-text',
  requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),
  importController.parseText
);

/**
 * @route   POST /api/v1/import/patients/from-text
 * @desc    Import patients from parsed text data
 * @access  Private (ADMIN, PRACTITIONER)
 */
router.post('/patients/from-text',
  requireRole(['ADMIN', 'PRACTITIONER']),
  importController.importPatientsFromText
);

export default router;
