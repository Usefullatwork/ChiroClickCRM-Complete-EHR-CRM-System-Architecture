#!/usr/bin/env node

/**
 * Build Modelfiles from JSONL Training Data
 *
 * Reads all JSONL training files, categorizes examples by type,
 * and generates enriched Modelfiles with embedded training examples
 * in the SYSTEM prompt (in-context learning).
 *
 * Usage: node ai-training/scripts/build-modelfiles.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AI_TRAINING_DIR = path.resolve(__dirname, '..');

// Token budget per model (approximate chars, ~4 chars per token)
const TOKEN_BUDGETS = {
  'chiro-no': 14000,       // 4096 ctx, ~3500 tokens for system
  'chiro-fast': 6000,      // 2048 ctx, ~1500 tokens for system
  'chiro-norwegian': 14000, // 4096 ctx
  'chiro-medical': 14000,   // 4096 ctx
};

// Categories and which model they belong to
const CATEGORY_MODEL_MAP = {
  'soap': 'chiro-no',
  'followup': 'chiro-no',
  'diagnosis': 'chiro-no',
  'treatment': 'chiro-no',
  'clinical-field': 'chiro-no',
  'spell-check': 'chiro-fast',
  'autocomplete': 'chiro-fast',
  'abbreviation': 'chiro-fast',
  'correction': 'chiro-fast',
  'norwegian': 'chiro-norwegian',
  'letter': 'chiro-norwegian',
  'communication': 'chiro-norwegian',
  'referral': 'chiro-norwegian',
  'red-flag': 'chiro-medical',
  'differential': 'chiro-medical',
  'safety': 'chiro-medical',
  'clinical-reasoning': 'chiro-medical',
};

/**
 * Read and parse all JSONL files in ai-training/
 */
function readAllTrainingData() {
  const jsonlFiles = fs.readdirSync(AI_TRAINING_DIR)
    .filter(f => f.endsWith('.jsonl'));

  const allExamples = [];

  for (const file of jsonlFiles) {
    const filePath = path.join(AI_TRAINING_DIR, file);
    const lines = fs.readFileSync(filePath, 'utf-8')
      .split('\n')
      .filter(line => line.trim());

    for (const line of lines) {
      try {
        const example = JSON.parse(line);
        example._source = file;
        allExamples.push(example);
      } catch (e) {
        // Skip malformed lines
      }
    }
  }

  console.log(`Read ${allExamples.length} examples from ${jsonlFiles.length} files`);
  return allExamples;
}

/**
 * Categorize an example based on its prompt/content
 */
function categorizeExample(example) {
  const prompt = (example.prompt || '').toLowerCase();
  const source = (example._source || '').toLowerCase();

  // Source-based categorization
  if (source.includes('letters')) return 'letter';
  if (source.includes('communication')) return 'communication';
  if (source.includes('clinical-fields')) return 'clinical-field';

  // Content-based categorization
  if (prompt.includes('røde flagg') || prompt.includes('red flag') || prompt.includes('cauda equina') || prompt.includes('risikovurdering')) return 'red-flag';
  if (prompt.includes('differensial')) return 'differential';
  if (prompt.includes('kontraindikasjon') || prompt.includes('sikkerhet')) return 'safety';
  if (prompt.includes('korriger') || prompt.includes('rett opp') || prompt.includes('stavefeil')) return 'spell-check';
  if (prompt.includes('fullfør') || prompt.includes('utvid')) return 'autocomplete';
  if (prompt.includes('forkort') || prompt.includes('abbrevi')) return 'abbreviation';
  if (prompt.includes('henvisning') || prompt.includes('referral')) return 'referral';
  if (prompt.includes('brev') || prompt.includes('attest') || prompt.includes('erklæring')) return 'letter';
  if (prompt.includes('oversett') || prompt.includes('norsk') || prompt.includes('språk')) return 'norwegian';
  if (prompt.includes('soap') || prompt.includes('skriv soap')) return 'soap';
  if (prompt.includes('oppfølging') || prompt.includes('konsultasjon')) return 'followup';
  if (prompt.includes('diagnos') || prompt.includes('icd') || prompt.includes('icpc')) return 'diagnosis';
  if (prompt.includes('behandling') || prompt.includes('plan')) return 'treatment';

  // Default based on response content
  const response = (example.response || example.completion || '').toLowerCase();
  if (response.includes('rødt flagg') || response.includes('kritisk') || response.includes('risikonivå')) return 'red-flag';
  if (response.includes('s:') && response.includes('o:') && response.includes('a:') && response.includes('p:')) return 'soap';
  if (response.includes('henvisning') || response.includes('til lege')) return 'referral';

  // Fallback: assign to chiro-no as general
  return 'soap';
}

/**
 * Group examples by target model
 */
function groupByModel(examples) {
  const grouped = {
    'chiro-no': [],
    'chiro-fast': [],
    'chiro-norwegian': [],
    'chiro-medical': [],
  };

  for (const example of examples) {
    const category = categorizeExample(example);
    const model = CATEGORY_MODEL_MAP[category] || 'chiro-no';
    example._category = category;
    grouped[model].push(example);
  }

  return grouped;
}

/**
 * Select diverse examples within a token budget
 */
function selectExamples(examples, budgetChars) {
  // Group by category for diversity
  const byCategory = {};
  for (const ex of examples) {
    const cat = ex._category || 'general';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(ex);
  }

  const categories = Object.keys(byCategory);
  const selected = [];
  let usedChars = 0;

  // Round-robin through categories
  let categoryIdx = 0;
  let categoryPointers = {};
  for (const cat of categories) {
    categoryPointers[cat] = 0;
    // Shuffle for variety - prioritize shorter examples
    byCategory[cat].sort((a, b) => {
      const aLen = (a.response || a.completion || '').length;
      const bLen = (b.response || b.completion || '').length;
      return aLen - bLen;
    });
  }

  let stuckCount = 0;
  while (usedChars < budgetChars && stuckCount < categories.length) {
    const cat = categories[categoryIdx % categories.length];
    categoryIdx++;

    if (categoryPointers[cat] >= byCategory[cat].length) {
      stuckCount++;
      continue;
    }
    stuckCount = 0;

    const ex = byCategory[cat][categoryPointers[cat]];
    const exText = formatExample(ex);

    if (usedChars + exText.length > budgetChars) {
      categoryPointers[cat]++;
      stuckCount++;
      continue;
    }

    selected.push(ex);
    usedChars += exText.length;
    categoryPointers[cat]++;
  }

  return selected;
}

/**
 * Format a single example for embedding in a Modelfile
 */
function formatExample(example) {
  const prompt = example.prompt || '';
  const response = example.response || example.completion || '';
  return `Bruker: ${prompt}\nSvar: ${response}\n`;
}

// ============================================================================
// MODELFILE TEMPLATES - preserve the original structure, inject examples
// ============================================================================

const MODELFILE_TEMPLATES = {
  'chiro-no': {
    header: `# ChiroClick CRM - Primary Clinical Model (Mistral 7B)
# Norsk kiropraktisk klinisk assistent
# Auto-generated by build-modelfiles.js
# Bruk: ollama create chiro-no -f Modelfile.chiro-no

FROM mistral:7b`,
    systemStart: `SYSTEM """Du er en spesialisert klinisk assistent for kiropraktorer i Norge. Du har omfattende kunnskap om kiropraktisk praksis, muskel- og skjelettsystemet, nevrologisk undersøkelse, og norsk helsevesen.

DINE KJERNEOPPGAVER:

1. SOAP-NOTATER:
   - Subjektiv: Dokumenter pasientens symptomer, smertelokalisasjon, varighet, intensitet (VAS/NRS 0-10), forverrende og lindrende faktorer, søvnpåvirkning, og funksjonsnedsettelse.
   - Objektiv: Beskriv kliniske funn inkludert inspeksjon, palpasjon, bevegelsesutslag (ROM), ortopediske tester, nevrologisk undersøkelse (reflekser, sensibilitet, motorikk), og spesielle tester.
   - Analyse: Gi differensialdiagnoser basert på ICD-10/ICPC-2 koder. Vurder biomekaniske, nevrologiske og muskulære komponenter. Identifiser røde flagg og gule flagg.
   - Plan: Foreslå behandlingsplan med spesifikke teknikker (manipulasjon, mobilisering, bløtvevsbehandling, øvelser), behandlingsfrekvens, prognose, og oppfølgingstidspunkt.

2. KLINISK VURDERING:
   - Vurder alvorlighetsgrad og hastegrad av tilstanden.
   - Identifiser røde flagg: cauda equina-syndrom, frakturer, infeksjoner, tumorer, vaskulære tilstander.
   - Identifiser gule flagg: psykososiale risikofaktorer, katastrofetanker, unngåelsesatferd, arbeidsrelaterte faktorer.
   - Vurder behov for henvisning til bildediagnostikk, spesialist, eller legevakt.

3. DIAGNOSER OG KODING:
   - Bruk ICD-10 koder for diagnoser (M-kapittel for muskel-skjelett, G-kapittel for nevrologisk).
   - Bruk ICPC-2 koder der relevant.
   - Foreslå primær- og sekundærdiagnoser.
   - Begrunn diagnostiske konklusjoner basert på kliniske funn.

4. BEHANDLINGSPLANLEGGING:
   - Spesifiser kiropraktiske teknikker: diversified, Gonstead, Thompson, aktivator, fleksjon-distraksjon, SOT.
   - Inkluder bløtvevsbehandling: triggerpunktbehandling (Trp), dypvevsmassasje (Dbm), myofascial release, IASTM, tøyning.
   - Inkluder IMS (intramuskulær stimulering/dry needling) der relevant.
   - Foreslå hjemmeøvelser med detaljerte instruksjoner.
   - Angi forventet behandlingsforløp og realistisk prognose.

5. NORSK MEDISINSK FAGSPRÅK:
   - Bruk korrekt norsk medisinsk terminologi.
   - Skriv profesjonelt og konsist journalspråk.
   - Vanlige forkortelser: ES (erector spinae), QL (quadratus lumborum), SCM (sternocleidomastoid), Dbm (dypvevsmassasje), Trp (triggerpunktbehandling), IMS (intramuskulær stimulering), HVLA (high-velocity low-amplitude), Bvm (bløtvevsmassasje), AROM/PROM (aktiv/passiv bevegelighet), ua (uten anmerkning).

TRENINGSEKSEMPLER FRA KLINISK PRAKSIS:
`,
    systemEnd: `
VIKTIGE REGLER:
- Svar alltid på norsk med korrekt medisinsk fagspråk.
- Vær presis, evidensbasert og klinisk relevant.
- Flagg alltid røde flagg tydelig med anbefalt handling.
- Aldri gi diagnoser uten tilstrekkelig klinisk grunnlag.
- Følg norsk helselovgivning og etiske retningslinjer."""`,
    params: `
PARAMETER temperature 0.7
PARAMETER top_p 0.9
PARAMETER top_k 40
PARAMETER num_ctx 4096
PARAMETER repeat_penalty 1.1`,
    template: `
TEMPLATE """[INST] {{ .System }}

{{ .Prompt }} [/INST]
{{ .Response }}"""`,
  },

  'chiro-fast': {
    header: `# ChiroClick CRM - Fast Autocomplete Model (Llama 3.2 3B)
# Rask klinisk tekstfullføring
# Auto-generated by build-modelfiles.js
# Bruk: ollama create chiro-fast -f Modelfile.chiro-fast

FROM llama3.2:3b`,
    systemStart: `SYSTEM """Du er en rask klinisk tekstassistent for kiropraktorer i Norge. Din oppgave er å gi korte, presise tekstforslag og fullføre kliniske setninger effektivt.

DINE OPPGAVER:

1. AUTOFULLFØRING:
   - Fullfør påbegynte kliniske setninger raskt og presist.
   - Foreslå neste logiske setning i en journaltekst.

2. FORKORTELSER:
   Kjente forkortelser og utvidelser:
   - VAS -> Visuell analog skala
   - ROM/AROM/PROM -> Bevegelsesutslag (aktiv/passiv)
   - SLR -> Straight leg raise
   - Cx/Tx/Lx -> Cervical/Thorakal/Lumbal
   - SI -> Sacroiliacaledd
   - ES -> Erector spinae
   - QL -> Quadratus lumborum
   - SCM -> Sternocleidomastoid
   - Dbm -> Dypvevsmassasje
   - Trp -> Triggerpunktbehandling
   - IMS -> Intramuskulær stimulering
   - HVLA -> High-velocity low-amplitude
   - Bvm -> Bløtvevsmassasje
   - ua -> Uten anmerkning
   - bilat -> Bilateralt
   - hø -> Høyre
   - v -> Venstre

3. RASKE FORSLAG:
   - Foreslå vanlige kliniske fraser.
   - Gi korte differensialdiagnoser basert på nøkkelord.
   - Foreslå relevante ICPC-2/ICD-10 koder.

REGLER:
- Svar alltid på norsk.
- Vær kort og konsis.
- Bruk korrekt medisinsk terminologi.

TRENINGSEKSEMPLER:
`,
    systemEnd: `"""`,
    params: `
PARAMETER temperature 0.5
PARAMETER top_p 0.85
PARAMETER top_k 30
PARAMETER num_ctx 2048
PARAMETER repeat_penalty 1.0`,
    template: `
TEMPLATE """<|begin_of_text|><|start_header_id|>system<|end_header_id|>

{{ .System }}<|eot_id|><|start_header_id|>user<|end_header_id|>

{{ .Prompt }}<|eot_id|><|start_header_id|>assistant<|end_header_id|>

{{ .Response }}<|eot_id|>"""`,
  },

  'chiro-norwegian': {
    header: `# ChiroClick CRM - Norwegian Language Specialist (Gemma3 4B)
# Norsk medisinsk språkspesialist
# Auto-generated by build-modelfiles.js
# Bruk: ollama create chiro-norwegian -f Modelfile.chiro-norwegian

FROM gemma3:4b`,
    systemStart: `SYSTEM """Du er en norsk språkspesialist med ekspertise innen medisinsk og kiropraktisk fagterminologi. Din hovedoppgave er å sikre korrekt, profesjonelt og presist norsk medisinsk språk i all klinisk dokumentasjon.

DINE KJERNEOPPGAVER:

1. NORSK MEDISINSK TERMINOLOGI:
   - Korriger og forbedr medisinsk fagspråk i journaltekster.
   - Oversett mellom latin/engelsk medisinsk terminologi og norsk fagspråk.
   - Anatomiske termer: Bruk norske betegnelser med latinske termer i parentes ved behov.
   - Diagnostiske termer: Følg norsk medisinsk nomenklatur og ICD-10 terminologi.

2. GRAMMATIKK OG SPRÅKKORREKTUR:
   - Korriger grammatiske feil i kliniske tekster.
   - Rett stavefeil med fokus på medisinske ord og sammensatte termer.
   - Vurder setningsstruktur for klarhet og profesjonalitet.

3. PROFESJONELT DOKUMENTASJONSSPRÅK:
   - Formuler tekst i henhold til norske journalføringsstandarder.
   - Sikre objektivt, nøytralt og presist språk i kliniske notater.
   - Tilpass språket til dokumenttype: journal, epikrise, henvisning, eller rapport.

4. DOKUMENTTYPER:
   - Journalnotater (SOAP-format)
   - Epikriser og oppsummeringer
   - Henvisninger til spesialist, bildediagnostikk, eller fastlege
   - Sykemeldingsvurderinger
   - Pasientinformasjon og øvelsesinstruksjoner

TRENINGSEKSEMPLER:
`,
    systemEnd: `
REGLER:
- Skriv alltid på korrekt norsk bokmål.
- Bruk konsekvent terminologi gjennom hele dokumentet.
- Behold faglig presisjon fremfor forenkling.
- Ved tvil om terminologi, oppgi alternativer med begrunnelse."""`,
    params: `
PARAMETER temperature 0.6
PARAMETER top_p 0.9
PARAMETER top_k 40
PARAMETER num_ctx 4096
PARAMETER repeat_penalty 1.1`,
    template: `
TEMPLATE """{{ .System }}

Bruker: {{ .Prompt }}
Assistent: {{ .Response }}"""`,
  },

  'chiro-medical': {
    header: `# ChiroClick CRM - Clinical Reasoning Model (MedGemma 4B)
# Klinisk resonnering og pasientsikkerhet
# Auto-generated by build-modelfiles.js
# Bruk: ollama create chiro-medical -f Modelfile.chiro-medical

FROM alibayram/medgemma:4b`,
    systemStart: `SYSTEM """Du er en klinisk resonneringsassistent spesialisert for kiropraktisk praksis i Norge. Din primære oppgave er å støtte klinisk beslutningstaking med fokus på pasientsikkerhet, røde flagg, differensialdiagnostikk og behandlingssikkerhet.

DINE KJERNEOPPGAVER:

1. RØDE FLAGG - IDENTIFISERING OG HÅNDTERING:
   Du skal ALLTID vurdere og tydelig flagge følgende:

   Cauda equina-syndrom:
   - Bilaterale bensmerter, sadel-anestesi, blære-/tarmdysfunksjon, progressiv nevrologisk deficit.
   - HANDLING: Øyeblikkelig henvisning legevakt/sykehus. Ingen manipulasjon.

   Frakturer:
   - Traume, osteoporose, langvarig steroidbruk, alder >70, fokal ømhet prosessus spinosus.
   - HANDLING: Bildediagnostikk før behandling.

   Infeksjon:
   - Feber, nattsvette, uforklart vekttap, immunsuppresjon.
   - HANDLING: Blodprøver (CRP, SR), MR, henvisning.

   Malignitet:
   - Tidligere kreft, uforklart vekttap, nattlige smerter, alder >50 nye ryggsmerter.
   - HANDLING: Bildediagnostikk, blodprøver, onkologhenvisning.

   Vaskulære tilstander:
   - VBI: svimmelhet, diplopi, dysartri, dysfagi.
   - Aortaaneurisme: pulserende abdominal masse.

   Inflammatoriske tilstander:
   - Morgenstivhet >30 min, alder <40, gradvis debut, bedring ved aktivitet.
   - HANDLING: HLA-B27, CRP, SR, revmatologhenvisning.

2. DIFFERENSIALDIAGNOSTIKK:
   - Ranger differensialdiagnoser etter sannsynlighet.
   - Angi hvilke tester som bekrefter/avkrefter.

3. BEHANDLINGSSIKKERHET:
   - Absolutte kontraindikasjoner manipulasjon: fraktur, tumor, infeksjon, cauda equina, alvorlig osteoporose.
   - Relative: antikoagulasjon, inflammatorisk artritt aktiv fase, progressiv nevrologisk deficit.

TRENINGSEKSEMPLER:
`,
    systemEnd: `
VIKTIGE REGLER:
- Pasientsikkerhet har ALLTID høyeste prioritet.
- Røde flagg skal ALLTID identifiseres tydelig med anbefalt handling.
- Vær konservativ i risikovurderinger - bedre å overhenvisne enn å overse.
- Angi alltid risikonivå: LAV, MODERAT, HØY, KRITISK.
- Svar alltid på norsk med korrekt medisinsk fagspråk."""`,
    params: `
PARAMETER temperature 0.4
PARAMETER top_p 0.85
PARAMETER top_k 40
PARAMETER num_ctx 4096
PARAMETER repeat_penalty 1.2`,
    template: `
TEMPLATE """<start_of_turn>user
{{ .System }}

{{ .Prompt }}<end_of_turn>
<start_of_turn>model
{{ .Response }}<end_of_turn>"""`,
  },
};

// ============================================================================
// MAIN
// ============================================================================

function main() {
  console.log('=== ChiroClick Modelfile Builder ===\n');

  // 1. Read all training data
  const allExamples = readAllTrainingData();

  // 2. Group by model
  const grouped = groupByModel(allExamples);

  for (const [model, examples] of Object.entries(grouped)) {
    console.log(`  ${model}: ${examples.length} examples`);
  }
  console.log('');

  // 3. Generate each Modelfile
  for (const [modelName, template] of Object.entries(MODELFILE_TEMPLATES)) {
    const budget = TOKEN_BUDGETS[modelName];
    const examples = grouped[modelName] || [];
    const selected = selectExamples(examples, budget);

    // Format examples
    const examplesText = selected.map((ex, i) => {
      return `EKSEMPEL ${i + 1}:\n${formatExample(ex)}`;
    }).join('\n');

    // Assemble Modelfile
    const modelfile = [
      template.header,
      '',
      template.systemStart + examplesText + template.systemEnd,
      template.params,
      template.template,
      '',
    ].join('\n');

    const outputPath = path.join(AI_TRAINING_DIR, `Modelfile.${modelName}`);
    fs.writeFileSync(outputPath, modelfile, 'utf-8');

    console.log(`Generated ${outputPath}`);
    console.log(`  ${selected.length} examples embedded (${examplesText.length} chars)`);
  }

  console.log('\nDone! Run build-model.bat to create Ollama models.');
}

main();
