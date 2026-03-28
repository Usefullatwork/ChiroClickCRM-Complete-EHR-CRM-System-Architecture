/**
 * PDF Controller
 */

import * as pdfService from '../services/pdf.js';
import {
  generateTreatmentSummary as genTreatmentSummary,
  generateReferralLetter as genReferralLetter,
  generateSickNote as genSickNote,
  generateInvoice as genInvoicePdf,
} from '../services/pdfGenerator.js';
import { logAudit } from '../utils/audit.js';
import logger from '../utils/logger.js';

export const generatePatientLetter = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const { encounterId } = req.params;
    const { letterType } = req.body;

    if (!['SICK_LEAVE', 'REFERRAL', 'TREATMENT_SUMMARY'].includes(letterType)) {
      return res.status(400).json({ error: 'Invalid letter type' });
    }

    const result = await pdfService.generatePatientLetter(organizationId, encounterId, letterType);

    await logAudit({
      organizationId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'GENERATE',
      resourceType: 'DOCUMENT',
      resourceId: encounterId,
      reason: `Generated ${letterType} letter`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json(result);
  } catch (error) {
    logger.error('Error in generatePatientLetter controller:', error);
    res.status(500).json({ error: 'Failed to generate patient letter' });
  }
};

export const generateInvoice = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const { financialMetricId } = req.params;

    const result = await pdfService.generateInvoice(organizationId, financialMetricId);

    await logAudit({
      organizationId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'GENERATE',
      resourceType: 'INVOICE',
      resourceId: financialMetricId,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json(result);
  } catch (error) {
    logger.error('Error in generateInvoice controller:', error);
    res.status(500).json({ error: 'Failed to generate invoice' });
  }
};

/**
 * Generate exercise handout PDF for a patient
 * GET /api/v1/patients/:patientId/exercises/pdf
 */
export const generateExerciseHandout = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const { patientId } = req.params;

    const result = await pdfService.generateExerciseHandout(organizationId, patientId);

    await logAudit({
      organizationId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'GENERATE',
      resourceType: 'EXERCISE_HANDOUT',
      resourceId: patientId,
      details: { exerciseCount: result.exerciseCount },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    // Return PDF as binary response
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.setHeader('Content-Length', result.buffer.length);
    res.send(result.buffer);
  } catch (error) {
    logger.error('Error in generateExerciseHandout controller:', error);
    res.status(500).json({ error: 'Failed to generate exercise handout' });
  }
};

/**
 * Generate treatment summary PDF
 * GET /api/v1/pdf/treatment-summary/:patientId
 */
export const generateTreatmentSummary = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { organizationId, user } = req;
    const maxEncounters = parseInt(req.query.maxEncounters, 10) || 20;

    const buffer = await genTreatmentSummary(patientId, organizationId, { maxEncounters });

    await logAudit({
      organizationId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'GENERATE',
      resourceType: 'DOCUMENT',
      resourceId: patientId,
      reason: 'Generated treatment summary PDF',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="behandlingssammendrag.pdf"');
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (error) {
    logger.error('Error generating treatment summary PDF:', error);
    if (error.message === 'Patient not found') {
      return res.status(404).json({ error: 'Patient not found' });
    }
    res.status(500).json({ error: 'Failed to generate treatment summary' });
  }
};

/**
 * Generate referral letter PDF
 * POST /api/v1/pdf/referral-letter
 */
export const generateReferralLetter = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const {
      patientId,
      encounterId,
      recipientName,
      recipientAddress,
      reasonForReferral,
      relevantFindings,
      relevantTestResults,
    } = req.body;

    if (!patientId || !encounterId) {
      return res.status(400).json({ error: 'patientId and encounterId are required' });
    }

    const buffer = await genReferralLetter({
      patientId,
      orgId: organizationId,
      encounterId,
      recipientName,
      recipientAddress,
      reasonForReferral,
      relevantFindings,
      relevantTestResults,
    });

    await logAudit({
      organizationId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'GENERATE',
      resourceType: 'DOCUMENT',
      resourceId: encounterId,
      reason: 'Generated referral letter PDF',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="henvisning.pdf"');
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (error) {
    logger.error('Error generating referral letter PDF:', error);
    if (error.message === 'Encounter not found') {
      return res.status(404).json({ error: 'Encounter not found' });
    }
    res.status(500).json({ error: 'Failed to generate referral letter' });
  }
};

/**
 * Generate sick note PDF
 * POST /api/v1/pdf/sick-note
 */
export const generateSickNote = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const {
      patientId,
      encounterId,
      diagnosisCode,
      diagnosisText,
      startDate,
      endDate,
      percentage,
      functionalAssessment,
      workRestrictions,
    } = req.body;

    if (!patientId || !encounterId) {
      return res.status(400).json({ error: 'patientId and encounterId are required' });
    }
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const buffer = await genSickNote({
      patientId,
      orgId: organizationId,
      encounterId,
      diagnosisCode,
      diagnosisText,
      startDate,
      endDate,
      percentage,
      functionalAssessment,
      workRestrictions,
    });

    await logAudit({
      organizationId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'GENERATE',
      resourceType: 'DOCUMENT',
      resourceId: patientId,
      reason: 'Generated sick note PDF',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="sykmelding.pdf"');
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (error) {
    logger.error('Error generating sick note PDF:', error);
    if (error.message === 'Patient not found') {
      return res.status(404).json({ error: 'Patient not found' });
    }
    res.status(500).json({ error: 'Failed to generate sick note' });
  }
};

/**
 * Generate invoice PDF from line items
 * POST /api/v1/pdf/invoice (new enhanced route)
 */
export const generateInvoiceFromItems = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const {
      patientId,
      invoiceNumber,
      invoiceDate,
      dueDate,
      lineItems,
      vatRate,
      accountNumber,
      kidNumber,
      insuranceCompany,
    } = req.body;

    if (!patientId) {
      return res.status(400).json({ error: 'patientId is required' });
    }
    if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
      return res.status(400).json({ error: 'lineItems array is required' });
    }

    const buffer = await genInvoicePdf({
      orgId: organizationId,
      patientId,
      invoiceNumber,
      invoiceDate,
      dueDate,
      lineItems,
      vatRate,
      accountNumber,
      kidNumber,
      insuranceCompany,
    });

    await logAudit({
      organizationId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'GENERATE',
      resourceType: 'INVOICE',
      resourceId: patientId,
      reason: `Generated invoice PDF ${invoiceNumber || ''}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="faktura-${invoiceNumber || 'ny'}.pdf"`
    );
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (error) {
    logger.error('Error generating invoice PDF:', error);
    if (error.message === 'Patient not found') {
      return res.status(404).json({ error: 'Patient not found' });
    }
    res.status(500).json({ error: 'Failed to generate invoice' });
  }
};

/**
 * Deliver a document to a patient via email/SMS
 * POST /api/v1/pdf/:type/:id/deliver
 */
export const deliverDocument = async (req, res) => {
  try {
    const { organizationId, user } = req;
    const { type, id } = req.params;
    const { patientId, method } = req.body;

    if (!patientId) {
      return res.status(400).json({ error: 'patientId is required' });
    }
    if (!['email', 'sms', 'both'].includes(method)) {
      return res.status(400).json({ error: 'method must be email, sms, or both' });
    }

    const { deliverDocument: deliver } = await import('../services/documentDelivery.js');
    const result = await deliver(organizationId, type, id, patientId, method, {
      userId: user.id,
    });

    await logAudit({
      organizationId,
      userId: user.id,
      userEmail: user.email,
      action: 'DOCUMENT_DELIVERED',
      resource: 'pdf',
      resourceId: id,
      details: { documentType: type, method, patientId: `${patientId.slice(0, 8)}...` },
    });

    return res.json(result);
  } catch (error) {
    logger.error('Document delivery failed:', { error: error.message });
    return res
      .status(error.message.includes('not found') ? 404 : 500)
      .json({ error: error.message });
  }
};

export default {
  generatePatientLetter,
  generateInvoice,
  generateExerciseHandout,
  generateTreatmentSummary,
  generateReferralLetter,
  generateSickNote,
  generateInvoiceFromItems,
  deliverDocument,
};
