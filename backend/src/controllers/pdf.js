/**
 * PDF Controller
 */

import * as pdfService from '../services/pdf.js';
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
      userAgent: req.get('user-agent')
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
      userAgent: req.get('user-agent')
    });

    res.json(result);
  } catch (error) {
    logger.error('Error in generateInvoice controller:', error);
    res.status(500).json({ error: 'Failed to generate invoice' });
  }
};

export default {
  generatePatientLetter,
  generateInvoice
};
