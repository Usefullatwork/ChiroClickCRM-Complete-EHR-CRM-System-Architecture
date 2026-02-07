-- =====================================================
-- DIALOGUE MESSAGES TO GP/SPECIALISTS
-- =====================================================
-- Automated dialogue message (dialogmelding) generation system
-- for communication between chiropractor and GP/specialists
-- Norwegian healthcare communication standards
-- Created: 2025-11-22

-- =====================================================
-- 1. DIALOGUE MESSAGE TEMPLATES
-- =====================================================

CREATE TABLE IF NOT EXISTS dialogue_message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_code VARCHAR(50) UNIQUE NOT NULL,
  template_name VARCHAR(200) NOT NULL,
  scenario VARCHAR(100) NOT NULL,  -- 'referral', 'information', 'collaboration', 'sick_leave'
  urgency_level VARCHAR(20) CHECK (urgency_level IN ('routine', 'urgent', 'emergency')),

  -- Template structure
  subject_template TEXT NOT NULL,
  greeting_template TEXT NOT NULL,
  opening_template TEXT,
  anamnesis_section_template TEXT,
  examination_findings_template TEXT,
  treatment_plan_template TEXT,
  prognosis_template TEXT,
  request_or_recommendation_template TEXT,
  follow_up_template TEXT,
  closing_template TEXT NOT NULL,

  -- Metadata
  required_variables TEXT[],  -- Variables that MUST be provided
  optional_variables TEXT[],  -- Variables that CAN be provided
  clinical_indications TEXT,  -- When to use this template

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 2. PATIENT DIALOGUE MESSAGES (Sent messages)
-- =====================================================

CREATE TABLE IF NOT EXISTS patient_dialogue_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  encounter_id UUID,
  anamnesis_id UUID,  -- Reference to patient_anamnesis

  -- Message details
  template_id UUID REFERENCES dialogue_message_templates(id),
  message_type VARCHAR(50) NOT NULL CHECK (message_type IN (
    'referral_medication',
    'referral_investigation',
    'referral_specialist',
    'information_treatment',
    'information_sick_leave',
    'information_concern',
    'collaboration_update',
    'emergency_alert'
  )),

  -- Recipients
  recipient_name VARCHAR(200),
  recipient_specialty VARCHAR(100),
  recipient_organization VARCHAR(200),

  -- Content
  subject TEXT NOT NULL,
  message_body TEXT NOT NULL,

  -- Clinical context
  diagnosis VARCHAR(200),
  red_flags_mentioned TEXT[],
  investigations_requested TEXT[],
  medications_requested TEXT[],

  -- Status
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'acknowledged', 'responded')),
  sent_via VARCHAR(50),  -- 'norsk_helsenett', 'email', 'fax', 'manual'
  sent_at TIMESTAMP,
  sent_by UUID,

  -- Response tracking
  response_received BOOLEAN DEFAULT false,
  response_date TIMESTAMP,
  response_summary TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dialogue_messages_patient ON patient_dialogue_messages(patient_id);
CREATE INDEX IF NOT EXISTS idx_dialogue_messages_encounter ON patient_dialogue_messages(encounter_id);
CREATE INDEX IF NOT EXISTS idx_dialogue_messages_type ON patient_dialogue_messages(message_type);
CREATE INDEX IF NOT EXISTS idx_dialogue_messages_status ON patient_dialogue_messages(status);

-- =====================================================
-- 3. INSERT TEMPLATE: REFERRAL FOR MEDICATION
-- =====================================================

INSERT INTO dialogue_message_templates (
  template_code,
  template_name,
  scenario,
  urgency_level,
  subject_template,
  greeting_template,
  opening_template,
  anamnesis_section_template,
  examination_findings_template,
  treatment_plan_template,
  request_or_recommendation_template,
  closing_template,
  required_variables,
  optional_variables,
  clinical_indications
) VALUES (
  'REFERRAL_PAIN_MEDICATION',
  'Henvisning for Smertestillende Medisinering',
  'referral',
  'routine',
  'Pasient - henvisning vedrørende smertestillende',
  'Hei Dr. {{gp_name}},',
  'Jeg har for tiden en {{patient_age}} år gammel pasient med det jeg vurderer som {{condition_description}}.',
  'Pasienten har {{symptom_duration}} og rapporterer {{pain_description}}. {{red_flag_status}}',
  'Ved undersøkelse finner jeg {{examination_findings}}. {{special_tests}}',
  'Han/hun har vært til behandling her {{number_of_treatments}} ganger med fokus på {{treatment_modalities}}. Pasienten har {{improvement_status}}, men har fortsatt smerter som {{functional_impact}}.',
  'Pasienten har spurt meg om smertestillende, men jeg ønsker at han/hun skal snakke med deg om dette. Jeg har derfor anbefalt pasienten å kontakte deg for vurdering av medikamentell smertebehandling.',
  'Ved spørsmål, ta gjerne kontakt med meg. På forhånd, tusen takk for hjelpen og samarbeidet!\n\nMed vennlig hilsen,\n{{sender_name}}\n{{sender_title}}\n{{clinic_name}}',
  ARRAY['patient_age', 'condition_description', 'symptom_duration', 'treatment_modalities', 'sender_name'],
  ARRAY['gp_name', 'pain_description', 'examination_findings', 'number_of_treatments', 'improvement_status', 'functional_impact', 'special_tests', 'red_flag_status'],
  'Brukes når pasient trenger smertestillende medisinering som ligger utenfor kiropraktorens kompetanse'
);

-- =====================================================
-- 4. INSERT TEMPLATE: INFORMATION ABOUT TREATMENT
-- =====================================================

INSERT INTO dialogue_message_templates (
  template_code,
  template_name,
  scenario,
  urgency_level,
  subject_template,
  greeting_template,
  opening_template,
  anamnesis_section_template,
  examination_findings_template,
  treatment_plan_template,
  prognosis_template,
  follow_up_template,
  closing_template,
  required_variables,
  optional_variables,
  clinical_indications
) VALUES (
  'INFO_TREATMENT_UPDATE',
  'Informasjon om Behandlingsforløp',
  'information',
  'routine',
  'Informasjon - behandling av din pasient {{patient_name}}',
  '{{#if_reply_to_referral}}Takk for henvisningen.{{/if_reply_to_referral}}\n\nHei,',
  'Din pasient {{patient_name}} har oppsøkt meg for {{chief_complaint}}.',
  E'ANAMNESE:\n{{anamnesis_summary}}',
  E'UNDERSØKELSE/FUNN:\n{{examination_findings}}\n{{objective_findings}}\n{{special_test_results}}',
  E'BEHANDLING:\nBehandlingen vil bestå av {{treatment_description}}.\n{{exercises_prescribed}}',
  E'PROGNOSE:\nJeg anser prognosen som {{prognosis_assessment}}.',
  'Skulle behandlingsforløpet avvike fra forventet, vil du bli holdt orientert.',
  'Med vennlig hilsen,\n{{sender_name}}\n{{sender_title}}\n{{clinic_name}}',
  ARRAY['patient_name', 'chief_complaint', 'treatment_description', 'prognosis_assessment', 'sender_name'],
  ARRAY['anamnesis_summary', 'examination_findings', 'objective_findings', 'special_test_results', 'exercises_prescribed'],
  'Standard informasjonsmelding til fastlege om pågående behandling'
);

-- =====================================================
-- 5. INSERT TEMPLATE: SIMPLE LUMBAGO WITH ANXIETY
-- =====================================================

INSERT INTO dialogue_message_templates (
  template_code,
  template_name,
  scenario,
  urgency_level,
  subject_template,
  greeting_template,
  opening_template,
  anamnesis_section_template,
  examination_findings_template,
  treatment_plan_template,
  request_or_recommendation_template,
  closing_template,
  required_variables,
  clinical_indications
) VALUES (
  'REFERRAL_ANXIETY_REASSURANCE',
  'Henvisning for Beroligende Samtale/Undersøkelser',
  'referral',
  'routine',
  'Din pasient - henvisning for beroligende samtale',
  'Hei,',
  'Pasienten har gått til behandling hos undertegnede for {{complaint}} som han/hun har hatt gjennom cirka {{duration}}.',
  'På bakgrunn av klinikk, anamnese og objektive undersøkelser har jeg vurdert smertene som {{clinical_assessment}}. Han/hun har foreløpig mottatt {{number_of_treatments}} behandlinger og opplever {{treatment_response}}. Planen er å avslutte behandlingen om kort tid.',
  'Ved undersøkelse finner jeg {{examination_findings}}. {{red_flag_assessment}}',
  NULL,
  'Bakgrunnen for denne meldingen er at pasienten opplyser at {{patient_concern}}. Det fremkommer i anamnesen {{clinical_reasoning}}. Jeg har likevel oppfordret han/hun til å oppsøke deg for {{requested_action}} på bakgrunn av {{reason_for_referral}}.',
  'Med vennlig hilsen,\n{{sender_name}}\n{{sender_title}}\n{{clinic_name}}',
  ARRAY['complaint', 'duration', 'clinical_assessment', 'patient_concern', 'requested_action', 'sender_name'],
  'Brukes når pasienten har bekymringer som krever legevurdering selv om kliniske funn er benigne'
);

-- =====================================================
-- 6. INSERT TEMPLATE: CAUDA EQUINA INFORMATION
-- =====================================================

INSERT INTO dialogue_message_templates (
  template_code,
  template_name,
  scenario,
  urgency_level,
  subject_template,
  greeting_template,
  opening_template,
  examination_findings_template,
  treatment_plan_template,
  follow_up_template,
  closing_template,
  required_variables,
  clinical_indications
) VALUES (
  'INFO_CAUDA_EQUINA_EDUCATION',
  'Informasjon om Cauda Equina Opplæring',
  'information',
  'routine',
  'Informasjon - behandling og cauda equina opplæring',
  'Hei,',
  'Din pasient {{patient_name}} er under behandling hos undertegnede for {{diagnosis}}.',
  'Ved undersøkelse finner jeg {{examination_findings}}. {{red_flag_screening}}',
  'Det er igangsatt konservativ behandling. Pasienten er vist øvelser for {{exercise_focus}} og oppfordret til å holde seg i aktivitet. Symptomene vurderes fortløpende.',
  'Pasienten er informert om symptomer på cauda equina syndrom og ved forverring oppfordres pasienten til å ta kontakt med fastlege eventuelt legevakt.\n\n{{#if_additional_monitoring}}{{monitoring_instructions}}{{/if_additional_monitoring}}',
  'Med vennlig hilsen,\n{{sender_name}}\n{{sender_title}}\n{{clinic_name}}',
  ARRAY['patient_name', 'diagnosis', 'exercise_focus', 'sender_name'],
  'Brukes for å dokumentere at pasient er informert om cauda equina røde flagg ved lumbale tilstander'
);

-- =====================================================
-- 7. INSERT TEMPLATE: SUSPECTED FRACTURE
-- =====================================================

INSERT INTO dialogue_message_templates (
  template_code,
  template_name,
  scenario,
  urgency_level,
  subject_template,
  greeting_template,
  opening_template,
  examination_findings_template,
  request_or_recommendation_template,
  closing_template,
  required_variables,
  clinical_indications
) VALUES (
  'REFERRAL_SUSPECTED_FRACTURE',
  'Henvisning ved Mistanke om Fraktur',
  'referral',
  'urgent',
  'HASTER - Mistanke om fraktur',
  'Hei,',
  'Pasienten hadde konsultasjon {{consultation_date}} for {{symptoms}}.',
  'Grunnet {{clinical_findings}} under konsultasjonen har undertegnede valgt å rekvirere {{imaging_modality}} for mulig fraktur.',
  'Pasienten er informert om at mistanke om fraktur foreligger og anbefalt å oppsøke deg/legevakt for videre håndtering.\n\n{{#if_ottawa_rules}}Ottawa-regler: {{ottawa_findings}}{{/if_ottawa_rules}}',
  'Med vennlig hilsen,\n{{sender_name}}\n{{sender_title}}\n{{clinic_name}}\n\nTlf: {{clinic_phone}}',
  ARRAY['consultation_date', 'symptoms', 'clinical_findings', 'imaging_modality', 'sender_name'],
  'URGENT - Brukes ved klinisk mistanke om fraktur'
);

-- =====================================================
-- 8. INSERT TEMPLATE: DISC HERNIATION WITH RADICULOPATHY
-- =====================================================

INSERT INTO dialogue_message_templates (
  template_code,
  template_name,
  scenario,
  urgency_level,
  subject_template,
  greeting_template,
  opening_template,
  anamnesis_section_template,
  examination_findings_template,
  request_or_recommendation_template,
  closing_template,
  required_variables,
  clinical_indications
) VALUES (
  'REFERRAL_DISC_RADICULOPATHY',
  'Henvisning ved Skiveprolaps med Nerverotaffeksjon',
  'referral',
  'urgent',
  'Henvisning - skiveprolaps med affeksjon av nerverot',
  'Hei,',
  'Din pasient {{patient_name}} ({{patient_age}} år) har oppsøkt meg med {{symptoms}} av {{duration}} varighet.',
  E'ANAMNESE:\n{{anamnesis_summary}}\n\nRØDE FLAGG: {{red_flags}}',
  E'UNDERSØKELSE:\n{{neurological_findings}}\n\nDermatom: {{dermatome_affected}}\nMyotom: {{myotome_affected}}\nReflekser: {{reflex_findings}}\n\n{{special_tests}}\n\nVurdering: {{clinical_assessment}}',
  'Jeg anbefaler henvisning til {{specialist_type}} for vurdering av {{requested_investigation}}.\n\n{{#if_progressive_weakness}}OBS: Progressiv motorisk svakhet - vurder hastegrad.{{/if_progressive_weakness}}',
  'Ved spørsmål, ring meg gjerne.\n\nMed vennlig hilsen,\n{{sender_name}}\n{{sender_title}}\n{{clinic_name}}\nTlf: {{clinic_phone}}',
  ARRAY['patient_name', 'patient_age', 'symptoms', 'duration', 'neurological_findings', 'clinical_assessment', 'sender_name'],
  'Brukes ved klinisk signifikant radiculopati som krever spesialistvurdering'
);

-- =====================================================
-- 9. INSERT TEMPLATE: VASCULAR INSUFFICIENCY
-- =====================================================

INSERT INTO dialogue_message_templates (
  template_code,
  template_name,
  scenario,
  urgency_level,
  subject_template,
  greeting_template,
  opening_template,
  examination_findings_template,
  request_or_recommendation_template,
  closing_template,
  required_variables,
  clinical_indications
) VALUES (
  'REFERRAL_VASCULAR_CLAUDICATION',
  'Henvisning ved Vaskulær Claudicatio',
  'referral',
  'urgent',
  'Henvisning - mistanke om vaskulær insuffisiens',
  'Hei,',
  'Din pasient {{patient_name}} har oppsøkt meg med {{symptoms}}.',
  E'UNDERSØKELSE:\nLewis arbeidsprøve {{affected_side}} side: Positiv\n(Rytmisk vipping av den hevede fot gir smerter i benet i løpet av {{time_to_symptoms}} minutt)\n\n{{peripheral_pulses}}\n{{ankle_brachial_index}}\n\nVurdering: Mistanke om iskemi i ekstremitet',
  'Jeg anbefaler henvisning til {{specialist_type}} for videre utredning av perifer arterieell sykdom.\n\nPasienten er informert om mistanken og rådet til å oppsøke deg snarest.',
  'Med vennlig hilsen,\n{{sender_name}}\n{{sender_title}}\n{{clinic_name}}\nTlf: {{clinic_phone}}',
  ARRAY['patient_name', 'symptoms', 'affected_side', 'time_to_symptoms', 'sender_name'],
  'URGENT - Brukes ved positiv Lewis test og mistanke om vaskulær claudicatio'
);

-- =====================================================
-- 10. INSERT TEMPLATE: SICK LEAVE NOTIFICATION
-- =====================================================

INSERT INTO dialogue_message_templates (
  template_code,
  template_name,
  scenario,
  urgency_level,
  subject_template,
  greeting_template,
  opening_template,
  anamnesis_section_template,
  examination_findings_template,
  treatment_plan_template,
  request_or_recommendation_template,
  closing_template,
  required_variables,
  clinical_indications
) VALUES (
  'INFO_SICK_LEAVE_NOTIFICATION',
  'Informasjon om Sykmelding',
  'information',
  'routine',
  'Informasjon - sykmelding av din pasient',
  'Hei,',
  'Jeg har i dag sykmeldt din pasient {{patient_name}} for {{diagnosis}}.',
  E'BAKGRUNN:\n{{clinical_summary}}\n\n{{work_demands}}',
  E'FUNN:\n{{examination_findings}}',
  E'BEHANDLING:\n{{treatment_plan}}\n\nSykmeldingsperiode: {{sick_leave_duration}}\nGrad: {{sick_leave_percentage}}%',
  E'OPPFØLGING:\n{{follow_up_responsibility}}\n\n{{#if_gp_follow_up_needed}}Jeg ber om at du overtar videre oppfølging av sykmelding etter {{handover_date}} hvis pasienten fortsatt har behov for sykmelding.{{/if_gp_follow_up_needed}}{{#if_chiro_follow_up}}Jeg vil følge opp pasienten videre med behandling og gradert aktivitet.{{/if_chiro_follow_up}}',
  'Ved spørsmål, ta gjerne kontakt.\n\nMed vennlig hilsen,\n{{sender_name}}\n{{sender_title}}\n{{clinic_name}}',
  ARRAY['patient_name', 'diagnosis', 'sick_leave_duration', 'sick_leave_percentage', 'follow_up_responsibility', 'sender_name'],
  'Brukes når kiropraktor har sykmeldt pasient (maks 8 uker) for å informere fastlege'
);

-- =====================================================
-- 11. INSERT TEMPLATE: BLOOD WORK REQUEST
-- =====================================================

INSERT INTO dialogue_message_templates (
  template_code,
  template_name,
  scenario,
  urgency_level,
  subject_template,
  greeting_template,
  opening_template,
  anamnesis_section_template,
  examination_findings_template,
  request_or_recommendation_template,
  closing_template,
  required_variables,
  clinical_indications
) VALUES (
  'REFERRAL_BLOOD_WORK',
  'Henvisning for Blodprøver',
  'referral',
  'routine',
  'Henvisning - ønske om blodprøver',
  'Hei,',
  'Din pasient {{patient_name}} ({{patient_age}} år) har oppsøkt meg med {{symptoms}}.',
  E'ANAMNESE:\n{{anamnesis_summary}}\n\n{{red_flags_or_concerns}}',
  E'UNDERSØKELSE:\n{{examination_findings}}',
  E'VURDERING:\n{{clinical_reasoning}}\n\nJeg ønsker derfor at du vurderer følgende blodprøver:\n{{requested_blood_tests}}\n\n{{rationale_for_tests}}',
  'Jeg vil følge opp pasienten videre etter at prøvesvar foreligger.\n\nMed vennlig hilsen,\n{{sender_name}}\n{{sender_title}}\n{{clinic_name}}',
  ARRAY['patient_name', 'patient_age', 'symptoms', 'requested_blood_tests', 'clinical_reasoning', 'sender_name'],
  'Brukes når kliniske funn tilsier behov for blodprøver (inflammatoriske markører, infeksjonsparametre, etc.)'
);

-- =====================================================
-- 12. INSERT TEMPLATE: DERMATOLOGY REFERRAL
-- =====================================================

INSERT INTO dialogue_message_templates (
  template_code,
  template_name,
  scenario,
  urgency_level,
  subject_template,
  greeting_template,
  opening_template,
  examination_findings_template,
  request_or_recommendation_template,
  closing_template,
  required_variables,
  clinical_indications
) VALUES (
  'REFERRAL_SKIN_LESION',
  'Henvisning for Hudforandring',
  'referral',
  'urgent',
  'Henvisning - mistenkelig hudforandring',
  'Hei,',
  'Ved behandling av din pasient {{patient_name}} har jeg observert en hudforandring som bør vurderes nærmere.',
  E'FUNN:\nLokalisasjon: {{lesion_location}}\nBeskrivelse: {{lesion_description}}\n{{abcde_criteria}}\n\n{{#if_photo_attached}}Se vedlagt foto.{{/if_photo_attached}}',
  'Jeg anbefaler at pasienten får vurdert denne hudforandringen av deg/hudlege.\n\nPasienten er informert om funnet og rådet til å kontakte deg.',
  'Med vennlig hilsen,\n{{sender_name}}\n{{sender_title}}\n{{clinic_name}}',
  ARRAY['patient_name', 'lesion_location', 'lesion_description', 'sender_name'],
  'Brukes ved funn av mistenkelig føflekk eller hudforandring'
);

-- =====================================================
-- 13. FUNCTION: GENERATE DIALOGUE MESSAGE
-- =====================================================

CREATE OR REPLACE FUNCTION generate_dialogue_message(
  p_patient_id UUID,
  p_template_code VARCHAR,
  p_variables JSONB
)
RETURNS UUID AS $$
DECLARE
  v_template RECORD;
  v_patient RECORD;
  v_message_body TEXT;
  v_subject TEXT;
  v_message_id UUID;
  v_key TEXT;
  v_value TEXT;
BEGIN
  -- Get template
  SELECT * INTO v_template
  FROM dialogue_message_templates
  WHERE template_code = p_template_code;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template % not found', p_template_code;
  END IF;

  -- Get patient info
  SELECT * INTO v_patient FROM patients WHERE id = p_patient_id;

  -- Start building message
  v_message_body := v_template.greeting_template || E'\n\n';

  IF v_template.opening_template IS NOT NULL THEN
    v_message_body := v_message_body || v_template.opening_template || E'\n\n';
  END IF;

  IF v_template.anamnesis_section_template IS NOT NULL THEN
    v_message_body := v_message_body || v_template.anamnesis_section_template || E'\n\n';
  END IF;

  IF v_template.examination_findings_template IS NOT NULL THEN
    v_message_body := v_message_body || v_template.examination_findings_template || E'\n\n';
  END IF;

  IF v_template.treatment_plan_template IS NOT NULL THEN
    v_message_body := v_message_body || v_template.treatment_plan_template || E'\n\n';
  END IF;

  IF v_template.prognosis_template IS NOT NULL THEN
    v_message_body := v_message_body || v_template.prognosis_template || E'\n\n';
  END IF;

  IF v_template.request_or_recommendation_template IS NOT NULL THEN
    v_message_body := v_message_body || v_template.request_or_recommendation_template || E'\n\n';
  END IF;

  IF v_template.follow_up_template IS NOT NULL THEN
    v_message_body := v_message_body || v_template.follow_up_template || E'\n\n';
  END IF;

  v_message_body := v_message_body || v_template.closing_template;

  -- Replace variables
  -- Add patient info to variables
  p_variables := p_variables || jsonb_build_object(
    'patient_name', v_patient.first_name || ' ' || v_patient.last_name,
    'patient_age', EXTRACT(YEAR FROM AGE(CURRENT_DATE, v_patient.date_of_birth))
  );

  -- Simple variable replacement (in production, use proper template engine)
  FOR v_key, v_value IN SELECT key, value FROM jsonb_each_text(p_variables)
  LOOP
    v_message_body := REPLACE(v_message_body, '{{' || v_key || '}}', v_value);
    v_subject := REPLACE(v_template.subject_template, '{{' || v_key || '}}', v_value);
  END LOOP;

  -- Create message record
  INSERT INTO patient_dialogue_messages (
    patient_id,
    template_id,
    message_type,
    subject,
    message_body,
    status
  ) VALUES (
    p_patient_id,
    v_template.id,
    'information_treatment',  -- Default, should be parameter
    COALESCE(v_subject, v_template.subject_template),
    v_message_body,
    'draft'
  )
  RETURNING id INTO v_message_id;

  RETURN v_message_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 14. COMMON CLINICAL PHRASES (Reusable snippets)
-- =====================================================

CREATE TABLE IF NOT EXISTS clinical_phrases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phrase_code VARCHAR(50) UNIQUE NOT NULL,
  category VARCHAR(100) NOT NULL,  -- 'red_flag_negative', 'examination_finding', 'treatment_description', etc.
  norwegian_text TEXT NOT NULL,
  english_text TEXT,
  context TEXT,  -- When to use this phrase
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert common phrases
INSERT INTO clinical_phrases (phrase_code, category, norwegian_text, context) VALUES
('NO_RED_FLAGS', 'red_flag_negative', 'uten røde flagg, utstråling eller kompliserende faktorer', 'When examination shows benign mechanical pain'),
('NO_RADICULOPATHY', 'red_flag_negative', 'Ingen radikulære funn', 'Normal neurological examination'),
('NO_CAUDA_EQUINA', 'red_flag_negative', 'Ingen symptomer forenlig med cauda equina syndrom', 'Lower back pain screening'),
('MECHANICAL_PAIN', 'clinical_assessment', 'vurdert smertene som muskulært betinget og således simpel lumbago', 'Simple mechanical low back pain'),
('IMPROVING_SLOWLY', 'treatment_response', 'blitt noe bedre, men har fortsatt smerter', 'Partial response to treatment'),
('MANUAL_THERAPY', 'treatment_modality', 'manuell ledd- og bløtvevsbehandling, samt råd, veiledning og passende øvelser', 'Standard conservative treatment'),
('GOOD_PROGNOSIS', 'prognosis', 'god', 'Expected good outcome'),
('FAIR_PROGNOSIS', 'prognosis', 'forsiktig god', 'Guarded but positive prognosis'),
('NERVE_ROOT_L5', 'neurological_finding', 'Affeksjon av L5 nerverot med redusert kraft i fotens dorsalfleksjon og nummenhet i L5 dermatom', 'L5 radiculopathy'),
('NERVE_ROOT_S1', 'neurological_finding', 'Affeksjon av S1 nerverot med redusert/fraværende achillesrefleks og nummenhet i S1 dermatom', 'S1 radiculopathy'),
('POS_SLR', 'special_test', 'Positiv Straight Leg Raise test ved {{degrees}} grader bilateralt/{{side}}', 'Positive SLR'),
('POS_KEMP', 'special_test', 'Positiv Kemp''s test {{side}} side med provokasjon av {{symptom}}', 'Facet loading test'),
('MYALGI', 'diagnosis', 'Myalgi', 'Muscle pain');

-- =====================================================
-- USAGE EXAMPLES
-- =====================================================

-- Example 1: Generate referral for pain medication
-- SELECT generate_dialogue_message(
--   'patient-uuid',
--   'REFERRAL_PAIN_MEDICATION',
--   '{
--     "gp_name": "Dr. Andersen",
--     "patient_age": "45",
--     "condition_description": "relativt nyoppståtte korsryggsplager uten røde flagg",
--     "symptom_duration": "3 uker",
--     "number_of_treatments": "to",
--     "treatment_modalities": "manuell ledd- og bløtvevsbehandling, samt råd og øvelser",
--     "improvement_status": "blitt noe bedre",
--     "functional_impact": "hemmer han i hverdagen",
--     "sender_name": "Kiropraktor Hansen",
--     "sender_title": "Autorisert kiropraktor",
--     "clinic_name": "Oslo Kiropraktorklinikk"
--   }'::jsonb
-- );

-- Example 2: Information about treatment with cauda equina education
-- SELECT generate_dialogue_message(
--   'patient-uuid',
--   'INFO_CAUDA_EQUINA_EDUCATION',
--   '{
--     "diagnosis": "lumbal facettsyndrom",
--     "examination_findings": "ømhet over L4-L5 facettledd bilateralt, begrenset ekstensjon",
--     "red_flag_screening": "Ingen nevrologiske utfall. Ingen saddle anesthesi eller blære-/tarmkontrollproblemer.",
--     "exercise_focus": "mobilitet og avspenning",
--     "sender_name": "Kiropraktor Olsen"
--   }'::jsonb
-- );

COMMENT ON TABLE dialogue_message_templates IS 'Templates for generating dialogue messages to GPs and specialists based on clinical scenarios';
COMMENT ON TABLE patient_dialogue_messages IS 'Record of all dialogue messages sent to healthcare providers for each patient';
COMMENT ON FUNCTION generate_dialogue_message IS 'Auto-generates dialogue message from template with provided clinical variables';
