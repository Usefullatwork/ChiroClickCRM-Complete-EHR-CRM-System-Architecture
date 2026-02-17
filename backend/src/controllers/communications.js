/**
 * Communications Controller
 */

import * as communicationService from '../services/communications.js';
import { logAudit } from '../utils/audit.js';
import logger from '../utils/logger.js';

export const getCommunications = async (req, res) => {
  try {
    const { organizationId } = req;
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      patientId: req.query.patientId,
      type: req.query.type,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };

    const result = await communicationService.getAllCommunications(organizationId, options);
    res.json(result);
  } catch (error) {
    logger.error('Error in getCommunications controller:', error);
    res.status(500).json({ error: 'Failed to retrieve communications' });
  }
};

export const sendSMS = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const sms = await communicationService.sendSMS(organizationId, req.body, user.id);

    await logAudit({
      organizationId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'CREATE',
      resourceType: 'COMMUNICATION',
      resourceId: sms.id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json(sms);
  } catch (error) {
    logger.error('Error in sendSMS controller:', error);
    res.status(500).json({ error: 'Failed to send SMS' });
  }
};

export const sendEmail = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const email = await communicationService.sendEmail(organizationId, req.body, user.id);

    await logAudit({
      organizationId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'CREATE',
      resourceType: 'COMMUNICATION',
      resourceId: email.id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json(email);
  } catch (error) {
    logger.error('Error in sendEmail controller:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
};

export const getTemplates = async (req, res) => {
  try {
    const { organizationId } = req;
    const templates = await communicationService.getTemplates(organizationId, req.query.type);
    res.json(templates);
  } catch (error) {
    logger.error('Error in getTemplates controller:', error);
    res.status(500).json({ error: 'Failed to retrieve templates' });
  }
};

export const createTemplate = async (req, res) => {
  try {
    const { organizationId, _user } = req;
    const template = await communicationService.createTemplate(organizationId, req.body);
    res.status(201).json(template);
  } catch (error) {
    logger.error('Error in createTemplate controller:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
};

export const getStats = async (req, res) => {
  try {
    const { organizationId } = req;
    const { startDate, endDate } = req.query;
    const stats = await communicationService.getCommunicationStats(
      organizationId,
      startDate,
      endDate
    );
    res.json(stats);
  } catch (error) {
    logger.error('Error in getStats controller:', error);
    res.status(500).json({ error: 'Failed to get communication statistics' });
  }
};

export default {
  getCommunications,
  sendSMS,
  sendEmail,
  getTemplates,
  createTemplate,
  getStats,
};
