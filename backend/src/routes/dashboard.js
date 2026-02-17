/**
 * Dashboard Routes
 */

import express from 'express';
import * as dashboardController from '../controllers/dashboard.js';

const router = express.Router();

/**
 * @swagger
 * /dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     description: Returns today's appointments count, active patients, pending tasks, etc.
 *     tags: [Dashboard]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 */
router.get('/stats', dashboardController.getDashboardStats);

/**
 * @swagger
 * /dashboard/appointments/today:
 *   get:
 *     summary: Get today's appointments with patient details
 *     tags: [Dashboard]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Today's appointments list
 */
router.get('/appointments/today', dashboardController.getTodayAppointments);

/**
 * @swagger
 * /dashboard/tasks/pending:
 *   get:
 *     summary: Get pending tasks and follow-ups due soon
 *     tags: [Dashboard]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Pending tasks list
 */
router.get('/tasks/pending', dashboardController.getPendingTasks);

export default router;
