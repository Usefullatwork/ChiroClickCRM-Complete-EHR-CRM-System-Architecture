-- ============================================================================
-- Migration 019: VNG/Vestibular Testing Module
-- ChiroClickCRM - Norwegian EHR/CRM System
-- Created: 2026-01-03
-- ============================================================================

-- VNG-specific test results
CREATE TABLE IF NOT EXISTS vng_test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    encounter_id UUID REFERENCES clinical_encounters(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    practitioner_id UUID REFERENCES users(id),

    -- Test date and device
    test_date TIMESTAMP DEFAULT NOW(),
    device_used VARCHAR(100), -- e.g., 'Interacoustics VNG', 'ICS Chartr'

    -- ============================================================================
    -- SPONTANEOUS NYSTAGMUS
    -- ============================================================================
    spontaneous_nystagmus_present BOOLEAN DEFAULT false,
    spontaneous_direction VARCHAR(50), -- 'right', 'left', 'vertical_up', 'vertical_down', 'pendular'
    spontaneous_spv DECIMAL(5,2), -- Slow phase velocity degrees/sec
    spontaneous_increases_frenzel BOOLEAN, -- Increases with Frenzel goggles (peripheral sign)
    spontaneous_decreases_fixation BOOLEAN, -- Decreases with fixation (peripheral sign)
    spontaneous_notes TEXT,

    -- ============================================================================
    -- GAZE TESTING (20-30° eccentricity)
    -- ============================================================================
    gaze_horizontal_right VARCHAR(50), -- 'normal', 'nystagmus', 'rebound'
    gaze_horizontal_left VARCHAR(50),
    gaze_vertical_up VARCHAR(50), -- 'normal', 'upbeat', 'downbeat'
    gaze_vertical_down VARCHAR(50),
    gaze_rebound_present BOOLEAN DEFAULT false,
    gaze_notes TEXT,

    -- ============================================================================
    -- SACCADES
    -- ============================================================================
    -- Horizontal saccades
    saccade_horizontal_latency_ms INTEGER, -- Normal <260ms
    saccade_horizontal_velocity_deg_s INTEGER, -- Normal 400-700°/s
    saccade_horizontal_accuracy VARCHAR(50), -- 'normal', 'hypometric', 'hypermetric'
    saccade_horizontal_gain DECIMAL(3,2), -- Normal 0.9-1.0

    -- Vertical saccades
    saccade_vertical_latency_ms INTEGER,
    saccade_vertical_velocity_deg_s INTEGER,
    saccade_vertical_accuracy VARCHAR(50),
    saccade_vertical_gain DECIMAL(3,2),

    saccade_overshoots BOOLEAN DEFAULT false,
    saccade_catch_up BOOLEAN DEFAULT false,
    saccade_notes TEXT,

    -- ============================================================================
    -- SMOOTH PURSUIT
    -- ============================================================================
    pursuit_horizontal_gain DECIMAL(3,2), -- Normal >0.9
    pursuit_horizontal_asymmetry DECIMAL(3,2),
    pursuit_vertical_gain DECIMAL(3,2),
    pursuit_catch_up_saccades BOOLEAN DEFAULT false,
    pursuit_saccadic BOOLEAN DEFAULT false, -- Cogwheel pursuit
    pursuit_notes TEXT,

    -- ============================================================================
    -- OPTOKINETIC NYSTAGMUS (OPK)
    -- ============================================================================
    opk_normal BOOLEAN DEFAULT true,
    opk_asymmetric BOOLEAN DEFAULT false,
    opk_right_gain DECIMAL(3,2),
    opk_left_gain DECIMAL(3,2),
    opk_provokes_symptoms BOOLEAN DEFAULT false,
    opk_notes TEXT,

    -- ============================================================================
    -- CALORIC TESTING
    -- ============================================================================
    caloric_performed BOOLEAN DEFAULT false,
    caloric_method VARCHAR(50), -- 'bithermal', 'monothermal', 'ice_water'

    -- Right ear responses
    caloric_right_warm_spv DECIMAL(5,2), -- degrees/sec
    caloric_right_cool_spv DECIMAL(5,2),

    -- Left ear responses
    caloric_left_warm_spv DECIMAL(5,2),
    caloric_left_cool_spv DECIMAL(5,2),

    -- Calculations
    caloric_unilateral_weakness DECIMAL(5,2), -- Percentage (>25% = significant)
    caloric_uw_side VARCHAR(10), -- Which side is weak
    caloric_directional_preponderance DECIMAL(5,2), -- >30% = significant
    caloric_dp_direction VARCHAR(10),
    caloric_bilateral_weakness BOOLEAN DEFAULT false,
    caloric_notes TEXT,

    -- ============================================================================
    -- POSITIONAL TESTING
    -- ============================================================================
    positional_tested BOOLEAN DEFAULT false,
    positional_supine VARCHAR(50),
    positional_head_right VARCHAR(50),
    positional_head_left VARCHAR(50),
    positional_head_hanging VARCHAR(50),
    positional_sitting VARCHAR(50),
    positional_notes TEXT,

    -- ============================================================================
    -- HEAD IMPULSE TEST (vHIT)
    -- ============================================================================
    hit_performed BOOLEAN DEFAULT false,
    hit_right_gain DECIMAL(3,2), -- Normal >0.8
    hit_left_gain DECIMAL(3,2),
    hit_right_corrective_saccade BOOLEAN DEFAULT false,
    hit_left_corrective_saccade BOOLEAN DEFAULT false,
    hit_covert_saccades BOOLEAN DEFAULT false,
    hit_overt_saccades BOOLEAN DEFAULT false,
    hit_notes TEXT,

    -- ============================================================================
    -- INTERPRETATION & DIAGNOSIS
    -- ============================================================================
    interpretation TEXT,
    primary_finding VARCHAR(100), -- e.g., 'left_peripheral_loss', 'central_lesion', 'bppv'
    hints_plus_result VARCHAR(50), -- 'peripheral', 'central', 'inconclusive'
    central_signs_present BOOLEAN DEFAULT false,
    central_signs_details TEXT[],

    -- Red flags
    red_flags_present BOOLEAN DEFAULT false,
    red_flags_details TEXT[],

    -- Recommendations
    recommendations TEXT,
    referral_needed BOOLEAN DEFAULT false,
    referral_type VARCHAR(100),

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- BPPV assessment and treatment tracking
CREATE TABLE IF NOT EXISTS bppv_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    encounter_id UUID REFERENCES clinical_encounters(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    practitioner_id UUID REFERENCES users(id),
    vng_result_id UUID REFERENCES vng_test_results(id), -- Link to VNG if performed

    assessment_date TIMESTAMP DEFAULT NOW(),

    -- ============================================================================
    -- DIX-HALLPIKE TEST
    -- ============================================================================
    -- Right side
    dix_hallpike_right_performed BOOLEAN DEFAULT true,
    dix_hallpike_right_result VARCHAR(50), -- 'negative', 'geotropic_torsional', 'ageotropic', 'vertical', 'horizontal'
    dix_hallpike_right_latency_sec INTEGER,
    dix_hallpike_right_duration_sec INTEGER,
    dix_hallpike_right_subjective_vertigo BOOLEAN,
    dix_hallpike_right_fatigable BOOLEAN, -- Decreases with repetition (peripheral sign)

    -- Left side
    dix_hallpike_left_performed BOOLEAN DEFAULT true,
    dix_hallpike_left_result VARCHAR(50),
    dix_hallpike_left_latency_sec INTEGER,
    dix_hallpike_left_duration_sec INTEGER,
    dix_hallpike_left_subjective_vertigo BOOLEAN,
    dix_hallpike_left_fatigable BOOLEAN,

    -- ============================================================================
    -- SUPINE ROLL TEST (Pagnini-McClure)
    -- ============================================================================
    supine_roll_right_performed BOOLEAN DEFAULT false,
    supine_roll_right_result VARCHAR(50), -- 'negative', 'geotropic', 'ageotropic'
    supine_roll_right_intensity VARCHAR(20), -- 'mild', 'moderate', 'strong'

    supine_roll_left_performed BOOLEAN DEFAULT false,
    supine_roll_left_result VARCHAR(50),
    supine_roll_left_intensity VARCHAR(20),

    supine_roll_stronger_side VARCHAR(10), -- For determining affected ear

    -- ============================================================================
    -- BOW AND LEAN TEST
    -- ============================================================================
    bow_lean_performed BOOLEAN DEFAULT false,
    bow_result VARCHAR(50), -- 'downbeat', 'upbeat', 'horizontal_right', 'horizontal_left', 'none'
    lean_result VARCHAR(50),

    -- ============================================================================
    -- DEEP HEAD HANGING (Yacovino test for anterior canal)
    -- ============================================================================
    deep_head_hanging_performed BOOLEAN DEFAULT false,
    deep_head_hanging_result VARCHAR(50), -- 'downbeat', 'torsional', 'none'
    deep_head_hanging_torsion_direction VARCHAR(20),

    -- ============================================================================
    -- DIAGNOSIS
    -- ============================================================================
    canal_affected VARCHAR(50), -- 'posterior', 'lateral', 'anterior', 'multiple'
    variant VARCHAR(50), -- 'canalithiasis', 'cupulolithiasis'
    side_affected VARCHAR(10), -- 'right', 'left', 'bilateral'
    confidence_level VARCHAR(20), -- 'definite', 'probable', 'possible'

    -- ============================================================================
    -- TREATMENT PERFORMED
    -- ============================================================================
    treatment_performed BOOLEAN DEFAULT false,
    treatment_maneuver VARCHAR(50), -- 'epley', 'semont', 'gufoni', 'bbq_roll', 'yacovino', 'liberatory', 'brandt_daroff'
    treatment_repetitions INTEGER DEFAULT 1,

    -- Post-treatment assessment
    post_treatment_dix_hallpike VARCHAR(50),
    post_treatment_nystagmus BOOLEAN,
    post_treatment_vertigo BOOLEAN,
    treatment_successful BOOLEAN,

    -- Follow-up
    follow_up_recommended BOOLEAN,
    follow_up_days INTEGER,
    home_exercises_prescribed BOOLEAN,
    home_exercises_details TEXT,

    notes TEXT,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Vestibular rehabilitation tracking
CREATE TABLE IF NOT EXISTS vestibular_rehab_protocols (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    encounter_id UUID REFERENCES clinical_encounters(id),
    practitioner_id UUID REFERENCES users(id),

    protocol_start_date DATE NOT NULL,
    protocol_end_date DATE,
    protocol_status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'discontinued'

    -- Diagnosis driving rehab
    primary_diagnosis VARCHAR(100),
    secondary_diagnoses TEXT[],

    -- Prescribed exercises
    exercises_prescribed JSONB, -- Array of {name, description, frequency, duration, progression}

    -- Outcome measures
    baseline_dhi_score INTEGER, -- Dizziness Handicap Inventory (0-100)
    current_dhi_score INTEGER,
    baseline_abc_score INTEGER, -- Activities Balance Confidence (0-100%)
    current_abc_score INTEGER,
    baseline_vas_dizziness INTEGER, -- 0-10
    current_vas_dizziness INTEGER,

    -- Progress notes
    progress_notes JSONB, -- Array of {date, note, outcome_measures}

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_vng_results_patient ON vng_test_results(patient_id);
CREATE INDEX IF NOT EXISTS idx_vng_results_encounter ON vng_test_results(encounter_id);
CREATE INDEX IF NOT EXISTS idx_vng_results_date ON vng_test_results(test_date);
CREATE INDEX IF NOT EXISTS idx_vng_results_hints ON vng_test_results(hints_plus_result);

CREATE INDEX IF NOT EXISTS idx_bppv_patient ON bppv_assessments(patient_id);
CREATE INDEX IF NOT EXISTS idx_bppv_encounter ON bppv_assessments(encounter_id);
CREATE INDEX IF NOT EXISTS idx_bppv_canal ON bppv_assessments(canal_affected);

CREATE INDEX IF NOT EXISTS idx_vestibular_rehab_patient ON vestibular_rehab_protocols(patient_id);
CREATE INDEX IF NOT EXISTS idx_vestibular_rehab_status ON vestibular_rehab_protocols(protocol_status);

-- Triggers
CREATE TRIGGER update_vng_test_results_updated_at
    BEFORE UPDATE ON vng_test_results
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bppv_assessments_updated_at
    BEFORE UPDATE ON bppv_assessments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vestibular_rehab_protocols_updated_at
    BEFORE UPDATE ON vestibular_rehab_protocols
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE vng_test_results IS 'VNG/VOG test results including oculomotor, positional, and caloric testing';
COMMENT ON TABLE bppv_assessments IS 'BPPV diagnostic testing and treatment tracking with canal differentiation';
COMMENT ON TABLE vestibular_rehab_protocols IS 'Vestibular rehabilitation protocol tracking with outcome measures';
COMMENT ON COLUMN vng_test_results.hints_plus_result IS 'HINTS+ protocol result: peripheral = safe, central = urgent referral';
COMMENT ON COLUMN bppv_assessments.variant IS 'canalithiasis = free-floating otoconia, cupulolithiasis = attached to cupula';

-- ============================================================================
-- SEED DATA: Common vestibular diagnoses for dropdown
-- ============================================================================

-- Add vestibular-specific ICPC-2 codes if not exists
INSERT INTO diagnosis_codes (code, system, chapter, description_no, description_en, commonly_used)
SELECT 'H82', 'ICPC2', 'H', 'Svimmelhetssyndromer', 'Vertiginous syndromes', true
WHERE NOT EXISTS (SELECT 1 FROM diagnosis_codes WHERE code = 'H82');

INSERT INTO diagnosis_codes (code, system, chapter, description_no, description_en, commonly_used)
SELECT 'N17', 'ICPC2', 'N', 'Vertigo/svimmelhet', 'Vertigo/dizziness', true
WHERE NOT EXISTS (SELECT 1 FROM diagnosis_codes WHERE code = 'N17');

-- Add ICD-10 codes for vestibular conditions
INSERT INTO diagnosis_codes (code, system, chapter, description_no, description_en, icpc2_mapping, commonly_used) VALUES
('H81.1', 'ICD10', 'H', 'Benign paroksysmal posisjonsvertigo', 'Benign paroxysmal positional vertigo', 'H82', true),
('H81.0', 'ICD10', 'H', 'Ménières sykdom', 'Ménière''s disease', 'H82', true),
('H81.2', 'ICD10', 'H', 'Vestibulær nevronitt', 'Vestibular neuronitis', 'H82', true),
('H81.3', 'ICD10', 'H', 'Annen perifer vertigo', 'Other peripheral vertigo', 'H82', true),
('H81.4', 'ICD10', 'H', 'Sentral opprinnelse vertigo', 'Vertigo of central origin', 'H82', false),
('R42', 'ICD10', 'R', 'Svimmelhet', 'Dizziness and giddiness', 'N17', true)
ON CONFLICT (code) DO NOTHING;

-- Grant permissions
-- GRANT ALL PRIVILEGES ON TABLE vng_test_results TO chiroclickcrm_app;
-- GRANT ALL PRIVILEGES ON TABLE bppv_assessments TO chiroclickcrm_app;
-- GRANT ALL PRIVILEGES ON TABLE vestibular_rehab_protocols TO chiroclickcrm_app;

COMMENT ON SCHEMA public IS 'ChiroClickCRM v4.2 - Added VNG/Vestibular Testing Module';
