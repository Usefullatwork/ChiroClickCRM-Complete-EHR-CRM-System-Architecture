-- Special Tests from Physio-pedia - Part 2
-- Lower Extremity, Spine, Balance, and Neurological Tests
-- Reference: https://www.physio-pedia.com/Category:Special_Tests

-- ============================================================================
-- THORACIC SPINE - SPECIAL TESTS (4 tests)
-- ============================================================================

SELECT insert_template('Thoracic Spine', 'Special Tests', 'Halstead Test',
'Halstead Test: [Positive/Negative]
Left: Radial pulse [Diminished/Normal], symptoms [Yes/No]
Right: Radial pulse [Diminished/Normal], symptoms [Yes/No]
Position: Neck rotated opposite, extended, radial pulse monitored
Interpretation: Positive suggests thoracic outlet syndrome
Reference: www.theBackROM.com/education/Clickup/halstead-test');

SELECT insert_template('Thoracic Spine', 'Special Tests', 'Wright Test',
'Wright Test (Hyperabduction): [Positive/Negative]
Left: Radial pulse [Diminished/Absent/Normal]
Right: Radial pulse [Diminished/Absent/Normal]
Position: Arm hyperabducted to 180°
Interpretation: Positive suggests thoracic outlet syndrome
Reference: www.theBackROM.com/education/Clickup/wright-test');

SELECT insert_template('Thoracic Spine', 'Special Tests', 'Slump Test (Thoracic)',
'Slump Test: [Positive/Negative]
Symptom reproduction: [Local/Radiating]
Location: _______
Release with neck extension: [Yes/No]
Interpretation: Positive suggests neural tension, thoracic or lumbar involvement
Reference: www.theBackROM.com/education/Clickup/slump-test');

SELECT insert_template('Thoracic Spine', 'Special Tests', 'Thoracic Spring Test',
'Thoracic Spring Test:
Levels assessed: T1-T12
Hypomobile segments: _______
Painful segments: _______
Interpretation: Assesses segmental mobility and pain provocation
Reference: www.theBackROM.com/education/Clickup/thoracic-spring-test');

-- ============================================================================
-- LUMBAR SPINE - SPECIAL TESTS (8 tests)
-- ============================================================================

SELECT insert_template('Lumbar Spine', 'Special Tests', 'Beighton Score (Forward Flexion)',
'Beighton Score - Forward Flexion:
Palms flat on floor with knees straight: [Yes/No] = [0/1]
Part of total Beighton Score: ___/9
Reference: www.theBackROM.com/education/Clickup/beighton-score');

SELECT insert_template('Lumbar Spine', 'Special Tests', 'Bragard''s Sign',
'Bragard''s Sign: [Positive/Negative]
Left leg: SLR to onset of symptoms at ___°, dorsiflexion increases symptoms [Yes/No]
Right leg: SLR to onset of symptoms at ___°, dorsiflexion increases symptoms [Yes/No]
Interpretation: Positive suggests sciatic nerve involvement
Reference: www.theBackROM.com/education/Clickup/bragards-sign');

SELECT insert_template('Lumbar Spine', 'Special Tests', 'Femoral Nerve Tension Test',
'Femoral Nerve Tension Test (Prone Knee Bend): [Positive/Negative]
Left: Anterior thigh/groin pain [Yes/No] at ___° knee flexion
Right: Anterior thigh/groin pain [Yes/No] at ___° knee flexion
Interpretation: Positive suggests L2-L4 nerve root irritation or femoral nerve tension
Reference: www.theBackROM.com/education/Clickup/femoral-nerve-tension');

SELECT insert_template('Lumbar Spine', 'Special Tests', 'Gaenslen Test',
'Gaenslen Test: [Positive/Negative]
Left: Pain location [SI joint/Hip/Lumbar/Anterior thigh]
Right: Pain location [SI joint/Hip/Lumbar/Anterior thigh]
Interpretation: SI joint pain suggests sacroiliitis, anterior thigh suggests hip or femoral nerve
Reference: www.theBackROM.com/education/Clickup/gaenslen-test');

SELECT insert_template('Lumbar Spine', 'Special Tests', 'Leg Lowering Test',
'Leg Lowering Test (Active SLR):
Left leg: Maintains neutral spine to ___° [Normal >70°]
Right leg: Maintains neutral spine to ___° [Normal >70°]
Interpretation: Assesses core stability and hamstring length
Reference: www.theBackROM.com/education/Clickup/leg-lowering-test');

SELECT insert_template('Lumbar Spine', 'Special Tests', 'McKenzie Side Glide Test',
'McKenzie Side Glide Test: [Positive/Negative]
Direction of glide: [Left/Right]
Response: [Centralization/Peripheralization/No change]
Number of repetitions: ___
Interpretation: Centralization favorable, peripheralization unfavorable
Reference: www.theBackROM.com/education/Clickup/mckenzie-side-glide');

SELECT insert_template('Lumbar Spine', 'Special Tests', 'Slump Test',
'Slump Test: [Positive/Negative]
Symptom reproduction: [Yes/No] at position: [Slump/Knee extension/Dorsiflexion]
Distribution: _______
Release with neck extension: [Yes/No]
Interpretation: Positive suggests neural tension, disc herniation, or sciatic nerve involvement
Sensitivity: 84% | Specificity: 83%
Reference: www.theBackROM.com/education/Clickup/slump-test');

SELECT insert_template('Lumbar Spine', 'Special Tests', 'Waddell Signs',
'Waddell Signs Assessment: [___/5 positive]
1. Superficial tenderness: [Yes/No]
2. Non-anatomical tenderness: [Yes/No]
3. Axial loading (pain with vertical pressure on head): [Yes/No]
4. Rotation (pain with passive shoulder/pelvis rotation): [Yes/No]
5. Distracted SLR (discrepancy >40° between distracted and formal SLR): [Yes/No]
6. Regional sensory/motor changes: [Yes/No]
7. Overreaction: [Yes/No]
Interpretation: ≥3 positive suggests non-organic pain component
Reference: www.theBackROM.com/education/Clickup/waddell-signs');

-- ============================================================================
-- PELVIS / SI JOINT - SPECIAL TESTS (11 tests)
-- ============================================================================

SELECT insert_template('Pelvis', 'Special Tests', 'Posterior Pelvic Pain Provocation Test (P4/Thigh Thrust)',
'P4 Test: [Positive/Negative]
Left: SI joint pain [Yes/No]
Right: SI joint pain [Yes/No]
Position: Supine, hip flexed to 90°, posterior force through femur
Interpretation: Pain suggests SI joint dysfunction
Sensitivity: 88% | Specificity: 69%
Reference: www.theBackROM.com/education/Clickup/p4-test');

SELECT insert_template('Pelvis', 'Special Tests', 'Sacral Thrust Test',
'Sacral Thrust Test: [Positive/Negative]
Pain location: [SI joint/Sacrum/None]
Interpretation: SI joint pain suggests SI joint dysfunction
Sensitivity: 63% | Specificity: 75%
Reference: www.theBackROM.com/education/Clickup/sacral-thrust');

SELECT insert_template('Pelvis', 'Special Tests', 'Sacroiliac Compression Test',
'SI Compression Test: [Positive/Negative]
Position: Side-lying, compression on iliac crest
Pain: [SI joint/Lateral hip/None]
Interpretation: SI joint pain suggests anterior SI ligament pathology
Sensitivity: 69% | Specificity: 69%
Reference: www.theBackROM.com/education/Clickup/si-compression');

SELECT insert_template('Pelvis', 'Special Tests', 'Sacroiliac Distraction Test',
'SI Distraction Test: [Positive/Negative]
Position: Supine, ASIS distraction
Pain: [Anterior SI/Posterior SI/None]
Interpretation: Pain suggests anterior SI ligament pathology
Sensitivity: 60% | Specificity: 81%
Reference: www.theBackROM.com/education/Clickup/si-distraction');

SELECT insert_template('Pelvis', 'Special Tests', 'Standing Flexion Test',
'Standing Flexion Test: [Positive/Negative]
Left PSIS: [Rises more/Normal]
Right PSIS: [Rises more/Normal]
Interpretation: Asymmetric rise suggests SI joint hypomobility on that side
Reference: www.theBackROM.com/education/Clickup/standing-flexion-test');

SELECT insert_template('Pelvis', 'Special Tests', 'Seated Flexion Test',
'Seated Flexion Test: [Positive/Negative]
Left PSIS: [Rises more/Normal]
Right PSIS: [Rises more/Normal]
Interpretation: Asymmetric rise suggests iliosacral dysfunction
Reference: www.theBackROM.com/education/Clickup/seated-flexion-test');

SELECT insert_template('Pelvis', 'Special Tests', 'Stork Test (Gillet Test)',
'Stork Test: [Positive/Negative]
Left: PSIS movement [Normal/Restricted]
Right: PSIS movement [Normal/Restricted]
Normal: PSIS moves inferiorly with hip flexion
Interpretation: Lack of movement suggests SI joint hypomobility
Reference: www.theBackROM.com/education/Clickup/stork-test');

SELECT insert_template('Pelvis', 'Special Tests', 'Yeoman''s Test',
'Yeoman''s Test: [Positive/Negative]
Left: Pain location [Anterior SI/Hip/Lumbar]
Right: Pain location [Anterior SI/Hip/Lumbar]
Position: Prone, hip extension with knee flexed
Interpretation: Anterior SI pain suggests SI joint pathology
Reference: www.theBackROM.com/education/Clickup/yeomans-test');

SELECT insert_template('Pelvis', 'Special Tests', 'Long Dorsal Sacroiliac Ligament (LDL) Test',
'LDL Test: [Positive/Negative]
Pain with palpation: [Yes/No]
Pain with provocation: [Yes/No]
Interpretation: Positive suggests LDL pathology
Reference: www.theBackROM.com/education/Clickup/ldl-test');

SELECT insert_template('Pelvis', 'Special Tests', 'Mennell''s Sign',
'Mennell''s Sign: [Positive/Negative]
Pain with posterior glide of ilium: [Yes/No]
Interpretation: Pain suggests SI joint dysfunction
Reference: www.theBackROM.com/education/Clickup/mennells-sign');

SELECT insert_template('Pelvis', 'Special Tests', 'SI Joint Cluster',
'SI Joint Clinical Cluster: [___/5 positive]
1. Distraction test: [Pos/Neg]
2. Thigh thrust (P4): [Pos/Neg]
3. Compression test: [Pos/Neg]
4. Sacral thrust: [Pos/Neg]
5. Gaenslen test: [Pos/Neg]
Interpretation: ≥3 positive increases likelihood of SI joint pain
Sensitivity: 94% | Specificity: 78% (with ≥3 tests positive)
Reference: www.theBackROM.com/education/Clickup/si-joint-cluster');

-- ============================================================================
-- HIP - SPECIAL TESTS (15 tests)
-- ============================================================================

SELECT insert_template('Hip', 'Special Tests', 'Adductor Squeeze Test',
'Adductor Squeeze Test: [Positive/Negative]
0° hip flexion: Pain [Yes/No], strength deficit [Yes/No]
45° hip flexion: Pain [Yes/No], strength deficit [Yes/No]
90° hip flexion: Pain [Yes/No], strength deficit [Yes/No]
Interpretation: Pain/weakness suggests adductor strain or athletic pubalgia
Reference: www.theBackROM.com/education/Clickup/adductor-squeeze');

SELECT insert_template('Hip', 'Special Tests', 'Bowstring Sign',
'Bowstring Sign: [Positive/Negative]
Left: [Positive/Negative]
Right: [Positive/Negative]
Position: Pressure on popliteal fossa with SLR
Interpretation: Increased symptoms suggests sciatic nerve involvement
Reference: www.theBackROM.com/education/Clickup/bowstring-sign');

SELECT insert_template('Hip', 'Special Tests', 'Craig''s Test (Femoral Anteversion)',
'Craig''s Test:
Left: Anteversion angle ___° [Normal 8-15°]
Right: Anteversion angle ___°
Interpretation: >15° excessive anteversion, <8° retroversion
Reference: www.theBackROM.com/education/Clickup/craigs-test');

SELECT insert_template('Hip', 'Special Tests', 'Ely''s Test (Rectus Femoris Contracture)',
'Ely''s Test: [Positive/Negative]
Left: Hip flexes during knee flexion [Yes/No]
Right: Hip flexes during knee flexion [Yes/No]
Interpretation: Positive suggests rectus femoris tightness
Reference: www.theBackROM.com/education/Clickup/elys-test');

SELECT insert_template('Hip', 'Special Tests', 'FADIR Test (Flexion Adduction Internal Rotation)',
'FADIR Test: [Positive/Negative]
Left: Pain location [Anterior groin/Posterior/Lateral]
Right: Pain location [Anterior groin/Posterior/Lateral]
Interpretation: Anterior pain suggests FAI or labral tear, posterior suggests SI joint
Sensitivity: 78% | Specificity: 10% (for FAI)
Reference: www.theBackROM.com/education/Clickup/fadir-test');

SELECT insert_template('Hip', 'Special Tests', 'FAIR Test (Flexion Adduction Internal Rotation - Piriformis)',
'FAIR Test: [Positive/Negative]
Left: Reproduces buttock/leg pain [Yes/No]
Right: Reproduces buttock/leg pain [Yes/No]
Interpretation: Positive suggests piriformis syndrome
Sensitivity: 88% | Specificity: 83%
Reference: www.theBackROM.com/education/Clickup/fair-test');

SELECT insert_template('Hip', 'Special Tests', 'Fulcrum Test',
'Fulcrum Test: [Positive/Negative]
Left: Apprehension/pain [Yes/No]
Right: Apprehension/pain [Yes/No]
Location: _______
Interpretation: Pain suggests femoral stress fracture
Reference: www.theBackROM.com/education/Clickup/fulcrum-test');

SELECT insert_template('Hip', 'Special Tests', 'Hip Quadrant Test (Scour Test)',
'Hip Quadrant Test: [Positive/Negative]
Left: Pain/crepitus [Yes/No] - location: [Groin/Lateral/Posterior]
Right: Pain/crepitus [Yes/No] - location: [Groin/Lateral/Posterior]
Interpretation: Pain/crepitus suggests hip joint pathology (OA, labral tear)
Reference: www.theBackROM.com/education/Clickup/hip-quadrant-test');

SELECT insert_template('Hip', 'Special Tests', 'Leg Length Discrepancy',
'Leg Length Measurement:
True leg length: Left ___ cm, Right ___ cm, Difference ___ cm
  (ASIS to medial malleolus)
Apparent leg length: Left ___ cm, Right ___ cm, Difference ___ cm
  (Umbilicus to medial malleolus)
Interpretation: True LLD suggests structural, apparent suggests functional/pelvic obliquity
Reference: www.theBackROM.com/education/Clickup/leg-length-test');

SELECT insert_template('Hip', 'Special Tests', 'McCarthy Test',
'McCarthy Test: [Positive/Negative]
Left: Pain with [Flexion-IR/Flexion-ER/Both]
Right: Pain with [Flexion-IR/Flexion-ER/Both]
Interpretation: Pain suggests hip labral tear (Flexion-IR: anterior, Flexion-ER: posterior)
Reference: www.theBackROM.com/education/Clickup/mccarthy-test');

SELECT insert_template('Hip', 'Special Tests', 'Patellar-Pubic Percussion Test',
'Patellar-Pubic Percussion Test: [Positive/Negative]
Percussion over patella: Sound [Normal/Diminished/Absent]
Interpretation: Diminished sound suggests femoral fracture
Reference: www.theBackROM.com/education/Clickup/patellar-pubic-percussion');

SELECT insert_template('Hip', 'Special Tests', 'Piriformis Test',
'Piriformis Test: [Positive/Negative]
Left: Pain/weakness with resisted ER [Yes/No]
Right: Pain/weakness with resisted ER [Yes/No]
Interpretation: Positive suggests piriformis syndrome
Reference: www.theBackROM.com/education/Clickup/piriformis-test');

SELECT insert_template('Hip', 'Special Tests', 'Trendelenburg Sign',
'Trendelenburg Test: [Positive/Negative]
Left stance: Pelvis drops on right [Yes/No]
Right stance: Pelvis drops on left [Yes/No]
Interpretation: Positive suggests hip abductor weakness (gluteus medius) or hip pathology
Reference: www.theBackROM.com/education/Clickup/trendelenburg-sign');

SELECT insert_template('Hip', 'Special Tests', 'Thomas Test',
'Thomas Test: [Positive/Negative]
Left: Hip flexion contracture ___° [Normal: hip extends to 0°]
Right: Hip flexion contracture ___°
Modified: Knee extension suggests rectus femoris tightness
Interpretation: Positive suggests hip flexor tightness/contracture
Reference: www.theBackROM.com/education/Clickup/thomas-test');

SELECT insert_template('Hip', 'Special Tests', 'Ober''s Test',
'Ober''s Test: [Positive/Negative]
Left: Leg remains abducted [Yes/No]
Right: Leg remains abducted [Yes/No]
Interpretation: Positive suggests ITB/TFL tightness
Reference: www.theBackROM.com/education/Clickup/obers-test');

-- ============================================================================
-- KNEE - SPECIAL TESTS (26 tests)
-- ============================================================================

SELECT insert_template('Knee', 'Special Tests', 'Anterior Drawer Test of Knee',
'Anterior Drawer Test: [Positive/Negative]
Left: Translation [None/Grade I: <5mm/Grade II: 5-10mm/Grade III: >10mm]
Right: Translation [None/Grade I/Grade II/Grade III]
Knee position: 90° flexion
Interpretation: Positive suggests ACL tear
Sensitivity: 62% | Specificity: 67%
Reference: www.theBackROM.com/education/Clickup/anterior-drawer-knee');

SELECT insert_template('Knee', 'Special Tests', 'Apley''s Test',
'Apley''s Compression Test: [Positive/Negative]
Left: Pain with compression-rotation [Yes/No]
Right: Pain with compression-rotation [Yes/No]
Apley''s Distraction Test: [Positive/Negative]
Interpretation: Pain with compression suggests meniscal tear, pain with distraction suggests ligament injury
Reference: www.theBackROM.com/education/Clickup/apleys-test');

SELECT insert_template('Knee', 'Special Tests', 'Dial Test',
'Dial Test: [Positive/Negative]
30° knee flexion: Left ___° ER, Right ___° ER, Difference ___°
90° knee flexion: Left ___° ER, Right ___° ER, Difference ___°
Interpretation: >10° asymmetry suggests posterolateral corner injury
  At 30° only: Isolated PLC
  At both 30° and 90°: Combined PLC and PCL
Reference: www.theBackROM.com/education/Clickup/dial-test');

SELECT insert_template('Knee', 'Special Tests', 'Ege''s Test',
'Ege''s Test: [Positive/Negative]
Left: Pain/click with squat-rotation [Yes/No] - [Medial/Lateral]
Right: Pain/click with squat-rotation [Yes/No] - [Medial/Lateral]
Interpretation: Medial pain suggests medial meniscus, lateral suggests lateral meniscus
Reference: www.theBackROM.com/education/Clickup/eges-test');

SELECT insert_template('Knee', 'Special Tests', 'Effusion Tests (Sweep/Ballottement)',
'Sweep Test: [Positive/Negative] - small effusion
Ballottement (Patellar Tap): [Positive/Negative] - large effusion
Interpretation: Positive suggests knee joint effusion
Reference: www.theBackROM.com/education/Clickup/effusion-tests');

SELECT insert_template('Knee', 'Special Tests', 'Lachman Test',
'Lachman Test: [Positive/Negative]
Left: Translation [None/Grade I: <5mm/Grade II: 5-10mm/Grade III: >10mm], Endpoint [Firm/Soft]
Right: Translation [None/Grade I/Grade II/Grade III], Endpoint [Firm/Soft]
Interpretation: Positive suggests ACL tear
Sensitivity: 85% | Specificity: 94% (Gold standard for ACL)
Reference: www.theBackROM.com/education/Clickup/lachman-test');

SELECT insert_template('Knee', 'Special Tests', 'Lever Sign Test',
'Lever Sign Test: [Positive/Negative]
Left: Heel rises [Yes/No]
Right: Heel rises [Yes/No]
Interpretation: Heel remains on table suggests ACL tear
Sensitivity: 100% | Specificity: 100%
Reference: www.theBackROM.com/education/Clickup/lever-sign');

SELECT insert_template('Knee', 'Special Tests', 'McMurray''s Test',
'McMurray''s Test: [Positive/Negative]
Lateral meniscus (ER-extension): Click/pain [Yes/No]
Medial meniscus (IR-extension): Click/pain [Yes/No]
Interpretation: Palpable click/pain suggests meniscal tear
Sensitivity: 61% | Specificity: 84%
Reference: www.theBackROM.com/education/Clickup/mcmurrays-test');

SELECT insert_template('Knee', 'Special Tests', 'Moving Patellar Apprehension Test',
'Moving Patellar Apprehension Test: [Positive/Negative]
Left: Apprehension [Yes/No] at ___° flexion
Right: Apprehension [Yes/No] at ___° flexion
Interpretation: Apprehension suggests patellar instability
Reference: www.theBackROM.com/education/Clickup/patellar-apprehension-moving');

SELECT insert_template('Knee', 'Special Tests', 'Muller''s Test',
'Muller''s Test: [Positive/Negative]
Left: [Positive/Negative]
Right: [Positive/Negative]
Interpretation: Suggests meniscal pathology
Reference: www.theBackROM.com/education/Clickup/mullers-test');

SELECT insert_template('Knee', 'Special Tests', 'Noble''s Test (ITB Friction Syndrome)',
'Noble''s Test: [Positive/Negative]
Left: Pain at lateral epicondyle at ___° [typically 30°]
Right: Pain at lateral epicondyle at ___°
Interpretation: Pain suggests iliotibial band friction syndrome
Reference: www.theBackROM.com/education/Clickup/nobles-test');

SELECT insert_template('Knee', 'Special Tests', 'Passive Knee Extension Test',
'Passive Knee Extension Test:
Left: Extension lag ___° [>10° significant]
Right: Extension lag ___°
Interpretation: Inability to fully extend suggests intra-articular pathology
Reference: www.theBackROM.com/education/Clickup/passive-extension-knee');

SELECT insert_template('Knee', 'Special Tests', 'Patellar Apprehension Sign',
'Patellar Apprehension Test: [Positive/Negative]
Left: Apprehension with lateral translation [Yes/No]
Right: Apprehension with lateral translation [Yes/No]
Interpretation: Apprehension suggests patellar instability/subluxation history
Reference: www.theBackROM.com/education/Clickup/patellar-apprehension');

SELECT insert_template('Knee', 'Special Tests', 'Patellar Grind Test (Clarke''s Sign)',
'Patellar Grind Test: [Positive/Negative]
Left: Pain with compression [Yes/No]
Right: Pain with compression [Yes/No]
Interpretation: Pain suggests patellofemoral pain syndrome or chondromalacia
Reference: www.theBackROM.com/education/Clickup/patellar-grind');

SELECT insert_template('Knee', 'Special Tests', 'Pivot Shift Test',
'Pivot Shift Test: [Positive/Negative]
Left: [Grade 0/I: Glide/II: Clunk/III: Gross instability]
Right: [Grade 0/I/II/III]
Interpretation: Positive suggests ACL tear with rotatory instability
Specificity: 98% (highly specific but requires relaxation)
Reference: www.theBackROM.com/education/Clickup/pivot-shift');

SELECT insert_template('Knee', 'Special Tests', 'Posterior Drawer Test',
'Posterior Drawer Test: [Positive/Negative]
Left: Translation [None/Grade I: <5mm/Grade II: 5-10mm/Grade III: >10mm]
Right: Translation [None/Grade I/Grade II/Grade III]
Posterior sag sign: [Present/Absent]
Interpretation: Positive suggests PCL tear
Sensitivity: 90% | Specificity: 99%
Reference: www.theBackROM.com/education/Clickup/posterior-drawer-knee');

SELECT insert_template('Knee', 'Special Tests', 'Renne Test',
'Renne Test: [Positive/Negative]
Left: Lateral knee pain at ___° [typically 30-40°]
Right: Lateral knee pain at ___°
Position: Single leg squat
Interpretation: Lateral pain suggests ITB friction syndrome
Reference: www.theBackROM.com/education/Clickup/renne-test');

SELECT insert_template('Knee', 'Special Tests', 'Slocum''s Test',
'Slocum''s Test: [Positive/Negative]
Anteromedial instability (foot ER): [Pos/Neg]
Anterolateral instability (foot IR): [Pos/Neg]
Interpretation: Identifies rotatory component of ACL tear
Reference: www.theBackROM.com/education/Clickup/slocums-test');

SELECT insert_template('Knee', 'Special Tests', 'Steinman Test',
'Steinman Test: [Positive/Negative]
Left: Pain shift with rotation [Yes/No]
Right: Pain shift with rotation [Yes/No]
Interpretation: Pain suggests meniscal tear
Reference: www.theBackROM.com/education/Clickup/steinman-test');

SELECT insert_template('Knee', 'Special Tests', 'Thessaly Test',
'Thessaly Test: [Positive/Negative]
Left: Pain/clicking/locking [Yes/No] - location: [Medial/Lateral]
Right: Pain/clicking/locking [Yes/No] - location: [Medial/Lateral]
Position: 20° knee flexion, rotation on planted foot
Interpretation: Positive suggests meniscal tear
Sensitivity: 89% | Specificity: 97%
Reference: www.theBackROM.com/education/Clickup/thessaly-test');

SELECT insert_template('Knee', 'Special Tests', 'Valgus Stress Test (Knee)',
'Valgus Stress Test: [Positive/Negative]
0° extension: Left [Grade 0/I/II/III], Right [Grade 0/I/II/III]
30° flexion: Left [Grade 0/I/II/III], Right [Grade 0/I/II/III]
Interpretation: Laxity at 30° suggests MCL tear, at 0° suggests combined injury
Reference: www.theBackROM.com/education/Clickup/valgus-stress-knee');

SELECT insert_template('Knee', 'Special Tests', 'Varus Stress Test (Knee)',
'Varus Stress Test: [Positive/Negative]
0° extension: Left [Grade 0/I/II/III], Right [Grade 0/I/II/III]
30° flexion: Left [Grade 0/I/II/III], Right [Grade 0/I/II/III]
Interpretation: Laxity at 30° suggests LCL tear, at 0° suggests combined injury
Reference: www.theBackROM.com/education/Clickup/varus-stress-knee');

SELECT insert_template('Knee', 'Special Tests', 'Wilson''s Test',
'Wilson''s Test: [Positive/Negative]
Pain with IR at ___° extension [typically 30°]
Pain relieved with ER: [Yes/No]
Interpretation: Positive suggests osteochondritis dissecans
Reference: www.theBackROM.com/education/Clickup/wilsons-test');

SELECT insert_template('Knee', 'Special Tests', 'Insall-Salvati Ratio',
'Insall-Salvati Ratio:
Patellar tendon length: ___ mm
Patellar length: ___ mm
Ratio: ___ [Normal: 0.8-1.2]
Interpretation: <0.8 patella alta, >1.2 patella baja
Reference: www.theBackROM.com/education/Clickup/insall-salvati');

SELECT insert_template('Knee', 'Special Tests', 'Plica Test',
'Plica Test: [Positive/Negative]
Left: Pain/popping with pressure [Yes/No]
Right: Pain/popping with pressure [Yes/No]
Interpretation: Positive suggests synovial plica syndrome
Reference: www.theBackROM.com/education/Clickup/plica-test');

-- ============================================================================
-- ANKLE - SPECIAL TESTS (13 tests)
-- ============================================================================

SELECT insert_template('Ankle', 'Special Tests', 'Anterior Drawer Test of Ankle',
'Anterior Drawer Test (Ankle): [Positive/Negative]
Left: Translation [None/Grade I: <5mm/Grade II: 5-10mm/Grade III: >10mm]
Right: Translation [None/Grade I/Grade II/Grade III]
Interpretation: Positive suggests ATFL tear (lateral ankle sprain)
Sensitivity: 71% | Specificity: 33%
Reference: www.theBackROM.com/education/Clickup/anterior-drawer-ankle');

SELECT insert_template('Ankle', 'Special Tests', 'External Rotation Stress Test (Ankle)',
'External Rotation Stress Test: [Positive/Negative]
Left: Pain location [Anterior tibiofibular/Posterior tibiofibular/Deltoid]
Right: Pain location [Anterior tibiofibular/Posterior tibiofibular/Deltoid]
Interpretation: Pain suggests syndesmotic injury (high ankle sprain)
Reference: www.theBackROM.com/education/Clickup/external-rotation-stress-ankle');

SELECT insert_template('Ankle', 'Special Tests', 'Figure of Eight Ankle Swelling',
'Figure of Eight Measurement:
Left ankle: ___ cm
Right ankle: ___ cm
Difference: ___ cm [>1cm significant]
Interpretation: Objective measurement of ankle swelling
Reference: www.theBackROM.com/education/Clickup/figure-of-eight-ankle');

SELECT insert_template('Ankle', 'Special Tests', 'Impingement Sign (Ankle)',
'Ankle Impingement Test: [Positive/Negative]
Anterior impingement (dorsiflexion): Left [Pos/Neg], Right [Pos/Neg]
Posterior impingement (plantarflexion): Left [Pos/Neg], Right [Pos/Neg]
Interpretation: Pain suggests anterior or posterior ankle impingement
Reference: www.theBackROM.com/education/Clickup/ankle-impingement');

SELECT insert_template('Ankle', 'Special Tests', 'Kleiger''s Test',
'Kleiger''s Test (External Rotation Test): [Positive/Negative]
Left: Pain location [Medial ankle/Distal tibiofibular/Lateral]
Right: Pain location [Medial ankle/Distal tibiofibular/Lateral]
Interpretation: Medial pain suggests deltoid injury, syndesmotic pain suggests high ankle sprain
Reference: www.theBackROM.com/education/Clickup/kleigers-test');

SELECT insert_template('Ankle', 'Special Tests', 'Ottawa Ankle Rules',
'Ottawa Ankle Rules:
Ankle X-ray indicated if: [Yes/No]
  - Bone tenderness at posterior edge/tip of lateral malleolus: [Y/N]
  - Bone tenderness at posterior edge/tip of medial malleolus: [Y/N]
  - Unable to bear weight immediately and in ED (4 steps): [Y/N]
Foot X-ray indicated if: [Yes/No]
  - Bone tenderness at base of 5th metatarsal: [Y/N]
  - Bone tenderness at navicular: [Y/N]
  - Unable to bear weight immediately and in ED (4 steps): [Y/N]
Sensitivity: 100% | Specificity: 40%
Reference: www.theBackROM.com/education/Clickup/ottawa-ankle-rules');

SELECT insert_template('Ankle', 'Special Tests', 'Peroneus Longus and Brevis Tests',
'Peroneus Longus Test: [Positive/Negative]
Strength: [5/5, 4/5, 3/5, 2/5, 1/5, 0/5]
Peroneus Brevis Test: [Positive/Negative]
Strength: [5/5, 4/5, 3/5, 2/5, 1/5, 0/5]
Interpretation: Weakness suggests peroneal nerve injury or tendon pathology
Reference: www.theBackROM.com/education/Clickup/peroneal-tests');

SELECT insert_template('Ankle', 'Special Tests', 'Prone Anterior Drawer Test',
'Prone Anterior Drawer Test: [Positive/Negative]
Left: Translation [Minimal/Moderate/Marked]
Right: Translation [Minimal/Moderate/Marked]
Interpretation: Positive suggests ATFL tear
Reference: www.theBackROM.com/education/Clickup/prone-anterior-drawer-ankle');

SELECT insert_template('Ankle', 'Special Tests', 'Silfverskiold Test',
'Silfverskiold Test:
Knee extended: Dorsiflexion ___° [Normal >10°]
Knee flexed to 90°: Dorsiflexion ___° [Normal >20°]
Interpretation: Limited DF with knee extended (improves with flexion) suggests gastrocnemius tightness
  Limited in both positions suggests soleus tightness or joint restriction
Reference: www.theBackROM.com/education/Clickup/silfverskiold-test');

SELECT insert_template('Ankle', 'Special Tests', 'Squeeze Test (Syndesmosis)',
'Squeeze Test: [Positive/Negative]
Pain at distal tibiofibular joint: [Yes/No]
Interpretation: Distal pain suggests syndesmotic injury (high ankle sprain)
Specificity: 88%
Reference: www.theBackROM.com/education/Clickup/squeeze-test-ankle');

SELECT insert_template('Ankle', 'Special Tests', 'Talar Tilt Test',
'Talar Tilt Test: [Positive/Negative]
Left inversion: Laxity [None/Mild/Moderate/Severe]
Right inversion: Laxity [None/Mild/Moderate/Severe]
Interpretation: Positive suggests CFL tear (combined with ATFL)
Reference: www.theBackROM.com/education/Clickup/talar-tilt');

SELECT insert_template('Ankle', 'Special Tests', 'Thompson Test (Achilles)',
'Thompson Test (Simmond''s Test): [Positive/Negative]
Left: Plantarflexion with calf squeeze [Present/Absent]
Right: Plantarflexion with calf squeeze [Present/Absent]
Interpretation: Absence of PF suggests complete Achilles tendon rupture
Sensitivity: 96% | Specificity: 93%
Reference: www.theBackROM.com/education/Clickup/thompson-test');

SELECT insert_template('Ankle', 'Special Tests', 'Windlass Test',
'Windlass Test: [Positive/Negative]
Left: Pain increase with toe extension [Yes/No]
Right: Pain increase with toe extension [Yes/No]
Interpretation: Pain suggests plantar fasciitis
Reference: www.theBackROM.com/education/Clickup/windlass-test');

-- ============================================================================
-- FOOT - SPECIAL TESTS (6 tests)
-- ============================================================================

SELECT insert_template('Foot', 'Special Tests', 'Coleman Block Test',
'Coleman Block Test:
Heel position (no block): [Varus/Neutral/Valgus]
Heel position (block under 1st met): [Corrects to neutral/Remains varus]
Interpretation: Correction suggests flexible hindfoot varus (forefoot-driven)
  No correction suggests rigid hindfoot varus
Reference: www.theBackROM.com/education/Clickup/coleman-block-test');

SELECT insert_template('Foot', 'Special Tests', 'Feiss Line Test',
'Feiss Line Test:
Sitting (non-weight bearing): Navicular position [Grade 0/I/II/III]
Standing (weight bearing): Navicular position [Grade 0/I/II/III]
Interpretation: Navicular drop suggests flatfoot/pes planus
Reference: www.theBackROM.com/education/Clickup/feiss-line-test');

SELECT insert_template('Foot', 'Special Tests', 'Navicular Drop Test',
'Navicular Drop Test:
Sitting height: ___ mm (from ground)
Standing height: ___ mm (from ground)
Drop: ___ mm [Normal <10mm, excessive >10mm]
Interpretation: Excessive drop suggests pronation/flatfoot
Reference: www.theBackROM.com/education/Clickup/navicular-drop-test');

SELECT insert_template('Foot', 'Special Tests', 'Toe Spread Test',
'Toe Spread Test: [Normal/Abnormal]
Left: Able to spread toes [Yes/No]
Right: Able to spread toes [Yes/No]
Interpretation: Inability suggests interosseous weakness or nerve pathology
Reference: www.theBackROM.com/education/Clickup/toe-spread-test');

SELECT insert_template('Foot', 'Special Tests', 'Mulder''s Click (Morton''s Neuroma)',
'Mulder''s Click Test: [Positive/Negative]
Left: Click/pain between toes ___ and ___
Right: Click/pain between toes ___ and ___
Interpretation: Palpable click suggests Morton''s neuroma (typically 3rd webspace)
Sensitivity: 61% | Specificity: 100%
Reference: www.theBackROM.com/education/Clickup/mulders-click');

SELECT insert_template('Foot', 'Special Tests', 'Tibialis Posterior Strength Test',
'Tibialis Posterior Test:
Left: Strength [5/5, 4/5, 3/5, 2/5, 1/5, 0/5], Single heel raise [Able/Unable]
Right: Strength [5/5, 4/5, 3/5, 2/5, 1/5, 0/5], Single heel raise [Able/Unable]
Interpretation: Weakness suggests tibialis posterior dysfunction
Reference: www.theBackROM.com/education/Clickup/tibialis-posterior-test');

-- Continue with Balance and Neurological tests...
