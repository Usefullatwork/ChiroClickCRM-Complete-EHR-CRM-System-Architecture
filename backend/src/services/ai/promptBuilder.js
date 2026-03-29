/**
 * Prompt Builder — Barrel re-export
 * Sub-modules: promptShared.js, clinicalPrompts.js, journalPrompts.js
 */

// Shared infrastructure
export {
  generateCompletion,
  getAIStatus,
  buildFieldPrompt,
  generateCompletionStream,
} from './promptShared.js';

// Clinical prompts (SOAP, diagnosis, red flags, summary)
export {
  spellCheckNorwegian,
  generateSOAPSuggestions,
  suggestDiagnosisCodes,
  analyzeRedFlags,
  generateClinicalSummary,
  learnFromOutcome,
} from './clinicalPrompts.js';

// Journal organization prompts
export {
  organizeOldJournalNotes,
  organizeMultipleNotes,
  mergeOrganizedNotes,
} from './journalPrompts.js';
