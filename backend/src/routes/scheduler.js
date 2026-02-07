/**
 * Scheduler Routes
 * API endpoints for smart scheduling and communication scheduling
 */

import express from 'express';
import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js';
import * as schedulerService from '../services/smartScheduler.js';
import logger from '../utils/logger.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireOrganization);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', module: 'scheduler' });
});

/**
 * POST /scheduler/communications
 * Schedule a communication for a patient
 */
router.post('/communications', requireRole(['ADMIN', 'PRACTITIONER']), async (req, res) => {
  try {
    const { organizationId, user } = req;
    const result = await schedulerService.scheduleCommuncation({
      organizationId,
      ...req.body,
      createdBy: user.id,
    });
    res.status(201).json(result);
  } catch (error) {
    logger.error('Error scheduling communication:', error);
    res.status(500).json({ error: 'Failed to schedule communication' });
  }
});

/**
 * GET /scheduler/pending
 * Get pending scheduled communications
 */
router.get('/pending', requireRole(['ADMIN', 'PRACTITIONER']), async (req, res) => {
  try {
    const { organizationId } = req;
    const stats = await schedulerService.getSchedulerStats(organizationId);
    const todaysMessages = await schedulerService.getTodaysMessages(organizationId);
    res.json({ stats, todaysMessages });
  } catch (error) {
    logger.error('Error getting pending scheduled items:', error);
    res.status(500).json({ error: 'Failed to get pending items' });
  }
});

/**
 * POST /scheduler/check-conflicts
 * Check booking conflicts for a scheduled communication
 */
router.post('/check-conflicts', requireRole(['ADMIN', 'PRACTITIONER']), async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const { organizationId } = req;
    const result = await schedulerService.scheduleFollowUpAfterVisit(appointmentId, organizationId);
    res.json({ scheduled: result || [] });
  } catch (error) {
    logger.error('Error checking conflicts:', error);
    res.status(500).json({ error: 'Failed to check conflicts' });
  }
});

/**
 * GET /scheduler/decisions
 * Get items needing user approval (conflicts)
 */
router.get('/decisions', requireRole(['ADMIN', 'PRACTITIONER']), async (req, res) => {
  try {
    const { organizationId } = req;
    const decisions = await schedulerService.getPendingDecisions(organizationId);
    res.json({ decisions });
  } catch (error) {
    logger.error('Error getting decisions:', error);
    res.status(500).json({ error: 'Failed to get decisions' });
  }
});

/**
 * POST /scheduler/decisions/:id
 * Approve/reject a scheduling decision
 */
router.post('/decisions/:id', requireRole(['ADMIN', 'PRACTITIONER']), async (req, res) => {
  try {
    const { id } = req.params;
    const { decision, note } = req.body;
    const { user } = req;

    if (!['extend', 'cancel', 'send_anyway'].includes(decision)) {
      return res.status(400).json({ error: 'Invalid decision. Use: extend, cancel, send_anyway' });
    }

    const result = await schedulerService.resolveDecision(id, decision, user.id, note);
    res.json(result);
  } catch (error) {
    logger.error('Error resolving decision:', error);
    if (error.message === 'Decision not found') {
      return res.status(404).json({ error: 'Decision not found' });
    }
    res.status(500).json({ error: 'Failed to resolve decision' });
  }
});

/**
 * POST /scheduler/decisions/bulk
 * Bulk resolve scheduling decisions
 */
router.post('/decisions/bulk', requireRole(['ADMIN', 'PRACTITIONER']), async (req, res) => {
  try {
    const { decisionIds, decision } = req.body;
    const { user } = req;
    const results = await schedulerService.bulkResolveDecisions(decisionIds, decision, user.id);
    res.json({ results });
  } catch (error) {
    logger.error('Error bulk resolving decisions:', error);
    res.status(500).json({ error: 'Failed to bulk resolve decisions' });
  }
});

/**
 * GET /scheduler/rules
 * Get communication rules
 */
router.get('/rules', requireRole(['ADMIN', 'PRACTITIONER']), async (req, res) => {
  try {
    const { organizationId } = req;
    const rules = await schedulerService.getCommunicationRules(organizationId);
    res.json({ rules });
  } catch (error) {
    logger.error('Error getting rules:', error);
    res.status(500).json({ error: 'Failed to get rules' });
  }
});

/**
 * PUT /scheduler/rules/:id
 * Update a communication rule
 */
router.put('/rules/:id', requireRole(['ADMIN', 'PRACTITIONER']), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await schedulerService.updateCommunicationRule(id, req.body);
    if (!result) {
      return res.status(404).json({ error: 'Rule not found' });
    }
    res.json(result);
  } catch (error) {
    logger.error('Error updating rule:', error);
    res.status(500).json({ error: 'Failed to update rule' });
  }
});

/**
 * GET /scheduler/patient/:patientId
 * Get scheduled communications for a patient
 */
router.get('/patient/:patientId', requireRole(['ADMIN', 'PRACTITIONER']), async (req, res) => {
  try {
    const { patientId } = req.params;
    const comms = await schedulerService.getPatientScheduledComms(patientId);
    res.json({ communications: comms });
  } catch (error) {
    logger.error('Error getting patient scheduled comms:', error);
    res.status(500).json({ error: 'Failed to get patient communications' });
  }
});

/**
 * GET /scheduler/today
 * Get today's messages for review
 */
router.get('/today', requireRole(['ADMIN', 'PRACTITIONER']), async (req, res) => {
  try {
    const { organizationId } = req;
    const messages = await schedulerService.getTodaysMessages(organizationId);
    res.json({ messages });
  } catch (error) {
    logger.error("Error getting today's messages:", error);
    res.status(500).json({ error: "Failed to get today's messages" });
  }
});

/**
 * DELETE /scheduler/messages/:id
 * Cancel a scheduled message
 */
router.delete('/messages/:id', requireRole(['ADMIN', 'PRACTITIONER']), async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;
    const result = await schedulerService.cancelScheduledMessage(id, user.id);
    res.json(result);
  } catch (error) {
    logger.error('Error cancelling message:', error);
    res.status(500).json({ error: 'Failed to cancel message' });
  }
});

/**
 * POST /scheduler/send
 * Send approved messages immediately
 */
router.post('/send', requireRole(['ADMIN', 'PRACTITIONER']), async (req, res) => {
  try {
    const { organizationId } = req;
    const { messageIds } = req.body;
    const result = await schedulerService.sendApprovedMessages(organizationId, messageIds);
    res.json(result);
  } catch (error) {
    logger.error('Error sending messages:', error);
    res.status(500).json({ error: 'Failed to send messages' });
  }
});

/**
 * POST /scheduler/import
 * Import appointments from external source
 */
router.post('/import', requireRole(['ADMIN']), async (req, res) => {
  try {
    const { organizationId, user } = req;
    const { appointments, source } = req.body;
    const result = await schedulerService.importAppointments(
      organizationId,
      appointments,
      source,
      user.id
    );
    res.json(result);
  } catch (error) {
    logger.error('Error importing appointments:', error);
    res.status(500).json({ error: 'Failed to import appointments' });
  }
});

export default router;
