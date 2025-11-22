-- Special Tests from Physio-pedia - Part 3
-- Balance, Neurological, and Functional Tests
-- Reference: https://www.physio-pedia.com/Category:Special_Tests

-- ============================================================================
-- BALANCE - SPECIAL TESTS (29 tests)
-- ============================================================================

SELECT insert_template('Balance', 'Functional Tests', 'Short Physical Performance Battery (SPPB)',
'Short Physical Performance Battery:
1. Balance Tests (4 points):
   - Side-by-side stand (10 sec): [Pass/Fail] = [1/0]
   - Semi-tandem stand (10 sec): [Pass/Fail] = [1/0]
   - Tandem stand: ___ sec [<3:0, 3-9.99:1, ≥10:2 points]
2. Gait Speed (4 points):  ___ m/sec over 4m [Score ___]
   <0.43: 1pt, 0.43-0.60: 2pts, 0.61-0.77: 3pts, >0.77: 4pts
3. Chair Stand (4 points): 5 rises in ___ sec [Score ___]
   ≥16.7: 1pt, 13.7-16.69: 2pts, 11.2-13.69: 3pts, <11.2: 4pts
Total Score: ___/12 [≤6: poor performance, 7-9: moderate, 10-12: good]
Target: Elderly >65 years
Administration time: ~10 minutes
Reference: www.theBackROM.com/education/Clickup/sppb');

SELECT insert_template('Balance', 'Functional Tests', 'Berg Balance Scale',
'Berg Balance Scale:
1. Sit to stand: [0-4]
2. Standing unsupported: [0-4]
3. Sitting unsupported: [0-4]
4. Stand to sit: [0-4]
5. Transfers: [0-4]
6. Standing with eyes closed: [0-4]
7. Standing with feet together: [0-4]
8. Reaching forward: [0-4]
9. Pick up object from floor: [0-4]
10. Turning to look behind: [0-4]
11. Turning 360°: [0-4]
12. Placing alternate foot on stool: [0-4]
13. Standing with one foot in front: [0-4]
14. Standing on one foot: [0-4]
Total: ___/56
Interpretation: 0-20: Wheelchair bound, 21-40: Walking with assistance, 41-56: Independent
Reference: www.theBackROM.com/education/Clickup/berg-balance-scale');

SELECT insert_template('Balance', 'Functional Tests', 'Timed Up and Go Test (TUG)',
'Timed Up and Go Test:
Time: ___ seconds
Performance quality: [Normal/Abnormal gait/Unsteady/Uses assistive device]
Interpretation:
  <10 sec: Normal functional mobility
  10-20 sec: Good mobility, minimal fall risk
  20-29 sec: Increased fall risk, may need assistive device
  ≥30 sec: Significant mobility impairment, high fall risk
Cognitive TUG (counting backwards): ___ seconds
Manual TUG (carrying water): ___ seconds
Reference: www.theBackROM.com/education/Clickup/tug-test');

SELECT insert_template('Balance', 'Functional Tests', 'Romberg Test',
'Romberg Test: [Positive/Negative]
Eyes open: Stable for 30 seconds [Yes/No]
Eyes closed: Stable for 30 seconds [Yes/No]
Sharpened Romberg (tandem): Eyes open ___ sec, Eyes closed ___ sec
Findings: [Stable/Sway/Loss of balance]
Interpretation: Loss of balance with eyes closed suggests proprioceptive/vestibular deficit
Reference: www.theBackROM.com/education/Clickup/romberg-test');

SELECT insert_template('Balance', 'Functional Tests', 'Single Leg Stance Test',
'Single Leg Stance Test:
Left leg: Eyes open ___ sec, Eyes closed ___ sec
Right leg: Eyes open ___ sec, Eyes closed ___ sec
Normal values (eyes open):
  20-49 years: >24 sec
  50-59 years: >21 sec
  60-69 years: >10 sec
  70-79 years: >4 sec
Interpretation: Below norms suggests balance deficit and fall risk
Reference: www.theBackROM.com/education/Clickup/single-leg-stance');

SELECT insert_template('Balance', 'Functional Tests', 'Star Excursion Balance Test (SEBT)',
'Star Excursion Balance Test:
Left leg stance:
  Anterior: ___ cm
  Anterolateral: ___ cm
  Lateral: ___ cm
  Posterolateral: ___ cm
  Posterior: ___ cm
  Posteromedial: ___ cm
  Medial: ___ cm
  Anteromedial: ___ cm
Right leg stance: [Same directions]
Normalized scores (reach/leg length × 100): ___%
Interpretation: <90% suggests ankle instability or balance deficit
Reference: www.theBackROM.com/education/Clickup/sebt');

SELECT insert_template('Balance', 'Functional Tests', 'Y Balance Test',
'Y Balance Test (Lower Quarter):
Left leg stance:
  Anterior: ___ cm (___% of leg length)
  Posteromedial: ___ cm (___%)
  Posterolateral: ___ cm (___%)
  Composite score: ___%
Right leg stance: [Same]
Anterior reach asymmetry: ___% [>4cm increases injury risk]
Composite asymmetry: ___% [>4% increases injury risk]
Reference: www.theBackROM.com/education/Clickup/y-balance-test');

SELECT insert_template('Balance', 'Functional Tests', 'Four Square Step Test',
'Four Square Step Test:
Time: ___ seconds
Direction: [Forward/Backward/Sideways - clockwise then counter-clockwise]
Interpretation:
  <15 sec: Low fall risk in healthy elderly
  ≥15 sec: Increased fall risk
Number of errors (touching canes): ___
Reference: www.theBackROM.com/education/Clickup/four-square-step-test');

SELECT insert_template('Balance', 'Functional Tests', 'Dynamic Gait Index (DGI)',
'Dynamic Gait Index:
1. Gait level surface: [0-3]
2. Change in gait speed: [0-3]
3. Gait with horizontal head turns: [0-3]
4. Gait with vertical head turns: [0-3]
5. Gait and pivot turn: [0-3]
6. Step over obstacle: [0-3]
7. Step around obstacles: [0-3]
8. Steps: [0-3]
Total: ___/24
Interpretation: <19 suggests fall risk, <19/24 predicts falls in elderly
Reference: www.theBackROM.com/education/Clickup/dynamic-gait-index');

SELECT insert_template('Balance', 'Functional Tests', 'Functional Reach Test (FRT)',
'Functional Reach Test:
Starting position (arm forward): ___ cm
Maximum reach: ___ cm
Functional reach distance: ___ cm
Interpretation:
  <15 cm: High fall risk
  15-25 cm: Moderate fall risk
  >25 cm: Low fall risk
Reference: www.theBackROM.com/education/Clickup/functional-reach-test');

SELECT insert_template('Balance', 'Functional Tests', 'Tinetti Performance Oriented Mobility Assessment (POMA)',
'Tinetti POMA:
Balance Component (16 points):
  Sitting balance: [0-1]
  Arise from chair: [0-2]
  Immediate standing: [0-2]
  Standing balance: [0-2]
  Balance with eyes closed: [0-1]
  Turning balance: [0-2]
  Nudge test: [0-2]
  Neck extension: [0-2]
  One leg balance: [0-2]
Gait Component (12 points):
  Initiation: [0-1]
  Step length/height: [0-4]
  Step symmetry/continuity: [0-2]
  Path deviation: [0-2]
  Trunk stability: [0-2]
  Walk stance: [0-1]
Total: ___/28 [<19: High fall risk, 19-24: Moderate, ≥25: Low]
Reference: www.theBackROM.com/education/Clickup/tinetti-test');

SELECT insert_template('Balance', 'Functional Tests', 'Five Times Sit to Stand Test',
'5x Sit to Stand Test:
Time: ___ seconds
Able to complete without arm use: [Yes/No]
Interpretation:
  <11 sec: Normal for healthy adults
  11-15 sec: Mild impairment
  >15 sec: Significant impairment, fall risk
  Unable to complete: Severe impairment
Reference: www.theBackROM.com/education/Clickup/five-times-sit-to-stand');

SELECT insert_template('Balance', 'Functional Tests', 'Flamingo Test',
'Flamingo Test:
Left leg: Number of balance attempts in 60 seconds: ___
Right leg: Number of balance attempts in 60 seconds: ___
Interpretation: >15 attempts suggests poor balance (elderly)
Reference: www.theBackROM.com/education/Clickup/flamingo-test');

SELECT insert_template('Balance', 'Functional Tests', '4-Stage Balance Test',
'4-Stage Balance Test:
1. Parallel stance (10 sec): [Pass/Fail]
2. Semi-tandem stance (10 sec): [Pass/Fail]
3. Tandem stance (10 sec): [Pass/Fail]
4. Single leg stance (10 sec): [Pass/Fail]
Stages completed: ___/4
Interpretation: Unable to hold tandem for 10 sec predicts fall risk
Reference: www.theBackROM.com/education/Clickup/4-stage-balance-test');

SELECT insert_template('Balance', 'Functional Tests', 'Single Leg Squat Test',
'Single Leg Squat Test:
Left leg: [Good/Fair/Poor] - Quality: [Knee valgus/Trunk lean/Hip drop/Stable]
Right leg: [Good/Fair/Poor] - Quality: [Knee valgus/Trunk lean/Hip drop/Stable]
Repetitions: Left ___, Right ___
Interpretation: Knee valgus or hip drop suggests proximal weakness/poor control
Reference: www.theBackROM.com/education/Clickup/single-leg-squat');

SELECT insert_template('Balance', 'Functional Tests', 'Balance Evaluation Systems Test (BESTest)',
'BESTest - 6 Sections:
I. Biomechanical Constraints: ___/15
II. Stability Limits/Verticality: ___/21
III. Anticipatory Postural Adjustments: ___/18
IV. Postural Responses: ___/18
V. Sensory Orientation: ___/15
VI. Stability in Gait: ___/21
Total: ___/108
Percentage: ___%
Interpretation: Comprehensive balance assessment identifying specific deficits
Reference: www.theBackROM.com/education/Clickup/bestest');

SELECT insert_template('Balance', 'Functional Tests', 'Mini-BESTest',
'Mini-BESTest - 4 Sections (14 items):
I. Anticipatory: ___/6
II. Reactive Postural Control: ___/6
III. Sensory Orientation: ___/6
IV. Dynamic Gait: ___/10
Total: ___/28
Interpretation: <20 suggests fall risk
Reference: www.theBackROM.com/education/Clickup/mini-bestest');

SELECT insert_template('Balance', 'Functional Tests', 'Community Balance and Mobility Scale',
'Community Balance and Mobility Scale:
13 challenging balance/mobility tasks
Total: ___/96
Interpretation: Designed for higher-functioning adults, more challenging than Berg
Reference: www.theBackROM.com/education/Clickup/cb-and-m-scale');

SELECT insert_template('Balance', 'Functional Tests', 'Falls Efficacy Scale - International (FES-I)',
'FES-I:
Rate concern about falling during 16 activities (1-4):
Total: ___/64
Interpretation:
  16-19: Low concern
  20-27: Moderate concern
  28-64: High concern (associated with fall risk)
Reference: www.theBackROM.com/education/Clickup/fes-i');

SELECT insert_template('Balance', 'Functional Tests', 'Fullerton Advanced Balance (FAB) Scale',
'Fullerton Advanced Balance Scale:
10 items scored 0-4 each:
1. Standing with feet together, eyes closed: ___
2. Reaching forward to object: ___
3. 360° turn: ___
4. Step up and over: ___
5. Tandem walk: ___
6. Stand on one leg: ___
7. Stand on foam, eyes closed: ___
8. Two-footed jump: ___
9. Walking with head turns: ___
10. Reactive postural control: ___
Total: ___/40
Interpretation: <25/40 indicates increased fall risk
Reference: www.theBackROM.com/education/Clickup/fab-scale');

SELECT insert_template('Balance', 'Functional Tests', 'The L Test',
'The L Test:
Time: ___ seconds
Description: TUG extended with additional turns
Interpretation: Assesses mobility in community-dwelling elderly
Reference: www.theBackROM.com/education/Clickup/l-test');

SELECT insert_template('Balance', 'Functional Tests', 'Gans Sensory Organization Performance Test',
'Gans SOP Test:
Condition 1 (Eyes open, firm surface): ___/30 sec
Condition 2 (Eyes closed, firm surface): ___/30 sec
Condition 3 (Eyes open, foam surface): ___/30 sec
Condition 4 (Eyes closed, foam surface): ___/30 sec
Interpretation: Identifies visual, proprioceptive, or vestibular deficits
Reference: www.theBackROM.com/education/Clickup/gans-sop-test');

SELECT insert_template('Balance', 'Functional Tests', 'Modified Clinical Test of Sensory Interaction on Balance (mCTSIB)',
'mCTSIB:
Eyes open, firm surface: ___/30 sec
Eyes closed, firm surface: ___/30 sec
Eyes open, foam surface: ___/30 sec
Eyes closed, foam surface: ___/30 sec
Interpretation: Systematically removes sensory inputs to identify balance strategy reliance
Reference: www.theBackROM.com/education/Clickup/mctsib');

SELECT insert_template('Balance', 'Functional Tests', 'Pediatric Balance Scale',
'Pediatric Balance Scale:
Total: ___/56 (modified Berg for children)
Age: ___ years
Interpretation: Age-specific norms available for children 5-15 years
Reference: www.theBackROM.com/education/Clickup/pediatric-balance-scale');

SELECT insert_template('Balance', 'Functional Tests', 'Balance Outcome Measure for Elder Rehabilitation (BOOMER)',
'BOOMER:
Total: ___/36
7 static and dynamic items
Interpretation: Designed for frail elderly in rehabilitation
Reference: www.theBackROM.com/education/Clickup/boomer');

SELECT insert_template('Balance', 'Functional Tests', 'Elderly Mobility Scale',
'Elderly Mobility Scale:
Total: ___/20
7 items: lying to sitting, sitting to lying, sit to stand, stand to sit, transfers, walking, functional reach
Interpretation: <14 indicates increased fall risk
Reference: www.theBackROM.com/education/Clickup/elderly-mobility-scale');

SELECT insert_template('Balance', 'Functional Tests', 'Biodex Balance System',
'Biodex Balance System:
Overall stability index: ___
Anteroposterior index: ___
Mediolateral index: ___
Interpretation: Lower scores indicate better stability
Reference: www.theBackROM.com/education/Clickup/biodex-balance');

SELECT insert_template('Balance', 'Functional Tests', '4-Item Dynamic Gait Index',
'4-Item DGI:
1. Gait level surface: [0-3]
2. Gait with horizontal head turns: [0-3]
3. Gait with vertical head turns: [0-3]
4. Gait and pivot turn: [0-3]
Total: ___/12
Interpretation: Shortened version of DGI for quick screening
Reference: www.theBackROM.com/education/Clickup/4-item-dgi');

-- ============================================================================
-- NEUROLOGICAL - SPECIAL TESTS (15 tests)
-- ============================================================================

SELECT insert_template('Neurological', 'Special Tests', 'Babinski Sign',
'Babinski Sign (Plantar Reflex): [Positive/Negative]
Left: [Flexor response (normal)/Extensor response (positive)]
Right: [Flexor/Extensor]
Interpretation: Positive (great toe extension, toe fanning) suggests upper motor neuron lesion
Normal in infants <2 years
Reference: www.theBackROM.com/education/Clickup/babinski-sign');

SELECT insert_template('Neurological', 'Special Tests', 'Beevor Sign',
'Beevor Sign: [Positive/Negative]
Umbilicus movement: [None/Upward/Downward/Lateral]
Direction: _______
Interpretation: Movement suggests segmental thoracic nerve or muscle weakness
  Upward: Lower abdominal weakness
  Downward: Upper abdominal weakness
Reference: www.theBackROM.com/education/Clickup/beevor-sign');

SELECT insert_template('Neurological', 'Special Tests', 'Chvostek Sign',
'Chvostek Sign: [Positive/Negative]
Facial twitching with facial nerve tap: [Yes/No]
Interpretation: Positive suggests hypocalcemia or increased neuromuscular excitability
Reference: www.theBackROM.com/education/Clickup/chvostek-sign');

SELECT insert_template('Neurological', 'Special Tests', 'Hoover Sign',
'Hoover Sign: [Positive/Negative]
Voluntary leg raise: [Weak/Unable]
Contralateral hip pressure during opposite leg raise: [Felt/Not felt]
Interpretation: Weakness with no contralateral pressure suggests non-organic weakness
Reference: www.theBackROM.com/education/Clickup/hoover-sign');

SELECT insert_template('Neurological', 'Special Tests', 'Tromner Sign',
'Tromner Sign: [Positive/Negative]
Left hand: Finger flexion with middle finger flick [Present/Absent]
Right hand: Finger flexion with middle finger flick [Present/Absent]
Interpretation: Positive suggests upper motor neuron lesion (similar to Hoffmann''s)
Reference: www.theBackROM.com/education/Clickup/tromner-sign');

SELECT insert_template('Neurological', 'Special Tests', 'Trousseau''s Sign',
'Trousseau''s Sign: [Positive/Negative]
Carpopedal spasm with BP cuff inflation: [Yes/No after ___ minutes]
Interpretation: Positive suggests hypocalcemia (latent tetany)
Reference: www.theBackROM.com/education/Clickup/trousseaus-sign');

SELECT insert_template('Neurological', 'Special Tests', 'Clonus Test',
'Clonus Test: [Positive/Negative]
Ankle clonus (Left): [None/Sustained (>5 beats)/Unsustained]
Ankle clonus (Right): [None/Sustained/Unsustained]
Patellar clonus: [Present/Absent]
Interpretation: Sustained clonus suggests upper motor neuron lesion
Reference: www.theBackROM.com/education/Clickup/clonus-test');

SELECT insert_template('Neurological', 'Special Tests', 'Finger-to-Nose Test',
'Finger-to-Nose Test: [Normal/Abnormal]
Left: [Accurate/Dysmetria/Past-pointing/Intention tremor]
Right: [Accurate/Dysmetria/Past-pointing/Intention tremor]
Interpretation: Abnormal suggests cerebellar dysfunction or proprioceptive loss
Reference: www.theBackROM.com/education/Clickup/finger-to-nose');

SELECT insert_template('Neurological', 'Special Tests', 'Heel-to-Shin Test',
'Heel-to-Shin Test: [Normal/Abnormal]
Left: [Smooth/Ataxic/Tremor]
Right: [Smooth/Ataxic/Tremor]
Interpretation: Ataxia suggests cerebellar or proprioceptive dysfunction
Reference: www.theBackROM.com/education/Clickup/heel-to-shin');

SELECT insert_template('Neurological', 'Special Tests', 'Rapid Alternating Movements',
'Rapid Alternating Movements (Dysdiadochokinesia): [Normal/Abnormal]
Hand pronation/supination: [Normal/Slow/Irregular]
Interpretation: Slow/irregular suggests cerebellar dysfunction
Reference: www.theBackROM.com/education/Clickup/rapid-alternating-movements');

SELECT insert_template('Neurological', 'Special Tests', 'Tardieu Scale',
'Tardieu Scale (Spasticity Assessment):
Muscle tested: _______
Quality of muscle reaction (0-5): ___
Angle of catch: ___° at [Slow/Fast] velocity
Interpretation: Assesses spasticity in neurological conditions
Reference: www.theBackROM.com/education/Clickup/tardieu-scale');

SELECT insert_template('Neurological', 'Special Tests', 'Diplopia Assessment',
'Diplopia Assessment: [Present/Absent]
Direction of gaze affected: _______
H-pattern test: [CN III/IV/VI deficits]
Interpretation: Suggests cranial nerve or brainstem pathology
Reference: www.theBackROM.com/education/Clickup/diplopia');

SELECT insert_template('Neurological', 'Special Tests', 'Cognitive Screening',
'Mini-Mental State Examination (MMSE) or Montreal Cognitive Assessment (MoCA):
Total score: ___
Areas affected: [Orientation/Memory/Attention/Language/Visuospatial]
Interpretation: Screens for cognitive impairment
Reference: www.theBackROM.com/education/Clickup/cognitive-screening');

SELECT insert_template('Neurological', 'Special Tests', 'Gait Assessment - Neurological',
'Neurological Gait Patterns: [Normal/Abnormal]
Type observed:
  [ ] Hemiplegic (circumduction)
  [ ] Parkinsonian (shuffling, festinating)
  [ ] Ataxic (wide-based, unsteady)
  [ ] Steppage (foot drop)
  [ ] Antalgic
  [ ] Trendelenburg
Interpretation: Gait pattern suggests specific neurological or musculoskeletal pathology
Reference: www.theBackROM.com/education/Clickup/neurological-gait');

SELECT insert_template('Neurological', 'Special Tests', 'Apraxia Screening',
'Apraxia Screen:
Ideomotor apraxia (tool use pantomime): [Normal/Impaired]
Ideational apraxia (multi-step tasks): [Normal/Impaired]
Limb-kinetic apraxia (fine motor): [Normal/Impaired]
Interpretation: Impairment suggests cortical dysfunction
Reference: www.theBackROM.com/education/Clickup/apraxia-screen');

-- ============================================================================
-- GENERAL HYPERMOBILITY ASSESSMENT
-- ============================================================================

SELECT insert_template('General', 'Special Tests', 'Beighton Score - Complete Assessment',
'Beighton Hypermobility Score: ___/9
1. Passive dorsiflexion 5th MCP >90° (L/R): [0/1/2]
2. Passive thumb to forearm apposition (L/R): [0/1/2]
3. Elbow hyperextension >10° (L/R): [0/1/2]
4. Knee hyperextension >10° (L/R): [0/1/2]
5. Forward flexion palms flat on floor, knees straight: [0/1]
Total: ___/9

Interpretation:
  ≥4/9 (adults): Suggests generalized joint hypermobility
  ≥5/9 (children): Suggests hypermobility
  May be associated with:hypermobility spectrum disorders, Ehlers-Danlos syndrome

Clinical Context (Brighton Criteria):
- Current joint symptoms: [Yes/No]
- History of dislocations/subluxations: [Yes/No]
- Chronic pain >3 months: [Yes/No]
- Family history: [Yes/No]

Reference: www.theBackROM.com/education/Clickup/beighton-score');

-- End of Special Tests Seed Data
-- Total: ~200 special tests across all body regions
-- Integration with educational platform: www.theBackROM.com/education/Clickup
