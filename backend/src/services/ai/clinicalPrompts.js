/**
 * Clinical Prompts
 * SOAP generation, spell check, diagnosis, red flags, clinical summaries
 */

import logger from '../../utils/logger.js';
import { query } from '../../config/database.js';
import {
  validateClinicalContent,
  checkRedFlagsInContent,
  checkMedicationWarnings,
} from '../clinical/clinicalValidation.js';
import { isAIAvailable, extractCompletionText, generateCompletion } from './promptShared.js';
import {
  SPELL_CHECK_PROMPT,
  SOAP_PROMPTS,
  buildDiagnosisPrompt,
  RED_FLAG_PROMPT,
  CLINICAL_SUMMARY_PROMPT,
} from './systemPrompts.js';

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
      `SELECT code, description_no, description_en, chapter FROM diagnosis_codes
       WHERE system = 'ICPC2' AND chapter IN ('L', 'N') AND commonly_used = true
       ORDER BY usage_count DESC LIMIT 20`
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

  const validationResult = await validateClinicalContent(clinicalContent, { patient: patientData });

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
