# BPPV Exercise Library - Complete Clinical Reference

**ChiroClickCRM Clinical Testing System**
**Created:** 2025-11-22
**Educational Platform:** www.theBackROM.com/education/Clickup

---

## Table of Contents

1. [Overview](#overview)
2. [BPPV Pathophysiology](#bppv-pathophysiology)
3. [Diagnostic Testing](#diagnostic-testing)
4. [Treatment by Canal](#treatment-by-canal)
5. [Exercise Library](#exercise-library)
6. [Clinical Decision Making](#clinical-decision-making)
7. [Patient Prescription Workflow](#patient-prescription-workflow)
8. [Compliance Tracking](#compliance-tracking)
9. [API Reference](#api-reference)

---

## Overview

This comprehensive BPPV (Benign Paroxysmal Positional Vertigo) exercise library provides:

- **27 video-demonstrated exercises** with Norwegian and English terminology
- **Organized by semicircular canal** (Posterior, Horizontal, Anterior)
- **Pathology-specific treatments** (Canalithiasis vs. Cupulolithiasis)
- **Laterality-specific protocols** (Left, Right, Bilateral)
- **Patient handout generation** with Norwegian instructions
- **Compliance tracking system** with date-stamped logs
- **Vestibular rehabilitation exercises** (OPK training)

### Key Features

✅ **Complete YouTube Video Integration** - All exercises linked to demonstration videos
✅ **Norwegian Clinical Terminology** - Patient instructions in Norwegian
✅ **Evidence-Based Protocols** - Success rates and clinical indications included
✅ **Automated Handout Generation** - Print-ready patient instructions
✅ **Treatment Decision Support** - Recommendations based on diagnostic findings

---

## BPPV Pathophysiology

### Three Semicircular Canals

```
┌─────────────────────────────────────────────────────────┐
│  CANAL           │  PREVALENCE  │  NYSTAGMUS PATTERN    │
├─────────────────────────────────────────────────────────┤
│  Posterior       │  85-95%      │  Rotatory-Vertical    │
│  Horizontal      │  5-15%       │  Horizontal           │
│  Anterior        │  1-3%        │  Downbeat             │
└─────────────────────────────────────────────────────────┘
```

### Two Pathology Types

**1. Canalithiasis (90-95% of cases)**
- Free-floating otoconia in canal
- Latency: 1-5 seconds
- Duration: <60 seconds
- Fatigable: Yes
- Treatment: Particle repositioning

**2. Cupulolithiasis (5-10% of cases)**
- Otoconia attached to cupula
- Latency: None
- Duration: >60 seconds
- Fatigable: No
- Treatment: More difficult, liberatory maneuvers

---

## Diagnostic Testing

### Dix-Hallpike Test

**Purpose:** Diagnose posterior or anterior canal BPPV

**Video:** https://www.youtube.com/watch?v=wgWOmuB1VFY

**Procedure:**
1. Patient sits on examination table
2. Turn head 45° to test side
3. Quickly lay patient back with head hanging 30° over edge
4. Observe for nystagmus and ask about vertigo
5. Wait 60 seconds
6. Repeat on opposite side

**Positive Test - Posterior Canal:**
- Rotatory-vertical nystagmus (geotorsional)
- Upbeating component
- Latency: 1-5 seconds
- Duration: <60 seconds
- Fatigable with repetition

**Positive Test - Anterior Canal (RARE):**
- Downbeat nystagmus
- Consider CNS pathology if persistent

### Supine Roll Test

**Purpose:** Diagnose horizontal canal BPPV

**Procedure:**
1. Patient supine
2. Rapidly turn head 90° to right - observe nystagmus
3. Return to center
4. Rapidly turn head 90° to left - observe nystagmus

**Interpretation:**

```
┌──────────────────────────────────────────────────────────────┐
│  NYSTAGMUS TYPE      │  PATHOLOGY         │  AFFECTED EAR    │
├──────────────────────────────────────────────────────────────┤
│  GEOTROPIC           │  Canalithiasis     │  Side with       │
│  (towards ground)    │                    │  STRONGER nystag │
│                      │                    │                  │
│  APOGEOTROPIC        │  Cupulolithiasis   │  Side with       │
│  (away from ground)  │                    │  WEAKER nystag   │
└──────────────────────────────────────────────────────────────┘
```

---

## Treatment by Canal

### POSTERIOR CANAL (85-95% of BPPV)

#### Primary Treatment: Epley Maneuver

**Success Rate:** 80-90% after 1-3 treatments

**LEFT SIDE AFFECTED:**
- **Video:** https://www.youtube.com/watch?v=aC7x161MHhU
- **Code:** `EPLEY_LEFT`
- **Duration:** 1 minutt per posisjon
- **Frequency:** 2x daglig

**RIGHT SIDE AFFECTED:**
- **Video:** https://www.youtube.com/watch?v=SkBFlOc2fp8
- **Code:** `EPLEY_RIGHT`
- **Duration:** 1 minutt per posisjon
- **Frequency:** 2x daglig

**Epley Steps:**
1. Sitt på sengen
2. Dix-Hallpike posisjon (affected ear down) → 1 min
3. Roter hodet 90° til motsatt side → 1 min
4. Rull kroppen til motsatt side (nese mot gulvet) → 1 min
5. Sett seg sakte opp

#### Alternative 1: Semont Maneuver

**When to Use:** Patient cannot tolerate Epley, neck mobility limited

**LEFT SIDE:**
- **Video:** https://www.youtube.com/watch?v=z2KUrQoZ-sU
- **Code:** `SEMONT_LEFT`

**RIGHT SIDE:**
- **Video:** https://www.youtube.com/watch?v=A72UjulJSzE
- **Code:** `SEMONT_RIGHT`

**Semont Steps:**
1. Sitt på benken
2. Legg raskt til unaffected side (45° opp mot taket) → 1 min
3. RASKT til motsatt side → 1 min
4. Sett opp

**Note:** Requires faster movements than Epley. More uncomfortable but equally effective.

#### Alternative 2: Demi-Semont (Modified)

**When to Use:** Elderly, mobility issues, cannot tolerate full Semont

**LEFT SIDE:**
- **Video:** https://www.youtube.com/watch?v=RTkJlfGE6ZQ
- **Code:** `DEMI_SEMONT_LEFT`

**RIGHT SIDE:**
- **Video:** https://www.youtube.com/watch?v=5q9fjBYzmGw
- **Code:** `DEMI_SEMONT_RIGHT`

#### Alternative 3: Dias Maneuver

**LEFT SIDE:**
- **Video:** https://www.youtube.com/watch?v=y7Zy2tyFvls
- **Code:** `DIAS_LEFT`

**RIGHT SIDE:**
- **Video:** https://www.youtube.com/shorts/jOLRf1HbyAA
- **Code:** `DIAS_RIGHT`

#### Self-Treatment: Half Somersault

**When to Use:** Patient needs home exercise without assistance

**Video:** https://www.youtube.com/watch?v=_8ucpWIIC3g
**Code:** `HALF_SOMERSAULT`
**Success Rate:** ~70% (Foster et al. 2012)

**Steps:**
1. Start på alle fire
2. Se opp mot taket (30 sek)
3. Bøy hodet raskt ned (se på navlen)
4. Snu hodet mot affected ear
5. Løft hodet til ryggnivå (fortsatt på alle fire)
6. Løft til helt oppreist

---

### HORIZONTAL CANAL (5-15% of BPPV)

**CRITICAL:** Must differentiate Canalithiasis vs. Cupulolithiasis!

#### Canalithiasis (GEOTROPIC nystagmus)

**Primary Treatment: BBQ Roll (Log Roll)**

**LEFT SIDE AFFECTED:**
- **Video:** https://www.youtube.com/watch?v=KNBOASk7Ny8
- **Code:** `BBQ_ROLL_LEFT`
- **Duration:** 30 sekunder per posisjon
- **Frequency:** 2x daglig

**RIGHT SIDE AFFECTED:**
- **Video:** https://www.youtube.com/watch?v=pyN_QN931hE
- **Code:** `BBQ_ROLL_RIGHT`

**BBQ Roll Steps (Left ear affected):**
1. Ligge på ryggen → 30 sek
2. Rull 90° til HØYRE → 30 sek
3. Rull til mage → 30 sek
4. Rull 90° til VENSTRE → 30 sek
5. Rull til rygg og sitt opp

**Total rotation:** 360° away from affected ear

**Alternative: Gufoni Maneuver for Canalithiasis**

**LEFT SIDE:**
- **Video:** https://www.youtube.com/watch?v=3VfgHZtgx_s
- **Code:** `GUFONI_LEFT_CANALO`
- **Duration:** 2 minutter per posisjon

**RIGHT SIDE:**
- **Video:** https://www.youtube.com/watch?v=DgKaWSuvpRs
- **Code:** `GUFONI_RIGHT_CANALO`

**Gufoni Steps (Canalithiasis):**
1. Sitt på benken
2. Legg raskt til AFFECTED side (ear down) → 2 min
3. Roter hodet 45° NED mot gulvet → 2 min
4. Sett opp

#### Cupulolithiasis (APOGEOTROPIC nystagmus)

**Treatment: Gufoni Maneuver for Cupulolithiasis**

**RIGHT SIDE:**
- **Video:** https://www.youtube.com/watch?v=oi8NRXrtu7k
- **Code:** `GUFONI_RIGHT_CUPULO`
- **Duration:** 2 minutter per posisjon

**Gufoni Steps (Cupulolithiasis) - OPPOSITE DIRECTION:**
1. Sitt på benken
2. Legg raskt til UNAFFECTED side → 2 min
3. Roter hodet 45° OPP mot taket → 2 min
4. Sett opp

**Clinical Pearl:** Cupulolithiasis requires lying on the UNAFFECTED side and rotating head UP (opposite of canalithiasis).

---

### ANTERIOR CANAL (1-3% of BPPV)

**RARE - Consider alternative diagnoses!**

**Downbeat nystagmus on Dix-Hallpike = Red Flag for CNS pathology**

#### Reverse Epley's Maneuver

**LEFT SIDE:**
- **Video:** https://www.youtube.com/watch?v=lKNI315n1r0
- **Code:** `REVERSE_EPLEY_LEFT`

**RIGHT SIDE:**
- **Video:** https://www.youtube.com/watch?v=8LoTIvFcJKs
- **Code:** `REVERSE_EPLEY_RIGHT`

#### Deep Head Hanging Maneuver

**Video:** https://www.youtube.com/watch?v=qw1QciZWfP0
**Code:** `DEEP_HEAD_HANGING`

**When to Use:**
- Anterior canal BPPV confirmed
- Multi-canal BPPV
- Unclear diagnosis

**Contraindications:**
- Severe cervical spine disease
- Vertebral artery insufficiency
- Severe kyphosis

---

## Vestibular Rehabilitation (Post-BPPV)

### OPK (Optokinetic) Exercises

**Purpose:** Accelerate vestibular compensation after BPPV treatment

**Duration:** 2-3 minutter
**Frequency:** 3x daglig
**Expected:** May cause dizziness - this is therapeutic!

#### OPK Right
- **Video:** https://www.youtube.com/watch?v=bMDIsVSQZLk
- **Code:** `OPK_HOYRE`

#### OPK Left
- **Video:** https://www.youtube.com/watch?v=WB61GjYY95E
- **Code:** `OPK_VENSTRE`

#### OPK Down
- **Video:** https://www.youtube.com/watch?v=IUHZTanTW-8
- **Code:** `OPK_NED`

#### OPK Down Right (Diagonal)
- **Video:** https://www.youtube.com/watch?v=BeHRDIHapmo
- **Code:** `OPK_NED_HOYRE`

**Instructions:**
1. Følg de bevegelige stripene på skjermen
2. Hold øynene fokusert på stripene
3. 2-3 minutter per retning
4. Gjenta 3 ganger daglig

**Clinical Use:**
- Start AFTER successful BPPV treatment
- Reduces residual dizziness
- Accelerates return to normal function
- Especially helpful with unilateral weakness (UW >25%)

---

## Exercise Library - Complete Index

### By Canal Affected

#### Posterior Canal (17 exercises)
```
┌────────────────────────┬──────────────────┬─────────────┐
│ EXERCISE               │ CODE             │ LATERALITY  │
├────────────────────────┼──────────────────┼─────────────┤
│ Epley's Left           │ EPLEY_LEFT       │ Left        │
│ Epley's Right          │ EPLEY_RIGHT      │ Right       │
│ Semont Left            │ SEMONT_LEFT      │ Left        │
│ Semont Right           │ SEMONT_RIGHT     │ Right       │
│ Demi-Semont Left       │ DEMI_SEMONT_LEFT │ Left        │
│ Demi-Semont Right      │ DEMI_SEMONT_RIGHT│ Right       │
│ Dias Left              │ DIAS_LEFT        │ Left        │
│ Dias Right             │ DIAS_RIGHT       │ Right       │
│ Half Somersault        │ HALF_SOMERSAULT  │ General     │
└────────────────────────┴──────────────────┴─────────────┘
```

#### Horizontal Canal (5 exercises)
```
┌────────────────────────┬──────────────────────┬──────────────┐
│ EXERCISE               │ CODE                 │ PATHOLOGY    │
├────────────────────────┼──────────────────────┼──────────────┤
│ BBQ Roll Left          │ BBQ_ROLL_LEFT        │ Canalo       │
│ BBQ Roll Right         │ BBQ_ROLL_RIGHT       │ Canalo       │
│ Gufoni Left Canalo     │ GUFONI_LEFT_CANALO   │ Canalo       │
│ Gufoni Right Canalo    │ GUFONI_RIGHT_CANALO  │ Canalo       │
│ Gufoni Right Cupulo    │ GUFONI_RIGHT_CUPULO  │ Cupulo       │
└────────────────────────┴──────────────────────┴──────────────┘
```

#### Anterior Canal (3 exercises)
```
┌────────────────────────┬──────────────────────┐
│ EXERCISE               │ CODE                 │
├────────────────────────┼──────────────────────┤
│ Reverse Epley Left     │ REVERSE_EPLEY_LEFT   │
│ Reverse Epley Right    │ REVERSE_EPLEY_RIGHT  │
│ Deep Head Hanging      │ DEEP_HEAD_HANGING    │
└────────────────────────┴──────────────────────┘
```

#### Vestibular Rehabilitation (4 exercises)
```
┌────────────────────────┬──────────────────┐
│ EXERCISE               │ CODE             │
├────────────────────────┼──────────────────┤
│ OPK Right              │ OPK_HOYRE        │
│ OPK Left               │ OPK_VENSTRE      │
│ OPK Down               │ OPK_NED          │
│ OPK Down Right         │ OPK_NED_HOYRE    │
└────────────────────────┴──────────────────┘
```

#### Diagnostic (1 test)
```
┌────────────────────────┬──────────────────┐
│ TEST                   │ CODE             │
├────────────────────────┼──────────────────┤
│ Dix-Hallpike           │ DIX_HALLPIKE_TEST│
└────────────────────────┴──────────────────┘
```

---

## Clinical Decision Making

### Decision Tree: Posterior Canal BPPV

```
Positive Dix-Hallpike (Rotatory-Vertical Nystagmus)
│
├─ Patient can tolerate neck extension?
│  │
│  ├─ YES → Epley Maneuver (1st choice)
│  │         ├─ Success after 3 treatments? → Done
│  │         └─ No improvement → Try Semont or Dias
│  │
│  └─ NO → Half Somersault (self-treatment)
│           or Demi-Semont (gentler)
│
└─ Re-test after 1 week
   ├─ Resolved → OPK exercises for 2 weeks
   └─ Persistent → Refer for advanced vestibular testing
```

### Decision Tree: Horizontal Canal BPPV

```
Positive Supine Roll Test
│
├─ GEOTROPIC nystagmus (Canalithiasis)?
│  │
│  ├─ YES → BBQ Roll (1st choice)
│  │         or Gufoni Canalithiasis
│  │         ├─ Success? → OPK exercises
│  │         └─ No improvement → Repeat or try alternative
│  │
│  └─ NO (APOGEOTROPIC = Cupulolithiasis)
│           → Gufoni Cupulolithiasis
│           → More difficult to treat
│           → May require multiple sessions
│
└─ Re-test after 1 week
```

---

## Patient Prescription Workflow

### Step 1: Diagnostic Testing

```sql
-- Record Dix-Hallpike results
INSERT INTO test_battery_results (
  patient_id,
  battery_id,
  test_results
) VALUES (
  'patient-uuid',
  (SELECT id FROM test_batteries WHERE code = 'BPPV_REALEYES'),
  '{
    "dix_hallpike_right": {
      "nystagmus": "geotorsional_upbeat",
      "latency_seconds": 3,
      "duration_seconds": 25,
      "vertigo": true,
      "fatigable": true
    },
    "diagnosis": "Right posterior canal BPPV - canalithiasis"
  }'
);
```

### Step 2: Get Exercise Recommendation

```sql
-- Get recommended exercises
SELECT * FROM get_bppv_exercise_recommendation(
  'posterior',      -- canal
  'canalithiasis',  -- pathology
  'right'           -- laterality
);

-- Returns:
-- exercise_code: EPLEY_RIGHT
-- exercise_name: Høyre Epley's Manøver
-- youtube_url: https://www.youtube.com/watch?v=SkBFlOc2fp8
-- instructions: [Full Norwegian instructions]
-- clinical_notes: Effektivitet 80-90%...
```

### Step 3: Prescribe Exercise

```sql
-- Prescribe Epley Right to patient
INSERT INTO patient_bppv_prescriptions (
  patient_id,
  encounter_id,
  exercise_video_id,
  start_date,
  end_date
) VALUES (
  'patient-uuid',
  'encounter-uuid',
  (SELECT id FROM bppv_exercise_videos WHERE exercise_code = 'EPLEY_RIGHT'),
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '14 days'
);
```

### Step 4: Generate Patient Handout

```sql
-- Generate printable handout
SELECT generate_bppv_exercise_handout(
  'patient-uuid',
  'EPLEY_RIGHT'
);
```

**Output:**
```
╔══════════════════════════════════════════════════════════════╗
║          HJEMMEØVELSE FOR BPPV - HØYRE EPLEY'S MANØVER      ║
╚══════════════════════════════════════════════════════════════╝

Pasient: John Doe
Dato: 22.11.2025

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INSTRUKSJONER:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Sitt på sengen
2. Legg deg raskt tilbake med hodet hengende 30° og rotert 45°
   til HØYRE (Dix-Hallpike posisjon) - VENT 1 MINUTT
3. Roter hodet 90° til VENSTRE - VENT 1 MINUTT
4. Rull hele kroppen til venstre side (nese mot gulvet) - VENT 1 MINUTT
5. Sett deg sakte opp
6. Gjenta 2 ganger daglig

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DOSERING:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⏱️  Varighet: 1 minutt i hver posisjon
🔄 Frekvens: 2 ganger daglig

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VIKTIG Å VITE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Effektivitet: 80-90% etter 1-3 behandlinger.
Kan gi forbigående økt svimmelhet første 24-48 timer.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VIDEO DEMONSTRASJON:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎥 https://www.youtube.com/watch?v=SkBFlOc2fp8

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KONTAKT OSS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📞 Hvis symptomene forverres eller ikke bedres etter 1 uke,
   vennligst kontakt klinikken for oppfølging.

⚠️  Hvis du opplever hodepine, dobbeltsyn, nummenhet, eller
   talevansker - kontakt lege UMIDDELBART.
```

### Step 5: Patient Records Compliance

**Mobile/Web Interface:**
```javascript
// Patient logs completion
POST /api/patients/{id}/bppv-prescriptions/{prescription_id}/log
{
  "date": "2025-11-22",
  "completed": true,
  "times_performed": 2,
  "notes": "Litt svimmel etter første gang, bedre etter andre"
}
```

**Database Update:**
```sql
-- Automatic compliance tracking
UPDATE patient_bppv_prescriptions
SET compliance_tracking = compliance_tracking ||
  '{"2025-11-22": {
    "completed": true,
    "times": 2,
    "notes": "Litt svimmel etter første gang"
  }}'::jsonb
WHERE id = 'prescription-uuid';
```

### Step 6: Follow-up Assessment

```sql
-- After 1 week, re-test and update prescription
UPDATE patient_bppv_prescriptions
SET
  effectiveness_rating = 8,
  status = 'completed',
  clinician_notes = 'Dix-Hallpike now negative. Symptoms resolved. Prescribed OPK exercises for vestibular rehab.'
WHERE id = 'prescription-uuid';

-- Add OPK exercises for rehabilitation
INSERT INTO patient_bppv_prescriptions (
  patient_id,
  exercise_video_id,
  start_date,
  end_date
)
SELECT
  'patient-uuid',
  id,
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '14 days'
FROM bppv_exercise_videos
WHERE exercise_code IN ('OPK_HOYRE', 'OPK_VENSTRE');
```

---

## Compliance Tracking

### Daily Logging

**Schema:**
```json
{
  "compliance_tracking": {
    "2025-11-22": {
      "completed": true,
      "times_performed": 2,
      "symptom_severity_before": 7,
      "symptom_severity_after": 5,
      "notes": "Svimmel under øvelse, bedring etter 10 min",
      "side_effects": ["mild nausea", "transient dizziness"]
    },
    "2025-11-23": {
      "completed": true,
      "times_performed": 2,
      "symptom_severity_before": 5,
      "symptom_severity_after": 3,
      "notes": "Mindre svimmelhet i dag"
    }
  }
}
```

### Compliance Report

```sql
-- Generate compliance report
SELECT
  p.first_name || ' ' || p.last_name AS patient_name,
  bev.exercise_name_no,
  pbp.prescribed_date,
  pbp.start_date,
  pbp.end_date,
  (
    SELECT COUNT(*)
    FROM jsonb_object_keys(pbp.compliance_tracking)
  ) AS days_logged,
  (
    SELECT COUNT(*)
    FROM jsonb_each(pbp.compliance_tracking)
    WHERE (value->>'completed')::boolean = true
  ) AS days_completed,
  pbp.effectiveness_rating,
  pbp.status
FROM patient_bppv_prescriptions pbp
JOIN patients p ON pbp.patient_id = p.id
JOIN bppv_exercise_videos bev ON pbp.exercise_video_id = bev.id
WHERE pbp.patient_id = 'patient-uuid'
ORDER BY pbp.prescribed_date DESC;
```

---

## API Reference

### GET /api/bppv-exercises

Get all BPPV exercises with optional filtering

**Query Parameters:**
- `canal` - Filter by canal (posterior, horizontal, anterior, diagnostic)
- `pathology` - Filter by pathology (canalithiasis, cupulolithiasis)
- `laterality` - Filter by side (left, right, bilateral, general)

**Example:**
```bash
GET /api/bppv-exercises?canal=posterior&laterality=right
```

**Response:**
```json
[
  {
    "id": "uuid",
    "exercise_code": "EPLEY_RIGHT",
    "exercise_name_no": "Høyre Epley's Manøver",
    "exercise_name_en": "Right Epley's Maneuver",
    "canal_affected": "posterior",
    "pathology_type": "canalithiasis",
    "laterality": "right",
    "youtube_url": "https://www.youtube.com/watch?v=SkBFlOc2fp8",
    "duration_per_position": "1 minutt i hver posisjon",
    "frequency_per_day": 2,
    "clinical_indications": "Høyre posterior kanal BPPV...",
    "patient_instructions_no": "1. Sitt på sengen...",
    "special_notes": "Effektivitet: 80-90%..."
  }
]
```

### POST /api/patients/{patientId}/bppv-prescriptions

Prescribe BPPV exercise to patient

**Request Body:**
```json
{
  "exercise_code": "EPLEY_RIGHT",
  "encounter_id": "uuid",
  "start_date": "2025-11-22",
  "end_date": "2025-12-06",
  "custom_duration": "1 minutt",
  "custom_frequency": 2,
  "clinician_notes": "Positive right Dix-Hallpike with geotorsional nystagmus"
}
```

### GET /api/patients/{patientId}/bppv-prescriptions

Get all BPPV prescriptions for patient

**Response:**
```json
[
  {
    "id": "uuid",
    "prescribed_date": "2025-11-22",
    "exercise": {
      "code": "EPLEY_RIGHT",
      "name_no": "Høyre Epley's Manøver",
      "youtube_url": "https://www.youtube.com/watch?v=SkBFlOc2fp8"
    },
    "status": "active",
    "compliance_rate": 0.85,
    "effectiveness_rating": null
  }
]
```

### POST /api/patients/{patientId}/bppv-prescriptions/{prescriptionId}/log

Log exercise completion (patient or clinician)

**Request Body:**
```json
{
  "date": "2025-11-22",
  "completed": true,
  "times_performed": 2,
  "symptom_severity_before": 7,
  "symptom_severity_after": 5,
  "notes": "Svimmel under øvelse",
  "side_effects": ["mild nausea"]
}
```

### GET /api/patients/{patientId}/bppv-handout/{exerciseCode}

Generate printable patient handout

**Response:** Plain text formatted handout (see example above)

---

## Clinical Pearls

### 🔍 Diagnostic Tips

1. **Always test BOTH sides on Dix-Hallpike** - 10-15% have bilateral BPPV
2. **Wait full 60 seconds** - Some nystagmus has delayed onset
3. **Ask about symptoms, not just observe** - Patient may have vertigo without visible nystagmus
4. **Repeat if unclear** - Nystagmus may fatigue or increase with repetition

### 💊 Treatment Tips

1. **Epley first-line for posterior canal** - Highest success rate (80-90%)
2. **BBQ Roll for horizontal canal** - Easier than Gufoni for most patients
3. **Determine geotropic vs apogeotropic** - Critical for horizontal canal treatment direction
4. **Consider Half Somersault for elderly** - Self-treatment option, no assistance needed
5. **Add OPK exercises post-treatment** - Accelerates vestibular compensation

### ⚠️ Red Flags

**Refer immediately if:**
- Persistent downbeat nystagmus (CNS pathology)
- Vertical nystagmus without torsional component
- Headache, diplopia, dysarthria, ataxia
- No latency, no fatigue, lasts >2 minutes
- Pure vertical or pure horizontal without direction change
- Treatment failure after 3-4 attempts

**Consider vestibular neuritis if:**
- Constant vertigo (not positional)
- Horizontal nystagmus in ALL head positions
- Unilateral weakness >25% on caloric testing
- → Generate GP letter for corticosteroids (<72 hours!)

### 📊 Expected Outcomes

**Posterior Canal BPPV:**
- 1 treatment: 60-70% resolution
- 2 treatments: 80-90% resolution
- 3 treatments: 90-95% resolution
- If not resolved after 3 treatments → Consider alternative diagnosis

**Horizontal Canal BPPV (Canalithiasis):**
- More variable response
- 70-85% success with BBQ Roll
- May require 4-5 treatments

**Horizontal Canal BPPV (Cupulolithiasis):**
- More difficult to treat
- 50-70% success rate
- May convert to canalithiasis with treatment

### 📅 Follow-up Schedule

**Week 1:**
- Re-test after 3-4 days if not improving
- Expect some residual dizziness (normal)

**Week 2:**
- Should see significant improvement
- If not → Try alternative maneuver or refer

**Week 3-4:**
- Continue OPK exercises
- Residual dizziness should resolve
- If persistent → Refer for VNG testing

---

## References

1. **Bhattacharyya N, et al.** (2017). Clinical Practice Guideline: Benign Paroxysmal Positional Vertigo (Update). *Otolaryngology–Head and Neck Surgery*. 156(3_suppl):S1-S47.

2. **Foster CA, Ponnapan A, Zaccaro K, Strong D.** (2012). A comparison of two home exercises for benign positional vertigo: Half somersault versus Epley maneuver. *Audiology and Neurotology Extra*. 2:16-23.

3. **Kim JS, Zee DS.** (2014). Benign paroxysmal positional vertigo. *New England Journal of Medicine*. 370:1138-1147.

4. **Bhattacharyya N, Gubbels SP, Schwartz SR, et al.** (2017). Clinical Practice Guideline: Benign Paroxysmal Positional Vertigo (Update). *Otolaryngology-Head and Neck Surgery*. 156(3_suppl):S1-S47.

5. **Hilton MP, Pinder DK.** (2014). The Epley (canalith repositioning) manoeuvre for benign paroxysmal positional vertigo. *Cochrane Database of Systematic Reviews*. (12):CD003162.

---

## Educational Resources

**Video Playlist:** All 27 BPPV exercises organized by canal
**Link:** www.theBackROM.com/education/Clickup/bppv-complete-playlist

**Interactive BPPV Decision Tree:**
**Link:** www.theBackROM.com/education/Clickup/bppv-decision-tree

**Patient Education Handouts (Norwegian):**
**Link:** www.theBackROM.com/education/Clickup/bppv-patient-resources

**Clinician Training Module:**
**Link:** www.theBackROM.com/education/Clickup/bppv-clinician-training

---

**End of BPPV Exercise Library Documentation**

*For questions or updates, contact: support@theBackROM.com*
