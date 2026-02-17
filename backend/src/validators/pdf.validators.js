/**
 * PDF Validation Schemas
 */

import Joi from 'joi';

const uuidSchema = Joi.string().uuid();
const _dateSchema = Joi.date().iso();

/**
 * Generate patient letter validation
 */
export const generateLetterSchema = {
  params: Joi.object({
    encounterId: uuidSchema.required(),
  }),
  body: Joi.object({
    type: Joi.string(),
    language: Joi.string().valid('no', 'en'),
  }),
};

/**
 * Generate invoice from financial metric validation
 */
export const generateInvoiceFromMetricSchema = {
  params: Joi.object({
    financialMetricId: uuidSchema.required(),
  }),
};

/**
 * Treatment summary validation
 */
export const treatmentSummarySchema = {
  params: Joi.object({
    patientId: uuidSchema.required(),
  }),
  query: Joi.object({
    maxEncounters: Joi.number().integer().min(1).max(100).default(20),
  }),
};

/**
 * Referral letter validation
 */
export const referralLetterSchema = {
  body: Joi.object({
    patientId: uuidSchema.required(),
    encounterId: uuidSchema.required(),
    recipientName: Joi.string().max(200),
    recipientAddress: Joi.string().max(500),
    reasonForReferral: Joi.string(),
    relevantFindings: Joi.string(),
    relevantTestResults: Joi.string(),
  }),
};

/**
 * Sick note validation
 */
export const sickNoteSchema = {
  body: Joi.object({
    patientId: uuidSchema.required(),
    encounterId: uuidSchema.required(),
    diagnosisCode: Joi.string(),
    diagnosisText: Joi.string(),
    startDate: Joi.string().required(),
    endDate: Joi.string().required(),
    percentage: Joi.number().integer().min(0).max(100),
    functionalAssessment: Joi.string(),
    workRestrictions: Joi.string(),
  }),
};

/**
 * Invoice generation validation
 */
export const generateInvoiceSchema = {
  body: Joi.object({
    patientId: uuidSchema.required(),
    invoiceNumber: Joi.string(),
    invoiceDate: Joi.string(),
    dueDate: Joi.string(),
    lineItems: Joi.array()
      .items(
        Joi.object({
          description: Joi.string(),
          code: Joi.string(),
          quantity: Joi.number(),
          unitPrice: Joi.number(),
          amount: Joi.number(),
        })
      )
      .required()
      .min(1),
    vatRate: Joi.number(),
    accountNumber: Joi.string(),
    kidNumber: Joi.string(),
    insuranceCompany: Joi.string(),
  }),
};
