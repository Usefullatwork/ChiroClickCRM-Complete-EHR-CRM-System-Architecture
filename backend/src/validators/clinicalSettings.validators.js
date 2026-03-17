/**
 * Clinical Settings Validation Schemas
 */

import Joi from 'joi';

/**
 * Update clinical settings validation (partial update)
 */
export const updateClinicalSettingsSchema = {
  body: Joi.object({
    adjustment: Joi.object(),
    tests: Joi.object(),
    letters: Joi.object(),
    soap: Joi.object(),
    ai: Joi.object(),
    display: Joi.object(),
  }).min(1),
};

/**
 * Update clinical settings section validation
 */
export const updateClinicalSettingsSectionSchema = {
  params: Joi.object({
    section: Joi.string()
      .valid('adjustment', 'tests', 'letters', 'soap', 'ai', 'display')
      .required(),
  }),
  body: Joi.object().min(1),
};

/**
 * Set adjustment style validation
 */
export const setAdjustmentStyleSchema = {
  body: Joi.object({
    style: Joi.string()
      .valid('gonstead', 'diversified', 'segment_listing', 'activator', 'custom')
      .required(),
  }),
};

/**
 * Update test settings validation
 */
export const updateTestSettingsSchema = {
  params: Joi.object({
    testType: Joi.string().valid('orthopedic', 'neurological', 'rom', 'palpation').required(),
  }),
  body: Joi.object().min(1),
};

/**
 * Update letter settings validation
 */
export const updateLetterSettingsSchema = {
  body: Joi.object().min(1),
};

/**
 * Panel configuration validation
 */
const panelItemSchema = Joi.object({
  id: Joi.string().required(),
  visible: Joi.boolean().required(),
  order: Joi.number().integer().min(0).required(),
  pinned: Joi.boolean().default(false),
});

export const updatePanelConfigSchema = {
  body: Joi.object({
    panels: Joi.array().items(panelItemSchema).min(1).required(),
    presetName: Joi.string().max(100).allow('').default(''),
  }),
};
