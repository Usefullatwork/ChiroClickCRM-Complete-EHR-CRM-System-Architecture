/**
 * Clinical Data Parser
 * Parses unstructured clinical notes into structured training data
 * Extracts: Anamnese → Undersøkelse → Behandling → Oppfølging → Konklusjon
 */

import logger from '../utils/logger.js';

/**
 * Extract clinical case structure from Norwegian text
 */
export const parseClinicalCase = (text) => {
  const sections = {
    anamnese: '',
    undersokelse: {},
    behandling: '',
    konklusjon: '',
    oppfolging: [],
  };

  try {
    // Extract Anamnese section
    const anamneseMatch = text.match(
      /Anamnese:([^]*?)(?=Undersøkelse:|Undersøkelse:|Beh:|Behandling:|$)/i
    );
    if (anamneseMatch) {
      sections.anamnese = anamneseMatch[1].trim();
    }

    // Extract Undersøkelse section with subsections
    const undersokelseMatch = text.match(/Undersøkelse:([^]*?)(?=Behandling:|Beh:|Konklusjon:|$)/i);
    if (undersokelseMatch) {
      const undersokelseText = undersokelseMatch[1];

      // Extract subsections
      sections.undersokelse = {
        inspeksjon: extractSubsection(undersokelseText, 'Inspeksjon', 'Insp'),
        rom: extractSubsection(undersokelseText, 'ROM'),
        palpasjon: extractSubsection(undersokelseText, 'Palp', 'Palpasjon'),
        ortopediske_tester: extractSubsection(undersokelseText, 'O/N'),
        kraft: extractSubsection(undersokelseText, 'Kraft'),
        lengde: extractSubsection(undersokelseText, 'Lengde'),
        funksjon: extractSubsection(undersokelseText, 'Funksjon'),
      };
    }

    // Extract Behandling
    const behandlingMatch = text.match(/(?:Behandling:|Beh:)([^]*?)(?=Konklusjon:|Oppfølging:|$)/i);
    if (behandlingMatch) {
      sections.behandling = behandlingMatch[1].trim();
    }

    // Extract Konklusjon
    const konklusjonMatch = text.match(/Konklusjon:([^]*?)(?=Oppfølging:|$)/i);
    if (konklusjonMatch) {
      sections.konklusjon = konklusjonMatch[1].trim();
    }

    // Extract Oppfølging notes (may be multiple)
    const oppfolgingMatches = text.matchAll(/Oppfølging:([^]*?)(?=Oppfølging:|Beh:|$)/gi);
    for (const match of oppfolgingMatches) {
      sections.oppfolging.push(match[1].trim());
    }

    return sections;
  } catch (error) {
    logger.error('Error parsing clinical case:', error);
    return null;
  }
};

/**
 * Extract subsection from text
 */
const extractSubsection = (text, ...keywords) => {
  for (const keyword of keywords) {
    const regex = new RegExp(
      `${keyword}[:\\.]?([^]*?)(?=\\n[A-Z]|Palp|ROM|O/N|Kraft|Funksjon|$)`,
      'i'
    );
    const match = text.match(regex);
    if (match) {
      return match[1].trim();
    }
  }
  return '';
};

/**
 * Extract clinical findings (positive and negative)
 */
export const extractFindings = (undersokelseText) => {
  const findings = {
    positive: [],
    negative: [],
  };

  // Positive findings indicators
  const positivePatterns = [
    /\(\+\)([^,\n]+)/g,
    /hypomob\.? og palp\.?øm ([^,\n]+)/gi,
    /økt tonus ([^,\n]+)/gi,
    /nedsatt ([^,\n]+)/gi,
    /palp\.?øm ([^,\n]+)/gi,
    /smerte ved ([^,\n]+)/gi,
  ];

  // Negative findings indicators
  const negativePatterns = [
    /\(-\)([^,\n]+)/g,
    /ingen ([^,\n]+)/gi,
    /u\.a\.?/gi,
    /normal ([^,\n]+)/gi,
  ];

  for (const pattern of positivePatterns) {
    const matches = undersokelseText.matchAll(pattern);
    for (const match of matches) {
      findings.positive.push(match[1]?.trim() || match[0].trim());
    }
  }

  for (const pattern of negativePatterns) {
    const matches = undersokelseText.matchAll(pattern);
    for (const match of matches) {
      findings.negative.push(match[1]?.trim() || match[0].trim());
    }
  }

  return findings;
};

/**
 * Extract treatment components
 */
export const extractTreatment = (behandlingText) => {
  const treatment = {
    manipulation: [],
    soft_tissue: [],
    exercises: [],
    advice: [],
  };

  // Leddjustering/manipulation
  const manipMatches = behandlingText.matchAll(/Leddjustering ([^\.]+)/gi);
  for (const match of manipMatches) {
    treatment.manipulation.push(match[1].trim());
  }

  // Soft tissue (Trp, bvm, ART)
  const softTissueMatches = behandlingText.matchAll(/(?:Trp|bvm|ART)[\/]?\s*([^\.]+)/gi);
  for (const match of softTissueMatches) {
    treatment.soft_tissue.push(match[1].trim());
  }

  // Øvelser
  const exerciseMatches = behandlingText.matchAll(/Øvelse[rs]?:([^\.]+)/gi);
  for (const match of exerciseMatches) {
    treatment.exercises.push(match[1].trim());
  }

  // Råd
  const adviceMatches = behandlingText.matchAll(/Råd om ([^\.]+)/gi);
  for (const match of adviceMatches) {
    treatment.advice.push(match[1].trim());
  }

  return treatment;
};

/**
 * Classify case by body region and pathology
 */
export const classifyCase = (text) => {
  const classification = {
    region: [],
    pathology: [],
    category: '',
  };

  // Body regions
  const regionKeywords = {
    Cervical: ['nakke', 'cervical', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7'],
    Thoracic: [
      'brystrygg',
      'thoracal',
      'torakal',
      'T1',
      'T2',
      'T3',
      'T4',
      'T5',
      'T6',
      'T7',
      'T8',
      'T9',
      'T10',
      'T11',
      'T12',
    ],
    Lumbar: ['korsrygg', 'lumbal', 'L1', 'L2', 'L3', 'L4', 'L5'],
    Pelvis: ['bekken', 'IS ledd', 'IS-ledd', 'sacrum', 'ilium', 'PI ilium', 'P-R sacr'],
    Shoulder: ['skulder', 'rotator', 'supraspinatus', 'infraspinatus', 'subscapularis'],
    Elbow: ['albue', 'epikondyl', 'tennisalbue'],
    Wrist: ['håndledd', 'håndledds'],
    Hip: ['hofte', 'hofteledd', 'trochanteritt'],
    Knee: ['kne', 'kneet', 'patella', 'menisk'],
    Ankle: ['ankel', 'ankelen', 'talus', 'calcaneus'],
    Foot: ['fot', 'foten', 'plantar'],
  };

  // Pathologies
  const pathologyKeywords = {
    Fasettleddsdysfunksjon: ['fasettledd', 'fasettledds'],
    Myalgi: ['myalgi', 'myalgier', 'muskelsmerte', 'triggerpunkt'],
    Tendinopati: ['tendinopati', 'tendinose', 'sene'],
    Artrose: ['artrose'],
    Radikulopati: ['isjias', 'radikulopati', 'nerverot'],
    Skivelidelse: ['skive', 'prolaps', 'disc'],
    Bekkenleddsdysfunksjon: ['bekkenledd', 'IS ledd', 'sacroiliac'],
    BPPV: ['BPPV', 'svimmelhet', 'vertigo', 'Dix-Hallpike'],
    Hodepine: ['hodepine', 'tensjonshodepine', 'migrene'],
    Graviditet: ['gravid', 'svangerskap'],
    Kapsulitt: ['kapsulitt', 'frozen shoulder', 'adhesiv'],
    Impingement: ['impingement'],
    'Plantar Fascitt': ['plantar fasc'],
  };

  const lowerText = text.toLowerCase();

  // Classify regions
  for (const [region, keywords] of Object.entries(regionKeywords)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        if (!classification.region.includes(region)) {
          classification.region.push(region);
        }
      }
    }
  }

  // Classify pathologies
  for (const [pathology, keywords] of Object.entries(pathologyKeywords)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        if (!classification.pathology.includes(pathology)) {
          classification.pathology.push(pathology);
        }
      }
    }
  }

  // Determine primary category
  if (classification.region.length > 0) {
    classification.category = classification.region[0];
  }

  return classification;
};

/**
 * Convert clinical case to training example (Few-shot format)
 */
export const convertToTrainingExample = (caseText) => {
  const parsed = parseClinicalCase(caseText);
  if (!parsed) {
    return null;
  }

  const classification = classifyCase(caseText);
  const findings = parsed.undersokelse
    ? extractFindings(JSON.stringify(parsed.undersokelse))
    : { positive: [], negative: [] };
  const treatment = parsed.behandling ? extractTreatment(parsed.behandling) : {};

  return {
    // Input: What the AI will see as a prompt
    input: {
      chief_complaint: extractChiefComplaint(parsed.anamnese),
      symptoms: extractSymptoms(parsed.anamnese),
      region: classification.region,
      category: classification.category,
    },

    // Output: What the AI should generate
    output: {
      subjective: parsed.anamnese,
      objective: {
        inspection: parsed.undersokelse.inspeksjon || '',
        rom: parsed.undersokelse.rom || '',
        palpation: parsed.undersokelse.palpasjon || '',
        ortho_tests: parsed.undersokelse.ortopediske_tester || '',
        positive_findings: findings.positive,
        negative_findings: findings.negative,
      },
      assessment: parsed.konklusjon,
      plan: {
        manipulation: treatment.manipulation || [],
        soft_tissue: treatment.soft_tissue || [],
        exercises: treatment.exercises || [],
        advice: treatment.advice || [],
      },
    },

    // Metadata for organization
    metadata: {
      classification: classification,
      has_followup: parsed.oppfolging.length > 0,
      outcome:
        parsed.oppfolging.length > 0
          ? extractOutcome(parsed.oppfolging[parsed.oppfolging.length - 1])
          : null,
    },
  };
};

/**
 * Extract chief complaint from anamnese
 */
const extractChiefComplaint = (anamneseText) => {
  if (!anamneseText) {
    return '';
  }

  // Take first 1-2 sentences
  const sentences = anamneseText.split(/\.\s+/);
  return sentences.slice(0, 2).join('. ').trim();
};

/**
 * Extract key symptoms
 */
const extractSymptoms = (anamneseText) => {
  if (!anamneseText) {
    return [];
  }

  const symptoms = [];
  const symptomPatterns = [
    /smerte i ([^,\.]+)/gi,
    /vondt i ([^,\.]+)/gi,
    /stiv[t]? ([^,\.]+)/gi,
    /utstråling ([^,\.]+)/gi,
  ];

  for (const pattern of symptomPatterns) {
    const matches = anamneseText.matchAll(pattern);
    for (const match of matches) {
      symptoms.push(match[1].trim());
    }
  }

  return symptoms;
};

/**
 * Extract outcome from follow-up note
 */
const extractOutcome = (oppfolgingText) => {
  if (!oppfolgingText) {
    return null;
  }

  const outcome = {
    status: 'unknown',
    improvement: null,
    pain_reduction: null,
  };

  const lowerText = oppfolgingText.toLowerCase();

  // Status keywords
  if (lowerText.includes('god bedring') || lowerText.includes('mye bedre')) {
    outcome.status = 'improved';
    outcome.improvement = 'significant';
  } else if (lowerText.includes('bedre') || lowerText.includes('lettere')) {
    outcome.status = 'improved';
    outcome.improvement = 'moderate';
  } else if (lowerText.includes('ikke bedre') || lowerText.includes('verre')) {
    outcome.status = 'worse';
  } else if (lowerText.includes('uendret') || lowerText.includes('lik')) {
    outcome.status = 'unchanged';
  }

  return outcome;
};

/**
 * Convert to JSONL format for fine-tuning
 */
export const convertToJSONL = (trainingExamples) =>
  trainingExamples
    .filter((ex) => ex !== null)
    .map((example) =>
      // Format for OpenAI/Anthropic fine-tuning
      JSON.stringify({
        messages: [
          {
            role: 'system',
            content:
              'Du er en erfaren kiropraktor i Norge. Basert på pasientens hovedplage og symptomer, generer strukturerte kliniske notater i SOAP-format.',
          },
          {
            role: 'user',
            content: `Hovedplage: ${example.input.chief_complaint}\nSymptomer: ${example.input.symptoms.join(', ')}\nRegion: ${example.input.region.join(', ')}`,
          },
          {
            role: 'assistant',
            content: JSON.stringify(example.output, null, 2),
          },
        ],
      })
    )
    .join('\n');

export default {
  parseClinicalCase,
  extractFindings,
  extractTreatment,
  classifyCase,
  convertToTrainingExample,
  convertToJSONL,
};
