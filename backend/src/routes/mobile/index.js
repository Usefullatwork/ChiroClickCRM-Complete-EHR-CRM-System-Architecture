/**
 * Mobile API Routes — Index
 * Re-exports combined router from all mobile sub-route modules
 */

import express from 'express';
import authRoutes from './auth.js';
import profileRoutes from './profile.js';
import exerciseRoutes from './exercises.js';
import programRoutes from './programs.js';
import workoutRoutes from './workouts.js';
import clinicRoutes from './clinic.js';

const router = express.Router();

router.use('/', authRoutes);
router.use('/', profileRoutes);
router.use('/', exerciseRoutes);
router.use('/', programRoutes);
router.use('/', workoutRoutes);
router.use('/', clinicRoutes);

export default router;
