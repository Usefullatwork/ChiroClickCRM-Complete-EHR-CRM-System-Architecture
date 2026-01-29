/**
 * Sigrun Journal Parser
 * Parse and extract training data from Sigrun's chiropractic journals
 * Handles Sigrun's abbreviated, lowercase note-taking style
 *
 * NOTE: This parser now supports loading terminology from the modular template system.
 * The constants below are maintained for backward compatibility.
 * For new implementations, use the TemplateService from '../templates/index.js'
 *
 * Example using TemplateService:
 *   import { templateService } from '../templates/index.js';
 *   const templates = await templateService.loadForDocumentType('journal', { practitioner: 'sigrun' });
 */

import logger from '../utils/logger.js';
import * as sindreParser from './sindreJournalParser.js';

// Optional: Import from template system for enhanced terminology
// Uncomment to use template-based terminology:
// import {
//   SIGRUN_TREATMENT_PATTERNS as TEMPLATE_PATTERNS,
//   SIGRUN_ASSESSMENT_PATTERNS as TEMPLATE_ASSESSMENT
// } from '../templates/terminology.js';

/**
 * Sigrun-specific treatment abbreviations
 * She uses more abbreviated, lowercase style
 */
export const SIGRUN_TREATMENT_PATTERNS = {
  // Spinal adjustments - lowercase style
  'cx mob': 'Cervical mobilization',
  'tx mob': 'Thoracic mobilization',
  'lx mob': 'Lumbar mobilization',

  // Common Sigrun abbreviations
  'tp': 'Trigger point behandling',
  'trp': 'Trigger point',
  'beh': 'Behandling',
  'rep': 'Repeterer/samme behandling',
  'som sist': 'Samme behandling som sist',
  'oppf': 'Oppfølging',

  // Position-specific
  'supine': 'Ryggleie (supine)',
  'prone': 'mageleie (prone)',
  'side': 'sideleie',

  // Muscle work
  'mass': 'Massasje',
  'tøy': 'Tøying/stretching',
  'løsgjøring': 'Mobilisering/løsgjøring',

  // Common patterns
  'bilat': 'Bilateral',
  've': 'Venstre',
  'hø': 'Høyre'
};

/**
 * Sigrun's common examination/assessment phrases
 */
export const SIGRUN_ASSESSMENT_PATTERNS = {
  improvement: [
    'bedre', 'mye bedre', 'klart bedre', 'gått bedre',
    'føler seg bedre', 'kjenner seg bedre', 'betydelig bedre',
    'slapp', 'løsnet', 'mindre vondt'
  ],
  no_change: [
    'som sist', 'likt', 'samme', 'ikke noe endring',
    'fortsatt', 'fremdeles'
  ],
  worsening: [
    'verre', 'mer vondt', 'økt', 'tilbake til start'
  ],
  location_descriptors: [
    'nakke', 'cx', 'c-col', 'cervical',
    'rygg', 'tx', 't-col', 'thoracic',
    'korsrygg', 'lx', 'l-col', 'lumbar',
    'skulder', 'arm', 'hofte', 'bekken', 'sete'
  ]
};

/**
 * Parse Sigrun's abbreviated treatment notes
 * Example: "beh cx mob supine. t5p. c2 prs"
 */
export const parseSigrunTreatment = (treatmentText) => {
  if (!treatmentText) return [];

  const techniques = [];
  const lowerText = treatmentText.toLowerCase();

  // Pattern 1: Spinal segments with directions (c2 prs, t5p, l4pl)
  const spinalMatches = treatmentText.matchAll(/([cCtTlL]\d+)\s*([pP][rRlLsS]{1,2})\s*(\+{1,2})?/g);
  for (const match of spinalMatches) {
    techniques.push({
      type: 'SMT',
      segment: match[1].toUpperCase(),
      direction: match[2].toUpperCase(),
      intensity: match[3] ? match[3].length : 1,
      practitioner: 'Sigrun'
    });
  }

  // Pattern 2: Mobilization patterns (cx mob, tx mob, lx mob)
  const mobMatches = lowerText.matchAll(/(cx|tx|lx)\s+mob(?:ilization)?/g);
  for (const match of mobMatches) {
    const region = match[1] === 'cx' ? 'Cervical' :
                   match[1] === 'tx' ? 'Thoracic' : 'Lumbar';
    techniques.push({
      type: 'Mobilization',
      region,
      practitioner: 'Sigrun'
    });
  }

  // Pattern 3: Trigger points (tp, trp)
  const tpMatches = treatmentText.matchAll(/t[rp]p?\s+([\w\s]+?)(?=\.|$|beh|cx|tx|lx|\n)/gi);
  for (const match of tpMatches) {
    techniques.push({
      type: 'TriggerPoint',
      target: match[1].trim(),
      practitioner: 'Sigrun'
    });
  }

  // Pattern 4: IS-ledd (sacroiliac)
  const isleddMatches = treatmentText.matchAll(/is(?:-ledd)?\s*(ve|hø|bilat)?/gi);
  for (const match of isleddMatches) {
    techniques.push({
      type: 'IS-ledd',
      side: match[1] || 'bilateral',
      practitioner: 'Sigrun'
    });
  }

  // Pattern 5: Massage/soft tissue (mass, massasje)
  const massageMatches = treatmentText.matchAll(/mass(?:asje)?\s+([\w\s]+?)(?=\.|$|beh|\n)/gi);
  for (const match of massageMatches) {
    techniques.push({
      type: 'Massage',
      target: match[1].trim(),
      practitioner: 'Sigrun'
    });
  }

  // Pattern 6: Stretching (tøy)
  const stretchMatches = treatmentText.matchAll(/tøy\s+([\w\s]+?)(?=\.|$|beh|\n)/gi);
  for (const match of stretchMatches) {
    techniques.push({
      type: 'Stretching',
      target: match[1].trim(),
      practitioner: 'Sigrun'
    });
  }

  return techniques;
};

/**
 * Parse Sigrun's anamnese/subjective notes
 * She often uses brief phrases about improvement
 */
export const parseSigrunAnamnese = (anamneseText) => {
  if (!anamneseText) return null;

  const assessment = {
    raw: anamneseText,
    improvement_status: null,
    locations: [],
    symptoms: []
  };

  const lowerText = anamneseText.toLowerCase();

  // Determine improvement status
  if (SIGRUN_ASSESSMENT_PATTERNS.improvement.some(phrase => lowerText.includes(phrase))) {
    assessment.improvement_status = 'improved';
  } else if (SIGRUN_ASSESSMENT_PATTERNS.no_change.some(phrase => lowerText.includes(phrase))) {
    assessment.improvement_status = 'unchanged';
  } else if (SIGRUN_ASSESSMENT_PATTERNS.worsening.some(phrase => lowerText.includes(phrase))) {
    assessment.improvement_status = 'worsened';
  }

  // Extract body locations mentioned
  SIGRUN_ASSESSMENT_PATTERNS.location_descriptors.forEach(location => {
    if (lowerText.includes(location)) {
      assessment.locations.push(location);
    }
  });

  // Extract symptoms using Sindre's parser (compatible)
  assessment.symptoms = sindreParser.extractSymptomsFromAnamnese(anamneseText);

  return assessment;
};

/**
 * Parse a Sigrun journal entry
 * Her format is more freeform, often just "Anamnese" and "Behandling"
 */
export const parseSigrunEntry = (journalText) => {
  const entry = {
    anamnese: null,
    behandling: null,
    notat: null,
    practitioner: 'Sigrun',
    raw: journalText
  };

  // Sigrun often uses lowercase "beh" or "Behandling"
  const behandlingMatch = journalText.match(/(?:beh|Behandling)[:\s]+(.*?)(?=\n(?:Anamnese|Notat|$)|$)/si);
  if (behandlingMatch) {
    entry.behandling = behandlingMatch[1].trim();
  }

  // Standard Anamnese
  const anamneseMatch = journalText.match(/Anamnese[:\s]+(.*?)(?=\n(?:beh|Behandling|Notat|$)|$)/si);
  if (anamneseMatch) {
    entry.anamnese = anamneseMatch[1].trim();
  }

  // Notat
  const notatMatch = journalText.match(/Notat[:\s]+(.*?)(?=\n(?:Anamnese|beh|Behandling|$)|$)/si);
  if (notatMatch) {
    entry.notat = notatMatch[1].trim();
  }

  return entry;
};

/**
 * Create training examples from Sigrun's entry
 */
export const createSigrunTrainingExamples = (entry) => {
  const examples = [];

  // Example 1: Anamnese assessment -> Treatment
  if (entry.anamnese && entry.behandling) {
    const assessment = parseSigrunAnamnese(entry.anamnese);

    examples.push({
      prompt: `Basert på følgende subjektive funn fra oppfølging, hva er passende behandling?\n\nSubjektivt: ${entry.anamnese}`,
      response: `Behandling: ${entry.behandling}`,
      type: 'followup_to_treatment',
      practitioner: 'Sigrun',
      metadata: {
        improvement_status: assessment?.improvement_status,
        locations: assessment?.locations
      }
    });
  }

  // Example 2: Treatment technique extraction
  if (entry.behandling) {
    const techniques = parseSigrunTreatment(entry.behandling);
    if (techniques.length > 0) {
      examples.push({
        prompt: `Ekstraher behandlingsteknikker fra følgende behandlingsnotat (Sigrun stil):\n\n${entry.behandling}`,
        response: JSON.stringify(techniques, null, 2),
        type: 'treatment_extraction_sigrun',
        practitioner: 'Sigrun'
      });
    }
  }

  // Example 3: Improvement assessment
  if (entry.anamnese) {
    const assessment = parseSigrunAnamnese(entry.anamnese);
    if (assessment.improvement_status) {
      examples.push({
        prompt: `Vurder pasientens fremgang fra følgende oppfølgingsnotat:\n\n${entry.anamnese}`,
        response: `Status: ${assessment.improvement_status}\nLokasjoner: ${assessment.locations.join(', ')}\nSymptomer: ${JSON.stringify(assessment.symptoms)}`,
        type: 'progress_assessment',
        practitioner: 'Sigrun'
      });
    }
  }

  return examples;
};

/**
 * Parse multiple Sigrun entries from text
 */
export const parseSigrunEntries = (journalText) => {
  const entries = [];

  // Sigrun's entries are often separated by date patterns or "Anamnese"
  const sections = journalText.split(/(?=Anamnese|(?:\d{2}\.\d{2}\.\d{4}))/);

  sections.forEach(section => {
    if (section.trim().length > 15) {
      const parsed = parseSigrunEntry(section);
      if (parsed.anamnese || parsed.behandling) {
        entries.push(parsed);
      }
    }
  });

  return entries;
};

/**
 * Create comprehensive training dataset from Sigrun's journals
 */
export const createSigrunTrainingDataset = (journalsText) => {
  logger.info('Creating training dataset from Sigrun journals...');

  const entries = parseSigrunEntries(journalsText);
  const allExamples = [];

  entries.forEach((entry, index) => {
    const examples = createSigrunTrainingExamples(entry);
    allExamples.push(...examples);

    if ((index + 1) % 100 === 0) {
      logger.info(`Processed ${index + 1} Sigrun journal entries...`);
    }
  });

  logger.info(`Created ${allExamples.length} training examples from ${entries.length} Sigrun entries`);

  return {
    examples: allExamples,
    practitioner: 'Sigrun',
    statistics: {
      total_entries: entries.length,
      total_examples: allExamples.length,
      example_types: {
        followup_to_treatment: allExamples.filter(e => e.type === 'followup_to_treatment').length,
        treatment_extraction: allExamples.filter(e => e.type === 'treatment_extraction_sigrun').length,
        progress_assessment: allExamples.filter(e => e.type === 'progress_assessment').length
      }
    }
  };
};

/**
 * Detect if journal text is Sigrun's style vs Sindre's
 */
export const detectPractitionerStyle = (journalText) => {
  const lowerText = journalText.toLowerCase();

  const sigrunIndicators = [
    lowerText.includes('beh:') || lowerText.includes('beh '),
    lowerText.includes('cx mob'),
    lowerText.includes('tp '),
    lowerText.includes('som sist'),
    /[ct]\d+\s*p[rls]{1,2}/.test(lowerText) // lowercase spinal patterns
  ];

  const sindreIndicators = [
    journalText.includes('SMT'),
    journalText.includes('EMT'),
    journalText.includes('IMS'),
    journalText.includes('Sykdommer/Skader/Operasjoner'),
    journalText.includes('Pasienten er informert')
  ];

  const sigrunScore = sigrunIndicators.filter(Boolean).length;
  const sindreScore = sindreIndicators.filter(Boolean).length;

  if (sigrunScore > sindreScore) {
    return { practitioner: 'Sigrun', confidence: sigrunScore / sigrunIndicators.length };
  } else if (sindreScore > sigrunScore) {
    return { practitioner: 'Sindre', confidence: sindreScore / sindreIndicators.length };
  } else {
    return { practitioner: 'Unknown', confidence: 0 };
  }
};

export default {
  parseSigrunEntry,
  parseSigrunEntries,
  parseSigrunTreatment,
  parseSigrunAnamnese,
  createSigrunTrainingExamples,
  createSigrunTrainingDataset,
  detectPractitionerStyle,
  SIGRUN_TREATMENT_PATTERNS,
  SIGRUN_ASSESSMENT_PATTERNS
};
