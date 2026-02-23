/**
 * Jest mock for AI service
 * Prevents tests from attempting real Ollama calls
 */

export const spellCheckNorwegian = jest.fn().mockResolvedValue({
  original: '',
  corrected: '',
  hasChanges: false,
  aiAvailable: false,
});

export const generateSOAPSuggestions = jest.fn().mockResolvedValue({
  section: 'subjective',
  chiefComplaint: '',
  suggestion: '',
  aiAvailable: false,
});

export const suggestDiagnosisCodes = jest.fn().mockResolvedValue({
  suggestion: '',
  codes: [],
  reasoning: '',
  aiAvailable: false,
});

export const analyzeRedFlags = jest.fn().mockResolvedValue({
  analysis: '',
  riskLevel: 'LOW',
  canTreat: true,
  recommendReferral: false,
  detectedFlags: [],
  medicationWarnings: [],
  aiAvailable: false,
});

export const generateClinicalSummary = jest.fn().mockResolvedValue({
  summary: '',
  encounterId: null,
  aiAvailable: false,
});

export const learnFromOutcome = jest.fn().mockResolvedValue({ success: true });

export const organizeOldJournalNotes = jest.fn().mockResolvedValue({
  success: false,
  organizedData: null,
  aiAvailable: false,
});

export const organizeMultipleNotes = jest.fn().mockResolvedValue({
  totalNotes: 0,
  successfullyProcessed: 0,
  results: [],
  aiAvailable: false,
});

export const mergeOrganizedNotes = jest.fn().mockResolvedValue({
  success: false,
  mergedNote: '',
  sourceNotesCount: 0,
  aiAvailable: false,
});

export const getAIStatus = jest.fn().mockResolvedValue({
  provider: 'ollama',
  available: false,
  enabled: false,
  model: 'chiro-no',
  message: 'AI is disabled via AI_ENABLED=false',
});

export const getModelForTask = jest.fn().mockResolvedValue({
  model: 'chiro-no',
  abVariant: null,
});

export const isModelAvailable = jest.fn().mockResolvedValue(false);
export const refreshAvailableModels = jest.fn().mockResolvedValue(undefined);

export const MODEL_ROUTING = {};
export const MODEL_CONFIG = {};
export const AB_SPLIT_CONFIG = {};

export const extractCompletionText = jest.fn((result) => {
  if (typeof result === 'string') {
    return result;
  }
  if (result?.text) {
    return result.text;
  }
  return '';
});

export const calculateConfidence = jest.fn().mockReturnValue({
  score: 0.5,
  factors: [],
  level: 'medium',
});

export const getModelForField = jest.fn().mockResolvedValue('chiro-no');

export const buildFieldPrompt = jest.fn().mockReturnValue('');

export const generateCompletionStream = jest.fn().mockResolvedValue(undefined);

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
