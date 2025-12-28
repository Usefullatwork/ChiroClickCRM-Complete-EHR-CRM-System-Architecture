-- Shoulder & Arm Clinical Templates
-- Comprehensive examination protocols for orthopedic/chiropractic practice
-- Based on orthopedic conditions reference standards

-- ============================================================================
-- SHOULDER EXAM FLOW (Comprehensive Protocol)
-- ============================================================================

SELECT insert_template('Skulder', 'Exam Flow', 'Complete Shoulder Exam Flow',
'SHOULDER EXAMINATION PROTOCOL

HISTORY:
- Specific mechanism of injury & forces involved
- Fall on outstretched hand (FOOSH)?
- Any numbness, tingling, or weakness?
- Type of work, typical posture, sleeping position?
- Overhead work or overuse activities?
- Prior injuries?

INSPECTION (Standing/Seated):
- Asymmetry, bruising, color, swelling, height
- Head tilt, winging of scapula, shoulder hiking
- Posture of head, neck & thoracic spine
- Step defect, sulcus sign, antalgia

AROM:
- Flexion: 180° | Extension: 50°
- Int/Ext Rotation: 90°/80°
- Abduction: 180° | Adduction: 35°
- Horizontal Add/Abd: 130°/30°
- Scapulohumeral rhythm assessment

PROM & JOINT PLAY (if lacking AROM)

MYOTOMES:
- Shoulder elevation (C4, XI)
- Deltoid (C5, C6 - axillary)
- Brachioradialis (C5, C6 - radial)
- Biceps (C5, C6 - musculocutaneous)
- Triceps (C6, C7, C8, T1 - radial, axillary)
- Wrist extensors (C6, C7, C8 - radial)
- Wrist flexors (C6, C7 - median/ulnar)
- Finger flexors (C7, C8, T1 - ulnar/median)
- Interossei (C7, C8, T1 - ulnar)

NEUROVASCULAR SCREEN:
- Sensory: Light touch, two-point discrimination
- Vibration (3rd digit), Tinel''s, sharp/dull
- DTR''s: Biceps (C5), Brachioradialis (C6), Triceps (C7)
- Grip strength (Dynamometer)
- Radial & brachial pulse, blanching, temperature

PALPATION (may be done after ROM):
[Posterior] Trapezius (upper/middle/lower), Rhomboids
           Thoracic spine, Ribs 1-posterior
           Levator scapulae, Supraspinatus, Infraspinatus
           Teres minor/major, Latissimus dorsi
[Lateral]  AC joint, Deltoid, Deltoid tuberosity
[Anterior] SC joint, Pectoralis major/minor
           Coracoid process, Coracobrachialis
           Biceps brachii, Bicipital groove
           Subscapularis, Serratus anterior
           Triceps brachii

SPECIAL TESTS (as indicated):
See individual test templates for specific conditions', 'objective');

-- ============================================================================
-- SHOULDER SCREENING TESTS
-- ============================================================================

SELECT insert_template('Skulder', 'Screening', 'Shoulder Screening Tests',
'SHOULDER SCREENING TESTS:
- Apley''s superior scratch: ____
- Apley''s inferior scratch: ____
- Codman''s arm drop: ____
- Dugas test: ____
- AROM Empty can: ____', 'objective');

-- ============================================================================
-- SHOULDER KINEMATICS (Reference)
-- ============================================================================

SELECT insert_template('Skulder', 'Kinematics', 'Shoulder Joint Kinematics Reference',
'SHOULDER KINEMATICS:

Joint Types:
- Glenohumeral: Ball & socket (convex on concave)
- Scapulothoracic: Gliding (not true joint)
- Acromioclavicular: Gliding
- Sternoclavicular: Saddle

ACTIVE ROM:
- Flexion: 180° | Extension: 60°
- Int/Ext Rotation: 90°/80°
- Abduction: 180° | Adduction: 35°
- Horizontal Add/Abd: 130°/45°
- Scapulohumeral rhythm: 2:1 (120°:60°)

RESTING POSITIONS:
- GH: 55-70° abduction, 30° horizontal abduction
- AC: arm at side
- SC: arm at side

CLOSE PACKED POSITIONS:
- GH: maximal abduction & lateral rotation
- AC: 90° abduction
- SC: full elevation

NORMAL END FEEL:
- Flexion: elastic, firm capsular
- Abduction: elastic
- Extension: firm
- Int/Ext Rotation: elastic/firm
- Horizontal adduction: soft tissue
- Horizontal abduction: firm/elastic

CAPSULAR PATTERN (GH):
External rotation > Abduction > Internal rotation', 'objective');

-- ============================================================================
-- IMPINGEMENT SYNDROME TEMPLATES
-- ============================================================================

SELECT insert_template('Skulder', 'Impingement', 'Impingement Syndrome Assessment',
'IMPINGEMENT SYNDROME EVALUATION:

History:
- Dull, achy shoulder pain worse with abduction above 90°
- Overhead activity or excessive use aggravates
- Pain may be worse after sleeping if arm abducted

Physical Findings:
- Painful arc: 60-120° of flexion or abduction
- Shoulder hiking on affected side
- Possible altered scapulohumeral rhythm

Special Tests:
- Hawkins-Kennedy Test: ____
- Neer''s (Impingement Sign): ____
- Passive Neer''s Test: ____
- Painful arc: ____

Stages (after Neer):
Stage 1: <25 yrs - edema & hemorrhage, reversible
Stage 2: 25-40 yrs - tendinopathy from repeated inflammation
Stage 3: >40 yrs - trophic changes, possible tendon ruptures

Differential Diagnosis:
- Biceps tendonitis
- Rotator cuff injuries
- Adhesive capsulitis
- AC joint pathology
- Glenoid labral tear
- Subacromial bursitis', 'objective');

SELECT insert_template('Skulder', 'Impingement', 'Impingement Tests Positive',
'IMPINGEMENT TESTS - POSITIVE:
- Hawkins-Kennedy Test: POSITIVE - pain with shoulder flexed 90° and internally rotated
- Neer''s Impingement Sign: POSITIVE - pain with passive forward flexion
- Passive Neer''s Test: POSITIVE
- Painful arc: POSITIVE - pain between 60-120° of abduction

Clinical Impression: Findings consistent with subacromial impingement syndrome', 'objective');

-- ============================================================================
-- ROTATOR CUFF TEMPLATES
-- ============================================================================

SELECT insert_template('Skulder', 'Rotator Cuff', 'Rotator Cuff Strain Assessment',
'ROTATOR CUFF STRAIN EVALUATION:

History:
- Pain over superior lateral shoulder
- Pain aggravated by leaning on elbow & pushing upward
- Popping/tearing sensation at moment of injury
- Followed by pain & weakness
- Possible edema, erythema, hematoma (severe)
- Intolerance to overhead activity
- Night pain, especially lying on affected shoulder

Physical Findings:
Inspection: Possible muscle wasting in supraspinatus/infraspinatus fossae
Palpation: Tenderness over rotator cuff muscles, myospasm, trigger points
AROM: Weakness/pain during abduction, external/internal rotation
PROM: Pain if impingement or end-range stretch
RROM: Pain and weakness during specific muscle tests

SPECIAL TESTS:
- Empty Can (Jobe''s): ____
- Codman''s Arm Drop: ____
- Lift-Off Test: ____
- Bear-Hug Test: ____
- Internal Rotation Lag Sign: ____
- External Rotation Lag Sign: ____

Grading:
- Grade 1 (mild): 2-4 weeks recovery
- Grade 2 (moderate): 4-12 weeks recovery
- Grade 3 (severe): 8-18 weeks recovery
- Grade 4 (full tear): 3 months-1 year recovery', 'objective');

SELECT insert_template('Skulder', 'Rotator Cuff', 'Supraspinatus Tendinopathy',
'SUPRASPINATUS TENDINOPATHY:

History:
- Gradual onset of dull, achy shoulder pain
- Pain directly below acromion
- Worse following activity
- May affect ADLs (dressing, sleeping)
- Better with rest or ice

Physical Findings:
Inspection: Usually WNL, rarely visible swelling
Palpation: Tenderness over supraspinatus tendon
Motion:
- AROM: Painful arc 60-130° abduction
- PROM: Painful myospasm end-feel
- RROM: Weakness on resisted shoulder abduction

Special Tests:
- Empty Can Test: ____
- Full Can Test: ____
- Codman''s Arm Drop Test: ____

Prognosis: Most injuries respond well to conservative care (2-8 weeks)', 'objective');

SELECT insert_template('Skulder', 'Rotator Cuff', 'Subscapularis Tendinopathy',
'SUBSCAPULARIS TENDINOPATHY:

History:
- Gradual onset of shoulder pain in anterior/posterior axillary fold
- Pain worse with internal rotation (esp. overhead)
- Pain is "sharp" with activity but decreases with warm-up
- Worse with excessive activity
- Possible prior history of trauma or instability

Physical Findings:
Inspection: Usually WNL
Palpation: Tenderness over subscapularis tendon or lesser tubercle
Motion:
- AROM: External rotation may be painful at end-range
- PROM: Painful/myospasm end-feel with external rotation
- RROM: Weakness on resisted internal rotation

Special Tests:
- Internal Rotation Lag Sign: ____ (Sn 97%, Sp 96%)
- Lift-Off Test: ____
- Bear-Hug Test: ____
- Belly Press Test: ____
- Napoleon Test: ____

Prognosis: Most injuries respond well to conservative care (2-8 weeks)', 'objective');

SELECT insert_template('Skulder', 'Rotator Cuff', 'Rotator Cuff Tests Positive',
'ROTATOR CUFF TESTS - POSITIVE:

Supraspinatus:
- Empty Can/Jobe''s Test: POSITIVE - weakness/pain at 90° abduction, 30° forward flexion, thumbs down
- Full Can Test: POSITIVE
- Codman''s Arm Drop: POSITIVE - unable to lower arm slowly from 90°

Subscapularis:
- Lift-Off Test: POSITIVE - unable to lift hand away from back
- Bear-Hug Test: POSITIVE - weakness with internal rotation
- Internal Rotation Lag Sign: POSITIVE
- Napoleon/Belly Press Test: POSITIVE

Infraspinatus/Teres Minor:
- External Rotation Lag Sign: POSITIVE
- Hornblower''s Sign: POSITIVE
- Resisted External Rotation: Weak/painful

Clinical Impression: Findings suggest rotator cuff pathology', 'objective');

-- ============================================================================
-- BICIPITAL TENDINOPATHY
-- ============================================================================

SELECT insert_template('Skulder', 'Biceps', 'Bicipital Tendinopathy Assessment',
'BICIPITAL TENDINOPATHY EVALUATION:

Pathophysiology Theories:
1. Mechanical: Repetitive loading causes microscopic degeneration
2. Vascular: Focal areas of vascular compromise
3. Neural modulation: Neurally mediated mast cell degranulation
4. Subluxating tendon: Rupture of transverse humeral ligament

History:
- Pain over anterior shoulder & bicipital groove
- Worst with repeated shoulder/elbow flexion, supination
- Overhead activities aggravate
- Pain decreases with rest, massage, heat
- Possible repeatable "snapping" or "clicking"

Physical Findings:
Inspection: Possible mild swelling & redness (rare)
Palpation: HALLMARK - local tenderness over bicipital groove
Motion:
- PROM: Usually WNL until end-play stretches bicipital tendon
- AROM: Possible aggravation with shoulder & elbow flexion/supination
- RROM: Pain with resisted shoulder & elbow flexion

Special Tests:
- Speed''s Test: ____
- Hyperextension Test: ____
- Yergason''s Test: ____

Prognosis: Usually complete recovery in 2-4 weeks, full recovery 6-8 weeks', 'objective');

SELECT insert_template('Skulder', 'Biceps', 'Biceps Tests Positive',
'BICEPS TENDON TESTS - POSITIVE:

- Speed''s Test: POSITIVE - pain in bicipital groove with resisted forward flexion, elbow extended, forearm supinated
- Hyperextension Test: POSITIVE - pain with passive shoulder extension, elbow extended
- Yergason''s Test: POSITIVE - pain with resisted supination and external rotation, elbow flexed 90°

Clinical Impression: Findings consistent with bicipital tendinopathy', 'objective');

-- ============================================================================
-- CALCIFIC TENDINOPATHY
-- ============================================================================

SELECT insert_template('Skulder', 'Calcific', 'Calcific Tendinopathy Assessment',
'CALCIFIC TENDINOPATHY EVALUATION:

Pathophysiology (Uhthoff & Loehr Phases):
1. Formative phase: Fibrocartilaginous transformation, calcium deposit forms (chalk-like)
2. Resting phase: Deposit may or may not be painful
3. Resorptive phase: Inflammatory reaction - VERY PAINFUL (deposit becomes toothpaste-like)
4. Postcalcific phase: Fibroblasts reconstitute collagen, symptoms subside

Demographics:
- Incidence: 7% of painful shoulders
- Peak age: 30-60 years
- Female > Male (2:1)

History:
- Chronic, mild pain with occasional flare-up
- Pain aggravated by overhead activity
- Pain when sleeping on affected shoulder
- Possible stiffness or weakness

Physical Findings:
Inspection: Possible swelling or redness
Palpation: Possible tenderness or warmth over affected tendon
Motion:
- Possible decreased ROM into shoulder abduction
- Painful arc 60-120° of flexion or abduction
- Possible intense pain with motion during resorptive phase

Special Tests:
- Neer''s Test: ____
- Push Button Sign: ____ (focal tenderness over deposit)

Imaging: X-ray commonly used to confirm diagnosis
- Deposits range from toothpaste to chalky consistency
- Usually 1-2 cm in length', 'objective');

-- ============================================================================
-- AC JOINT SPRAIN
-- ============================================================================

SELECT insert_template('Skulder', 'AC Joint', 'AC Sprain Assessment',
'ACROMIOCLAVICULAR (AC) SPRAIN EVALUATION:

Mechanism of Injury:
1. Direct force to superior acromion (fall with arm adducted)
2. FOOSH - indirect force transmitted through humeral head

Classification:
Type 1: Local to AC capsule, mild trapezius/levator myospasm
        No visible displacement, X-ray (-)
Type 2: AC capsule & coracoclavicular ligaments
        AC & coracoid tenderness, marked myospasm
        Visible clavicle elevation, X-ray shows elevation
        <1/2 thickness of distal clavicle (4-5mm joint space)
Type 3: Major AC & coracoclavicular ligament involvement
        Severe tenderness, possible swelling
        Visible displacement
        X-ray: >1/2 thickness clavicle, >5mm joint space
        >25% increase in coracoclavicular space

History:
- History of trauma (impact, FOOSH, or heavy lifting)
- Possible antalgic posture (supporting arm)

Physical Findings:
Inspection: Step defect - prominent lateral clavicle
Palpation: Pain & tenderness over AC joint (Sn 96%, Sp 10%)
Motion:
- AROM/PROM: Increased pain at >90° abduction (close-packed)
- Possible empty end-feel with superior glide
- RROM: May be normal or decreased due to pain

Special Tests:
- AC Shear Test: ____
- Piano Key Sign: ____
- Horizontal Adduction Test: ____
- AC Resisted Extension Test: ____
- O''Brien''s Test: ____', 'objective');

SELECT insert_template('Skulder', 'AC Joint', 'AC Joint Tests Positive',
'AC JOINT TESTS - POSITIVE:

- AC Shear Test: POSITIVE - pain with anteroposterior pressure on AC joint
- Piano Key Sign: POSITIVE - clavicle depresses like piano key
- Horizontal Adduction (Cross-Body) Test: POSITIVE - pain with passive horizontal adduction
- AC Resisted Extension Test: POSITIVE
- O''Brien''s Test: POSITIVE for AC pathology

Clinical Impression: Findings consistent with AC joint sprain/separation', 'objective');

-- ============================================================================
-- FROZEN SHOULDER (ADHESIVE CAPSULITIS)
-- ============================================================================

SELECT insert_template('Skulder', 'Frozen Shoulder', 'Frozen Shoulder Assessment',
'ADHESIVE CAPSULITIS (FROZEN SHOULDER) EVALUATION:

Pathophysiology:
- Hyperplastic fibroplasia & excessive type III collagen
- Leads to soft-tissue contractures of GH joint capsule

Stages:
1. Painful stage: Shoulder pain with movement, ROM starts to become limited
2. Frozen stage: Pain may decrease, ROM substantially reduced
3. Thawing stage: ROM begins to improve & return to normal

Demographics:
- Incidence: 2% general population (11% in diabetics)
- Age: Usually 40-60 years
- Female > Male (2:1)

Risk Factors:
- Age over 40
- Prolonged immobility of shoulder
- Systemic diseases (diabetes, hyperthyroidism)
- Prior trauma

History:
- HALLMARK: Pain & loss of ROM
- May be idiopathic - no prior injury
- Gradual increase in pain & loss of motion
- Prior history of shoulder immobilization
- Possible systemic disease (diabetes)

Physical Findings:
Inspection: Usually WNL, possible GH muscle atrophy (advanced)
Palpation: Direct pressure on joint capsule is painful
Motion:
- AROM: Decreased ROM, inability to perform Apley''s scratch
- PROM: Painful capsular end-feel especially with external rotation & abduction
- Motion most severely affected: External rotation > Abduction > Internal rotation > Flexion
- RROM: May cause pain (rotator cuff continuous with GH capsule)

Special Tests:
- Apley''s Superior Scratch: ____
- Arm Drop Test: ____
- Speed''s Test: ____

Prognosis: Usually resolves ~2 years after initial onset in ~60% of cases', 'objective');

SELECT insert_template('Skulder', 'Frozen Shoulder', 'Frozen Shoulder ROM Findings',
'FROZEN SHOULDER - ROM FINDINGS:

Active ROM (Limited):
- Flexion: ____ degrees (normal 180°)
- Abduction: ____ degrees (normal 180°)
- External Rotation: ____ degrees (normal 80°) - MOST AFFECTED
- Internal Rotation: ____ degrees (normal 90°)

Passive ROM:
- All directions: Capsular end-feel with pain
- Pattern: External rotation > Abduction > Internal rotation

Capsular Pattern Confirmed: YES/NO

Stage Assessment:
- [ ] Painful stage (early)
- [ ] Frozen stage (restricted ROM, less pain)
- [ ] Thawing stage (improving ROM)

Current Functional Limitations:
- [ ] Unable to reach overhead
- [ ] Unable to reach behind back
- [ ] Difficulty dressing
- [ ] Sleep disruption', 'objective');

-- ============================================================================
-- GH INSTABILITY
-- ============================================================================

SELECT insert_template('Skulder', 'Instability', 'GH Instability Assessment',
'GLENOHUMERAL (GH) INSTABILITY EVALUATION:

Definition: Inability to maintain humeral head centered in glenoid fossa

Types:
- Anterior inferior (95% of cases)
- Posterior (~1%)
- Multidirectional (~1%, usually congenital)

Degrees:
- Apprehension: Fear shoulder will subluxate/dislocate
- Subluxation: Transient partial separation, spontaneously reduces
- Dislocation: Complete separation of articular surfaces

Grades:
Grade 0 (WNL): 0-25% translation
Grade 1: 25-50% translation, riding up on glenoid labrum
Grade 2: 50% translation, rides over labrum, immediately reduces
Grade 3: >50% translation, remains dislocated

Etiology:
- Traumatic: Damage to rotator cuff, labrum, GH ligaments
- Overuse: Repeated overhead activities
- Atraumatic: Congenital, generalized joint laxity

History:
- General shoulder pain, worse with activity
- Pain worse with certain arm positions (overhead, carrying objects)
- Better with rest or heat
- Possible catching or locking with motion
- Prior athletic injury or dislocation
- Often associated with impingement symptoms

Physical Findings:
Inspection: Possible sulcus sign or redness
Palpation: Tenderness, trigger points, myospasm of rotator cuff
Motion:
- AROM/PROM: Possible repeatable clunk or apprehension
- Pain/impingement with 60-120° abduction
- Altered scapulohumeral rhythm

Special Tests (Instability):
- Load & Shift (Ant/Post): ____
- Sulcus Test: ____
- Feagin''s Test: ____
- Anterior Apprehension Test: ____
- Relocation Test: ____
- Release Maneuver: ____
- Posterior Apprehension Test: ____
- Norwood''s Posterior Drawer: ____', 'objective');

SELECT insert_template('Skulder', 'Instability', 'Instability Tests Positive',
'GH INSTABILITY TESTS - POSITIVE:

Inferior Instability:
- Sulcus Test (arm dependent): POSITIVE - sulcus visible below acromion
- Feagin''s Test (arm abducted 90°): POSITIVE

Anterior Instability (best done supine):
- Anterior Apprehension Test: POSITIVE - patient apprehension with external rotation & abduction
- Relocation Test: POSITIVE - symptoms relieved with posterior pressure
- Release Maneuver: POSITIVE - symptoms return when pressure released
- Load & Shift (Anterior): POSITIVE - excessive anterior translation

Posterior Instability:
- Posterior Apprehension Test: POSITIVE
- Norwood''s Posterior Drawer: POSITIVE
- Load & Shift (Posterior): POSITIVE - excessive posterior translation

Clinical Impression: Findings consistent with GH instability - ____ (anterior/posterior/multidirectional)', 'objective');

-- ============================================================================
-- GLENOID LABRAL TEAR (SLAP Lesion)
-- ============================================================================

SELECT insert_template('Skulder', 'Labral', 'Glenoid Labral Tear Assessment',
'GLENOID LABRAL TEAR (SLAP LESION) EVALUATION:

Types:
- SLAP (Superior Labrum Anterior Posterior) - more common
- Bankart Lesion - tear of lower half of labrum (with dislocations)
- Bennett Lesion - posterior labral tear

SLAP Classification:
Type 1: Fraying of labrum, biceps anchor intact
Type 2: Tear of superior labrum causing biceps anchor instability (most common)
Type 3: Bucket-handle tear of superior labrum
Type 4: Bucket-handle tear extending into biceps tendon

History:
- Pain with overhead or cross-body activities
- Snapping, popping, catching with motion
- Occasional night pain or pain with ADLs
- Sense of instability in shoulder
- Decreased range of motion & strength
- Prior history of overuse or direct trauma

Physical Findings:
Inspection: Patient may be protective, arm in sling position
Palpation: Tenderness around bicipital tendon, anterior deltoid, supraspinatus
Motion:
- AROM: Pain, crepitus, decreased ROM above head
- PROM: Crepitus, decreased ROM with myospasm end-feel
- RROM: Weakness due to pain (biceps)

Special Tests:
- O''Brien''s Test (Active Compression): ____
- Clunk Test: ____
- Crank Test: ____
- Biceps Load Test II: ____ (Sn 90%, Sp 97%, LR+ 26.4)
- Passive Compression Test: ____
- Speed''s Test: ____

Note: Co-existing rotator cuff tears occur in 40% of labral tears', 'objective');

SELECT insert_template('Skulder', 'Labral', 'Labral Tear Tests Positive',
'LABRAL TEAR TESTS - POSITIVE:

- O''Brien''s Test (Active Compression): POSITIVE - pain with arm at 90° flexion, 15° adduction, internal rotation, relieved with external rotation
- Clunk Test: POSITIVE - palpable/audible clunk with circumduction
- Crank Test: POSITIVE - pain or clicking with compression & rotation
- Biceps Load Test II: POSITIVE - anterior shoulder pain with resisted elbow flexion at 120° abduction, full external rotation
- Passive Compression Test: POSITIVE

Clinical Impression: Findings suggestive of glenoid labral tear (SLAP lesion)', 'objective');

-- ============================================================================
-- GLENOHUMERAL ARTHRITIS
-- ============================================================================

SELECT insert_template('Skulder', 'GH Arthritis', 'GH Arthritis Assessment',
'GLENOHUMERAL ARTHRITIS EVALUATION:

Pathophysiology:
- Progressive wear & tear damage to GH joint articular surfaces
- Asymmetric narrowing → subchondral sclerosis → osteophyte formation
- Later: complete loss of articular cartilage → bone destruction

Demographics:
- Incidence: ~20% of elderly population
- Age: Usually >50 years (possible 40+ years)
- Male > Female (2:1)

Risk Factors:
- Prior injury or repetitive stress
- Joint infection, Rheumatoid arthritis
- Ligament or rotator cuff tear (GH instability)
- Osteonecrosis

History:
- Insidious onset of shoulder pain & discomfort
- Often "stiff" in morning
- Better with mild activity, worse with excessive activity
- Better with rest or heat
- Pain may change with barometric pressure
- Crepitus with motion (snapping & popping)
- Possible loss of ROM & affected ADLs

Physical Findings:
Inspection: Look for wasting & asymmetry
Palpation: Possible tenderness over GH capsule
          Trigger points & myospasm of surrounding musculature
Motion:
- AROM: General decrease with possible pain
- PROM: Clicking/popping (crepitus), limited firm abnormal end-feels
- RROM: Muscle weakness due to pain

Special Tests:
- Apley''s Scratch Tests: ____
- Ellman''s Compression Rotation Test: ____

Differential Diagnosis:
- Frozen shoulder
- GH instability
- Supraspinatus tear
- Labral tear
- Rotator cuff tendinopathy
- Cervical radiculopathy', 'objective');

-- ============================================================================
-- SCAPULOCOSTAL SYNDROME
-- ============================================================================

SELECT insert_template('Skulder', 'Scapulocostal', 'Scapulocostal Syndrome Assessment',
'SCAPULOCOSTAL SYNDROME EVALUATION:

Definition: Common pain-producing syndrome affecting posterior shoulder
Associated with altered scapulothoracic motion, "snapping shoulder" & bursitis

Pathophysiology:
- Abnormal relationship between scapula & ribs
- Pain referral over region of posterior scapula, back & shoulder
- Multiple potential pain generators

Possible Causes:
- Poor posture (rounded shoulder, forward head, slouching)
- Myofascial trigger points in serratus anterior or subscapularis
- Adhesions or scar tissue formation
- Exostosis of ribs under scapula
- Traumatic injury (whiplash, direct blow)

Demographics:
- Very common
- Age: 20-50 years
- Female > Male
- Risk factors: Desk jobs/students, arms extended for long periods
- Overuse (swimming, gymnastics, laborers)

History:
- Pain in scapular region
- Possible crepitus with movement or dyskinesis
- Prior injury (whiplash), repetitive activity, poor ergonomics
- Pain with shoulder activities or prolonged sitting

Physical Findings:
Inspection: Possible hyperkyphosis, forward head, rounded shoulders
           Upper cross syndrome pattern
Palpation: Tenderness over medial border of scapula
          Possible trigger points in levator scapulae, trapezius, rhomboids
          Myospasm of scapular stabilization muscles
Motion:
- AROM: Usually full or slightly decreased due to pain
- Altered scapulohumeral rhythm
- Audible/visible crepitus with motion
- PROM: Possible myospasm end-feel with palpable crepitus
- RROM: WNL or mild weakness (lower trapezius & rhomboids)

Upper & Lower Cross Syndrome Assessment:
UPPER CROSS:
- Tight: Upper trapezius, Levator scapulae, Pectoralis major
- Weak: Deep neck flexors, Rhomboids, Serratus anterior
LOWER CROSS:
- Tight: Iliopsoas, Erector spinae
- Weak: Abdominal muscles, Gluteus maximus', 'objective');

-- ============================================================================
-- SHOULDER PAIN REFERRAL PATTERNS
-- ============================================================================

SELECT insert_template('Skulder', 'Referral', 'Shoulder Pain Referral Patterns',
'SHOULDER PAIN REFERRAL PATTERNS:

IMPORTANT: Shoulder pain can be referred from chest or abdomen!
- Coronary artery disease
- Pulmonary tumors
- Gallbladder disease

Anterior Shoulder:
- Bicipital Tendinopathy → anterior shoulder, bicipital groove
- AC Osteoarthritis → top of shoulder
- Subacromial Bursitis → lateral shoulder

Lateral Shoulder:
- Rotator Cuff Pathology → lateral deltoid region
- Supraspinatus Tendinopathy → beneath acromion

Posterior Shoulder:
- Posterior Muscle Strain → posterior deltoid area
- Infraspinatus/Teres Minor → posterior shoulder, upper arm

Cervical Referral:
- C4 → Top of shoulder
- C5 → Lateral upper arm
- C6 → Lateral forearm to thumb
- C7 → Posterior arm to middle finger

Visceral Referral:
- Heart (MI) → Left shoulder, medial arm
- Gallbladder → Right shoulder (Kehr''s sign)
- Diaphragm → Top of shoulder
- Spleen → Left shoulder (Kehr''s sign with rupture)', 'objective');

-- ============================================================================
-- SHOULDER TREATMENT TEMPLATES
-- ============================================================================

SELECT insert_template('Skulder', 'Treatment', 'Shoulder Conservative Treatment Plan',
'SHOULDER CONSERVATIVE TREATMENT PLAN:

General Measures:
- [ ] PRICE protocol (acute phase)
- [ ] Avoid aggravating activities
- [ ] Cold application (acute) / Heat (chronic)
- [ ] Consider short-term NSAIDs

Manual Therapy:
- [ ] Soft tissue release / Myofascial release
- [ ] Trigger point therapy
- [ ] Cross-friction massage (subacute phase)
- [ ] Pin & stretch techniques
- [ ] Joint mobilization (GH, AC, SC)
- [ ] Thoracic & cervical spine manipulation

Modalities:
- [ ] Ultrasound therapy
- [ ] Interferential current / TENS
- [ ] Low-level laser therapy

Rehabilitation:
- [ ] Pendulum exercises (Codman''s)
- [ ] PROM exercises
- [ ] Active-assisted ROM
- [ ] Isometric strengthening
- [ ] Progressive resistance exercises
- [ ] Scapular stabilization exercises
- [ ] Proprioceptive training
- [ ] Sport/work-specific exercises

Patient Education:
- [ ] Ergonomic evaluation
- [ ] Postural correction (Brugger''s exercises)
- [ ] Home exercise program
- [ ] Sleeping position modification
- [ ] Activity modification guidelines', 'plan');

SELECT insert_template('Skulder', 'Treatment', 'Rotator Cuff Rehabilitation Protocol',
'ROTATOR CUFF REHABILITATION PROTOCOL:

Goals: Elimination of pain & restoration of motion, flexibility, strength & endurance

Phase 1 - Acute (Week 1-2):
- [ ] Rest (avoid prolonged immobilization → risk of frozen shoulder)
- [ ] Short-term sling use if needed
- [ ] Cryotherapy for pain & inflammation
- [ ] Pain-free PROM exercises
- [ ] Gentle pendulum exercises

Phase 2 - Subacute (Week 2-6):
- [ ] Progress to pain-free AROM
- [ ] Aquatic therapy for resistance
- [ ] Isometric strengthening
- [ ] Stretching (posterior capsule focus)

Phase 3 - Strengthening (Week 6-12):
- [ ] Progress to resisted exercises
- [ ] Concentric → Eccentric progression
- [ ] Tubing exercises
- [ ] Scapular stabilization (PNF patterns)

Phase 4 - Functional (Week 12+):
- [ ] Sport/work-specific exercises
- [ ] Plyometric training
- [ ] Return to activity progression

Home Exercise Prescription:
- External rotation with resistance band
- Internal rotation with resistance band
- Prone horizontal abduction (I, T, Y, W)
- Wall slides
- Doorway stretches', 'plan');

-- ============================================================================
-- SHOULDER SUBJECTIVE TEMPLATES
-- ============================================================================

SELECT insert_template('Skulder', 'Subjective', 'Shoulder Pain History Template',
'SHOULDER PAIN - SUBJECTIVE:

Chief Complaint: Shoulder pain - ____ (right/left/bilateral)

History of Present Illness:
- Onset: ____ (sudden/gradual)
- Duration: ____ (days/weeks/months)
- Mechanism of injury: ____ (FOOSH/direct trauma/overuse/insidious)
- Location: ____ (anterior/lateral/posterior/superior)
- Quality: ____ (sharp/dull/aching/burning)
- Severity: VAS ___/10
- Timing: ____ (constant/intermittent/night pain)

Aggravating Factors:
- [ ] Overhead activities
- [ ] Lifting
- [ ] Lying on affected side
- [ ] Reaching behind back
- [ ] Carrying objects
- Other: ____

Relieving Factors:
- [ ] Rest
- [ ] Ice/heat
- [ ] Medication
- [ ] Position change
- Other: ____

Associated Symptoms:
- [ ] Numbness/tingling (location: ____)
- [ ] Weakness
- [ ] Clicking/popping
- [ ] Instability/giving way
- [ ] Night pain
- [ ] Neck pain

Previous Treatment:
- ____

Functional Impact:
- ADLs affected: ____
- Work limitations: ____
- Sleep disturbance: ____

Red Flags Screened:
- [ ] No unexplained weight loss
- [ ] No fever/chills
- [ ] No history of cancer
- [ ] No progressive neurological deficit
- [ ] No significant trauma', 'subjective');

-- ============================================================================
-- SHOULDER ASSESSMENT TEMPLATES
-- ============================================================================

SELECT insert_template('Skulder', 'Assessment', 'Shoulder Assessment Summary',
'SHOULDER ASSESSMENT:

Clinical Impression:
Primary Diagnosis: ____
- [ ] Rotator cuff strain/tendinopathy
- [ ] Impingement syndrome
- [ ] Bicipital tendinopathy
- [ ] AC joint sprain/osteoarthritis
- [ ] Adhesive capsulitis (Frozen shoulder)
- [ ] GH instability
- [ ] Glenoid labral tear (SLAP lesion)
- [ ] Glenohumeral arthritis
- [ ] Scapulocostal syndrome
- [ ] Calcific tendinopathy
- Other: ____

Secondary Diagnoses: ____

Clinical Reasoning:
Based on examination findings:
- History consistent with: ____
- Physical findings support: ____
- Positive special tests: ____
- Imaging findings (if applicable): ____

Differential Diagnoses Considered:
1. ____
2. ____
3. ____

Red Flags: None identified / Present: ____

Prognosis: ____ (Good/Fair/Guarded)
Expected recovery: ____ weeks/months

Recommended Further Workup:
- [ ] None at this time
- [ ] X-ray
- [ ] MRI
- [ ] Ultrasound
- [ ] Referral to specialist', 'assessment');

-- Clean up helper function (if running standalone)
-- DROP FUNCTION IF EXISTS insert_template(VARCHAR, VARCHAR, VARCHAR, TEXT, VARCHAR, VARCHAR);
