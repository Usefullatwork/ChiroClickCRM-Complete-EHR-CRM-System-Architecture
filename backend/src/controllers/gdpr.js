/**
 * GDPR Controller
 */

import * as gdprService from '../services/gdpr.js';
import { logAudit } from '../utils/audit.js';
import logger from '../utils/logger.js';

export const getGDPRRequests = async (req, res) => {
  try {
    const { organizationId } = req;
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50,
      status: req.query.status,
      requestType: req.query.requestType
    };

    const result = await gdprService.getAllGDPRRequests(organizationId, options);
    res.json(result);
  } catch (error) {
    logger.error('Error in getGDPRRequests controller:', error);
    res.status(500).json({ error: 'Failed to retrieve GDPR requests' });
  }
};

export const createGDPRRequest = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const request = await gdprService.createGDPRRequest(organizationId, req.body);

    await logAudit({
      organizationId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'CREATE',
      resourceType: 'GDPR_REQUEST',
      resourceId: request.id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(201).json(request);
  } catch (error) {
    logger.error('Error in createGDPRRequest controller:', error);
    res.status(500).json({ error: 'Failed to create GDPR request' });
  }
};

export const processDataAccess = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const { patientId } = req.params;

    const data = await gdprService.processDataAccessRequest(organizationId, patientId);

    await logAudit({
      organizationId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'EXPORT',
      resourceType: 'PATIENT',
      resourceId: patientId,
      reason: 'GDPR Article 15 - Right to Access',
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json(data);
  } catch (error) {
    logger.error('Error in processDataAccess controller:', error);
    res.status(500).json({ error: 'Failed to process data access request' });
  }
};

export const processDataPortability = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const { patientId } = req.params;

    const data = await gdprService.processDataPortabilityRequest(organizationId, patientId);

    await logAudit({
      organizationId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'EXPORT',
      resourceType: 'PATIENT',
      resourceId: patientId,
      reason: 'GDPR Article 20 - Right to Data Portability',
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    // Set headers for download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="patient_data_${patientId}.json"`);
    res.json(data);
  } catch (error) {
    logger.error('Error in processDataPortability controller:', error);
    res.status(500).json({ error: 'Failed to process data portability request' });
  }
};

export const processErasure = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const { requestId } = req.params;

    // Get request details
    const requests = await gdprService.getAllGDPRRequests(organizationId, {});
    const request = requests.requests.find(r => r.id === requestId);

    if (!request) {
      return res.status(404).json({ error: 'GDPR request not found' });
    }

    const result = await gdprService.processErasureRequest(
      organizationId,
      request.patient_id,
      requestId
    );

    await logAudit({
      organizationId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'DELETE',
      resourceType: 'PATIENT',
      resourceId: request.patient_id,
      reason: 'GDPR Article 17 - Right to Erasure',
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json(result);
  } catch (error) {
    logger.error('Error in processErasure controller:', error);
    res.status(500).json({ error: 'Failed to process erasure request' });
  }
};

export const updateConsent = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const { patientId } = req.params;

    const patient = await gdprService.updateConsent(organizationId, patientId, req.body);

    await logAudit({
      organizationId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'UPDATE',
      resourceType: 'PATIENT',
      resourceId: patientId,
      changes: req.body,
      reason: 'Consent preferences updated',
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json(patient);
  } catch (error) {
    logger.error('Error in updateConsent controller:', error);
    res.status(500).json({ error: 'Failed to update consent' });
  }
};

export const getConsentAuditTrail = async (req, res) => {
  try {
    const { organizationId } = req;
    const { patientId } = req.params;

    const trail = await gdprService.getConsentAuditTrail(organizationId, patientId);
    res.json(trail);
  } catch (error) {
    logger.error('Error in getConsentAuditTrail controller:', error);
    res.status(500).json({ error: 'Failed to get consent audit trail' });
  }
};

export const updateGDPRRequestStatus = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const { requestId } = req.params;
    const { status, response } = req.body;

    const request = await gdprService.updateGDPRRequestStatus(
      organizationId,
      requestId,
      status,
      response
    );

    await logAudit({
      organizationId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'UPDATE',
      resourceType: 'GDPR_REQUEST',
      resourceId: requestId,
      changes: { status, response },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json(request);
  } catch (error) {
    logger.error('Error in updateGDPRRequestStatus controller:', error);
    res.status(500).json({ error: 'Failed to update GDPR request status' });
  }
};

export default {
  getGDPRRequests,
  createGDPRRequest,
  processDataAccess,
  processDataPortability,
  processErasure,
  updateConsent,
  getConsentAuditTrail,
  updateGDPRRequestStatus
};
