/**
 * Clinical Agent Service
 * Orchestrates multi-model clinical reasoning pipeline
 * Chains specialized models for comprehensive clinical analysis
 *
 * Pipeline: chiro-medical (safety) → chiro-no (clinical) → chiro-norwegian (language)
 * Designed for 16GB RAM: one model at a time via keep_alive
 */

import { generateCompletion, extractCompletionText, analyzeRedFlags, getModelForTask } from './ai.js';
import logger from '../utils/logger.js';

/**
 * Run full clinical assessment pipeline
 * Step 1: Red flag screening (chiro-medical)
 * Step 2: Clinical documentation (chiro-no)
 * Step 3: Language polish (chiro-norwegian) if needed
 */
export const runClinicalPipeline = async (patientData, soapData, options = {}) => {
  const { language = 'no', includeLanguagePolish = true } = options;
  const startTime = Date.now();
  const results = { steps: [], totalTime: 0 };

  // Step 1: Safety screening
  try {
    const safetyResult = await analyzeRedFlags(patientData, soapData);
    results.safety = safetyResult;
    results.steps.push({ step: 'safety', model: 'chiro-medical', success: true });

    // If critical, stop pipeline
    if (safetyResult.riskLevel === 'CRITICAL') {
      results.halted = true;
      results.haltReason = 'Critical red flags detected';
      results.totalTime = Date.now() - startTime;
      return results;
    }
  } catch (error) {
    logger.error('Clinical pipeline safety step failed:', error.message);
    results.steps.push({ step: 'safety', model: 'chiro-medical', success: false, error: error.message });
  }

  // Step 2: Generate clinical documentation suggestions
  try {
    const clinicalPrompt = buildClinicalPrompt(patientData, soapData);
    const clinicalResult = await generateCompletion(clinicalPrompt, null, {
      taskType: 'clinical_summary',
      maxTokens: 800,
    });
    results.clinical = extractCompletionText(clinicalResult);
    results.steps.push({ step: 'clinical', model: getModelForTask('clinical_summary'), success: true });
  } catch (error) {
    logger.error('Clinical pipeline documentation step failed:', error.message);
    results.steps.push({ step: 'clinical', model: 'chiro-no', success: false, error: error.message });
  }

  // Step 3: Language polish (optional, for Norwegian output)
  if (includeLanguagePolish && language === 'no' && results.clinical) {
    try {
      const polishResult = await generateCompletion(
        `Forbedre følgende kliniske tekst til korrekt norsk medisinsk fagspråk. Behold alle kliniske fakta uendret:\n\n${results.clinical}`,
        'Du er en norsk medisinsk språkspesialist. Rett grammatikk, stavefeil og terminologi. Behold innholdet uendret.',
        {
          taskType: 'norwegian_text',
          maxTokens: 800,
        }
      );
      results.polished = extractCompletionText(polishResult);
      results.steps.push({ step: 'language', model: getModelForTask('norwegian_text'), success: true });
    } catch (error) {
      logger.warn('Language polish step failed, using unpolished:', error.message);
      results.polished = results.clinical;
      results.steps.push({ step: 'language', model: 'chiro-norwegian', success: false, error: error.message });
    }
  }

  results.totalTime = Date.now() - startTime;
  return results;
};

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

/**
 * Build clinical prompt from patient data and SOAP notes
 */
const buildClinicalPrompt = (patientData, soapData) => {
  const parts = ['Generer klinisk sammendrag basert på:'];

  if (patientData.age) parts.push(`Pasient: ${patientData.age} år`);
  if (soapData.subjective?.chief_complaint) parts.push(`Hovedplage: ${soapData.subjective.chief_complaint}`);
  if (soapData.subjective?.history) parts.push(`Anamnese: ${soapData.subjective.history}`);
  if (soapData.objective?.observation) parts.push(`Observasjon: ${soapData.objective.observation}`);
  if (soapData.objective?.palpation) parts.push(`Palpasjon: ${soapData.objective.palpation}`);
  if (soapData.objective?.rom) parts.push(`ROM: ${soapData.objective.rom}`);
  if (soapData.objective?.ortho_tests) parts.push(`Tester: ${soapData.objective.ortho_tests}`);
  if (soapData.assessment?.clinical_reasoning) parts.push(`Vurdering: ${soapData.assessment.clinical_reasoning}`);

  parts.push('\nGi kort klinisk sammendrag med vurdering og anbefalt plan.');
  return parts.join('\n');
};

export default {
  runClinicalPipeline,
  quickSuggestion,
};
