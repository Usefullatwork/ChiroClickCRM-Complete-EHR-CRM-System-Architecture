/**
 * Encounters Routes — Barrel
 * Re-exports all encounter sub-routes as a single router
 */

import express from 'express';
import { requireAuth, requireOrganization } from '../../middleware/auth.js';
import soapRoutes from './soap.js';
import examRoutes from './exams.js';
import signingRoutes from './signing.js';
import attachmentRoutes from './attachments.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireOrganization);

router.use('/', soapRoutes);
router.use('/', examRoutes);
router.use('/', signingRoutes);
router.use('/', attachmentRoutes);

export default router;
