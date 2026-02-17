/**
 * NarrativeGenerator - Generate ChiroTouch-style clinical narratives
 *
 * Transforms checkbox selections and structured data into
 * professional clinical documentation sentences.
 */

// Subjective narrative templates
export function generateSubjectiveNarrative(data) {
  const narratives = [];

  // Chief complaint
  if (data.chief_complaint) {
    narratives.push(`Chief Complaint: ${data.chief_complaint}.`);
  }

  // Pain description with VAS
  if (data.vas_pain_start !== null && data.vas_pain_start !== undefined) {
    narratives.push(
      `Pain Scale: currently rated ${data.vas_pain_start}/10, with 10 being the worst.`
    );
  }

  // Pain quality
  if (data.pain_qualities && data.pain_qualities.length > 0) {
    const qualities = data.pain_qualities.map((q) => PAIN_QUALITY_LABELS[q] || q);
    narratives.push(`Pain Character: Patient describes pain as ${formatList(qualities)}.`);
  }

  // Pain location
  if (data.pain_locations && data.pain_locations.length > 0) {
    const locations = data.pain_locations.map((l) => LOCATION_LABELS[l] || l);
    narratives.push(`Pain Location: ${formatList(locations)}.`);
  }

  // Radiation
  const hasRadiating = data.pain_qualities?.includes('radiating');
  if (hasRadiating) {
    narratives.push(`Radiation of Symptoms: Pain radiates from primary location.`);
  } else if (data.pain_qualities && data.pain_qualities.length > 0) {
    narratives.push(`Radiation of Symptoms: Currently non-radiating.`);
  }

  // Onset
  if (data.onset) {
    narratives.push(`Onset: ${data.onset}.`);
  }

  // Aggravating factors
  if (data.aggravating_factors_selected && data.aggravating_factors_selected.length > 0) {
    const factors = data.aggravating_factors_selected.map((f) => AGGRAVATING_LABELS[f] || f);
    narratives.push(`Aggravating Factors: Pain is worsened by ${formatList(factors)}.`);
  }

  // Relieving factors
  if (data.relieving_factors_selected && data.relieving_factors_selected.length > 0) {
    const factors = data.relieving_factors_selected.map((f) => RELIEVING_LABELS[f] || f);
    narratives.push(`Relieving Factors: Pain is improved by ${formatList(factors)}.`);
  }

  // Functional deficit
  if (data.functional_deficit) {
    narratives.push(`Functional Deficit: ${data.functional_deficit}.`);
  }

  // History
  if (data.history) {
    narratives.push(`History: ${data.history}`);
  }

  return narratives;
}

// Objective narrative templates
export function generateObjectiveNarrative(data) {
  const narratives = [];

  // Spinal findings
  if (data.spinal_findings && Object.keys(data.spinal_findings).length > 0) {
    const findingsList = Object.values(data.spinal_findings);

    // Group by type
    const subluxations = findingsList.filter((f) => f.type === 'subluxation');
    const fixations = findingsList.filter((f) => f.type === 'fixation');
    const _restrictions = findingsList.filter((f) => f.type === 'restriction');
    const tenderness = findingsList.filter((f) => f.type === 'tenderness');
    const spasms = findingsList.filter((f) => f.type === 'spasm');

    if (subluxations.length > 0) {
      const subs = subluxations.map((f) => formatVertebra(f));
      narratives.push(`Spinal Restrictions/Subluxations: ${subs.join(', ')}.`);
    }

    if (fixations.length > 0) {
      const fixes = fixations.map((f) => formatVertebra(f));
      narratives.push(`Segmental Fixations: ${fixes.join(', ')}.`);
    }

    if (tenderness.length > 0) {
      const tends = tenderness.map((f) => formatVertebra(f));
      narratives.push(`Pain/Tenderness: ${tends.join(', ')}.`);
    }

    if (spasms.length > 0) {
      const spas = spasms.map((f) => f.vertebra);
      narratives.push(`Muscle Spasm(s): Hypertonic tissue tone at ${spas.join(', ')}.`);
    }
  }

  // Observation findings
  if (data.observation_findings && data.observation_findings.length > 0) {
    const _observations = data.observation_findings.map((f) => OBSERVATION_LABELS[f] || f);

    // Check for specific posture findings
    const postureFindings = data.observation_findings.filter((f) =>
      [
        'forward_head',
        'rounded_shoulders',
        'increased_kyphosis',
        'increased_lordosis',
        'decreased_lordosis',
        'scoliosis',
        'pelvic_tilt',
        'leg_length_diff',
      ].includes(f)
    );

    if (postureFindings.length > 0) {
      const postureLabels = postureFindings.map((f) => OBSERVATION_LABELS[f] || f);
      narratives.push(`Postural Analysis: ${formatList(postureLabels)}.`);
    }

    const gaitFindings = data.observation_findings.filter((f) =>
      ['gait_normal', 'antalgic_gait', 'limping', 'shuffling', 'guarded_movement'].includes(f)
    );

    if (gaitFindings.length > 0) {
      const gaitLabels = gaitFindings.map((f) => OBSERVATION_LABELS[f] || f);
      narratives.push(`Gait: ${formatList(gaitLabels)}.`);
    }
  }

  // Palpation findings
  if (data.palpation_findings && data.palpation_findings.length > 0) {
    const palpations = data.palpation_findings.map((f) => PALPATION_LABELS[f] || f);
    narratives.push(`Palpation: ${formatList(palpations)} noted.`);
  }

  // ROM findings
  if (data.rom_findings && data.rom_findings.length > 0) {
    const romNotes = data.rom_findings.map((f) => ROM_LABELS[f] || f);
    narratives.push(`ROM Concern(s): ${formatList(romNotes)}.`);
  }

  // Ortho tests
  if (data.ortho_tests_selected && data.ortho_tests_selected.length > 0) {
    const positiveTests = data.ortho_tests_selected.filter((t) => t.includes('pos'));
    const negativeTests = data.ortho_tests_selected.filter((t) => t.includes('neg'));

    if (positiveTests.length > 0) {
      const positiveLabels = positiveTests.map((t) => ORTHO_LABELS[t] || t);
      narratives.push(`Orthopedic Tests - Positive: ${formatList(positiveLabels)}.`);
    }

    if (negativeTests.length > 0) {
      const negativeLabels = negativeTests.map((t) => ORTHO_LABELS[t] || t);
      narratives.push(`Orthopedic Tests - Negative: ${formatList(negativeLabels)}.`);
    }
  }

  // Neuro tests
  if (data.neuro_tests_selected && data.neuro_tests_selected.length > 0) {
    const neuroNotes = data.neuro_tests_selected.map((t) => NEURO_LABELS[t] || t);
    narratives.push(`Neurological Findings: ${formatList(neuroNotes)}.`);
  }

  return narratives;
}

// Assessment narrative templates
export function generateAssessmentNarrative(data) {
  const narratives = [];

  // Diagnoses
  if (data.icpc_codes && data.icpc_codes.length > 0) {
    narratives.push(`Diagnosis: ${data.icpc_codes.join(', ')}.`);
  }

  // Clinical reasoning
  if (data.clinical_reasoning) {
    narratives.push(`Clinical Impression: ${data.clinical_reasoning}`);
  }

  // Prognosis
  if (data.prognosis) {
    narratives.push(`Prognosis: ${data.prognosis}.`);
  }

  // Red flags
  if (data.red_flags_checked) {
    narratives.push(
      `Red Flags: Reviewed and none identified. Safe to proceed with conservative care.`
    );
  }

  return narratives;
}

// Plan narrative templates
export function generatePlanNarrative(data) {
  const narratives = [];

  // Treatment performed
  if (data.treatments_selected && data.treatments_selected.length > 0) {
    const treatments = data.treatments_selected.map((t) => TREATMENT_LABELS[t] || t);
    narratives.push(`Treatment Performed: ${formatList(treatments)}.`);
  }

  if (data.treatment) {
    narratives.push(`Additional Treatment Notes: ${data.treatment}`);
  }

  // Exercises
  if (data.exercises_selected && data.exercises_selected.length > 0) {
    const exercises = data.exercises_selected.map((e) => EXERCISE_LABELS[e] || e);
    narratives.push(`Home Exercise Program: Patient instructed in ${formatList(exercises)}.`);
  }

  // Advice
  if (data.advice) {
    narratives.push(`Patient Education: ${data.advice}`);
  }

  // VAS improvement
  if (data.vas_pain_start !== null && data.vas_pain_end !== null) {
    const improvement = data.vas_pain_start - data.vas_pain_end;
    if (improvement > 0) {
      narratives.push(
        `Post-Treatment Response: Pain reduced from ${data.vas_pain_start}/10 to ${data.vas_pain_end}/10 (${improvement} point improvement).`
      );
    } else if (improvement < 0) {
      narratives.push(
        `Post-Treatment Response: Pain changed from ${data.vas_pain_start}/10 to ${data.vas_pain_end}/10.`
      );
    } else {
      narratives.push(`Post-Treatment Response: Pain remained at ${data.vas_pain_end}/10.`);
    }
  }

  // Follow-up
  if (data.follow_up) {
    narratives.push(`Follow-up Plan: ${data.follow_up}.`);
  }

  return narratives;
}

// Generate full SOAP narrative
export function generateFullNarrative(data) {
  const sections = {
    subjective: generateSubjectiveNarrative(data),
    objective: generateObjectiveNarrative(data),
    assessment: generateAssessmentNarrative(data),
    plan: generatePlanNarrative(data),
  };

  return sections;
}

// Generate today's encounter summary (like ChiroTouch's header)
export function generateEncounterSummary(data, visitNumber, totalVisits) {
  const parts = [];

  if (visitNumber && totalVisits) {
    parts.push(
      `Today's Daily Encounter: treatment for ${data.encounter_type?.toLowerCase() || 'follow-up'} care on visit ${visitNumber} out of a projected ${totalVisits} visits.`
    );
  }

  if (data.chief_complaint) {
    parts.push(`Chief Complaint: ${data.chief_complaint}.`);
  }

  if (data.vas_pain_start !== null) {
    parts.push(`Pain Scale: currently rated ${data.vas_pain_start}/10, with 10 being the worst.`);
  }

  return parts.join(' ');
}

// Helper function to format list with proper grammar
function formatList(items) {
  if (!items || items.length === 0) {
    return '';
  }
  if (items.length === 1) {
    return items[0];
  }
  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

// Helper to format vertebra with side
function formatVertebra(finding) {
  const sidePrefix = {
    L: 'left',
    R: 'right',
    B: 'bilateral',
    C: '',
  };
  const prefix = sidePrefix[finding.side] || '';
  return prefix ? `${prefix} ${finding.vertebra}` : finding.vertebra;
}

// Label mappings
const PAIN_QUALITY_LABELS = {
  sharp: 'sharp',
  dull: 'dull',
  aching: 'aching',
  burning: 'burning',
  throbbing: 'throbbing',
  stabbing: 'stabbing',
  constant: 'constant',
  intermittent: 'intermittent',
  radiating: 'radiating',
  localized: 'localized',
  referred: 'referred',
  numbness: 'numbness and tingling',
};

const LOCATION_LABELS = {
  head: 'head',
  head_back: 'posterior head',
  neck_front: 'anterior neck',
  neck_back: 'cervical spine',
  upper_back: 'thoracic spine',
  mid_back: 'mid-thoracic region',
  lower_back: 'lumbar spine',
  sacrum: 'sacrum',
  r_si: 'right SI joint',
  l_si: 'left SI joint',
  r_shoulder: 'right shoulder',
  l_shoulder: 'left shoulder',
  r_hip: 'right hip',
  l_hip: 'left hip',
  r_glute: 'right gluteal region',
  l_glute: 'left gluteal region',
};

const AGGRAVATING_LABELS = {
  sitting: 'sitting',
  standing: 'standing',
  lying: 'lying down',
  walking: 'walking',
  bending_forward: 'bending forward',
  bending_backward: 'bending backward',
  twisting: 'twisting',
  lifting: 'lifting',
  reaching: 'reaching overhead',
  prolonged_sitting: 'prolonged sitting',
  driving: 'driving',
  computer_work: 'computer work',
  physical_activity: 'physical activity',
  coughing: 'coughing or sneezing',
};

const RELIEVING_LABELS = {
  rest: 'rest',
  lying_down: 'lying down',
  sitting: 'sitting',
  standing: 'standing',
  position_change: 'changing position',
  heat: 'heat application',
  ice: 'ice application',
  medication: 'medication',
  stretching: 'stretching',
  massage: 'massage',
};

const OBSERVATION_LABELS = {
  forward_head: 'forward head posture',
  rounded_shoulders: 'rounded shoulders',
  increased_kyphosis: 'increased thoracic kyphosis',
  increased_lordosis: 'increased lumbar lordosis',
  decreased_lordosis: 'decreased lumbar lordosis',
  scoliosis: 'scoliotic curvature',
  pelvic_tilt: 'pelvic tilt',
  leg_length_diff: 'short right leg (pelvic deficiency)',
  gait_normal: 'normal gait pattern',
  antalgic_gait: 'antalgic gait',
  limping: 'limping',
  shuffling: 'shuffling gait',
  guarded_movement: 'guarded movement patterns',
  swelling: 'visible swelling',
  bruising: 'bruising',
  muscle_atrophy: 'muscle atrophy',
  muscle_spasm: 'visible muscle spasm',
  skin_changes: 'skin changes',
};

const PALPATION_LABELS = {
  tenderness: 'point tenderness',
  muscle_tension: 'muscle tension/hypertonicity',
  trigger_points: 'trigger points',
  muscle_spasm: 'muscle spasm',
  taut_bands: 'taut bands',
  joint_tenderness: 'joint tenderness',
  decreased_mobility: 'decreased joint mobility',
  hypermobility: 'joint hypermobility',
  crepitus: 'crepitus',
  joint_swelling: 'joint swelling',
  warm: 'warm to touch',
  cool: 'cool to touch',
  edema: 'edema',
  fibrosis: 'fibrotic changes',
};

const ROM_LABELS = {
  c_flex_reduced: 'cervical flexion reduced',
  c_ext_reduced: 'cervical extension reduced',
  c_lat_flex_r_reduced: 'cervical right lateral flexion reduced',
  c_lat_flex_l_reduced: 'cervical left lateral flexion reduced',
  c_rot_r_reduced: 'cervical right rotation reduced',
  c_rot_l_reduced: 'cervical left rotation reduced',
  l_flex_reduced: 'lumbar flexion reduced',
  l_ext_reduced: 'lumbar extension was recorded as moderately reduced with pain noted',
  l_lat_flex_r_reduced: 'lumbar right lateral flexion reduced',
  l_lat_flex_l_reduced: 'lumbar left lateral flexion reduced',
  l_rot_r_reduced: 'lumbar right rotation reduced',
  l_rot_l_reduced: 'lumbar left rotation reduced',
  pain_at_end_range: 'pain at end range',
  pain_throughout: 'pain throughout range',
  deviation: 'deviation during movement',
  centralization: 'centralization noted',
  peripheralization: 'peripheralization noted',
};

const ORTHO_LABELS = {
  slr_pos_r: 'SLR positive right',
  slr_pos_l: 'SLR positive left',
  slr_neg: 'SLR negative bilateral',
  kemps_pos_r: "Kemp's positive right",
  kemps_pos_l: "Kemp's positive left",
  kemps_neg: "Kemp's negative",
  valsalva_pos: 'Valsalva positive',
  milgram_pos: "Milgram's positive",
  spurling_pos_r: "Spurling's positive right",
  spurling_pos_l: "Spurling's positive left",
  spurling_neg: "Spurling's negative",
  distraction_pos: 'Distraction test positive',
  compression_pos: 'Compression test positive',
  shoulder_abduction: 'Shoulder abduction relief sign positive',
  faber_pos_r: 'FABER positive right',
  faber_pos_l: 'FABER positive left',
  gaenslen_pos: "Gaenslen's positive",
  si_compression_pos: 'SI compression positive',
  si_distraction_pos: 'SI distraction positive',
};

const NEURO_LABELS = {
  reflex_normal: 'reflexes normal and symmetrical',
  reflex_diminished: 'reflexes diminished',
  reflex_hyperactive: 'reflexes hyperactive',
  achilles_diminished: 'Achilles reflex diminished',
  patellar_diminished: 'Patellar reflex diminished',
  biceps_diminished: 'Biceps reflex diminished',
  triceps_diminished: 'Triceps reflex diminished',
  sensation_normal: 'sensation intact',
  sensation_diminished: 'sensation diminished',
  dermatomal_deficit: 'dermatomal sensory deficit',
  paresthesia: 'paresthesia reported',
  strength_normal: 'motor strength 5/5 throughout',
  strength_reduced: 'motor strength reduced',
  myotomal_weakness: 'myotomal weakness',
  foot_drop: 'foot drop noted',
  grip_weakness: 'grip weakness noted',
};

const TREATMENT_LABELS = {
  hvla_cervical: 'HVLA manipulation to cervical spine',
  hvla_thoracic: 'HVLA manipulation to thoracic spine',
  hvla_lumbar: 'HVLA manipulation to lumbar spine',
  hvla_si: 'HVLA manipulation to SI joint',
  mobilization: 'joint mobilization',
  drop_technique: 'drop technique',
  activator: 'Activator technique',
  flexion_distraction: 'flexion-distraction technique',
  myofascial_release: 'myofascial release',
  trigger_point: 'trigger point therapy',
  massage: 'therapeutic massage',
  iastm: 'instrument-assisted soft tissue mobilization (IASTM)',
  cupping: 'cupping therapy',
  dry_needling: 'dry needling',
  stretching: 'assisted stretching',
  ultrasound: 'therapeutic ultrasound',
  electrical_stim: 'electrical muscle stimulation',
  tens: 'TENS therapy',
  heat_therapy: 'moist heat therapy',
  ice_therapy: 'cryotherapy',
  laser_therapy: 'laser therapy',
  traction: 'mechanical traction',
};

const EXERCISE_LABELS = {
  neck_stretches: 'neck stretching exercises',
  upper_trap_stretch: 'upper trapezius stretch',
  levator_scap_stretch: 'levator scapulae stretch',
  cat_cow: 'cat-cow stretches',
  knee_to_chest: 'knee-to-chest stretches',
  piriformis_stretch: 'piriformis stretch',
  hip_flexor_stretch: 'hip flexor stretch',
  hamstring_stretch: 'hamstring stretches',
  chin_tucks: 'chin tuck exercises',
  scapular_retraction: 'scapular retraction exercises',
  core_bracing: 'core bracing and activation',
  bird_dog: 'bird-dog exercises',
  dead_bug: 'dead bug exercises',
  bridges: 'glute bridges',
  planks: 'plank exercises',
  clamshells: 'clamshell exercises',
  postural_correction: 'postural correction exercises',
  ergonomic_advice: 'ergonomic workstation setup advice',
  activity_modification: 'activity modification strategies',
  walking_program: 'progressive walking program',
  ice_at_home: 'ice application 15-20 minutes as needed',
  heat_at_home: 'heat application for muscle relaxation',
};

export default {
  generateSubjectiveNarrative,
  generateObjectiveNarrative,
  generateAssessmentNarrative,
  generatePlanNarrative,
  generateFullNarrative,
  generateEncounterSummary,
};
