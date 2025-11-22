-- Advanced Vestibular Testing - VNG & Caloric Assessment
-- Equipment-based testing: VNG goggles, RealEyes, Caloric irrigators
-- Norwegian clinical terminology maintained

-- ============================================================================
-- VNG (VIDEONYSTAGMOGRAPHY) COMPREHENSIVE BATTERY
-- ============================================================================

INSERT INTO test_batteries (
  organization_id, name, description, code, target_population, target_body_region,
  estimated_minutes, tests, scoring_method, composite_score_calculation,
  indicated_for, contraindications, reference_citation, educational_link,
  is_system, is_template, is_active
) VALUES (
  NULL,
  'VNG - Videonystagmography Complete Assessment',
  'Comprehensive VNG testing battery including spontaneous nystagmus, gaze testing, saccades, smooth pursuits, and optokinetic nystagmus. Requires VNG equipment with infrared goggles.',
  'VNG_COMPLETE',
  'Vestibular disorders, dizziness, suspected central pathology',
  'Vestibular System',
  45,
  '[
    {
      "test_id": "spontan_nystagmus",
      "test_name": "Spontan Nystagmus (Spontaneous Nystagmus)",
      "test_type": "oculomotor",
      "order": 1,
      "required": true,
      "scoring": {
        "finding": "ua (unremarkable) / present",
        "direction": "horizontal / vertical / rotatory / mixed",
        "side": "høyre (right) / venstre (left)",
        "intensity": "pendler (pendular) / jerk",
        "notes": "text"
      },
      "interpretation": {
        "ua": "Normal - no spontaneous nystagmus",
        "horizontal": "May indicate peripheral vestibular lesion (toward intact side) or central pathology",
        "vertical": "Suggests central pathology",
        "pendular": "May indicate cerebellar or brainstem pathology"
      },
      "notes": "Test in darkness or with eyes closed (VNG goggles). Peripheral nystagmus suppressed by visual fixation."
    },
    {
      "test_id": "gaze_horisontalt",
      "test_name": "Gaze Horisontalt (Horizontal Gaze)",
      "test_type": "oculomotor",
      "order": 2,
      "required": true,
      "scoring": {
        "left_gaze": "ua / drift / jerk / nystagmus",
        "center_gaze": "ua / drift / nystagmus",
        "right_gaze": "ua / drift / jerk / nystagmus",
        "direction_drift": "høyre / venstre / diagonal",
        "gaze_evoked_nystagmus": "absent / present"
      },
      "interpretation": {
        "ua": "Normal gaze holding",
        "drift": "Suggests gaze instability, possible cerebellar dysfunction",
        "gaze_evoked_nystagmus": "Central pathology (brainstem/cerebellum), drug effect, or fatigue"
      },
      "notes": "Patient fixates on target at 30° left, center, 30° right. Observe for 20-30 seconds each position."
    },
    {
      "test_id": "gaze_vertikalt",
      "test_name": "Gaze Vertikalt (Vertical Gaze)",
      "test_type": "oculomotor",
      "order": 3,
      "required": true,
      "scoring": {
        "up_gaze": "ua / drift / nystagmus",
        "center_gaze": "ua / drift",
        "down_gaze": "ua / drift / nystagmus",
        "direction_drift": "up / down / diagonal høyre / diagonal venstre",
        "rebound_nystagmus": "absent / present"
      },
      "interpretation": {
        "upbeat_nystagmus": "Central pathology (cerebellar vermis, medulla)",
        "downbeat_nystagmus": "Cervicomedullary junction lesion, Arnold-Chiari malformation",
        "diagonal_drift": "Combined horizontal and vertical pathology"
      }
    },
    {
      "test_id": "sakkader_horisontalt",
      "test_name": "Sakkader Horisontalt (Horizontal Saccades)",
      "test_type": "oculomotor",
      "order": 4,
      "required": true,
      "scoring": {
        "accuracy": "normal / overshoot / undershoot / catch_up_saccades",
        "velocity": "normal / slow / fast / asymmetric",
        "latency": "normal / increased / decreased",
        "side_asymmetry": "none / høyre slower / venstre slower",
        "symptoms": "none / dizziness / nausea",
        "special_findings": "catch up sakader spess høyre / bilateral"
      },
      "interpretation": {
        "catch_up_saccades": "Dysmetria - cerebellar dysfunction (ipsilateral hemisphere)",
        "slowed_saccades": "Brainstem pathology, progressive supranuclear palsy",
        "overshoot": "Cerebellar hypermetria",
        "undershoot": "Cerebellar hypometria or fatigue"
      },
      "notes": "Patient rapidly shifts gaze between two targets 30° apart. Speed increase reveals dysfunction."
    },
    {
      "test_id": "sakkader_vertikalt",
      "test_name": "Sakkader Vertikalt (Vertical Saccades)",
      "test_type": "oculomotor",
      "order": 5,
      "required": true,
      "scoring": {
        "up_saccades": "normal / catch_up / overshoot",
        "down_saccades": "normal / catch_up / overshoot",
        "velocity_asymmetry": "none / up_slower / down_slower",
        "symptoms_with_speed": "none / dizziness / nausea",
        "special_findings": "catch up sakader spess øker ved fart"
      },
      "interpretation": {
        "upward_limitation": "Midbrain pathology, PSP",
        "downward_limitation": "Dorsal midbrain lesion",
        "catch_up_down": "Cerebellar dysfunction (vermis)",
        "symptoms_with_speed": "Suggests vestibular-visual mismatch or cerebellar compensation limits"
      }
    },
    {
      "test_id": "pursuits_horisontalt",
      "test_name": "Pursuits Horisontalt (Horizontal Smooth Pursuits)",
      "test_type": "oculomotor",
      "order": 6,
      "required": true,
      "scoring": {
        "smoothness": "smooth / saccadic / catch_up_saccades",
        "left_pursuit": "normal / mildt_nedsatt / moderate / severe",
        "right_pursuit": "normal / mildt_nedsatt / moderate / severe",
        "velocity_effect": "none / økende_div_ved_høyre_fart / bilateral_deterioration",
        "gain": "normal (0.8-1.0) / reduced / asymmetric",
        "symptoms": "none / dizziness / nausea"
      },
      "interpretation": {
        "saccadic_pursuits": "Catch-up saccades indicate inability to maintain smooth tracking - cerebellar or brainstem",
        "unilateral_deficit": "Ipsilateral cerebellar hemisphere or brainstem",
        "bilateral_deficit": "Diffuse cerebellar, medication effect, age-related",
        "velocity_dependent": "Compensation limits reached at higher speeds"
      },
      "notes": "Target moves sinusoidally 0.2-0.4 Hz. Increase speed to challenge system. Høyre = right, Venstre = left"
    },
    {
      "test_id": "pursuits_vertikalt",
      "test_name": "Pursuits Vertikalt (Vertical Smooth Pursuits)",
      "test_type": "oculomotor",
      "order": 7,
      "required": true,
      "scoring": {
        "up_pursuit": "smooth / saccadic / mildt_nedsatt",
        "down_pursuit": "smooth / saccadic / mildt_nedsatt",
        "velocity_effect": "none / deterioration_at_speed",
        "asymmetry": "none / up_worse / down_worse",
        "symptoms": "none / dizziness / fatigue"
      },
      "interpretation": {
        "vertical_pursuit_deficit": "Cerebellar vermis, brainstem pathology",
        "upward_deficit": "Dorsal vermis",
        "downward_deficit": "Ventral brainstem"
      }
    },
    {
      "test_id": "opk_horisontalt",
      "test_name": "OPK Horisontalt (Optokinetic Nystagmus Horizontal)",
      "test_type": "oculomotor",
      "order": 8,
      "required": true,
      "scoring": {
        "right_beating_gain": "value (høyre/venstre ratio)",
        "left_beating_gain": "value (høyre/venstre ratio)",
        "gain_høyre": "høyre___/venstre___ (e.g., Hø98/Ve82)",
        "gain_venstre": "høyre___/venstre___ (e.g., Hø75/Ve107)",
        "symmetry": "symmetric / asymmetric",
        "symptoms": "none / dizziness / nausea / feels_chair_tipping",
        "direction_specific": "høyre_becomes_dizzy / venstre / bilateral"
      },
      "interpretation": {
        "asymmetric_gain": ">25% difference suggests unilateral peripheral vestibular or central pathology",
        "reduced_bilateral": "Bilateral vestibular loss, cerebellar disease, visual pathway",
        "symptoms_høyre": "Right-sided vestibular or cerebellar dysfunction",
        "chair_tipping_sensation": "Otolith dysfunction or spatial orientation disturbance"
      },
      "notes": "Rotating stripe pattern. Normal gain 0.3-0.6. Compare left vs right beating responses."
    },
    {
      "test_id": "opk_vertikalt",
      "test_name": "OPK Vertikalt (Optokinetic Nystagmus Vertical)",
      "test_type": "oculomotor",
      "order": 9,
      "required": true,
      "scoring": {
        "upward_beating": "gain_value / symptoms",
        "downward_beating": "gain_value / symptoms",
        "asymmetry": "none / up_reduced / down_reduced",
        "symptoms_up": "none / dizzy / nauseous / tired",
        "symptoms_down": "none / dizzy / better_than_up",
        "direction_nystagmus": "slår_høyre_mot_venstre / other_pattern",
        "special_findings": "opp_kvalm_og_svimmel_plus_gain"
      },
      "interpretation": {
        "upward_deficit": "Dorsal brainstem/midbrain pathology",
        "downward_better": "Common pattern - upward OPK more demanding",
        "fatigue_upward": "Central vestibular system compensation limits",
        "asymmetric_horizontal_component": "Combined horizontal and vertical pathway involvement"
      },
      "notes": "Up = opp, Down = ned. Upward typically more fatiguing. Note any horizontal component."
    }
  ]'::jsonb,
  'INDIVIDUAL',
  '{
    "interpretation_summary": {
      "peripheral_vestibular_pattern": "Spontaneous horizontal nystagmus away from lesion, normal saccades/pursuits, asymmetric OPK",
      "central_cerebellar_pattern": "Catch-up saccades, saccadic pursuits, gaze-evoked nystagmus, vertical nystagmus",
      "brainstem_pattern": "Slowed saccades, vertical gaze limitation, skew deviation, INO patterns",
      "bilateral_vestibular_loss": "No spontaneous nystagmus, symmetric reduced OPK gain, oscillopsia"
    },
    "clinical_correlation": {
      "catch_up_saccades_høyre": "Right cerebellar hemisphere dysfunction (ipsilateral)",
      "pursuit_deterioration_at_speed": "Compensation system overwhelmed - suggests active pathology or incomplete recovery",
      "høyre_drift_diagonal_up": "Right superior cerebellar/brainstem involvement",
      "svimmel_OPK_høyre": "Right vestibular or right cerebellar dysfunction",
      "kvalm_with_gain_increase": "Vestibular-visual mismatch - system overload"
    },
    "norwegian_terminology": {
      "ua": "uauffallende (unremarkable, normal)",
      "høyre": "right (Hø abbreviated)",
      "venstre": "left (Ve abbreviated)",
      "drift": "drift, deviation",
      "pendler": "pendular",
      "jerk": "jerk nystagmus",
      "spess": "especially, particularly (spesielt)",
      "mildt_nedsatt": "mildly reduced",
      "økende_div": "increasing divergence/deterioration",
      "ved_fart": "with speed",
      "kvalm": "nauseous",
      "svimmel": "dizzy",
      "slår": "beats (as in nystagmus direction)",
      "blir_sliten": "becomes tired/fatigued"
    }
  }'::jsonb,
  ARRAY['Dizziness', 'Vertigo', 'Suspected central pathology', 'Cerebellar dysfunction', 'Vestibular disorder differential diagnosis', 'Oscillopsia'],
  ARRAY['Inability to fixate on target', 'Severe photophobia', 'Acute migraine during testing'],
  'Leigh RJ, Zee DS. The Neurology of Eye Movements. Oxford University Press. VNG methodology per manufacturer protocols.',
  'www.theBackROM.com/education/Clickup/vng-complete-assessment',
  true, true, true
);

-- ============================================================================
-- ADVANCED BPPV TESTING WITH REALEYES EQUIPMENT
-- ============================================================================

INSERT INTO test_batteries (
  organization_id, name, description, code, target_population, target_body_region,
  estimated_minutes, tests, scoring_method, composite_score_calculation,
  indicated_for, contraindications, educational_link, is_system, is_template, is_active
) VALUES (
  NULL,
  'BPPV Testing - RealEyes Complete Protocol',
  'Comprehensive BPPV assessment using RealEyes infrared video goggles. Tests all semicircular canals: posterior (Dix-Hallpike), horizontal (Supine Roll/Pagnini-McClure), and anterior (Bow & Lean, Deep Head Hanging).',
  'BPPV_REALEYES',
  'Positional vertigo, suspected BPPV all canals',
  'Vestibular System',
  20,
  '[
    {
      "test_id": "dix_hallpike_høyre",
      "test_name": "Dix-Hallpike Høyre (Right Posterior Canal)",
      "test_type": "positional",
      "order": 1,
      "required": true,
      "scoring": {
        "nystagmus_present": "yes / no",
        "nystagmus_type": "geotorsional / horizontal / vertical / apogeotropic",
        "direction": "up_beating / down_beating / mixed",
        "torsional_component": "present / absent / toward_undermost_ear",
        "latency_seconds": "number (0-30s typical for canalithiasis)",
        "duration_seconds": "number (<60s canalithiasis, sustained cupulolithiasis)",
        "intensity": "mild / moderate / severe",
        "reversal_on_sitting": "yes / no",
        "vertigo_severity": "none / mild / moderate / severe",
        "special_findings": "Hø geo torsjon / other"
      },
      "interpretation": {
        "geotorsional_upbeat_latency_reversal": "Posterior canal BPPV - canalithiasis (most common)",
        "sustained_no_latency": "Cupulolithiasis - otoconia attached to cupula",
        "horizontal_component": "Possible lateral canal involvement",
        "hø_geo_torsjon": "Right posterior canal BPPV confirmed - geotropic torsional nystagmus"
      },
      "treatment": {
        "canalithiasis": "Epley maneuver right side - 1 min each position, 2x daily",
        "video_reference": "https://www.youtube.com/watch?v=aC7x161MHhU"
      },
      "notes": "Patient seated, turn head 45° right, rapidly recline to head hanging 20° below horizontal. Observe for 30-60 seconds."
    },
    {
      "test_id": "dix_hallpike_venstre",
      "test_name": "Dix-Hallpike Venstre (Left Posterior Canal)",
      "test_type": "positional",
      "order": 2,
      "required": true,
      "scoring": {
        "nystagmus_present": "yes / no",
        "nystagmus_type": "geotorsional / horizontal / vertical",
        "latency_seconds": "number",
        "duration_seconds": "number",
        "reversal_on_sitting": "yes / no",
        "vertigo_severity": "none / mild / moderate / severe"
      },
      "treatment": {
        "canalithiasis": "Epley maneuver left side",
        "video_reference": "https://www.youtube.com/watch?v=aC7x161MHhU"
      }
    },
    {
      "test_id": "supine_roll_høyre",
      "test_name": "Supine Roll Test Høyre (Right Lateral Canal)",
      "test_type": "positional",
      "order": 3,
      "required": true,
      "scoring": {
        "nystagmus_present": "yes / no",
        "nystagmus_direction": "geotropic / apogeotropic",
        "horizontal_component": "hø_hor (right horizontal) / venstre / mixed",
        "intensity_comparison": "stronger_right / stronger_left / equal",
        "latency_seconds": "number",
        "duration_seconds": "number",
        "vertigo": "none / mild / moderate / severe",
        "special_findings": "hø hor confirmed"
      },
      "interpretation": {
        "geotropic_stronger_right": "Right lateral canal BPPV - canalithiasis",
        "geotropic_stronger_left": "Left lateral canal BPPV - canalithiasis",
        "apogeotropic_stronger_right": "Left lateral canal cupulolithiasis (affected ear has weaker response)",
        "apogeotropic_stronger_left": "Right lateral canal cupulolithiasis",
        "hø_hor": "Right horizontal canal involvement confirmed"
      },
      "treatment": {
        "right_geotropic": "BBQ roll right - 30 sec each position, 2x daily",
        "video_reference": "https://www.youtube.com/watch?v=KNBOASk7Ny8",
        "alternative": "Gufoni maneuver"
      },
      "notes": "Patient supine, rapidly turn head 90° to right. Geotropic = beats toward ground."
    },
    {
      "test_id": "supine_roll_venstre",
      "test_name": "Supine Roll Test Venstre (Left Lateral Canal)",
      "test_type": "positional",
      "order": 4,
      "required": true,
      "scoring": {
        "nystagmus_present": "yes / no",
        "nystagmus_direction": "geotropic / apogeotropic",
        "intensity_comparison": "stronger_right / stronger_left / equal",
        "latency_seconds": "number",
        "duration_seconds": "number"
      },
      "treatment": {
        "left_geotropic": "BBQ roll left - 30 sec each position, 2x daily",
        "video_reference": "https://www.youtube.com/watch?v=KNBOASk7Ny8"
      }
    },
    {
      "test_id": "foroverbøy_anterior",
      "test_name": "Foroverbøy / Deep Head Hanging (Anterior Canal)",
      "test_type": "positional",
      "order": 5,
      "required": false,
      "scoring": {
        "nystagmus_present": "yes / no",
        "nystagmus_direction": "down_beating / up_beating",
        "torsional_component": "present / absent",
        "side_determination": "høyre / venstre / unclear",
        "vertigo": "none / mild / moderate / severe"
      },
      "interpretation": {
        "down_beating_nystagmus": "Anterior canal BPPV (rare, <1% of BPPV cases)",
        "up_beating_may_be": "Posterior canal variant or central pathology"
      },
      "treatment": {
        "anterior_canal": "Deep head hanging maneuver, reverse Epley, or liberatory maneuver",
        "referral": "Consider ENT/vestibular specialist - anterior canal BPPV rare and challenging"
      },
      "notes": "Patient supine, head extended 20° below horizontal OR seated forward flexion. Anterior canal BPPV very rare."
    },
    {
      "test_id": "bow_and_lean",
      "test_name": "Bow and Lean Test",
      "test_type": "positional",
      "order": 6,
      "required": false,
      "scoring": {
        "bow_position_nystagmus": "down_beating / up_beating / none",
        "lean_position_nystagmus": "down_beating / up_beating / none",
        "pattern": "bow_down_lean_up / bow_up_lean_down / other"
      },
      "interpretation": {
        "bow_down_lean_up": "Anterior canal BPPV",
        "bow_up_lean_down": "Posterior canal BPPV variant",
        "inconsistent": "May be central or mixed canal involvement"
      },
      "notes": "Bow: seated, flex head down. Lean: seated, extend head back. Compare nystagmus direction."
    }
  ]'::jsonb,
  'INDIVIDUAL',
  '{
    "treatment_algorithms": {
      "posterior_canal_canalithiasis": {
        "maneuver": "Epley (canalith repositioning)",
        "duration": "1 minute each position",
        "frequency": "2x daily until resolved",
        "positions": ["Dix-Hallpike position", "Turn head 90° opposite", "Roll to side-lying", "Sit up"],
        "precautions": "Sleep elevated 45° first night, avoid provocative positions 48h"
      },
      "lateral_canal_geotropic": {
        "maneuver": "BBQ Roll (360° rotation) or Gufoni",
        "duration": "30 seconds each position",
        "frequency": "2x daily",
        "direction": "Rotate toward unaffected ear",
        "alternative": "Forced prolonged position (affected ear up)"
      },
      "lateral_canal_apogeotropic": {
        "maneuver": "Head-shaking + Gufoni (reverse direction)",
        "note": "More challenging - may need multiple sessions",
        "conversion": "May convert to geotropic after head-shaking, then treat as geotropic"
      },
      "anterior_canal": {
        "maneuver": "Deep head hanging, reverse Epley, or liberatory",
        "note": "Very rare (<1%), often misdiagnosed as posterior canal",
        "referral": "Consider specialist vestibular therapy"
      }
    },
    "video_resources": {
      "epley_maneuver": "https://www.youtube.com/watch?v=aC7x161MHhU",
      "bbq_roll": "https://www.youtube.com/watch?v=KNBOASk7Ny8"
    },
    "realeyes_advantages": {
      "infrared_vision": "Allows observation without visual fixation suppression",
      "video_recording": "Documents nystagmus for review and comparison",
      "accurate_assessment": "Superior to Frenzel goggles for subtle nystagmus detection",
      "patient_education": "Can show patient their own nystagmus"
    }
  }'::jsonb,
  ARRAY['BPPV all canals', 'Positional vertigo', 'Suspected anterior canal BPPV', 'Failed previous BPPV treatment'],
  ARRAY['Severe cervical stenosis', 'Carotid artery disease', 'Severe kyphosis limiting positioning', 'Acute neck trauma'],
  'www.theBackROM.com/education/Clickup/bppv-realeyes-complete',
  true, true, true
);

-- ============================================================================
-- CALORIC TESTING PROTOCOL
-- ============================================================================

INSERT INTO test_batteries (
  organization_id, name, description, code, target_population, target_body_region,
  estimated_minutes, tests, scoring_method, composite_score_calculation,
  indicated_for, contraindications, reference_citation, educational_link,
  is_system, is_template, is_active
) VALUES (
  NULL,
  'Caloric Testing - Bithermal Caloric Test',
  'Gold standard vestibular function test. Irrigates each ear with warm (44°C) and cold (30°C) water to stimulate horizontal semicircular canals. Assesses peripheral vestibular function and identifies unilateral weakness or directional preponderance.',
  'CALORIC_BITHERMAL',
  'Vestibular hypofunction, asymmetric vestibular loss, Meniere disease, vestibular neuritis',
  'Vestibular System',
  60,
  '[
    {
      "test_id": "caloric_right_warm",
      "test_name": "Høyre Øre Varmt Vann (Right Ear Warm Water 44°C)",
      "test_type": "caloric",
      "order": 1,
      "required": true,
      "scoring": {
        "irrigation_temp": "44°C",
        "irrigation_duration": "30_seconds (standard) / 40_seconds / 60_seconds",
        "peak_velocity": "degrees_per_second (SPV)",
        "nystagmus_direction": "left_beating (expected for right warm)",
        "duration_nystagmus": "seconds",
        "vertigo_intensity": "none / mild / moderate / severe / nausea",
        "abnormal_response": "none / reduced / absent / hyperactive",
        "notes": "text"
      },
      "expected": {
        "normal_response": "Left-beating nystagmus (COWS: Cold Opposite, Warm Same)",
        "peak_velocity": "15-60 deg/sec typical",
        "duration": "90-180 seconds"
      },
      "interpretation": {
        "reduced_absent": "Right peripheral vestibular weakness",
        "hyperactive": "Possible irritative lesion or central compensation"
      }
    },
    {
      "test_id": "caloric_left_warm",
      "test_name": "Venstre Øre Varmt Vann (Left Ear Warm Water 44°C)",
      "test_type": "caloric",
      "order": 2,
      "required": true,
      "scoring": {
        "irrigation_temp": "44°C",
        "peak_velocity": "degrees_per_second",
        "nystagmus_direction": "right_beating (expected)",
        "duration_nystagmus": "seconds",
        "vertigo_intensity": "none / mild / moderate / severe / nausea",
        "abnormal_response": "none / reduced / absent / hyperactive"
      },
      "expected": {
        "normal_response": "Right-beating nystagmus",
        "peak_velocity": "15-60 deg/sec"
      }
    },
    {
      "test_id": "caloric_right_cold",
      "test_name": "Høyre Øre Kaldt Vann (Right Ear Cold Water 30°C)",
      "test_type": "caloric",
      "order": 3,
      "required": true,
      "scoring": {
        "irrigation_temp": "30°C",
        "peak_velocity": "degrees_per_second",
        "nystagmus_direction": "right_beating (expected for right cold)",
        "duration_nystagmus": "seconds",
        "vertigo_intensity": "none / mild / moderate / severe / nausea",
        "abnormal_response": "none / reduced / absent / hyperactive"
      },
      "expected": {
        "normal_response": "Right-beating nystagmus (COWS: Cold Opposite)",
        "peak_velocity": "15-60 deg/sec"
      }
    },
    {
      "test_id": "caloric_left_cold",
      "test_name": "Venstre Øre Kaldt Vann (Left Ear Cold Water 30°C)",
      "test_type": "caloric",
      "order": 4,
      "required": true,
      "scoring": {
        "irrigation_temp": "30°C",
        "peak_velocity": "degrees_per_second",
        "nystagmus_direction": "left_beating (expected)",
        "duration_nystagmus": "seconds",
        "vertigo_intensity": "none / mild / moderate / severe / nausea",
        "abnormal_response": "none / reduced / absent / hyperactive"
      },
      "expected": {
        "normal_response": "Left-beating nystagmus",
        "peak_velocity": "15-60 deg/sec"
      }
    }
  ]'::jsonb,
  'COMPOSITE',
  '{
    "formulas": {
      "unilateral_weakness": {
        "formula": "UW = [(RC + RW) - (LC + LW)] / (RC + RW + LC + LW) × 100",
        "variables": {
          "RC": "Right Cold peak velocity",
          "RW": "Right Warm peak velocity",
          "LC": "Left Cold peak velocity",
          "LW": "Left Warm peak velocity"
        },
        "normal": "<25% difference",
        "significant": "≥25% indicates unilateral weakness on that side",
        "severe": "≥50% marked unilateral weakness"
      },
      "directional_preponderance": {
        "formula": "DP = [(RW + LC) - (LW + RC)] / (RW + LC + LW + RC) × 100",
        "interpretation": {
          "normal": "<30% difference",
          "significant": "≥30% suggests central imbalance or incomplete peripheral compensation"
        }
      }
    },
    "caloric_equation_jongkees": "Standard calculation for UW and DP",
    "cows_mnemonic": "Cold Opposite, Warm Same (direction of nystagmus relative to irrigated ear)",
    "interpretation_guide": {
      "bilateral_weakness": "Both ears <10 deg/sec response - bilateral vestibular loss",
      "unilateral_weakness": "≥25% asymmetry - peripheral vestibular lesion on weaker side",
      "hyperactive_response": ">100 deg/sec - may indicate central pathology or compensation",
      "no_response_one_ear": "Dead labyrinth - complete unilateral vestibular loss",
      "directional_preponderance_only": "Central imbalance or brainstem lesion"
    },
    "common_diagnoses": {
      "vestibular_neuritis": "Marked unilateral weakness (50-100%), normal directional",
      "menieres_disease": "Variable unilateral weakness (25-70%), may fluctuate",
      "labyrinthitis": "Unilateral weakness + hearing loss",
      "bilateral_vestibulopathy": "Bilateral reduced responses <10 deg/sec",
      "central_lesion": "Normal UW but significant DP, or paradoxical responses"
    }
  }'::jsonb,
  ARRAY['Vertigo', 'Asymmetric vestibular function', 'Vestibular neuritis', 'Meniere disease', 'Bilateral vestibulopathy', 'Pre-operative vestibular assessment'],
  ARRAY['Perforated tympanic membrane', 'Acute otitis media', 'Cerumen impaction (remove first)', 'Mastoid surgery with open cavity', 'Severe nausea/vomiting disorder'],
  'Jongkees LBW, et al. (1962). Clinical Nystagmography. Pract Otorhinolaryngol. Standard bithermal caloric testing methodology.',
  'www.theBackROM.com/education/Clickup/caloric-testing',
  true, true, true
);

-- ============================================================================
-- HOME EXERCISE PRESCRIPTION TEMPLATES
-- ============================================================================

-- Add treatment protocols as educational resources
INSERT INTO educational_resources (
  resource_type, resource_code, title, description,
  backrom_url, video_url, content_type, skill_level, topics, evidence_level, is_active
) VALUES
('TREATMENT', 'EPLEY_RIGHT', 'Epley Maneuver - Right Posterior Canal',
 'Canalith repositioning for right posterior canal BPPV. 1 minute each position, 2x daily.',
 'www.theBackROM.com/education/Clickup/epley-maneuver',
 'https://www.youtube.com/watch?v=aC7x161MHhU',
 'VIDEO', 'BEGINNER',
 ARRAY['BPPV', 'Epley maneuver', 'Posterior canal', 'Home exercises'],
 'HIGH', true),

('TREATMENT', 'EPLEY_LEFT', 'Epley Maneuver - Left Posterior Canal',
 'Canalith repositioning for left posterior canal BPPV. 1 minute each position, 2x daily.',
 'www.theBackROM.com/education/Clickup/epley-maneuver',
 'https://www.youtube.com/watch?v=aC7x161MHhU',
 'VIDEO', 'BEGINNER',
 ARRAY['BPPV', 'Epley maneuver', 'Posterior canal', 'Home exercises'],
 'HIGH', true),

('TREATMENT', 'BBQ_ROLL_RIGHT', 'BBQ Roll - Right Lateral Canal',
 '360° log roll for right lateral canal BPPV. 30 seconds each position, 2x daily.',
 'www.theBackROM.com/education/Clickup/bbq-roll',
 'https://www.youtube.com/watch?v=KNBOASk7Ny8',
 'VIDEO', 'BEGINNER',
 ARRAY['BPPV', 'BBQ roll', 'Lateral canal', 'Home exercises'],
 'HIGH', true),

('TREATMENT', 'BBQ_ROLL_LEFT', 'BBQ Roll - Left Lateral Canal',
 '360° log roll for left lateral canal BPPV. 30 seconds each position, 2x daily.',
 'www.theBackROM.com/education/Clickup/bbq-roll',
 'https://www.youtube.com/watch?v=KNBOASk7Ny8',
 'VIDEO', 'BEGINNER',
 ARRAY['BPPV', 'BBQ roll', 'Lateral canal', 'Home exercises'],
 'HIGH', true),

('BATTERY', 'VNG_COMPLETE', 'VNG Testing Complete Course',
 'Comprehensive videonystagmography interpretation including spontaneous nystagmus, gaze testing, saccades, pursuits, and OPK. Equipment setup, patient positioning, and clinical correlation.',
 'www.theBackROM.com/education/Clickup/vng-complete',
 NULL, 'VIDEO', 'ADVANCED',
 ARRAY['VNG', 'Oculomotor testing', 'Vestibular assessment', 'Dizziness diagnosis', 'Central vs peripheral'],
 'HIGH', true),

('BATTERY', 'CALORIC_BITHERMAL', 'Caloric Testing - Technique & Interpretation',
 'Bithermal caloric testing protocol: patient preparation, irrigation technique, response measurement, UW/DP calculations, and clinical interpretation of results.',
 'www.theBackROM.com/education/Clickup/caloric-testing',
 NULL, 'PROTOCOL', 'ADVANCED',
 ARRAY['Caloric testing', 'Vestibular function', 'Peripheral vestibular loss', 'Jongkees formula'],
 'HIGH', true);
