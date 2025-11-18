/**
 * Dashboard Routes
 */

import express from 'express';
import * as dashboardController from '../controllers/dashboard.js';

const router = express.Router();

// Get dashboard statistics (today's appointments, active patients, etc.)
router.get('/stats', dashboardController.getDashboardStats);

// Get today's appointments with patient details
router.get('/appointments/today', dashboardController.getTodayAppointments);

// Get pending tasks (follow-ups due soon)
router.get('/tasks/pending', dashboardController.getPendingTasks);

export default router;
