-- Migration 010: Advanced Vestibular Testing Additions
-- Adds vHIT, VEMP, DVA, and Carrick receptor-based methods
-- Based on 2025 best practices and functional neurology
-- Created: 2025-11-19

-- ============================================================================
-- ADD ADVANCED TESTING FIELDS TO vestibular_assessments
-- ============================================================================

ALTER TABLE vestibular_assessments ADD COLUMN IF NOT EXISTS
  -- vHIT (Video Head Impulse Test) - All 6 semicircular canals
  vhit_performed BOOLEAN DEFAULT false;

ALTER TABLE vestibular_assessments ADD COLUMN IF NOT EXISTS
  vhit_results JSONB DEFAULT '{}';
  -- {
  --   horizontal_right: {vor_gain: 0.95, corrective_saccades: false},
  --   horizontal_left: {vor_gain: 0.92, corrective_saccades: false},
  --   posterior_right: {vor_gain: 0.88, corrective_saccades: false},
  --   posterior_left: {vor_gain: 0.90, corrective_saccades: false},
  --   anterior_right: {vor_gain: 0.85, corrective_saccades: true},
  --   anterior_left: {vor_gain: 0.87, corrective_saccades: false},
  --   protocol: 'HIMP' or 'SHIMP',
  --   notes: ''
  -- }

ALTER TABLE vestibular_assessments ADD COLUMN IF NOT EXISTS
  -- VEMP (Vestibular Evoked Myogenic Potential)
  vemp_performed BOOLEAN DEFAULT false;

ALTER TABLE vestibular_assessments ADD COLUMN IF NOT EXISTS
  vemp_results JSONB DEFAULT '{}';
  -- {
  --   cvemp_right: {p1_latency: 13.5, n1_latency: 23.2, p1_n1_amplitude: 85, threshold: 95},
  --   cvemp_left: {p1_latency: 13.8, n1_latency: 23.5, p1_n1_amplitude: 80, threshold: 95},
  --   ovemp_right: {n1_latency: 10.5, p1_latency: 15.2, amplitude: 12},
  --   ovemp_left: {n1_latency: 10.8, p1_latency: 15.5, amplitude: 11},
  --   asymmetry_ratio: 0.05,
  --   interpretation: 'Normal bilateral responses',
  --   notes: ''
  -- }

ALTER TABLE vestibular_assessments ADD COLUMN IF NOT EXISTS
  -- DVA (Dynamic Visual Acuity) - Functional VOR assessment
  dva_performed BOOLEAN DEFAULT false;

ALTER TABLE vestibular_assessments ADD COLUMN IF NOT EXISTS
  dva_results JSONB DEFAULT '{}';
  -- {
  --   static_acuity: '20/20',
  --   dynamic_acuity_horizontal: '20/25',
  --   dynamic_acuity_vertical: '20/30',
  --   lines_lost_horizontal: 1,
  --   lines_lost_vertical: 2,
  --   abnormal: false,  -- >2 lines = abnormal
  --   head_velocity_achieved: 150,  -- degrees/second
  --   notes: ''
  -- }

ALTER TABLE vestibular_assessments ADD COLUMN IF NOT EXISTS
  -- Rotational Chair Testing
  rotational_chair_performed BOOLEAN DEFAULT false;

ALTER TABLE vestibular_assessments ADD COLUMN IF NOT EXISTS
  rotational_chair_results JSONB DEFAULT '{}';
  -- {
  --   gain: {0.01Hz: 0.55, 0.02Hz: 0.65, 0.04Hz: 0.75},
  --   phase: {0.01Hz: -5, 0.02Hz: 0, 0.04Hz: 5},
  --   symmetry: 95,  -- percentage
  --   directional_preponderance: 5,  -- percentage
  --   interpretation: '',
  --   notes: ''
  -- }

ALTER TABLE vestibular_assessments ADD COLUMN IF NOT EXISTS
  -- Testing Sequence Tracking (Important: Supine Roll First!)
  test_sequence JSONB DEFAULT '[]';
  -- [{test: 'supine_roll', order: 1, time: '10:30'}, {test: 'dix_hallpike_right', order: 2, time: '10:35'}]

ALTER TABLE vestibular_assessments ADD COLUMN IF NOT EXISTS
  -- Carrick Receptor-Based Rehabilitation
  receptor_based_treatments JSONB DEFAULT '[]';
  -- [
  --   {type: 'visual', method: 'color_filters', details: 'Blue filter right eye', duration: '10 min'},
  --   {type: 'visual', method: 'light_stimulation', details: 'LED panel optokinetic', duration: '5 min'},
  --   {type: 'auditory', method: 'sound_therapy', details: 'Binaural beats 40Hz', duration: '10 min'},
  --   {type: 'proprioceptive', method: 'vibration', details: 'Cervical vibration 100Hz', duration: '2 min'},
  --   {type: 'vestibular', method: 'interactive_metronome', details: 'Rhythmic timing exercises', duration: '15 min'}
  -- ]

ALTER TABLE vestibular_assessments ADD COLUMN IF NOT EXISTS
  -- Enhanced VRT Protocol with Evidence-Based Dosing
  vrt_protocol JSONB DEFAULT '{}';
  -- {
  --   phase: 'acute' or 'subacute' or 'chronic',
  --   laterality: 'unilateral' or 'bilateral',
  --   gaze_stabilization: {
  --     frequency_per_day: 3,
  --     duration_minutes: 12,
  --     total_duration_weeks: 4,
  --     exercises: ['X1 viewing horizontal', 'X1 viewing vertical', 'X2 viewing']
  --   },
  --   balance: {
  --     frequency_per_day: 1,
  --     duration_minutes: 20,
  --     total_duration_weeks: 6,
  --     exercises: ['Static balance eyes open/closed', 'Dynamic balance', 'Tandem walking']
  --   },
  --   habituation: {
  --     provocative_stimuli: ['Rolling over in bed', 'Looking up', 'Bending forward'],
  --     frequency_per_day: 3,
  --     repetitions: 5
  --   },
  --   adaptation_substitution: {
  --     exercises: ['VOR adaptation with head turns', 'Saccadic substitution training'],
  --     frequency_per_day: 3,
  --     duration_minutes: 10
  --   }
  -- }

ALTER TABLE vestibular_assessments ADD COLUMN IF NOT EXISTS
  -- Functional Neurology Assessment
  functional_neuro_assessment JSONB DEFAULT '{}';
  -- {
  --   cognitive: {memory: 'intact', attention: 'impaired', executive_function: 'intact'},
  --   coordination: {finger_tapping: 'normal', alternating_movements: 'dysdiadochokinesia'},
  --   proprioception: {joint_position_sense: 'intact', vibration_sense: 'intact'},
  --   visual_processing: {visual_tracking: 'saccadic', peripheral_vision: 'intact'},
  --   autonomic: {orthostatic_vitals: 'normal', pupil_response: 'normal'}
  -- }

-- ============================================================================
-- ADD NEW OUTCOME MEASURES
-- ============================================================================

ALTER TABLE vestibular_assessments ADD COLUMN IF NOT EXISTS
  -- Additional Outcome Measures
  abc_score INTEGER; -- Activities-Specific Balance Confidence Scale (0-100)

ALTER TABLE vestibular_assessments ADD COLUMN IF NOT EXISTS
  abc_data JSONB;

ALTER TABLE vestibular_assessments ADD COLUMN IF NOT EXISTS
  vsr_score INTEGER; -- Vestibular/Spatial Disorientation Score

ALTER TABLE vestibular_assessments ADD COLUMN IF NOT EXISTS
  vsr_data JSONB;

ALTER TABLE vestibular_assessments ADD COLUMN IF NOT EXISTS
  post_concussion_score INTEGER; -- For mTBI/concussion cases with vestibular involvement

ALTER TABLE vestibular_assessments ADD COLUMN IF NOT EXISTS
  post_concussion_data JSONB;

-- ============================================================================
-- CREATE INDEXES FOR NEW FIELDS
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_vestibular_vhit ON vestibular_assessments(vhit_performed) WHERE vhit_performed = true;
CREATE INDEX IF NOT EXISTS idx_vestibular_vemp ON vestibular_assessments(vemp_performed) WHERE vemp_performed = true;
CREATE INDEX IF NOT EXISTS idx_vestibular_dva ON vestibular_assessments(dva_performed) WHERE dva_performed = true;

-- ============================================================================
-- ADD NEW DIAGNOSIS CODES
-- ============================================================================

-- Superior Canal Dehiscence (requires VEMP for diagnosis)
INSERT INTO diagnosis_codes (code, system, chapter, description_no, description_en, commonly_used) VALUES
('H83.8X9', 'ICD10', 'H', 'Superior canal dehiscence syndrom', 'Superior canal dehiscence syndrome', false)
ON CONFLICT (code) DO NOTHING;

-- Bilateral vestibulopathy
INSERT INTO diagnosis_codes (code, system, chapter, description_no, description_en, commonly_used) VALUES
('H81.23', 'ICD10', 'H', 'Bilateral vestibulopati', 'Bilateral vestibulopathy', false)
ON CONFLICT (code) DO NOTHING;

-- Post-concussion vestibular disorder
INSERT INTO diagnosis_codes (code, system, chapter, description_no, description_en, commonly_used) VALUES
('F07.81', 'ICD10', 'F', 'Postcommosjonelt syndrom', 'Postconcussional syndrome', true),
('S06.0', 'ICD10', 'S', 'Hjernerystelse', 'Concussion', true)
ON CONFLICT (code) DO NOTHING;

-- Mal de Debarquement
INSERT INTO diagnosis_codes (code, system, chapter, description_no, description_en, commonly_used) VALUES
('R42', 'ICD10', 'R', 'Mal de debarquement', 'Mal de debarquement', false)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- ADD NEW TREATMENT CODES
-- ============================================================================

INSERT INTO treatment_codes (code, description, description_en, default_price, default_duration, commonly_used) VALUES
('VEST05', 'vHIT testing (Video Head Impulse Test)', 'vHIT testing all 6 canals', 1500.00, 30, true),
('VEST06', 'VEMP testing (Vestibular Evoked Myogenic Potential)', 'VEMP cVEMP + oVEMP', 1800.00, 45, false),
('VEST07', 'DVA test (Dynamic Visual Acuity)', 'DVA functional VOR assessment', 600.00, 15, true),
('VEST08', 'Rotational Chair Testing', 'Rotational chair vestibular assessment', 2000.00, 60, false),
('VEST09', 'Funksjonsnevrologisk behandling (Carrick-metode)', 'Functional neurology receptor-based treatment', 1200.00, 45, false)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON COLUMN vestibular_assessments.vhit_results IS 'vHIT results for all 6 semicircular canals - VOR gain and corrective saccades (HIMP/SHIMP protocols)';
COMMENT ON COLUMN vestibular_assessments.vemp_results IS 'VEMP results - cVEMP (saccule/inferior nerve) and oVEMP (utricle/superior nerve) for superior canal dehiscence and other diagnoses';
COMMENT ON COLUMN vestibular_assessments.dva_results IS 'Dynamic Visual Acuity - functional VOR assessment during head movement (>2 lines lost = abnormal)';
COMMENT ON COLUMN vestibular_assessments.test_sequence IS 'Order of tests performed - IMPORTANT: Supine Roll Test should be first to avoid order effect';
COMMENT ON COLUMN vestibular_assessments.receptor_based_treatments IS 'Carrick Institute receptor-based treatments: visual, auditory, proprioceptive, vestibular stimuli';
COMMENT ON COLUMN vestibular_assessments.vrt_protocol IS 'Evidence-based VRT protocol with specific dosing: gaze stabilization (3-5x/day, 20+ min), balance (20 min daily), habituation, adaptation';
COMMENT ON COLUMN vestibular_assessments.abc_score IS 'Activities-Specific Balance Confidence Scale (0-100, <67 = fall risk in elderly)';
COMMENT ON COLUMN vestibular_assessments.post_concussion_score IS 'Post-concussion symptom score for mTBI cases with vestibular involvement';
