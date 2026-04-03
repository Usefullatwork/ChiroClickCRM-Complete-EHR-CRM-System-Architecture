/**
 * Letter Generator Service
 * AI-powered clinical letter generation using Ollama
 * Generates Norwegian medical letters, certificates, and referrals
 */

import axios from 'axios';
import logger from '../../utils/logger.js';
import { query } from '../../config/database.js';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const AI_MODEL = process.env.AI_MODEL || 'chiro-no-sft-dpo-v5';

// =============================================================================
// LETTER TYPE DEFINITIONS
// =============================================================================

export const LETTER_TYPES = {
  MEDICAL_CERTIFICATE: {
    id: 'MEDICAL_CERTIFICATE',
    name: 'Medisinsk erklæring',
    nameEn: 'Medical Certificate',
    description: 'General medical declaration for university, employer, or other institutions',
    requiredFields: ['patient', 'diagnosis', 'purpose'],
    template: 'medical_certificate',
  },
  UNIVERSITY_LETTER: {
    id: 'UNIVERSITY_LETTER',
    name: 'Universitetsbrev',
    nameEn: 'University Letter',
    description: 'Letter for exam deferral or study modifications',
    requiredFields: ['patient', 'diagnosis', 'institution', 'examDate'],
    template: 'university_letter',
  },
  VESTIBULAR_REFERRAL: {
    id: 'VESTIBULAR_REFERRAL',
    name: 'Svimmelhet henvisning',
    nameEn: 'Vestibular Referral',
    description: 'Referral for vestibular disorders including BPPV and vestibular neuritis',
    requiredFields: ['patient', 'symptoms', 'findings', 'vngResults'],
    template: 'vestibular_referral',
  },
  HEADACHE_REFERRAL: {
    id: 'HEADACHE_REFERRAL',
    name: 'Hodepine henvisning',
    nameEn: 'Headache Referral',
    description: 'Referral for headache investigation including migraine studies',
    requiredFields: ['patient', 'headacheType', 'frequency', 'triggers'],
    template: 'headache_referral',
  },
  MEMBERSHIP_FREEZE: {
    id: 'MEMBERSHIP_FREEZE',
    name: 'Treningssentererklæring',
    nameEn: 'Gym Membership Freeze',
    description: 'Medical declaration for freezing gym or sports membership',
    requiredFields: ['patient', 'diagnosis', 'duration'],
    template: 'membership_freeze',
  },
  CLINICAL_NOTE: {
    id: 'CLINICAL_NOTE',
    name: 'Klinisk notat',
    nameEn: 'Clinical Note',
    description: 'Detailed clinical note for specialists or other healthcare providers',
    requiredFields: ['patient', 'findings', 'assessment'],
    template: 'clinical_note',
  },
  WORK_DECLARATION: {
    id: 'WORK_DECLARATION',
    name: 'Arbeidsgivererklæring',
    nameEn: 'Work Declaration',
    description: 'Declaration for employer regarding work capacity and restrictions',
    requiredFields: ['patient', 'diagnosis', 'workCapacity', 'restrictions'],
    template: 'work_declaration',
  },
};

// =============================================================================
// SYSTEM PROMPTS FOR LETTER GENERATION
// =============================================================================

const LETTER_SYSTEM_PROMPTS = {
  base: `Du er en erfaren norsk kiropraktor som skriver profesjonelle medisinske brev og erklæringer.

VIKTIGE RETNINGSLINJER:
1. Skriv alltid på formelt, profesjonelt norsk
2. Bruk korrekt medisinsk terminologi
3. Vær presis og konsis
4. Inkluder relevante ICPC-2 koder når aktuelt
5. Følg norske helsevesen standarder
6. Inkluder alltid dato og signatur-felt
7. Beskytt pasientens personvern - bruk kun nødvendig informasjon`,

  MEDICAL_CERTIFICATE: `Du skriver en medisinsk erklæring (attestasjon).

FORMAT:
1. Overskrift: "MEDISINSK ERKLÆRING"
2. Dato og sted
3. Pasientinformasjon (navn, fødselsdato)
4. "Det bekreftes herved at..." - hovedutsagn
5. Klinisk bakgrunn og funn
6. Vurdering og anbefaling
7. Signatur (behandler, HPR-nummer)

Bruk profesjonelt språk og vær objektiv.`,

  UNIVERSITY_LETTER: `Du skriver et brev til et universitet angående utsatt eksamen eller studietilpasninger.

FORMAT:
1. Overskrift: "MEDISINSK ERKLÆRING - UTSATT EKSAMEN"
2. Til: [Universitet/Fakultet]
3. Vedrørende: [Studentens navn og studentnummer]
4. Bakgrunn og diagnose
5. Hvordan tilstanden påvirker studieevne
6. Anbefaling om tilrettelegging
7. Signatur

Vær tydelig på hvorfor tilpasning er medisinsk begrunnet.`,

  VESTIBULAR_REFERRAL: `Du skriver en henvisning for vestibulær utredning.

FORMAT:
1. Overskrift: "HENVISNING - VESTIBULÆR UTREDNING"
2. Til: [ØNH-avdeling/Nevrologisk avdeling]
3. Pasientinformasjon
4. Sykehistorie (debut, symptomer, forløp)
5. Kliniske funn:
   - VNG-resultater
   - Dix-Hallpike funn
   - HIT-test
   - Romberg/balanse
6. Tentativ diagnose (BPPV, vestibularisnevritt, etc.)
7. Spørsmålsstilling/ønske
8. Signatur

Inkluder relevante ICPC-2 koder (H82 vestibulært syndrom).`,

  HEADACHE_REFERRAL: `Du skriver en henvisning for hodepineutredning.

FORMAT:
1. Overskrift: "HENVISNING - HODEPINEUTREDNING"
2. Til: [Nevrologisk avdeling/Hodepineklinikk]
3. Pasientinformasjon
4. Hodepinekarakteristikk:
   - Type (migrene, tensjon, cluster, etc.)
   - Frekvens og intensitet
   - Triggere og lindrende faktorer
   - Medikamentbruk
5. Kliniske funn
6. Røde flagg vurdert
7. Spørsmålsstilling
8. Signatur

Vurder om dette er primær eller sekundær hodepine.`,

  MEMBERSHIP_FREEZE: `Du skriver en erklæring for frys av treningsmedlemskap.

FORMAT:
1. Overskrift: "MEDISINSK ERKLÆRING - AKTIVITETSPAUSE"
2. Til: [Treningssenter]
3. Vedrørende: [Pasientnavn]
4. "Det bekreftes at ovennevnte er under behandling for..."
5. Begrunnelse for aktivitetspause
6. Anbefalt varighet
7. Eventuelle tillatte aktiviteter
8. Signatur

Vær konkret på medisinsk begrunnelse og varighet.`,

  CLINICAL_NOTE: `Du skriver et detaljert klinisk notat.

FORMAT:
1. Overskrift: "KLINISK NOTAT"
2. Pasient og dato
3. ANAMNESE
   - Henvisningsårsak
   - Sykehistorie
   - Tidligere behandling
4. OBJEKTIVE FUNN
   - Undersøkelsesfunn
   - Tester utført
   - Målinger
5. VURDERING
   - Diagnose/differensialdiagnoser
   - Klinisk resonnement
6. PLAN
   - Behandling
   - Oppfølging
   - Råd til pasient
7. Signatur`,

  WORK_DECLARATION: `Du skriver en erklæring til arbeidsgiver.

FORMAT:
1. Overskrift: "ERKLÆRING TIL ARBEIDSGIVER"
2. Dato
3. Vedrørende: [Arbeidstakers navn]
4. Medisinsk bakgrunn (uten å bryte taushetsplikt)
5. Funksjonsvurdering
6. Arbeidsevne (full, delvis, ingen)
7. Eventuelle tilretteleggingsbehov
8. Forventet varighet
9. Signatur

Beskytt sensitiv medisinsk informasjon - gi kun arbeidsrelevant info.`,
};

// =============================================================================
// AI GENERATION FUNCTIONS
// =============================================================================

/**
 * Generate AI completion for letter content
 * @param {string} prompt - User prompt
 * @param {string} systemPrompt - System context
 * @param {Object} options - Generation options
 * @returns {Promise<string>} Generated text
 */
/**
 * 3-tier AI generation: Ollama → Claude API → Template fallback
 */
const generateCompletion = async (prompt, systemPrompt, options = {}) => {
  const { maxTokens = 1500, temperature = 0.4 } = options;

  // Tier 1: Try Ollama (local AI)
  try {
    const response = await axios.post(
      `${OLLAMA_BASE_URL}/api/generate`,
      {
        model: AI_MODEL,
        prompt: `${systemPrompt}\n\n${prompt}`,
        stream: false,
        options: {
          temperature,
          num_predict: maxTokens,
        },
      },
      { timeout: 60000 }
    );
    logger.info('Letter generated via Ollama');
    return response.data.response;
  } catch (ollamaError) {
    logger.warn('Ollama unavailable for letter generation, trying Claude API fallback');
  }

  // Tier 2: Try Claude API (requires CLAUDE_API_KEY)
  const claudeApiKey = process.env.CLAUDE_API_KEY;
  const claudeMode = process.env.CLAUDE_FALLBACK_MODE || 'disabled';
  if (claudeApiKey && claudeMode !== 'disabled') {
    try {
      const claudeResponse = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: 'claude-sonnet-4-20250514',
          max_tokens: maxTokens,
          system: systemPrompt,
          messages: [{ role: 'user', content: prompt }],
        },
        {
          timeout: 60000,
          headers: {
            'x-api-key': claudeApiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
        }
      );
      logger.info('Letter generated via Claude API fallback');
      return claudeResponse.data.content[0].text;
    } catch (claudeError) {
      logger.warn('Claude API fallback failed for letter generation:', claudeError.message);
    }
  }

  // Tier 3: Template fallback (no AI required)
  logger.info('Using template fallback for letter generation (no AI available)');
  return null; // Signals generateLetter to use template
};

/**
 * Generate a clinical letter using AI
 * @param {string} letterType - Type of letter to generate
 * @param {Object} data - Data for letter generation
 * @returns {Promise<Object>} Generated letter with metadata
 */
export const generateLetter = async (letterType, data) => {
  const letterConfig = LETTER_TYPES[letterType];
  if (!letterConfig) {
    throw new Error(`Unknown letter type: ${letterType}`);
  }

  const systemPrompt = `${LETTER_SYSTEM_PROMPTS.base}\n\n${LETTER_SYSTEM_PROMPTS[letterType] || ''}`;

  // Build the generation prompt from provided data
  const prompt = buildLetterPrompt(letterType, data);

  try {
    const generatedContent = await generateCompletion(prompt, systemPrompt, {
      maxTokens: 2000,
      temperature: 0.3,
    });

    // If null, AI is unavailable — use template fallback
    if (generatedContent === null) {
      const templateContent = buildTemplateFallback(letterType, data);
      return {
        success: true,
        letterType,
        letterTypeName: letterConfig.name,
        content: templateContent,
        rawContent: templateContent,
        generatedAt: new Date().toISOString(),
        model: 'template-fallback',
        aiGenerated: false,
      };
    }

    // Post-process the generated letter
    const processedLetter = postProcessLetter(generatedContent, data);

    return {
      success: true,
      letterType,
      letterTypeName: letterConfig.name,
      content: processedLetter,
      rawContent: generatedContent,
      generatedAt: new Date().toISOString(),
      model: AI_MODEL,
      aiGenerated: true,
    };
  } catch (error) {
    logger.error('Letter generation error:', error);
    // Final fallback: return template even on error
    const templateContent = buildTemplateFallback(letterType, data);
    return {
      success: true,
      letterType,
      letterTypeName: letterConfig.name,
      content: templateContent,
      rawContent: templateContent,
      generatedAt: new Date().toISOString(),
      model: 'template-fallback',
      aiGenerated: false,
    };
  }
};

/**
 * Build prompt for letter generation based on type and data
 * @param {string} letterType - Letter type
 * @param {Object} data - Data for generation
 * @returns {string} Formatted prompt
 */
const buildLetterPrompt = (letterType, data) => {
  const { patient, diagnosis, findings, purpose, recipient, additionalInfo } = data;

  let prompt = `Generer en ${LETTER_TYPES[letterType].name} med følgende informasjon:\n\n`;

  if (patient) {
    prompt += `PASIENT:\n`;
    prompt += `- Navn: ${patient.name || '[Navn]'}\n`;
    prompt += `- Fødselsdato: ${patient.dateOfBirth || '[Fødselsdato]'}\n`;
    if (patient.address) {
      prompt += `- Adresse: ${patient.address}\n`;
    }
    prompt += '\n';
  }

  if (diagnosis) {
    prompt += `DIAGNOSE/TILSTAND:\n${diagnosis}\n\n`;
  }

  if (findings) {
    prompt += `KLINISKE FUNN:\n${findings}\n\n`;
  }

  if (purpose) {
    prompt += `FORMÅL:\n${purpose}\n\n`;
  }

  if (recipient) {
    prompt += `MOTTAKER:\n${recipient}\n\n`;
  }

  if (additionalInfo) {
    prompt += `TILLEGGSINFORMASJON:\n${additionalInfo}\n\n`;
  }

  // Add type-specific details
  switch (letterType) {
    case 'VESTIBULAR_REFERRAL':
      if (data.vngResults) {
        prompt += `VNG-RESULTATER:\n${data.vngResults}\n\n`;
      }
      if (data.symptoms) {
        prompt += `SYMPTOMER:\n${data.symptoms}\n\n`;
      }
      break;

    case 'HEADACHE_REFERRAL':
      if (data.headacheType) {
        prompt += `HODEPINETYPE: ${data.headacheType}\n`;
      }
      if (data.frequency) {
        prompt += `FREKVENS: ${data.frequency}\n`;
      }
      if (data.triggers) {
        prompt += `TRIGGERE: ${data.triggers}\n\n`;
      }
      break;

    case 'WORK_DECLARATION':
      if (data.workCapacity) {
        prompt += `ARBEIDSEVNE: ${data.workCapacity}\n`;
      }
      if (data.restrictions) {
        prompt += `RESTRIKSJONER: ${data.restrictions}\n\n`;
      }
      break;

    case 'MEMBERSHIP_FREEZE':
      if (data.duration) {
        prompt += `ØNSKET VARIGHET: ${data.duration}\n\n`;
      }
      break;

    case 'UNIVERSITY_LETTER':
      if (data.institution) {
        prompt += `INSTITUSJON: ${data.institution}\n`;
      }
      if (data.examDate) {
        prompt += `EKSAMENSDATO: ${data.examDate}\n\n`;
      }
      break;
  }

  prompt += `\nSkriv et komplett, profesjonelt brev klart til signering.`;

  return prompt;
};

/**
 * Build a template-based letter when no AI is available (Tier 3 fallback)
 * @param {string} letterType - Letter type
 * @param {Object} data - Patient/clinical data
 * @returns {string} Formatted Norwegian letter from template
 */
const buildTemplateFallback = (letterType, data) => {
  const today = new Date().toLocaleDateString('nb-NO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const patientName = data.patient?.name || '[Pasientnavn]';
  const patientDob = data.patient?.dateOfBirth || '[Fødselsdato]';
  const diagnosis = data.diagnosis || '[Diagnose]';
  const findings = data.findings || '[Kliniske funn]';
  const recipient = data.recipient || '[Mottaker]';
  const providerName = data.provider?.name || '[Behandlerens navn]';
  const providerHpr = data.provider?.hprNumber || '[HPR-nummer]';

  const templates = {
    MEDICAL_CERTIFICATE: `MEDISINSK ERKLÆRING

Dato: ${today}

Pasient: ${patientName}
Fødselsdato: ${patientDob}

Det bekreftes herved at ovennevnte pasient er under behandling hos undertegnede kiropraktor.

Diagnose: ${diagnosis}

Kliniske funn:
${findings}

Formål: ${data.purpose || '[Formål med erklæringen]'}

Med vennlig hilsen,

${providerName}
Kiropraktor
HPR: ${providerHpr}`,

    VESTIBULAR_REFERRAL: `HENVISNING - VESTIBULÆR UTREDNING

Dato: ${today}
Til: ${recipient}

Pasient: ${patientName}
Fødselsdato: ${patientDob}

Henvisningsårsak:
Pasienten henvises for vestibulær utredning grunnet ${diagnosis}.

Kliniske funn:
${findings}
${data.vngResults ? `\nVNG-resultater:\n${data.vngResults}` : ''}
${data.symptoms ? `\nSymptomer:\n${data.symptoms}` : ''}

Spørsmålsstilling:
Vennligst vurder videre utredning og eventuell behandling.

Med vennlig hilsen,

${providerName}
Kiropraktor
HPR: ${providerHpr}`,

    HEADACHE_REFERRAL: `HENVISNING - HODEPINEUTREDNING

Dato: ${today}
Til: ${recipient}

Pasient: ${patientName}
Fødselsdato: ${patientDob}

Henvisningsårsak:
Pasienten henvises for hodepineutredning.
${data.headacheType ? `Type: ${data.headacheType}` : ''}
${data.frequency ? `Frekvens: ${data.frequency}` : ''}
${data.triggers ? `Triggere: ${data.triggers}` : ''}

Kliniske funn:
${findings}

Diagnose: ${diagnosis}

Spørsmålsstilling:
Vennligst vurder videre utredning og diagnostikk.

Med vennlig hilsen,

${providerName}
Kiropraktor
HPR: ${providerHpr}`,

    WORK_DECLARATION: `ERKLÆRING TIL ARBEIDSGIVER

Dato: ${today}

Vedrørende: ${patientName}
Fødselsdato: ${patientDob}

Det bekreftes herved at ovennevnte er under behandling for en muskel-skjelettlidelse.

Funksjonsvurdering:
${data.workCapacity || '[Arbeidsevne]'}

Eventuelle restriksjoner:
${data.restrictions || '[Restriksjoner]'}

Forventet varighet: ${data.duration || '[Varighet]'}

Med vennlig hilsen,

${providerName}
Kiropraktor
HPR: ${providerHpr}`,

    MEMBERSHIP_FREEZE: `MEDISINSK ERKLÆRING - AKTIVITETSPAUSE

Dato: ${today}

Til: ${recipient || '[Treningssenter]'}

Vedrørende: ${patientName}
Fødselsdato: ${patientDob}

Det bekreftes at ovennevnte er under behandling for ${diagnosis} og anbefales aktivitetspause i ${data.duration || '[varighet]'}.

Med vennlig hilsen,

${providerName}
Kiropraktor
HPR: ${providerHpr}`,

    CLINICAL_NOTE: `KLINISK NOTAT

Dato: ${today}

Pasient: ${patientName}
Fødselsdato: ${patientDob}

ANAMNESE:
${data.purpose || '[Henvisningsårsak og sykehistorie]'}

OBJEKTIVE FUNN:
${findings}

VURDERING:
Diagnose: ${diagnosis}

PLAN:
${data.additionalInfo || '[Behandlingsplan og oppfølging]'}

${providerName}
Kiropraktor
HPR: ${providerHpr}`,

    UNIVERSITY_LETTER: `MEDISINSK ERKLÆRING - UTSATT EKSAMEN

Dato: ${today}
Til: ${data.institution || '[Universitet/Fakultet]'}

Vedrørende: ${patientName}
Fødselsdato: ${patientDob}
${data.examDate ? `Eksamensdato: ${data.examDate}` : ''}

Det bekreftes herved at ovennevnte student er under behandling for ${diagnosis}.

Kliniske funn:
${findings}

Anbefaling: Det anbefales tilrettelegging/utsettelse av eksamen grunnet ovennevnte tilstand.

Med vennlig hilsen,

${providerName}
Kiropraktor
HPR: ${providerHpr}`,
  };

  return templates[letterType] || templates.CLINICAL_NOTE;
};

/**
 * Post-process generated letter content
 * @param {string} content - Raw generated content
 * @param {Object} data - Original data
 * @returns {string} Processed letter content
 */
const postProcessLetter = (content, data) => {
  let processed = content.trim();

  // Ensure proper date format if placeholder exists
  const today = new Date().toLocaleDateString('nb-NO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  processed = processed.replace(/\[dato\]/gi, today);
  processed = processed.replace(/\[today\]/gi, today);

  // Replace any remaining placeholders with provided data
  if (data.patient?.name) {
    processed = processed.replace(/\[navn\]/gi, data.patient.name);
    processed = processed.replace(/\[pasientnavn\]/gi, data.patient.name);
  }

  if (data.provider?.name) {
    processed = processed.replace(/\[behandler\]/gi, data.provider.name);
    processed = processed.replace(/\[kiropraktor\]/gi, data.provider.name);
  }

  if (data.provider?.hprNumber) {
    processed = processed.replace(/\[hpr\]/gi, data.provider.hprNumber);
    processed = processed.replace(/\[hpr-nummer\]/gi, data.provider.hprNumber);
  }

  if (data.clinic?.name) {
    processed = processed.replace(/\[klinikk\]/gi, data.clinic.name);
  }

  return processed;
};

/**
 * Generate letter suggestions based on clinical context
 * @param {Object} clinicalContext - SOAP data and patient info
 * @returns {Promise<Object>} Suggested letter content
 */
export const suggestLetterContent = async (clinicalContext) => {
  const { soap, _patient, diagnosis } = clinicalContext;

  const systemPrompt = `${LETTER_SYSTEM_PROMPTS.base}

Du skal analysere kliniske data og foreslå passende innhold for et medisinsk brev.
Vær konsis og fokuser på de viktigste kliniske punktene.`;

  const prompt = `Basert på følgende kliniske informasjon, foreslå innhold for et medisinsk brev:

SUBJEKTIV:
${soap?.subjective?.chief_complaint || 'Ikke oppgitt'}
${soap?.subjective?.history || ''}

OBJEKTIV:
${soap?.objective?.observation || ''}
${soap?.objective?.palpation || ''}

VURDERING:
${soap?.assessment?.clinical_reasoning || ''}

DIAGNOSE:
${diagnosis || 'Ikke spesifisert'}

Foreslå:
1. Hovedpunkter å inkludere
2. Relevante kliniske funn å fremheve
3. Anbefalt formulering`;

  try {
    const suggestion = await generateCompletion(prompt, systemPrompt, {
      maxTokens: 800,
      temperature: 0.5,
    });

    return {
      success: true,
      suggestion: suggestion.trim(),
    };
  } catch (error) {
    logger.error('Letter suggestion error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get available letter types
 * @returns {Array} List of available letter types
 */
export const getLetterTypes = () =>
  Object.values(LETTER_TYPES).map((type) => ({
    id: type.id,
    name: type.name,
    nameEn: type.nameEn,
    description: type.description,
    requiredFields: type.requiredFields,
  }));

/**
 * Save generated letter to database
 * @param {string} organizationId - Organization ID
 * @param {string} patientId - Patient ID
 * @param {Object} letterData - Letter data to save
 * @returns {Promise<Object>} Saved letter record
 */
export const saveLetter = async (organizationId, patientId, letterData) => {
  try {
    const result = await query(
      `INSERT INTO generated_letters
       (organization_id, patient_id, letter_type, content, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [
        organizationId,
        patientId,
        letterData.letterType,
        letterData.content,
        JSON.stringify({
          letterTypeName: letterData.letterTypeName,
          generatedAt: letterData.generatedAt,
          model: letterData.model,
        }),
      ]
    );

    return result.rows[0];
  } catch (error) {
    logger.error('Error saving letter:', error);
    throw error;
  }
};

/**
 * Get letter history for patient
 * @param {string} organizationId - Organization ID
 * @param {string} patientId - Patient ID
 * @returns {Promise<Array>} Letter history
 */
export const getLetterHistory = async (organizationId, patientId) => {
  try {
    const result = await query(
      `SELECT id, organization_id, patient_id, encounter_id, letter_type, letter_title,
              content, template_id, metadata, recipient_name, recipient_institution,
              recipient_address, status, sent_at, sent_method, signed_at, signed_by,
              signature_data, created_at, updated_at, created_by
       FROM generated_letters
       WHERE organization_id = $1 AND patient_id = $2
       ORDER BY created_at DESC
       LIMIT 50`,
      [organizationId, patientId]
    );

    return result.rows;
  } catch (error) {
    logger.error('Error fetching letter history:', error);
    throw error;
  }
};

export default {
  LETTER_TYPES,
  generateLetter,
  suggestLetterContent,
  getLetterTypes,
  saveLetter,
  getLetterHistory,
};
