-- Systemic Clinical Templates
-- Comprehensive systemic examination protocols and condition-specific templates
-- Based on clinical reference materials for chiropractic and allied health practice

-- ============================================================================
-- SYSTEMIC EXAM FLOW (General Examination Protocol)
-- ============================================================================

SELECT insert_template('Systemics', 'Exam Flow', 'Complete Systemic Exam Protocol',
'SYSTEMIC EXAMINATION PROTOCOL

VITALS:
- Temperature: ____°C (normal 37°C / 98.6°F)
- Pulse: ____ bpm (normal 60-100 bpm)
- Respiration: ____ bpm (normal 12-20 bpm)
- BP bilateral: Right ____/____ mmHg, Left ____/____ mmHg (normal <120/80 mmHg)
- Skin observation: ____

STANDING:
- Height: ____ cm, Weight: ____ kg, BMI: ____
- Snellen chart: ____
- Posture & gait observation: ____
- Heel walk: ____, Toe walk: ____
- Spinal ROM: ____

SEATED (Cranial Nerve Exam):
- CN I (Olfactory): Smell ____
- CN II (Optic): Peripheral vision ____
- CN III, IV, VI: Cardinal fields of gaze ____
- CN III: Accommodation ____
- CN VII (Facial): Facial expression ____
- CN XII (Hypoglossal): Tongue protrusion ____
- CN XI (Accessory): Trapezius/SCM strength ____
- CN VIII (Vestibulocochlear): Hearing ____
- CN II, III: Consensual light reflex ____
- CN IX, X (Glossopharyngeal/Vagus): Say "ahhh" ____
- CN V (Trigeminal): Bite strength ____

NEUROLOGIC UPPER EXTREMITY:
Sensory:
- Light touch face/arms: ____
- Sharp/dull discrimination: ____
- Vibration (DIP 3rd digit): ____

DTR:
- Biceps (C5): ____
- Brachioradialis (C6): ____
- Triceps (C7): ____

Motor:
- Deltoid (C5-C6): ____
- Biceps (C5-C6): ____
- Triceps (C6-C8, T1): ____
- Wrist extensors (C6-C8): ____
- Wrist flexors (C6-C7): ____
- Finger flexors (C7-T1): ____
- Interossei (C8-T1): ____

THORAX:
- Lung percussion: ____
- Respiratory excursion: ____
- Lung auscultation: ____
- Heart auscultation: ____
- Carotid auscultation: ____

ABDOMINAL EXAM:
- Inspection: ____
- Auscultation: ____
- Percussion: ____
- Palpation: ____
- Inguinal lymph nodes: ____
- Abdominal reflex: ____

LOWER EXTREMITY:
- Foot inspection: ____
- Foot temperature: ____
- Dorsalis pedis pulse: ____
- Posterior tibial pulse: ____
- Leg length evaluation: ____

NEUROLOGIC LOWER EXTREMITY:
Sensory:
- Light touch: ____
- Sharp/dull: ____
- Vibration (DIP 3rd toe): ____
- Babinski: ____

DTR:
- Patellar (L4): ____
- Hamstring (L5): ____
- Achilles (S1): ____

Motor:
- Tibialis anterior (L4-L5): ____
- Extensor hallucis longus (L4-S1): ____
- Peroneus longus (L5-S1): ____', 'objective');

SELECT insert_template('Systemics', 'Exam Flow', 'Quick Systemic Screen',
'QUICK SYSTEMIC SCREEN

Vitals: T ____, P ____, R ____, BP ____/____
General appearance: ____
HEENT: ____
Cardiovascular: ____
Respiratory: ____
Abdominal: ____
Neurological: ____
Musculoskeletal: ____
Skin: ____

Red flags assessed: None identified / ____', 'objective');

-- ============================================================================
-- ABDOMINAL AORTIC ANEURYSM (AAA)
-- ============================================================================

SELECT insert_template('Systemics', 'AAA', 'AAA Risk Assessment',
'ABDOMINAL AORTIC ANEURYSM RISK ASSESSMENT

Risk Factors Present:
- Age >50: Yes/No
- Male gender: Yes/No
- Smoking history: Yes/No
- Hypertension: Yes/No
- Atherosclerosis: Yes/No
- COPD: Yes/No
- Family history of AAA: Yes/No
- Popliteal artery aneurysm: Yes/No

Symptoms:
- Back pain (70% of symptomatic): ____
- Abdominal pain (58%): ____
- Syncope (30%): ____
- Vomiting (22%): ____
- Groin pain: ____

Classic Triad (indicates rupture):
- Hypotension (<80 mmHg systolic): Yes/No
- Pulsatile abdominal mass: Yes/No
- Flank or back pain: Yes/No

Physical Examination:
- Abdominal palpation: ____
- Aortic pulse diameter: ____ cm (normal 2.5-4.0 cm)
- Pulse character: Normal / Prolonged & shallow (pulsus tardus)
- Abdominal bruit: Present/Absent

RECOMMENDATION: ____
- If suspected: Immediate referral for ultrasound & surgical consultation', 'objective');

SELECT insert_template('Systemics', 'AAA', 'AAA Positive Findings',
'AAA FINDINGS - URGENT REFERRAL REQUIRED

Positive findings for possible Abdominal Aortic Aneurysm:
- Pulsatile abdominal mass detected above umbilicus
- Aortic pulse diameter: ____ cm (>3.0 cm abnormal)
- Associated symptoms: ____

Risk stratification based on size:
- <4.5 cm: Follow-up ultrasound every 6 months
- 4.5-5 cm (10-25% rupture risk): Ultrasound every 3-6 months
- >5 cm: Surgical repair indicated

IMMEDIATE ACTION: Patient referred for vascular ultrasound and surgical consultation.
Referral made to: ____
Date of referral: ____', 'assessment');

-- ============================================================================
-- ALZHEIMER'S DISEASE
-- ============================================================================

SELECT insert_template('Systemics', 'Alzheimers', 'Mini-Mental Status Exam (MMSE)',
'MINI-MENTAL STATUS EXAMINATION (MMSE)

ORIENTATION (10 points):
Time orientation (5 points):
- Year: ____
- Season: ____
- Date: ____
- Day: ____
- Month: ____
Score: ____/5

Place orientation (5 points):
- State/Country: ____
- County/Town: ____
- Hospital/Building: ____
- Floor: ____
Score: ____/5

REGISTRATION (3 points):
Name 3 objects, ask patient to repeat:
Objects used: ____
Number of trials needed: ____
Score: ____/3

ATTENTION & CALCULATION (5 points):
Serial 7s (100-7=93-7=86-7=79-7=72-7=65): ____
OR Spell "WORLD" backwards: ____
Score: ____/5

RECALL (3 points):
Ask patient to name the 3 objects from registration:
Score: ____/3

LANGUAGE (9 points):
- Naming (pencil, watch): ____/2
- Repetition ("No ifs, ands, or buts"): ____/1
- 3-stage command: ____/3
- Reading ("Close your eyes"): ____/1
- Writing (sentence): ____/1
- Copying (intersecting pentagons): ____/1
Score: ____/9

TOTAL SCORE: ____/30

Interpretation:
- 24-30: Normal
- 20-23: Mild cognitive impairment
- 10-19: Moderate cognitive impairment
- <10: Severe cognitive impairment
- Score <24 indicates dementia

Level of consciousness: Alert / Drowsy / Stuporous / Comatose', 'objective');

SELECT insert_template('Systemics', 'Alzheimers', 'Alzheimers Assessment',
'ALZHEIMER''S DISEASE ASSESSMENT

History:
- Insidious onset of memory loss: Yes/No
- Duration of symptoms: ____
- Progressive worsening: Yes/No
- Language disorders: Yes/No
- Visuospatial impairment: Yes/No
- Executive function impairment: Yes/No

Behavioral Changes:
- Depression: Yes/No
- Anxiety: Yes/No
- Bizarre behavior: Yes/No
- Lack of initiative: Yes/No
- Loss of interest: Yes/No
- Irritability: Yes/No
- Easy mood swings: Yes/No

ADL Assessment:
- Self-care: Independent / Assisted / Dependent
- Eating: Independent / Assisted / Dependent
- Money management: Intact / Impaired
- Getting lost: Yes/No
- Confusion episodes: Yes/No

MMSE Score: ____/30

Differential diagnoses ruled out:
- Cerebrovascular disease: ____
- B12 deficiency: ____
- Thyroid disease: ____
- Syphilis: ____
- Space-occupying lesion: ____
- Depression: ____
- Polypharmacy: ____

ASSESSMENT: ____
PLAN: ____', 'assessment');

-- ============================================================================
-- ANKYLOSING SPONDYLITIS
-- ============================================================================

SELECT insert_template('Systemics', 'Ankylosing Spondylitis', 'AS Assessment',
'ANKYLOSING SPONDYLITIS ASSESSMENT

History (Inflammatory Back Pain Criteria):
- Age of onset <40 years: Yes/No
- Insidious onset: Yes/No
- Duration >3 months: Yes/No
- Morning stiffness >30 minutes: Yes/No
- Improves with activity: Yes/No
- Worse with rest/inactivity: Yes/No
- Better after hot shower: Yes/No
- Ascending pattern (lumbar→thoracic→cervical): Yes/No
- Night pain: Yes/No

Physical Examination:
Inspection:
- Hypolordosis lumbar spine: Yes/No
- Posterior pelvic tilt: Yes/No
- Thoracic hyperkyphosis: Yes/No
- Forward head posture: Yes/No

ROM:
- Lumbar flexion: ____ (Schober''s test: ____ cm, normal >15cm)
- Lumbar extension: ____
- Lumbar lateral flexion: ____
- Cervical ROM: ____
- Chest expansion: ____ cm (normal >5 cm)

Palpation:
- SI joint tenderness: Yes/No
- Spine percussion tenderness: Yes/No

Special Tests:
- Schober''s Test: Positive/Negative (decrease indicates positive)
- SI joint spring test: Positive/Negative

Extra-articular Manifestations:
- Uveitis/iritis: Yes/No
- Aortic insufficiency: Yes/No
- Pulmonary fibrosis: Yes/No

Laboratory (if available):
- HLA-B27: Positive/Negative
- ESR: ____
- CRP: ____

ASSESSMENT: Findings consistent with / suggestive of / not consistent with Ankylosing Spondylitis
PLAN: ____', 'assessment');

SELECT insert_template('Systemics', 'Ankylosing Spondylitis', 'AS Positive Findings',
'ANKYLOSING SPONDYLITIS - POSITIVE FINDINGS

Clinical presentation consistent with inflammatory spondyloarthropathy:
- Inflammatory back pain pattern present
- Morning stiffness duration: ____ minutes
- Schober''s test: ____ cm (reduced)
- Chest expansion: ____ cm (reduced)
- SI joint tenderness: Bilateral/Unilateral

X-ray findings (if available):
- Sacroiliitis: Present/Absent
- Syndesmophytes: Present/Absent
- Bamboo spine appearance: Present/Absent
- Vertebral squaring: Present/Absent

HLA-B27 status: Positive/Negative/Unknown

ASSESSMENT: Clinical presentation consistent with Ankylosing Spondylitis
RECOMMENDATIONS:
1. Rheumatology referral for confirmation and management
2. Physical therapy for mobility maintenance
3. Daily ROM exercises and deep breathing exercises
4. Sleep on firm mattress, maintain good posture
5. Consider aquatic therapy/swimming', 'assessment');

-- ============================================================================
-- BIPOLAR DISORDER
-- ============================================================================

SELECT insert_template('Systemics', 'Bipolar Disorder', 'Bipolar Screening',
'BIPOLAR DISORDER SCREENING

Current Phase: Manic / Depressive / Euthymic / Mixed

MANIC SYMPTOMS (3+ required during mood disturbance):
- Inflated self-esteem/grandiosity: Yes/No
- Decreased need for sleep: Yes/No
- More talkative than usual/pressure to talk: Yes/No
- Flight of ideas/racing thoughts: Yes/No
- Distractibility: Yes/No
- Increased goal-directed activity/psychomotor agitation: Yes/No
- Excessive involvement in risky activities: Yes/No

Duration of manic episode: ____
Functional impairment: Mild / Moderate / Severe
Hospitalization required: Yes/No
Psychotic features present: Yes/No

DEPRESSIVE SYMPTOMS:
- Depressed mood: Yes/No
- Loss of interest/pleasure: Yes/No
- Sleep changes: Yes/No
- Appetite/weight changes: Yes/No
- Psychomotor agitation/retardation: Yes/No
- Fatigue: Yes/No
- Feelings of worthlessness/guilt: Yes/No
- Difficulty concentrating: Yes/No
- Suicidal ideation: Yes/No

Duration of depressive episode: ____

Physical Observations:
Depressive phase: Slouching posture / Fatigued / Monotone voice / Poor hygiene
Manic phase: Hyperactive / Restless / Energized / Rapid speech / Bright clothing

CLASSIFICATION:
- Bipolar I (full manic episodes): ____
- Bipolar II (hypomanic + major depressive): ____
- Cyclothymia (chronic fluctuating): ____
- Rapid cycling (4+ episodes/year): ____

SUICIDE RISK ASSESSMENT: Low / Moderate / High
REFERRAL: Psychiatry consultation recommended', 'assessment');

-- ============================================================================
-- CHRONIC FATIGUE SYNDROME
-- ============================================================================

SELECT insert_template('Systemics', 'CFS', 'CFS Diagnostic Criteria',
'CHRONIC FATIGUE SYNDROME ASSESSMENT

MAJOR CRITERIA (Must have both):
1. Unexplained fatigue >6 months duration: Yes/No
   - Recent onset (not lifelong): Yes/No
   - Not relieved by rest: Yes/No
   - Substantial reduction in activity level: Yes/No

SYMPTOM CRITERIA (4+ required):
- Post-exertional malaise >24 hours: Yes/No (80%)
- Unrefreshing sleep: Yes/No (76%)
- Short-term memory impairment: Yes/No
- Concentration difficulties: Yes/No
- Sore throat: Yes/No
- Tender lymph nodes: Yes/No (30%)
- Muscle pain (myalgia): Yes/No (90%)
- Multi-joint pain without swelling: Yes/No (40%)
- New headache pattern: Yes/No (76%)
- Photophobia: Yes/No (76%)
- Depression: Yes/No (40%)
- Mood swings: Yes/No (90%)
- Chest pain/palpitations: Yes/No (30%)

Symptom count: ____/13

Physical Examination:
- Temperature: ____ (may have low-grade fever 37.6-38°C)
- Oropharynx: Normal / Crimson anterior tonsillar pillars
- Lymph nodes: Normal / Small, moveable, painless (cervical/axillary)
- Tender points: ____/18 (if >11, consider fibromyalgia)
- ESR: ____ (typically very low, 0-3 mm/h in CFS)

Rule out secondary causes:
- Hypothyroidism: ____
- Chronic anemia: ____
- Autoimmune disease: ____
- Chronic infection: ____
- Sleep apnea: ____
- Substance abuse: ____
- Psychiatric disorder: ____

DIAGNOSIS: CFS confirmed / Idiopathic chronic fatigue / Alternative diagnosis
PLAN: ____', 'assessment');

-- ============================================================================
-- COMPLEX REGIONAL PAIN SYNDROME (CRPS)
-- ============================================================================

SELECT insert_template('Systemics', 'CRPS', 'CRPS Assessment',
'COMPLEX REGIONAL PAIN SYNDROME ASSESSMENT

Type: CRPS-1 (RSD) / CRPS-2 (Causalgia with nerve injury)

DIAGNOSTIC CRITERIA:

Initiating Event:
- Noxious event or immobilization: Yes/No
- Known nerve injury (Type 2): Yes/No
- Date of initiating event: ____

Pain Characteristics:
- Continuing pain: Yes/No
- Allodynia (pain from non-painful stimulus): Yes/No
- Hyperalgesia (exaggerated pain response): Yes/No
- Pain disproportionate to inciting event: Yes/No
- Pain distribution: ____

Autonomic Signs (must have evidence at some time):
- Edema: Yes/No
- Skin blood flow changes: Yes/No
- Skin color changes: Yes/No
- Temperature asymmetry: Yes/No
- Abnormal sweating: Yes/No

STAGE ASSESSMENT:
Stage 1 (1-3 months):
- Severe burning/aching pain: Yes/No
- Joint stiffness: Yes/No
- Accelerated hair/nail growth: Yes/No
- Vasospasm with color/temp changes: Yes/No

Stage 2 (3-6 months):
- Expanding edema: Yes/No
- Slowing hair growth: Yes/No
- Brittle nails: Yes/No
- Muscle atrophy: Yes/No
- Joint stiffening: Yes/No
- Osteoporosis developing: Yes/No

Stage 3 (>6 months):
- Irreversible skin/bone changes: Yes/No
- Constant pain spreading proximally: Yes/No
- Severe muscle atrophy: Yes/No
- Tendon contractures: Yes/No

Current stage: 1 / 2 / 3

Physical Examination:
Affected limb: ____
- Temperature comparison: ____ (hot/cool vs. unaffected)
- Color: ____
- Edema: Present/Absent
- Skin texture: ____
- Hair/nail changes: ____
- ROM: ____
- Capillary refill: ____
- Allodynia test: Positive/Negative
- Cold water immersion response: Normal / Increased pain

ASSESSMENT: Findings consistent with CRPS Type ____
PLAN: Pain management referral, early mobilization, sympathetic block consideration', 'assessment');

-- ============================================================================
-- DEPRESSION
-- ============================================================================

SELECT insert_template('Systemics', 'Depression', 'Depression Screening PHQ-9',
'DEPRESSION SCREENING (PHQ-9 Criteria)

Over the past 2 weeks, how often have you been bothered by:

1. Little interest or pleasure in doing things:
   0=Not at all, 1=Several days, 2=More than half, 3=Nearly every day
   Score: ____

2. Feeling down, depressed, or hopeless:
   Score: ____

3. Trouble falling/staying asleep, or sleeping too much:
   Score: ____

4. Feeling tired or having little energy:
   Score: ____

5. Poor appetite or overeating:
   Score: ____

6. Feeling bad about yourself (failure, let family down):
   Score: ____

7. Trouble concentrating (reading, watching TV):
   Score: ____

8. Moving/speaking slowly OR being fidgety/restless:
   Score: ____

9. Thoughts of being better off dead or hurting yourself:
   Score: ____

TOTAL SCORE: ____/27

Interpretation:
- 0-4: Minimal depression
- 5-9: Mild depression
- 10-14: Moderate depression
- 15-19: Moderately severe depression
- 20-27: Severe depression

Duration of symptoms: ____
Functional impairment: Mild / Moderate / Severe

SUICIDE RISK:
- Current suicidal ideation: Yes/No
- Plan: Yes/No
- Means: Yes/No
- Prior attempts: Yes/No

IMMEDIATE ACTION REQUIRED: Yes/No
REFERRAL: Mental health / Psychiatry / Emergency services', 'assessment');

SELECT insert_template('Systemics', 'Depression', 'Depression Assessment Complete',
'MAJOR DEPRESSIVE DISORDER ASSESSMENT

DSM-5 Criteria (5+ symptoms for 2+ weeks, including #1 or #2):
1. Depressed mood most of day: Yes/No
2. Markedly diminished interest/pleasure: Yes/No
3. Significant weight loss/gain or appetite change: Yes/No
4. Insomnia or hypersomnia: Yes/No
5. Psychomotor agitation or retardation: Yes/No
6. Fatigue or loss of energy: Yes/No
7. Feelings of worthlessness or excessive guilt: Yes/No
8. Diminished concentration or indecisiveness: Yes/No
9. Recurrent thoughts of death or suicide: Yes/No

Symptoms count: ____/9 (need 5+ including 1 or 2)
Functional impairment: Present/Absent

Rule Out:
- Medical conditions: Hypothyroidism, anemia, B12 deficiency
- Medication effects: ____
- Substance use: ____
- Bipolar disorder: Previous manic/hypomanic episodes? Yes/No
- Bereavement: Recent significant loss? Yes/No

Physical Observations:
- Posture: ____
- Grooming/hygiene: ____
- Eye contact: ____
- Psychomotor activity: ____
- Speech: ____
- Affect: ____

DIAGNOSIS: Major Depressive Disorder / Adjustment disorder / Other: ____
Severity: Mild / Moderate / Severe
With anxious distress: Yes/No
With psychotic features: Yes/No

PLAN:
- Safety plan established: Yes/No
- Referral: ____
- Exercise recommendation: ____
- Follow-up: ____', 'assessment');

-- ============================================================================
-- DIABETES MELLITUS
-- ============================================================================

SELECT insert_template('Systemics', 'Diabetes', 'Diabetes Screening',
'DIABETES MELLITUS SCREENING

Type: Type 1 / Type 2 / Gestational / Pre-diabetes

RISK FACTORS:
- Age >45: Yes/No
- BMI >25: Yes/No
- Family history (1st degree relative): Yes/No
- High-risk ethnicity: Yes/No
- History of gestational diabetes: Yes/No
- Hypertension: Yes/No
- HDL <35 mg/dL or TG >250 mg/dL: Yes/No
- History of cardiovascular disease: Yes/No
- Physical inactivity: Yes/No
- Polycystic ovary syndrome: Yes/No
- History of impaired glucose tolerance: Yes/No

CLASSIC SYMPTOMS:
- Polyuria (frequent urination): Yes/No
- Polydipsia (excessive thirst): Yes/No
- Polyphagia (excessive hunger): Yes/No
- Unexplained weight loss: Yes/No
- Fatigue: Yes/No
- Blurred vision: Yes/No
- Slow-healing wounds: Yes/No
- Frequent infections: Yes/No
- Nocturia: Yes/No

PHYSICAL EXAMINATION:
- Weight: ____ kg, Height: ____ cm, BMI: ____
- BP: ____/____ mmHg
- Waist circumference: ____ cm

Fundoscopic exam:
- Retinopathy: None / Nonproliferative / Proliferative
- Hemorrhages: Yes/No
- Exudates: Yes/No

Foot examination:
- Skin integrity: ____
- Ulcers: Yes/No
- Dorsalis pedis pulse: ____
- Posterior tibial pulse: ____
- Monofilament test: Normal / Decreased sensation
- Vibration sense: ____

Neurological (stocking-glove distribution):
- Light touch: ____
- Pin prick: ____
- Deep tendon reflexes: ____

LABORATORY VALUES:
- Fasting glucose: ____ mg/dL (normal <100, pre-diabetes 100-125, diabetes ≥126)
- Random glucose: ____ mg/dL
- HbA1c: ____% (normal <5.7, pre-diabetes 5.7-6.4, diabetes ≥6.5)

DIAGNOSIS: ____
PLAN: ____', 'assessment');

SELECT insert_template('Systemics', 'Diabetes', 'Diabetic Complications Screen',
'DIABETIC COMPLICATIONS SCREENING

MICROVASCULAR:
Retinopathy:
- Last eye exam: ____
- Findings: None / Nonproliferative / Proliferative
- Vision changes: Yes/No

Nephropathy:
- Urine protein: ____
- Serum creatinine: ____
- eGFR: ____
- Stage: ____

Neuropathy:
- Peripheral (stocking-glove): Yes/No
- Autonomic symptoms: Yes/No
- Foot exam findings: ____

MACROVASCULAR:
Cardiovascular:
- Chest pain/angina: Yes/No
- Shortness of breath: Yes/No
- Claudication: Yes/No
- Previous MI/stroke: Yes/No

Peripheral vascular:
- Pulses: ____
- ABI (if indicated): ____

FOOT RISK ASSESSMENT:
- Previous ulcer: Yes/No
- Previous amputation: Yes/No
- Current ulcer: Yes/No
- Deformity: Yes/No
- Loss of protective sensation: Yes/No
- Peripheral vascular disease: Yes/No

Risk category: Low / Moderate / High
Follow-up interval: ____', 'objective');

-- ============================================================================
-- DYSLIPIDEMIA
-- ============================================================================

SELECT insert_template('Systemics', 'Dyslipidemia', 'Lipid Panel Assessment',
'DYSLIPIDEMIA ASSESSMENT

LIPID PANEL (fasting 9-12 hours):
- Total Cholesterol: ____ mg/dL (optimal <200)
- LDL-C: ____ mg/dL (optimal <100, high risk <70)
- HDL-C: ____ mg/dL (low risk >60, high risk <40 men/<50 women)
- Triglycerides: ____ mg/dL (optimal <150)
- Non-HDL-C: ____ mg/dL (optimal <130)

Classification:
Total Cholesterol: Normal / Borderline (200-239) / High (≥240)
LDL: Optimal / Near optimal / Borderline / High / Very high
HDL: Low / Normal / High (protective)
Triglycerides: Normal / Borderline / High / Very high

RISK FACTORS:
- Age (men ≥45, women ≥55): Yes/No
- Family history premature CHD: Yes/No
- Hypertension: Yes/No
- Smoking: Yes/No
- Diabetes: Yes/No
- Low HDL: Yes/No

10-year ASCVD risk: ____%

SECONDARY CAUSES:
- Hypothyroidism: ____
- Diabetes: ____
- Chronic kidney disease: ____
- Liver disease: ____
- Medications: ____

LIFESTYLE ASSESSMENT:
- Diet quality: ____
- Exercise level: ____
- Alcohol intake: ____
- Smoking status: ____
- Weight: ____

PLAN:
- Lifestyle modifications: ____
- Statin therapy indicated: Yes/No
- Follow-up lipid panel: ____', 'assessment');

-- ============================================================================
-- FIBROMYALGIA
-- ============================================================================

SELECT insert_template('Systemics', 'Fibromyalgia', 'Fibromyalgia Tender Points',
'FIBROMYALGIA TENDER POINT EXAMINATION

BILATERAL TENDER POINTS (11/18 required for diagnosis):
Apply ~4 kg/cm² pressure

1. Occiput (suboccipital insertion):
   Left: Tender/Not tender  Right: Tender/Not tender

2. Low cervical (C5-C7 articular pillars):
   Left: Tender/Not tender  Right: Tender/Not tender

3. Trapezius (midpoint upper border):
   Left: Tender/Not tender  Right: Tender/Not tender

4. Supraspinatus (medial scapular spine):
   Left: Tender/Not tender  Right: Tender/Not tender

5. Second rib (costochondral junction):
   Left: Tender/Not tender  Right: Tender/Not tender

6. Lateral epicondyle (2 cm distal):
   Left: Tender/Not tender  Right: Tender/Not tender

7. Gluteal (upper outer quadrant):
   Left: Tender/Not tender  Right: Tender/Not tender

8. Greater trochanter (posterior aspect):
   Left: Tender/Not tender  Right: Tender/Not tender

9. Knee (medial fat pad):
   Left: Tender/Not tender  Right: Tender/Not tender

TOTAL TENDER POINTS: ____/18

Diagnostic criteria met (≥11 tender points): Yes/No

Control points tested (should not be tender):
- Mid-forehead: Tender/Not tender
- Thumbnail: Tender/Not tender
- Mid-forearm: Tender/Not tender', 'objective');

SELECT insert_template('Systemics', 'Fibromyalgia', 'Fibromyalgia Assessment',
'FIBROMYALGIA SYNDROME ASSESSMENT

CORE SYMPTOMS:
Widespread Pain:
- Duration >3 months: Yes/No
- Bilateral: Yes/No
- Above and below waist: Yes/No
- Axial skeletal pain: Yes/No
Pain description: ____

Fatigue:
- Severity (0-10): ____
- Unrefreshing sleep: Yes/No
- Morning stiffness duration: ____

Cognitive symptoms ("fibrofog"):
- Concentration difficulties: Yes/No
- Memory problems: Yes/No
- Confusion: Yes/No

ASSOCIATED SYMPTOMS:
- Headaches: Yes/No
- IBS symptoms: Yes/No
- Temporomandibular dysfunction: Yes/No
- Depression/anxiety: Yes/No
- Restless legs: Yes/No
- Interstitial cystitis symptoms: Yes/No
- Paresthesias: Yes/No
- Chemical sensitivities: Yes/No

SLEEP ASSESSMENT:
- Sleep quality: Poor / Fair / Good
- Hours per night: ____
- Sleep latency: ____
- Nocturnal awakenings: ____
- Sleep apnea suspected: Yes/No

TENDER POINT COUNT: ____/18

Widespread Pain Index (WPI): ____/19
Symptom Severity Scale (SSS): ____/12

DIFFERENTIAL DIAGNOSES RULED OUT:
- Hypothyroidism (TSH): ____
- Rheumatoid arthritis (RF, anti-CCP): ____
- Lupus (ANA): ____
- Polymyalgia rheumatica (ESR): ____
- Vitamin D deficiency: ____

DIAGNOSIS: Fibromyalgia syndrome
Severity: Mild / Moderate / Severe
PLAN: ____', 'assessment');

-- ============================================================================
-- GOUT
-- ============================================================================

SELECT insert_template('Systemics', 'Gout', 'Gout Assessment',
'GOUT / CRYSTAL ARTHROPATHY ASSESSMENT

Type: Gout (MSU crystals) / Pseudogout (CPPD crystals)

RISK FACTORS:
- Age: ____
- Male gender: Yes/No
- Obesity: Yes/No
- Hypertension: Yes/No
- Renal insufficiency: Yes/No
- High purine diet: Yes/No
- Alcohol use: Yes/No
- Medications (diuretics, aspirin): ____
- Family history: Yes/No

PRESENTATION:
Affected joint(s): ____
- 1st MTP (podagra): Yes/No (50% initial, 90% eventually)
- Ankle: Yes/No
- Knee: Yes/No
- Wrist/hand: Yes/No

Symptoms:
- Sudden onset: Yes/No
- Time to max intensity: ____ hours (typically ~10 hours)
- Pain severity (0-10): ____
- Warmth: Yes/No
- Erythema: Yes/No
- Swelling: Yes/No

Triggers identified:
- Alcohol consumption: Yes/No
- Purine-rich foods: Yes/No
- Trauma: Yes/No
- Dehydration: Yes/No
- Stress: Yes/No
- Recent surgery/illness: Yes/No

PHYSICAL EXAMINATION:
Joint inspection:
- Erythema: Present/Absent
- Swelling: Present/Absent
- Tophi: Present/Absent (location: ____)

Joint palpation:
- Exquisite tenderness: Yes/No
- Warmth: Yes/No
- Effusion: Yes/No

ROM: Severely limited / Moderately limited / Mildly limited

LABORATORY (if available):
- Serum uric acid: ____ mg/dL (>7 mg/dL indicates higher risk)
- Joint aspiration: MSU crystals / CPPD crystals / Negative
- ESR: ____
- WBC: ____

DIFFERENTIAL:
- Septic arthritis (MUST rule out): ____
- Pseudogout: ____
- Reactive arthritis: ____
- Rheumatoid arthritis: ____

ASSESSMENT: Acute gouty arthritis / Chronic tophaceous gout / Pseudogout
PLAN: ____', 'assessment');

-- ============================================================================
-- HYPERTENSION
-- ============================================================================

SELECT insert_template('Systemics', 'Hypertension', 'Blood Pressure Assessment',
'HYPERTENSION ASSESSMENT

BLOOD PRESSURE MEASUREMENTS:
(Average of 2+ readings, 2+ visits after initial screening)

Visit 1:
- Seated, right arm: ____/____ mmHg
- Seated, left arm: ____/____ mmHg
- Standing: ____/____ mmHg

Visit 2:
- Seated, right arm: ____/____ mmHg
- Seated, left arm: ____/____ mmHg

Visit 3 (if needed):
- ____/____ mmHg

Average BP: ____/____ mmHg

CLASSIFICATION:
- Normal: <120/<80
- Elevated: 120-129/<80
- Stage 1 HTN: 130-139 or 80-89
- Stage 2 HTN: ≥140 or ≥90
- Hypertensive crisis: >180/>120

Classification: Normal / Elevated / Stage 1 / Stage 2 / Crisis

MEASUREMENT TECHNIQUE VERIFIED:
- Patient rested 5 minutes: Yes/No
- Proper cuff size: Yes/No
- Arm at heart level: Yes/No
- Back supported: Yes/No
- Feet flat on floor: Yes/No
- No caffeine/tobacco 30 min prior: Yes/No

TYPE:
- Primary (essential): Yes/No
- Secondary causes suspected: Yes/No
  - Renal disease: ____
  - Endocrine: ____
  - Medications: ____
  - Sleep apnea: ____

RISK FACTORS:
- Age: ____
- Family history: Yes/No
- Obesity (BMI): ____
- Physical inactivity: Yes/No
- High sodium diet: Yes/No
- Excessive alcohol: Yes/No
- Smoking: Yes/No
- Diabetes: Yes/No
- Dyslipidemia: Yes/No

TARGET ORGAN DAMAGE ASSESSMENT:
Eyes (fundoscopy):
- Retinopathy: None / Grade I-IV
- Hemorrhages/exudates: Yes/No
- Papilledema: Yes/No

Heart:
- LVH suspected: Yes/No
- S4 gallop: Yes/No
- Displaced apex: Yes/No

Kidneys:
- Creatinine: ____
- Proteinuria: Yes/No

Vascular:
- Carotid bruit: Yes/No
- Peripheral pulses: ____
- Abdominal bruit: Yes/No

Neurological:
- Previous stroke/TIA: Yes/No
- Focal deficits: Yes/No

10-year ASCVD risk: ____%

PLAN:
- Lifestyle modifications: ____
- Medication indicated: Yes/No
- Follow-up: ____', 'assessment');

-- ============================================================================
-- OSTEOARTHRITIS
-- ============================================================================

SELECT insert_template('Systemics', 'Osteoarthritis', 'OA Assessment',
'OSTEOARTHRITIS ASSESSMENT

AFFECTED JOINT(S): ____

HISTORY:
- Duration of symptoms: ____
- Onset: Gradual / Sudden
- Trauma history: Yes/No

Pain characteristics:
- Deep, aching quality: Yes/No
- Worse in morning: Yes/No (duration: ____ minutes)
- Better with mild activity: Yes/No
- Worse with excessive activity: Yes/No
- Night pain/rest pain: Yes/No (indicates severe progression)
- Weather-related changes: Yes/No

Functional limitations:
- Walking distance: ____
- Stair climbing: ____
- ADL impact: ____

PHYSICAL EXAMINATION:
Inspection:
- Joint enlargement: Yes/No
- Heberden''s nodes (DIP): Yes/No
- Bouchard''s nodes (PIP): Yes/No
- Malalignment: Yes/No
- Muscle atrophy: Yes/No

Palpation:
- Joint line tenderness: Yes/No
- Warmth (minimal or absent): Yes/No
- Effusion: Yes/No
- Crepitus: Yes/No

ROM:
- Active ROM: ____
- Passive ROM: ____
- Crepitus with motion: Yes/No
- Pain at end range: Yes/No

Special tests:
- Scour test (hip): Positive/Negative
- Compression rotation test: Positive/Negative
- Varus/valgus stress (knee): Stable/Unstable

Gait:
- Antalgic: Yes/No
- Trendelenburg: Yes/No

IMAGING FINDINGS (if available):
- Non-uniform joint space narrowing: Yes/No
- Subchondral sclerosis: Yes/No
- Subchondral cysts: Yes/No
- Osteophytes: Yes/No
- Joint mice (loose bodies): Yes/No

Kellgren-Lawrence Grade: 0 / I / II / III / IV

ASSESSMENT: Osteoarthritis of ____, Grade ____
PLAN: ____', 'assessment');

-- ============================================================================
-- OSTEOPOROSIS
-- ============================================================================

SELECT insert_template('Systemics', 'Osteoporosis', 'Osteoporosis Risk Assessment',
'OSTEOPOROSIS RISK ASSESSMENT

RISK FACTORS:
Major:
- Age >65: Yes/No
- Vertebral compression fracture: Yes/No
- Fragility fracture after age 40: Yes/No
- Family history of osteoporotic fracture: Yes/No
- Systemic glucocorticoid therapy >3 months: Yes/No
- Malabsorption syndrome: Yes/No
- Primary hyperparathyroidism: Yes/No
- Propensity to fall: Yes/No
- Hypogonadism: Yes/No
- Early menopause (<45): Yes/No

Minor:
- Rheumatoid arthritis: Yes/No
- Hyperthyroidism: Yes/No
- Chronic anticonvulsant therapy: Yes/No
- Low dietary calcium intake: Yes/No
- Smoking: Yes/No
- Excessive alcohol: Yes/No
- Excessive caffeine: Yes/No
- Weight <57 kg: Yes/No
- Weight loss >10% at age 25: Yes/No
- Chronic heparin therapy: Yes/No

PHYSICAL EXAMINATION:
- Height: ____ cm (historical height: ____ cm)
- Height loss: ____ cm
- Weight: ____ kg
- BMI: ____
- Kyphosis: None / Mild / Moderate / Severe (Dowager''s hump)
- Rib-pelvis distance: ____ finger breadths (normal >2)
- Wall-occiput distance: ____ cm (normal 0)

FRAX 10-YEAR FRACTURE RISK:
- Major osteoporotic fracture: ____%
- Hip fracture: ____%

DEXA RESULTS (if available):
Lumbar spine:
- BMD: ____ g/cm²
- T-score: ____
- Z-score: ____

Femoral neck:
- BMD: ____ g/cm²
- T-score: ____
- Z-score: ____

Total hip:
- BMD: ____ g/cm²
- T-score: ____
- Z-score: ____

DIAGNOSIS:
T-score interpretation:
- Normal: T-score ≥ -1.0
- Osteopenia: T-score -1.0 to -2.5
- Osteoporosis: T-score ≤ -2.5
- Severe osteoporosis: T-score ≤ -2.5 with fragility fracture

Diagnosis: Normal / Osteopenia / Osteoporosis / Severe osteoporosis

PLAN:
- Calcium intake: ____ mg/day (goal 1200-1500)
- Vitamin D: ____ IU/day (goal 800-1000)
- Weight-bearing exercise: ____
- Fall prevention: ____
- Pharmacotherapy indicated: Yes/No
- Follow-up DEXA: ____', 'assessment');

-- ============================================================================
-- PSORIATIC ARTHRITIS
-- ============================================================================

SELECT insert_template('Systemics', 'Psoriatic Arthritis', 'PsA Assessment',
'PSORIATIC ARTHRITIS ASSESSMENT

CASPAR CRITERIA (≥3 points for diagnosis):
Current psoriasis (2 points): Yes/No
Personal history of psoriasis (1 point): Yes/No
Family history of psoriasis (1 point): Yes/No
Dactylitis (current or history) (1 point): Yes/No
Juxta-articular new bone formation on X-ray (1 point): Yes/No
RF negative (1 point): Yes/No
Nail dystrophy (pitting, onycholysis) (1 point): Yes/No

Total CASPAR score: ____/7 (≥3 diagnostic)

SKIN EXAMINATION:
Psoriatic lesions present: Yes/No
Distribution: ____
- Extensor surfaces (elbows, knees): Yes/No
- Scalp: Yes/No
- Ears: Yes/No
- Umbilicus: Yes/No
- Gluteal cleft: Yes/No
- Hidden areas (hairline, behind ears): Yes/No

Auspitz sign (pinpoint bleeding with scraping): Positive/Negative

NAIL EXAMINATION:
- Pitting (≥20 pits characteristic): Yes/No (count: ____)
- Onycholysis: Yes/No
- Subungual hyperkeratosis: Yes/No
- Oil drop discoloration: Yes/No
- Ridging/crumbling: Yes/No

JOINT EXAMINATION:
Pattern:
- Asymmetric oligoarthritis (<5 joints): Yes/No
- Symmetric polyarthritis (RA-like): Yes/No
- DIP predominant: Yes/No
- Spondylitis pattern: Yes/No
- Arthritis mutilans: Yes/No

Joints involved: ____

Dactylitis ("sausage digits"):
- Present: Yes/No
- Affected digits: ____

Enthesitis:
- Achilles: Yes/No
- Plantar fascia: Yes/No
- Other: ____

ROM affected joints: ____

SPINAL INVOLVEMENT:
- Low back pain (inflammatory): Yes/No
- SI joint tenderness: Yes/No
- Reduced spinal mobility: Yes/No

LABORATORY:
- RF: Positive/Negative (usually negative)
- Anti-CCP: ____
- ESR: ____
- CRP: ____
- Uric acid: ____ (to rule out gout)

IMAGING FINDINGS:
- Marginal erosions: Yes/No
- Pencil-in-cup deformity: Yes/No
- Periostitis: Yes/No
- DIP involvement: Yes/No
- Sacroiliitis: Yes/No
- Syndesmophytes (non-marginal): Yes/No

ASSESSMENT: Psoriatic arthritis - ____ pattern
Severity: Mild / Moderate / Severe
PLAN: ____', 'assessment');

-- ============================================================================
-- REACTIVE ARTHRITIS
-- ============================================================================

SELECT insert_template('Systemics', 'Reactive Arthritis', 'Reactive Arthritis Assessment',
'REACTIVE ARTHRITIS ASSESSMENT

CLASSIC TRIAD: "Can''t see, can''t pee, can''t dance with me"
- Conjunctivitis: Yes/No
- Urethritis: Yes/No
- Arthritis: Yes/No

PRECEDING INFECTION (1-4 weeks prior):
Genitourinary:
- Urethritis symptoms: Yes/No
- Dysuria: Yes/No
- Discharge: Yes/No
- Chlamydia suspected/confirmed: Yes/No

Gastrointestinal:
- Diarrhea: Yes/No
- Duration: ____
- Organism (if known): Shigella / Salmonella / Yersinia / Campylobacter

Respiratory (rare):
- URI symptoms: Yes/No
- Chlamydia pneumoniae suspected: Yes/No

ARTICULAR FEATURES:
Pattern: Asymmetric oligoarthritis (usually lower limbs)
Joints involved: ____
- Knee: Yes/No
- Ankle: Yes/No
- Foot: Yes/No
- SI joint/spine: Yes/No (50%)

Onset: ____ weeks after infection
Duration: ____

Joint examination:
- Swelling: Yes/No
- Warmth: Yes/No
- Tenderness: Yes/No
- ROM: ____

Enthesitis:
- Achilles tendon: Yes/No
- Plantar fascia: Yes/No
- Other: ____

Dactylitis: Yes/No

EXTRA-ARTICULAR MANIFESTATIONS:
Eyes:
- Conjunctivitis (50%): Yes/No
- Uveitis (20%, may be chronic): Yes/No

Genitourinary:
- Urethritis: Yes/No
- Cervicitis: Yes/No
- Circinate balanitis (penile lesions): Yes/No

Skin/Mucous membranes:
- Keratoderma blennorrhagicum (palms/soles): Yes/No
- Oral ulcers: Yes/No
- Nail changes: Yes/No

Cardiac (rare, late):
- Aortitis (2%): Yes/No

LABORATORY:
- HLA-B27: Positive/Negative (81% positive, not diagnostic)
- ESR: ____
- CRP: ____
- RF: Negative / ____
- ANA: ____
- Urethral/cervical swab: ____
- Stool culture: ____
- Joint aspiration: WBC ____, Crystals: None, Culture: Negative

IMAGING:
- Periostitis: Yes/No
- Sacroiliitis (usually unilateral): Yes/No
- Non-marginal syndesmophytes: Yes/No

ASSESSMENT: Reactive arthritis
- Post-GU infection / Post-enteric infection
Severity: Mild / Moderate / Severe
PLAN: ____', 'assessment');

-- ============================================================================
-- RHEUMATOID ARTHRITIS
-- ============================================================================

SELECT insert_template('Systemics', 'Rheumatoid Arthritis', 'RA Assessment ACR/EULAR',
'RHEUMATOID ARTHRITIS ASSESSMENT (2010 ACR/EULAR Criteria)

JOINT INVOLVEMENT (0-5 points):
- 1 large joint: 0 points
- 2-10 large joints: 1 point
- 1-3 small joints: 2 points
- 4-10 small joints: 3 points
- >10 joints (at least 1 small): 5 points

Joints assessed: ____
Score: ____/5

SEROLOGY (0-3 points):
- Negative RF AND negative anti-CCP: 0 points
- Low positive RF OR low positive anti-CCP: 2 points
- High positive RF OR high positive anti-CCP: 3 points

RF: ____ (Positive/Negative)
Anti-CCP: ____ (Positive/Negative)
Score: ____/3

ACUTE PHASE REACTANTS (0-1 point):
- Normal CRP AND normal ESR: 0 points
- Abnormal CRP OR abnormal ESR: 1 point

ESR: ____ mm/hr
CRP: ____ mg/L
Score: ____/1

DURATION OF SYMPTOMS (0-1 point):
- <6 weeks: 0 points
- ≥6 weeks: 1 point

Duration: ____
Score: ____/1

TOTAL SCORE: ____/10 (≥6 = definite RA)

JOINT EXAMINATION:
Hand/wrist (most common):
- MCP joints: ____
- PIP joints: ____
- Wrists: ____
- DIP joints: Spared / Involved

Deformities:
- Swan neck: Yes/No
- Boutonniere: Yes/No
- Ulnar deviation: Yes/No
- Z-deformity thumb: Yes/No

Other joints: ____

Rheumatoid nodules: Yes/No (location: ____)

EXTRA-ARTICULAR FEATURES:
- Fatigue: Yes/No
- Morning stiffness: ____ hours
- Fever: Yes/No
- Weight loss: Yes/No
- Sicca symptoms: Yes/No
- Pulmonary: ____
- Cardiac: ____
- Neurological: ____
- Vasculitis: Yes/No

FUNCTIONAL STATUS (ACR):
Class I: Fully able to perform ADL
Class II: Limited in avocational activities
Class III: Limited in vocational and avocational activities
Class IV: Limited in all activities including self-care

Class: ____

DISEASE ACTIVITY:
DAS28 score: ____ (if calculated)
- <2.6: Remission
- 2.6-3.2: Low activity
- 3.2-5.1: Moderate activity
- >5.1: High activity

IMAGING:
- Soft tissue swelling: Yes/No
- Periarticular osteoporosis: Yes/No
- Joint space narrowing: Yes/No
- Erosions: Yes/No
- C1-C2 subluxation: Yes/No (atlantodental interval: ____ mm)

Stage: I (Early) / II (Moderate) / III (Severe) / IV (Terminal)

ASSESSMENT: Rheumatoid arthritis
Serostatus: Seropositive / Seronegative
Activity: Remission / Low / Moderate / High
PLAN: ____', 'assessment');

-- ============================================================================
-- SCHIZOPHRENIA
-- ============================================================================

SELECT insert_template('Systemics', 'Schizophrenia', 'Schizophrenia Screening',
'SCHIZOPHRENIA SCREENING (DSM-5 Criteria)

CHARACTERISTIC SYMPTOMS (2+ for significant time during 1 month):
1. Delusions: Yes/No
   Type: ____

2. Hallucinations: Yes/No
   Type: Auditory / Visual / Other: ____

3. Disorganized speech: Yes/No
   - Derailment: Yes/No
   - Incoherence: Yes/No

4. Grossly disorganized or catatonic behavior: Yes/No

5. Negative symptoms: Yes/No
   - Affective flattening: Yes/No
   - Alogia (poverty of speech): Yes/No
   - Avolition (lack of motivation): Yes/No

Number of characteristic symptoms: ____/5 (need 2+)

FUNCTIONAL IMPAIRMENT:
- Work/school: Impaired / Intact
- Interpersonal relations: Impaired / Intact
- Self-care: Impaired / Intact

DURATION:
- Continuous signs ≥6 months: Yes/No
- Active symptoms ≥1 month: Yes/No

EXCLUSIONS:
- Schizoaffective/mood disorder ruled out: Yes/No
- Substance-induced: Yes/No
- Medical condition causing symptoms: Yes/No
- Pervasive developmental disorder: Yes/No

MENTAL STATUS EXAMINATION:
Appearance: ____
Behavior: ____
Speech: ____
Mood: ____
Affect: ____
Thought process: ____
Thought content: ____
Perceptions: ____
Cognition: ____
Insight: ____
Judgment: ____

PHYSICAL EXAM NOTES:
(Psychotic patients may have difficulty expressing physical symptoms)
- Somatic complaints: ____
- Any bizarre descriptions of physical symptoms: ____

SAFETY ASSESSMENT:
- Suicidal ideation: Yes/No
- Homicidal ideation: Yes/No
- Self-harm risk: Low / Moderate / High
- Risk to others: Low / Moderate / High

SUBSTANCE USE:
- Alcohol: ____
- Cannabis: ____
- Other substances: ____
- Nicotine: ____

DIAGNOSIS: Schizophrenia / Schizophreniform / Schizoaffective / Other: ____
Phase: Prodromal / Active / Residual
PLAN: Psychiatric referral
- Medications: ____
- Safety plan: ____', 'assessment');

-- ============================================================================
-- SYSTEMIC LUPUS ERYTHEMATOSUS
-- ============================================================================

SELECT insert_template('Systemics', 'SLE', 'SLE Assessment SLICC Criteria',
'SYSTEMIC LUPUS ERYTHEMATOSUS ASSESSMENT

SLICC CRITERIA (≥4 criteria, including ≥1 clinical + ≥1 immunologic)
OR biopsy-proven lupus nephritis with ANA or anti-dsDNA

CLINICAL CRITERIA:
1. Acute cutaneous lupus:
   - Malar rash: Yes/No
   - Photosensitive rash: Yes/No
   - Bullous lupus: Yes/No
   - Subacute cutaneous lupus: Yes/No
   Score: ____

2. Chronic cutaneous lupus:
   - Discoid rash: Yes/No
   - Lupus panniculitis: Yes/No
   Score: ____

3. Oral/nasal ulcers: Yes/No
   Location: ____

4. Non-scarring alopecia: Yes/No

5. Arthritis (≥2 joints):
   - Synovitis: Yes/No
   - Tenderness with morning stiffness: Yes/No
   Joints affected: ____

6. Serositis:
   - Pleuritis: Yes/No
   - Pericarditis: Yes/No

7. Renal:
   - Proteinuria >500mg/24h: Yes/No
   - RBC casts: Yes/No

8. Neurologic:
   - Seizures: Yes/No
   - Psychosis: Yes/No
   - Mononeuritis multiplex: Yes/No
   - Myelitis: Yes/No
   - Peripheral neuropathy: Yes/No
   - Acute confusional state: Yes/No

9. Hemolytic anemia: Yes/No

10. Leukopenia (<4000) or Lymphopenia (<1000): Yes/No

11. Thrombocytopenia (<100,000): Yes/No

Clinical criteria met: ____/11

IMMUNOLOGIC CRITERIA:
1. ANA: Positive/Negative
2. Anti-dsDNA: Positive/Negative
3. Anti-Sm: Positive/Negative
4. Antiphospholipid antibodies: Positive/Negative
   - Anticardiolipin: ____
   - Lupus anticoagulant: ____
   - False-positive RPR: ____
5. Low complement (C3, C4, CH50): Yes/No
6. Direct Coombs test: Positive/Negative

Immunologic criteria met: ____/6

TOTAL CRITERIA: ____ clinical + ____ immunologic
Diagnosis met (≥4 including ≥1 each): Yes/No

PHYSICAL EXAMINATION:
General: ____
Skin:
- Malar rash: Present/Absent
- Discoid lesions: Present/Absent
- Photosensitivity: Yes/No
- Raynaud''s phenomenon: Yes/No
- Alopecia: Yes/No

HEENT:
- Oral ulcers: Present/Absent
- Nasal ulcers: Present/Absent

Cardiovascular:
- Pericardial rub: Present/Absent
- Murmur: Present/Absent

Respiratory:
- Pleural rub: Present/Absent
- Decreased breath sounds: Present/Absent

Musculoskeletal:
- Joint swelling: ____
- Joint tenderness: ____
- Myositis: Yes/No

Neurologic: ____

Lymphadenopathy: Yes/No
Splenomegaly: Yes/No

DISEASE ACTIVITY:
SLEDAI score: ____ (if calculated)

ASSESSMENT: Systemic Lupus Erythematosus
Activity: Remission / Mild / Moderate / Severe
Organ involvement: ____
PLAN: Rheumatology referral
- Medications: ____
- Photoprotection: ____
- Monitoring: ____', 'assessment');

-- ============================================================================
-- GENERAL SYSTEMIC RED FLAGS
-- ============================================================================

SELECT insert_template('Systemics', 'Red Flags', 'Systemic Red Flags Screen',
'SYSTEMIC RED FLAGS SCREENING

CONSTITUTIONAL SYMPTOMS:
- Unexplained weight loss (>10% in 6 months): Yes/No
- Unexplained fever: Yes/No
- Night sweats: Yes/No
- Fatigue (unexplained, progressive): Yes/No
- Malaise: Yes/No

NEUROLOGICAL RED FLAGS:
- New severe headache: Yes/No
- Thunderclap headache: Yes/No
- Progressive neurological deficit: Yes/No
- Altered mental status: Yes/No
- Seizures (new onset): Yes/No
- Cauda equina symptoms: Yes/No
  - Saddle anesthesia: Yes/No
  - Bladder/bowel dysfunction: Yes/No
  - Bilateral leg weakness: Yes/No

CARDIOVASCULAR RED FLAGS:
- Chest pain: Yes/No
- Syncope: Yes/No
- Severe hypertension: Yes/No
- Pulsatile abdominal mass: Yes/No
- Asymmetric pulses: Yes/No

ONCOLOGICAL RED FLAGS:
- History of cancer: Yes/No
- Unexplained lumps/masses: Yes/No
- Progressive pain not relieved by rest: Yes/No
- Pain worse at night: Yes/No
- Age >50 with new onset back pain: Yes/No

INFECTIOUS RED FLAGS:
- Fever with rigors: Yes/No
- IV drug use: Yes/No
- Recent infection: Yes/No
- Immunocompromised: Yes/No
- Recent surgery/procedure: Yes/No

INFLAMMATORY RED FLAGS:
- Morning stiffness >1 hour: Yes/No
- Pain improves with activity: Yes/No
- Multiple joint involvement: Yes/No
- Eye inflammation: Yes/No
- Skin rashes: Yes/No

FRACTURE RED FLAGS:
- Significant trauma: Yes/No
- Minor trauma with osteoporosis risk: Yes/No
- Steroid use: Yes/No
- Age >70: Yes/No

RED FLAGS IDENTIFIED: ____

IMMEDIATE ACTION REQUIRED: Yes/No
REFERRAL INDICATED: Yes/No
Referral to: ____', 'objective');

-- ============================================================================
-- Clean up helper function
-- ============================================================================

-- Note: The insert_template function should already exist from the main templates file
-- If running this independently, ensure the clinical_templates table and function exist
