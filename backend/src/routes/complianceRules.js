/**
 * Compliance Rules Routes
 * CRUD endpoints for configurable compliance rules
 */

import express from 'express';
import * as complianceRulesController from '../controllers/complianceRules.js';
import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js';
import validate from '../middleware/validation.js';
import Joi from 'joi';

const router = express.Router();

router.use(requireAuth);
router.use(requireOrganization);

const createRuleSchema = {
  body: Joi.object({
    rule_type: Joi.string()
      .valid('treatment_qualifier', 'diagnosis_treatment', 'red_flag', 'time_requirement')
      .required(),
    rule_key: Joi.string().min(1).max(100).required(),
    rule_config: Joi.object().required(),
    severity: Joi.string().valid('critical', 'high', 'medium', 'low').default('medium'),
  }),
};

const updateRuleSchema = {
  params: Joi.object({ id: Joi.string().uuid().required() }),
  body: Joi.object({
    rule_config: Joi.object(),
    is_active: Joi.boolean(),
    severity: Joi.string().valid('critical', 'high', 'medium', 'low'),
  }).min(1),
};

const ruleIdSchema = {
  params: Joi.object({ id: Joi.string().uuid().required() }),
};

/**
 * @swagger
 * /compliance-rules:
 *   get:
 *     summary: Get compliance rules for the organization
 *     tags: [Compliance Rules]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: rule_type
 *         schema:
 *           type: string
 *       - in: query
 *         name: active_only
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of compliance rules
 */
router.get(
  '/',
  requireRole(['ADMIN', 'PRACTITIONER']),
  complianceRulesController.getComplianceRules
);

/**
 * @swagger
 * /compliance-rules:
 *   post:
 *     summary: Create a compliance rule
 *     tags: [Compliance Rules]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       201:
 *         description: Rule created
 */
router.post(
  '/',
  requireRole(['ADMIN']),
  validate(createRuleSchema),
  complianceRulesController.createComplianceRule
);

/**
 * @swagger
 * /compliance-rules/{id}:
 *   patch:
 *     summary: Update a compliance rule
 *     tags: [Compliance Rules]
 *     responses:
 *       200:
 *         description: Rule updated
 */
router.patch(
  '/:id',
  requireRole(['ADMIN']),
  validate(updateRuleSchema),
  complianceRulesController.updateComplianceRule
);

/**
 * @swagger
 * /compliance-rules/{id}:
 *   delete:
 *     summary: Delete a compliance rule
 *     tags: [Compliance Rules]
 *     responses:
 *       200:
 *         description: Rule deleted
 */
router.delete(
  '/:id',
  requireRole(['ADMIN']),
  validate(ruleIdSchema),
  complianceRulesController.deleteComplianceRule
);

export default router;
