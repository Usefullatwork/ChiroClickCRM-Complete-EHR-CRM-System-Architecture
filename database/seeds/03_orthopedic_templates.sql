-- ============================================================================
-- ORTHOPEDIC SOAP TEMPLATES - SEED DATA
-- Comprehensive clinical documentation templates for chiropractic practice
-- ============================================================================

-- ============================================================================
-- PART 1: TEMPLATE CATEGORIES (Modules)
-- ============================================================================

-- ROOT CATEGORIES BY SOAP SECTION
INSERT INTO template_categories (code, name_en, name_no, soap_section, sort_order, icon, color) VALUES
('subjective_root', 'Subjective (Anamnese)', 'Subjektiv (Anamnese)', 'SUBJECTIVE', 1, 'MessageSquare', '#3b82f6'),
('objective_root', 'Objective (Undersøkelse)', 'Objektiv (Undersøkelse)', 'OBJECTIVE', 2, 'Stethoscope', '#10b981'),
('assessment_root', 'Assessment (Vurdering)', 'Vurdering (Assessment)', 'ASSESSMENT', 3, 'Brain', '#f59e0b'),
('plan_root', 'Plan (Behandling)', 'Plan (Behandling)', 'PLAN', 4, 'ClipboardList', '#8b5cf6');

-- SUBJECTIVE SUBCATEGORIES
INSERT INTO template_categories (code, name_en, name_no, parent_category_id, soap_section, sort_order)
SELECT 'subj_chief_complaint', 'Chief Complaint', 'Hovedklage', id, 'SUBJECTIVE', 1 FROM template_categories WHERE code = 'subjective_root'
UNION ALL
SELECT 'subj_pain_description', 'Pain Description', 'Smertebeskrivelse', id, 'SUBJECTIVE', 2 FROM template_categories WHERE code = 'subjective_root'
UNION ALL
SELECT 'subj_history', 'History', 'Historie', id, 'SUBJECTIVE', 3 FROM template_categories WHERE code = 'subjective_root'
UNION ALL
SELECT 'subj_lifestyle', 'Lifestyle & Activities', 'Livsstil & Aktiviteter', id, 'SUBJECTIVE', 4 FROM template_categories WHERE code = 'subjective_root';

-- OBJECTIVE CATEGORIES BY BODY REGION
INSERT INTO template_categories (code, name_en, name_no, parent_category_id, soap_section, body_region, sort_order, icon)
SELECT 'obj_general_vitals', 'General Observation & Vitals', 'Generell Observasjon & Vitale Tegn', id, 'OBJECTIVE', 'general', 1, 'Activity' FROM template_categories WHERE code = 'objective_root'
UNION ALL
SELECT 'obj_respiratory', 'Respiratory System', 'Respirasjonssystem', id, 'OBJECTIVE', 'thorax', 2, 'Wind' FROM template_categories WHERE code = 'objective_root'
UNION ALL
SELECT 'obj_cardiovascular', 'Cardiovascular System', 'Kardiovaskulært System', id, 'OBJECTIVE', 'cardiovascular', 3, 'Heart' FROM template_categories WHERE code = 'objective_root'
UNION ALL
SELECT 'obj_abdominal', 'Abdominal/GI Exam', 'Abdominal/GI Undersøkelse', id, 'OBJECTIVE', 'abdomen', 4, 'Scan' FROM template_categories WHERE code = 'objective_root'
UNION ALL
SELECT 'obj_neuro_cranial', 'Neurological - Cranial Nerves', 'Nevrologisk - Hjernernerver', id, 'OBJECTIVE', 'neurological', 5, 'Brain' FROM template_categories WHERE code = 'objective_root'
UNION ALL
SELECT 'obj_neuro_motor', 'Neurological - Motor & Reflexes', 'Nevrologisk - Motorikk & Reflekser', id, 'OBJECTIVE', 'neurological', 6, 'Zap' FROM template_categories WHERE code = 'objective_root'
UNION ALL
SELECT 'obj_cervical', 'Cervical Spine', 'Cervikalcolumna', id, 'OBJECTIVE', 'cervical', 7, 'Circle' FROM template_categories WHERE code = 'objective_root'
UNION ALL
SELECT 'obj_thoracic', 'Thoracic Spine', 'Thorakalcolumna', id, 'OBJECTIVE', 'thoracic', 8, 'Circle' FROM template_categories WHERE code = 'objective_root'
UNION ALL
SELECT 'obj_lumbar', 'Lumbar Spine & SIJ', 'Lumbalcolumna & SIL', id, 'OBJECTIVE', 'lumbar', 9, 'Circle' FROM template_categories WHERE code = 'objective_root'
UNION ALL
SELECT 'obj_shoulder', 'Shoulder', 'Skulder', id, 'OBJECTIVE', 'shoulder', 10, 'Disc' FROM template_categories WHERE code = 'objective_root'
UNION ALL
SELECT 'obj_elbow', 'Elbow, Wrist & Hand', 'Albue, Håndledd & Hånd', id, 'OBJECTIVE', 'upper_extremity', 11, 'Hand' FROM template_categories WHERE code = 'objective_root'
UNION ALL
SELECT 'obj_hip', 'Hip, Buttock & Groin', 'Hofte, Sete & Lyske', id, 'OBJECTIVE', 'hip', 12, 'Disc' FROM template_categories WHERE code = 'objective_root'
UNION ALL
SELECT 'obj_knee', 'Knee', 'Kne', id, 'OBJECTIVE', 'knee', 13, 'Circle' FROM template_categories WHERE code = 'objective_root'
UNION ALL
SELECT 'obj_ankle', 'Ankle & Foot', 'Ankel & Fot', id, 'OBJECTIVE', 'ankle', 14, 'Footprints' FROM template_categories WHERE code = 'objective_root';

-- ============================================================================
-- PART 2: CLINICAL TESTS LIBRARY
-- ============================================================================

-- CERVICAL SPINE TESTS
INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_en, description_no, positive_finding_en, positive_finding_no,
  indicates_conditions, result_type, result_options) VALUES

('spurling_test', 'Spurling''s Test', 'Spurlings Test', 'ORTHOPEDIC', 'cervical', 'musculoskeletal',
  'Cervical compression with lateral flexion and rotation',
  'Cervical kompresjon med sidebøy og rotasjon',
  'Radicular pain in ipsilateral upper extremity',
  'Radikulær smerte i ipsilateral overekstremitet',
  ARRAY['cervical radiculopathy', 'nerve root compression', 'foraminal stenosis'],
  'BINARY', '{"positive": "Positive", "negative": "Negative"}'::jsonb),

('cervical_distraction', 'Cervical Distraction Test', 'Cervical Distraksjonstest', 'ORTHOPEDIC', 'cervical', 'musculoskeletal',
  'Manual traction applied to cervical spine',
  'Manuell traksjon på cervicalcolumna',
  'Relief of radicular symptoms',
  'Lindring av radikulære symptomer',
  ARRAY['cervical radiculopathy', 'foraminal stenosis'],
  'BINARY', '{"positive": "Positive (symptoms relieved)", "negative": "Negative"}'::jsonb),

('doorbell_sign', 'Doorbell Sign', 'Doorbell Tegn', 'ORTHOPEDIC', 'cervical', 'musculoskeletal',
  'Direct pressure over brachial plexus/scalene muscles',
  'Direkte trykk over plexus brachialis/skalenmuskler',
  'Reproduction of arm symptoms',
  'Reproduksjon av arm-symptomer',
  ARRAY['thoracic outlet syndrome', 'brachial plexopathy'],
  'BINARY', '{"positive": "Positive", "negative": "Negative"}'::jsonb),

('lhermitte_sign', 'Lhermitte''s Sign', 'Lhermittes Tegn', 'NEUROLOGICAL', 'cervical', 'nervous',
  'Neck flexion producing electrical sensation down spine',
  'Nakkefleksjon gir elektrisk følelse ned ryggraden',
  'Electric shock sensation radiating down spine',
  'Elektrisk støt-følelse som stråler ned ryggraden',
  ARRAY['cervical myelopathy', 'multiple sclerosis', 'spinal cord compression'],
  'BINARY', '{"positive": "Positive", "negative": "Negative"}'::jsonb),

('roos_test', 'Roos Test (EAST)', 'Roos Test (EAST)', 'ORTHOPEDIC', 'cervical', 'vascular',
  'Elevated arm stress test - open/close hands for 3 minutes',
  'Elevated arm stress test - åpne/lukke hender i 3 minutter',
  'Inability to maintain position, heaviness, numbness, tingling',
  'Kan ikke opprettholde posisjon, tyngdefølelse, nummenhet, prikking',
  ARRAY['thoracic outlet syndrome', 'vascular TOS', 'neurogenic TOS'],
  'GRADED', '{"grades": ["Negative", "Mild (>2 min)", "Moderate (1-2 min)", "Severe (<1 min)"]}'::jsonb),

('adson_test', 'Adson''s Test', 'Adsons Test', 'VASCULAR', 'cervical', 'vascular',
  'Radial pulse palpation with neck extension/rotation and deep breath',
  'Radialis puls palpasjon med nakkeekstensjon/rotasjon og dypt åndedrag',
  'Diminished or absent radial pulse',
  'Redusert eller fraværende radialis puls',
  ARRAY['thoracic outlet syndrome', 'scalene hypertrophy'],
  'BINARY', '{"positive": "Pulse diminished", "negative": "Pulse unchanged"}'::jsonb);

-- LUMBAR SPINE & SIJ TESTS
INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_en, description_no, positive_finding_en, positive_finding_no,
  indicates_conditions, result_type, result_options, measurement_unit, normal_range) VALUES

('slr_test', 'Straight Leg Raise (SLR)', 'Straight Leg Raise (SLR)', 'NEUROLOGICAL', 'lumbar', 'nervous',
  'Passive straight leg raise with patient supine',
  'Passiv rett bein-løft med pasient i ryggleie',
  'Radicular pain below knee between 30-70 degrees',
  'Radikulær smerte under kne mellom 30-70 grader',
  ARRAY['lumbar disc herniation', 'sciatic nerve irritation', 'nerve root compression'],
  'MEASURED', '{"positive": "Positive", "negative": "Negative"}'::jsonb,
  'degrees', '{"normal": ">70", "positive_range": "30-70"}'::jsonb),

('slump_test', 'Slump Test', 'Slump Test', 'NEUROLOGICAL', 'lumbar', 'nervous',
  'Seated neural tension test with progressive loading',
  'Sittende neural spenningstest med progressiv belastning',
  'Radicular symptoms with neck flexion, relieved with cervical extension',
  'Radikulære symptomer ved nakkefleksjon, lindres ved cervical ekstensjon',
  ARRAY['neural tension', 'disc herniation', 'spinal stenosis'],
  'BINARY', '{"positive": "Positive", "negative": "Negative"}'::jsonb),

('gaenslen_test', 'Gaenslen''s Test', 'Gaenslens Test', 'ORTHOPEDIC', 'lumbar', 'musculoskeletal',
  'Patient side-lying, hyperextend bottom hip while flexing top hip',
  'Pasient i sideleie, hyperekstender nedre hofte mens øvre hofte flekteres',
  'Pain in SI joint region',
  'Smerte i SI-ledd området',
  ARRAY['sacroiliac joint dysfunction', 'SI joint inflammation'],
  'BINARY', '{"positive": "Positive", "negative": "Negative"}'::jsonb),

('faber_test', 'FABER Test (Patrick''s)', 'FABER Test (Patricks)', 'ORTHOPEDIC', 'lumbar', 'musculoskeletal',
  'Flexion, Abduction, External Rotation of hip',
  'Fleksjon, Abduksjon, Ekstern Rotasjon av hofte',
  'Groin pain (hip) or SI pain (SIJ)',
  'Lyskesmerte (hofte) eller SI-smerte (SIL)',
  ARRAY['hip pathology', 'sacroiliac joint dysfunction', 'iliopsoas pathology'],
  'BINARY', '{"positive": "Hip pain", "sacroiliac": "SI pain", "negative": "Negative"}'::jsonb),

('thigh_thrust', 'Thigh Thrust Test (P4)', 'Thigh Thrust Test (P4)', 'ORTHOPEDIC', 'lumbar', 'musculoskeletal',
  'Posterior shear force applied to SI joint with hip flexed 90 degrees',
  'Posterior skjærkraft påført SI-ledd med hofte flektert 90 grader',
  'Pain in SI joint region',
  'Smerte i SI-ledd området',
  ARRAY['sacroiliac joint dysfunction'],
  'BINARY', '{"positive": "Positive", "negative": "Negative"}'::jsonb),

('si_distraction', 'SI Distraction Test', 'SI Distraksjonstest', 'ORTHOPEDIC', 'lumbar', 'musculoskeletal',
  'Downward and outward pressure on ASIS',
  'Nedover og utover trykk på ASIS',
  'Pain in SI joint region',
  'Smerte i SI-ledd området',
  ARRAY['sacroiliac joint dysfunction', 'anterior SI ligament stress'],
  'BINARY', '{"positive": "Positive", "negative": "Negative"}'::jsonb),

('kemp_test', 'Kemp''s Test (Quadrant)', 'Kemps Test (Quadrant)', 'ORTHOPEDIC', 'lumbar', 'musculoskeletal',
  'Standing extension with lateral flexion and rotation',
  'Stående ekstensjon med sidebøy og rotasjon',
  'Localized back pain (facet) or radicular pain (nerve root)',
  'Lokalisert ryggsmerte (fasett) eller radikulær smerte (nerverot)',
  ARRAY['facet joint syndrome', 'lumbar radiculopathy', 'foraminal stenosis'],
  'BINARY', '{"localized": "Facet pain", "radicular": "Radicular pain", "negative": "Negative"}'::jsonb);

-- SHOULDER TESTS
INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_en, description_no, positive_finding_en, positive_finding_no,
  indicates_conditions, result_type, result_options) VALUES

('neer_test', 'Neer''s Impingement Test', 'Neers Impingement Test', 'ORTHOPEDIC', 'shoulder', 'musculoskeletal',
  'Passive shoulder flexion with internal rotation',
  'Passiv skulderfleksjon med intern rotasjon',
  'Pain with forced flexion past 90 degrees',
  'Smerte ved tvungen fleksjon over 90 grader',
  ARRAY['subacromial impingement', 'rotator cuff tendinopathy'],
  'BINARY', '{"positive": "Positive", "negative": "Negative"}'::jsonb),

('hawkins_kennedy', 'Hawkins-Kennedy Test', 'Hawkins-Kennedy Test', 'ORTHOPEDIC', 'shoulder', 'musculoskeletal',
  'Shoulder flexed 90°, then internally rotated',
  'Skulder flektert 90°, deretter internt rotert',
  'Pain with internal rotation',
  'Smerte ved intern rotasjon',
  ARRAY['subacromial impingement', 'rotator cuff pathology'],
  'BINARY', '{"positive": "Positive", "negative": "Negative"}'::jsonb),

('empty_can', 'Empty Can Test (Jobe''s)', 'Empty Can Test (Jobes)', 'ORTHOPEDIC', 'shoulder', 'musculoskeletal',
  'Resisted abduction at 90° with internal rotation',
  'Resistert abduksjon ved 90° med intern rotasjon',
  'Pain or weakness in supraspinatus',
  'Smerte eller svakhet i supraspinatus',
  ARRAY['supraspinatus tear', 'supraspinatus tendinopathy'],
  'GRADED', '{"grades": ["Strong", "Weak", "Painful", "Weak and painful"]}'::jsonb),

('drop_arm', 'Drop Arm Test', 'Drop Arm Test', 'ORTHOPEDIC', 'shoulder', 'musculoskeletal',
  'Patient lowers arm slowly from 90° abduction',
  'Pasient senker arm sakte fra 90° abduksjon',
  'Inability to lower arm smoothly or arm drops',
  'Ikke i stand til å senke arm jevnt eller arm faller',
  ARRAY['rotator cuff tear', 'large supraspinatus tear'],
  'BINARY', '{"positive": "Arm drops", "negative": "Smooth descent"}'::jsonb),

('apprehension_anterior', 'Anterior Apprehension Test', 'Anterior Apprehension Test', 'ORTHOPEDIC', 'shoulder', 'musculoskeletal',
  'Shoulder abducted 90° and externally rotated',
  'Skulder abdusert 90° og eksternt rotert',
  'Patient apprehension or feeling of instability',
  'Pasient engstelse eller følelse av ustabilitet',
  ARRAY['anterior shoulder instability', 'anterior labral tear'],
  'BINARY', '{"positive": "Apprehension present", "negative": "No apprehension"}'::jsonb),

('sulcus_sign', 'Sulcus Sign', 'Sulcus Sign', 'ORTHOPEDIC', 'shoulder', 'musculoskeletal',
  'Inferior traction applied to relaxed arm',
  'Inferior traksjon påført avslappet arm',
  'Visible sulcus (depression) below acromion',
  'Synlig sulcus (fordypning) under akromion',
  ARRAY['multidirectional shoulder instability', 'inferior capsular laxity'],
  'GRADED', '{"grades": ["<1cm (normal)", "1-2cm (mild)", ">2cm (severe)"]}'::jsonb),

('obrien_test', 'O''Brien''s Test (Active Compression)', 'O''Briens Test (Active Compression)', 'ORTHOPEDIC', 'shoulder', 'musculoskeletal',
  'Resisted forward flexion at 90° with internal rotation, then external rotation',
  'Resistert forward fleksjon ved 90° med intern rotasjon, deretter ekstern rotasjon',
  'Pain with IR that decreases with ER',
  'Smerte med IR som reduseres med ER',
  ARRAY['SLAP lesion', 'labral tear', 'AC joint pathology'],
  'BINARY', '{"labral": "Labral pathology", "ac_joint": "AC joint", "negative": "Negative"}'::jsonb);

-- KNEE TESTS
INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_en, description_no, positive_finding_en, positive_finding_no,
  indicates_conditions, result_type, result_options) VALUES

('lachman_test', 'Lachman''s Test', 'Lachmans Test', 'ORTHOPEDIC', 'knee', 'musculoskeletal',
  'Anterior translation of tibia on femur with knee flexed 20-30°',
  'Anterior translasjon av tibia på femur med kne flektert 20-30°',
  'Increased anterior translation and soft endpoint',
  'Økt anterior translasjon og mykt endepunkt',
  ARRAY['ACL tear', 'ACL rupture'],
  'GRADED', '{"grades": ["1+ (mild)", "2+ (moderate)", "3+ (severe)"]}'::jsonb),

('anterior_drawer_knee', 'Anterior Drawer Test (Knee)', 'Anterior Drawer Test (Kne)', 'ORTHOPEDIC', 'knee', 'musculoskeletal',
  'Anterior pull on tibia with knee flexed 90°',
  'Anterior trekk på tibia med kne flektert 90°',
  'Anterior translation of tibia',
  'Anterior translasjon av tibia',
  ARRAY['ACL tear'],
  'GRADED', '{"grades": ["1+ (mild)", "2+ (moderate)", "3+ (severe)"]}'::jsonb),

('mcmurray_test', 'McMurray''s Test', 'McMurrays Test', 'ORTHOPEDIC', 'knee', 'musculoskeletal',
  'Circumduction of tibia on femur with varus/valgus stress',
  'Sirkumduksjon av tibia på femur med varus/valgus stress',
  'Palpable or audible click with pain',
  'Palpabel eller hørbar klikk med smerte',
  ARRAY['meniscal tear', 'medial meniscus tear', 'lateral meniscus tear'],
  'BINARY', '{"medial": "Medial meniscus", "lateral": "Lateral meniscus", "negative": "Negative"}'::jsonb),

('valgus_stress_knee', 'Valgus Stress Test', 'Valgus Stress Test', 'ORTHOPEDIC', 'knee', 'musculoskeletal',
  'Medial stress applied to knee at 0° and 30° flexion',
  'Medial stress påført kne ved 0° og 30° fleksjon',
  'Medial joint line opening or pain',
  'Medial leddspalte åpning eller smerte',
  ARRAY['MCL sprain', 'MCL tear'],
  'GRADED', '{"grades": ["Grade 1 (mild)", "Grade 2 (moderate)", "Grade 3 (complete tear)"]}'::jsonb),

('varus_stress_knee', 'Varus Stress Test', 'Varus Stress Test', 'ORTHOPEDIC', 'knee', 'musculoskeletal',
  'Lateral stress applied to knee at 0° and 30° flexion',
  'Lateral stress påført kne ved 0° og 30° fleksjon',
  'Lateral joint line opening or pain',
  'Lateral leddspalte åpning eller smerte',
  ARRAY['LCL sprain', 'LCL tear'],
  'GRADED', '{"grades": ["Grade 1 (mild)", "Grade 2 (moderate)", "Grade 3 (complete tear)"]}'::jsonb);

-- ANKLE TESTS
INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_en, description_no, positive_finding_en, positive_finding_no,
  indicates_conditions, result_type, result_options) VALUES

('anterior_drawer_ankle', 'Anterior Drawer Test (Ankle)', 'Anterior Drawer Test (Ankel)', 'ORTHOPEDIC', 'ankle', 'musculoskeletal',
  'Anterior translation of talus in ankle mortise',
  'Anterior translasjon av talus i ankelmortise',
  'Increased anterior translation compared to opposite side',
  'Økt anterior translasjon sammenlignet med motsatt side',
  ARRAY['ATFL sprain', 'ATFL tear', 'lateral ankle instability'],
  'GRADED', '{"grades": ["Grade 1 (<5mm)", "Grade 2 (5-10mm)", "Grade 3 (>10mm)"]}'::jsonb),

('talar_tilt', 'Talar Tilt Test (Inversion Stress)', 'Talar Tilt Test (Inversion Stress)', 'ORTHOPEDIC', 'ankle', 'musculoskeletal',
  'Inversion stress applied to ankle in neutral position',
  'Inversion stress påført ankel i nøytral posisjon',
  'Increased talar tilt compared to opposite side',
  'Økt talar tilt sammenlignet med motsatt side',
  ARRAY['CFL tear', 'lateral ligament complex injury'],
  'GRADED', '{"grades": ["<5° difference", "5-10° difference", ">10° difference"]}'::jsonb),

('thompson_test', 'Thompson Test (Achilles)', 'Thompson Test (Achilles)', 'ORTHOPEDIC', 'ankle', 'musculoskeletal',
  'Squeeze calf muscle with patient prone',
  'Klem leggmuskel med pasient i mageleie',
  'Absence of plantar flexion',
  'Fravær av plantarfleksjon',
  ARRAY['Achilles tendon rupture'],
  'BINARY', '{"positive": "No plantar flexion (rupture)", "negative": "Plantar flexion present"}'::jsonb),

('windlass_test', 'Windlass Test', 'Windlass Test', 'ORTHOPEDIC', 'ankle', 'musculoskeletal',
  'Passive dorsiflexion of first MTP joint',
  'Passiv dorsifleksjon av første MTP-ledd',
  'Pain in plantar fascia',
  'Smerte i plantar fascia',
  ARRAY['plantar fasciitis', 'plantar fascia tear'],
  'BINARY', '{"positive": "Positive", "negative": "Negative"}'::jsonb);

-- NEUROLOGICAL TESTS (Cranial Nerves)
INSERT INTO clinical_tests_library (code, test_name_en, test_name_no, test_category, body_region, system,
  description_en, description_no, result_type, result_options) VALUES

('pupillary_light_reflex', 'Pupillary Light Reflex', 'Pupill Lysrefleks', 'NEUROLOGICAL', 'cranial', 'nervous',
  'Direct and consensual pupillary response to light (CN II, III)',
  'Direkte og konsensuell pupill respons på lys (CN II, III)',
  'BINARY', '{"normal": "Normal bilateralt", "abnormal": "Unormal"}'::jsonb),

('visual_field_confrontation', 'Visual Field (Confrontation)', 'Synsfelt (Konfrontasjon)', 'NEUROLOGICAL', 'cranial', 'nervous',
  'Peripheral vision testing by confrontation (CN II)',
  'Perifer syn testing ved konfrontasjon (CN II)',
  'BINARY', '{"normal": "Intakt", "deficit": "Defekt funnet"}'::jsonb),

('eom_h_pattern', 'Extraocular Movements (H-pattern)', 'Ekstraokulære Bevegelser (H-mønster)', 'NEUROLOGICAL', 'cranial', 'nervous',
  'Test of eye movements in all directions (CN III, IV, VI)',
  'Test av øyebevegelser i alle retninger (CN III, IV, VI)',
  'BINARY', '{"normal": "Normal", "abnormal": "Pareser/Nystagmus"}'::jsonb),

('facial_nerve_strength', 'Facial Nerve Motor Test', 'Ansiktsnerve Motorisk Test', 'NEUROLOGICAL', 'cranial', 'nervous',
  'Facial expression testing (CN VII)',
  'Ansiktsuttrykk testing (CN VII)',
  'GRADED', '{"grades": ["Normal", "Mild weakness", "Moderate weakness", "Severe weakness"]}'::jsonb),

('weber_test', 'Weber Test', 'Weber Test', 'NEUROLOGICAL', 'cranial', 'nervous',
  'Tuning fork on forehead to assess hearing lateralization (CN VIII)',
  'Stemmegaffel på panne for å vurdere hørsel lateralisering (CN VIII)',
  'BINARY', '{"normal": "Ingen lateralisering", "conductive": "Lateraliserer til dårligere øre", "sensorineural": "Lateraliserer til bedre øre"}'::jsonb),

('rinne_test', 'Rinne Test', 'Rinne Test', 'NEUROLOGICAL', 'cranial', 'nervous',
  'Air conduction vs bone conduction hearing test (CN VIII)',
  'Luft-ledning vs ben-ledning hørseltest (CN VIII)',
  'BINARY', '{"normal": "AC > BC", "abnormal": "BC > AC"}'::jsonb),

('gag_reflex', 'Gag Reflex', 'Brekningsrefleks', 'NEUROLOGICAL', 'cranial', 'nervous',
  'Soft palate stimulation (CN IX, X)',
  'Myk gane stimulering (CN IX, X)',
  'BINARY', '{"normal": "Intakt", "absent": "Fraværende"}'::jsonb),

('tongue_protrusion', 'Tongue Protrusion (CN XII)', 'Tunge Utstikking (CN XII)', 'NEUROLOGICAL', 'cranial', 'nervous',
  'Midline tongue protrusion test (CN XII)',
  'Midtlinje tunge utstikking test (CN XII)',
  'BINARY', '{"normal": "Rett frem", "deviation": "Deviasjon til {{side}}"}'::jsonb);

-- Continue in next part...
