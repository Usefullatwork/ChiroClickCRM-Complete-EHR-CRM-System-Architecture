/**
 * Translations for Assessment Components
 * Supports English (en) and Norwegian (no)
 */

export const TRANSLATIONS = {
  // =============================================================================
  // COMMON / SHARED
  // =============================================================================
  common: {
    en: {
      save: 'Save',
      cancel: 'Cancel',
      close: 'Close',
      apply: 'Apply',
      copy: 'Copy',
      copied: 'Copied!',
      print: 'Print',
      search: 'Search',
      clear: 'Clear',
      clearAll: 'Clear All',
      edit: 'Edit',
      delete: 'Delete',
      add: 'Add',
      remove: 'Remove',
      select: 'Select',
      selected: 'Selected',
      none: 'None',
      all: 'All',
      yes: 'Yes',
      no: 'No',
      ok: 'OK',
      done: 'Done',
      next: 'Next',
      back: 'Back',
      loading: 'Loading...',
      saving: 'Saving...',
      error: 'Error',
      success: 'Success',
      warning: 'Warning',
      info: 'Info',
      required: 'Required',
      optional: 'Optional',
      minutes: 'minutes',
      min: 'min',
      date: 'Date',
      time: 'Time',
      type: 'Type',
      status: 'Status',
      actions: 'Actions',
      view: 'View',
      details: 'Details',
      notes: 'Notes',
      comments: 'Comments'
    },
    no: {
      save: 'Lagre',
      cancel: 'Avbryt',
      close: 'Lukk',
      apply: 'Bruk',
      copy: 'Kopier',
      copied: 'Kopiert!',
      print: 'Skriv ut',
      search: 'Søk',
      clear: 'Tøm',
      clearAll: 'Tøm alt',
      edit: 'Rediger',
      delete: 'Slett',
      add: 'Legg til',
      remove: 'Fjern',
      select: 'Velg',
      selected: 'Valgt',
      none: 'Ingen',
      all: 'Alle',
      yes: 'Ja',
      no: 'Nei',
      ok: 'OK',
      done: 'Ferdig',
      next: 'Neste',
      back: 'Tilbake',
      loading: 'Laster...',
      saving: 'Lagrer...',
      error: 'Feil',
      success: 'Suksess',
      warning: 'Advarsel',
      info: 'Info',
      required: 'Påkrevd',
      optional: 'Valgfri',
      minutes: 'minutter',
      min: 'min',
      date: 'Dato',
      time: 'Tid',
      type: 'Type',
      status: 'Status',
      actions: 'Handlinger',
      view: 'Vis',
      details: 'Detaljer',
      notes: 'Notater',
      comments: 'Kommentarer'
    }
  },

  // =============================================================================
  // SOAP SECTIONS
  // =============================================================================
  soap: {
    en: {
      subjective: 'Subjective',
      objective: 'Objective',
      assessment: 'Assessment',
      plan: 'Plan',
      chiefComplaint: 'Chief Complaint',
      history: 'History',
      onset: 'Onset',
      painDescription: 'Pain Description',
      aggravatingFactors: 'Aggravating Factors',
      relievingFactors: 'Relieving Factors',
      observation: 'Observation',
      palpation: 'Palpation',
      rangeOfMotion: 'Range of Motion',
      orthopedicTests: 'Orthopedic Tests',
      neurologicalTests: 'Neurological Tests',
      posture: 'Posture',
      gait: 'Gait',
      clinicalReasoning: 'Clinical Reasoning',
      diagnosis: 'Diagnosis',
      differentialDiagnosis: 'Differential Diagnosis',
      prognosis: 'Prognosis',
      treatment: 'Treatment',
      exercises: 'Exercises',
      homeExercises: 'Home Exercises',
      advice: 'Advice',
      patientEducation: 'Patient Education',
      followUp: 'Follow-up',
      referrals: 'Referrals'
    },
    no: {
      subjective: 'Subjektivt',
      objective: 'Objektivt',
      assessment: 'Vurdering',
      plan: 'Plan',
      chiefComplaint: 'Hovedklage',
      history: 'Sykehistorie',
      onset: 'Debut',
      painDescription: 'Smertebeskrivelse',
      aggravatingFactors: 'Forverrende faktorer',
      relievingFactors: 'Lindrende faktorer',
      observation: 'Observasjon',
      palpation: 'Palpasjon',
      rangeOfMotion: 'Bevegelsesutslag',
      orthopedicTests: 'Ortopediske tester',
      neurologicalTests: 'Nevrologiske tester',
      posture: 'Holdning',
      gait: 'Gangmønster',
      clinicalReasoning: 'Klinisk resonnement',
      diagnosis: 'Diagnose',
      differentialDiagnosis: 'Differensialdiagnose',
      prognosis: 'Prognose',
      treatment: 'Behandling',
      exercises: 'Øvelser',
      homeExercises: 'Hjemmeøvelser',
      advice: 'Råd',
      patientEducation: 'Pasientopplæring',
      followUp: 'Oppfølging',
      referrals: 'Henvisninger'
    }
  },

  // =============================================================================
  // SALT BUTTON
  // =============================================================================
  salt: {
    en: {
      title: 'Same As Last Treatment',
      button: 'SALT',
      applied: 'Applied!',
      noHistory: 'No previous encounter',
      cloningFrom: 'Cloning from',
      statusUpdate: 'Patient Status Update',
      sectionsToClone: 'Sections to Clone',
      empty: '(empty)',
      applyNote: 'This will populate fields with data from the previous visit. You can edit after applying.',
      applySalt: 'Apply SALT',
      // Improvement modifiers
      noChange: 'No change',
      slightlyBetter: 'Slightly better',
      '25Better': '25% better',
      '50Better': '50% better',
      '75Better': '75% better',
      muchBetter: 'Much better',
      slightlyWorse: 'Slightly worse',
      muchWorse: 'Much worse',
      newComplaint: 'New complaint',
      // Sections
      sectionSubjective: 'Subjective',
      sectionObjective: 'Objective',
      sectionSpinalFindings: 'Spinal Findings',
      sectionTreatments: 'Treatments',
      sectionExercises: 'Exercises',
      sectionDiagnoses: 'Diagnoses'
    },
    no: {
      title: 'Samme som forrige behandling',
      button: 'SALT',
      applied: 'Brukt!',
      noHistory: 'Ingen tidligere konsultasjon',
      cloningFrom: 'Kopierer fra',
      statusUpdate: 'Pasientens statusoppdatering',
      sectionsToClone: 'Seksjoner å kopiere',
      empty: '(tom)',
      applyNote: 'Dette vil fylle ut felt med data fra forrige besøk. Du kan redigere etterpå.',
      applySalt: 'Bruk SALT',
      // Improvement modifiers
      noChange: 'Ingen endring',
      slightlyBetter: 'Litt bedre',
      '25Better': '25% bedre',
      '50Better': '50% bedre',
      '75Better': '75% bedre',
      muchBetter: 'Mye bedre',
      slightlyWorse: 'Litt verre',
      muchWorse: 'Mye verre',
      newComplaint: 'Ny klage',
      // Sections
      sectionSubjective: 'Subjektivt',
      sectionObjective: 'Objektivt',
      sectionSpinalFindings: 'Ryggfunn',
      sectionTreatments: 'Behandlinger',
      sectionExercises: 'Øvelser',
      sectionDiagnoses: 'Diagnoser'
    }
  },

  // =============================================================================
  // MACRO MATRIX
  // =============================================================================
  macros: {
    en: {
      title: 'Macro Matrix',
      searchPlaceholder: 'Search macros...',
      favorites: 'Favorites',
      customMacros: 'My Macros',
      // Categories
      adjustments: 'Adjustments',
      therapies: 'Therapies',
      findings: 'Findings',
      subjective: 'Subjective',
      plan: 'Plan',
      response: 'Response',
      // Common macros (abbreviated for space)
      cervicalAdj: 'Cervical Adj',
      thoracicAdj: 'Thoracic Adj',
      lumbarAdj: 'Lumbar Adj',
      fullSpine: 'Full Spine',
      eStim: 'E-Stim',
      ultrasound: 'Ultrasound',
      heatPack: 'Heat Pack',
      icePack: 'Ice Pack',
      massage: 'Massage',
      stretching: 'Stretching',
      traction: 'Traction'
    },
    no: {
      title: 'Makromatrise',
      searchPlaceholder: 'Søk i makroer...',
      favorites: 'Favoritter',
      customMacros: 'Mine makroer',
      // Categories
      adjustments: 'Justeringer',
      therapies: 'Behandlinger',
      findings: 'Funn',
      subjective: 'Subjektivt',
      plan: 'Plan',
      response: 'Respons',
      // Common macros
      cervicalAdj: 'Cervikal just.',
      thoracicAdj: 'Torakal just.',
      lumbarAdj: 'Lumbal just.',
      fullSpine: 'Full ryggrad',
      eStim: 'El-stim',
      ultrasound: 'Ultralyd',
      heatPack: 'Varmepakning',
      icePack: 'Ispakning',
      massage: 'Massasje',
      stretching: 'Tøyning',
      traction: 'Traksjon'
    }
  },

  // =============================================================================
  // SLASH COMMANDS
  // =============================================================================
  slashCommands: {
    en: {
      title: 'Slash Commands',
      hint: 'Type "/" for commands',
      navigate: '↑↓ Navigate',
      selectCmd: 'Enter Select',
      noResults: 'No matching commands',
      // Category names
      catSubjective: 'Subjective',
      catObjective: 'Objective',
      catAssessment: 'Assessment',
      catPlan: 'Plan',
      catTreatment: 'Treatment',
      catResponse: 'Response'
    },
    no: {
      title: 'Skråstrek-kommandoer',
      hint: 'Skriv "/" for kommandoer',
      navigate: '↑↓ Naviger',
      selectCmd: 'Enter Velg',
      noResults: 'Ingen treff',
      // Category names
      catSubjective: 'Subjektivt',
      catObjective: 'Objektivt',
      catAssessment: 'Vurdering',
      catPlan: 'Plan',
      catTreatment: 'Behandling',
      catResponse: 'Respons'
    }
  },

  // =============================================================================
  // COMPLIANCE ENGINE
  // =============================================================================
  compliance: {
    en: {
      title: 'Compliance Check',
      score: 'Score',
      issues: 'Issues',
      warnings: 'Warnings',
      suggestions: 'Suggestions',
      allPassed: 'All compliance checks passed!',
      fix: 'Fix',
      autoFixAll: 'Auto-Fix All Issues',
      // Issue types
      redFlag: 'Red Flag',
      missingQualifier: 'Missing Qualifier',
      missingTime: 'Missing Time',
      insufficientTime: 'Insufficient Time',
      diagnosisMismatch: 'Diagnosis Mismatch',
      missingField: 'Missing Field',
      missingDiagnosis: 'Missing Diagnosis',
      missingTreatment: 'Missing Treatment',
      // Severity
      critical: 'Critical',
      high: 'High',
      medium: 'Medium',
      low: 'Low',
      // Common messages
      chiefComplaintRequired: 'Chief complaint is required',
      objectiveRequired: 'Objective findings are required',
      noDiagnosis: 'No diagnosis code selected',
      noTreatment: 'No treatment documented',
      adjustmentNoSublux: 'Adjustment performed but no subluxation/joint dysfunction documented in Objective',
      timeRequired: 'requires time documentation'
    },
    no: {
      title: 'Samsvarskontroll',
      score: 'Poengsum',
      issues: 'Problemer',
      warnings: 'Advarsler',
      suggestions: 'Forslag',
      allPassed: 'Alle samsvarskontroller bestått!',
      fix: 'Fiks',
      autoFixAll: 'Auto-fiks alle problemer',
      // Issue types
      redFlag: 'Rødt flagg',
      missingQualifier: 'Manglende kvalifikator',
      missingTime: 'Manglende tid',
      insufficientTime: 'Utilstrekkelig tid',
      diagnosisMismatch: 'Diagnoseavvik',
      missingField: 'Manglende felt',
      missingDiagnosis: 'Manglende diagnose',
      missingTreatment: 'Manglende behandling',
      // Severity
      critical: 'Kritisk',
      high: 'Høy',
      medium: 'Medium',
      low: 'Lav',
      // Common messages
      chiefComplaintRequired: 'Hovedklage er påkrevd',
      objectiveRequired: 'Objektive funn er påkrevd',
      noDiagnosis: 'Ingen diagnosekode valgt',
      noTreatment: 'Ingen behandling dokumentert',
      adjustmentNoSublux: 'Justering utført, men ingen subluksasjon/ledddysfunksjon dokumentert i Objektivt',
      timeRequired: 'krever tidsdokumentasjon'
    }
  },

  // =============================================================================
  // PRINT PREVIEW
  // =============================================================================
  printPreview: {
    en: {
      title: 'Print Preview',
      clinicalNotes: 'Clinical Encounter Notes',
      patient: 'Patient',
      dob: 'DOB',
      date: 'Date',
      provider: 'Provider',
      signature: 'Signature',
      page: 'Page',
      of: 'of',
      generatedBy: 'Generated by ChiroClickCRM',
      confidential: 'This document is confidential and intended solely for the patient named above.',
      // Templates
      templateStandard: 'Standard SOAP',
      templateNarrative: 'Narrative Report',
      templateCompact: 'Compact',
      templatePI: 'Personal Injury',
      // Options
      showHeader: 'Header',
      showSignature: 'Signature',
      // Sections
      noSubjective: 'No subjective findings documented.',
      noObjective: 'No objective findings documented.',
      noAssessment: 'No assessment documented.',
      noPlan: 'No plan documented.'
    },
    no: {
      title: 'Forhåndsvisning',
      clinicalNotes: 'Kliniske konsultasjonsnotater',
      patient: 'Pasient',
      dob: 'Fødselsdato',
      date: 'Dato',
      provider: 'Behandler',
      signature: 'Signatur',
      page: 'Side',
      of: 'av',
      generatedBy: 'Generert av ChiroClickCRM',
      confidential: 'Dette dokumentet er konfidensielt og kun ment for pasienten nevnt ovenfor.',
      // Templates
      templateStandard: 'Standard SOAP',
      templateNarrative: 'Narrativ rapport',
      templateCompact: 'Kompakt',
      templatePI: 'Personskade',
      // Options
      showHeader: 'Topptekst',
      showSignature: 'Signatur',
      // Sections
      noSubjective: 'Ingen subjektive funn dokumentert.',
      noObjective: 'Ingen objektive funn dokumentert.',
      noAssessment: 'Ingen vurdering dokumentert.',
      noPlan: 'Ingen plan dokumentert.'
    }
  },

  // =============================================================================
  // BODY CHART
  // =============================================================================
  bodyChart: {
    en: {
      title: 'Body Chart',
      openFullChart: 'Open Full Chart',
      annotate: 'Annotate Pain Locations',
      saveChart: 'Save Chart',
      clearView: 'Clear View',
      clearAll: 'Clear All',
      // Views
      front: 'Front',
      back: 'Back',
      leftSide: 'Left Side',
      rightSide: 'Right Side',
      head: 'Head/Neck',
      hands: 'Hands',
      feet: 'Feet',
      // Tools
      pointer: 'Pointer',
      pencil: 'Pencil',
      marker: 'Marker',
      eraser: 'Eraser',
      text: 'Text',
      // Other
      tools: 'Tools',
      size: 'Size',
      color: 'Color',
      markerLegend: 'Marker Legend',
      descriptionPlaceholder: 'Description for marker'
    },
    no: {
      title: 'Kroppskart',
      openFullChart: 'Åpne fullt kart',
      annotate: 'Marker smertelokasjoner',
      saveChart: 'Lagre kart',
      clearView: 'Tøm visning',
      clearAll: 'Tøm alt',
      // Views
      front: 'Foran',
      back: 'Bak',
      leftSide: 'Venstre side',
      rightSide: 'Høyre side',
      head: 'Hode/Nakke',
      hands: 'Hender',
      feet: 'Føtter',
      // Tools
      pointer: 'Peker',
      pencil: 'Blyant',
      marker: 'Markør',
      eraser: 'Viskelær',
      text: 'Tekst',
      // Other
      tools: 'Verktøy',
      size: 'Størrelse',
      color: 'Farge',
      markerLegend: 'Markørforklaring',
      descriptionPlaceholder: 'Beskrivelse for markør'
    }
  },

  // =============================================================================
  // TEMPLATE LIBRARY
  // =============================================================================
  templateLibrary: {
    en: {
      title: 'Chart Template Library',
      searchPlaceholder: 'Search templates...',
      allDisciplines: 'All Disciplines',
      favorites: 'Favorites',
      recentlyUsed: 'Recently Used',
      noTemplates: 'No templates found',
      selectTemplate: 'Select a template to insert',
      // Disciplines
      chiropractic: 'Chiropractic',
      physiotherapy: 'Physiotherapy',
      massage: 'Massage Therapy',
      osteopathy: 'Osteopathy',
      naturopathic: 'Naturopathic Medicine',
      acupuncture: 'Acupuncture',
      athletic: 'Athletic Therapy',
      counselling: 'Counselling',
      dietetics: 'Dietetics',
      kinesiology: 'Kinesiology',
      occupational: 'Occupational Therapy',
      podiatry: 'Podiatry',
      psychology: 'Psychology',
      other: 'Other'
    },
    no: {
      title: 'Malbibliotek',
      searchPlaceholder: 'Søk i maler...',
      allDisciplines: 'Alle fagområder',
      favorites: 'Favoritter',
      recentlyUsed: 'Nylig brukt',
      noTemplates: 'Ingen maler funnet',
      selectTemplate: 'Velg en mal å sette inn',
      // Disciplines
      chiropractic: 'Kiropraktikk',
      physiotherapy: 'Fysioterapi',
      massage: 'Massasjeterapi',
      osteopathy: 'Osteopati',
      naturopathic: 'Naturmedisin',
      acupuncture: 'Akupunktur',
      athletic: 'Idrettsterapi',
      counselling: 'Rådgivning',
      dietetics: 'Ernæring',
      kinesiology: 'Kinesiologi',
      occupational: 'Ergoterapi',
      podiatry: 'Fotterapi',
      psychology: 'Psykologi',
      other: 'Annet'
    }
  },

  // =============================================================================
  // ENCOUNTER / VISIT
  // =============================================================================
  encounter: {
    en: {
      newVisit: 'New Visit',
      easyAssessment: 'Easy Assessment',
      encounterType: 'Encounter Type',
      duration: 'Duration',
      initial: 'Initial',
      followUp: 'Follow-up',
      reExam: 'Re-exam',
      emergency: 'Emergency',
      vasStart: 'VAS Start',
      vasEnd: 'VAS End',
      visitNumber: 'Visit',
      of: 'of',
      projected: 'projected',
      chartNotes: 'Chart Notes',
      copyToClipboard: 'Copy to Clipboard'
    },
    no: {
      newVisit: 'Ny konsultasjon',
      easyAssessment: 'Enkel vurdering',
      encounterType: 'Konsultasjonstype',
      duration: 'Varighet',
      initial: 'Førstegangs',
      followUp: 'Oppfølging',
      reExam: 'Re-undersøkelse',
      emergency: 'Akutt',
      vasStart: 'VAS start',
      vasEnd: 'VAS slutt',
      visitNumber: 'Besøk',
      of: 'av',
      projected: 'planlagt',
      chartNotes: 'Journalnotater',
      copyToClipboard: 'Kopier til utklippstavle'
    }
  },

  // =============================================================================
  // PROBLEM LIST
  // =============================================================================
  problemList: {
    en: {
      title: 'Problem List',
      addProblem: 'Add Problem',
      quickAdd: 'Quick Add',
      condition: 'Condition',
      icdCode: 'ICD-10 Code',
      status: 'Status',
      dateOnset: 'Date of Onset',
      // Statuses
      acute: 'Acute',
      subacute: 'Subacute',
      chronic: 'Chronic',
      resolved: 'Resolved',
      // Common conditions
      lowBackPain: 'Low Back Pain',
      neckPain: 'Neck Pain',
      headache: 'Headache',
      sciatica: 'Sciatica',
      shoulderPain: 'Shoulder Pain'
    },
    no: {
      title: 'Problemliste',
      addProblem: 'Legg til problem',
      quickAdd: 'Hurtiglegg til',
      condition: 'Tilstand',
      icdCode: 'ICD-10 kode',
      status: 'Status',
      dateOnset: 'Startdato',
      // Statuses
      acute: 'Akutt',
      subacute: 'Subakutt',
      chronic: 'Kronisk',
      resolved: 'Løst',
      // Common conditions
      lowBackPain: 'Korsryggsmerter',
      neckPain: 'Nakkesmerter',
      headache: 'Hodepine',
      sciatica: 'Isjias',
      shoulderPain: 'Skuldersmerter'
    }
  },

  // =============================================================================
  // TREATMENT PLAN TRACKER
  // =============================================================================
  treatmentPlan: {
    en: {
      title: 'Treatment Plan',
      currentPhase: 'Current Phase',
      visitProgress: 'Visit Progress',
      nextReeval: 'Next Re-evaluation',
      createPlan: 'Create Plan',
      editPlan: 'Edit Plan',
      // Phases
      phase1: 'Phase 1: Acute',
      phase2: 'Phase 2: Corrective',
      phase3: 'Phase 3: Maintenance',
      // Stats
      visitsRemaining: 'visits remaining',
      daysUntilReeval: 'days until re-eval'
    },
    no: {
      title: 'Behandlingsplan',
      currentPhase: 'Nåværende fase',
      visitProgress: 'Besøksfremdrift',
      nextReeval: 'Neste re-evaluering',
      createPlan: 'Opprett plan',
      editPlan: 'Rediger plan',
      // Phases
      phase1: 'Fase 1: Akutt',
      phase2: 'Fase 2: Korrigerende',
      phase3: 'Fase 3: Vedlikehold',
      // Stats
      visitsRemaining: 'besøk igjen',
      daysUntilReeval: 'dager til re-eval'
    }
  },

  // =============================================================================
  // SPINE DIAGRAM
  // =============================================================================
  spineDiagram: {
    en: {
      title: 'Spinal Examination',
      selectVertebra: 'Select vertebra to add findings',
      findings: 'Findings',
      side: 'Side',
      clearAll: 'Clear All',
      // Finding types
      subluxation: 'Subluxation',
      fixation: 'Fixation',
      restriction: 'Restriction',
      tenderness: 'Tenderness',
      spasm: 'Spasm',
      // Sides
      left: 'Left',
      right: 'Right',
      bilateral: 'Bilateral',
      central: 'Central',
      // Regions
      cervical: 'Cervical',
      thoracic: 'Thoracic',
      lumbar: 'Lumbar',
      sacral: 'Sacral'
    },
    no: {
      title: 'Ryggradsundersøkelse',
      selectVertebra: 'Velg virvel for å legge til funn',
      findings: 'Funn',
      side: 'Side',
      clearAll: 'Tøm alt',
      // Finding types
      subluxation: 'Subluksasjon',
      fixation: 'Fiksasjon',
      restriction: 'Restriksjon',
      tenderness: 'Ømhet',
      spasm: 'Spasme',
      // Sides
      left: 'Venstre',
      right: 'Høyre',
      bilateral: 'Bilateral',
      central: 'Sentral',
      // Regions
      cervical: 'Cervikal',
      thoracic: 'Torakal',
      lumbar: 'Lumbal',
      sacral: 'Sakral'
    }
  }
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get translation for a key
 * @param {string} section - Translation section (e.g., 'common', 'soap', 'salt')
 * @param {string} key - Translation key
 * @param {string} lang - Language code ('en' or 'no')
 * @returns {string} Translated string
 */
export function t(section, key, lang = 'en') {
  const sectionData = TRANSLATIONS[section];
  if (!sectionData) {
    console.warn(`Translation section not found: ${section}`);
    return key;
  }

  const langData = sectionData[lang] || sectionData['en'];
  if (!langData) {
    console.warn(`Language not found: ${lang} in section ${section}`);
    return key;
  }

  const translation = langData[key];
  if (!translation) {
    // Fallback to English
    const enTranslation = sectionData['en']?.[key];
    if (enTranslation) return enTranslation;

    console.warn(`Translation key not found: ${key} in section ${section}`);
    return key;
  }

  return translation;
}

/**
 * Create a translator function bound to a language
 * @param {string} lang - Language code
 * @returns {Function} Translator function
 */
export function createTranslator(lang = 'en') {
  return (section, key) => t(section, key, lang);
}

/**
 * Get all translations for a section
 * @param {string} section - Translation section
 * @param {string} lang - Language code
 * @returns {Object} All translations for the section
 */
export function getSection(section, lang = 'en') {
  const sectionData = TRANSLATIONS[section];
  if (!sectionData) return {};
  return sectionData[lang] || sectionData['en'] || {};
}

// Export default language
export const DEFAULT_LANGUAGE = 'en';

// Export available languages
export const AVAILABLE_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'no', name: 'Norsk', flag: '🇳🇴' }
];
