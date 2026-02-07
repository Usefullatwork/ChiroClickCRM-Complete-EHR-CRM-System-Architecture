/**
 * Kiosk Controller
 * Thin controller wrapping kiosk service calls.
 */

import * as kioskService from '../services/kiosk.js';
import logger from '../utils/logger.js';

/**
 * POST /api/v1/kiosk/check-in
 */
export const checkIn = async (req, res) => {
  try {
    const { patientId, appointmentId } = req.body;

    if (!patientId || !appointmentId) {
      return res.status(400).json({ error: 'patientId and appointmentId are required' });
    }

    const result = await kioskService.checkIn(patientId, appointmentId);
    res.json({ success: true, data: result });
  } catch (error) {
    if (error.isOperational) {
      return res.status(error.statusCode).json(error.toJSON());
    }
    logger.error('Error in kiosk check-in:', error);
    res.status(500).json({ error: 'Failed to check in' });
  }
};

/**
 * GET /api/v1/kiosk/intake/:patientId
 */
export const getIntakeForm = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { encounterType } = req.query;

    const result = await kioskService.getIntakeForm(patientId, encounterType || null);
    res.json({ success: true, data: result });
  } catch (error) {
    if (error.isOperational) {
      return res.status(error.statusCode).json(error.toJSON());
    }
    logger.error('Error getting intake form:', error);
    res.status(500).json({ error: 'Failed to get intake form' });
  }
};

/**
 * POST /api/v1/kiosk/intake/:patientId
 */
export const submitIntakeForm = async (req, res) => {
  try {
    const { patientId } = req.params;

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: 'Form data is required' });
    }

    const result = await kioskService.submitIntakeForm(patientId, req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    if (error.isOperational) {
      return res.status(error.statusCode).json(error.toJSON());
    }
    logger.error('Error submitting intake form:', error);
    res.status(500).json({ error: 'Failed to submit intake form' });
  }
};

/**
 * POST /api/v1/kiosk/consent/:patientId
 */
export const submitConsent = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { consentType, signature } = req.body;

    if (!consentType || !signature) {
      return res.status(400).json({ error: 'consentType and signature are required' });
    }

    const result = await kioskService.submitConsent(patientId, consentType, signature);
    res.json({ success: true, data: result });
  } catch (error) {
    if (error.isOperational) {
      return res.status(error.statusCode).json(error.toJSON());
    }
    logger.error('Error submitting consent:', error);
    res.status(500).json({ error: 'Failed to submit consent' });
  }
};

/**
 * GET /api/v1/kiosk/queue
 */
export const getQueue = async (req, res) => {
  try {
    const practitionerId = req.query.practitionerId || req.user?.id;

    if (!practitionerId) {
      return res.status(400).json({ error: 'practitionerId is required' });
    }

    const queue = await kioskService.getQueue(practitionerId);
    res.json({ success: true, data: queue });
  } catch (error) {
    logger.error('Error getting queue:', error);
    res.status(500).json({ error: 'Failed to get queue' });
  }
};

export default {
  checkIn,
  getIntakeForm,
  submitIntakeForm,
  submitConsent,
  getQueue,
};
