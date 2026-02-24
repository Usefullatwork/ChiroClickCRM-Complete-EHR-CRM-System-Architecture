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

/**
 * @swagger
 * /dashboard/revenue-trend:
 *   get:
 *     summary: Get revenue trend over time
 *     description: Returns revenue by day/week/month for a given period
 *     tags: [Dashboard]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: ['30', '90', '365']
 *           default: '30'
 *         description: Number of days to look back
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *           default: day
 *         description: Grouping interval
 *     responses:
 *       200:
 *         description: Revenue trend data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                       amount:
 *                         type: number
 *                       count:
 *                         type: integer
 */
router.get('/revenue-trend', dashboardController.getRevenueTrend);

/**
 * @swagger
 * /dashboard/utilization:
 *   get:
 *     summary: Get practitioner utilization heatmap data
 *     description: Returns appointment counts by hour-of-day and day-of-week
 *     tags: [Dashboard]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           default: '30'
 *         description: Number of days to look back
 *     responses:
 *       200:
 *         description: Utilization heatmap data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       hour:
 *                         type: integer
 *                       dayOfWeek:
 *                         type: integer
 *                       count:
 *                         type: integer
 *                       capacity:
 *                         type: integer
 *                       utilization:
 *                         type: number
 */
router.get('/utilization', dashboardController.getUtilization);

/**
 * @swagger
 * /dashboard/no-show-trend:
 *   get:
 *     summary: Get no-show rate trend over time
 *     description: Returns no-show counts and rates by week or month
 *     tags: [Dashboard]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           default: '90'
 *         description: Number of days to look back
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [week, month]
 *           default: week
 *     responses:
 *       200:
 *         description: No-show trend data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       period:
 *                         type: string
 *                       totalAppointments:
 *                         type: integer
 *                       noShows:
 *                         type: integer
 *                       rate:
 *                         type: number
 */
router.get('/no-show-trend', dashboardController.getNoShowTrend);

/**
 * @swagger
 * /dashboard/patient-flow:
 *   get:
 *     summary: Get new vs returning patient flow over time
 *     description: Returns new patients, returning patients, and total visits per period
 *     tags: [Dashboard]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           default: '90'
 *         description: Number of days to look back
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [week, month]
 *           default: week
 *     responses:
 *       200:
 *         description: Patient flow data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       period:
 *                         type: string
 *                       newPatients:
 *                         type: integer
 *                       returningPatients:
 *                         type: integer
 *                       totalVisits:
 *                         type: integer
 */
router.get('/patient-flow', dashboardController.getPatientFlow);

export default router;
