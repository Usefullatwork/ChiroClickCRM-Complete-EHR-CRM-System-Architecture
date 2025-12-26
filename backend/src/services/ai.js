/**
 * AI Service
 * Intelligent clinical assistance using Ollama (local) or Claude API
 * Features: SOAP note suggestions, spell checking, clinical reasoning, diagnosis suggestions
 *
 * Language-aware model selection:
 * - Norwegian (NO): Viking 7B (akx/viking-7b) - Optimized for Scandinavian languages
 * - English (EN): Gemini 3 Pro Preview 7B or other multilingual model
 *
 * Requires: Minimum 8GB RAM, recommended 16GB for optimal performance
 */

import axios from 'axios';
import logger from '../utils/logger.js';
import { query } from '../config/database.js';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || null;
const AI_PROVIDER = process.env.AI_PROVIDER || 'ollama'; // 'ollama' or 'claude'

// Language-aware model configuration
const AI_MODEL_NO = process.env.AI_MODEL_NO || 'akx/viking-7b'; // Norwegian-optimized model (Nordic languages)
const AI_MODEL_EN = process.env.AI_MODEL_EN || 'gemini-3-pro-preview:7b'; // English/multilingual model
const AI_MODEL = process.env.AI_MODEL || AI_MODEL_EN; // Default fallback model
const DEFAULT_LANGUAGE = process.env.DEFAULT_LANGUAGE || 'NO';

/**
 * Get the appropriate model for the specified language
 * @param {string} language - Language code ('NO', 'EN', etc.)
 * @returns {string} Model name for Ollama or Claude
 */
const getModelForLanguage = (language = DEFAULT_LANGUAGE) => {
  const lang = (language || DEFAULT_LANGUAGE).toUpperCase();

  switch (lang) {
    case 'NO':
    case 'NB': // Norwegian Bokmål
    case 'NN': // Norwegian Nynorsk
    case 'SV': // Swedish
    case 'DA': // Danish
    case 'FI': // Finnish
    case 'IS': // Icelandic
      return AI_MODEL_NO; // Viking 7B is optimized for Nordic languages
    case 'EN':
    case 'EN-US':
    case 'EN-GB':
      return AI_MODEL_EN;
    default:
      return AI_MODEL; // Fallback to default
  }
};

/**
 * Generate AI completion using selected provider
 * @param {string} prompt - The user prompt
 * @param {string} systemPrompt - System prompt for context
 * @param {object} options - Options including maxTokens, temperature, and language
 */
const generateCompletion = async (prompt, systemPrompt = null, options = {}) => {
  const { maxTokens = 500, temperature = 0.7, language = DEFAULT_LANGUAGE } = options;

  // Select appropriate model based on language
  const model = getModelForLanguage(language);

  try {
    if (AI_PROVIDER === 'claude' && CLAUDE_API_KEY) {
      // Use Claude API (Claude handles multiple languages well)
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: AI_MODEL, // Claude uses same model for all languages
          max_tokens: maxTokens,
          temperature,
          system: systemPrompt || (language === 'NO'
            ? 'Du er en hjelpsom klinisk assistent for kiropraktorer i Norge.'
            : 'You are a helpful clinical assistant for chiropractors.'),
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
      // Use Ollama (local) with language-specific model
      logger.info(`Using AI model: ${model} for language: ${language}`);

      const response = await axios.post(
        `${OLLAMA_BASE_URL}/api/generate`,
        {
          model: model, // Language-specific model
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
    logger.error(`AI completion error (model: ${model}, language: ${language}):`, error.message);
    throw new Error('AI service unavailable');
  }
};

/**
 * Spell check and grammar correction for clinical notes
 * Supports Norwegian and English based on language parameter
 * @param {string} text - Text to check
 * @param {string} language - Language code ('NO' for Norwegian, 'EN' for English)
 */
export const spellCheck = async (text, language = 'NO') => {
  const isNorwegian = language.toUpperCase().startsWith('N');

  const systemPrompt = isNorwegian
    ? `Du er en norsk språkassistent som er spesialisert på kiropraktisk medisinsk terminologi.
Korriger stavefeil og grammatiske feil i den følgende kliniske teksten.
Behold alle medisinske fagtermer. Svar kun med den korrigerte teksten uten forklaringer.`
    : `You are an English language assistant specialized in chiropractic medical terminology.
Correct spelling and grammatical errors in the following clinical text.
Preserve all medical terms. Reply only with the corrected text without explanations.`;

  const prompt = isNorwegian
    ? `Korriger følgende tekst:\n\n${text}`
    : `Correct the following text:\n\n${text}`;

  try {
    const correctedText = await generateCompletion(prompt, systemPrompt, {
      maxTokens: 1000,
      temperature: 0.3,
      language
    });

    return {
      original: text,
      corrected: correctedText.trim(),
      hasChanges: text.trim() !== correctedText.trim(),
      language
    };
  } catch (error) {
    logger.error('Spell check error:', error);
    return { original: text, corrected: text, hasChanges: false, error: error.message, language };
  }
};

// Backwards compatibility alias
export const spellCheckNorwegian = (text) => spellCheck(text, 'NO');

/**
 * Generate SOAP note suggestions based on symptoms
 * @param {string} chiefComplaint - Patient's main complaint
 * @param {string} section - SOAP section ('subjective', 'objective', 'assessment', 'plan')
 * @param {string} language - Language code ('NO' for Norwegian, 'EN' for English)
 */
export const generateSOAPSuggestions = async (chiefComplaint, section = 'subjective', language = 'NO') => {
  const isNorwegian = language.toUpperCase().startsWith('N');
  let systemPrompt;
  let prompt;

  const prompts = {
    subjective: {
      NO: {
        system: `Du er en erfaren kiropraktor i Norge. Generer relevante subjektive funn basert på pasientens hovedplage.
        Inkluder: sykehistorie, debut, smertebeskrivelse, forverrende/lindrende faktorer.
        Skriv på norsk i punktform.`,
        user: `Hovedplage: ${chiefComplaint}\n\nGenerer subjektive funn:`
      },
      EN: {
        system: `You are an experienced chiropractor. Generate relevant subjective findings based on the patient's chief complaint.
        Include: history, onset, pain description, aggravating/relieving factors.
        Write in bullet points.`,
        user: `Chief complaint: ${chiefComplaint}\n\nGenerate subjective findings:`
      }
    },
    objective: {
      NO: {
        system: `Du er en erfaren kiropraktor. Generer relevante objektive funn og tester basert på pasientens hovedplage.
        Inkluder: observasjon, palpasjon, bevegelighet (ROM), ortopediske tester.
        Skriv på norsk i punktform.`,
        user: `Hovedplage: ${chiefComplaint}\n\nGenerer objektive funn:`
      },
      EN: {
        system: `You are an experienced chiropractor. Generate relevant objective findings and tests based on the patient's chief complaint.
        Include: observation, palpation, range of motion (ROM), orthopedic tests.
        Write in bullet points.`,
        user: `Chief complaint: ${chiefComplaint}\n\nGenerate objective findings:`
      }
    },
    assessment: {
      NO: {
        system: `Du er en erfaren kiropraktor. Generer klinisk vurdering basert på pasientens hovedplage.
        Inkluder: differensialdiagnose, prognose, klinisk resonnement.
        Skriv på norsk.`,
        user: `Hovedplage: ${chiefComplaint}\n\nGenerer vurdering:`
      },
      EN: {
        system: `You are an experienced chiropractor. Generate clinical assessment based on the patient's chief complaint.
        Include: differential diagnosis, prognosis, clinical reasoning.`,
        user: `Chief complaint: ${chiefComplaint}\n\nGenerate assessment:`
      }
    },
    plan: {
      NO: {
        system: `Du er en erfaren kiropraktor. Generer behandlingsplan basert på pasientens hovedplage.
        Inkluder: behandling, øvelser, råd, oppfølging.
        Skriv på norsk i punktform.`,
        user: `Hovedplage: ${chiefComplaint}\n\nGenerer plan:`
      },
      EN: {
        system: `You are an experienced chiropractor. Generate treatment plan based on the patient's chief complaint.
        Include: treatment, exercises, advice, follow-up.
        Write in bullet points.`,
        user: `Chief complaint: ${chiefComplaint}\n\nGenerate plan:`
      }
    }
  };

  if (!prompts[section]) {
    throw new Error('Invalid section');
  }

  const langKey = isNorwegian ? 'NO' : 'EN';
  systemPrompt = prompts[section][langKey].system;
  prompt = prompts[section][langKey].user;

  try {
    const suggestion = await generateCompletion(prompt, systemPrompt, {
      maxTokens: 400,
      temperature: 0.8,
      language
    });

    return {
      section,
      chiefComplaint,
      suggestion: suggestion.trim(),
      language
    };
  } catch (error) {
    logger.error('SOAP suggestion error:', error);
    return { section, chiefComplaint, suggestion: '', error: error.message, language };
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
 */
export const analyzeRedFlags = async (patientData, soapData) => {
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

Analyser røde flagg og gi anbefaling:`;

  try {
    const analysis = await generateCompletion(prompt, systemPrompt, { maxTokens: 400, temperature: 0.4 });

    // Determine risk level based on keywords
    const lowercaseAnalysis = analysis.toLowerCase();
    let riskLevel = 'LOW';

    if (lowercaseAnalysis.includes('akutt henvisning') || lowercaseAnalysis.includes('øyeblikkelig') || lowercaseAnalysis.includes('cauda equina')) {
      riskLevel = 'CRITICAL';
    } else if (lowercaseAnalysis.includes('henvise') || lowercaseAnalysis.includes('lege') || lowercaseAnalysis.includes('utredning')) {
      riskLevel = 'HIGH';
    } else if (lowercaseAnalysis.includes('forsiktig') || lowercaseAnalysis.includes('overvåke')) {
      riskLevel = 'MODERATE';
    }

    return {
      analysis: analysis.trim(),
      riskLevel,
      canTreat: riskLevel === 'LOW' || riskLevel === 'MODERATE',
      recommendReferral: riskLevel === 'HIGH' || riskLevel === 'CRITICAL'
    };
  } catch (error) {
    logger.error('Red flag analysis error:', error);
    return { analysis: '', riskLevel: 'UNKNOWN', canTreat: false, error: error.message };
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
 * Get AI service status with language-specific model info
 */
export const getAIStatus = async () => {
  try {
    if (AI_PROVIDER === 'ollama') {
      const response = await axios.get(`${OLLAMA_BASE_URL}/api/tags`, { timeout: 5000 });
      const availableModels = response.data.models?.map(m => m.name) || [];

      // Check if language-specific models are available
      const norwegianModelAvailable = availableModels.some(m =>
        m.includes(AI_MODEL_NO) || m === AI_MODEL_NO
      );
      const englishModelAvailable = availableModels.some(m =>
        m.includes(AI_MODEL_EN) || m === AI_MODEL_EN
      );

      return {
        provider: 'ollama',
        available: true,
        defaultLanguage: DEFAULT_LANGUAGE,
        models: {
          norwegian: {
            model: AI_MODEL_NO,
            available: norwegianModelAvailable,
            description: 'Viking 7B - Optimized for Norwegian and Nordic languages'
          },
          english: {
            model: AI_MODEL_EN,
            available: englishModelAvailable,
            description: 'Multilingual model for English and other languages'
          }
        },
        allModels: availableModels,
        pullCommands: {
          norwegian: `ollama pull ${AI_MODEL_NO}`,
          english: `ollama pull ${AI_MODEL_EN}`
        }
      };
    } else if (AI_PROVIDER === 'claude' && CLAUDE_API_KEY) {
      return {
        provider: 'claude',
        available: true,
        model: AI_MODEL,
        supportsMultipleLanguages: true,
        note: 'Claude API handles Norwegian and English with the same model'
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
  spellCheck,
  spellCheckNorwegian, // Backwards compatibility
  generateSOAPSuggestions,
  suggestDiagnosisCodes,
  analyzeRedFlags,
  generateClinicalSummary,
  learnFromOutcome,
  getAIStatus,
  getModelForLanguage // Expose for testing
};
