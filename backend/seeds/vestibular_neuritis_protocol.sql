-- Vestibular Neuritis Clinical Protocol & GP Letter Templates
-- Based on Norwegian treatment guidelines
-- Source: Frederik K. Goplen, Kompetansesenter for vestibulære sykdommer, Haukeland Universitetssykehus
-- References: Tidsskriftet 2008, ISBN 978-82-991877-9-4

-- ============================================================================
-- VESTIBULAR NEURITIS DIAGNOSIS & TREATMENT PROTOCOL
-- ============================================================================

-- Add to educational resources
INSERT INTO educational_resources (
  resource_type, resource_code, title, description,
  backrom_url, content_type, skill_level, topics, evidence_level,
  last_reviewed_date, is_active
) VALUES
('CONDITION', 'VESTIBULAR_NEURITIS', 'Vestibularisnevritt - Diagnosis & Corticosteroid Treatment',
 'Norwegian treatment protocol for vestibular neuritis with corticosteroid guidelines. Critical: Treatment must start within 72 hours of symptom onset. ICD-10: H81.2',
 'www.theBackROM.com/education/Clickup/vestibular-neuritis',
 'PROTOCOL', 'ADVANCED',
 ARRAY['Vestibular neuritis', 'Vestibularisnevritt', 'Corticosteroid treatment', 'Acute vertigo', 'Caloric testing', 'GP referral'],
 'HIGH',
 '2024-11-22',
 true
);

-- ============================================================================
-- GP LETTER TEMPLATES
-- ============================================================================

-- Create GP letter templates table if not exists
CREATE TABLE IF NOT EXISTS gp_letter_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Template metadata
  template_code VARCHAR(50) UNIQUE NOT NULL,
  template_name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Letter structure
  subject_line TEXT NOT NULL,
  greeting_template TEXT DEFAULT 'Kjære kollega,',
  body_template TEXT NOT NULL,
  closing_template TEXT DEFAULT 'Med vennlig hilsen,',

  -- Clinical context
  diagnosis_codes TEXT[], -- ICD-10 codes this template is for
  urgency_level VARCHAR(20) CHECK (urgency_level IN ('ROUTINE', 'URGENT', 'EMERGENCY')),

  -- Template variables
  required_variables TEXT[], -- Variables that must be populated
  optional_variables TEXT[],

  -- Educational links
  reference_links JSONB,

  -- System flags
  is_system BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  language VARCHAR(10) DEFAULT 'NO',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert Vestibular Neuritis GP Letter Template
INSERT INTO gp_letter_templates (
  organization_id, template_code, template_name, description,
  subject_line, greeting_template, body_template, closing_template,
  diagnosis_codes, urgency_level,
  required_variables, optional_variables,
  reference_links, is_system, is_active, language
) VALUES (
  NULL, -- System template
  'VESTIBULAR_NEURITIS_REFERRAL',
  'Vestibularisnevritt - Hastehenvisning til Fastlege',
  'Urgent referral letter for suspected vestibular neuritis requiring corticosteroid treatment within 72 hours of symptom onset.',
  'HASTE: Vestibularisnevritt - Kortikosteroidbehandling innen 72 timer',
  'Kjære kollega,',
  '## Pasientinformasjon
Navn: {{patient_name}}
Fødselsdato: {{patient_dob}}
Konsultasjonsdato: {{consultation_date}}

## Diagnose
**ICD-10: H81.2 - Vestibularisnevritt**

## Kliniske Funn

### Anamnese
- **Symptomdebut**: {{symptom_onset_date}} ({{hours_since_onset}} timer siden)
- **Symptomer**: Akutt oppstått spontan, kontinuerlig vertigo
- **Tidligere episoder**: {{previous_episodes}}
- **Nevrologiske symptomer**: {{neurological_symptoms}}
- **Hørselstap**: {{hearing_loss}}
- **Kvalme/oppkast**: {{nausea_vomiting}}

### Objektive Funn
- **Spontannystagmus**: {{spontaneous_nystagmus}}
  - Retning: {{nystagmus_direction}}
  - Intensitet: {{nystagmus_intensity}}
  - Visuell suppresjon: {{visual_suppression}}

- **Hodeskjøvetest (Head Impulse Test)**: {{head_impulse_test}}
  - Høyre: {{hit_right}}
  - Venstre: {{hit_left}}
  - Catch-up saccade: {{catch_up_side}}

{{#if_vng_performed}}
### VNG-funn (Videonystagmografi)
- Spontan nystagmus: {{vng_spontaneous}}
- Gaze testing: {{vng_gaze}}
- Sakkader: {{vng_saccades}}
- Pursuits: {{vng_pursuits}}
- OPK: {{vng_opk}}
{{/if_vng_performed}}

{{#if_caloric_performed}}
### Kalorisk Prøve
- **Unilateral Weakness (UW)**: {{caloric_uw}}% {{affected_ear}}
- Høyre varmt: {{right_warm}} deg/s
- Venstre varmt: {{left_warm}} deg/s
- Høyre kaldt: {{right_cold}} deg/s
- Venstre kaldt: {{left_cold}} deg/s
- **Directional Preponderance (DP)**: {{caloric_dp}}%

**Konklusjon kalorisk**: {{caloric_interpretation}}
{{/if_caloric_performed}}

### Nevrologisk Undersøkelse
- Cerebellare tegn: {{cerebellar_signs}}
- Kranialnerveundersøkelse: {{cranial_nerves}}
- Romberg: {{romberg}}
- Gange: {{gait}}

### Ekskludert
- ✓ BPPV (Dix-Hallpike negativ)
- ✓ Cerebrale tegn (ingen fokale nevrologiske utfall)
- ✓ Sentrale årsaker ({{central_exclusion_details}})

## Vurdering
Pasient oppfyller kriteriene for vestibularisnevritt og kortikosteroidbehandling:

**Inklusjonskriterier (alle oppfylt):**
{{#criteria_checklist}}
- ✓ Akutt oppstått spontan, kontinuerlig vertigo (uten nevrologiske symptomer)
- ✓ Ikke tidligere spontan vertigo
- ✓ Alder 18–70 år ({{patient_age}} år)
- ✓ Tydelig spontannystagmus
{{#if_caloric_performed}}
- ✓ Nedsatt kalorisk respons fra {{affected_ear}} øre (UW: {{caloric_uw}}%)
{{/if_caloric_performed}}
- ✓ Ingen kontraindikasjon mot kortikosteroidbehandling
- ✓ Innen 72-timers vindu ({{hours_since_onset}} timer)
{{/criteria_checklist}}

**Kontraindikasjoner sjekket:**
- Diabetes mellitus ukontrollert: {{contraindication_diabetes}}
- Aktiv infeksjon: {{contraindication_infection}}
- Magesår: {{contraindication_ulcer}}
- Psykose: {{contraindication_psychosis}}
- Nylig vaksinasjon (levende vaksine): {{contraindication_vaccine}}

## Behandlingsforslag (HASTER - INNEN 72 TIMER!)

### Anbefalt kortikosteroidbehandling:

**Akuttfase (hvis mulig på sykehus):**
- **Dag 1**: Deksametason 8 mg i.v. umiddelbart når diagnosen er bekreftet klinisk

**Oppfølgende behandling:**
- **Dag 2–5**: Prednisolon 60 mg daglig
- **Dag 6**: Prednisolon 50 mg
- **Dag 7**: Prednisolon 40 mg
- **Dag 8**: Prednisolon 30 mg
- **Dag 9**: Prednisolon 20 mg
- **Dag 10**: Prednisolon 10 mg
- **Dag 11**: Prednisolon 0 mg (seponering)

**Alternativ protokoll (poliklinisk):**
- **Dag 1–5**: Prednisolon 60 mg daglig (dag 1 kan ev. erstattes med deksametason 8 mg i.v.)
- **Fra dag 6**: Nedtrapping 10 mg per dag til seponering dag 11

### Supportiv behandling:
- Ondansetron/metoklopramid ved kvalme
- Væske ved dehydrering
- **IKKE** meklizin eller dimenhydrinat (forsinker sentral kompensasjon)

### Vestibulær rehabilitering:
- **Start tidlig** (dag 2-3) med enkle balanseøvelser
- **VOR-øvelser** (vestibulo-okulær refleks trening)
- Gradvis progresjon av mobilitet
- Henvisning til fysioterapeut med vestibulær kompetanse ved behov

## Oppfølging

### Anbefalt oppfølging:
1. **Dag 7–10**: Kontroll hos fastlege
   - Vurder nedtrappingsforløp
   - Bivirkninger til kortikosteroider
   - Funksjonsforbedring

2. **Uke 4–6**: Repetert kalorisk prøve (hvis tilgjengelig)
   - Vurder restitusjon av vestibulær funksjon
   - Dokumenter UW-endring

3. **3 måneder**: Funksjonsvurdering
   - Dizziness Handicap Inventory (DHI)
   - Gjenværende symptomer
   - Arbeidsfunksjon

### Red flags for rehenvisning til ØNH/nevrolog:
- Progresjon av symptomer til tross for behandling
- Nye nevrologiske utfall
- Vedvarende kraftig svimmelhet >4 uker
- Tilbakefall av symptomer
- Hørselstap (indikerer labyrinthitis, ikke ren vestibularisnevritt)

## Prognose

**Forventet forløp:**
- Flertall av pasienter blir tilnærmet asymptomatiske
- Noen utvikler kronisk svimmelhet (opptil 50 % har restsymptomer)
- Kortikosteroidbehandling innen 72 timer bedrer sjansen for full restitusjon
- Vestibulær rehabilitering akselererer sentral kompensasjon

**Sykmeldingsvurdering:**
- **Akuttfase**: 100% sykemelding i 1–2 uker (minimum)
- **Gradert tilbakeføring**: Avhengig av yrke og restfunksjon
- **Totalt forventet**: 3–8 uker (individuelt)

## Pasientinformasjon gitt
- ✓ Forventet forløp og prognose
- ✓ Viktighet av tidlig mobilisering
- ✓ Ikke kjøre bil under akuttfasen
- ✓ Vestibulære rehabiliteringsøvelser
- ✓ Røykeslutt anbefalt (forbedrer vestibulær kompensasjon)
- ✓ Når søke akutt hjelp (forverring, nye symptomer)

## Referanser
1. Goplen FK. Svimmelhet Diagnostikk og behandling. 2009. ISBN 978-82-991877-9-4
2. Goplen FK, et al. Kortikosteroidbehandling ved vestibularisnevritt. Tidsskr Nor Legeforen 2008; 128:2062-3
3. Kompetansesenter for vestibulære sykdommer, Haukeland Universitetssykehus

## Vedlegg
{{#if_attachments}}
- Kalorisk prøve rapport
- VNG-rapport
- Pasientinformasjonsbrosjyre
{{/if_attachments}}

---

**HASTER: Behandling må igangsettes innen 72 timer fra symptomdebut!**

{{#time_critical_warning}}
⚠️ OBS: Det er nå {{hours_since_onset}} timer siden symptomdebut.
{{#if_approaching_72h}}
**KRITISK TIDSFRIST** - Kortikosteroidbehandling må startes UMIDDELBART!
{{/if_approaching_72h}}
{{/time_critical_warning}}',
  'Med vennlig hilsen,

{{clinician_name}}
{{clinician_title}}
{{clinic_name}}
Telefon: {{clinic_phone}}
E-post: {{clinic_email}}',
  ARRAY['H81.2'],
  'URGENT',
  ARRAY[
    'patient_name', 'patient_dob', 'consultation_date', 'symptom_onset_date',
    'hours_since_onset', 'spontaneous_nystagmus', 'nystagmus_direction',
    'head_impulse_test', 'catch_up_side', 'affected_ear', 'patient_age',
    'clinician_name', 'clinic_name'
  ],
  ARRAY[
    'previous_episodes', 'neurological_symptoms', 'hearing_loss', 'nausea_vomiting',
    'vng_spontaneous', 'vng_gaze', 'vng_saccades', 'vng_pursuits', 'vng_opk',
    'caloric_uw', 'caloric_dp', 'right_warm', 'left_warm', 'right_cold', 'left_cold',
    'cerebellar_signs', 'cranial_nerves', 'romberg', 'gait',
    'contraindication_diabetes', 'contraindication_infection'
  ],
  '{
    "norwegian_guidelines": "https://tidsskriftet.no/sites/default/files/pdf2008--2062-3.pdf",
    "educational_resource": "www.theBackROM.com/education/Clickup/vestibular-neuritis",
    "haukeland_protocol": "Kompetansesenter for vestibulære sykdommer, Haukeland Universitetssykehus"
  }'::jsonb,
  true, -- is_system
  true, -- is_active
  'NO'  -- Norwegian
);

-- ============================================================================
-- VESTIBULAR NEURITIS CLINICAL DECISION SUPPORT
-- ============================================================================

CREATE TABLE IF NOT EXISTS clinical_decision_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Rule metadata
  rule_code VARCHAR(50) UNIQUE NOT NULL,
  rule_name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Clinical context
  condition_codes TEXT[], -- ICD-10

  -- Criteria
  inclusion_criteria JSONB NOT NULL,
  exclusion_criteria JSONB NOT NULL,

  -- Recommendations
  recommendations JSONB NOT NULL,

  -- Time constraints
  time_critical BOOLEAN DEFAULT false,
  time_window_hours INTEGER,

  -- Evidence
  evidence_level VARCHAR(10),
  reference_citation TEXT,

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert Vestibular Neuritis Clinical Decision Rule
INSERT INTO clinical_decision_rules (
  rule_code, rule_name, description, condition_codes,
  inclusion_criteria, exclusion_criteria, recommendations,
  time_critical, time_window_hours, evidence_level, reference_citation, is_active
) VALUES (
  'VESTIBULAR_NEURITIS_CORTICOSTEROID',
  'Vestibularisnevritt - Kortikosteroidbehandling Kriterier',
  'Evidence-based criteria for corticosteroid treatment in vestibular neuritis. Based on Norwegian national guidelines from Haukeland Universitetssykehus.',
  ARRAY['H81.2'],
  '{
    "criteria": [
      {
        "criterion": "Akutt oppstått spontan, kontinuerlig vertigo",
        "required": true,
        "details": "Uten nevrologiske symptomer (ingen fokale utfall)"
      },
      {
        "criterion": "Ikke tidligere spontan vertigo",
        "required": true,
        "details": "Første episode av kontinuerlig vertigo"
      },
      {
        "criterion": "Alder 18–70 år",
        "required": true,
        "min_age": 18,
        "max_age": 70
      },
      {
        "criterion": "Initialt behandles som inneliggende på sykehus",
        "required": false,
        "note": "Anbefalt men ikke absolutt krav"
      },
      {
        "criterion": "Tydelig spontannystagmus",
        "required": true,
        "details": "Observert ved undersøkelse, fortrinnsvis med VNG-briller"
      },
      {
        "criterion": "Nedsatt kalorisk respons",
        "required": true,
        "details": "Fra det aktuelle øret. UW >25% indikerer signifikant svakhet",
        "threshold": "UW >25%"
      },
      {
        "criterion": "Ingen kontraindikasjon mot kortikosteroidbehandling",
        "required": true,
        "check_contraindications": [
          "Ukontrollert diabetes mellitus",
          "Aktiv infeksjon (tuberkulose, soppinfeksjoner)",
          "Magesår (aktivt eller nylig)",
          "Psykose",
          "Nylig vaksinasjon med levende vaksine"
        ]
      },
      {
        "criterion": "Kan begynne kortikosteroidbehandling innen 72 timer",
        "required": true,
        "time_critical": true,
        "window_hours": 72,
        "details": "Fra symptomdebut. Effekt dokumentert kun innen dette vinduet"
      },
      {
        "criterion": "Kan følges opp med gjentatt kalorisk prøve",
        "required": false,
        "details": "Anbefalt for å dokumentere restitusjon"
      },
      {
        "criterion": "Kan følges opp med dokumentasjon av symptomgrad",
        "required": true,
        "tools": ["DHI (Dizziness Handicap Inventory)", "VAS for svimmelhet"]
      }
    ]
  }'::jsonb,
  '{
    "absolute_contraindications": [
      {
        "condition": "Systemisk soppinfeksjon",
        "icd10": "B37-B49"
      },
      {
        "condition": "Ukontrollert diabetes (HbA1c >9%)",
        "note": "Relativ - vurder individuelt"
      },
      {
        "condition": "Aktivt magesår",
        "icd10": "K25-K27"
      },
      {
        "condition": "Psykose (pågående eller tidligere episoder)",
        "note": "Kortikosteroider kan utløse/forverre"
      },
      {
        "condition": "Nylig levende vaksine (<4 uker)",
        "examples": ["MMR", "Varicella", "Gulfeber"]
      }
    ],
    "relative_contraindications": [
      {
        "condition": "Hypertensjon ukontrollert",
        "management": "Overvåk blodtrykk nøye under behandling"
      },
      {
        "condition": "Osteoporose",
        "management": "Kort behandlingsforløp (11 dager) gir lav risiko"
      },
      {
        "condition": "Glaukom",
        "management": "Monitorere intraokulært trykk"
      },
      {
        "condition": "Graviditet",
        "note": "Kategori C - vurder nytte/risiko individuelt"
      }
    ],
    "exclude_other_diagnoses": [
      {
        "diagnosis": "Labyrinthitis",
        "key_difference": "Hørselstap er tilstede ved labyrinthitis",
        "icd10": "H83.0"
      },
      {
        "diagnosis": "BPPV",
        "key_difference": "Kortvarig vertigo, positiv Dix-Hallpike",
        "icd10": "H81.1"
      },
      {
        "diagnosis": "Meniere disease",
        "key_difference": "Episodisk vertigo, hørselstap, tinnitus",
        "icd10": "H81.0"
      },
      {
        "diagnosis": "Cerebellar stroke",
        "key_difference": "Fokale nevrologiske tegn, abnorm gange, cerebellare tegn",
        "icd10": "I63.4",
        "red_flag": "URGENT - CT/MR cerebrum"
      },
      {
        "diagnosis": "Vestibular migraine",
        "key_difference": "Migrenehodepine, episodisk, ofte tidligere migreneanamnese",
        "icd10": "H81.4"
      }
    ]
  }'::jsonb,
  '{
    "treatment_protocol": {
      "first_choice": {
        "name": "Deksametason i.v. + Prednisolon",
        "regimen": [
          {
            "day": 1,
            "medication": "Deksametason",
            "dose": "8 mg",
            "route": "i.v.",
            "timing": "Umiddelbart ved klinisk diagnose",
            "note": "Helst på sykehus"
          },
          {
            "days": "2-5",
            "medication": "Prednisolon",
            "dose": "60 mg",
            "route": "p.o.",
            "timing": "Morgen (reduserer søvnforstyrrelser)"
          },
          {
            "day": 6,
            "medication": "Prednisolon",
            "dose": "50 mg",
            "route": "p.o."
          },
          {
            "day": 7,
            "dose": "40 mg"
          },
          {
            "day": 8,
            "dose": "30 mg"
          },
          {
            "day": 9,
            "dose": "20 mg"
          },
          {
            "day": 10,
            "dose": "10 mg"
          },
          {
            "day": 11,
            "dose": "0 mg",
            "note": "Seponering"
          }
        ]
      },
      "alternative_outpatient": {
        "name": "Prednisolon monoterapi",
        "regimen": [
          {
            "days": "1-5",
            "medication": "Prednisolon",
            "dose": "60 mg",
            "route": "p.o.",
            "note": "Dag 1 kan evt. erstattes med deksametason 8 mg i.v."
          },
          {
            "days": "6-11",
            "taper": "Nedtrapping 10 mg per dag"
          }
        ]
      }
    },
    "supportive_care": {
      "antiemetics": {
        "options": [
          "Ondansetron 4-8 mg ved behov",
          "Metoklopramid 10 mg ved behov"
        ],
        "avoid": [
          "Meklizin (Postafen) - forsinker sentral kompensasjon",
          "Dimenhydrinat - forsinker sentral kompensasjon"
        ]
      },
      "hydration": {
        "indication": "Ved vedvarende oppkast og dehydrering",
        "route": "i.v. væske ved behov"
      }
    },
    "vestibular_rehabilitation": {
      "start_timing": "Dag 2-3 (tidlig mobilisering)",
      "initial_exercises": [
        "VOR øvelser (X1 viewing)",
        "Statisk balanse på fast underlag",
        "Gange med visuell fixation"
      ],
      "progression": "Gradvis økning av vanskelighetsgrad",
      "referral": "Fysioterapeut med vestibulær kompetanse ved langvarige symptomer"
    },
    "follow_up_plan": {
      "day_7_10": {
        "provider": "Fastlege",
        "assess": [
          "Nedtrappingsforløp",
          "Bivirkninger kortikosteroider",
          "Funksjonsforbedring",
          "Arbeidsfunksjon"
        ]
      },
      "week_4_6": {
        "test": "Repetert kalorisk prøve (hvis tilgjengelig)",
        "purpose": "Dokumentere restitusjon av vestibulær funksjon"
      },
      "month_3": {
        "assess": [
          "DHI score",
          "Gjenværende symptomer",
          "Arbeidsfunksjon",
          "Livskvalitet"
        ]
      }
    },
    "sick_leave_guidance": {
      "acute_phase": "100% i 1-2 uker (minimum)",
      "gradual_return": "Avhengig av yrke og restfunksjon",
      "total_expected": "3-8 uker (individuelt)",
      "considerations": [
        "Yrke med høydekrav: Lengre sykemelding",
        "Bilkjøring profesjonelt: Må være symptomfri",
        "Sikkerhetsrisiko på arbeidsplass: Individuell vurdering"
      ]
    }
  }'::jsonb,
  true, -- time_critical
  72, -- Must start within 72 hours
  'HIGH',
  'Goplen FK, et al. Kortikosteroidbehandling ved vestibularisnevritt. Tidsskr Nor Legeforen 2008; 128:2062-3. Goplen FK. Svimmelhet Diagnostikk og behandling. 2009. ISBN 978-82-991877-9-4',
  true
);

-- ============================================================================
-- AUTOMATIC LETTER GENERATION TRIGGER
-- ============================================================================

-- Function to generate GP letter when vestibular neuritis is diagnosed
CREATE OR REPLACE FUNCTION generate_vestibular_neuritis_letter(
  p_patient_id UUID,
  p_encounter_id UUID,
  p_caloric_uw DECIMAL,
  p_affected_ear VARCHAR,
  p_symptom_onset TIMESTAMP
)
RETURNS TEXT AS $$
DECLARE
  v_hours_since_onset INTEGER;
  v_letter_body TEXT;
  v_patient RECORD;
  v_urgency_warning TEXT;
BEGIN
  -- Calculate hours since onset
  v_hours_since_onset := EXTRACT(EPOCH FROM (NOW() - p_symptom_onset)) / 3600;

  -- Get patient info
  SELECT first_name, last_name, date_of_birth,
         EXTRACT(YEAR FROM AGE(date_of_birth)) as age
  INTO v_patient
  FROM patients
  WHERE id = p_patient_id;

  -- Check if within 72-hour window
  IF v_hours_since_onset > 72 THEN
    v_urgency_warning := E'\n\n⚠️ ADVARSEL: Det har gått ' || v_hours_since_onset || ' timer siden symptomdebut.\n' ||
                         'Kortikosteroidbehandling er best dokumentert når startet innen 72 timer.\n' ||
                         'Vurder individuelt om behandling fortsatt er indisert.';
  ELSIF v_hours_since_onset > 48 THEN
    v_urgency_warning := E'\n\n⚠️ KRITISK: Kun ' || (72 - v_hours_since_onset) || ' timer igjen av 72-timers vinduet!\n' ||
                         'KORTIKOSTEROIDBEHANDLING MÅ STARTES UMIDDELBART!';
  ELSE
    v_urgency_warning := E'\n\nTid siden symptomdebut: ' || v_hours_since_onset || ' timer (innenfor 72-timers vinduet)';
  END IF;

  -- Generate letter (simplified - full template would use actual template system)
  v_letter_body := 'HASTE: Vestibularisnevritt - Kortikosteroidbehandling' || E'\n\n' ||
                   'Pasient: ' || v_patient.first_name || ' ' || v_patient.last_name || E'\n' ||
                   'Alder: ' || v_patient.age || ' år' || E'\n' ||
                   'Diagnose: ICD-10 H81.2 - Vestibularisnevritt' || E'\n\n' ||
                   'Kalorisk prøve: UW ' || p_caloric_uw || '% (' || p_affected_ear || ' øre påvirket)' || E'\n' ||
                   v_urgency_warning || E'\n\n' ||
                   'BEHANDLINGSFORSLAG:' || E'\n' ||
                   '- Dag 1: Deksametason 8 mg i.v. (eller Prednisolon 60 mg p.o.)' || E'\n' ||
                   '- Dag 2-5: Prednisolon 60 mg daglig' || E'\n' ||
                   '- Dag 6-11: Nedtrapping 10 mg per dag til seponering' || E'\n\n' ||
                   'Referanse: Goplen FK, Haukeland Universitetssykehus';

  RETURN v_letter_body;
END;
$$ LANGUAGE plpgsql;

-- Create index for faster letter generation
CREATE INDEX IF NOT EXISTS idx_gp_letters_diagnosis ON gp_letter_templates(diagnosis_codes);
CREATE INDEX IF NOT EXISTS idx_clinical_rules_condition ON clinical_decision_rules(condition_codes);
