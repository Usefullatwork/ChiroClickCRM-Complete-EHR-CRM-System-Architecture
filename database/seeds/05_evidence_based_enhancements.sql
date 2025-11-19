-- ============================================================================
-- ENHANCED ORTHOPEDIC TESTS WITH 2024 EVIDENCE-BASED DATA
-- Updated with latest sensitivity/specificity from systematic reviews
-- ============================================================================

-- Update existing tests with latest evidence (December 2024 systematic review data)

-- SHOULDER TESTS - Updated with 2024 Evidence
UPDATE clinical_tests_library
SET
  sensitivity = 0.70,
  specificity = 0.81,
  description_en = 'Full Can Test (Scaption Test) - Resisted abduction at 90° with external rotation',
  description_no = 'Full Can Test (Scaption Test) - Resistert abduksjon ved 90° med ekstern rotasjon'
WHERE code = 'empty_can';

-- Add new evidence-based shoulder tests from 2024 research

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_en, description_no, positive_finding_en, positive_finding_no,
  indicates_conditions, result_type, result_options, sensitivity, specificity) VALUES

('external_rotation_lag_90', 'External Rotation Lag Sign at 90°', 'External Rotation Lag Sign ved 90°',
  'ORTHOPEDIC', 'shoulder', 'musculoskeletal',
  'Patient arm positioned at 90° abduction and 90° elbow flexion, examiner externally rotates shoulder maximally, patient attempts to maintain position',
  'Pasientens arm posisjonert ved 90° abduksjon og 90° albuebøyning, behandler roterer skulder eksternt maksimalt, pasient forsøker å opprettholde posisjon',
  'Arm drops from externally rotated position (lag sign present)',
  'Arm faller fra eksternt rotert posisjon (lag tegn tilstede)',
  ARRAY['rotator cuff tear', 'infraspinatus tear', 'teres minor tear'],
  'BINARY', '{"positive": "Lag sign present", "negative": "No lag"}'::jsonb,
  0.84, 0.92),

('internal_rotation_lag', 'Internal Rotation Lag Sign', 'Internal Rotation Lag Sign',
  'ORTHOPEDIC', 'shoulder', 'musculoskeletal',
  'Hand placed behind back at waist level, examiner lifts hand posteriorly, patient attempts to maintain position',
  'Hånd plassert bak rygg i midjen, behandler løfter hånd bakover, pasient forsøker å opprettholde posisjon',
  'Hand drops anteriorly when released (lag sign)',
  'Hånd faller fremover når sluppet (lag tegn)',
  ARRAY['subscapularis tear'],
  'BINARY', '{"positive": "Lag present", "negative": "No lag"}'::jsonb,
  0.56, 0.94),

('bear_hug_test', 'Bear Hug Test', 'Bear Hug Test',
  'ORTHOPEDIC', 'shoulder', 'musculoskeletal',
  'Patient places palm on opposite shoulder, examiner attempts to pull hand away from shoulder',
  'Pasient plasserer håndflate på motsatt skulder, behandler forsøker å trekke hånd vekk fra skulder',
  'Inability to hold hand against shoulder',
  'Ikke i stand til å holde hånd mot skulder',
  ARRAY['subscapularis tear'],
  'BINARY', '{"positive": "Unable to hold", "negative": "Holds position"}'::jsonb,
  0.57, 0.92),

('hornblowers_sign', 'Hornblower''s Sign', 'Hornblowers Tegn',
  'ORTHOPEDIC', 'shoulder', 'musculoskeletal',
  'Shoulder abducted 90°, elbow flexed 90°, patient attempts to externally rotate against resistance',
  'Skulder abdusert 90°, albue flektert 90°, pasient forsøker å rotere eksternt mot motstand',
  'Inability to externally rotate or hold position',
  'Ikke i stand til å rotere eksternt eller holde posisjon',
  ARRAY['teres minor tear', 'infraspinatus tear'],
  'BINARY', '{"positive": "Cannot external rotate", "negative": "Normal ER strength"}'::jsonb,
  0.32, 0.96);

-- LUMBAR SPINE TESTS - Updated with evidence

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_en, description_no, positive_finding_en, positive_finding_no,
  indicates_conditions, result_type, result_options, sensitivity, specificity) VALUES

('passive_lumbar_extension', 'Passive Lumbar Extension Test (PLE)', 'Passiv Lumbal Ekstensjon Test (PLE)',
  'ORTHOPEDIC', 'lumbar', 'musculoskeletal',
  'Patient prone, examiner passively extends lumbar spine by lifting legs',
  'Pasient i mageleie, behandler passivt ekstenderer lumbalryggen ved å løfte ben',
  'Reproduction of familiar pain in lumbar region',
  'Reproduksjon av kjent smerte i lumbal område',
  ARRAY['lumbar instability', 'spondylolisthesis'],
  'BINARY', '{"positive": "Pain reproduced", "negative": "No pain"}'::jsonb,
  0.84, 0.90),

('prone_instability_test', 'Prone Instability Test (PIT)', 'Prone Instability Test (PIT)',
  'ORTHOPEDIC', 'lumbar', 'musculoskeletal',
  'Patient prone, legs off table, examiner palpates spinous processes with pressure, patient then lifts legs',
  'Pasient i mageleie, ben utenfor benk, behandler palperer spinøse prosesser med trykk, pasient løfter deretter ben',
  'Pain with pressure that disappears when legs lifted',
  'Smerte med trykk som forsvinner når ben løftes',
  ARRAY['lumbar instability'],
  'BINARY', '{"positive": "Pain eliminated with contraction", "negative": "No change"}'::jsonb,
  0.71, 0.57),

('femoral_nerve_stretch', 'Femoral Nerve Stretch Test', 'Femoral Nerve Stretch Test',
  'NEUROLOGICAL', 'lumbar', 'nervous',
  'Patient prone or side-lying, knee flexed, hip extended',
  'Pasient i mageleie eller sideleie, kne flektert, hofte ekstendert',
  'Anterior thigh pain or paresthesia',
  'Fremre lår smerte eller parestesi',
  ARRAY['L2-L4 radiculopathy', 'femoral nerve compression'],
  'BINARY', '{"positive": "Anterior thigh symptoms", "negative": "No symptoms"}'::jsonb,
  1.00, 0.83),

('crossed_slr', 'Crossed Straight Leg Raise (Well Leg Raise)', 'Crossed SLR (Well Leg Raise)',
  'NEUROLOGICAL', 'lumbar', 'nervous',
  'SLR performed on unaffected leg',
  'SLR utført på upåvirket ben',
  'Reproduction of symptoms in affected leg',
  'Reproduksjon av symptomer i påvirket ben',
  ARRAY['disc herniation', 'nerve root compression'],
  'BINARY', '{"positive": "Contralateral symptoms", "negative": "No symptoms"}'::jsonb,
  0.29, 0.90);

-- ============================================================================
-- RED FLAGS SCREENING SYSTEM (2024 Evidence)
-- Based on systematic review of clinical practice guidelines
-- ============================================================================

CREATE TABLE IF NOT EXISTS red_flags_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Red flag identification
  code VARCHAR(100) UNIQUE NOT NULL,
  flag_name_en VARCHAR(255) NOT NULL,
  flag_name_no VARCHAR(255) NOT NULL,

  -- Clinical category
  pathology_category VARCHAR(50) CHECK (pathology_category IN (
    'FRACTURE',
    'CANCER',
    'INFECTION',
    'MYELOPATHY',
    'CAUDA_EQUINA',
    'ARTERY_DISSECTION',
    'INFLAMMATORY_ARTHRITIS',
    'VASCULAR'
  )) NOT NULL,

  -- Body region
  body_region VARCHAR(50), -- 'cervical', 'thoracic', 'lumbar', 'general'

  -- Red flag description
  description_en TEXT NOT NULL,
  description_no TEXT NOT NULL,

  -- Clinical significance
  significance_level VARCHAR(20) CHECK (significance_level IN ('HIGH', 'MODERATE', 'LOW')),

  -- Evidence level
  evidence_level VARCHAR(20) CHECK (evidence_level IN (
    'STRONG',        -- High quality evidence
    'MODERATE',      -- Moderate quality evidence
    'WEAK',          -- Low quality evidence
    'EXPERT_OPINION' -- Expert opinion only
  )),

  -- Recommended action
  recommended_action_en TEXT,
  recommended_action_no TEXT,

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Populate red flags from 2024 systematic review
INSERT INTO red_flags_library (code, flag_name_en, flag_name_no, pathology_category, body_region,
  description_en, description_no, significance_level, evidence_level,
  recommended_action_en, recommended_action_no) VALUES

-- FRACTURE RED FLAGS
('rf_fracture_age', 'Age >50 or >65', 'Alder >50 eller >65', 'FRACTURE', 'general',
  'Patient age over 50-65 years increases fracture risk',
  'Pasientalder over 50-65 år øker frakturrisiko',
  'MODERATE', 'MODERATE',
  'Consider imaging if combined with other risk factors',
  'Vurder bildediagnostikk hvis kombinert med andre risikofaktorer'),

('rf_fracture_trauma', 'Significant Trauma', 'Signifikant Traume', 'FRACTURE', 'general',
  'History of significant trauma (fall from height, MVA, etc.)',
  'Historie med signifikant traume (fall fra høyde, MVA, etc.)',
  'HIGH', 'STRONG',
  'Immediate imaging recommended. Use Canadian C-Spine Rule for cervical trauma',
  'Umiddelbar bildediagnostikk anbefalt. Bruk Canadian C-Spine Rule for cervical traume'),

('rf_fracture_osteoporosis', 'Prolonged Corticosteroid Use/Osteoporosis', 'Langvarig Kortikosteroidbruk/Osteoporose', 'FRACTURE', 'general',
  'History of osteoporosis or prolonged corticosteroid use (>3 months)',
  'Historie med osteoporose eller langvarig kortikosteroidbruk (>3 måneder)',
  'MODERATE', 'MODERATE',
  'Consider DEXA scan and imaging if symptomatic',
  'Vurder DEXA scan og bildediagnostikk hvis symptomatisk'),

-- CANCER RED FLAGS
('rf_cancer_age', 'Age >50', 'Alder >50', 'CANCER', 'general',
  'Age over 50 years with new onset pain',
  'Alder over 50 år med ny debut smerte',
  'MODERATE', 'MODERATE',
  'Monitor closely, especially if combined with other flags',
  'Overvåk nøye, spesielt hvis kombinert med andre flag'),

('rf_cancer_history', 'History of Cancer', 'Historie med Kreft', 'CANCER', 'general',
  'Previous cancer diagnosis, especially breast, lung, prostate, kidney, thyroid',
  'Tidligere kreftdiagnose, spesielt bryst, lunge, prostata, nyre, skjoldbruskkjertel',
  'HIGH', 'STRONG',
  'Immediate referral for imaging and oncology consult',
  'Umiddelbar henvisning for bildediagnostikk og onkologi konsultasjon'),

('rf_cancer_weight_loss', 'Unexplained Weight Loss', 'Uforklarlig Vekttap', 'CANCER', 'general',
  'Unintentional weight loss >10 lbs (4.5 kg) in short period',
  'Utilsiktet vekttap >10 lbs (4.5 kg) på kort tid',
  'HIGH', 'MODERATE',
  'Comprehensive medical evaluation required',
  'Omfattende medisinsk evaluering nødvendig'),

('rf_cancer_night_pain', 'Severe Night Pain', 'Alvorlig Nattsmerter', 'CANCER', 'general',
  'Pain that worsens at night and not relieved by rest or position change',
  'Smerte som forverres om natten og ikke lindres av hvile eller posisjonsendring',
  'MODERATE', 'MODERATE',
  'Monitor and combine with other clinical findings',
  'Overvåk og kombiner med andre kliniske funn'),

-- INFECTION RED FLAGS
('rf_infection_fever', 'Fever >38°C (100.4°F)', 'Feber >38°C (100.4°F)', 'INFECTION', 'general',
  'Temperature elevation suggesting systemic infection',
  'Temperaturforhøyelse som tyder på systemisk infeksjon',
  'HIGH', 'STRONG',
  'Immediate medical referral, blood work including CRP/ESR',
  'Umiddelbar medisinsk henvisning, blodprøver inkludert CRP/ESR'),

('rf_infection_iv_drug', 'IV Drug Use', 'Intravenøs Narkotikabruk', 'INFECTION', 'general',
  'History of intravenous drug use',
  'Historie med intravenøs narkotikabruk',
  'HIGH', 'MODERATE',
  'High suspicion for spinal infection, immediate referral',
  'Høy mistanke for spinal infeksjon, umiddelbar henvisning'),

('rf_infection_immunocompromised', 'Immunocompromised Status', 'Immunsvekket Status', 'INFECTION', 'general',
  'HIV, diabetes, on immunosuppressants, recent infection',
  'HIV, diabetes, på immunsuppressive, nylig infeksjon',
  'HIGH', 'MODERATE',
  'Lower threshold for imaging and referral',
  'Lavere terskel for bildediagnostikk og henvisning'),

-- CAUDA EQUINA RED FLAGS
('rf_ce_bowel_bladder', 'Bowel/Bladder Dysfunction', 'Tarm/Blære Dysfunksjon', 'CAUDA_EQUINA', 'lumbar',
  'New onset urinary retention, incontinence, or loss of anal sphincter tone',
  'Ny debut urinretensjon, inkontinens, eller tap av anal sphincter tonus',
  'HIGH', 'STRONG',
  'EMERGENCY - Immediate hospital referral required',
  'NØDSTILFELLE - Umiddelbar sykehushenvisning nødvendig'),

('rf_ce_saddle_anesthesia', 'Saddle Anesthesia', 'Sadel Anestesi', 'CAUDA_EQUINA', 'lumbar',
  'Loss of sensation in saddle/perineal region',
  'Tap av sensasjon i sadel/perineal område',
  'HIGH', 'STRONG',
  'EMERGENCY - Immediate hospital referral required',
  'NØDSTILFELLE - Umiddelbar sykehushenvisning nødvendig'),

('rf_ce_progressive_neuro', 'Progressive Neurological Deficit', 'Progressiv Nevrologisk Defisit', 'CAUDA_EQUINA', 'lumbar',
  'Rapidly worsening lower extremity weakness or numbness',
  'Raskt forverrende underekstremitet svakhet eller nummenhet',
  'HIGH', 'STRONG',
  'Urgent referral within 24 hours',
  'Akutt henvisning innen 24 timer'),

-- MYELOPATHY RED FLAGS
('rf_myelo_gait', 'Gait Disturbance', 'Gangforstyrrelse', 'MYELOPATHY', 'cervical',
  'Wide-based, unsteady gait; frequent falls',
  'Bredbaset, ustø gange; hyppige fall',
  'HIGH', 'MODERATE',
  'Neurological referral, consider MRI cervical spine',
  'Nevrologisk henvisning, vurder MR cervikalcolumna'),

('rf_myelo_hoffmann', 'Positive Hoffmann''s Sign', 'Positiv Hoffmans Tegn', 'MYELOPATHY', 'cervical',
  'Pathological reflex indicating upper motor neuron lesion',
  'Patologisk refleks som indikerer øvre motorisk nevronlesjon',
  'HIGH', 'MODERATE',
  'Neurological examination and imaging',
  'Nevrologisk undersøkelse og bildediagnostikk'),

('rf_myelo_clonus', 'Clonus', 'Clonus', 'MYELOPATHY', 'cervical',
  'Rhythmic muscular contractions indicating UMN lesion',
  'Rytmiske muskelsammentrekninger som indikerer UMN lesjon',
  'HIGH', 'MODERATE',
  'Neurological referral required',
  'Nevrologisk henvisning nødvendig'),

-- VASCULAR/ARTERY DISSECTION
('rf_vad_severe_headache', 'Sudden Severe Headache', 'Plutselig Alvorlig Hodepine', 'ARTERY_DISSECTION', 'cervical',
  'Worst headache of life, thunderclap headache',
  'Verste hodepine i livet, thunderclap hodepine',
  'HIGH', 'STRONG',
  'EMERGENCY - Immediate hospital referral, rule out dissection/SAH',
  'NØDSTILFELLE - Umiddelbar sykehushenvisning, utelukk diseksjon/SAH'),

('rf_vad_horner', 'Horner''s Syndrome', 'Horners Syndrom', 'ARTERY_DISSECTION', 'cervical',
  'Ptosis, miosis, anhidrosis suggesting sympathetic disruption',
  'Ptosis, miosis, anhidrosis som tyder på sympatisk forstyrrelse',
  'HIGH', 'STRONG',
  'EMERGENCY - Immediate vascular imaging',
  'NØDSTILFELLE - Umiddelbar vaskulær bildediagnostikk'),

('rf_vad_neck_trauma', 'Recent Neck Trauma/Manipulation', 'Nylig Nakketraume/Manipulasjon', 'ARTERY_DISSECTION', 'cervical',
  'Recent significant neck trauma or cervical manipulation',
  'Nylig signifikant nakketraume eller cervical manipulasjon',
  'MODERATE', 'MODERATE',
  'If combined with neurological symptoms, urgent imaging',
  'Hvis kombinert med nevrologiske symptomer, akutt bildediagnostikk');

-- Create index for efficient querying
CREATE INDEX idx_red_flags_category ON red_flags_library(pathology_category);
CREATE INDEX idx_red_flags_region ON red_flags_library(body_region);
CREATE INDEX idx_red_flags_significance ON red_flags_library(significance_level);

-- ============================================================================
-- FUNCTIONAL MOVEMENT SCREEN (FMS) TEMPLATES
-- ============================================================================

INSERT INTO clinical_templates (code, name_en, name_no, category_id, template_type, soap_section,
  content_en, content_no, template_data, keywords, body_region)
SELECT
  'obj_fms_deep_squat', 'FMS: Deep Squat', 'FMS: Dyp Knebøy', id, 'SPECIAL_TEST', 'OBJECTIVE',
  'FMS Deep Squat: Score {{score}}/3. {{findings}}',
  'FMS Dyp Knebøy: Poengsum {{score}}/3. {{findings}}',
  '{"scoring": {
    "3": "Upper torso parallel with tibia, femur below horizontal, knees over feet, dowel aligned over feet",
    "2": "Same as 3 but with 2x6 under heels",
    "1": "Cannot achieve criteria with board",
    "0": "Pain during test"
  }}'::jsonb,
  ARRAY['FMS', 'functional movement', 'screening', 'squat'],
  'general'
FROM template_categories WHERE code = 'obj_general_vitals';

INSERT INTO clinical_templates (code, name_en, name_no, category_id, template_type, soap_section,
  content_en, content_no, template_data, keywords, body_region)
SELECT
  'obj_fms_hurdle_step', 'FMS: Hurdle Step', 'FMS: Hurdle Step', id, 'SPECIAL_TEST', 'OBJECTIVE',
  'FMS Hurdle Step: R {{score_r}}/3, L {{score_l}}/3. {{findings}}',
  'FMS Hurdle Step: H {{score_r}}/3, V {{score_l}}/3. {{findings}}',
  '{"scoring": {
    "3": "Hips, knees, ankles aligned in sagittal plane, minimal movement of spine, dowel/hurdle contact maintained",
    "2": "Movement demonstrated but alignment lost",
    "1": "Cannot complete movement",
    "0": "Pain during test"
  }}'::jsonb,
  ARRAY['FMS', 'functional movement', 'hurdle', 'mobility'],
  'lower_extremity'
FROM template_categories WHERE code = 'obj_general_vitals';

-- ============================================================================
-- ENHANCED PAIN ASSESSMENT SCALES
-- Updated with 2024 regulatory guidance (FDA recommendations)
-- ============================================================================

INSERT INTO clinical_templates (code, name_en, name_no, category_id, template_type, soap_section,
  content_en, content_no, template_data, keywords)
SELECT
  'subj_nprs_current', 'NPRS - Current Pain', 'NPRS - Nåværende Smerte', id, 'SCALE_CUSTOM', 'SUBJECTIVE',
  'Current Pain (NPRS 0-10): {{score}}/10',
  'Nåværende Smerte (NPRS 0-10): {{score}}/10',
  '{"scale_type": "NPRS",
    "min": 0,
    "max": 10,
    "mcid": 2.0,
    "description": "0 = No pain, 10 = Worst imaginable pain",
    "labels": {
      "0": "No pain",
      "1-3": "Mild pain",
      "4-6": "Moderate pain",
      "7-9": "Severe pain",
      "10": "Worst imaginable pain"
    }
  }'::jsonb,
  ARRAY['pain', 'NPRS', 'numeric rating scale', 'outcome measure']
FROM template_categories WHERE code = 'subj_pain_description';

INSERT INTO clinical_templates (code, name_en, name_no, category_id, template_type, soap_section,
  content_en, content_no, template_data, keywords)
SELECT
  'subj_nprs_best_worst', 'NPRS - Best/Worst/Average', 'NPRS - Best/Verst/Gjennomsnitt', id, 'STRUCTURED_FORM', 'SUBJECTIVE',
  'Pain Intensity (NPRS 0-10): Best {{best}}/10, Worst {{worst}}/10, Average {{average}}/10',
  'Smerteintensitet (NPRS 0-10): Best {{best}}/10, Verst {{worst}}/10, Gjennomsnitt {{average}}/10',
  '{"fields": [
    {"name": "best", "type": "number", "min": 0, "max": 10, "label": "Best pain in last 24h"},
    {"name": "worst", "type": "number", "min": 0, "max": 10, "label": "Worst pain in last 24h"},
    {"name": "average", "type": "number", "min": 0, "max": 10, "label": "Average pain in last 24h"}
  ],
  "mcid": 2.0,
  "mdc": 2.5
  }'::jsonb,
  ARRAY['pain', 'NPRS', 'outcome measure']
FROM template_categories WHERE code = 'subj_pain_description';

-- ============================================================================
-- EVIDENCE-BASED TEST CLUSTERS
-- Based on research showing improved diagnostic accuracy with test combinations
-- ============================================================================

CREATE TABLE IF NOT EXISTS test_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Cluster identification
  cluster_name_en VARCHAR(255) NOT NULL,
  cluster_name_no VARCHAR(255) NOT NULL,

  -- Clinical indication
  suspected_condition VARCHAR(255) NOT NULL,
  body_region VARCHAR(50),

  -- Tests in cluster (array of test codes)
  test_codes TEXT[] NOT NULL,

  -- Interpretation rules
  positive_criteria_en TEXT, -- e.g., "3 or more tests positive"
  positive_criteria_no TEXT,

  -- Evidence
  sensitivity DECIMAL(5,2),
  specificity DECIMAL(5,2),
  evidence_level VARCHAR(20),
  reference_citation TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

-- Add evidence-based test clusters
INSERT INTO test_clusters (cluster_name_en, cluster_name_no, suspected_condition, body_region, test_codes,
  positive_criteria_en, positive_criteria_no, sensitivity, specificity, evidence_level) VALUES

('Cervical Radiculopathy Cluster', 'Cervical Radikulopati Cluster', 'Cervical Radiculopathy', 'cervical',
  ARRAY['spurling_test', 'cervical_distraction', 'slump_test'],
  '2 or more positive tests increases diagnostic confidence',
  '2 eller flere positive tester øker diagnostisk tillit',
  0.85, 0.78, 'MODERATE'),

('Rotator Cuff Tear Cluster', 'Rotator Cuff Rift Cluster', 'Rotator Cuff Tear', 'shoulder',
  ARRAY['external_rotation_lag_90', 'drop_arm', 'hornblowers_sign'],
  '1 or more lag signs highly specific for full-thickness tear',
  '1 eller flere lag tegn høyt spesifikk for full-tykkelse rift',
  0.68, 0.95, 'STRONG'),

('Lumbar Instability Cluster', 'Lumbar Instabilitet Cluster', 'Lumbar Instability', 'lumbar',
  ARRAY['passive_lumbar_extension', 'prone_instability_test'],
  'Both tests positive suggests clinical instability',
  'Begge tester positive tyder på klinisk instabilitet',
  0.72, 0.82, 'MODERATE'),

('SIJ Dysfunction Cluster', 'SIL Dysfunksjon Cluster', 'Sacroiliac Joint Dysfunction', 'lumbar',
  ARRAY['gaenslen_test', 'thigh_thrust', 'si_distraction'],
  '3 or more out of 5 SIJ tests positive',
  '3 eller flere av 5 SIL tester positive',
  0.85, 0.79, 'MODERATE');

CREATE INDEX idx_test_clusters_condition ON test_clusters(suspected_condition);
CREATE INDEX idx_test_clusters_region ON test_clusters(body_region);

COMMENT ON TABLE red_flags_library IS 'Comprehensive red flags screening system based on 2024 systematic review of clinical practice guidelines';
COMMENT ON TABLE test_clusters IS 'Evidence-based test combinations with improved diagnostic accuracy compared to single tests';
