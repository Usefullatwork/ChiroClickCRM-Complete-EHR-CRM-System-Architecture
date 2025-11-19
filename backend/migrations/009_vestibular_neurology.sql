-- Migration 009: Vestibular & Neurology Assessment Module
-- Adds comprehensive vestibular/dizziness assessment capabilities
-- Created: 2025-11-19

-- ============================================================================
-- VESTIBULAR ASSESSMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS vestibular_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id UUID REFERENCES clinical_encounters(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- ANAMNESE (Sykehistorie)
  -- Type svimmelhet
  dizziness_type TEXT[], -- ['karusell', 'nautisk', 'uvelhet', 'lysømfintlig', 'hjernetåke']
  dizziness_description TEXT, -- Fritekst beskrivelse

  -- Debut
  onset_date DATE,
  onset_description TEXT, -- 'akutt', 'gradvis', 'våknet med det'
  onset_trigger TEXT, -- 'traume', 'virus', 'stress', etc
  duration_description TEXT, -- "Vart i X dager/uker"

  -- Triggere
  triggers JSONB DEFAULT '{}', -- {posisjonsendringer: true, visuelle_stimuli: true, fysisk_aktivitet: true}
  trigger_details TEXT,

  -- Tilleggsplager
  associated_symptoms JSONB DEFAULT '{}', -- {hodepine: true, nakkesmerter: true, tinnitus: true, kvalme: true}
  headache_type TEXT, -- 'spenning', 'migrene', 'trykk'
  neck_symptoms TEXT,
  ear_symptoms JSONB DEFAULT '{}', -- {tinnitus_side: 'hø/ve/bilat', øresus: true, trykk: true}
  autonomic_symptoms TEXT[], -- ['kvalme', 'oppkast', 'kaldsvetting']
  neurological_symptoms TEXT[], -- ['nummenhet', 'stråling', 'kraftsvikt']

  -- UNDERSØKELSE
  -- Ortopediske tester
  ortho_tests JSONB DEFAULT '{}', -- {foraminal_compression: 'ua', jacksons: 'ua', schulder_depression: 'smerte traps'}

  -- Nevrologiske tester
  dtr_reflexes JSONB DEFAULT '{}', -- {biceps_hø: 2, biceps_ve: 2, triceps_hø: 2, ...}
  dermatomes TEXT, -- 'ua' eller beskrivelse av funn
  myotomes TEXT, -- '5/5' eller beskrivelse
  babinski TEXT, -- 'neg' eller 'pos'
  pupil_reflex TEXT, -- 'ua'
  cranial_nerves TEXT,

  -- Cerebellare/Balanse tester
  fukuda_test JSONB DEFAULT '{}', -- {result: 'ua', rotation: '45 gr rot hø', notes: ''}
  rhomberg_test JSONB DEFAULT '{}', -- {result: 'ua', stability: 'ustø', fall_direction: 've'}
  tandem_rhomberg TEXT,
  parietal_arm_test TEXT, -- 'drift'
  coordination JSONB DEFAULT '{}', -- {ftn: 'ua', diadochokinesi: 'ua', dyspraxi: 'ua'}

  -- Oculomotoriske tester
  saccades JSONB DEFAULT '{}', -- {horizontal: 'ua', vertical: 'ua', quality: 'hypometriske'}
  smooth_pursuits JSONB DEFAULT '{}', -- {horizontal: 'ua', vertical: 'saccadic'}
  convergence JSONB DEFAULT '{}', -- {result: 'ua', distance_cm: null, spasm: false}
  gaze_nystagmus TEXT,
  hit_test JSONB DEFAULT '{}', -- {result: 'ua', positive_side: null} -- Halmagyi

  -- BPPV TESTING (Posisjonstester)
  -- Dix-Hallpike
  dix_hallpike_right JSONB DEFAULT '{}', -- {nystagmus: false, type: '', direction: '', intensity: '', character: ''}
  dix_hallpike_left JSONB DEFAULT '{}',

  -- Supine Roll Test (Horisontal)
  supine_roll_right JSONB DEFAULT '{}', -- {nystagmus: false, type: 'geotrop/apogeotrop', intensity: '', character: ''}
  supine_roll_left JSONB DEFAULT '{}',

  -- Foroverbøy / Deep Head Hang
  deep_head_hang JSONB DEFAULT '{}', -- {nystagmus: false, type: 'downbeat', notes: ''}

  -- Lean Test
  lean_test JSONB DEFAULT '{}', -- {bow: 'hø rettet', lean: 've rettet'}

  -- VNG (Videonystagmografi) hvis utført
  vng_performed BOOLEAN DEFAULT false,
  vng_results JSONB DEFAULT '{}', -- {spontan: '', gaze: {}, sakkader: {}, pursuits: {}, opk: {}, kalorisk: ''}

  -- DIAGNOSER
  primary_diagnosis TEXT, -- 'BPPV bakre hø', 'Vestibularis nevritt', etc
  bppv_details JSONB DEFAULT '{}', -- {kanal: 'bakre/horisontal/fremre', type: 'kanalithiasis/cupololithiasis', side: 'hø/ve/bilat'}
  other_diagnoses TEXT[],

  -- BEHANDLING
  -- Reposisjonsmanøvrer
  maneuvers_performed JSONB DEFAULT '[]',
  -- [{type: 'epleys', side: 'hø', location: 'TRV/benk', variant: 'loaded', success: true}]

  -- Manuell behandling
  manual_treatment JSONB DEFAULT '[]',
  -- [{type: 'justering', level: 'C2'}, {type: 'triggerpunkt', muscle: 'trapezius'}]

  -- Rehabilitering / VRT
  vrt_exercises JSONB DEFAULT '[]',
  -- [{type: 'gaze_stability', instructions: ''}, {type: 'balance', instructions: ''}]

  home_exercises TEXT,

  -- Outcome measures
  dhi_score INTEGER, -- Dizziness Handicap Inventory (0-100)
  dhi_data JSONB,

  -- Oppfølging
  follow_up_plan TEXT,
  referral_needed BOOLEAN DEFAULT false,
  referral_to TEXT, -- 'ØNH', 'Nevrolog', etc

  -- Metadata
  assessed_by UUID REFERENCES users(id),
  assessment_date TIMESTAMP DEFAULT NOW(),
  notes TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_vestibular_encounter ON vestibular_assessments(encounter_id);
CREATE INDEX idx_vestibular_patient ON vestibular_assessments(patient_id);
CREATE INDEX idx_vestibular_organization ON vestibular_assessments(organization_id);
CREATE INDEX idx_vestibular_assessment_date ON vestibular_assessments(assessment_date);
CREATE INDEX idx_vestibular_diagnosis ON vestibular_assessments(primary_diagnosis);

-- ============================================================================
-- TRIGGER FOR UPDATED_AT
-- ============================================================================

CREATE TRIGGER update_vestibular_assessments_updated_at
BEFORE UPDATE ON vestibular_assessments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ADD VESTIBULAR DIAGNOSIS CODES
-- ============================================================================

-- BPPV Variants
INSERT INTO diagnosis_codes (code, system, chapter, description_no, description_en, commonly_used) VALUES
('H81.1', 'ICD10', 'H', 'Benign paroksysmal posisjonssvimmelhet (BPPV)', 'Benign paroxysmal positional vertigo', true),
('H81.10', 'ICD10', 'H', 'BPPV bakre buegang', 'BPPV posterior canal', true),
('H81.11', 'ICD10', 'H', 'BPPV horisontal buegang', 'BPPV horizontal canal', true),
('H81.12', 'ICD10', 'H', 'BPPV fremre buegang', 'BPPV anterior canal', true),
('H81.13', 'ICD10', 'H', 'BPPV bilateral/multikanal', 'BPPV bilateral/multicanal', true)
ON CONFLICT (code) DO NOTHING;

-- Andre vestibulære lidelser
INSERT INTO diagnosis_codes (code, system, chapter, description_no, description_en, commonly_used) VALUES
('H81.2', 'ICD10', 'H', 'Vestibularis nevritt', 'Vestibular neuronitis', true),
('H81.0', 'ICD10', 'H', 'Ménières sykdom', 'Ménière disease', true),
('H81.3', 'ICD10', 'H', 'Andre perifervestibulære svimmelheter', 'Other peripheral vertigo', true),
('H81.4', 'ICD10', 'H', 'Sentral svimmelhet', 'Vertigo of central origin', false),
('H81.9', 'ICD10', 'H', 'Svimmelhet uspesifisert', 'Vertigo, unspecified', true),
('R42', 'ICD10', 'R', 'Svimmelhet og ørhet', 'Dizziness and giddiness', true),
('G43.1', 'ICD10', 'G', 'Vestibulær migrene', 'Vestibular migraine', true),
('H83.2', 'ICD10', 'H', 'Labyrintitt', 'Labyrinthitis', true),
('M53.0', 'ICD10', 'M', 'Cervikogen svimmelhet', 'Cervicogenic dizziness', true)
ON CONFLICT (code) DO NOTHING;

-- ICPC-2 koder
INSERT INTO diagnosis_codes (code, system, chapter, description_no, description_en, icd10_mapping, commonly_used) VALUES
('H82', 'ICPC2', 'H', 'Svimmelhet/vertigo', 'Vertiginous syndrome', 'H81.9', true),
('N17', 'ICPC2', 'N', 'Svimmelhet/ørhet', 'Dizziness/giddiness', 'R42', true)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- ADD VESTIBULAR TREATMENT CODES
-- ============================================================================

INSERT INTO treatment_codes (code, description, description_en, default_price, default_duration, commonly_used) VALUES
('VEST01', 'Vestibulær undersøkelse med VNG', 'Vestibular assessment with VNG', 1200.00, 45, true),
('VEST02', 'BPPV reposisjonsmanøver', 'BPPV repositioning maneuver', 750.00, 30, true),
('VEST03', 'Vestibulær rehabilitering (VRT)', 'Vestibular rehabilitation therapy', 850.00, 40, true),
('VEST04', 'Kompleks vestibulær behandling', 'Complex vestibular treatment', 1100.00, 60, false)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE vestibular_assessments IS 'Comprehensive vestibular and dizziness assessments including BPPV testing, VNG, and treatment tracking';
COMMENT ON COLUMN vestibular_assessments.dizziness_type IS 'Type of dizziness: karusell, nautisk, uvelhet, lysømfintlig, hjernetåke, etc';
COMMENT ON COLUMN vestibular_assessments.bppv_details IS 'BPPV specifics: kanal (bakre/horisontal/fremre), type (kanalithiasis/cupololithiasis), side (hø/ve/bilat)';
COMMENT ON COLUMN vestibular_assessments.maneuvers_performed IS 'Array of repositioning maneuvers: Epleys, BBQ Roll, Semont, Deep Head Hang, Gufoni, etc';
COMMENT ON COLUMN vestibular_assessments.vrt_exercises IS 'Vestibular rehabilitation exercises: gaze stability, balance training, habituation';
COMMENT ON COLUMN vestibular_assessments.dhi_score IS 'Dizziness Handicap Inventory score (0-100, higher = more disability)';
