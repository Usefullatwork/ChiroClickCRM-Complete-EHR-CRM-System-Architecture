/**
 * Bulk Communication — Templating & Preview
 * Template personalization and message previewing
 */

import { query } from '../../config/database.js';
import logger from '../../utils/logger.js';

// Available template variables
const TEMPLATE_VARIABLES = {
  '{firstName}': (patient) => patient.first_name || '',
  '{lastName}': (patient) => patient.last_name || '',
  '{fullName}': (patient) => `${patient.first_name || ''} ${patient.last_name || ''}`.trim(),
  '{phone}': (patient) => patient.phone || '',
  '{email}': (patient) => patient.email || '',
  '{dateOfBirth}': (patient) =>
    patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString('nb-NO') : '',
  '{lastVisit}': (patient) =>
    patient.last_visit_date ? new Date(patient.last_visit_date).toLocaleDateString('nb-NO') : '',
  '{nextAppointment}': (patient) =>
    patient.next_appointment ? new Date(patient.next_appointment).toLocaleDateString('nb-NO') : '',
  '{clinicName}': (patient, clinic) => clinic?.name || '',
  '{clinicPhone}': (patient, clinic) => clinic?.phone || '',
  '{clinicEmail}': (patient, clinic) => clinic?.email || '',
  '{clinicAddress}': (patient, clinic) => clinic?.address || '',
  '{today}': () => new Date().toLocaleDateString('nb-NO'),
  '{currentYear}': () => new Date().getFullYear().toString(),
};

/**
 * Personalize template with patient variables
 */
export const personalizeTemplate = (template, patient, clinicInfo = {}) => {
  if (!template) {
    return '';
  }

  let result = template;
  for (const [variable, resolver] of Object.entries(TEMPLATE_VARIABLES)) {
    if (result.includes(variable)) {
      try {
        const value = resolver(patient, clinicInfo);
        result = result.replace(new RegExp(variable.replace(/[{}]/g, '\\$&'), 'g'), value);
      } catch (error) {
        logger.warn('Error resolving template variable:', { variable, error: error.message });
        result = result.replace(new RegExp(variable.replace(/[{}]/g, '\\$&'), 'g'), '');
      }
    }
  }
  return result;
};

/**
 * Preview personalized message for a patient
 */
export const previewMessage = async (
  organizationId,
  patientId,
  templateContent,
  clinicInfo = {}
) => {
  try {
    const patientResult = await query(
      `SELECT id, first_name, last_name, phone, email, date_of_birth, last_visit_date
       FROM patients WHERE id = $1 AND organization_id = $2`,
      [patientId, organizationId]
    );

    if (patientResult.rows.length === 0) {
      throw new Error('Patient not found');
    }
    const patient = patientResult.rows[0];
    const personalizedContent = personalizeTemplate(templateContent, patient, clinicInfo);

    return {
      patientId,
      patientName: `${patient.first_name} ${patient.last_name}`,
      originalContent: templateContent,
      personalizedContent,
      characterCount: personalizedContent.length,
      smsSegments: Math.ceil(personalizedContent.length / 160),
    };
  } catch (error) {
    logger.error('Error previewing message:', error);
    throw error;
  }
};

/**
 * Get available template variables
 */
export const getAvailableVariables = () =>
  Object.keys(TEMPLATE_VARIABLES).map((variable) => ({
    variable,
    description: getVariableDescription(variable),
  }));

function getVariableDescription(variable) {
  const descriptions = {
    '{firstName}': 'Pasientens fornavn',
    '{lastName}': 'Pasientens etternavn',
    '{fullName}': 'Pasientens fulle navn',
    '{phone}': 'Pasientens telefonnummer',
    '{email}': 'Pasientens e-postadresse',
    '{dateOfBirth}': 'Pasientens fodselsdato',
    '{lastVisit}': 'Dato for siste besok',
    '{nextAppointment}': 'Dato for neste avtale',
    '{clinicName}': 'Klinikkens navn',
    '{clinicPhone}': 'Klinikkens telefonnummer',
    '{clinicEmail}': 'Klinikkens e-postadresse',
    '{clinicAddress}': 'Klinikkens adresse',
    '{today}': 'Dagens dato',
    '{currentYear}': 'Innevarende ar',
  };
  return descriptions[variable] || variable;
}
