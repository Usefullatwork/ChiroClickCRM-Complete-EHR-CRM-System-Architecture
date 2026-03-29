/**
 * Templates Routes — Barrel
 * Re-exports all template sub-routes as a single router
 */

import express from 'express';
import { authenticate } from '../../middleware/auth.js';
import clinicalRoutes from './clinical.js';
import letterRoutes from './letters.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.use('/', clinicalRoutes);
router.use('/', letterRoutes);

export default router;
