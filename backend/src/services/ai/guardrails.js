/**
 * Guardrails Module
 * Input validation, output sanitization, hallucination detection, safety checks
 */

import logger from '../../utils/logger.js';

// Import guardrails for input validation and output filtering
let guardrailsService = null;
let guardrailsAvailable = false;
let guardrailsLoadError = null;
try {
  const guardrails = await import('../clinical/guardrails.js');
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

const GUARDRAILS_ENABLED = process.env.GUARDRAILS_ENABLED !== 'false';

// Fallback guardrails: basic safety defaults when guardrails module fails to load
const FALLBACK_GUARDRAILS = {
  blockedPatterns: [
    /\b(ignore previous|disregard instructions|pretend you are)\b/i,
    /\b(system prompt|jailbreak|bypass safety)\b/i,
  ],
  maxInputLength: 10000,
  maxOutputLength: 5000,
};

export const applyFallbackInputValidation = (prompt) => {
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
export const checkGuardrailsForTask = (taskType, skipGuardrails = false) => {
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
        canProceed: process.env.NODE_ENV !== 'production',
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

export { guardrailsService, guardrailsAvailable, GUARDRAILS_ENABLED };
