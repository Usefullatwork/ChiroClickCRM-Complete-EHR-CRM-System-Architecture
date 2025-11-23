/**
 * Structured Examination Routes
 * API endpoints for examination protocols and findings management
 */

import express from 'express';
import * as examinationController from '../controllers/examinations.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// ============================================================================
// EXAMINATION PROTOCOLS
// ============================================================================

// GET /api/v1/examinations/protocols/body-regions
router.get('/protocols/body-regions', examinationController.getBodyRegions);

// GET /api/v1/examinations/protocols/categories
router.get('/protocols/categories', examinationController.getCategories);

// GET /api/v1/examinations/protocols/search
router.get('/protocols/search', examinationController.searchProtocols);

// GET /api/v1/examinations/protocols/by-region/:region
router.get('/protocols/by-region/:region', examinationController.getProtocolsByRegion);

// GET /api/v1/examinations/protocols/by-category/:category
router.get('/protocols/by-category/:category', examinationController.getProtocolsByCategory);

// GET /api/v1/examinations/protocols
router.get('/protocols', examinationController.getAllProtocols);

// GET /api/v1/examinations/protocols/:id
router.get('/protocols/:id', examinationController.getProtocolById);

// ============================================================================
// EXAMINATION FINDINGS
// ============================================================================

// GET /api/v1/examinations/findings/encounter/:encounterId
router.get('/findings/encounter/:encounterId', examinationController.getFindingsByEncounter);

// GET /api/v1/examinations/findings/:id
router.get('/findings/:id', examinationController.getFindingById);

// POST /api/v1/examinations/findings
router.post('/findings', examinationController.createFinding);

// PATCH /api/v1/examinations/findings/:id
router.patch('/findings/:id', examinationController.updateFinding);

// DELETE /api/v1/examinations/findings/:id
router.delete('/findings/:id', examinationController.deleteFinding);

// POST /api/v1/examinations/findings/batch
router.post('/findings/batch', examinationController.createBatchFindings);

// ============================================================================
// EXAMINATION SUMMARIES & RED FLAGS
// ============================================================================

// GET /api/v1/examinations/summary/:encounterId
router.get('/summary/:encounterId', examinationController.getExaminationSummary);

// GET /api/v1/examinations/red-flags/:encounterId
router.get('/red-flags/:encounterId', examinationController.getRedFlags);

// ============================================================================
// EXAMINATION TEMPLATE SETS
// ============================================================================

// GET /api/v1/examinations/template-sets
router.get('/template-sets', examinationController.getAllTemplateSets);

// GET /api/v1/examinations/template-sets/by-complaint/:complaint
router.get('/template-sets/by-complaint/:complaint', examinationController.getTemplateSetsByComplaint);

// GET /api/v1/examinations/template-sets/:id
router.get('/template-sets/:id', examinationController.getTemplateSetById);

// POST /api/v1/examinations/template-sets
router.post('/template-sets', examinationController.createTemplateSet);

// POST /api/v1/examinations/template-sets/:id/use
router.post('/template-sets/:id/use', examinationController.incrementTemplateSetUsage);

export default router;
