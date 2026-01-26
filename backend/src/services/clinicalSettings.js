/**
 * Clinical Settings Service
 * Manages per-organization clinical documentation preferences
 * including adjustment notation (Gonstead/Diversified), test formats,
 * and letter/document structure
 */

import { query, transaction } from '../config/database.js';
import logger from '../utils/logger.js';

// Default clinical settings structure
export const DEFAULT_CLINICAL_SETTINGS = {
  // ============================================
  // ADJUSTMENT NOTATION
  // ============================================
  adjustment: {
    // Primary notation style: 'gonstead', 'diversified', 'segment_listing', 'activator', 'custom'
    style: 'segment_listing',

    // Gonstead-specific settings (when style = 'gonstead')
    gonstead: {
      // Use full notation (e.g., 'PRS-SP' vs 'PRS')
      useFullNotation: true,
      // Include direction indicators
      includeDirection: true,
      // Notation format options
      listings: {
        // Posterior rotation: PR, PL, PRS, PLS, PRI, PLI
        posteriorRotation: ['PR', 'PL', 'PRS', 'PLS', 'PRI', 'PLI'],
        // Sacrum: AS, AI, PI, PS, IN-EX, EX-IN
        sacrum: ['AS', 'AI', 'PI', 'PS', 'IN-EX', 'EX-IN'],
        // Pelvis: PI, AS, IN, EX
        pelvis: ['PI', 'AS', 'IN', 'EX']
      }
    },

    // Diversified-specific settings (when style = 'diversified')
    diversified: {
      // Use anatomical terminology
      useAnatomicalTerms: true,
      // Include motion restriction type
      includeRestriction: true,
      // Notation format options
      terminology: {
        restriction: ['Hypomobile', 'Fixation', 'Subluxation', 'Dysfunction'],
        direction: ['Flexion', 'Extension', 'Lateral flexion', 'Rotation', 'Combined']
      }
    },

    // Custom abbreviations (user-defined)
    customAbbreviations: {}
  },

  // ============================================
  // TEST DOCUMENTATION
  // ============================================
  tests: {
    // Orthopedic test format
    orthopedic: {
      // Result notation: 'plus_minus' (+/-), 'pos_neg', 'numeric' (0-3), 'descriptive'
      resultFormat: 'plus_minus',
      // Include side
      includeSide: true,
      // Include pain reproduction
      includePainReproduction: true,
      // Common tests to show in quick-select
      quickTests: [
        'Kemp', 'SLR', 'Braggard', 'Faber', 'Valsalva', 'Spurling',
        'Adson', 'Milgram', 'Thomas', 'Ober', 'Nachlas', 'Yeoman'
      ]
    },

    // Neurological test format
    neurological: {
      // Reflex grading: 'numeric' (0-4), 'plus_minus', 'descriptive'
      reflexGrading: 'numeric',
      // Sensory notation: 'numeric' (0-2), 'descriptive', 'dermatome_map'
      sensoryNotation: 'numeric',
      // Motor strength: 'oxford' (0-5), 'descriptive'
      motorGrading: 'oxford',
      // Include dermatome reference
      includeDermatomes: true
    },

    // Range of motion format
    rom: {
      // Format: 'degrees', 'percentage', 'descriptive', 'aga'
      format: 'degrees',
      // Include normal values
      includeNormal: true,
      // Compare to contralateral
      compareContralateral: false,
      // Active vs passive
      distinguishActivePassive: true
    },

    // Palpation findings
    palpation: {
      // Tenderness scale: 'numeric' (0-3), 'plus_minus', 'descriptive'
      tendernessScale: 'numeric',
      // Muscle tone: 'descriptive', 'numeric'
      toneScale: 'descriptive',
      // Include specific structures
      includeStructures: true
    }
  },

  // ============================================
  // LETTER/DOCUMENT STRUCTURE
  // ============================================
  letters: {
    // Practitioner info to include in letters
    practitionerInfo: {
      includeName: true,
      includeTitle: true,
      includeHPR: true,
      includeClinicName: true,
      includeAddress: true,
      includePhone: true,
      includeEmail: true
    },

    // Default letter structure
    defaultStructure: {
      // Header format
      headerFormat: 'clinic_letterhead',
      // Date format: 'norwegian' (dd.mm.yyyy), 'iso' (yyyy-mm-dd), 'long' (1. januar 2025)
      dateFormat: 'norwegian',
      // Patient reference format
      patientReference: 'name_dob',
      // Include reference number
      includeReferenceNumber: true
    },

    // Signature settings
    signature: {
      // Auto-include signature
      autoSign: true,
      // Signature format
      format: 'name_title_hpr',
      // Include digital signature
      includeDigitalSignature: false
    },

    // Letter templates preferences
    templates: {
      // Default language for letters
      defaultLanguage: 'no',
      // Auto-fill patient data
      autoFillPatientData: true,
      // Include clinical summary
      includeClinicalSummary: true
    }
  },

  // ============================================
  // SOAP NOTE PREFERENCES
  // ============================================
  soap: {
    // Subjective section
    subjective: {
      // Include pain scales (VAS/NRS)
      includePainScale: true,
      // Pain scale type: 'vas', 'nrs', 'both'
      painScaleType: 'vas',
      // Include functional questionnaires
      includeQuestionnaires: true,
      // Default questionnaires
      defaultQuestionnaires: ['ODI', 'NDI', 'FABQ']
    },

    // Objective section
    objective: {
      // Order of sections
      sectionOrder: ['observation', 'palpation', 'rom', 'ortho', 'neuro'],
      // Include posture analysis
      includePosture: true,
      // Include gait analysis
      includeGait: false
    },

    // Assessment section
    assessment: {
      // Diagnosis coding system: 'icpc2', 'icd10', 'both'
      diagnosisSystem: 'both',
      // Include clinical reasoning
      includeClinicalReasoning: true,
      // Include red flags check
      includeRedFlagsCheck: true
    },

    // Plan section
    plan: {
      // Include treatment performed
      includeTreatmentPerformed: true,
      // Include exercise prescription
      includeExercises: true,
      // Include advice given
      includeAdvice: true,
      // Include follow-up plan
      includeFollowUp: true
    }
  },

  // ============================================
  // AI GENERATION PREFERENCES
  // ============================================
  ai: {
    // Default language for AI generation
    defaultLanguage: 'no',
    // Formality level: 'formal', 'professional', 'casual'
    formalityLevel: 'professional',
    // Include placeholders for manual review
    includePlaceholders: true,
    // Auto-suggest based on findings
    autoSuggest: true
  },

  // ============================================
  // DISPLAY PREFERENCES
  // ============================================
  display: {
    // Language
    language: 'no',
    // Show dermatomes on body chart
    showDermatomes: true,
    // Show trigger points on body chart
    showTriggerPoints: true,
    // Default body chart view: 'front', 'back', 'both'
    defaultView: 'front',
    // Auto-generate narrative on save
    autoGenerateNarrative: true
  }
};

/**
 * Get clinical settings for an organization
 * @param {string} organizationId - Organization UUID
 * @returns {object} Clinical settings merged with defaults
 */
export const getClinicalSettings = async (organizationId) => {
  try {
    const result = await query(
      `SELECT settings->'clinical' as clinical_settings
       FROM organizations
       WHERE id = $1`,
      [organizationId]
    );

    if (result.rows.length === 0) {
      throw new Error('Organization not found');
    }

    const savedSettings = result.rows[0].clinical_settings || {};

    // Deep merge with defaults
    return deepMerge(DEFAULT_CLINICAL_SETTINGS, savedSettings);
  } catch (error) {
    logger.error('Error getting clinical settings:', error);
    throw error;
  }
};

/**
 * Update clinical settings for an organization
 * @param {string} organizationId - Organization UUID
 * @param {object} settings - Partial settings object to update
 * @returns {object} Updated clinical settings
 */
export const updateClinicalSettings = async (organizationId, settings) => {
  try {
    // Get current settings
    const currentResult = await query(
      `SELECT settings FROM organizations WHERE id = $1`,
      [organizationId]
    );

    if (currentResult.rows.length === 0) {
      throw new Error('Organization not found');
    }

    const currentSettings = currentResult.rows[0].settings || {};
    const currentClinical = currentSettings.clinical || {};

    // Deep merge new settings with current
    const mergedClinical = deepMerge(currentClinical, settings);

    // Update in database
    const result = await query(
      `UPDATE organizations
       SET settings = jsonb_set(
         COALESCE(settings, '{}'::jsonb),
         '{clinical}',
         $1::jsonb
       ),
       updated_at = NOW()
       WHERE id = $2
       RETURNING settings->'clinical' as clinical_settings`,
      [JSON.stringify(mergedClinical), organizationId]
    );

    logger.info(`Clinical settings updated for organization: ${organizationId}`);

    // Return merged with defaults
    return deepMerge(DEFAULT_CLINICAL_SETTINGS, result.rows[0].clinical_settings);
  } catch (error) {
    logger.error('Error updating clinical settings:', error);
    throw error;
  }
};

/**
 * Reset clinical settings to defaults for an organization
 * @param {string} organizationId - Organization UUID
 * @returns {object} Default clinical settings
 */
export const resetClinicalSettings = async (organizationId) => {
  try {
    await query(
      `UPDATE organizations
       SET settings = jsonb_set(
         COALESCE(settings, '{}'::jsonb),
         '{clinical}',
         '{}'::jsonb
       ),
       updated_at = NOW()
       WHERE id = $1`,
      [organizationId]
    );

    logger.info(`Clinical settings reset to defaults for organization: ${organizationId}`);
    return DEFAULT_CLINICAL_SETTINGS;
  } catch (error) {
    logger.error('Error resetting clinical settings:', error);
    throw error;
  }
};

/**
 * Get adjustment notation templates based on style
 * @param {string} organizationId - Organization UUID
 * @returns {object} Adjustment notation templates
 */
export const getAdjustmentNotationTemplates = async (organizationId) => {
  const settings = await getClinicalSettings(organizationId);
  const style = settings.adjustment.style;

  const templates = {
    style,
    regions: {
      cervical: getRegionTemplates('cervical', style, settings),
      thoracic: getRegionTemplates('thoracic', style, settings),
      lumbar: getRegionTemplates('lumbar', style, settings),
      sacrum: getRegionTemplates('sacrum', style, settings),
      pelvis: getRegionTemplates('pelvis', style, settings)
    }
  };

  return templates;
};

/**
 * Get region-specific notation templates
 */
function getRegionTemplates(region, style, settings) {
  if (style === 'gonstead') {
    return getGonsteadTemplates(region, settings.adjustment.gonstead);
  } else if (style === 'diversified') {
    return getDiversifiedTemplates(region, settings.adjustment.diversified);
  } else {
    return getSegmentListingTemplates(region);
  }
}

/**
 * Get Gonstead notation templates for a region
 */
function getGonsteadTemplates(region, gonsteadSettings) {
  const templates = [];
  const segments = getSegmentsForRegion(region);

  segments.forEach(segment => {
    if (region === 'cervical' || region === 'thoracic' || region === 'lumbar') {
      gonsteadSettings.listings.posteriorRotation.forEach(listing => {
        templates.push({
          segment,
          listing,
          text: gonsteadSettings.useFullNotation
            ? `${segment} ${listing}`
            : listing,
          direction: getGonsteadDirection(listing)
        });
      });
    } else if (region === 'sacrum') {
      gonsteadSettings.listings.sacrum.forEach(listing => {
        templates.push({
          segment,
          listing,
          text: `${segment} ${listing}`,
          direction: getSacrumDirection(listing)
        });
      });
    } else if (region === 'pelvis') {
      gonsteadSettings.listings.pelvis.forEach(listing => {
        ['høyre', 'venstre'].forEach(side => {
          templates.push({
            segment: `${segment} ${side}`,
            listing,
            text: `${side.charAt(0).toUpperCase() + side.slice(1)} ilium ${listing}`,
            direction: listing
          });
        });
      });
    }
  });

  return templates;
}

/**
 * Get Diversified notation templates for a region
 */
function getDiversifiedTemplates(region, diversifiedSettings) {
  const templates = [];
  const segments = getSegmentsForRegion(region);

  segments.forEach(segment => {
    diversifiedSettings.terminology.restriction.forEach(restriction => {
      diversifiedSettings.terminology.direction.forEach(direction => {
        templates.push({
          segment,
          restriction,
          direction,
          text: diversifiedSettings.useAnatomicalTerms
            ? `${segment}: ${restriction} i ${direction.toLowerCase()}`
            : `${segment} ${restriction.substring(0, 3)} ${direction.substring(0, 3)}`
        });
      });
    });
  });

  return templates;
}

/**
 * Get segment listing templates (traditional)
 */
function getSegmentListingTemplates(region) {
  const templates = [];
  const segments = getSegmentsForRegion(region);

  const directions = ['venstre', 'høyre', 'bilateral', 'posterior', 'anterior'];

  segments.forEach(segment => {
    directions.forEach(direction => {
      templates.push({
        segment,
        direction,
        text: `${segment} ${direction}`,
        shortText: `${segment} ${direction.charAt(0).toUpperCase()}`
      });
    });
  });

  return templates;
}

/**
 * Get segments for a spinal region
 */
function getSegmentsForRegion(region) {
  const regionSegments = {
    cervical: ['C0-C1', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7'],
    thoracic: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
    lumbar: ['L1', 'L2', 'L3', 'L4', 'L5'],
    sacrum: ['Sacrum'],
    pelvis: ['Ilium']
  };
  return regionSegments[region] || [];
}

/**
 * Get direction description for Gonstead listing
 */
function getGonsteadDirection(listing) {
  const directions = {
    'PR': 'posterior høyre',
    'PL': 'posterior venstre',
    'PRS': 'posterior høyre superior',
    'PLS': 'posterior venstre superior',
    'PRI': 'posterior høyre inferior',
    'PLI': 'posterior venstre inferior'
  };
  return directions[listing] || listing;
}

/**
 * Get direction description for sacrum listing
 */
function getSacrumDirection(listing) {
  const directions = {
    'AS': 'anterior superior',
    'AI': 'anterior inferior',
    'PI': 'posterior inferior',
    'PS': 'posterior superior',
    'IN-EX': 'høyre base posterior',
    'EX-IN': 'venstre base posterior'
  };
  return directions[listing] || listing;
}

/**
 * Deep merge utility function
 */
function deepMerge(target, source) {
  const result = { ...target };

  for (const key in source) {
    if (source[key] instanceof Object && !Array.isArray(source[key])) {
      if (target[key] instanceof Object && !Array.isArray(target[key])) {
        result[key] = deepMerge(target[key], source[key]);
      } else {
        result[key] = { ...source[key] };
      }
    } else {
      result[key] = source[key];
    }
  }

  return result;
}

export default {
  DEFAULT_CLINICAL_SETTINGS,
  getClinicalSettings,
  updateClinicalSettings,
  resetClinicalSettings,
  getAdjustmentNotationTemplates
};
