/**
 * AI Service Layer for Local Ollama Integration
 *
 * This service connects to a local Ollama instance for:
 * - Intake form to Subjective narrative generation
 * - Voice transcription processing (via Whisper)
 * - Clinical note assistance
 * - Compliance checking augmentation
 *
 * Privacy: All AI processing happens locally - no PII leaves the server
 */

// Default Ollama configuration
const DEFAULT_CONFIG = {
  baseUrl: 'http://localhost:11434',
  model: 'llama3.2', // Recommended: llama3.2, mistral, or medllama2
  whisperModel: 'base', // Whisper model for transcription
  timeout: 60000, // 60 second timeout for generation
  temperature: 0.3, // Lower temperature for clinical accuracy
  maxTokens: 2048,
};

// Storage key for persisted settings
const STORAGE_KEY = 'chiroclick_ai_config';

/**
 * Get AI configuration from localStorage or defaults
 */
export function getAIConfig() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.warn('Failed to load AI config:', e);
  }
  return DEFAULT_CONFIG;
}

/**
 * Save AI configuration to localStorage
 */
export function saveAIConfig(config) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    return true;
  } catch (e) {
    console.error('Failed to save AI config:', e);
    return false;
  }
}

/**
 * Check if Ollama is running and accessible
 */
export async function checkOllamaStatus() {
  const config = getAIConfig();
  try {
    const response = await fetch(`${config.baseUrl}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        connected: true,
        models: data.models || [],
        baseUrl: config.baseUrl,
      };
    }
    return { connected: false, error: 'Ollama not responding' };
  } catch (error) {
    return {
      connected: false,
      error: error.message || 'Cannot connect to Ollama',
      baseUrl: config.baseUrl,
    };
  }
}

/**
 * List available models from Ollama
 */
export async function listModels() {
  const config = getAIConfig();
  try {
    const response = await fetch(`${config.baseUrl}/api/tags`);
    const data = await response.json();
    return data.models || [];
  } catch (error) {
    console.error('Failed to list models:', error);
    return [];
  }
}

/**
 * Generate text using Ollama
 */
export async function generateText(prompt, options = {}) {
  const config = getAIConfig();
  const {
    model = config.model,
    temperature = config.temperature,
    maxTokens = config.maxTokens,
    system = null,
    stream = false,
  } = options;

  try {
    const response = await fetch(`${config.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        system,
        stream,
        options: {
          temperature,
          num_predict: maxTokens,
        },
      }),
      signal: AbortSignal.timeout(config.timeout),
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status}`);
    }

    if (stream) {
      return response.body; // Return readable stream
    }

    const data = await response.json();
    return {
      text: data.response,
      model: data.model,
      totalDuration: data.total_duration,
      promptEvalCount: data.prompt_eval_count,
    };
  } catch (error) {
    console.error('Generate text error:', error);
    throw error;
  }
}

/**
 * Chat completion with conversation history
 */
export async function chatCompletion(messages, options = {}) {
  const config = getAIConfig();
  const {
    model = config.model,
    temperature = config.temperature,
    stream = false,
  } = options;

  try {
    const response = await fetch(`${config.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        stream,
        options: { temperature },
      }),
      signal: AbortSignal.timeout(config.timeout),
    });

    if (!response.ok) {
      throw new Error(`Ollama chat error: ${response.status}`);
    }

    const data = await response.json();
    return {
      message: data.message,
      model: data.model,
    };
  } catch (error) {
    console.error('Chat completion error:', error);
    throw error;
  }
}

// =============================================================================
// CLINICAL PROMPTS - Chiropractic-specific system prompts
// =============================================================================

export const CLINICAL_PROMPTS = {
  // System prompt for clinical note generation
  clinicalSystem: `You are a clinical documentation assistant for a chiropractic practice.
Your role is to help generate professional, accurate SOAP notes.
- Use clinical terminology appropriate for chiropractic care
- Be concise but thorough
- Never make up symptoms or findings not provided
- Format output clearly with proper medical abbreviations
- Support both English and Norwegian documentation`,

  // Intake to Subjective conversion
  intakeToSubjective: {
    en: `Convert this patient intake form data into a professional Subjective narrative for a SOAP note.
Write in third person ("Patient reports..."). Include:
- Chief complaint with severity rating
- Onset and duration
- Quality and character of symptoms
- Aggravating and relieving factors
- Impact on daily activities

Intake Data:
{intakeData}

Generate the Subjective section:`,
    no: `Konverter disse pasientopptaksdataene til en profesjonell Subjektiv narrativ for en SOAP-notat.
Skriv i tredje person ("Pasienten rapporterer..."). Inkluder:
- Hovedklage med alvorlighetsgrad
- Debut og varighet
- Kvalitet og karakter av symptomer
- Forverrende og lindrende faktorer
- Påvirkning på daglige aktiviteter

Opptaksdata:
{intakeData}

Generer den Subjektive seksjonen:`,
  },

  // Transcription to SOAP structure
  transcriptionToSOAP: {
    en: `Parse this clinical encounter transcription into structured SOAP note sections.
Extract relevant information for each section:

S (Subjective): Patient's reported symptoms, history, concerns
O (Objective): Examination findings, measurements, observations
A (Assessment): Clinical impression, diagnosis considerations
P (Plan): Treatment performed, recommendations, follow-up

Transcription:
{transcription}

Output as JSON with keys: subjective, objective, assessment, plan`,
    no: `Parser denne kliniske konsultasjonstranskripsjonen til strukturerte SOAP-notat seksjoner.
Trekk ut relevant informasjon for hver seksjon:

S (Subjektivt): Pasientens rapporterte symptomer, historie, bekymringer
O (Objektivt): Undersøkelsesfunn, målinger, observasjoner
A (Vurdering): Klinisk inntrykk, diagnosevurderinger
P (Plan): Utført behandling, anbefalinger, oppfølging

Transkripsjon:
{transcription}

Output som JSON med nøkler: subjective, objective, assessment, plan`,
  },

  // Findings to narrative
  findingsToNarrative: {
    en: `Convert these clinical findings into professional narrative sentences:

Findings:
{findings}

Write in complete sentences using proper medical terminology.`,
    no: `Konverter disse kliniske funnene til profesjonelle narrative setninger:

Funn:
{findings}

Skriv i fullstendige setninger med riktig medisinsk terminologi.`,
  },

  // Compliance check prompt
  complianceCheck: {
    en: `Review this clinical note for documentation compliance:

Note:
{note}

Check for:
1. Diagnosis codes match treatment performed
2. Time requirements documented for timed procedures
3. Objective findings support subjective complaints
4. Treatment plan includes frequency and duration

List any compliance issues found.`,
    no: `Gjennomgå dette kliniske notatet for dokumentasjonsoverholdelse:

Notat:
{note}

Sjekk for:
1. Diagnosekoder matcher utført behandling
2. Tidskrav dokumentert for tidsbestemte prosedyrer
3. Objektive funn støtter subjektive klager
4. Behandlingsplan inkluderer frekvens og varighet

List eventuelle overholdelsesproblem funnet.`,
  },
};

// =============================================================================
// INTAKE PARSER - Convert intake forms to Subjective narratives
// =============================================================================

/**
 * Parse intake form data into a Subjective narrative
 */
export async function parseIntakeToSubjective(intakeData, language = 'en') {
  const config = getAIConfig();
  const promptTemplate = CLINICAL_PROMPTS.intakeToSubjective[language] || CLINICAL_PROMPTS.intakeToSubjective.en;

  // Format intake data for the prompt
  const formattedIntake = formatIntakeData(intakeData, language);
  const prompt = promptTemplate.replace('{intakeData}', formattedIntake);

  try {
    const result = await generateText(prompt, {
      system: CLINICAL_PROMPTS.clinicalSystem,
      temperature: 0.3,
    });
    return {
      success: true,
      narrative: result.text.trim(),
      model: result.model,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      fallback: generateFallbackSubjective(intakeData, language),
    };
  }
}

/**
 * Format intake data object into readable text
 */
function formatIntakeData(data, language = 'en') {
  const labels = {
    en: {
      chiefComplaint: 'Chief Complaint',
      painLevel: 'Pain Level',
      onset: 'Onset',
      duration: 'Duration',
      painQuality: 'Pain Quality',
      aggravatingFactors: 'Aggravating Factors',
      relievingFactors: 'Relieving Factors',
      location: 'Location',
      radiation: 'Radiation',
      previousTreatment: 'Previous Treatment',
      medicalHistory: 'Medical History',
      medications: 'Current Medications',
      goals: 'Patient Goals',
    },
    no: {
      chiefComplaint: 'Hovedklage',
      painLevel: 'Smertenivå',
      onset: 'Debut',
      duration: 'Varighet',
      painQuality: 'Smertekvalitet',
      aggravatingFactors: 'Forverrende faktorer',
      relievingFactors: 'Lindrende faktorer',
      location: 'Lokalisering',
      radiation: 'Utstråling',
      previousTreatment: 'Tidligere behandling',
      medicalHistory: 'Sykehistorie',
      medications: 'Nåværende medisiner',
      goals: 'Pasientens mål',
    },
  };

  const l = labels[language] || labels.en;
  const lines = [];

  if (data.chiefComplaint) lines.push(`${l.chiefComplaint}: ${data.chiefComplaint}`);
  if (data.painLevel) lines.push(`${l.painLevel}: ${data.painLevel}/10`);
  if (data.onset) lines.push(`${l.onset}: ${data.onset}`);
  if (data.duration) lines.push(`${l.duration}: ${data.duration}`);
  if (data.painQuality?.length) lines.push(`${l.painQuality}: ${data.painQuality.join(', ')}`);
  if (data.location?.length) lines.push(`${l.location}: ${data.location.join(', ')}`);
  if (data.radiation) lines.push(`${l.radiation}: ${data.radiation}`);
  if (data.aggravatingFactors?.length) lines.push(`${l.aggravatingFactors}: ${data.aggravatingFactors.join(', ')}`);
  if (data.relievingFactors?.length) lines.push(`${l.relievingFactors}: ${data.relievingFactors.join(', ')}`);
  if (data.previousTreatment) lines.push(`${l.previousTreatment}: ${data.previousTreatment}`);
  if (data.medicalHistory) lines.push(`${l.medicalHistory}: ${data.medicalHistory}`);
  if (data.medications) lines.push(`${l.medications}: ${data.medications}`);
  if (data.goals) lines.push(`${l.goals}: ${data.goals}`);

  return lines.join('\n');
}

/**
 * Fallback subjective generation when AI is unavailable
 */
function generateFallbackSubjective(data, language = 'en') {
  const templates = {
    en: {
      presents: 'Patient presents today with',
      rated: 'rated',
      outOf: 'out of 10',
      onset: 'Onset was',
      quality: 'Patient describes the pain as',
      location: 'located in the',
      aggravated: 'Symptoms are aggravated by',
      relieved: 'and relieved by',
    },
    no: {
      presents: 'Pasienten presenterer i dag med',
      rated: 'vurdert til',
      outOf: 'av 10',
      onset: 'Debut var',
      quality: 'Pasienten beskriver smerten som',
      location: 'lokalisert i',
      aggravated: 'Symptomene forverres av',
      relieved: 'og lindres av',
    },
  };

  const t = templates[language] || templates.en;
  const parts = [];

  if (data.chiefComplaint) {
    let complaint = `${t.presents} ${data.chiefComplaint}`;
    if (data.painLevel) complaint += ` ${t.rated} ${data.painLevel} ${t.outOf}`;
    parts.push(complaint + '.');
  }

  if (data.onset) parts.push(`${t.onset} ${data.onset}.`);

  if (data.painQuality?.length) {
    parts.push(`${t.quality} ${data.painQuality.join(', ')}.`);
  }

  if (data.location?.length) {
    parts.push(`Pain is ${t.location} ${data.location.join(', ')}.`);
  }

  if (data.aggravatingFactors?.length || data.relievingFactors?.length) {
    let factors = '';
    if (data.aggravatingFactors?.length) {
      factors += `${t.aggravated} ${data.aggravatingFactors.join(', ')}`;
    }
    if (data.relievingFactors?.length) {
      factors += ` ${t.relieved} ${data.relievingFactors.join(', ')}`;
    }
    parts.push(factors + '.');
  }

  return parts.join(' ');
}

// =============================================================================
// TRANSCRIPTION PARSER - Convert voice/audio to structured notes
// =============================================================================

/**
 * Parse transcription text into SOAP structure
 */
export async function parseTranscriptionToSOAP(transcription, language = 'en') {
  const config = getAIConfig();
  const promptTemplate = CLINICAL_PROMPTS.transcriptionToSOAP[language] || CLINICAL_PROMPTS.transcriptionToSOAP.en;
  const prompt = promptTemplate.replace('{transcription}', transcription);

  try {
    const result = await generateText(prompt, {
      system: CLINICAL_PROMPTS.clinicalSystem,
      temperature: 0.2, // Lower for structured output
    });

    // Try to parse JSON from response
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        success: true,
        sections: parsed,
        model: result.model,
      };
    }

    // Fallback: return raw text
    return {
      success: true,
      sections: { raw: result.text },
      model: result.model,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// =============================================================================
// FINDINGS TO NARRATIVE - Convert checkboxes to sentences
// =============================================================================

/**
 * Convert objective findings to narrative text
 */
export async function convertFindingsToNarrative(findings, language = 'en') {
  const promptTemplate = CLINICAL_PROMPTS.findingsToNarrative[language] || CLINICAL_PROMPTS.findingsToNarrative.en;

  const formattedFindings = Object.entries(findings)
    .filter(([_, value]) => value && (Array.isArray(value) ? value.length > 0 : true))
    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
    .join('\n');

  const prompt = promptTemplate.replace('{findings}', formattedFindings);

  try {
    const result = await generateText(prompt, {
      system: CLINICAL_PROMPTS.clinicalSystem,
      temperature: 0.3,
    });
    return {
      success: true,
      narrative: result.text.trim(),
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// =============================================================================
// WHISPER INTEGRATION - Local speech-to-text
// =============================================================================

/**
 * Transcribe audio using local Whisper (via Ollama or standalone)
 * Note: This requires Whisper to be set up locally
 */
export async function transcribeAudio(audioBlob, options = {}) {
  const config = getAIConfig();
  const { language = 'en' } = options;

  // Check for Web Speech API as fallback
  if (!window.webkitSpeechRecognition && !window.SpeechRecognition) {
    return {
      success: false,
      error: 'Speech recognition not supported in this browser',
    };
  }

  // For now, return instructions for Whisper setup
  // Full implementation would require a local Whisper endpoint
  return {
    success: false,
    error: 'Local Whisper transcription requires additional setup',
    setupInstructions: `
To enable local transcription:
1. Install Whisper: pip install openai-whisper
2. Run the Whisper server: whisper-server --model ${config.whisperModel}
3. Or use the browser's built-in speech recognition (limited)
    `,
  };
}

/**
 * Use browser's built-in speech recognition (fallback)
 */
export function createSpeechRecognition(options = {}) {
  const {
    language = 'en-US',
    continuous = true,
    interimResults = true,
    onResult,
    onError,
    onEnd,
  } = options;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = continuous;
  recognition.interimResults = interimResults;
  recognition.lang = language === 'no' ? 'nb-NO' : 'en-US';

  if (onResult) recognition.onresult = onResult;
  if (onError) recognition.onerror = onError;
  if (onEnd) recognition.onend = onEnd;

  return recognition;
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  // Configuration
  getAIConfig,
  saveAIConfig,
  checkOllamaStatus,
  listModels,

  // Generation
  generateText,
  chatCompletion,

  // Clinical functions
  parseIntakeToSubjective,
  parseTranscriptionToSOAP,
  convertFindingsToNarrative,

  // Speech
  transcribeAudio,
  createSpeechRecognition,

  // Prompts
  CLINICAL_PROMPTS,
};
