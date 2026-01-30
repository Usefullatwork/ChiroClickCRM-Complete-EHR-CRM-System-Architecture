/**
 * Bulk Communication Controller
 * Handles HTTP endpoints for bulk SMS/Email operations
 */

import * as bulkCommunicationService from '../services/bulkCommunication.js';
import { logAudit } from '../utils/audit.js';
import logger from '../utils/logger.js';

/**
 * Queue bulk communications
 * POST /api/v1/bulk-communications/send
 */
export const queueBulkSend = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const {
      patientIds,
      templateId,
      type,
      scheduledAt,
      priority,
      customSubject,
      customMessage,
      clinicInfo
    } = req.body;

    // Validate required fields
    if (!patientIds || !Array.isArray(patientIds) || patientIds.length === 0) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'patientIds must be a non-empty array'
      });
    }

    if (!type || !['SMS', 'EMAIL'].includes(type.toUpperCase())) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'type must be either SMS or EMAIL'
      });
    }

    if (!templateId && !customMessage) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Either templateId or customMessage is required'
      });
    }

    // Limit batch size to prevent abuse
    if (patientIds.length > 1000) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Maximum 1000 patients per batch'
      });
    }

    const result = await bulkCommunicationService.queueBulkCommunications(
      organizationId,
      patientIds,
      templateId,
      type.toUpperCase(),
      {
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        priority: priority || 'NORMAL',
        userId: user.id,
        customSubject,
        customMessage,
        clinicInfo
      }
    );

    // Audit log
    await logAudit({
      organizationId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'CREATE',
      resourceType: 'BULK_COMMUNICATION',
      resourceId: result.batchId,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      metadata: {
        type,
        patientCount: patientIds.length,
        scheduledAt
      }
    });

    res.status(201).json({
      success: true,
      data: result,
      message: result.scheduledAt
        ? `${result.totalCount} meldinger planlagt for sending`
        : `${result.totalCount} meldinger lagt i ko for sending`
    });
  } catch (error) {
    logger.error('Error in queueBulkSend controller:', error);
    res.status(500).json({
      error: 'BulkSendError',
      message: 'Kunne ikke legge meldinger i ko',
      details: error.message
    });
  }
};

/**
 * Get batch status
 * GET /api/v1/bulk-communications/queue/status/:batchId
 */
export const getBatchStatus = async (req, res) => {
  try {
    const { organizationId } = req;
    const { batchId } = req.params;

    if (!batchId) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'batchId is required'
      });
    }

    const status = await bulkCommunicationService.getQueueStatus(organizationId, batchId);

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('Error in getBatchStatus controller:', error);

    if (error.message === 'Batch not found') {
      return res.status(404).json({
        error: 'NotFoundError',
        message: 'Batch ikke funnet'
      });
    }

    res.status(500).json({
      error: 'StatusError',
      message: 'Kunne ikke hente batch-status',
      details: error.message
    });
  }
};

/**
 * Cancel a batch
 * POST /api/v1/bulk-communications/queue/cancel/:batchId
 */
export const cancelBatch = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const { batchId } = req.params;

    if (!batchId) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'batchId is required'
      });
    }

    const result = await bulkCommunicationService.cancelBatch(organizationId, batchId);

    // Audit log
    await logAudit({
      organizationId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'UPDATE',
      resourceType: 'BULK_COMMUNICATION',
      resourceId: batchId,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      metadata: {
        action: 'CANCEL',
        cancelledItems: result.cancelledItems
      }
    });

    res.json({
      success: true,
      data: result,
      message: `Batch avbrutt. ${result.cancelledItems} ventende meldinger ble kansellert.`
    });
  } catch (error) {
    logger.error('Error in cancelBatch controller:', error);

    if (error.message === 'Batch not found') {
      return res.status(404).json({
        error: 'NotFoundError',
        message: 'Batch ikke funnet'
      });
    }

    if (error.message?.includes('Cannot cancel batch')) {
      return res.status(400).json({
        error: 'InvalidOperationError',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'CancelError',
      message: 'Kunne ikke avbryte batch',
      details: error.message
    });
  }
};

/**
 * Get pending queue items
 * GET /api/v1/bulk-communications/queue/pending
 */
export const getPendingQueue = async (req, res) => {
  try {
    const { organizationId } = req;
    const { page, limit, status, batchId } = req.query;

    const result = await bulkCommunicationService.getPendingQueue(organizationId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      status: status || null,
      batchId: batchId || null
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error in getPendingQueue controller:', error);
    res.status(500).json({
      error: 'QueueError',
      message: 'Kunne ikke hente ko-elementer',
      details: error.message
    });
  }
};

/**
 * Get all batches
 * GET /api/v1/bulk-communications/batches
 */
export const getBatches = async (req, res) => {
  try {
    const { organizationId } = req;
    const { page, limit, status } = req.query;

    const result = await bulkCommunicationService.getBatches(organizationId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      status: status || null
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error in getBatches controller:', error);
    res.status(500).json({
      error: 'BatchesError',
      message: 'Kunne ikke hente batches',
      details: error.message
    });
  }
};

/**
 * Preview personalized message
 * POST /api/v1/bulk-communications/preview
 */
export const previewMessage = async (req, res) => {
  try {
    const { organizationId } = req;
    const { patientId, templateContent, clinicInfo } = req.body;

    if (!patientId) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'patientId is required'
      });
    }

    if (!templateContent) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'templateContent is required'
      });
    }

    const result = await bulkCommunicationService.previewMessage(
      organizationId,
      patientId,
      templateContent,
      clinicInfo || {}
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error in previewMessage controller:', error);

    if (error.message === 'Patient not found') {
      return res.status(404).json({
        error: 'NotFoundError',
        message: 'Pasient ikke funnet'
      });
    }

    res.status(500).json({
      error: 'PreviewError',
      message: 'Kunne ikke forhandsvise melding',
      details: error.message
    });
  }
};

/**
 * Get available template variables
 * GET /api/v1/bulk-communications/variables
 */
export const getTemplateVariables = async (req, res) => {
  try {
    const variables = bulkCommunicationService.getAvailableVariables();

    res.json({
      success: true,
      data: variables
    });
  } catch (error) {
    logger.error('Error in getTemplateVariables controller:', error);
    res.status(500).json({
      error: 'VariablesError',
      message: 'Kunne ikke hente malvariabler',
      details: error.message
    });
  }
};

/**
 * Trigger queue processing (for admin/cron)
 * POST /api/v1/bulk-communications/process
 */
export const processQueue = async (req, res) => {
  try {
    const { batchSize } = req.body;

    const result = await bulkCommunicationService.processCommunicationQueue(
      parseInt(batchSize) || 10
    );

    res.json({
      success: true,
      data: result,
      message: `Behandlet ${result.processed} meldinger, ${result.failed} feilet`
    });
  } catch (error) {
    logger.error('Error in processQueue controller:', error);
    res.status(500).json({
      error: 'ProcessError',
      message: 'Kunne ikke behandle ko',
      details: error.message
    });
  }
};

/**
 * Get communication templates for bulk sending
 * GET /api/v1/bulk-communications/templates
 */
export const getTemplates = async (req, res) => {
  try {
    const { organizationId } = req;
    const { type } = req.query;

    // Import communications service to reuse template fetching
    const { getTemplates } = await import('../services/communications.js');
    const templates = await getTemplates(organizationId, type?.toUpperCase() || null);

    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    logger.error('Error in getTemplates controller:', error);
    res.status(500).json({
      error: 'TemplatesError',
      message: 'Kunne ikke hente maler',
      details: error.message
    });
  }
};

/**
 * Get patients with filters for bulk selection
 * GET /api/v1/bulk-communications/patients
 */
export const getPatients = async (req, res) => {
  try {
    const { organizationId } = req;
    const {
      search,
      status,
      category,
      lastVisitFrom,
      lastVisitTo,
      hasConsent,
      type,
      page,
      limit
    } = req.query;

    // Import patients service
    const { advancedSearchPatients } = await import('../services/patients.js');

    const filters = {
      q: search || null,
      status: status || 'ACTIVE',
      category: category || null,
      last_visit_from: lastVisitFrom || null,
      last_visit_to: lastVisitTo || null,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50
    };

    const result = await advancedSearchPatients(organizationId, filters);

    // Filter by consent if specified
    let patients = result.patients;
    if (hasConsent && type) {
      if (type.toUpperCase() === 'SMS') {
        patients = patients.filter(p => p.phone && p.consent_sms !== false);
      } else if (type.toUpperCase() === 'EMAIL') {
        patients = patients.filter(p => p.email && p.consent_email !== false);
      }
    }

    res.json({
      success: true,
      data: {
        patients: patients.map(p => ({
          id: p.id,
          firstName: p.first_name,
          lastName: p.last_name,
          phone: p.phone,
          email: p.email,
          status: p.status,
          category: p.category,
          lastVisitDate: p.last_visit_date,
          consentSms: p.consent_sms,
          consentEmail: p.consent_email
        })),
        pagination: result.pagination
      }
    });
  } catch (error) {
    logger.error('Error in getPatients controller:', error);
    res.status(500).json({
      error: 'PatientsError',
      message: 'Kunne ikke hente pasienter',
      details: error.message
    });
  }
};

export default {
  queueBulkSend,
  getBatchStatus,
  cancelBatch,
  getPendingQueue,
  getBatches,
  previewMessage,
  getTemplateVariables,
  processQueue,
  getTemplates,
  getPatients
};
