/**
 * Mobile Clinic Routes
 * v2.1 clinic connectivity: messages, documents, appointments
 */

import express from 'express';
import { authenticateMobile, resolvePatientContext } from '../../middleware/mobileAuth.js';
import * as mobileClinic from '../../services/mobileClinic.js';

const router = express.Router();

// Logger - noop fallback avoids raw console usage
const noop = () => {};
const fallbackLogger = { info: noop, error: noop, warn: noop, debug: noop };
let logger = fallbackLogger;
try {
  const mod = await import('../../utils/logger.js');
  logger = mod.default || mod;
} catch {
  // Logger not available; structured logging disabled
}

/**
 * GET /mobile/messages — Patient's message inbox
 */
router.get('/messages', authenticateMobile, resolvePatientContext, async (req, res) => {
  try {
    const result = await mobileClinic.getMessages(
      req.mobileUser.patientId,
      req.mobileUser.organizationId,
      { page: req.query.page, limit: req.query.limit }
    );
    res.json(result);
  } catch (error) {
    if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
      return res.json({
        messages: [],
        unread_count: 0,
        pagination: { page: 1, limit: 20, total: 0 },
      });
    }
    logger.error('Error getting mobile messages:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

/**
 * POST /mobile/messages — Patient sends a message
 */
router.post('/messages', authenticateMobile, resolvePatientContext, async (req, res) => {
  try {
    const message = await mobileClinic.sendMessage(
      req.mobileUser.patientId,
      req.mobileUser.organizationId,
      req.body
    );
    res.status(201).json(message);
  } catch (error) {
    if (error.message === 'Meldingstekst er påkrevd') {
      return res.status(400).json({ error: error.message });
    }
    if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
      return res.status(503).json({ error: 'Meldingssystemet er ikke konfigurert ennå' });
    }
    logger.error('Error sending mobile message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

/**
 * PATCH /mobile/messages/:id/read — Mark message as read
 */
router.patch('/messages/:id/read', authenticateMobile, resolvePatientContext, async (req, res) => {
  try {
    await mobileClinic.markMessageRead(
      req.mobileUser.patientId,
      req.mobileUser.organizationId,
      req.params.id
    );
    res.json({ success: true });
  } catch (error) {
    if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
      return res.json({ success: true });
    }
    logger.error('Error marking mobile message read:', error);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
});

/**
 * GET /mobile/documents — List portal documents for patient
 */
router.get('/documents', authenticateMobile, resolvePatientContext, async (req, res) => {
  try {
    const result = await mobileClinic.getDocuments(
      req.mobileUser.patientId,
      req.mobileUser.organizationId
    );
    res.json(result);
  } catch (error) {
    if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
      return res.json({ documents: [] });
    }
    logger.error('Error getting mobile documents:', error);
    res.status(500).json({ error: 'Failed to get documents' });
  }
});

/**
 * GET /mobile/documents/:token/download — Token-based document download
 */
router.get('/documents/:token/download', authenticateMobile, async (req, res) => {
  try {
    const result = await mobileClinic.downloadDocument(req.params.token);

    if (result.error === 'not_found') {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (result.error === 'expired') {
      return res.status(410).json({ error: 'Download link has expired' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.buffer);
  } catch (error) {
    logger.error('Error downloading mobile document:', error);
    res.status(500).json({ error: 'Failed to download document' });
  }
});

/**
 * GET /mobile/appointments/available-slots — Available time slots
 */
router.get(
  '/appointments/available-slots',
  authenticateMobile,
  resolvePatientContext,
  async (req, res) => {
    try {
      const { date, practitioner_id } = req.query;

      if (!date) {
        return res.status(400).json({ error: 'date query parameter is required' });
      }

      const result = await mobileClinic.getAvailableSlots(
        req.mobileUser.organizationId,
        date,
        practitioner_id
      );
      res.json(result);
    } catch (error) {
      if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        return res.status(503).json({ error: 'Booking system not yet configured' });
      }
      logger.error('Error getting mobile available slots:', error);
      res.status(500).json({ error: 'Failed to get available slots' });
    }
  }
);

/**
 * POST /mobile/appointments/request — Patient requests a new appointment
 */
router.post(
  '/appointments/request',
  authenticateMobile,
  resolvePatientContext,
  async (req, res) => {
    try {
      const result = await mobileClinic.requestBooking(
        req.mobileUser.patientId,
        req.mobileUser.organizationId,
        req.body
      );
      res.status(201).json(result);
    } catch (error) {
      if (error.message === 'preferredDate is required') {
        return res.status(400).json({ error: error.message });
      }
      if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        return res.status(503).json({ error: 'Booking system not yet configured' });
      }
      logger.error('Error creating mobile booking request:', error);
      res.status(500).json({ error: 'Failed to create booking request' });
    }
  }
);

/**
 * GET /mobile/appointments/requests — List patient's booking requests
 */
router.get(
  '/appointments/requests',
  authenticateMobile,
  resolvePatientContext,
  async (req, res) => {
    try {
      const result = await mobileClinic.getBookingRequests(
        req.mobileUser.patientId,
        req.mobileUser.organizationId
      );
      res.json(result);
    } catch (error) {
      if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        return res.json({ requests: [] });
      }
      logger.error('Error getting mobile booking requests:', error);
      res.status(500).json({ error: 'Failed to get booking requests' });
    }
  }
);

export default router;
