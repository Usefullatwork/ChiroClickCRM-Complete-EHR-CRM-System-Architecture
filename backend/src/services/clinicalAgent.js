/**
 * Clinical Agent Service
 * Delegates to clinicalOrchestrator for multi-provider clinical analysis.
 * Preserves backward-compatible result shape for internal callers.
 *
 * Pipeline (via orchestrator):
 *   1. Safety screening → can halt
 *   2. Parallel assessments (clinical + differential)
 *   3. Synthesis (when Claude available)
 */

import { generateCompletion, extractCompletionText } from './ai.js';
import { orchestrate } from './clinicalOrchestrator.js';
import logger from '../utils/logger.js';

/**
 * Run full clinical assessment pipeline via orchestrator.
 * Maps the orchestrator's rich result to the legacy shape:
 *   { steps[], totalTime, safety, clinical, polished, halted, haltReason }
 */
export async function runClinicalPipeline(patientData, soapData, options = {}) {
  const startTime = Date.now();
  const { language = 'no' } = options;

  try {
    const orchResult = await orchestrate(patientData, soapData, {
      language,
      includeDifferential: true,
      includeLetterDraft: false,
    });

    return {
      steps: orchResult.steps.map((s) => ({
        step: s.step,
        model: s.provider || 'unknown',
        success: s.status === 'completed',
        ...(s.error && { error: s.error }),
      })),
      totalTime: orchResult.totalTime,
      safety: orchResult.safety,
      clinical: orchResult.clinical || '',
      polished: orchResult.synthesis || orchResult.clinical || '',
      halted: orchResult.halted,
      haltReason: orchResult.haltReason || '',
    };
  } catch (error) {
    logger.error('Clinical pipeline failed:', error);
    return {
      steps: [{ step: 'pipeline', model: 'none', success: false, error: error.message }],
      totalTime: Date.now() - startTime,
      safety: { riskLevel: 'UNKNOWN', canTreat: false, flags: [] },
      clinical: '',
      polished: '',
      halted: true,
      haltReason: `Pipeline error: ${error.message}`,
    };
  }
}

/**
 * Quick clinical suggestion (single model, no pipeline)
 * For real-time autocomplete and inline suggestions
 */
export const quickSuggestion = async (partialText, fieldType = 'autocomplete') => {
  try {
    const result = await generateCompletion(
      `Fullfør: ${partialText}`,
      'Fullfør den kliniske teksten. Vær kort og presis. Svar kun med fullføringen.',
      {
        taskType: fieldType,
        maxTokens: 150,
        skipGuardrails: true,
      }
    );
    return { suggestion: extractCompletionText(result), success: true };
  } catch (error) {
    return { suggestion: '', success: false, error: error.message };
  }
};

export default {
  runClinicalPipeline,
  quickSuggestion,
};
