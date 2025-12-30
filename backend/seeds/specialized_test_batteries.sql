-- Specialized Test Batteries - Knee & Vestibular Systems
-- Creates condition-specific assessment protocols
-- Reference: Clinical expertise + Vestibulært mastersheet

-- ============================================================================
-- KNEE TEST BATTERIES - Condition-Specific
-- ============================================================================

-- Battery 1: ACL Injury Assessment
INSERT INTO test_batteries (
  organization_id,
  name,
  description,
  code,
  target_population,
  target_body_region,
  estimated_minutes,
  tests,
  scoring_method,
  composite_score_calculation,
  indicated_for,
  contraindications,
  psychometric_properties,
  reference_citation,
  educational_link,
  is_system,
  is_template,
  is_active
) VALUES (
  NULL, -- System battery
  'ACL Injury Assessment Battery',
  'Comprehensive battery for diagnosing anterior cruciate ligament tears. Combines clinical tests with highest sensitivity/specificity for ACL pathology.',
  'ACL_BATTERY',
  'Athletes, acute knee injury, suspected ACL tear',
  'Knee',
  15,
  '[
    {
      "test_id": "lachman",
      "test_name": "Lachman Test",
      "test_type": "special_test",
      "order": 1,
      "required": true,
      "scoring": {
        "result": "positive/negative",
        "translation": "Grade 0/I/II/III",
        "endpoint": "firm/soft"
      },
      "psychometrics": {
        "sensitivity": 0.85,
        "specificity": 0.94
      },
      "notes": "Gold standard for ACL assessment"
    },
    {
      "test_id": "lever_sign",
      "test_name": "Lever Sign Test",
      "test_type": "special_test",
      "order": 2,
      "required": true,
      "scoring": {
        "result": "positive/negative",
        "heel_rise": "yes/no"
      },
      "psychometrics": {
        "sensitivity": 1.00,
        "specificity": 1.00
      },
      "notes": "100% sensitivity and specificity when patient relaxed"
    },
    {
      "test_id": "anterior_drawer_knee",
      "test_name": "Anterior Drawer Test",
      "test_type": "special_test",
      "order": 3,
      "required": true,
      "scoring": {
        "result": "positive/negative",
        "translation": "Grade 0/I/II/III"
      },
      "psychometrics": {
        "sensitivity": 0.62,
        "specificity": 0.67
      }
    },
    {
      "test_id": "pivot_shift",
      "test_name": "Pivot Shift Test",
      "test_type": "special_test",
      "order": 4,
      "required": false,
      "scoring": {
        "result": "Grade 0/I/II/III"
      },
      "psychometrics": {
        "sensitivity": 0.24,
        "specificity": 0.98
      },
      "notes": "Highly specific but requires patient relaxation. Indicates rotatory instability."
    },
    {
      "test_id": "knee_effusion",
      "test_name": "Knee Effusion Tests",
      "test_type": "observation",
      "order": 5,
      "required": true,
      "scoring": {
        "sweep_test": "positive/negative",
        "ballottement": "positive/negative"
      },
      "notes": "Large effusion suggests significant injury"
    }
  ]'::jsonb,
  'COMPOSITE',
  '{
    "interpretation": [
      {"min": 0, "max": 1, "label": "Low probability ACL tear", "color": "green"},
      {"min": 2, "max": 2, "label": "Moderate probability ACL tear", "color": "yellow"},
      {"min": 3, "max": 5, "label": "High probability ACL tear - MRI indicated", "color": "red"}
    ],
    "scoring_notes": "Count number of positive tests. ≥3 positive strongly suggests ACL tear."
  }'::jsonb,
  ARRAY['ACL tear', 'Knee instability', 'Acute knee trauma', 'Sports injury'],
  ARRAY['Acute fracture', 'Patellar dislocation'],
  '{
    "cluster_sensitivity": 0.95,
    "cluster_specificity": 0.94,
    "reference": "Benjaminse A, et al. (2006) Clinical diagnosis of an ACL rupture: a meta-analysis"
  }'::jsonb,
  'Benjaminse A, et al. (2006). Clinical diagnosis of an anterior cruciate ligament rupture: a meta-analysis. J Orthop Sports Phys Ther. 36(5):267-288.',
  'www.theBackROM.com/education/Clickup/acl-battery',
  true,
  true,
  true
);

-- Battery 2: PCL Injury Assessment
INSERT INTO test_batteries (
  organization_id, name, description, code, target_population, target_body_region,
  estimated_minutes, tests, scoring_method, composite_score_calculation,
  indicated_for, contraindications, educational_link, is_system, is_template, is_active
) VALUES (
  NULL,
  'PCL Injury Assessment Battery',
  'Posterior cruciate ligament assessment protocol with posterior sag sign and stress testing.',
  'PCL_BATTERY',
  'Dashboard injury, knee hyperflexion trauma, posterior knee pain',
  'Knee',
  10,
  '[
    {
      "test_id": "posterior_sag_sign",
      "test_name": "Posterior Sag Sign (Gravity Drawer)",
      "test_type": "special_test",
      "order": 1,
      "required": true,
      "scoring": {"result": "positive/negative"},
      "psychometrics": {"sensitivity": 0.79, "specificity": 1.00},
      "notes": "Patient supine, knee 90°, observe tibial step-off"
    },
    {
      "test_id": "posterior_drawer",
      "test_name": "Posterior Drawer Test",
      "test_type": "special_test",
      "order": 2,
      "required": true,
      "scoring": {
        "result": "positive/negative",
        "translation": "Grade 0/I/II/III"
      },
      "psychometrics": {"sensitivity": 0.90, "specificity": 0.99}
    },
    {
      "test_id": "dial_test",
      "test_name": "Dial Test",
      "test_type": "special_test",
      "order": 3,
      "required": true,
      "scoring": {
        "er_30_deg": "difference in degrees",
        "er_90_deg": "difference in degrees"
      },
      "notes": ">10° asymmetry at 30° only: PLC injury. At both 30° and 90°: Combined PCL+PLC"
    },
    {
      "test_id": "quadriceps_active_test",
      "test_name": "Quadriceps Active Test",
      "test_type": "special_test",
      "order": 4,
      "required": false,
      "scoring": {"result": "positive/negative"},
      "notes": "Anterior tibial translation with quad contraction suggests PCL tear"
    }
  ]'::jsonb,
  'COMPOSITE',
  '{
    "interpretation": [
      {"min": 0, "max": 0, "label": "PCL intact"},
      {"min": 1, "max": 1, "label": "Possible PCL injury"},
      {"min": 2, "max": 4, "label": "High probability PCL tear"}
    ]
  }'::jsonb,
  ARRAY['PCL tear', 'Dashboard injury', 'Posterolateral corner injury'],
  ARRAY['Acute fracture', 'Severe effusion'],
  'www.theBackROM.com/education/Clickup/pcl-battery',
  true, true, true
);

-- Battery 3: Meniscal Pathology Assessment
INSERT INTO test_batteries (
  organization_id, name, description, code, target_population, target_body_region,
  estimated_minutes, tests, scoring_method, composite_score_calculation,
  indicated_for, contraindications, psychometric_properties, educational_link,
  is_system, is_template, is_active
) VALUES (
  NULL,
  'Meniscal Tear Assessment Battery',
  'Comprehensive meniscal assessment combining most sensitive tests for medial and lateral meniscus tears.',
  'MENISCUS_BATTERY',
  'Adults, mechanical symptoms, joint line pain, locking/catching',
  'Knee',
  15,
  '[
    {
      "test_id": "joint_line_tenderness",
      "test_name": "Joint Line Tenderness",
      "test_type": "palpation",
      "order": 1,
      "required": true,
      "scoring": {
        "medial": "positive/negative",
        "lateral": "positive/negative"
      },
      "psychometrics": {"sensitivity": 0.83, "specificity": 0.50},
      "notes": "Most sensitive single test for meniscal tear"
    },
    {
      "test_id": "thessaly_test",
      "test_name": "Thessaly Test",
      "test_type": "special_test",
      "order": 2,
      "required": true,
      "scoring": {
        "medial_pain": "yes/no",
        "lateral_pain": "yes/no",
        "click": "yes/no",
        "locking_sensation": "yes/no"
      },
      "psychometrics": {"sensitivity": 0.89, "specificity": 0.97},
      "notes": "20° knee flexion, rotate on planted foot. Highest accuracy for meniscal tears."
    },
    {
      "test_id": "mcmurrays",
      "test_name": "McMurray Test",
      "test_type": "special_test",
      "order": 3,
      "required": true,
      "scoring": {
        "medial_meniscus": "click/pain/negative",
        "lateral_meniscus": "click/pain/negative"
      },
      "psychometrics": {"sensitivity": 0.61, "specificity": 0.84},
      "notes": "IR-extension for medial, ER-extension for lateral"
    },
    {
      "test_id": "apleys_compression",
      "test_name": "Apley Compression Test",
      "test_type": "special_test",
      "order": 4,
      "required": true,
      "scoring": {
        "compression_pain": "yes/no",
        "distraction_pain": "yes/no"
      },
      "notes": "Pain with compression suggests meniscus, pain with distraction suggests ligament"
    },
    {
      "test_id": "eges_test",
      "test_name": "Ege Test (Squat Test)",
      "test_type": "functional_test",
      "order": 5,
      "required": false,
      "scoring": {
        "medial_pain_click": "yes/no",
        "lateral_pain_click": "yes/no"
      },
      "notes": "Deep squat with rotation. Medial pain = medial meniscus, lateral = lateral meniscus"
    }
  ]'::jsonb,
  'COMPOSITE',
  '{
    "interpretation": [
      {"min": 0, "max": 1, "label": "Low probability meniscal tear"},
      {"min": 2, "max": 3, "label": "Moderate probability - consider imaging"},
      {"min": 4, "max": 5, "label": "High probability meniscal tear - MRI indicated"}
    ],
    "clinical_note": "Joint line tenderness + Thessaly positive = 97% specificity for meniscal tear"
  }'::jsonb,
  ARRAY['Meniscal tear', 'Mechanical knee symptoms', 'Joint line pain', 'Locking/catching'],
  ARRAY['Acute fracture', 'Unable to bear weight'],
  '{
    "thessaly_accuracy": "Highest accuracy among meniscal tests",
    "joint_line_tenderness": "Most sensitive single finding"
  }'::jsonb,
  'www.theBackROM.com/education/Clickup/meniscus-battery',
  true, true, true
);

-- ============================================================================
-- VESTIBULAR & CEREBELLAR ASSESSMENT BATTERIES
-- ============================================================================

-- Battery 4: Comprehensive Vestibular Screen (Vestibulært Mastersheet)
INSERT INTO test_batteries (
  organization_id, name, description, code, target_population, target_body_region,
  estimated_minutes, tests, scoring_method, composite_score_calculation,
  indicated_for, contraindications, reference_citation, educational_link,
  is_system, is_template, is_active
) VALUES (
  NULL,
  'Vestibular Mastersheet - Differential Diagnostic Screen',
  'Comprehensive vestibular system assessment including balance, cerebellar integrity, and vestibulo-ocular reflex testing. Based on functional neurology approach to hemispheric balance and vestibular function.',
  'VESTIBULAR_MASTERSHEET',
  'Dizziness, vertigo, balance disorders, post-concussion, cerebellar dysfunction',
  'Vestibular System',
  25,
  '[
    {
      "test_id": "one_leg_standing_balance",
      "test_name": "One Leg Standing Balance (IPSILATERAL)",
      "test_type": "balance",
      "order": 1,
      "required": true,
      "scoring": {
        "left_eyes_open_30sec": "pass/fail",
        "left_eyes_closed_10sec": "pass/fail",
        "right_eyes_open_30sec": "pass/fail",
        "right_eyes_closed_10sec": "pass/fail",
        "deviation": "none/ipsilateral_cerebellum"
      },
      "interpretation": {
        "normal": "30 sec eyes open, 10 sec eyes closed",
        "abnormal": "Imbalance or poor balance indicates IPSILATERAL cerebellar dysfunction"
      },
      "notes": "Tests cerebellar integrity on same side as stance leg. Ipsilateral cerebellum affected if unsteady."
    },
    {
      "test_id": "romberg_7_step",
      "test_name": "Romberg 7-Step Test (IPSILATERAL)",
      "test_type": "balance",
      "order": 2,
      "required": true,
      "scoring": {
        "firm_surface_eyes_open": "stable/unstable",
        "firm_surface_eyes_closed": "stable/unstable",
        "foam_pad_eyes_open": "stable/unstable",
        "foam_pad_eyes_closed": "stable/unstable",
        "deterioration": "none/mild/moderate/severe"
      },
      "interpretation": {
        "normal": "Stable on both surfaces, mild sway acceptable eyes closed",
        "vestibular": "Significant instability on foam with eyes closed",
        "cerebellar": "Instability even with eyes open",
        "proprioceptive": "Instability only when eyes closed"
      },
      "notes": "Foam pad removes proprioceptive input. Eyes closed removes visual compensation."
    },
    {
      "test_id": "finger_to_nose_ipsi",
      "test_name": "Finger to Nose Test (IPSILATERAL)",
      "test_type": "cerebellar",
      "order": 3,
      "required": true,
      "scoring": {
        "left_arm": "normal/dysmetria/past_pointing/intention_tremor",
        "right_arm": "normal/dysmetria/past_pointing/intention_tremor",
        "speed_comparison": "equal/left_slower/right_slower"
      },
      "interpretation": {
        "normal": "Smooth, accurate movement to nose",
        "cerebellar_ipsi": "Dysmetria, past-pointing, or tremor indicates IPSILATERAL cerebellar hemisphere dysfunction"
      },
      "notes": "Cerebellum controls coordination on same side of body"
    },
    {
      "test_id": "finger_to_finger_fluid",
      "test_name": "Finger to Finger V2 - Fluid Motion (IPSILATERAL)",
      "test_type": "cerebellar",
      "order": 4,
      "required": true,
      "scoring": {
        "left_arm": "smooth/lagged/compensated",
        "right_arm": "smooth/lagged/compensated",
        "facial_grimacing": "none/present",
        "body_compensation": "none/trunk_movement/shoulder_elevation"
      },
      "interpretation": {
        "normal": "Similar speed both sides (slight dominance ok), no grimacing, no lag in movement",
        "abnormal": "Different speed, grimacing, compensatory movements"
      },
      "notes": "Patient touches examiner''s moving finger. Tests cerebellar tracking ability."
    },
    {
      "test_id": "rapid_supination",
      "test_name": "Rapid Alternating Movements - Supination Test",
      "test_type": "cerebellar",
      "order": 5,
      "required": true,
      "scoring": {
        "left_hand": "smooth/irregular/slow",
        "right_hand": "smooth/irregular/slow",
        "speed_asymmetry": "none/present",
        "facial_compensation": "none/grimacing",
        "body_compensation": "none/trunk_lean/shoulder_movement"
      },
      "interpretation": {
        "normal": "Similar speed (dominant hand slightly faster ok), no grimacing or body compensation",
        "cerebellar_ipsi": "Dysdiadochokinesia - irregular, unequal speed, compensatory movements"
      },
      "notes": "Tests rapid alternating movements. Can test on hand or thigh."
    },
    {
      "test_id": "dual_tasking_alphabet",
      "test_name": "Dual Tasking - Alphabet & Finger Movement",
      "test_type": "cognitive_motor",
      "order": 6,
      "required": true,
      "scoring": {
        "performance": "normal/deteriorated_motor/deteriorated_cognitive/both",
        "speed_change": "maintained/slowed",
        "accuracy_change": "maintained/decreased"
      },
      "interpretation": {
        "normal": "Can maintain both tasks simultaneously",
        "abnormal": "Motor or cognitive task deteriorates significantly"
      },
      "notes": "Assesses cognitive-motor integration and cerebellar function under dual-task conditions"
    },
    {
      "test_id": "finger_tapping",
      "test_name": "Finger Tapping Test",
      "test_type": "cerebellar",
      "order": 7,
      "required": true,
      "scoring": {
        "left_hand_rate": "taps per 10 seconds",
        "right_hand_rate": "taps per 10 seconds",
        "asymmetry": "none/mild/moderate/severe",
        "rhythm": "regular/irregular",
        "amplitude": "consistent/decreasing"
      },
      "interpretation": {
        "normal": "Similar speed both sides (dominant slightly faster), regular rhythm",
        "cerebellar": "Significant asymmetry, irregular rhythm, decreasing amplitude"
      }
    },
    {
      "test_id": "vor_test_hip",
      "test_name": "Vestibulo-Ocular Reflex (VOR) - Head Impulse Testing",
      "test_type": "vestibular",
      "order": 8,
      "required": true,
      "scoring": {
        "left_horizontal": "normal/catch_up_saccade/corrective_saccade",
        "right_horizontal": "normal/catch_up_saccade/corrective_saccade",
        "left_anterior": "normal/abnormal",
        "right_posterior": "normal/abnormal",
        "symmetry": "symmetric/asymmetric"
      },
      "interpretation": {
        "normal": "Eyes remain fixed on target during rapid head turn",
        "peripheral_vestibular": "Catch-up saccade indicates weakness in that canal",
        "bilateral_vestibular": "Bilateral catch-up saccades"
      },
      "notes": "Rapid unpredictable head turn while patient fixates on target. Tests all 6 semicircular canals."
    },
    {
      "test_id": "saccades",
      "test_name": "Band Saccades (Eye Movements)",
      "test_type": "oculomotor",
      "order": 9,
      "required": true,
      "scoring": {
        "accuracy": "accurate/overshoot/undershoot",
        "speed": "normal/slow/fast",
        "latency": "normal/increased",
        "conjugacy": "conjugate/disconjugate"
      },
      "interpretation": {
        "normal": "Quick, accurate eye movements between targets",
        "cerebellar": "Dysmetric (overshoot/undershoot)",
        "brainstem": "Slowed or absent saccades"
      },
      "notes": "Tests frontal eye fields and cerebellar control of saccadic eye movements"
    }
  ]'::jsonb,
  'INDIVIDUAL',
  '{
    "clinical_note": "Vestibular system integrity assessed through balance, VOR, and cerebellar coordination. Ipsilateral findings indicate same-side cerebellar hemisphere dysfunction.",
    "hemispheric_assessment": {
      "head_tilt": "Away from dysfunctional cerebellum (cerebellum affects eyes via intorsion control)",
      "right_head_tilt": "Suspect left cerebellar dysfunction - confirm with tests",
      "postural_patterns": "Same side as hemispheric dysfunction shows: head tilt, internal rotation shoulder, flexed fingers, increased tone, elevated ribs, reduced costa12-ilium distance, externally rotated foot"
    },
    "neurophysiology": {
      "cortex_output": "90% of cortical output goes to ipsilateral brainstem (PMRF)",
      "pmrf_functions": "Inhibits SNS, inhibits pain, activates extensors, inhibits flexors",
      "frontal_lobe": "Primary motor (execute), supplementary motor (plan), frontal eye field (saccades), prefrontal (executive control)"
    }
  }'::jsonb,
  'COMPOSITE',
  ARRAY['Vertigo', 'Dizziness', 'Balance disorders', 'Post-concussion syndrome', 'Cerebellar dysfunction', 'Hemispheric imbalance', 'BPPV screening'],
  ARRAY['Acute stroke (last 24h)', 'Severe neck pain', 'Vertebrobasilar insufficiency', 'Recent cervical trauma'],
  'Functional neurology hemispheric balance approach. Vestibular system physiology per Hain TC. Practical Management of the Dizzy Patient.',
  'www.theBackROM.com/education/Clickup/vestibular-mastersheet',
  true, true, true
);

-- Battery 5: BPPV Diagnostic Protocol
INSERT INTO test_batteries (
  organization_id, name, description, code, target_population, target_body_region,
  estimated_minutes, tests, scoring_method, composite_score_calculation,
  indicated_for, contraindications, educational_link, is_system, is_template, is_active
) VALUES (
  NULL,
  'BPPV Diagnostic Battery',
  'Comprehensive benign paroxysmal positional vertigo assessment including Dix-Hallpike and repositioning tests.',
  'BPPV_BATTERY',
  'Positional vertigo, brief episodes triggered by head movement',
  'Vestibular System',
  15,
  '[
    {
      "test_id": "dix_hallpike_right",
      "test_name": "Dix-Hallpike Test - Right Ear Down",
      "test_type": "vestibular",
      "order": 1,
      "required": true,
      "scoring": {
        "nystagmus": "absent/up_beating_torsional/down_beating/horizontal",
        "latency": "seconds (2-30 sec for canalithiasis)",
        "duration": "seconds (<30s canalithiasis, sustained cupulolithiasis)",
        "reversal": "yes/no",
        "vertigo": "none/mild/moderate/severe"
      },
      "interpretation": {
        "canalithiasis": "Latency 2-30s, duration <30s, up-beating torsional nystagmus, reversal present",
        "cupulolithiasis": "No latency, sustained duration (as long as position held), no reversal"
      },
      "notes": "Tests right posterior semicircular canal. Most common canal for BPPV."
    },
    {
      "test_id": "dix_hallpike_left",
      "test_name": "Dix-Hallpike Test - Left Ear Down",
      "test_type": "vestibular",
      "order": 2,
      "required": true,
      "scoring": {
        "nystagmus": "absent/up_beating_torsional/down_beating/horizontal",
        "latency": "seconds",
        "duration": "seconds",
        "reversal": "yes/no",
        "vertigo": "none/mild/moderate/severe"
      },
      "notes": "Tests left posterior semicircular canal"
    },
    {
      "test_id": "supine_roll_test",
      "test_name": "Supine Roll Test (Lateral Canal BPPV)",
      "test_type": "vestibular",
      "order": 3,
      "required": true,
      "scoring": {
        "right_roll_nystagmus": "absent/geotropic/apogeotropic",
        "left_roll_nystagmus": "absent/geotropic/apogeotropic",
        "stronger_side": "right/left/equal"
      },
      "interpretation": {
        "geotropic": "Canalithiasis - affected ear is side with stronger nystagmus",
        "apogeotropic": "Cupulolithiasis - affected ear is side with weaker nystagmus"
      },
      "notes": "Tests lateral (horizontal) semicircular canals"
    }
  ]'::jsonb,
  'INDIVIDUAL',
  '{
    "interpretation": [
      {"pattern": "Positive Dix-Hallpike with canalithiasis pattern", "diagnosis": "Posterior canal BPPV - canalithiasis", "treatment": "Epley maneuver"},
      {"pattern": "Positive Dix-Hallpike with cupulolithiasis pattern", "diagnosis": "Posterior canal BPPV - cupulolithiasis", "treatment": "Modified Epley or Semont"},
      {"pattern": "Positive supine roll - geotropic", "diagnosis": "Lateral canal BPPV - canalithiasis", "treatment": "Barbecue roll or Gufoni"},
      {"pattern": "Positive supine roll - apogeotropic", "diagnosis": "Lateral canal BPPV - cupulolithiasis", "treatment": "Head-shaking, liberatory maneuver"}
    ]
  }'::jsonb,
  ARRAY['BPPV', 'Positional vertigo', 'Benign paroxysmal positional vertigo'],
  ARRAY['Vertebrobasilar insufficiency', 'Acute neck trauma', 'Severe cervical stenosis'],
  'www.theBackROM.com/education/Clickup/bppv-assessment',
  true, true, true
);

-- Battery 6: Pre-Adjustment Cervical Screening
INSERT INTO test_batteries (
  organization_id, name, description, code, target_population, target_body_region,
  estimated_minutes, tests, scoring_method, composite_score_calculation,
  indicated_for, contraindications, educational_link, is_system, is_template, is_active
) VALUES (
  NULL,
  'Pre-Adjustment Cervical Safety Screen',
  'Essential screening protocol before cervical spine manipulation. Includes blood pressure, Romberg for hemispheric assessment, and vertebrobasilar screening.',
  'PRE_ADJUST_SCREEN',
  'All patients before cervical manipulation',
  'Cervical Spine',
  10,
  '[
    {
      "test_id": "blood_pressure",
      "test_name": "Blood Pressure Measurement",
      "test_type": "vital_signs",
      "order": 1,
      "required": true,
      "scoring": {
        "systolic": "mmHg",
        "diastolic": "mmHg",
        "position": "sitting/standing"
      },
      "interpretation": {
        "normal": "SBP <140, DBP <90",
        "elevated": "SBP 140-159, DBP 90-99 - caution",
        "high": "SBP ≥160, DBP ≥100 - contraindication to HVLA"
      },
      "notes": "Uncontrolled hypertension is relative contraindication to cervical manipulation"
    },
    {
      "test_id": "romberg_hemispheric",
      "test_name": "Romberg Test - Hemispheric Assessment",
      "test_type": "balance",
      "order": 2,
      "required": true,
      "scoring": {
        "eyes_open": "stable/sway_left/sway_right",
        "eyes_closed": "stable/sway_left/sway_right/fall_tendency",
        "preferred_side": "none/left/right"
      },
      "interpretation": {
        "clinical_use": "Determines which side to affect with treatment",
        "hemispheric": "Sway direction may indicate cerebellar hemispheric bias",
        "vestibular": "Significant eyes-closed instability suggests vestibular/proprioceptive deficit"
      },
      "notes": "Use this to guide which side of spine to adjust. Patient sway indicates treatment side preference."
    },
    {
      "test_id": "vertebral_artery_test",
      "test_name": "Vertebrobasilar Insufficiency Screen",
      "test_type": "vascular",
      "order": 3,
      "required": true,
      "scoring": {
        "extension_rotation_left": "negative/dizziness/nystagmus/visual_changes/drop_attacks",
        "extension_rotation_right": "negative/dizziness/nystagmus/visual_changes/drop_attacks",
        "hold_duration": "seconds (30-45s recommended)"
      },
      "interpretation": {
        "positive": "Dizziness, nystagmus, visual changes, or drop attacks = CONTRAINDICATION to cervical manipulation",
        "negative": "No symptoms after 30-45 seconds = safe to proceed"
      },
      "notes": "CRITICAL safety test. Positive test = absolute contraindication to cervical HVLA thrust."
    },
    {
      "test_id": "cervical_rom_screening",
      "test_name": "Active Cervical ROM Screening",
      "test_type": "rom",
      "order": 4,
      "required": true,
      "scoring": {
        "flexion": "full/restricted/painful",
        "extension": "full/restricted/painful",
        "rotation_left": "full/restricted/painful",
        "rotation_right": "full/restricted/painful"
      },
      "notes": "Assess quality of movement and willingness to move. Severe restriction or apprehension may indicate instability."
    },
    {
      "test_id": "red_flags_checklist",
      "test_name": "Cervical Spine Red Flags",
      "test_type": "screening",
      "order": 5,
      "required": true,
      "scoring": {
        "severe_trauma": "no/yes",
        "progressive_neurological": "no/yes",
        "systemically_unwell": "no/yes",
        "unexplained_weight_loss": "no/yes",
        "history_cancer": "no/yes",
        "long_term_steroids": "no/yes",
        "drop_attacks": "no/yes",
        "bilateral_symptoms": "no/yes"
      },
      "interpretation": {
        "any_yes": "RED FLAG - investigate before manipulation, possible referral needed"
      }
    }
  ]'::jsonb,
  'PASS_FAIL',
  '{
    "pass_criteria": "All tests negative, BP controlled, no red flags",
    "fail_criteria": "Positive vertebral artery test, uncontrolled HTN, or any red flag",
    "clinical_decision": {
      "pass": "Safe to proceed with cervical manipulation",
      "fail": "CONTRAINDICATION - use alternative treatment or refer"
    }
  }'::jsonb,
  ARRAY['Pre-manipulation screening', 'Cervical adjustment safety', 'VBI screening'],
  ARRAY['None - this is the screening itself'],
  'www.theBackROM.com/education/Clickup/pre-adjustment-screening',
  true, true, true
);

-- Battery 7: Hemispheric Balance Assessment
INSERT INTO test_batteries (
  organization_id, name, description, code, target_population, target_body_region,
  estimated_minutes, tests, scoring_method, composite_score_calculation,
  indicated_for, reference_citation, educational_link, is_system, is_template, is_active
) VALUES (
  NULL,
  'Hemispheric Balance & Posture Assessment',
  'Functional neurology approach to assessing hemispheric dominance and cerebellar function through postural analysis and neurological screening. 90% of cortical output goes to ipsilateral brainstem (PMRF).',
  'HEMISPHERIC_BALANCE',
  'Functional neurology assessment, chronic pain, postural dysfunction, cerebellar screening',
  'Neurological',
  20,
  '[
    {
      "test_id": "postural_analysis",
      "test_name": "Neurological Posture Assessment",
      "test_type": "observation",
      "order": 1,
      "required": true,
      "scoring": {
        "head_tilt": "none/left/right",
        "head_rotation": "none/left/right",
        "facial_asymmetry": "none/left_droop/right_droop",
        "pupil_asymmetry": "none/left_larger/right_larger",
        "shoulder_height": "level/left_elevated/right_elevated",
        "shoulder_internal_rotation": "none/left/right",
        "elbow_angle": "symmetric/left_flexed/right_flexed",
        "wrist_flexion": "symmetric/left_flexed/right_flexed",
        "finger_posture": "extended/left_flexed/right_flexed",
        "hip_position": "symmetric/asymmetric",
        "costa12_ilium_distance": "left___cm/right___cm",
        "foot_rotation": "neutral/left_ER/right_ER"
      },
      "interpretation": {
        "hemispheric_pattern": "Cluster of findings on one side suggests ipsilateral hemispheric/cerebellar dominance",
        "head_tilt_rule": "Head tilt often AWAY from dysfunctional cerebellum (loss of eye intorsion)",
        "right_head_tilt": "Suspect LEFT cerebellar dysfunction",
        "postural_cluster_same_side": "Head tilt, IR shoulder, flexed fingers, increased tone, elevated ribs, reduced costa-ilium, ER foot"
      },
      "notes": "Hemisphericityapproach: asymmetric brain function affects posture. PMRF inhibits ipsilateral SNS, pain, flexors; facilitates extensors."
    },
    {
      "test_id": "sensory_asymmetry",
      "test_name": "Sensory Asymmetry Testing",
      "test_type": "neurological",
      "order": 2,
      "required": true,
      "scoring": {
        "hearing_asymmetry": "none/left_reduced/right_reduced",
        "smell_asymmetry": "none/left_reduced/right_reduced",
        "touch_face": "symmetric/left_reduced/right_reduced",
        "touch_arm": "symmetric/left_reduced/right_reduced"
      },
      "notes": "Sensory asymmetry may indicate hemispheric processing differences"
    },
    {
      "test_id": "muscle_testing_asymmetry",
      "test_name": "Comparative Muscle Strength Testing",
      "test_type": "strength",
      "order": 3,
      "required": true,
      "scoring": {
        "deltoid": "left_5/5_right_5/5 or asymmetric",
        "biceps": "left___/5 right___/5",
        "grip_strength": "left___kg right___kg",
        "quad": "left___/5 right___/5",
        "glut_med": "left___/5 right___/5"
      },
      "notes": "Significant asymmetry (>1 grade) may indicate hemispheric imbalance or local pathology"
    },
    {
      "test_id": "pmrf_output_assessment",
      "test_name": "PMRF Function - Extensor/Flexor Tone",
      "test_type": "neurological",
      "order": 4,
      "required": false,
      "scoring": {
        "extensor_tone_left": "normal/increased/decreased",
        "extensor_tone_right": "normal/increased/decreased",
        "flexor_tone_left": "normal/increased/decreased",
        "flexor_tone_right": "normal/increased/decreased"
      },
      "interpretation": {
        "pmrf_physiology": "PMRF inhibits SNS, inhibits pain, activates extensors, inhibits flexors",
        "ipsilateral_effects": "Dysfunction affects ipsilateral IML below T6, anterior compartment above T6, posterior compartment below T6"
      }
    }
  ]'::jsonb,
  'INDIVIDUAL',
  '{
    "neurophysiology": {
      "cortical_output": "90% of cortex output goes to ipsilateral brainstem (PMRF)",
      "frontal_lobe_areas": {
        "primary_motor": "Execute movements",
        "supplementary_motor": "Plan movements",
        "frontal_eye_field": "Initiates saccades",
        "prefrontal_cortex": "Neural integrator, executive control, inhibiting impulses, limbic reactions, memory"
      },
      "pmrf_functions": {
        "inhibits": ["Sympathetic nervous system", "Pain", "Flexors"],
        "activates": ["Extensors (via vestibulospinal tract)"]
      },
      "pmrf_reticulospinal_output": {
        "inhibits_ipsilateral_IML": true,
        "inhibits_anterior_compartment_above_T6": "ipsilateral",
        "inhibits_posterior_compartment_below_T6": "ipsilateral",
        "facilitates_extensors": "via vestibulospinal tract"
      }
    },
    "clinical_application": "Use postural clustering and asymmetries to identify hemispheric dominance and guide treatment decisions"
  }'::jsonb,
  ARRAY['Functional neurology assessment', 'Hemispheric imbalance', 'Chronic pain', 'Postural dysfunction', 'Treatment planning'],
  'Functional neurology hemisphericityapproach. PMRF physiology and cortical output patterns.',
  'www.theBackROM.com/education/Clickup/hemispheric-balance',
  true, true, true
);

-- Add educational resources for these batteries
INSERT INTO educational_resources (
  resource_type, resource_code, title, description,
  backrom_url, content_type, skill_level, topics, evidence_level, is_active
) VALUES
('BATTERY', 'ACL_BATTERY', 'ACL Injury Assessment Mastery',
 'Comprehensive guide to diagnosing ACL tears using clinical tests. Includes Lachman, Lever Sign, and diagnostic clusters.',
 'www.theBackROM.com/education/Clickup/acl-assessment-mastery',
 'VIDEO', 'INTERMEDIATE',
 ARRAY['ACL diagnosis', 'Knee examination', 'Sports injuries', 'Diagnostic accuracy'],
 'HIGH', true),

('BATTERY', 'MENISCUS_BATTERY', 'Meniscal Tear Clinical Diagnosis',
 'Evidence-based approach to meniscal pathology assessment. Thessaly test, McMurray, and clinical decision making.',
 'www.theBackROM.com/education/Clickup/meniscal-assessment',
 'ARTICLE', 'INTERMEDIATE',
 ARRAY['Meniscal tears', 'Knee pain', 'Joint line tenderness', 'Imaging decisions'],
 'HIGH', true),

('BATTERY', 'VESTIBULAR_MASTERSHEET', 'Vestibular System Assessment Comprehensive Course',
 'Complete vestibular examination protocol including VOR, cerebellar testing, BPPV assessment, and hemispheric balance.',
 'www.theBackROM.com/education/Clickup/vestibular-comprehensive',
 'VIDEO', 'ADVANCED',
 ARRAY['Vestibular system', 'Dizziness', 'Balance disorders', 'Functional neurology', 'Cerebellar function'],
 'HIGH', true),

('BATTERY', 'PRE_ADJUST_SCREEN', 'Cervical Manipulation Safety Protocol',
 'Essential pre-manipulation screening including vertebrobasilar testing, blood pressure, and red flags assessment.',
 'www.theBackROM.com/education/Clickup/cervical-safety-screening',
 'PROTOCOL', 'BEGINNER',
 ARRAY['Patient safety', 'Cervical manipulation', 'VBI screening', 'Risk management'],
 'HIGH', true),

('BATTERY', 'HEMISPHERIC_BALANCE', 'Functional Neurology: Hemispheric Assessment',
 'Advanced functional neurology approach to hemispheric dominance, PMRF physiology, and clinical applications.',
 'www.theBackROM.com/education/Clickup/hemispheric-neurology',
 'VIDEO', 'ADVANCED',
 ARRAY['Functional neurology', 'Hemisphericityassessment', 'PMRF physiology', 'Postural analysis'],
 'MODERATE', true);
