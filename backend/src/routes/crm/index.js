/**
 * CRM Routes — Barrel
 * Re-exports all CRM sub-routes as a single router
 */

import express from 'express';
import { requireAuth, requireOrganization } from '../../middleware/auth.js';
import { requireModule } from '../../middleware/featureGate.js';
import leadRoutes from './leads.js';
import lifecycleRoutes from './lifecycle.js';
import surveyRoutes from './surveys.js';
import campaignRoutes from './campaigns.js';

const router = express.Router();

// All CRM routes require authentication, organization context, and CRM module
router.use(requireAuth);
router.use(requireOrganization);
router.use(requireModule('crm_marketing'));

router.use('/', leadRoutes);
router.use('/', lifecycleRoutes);
router.use('/', surveyRoutes);
router.use('/', campaignRoutes);

export default router;
