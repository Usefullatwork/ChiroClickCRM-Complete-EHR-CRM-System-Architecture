/**
 * Follow-ups Controller
 */

import * as followUpService from '../services/followups.js';
import { logAudit } from '../utils/audit.js';
import logger from '../utils/logger.js';

export const getFollowUps = async (req, res) => {
  try {
    const { organizationId } = req;
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50,
      patientId: req.query.patientId,
      status: req.query.status,
      priority: req.query.priority,
      dueDate: req.query.dueDate
    };

    const result = await followUpService.getAllFollowUps(organizationId, options);
    res.json(result);
  } catch (error) {
    logger.error('Error in getFollowUps controller:', error);
    res.status(500).json({ error: 'Failed to retrieve follow-ups' });
  }
};

export const getFollowUp = async (req, res) => {
  try {
    const { organizationId } = req;
    const { id } = req.params;

    const followUp = await followUpService.getFollowUpById(organizationId, id);

    if (!followUp) {
      return res.status(404).json({ error: 'Follow-up not found' });
    }

    res.json(followUp);
  } catch (error) {
    logger.error('Error in getFollowUp controller:', error);
    res.status(500).json({ error: 'Failed to retrieve follow-up' });
  }
};

export const createFollowUp = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const followUp = await followUpService.createFollowUp(organizationId, req.body);

    await logAudit({
      organizationId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'CREATE',
      resourceType: 'FOLLOWUP',
      resourceId: followUp.id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(201).json(followUp);
  } catch (error) {
    logger.error('Error in createFollowUp controller:', error);
    res.status(500).json({ error: 'Failed to create follow-up' });
  }
};

export const updateFollowUp = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const { id } = req.params;

    const followUp = await followUpService.updateFollowUp(organizationId, id, req.body);

    await logAudit({
      organizationId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'UPDATE',
      resourceType: 'FOLLOWUP',
      resourceId: id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json(followUp);
  } catch (error) {
    logger.error('Error in updateFollowUp controller:', error);
    res.status(500).json({ error: 'Failed to update follow-up' });
  }
};

export const completeFollowUp = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const { id } = req.params;
    const { notes } = req.body;

    const followUp = await followUpService.completeFollowUp(organizationId, id, notes);

    await logAudit({
      organizationId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'UPDATE',
      resourceType: 'FOLLOWUP',
      resourceId: id,
      changes: { status: 'COMPLETED' },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json(followUp);
  } catch (error) {
    logger.error('Error in completeFollowUp controller:', error);
    res.status(500).json({ error: 'Failed to complete follow-up' });
  }
};

export const getOverdue = async (req, res) => {
  try {
    const { organizationId } = req;
    const followUps = await followUpService.getOverdueFollowUps(organizationId);
    res.json(followUps);
  } catch (error) {
    logger.error('Error in getOverdue controller:', error);
    res.status(500).json({ error: 'Failed to get overdue follow-ups' });
  }
};

export const getUpcoming = async (req, res) => {
  try {
    const { organizationId } = req;
    const days = parseInt(req.query.days) || 7;
    const followUps = await followUpService.getUpcomingFollowUps(organizationId, days);
    res.json(followUps);
  } catch (error) {
    logger.error('Error in getUpcoming controller:', error);
    res.status(500).json({ error: 'Failed to get upcoming follow-ups' });
  }
};

export const getStats = async (req, res) => {
  try {
    const { organizationId } = req;
    const stats = await followUpService.getFollowUpStats(organizationId);
    res.json(stats);
  } catch (error) {
    logger.error('Error in getStats controller:', error);
    res.status(500).json({ error: 'Failed to get follow-up statistics' });
  }
};

export default {
  getFollowUps,
  getFollowUp,
  createFollowUp,
  updateFollowUp,
  completeFollowUp,
  getOverdue,
  getUpcoming,
  getStats
};
