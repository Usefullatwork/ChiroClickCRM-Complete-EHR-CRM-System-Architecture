/**
 * Sindre Journal Parser
 * Parse and extract training data from Sindre's chiropractic journals
 * Norwegian chiropractic journal format parser for AI training
 *
 * NOTE: This parser now supports loading terminology from the modular template system.
 * The constants below are maintained for backward compatibility.
 * For new implementations, use the TemplateService from '../templates/index.js'
 *
 * Example using TemplateService:
 *   import { templateService } from '../templates/index.js';
 *   const templates = await templateService.loadForDocumentType('journal', { practitioner: 'sindre' });
 */

import logger from '../utils/logger.js';

// Optional: Import from template system for enhanced terminology
// Uncomment to use template-based terminology:
// import {
//   ANATOMICAL_ABBREVIATIONS as TEMPLATE_ANATOMY,
//   TREATMENT_ABBREVIATIONS as TEMPLATE_TREATMENTS,
//   EXAMINATION_TESTS as TEMPLATE_TESTS,
//   COMMON_FINDINGS as TEMPLATE_FINDINGS
// } from '../templates/terminology.js';

/**
 * Common Norwegian anatomical abbreviations used by Sindre
 */
export const ANATOMICAL_ABBREVIATIONS = {
  // Spinal segments
  'C0': 'Occiput',
  'C1': 'Atlas (1. nakkevirvel)',
  'C2': 'Axis (2. nakkevirvel)',
  'C3-C7': 'Cervical vertebrae 3-7 (nakkehvirvler)',
  'T1-T12': 'Thoracic vertebrae (brysthvirvler)',
  'L1-L5': 'Lumbar vertebrae (lendehvirvler)',
  'S1': 'Sacrum',

  // Directions
  'PR': 'Posterior to Right rotation',
  'PL': 'Posterior to Left rotation',
  'PRS': 'Posterior Right Sidebending',
  'PLS': 'Posterior Left Sidebending',
  'Hø': 'Høyre (Right)',
  'Ve': 'Venstre (Left)',
  'bilat': 'bilateral (begge sider)',

  // Joints
  'IS-ledd': 'Iliosakralledd (Sacroiliac joint)',
  'PIR': 'Posterior Inferior Right (IS-ledd posisjon)',
  'PIL': 'Posterior Inferior Left (IS-ledd posisjon)',
  'ASR': 'Anterior Superior Right (IS-ledd posisjon)',
  'ASL': 'Anterior Superior Left (IS-ledd posisjon)',
  'GH-ledd': 'Glenohumeralledd (skulderled)',
  'SC-ledd': 'Sternoclavicularledd',
  'TMJ': 'Temporomandibular joint (kjeveledd)',
  'AC-ledd': 'Acromioclavicular ledd',

  // Anatomical structures
  'C-col': 'Cervical columna (nakke)',
  'T-col': 'Thoracic columna (bryst)',
  'L-col': 'Lumbar columna (lend)',
  'scapula': 'Skulderbladet',
  'calcaneus': 'Hælbein',
  'talus': 'Rullebein i ankel',
  'navikularis': 'Navicular bone (fot)',
  'cuneiform': 'Cuneiform bone (fot)',
  'TMT': 'Tarsometatarsal ledd',
  'lunate': 'Lunate bone (håndledd)',
  'radius': 'Spoke',
  'ulna': 'Albueben',
  'fibula': 'Leggebein',

  // Muscles
  'traps': 'Trapezius muskel',
  'ES': 'Erector spinae (ryggstrekker)',
  'SCM': 'Sternocleidomastoid',
  'subocc': 'Suboccipitalis (nakkemuskel)',
  'infraspinatus': 'Infraspinatus (rotatorcuff)',
  'supraspinatus': 'Supraspinatus (rotatorcuff)',
  'subscapularis': 'Subscapularis (rotatorcuff)',
  'deltoideus': 'Deltoid muskel',
  'pecs': 'Pectoralis (brystmuskel)',
  'glut': 'Gluteal muscles (setemuskel)',
  'glut med': 'Gluteus medius',
  'glut max': 'Gluteus maximus',
  'piriformis': 'Piriformis muskel',
  'psoas': 'Iliopsoas',
  'QL': 'Quadratus lumborum',
  'HLB': 'Hofteleddsbøyere',
  'hamstring': 'Hamstrings (bakside lår)',
  'quadriceps': 'Quadriceps (forside lår)',
  'gastroc': 'Gastrocnemius (leggmuskel)',
  'soleus': 'Soleus (leggmuskel)',
  'tib post': 'Tibialis posterior',
  'tib ant': 'Tibialis anterior',
  'peroneus': 'Peroneus/fibularis',

  // Common terms
  'ua': 'uten anmerkning (unremarkable)',
  'palpøm': 'palpatorisk øm (tender on palpation)',
  'hypomobil': 'redusert bevegelighet (reduced mobility)',
  'fx': 'Fraktur (fracture)',
  'bilat': 'bilateral',
  'ipsilat': 'ipsilateral (samme side)',
  'contralat': 'contralateral (motsatt side)'
};

/**
 * Treatment technique abbreviations
 */
export const TREATMENT_ABBREVIATIONS = {
  'SMT': 'Spinal Manipulative Therapy (justering av ryggsøyle)',
  'EMT': 'Extremity Manipulative Therapy (justering av ekstremiteter)',
  'IMS': 'Intramuscular Stimulation (tørrnåling)',
  'KMI': 'Kinesio taping',
  'KT': 'Kinesio tape',
  'TrP': 'Trigger Point behandling',
  'TBB': 'Trykkbølgebehandling / shockwave therapy',
  'COX': 'Cox flexion-distraction technique',
  'MAG': 'Mobilization',
  'Tøy': 'Tøyning/stretching',
  'AKU': 'Akupunktur'
};

/**
 * Examination test abbreviations
 */
export const EXAMINATION_TESTS = {
  // Cervical tests
  'Spurlings': 'Spurlings test (nakke nerverot kompresjon)',
  'Kompresjon': 'Kompresjontest nakke',
  'Traksjon': 'Traksjonstest nakke',
  'Perkusjon': 'Perkusjontest',
  'Skulderdepresjon': 'Skulderdepresjonstest',
  'SMR': 'Sensory Motor Reflex test',

  // Lumbar tests
  'Adams': 'Adams forward bend test',
  'Kemps': 'Kemps test (lateral fleksjon)',
  'Slumps': 'Slump test (nerve tension)',
  'Lasegue': 'Lasegue / Straight leg raise test',
  'SLR': 'Straight leg raise',

  // Shoulder tests
  'Empty can': 'Empty can test (supraspinatus)',
  'Hawkins': 'Hawkins-Kennedy test (impingement)',
  'Speeds': 'Speeds test (biceps)',
  'Neers': 'Neers test (impingement)',
  'Yochums': 'Yochums test',
  'Painful Arc': 'Painful arc test',
  'Winging': 'Scapular winging test',

  // Hip/SI tests
  'FABER': 'Flexion Abduction External Rotation test',
  'FADIR': 'Flexion Adduction Internal Rotation test',

  // Knee tests
  'McMurray': 'McMurray test (menisk)',
  'Apley': 'Apley test (menisk)',
  'Thessaly': 'Thessaly test (menisk)',
  'Lachmann': 'Lachmann test (ACL)',
  'Drawer': 'Drawer test (cruciate ligaments)',

  // General
  'Tågange': 'Toe walking (motor test)',
  'Hælgange': 'Heel walking (motor test)',
  'ROM': 'Range of Motion',
  'AROM': 'Active Range of Motion',
  'PROM': 'Passive Range of Motion'
};

/**
 * Common findings patterns in Norwegian
 */
export const COMMON_FINDINGS = {
  pain_locations: [
    'nakken', 'skulder', 'arm', 'albue', 'hånd', 'finger',
    'bryst', 'rygg', 'korsrygg', 'bekken', 'hofte',
    'lår', 'kne', 'legg', 'ankel', 'fot'
  ],
  pain_descriptors: [
    'vondt', 'smerter', 'stiv', 'støl', 'stramt', 'låst',
    'stikkende', 'verkende', 'pulserende', 'brennende',
    'dunkende', 'skarp'
  ],
  symptom_patterns: [
    'stråling', 'nummenhet', 'prikking', 'svakhet',
    'hovent', 'ømt', 'begrenset', 'redusert'
  ],
  temporal_patterns: [
    'akutt', 'gradvis', 'plutselig', 'kronisk',
    'intermitterende', 'konstant', 'periodevis'
  ],
  aggravating_factors: [
    'sitte', 'stå', 'gå', 'løpe', 'trening', 'bevegelse',
    'fleksjon', 'ekstensjon', 'rotasjon', 'belastning'
  ],
  relieving_factors: [
    'hvile', 'bevegelse', 'varme', 'kulde', 'tøying',
    'smertestillende', 'behandling'
  ]
};

/**
 * Parse a single journal entry
 */
export const parseJournalEntry = (journalText) => {
  const entry = {
    anamnese: null,
    undersøkelse: null,
    behandling: null,
    notat: null,
    diagnosis: null,
    raw: journalText
  };

  // Extract sections using regex - improved to handle various spacing
  const anamneseMatch = journalText.match(/Anamnese\s+(.*?)(?=\s*(?:Undersøkelse|Behandling|Notat|Diagnose|$))/si);
  const undersøkelseMatch = journalText.match(/Undersøkelse\s+(.*?)(?=\s*(?:Anamnese|Behandling|Notat|Diagnose|$))/si);
  const behandlingMatch = journalText.match(/Behandling\s+(.*?)(?=\s*(?:Anamnese|Undersøkelse|Notat|Diagnose|Journal|Konklusjon|Henvisningsdiagnose|BUndersøkelse|$))/si);
  const notatMatch = journalText.match(/Notat\s+(.*?)(?=\s*(?:Anamnese|Undersøkelse|Behandling|Diagnose|Journal|$))/si);

  if (anamneseMatch) entry.anamnese = anamneseMatch[1].trim();
  if (undersøkelseMatch) entry.undersøkelse = undersøkelseMatch[1].trim();
  if (behandlingMatch) entry.behandling = behandlingMatch[1].trim();
  if (notatMatch) entry.notat = notatMatch[1].trim();

  return entry;
};

/**
 * Extract treatment techniques from behandling text
 */
export const extractTreatmentTechniques = (behandlingText) => {
  if (!behandlingText) return [];

  const techniques = [];

  // Extract SMT (Spinal Manipulative Therapy)
  const smtMatches = behandlingText.matchAll(/SMT\s+([C|T|L]\d+)\s+(PR|PL|PRS|PLS)\s*(\+{1,2})?/gi);
  for (const match of smtMatches) {
    techniques.push({
      type: 'SMT',
      segment: match[1],
      direction: match[2],
      intensity: match[3] ? match[3].length : 1
    });
  }

  // Extract IS-ledd adjustments
  const isLeddMatches = behandlingText.matchAll(/IS-ledd\s+(PIR|PIL|ASR|ASL)\s*(\+{1,2})?/gi);
  for (const match of isLeddMatches) {
    techniques.push({
      type: 'IS-ledd',
      position: match[1],
      intensity: match[2] ? match[2].length : 1
    });
  }

  // Extract EMT (Extremity Manipulative Therapy)
  const emtMatches = behandlingText.matchAll(/EMT\s+(\w+)\s*(Hø|Ve|bilat)?\s*(\+{1,2})?/gi);
  for (const match of emtMatches) {
    techniques.push({
      type: 'EMT',
      location: match[1],
      side: match[2] || 'bilateral',
      intensity: match[3] ? match[3].length : 1
    });
  }

  // Extract IMS (Intramuscular Stimulation)
  const imsMatches = behandlingText.matchAll(/IMS\s+([\w\s]+?)(?:Hø|Ve|bilat)?\s*(?=\n|$)/gi);
  for (const match of imsMatches) {
    techniques.push({
      type: 'IMS',
      target: match[1].trim(),
      modality: 'dry needling'
    });
  }

  // Extract stretching/Tøy
  const stretchMatches = behandlingText.matchAll(/Tøy\s+([\w\s]+?)\s*(Hø|Ve|bilat)?\s*x?(\d+)?/gi);
  for (const match of stretchMatches) {
    techniques.push({
      type: 'Stretching',
      muscle: match[1].trim(),
      side: match[2] || 'bilateral',
      repetitions: match[3] ? parseInt(match[3]) : 1
    });
  }

  // Extract TBB (Shockwave therapy)
  const tbbMatches = behandlingText.matchAll(/TBB\s+([\d/,]+)\s+([\w\s]+)/gi);
  for (const match of tbbMatches) {
    techniques.push({
      type: 'TBB',
      parameters: match[1],
      location: match[2].trim()
    });
  }

  return techniques;
};

/**
 * Extract examination findings from undersøkelse text
 */
export const extractExaminationFindings = (undersøkelseText) => {
  if (!undersøkelseText) return {};

  const findings = {
    mobility: [],
    palpation: [],
    tests: {},
    strength: [],
    neurological: []
  };

  // Extract hypomobility findings
  const hypomobilMatches = undersøkelseText.matchAll(/Hypomobil\s+(?:og\s+palpøm\s+)?([\w\s,-]+)/gi);
  for (const match of hypomobilMatches) {
    findings.mobility.push({
      type: 'hypomobile',
      location: match[1].trim()
    });
  }

  // Extract test results
  Object.keys(EXAMINATION_TESTS).forEach(test => {
    const regex = new RegExp(`${test}\\s*(ua|positiv|negativ|pos|neg|redusert)?\\s*(Hø|Ve|bilat)?`, 'gi');
    const match = undersøkelseText.match(regex);
    if (match) {
      const result = match[0].toLowerCase().includes('ua') ? 'unremarkable' :
                    match[0].toLowerCase().includes('pos') ? 'positive' :
                    match[0].toLowerCase().includes('neg') ? 'negative' :
                    match[0].toLowerCase().includes('redusert') ? 'reduced' : 'performed';
      findings.tests[test] = {
        result,
        side: match[0].includes('Hø') ? 'right' : match[0].includes('Ve') ? 'left' : 'bilateral'
      };
    }
  });

  // Extract strength findings
  const strengthMatches = undersøkelseText.matchAll(/Svak:?\s*([\w\s,]+)/gi);
  for (const match of strengthMatches) {
    findings.strength.push({
      type: 'weak',
      muscles: match[1].trim()
    });
  }

  return findings;
};

/**
 * Create training examples from journal entry
 */
export const createTrainingExamplesFromEntry = (entry) => {
  const examples = [];

  // Example 1: Anamnese -> Examination prediction
  if (entry.anamnese && entry.undersøkelse) {
    examples.push({
      prompt: `Basert på følgende anamnese, hva ville du forvente å finne ved undersøkelse?\n\nAnamnese: ${entry.anamnese}`,
      response: `Undersøkelse: ${entry.undersøkelse}`,
      type: 'anamnese_to_examination'
    });
  }

  // Example 2: Anamnese + Examination -> Treatment
  if (entry.anamnese && entry.undersøkelse && entry.behandling) {
    examples.push({
      prompt: `Gitt følgende anamnese og undersøkelse, hva er passende behandling?\n\nAnamnese: ${entry.anamnese}\n\nUndersøkelse: ${entry.undersøkelse}`,
      response: `Behandling: ${entry.behandling}`,
      type: 'clinical_reasoning_to_treatment'
    });
  }

  // Example 3: Treatment technique extraction
  if (entry.behandling) {
    const techniques = extractTreatmentTechniques(entry.behandling);
    if (techniques.length > 0) {
      examples.push({
        prompt: `Ekstraher behandlingsteknikker fra følgende behandlingsnotat:\n\n${entry.behandling}`,
        response: JSON.stringify(techniques, null, 2),
        type: 'treatment_extraction'
      });
    }
  }

  // Example 4: Symptom to body region mapping
  if (entry.anamnese) {
    const symptoms = extractSymptomsFromAnamnese(entry.anamnese);
    if (symptoms.length > 0) {
      examples.push({
        prompt: `Identifiser symptomer og lokalisasjoner fra følgende anamnese:\n\n${entry.anamnese}`,
        response: JSON.stringify(symptoms, null, 2),
        type: 'symptom_extraction'
      });
    }
  }

  return examples;
};

/**
 * Extract symptoms from anamnese text
 */
export const extractSymptomsFromAnamnese = (anamneseText) => {
  if (!anamneseText) return [];

  const symptoms = [];
  const lowerText = anamneseText.toLowerCase();

  // Extract pain locations
  COMMON_FINDINGS.pain_locations.forEach(location => {
    if (lowerText.includes(location)) {
      // Extract context around the location
      const regex = new RegExp(`(\\w+\\s+){0,5}${location}(\\s+\\w+){0,5}`, 'gi');
      const matches = anamneseText.match(regex);
      if (matches) {
        matches.forEach(context => {
          symptoms.push({
            type: 'pain_location',
            location,
            context: context.trim()
          });
        });
      }
    }
  });

  // Extract pain descriptors
  COMMON_FINDINGS.pain_descriptors.forEach(descriptor => {
    if (lowerText.includes(descriptor)) {
      symptoms.push({
        type: 'pain_descriptor',
        descriptor
      });
    }
  });

  // Extract temporal patterns
  COMMON_FINDINGS.temporal_patterns.forEach(pattern => {
    if (lowerText.includes(pattern)) {
      symptoms.push({
        type: 'temporal_pattern',
        pattern
      });
    }
  });

  return symptoms;
};

/**
 * Parse multiple journal entries from text blob
 */
export const parseMultipleEntries = (journalTextBlob) => {
  // Split by common delimiters (dates, practitioner names, etc.)
  const entries = [];

  // Split by date pattern or "Anamnese" keyword
  const sections = journalTextBlob.split(/(?=Anamnese\s+)/);

  sections.forEach(section => {
    if (section.trim().length > 20) { // Ignore very short sections
      const parsed = parseJournalEntry(section);
      if (parsed.anamnese || parsed.behandling) { // Only include if has content
        entries.push(parsed);
      }
    }
  });

  return entries;
};

/**
 * Create comprehensive training dataset from Sindre's journals
 */
export const createSindreTrainingDataset = (journalsText) => {
  logger.info('Creating training dataset from Sindre journals...');

  const entries = parseMultipleEntries(journalsText);
  const allExamples = [];
  const vocabulary = {
    anatomical: ANATOMICAL_ABBREVIATIONS,
    treatments: TREATMENT_ABBREVIATIONS,
    tests: EXAMINATION_TESTS,
    patterns: COMMON_FINDINGS
  };

  entries.forEach((entry, index) => {
    const examples = createTrainingExamplesFromEntry(entry);
    allExamples.push(...examples);

    if ((index + 1) % 100 === 0) {
      logger.info(`Processed ${index + 1} journal entries...`);
    }
  });

  logger.info(`Created ${allExamples.length} training examples from ${entries.length} journal entries`);

  return {
    examples: allExamples,
    vocabulary,
    statistics: {
      total_entries: entries.length,
      total_examples: allExamples.length,
      example_types: {
        anamnese_to_examination: allExamples.filter(e => e.type === 'anamnese_to_examination').length,
        clinical_reasoning_to_treatment: allExamples.filter(e => e.type === 'clinical_reasoning_to_treatment').length,
        treatment_extraction: allExamples.filter(e => e.type === 'treatment_extraction').length,
        symptom_extraction: allExamples.filter(e => e.type === 'symptom_extraction').length
      }
    }
  };
};

/**
 * Generate follow-up request patterns from journals
 */
export const extractFollowUpPatterns = (journalsText) => {
  const followUpPatterns = [];
  const entries = parseMultipleEntries(journalsText);

  entries.forEach(entry => {
    if (entry.notat) {
      const notat = entry.notat.toLowerCase();

      // Common follow-up patterns
      if (notat.includes('oppfølging') || notat.includes('kontroll')) {
        followUpPatterns.push({
          type: 'scheduled_followup',
          context: entry.notat,
          indicators: ['oppfølging', 'kontroll']
        });
      }

      if (notat.includes('henviser') || notat.includes('mr') || notat.includes('rtg')) {
        followUpPatterns.push({
          type: 'imaging_referral',
          context: entry.notat,
          indicators: ['henviser', 'mr', 'rtg', 'ultralyd']
        });
      }

      if (notat.includes('øvelser') || notat.includes('hjemmeøvelser')) {
        followUpPatterns.push({
          type: 'home_exercise',
          context: entry.notat,
          indicators: ['øvelser', 'hjemmeøvelser', 'egentrening']
        });
      }
    }
  });

  return {
    patterns: followUpPatterns,
    statistics: {
      total_followups: followUpPatterns.length,
      by_type: {
        scheduled: followUpPatterns.filter(p => p.type === 'scheduled_followup').length,
        imaging: followUpPatterns.filter(p => p.type === 'imaging_referral').length,
        exercise: followUpPatterns.filter(p => p.type === 'home_exercise').length
      }
    }
  };
};

export default {
  parseJournalEntry,
  parseMultipleEntries,
  extractTreatmentTechniques,
  extractExaminationFindings,
  extractSymptomsFromAnamnese,
  createTrainingExamplesFromEntry,
  createSindreTrainingDataset,
  extractFollowUpPatterns,
  ANATOMICAL_ABBREVIATIONS,
  TREATMENT_ABBREVIATIONS,
  EXAMINATION_TESTS,
  COMMON_FINDINGS
};
