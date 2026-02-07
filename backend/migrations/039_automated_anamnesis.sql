-- =====================================================
-- AUTOMATED ANAMNESIS (PATIENT HISTORY) SYSTEM
-- =====================================================
-- Comprehensive patient history intake with auto-generation
-- of Norwegian epikrise (medical summary) text
-- Created: 2025-11-22

-- =====================================================
-- 1. ANAMNESIS TEMPLATE STRUCTURE
-- =====================================================

CREATE TABLE IF NOT EXISTS anamnesis_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_code VARCHAR(50) UNIQUE NOT NULL,
  template_name VARCHAR(200) NOT NULL,
  specialty VARCHAR(100),  -- 'chiropractic', 'physiotherapy', 'general'
  sections JSONB NOT NULL,  -- Structured sections with fields
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 2. PATIENT ANAMNESIS RESPONSES
-- =====================================================

CREATE TABLE IF NOT EXISTS patient_anamnesis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  encounter_id UUID,
  template_id UUID REFERENCES anamnesis_templates(id),
  completed_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- CHIEF COMPLAINT
  chief_complaint TEXT NOT NULL,
  chief_complaint_duration VARCHAR(100),

  -- SYMPTOM ONSET
  symptom_onset_date DATE,
  onset_type VARCHAR(50) CHECK (onset_type IN ('akutt', 'gradvis', 'ukjent')),
  pre_onset_illness_trauma TEXT,

  -- SYMPTOM PATTERN
  aggravating_factors TEXT[],
  relieving_factors TEXT[],
  time_of_day_worst VARCHAR(100),
  time_of_day_best VARCHAR(100),

  -- ASSOCIATED SYMPTOMS
  has_headache BOOLEAN DEFAULT false,
  headache_details TEXT,
  has_dizziness BOOLEAN DEFAULT false,
  dizziness_details TEXT,
  has_other_pain BOOLEAN DEFAULT false,
  other_pain_locations TEXT[],

  -- NEUROLOGICAL SCREENING
  sensory_disturbances JSONB,  -- {"face": false, "body": false, "lower_ext": true, "upper_ext": false, "details": "tingling in right leg"}
  motor_weakness JSONB,
  spasms_cramps JSONB,
  coordination_issues BOOLEAN DEFAULT false,
  coordination_details TEXT,

  -- SYSTEMIC REVIEW
  energy_level INTEGER CHECK (energy_level BETWEEN 0 AND 10),
  sleep_quality INTEGER CHECK (sleep_quality BETWEEN 0 AND 10),
  sleep_issues TEXT,
  digestion_issues TEXT,
  weight_change VARCHAR(50),  -- 'stable', 'loss', 'gain'
  weight_change_amount_kg DECIMAL(5,2),

  -- MEDICAL HISTORY
  previous_treatment TEXT,
  previous_treatment_effectiveness TEXT,
  medications TEXT[],
  radiological_findings TEXT,
  past_medical_history TEXT,
  past_surgeries TEXT,
  family_history TEXT,

  -- LIFESTYLE & ERGONOMICS
  occupation VARCHAR(200),
  work_posture_description TEXT,
  work_hours_per_week INTEGER,
  exercise_frequency VARCHAR(100),
  exercise_types TEXT[],
  diet_description TEXT,
  ergonomic_issues TEXT,

  -- PATIENT CONCERNS
  patient_concerns TEXT,
  treatment_goals TEXT,

  -- OTHER
  additional_information TEXT,

  -- METADATA
  intake_method VARCHAR(50) DEFAULT 'clinician_interview' CHECK (intake_method IN ('clinician_interview', 'patient_form', 'digital_intake', 'phone_interview')),
  completed_by UUID,  -- Clinician or patient ID
  review_status VARCHAR(50) DEFAULT 'pending' CHECK (review_status IN ('pending', 'reviewed', 'amended')),
  reviewed_by UUID,
  reviewed_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_patient_anamnesis_patient ON patient_anamnesis(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_anamnesis_encounter ON patient_anamnesis(encounter_id);
CREATE INDEX IF NOT EXISTS idx_patient_anamnesis_date ON patient_anamnesis(completed_date);

-- =====================================================
-- 3. INSERT COMPREHENSIVE CHIROPRACTIC TEMPLATE
-- =====================================================

INSERT INTO anamnesis_templates (
  template_code,
  template_name,
  specialty,
  sections
) VALUES (
  'CHIRO_COMPREHENSIVE',
  'Omfattende Kiropraktor Anamnese',
  'chiropractic',
  '{
    "sections": [
      {
        "section_id": "chief_complaint",
        "section_title_no": "Hovedårsak til Konsultasjon",
        "section_title_en": "Chief Complaint",
        "fields": [
          {
            "field_id": "chief_complaint",
            "label_no": "Hva er hovedårsaken til konsultasjonen?",
            "field_type": "long_text",
            "required": true,
            "placeholder": "F.eks. nakkesmerter, svimmelhet, hodepine..."
          },
          {
            "field_id": "duration",
            "label_no": "Hvor lenge har du hatt disse symptomene?",
            "field_type": "duration",
            "required": true
          }
        ]
      },
      {
        "section_id": "symptom_history",
        "section_title_no": "Symptomhistorie",
        "section_title_en": "Symptom History",
        "fields": [
          {
            "field_id": "onset_date",
            "label_no": "Når debuterte symptomene?",
            "field_type": "date",
            "required": true
          },
          {
            "field_id": "onset_type",
            "label_no": "Akutt eller gradvis?",
            "field_type": "radio",
            "options": ["akutt", "gradvis", "ukjent"],
            "required": true
          },
          {
            "field_id": "pre_onset",
            "label_no": "Sykdom/traume før debut?",
            "field_type": "long_text",
            "placeholder": "Beskriv eventuelle uhell, sykdom, eller hendelser før symptomene startet"
          }
        ]
      },
      {
        "section_id": "symptom_pattern",
        "section_title_no": "Symptommønster",
        "section_title_en": "Symptom Pattern",
        "fields": [
          {
            "field_id": "aggravating_factors",
            "label_no": "Forverrende faktorer",
            "field_type": "checkboxes",
            "options": [
              "sitting", "standing", "walking", "bending_forward", "bending_backward",
              "rotation_left", "rotation_right", "lifting", "coughing_sneezing",
              "stress", "weather_changes", "morning", "evening", "activity", "rest"
            ],
            "allow_other": true
          },
          {
            "field_id": "relieving_factors",
            "label_no": "Forbedrende faktorer",
            "field_type": "checkboxes",
            "options": [
              "rest", "movement", "heat", "cold", "medication", "stretching",
              "lying_down", "position_change", "massage"
            ],
            "allow_other": true
          },
          {
            "field_id": "time_worst",
            "label_no": "Når på døgnet er symptomene verst?",
            "field_type": "radio",
            "options": ["morgen", "formiddag", "ettermiddag", "kveld", "natt", "varierer"]
          },
          {
            "field_id": "time_best",
            "label_no": "Når på døgnet er symptomene minst?",
            "field_type": "radio",
            "options": ["morgen", "formiddag", "ettermiddag", "kveld", "natt", "varierer"]
          }
        ]
      },
      {
        "section_id": "associated_symptoms",
        "section_title_no": "Tilhørende Symptomer",
        "section_title_en": "Associated Symptoms",
        "fields": [
          {
            "field_id": "other_pain",
            "label_no": "Andre nerve-, muskel- og leddsmerter?",
            "field_type": "body_chart",
            "allow_multiple": true
          },
          {
            "field_id": "headache",
            "label_no": "Hodepine",
            "field_type": "yes_no_details",
            "details_prompt": "Beskriv type, lokalisasjon, frekvens"
          },
          {
            "field_id": "dizziness",
            "label_no": "Svimmelhet/ustøhet",
            "field_type": "yes_no_details",
            "details_prompt": "Beskriv type (rotatorisk, usikkerhet, blackout), utløsende faktorer"
          }
        ]
      },
      {
        "section_id": "neurological_screen",
        "section_title_no": "Nevrologisk Screening",
        "section_title_en": "Neurological Screening",
        "fields": [
          {
            "field_id": "sensory_disturbances",
            "label_no": "Sensoriske forstyrrelser",
            "field_type": "body_region_checklist",
            "regions": ["ansikt", "kropp", "øvre_ekstremiteter", "nedre_ekstremiteter"],
            "symptom_types": ["nummenhet", "prikking", "brennende", "redusert_følelse"]
          },
          {
            "field_id": "motor_weakness",
            "label_no": "Svakheter",
            "field_type": "body_region_checklist",
            "regions": ["ansikt", "kropp", "øvre_ekstremiteter", "nedre_ekstremiteter"]
          },
          {
            "field_id": "spasms_cramps",
            "label_no": "Kramper/spasmer",
            "field_type": "body_region_checklist",
            "regions": ["ansikt", "kropp", "øvre_ekstremiteter", "nedre_ekstremiteter"]
          },
          {
            "field_id": "coordination",
            "label_no": "Nedsatt koordinasjon",
            "field_type": "yes_no_details"
          }
        ]
      },
      {
        "section_id": "systemic_review",
        "section_title_no": "Systemisk Gjennomgang",
        "section_title_en": "Systems Review",
        "fields": [
          {
            "field_id": "energy",
            "label_no": "Energinivå (0-10)",
            "field_type": "scale",
            "min": 0,
            "max": 10,
            "labels": {"0": "Ingen energi", "10": "Utmerket energi"}
          },
          {
            "field_id": "sleep",
            "label_no": "Søvnkvalitet (0-10)",
            "field_type": "scale",
            "min": 0,
            "max": 10,
            "labels": {"0": "Svært dårlig", "10": "Utmerket"}
          },
          {
            "field_id": "sleep_issues",
            "label_no": "Søvnproblemer detaljer",
            "field_type": "checkboxes",
            "options": [
              "difficulty_falling_asleep", "waking_during_night", "early_waking",
              "pain_disturbs_sleep", "snoring", "sleep_apnea"
            ]
          },
          {
            "field_id": "digestion",
            "label_no": "Fordøyelsesproblemer",
            "field_type": "long_text"
          },
          {
            "field_id": "weight_change",
            "label_no": "Vektendring",
            "field_type": "radio",
            "options": ["stabil", "tap", "økning", "ukjent"],
            "conditional_field": {
              "show_if": ["tap", "økning"],
              "field_id": "weight_amount",
              "label_no": "Hvor mye (kg)?",
              "field_type": "number"
            }
          }
        ]
      },
      {
        "section_id": "medical_history",
        "section_title_no": "Medisinsk Historie",
        "section_title_en": "Medical History",
        "fields": [
          {
            "field_id": "previous_treatment",
            "label_no": "Tidligere behandling for denne tilstanden?",
            "field_type": "long_text",
            "placeholder": "Type behandling, hvor, når, effekt"
          },
          {
            "field_id": "medications",
            "label_no": "Medikamenter",
            "field_type": "medication_list",
            "include_dosage": true,
            "include_frequency": true
          },
          {
            "field_id": "radiological",
            "label_no": "Radiologiske undersøkelser (Rtg, MR, CT, ultralyd)",
            "field_type": "long_text",
            "placeholder": "Hva er tatt, når, funn"
          },
          {
            "field_id": "past_medical",
            "label_no": "Tidligere sykehistorie/operasjoner",
            "field_type": "long_text"
          },
          {
            "field_id": "family_history",
            "label_no": "Alvorlige lidelser/sykdommer i familien",
            "field_type": "checkboxes",
            "options": [
              "cancer", "heart_disease", "diabetes", "autoimmune", "neurological",
              "rheumatoid_arthritis", "osteoporosis", "mental_health"
            ],
            "allow_other": true
          }
        ]
      },
      {
        "section_id": "lifestyle",
        "section_title_no": "Livsstil og Ergonomi",
        "section_title_en": "Lifestyle & Ergonomics",
        "fields": [
          {
            "field_id": "occupation",
            "label_no": "Yrke",
            "field_type": "text"
          },
          {
            "field_id": "work_posture",
            "label_no": "Arbeidsstilling",
            "field_type": "checkboxes",
            "options": [
              "sitting_desk", "standing", "walking", "heavy_lifting",
              "repetitive_movements", "driving", "varied"
            ]
          },
          {
            "field_id": "work_hours",
            "label_no": "Arbeidstimer per uke",
            "field_type": "number"
          },
          {
            "field_id": "exercise",
            "label_no": "Trening",
            "field_type": "exercise_tracker",
            "include_frequency": true,
            "include_type": true,
            "include_duration": true
          },
          {
            "field_id": "diet",
            "label_no": "Kosthold",
            "field_type": "long_text",
            "placeholder": "Generell beskrivelse av kosthold, eventuelle restriksjoner"
          },
          {
            "field_id": "ergonomics",
            "label_no": "Ergonomiske problemer",
            "field_type": "long_text",
            "placeholder": "Arbeidsstasjon oppsett, daglige aktiviteter som skaper problemer"
          }
        ]
      },
      {
        "section_id": "patient_perspective",
        "section_title_no": "Pasientens Perspektiv",
        "section_title_en": "Patient Perspective",
        "fields": [
          {
            "field_id": "concerns",
            "label_no": "Bekymringer",
            "field_type": "long_text",
            "placeholder": "Hva er du mest bekymret for? Hva tror du er galt?"
          },
          {
            "field_id": "goals",
            "label_no": "Behandlingsmål",
            "field_type": "long_text",
            "placeholder": "Hva ønsker du å oppnå med behandling?"
          },
          {
            "field_id": "expectations",
            "label_no": "Forventninger til behandling",
            "field_type": "long_text"
          }
        ]
      },
      {
        "section_id": "other",
        "section_title_no": "Annet",
        "section_title_en": "Other",
        "fields": [
          {
            "field_id": "additional",
            "label_no": "Annen relevant informasjon",
            "field_type": "long_text"
          }
        ]
      }
    ]
  }'::jsonb
);

-- =====================================================
-- 4. FUNCTION: AUTO-GENERATE EPIKRISE TEXT
-- =====================================================

CREATE OR REPLACE FUNCTION generate_anamnesis_epikrise(
  p_anamnesis_id UUID
)
RETURNS TEXT AS $$
DECLARE
  v_anamnesis RECORD;
  v_patient RECORD;
  v_epikrise TEXT;
  v_age INTEGER;
BEGIN
  -- Get anamnesis data
  SELECT * INTO v_anamnesis FROM patient_anamnesis WHERE id = p_anamnesis_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Anamnesis record not found';
  END IF;

  -- Get patient data (adjust based on your patients table structure)
  SELECT
    first_name,
    last_name,
    date_of_birth,
    EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_of_birth))::INTEGER AS age
  INTO v_patient
  FROM patients
  WHERE id = v_anamnesis.patient_id;

  -- Start building epikrise
  v_epikrise := E'ANAMNESE\n';
  v_epikrise := v_epikrise || E'════════════════════════════════════════\n\n';

  -- Chief Complaint
  v_epikrise := v_epikrise || E'HOVEDÅRSAK TIL KONSULTASJON:\n';
  v_epikrise := v_epikrise || v_patient.first_name || ' ' || v_patient.last_name;
  v_epikrise := v_epikrise || ' (' || v_patient.age || ' år) kommer til konsultasjon med: ';
  v_epikrise := v_epikrise || v_anamnesis.chief_complaint;

  IF v_anamnesis.chief_complaint_duration IS NOT NULL THEN
    v_epikrise := v_epikrise || '. Symptomene har vart i ' || v_anamnesis.chief_complaint_duration || '.';
  END IF;
  v_epikrise := v_epikrise || E'\n\n';

  -- Symptom Onset
  IF v_anamnesis.symptom_onset_date IS NOT NULL OR v_anamnesis.onset_type IS NOT NULL THEN
    v_epikrise := v_epikrise || E'SYMPTOMDEBUT:\n';

    IF v_anamnesis.symptom_onset_date IS NOT NULL THEN
      v_epikrise := v_epikrise || 'Symptomene debuterte ' || TO_CHAR(v_anamnesis.symptom_onset_date, 'DD.MM.YYYY') || '. ';
    END IF;

    IF v_anamnesis.onset_type IS NOT NULL THEN
      v_epikrise := v_epikrise || 'Debuten var ' || v_anamnesis.onset_type || '. ';
    END IF;

    IF v_anamnesis.pre_onset_illness_trauma IS NOT NULL THEN
      v_epikrise := v_epikrise || 'Før debut: ' || v_anamnesis.pre_onset_illness_trauma || '.';
    END IF;
    v_epikrise := v_epikrise || E'\n\n';
  END IF;

  -- Symptom Pattern
  IF v_anamnesis.aggravating_factors IS NOT NULL OR v_anamnesis.relieving_factors IS NOT NULL THEN
    v_epikrise := v_epikrise || E'SYMPTOMMØNSTER:\n';

    IF v_anamnesis.aggravating_factors IS NOT NULL AND array_length(v_anamnesis.aggravating_factors, 1) > 0 THEN
      v_epikrise := v_epikrise || 'Forverrende faktorer: ' || array_to_string(v_anamnesis.aggravating_factors, ', ') || '. ';
    END IF;

    IF v_anamnesis.relieving_factors IS NOT NULL AND array_length(v_anamnesis.relieving_factors, 1) > 0 THEN
      v_epikrise := v_epikrise || 'Forbedrende faktorer: ' || array_to_string(v_anamnesis.relieving_factors, ', ') || '. ';
    END IF;

    IF v_anamnesis.time_of_day_worst IS NOT NULL THEN
      v_epikrise := v_epikrise || 'Verst på ' || v_anamnesis.time_of_day_worst || '. ';
    END IF;

    IF v_anamnesis.time_of_day_best IS NOT NULL THEN
      v_epikrise := v_epikrise || 'Best på ' || v_anamnesis.time_of_day_best || '. ';
    END IF;
    v_epikrise := v_epikrise || E'\n\n';
  END IF;

  -- Associated Symptoms
  IF v_anamnesis.has_headache OR v_anamnesis.has_dizziness OR v_anamnesis.has_other_pain THEN
    v_epikrise := v_epikrise || E'TILHØRENDE SYMPTOMER:\n';

    IF v_anamnesis.has_other_pain AND v_anamnesis.other_pain_locations IS NOT NULL THEN
      v_epikrise := v_epikrise || 'Andre smertelokalisasjoner: ' || array_to_string(v_anamnesis.other_pain_locations, ', ') || '. ';
    END IF;

    IF v_anamnesis.has_headache THEN
      v_epikrise := v_epikrise || 'Hodepine: ';
      IF v_anamnesis.headache_details IS NOT NULL THEN
        v_epikrise := v_epikrise || v_anamnesis.headache_details;
      ELSE
        v_epikrise := v_epikrise || 'Ja';
      END IF;
      v_epikrise := v_epikrise || '. ';
    END IF;

    IF v_anamnesis.has_dizziness THEN
      v_epikrise := v_epikrise || 'Svimmelhet: ';
      IF v_anamnesis.dizziness_details IS NOT NULL THEN
        v_epikrise := v_epikrise || v_anamnesis.dizziness_details;
      ELSE
        v_epikrise := v_epikrise || 'Ja';
      END IF;
      v_epikrise := v_epikrise || '. ';
    END IF;
    v_epikrise := v_epikrise || E'\n\n';
  END IF;

  -- Neurological Screening
  IF v_anamnesis.sensory_disturbances IS NOT NULL OR
     v_anamnesis.motor_weakness IS NOT NULL OR
     v_anamnesis.spasms_cramps IS NOT NULL OR
     v_anamnesis.coordination_issues THEN
    v_epikrise := v_epikrise || E'NEVROLOGISK SCREENING:\n';

    IF v_anamnesis.sensory_disturbances IS NOT NULL AND
       v_anamnesis.sensory_disturbances::text != '{}' THEN
      v_epikrise := v_epikrise || 'Sensoriske forstyrrelser: ' || (v_anamnesis.sensory_disturbances->>'details') || '. ';
    ELSE
      v_epikrise := v_epikrise || 'Ingen sensoriske forstyrrelser. ';
    END IF;

    IF v_anamnesis.motor_weakness IS NOT NULL AND
       v_anamnesis.motor_weakness::text != '{}' THEN
      v_epikrise := v_epikrise || 'Motoriske svakheter: ' || (v_anamnesis.motor_weakness->>'details') || '. ';
    ELSE
      v_epikrise := v_epikrise || 'Ingen motoriske svakheter. ';
    END IF;

    IF v_anamnesis.coordination_issues THEN
      v_epikrise := v_epikrise || 'Koordinasjonsproblemer: ';
      IF v_anamnesis.coordination_details IS NOT NULL THEN
        v_epikrise := v_epikrise || v_anamnesis.coordination_details;
      ELSE
        v_epikrise := v_epikrise || 'Ja';
      END IF;
      v_epikrise := v_epikrise || '. ';
    END IF;
    v_epikrise := v_epikrise || E'\n\n';
  END IF;

  -- Systemic Review
  IF v_anamnesis.energy_level IS NOT NULL OR
     v_anamnesis.sleep_quality IS NOT NULL OR
     v_anamnesis.weight_change IS NOT NULL THEN
    v_epikrise := v_epikrise || E'SYSTEMISK GJENNOMGANG:\n';

    IF v_anamnesis.energy_level IS NOT NULL THEN
      v_epikrise := v_epikrise || 'Energinivå: ' || v_anamnesis.energy_level || '/10. ';
    END IF;

    IF v_anamnesis.sleep_quality IS NOT NULL THEN
      v_epikrise := v_epikrise || 'Søvnkvalitet: ' || v_anamnesis.sleep_quality || '/10';
      IF v_anamnesis.sleep_issues IS NOT NULL THEN
        v_epikrise := v_epikrise || ' (' || v_anamnesis.sleep_issues || ')';
      END IF;
      v_epikrise := v_epikrise || '. ';
    END IF;

    IF v_anamnesis.digestion_issues IS NOT NULL THEN
      v_epikrise := v_epikrise || 'Fordøyelse: ' || v_anamnesis.digestion_issues || '. ';
    END IF;

    IF v_anamnesis.weight_change IS NOT NULL AND v_anamnesis.weight_change != 'stabil' THEN
      v_epikrise := v_epikrise || 'Vektendring: ' || v_anamnesis.weight_change;
      IF v_anamnesis.weight_change_amount_kg IS NOT NULL THEN
        v_epikrise := v_epikrise || ' (' || v_anamnesis.weight_change_amount_kg || ' kg)';
      END IF;
      v_epikrise := v_epikrise || '. ';
    END IF;
    v_epikrise := v_epikrise || E'\n\n';
  END IF;

  -- Medical History
  IF v_anamnesis.previous_treatment IS NOT NULL OR
     v_anamnesis.medications IS NOT NULL OR
     v_anamnesis.past_medical_history IS NOT NULL THEN
    v_epikrise := v_epikrise || E'MEDISINSK HISTORIE:\n';

    IF v_anamnesis.previous_treatment IS NOT NULL THEN
      v_epikrise := v_epikrise || 'Tidligere behandling: ' || v_anamnesis.previous_treatment || '. ';
    END IF;

    IF v_anamnesis.medications IS NOT NULL AND array_length(v_anamnesis.medications, 1) > 0 THEN
      v_epikrise := v_epikrise || 'Medikamenter: ' || array_to_string(v_anamnesis.medications, ', ') || '. ';
    ELSE
      v_epikrise := v_epikrise || 'Ingen faste medikamenter. ';
    END IF;

    IF v_anamnesis.radiological_findings IS NOT NULL THEN
      v_epikrise := v_epikrise || 'Radiologiske undersøkelser: ' || v_anamnesis.radiological_findings || '. ';
    END IF;

    IF v_anamnesis.past_medical_history IS NOT NULL THEN
      v_epikrise := v_epikrise || 'Tidligere sykehistorie: ' || v_anamnesis.past_medical_history || '. ';
    END IF;

    IF v_anamnesis.family_history IS NOT NULL THEN
      v_epikrise := v_epikrise || 'Familiær sykdom: ' || v_anamnesis.family_history || '. ';
    END IF;
    v_epikrise := v_epikrise || E'\n\n';
  END IF;

  -- Lifestyle & Ergonomics
  IF v_anamnesis.occupation IS NOT NULL OR
     v_anamnesis.exercise_frequency IS NOT NULL THEN
    v_epikrise := v_epikrise || E'LIVSSTIL OG ERGONOMI:\n';

    IF v_anamnesis.occupation IS NOT NULL THEN
      v_epikrise := v_epikrise || 'Yrke: ' || v_anamnesis.occupation;
      IF v_anamnesis.work_posture_description IS NOT NULL THEN
        v_epikrise := v_epikrise || ' (' || v_anamnesis.work_posture_description || ')';
      END IF;
      v_epikrise := v_epikrise || '. ';
    END IF;

    IF v_anamnesis.work_hours_per_week IS NOT NULL THEN
      v_epikrise := v_epikrise || 'Arbeidstimer: ' || v_anamnesis.work_hours_per_week || ' timer/uke. ';
    END IF;

    IF v_anamnesis.exercise_frequency IS NOT NULL THEN
      v_epikrise := v_epikrise || 'Trening: ' || v_anamnesis.exercise_frequency;
      IF v_anamnesis.exercise_types IS NOT NULL THEN
        v_epikrise := v_epikrise || ' (' || array_to_string(v_anamnesis.exercise_types, ', ') || ')';
      END IF;
      v_epikrise := v_epikrise || '. ';
    END IF;

    IF v_anamnesis.ergonomic_issues IS NOT NULL THEN
      v_epikrise := v_epikrise || 'Ergonomi: ' || v_anamnesis.ergonomic_issues || '. ';
    END IF;
    v_epikrise := v_epikrise || E'\n\n';
  END IF;

  -- Patient Concerns & Goals
  IF v_anamnesis.patient_concerns IS NOT NULL OR v_anamnesis.treatment_goals IS NOT NULL THEN
    v_epikrise := v_epikrise || E'PASIENTENS PERSPEKTIV:\n';

    IF v_anamnesis.patient_concerns IS NOT NULL THEN
      v_epikrise := v_epikrise || 'Bekymringer: ' || v_anamnesis.patient_concerns || '. ';
    END IF;

    IF v_anamnesis.treatment_goals IS NOT NULL THEN
      v_epikrise := v_epikrise || 'Behandlingsmål: ' || v_anamnesis.treatment_goals || '. ';
    END IF;
    v_epikrise := v_epikrise || E'\n\n';
  END IF;

  -- Additional Information
  IF v_anamnesis.additional_information IS NOT NULL THEN
    v_epikrise := v_epikrise || E'ANNET:\n';
    v_epikrise := v_epikrise || v_anamnesis.additional_information || E'\n\n';
  END IF;

  -- Footer
  v_epikrise := v_epikrise || E'════════════════════════════════════════\n';
  v_epikrise := v_epikrise || 'Anamnese fullført: ' || TO_CHAR(v_anamnesis.completed_date, 'DD.MM.YYYY HH24:MI') || E'\n';
  v_epikrise := v_epikrise || 'Metode: ' || v_anamnesis.intake_method || E'\n';

  RETURN v_epikrise;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. QUICK INTAKE HELPER FUNCTION
-- =====================================================

-- Simple function for common case: basic anamnesis entry
CREATE OR REPLACE FUNCTION quick_anamnesis_insert(
  p_patient_id UUID,
  p_encounter_id UUID,
  p_chief_complaint TEXT,
  p_duration VARCHAR DEFAULT NULL,
  p_onset_type VARCHAR DEFAULT NULL,
  p_other_details JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_anamnesis_id UUID;
BEGIN
  INSERT INTO patient_anamnesis (
    patient_id,
    encounter_id,
    template_id,
    chief_complaint,
    chief_complaint_duration,
    onset_type
  ) VALUES (
    p_patient_id,
    p_encounter_id,
    (SELECT id FROM anamnesis_templates WHERE template_code = 'CHIRO_COMPREHENSIVE'),
    p_chief_complaint,
    p_duration,
    p_onset_type
  )
  RETURNING id INTO v_anamnesis_id;

  -- Update with additional details if provided
  IF p_other_details IS NOT NULL AND p_other_details::text != '{}' THEN
    -- Additional update logic here based on JSONB structure
    NULL;
  END IF;

  RETURN v_anamnesis_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. ANAMNESIS CHECKLIST VIEW
-- =====================================================

-- View to see which sections are completed for each anamnesis
CREATE OR REPLACE VIEW anamnesis_completion_status AS
SELECT
  pa.id AS anamnesis_id,
  pa.patient_id,
  pa.encounter_id,
  pa.completed_date,

  -- Section completion flags
  (pa.chief_complaint IS NOT NULL) AS has_chief_complaint,
  (pa.symptom_onset_date IS NOT NULL OR pa.onset_type IS NOT NULL) AS has_symptom_history,
  (pa.aggravating_factors IS NOT NULL OR pa.relieving_factors IS NOT NULL) AS has_symptom_pattern,
  (pa.has_headache OR pa.has_dizziness OR pa.has_other_pain) AS has_associated_symptoms,
  (pa.sensory_disturbances IS NOT NULL OR pa.motor_weakness IS NOT NULL) AS has_neuro_screen,
  (pa.energy_level IS NOT NULL OR pa.sleep_quality IS NOT NULL) AS has_systemic_review,
  (pa.previous_treatment IS NOT NULL OR pa.medications IS NOT NULL) AS has_medical_history,
  (pa.occupation IS NOT NULL OR pa.exercise_frequency IS NOT NULL) AS has_lifestyle,
  (pa.patient_concerns IS NOT NULL OR pa.treatment_goals IS NOT NULL) AS has_patient_perspective,

  -- Overall completion percentage
  (
    (CASE WHEN pa.chief_complaint IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN pa.symptom_onset_date IS NOT NULL OR pa.onset_type IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN pa.aggravating_factors IS NOT NULL OR pa.relieving_factors IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN pa.has_headache OR pa.has_dizziness OR pa.has_other_pain THEN 1 ELSE 0 END) +
    (CASE WHEN pa.sensory_disturbances IS NOT NULL OR pa.motor_weakness IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN pa.energy_level IS NOT NULL OR pa.sleep_quality IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN pa.previous_treatment IS NOT NULL OR pa.medications IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN pa.occupation IS NOT NULL OR pa.exercise_frequency IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN pa.patient_concerns IS NOT NULL OR pa.treatment_goals IS NOT NULL THEN 1 ELSE 0 END)
  ) * 100.0 / 9 AS completion_percentage,

  pa.review_status
FROM patient_anamnesis pa;

-- =====================================================
-- USAGE EXAMPLES
-- =====================================================

-- Example 1: Insert basic anamnesis
-- INSERT INTO patient_anamnesis (
--   patient_id, encounter_id, chief_complaint, onset_type
-- ) VALUES (
--   'patient-uuid', 'encounter-uuid', 'Nakkesmerter med utstråling til høyre arm', 'gradvis'
-- );

-- Example 2: Generate epikrise
-- SELECT generate_anamnesis_epikrise('anamnesis-uuid');

-- Example 3: Quick insert
-- SELECT quick_anamnesis_insert(
--   'patient-uuid',
--   'encounter-uuid',
--   'Svimmelhet ved hodebevegelser',
--   '3 uker',
--   'akutt'
-- );

-- Example 4: Check completion status
-- SELECT * FROM anamnesis_completion_status WHERE patient_id = 'patient-uuid';

COMMENT ON TABLE patient_anamnesis IS 'Comprehensive patient history intake with automated epikrise generation';
COMMENT ON FUNCTION generate_anamnesis_epikrise IS 'Auto-generates Norwegian medical summary text from structured anamnesis data';
