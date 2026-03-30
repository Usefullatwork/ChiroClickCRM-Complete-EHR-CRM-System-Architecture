/**
 * Examination Protocols Data
 * Thin wrapper: data from JSON, preserves all named and default exports
 */

import data from './examinationProtocols.json';

export const SEVERITY = data.SEVERITY;
export const CLUSTER_THRESHOLDS = data.CLUSTER_THRESHOLDS;
export const BPPV_TYPES = data.BPPV_TYPES;
export const EXAMINATION_REGIONS = data.EXAMINATION_REGIONS;
export const CLUSTER_TESTS = data.CLUSTER_TESTS;
export const BPPV_PROTOCOLS = data.BPPV_PROTOCOLS;
export const VNG_EXAMINATION = data.VNG_EXAMINATION;
export const NEUROLOGICAL_EXAM = data.NEUROLOGICAL_EXAM;
export const CRANIAL_NERVES = data.CRANIAL_NERVES;

export default {
  EXAMINATION_REGIONS,
  CLUSTER_TESTS,
  CLUSTER_THRESHOLDS,
  BPPV_PROTOCOLS,
  VNG_EXAMINATION,
  NEUROLOGICAL_EXAM,
  CRANIAL_NERVES,
  SEVERITY,
};
