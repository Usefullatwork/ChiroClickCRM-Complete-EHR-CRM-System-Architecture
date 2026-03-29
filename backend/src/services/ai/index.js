/**
 * AI Service — Module Index
 * Re-exports everything that ai.js previously exported
 */

// Model router exports
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
} from './modelRouter.js';

// System prompts (centralized persona definitions)
export {
  SPELL_CHECK_PROMPT,
  SOAP_PROMPTS,
  buildDiagnosisPrompt,
  RED_FLAG_PROMPT,
  CLINICAL_SUMMARY_PROMPT,
  JOURNAL_ORGANIZATION_PROMPT,
  MERGE_NOTES_PROMPT,
  SMS_CONSTRAINT,
} from './systemPrompts.js';

// Context management (OpenViking-inspired tiered loading)
export {
  buildTieredContext,
  invalidatePatientContext,
  clearContextCache,
  TIERED_ENABLED,
} from './contextManager.js';

export {
  recordLearning,
  getSessionContext,
  clearSessionMemory,
  clearAllSessionMemory,
} from './sessionMemory.js';

// Prompt builder exports (high-level AI functions)
export {
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
  generateCompletion,
} from './promptBuilder.js';

// Default export matching original ai.js default export
import {
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
} from './promptBuilder.js';
import { getModelForTask, MODEL_ROUTING } from './modelRouter.js';

export default {
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
  getModelForTask,
  MODEL_ROUTING,
};
