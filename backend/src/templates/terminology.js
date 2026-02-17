/**
 * Terminology Bridge
 * Provides backward-compatible access to template terminology
 * for use by existing parsers and services
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Load and parse a JSON template file
 */
const loadTemplate = (relativePath) => {
  const fullPath = path.join(__dirname, relativePath);
  try {
    const content = fs.readFileSync(fullPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    logger.warn(`Failed to load template: ${relativePath}`, error.message);
    return null;
  }
};

// Load base templates
const anatomyCore = loadTemplate('base/anatomy-core.json');
const treatmentsCore = loadTemplate('base/treatments-core.json');
const examinationsCore = loadTemplate('base/examinations-core.json');

/**
 * Build ANATOMICAL_ABBREVIATIONS from templates
 * Maintains backward compatibility with existing parser format
 */
export const buildAnatomicalAbbreviations = () => {
  const abbreviations = {};

  if (!anatomyCore?.anatomy) {
    return abbreviations;
  }

  // Flatten spinal segments
  if (anatomyCore.anatomy.spinalSegments) {
    Object.entries(anatomyCore.anatomy.spinalSegments).forEach(([key, value]) => {
      abbreviations[key] = value.full_no || value.full_en || key;
    });
  }

  // Flatten directions
  if (anatomyCore.anatomy.directions) {
    Object.entries(anatomyCore.anatomy.directions).forEach(([key, value]) => {
      abbreviations[key] = value.full_no || value.full_en || key;
    });
  }

  // Flatten laterality
  if (anatomyCore.anatomy.laterality) {
    Object.entries(anatomyCore.anatomy.laterality).forEach(([key, value]) => {
      abbreviations[key] = value.full_no || value.full_en || key;
    });
  }

  // Flatten joints
  if (anatomyCore.anatomy.joints) {
    Object.entries(anatomyCore.anatomy.joints).forEach(([key, value]) => {
      abbreviations[key] = value.full_no || value.full_en || key;
    });
  }

  // Flatten regions
  if (anatomyCore.anatomy.regions) {
    Object.entries(anatomyCore.anatomy.regions).forEach(([key, value]) => {
      abbreviations[key] = value.full_no || value.full_en || key;
    });
  }

  // Flatten bones
  if (anatomyCore.anatomy.bones) {
    Object.entries(anatomyCore.anatomy.bones).forEach(([key, value]) => {
      abbreviations[key] = value.full_no || value.full_en || key;
    });
  }

  // Flatten muscles
  if (anatomyCore.anatomy.muscles) {
    Object.entries(anatomyCore.anatomy.muscles).forEach(([key, value]) => {
      abbreviations[key] = value.full_no || value.full_en || key;
    });
  }

  // Flatten findings
  if (anatomyCore.anatomy.findings) {
    Object.entries(anatomyCore.anatomy.findings).forEach(([key, value]) => {
      abbreviations[key] = value.full_no || value.full_en || key;
    });
  }

  return abbreviations;
};

/**
 * Build TREATMENT_ABBREVIATIONS from templates
 */
export const buildTreatmentAbbreviations = () => {
  const abbreviations = {};

  if (!treatmentsCore?.treatments) {
    return abbreviations;
  }

  // Process all treatment categories
  Object.values(treatmentsCore.treatments).forEach((category) => {
    if (typeof category === 'object' && category !== null) {
      Object.entries(category).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          abbreviations[key] = value.full_no || value.description_no || value.full_en || key;
        }
      });
    }
  });

  return abbreviations;
};

/**
 * Build EXAMINATION_TESTS from templates
 */
export const buildExaminationTests = () => {
  const tests = {};

  if (!examinationsCore?.examinations) {
    return tests;
  }

  // Process all examination categories
  Object.values(examinationsCore.examinations).forEach((category) => {
    if (typeof category === 'object' && category !== null) {
      Object.entries(category).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          tests[key] = value.full_no || value.description_no || value.full_en || key;
        }
      });
    }
  });

  return tests;
};

/**
 * Build COMMON_FINDINGS from templates
 */
export const buildCommonFindings = () => {
  if (!examinationsCore?.patterns) {
    return {
      pain_locations: [],
      pain_descriptors: [],
      symptom_patterns: [],
      temporal_patterns: [],
      aggravating_factors: [],
      relieving_factors: [],
    };
  }

  return {
    pain_locations: examinationsCore.patterns.painLocations || [],
    pain_descriptors: examinationsCore.patterns.painDescriptors || [],
    symptom_patterns: examinationsCore.patterns.symptomPatterns || [],
    temporal_patterns: examinationsCore.patterns.temporalPatterns || [],
    aggravating_factors: examinationsCore.patterns.aggravatingFactors || [],
    relieving_factors: examinationsCore.patterns.relievingFactors || [],
  };
};

/**
 * Build Sigrun-specific patterns
 */
export const buildSigrunPatterns = () => {
  const sigrunTemplate = loadTemplate('practitioners/sigrun.json');

  if (!sigrunTemplate) {
    return {
      treatment: {},
      assessment: {
        improvement: [],
        no_change: [],
        worsening: [],
        location_descriptors: [],
      },
    };
  }

  // Build treatment patterns from abbreviations
  const treatmentPatterns = {};
  if (sigrunTemplate.abbreviations) {
    Object.entries(sigrunTemplate.abbreviations.techniques || {}).forEach(([key, value]) => {
      treatmentPatterns[key] = value.charAt(0).toUpperCase() + value.slice(1);
    });
    Object.entries(sigrunTemplate.abbreviations.regions || {}).forEach(([key, value]) => {
      treatmentPatterns[`${key} mob`] =
        `${value.charAt(0).toUpperCase() + value.slice(1)} mobilization`;
    });
    Object.entries(sigrunTemplate.abbreviations.positions || {}).forEach(([key, value]) => {
      treatmentPatterns[key] = value.charAt(0).toUpperCase() + value.slice(1);
    });
  }

  // Build assessment patterns
  const assessmentPatterns = {
    improvement: examinationsCore?.patterns?.assessmentImprovement || [
      'bedre',
      'mye bedre',
      'klart bedre',
    ],
    no_change: examinationsCore?.patterns?.assessmentNoChange || ['som sist', 'uendret'],
    worsening: examinationsCore?.patterns?.assessmentWorsening || ['verre', 'mer vondt'],
    location_descriptors: [
      'nakke',
      'cx',
      'c-col',
      'cervical',
      'rygg',
      'tx',
      't-col',
      'thoracic',
      'korsrygg',
      'lx',
      'l-col',
      'lumbar',
      'skulder',
      'arm',
      'hofte',
      'bekken',
      'sete',
    ],
  };

  return {
    treatment: treatmentPatterns,
    assessment: assessmentPatterns,
  };
};

// Pre-built exports for direct use
export const ANATOMICAL_ABBREVIATIONS = buildAnatomicalAbbreviations();
export const TREATMENT_ABBREVIATIONS = buildTreatmentAbbreviations();
export const EXAMINATION_TESTS = buildExaminationTests();
export const COMMON_FINDINGS = buildCommonFindings();

// Sigrun-specific exports
const sigrunPatterns = buildSigrunPatterns();
export const SIGRUN_TREATMENT_PATTERNS = sigrunPatterns.treatment;
export const SIGRUN_ASSESSMENT_PATTERNS = sigrunPatterns.assessment;

export default {
  ANATOMICAL_ABBREVIATIONS,
  TREATMENT_ABBREVIATIONS,
  EXAMINATION_TESTS,
  COMMON_FINDINGS,
  SIGRUN_TREATMENT_PATTERNS,
  SIGRUN_ASSESSMENT_PATTERNS,
  buildAnatomicalAbbreviations,
  buildTreatmentAbbreviations,
  buildExaminationTests,
  buildCommonFindings,
  buildSigrunPatterns,
};
