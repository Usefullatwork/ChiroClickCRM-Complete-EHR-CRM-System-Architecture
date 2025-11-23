/**
 * Financial Validation Schemas
 */

import Joi from 'joi';

const uuidSchema = Joi.string().uuid();
const dateSchema = Joi.date().iso();

/**
 * Create financial metric validation
 */
export const createFinancialMetricSchema = {
  body: Joi.object({
    patient_id: uuidSchema.required(),
    encounter_id: uuidSchema,
    appointment_id: uuidSchema,
    transaction_type: Joi.string()
      .valid('VISIT_FEE', 'PACKAGE_PURCHASE', 'PRODUCT_SALE', 'REFUND', 'ADJUSTMENT')
      .required(),
    service_codes: Joi.array().items(Joi.string()),
    treatment_codes: Joi.array().items(
      Joi.object({
        code: Joi.string().required(),
        description: Joi.string(),
        price: Joi.number().min(0)
      })
    ),
    gross_amount: Joi.number().required().min(0),
    insurance_amount: Joi.number().default(0).min(0),
    patient_amount: Joi.number().required().min(0),
    tax_amount: Joi.number().default(0).min(0),
    package_type: Joi.string().max(50),
    package_visits_total: Joi.number().integer().min(1),
    package_visits_remaining: Joi.number().integer().min(0),
    package_expires_at: dateSchema,
    nav_series_number: Joi.number().integer().min(1).max(14),
    payment_method: Joi.string().valid('CARD', 'CASH', 'INVOICE', 'VIPPS', 'INSURANCE'),
    payment_status: Joi.string()
      .valid('PENDING', 'PAID', 'PARTIALLY_PAID', 'REFUNDED')
      .default('PENDING'),
    invoice_number: Joi.string().max(50),
    notes: Joi.string()
  })
};

/**
 * Update payment status validation
 */
export const updatePaymentStatusSchema = {
  params: Joi.object({
    id: uuidSchema.required()
  }),
  body: Joi.object({
    payment_status: Joi.string()
      .valid('PENDING', 'PAID', 'PARTIALLY_PAID', 'REFUNDED')
      .required(),
    payment_method: Joi.string().valid('CARD', 'CASH', 'INVOICE', 'VIPPS', 'INSURANCE'),
    paid_at: dateSchema,
    notes: Joi.string()
  })
};

/**
 * Get financial metrics validation
 */
export const getFinancialMetricsSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(50),
    startDate: dateSchema,
    endDate: dateSchema,
    patientId: uuidSchema,
    encounterId: uuidSchema,
    paymentStatus: Joi.string().valid('PENDING', 'PAID', 'PARTIALLY_PAID', 'REFUNDED')
  })
};

/**
 * Get revenue summary validation
 */
export const getRevenueSummarySchema = {
  query: Joi.object({
    startDate: dateSchema.required(),
    endDate: dateSchema.required()
  })
};
