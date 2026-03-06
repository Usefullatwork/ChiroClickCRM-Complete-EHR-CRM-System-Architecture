/**
 * Model Router
 * Handles model selection, routing, A/B testing, and availability checking
 */

import axios from 'axios';
import logger from '../../utils/logger.js';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const AI_MODEL = process.env.AI_MODEL || 'chiro-no-sft-dpo-v5';
const AI_ENABLED = process.env.AI_ENABLED !== 'false';

// Per-task model env var overrides
const AI_MODEL_SOAP = process.env.AI_MODEL_SOAP || null;
const AI_MODEL_REDFLAGS = process.env.AI_MODEL_REDFLAGS || null;
const AI_MODEL_FAST = process.env.AI_MODEL_FAST || null;
const AI_MODEL_MEDICAL = process.env.AI_MODEL_MEDICAL || null;
const AI_MODEL_COMMS = process.env.AI_MODEL_COMMS || null;
const AI_MODEL_LETTERS = process.env.AI_MODEL_LETTERS || null;

// Smart model lifecycle: keep_alive controls how long models stay in VRAM
const _KEEP_ALIVE = process.env.AI_KEEP_ALIVE || '2m';
const _currentLoadedModel = null;

/**
 * Model configurations with metadata
 * Sprint 2: All models unified on Qwen2.5-Instruct architecture (ChatML template)
 * Base models are vanilla Qwen2.5; LoRA variants are fine-tuned on clinical data
 */
export const MODEL_CONFIG = {
  // === Primary model: SFT+DPO merged (best quality, 77% eval) ===
  'chiro-no-sft-dpo-v5': {
    name: 'chiro-no-sft-dpo-v5',
    base: 'Qwen2.5-7B-Instruct + SFT + DPO',
    description: 'SFT+DPO merged clinical model (77% eval, Q8_0 GGUF)',
    size: '~8.1GB',
    maxTokens: 4096,
    temperature: 0.3,
    evalScore: '77%',
    fallbackModel: 'chiro-no-lora-v5',
  },

  // === SFT-only fallback (for A/B testing) ===
  'chiro-no-lora-v5': {
    name: 'chiro-no-lora-v5',
    base: 'Qwen2.5-7B-Instruct + LoRA v5',
    description: 'SFT-only v5 clinical model (72% eval, ADAPTER method)',
    size: '~4.8GB',
    maxTokens: 4096,
    temperature: 0.3,
    evalScore: '72%',
  },

  // === Specialized models ===
  'chiro-fast': {
    name: 'chiro-fast',
    base: 'Qwen2.5-1.5B-Instruct',
    description: 'Fast autocomplete and suggestions',
    size: '~1GB',
    maxTokens: 2048,
    temperature: 0.5,
    baseline: '48%',
  },
  'chiro-medical': {
    name: 'chiro-medical',
    base: 'Qwen2.5-3B-Instruct',
    description: 'Clinical reasoning and safety analysis',
    size: '~2GB',
    maxTokens: 2048,
    temperature: 0.2,
    baseline: '54%',
  },
};

/**
 * Task-based model routing
 * Routes different clinical tasks to the most appropriate specialized model
 */
export const MODEL_ROUTING = {
  // SOAP & clinical documentation
  soap_notes: 'chiro-no-sft-dpo-v5',
  clinical_summary: 'chiro-no-sft-dpo-v5',
  journal_organization: 'chiro-no-sft-dpo-v5',
  diagnosis_suggestion: 'chiro-no-sft-dpo-v5',
  sick_leave: 'chiro-no-sft-dpo-v5',

  // Fast autocomplete
  autocomplete: 'chiro-fast',
  spell_check: 'chiro-fast',
  abbreviation: 'chiro-fast',
  quick_suggestion: 'chiro-fast',

  // Letters & reports
  referral_letter: 'chiro-no-sft-dpo-v5',
  report_writing: 'chiro-no-sft-dpo-v5',

  // Communication
  patient_communication: 'chiro-no-sft-dpo-v5',
  patient_education: 'chiro-no-sft-dpo-v5',
  consent_form: 'chiro-no-sft-dpo-v5',

  // Norwegian
  norwegian_text: 'chiro-no-sft-dpo-v5',

  // Safety & red flags
  red_flag_analysis: 'chiro-no-sft-dpo-v5',
  differential_diagnosis: 'chiro-medical',
  treatment_safety: 'chiro-no-sft-dpo-v5',
  clinical_reasoning: 'chiro-medical',
  medication_interaction: 'chiro-medical',
  contraindication_check: 'chiro-no-sft-dpo-v5',
};

/**
 * A/B Testing Configuration
 */
export const AB_SPLIT_CONFIG = {
  'chiro-no-sft-dpo-v6': {
    loraModel: 'chiro-no-sft-dpo-v5',
    loraPercent: parseInt(process.env.AB_SPLIT_V6 || '0', 10),
    enabled: process.env.AB_SPLIT_V6 !== undefined,
  },
  'chiro-no-sft-dpo-v5': {
    loraModel: 'chiro-no-lora-v5',
    loraPercent: parseInt(process.env.AB_SPLIT_NO || '0', 10),
    enabled: process.env.AB_SPLIT_NO !== undefined,
  },
};

/**
 * Env var override mapping for task categories
 */
const TASK_ENV_OVERRIDES = {
  soap_notes: AI_MODEL_SOAP,
  clinical_summary: AI_MODEL_SOAP,
  journal_organization: AI_MODEL_SOAP,
  red_flag_analysis: AI_MODEL_REDFLAGS,
  treatment_safety: AI_MODEL_REDFLAGS,
  contraindication_check: AI_MODEL_REDFLAGS,
  autocomplete: AI_MODEL_FAST,
  spell_check: AI_MODEL_FAST,
  abbreviation: AI_MODEL_FAST,
  quick_suggestion: AI_MODEL_FAST,
  differential_diagnosis: AI_MODEL_MEDICAL,
  clinical_reasoning: AI_MODEL_MEDICAL,
  medication_interaction: AI_MODEL_MEDICAL,
  patient_communication: AI_MODEL_COMMS,
  patient_education: AI_MODEL_COMMS,
  referral_letter: AI_MODEL_LETTERS,
  report_writing: AI_MODEL_LETTERS,
};

// Model availability cache — refreshed every 5 minutes
let availableModelsCache = null;
let availableModelsCacheTime = 0;
const MODEL_CACHE_TTL = 5 * 60 * 1000;

/**
 * Refresh the available models cache from Ollama
 */
export const refreshAvailableModels = async () => {
  try {
    const response = await axios.get(`${OLLAMA_BASE_URL}/api/tags`, { timeout: 5000 });
    const models = response.data.models?.map((m) => m.name.split(':')[0]) || [];
    availableModelsCache = new Set(models);
    availableModelsCacheTime = Date.now();
    logger.debug('Model availability cache refreshed', { models: [...availableModelsCache] });
  } catch (error) {
    logger.warn('Failed to refresh model availability cache:', error.message);
    if (!availableModelsCache) {
      availableModelsCache = new Set();
    }
  }
};

/**
 * Check if a model is available in Ollama (uses cache)
 */
export const isModelAvailable = async (modelName) => {
  if (!availableModelsCache || Date.now() - availableModelsCacheTime > MODEL_CACHE_TTL) {
    await refreshAvailableModels();
  }
  return availableModelsCache.has(modelName);
};

/**
 * Apply A/B split to a model selection.
 * Returns the LoRA variant with configured probability, otherwise the base model.
 */
const applyABSplit = async (selectedModel) => {
  const config = AB_SPLIT_CONFIG[selectedModel];
  if (!config || !config.enabled || config.loraPercent <= 0) {
    return { model: selectedModel, abVariant: null };
  }

  const loraAvailable = await isModelAvailable(config.loraModel);
  if (!loraAvailable) {
    return { model: selectedModel, abVariant: null };
  }

  const roll = Math.random() * 100;
  if (roll < config.loraPercent) {
    logger.debug(
      `A/B split: ${selectedModel} → ${config.loraModel} (roll=${roll.toFixed(1)}, threshold=${config.loraPercent}%)`
    );
    return { model: config.loraModel, abVariant: 'lora' };
  }

  return { model: selectedModel, abVariant: 'base' };
};

/**
 * Get the appropriate model for a given task type
 * Priority: env var override > A/B split > MODEL_ROUTING > AI_MODEL fallback
 */
export const getModelForTask = async (taskType) => {
  // 1. Check env var override
  const envOverride = TASK_ENV_OVERRIDES[taskType];
  if (envOverride) {
    const available = await isModelAvailable(envOverride);
    if (available) {
      return { model: envOverride, abVariant: null };
    }
    logger.warn(
      `Env override model "${envOverride}" unavailable for task "${taskType}", using routing`
    );
  }

  // 2. Check MODEL_ROUTING
  const routedModel = MODEL_ROUTING[taskType] || AI_MODEL;

  // 3. Check availability and fall back if needed
  const available = await isModelAvailable(routedModel);
  if (available) {
    const abResult = await applyABSplit(routedModel);
    return abResult;
  }

  // 4. Check if model config has a fallback
  const config = MODEL_CONFIG[routedModel];
  if (config?.fallbackModel) {
    const fallbackAvailable = await isModelAvailable(config.fallbackModel);
    if (fallbackAvailable) {
      logger.info(
        `Model "${routedModel}" unavailable, falling back to "${config.fallbackModel}" for task "${taskType}"`
      );
      const abResult = await applyABSplit(config.fallbackModel);
      return abResult;
    }
  }

  // 5. Ultimate fallback to AI_MODEL
  logger.warn(`No available model found for task "${taskType}", using default "${AI_MODEL}"`);
  return { model: AI_MODEL, abVariant: null };
};

/**
 * Check if AI is available and enabled
 */
export const isAIAvailable = () => AI_ENABLED;

/**
 * Calculate confidence score for an AI response.
 * Returns 0-1 score compatible with frontend AIConfidenceBadge.
 */
export const calculateConfidence = (response, taskType, modelName) => {
  let score = 0.5;
  const factors = [];

  // Factor 1: Response length
  if (response.length > 200) {
    score += 0.1;
    factors.push('adequate_length');
  }
  if (response.length < 30) {
    score -= 0.2;
    factors.push('very_short');
  }

  // Factor 2: Task-model alignment (strip LoRA/SFT-DPO suffixes for matching)
  const baseModel = modelName?.replace(/-(lora|sft-dpo)(-v\d+)?$/, '') || '';
  const modelTaskFit = {
    'chiro-medical': ['differential_diagnosis', 'clinical_reasoning', 'medication_interaction'],
    'chiro-norwegian': ['norwegian_text'],
    'chiro-fast': ['autocomplete', 'spell_check', 'abbreviation', 'quick_suggestion'],
    'chiro-no': [
      'soap_notes',
      'clinical_summary',
      'journal_organization',
      'diagnosis_suggestion',
      'sick_leave',
      'referral_letter',
      'report_writing',
      'red_flag_analysis',
      'treatment_safety',
      'contraindication_check',
      'patient_communication',
      'patient_education',
      'consent_form',
      'general',
    ],
  };
  if (modelTaskFit[baseModel]?.includes(taskType)) {
    score += 0.15;
    factors.push('model_task_match');
  }

  // Factor 3: Response coherence (has sentences)
  if (response.includes('.') && response.length > 50) {
    score += 0.1;
    factors.push('structured_response');
  }

  // Factor 4: Medical terminology presence (for clinical tasks)
  const medicalTerms = /diagnos|behandl|smert|funn|vurder|palpas|ROM|VAS|terapi/i;
  const clinicalTasks = [
    'soap_notes',
    'red_flag_analysis',
    'diagnosis_suggestion',
    'clinical_summary',
    'differential_diagnosis',
  ];
  if (clinicalTasks.includes(taskType) && medicalTerms.test(response)) {
    score += 0.1;
    factors.push('medical_terminology');
  }

  // Clamp to 0-1
  score = Math.max(0, Math.min(1, score));

  const level = score >= 0.75 ? 'high' : score >= 0.45 ? 'medium' : 'low';

  return { score, factors, level };
};

/**
 * Get the appropriate model for a clinical field type
 */
export const getModelForField = async (fieldType) => {
  const fieldTaskMap = {
    'spell-check': 'spell_check',
    autocomplete: 'autocomplete',
    'soap-subjective': 'soap_notes',
    'soap-objective': 'soap_notes',
    'soap-assessment': 'soap_notes',
    'soap-plan': 'soap_notes',
    diagnosis: 'diagnosis_suggestion',
    'red-flag': 'red_flag_analysis',
    letter: 'referral_letter',
    communication: 'patient_communication',
  };
  const taskType = fieldTaskMap[fieldType];
  if (taskType) {
    const result = await getModelForTask(taskType);
    return result.model;
  }
  return AI_MODEL || 'chiro-no-sft-dpo-v5';
};

/**
 * Extract text from completion result (handles both enhanced and simple formats)
 */
export const extractCompletionText = (result) => {
  if (typeof result === 'string') {
    return result;
  }
  if (result && typeof result === 'object' && result.text) {
    return result.text;
  }
  return '';
};

export { AI_MODEL, AI_ENABLED, OLLAMA_BASE_URL };
