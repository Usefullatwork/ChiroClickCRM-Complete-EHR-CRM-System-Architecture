/**
 * Import Validation Schemas
 */

import Joi from 'joi';

/**
 * Import patients from Excel validation
 * Note: file is handled by multer, only body params validated here
 */
export const importPatientsExcelSchema = {
  body: Joi.object({
    skipDuplicates: Joi.string().valid('true', 'false'),
    updateExisting: Joi.string().valid('true', 'false'),
    dryRun: Joi.string().valid('true', 'false'),
  }),
};

/**
 * Parse text validation
 */
export const parseTextSchema = {
  body: Joi.object({
    text: Joi.string().required().min(1),
  }),
};

/**
 * Import patients from parsed text validation
 */
export const importPatientsFromTextSchema = {
  body: Joi.object({
    patients: Joi.array()
      .items(
        Joi.object({
          first_name: Joi.string().required(),
          last_name: Joi.string().required(),
          phone: Joi.string(),
          email: Joi.string().email(),
          date_of_birth: Joi.date().iso(),
          national_id: Joi.string(),
          personal_number: Joi.string(),
          gender: Joi.string(),
          address: Joi.object(),
        })
      )
      .required()
      .min(1),
    skipDuplicates: Joi.boolean().default(true),
    updateExisting: Joi.boolean().default(false),
  }),
};
