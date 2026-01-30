-- ============================================================================
-- Migration 018: Examination Clusters for Evidence-Based Diagnosis
-- ChiroClickCRM - Norwegian EHR/CRM System
-- Created: 2026-01-03
-- ============================================================================

-- Clinical test clusters for evidence-based diagnosis
CREATE TABLE IF NOT EXISTS examination_clusters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name_no VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    description_no TEXT,
    description_en TEXT,
    body_system VARCHAR(50), -- 'cerebellar', 'vestibular', 'cervical', 'tmj', 'myelopathy', 'instability'
    threshold_score INTEGER NOT NULL, -- Min score for positive cluster
    max_score INTEGER NOT NULL,
    severity VARCHAR(20) CHECK (severity IN ('CRITICAL', 'HIGH', 'MODERATE', 'LOW')),
    action_if_positive_no TEXT, -- Norwegian: What to do when positive
    action_if_positive_en TEXT, -- English: What to do when positive
    referral_required BOOLEAN DEFAULT false,
    referral_type VARCHAR(100), -- 'neurologist', 'ENT', 'orthopedic', 'emergency'
    contraindicated_treatments TEXT[], -- Treatments to avoid if positive
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Individual tests within clusters
CREATE TABLE IF NOT EXISTS cluster_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cluster_id UUID REFERENCES examination_clusters(id) ON DELETE CASCADE,
    test_code VARCHAR(50) NOT NULL,
    test_name_no VARCHAR(255) NOT NULL,
    test_name_en VARCHAR(255),
    criteria_no TEXT[], -- Array of positive criteria in Norwegian
    criteria_en TEXT[], -- Array of positive criteria in English
    interpretation_no TEXT,
    interpretation_en TEXT,
    sort_order INTEGER DEFAULT 0,
    weight INTEGER DEFAULT 1, -- Weight in cluster scoring (default 1 point per test)
    is_critical BOOLEAN DEFAULT false, -- If true, single positive may warrant immediate action
    created_at TIMESTAMP DEFAULT NOW()
);

-- Patient cluster test results
CREATE TABLE IF NOT EXISTS cluster_test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    encounter_id UUID REFERENCES clinical_encounters(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    cluster_id UUID REFERENCES examination_clusters(id),
    practitioner_id UUID REFERENCES users(id),

    -- Test results
    tests_performed JSONB NOT NULL, -- {test_code: {result: 'positive'/'negative', criteria_met: ['criterion1'], notes: ''}}
    score INTEGER NOT NULL,
    max_possible_score INTEGER NOT NULL,
    is_positive BOOLEAN NOT NULL,

    -- Clinical notes
    notes TEXT,
    differential_diagnoses TEXT[],
    recommended_action TEXT,
    referral_made BOOLEAN DEFAULT false,
    referral_details TEXT,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Link clinical tests to clusters (many-to-many)
CREATE TABLE IF NOT EXISTS clinical_test_cluster_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinical_test_id UUID, -- References clinical_tests_library if exists
    cluster_id UUID REFERENCES examination_clusters(id) ON DELETE CASCADE,
    test_code VARCHAR(50) NOT NULL, -- Fallback if no clinical_tests_library reference
    weight INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(cluster_id, test_code)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cluster_tests_cluster_id ON cluster_tests(cluster_id);
CREATE INDEX IF NOT EXISTS idx_cluster_results_encounter_id ON cluster_test_results(encounter_id);
CREATE INDEX IF NOT EXISTS idx_cluster_results_patient_id ON cluster_test_results(patient_id);
CREATE INDEX IF NOT EXISTS idx_cluster_results_cluster_id ON cluster_test_results(cluster_id);
CREATE INDEX IF NOT EXISTS idx_cluster_results_is_positive ON cluster_test_results(is_positive) WHERE is_positive = true;

-- Trigger for updated_at
CREATE TRIGGER update_examination_clusters_updated_at
    BEFORE UPDATE ON examination_clusters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cluster_test_results_updated_at
    BEFORE UPDATE ON cluster_test_results
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE examination_clusters IS 'Diagnostic clusters for evidence-based testing (increases LR+ from 2-3 to 5-10)';
COMMENT ON TABLE cluster_tests IS 'Individual tests that make up each diagnostic cluster';
COMMENT ON TABLE cluster_test_results IS 'Patient results for cluster-based testing';
COMMENT ON COLUMN examination_clusters.threshold_score IS 'Minimum score needed for positive cluster diagnosis';
COMMENT ON COLUMN examination_clusters.severity IS 'CRITICAL = immediate referral, HIGH = refer within days, MODERATE = monitor';

-- ============================================================================
-- SEED DATA: 7 Diagnostic Clusters
-- ============================================================================

INSERT INTO examination_clusters (code, name_no, name_en, description_no, description_en, body_system,
    threshold_score, max_score, severity, action_if_positive_no, action_if_positive_en,
    referral_required, referral_type, contraindicated_treatments, sort_order) VALUES

-- CLUSTER 1: CEREBELLAR DYSFUNCTION
('cerebellar_dysfunction',
 'Cerebellær dysfunksjon',
 'Cerebellar Dysfunction',
 'Kluster for å identifisere cerebellær patologi. ≥4/8 positive = Høy sannsynlighet.',
 'Cluster to identify cerebellar pathology. ≥4/8 positive = High probability.',
 'cerebellar',
 4, 8, 'HIGH',
 'Henvis til nevrolog. MR caput med/uten kontrast. Vurder cerebrovaskulær risiko. Ekskluder alkohol/medikament toksisitet.',
 'Refer to neurologist. MRI head with/without contrast. Assess cerebrovascular risk. Exclude alcohol/medication toxicity.',
 true, 'neurologist',
 ARRAY['high velocity adjustments to cervical spine'],
 1),

-- CLUSTER 2: PERIPHERAL VESTIBULAR LOSS
('peripheral_vestibular_loss',
 'Perifert vestibulært tap',
 'Peripheral Vestibular Loss',
 'Kluster for unilateralt perifert vestibulært tap. ≥3/5 positive = Høy sannsynlighet. Inkluderer HINTS+ protokoll.',
 'Cluster for unilateral peripheral vestibular loss. ≥3/5 positive = High probability. Includes HINTS+ protocol.',
 'vestibular',
 3, 6, 'HIGH',
 'Bekreft med HINTS+ protokoll for å ekskludere sentral lesjon. Ved HINTS+ positiv for SENTRAL → Akutt henvisning nevrolog/ØNH.',
 'Confirm with HINTS+ protocol to exclude central lesion. If HINTS+ positive for CENTRAL → Urgent referral neurologist/ENT.',
 true, 'ENT',
 NULL,
 2),

-- CLUSTER 3: CERVICOGENIC DIZZINESS
('cervicogenic_dizziness',
 'Cervikogen svimmelhet',
 'Cervicogenic Dizziness',
 'Kluster for cervikogen svimmelhet. ≥4/7 positive = Sannsynlig diagnose. OBS: Alltid ekskluder vestibulær og cerebellær patologi først.',
 'Cluster for cervicogenic dizziness. ≥4/7 positive = Probable diagnosis. NOTE: Always exclude vestibular and cerebellar pathology first.',
 'cervical',
 4, 7, 'MODERATE',
 'Diagnose: Cervikogen svimmelhet. Behandling: Mobilisering C1-C2, proprioseptiv rehabilitering. Unngå aggressive HVLA ved VBI mistanke.',
 'Diagnosis: Cervicogenic dizziness. Treatment: C1-C2 mobilization, proprioceptive rehabilitation. Avoid aggressive HVLA if VBI suspected.',
 false, NULL,
 ARRAY['HVLA cervical if VBI suspected'],
 3),

-- CLUSTER 4: TMJ DYSFUNCTION
('tmj_dysfunction',
 'TMJ dysfunksjon',
 'TMJ Dysfunction',
 'Kluster for TMJ dysfunksjon med craniocervical involvering. ≥3/7 positive. Subklassifiser: Myofascial/Disc/Artrose.',
 'Cluster for TMJ dysfunction with craniocervical involvement. ≥3/7 positive. Subclassify: Myofascial/Disc/Arthrosis.',
 'tmj',
 3, 7, 'MODERATE',
 'Subklassifiser type: Myofascial (triggerpunkt-behandling), Disc displacement (mobilisering), Artrose (antiinflammatorisk, splint).',
 'Subclassify type: Myofascial (trigger point treatment), Disc displacement (mobilization), Arthrosis (anti-inflammatory, splint).',
 false, NULL,
 NULL,
 4),

-- CLUSTER 5: UPPER CERVICAL INSTABILITY
('upper_cervical_instability',
 'Upper cervical instabilitet',
 'Upper Cervical Instability',
 'KRITISK: Kluster for C1-C2 instabilitet. ≥4/7 positive = Høy mistanke. INGEN HVLA før bildebekreftelse!',
 'CRITICAL: Cluster for C1-C2 instability. ≥4/7 positive = High suspicion. NO HVLA before imaging confirmation!',
 'instability',
 4, 7, 'CRITICAL',
 'Henvis til MR cervical med fleksjon-ekstensjon. INGEN HVLA manipulasjon. Røntgen: ADI (atlanto-dens interval) >3mm voksen = patologisk. Røde flagg: RA, Down, EDS, Trauma.',
 'Refer for cervical MRI with flexion-extension. NO HVLA manipulation. X-ray: ADI (atlanto-dens interval) >3mm adult = pathological. Red flags: RA, Down syndrome, EDS, Trauma.',
 true, 'orthopedic',
 ARRAY['HVLA cervical', 'cervical manipulation', 'aggressive mobilization'],
 5),

-- CLUSTER 6: MYELOPATHY
('myelopathy',
 'Myelopati',
 'Myelopathy',
 'KRITISK: Kluster for cervical ryggmargskompresjon. ≥3/6 positive = Høy mistanke. STOPP kiropraktisk behandling!',
 'CRITICAL: Cluster for cervical spinal cord compression. ≥3/6 positive = High suspicion. STOP chiropractic treatment!',
 'myelopathy',
 3, 6, 'CRITICAL',
 'STOPP kiropraktisk behandling. Akutt henvisning nevrolog/nevrokirurg. MR cervical med høy prioritet. Vurder cervical stenose, disc herniation, tumor, infeksjon.',
 'STOP chiropractic treatment. Urgent referral neurologist/neurosurgeon. Cervical MRI with high priority. Consider cervical stenosis, disc herniation, tumor, infection.',
 true, 'emergency',
 ARRAY['ANY cervical manipulation', 'ANY spinal manipulation', 'traction'],
 6),

-- CLUSTER 7: BPPV (Benign Paroxysmal Positional Vertigo)
('bppv',
 'BPPV (Benign Paroxysmal Positional Vertigo)',
 'BPPV (Benign Paroxysmal Positional Vertigo)',
 'Differensiering av BPPV kanaler: Posterior (80-90%), Lateral (geotropisk/ageotropisk), Anterior (<5%).',
 'BPPV canal differentiation: Posterior (80-90%), Lateral (geotropic/ageotropic), Anterior (<5%).',
 'vestibular',
 2, 6, 'LOW',
 'Identifiser affisert kanal og variant. Posterior: Epley/Semont. Lateral geotropisk: Gufoni/BBQ roll. Lateral ageotropisk: Modifisert Gufoni. Anterior: Yacovino.',
 'Identify affected canal and variant. Posterior: Epley/Semont. Lateral geotropic: Gufoni/BBQ roll. Lateral ageotropic: Modified Gufoni. Anterior: Yacovino.',
 false, NULL,
 NULL,
 7);

-- ============================================================================
-- SEED DATA: Cluster Tests (48 tests across 7 clusters)
-- ============================================================================

-- CEREBELLAR CLUSTER TESTS (8 tests)
INSERT INTO cluster_tests (cluster_id, test_code, test_name_no, test_name_en, criteria_no, criteria_en, interpretation_no, interpretation_en, sort_order, weight) VALUES
((SELECT id FROM examination_clusters WHERE code = 'cerebellar_dysfunction'),
 'saccade_overshoots', 'Sakkade overshoots (VNG)', 'Saccade Overshoots (VNG)',
 ARRAY['Bilateral horisontal overshoot >10% av target amplitude', 'Vertikal overshoot >10%', 'Konsistent på gjentatte forsøk'],
 ARRAY['Bilateral horizontal overshoot >10% of target amplitude', 'Vertical overshoot >10%', 'Consistent on repeated attempts'],
 'Fastigial nucleus/OMV dysfunksjon', 'Fastigial nucleus/OMV dysfunction', 1, 1),

((SELECT id FROM examination_clusters WHERE code = 'cerebellar_dysfunction'),
 'pursuit_catchup', 'Pursuit catch-up sakkader', 'Pursuit Catch-up Saccades',
 ARRAY['Pursuit gain <0.7 horisontalt', 'Pursuit gain <0.7 vertikalt', '>5 catch-up sakkader per 30 sek'],
 ARRAY['Pursuit gain <0.7 horizontal', 'Pursuit gain <0.7 vertical', '>5 catch-up saccades per 30 sec'],
 'Flocculus/paraflocculus dysfunksjon', 'Flocculus/paraflocculus dysfunction', 2, 1),

((SELECT id FROM examination_clusters WHERE code = 'cerebellar_dysfunction'),
 'gaze_evoked_nystagmus', 'Gaze-evoked nystagmus', 'Gaze-Evoked Nystagmus',
 ARRAY['Horisontal gaze-evoked nystagmus ved 20° eksentrisitet', 'Vertikal gaze-evoked nystagmus', 'Rebound nystagmus ved retur til senter'],
 ARRAY['Horizontal gaze-evoked nystagmus at 20° eccentricity', 'Vertical gaze-evoked nystagmus', 'Rebound nystagmus on return to center'],
 'Neural integrator (flocculus) dysfunksjon', 'Neural integrator (flocculus) dysfunction', 3, 1),

((SELECT id FROM examination_clusters WHERE code = 'cerebellar_dysfunction'),
 'fnf_dysmetria', 'Finger-nese-finger dysmetri', 'Finger-Nose-Finger Dysmetria',
 ARRAY['Intention tremor bilateral', 'Overshooting >2cm bilateral', 'Dekomponert bevegelse'],
 ARRAY['Intention tremor bilateral', 'Overshooting >2cm bilateral', 'Decomposed movement'],
 'Cerebellær hemisphære dysfunksjon', 'Cerebellar hemisphere dysfunction', 4, 1),

((SELECT id FROM examination_clusters WHERE code = 'cerebellar_dysfunction'),
 'dysdiadochokinesia', 'Dysdiadokokinesi', 'Dysdiadochokinesia',
 ARRAY['Bilateral redusert hastighet (<10 bevegelser/5 sek)', 'Irregulær rytme', 'Arytmiske bevegelser'],
 ARRAY['Bilateral reduced speed (<10 movements/5 sec)', 'Irregular rhythm', 'Arrhythmic movements'],
 'Cerebellær hemisphære dysfunksjon', 'Cerebellar hemisphere dysfunction', 5, 1),

((SELECT id FROM examination_clusters WHERE code = 'cerebellar_dysfunction'),
 'tandem_gait', 'Tandem gange', 'Tandem Gait',
 ARRAY['Lateral svaing >10cm fra midtlinje', 'Korrigerende sidesteg >3 steg/10 meter', 'Ikke i stand til å utføre'],
 ARRAY['Lateral sway >10cm from midline', 'Corrective side steps >3 steps/10 meters', 'Unable to perform'],
 'Vermis/flocculonodular dysfunksjon', 'Vermis/flocculonodular dysfunction', 6, 1),

((SELECT id FROM examination_clusters WHERE code = 'cerebellar_dysfunction'),
 'romberg_modified', 'Romberg (modifisert)', 'Romberg (Modified)',
 ARRAY['Ustabilitet selv med åpne øyne', 'Fall tendens uten preferanse retning', 'Truncal ataksi sittende'],
 ARRAY['Instability even with eyes open', 'Fall tendency without directional preference', 'Truncal ataxia sitting'],
 'Midline cerebellum (vermis)', 'Midline cerebellum (vermis)', 7, 1),

((SELECT id FROM examination_clusters WHERE code = 'cerebellar_dysfunction'),
 'heel_knee_shin', 'Hel-kne-legg test', 'Heel-Knee-Shin Test',
 ARRAY['Ataksi bilateral', 'Tremor under bevegelse', 'Kan ikke følge rett linje langs tibia'],
 ARRAY['Bilateral ataxia', 'Tremor during movement', 'Cannot follow straight line along tibia'],
 'Cerebellær hemisphære dysfunksjon', 'Cerebellar hemisphere dysfunction', 8, 1);

-- VESTIBULAR CLUSTER TESTS (6 tests)
INSERT INTO cluster_tests (cluster_id, test_code, test_name_no, test_name_en, criteria_no, criteria_en, interpretation_no, interpretation_en, sort_order, weight, is_critical) VALUES
((SELECT id FROM examination_clusters WHERE code = 'peripheral_vestibular_loss'),
 'spontaneous_nystagmus_vestibular', 'Spontan nystagmus', 'Spontaneous Nystagmus',
 ARRAY['Horisontal-torsjonell nystagmus mot frisk side', 'Slow phase velocity >6°/s', 'Øker i intensitet med Frenzel briller', 'Reduseres med fiksering'],
 ARRAY['Horizontal-torsional nystagmus toward healthy side', 'Slow phase velocity >6°/s', 'Increases in intensity with Frenzel goggles', 'Decreases with fixation'],
 'Akutt perifert vestibulært tap (samme side som slow phase)', 'Acute peripheral vestibular loss (same side as slow phase)', 1, 1, false),

((SELECT id FROM examination_clusters WHERE code = 'peripheral_vestibular_loss'),
 'head_impulse_test', 'Head Impulse Test (Halmagyi)', 'Head Impulse Test (Halmagyi)',
 ARRAY['Positiv høyre (corrective saccade)', 'Positiv venstre (corrective saccade)', 'Bilateral positiv'],
 ARRAY['Positive right (corrective saccade)', 'Positive left (corrective saccade)', 'Bilateral positive'],
 'Positiv = ipsilateral superior canal dysfunction', 'Positive = ipsilateral superior canal dysfunction', 2, 1, false),

((SELECT id FROM examination_clusters WHERE code = 'peripheral_vestibular_loss'),
 'caloric_test', 'Caloric test (VNG)', 'Caloric Test (VNG)',
 ARRAY['Unilateral weakness >25%', 'Directional preponderance >30%', 'Bilateral weakness'],
 ARRAY['Unilateral weakness >25%', 'Directional preponderance >30%', 'Bilateral weakness'],
 'Unilateral weakness = perifert tap samme side', 'Unilateral weakness = peripheral loss same side', 3, 1, false),

((SELECT id FROM examination_clusters WHERE code = 'peripheral_vestibular_loss'),
 'test_of_skew', 'Test of Skew', 'Test of Skew',
 ARRAY['Vertikal diplopi', 'Cover-uncover test positiv', 'Subjektiv visual vertical >2° avvik'],
 ARRAY['Vertical diplopia', 'Cover-uncover test positive', 'Subjective visual vertical >2° deviation'],
 'Positiv = SENTRAL lesjon (ikke perifert)', 'Positive = CENTRAL lesion (not peripheral)', 4, 1, true),

((SELECT id FROM examination_clusters WHERE code = 'peripheral_vestibular_loss'),
 'gait_test_head_movements', 'Gangtest med hodebevegelser', 'Gait Test with Head Movements',
 ARRAY['Avvergegange mot affisert side', 'Romberg fall mot affisert side', 'Kan ikke gå med hoderotasjon'],
 ARRAY['Veering gait toward affected side', 'Romberg fall toward affected side', 'Cannot walk with head rotation'],
 'Perifert vestibulært tap', 'Peripheral vestibular loss', 5, 1, false),

((SELECT id FROM examination_clusters WHERE code = 'peripheral_vestibular_loss'),
 'dynamic_visual_acuity', 'Dynamic Visual Acuity', 'Dynamic Visual Acuity',
 ARRAY['>3 linjer tap på Snellen chart ved hoderotasjon', 'Bilateral tap'],
 ARRAY['>3 lines loss on Snellen chart with head rotation', 'Bilateral loss'],
 'Bilateral vestibulær tap (BVL)', 'Bilateral vestibular loss (BVL)', 6, 1, false);

-- CERVICOGENIC DIZZINESS CLUSTER TESTS (7 tests)
INSERT INTO cluster_tests (cluster_id, test_code, test_name_no, test_name_en, criteria_no, criteria_en, interpretation_no, interpretation_en, sort_order, weight) VALUES
((SELECT id FROM examination_clusters WHERE code = 'cervicogenic_dizziness'),
 'cervical_rom_dizziness', 'Cervical ROM', 'Cervical ROM',
 ARRAY['Begrenset rotasjon <60° bilateral', 'Begrenset fleksjon <50°', 'Provoserer svimmelhet/disequilibrium', 'Ikke rotatorisk vertigo'],
 ARRAY['Limited rotation <60° bilateral', 'Limited flexion <50°', 'Provokes dizziness/disequilibrium', 'Not rotatory vertigo'],
 'Redusert proprioseptiv input fra C1-C3', 'Reduced proprioceptive input from C1-C3', 1, 1),

((SELECT id FROM examination_clusters WHERE code = 'cervicogenic_dizziness'),
 'smooth_pursuit_neck_torsion', 'Smooth Pursuit Neck Torsion Test', 'Smooth Pursuit Neck Torsion Test',
 ARRAY['Redusert pursuit gain med nakke rotert 45° høyre', 'Redusert pursuit gain med nakke rotert 45° venstre', 'Normal pursuit i nøytral posisjon', 'Gain forskjell >0.1 mellom rotert og nøytral'],
 ARRAY['Reduced pursuit gain with neck rotated 45° right', 'Reduced pursuit gain with neck rotated 45° left', 'Normal pursuit in neutral position', 'Gain difference >0.1 between rotated and neutral'],
 'Cervical proprioseptiv dysfunksjon', 'Cervical proprioceptive dysfunction', 2, 1),

((SELECT id FROM examination_clusters WHERE code = 'cervicogenic_dizziness'),
 'cervical_flexion_rotation', 'Cervical Flexion-Rotation Test (C1-C2)', 'Cervical Flexion-Rotation Test (C1-C2)',
 ARRAY['Begrenset rotasjon <32° høyre', 'Begrenset rotasjon <32° venstre', 'Asymmetri >10° mellom sider'],
 ARRAY['Limited rotation <32° right', 'Limited rotation <32° left', 'Asymmetry >10° between sides'],
 'Upper cervical dysfunksjon (C1-C2)', 'Upper cervical dysfunction (C1-C2)', 3, 1),

((SELECT id FROM examination_clusters WHERE code = 'cervicogenic_dizziness'),
 'vertebral_artery_testing', 'Vertebral Artery Testing', 'Vertebral Artery Testing',
 ARRAY['De Kleyn test: Svimmelhet/nystagmus', 'Maigne test: Svimmelhet ved ekstensjon-rotasjon', 'Hautant test: Arm pronerer/drifter', 'Underberg test: Ustabilitet ved marsjering'],
 ARRAY['De Kleyn test: Dizziness/nystagmus', 'Maigne test: Dizziness with extension-rotation', 'Hautant test: Arm pronates/drifts', 'Underberg test: Instability during marching'],
 'Vertebrobasilar insuffisiens (VBI) - ADVARSEL', 'Vertebrobasilar insufficiency (VBI) - WARNING', 4, 1),

((SELECT id FROM examination_clusters WHERE code = 'cervicogenic_dizziness'),
 'cervical_jpe', 'Cervical Joint Position Error (JPE)', 'Cervical Joint Position Error (JPE)',
 ARRAY['>4.5° feil ved relokalisering etter rotasjon', 'Bilateral JPE forhøyet'],
 ARRAY['>4.5° error on relocation after rotation', 'Bilateral JPE elevated'],
 'Proprioseptiv dysfunksjon', 'Proprioceptive dysfunction', 5, 1),

((SELECT id FROM examination_clusters WHERE code = 'cervicogenic_dizziness'),
 'palpation_c1_c3', 'Palpasjon C1-C3', 'Palpation C1-C3',
 ARRAY['C1-C2: Palpasjonsøm/restriksjon', 'C2-C3: Palpasjonsøm/restriksjon', 'Suboksipital muskulatur hypertoni', 'Triggerpunkter SCM/scalene'],
 ARRAY['C1-C2: Tender/restricted', 'C2-C3: Tender/restricted', 'Suboccipital muscle hypertonia', 'Trigger points SCM/scalene'],
 'Cervical dysfunksjon', 'Cervical dysfunction', 6, 1),

((SELECT id FROM examination_clusters WHERE code = 'cervicogenic_dizziness'),
 'provocation_test_cervicogenic', 'Provokasjonstest', 'Provocation Test',
 ARRAY['Svimmelhet reproduseres med sustained posisjon', 'Svimmelhet ved isometrisk cervical motstand', 'Ingen svimmelhet ved Dix-Hallpike (ekskluderer BPPV)'],
 ARRAY['Dizziness reproduced with sustained position', 'Dizziness with isometric cervical resistance', 'No dizziness with Dix-Hallpike (excludes BPPV)'],
 'Cervikogen årsak', 'Cervicogenic cause', 7, 1);

-- MYELOPATHY CLUSTER TESTS (6 tests)
INSERT INTO cluster_tests (cluster_id, test_code, test_name_no, test_name_en, criteria_no, criteria_en, interpretation_no, interpretation_en, sort_order, weight, is_critical) VALUES
((SELECT id FROM examination_clusters WHERE code = 'myelopathy'),
 'hoffmann_sign', 'Hoffmann''s Sign', 'Hoffmann''s Sign',
 ARRAY['Positiv høyre (fleksjon av tommel/pekefinger ved flicking langfinger)', 'Positiv venstre', 'Bilateral positiv'],
 ARRAY['Positive right (flexion of thumb/index finger with flicking middle finger)', 'Positive left', 'Bilateral positive'],
 'Kortikal disinhibisjon, øvre motorneuron lesjon', 'Cortical disinhibition, upper motor neuron lesion', 1, 1, true),

((SELECT id FROM examination_clusters WHERE code = 'myelopathy'),
 'hyperreflexia', 'Hyperrefleksi', 'Hyperreflexia',
 ARRAY['Biceps reflex 3+ eller mer bilateral', 'Triceps reflex 3+ eller mer', 'Patella reflex 3+ eller mer', 'Achilles reflex 3+ eller mer', 'Klonus present (≥5 slag)'],
 ARRAY['Biceps reflex 3+ or more bilateral', 'Triceps reflex 3+ or more', 'Patellar reflex 3+ or more', 'Achilles reflex 3+ or more', 'Clonus present (≥5 beats)'],
 'Øvre motorneuron lesjon', 'Upper motor neuron lesion', 2, 1, true),

((SELECT id FROM examination_clusters WHERE code = 'myelopathy'),
 'babinski_sign', 'Babinski Sign', 'Babinski Sign',
 ARRAY['Ekstensor plantarrefleks høyre (stortå opp)', 'Ekstensor plantarrefleks venstre'],
 ARRAY['Extensor plantar reflex right (big toe up)', 'Extensor plantar reflex left'],
 'Patologisk, øvre motorneuron', 'Pathological, upper motor neuron', 3, 1, true),

((SELECT id FROM examination_clusters WHERE code = 'myelopathy'),
 'lhermitte_sign_myelopathy', 'Lhermitte''s Sign', 'Lhermitte''s Sign',
 ARRAY['Elektrisk følelse ned ryggen ved nakke fleksjon', 'Følelse til ekstremiteter'],
 ARRAY['Electric sensation down spine with neck flexion', 'Sensation to extremities'],
 'Ryggmargskompresjon eller demyelinisering', 'Spinal cord compression or demyelination', 4, 1, true),

((SELECT id FROM examination_clusters WHERE code = 'myelopathy'),
 'gait_coordination_myelopathy', 'Gange og koordinasjon', 'Gait and Coordination',
 ARRAY['Ataktisk gange (bred base)', 'Spastisk gange (circumduction)', 'Fotsmell (ikke i stand til heel strike)', 'Kan ikke gå tandem', 'Tap av balanse'],
 ARRAY['Ataxic gait (wide base)', 'Spastic gait (circumduction)', 'Foot slap (unable to heel strike)', 'Cannot walk tandem', 'Loss of balance'],
 'Myelopatisk gange', 'Myelopathic gait', 5, 1, false),

((SELECT id FROM examination_clusters WHERE code = 'myelopathy'),
 'hand_function_test', 'Hånd funksjontest', 'Hand Function Test',
 ARRAY['Kan ikke kneppe knapper', '10-second grip-and-release test: <20 repetisjoner', 'Drop ting fra hender', 'Svakhet intrinsic håndmuskler bilateral'],
 ARRAY['Cannot button buttons', '10-second grip-and-release test: <20 repetitions', 'Drop things from hands', 'Weakness intrinsic hand muscles bilateral'],
 'Myelopati med upper extremity involvement', 'Myelopathy with upper extremity involvement', 6, 1, false);

-- UPPER CERVICAL INSTABILITY CLUSTER TESTS (7 tests)
INSERT INTO cluster_tests (cluster_id, test_code, test_name_no, test_name_en, criteria_no, criteria_en, interpretation_no, interpretation_en, sort_order, weight, is_critical) VALUES
((SELECT id FROM examination_clusters WHERE code = 'upper_cervical_instability'),
 'sharp_purser', 'Sharp-Purser Test', 'Sharp-Purser Test',
 ARRAY['Positiv: Clunk, symptomreduksjon ved anterior glide C1', 'Subjektiv følelse av hodet faller frem'],
 ARRAY['Positive: Clunk, symptom reduction with anterior glide C1', 'Subjective feeling of head falling forward'],
 'Atlantoaxial instabilitet', 'Atlantoaxial instability', 1, 1, true),

((SELECT id FROM examination_clusters WHERE code = 'upper_cervical_instability'),
 'alar_ligament_stress', 'Alar Ligament Stress Test', 'Alar Ligament Stress Test',
 ARRAY['Høyre: Økt bevegelse (>45°), ingen motstand', 'Venstre: Økt bevegelse, ingen motstand', 'Bilateral laksitet'],
 ARRAY['Right: Increased movement (>45°), no resistance', 'Left: Increased movement, no resistance', 'Bilateral laxity'],
 'Alar ligament insuffisiens', 'Alar ligament insufficiency', 2, 1, true),

((SELECT id FROM examination_clusters WHERE code = 'upper_cervical_instability'),
 'transverse_ligament', 'Transverse Ligament Test', 'Transverse Ligament Test',
 ARRAY['Pasient rapporterer hodet føles ustabilt', 'Neurologiske symptomer ved anterior shear', 'Provoserer svimmelhet/nystagmus'],
 ARRAY['Patient reports head feels unstable', 'Neurological symptoms with anterior shear', 'Provokes dizziness/nystagmus'],
 'Transvers ligament insuffisiens', 'Transverse ligament insufficiency', 3, 1, true),

((SELECT id FROM examination_clusters WHERE code = 'upper_cervical_instability'),
 'membrana_tectoria', 'Membrana Tectoria Test', 'Membrana Tectoria Test',
 ARRAY['Positiv ved cervikal fleksjon + aksial belastning', 'Neurologiske symptomer'],
 ARRAY['Positive with cervical flexion + axial loading', 'Neurological symptoms'],
 'Membrana tectoria insuffisiens', 'Membrana tectoria insufficiency', 4, 1, true),

((SELECT id FROM examination_clusters WHERE code = 'upper_cervical_instability'),
 'cfrt_instability', 'Cervical Flexion-Rotation Test', 'Cervical Flexion-Rotation Test',
 ARRAY['<32° rotasjon bilateral i full fleksjon', 'Empty end-feel (ikke firm capsular)', 'Apprehension ved testing'],
 ARRAY['<32° rotation bilateral in full flexion', 'Empty end-feel (not firm capsular)', 'Apprehension during testing'],
 'C1-C2 instabilitet', 'C1-C2 instability', 5, 1, false),

((SELECT id FROM examination_clusters WHERE code = 'upper_cervical_instability'),
 'self_testing', 'Selftesting', 'Self-testing',
 ARRAY['Pasient holder hode med hender ved gange', 'Subjektiv ustabilitetsfølelse', 'Frykt for hodebevegelse'],
 ARRAY['Patient holds head with hands when walking', 'Subjective feeling of instability', 'Fear of head movement'],
 'Instabilitetsfølelse', 'Feeling of instability', 6, 1, false),

((SELECT id FROM examination_clusters WHERE code = 'upper_cervical_instability'),
 'neuro_signs_instability', 'Neurologiske tegn', 'Neurological Signs',
 ARRAY['Upper motor neuron signs (hyperrefleksi)', 'Lhermitte''s sign positiv', 'Hoffmann''s sign positiv', 'Babinski positiv'],
 ARRAY['Upper motor neuron signs (hyperreflexia)', 'Lhermitte''s sign positive', 'Hoffmann''s sign positive', 'Babinski positive'],
 'Myelopatiske tegn', 'Myelopathic signs', 7, 1, true);

-- TMJ CLUSTER TESTS (7 tests)
INSERT INTO cluster_tests (cluster_id, test_code, test_name_no, test_name_en, criteria_no, criteria_en, interpretation_no, interpretation_en, sort_order, weight) VALUES
((SELECT id FROM examination_clusters WHERE code = 'tmj_dysfunction'),
 'tmj_palpation_cluster', 'TMJ Palpasjon', 'TMJ Palpation',
 ARRAY['Høyre lateral pol: Øm (0-3 skala)', 'Venstre lateral pol: Øm', 'Høyre posterior attachment: Øm', 'Venstre posterior attachment: Øm', 'Krepitasjon eller klikking bilateral'],
 ARRAY['Right lateral pole: Tender (0-3 scale)', 'Left lateral pole: Tender', 'Right posterior attachment: Tender', 'Left posterior attachment: Tender', 'Crepitation or clicking bilateral'],
 'TMJ dysfunksjon', 'TMJ dysfunction', 1, 1),

((SELECT id FROM examination_clusters WHERE code = 'tmj_dysfunction'),
 'masseter_temporalis', 'Masseter/Temporalis Palpasjon', 'Masseter/Temporalis Palpation',
 ARRAY['Masseter høyre: Triggerpunkt', 'Masseter venstre: Triggerpunkt', 'Temporalis høyre: Øm', 'Temporalis venstre: Øm', 'Referert smerte til temporal region'],
 ARRAY['Masseter right: Trigger point', 'Masseter left: Trigger point', 'Temporalis right: Tender', 'Temporalis left: Tender', 'Referred pain to temporal region'],
 'Myofascial pain', 'Myofascial pain', 2, 1),

((SELECT id FROM examination_clusters WHERE code = 'tmj_dysfunction'),
 'mandibular_rom', 'Mandibulær ROM', 'Mandibular ROM',
 ARRAY['Maksimal åpning <40mm', 'Assisted åpning øker <5mm (kapsel restriksjon)', 'Deviasjon >2mm mot affisert side', 'C-kurve deviasjon (disc displacement)', 'Lateral excursion asymmetri >2mm'],
 ARRAY['Maximum opening <40mm', 'Assisted opening increases <5mm (capsular restriction)', 'Deviation >2mm toward affected side', 'C-curve deviation (disc displacement)', 'Lateral excursion asymmetry >2mm'],
 'Disc displacement/kapsel', 'Disc displacement/capsule', 3, 1),

((SELECT id FROM examination_clusters WHERE code = 'tmj_dysfunction'),
 'cervical_mandibular_interaction', 'Cervical-Mandibulær Interaksjon', 'Cervical-Mandibular Interaction',
 ARRAY['Kjeve åpning reduseres med nakke fleksjon', 'Kjeve åpning øker med nakke ekstensjon', 'Smerte TMJ provoseres ved nakke rotasjon', 'Endret muskeltonus ved kjeve posisjon'],
 ARRAY['Jaw opening decreases with neck flexion', 'Jaw opening increases with neck extension', 'TMJ pain provoked by neck rotation', 'Altered muscle tone with jaw position'],
 'Craniocervical involvering', 'Craniocervical involvement', 4, 1),

((SELECT id FROM examination_clusters WHERE code = 'tmj_dysfunction'),
 'dynamic_muscle_test_tmj', 'Dynamisk Muskeltest', 'Dynamic Muscle Test',
 ARRAY['Indikatormuskel svekkes ved kjeve maksimal åpning', 'Indikatormuskel svekkes ved lateral deviasjon høyre', 'Indikatormuskel svekkes ved lateral deviasjon venstre', 'Asymmetrisk respons mellom sider'],
 ARRAY['Indicator muscle weakens with maximum jaw opening', 'Indicator muscle weakens with right lateral deviation', 'Indicator muscle weakens with left lateral deviation', 'Asymmetric response between sides'],
 'Posisjonsspesifikk dysfunksjon', 'Position-specific dysfunction', 5, 1),

((SELECT id FROM examination_clusters WHERE code = 'tmj_dysfunction'),
 'upper_cervical_screening_tmj', 'Upper Cervical Screening', 'Upper Cervical Screening',
 ARRAY['C1-C2 rotasjon begrenset <32° en side', 'Suboksipital triggerpunkter', 'Occipital hovedpine (referert fra C1-C2)'],
 ARRAY['C1-C2 rotation limited <32° one side', 'Suboccipital trigger points', 'Occipital headache (referred from C1-C2)'],
 'Upper cervical involvement', 'Upper cervical involvement', 6, 1),

((SELECT id FROM examination_clusters WHERE code = 'tmj_dysfunction'),
 'otalgia_referred_pain', 'Otalgia og Referert Smerte', 'Otalgia and Referred Pain',
 ARRAY['Øresmerter uten otologisk funn', 'Tinnitus assosiert med TMJ bevegelse', 'Følelse av fullhet i øret', 'Hovedpine temporal region'],
 ARRAY['Ear pain without otological findings', 'Tinnitus associated with TMJ movement', 'Feeling of fullness in ear', 'Headache temporal region'],
 'TMJ referert smerte', 'TMJ referred pain', 7, 1);

-- BPPV CLUSTER TESTS (6 tests)
INSERT INTO cluster_tests (cluster_id, test_code, test_name_no, test_name_en, criteria_no, criteria_en, interpretation_no, interpretation_en, sort_order, weight) VALUES
((SELECT id FROM examination_clusters WHERE code = 'bppv'),
 'dix_hallpike_right', 'Dix-Hallpike Høyre', 'Dix-Hallpike Right',
 ARRAY['Geotropisk torsjonell nystagmus', 'Ageotropisk torsjonell nystagmus', 'Vertikal nystagmus (anterior canal)', 'Latency <5 sekunder', 'Varighet <60 sekunder'],
 ARRAY['Geotropic torsional nystagmus', 'Ageotropic torsional nystagmus', 'Vertical nystagmus (anterior canal)', 'Latency <5 seconds', 'Duration <60 seconds'],
 'Posterior canal BPPV høyre', 'Posterior canal BPPV right', 1, 1),

((SELECT id FROM examination_clusters WHERE code = 'bppv'),
 'dix_hallpike_left', 'Dix-Hallpike Venstre', 'Dix-Hallpike Left',
 ARRAY['Geotropisk torsjonell nystagmus', 'Ageotropisk torsjonell nystagmus', 'Vertikal nystagmus (anterior canal)', 'Latency <5 sekunder', 'Varighet <60 sekunder'],
 ARRAY['Geotropic torsional nystagmus', 'Ageotropic torsional nystagmus', 'Vertical nystagmus (anterior canal)', 'Latency <5 seconds', 'Duration <60 seconds'],
 'Posterior canal BPPV venstre', 'Posterior canal BPPV left', 2, 1),

((SELECT id FROM examination_clusters WHERE code = 'bppv'),
 'supine_roll_right', 'Supine Roll Høyre', 'Supine Roll Right',
 ARRAY['Geotropisk horisontal nystagmus', 'Ageotropisk horisontal nystagmus', 'Sterkere enn motsatt side'],
 ARRAY['Geotropic horizontal nystagmus', 'Ageotropic horizontal nystagmus', 'Stronger than opposite side'],
 'Lateral canal BPPV høyre', 'Lateral canal BPPV right', 3, 1),

((SELECT id FROM examination_clusters WHERE code = 'bppv'),
 'supine_roll_left', 'Supine Roll Venstre', 'Supine Roll Left',
 ARRAY['Geotropisk horisontal nystagmus', 'Ageotropisk horisontal nystagmus', 'Sterkere enn motsatt side'],
 ARRAY['Geotropic horizontal nystagmus', 'Ageotropic horizontal nystagmus', 'Stronger than opposite side'],
 'Lateral canal BPPV venstre', 'Lateral canal BPPV left', 4, 1),

((SELECT id FROM examination_clusters WHERE code = 'bppv'),
 'bow_and_lean', 'Bow and Lean Test', 'Bow and Lean Test',
 ARRAY['Downbeat ved bow (fremover)', 'Upbeat ved lean (bakover)', 'Horisontal høyre', 'Horisontal venstre'],
 ARRAY['Downbeat with bow (forward)', 'Upbeat with lean (backward)', 'Horizontal right', 'Horizontal left'],
 'Lateral/Anterior canal BPPV', 'Lateral/Anterior canal BPPV', 5, 1),

((SELECT id FROM examination_clusters WHERE code = 'bppv'),
 'deep_head_hanging', 'Deep Head Hanging', 'Deep Head Hanging',
 ARRAY['Downbeating nystagmus', 'Torsjonell komponent mot affisert side'],
 ARRAY['Downbeating nystagmus', 'Torsional component toward affected side'],
 'Anterior canal BPPV', 'Anterior canal BPPV', 6, 1);

-- Grant permissions
-- GRANT ALL PRIVILEGES ON TABLE examination_clusters TO chiroclickcrm_app;
-- GRANT ALL PRIVILEGES ON TABLE cluster_tests TO chiroclickcrm_app;
-- GRANT ALL PRIVILEGES ON TABLE cluster_test_results TO chiroclickcrm_app;
-- GRANT ALL PRIVILEGES ON TABLE clinical_test_cluster_mapping TO chiroclickcrm_app;

COMMENT ON SCHEMA public IS 'ChiroClickCRM v4.1 - Added Examination Clusters for Evidence-Based Diagnosis';
