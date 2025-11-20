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
    const suggestion = await generateCompletion(prompt, systemPrompt, { maxTokens: 400, temperature = 0.8 });

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
 * Organize and structure old journal notes using AI with actionable items extraction
 * Converts unstructured text into structured clinical data + SOAP format + tasks
 */
export const organizeOldJournalNotes = async (noteContent, patientContext = {}) => {
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
      temperature: 0.4 // Lower temperature for more consistent structured output
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
      provider: AI_PROVIDER
    };

  } catch (error) {
    logger.error('Organize old journal notes error:', error);
    return {
      success: false,
      error: error.message,
      organizedData: null
    };
  }
};

/**
 * Batch organize multiple old journal notes
 * Useful for importing multiple notes at once
 */
export const organizeMultipleNotes = async (notes, patientContext = {}) => {
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
      temperature: 0.5
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
      }
    };
  } catch (error) {
    logger.error('Merge organized notes error:', error);
    return {
      success: false,
      error: error.message
    };
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
  organizeOldJournalNotes,
  organizeMultipleNotes,
  mergeOrganizedNotes,
  getAIStatus
};
