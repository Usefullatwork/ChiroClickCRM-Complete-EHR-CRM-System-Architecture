#!/usr/bin/env python3
"""
Generate ICPC-2 diagnosis code training data for ChiroClick AI models.

Creates ~500 examples mapping clinical presentations to correct ICPC-2 codes,
covering all common chiropractic conditions. Output format is ChatML JSONL.

Categories:
  - Musculoskeletal (L01-L99): ~250 examples
  - Neurological (N01-N99): ~80 examples
  - General/Symptoms (A/D/H/R/K): ~80 examples
  - Differential diagnosis: ~50 examples
  - Structured JSON output: ~40 examples

Usage:
    python scripts/generate_icpc2_codes.py
    python scripts/generate_icpc2_codes.py --count  # Just count, don't write
"""

import json
import os
import sys
from pathlib import Path

OUTPUT_FILE = Path(__file__).parent.parent / 'data' / 'mined' / 'icpc2-codes-synthetic.jsonl'

SYSTEM_PROMPT_NO = (
    "Du er en diagnosekode-spesialist for kiropraktikk i Norge. "
    "Du hjelper med å velge riktige ICPC-2 koder basert på kliniske funn og symptomer. "
    "Gi alltid koden først, deretter kort forklaring."
)

SYSTEM_PROMPT_EN = (
    "You are a diagnosis code specialist for chiropractic in Norway. "
    "You help select the correct ICPC-2 codes based on clinical findings and symptoms. "
    "Always provide the code first, then a brief explanation."
)

SYSTEM_PROMPT_JSON = (
    "Du er en klinisk AI-assistent som returnerer strukturerte diagnosekoder. "
    "Svar alltid i JSON-format med feltene: primary_code, primary_label, "
    "differential_codes (array), og clinical_reasoning."
)

# =============================================================================
# MUSCULOSKELETAL — SPINE (L01-L03, L83-L86)
# =============================================================================

SPINE_EXAMPLES_NO = [
    # Low back
    ("Pasient med akutte korsryggsmerter etter løft, ingen utstråling. Foreslå ICPC-2 kode.",
     "L03 — Korsryggsmerter uten utstråling\n\nDette er den primære koden for uspesifikke korsryggsmerter. Differensialdiagnoser:\n- L86 (Lumbalt ryggsyndrom med utstråling) — hvis radikulopati utvikles\n- L84 (Ryggsyndromer uten utstråling) — alternativ for mer kronisk bilde"),
    ("Korsryggsmerter med utstråling til venstre bein, positiv SLR 40°. ICPC-2?",
     "L86 — Lumbalt ryggsyndrom med utstråling\n\nPositiv SLR med radikulær utstråling indikerer nerverotaffeksjon. Relevante tilleggskoder:\n- L03 kan brukes som tillegg for smertekomponenten\n- N92 (Trigeminusnevralgi) er IKKE relevant her"),
    ("Kroniske korsryggsmerter i 6 måneder, MR viser degenerative forandringer. Kode?",
     "L84 — Ryggsyndromer uten utstråling\n\nKronisk korsryggsmerte med degenerative forandringer. L84 brukes når det ikke er radikulopati. Alternativt:\n- L03 for mer akutt/uspesifikk presentasjon\n- L76 (Annen/multiple brudd) er IKKE relevant"),
    ("Akutt lumbago, pasient klarer ikke å rette seg opp. ICPC-2 kode?",
     "L03 — Korsryggsmerter uten utstråling\n\nAkutt lumbago med bevegelsesrestriksjon. L03 er primærkode for akutte, uspesifikke korsryggsmerter."),
    ("Lumbal skiveprolaps L4-L5 bekreftet på MR, med S1-radikulopati. Kode?",
     "L86 — Lumbalt ryggsyndrom med utstråling\n\nVerifisert skiveprolaps med radikulopati kodes L86. Spesifiser nivå (L4-L5) og affisert nerverot (S1) i fritekst."),
    ("Spinal stenose i korsryggen med claudicatio-lignende symptomer. ICPC-2?",
     "L86 — Lumbalt ryggsyndrom med utstråling\n\nSpinal stenose med nevrogen claudicatio kodes L86. Nevrogen claudicatio (smerter ved gange, bedring ved forover-bøyning) skiller dette fra vaskulær claudicatio (K92)."),
    ("Bekkenleddsmerter/SI-leddsdysfunksjon etter graviditet. Kode?",
     "L03 — Korsryggsmerter uten utstråling\n\nBekkenleddsmerter kodes primært L03. SI-leddsdysfunksjon er en klinisk diagnose som faller under korsryggkategorien i ICPC-2."),
    ("Isjas med drop-foot, akutt debut. ICPC-2?",
     "L86 — Lumbalt ryggsyndrom med utstråling\n\nIsjas med motorisk utfall (drop-foot) er L86. NB: Drop-foot er et alvorlig funn som kan indikere cauda equina — vurder akutt henvisning.\n\nRøde flagg: Kontroller blære-/tarmfunksjon."),
    # Neck
    ("Nakkesmerter etter bilulykke (whiplash), 3 dager siden. ICPC-2?",
     "L83 — Nakkesyndromer\n\nWhiplash-relaterte nakkesmerter kodes L83. WAD (Whiplash-Associated Disorder) graderes 0-IV.\n- L01 (Nakkesymptom/plage) kan også brukes for akutt fase\n- Vurder N01 (Hodepine) som tilleggskode ved samtidig hodepine"),
    ("Kroniske nakkesmerter med cervikogen hodepine. Kode?",
     "L83 — Nakkesyndromer\n\nPrimærkode L83 for nakkesyndromer. Tilleggskode N95 (Spenningshodepine) eller N89 (Migrene) avhengig av hodepinekarakter.\n\nCervikogen hodepine er en klinisk diagnose — bruk L83 som primær, N95 som sekundær."),
    ("Nakke med utstråling til høyre arm, dermatom C6. ICPC-2?",
     "L83 — Nakkesyndromer\n\nCervikal radikulopati med C6-dermatomaffeksjon kodes L83. Ved radikulære symptomer i arm kan man vurdere:\n- N92 for nerverotaffeksjon\n- L83 er primærkode for cervikalt opphav"),
    ("Torticollis/skjev nakke, akutt debut hos ung voksen. Kode?",
     "L83 — Nakkesyndromer\n\nAkutt torticollis kodes L83. Vanligvis muskulær/leddrelatert årsak hos unge voksne."),
    # Thoracic
    ("Brystsmerter med opphav fra brystsøylen, costovertebral dysfunksjon. ICPC-2?",
     "L84 — Ryggsyndromer uten utstråling\n\nThorakal ryggsyndrom og costovertebral dysfunksjon kodes L84. NB: Utelukk kardiale årsaker (K01/K74) ved thorakale smerter."),
    ("Thorakal smerte med interkostal neuralgi, bånddermatomfordeling. Kode?",
     "L84 — Ryggsyndromer uten utstråling\n\nThorakal smerte med interkostal komponent kodes primært L84. Alternativt:\n- N99 (Annen nevrologisk lidelse) for nevralgikomponenten\n- L84 er oftest primærkode når opphav er spinalt"),
    ("Scheuermanns sykdom hos tenåring med thorakal kyfose. ICPC-2?",
     "L85 — Ervervet deformitet av ryggsøyle\n\nScheuermanns sykdom (juvenil kyfose) kodes L85 — ervervet deformitet."),
]

SPINE_EXAMPLES_EN = [
    ("Patient with acute low back pain after lifting, no radiation. Suggest ICPC-2 code.",
     "L03 — Low back symptom/complaint\n\nPrimary code for non-specific low back pain without radiation. Differential codes:\n- L86 (Lumbar disc lesion/radiation) — if radiculopathy develops\n- L84 (Back syndrome without radiation) — for more chronic presentation"),
    ("Low back pain with left leg radiation, positive SLR at 40°. ICPC-2?",
     "L86 — Lumbar disc lesion with radiation\n\nPositive SLR with radicular pain indicates nerve root involvement. L86 is the primary code for lumbar radiculopathy."),
    ("Neck pain after car accident (whiplash), 3 days ago. ICPC-2?",
     "L83 — Neck syndrome\n\nWhiplash-related neck pain is coded L83. WAD grading 0-IV applies.\n- Consider N01 (Headache) as additional code if concurrent headache"),
    ("Cervical radiculopathy with C7 dermatomal distribution. Code?",
     "L83 — Neck syndrome\n\nCervical radiculopathy with C7 involvement coded L83. For the neural component, N92 may be added as secondary."),
    ("Thoracic pain from costovertebral dysfunction. ICPC-2?",
     "L84 — Back syndrome without radiation\n\nThoracic pain of spinal origin coded L84. Important: rule out cardiac causes (K01/K74) for chest pain."),
]

# =============================================================================
# MUSCULOSKELETAL — EXTREMITIES (L08-L99)
# =============================================================================

EXTREMITY_EXAMPLES_NO = [
    # Shoulder
    ("Skulder impingement syndrom med rotator cuff tendinopati. ICPC-2?",
     "L92 — Skulder syndrom\n\nImpingement og rotator cuff tendinopati kodes L92. Dette dekker:\n- Subakromialt impingement\n- Rotator cuff tendinitt/tendinopati\n- Supraspinatustendinitt\n- Bursitt subdeltoidea"),
    ("Frossen skulder / adhesiv kapsulitt. Kode?",
     "L92 — Skulder syndrom\n\nAdhesiv kapsulitt (frossen skulder) kodes L92. Kjennetegnes av progressivt bevegelsestap i alle retninger."),
    ("Rotator cuff ruptur, bekreftet med ultralyd. ICPC-2?",
     "L92 — Skulder syndrom\n\nRotator cuff ruptur kodes L92. Grad av ruptur (partiell/total) og sene (supraspinatus etc.) dokumenteres i fritekst."),
    ("Akromioklavikularleddsartrose med smerter ved abduksjon over 90°. Kode?",
     "L92 — Skulder syndrom\n\nAC-leddsartrose kodes L92. Spesifiser AC-ledd i fritekst. Alternativt L91 (Artrose annet sted) for ren artrosediagnose."),
    # Hip
    ("Hoftesmerter med klinisk artrose, redusert ROM. ICPC-2?",
     "L89 — Hofteartrose\n\nKlinisk hofteartrose med redusert bevegelsesutslag kodes L89. Spesifikk artrosekode for hofte."),
    ("Trochantertendinopati / gluteal tendinopati. Kode?",
     "L13 — Hoftesymptom/plage\n\nTrochantertendinopati (tidligere kalt trochanteritt/bursitt) kodes L13 som hoftesymptom. Alternativt L92 hvis betraktet som bursitt."),
    ("Piriformis syndrom med isjas-lignende symptomer. ICPC-2?",
     "L13 — Hoftesymptom/plage\n\nPiriformis syndrom kodes L13. Det er viktig å skille dette fra lumbal radikulopati (L86). Piriformis-test positiv, SLR negativ er typisk."),
    # Knee
    ("Knesmerter med klinisk meniskskade, positiv McMurray. ICPC-2?",
     "L96 — Akutt indre skade kne\n\nMeniskskade med positiv McMurray kodes L96 for akutt skade. For kronisk/degenerativ menisklesjon:\n- L90 (Kneartrose) hvis degenerativ komponent dominerer"),
    ("Patellofemoral smertesyndrom hos ung løper. Kode?",
     "L15 — Kneplage/symptom\n\nPatellofemoral smertesyndrom (PFSS) kodes L15. Vanlig hos unge aktive pasienter."),
    ("Kneartrose, Kellgren-Lawrence grad 3. ICPC-2?",
     "L90 — Kneartrose\n\nKneartrose kodes L90. KL grad 3 indikerer moderat-alvorlig artrose."),
    # Ankle/foot
    ("Akutt ankeldistorsjon (forstuet ankel), laterale ligamenter. ICPC-2?",
     "L77 — Forstuing/distorsjon ankel\n\nLateral ankeldistorsjon kodes L77. Grader: I (strekk), II (partiell ruptur), III (total ruptur)."),
    ("Plantar fasciitt med morgenstivhet i hælen. Kode?",
     "L17 — Fotsymptom/plage\n\nPlantar fasciitt kodes L17. Klassisk presentasjon med morgenstivhet og smerte ved første steg."),
    ("Hallux valgus med smerter. ICPC-2?",
     "L98 — Ervervet deformitet av ekstremitet\n\nHallux valgus kodes L98. For smertekomponenten kan L17 brukes som tillegg."),
    # Elbow/wrist/hand
    ("Lateral epikondylitt (tennisalbue). ICPC-2?",
     "L93 — Albuesyndrom\n\nLateral epikondylitt kodes L93. Provoserende test: smerte ved resisted wrist extension."),
    ("Karpaltunnelsyndrom med parestesier i finger 1-3. Kode?",
     "L93 — Albuesyndrom\n\nKarpaltunnelsyndrom kodes N93 (Karpaltunnelsyndrom). NB: Dette er en N-kode (nevrologisk), ikke L-kode.\n\nKorrekt kode: N93 — Karpaltunnelsyndrom"),
    ("De Quervains tenosynovitt. ICPC-2?",
     "L12 — Hånd/fingersymptom\n\nDe Quervains tenosynovitt kodes L12. Positiv Finkelsteen-test er diagnostisk."),
    ("Dupuytrens kontraktur. Kode?",
     "L99 — Annen sykdom muskel-skjelettsystemet\n\nDupuytrens kontraktur kodes L99 (Annen muskel-skjelett sykdom). Palmar fibromatose med fleksjonskontraktur."),
]

EXTREMITY_EXAMPLES_EN = [
    ("Shoulder impingement syndrome with rotator cuff tendinopathy. ICPC-2?",
     "L92 — Shoulder syndrome\n\nImpingement and rotator cuff tendinopathy coded L92. Covers subacromial impingement, rotator cuff tendinitis, and supraspinatus tendinitis."),
    ("Frozen shoulder / adhesive capsulitis. Code?",
     "L92 — Shoulder syndrome\n\nAdhesive capsulitis (frozen shoulder) coded L92. Characterized by progressive loss of movement in all directions."),
    ("Hip osteoarthritis with reduced ROM. ICPC-2?",
     "L89 — Hip osteoarthritis\n\nClinical hip OA with reduced range of motion coded L89."),
    ("Knee pain with meniscal tear, positive McMurray. ICPC-2?",
     "L96 — Acute internal injury knee\n\nMeniscal injury with positive McMurray coded L96."),
    ("Lateral epicondylitis (tennis elbow). ICPC-2?",
     "L93 — Elbow syndrome\n\nLateral epicondylitis coded L93. Provocative test: pain on resisted wrist extension."),
    ("Carpal tunnel syndrome with paresthesias in digits 1-3. Code?",
     "N93 — Carpal tunnel syndrome\n\nCTS is coded N93 — a neurological code, not musculoskeletal. Positive Tinel and Phalen tests support diagnosis."),
    ("Plantar fasciitis with morning heel stiffness. ICPC-2?",
     "L17 — Foot symptom/complaint\n\nPlantar fasciitis coded L17. Classic presentation with first-step pain and morning stiffness."),
    ("Ankle sprain, lateral ligaments. ICPC-2?",
     "L77 — Sprain/strain ankle\n\nLateral ankle sprain coded L77. Grade I-III depending on ligament integrity."),
]

# =============================================================================
# NEUROLOGICAL (N01-N99)
# =============================================================================

NEURO_EXAMPLES_NO = [
    # Headache
    ("Migrene med aura, visuell. ICPC-2?",
     "N89 — Migrene\n\nMigrene med visuell aura kodes N89. Aura inkluderer: flimmerskotom, zigzag-linjer, synsfeltutfall."),
    ("Spenningshodepine, episodisk. Kode?",
     "N95 — Spenningshodepine\n\nEpisodisk spenningshodepine kodes N95. Bilateral, trykkende/strammende karakter."),
    ("Cervikogen hodepine med referert smerte fra nakke. ICPC-2?",
     "N95 — Spenningshodepine\n\nCervikogen hodepine kodes N95 i ICPC-2 (det finnes ingen egen kode). Alternativt L83 som primær med N95 som sekundær.\n\nNB: Cervikogen hodepine er en klinisk diagnose basert på CGH-kriterier."),
    ("Klasehodepine (cluster headache) med periorbital smerte. Kode?",
     "N89 — Migrene\n\nKlasehodepine kodes N89 i ICPC-2 (samles under migrene-kategorien). I ICD-10 er det G44.0."),
    ("Medikamentoverforbrukshodepine (MOH). ICPC-2?",
     "N95 — Spenningshodepine\n\nMOH kodes N95. Definisjon: hodepine ≥15 dager/mnd med overforbruk av akuttmedisiner ≥3 mnd."),
    ("Trigeminal nevralgi med skyteliknende smerter i ansikt. Kode?",
     "N92 — Trigeminusnevralgi\n\nTrigeminal nevralgi kodes N92. Karakteristisk: intense, korte (sekunder) smerter i trigeminusområdet."),
    # Vertigo/dizziness
    ("BPPV (benign paroksysmal posisjonsvertigo). ICPC-2?",
     "H82 — Vertigo-syndrom\n\nBPPV kodes H82. Positiv Dix-Hallpike er diagnostisk. Behandles med Epley-manøver."),
    ("Cervikogen svimmelhet med nakkesmerter. Kode?",
     "N17 — Vertigo/svimmelhet\n\nCervikogen svimmelhet kodes N17. Svimmelhet assosiert med nakkebevegelser. Differensier fra:\n- H82 (BPPV) med Dix-Hallpike\n- H81 (Ménières) med hørselstap + tinnitus"),
    ("Vestibulær migrene med svimmelhet og hodepine. ICPC-2?",
     "N89 — Migrene\n\nVestibulær migrene kodes primært N89 (Migrene). Tilleggskode H82 eller N17 for svimmelhet.\n\nBarány Society kriterier: ≥5 episoder, vestibulære symptomer, migrene-historie."),
    # Nerve entrapment
    ("Karpaltunnelsyndrom med nattlig parestesi. ICPC-2?",
     "N93 — Karpaltunnelsyndrom\n\nKTS kodes N93. Klassisk: nattlig parestesi i medianus-distribusjon (finger 1-3 + radial halvdel av 4)."),
    ("Thoracic outlet syndrom med vaskulære og nevrologiske symptomer. Kode?",
     "N99 — Annen nevrologisk lidelse\n\nThoracic outlet syndrom kodes N99. Ingen spesifikk ICPC-2 kode. Spesifiser type (vaskulær, neurogen, kombinert) i fritekst."),
    ("Perifer nevropati i føtter, diabetiker. ICPC-2?",
     "N94 — Perifer nevritt/nevropati\n\nDiabetisk perifer nevropati kodes N94. Tilleggskode T90 (Diabetes) for underliggende årsak."),
]

NEURO_EXAMPLES_EN = [
    ("Migraine with visual aura. ICPC-2?",
     "N89 — Migraine\n\nMigraine with visual aura coded N89. Aura includes: scintillating scotoma, zigzag lines, visual field defects."),
    ("Tension-type headache, episodic. Code?",
     "N95 — Tension headache\n\nEpisodic tension-type headache coded N95. Bilateral, pressing/tightening quality."),
    ("BPPV (benign paroxysmal positional vertigo). ICPC-2?",
     "H82 — Vertigo syndrome\n\nBPPV coded H82. Positive Dix-Hallpike is diagnostic. Treated with Epley maneuver."),
    ("Cervicogenic dizziness with neck pain. ICPC-2?",
     "N17 — Vertigo/dizziness\n\nCervicogenic dizziness coded N17. Dizziness associated with neck movements."),
    ("Carpal tunnel syndrome with nocturnal paresthesia. ICPC-2?",
     "N93 — Carpal tunnel syndrome\n\nCTS coded N93. Classic: nocturnal paresthesia in median nerve distribution."),
    ("Vestibular migraine with vertigo and headache. ICPC-2?",
     "N89 — Migraine\n\nVestibular migraine primarily coded N89. Add H82 or N17 for vertigo component."),
]

# =============================================================================
# GENERAL/SYMPTOMS (A, D, H, R, K, P)
# =============================================================================

GENERAL_EXAMPLES_NO = [
    ("Generell tretthet og slitenhet, ingen spesifikk årsak funnet. ICPC-2?",
     "A04 — Tretthet/slapphet\n\nGenerell utmattelse uten kjent årsak kodes A04."),
    ("Brystsmerter, kardial årsak utelukket. ICPC-2?",
     "L04 — Brystsymptom/plage\n\nThorakale smerter av muskuloskeletalopphav, etter at kardial årsak er utelukket. K01 (Hjertesmerter) brukes ved mistanke om kardial årsak."),
    ("Fibromyalgi med utbredte smerter og tretthet. Kode?",
     "L18 — Muskelsmerter\n\nFibromyalgi kodes L18. ACR-kriterier: utbredte smerter ≥3 mnd, WPI ≥7 og SSS ≥5.\n- A04 (Tretthet) kan brukes som tilleggskode\n- P75 (Somatiseringsforstyrelse) er IKKE riktig for fibromyalgi"),
    ("Kjeveleddsdysfunksjon (TMD) med klikking og smerte. ICPC-2?",
     "L07 — Kjevesymptom/plage\n\nTemporomandibulær dysfunksjon kodes L07. TMD inkluderer myofascial smerte, leddplager, og diskusforskyvning."),
    ("Tinnitus uten hørselstap. Kode?",
     "H03 — Øresus/tinnitus\n\nTinnitus kodes H03. Vurder cervikogen komponent (L83) ved samtidig nakkesmerter."),
    ("Svimmelhet med kvalme, uavklart årsak. ICPC-2?",
     "N17 — Vertigo/svimmelhet\n\nUavklart svimmelhet kodes N17. Differensier:\n- H82 for BPPV\n- N89 for vestibulær migrene\n- K99 for kardiovaskulær årsak"),
    ("Angst med muskulære spenninger. Kode?",
     "P74 — Angstlidelse\n\nAngst som primærdiagnose kodes P74. Muskulære spenninger (L18) kan brukes som tilleggskode ved somatisk komponent."),
    ("Søvnvansker hos kronisk smertepasienter. ICPC-2?",
     "P06 — Søvnforstyrrelse\n\nInsomni kodes P06. Når dette er sekundært til kronisk smerte, bruk smertetilstanden som primærkode."),
]

GENERAL_EXAMPLES_EN = [
    ("General fatigue, no specific cause found. ICPC-2?",
     "A04 — Fatigue/tiredness\n\nGeneral fatigue without known cause coded A04."),
    ("Chest pain, cardiac cause ruled out. ICPC-2?",
     "L04 — Chest symptom/complaint\n\nMusculoskeletal chest pain after cardiac cause excluded. K01 for suspected cardiac origin."),
    ("Fibromyalgia with widespread pain and fatigue. Code?",
     "L18 — Muscle pain\n\nFibromyalgia coded L18. ACR criteria: widespread pain ≥3 months."),
    ("TMJ dysfunction with clicking and pain. ICPC-2?",
     "L07 — Jaw symptom/complaint\n\nTemporomandibular dysfunction coded L07."),
    ("Tinnitus without hearing loss. Code?",
     "H03 — Tinnitus\n\nTinnitus coded H03. Consider cervicogenic component (L83) if concurrent neck pain."),
]

# =============================================================================
# DIFFERENTIAL DIAGNOSIS EXAMPLES
# =============================================================================

DIFFERENTIAL_NO = [
    ("Pasient 55 år med nyoppstått korsryggsmerte og vekttap 8 kg siste 3 mnd. Hvilke koder bør vurderes?",
     "Primærkode: L03 — Korsryggsmerter\n\nMEN: Røde flagg er til stede (vekttap). Vurder differensialdiagnoser:\n- A79 (Malign neoplasme NOS) — ukjent vekttap + nyoppstått ryggsmerte hos >50 år\n- L84 (Ryggsyndromer) — kun hvis malignitet er utelukket\n\n⚠ Anbefaling: Blodprøver (SR, CRP, ALP) og bildediagnostikk FØR registrering av L03 alene."),
    ("Ung mann med korsryggsmerter, morgenstivhet >45 min, bedring med aktivitet. Koder?",
     "Vurder: L84 — Ryggsyndromer (primær)\n\nMEN: Inflammatorisk ryggsmertemønster (ung mann, morgenstivhet >45 min, bedring med aktivitet) bør utløse:\n- L88 (Revmatoid artritt) — dersom Bekhterevs sykdom mistenkes\n- Eller L84 med merknad om inflammatorisk bilde\n\nAnbefaling: HLA-B27, SR, CRP, røntgen SI-ledd."),
    ("60 år gammel kvinne med plutselig hodepine og synsforstyrrelser. Koder?",
     "⚠ AKUTT: Utelukk røde flagg først!\n\nMulige koder avhengig av funn:\n- N89 (Migrene) — kun etter at alvorlige årsaker er utelukket\n- K89 (Forbigående cerebral iskemi) — TIA/slag\n- F99 (Øyesykdom annen) — ved isolert øyeproblematikk\n\nPrioritert handling: Akutt vurdering for temporalarteritt (GCA) hos >50 med nyoppstått hodepine."),
    ("Barn 12 år med ryggsmerte etter gymnastikk. Koder?",
     "L03 — Korsryggsmerter (primær)\n\nDifferensialdiagnoser hos barn/ungdom:\n- L85 (Ervervet deformitet ryggsøyle) — Scheuermann\n- L82 (Medfødt deformitet) — spondylolyse\n- L03 — muskulær/mekanisk årsak (vanligst)\n\nNB: Ryggsmerte hos barn <16 krever grundigere utredning enn hos voksne."),
    ("Skuldersmerte som forverres om natten, pasient kan ikke ligge på skulderen. ICPC-2?",
     "L92 — Skulder syndrom (primær)\n\nNattsmerte i skulder er vanlig ved:\n- Rotator cuff tendinopati/ruptur (L92)\n- Adhesiv kapsulitt (L92)\n- MEN: Nattsmerte kan også indikere malignitet\n\nHvis smerten er konstant og progredierende: Vurder A79 og bildediagnostikk."),
    # Multi-system: headache + neck + vertigo
    ("Pasient med hodepine, nakkesmerter, og svimmelhet. Hva er primærkoden?",
     "Primærkode: L83 — Nakkesyndromer\n\nNår hodepine, nakkesmerter og svimmelhet opptrer samtidig, er nakken oftest primærfokus. Koding:\n- L83 (primær) — nakkesyndromer med cervikogen komponent\n- N95 (sekundær) — spenningshodepine/cervikogen hodepine\n- N17 (sekundær) — cervikogen svimmelhet\n\nBegrunnelse: Cervikalt opphav forklarer alle tre symptomene."),
    # Low back + hip confusion
    ("Pasient med smerter i korsrygg og lyske/hofte. Er dette L03 eller L13?",
     "Klinisk vurdering nødvendig:\n\n• Hvis smerter starter i korsrygg og refererer til lyske → L03 (Korsryggsmerter) eller L86 (med utstråling)\n• Hvis primær smerte er i lyske/hofte med redusert innadrotasjon → L89 (Hofteartrose) eller L13 (Hoftesymptom)\n\nNøkkeltester:\n- Patrick/FABER-test: Positiv → hofte\n- SLR/Lasègue: Positiv → korsrygg/nerve\n- Redusert hofterotasjon → hofte\n\nFeil: Å kode L03 når pasienten egentlig har hofteartrose."),
    # Chest pain differential
    ("Mann 50 år med akutte brystsmerter og dyspné. Hvilke koder vurderes?",
     "⚠ AKUTT: Kardial årsak MÅ utelukkes først!\n\nPrioritert differensialdiagnostikk:\n1. K74 (Iskemisk hjertesykdom) — akutt koronarsyndrom\n2. K01 (Hjertesmerter) — uspesifikk kardial smerte\n3. R02 (Kortpustethet/dyspné) — tilleggskode\n4. L04 (Brystsymptom) — KUN etter at kardiale og pulmonale årsaker er utelukket\n5. L84 (Ryggsyndromer) — costovertebral dysfunksjon, SISTE diagnose\n\nKiropraktorer: Henvis AKUTT til legevakt/113 ved mistanke om AKS."),
    # Knee: meniscus vs arthritis vs patellofemoral
    ("45 år gammel kvinne med knesmerter, krepitasjon og låsning. L90 eller L96?",
     "Vurder alder og mekanisme:\n\n• L90 (Kneartrose) — 45 år, krepitasjon, gradvis debut, Kellgren-Lawrence\n• L96 (Akutt indre skade kne) — traumatisk debut, positiv McMurray, låsningsepisoder\n• L15 (Kneplage) — uspesifikke smerter uten artrose eller akutt skade\n\nI dette tilfellet: Krepitasjon + låsning hos 45-åring kan være BEGGE (degenerativ menisklesjon MED begynnende artrose). Primærkode L90 med L96 som sekundær ved bekreftet meniskpatologi."),
    # Headache: migraine vs tension vs cervicogenic
    ("Pasient med ensidig hodepine, kvalme, og lysoverfølsomhet. N89 eller N95?",
     "N89 — Migrene\n\nEnsidig hodepine + kvalme + fotosensitivitet oppfyller IHS-kriterier for migrene. N89 er riktig.\n\nN95 (Spenningshodepine) er FEIL her fordi:\n- Spenningshodepine er bilateral\n- Spenningshodepine har trykkende (ikke pulserende) karakter\n- Spenningshodepine gir sjelden kvalme eller fotosensitivitet\n\nDifferensier:\n- Ensidig + pulserende + kvalme → N89 (Migrene)\n- Bilateral + trykkende + uten kvalme → N95 (Spenningshodepine)\n- Ensidig + fra nakke + provosert av nakkebevegelse → L83 (Cervikogen hodepine)"),
    # Wrist: CTS vs cervical radiculopathy
    ("Parestesier i hånden, spesielt om natten. N93 eller L83?",
     "Differensier nøye:\n\n• N93 (Karpaltunnelsyndrom) — parestesier i finger 1-3, nattlige symptomer, positiv Tinel/Phalen\n• L83 (Nakkesyndromer) — C6/C7 radikulopati kan gi lignende parestesier, men følger dermatomfordeling\n\nNøkkelforskjeller:\n- Isolert hånd + nattlig → N93 (CTS)\n- Arm + nakke + dermatomfordeling → L83 (cervikal radikulopati)\n- Begge kan sameksistere → «double crush» — bruk N93 primær, L83 sekundær\n\nFalsk positiv: Tinel kan være positiv ved radikulopati!"),
    # Ankle vs foot vs knee referred
    ("Smerter lateralt i ankel etter inversjonstraume, men også smerter i kne. Koder?",
     "Primærkode: L77 — Forstuing/distorsjon ankel\n\nLateral ankeldistorsjon er primærskaden. Knesmerter etter ankeltraume kan skyldes:\n- Maisonneuve-fraktur (L76) — sjekk proksimale fibula!\n- Kompensatorisk belastning\n- Peroneusskade\n\n⚠ Ottawa ankelregler: Røntgen ved benpalpasjon smerter. Palpér ALLTID proksimale fibula ved ankeldistorsjon.\n\nKoding: L77 (primær), L15 (sekundær for kne) kun hvis knesymptomer vedvarer."),
    # Shoulder + neck overlap
    ("Pasient med smerter i skulder og nakke, usikker på om det er C5-radikulopati eller skulderpatologi. Koder?",
     "Klinisk differensiering er avgjørende:\n\n• L92 (Skulder syndrom) — smerte ved aktive skuldertester (Neer, Hawkins, Jobe)\n• L83 (Nakkesyndromer) — smerte provosert av nakke-ROM, Spurling positiv\n• Begge — L83 primær + L92 sekundær\n\nNøkkeltester:\n- Spurling positiv → cervikal (L83)\n- Apprehension/Neer/Hawkins positiv → skulder (L92)\n- Smertefri skulder-ROM med positiv Spurling → cervikal referert smerte, KUN L83\n\nVanlig feil: Å kode L92 når smerten egentlig er referert fra nakke."),
    # Headache + jaw
    ("Pasient med hodepine og kjeveleddssmerter, krepitasjon i TMJ. Primærkode?",
     "Primærkode: L07 — Kjevesymptom/plage\n\nTMD (temporomandibulær dysfunksjon) kan gi referert hodepine. Koding:\n- L07 (primær) — TMD med krepitasjon\n- N95 (sekundær) — hodepinekomponent\n\nBegrunnelse: Når TMD er årsaken til hodepinen, er L07 primær.\n\nDifferensier fra:\n- N89 (Migrene) — hvis hodepinen har migrenøse trekk uavhengig av TMD\n- N92 (Trigeminusnevralgi) — skytelignende ansiktssmerter uten TMJ-funn"),
    # Bilateral leg symptoms
    ("Bilateral beinsmerte og stivhet etter lang gange, bedring ved hvile og forover-bøyning. Koder?",
     "L86 — Lumbalt ryggsyndrom med utstråling\n\nBilateral beinsmerte forverret av gange og bedret av forover-bøyning er klassisk nevrogen claudicatio ved lumbal spinal stenose.\n\nDifferensier fra vaskulær claudicatio:\n- Nevrogen (L86): Bedres ved sitting/forover-bøyning, bilateral, dermatomal\n- Vaskulær (K92): Bedres ved stående hvile, distalt-proksimalt, svake pulser\n\nFeil: Å kode K92 (Perifere karsykdommer) når det er nevrogen claudicatio."),
    # Fibromyalgia vs widespread pain
    ("Utbredte muskel- og leddsmerter i over 3 måneder, 14 av 18 tender points positive. Koder?",
     "L18 — Muskelsmerter\n\nFibromyalgi kodes L18 i ICPC-2 (ingen spesifikk fibromyalgikode). ACR 2010 kriterier:\n- WPI ≥7 og SSS ≥5\n- Symptomer ≥3 måneder\n- Ingen annen forklaring\n\nTilleggskoder:\n- A04 (Tretthet) — ved fatigue-komponent\n- P06 (Søvnforstyrrelse) — ved søvnvansker\n\nFeil:\n- P75 (Somatiseringsforstyrrelse) er IKKE riktig for fibromyalgi\n- L99 (Annen muskel-skjelett) kan brukes, men L18 er mer presis"),
    # Foot: plantar fasciitis vs tarsal tunnel vs S1 radiculopathy
    ("Smerter under foten, spesielt ved morgenens første skritt. Kan det være mer enn plantar fasciitt?",
     "Primærkode: L17 — Fotsymptom/plage (plantar fasciitt)\n\nMEN differensier:\n- L17 (Plantar fasciitt) — smerte ved medialt calcaneus, morgenstivhet, positiv Windlass\n- N93 (Tarsaltunnelsyndrom) — brennende/prikkende smerter, positiv Tinel bak mediale malleol\n- L86 (S1 radikulopati) — referert hælsmerte, positiv SLR, redusert akillesrefleks\n\nNøkkelforskjell: Plantar fasciitt = mekanisk smerte. Tarsaltunnel = nevropatisk smerte (brennende). S1 = ryggsmerte + beinsmerte."),
    # Elbow: lateral vs medial epicondylitis vs radial tunnel
    ("Lateral albuesmerter som ikke responderer på behandling. Kan det være noe annet enn tennisalbue?",
     "Revurder diagnosen:\n\n• L93 (Lateral epikondylitt) — smerte ved Cozen test, palpasjon over lateral epikondyl\n• N99 (Radialtunnelsyndrom) — smerte 3-4 cm distalt for lateral epikondyl, PIN-kompresjon\n• L93 (Medial epikondylitt) — smerte medialt, golfalbue\n• L91 (Artrose) — ved redusert albue-ROM og krepitasjon\n\nRadialtunnelsyndrom (N99) er ofte feildiagnostisert som lateral epikondylitt. Nøkkeltest: Smerte ved resisted supinasjon av underarmen (ikke bare wrist extension)."),
]

DIFFERENTIAL_EN = [
    ("55-year-old with new onset low back pain and 8kg weight loss over 3 months. Codes?",
     "Primary: L03 — Low back symptom\n\nBUT: Red flags present (weight loss). Differential codes:\n- A79 (Malignant neoplasm NOS) — unexplained weight loss + new back pain in >50\n- L84 (Back syndrome) — only if malignancy excluded\n\n⚠ Recommend: Blood tests (ESR, CRP, ALP) and imaging BEFORE coding L03 alone."),
    ("Young man with low back pain, morning stiffness >45 min, improves with activity. Codes?",
     "Consider: L84 — Back syndrome (primary)\n\nBUT: Inflammatory back pain pattern. Consider:\n- L88 (Rheumatoid arthritis) if ankylosing spondylitis suspected\n- Recommend: HLA-B27, ESR, CRP, SI joint imaging."),
    ("Shoulder pain worse at night, cannot lie on affected side. ICPC-2?",
     "L92 — Shoulder syndrome (primary)\n\nNight pain in shoulder common with rotator cuff pathology (L92). However, constant progressive night pain may indicate malignancy — consider A79 and imaging."),
    # Multi-system: headache + neck + vertigo
    ("Patient with headache, neck pain, and dizziness. What is the primary code?",
     "Primary code: L83 — Neck syndrome\n\nWhen headache, neck pain and dizziness co-occur, cervical origin is most likely. Coding:\n- L83 (primary) — neck syndrome with cervicogenic component\n- N95 (secondary) — tension/cervicogenic headache\n- N17 (secondary) — cervicogenic dizziness\n\nRationale: Cervical origin explains all three symptoms."),
    # Low back + hip
    ("Patient with pain in low back and groin/hip. Is this L03 or L13?",
     "Clinical assessment needed:\n\n- Pain starting in low back referring to groin → L03 or L86 (with radiation)\n- Primary groin/hip pain with reduced internal rotation → L89 (Hip OA) or L13 (Hip symptom)\n\nKey tests:\n- Patrick/FABER positive → hip origin\n- SLR positive → lumbar/nerve origin\n- Reduced hip rotation → hip origin\n\nError: Coding L03 when patient actually has hip osteoarthritis."),
    # Chest pain
    ("50-year-old male with acute chest pain and dyspnea. Which codes to consider?",
     "ACUTE: Cardiac cause MUST be excluded first!\n\nPrioritized differential:\n1. K74 (Ischemic heart disease) — acute coronary syndrome\n2. K01 (Heart pain) — non-specific cardiac\n3. R02 (Shortness of breath) — additional code\n4. L04 (Chest symptom) — ONLY after cardiac/pulmonary causes excluded\n5. L84 (Back syndrome) — costovertebral, LAST diagnosis\n\nChiropractors: Refer IMMEDIATELY to emergency services if ACS suspected."),
    # Migraine vs tension vs cervicogenic
    ("Patient with unilateral headache, nausea, and photosensitivity. N89 or N95?",
     "N89 — Migraine\n\nUnilateral headache + nausea + photosensitivity meets IHS criteria for migraine.\n\nN95 (Tension headache) is WRONG here because:\n- Tension headache is bilateral\n- Tension headache has pressing (not pulsating) quality\n- Tension headache rarely causes nausea or photosensitivity\n\nDifferentiate:\n- Unilateral + pulsating + nausea → N89 (Migraine)\n- Bilateral + pressing + no nausea → N95 (Tension)\n- Unilateral + from neck + provoked by neck movement → L83 (Cervicogenic)"),
    # CTS vs cervical radiculopathy
    ("Hand paresthesias, especially at night. N93 or L83?",
     "Differentiate carefully:\n\n- N93 (Carpal tunnel) — paresthesias digits 1-3, nocturnal, positive Tinel/Phalen\n- L83 (Neck syndrome) — C6/C7 radiculopathy gives similar paresthesias but follows dermatomal pattern\n\nKey differences:\n- Isolated hand + nocturnal → N93 (CTS)\n- Arm + neck + dermatomal → L83 (cervical radiculopathy)\n- Both can coexist → 'double crush' — N93 primary, L83 secondary"),
    # Knee: meniscus vs OA
    ("45-year-old woman with knee pain, crepitus and locking. L90 or L96?",
     "Consider age and mechanism:\n\n- L90 (Knee OA) — age 45, crepitus, gradual onset\n- L96 (Acute internal knee injury) — traumatic onset, positive McMurray, locking\n- L15 (Knee symptom) — non-specific pain\n\nIn this case: Crepitus + locking at 45 may be BOTH (degenerative meniscal lesion WITH early OA). Primary L90, secondary L96 if meniscal pathology confirmed."),
    # Bilateral leg symptoms
    ("Bilateral leg pain and stiffness after walking, improving with rest and forward flexion. Codes?",
     "L86 — Lumbar disc with radiation\n\nBilateral leg pain worsened by walking and improved by forward flexion is classic neurogenic claudication from lumbar spinal stenosis.\n\nDifferentiate from vascular claudication:\n- Neurogenic (L86): Improves with sitting/flexion, bilateral, dermatomal\n- Vascular (K92): Improves with standing rest, distal-to-proximal, weak pulses\n\nError: Coding K92 (Peripheral vascular disease) when it is neurogenic claudication."),
]

# =============================================================================
# STRUCTURED JSON OUTPUT EXAMPLES
# =============================================================================

JSON_EXAMPLES_NO = [
    ("Pasient med korsryggsmerter og utstråling til venstre bein. Gi diagnosekoder i JSON-format.",
     '{"primary_code": "L86", "primary_label": "Lumbalt ryggsyndrom med utstråling", "differential_codes": [{"code": "L03", "label": "Korsryggsmerter", "reason": "Smertekomponent uten utstråling"}, {"code": "N94", "label": "Perifer nevritt", "reason": "Ved perifer nerveaffeksjon"}], "clinical_reasoning": "Radikulær utstråling med dermatomfordeling indikerer nerverotaffeksjon. L86 er primærkode."}'),
    ("Nakkesmerter med hodepine. JSON diagnosekoder.",
     '{"primary_code": "L83", "primary_label": "Nakkesyndromer", "differential_codes": [{"code": "N95", "label": "Spenningshodepine", "reason": "Sekundær hodepinekomponent"}, {"code": "N89", "label": "Migrene", "reason": "Hvis migrenøs karakter"}], "clinical_reasoning": "Cervikogen hodepine med nakkeopphav. L83 primær, N95 sekundær."}'),
    ("Knesmerter hos 65-åring, redusert ROM. JSON diagnosekoder.",
     '{"primary_code": "L90", "primary_label": "Kneartrose", "differential_codes": [{"code": "L15", "label": "Kneplage", "reason": "Uspesifikk knesmerte"}, {"code": "L96", "label": "Akutt indre skade kne", "reason": "Hvis traumatisk debut"}], "clinical_reasoning": "Alder 65 med gradvis debut og redusert ROM tyder på artrose. L90 er primærkode."}'),
    ("Skulder impingement med bursitt. JSON koder.",
     '{"primary_code": "L92", "primary_label": "Skulder syndrom", "differential_codes": [{"code": "L08", "label": "Skuldersymptom", "reason": "Uspesifikk skuldersmerte"}, {"code": "L91", "label": "Artrose annet sted", "reason": "Hvis AC-leddsartrose"}], "clinical_reasoning": "Subakromialt impingement med bursitt-komponent. L92 dekker hele skuldersyndromer."}'),
    ("BPPV med svimmelhet og kvalme. JSON koder.",
     '{"primary_code": "H82", "primary_label": "Vertigo-syndrom", "differential_codes": [{"code": "N17", "label": "Vertigo/svimmelhet", "reason": "Generell svimmelhet"}, {"code": "N89", "label": "Migrene", "reason": "Vestibulær migrene"}], "clinical_reasoning": "Positiv Dix-Hallpike bekrefter BPPV. H82 er spesifikk kode."}'),
    ("Akutt torticollis hos 30-åring. JSON koder.",
     '{"primary_code": "L83", "primary_label": "Nakkesyndromer", "differential_codes": [{"code": "L01", "label": "Nakkesymptom", "reason": "Enklere presentasjon"}, {"code": "N99", "label": "Annen nevrologisk", "reason": "Hvis dystoni mistenkes"}], "clinical_reasoning": "Akutt torticollis hos ung voksen er oftest muskuloskeletalt. L83 primærkode."}'),
    ("Lateral epikondylitt. JSON koder.",
     '{"primary_code": "L93", "primary_label": "Albuesyndrom", "differential_codes": [{"code": "L10", "label": "Albuesymptom", "reason": "Uspesifikk albue"}, {"code": "N93", "label": "Karpaltunnelsyndrom", "reason": "Hvis distal parestesi"}], "clinical_reasoning": "Lateral epikondylitt med positiv Cozen test. L93 er spesifikk."}'),
    ("Hofteartrose med lyskestraling. JSON koder.",
     '{"primary_code": "L89", "primary_label": "Hofteartrose", "differential_codes": [{"code": "L13", "label": "Hoftesymptom", "reason": "Uspesifikk hofte"}, {"code": "L03", "label": "Korsryggsmerter", "reason": "Referert smerte fra rygg"}], "clinical_reasoning": "Redusert innadrotasjon og lyskesmerte tyder på hofteartrose. L89 spesifikk."}'),
]

JSON_EXAMPLES_EN = [
    ("Patient with low back pain and left leg radiation. Provide diagnosis codes in JSON format.",
     '{"primary_code": "L86", "primary_label": "Lumbar disc lesion with radiation", "differential_codes": [{"code": "L03", "label": "Low back symptom", "reason": "Pain component"}, {"code": "N94", "label": "Peripheral neuritis", "reason": "Peripheral nerve involvement"}], "clinical_reasoning": "Radicular radiation with dermatomal distribution indicates nerve root involvement. L86 primary."}'),
    ("Neck pain with headache. JSON diagnosis codes.",
     '{"primary_code": "L83", "primary_label": "Neck syndrome", "differential_codes": [{"code": "N95", "label": "Tension headache", "reason": "Secondary headache"}, {"code": "N89", "label": "Migraine", "reason": "If migrainous features"}], "clinical_reasoning": "Cervicogenic headache with cervical origin. L83 primary, N95 secondary."}'),
    ("BPPV with dizziness and nausea. JSON codes.",
     '{"primary_code": "H82", "primary_label": "Vertigo syndrome", "differential_codes": [{"code": "N17", "label": "Vertigo/dizziness", "reason": "General dizziness"}, {"code": "N89", "label": "Migraine", "reason": "Vestibular migraine"}], "clinical_reasoning": "Positive Dix-Hallpike confirms BPPV. H82 specific code."}'),
]

# =============================================================================
# COMMON MISTAKES / TRICKY CODES
# =============================================================================

TRICKY_EXAMPLES_NO = [
    ("Hva er forskjellen mellom L03, L84, og L86 for korsryggsmerter?",
     "ICPC-2 koder for korsryggsmerter:\n\n• L03 — Korsryggsmerter (symptom/plage): Akutt, uspesifikk korsryggsmerte. Bruk når det er et symptom uten kjent årsak.\n• L84 — Ryggsyndromer uten utstråling: Kronisk eller diagnostisert rygglidelse UTEN radikulopati.\n• L86 — Lumbalt ryggsyndrom med utstråling: Rygglidelse MED radikulopati/nerverotaffeksjon.\n\nTommelfingerregel:\n- Akutt/ukjent → L03\n- Kronisk uten utstråling → L84\n- Med utstråling → L86"),
    ("Pasient med muskelknuter (triggerpunkter) i trapezius. Riktig kode?",
     "L83 — Nakkesyndromer\n\nTriggerpunkter i nakke/skulder-regionen kodes L83. Myofascielt smertesyndrom har ingen egen ICPC-2 kode.\n\nAlternativt: L18 (Muskelsmerter) for generelle muskelsmerter."),
    ("Costochondritt (Tietze syndrom). Kode?",
     "L04 — Brystsymptom/plage\n\nCostochondritt kodes L04. NB: Viktig å utelukke K01 (Hjertesmerter) ved brystsmerter. Tietze syndrom med hevelse i costochondral ledd.\n\nAlternativt: L99 (Annen muskel-skjelett) for spesifikk diagnose."),
    ("Hypermobilitetssyndrom (EDS type III). ICPC-2?",
     "L99 — Annen sykdom muskel-skjelettsystemet\n\nHypermobilitetssyndrom og EDS (Ehlers-Danlos) kodes L99. Beighton-score ≥5 for hypermobilitet. Spesifiser type i fritekst."),
    ("Spondylolistese L5-S1. Kode?",
     "L84 — Ryggsyndromer uten utstråling\n\nSpondylolistese kodes L84 (uten utstråling) eller L86 (med utstråling avhengig av symptombildet). Meyerding-gradering (I-V) i fritekst."),
    ("Sacroiliitt ved Bekhterevs sykdom. ICPC-2?",
     "L88 — Revmatoid artritt/Bekhterevs\n\nSacroiliitt ved ankyloserende spondylitt kodes L88. HLA-B27 positiv i ~90% av tilfellene."),
    ("Hva er riktig kode for isjias — L86 eller N99?",
     "L86 — Lumbalt ryggsyndrom med utstråling\n\nIsjias kodes L86 (IKKE N99). L86 dekker all lumbal radikulopati med utstråling. N99 brukes kun for perifere nevrologiske tilstander uten spinalt opphav."),
    # Bilateral vs unilateral coding
    ("Bilateral skuldersmerte. Skal jeg bruke L92 én gang eller to ganger?",
     "L92 — Skulder syndrom\n\nBruk L92 ÉN gang, men spesifiser bilateral i fritekst. ICPC-2 skiller ikke mellom unilateral og bilateral — dette dokumenteres i klinisk tekst.\n\nKorrekt dokumentasjon: 'L92 — Bilateral skulder syndrom (impingement bilateralt)'\n\nFeil: Å registrere L92 to ganger for høyre og venstre."),
    # L01 vs L83
    ("Hva er forskjellen mellom L01 (Nakkesymptom) og L83 (Nakkesyndromer)?",
     "L01 vs L83:\n\n• L01 — Nakkesymptom/plage: Brukes for SYMPTOM — pasienten klager over nakkesmerter, ingen diagnose stilt ennå.\n• L83 — Nakkesyndromer: Brukes for DIAGNOSE — klinisk syndrom identifisert (whiplash, cervikal dysfunksjon, etc.).\n\nTommelfingerregel:\n- Første konsultasjon, kun symptom → L01\n- Etter undersøkelse, klinisk diagnose → L83\n\nVanlig feil: Alltid bruke L83 uten å ha gjort klinisk undersøkelse."),
    # L08 vs L92
    ("Hva er forskjellen mellom L08 (Skuldersymptom) og L92 (Skulder syndrom)?",
     "L08 vs L92:\n\n• L08 — Skuldersymptom/plage: SYMPTOM — skuldersmerte uten diagnose.\n• L92 — Skulder syndrom: DIAGNOSE — impingement, rotator cuff, adhesiv kapsulitt, etc.\n\nBruk L08 ved:\n- Uspesifikk skuldersmerte uten klinisk funn\n- Henvisning/screening før undersøkelse\n\nBruk L92 ved:\n- Positiv Neer, Hawkins, Jobe, Speed, etc.\n- Klinisk diagnostisert skulderpatologi\n\nFeil: Å bruke L08 etter full undersøkelse med diagnostisert impingement."),
    # Acute vs chronic
    ("Akutt vs kronisk korsryggsmerte — forskjell i koding?",
     "Akutt vs kronisk korsrygg:\n\n• Akutt (<6 uker): L03 — Korsryggsmerter (symptom/plage)\n• Subakutt (6-12 uker): L03 eller L84 avhengig av utredning\n• Kronisk (>12 uker): L84 — Ryggsyndromer uten utstråling\n\nOvergang fra L03 → L84 skjer når:\n- Smerter vedvarer >12 uker\n- Klinisk syndrom er identifisert\n- Bildediagnostikk viser patologi\n\nFeil: Å bruke L03 for kroniske smerter i 2 år uten ny vurdering av diagnose."),
    # Pediatric scoliosis
    ("Skoliose hos 14-åring. L85 eller L82?",
     "L85 — Ervervet deformitet av ryggsøyle\n\nAdolescent idiopatisk skoliose (AIS) kodes L85. Cobb-vinkel dokumenteres i fritekst.\n\nL82 (Medfødt deformitet) brukes KUN for:\n- Medfødte vertebrale anomalier (hemifyrtebra, blokkvirvel)\n- Diagnostisert ved fødsel/neonatalperioden\n\nFeil: Å bruke L82 for AIS — idiopatisk skoliose er IKKE medfødt.\n\nOppfølging: Brystol/Adams test, Cobb-vinkel, Risser-gradering."),
    # Age-specific: degenerative vs idiopathic scoliosis
    ("Skoliose hos 65-åring med degenerative forandringer. L85 eller L84?",
     "L85 — Ervervet deformitet av ryggsøyle\n\nDegenerativ (de novo) skoliose hos eldre kodes L85. Skiller seg fra idiopatisk skoliose ved at den utvikles etter 40 år pga. degenerasjon.\n\nAlternativt:\n- L84 (Ryggsyndromer) kan brukes hvis smertekomponenten er primær\n- L85 foretrekkes når deformiteten er primærtilstanden\n\nFeil: Å kode L84 alene og ignorere deformitetskomponenten."),
    # Symptom vs diagnosis codes
    ("Hva er forskjellen mellom symptomkoder og diagnosekoder i ICPC-2?",
     "ICPC-2 skiller mellom:\n\n• Symptom/plage-koder (1-29): L01, L02, L03... — brukes NÅR pasienten presenterer med symptomer UTEN diagnose.\n• Diagnosekoder (70-99): L83, L84, L86... — brukes ETTER klinisk undersøkelse og diagnostisering.\n\nPrinsipper:\n1. Start med symptomkode ved første konsultasjon\n2. Oppgrader til diagnosekode etter undersøkelse\n3. Bruk mest spesifikk kode tilgjengelig\n4. Unngå å 'nedgradere' fra diagnose til symptom\n\nEksempel: Pasient med nakkesmerter:\n- Dag 1 (før undersøkelse): L01\n- Etter undersøkelse: L83\n- ALDRI tilbake til L01 etter at L83 er etablert"),
    # Osteoarthritis specifics
    ("Artrose — når bruke L89, L90, L91, eller L84?",
     "Artrosekoder i ICPC-2:\n\n• L89 — Hofteartrose: SPESIFIKK for hofte\n• L90 — Kneartrose: SPESIFIKK for kne\n• L91 — Artrose annet sted: Skulder, ankel, hånd, fot, AC-ledd\n• L84 — Ryggsyndromer: Facettleddsartrose i ryggsøylen\n\nVanlige feil:\n- L91 for hofteartrose → FEIL, bruk L89\n- L91 for kneartrose → FEIL, bruk L90\n- L84 for artrose i columna → RIKTIG\n- L92 for AC-leddsartrose → AKSEPTABELT, men L91 er mer presis"),
    # Fracture codes
    ("Kompresjonsbrudd i brystsøylen hos osteoporosepasienten. L76 eller L84?",
     "L76 — Annen/multiple brudd\n\nVertebrale kompresjonsbrudd kodes L76, IKKE L84. L84 er for syndromer/funksjonelle tilstander.\n\nTilleggskoder:\n- L95 (Osteoporose) — for underliggende årsak\n- L84 — kan brukes som tillegg for smertekomponenten\n\nFeil: Å kode L84 for et vertebralt brudd og ignorere frakturdiagnosen.\n\nRøde flagg: Brå debut thorakalsmerte + osteoporose + alder >65 → vurder kompresjonsbrudd."),
    # Common wrong code: using general when specific exists
    ("Pasient med tydelig rotator cuff tendinopati. Kan jeg bruke L18 (Muskelsmerter)?",
     "NEI — L92 (Skulder syndrom) er korrekt.\n\nL18 (Muskelsmerter) er for generelle, uspesifikke muskelsmerter uten lokalisasjon eller diagnose. Når du har identifisert rotator cuff tendinopati, SKAL du bruke den mest spesifikke koden:\n\n- L92 for skulderpatologi (rotator cuff, impingement, kapsulitt)\n- L93 for albuepatologi (epikondylitt)\n- L83 for nakkesyndromer (myofascial smerte i nakke/trapezius)\n\nPrinsipp: Bruk alltid den mest spesifikke koden tilgjengelig.\nFeil: L18 brukes som 'lat' kode for all muskelsmerte."),
    # Red flag coding
    ("Pasient med cauda equina-symptomer (urinretensjon, ridebukse-anestesi). Kode?",
     "⚠ AKUTT MEDISINSK NØDSITUASJON\n\nL86 — Lumbalt ryggsyndrom med utstråling\n\nCauda equina syndrom kodes L86, MEN dette er en kirurgisk akuttsituasjon:\n- Ring 113/legevakt UMIDDELBART\n- Henvis til MR innen 24 timer\n- Dokumentér tidspunkt for symptomstart\n\nKritiske symptomer:\n- Urinretensjon/inkontinens\n- Ridebukseanestesi (perineal nummenhet)\n- Bilateral beinsvakhet\n- Tap av anal tonus\n\nFeil: Å kode L03 og avvente — cauda equina krever akutt kirurgisk dekompresjon."),
    # TMJ: L07 vs D19
    ("Kjevesmerter uten leddproblematikk. L07 eller D19?",
     "Differensier:\n\n• L07 (Kjevesymptom/plage) — smerter i kjeveledd/TMJ, krepitasjon, klikking, låsning\n• D19 (Tann-/tannkjøttsymptom) — smerter relatert til tenner/tannkjøtt\n\nBruk L07 for:\n- TMD/TMJ-dysfunksjon\n- Myofascial kjevesmerte\n- Bruksisme med leddsmerte\n\nBruk D19 for:\n- Tannpine med referert kjevesmerte\n- Periodontale problemer\n\nVanlig feil: Å bruke D19 for TMD — dette er en muskuloskeletalt problem, ikke dental."),
]

TRICKY_EXAMPLES_EN = [
    ("What is the difference between L03, L84, and L86 for low back pain?",
     "ICPC-2 codes for low back pain:\n\n• L03 — Low back symptom: Acute, non-specific. Use for symptom without known cause.\n• L84 — Back syndrome without radiation: Chronic/diagnosed back condition WITHOUT radiculopathy.\n• L86 — Lumbar disc with radiation: Back condition WITH radiculopathy.\n\nRule of thumb:\n- Acute/unknown → L03\n- Chronic without radiation → L84\n- With radiation → L86"),
    ("Patient with muscle knots (trigger points) in trapezius. Correct code?",
     "L83 — Neck syndrome\n\nTrigger points in neck/shoulder region coded L83. Myofascial pain syndrome has no specific ICPC-2 code."),
    ("Costochondritis (Tietze syndrome). Code?",
     "L04 — Chest symptom/complaint\n\nCostochondritis coded L04. Important: rule out K01 (Heart pain)."),
    ("What is the correct code for sciatica — L86 or N99?",
     "L86 — Lumbar disc with radiation\n\nSciatica is coded L86, NOT N99. L86 covers all lumbar radiculopathy."),
    # Bilateral coding
    ("Bilateral shoulder pain. Should I use L92 once or twice?",
     "L92 — Shoulder syndrome\n\nUse L92 ONCE and specify bilateral in free text. ICPC-2 does not distinguish unilateral vs bilateral — document in clinical notes.\n\nCorrect: 'L92 — Bilateral shoulder syndrome (bilateral impingement)'\n\nError: Registering L92 twice for right and left."),
    # Symptom vs diagnosis
    ("What is the difference between L01 (Neck symptom) and L83 (Neck syndrome)?",
     "L01 vs L83:\n\n- L01 — Neck symptom: Used for SYMPTOM — patient complains of neck pain, no diagnosis made yet.\n- L83 — Neck syndrome: Used for DIAGNOSIS — clinical syndrome identified.\n\nRule:\n- First consultation, symptom only → L01\n- After examination, clinical diagnosis → L83\n\nCommon error: Always using L83 without having performed clinical examination."),
    # Acute vs chronic
    ("Acute vs chronic low back pain — difference in coding?",
     "Acute vs chronic low back:\n\n- Acute (<6 weeks): L03 — Low back symptom\n- Subacute (6-12 weeks): L03 or L84 depending on workup\n- Chronic (>12 weeks): L84 — Back syndrome without radiation\n\nTransition from L03 → L84 when:\n- Pain persists >12 weeks\n- Clinical syndrome identified\n- Imaging shows pathology\n\nError: Using L03 for chronic pain lasting 2 years without reassessment."),
    # Pediatric scoliosis
    ("Scoliosis in a 14-year-old. L85 or L82?",
     "L85 — Acquired deformity of spine\n\nAdolescent idiopathic scoliosis (AIS) coded L85. Document Cobb angle.\n\nL82 (Congenital deformity) used ONLY for:\n- Congenital vertebral anomalies (hemivertebra, block vertebra)\n- Diagnosed at birth/neonatal period\n\nError: Using L82 for AIS — idiopathic scoliosis is NOT congenital."),
    # Osteoarthritis
    ("Osteoarthritis — when to use L89, L90, L91, or L84?",
     "OA codes in ICPC-2:\n\n- L89 — Hip OA: SPECIFIC to hip\n- L90 — Knee OA: SPECIFIC to knee\n- L91 — OA other site: Shoulder, ankle, hand, foot, AC joint\n- L84 — Back syndrome: Facet joint OA in spine\n\nCommon errors:\n- L91 for hip OA → WRONG, use L89\n- L91 for knee OA → WRONG, use L90\n- L84 for spinal OA → CORRECT\n- L92 for AC joint OA → ACCEPTABLE, but L91 more precise"),
    # Using general codes when specific exist
    ("Patient with clear rotator cuff tendinopathy. Can I use L18 (Muscle pain)?",
     "NO — L92 (Shoulder syndrome) is correct.\n\nL18 is for general, non-specific muscle pain. When rotator cuff tendinopathy is identified, use the most specific code:\n\n- L92 for shoulder pathology\n- L93 for elbow pathology\n- L83 for neck syndromes\n\nPrinciple: Always use the most specific available code.\nError: Using L18 as a 'lazy' code for all muscle pain."),
    # Compression fracture
    ("Vertebral compression fracture in osteoporotic patient. L76 or L84?",
     "L76 — Other/multiple fracture\n\nVertebral compression fractures coded L76, NOT L84. L84 is for syndromes/functional conditions.\n\nAdditional codes:\n- L95 (Osteoporosis) — underlying cause\n- L84 — may add for pain component\n\nError: Coding L84 for a vertebral fracture and ignoring the fracture diagnosis."),
    # Cauda equina
    ("Patient with cauda equina symptoms (urinary retention, saddle anesthesia). Code?",
     "ACUTE MEDICAL EMERGENCY\n\nL86 — Lumbar disc with radiation\n\nCauda equina coded L86, BUT this is a surgical emergency:\n- Call emergency services IMMEDIATELY\n- MRI within 24 hours\n- Document time of symptom onset\n\nError: Coding L03 and waiting — cauda equina requires emergency surgical decompression."),
]


# =============================================================================
# MULTI-SYSTEM PRESENTATIONS
# =============================================================================

MULTI_SYSTEM_NO = [
    ("Pasient med hodepine, svimmelhet, nakkesmerter, og tinnitus. Hvilke koder?",
     "Koding av multi-system presentasjon:\n\nPrimærkode: L83 — Nakkesyndromer\nSekundærkoder:\n- N95 (Spenningshodepine) — hodepinekomponent\n- N17 (Vertigo/svimmelhet) — svimmelhetskomponent\n- H03 (Tinnitus) — tinnitus\n\nBegrunnelse: Cervikalt opphav kan forklare alle fire symptomene via cervikogen hodepine, cervikogen svimmelhet, og cervikal tinnitus. L83 bør være primær.\n\nFeil: Å kode fire separate primærdiagnoser uten å identifisere felles opphav."),
    ("Korsryggsmerter med utstråling til bein OG nakkesmerter med hodepine. Koder?",
     "To separate spinale tilstander — begge skal kodes:\n\n1. L86 — Lumbalt ryggsyndrom med utstråling (korsrygg)\n2. L83 — Nakkesyndromer (nakke)\n3. N95 — Spenningshodepine (sekundær til nakke)\n\nPrimærkode: Velg den tilstanden som er hovedgrunnen til konsultasjonen.\n\nPrinsipp: Når to UAVHENGIGE spinale regioner er affisert, bruk separate koder for hver."),
    ("Pasient med muskel- og leddsmerter over hele kroppen pluss depresjon. Koder?",
     "Vurder underliggende diagnose:\n\nAlternativ 1 — Fibromyalgi:\n- L18 (Muskelsmerter/fibromyalgi) primær\n- P76 (Depressiv lidelse) sekundær\n\nAlternativ 2 — Depresjon med somatiske symptomer:\n- P76 (Depressiv lidelse) primær\n- L18 (Muskelsmerter) sekundær\n\nNøkkelspørsmål: Hva kom først — smertene eller depresjonen?\n\nFeil: Å ignorere den psykiske helsedimensjonen ved kronisk smerte."),
    ("Eldre pasient med balansevansker, nakkesmerter, og svimmelhet ved stillingsendring. Koder?",
     "Differensier årsak til svimmelhet:\n\n• Cervikogen svimmelhet: L83 (primær) + N17 (sekundær)\n• BPPV: H82 (primær) + L83 (sekundær for nakke)\n• Ortostatisk hypotensjon: K99 (kardiovaskulær) + L83 (nakke)\n\nTest:\n- Dix-Hallpike → positiv = BPPV (H82)\n- Svimmelhet ved nakkerotasjon → cervikogen (L83 + N17)\n- Blodtrykksfall ved oppstigning → ortostatisk (K99)\n\nPrimærkode avhenger av testresultater."),
    ("Pasient med kiropraktisk sammensatt diagnose: korsrygg + bekken + hofte. Koding?",
     "Vurder dominerende tilstand:\n\n• Korsrygg med bekkensmerte: L03 (primær) — SI-ledd faller under korsryggkategorien\n• Hofteartrose med referert korsryggsmerte: L89 (primær) + L03 (sekundær)\n• Korsrygg + hofte som uavhengige tilstander: L03 + L13 eller L89\n\nNøkkeltest: Patrick/FABER differensierer hofte fra korsrygg/SI-ledd.\n\nPrinsipp: Identifiser den primære smertekilden. Komorbide tilstander kodes som sekundære."),
]

MULTI_SYSTEM_EN = [
    ("Patient with headache, dizziness, neck pain, and tinnitus. Which codes?",
     "Multi-system presentation coding:\n\nPrimary: L83 — Neck syndrome\nSecondary:\n- N95 (Tension headache) — headache component\n- N17 (Vertigo/dizziness) — dizziness component\n- H03 (Tinnitus) — tinnitus\n\nRationale: Cervical origin can explain all four symptoms. L83 should be primary.\n\nError: Coding four separate primary diagnoses without identifying common origin."),
    ("Low back pain with leg radiation AND neck pain with headache. Codes?",
     "Two separate spinal conditions — code both:\n\n1. L86 — Lumbar disc with radiation (low back)\n2. L83 — Neck syndrome (neck)\n3. N95 — Tension headache (secondary to neck)\n\nPrimary code: Choose the condition that is the main reason for consultation."),
    ("Patient with widespread muscle and joint pain plus depression. Codes?",
     "Consider underlying diagnosis:\n\nOption 1 — Fibromyalgia:\n- L18 (Muscle pain/fibromyalgia) primary\n- P76 (Depressive disorder) secondary\n\nOption 2 — Depression with somatic symptoms:\n- P76 (Depressive disorder) primary\n- L18 (Muscle pain) secondary\n\nKey question: What came first — the pain or the depression?"),
    ("Elderly patient with balance issues, neck pain, and positional dizziness. Codes?",
     "Differentiate cause of dizziness:\n\n- Cervicogenic: L83 (primary) + N17 (secondary)\n- BPPV: H82 (primary) + L83 (secondary)\n- Orthostatic: K99 (cardiovascular) + L83 (neck)\n\nTests:\n- Dix-Hallpike positive → BPPV (H82)\n- Dizziness with neck rotation → cervicogenic (L83 + N17)\n- BP drop on standing → orthostatic (K99)"),
]

# =============================================================================
# BILATERAL VS UNILATERAL CODING
# =============================================================================

BILATERAL_NO = [
    ("Bilateral kneartrose. Én kode eller to?",
     "L90 — Kneartrose\n\nBruk L90 ÉN gang og spesifiser 'bilateral' i fritekst. ICPC-2 har ikke separate koder for høyre/venstre.\n\nDokumentasjon: 'L90 — Bilateral kneartrose, Kellgren-Lawrence grad 2 bilateralt'\n\nFeil: Registrere L90 to ganger."),
    ("Høyresidig skulder impingement. Hvordan dokumentere side?",
     "L92 — Skulder syndrom\n\nSide dokumenteres i fritekst, IKKE i koden: 'L92 — Høyresidig skulder impingement syndrom'\n\nICPC-2 har ingen side-spesifikke koder. All lateralitet dokumenteres i klinisk notat.\n\nTips: Bruk konsekvent format — 'høyre', 'venstre', eller 'bilateral' etter koden."),
    ("Bilateral lateral epikondylitt. Kode?",
     "L93 — Albuesyndrom\n\nBilateral lateral epikondylitt kodes L93 ÉN gang med 'bilateral' i fritekst.\n\nKonsekvent dokumentasjon: 'L93 — Bilateral lateral epikondylitt (tennisalbue bilateralt)'"),
    ("Pasient med smerter i høyre hofte og venstre kne. Koder?",
     "To separate tilstander — bruk to koder:\n\n1. L13 — Hoftesymptom (høyre hofte)\n   eller L89 — Hofteartrose (hvis diagnostisert)\n2. L15 — Kneplage (venstre kne)\n   eller L90 — Kneartrose (hvis diagnostisert)\n\nNår det er ulike ledd — bruk separate koder for hvert ledd med side i fritekst."),
]

BILATERAL_EN = [
    ("Bilateral knee osteoarthritis. One code or two?",
     "L90 — Knee OA\n\nUse L90 ONCE and specify 'bilateral' in free text. ICPC-2 has no separate left/right codes.\n\nDocumentation: 'L90 — Bilateral knee OA, Kellgren-Lawrence grade 2 bilaterally'\n\nError: Registering L90 twice."),
    ("Right-sided shoulder impingement. How to document side?",
     "L92 — Shoulder syndrome\n\nSide documented in free text, NOT in code: 'L92 — Right shoulder impingement syndrome'\n\nICPC-2 has no side-specific codes. All laterality documented in clinical notes."),
    ("Patient with right hip pain and left knee pain. Codes?",
     "Two separate conditions — use two codes:\n\n1. L13 — Hip symptom (right hip) or L89 if OA diagnosed\n2. L15 — Knee symptom (left knee) or L90 if OA diagnosed\n\nWhen different joints are affected — use separate codes with side in free text."),
]

# =============================================================================
# ACUTE VS CHRONIC VARIANTS
# =============================================================================

ACUTE_CHRONIC_NO = [
    ("Akutt nakkesmerte etter søvn i dårlig stilling. L01 eller L83?",
     "L01 — Nakkesymptom/plage\n\nAkutt nakkesmerte etter mekanisk årsak (søvnstilling) kodes L01 initialt. Oppgrader til L83 hvis symptomene vedvarer eller klinisk syndrom identifiseres.\n\nTidsramme:\n- <2 uker, selvbegrensende → L01\n- Vedvarende med kliniske funn → L83"),
    ("Kronisk korsryggsmerte >1 år med sentral sensitisering. Kode?",
     "L84 — Ryggsyndromer uten utstråling\n\nKronisk korsryggsmerte kodes L84. Sentral sensitisering er et tilleggsforhold som dokumenteres i fritekst.\n\nTilleggskoder:\n- P75 kan vurderes for sensitiseringsfenomenet\n- L03 er FEIL for kronisk smerte >12 uker\n\nViktig: Sentral sensitisering har ingen egen ICPC-2 kode."),
    ("Akutt forverring av kronisk kneartrose. L96 eller L90?",
     "L90 — Kneartrose\n\nAkutt forverring (flare) av kronisk kneartrose kodes fortsatt L90. L96 er for AKUTT traumatisk indre kneskade.\n\nDokumentér 'akutt forverring' i fritekst: 'L90 — Kneartrose med akutt forverring'\n\nFeil: Å bruke L96 for forverring av artrose — dette er ikke en ny akutt skade."),
    ("Residiverende (tilbakevendende) korsryggsmerter, fjerde episode i år. Kode?",
     "L84 — Ryggsyndromer uten utstråling\n\nResidiverende korsryggsmerter kodes L84 etter gjentatte episoder, IKKE L03.\n\nBegrunnelse: Gjentatte episoder indikerer et underliggende syndrom, ikke isolerte symptomer.\n\nDokumentasjon: 'L84 — Residiverende korsryggsmerter, 4. episode 2026'"),
    ("Pasient med kronisk nakkesmerte som nå har akutt forverring med utstråling. Kode?",
     "L83 — Nakkesyndromer (beholder diagnosen)\n\nKronisk nakkesmerte med akutt radikulær forverring beholder L83 som primær, men dokumentér den akutte komponenten:\n\nDokumentasjon: 'L83 — Kronisk nakkesyndrom med akutt radikulær forverring (C6-dermatomal utstråling)'\n\nVurder N92 som tilleggskode for den radikulære komponenten."),
]

ACUTE_CHRONIC_EN = [
    ("Acute neck pain after sleeping in bad position. L01 or L83?",
     "L01 — Neck symptom/complaint\n\nAcute neck pain from mechanical cause (sleep position) coded L01 initially. Upgrade to L83 if symptoms persist or clinical syndrome identified.\n\nTimeline:\n- <2 weeks, self-limiting → L01\n- Persistent with clinical findings → L83"),
    ("Chronic low back pain >1 year with central sensitization. Code?",
     "L84 — Back syndrome without radiation\n\nChronic LBP coded L84. Central sensitization documented in free text.\n\nL03 is WRONG for chronic pain >12 weeks."),
    ("Acute flare of chronic knee OA. L96 or L90?",
     "L90 — Knee OA\n\nAcute flare of chronic knee OA still coded L90. L96 is for ACUTE traumatic internal injury.\n\nDocument: 'L90 — Knee OA with acute flare'\n\nError: Using L96 for OA flare — this is not a new acute injury."),
    ("Recurrent low back pain, fourth episode this year. Code?",
     "L84 — Back syndrome without radiation\n\nRecurrent LBP coded L84 after repeated episodes, NOT L03.\n\nRationale: Repeated episodes indicate an underlying syndrome, not isolated symptoms."),
]

# =============================================================================
# AGE-SPECIFIC CODING
# =============================================================================

AGE_SPECIFIC_NO = [
    ("Korsryggsmerter hos 8-åring. Spesielle hensyn?",
     "L03 — Korsryggsmerter (initialt)\n\n⚠ Ryggsmerte hos barn <10 år er ALLTID en rødt flagg! Differensialdiagnoser:\n- A79 (Malignitet) — tumor\n- L76 (Brudd) — stressfraktur\n- L82 (Medfødt deformitet) — medfødt anomali\n- U70/U71 (Infeksjon) — diskitt, osteomyelitt\n\nHandling: ALLTID henvise til bildediagnostikk og barnelege ved ryggsmerte hos barn <10 år.\n\nFeil: Å kode L03 og behandle konservativt uten utredning."),
    ("Spondylolyse hos 15-årig gymnast. Kode?",
     "L84 — Ryggsyndromer uten utstråling\n\nSpondylolyse (pars interarticularis stressfraktur) kodes L84. Vanlig hos unge idrettsutøvere i ekstensjonskrevende idretter.\n\nAlternativt: L76 (Brudd) for akutt pars-fraktur.\n\nAldersrelevans: 5-7% prevalens i befolkningen, men >30% hos gymnasten/turnere.\n\nDokumentasjon: Spesifiser nivå og grad i fritekst."),
    ("Hofteleddsplager hos 12-åring. Spesielle koder?",
     "L13 — Hoftesymptom/plage\n\nMEN hos barn 9-14 år: Vurder ALLTID Calve-Legg-Perthes eller epifysiolysis (slipped capital femoral epiphysis).\n\n- L13 initialt\n- L99 (Annen muskel-skjelett) for Perthes sykdom\n- L76 (Brudd) for SCFE\n\n⚠ Rødt flagg: Haltende barn med hofte-/knesmerte → røntgen begge hofter!\n\nFeil: Å kode L13 og gi kiropraktisk behandling uten å utelukke pediatriske hoftesykdommer."),
    ("Degenerative forandringer hos 70-åring med multiple leddplager. Koder?",
     "Prioriter basert på hovedplage:\n\nTypisk kombinasjon hos eldre:\n- L84 (Ryggsyndromer) — lumbal/thorakal spondylose\n- L89 (Hofteartrose) — hvis hofte er involvert\n- L90 (Kneartrose) — hvis kne er involvert\n- L91 (Artrose annet sted) — øvrige ledd\n\nPrimærkode: Den tilstanden som pasienten søker hjelp for.\n\nTips: Hos eldre med multiple degenerative forandringer — kode hovedplage som primær, komorbide som sekundære."),
    ("Epifyseal skade hos tenåring. L76 eller L96?",
     "L76 — Annen/multiple brudd\n\nEpifyseal (vekstsoneskade) hos barn/tenåringer kodes L76. Salter-Harris klassifikasjon I-V i fritekst.\n\n⚠ Spesielt viktig: Epifyseal skader kan påvirke vekst. Henvisning til ortoped/barnelege.\n\nFeil: Å kode L96 (Akutt indre skade kne) for en epifyseal skade — dette er en bruddtype."),
    ("Osteoporotisk pasient 75 år med thorakalsmerte. Kode?",
     "Vurder kompresjonsbrudd FØRST:\n\n- L76 (Brudd) — hvis kompresjonsbrudd mistenkes\n- L95 (Osteoporose) — underliggende tilstand\n- L84 (Ryggsyndromer) — kun etter at brudd er utelukket\n\nBrå debut thorakalsmerte hos osteoporotisk pasient = kompresjonsbrudd inntil det motsatte er bevist.\n\nHandling: Røntgen thorakalcolumna. Unngå manipulasjon ved mistenkt brudd.\n\nFeil: L84 uten bildediagnostikk hos osteoporotisk pasient."),
]

AGE_SPECIFIC_EN = [
    ("Low back pain in 8-year-old. Special considerations?",
     "L03 — Low back symptom (initially)\n\nBack pain in children <10 is ALWAYS a red flag! Differentials:\n- A79 (Malignancy)\n- L76 (Fracture)\n- L82 (Congenital deformity)\n- Infection (diskitis, osteomyelitis)\n\nAction: ALWAYS refer for imaging and pediatrician assessment.\n\nError: Coding L03 and treating conservatively without workup."),
    ("Spondylolysis in 15-year-old gymnast. Code?",
     "L84 — Back syndrome without radiation\n\nSpondylolysis (pars interarticularis stress fracture) coded L84. Common in young athletes in extension sports.\n\nAlternative: L76 for acute pars fracture."),
    ("Hip complaints in 12-year-old. Special codes?",
     "L13 — Hip symptom\n\nBUT in children 9-14: ALWAYS consider Legg-Calve-Perthes or SCFE (slipped capital femoral epiphysis).\n\nRed flag: Limping child with hip/knee pain → X-ray both hips!\n\nError: Coding L13 and providing chiropractic treatment without ruling out pediatric hip diseases."),
    ("Degenerative changes in 70-year-old with multiple joint complaints. Codes?",
     "Prioritize based on main complaint:\n\n- L84 (Back syndrome) — spinal spondylosis\n- L89 (Hip OA) — if hip involved\n- L90 (Knee OA) — if knee involved\n- L91 (OA other) — other joints\n\nPrimary code: The condition patient seeks help for. Code comorbidities as secondary."),
    ("Osteoporotic 75-year-old with thoracic pain. Code?",
     "Consider compression fracture FIRST:\n\n- L76 (Fracture) — if compression fracture suspected\n- L95 (Osteoporosis) — underlying condition\n- L84 (Back syndrome) — only after fracture excluded\n\nSudden onset thoracic pain in osteoporotic patient = compression fracture until proven otherwise.\n\nError: L84 without imaging in osteoporotic patient."),
]

# =============================================================================
# ADDITIONAL JSON OUTPUT EXAMPLES
# =============================================================================

JSON_EXAMPLES_EXTRA_NO = [
    ("Fibromyalgi med tretthet og søvnvansker. JSON koder.",
     '{"primary_code": "L18", "primary_label": "Muskelsmerter/fibromyalgi", "differential_codes": [{"code": "A04", "label": "Tretthet", "reason": "Fatigue-komponent"}, {"code": "P06", "label": "Søvnforstyrrelse", "reason": "Søvnvansker"}, {"code": "P75", "label": "Somatiseringsforstyrrelse", "reason": "FEIL diagnose — ikke bruk for fibromyalgi"}], "clinical_reasoning": "ACR 2010 kriterier oppfylt. L18 primær, A04 og P06 som tilleggskoder."}'),
    ("Plantar fasciitt, bilateral. JSON koder.",
     '{"primary_code": "L17", "primary_label": "Fotsymptom/plantar fasciitt", "differential_codes": [{"code": "L86", "label": "Lumbal radikulopati", "reason": "S1 referert hælsmerte"}, {"code": "N93", "label": "Tarsaltunnelsyndrom", "reason": "Nevropatisk fotsmerter"}], "clinical_reasoning": "Bilateral plantar fasciitt med klassisk morgenstivhet. L17 primær. Spesifiser bilateral i fritekst."}'),
    ("Cervikal radikulopati C7 med svimmelhet. JSON koder.",
     '{"primary_code": "L83", "primary_label": "Nakkesyndromer", "differential_codes": [{"code": "N17", "label": "Vertigo/svimmelhet", "reason": "Cervikogen svimmelhet"}, {"code": "N92", "label": "Trigeminusnevralgi", "reason": "Kun ved ansiktssmerter"}, {"code": "H82", "label": "Vertigo-syndrom", "reason": "Hvis BPPV differensialdiagnose"}], "clinical_reasoning": "Cervikal radikulopati med sekundær svimmelhet. L83 primær, N17 sekundær. Utelukk BPPV med Dix-Hallpike."}'),
    ("Akutt torticollis hos barn. JSON koder.",
     '{"primary_code": "L83", "primary_label": "Nakkesyndromer", "differential_codes": [{"code": "L01", "label": "Nakkesymptom", "reason": "Enklere variant"}, {"code": "A78", "label": "Infeksjon annen", "reason": "Retropharyngeal abscess hos barn"}, {"code": "N99", "label": "Annen nevrologisk", "reason": "Atlantoaxial subluksasjon (Grisel syndrom)"}], "clinical_reasoning": "Torticollis hos barn krever utelukkelse av alvorlige årsaker. L83 brukes etter at røde flagg er utelukket. Henvis ved feber eller nevrologiske funn."}'),
    ("Multisegmental ryggsmerte med muskelspasmer. JSON koder.",
     '{"primary_code": "L84", "primary_label": "Ryggsyndromer uten utstråling", "differential_codes": [{"code": "L03", "label": "Korsryggsmerter", "reason": "Hvis kun lumbal"}, {"code": "L83", "label": "Nakkesyndromer", "reason": "Hvis cervikal komponent"}, {"code": "L18", "label": "Muskelsmerter", "reason": "Ved generalisert myalgi"}], "clinical_reasoning": "Multisegmental presentasjon med muskelspasmer. L84 som primær for ryggsyndromer. Tilleggskode L83 ved cervikal involvering."}'),
]

JSON_EXAMPLES_EXTRA_EN = [
    ("Fibromyalgia with fatigue and sleep issues. JSON codes.",
     '{"primary_code": "L18", "primary_label": "Muscle pain/fibromyalgia", "differential_codes": [{"code": "A04", "label": "Fatigue", "reason": "Fatigue component"}, {"code": "P06", "label": "Sleep disturbance", "reason": "Sleep issues"}, {"code": "P75", "label": "Somatization disorder", "reason": "WRONG — do not use for fibromyalgia"}], "clinical_reasoning": "ACR 2010 criteria met. L18 primary, A04 and P06 as additional codes."}'),
    ("Cervical radiculopathy C7 with dizziness. JSON codes.",
     '{"primary_code": "L83", "primary_label": "Neck syndrome", "differential_codes": [{"code": "N17", "label": "Vertigo/dizziness", "reason": "Cervicogenic dizziness"}, {"code": "H82", "label": "Vertigo syndrome", "reason": "If BPPV differential"}], "clinical_reasoning": "Cervical radiculopathy with secondary dizziness. L83 primary, N17 secondary. Rule out BPPV with Dix-Hallpike."}'),
    ("Acute torticollis in child. JSON codes.",
     '{"primary_code": "L83", "primary_label": "Neck syndrome", "differential_codes": [{"code": "L01", "label": "Neck symptom", "reason": "Simpler presentation"}, {"code": "A78", "label": "Other infection", "reason": "Retropharyngeal abscess"}, {"code": "N99", "label": "Other neurological", "reason": "Atlantoaxial subluxation (Grisel syndrome)"}], "clinical_reasoning": "Torticollis in children requires exclusion of serious causes. Use L83 after red flags excluded. Refer if fever or neurological signs."}'),
    ("Hip OA with groin and knee referred pain. JSON codes.",
     '{"primary_code": "L89", "primary_label": "Hip osteoarthritis", "differential_codes": [{"code": "L13", "label": "Hip symptom", "reason": "Non-specific hip"}, {"code": "L15", "label": "Knee symptom", "reason": "Referred knee pain"}, {"code": "L03", "label": "Low back symptom", "reason": "If lumbar referral"}], "clinical_reasoning": "Hip OA commonly refers to groin and anteromedial knee. L89 primary. Knee pain is referred — do not add L90 unless confirmed knee pathology."}'),
]

# =============================================================================
# ADDITIONAL SPINE & EXTREMITY EXAMPLES
# =============================================================================

ADDITIONAL_SPINE_NO = [
    ("Coccygodyni (halebenssmerter) etter fall. ICPC-2?",
     "L03 — Korsryggsmerter\n\nCoccygodyni har ingen spesifikk ICPC-2 kode og kodes L03. Differensier:\n- L76 (Brudd) — ved røntgen-bekreftet halebensbrudd\n- L03 — ved kontusjon eller dysfunksjon uten fraktur\n\nDokumentasjon: 'L03 — Coccygodyni etter fall, utelukket fraktur'"),
    ("Spondylodiskitt mistenkt hos pasient med feber og ryggsmerte. ICPC-2?",
     "⚠ AKUTT: Infeksjon mistenkt!\n\nL84 — Ryggsyndromer (initialt), MEN:\n- A78 (Infeksjon annen) kan brukes som primær ved bekreftet infeksjon\n- L03 — FEIL hvis infeksjon mistenkes\n\nHandling: Akutt blodprøver (CRP, SR, leukocytter), MR columna, blodkultur.\n\nKiropraktor: Henvis AKUTT til sykehus. IKKE manipulér ved mistenkt infeksjon."),
    ("Lumbalt fasettleddssyndrom med lokal smerte. ICPC-2?",
     "L84 — Ryggsyndromer uten utstråling\n\nFasettleddssyndrom kodes L84. Typisk: lokal smerte, forverring ved ekstensjon/rotasjon, negativ SLR.\n\nSpes.: 'L84 — Lumbalt fasettleddssyndrom, L4-L5'\n\nFeil: L86 — fasettleddssyndrom gir vanligvis IKKE radikulær utstråling."),
]

ADDITIONAL_SPINE_EN = [
    ("Coccydynia (tailbone pain) after fall. ICPC-2?",
     "L03 — Low back symptom\n\nCoccydynia has no specific ICPC-2 code and is coded L03. Differentiate:\n- L76 (Fracture) — if X-ray confirmed coccyx fracture\n- L03 — contusion or dysfunction without fracture"),
    ("Lumbar facet joint syndrome with local pain. ICPC-2?",
     "L84 — Back syndrome without radiation\n\nFacet joint syndrome coded L84. Typical: local pain, worsened by extension/rotation, negative SLR.\n\nError: L86 — facet syndrome typically does NOT cause radicular radiation."),
]

ADDITIONAL_EXTREMITY_NO = [
    ("Akillestendinopati med hevelse og morgenstivhet. ICPC-2?",
     "L17 — Fotsymptom/plage\n\nAkillestendinopati kodes L17. Midportion vs insertionell dokumenteres i fritekst.\n\nDifferensier:\n- L77 (Distorsjon) — for akutt akillesruptur/strekk\n- L17 — for kronisk tendinopati"),
    ("Mortons nevrom mellom 3. og 4. metatarsal. ICPC-2?",
     "L17 — Fotsymptom/plage\n\nMortons nevrom kodes L17. Alternativt N94 (Perifer nevropati) for den nevrale komponenten.\n\nPrimær L17 foretrekkes — det er en mekanisk/strukturell tilstand i foten."),
    ("Iliotibialt båndsyndrom (ITBS) hos løper. ICPC-2?",
     "L15 — Kneplage/symptom\n\nITBS kodes L15. Lateral kneleddssmerte provosert av repetitiv fleksjon/ekstensjon.\n\nFeil: L90 — ITBS er IKKE artrose.\nFeil: L96 — ITBS er IKKE en akutt indre skade."),
    ("Triggerfinger (stenoserende tenosynovitt). ICPC-2?",
     "L12 — Hånd/fingersymptom\n\nTriggerfinger kodes L12. Dokumentér affisert finger i fritekst.\n\nAlternativt: L99 (Annen muskel-skjelett) for spesifikk diagnose."),
    ("Midtfotssmerte, metatarsalgi. ICPC-2?",
     "L17 — Fotsymptom/plage\n\nMetatarsalgi kodes L17. Dokumentér lokalisasjon (2.-4. metatarsalhode typisk).\n\nDifferensier:\n- Stressfraktur → L76\n- Mortons nevrom → L17 eller N94\n- Inflammatorisk → L88 (RA)"),
]

ADDITIONAL_EXTREMITY_EN = [
    ("Achilles tendinopathy with swelling and morning stiffness. ICPC-2?",
     "L17 — Foot symptom/complaint\n\nAchilles tendinopathy coded L17. Document midportion vs insertional in free text."),
    ("Morton's neuroma between 3rd and 4th metatarsal. ICPC-2?",
     "L17 — Foot symptom/complaint\n\nMorton's neuroma coded L17. Alternative N94 for neural component. L17 preferred — mechanical/structural foot condition."),
    ("Iliotibial band syndrome (ITBS) in runner. ICPC-2?",
     "L15 — Knee symptom/complaint\n\nITBS coded L15. Lateral knee pain provoked by repetitive flexion/extension.\n\nError: L90 — ITBS is NOT osteoarthritis.\nError: L96 — ITBS is NOT an acute internal injury."),
    ("Trigger finger (stenosing tenosynovitis). ICPC-2?",
     "L12 — Hand/finger symptom\n\nTrigger finger coded L12. Document affected finger in free text."),
]


def build_example(user_msg, assistant_msg, system_prompt):
    """Build a ChatML training example."""
    return {
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_msg},
            {"role": "assistant", "content": assistant_msg},
        ]
    }


def generate_all_examples():
    """Generate all ICPC-2 training examples."""
    examples = []

    def add(pairs, lang='no'):
        if lang == 'no':
            sp = SYSTEM_PROMPT_NO
        elif lang == 'json':
            sp = SYSTEM_PROMPT_JSON
        else:
            sp = SYSTEM_PROMPT_EN
        for user_msg, assistant_msg in pairs:
            examples.append(build_example(user_msg, assistant_msg, sp))

    # Spine
    add(SPINE_EXAMPLES_NO, 'no')
    add(SPINE_EXAMPLES_EN, 'en')
    add(ADDITIONAL_SPINE_NO, 'no')
    add(ADDITIONAL_SPINE_EN, 'en')

    # Extremities
    add(EXTREMITY_EXAMPLES_NO, 'no')
    add(EXTREMITY_EXAMPLES_EN, 'en')
    add(ADDITIONAL_EXTREMITY_NO, 'no')
    add(ADDITIONAL_EXTREMITY_EN, 'en')

    # Neurological
    add(NEURO_EXAMPLES_NO, 'no')
    add(NEURO_EXAMPLES_EN, 'en')

    # General/symptoms
    add(GENERAL_EXAMPLES_NO, 'no')
    add(GENERAL_EXAMPLES_EN, 'en')

    # Differential diagnosis
    add(DIFFERENTIAL_NO, 'no')
    add(DIFFERENTIAL_EN, 'en')

    # Multi-system presentations
    add(MULTI_SYSTEM_NO, 'no')
    add(MULTI_SYSTEM_EN, 'en')

    # Bilateral vs unilateral
    add(BILATERAL_NO, 'no')
    add(BILATERAL_EN, 'en')

    # Acute vs chronic
    add(ACUTE_CHRONIC_NO, 'no')
    add(ACUTE_CHRONIC_EN, 'en')

    # Age-specific
    add(AGE_SPECIFIC_NO, 'no')
    add(AGE_SPECIFIC_EN, 'en')

    # JSON structured output
    add(JSON_EXAMPLES_NO, 'json')
    add(JSON_EXAMPLES_EN, 'json')
    add(JSON_EXAMPLES_EXTRA_NO, 'json')
    add(JSON_EXAMPLES_EXTRA_EN, 'json')

    # Tricky/common mistakes
    add(TRICKY_EXAMPLES_NO, 'no')
    add(TRICKY_EXAMPLES_EN, 'en')

    return examples


def main():
    examples = generate_all_examples()
    count_only = '--count' in sys.argv

    # Count by category
    no_count = sum(1 for e in examples if 'Norge' in e['messages'][0]['content'] or 'kiropraktikk' in e['messages'][0]['content'])
    json_count = sum(1 for e in examples if 'JSON' in e['messages'][0]['content'] or 'strukturerte' in e['messages'][0]['content'])

    print(f"Generated {len(examples)} ICPC-2 training examples")
    print(f"  Norwegian: {no_count}")
    print(f"  English: {len(examples) - no_count - json_count}")
    print(f"  JSON structured: {json_count}")

    if count_only:
        return

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        for ex in examples:
            f.write(json.dumps(ex, ensure_ascii=False) + '\n')

    size_kb = os.path.getsize(OUTPUT_FILE) / 1024
    print(f"\nWritten to: {OUTPUT_FILE}")
    print(f"File size: {size_kb:.1f} KB")


if __name__ == '__main__':
    main()
