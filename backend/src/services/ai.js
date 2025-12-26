/**
 * AI Service
 * Intelligent clinical assistance using Ollama (local) or Claude API
 * Features: SOAP note suggestions, spell checking, clinical reasoning, diagnosis suggestions
 *
 * Default model: Gemini 3 Pro Preview 7B (gemini-3-pro-preview:7b)
 * Requires: Minimum 8GB RAM, recommended 16GB for optimal performance
 */

import axios from 'axios';
import logger from '../utils/logger.js';
import { query } from '../config/database.js';
import { validateClinicalContent, checkRedFlagsInContent, checkMedicationWarnings } from './clinicalValidation.js';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || null;
const AI_PROVIDER = process.env.AI_PROVIDER || 'ollama'; // 'ollama' or 'claude'
const AI_MODEL = process.env.AI_MODEL || 'gemini-3-pro-preview:7b'; // Default: Gemini 3 Pro Preview 7B (8GB+ RAM)

/**
 * Generate AI completion using selected provider
 */
const generateCompletion = async (prompt, systemPrompt = null, options = {}) => {
  const { maxTokens = 500, temperature = 0.7 } = options;

  try {
    if (AI_PROVIDER === 'claude' && CLAUDE_API_KEY) {
      // Use Claude API
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: AI_MODEL,
          max_tokens: maxTokens,
          temperature,
          system: systemPrompt || 'You are a helpful clinical assistant for chiropractors in Norway.',
          messages: [{ role: 'user', content: prompt }]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': CLAUDE_API_KEY,
            'anthropic-version': '2023-06-01'
          }
        }
      );

      return response.data.content[0].text;
    } else {
      // Use Ollama (local)
      const response = await axios.post(
        `${OLLAMA_BASE_URL}/api/generate`,
        {
          model: AI_MODEL,
          prompt: systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt,
          stream: false,
          options: {
            temperature,
            num_predict: maxTokens
          }
        },
        { timeout: 30000 }
      );

      return response.data.response;
    }
  } catch (error) {
    logger.error('AI completion error:', error.message);
    throw new Error('AI service unavailable');
  }
};

/**
 * Spell check and grammar correction for Norwegian clinical notes
 */
export const spellCheckNorwegian = async (text) => {
  const systemPrompt = `Du er en norsk språkassistent som er spesialisert på kiropraktisk medisinsk terminologi.
Korriger stavefeil og grammatiske feil i den følgende kliniske teksten.
Behold alle medisinske fagtermer. Svar kun med den korrigerte teksten uten forklaringer.`;

  const prompt = `Korriger følgende tekst:\n\n${text}`;

  try {
    const correctedText = await generateCompletion(prompt, systemPrompt, { maxTokens: 1000, temperature: 0.3 });

    return {
      original: text,
      corrected: correctedText.trim(),
      hasChanges: text.trim() !== correctedText.trim()
    };
  } catch (error) {
    logger.error('Spell check error:', error);
    return { original: text, corrected: text, hasChanges: false, error: error.message };
  }
};

/**
 * Generate SOAP note suggestions based on symptoms
 */
export const generateSOAPSuggestions = async (chiefComplaint, section = 'subjective') => {
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
      throw new Error('Invalid section');
  }

  try {
    const suggestion = await generateCompletion(prompt, systemPrompt, { maxTokens: 400, temperature: 0.8 });

    return {
      section,
      chiefComplaint,
      suggestion: suggestion.trim()
    };
  } catch (error) {
    logger.error('SOAP suggestion error:', error);
    return { section, chiefComplaint, suggestion: '', error: error.message };
  }
};

/**
 * Suggest ICPC-2 diagnosis codes based on clinical presentation
 */
export const suggestDiagnosisCodes = async (soapData) => {
  const { subjective, objective, assessment } = soapData;

  // Get common chiropractic ICPC-2 codes from database
  const codesResult = await query(
    `SELECT code, description_no, description_en, chapter
     FROM diagnosis_codes
     WHERE system = 'ICPC2' AND chapter IN ('L', 'N') AND commonly_used = true
     ORDER BY usage_count DESC
     LIMIT 20`
  );

  const availableCodes = codesResult.rows;
  const codesText = availableCodes.map(c => `${c.code} - ${c.description_no}`).join('\n');

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
    const suggestion = await generateCompletion(prompt, systemPrompt, { maxTokens: 300, temperature: 0.5 });

    // Extract codes from response
    const suggestedCodes = [];
    for (const code of availableCodes) {
      if (suggestion.includes(code.code)) {
        suggestedCodes.push(code.code);
      }
    }

    return {
      suggestion: suggestion.trim(),
      codes: suggestedCodes,
      reasoning: suggestion
    };
  } catch (error) {
    logger.error('Diagnosis suggestion error:', error);
    return { suggestion: '', codes: [], reasoning: '', error: error.message };
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
    soapData.assessment?.clinical_reasoning || ''
  ].join(' ');

  // Rule-based red flag detection
  const redFlagsDetected = checkRedFlagsInContent(clinicalContent);
  const medicationWarnings = checkMedicationWarnings(patientData.current_medications || []);

  // Comprehensive validation with patient context
  const validationResult = await validateClinicalContent(clinicalContent, {
    patient: patientData
  });

  // If critical flags detected by rules, return immediately
  if (validationResult.riskLevel === 'CRITICAL') {
    logger.warn('CRITICAL red flags detected by clinical validation', {
      flags: redFlagsDetected.map(f => f.flag),
      patient: patientData.id
    });

    return {
      analysis: 'KRITISKE RØDE FLAGG OPPDAGET. ' +
        redFlagsDetected.filter(f => f.severity === 'CRITICAL').map(f => f.message).join(' '),
      riskLevel: 'CRITICAL',
      canTreat: false,
      recommendReferral: true,
      detectedFlags: redFlagsDetected,
      medicationWarnings,
      requiresImmediateAction: true,
      source: 'clinical_validation'
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

${redFlagsDetected.length > 0 ? `MERK: Følgende røde flagg ble oppdaget automatisk: ${redFlagsDetected.map(f => f.flag).join(', ')}` : ''}

Analyser røde flagg og gi anbefaling:`;

  try {
    const analysis = await generateCompletion(prompt, systemPrompt, { maxTokens: 400, temperature: 0.4 });

    // Combine AI analysis with rule-based detection
    let riskLevel = validationResult.riskLevel;

    // AI can upgrade but not downgrade risk level
    const lowercaseAnalysis = analysis.toLowerCase();
    if (lowercaseAnalysis.includes('akutt henvisning') || lowercaseAnalysis.includes('øyeblikkelig') || lowercaseAnalysis.includes('cauda equina')) {
      riskLevel = 'CRITICAL';
    } else if (riskLevel !== 'CRITICAL' && (lowercaseAnalysis.includes('henvise') || lowercaseAnalysis.includes('lege') || lowercaseAnalysis.includes('utredning'))) {
      riskLevel = 'HIGH';
    }

    return {
      analysis: analysis.trim(),
      riskLevel,
      canTreat: riskLevel === 'LOW' || riskLevel === 'MODERATE',
      recommendReferral: riskLevel === 'HIGH' || riskLevel === 'CRITICAL',
      detectedFlags: redFlagsDetected,
      medicationWarnings,
      confidence: validationResult.confidence,
      source: 'combined'
    };
  } catch (error) {
    logger.error('Red flag analysis error:', error);

    // Fall back to rule-based results if AI fails
    return {
      analysis: redFlagsDetected.length > 0
        ? `Automatisk oppdagede røde flagg: ${redFlagsDetected.map(f => f.message).join('; ')}`
        : 'AI-analyse utilgjengelig. Vennligst gjennomgå manuelt.',
      riskLevel: validationResult.riskLevel,
      canTreat: !validationResult.hasRedFlags,
      recommendReferral: validationResult.requiresReview,
      detectedFlags: redFlagsDetected,
      medicationWarnings,
      confidence: validationResult.confidence,
      source: 'clinical_validation_only',
      error: error.message
    };
  }
};

/**
 * Generate clinical summary from encounter
 */
export const generateClinicalSummary = async (encounter) => {
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
    const summary = await generateCompletion(prompt, systemPrompt, { maxTokens: 200, temperature: 0.6 });

    return {
      summary: summary.trim(),
      encounterId: encounter.id
    };
  } catch (error) {
    logger.error('Clinical summary error:', error);
    return { summary: '', error: error.message };
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
 * Get AI service status
 */
export const getAIStatus = async () => {
  try {
    if (AI_PROVIDER === 'ollama') {
      const response = await axios.get(`${OLLAMA_BASE_URL}/api/tags`, { timeout: 5000 });
      return {
        provider: 'ollama',
        available: true,
        model: AI_MODEL,
        models: response.data.models?.map(m => m.name) || []
      };
    } else if (AI_PROVIDER === 'claude' && CLAUDE_API_KEY) {
      return {
        provider: 'claude',
        available: true,
        model: AI_MODEL
      };
    } else {
      return {
        provider: AI_PROVIDER,
        available: false,
        error: 'AI provider not configured'
      };
    }
  } catch (error) {
    return {
      provider: AI_PROVIDER,
      available: false,
      error: error.message
    };
  }
};

export default {
  spellCheckNorwegian,
  generateSOAPSuggestions,
  suggestDiagnosisCodes,
  analyzeRedFlags,
  generateClinicalSummary,
  learnFromOutcome,
  getAIStatus
};
