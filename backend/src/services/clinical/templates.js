/**
 * Clinical Templates Service — Barrel re-export
 * Sub-modules: templateCrud.js, templateRenderer.js
 */

// Template CRUD, search, preferences, phrases
export {
  getAllTemplates,
  getTemplatesByCategory,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  toggleFavorite,
  incrementUsage,
  getCategories,
  searchTemplates,
  getUserPreferences,
  addFavoriteTemplate,
  removeFavoriteTemplate,
  getPhrases,
  getPhrasesByRegion,
  getFMSTemplates,
} from './templateCrud.js';

// Tests library, red flags, clusters, screening
export {
  getTestsLibrary,
  getTestByCode,
  getRedFlags,
  screenRedFlags,
  getTestClusters,
  getTestClusterByCondition,
} from './templateRenderer.js';

// Default export for backward compatibility
import * as templateCrud from './templateCrud.js';
import * as templateRenderer from './templateRenderer.js';

export default {
  ...templateCrud,
  ...templateRenderer,
};
