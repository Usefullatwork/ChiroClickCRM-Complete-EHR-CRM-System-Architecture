import { readFileSync, writeFileSync } from 'fs';

const BASE = 'C:/Users/MadsF/Desktop/ChiroClickCRM-Complete-EHR-CRM-System-Architecture/backend/src';

function addImportsAndWire(file, importAfter, addImports, wires) {
  let content = readFileSync(file, 'utf8');

  // Add imports after the specified line
  if (!content.includes("import validate from")) {
    const importLines = addImports.join('\n');
    content = content.replace(importAfter, importAfter + '\n' + importLines);
  }

  let wired = 0;
  for (const wire of wires) {
    if (content.includes(wire.match)) {
      content = content.replace(wire.match, wire.replace);
      wired++;
    } else {
      console.log(`  WARN: no match in ${file.split('/').pop()}: "${wire.match.substring(0, 50)}..."`);
    }
  }

  writeFileSync(file, content, 'utf8');
  console.log(`Updated: ${file.split('/').pop()} (${wired} wires)`);
  return wired;
}

let total = 0;

// APPOINTMENTS
total += addImportsAndWire(
  `${BASE}/routes/appointments.js`,
  "import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js';",
  [
    "import validate from '../middleware/validation.js';",
    "import { listAppointmentsSchema, createAppointmentSchema, getAppointmentSchema, updateAppointmentSchema, updateStatusSchema, cancelAppointmentSchema, confirmAppointmentSchema } from '../validators/appointment.validators.js';",
  ],
  [
    // GET / (list)
    { match: "requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),\n  appointmentController.getAppointments",
      replace: "requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),\n  validate(listAppointmentsSchema),\n  appointmentController.getAppointments" },
    // POST / (create) - second occurrence of same requireRole
    { match: "requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),\n  appointmentController.createAppointment",
      replace: "requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),\n  validate(createAppointmentSchema),\n  appointmentController.createAppointment" },
    // PATCH /:id/status
    { match: "requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),\n  appointmentController.updateStatus",
      replace: "requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),\n  validate(updateStatusSchema),\n  appointmentController.updateStatus" },
    // POST /:id/cancel
    { match: "requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),\n  appointmentController.cancelAppointment",
      replace: "requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),\n  validate(cancelAppointmentSchema),\n  appointmentController.cancelAppointment" },
    // GET /:id
    { match: "requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),\n  appointmentController.getAppointmentById",
      replace: "requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),\n  validate(getAppointmentSchema),\n  appointmentController.getAppointmentById" },
    // PATCH /:id
    { match: "requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),\n  appointmentController.updateAppointment",
      replace: "requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),\n  validate(updateAppointmentSchema),\n  appointmentController.updateAppointment" },
    // POST /:id/confirm
    { match: "requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),\n  appointmentController.confirmAppointment",
      replace: "requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),\n  validate(confirmAppointmentSchema),\n  appointmentController.confirmAppointment" },
    // POST /:id/check-in
    { match: "requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),\n  appointmentController.checkInAppointment",
      replace: "requireRole(['ADMIN', 'PRACTITIONER', 'ASSISTANT']),\n  validate(getAppointmentSchema),\n  appointmentController.checkInAppointment" },
  ]
);

// KPI
total += addImportsAndWire(
  `${BASE}/routes/kpi.js`,
  "import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js';",
  [
    "import validate from '../middleware/validation.js';",
    "import { dateRangeQuerySchema, importKPIDataSchema } from '../validators/kpi.validators.js';",
  ],
  [
    { match: "kpiController.importKPIData\n);", replace: "validate(importKPIDataSchema),\n  kpiController.importKPIData\n);" },
    { match: "kpiController.getDailyKPIs\n);", replace: "validate(dateRangeQuerySchema),\n  kpiController.getDailyKPIs\n);" },
    { match: "kpiController.getWeeklyKPIs\n);", replace: "validate(dateRangeQuerySchema),\n  kpiController.getWeeklyKPIs\n);" },
    { match: "kpiController.getMonthlyKPIs\n);", replace: "validate(dateRangeQuerySchema),\n  kpiController.getMonthlyKPIs\n);" },
  ]
);

// ORGANIZATIONS
total += addImportsAndWire(
  `${BASE}/routes/organizations.js`,
  "import { requireAuth, requireRole } from '../middleware/auth.js';",
  [
    "import validate from '../middleware/validation.js';",
    "import { getOrganizationSchema, createOrganizationSchema, updateOrganizationSchema, updateCurrentOrganizationSchema, inviteUserSchema, updateOrganizationSettingsSchema } from '../validators/organization.validators.js';",
  ],
  [
    { match: "organizationController.updateCurrentOrganization\n);", replace: "validate(updateCurrentOrganizationSchema),\n  organizationController.updateCurrentOrganization\n);" },
    { match: "organizationController.inviteUser\n);", replace: "validate(inviteUserSchema),\n  organizationController.inviteUser\n);" },
    { match: "organizationController.getOrganization\n);", replace: "validate(getOrganizationSchema),\n  organizationController.getOrganization\n);" },
    { match: "organizationController.createOrganization\n);", replace: "validate(createOrganizationSchema),\n  organizationController.createOrganization\n);" },
    { match: "organizationController.updateOrganization\n);", replace: "validate(updateOrganizationSchema),\n  organizationController.updateOrganization\n);" },
    { match: "organizationController.updateOrganizationSettings\n);", replace: "validate(updateOrganizationSettingsSchema),\n  organizationController.updateOrganizationSettings\n);" },
  ]
);

// GDPR
total += addImportsAndWire(
  `${BASE}/routes/gdpr.js`,
  "import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js';",
  [
    "import validate from '../middleware/validation.js';",
    "import { createGDPRRequestSchema, updateGDPRRequestStatusSchema, patientIdParamSchema, processErasureSchema, updateConsentSchema } from '../validators/gdpr.validators.js';",
  ],
  [
    { match: "gdprController.createGDPRRequest\n);", replace: "validate(createGDPRRequestSchema),\n  gdprController.createGDPRRequest\n);" },
    { match: "gdprController.updateGDPRRequestStatus\n);", replace: "validate(updateGDPRRequestStatusSchema),\n  gdprController.updateGDPRRequestStatus\n);" },
    { match: "gdprController.processDataAccess\n);", replace: "validate(patientIdParamSchema),\n  gdprController.processDataAccess\n);" },
    { match: "gdprController.processDataPortability\n);", replace: "validate(patientIdParamSchema),\n  gdprController.processDataPortability\n);" },
    { match: "gdprController.processErasure\n);", replace: "validate(processErasureSchema),\n  gdprController.processErasure\n);" },
    { match: "gdprController.updateConsent\n);", replace: "validate(updateConsentSchema),\n  gdprController.updateConsent\n);" },
    { match: "gdprController.getConsentAuditTrail\n);", replace: "validate(patientIdParamSchema),\n  gdprController.getConsentAuditTrail\n);" },
  ]
);

// COMMUNICATIONS
total += addImportsAndWire(
  `${BASE}/routes/communications.js`,
  "import { smsLimiter, emailLimiter, perPatientLimiter } from '../middleware/rateLimiting.js';",
  [
    "import validate from '../middleware/validation.js';",
    "import { sendSMSSchema, sendEmailSchema, getCommunicationHistorySchema, createTemplateSchema } from '../validators/communication.validators.js';",
  ],
  [
    { match: "communicationController.getCommunications\n);", replace: "validate(getCommunicationHistorySchema),\n  communicationController.getCommunications\n);" },
    { match: "smsLimiter, // 10 SMS per hour per user\n  perPatientLimiter, // 3 messages per patient per day\n  communicationController.sendSMS", replace: "smsLimiter, // 10 SMS per hour per user\n  perPatientLimiter, // 3 messages per patient per day\n  validate(sendSMSSchema),\n  communicationController.sendSMS" },
    { match: "emailLimiter, // 20 emails per hour per user\n  perPatientLimiter, // 3 messages per patient per day\n  communicationController.sendEmail", replace: "emailLimiter, // 20 emails per hour per user\n  perPatientLimiter, // 3 messages per patient per day\n  validate(sendEmailSchema),\n  communicationController.sendEmail" },
    { match: "communicationController.createTemplate\n);", replace: "validate(createTemplateSchema),\n  communicationController.createTemplate\n);" },
  ]
);

// AI
total += addImportsAndWire(
  `${BASE}/routes/ai.js`,
  "import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js';",
  [
    "import validate from '../middleware/validation.js';",
    "import { recordFeedbackSchema, spellCheckSchema, soapSuggestionSchema, suggestDiagnosisSchema, analyzeRedFlagsSchema, clinicalSummarySchema, outcomeFeedbackSchema, circuitResetSchema } from '../validators/ai.validators.js';",
  ],
  [
    { match: "aiController.recordFeedback\n);", replace: "validate(recordFeedbackSchema),\n  aiController.recordFeedback\n);" },
    { match: "aiController.resetCircuitBreaker\n);", replace: "validate(circuitResetSchema),\n  aiController.resetCircuitBreaker\n);" },
    { match: "aiController.spellCheck\n);", replace: "validate(spellCheckSchema),\n  aiController.spellCheck\n);" },
    { match: "aiController.generateSOAPSuggestion\n);\nrouter.post('/soap-suggestions',", replace: "validate(soapSuggestionSchema),\n  aiController.generateSOAPSuggestion\n);\nrouter.post('/soap-suggestions'," },
    { match: "aiController.suggestDiagnosis\n);", replace: "validate(suggestDiagnosisSchema),\n  aiController.suggestDiagnosis\n);" },
    { match: "aiController.analyzeRedFlags\n);", replace: "validate(analyzeRedFlagsSchema),\n  aiController.analyzeRedFlags\n);" },
    { match: "aiController.generateClinicalSummary\n);\nrouter.post('/generate-summary',", replace: "validate(clinicalSummarySchema),\n  aiController.generateClinicalSummary\n);\nrouter.post('/generate-summary'," },
    { match: "aiController.recordOutcomeFeedback\n);", replace: "validate(outcomeFeedbackSchema),\n  aiController.recordOutcomeFeedback\n);" },
  ]
);

// PDF
total += addImportsAndWire(
  `${BASE}/routes/pdf.js`,
  "import logger from '../utils/logger.js';",
  [
    "import validate from '../middleware/validation.js';",
    "import { generateLetterSchema, generateInvoiceFromMetricSchema, treatmentSummarySchema, referralLetterSchema, sickNoteSchema, generateInvoiceSchema } from '../validators/pdf.validators.js';",
  ],
  [
    { match: "pdfController.generatePatientLetter\n);", replace: "validate(generateLetterSchema),\n  pdfController.generatePatientLetter\n);" },
    { match: "pdfController.generateInvoice\n);", replace: "validate(generateInvoiceFromMetricSchema),\n  pdfController.generateInvoice\n);" },
  ]
);

// SEARCH
total += addImportsAndWire(
  `${BASE}/routes/search.js`,
  "import logger from '../utils/logger.js';",
  [
    "import validate from '../middleware/validation.js';",
    "import { searchPatientsSchema, searchDiagnosisSchema, searchEncountersSchema, globalSearchSchema, suggestSchema } from '../validators/search.validators.js';",
  ],
  [
    { match: "router.get('/patients', async", replace: "router.get('/patients', validate(searchPatientsSchema), async" },
    { match: "router.get('/diagnosis', async", replace: "router.get('/diagnosis', validate(searchDiagnosisSchema), async" },
    { match: "router.get('/encounters', async", replace: "router.get('/encounters', validate(searchEncountersSchema), async" },
    { match: "router.get('/global', async", replace: "router.get('/global', validate(globalSearchSchema), async" },
    { match: "router.get('/suggest', async", replace: "router.get('/suggest', validate(suggestSchema), async" },
  ]
);

// MACROS
total += addImportsAndWire(
  `${BASE}/routes/macros.js`,
  "import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js';",
  [
    "import validate from '../middleware/validation.js';",
    "import { searchMacrosSchema, createMacroSchema, macroIdSchema, expandMacroSchema } from '../validators/macro.validators.js';",
  ],
  [
    { match: "macroController.searchMacros\n);", replace: "validate(searchMacrosSchema),\n  macroController.searchMacros\n);" },
    { match: "macroController.createMacro);", replace: "validate(createMacroSchema), macroController.createMacro);" },
    { match: "macroController.expandMacro\n);", replace: "validate(expandMacroSchema),\n  macroController.expandMacro\n);" },
    { match: "macroController.toggleFavorite\n);", replace: "validate(macroIdSchema),\n  macroController.toggleFavorite\n);" },
    { match: "macroController.recordUsage\n);", replace: "validate(macroIdSchema),\n  macroController.recordUsage\n);" },
  ]
);

// AUTOMATIONS
total += addImportsAndWire(
  `${BASE}/routes/automations.js`,
  "import * as automationsController from '../controllers/automations.js';",
  [
    "import validate from '../middleware/validation.js';",
    "import { getWorkflowSchema, createWorkflowSchema, updateWorkflowSchema, deleteWorkflowSchema, toggleWorkflowSchema, workflowExecutionsSchema, allExecutionsSchema, testWorkflowSchema } from '../validators/automation.validators.js';",
  ],
  [
    { match: "automationsController.getWorkflowById\n);", replace: "validate(getWorkflowSchema),\n  automationsController.getWorkflowById\n);" },
    { match: "automationsController.createWorkflow\n);", replace: "validate(createWorkflowSchema),\n  automationsController.createWorkflow\n);" },
    { match: "automationsController.updateWorkflow\n);", replace: "validate(updateWorkflowSchema),\n  automationsController.updateWorkflow\n);" },
    { match: "automationsController.deleteWorkflow);", replace: "validate(deleteWorkflowSchema), automationsController.deleteWorkflow);" },
    { match: "automationsController.toggleWorkflow\n);", replace: "validate(toggleWorkflowSchema),\n  automationsController.toggleWorkflow\n);" },
    { match: "automationsController.getWorkflowExecutions\n);", replace: "validate(workflowExecutionsSchema),\n  automationsController.getWorkflowExecutions\n);" },
    { match: "automationsController.testWorkflow\n);", replace: "validate(testWorkflowSchema),\n  automationsController.testWorkflow\n);" },
  ]
);

// EXERCISES
total += addImportsAndWire(
  `${BASE}/routes/exercises.js`,
  "import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js';",
  [
    "import validate from '../middleware/validation.js';",
    "import { listExercisesSchema, createExerciseSchema, updateExerciseSchema, getExerciseSchema, createPrescriptionSchema, getPatientPrescriptionsSchema, getPrescriptionSchema, updatePrescriptionSchema, updatePrescriptionStatusSchema, createTemplateSchema as createExerciseTemplateSchema, updateTemplateSchema as updateExerciseTemplateSchema, deleteTemplateSchema } from '../validators/exercise.validators.js';",
  ],
  [
    { match: "exerciseController.getExercises\n);", replace: "validate(listExercisesSchema),\n  exerciseController.getExercises\n);" },
    { match: "exerciseController.createPrescription\n);", replace: "validate(createPrescriptionSchema),\n  exerciseController.createPrescription\n);" },
    { match: "exerciseController.getPatientPrescriptions\n);", replace: "validate(getPatientPrescriptionsSchema),\n  exerciseController.getPatientPrescriptions\n);" },
    { match: "exerciseController.getPrescriptionById\n);", replace: "validate(getPrescriptionSchema),\n  exerciseController.getPrescriptionById\n);" },
    { match: "exerciseController.updatePrescription\n);", replace: "validate(updatePrescriptionSchema),\n  exerciseController.updatePrescription\n);" },
    { match: "exerciseController.updatePrescriptionStatus\n);", replace: "validate(updatePrescriptionStatusSchema),\n  exerciseController.updatePrescriptionStatus\n);" },
    { match: "exerciseController.createExercise);", replace: "validate(createExerciseSchema), exerciseController.createExercise);" },
    { match: "exerciseController.updateExercise);", replace: "validate(updateExerciseSchema), exerciseController.updateExercise);" },
    { match: "exerciseController.getExerciseById\n);", replace: "validate(getExerciseSchema),\n  exerciseController.getExerciseById\n);" },
  ]
);

// TRAINING
total += addImportsAndWire(
  `${BASE}/routes/training.js`,
  "import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js';",
  [
    "import validate from '../middleware/validation.js';",
    "import { addExamplesSchema, testModelSchema, parseJournalEntrySchema, detectStyleSchema, combinedJournalsSchema, analyticsQuerySchema } from '../validators/training.validators.js';",
  ],
  [
    { match: "trainingController.addExamples);", replace: "validate(addExamplesSchema), trainingController.addExamples);" },
    { match: "trainingController.testModel);", replace: "validate(testModelSchema), trainingController.testModel);" },
    { match: "trainingController.parseJournalEntry);", replace: "validate(parseJournalEntrySchema), trainingController.parseJournalEntry);" },
    { match: "trainingController.detectPractitionerStyle);", replace: "validate(detectStyleSchema), trainingController.detectPractitionerStyle);" },
    { match: "trainingController.processCombinedJournals\n);", replace: "validate(combinedJournalsSchema),\n  trainingController.processCombinedJournals\n);" },
    { match: "aiAnalyticsController.getModelPerformance\n);", replace: "validate(analyticsQuerySchema),\n  aiAnalyticsController.getModelPerformance\n);" },
    { match: "aiAnalyticsController.getUsageStats\n);", replace: "validate(analyticsQuerySchema),\n  aiAnalyticsController.getUsageStats\n);" },
  ]
);

// CRM - uses different pattern (no requireRole on most routes)
total += addImportsAndWire(
  `${BASE}/routes/crm.js`,
  "import { requireAuth, requireOrganization, requireRole } from '../middleware/auth.js';",
  [
    "import validate from '../middleware/validation.js';",
    "import { listLeadsSchema, getLeadSchema, createLeadSchema, updateLeadSchema, convertLeadSchema, lifecycleQuerySchema, updateLifecycleSchema, createReferralSchema, createSurveySchema, logCommunicationSchema, createCampaignSchema, updateCampaignSchema, campaignIdSchema, createWorkflowSchema, addToWaitlistSchema, updateCRMSettingsSchema, retentionQuerySchema } from '../validators/crm.validators.js';",
  ],
  [
    { match: "router.get('/leads', crmController.getLeads);", replace: "router.get('/leads', validate(listLeadsSchema), crmController.getLeads);" },
    { match: "router.get('/leads/:id', crmController.getLead);", replace: "router.get('/leads/:id', validate(getLeadSchema), crmController.getLead);" },
    { match: "router.post('/leads', crmController.createLead);", replace: "router.post('/leads', validate(createLeadSchema), crmController.createLead);" },
    { match: "router.put('/leads/:id', crmController.updateLead);", replace: "router.put('/leads/:id', validate(updateLeadSchema), crmController.updateLead);" },
    { match: "router.post('/leads/:id/convert', crmController.convertLead);", replace: "router.post('/leads/:id/convert', validate(convertLeadSchema), crmController.convertLead);" },
    { match: "router.get('/lifecycle', crmController.getPatientsByLifecycle);", replace: "router.get('/lifecycle', validate(lifecycleQuerySchema), crmController.getPatientsByLifecycle);" },
    { match: "router.put('/lifecycle/:patientId', crmController.updatePatientLifecycle);", replace: "router.put('/lifecycle/:patientId', validate(updateLifecycleSchema), crmController.updatePatientLifecycle);" },
    { match: "router.post('/referrals', crmController.createReferral);", replace: "router.post('/referrals', validate(createReferralSchema), crmController.createReferral);" },
    { match: "router.post('/surveys', crmController.createSurvey);", replace: "router.post('/surveys', validate(createSurveySchema), crmController.createSurvey);" },
    { match: "router.post('/communications', crmController.logCommunication);", replace: "router.post('/communications', validate(logCommunicationSchema), crmController.logCommunication);" },
    { match: "router.post('/campaigns', crmController.createCampaign);", replace: "router.post('/campaigns', validate(createCampaignSchema), crmController.createCampaign);" },
    { match: "router.put('/campaigns/:id', crmController.updateCampaign);", replace: "router.put('/campaigns/:id', validate(updateCampaignSchema), crmController.updateCampaign);" },
    { match: "router.post('/campaigns/:id/launch', crmController.launchCampaign);", replace: "router.post('/campaigns/:id/launch', validate(campaignIdSchema), crmController.launchCampaign);" },
    { match: "router.post('/workflows', crmController.createWorkflow);", replace: "router.post('/workflows', validate(createWorkflowSchema), crmController.createWorkflow);" },
    { match: "router.post('/waitlist', crmController.addToWaitlist);", replace: "router.post('/waitlist', validate(addToWaitlistSchema), crmController.addToWaitlist);" },
    { match: "router.put('/settings', requireRole(['ADMIN']), crmController.updateCRMSettings);", replace: "router.put('/settings', requireRole(['ADMIN']), validate(updateCRMSettingsSchema), crmController.updateCRMSettings);" },
    { match: "router.get('/retention', crmController.getRetentionDashboard);", replace: "router.get('/retention', validate(retentionQuerySchema), crmController.getRetentionDashboard);" },
  ]
);

// TEMPLATES
total += addImportsAndWire(
  `${BASE}/routes/templates.js`,
  "import { authenticate } from '../middleware/auth.js';",
  [
    "import validate from '../middleware/validation.js';",
    "import { createTemplateSchema, updateTemplateSchema, getTemplateSchema, searchTemplatesSchema, templatesByCategorySchema, templatesForDocumentSchema, createCustomSetSchema, expandAbbreviationsSchema, abbreviateTextSchema, favoriteTemplateSchema, screenRedFlagsSchema, terminologyParamSchema, termsByCategorySchema, testClusterSchema, phrasesByRegionSchema, testByCodeSchema, preferenceFavoriteSchema } from '../validators/template.validators.js';",
  ],
  [
    { match: "router.get('/search', templateController.searchTemplates);", replace: "router.get('/search', validate(searchTemplatesSchema), templateController.searchTemplates);" },
    { match: "router.get('/by-category', templateController.getTemplatesByCategory);", replace: "router.get('/by-category', validate(templatesByCategorySchema), templateController.getTemplatesByCategory);" },
    { match: "router.get('/for-document/:type', templateController.getTemplatesForDocument);", replace: "router.get('/for-document/:type', validate(templatesForDocumentSchema), templateController.getTemplatesForDocument);" },
    { match: "router.post('/custom-set', templateController.createCustomTemplateSet);", replace: "router.post('/custom-set', validate(createCustomSetSchema), templateController.createCustomTemplateSet);" },
    { match: "router.get('/terminology/:term', templateController.getTerminology);", replace: "router.get('/terminology/:term', validate(terminologyParamSchema), templateController.getTerminology);" },
    { match: "router.post('/expand', templateController.expandAbbreviations);", replace: "router.post('/expand', validate(expandAbbreviationsSchema), templateController.expandAbbreviations);" },
    { match: "router.post('/abbreviate', templateController.abbreviateText);", replace: "router.post('/abbreviate', validate(abbreviateTextSchema), templateController.abbreviateText);" },
    { match: "router.get('/terms/:category', templateController.getTermsByCategory);", replace: "router.get('/terms/:category', validate(termsByCategorySchema), templateController.getTermsByCategory);" },
    { match: "router.get('/:id', templateController.getTemplateById);", replace: "router.get('/:id', validate(getTemplateSchema), templateController.getTemplateById);" },
    { match: "router.post('/', templateController.createTemplate);", replace: "router.post('/', validate(createTemplateSchema), templateController.createTemplate);" },
    { match: "router.patch('/:id', templateController.updateTemplate);", replace: "router.patch('/:id', validate(updateTemplateSchema), templateController.updateTemplate);" },
    { match: "router.delete('/:id', templateController.deleteTemplate);", replace: "router.delete('/:id', validate(getTemplateSchema), templateController.deleteTemplate);" },
    { match: "router.post('/:id/favorite', templateController.toggleFavorite);", replace: "router.post('/:id/favorite', validate(favoriteTemplateSchema), templateController.toggleFavorite);" },
    { match: "router.post('/red-flags/screen', templateController.screenRedFlags);", replace: "router.post('/red-flags/screen', validate(screenRedFlagsSchema), templateController.screenRedFlags);" },
    { match: "router.get('/test-clusters/:condition', templateController.getTestClusterByCondition);", replace: "router.get('/test-clusters/:condition', validate(testClusterSchema), templateController.getTestClusterByCondition);" },
    { match: "router.get('/phrases/byregion/:region', templateController.getPhrasesByRegion);", replace: "router.get('/phrases/byregion/:region', validate(phrasesByRegionSchema), templateController.getPhrasesByRegion);" },
    { match: "router.get('/tests/:code', templateController.getTestByCode);", replace: "router.get('/tests/:code', validate(testByCodeSchema), templateController.getTestByCode);" },
    { match: "router.post('/preferences/favorites/:templateId', templateController.addFavorite);", replace: "router.post('/preferences/favorites/:templateId', validate(preferenceFavoriteSchema), templateController.addFavorite);" },
    { match: "router.delete('/preferences/favorites/:templateId', templateController.removeFavorite);", replace: "router.delete('/preferences/favorites/:templateId', validate(preferenceFavoriteSchema), templateController.removeFavorite);" },
  ]
);

console.log(`\nTotal wires applied: ${total}`);
