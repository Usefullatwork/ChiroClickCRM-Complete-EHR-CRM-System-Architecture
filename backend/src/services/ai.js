/**
 * AI Service
 * Intelligent clinical assistance using Ollama (local)
 *
 * Features:
 * - SOAP note generation and suggestions
 * - Spell checking and grammar correction (Norwegian)
 * - Clinical reasoning and diagnosis support
 * - Red flag detection and safety analysis
 * - RAG-augmented context retrieval
 * - Safety guardrails and output filtering
 *
 * Model Configuration (12GB RAM optimized, all Qwen2.5 architecture):
 * - chiro-no (Qwen2.5-7B ~4.5GB) - Default clinical documentation
 * - chiro-fast (Qwen2.5-1.5B ~1GB) - Quick autocomplete
 * - chiro-norwegian (Qwen2.5-7B ~4.5GB) - Norwegian language specialist
 * - chiro-medical (Qwen2.5-3B ~2GB) - Clinical reasoning and safety
 *
 * Requires: Minimum 8GB RAM, recommended 12-16GB for multi-model routing
 */

import axios from 'axios';
import logger from '../utils/logger.js';
import { query } from '../config/database.js';
import {
  validateClinicalContent,
  checkRedFlagsInContent,
  checkMedicationWarnings,
} from './clinicalValidation.js';
import circuitBreakerRegistry from '../infrastructure/resilience/CircuitBreakerRegistry.js';
import { getAIProvider } from './providers/aiProviderFactory.js';

// Get the pre-registered Ollama circuit breaker and set requestTimeout
// to exceed the per-request axios timeout (30s) so the breaker tracks
// failures from real timeouts rather than racing with its own timer.
const ollamaBreaker = circuitBreakerRegistry.getBreaker('ollama');
ollamaBreaker.requestTimeout = 35000;

// Import guardrails for input validation and output filtering
let guardrailsService = null;
let guardrailsAvailable = false;
let guardrailsLoadError = null;
try {
  const guardrails = await import('./guardrails.js');
  guardrailsService = guardrails.guardrailsService;
  guardrailsAvailable = true;
} catch (e) {
  guardrailsAvailable = false;
  guardrailsLoadError = e.message;
  logger.error('Failed to load guardrails service — safety filtering unavailable', {
    error: e.message,
    stack: e.stack,
  });
}

// Fallback guardrails: basic safety defaults when guardrails module fails to load
const FALLBACK_GUARDRAILS = {
  blockedPatterns: [
    /\b(ignore previous|disregard instructions|pretend you are)\b/i,
    /\b(system prompt|jailbreak|bypass safety)\b/i,
  ],
  maxInputLength: 10000,
  maxOutputLength: 5000,
};

const applyFallbackInputValidation = (prompt) => {
  if (!prompt || typeof prompt !== 'string') {
    return { proceed: false, sanitized: '', issues: [{ message: 'Invalid input' }], warnings: [] };
  }
  if (prompt.length > FALLBACK_GUARDRAILS.maxInputLength) {
    return { proceed: false, sanitized: '', issues: [{ message: 'Input too long' }], warnings: [] };
  }
  for (const pattern of FALLBACK_GUARDRAILS.blockedPatterns) {
    if (pattern.test(prompt)) {
      return {
        proceed: false,
        sanitized: '',
        issues: [{ message: 'Blocked input pattern detected' }],
        warnings: [],
      };
    }
  }
  return { proceed: true, sanitized: prompt, issues: [], warnings: [] };
};

// Import RAG service for context augmentation
let ragService = null;
try {
  const rag = await import('./rag.js');
  ragService = rag.ragService;
} catch (e) {
  logger.warn('RAG service not available:', e.message);
}

/**
 * Safety-critical task types that MUST have guardrails
 * If guardrails are unavailable for these, we must fail safe
 */
const SAFETY_CRITICAL_TASKS = [
  'red_flag_analysis',
  'differential_diagnosis',
  'treatment_safety',
  'clinical_reasoning',
  'medication_interaction',
  'contraindication_check',
  'diagnosis_suggestion',
];

/**
 * Check if guardrails are required and available for a task type
 * Returns { required: boolean, available: boolean, canProceed: boolean }
 */
const checkGuardrailsForTask = (taskType, skipGuardrails = false) => {
  const isSafetyCritical = SAFETY_CRITICAL_TASKS.includes(taskType);
  const guardrailsEnabled = process.env.GUARDRAILS_ENABLED !== 'false';

  // Safety-critical tasks MUST have guardrails in production
  if (isSafetyCritical && !skipGuardrails) {
    if (!guardrailsAvailable) {
      logger.error(`SAFETY: Guardrails unavailable for safety-critical task: ${taskType}`, {
        loadError: guardrailsLoadError,
        taskType,
      });
      return {
        required: true,
        available: false,
        canProceed: process.env.NODE_ENV !== 'production', // Only allow in dev
        reason: `Guardrails required for ${taskType} but not available`,
      };
    }
    if (!guardrailsEnabled) {
      logger.warn(`SAFETY: Guardrails disabled for safety-critical task: ${taskType}`);
      return {
        required: true,
        available: true,
        canProceed: process.env.NODE_ENV !== 'production',
        reason: `Guardrails disabled but required for ${taskType}`,
      };
    }
  }

  return {
    required: isSafetyCritical,
    available: guardrailsAvailable && guardrailsEnabled,
    canProceed: true,
    reason: null,
  };
};

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const AI_MODEL = process.env.AI_MODEL || 'chiro-no'; // Default: chiro-no (Qwen2.5-7B)
const AI_ENABLED = process.env.AI_ENABLED !== 'false'; // Default: true unless explicitly disabled
const GUARDRAILS_ENABLED = process.env.GUARDRAILS_ENABLED !== 'false'; // Default: true
const RAG_ENABLED = process.env.RAG_ENABLED !== 'false'; // Default: true

// Per-task model env var overrides
const AI_MODEL_SOAP = process.env.AI_MODEL_SOAP || null;
const AI_MODEL_REDFLAGS = process.env.AI_MODEL_REDFLAGS || null;
const AI_MODEL_FAST = process.env.AI_MODEL_FAST || null;
const AI_MODEL_MEDICAL = process.env.AI_MODEL_MEDICAL || null;
const AI_MODEL_COMMS = process.env.AI_MODEL_COMMS || null;
const AI_MODEL_LETTERS = process.env.AI_MODEL_LETTERS || null;

// Smart model lifecycle: keep_alive controls how long models stay in VRAM
// On 16GB systems, only 1 model should be resident at a time
const KEEP_ALIVE = process.env.AI_KEEP_ALIVE || '2m'; // Unload after 2 min idle
let currentLoadedModel = null;

/**
 * A/B Testing Configuration
 *
 * Controls traffic split between base and LoRA model variants.
 * loraPercent: 0-100 — percentage of requests routed to LoRA variant
 * enabled: whether A/B testing is active for this model pair
 *
 * When disabled or not configured, the default MODEL_ROUTING is used.
 * Override via env vars: AB_SPLIT_NORWEGIAN=50 (sends 50% to LoRA)
 */
const AB_SPLIT_CONFIG = {
  'chiro-norwegian': {
    loraModel: 'chiro-norwegian-lora-v2',
    loraPercent: parseInt(process.env.AB_SPLIT_NORWEGIAN || '0', 10),
    enabled: process.env.AB_SPLIT_NORWEGIAN !== undefined,
  },
  'chiro-no': {
    loraModel: 'chiro-no-lora-v2',
    loraPercent: parseInt(process.env.AB_SPLIT_NO || '0', 10),
    enabled: process.env.AB_SPLIT_NO !== undefined,
  },
  'chiro-medical': {
    loraModel: 'chiro-medical-lora',
    loraPercent: parseInt(process.env.AB_SPLIT_MEDICAL || '0', 10),
    enabled: process.env.AB_SPLIT_MEDICAL !== undefined,
  },
  'chiro-fast': {
    loraModel: 'chiro-fast-lora',
    loraPercent: parseInt(process.env.AB_SPLIT_FAST || '0', 10),
    enabled: process.env.AB_SPLIT_FAST !== undefined,
  },
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

  // Check if LoRA variant is available
  const loraAvailable = await isModelAvailable(config.loraModel);
  if (!loraAvailable) {
    return { model: selectedModel, abVariant: null };
  }

  // Random split
  const roll = Math.random() * 100;
  if (roll < config.loraPercent) {
    logger.debug(
      `A/B split: ${selectedModel} → ${config.loraModel} (roll=${roll.toFixed(1)}, threshold=${config.loraPercent}%)`
    );
    return { model: config.loraModel, abVariant: 'lora' };
  }

  return { model: selectedModel, abVariant: 'base' };
};

// Model availability cache — refreshed every 5 minutes
let availableModelsCache = null;
let availableModelsCacheTime = 0;
const MODEL_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Model configurations with metadata
 * Sprint 2: All models unified on Qwen2.5-Instruct architecture (ChatML template)
 * Base models are vanilla Qwen2.5; LoRA variants are fine-tuned on clinical data
 */
const MODEL_CONFIG = {
  'chiro-no': {
    name: 'chiro-no',
    base: 'Qwen2.5-7B-Instruct',
    description: 'Primary clinical documentation model',
    size: '~4.5GB',
    maxTokens: 4096,
    temperature: 0.3,
    baseline: '56%',
  },
  'chiro-fast': {
    name: 'chiro-fast',
    base: 'Qwen2.5-1.5B-Instruct',
    description: 'Fast autocomplete and suggestions',
    size: '~1GB',
    maxTokens: 2048,
    temperature: 0.5,
    baseline: '48%',
  },
  'chiro-norwegian': {
    name: 'chiro-norwegian',
    base: 'Qwen2.5-7B-Instruct',
    description: 'Norwegian language specialist',
    size: '~4.5GB',
    maxTokens: 4096,
    temperature: 0.3,
    baseline: '44%',
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

  // LoRA fine-tuned variants (deployed to Ollama)
  // All use same Qwen2.5 base as above, fine-tuned on 12K+ clinical examples
  'chiro-fast-lora': {
    name: 'chiro-fast-lora',
    base: 'Qwen2.5-1.5B-Instruct + LoRA',
    description: 'LoRA-tuned fast model for autocomplete',
    size: '~3.1GB',
    maxTokens: 2048,
    temperature: 0.5,
    fallbackModel: 'chiro-fast',
  },
  'chiro-medical-lora': {
    name: 'chiro-medical-lora',
    base: 'Qwen2.5-3B-Instruct + LoRA',
    description: 'LoRA-tuned medical model for safety analysis',
    size: '~6.2GB',
    maxTokens: 2048,
    temperature: 0.2,
    fallbackModel: 'chiro-medical',
  },
  'chiro-norwegian-lora': {
    name: 'chiro-norwegian-lora',
    base: 'Qwen2.5-7B-Instruct + LoRA',
    description: 'LoRA-tuned for Norwegian clinical documentation (v1)',
    size: '~14.2GB',
    maxTokens: 4096,
    temperature: 0.3,
    fallbackModel: 'chiro-norwegian',
  },
  'chiro-no-lora': {
    name: 'chiro-no-lora',
    base: 'Qwen2.5-7B-Instruct + LoRA',
    description: 'LoRA-tuned default clinical model (v1)',
    size: '~15GB',
    maxTokens: 4096,
    temperature: 0.2,
    fallbackModel: 'chiro-no',
  },

  // v2 LoRA models — ADAPTER deployment (4.8GB, 3.5s load)
  'chiro-no-lora-v2': {
    name: 'chiro-no-lora-v2',
    base: 'Qwen2.5-7B-Instruct + LoRA v2',
    description: 'LoRA v2 clinical model (58.6% eval, ADAPTER method)',
    size: '~4.8GB',
    maxTokens: 4096,
    temperature: 0.3,
    fallbackModel: 'chiro-no-lora',
    evalScore: '58.6%',
  },
  'chiro-norwegian-lora-v2': {
    name: 'chiro-norwegian-lora-v2',
    base: 'Qwen2.5-7B-Instruct + LoRA v2',
    description: 'LoRA v2 Norwegian specialist (ADAPTER method)',
    size: '~4.8GB',
    maxTokens: 4096,
    temperature: 0.3,
    fallbackModel: 'chiro-norwegian-lora',
  },
};

/**
 * Task-based model routing
 * Routes different clinical tasks to the most appropriate specialized model
 *
 * Routing strategy (v4 split — clinical vs communication):
 * - SOAP, letters, reports, red flags → chiro-no-lora-v4 (best clinical quality)
 * - SMS/communication → chiro-no-lora-v2 (concise, length-appropriate)
 * - Norwegian text generation → chiro-norwegian-lora-v2
 * - Medical reasoning → chiro-medical (Qwen2.5-3B)
 * - Fast completions → chiro-fast (Qwen2.5-1.5B)
 */
const MODEL_ROUTING = {
  // SOAP & clinical documentation → v4 (90% pass rate, +10% vs v2)
  soap_notes: 'chiro-no-lora-v4',
  clinical_summary: 'chiro-no-lora-v4',
  journal_organization: 'chiro-no-lora-v4',
  diagnosis_suggestion: 'chiro-no-lora-v4',
  sick_leave: 'chiro-no-lora-v4',

  // Fast autocomplete → chiro-fast ORIGINAL (LoRA hurts small models)
  autocomplete: 'chiro-fast',
  spell_check: 'chiro-fast',
  abbreviation: 'chiro-fast',
  quick_suggestion: 'chiro-fast',

  // Letters & reports → v4 (85.7% pass rate, +14% vs v2)
  referral_letter: 'chiro-no-lora-v4',
  report_writing: 'chiro-no-lora-v4',

  // Communication (SMS) → v2 (81.2% pass rate, concise output)
  patient_communication: 'chiro-no-lora-v2',
  patient_education: 'chiro-no-lora-v2',
  consent_form: 'chiro-no-lora-v2',

  // Norwegian language specialist
  norwegian_text: 'chiro-norwegian-lora-v2',

  // Safety & red flags → v4 for analysis, chiro-medical for reasoning
  red_flag_analysis: 'chiro-no-lora-v4',
  differential_diagnosis: 'chiro-medical',
  treatment_safety: 'chiro-no-lora-v4',
  clinical_reasoning: 'chiro-medical',
  medication_interaction: 'chiro-medical',
  contraindication_check: 'chiro-no-lora-v4',
};

/**
 * Env var override mapping for task categories
 * Maps task types to their env var override
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

/**
 * Refresh the available models cache from Ollama
 */
const refreshAvailableModels = async () => {
  try {
    const response = await axios.get(`${OLLAMA_BASE_URL}/api/tags`, { timeout: 5000 });
    const models = response.data.models?.map((m) => m.name.split(':')[0]) || [];
    availableModelsCache = new Set(models);
    availableModelsCacheTime = Date.now();
    logger.debug('Model availability cache refreshed', { models: [...availableModelsCache] });
  } catch (error) {
    logger.warn('Failed to refresh model availability cache:', error.message);
    // Keep stale cache if we had one
    if (!availableModelsCache) {
      availableModelsCache = new Set();
    }
  }
};

/**
 * Check if a model is available in Ollama (uses cache)
 */
const isModelAvailable = async (modelName) => {
  if (!availableModelsCache || Date.now() - availableModelsCacheTime > MODEL_CACHE_TTL) {
    await refreshAvailableModels();
  }
  return availableModelsCache.has(modelName);
};

/**
 * Get the appropriate model for a given task type
 * Priority: env var override > A/B split > MODEL_ROUTING > AI_MODEL fallback
 * If selected model is unavailable, falls back to its base model
 *
 * Returns: { model: string, abVariant: string|null }
 * abVariant is 'base', 'lora', or null (no A/B test active)
 */
const getModelForTask = async (taskType) => {
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
    // 3b. Apply A/B split if configured
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
      // Apply A/B split to fallback model too
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
const isAIAvailable = () => AI_ENABLED;

/**
 * Calculate confidence score for an AI response.
 * Returns 0-1 score compatible with frontend AIConfidenceBadge.
 *
 * @param {string} response - The AI-generated text
 * @param {string} taskType - The task type (e.g. 'soap_notes', 'red_flag_analysis')
 * @param {string} modelName - The model that generated the response
 * @returns {{ score: number, factors: string[], level: 'high'|'medium'|'low' }}
 */
const calculateConfidence = (response, taskType, modelName) => {
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

  // Factor 2: Task-model alignment (strip LoRA suffixes for matching)
  const baseModel = modelName?.replace(/-lora(-v\d+)?$/, '') || '';
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
 * Log an AI suggestion to the database for analytics tracking.
 * Runs asynchronously — callers should .catch() to avoid blocking.
 */
const logSuggestion = async ({
  organizationId,
  suggestionType,
  modelName,
  inputText,
  suggestedText,
  confidenceScore,
  requestDurationMs,
  abVariant,
}) => {
  await query(
    `INSERT INTO ai_suggestions
      (organization_id, suggestion_type, model_name, input_text, suggested_text,
       confidence_score, request_duration_ms, model_version, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
    [
      organizationId,
      suggestionType,
      modelName,
      inputText,
      suggestedText,
      confidenceScore,
      requestDurationMs,
      abVariant || null,
    ]
  );
};

/**
 * Generate AI completion using selected provider
 *
 * Enhanced with:
 * - Safety guardrails for input validation and output filtering
 * - RAG-augmented context when available
 * - Model-specific temperature settings
 * - Hallucination risk assessment
 */
const generateCompletion = async (prompt, systemPrompt = null, options = {}) => {
  const {
    maxTokens = 500,
    temperature = null, // Will use model-specific default if not provided
    taskType = null,
    organizationId = null,
    patientId = null,
    useRAG = false,
    skipGuardrails = false,
    clinicalContext = null,
  } = options;

  const modelResult = taskType
    ? await getModelForTask(taskType)
    : { model: AI_MODEL, abVariant: null };
  const model = modelResult.model;
  const abVariant = modelResult.abVariant;
  const modelConfig = MODEL_CONFIG[model] || MODEL_CONFIG['chiro-no'];
  const effectiveTemperature = temperature ?? modelConfig.temperature ?? 0.3;

  // Step 0: Check if guardrails are required and available for this task
  const guardrailsCheck = checkGuardrailsForTask(taskType, skipGuardrails);
  if (!guardrailsCheck.canProceed) {
    logger.error('BLOCKED: Safety-critical task without guardrails', {
      taskType,
      reason: guardrailsCheck.reason,
    });
    throw new Error(
      `Safety-critical task "${taskType}" blocked: ${guardrailsCheck.reason}. ` +
        'Contact administrator to enable guardrails service.'
    );
  }

  // Step 1: Validate input through guardrails (or fallback)
  let sanitizedPrompt = prompt;
  let inputWarnings = [];
  let _guardrailsValidationFailed = false;

  if (GUARDRAILS_ENABLED && !skipGuardrails && !guardrailsService && !guardrailsAvailable) {
    // Apply fallback guardrails when main service is unavailable
    const fallbackResult = applyFallbackInputValidation(prompt);
    if (!fallbackResult.proceed) {
      logger.warn('Input blocked by fallback guardrails', { issues: fallbackResult.issues });
      throw new Error(
        `Input validation failed (fallback): ${fallbackResult.issues.map((i) => i.message).join('; ')}`
      );
    }
    sanitizedPrompt = fallbackResult.sanitized;
    inputWarnings = [{ message: 'Using fallback guardrails — full safety service unavailable' }];
  }

  if (GUARDRAILS_ENABLED && guardrailsService && !skipGuardrails) {
    try {
      const inputValidation = await guardrailsService.processInput(prompt, {
        type: taskType || 'general',
        context: clinicalContext,
      });

      if (!inputValidation.proceed) {
        logger.warn('Input blocked by guardrails', { issues: inputValidation.issues });
        throw new Error(
          `Input validation failed: ${inputValidation.issues.map((i) => i.message).join('; ')}`
        );
      }

      sanitizedPrompt = inputValidation.sanitized;
      inputWarnings = inputValidation.warnings || [];
    } catch (guardrailError) {
      _guardrailsValidationFailed = true;
      // For safety-critical tasks, fail if guardrails validation fails
      if (guardrailsCheck.required) {
        logger.error('BLOCKED: Guardrails validation failed for safety-critical task', {
          taskType,
          error: guardrailError.message,
        });
        throw new Error(
          `Safety validation failed for "${taskType}": ${guardrailError.message}. ` +
            'Cannot proceed without successful validation.'
        );
      }
      logger.warn('Guardrails validation error, proceeding with caution:', guardrailError.message);
    }
  }

  // Step 2: Augment with RAG context if enabled
  let augmentedPrompt = sanitizedPrompt;
  let ragContext = null;

  if (RAG_ENABLED && ragService && useRAG && organizationId) {
    try {
      const ragResult = await ragService.augmentPrompt(sanitizedPrompt, clinicalContext, {
        organizationId,
        patientId,
        maxChunks: 3,
        maxContextLength: 2000,
      });

      if (ragResult.context) {
        augmentedPrompt = ragResult.prompt;
        ragContext = {
          chunksUsed: ragResult.chunks.length,
          contextLength: ragResult.context.length,
        };
        logger.debug('RAG context added', ragContext);
      }
    } catch (ragError) {
      logger.warn('RAG augmentation failed, proceeding without context:', ragError.message);
    }
  }

  // Step 2b: Add length constraints for communication/SMS tasks
  let effectiveSystemPrompt = systemPrompt;
  if (taskType === 'patient_communication') {
    const smsConstraint =
      'VIKTIG: Skriv en kort SMS-melding. Maks 160 tegn (én SMS). ' +
      'Bruk direkte, vennlig språk. Ingen hilsener, ingen signatur, bare selve meldingen. ' +
      'Svar KUN med selve SMS-teksten.';
    effectiveSystemPrompt = effectiveSystemPrompt
      ? `${effectiveSystemPrompt}\n\n${smsConstraint}`
      : smsConstraint;
  }

  // Step 3: Generate completion via AI provider (Ollama, Claude, or fallback)
  // Provider handles retry logic, model routing, and streaming internally
  let rawOutput;
  let confidence;

  const provider = getAIProvider();
  const providerResult = await provider.generate(augmentedPrompt, effectiveSystemPrompt, {
    maxTokens,
    temperature: effectiveTemperature,
    model,
    taskType,
    organizationId,
  });

  rawOutput = providerResult.text;

  // Calculate confidence score for this response
  confidence = calculateConfidence(rawOutput, taskType, model);

  // Log suggestion to ai_suggestions table (non-blocking)
  if (organizationId && taskType) {
    logSuggestion({
      organizationId,
      suggestionType: taskType,
      modelName: providerResult.model || model,
      inputText: sanitizedPrompt.substring(0, 500),
      suggestedText: rawOutput.substring(0, 2000),
      confidenceScore: confidence.score,
      requestDurationMs: providerResult.durationMs || null,
      abVariant,
    }).catch((err) => logger.warn('Failed to log AI suggestion:', err.message));
  }

  // Step 4: Filter output through guardrails
  if (GUARDRAILS_ENABLED && guardrailsService && !skipGuardrails) {
    try {
      const outputResult = await guardrailsService.processOutput(rawOutput, {
        type: taskType || 'general',
        addDisclaimer: taskType === 'diagnosis_suggestion' || taskType === 'differential_diagnosis',
        clinicalContext,
      });

      if (outputResult.requiresReview) {
        logger.warn('Output flagged for review', {
          flags: outputResult.flags.map((f) => f.type),
          hallucinationRisk: outputResult.hallucinationRisk.level,
        });
      }

      // Return enhanced result with metadata
      return {
        text: outputResult.output,
        confidence,
        metadata: {
          model,
          modelConfig: modelConfig.description,
          abVariant,
          inputWarnings,
          outputFlags: outputResult.flags,
          hallucinationRisk: outputResult.hallucinationRisk,
          ragContext,
          requiresReview: outputResult.requiresReview,
          guardrailsApplied: true,
        },
      };
    } catch (guardrailError) {
      // For safety-critical tasks, fail if output filtering fails
      if (guardrailsCheck.required) {
        logger.error('BLOCKED: Output guardrails failed for safety-critical task', {
          taskType,
          error: guardrailError.message,
        });
        throw new Error(
          `Safety output filtering failed for "${taskType}": ${guardrailError.message}. ` +
            'Cannot return unvalidated output for safety-critical tasks.'
        );
      }
      logger.warn('Output guardrails error, returning raw:', guardrailError.message);
    }
  }

  // For safety-critical tasks without guardrails, add mandatory disclaimer
  if (guardrailsCheck.required && !guardrailsCheck.available) {
    const disclaimer =
      '\n\n⚠️ ADVARSEL: Dette resultatet er ikke validert av sikkerhetssystemet. ' +
      'Klinisk gjennomgang er PÅKREVD før bruk.';
    return {
      text: rawOutput + disclaimer,
      confidence,
      metadata: {
        model,
        modelConfig: modelConfig.description,
        abVariant,
        inputWarnings,
        guardrailsApplied: false,
        requiresReview: true,
        safetyWarning: 'Output not validated - manual review required',
      },
    };
  }

  // Return simple string for backward compatibility when guardrails disabled
  // Attach confidence as a property when possible
  return { text: rawOutput, confidence };
};

/**
 * Extract text from completion result (handles both enhanced and simple formats)
 */
const extractCompletionText = (result) => {
  if (typeof result === 'string') {
    return result;
  }
  if (result && typeof result === 'object' && result.text) {
    return result.text;
  }
  return '';
};

/**
 * Spell check and grammar correction for Norwegian clinical notes
 * Uses chiro-fast model for quick response
 */
export const spellCheckNorwegian = async (text) => {
  // Return fallback if AI is disabled
  if (!isAIAvailable()) {
    return { original: text, corrected: text, hasChanges: false, aiAvailable: false };
  }

  const systemPrompt = `Du er en norsk språkassistent som er spesialisert på kiropraktisk medisinsk terminologi.
Korriger stavefeil og grammatiske feil i den følgende kliniske teksten.
Behold alle medisinske fagtermer. Svar kun med den korrigerte teksten uten forklaringer.`;

  const prompt = `Korriger følgende tekst:\n\n${text}`;

  try {
    const result = await generateCompletion(prompt, systemPrompt, {
      maxTokens: 1000,
      temperature: 0.3,
      taskType: 'spell_check',
      skipGuardrails: true, // Skip guardrails for simple spell check
    });
    const correctedText = extractCompletionText(result);

    return {
      original: text,
      corrected: correctedText.trim(),
      hasChanges: text.trim() !== correctedText.trim(),
      confidence: result?.confidence || null,
      aiAvailable: true,
    };
  } catch (error) {
    logger.error('Spell check error:', error);
    return {
      original: text,
      corrected: text,
      hasChanges: false,
      aiAvailable: false,
      error: error.message,
    };
  }
};

/**
 * Generate SOAP note suggestions based on symptoms
 */
export const generateSOAPSuggestions = async (chiefComplaint, section = 'subjective') => {
  // Return fallback if AI is disabled
  if (!isAIAvailable()) {
    return { section, chiefComplaint, suggestion: '', aiAvailable: false };
  }

  let systemPrompt;
  let prompt;

  switch (section) {
    case 'subjective':
      systemPrompt = `Du er en erfaren kiropraktor i Norge. Generer relevante subjektive funn basert på pasientens hovedplage.
      Inkluder: sykehistorie, debut, smertebeskrivelse, forverrende/lindrende faktorer.
      Skriv på norsk i punktform.`;
      prompt = `Hovedplage: ${chiefComplaint}\n\nGenerer subjektive funn:`;
      break;

    case 'objective':
      systemPrompt = `Du er en erfaren kiropraktor. Generer relevante objektive funn og tester basert på pasientens hovedplage.
      Inkluder: observasjon, palpasjon, bevegelighet (ROM), ortopediske tester.
      Skriv på norsk i punktform.`;
      prompt = `Hovedplage: ${chiefComplaint}\n\nGenerer objektive funn:`;
      break;

    case 'assessment':
      systemPrompt = `Du er en erfaren kiropraktor. Generer klinisk vurdering basert på pasientens hovedplage.
      Inkluder: differensialdiagnose, prognose, klinisk resonnement.
      Skriv på norsk.`;
      prompt = `Hovedplage: ${chiefComplaint}\n\nGenerer vurdering:`;
      break;

    case 'plan':
      systemPrompt = `Du er en erfaren kiropraktor. Generer behandlingsplan basert på pasientens hovedplage.
      Inkluder: behandling, øvelser, råd, oppfølging.
      Skriv på norsk i punktform.`;
      prompt = `Hovedplage: ${chiefComplaint}\n\nGenerer plan:`;
      break;

    default:
      return {
        section,
        chiefComplaint,
        suggestion: '',
        error: 'Invalid section',
        aiAvailable: false,
      };
  }

  try {
    const result = await generateCompletion(prompt, systemPrompt, {
      maxTokens: 400,
      temperature: 0.8,
      taskType: 'soap_notes',
    });
    const suggestion = extractCompletionText(result);

    return {
      section,
      chiefComplaint,
      suggestion: suggestion.trim(),
      confidence: result?.confidence || null,
      aiAvailable: true,
      metadata: result?.metadata || null,
    };
  } catch (error) {
    logger.error('SOAP suggestion error:', error);
    return { section, chiefComplaint, suggestion: '', aiAvailable: false, error: error.message };
  }
};

/**
 * Suggest ICPC-2 diagnosis codes based on clinical presentation
 */
export const suggestDiagnosisCodes = async (soapData) => {
  // Return fallback if AI is disabled
  if (!isAIAvailable()) {
    return { suggestion: '', codes: [], reasoning: '', aiAvailable: false };
  }

  const { subjective, objective, assessment } = soapData;

  // Get common chiropractic ICPC-2 codes from database
  let availableCodes = [];
  try {
    const codesResult = await query(
      `SELECT code, description_no, description_en, chapter
       FROM diagnosis_codes
       WHERE system = 'ICPC2' AND chapter IN ('L', 'N') AND commonly_used = true
       ORDER BY usage_count DESC
       LIMIT 20`
    );
    availableCodes = codesResult.rows;
  } catch (dbError) {
    logger.error('Database error fetching diagnosis codes:', dbError);
    return {
      suggestion: '',
      codes: [],
      reasoning: '',
      aiAvailable: false,
      error: 'Database unavailable',
    };
  }

  const codesText = availableCodes.map((c) => `${c.code} - ${c.description_no}`).join('\n');

  const systemPrompt = `Du er en kiropraktor-assistent. Basert på kliniske funn, foreslå de mest relevante ICPC-2 diagnosekodene.

Tilgjengelige ICPC-2 koder:
${codesText}

Svar kun med de mest relevante kodene (1-3 stykker) og en kort forklaring.`;

  const prompt = `Kliniske funn:
Subjektivt: ${subjective?.chief_complaint || ''} ${subjective?.history || ''}
Objektivt: ${objective?.observation || ''} ${objective?.palpation || ''}
Vurdering: ${assessment?.clinical_reasoning || ''}

Foreslå ICPC-2 koder:`;

  try {
    const result = await generateCompletion(prompt, systemPrompt, {
      maxTokens: 300,
      temperature: 0.5,
      taskType: 'diagnosis_suggestion',
    });
    const suggestionText = extractCompletionText(result);

    // Extract codes from response
    const suggestedCodes = [];
    for (const code of availableCodes) {
      if (suggestionText.includes(code.code)) {
        suggestedCodes.push(code.code);
      }
    }

    return {
      suggestion: suggestionText.trim(),
      codes: suggestedCodes,
      reasoning: suggestionText,
      confidence: result?.confidence || null,
      aiAvailable: true,
    };
  } catch (error) {
    logger.error('Diagnosis suggestion error:', error);
    return { suggestion: '', codes: [], reasoning: '', aiAvailable: false, error: error.message };
  }
};

/**
 * Analyze red flags and suggest clinical actions
 * Combines rule-based clinical validation with AI analysis
 */
export const analyzeRedFlags = async (patientData, soapData) => {
  // First, use rule-based clinical validation for deterministic checks
  const clinicalContent = [
    soapData.subjective?.chief_complaint || '',
    soapData.subjective?.history || '',
    soapData.objective?.observation || '',
    soapData.objective?.ortho_tests || '',
    soapData.assessment?.clinical_reasoning || '',
  ].join(' ');

  // Rule-based red flag detection (works without AI)
  let redFlagsDetected = [];
  let medicationWarnings = [];
  try {
    redFlagsDetected = checkRedFlagsInContent(clinicalContent);
    medicationWarnings = checkMedicationWarnings(patientData.current_medications || []);
  } catch (error) {
    logger.error('Rule-based red flag check error:', error);
  }

  // Comprehensive validation with patient context
  const validationResult = await validateClinicalContent(clinicalContent, {
    patient: patientData,
  });

  // If critical flags detected by rules, return immediately
  if (validationResult.riskLevel === 'CRITICAL') {
    logger.warn('CRITICAL red flags detected by clinical validation', {
      flags: redFlagsDetected.map((f) => f.flag),
      patient: patientData.id,
    });

    return {
      analysis: `KRITISKE RØDE FLAGG OPPDAGET. ${redFlagsDetected
        .filter((f) => f.severity === 'CRITICAL')
        .map((f) => f.message)
        .join(' ')}`,
      riskLevel: 'CRITICAL',
      canTreat: false,
      recommendReferral: true,
      detectedFlags: redFlagsDetected,
      medicationWarnings,
      requiresImmediateAction: true,
      source: 'clinical_validation',
      aiAvailable: isAIAvailable(),
    };
  }

  // If AI is disabled, return rule-based results only
  if (!isAIAvailable()) {
    return {
      analysis:
        redFlagsDetected.length > 0
          ? `Automatisk oppdagede røde flagg: ${redFlagsDetected.map((f) => f.message).join('; ')}`
          : 'AI-analyse deaktivert. Regelbasert sjekk fullført.',
      riskLevel: validationResult.riskLevel,
      canTreat: !validationResult.hasRedFlags,
      recommendReferral: validationResult.requiresReview,
      detectedFlags: redFlagsDetected,
      medicationWarnings,
      confidence: validationResult.confidence,
      source: 'clinical_validation_only',
      aiAvailable: false,
    };
  }

  // For non-critical cases, augment with AI analysis
  const systemPrompt = `Du er en kiropraktor-sikkerhetsassistent. Analyser pasientdata og kliniske funn for røde flagg.

Røde flagg inkluderer:
- Malignitet (vekttap, nattlige smerter, tidligere kreft)
- Infeksjon (feber, immunsuppresjon)
- Cauda equina (blære-/tarmforstyrrelser, sadelformet nummenhet)
- Fraktur (betydelig trauma, osteoporose)
- Inflammatoriske tilstander (morgenstivhet, ung alder)

Vurder om pasienten kan behandles sikkert eller bør henvises.`;

  const prompt = `Pasient:
Alder: ${patientData.age || 'ukjent'}
Sykehistorie: ${patientData.medical_history || 'ingen'}
Nåværende medisiner: ${patientData.current_medications?.join(', ') || 'ingen'}
Kjente røde flagg: ${patientData.red_flags?.join(', ') || 'ingen'}
Kontraindikasjoner: ${patientData.contraindications?.join(', ') || 'ingen'}

Kliniske funn:
${soapData.subjective?.chief_complaint || ''}
${soapData.objective?.ortho_tests || ''}

${redFlagsDetected.length > 0 ? `MERK: Følgende røde flagg ble oppdaget automatisk: ${redFlagsDetected.map((f) => f.flag).join(', ')}` : ''}

Analyser røde flagg og gi anbefaling:`;

  try {
    const result = await generateCompletion(prompt, systemPrompt, {
      maxTokens: 400,
      temperature: 0.4,
      taskType: 'red_flag_analysis',
    });
    const analysisText = extractCompletionText(result);

    // Combine AI analysis with rule-based detection
    let riskLevel = validationResult.riskLevel;

    // AI can upgrade but not downgrade risk level
    const lowercaseAnalysis = analysisText.toLowerCase();
    if (
      lowercaseAnalysis.includes('akutt henvisning') ||
      lowercaseAnalysis.includes('øyeblikkelig') ||
      lowercaseAnalysis.includes('cauda equina')
    ) {
      riskLevel = 'CRITICAL';
    } else if (
      riskLevel !== 'CRITICAL' &&
      (lowercaseAnalysis.includes('henvise') ||
        lowercaseAnalysis.includes('lege') ||
        lowercaseAnalysis.includes('utredning'))
    ) {
      riskLevel = 'HIGH';
    }

    return {
      analysis: analysisText.trim(),
      riskLevel,
      canTreat: riskLevel === 'LOW' || riskLevel === 'MODERATE',
      recommendReferral: riskLevel === 'HIGH' || riskLevel === 'CRITICAL',
      detectedFlags: redFlagsDetected,
      medicationWarnings,
      confidence: result?.confidence || validationResult.confidence,
      source: 'combined',
      aiAvailable: true,
    };
  } catch (error) {
    logger.error('Red flag analysis error:', error);

    // Fall back to rule-based results if AI fails
    return {
      analysis:
        redFlagsDetected.length > 0
          ? `Automatisk oppdagede røde flagg: ${redFlagsDetected.map((f) => f.message).join('; ')}`
          : 'AI-analyse utilgjengelig. Vennligst gjennomgå manuelt.',
      riskLevel: validationResult.riskLevel,
      canTreat: !validationResult.hasRedFlags,
      recommendReferral: validationResult.requiresReview,
      detectedFlags: redFlagsDetected,
      medicationWarnings,
      confidence: validationResult.confidence,
      source: 'clinical_validation_only',
      aiAvailable: false,
      error: error.message,
    };
  }
};

/**
 * Generate clinical summary from encounter
 */
export const generateClinicalSummary = async (encounter) => {
  // Return fallback if AI is disabled
  if (!isAIAvailable()) {
    return { summary: '', encounterId: encounter.id, aiAvailable: false };
  }

  const systemPrompt = `Du er en kiropraktor-assistent. Generer et kort, profesjonelt klinisk sammendrag på norsk.
Sammendraget skal være kortfattet og egnet for journalføring eller henvisningsbrev.`;

  const prompt = `Generer sammendrag av følgende konsultasjon:

SUBJEKTIVT:
Hovedplage: ${encounter.subjective?.chief_complaint || ''}
Sykehistorie: ${encounter.subjective?.history || ''}

OBJEKTIVT:
Observasjon: ${encounter.objective?.observation || ''}
Palpasjon: ${encounter.objective?.palpasjon || ''}
ROM: ${encounter.objective?.rom || ''}

VURDERING:
${encounter.assessment?.clinical_reasoning || ''}
Diagnosekoder: ${encounter.icpc_codes?.join(', ') || ''}

PLAN:
Behandling: ${encounter.plan?.treatment || ''}
Oppfølging: ${encounter.plan?.follow_up || ''}

Generer kort sammendrag (2-3 setninger):`;

  try {
    const result = await generateCompletion(prompt, systemPrompt, {
      maxTokens: 200,
      temperature: 0.6,
      taskType: 'clinical_summary',
    });
    const summaryText = extractCompletionText(result);

    return {
      summary: summaryText.trim(),
      encounterId: encounter.id,
      confidence: result?.confidence || null,
      aiAvailable: true,
    };
  } catch (error) {
    logger.error('Clinical summary error:', error);
    return { summary: '', encounterId: encounter.id, aiAvailable: false, error: error.message };
  }
};

/**
 * Learn from clinical outcomes (feedback loop)
 */
export const learnFromOutcome = async (encounterId, outcomeData) => {
  // Store learning data for future model fine-tuning
  try {
    await query(
      `INSERT INTO ai_learning_data (encounter_id, outcome_data, created_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (encounter_id) DO UPDATE SET outcome_data = $2, updated_at = NOW()`,
      [encounterId, JSON.stringify(outcomeData)]
    );

    logger.info(`Stored learning data for encounter: ${encounterId}`);
    return { success: true };
  } catch (error) {
    logger.error('Learning data storage error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Organize and structure old journal notes using AI with actionable items extraction
 * Converts unstructured text into structured clinical data + SOAP format + tasks
 */
export const organizeOldJournalNotes = async (noteContent, patientContext = {}) => {
  // Return fallback if AI is disabled
  if (!isAIAvailable()) {
    return {
      success: false,
      organizedData: null,
      aiAvailable: false,
      error: 'AI is disabled',
    };
  }

  const systemPrompt = `Du er en erfaren kiropraktor-assistent som er ekspert på å organisere og strukturere gamle journalnotater.

Din oppgave er å analysere ustrukturerte journalnotater og strukturere dem i et klinisk format MED utdrag av HANDLINGSOPPGAVER.

STEG 1: Analyser og ekstraher informasjon
- Identifiser datoer (konsultasjonsdato, symptomstart, etc.)
- Ekstraher symptomer, plager og sykehistorie
- Finn objektive funn, undersøkelser og tester
- Identifiser diagnoser (ICPC-2/ICD-10 koder hvis nevnt)
- Ekstraher behandling og tiltak
- Finn oppfølging og plan

STEG 2: Ekstraher HANDLINGSOPPGAVER (VIKTIG!)
Identifiser alle oppgaver som må følges opp:
- Oppfølgingsavtaler som skal bookes
- Telefonsamtaler som må gjøres
- Brev/epikrise som skal sendes
- Resepter som skal fornyes
- Henvisninger som trengs
- Prøvesvar som må følges opp
- Påminnelser til pasient

For hver oppgave, identifiser:
- Type (FOLLOW_UP, CALL_PATIENT, SEND_NOTE, PRESCRIPTION, REFERRAL, TEST_RESULT, REMINDER)
- Tittel og beskrivelse
- Tidsfrist hvis nevnt
- Prioritet (LOW, MEDIUM, HIGH, URGENT)
- Original tekst fra notatet

STEG 3: Ekstraher KOMMUNIKASJONSHISTORIKK
Finn tidligere kommunikasjon nevnt i notatet:
- Telefonsamtaler (dato, innhold)
- SMS/e-poster sendt/mottatt
- Brev/epikriser sendt
- Personlig kontakt

STEG 4: Organiser i SOAP-format
[samme som før]

STEG 5: Identifiser MANGLENDE INFORMASJON
Hva mangler for fullstendig klinisk dokumentasjon?

Svar i JSON-format:
{
  "structured_data": {
    "dates": ["YYYY-MM-DD"],
    "chief_complaints": ["..."],
    "symptoms": ["..."],
    "findings": ["..."],
    "diagnoses": ["..."],
    "treatments": ["..."],
    "follow_up": "..."
  },
  "soap": {
    "subjective": {
      "chief_complaint": "...",
      "history": "...",
      "aggravating_factors": "...",
      "relieving_factors": "..."
    },
    "objective": {
      "observation": "...",
      "palpation": "...",
      "rom": "...",
      "ortho_tests": "...",
      "measurements": {}
    },
    "assessment": {
      "clinical_reasoning": "...",
      "differential_diagnoses": ["..."],
      "prognosis": "..."
    },
    "plan": {
      "treatment": "...",
      "home_exercises": "...",
      "advice": "...",
      "follow_up": "..."
    }
  },
  "actionable_items": [
    {
      "type": "FOLLOW_UP",
      "title": "Book oppfølging om 2 uker",
      "description": "Pasient skal komme tilbake for kontroll",
      "due_date": "YYYY-MM-DD",
      "priority": "MEDIUM",
      "original_text": "Kommer tilbake om 2 uker for kontroll"
    },
    {
      "type": "CALL_PATIENT",
      "title": "Ring pasient for sjekk",
      "description": "Følge opp hvordan det går etter behandling",
      "due_date": "YYYY-MM-DD",
      "priority": "LOW",
      "original_text": "Skal ringes om 1 uke"
    }
  ],
  "communication_history": [
    {
      "type": "PHONE_CALL",
      "date": "YYYY-MM-DD",
      "direction": "OUTGOING",
      "subject": "Oppfølging",
      "content": "Ringte pasient ang. viderehenvising",
      "original_text": "Ringte pasient 12.01"
    }
  ],
  "missing_information": [
    {
      "field": "diagnosis_code",
      "importance": "HIGH",
      "can_be_inferred": true
    }
  ],
  "tags": ["urgent", "referral_needed", "requires_callback"],
  "suggested_encounter_type": "FOLLOWUP",
  "suggested_date": "YYYY-MM-DD",
  "confidence_score": 0.85,
  "notes": "Eventuelle merknader om noteringen"
}`;

  const prompt = `Pasientkontekst:
Navn: ${patientContext.first_name || ''} ${patientContext.last_name || ''}
Alder: ${patientContext.age || 'ukjent'}
${patientContext.medical_history ? `Sykehistorie: ${patientContext.medical_history}` : ''}

Gammel journalnotat som skal struktureres:
---
${noteContent}
---

Analyser og strukturer dette notatet i henhold til instruksjonene.
VIKTIG: Identifiser ALLE handlingsoppgaver som må følges opp!
Svar kun med JSON.`;

  try {
    const completionResult = await generateCompletion(prompt, systemPrompt, {
      maxTokens: 2000,
      temperature: 0.4, // Lower temperature for more consistent structured output
      taskType: 'journal_organization',
    });
    const response = extractCompletionText(completionResult);

    // Parse JSON response
    let organizedData;
    try {
      // Try to extract JSON from response (sometimes wrapped in markdown code blocks)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        organizedData = JSON.parse(jsonMatch[0]);
      } else {
        organizedData = JSON.parse(response);
      }
    } catch (parseError) {
      logger.error('JSON parse error in organizeOldJournalNotes:', parseError);
      // Return fallback structure with raw text
      organizedData = {
        structured_data: {
          raw_content: noteContent,
          parsing_error: true,
        },
        soap: {
          subjective: { chief_complaint: noteContent.substring(0, 500) },
          objective: {},
          assessment: {},
          plan: {},
        },
        actionable_items: [],
        communication_history: [],
        missing_information: [],
        tags: [],
        confidence_score: 0.3,
        notes:
          'Kunne ikke fullstendig strukturere notatet automatisk. Manuell gjennomgang anbefales.',
      };
    }

    return {
      success: true,
      organizedData,
      rawResponse: response,
      model: AI_MODEL,
      provider: 'ollama',
      aiAvailable: true,
    };
  } catch (error) {
    logger.error('Organize old journal notes error:', error);
    return {
      success: false,
      error: error.message,
      organizedData: null,
      aiAvailable: false,
    };
  }
};

/**
 * Batch organize multiple old journal notes
 * Useful for importing multiple notes at once
 */
export const organizeMultipleNotes = async (notes, patientContext = {}) => {
  // Return fallback if AI is disabled
  if (!isAIAvailable()) {
    return {
      totalNotes: notes.length,
      successfullyProcessed: 0,
      results: notes.map((note) => ({
        noteId: note.id || null,
        filename: note.filename || null,
        success: false,
        error: 'AI is disabled',
      })),
      aiAvailable: false,
    };
  }

  const results = [];

  for (const note of notes) {
    try {
      const result = await organizeOldJournalNotes(note.content, patientContext);
      results.push({
        noteId: note.id || null,
        filename: note.filename || null,
        ...result,
      });

      // Add small delay to avoid overwhelming the AI service
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      results.push({
        noteId: note.id || null,
        filename: note.filename || null,
        success: false,
        error: error.message,
      });
    }
  }

  return {
    totalNotes: notes.length,
    successfullyProcessed: results.filter((r) => r.success).length,
    results,
  };
};

/**
 * Refine and merge multiple organized notes into a single comprehensive entry
 * Useful when a patient has multiple old notes that should be consolidated
 */
export const mergeOrganizedNotes = async (organizedNotes, patientContext = {}) => {
  // Return fallback if AI is disabled
  if (!isAIAvailable()) {
    return {
      success: false,
      mergedNote: '',
      sourceNotesCount: organizedNotes.length,
      aiAvailable: false,
      error: 'AI is disabled',
    };
  }

  const systemPrompt = `Du er en erfaren kiropraktor-assistent. Din oppgave er å samle og konsolidere flere journalnotater til én omfattende, kronologisk journalpost.

Prinsipper:
- Behold all viktig klinisk informasjon
- Organiser kronologisk (eldst først)
- Identifiser utviklingstrender (bedring/forverring)
- Fjern duplikater
- Lag et samlet klinisk bilde

Svar i SOAP-format på norsk, med tydelig tidslinje.`;

  const notesText = organizedNotes
    .map(
      (note, index) =>
        `=== Notat ${index + 1} (${note.suggested_date || 'ukjent dato'}) ===\n${JSON.stringify(note.soap, null, 2)}`
    )
    .join('\n\n');

  const prompt = `Pasientkontekst:
Navn: ${patientContext.first_name || ''} ${patientContext.last_name || ''}

Følgende notater skal konsolideres:
${notesText}

Lag ett samlet, kronologisk SOAP-notat som fanger hele pasienthistorikken.`;

  try {
    const mergeResult = await generateCompletion(prompt, systemPrompt, {
      maxTokens: 2000,
      temperature: 0.5,
      taskType: 'clinical_summary',
    });
    const mergedText = extractCompletionText(mergeResult);

    return {
      success: true,
      mergedNote: mergedText.trim(),
      sourceNotesCount: organizedNotes.length,
      dateRange: {
        earliest: organizedNotes.reduce(
          (min, n) =>
            !min || (n.suggested_date && n.suggested_date < min) ? n.suggested_date : min,
          null
        ),
        latest: organizedNotes.reduce(
          (max, n) =>
            !max || (n.suggested_date && n.suggested_date > max) ? n.suggested_date : max,
          null
        ),
      },
      aiAvailable: true,
    };
  } catch (error) {
    logger.error('Merge organized notes error:', error);
    return {
      success: false,
      error: error.message,
      aiAvailable: false,
    };
  }
};

/**
 * Get AI service status with detailed model information
 */
export const getAIStatus = async () => {
  // If AI is disabled via env, return disabled status immediately
  if (!AI_ENABLED) {
    return {
      provider: 'ollama',
      available: false,
      enabled: false,
      model: AI_MODEL,
      message: 'AI is disabled via AI_ENABLED=false',
    };
  }

  const expectedModels = [
    'chiro-no',
    'chiro-fast',
    'chiro-norwegian',
    'chiro-medical',
    'chiro-fast-lora',
    'chiro-medical-lora',
    'chiro-norwegian-lora',
    'chiro-no-lora',
  ];

  // Get guardrails and RAG status
  const guardrailsStatus = guardrailsService
    ? { enabled: GUARDRAILS_ENABLED, stats: guardrailsService.getStats() }
    : { enabled: false, reason: 'Service not loaded' };

  let ragStatus = { enabled: false, reason: 'Service not loaded' };
  if (ragService) {
    try {
      const ragHealth = await ragService.healthCheck();
      ragStatus = { enabled: RAG_ENABLED, ...ragHealth };
    } catch (e) {
      ragStatus = { enabled: RAG_ENABLED, available: false, error: e.message };
    }
  }

  try {
    const response = await axios.get(`${OLLAMA_BASE_URL}/api/tags`, { timeout: 5000 });
    const installedModels = response.data.models?.map((m) => m.name) || [];
    const modelStatus = {};
    for (const name of expectedModels) {
      const installed = installedModels.some((m) => m.startsWith(name));
      modelStatus[name] = {
        installed,
        config: MODEL_CONFIG[name] || null,
      };
    }
    return {
      provider: 'ollama',
      available: true,
      enabled: true,
      defaultModel: AI_MODEL,
      routing: MODEL_ROUTING,
      abTesting: AB_SPLIT_CONFIG,
      models: installedModels,
      modelStatus,
      modelConfigs: MODEL_CONFIG,
      guardrails: guardrailsStatus,
      rag: ragStatus,
    };
  } catch (error) {
    return {
      provider: 'ollama',
      available: false,
      enabled: true,
      error: error.message,
      guardrails: guardrailsStatus,
      rag: ragStatus,
    };
  }
};

export {
  getModelForTask,
  isModelAvailable,
  refreshAvailableModels,
  MODEL_ROUTING,
  MODEL_CONFIG,
  AB_SPLIT_CONFIG,
  extractCompletionText,
  calculateConfidence,
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
  return AI_MODEL || 'chiro-no';
};

/**
 * Build a prompt for field-specific AI generation
 */
export const buildFieldPrompt = (fieldType, context = {}, _language = 'no') => {
  const basePrompt = context.chiefComplaint
    ? `Basert på hovedklage: ${context.chiefComplaint}\n`
    : '';
  return `${basePrompt}Generer ${fieldType} for klinisk dokumentasjon.`;
};

/**
 * Generate AI completion as a stream (SSE)
 * Delegates to the active AI provider (Ollama, Claude, or fallback)
 */
export const generateCompletionStream = async (model, prompt, res) => {
  const provider = getAIProvider();
  await provider.generateStream(model, prompt, res);
};

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
