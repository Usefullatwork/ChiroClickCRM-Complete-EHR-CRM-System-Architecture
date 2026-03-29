/**
 * CRM Lifecycle Routes
 * Patient lifecycle stages, referrals, and communications
 */

import express from 'express';
import * as crmController from '../../controllers/crm.js';
import validate from '../../middleware/validation.js';
import { asyncHandler } from '../../middleware/errorHandler.js';
import {
  lifecycleQuerySchema,
  updateLifecycleSchema,
  createReferralSchema,
  logCommunicationSchema,
} from '../../validators/crm.validators.js';

const router = express.Router();

// Patient Lifecycle
router.get(
  '/lifecycle',
  validate(lifecycleQuerySchema),
  asyncHandler(crmController.getPatientsByLifecycle)
);
router.get('/lifecycle/stats', asyncHandler(crmController.getLifecycleStats));
router.put(
  '/lifecycle/:patientId',
  validate(updateLifecycleSchema),
  asyncHandler(crmController.updatePatientLifecycle)
);

// Referrals
router.get('/referrals', asyncHandler(crmController.getReferrals));
router.get('/referrals/stats', asyncHandler(crmController.getReferralStats));
router.post(
  '/referrals',
  validate(createReferralSchema),
  asyncHandler(crmController.createReferral)
);
router.put('/referrals/:id', asyncHandler(crmController.updateReferral));

// Communications
router.get('/communications', asyncHandler(crmController.getCommunications));
router.post(
  '/communications',
  validate(logCommunicationSchema),
  asyncHandler(crmController.logCommunication)
);

export default router;
