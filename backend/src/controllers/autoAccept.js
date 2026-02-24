/**
 * Auto-Accept Controller
 * Wraps the autoAccept service for route handlers
 */

import * as autoAcceptService from '../services/autoAccept.js';
import logger from '../utils/logger.js';

/**
 * Get auto-accept settings for the organization
 */
export const getSettings = async (req, res) => {
  try {
    const settings = await autoAcceptService.getSettings(req.organizationId);
    res.json({ settings: settings || {} });
  } catch (error) {
    logger.error('Error getting auto-accept settings:', error);
    res.status(500).json({ error: 'Failed to get auto-accept settings' });
  }
};

/**
 * Create or update auto-accept settings
 */
export const upsertSettings = async (req, res) => {
  try {
    const settings = await autoAcceptService.upsertSettings(
      req.organizationId,
      req.user.id,
      req.body
    );
    res.json({ settings });
  } catch (error) {
    logger.error('Error saving auto-accept settings:', error);
    res.status(500).json({ error: 'Failed to save auto-accept settings' });
  }
};

/**
 * Get auto-accept log with optional filters
 */
export const getLog = async (req, res) => {
  try {
    const { resourceType, action, limit, offset } = req.query;
    const log = await autoAcceptService.getAutoAcceptLog(req.organizationId, {
      resourceType,
      action,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    });
    res.json({ log });
  } catch (error) {
    logger.error('Error getting auto-accept log:', error);
    res.status(500).json({ error: 'Failed to get auto-accept log' });
  }
};

/**
 * Evaluate a pending appointment against auto-accept rules
 */
export const evaluateAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    if (!appointmentId) {
      return res.status(400).json({ error: 'appointmentId is required' });
    }

    const result = await autoAcceptService.autoAcceptAppointment(req.organizationId, appointmentId);
    res.json(result);
  } catch (error) {
    logger.error('Error evaluating appointment for auto-accept:', error);
    res.status(500).json({ error: 'Failed to evaluate appointment' });
  }
};

/**
 * Toggle auto-accept for appointments on/off
 */
export const toggleAppointments = async (req, res) => {
  try {
    const current = await autoAcceptService.getSettings(req.organizationId);
    const newState = !current?.auto_accept_appointments;

    const settings = await autoAcceptService.upsertSettings(req.organizationId, req.user.id, {
      ...(current || {}),
      autoAcceptAppointments: newState,
    });
    res.json({ settings, enabled: newState });
  } catch (error) {
    logger.error('Error toggling auto-accept appointments:', error);
    res.status(500).json({ error: 'Failed to toggle auto-accept' });
  }
};

/**
 * Toggle auto-accept for referrals on/off
 */
export const toggleReferrals = async (req, res) => {
  try {
    const current = await autoAcceptService.getSettings(req.organizationId);
    const newState = !current?.auto_accept_referrals;

    const settings = await autoAcceptService.upsertSettings(req.organizationId, req.user.id, {
      ...(current || {}),
      autoAcceptReferrals: newState,
    });
    res.json({ settings, enabled: newState });
  } catch (error) {
    logger.error('Error toggling auto-accept referrals:', error);
    res.status(500).json({ error: 'Failed to toggle auto-accept' });
  }
};

/**
 * Process all pending appointments (manual trigger)
 */
export const processPending = async (req, res) => {
  try {
    await autoAcceptService.processPendingAppointments();
    await autoAcceptService.processPendingReferrals();
    res.json({ success: true, message: 'Pending items processed' });
  } catch (error) {
    logger.error('Error processing pending auto-accept:', error);
    res.status(500).json({ error: 'Failed to process pending items' });
  }
};
