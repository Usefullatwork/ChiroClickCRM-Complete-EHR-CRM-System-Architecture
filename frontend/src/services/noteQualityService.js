/**
 * Note Quality Service
 * Client-side pre-check that mirrors backend validation.
 * Provides real-time quality feedback as the clinician types.
 */

// Red flag keywords (Norwegian + English) that should trigger alerts
const RED_FLAG_KEYWORDS = {
  no: [
    'brystsmerter',
    'brystsmerte',
    'nummenhet',
    'lammelse',
    'parese',
    'urinretensjon',
    'urininkontinens',
    'avføringsinkontinens',
    'cauda equina',
    'ridebukseanestesi',
    'svimmelhet',
    'synsforstyrrelser',
    'diplopi',
    'uforklart vekttap',
    'feber',
    'nattesvette',
    'kraftsvikt',
    'bilateral',
    'progresjon',
    'traume',
    'ulykke',
    'fall fra høyde',
    'kreft',
    'malignitet',
    'metastase',
    'pulserende hodepine',
    'thunderclap',
    'nakkestivhet',
    'meningisme',
    'bevisstløs',
    'bevissthetstap',
    'synkope',
  ],
  en: [
    'chest pain',
    'cardiac',
    'numbness',
    'paralysis',
    'paresis',
    'urinary retention',
    'incontinence',
    'bowel',
    'cauda equina',
    'saddle anesthesia',
    'dizziness',
    'visual disturbance',
    'diplopia',
    'unexplained weight loss',
    'fever',
    'night sweats',
    'weakness',
    'bilateral',
    'progressive',
    'trauma',
    'accident',
    'fall from height',
    'cancer',
    'malignancy',
    'metastasis',
    'thunderclap headache',
    'worst headache',
    'neck stiffness',
    'meningism',
    'loss of consciousness',
    'syncope',
  ],
};

// Section weights for scoring
const SECTION_WEIGHTS = {
  INITIAL: { subjective: 30, objective: 30, assessment: 25, plan: 15 },
  FOLLOWUP: { subjective: 25, objective: 25, assessment: 25, plan: 25 },
  MAINTENANCE: { subjective: 20, objective: 20, assessment: 30, plan: 30 },
};

/**
 * Check completeness of SOAP data
 * @param {object} soapData - The encounter data with subjective/objective/assessment/plan
 * @param {string} encounterType - INITIAL | FOLLOWUP | MAINTENANCE
 * @returns {{ score: number, sectionScores: object, missing: string[] }}
 */
export function checkCompleteness(soapData, encounterType = 'FOLLOWUP') {
  const weights = SECTION_WEIGHTS[encounterType] || SECTION_WEIGHTS.FOLLOWUP;
  const missing = [];
  const sectionScores = {};

  // --- Subjective ---
  const subj = soapData.subjective || {};
  let subjScore = 0;
  if (subj.chief_complaint && subj.chief_complaint.trim().length >= 3) {
    subjScore += 60;
  } else {
    missing.push('Hovedklage / Chief complaint');
  }
  if (subj.history && subj.history.trim()) {
    subjScore += 15;
  }
  if (subj.onset && subj.onset.trim()) {
    subjScore += 10;
  }
  if (subj.pain_description && subj.pain_description.trim()) {
    subjScore += 10;
  }
  if (subj.aggravating_factors || subj.relieving_factors) {
    subjScore += 5;
  }
  sectionScores.subjective = Math.min(subjScore, 100);

  // --- Objective ---
  const obj = soapData.objective || {};
  let objScore = 0;
  const objFields = ['observation', 'palpation', 'rom', 'ortho_tests', 'neuro_tests', 'posture'];
  const filledObjFields = objFields.filter((f) => obj[f] && obj[f].trim());
  if (filledObjFields.length === 0 && encounterType === 'INITIAL') {
    missing.push('Objektive funn / Objective findings');
  }
  objScore = Math.min((filledObjFields.length / objFields.length) * 100, 100);
  if (encounterType === 'INITIAL' && filledObjFields.length < 2) {
    objScore = Math.min(objScore, 40);
  }
  sectionScores.objective = Math.round(objScore);

  // --- Assessment ---
  const assess = soapData.assessment || {};
  let assessScore = 0;
  if (assess.clinical_reasoning && assess.clinical_reasoning.trim()) {
    assessScore += 50;
  } else if (encounterType === 'INITIAL') {
    missing.push('Klinisk vurdering / Clinical reasoning');
  }
  if (assess.differential_diagnosis && assess.differential_diagnosis.trim()) {
    assessScore += 20;
  }
  if (assess.prognosis && assess.prognosis.trim()) {
    assessScore += 20;
  }
  if (assess.red_flags_checked) {
    assessScore += 10;
  }
  sectionScores.assessment = Math.min(assessScore, 100);

  // Diagnosis codes
  const hasDiagnosis = soapData.icpc_codes?.length > 0 || soapData.icd10_codes?.length > 0;
  if (!hasDiagnosis && encounterType === 'INITIAL') {
    missing.push('Diagnosekode / Diagnosis code');
  }
  if (hasDiagnosis) {
    sectionScores.assessment = Math.min(sectionScores.assessment + 10, 100);
  }

  // --- Plan ---
  const plan = soapData.plan || {};
  let planScore = 0;
  if (plan.treatment && plan.treatment.trim()) {
    planScore += 40;
  } else if (encounterType === 'INITIAL') {
    missing.push('Behandling / Treatment');
  }
  if (plan.exercises && plan.exercises.trim()) {
    planScore += 20;
  }
  if (plan.advice && plan.advice.trim()) {
    planScore += 15;
  }
  if (plan.follow_up && plan.follow_up.trim()) {
    planScore += 15;
  }
  if (plan.referrals && plan.referrals.trim()) {
    planScore += 10;
  }
  sectionScores.plan = Math.min(planScore, 100);

  // Overall weighted score
  const score = Math.round(
    (sectionScores.subjective * weights.subjective +
      sectionScores.objective * weights.objective +
      sectionScores.assessment * weights.assessment +
      sectionScores.plan * weights.plan) /
      100
  );

  return { score, sectionScores, missing };
}

/**
 * Check for red flags in subjective text
 * @param {string} subjective - The subjective text (chief complaint + history)
 * @returns {{ found: boolean, flags: Array<{keyword: string, severity: string}> }}
 */
export function checkRedFlags(subjective) {
  if (!subjective || typeof subjective !== 'string') {
    return { found: false, flags: [] };
  }

  const text = subjective.toLowerCase();
  const flags = [];

  // Check both Norwegian and English keywords
  for (const lang of ['no', 'en']) {
    for (const keyword of RED_FLAG_KEYWORDS[lang]) {
      if (text.includes(keyword.toLowerCase())) {
        // Determine severity
        const highSeverity = [
          'cauda equina',
          'ridebukseanestesi',
          'saddle anesthesia',
          'urinretensjon',
          'urinary retention',
          'thunderclap',
          'worst headache',
          'bevisstløs',
          'loss of consciousness',
          'lammelse',
          'paralysis',
        ];
        const severity = highSeverity.includes(keyword.toLowerCase()) ? 'high' : 'medium';
        // Avoid duplicate keywords across languages
        if (!flags.some((f) => f.keyword === keyword)) {
          flags.push({ keyword, severity });
        }
      }
    }
  }

  return { found: flags.length > 0, flags };
}

/**
 * Get quality level based on score
 * @param {number} score - 0-100
 * @returns {'green' | 'yellow' | 'red'}
 */
export function getQualityLevel(score) {
  if (score >= 70) {
    return 'green';
  }
  if (score >= 40) {
    return 'yellow';
  }
  return 'red';
}

/**
 * Generate suggestions based on completeness check
 * @param {object} result - Result from checkCompleteness
 * @param {string} encounterType
 * @returns {string[]}
 */
export function generateSuggestions(result, encounterType = 'FOLLOWUP') {
  const suggestions = [];

  if (result.sectionScores.subjective < 60) {
    suggestions.push('Legg til mer detaljer i subjektiv seksjon');
  }
  if (result.sectionScores.objective === 0 && encounterType !== 'MAINTENANCE') {
    suggestions.push('Dokumenter objektive funn');
  }
  if (result.sectionScores.assessment < 30) {
    suggestions.push('Legg til klinisk vurdering');
  }
  if (result.sectionScores.plan < 30) {
    suggestions.push('Legg til behandlingsplan eller oppfølging');
  }

  return suggestions;
}
