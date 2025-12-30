-- ============================================================================
-- Examination Template Sets Seed Data
-- Pre-configured examination bundles for common chief complaints
-- ============================================================================

-- Lower Back Pain Examination Bundle
INSERT INTO examination_template_sets (
  set_name, set_name_no, chief_complaint, description_no, language, is_system, display_order
) VALUES (
  'Lower Back Pain Examination',
  'Korsryggsmerter undersøkelse',
  'Lower back pain',
  'Komplett undersøkelse for korsryggsmerter inkludert ortopediske tester, nevrologisk screening og red flags',
  'NO',
  true,
  1
);

-- Get the set_id for lower back pain
DO $$
DECLARE
  lbp_set_id UUID;
  protocol_id UUID;
BEGIN
  SELECT id INTO lbp_set_id FROM examination_template_sets WHERE set_name_no = 'Korsryggsmerter undersøkelse';

  -- Add protocols to the set
  -- Lumbar ROM
  SELECT id INTO protocol_id FROM examination_protocols WHERE test_name = 'Lumbar Flexion' LIMIT 1;
  IF protocol_id IS NOT NULL THEN
    INSERT INTO examination_template_set_protocols (set_id, protocol_id, display_order) VALUES (lbp_set_id, protocol_id, 1);
  END IF;

  -- SLR
  SELECT id INTO protocol_id FROM examination_protocols WHERE test_name = 'Straight Leg Raise (SLR)' LIMIT 1;
  IF protocol_id IS NOT NULL THEN
    INSERT INTO examination_template_set_protocols (set_id, protocol_id, display_order) VALUES (lbp_set_id, protocol_id, 2);
  END IF;

  -- Kemp's Test
  SELECT id INTO protocol_id FROM examination_protocols WHERE test_name = 'Kemp´s Test' LIMIT 1;
  IF protocol_id IS NOT NULL THEN
    INSERT INTO examination_template_set_protocols (set_id, protocol_id, display_order) VALUES (lbp_set_id, protocol_id, 3);
  END IF;

  -- Sacroiliac Joint Tests
  SELECT id INTO protocol_id FROM examination_protocols WHERE test_name = 'Gaenslen Test' LIMIT 1;
  IF protocol_id IS NOT NULL THEN
    INSERT INTO examination_template_set_protocols (set_id, protocol_id, display_order) VALUES (lbp_set_id, protocol_id, 4);
  END IF;

  -- Neurological: Reflexes L4-S1
  SELECT id INTO protocol_id FROM examination_protocols WHERE test_name = 'Patellar Reflex (L4)' LIMIT 1;
  IF protocol_id IS NOT NULL THEN
    INSERT INTO examination_template_set_protocols (set_id, protocol_id, display_order) VALUES (lbp_set_id, protocol_id, 5);
  END IF;

  SELECT id INTO protocol_id FROM examination_protocols WHERE test_name = 'Achilles Reflex (S1)' LIMIT 1;
  IF protocol_id IS NOT NULL THEN
    INSERT INTO examination_template_set_protocols (set_id, protocol_id, display_order) VALUES (lbp_set_id, protocol_id, 6);
  END IF;

  -- Red Flag: AAA
  SELECT id INTO protocol_id FROM examination_protocols WHERE test_name = 'Abdominal Aorta Palpation' LIMIT 1;
  IF protocol_id IS NOT NULL THEN
    INSERT INTO examination_template_set_protocols (set_id, protocol_id, display_order) VALUES (lbp_set_id, protocol_id, 7);
  END IF;
END $$;

-- Neck Pain Examination Bundle
INSERT INTO examination_template_sets (
  set_name, set_name_no, chief_complaint, description_no, language, is_system, display_order
) VALUES (
  'Neck Pain Examination',
  'Nakkesmerter undersøkelse',
  'Neck pain',
  'Komplett undersøkelse for nakkesmerter inkludert cervikal ROM, spesialtester og nevrologisk screening',
  'NO',
  true,
  2
);

DO $$
DECLARE
  neck_set_id UUID;
  protocol_id UUID;
BEGIN
  SELECT id INTO neck_set_id FROM examination_template_sets WHERE set_name_no = 'Nakkesmerter undersøkelse';

  -- Spurling Test
  SELECT id INTO protocol_id FROM examination_protocols WHERE test_name = 'Spurling Test' LIMIT 1;
  IF protocol_id IS NOT NULL THEN
    INSERT INTO examination_template_set_protocols (set_id, protocol_id, display_order) VALUES (neck_set_id, protocol_id, 1);
  END IF;

  -- Cervical ROM
  SELECT id INTO protocol_id FROM examination_protocols WHERE test_name = 'Cervical Flexion' LIMIT 1;
  IF protocol_id IS NOT NULL THEN
    INSERT INTO examination_template_set_protocols (set_id, protocol_id, display_order) VALUES (neck_set_id, protocol_id, 2);
  END IF;

  -- Distraction Test
  SELECT id INTO protocol_id FROM examination_protocols WHERE test_name = 'Cervical Distraction Test' LIMIT 1;
  IF protocol_id IS NOT NULL THEN
    INSERT INTO examination_template_set_protocols (set_id, protocol_id, display_order) VALUES (neck_set_id, protocol_id, 3);
  END IF;

  -- Upper Limb Tension Test
  SELECT id INTO protocol_id FROM examination_protocols WHERE test_name = 'Upper Limb Tension Test (ULTT)' LIMIT 1;
  IF protocol_id IS NOT NULL THEN
    INSERT INTO examination_template_set_protocols (set_id, protocol_id, display_order) VALUES (neck_set_id, protocol_id, 4);
  END IF;

  -- Reflexes C5-C7
  SELECT id INTO protocol_id FROM examination_protocols WHERE test_name = 'Biceps Reflex (C5-C6)' LIMIT 1;
  IF protocol_id IS NOT NULL THEN
    INSERT INTO examination_template_set_protocols (set_id, protocol_id, display_order) VALUES (neck_set_id, protocol_id, 5);
  END IF;

  SELECT id INTO protocol_id FROM examination_protocols WHERE test_name = 'Triceps Reflex (C7)' LIMIT 1;
  IF protocol_id IS NOT NULL THEN
    INSERT INTO examination_template_set_protocols (set_id, protocol_id, display_order) VALUES (neck_set_id, protocol_id, 6);
  END IF;
END $$;

-- Shoulder Pain Examination Bundle
INSERT INTO examination_template_sets (
  set_name, set_name_no, chief_complaint, description_no, language, is_system, display_order
) VALUES (
  'Shoulder Pain Examination',
  'Skuldersmerter undersøkelse',
  'Shoulder pain',
  'Komplett skulderundersøkelse inkludert rotator cuff, impingement og instabilitetstester',
  'NO',
  true,
  3
);

DO $$
DECLARE
  shoulder_set_id UUID;
  protocol_id UUID;
BEGIN
  SELECT id INTO shoulder_set_id FROM examination_template_sets WHERE set_name_no = 'Skuldersmerter undersøkelse';

  -- Empty Can Test
  SELECT id INTO protocol_id FROM examination_protocols WHERE test_name = 'Empty Can Test (Jobe)' LIMIT 1;
  IF protocol_id IS NOT NULL THEN
    INSERT INTO examination_template_set_protocols (set_id, protocol_id, display_order) VALUES (shoulder_set_id, protocol_id, 1);
  END IF;

  -- Neer Impingement
  SELECT id INTO protocol_id FROM examination_protocols WHERE test_name = 'Neer Impingement Test' LIMIT 1;
  IF protocol_id IS NOT NULL THEN
    INSERT INTO examination_template_set_protocols (set_id, protocol_id, display_order) VALUES (shoulder_set_id, protocol_id, 2);
  END IF;

  -- Hawkins-Kennedy
  SELECT id INTO protocol_id FROM examination_protocols WHERE test_name = 'Hawkins-Kennedy Test' LIMIT 1;
  IF protocol_id IS NOT NULL THEN
    INSERT INTO examination_template_set_protocols (set_id, protocol_id, display_order) VALUES (shoulder_set_id, protocol_id, 3);
  END IF;

  -- Apprehension Test
  SELECT id INTO protocol_id FROM examination_protocols WHERE test_name = 'Apprehension Test' LIMIT 1;
  IF protocol_id IS NOT NULL THEN
    INSERT INTO examination_template_set_protocols (set_id, protocol_id, display_order) VALUES (shoulder_set_id, protocol_id, 4);
  END IF;

  -- Drop Arm Test
  SELECT id INTO protocol_id FROM examination_protocols WHERE test_name = 'Drop Arm Test' LIMIT 1;
  IF protocol_id IS NOT NULL THEN
    INSERT INTO examination_template_set_protocols (set_id, protocol_id, display_order) VALUES (shoulder_set_id, protocol_id, 5);
  END IF;
END $$;

-- Knee Pain Examination Bundle
INSERT INTO examination_template_sets (
  set_name, set_name_no, chief_complaint, description_no, language, is_system, display_order
) VALUES (
  'Knee Pain Examination',
  'Knesmerter undersøkelse',
  'Knee pain',
  'Komplett kneundersøkelse inkludert ligament-, menisk- og patellofemoral tester',
  'NO',
  true,
  4
);

DO $$
DECLARE
  knee_set_id UUID;
  protocol_id UUID;
BEGIN
  SELECT id INTO knee_set_id FROM examination_template_sets WHERE set_name_no = 'Knesmerter undersøkelse';

  -- Anterior Drawer
  SELECT id INTO protocol_id FROM examination_protocols WHERE test_name = 'Anterior Drawer Test (Knee)' LIMIT 1;
  IF protocol_id IS NOT NULL THEN
    INSERT INTO examination_template_set_protocols (set_id, protocol_id, display_order) VALUES (knee_set_id, protocol_id, 1);
  END IF;

  -- Lachman
  SELECT id INTO protocol_id FROM examination_protocols WHERE test_name = 'Lachman Test' LIMIT 1;
  IF protocol_id IS NOT NULL THEN
    INSERT INTO examination_template_set_protocols (set_id, protocol_id, display_order) VALUES (knee_set_id, protocol_id, 2);
  END IF;

  -- McMurray
  SELECT id INTO protocol_id FROM examination_protocols WHERE test_name = 'McMurray Test' LIMIT 1;
  IF protocol_id IS NOT NULL THEN
    INSERT INTO examination_template_set_protocols (set_id, protocol_id, display_order) VALUES (knee_set_id, protocol_id, 3);
  END IF;

  -- Valgus Stress
  SELECT id INTO protocol_id FROM examination_protocols WHERE test_name = 'Valgus Stress Test' LIMIT 1;
  IF protocol_id IS NOT NULL THEN
    INSERT INTO examination_template_set_protocols (set_id, protocol_id, display_order) VALUES (knee_set_id, protocol_id, 4);
  END IF;

  -- Varus Stress
  SELECT id INTO protocol_id FROM examination_protocols WHERE test_name = 'Varus Stress Test' LIMIT 1;
  IF protocol_id IS NOT NULL THEN
    INSERT INTO examination_template_set_protocols (set_id, protocol_id, display_order) VALUES (knee_set_id, protocol_id, 5);
  END IF;

  -- Patellar Apprehension
  SELECT id INTO protocol_id FROM examination_protocols WHERE test_name = 'Patellar Apprehension Test' LIMIT 1;
  IF protocol_id IS NOT NULL THEN
    INSERT INTO examination_template_set_protocols (set_id, protocol_id, display_order) VALUES (knee_set_id, protocol_id, 6);
  END IF;
END $$;

-- Headache Examination Bundle
INSERT INTO examination_template_sets (
  set_name, set_name_no, chief_complaint, description_no, language, is_system, display_order
) VALUES (
  'Headache Examination',
  'Hodepine undersøkelse',
  'Headache',
  'Komplett hodepineundersøkelse inkludert red flags, cervikal undersøkelse og kranialnerve screening',
  'NO',
  true,
  5
);

DO $$
DECLARE
  headache_set_id UUID;
  protocol_id UUID;
BEGIN
  SELECT id INTO headache_set_id FROM examination_template_sets WHERE set_name_no = 'Hodepine undersøkelse';

  -- Temporal Artery Palpation
  SELECT id INTO protocol_id FROM examination_protocols WHERE test_name LIKE '%Temporal Artery%' LIMIT 1;
  IF protocol_id IS NOT NULL THEN
    INSERT INTO examination_template_set_protocols (set_id, protocol_id, display_order) VALUES (headache_set_id, protocol_id, 1);
  END IF;

  -- Neck Stiffness
  SELECT id INTO protocol_id FROM examination_protocols WHERE test_name LIKE '%Neck Stiffness%' OR test_name LIKE '%Nakke stivhet%' LIMIT 1;
  IF protocol_id IS NOT NULL THEN
    INSERT INTO examination_template_set_protocols (set_id, protocol_id, display_order) VALUES (headache_set_id, protocol_id, 2);
  END IF;

  -- Visual Acuity
  SELECT id INTO protocol_id FROM examination_protocols WHERE test_name LIKE '%Visual Acuity%' LIMIT 1;
  IF protocol_id IS NOT NULL THEN
    INSERT INTO examination_template_set_protocols (set_id, protocol_id, display_order) VALUES (headache_set_id, protocol_id, 3);
  END IF;

  -- Pupil Response
  SELECT id INTO protocol_id FROM examination_protocols WHERE test_name LIKE '%Pupil%' LIMIT 1;
  IF protocol_id IS NOT NULL THEN
    INSERT INTO examination_template_set_protocols (set_id, protocol_id, display_order) VALUES (headache_set_id, protocol_id, 4);
  END IF;

  -- Spurling for cervicogenic
  SELECT id INTO protocol_id FROM examination_protocols WHERE test_name = 'Spurling Test' LIMIT 1;
  IF protocol_id IS NOT NULL THEN
    INSERT INTO examination_template_set_protocols (set_id, protocol_id, display_order) VALUES (headache_set_id, protocol_id, 5);
  END IF;
END $$;

-- Ankle Sprain Examination Bundle
INSERT INTO examination_template_sets (
  set_name, set_name_no, chief_complaint, description_no, language, is_system, display_order
) VALUES (
  'Ankle Injury Examination',
  'Ankelskade undersøkelse',
  'Ankle injury',
  'Komplett ankelundersøkelse inkludert Ottawa regler, ligament tester og fraktur screening',
  'NO',
  true,
  6
);

DO $$
DECLARE
  ankle_set_id UUID;
  protocol_id UUID;
BEGIN
  SELECT id INTO ankle_set_id FROM examination_template_sets WHERE set_name_no = 'Ankelskade undersøkelse';

  -- Ottawa Ankle Rules
  SELECT id INTO protocol_id FROM examination_protocols WHERE test_name LIKE '%Ottawa Ankle%' LIMIT 1;
  IF protocol_id IS NOT NULL THEN
    INSERT INTO examination_template_set_protocols (set_id, protocol_id, display_order) VALUES (ankle_set_id, protocol_id, 1);
  END IF;

  -- Anterior Drawer Ankle
  SELECT id INTO protocol_id FROM examination_protocols WHERE test_name = 'Anterior Drawer Test (Ankle)' LIMIT 1;
  IF protocol_id IS NOT NULL THEN
    INSERT INTO examination_template_set_protocols (set_id, protocol_id, display_order) VALUES (ankle_set_id, protocol_id, 2);
  END IF;

  -- Talar Tilt
  SELECT id INTO protocol_id FROM examination_protocols WHERE test_name = 'Talar Tilt Test (Inversion)' LIMIT 1;
  IF protocol_id IS NOT NULL THEN
    INSERT INTO examination_template_set_protocols (set_id, protocol_id, display_order) VALUES (ankle_set_id, protocol_id, 3);
  END IF;

  -- Squeeze Test
  SELECT id INTO protocol_id FROM examination_protocols WHERE test_name = 'Squeeze Test (Syndesmosis)' LIMIT 1;
  IF protocol_id IS NOT NULL THEN
    INSERT INTO examination_template_set_protocols (set_id, protocol_id, display_order) VALUES (ankle_set_id, protocol_id, 4);
  END IF;
END $$;

-- Neurological Screening Bundle
INSERT INTO examination_template_sets (
  set_name, set_name_no, chief_complaint, description_no, language, is_system, display_order
) VALUES (
  'Neurological Screening',
  'Nevrologisk screening',
  'Neurological symptoms',
  'Basis nevrologisk undersøkelse: reflekser, sensibilitet, muskelkraft og koordinasjon',
  'NO',
  true,
  7
);

DO $$
DECLARE
  neuro_set_id UUID;
  protocol_id UUID;
BEGIN
  SELECT id INTO neuro_set_id FROM examination_template_sets WHERE set_name_no = 'Nevrologisk screening';

  -- Upper Limb Reflexes
  SELECT id INTO protocol_id FROM examination_protocols WHERE test_name = 'Biceps Reflex (C5-C6)' LIMIT 1;
  IF protocol_id IS NOT NULL THEN
    INSERT INTO examination_template_set_protocols (set_id, protocol_id, display_order) VALUES (neuro_set_id, protocol_id, 1);
  END IF;

  SELECT id INTO protocol_id FROM examination_protocols WHERE test_name = 'Triceps Reflex (C7)' LIMIT 1;
  IF protocol_id IS NOT NULL THEN
    INSERT INTO examination_template_set_protocols (set_id, protocol_id, display_order) VALUES (neuro_set_id, protocol_id, 2);
  END IF;

  -- Lower Limb Reflexes
  SELECT id INTO protocol_id FROM examination_protocols WHERE test_name = 'Patellar Reflex (L4)' LIMIT 1;
  IF protocol_id IS NOT NULL THEN
    INSERT INTO examination_template_set_protocols (set_id, protocol_id, display_order) VALUES (neuro_set_id, protocol_id, 3);
  END IF;

  SELECT id INTO protocol_id FROM examination_protocols WHERE test_name = 'Achilles Reflex (S1)' LIMIT 1;
  IF protocol_id IS NOT NULL THEN
    INSERT INTO examination_template_set_protocols (set_id, protocol_id, display_order) VALUES (neuro_set_id, protocol_id, 4);
  END IF;

  -- Sensory Testing
  SELECT id INTO protocol_id FROM examination_protocols WHERE test_name LIKE '%Pin Prick%' OR test_name LIKE '%Nålestikk%' LIMIT 1;
  IF protocol_id IS NOT NULL THEN
    INSERT INTO examination_template_set_protocols (set_id, protocol_id, display_order) VALUES (neuro_set_id, protocol_id, 5);
  END IF;

  -- Motor Testing
  SELECT id INTO protocol_id FROM examination_protocols WHERE test_name LIKE '%Muscle Strength%' LIMIT 1;
  IF protocol_id IS NOT NULL THEN
    INSERT INTO examination_template_set_protocols (set_id, protocol_id, display_order) VALUES (neuro_set_id, protocol_id, 6);
  END IF;

  -- Coordination
  SELECT id INTO protocol_id FROM examination_protocols WHERE test_name LIKE '%Finger-Nose%' OR test_name LIKE '%Finger-nese%' LIMIT 1;
  IF protocol_id IS NOT NULL THEN
    INSERT INTO examination_template_set_protocols (set_id, protocol_id, display_order) VALUES (neuro_set_id, protocol_id, 7);
  END IF;
END $$;

-- Hip Pain Examination Bundle
INSERT INTO examination_template_sets (
  set_name, set_name_no, chief_complaint, description_no, language, is_system, display_order
) VALUES (
  'Hip Pain Examination',
  'Hoftesmerter undersøkelse',
  'Hip pain',
  'Komplett hofteundersøkelse inkludert FAI, labral tears og bursitt tester',
  'NO',
  true,
  8
);

DO $$
DECLARE
  hip_set_id UUID;
  protocol_id UUID;
BEGIN
  SELECT id INTO hip_set_id FROM examination_template_sets WHERE set_name_no = 'Hoftesmerter undersøkelse';

  -- FABER
  SELECT id INTO protocol_id FROM examination_protocols WHERE test_name = 'FABER Test (Patrick)' LIMIT 1;
  IF protocol_id IS NOT NULL THEN
    INSERT INTO examination_template_set_protocols (set_id, protocol_id, display_order) VALUES (hip_set_id, protocol_id, 1);
  END IF;

  -- FADIR
  SELECT id INTO protocol_id FROM examination_protocols WHERE test_name = 'FADIR Test' LIMIT 1;
  IF protocol_id IS NOT NULL THEN
    INSERT INTO examination_template_set_protocols (set_id, protocol_id, display_order) VALUES (hip_set_id, protocol_id, 2);
  END IF;

  -- Trendelenburg
  SELECT id INTO protocol_id FROM examination_protocols WHERE test_name = 'Trendelenburg Test' LIMIT 1;
  IF protocol_id IS NOT NULL THEN
    INSERT INTO examination_template_set_protocols (set_id, protocol_id, display_order) VALUES (hip_set_id, protocol_id, 3);
  END IF;

  -- Thomas Test
  SELECT id INTO protocol_id FROM examination_protocols WHERE test_name = 'Thomas Test' LIMIT 1;
  IF protocol_id IS NOT NULL THEN
    INSERT INTO examination_template_set_protocols (set_id, protocol_id, display_order) VALUES (hip_set_id, protocol_id, 4);
  END IF;
END $$;
