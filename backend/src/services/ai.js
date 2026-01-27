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
const AI_MODEL = process.env.AI_MODEL || 'chiro-no'; // Default: chiro-no (Mistral 7B fine-tuned)
const AI_ENABLED = process.env.AI_ENABLED !== 'false'; // Default: true unless explicitly disabled

/**
 * Task-based model routing
 * Routes different clinical tasks to the most appropriate specialized model
 */
const MODEL_ROUTING = {
  // chiro-no (Mistral 7B) - Primary clinical model for structured documentation
  'soap_notes': 'chiro-no',
  'clinical_summary': 'chiro-no',
  'journal_organization': 'chiro-no',
  'diagnosis_suggestion': 'chiro-no',
  'sick_leave': 'chiro-no',

  // chiro-fast (Llama 3.2 3B) - Fast autocomplete and short suggestions
  'autocomplete': 'chiro-fast',
  'spell_check': 'chiro-fast',
  'abbreviation': 'chiro-fast',
  'quick_suggestion': 'chiro-fast',

  // chiro-norwegian (Viking 7B) - Norwegian language specialist
  'norwegian_text': 'chiro-norwegian',
  'patient_communication': 'chiro-norwegian',
  'referral_letter': 'chiro-norwegian',
  'report_writing': 'chiro-norwegian',

  // chiro-medical (MedGemma 4B) - Clinical reasoning and safety
  'red_flag_analysis': 'chiro-medical',
  'differential_diagnosis': 'chiro-medical',
  'treatment_safety': 'chiro-medical',
  'clinical_reasoning': 'chiro-medical',
  'medication_interaction': 'chiro-medical',
};

/**
 * Get the appropriate model for a given task type
 * Falls back to AI_MODEL env var or chiro-no if task not mapped
 */
const getModelForTask = (taskType) => {
  return MODEL_ROUTING[taskType] || AI_MODEL;
};

/**
 * Check if AI is available and enabled
 */
const isAIAvailable = () => {
  return AI_ENABLED;
};

/**
 * Generate AI completion using selected provider
 */
const generateCompletion = async (prompt, systemPrompt = null, options = {}) => {
  const { maxTokens = 500, temperature = 0.7, taskType = null } = options;
  const model = taskType ? getModelForTask(taskType) : AI_MODEL;

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
      // Use Ollama (local) with task-routed model
      const response = await axios.post(
        `${OLLAMA_BASE_URL}/api/generate`,
        {
          model,
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
  // Return fallback if AI is disabled
  if (!isAIAvailable()) {
    return { original: text, corrected: text, hasChanges: false, aiAvailable: false };
  }

  const systemPrompt = `Du er en norsk språkassistent som er spesialisert på kiropraktisk medisinsk terminologi.
Korriger stavefeil og grammatiske feil i den følgende kliniske teksten.
Behold alle medisinske fagtermer. Svar kun med den korrigerte teksten uten forklaringer.`;

  const prompt = `Korriger følgende tekst:\n\n${text}`;

  try {
    const correctedText = await generateCompletion(prompt, systemPrompt, { maxTokens: 1000, temperature: 0.3, taskType: 'spell_check' });

    return {
      original: text,
      corrected: correctedText.trim(),
      hasChanges: text.trim() !== correctedText.trim(),
      aiAvailable: true
    };
  } catch (error) {
    logger.error('Spell check error:', error);
    return { original: text, corrected: text, hasChanges: false, aiAvailable: false, error: error.message };
  }
};

/**
 * Generate SOAP note suggestions based on symptoms
 */
export const generateSOAPSuggestions = async (chiefComplaint, section = 'subjective') => {
  // Return fallback if AI is disabled
  if (!isAIAvailable()) {
    return { section, chiefComplaint, suggestion: '', aiAvailable: false };
  }

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
      return { section, chiefComplaint, suggestion: '', error: 'Invalid section', aiAvailable: false };
  }

  try {
    const suggestion = await generateCompletion(prompt, systemPrompt, { maxTokens: 400, temperature: 0.8, taskType: 'soap_notes' });

    return {
      section,
      chiefComplaint,
      suggestion: suggestion.trim(),
      aiAvailable: true
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
  // Return fallback if AI is disabled
  if (!isAIAvailable()) {
    return { suggestion: '', codes: [], reasoning: '', aiAvailable: false };
  }

  const { subjective, objective, assessment } = soapData;

  // Get common chiropractic ICPC-2 codes from database
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
    return { suggestion: '', codes: [], reasoning: '', aiAvailable: false, error: 'Database unavailable' };
  }

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
    const suggestion = await generateCompletion(prompt, systemPrompt, { maxTokens: 300, temperature: 0.5, taskType: 'diagnosis_suggestion' });

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
      reasoning: suggestion,
      aiAvailable: true
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
  // First, use rule-based clinical validation for deterministic checks
  const clinicalContent = [
    soapData.subjective?.chief_complaint || '',
    soapData.subjective?.history || '',
    soapData.objective?.observation || '',
    soapData.objective?.ortho_tests || '',
    soapData.assessment?.clinical_reasoning || ''
  ].join(' ');

  // Rule-based red flag detection (works without AI)
  let redFlagsDetected = [];
  let medicationWarnings = [];
  try {
    redFlagsDetected = checkRedFlagsInContent(clinicalContent);
    medicationWarnings = checkMedicationWarnings(patientData.current_medications || []);
  } catch (error) {
    logger.error('Rule-based red flag check error:', error);
  }

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
      source: 'clinical_validation',
      aiAvailable: isAIAvailable()
    };
  }

  // If AI is disabled, return rule-based results only
  if (!isAIAvailable()) {
    return {
      analysis: redFlagsDetected.length > 0
        ? `Automatisk oppdagede røde flagg: ${redFlagsDetected.map(f => f.message).join('; ')}`
        : 'AI-analyse deaktivert. Regelbasert sjekk fullført.',
      riskLevel: validationResult.riskLevel,
      canTreat: !validationResult.hasRedFlags,
      recommendReferral: validationResult.requiresReview,
      detectedFlags: redFlagsDetected,
      medicationWarnings,
      confidence: validationResult.confidence,
      source: 'clinical_validation_only',
      aiAvailable: false
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
    const analysis = await generateCompletion(prompt, systemPrompt, { maxTokens: 400, temperature: 0.4, taskType: 'red_flag_analysis' });

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
      source: 'combined',
      aiAvailable: true
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
      aiAvailable: false,
      error: error.message
    };
  }
};

/**
 * Generate clinical summary from encounter
 */
export const generateClinicalSummary = async (encounter) => {
  // Return fallback if AI is disabled
  if (!isAIAvailable()) {
    return { summary: '', encounterId: encounter.id, aiAvailable: false };
  }

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
    const summary = await generateCompletion(prompt, systemPrompt, { maxTokens: 200, temperature: 0.6, taskType: 'clinical_summary' });

    return {
      summary: summary.trim(),
      encounterId: encounter.id,
      aiAvailable: true
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
 * Organize and structure old journal notes using AI with actionable items extraction
 * Converts unstructured text into structured clinical data + SOAP format + tasks
 */
export const organizeOldJournalNotes = async (noteContent, patientContext = {}) => {
  // Return fallback if AI is disabled
  if (!isAIAvailable()) {
    return {
      success: false,
      organizedData: null,
      aiAvailable: false,
      error: 'AI is disabled'
    };
  }

  const systemPrompt = `Du er en erfaren kiropraktor-assistent som er ekspert på å organisere og strukturere gamle journalnotater.

Din oppgave er å analysere ustrukturerte journalnotater og strukturere dem i et klinisk format MED utdrag av HANDLINGSOPPGAVER.

STEG 1: Analyser og ekstraher informasjon
- Identifiser datoer (konsultasjonsdato, symptomstart, etc.)
- Ekstraher symptomer, plager og sykehistorie
- Finn objektive funn, undersøkelser og tester
- Identifiser diagnoser (ICPC-2/ICD-10 koder hvis nevnt)
- Ekstraher behandling og tiltak
- Finn oppfølging og plan

STEG 2: Ekstraher HANDLINGSOPPGAVER (VIKTIG!)
Identifiser alle oppgaver som må følges opp:
- Oppfølgingsavtaler som skal bookes
- Telefonsamtaler som må gjøres
- Brev/epikrise som skal sendes
- Resepter som skal fornyes
- Henvisninger som trengs
- Prøvesvar som må følges opp
- Påminnelser til pasient

For hver oppgave, identifiser:
- Type (FOLLOW_UP, CALL_PATIENT, SEND_NOTE, PRESCRIPTION, REFERRAL, TEST_RESULT, REMINDER)
- Tittel og beskrivelse
- Tidsfrist hvis nevnt
- Prioritet (LOW, MEDIUM, HIGH, URGENT)
- Original tekst fra notatet

STEG 3: Ekstraher KOMMUNIKASJONSHISTORIKK
Finn tidligere kommunikasjon nevnt i notatet:
- Telefonsamtaler (dato, innhold)
- SMS/e-poster sendt/mottatt
- Brev/epikriser sendt
- Personlig kontakt

STEG 4: Organiser i SOAP-format
[samme som før]

STEG 5: Identifiser MANGLENDE INFORMASJON
Hva mangler for fullstendig klinisk dokumentasjon?

Svar i JSON-format:
{
  "structured_data": {
    "dates": ["YYYY-MM-DD"],
    "chief_complaints": ["..."],
    "symptoms": ["..."],
    "findings": ["..."],
    "diagnoses": ["..."],
    "treatments": ["..."],
    "follow_up": "..."
  },
  "soap": {
    "subjective": {
      "chief_complaint": "...",
      "history": "...",
      "aggravating_factors": "...",
      "relieving_factors": "..."
    },
    "objective": {
      "observation": "...",
      "palpation": "...",
      "rom": "...",
      "ortho_tests": "...",
      "measurements": {}
    },
    "assessment": {
      "clinical_reasoning": "...",
      "differential_diagnoses": ["..."],
      "prognosis": "..."
    },
    "plan": {
      "treatment": "...",
      "home_exercises": "...",
      "advice": "...",
      "follow_up": "..."
    }
  },
  "actionable_items": [
    {
      "type": "FOLLOW_UP",
      "title": "Book oppfølging om 2 uker",
      "description": "Pasient skal komme tilbake for kontroll",
      "due_date": "YYYY-MM-DD",
      "priority": "MEDIUM",
      "original_text": "Kommer tilbake om 2 uker for kontroll"
    },
    {
      "type": "CALL_PATIENT",
      "title": "Ring pasient for sjekk",
      "description": "Følge opp hvordan det går etter behandling",
      "due_date": "YYYY-MM-DD",
      "priority": "LOW",
      "original_text": "Skal ringes om 1 uke"
    }
  ],
  "communication_history": [
    {
      "type": "PHONE_CALL",
      "date": "YYYY-MM-DD",
      "direction": "OUTGOING",
      "subject": "Oppfølging",
      "content": "Ringte pasient ang. viderehenvising",
      "original_text": "Ringte pasient 12.01"
    }
  ],
  "missing_information": [
    {
      "field": "diagnosis_code",
      "importance": "HIGH",
      "can_be_inferred": true
    }
  ],
  "tags": ["urgent", "referral_needed", "requires_callback"],
  "suggested_encounter_type": "FOLLOWUP",
  "suggested_date": "YYYY-MM-DD",
  "confidence_score": 0.85,
  "notes": "Eventuelle merknader om noteringen"
}`;

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
    const response = await generateCompletion(prompt, systemPrompt, {
      maxTokens: 2000,
      temperature: 0.4, // Lower temperature for more consistent structured output
      taskType: 'journal_organization'
    });

    // Parse JSON response
    let organizedData;
    try {
      // Try to extract JSON from response (sometimes wrapped in markdown code blocks)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        organizedData = JSON.parse(jsonMatch[0]);
      } else {
        organizedData = JSON.parse(response);
      }
    } catch (parseError) {
      logger.error('JSON parse error in organizeOldJournalNotes:', parseError);
      // Return fallback structure with raw text
      organizedData = {
        structured_data: {
          raw_content: noteContent,
          parsing_error: true
        },
        soap: {
          subjective: { chief_complaint: noteContent.substring(0, 500) },
          objective: {},
          assessment: {},
          plan: {}
        },
        actionable_items: [],
        communication_history: [],
        missing_information: [],
        tags: [],
        confidence_score: 0.3,
        notes: 'Kunne ikke fullstendig strukturere notatet automatisk. Manuell gjennomgang anbefales.'
      };
    }

    return {
      success: true,
      organizedData,
      rawResponse: response,
      model: AI_MODEL,
      provider: AI_PROVIDER,
      aiAvailable: true
    };

  } catch (error) {
    logger.error('Organize old journal notes error:', error);
    return {
      success: false,
      error: error.message,
      organizedData: null,
      aiAvailable: false
    };
  }
};

/**
 * Batch organize multiple old journal notes
 * Useful for importing multiple notes at once
 */
export const organizeMultipleNotes = async (notes, patientContext = {}) => {
  // Return fallback if AI is disabled
  if (!isAIAvailable()) {
    return {
      totalNotes: notes.length,
      successfullyProcessed: 0,
      results: notes.map(note => ({
        noteId: note.id || null,
        filename: note.filename || null,
        success: false,
        error: 'AI is disabled'
      })),
      aiAvailable: false
    };
  }

  const results = [];

  for (const note of notes) {
    try {
      const result = await organizeOldJournalNotes(note.content, patientContext);
      results.push({
        noteId: note.id || null,
        filename: note.filename || null,
        ...result
      });

      // Add small delay to avoid overwhelming the AI service
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      results.push({
        noteId: note.id || null,
        filename: note.filename || null,
        success: false,
        error: error.message
      });
    }
  }

  return {
    totalNotes: notes.length,
    successfullyProcessed: results.filter(r => r.success).length,
    results
  };
};

/**
 * Refine and merge multiple organized notes into a single comprehensive entry
 * Useful when a patient has multiple old notes that should be consolidated
 */
export const mergeOrganizedNotes = async (organizedNotes, patientContext = {}) => {
  // Return fallback if AI is disabled
  if (!isAIAvailable()) {
    return {
      success: false,
      mergedNote: '',
      sourceNotesCount: organizedNotes.length,
      aiAvailable: false,
      error: 'AI is disabled'
    };
  }

  const systemPrompt = `Du er en erfaren kiropraktor-assistent. Din oppgave er å samle og konsolidere flere journalnotater til én omfattende, kronologisk journalpost.

Prinsipper:
- Behold all viktig klinisk informasjon
- Organiser kronologisk (eldst først)
- Identifiser utviklingstrender (bedring/forverring)
- Fjern duplikater
- Lag et samlet klinisk bilde

Svar i SOAP-format på norsk, med tydelig tidslinje.`;

  const notesText = organizedNotes.map((note, index) =>
    `=== Notat ${index + 1} (${note.suggested_date || 'ukjent dato'}) ===\n${JSON.stringify(note.soap, null, 2)}`
  ).join('\n\n');

  const prompt = `Pasientkontekst:
Navn: ${patientContext.first_name || ''} ${patientContext.last_name || ''}

Følgende notater skal konsolideres:
${notesText}

Lag ett samlet, kronologisk SOAP-notat som fanger hele pasienthistorikken.`;

  try {
    const merged = await generateCompletion(prompt, systemPrompt, {
      maxTokens: 2000,
      temperature: 0.5,
      taskType: 'clinical_summary'
    });

    return {
      success: true,
      mergedNote: merged.trim(),
      sourceNotesCount: organizedNotes.length,
      dateRange: {
        earliest: organizedNotes.reduce((min, n) =>
          !min || (n.suggested_date && n.suggested_date < min) ? n.suggested_date : min, null),
        latest: organizedNotes.reduce((max, n) =>
          !max || (n.suggested_date && n.suggested_date > max) ? n.suggested_date : max, null)
      },
      aiAvailable: true
    };
  } catch (error) {
    logger.error('Merge organized notes error:', error);
    return {
      success: false,
      error: error.message,
      aiAvailable: false
    };
  }
};

/**
 * Get AI service status
 */
export const getAIStatus = async () => {
  // If AI is disabled via env, return disabled status immediately
  if (!AI_ENABLED) {
    return {
      provider: AI_PROVIDER,
      available: false,
      enabled: false,
      model: AI_MODEL,
      message: 'AI is disabled via AI_ENABLED=false'
    };
  }

  const expectedModels = ['chiro-no', 'chiro-fast', 'chiro-norwegian', 'chiro-medical'];

  try {
    if (AI_PROVIDER === 'ollama') {
      const response = await axios.get(`${OLLAMA_BASE_URL}/api/tags`, { timeout: 5000 });
      const installedModels = response.data.models?.map(m => m.name) || [];
      const modelStatus = {};
      for (const name of expectedModels) {
        modelStatus[name] = installedModels.some(m => m.startsWith(name));
      }
      return {
        provider: 'ollama',
        available: true,
        enabled: true,
        defaultModel: AI_MODEL,
        routing: MODEL_ROUTING,
        models: installedModels,
        modelStatus
      };
    } else if (AI_PROVIDER === 'claude' && CLAUDE_API_KEY) {
      return {
        provider: 'claude',
        available: true,
        enabled: true,
        model: AI_MODEL,
        routing: MODEL_ROUTING
      };
    } else {
      return {
        provider: AI_PROVIDER,
        available: false,
        enabled: true,
        error: 'AI provider not configured'
      };
    }
  } catch (error) {
    return {
      provider: AI_PROVIDER,
      available: false,
      enabled: true,
      error: error.message
    };
  }
};

export { getModelForTask, MODEL_ROUTING };

export default {
  spellCheckNorwegian,
  generateSOAPSuggestions,
  suggestDiagnosisCodes,
  analyzeRedFlags,
  generateClinicalSummary,
  learnFromOutcome,
  organizeOldJournalNotes,
  organizeMultipleNotes,
  mergeOrganizedNotes,
  getAIStatus,
  getModelForTask,
  MODEL_ROUTING
};
