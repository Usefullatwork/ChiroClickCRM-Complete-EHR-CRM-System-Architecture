/**
 * Prompt Builder — Shared Infrastructure
 * Core AI completion, logging, status, and streaming
 */

import logger from '../../utils/logger.js';
import { query } from '../../config/database.js';
import { getAIProvider } from '../providers/aiProviderFactory.js';
import circuitBreakerRegistry from '../../infrastructure/resilience/CircuitBreakerRegistry.js';

import {
  AI_MODEL,
  AI_ENABLED,
  OLLAMA_BASE_URL,
  MODEL_CONFIG,
  MODEL_ROUTING,
  AB_SPLIT_CONFIG,
  getModelForTask,
  isAIAvailable,
  calculateConfidence,
  extractCompletionText,
} from './modelRouter.js';

import {
  guardrailsService,
  guardrailsAvailable,
  GUARDRAILS_ENABLED,
  checkGuardrailsForTask,
  applyFallbackInputValidation,
} from './guardrails.js';

import { augmentWithRAG, ragService, RAG_ENABLED } from './ragRetrieval.js';
import { recordLearning } from './sessionMemory.js';
import { SMS_CONSTRAINT } from './systemPrompts.js';

import axios from 'axios';

// Re-export things other sub-modules need
export { isAIAvailable, extractCompletionText, AI_MODEL };

// Get the pre-registered Ollama circuit breaker and set requestTimeout
const ollamaBreaker = circuitBreakerRegistry.getBreaker('ollama');
ollamaBreaker.requestTimeout = 35000;

/**
 * Log an AI suggestion to the database for analytics tracking.
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
 */
export const generateCompletion = async (prompt, systemPrompt = null, options = {}) => {
  const {
    maxTokens = 500,
    temperature = null,
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
  const modelConfig = MODEL_CONFIG[model] || MODEL_CONFIG['chiro-no-sft-dpo-v5'];
  const effectiveTemperature = temperature ?? modelConfig.temperature ?? 0.3;

  // Step 0: Check guardrails
  const guardrailsCheck = checkGuardrailsForTask(taskType, skipGuardrails);
  if (!guardrailsCheck.canProceed) {
    logger.error('BLOCKED: Safety-critical task without guardrails', {
      taskType,
      reason: guardrailsCheck.reason,
    });
    throw new Error(
      `Safety-critical task "${taskType}" blocked: ${guardrailsCheck.reason}. Contact administrator to enable guardrails service.`
    );
  }

  // Step 1: Validate input
  let sanitizedPrompt = prompt;
  let inputWarnings = [];
  let _guardrailsValidationFailed = false;

  if (GUARDRAILS_ENABLED && !skipGuardrails && !guardrailsService && !guardrailsAvailable) {
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
      if (guardrailsCheck.required) {
        logger.error('BLOCKED: Guardrails validation failed for safety-critical task', {
          taskType,
          error: guardrailError.message,
        });
        throw new Error(
          `Safety validation failed for "${taskType}": ${guardrailError.message}. Cannot proceed without successful validation.`
        );
      }
      logger.warn('Guardrails validation error, proceeding with caution:', guardrailError.message);
    }
  }

  // Step 2: RAG augmentation
  const { augmentedPrompt, ragContext } = useRAG
    ? await augmentWithRAG(sanitizedPrompt, clinicalContext, {
        organizationId,
        patientId,
        taskType,
      })
    : { augmentedPrompt: sanitizedPrompt, ragContext: null };

  let effectiveSystemPrompt = systemPrompt;
  if (taskType === 'patient_communication') {
    effectiveSystemPrompt = effectiveSystemPrompt
      ? `${effectiveSystemPrompt}\n\n${SMS_CONSTRAINT}`
      : SMS_CONSTRAINT;
  }

  // Step 3: Generate completion
  const provider = getAIProvider();
  const providerResult = await provider.generate(augmentedPrompt, effectiveSystemPrompt, {
    maxTokens,
    temperature: effectiveTemperature,
    model,
    taskType,
    organizationId,
  });

  const rawOutput = providerResult.text;
  const confidence = calculateConfidence(rawOutput, taskType, model);

  // Log suggestion (non-blocking)
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

    recordLearning(organizationId, patientId, taskType, rawOutput, { confidence });
  }

  // Step 4: Output guardrails
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
      if (guardrailsCheck.required) {
        logger.error('BLOCKED: Output guardrails failed for safety-critical task', {
          taskType,
          error: guardrailError.message,
        });
        throw new Error(
          `Safety output filtering failed for "${taskType}": ${guardrailError.message}. Cannot return unvalidated output for safety-critical tasks.`
        );
      }
      logger.warn('Output guardrails error, returning raw:', guardrailError.message);
    }
  }

  if (guardrailsCheck.required && !guardrailsCheck.available) {
    const disclaimer =
      '\n\n\u26A0\uFE0F ADVARSEL: Dette resultatet er ikke validert av sikkerhetssystemet. Klinisk gjennomgang er PÅKREVD før bruk.';
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

  return { text: rawOutput, confidence };
};

/**
 * Get AI service status with detailed model information
 */
export const getAIStatus = async () => {
  if (!AI_ENABLED) {
    return {
      provider: 'ollama',
      available: false,
      enabled: false,
      model: AI_MODEL,
      message: 'AI is disabled via AI_ENABLED=false',
    };
  }

  const expectedModels = ['chiro-no-sft-dpo-v5', 'chiro-no-lora-v5', 'chiro-fast', 'chiro-medical'];

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
      modelStatus[name] = { installed, config: MODEL_CONFIG[name] || null };
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
 */
export const generateCompletionStream = async (model, prompt, res) => {
  const provider = getAIProvider();
  await provider.generateStream(model, prompt, res);
};
