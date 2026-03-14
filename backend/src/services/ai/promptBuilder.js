/**
 * Prompt Builder
 * High-level AI functions: SOAP generation, spell check, diagnosis, red flags,
 * clinical summaries, journal organization, and status reporting
 */

import logger from '../../utils/logger.js';
import { query } from '../../config/database.js';
import {
  validateClinicalContent,
  checkRedFlagsInContent,
  checkMedicationWarnings,
} from '../clinicalValidation.js';
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
import {
  SPELL_CHECK_PROMPT,
  SOAP_PROMPTS,
  buildDiagnosisPrompt,
  RED_FLAG_PROMPT,
  CLINICAL_SUMMARY_PROMPT,
  JOURNAL_ORGANIZATION_PROMPT,
  MERGE_NOTES_PROMPT,
  SMS_CONSTRAINT,
} from './systemPrompts.js';

import axios from 'axios';

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
          `Safety validation failed for "${taskType}": ${guardrailError.message}. ` +
            'Cannot proceed without successful validation.'
        );
      }
      logger.warn('Guardrails validation error, proceeding with caution:', guardrailError.message);
    }
  }

  // Step 2: Augment with RAG context if enabled
  const { augmentedPrompt, ragContext } = useRAG
    ? await augmentWithRAG(sanitizedPrompt, clinicalContext, {
        organizationId,
        patientId,
        taskType,
      })
    : { augmentedPrompt: sanitizedPrompt, ragContext: null };

  // Step 2b: Add length constraints for communication/SMS tasks
  let effectiveSystemPrompt = systemPrompt;
  if (taskType === 'patient_communication') {
    effectiveSystemPrompt = effectiveSystemPrompt
      ? `${effectiveSystemPrompt}\n\n${SMS_CONSTRAINT}`
      : SMS_CONSTRAINT;
  }

  // Step 3: Generate completion via AI provider
  const provider = getAIProvider();
  const providerResult = await provider.generate(augmentedPrompt, effectiveSystemPrompt, {
    maxTokens,
    temperature: effectiveTemperature,
    model,
    taskType,
    organizationId,
  });

  const rawOutput = providerResult.text;

  // Calculate confidence score for this response
  const confidence = calculateConfidence(rawOutput, taskType, model);

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

    // Record session learning (non-blocking)
    recordLearning(organizationId, patientId, taskType, rawOutput, { confidence });
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
      '\n\n\u26A0\uFE0F ADVARSEL: Dette resultatet er ikke validert av sikkerhetssystemet. ' +
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

  return { text: rawOutput, confidence };
};

/**
 * Spell check and grammar correction for Norwegian clinical notes
 */
export const spellCheckNorwegian = async (text) => {
  if (!isAIAvailable()) {
    return { original: text, corrected: text, hasChanges: false, aiAvailable: false };
  }

  const prompt = `Korriger følgende tekst:\n\n${text}`;

  try {
    const result = await generateCompletion(prompt, SPELL_CHECK_PROMPT, {
      maxTokens: 1000,
      temperature: 0.3,
      taskType: 'spell_check',
      skipGuardrails: true,
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
  if (!isAIAvailable()) {
    return { section, chiefComplaint, suggestion: '', aiAvailable: false };
  }

  const systemPrompt = SOAP_PROMPTS[section];
  if (!systemPrompt) {
    return {
      section,
      chiefComplaint,
      suggestion: '',
      error: 'Invalid section',
      aiAvailable: false,
    };
  }

  const sectionLabels = {
    subjective: 'subjektive funn',
    objective: 'objektive funn',
    assessment: 'vurdering',
    plan: 'plan',
  };
  const prompt = `Hovedplage: ${chiefComplaint}\n\nGenerer ${sectionLabels[section]}:`;

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
  if (!isAIAvailable()) {
    return { suggestion: '', codes: [], reasoning: '', aiAvailable: false };
  }

  const { subjective, objective, assessment } = soapData;

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
  const systemPrompt = buildDiagnosisPrompt(codesText);

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
  const clinicalContent = [
    soapData.subjective?.chief_complaint || '',
    soapData.subjective?.history || '',
    soapData.objective?.observation || '',
    soapData.objective?.ortho_tests || '',
    soapData.assessment?.clinical_reasoning || '',
  ].join(' ');

  let redFlagsDetected = [];
  let medicationWarnings = [];
  try {
    redFlagsDetected = checkRedFlagsInContent(clinicalContent);
    medicationWarnings = checkMedicationWarnings(patientData.current_medications || []);
  } catch (error) {
    logger.error('Rule-based red flag check error:', error);
  }

  const validationResult = await validateClinicalContent(clinicalContent, {
    patient: patientData,
  });

  if (validationResult.riskLevel === 'CRITICAL') {
    logger.warn('CRITICAL red flags detected by clinical validation', {
      flags: redFlagsDetected.map((f) => f.flag),
      patient: patientData.id,
    });

    return {
      analysis: `KRITISKE RODE FLAGG OPPDAGET. ${redFlagsDetected
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
    const result = await generateCompletion(prompt, RED_FLAG_PROMPT, {
      maxTokens: 400,
      temperature: 0.4,
      taskType: 'red_flag_analysis',
    });
    const analysisText = extractCompletionText(result);

    let riskLevel = validationResult.riskLevel;

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
  if (!isAIAvailable()) {
    return { summary: '', encounterId: encounter.id, aiAvailable: false };
  }

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
    const result = await generateCompletion(prompt, CLINICAL_SUMMARY_PROMPT, {
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
 */
export const organizeOldJournalNotes = async (noteContent, patientContext = {}) => {
  if (!isAIAvailable()) {
    return {
      success: false,
      organizedData: null,
      aiAvailable: false,
      error: 'AI is disabled',
    };
  }

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
    const completionResult = await generateCompletion(prompt, JOURNAL_ORGANIZATION_PROMPT, {
      maxTokens: 2000,
      temperature: 0.4,
      taskType: 'journal_organization',
    });
    const response = extractCompletionText(completionResult);

    let organizedData;
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        organizedData = JSON.parse(jsonMatch[0]);
      } else {
        organizedData = JSON.parse(response);
      }
    } catch (parseError) {
      logger.error('JSON parse error in organizeOldJournalNotes:', parseError);
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
 */
export const organizeMultipleNotes = async (notes, patientContext = {}) => {
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
 */
export const mergeOrganizedNotes = async (organizedNotes, patientContext = {}) => {
  if (!isAIAvailable()) {
    return {
      success: false,
      mergedNote: '',
      sourceNotesCount: organizedNotes.length,
      aiAvailable: false,
      error: 'AI is disabled',
    };
  }

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
    const mergeResult = await generateCompletion(prompt, MERGE_NOTES_PROMPT, {
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

export { generateCompletion };
