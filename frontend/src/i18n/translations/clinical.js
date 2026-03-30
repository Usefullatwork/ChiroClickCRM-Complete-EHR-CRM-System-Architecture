/**
 * Clinical translations - bridges to the existing assessment/translations.js
 * Import and re-use the TRANSLATIONS object from the assessment module.
 * This file adds any clinical strings not already covered there.
 */
import { clinicalSOAP } from './clinicalSOAP.js';
import { clinicalExams } from './clinicalExams.js';
import { clinicalDiagnosis } from './clinicalDiagnosis.js';
import { clinicalTemplates } from './clinicalTemplates.js';

export const clinical = {
  en: {
    ...clinicalSOAP.en,
    ...clinicalExams.en,
    ...clinicalDiagnosis.en,
    ...clinicalTemplates.en,
  },
  no: {
    ...clinicalSOAP.no,
    ...clinicalExams.no,
    ...clinicalDiagnosis.no,
    ...clinicalTemplates.no,
  },
};
