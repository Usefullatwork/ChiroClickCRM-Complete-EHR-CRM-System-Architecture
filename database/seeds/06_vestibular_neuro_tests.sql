-- ============================================================================
-- Seed File: 06_vestibular_neuro_tests.sql
-- Description: Clinical tests library for vestibular, neurological, and
--              musculoskeletal examinations used in chiropractic practice
-- Source: Kiropraktisk Undersokelsesprotokoll Komplett
-- ============================================================================

-- ============================================================================
-- VNG/OKULOMOTORISK TESTS
-- Videonystagmography and oculomotor function tests
-- ============================================================================

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('vng_spontaneous_nystagmus', 'Spontaneous Nystagmus', 'Spontan nystagmus', 'VNG/OKULOMOTORISK', 'HEAD', 'VESTIBULAR',
  'Vurdering av spontan nystagmus uten fiksering',
  'Hoyre | Venstre | Vertikal | Pendular',
  'Perifert vestibulaert tap, Central lesjon',
  'SELECT_ONE', 'Ingen (<4 deg/s)|Hoyre|Venstre|Vertikal|Pendulaer')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('vng_gaze_horizontal', 'Horizontal Gaze Test', 'Gaze horisontal', 'VNG/OKULOMOTORISK', 'HEAD', 'VESTIBULAR',
  'Vurdering av horisontalt blikk ved 20-30 graders eksentrisitet',
  'Hoyre | Venstre | Bilateral',
  'Neural integrator dysfunksjon (flocculus)',
  'SELECT_ONE', 'Ingen|Hoyre|Venstre|Bilateral')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('vng_gaze_vertical', 'Vertical Gaze Test', 'Gaze vertikal', 'VNG/OKULOMOTORISK', 'HEAD', 'VESTIBULAR',
  'Vurdering av vertikalt blikk',
  'Upbeat | Downbeat',
  'Central lesjon',
  'SELECT_ONE', 'Ingen|Upbeat|Downbeat')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('vng_saccades_horizontal', 'Horizontal Saccades', 'Sakkader horisontal', 'VNG/OKULOMOTORISK', 'HEAD', 'VESTIBULAR',
  'Vurdering av horisontale sakkader med normal gain 0.9-1.0',
  'Overshoots | Catch-up | Latency >260ms',
  'Cerebellaer dysfunksjon (fastigial nucleus)',
  'SELECT_ONE', 'Normal gain 0.9-1.0|Overshoots|Catch-up|Latency >260ms')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('vng_saccades_vertical', 'Vertical Saccades', 'Sakkader vertikal', 'VNG/OKULOMOTORISK', 'HEAD', 'VESTIBULAR',
  'Vurdering av vertikale sakkader',
  'Overshoots | Catch-up',
  'Cerebellaer dysfunksjon (vermis)',
  'SELECT_ONE', 'Normal|Overshoots|Catch-up')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('vng_smooth_pursuit_horizontal', 'Horizontal Smooth Pursuit', 'Smooth pursuit horisontal', 'VNG/OKULOMOTORISK', 'HEAD', 'VESTIBULAR',
  'Vurdering av horisontal smooth pursuit med normal gain 0.9-1.0',
  'Catch-up sakkader | Saccadic pursuit',
  'Cerebellum/parietal cortex dysfunksjon',
  'SELECT_ONE', 'Normal gain 0.9-1.0|Catch-up sakkader|Saccadic pursuit')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('vng_smooth_pursuit_vertical', 'Vertical Smooth Pursuit', 'Smooth pursuit vertikal', 'VNG/OKULOMOTORISK', 'HEAD', 'VESTIBULAR',
  'Vurdering av vertikal smooth pursuit',
  'Catch-up sakkader',
  'Cerebellum dysfunksjon',
  'SELECT_ONE', 'Normal|Catch-up sakkader')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('vng_opk', 'Optokinetic Test', 'OPK', 'VNG/OKULOMOTORISK', 'HEAD', 'VESTIBULAR',
  'Optokinetisk testing',
  'Asymmetrisk | Provoserer svimmelhet',
  'Cerebellaer/vestibulaer',
  'SELECT_ONE', 'Normal|Asymmetrisk|Provoserer svimmelhet')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- BPPV TESTS
-- Benign Paroxysmal Positional Vertigo assessment
-- ============================================================================

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('bppv_dix_hallpike_right', 'Dix-Hallpike Right', 'Dix-Hallpike hoyre', 'BPPV', 'HEAD', 'VESTIBULAR',
  'Dix-Hallpike manoever for hoyre side med observasjon av nystagmus',
  'Geotropisk torsjonell | Ageotropisk | Vertikal | <5s latency | <60s varighet',
  'Posterior canal BPPV',
  'SELECT_MULTIPLE', 'Negativ|Geotropisk torsjonell|Ageotropisk|Vertikal|<5s latency|<60s varighet')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('bppv_dix_hallpike_left', 'Dix-Hallpike Left', 'Dix-Hallpike venstre', 'BPPV', 'HEAD', 'VESTIBULAR',
  'Dix-Hallpike manoever for venstre side med observasjon av nystagmus',
  'Geotropisk torsjonell | Ageotropisk | Vertikal | <5s latency | <60s varighet',
  'Posterior canal BPPV',
  'SELECT_MULTIPLE', 'Negativ|Geotropisk torsjonell|Ageotropisk|Vertikal|<5s latency|<60s varighet')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('bppv_supine_roll_right', 'Supine Roll Right', 'Supine roll hoyre', 'BPPV', 'HEAD', 'VESTIBULAR',
  'Supine roll test for hoyre side for lateral canal BPPV',
  'Geotropisk horisontal | Ageotropisk | Sterkest pa affisert side',
  'Lateral canal BPPV',
  'SELECT_MULTIPLE', 'Negativ|Geotropisk horisontal|Ageotropisk|Sterkest pa affisert side')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('bppv_supine_roll_left', 'Supine Roll Left', 'Supine roll venstre', 'BPPV', 'HEAD', 'VESTIBULAR',
  'Supine roll test for venstre side for lateral canal BPPV',
  'Geotropisk horisontal | Ageotropisk | Sterkest pa affisert side',
  'Lateral canal BPPV',
  'SELECT_MULTIPLE', 'Negativ|Geotropisk horisontal|Ageotropisk|Sterkest pa affisert side')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('bppv_bow_and_lean', 'Bow and Lean Test', 'Bow and Lean', 'BPPV', 'HEAD', 'VESTIBULAR',
  'Bow and Lean test for a skille mellom laterale kanalvarianter',
  'Downbeat ved bow | Upbeat ved lean | Horisontal',
  'Lateral/Anterior canal BPPV',
  'SELECT_MULTIPLE', 'Negativ|Downbeat ved bow|Upbeat ved lean|Horisontal')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('bppv_deep_head_hanging', 'Deep Head Hanging', 'Deep head hanging', 'BPPV', 'HEAD', 'VESTIBULAR',
  'Deep head hanging test for anterior canal BPPV',
  'Downbeating nystagmus',
  'Anterior canal BPPV',
  'SELECT_ONE', 'Negativ|Downbeating nystagmus')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- CEREBELLAR TESTS
-- Cerebellar function assessment
-- ============================================================================

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('cerebellar_finger_nose_right', 'Finger-Nose-Finger Right', 'Finger-nese-finger hoyre', 'CEREBELLAER', 'UPPER_EXTREMITY', 'NEUROLOGICAL',
  'Finger-nese-finger test for hoyre side',
  'Dysmetri | Intention tremor | Dekomponert',
  'Cerebellaer hemisphaere dysfunksjon',
  'SELECT_MULTIPLE', 'Normal|Dysmetri|Intention tremor|Dekomponert')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('cerebellar_finger_nose_left', 'Finger-Nose-Finger Left', 'Finger-nese-finger venstre', 'CEREBELLAER', 'UPPER_EXTREMITY', 'NEUROLOGICAL',
  'Finger-nese-finger test for venstre side',
  'Dysmetri | Intention tremor | Dekomponert',
  'Cerebellaer hemisphaere dysfunksjon',
  'SELECT_MULTIPLE', 'Normal|Dysmetri|Intention tremor|Dekomponert')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('cerebellar_heel_knee_shin_right', 'Heel-Knee-Shin Right', 'Hel-kne-legg hoyre', 'CEREBELLAER', 'LOWER_EXTREMITY', 'NEUROLOGICAL',
  'Hel-kne-legg test for hoyre side',
  'Tremor | Ataksi',
  'Cerebellaer hemisphaere dysfunksjon',
  'SELECT_MULTIPLE', 'Normal|Tremor|Ataksi')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('cerebellar_heel_knee_shin_left', 'Heel-Knee-Shin Left', 'Hel-kne-legg venstre', 'CEREBELLAER', 'LOWER_EXTREMITY', 'NEUROLOGICAL',
  'Hel-kne-legg test for venstre side',
  'Tremor | Ataksi',
  'Cerebellaer hemisphaere dysfunksjon',
  'SELECT_MULTIPLE', 'Normal|Tremor|Ataksi')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('cerebellar_dysdiadochokinesia_right', 'Dysdiadochokinesia Right', 'Dysdiadokokinesi hoyre', 'CEREBELLAER', 'UPPER_EXTREMITY', 'NEUROLOGICAL',
  'Dysdiadokokinesi test for hoyre side',
  'Redusert hastighet | Irregulaer | Arytmisk',
  'Cerebellaer hemisphaere dysfunksjon',
  'SELECT_MULTIPLE', 'Normal rytme|Redusert hastighet|Irregulaer|Arytmisk')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('cerebellar_dysdiadochokinesia_left', 'Dysdiadochokinesia Left', 'Dysdiadokokinesi venstre', 'CEREBELLAER', 'UPPER_EXTREMITY', 'NEUROLOGICAL',
  'Dysdiadokokinesi test for venstre side',
  'Redusert hastighet | Irregulaer | Arytmisk',
  'Cerebellaer hemisphaere dysfunksjon',
  'SELECT_MULTIPLE', 'Normal rytme|Redusert hastighet|Irregulaer|Arytmisk')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('cerebellar_romberg', 'Romberg Test', 'Romberg', 'CEREBELLAER', 'FULL_BODY', 'NEUROLOGICAL',
  'Romberg test for balanse og propriosepsjon',
  'Ustabil apne (cerebellaer) | Ustabil kun lukket (proprioseptiv)',
  'Cerebellaer vs proprioseptiv',
  'SELECT_ONE', 'Stabil apne/lukket|Ustabil apne (cerebellaer)|Ustabil kun lukket (proprioseptiv)')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('cerebellar_tandem_gait', 'Tandem Gait', 'Tandem gange', 'CEREBELLAER', 'FULL_BODY', 'NEUROLOGICAL',
  'Tandem gange test',
  'Lateral svaing | Korrigerende steg | Truncal ataksi',
  'Vermis/flocculonodular dysfunksjon',
  'SELECT_MULTIPLE', 'Normal|Lateral svaing|Korrigerende steg|Truncal ataksi')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('cerebellar_truncal_stability', 'Truncal Stability', 'Truncal stability', 'CEREBELLAER', 'TRUNK', 'NEUROLOGICAL',
  'Vurdering av truncal stabilitet sittende',
  'Svaing sittende | Trenger stotte',
  'Midline cerebellum (vermis)',
  'SELECT_ONE', 'Normal|Svaing sittende|Trenger stotte')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- TMJ TESTS
-- Temporomandibular joint assessment
-- ============================================================================

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('tmj_inspection', 'TMJ Inspection', 'Inspeksjon', 'TMJ', 'HEAD', 'MUSCULOSKELETAL',
  'Visuell inspeksjon av TMJ og kjeve',
  'Lateral deviasjon | Asymmetri | Hypertrofi masseter',
  'TMJ dysfunksjon',
  'SELECT_MULTIPLE', 'Normal symmetri|Lateral deviasjon|Asymmetri|Hypertrofi masseter')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('tmj_palpation_right', 'TMJ Palpation Right', 'TMJ palpasjon hoyre', 'TMJ', 'HEAD', 'MUSCULOSKELETAL',
  'Palpasjon av hoyre TMJ',
  'Om (0-3) | Klikking | Krepitasjon',
  'TMJ dysfunksjon',
  'SELECT_MULTIPLE', 'Ikke om|Om (0-3)|Klikking|Krepitasjon')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('tmj_palpation_left', 'TMJ Palpation Left', 'TMJ palpasjon venstre', 'TMJ', 'HEAD', 'MUSCULOSKELETAL',
  'Palpasjon av venstre TMJ',
  'Om (0-3) | Klikking | Krepitasjon',
  'TMJ dysfunksjon',
  'SELECT_MULTIPLE', 'Ikke om|Om (0-3)|Klikking|Krepitasjon')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('tmj_jaw_opening', 'Jaw Opening Range', 'Kjeve apning', 'TMJ', 'HEAD', 'MUSCULOSKELETAL',
  'Vurdering av kjeveapning og bevegelsesmonster',
  'Begrenset | Deviasjon hoyre/venstre | C-kurve | S-kurve',
  'Disc displacement, kapsel restriksjon',
  'SELECT_MULTIPLE', 'Normal >40mm|Begrenset|Deviasjon hoyre|Deviasjon venstre|C-kurve|S-kurve')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('tmj_masseter_palpation_right', 'Masseter Palpation Right', 'Masseter palpasjon hoyre', 'TMJ', 'HEAD', 'MUSCULOSKELETAL',
  'Palpasjon av hoyre masseter',
  'Om | Triggerpunkt',
  'Myofascial pain',
  'SELECT_ONE', 'Ikke om|Om|Triggerpunkt')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('tmj_masseter_palpation_left', 'Masseter Palpation Left', 'Masseter palpasjon venstre', 'TMJ', 'HEAD', 'MUSCULOSKELETAL',
  'Palpasjon av venstre masseter',
  'Om | Triggerpunkt',
  'Myofascial pain',
  'SELECT_ONE', 'Ikke om|Om|Triggerpunkt')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('tmj_temporalis_palpation_right', 'Temporalis Palpation Right', 'Temporalis palpasjon hoyre', 'TMJ', 'HEAD', 'MUSCULOSKELETAL',
  'Palpasjon av hoyre temporalis',
  'Om | Triggerpunkt',
  'Myofascial pain',
  'SELECT_ONE', 'Ikke om|Om|Triggerpunkt')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('tmj_temporalis_palpation_left', 'Temporalis Palpation Left', 'Temporalis palpasjon venstre', 'TMJ', 'HEAD', 'MUSCULOSKELETAL',
  'Palpasjon av venstre temporalis',
  'Om | Triggerpunkt',
  'Myofascial pain',
  'SELECT_ONE', 'Ikke om|Om|Triggerpunkt')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- DYNAMISK POSISJONELL TESTS
-- Dynamic positional muscle testing
-- ============================================================================

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('dynamic_baseline_deltoid', 'Baseline Deltoid Anterior', 'Baseline deltoid anterior', 'DYNAMISK POSISJONELL', 'UPPER_EXTREMITY', 'MUSCULOSKELETAL',
  'Baseline muskeltest av anterior deltoid',
  'Svak/ikke-last',
  'Baseline for testing',
  'SELECT_ONE', 'Sterk/last|Svak/ikke-last')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('dynamic_cervical_flexion', 'Cervical Flexion Challenge', 'Cervical fleksjon challenge', 'DYNAMISK POSISJONELL', 'CERVICAL', 'MUSCULOSKELETAL',
  'Muskeltest med cervical fleksjon',
  'Svak',
  'Suboksipital, ovre cervical',
  'SELECT_ONE', 'Sterk|Svak')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('dynamic_cervical_extension', 'Cervical Extension Challenge', 'Cervical ekstensjon challenge', 'DYNAMISK POSISJONELL', 'CERVICAL', 'MUSCULOSKELETAL',
  'Muskeltest med cervical ekstensjon',
  'Svak',
  'Nedre cervical, thoracic overgang',
  'SELECT_ONE', 'Sterk|Svak')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('dynamic_cervical_rotation_right', 'Cervical Rotation Right Challenge', 'Cervical rotasjon hoyre challenge', 'DYNAMISK POSISJONELL', 'CERVICAL', 'MUSCULOSKELETAL',
  'Muskeltest med cervical rotasjon til hoyre',
  'Svak',
  'C1-C2 dysfunksjon, vertebral arterie',
  'SELECT_ONE', 'Sterk|Svak')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('dynamic_cervical_rotation_left', 'Cervical Rotation Left Challenge', 'Cervical rotasjon venstre challenge', 'DYNAMISK POSISJONELL', 'CERVICAL', 'MUSCULOSKELETAL',
  'Muskeltest med cervical rotasjon til venstre',
  'Svak',
  'C1-C2 dysfunksjon, vertebral arterie',
  'SELECT_ONE', 'Sterk|Svak')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('dynamic_jaw_max_opening', 'Jaw Maximum Opening Challenge', 'Kjeve maksimal apning challenge', 'DYNAMISK POSISJONELL', 'HEAD', 'MUSCULOSKELETAL',
  'Muskeltest med maksimal kjeveapning',
  'Svak',
  'TMJ dysfunksjon, C1-C2 instabilitet',
  'SELECT_ONE', 'Sterk|Svak')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('dynamic_mandible_deviation_right', 'Lateral Mandible Deviation Right', 'Lateral mandibel deviasjon hoyre', 'DYNAMISK POSISJONELL', 'HEAD', 'MUSCULOSKELETAL',
  'Muskeltest med lateral mandibel deviasjon til hoyre',
  'Svak',
  'Ipsilateral TMJ, SCM, scalene',
  'SELECT_ONE', 'Sterk|Svak')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('dynamic_mandible_deviation_left', 'Lateral Mandible Deviation Left', 'Lateral mandibel deviasjon venstre', 'DYNAMISK POSISJONELL', 'HEAD', 'MUSCULOSKELETAL',
  'Muskeltest med lateral mandibel deviasjon til venstre',
  'Svak',
  'Ipsilateral TMJ, SCM, scalene',
  'SELECT_ONE', 'Sterk|Svak')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('dynamic_eyes_closed', 'Eyes Closed Challenge', 'Oyne lukket challenge', 'DYNAMISK POSISJONELL', 'HEAD', 'NEUROLOGICAL',
  'Muskeltest med lukkede oyne',
  'Svak',
  'Visuell-vestibulaer integrasjon',
  'SELECT_ONE', 'Sterk|Svak')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('dynamic_gaze_right', 'Maximum Right Gaze Challenge', 'Oyne maksimal hoyre gaze', 'DYNAMISK POSISJONELL', 'HEAD', 'NEUROLOGICAL',
  'Muskeltest med maksimal oynebevegelse til hoyre',
  'Svak',
  'Okulomotorisk dysfunksjon',
  'SELECT_ONE', 'Sterk|Svak')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('dynamic_gaze_left', 'Maximum Left Gaze Challenge', 'Oyne maksimal venstre gaze', 'DYNAMISK POSISJONELL', 'HEAD', 'NEUROLOGICAL',
  'Muskeltest med maksimal oynebevegelse til venstre',
  'Svak',
  'Okulomotorisk dysfunksjon',
  'SELECT_ONE', 'Sterk|Svak')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- AKTIVATOR METODE TESTS
-- Activator Method chiropractic technique assessments
-- ============================================================================

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('activator_static_leg_length', 'Static Leg Length', 'Statisk benlengde', 'AKTIVATOR METODE', 'LOWER_EXTREMITY', 'MUSCULOSKELETAL',
  'Statisk benlengde vurdering',
  'Hoyre kort | Venstre kort',
  'Anatomisk vs funksjonell',
  'SELECT_ONE', 'Lik|Hoyre kort|Venstre kort')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('activator_dynamic_head_lift', 'Dynamic Head Lift', 'Dynamisk hodeloft', 'AKTIVATOR METODE', 'CERVICAL', 'MUSCULOSKELETAL',
  'Dynamisk test med hodeloft',
  'Hoyre forkortes | Venstre forkortes | Forlenges',
  'Cervical dysfunksjon',
  'SELECT_ONE', 'Ingen endring|Hoyre forkortes|Venstre forkortes|Forlenges')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('activator_head_rotation_right', 'Dynamic Head Rotation Right', 'Dynamisk hoderotasjon hoyre', 'AKTIVATOR METODE', 'CERVICAL', 'MUSCULOSKELETAL',
  'Dynamisk test med hoderotasjon til hoyre',
  'Hoyre forkortes | Venstre forkortes',
  'C1-C2 dysfunksjon',
  'SELECT_ONE', 'Ingen endring|Hoyre forkortes|Venstre forkortes')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('activator_head_rotation_left', 'Dynamic Head Rotation Left', 'Dynamisk hoderotasjon venstre', 'AKTIVATOR METODE', 'CERVICAL', 'MUSCULOSKELETAL',
  'Dynamisk test med hoderotasjon til venstre',
  'Hoyre forkortes | Venstre forkortes',
  'C1-C2 dysfunksjon',
  'SELECT_ONE', 'Ingen endring|Hoyre forkortes|Venstre forkortes')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('activator_c0_c1_palpation', 'C0-C1 Palpation', 'C0-C1 palpasjon', 'AKTIVATOR METODE', 'CERVICAL', 'MUSCULOSKELETAL',
  'Palpasjon av C0-C1 segmentet',
  'Restriksjon',
  'Occipitocervical dysfunksjon',
  'SELECT_ONE', 'Normal|Restriksjon')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('activator_c1_c2_palpation', 'C1-C2 Palpation', 'C1-C2 palpasjon', 'AKTIVATOR METODE', 'CERVICAL', 'MUSCULOSKELETAL',
  'Palpasjon av C1-C2 segmentet',
  'Restriksjon',
  'Atlantoaxial dysfunksjon',
  'SELECT_ONE', 'Normal|Restriksjon')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('activator_c2_c7_palpation', 'C2-C7 Palpation', 'C2-C7 palpasjon', 'AKTIVATOR METODE', 'CERVICAL', 'MUSCULOSKELETAL',
  'Palpasjon av C2-C7 segmentene',
  'Restriksjon (spesifiser niva)',
  'Segmental dysfunksjon',
  'SELECT_ONE', 'Normal|Restriksjon')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- KLUSTER - CEREBELLAR
-- Cerebellar dysfunction cluster assessment
-- ============================================================================

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('cluster_cerebellar_saccade_overshoots', 'Saccade Overshoots (VNG)', 'Sakkade overshoots (VNG)', 'KLUSTER - CEREBELLAER', 'HEAD', 'NEUROLOGICAL',
  'VNG sakkade overshoots vurdering (1/8)',
  'Bilateral >10% | Vertikal >10% | Konsistent',
  'Fastigial nucleus/OMV',
  'SELECT_MULTIPLE', 'Normal|Bilateral >10%|Vertikal >10%|Konsistent')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('cluster_cerebellar_pursuit_catchup', 'Pursuit Catch-up Saccades', 'Pursuit catch-up sakkader', 'KLUSTER - CEREBELLAER', 'HEAD', 'NEUROLOGICAL',
  'Smooth pursuit catch-up sakkader vurdering (2/8)',
  'Gain <0.7 horisontal | Gain <0.7 vertikal | >5 catch-up/30s',
  'Flocculus/paraflocculus',
  'SELECT_MULTIPLE', 'Normal|Gain <0.7 horisontal|Gain <0.7 vertikal|>5 catch-up/30s')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('cluster_cerebellar_gaze_nystagmus', 'Gaze-Evoked Nystagmus', 'Gaze-evoked nystagmus', 'KLUSTER - CEREBELLAER', 'HEAD', 'NEUROLOGICAL',
  'Gaze-evoked nystagmus vurdering (3/8)',
  '20 grader eksentrisitet | Vertikal | Rebound',
  'Neural integrator',
  'SELECT_MULTIPLE', 'Normal|20 grader eksentrisitet|Vertikal|Rebound')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('cluster_cerebellar_fnf_dysmetria', 'Finger-Nose-Finger Dysmetria', 'Finger-nese-finger dysmetri', 'KLUSTER - CEREBELLAER', 'UPPER_EXTREMITY', 'NEUROLOGICAL',
  'Finger-nese-finger dysmetri vurdering (4/8)',
  'Intention tremor | Overshoot >2cm | Dekomponert',
  'Cerebellaer hemisphaere',
  'SELECT_MULTIPLE', 'Normal|Intention tremor|Overshoot >2cm|Dekomponert')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('cluster_cerebellar_dysdiadochokinesia', 'Dysdiadochokinesia', 'Dysdiadokokinesi', 'KLUSTER - CEREBELLAER', 'UPPER_EXTREMITY', 'NEUROLOGICAL',
  'Dysdiadokokinesi vurdering (5/8)',
  '<10 bevegelser/5s | Irregulaer rytme | Arytmisk',
  'Cerebellaer hemisphaere',
  'SELECT_MULTIPLE', 'Normal|<10 bevegelser/5s|Irregulaer rytme|Arytmisk')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('cluster_cerebellar_tandem_gait', 'Tandem Gait', 'Tandem gange', 'KLUSTER - CEREBELLAER', 'FULL_BODY', 'NEUROLOGICAL',
  'Tandem gange vurdering (6/8)',
  'Svaing >10cm | >3 korrigerende steg/10m | Ikke i stand',
  'Vermis/flocculonodular',
  'SELECT_MULTIPLE', 'Normal|Svaing >10cm|>3 korrigerende steg/10m|Ikke i stand')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('cluster_cerebellar_romberg_modified', 'Romberg Modified', 'Romberg modifisert', 'KLUSTER - CEREBELLAER', 'FULL_BODY', 'NEUROLOGICAL',
  'Modifisert Romberg vurdering (7/8)',
  'Ustabil apne oyne | Fall uten preferanse | Truncal ataksi',
  'Midline cerebellum',
  'SELECT_MULTIPLE', 'Normal|Ustabil apne oyne|Fall uten preferanse|Truncal ataksi')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('cluster_cerebellar_heel_knee_shin', 'Heel-Knee-Shin', 'Heel-knee-shin', 'KLUSTER - CEREBELLAER', 'LOWER_EXTREMITY', 'NEUROLOGICAL',
  'Heel-knee-shin vurdering (8/8)',
  'Ataksi bilateral | Tremor | Ikke folge linje',
  'Cerebellaer hemisphaere',
  'SELECT_MULTIPLE', 'Normal|Ataksi bilateral|Tremor|Ikke folge linje')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('cluster_cerebellar_score', 'Cerebellar Cluster Score', 'KLUSTER SCORE Cerebellaer', 'KLUSTER - CEREBELLAER', 'FULL_BODY', 'NEUROLOGICAL',
  'Samlet kluster score for cerebellaer dysfunksjon. >=4/8 = HOY sannsynlighet - Henvis nevrolog + MR',
  '>=4/8 = HOY sannsynlighet',
  'Cerebellaer patologi',
  'SCORE', '0|1|2|3|4|5|6|7|8')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- KLUSTER - VESTIBULAR
-- Vestibular dysfunction cluster assessment
-- ============================================================================

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('cluster_vestibular_spontaneous_nystagmus', 'Spontaneous Nystagmus', 'Spontan nystagmus', 'KLUSTER - VESTIBULAER', 'HEAD', 'VESTIBULAR',
  'Spontan nystagmus vurdering (1/6)',
  'Horisontal-torsjonell mot frisk | SPV >6 deg/s | Oker med Frenzel',
  'Perifert vestibulaert tap',
  'SELECT_MULTIPLE', 'Normal|Horisontal-torsjonell mot frisk|SPV >6 deg/s|Oker med Frenzel')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('cluster_vestibular_hit', 'Head Impulse Test', 'Head Impulse Test', 'KLUSTER - VESTIBULAER', 'HEAD', 'VESTIBULAR',
  'Head Impulse Test vurdering (2/6)',
  'Positiv hoyre/venstre | Corrective saccade',
  'Superior canal dysfunction',
  'SELECT_MULTIPLE', 'Normal|Positiv hoyre|Positiv venstre|Corrective saccade')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('cluster_vestibular_caloric', 'Caloric Test (VNG)', 'Caloric test (VNG)', 'KLUSTER - VESTIBULAER', 'HEAD', 'VESTIBULAR',
  'Kalorisk test med VNG (3/6)',
  'Unilateral weakness >25% | Directional preponderance >30%',
  'Perifert tap samme side',
  'SELECT_MULTIPLE', 'Normal|Unilateral weakness >25%|Directional preponderance >30%')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('cluster_vestibular_test_of_skew', 'Test of Skew', 'Test of Skew', 'KLUSTER - VESTIBULAER', 'HEAD', 'VESTIBULAR',
  'Test of Skew for sentral lesjon (4/6)',
  'Vertikal diplopi | Cover-uncover positiv | SVV >2 grader',
  'SENTRAL lesjon',
  'SELECT_MULTIPLE', 'Normal|Vertikal diplopi|Cover-uncover positiv|SVV >2 grader')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('cluster_vestibular_gait_test', 'Gait Test with Head Movements', 'Gangtest med hodebevegelser', 'KLUSTER - VESTIBULAER', 'FULL_BODY', 'VESTIBULAR',
  'Gangtest med hodebevegelser (5/6)',
  'Avvergegange mot affisert | Romberg fall | Ikke ga med hoderotasjon',
  'Perifert vestibulaert tap',
  'SELECT_MULTIPLE', 'Normal|Avvergegange mot affisert|Romberg fall|Ikke ga med hoderotasjon')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('cluster_vestibular_dva', 'Dynamic Visual Acuity', 'Dynamic Visual Acuity', 'KLUSTER - VESTIBULAER', 'HEAD', 'VESTIBULAR',
  'Dynamic Visual Acuity test (6/6)',
  '>3 linjer tap Snellen ved hoderotasjon',
  'Bilateral vestibulaer tap',
  'SELECT_ONE', 'Normal|>3 linjer tap Snellen ved hoderotasjon')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('cluster_vestibular_score', 'Vestibular Cluster Score', 'KLUSTER SCORE Vestibulaer', 'KLUSTER - VESTIBULAER', 'HEAD', 'VESTIBULAR',
  'Samlet kluster score for vestibulaer dysfunksjon. >=3/5 = HOY sannsynlighet perifert tap. HINTS+ protokoll ekskluderer sentral',
  '>=3/5 = HOY sannsynlighet perifert tap',
  'HINTS+ protokoll ekskluderer sentral',
  'SCORE', '0|1|2|3|4|5|6')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- KLUSTER - CERVIKOGEN SVIMMELHET
-- Cervicogenic dizziness cluster assessment
-- ============================================================================

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('cluster_cervicogenic_rom', 'Cervical ROM', 'Cervical ROM', 'KLUSTER - CERVIKOGEN SVIMMELHET', 'CERVICAL', 'MUSCULOSKELETAL',
  'Cervical bevegelighet vurdering (1/7)',
  'Rotasjon <60 grader | Fleksjon <50 grader | Provoserer svimmelhet ikke-vertigo',
  'Redusert proprioseptiv input',
  'SELECT_MULTIPLE', 'Normal|Rotasjon <60 grader|Fleksjon <50 grader|Provoserer svimmelhet ikke-vertigo')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('cluster_cervicogenic_spnt', 'Smooth Pursuit Neck Torsion', 'Smooth Pursuit Neck Torsion', 'KLUSTER - CERVIKOGEN SVIMMELHET', 'CERVICAL', 'NEUROLOGICAL',
  'Smooth Pursuit Neck Torsion test (2/7)',
  'Redusert gain nakke 45 grader hoyre/venstre | Normal noytral | Forskjell >0.1',
  'Cervical proprioseptiv dysfunksjon',
  'SELECT_MULTIPLE', 'Normal|Redusert gain nakke 45 grader hoyre|Redusert gain nakke 45 grader venstre|Forskjell >0.1')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('cluster_cervicogenic_cfrt', 'Cervical Flexion-Rotation Test', 'Cervical Flexion-Rotation Test', 'KLUSTER - CERVIKOGEN SVIMMELHET', 'CERVICAL', 'MUSCULOSKELETAL',
  'Cervical Flexion-Rotation Test (3/7)',
  '<32 grader rotasjon bilateral i fleksjon | Asymmetri >10 grader',
  'C1-C2 dysfunksjon',
  'SELECT_MULTIPLE', 'Normal|<32 grader rotasjon bilateral i fleksjon|Asymmetri >10 grader')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('cluster_cervicogenic_vbi', 'Vertebral Artery Testing', 'Vertebral Artery Testing', 'KLUSTER - CERVIKOGEN SVIMMELHET', 'CERVICAL', 'VASCULAR',
  'Vertebral arterie testing (4/7) - De Kleyn, Maigne, Hautant, Underberg',
  'De Kleyn | Maigne | Hautant | Underberg positiv',
  'VBI - ADVARSEL',
  'SELECT_MULTIPLE', 'Negativ|De Kleyn positiv|Maigne positiv|Hautant positiv|Underberg positiv')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('cluster_cervicogenic_jpe', 'Cervical JPE', 'Cervical JPE', 'KLUSTER - CERVIKOGEN SVIMMELHET', 'CERVICAL', 'NEUROLOGICAL',
  'Cervical Joint Position Error test (5/7)',
  '>4.5 grader feil ved relokalisering | Bilateral forhoyet',
  'Proprioseptiv dysfunksjon',
  'SELECT_MULTIPLE', 'Normal|>4.5 grader feil ved relokalisering|Bilateral forhoyet')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('cluster_cervicogenic_palpation', 'Palpation C1-C3', 'Palpasjon C1-C3', 'KLUSTER - CERVIKOGEN SVIMMELHET', 'CERVICAL', 'MUSCULOSKELETAL',
  'Palpasjon av C1-C3 (6/7)',
  'Palpasjonsomhet | Restriksjon | Suboksipital hypertoni | Triggerpunkter SCM/scalene',
  'Cervical dysfunksjon',
  'SELECT_MULTIPLE', 'Normal|Palpasjonsomhet|Restriksjon|Suboksipital hypertoni|Triggerpunkter SCM/scalene')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('cluster_cervicogenic_provocation', 'Provocation Test', 'Provokasjonstest', 'KLUSTER - CERVIKOGEN SVIMMELHET', 'CERVICAL', 'MUSCULOSKELETAL',
  'Provokasjonstest for cervikogen svimmelhet (7/7)',
  'Svimmelhet ved sustained posisjon | Isometrisk motstand | Negativ Dix-Hallpike',
  'Cervikogen arsak',
  'SELECT_MULTIPLE', 'Normal|Svimmelhet ved sustained posisjon|Isometrisk motstand|Negativ Dix-Hallpike')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('cluster_cervicogenic_score', 'Cervicogenic Dizziness Cluster Score', 'KLUSTER SCORE Cervikogen svimmelhet', 'KLUSTER - CERVIKOGEN SVIMMELHET', 'CERVICAL', 'MUSCULOSKELETAL',
  'Samlet kluster score for cervikogen svimmelhet. >=4/7 = Sannsynlig cervikogen svimmelhet. Mobilisering C1-C2 + proprioseptiv rehab',
  '>=4/7 = Sannsynlig cervikogen svimmelhet',
  'Mobilisering C1-C2 + proprioseptiv rehab',
  'SCORE', '0|1|2|3|4|5|6|7')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- KLUSTER - TMJ
-- TMJ dysfunction cluster assessment
-- ============================================================================

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('cluster_tmj_palpation', 'TMJ Palpation', 'TMJ palpasjon', 'KLUSTER - TMJ', 'HEAD', 'MUSCULOSKELETAL',
  'TMJ palpasjon (1/7)',
  'Lateral pol om 0-3 | Posterior attachment om | Krepitasjon/klikking',
  'TMJ dysfunksjon',
  'SELECT_MULTIPLE', 'Normal|Lateral pol om 0-3|Posterior attachment om|Krepitasjon|Klikking')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('cluster_tmj_masseter_temporalis', 'Masseter/Temporalis', 'Masseter/Temporalis', 'KLUSTER - TMJ', 'HEAD', 'MUSCULOSKELETAL',
  'Masseter og Temporalis palpasjon (2/7)',
  'Triggerpunkt VAS hoyre/venstre | Referert smerte temporal',
  'Myofascial pain',
  'SELECT_MULTIPLE', 'Normal|Triggerpunkt hoyre|Triggerpunkt venstre|Referert smerte temporal')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('cluster_tmj_mandibular_rom', 'Mandibular ROM', 'Mandibulaer ROM', 'KLUSTER - TMJ', 'HEAD', 'MUSCULOSKELETAL',
  'Mandibulaer bevegelighet (3/7)',
  'Apning <40mm | Assisted <5mm okning | Deviasjon >2mm | C-kurve',
  'Disc displacement/kapsel',
  'SELECT_MULTIPLE', 'Normal|Apning <40mm|Assisted <5mm okning|Deviasjon >2mm|C-kurve')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('cluster_tmj_cervical_interaction', 'Cervical-Mandibular Interaction', 'Cervical-Mandibulaer interaksjon', 'KLUSTER - TMJ', 'CERVICAL', 'MUSCULOSKELETAL',
  'Cervical-mandibulaer interaksjon (4/7)',
  'Kjeve apning endres med nakke posisjon | TMJ smerte ved nakke rotasjon',
  'Craniocervical involvering',
  'SELECT_MULTIPLE', 'Normal|Kjeve apning endres med nakke posisjon|TMJ smerte ved nakke rotasjon')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('cluster_tmj_dynamic_muscle_test', 'Dynamic Muscle Test', 'Dynamisk muskeltest', 'KLUSTER - TMJ', 'HEAD', 'MUSCULOSKELETAL',
  'Dynamisk muskeltest for TMJ (5/7)',
  'Indikatormuskel svekkes ved kjeve apning/deviasjon | Asymmetrisk',
  'Posisjonsspesifikk dysfunksjon',
  'SELECT_MULTIPLE', 'Normal|Indikatormuskel svekkes ved kjeve apning|Indikatormuskel svekkes ved deviasjon|Asymmetrisk')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('cluster_tmj_upper_cervical', 'Upper Cervical Screening', 'Upper cervical screening', 'KLUSTER - TMJ', 'CERVICAL', 'MUSCULOSKELETAL',
  'Upper cervical screening (6/7)',
  'C1-C2 rotasjon <32 grader | Suboksipital triggerpunkter | Occipital hovedpine',
  'Upper cervical involvement',
  'SELECT_MULTIPLE', 'Normal|C1-C2 rotasjon <32 grader|Suboksipital triggerpunkter|Occipital hovedpine')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('cluster_tmj_otalgia', 'Otalgia and Referred Pain', 'Otalgia og referert smerte', 'KLUSTER - TMJ', 'HEAD', 'MUSCULOSKELETAL',
  'Otalgia og referert smerte (7/7)',
  'Oresmerter uten otologisk funn | Tinnitus med TMJ bevegelse | Fullhet oret',
  'TMJ referert smerte',
  'SELECT_MULTIPLE', 'Normal|Oresmerter uten otologisk funn|Tinnitus med TMJ bevegelse|Fullhet oret')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('cluster_tmj_score', 'TMJ Cluster Score', 'KLUSTER SCORE TMJ', 'KLUSTER - TMJ', 'HEAD', 'MUSCULOSKELETAL',
  'Samlet kluster score for TMJ dysfunksjon. >=3/7 = TMJ dysfunksjon med cervical involvement. Subklassifiser: Myofascial/Disc/Artrose',
  '>=3/7 = TMJ dysfunksjon med cervical involvement',
  'Subklassifiser: Myofascial/Disc/Artrose',
  'SCORE', '0|1|2|3|4|5|6|7')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- KLUSTER - C1-C2 INSTABILITET
-- C1-C2 instability cluster assessment (RED FLAGS)
-- ============================================================================

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('cluster_instability_sharp_purser', 'Sharp-Purser Test', 'Sharp-Purser Test', 'KLUSTER - C1-C2 INSTABILITET', 'CERVICAL', 'MUSCULOSKELETAL',
  'Sharp-Purser test for atlantoaxial instabilitet (1/7)',
  'Clunk | Symptomreduksjon ved anterior glide | Hodet faller frem',
  'Atlantoaxial instabilitet',
  'SELECT_MULTIPLE', 'Negativ|Clunk|Symptomreduksjon ved anterior glide|Hodet faller frem')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('cluster_instability_alar_ligament', 'Alar Ligament Stress', 'Alar Ligament Stress', 'KLUSTER - C1-C2 INSTABILITET', 'CERVICAL', 'MUSCULOSKELETAL',
  'Alar ligament stress test (2/7)',
  'Okt bevegelse >45 grader | Ingen motstand | Bilateral laksitet',
  'Alar ligament insuffisiens',
  'SELECT_MULTIPLE', 'Negativ|Okt bevegelse >45 grader|Ingen motstand|Bilateral laksitet')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('cluster_instability_transverse_ligament', 'Transverse Ligament Test', 'Transverse Ligament Test', 'KLUSTER - C1-C2 INSTABILITET', 'CERVICAL', 'MUSCULOSKELETAL',
  'Transvers ligament test (3/7)',
  'Hodet ustabilt | Neurologiske symptomer ved anterior shear | Provoserer svimmelhet',
  'Transvers ligament insuffisiens',
  'SELECT_MULTIPLE', 'Negativ|Hodet ustabilt|Neurologiske symptomer ved anterior shear|Provoserer svimmelhet')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('cluster_instability_membrana_tectoria', 'Membrana Tectoria Test', 'Membrana Tectoria Test', 'KLUSTER - C1-C2 INSTABILITET', 'CERVICAL', 'MUSCULOSKELETAL',
  'Membrana tectoria test (4/7)',
  'Positiv ved fleksjon + aksial belastning | Neurologiske symptomer',
  'Membrana tectoria insuffisiens',
  'SELECT_MULTIPLE', 'Negativ|Positiv ved fleksjon + aksial belastning|Neurologiske symptomer')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('cluster_instability_cfrt', 'Cervical Flexion-Rotation', 'Cervical Flexion-Rotation', 'KLUSTER - C1-C2 INSTABILITET', 'CERVICAL', 'MUSCULOSKELETAL',
  'Cervical Flexion-Rotation test for instabilitet (5/7)',
  '<32 grader bilateral i fleksjon | Empty end-feel | Apprehension',
  'C1-C2 instabilitet',
  'SELECT_MULTIPLE', 'Negativ|<32 grader bilateral i fleksjon|Empty end-feel|Apprehension')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('cluster_instability_self_testing', 'Self Testing', 'Selftesting', 'KLUSTER - C1-C2 INSTABILITET', 'CERVICAL', 'MUSCULOSKELETAL',
  'Pasientens selvrapporterte instabilitet (6/7)',
  'Pasient holder hode med hender ved gange | Subjektiv ustabilitet | Frykt hodebevegelse',
  'Instabilitetfolelse',
  'SELECT_MULTIPLE', 'Negativ|Pasient holder hode med hender ved gange|Subjektiv ustabilitet|Frykt hodebevegelse')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('cluster_instability_neurological', 'Neurological Signs', 'Neurologiske tegn', 'KLUSTER - C1-C2 INSTABILITET', 'CERVICAL', 'NEUROLOGICAL',
  'Neurologiske tegn ved C1-C2 instabilitet (7/7)',
  'UMN signs (hyperrefleksi) | Lhermitte positiv | Hoffmann positiv | Babinski positiv',
  'Myelopatiske tegn',
  'SELECT_MULTIPLE', 'Negativ|UMN signs (hyperrefleksi)|Lhermitte positiv|Hoffmann positiv|Babinski positiv')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('cluster_instability_score', 'C1-C2 Instability Cluster Score', 'KLUSTER SCORE C1-C2 Instabilitet', 'KLUSTER - C1-C2 INSTABILITET', 'CERVICAL', 'MUSCULOSKELETAL',
  'Samlet kluster score for C1-C2 instabilitet. >=4/7 = HOY mistanke - MR fleksjon-ekstensjon, INGEN HVLA. RODE FLAGG: RA, Down, EDS, Trauma',
  '>=4/7 = HOY mistanke',
  'RODE FLAGG: RA, Down, EDS, Trauma',
  'SCORE', '0|1|2|3|4|5|6|7')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- KLUSTER - MYELOPATI
-- Myelopathy cluster assessment (CRITICAL - Immediate referral)
-- ============================================================================

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('cluster_myelopathy_hoffmann', 'Hoffmann Sign', 'Hoffmanns Sign', 'KLUSTER - MYELOPATI', 'UPPER_EXTREMITY', 'NEUROLOGICAL',
  'Hoffmanns tegn for kortikal disinhibisjon (1/6)',
  'Positiv hoyre/venstre/bilateral (fleksjon tommel/pekefinger ved flicking langfinger)',
  'Kortikal disinhibisjon, UMN',
  'SELECT_MULTIPLE', 'Negativ|Positiv hoyre|Positiv venstre|Positiv bilateral')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('cluster_myelopathy_hyperreflexia', 'Hyperreflexia', 'Hyperrefleksi', 'KLUSTER - MYELOPATI', 'FULL_BODY', 'NEUROLOGICAL',
  'Hyperrefleksi vurdering (2/6)',
  'Biceps/Triceps/Patella/Achilles 3+ | Klonus >=5 slag',
  'Ovre motorneuron lesjon',
  'SELECT_MULTIPLE', 'Normal|Biceps 3+|Triceps 3+|Patella 3+|Achilles 3+|Klonus >=5 slag')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('cluster_myelopathy_babinski', 'Babinski Sign', 'Babinski Sign', 'KLUSTER - MYELOPATI', 'LOWER_EXTREMITY', 'NEUROLOGICAL',
  'Babinski tegn (3/6)',
  'Ekstensor plantarrefleks hoyre/venstre (storta opp)',
  'Patologisk, UMN',
  'SELECT_MULTIPLE', 'Negativ|Positiv hoyre|Positiv venstre|Positiv bilateral')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('cluster_myelopathy_lhermitte', 'Lhermitte Sign', 'Lhermittes Sign', 'KLUSTER - MYELOPATI', 'CERVICAL', 'NEUROLOGICAL',
  'Lhermittes tegn (4/6)',
  'Elektrisk folelse ned ryggen ved nakke fleksjon | Til ekstremiteter',
  'Ryggmargskompresjon/demyelinisering',
  'SELECT_MULTIPLE', 'Negativ|Elektrisk folelse ned ryggen ved nakke fleksjon|Til ekstremiteter')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('cluster_myelopathy_gait', 'Gait and Coordination', 'Gange og koordinasjon', 'KLUSTER - MYELOPATI', 'FULL_BODY', 'NEUROLOGICAL',
  'Gange og koordinasjon vurdering (5/6)',
  'Ataktisk (bred base) | Spastisk (circumduction) | Fotsmell | Ikke tandem | Tap balanse',
  'Myelopatisk gange',
  'SELECT_MULTIPLE', 'Normal|Ataktisk (bred base)|Spastisk (circumduction)|Fotsmell|Ikke tandem|Tap balanse')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('cluster_myelopathy_hand_function', 'Hand Function Test', 'Hand funksjontest', 'KLUSTER - MYELOPATI', 'UPPER_EXTREMITY', 'NEUROLOGICAL',
  'Handfunksjon test (6/6)',
  'Ikke kneppe knapper | 10s grip-release <20 rep | Drop ting | Svakhet intrinsic bilateral',
  'Myelopati upper extremity',
  'SELECT_MULTIPLE', 'Normal|Ikke kneppe knapper|10s grip-release <20 rep|Drop ting|Svakhet intrinsic bilateral')
ON CONFLICT DO NOTHING;

INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_no, positive_finding_no, indicates_conditions, result_type, result_options) VALUES
('cluster_myelopathy_score', 'Myelopathy Cluster Score', 'KLUSTER SCORE Myelopati', 'KLUSTER - MYELOPATI', 'CERVICAL', 'NEUROLOGICAL',
  'Samlet kluster score for myelopati. >=3/6 = HOY mistanke - STOPP kiropraktisk, Akutt nevrolog, MR cervical. KRITISK: Henvis umiddelbart',
  '>=3/6 = HOY mistanke',
  'KRITISK: Henvis umiddelbart',
  'SCORE', '0|1|2|3|4|5|6')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- End of seed file
-- ============================================================================
