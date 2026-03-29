/**
 * Billing Claims Routes
 * Claims CRUD, submission, remittance, appeals, and write-offs
 */

import express from 'express';
import * as claimsService from '../../services/practice/claims.js';
import { requireRole } from '../../middleware/auth.js';
import validate from '../../middleware/validation.js';
import { logAction } from '../../services/practice/auditLog.js';
import {
  listClaimsSchema,
  createClaimSchema,
  getClaimSchema,
  updateClaimLineItemsSchema,
  submitClaimSchema,
  processRemittanceSchema,
  appealClaimSchema,
  writeOffClaimSchema,
} from '../../validators/billing.validators.js';
import logger from '../../utils/logger.js';

const router = express.Router();

/**
 * @swagger
 * /billing/claims:
 *   get:
 *     summary: List claims with filters and pagination
 *     tags: [Billing]
 */
router.get(
  '/claims',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(listClaimsSchema),
  async (req, res) => {
    try {
      const result = await claimsService.getClaims(req.organizationId, {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 50,
        status: req.query.status,
        patient_id: req.query.patient_id,
        payer_id: req.query.payer_id,
        start_date: req.query.start_date,
        end_date: req.query.end_date,
      });
      res.json(result);
      await logAction('BILLING_CLAIM_LIST', req.user.id, {
        resourceType: 'billing_claim',
        metadata: {
          organization_id: req.user.organization_id,
          filters: {
            status: req.query.status,
            patient_id: req.query.patient_id,
            start_date: req.query.start_date,
            end_date: req.query.end_date,
          },
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        success: true,
      });
    } catch (error) {
      logger.error('Get claims error:', error);
      res.status(500).json({ error: 'Failed to retrieve claims', message: error.message });
    }
  }
);

/**
 * @swagger
 * /billing/claims:
 *   post:
 *     summary: Create a new billing claim
 *     tags: [Billing]
 */
router.post(
  '/claims',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(createClaimSchema),
  async (req, res) => {
    try {
      const claim = await claimsService.createClaim(req.organizationId, req.body);
      res.status(201).json(claim);
      await logAction('BILLING_CLAIM_CREATE', req.user.id, {
        resourceType: 'billing_claim',
        resourceId: claim?.id,
        changes: { patient_id: req.body.patient_id, encounter_id: req.body.encounter_id },
        metadata: { organization_id: req.user.organization_id },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        success: true,
      });
    } catch (error) {
      logger.error('Create claim error:', error);
      res.status(400).json({ error: 'Failed to create claim', message: error.message });
    }
  }
);

/**
 * @swagger
 * /billing/claims/summary:
 *   get:
 *     summary: Get claims summary grouped by status
 *     tags: [Billing]
 */
router.get('/claims/summary', async (req, res) => {
  try {
    const summary = await claimsService.getClaimsSummary(req.organizationId);
    res.json(summary);
    await logAction('BILLING_CLAIM_SUMMARY_READ', req.user.id, {
      resourceType: 'billing_claim',
      metadata: { organization_id: req.user.organization_id },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      success: true,
    });
  } catch (error) {
    logger.error('Get claims summary error:', error);
    res.status(500).json({ error: 'Failed to retrieve summary', message: error.message });
  }
});

/**
 * @swagger
 * /billing/claims/outstanding:
 *   get:
 *     summary: Get outstanding (unpaid) claims
 *     tags: [Billing]
 */
router.get('/claims/outstanding', async (req, res) => {
  try {
    const claims = await claimsService.getOutstandingClaims(req.organizationId);
    res.json(claims);
    await logAction('BILLING_CLAIM_OUTSTANDING_READ', req.user.id, {
      resourceType: 'billing_claim',
      metadata: { organization_id: req.user.organization_id },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      success: true,
    });
  } catch (error) {
    logger.error('Get outstanding claims error:', error);
    res.status(500).json({ error: 'Failed to retrieve claims', message: error.message });
  }
});

/**
 * @swagger
 * /billing/claims/{claimId}:
 *   get:
 *     summary: Get claim details by ID
 *     tags: [Billing]
 */
router.get(
  '/claims/:claimId',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(getClaimSchema),
  async (req, res) => {
    try {
      const claim = await claimsService.getClaimById(req.organizationId, req.params.claimId);
      if (!claim) {
        return res.status(404).json({ error: 'Claim not found' });
      }
      res.json(claim);
      await logAction('BILLING_CLAIM_READ', req.user.id, {
        resourceType: 'billing_claim',
        resourceId: req.params.claimId,
        metadata: { organization_id: req.user.organization_id },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        success: true,
      });
    } catch (error) {
      logger.error('Get claim error:', error);
      res.status(500).json({ error: 'Failed to retrieve claim', message: error.message });
    }
  }
);

/**
 * @swagger
 * /billing/claims/{claimId}/line-items:
 *   put:
 *     summary: Update claim line items
 *     tags: [Billing]
 */
router.put(
  '/claims/:claimId/line-items',
  validate(updateClaimLineItemsSchema),
  async (req, res) => {
    try {
      const claim = await claimsService.updateClaimLineItems(
        req.organizationId,
        req.params.claimId,
        req.body.line_items
      );
      res.json(claim);
      await logAction('BILLING_CLAIM_LINE_ITEMS_UPDATE', req.user.id, {
        resourceType: 'billing_claim',
        resourceId: req.params.claimId,
        changes: { line_items: req.body.line_items },
        metadata: { organization_id: req.user.organization_id },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        success: true,
      });
    } catch (error) {
      logger.error('Update line items error:', error);
      res.status(400).json({ error: 'Failed to update line items', message: error.message });
    }
  }
);

/**
 * @swagger
 * /billing/claims/{claimId}/submit:
 *   post:
 *     summary: Submit claim for processing
 *     tags: [Billing]
 */
router.post(
  '/claims/:claimId/submit',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(submitClaimSchema),
  async (req, res) => {
    try {
      const claim = await claimsService.submitClaim(
        req.organizationId,
        req.params.claimId,
        req.user.id
      );
      res.json(claim);
      await logAction('BILLING_CLAIM_SUBMIT', req.user.id, {
        resourceType: 'billing_claim',
        resourceId: req.params.claimId,
        metadata: { organization_id: req.user.organization_id, submitted_by: req.user.id },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        success: true,
      });
    } catch (error) {
      logger.error('Submit claim error:', error);
      res.status(400).json({ error: 'Failed to submit claim', message: error.message });
    }
  }
);

/**
 * @swagger
 * /billing/claims/{claimId}/remittance:
 *   post:
 *     summary: Process payment/remittance for a claim
 *     tags: [Billing]
 */
router.post(
  '/claims/:claimId/remittance',
  requireRole(['ADMIN']),
  validate(processRemittanceSchema),
  async (req, res) => {
    try {
      const claim = await claimsService.processRemittance(
        req.organizationId,
        req.params.claimId,
        req.body
      );
      res.json(claim);
      await logAction('BILLING_CLAIM_REMITTANCE', req.user.id, {
        resourceType: 'billing_claim',
        resourceId: req.params.claimId,
        changes: { amount_paid: req.body.amount_paid, payment_date: req.body.payment_date },
        metadata: { organization_id: req.user.organization_id },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        success: true,
      });
    } catch (error) {
      logger.error('Process remittance error:', error);
      res.status(400).json({ error: 'Failed to process remittance', message: error.message });
    }
  }
);

/**
 * @swagger
 * /billing/claims/{claimId}/appeal:
 *   post:
 *     summary: Appeal a denied claim
 *     tags: [Billing]
 */
router.post(
  '/claims/:claimId/appeal',
  requireRole(['ADMIN', 'PRACTITIONER']),
  validate(appealClaimSchema),
  async (req, res) => {
    try {
      const claim = await claimsService.appealClaim(
        req.organizationId,
        req.params.claimId,
        req.body
      );
      res.json(claim);
      await logAction('BILLING_CLAIM_APPEAL', req.user.id, {
        resourceType: 'billing_claim',
        resourceId: req.params.claimId,
        changes: { reason: req.body.reason },
        metadata: { organization_id: req.user.organization_id },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        success: true,
      });
    } catch (error) {
      logger.error('Appeal claim error:', error);
      res.status(400).json({ error: 'Failed to appeal claim', message: error.message });
    }
  }
);

/**
 * @swagger
 * /billing/claims/{claimId}/write-off:
 *   post:
 *     summary: Write off an uncollectable claim
 *     tags: [Billing]
 */
router.post(
  '/claims/:claimId/write-off',
  requireRole(['ADMIN']),
  validate(writeOffClaimSchema),
  async (req, res) => {
    try {
      const claim = await claimsService.writeOffClaim(
        req.organizationId,
        req.params.claimId,
        req.body.reason
      );
      res.json(claim);
      await logAction('BILLING_CLAIM_WRITE_OFF', req.user.id, {
        resourceType: 'billing_claim',
        resourceId: req.params.claimId,
        changes: { reason: req.body.reason },
        metadata: { organization_id: req.user.organization_id },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        success: true,
      });
    } catch (error) {
      logger.error('Write off claim error:', error);
      res.status(400).json({ error: 'Failed to write off claim', message: error.message });
    }
  }
);

export default router;
