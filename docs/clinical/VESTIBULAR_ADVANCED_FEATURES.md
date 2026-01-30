## Vestibular Module - Advanced Features (2025 Update)

### Based on Latest Research & Functional Neurology Best Practices

---

## 🆕 What's New (2025 Update)

This update adds cutting-edge vestibular assessment tools based on:
- **Cleveland Clinic Protocol 2025** (Patient-specific testing)
- **Carrick Institute** Functional Neurology methods
- **American Physical Therapy Association** Evidence-based VRT guidelines
- **2025 Clinical Practice Guidelines** for BPPV and vestibular rehabilitation

---

## 1. Advanced Diagnostic Testing

### 1.1 vHIT (Video Head Impulse Test)

**What it tests:** Vestibulo-Ocular Reflex (VOR) for all 6 semicircular canals

**Protocols:**
- **HIMP (Head Impulse):** Standard protocol - patient fixates earth-fixed target
- **SHIMP (Suppression Head Impulse):** Patient fixates head-fixed target (laser)

**Parameters Measured:**
- VOR Gain (normal: >0.8)
- Corrective Saccades (overt vs covert)
- Binocular VOR conjugacy

**Clinical Value:**
- ✅ Faster than caloric testing (30 min vs 60 min)
- ✅ Tests all 6 canals (caloric only tests horizontal)
- ✅ Quantitative results
- ✅ Can track rehabilitation progress

**When to use:**
- Suspected vestibular neuronitis
- Suspected labyrinthitis
- Ménière's disease
- Bilateral vestibulopathy
- Post-concussion vestibular dysfunction

**Database Fields:**
```javascript
vhit_performed: boolean
vhit_results: {
  horizontal_right: {vor_gain: 0.95, corrective_saccades: false},
  horizontal_left: {vor_gain: 0.92, corrective_saccades: false},
  posterior_right: {vor_gain: 0.88, corrective_saccades: false},
  posterior_left: {vor_gain: 0.90, corrective_saccades: false},
  anterior_right: {vor_gain: 0.85, corrective_saccades: false},
  anterior_left: {vor_gain: 0.87, corrective_saccades: false},
  protocol: 'HIMP' or 'SHIMP',
  notes: ''
}
```

---

### 1.2 VEMP (Vestibular Evoked Myogenic Potential)

**What it tests:** Saccule, Utricle, and vestibular nerve pathways

**Two Types:**
- **cVEMP (Cervical):** Tests saccule & inferior vestibular nerve
  - Recorded from SCM muscle
  - Stimulus: 500 Hz tone burst, 95 dB nHL
  - Parameters: p1-n1 latency, amplitude, threshold

- **oVEMP (Ocular):** Tests utricle & superior vestibular nerve
  - Recorded from inferior oblique muscle
  - Parameters: n1-p1 latency, amplitude

**Critical for Diagnosing:**
- ⭐ **Superior Canal Dehiscence Syndrome** (SCDS)
  - Hallmark: Abnormally LARGE cVEMP amplitude
  - Hallmark: Abnormally LARGE oVEMP amplitude
  - Hallmark: LOWER threshold
- Vestibular neuronitis (absent responses)
- Ménière's disease (monitoring)
- Vestibular schwannoma

**Database Fields:**
```javascript
vemp_performed: boolean
vemp_results: {
  cvemp_right: {p1_latency: 13.5, n1_latency: 23.2, p1_n1_amplitude: 85, threshold: 95},
  cvemp_left: {p1_latency: 13.8, n1_latency: 23.5, p1_n1_amplitude: 80, threshold: 95},
  ovemp_right: {n1_latency: 10.5, p1_latency: 15.2, amplitude: 12},
  ovemp_left: {n1_latency: 10.8, p1_latency: 15.5, amplitude: 11},
  asymmetry_ratio: 0.05,
  interpretation: 'Normal bilateral responses',
  notes: ''
}
```

**Red Flags (Urgent ØNH Referral):**
- Suspected SCDS with:
  - Autophony (hearing own voice/heartbeat loudly)
  - Tullio phenomenon (vertigo triggered by loud sounds)
  - Hennebert sign (vertigo with pressure changes)

---

### 1.3 DVA (Dynamic Visual Acuity)

**What it tests:** Functional VOR during head movement

**Why it's important:**
- ✅ **Only test that measures compensation** (not just loss)
- ✅ **Sensitive fall risk predictor** (92% sensitivity, 95% specificity)
- ✅ **Tracks rehabilitation effectiveness** (unlike caloric/vHIT)
- ✅ **Quick bedside test** (5-10 minutes)

**Protocol:**
1. Measure static visual acuity (patient still)
2. Measure dynamic visual acuity during head rotation (120-180°/sec)
3. Calculate lines lost

**Interpretation:**
- **Normal:** <2 lines lost
- **Abnormal:** >2 lines lost (indicates poor VOR)
- **Severe:** >4 lines lost (high fall risk)

**Asymmetric DVA:**
- Right rotation worse → Left vestibular weakness
- Left rotation worse → Right vestibular weakness

**Database Fields:**
```javascript
dva_performed: boolean
dva_results: {
  static_acuity: '20/20',
  dynamic_acuity_horizontal: '20/25',
  dynamic_acuity_vertical: '20/30',
  lines_lost_horizontal: 1,
  lines_lost_vertical: 2,
  abnormal: false,
  head_velocity_achieved: 150,
  notes: ''
}
```

**Clinical Use:**
- Initial assessment: Establish baseline
- Progress tracking: Repeat every 2 weeks during VRT
- Discharge criteria: DVA < 2 lines lost

---

### 1.4 Rotational Chair Testing

**What it tests:** Low-frequency VOR (complements caloric testing)

**When to use:**
- Bilateral vestibulopathy (caloric may be absent bilaterally)
- Young children (better tolerated than calorics)
- Suspected central vs peripheral pathology

**Parameters:**
- VOR Gain at multiple frequencies (0.01 Hz, 0.02 Hz, 0.04 Hz, etc.)
- Phase (timing of response)
- Symmetry
- Directional preponderance

---

## 2. Carrick Receptor-Based Rehabilitation

**Source:** Carrick Institute for Functional Neurology

**Principle:** Use neuroplasticity through multi-sensory stimulation

**⚠️ Evidence Level:** Limited high-quality evidence. Use as adjunct, not primary treatment.

### 2.1 Visual Stimuli

- **Color Filters:** Blue/green/red filters over one or both eyes
  - Theory: Modulate magnocellular vs parvocellular pathways
  - Duration: 10-15 minutes

- **Optokinetic Stimulation:** LED panels with moving patterns
  - Frequency: Variable (slow to fast)
  - Direction: Horizontal, vertical, circular

- **Phototherapy:** Stroboscopic or steady light
  - Frequency: 10 Hz (alpha), 40 Hz (gamma)
  - Duration: 3-5 minutes

### 2.2 Auditory Stimuli

- **Binaural Beats:** Different frequencies to each ear
  - 40 Hz (gamma) - attention/cognition
  - 10 Hz (alpha) - relaxation

- **Monolateral Sound:** Stimulation to one ear only
  - Theory: Activate specific vestibular pathways

### 2.3 Proprioceptive Stimuli

- **Vibration Therapy:**
  - Cervical muscles (100 Hz, 2 min)
  - Masseter muscles (jaw, bilateral)
  - Foot soles (proprioceptive input)

### 2.4 Vestibular Stimuli

- **Interactive Metronome:** Rhythmic timing exercises
  - Bilateral hand/foot coordination
  - Duration: 15-20 minutes

**Database Fields:**
```javascript
receptor_based_treatments: [
  {type: 'visual', method: 'color_filters', details: 'Blue filter right eye', duration: '10 min'},
  {type: 'auditory', method: 'binaural_beats', details: '40Hz gamma', duration: '10 min'},
  {type: 'proprioceptive', method: 'vibration', details: 'Cervical 100Hz', duration: '2 min'},
  {type: 'vestibular', method: 'interactive_metronome', details: 'Bilateral coordination', duration: '15 min'}
]
```

**When to Consider:**
- Post-concussion syndrome with vestibular involvement
- Chronic vestibular dysfunction not responding to standard VRT
- Central vestibular pathology
- Patient preference for multimodal treatment

---

## 3. Evidence-Based VRT Protocols (2025)

**Source:** American Physical Therapy Association Clinical Practice Guidelines

### 3.1 Gaze Stabilization Dosing

**Acute/Subacute Unilateral Vestibulopathy:**
- Frequency: 3 times per day
- Duration: Minimum 12 minutes total daily
- Duration: 4-6 weeks

**Chronic Unilateral Vestibulopathy:**
- Frequency: 3-5 times per day
- Duration: 20-40 minutes total daily
- Duration: 4-6 weeks

**Bilateral Vestibulopathy:**
- Frequency: 3-5 times per day
- Duration: 20-40 minutes total daily
- Duration: 5-7 weeks

**Exercises:**
1. **X1 Viewing (VOR x1):**
   - Patient fixates earth-fixed target
   - Head rotation 2 Hz horizontal/vertical
   - Goal: Maintain visual acuity

2. **X2 Viewing (VOR x2):**
   - Patient moves head and eyes same direction
   - Target moves with head
   - Goal: Enhance adaptation

### 3.2 Balance Exercise Dosing

**Unilateral Vestibulopathy:**
- Frequency: Daily
- Duration: Minimum 20 minutes
- Duration: 4-6 weeks

**Bilateral Vestibulopathy:**
- Frequency: Daily
- Duration: Minimum 20 minutes
- Duration: 6-9 weeks

**Progression:**
1. Static balance (eyes open → eyes closed)
2. Dynamic balance (walking, turns)
3. Dual-task balance (cognitive + motor)

### 3.3 Habituation Dosing

**Must be individualized to patient's specific triggers!**

- Identify provocative movements (e.g., rolling in bed, looking up)
- Repeat trigger 5 times per session
- Frequency: 3 times per day
- Goal: Provoke symptoms but not overwhelm
- Duration: Until symptom habituation occurs (typically 2-4 weeks)

### 3.4 VRT Protocol Database Structure

```javascript
vrt_protocol: {
  phase: 'acute' or 'subacute' or 'chronic',
  laterality: 'unilateral' or 'bilateral',
  gaze_stabilization: {
    frequency_per_day: 3,
    duration_minutes: 12,
    total_duration_weeks: 4,
    exercises: ['X1 viewing horizontal', 'X1 viewing vertical', 'X2 viewing']
  },
  balance: {
    frequency_per_day: 1,
    duration_minutes: 20,
    total_duration_weeks: 6,
    exercises: ['Static balance eyes open/closed', 'Dynamic balance', 'Tandem walking']
  },
  habituation: {
    provocative_stimuli: ['Rolling over in bed', 'Looking up', 'Bending forward'],
    frequency_per_day: 3,
    repetitions: 5
  },
  adaptation_substitution: {
    exercises: ['VOR adaptation with head turns', 'Saccadic substitution training'],
    frequency_per_day: 3,
    duration_minutes: 10
  }
}
```

---

## 4. Testing Sequence Optimization

### 4.1 The "Order Effect" Problem

**Problem:** BPPV maneuvers can move otoconia to different canals
→ Affects subsequent test results
→ Risk of misdiagnosis

**Example:**
1. Do Dix-Hallpike first (positive for posterior canal BPPV)
2. Do Supine Roll Test second
3. Supine Roll now shows horizontal canal BPPV
4. **But:** Did horizontal BPPV exist originally, or did Dix-Hallpike move debris?

### 4.2 Recommended Testing Sequence (2025)

**Based on:** Cleveland Clinic Protocol & Recent Research

```
1. SUPINE ROLL TEST FIRST ✓
   Why: Least likely to cause canal conversion

2. DIX-HALLPIKE (Right, then Left)
   Why: Most common BPPV variant

3. DEEP HEAD HANG
   Why: Only if Dix-Hallpike shows downbeat/upbeat (anterior canal)

4. LEAN TEST
   Why: Only if Supine Roll positive (for side determination)

5. OCULOMOTOR TESTING
   Why: After positional tests complete

6. BALANCE TESTING
   Why: Last (least affected by order)
```

**Database Field:**
```javascript
test_sequence: [
  {test: 'supine_roll', order: 1, time: '10:30'},
  {test: 'dix_hallpike_right', order: 2, time: '10:35'},
  {test: 'dix_hallpike_left', order: 3, time: '10:38'}
]
```

### 4.3 Canal Conversion Recognition

**If you observe:**
- Initial test: Horizontal canal BPPV
- After maneuver: Posterior canal BPPV (same side)

**This is:** Canal conversion / Canal switch (20-30% of cases)

**Action:**
1. Treat the NEW canal first (posterior)
2. Re-test after 5 minutes
3. Treat residual horizontal BPPV if present

---

## 5. Additional Outcome Measures

### 5.1 ABC Scale (Activities-Specific Balance Confidence)

**Range:** 0-100%

**Interpretation:**
- >80: High balance confidence
- 50-80: Moderate
- <50: Low
- **<67: Increased fall risk in elderly**

**Use:** Pre/post VRT to track functional improvement

### 5.2 VSR (Vestibular/Spatial Disorientation)

**Use:** Supplement to DHI for spatial disorientation symptoms

### 5.3 Post-Concussion Symptom Scale

**Use:** mTBI/concussion cases with vestibular involvement

**Key Point:** DVA is MORE sensitive than vHIT for post-concussion vestibular dysfunction!

---

## 6. New Diagnosis Codes

- **H83.8X9** - Superior Canal Dehiscence Syndrome
- **H81.23** - Bilateral Vestibulopathy
- **F07.81** - Postconcussional Syndrome
- **S06.0** - Concussion

---

## 7. New Treatment Codes

- **VEST05** - vHIT testing (1500 kr, 30 min)
- **VEST06** - VEMP testing (1800 kr, 45 min)
- **VEST07** - DVA test (600 kr, 15 min)
- **VEST08** - Rotational Chair (2000 kr, 60 min)
- **VEST09** - Functional Neurology Treatment (1200 kr, 45 min)

---

## 8. Clinical Decision Tree

```
Patient presents with dizziness/vertigo
↓
History suggests BPPV? (positional, brief episodes)
├─ YES → BPPV Testing Protocol (Supine Roll First!)
│         ├─ Positive → Repositioning maneuver
│         │            → Re-test after 5 min
│         │            → Canal conversion? → Treat new canal
│         └─ Negative → Consider other causes
│
└─ NO → Vestibular neuronitis/labyrinthitis suspected?
         ├─ YES → vHIT + DVA
         │        ├─ vHIT abnormal → Confirm diagnosis, start VRT
         │        └─ vHIT normal but DVA abnormal → Central? Further workup
         │
         └─ NO → Complex presentation
                  └─ Comprehensive battery: vHIT + VEMP + DVA + Rotational Chair
                     ├─ VEMP abnormal (large amplitude) → Consider SCDS → CT temporal bone
                     ├─ Bilateral vHIT loss → Bilateral vestibulopathy → Workup cause
                     └─ All normal but DVA abnormal → Central pathology → MRI brain
```

---

## 9. Integration with Existing System

All new features integrate seamlessly with existing `vestibular_assessments` table:

**Migration:** `010_advanced_vestibular_testing.sql`
**Templates:** `advanced_vestibular_templates.sql`
**Frontend:** Will update `VestibularAssessment.jsx` to include new tabs

---

## 10. References

1. Cleveland Clinic Balance Disorders Protocol (2025)
2. Carrick Institute Clinical Neuroscience Program
3. American Physical Therapy Association - Vestibular Rehabilitation Guidelines (2022 update)
4. Clinical Practice Guideline: BPPV (Update) - Bhattacharyya et al. 2017
5. Video Head Impulse Test - Frontiers in Neurology (2017)
6. VEMP Testing - Practice Guideline - Neurology (2017)
7. Dynamic Visual Acuity - Rehab Measures Database
8. Functional Neurology Review - Chiropractic & Manual Therapies (2019)

---

## 11. Installation

### Step 1: Run Migration
```bash
psql -U postgres -d chiro_db -f backend/migrations/010_advanced_vestibular_testing.sql
```

### Step 2: Load Templates
```bash
psql -U postgres -d chiro_db -f backend/seeds/advanced_vestibular_templates.sql
```

### Step 3: Update Services (Already done)
Services are backward compatible - new fields are optional.

---

## 12. Future Enhancements

- [ ] Video recording integration for vHIT/nystagmus
- [ ] AI-assisted nystagmus interpretation
- [ ] Patient portal with home VRT exercise videos
- [ ] Automated VRT progression based on DVA/DHI scores
- [ ] Integration with wearable devices for home compliance tracking

---

**Version:** 2.0 (Advanced Features)
**Last Updated:** 2025-11-19
**Based on:** 2025 Clinical Practice Guidelines & Functional Neurology Research
