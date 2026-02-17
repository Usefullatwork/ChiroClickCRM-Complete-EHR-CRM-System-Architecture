/**
 * FHIR Validation Schemas
 */

import Joi from 'joi';

export const getPatientSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

export const searchPatientsSchema = {
  query: Joi.object({
    name: Joi.string().max(200),
    family: Joi.string().max(100),
    given: Joi.string().max(100),
    birthdate: Joi.date().iso(),
    identifier: Joi.string().max(100),
    _count: Joi.number().integer().min(1).max(100),
    _offset: Joi.number().integer().min(0),
  }),
};

export const getEncounterSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

export const searchEncountersSchema = {
  query: Joi.object({
    patient: Joi.string().uuid(),
    date: Joi.string().max(50),
    status: Joi.string().max(50),
    _count: Joi.number().integer().min(1).max(100),
    _offset: Joi.number().integer().min(0),
  }),
};

export const getConditionSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

export const searchConditionsSchema = {
  query: Joi.object({
    patient: Joi.string().uuid(),
    code: Joi.string().max(50),
    _count: Joi.number().integer().min(1).max(100),
    _offset: Joi.number().integer().min(0),
  }),
};

export const getObservationSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

export const searchObservationsSchema = {
  query: Joi.object({
    patient: Joi.string().uuid(),
    code: Joi.string().max(100),
    category: Joi.string().max(50),
    _count: Joi.number().integer().min(1).max(100),
    _offset: Joi.number().integer().min(0),
  }),
};

export const getPatientEverythingSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

export const exportPatientSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
  query: Joi.object({
    format: Joi.string().valid('json', 'xml').default('json'),
  }),
};
