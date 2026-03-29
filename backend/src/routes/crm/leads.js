/**
 * CRM Leads Routes
 * Health check, overview, and lead management
 */

import express from 'express';
import * as crmController from '../../controllers/crm.js';
import validate from '../../middleware/validation.js';
import { asyncHandler } from '../../middleware/errorHandler.js';
import {
  listLeadsSchema,
  getLeadSchema,
  createLeadSchema,
  updateLeadSchema,
  convertLeadSchema,
} from '../../validators/crm.validators.js';

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', module: 'crm' });
});

// CRM Overview
router.get('/overview', asyncHandler(crmController.getCRMOverview));

// Leads
router.get('/leads', validate(listLeadsSchema), asyncHandler(crmController.getLeads));
router.get('/leads/pipeline', asyncHandler(crmController.getLeadPipeline));
router.get('/leads/:id', validate(getLeadSchema), asyncHandler(crmController.getLead));
router.post('/leads', validate(createLeadSchema), asyncHandler(crmController.createLead));
router.put('/leads/:id', validate(updateLeadSchema), asyncHandler(crmController.updateLead));
router.post(
  '/leads/:id/convert',
  validate(convertLeadSchema),
  asyncHandler(crmController.convertLead)
);

export default router;
