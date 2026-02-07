/**
 * SOAP Narrative Service
 * Generates standardized SOAP narrative text from encounter data.
 * Supports both Norwegian and English output.
 * Produces consistent formatting regardless of input method (freetext vs checkbox data).
 */

const LABELS = {
  no: {
    subjective: 'SUBJEKTIV',
    objective: 'OBJEKTIV',
    assessment: 'VURDERING',
    plan: 'PLAN',
    chiefComplaint: 'Hovedklage',
    history: 'Sykehistorie',
    onset: 'Debut',
    painDescription: 'Smertebeskrivelse',
    aggravating: 'Forverrende faktorer',
    relieving: 'Lindrende faktorer',
    observation: 'Observasjon',
    palpation: 'Palpasjon',
    rom: 'Bevegelighet (ROM)',
    orthoTests: 'Ortopediske tester',
    neuroTests: 'Nevrologiske tester',
    posture: 'Holdning',
    clinicalReasoning: 'Klinisk resonnement',
    differentialDiagnosis: 'Differensialdiagnoser',
    prognosis: 'Prognose',
    redFlagsChecked: 'Røde flagg sjekket',
    treatment: 'Behandling',
    exercises: 'Øvelser',
    advice: 'Råd',
    followUp: 'Oppfølging',
    referrals: 'Henvisninger',
    vasPain: 'VAS-smerte',
    diagnosis: 'Diagnose',
    yes: 'Ja',
    no: 'Nei',
    icpc: 'ICPC-2',
    icd10: 'ICD-10',
    billing: 'Takster',
    duration: 'Varighet',
    minutes: 'min',
    encounterType: 'Konsultasjonstype',
    initial: 'Nyundersøkelse',
    followup: 'Oppfølging',
    maintenance: 'Vedlikehold',
  },
  en: {
    subjective: 'SUBJECTIVE',
    objective: 'OBJECTIVE',
    assessment: 'ASSESSMENT',
    plan: 'PLAN',
    chiefComplaint: 'Chief Complaint',
    history: 'History',
    onset: 'Onset',
    painDescription: 'Pain Description',
    aggravating: 'Aggravating Factors',
    relieving: 'Relieving Factors',
    observation: 'Observation',
    palpation: 'Palpation',
    rom: 'Range of Motion',
    orthoTests: 'Orthopedic Tests',
    neuroTests: 'Neurological Tests',
    posture: 'Posture',
    clinicalReasoning: 'Clinical Reasoning',
    differentialDiagnosis: 'Differential Diagnosis',
    prognosis: 'Prognosis',
    redFlagsChecked: 'Red Flags Checked',
    treatment: 'Treatment',
    exercises: 'Exercises',
    advice: 'Advice',
    followUp: 'Follow-Up',
    referrals: 'Referrals',
    vasPain: 'VAS Pain',
    diagnosis: 'Diagnosis',
    yes: 'Yes',
    no: 'No',
    icpc: 'ICPC-2',
    icd10: 'ICD-10',
    billing: 'Billing Codes',
    duration: 'Duration',
    minutes: 'min',
    encounterType: 'Encounter Type',
    initial: 'Initial Examination',
    followup: 'Follow-up',
    maintenance: 'Maintenance',
  },
};

/**
 * Format a SOAP field value, handling both string and array inputs
 */
function formatFieldValue(value) {
  if (!value) return '';
  if (Array.isArray(value)) return value.filter(Boolean).join(', ');
  return String(value).trim();
}

/**
 * Build a labeled line (only if value is non-empty)
 */
function labeledLine(label, value) {
  const formatted = formatFieldValue(value);
  if (!formatted) return null;
  return `${label}: ${formatted}`;
}

/**
 * Get encounter type label
 */
function getEncounterTypeLabel(type, lang) {
  const t = LABELS[lang] || LABELS.no;
  switch (type) {
    case 'INITIAL':
      return t.initial;
    case 'MAINTENANCE':
      return t.maintenance;
    case 'FOLLOWUP':
    default:
      return t.followup;
  }
}

/**
 * Generate a formatted SOAP narrative from encounter data
 *
 * @param {object} soapData - Full encounter data object
 * @param {object} options
 * @param {string} options.language - 'no' (Norwegian) or 'en' (English). Default 'no'.
 * @param {boolean} options.includeHeader - Include encounter type/date header. Default true.
 * @param {boolean} options.includeDiagnoses - Include diagnosis codes inline. Default true.
 * @param {boolean} options.includeBilling - Include billing codes. Default false.
 * @param {boolean} options.compact - Use compact single-line format. Default false.
 * @returns {string} Formatted SOAP narrative text
 */
export function generateNarrative(soapData, options = {}) {
  const {
    language = 'no',
    includeHeader = true,
    includeDiagnoses = true,
    includeBilling = false,
    compact = false,
  } = options;

  const t = LABELS[language] || LABELS.no;
  const parts = [];
  const separator = compact ? ' | ' : '\n';
  const sectionBreak = compact ? '\n' : '\n\n';

  // Header
  if (includeHeader) {
    const header = [
      `${t.encounterType}: ${getEncounterTypeLabel(soapData.encounter_type, language)}`,
      soapData.encounter_date ? `Dato: ${soapData.encounter_date}` : null,
      soapData.duration_minutes ? `${t.duration}: ${soapData.duration_minutes} ${t.minutes}` : null,
    ]
      .filter(Boolean)
      .join(separator);
    if (header) parts.push(header);
  }

  // --- SUBJECTIVE ---
  const subj = soapData.subjective || {};
  const subjLines = [
    labeledLine(t.chiefComplaint, subj.chief_complaint),
    labeledLine(t.history, subj.history),
    labeledLine(t.onset, subj.onset),
    labeledLine(t.painDescription, subj.pain_description),
    labeledLine(t.aggravating, subj.aggravating_factors),
    labeledLine(t.relieving, subj.relieving_factors),
  ].filter(Boolean);

  // VAS pain
  if (soapData.vas_pain_start != null) {
    const vasLine =
      soapData.vas_pain_end != null
        ? `${t.vasPain}: ${soapData.vas_pain_start}/10 -> ${soapData.vas_pain_end}/10`
        : `${t.vasPain}: ${soapData.vas_pain_start}/10`;
    subjLines.push(vasLine);
  }

  if (subjLines.length > 0) {
    const subjText = compact
      ? `S: ${subjLines.join('. ')}`
      : `${t.subjective}\n${subjLines.join('\n')}`;
    parts.push(subjText);
  }

  // --- OBJECTIVE ---
  const obj = soapData.objective || {};
  const objLines = [
    labeledLine(t.observation, obj.observation),
    labeledLine(t.palpation, obj.palpation),
    labeledLine(t.rom, obj.rom),
    labeledLine(t.orthoTests, obj.ortho_tests),
    labeledLine(t.neuroTests, obj.neuro_tests),
    labeledLine(t.posture, obj.posture),
  ].filter(Boolean);

  if (objLines.length > 0) {
    const objText = compact
      ? `O: ${objLines.join('. ')}`
      : `${t.objective}\n${objLines.join('\n')}`;
    parts.push(objText);
  }

  // --- ASSESSMENT ---
  const assess = soapData.assessment || {};
  const assessLines = [
    labeledLine(t.clinicalReasoning, assess.clinical_reasoning),
    labeledLine(t.differentialDiagnosis, assess.differential_diagnosis),
    labeledLine(t.prognosis, assess.prognosis),
    assess.red_flags_checked != null
      ? `${t.redFlagsChecked}: ${assess.red_flags_checked ? t.yes : t.no}`
      : null,
  ].filter(Boolean);

  // Inline diagnosis codes
  if (includeDiagnoses) {
    const icpc = soapData.icpc_codes || [];
    const icd10 = soapData.icd10_codes || [];
    if (icpc.length > 0) {
      const codes = icpc
        .map((c) => `${c.code}${c.description ? ` - ${c.description}` : ''}`)
        .join(', ');
      assessLines.push(`${t.icpc}: ${codes}`);
    }
    if (icd10.length > 0) {
      const codes = icd10
        .map((c) => `${c.code}${c.description ? ` - ${c.description}` : ''}`)
        .join(', ');
      assessLines.push(`${t.icd10}: ${codes}`);
    }
  }

  if (assessLines.length > 0) {
    const assessText = compact
      ? `A: ${assessLines.join('. ')}`
      : `${t.assessment}\n${assessLines.join('\n')}`;
    parts.push(assessText);
  }

  // --- PLAN ---
  const plan = soapData.plan || {};
  const planLines = [
    labeledLine(t.treatment, plan.treatment),
    labeledLine(t.exercises, plan.exercises),
    labeledLine(t.advice, plan.advice),
    labeledLine(t.followUp, plan.follow_up),
    labeledLine(t.referrals, plan.referrals),
  ].filter(Boolean);

  // Billing codes
  if (includeBilling && soapData.treatments?.length > 0) {
    const billingStr = soapData.treatments
      .map((tr) => `${tr.code} - ${tr.name} (${tr.price} kr)`)
      .join(', ');
    planLines.push(`${t.billing}: ${billingStr}`);
  }

  if (planLines.length > 0) {
    const planText = compact ? `P: ${planLines.join('. ')}` : `${t.plan}\n${planLines.join('\n')}`;
    parts.push(planText);
  }

  return parts.join(sectionBreak);
}

/**
 * Generate a brief one-line summary of the encounter
 * Useful for encounter lists, SALT banners, etc.
 */
export function generateBriefSummary(soapData, language = 'no') {
  const complaint = soapData.subjective?.chief_complaint || '';
  const diagnosis = (soapData.icpc_codes || []).map((c) => c.code).join(', ');
  const vas =
    soapData.vas_pain_start != null
      ? `VAS ${soapData.vas_pain_start}` +
        (soapData.vas_pain_end != null ? `->${soapData.vas_pain_end}` : '')
      : '';

  return [complaint, diagnosis, vas].filter(Boolean).join(' | ');
}

export default { generateNarrative, generateBriefSummary };
