-- ============================================================================
-- CLINICAL TEMPLATES & PHRASES FOR SOAP DOCUMENTATION
-- Comprehensive phrase library for orthopedic and chiropractic documentation
-- ============================================================================

-- ============================================================================
-- SUBJECTIVE TEMPLATES (ANAMNESE)
-- ============================================================================

-- Chief Complaints
INSERT INTO clinical_templates (code, name_en, name_no, category_id, template_type, soap_section,
  content_en, content_no, template_data, keywords, sort_order)
SELECT
  'subj_cc_neck_pain', 'Neck Pain Presentation', 'Nakkesmerte Presentasjon', id, 'TEXT_SNIPPET', 'SUBJECTIVE',
  'Patient presents with {{severity}} {{side}} neck pain that started {{onset}} and has lasted {{duration}}.',
  'Pasienten presenterer seg med {{severity}} {{side}} nakkesmerter som startet {{onset}} og har vart {{duration}}.',
  '{"variables": [
    {"name": "severity", "type": "select", "options": ["mild", "moderate", "severe", "intense"]},
    {"name": "side", "type": "select", "options": ["left", "right", "bilateral", "central"]},
    {"name": "onset", "type": "text", "placeholder": "gradvis/plutselig"},
    {"name": "duration", "type": "text", "placeholder": "2 dager/1 uke/1 måned"}
  ]}'::jsonb,
  ARRAY['neck', 'pain', 'cervical', 'chief complaint'],
  1
FROM template_categories WHERE code = 'subj_chief_complaint';

INSERT INTO clinical_templates (code, name_en, name_no, category_id, template_type, soap_section,
  content_en, content_no, template_data, keywords, sort_order)
SELECT
  'subj_cc_low_back_pain', 'Low Back Pain Presentation', 'Korsryggsmerte Presentasjon', id, 'TEXT_SNIPPET', 'SUBJECTIVE',
  'Patient reports {{severity}} low back pain localized to {{location}} that started {{onset}} and has lasted {{duration}}.',
  'Pasienten rapporterer {{severity}} korsryggsmerte lokalisert til {{location}} som startet {{onset}} og har vart {{duration}}.',
  '{"variables": [
    {"name": "severity", "type": "select", "options": ["mild", "moderate", "severe", "constant and severe"]},
    {"name": "location", "type": "select", "options": ["lower lumbar region", "belt-like distribution", "unilateral left", "unilateral right"]},
    {"name": "onset", "type": "text"},
    {"name": "duration", "type": "text"}
  ]}'::jsonb,
  ARRAY['low back', 'lumbar', 'pain', 'lumbago'],
  2
FROM template_categories WHERE code = 'subj_chief_complaint';

INSERT INTO clinical_templates (code, name_en, name_no, category_id, template_type, soap_section,
  content_en, content_no, template_data, keywords, sort_order)
SELECT
  'subj_cc_shoulder_pain', 'Shoulder Pain Presentation', 'Skuldersm

erte Presentasjon', id, 'TEXT_SNIPPET', 'SUBJECTIVE',
  'Patient complains of {{side}} shoulder pain that {{onset}}. Pain is {{severity}} and {{radiation}}.',
  'Pasienten klager over {{side}} skuldersmerte som {{onset}}. Smerten er {{severity}} og {{radiation}}.',
  '{"variables": [
    {"name": "side", "type": "select", "options": ["left", "right", "bilateral"]},
    {"name": "onset", "type": "text"},
    {"name": "severity", "type": "select", "options": ["mild", "moderate", "severe"]},
    {"name": "radiation", "type": "select", "options": ["does not radiate", "radiates to upper arm", "radiates to neck", "radiates down to elbow"]}
  ]}'::jsonb,
  ARRAY['shoulder', 'pain', 'upper extremity'],
  3
FROM template_categories WHERE code = 'subj_chief_complaint';

-- Pain Description Templates
INSERT INTO clinical_templates (code, name_en, name_no, category_id, template_type, soap_section,
  content_en, content_no, template_data, keywords, sort_order)
SELECT
  'subj_pain_aggravating', 'Aggravating Factors', 'Forverrende Faktorer', id, 'CHECKBOX_LIST', 'SUBJECTIVE',
  'Symptoms are aggravated by: {{factors}}',
  'Symptomene forverres av: {{factors}}',
  '{"options": [
    {"value": "sitting_prolonged", "label_en": "prolonged sitting", "label_no": "langvarig sitting"},
    {"value": "standing", "label_en": "prolonged standing", "label_no": "langvarig stående"},
    {"value": "bending_forward", "label_en": "bending forward", "label_no": "fremover bøyning"},
    {"value": "lifting", "label_en": "lifting heavy objects", "label_no": "løfting av tunge gjenstander"},
    {"value": "turning_head", "label_en": "turning head", "label_no": "vending av hodet"},
    {"value": "overhead_activities", "label_en": "overhead activities", "label_no": "aktiviteter over hodet"},
    {"value": "walking", "label_en": "walking", "label_no": "gåing"},
    {"value": "stairs", "label_en": "stairs/steps", "label_no": "trapper"},
    {"value": "morning", "label_en": "morning stiffness", "label_no": "morgenstivhet"},
    {"value": "coughing_sneezing", "label_en": "coughing/sneezing", "label_no": "hoste/nysing"}
  ]}'::jsonb,
  ARRAY['aggravating', 'pain', 'symptoms'],
  1
FROM template_categories WHERE code = 'subj_pain_description';

INSERT INTO clinical_templates (code, name_en, name_no, category_id, template_type, soap_section,
  content_en, content_no, template_data, keywords, sort_order)
SELECT
  'subj_pain_relieving', 'Relieving Factors', 'Lindrende Faktorer', id, 'CHECKBOX_LIST', 'SUBJECTIVE',
  'Symptoms are relieved by: {{factors}}',
  'Symptomene lindres av: {{factors}}',
  '{"options": [
    {"value": "rest", "label_en": "rest", "label_no": "hvile"},
    {"value": "lying_down", "label_en": "lying down", "label_no": "å ligge ned"},
    {"value": "walking", "label_en": "walking", "label_no": "gåing"},
    {"value": "stretching", "label_en": "stretching", "label_no": "tøying"},
    {"value": "heat", "label_en": "heat application", "label_no": "varmeapplikasjon"},
    {"value": "ice", "label_en": "ice application", "label_no": "isapplikasjon"},
    {"value": "medication", "label_en": "medication", "label_no": "medikasjon"},
    {"value": "position_change", "label_en": "changing positions", "label_no": "endring av stillinger"},
    {"value": "massage", "label_en": "massage", "label_no": "massasje"}
  ]}'::jsonb,
  ARRAY['relieving', 'pain', 'symptoms'],
  2
FROM template_categories WHERE code = 'subj_pain_description';

-- Previous Treatment History
INSERT INTO clinical_templates (code, name_en, name_no, category_id, template_type, soap_section,
  content_en, content_no, keywords, sort_order)
SELECT
  'subj_prev_treatment_chiro', 'Previous Chiropractic Treatment', 'Tidligere Kiropraktisk Behandling', id, 'TEXT_SNIPPET', 'SUBJECTIVE',
  'Patient has previously received chiropractic treatment for {{condition}} in {{timeframe}} with {{result}} results.',
  'Pasienten har tidligere mottatt kiropraktisk behandling for {{condition}} i {{timeframe}} med {{result}} resultater.',
  ARRAY['history', 'previous treatment', 'chiropractic'],
  1
FROM template_categories WHERE code = 'subj_history';

-- Lifestyle & Activities
INSERT INTO clinical_templates (code, name_en, name_no, category_id, template_type, soap_section,
  content_en, content_no, template_data, keywords, sort_order)
SELECT
  'subj_occupation', 'Occupation Description', 'Yrkesbeskrivelse', id, 'TEXT_SNIPPET', 'SUBJECTIVE',
  'Patient is a {{occupation}} and reports {{work_impact}}.',
  'Pasienten er {{occupation}} og rapporterer {{work_impact}}.',
  '{"variables": [
    {"name": "occupation", "type": "text", "placeholder": "tømrer/kontormedarbeider/sykepleier"},
    {"name": "work_impact", "type": "select", "options": [
      "no impact on work",
      "mild difficulty with work tasks",
      "moderate difficulty with work tasks",
      "severe impact on work capacity",
      "currently on sick leave"
    ]}
  ]}'::jsonb,
  ARRAY['occupation', 'work', 'lifestyle'],
  1
FROM template_categories WHERE code = 'subj_lifestyle';

INSERT INTO clinical_templates (code, name_en, name_no, category_id, template_type, soap_section,
  content_en, content_no, template_data, keywords, sort_order)
SELECT
  'subj_exercise_habits', 'Exercise Habits', 'Treningsvaner', id, 'CHECKBOX_LIST', 'SUBJECTIVE',
  'Patient exercise habits: {{activities}}',
  'Pasientens treningsvaner: {{activities}}',
  '{"options": [
    {"value": "strength_training", "label_en": "strength training", "label_no": "styrketrening"},
    {"value": "running", "label_en": "running", "label_no": "løping"},
    {"value": "cycling", "label_en": "cycling", "label_no": "sykling"},
    {"value": "swimming", "label_en": "swimming", "label_no": "svømming"},
    {"value": "yoga", "label_en": "yoga/pilates", "label_no": "yoga/pilates"},
    {"value": "team_sports", "label_en": "team sports", "label_no": "lagidrett"},
    {"value": "golf", "label_en": "golf", "label_no": "golf"},
    {"value": "dance", "label_en": "dance", "label_no": "dans"},
    {"value": "inactive", "label_en": "currently inactive", "label_no": "for tiden inaktiv"}
  ]}'::jsonb,
  ARRAY['exercise', 'activity', 'lifestyle'],
  2
FROM template_categories WHERE code = 'subj_lifestyle';

-- ============================================================================
-- OBJECTIVE TEMPLATES (UNDERSØKELSE)
-- ============================================================================

-- General Observation & Vitals
INSERT INTO clinical_templates (code, name_en, name_no, category_id, template_type, soap_section,
  content_en, content_no, template_data, keywords, sort_order)
SELECT
  'obj_vitals_standard', 'Standard Vital Signs', 'Standard Vitale Tegn', id, 'STRUCTURED_FORM', 'OBJECTIVE',
  'Vitals: BP {{bp_systolic}}/{{bp_diastolic}} mmHg, HR {{heart_rate}} bpm, RR {{resp_rate}}/min, Temp {{temp}}°C',
  'Vitale tegn: BT {{bp_systolic}}/{{bp_diastolic}} mmHg, Puls {{heart_rate}} slag/min, RF {{resp_rate}}/min, Temp {{temp}}°C',
  '{"fields": [
    {"name": "bp_systolic", "type": "number", "unit": "mmHg", "normal": "90-140"},
    {"name": "bp_diastolic", "type": "number", "unit": "mmHg", "normal": "60-90"},
    {"name": "heart_rate", "type": "number", "unit": "bpm", "normal": "60-100"},
    {"name": "resp_rate", "type": "number", "unit": "/min", "normal": "12-20"},
    {"name": "temp", "type": "number", "unit": "°C", "normal": "36.5-37.5"}
  ]}'::jsonb,
  ARRAY['vitals', 'blood pressure', 'heart rate'],
  1
FROM template_categories WHERE code = 'obj_general_vitals';

INSERT INTO clinical_templates (code, name_en, name_no, category_id, template_type, soap_section,
  content_en, content_no, template_data, keywords, sort_order)
SELECT
  'obj_general_observation', 'General Observation', 'Generell Observasjon', id, 'CHECKBOX_LIST', 'OBJECTIVE',
  'Observation: {{findings}}',
  'Observasjon: {{findings}}',
  '{"options": [
    {"value": "well_nourished", "label_en": "well-nourished", "label_no": "velernært"},
    {"value": "normal_color", "label_en": "normal color", "label_no": "normal farge"},
    {"value": "no_distress", "label_en": "no acute distress", "label_no": "ingen akutt nød"},
    {"value": "pale", "label_en": "pale/pallor", "label_no": "blek"},
    {"value": "cyanosis", "label_en": "cyanosis", "label_no": "cyanose"},
    {"value": "edema", "label_en": "peripheral edema", "label_no": "perifert ødem"},
    {"value": "anxious", "label_en": "appears anxious", "label_no": "fremstår som engstelig"},
    {"value": "pain_affect", "label_en": "visible pain affect", "label_no": "synlig smertepåvirkning"}
  ]}'::jsonb,
  ARRAY['observation', 'general'],
  2
FROM template_categories WHERE code = 'obj_general_vitals';

-- Cervical Spine Examination
INSERT INTO clinical_templates (code, name_en, name_no, category_id, template_type, soap_section, body_region,
  content_en, content_no, template_data, keywords, sort_order)
SELECT
  'obj_cervical_arom', 'Cervical Active ROM', 'Cervical Aktiv Bevegelsesutslag', id, 'STRUCTURED_FORM', 'OBJECTIVE', 'cervical',
  'Cervical AROM: Flexion {{flexion}}°, Extension {{extension}}°, Right rotation {{rrot}}°, Left rotation {{lrot}}°, Right lateral flexion {{rlat}}°, Left lateral flexion {{llat}}°',
  'Cervical AROM: Fleksjon {{flexion}}°, Ekstensjon {{extension}}°, Høyre rotasjon {{rrot}}°, Venstre rotasjon {{lrot}}°, Høyre lateralfleksjon {{rlat}}°, Venstre lateralfleksjon {{llat}}°',
  '{"fields": [
    {"name": "flexion", "type": "number", "unit": "degrees", "normal": "50-60"},
    {"name": "extension", "type": "number", "unit": "degrees", "normal": "60-70"},
    {"name": "rrot", "type": "number", "unit": "degrees", "normal": "70-90"},
    {"name": "lrot", "type": "number", "unit": "degrees", "normal": "70-90"},
    {"name": "rlat", "type": "number", "unit": "degrees", "normal": "40-45"},
    {"name": "llat", "type": "number", "unit": "degrees", "normal": "40-45"}
  ]}'::jsonb,
  ARRAY['cervical', 'ROM', 'range of motion', 'neck'],
  1
FROM template_categories WHERE code = 'obj_cervical';

INSERT INTO clinical_templates (code, name_en, name_no, category_id, template_type, soap_section, body_region,
  content_en, content_no, template_data, keywords, sort_order)
SELECT
  'obj_cervical_palpation', 'Cervical Palpation Findings', 'Cervical Palpasjons Funn', id, 'TEXT_SNIPPET', 'OBJECTIVE', 'cervical',
  'Palpation reveals {{findings}} in {{segments}}. {{tone}} muscle tone noted in {{muscles}}.',
  'Palpasjon avdekker {{findings}} i {{segments}}. {{tone}} muskeltonus notert i {{muscles}}.',
  '{"variables": [
    {"name": "findings", "type": "select", "options": ["tenderness", "trigger points", "muscle spasm", "no significant findings"]},
    {"name": "segments", "type": "text", "placeholder": "C4-C6"},
    {"name": "tone", "type": "select", "options": ["increased", "normal", "decreased"]},
    {"name": "muscles", "type": "text", "placeholder": "upper trapezius, levator scapulae"}
  ]}'::jsonb,
  ARRAY['cervical', 'palpation', 'tenderness'],
  2
FROM template_categories WHERE code = 'obj_cervical';

-- Lumbar Spine Examination
INSERT INTO clinical_templates (code, name_en, name_no, category_id, template_type, soap_section, body_region,
  content_en, content_no, template_data, keywords, sort_order)
SELECT
  'obj_lumbar_arom', 'Lumbar Active ROM', 'Lumbar Aktiv Bevegelsesutslag', id, 'STRUCTURED_FORM', 'OBJECTIVE', 'lumbar',
  'Lumbar AROM: Flexion {{flexion}}° (fingertips to floor: {{ftf}} cm), Extension {{extension}}°, Right lateral flexion {{rlat}}°, Left lateral flexion {{llat}}°',
  'Lumbar AROM: Fleksjon {{flexion}}° (fingertips til gulv: {{ftf}} cm), Ekstensjon {{extension}}°, Høyre lateralfleksjon {{rlat}}°, Venstre lateralfleksjon {{llat}}°',
  '{"fields": [
    {"name": "flexion", "type": "number", "unit": "degrees", "normal": "40-60"},
    {"name": "ftf", "type": "number", "unit": "cm", "normal": "0"},
    {"name": "extension", "type": "number", "unit": "degrees", "normal": "20-35"},
    {"name": "rlat", "type": "number", "unit": "degrees", "normal": "15-20"},
    {"name": "llat", "type": "number", "unit": "degrees", "normal": "15-20"}
  ]}'::jsonb,
  ARRAY['lumbar', 'ROM', 'low back'],
  1
FROM template_categories WHERE code = 'obj_lumbar';

-- Shoulder Examination
INSERT INTO clinical_templates (code, name_en, name_no, category_id, template_type, soap_section, body_region,
  content_en, content_no, template_data, keywords, sort_order)
SELECT
  'obj_shoulder_arom', 'Shoulder Active ROM', 'Skulder Aktiv Bevegelsesutslag', id, 'STRUCTURED_FORM', 'OBJECTIVE', 'shoulder',
  'Shoulder {{side}} AROM: Flexion {{flexion}}°, Abduction {{abduction}}°, ER {{er}}°, IR {{ir}}°',
  'Skulder {{side}} AROM: Fleksjon {{flexion}}°, Abduksjon {{abduction}}°, ER {{er}}°, IR {{ir}}°',
  '{"fields": [
    {"name": "side", "type": "select", "options": ["right", "left"]},
    {"name": "flexion", "type": "number", "unit": "degrees", "normal": "150-180"},
    {"name": "abduction", "type": "number", "unit": "degrees", "normal": "150-180"},
    {"name": "er", "type": "number", "unit": "degrees", "normal": "80-90"},
    {"name": "ir", "type": "number", "unit": "degrees", "normal": "60-80"}
  ]}'::jsonb,
  ARRAY['shoulder', 'ROM', 'upper extremity'],
  1
FROM template_categories WHERE code = 'obj_shoulder';

-- Continue with more templates...
