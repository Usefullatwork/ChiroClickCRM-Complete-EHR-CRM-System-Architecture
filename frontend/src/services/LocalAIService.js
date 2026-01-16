/**
 * LocalAIService - Integration with Local LLM
 *
 * Provides AI-powered suggestions for clinical documentation
 * using a locally running LLM (Ollama, text-generation-webui, or similar).
 *
 * Supports Norwegian chiropractic clinical documentation.
 */

// Default configuration - can be overridden via settings
const DEFAULT_CONFIG = {
  // Ollama default endpoint
  endpoint: 'http://localhost:11434/api/generate',

  // Alternative endpoints for different backends
  endpoints: {
    ollama: 'http://localhost:11434/api/generate',
    textGenWebUI: 'http://localhost:5000/api/v1/generate',
    openAICompatible: 'http://localhost:8080/v1/chat/completions'
  },

  // Models for different languages
  model: 'chiro-no', // Default Norwegian
  models: {
    no: 'chiro-no',  // Norwegian clinical model
    en: 'chiro-en'   // English clinical model
  },

  // Request timeout in milliseconds
  timeout: 30000,

  // Default temperature for clinical documentation (lower = more consistent)
  temperature: 0.3,

  // Max tokens for responses
  maxTokens: 500
};

// Communication tone system prompts
const TONE_PROMPTS = {
  direct: {
    no: `Du skriver korte, presise meldinger for en kiropraktorklinikk. Bruk direkte kommunikasjon.
Regler:
- Korte setninger
- Bare nødvendig informasjon
- Ingen unødvendige høflighetsfraser
- Klar handling/instruksjon
Eksempel: "Time i morgen kl 14:00. Avbud? Ring 12345678."`,

    en: `You write short, precise messages for a chiropractic clinic. Use direct communication.
Rules:
- Short sentences
- Only necessary information
- No unnecessary pleasantries
- Clear action/instruction
Example: "Appointment tomorrow at 2:00 PM. Cancel? Call 12345678."`
  },

  kind: {
    no: `Du skriver varme, vennlige meldinger for en kiropraktorklinikk. Bruk vennlig kommunikasjon.
Regler:
- Varm men effektiv
- Vis at du bryr deg
- Positive formuleringer
- Personlig touch uten å være påtrengende
Eksempel: "Hei! Vi gleder oss til å se deg i morgen kl 14:00. Ha en fin dag!"`,

    en: `You write warm, friendly messages for a chiropractic clinic. Use kind communication.
Rules:
- Warm but efficient
- Show you care
- Positive phrasing
- Personal touch without being intrusive
Example: "Hi! Looking forward to seeing you tomorrow at 2:00 PM. Have a great day!"`
  },

  professional: {
    no: `Du skriver formelle, profesjonelle meldinger for en kiropraktorklinikk. Bruk profesjonell kommunikasjon.
Regler:
- Formelt språk
- Klinisk korrekt
- Presis og informativ
- Saklig og respektfull
Eksempel: "Påminnelse: Din konsultasjon er planlagt til i morgen kl 14:00. Vennligst ankom 15 minutter før."`,

    en: `You write formal, professional messages for a chiropractic clinic. Use professional communication.
Rules:
- Formal language
- Clinically accurate
- Precise and informative
- Objective and respectful
Example: "Reminder: Your consultation is scheduled for tomorrow at 2:00 PM. Please arrive 15 minutes early."`
  },

  empathetic: {
    no: `Du skriver empatiske, støttende meldinger for en kiropraktorklinikk. Bruk empatisk kommunikasjon.
Regler:
- Vis forståelse
- Anerkjenn utfordringer
- Støttende tone
- Gi rom for at mottaker føler seg hørt
Eksempel: "Vi forstår at dette kan være vanskelig. Vi er her for deg når du er klar."`,

    en: `You write empathetic, supportive messages for a chiropractic clinic. Use empathetic communication.
Rules:
- Show understanding
- Acknowledge challenges
- Supportive tone
- Give space for recipient to feel heard
Example: "We understand this can be difficult. We are here for you when you are ready."`
  }
};

// Communication message types with context templates
const COMMUNICATION_TYPES = {
  appointment_reminder: {
    no: 'Skriv en påminnelse om time',
    en: 'Write an appointment reminder'
  },
  follow_up: {
    no: 'Skriv en oppfølgingsmelding etter behandling',
    en: 'Write a post-treatment follow-up message'
  },
  no_show: {
    no: 'Skriv en melding om uteblitt time',
    en: 'Write a no-show follow-up message'
  },
  recall: {
    no: 'Skriv en innkallingsmelding til inaktiv pasient',
    en: 'Write a recall message for inactive patient'
  },
  payment: {
    no: 'Skriv en betalingspåminnelse',
    en: 'Write a payment reminder'
  },
  welcome: {
    no: 'Skriv en velkomstmelding til ny pasient',
    en: 'Write a welcome message for new patient'
  },
  schedule_change: {
    no: 'Skriv en melding om endring av time',
    en: 'Write a schedule change notification'
  },
  birthday: {
    no: 'Skriv en bursdagshilsen',
    en: 'Write a birthday greeting'
  },
  feedback: {
    no: 'Skriv en forespørsel om tilbakemelding',
    en: 'Write a feedback request'
  },
  exercise_reminder: {
    no: 'Skriv en påminnelse om hjemmeøvelser',
    en: 'Write an exercise reminder'
  }
};

// Norwegian chiropractic system prompts
const SYSTEM_PROMPTS = {
  subjective: {
    en: `You are a clinical documentation assistant for a chiropractic EHR system.
Generate professional subjective (S) section content based on the provided patient information.
Use clear, concise clinical language. Include relevant history, symptoms, and patient complaints.
Format as proper clinical documentation.`,

    no: `Du er en klinisk dokumentasjonsassistent for et kiropraktor journalsystem.
Generer profesjonelt innhold til den subjektive (S) seksjonen basert på pasientinformasjonen.
Bruk klart, konsist klinisk språk. Inkluder relevant sykehistorie, symptomer og pasientens plager.
Formater som korrekt klinisk dokumentasjon.

Eksempel på god dokumentasjon:
"Pasienten presenterer seg med smerter i korsryggen som startet for 2 uker siden etter løfting.
Smertene er lokalisert i nedre del av ryggen med utstråling til høyre sete.
Symptomene forverres ved sitting og bøying, lindres ved gange.
Pasienten rapporterer smerte på 6/10 på VAS-skala."`
  },

  objective: {
    en: `You are a clinical documentation assistant for a chiropractic EHR system.
Generate professional objective (O) section content based on examination findings.
Include observation, palpation, ROM, orthopedic tests, and neurological findings as relevant.
Use proper clinical terminology and format as structured documentation.`,

    no: `Du er en klinisk dokumentasjonsassistent for et kiropraktor journalsystem.
Generer profesjonelt innhold til den objektive (O) seksjonen basert på undersøkelsesfunn.
Inkluder observasjon, palpasjon, bevegelsesutslag, ortopediske tester og nevrologiske funn.
Bruk korrekt klinisk terminologi og formater som strukturert dokumentasjon.

Eksempel på god dokumentasjon:
"Observasjon: Antalgisk holdning med liste mot venstre. Økt lumbal lordose.
Palpasjon: Ømhet og hypertoni over høyre erector spinae L4-S1. Triggerpunkter i gluteus medius.
AROM lumbal: Fleksjon 40° (redusert), ekstensjon 10° (smerte), lateralfleksjon 20° bilateralt.
Ortopediske tester: Kemp's test positiv høyre, SLR negativ bilateralt.
Nevrologisk: Reflekser normale, sensibilitet intakt, kraft 5/5 bilateral."`
  },

  assessment: {
    en: `You are a clinical documentation assistant for a chiropractic EHR system.
Generate professional assessment (A) section content including clinical reasoning and diagnosis.
Use ICPC-2 codes where appropriate. Include differential diagnoses if relevant.
Provide clear clinical impression and prognosis.`,

    no: `Du er en klinisk dokumentasjonsassistent for et kiropraktor journalsystem.
Generer profesjonelt innhold til vurderingsseksjonen (A) inkludert klinisk resonnement og diagnose.
Bruk ICPC-2 koder der det er relevant. Inkluder differensialdiagnoser hvis aktuelt.
Gi en klar klinisk vurdering og prognose.

Eksempel på god dokumentasjon:
"Klinisk vurdering: Funnene er konsistente med akutt mekanisk korsryggsyndrom (L84).
Palpasjonsfunn og bevegelsesrestriksjon tyder på segmentell dysfunksjon L4-L5.
Ingen tegn til nerverotaffeksjon. Røde flagg er vurdert og ikke til stede.
Prognose: God prognose med konservativ behandling over 2-4 uker."`
  },

  plan: {
    en: `You are a clinical documentation assistant for a chiropractic EHR system.
Generate professional plan (P) section content including treatment performed and recommendations.
Include treatment techniques, home exercises, ergonomic advice, and follow-up plans.
Be specific about treatment details and patient instructions.`,

    no: `Du er en klinisk dokumentasjonsassistent for et kiropraktor journalsystem.
Generer profesjonelt innhold til planseksjonen (P) inkludert utført behandling og anbefalinger.
Inkluder behandlingsteknikker, hjemmeøvelser, ergonomiske råd og oppfølgingsplan.
Vær spesifikk om behandlingsdetaljer og pasientinstruksjoner.

Eksempel på god dokumentasjon:
"Behandling utført: Leddmobilisering L4-L5, myofascial release på høyre erector spinae,
triggerpunktbehandling gluteus medius. God respons på behandling.
Hjemmeøvelser: Instruert i McKenzie-øvelser (ekstensjon i liggende) x10 hver time.
Råd: Unngå langvarig sitting, bruk lendestøtte, gå korte turer flere ganger daglig.
Oppfølging: Neste time om 3 dager. Forventet 3-4 behandlinger totalt."`
  },

  vestibular: {
    en: `You are a clinical documentation assistant specializing in vestibular assessment.
Generate professional documentation for VNG/vestibular testing findings.
Include interpretation of nystagmus patterns, balance tests, and clinical significance.`,

    no: `Du er en klinisk dokumentasjonsassistent spesialisert på vestibulær vurdering.
Generer profesjonell dokumentasjon for VNG/vestibulære testfunn.
Inkluder tolkning av nystagmusmønstre, balansetester og klinisk betydning.

Eksempel på god dokumentasjon:
"VNG-undersøkelse: Spontan nystagmus negativ. Blikktest normal i alle retninger.
Dix-Hallpike positiv høyre side med oppslående, torsjonell nystagmus med latens 3 sek.
Cerebellum-tester normale. VOR-HIT test normal bilateralt.
Konklusjon: Funnene er konsistente med BPPV i høyre bakre buegang (kanalolithiasis).
Behandling: Epley-manøver utført med god effekt. Kontroll om 1 uke."`
  }
};

class LocalAIService {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.isAvailable = false;
    this.lastError = null;
  }

  /**
   * Check if the local LLM is available
   */
  async checkAvailability() {
    try {
      // Try Ollama first
      const response = await fetch('http://localhost:11434/api/tags', {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        const data = await response.json();
        this.isAvailable = true;
        this.config.endpoint = DEFAULT_CONFIG.endpoints.ollama;
        console.log('Local AI: Connected to Ollama', data.models?.length, 'models available');
        return { available: true, backend: 'ollama', models: data.models };
      }
    } catch (e) {
      // Try text-generation-webui
      try {
        const response = await fetch('http://localhost:5000/api/v1/model', {
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        });

        if (response.ok) {
          this.isAvailable = true;
          this.config.endpoint = DEFAULT_CONFIG.endpoints.textGenWebUI;
          console.log('Local AI: Connected to text-generation-webui');
          return { available: true, backend: 'textGenWebUI' };
        }
      } catch (e2) {
        // Not available
      }
    }

    this.isAvailable = false;
    this.lastError = 'No local LLM found. Make sure Ollama or similar is running.';
    return { available: false, error: this.lastError };
  }

  /**
   * Generate text completion
   */
  async generate(prompt, options = {}) {
    if (!this.isAvailable) {
      await this.checkAvailability();
      if (!this.isAvailable) {
        throw new Error(this.lastError || 'Local AI not available');
      }
    }

    const {
      model = this.config.model,
      temperature = this.config.temperature,
      maxTokens = this.config.maxTokens,
      systemPrompt = ''
    } = options;

    try {
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt: systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt,
          stream: false,
          options: {
            temperature,
            num_predict: maxTokens
          }
        }),
        signal: AbortSignal.timeout(this.config.timeout)
      });

      if (!response.ok) {
        throw new Error(`AI request failed: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        text: data.response || data.generated_text || '',
        model: data.model || model,
        tokensUsed: data.eval_count || 0
      };
    } catch (error) {
      this.lastError = error.message;
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate SOAP section suggestions
   */
  async generateSOAPSuggestion(section, context, language = 'no') {
    const systemPrompt = SYSTEM_PROMPTS[section]?.[language] || SYSTEM_PROMPTS[section]?.en || '';

    // Select the appropriate model for the language
    const model = this.config.models?.[language] || this.config.model;

    const prompt = language === 'no'
      ? `Basert på følgende informasjon, generer dokumentasjon for ${section}-seksjonen:\n\n${context}`
      : `Based on the following information, generate documentation for the ${section} section:\n\n${context}`;

    return this.generate(prompt, { systemPrompt, model });
  }

  /**
   * Improve/expand existing text
   */
  async improveText(text, language = 'no') {
    const model = this.config.models?.[language] || this.config.model;
    const systemPrompt = language === 'no'
      ? `Du er en klinisk dokumentasjonsassistent. Forbedre og utvid følgende tekst til profesjonell klinisk dokumentasjon. Behold all faktisk informasjon, men gjør språket mer profesjonelt og fullstendig.`
      : `You are a clinical documentation assistant. Improve and expand the following text into professional clinical documentation. Keep all factual information but make the language more professional and complete.`;

    return this.generate(text, { systemPrompt, temperature: 0.2, model });
  }

  /**
   * Generate differential diagnoses
   */
  async generateDifferentials(findings, language = 'no') {
    const model = this.config.models?.[language] || this.config.model;
    const systemPrompt = language === 'no'
      ? `Du er en klinisk dokumentasjonsassistent for kiropraktorer. Basert på kliniske funn, foreslå differensialdiagnoser med ICPC-2 koder. List de mest sannsynlige diagnosene først.`
      : `You are a clinical documentation assistant for chiropractors. Based on clinical findings, suggest differential diagnoses with ICPC-2 codes. List the most likely diagnoses first.`;

    const prompt = language === 'no'
      ? `Kliniske funn:\n${findings}\n\nForeslå relevante differensialdiagnoser:`
      : `Clinical findings:\n${findings}\n\nSuggest relevant differential diagnoses:`;

    return this.generate(prompt, { systemPrompt, model });
  }

  /**
   * Generate VNG interpretation
   */
  async generateVNGInterpretation(vngData, language = 'no') {
    const model = this.config.models?.[language] || this.config.model;
    const systemPrompt = SYSTEM_PROMPTS.vestibular[language] || SYSTEM_PROMPTS.vestibular.en;

    const dataDescription = Object.entries(vngData)
      .filter(([key, value]) => value && typeof value === 'object')
      .map(([key, value]) => {
        const abnormal = Object.entries(value)
          .filter(([k, v]) => v === 'abnormal')
          .map(([k]) => k);
        return abnormal.length > 0 ? `${key}: avvik i ${abnormal.join(', ')}` : `${key}: normal`;
      })
      .join('\n');

    const prompt = language === 'no'
      ? `VNG-funn:\n${dataDescription}\n\nGenerer klinisk tolkning:`
      : `VNG findings:\n${dataDescription}\n\nGenerate clinical interpretation:`;

    return this.generate(prompt, { systemPrompt, model });
  }

  /**
   * Autocomplete partial text
   */
  async autocomplete(partialText, section, language = 'no') {
    const model = this.config.models?.[language] || this.config.model;
    const systemPrompt = language === 'no'
      ? `Fullfør følgende kliniske dokumentasjon. Skriv kun fortsettelsen, ikke gjenta det som allerede er skrevet.`
      : `Complete the following clinical documentation. Only write the continuation, do not repeat what has already been written.`;

    return this.generate(partialText, {
      systemPrompt,
      temperature: 0.4,
      maxTokens: 200,
      model
    });
  }

  /**
   * Generate communication message with specific tone
   * @param {string} messageType - Type of message (appointment_reminder, follow_up, etc.)
   * @param {object} context - Context data (patient info, appointment details, etc.)
   * @param {string} tone - Communication tone (direct, kind, professional, empathetic)
   * @param {string} language - Language code ('no' or 'en')
   * @param {string} format - Format type ('sms' or 'email')
   */
  async generateCommunication(messageType, context = {}, tone = 'direct', language = 'no', format = 'sms') {
    const model = this.config.models?.[language] || this.config.model;

    // Get tone-specific system prompt
    const tonePrompt = TONE_PROMPTS[tone]?.[language] || TONE_PROMPTS.direct[language];

    // Get message type description
    const typeDesc = COMMUNICATION_TYPES[messageType]?.[language] || messageType;

    // Build context string from provided data
    const contextParts = [];
    if (context.patientName) contextParts.push(`Pasient: ${context.patientName}`);
    if (context.appointmentDate) contextParts.push(`Dato: ${context.appointmentDate}`);
    if (context.appointmentTime) contextParts.push(`Tid: ${context.appointmentTime}`);
    if (context.providerName) contextParts.push(`Behandler: ${context.providerName}`);
    if (context.clinicName) contextParts.push(`Klinikk: ${context.clinicName}`);
    if (context.clinicPhone) contextParts.push(`Telefon: ${context.clinicPhone}`);
    if (context.amount) contextParts.push(`Beløp: ${context.amount}`);
    if (context.customContext) contextParts.push(context.customContext);

    const contextStr = contextParts.length > 0 ? contextParts.join('\n') : '';

    // Format-specific instructions
    const formatInstruction = format === 'sms'
      ? language === 'no'
        ? 'Skriv en kort SMS (maks 160 tegn hvis mulig).'
        : 'Write a short SMS (max 160 characters if possible).'
      : language === 'no'
        ? 'Skriv en e-post med emne og innhold.'
        : 'Write an email with subject and body.';

    const prompt = `${typeDesc}.
${formatInstruction}

${contextStr ? `Informasjon:\n${contextStr}\n` : ''}

Generer melding:`;

    return this.generate(prompt, {
      systemPrompt: tonePrompt,
      temperature: 0.4,
      maxTokens: format === 'sms' ? 100 : 300,
      model
    });
  }

  /**
   * Convert message tone
   * @param {string} message - Original message
   * @param {string} targetTone - Target tone (direct, kind, professional, empathetic)
   * @param {string} language - Language code
   */
  async convertTone(message, targetTone, language = 'no') {
    const model = this.config.models?.[language] || this.config.model;
    const tonePrompt = TONE_PROMPTS[targetTone]?.[language] || TONE_PROMPTS.direct[language];

    const prompt = language === 'no'
      ? `Konverter denne meldingen til ${targetTone} tone:\n\n"${message}"\n\nKonvertert melding:`
      : `Convert this message to ${targetTone} tone:\n\n"${message}"\n\nConverted message:`;

    return this.generate(prompt, {
      systemPrompt: tonePrompt,
      temperature: 0.3,
      maxTokens: 200,
      model
    });
  }
}

// Singleton instance
let aiServiceInstance = null;

/**
 * Get or create the AI service instance
 */
export function getAIService(config = {}) {
  if (!aiServiceInstance) {
    aiServiceInstance = new LocalAIService(config);
  }
  return aiServiceInstance;
}

/**
 * React hook for using the AI service
 */
export function useLocalAI() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isAvailable, setIsAvailable] = React.useState(null);
  const [error, setError] = React.useState(null);

  const service = React.useMemo(() => getAIService(), []);

  const checkConnection = React.useCallback(async () => {
    const result = await service.checkAvailability();
    setIsAvailable(result.available);
    return result;
  }, [service]);

  const generate = React.useCallback(async (prompt, options = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await service.generate(prompt, options);
      if (!result.success) {
        setError(result.error);
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [service]);

  const generateSOAP = React.useCallback(async (section, context, language = 'no') => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await service.generateSOAPSuggestion(section, context, language);
      if (!result.success) {
        setError(result.error);
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [service]);

  const improveText = React.useCallback(async (text, language = 'no') => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await service.improveText(text, language);
      if (!result.success) {
        setError(result.error);
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [service]);

  const generateCommunication = React.useCallback(async (messageType, context = {}, tone = 'direct', language = 'no', format = 'sms') => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await service.generateCommunication(messageType, context, tone, language, format);
      if (!result.success) {
        setError(result.error);
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [service]);

  const convertTone = React.useCallback(async (message, targetTone, language = 'no') => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await service.convertTone(message, targetTone, language);
      if (!result.success) {
        setError(result.error);
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [service]);

  return {
    isLoading,
    isAvailable,
    error,
    checkConnection,
    generate,
    generateSOAP,
    improveText,
    generateCommunication,
    convertTone,
    service
  };
}

// Export constants for external use
export { TONE_PROMPTS, COMMUNICATION_TYPES };

// Default export
export default LocalAIService;
