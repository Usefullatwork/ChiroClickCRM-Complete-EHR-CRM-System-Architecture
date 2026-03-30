/**
 * Training Routes — Barrel
 * Re-exports all training sub-routes as a single router
 */

import express from 'express';
import { requireAuth, requireOrganization } from '../../middleware/auth.js';
import modelRoutes from './models.js';
import evaluationRoutes from './evaluation.js';
import dataRoutes from './data.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireOrganization);

router.use('/', modelRoutes);
router.use('/', evaluationRoutes);
router.use('/', dataRoutes);

export default router;
