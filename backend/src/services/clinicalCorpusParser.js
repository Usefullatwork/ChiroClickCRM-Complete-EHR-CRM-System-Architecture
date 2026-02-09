/**
 * Clinical Corpus Parser
 * Parse Norwegian clinical notes corpus and extract templates for AI training
 * Processes SOPE (Subjective, Objective, Plan, Evaluation) notes
 */

import loggerModule from '../utils/logger.js';
const logger = loggerModule;

/**
 * Parse a single clinical note from corpus
 * Extracts structured data from Norwegian clinical notes
 */
export const parseClinicalNote = (noteText) => {
  const note = {
    metadata: {},
    sections: {},
    raw: noteText,
  };

  // Extract metadata (date, type)
  const dateMatch = noteText.match(/Dato:\s*(\d{2}\.\d{2}\.\d{4})/i);
  if (dateMatch) {
    note.metadata.date = dateMatch[1];
  }

  // Determine note type
  if (noteText.includes('Anamnese:')) {
    note.type = 'anamnese';
  } else if (noteText.includes('Undersøkelse:')) {
    note.type = 'undersøkelse';
  } else if (noteText.includes('Behandling:')) {
    note.type = 'behandling';
  } else if (noteText.includes('Konklusjon:')) {
    note.type = 'konklusjon';
  } else {
    note.type = 'mixed';
  }

  // Extract sections
  note.sections = extractSections(noteText);

  // Extract anatomical regions
  note.regions = extractAnatomicalRegions(noteText);

  // Extract treatment techniques
  note.techniques = extractTreatmentTechniques(noteText);

  // Extract common phrases
  note.commonPhrases = extractCommonPhrases(noteText);

  return note;
};

/**
 * Extract sections from clinical note
 */
const extractSections = (text) => {
  const sections = {};

  // Section patterns
  const sectionPatterns = {
    anamnese: /Anamnese:([\s\S]*?)(?=\n(?:Undersøkelse|Behandling|Konklusjon|Journalnotat:|$))/i,
    undersøkelse:
      /Undersøkelse:([\s\S]*?)(?=\n(?:Anamnese|Behandling|Konklusjon|Journalnotat:|$))/i,
    behandling: /Behandling:([\s\S]*?)(?=\n(?:Anamnese|Undersøkelse|Konklusjon|Journalnotat:|$))/i,
    konklusjon: /Konklusjon:([\s\S]*?)(?=\n(?:Anamnese|Undersøkelse|Behandling|Journalnotat:|$))/i,

    // Specific examination sections
    cervical: /Cervical\s*undersøkelse:([\s\S]*?)(?=\n(?:[A-Z][a-zæøå]+:|Behandling:|$))/i,
    lumbal:
      /Lumbal(?:columna)?\s*(?:undersøkelse)?:([\s\S]*?)(?=\n(?:[A-Z][a-zæøå]+:|Behandling:|$))/i,
    skulder: /Skulder\s*(?:undersøkelse)?:([\s\S]*?)(?=\n(?:[A-Z][a-zæøå]+:|Behandling:|$))/i,
    hofte: /Hofte\s*(?:undersøkelse)?:([\s\S]*?)(?=\n(?:[A-Z][a-zæøå]+:|Behandling:|$))/i,

    // Examination components
    observasjon: /Observasjon:([\s\S]*?)(?=\n[A-Z][a-zæøå]+:|$)/i,
    arom_prom: /(?:Arom|AROM)\/(?:Prom|PROM):([\s\S]*?)(?=\n[A-Z][a-zæøå]+:|$)/i,
    palpasjon: /Palpasjon:([\s\S]*?)(?=\n[A-Z][a-zæøå]+:|$)/i,
    reflekser: /Reflekser:([\s\S]*?)(?=\n[A-Z][a-zæøå]+:|$)/i,
    isometriske_tester: /Isometriske\s*tester:([\s\S]*?)(?=\n[A-Z][a-zæøå]+:|$)/i,
    sensibilitet: /Sensibilitet:([\s\S]*?)(?=\n[A-Z][a-zæøå]+:|$)/i,
  };

  for (const [key, pattern] of Object.entries(sectionPatterns)) {
    const match = text.match(pattern);
    if (match) {
      sections[key] = match[1].trim();
    }
  }

  return sections;
};

/**
 * Extract anatomical regions mentioned
 */
const extractAnatomicalRegions = (text) => {
  const regions = new Set();

  const regionKeywords = {
    cervical: ['cervical', 'nakke', 'halsen', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7'],
    thoracal: [
      'thoracal',
      'thorax',
      'bryst',
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
    lumbal: ['lumbal', 'korsrygg', 'lumbalen', 'L1', 'L2', 'L3', 'L4', 'L5'],
    sacrum: ['sacrum', 'sacral', 'S1', 'S2', 'bekken', 'SI ledd', 'SI-ledd'],
    skulder: ['skulder', 'shoulder', 'scapula', 'skulderblad'],
    albue: ['albue', 'elbow', 'epikondyl'],
    håndledd: ['håndledd', 'wrist', 'carpalia'],
    hofte: ['hofte', 'hip', 'lyske'],
    kne: ['kne', 'knee', 'patella'],
    ankel: ['ankel', 'ankle', 'talus', 'calcaneus'],
    fot: ['fot', 'foot', 'plantar'],
  };

  const lowerText = text.toLowerCase();
  for (const [region, keywords] of Object.entries(regionKeywords)) {
    if (keywords.some((keyword) => lowerText.includes(keyword.toLowerCase()))) {
      regions.add(region);
    }
  }

  return Array.from(regions);
};

/**
 * Extract treatment techniques used
 */
const extractTreatmentTechniques = (text) => {
  const techniques = new Set();

  const techniquePatterns = {
    bvm: /\b(?:bvm|bløtvevsbehandling|myofascial release)\b/gi,
    ims: /\b(?:ims|nålebehandling|dry needling)\b/gi,
    hvla: /\b(?:hvla|manipulasjon|leddkorrigering)\b/gi,
    tgp: /\b(?:tgp|triggerpunkt|trigger punkt)\b/gi,
    inhib: /\b(?:inhib|inhibering|inhibisjon)\b/gi,
    traksjon: /\b(?:traksjon|traction)\b/gi,
    mobilisering: /\b(?:mobilisering|mobilization|art)\b/gi,
    gapping: /\bgapping\b/gi,
    got: /\bGOT\b/g,
    met: /\b(?:MET|muscle energy)\b/gi,
    counterstrain: /\bcounterstrain\b/gi,
    eswt: /\b(?:ESWT|trykkbølge|shockwave)\b/gi,
    iastm: /\b(?:IASTM|instrument assisted)\b/gi,
  };

  for (const [technique, pattern] of Object.entries(techniquePatterns)) {
    if (pattern.test(text)) {
      techniques.add(technique);
    }
  }

  return Array.from(techniques);
};

/**
 * Extract common clinical phrases for template building
 */
const extractCommonPhrases = (text) => {
  const phrases = {
    positive_findings: [],
    negative_findings: [],
    treatment_outcomes: [],
    patient_responses: [],
  };

  // Positive findings (pain, restriction, etc.)
  const positivePatterns = [
    /\b(?:palpasjonsøm|hyperton|restriktiv|vondt|smerter|begrenset)\b/gi,
    /\b(?:trigger(?:er)?\s+(?:kjent\s+)?smerte|reproduserer\s+smerte)\b/gi,
    /\b(?:nedsatt|redusert)\s+(?:bevegelighet|bevegelsesutslag|ROM)\b/gi,
  ];

  positivePatterns.forEach((pattern) => {
    const matches = text.match(pattern);
    if (matches) {
      phrases.positive_findings.push(...matches.map((m) => m.toLowerCase()));
    }
  });

  // Negative findings (ua, normale, ingen)
  const negativePatterns = [
    /\bua\b/gi,
    /\b(?:ingen|ikke)\s+(?:ømhet|smerter|restriksjon|begrenset)\b/gi,
    /\b(?:normal|normale|symmetrisk|intakt)\b/gi,
    /\bnegativ(?:\s+bilateral)?\b/gi,
  ];

  negativePatterns.forEach((pattern) => {
    const matches = text.match(pattern);
    if (matches) {
      phrases.negative_findings.push(...matches.map((m) => m.toLowerCase()));
    }
  });

  // Treatment outcomes
  const outcomePatterns = [
    /\bslipper\s+(?:bra|ok|godt)\b/gi,
    /\b(?:bedre|bedring|god fremgang|mye bedre)\b/gi,
    /\b(?:øm etter sist|reaksjon)\b/gi,
  ];

  outcomePatterns.forEach((pattern) => {
    const matches = text.match(pattern);
    if (matches) {
      phrases.treatment_outcomes.push(...matches.map((m) => m.toLowerCase()));
    }
  });

  // Patient responses
  const responsePatterns = [
    /pasienten\s+(?:samtykker|klager|rapporterer|opplever|beskriver|presenterer)/gi,
    /pasienten\s+(?:har|har hatt|oppsøker)/gi,
  ];

  responsePatterns.forEach((pattern) => {
    const matches = text.match(pattern);
    if (matches) {
      phrases.patient_responses.push(...matches.map((m) => m.toLowerCase()));
    }
  });

  return phrases;
};

/**
 * Parse entire corpus of clinical notes
 */
export const parseCorpus = (corpusText) => {
  logger.info('Parsing clinical notes corpus...');

  // Split corpus into individual notes
  const notePattern = /Journalnotat:[^\n]+/g;
  const notes = [];
  const matches = corpusText.split(/(?=Journalnotat:)/);

  matches.forEach((noteText, index) => {
    if (noteText.trim().length > 50) {
      try {
        const parsed = parseClinicalNote(noteText.trim());
        parsed.id = `note_${index + 1}`;
        notes.push(parsed);
      } catch (error) {
        logger.error(`Error parsing note ${index + 1}:`, error.message);
      }
    }
  });

  logger.info(`Parsed ${notes.length} clinical notes`);

  return {
    totalNotes: notes.length,
    notes,
    statistics: generateCorpusStatistics(notes),
  };
};

/**
 * Generate statistics from parsed corpus
 */
const generateCorpusStatistics = (notes) => {
  const stats = {
    noteTypes: {},
    regions: {},
    techniques: {},
    totalSections: 0,
  };

  notes.forEach((note) => {
    // Count note types
    stats.noteTypes[note.type] = (stats.noteTypes[note.type] || 0) + 1;

    // Count regions
    note.regions.forEach((region) => {
      stats.regions[region] = (stats.regions[region] || 0) + 1;
    });

    // Count techniques
    note.techniques.forEach((technique) => {
      stats.techniques[technique] = (stats.techniques[technique] || 0) + 1;
    });

    // Count sections
    stats.totalSections += Object.keys(note.sections).length;
  });

  return stats;
};

/**
 * Extract templates from corpus for database seeding
 */
export const extractTemplates = (parsedCorpus) => {
  logger.info('Extracting templates from corpus...');

  const templates = [];
  const templateMap = new Map(); // To avoid duplicates

  parsedCorpus.notes.forEach((note) => {
    // Extract examination templates
    if (note.sections.cervical) {
      addTemplate(
        templateMap,
        'Cervical',
        'Undersøkelse',
        'Cervical eksempel fra praksis',
        note.sections.cervical,
        'objective'
      );
    }

    if (note.sections.lumbal) {
      addTemplate(
        templateMap,
        'Korsrygg',
        'Undersøkelse',
        'Lumbal eksempel fra praksis',
        note.sections.lumbal,
        'objective'
      );
    }

    // Extract treatment templates
    if (note.sections.behandling) {
      const region = note.regions[0] || 'Generelt';
      addTemplate(
        templateMap,
        region.charAt(0).toUpperCase() + region.slice(1),
        'Behandling',
        'Behandlingseksempel',
        note.sections.behandling,
        'plan'
      );
    }

    // Extract anamnese templates
    if (note.sections.anamnese) {
      const region = note.regions[0] || 'Generelt';
      addTemplate(
        templateMap,
        region.charAt(0).toUpperCase() + region.slice(1),
        'Anamnese',
        'Anamnese eksempel',
        note.sections.anamnese,
        'subjective'
      );
    }

    // Extract common findings patterns
    if (note.sections.palpasjon) {
      addTemplate(
        templateMap,
        'Palpasjon',
        'Funn',
        'Palpasjonseksempel',
        note.sections.palpasjon,
        'objective'
      );
    }
  });

  return Array.from(templateMap.values());
};

/**
 * Helper to add template (avoids duplicates)
 */
const addTemplate = (templateMap, category, subcategory, name, text, soapSection) => {
  const key = `${category}_${subcategory}_${text.substring(0, 50)}`;

  if (!templateMap.has(key) && text.length > 20 && text.length < 2000) {
    templateMap.set(key, {
      category,
      subcategory,
      template_name: name,
      template_text: text.trim(),
      soap_section: soapSection,
      language: 'NO',
      is_system: false,
      usage_count: 0,
    });
  }
};

/**
 * Create training examples from corpus
 * Format for AI training pipeline
 */
export const createTrainingExamples = (parsedCorpus) => {
  logger.info('Creating training examples from corpus...');

  const examples = [];

  parsedCorpus.notes.forEach((note) => {
    // Example 1: Anamnese -> Undersøkelse
    if (note.sections.anamnese && note.sections.undersøkelse) {
      examples.push({
        prompt: `Basert på følgende anamnese, hva ville du forvente å finne ved undersøkelse?\n\nAnamnese: ${note.sections.anamnese}`,
        response: `Undersøkelse: ${note.sections.undersøkelse}`,
        metadata: {
          type: 'anamnese_to_exam',
          regions: note.regions,
          noteId: note.id,
        },
      });
    }

    // Example 2: Anamnese + Undersøkelse -> Konklusjon
    if (note.sections.anamnese && note.sections.undersøkelse && note.sections.konklusjon) {
      examples.push({
        prompt: `Basert på følgende funn, hva er din konklusjon?\n\nAnamnese: ${note.sections.anamnese}\n\nUndersøkelse: ${note.sections.undersøkelse}`,
        response: `Konklusjon: ${note.sections.konklusjon}`,
        metadata: {
          type: 'findings_to_conclusion',
          regions: note.regions,
          noteId: note.id,
        },
      });
    }

    // Example 3: Full SOAP structure
    if (note.sections.anamnese && note.sections.behandling) {
      examples.push({
        prompt: `Skriv et komplett journalnotat for følgende presentasjon:\n\n${note.sections.anamnese.substring(0, 200)}...`,
        response: note.raw.substring(0, 1000),
        metadata: {
          type: 'full_note',
          regions: note.regions,
          techniques: note.techniques,
          noteId: note.id,
        },
      });
    }

    // Example 4: Treatment technique descriptions
    note.techniques.forEach((technique) => {
      if (note.sections.behandling && note.sections.behandling.includes(technique)) {
        // Extract sentence containing technique
        const sentences = note.sections.behandling.split('.');
        const relevantSentence = sentences.find((s) => s.toLowerCase().includes(technique));

        if (relevantSentence) {
          examples.push({
            prompt: `Hvordan dokumenterer du ${technique} behandling?`,
            response: relevantSentence.trim(),
            metadata: {
              type: 'technique_documentation',
              technique,
              noteId: note.id,
            },
          });
        }
      }
    });
  });

  logger.info(`Created ${examples.length} training examples`);

  return examples;
};

/**
 * Generate SQL seed file from extracted templates
 */
export const generateTemplateSeedSQL = (templates) => {
  const sqlStatements = [];

  sqlStatements.push(`-- Clinical Templates from Corpus Analysis`);
  sqlStatements.push(`-- Auto-generated from Norwegian clinical notes`);
  sqlStatements.push(`-- ${new Date().toISOString()}\n`);

  templates.forEach((template, index) => {
    const escapedText = template.template_text.replace(/'/g, "''");
    const escapedName = template.template_name.replace(/'/g, "''");

    sqlStatements.push(`-- Template ${index + 1}: ${template.category} - ${template.subcategory}`);
    sqlStatements.push(`INSERT INTO clinical_templates (
  organization_id,
  category,
  subcategory,
  template_name,
  template_text,
  language,
  soap_section,
  is_system,
  usage_count
) VALUES (
  NULL,
  '${template.category}',
  '${template.subcategory}',
  '${escapedName}',
  '${escapedText}',
  '${template.language}',
  '${template.soap_section}',
  ${template.is_system},
  ${template.usage_count}
) ON CONFLICT DO NOTHING;\n`);
  });

  return sqlStatements.join('\n');
};

export default {
  parseClinicalNote,
  parseCorpus,
  extractTemplates,
  createTrainingExamples,
  generateTemplateSeedSQL,
  generateCorpusStatistics,
};
