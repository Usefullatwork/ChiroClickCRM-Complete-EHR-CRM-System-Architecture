# Clinical Testing & Assessment System

**ChiroClickCRM Complete EHR-CRM**
**Educational Platform Integration**: [www.theBackROM.com/education/Clickup](https://www.theBackROM.com/education/Clickup)

---

## Table of Contents

1. [Overview](#overview)
2. [Special Tests Library](#special-tests-library)
3. [Standardized Questionnaires](#standardized-questionnaires)
4. [Test Batteries](#test-batteries)
5. [Normative Data & Comparisons](#normative-data--comparisons)
6. [API Reference](#api-reference)
7. [Clinical Interpretation Guidelines](#clinical-interpretation-guidelines)
8. [Educational Resources](#educational-resources)

---

## Overview

The Clinical Testing & Assessment System provides evidence-based evaluation tools for comprehensive patient assessment, outcome tracking, and treatment effectiveness monitoring.

### Key Features

- **200+ Special Tests** organized by body region with psychometric properties
- **Standardized Outcome Questionnaires** with automatic scoring (NDI, Oswestry, PSFS, EQ5D, LEFS, DASH)
- **Test Battery Builder** for creating custom assessment protocols
- **Normative Data Comparison** for ROM and functional tests
- **Outcome Tracking** with MCID (Minimal Clinically Important Difference) analysis
- **Educational Integration** with theBackROM.com platform

---

## Special Tests Library

### Organized by Body Region

The system includes comprehensive special tests from Physio-pedia:

#### Cervical Spine (11 tests)
- Bakody Sign
- Canadian C-Spine Rule
- Cervical Distraction Test
- Cervical Flexion-Rotation Test
- Cervical Rotation Lateral Flexion Test
- Cranio-cervical Flexion Test
- Hoffmann's Sign
- Sharp Purser Test
- Spurling's Test (Sensitivity: 0.50, Specificity: 0.86-0.93)
- Transverse Ligament Stress Test
- Vertebral Artery Test

**Clinical Pearl**: Spurling's test is highly specific for cervical radiculopathy. When combined with negative ULTT, it provides strong diagnostic utility.

#### Shoulder (45 tests)
Comprehensive impingement, instability, and rotator cuff assessment including:
- Neer Test
- Hawkins-Kennedy Test
- Empty Can Test (Jobe's)
- Full Can Test
- Lachman for shoulder (Sensitivity: 85%, Specificity: 94%)
- External Rotation Lag Sign (Specificity: 100%)
- O'Brien's Test for SLAP lesions
- Speed's Test for biceps pathology

**Clinical Pearl**: Combining 3+ positive impingement tests increases diagnostic accuracy for subacromial pathology.

#### Lumbar Spine (8 tests)
- Straight Leg Raise (SLR)
- Bragard's Sign
- Femoral Nerve Tension Test
- Slump Test (Sensitivity: 84%, Specificity: 83%)
- Gaenslen Test
- McKenzie Repeated Movements

#### Pelvis/SI Joint (11 tests)
**SI Joint Cluster** (≥3 positive increases likelihood ratio):
- Distraction Test
- Thigh Thrust (P4 Test) - Sensitivity: 88%, Specificity: 69%
- Compression Test
- Sacral Thrust - Sensitivity: 63%, Specificity: 75%
- Gaenslen Test

**Evidence**: SI Joint Cluster with ≥3 positive tests has Sensitivity: 94%, Specificity: 78%

#### Knee (26 tests)
- **ACL Tests**: Lachman (Gold standard), Anterior Drawer, Pivot Shift, Lever Sign
- **PCL Tests**: Posterior Drawer, Posterior Sag Sign
- **Meniscal Tests**: McMurray's, Thessaly (Sensitivity: 89%, Specificity: 97%), Apley's
- **Ligament Stress Tests**: Valgus, Varus

**Clinical Pearl**: Lever Sign Test has 100% sensitivity and specificity for ACL tears but requires patient relaxation.

#### Ankle & Foot (19 tests)
- **Ottawa Ankle Rules** - 100% sensitivity for fractures
- Anterior Drawer (Ankle)
- Talar Tilt
- Thompson Test for Achilles rupture (Sensitivity: 96%, Specificity: 93%)
- Squeeze Test for syndesmosis
- Navicular Drop Test
- Windlass Test for plantar fasciitis

#### Balance & Functional Tests (29 tests)
- Short Physical Performance Battery (SPPB) - elderly assessment
- Timed Up and Go (TUG) - <10s normal, ≥30s high fall risk
- Berg Balance Scale (0-56 points)
- Single Leg Stance
- Star Excursion Balance Test (SEBT)
- Y Balance Test
- Functional Reach Test (<15cm high fall risk)

**Educational Link**: [www.theBackROM.com/education/Clickup/balance-assessment](https://www.theBackROM.com/education/Clickup/balance-assessment)

---

## Standardized Questionnaires

### 1. Neck Disability Index (NDI)

**Purpose**: Assess neck pain-related disability
**Items**: 10 sections, each 0-5 points
**Scoring**: Total 0-50, expressed as percentage (0-100%)
**MCID**: 5 points or 10%

**Interpretation**:
- 0-9%: No disability
- 10-29%: Mild disability
- 30-49%: Moderate disability
- 50-69%: Severe disability
- 70-100%: Complete disability

**Psychometric Properties**:
- Test-retest reliability: 0.92
- Cronbach's alpha: 0.89
- Sensitivity to change: Excellent

**API Example**:
```javascript
POST /api/questionnaires/responses
{
  "patient_id": "uuid",
  "questionnaire_id": "NDI",
  "responses": {
    "pain_intensity": 3,
    "personal_care": 2,
    "lifting": 4,
    "reading": 2,
    "headaches": 3,
    "concentration": 2,
    "work": 4,
    "driving": 3,
    "sleeping": 2,
    "recreation": 3
  }
}

// Response includes automatic scoring
{
  "total_score": 28,
  "percentage_score": 56,
  "severity_level": "Severe disability",
  "previous_score": 35,
  "score_change": -7,
  "clinically_significant_change": true
}
```

**Educational Link**: [www.theBackROM.com/education/Clickup/ndi](https://www.theBackROM.com/education/Clickup/ndi)

---

### 2. Oswestry Disability Index (ODI)

**Purpose**: Assess low back pain-related disability
**Items**: 10 sections, each 0-5 points
**Scoring**: Total 0-50, expressed as percentage
**MCID**: 10 points

**Interpretation**:
- 0-20%: Minimal disability
- 21-40%: Moderate disability
- 41-60%: Severe disability
- 61-80%: Crippling back pain
- 81-100%: Bed-bound or exaggerating

**Sections**:
1. Pain intensity
2. Personal care
3. Lifting
4. Walking
5. Sitting
6. Standing
7. Sleeping
8. Social life
9. Traveling
10. Employment/homemaking

**Clinical Pearl**: ODI >50% indicates severe functional limitation and may warrant imaging or specialist referral.

**Educational Link**: [www.theBackROM.com/education/Clickup/oswestry](https://www.theBackROM.com/education/Clickup/oswestry)

---

### 3. Patient-Specific Functional Scale (PSFS)

**Purpose**: Individualized functional outcome measure
**Items**: 3-5 patient-identified activities
**Scoring**: Each activity rated 0-10 (0=unable, 10=full function)
**MCID**: 2 points (average change across activities)

**Advantages**:
- Patient-centered
- Highly responsive to change
- Applicable to any condition
- Quick administration (2-3 minutes)

**Example Activities**:
- "Walking my dog for 30 minutes"
- "Lifting grocery bags from car"
- "Playing tennis"
- "Sleeping through the night"

**Scoring Formula**:
Average score = Sum of all activities / Number of activities

**Educational Link**: [www.theBackROM.com/education/Clickup/psfs](https://www.theBackROM.com/education/Clickup/psfs)

---

### 4. EQ-5D (EuroQol 5-Dimension)

**Purpose**: Generic health status measure
**Dimensions**: 5 domains (mobility, self-care, usual activities, pain/discomfort, anxiety/depression)
**Levels**: 5 levels per dimension (no problems → extreme problems)
**VAS**: 0-100 visual analog scale

**Health State Calculation**:
- Generates 5-digit code (e.g., 21232)
- Index value calculated using country-specific tariffs
- VAS provides subjective health rating

**Applications**:
- QALY calculations for health economics
- Generic outcome tracking
- Cross-condition comparisons

**Educational Link**: [www.theBackROM.com/education/Clickup/eq5d](https://www.theBackROM.com/education/Clickup/eq5d)

---

### 5. Lower Extremity Functional Scale (LEFS)

**Purpose**: Assess lower extremity function
**Items**: 20 items, each 0-4 points
**Scoring**: Total 0-80 (higher = better function)
**MCID**: 9 points

**Interpretation**:
- 0-39: Severe functional limitation
- 40-59: Moderate functional limitation
- 60-80: Minimal functional limitation

**Educational Link**: [www.theBackROM.com/education/Clickup/lefs](https://www.theBackROM.com/education/Clickup/lefs)

---

### 6. DASH (Disabilities of Arm, Shoulder, and Hand)

**Purpose**: Upper extremity functional assessment
**Items**: 30 items (21 function, 5 symptoms, 4 social/work)
**Scoring**: 0-100 (higher = greater disability)
**MCID**: 10 points

**Formula**: ((Sum/n) - 1) × 25 where n ≥ 27 items completed

**Modules**:
- Work module (4 items)
- Sports/performing arts module (4 items)

**Educational Link**: [www.theBackROM.com/education/Clickup/dash](https://www.theBackROM.com/education/Clickup/dash)

---

## Test Batteries

### Pre-defined System Batteries

#### 1. Short Physical Performance Battery (SPPB)

**Target Population**: Elderly (>65 years)
**Duration**: ~10 minutes
**Components**:

**A. Balance Tests (4 points)**:
- Side-by-side stand (10 sec): 1 point if successful
- Semi-tandem stand (10 sec): 1 point if successful
- Tandem stand:
  - <3 sec: 0 points
  - 3-9.99 sec: 1 point
  - ≥10 sec: 2 points

**B. Gait Speed (4 points)**:
- 4-meter walk at usual pace
- <0.43 m/s: 1 point
- 0.43-0.60 m/s: 2 points
- 0.61-0.77 m/s: 3 points
- >0.77 m/s: 4 points

**C. Chair Stand (4 points)**:
- Five repetitions, time recorded
- ≥16.7 sec: 1 point
- 13.7-16.69 sec: 2 points
- 11.2-13.69 sec: 3 points
- <11.2 sec: 4 points

**Total Score Interpretation**:
- 0-6: Poor performance (high fall/disability risk)
- 7-9: Moderate performance
- 10-12: Good performance

**Clinical Utility**: Predicts falls, hospitalization, disability, and mortality in elderly.

**Educational Link**: [www.theBackROM.com/education/Clickup/sppb](https://www.theBackROM.com/education/Clickup/sppb)

---

#### 2. Nine Test Screening Battery (9TSB)

**Target Population**: Athletes, active adults
**Purpose**: Functional movement screening
**Duration**: 15-20 minutes

**Tests**:
1. Deep Squat
2. Hurdle Step
3. Inline Lunge
4. Active Straight Leg Raise
5. Trunk Stability Push-up
6. Rotary Stability
7. Shoulder Mobility
8. Shoulder Clearing Test
9. Trunk Extension Clearing Test

**Scoring**: Each test 0-3 points
**Interpretation**: Identifies movement asymmetries and limitations

**Educational Link**: [www.theBackROM.com/education/Clickup/9tsb](https://www.theBackROM.com/education/Clickup/9tsb)

---

### Custom Battery Builder

Create organization-specific test protocols:

```javascript
POST /api/test-batteries
{
  "name": "Comprehensive Cervical Assessment",
  "description": "Full cervical spine evaluation protocol",
  "target_body_region": "Cervical",
  "target_population": "Adult neck pain",
  "estimated_minutes": 25,
  "tests": [
    {
      "test_id": "cervical_rom",
      "test_name": "Cervical ROM",
      "test_type": "rom",
      "order": 1,
      "required": true,
      "scoring": {
        "flexion": { "normal": 50, "unit": "degrees" },
        "extension": { "normal": 60, "unit": "degrees" },
        "rotation": { "normal": 80, "unit": "degrees" }
      }
    },
    {
      "test_id": "spurlings",
      "test_name": "Spurling's Test",
      "test_type": "special_test",
      "order": 2,
      "required": true,
      "scoring": { "result": "positive/negative" }
    },
    {
      "test_id": "ndi",
      "test_name": "Neck Disability Index",
      "test_type": "questionnaire",
      "order": 3,
      "required": false
    }
  ],
  "scoring_method": "INDIVIDUAL",
  "indicated_for": ["Neck pain", "Cervical radiculopathy", "Whiplash"],
  "contraindications": ["Acute fracture", "Severe instability"]
}
```

---

## Normative Data & Comparisons

### ROM Normative Values

#### Cervical Spine
| Movement | Mean (°) | Range (°) | Age Group |
|----------|----------|-----------|-----------|
| Flexion | 50 | 45-70 | 20-40 |
| Extension | 60 | 50-75 | 20-40 |
| Rotation | 80 | 70-90 | 20-40 |
| Lateral Flexion | 45 | 35-55 | 20-40 |

**Age Adjustments**:
- 40-60 years: -10% from normal
- 60-80 years: -20% from normal
- >80 years: -30% from normal

#### Lumbar Spine
| Movement | Mean (°) | Range (°) |
|----------|----------|-----------|
| Flexion | 60 | 40-90 |
| Extension | 25 | 20-35 |
| Lateral Flexion | 25 | 15-30 |

**Modified Schober Test**:
- Normal increase: >5 cm (from 10 cm baseline)
- Restricted: <4 cm

---

### Functional Test Norms

#### Timed Up and Go (TUG)
| Population | Normal (sec) | Fall Risk (sec) |
|------------|--------------|-----------------|
| Young adults (20-50) | <10 | >14 |
| Healthy elderly (60-69) | <12 | >15 |
| Elderly (70-79) | <14 | >20 |
| Elderly (80+) | <16 | >30 |

#### Single Leg Stance (Eyes Open)
| Age Group | Normal (sec) |
|-----------|--------------|
| 20-49 | >24 |
| 50-59 | >21 |
| 60-69 | >10 |
| 70-79 | >4 |

**Educational Link**: [www.theBackROM.com/education/Clickup/normative-data](https://www.theBackROM.com/education/Clickup/normative-data)

---

## API Reference

### Questionnaires

```http
GET /api/questionnaires
Query params: body_region, language, active_only
Returns: List of available questionnaires

GET /api/questionnaires/:code
Returns: Specific questionnaire definition

POST /api/questionnaires/responses
Body: { patient_id, questionnaire_id, responses }
Returns: Scored response with interpretation

GET /api/patients/:patientId/questionnaires
Query params: questionnaire_code
Returns: Patient's questionnaire history

GET /api/patients/:patientId/treatment-effectiveness
Returns: Treatment outcomes based on questionnaire changes
```

### Test Batteries

```http
GET /api/test-batteries
Query params: body_region, target_population
Returns: Available test batteries

GET /api/test-batteries/:code
Returns: Specific battery definition

POST /api/test-batteries
Body: { name, tests, scoring_method, ... }
Returns: Created custom battery

POST /api/test-batteries/results
Body: { patient_id, battery_id, test_results }
Returns: Battery results with composite score

GET /api/patients/:patientId/battery-results
Returns: Patient's battery history
```

---

## Clinical Interpretation Guidelines

### Questionnaire Score Changes

#### Minimal Clinically Important Difference (MCID)

Understanding what score changes matter:

| Questionnaire | MCID | Substantial Improvement |
|---------------|------|------------------------|
| NDI | 5 points (10%) | 7.5 points |
| Oswestry | 10 points | 15 points |
| PSFS | 2 points | 3 points |
| LEFS | 9 points | 12 points |
| DASH | 10 points | 15 points |

**Clinical Application**:
- Scores improving beyond MCID = Treatment is working
- Scores stable within MCID = Re-evaluate treatment plan
- Scores worsening = Consider alternative approach or referral

---

### Combining Tests for Diagnosis

#### Example: Cervical Radiculopathy

**High Probability (>90%)** if present:
- Positive Spurling's Test
- Positive Distraction Test relief
- Positive Upper Limb Tension Test
- Dermatomal sensory changes

**Moderate Probability (60-80%)**:
- 2 of the above positive
- Myotomal weakness
- Reflex changes

**Low Probability (<30%)**:
- Negative Spurling's
- Negative ULTT
- No neurological signs

**Educational Link**: [www.theBackROM.com/education/Clickup/clinical-reasoning](https://www.theBackROM.com/education/Clickup/clinical-reasoning)

---

### Red Flags Screening

System integrates red flag screening during assessment:

**Spinal Red Flags**:
- Age <20 or >50 (first episode)
- Trauma history
- Constant progressive pain
- Thoracic pain
- PMH: Cancer, steroids, HIV, immunosuppression
- Systemically unwell
- Weight loss
- Widespread neurological symptoms
- Structural deformity
- Morning stiffness >1 hour

**Action**: Presence of red flags triggers automatic alert and documentation requirement.

---

## Educational Resources

### Integration with theBackROM.com

Every test, questionnaire, and battery links to comprehensive educational content:

**Video Demonstrations**: [www.theBackROM.com/education/Clickup/videos](https://www.theBackROM.com/education/Clickup/videos)
**Clinical Protocols**: [www.theBackROM.com/education/Clickup/protocols](https://www.theBackROM.com/education/Clickup/protocols)
**Evidence Summary**: [www.theBackROM.com/education/Clickup/evidence](https://www.theBackROM.com/education/Clickup/evidence)
**Interpretation Guides**: [www.theBackROM.com/education/Clickup/interpretation](https://www.theBackROM.com/education/Clickup/interpretation)

### Educational Series Topics

1. **Cervical Spine Assessment Mastery**
   - Video: Spurling's Test technique
   - Evidence: Diagnostic accuracy studies
   - Clinical reasoning: When to order imaging

2. **Outcome Measures 101**
   - Choosing the right questionnaire
   - Interpreting MCID
   - Tracking patient progress

3. **Balance Assessment in Clinical Practice**
   - TUG variations
   - Fall risk screening
   - Exercise prescription based on findings

4. **Building Custom Test Batteries**
   - Systematic approach to assessment
   - Combining tests for conditions
   - Documentation best practices

**Coming Soon**: Interactive assessment tutorials, case-based learning modules, CPD-accredited courses

---

## Implementation Notes

### Database Seeding

Run migrations and seeds in order:

```bash
# 1. Run migration
psql -U postgres -d chiroclick -f backend/migrations/009_test_batteries_and_questionnaires.sql

# 2. Seed special tests
psql -U postgres -d chiroclick -f backend/seeds/special_tests_physiopedia.sql
psql -U postgres -d chiroclick -f backend/seeds/special_tests_physiopedia_part2.sql
psql -U postgres -d chiroclick -f backend/seeds/special_tests_physiopedia_part3.sql

# 3. Seed questionnaire definitions
psql -U postgres -d chiroclick -f backend/seeds/questionnaires.sql

# 4. Seed normative data
psql -U postgres -d chiroclick -f backend/seeds/normative_data.sql
```

### Frontend Integration

UI components required (to be developed):
- Questionnaire form renderer
- Test battery builder interface
- Score visualization dashboards
- Normative comparison charts
- Progress tracking graphs

---

## References

1. Physio-pedia. (2024). Special Tests Category. https://www.physio-pedia.com/Category:Special_Tests

2. Vernon, H. (2008). The Neck Disability Index: State-of-the-Art, 1991-2008. *Journal of Manipulative and Physiological Therapeutics*, 31(7), 491-502.

3. Fairbank, J. C., & Pynsent, P. B. (2000). The Oswestry Disability Index. *Spine*, 25(22), 2940-2953.

4. Guralnik, J. M., et al. (1994). A Short Physical Performance Battery Assessing Lower Extremity Function. *Journal of Gerontology*, 49(2), M85-M94.

5. Cook, C., et al. (2010). Clustered Clinical Findings for Diagnosis of Cervical Spine Myelopathy. *Journal of Manual & Manipulative Therapy*, 18(4), 175-180.

---

**Document Version**: 1.0
**Last Updated**: 2024-11-22
**Maintained By**: ChiroClickCRM Development Team
**Educational Platform**: www.theBackROM.com/education/Clickup
