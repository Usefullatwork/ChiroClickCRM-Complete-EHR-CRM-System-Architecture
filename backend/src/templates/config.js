/**
 * Document Type Configuration
 * Maps document types to appropriate language levels and template sets
 */

/**
 * Language levels for different document types
 * - basic: Abbreviated clinical terminology for quick documentation
 * - detailed: Full professional terminology for formal documents
 */
export const LANGUAGE_LEVELS = {
  BASIC: 'basic',
  DETAILED: 'detailed',
};

/**
 * Document type configurations
 * Each type specifies which templates to load and what language level to use
 */
export const DOCUMENT_TYPE_CONFIG = {
  journal: {
    id: 'journal',
    name: 'Journalnotat',
    nameEn: 'Journal Note',
    languageLevel: LANGUAGE_LEVELS.BASIC,
    templates: ['base/*', 'levels/basic/*'],
    format: 'abbreviated',
    sections: ['anamnese', 'undersokelse', 'behandling', 'notat'],
    description: 'Quick daily clinical documentation with abbreviations',
  },

  epikrise: {
    id: 'epikrise',
    name: 'Epikrise',
    nameEn: 'Discharge Summary',
    languageLevel: LANGUAGE_LEVELS.DETAILED,
    templates: ['base/*', 'levels/detailed/*', 'specialty/chiropractic'],
    format: 'full',
    sections: [
      'bakgrunn',
      'sykehistorie',
      'undersokelser',
      'diagnose',
      'behandling',
      'vurdering',
      'plan',
    ],
    description: 'Comprehensive clinical summary with professional terminology',
  },

  henvisning: {
    id: 'henvisning',
    name: 'Henvisning',
    nameEn: 'Referral Letter',
    languageLevel: LANGUAGE_LEVELS.DETAILED,
    templates: ['base/*', 'levels/detailed/*', 'specialty/chiropractic'],
    format: 'professional',
    sections: ['pasientinfo', 'henvisningsarsak', 'sykehistorie', 'funn', 'vurdering', 'sporsmal'],
    description: 'Professional referral letter for other healthcare providers',
  },
};

/**
 * Specialty configurations for additional template loading
 */
export const SPECIALTY_CONFIG = {
  chiropractic: {
    id: 'chiropractic',
    name: 'Kiropraktikk',
    nameEn: 'Chiropractic',
    templates: ['specialty/chiropractic'],
  },
  physiotherapy: {
    id: 'physiotherapy',
    name: 'Fysioterapi',
    nameEn: 'Physiotherapy',
    templates: ['specialty/physiotherapy'],
  },
  vestibular: {
    id: 'vestibular',
    name: 'Vestibular',
    nameEn: 'Vestibular/Dizziness',
    templates: ['specialty/vestibular'],
  },
};

/**
 * Body region configurations for region-specific terminology
 */
export const BODY_REGION_CONFIG = {
  cervical: {
    id: 'cervical',
    name: 'Nakke/Cervical',
    nameEn: 'Neck/Cervical',
    templates: ['body-regions/cervical'],
  },
  thoracolumbar: {
    id: 'thoracolumbar',
    name: 'Rygg/Thorakolumbal',
    nameEn: 'Back/Thoracolumbar',
    templates: ['body-regions/thoracic-lumbar'],
  },
  upperExtremity: {
    id: 'upper-extremity',
    name: 'Overekstremitet',
    nameEn: 'Upper Extremity',
    templates: ['body-regions/upper-extremity'],
  },
  lowerExtremity: {
    id: 'lower-extremity',
    name: 'Underekstremitet',
    nameEn: 'Lower Extremity',
    templates: ['body-regions/lower-extremity'],
  },
};

/**
 * Practitioner preset configurations
 */
export const PRACTITIONER_PRESETS = {
  sindre: {
    id: 'sindre',
    name: 'Sindre',
    style: 'formal',
    defaultLanguageLevel: LANGUAGE_LEVELS.DETAILED,
    preferredAbbreviations: ['SMT', 'EMT', 'IMS'],
    templates: ['practitioners/sindre'],
  },
  sigrun: {
    id: 'sigrun',
    name: 'Sigrun',
    style: 'abbreviated',
    defaultLanguageLevel: LANGUAGE_LEVELS.BASIC,
    preferredAbbreviations: ['cx mob', 'tx mob', 'tp', 'mass'],
    templates: ['practitioners/sigrun'],
  },
};

/**
 * Get configuration for a document type
 * @param {string} documentType - The document type (journal, epikrise, henvisning)
 * @returns {Object} Document type configuration
 */
export const getDocumentTypeConfig = (documentType) => DOCUMENT_TYPE_CONFIG[documentType] || null;

/**
 * Get all available document types
 * @returns {Array} List of document type configurations
 */
export const getAllDocumentTypes = () => Object.values(DOCUMENT_TYPE_CONFIG);

/**
 * Get language level for a document type
 * @param {string} documentType - The document type
 * @returns {string} Language level (basic or detailed)
 */
export const getLanguageLevelForDocument = (documentType) => {
  const config = DOCUMENT_TYPE_CONFIG[documentType];
  return config ? config.languageLevel : LANGUAGE_LEVELS.BASIC;
};

export default {
  LANGUAGE_LEVELS,
  DOCUMENT_TYPE_CONFIG,
  SPECIALTY_CONFIG,
  BODY_REGION_CONFIG,
  PRACTITIONER_PRESETS,
  getDocumentTypeConfig,
  getAllDocumentTypes,
  getLanguageLevelForDocument,
};
