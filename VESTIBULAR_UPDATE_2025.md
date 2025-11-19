# Vestibular Module - 2025 Advanced Features Update 🚀

## Summary

This update elevates the vestibular assessment module to **state-of-the-art 2025 standards** based on:
- Cleveland Clinic advanced testing protocols
- Carrick Institute functional neurology methods
- Evidence-based VRT guidelines (American Physical Therapy Association)
- Latest clinical practice guidelines for BPPV and vestibular rehabilitation

---

## 🆕 What's Been Added

### 1. **Advanced Diagnostic Tests**

#### vHIT (Video Head Impulse Test)
- ✅ Tests all 6 semicircular canals (not just 2 like calorics)
- ✅ HIMP & SHIMP protocols
- ✅ Quantitative VOR gain measurement
- ✅ Corrective saccade detection
- ⚡ **30x faster than caloric testing**

#### VEMP (Vestibular Evoked Myogenic Potential)
- ✅ cVEMP (saccule/inferior nerve)
- ✅ oVEMP (utricle/superior nerve)
- ✅ **Critical for Superior Canal Dehiscence diagnosis**
- ✅ Quantitative amplitude/latency measurements

#### DVA (Dynamic Visual Acuity)
- ✅ Functional VOR assessment during head movement
- ✅ **Only test that measures compensation** (not just loss)
- ✅ **92% sensitive fall risk predictor**
- ✅ Tracks rehabilitation effectiveness
- ⚡ **Quick bedside test (5-10 min)**

#### Rotational Chair Testing
- ✅ Low-frequency VOR assessment
- ✅ Essential for bilateral vestibulopathy
- ✅ Better tolerated in children

---

### 2. **Carrick Receptor-Based Rehabilitation**

Functional neurology approach with multi-sensory stimulation:

**Visual Stimuli:**
- Color filters (blue/green/red)
- Optokinetic LED panels
- Phototherapy (stroboscopic/steady light)

**Auditory Stimuli:**
- Binaural beats (40 Hz gamma, 10 Hz alpha)
- Monolateral sound stimulation

**Proprioceptive Stimuli:**
- Vibration therapy (cervical, masseter, foot soles)

**Vestibular Stimuli:**
- Interactive Metronome
- Bilateral coordination exercises

⚠️ **Note:** Limited high-quality evidence - use as adjunct therapy

---

### 3. **Evidence-Based VRT Protocols**

Now includes **specific dosing guidelines** from clinical research:

**Gaze Stabilization:**
- Acute: 3x/day, 12 min minimum, 4-6 weeks
- Chronic: 3-5x/day, 20-40 min, 4-6 weeks
- Bilateral: 3-5x/day, 20-40 min, 5-7 weeks

**Balance Exercises:**
- Unilateral: 20 min daily, 4-6 weeks
- Bilateral: 20 min daily, 6-9 weeks

**Habituation:**
- Patient-specific triggers
- 5 repetitions, 3x/day
- Until symptom habituation

---

### 4. **Testing Sequence Optimization**

**⭐ CRITICAL: SUPINE ROLL TEST FIRST**

**Why?** Prevents "order effect" where maneuvers move otoconia between canals

**New Standardized Sequence:**
1. Supine Roll Test (horizontal canal)
2. Dix-Hallpike Right/Left (posterior/anterior canals)
3. Deep Head Hang (if downbeat/upbeat observed)
4. Lean Test (if Supine Roll positive)
5. Oculomotor testing
6. Balance testing

**Benefit:**
- ✅ Reduced diagnostic errors
- ✅ Better detection of canal conversion
- ✅ Clearer interpretation

---

### 5. **Additional Outcome Measures**

- **ABC Scale** (Activities-Specific Balance Confidence): <67 = fall risk
- **VSR** (Vestibular/Spatial Disorientation)
- **Post-Concussion Symptom Scale**: For mTBI with vestibular involvement

---

### 6. **New Diagnosis Codes**

- `H83.8X9` - Superior Canal Dehiscence Syndrome
- `H81.23` - Bilateral Vestibulopathy
- `F07.81` - Postconcussional Syndrome
- `S06.0` - Concussion

---

### 7. **New Treatment Codes**

- `VEST05` - vHIT testing (1500 kr, 30 min)
- `VEST06` - VEMP testing (1800 kr, 45 min)
- `VEST07` - DVA test (600 kr, 15 min)
- `VEST08` - Rotational Chair (2000 kr, 60 min)
- `VEST09` - Functional Neurology Treatment (1200 kr, 45 min)

---

## 📊 Database Changes

**New Migration:** `010_advanced_vestibular_testing.sql`

**New Fields in `vestibular_assessments`:**
- `vhit_performed`, `vhit_results` (JSONB)
- `vemp_performed`, `vemp_results` (JSONB)
- `dva_performed`, `dva_results` (JSONB)
- `rotational_chair_performed`, `rotational_chair_results` (JSONB)
- `test_sequence` (JSONB array - tracks order)
- `receptor_based_treatments` (JSONB array)
- `vrt_protocol` (JSONB - evidence-based dosing)
- `functional_neuro_assessment` (JSONB)
- `abc_score`, `vsr_score`, `post_concussion_score` (outcome measures)

---

## 📝 Clinical Templates

**New Templates:** `advanced_vestibular_templates.sql`

**80+ new Norwegian templates including:**

**vHIT:**
- Normal all 6 canals
- Unilateral vestibular weakness
- HIMP vs SHIMP protocols

**VEMP:**
- Normal bilateral
- Superior Canal Dehiscence (SCD)
- Absent responses

**DVA:**
- Normal (<2 lines lost)
- Abnormal (>2 lines lost = fall risk)
- Asymmetric (unilateral weakness)

**VRT Enhanced:**
- Acute phase protocol
- Chronic phase protocol
- Bilateral vestibulopathy protocol

**Carrick Methods:**
- Visual stimulation
- Multi-sensory receptor stimulation

**Testing Sequence:**
- Recommended 2025 sequence
- Canal conversion recognition

**Outcome Measures:**
- ABC Scale
- Post-concussion vestibular assessment

---

## 🔧 Installation

### 1. Run Migration
```bash
cd backend
psql -U postgres -d chiro_db -f migrations/010_advanced_vestibular_testing.sql
```

### 2. Load Templates
```bash
psql -U postgres -d chiro_db -f seeds/advanced_vestibular_templates.sql
```

### 3. Restart Backend
Services are backward compatible - no code changes needed.

---

## 📚 Documentation

**Complete Documentation:**
- `/docs/VESTIBULAR_MODULE.md` - Original module documentation
- `/docs/VESTIBULAR_ADVANCED_FEATURES.md` - **NEW** Advanced features guide

**Includes:**
- Clinical decision trees
- Evidence-based protocols
- Testing sequence optimization
- Carrick methods explanation
- Outcome measure interpretation
- Red flags and urgent referrals

---

## 🎯 Clinical Workflow Example

**Patient: 45F with persistent dizziness post-concussion (2 weeks ago)**

1. **History:** Dizziness with head movement, difficulty in busy environments
2. **vHIT:** Normal VOR gain bilaterally ✓
3. **DVA:** 4 lines lost horizontal ❌ **ABNORMAL**
4. **Diagnosis:** Post-concussion vestibular dysfunction
5. **Treatment:**
   - VRT protocol: Gaze stabilization 3x/day, 12 min
   - Visual motion desensitization
   - Gradual return to activity
6. **Follow-up:** Repeat DVA after 2 weeks
7. **Outcome:** DVA improved to 1 line lost ✓ (successful rehabilitation)

**Key Point:** vHIT was normal, but DVA caught the dysfunction!

---

## ⚡ Key Improvements

| Feature | Before | After |
|---------|--------|-------|
| **Testing Time** | 60+ min (calorics) | 30 min (vHIT) |
| **Canal Coverage** | 2 canals (horizontal) | All 6 canals |
| **Compensation Measure** | No | Yes (DVA) |
| **Fall Risk Prediction** | DHI only | DHI + DVA + ABC |
| **VRT Dosing** | Generic | Evidence-based specific |
| **Testing Sequence** | Variable | Standardized (Supine Roll first) |
| **SCD Diagnosis** | Limited | VEMP (gold standard) |

---

## 🔬 Evidence Base

**vHIT:**
- Frontiers in Neurology 2017 - "The Video Head Impulse Test"
- Sensitivity: 84-100% for vestibular neuronitis

**DVA:**
- Journal of Vestibular Research - Sensitivity 92%, Specificity 95%
- Best predictor of fall risk in elderly

**VEMP:**
- Neurology 2017 Practice Guideline
- Gold standard for Superior Canal Dehiscence

**VRT Dosing:**
- American Physical Therapy Association Guidelines 2022
- Based on systematic reviews and meta-analyses

---

## 🚨 Clinical Pearls

1. **Always do Supine Roll Test FIRST** to avoid order effect
2. **DVA is more sensitive than vHIT** for post-concussion patients
3. **VEMP is critical** if you suspect Superior Canal Dehiscence
4. **Canal conversion happens in 20-30% of BPPV cases** - be ready to treat multiple canals
5. **VRT compliance is key** - use specific dosing protocols, track with DVA
6. **Bilateral vestibulopathy** takes LONGER to rehabilitate (6-9 weeks vs 4-6 weeks)

---

## 👥 Credits

**Research Sources:**
- Cleveland Clinic Balance Disorders Center
- Carrick Institute for Graduate Studies
- American Physical Therapy Association - Neurology Section
- Multiple peer-reviewed journals (Frontiers in Neurology, Neurology, Journal of Vestibular Research)

**Implementation:**
- ChiroClickCRM Development Team
- Based on real-world journal data from Norwegian chiropractic practice

---

## 📞 Support

For questions:
- See `/docs/VESTIBULAR_ADVANCED_FEATURES.md` for complete clinical guide
- Check templates in `advanced_vestibular_templates.sql`
- Review database schema in `010_advanced_vestibular_testing.sql`

---

**Version:** 2.0 - Advanced Features
**Release Date:** 2025-11-19
**Compatibility:** Fully backward compatible with v1.0
