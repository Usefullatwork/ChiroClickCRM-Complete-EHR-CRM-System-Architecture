/**
 * Orthopedic Examination Module Exports
 */

export { default as OrthopedicExam, OrthopedicExamCompact } from './OrthopedicExam';
export {
  ORTHO_EXAM_CLUSTERS,
  calculateOrthoClusterScore,
  checkOrthoRedFlags,
  generateOrthoNarrative,
  getClustersByRegion,
  getAvailableRegions
} from './orthopedicExamDefinitions';
