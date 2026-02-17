/**
 * Template Service
 * Loads, caches, and merges clinical terminology templates
 * Supports different language levels for various document types
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';
import {
  DOCUMENT_TYPE_CONFIG,
  LANGUAGE_LEVELS,
  SPECIALTY_CONFIG,
  BODY_REGION_CONFIG,
  PRACTITIONER_PRESETS,
  getDocumentTypeConfig,
  getAllDocumentTypes,
  getLanguageLevelForDocument,
} from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Template Service for loading and managing clinical terminology templates
 */
class TemplateService {
  constructor() {
    this.cache = new Map();
    this.templateDir = __dirname;
    this.initialized = false;
  }

  /**
   * Initialize the template service and preload common templates
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Preload base templates
      await this.loadTemplateCategory('base');
      this.initialized = true;
    } catch (error) {
      logger.error('Failed to initialize TemplateService:', error);
      throw error;
    }
  }

  /**
   * Load a single template file
   * @param {string} templatePath - Relative path to the template file
   * @returns {Object} Parsed template data
   */
  async loadTemplate(templatePath) {
    const cacheKey = templatePath;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const fullPath = path.join(this.templateDir, templatePath);

    // Add .json extension if not present
    const jsonPath = fullPath.endsWith('.json') ? fullPath : `${fullPath}.json`;

    try {
      const content = fs.readFileSync(jsonPath, 'utf-8');
      const template = JSON.parse(content);
      this.cache.set(cacheKey, template);
      return template;
    } catch (error) {
      if (error.code === 'ENOENT') {
        logger.warn(`Template not found: ${jsonPath}`);
        return null;
      }
      throw error;
    }
  }

  /**
   * Load all templates in a category directory
   * @param {string} category - Category directory name (e.g., 'base', 'levels/basic')
   * @returns {Object} Merged templates from the category
   */
  async loadTemplateCategory(category) {
    const categoryPath = path.join(this.templateDir, category);
    const merged = {};

    try {
      if (!fs.existsSync(categoryPath)) {
        return merged;
      }

      const files = fs.readdirSync(categoryPath);

      for (const file of files) {
        if (file.endsWith('.json')) {
          const template = await this.loadTemplate(path.join(category, file));
          if (template) {
            this.deepMerge(merged, template);
          }
        }
      }
    } catch (error) {
      logger.error(`Failed to load template category ${category}:`, error);
    }

    return merged;
  }

  /**
   * Load templates for a specific document type
   * @param {string} documentType - Document type (journal, epikrise, henvisning)
   * @param {Object} options - Additional options
   * @returns {Object} Merged templates for the document type
   */
  async loadForDocumentType(documentType, options = {}) {
    const config = getDocumentTypeConfig(documentType);

    if (!config) {
      throw new Error(`Unknown document type: ${documentType}`);
    }

    const { practitioner, specialty, bodyRegion } = options;
    const templatePatterns = [...config.templates];

    // Add specialty templates if specified
    if (specialty && SPECIALTY_CONFIG[specialty]) {
      templatePatterns.push(...SPECIALTY_CONFIG[specialty].templates);
    }

    // Add body region templates if specified
    if (bodyRegion && BODY_REGION_CONFIG[bodyRegion]) {
      templatePatterns.push(...BODY_REGION_CONFIG[bodyRegion].templates);
    }

    // Add practitioner templates if specified
    if (practitioner && PRACTITIONER_PRESETS[practitioner]) {
      templatePatterns.push(...PRACTITIONER_PRESETS[practitioner].templates);
    }

    return this.loadTemplateSet(templatePatterns, config.languageLevel);
  }

  /**
   * Load a set of templates based on patterns
   * @param {Array<string>} patterns - Array of template patterns (e.g., ['base/*', 'levels/basic/*'])
   * @param {string} languageLevel - Language level (basic or detailed)
   * @returns {Object} Merged templates
   */
  async loadTemplateSet(patterns, languageLevel = LANGUAGE_LEVELS.BASIC) {
    const merged = {
      languageLevel,
      anatomy: {},
      treatments: {},
      examinations: {},
      phrases: {},
      metadata: {
        loadedPatterns: patterns,
        loadedAt: new Date().toISOString(),
      },
    };

    for (const pattern of patterns) {
      if (pattern.endsWith('/*')) {
        // Load entire category
        const category = pattern.slice(0, -2);
        const categoryTemplates = await this.loadTemplateCategory(category);
        this.deepMerge(merged, categoryTemplates);
      } else {
        // Load specific template
        const template = await this.loadTemplate(pattern);
        if (template) {
          this.deepMerge(merged, template);
        }
      }
    }

    return merged;
  }

  /**
   * Create a custom template set from specific template IDs
   * @param {Array<string>} templateIds - Array of template IDs to combine
   * @param {Object} options - Options including languageLevel
   * @returns {Object} Merged custom template set
   */
  async createCustomSet(templateIds, options = {}) {
    const { languageLevel = LANGUAGE_LEVELS.BASIC } = options;

    const templates = await Promise.all(templateIds.map((id) => this.loadTemplate(id)));

    const merged = {
      languageLevel,
      anatomy: {},
      treatments: {},
      examinations: {},
      phrases: {},
      metadata: {
        customSet: true,
        templateIds,
        loadedAt: new Date().toISOString(),
      },
    };

    for (const template of templates) {
      if (template) {
        this.deepMerge(merged, template);
      }
    }

    return merged;
  }

  /**
   * Get terminology for a specific term
   * @param {string} term - The term to look up
   * @param {string} level - Language level (basic or detailed)
   * @param {string} documentType - Optional document type for context
   * @returns {Object|string|null} Terminology entry or null if not found
   */
  async getTerminology(term, level = LANGUAGE_LEVELS.BASIC, documentType = null) {
    // Determine which templates to search
    let templates;
    if (documentType) {
      templates = await this.loadForDocumentType(documentType);
    } else {
      templates = await this.loadTemplateSet(['base/*', `levels/${level}/*`], level);
    }

    // Search in different categories
    const categories = ['anatomy', 'treatments', 'examinations'];

    for (const category of categories) {
      if (templates[category] && templates[category][term]) {
        const entry = templates[category][term];

        // Return appropriate form based on level
        if (typeof entry === 'string') {
          return entry;
        }

        if (level === LANGUAGE_LEVELS.BASIC) {
          return entry.short || entry.abbreviation || term;
        } else {
          return entry.full_no || entry.full || entry.description_no || term;
        }
      }
    }

    return null;
  }

  /**
   * Expand abbreviations in text to full form
   * @param {string} text - Text containing abbreviations
   * @param {string} documentType - Document type for terminology lookup
   * @returns {string} Text with expanded terminology
   */
  async expandAbbreviations(text, documentType = 'epikrise') {
    const templates = await this.loadForDocumentType(documentType);
    let expanded = text;

    // Expand anatomy terms
    if (templates.anatomy) {
      for (const [abbrev, data] of Object.entries(templates.anatomy)) {
        const fullForm = typeof data === 'string' ? data : data.full_no || data.full;
        if (fullForm) {
          const regex = new RegExp(`\\b${abbrev}\\b`, 'gi');
          expanded = expanded.replace(regex, fullForm);
        }
      }
    }

    // Expand treatment terms
    if (templates.treatments) {
      for (const [abbrev, data] of Object.entries(templates.treatments)) {
        const fullForm = typeof data === 'string' ? data : data.full_no || data.full;
        if (fullForm) {
          const regex = new RegExp(`\\b${abbrev}\\b`, 'gi');
          expanded = expanded.replace(regex, fullForm);
        }
      }
    }

    return expanded;
  }

  /**
   * Abbreviate text using short forms
   * @param {string} text - Text with full terminology
   * @param {string} documentType - Document type for terminology lookup
   * @returns {string} Text with abbreviated terminology
   */
  async abbreviateText(text, documentType = 'journal') {
    const templates = await this.loadForDocumentType(documentType);
    let abbreviated = text;

    // Create reverse mapping from full form to abbreviation
    const reverseMap = new Map();

    if (templates.anatomy) {
      for (const [abbrev, data] of Object.entries(templates.anatomy)) {
        const fullForm = typeof data === 'string' ? data : data.full_no || data.full;
        if (fullForm) {
          reverseMap.set(fullForm.toLowerCase(), abbrev);
        }
      }
    }

    if (templates.treatments) {
      for (const [abbrev, data] of Object.entries(templates.treatments)) {
        const fullForm = typeof data === 'string' ? data : data.full_no || data.full;
        if (fullForm) {
          reverseMap.set(fullForm.toLowerCase(), abbrev);
        }
      }
    }

    // Replace full forms with abbreviations
    for (const [fullForm, abbrev] of reverseMap) {
      const regex = new RegExp(fullForm, 'gi');
      abbreviated = abbreviated.replace(regex, abbrev);
    }

    return abbreviated;
  }

  /**
   * Get all available terms for a category
   * @param {string} category - Category name (anatomy, treatments, examinations)
   * @param {string} languageLevel - Language level
   * @returns {Array} Array of term entries
   */
  async getTermsByCategory(category, languageLevel = LANGUAGE_LEVELS.BASIC) {
    const templates = await this.loadTemplateSet(
      ['base/*', `levels/${languageLevel}/*`],
      languageLevel
    );

    if (!templates[category]) {
      return [];
    }

    return Object.entries(templates[category]).map(([key, value]) => ({
      key,
      ...(typeof value === 'string' ? { short: key, full: value } : value),
    }));
  }

  /**
   * Deep merge two objects
   * @param {Object} target - Target object
   * @param {Object} source - Source object
   * @returns {Object} Merged object
   */
  deepMerge(target, source) {
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key]) {
          target[key] = {};
        }
        this.deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
    return target;
  }

  /**
   * Clear the template cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance
export const templateService = new TemplateService();

// Export class for testing
export { TemplateService };

// Re-export config utilities
export {
  DOCUMENT_TYPE_CONFIG,
  LANGUAGE_LEVELS,
  SPECIALTY_CONFIG,
  BODY_REGION_CONFIG,
  PRACTITIONER_PRESETS,
  getDocumentTypeConfig,
  getAllDocumentTypes,
  getLanguageLevelForDocument,
};

export default templateService;
