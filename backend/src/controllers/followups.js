/**
 * Follow-ups Controller
 */

import * as followUpService from '../services/followups.js';
import * as recallEngine from '../services/recallEngine.js';
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
      dueDate: req.query.dueDate,
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
      userAgent: req.get('user-agent'),
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
      userAgent: req.get('user-agent'),
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
      userAgent: req.get('user-agent'),
    });

    res.json(followUp);
  } catch (error) {
    logger.error('Error in completeFollowUp controller:', error);
    res.status(500).json({ error: 'Failed to complete follow-up' });
  }
};

export const skipFollowUp = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const { id } = req.params;
    const { reason } = req.body;

    const followUp = await followUpService.skipFollowUp(organizationId, id, reason || '');

    await logAudit({
      organizationId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'UPDATE',
      resourceType: 'FOLLOWUP',
      resourceId: id,
      changes: { status: 'SKIPPED', reason },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({ success: true, data: followUp, message: 'Follow-up skipped' });
  } catch (error) {
    logger.error('Error in skipFollowUp controller:', error);
    res.status(500).json({ error: 'Failed to skip follow-up' });
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

export const getPatientsNeedingFollowUp = async (req, res) => {
  try {
    const { organizationId } = req;
    const patients = await followUpService.getPatientsNeedingFollowUp(organizationId);
    res.json({ success: true, data: patients });
  } catch (error) {
    logger.error('Error in getPatientsNeedingFollowUp controller:', error);
    res.status(500).json({ success: false, error: 'Failed to get patients needing follow-up' });
  }
};

export const markPatientAsContacted = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const { patientId } = req.params;
    const { method } = req.body;

    const patient = await followUpService.markPatientAsContacted(organizationId, patientId, method);

    await logAudit({
      organizationId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'UPDATE',
      resourceType: 'PATIENT',
      resourceId: patientId,
      changes: { follow_up_contacted: method },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({ success: true, data: patient });
  } catch (error) {
    logger.error('Error in markPatientAsContacted controller:', error);
    res.status(500).json({ success: false, error: 'Failed to mark patient as contacted' });
  }
};

export const getRecallSchedule = async (req, res) => {
  try {
    const { organizationId } = req;
    const { patientId } = req.params;

    const schedule = await recallEngine.getRecallSchedule(organizationId, patientId);
    res.json({ success: true, data: schedule });
  } catch (error) {
    logger.error('Error in getRecallSchedule controller:', error);
    res.status(500).json({ success: false, error: 'Failed to get recall schedule' });
  }
};

export const getRecallRules = async (req, res) => {
  try {
    const { organizationId } = req;

    const rules = await recallEngine.getRecallRules(organizationId);
    res.json({ success: true, data: rules });
  } catch (error) {
    logger.error('Error in getRecallRules controller:', error);
    res.status(500).json({ success: false, error: 'Failed to get recall rules' });
  }
};

export const updateRecallRules = async (req, res) => {
  try {
    const { organizationId } = req;
    const rules = req.body;

    const updated = await recallEngine.updateRecallRules(organizationId, rules);
    res.json({ success: true, data: updated });
  } catch (error) {
    logger.error('Error in updateRecallRules controller:', error);
    res.status(500).json({ success: false, error: 'Failed to update recall rules' });
  }
};

export default {
  getFollowUps,
  getFollowUp,
  createFollowUp,
  updateFollowUp,
  completeFollowUp,
  skipFollowUp,
  getOverdue,
  getUpcoming,
  getStats,
  getPatientsNeedingFollowUp,
  markPatientAsContacted,
  getRecallSchedule,
  getRecallRules,
  updateRecallRules,
};
