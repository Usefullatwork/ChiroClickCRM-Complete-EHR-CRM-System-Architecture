# ChiroClickCRM Database Improvement & Implementation Plan

**Created:** January 3, 2026
**Project:** Norwegian EHR/CRM System for Chiropractic Practices
**Status:** Ready for Implementation

---

## Executive Summary

This plan consolidates all available data sources to build out a comprehensive clinical database with:
- **96+ clinical examination tests** from your protocol files
- **7 cluster-based diagnostic modules** for evidence-based diagnosis
- **100+ patient records** ready for import
- **Security & compliance fixes** from the code review

---

## Part 1: Data Sources Inventory

### Clinical Examination Data
| Source File | Content | Tests/Records |
|------------|---------|---------------|
| `Kiropraktisk_Undersøkelsesprotokoll_Komplett.csv` | VNG, BPPV, Cerebellar, TMJ tests | 96 tests |
| `Undersokelsesprotokoll-Versjon1-Generell.md` | General screening protocol | 49 tests |
| `Undersokelsesprotokoll-Versjon2-Kluster.md` | Advanced cluster diagnostics | 7 clusters, 48 tests |

### Patient/CRM Data
| Source File | Content | Records |
|------------|---------|---------|
| `V2 CRM Data/import_patients.sql` | Patient records with contact info | 100+ patients |
| `V1 CRM data/Kontakt data.csv` | Legacy contact data | ~50 contacts |
| `Reaktivering/Kontakt data.csv` | Reactivation candidates | ~30 patients |

### Reference Documentation
| Source File | Purpose |
|------------|---------|
| `ChiroClickCRM_Code_Review_and_Improvement_Plan.md` | Security & architecture fixes |
| `ChiroClickCRM_30_Day_Sprint_Checklist.md` | Implementation timeline |
| `Orthopedic Conditions (Vizniak)` | Additional clinical tests (59MB PDF) |
| `Clinical Chiropractic (Vizniak)` | Clinical protocols |
| `Orthopedic Physical Assessment (Magee)` | Gold standard orthopedic tests |

---

## Part 2: Database Schema Enhancements

### New Tables Required

#### 1. Cluster Testing Module
```sql
-- Clinical test clusters for evidence-based diagnosis
CREATE TABLE examination_clusters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name_no VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    description_no TEXT,
    description_en TEXT,
    body_system VARCHAR(50), -- 'cerebellar', 'vestibular', 'cervical', 'tmj', 'myelopathy'
    threshold_score INTEGER NOT NULL, -- Min score for positive cluster
    max_score INTEGER NOT NULL,
    severity VARCHAR(20), -- 'CRITICAL', 'HIGH', 'MODERATE'
    action_if_positive TEXT, -- What to do when positive
    referral_required BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Individual tests within clusters
CREATE TABLE cluster_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cluster_id UUID REFERENCES examination_clusters(id) ON DELETE CASCADE,
    test_code VARCHAR(50) NOT NULL,
    test_name_no VARCHAR(255) NOT NULL,
    test_name_en VARCHAR(255),
    criteria_no TEXT[], -- Array of positive criteria in Norwegian
    criteria_en TEXT[],
    interpretation_no TEXT,
    interpretation_en TEXT,
    sort_order INTEGER,
    weight INTEGER DEFAULT 1, -- Weight in cluster scoring
    created_at TIMESTAMP DEFAULT NOW()
);

-- Patient cluster test results
CREATE TABLE cluster_test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    encounter_id UUID REFERENCES clinical_encounters(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    cluster_id UUID REFERENCES examination_clusters(id),
    tests_performed JSONB, -- {test_code: {result: 'positive', criteria_met: ['criterion1']}}
    score INTEGER,
    is_positive BOOLEAN,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### 2. Extended Clinical Tests Library
```sql
-- Comprehensive clinical tests (extends existing clinical_tests_library)
ALTER TABLE clinical_tests_library ADD COLUMN IF NOT EXISTS
    cluster_ids UUID[], -- Which clusters this test belongs to
ADD COLUMN IF NOT EXISTS
    likelihood_ratio_positive DECIMAL(5,2), -- LR+ for evidence-based testing
ADD COLUMN IF NOT EXISTS
    likelihood_ratio_negative DECIMAL(5,2), -- LR-
ADD COLUMN IF NOT EXISTS
    sensitivity DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS
    specificity DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS
    red_flag_conditions TEXT[], -- Conditions requiring immediate referral
ADD COLUMN IF NOT EXISTS
    contraindications TEXT[];
```

#### 3. VNG/Vestibular Testing Module
```sql
-- VNG-specific test results
CREATE TABLE vng_test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    encounter_id UUID REFERENCES clinical_encounters(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,

    -- Spontaneous nystagmus
    spontaneous_nystagmus VARCHAR(50), -- 'none', 'right', 'left', 'vertical', 'pendular'
    spontaneous_spv DECIMAL(5,2), -- Slow phase velocity degrees/sec

    -- Gaze testing
    gaze_horizontal VARCHAR(50),
    gaze_vertical VARCHAR(50),

    -- Saccades
    saccade_horizontal_gain DECIMAL(3,2),
    saccade_vertical_gain DECIMAL(3,2),
    saccade_latency_ms INTEGER,
    saccade_overshoots BOOLEAN,

    -- Smooth pursuit
    pursuit_horizontal_gain DECIMAL(3,2),
    pursuit_vertical_gain DECIMAL(3,2),
    pursuit_catch_up_saccades BOOLEAN,

    -- OPK
    opk_normal BOOLEAN,
    opk_asymmetric BOOLEAN,

    -- Caloric testing
    caloric_unilateral_weakness DECIMAL(5,2), -- Percentage
    caloric_directional_preponderance DECIMAL(5,2),
    caloric_affected_side VARCHAR(10),

    -- Interpretation
    interpretation TEXT,
    hints_plus_result VARCHAR(50), -- 'peripheral', 'central', 'inconclusive'

    created_at TIMESTAMP DEFAULT NOW()
);
```

#### 4. BPPV Testing & Treatment Tracking
```sql
CREATE TABLE bppv_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    encounter_id UUID REFERENCES clinical_encounters(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,

    -- Dix-Hallpike
    dix_hallpike_right VARCHAR(50), -- 'negative', 'geotropic_torsional', 'ageotropic', 'vertical'
    dix_hallpike_right_latency_sec INTEGER,
    dix_hallpike_right_duration_sec INTEGER,
    dix_hallpike_left VARCHAR(50),
    dix_hallpike_left_latency_sec INTEGER,
    dix_hallpike_left_duration_sec INTEGER,

    -- Supine Roll Test
    supine_roll_right VARCHAR(50), -- 'negative', 'geotropic', 'ageotropic'
    supine_roll_left VARCHAR(50),
    stronger_side VARCHAR(10),

    -- Bow and Lean
    bow_and_lean_result VARCHAR(50),

    -- Deep Head Hanging
    deep_head_hanging_result VARCHAR(50),

    -- Diagnosis
    canal_affected VARCHAR(50), -- 'posterior', 'lateral', 'anterior'
    variant VARCHAR(50), -- 'canalithiasis', 'cupulolithiasis'
    side_affected VARCHAR(10),

    -- Treatment performed
    treatment_maneuver VARCHAR(50), -- 'epley', 'semont', 'gufoni', 'bbq_roll', 'yacovino'
    treatment_successful BOOLEAN,
    post_treatment_nystagmus BOOLEAN,

    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Part 3: Clinical Tests to Import

### From Kiropraktisk_Undersøkelsesprotokoll_Komplett.csv (96 tests)

#### VNG/OKULOMOTORISK (8 tests)
- Spontan nystagmus
- Gaze horisontal
- Gaze vertikal
- Sakkader horisontal
- Sakkader vertikal
- Smooth pursuit horisontal
- Smooth pursuit vertikal
- OPK

#### BPPV (6 tests)
- Dix-Hallpike høyre/venstre
- Supine roll høyre/venstre
- Bow and Lean
- Deep head hanging

#### CEREBELLÆR (9 tests)
- Finger-nese-finger høyre/venstre
- Hel-kne-legg høyre/venstre
- Dysdiadokokinesi høyre/venstre
- Romberg
- Tandem gange
- Truncal stability

#### TMJ (8 tests)
- Inspeksjon
- TMJ palpasjon høyre/venstre
- Kjeve åpning
- Masseter palpasjon høyre/venstre
- Temporalis palpasjon høyre/venstre

#### DYNAMISK POSISJONELL (11 tests)
- Baseline deltoid anterior
- Cervical fleksjon/ekstensjon/rotasjon challenges
- Kjeve maksimal åpning challenge
- Lateral mandibel deviasjon
- Øyne lukket challenge
- Øyne maksimal gaze challenges

#### AKTIVATOR METODE (7 tests)
- Statisk benlengde
- Dynamisk hodeløft
- Dynamisk hoderotasjon høyre/venstre
- C0-C1 palpasjon
- C1-C2 palpasjon
- C2-C7 palpasjon

### Cluster Protocols (7 clusters, 48 specific tests)

#### KLUSTER 1: CEREBELLÆR DYSFUNKSJON (8 tests)
- Threshold: ≥4/8 = HIGH probability → Refer neurologist + MRI
- Tests: Saccade overshoots, Pursuit catch-up, Gaze-evoked nystagmus, FNF dysmetri, Dysdiadokokinesi, Tandem gange, Romberg modifisert, Heel-knee-shin

#### KLUSTER 2: PERIFERT VESTIBULÆRT TAP (6 tests)
- Threshold: ≥3/5 = HIGH probability peripheral loss
- Includes HINTS+ protocol for stroke exclusion
- Tests: Spontan nystagmus, Head Impulse Test, Caloric test, Test of Skew, Gangtest med hodebevegelser, Dynamic Visual Acuity

#### KLUSTER 3: BPPV DIFFERENSIERING
- Posterior canal (80-90% of BPPV)
- Lateral canal geotropisk/ageotropisk
- Anterior canal (rare <5%)

#### KLUSTER 4: CERVIKOGEN SVIMMELHET (7 tests)
- Threshold: ≥4/7 = Probable cervicogenic dizziness
- Tests: Cervical ROM, Smooth Pursuit Neck Torsion, Cervical Flexion-Rotation Test, Vertebral Artery Testing, Cervical JPE, Palpation C1-C3, Provocation test

#### KLUSTER 5: TMJ DYSFUNKSJON (7 tests)
- With subclassification: Myofascial/Disc/Artrose
- Tests: TMJ palpasjon, Masseter/Temporalis, Mandibulær ROM, Cervical-Mandibulær interaksjon, Dynamisk muskeltest, Upper cervical screening, Otalgia og referert smerte

#### KLUSTER 6: UPPER CERVICAL INSTABILITET (7 tests)
- CRITICAL: No HVLA if positive!
- Threshold: ≥4/7 = HIGH suspicion → MR flexion-extension
- Tests: Sharp-Purser, Alar Ligament Stress, Transverse Ligament, Membrana Tectoria, Cervical Flexion-Rotation, Selftesting, Neurologiske tegn

#### KLUSTER 7: MYELOPATI (6 tests)
- CRITICAL: Stop treatment, urgent referral!
- Threshold: ≥3/6 = HIGH suspicion
- Tests: Hoffmann's Sign, Hyperrefleksi, Babinski Sign, Lhermitte's Sign, Gange og koordinasjon, Hånd funksjontest

---

## Part 4: Implementation Phases

### Phase 1: Database Foundation (Week 1)
**Priority: CRITICAL**

1. [ ] Run existing migrations
2. [ ] Create new cluster tables
3. [ ] Add VNG/BPPV specialized tables
4. [ ] Create indexes for performance
5. [ ] Implement versioning triggers

### Phase 2: Clinical Tests Import (Week 2)
**Priority: HIGH**

1. [ ] Import 96 tests from CSV to clinical_tests_library
2. [ ] Create 7 examination clusters
3. [ ] Link tests to clusters
4. [ ] Add Norwegian/English translations
5. [ ] Set likelihood ratios and sensitivity/specificity

### Phase 3: Patient Data Import (Week 2-3)
**Priority: HIGH**

1. [ ] Review import_patients.sql for data quality
2. [ ] Fix date_of_birth (currently all 1980-01-01)
3. [ ] Validate phone numbers (+47 format)
4. [ ] Import patients to database
5. [ ] Generate follow-up tasks for inactive patients

### Phase 4: Security & Compliance (Week 3)
**Priority: CRITICAL**

1. [ ] Fix database SSL
2. [ ] Implement backup automation
3. [ ] Add clinical note versioning
4. [ ] Setup audit logging enhancement
5. [ ] Add rate limiting

### Phase 5: Testing & Validation (Week 4)
**Priority: HIGH**

1. [ ] Create unit tests for encryption
2. [ ] Test multi-tenant isolation
3. [ ] Validate cluster scoring logic
4. [ ] Test GDPR export functionality
5. [ ] Performance testing with indexes

---

## Part 5: Migration Files to Create

### Migration 018: Examination Clusters
```
backend/migrations/018_examination_clusters.sql
```

### Migration 019: VNG Testing Module
```
backend/migrations/019_vng_testing_module.sql
```

### Migration 020: BPPV Assessment Module
```
backend/migrations/020_bppv_assessments.sql
```

### Migration 021: Clinical Tests Enhancement
```
backend/migrations/021_clinical_tests_enhancement.sql
```

### Seed Files
```
database/seeds/06_examination_clusters.sql
database/seeds/07_cluster_tests.sql
database/seeds/08_vng_bppv_tests.sql
```

---

## Part 6: Test Categories Summary

| Category | Test Count | Cluster | Threshold | Action if Positive |
|----------|-----------|---------|-----------|-------------------|
| VNG/Okulomotorisk | 8 | Multiple | - | Part of cerebellar/vestibular |
| BPPV | 6 | BPPV | Canal-specific | Repositioning maneuver |
| Cerebellær | 9 | Cerebellar | ≥4/8 | Refer neurologist + MRI |
| TMJ | 8 | TMJ | ≥3/7 | Subclassify, treat |
| Dynamisk Posisjonell | 11 | Multiple | Position-specific | Identify dysfunction |
| Aktivator Metode | 7 | Cervical | Segment-specific | Adjust segment |
| Vestibulær | 6 | Vestibular | ≥3/5 | HINTS+ protocol |
| Cervikogen | 7 | Cervicogenic | ≥4/7 | Mobilization + rehab |
| C1-C2 Instabilitet | 7 | Instability | ≥4/7 | NO HVLA, MRI |
| Myelopati | 6 | Myelopathy | ≥3/6 | STOP, urgent referral |

**Total: 96+ unique tests across 10 categories and 7 diagnostic clusters**

---

## Part 7: Quick Start Commands

```bash
# Navigate to project
cd F:\ChiroClickCRM-Complete-EHR-CRM-System-Architecture

# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Database setup (requires PostgreSQL running)
createdb chiroclickcrm

# Run base schema
psql -U postgres -d chiroclickcrm -f database/schema.sql

# Run migrations
for file in backend/migrations/*.sql; do
    psql -U postgres -d chiroclickcrm -f "$file"
done

# Run seeds
for file in database/seeds/*.sql; do
    psql -U postgres -d chiroclickcrm -f "$file"
done

# Import patient data
psql -U postgres -d chiroclickcrm -f "F:/PROGAMMVARE - EHR - Øvelse - Behandling/EHR  --- CMR/V2 CRM Data/import_patients.sql"

# Start backend
cd backend && npm run dev

# Start frontend
cd frontend && npm run dev
```

---

## Part 8: Files Referenced

### From Your Data Directory
- `F:\PROGAMMVARE - EHR - Øvelse - Behandling\EHR  --- CMR\EHR\Kiropraktisk_Undersøkelsesprotokoll_Komplett.csv`
- `F:\PROGAMMVARE - EHR - Øvelse - Behandling\EHR  --- CMR\EHR\Undersokelsesprotokoll-Versjon1-Generell.md`
- `F:\PROGAMMVARE - EHR - Øvelse - Behandling\EHR  --- CMR\EHR\Undersokelsesprotokoll-Versjon2-Kluster.md`
- `F:\PROGAMMVARE - EHR - Øvelse - Behandling\EHR  --- CMR\V2 CRM Data\import_patients.sql`

### Clinical References (for manual extraction)
- Orthopedic Conditions (Dr. Nikita A. Vizniak) - 59.2MB PDF
- Clinical Chiropractic (Dr. Nikita A. Vizniak)
- Orthopedic Physical Assessment 7e (Magee)

---

## Next Steps

1. **Confirm PostgreSQL is installed and running**
2. **Create the database and run schema**
3. **Execute the migration files I'll create**
4. **Import clinical tests from CSV**
5. **Import patient data**
6. **Test the system**

Would you like me to proceed with creating the migration files?
