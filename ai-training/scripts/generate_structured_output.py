#!/usr/bin/env python3
"""
Generate structured output (JSON) training data for all models.

Teaches models to respond with parseable JSON when requested.
Covers: SOAP extraction, red flag triage, treatment plans,
patient communication, and quick-fill structured data.

Output: ChatML format compatible with train_unsloth.py
"""

import json
from pathlib import Path

SYSTEM_PROMPT_NO = (
    'Du er en klinisk AI-assistent for kiropraktorer i Norge. '
    'Svar alltid med gyldig JSON når du blir bedt om strukturert output.'
)

SYSTEM_PROMPT_EN = (
    'You are a clinical AI assistant for chiropractors. '
    'Always respond with valid JSON when asked for structured output.'
)

# ============================================================
# 1. SOAP Extraction → JSON (Norwegian)
# ============================================================

SOAP_EXTRACTION_NO = [
    {
        'input': 'Ekstraher SOAP fra følgende journalnotat som JSON:\n"Pasienten kommer med nakkesmerter og hodepine siste 2 uker. Gradvis debut etter langvarig skjermarbeid. VAS 6/10. Objektiv: ROM cervikal rotasjon hø 50%, sidbøy hø 40%. Palp ømt suboccipitalt bilat, trapezius øvre ++. Spurling neg. Vurdering: Mekanisk nakkesmerte med myofascielle triggerpunkter. Plan: Triggerpunktbehandling, mobilisering C1-C3, hjemmeøvelser chin tucks."',
        'output': json.dumps({
            "subjective": {
                "chief_complaint": "Nakkesmerter og hodepine",
                "duration": "2 uker",
                "onset": "Gradvis, etter langvarig skjermarbeid",
                "pain_score": 6,
                "pain_scale": "VAS"
            },
            "objective": {
                "rom": {"cervical_rotation_right": "50%", "cervical_sidebend_right": "40%"},
                "palpation": ["Ømt suboccipitalt bilateralt", "Trapezius øvre uttalt øm bilateralt"],
                "special_tests": [{"name": "Spurling", "result": "negativ"}]
            },
            "assessment": {
                "diagnosis": "Mekanisk nakkesmerte med myofascielle triggerpunkter",
                "icpc2": "L83"
            },
            "plan": {
                "treatment": ["Triggerpunktbehandling", "Mobilisering C1-C3"],
                "exercises": ["Chin tucks"],
                "follow_up": None
            }
        }, ensure_ascii=False)
    },
    {
        'input': 'Ekstraher SOAP som JSON:\n"45 år mann, akutt korsryggsmerte etter løfting i går. VAS 8/10. Antalgisk holdning, fleksjon sterkt begrenset. Palp paravertebral spasme L4-L5 bilat. SLR neg bilat. Kraft/sensibilitet/reflekser ua. Vurdering: Akutt lumbago uten radikulopati. Plan: Forsiktig mobilisering, is 15min x3/dag, unngå løfting 1 uke, kontroll om 3 dager."',
        'output': json.dumps({
            "subjective": {
                "chief_complaint": "Akutt korsryggsmerte",
                "duration": "1 dag",
                "onset": "Akutt, etter løfting",
                "pain_score": 8,
                "pain_scale": "VAS"
            },
            "objective": {
                "observation": ["Antalgisk holdning", "Fleksjon sterkt begrenset"],
                "palpation": ["Paravertebral spasme L4-L5 bilateralt"],
                "special_tests": [{"name": "SLR", "result": "negativ bilateralt"}],
                "neurological": {"strength": "ua", "sensation": "ua", "reflexes": "ua"}
            },
            "assessment": {
                "diagnosis": "Akutt lumbago uten radikulopati",
                "icpc2": "L84"
            },
            "plan": {
                "treatment": ["Forsiktig mobilisering"],
                "home_care": ["Is 15 min x3/dag", "Unngå løfting 1 uke"],
                "follow_up": "3 dager"
            }
        }, ensure_ascii=False)
    },
    {
        'input': 'Ekstraher SOAP som JSON:\n"28 år kvinne, skuldersmerte hø side 3 mnd. Verst overhead. Nattsmerter ved å ligge på hø side. VAS 5/10. Obj: Aktiv fleksjon 160°, abduksjon 150°. Painful arc 70-120°. Hawkins pos, Neer pos, Empty can 4+/5. Vurd: Subacromial impingement syndrom hø skulder. P: Manuell terapi skulder+torakal 1x/uke, eksentrisk rotatorcuff, scapula-stabilisering."',
        'output': json.dumps({
            "subjective": {
                "chief_complaint": "Skuldersmerte høyre",
                "duration": "3 måneder",
                "aggravating": ["Overhead-aktiviteter", "Ligge på høyre side"],
                "pain_score": 5,
                "night_pain": True
            },
            "objective": {
                "rom": {"shoulder_flexion": "160°", "shoulder_abduction": "150°"},
                "special_tests": [
                    {"name": "Painful arc", "result": "positiv 70-120°"},
                    {"name": "Hawkins", "result": "positiv"},
                    {"name": "Neer", "result": "positiv"},
                    {"name": "Empty can", "result": "4+/5"}
                ]
            },
            "assessment": {
                "diagnosis": "Subacromial impingement syndrom høyre skulder",
                "icpc2": "L92"
            },
            "plan": {
                "treatment": ["Manuell terapi skulder og torakal 1x/uke"],
                "exercises": ["Eksentrisk rotatorcuff", "Scapula-stabilisering"]
            }
        }, ensure_ascii=False)
    },
    {
        'input': 'Ekstraher SOAP som JSON:\n"62 år kvinne, svimmelhet ved hodebevegelser siste 5 dager. Sekunder varighet, kvalme. Obj: Dix-Hallpike positiv hø med torsjonell nystagmus, latenstid 3 sek. Negativ ve. Underberger ua. Vurd: BPPV bakre buegang hø. Plan: Epley-manøver x2, Brandt-Daroff hjemme 3x/dag, kontroll 1 uke."',
        'output': json.dumps({
            "subjective": {
                "chief_complaint": "Svimmelhet ved hodebevegelser",
                "duration": "5 dager",
                "character": "Sekunder varighet",
                "associated": ["Kvalme"]
            },
            "objective": {
                "special_tests": [
                    {"name": "Dix-Hallpike høyre", "result": "positiv, torsjonell nystagmus, latenstid 3 sek"},
                    {"name": "Dix-Hallpike venstre", "result": "negativ"},
                    {"name": "Unterberger", "result": "ua"}
                ]
            },
            "assessment": {
                "diagnosis": "BPPV bakre buegang høyre",
                "icpc2": "H82"
            },
            "plan": {
                "treatment": ["Epley-manøver x2 i klinikk"],
                "exercises": ["Brandt-Daroff 3x/dag hjemme"],
                "follow_up": "1 uke"
            }
        }, ensure_ascii=False)
    },
    {
        'input': 'Ekstraher SOAP som JSON:\n"35 år mann, kjevesmerter ve side 2 mnd. Klikking ved gaping. Verst morgen og etter tygging. VAS 4/10. Obj: Gapeevne 32mm, klikk ved åpning ve TMJ. Palp ømt masseter ve, temporalis ve, lateral pterygoid ve. Cervikal ROM ua. Vurd: TMD ve side med myofasciell komponent. Plan: Intraoral trp masseter/pterygoid, cervikal mob, kjeveleddsmob 1x/uke 4 uker."',
        'output': json.dumps({
            "subjective": {
                "chief_complaint": "Kjevesmerter venstre",
                "duration": "2 måneder",
                "aggravating": ["Tygging", "Morgen"],
                "associated": ["Klikking ved gaping"],
                "pain_score": 4
            },
            "objective": {
                "rom": {"jaw_opening": "32mm"},
                "findings": ["Klikk ved åpning venstre TMJ"],
                "palpation": ["Ømt masseter venstre", "Ømt temporalis venstre", "Ømt lateral pterygoid venstre"],
                "cervical_rom": "ua"
            },
            "assessment": {
                "diagnosis": "TMD venstre side med myofasciell komponent",
                "icpc2": "L07"
            },
            "plan": {
                "treatment": ["Intraoral triggerpunktbehandling masseter/pterygoid", "Cervikal mobilisering", "Kjeveleddsmobilisering"],
                "frequency": "1x/uke i 4 uker"
            }
        }, ensure_ascii=False)
    },
]

# ============================================================
# 2. SOAP Extraction → JSON (English)
# ============================================================

SOAP_EXTRACTION_EN = [
    {
        'input': 'Extract SOAP as JSON:\n"32-year-old male, acute low back pain after deadlift 2 days ago. Sharp pain, VAS 7/10. Objective: Antalgic lean left, flexion 30%, extension 10%. Paravertebral spasm L4-S1 bilateral. SLR negative bilateral. Neuro intact. Assessment: Acute mechanical low back pain, likely facet/discogenic. Plan: Soft tissue work, gentle mobilization, ice 15min x4/day, avoid heavy lifting 2 weeks, review in 5 days."',
        'output': json.dumps({
            "subjective": {
                "chief_complaint": "Acute low back pain",
                "duration": "2 days",
                "onset": "After deadlift",
                "pain_score": 7,
                "pain_quality": "Sharp"
            },
            "objective": {
                "observation": ["Antalgic lean left"],
                "rom": {"lumbar_flexion": "30%", "lumbar_extension": "10%"},
                "palpation": ["Paravertebral spasm L4-S1 bilateral"],
                "special_tests": [{"name": "SLR", "result": "negative bilateral"}],
                "neurological": "Intact"
            },
            "assessment": {
                "diagnosis": "Acute mechanical low back pain, likely facet/discogenic",
                "icd10": "M54.5"
            },
            "plan": {
                "treatment": ["Soft tissue work", "Gentle mobilization"],
                "home_care": ["Ice 15min x4/day", "Avoid heavy lifting 2 weeks"],
                "follow_up": "5 days"
            }
        }, ensure_ascii=False)
    },
    {
        'input': 'Extract SOAP as JSON:\n"55-year-old female, right shoulder pain 6 weeks. Difficulty sleeping. VAS 6/10. Objective: Active flexion 140°, abduction 130°, ER 30°, IR to L3. Positive Hawkins, Neer, drop arm negative. Full strength ER/IR. Assessment: Subacromial impingement with developing adhesive capsulitis. Plan: Manual therapy 2x/week, pendulum exercises, wall slides, codman exercises. Reassess 4 weeks."',
        'output': json.dumps({
            "subjective": {
                "chief_complaint": "Right shoulder pain",
                "duration": "6 weeks",
                "functional_impact": ["Difficulty sleeping"],
                "pain_score": 6
            },
            "objective": {
                "rom": {"flexion": "140°", "abduction": "130°", "external_rotation": "30°", "internal_rotation": "L3"},
                "special_tests": [
                    {"name": "Hawkins", "result": "positive"},
                    {"name": "Neer", "result": "positive"},
                    {"name": "Drop arm", "result": "negative"}
                ],
                "strength": {"external_rotation": "5/5", "internal_rotation": "5/5"}
            },
            "assessment": {
                "diagnosis": "Subacromial impingement with developing adhesive capsulitis",
                "icd10": "M75.1"
            },
            "plan": {
                "treatment": ["Manual therapy 2x/week"],
                "exercises": ["Pendulum exercises", "Wall slides", "Codman exercises"],
                "follow_up": "4 weeks reassessment"
            }
        }, ensure_ascii=False)
    },
    {
        'input': 'Extract SOAP as JSON:\n"40-year-old office worker, tension headaches 3x/week for 2 months. Band-like bilateral. VAS 5/10. Associated neck stiffness. Objective: Cervical rotation bilateral 60%, upper trap tender bilateral, suboccipital TrPs. Spurling negative. Assessment: Tension-type headache with cervicogenic component. Plan: Trigger point therapy, cervical mobilization C0-C2, ergonomic advice, chin tucks 10x3 daily."',
        'output': json.dumps({
            "subjective": {
                "chief_complaint": "Tension headaches",
                "frequency": "3x/week",
                "duration": "2 months",
                "pain_quality": "Band-like, bilateral",
                "pain_score": 5,
                "associated": ["Neck stiffness"],
                "occupation": "Office worker"
            },
            "objective": {
                "rom": {"cervical_rotation_bilateral": "60%"},
                "palpation": ["Upper trapezius tender bilateral", "Suboccipital trigger points"],
                "special_tests": [{"name": "Spurling", "result": "negative"}]
            },
            "assessment": {
                "diagnosis": "Tension-type headache with cervicogenic component",
                "icd10": "G44.2"
            },
            "plan": {
                "treatment": ["Trigger point therapy", "Cervical mobilization C0-C2"],
                "advice": ["Ergonomic workstation assessment"],
                "exercises": ["Chin tucks 10 reps x3 daily"]
            }
        }, ensure_ascii=False)
    },
]

# ============================================================
# 3. Red Flag Triage → JSON (Norwegian)
# ============================================================

TRIAGE_NO = [
    {
        'input': 'Triager følgende symptomer som JSON:\n"65 år mann, akutt korsryggsmerte, bilateral beinsvakhet, urinretensjon siden i morges, nummenhet i skrittet."',
        'output': json.dumps({
            "urgency": "AKUTT",
            "action": "Ring 113 - akutt MR",
            "suspected_diagnosis": "Cauda equina syndrom",
            "red_flags": ["Bilateral beinsvakhet", "Urinretensjon", "Sadelanestesi"],
            "contraindication_manual_therapy": True,
            "reasoning": "Klassisk CES-triade: motorisk utfall + blæredysfunksjon + sadelanestesi. Kirurgisk vindu <48 timer."
        }, ensure_ascii=False)
    },
    {
        'input': 'Triager følgende symptomer som JSON:\n"38 år kvinne, gradvis tiltagende korsryggsmerte siste 3 mnd, morgenstivhet >45 min som bedres med aktivitet, alder debut <40 år."',
        'output': json.dumps({
            "urgency": "HENVIS RUTINE",
            "action": "Blodprøver (HLA-B27, SR, CRP), henvisning revmatolog",
            "suspected_diagnosis": "Inflammatorisk ryggsmerte, mulig aksial spondyloartritt",
            "red_flags": ["Morgenstivhet >45 min", "Bedring med aktivitet", "Debut <40 år"],
            "contraindication_manual_therapy": False,
            "reasoning": "Oppfyller kriterier for inflammatorisk ryggsmerte. Ikke akutt, men bør utredes for å utelukke aksial SpA."
        }, ensure_ascii=False)
    },
    {
        'input': 'Triager følgende symptomer som JSON:\n"50 år mann, mekanisk nakkesmerte etter å ha malt taket i helgen. VAS 5/10. Ingen hodepine, ingen utstråling, ingen svimmelhet."',
        'output': json.dumps({
            "urgency": "TRYGT",
            "action": "Konservativ behandling",
            "suspected_diagnosis": "Mekanisk nakkesmerte, overbelastning",
            "red_flags": [],
            "contraindication_manual_therapy": False,
            "reasoning": "Klar mekanisk årsak, ingen nevrologiske symptomer, ingen røde flagg. Egnet for kiropraktisk behandling."
        }, ensure_ascii=False)
    },
    {
        'input': 'Triager følgende symptomer som JSON:\n"72 år mann, ny torakalsmerter siste 3 uker, nattlige smerter som vekker ham, uforklart vekttap 5 kg siste 2 mnd, tidligere prostatakreft."',
        'output': json.dumps({
            "urgency": "HENVIS SAMME DAG",
            "action": "Hastehenvisning onkolog/fastlege, blodprøver inkl PSA, bildediagnostikk",
            "suspected_diagnosis": "Mulig skjelettmetastase fra prostatakreft",
            "red_flags": ["Nattlige smerter", "Uforklart vekttap", "Kreftanamnese", "Alder >50 med ny ryggsmerte"],
            "contraindication_manual_therapy": True,
            "reasoning": "Kjent prostatakreft + ny torakalsmerter + nattsvette/vekttap = høy mistanke om metastaser. Manipulasjon kontraindisert."
        }, ensure_ascii=False)
    },
    {
        'input': 'Triager følgende symptomer som JSON:\n"42 år kvinne, vedvarende isjias hø ben 8 uker, VAS ben 7/10, nedsatt kraft dorsalfleksjon stortå 4/5 hø. Stabil siste 2 uker."',
        'output': json.dumps({
            "urgency": "MONITORÉR",
            "action": "Fortsett konservativ behandling, vurder MR ved forverring",
            "suspected_diagnosis": "L5-radikulopati med mild motorisk utfall",
            "red_flags": ["Motorisk utfall 4/5"],
            "contraindication_manual_therapy": False,
            "reasoning": "Mild, stabil motorisk utfall (4/5) uten progresjon er akseptabelt for konservativ behandling. Monitorér kraft hver konsultasjon. Henvis ved progresjon."
        }, ensure_ascii=False)
    },
]

# ============================================================
# 4. Red Flag Triage → JSON (English)
# ============================================================

TRIAGE_EN = [
    {
        'input': 'Triage the following symptoms as JSON:\n"58-year-old male, thunderclap headache during exercise, worst headache of life, neck stiffness, photophobia."',
        'output': json.dumps({
            "urgency": "URGENT",
            "action": "Call ambulance - suspected SAH",
            "suspected_diagnosis": "Subarachnoid hemorrhage",
            "red_flags": ["Thunderclap headache", "Worst headache of life", "Neck stiffness", "Photophobia"],
            "contraindication_manual_therapy": True,
            "reasoning": "Sudden onset worst-ever headache with meningism = SAH until proven otherwise. CT head + LP if CT negative."
        }, ensure_ascii=False)
    },
    {
        'input': 'Triage the following symptoms as JSON:\n"25-year-old female runner, bilateral shin pain after increasing mileage. Pain during running, resolves with rest. No night pain."',
        'output': json.dumps({
            "urgency": "SAFE",
            "action": "Conservative management, load modification",
            "suspected_diagnosis": "Medial tibial stress syndrome (shin splints)",
            "red_flags": [],
            "contraindication_manual_therapy": False,
            "reasoning": "Activity-related bilateral shin pain in runner with recent training increase. Classic overuse pattern. No red flags for stress fracture (no night pain, no focal tenderness)."
        }, ensure_ascii=False)
    },
    {
        'input': 'Triage the following symptoms as JSON:\n"45-year-old male, progressive hand clumsiness 3 months, difficulty with buttons, gait feels unsteady, neck pain."',
        'output': json.dumps({
            "urgency": "REFER SAME-DAY",
            "action": "Urgent MRI cervical spine, neurology referral",
            "suspected_diagnosis": "Cervical myelopathy",
            "red_flags": ["Progressive hand clumsiness", "Gait disturbance", "Upper motor neuron signs"],
            "contraindication_manual_therapy": True,
            "reasoning": "Progressive hand dysfunction + gait disturbance + neck pain = cervical myelopathy until excluded. Manipulation absolutely contraindicated."
        }, ensure_ascii=False)
    },
    {
        'input': 'Triage the following symptoms as JSON:\n"35-year-old male, right calf swelling and pain 3 days after long-haul flight, warmth on palpation."',
        'output': json.dumps({
            "urgency": "REFER SAME-DAY",
            "action": "D-dimer + compression ultrasound, same-day",
            "suspected_diagnosis": "Deep vein thrombosis",
            "red_flags": ["Unilateral calf swelling", "Post-immobilization", "Warmth"],
            "contraindication_manual_therapy": True,
            "reasoning": "Unilateral calf swelling + recent immobilization (flight) + warmth = DVT until excluded. Do not massage or manipulate affected limb."
        }, ensure_ascii=False)
    },
]

# ============================================================
# 5. Treatment Plan → JSON (Norwegian)
# ============================================================

TREATMENT_PLAN_NO = [
    {
        'input': 'Generer behandlingsplan som JSON for: Mekanisk nakkesmerte med triggerpunkter, kontorarbeider.',
        'output': json.dumps({
            "diagnosis": "Mekanisk nakkesmerte med myofascielle triggerpunkter",
            "phase": "Akutt/subakutt",
            "sessions": [
                {"week": "1-2", "frequency": "2x/uke", "treatment": ["Triggerpunktbehandling trapezius/levator", "Mobilisering C1-C3", "Bløtvevsbehandling"]},
                {"week": "3-4", "frequency": "1x/uke", "treatment": ["Mobilisering/manipulasjon cervikal", "Styrkeøvelser oppstart"]},
                {"week": "5-8", "frequency": "1x/2.uke", "treatment": ["Vedlikehold", "Progresjon øvelser"]}
            ],
            "home_exercises": [
                {"name": "Chin tucks", "reps": "10x3", "frequency": "daglig"},
                {"name": "Skulderblad-retraksjoner", "reps": "10x3", "frequency": "daglig"},
                {"name": "Nakketøyning", "hold": "30 sek", "frequency": "2x/dag"}
            ],
            "ergonomic_advice": ["Skjerm i øyehøyde", "Hev-senk pult", "Mikropause hvert 30 min"],
            "expected_duration": "6-8 uker",
            "reassess_at": "4 uker"
        }, ensure_ascii=False)
    },
    {
        'input': 'Generer behandlingsplan som JSON for: BPPV bakre buegang høyre.',
        'output': json.dumps({
            "diagnosis": "BPPV bakre buegang høyre",
            "phase": "Akutt",
            "sessions": [
                {"visit": 1, "treatment": ["Epley-manøver x2", "Instruksjon Brandt-Daroff"]},
                {"visit": 2, "when": "1 uke", "treatment": ["Retest Dix-Hallpike", "Gjenta Epley ved behov"]},
                {"visit": 3, "when": "2 uker", "treatment": ["Avsluttende test", "Vestibulær rehabilitering ved behov"]}
            ],
            "home_exercises": [
                {"name": "Brandt-Daroff", "reps": "5 per side", "frequency": "3x/dag i 2 uker"}
            ],
            "precautions": ["Unngå raske hodebevegelser", "Sov med hevet hodeende", "Unngå å ligge på høyre side"],
            "expected_duration": "1-3 uker",
            "prognosis": "Svært god, >90% resolusjon etter 1-3 behandlinger"
        }, ensure_ascii=False)
    },
]

# ============================================================
# 6. Treatment Plan → JSON (English)
# ============================================================

TREATMENT_PLAN_EN = [
    {
        'input': 'Generate treatment plan as JSON for: Acute low back pain, manual laborer.',
        'output': json.dumps({
            "diagnosis": "Acute mechanical low back pain",
            "phase": "Acute",
            "sessions": [
                {"week": "1", "frequency": "2-3x/week", "treatment": ["Gentle mobilization", "Soft tissue therapy", "Pain education"]},
                {"week": "2-3", "frequency": "2x/week", "treatment": ["Progressive mobilization", "Core activation exercises"]},
                {"week": "4-6", "frequency": "1x/week", "treatment": ["Manipulation as indicated", "Progressive strengthening", "Work conditioning"]}
            ],
            "home_exercises": [
                {"name": "Cat-cow", "reps": "10x3", "frequency": "daily"},
                {"name": "Bird-dog", "reps": "10x3", "frequency": "daily"},
                {"name": "Walking", "duration": "20 min", "frequency": "daily"}
            ],
            "work_modifications": ["Avoid lifting >10kg for 2 weeks", "Alternate sitting/standing", "Proper lifting mechanics education"],
            "expected_duration": "4-6 weeks",
            "return_to_work": "Modified duties 1-2 weeks, full duties 3-4 weeks"
        }, ensure_ascii=False)
    },
]

# ============================================================
# 7. Quick-Fill Structured Data (Norwegian)
# ============================================================

QUICK_FILL_NO = [
    {
        'input': 'Fyll ut pasientdata som JSON fra: "Mann 45, røyker, stillesittende jobb, BMI 28, tidligere diskusprolaps L5-S1 2020"',
        'output': json.dumps({
            "demographics": {"age": 45, "sex": "M"},
            "risk_factors": ["Røyker", "Stillesittende arbeid", "Overvekt (BMI 28)"],
            "medical_history": [{"condition": "Diskusprolaps L5-S1", "year": 2020}],
            "bmi": 28,
            "lifestyle": {"smoking": True, "activity_level": "Stillesittende"}
        }, ensure_ascii=False)
    },
    {
        'input': 'Fyll ut nevrologisk screening som JSON fra: "Patella 2+ bilat, achilles 2+ bilat, kraft L2-S1 5/5 bilat, sensibilitet intakt alle dermatomer UE, Babinski neg bilat"',
        'output': json.dumps({
            "reflexes": {
                "patellar_L4": {"left": "2+", "right": "2+"},
                "achilles_S1": {"left": "2+", "right": "2+"}
            },
            "myotomes": {
                "L2_hip_flexion": {"left": "5/5", "right": "5/5"},
                "L3_knee_extension": {"left": "5/5", "right": "5/5"},
                "L4_ankle_dorsiflexion": {"left": "5/5", "right": "5/5"},
                "L5_great_toe_extension": {"left": "5/5", "right": "5/5"},
                "S1_ankle_plantarflexion": {"left": "5/5", "right": "5/5"}
            },
            "dermatomes": "Intakt alle nivåer bilateralt",
            "upper_motor_neuron": {"babinski": {"left": "negativ", "right": "negativ"}},
            "impression": "Normal nevrologisk screening underekstremiteter"
        }, ensure_ascii=False)
    },
    {
        'input': 'Fyll ut ROM-data som JSON fra: "Cervikal: fleksjon 50°, ekstensjon 40°, rot hø 60°, rot ve 70°, sidbøy hø 30°, sidbøy ve 40°"',
        'output': json.dumps({
            "region": "Cervical",
            "measurements": {
                "flexion": {"value": 50, "unit": "degrees", "normal": 50, "percent_normal": 100},
                "extension": {"value": 40, "unit": "degrees", "normal": 60, "percent_normal": 67},
                "rotation_right": {"value": 60, "unit": "degrees", "normal": 80, "percent_normal": 75},
                "rotation_left": {"value": 70, "unit": "degrees", "normal": 80, "percent_normal": 88},
                "lateral_flexion_right": {"value": 30, "unit": "degrees", "normal": 45, "percent_normal": 67},
                "lateral_flexion_left": {"value": 40, "unit": "degrees", "normal": 45, "percent_normal": 89}
            },
            "pattern": "Mest begrenset: Cervikal ekstensjon og sidbøy høyre",
            "clinical_significance": "Asymmetrisk restriksjon høyre > venstre"
        }, ensure_ascii=False)
    },
]

# ============================================================
# 8. Quick-Fill Structured Data (English)
# ============================================================

QUICK_FILL_EN = [
    {
        'input': 'Fill in patient intake as JSON from: "Female 33, desk worker, active runner 30km/week, no medications, previous ACL reconstruction left knee 2018"',
        'output': json.dumps({
            "demographics": {"age": 33, "sex": "F"},
            "occupation": "Desk worker",
            "activity": {"type": "Running", "volume": "30km/week", "level": "Active"},
            "medications": [],
            "surgical_history": [{"procedure": "ACL reconstruction left knee", "year": 2018}],
            "risk_factors": ["Desk worker posture", "High-volume running"]
        }, ensure_ascii=False)
    },
    {
        'input': 'Fill in orthopedic test results as JSON from: "Shoulder right: Hawkins positive, Neer positive, Empty can 4/5, Speed negative, O\'Brien negative, apprehension negative"',
        'output': json.dumps({
            "region": "Shoulder right",
            "impingement_tests": [
                {"name": "Hawkins", "result": "positive"},
                {"name": "Neer", "result": "positive"}
            ],
            "rotator_cuff_tests": [
                {"name": "Empty can (supraspinatus)", "result": "4/5 (mild weakness)"}
            ],
            "labral_tests": [
                {"name": "Speed (biceps/labrum)", "result": "negative"},
                {"name": "O'Brien (labrum)", "result": "negative"}
            ],
            "instability_tests": [
                {"name": "Apprehension", "result": "negative"}
            ],
            "clinical_impression": "Subacromial impingement with mild supraspinatus involvement. No labral or instability pathology."
        }, ensure_ascii=False)
    },
]

# ============================================================
# 9. Patient Communication → JSON (Norwegian)
# ============================================================

PATIENT_COMM_NO = [
    {
        'input': 'Generer pasientkommunikasjon som JSON for: SMS-påminnelse om time i morgen kl 14:00 for oppfølging nakkesmerter.',
        'output': json.dumps({
            "type": "appointment_reminder",
            "channel": "sms",
            "language": "no",
            "message": "Hei! Påminnelse om din time i morgen kl. 14:00 for oppfølging nakkesmerter. Husk å gjøre chin tucks-øvelsene før timen. Vennligst gi beskjed om du ikke kan komme. Mvh [Klinikk]",
            "personalization_fields": ["patient_name", "clinic_name", "practitioner_name"]
        }, ensure_ascii=False)
    },
    {
        'input': 'Generer pasientkommunikasjon som JSON for: Øvelsesinstruksjon chin tucks til pasient med cervikogen hodepine.',
        'output': json.dumps({
            "type": "exercise_instruction",
            "exercise": "Chin tucks (hakeinndragning)",
            "indication": "Cervikogen hodepine",
            "instructions": {
                "starting_position": "Sitt eller stå med rett rygg, blikk rett frem",
                "execution": "Trekk haken rett bakover som om du lager dobbelhake. Hold 5 sekunder.",
                "repetitions": "10 repetisjoner x 3 serier",
                "frequency": "3 ganger daglig",
                "tips": ["Ikke bøy nakken ned", "Tenk at noen dytter pannen din bakover", "Skal kjennes som strekk i nakken bak"]
            },
            "contraindications": ["Akutt nakkeskade", "Kjent ustabilitet øvre cervikal"],
            "progression": "Når dette er enkelt: legg til lett motstand med hånden mot pannen"
        }, ensure_ascii=False)
    },
]

# ============================================================
# 10. Patient Communication → JSON (English)
# ============================================================

PATIENT_COMM_EN = [
    {
        'input': 'Generate patient communication as JSON for: Post-visit summary email after first consultation for low back pain.',
        'output': json.dumps({
            "type": "post_visit_summary",
            "channel": "email",
            "language": "en",
            "subject": "Your visit summary - Low back pain consultation",
            "sections": {
                "diagnosis": "Acute mechanical low back pain",
                "what_we_did": ["Physical examination", "Gentle mobilization of lumbar spine", "Soft tissue therapy"],
                "home_instructions": [
                    "Apply ice for 15 minutes, 3-4 times daily",
                    "Stay active - short walks every 2 hours",
                    "Avoid prolonged sitting >30 minutes",
                    "Cat-cow stretches: 10 reps, 3 times daily"
                ],
                "next_appointment": "In 3-5 days",
                "when_to_seek_help": [
                    "Difficulty with bladder or bowel control",
                    "Numbness in the groin area",
                    "Leg weakness that is getting worse",
                    "Fever above 38.5°C"
                ]
            },
            "personalization_fields": ["patient_name", "practitioner_name", "clinic_phone"]
        }, ensure_ascii=False)
    },
]


# ============================================================
# 11. Additional SOAP (Norwegian) - More body regions
# ============================================================

SOAP_EXTRA_NO = [
    {
        'input': 'Ekstraher SOAP som JSON:\n"22 år mann, knesmerter ve etter fotballkamp. Vridningstraume. VAS 6/10. Obj: Hevelse medialt, ømt over medialt leddbånd. Lachman neg, McMurray pos medial med smerte. Valgus stress positiv grad 1. Vurd: MCL-skade grad 1, mulig medial meniskskade. Plan: RICE 48t, kompresjonsbandasje, krykkeavlastning, MR ved manglende bedring 2 uker."',
        'output': json.dumps({
            "subjective": {"chief_complaint": "Knesmerter venstre", "mechanism": "Vridningstraume fotball", "pain_score": 6},
            "objective": {
                "inspection": ["Hevelse medialt"],
                "palpation": ["Ømt over medialt leddbånd"],
                "special_tests": [
                    {"name": "Lachman", "result": "negativ"},
                    {"name": "McMurray medial", "result": "positiv med smerte"},
                    {"name": "Valgus stress", "result": "positiv grad 1"}
                ]
            },
            "assessment": {"diagnosis": "MCL-skade grad 1, mulig medial meniskskade", "icpc2": "L96"},
            "plan": {"acute": ["RICE 48 timer", "Kompresjonsbandasje", "Krykkeavlastning"], "imaging": "MR ved manglende bedring 2 uker"}
        }, ensure_ascii=False)
    },
    {
        'input': 'Ekstraher SOAP som JSON:\n"55 år kvinne, hoftesmerter ve side 6 mnd. Smerter i lyske, verst trapper og etter hvile. Morgenstivhet 15 min. Obj: AROM fleksjon 100°, IR 15°, ER 30°. FABER pos ve. Trendelenburg neg. Palp ømt lyske. Vurd: Hofteartrose ve, moderat. Plan: Manuell terapi hofte/lumbal 1x/uke, styrkeøvelser gluteus, bassengtrening, vektkontroll."',
        'output': json.dumps({
            "subjective": {"chief_complaint": "Hoftesmerter venstre", "duration": "6 måneder", "location": "Lyske", "aggravating": ["Trapper", "Etter hvile"], "morning_stiffness": "15 min", "pain_score": None},
            "objective": {
                "rom": {"hip_flexion": "100°", "hip_IR": "15°", "hip_ER": "30°"},
                "special_tests": [{"name": "FABER", "result": "positiv venstre"}, {"name": "Trendelenburg", "result": "negativ"}],
                "palpation": ["Ømt lyske"]
            },
            "assessment": {"diagnosis": "Hofteartrose venstre, moderat", "icpc2": "L89"},
            "plan": {"treatment": ["Manuell terapi hofte/lumbal 1x/uke"], "exercises": ["Styrkeøvelser gluteus", "Bassengtrening"], "lifestyle": ["Vektkontroll"]}
        }, ensure_ascii=False)
    },
    {
        'input': 'Ekstraher SOAP som JSON:\n"30 år mann, plantar hælsmerte hø 3 mnd. Verst første skritt morgen. NRS 5/10. Obj: Palp ømt medialt calcaneus. Windlass pos. Stram akillessene bilat. Dorsalfleksjon ankel 5° hø, 15° ve. Vurd: Plantar fasciitt hø. Plan: Tøyning akillessene og plantar fascie, nattortose, riktig fottøy, ultralyd, kontroll 4 uker."',
        'output': json.dumps({
            "subjective": {"chief_complaint": "Plantar hælsmerte høyre", "duration": "3 måneder", "pattern": "Verst første skritt morgen", "pain_score": 5},
            "objective": {
                "palpation": ["Ømt medialt calcaneus høyre"],
                "special_tests": [{"name": "Windlass", "result": "positiv"}],
                "rom": {"ankle_dorsiflexion_right": "5°", "ankle_dorsiflexion_left": "15°"},
                "findings": ["Stram akillessene bilateralt"]
            },
            "assessment": {"diagnosis": "Plantar fasciitt høyre", "icpc2": "L87"},
            "plan": {"treatment": ["Ultralyd"], "exercises": ["Tøyning akillessene", "Tøyning plantar fascie"], "aids": ["Nattortose", "Riktig fottøy"], "follow_up": "4 uker"}
        }, ensure_ascii=False)
    },
    {
        'input': 'Ekstraher SOAP som JSON:\n"48 år kvinne, brystryggsmerte mellom skulderbladene 1 mnd. Stillesittende jobb. Verst slutten av arbeidsdagen. VAS 4/10. Obj: Torakal kyfose økt. Palp ømt Th4-Th8 paravertebral bilat. Springfjærtest pos Th5-Th6. ROM torakal rotasjon hø 30°, ve 40°. Vurd: Torakal segmentell dysfunksjon Th5-Th6 med myofasciell smerte. Plan: Manipulasjon Th5-Th6, mobilisering torakal, thorax opener øvelser."',
        'output': json.dumps({
            "subjective": {"chief_complaint": "Brystryggsmerte mellom skulderbladene", "duration": "1 måned", "occupation": "Stillesittende", "aggravating": ["Slutten av arbeidsdagen"], "pain_score": 4},
            "objective": {
                "observation": ["Økt torakal kyfose"],
                "palpation": ["Ømt Th4-Th8 paravertebral bilateralt"],
                "special_tests": [{"name": "Springfjærtest Th5-Th6", "result": "positiv"}],
                "rom": {"thoracic_rotation_right": "30°", "thoracic_rotation_left": "40°"}
            },
            "assessment": {"diagnosis": "Torakal segmentell dysfunksjon Th5-Th6 med myofasciell smerte", "icpc2": "L84"},
            "plan": {"treatment": ["Manipulasjon Th5-Th6", "Mobilisering torakal"], "exercises": ["Thorax opener øvelser"]}
        }, ensure_ascii=False)
    },
    {
        'input': 'Ekstraher SOAP som JSON:\n"40 år mann, tennisalbue hø 8 uker. VAS 5/10 ved grep. Kontorarbeider, mye musbruk. Obj: Palp ømt lateral epikondyl hø. Cozen pos. Mill pos. Grepstyrke redusert 30% vs ve. Vurd: Lateral epikondylalgi hø. Plan: Eksentrisk styrke håndleddsekstensorer, ergonomisk mus/tastatur, isomassasje, clasp-band."',
        'output': json.dumps({
            "subjective": {"chief_complaint": "Tennisalbue høyre", "duration": "8 uker", "aggravating": ["Grep", "Musbruk"], "occupation": "Kontorarbeider", "pain_score": 5},
            "objective": {
                "palpation": ["Ømt lateral epikondyl høyre"],
                "special_tests": [{"name": "Cozen", "result": "positiv"}, {"name": "Mill", "result": "positiv"}],
                "strength": {"grip_deficit": "30% redusert vs venstre"}
            },
            "assessment": {"diagnosis": "Lateral epikondylalgi høyre", "icpc2": "L93"},
            "plan": {"exercises": ["Eksentrisk styrke håndleddsekstensorer"], "ergonomics": ["Ergonomisk mus og tastatur"], "treatment": ["Isomassasje"], "aids": ["Clasp-band"]}
        }, ensure_ascii=False)
    },
]

# ============================================================
# 12. Additional SOAP (English)
# ============================================================

SOAP_EXTRA_EN = [
    {
        'input': 'Extract SOAP as JSON:\n"28-year-old female, left knee pain after hiking, gradual onset. Pain medial joint line, worse stairs down. No locking. Exam: Mild effusion, TTP medial joint line, McMurray positive medial click, varus/valgus stable. Neuro intact. Assessment: Medial meniscus injury, likely degenerative tear. Plan: Quadriceps strengthening, activity modification, reassess 4 weeks, MRI if no improvement."',
        'output': json.dumps({
            "subjective": {"chief_complaint": "Left knee pain", "onset": "Gradual, after hiking", "location": "Medial joint line", "aggravating": ["Stairs descending"], "locking": False},
            "objective": {
                "inspection": ["Mild effusion"],
                "palpation": ["TTP medial joint line"],
                "special_tests": [{"name": "McMurray medial", "result": "positive with click"}, {"name": "Varus/Valgus stress", "result": "stable"}],
                "neurological": "Intact"
            },
            "assessment": {"diagnosis": "Medial meniscus injury, likely degenerative tear", "icd10": "M23.2"},
            "plan": {"exercises": ["Quadriceps strengthening"], "advice": ["Activity modification"], "follow_up": "4 weeks", "imaging": "MRI if no improvement"}
        }, ensure_ascii=False)
    },
    {
        'input': 'Extract SOAP as JSON:\n"50-year-old male, thoracic pain between shoulder blades 3 weeks. Desk worker. VAS 4/10. Exam: Increased thoracic kyphosis, restricted rotation left 25deg. Spring test positive T5-T7. Palpation tender bilateral paraspinals T4-T8. Assessment: Thoracic segmental dysfunction T5-T7 with postural component. Plan: Thoracic manipulation, soft tissue work, foam roller exercises, ergonomic review."',
        'output': json.dumps({
            "subjective": {"chief_complaint": "Thoracic pain between shoulder blades", "duration": "3 weeks", "occupation": "Desk worker", "pain_score": 4},
            "objective": {
                "observation": ["Increased thoracic kyphosis"],
                "rom": {"thoracic_rotation_left": "25°"},
                "special_tests": [{"name": "Spring test T5-T7", "result": "positive"}],
                "palpation": ["Tender bilateral paraspinals T4-T8"]
            },
            "assessment": {"diagnosis": "Thoracic segmental dysfunction T5-T7 with postural component", "icd10": "M54.6"},
            "plan": {"treatment": ["Thoracic manipulation", "Soft tissue work"], "exercises": ["Foam roller exercises"], "advice": ["Ergonomic workstation review"]}
        }, ensure_ascii=False)
    },
    {
        'input': 'Extract SOAP as JSON:\n"65-year-old female, bilateral hand numbness and tingling worse at night, drops things. Exam: Positive Phalen bilateral, Tinel positive right, thenar atrophy right. Grip strength reduced right. Cervical screen normal. Assessment: Bilateral carpal tunnel syndrome, right worse with thenar atrophy. Plan: Night splints, nerve glides, refer for NCS/EMG, consider surgical referral right side."',
        'output': json.dumps({
            "subjective": {"chief_complaint": "Bilateral hand numbness and tingling", "pattern": "Worse at night", "functional": "Drops things", "age": 65},
            "objective": {
                "special_tests": [
                    {"name": "Phalen", "result": "positive bilateral"},
                    {"name": "Tinel", "result": "positive right"}
                ],
                "inspection": ["Thenar atrophy right"],
                "strength": {"grip_right": "Reduced"},
                "cervical_screen": "Normal"
            },
            "assessment": {"diagnosis": "Bilateral carpal tunnel syndrome, right worse with thenar atrophy", "icd10": "G56.0"},
            "plan": {"conservative": ["Night splints bilateral", "Nerve glides"], "referral": ["NCS/EMG testing", "Surgical referral right side"]}
        }, ensure_ascii=False)
    },
]

# ============================================================
# 13. More Triage (Norwegian)
# ============================================================

TRIAGE_EXTRA_NO = [
    {
        'input': 'Triager følgende symptomer som JSON:\n"28 år kvinne, akutt ryggsmerte etter løfting. VAS 8/10. Kan knapt stå. Ingen utstråling, ingen nevrologiske symptomer, ingen blæreproblemer."',
        'output': json.dumps({
            "urgency": "TRYGT",
            "action": "Konservativ behandling, aktivitetsmodifisering",
            "suspected_diagnosis": "Akutt lumbago (hekseskudd)",
            "red_flags": [],
            "contraindication_manual_therapy": False,
            "reasoning": "Akutt mekanisk smerte med klar utløsende årsak. Ingen nevrologiske funn eller røde flagg. VAS 8 er høyt men forventes ved akutt lumbago."
        }, ensure_ascii=False)
    },
    {
        'input': 'Triager følgende symptomer som JSON:\n"55 år mann, venstresidig brystsmerte med utstråling til ve arm, åndenød, svetting. Debut under trening."',
        'output': json.dumps({
            "urgency": "AKUTT",
            "action": "Ring 113 umiddelbart - mistanke om hjerteinfarkt",
            "suspected_diagnosis": "Akutt koronarsyndrom",
            "red_flags": ["Brystsmerte med utstråling til arm", "Åndenød", "Svetting", "Debut under anstrengelse"],
            "contraindication_manual_therapy": True,
            "reasoning": "Klassisk presentasjon for akutt hjerteinfarkt. Må til akuttmottak umiddelbart. IKKE behandle - ring 113."
        }, ensure_ascii=False)
    },
    {
        'input': 'Triager følgende symptomer som JSON:\n"35 år mann, unilateral hevelse ve legg 3 dager etter langdistanseflyvning. Varme ved palpasjon. Ingen traume."',
        'output': json.dumps({
            "urgency": "HENVIS SAMME DAG",
            "action": "D-dimer + kompresjonsultralyd, ikke massasje/behandling av leggen",
            "suspected_diagnosis": "Dyp venetrombose (DVT)",
            "red_flags": ["Unilateral legghevelse", "Post-immobilisering", "Varme"],
            "contraindication_manual_therapy": True,
            "reasoning": "Wells-kriterier oppfylt: immobilisering + unilateral hevelse + varme. Trombose må utelukkes før eventuell behandling."
        }, ensure_ascii=False)
    },
    {
        'input': 'Triager følgende symptomer som JSON:\n"68 år kvinne, ny temporal hodepine, kjevekladikasjon, synsforstyrrelser, SR 85. Ømme temporalarterier."',
        'output': json.dumps({
            "urgency": "HENVIS SAMME DAG",
            "action": "Akutt temporalarteriebiopi + start prednisolon via fastlege SAMME DAG",
            "suspected_diagnosis": "Kjempecellearteritt (temporal arteritt)",
            "red_flags": ["Temporal hodepine ny >50 år", "Kjevekladikasjon", "Synsforstyrrelser", "Forhøyet SR"],
            "contraindication_manual_therapy": True,
            "reasoning": "Klassisk GCA med synsinvolvering = risiko for permanent synstap. Behandling må startes FØR biopsi for å beskytte synet."
        }, ensure_ascii=False)
    },
    {
        'input': 'Triager følgende symptomer som JSON:\n"45 år kvinne, kronisk korsryggsmerte 2 år, stabil. Mekanisk mønster. Ingen vekttap, ingen nattsmerter, ingen nevrologiske symptomer."',
        'output': json.dumps({
            "urgency": "TRYGT",
            "action": "Multimodal konservativ behandling",
            "suspected_diagnosis": "Kronisk uspesifikk korsryggsmerte",
            "red_flags": [],
            "contraindication_manual_therapy": False,
            "reasoning": "Langvarig stabil mekanisk smerte uten alarmsymptomer. Ideell kandidat for kiropraktisk behandling med styrketrening og smerteedukasjon."
        }, ensure_ascii=False)
    },
]

# ============================================================
# 14. More Triage (English)
# ============================================================

TRIAGE_EXTRA_EN = [
    {
        'input': 'Triage the following symptoms as JSON:\n"30-year-old female, acute onset severe headache, neck stiffness, fever 39C, photophobia, petechial rash."',
        'output': json.dumps({
            "urgency": "URGENT",
            "action": "Call ambulance immediately - suspected meningitis",
            "suspected_diagnosis": "Bacterial meningitis",
            "red_flags": ["Acute severe headache", "Neck stiffness", "Fever", "Photophobia", "Petechial rash"],
            "contraindication_manual_therapy": True,
            "reasoning": "Classic meningitis presentation: headache + meningism + fever + petechiae. Petechial rash suggests meningococcal - this is a medical emergency."
        }, ensure_ascii=False)
    },
    {
        'input': 'Triage the following symptoms as JSON:\n"42-year-old male, chronic neck pain 3 years, mechanical pattern, no neurological symptoms, no red flags. Works as carpenter."',
        'output': json.dumps({
            "urgency": "SAFE",
            "action": "Conservative multimodal treatment",
            "suspected_diagnosis": "Chronic mechanical neck pain, likely occupational",
            "red_flags": [],
            "contraindication_manual_therapy": False,
            "reasoning": "Long-standing stable mechanical neck pain without neurological involvement or red flags. Appropriate for chiropractic care with ergonomic intervention."
        }, ensure_ascii=False)
    },
    {
        'input': 'Triage the following symptoms as JSON:\n"70-year-old male, new onset low back pain 6 weeks, unintentional weight loss 4kg, fatigue, history of prostate cancer 5 years ago."',
        'output': json.dumps({
            "urgency": "REFER SAME-DAY",
            "action": "Urgent imaging (MRI spine), blood work (PSA, CBC, CRP), oncology referral",
            "suspected_diagnosis": "Possible skeletal metastasis from prostate cancer",
            "red_flags": ["New back pain age >50", "Unintentional weight loss", "Cancer history", "Fatigue"],
            "contraindication_manual_therapy": True,
            "reasoning": "Previous prostate cancer + new back pain + constitutional symptoms (weight loss, fatigue) = high suspicion for metastatic disease. Must exclude before any manual therapy."
        }, ensure_ascii=False)
    },
    {
        'input': 'Triage the following symptoms as JSON:\n"38-year-old female, right arm weakness progressive over 2 weeks. Tingling both hands. Gait unsteady. Neck pain."',
        'output': json.dumps({
            "urgency": "REFER SAME-DAY",
            "action": "Urgent MRI cervical spine, neurology referral",
            "suspected_diagnosis": "Cervical myelopathy - cord compression",
            "red_flags": ["Progressive bilateral hand symptoms", "Gait disturbance", "Upper motor neuron pattern"],
            "contraindication_manual_therapy": True,
            "reasoning": "Progressive myelopathic signs: bilateral hand involvement + gait ataxia + progressive weakness. Cervical manipulation absolutely contraindicated. Urgent imaging needed."
        }, ensure_ascii=False)
    },
    {
        'input': 'Triage the following symptoms as JSON:\n"22-year-old male athlete, acute ankle inversion injury during basketball. Swelling lateral ankle, cannot bear weight. No deformity."',
        'output': json.dumps({
            "urgency": "MONITOR",
            "action": "Ottawa ankle rules assessment, X-ray if positive, RICE protocol",
            "suspected_diagnosis": "Lateral ankle ligament sprain",
            "red_flags": ["Inability to weight-bear"],
            "contraindication_manual_therapy": False,
            "reasoning": "Acute inversion injury with inability to bear weight needs Ottawa rules screening for fracture. If X-ray clear, conservative management appropriate. Monitor for syndesmotic involvement."
        }, ensure_ascii=False)
    },
]

# ============================================================
# 15. More Treatment Plans (Norwegian)
# ============================================================

TREATMENT_PLAN_EXTRA_NO = [
    {
        'input': 'Generer behandlingsplan som JSON for: Lumbal radikulopati L5-S1 med mild motorisk utfall.',
        'output': json.dumps({
            "diagnosis": "Lumbal radikulopati L5-S1",
            "severity": "Moderat - mild motorisk utfall (4/5)",
            "phase": "Subakutt",
            "sessions": [
                {"week": "1-2", "frequency": "2x/uke", "treatment": ["Forsiktig mobilisering lumbal", "McKenzie-protokoll", "Nervemobilisering"]},
                {"week": "3-4", "frequency": "1-2x/uke", "treatment": ["Progressiv mobilisering", "Kjerneaktivering", "Gangtrening"]},
                {"week": "5-8", "frequency": "1x/uke", "treatment": ["Styrketrening", "Funksjonell rehabilitering"]}
            ],
            "home_exercises": [
                {"name": "McKenzie ekstensjon", "reps": "10x6-8/dag", "frequency": "Hver 2. time akutt"},
                {"name": "Nerveglidning L5-S1", "reps": "10x3", "frequency": "daglig"},
                {"name": "Gange", "duration": "20-30 min", "frequency": "daglig"}
            ],
            "monitoring": ["Kraft dorsalfleksjon stortå HVER konsultasjon", "VAS ben vs rygg ratio", "SLR vinkel"],
            "red_flags_for_escalation": ["Kraftgrad synker til 3/5 eller lavere", "Bilateral beinsvakhet", "Blæredysfunksjon"],
            "imaging": "MR lumbal ved forverring eller manglende bedring 6 uker",
            "expected_duration": "6-12 uker"
        }, ensure_ascii=False)
    },
    {
        'input': 'Generer behandlingsplan som JSON for: SI-leddsdysfunksjon postpartum.',
        'output': json.dumps({
            "diagnosis": "SI-leddsdysfunksjon postpartum",
            "phase": "Subakutt/kronisk",
            "sessions": [
                {"week": "1-3", "frequency": "1-2x/uke", "treatment": ["Mobilisering SI-ledd", "Muskelenergiteknikk", "Bløtvevsbehandling gluteus/piriformis"]},
                {"week": "4-8", "frequency": "1x/uke", "treatment": ["Stabiliseringstrening", "Progressiv styrke"]},
                {"week": "9-12", "frequency": "1x/2.uke", "treatment": ["Vedlikehold", "Full funksjonell trening"]}
            ],
            "home_exercises": [
                {"name": "Bekkenbunn-aktivering", "reps": "10x3", "frequency": "daglig"},
                {"name": "Clamshells", "reps": "15x3", "frequency": "daglig"},
                {"name": "Modifisert bird-dog", "reps": "10x3", "frequency": "daglig"}
            ],
            "aids": ["SI-belte de første 4 ukene ved behov"],
            "precautions": ["Unngå asymmetrisk belastning", "Forsiktig med wide-stance øvelser"],
            "expected_duration": "8-12 uker"
        }, ensure_ascii=False)
    },
    {
        'input': 'Generer behandlingsplan som JSON for: Rotatorcuff tendinopati høyre skulder.',
        'output': json.dumps({
            "diagnosis": "Rotatorcuff tendinopati høyre skulder",
            "phase": "Kronisk/degenerativ",
            "sessions": [
                {"week": "1-3", "frequency": "2x/uke", "treatment": ["Bløtvevsbehandling rotatorcuff", "Torakal mobilisering", "Scapular setting"]},
                {"week": "4-8", "frequency": "1x/uke", "treatment": ["Eksentrisk styrketrening", "Progressiv motstand"]},
                {"week": "9-12", "frequency": "1x/2.uke", "treatment": ["Funksjonell trening", "Sportsspesifikk rehabilitering"]}
            ],
            "home_exercises": [
                {"name": "Pendeløvelse", "reps": "1 min x3", "frequency": "daglig fase 1"},
                {"name": "Isometrisk ER/IR", "reps": "10x5 sek x3", "frequency": "daglig"},
                {"name": "Eksentrisk ER med theraband", "reps": "15x3", "frequency": "annenhver dag fra uke 4"}
            ],
            "expected_duration": "8-12 uker",
            "prognosis": "God ved compliance med eksentrisk program. 70-80% bedring forventet."
        }, ensure_ascii=False)
    },
]

# ============================================================
# 16. More Treatment Plans (English)
# ============================================================

TREATMENT_PLAN_EXTRA_EN = [
    {
        'input': 'Generate treatment plan as JSON for: Chronic tension-type headache with cervicogenic component.',
        'output': json.dumps({
            "diagnosis": "Chronic tension-type headache with cervicogenic component",
            "phase": "Chronic management",
            "sessions": [
                {"week": "1-3", "frequency": "2x/week", "treatment": ["Cervical mobilization C0-C2", "Trigger point therapy suboccipitals/upper traps", "Soft tissue work"]},
                {"week": "4-8", "frequency": "1x/week", "treatment": ["Spinal manipulation as indicated", "Deep neck flexor training", "Progressive loading"]},
                {"week": "9-12", "frequency": "Biweekly", "treatment": ["Maintenance", "Exercise progression"]}
            ],
            "home_exercises": [
                {"name": "Chin tucks", "reps": "10x3", "frequency": "daily"},
                {"name": "Deep neck flexor holds", "reps": "10x10sec", "frequency": "daily"},
                {"name": "Upper trap stretches", "hold": "30 sec", "frequency": "3x/day"}
            ],
            "lifestyle": ["Screen ergonomics review", "Stress management", "Sleep hygiene", "20-20-20 rule for screen breaks"],
            "expected_duration": "8-12 weeks",
            "outcome_measures": ["Headache diary (frequency, intensity, duration)", "NDI score", "PGIC at 4 and 8 weeks"]
        }, ensure_ascii=False)
    },
    {
        'input': 'Generate treatment plan as JSON for: Plantar fasciitis bilateral, runner.',
        'output': json.dumps({
            "diagnosis": "Bilateral plantar fasciitis",
            "patient_context": "Runner",
            "phase": "Chronic/overuse",
            "sessions": [
                {"week": "1-4", "frequency": "1x/week", "treatment": ["Foot/ankle mobilization", "Calf soft tissue work", "Dry needling gastrocnemius/soleus"]},
                {"week": "5-8", "frequency": "Biweekly", "treatment": ["Progressive loading", "Gait analysis and correction"]}
            ],
            "home_exercises": [
                {"name": "Calf stretches (wall)", "hold": "30 sec x3", "frequency": "3x/day"},
                {"name": "Plantar fascia stretch", "hold": "30 sec x3", "frequency": "Before first step AM"},
                {"name": "Heel raises (eccentric)", "reps": "15x3", "frequency": "Daily from week 3"},
                {"name": "Towel scrunches", "reps": "3 min", "frequency": "Daily"}
            ],
            "running_plan": {"week_1_4": "No running", "week_5_8": "Walk-run intervals, soft surfaces", "week_9_plus": "Gradual return, 10% rule"},
            "expected_duration": "8-12 weeks"
        }, ensure_ascii=False)
    },
]

# ============================================================
# 17. More Quick-Fill (Norwegian)
# ============================================================

QUICK_FILL_EXTRA_NO = [
    {
        'input': 'Fyll ut behandlingslogg som JSON fra: "Beh: Mob C3-C5, HVLA C2 PRS, trp trapezius øvre bilat, trp levator scapulae hø, bvm suboccipitalt, instruert chin tucks og nakketøyning."',
        'output': json.dumps({
            "treatment_log": {
                "mobilization": [{"segment": "C3-C5", "technique": "Mobilisering"}],
                "manipulation": [{"segment": "C2", "listing": "PRS", "technique": "HVLA"}],
                "soft_tissue": [
                    {"muscle": "Trapezius øvre", "side": "bilateral", "technique": "Triggerpunktbehandling"},
                    {"muscle": "Levator scapulae", "side": "høyre", "technique": "Triggerpunktbehandling"},
                    {"muscle": "Suboccipitale", "side": "bilateral", "technique": "Bløtvevsmassasje"}
                ],
                "exercises_prescribed": ["Chin tucks", "Nakketøyning"],
                "total_techniques": 6
            }
        }, ensure_ascii=False)
    },
    {
        'input': 'Fyll ut smertekart som JSON fra: "Smerte: Sentral korsrygg NRS 7, utstråling hø gluteal NRS 5, hø posterolateral lår NRS 4, hø legg lateral NRS 3. Nummenhet laterale fotrygg hø."',
        'output': json.dumps({
            "pain_map": {
                "primary": {"location": "Sentral korsrygg", "nrs": 7},
                "radiation": [
                    {"location": "Høyre gluteal", "nrs": 5},
                    {"location": "Høyre posterolateral lår", "nrs": 4},
                    {"location": "Høyre legg lateralt", "nrs": 3}
                ],
                "neurological": [{"type": "Nummenhet", "location": "Laterale fotrygg høyre", "dermatome": "L5"}],
                "pattern": "L5-dermatomfordeling høyre",
                "centralization_peripheralization": "Perifert utstrålingsmønster"
            }
        }, ensure_ascii=False)
    },
    {
        'input': 'Fyll ut røde flagg-sjekkliste som JSON fra: "Ingen CES-symptomer: blærefunksjon normal, sensibilitet perineum intakt, bilateral beinstyrke bevart. Ingen B-symptomer: stabil vekt, ingen feber, ingen nattsvette. Ingen traume."',
        'output': json.dumps({
            "red_flag_screening": {
                "cauda_equina": {"bladder_function": "Normal", "saddle_sensation": "Intakt", "bilateral_leg_strength": "Bevart", "status": "CLEAR"},
                "constitutional_symptoms": {"weight_change": "Stabil", "fever": "Nei", "night_sweats": "Nei", "status": "CLEAR"},
                "trauma": {"recent_trauma": "Nei", "status": "CLEAR"},
                "overall_status": "INGEN RØDE FLAGG",
                "safe_for_treatment": True
            }
        }, ensure_ascii=False)
    },
    {
        'input': 'Fyll ut henvisning som JSON fra: "Henvis til MR lumbal for 45 år mann med 8 uker isjias hø, SLR pos 40°, nedsatt kraft dorsalfleksjon stortå 4/5, konservativ behandling uten tilstrekkelig effekt."',
        'output': json.dumps({
            "referral": {
                "type": "MR lumbal columna",
                "urgency": "Haster (innen 2 uker)",
                "patient": {"age": 45, "sex": "M"},
                "indication": "Vedvarende lumboischialgi med radikulære funn",
                "clinical_findings": {
                    "duration": "8 uker",
                    "symptoms": ["Isjias høyre ben"],
                    "tests": [{"name": "SLR", "result": "Positiv 40° høyre"}],
                    "neurological": [{"finding": "Nedsatt kraft dorsalfleksjon stortå høyre", "grade": "4/5", "level": "L5"}]
                },
                "failed_treatment": "Konservativ behandling 6+ uker uten tilstrekkelig effekt",
                "question": "Diskusprolaps/foraminal stenose L4/L5 eller L5/S1 høyre?"
            }
        }, ensure_ascii=False)
    },
]

# ============================================================
# 18. More Quick-Fill (English)
# ============================================================

QUICK_FILL_EXTRA_EN = [
    {
        'input': 'Fill in treatment log as JSON from: "Tx: STW upper traps bilateral, TrP SCM right, mob T1-T4, HVLA T3 bilateral, prescribed scapular retractions and pec stretch."',
        'output': json.dumps({
            "treatment_log": {
                "soft_tissue": [
                    {"muscle": "Upper trapezius", "side": "bilateral", "technique": "Soft tissue work"},
                    {"muscle": "SCM", "side": "right", "technique": "Trigger point therapy"}
                ],
                "mobilization": [{"segment": "T1-T4", "technique": "Mobilization"}],
                "manipulation": [{"segment": "T3", "side": "bilateral", "technique": "HVLA"}],
                "exercises_prescribed": ["Scapular retractions", "Pec stretch"],
                "total_techniques": 5
            }
        }, ensure_ascii=False)
    },
    {
        'input': 'Fill in outcome measures as JSON from: "Baseline: NDI 34/50, VAS neck 7/10, VAS headache 6/10. 4 weeks: NDI 22/50, VAS neck 4/10, VAS headache 3/10. 8 weeks: NDI 14/50, VAS neck 2/10, VAS headache 1/10."',
        'output': json.dumps({
            "outcome_tracking": {
                "measure": "NDI + VAS",
                "timepoints": [
                    {"time": "Baseline", "ndi": 34, "vas_neck": 7, "vas_headache": 6},
                    {"time": "4 weeks", "ndi": 22, "vas_neck": 4, "vas_headache": 3},
                    {"time": "8 weeks", "ndi": 14, "vas_neck": 2, "vas_headache": 1}
                ],
                "improvement": {
                    "ndi_change": -20, "ndi_percent": "59% improvement",
                    "vas_neck_change": -5, "vas_headache_change": -5
                },
                "mcid_achieved": {"ndi": True, "vas": True},
                "clinical_status": "Significant improvement, exceeds MCID for all measures"
            }
        }, ensure_ascii=False)
    },
]

# ============================================================
# 19. More Patient Comms (Norwegian)
# ============================================================

PATIENT_COMM_EXTRA_NO = [
    {
        'input': 'Generer pasientkommunikasjon som JSON for: Recall-melding til pasient som ikke har vært innom på 3 mnd med kronisk nakkesmerte.',
        'output': json.dumps({
            "type": "recall",
            "channel": "sms",
            "language": "no",
            "message": "Hei [navn]! Det er 3 måneder siden siste konsultasjon for dine nakkeplager. Vi anbefaler en oppfølgingstime for å vurdere status og justere behandlingsplanen. Bestill time på [booking-link] eller ring [tlf]. Mvh [Klinikk]",
            "personalization_fields": ["patient_name", "clinic_name", "booking_link", "phone"],
            "trigger": "3 months since last visit",
            "condition": "Chronic neck pain"
        }, ensure_ascii=False)
    },
    {
        'input': 'Generer pasientkommunikasjon som JSON for: Sykemelding-vurdering for pasient med akutt lumbago, kontorarbeider.',
        'output': json.dumps({
            "type": "sick_leave_assessment",
            "language": "no",
            "document": {
                "diagnosis": "Akutt lumbago (M54.5)",
                "occupation": "Kontorarbeider (stillesittende)",
                "functional_assessment": "Kan ikke sitte sammenhengende >10 min. Kan ikke bøye seg. Gangfunksjon begrenset.",
                "recommendation": "100% sykemelding 5 virkedager",
                "gradual_return": "50% gradert sykemelding mulig ved bedring",
                "workplace_adaptations": ["Hev-senk pult", "Mulighet for å variere stilling", "Korte gåpauser"],
                "expected_timeline": {"full_sick_leave": "3-7 dager", "gradual_return": "1-2 uker", "full_capacity": "2-4 uker"},
                "review_date": "Ved kontroll om 5 dager"
            }
        }, ensure_ascii=False)
    },
]

# ============================================================
# 20. More Patient Comms (English)
# ============================================================

PATIENT_COMM_EXTRA_EN = [
    {
        'input': 'Generate patient communication as JSON for: Exercise progression email for patient with shoulder impingement moving to phase 2.',
        'output': json.dumps({
            "type": "exercise_progression",
            "channel": "email",
            "language": "en",
            "subject": "Your exercise program update - Phase 2",
            "content": {
                "greeting": "Great progress on your shoulder rehabilitation!",
                "phase_completed": "Phase 1 - Pain management and gentle mobility",
                "new_phase": "Phase 2 - Strengthening and stability",
                "exercises": [
                    {"name": "Resistance band external rotation", "reps": "15x3", "frequency": "Daily", "notes": "Light resistance, pain-free range only"},
                    {"name": "Wall push-ups", "reps": "10x3", "frequency": "Daily"},
                    {"name": "Scapular wall slides", "reps": "10x3", "frequency": "Daily"}
                ],
                "stop_if": ["Sharp pain during exercise", "Pain lasting >2 hours after exercise", "Swelling or warmth in the joint"],
                "next_review": "2 weeks"
            }
        }, ensure_ascii=False)
    },
]


def generate_all_examples():
    """Generate all structured output training examples."""
    examples = []

    def add(data_list, system_prompt):
        for item in data_list:
            examples.append({
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": item['input']},
                    {"role": "assistant", "content": item['output']}
                ]
            })

    # Norwegian - base
    add(SOAP_EXTRACTION_NO, SYSTEM_PROMPT_NO)
    add(TRIAGE_NO, SYSTEM_PROMPT_NO)
    add(TREATMENT_PLAN_NO, SYSTEM_PROMPT_NO)
    add(QUICK_FILL_NO, SYSTEM_PROMPT_NO)
    add(PATIENT_COMM_NO, SYSTEM_PROMPT_NO)
    # Norwegian - extra
    add(SOAP_EXTRA_NO, SYSTEM_PROMPT_NO)
    add(TRIAGE_EXTRA_NO, SYSTEM_PROMPT_NO)
    add(TREATMENT_PLAN_EXTRA_NO, SYSTEM_PROMPT_NO)
    add(QUICK_FILL_EXTRA_NO, SYSTEM_PROMPT_NO)
    add(PATIENT_COMM_EXTRA_NO, SYSTEM_PROMPT_NO)

    # English - base
    add(SOAP_EXTRACTION_EN, SYSTEM_PROMPT_EN)
    add(TRIAGE_EN, SYSTEM_PROMPT_EN)
    add(TREATMENT_PLAN_EN, SYSTEM_PROMPT_EN)
    add(QUICK_FILL_EN, SYSTEM_PROMPT_EN)
    add(PATIENT_COMM_EN, SYSTEM_PROMPT_EN)
    # English - extra
    add(SOAP_EXTRA_EN, SYSTEM_PROMPT_EN)
    add(TRIAGE_EXTRA_EN, SYSTEM_PROMPT_EN)
    add(TREATMENT_PLAN_EXTRA_EN, SYSTEM_PROMPT_EN)
    add(QUICK_FILL_EXTRA_EN, SYSTEM_PROMPT_EN)
    add(PATIENT_COMM_EXTRA_EN, SYSTEM_PROMPT_EN)

    return examples


def main():
    examples = generate_all_examples()

    # Output directory
    script_dir = Path(__file__).parent.parent
    output_dir = script_dir / 'data' / 'mined'
    output_dir.mkdir(parents=True, exist_ok=True)

    output_file = output_dir / 'structured-output.jsonl'
    with open(output_file, 'w', encoding='utf-8') as f:
        for ex in examples:
            f.write(json.dumps(ex, ensure_ascii=False) + '\n')

    # Validate
    errors = 0
    for ex in examples:
        try:
            json.loads(ex['messages'][2]['content'])
        except json.JSONDecodeError:
            errors += 1

    # Count by category
    soap_no = len(SOAP_EXTRACTION_NO) + len(SOAP_EXTRA_NO)
    triage_no = len(TRIAGE_NO) + len(TRIAGE_EXTRA_NO)
    treat_no = len(TREATMENT_PLAN_NO) + len(TREATMENT_PLAN_EXTRA_NO)
    quick_no = len(QUICK_FILL_NO) + len(QUICK_FILL_EXTRA_NO)
    comm_no = len(PATIENT_COMM_NO) + len(PATIENT_COMM_EXTRA_NO)
    no_count = soap_no + triage_no + treat_no + quick_no + comm_no

    soap_en = len(SOAP_EXTRACTION_EN) + len(SOAP_EXTRA_EN)
    triage_en = len(TRIAGE_EN) + len(TRIAGE_EXTRA_EN)
    treat_en = len(TREATMENT_PLAN_EN) + len(TREATMENT_PLAN_EXTRA_EN)
    quick_en = len(QUICK_FILL_EN) + len(QUICK_FILL_EXTRA_EN)
    comm_en = len(PATIENT_COMM_EN) + len(PATIENT_COMM_EXTRA_EN)
    en_count = soap_en + triage_en + treat_en + quick_en + comm_en

    print(f"Generated {len(examples)} structured output training examples")
    print(f"  Norwegian: {no_count}")
    print(f"    SOAP extraction: {soap_no}")
    print(f"    Triage: {triage_no}")
    print(f"    Treatment plans: {treat_no}")
    print(f"    Quick-fill: {quick_no}")
    print(f"    Patient comms: {comm_no}")
    print(f"  English: {en_count}")
    print(f"    SOAP extraction: {soap_en}")
    print(f"    Triage: {triage_en}")
    print(f"    Treatment plans: {treat_en}")
    print(f"    Quick-fill: {quick_en}")
    print(f"    Patient comms: {comm_en}")
    print(f"  JSON validation errors: {errors}")
    print(f"  Output: {output_file}")


if __name__ == '__main__':
    main()
