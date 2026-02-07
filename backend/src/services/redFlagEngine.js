/**
 * Red Flag Detection Engine
 * Comprehensive clinical red flag detection for patient safety
 *
 * Features:
 * - Pattern-based detection with severity levels
 * - Configurable rule engine
 * - Multi-language support (Norwegian/English)
 * - Integration with clinical validation
 * - Audit logging for safety events
 */

import { query } from '../config/database.js';
import logger from '../utils/logger.js';

// ============================================================================
// RED FLAG CATEGORIES
// ============================================================================

export const RED_FLAG_CATEGORIES = {
  CAUDA_EQUINA: {
    code: 'CE',
    name_no: 'Cauda Equina Syndrom',
    name_en: 'Cauda Equina Syndrome',
    severity: 'CRITICAL',
    action: 'IMMEDIATE_REFERRAL',
    timeframe: 'immediate',
  },
  MALIGNANCY: {
    code: 'MAL',
    name_no: 'Malignitet',
    name_en: 'Malignancy',
    severity: 'HIGH',
    action: 'URGENT_REFERRAL',
    timeframe: '24-48 hours',
  },
  INFECTION: {
    code: 'INF',
    name_no: 'Infeksjon',
    name_en: 'Infection',
    severity: 'HIGH',
    action: 'MEDICAL_EVALUATION',
    timeframe: '24 hours',
  },
  FRACTURE: {
    code: 'FX',
    name_no: 'Fraktur',
    name_en: 'Fracture',
    severity: 'HIGH',
    action: 'IMAGING_REQUIRED',
    timeframe: '24-48 hours',
  },
  VASCULAR: {
    code: 'VAS',
    name_no: 'Vaskulær Patologi',
    name_en: 'Vascular Pathology',
    severity: 'HIGH',
    action: 'EMERGENCY_EVALUATION',
    timeframe: 'immediate',
  },
  INFLAMMATORY: {
    code: 'INFL',
    name_no: 'Inflammatorisk Tilstand',
    name_en: 'Inflammatory Condition',
    severity: 'MODERATE',
    action: 'SPECIALIST_REFERRAL',
    timeframe: '1-2 weeks',
  },
  NEUROLOGICAL: {
    code: 'NEURO',
    name_no: 'Nevrologisk Kompromittering',
    name_en: 'Neurological Compromise',
    severity: 'MODERATE',
    action: 'DETAILED_EXAM',
    timeframe: '48-72 hours',
  },
  SYSTEMIC: {
    code: 'SYS',
    name_no: 'Systemisk Sykdom',
    name_en: 'Systemic Disease',
    severity: 'MODERATE',
    action: 'MEDICAL_CONSULTATION',
    timeframe: '1 week',
  },
  MEDICATION: {
    code: 'MED',
    name_no: 'Medikamentinteraksjon',
    name_en: 'Medication Interaction',
    severity: 'MODERATE',
    action: 'PRECAUTION',
    timeframe: 'ongoing',
  },
  AGE_RELATED: {
    code: 'AGE',
    name_no: 'Aldersrelatert Risiko',
    name_en: 'Age-Related Risk',
    severity: 'LOW',
    action: 'MODIFIED_TREATMENT',
    timeframe: 'ongoing',
  },
};

// ============================================================================
// RED FLAG RULES
// ============================================================================

export const RED_FLAG_RULES = [
  // ============ CRITICAL: Cauda Equina ============
  {
    id: 'ce_bladder',
    category: 'CAUDA_EQUINA',
    patterns: [
      /blære.*dysfunksjon/i,
      /blæreforstyrrel/i,
      /urin.*inkontinens/i,
      /urin.*retensjon/i,
      /bladder.*dysfunction/i,
      /urinary.*incontinence/i,
      /urinary.*retention/i,
      /kan\s*ikke\s*late\s*vannet/i,
      /difficulty\s*urinating/i,
      /cauda\s*equina/i,
    ],
    description_no: 'Blæreforstyrrelser - mulig cauda equina',
    description_en: 'Bladder dysfunction - possible cauda equina',
    questions: ['Har pasienten problemer med vannlating?', 'Er det endringer i blærefunksjon?'],
  },
  {
    id: 'ce_bowel',
    category: 'CAUDA_EQUINA',
    patterns: [
      /tarm.*dysfunksjon/i,
      /avføring.*inkontinens/i,
      /bowel.*dysfunction/i,
      /fecal.*incontinence/i,
      /loss\s*of\s*bowel\s*control/i,
      /tap\s*av\s*kontroll.*tarm/i,
    ],
    description_no: 'Tarmforstyrrelser - mulig cauda equina',
    description_en: 'Bowel dysfunction - possible cauda equina',
    questions: ['Har pasienten endringer i tarmfunksjon?'],
  },
  {
    id: 'ce_saddle',
    category: 'CAUDA_EQUINA',
    patterns: [
      /sadel.*anestesi/i,
      /sadel.*nummenhet/i,
      /perianal.*nummenhet/i,
      /saddle.*anesthesia/i,
      /saddle.*numbness/i,
      /perianal.*numbness/i,
      /nummen.*mellom\s*bena/i,
      /numbness.*between\s*legs/i,
    ],
    description_no: 'Sadel-anestesi - kritisk tegn på cauda equina',
    description_en: 'Saddle anesthesia - critical sign of cauda equina',
    questions: ['Er det nummenhet i seteregionen eller mellom bena?'],
  },
  {
    id: 'ce_bilateral',
    category: 'CAUDA_EQUINA',
    patterns: [
      /bilateral.*svakhet/i,
      /bilateral.*weakness/i,
      /begge\s*bena.*svake/i,
      /both\s*legs.*weak/i,
      /progressiv.*bilateral/i,
    ],
    description_no: 'Bilateral svakhet i underekstremiteter',
    description_en: 'Bilateral lower extremity weakness',
    questions: ['Er det svakhet i begge bena?'],
  },

  // ============ HIGH: Malignancy ============
  {
    id: 'mal_history',
    category: 'MALIGNANCY',
    patterns: [
      /tidligere\s*kreft/i,
      /cancer.*history/i,
      /known\s*malignancy/i,
      /kjent\s*malignitet/i,
      /metastas/i,
      /metastas/i,
    ],
    description_no: 'Tidligere krefthistorie',
    description_en: 'Previous cancer history',
    riskMultiplier: 2.0,
  },
  {
    id: 'mal_weight',
    category: 'MALIGNANCY',
    patterns: [
      /uforklarlig\s*vekttap/i,
      /unexplained\s*weight\s*loss/i,
      /vekttap.*[5-9]|[1-9]\d+\s*kg/i,
      /lost.*[5-9]|[1-9]\d+\s*kg/i,
      /betydelig\s*vekttap/i,
      /significant\s*weight\s*loss/i,
    ],
    description_no: 'Uforklarlig vekttap',
    description_en: 'Unexplained weight loss',
    questions: ['Har pasienten hatt uforklarlig vekttap?'],
  },
  {
    id: 'mal_night',
    category: 'MALIGNANCY',
    patterns: [
      /natt.*smerter/i,
      /smerter.*natt/i,
      /night\s*pain/i,
      /pain.*night/i,
      /vekker.*natt/i,
      /wakes.*night/i,
      /konstant.*smerte/i,
      /constant.*pain/i,
      /unrelenting/i,
    ],
    description_no: 'Nattlige smerter som vekker pasienten',
    description_en: 'Night pain that wakes patient',
    questions: ['Vekkes pasienten av smertene om natten?'],
  },
  {
    id: 'mal_age',
    category: 'MALIGNANCY',
    patterns: [
      /alder.*over\s*50.*første\s*gang/i,
      /age.*over\s*50.*first\s*episode/i,
      /ny.*debut.*[5-9]\d\s*år/i,
      /new.*onset.*[5-9]\d\s*year/i,
    ],
    description_no: 'Første episode av ryggsmerter etter 50 år',
    description_en: 'First episode of back pain after 50',
    ageThreshold: 50,
  },

  // ============ HIGH: Infection ============
  {
    id: 'inf_fever',
    category: 'INFECTION',
    patterns: [
      /feber/i,
      /fever/i,
      /temperatur.*[3][89]\.[0-9]/i,
      /temp.*[3][89]/i,
      /febrile/i,
      /febril/i,
    ],
    description_no: 'Feber tilstede',
    description_en: 'Fever present',
    questions: ['Har pasienten feber?'],
  },
  {
    id: 'inf_immune',
    category: 'INFECTION',
    patterns: [
      /immunsuppresjon/i,
      /immunocompromised/i,
      /hiv/i,
      /aids/i,
      /transplantasjon/i,
      /transplant/i,
      /kjemoterapi/i,
      /chemotherapy/i,
      /steroid.*langvarig/i,
      /long.*term.*steroid/i,
    ],
    description_no: 'Immunsupprimert pasient',
    description_en: 'Immunocompromised patient',
    riskMultiplier: 1.5,
  },
  {
    id: 'inf_iv',
    category: 'INFECTION',
    patterns: [/iv\s*drug/i, /intravenøs.*stoff/i, /sprøyte.*misbruk/i, /injection\s*drug/i],
    description_no: 'IV stoffmisbruk',
    description_en: 'IV drug use',
    riskMultiplier: 2.0,
  },
  {
    id: 'inf_surgery',
    category: 'INFECTION',
    patterns: [
      /nylig\s*operasjon/i,
      /recent\s*surgery/i,
      /operert.*[<4]\s*uker/i,
      /surgery.*[<4]\s*weeks/i,
      /post.*operativ/i,
      /post.*operative/i,
    ],
    description_no: 'Nylig kirurgisk inngrep',
    description_en: 'Recent surgical procedure',
    questions: ['Har pasienten hatt kirurgi nylig?'],
  },

  // ============ HIGH: Fracture ============
  {
    id: 'fx_trauma',
    category: 'FRACTURE',
    patterns: [
      /betydelig\s*trauma/i,
      /significant\s*trauma/i,
      /bilulykke/i,
      /car\s*accident/i,
      /mva/i,
      /motor\s*vehicle/i,
      /fall.*fra\s*høyde/i,
      /fall.*from\s*height/i,
      /sykkelulykke/i,
      /bicycle\s*accident/i,
    ],
    description_no: 'Betydelig traume',
    description_en: 'Significant trauma',
    questions: ['Har pasienten vært utsatt for betydelig traume?'],
  },
  {
    id: 'fx_osteoporosis',
    category: 'FRACTURE',
    patterns: [
      /osteoporose/i,
      /osteoporosis/i,
      /benskjørhet/i,
      /osteopeni/i,
      /osteopenia/i,
      /lavt\s*kalsium/i,
      /low\s*bone\s*density/i,
    ],
    description_no: 'Kjent osteoporose',
    description_en: 'Known osteoporosis',
    riskMultiplier: 1.5,
  },
  {
    id: 'fx_steroid',
    category: 'FRACTURE',
    patterns: [
      /steroid.*bruk/i,
      /steroid.*use/i,
      /kortison.*langvarig/i,
      /chronic.*corticosteroid/i,
      /prednisolon/i,
      /prednisone/i,
    ],
    description_no: 'Langvarig steroidbruk',
    description_en: 'Long-term steroid use',
    riskMultiplier: 1.3,
  },

  // ============ HIGH: Vascular ============
  {
    id: 'vas_aneurysm',
    category: 'VASCULAR',
    patterns: [/aneurisme/i, /aneurysm/i, /pulserende.*masse/i, /pulsating.*mass/i, /aorta/i],
    description_no: 'Mulig aneurisme',
    description_en: 'Possible aneurysm',
    questions: ['Er det pulserende masse i abdomen?'],
  },
  {
    id: 'vas_claudication',
    category: 'VASCULAR',
    patterns: [
      /claudicatio/i,
      /claudication/i,
      /bein.*smerter.*gange/i,
      /leg.*pain.*walking/i,
      /hvile.*bedrer/i,
      /rest.*improves/i,
    ],
    description_no: 'Claudicatio intermittens',
    description_en: 'Intermittent claudication',
  },

  // ============ MODERATE: Neurological ============
  {
    id: 'neuro_progressive',
    category: 'NEUROLOGICAL',
    patterns: [
      /progressiv.*svakhet/i,
      /progressive.*weakness/i,
      /tiltagende.*nummenhet/i,
      /increasing.*numbness/i,
      /forverres.*raskt/i,
      /rapidly.*worsening/i,
    ],
    description_no: 'Progressive nevrologiske symptomer',
    description_en: 'Progressive neurological symptoms',
    questions: ['Forverres symptomene over tid?'],
  },
  {
    id: 'neuro_myelopathy',
    category: 'NEUROLOGICAL',
    patterns: [
      /myelopati/i,
      /myelopathy/i,
      /hyperrefleks/i,
      /hyperreflexia/i,
      /babinski.*positiv/i,
      /positive.*babinski/i,
      /clonus/i,
      /spastis/i,
      /spastic/i,
    ],
    description_no: 'Tegn på myelopati',
    description_en: 'Signs of myelopathy',
    questions: ['Er det øvre motornevron-tegn?'],
  },

  // ============ MODERATE: Inflammatory ============
  {
    id: 'infl_stiffness',
    category: 'INFLAMMATORY',
    patterns: [
      /morgenstivhet.*[>3]0\s*min/i,
      /morning\s*stiffness.*[>3]0/i,
      /morning\s*stiffness/i,
      /stiv.*om\s*morgenen/i,
      /stiff.*morning/i,
      /bedres.*aktivitet/i,
      /improves.*activity/i,
    ],
    description_no: 'Morgenstivhet >30 min som bedres med aktivitet',
    description_en: 'Morning stiffness >30 min improving with activity',
    ageThreshold: 40,
    ageLessThan: true,
  },
  {
    id: 'infl_family',
    category: 'INFLAMMATORY',
    patterns: [
      /ankyloserende.*spondylitt.*familie/i,
      /ankylosing.*spondylitis.*family/i,
      /bechterew.*familie/i,
      /psoriasis.*artritt.*familie/i,
      /psoriatic.*arthritis.*family/i,
    ],
    description_no: 'Familiehistorie med inflammatorisk rygglidelse',
    description_en: 'Family history of inflammatory spine disease',
  },
];

// ============================================================================
// ENGINE FUNCTIONS
// ============================================================================

/**
 * Scan text for red flags
 * @param {string} text - Clinical text to scan
 * @param {Object} context - Patient context (age, history, medications)
 * @returns {Array} Array of detected red flags with severity and recommendations
 */
export const scanForRedFlags = (text, context = {}) => {
  const detectedFlags = [];
  const textLower = text.toLowerCase();

  for (const rule of RED_FLAG_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(text)) {
        const category = RED_FLAG_CATEGORIES[rule.category];

        // Check age threshold if applicable
        if (rule.ageThreshold && context.age) {
          if (rule.ageLessThan && context.age >= rule.ageThreshold) continue;
          if (!rule.ageLessThan && context.age < rule.ageThreshold) continue;
        }

        detectedFlags.push({
          ruleId: rule.id,
          category: rule.category,
          categoryCode: category.code,
          severity: category.severity,
          action: category.action,
          timeframe: category.timeframe,
          description: {
            no: rule.description_no,
            en: rule.description_en,
          },
          categoryName: {
            no: category.name_no,
            en: category.name_en,
          },
          matchedPattern: pattern.toString(),
          questions: rule.questions || [],
          riskMultiplier: rule.riskMultiplier || 1.0,
        });

        break; // Only match once per rule
      }
    }
  }

  // Sort by severity (CRITICAL first)
  const severityOrder = { CRITICAL: 0, HIGH: 1, MODERATE: 2, LOW: 3 };
  detectedFlags.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return detectedFlags;
};

/**
 * Calculate overall risk score
 */
export const calculateRiskScore = (detectedFlags, context = {}) => {
  if (detectedFlags.length === 0) {
    return { score: 0, level: 'LOW', recommendation: 'proceed' };
  }

  // Base score from severity
  const severityScores = { CRITICAL: 100, HIGH: 70, MODERATE: 40, LOW: 20 };
  let totalScore = 0;

  for (const flag of detectedFlags) {
    let score = severityScores[flag.severity] || 0;
    score *= flag.riskMultiplier;
    totalScore += score;
  }

  // Age modifier
  if (context.age) {
    if (context.age < 18 || context.age > 75) {
      totalScore *= 1.2;
    }
  }

  // Multiple flag modifier
  if (detectedFlags.length > 1) {
    totalScore *= 1 + (detectedFlags.length - 1) * 0.1;
  }

  // Normalize to 0-100
  totalScore = Math.min(100, totalScore);

  // Determine level and recommendation
  let level, recommendation;
  if (totalScore >= 80 || detectedFlags.some((f) => f.severity === 'CRITICAL')) {
    level = 'CRITICAL';
    recommendation = 'immediate_referral';
  } else if (totalScore >= 50 || detectedFlags.some((f) => f.severity === 'HIGH')) {
    level = 'HIGH';
    recommendation = 'urgent_evaluation';
  } else if (totalScore >= 25) {
    level = 'MODERATE';
    recommendation = 'proceed_with_caution';
  } else {
    level = 'LOW';
    recommendation = 'proceed';
  }

  return {
    score: Math.round(totalScore),
    level,
    recommendation,
    flagCount: detectedFlags.length,
    highestSeverity: detectedFlags[0]?.severity || 'LOW',
  };
};

/**
 * Get screening questions for detected flags
 */
export const getScreeningQuestions = (detectedFlags, language = 'no') => {
  const questions = [];
  const askedCategories = new Set();

  for (const flag of detectedFlags) {
    if (flag.questions && !askedCategories.has(flag.category)) {
      questions.push({
        category: flag.category,
        severity: flag.severity,
        questions: flag.questions,
        context: flag.description[language],
      });
      askedCategories.add(flag.category);
    }
  }

  return questions;
};

/**
 * Generate clinical alert for practitioner
 */
export const generateAlert = (detectedFlags, riskScore, language = 'no') => {
  if (detectedFlags.length === 0) {
    return null;
  }

  const messages = {
    no: {
      critical: '🚨 KRITISK: Umiddelbar henvisning påkrevd!',
      high: '⚠️ HØYT: Snarlig medisinsk evaluering anbefalt',
      moderate: '⚡ MODERAT: Forsiktighet anbefalt',
      low: 'ℹ️ LAV: Vær oppmerksom på risikofaktorer',
    },
    en: {
      critical: '🚨 CRITICAL: Immediate referral required!',
      high: '⚠️ HIGH: Prompt medical evaluation recommended',
      moderate: '⚡ MODERATE: Caution advised',
      low: 'ℹ️ LOW: Be aware of risk factors',
    },
  };

  const level = riskScore.level.toLowerCase();
  const msg = messages[language] || messages.en;

  return {
    level: riskScore.level,
    title: msg[level],
    score: riskScore.score,
    flags: detectedFlags.map((f) => ({
      category: f.categoryName[language],
      description: f.description[language],
      action: f.action,
      timeframe: f.timeframe,
    })),
    recommendation: riskScore.recommendation,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Log red flag detection for audit
 */
export const logRedFlagDetection = async (
  patientId,
  encounterId,
  detectedFlags,
  riskScore,
  userId
) => {
  try {
    await query(
      `INSERT INTO audit_logs (
        user_id, action, resource_type, resource_id,
        changes, created_at
      ) VALUES ($1, 'RED_FLAG_DETECTED', 'clinical_encounter', $2, $3, NOW())`,
      [
        userId,
        encounterId,
        JSON.stringify({
          patientId,
          flagCount: detectedFlags.length,
          riskScore: riskScore.score,
          riskLevel: riskScore.level,
          flags: detectedFlags.map((f) => ({
            category: f.category,
            severity: f.severity,
            ruleId: f.ruleId,
          })),
        }),
      ]
    );

    logger.info(
      `Red flags logged for encounter ${encounterId}: ${detectedFlags.length} flags, risk level ${riskScore.level}`
    );
  } catch (error) {
    logger.error('Failed to log red flag detection:', error);
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  RED_FLAG_CATEGORIES,
  RED_FLAG_RULES,
  scanForRedFlags,
  calculateRiskScore,
  getScreeningQuestions,
  generateAlert,
  logRedFlagDetection,
};
