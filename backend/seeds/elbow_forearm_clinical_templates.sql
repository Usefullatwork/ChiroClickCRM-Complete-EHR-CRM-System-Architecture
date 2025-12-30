-- Elbow & Forearm Clinical Templates
-- Comprehensive examination protocols for orthopedic/chiropractic practice
-- Based on orthopedic conditions reference standards

-- ============================================================================
-- ELBOW EXAM FLOW (Comprehensive Protocol)
-- ============================================================================

SELECT insert_template('Albue', 'Exam Flow', 'Complete Elbow Exam Flow',
'ELBOW EXAMINATION PROTOCOL

HISTORY:
- Specific mechanism of injury & forces involved
- Fall on outstretched hand (FOOSH)?
- Any numbness, tingling, or weakness?
- Type of work, typical activities?
- Prior injuries?

INSPECTION (Standing/Seated):
- Asymmetry, bruising, bumps, color, swelling
- Posture of neck, body, shoulder
- Carrying angle (normal 5°-15°)

FRACTURE SCREEN (if indicated):
1. Older than 5 years?
2. Bony tenderness on palpation
3. Percussion, tuning fork (128 Hz)
4. Ultrasound, Torsion Test
5. Elbow pain with grip/wrist motions

PALPATION:
[Medial]
- Medial epicondyle, ulnar groove
- Medial collateral ligament
- Common flexor tendon
- Flexor carpi ulnaris/radialis
- Palmaris longus, pronator teres

[Lateral]
- Lateral epicondyle
- Lateral collateral ligament
- Extensor tendon
- Anconeus, brachioradialis
- Ext. carpi ulnaris/radialis longus/brevis
- Extensor digitorum, supinator

[Posterior]
- Triceps tendon & muscle
- Olecranon, olecranon bursa

[Anterior]
- Cubital fossa, brachialis
- Biceps tendon/aponeurosis
- Head of radius, radial tunnel

AROM:
- Flexion: 150°
- Extension: 0° to -5°
- Pronation: 90°
- Supination: 90°

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
- Vibration (3rd digit), sharp/dull
- Tinel''s (at elbow and wrist)
- DTR''s: Biceps (C5), Brachioradialis (C6), Triceps (C7)
- Grip strength (Dynamometer)
- Radial & brachial pulse, blanching, temperature

SPECIAL TESTS (as indicated):
- Stability: Valgus stress (0° & 30°), Varus stress (0° & 30°)
- See individual test templates', 'objective');

-- ============================================================================
-- ELBOW KINEMATICS (Reference)
-- ============================================================================

SELECT insert_template('Albue', 'Kinematics', 'Elbow Joint Kinematics Reference',
'ELBOW KINEMATICS:

Joint Types:
- Humeroulnar: Hinge (concave on convex)
- Humeroradial: Hinge & Pivot (concave on convex)
- Proximal Radioulnar: Pivot (convex on concave)

ACTIVE ROM:
- Flexion: 150°
- Extension: 0° to -5°
- Pronation: 80-90°
- Supination: 90°

Main Muscle Actions:
- Flexion: Brachialis, Biceps brachii, Brachioradialis
- Extension: Triceps brachii, Anconeus
- Pronation: Pronator teres, Pronator quadratus
- Supination: Biceps brachii, Supinator

RESTING POSITIONS:
- Humeroulnar: 70° flexion
- Humeroradial: Full extension & supination
- Proximal Radioulnar: 70° flexion, 35° supination

CLOSE PACKED POSITIONS:
- Humeroulnar: Full extension
- Humeroradial: 90° flexion, 5° supination
- Proximal Radioulnar: 5° supination, 90° flexion

CAPSULAR PATTERN:
- Humeroulnar: Flexion > Extension
- Humeroradial: Flexion > Extension
- Proximal Radioulnar: Supination = Pronation limited

NORMAL END FEEL:
- Flexion: Soft tissue approximation
- Extension: Bony approximation
- Pronation: Bony approximation or ligamentous
- Supination: Ligamentous

ABNORMAL END FEEL:
- Boggy → Joint effusion
- Early myospasm → Acute injury
- Late myospasm → Instability
- Springy block → Loose body (osteochondritis dissecans)

CARRYING ANGLE:
- Normal: 5°-15°
- Cubitus valgum: >15°
- Cubitus varum: <5°', 'objective');

-- ============================================================================
-- LATERAL EPICONDYLITIS (Tennis Elbow)
-- ============================================================================

SELECT insert_template('Albue', 'Lateral Epicondylitis', 'Lateral Epicondylitis Assessment',
'LATERAL EPICONDYLITIS (TENNIS ELBOW) EVALUATION:

Definition: Lateral elbow pain secondary to tendinosis & periostitis
Most common condition affecting the elbow

Pathophysiology:
- Overuse injury to common extensor tendon
- Primarily affects extensor carpi radialis brevis (ECRB)
- Microtears → inflammation → fibrosis
- May also involve ECRL, extensor digitorum, ECU

Demographics:
- Very common
- Age: Usually 20-40 years
- Male = Female

Risk Factors (Systematic Review - 3 main factors):
1. Handling tools heavier than 1 kg
2. Handling loads heavier than 20 kg at least 10 times/day
3. Repetitive movements more than 2 hrs/day

Activities: Tennis, typing, gardening (hedge trimmers),
           Video games, musical instruments, carpenters/plumbers

History:
- Lateral elbow pain following activity without direct trauma
- Usually unilateral, gradual onset
- Difficulty picking up items or weak grip strength
- Pain with gripping steering wheel, lifting books

Physical Findings:
Inspection: Usually WNL (no swelling or bruising)
Palpation: Localized tenderness just distal & anterior to lateral epicondyle
           (origin of ECRB)
Motion:
- Elbow ROM usually WNL
- AROM/PROM: Pain with wrist flexion (stretch of ECRB)
- RROM: Increased pain with resisted wrist extension

Neurovascular:
- Decreased grip strength on dynamometer
- Pulses WNL
- Assess shoulder for compensatory overuse

Special Tests:
- Cozen''s Test (Tennis Elbow Test): ____
- Mill''s Test: ____
- Middle Finger Extension Test: ____
- Book Test: ____
- Resisted Supination: ____

Differential Diagnosis:
- Elbow arthritis or fractures
- Cervical radiculopathy
- Rotator cuff conditions
- Radial nerve compression
- Fibromyalgia', 'objective');

SELECT insert_template('Albue', 'Lateral Epicondylitis', 'Lateral Epicondylitis Tests Positive',
'LATERAL EPICONDYLITIS TESTS - POSITIVE:

- Cozen''s Test: POSITIVE - pain with resisted wrist extension, forearm pronated, elbow extended
- Mill''s Test: POSITIVE - pain with passive wrist flexion, forearm pronated, elbow extended
- Middle Finger Extension Test: POSITIVE - pain with resisted middle finger extension
- Book Test: POSITIVE - pain when lifting object with wrist extended
- Resisted Supination: POSITIVE

Point of Maximum Tenderness: Lateral epicondyle / ECRB origin

Clinical Impression: Findings consistent with lateral epicondylitis (tennis elbow)', 'objective');

-- ============================================================================
-- MEDIAL EPICONDYLITIS (Golfer's Elbow)
-- ============================================================================

SELECT insert_template('Albue', 'Medial Epicondylitis', 'Medial Epicondylitis Assessment',
'MEDIAL EPICONDYLITIS (GOLFER''S ELBOW) EVALUATION:

Definition: Medial elbow pain secondary to tendinosis & periostitis
Also known as: Pitcher''s elbow, Little League elbow (in children)

Pathophysiology:
- Repetitive use of flexor & pronator forearm muscles
- Microtears where common flexor tendon attaches
- Disruption & degeneration of tendon''s internal structure
- Histologically: Angiofibroblastic hyperplasia, tendinosis, fibrillary degeneration

Demographics:
- Common (~1% of adults)
- Age: Usually 20-60 years
- Male > Female (2:1)

Risk Factors:
- Athletes who throw (golf, baseball, racquet sports)
- Factory workers, manual laborers, office workers
- Handling loads >5 kg (2x/min at minimum 2 hrs/d)
- Handling loads >20 kg at least 10x/d
- High hand grip forces >1 hr/d
- Working with vibrating tools >2 hrs/d

History:
- Medial elbow pain following activity without direct trauma
- Pain worse with wrist flexion, forearm pronation & gripping
- Many patients (~40%) have occasional tingling to 4th & 5th fingers
  (suggests ulnar nerve involvement)

Physical Findings:
Inspection: Usually WNL; look for swelling, redness, warmth
Palpation: Tenderness over medial epicondyle or common flexor tendon
Motion:
- AROM/PROM: Usually WNL, possible pain with tendon stretch
- RROM: Weakness or pain with resisted wrist flexion

Neurovascular:
- Decreased grip strength
- Vascular screen should be WNL
- Co-existing ulnar neuropathy may cause:
  - Decreased sensation over medial hand/fingers
  - Positive Tinel sign at elbow

Special Tests:
- Reverse Mill''s Test (Flexor Stress Test): ____
- Reverse Cozen''s Test (Flexor Muscle Test): ____
- Valgus Stress Test: ____
- Moving Valgus Stress Test: ____
- Grip Strength (dynamometer): ____

Differential Diagnosis:
- Avulsion fracture, Arthritis
- Ulnar collateral ligament injury
- Cervical radiculopathy or Ulnar neuropathy
- Osteochondritis dessicans
- Thoracic outlet syndrome', 'objective');

SELECT insert_template('Albue', 'Medial Epicondylitis', 'Medial Epicondylitis Tests Positive',
'MEDIAL EPICONDYLITIS TESTS - POSITIVE:

- Reverse Mill''s Test (Flexor Stress Test): POSITIVE - pain with passive wrist extension, elbow extended
- Reverse Cozen''s Test (Flexor Muscle Test): POSITIVE - pain with resisted wrist flexion
- Valgus Stress Test (30°): POSITIVE - pain at medial elbow
- Grip Strength: Weak compared to unaffected side

Tinel''s at Elbow: ____ (assess for ulnar nerve involvement)
Sensation to 4th/5th digits: ____

Clinical Impression: Findings consistent with medial epicondylitis (golfer''s elbow)', 'objective');

-- ============================================================================
-- PULLED ELBOW (Nursemaid's Elbow)
-- ============================================================================

SELECT insert_template('Albue', 'Pulled Elbow', 'Pulled Elbow Assessment',
'PULLED ELBOW (NURSEMAID''S/TODDLER''S ELBOW) EVALUATION:

Definition: Partial dislocation of radial head by sudden pull on extended, pronated arm
Also known as: Babysitter''s elbow, grocery store elbow, radial head subluxation

Pathophysiology:
- Slippage of radial head under annular ligament
- In children, annular ligament attachment is weaker
- Ligament strength increases with age

Demographics:
- Incidence: ~1% of children under 5 years
- Age: 1-4 years (toddler)
- Female slightly > Male

Risk Factors:
- Parents who yank children by arm
- Playing "airplane" or "helicopter"
- Falls (second most common mechanism)
- Children under age 5

History:
- DETAILED HISTORY IS KEY TO DIAGNOSIS
- Young child suddenly refuses to use arm (no trauma history)
- Usually axial traction force from pull on hand or wrist
Common scenarios:
- Child pulled by wrist over obstacle
- Child held by hand lurches opposite direction
- Arm pulled through coat sleeve
- Parent swinging child during play
- "Snapping" or "popping" sound may be heard

Physical Findings:
Inspection:
- Anxious child protective of injured arm
- Arm held in protective position:
  Forearm usually flexed 10-20° at elbow, partially pronated
- Anxiety greater than pain for most children

Palpation:
- Tenderness at head of radius may be noted
- Erythema, warmth, edema, signs of trauma ABSENT

Motion:
- Child reluctant to move elbow or fingers on affected side
- Child unwilling to give "high-5"

Neurovascular: WNL
- Check distal circulation, sensation, motor function

Differential Diagnosis:
- Fracture (elbow or wrist)
- Elbow sprain
- Congenital abnormality', 'objective');

SELECT insert_template('Albue', 'Pulled Elbow', 'Pulled Elbow Reduction Technique',
'PULLED ELBOW - REDUCTION TECHNIQUE:

Pre-Reduction:
- [ ] Obtain parental consent
- [ ] Consider offering child a lollipop for distraction
- [ ] If doubt exists, consider imaging before reduction

Reduction Technique:
1. Immobilize the elbow & palpate radial head region with one hand
2. With other hand, apply axial compression at the wrist
3. Supinate the forearm while flexing or extending the elbow
4. A "snap" or "click" may be heard/felt at radial head

Alternative: Hyperpronation method (may be more effective & less painful)

Post-Reduction:
- Child should return to normal function within 15-30 minutes
- If child refuses to play normally after reduction, consider imaging
- If unsuccessful after 2-3 attempts, X-rays recommended

Prognosis:
- Excellent for full recovery
- Recurrence rate: ~20-25%

Patient/Caregiver Education:
- Avoid axial traction forces
- Do not yank child by arm
- Avoid "airplane" games
- Recognize warning signs', 'plan');

-- ============================================================================
-- OLECRANON BURSITIS
-- ============================================================================

SELECT insert_template('Albue', 'Olecranon Bursitis', 'Olecranon Bursitis Assessment',
'OLECRANON BURSITIS EVALUATION:

Definition: Inflammation of bursa overlying olecranon process

Synonyms: Student elbow, miner''s elbow, dart thrower''s elbow

Pathophysiology:
- Bursa allows movement of skin & fascia over olecranon
- Susceptible to inflammation from acute blow or repetitive trauma
- May be secondary to infection (septic bursitis) or gout

Demographics:
- Relatively common
- Possible at any age
- Male = Female

Risk Factors:
- Repetitive microtrauma (rubbing or bumping)
- Direct trauma (fall on elbow, direct hit)
- Rheumatoid arthritis or crystal-deposition disease (gout)
- Infection
- Triceps tendinopathy causing increased pressure

History:
- Focal swelling over olecranon
- Usually mild pain to painless
- Pain worse with pressure (leaning on elbow, rubbing against table)
- Prior trauma
- Chronic cases: Gradual onset of swelling
- Infection: Rapid onset (fever may be present with advanced infection)

Physical Findings:
Inspection:
- Focal swelling ("goose egg" appearance over olecranon)
- Possible abrasion or contusion if recent trauma
- Look for signs of systemic inflammatory disease (RA, gout)

Palpation:
- May be tender to palpation
- IF WARM & RED → SUSPECT INFECTION
- Few nociceptors in posterior elbow (no pain on pinch)
- Sharp pain with pressure on olecranon → suspect periostitis or stress fracture

Motion:
- AROM/PROM: Normal or mildly limited at flexion end range due to pain
- If pain with AROM/PROM & history of trauma → suspect fracture
- RROM: Should be WNL

Neurovascular: Should be WNL

Differential Diagnosis:
- Infectious bursitis (MUST RULE OUT)
- Rheumatoid arthritis
- Gout, Pseudogout
- Triceps tendinopathy
- Traumatic or stress fracture of olecranon', 'objective');

-- ============================================================================
-- OSTEOCHONDRITIS DESSICANS
-- ============================================================================

SELECT insert_template('Albue', 'Osteochondritis', 'Osteochondritis Dessicans Assessment',
'ELBOW OSTEOCHONDRITIS DESSICANS EVALUATION:

Definition: Bone or cartilage degenerates & fragments ("joint mice") invade joint space
Following injury to subchondral bone from lack of blood supply to capitellum

Also known as: Avascular necrosis, Panner''s disease, osteochondrosis,
               Little Leaguer''s elbow

Pathophysiology:
- Excessive, repetitive valgus loading disrupts blood flow → avascular necrosis
- Subchondral bone resorbed
- Overlying cartilage subject to damage and separation
- Bone/cartilage may fragment and become loose in joint

Staging:
Stage 1: Small area of compression of subchondral bone
Stage 2: Partially detached osteochondral fragment
Stage 3: Completely detached fragment within crater bed
Stage 4: Completely detached fragment displaced into joint ("joint mice")

Demographics:
- ~4.1% of males, usually dominant arm
- Bilateral in ~20% of cases
- Age: 10-15 years peak (range 10-45)
- Male > Female (10:1)
- Males with affected relative: 14.6% prevalence

Risk Factors:
- Valgus orientation of elbow predisposes to lateral compressive forces
- Progressive pronation, compression, rotation
- Little league pitchers, gymnasts, racket sports
- Weight lifting, affected family relative

History:
- Dull elbow pain, may be poorly localized
- Pain worse with use (throwing), better with rest
- Prior history of repetitive force to joint
- Possible family relative with condition

Physical Findings:
Inspection: May appear WNL
           Possible swelling or joint effusion
Palpation: Possible swelling or tenderness over joint
          Rarely may palpate loose fragment
Motion:
- Intermittent & variable limitations with ROM
- Possible loss of full extension (~5-10°)
- Crepitus with motion or catching/locking of joint (late stage)

Neurovascular: Usually WNL
- Muscle atrophy may be noted in longstanding condition

Special Tests:
- Active Radiocapitellar Compression Test: ____
- Valgus / Moving Valgus Stress Test: ____

Differential Diagnosis:
- Ulnar collateral ligament sprain (may co-exist)
- Lateral or medial epicondylitis
- Medial condylar fracture
- Chondrocalcinosis
- Multiple epiphyseal dysplasia (rare)', 'objective');

-- ============================================================================
-- CUBITAL TUNNEL SYNDROME
-- ============================================================================

SELECT insert_template('Albue', 'Cubital Tunnel', 'Cubital Tunnel Syndrome Assessment',
'CUBITAL TUNNEL SYNDROME EVALUATION:

Definition: Increased pressure on ulnar nerve at elbow (cubital tunnel or ulnar groove)
Leading to numbness, tingling, & pain in 4th & 5th fingers

2nd most common neuropathy of upper extremity (after carpal tunnel)

Pathophysiology:
- Cubital tunnel formed by tendinous arch joining humeral & ulnar heads of FCU
- Compression or tension on ulnar nerve causes symptoms

Demographics:
- Age: Usually >30 (increased incidence with age)
- Male > Female

Risk Factors:
- Blunt trauma or consistent direct pressure on ulnar nerve at elbow
- Leaning inner arm against table edge, computer use, driving machinery
- Prolonged elbow hyperflexion (sleeping)
- Repetitive irritation over medial epicondyle with flexion-extension
- Inflammation of flexor carpi ulnaris muscle

History:
- Numbness, tingling at 4th & 5th fingers & medial hand
- Possible pain or burning sensation
- ADLs affected due to weakened hand muscles
- Dropping objects & weak grip
- Ask about prior trauma to elbow

Physical Findings:
Inspection:
- Excessive cubitus valgus may predispose
- Long-standing cases: Atrophy of intrinsic hand muscles
- Possible "claw hand" or "bishop''s hand"

Palpation:
- Direct pressure over cubital tunnel exaggerates symptoms
- May show inflammation of flexor carpi ulnaris (compare bilaterally)

Motion:
- AROM/PROM: May be somewhat decreased, full flexion may aggravate
- RROM: May be weak for ulnar-supplied muscles
- Rarely: Visible ulnar nerve subluxation with flexion-extension

Neurovascular:
- Numbness & tingling over 4th & 5th fingers
- Decreased two-point discrimination & light touch

Ulnar Nerve Motor Distribution:
- Flexor carpi ulnaris (C7, C8)
- Flexor digitorum profundus (medial 1/2)
- Palmaris brevis (C8, T1)
- Flexor/Abductor/Opponens digiti minimi (C8, T1)
- Lumbricals III & IV (C8, T1)
- Dorsal & palmar interossei (C8, T1)
- Adductor pollicis (C8, T1)

Special Tests:
- Elbow Flexion Test: ____
- Froment''s Sign: ____
- Tinel''s at Elbow: ____
- Tinel''s at Wrist (Guyon''s tunnel): ____
- Pressure Provocation Test: ____
- Wartenberg Sign: ____

Differential Diagnosis:
- Ulnar nerve contusion
- Thoracic outlet syndrome
- Cervical radiculopathy
- Dupuytren''s contracture
- Medial epicondylitis
- Ulnar neuropathy at wrist (Guyon''s tunnel)', 'objective');

SELECT insert_template('Albue', 'Cubital Tunnel', 'Cubital Tunnel Tests Positive',
'CUBITAL TUNNEL SYNDROME TESTS - POSITIVE:

- Elbow Flexion Test: POSITIVE - full elbow flexion, supination & wrist extension produces pain or paresthesia within 1 minute
- Froment''s Sign: POSITIVE - weakness pinching paper between thumb & index finger (adductor pollicis weakness)
- Tinel''s at Elbow: POSITIVE - tingling/paresthesia radiating to 4th & 5th fingers
- Pressure Provocation Test: POSITIVE - prolonged pressure over ulnar nerve reproduces symptoms
- Wartenberg Sign: POSITIVE - inability to adduct 5th finger

Grip Strength: ____ (compare to unaffected side)
Two-Point Discrimination: ____

Clinical Impression: Findings consistent with cubital tunnel syndrome (ulnar neuropathy at elbow)', 'objective');

-- ============================================================================
-- ELBOW SPRAIN (UCL Injury)
-- ============================================================================

SELECT insert_template('Albue', 'UCL Sprain', 'UCL Sprain Assessment',
'ELBOW SPRAIN (ULNAR COLLATERAL LIGAMENT) EVALUATION:

Definition: Stretching or tearing of elbow ligaments, most commonly UCL in throwers

Grading:
- Grade I: Slight stretch of ligament
- Grade II: Partial tear of ligament
- Grade III: Full rupture of ligament

Pathophysiology:
- Injury from repetitive stress or single traumatic valgus force
- UCL is made up of 3 bundles: Anterior (strongest), Posterior, Transverse
- Maximal UCL stress occurs when elbow flexed 90-100° during acceleration phase
- Peak valgus stress can exceed 60 N-m (higher than cadaver UCL strength ~33 N-m)

Demographics:
- Incidence: Unknown (far more common in athletes)
- Age: 22-32 years peak
- Male > Female

Risk Factors:
- Throwing sports (baseball, cricket, javelin)
- Pitchers with highest velocity & curveballs/sliders
- May be associated with lateral/medial epicondylitis
- Contact sports (rugby, football, wrestling)
- FOOSH injury following dislocation

History:
- Medial elbow pain when throwing (even at 50% effort)
- Pain may have existed for many years
- Rest reduces pain, but returns with throwing
- Patient may remember single throw where popping sensation was felt/heard
- Rarely: Numbness/tingling in pinky & ring finger (ulnar nerve damage)
- Clenched fist may recreate medial elbow pain

Physical Findings:
Inspection:
- Possible swelling over medial elbow
- Ecchymosis can occur after acute rupture

Palpation:
- Tenderness ~2 cm (1") distal to medial epicondyle

Motion:
- AROM: May be WNL or slightly reduced
- PROM in flexion/extension: May be WNL
- RROM: Should be WNL unless musculotendinous damage

Neurovascular:
- Vascular screen should be WNL
- Tinel''s at elbow may cause numbness/tingling if ulnar compression

Special Tests:
- Valgus Stress Test (30°): ____
- Moving Valgus Stress Test: ____
- Milking Maneuver: ____
- Tinel''s at Elbow: ____

Differential Diagnosis:
- Medial epicondylitis
- Cubital tunnel syndrome (ulnar neuropathy)
- Cervical radiculopathy
- Flexor/pronator muscle strain
- Medial condylar fracture', 'objective');

SELECT insert_template('Albue', 'UCL Sprain', 'UCL Sprain Tests Positive',
'UCL SPRAIN TESTS - POSITIVE:

- Valgus Stress Test at 30° Flexion: POSITIVE - medial elbow pain and/or laxity
- Moving Valgus Stress Test: POSITIVE - pain reproduced between 70-120° flexion arc
- Milking Maneuver: POSITIVE

Tinel''s at Elbow: ____ (assess for concurrent ulnar neuropathy)

Grade Assessment: I / II / III

Clinical Impression: Findings consistent with ulnar collateral ligament sprain
Grade ____', 'objective');

-- ============================================================================
-- ELBOW STABILITY TESTS
-- ============================================================================

SELECT insert_template('Albue', 'Stability', 'Elbow Stability Tests',
'ELBOW STABILITY TESTS:

Valgus Stress Test (UCL):
- At 0° Extension: ____
- At 30° Flexion (forearm supinated): ____

Varus Stress Test (LCL):
- At 0° Extension: ____
- At 30° Flexion (forearm pronated): ____

Posterolateral Rotatory Instability:
- Lateral Pivot Shift Test: ____
- Posterolateral Drawer Test: ____

Interpretation:
- Pain without laxity → partial tear or inflammation
- Pain with laxity → complete ligament tear
- Compare to unaffected side

Clinical Impression: ____', 'objective');

-- ============================================================================
-- ELBOW TREATMENT TEMPLATES
-- ============================================================================

SELECT insert_template('Albue', 'Treatment', 'Elbow Conservative Treatment Plan',
'ELBOW CONSERVATIVE TREATMENT PLAN:

General Measures:
- [ ] PRICE protocol (acute phase)
- [ ] Counterforce brace/strap (epicondylitis)
- [ ] Cold application (acute) / Heat (chronic)
- [ ] Avoid aggravating activities
- [ ] Consider short-term NSAIDs

Manual Therapy:
- [ ] Soft tissue release
- [ ] Trigger point therapy
- [ ] Cross-friction massage (subacute phase)
- [ ] Ice massage after treatment
- [ ] Joint mobilization (elbow, wrist)
- [ ] Cervical & thoracic spine manipulation

Modalities:
- [ ] Therapeutic ultrasound over epicondyle
- [ ] Iontophoresis with NSAIDs
- [ ] Low-level laser therapy (904 nm, 0.5-7.2 J total dose)
- [ ] TENS for pain reduction
- [ ] Interferential current

Acupuncture Points:
- HT3, PC5, PC6, SI3, SI4, SI7

Rehabilitation:
- [ ] ROM exercises (flexion/extension, pronation/supination)
- [ ] Stretching program
- [ ] Isometric strengthening
- [ ] Progressive resistance (concentric → eccentric)
- [ ] Finger exercises (alphabet, squeeze ball)
- [ ] Grip strength training

Patient Education:
- [ ] Job/sport modification
- [ ] Ergonomic evaluation
- [ ] Proper biomechanics
- [ ] Shock absorbing tools
- [ ] Proper arm placement/posture when typing', 'plan');

SELECT insert_template('Albue', 'Treatment', 'Epicondylitis Rehabilitation Protocol',
'EPICONDYLITIS REHABILITATION PROTOCOL:

Phase 1 - Acute (Week 1-2):
- [ ] Rest, avoid aggravating activities
- [ ] Counterforce brace
- [ ] Cryotherapy for pain & inflammation
- [ ] Gentle stretching as tolerated

Phase 2 - Subacute (Week 2-4):
- [ ] Emphasis on restoration of function
- [ ] ROM exercises (wrist flexion/extension, pronation/supination)
- [ ] Pain-free strengthening
- [ ] Cross-friction massage as tolerated

Phase 3 - Strengthening (Week 4-8):
Progression: Isometric → Concentric → Eccentric
- [ ] Wrist curls / Reverse wrist curls
- [ ] Forearm pronation/supination with weight
- [ ] Finger flexion/extension exercises
- [ ] Grip strength training (squeeze ball, thick rubber band)

Phase 4 - Functional (Week 8+):
- [ ] Sport/work-specific exercises
- [ ] Gradual return to activity
- [ ] Technique correction

Home Exercise Prescription:
- Wrist extensor stretch (lateral epicondylitis)
- Wrist flexor stretch (medial epicondylitis)
- Wrist curls (3 sets x 10 reps)
- Reverse wrist curls (3 sets x 10 reps)
- Ball squeeze exercises

Prognosis: ~90-95% respond to conservative care within 3 months', 'plan');

-- ============================================================================
-- UCL RECONSTRUCTION REHABILITATION
-- ============================================================================

SELECT insert_template('Albue', 'Treatment', 'UCL Reconstruction Rehabilitation',
'UCL RECONSTRUCTION (TOMMY JOHN) REHABILITATION PROTOCOL:

Post-Surgery Timeline:

Week 1-2:
- [ ] Elbow kept in sling, flexed at 90°
- [ ] Wrist free to move
- [ ] Gripping exercises

Week 2-4:
- [ ] ROM exercises begin
- [ ] Gradual increase in flexion/extension

Month 1-2:
- [ ] Isometric strengthening exercises begin

Week 8-12:
- [ ] Progressive strengthening

Month 4-6:
- [ ] Throwing program can begin

Month 12-18:
- [ ] Pitcher can expect to be fully healed
- [ ] Full return to competitive throwing

Recovery Rate: ~90%

Key Points:
- Conservative management for Grade I & II injuries
- Surgery recommended for Grade III injuries
- Patient education on proper throwing biomechanics
- Avoid excessive throwing activities
- Warn patient that pain may return with throwing', 'plan');

-- ============================================================================
-- ELBOW SUBJECTIVE TEMPLATES
-- ============================================================================

SELECT insert_template('Albue', 'Subjective', 'Elbow Pain History Template',
'ELBOW PAIN - SUBJECTIVE:

Chief Complaint: Elbow pain - ____ (right/left/bilateral)

History of Present Illness:
- Onset: ____ (sudden/gradual)
- Duration: ____ (days/weeks/months)
- Mechanism of injury: ____ (FOOSH/direct trauma/overuse/repetitive/insidious)
- Location: ____ (lateral/medial/posterior/anterior)
- Quality: ____ (sharp/dull/aching/burning/numbness/tingling)
- Severity: VAS ___/10
- Timing: ____ (constant/intermittent/with activity)

Aggravating Factors:
- [ ] Gripping
- [ ] Lifting
- [ ] Twisting (pronation/supination)
- [ ] Throwing
- [ ] Typing/computer work
- [ ] Leaning on elbow
- Other: ____

Relieving Factors:
- [ ] Rest
- [ ] Ice/heat
- [ ] Medication
- [ ] Brace/support
- Other: ____

Associated Symptoms:
- [ ] Numbness/tingling (location: ____)
- [ ] Weakness
- [ ] Clicking/popping
- [ ] Locking/catching
- [ ] Swelling

Occupation/Activities:
- Work: ____
- Sports: ____
- Hobbies: ____

Previous Treatment:
- ____

Red Flags Screened:
- [ ] No unexplained weight loss
- [ ] No fever/chills
- [ ] No history of cancer
- [ ] No significant trauma', 'subjective');

-- ============================================================================
-- ELBOW ASSESSMENT TEMPLATES
-- ============================================================================

SELECT insert_template('Albue', 'Assessment', 'Elbow Assessment Summary',
'ELBOW ASSESSMENT:

Clinical Impression:
Primary Diagnosis: ____
- [ ] Lateral epicondylitis (tennis elbow)
- [ ] Medial epicondylitis (golfer''s elbow)
- [ ] Ulnar collateral ligament sprain
- [ ] Cubital tunnel syndrome (ulnar neuropathy)
- [ ] Olecranon bursitis
- [ ] Osteochondritis dessicans
- [ ] Pulled/nursemaid''s elbow
- [ ] Elbow osteoarthritis
- [ ] Radial tunnel syndrome
- [ ] Pronator teres syndrome
- Other: ____

Secondary Diagnoses: ____

Clinical Reasoning:
Based on examination findings:
- History consistent with: ____
- Physical findings support: ____
- Positive special tests: ____

Differential Diagnoses Considered:
1. ____
2. ____
3. ____

Red Flags: None identified / Present: ____

Prognosis: ____ (Excellent/Good/Fair/Guarded)
Expected recovery:
- Lateral epicondylitis: ~90-95% respond within 3 months
- Medial epicondylitis: ~90% respond within 3 months
- UCL sprain Grade I/II: 6-12 weeks
- UCL sprain Grade III: 12-18 months (post-surgery)

Recommended Further Workup:
- [ ] None at this time
- [ ] X-ray
- [ ] MRI
- [ ] Ultrasound
- [ ] Nerve conduction velocity test
- [ ] Referral to specialist', 'assessment');

-- ============================================================================
-- ELBOW REFERRAL PATTERNS
-- ============================================================================

SELECT insert_template('Albue', 'Referral', 'Elbow Pain Referral Patterns',
'ELBOW PAIN REFERRAL PATTERNS:

IMPORTANT: Elbow pain can be referred from:
- Chest
- Shoulder
- Cervical spine
- Forearm

Cervical Referral:
- C5 → Lateral upper arm to elbow
- C6 → Lateral elbow to lateral forearm to thumb
- C7 → Posterior arm to elbow, posterior forearm to middle finger
- C8 → Medial arm, medial forearm to 4th & 5th fingers

Shoulder Referral:
- Rotator cuff pathology may refer to lateral elbow
- AC joint pathology may refer to elbow

Local Conditions:
- Lateral epicondylitis → Lateral elbow, may radiate to forearm
- Medial epicondylitis → Medial elbow, may radiate to forearm
- Cubital tunnel → Medial elbow to 4th & 5th fingers
- Olecranon bursitis → Posterior elbow (localized)

Visceral Referral:
- Heart (MI) → May refer to medial arm & elbow

Always Screen:
- [ ] Cervical spine involvement
- [ ] Shoulder pathology
- [ ] Cardiac symptoms (if medial arm/elbow pain)', 'objective');

-- Clean up helper function (if running standalone)
-- DROP FUNCTION IF EXISTS insert_template(VARCHAR, VARCHAR, VARCHAR, TEXT, VARCHAR, VARCHAR);
