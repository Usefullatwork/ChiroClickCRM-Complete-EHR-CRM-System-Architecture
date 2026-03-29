/**
 * Billing Routes — Barrel
 * Re-exports all billing sub-routes as a single router
 */

import express from 'express';
import { requireAuth, requireOrganization } from '../../middleware/auth.js';
import episodeRoutes from './episodes.js';
import claimRoutes from './claims.js';
import helperRoutes from './helpers.js';

const router = express.Router();

// All billing routes require authentication and organization context
router.use(requireAuth);
router.use(requireOrganization);

router.use('/', episodeRoutes);
router.use('/', claimRoutes);
router.use('/', helperRoutes);

export default router;
