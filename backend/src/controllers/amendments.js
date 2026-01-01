/**
 * Encounter Amendments Controller
 * Handles HTTP requests for amendments to signed clinical encounters
 */

import * as amendmentService from '../services/amendments.js';
import { logAudit } from '../utils/audit.js';
import logger from '../utils/logger.js';

/**
 * Create amendment for signed encounter
 * POST /api/v1/encounters/:encounterId/amendments
 */
export const createAmendment = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const { encounterId } = req.params;
    const amendmentData = req.body;

    const amendment = await amendmentService.createAmendment(
      organizationId,
      encounterId,
      user.id,
      amendmentData
    );

    // Log audit
    await logAudit({
      organizationId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'CREATE',
      resourceType: 'AMENDMENT',
      resourceId: amendment.id,
      changes: { new: amendmentData },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(201).json(amendment);
  } catch (error) {
    if (error.isOperational) {
      return res.status(400).json({
        error: 'Business Logic Error',
        message: error.message
      });
    }

    logger.error('Error in createAmendment controller:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create amendment'
    });
  }
};

/**
 * Get amendments for encounter
 * GET /api/v1/encounters/:encounterId/amendments
 */
export const getAmendments = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const { encounterId } = req.params;

    const amendments = await amendmentService.getEncounterAmendments(
      organizationId,
      encounterId
    );

    // Log audit
    await logAudit({
      organizationId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'READ',
      resourceType: 'AMENDMENT',
      resourceId: encounterId,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json(amendments);
  } catch (error) {
    logger.error('Error in getAmendments controller:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve amendments'
    });
  }
};

/**
 * Sign amendment
 * POST /api/v1/encounters/:encounterId/amendments/:amendmentId/sign
 */
export const signAmendment = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const { amendmentId } = req.params;

    const signedAmendment = await amendmentService.signAmendment(
      organizationId,
      amendmentId,
      user.id
    );

    // Log audit
    await logAudit({
      organizationId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'UPDATE',
      resourceType: 'AMENDMENT',
      resourceId: amendmentId,
      reason: 'Amendment signed',
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json(signedAmendment);
  } catch (error) {
    if (error.isOperational) {
      return res.status(400).json({
        error: 'Business Logic Error',
        message: error.message
      });
    }

    logger.error('Error in signAmendment controller:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to sign amendment'
    });
  }
};

/**
 * Delete unsigned amendment
 * DELETE /api/v1/encounters/:encounterId/amendments/:amendmentId
 */
export const deleteAmendment = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const { amendmentId } = req.params;

    await amendmentService.deleteAmendment(
      organizationId,
      amendmentId,
      user.id
    );

    // Log audit
    await logAudit({
      organizationId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'DELETE',
      resourceType: 'AMENDMENT',
      resourceId: amendmentId,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(204).send();
  } catch (error) {
    if (error.isOperational) {
      return res.status(400).json({
        error: 'Business Logic Error',
        message: error.message
      });
    }

    logger.error('Error in deleteAmendment controller:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete amendment'
    });
  }
};

export default {
  createAmendment,
  getAmendments,
  signAmendment,
  deleteAmendment
};
