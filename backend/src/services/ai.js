/**
 * AI Service — Compatibility shim
 * Re-exports from modular ai/ directory so existing imports still work.
 */
export {
  MODEL_CONFIG,
  MODEL_ROUTING,
  AB_SPLIT_CONFIG,
  getModelForTask,
  isModelAvailable,
  refreshAvailableModels,
  isAIAvailable,
  calculateConfidence,
  extractCompletionText,
  getModelForField,
  spellCheckNorwegian,
  generateSOAPSuggestions,
  suggestDiagnosisCodes,
  analyzeRedFlags,
  generateClinicalSummary,
  learnFromOutcome,
  organizeOldJournalNotes,
  organizeMultipleNotes,
  mergeOrganizedNotes,
  getAIStatus,
  buildFieldPrompt,
  generateCompletionStream,
} from './ai/index.js';

// generateCompletion is used by clinicalAgent.js but was not exported from the original.
// Export it now so the import resolves.
export { generateCompletion } from './ai/promptBuilder.js';

export { default } from './ai/index.js';
