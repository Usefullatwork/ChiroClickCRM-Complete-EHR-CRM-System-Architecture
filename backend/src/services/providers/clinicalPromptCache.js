/**
 * Clinical Prompt Cache
 *
 * Centralizes all system prompt components used across ai.js and letterGenerator.js.
 * Composes task-specific prompt arrays with cache_control markers for Claude's
 * prompt caching, yielding ~35-45% input token cost reduction.
 *
 * Static prompts (clinical guidelines, letter formats, safety rules) are cached.
 * Dynamic per-request data (patient info, custom instructions) stays uncached.
 */

import { ICPC2_CODES } from '../../data/icpc2-codes.js';
import { RED_FLAG_CATEGORIES } from '../redFlagEngine.js';

class ClinicalPromptCache {
  constructor() {
    /** @type {Map<string, {content: string|Function, category: string, priority: number, minLength: number}>} */
    this.registry = new Map();

    /** @type {Map<string, string[]>} taskType → component keys */
    this._taskTypeMap = new Map();

    this._registerDefaults();
    this._registerTaskMappings();
  }

  /**
   * Register a prompt component.
   * @param {string} key - Unique identifier
   * @param {string|Function} content - Static string or () => string for dynamic data
   * @param {Object} [options]
   * @param {string} [options.category='clinical']
   * @param {number} [options.priority=10]
   * @param {number} [options.minLength=100] - Minimum chars to apply cache_control
   */
  register(key, content, options = {}) {
    const { category = 'clinical', priority = 10, minLength = 100 } = options;
    this.registry.set(key, {
      content,
      category,
      priority,
      minLength,
      isFunction: typeof content === 'function',
    });
  }

  /**
   * Get resolved text for a registry key.
   * @param {string} key
   * @returns {string|null}
   */
  get(key) {
    const entry = this.registry.get(key);
    if (!entry) return null;
    return entry.isFunction ? entry.content() : entry.content;
  }

  /**
   * Build system message blocks for a given taskType, with cache_control on static components.
   * @param {string} taskType
   * @param {string} [customSystemPrompt] - Per-request dynamic prompt (uncached unless >500 chars)
   * @returns {Array|null} Array of system message blocks, or null if no mapping exists
   */
  buildCacheableMessages(taskType, customSystemPrompt) {
    const keys = this._taskTypeMap.get(taskType);
    if (!keys) return null;

    const messages = [];

    for (const key of keys) {
      const text = this.get(key);
      if (!text) continue;

      const entry = this.registry.get(key);
      const block = { type: 'text', text };
      if (text.length >= entry.minLength) {
        block.cache_control = { type: 'ephemeral' };
      }
      messages.push(block);
    }

    // Append custom system prompt as final block
    if (customSystemPrompt) {
      const block = { type: 'text', text: customSystemPrompt };
      if (customSystemPrompt.length > 500) {
        block.cache_control = { type: 'ephemeral' };
      }
      messages.push(block);
    }

    // Fall back to clinical_base if no blocks produced
    if (messages.length === 0) {
      const baseText = this.get('clinical_base');
      if (baseText) {
        messages.push({
          type: 'text',
          text: baseText,
          cache_control: { type: 'ephemeral' },
        });
      }
    }

    return messages;
  }

  /**
   * Get cache statistics and estimated cost savings.
   */
  getStats() {
    let totalChars = 0;
    let cacheableChars = 0;
    const categories = {};

    for (const [key, entry] of this.registry) {
      const text = entry.isFunction ? entry.content() : entry.content;
      const len = text.length;
      totalChars += len;
      if (len >= entry.minLength) cacheableChars += len;

      if (!categories[entry.category]) {
        categories[entry.category] = { keys: [], totalChars: 0 };
      }
      categories[entry.category].keys.push(key);
      categories[entry.category].totalChars += len;
    }

    // ~4 chars per token rough estimate
    const estimatedCacheableTokens = Math.round(cacheableChars / 4);

    // Savings model: 95% hit rate assumed
    // Creation cost = 1.25x, Read cost = 0.10x
    // Effective = 5% × 1.25 + 95% × 0.10 = 0.1575 = ~84% savings on cached portion
    const estimatedSavingsPercent = 84;

    // Per-1000 requests cost estimate (system prompt portion only)
    const sonnetInputPer1k = (estimatedCacheableTokens / 1000) * 3.0; // $3/MTok
    const haikuInputPer1k = (estimatedCacheableTokens / 1000) * 0.8; // $0.80/MTok
    const savingsRatio = estimatedSavingsPercent / 100;

    return {
      registeredKeys: this.registry.size,
      taskTypeMappings: this._taskTypeMap.size,
      totalChars,
      cacheableChars,
      estimatedCacheableTokens,
      categories,
      savingsModel: {
        cacheHitRate: 0.95,
        estimatedSavingsPercent,
        per1000Requests: {
          sonnet: {
            withoutCache: `$${sonnetInputPer1k.toFixed(4)}`,
            withCache: `$${(sonnetInputPer1k * (1 - savingsRatio)).toFixed(4)}`,
          },
          haiku: {
            withoutCache: `$${haikuInputPer1k.toFixed(4)}`,
            withCache: `$${(haikuInputPer1k * (1 - savingsRatio)).toFixed(4)}`,
          },
        },
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Private: Register all default prompt components
  // ---------------------------------------------------------------------------

  _registerDefaults() {
    // === Base prompts (from claudeProvider.js) ===
    this.register(
      'clinical_base',
      'Du er en klinisk assistent for kiropraktorer i Norge. Du skriver alltid på norsk bokmål med korrekt medisinsk terminologi. Følg norsk helsepersonelllov og retningslinjer fra Norsk Kiropraktorforening.',
      { category: 'base', priority: 1, minLength: 50 }
    );

    this.register(
      'safety_context',
      'VIKTIG: Identifiser alltid røde flagg (red flags) som krever umiddelbar henvisning. Nevrologiske utfall, cauda equina-syndrom, frakturer, infeksjon, og malignitet skal alltid flagges. Ved tvil, anbefal henvisning.',
      { category: 'base', priority: 2, minLength: 50 }
    );

    // === Clinical prompts (from ai.js) ===
    this.register(
      'spell_check',
      `Du er en norsk språkassistent som er spesialisert på kiropraktisk medisinsk terminologi.
Korriger stavefeil og grammatiske feil i den følgende kliniske teksten.
Behold alle medisinske fagtermer. Svar kun med den korrigerte teksten uten forklaringer.`,
      { category: 'clinical', priority: 10 }
    );

    this.register(
      'soap_subjective',
      `Du er en erfaren kiropraktor i Norge. Generer relevante subjektive funn basert på pasientens hovedplage.
      Inkluder: sykehistorie, debut, smertebeskrivelse, forverrende/lindrende faktorer.
      Skriv på norsk i punktform.`,
      { category: 'clinical', priority: 10 }
    );

    this.register(
      'soap_objective',
      `Du er en erfaren kiropraktor. Generer relevante objektive funn og tester basert på pasientens hovedplage.
      Inkluder: observasjon, palpasjon, bevegelighet (ROM), ortopediske tester.
      Skriv på norsk i punktform.`,
      { category: 'clinical', priority: 10 }
    );

    this.register(
      'soap_assessment',
      `Du er en erfaren kiropraktor. Generer klinisk vurdering basert på pasientens hovedplage.
      Inkluder: differensialdiagnose, prognose, klinisk resonnement.
      Skriv på norsk.`,
      { category: 'clinical', priority: 10 }
    );

    this.register(
      'soap_plan',
      `Du er en erfaren kiropraktor. Generer behandlingsplan basert på pasientens hovedplage.
      Inkluder: behandling, øvelser, råd, oppfølging.
      Skriv på norsk i punktform.`,
      { category: 'clinical', priority: 10 }
    );

    this.register(
      'diagnosis_assistant',
      `Du er en kiropraktor-assistent. Basert på kliniske funn, foreslå de mest relevante ICPC-2 diagnosekodene.
Svar kun med de mest relevante kodene (1-3 stykker) og en kort forklaring.`,
      { category: 'clinical', priority: 10 }
    );

    this.register(
      'red_flag_analysis',
      `Du er en kiropraktor-sikkerhetsassistent. Analyser pasientdata og kliniske funn for røde flagg.

Røde flagg inkluderer:
- Malignitet (vekttap, nattlige smerter, tidligere kreft)
- Infeksjon (feber, immunsuppresjon)
- Cauda equina (blære-/tarmforstyrrelser, sadelformet nummenhet)
- Fraktur (betydelig trauma, osteoporose)
- Inflammatoriske tilstander (morgenstivhet, ung alder)

Vurder om pasienten kan behandles sikkert eller bør henvises.`,
      { category: 'clinical', priority: 10 }
    );

    this.register(
      'clinical_summary',
      `Du er en kiropraktor-assistent. Generer et kort, profesjonelt klinisk sammendrag på norsk.
Sammendraget skal være kortfattet og egnet for journalføring eller henvisningsbrev.`,
      { category: 'clinical', priority: 10 }
    );

    this.register(
      'journal_organization',
      `Du er en erfaren kiropraktor-assistent som er ekspert på å organisere og strukturere gamle journalnotater.

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

STEG 5: Identifiser MANGLENDE INFORMASJON
Hva mangler for fullstendig klinisk dokumentasjon?

Svar i JSON-format med felter: structured_data, soap, actionable_items, communication_history, missing_information, tags, suggested_encounter_type, suggested_date, confidence_score, notes.`,
      { category: 'clinical', priority: 10 }
    );

    this.register(
      'note_merging',
      `Du er en erfaren kiropraktor-assistent. Din oppgave er å samle og konsolidere flere journalnotater til én omfattende, kronologisk journalpost.

Prinsipper:
- Behold all viktig klinisk informasjon
- Organiser kronologisk (eldst først)
- Identifiser utviklingstrender (bedring/forverring)
- Fjern duplikater
- Lag et samlet klinisk bilde

Svar i SOAP-format på norsk, med tydelig tidslinje.`,
      { category: 'clinical', priority: 10 }
    );

    // === Letter prompts (from letterGenerator.js) ===
    this.register(
      'letter_base',
      `Du er en erfaren norsk kiropraktor som skriver profesjonelle medisinske brev og erklæringer.

VIKTIGE RETNINGSLINJER:
1. Skriv alltid på formelt, profesjonelt norsk
2. Bruk korrekt medisinsk terminologi
3. Vær presis og konsis
4. Inkluder relevante ICPC-2 koder når aktuelt
5. Følg norske helsevesen standarder
6. Inkluder alltid dato og signatur-felt
7. Beskytt pasientens personvern - bruk kun nødvendig informasjon`,
      { category: 'letter', priority: 5 }
    );

    this.register(
      'letter_MEDICAL_CERTIFICATE',
      `Du skriver en medisinsk erklæring (attestasjon).

FORMAT:
1. Overskrift: "MEDISINSK ERKLÆRING"
2. Dato og sted
3. Pasientinformasjon (navn, fødselsdato)
4. "Det bekreftes herved at..." - hovedutsagn
5. Klinisk bakgrunn og funn
6. Vurdering og anbefaling
7. Signatur (behandler, HPR-nummer)

Bruk profesjonelt språk og vær objektiv.`,
      { category: 'letter', priority: 10 }
    );

    this.register(
      'letter_UNIVERSITY_LETTER',
      `Du skriver et brev til et universitet angående utsatt eksamen eller studietilpasninger.

FORMAT:
1. Overskrift: "MEDISINSK ERKLÆRING - UTSATT EKSAMEN"
2. Til: [Universitet/Fakultet]
3. Vedrørende: [Studentens navn og studentnummer]
4. Bakgrunn og diagnose
5. Hvordan tilstanden påvirker studieevne
6. Anbefaling om tilrettelegging
7. Signatur

Vær tydelig på hvorfor tilpasning er medisinsk begrunnet.`,
      { category: 'letter', priority: 10 }
    );

    this.register(
      'letter_VESTIBULAR_REFERRAL',
      `Du skriver en henvisning for vestibulær utredning.

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
      { category: 'letter', priority: 10 }
    );

    this.register(
      'letter_HEADACHE_REFERRAL',
      `Du skriver en henvisning for hodepineutredning.

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
      { category: 'letter', priority: 10 }
    );

    this.register(
      'letter_MEMBERSHIP_FREEZE',
      `Du skriver en erklæring for frys av treningsmedlemskap.

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
      { category: 'letter', priority: 10 }
    );

    this.register(
      'letter_CLINICAL_NOTE',
      `Du skriver et detaljert klinisk notat.

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
      { category: 'letter', priority: 10 }
    );

    this.register(
      'letter_WORK_DECLARATION',
      `Du skriver en erklæring til arbeidsgiver.

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
      { category: 'letter', priority: 10 }
    );

    // === Reference data (dynamic) ===
    this.register(
      'icpc2_codes',
      () => {
        return (
          'Tilgjengelige ICPC-2 koder:\n' +
          Object.entries(ICPC2_CODES)
            .map(([code, desc]) => `${code} - ${desc}`)
            .join('\n')
        );
      },
      { category: 'reference', priority: 20, minLength: 100 }
    );

    this.register(
      'red_flag_rules',
      () => {
        return (
          'Røde flagg-kategorier:\n' +
          Object.entries(RED_FLAG_CATEGORIES)
            .map(
              ([key, cat]) =>
                `${cat.code} - ${cat.name_no} (${cat.severity}) → ${cat.action} innen ${cat.timeframe}`
            )
            .join('\n')
        );
      },
      { category: 'reference', priority: 20, minLength: 100 }
    );
  }

  // ---------------------------------------------------------------------------
  // Private: Map taskType → component keys
  // ---------------------------------------------------------------------------

  _registerTaskMappings() {
    // SOAP notes — section-specific prompt comes via customSystemPrompt
    this._taskTypeMap.set('soap_notes', ['clinical_base']);

    // Spell check
    this._taskTypeMap.set('spell_check', ['clinical_base', 'spell_check']);

    // Red flag analysis — full safety stack
    this._taskTypeMap.set('red_flag_analysis', [
      'clinical_base',
      'safety_context',
      'red_flag_analysis',
      'red_flag_rules',
    ]);

    // Diagnosis suggestion — needs ICPC-2 reference
    this._taskTypeMap.set('diagnosis_suggestion', [
      'clinical_base',
      'diagnosis_assistant',
      'icpc2_codes',
    ]);

    // Clinical summary
    this._taskTypeMap.set('clinical_summary', ['clinical_base', 'clinical_summary']);

    // Journal organization
    this._taskTypeMap.set('journal_organization', ['clinical_base', 'journal_organization']);

    // Note merging
    this._taskTypeMap.set('note_merging', ['clinical_base', 'note_merging']);

    // Safety task types — clinical_base + safety_context
    for (const safetyType of [
      'differential_diagnosis',
      'treatment_safety',
      'clinical_reasoning',
      'medication_interaction',
      'contraindication_check',
    ]) {
      this._taskTypeMap.set(safetyType, ['clinical_base', 'safety_context']);
    }

    // Letter types — clinical_base + letter_base + type-specific
    for (const letterType of [
      'MEDICAL_CERTIFICATE',
      'UNIVERSITY_LETTER',
      'VESTIBULAR_REFERRAL',
      'HEADACHE_REFERRAL',
      'MEMBERSHIP_FREEZE',
      'CLINICAL_NOTE',
      'WORK_DECLARATION',
    ]) {
      this._taskTypeMap.set(`letter_${letterType}`, [
        'clinical_base',
        'letter_base',
        `letter_${letterType}`,
      ]);
    }
  }
}

const clinicalPromptCache = new ClinicalPromptCache();
export { ClinicalPromptCache };
export default clinicalPromptCache;
