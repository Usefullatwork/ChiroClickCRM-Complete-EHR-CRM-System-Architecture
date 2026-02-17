/**
 * SOAP Schema Normalizer
 * Defines canonical SOAP field names and maps aliases (camelCase, snake_case, Norwegian)
 */

/**
 * Canonical SOAP field definitions with all known aliases
 */
export const SOAP_FIELDS = {
  // === SUBJECTIVE ===
  subjective: {
    canonical: 'subjective',
    aliases: ['subjektiv', 'subjektivt', 'anamnese'],
    subfields: {
      chief_complaint: {
        canonical: 'chief_complaint',
        aliases: ['chiefComplaint', 'hovedklage', 'hovedplage', 'complaint'],
      },
      history: {
        canonical: 'history',
        aliases: ['anamnese', 'sykehistorie', 'medical_history', 'medicalHistory'],
      },
      onset: {
        canonical: 'onset',
        aliases: ['debut', 'start', 'symptomStart', 'symptom_start'],
      },
      pain_description: {
        canonical: 'pain_description',
        aliases: ['painDescription', 'smertebeskrivelse', 'smertekarakter'],
      },
      location: {
        canonical: 'location',
        aliases: ['lokalisasjon', 'painLocation', 'pain_location'],
      },
      radiation: {
        canonical: 'radiation',
        aliases: ['utstralende', 'utstråling', 'radiating', 'radiatingPain'],
      },
      aggravating_factors: {
        canonical: 'aggravating_factors',
        aliases: ['aggravatingFactors', 'forverrende', 'forverrende_faktorer'],
      },
      relieving_factors: {
        canonical: 'relieving_factors',
        aliases: ['relievingFactors', 'lindrende', 'lindrende_faktorer'],
      },
      night_pain: {
        canonical: 'night_pain',
        aliases: ['nightPain', 'nattsmerter', 'nattlig_smerte'],
      },
      previous_treatment: {
        canonical: 'previous_treatment',
        aliases: ['previousTreatment', 'tidligere_behandling', 'tidligereBehandling'],
      },
    },
  },

  // === OBJECTIVE ===
  objective: {
    canonical: 'objective',
    aliases: ['objektiv', 'objektivt', 'funn'],
    subfields: {
      observation: {
        canonical: 'observation',
        aliases: ['observasjon', 'inspeksjon'],
      },
      posture: {
        canonical: 'posture',
        aliases: ['holdning', 'holdningsvurdering'],
      },
      gait: {
        canonical: 'gait',
        aliases: ['gange', 'gangmønster'],
      },
      palpation: {
        canonical: 'palpation',
        aliases: ['palpasjon'],
      },
      rom: {
        canonical: 'rom',
        aliases: ['bevegelighet', 'bevegelsesutslag', 'range_of_motion', 'rangeOfMotion'],
      },
      ortho_tests: {
        canonical: 'ortho_tests',
        aliases: ['orthoTests', 'ortopediske_tester', 'ortopediskeTester'],
      },
      neuro_tests: {
        canonical: 'neuro_tests',
        aliases: ['neuroTests', 'nevrologiske_tester', 'nevrologiskeTester'],
      },
      vital_signs: {
        canonical: 'vital_signs',
        aliases: ['vitalSigns', 'vitale_tegn', 'vitaleTegn'],
      },
      findings: {
        canonical: 'findings',
        aliases: ['funn', 'kliniske_funn', 'kliniskeFunn'],
      },
    },
  },

  // === ASSESSMENT ===
  assessment: {
    canonical: 'assessment',
    aliases: ['vurdering', 'evaluering'],
    subfields: {
      clinical_reasoning: {
        canonical: 'clinical_reasoning',
        aliases: ['clinicalReasoning', 'klinisk_resonnement', 'vurdering'],
      },
      diagnosis: {
        canonical: 'diagnosis',
        aliases: ['diagnose', 'diagnoseKode'],
      },
      differential_diagnosis: {
        canonical: 'differential_diagnosis',
        aliases: ['differentialDiagnosis', 'differensialdiagnoser', 'differensialdiagnose'],
      },
      prognosis: {
        canonical: 'prognosis',
        aliases: ['prognose'],
      },
      severity: {
        canonical: 'severity',
        aliases: ['alvorlighet', 'alvorlighetsgrad'],
      },
      red_flags: {
        canonical: 'red_flags',
        aliases: ['redFlags', 'røde_flagg', 'rødeFlagg'],
      },
    },
  },

  // === PLAN ===
  plan: {
    canonical: 'plan',
    aliases: ['tiltak', 'behandlingsplan'],
    subfields: {
      treatment: {
        canonical: 'treatment',
        aliases: ['behandling', 'behandlingUtført', 'behandling_utfort'],
      },
      techniques: {
        canonical: 'techniques',
        aliases: ['teknikker', 'teknikkerBrukt'],
      },
      exercises: {
        canonical: 'exercises',
        aliases: ['hjemmeovelser', 'hjemmeøvelser', 'øvelser'],
      },
      advice: {
        canonical: 'advice',
        aliases: ['rad', 'råd', 'rådgivning', 'veiledning'],
      },
      follow_up: {
        canonical: 'follow_up',
        aliases: ['followUp', 'oppfolging', 'oppfølging'],
      },
      next_appointment: {
        canonical: 'next_appointment',
        aliases: ['nextAppointment', 'neste_time', 'nesteTime'],
      },
      goals: {
        canonical: 'goals',
        aliases: ['malsettinger', 'målsettinger', 'behandlingsmål'],
      },
      referral: {
        canonical: 'referral',
        aliases: ['henvisning', 'referanse'],
      },
    },
  },
};

/**
 * Build a reverse lookup map: alias -> canonical name
 */
function buildAliasMap() {
  const map = new Map();

  for (const [sectionKey, section] of Object.entries(SOAP_FIELDS)) {
    // Map section-level aliases
    map.set(sectionKey, sectionKey);
    for (const alias of section.aliases) {
      map.set(alias.toLowerCase(), sectionKey);
    }

    // Map subfield aliases
    if (section.subfields) {
      for (const [fieldKey, field] of Object.entries(section.subfields)) {
        for (const alias of field.aliases) {
          // Store as "section.alias" -> "section.canonical"
          map.set(`${sectionKey}.${alias}`, fieldKey);
          map.set(`${sectionKey}.${alias.toLowerCase()}`, fieldKey);
        }
        map.set(`${sectionKey}.${fieldKey}`, fieldKey);
      }
    }
  }

  return map;
}

const ALIAS_MAP = buildAliasMap();

/**
 * Normalize a single SOAP section's data by mapping aliased keys to canonical names
 */
function normalizeSection(sectionName, data) {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const section = SOAP_FIELDS[sectionName];
  if (!section || !section.subfields) {
    return data;
  }

  const normalized = {};

  for (const [key, value] of Object.entries(data)) {
    const canonicalKey =
      ALIAS_MAP.get(`${sectionName}.${key}`) ||
      ALIAS_MAP.get(`${sectionName}.${key.toLowerCase()}`) ||
      key;
    normalized[canonicalKey] = value;
  }

  return normalized;
}

/**
 * Normalize SOAP data by mapping all aliased field names to canonical names.
 * Handles both top-level section names and subfield names.
 *
 * @param {Object} data - Raw SOAP data with potentially mixed field names
 * @returns {Object} Normalized data with canonical field names
 */
export function normalizeSoapData(data) {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const normalized = {};

  for (const [key, value] of Object.entries(data)) {
    const canonicalSection = ALIAS_MAP.get(key.toLowerCase()) || key;

    // Only normalize known SOAP sections
    if (
      SOAP_FIELDS[canonicalSection] &&
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value)
    ) {
      normalized[canonicalSection] = normalizeSection(canonicalSection, value);
    } else {
      // Pass through non-SOAP fields unchanged (e.g. patient_id, encounter_type)
      normalized[canonicalSection] = value;
    }
  }

  return normalized;
}

/**
 * Get required fields for a given encounter type
 *
 * @param {string} encounterType - 'INITIAL', 'FOLLOW_UP', 'SOAP', etc.
 * @returns {Object} Required and optional fields per section
 */
export function getRequiredFields(encounterType) {
  const type = (encounterType || 'SOAP').toUpperCase();

  const base = {
    subjective: {
      required: ['chief_complaint'],
      recommended: ['history', 'onset', 'pain_description'],
    },
    objective: {
      required: [],
      recommended: ['observation', 'palpation', 'rom'],
    },
    assessment: {
      required: [],
      recommended: ['clinical_reasoning'],
    },
    plan: {
      required: [],
      recommended: ['treatment', 'follow_up'],
    },
  };

  if (type === 'INITIAL') {
    base.subjective.required.push('history', 'onset');
    base.objective.required.push('observation');
    base.objective.recommended.push('ortho_tests', 'neuro_tests', 'vital_signs');
    base.assessment.required.push('clinical_reasoning');
    base.plan.required.push('treatment');
  }

  if (type === 'FOLLOW_UP' || type === 'FOLLOWUP') {
    base.objective.recommended.push('palpation');
    base.plan.recommended.push('treatment');
  }

  if (type === 'VESTIBULAR') {
    base.subjective.required.push('history');
    base.objective.required.push('observation');
    base.objective.recommended.push('neuro_tests');
    base.assessment.required.push('clinical_reasoning');
    base.plan.required.push('treatment', 'follow_up');
  }

  return base;
}

export default {
  SOAP_FIELDS,
  normalizeSoapData,
  getRequiredFields,
};
