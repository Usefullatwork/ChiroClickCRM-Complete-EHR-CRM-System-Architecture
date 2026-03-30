/**
 * CRM Surveys Routes
 * Survey management, NPS stats, and responses
 */

import express from 'express';
import * as crmController from '../../controllers/crm.js';
import validate from '../../middleware/validation.js';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { createSurveySchema } from '../../validators/crm.validators.js';

const router = express.Router();

router.get('/surveys', asyncHandler(crmController.getSurveys));
router.get('/surveys/nps/stats', asyncHandler(crmController.getNPSStats));
router.get('/surveys/:id/responses', asyncHandler(crmController.getSurveyResponses));
router.post('/surveys', validate(createSurveySchema), asyncHandler(crmController.createSurvey));

export default router;
