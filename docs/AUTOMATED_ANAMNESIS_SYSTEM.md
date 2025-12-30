# Automated Anamnesis System - Clinical Documentation

**ChiroClickCRM Automated Patient History System**
**Created:** 2025-11-22
**Educational Platform:** www.theBackROM.com/education/Clickup

---

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Anamnesis Template Structure](#anamnesis-template-structure)
4. [Data Collection Workflow](#data-collection-workflow)
5. [Auto-Generated Epikrise](#auto-generated-epikrise)
6. [API Integration](#api-integration)
7. [Clinical Use Cases](#clinical-use-cases)
8. [Best Practices](#best-practices)

---

## Overview

The Automated Anamnesis System transforms unstructured patient history collection into a **structured, comprehensive, and auto-documented** clinical intake process.

### Key Features

✅ **Structured Data Collection** - Comprehensive checklist-based intake
✅ **Auto-Generated Epikrise** - Norwegian medical summary text automatically created
✅ **Completeness Tracking** - Visual indicators showing which sections are filled
✅ **Multiple Input Methods** - Clinician interview, patient forms, digital intake, phone
✅ **Template-Based** - Customizable for different specialties
✅ **SOAP Integration** - Feeds directly into encounter documentation
✅ **Red Flag Detection** - Automatic alerts for concerning symptoms

### Benefits

**For Clinicians:**
- Reduces documentation time by 50%+
- Ensures no critical questions are missed
- Generates professional Norwegian medical summaries
- Improves clinical decision-making with structured data
- Facilitates pattern recognition across patient population

**For Patients:**
- Clear, comprehensive intake process
- Can complete forms digitally before appointment
- Better understanding of their condition through structured questioning
- Consistent quality of care

**For Clinic Administration:**
- Standardized documentation across all clinicians
- Easier quality audits
- Better data for research and outcomes tracking
- Reduced medico-legal risk

---

## System Architecture

### Database Tables

#### 1. `anamnesis_templates`

Stores reusable anamnesis templates for different specialties.

```sql
CREATE TABLE anamnesis_templates (
  id UUID PRIMARY KEY,
  template_code VARCHAR(50) UNIQUE NOT NULL,
  template_name VARCHAR(200) NOT NULL,
  specialty VARCHAR(100),  -- 'chiropractic', 'physiotherapy', 'general'
  sections JSONB NOT NULL,  -- Template structure
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true
);
```

**Current Templates:**
- `CHIRO_COMPREHENSIVE` - Comprehensive chiropractic intake (9 sections, 40+ fields)

#### 2. `patient_anamnesis`

Stores individual patient history responses.

```sql
CREATE TABLE patient_anamnesis (
  id UUID PRIMARY KEY,
  patient_id UUID NOT NULL,
  encounter_id UUID,
  template_id UUID REFERENCES anamnesis_templates(id),

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
  sensory_disturbances JSONB,
  motor_weakness JSONB,
  spasms_cramps JSONB,
  coordination_issues BOOLEAN DEFAULT false,
  coordination_details TEXT,

  -- SYSTEMIC REVIEW
  energy_level INTEGER CHECK (energy_level BETWEEN 0 AND 10),
  sleep_quality INTEGER CHECK (sleep_quality BETWEEN 0 AND 10),
  sleep_issues TEXT,
  digestion_issues TEXT,
  weight_change VARCHAR(50),
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
  intake_method VARCHAR(50) DEFAULT 'clinician_interview',
  completed_by UUID,
  review_status VARCHAR(50) DEFAULT 'pending',
  reviewed_by UUID,
  reviewed_at TIMESTAMP
);
```

---

## Anamnesis Template Structure

### CHIRO_COMPREHENSIVE Template

This comprehensive template includes 9 major sections with 40+ fields.

#### Section 1: Hovedårsak til Konsultasjon (Chief Complaint)

**Fields:**
- **chief_complaint** (required) - Free text description
- **duration** (required) - How long symptoms have been present

**Purpose:** Establish the primary reason for consultation

**Example:**
```
Chief Complaint: "Nakkesmerter med utstråling til høyre arm"
Duration: "3 uker"
```

#### Section 2: Symptomhistorie (Symptom History)

**Fields:**
- **onset_date** (required) - When symptoms began
- **onset_type** (required) - akutt / gradvis / ukjent
- **pre_onset** - Any illness or trauma before symptom onset

**Purpose:** Understand symptom timeline and potential causative events

**Red Flags:**
- Acute onset with trauma → Consider fracture, ligament injury
- Gradual onset without clear cause → Consider degenerative, systemic

#### Section 3: Symptommønster (Symptom Pattern)

**Fields:**
- **aggravating_factors** (checkboxes) - What makes symptoms worse
  - sitting, standing, walking, bending_forward, bending_backward
  - rotation_left, rotation_right, lifting, coughing_sneezing
  - stress, weather_changes, morning, evening, activity, rest
- **relieving_factors** (checkboxes) - What makes symptoms better
  - rest, movement, heat, cold, medication, stretching
  - lying_down, position_change, massage
- **time_worst** - When during the day symptoms are worst
- **time_best** - When during the day symptoms are least

**Purpose:** Identify mechanical patterns and potential diagnoses

**Clinical Significance:**
- **Worse with sitting → Discogenic pain** (increased intradiscal pressure)
- **Worse with extension → Facet joint pain**
- **Worse with flexion → Disc pathology**
- **Worse in morning → Inflammatory component**
- **Worse with coughing/sneezing → Increased intrathecal pressure** (disc, radiculopathy)

#### Section 4: Tilhørende Symptomer (Associated Symptoms)

**Fields:**
- **other_pain** (body chart) - Other pain locations
- **headache** (yes/no + details) - Type, location, frequency
- **dizziness** (yes/no + details) - Type, triggers

**Purpose:** Screen for multi-level involvement, referred pain, systemic issues

**Red Flags:**
- Headache + dizziness + neck pain → Consider vertebral artery insufficiency, cervicogenic headache
- Multiple joint pain → Systemic inflammatory condition

#### Section 5: Nevrologisk Screening (Neurological Screen)

**Fields:**
- **sensory_disturbances** (body regions: ansikt, kropp, øvre, nedre)
  - Types: nummenhet, prikking, brennende, redusert følelse
- **motor_weakness** (body regions)
- **spasms_cramps** (body regions)
- **coordination_issues** (yes/no + details)

**Purpose:** Identify nerve root compression, spinal cord involvement, CNS pathology

**Red Flags:**
- **Bilateral leg symptoms** → Cauda equina syndrome, spinal cord compression
- **Facial numbness + dizziness** → Posterior circulation stroke
- **Progressive weakness** → Myelopathy, motor neuron disease
- **Coordination issues** → Cerebellar dysfunction, vestibular disorder

#### Section 6: Systemisk Gjennomgang (Systems Review)

**Fields:**
- **energy_level** (0-10 scale)
- **sleep_quality** (0-10 scale)
- **sleep_issues** (checkboxes)
  - difficulty_falling_asleep, waking_during_night, early_waking
  - pain_disturbs_sleep, snoring, sleep_apnea
- **digestion_issues** (free text)
- **weight_change** (stable / tap / økning / ukjent)
- **weight_change_amount** (kg)

**Purpose:** Screen for systemic disease, inflammatory conditions

**Red Flags:**
- **Unexplained weight loss** → Cancer, systemic disease
- **Severe fatigue** → Chronic fatigue syndrome, depression, anemia, hypothyroid
- **Night pain disturbing sleep** → Infection, tumor, inflammatory arthropathy

#### Section 7: Medisinsk Historie (Medical History)

**Fields:**
- **previous_treatment** - Prior treatment for this condition
- **medications** (list with dosage)
- **radiological_findings** - X-ray, MRI, CT, ultrasound results
- **past_medical_history** - Previous illnesses, operations
- **family_history** (checkboxes)
  - cancer, heart_disease, diabetes, autoimmune, neurological
  - rheumatoid_arthritis, osteoporosis, mental_health

**Purpose:** Understand treatment history, medication interactions, familial risk

**Clinical Significance:**
- Previous failed conservative treatment → May need imaging or referral
- Anticoagulant medications → Contraindication for manipulation
- Family history of autoimmune → Higher suspicion for rheumatological condition

#### Section 8: Livsstil og Ergonomi (Lifestyle & Ergonomics)

**Fields:**
- **occupation** - Current job
- **work_posture** (checkboxes)
  - sitting_desk, standing, walking, heavy_lifting
  - repetitive_movements, driving, varied
- **work_hours** - Hours per week
- **exercise** (frequency, type, duration)
- **diet** - General description
- **ergonomic_issues** - Workstation problems

**Purpose:** Identify modifiable risk factors, plan preventive strategies

**Clinical Significance:**
- Prolonged sitting + desk work → Postural syndrome
- Heavy lifting occupation → Increased disc injury risk
- Poor ergonomics → Chronic overuse patterns

#### Section 9: Pasientens Perspektiv (Patient Perspective)

**Fields:**
- **concerns** - What are you most worried about?
- **goals** - What do you want to achieve?
- **expectations** - What do you expect from treatment?

**Purpose:** Patient-centered care, realistic goal-setting, therapeutic alliance

**Importance:**
- Addresses patient's illness beliefs
- Identifies barriers to recovery (fear-avoidance)
- Sets realistic expectations
- Improves treatment compliance

---

## Auto-Generated Epikrise

### Function: `generate_anamnesis_epikrise()`

This function automatically generates a comprehensive Norwegian medical summary from structured anamnesis data.

**Usage:**
```sql
SELECT generate_anamnesis_epikrise('anamnesis-uuid');
```

### Example Output

```
ANAMNESE
════════════════════════════════════════

HOVEDÅRSAK TIL KONSULTASJON:
John Doe (45 år) kommer til konsultasjon med: Nakkesmerter med utstråling
til høyre arm. Symptomene har vart i 3 uker.

SYMPTOMDEBUT:
Symptomene debuterte 01.11.2025. Debuten var gradvis. Før debut: Begynte
nytt kontorjobb med mye dataskjermarbeid.

SYMPTOMMØNSTER:
Forverrende faktorer: sitting, rotation_right, coughing_sneezing.
Forbedrende faktorer: movement, stretching, heat. Verst på kveld.
Best på morgen.

TILHØRENDE SYMPTOMER:
Andre smertelokalisasjoner: høyre skulderbladområde. Hodepine: Ja,
occipital hodepine 2-3 ganger per uke. Svimmelhet: Nei.

NEVROLOGISK SCREENING:
Sensoriske forstyrrelser: Prikking i høyre tommel og pekefinger (C6-område).
Ingen motoriske svakheter. Ingen koordinasjonsproblemer.

SYSTEMISK GJENNOMGANG:
Energinivå: 6/10. Søvnkvalitet: 5/10 (pain_disturbs_sleep, waking_during_night).
Vektendring: stabil.

MEDISINSK HISTORIE:
Tidligere behandling: Prøvde massasje hos fysioterapeut for 1 uke siden,
ga kortvarig lindring. Medikamenter: Ibux 400 mg ved behov, Losec 20 mg daglig.
Radiologiske undersøkelser: Ingen. Tidligere sykehistorie: Frisk, ingen operasjoner.

LIVSSTIL OG ERGONOMI:
Yrke: IT-konsulent (sitting_desk, repetitive_movements). Arbeidstimer: 40 timer/uke.
Trening: 2 ganger per uke (løping, styrketrening). Ergonomi: Ny arbeidsstasjon,
skjerm for lavt, mus for langt unna.

PASIENTENS PERSPEKTIV:
Bekymringer: Bekymret for at dette skal bli permanent, frykter at det er
diskusprolaps. Behandlingsmål: Bli kvitt smerter i armen, kunne jobbe
smerte-fritt.

════════════════════════════════════════
Anamnese fullført: 22.11.2025 10:30
Metode: clinician_interview
```

### Epikrise Customization

The `generate_anamnesis_epikrise()` function can be customized:

**Shorter Version (Summary Only):**
```sql
CREATE OR REPLACE FUNCTION generate_anamnesis_summary(p_anamnesis_id UUID)
RETURNS TEXT AS $$
  -- Returns only chief complaint, onset, and key findings
$$;
```

**For Referral Letters:**
```sql
CREATE OR REPLACE FUNCTION generate_referral_anamnesis(
  p_anamnesis_id UUID,
  p_referral_specialty VARCHAR
)
RETURNS TEXT AS $$
  -- Emphasizes findings relevant to referral specialty
$$;
```

---

## Data Collection Workflow

### Workflow 1: Clinician-Led Interview (In-Person)

**Step 1: Start Encounter**
```sql
-- Create new encounter
INSERT INTO encounters (patient_id, encounter_type, status)
VALUES ('patient-uuid', 'initial_consultation', 'in_progress')
RETURNING id;
```

**Step 2: Open Anamnesis Form**
```javascript
// Frontend loads comprehensive template
GET /api/anamnesis/templates/CHIRO_COMPREHENSIVE
```

**Step 3: Collect Responses Section-by-Section**
```javascript
// As clinician interviews patient, fill in sections
// Real-time save to prevent data loss
POST /api/patients/{id}/anamnesis/draft
{
  "section": "chief_complaint",
  "data": {
    "chief_complaint": "Nakkesmerter med utstråling til høyre arm",
    "duration": "3 uker"
  }
}
```

**Step 4: Review Completion Status**
```sql
SELECT * FROM anamnesis_completion_status
WHERE anamnesis_id = 'current-anamnesis-id';

-- Shows:
-- has_chief_complaint: true
-- has_symptom_history: true
-- has_symptom_pattern: false  ← Incomplete
-- completion_percentage: 66.7%
```

**Step 5: Complete Anamnesis**
```sql
UPDATE patient_anamnesis
SET review_status = 'reviewed',
    reviewed_by = 'clinician-uuid',
    reviewed_at = CURRENT_TIMESTAMP
WHERE id = 'anamnesis-uuid';
```

**Step 6: Generate Epikrise**
```sql
SELECT generate_anamnesis_epikrise('anamnesis-uuid');
-- Copy to encounter SOAP note
```

---

### Workflow 2: Patient Digital Intake (Pre-Appointment)

**Step 1: Send Intake Link**
```javascript
// Email or SMS to patient
https://chiroclickcrm.com/patient-intake/{unique-token}
```

**Step 2: Patient Completes Form**
- Patient fills out anamnesis on tablet/phone
- Progress saved automatically
- Can complete over multiple sessions
- Clear progress indicators: "7 of 9 sections complete"

**Step 3: Clinician Reviews Pre-Appointment**
```sql
SELECT * FROM patient_anamnesis
WHERE patient_id = 'patient-uuid'
AND review_status = 'pending'
ORDER BY completed_date DESC
LIMIT 1;
```

**Step 4: Clinician Amends/Clarifies During Appointment**
```sql
UPDATE patient_anamnesis
SET
  dizziness_details = 'Klarifisert: Rotatorisk svimmelhet ved hodebevegelser',
  review_status = 'amended',
  reviewed_by = 'clinician-uuid'
WHERE id = 'anamnesis-uuid';
```

---

### Workflow 3: Quick Intake (Established Patient, New Complaint)

For follow-up visits with new complaints, use quick insert:

```sql
SELECT quick_anamnesis_insert(
  'patient-uuid',
  'encounter-uuid',
  'Ny akutt lumbago etter tunge løft i går',  -- chief_complaint
  '1 dag',                                      -- duration
  'akutt'                                       -- onset_type
);
```

This creates minimal anamnesis record focusing on new complaint while maintaining previous history on file.

---

## Clinical Use Cases

### Use Case 1: Complex Multi-System Patient

**Scenario:** Patient with neck pain, headaches, dizziness, and arm paresthesias

**Anamnesis Captures:**
- Chief complaint: Nakkesmerter
- Associated symptoms: Headache (cervicogenic), dizziness (possibly vertebral artery)
- Neurological: Arm paresthesias (radiculopathy vs TOS)
- Symptom pattern: Worse with rotation, relieved by rest
- Red flags: Combination warrants vertebral artery testing

**Clinical Decision:**
```sql
-- Anamnesis automatically flags for VBI testing
-- Links to PRE_ADJUST_SCREEN battery
SELECT * FROM test_batteries WHERE code = 'PRE_ADJUST_SCREEN';

-- Generates reminder to perform:
-- 1. Blood pressure
-- 2. Romberg test
-- 3. Vertebral Artery Test (CRITICAL)
```

---

### Use Case 2: Screening for Vestibular Neuritis

**Anamnesis Findings:**
- Chief complaint: "Akutt svimmelhet i går formiddag"
- Onset: akutt
- Dizziness details: "Konstant rotatorisk svimmelhet, kvalme, kan ikke gå rett"
- Duration: "<24 timer"

**Auto-Generated Clinical Decision:**
```sql
-- System recognizes pattern and suggests:
-- 1. Caloric testing
-- 2. Generate GP letter if UW >25%
-- 3. Check if within 72-hour window for corticosteroids

SELECT * FROM test_batteries WHERE code = 'CALORIC_BITHERMAL';

-- If positive:
SELECT generate_vestibular_neuritis_letter(...);
```

---

### Use Case 3: Ruling Out Serious Pathology

**Red Flag Detection:**

The system automatically flags concerning patterns:

```javascript
// Red flag detection logic
if (anamnesis.has_night_pain &&
    anamnesis.weight_change === 'tap' &&
    anamnesis.age > 50 &&
    anamnesis.past_medical_history.includes('cancer')) {

  // Alert: POSSIBLE METASTATIC DISEASE
  generateAlert({
    severity: 'HIGH',
    message: 'Red flags for serious pathology detected',
    actions: [
      'Order imaging (X-ray, MRI)',
      'Refer to oncology',
      'Avoid manipulation until cleared'
    ]
  });
}
```

**Common Red Flag Combinations:**

| Red Flags | Suspicion | Action |
|-----------|-----------|--------|
| Age >50, night pain, weight loss, past cancer | Metastatic disease | Urgent imaging, oncology referral |
| Bilateral leg symptoms, saddle anesthesia, bladder dysfunction | Cauda equina syndrome | Emergency referral |
| Acute dizziness, facial numbness, coordination issues | Posterior circulation stroke | Emergency referral |
| Progressive weakness, no pain relief, age >65 | Spinal cord compression | Urgent MRI, neurosurgery consult |
| Morning stiffness >1h, multiple joint pain, age <40 | Inflammatory arthropathy | Rheumatology referral, labs (CRP, RF) |

---

## API Integration

### REST API Endpoints

#### GET /api/anamnesis/templates

Get all available anamnesis templates

**Response:**
```json
[
  {
    "id": "uuid",
    "template_code": "CHIRO_COMPREHENSIVE",
    "template_name": "Omfattende Kiropraktor Anamnese",
    "specialty": "chiropractic",
    "sections": [...],
    "version": 1
  }
]
```

#### POST /api/patients/{patientId}/anamnesis

Create new anamnesis for patient

**Request:**
```json
{
  "template_code": "CHIRO_COMPREHENSIVE",
  "encounter_id": "uuid",
  "chief_complaint": "Nakkesmerter",
  "chief_complaint_duration": "3 uker",
  "onset_type": "gradvis",
  "aggravating_factors": ["sitting", "rotation_right"],
  "relieving_factors": ["movement", "heat"],
  "has_headache": true,
  "headache_details": "Occipital hodepine 2-3x/uke",
  "sensory_disturbances": {
    "upper_ext": true,
    "details": "Prikking i høyre C6-område"
  },
  "energy_level": 6,
  "sleep_quality": 5,
  "medications": ["Ibux 400 mg ved behov"],
  "occupation": "IT-konsulent",
  "patient_concerns": "Bekymret for diskusprolaps",
  "treatment_goals": "Bli kvitt armsmerter",
  "intake_method": "clinician_interview"
}
```

**Response:**
```json
{
  "id": "anamnesis-uuid",
  "patient_id": "patient-uuid",
  "completed_date": "2025-11-22T10:30:00Z",
  "completion_percentage": 88.9,
  "review_status": "pending"
}
```

#### GET /api/patients/{patientId}/anamnesis

Get all anamnesis records for patient

**Query Parameters:**
- `encounter_id` - Filter by encounter
- `from_date` - Filter by date range
- `review_status` - Filter by status (pending/reviewed/amended)

#### GET /api/patients/{patientId}/anamnesis/{anamnesisId}/epikrise

Generate epikrise text for anamnesis

**Response:**
```json
{
  "epikrise_text": "ANAMNESE\n════════════════...",
  "format": "plain_text",
  "generated_at": "2025-11-22T10:35:00Z"
}
```

#### PATCH /api/patients/{patientId}/anamnesis/{anamnesisId}

Update existing anamnesis (amend during appointment)

**Request:**
```json
{
  "dizziness_details": "Klarifisert: Rotatorisk ved hodebevegelser",
  "reviewed_by": "clinician-uuid",
  "review_status": "reviewed"
}
```

#### GET /api/patients/{patientId}/anamnesis/{anamnesisId}/completion

Get completion status for anamnesis

**Response:**
```json
{
  "anamnesis_id": "uuid",
  "has_chief_complaint": true,
  "has_symptom_history": true,
  "has_symptom_pattern": true,
  "has_associated_symptoms": true,
  "has_neuro_screen": true,
  "has_systemic_review": false,
  "has_medical_history": true,
  "has_lifestyle": true,
  "has_patient_perspective": true,
  "completion_percentage": 88.9,
  "missing_sections": ["systemic_review"]
}
```

---

## Best Practices

### For Clinicians

**1. Complete All Sections**
- Even if brief, complete each section
- Write "Ingen" or "Intet å bemerke" rather than leaving blank
- This ensures comprehensive screening

**2. Use Structured Data When Possible**
- Use checkboxes/dropdowns for symptom patterns
- Creates queryable data for research
- Enables pattern recognition across patient population

**3. Include Patient's Own Words**
- In free text fields, use patient's language
- Adds richness to clinical picture
- Important for therapeutic alliance

**4. Update Review Status**
- Always mark as "reviewed" when complete
- Prevents confusion about whether data is finalized

**5. Generate Epikrise Immediately**
- Copy to SOAP note while memory is fresh
- Can add clinical reasoning to epikrise text

### For Clinic Administration

**1. Monitor Completion Rates**
```sql
-- Clinic-wide anamnesis completion report
SELECT
  AVG(completion_percentage) AS avg_completion,
  COUNT(*) FILTER (WHERE completion_percentage = 100) AS fully_complete,
  COUNT(*) AS total
FROM anamnesis_completion_status
WHERE completed_date > CURRENT_DATE - INTERVAL '30 days';
```

**2. Quality Audit**
- Review random anamnesis records monthly
- Check for appropriate level of detail
- Provide feedback to clinicians

**3. Template Evolution**
- Review template annually
- Add/remove fields based on clinical utility
- Version control for changes

### For Patients (Digital Intake)

**1. Complete Before Appointment**
- Saves time during visit
- More accurate than recall under time pressure

**2. Be Thorough**
- Seemingly unrelated symptoms may be connected
- Clinician can interpret significance

**3. Update Regularly**
- If symptoms change before appointment, update intake
- Note new symptoms or improvements

---

## Integration with Other Systems

### SOAP Note Integration

```sql
-- Anamnesis feeds into Subjective section of SOAP note
INSERT INTO soap_notes (
  encounter_id,
  subjective,
  objective,
  assessment,
  plan
) VALUES (
  'encounter-uuid',
  (SELECT generate_anamnesis_epikrise('anamnesis-uuid')),  -- Auto-generated subjective
  NULL,  -- Filled during examination
  NULL,  -- Filled after tests
  NULL   -- Filled after diagnosis
);
```

### Test Battery Integration

Based on anamnesis findings, automatically suggest test batteries:

```javascript
function suggestTestBatteries(anamnesis) {
  let suggested = [];

  // If dizziness mentioned
  if (anamnesis.has_dizziness) {
    if (anamnesis.dizziness_details.includes('rotatorisk')) {
      suggested.push('BPPV_BATTERY');
      suggested.push('VNG_COMPLETE');
    }
  }

  // If neurological symptoms
  if (anamnesis.sensory_disturbances || anamnesis.motor_weakness) {
    suggested.push('NEUROLOGICAL_SCREEN');
  }

  // If knee pain
  if (anamnesis.other_pain_locations.includes('knee')) {
    suggested.push('KNEE_ASSESSMENT_COMPREHENSIVE');
  }

  return suggested;
}
```

### Questionnaire Integration

Auto-assign outcome measures based on chief complaint:

```javascript
function suggestQuestionnaires(anamnesis) {
  const questionnaires = [];

  if (anamnesis.chief_complaint.toLowerCase().includes('nakke')) {
    questionnaires.push('NDI');  // Neck Disability Index
  }

  if (anamnesis.chief_complaint.toLowerCase().includes('rygg')) {
    questionnaires.push('OSWESTRY');  // Oswestry Disability Index
  }

  if (anamnesis.chief_complaint.toLowerCase().includes('skulder')) {
    questionnaires.push('DASH');  // Disabilities of Arm, Shoulder, Hand
  }

  // Always add general health
  questionnaires.push('EQ5D');

  return questionnaires;
}
```

---

## Reporting & Analytics

### Clinic Dashboard

**Common Chief Complaints (Last 30 Days):**
```sql
SELECT
  chief_complaint,
  COUNT(*) AS frequency,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) AS percentage
FROM patient_anamnesis
WHERE completed_date > CURRENT_DATE - INTERVAL '30 days'
GROUP BY chief_complaint
ORDER BY frequency DESC
LIMIT 10;
```

**Average Completion Time:**
```sql
SELECT
  AVG(EXTRACT(EPOCH FROM (completed_date - created_at)) / 60) AS avg_minutes
FROM patient_anamnesis
WHERE intake_method = 'clinician_interview';
```

**Red Flag Prevalence:**
```sql
SELECT
  COUNT(*) FILTER (WHERE weight_change = 'tap') AS unexplained_weight_loss,
  COUNT(*) FILTER (WHERE coordination_issues = true) AS coordination_issues,
  COUNT(*) FILTER (WHERE has_dizziness AND has_headache) AS dizzy_and_headache
FROM patient_anamnesis
WHERE completed_date > CURRENT_DATE - INTERVAL '90 days';
```

---

## Future Enhancements

### Planned Features

1. **Voice-to-Text Integration**
   - Clinician speaks, system auto-populates fields
   - Reduces documentation time further

2. **AI-Powered Clinical Decision Support**
   - Machine learning detects patterns
   - Suggests differential diagnoses based on anamnesis

3. **Multi-Language Support**
   - Templates in English, Norwegian, Swedish, Danish
   - Auto-translation of epikrise

4. **Patient Portal Integration**
   - Patients can view their anamnesis
   - Track how symptoms change over time

5. **Clinical Photography Integration**
   - Attach photos (posture, skin lesions, swelling)
   - Visual documentation alongside text

---

## Educational Resources

**Video Tutorial: Completing Comprehensive Anamnesis**
www.theBackROM.com/education/Clickup/anamnesis-tutorial

**Webinar: Red Flag Recognition**
www.theBackROM.com/education/Clickup/red-flags-webinar

**Reference: Clinical Reasoning from Anamnesis**
www.theBackROM.com/education/Clickup/clinical-reasoning

---

**End of Automated Anamnesis System Documentation**

*For questions or support: support@theBackROM.com*
