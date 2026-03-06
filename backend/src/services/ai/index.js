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
} from './promptBuilder.js';

// Default export matching original ai.js default export
import { spellCheckNorwegian } from './promptBuilder.js';
import { generateSOAPSuggestions } from './promptBuilder.js';
import { suggestDiagnosisCodes } from './promptBuilder.js';
import { analyzeRedFlags } from './promptBuilder.js';
import { generateClinicalSummary } from './promptBuilder.js';
import { learnFromOutcome } from './promptBuilder.js';
import { organizeOldJournalNotes } from './promptBuilder.js';
import { organizeMultipleNotes } from './promptBuilder.js';
import { mergeOrganizedNotes } from './promptBuilder.js';
import { getAIStatus } from './promptBuilder.js';
import { getModelForTask } from './modelRouter.js';
import { MODEL_ROUTING } from './modelRouter.js';

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
