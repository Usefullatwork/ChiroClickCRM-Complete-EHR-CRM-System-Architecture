-- Special Tests from Physio-pedia
-- Comprehensive clinical test battery organized by body region
-- Reference: https://www.physio-pedia.com/Category:Special_Tests
-- Educational link: www.theBackROM.com/education/Clickup

-- Helper function to insert templates (reuse if exists)
CREATE OR REPLACE FUNCTION insert_template(
  p_category VARCHAR,
  p_subcategory VARCHAR,
  p_name VARCHAR,
  p_text TEXT,
  p_soap_section VARCHAR DEFAULT 'objective',
  p_language VARCHAR DEFAULT 'EN'
) RETURNS void AS $$
BEGIN
  INSERT INTO clinical_templates (
    organization_id,
    category,
    subcategory,
    template_name,
    template_text,
    language,
    soap_section,
    is_system
  ) VALUES (
    NULL,  -- System template
    p_category,
    p_subcategory,
    p_name,
    p_text,
    p_language,
    p_soap_section,
    true
  )
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CERVICAL SPINE - SPECIAL TESTS (11 tests)
-- ============================================================================

SELECT insert_template('Cervical Spine', 'Special Tests', 'Bakody Sign',
'Bakody Sign: [Positive/Negative]
Side tested: [Left/Right/Bilateral]
Findings: Patient places hand on head to reduce arm pain
Interpretation: Suggests cervical radiculopathy if positive
Reference: www.theBackROM.com/education/Clickup/bakody-sign');

SELECT insert_template('Cervical Spine', 'Special Tests', 'Canadian C-Spine Rule',
'Canadian C-Spine Rule Assessment:
High risk factors (age >65, dangerous mechanism, paresthesias in extremities): [Yes/No]
Low risk factors (simple rear-end MVA, sitting position in ED, ambulatory, delayed onset, no midline tenderness): [Yes/No]
Able to actively rotate neck 45° left and right: [Yes/No]
Conclusion: Imaging [Required/Not Required]
Reference: www.theBackROM.com/education/Clickup/canadian-c-spine-rule');

SELECT insert_template('Cervical Spine', 'Special Tests', 'Cervical Distraction Test',
'Cervical Distraction Test: [Positive/Negative]
Findings: Manual traction applied to cervical spine
Symptom response: [Decreased/No change/Increased]
Interpretation: Relief suggests cervical nerve root compression
Reference: www.theBackROM.com/education/Clickup/cervical-distraction');

SELECT insert_template('Cervical Spine', 'Special Tests', 'Cervical Flexion-Rotation Test',
'Cervical Flexion-Rotation Test: [Positive/Negative]
Left rotation: ___° [Normal >44°]
Right rotation: ___° [Normal >44°]
Difference: ___°
Interpretation: <10° difference indicates upper cervical dysfunction (C1-C2)
Reference: www.theBackROM.com/education/Clickup/cervical-flexion-rotation');

SELECT insert_template('Cervical Spine', 'Special Tests', 'Cervical Rotation Lateral Flexion Test',
'Cervical Rotation Lateral Flexion Test: [Positive/Negative]
Left side: [Positive/Negative]
Right side: [Positive/Negative]
Findings: Pain with ipsilateral rotation and contralateral lateral flexion
Interpretation: Suggests facet joint involvement
Reference: www.theBackROM.com/education/Clickup/cervical-rotation-lateral-flexion');

SELECT insert_template('Cervical Spine', 'Special Tests', 'Cranio-cervical Flexion Test',
'Cranio-cervical Flexion Test (CCFT):
Pressure levels achieved: [22/24/26/28/30 mmHg]
Hold time: ___ seconds [Target: 10 seconds]
Quality of movement: [Good/Fair/Poor]
Substitution patterns: [None/Sternocleidomastoid overactivity/Jaw thrust]
Interpretation: Assesses deep cervical flexor endurance
Reference: www.theBackROM.com/education/Clickup/ccft');

SELECT insert_template('Cervical Spine', 'Special Tests', 'Hoffmann''s Sign',
'Hoffmann''s Sign: [Positive/Negative]
Left hand: [Positive/Negative]
Right hand: [Positive/Negative]
Findings: Flick middle fingernail, observe thumb flexion/adduction
Interpretation: Positive suggests upper motor neuron lesion/cervical myelopathy
Reference: www.theBackROM.com/education/Clickup/hoffmanns-sign');

SELECT insert_template('Cervical Spine', 'Special Tests', 'Sharp Purser Test',
'Sharp Purser Test: [Positive/Negative]
Findings: Posterior pressure on forehead during cervical flexion
Clunk or sliding sensation: [Present/Absent]
Symptom reproduction: [Yes/No]
Interpretation: Positive suggests atlantoaxial instability
Reference: www.theBackROM.com/education/Clickup/sharp-purser');

SELECT insert_template('Cervical Spine', 'Special Tests', 'Spurling''s Test',
'Spurling''s Test: [Positive/Negative]
Left side: [Positive/Negative] - radiating symptoms: [Yes/No]
Right side: [Positive/Negative] - radiating symptoms: [Yes/No]
Symptom distribution: ___________
Sensitivity: 0.50 | Specificity: 0.86-0.93
Interpretation: Positive suggests cervical radiculopathy
Reference: www.theBackROM.com/education/Clickup/spurlings-test');

SELECT insert_template('Cervical Spine', 'Special Tests', 'Transverse Ligament Stress Test',
'Transverse Ligament Stress Test: [Positive/Negative]
Findings: Anterior translation of atlas on axis
Symptoms: [None/Neurological/Pain/Dizziness]
Interpretation: Positive suggests transverse ligament insufficiency
Contraindications: Down syndrome, RA, recent trauma
Reference: www.theBackROM.com/education/Clickup/transverse-ligament-test');

SELECT insert_template('Cervical Spine', 'Special Tests', 'Vertebral Artery Test',
'Vertebral Artery Test: [Positive/Negative]
Position tested: Extension-rotation
Symptoms: [None/Dizziness/Nystagmus/Visual changes/Drop attacks]
Duration held: ___ seconds
Interpretation: Positive suggests vertebrobasilar insufficiency
Reference: www.theBackROM.com/education/Clickup/vertebral-artery-test');

-- ============================================================================
-- SHOULDER - SPECIAL TESTS (45 tests)
-- ============================================================================

SELECT insert_template('Shoulder', 'Special Tests', 'Adson''s Test',
'Adson''s Test: [Positive/Negative]
Left: [Positive/Negative] - radial pulse: [Diminished/Absent/Normal]
Right: [Positive/Negative] - radial pulse: [Diminished/Absent/Normal]
Position: Neck extended and rotated toward tested side, arm extended
Interpretation: Positive suggests thoracic outlet syndrome
Reference: www.theBackROM.com/education/Clickup/adsons-test');

SELECT insert_template('Shoulder', 'Special Tests', 'Anterior Drawer Test of Shoulder',
'Anterior Drawer Test: [Positive/Negative]
Left shoulder: Grade [0/I/II/III] translation
Right shoulder: Grade [0/I/II/III] translation
Apprehension: [Yes/No]
Interpretation: Assesses anterior glenohumeral instability
Reference: www.theBackROM.com/education/Clickup/anterior-drawer-shoulder');

SELECT insert_template('Shoulder', 'Special Tests', 'Apprehension Test',
'Apprehension Test: [Positive/Negative]
Left: [Positive/Negative] - apprehension at ___°
Right: [Positive/Negative] - apprehension at ___°
Relocation test: [Positive/Negative]
Interpretation: Positive suggests anterior shoulder instability
Reference: www.theBackROM.com/education/Clickup/apprehension-test');

SELECT insert_template('Shoulder', 'Special Tests', 'Arm Squeeze Test',
'Arm Squeeze Test: [Positive/Negative]
Pain reproduction: [Yes/No]
Location: [Lateral epicondyle/Medial epicondyle]
Interpretation: Positive suggests rotator cuff pathology
Reference: www.theBackROM.com/education/Clickup/arm-squeeze-test');

SELECT insert_template('Shoulder', 'Special Tests', 'Bear Hug Test',
'Bear Hug Test: [Positive/Negative]
Left: Ability to resist internal rotation: [Normal/Weak/Unable]
Right: Ability to resist internal rotation: [Normal/Weak/Unable]
Interpretation: Weakness suggests subscapularis tear
Sensitivity: 60% | Specificity: 92%
Reference: www.theBackROM.com/education/Clickup/bear-hug-test');

SELECT insert_template('Shoulder', 'Special Tests', 'Belly Press Test',
'Belly Press Test (Napoleon Test): [Positive/Negative]
Left: [Normal/Abnormal compensation]
Right: [Normal/Abnormal compensation]
Findings: Elbow drops posterior to trunk (compensation)
Interpretation: Positive suggests subscapularis weakness/tear
Reference: www.theBackROM.com/education/Clickup/belly-press-test');

SELECT insert_template('Shoulder', 'Special Tests', 'Biceps Load II Test',
'Biceps Load II Test: [Positive/Negative]
Left: [Positive/Negative]
Right: [Positive/Negative]
Findings: Apprehension or pain with resisted elbow flexion at 120° abduction
Interpretation: Suggests SLAP lesion
Reference: www.theBackROM.com/education/Clickup/biceps-load-test');

SELECT insert_template('Shoulder', 'Special Tests', 'Codman''s Test (Drop Arm)',
'Codman''s Test (Drop Arm): [Positive/Negative]
Left: [Positive/Negative] - drops at ___°
Right: [Positive/Negative] - drops at ___°
Interpretation: Positive suggests rotator cuff tear (particularly supraspinatus)
Reference: www.theBackROM.com/education/Clickup/codmans-test');

SELECT insert_template('Shoulder', 'Special Tests', 'Costoclavicular Test (Military Brace / Eden''s Test)',
'Costoclavicular Test: [Positive/Negative]
Left: Radial pulse [Diminished/Absent/Normal], symptoms: [Yes/No]
Right: Radial pulse [Diminished/Absent/Normal], symptoms: [Yes/No]
Position: Shoulders retracted and depressed
Interpretation: Positive suggests thoracic outlet syndrome (costoclavicular space)
Reference: www.theBackROM.com/education/Clickup/costoclavicular-test');

SELECT insert_template('Shoulder', 'Special Tests', 'Crank Test',
'Crank Test: [Positive/Negative]
Left: [Positive/Negative] - pain/click: [Yes/No]
Right: [Positive/Negative] - pain/click: [Yes/No]
Findings: Axial load with rotation at 160° elevation
Interpretation: Positive suggests labral tear
Reference: www.theBackROM.com/education/Clickup/crank-test');

SELECT insert_template('Shoulder', 'Special Tests', 'Drop Arm Test',
'Drop Arm Test: [Positive/Negative]
Left: [Normal descent/Sudden drop] at ___°
Right: [Normal descent/Sudden drop] at ___°
Interpretation: Positive suggests complete rotator cuff tear
Reference: www.theBackROM.com/education/Clickup/drop-arm-test');

SELECT insert_template('Shoulder', 'Special Tests', 'Empty Can Test (Jobe''s)',
'Empty Can Test: [Positive/Negative]
Left: Pain [Yes/No], Weakness [Yes/No]
Right: Pain [Yes/No], Weakness [Yes/No]
Position: 90° abduction, 30° forward flexion, thumbs down
Interpretation: Pain/weakness suggests supraspinatus pathology
Sensitivity: 89% | Specificity: 50%
Reference: www.theBackROM.com/education/Clickup/empty-can-test');

SELECT insert_template('Shoulder', 'Special Tests', 'Full Can Test',
'Full Can Test: [Positive/Negative]
Left: Pain [Yes/No], Weakness [Yes/No]
Right: Pain [Yes/No], Weakness [Yes/No]
Position: 90° abduction, 30° forward flexion, thumbs up
Interpretation: Alternative to empty can, less painful
Reference: www.theBackROM.com/education/Clickup/full-can-test');

SELECT insert_template('Shoulder', 'Special Tests', 'Gerber''s Test (Lift-Off)',
'Gerber''s Lift-Off Test: [Positive/Negative]
Left: [Able/Unable to lift hand from back]
Right: [Able/Unable to lift hand from back]
Interpretation: Inability suggests subscapularis tear
Specificity: 98%
Reference: www.theBackROM.com/education/Clickup/gerbers-test');

SELECT insert_template('Shoulder', 'Special Tests', 'Hara Test',
'Hara Test: [Positive/Negative]
Left: [Positive/Negative]
Right: [Positive/Negative]
Findings: Pain with resisted supination at 90° elbow flexion
Interpretation: Suggests SLAP lesion
Reference: www.theBackROM.com/education/Clickup/hara-test');

SELECT insert_template('Shoulder', 'Special Tests', 'Hawkins-Kennedy Impingement Test',
'Hawkins-Kennedy Test: [Positive/Negative]
Left: [Positive/Negative]
Right: [Positive/Negative]
Position: 90° forward flexion, forced internal rotation
Interpretation: Pain suggests subacromial impingement
Sensitivity: 79% | Specificity: 59%
Reference: www.theBackROM.com/education/Clickup/hawkins-kennedy-test');

SELECT insert_template('Shoulder', 'Special Tests', 'Hornblower''s Sign',
'Hornblower''s Sign: [Positive/Negative]
Left: [Able/Unable to externally rotate]
Right: [Able/Unable to externally rotate]
Position: Arm at 90° abduction in scapular plane
Interpretation: Inability suggests teres minor/infraspinatus tear
Reference: www.theBackROM.com/education/Clickup/hornblowers-sign');

SELECT insert_template('Shoulder', 'Special Tests', 'Inferior Sulcus Test (Sulcus Sign)',
'Inferior Sulcus Test: [Positive/Negative]
Left: Sulcus depth ___mm [<1cm normal, 1-2cm grade I, >2cm grade II/III]
Right: Sulcus depth ___mm
Interpretation: Positive suggests inferior glenohumeral instability
Reference: www.theBackROM.com/education/Clickup/sulcus-sign');

SELECT insert_template('Shoulder', 'Special Tests', 'Infraspinatus Test',
'Infraspinatus Test: [Positive/Negative]
Left: Strength [5/5, 4/5, 3/5, 2/5, 1/5, 0/5]
Right: Strength [5/5, 4/5, 3/5, 2/5, 1/5, 0/5]
Position: Resisted external rotation at side
Interpretation: Weakness suggests infraspinatus pathology/C5-6 radiculopathy
Reference: www.theBackROM.com/education/Clickup/infraspinatus-test');

SELECT insert_template('Shoulder', 'Special Tests', 'Internal Rotation Lag Sign',
'Internal Rotation Lag Sign: [Positive/Negative]
Left: Lag ___° [>10° positive]
Right: Lag ___°
Interpretation: Positive suggests subscapularis tear
Specificity: 100%
Reference: www.theBackROM.com/education/Clickup/ir-lag-sign');

SELECT insert_template('Shoulder', 'Special Tests', 'Jerk Test',
'Jerk Test: [Positive/Negative]
Left: Clunk/pain with posterior translation: [Yes/No]
Right: Clunk/pain with posterior translation: [Yes/No]
Interpretation: Positive suggests posterior labral tear
Reference: www.theBackROM.com/education/Clickup/jerk-test');

SELECT insert_template('Shoulder', 'Special Tests', 'Jobe''s Relocation Test',
'Jobe''s Relocation Test: [Positive/Negative]
Apprehension reduced with posterior pressure: [Yes/No]
Interpretation: Relief with relocation suggests anterior instability/labral tear
Reference: www.theBackROM.com/education/Clickup/jobes-relocation-test');

SELECT insert_template('Shoulder', 'Special Tests', 'Kim Test',
'Kim Test: [Positive/Negative]
Left: [Positive/Negative]
Right: [Positive/Negative]
Findings: Pain with posteroinferior labrum compression
Interpretation: Suggests posteroinferior labral lesion
Reference: www.theBackROM.com/education/Clickup/kim-test');

SELECT insert_template('Shoulder', 'Special Tests', 'External Rotation Lag Sign',
'External Rotation Lag Sign: [Positive/Negative]
Left: Lag ___° [>10° positive]
Right: Lag ___°
Interpretation: Positive suggests infraspinatus/teres minor tear
Sensitivity: 70% | Specificity: 100%
Reference: www.theBackROM.com/education/Clickup/er-lag-sign');

SELECT insert_template('Shoulder', 'Special Tests', 'Load and Shift Test',
'Load and Shift Test:
Left: Anterior [Grade 0/I/II/III], Posterior [Grade 0/I/II/III]
Right: Anterior [Grade 0/I/II/III], Posterior [Grade 0/I/II/III]
Interpretation: Assesses glenohumeral translation/instability
Reference: www.theBackROM.com/education/Clickup/load-and-shift');

SELECT insert_template('Shoulder', 'Special Tests', 'Neer Test',
'Neer Impingement Test: [Positive/Negative]
Left: Pain [Yes/No]
Right: Pain [Yes/No]
Position: Passive forward flexion with internal rotation
Interpretation: Pain suggests subacromial impingement
Sensitivity: 79% | Specificity: 53%
Reference: www.theBackROM.com/education/Clickup/neer-test');

SELECT insert_template('Shoulder', 'Special Tests', 'Norwood Stress Test',
'Norwood Stress Test: [Positive/Negative]
Left: [Positive/Negative]
Right: [Positive/Negative]
Interpretation: Assesses posterior shoulder instability
Reference: www.theBackROM.com/education/Clickup/norwood-test');

SELECT insert_template('Shoulder', 'Special Tests', 'O''Brien''s Test (Active Compression)',
'O''Brien''s Test: [Positive/Negative]
Left: Pain thumbs down [Yes/No], reduced thumbs up [Yes/No]
Right: Pain thumbs down [Yes/No], reduced thumbs up [Yes/No]
Location: [Deep shoulder/AC joint/Both]
Interpretation: Deep pain suggests SLAP lesion, AC joint pain suggests AC pathology
Sensitivity: 54% | Specificity: 98% (for SLAP)
Reference: www.theBackROM.com/education/Clickup/obriens-test');

SELECT insert_template('Shoulder', 'Special Tests', 'Painful Arc',
'Painful Arc: [Positive/Negative]
Left: Pain from ___° to ___° [typically 60-120°]
Right: Pain from ___° to ___°
Interpretation: Pain in mid-arc suggests subacromial impingement
Reference: www.theBackROM.com/education/Clickup/painful-arc');

SELECT insert_template('Shoulder', 'Special Tests', 'Passive Compression Test',
'Passive Compression Test: [Positive/Negative]
Left: [Positive/Negative]
Right: [Positive/Negative]
Findings: Pain with axial compression in adduction
Interpretation: Suggests AC joint pathology
Reference: www.theBackROM.com/education/Clickup/passive-compression-test');

SELECT insert_template('Shoulder', 'Special Tests', 'Paxinos Test',
'Paxinos Test: [Positive/Negative]
Left: [Positive/Negative]
Right: [Positive/Negative]
Findings: Pain with compression of AC joint
Interpretation: Suggests AC joint pathology
Reference: www.theBackROM.com/education/Clickup/paxinos-test');

SELECT insert_template('Shoulder', 'Special Tests', 'Rent Test',
'Rent Test (Palpable Defect): [Positive/Negative]
Left: Palpable gap [Yes/No], location: _______
Right: Palpable gap [Yes/No], location: _______
Interpretation: Palpable defect suggests full-thickness rotator cuff tear
Reference: www.theBackROM.com/education/Clickup/rent-test');

SELECT insert_template('Shoulder', 'Special Tests', 'Resisted AC Joint Extension Test',
'Resisted AC Joint Extension Test: [Positive/Negative]
Left: Pain [Yes/No]
Right: Pain [Yes/No]
Interpretation: Pain suggests AC joint pathology
Reference: www.theBackROM.com/education/Clickup/resisted-ac-extension');

SELECT insert_template('Shoulder', 'Special Tests', 'Roos Stress Test (EAST)',
'Roos Stress Test (Elevated Arm Stress Test): [Positive/Negative]
Duration maintained: ___ seconds [Normal: 3 minutes]
Symptoms: [Heaviness/Numbness/Tingling/Weakness/Pain]
Interpretation: Positive suggests thoracic outlet syndrome
Reference: www.theBackROM.com/education/Clickup/roos-test');

SELECT insert_template('Shoulder', 'Special Tests', 'Scapular Assistance Test',
'Scapular Assistance Test: [Positive/Negative]
Left: Pain reduction with scapular stabilization: [Yes/No]
Right: Pain reduction with scapular stabilization: [Yes/No]
Interpretation: Improvement suggests scapular dyskinesis contributing to symptoms
Reference: www.theBackROM.com/education/Clickup/scapular-assistance-test');

SELECT insert_template('Shoulder', 'Special Tests', 'Scapular Retraction Test',
'Scapular Retraction Test: [Positive/Negative]
Left: Strength improvement with scapular retraction: [Yes/No]
Right: Strength improvement with scapular retraction: [Yes/No]
Interpretation: Improvement suggests scapular dyskinesis
Reference: www.theBackROM.com/education/Clickup/scapular-retraction-test');

SELECT insert_template('Shoulder', 'Special Tests', 'Scarf Test (Cross-Body Adduction)',
'Scarf Test: [Positive/Negative]
Left: Pain [Yes/No], location: [AC joint/Posterior shoulder]
Right: Pain [Yes/No], location: [AC joint/Posterior shoulder]
Interpretation: AC joint pain suggests AC pathology, posterior suggests posterior capsule tightness
Reference: www.theBackROM.com/education/Clickup/scarf-test');

SELECT insert_template('Shoulder', 'Special Tests', 'Serratus Anterior Test (Punch Out)',
'Serratus Anterior Test: [Positive/Negative]
Left: Scapular winging [Yes/No]
Right: Scapular winging [Yes/No]
Strength: [Normal/Weak]
Interpretation: Winging suggests serratus anterior weakness/long thoracic nerve palsy
Reference: www.theBackROM.com/education/Clickup/serratus-anterior-test');

SELECT insert_template('Shoulder', 'Special Tests', 'Speed''s Test',
'Speed''s Test: [Positive/Negative]
Left: Pain in bicipital groove [Yes/No]
Right: Pain in bicipital groove [Yes/No]
Position: Resisted forward flexion with arm at 90°, elbow extended, forearm supinated
Interpretation: Pain suggests biceps tendinopathy or SLAP lesion
Sensitivity: 32% | Specificity: 75%
Reference: www.theBackROM.com/education/Clickup/speeds-test');

SELECT insert_template('Shoulder', 'Special Tests', 'Upper Limb Tension Test (ULTT)',
'Upper Limb Tension Test: [Positive/Negative]
ULTT1 (Median nerve): Left [Pos/Neg], Right [Pos/Neg]
ULTT2 (Median nerve variant): Left [Pos/Neg], Right [Pos/Neg]
ULTT3 (Radial nerve): Left [Pos/Neg], Right [Pos/Neg]
ULTT4 (Ulnar nerve): Left [Pos/Neg], Right [Pos/Neg]
Symptoms reproduced: _______
Interpretation: Positive suggests neural tension/cervical radiculopathy
Reference: www.theBackROM.com/education/Clickup/ultt');

SELECT insert_template('Shoulder', 'Special Tests', 'Whipple Test',
'Whipple Test: [Positive/Negative]
Left: [Positive/Negative]
Right: [Positive/Negative]
Interpretation: Suggests pectoralis major tear
Reference: www.theBackROM.com/education/Clickup/whipple-test');

SELECT insert_template('Shoulder', 'Special Tests', 'Yergason''s Test',
'Yergason''s Test: [Positive/Negative]
Left: Pain [Yes/No], subluxation [Yes/No]
Right: Pain [Yes/No], subluxation [Yes/No]
Position: Resisted supination with elbow at 90° flexion
Interpretation: Pain/subluxation suggests biceps tendon instability
Sensitivity: 37% | Specificity: 86%
Reference: www.theBackROM.com/education/Clickup/yergasons-test');

SELECT insert_template('Shoulder', 'Special Tests', 'Yocum''s Test',
'Yocum''s Test: [Positive/Negative]
Left: Pain [Yes/No]
Right: Pain [Yes/No]
Position: Hand on opposite shoulder, raise elbow without elevating shoulder
Interpretation: Pain suggests subacromial impingement
Reference: www.theBackROM.com/education/Clickup/yocums-test');

-- ============================================================================
-- ELBOW - SPECIAL TESTS (17 tests)
-- ============================================================================

SELECT insert_template('Elbow', 'Special Tests', 'Beighton Score (Elbow Hyperextension)',
'Beighton Score - Elbow Hyperextension:
Left elbow: [>10° hyperextension: Yes/No] Score: [0/1]
Right elbow: [>10° hyperextension: Yes/No] Score: [0/1]
Total Beighton Score: ___/9 [≥4 suggests hypermobility]
Reference: www.theBackROM.com/education/Clickup/beighton-score');

SELECT insert_template('Elbow', 'Special Tests', 'Cozen''s Test',
'Cozen''s Test: [Positive/Negative]
Left: Pain at lateral epicondyle [Yes/No]
Right: Pain at lateral epicondyle [Yes/No]
Position: Resisted wrist extension with pronated forearm
Interpretation: Pain suggests lateral epicondylitis (tennis elbow)
Reference: www.theBackROM.com/education/Clickup/cozens-test');

SELECT insert_template('Elbow', 'Special Tests', 'Elbow Extension Sign',
'Elbow Extension Sign: [Positive/Negative]
Left: Extension deficit ___° [>5-10° significant]
Right: Extension deficit ___°
Interpretation: Loss of extension suggests intra-articular pathology
Reference: www.theBackROM.com/education/Clickup/elbow-extension-sign');

SELECT insert_template('Elbow', 'Special Tests', 'Elbow Flexion Test',
'Elbow Flexion Test (Cubital Tunnel): [Positive/Negative]
Left: Symptoms in ulnar distribution after ___ seconds
Right: Symptoms in ulnar distribution after ___ seconds
Duration: Hold for up to 60 seconds
Interpretation: Positive suggests ulnar nerve compression at cubital tunnel
Sensitivity: 75% | Specificity: 99%
Reference: www.theBackROM.com/education/Clickup/elbow-flexion-test');

SELECT insert_template('Elbow', 'Special Tests', 'Elbow Quadrant Tests',
'Elbow Quadrant Tests: [Positive/Negative]
Flexion-pronation: [Pos/Neg]
Flexion-supination: [Pos/Neg]
Extension-pronation: [Pos/Neg]
Extension-supination: [Pos/Neg]
Findings: Pain/restriction at end-range
Interpretation: Identifies specific quadrant of limitation
Reference: www.theBackROM.com/education/Clickup/elbow-quadrant');

SELECT insert_template('Elbow', 'Special Tests', 'Elbow Valgus Stress Test',
'Valgus Stress Test: [Positive/Negative]
Left: Laxity/pain [Yes/No] at ___° flexion
Right: Laxity/pain [Yes/No] at ___° flexion
Interpretation: Positive suggests medial collateral ligament injury
Reference: www.theBackROM.com/education/Clickup/valgus-stress-elbow');

SELECT insert_template('Elbow', 'Special Tests', 'Elbow Varus Stress Test',
'Varus Stress Test: [Positive/Negative]
Left: Laxity/pain [Yes/No] at ___° flexion
Right: Laxity/pain [Yes/No] at ___° flexion
Interpretation: Positive suggests lateral collateral ligament injury
Reference: www.theBackROM.com/education/Clickup/varus-stress-elbow');

SELECT insert_template('Elbow', 'Special Tests', 'Golfer''s Elbow Test',
'Golfer''s Elbow Test (Medial Epicondylitis): [Positive/Negative]
Left: Pain at medial epicondyle [Yes/No]
Right: Pain at medial epicondyle [Yes/No]
Position: Resisted wrist flexion and pronation
Interpretation: Pain suggests medial epicondylitis
Reference: www.theBackROM.com/education/Clickup/golfers-elbow-test');

SELECT insert_template('Elbow', 'Special Tests', 'Maudsley''s Test',
'Maudsley''s Test (Middle Finger Test): [Positive/Negative]
Left: Pain at lateral epicondyle [Yes/No]
Right: Pain at lateral epicondyle [Yes/No]
Position: Resisted middle finger extension
Interpretation: Pain suggests radial tunnel syndrome or lateral epicondylitis
Reference: www.theBackROM.com/education/Clickup/maudsleys-test');

SELECT insert_template('Elbow', 'Special Tests', 'Milking Maneuver',
'Milking Maneuver: [Positive/Negative]
Left: Pain at medial elbow [Yes/No]
Right: Pain at medial elbow [Yes/No]
Position: Pull thumb with arm overhead
Interpretation: Pain suggests UCL injury (common in throwing athletes)
Reference: www.theBackROM.com/education/Clickup/milking-maneuver');

SELECT insert_template('Elbow', 'Special Tests', 'Mill''s Test',
'Mill''s Test: [Positive/Negative]
Left: Pain at lateral epicondyle [Yes/No]
Right: Pain at lateral epicondyle [Yes/No]
Position: Passive wrist flexion with pronation and elbow extension
Interpretation: Pain suggests lateral epicondylitis
Reference: www.theBackROM.com/education/Clickup/mills-test');

SELECT insert_template('Elbow', 'Special Tests', 'Moving Valgus Stress Test',
'Moving Valgus Stress Test: [Positive/Negative]
Left: Pain reproduction [Yes/No] at ___° arc
Right: Pain reproduction [Yes/No] at ___° arc
Interpretation: Pain suggests UCL injury
Sensitivity: 100% | Specificity: 75%
Reference: www.theBackROM.com/education/Clickup/moving-valgus-stress');

SELECT insert_template('Elbow', 'Special Tests', 'Polk''s Test',
'Polk''s Test: [Positive/Negative]
Left: [Positive/Negative]
Right: [Positive/Negative]
Interpretation: Assesses elbow stability
Reference: www.theBackROM.com/education/Clickup/polks-test');

SELECT insert_template('Elbow', 'Special Tests', 'Pronator Teres Syndrome Test',
'Pronator Teres Syndrome Test: [Positive/Negative]
Left: Symptoms in median nerve distribution [Yes/No]
Right: Symptoms in median nerve distribution [Yes/No]
Position: Resisted pronation with elbow flexion
Interpretation: Positive suggests median nerve compression by pronator teres
Reference: www.theBackROM.com/education/Clickup/pronator-teres-test');

SELECT insert_template('Elbow', 'Special Tests', 'Tinel''s Sign at Elbow',
'Tinel''s Sign (Elbow): [Positive/Negative]
Left: Tingling in ulnar distribution [Yes/No]
Right: Tingling in ulnar distribution [Yes/No]
Location: Cubital tunnel
Interpretation: Positive suggests ulnar nerve compression
Reference: www.theBackROM.com/education/Clickup/tinels-sign-elbow');

SELECT insert_template('Elbow', 'Special Tests', 'Wartenberg''s Sign',
'Wartenberg''s Sign: [Positive/Negative]
Left: Small finger abduction [Present/Absent]
Right: Small finger abduction [Present/Absent]
Interpretation: Positive suggests ulnar nerve palsy
Reference: www.theBackROM.com/education/Clickup/wartenbergs-sign');

SELECT insert_template('Elbow', 'Special Tests', 'Wringing Test for Lateral Epicondylitis',
'Wringing Test: [Positive/Negative]
Left: Pain at lateral epicondyle [Yes/No]
Right: Pain at lateral epicondyle [Yes/No]
Position: Simulated wringing motion
Interpretation: Pain suggests lateral epicondylitis
Reference: www.theBackROM.com/education/Clickup/wringing-test');

-- ============================================================================
-- WRIST - SPECIAL TESTS (10 tests)
-- ============================================================================

SELECT insert_template('Wrist', 'Special Tests', 'Allen Test for Blood Flow',
'Allen Test: [Normal/Abnormal]
Radial artery: Left [Patent/Occluded], Right [Patent/Occluded]
Ulnar artery: Left [Patent/Occluded], Right [Patent/Occluded]
Return of color: ___ seconds [<7 seconds normal]
Interpretation: Assesses radial and ulnar artery patency
Reference: www.theBackROM.com/education/Clickup/allen-test');

SELECT insert_template('Wrist', 'Special Tests', 'Finkelstein Test',
'Finkelstein Test: [Positive/Negative]
Left: Pain at radial styloid [Yes/No]
Right: Pain at radial styloid [Yes/No]
Position: Thumb in palm, ulnar deviation of wrist
Interpretation: Pain suggests De Quervain''s tenosynovitis
Sensitivity: 81% | Specificity: 50%
Reference: www.theBackROM.com/education/Clickup/finkelstein-test');

SELECT insert_template('Wrist', 'Special Tests', 'Phalen''s Test',
'Phalen''s Test: [Positive/Negative]
Left: Paresthesias in median distribution after ___ seconds
Right: Paresthesias in median distribution after ___ seconds
Duration: Hold for 60 seconds
Interpretation: Positive suggests carpal tunnel syndrome
Sensitivity: 68% | Specificity: 73%
Reference: www.theBackROM.com/education/Clickup/phalens-test');

SELECT insert_template('Wrist', 'Special Tests', 'Scaphoid Shift Test (Watson Test)',
'Scaphoid Shift Test: [Positive/Negative]
Left: Clunk/pain [Yes/No]
Right: Clunk/pain [Yes/No]
Interpretation: Positive suggests scapholunate instability
Reference: www.theBackROM.com/education/Clickup/scaphoid-shift-test');

SELECT insert_template('Wrist', 'Special Tests', 'Scapholunate Ligament Tests',
'Scapholunate Ligament Assessment:
Scaphoid shift test: [Pos/Neg]
Scapholunate ballottement: [Pos/Neg]
Findings: Pain, click, or instability
Interpretation: Positive suggests scapholunate ligament injury
Reference: www.theBackROM.com/education/Clickup/scapholunate-tests');

SELECT insert_template('Wrist', 'Special Tests', 'Supination Lift Test',
'Supination Lift Test: [Positive/Negative]
Left: Pain [Yes/No], inability to lift [Yes/No]
Right: Pain [Yes/No], inability to lift [Yes/No]
Interpretation: Pain suggests TFCC tear
Reference: www.theBackROM.com/education/Clickup/supination-lift-test');

SELECT insert_template('Wrist', 'Special Tests', 'Tinel''s Sign at Wrist',
'Tinel''s Sign (Wrist): [Positive/Negative]
Left: Tingling in median distribution [Yes/No]
Right: Tingling in median distribution [Yes/No]
Location: Carpal tunnel
Interpretation: Positive suggests carpal tunnel syndrome
Sensitivity: 50% | Specificity: 77%
Reference: www.theBackROM.com/education/Clickup/tinels-sign-wrist');

SELECT insert_template('Wrist', 'Special Tests', 'TFCC Load Test',
'TFCC Load Test: [Positive/Negative]
Left: Pain [Yes/No]
Right: Pain [Yes/No]
Position: Ulnar deviation with axial compression
Interpretation: Pain suggests TFCC tear
Reference: www.theBackROM.com/education/Clickup/tfcc-load-test');

SELECT insert_template('Wrist', 'Special Tests', 'Triangular Fibrocartilage Stress Test',
'TFCC Stress Test: [Positive/Negative]
Left: Pain at ulnar wrist [Yes/No]
Right: Pain at ulnar wrist [Yes/No]
Interpretation: Pain suggests TFCC injury
Reference: www.theBackROM.com/education/Clickup/tfcc-stress-test');

SELECT insert_template('Wrist', 'Special Tests', 'WHAT Test (Wrist Hyperflexion and Abduction of Thumb)',
'WHAT Test: [Positive/Negative]
Left: Pain at first dorsal compartment [Yes/No]
Right: Pain at first dorsal compartment [Yes/No]
Interpretation: Pain suggests De Quervain''s tenosynovitis (alternative to Finkelstein)
Specificity: 99%
Reference: www.theBackROM.com/education/Clickup/what-test');

-- ============================================================================
-- HAND - SPECIAL TESTS (14 tests)
-- ============================================================================

SELECT insert_template('Hand', 'Special Tests', 'Beighton Score (Hand/Wrist Components)',
'Beighton Score Assessment:
MCP hyperextension >90° (5th finger): Left [Y/N], Right [Y/N] = ___/2
Thumb to forearm: Left [Y/N], Right [Y/N] = ___/2
Total hand/wrist contribution: ___/4
Reference: www.theBackROM.com/education/Clickup/beighton-score');

SELECT insert_template('Hand', 'Special Tests', 'Bunnell-Littler Test',
'Bunnell-Littler Test: [Positive/Negative]
Finger tested: [Index/Middle/Ring/Little]
MCP extended: PIP flexion [Limited/Full]
MCP flexed: PIP flexion [Limited/Full]
Interpretation: Limited with MCP extended suggests intrinsic muscle tightness
Reference: www.theBackROM.com/education/Clickup/bunnell-littler-test');

SELECT insert_template('Hand', 'Special Tests', 'Elson Test',
'Elson Test: [Positive/Negative]
Finger tested: _______
Findings: DIP hyperextension with resistance
Interpretation: Positive suggests central slip rupture
Reference: www.theBackROM.com/education/Clickup/elson-test');

SELECT insert_template('Hand', 'Special Tests', 'Figure of Eight Measurement',
'Figure of Eight Measurement:
Left hand: ___ cm
Right hand: ___ cm
Difference: ___ cm
Interpretation: Objective measure of hand swelling/edema
Reference: www.theBackROM.com/education/Clickup/figure-of-eight-hand');

SELECT insert_template('Hand', 'Special Tests', 'Flick Sign',
'Flick Sign: [Positive/Negative]
Patient reports: Flicking/shaking hand relieves symptoms [Yes/No]
Interpretation: Positive suggests carpal tunnel syndrome
Specificity: 96%
Reference: www.theBackROM.com/education/Clickup/flick-sign');

SELECT insert_template('Hand', 'Special Tests', 'Froment''s Sign',
'Froment''s Sign: [Positive/Negative]
Left: IP flexion when gripping paper [Yes/No]
Right: IP flexion when gripping paper [Yes/No]
Interpretation: Positive suggests ulnar nerve palsy (adductor pollicis weakness)
Reference: www.theBackROM.com/education/Clickup/froments-sign');

SELECT insert_template('Hand', 'Special Tests', 'Sollerman Hand Function Test',
'Sollerman Hand Function Test:
Total score: ___/80 points
Grip types assessed: [All 20 tasks/Partial]
Interpretation: Functional assessment of hand in ADLs
Reference: www.theBackROM.com/education/Clickup/sollerman-test');

SELECT insert_template('Hand', 'Special Tests', 'Thumb CMC Grind Test',
'Thumb CMC Grind Test: [Positive/Negative]
Left: Pain/crepitus [Yes/No]
Right: Pain/crepitus [Yes/No]
Position: Axial compression with rotation of MC on trapezium
Interpretation: Pain/crepitus suggests CMC osteoarthritis
Reference: www.theBackROM.com/education/Clickup/cmc-grind-test');

SELECT insert_template('Hand', 'Special Tests', 'Weber Two-Point Discrimination',
'Two-Point Discrimination:
Median nerve (index finger): Left ___ mm, Right ___ mm
Ulnar nerve (little finger): Left ___ mm, Right ___ mm
Normal: <6mm, Fair: 6-10mm, Poor: 11-15mm, Protective: >15mm
Interpretation: Assesses sensory nerve function
Reference: www.theBackROM.com/education/Clickup/two-point-discrimination');

SELECT insert_template('Hand', 'Special Tests', 'Wrinkling Test (Skin Wrinkle Test)',
'Wrinkling Test: [Normal/Abnormal]
Duration: 5 minutes in water
Left hand: Wrinkling [Present/Absent] in [Median/Ulnar/Radial] distribution
Right hand: Wrinkling [Present/Absent] in [Median/Ulnar/Radial] distribution
Interpretation: Absence suggests peripheral nerve lesion
Reference: www.theBackROM.com/education/Clickup/wrinkling-test');

SELECT insert_template('Hand', 'Special Tests', 'Sweater Finger Sign',
'Sweater Finger Sign: [Positive/Negative]
Finger affected: _______
Findings: DIP remains extended when making fist
Interpretation: Suggests FDP tendon rupture
Reference: www.theBackROM.com/education/Clickup/sweater-finger-sign');

SELECT insert_template('Hand', 'Special Tests', 'Intrinsic Muscle Tightness Test',
'Intrinsic Muscle Tightness Test: [Positive/Negative]
MCP extended: PIP/DIP flexion [Limited/Full]
MCP flexed: PIP/DIP flexion [Improved/No change]
Interpretation: Improvement with MCP flexion suggests intrinsic tightness
Reference: www.theBackROM.com/education/Clickup/intrinsic-tightness');

SELECT insert_template('Hand', 'Special Tests', 'Retinacular Test (Haines-Zancolli)',
'Retinacular Test: [Positive/Negative]
PIP extended: DIP flexion [Limited/Full]
PIP flexed: DIP flexion [Improved/No change]
Interpretation: Improvement suggests oblique retinacular ligament tightness
Reference: www.theBackROM.com/education/Clickup/retinacular-test');

SELECT insert_template('Hand', 'Special Tests', 'Grip Strength Test',
'Grip Strength (Dynamometer):
Left: ___ kg (Average of 3 trials)
Right: ___ kg (Average of 3 trials)
Dominant hand: [Left/Right]
% of contralateral: ___%
Normative: Males 40-50kg, Females 25-35kg (age-dependent)
Reference: www.theBackROM.com/education/Clickup/grip-strength');

-- Continue in next section due to length...
