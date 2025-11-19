-- Advanced Vestibular Testing Templates
-- vHIT, VEMP, DVA, Carrick receptor-based methods, Enhanced VRT
-- Based on 2025 best practices and functional neurology
-- Created: 2025-11-19

-- Assumes insert_template function exists from norwegian_clinical_templates.sql

-- ============================================================================
-- vHIT (Video Head Impulse Test) Templates
-- ============================================================================

SELECT insert_template('Vestibulær Advanced', 'vHIT', 'vHIT Normal alle 6 kanaler',
'VIDEO HEAD IMPULSE TEST (vHIT):

Protokoll: HIMP (Head Impulse)

HORISONTALE KANALER:
- Høyre: VOR gain 0.95 (normal: >0.8)
  □ Corrective saccades: Ingen
- Venstre: VOR gain 0.92 (normal: >0.8)
  □ Corrective saccades: Ingen

POSTERIORE KANALER:
- Høyre: VOR gain 0.88
  □ Corrective saccades: Ingen
- Venstre: VOR gain 0.90
  □ Corrective saccades: Ingen

ANTERIORE KANALER:
- Høyre: VOR gain 0.85
  □ Corrective saccades: Ingen
- Venstre: VOR gain 0.87
  □ Corrective saccades: Ingen

KONKLUSJON: Normal vestibulo-okulær refleks (VOR) bilateralt alle kanaler', 'objective');

SELECT insert_template('Vestibulær Advanced', 'vHIT', 'vHIT Unilateral Vestibular Weakness',
'VIDEO HEAD IMPULSE TEST (vHIT):

Protokoll: HIMP (Head Impulse)

HORISONTALE KANALER:
- Høyre: VOR gain 0.45 ↓ (normal: >0.8)
  ✓ Corrective saccades: JA (overt)
- Venstre: VOR gain 0.92 (normal)
  □ Corrective saccades: Ingen

POSTERIORE KANALER:
- Høyre: VOR gain 0.38 ↓
  ✓ Corrective saccades: JA
- Venstre: VOR gain 0.90 (normal)

ANTERIORE KANALER:
- Høyre: VOR gain 0.42 ↓
  ✓ Corrective saccades: JA
- Venstre: VOR gain 0.87 (normal)

KONKLUSJON: Betydelig redusert VOR gain høyre side (alle 3 kanaler)
Diagnose: Sannsynlig høyresidig vestibularis nevritt / labyrintitt
Anbefaling: Vestibulær rehabilitering, vurder MR caput ved persisterende symptomer', 'objective');

SELECT insert_template('Vestibulær Advanced', 'vHIT', 'vHIT SHIMP Protocol',
'VIDEO HEAD IMPULSE TEST (vHIT):

Protokoll: SHIMP (Suppression Head Impulse)
Forskjell fra HIMP: Pasienten fikserer head-fixed target (laser)

SHIMP vs HIMP Ratio:
- Normal ratio: ~1.0
- Observert ratio: ____

Bruk: SHIMP er mer sensitiv for å oppdage kompensasjon
og kan identifisere kovert sakkader som HIMP kan misse

Funn: ___________', 'objective');

-- ============================================================================
-- VEMP (Vestibular Evoked Myogenic Potential) Templates
-- ============================================================================

SELECT insert_template('Vestibulær Advanced', 'VEMP', 'VEMP Normal Bilateral',
'VESTIBULAR EVOKED MYOGENIC POTENTIAL (VEMP):

CERVICAL VEMP (cVEMP) - Saccule & nedre vestibulære nerve:

Stimulus: 500 Hz tone burst, 95 dB nHL

Høyre SCM:
- p1 latency: 13.5 ms (normal: 12-15 ms)
- n1 latency: 23.2 ms (normal: 20-25 ms)
- p1-n1 amplitude: 85 μV
- Threshold: 95 dB

Venstre SCM:
- p1 latency: 13.8 ms
- n1 latency: 23.5 ms
- p1-n1 amplitude: 80 μV
- Threshold: 95 dB

Asymmetry Ratio: 5% (normal: <35%)

OCULAR VEMP (oVEMP) - Utricle & øvre vestibulære nerve:

Høyre IO:
- n1 latency: 10.5 ms (normal: 9-12 ms)
- p1 latency: 15.2 ms (normal: 14-17 ms)
- Amplitude: 12 μV

Venstre IO:
- n1 latency: 10.8 ms
- p1 latency: 15.5 ms
- Amplitude: 11 μV

KONKLUSJON: Normale bilaterale VEMP-responser
Ingen tegn til superior canal dehiscence', 'objective');

SELECT insert_template('Vestibulær Advanced', 'VEMP', 'VEMP Superior Canal Dehiscence',
'VESTIBULAR EVOKED MYOGENIC POTENTIAL (VEMP):

CERVICAL VEMP (cVEMP):

Høyre SCM:
- p1-n1 amplitude: 185 μV ↑↑ (markert forhøyet)
- Threshold: 75 dB ↓ (lavere enn normalt)
  *** ABNORMALT STORT RESPONS ***

Venstre SCM:
- p1-n1 amplitude: 82 μV (normalt)
- Threshold: 95 dB

OCULAR VEMP (oVEMP):

Høyre IO:
- Amplitude: 28 μV ↑↑ (markert forhøyet)
- Lavere threshold

Venstre IO:
- Amplitude: 11 μV (normalt)

KONKLUSJON: *** SUSPEKT SUPERIOR CANAL DEHISCENCE HØYRE SIDE ***

Klassiske VEMP-funn ved SCD:
✓ Forhøyet cVEMP amplitude
✓ Forhøyet oVEMP amplitude
✓ Lavere threshold bilateral

ANBEFALING:
→ AKUTT henvisning til ØNH-spesialist
→ CT temporalben (høyoppløselig) for bekreftelse
→ Unngå Valsalva-manøvrer og tunge løft inntil avklart', 'objective');

SELECT insert_template('Vestibulær Advanced', 'VEMP', 'VEMP Absent Response',
'VESTIBULAR EVOKED MYOGENIC POTENTIAL (VEMP):

CERVICAL VEMP (cVEMP):

Høyre SCM: INGEN RESPONS
Venstre SCM: Normal respons (amplitude 80 μV)

OCULAR VEMP (oVEMP):

Høyre IO: INGEN RESPONS
Venstre IO: Normal respons

KONKLUSJON: Fraværende VEMP-responser høyre side

Differensialdiagnoser:
- Vestibularis nevritt (superior nerve)
- Labyrintitt
- Ménières sykdom (sent stadium)
- Vestibulær schwannom

ANBEFALING: MR IAC/CPA for å utelukke strukturell patologi', 'objective');

-- ============================================================================
-- DVA (Dynamic Visual Acuity) Templates
-- ============================================================================

SELECT insert_template('Vestibulær Advanced', 'DVA', 'DVA Normal',
'DYNAMIC VISUAL ACUITY (DVA) TEST:

STATISK SYNSSKARPHET:
- Begge øyne: 20/20 (1.0)

DYNAMISK SYNSSKARPHET (under hodebevegelse):

Horisontal plane (yaw):
- Hodehastighet oppnådd: 150-180 °/sek ✓
- Synsskarphet: 20/25 (0.8)
- Tap: 1 linje

Vertikal plane (pitch):
- Hodehastighet oppnådd: 120-150 °/sek ✓
- Synsskarphet: 20/25 (0.8)
- Tap: 1 linje

RESULTAT: NORMAL DVA
(Tap < 2 linjer = normalt)

TOLKNING: Normal vestibulo-okulær refleks (VOR) funksjon
God kompensasjon, lav risiko for fall', 'objective');

SELECT insert_template('Vestibulær Advanced', 'DVA', 'DVA Abnormal - Vestibular Loss',
'DYNAMIC VISUAL ACUITY (DVA) TEST:

STATISK SYNSSKARPHET:
- Begge øyne: 20/20 (1.0)

DYNAMISK SYNSSKARPHET (under hodebevegelse):

Horisontal plane (yaw):
- Hodehastighet oppnådd: 150-180 °/sek ✓
- Synsskarphet: 20/80 (0.25)
- Tap: 4 linjer ↑↑ *** ABNORMALT ***

Vertikal plane (pitch):
- Hodehastighet oppnådd: 120-150 °/sek ✓
- Synsskarphet: 20/50 (0.4)
- Tap: 3 linjer ↑ *** ABNORMALT ***

RESULTAT: ABNORMAL DVA
(Tap > 2 linjer = abnormalt)

TOLKNING:
- Betydelig VOR-dysfunksjon
- Dårlig kompensasjon
- ØKT FALLRISIKO (DVA er sensitiv prediktor: 92%)

ANBEFALING:
✓ Intensiv vestibulær rehabilitering (VRT)
✓ Gaze stabilization øvelser daglig
✓ Fallforebygging i hjemmet
✓ Reevaluering DVA etter 4-6 uker VRT', 'objective');

SELECT insert_template('Vestibulær Advanced', 'DVA', 'DVA Asymmetrisk - Unilateral Loss',
'DYNAMIC VISUAL ACUITY (DVA) TEST:

STATISK SYNSSKARPHET: 20/20

DYNAMISK SYNSSKARPHET:

Horisontal plane:
- Høyre rotasjon: 20/60 (tap 3 linjer) ↑
- Venstre rotasjon: 20/25 (tap 1 linje) ✓

Asymmetri: HØYRE ROTASJON MEST AFFISERT

TOLKNING:
Asymmetrisk DVA tyder på unilateral vestibulær svakhet
→ Svakhet på VENSTRE side (kompenserer dårlig ved høyre rotasjon)

Korrelerer med: vHIT / Caloric testing', 'objective');

-- ============================================================================
-- CARRICK RECEPTOR-BASED TREATMENTS
-- ============================================================================

SELECT insert_template('Vestibulær Advanced', 'Carrick Method', 'Receptor-Based Visual Stimulation',
'FUNKSJONSNEVROLOGISK BEHANDLING (Carrick Receptor-Based):

VISUELLE STIMULI:

1. Fargefiltre (Color Therapy):
   - Blått filter høyre øye: 10 minutter
   - Formål: Modulere visuo-vestibulær integrasjon
   - Respons: _________

2. Optokinetisk Stimulering (LED Panel):
   - Horisontal bevegelse 30°/sek
   - Varighet: 5 minutter
   - Formål: Aktivere vestibulær kortex
   - Respons: _________

3. Lysstimulering (Phototherapy):
   - Stroboskopisk lys 10 Hz
   - Varighet: 3 minutter
   - Formål: Cerebellær aktivering
   - Respons: _________

RASJONALE: Neuroplastisitet gjennom multi-sensorisk stimulering
OUTCOME: Reevaluere balanse/VOR etter behandling', 'plan');

SELECT insert_template('Vestibulær Advanced', 'Carrick Method', 'Multi-Sensory Receptor Stimulation',
'FUNKSJONSNEVROLOGISK BEHANDLING (Carrick Receptor-Based):

MULTI-SENSORISK STIMULERING:

1. VISUELT:
   □ Fargefiltre (blå/grønn)
   □ Prisme-briller
   □ Optokinetisk stimulering

2. AUDITIVT:
   □ Binaural beats (40 Hz gamma)
   □ Monolateral sound stimulation
   □ Varighet: 10 minutter

3. PROPRIOSEPTIVT:
   □ Cervikal vibrasjon (100 Hz, 2 min)
   □ Masseter vibrasjon (bilat, 1 min)
   □ Fotsoler vibrasjon (30 sek hver)

4. VESTIBULÆRT:
   □ Interactive Metronome (15 min)
   □ Rhythmic timing exercises
   □ Bilateral koordinasjon

MÅLINGER:
- Pre-behandling: Balanse score ___
- Post-behandling: Balanse score ___
- Forbedring: ___

PLAN: Gjenta behandling 2x/uke i 4 uker', 'plan');

-- ============================================================================
-- ENHANCED VRT PROTOCOLS (Evidence-Based Dosing)
-- ============================================================================

SELECT insert_template('Vestibulær Advanced', 'VRT Enhanced', 'VRT Acute Unilateral Vestibulopathy',
'VESTIBULÆR REHABILITERING (VRT) - AKUTT FASE:

DIAGNOSE: Akutt unilateral vestibulær hypofunction
FASE: Akutt (< 6 uker)

GAZE STABILIZATION ØVELSER:
Dosering: 3 ganger daglig i minimum 12 minutter totalt

Øvelser:
1. X1 Viewing (VOR x1):
   - Horisontal: Feste blikket på "X", snu hodet horisontalt 2 Hz
   - Vertikal: Feste blikket på "X", snu hodet vertikalt 2 Hz
   - Varighet: 1 min hver retning

2. X2 Viewing (VOR x2):
   - Flytt hodet og øyne SAMME retning
   - Varighet: 1 min hver retning

BALANCE ØVELSER:
Dosering: 20 minutter daglig

1. Romberg (progresjon):
   - Øyne åpne → Øyne lukket
   - Fast underlag → Skumgummi
   - Varighet: 30 sek x 4 repetisjoner

2. Gange:
   - Tandem gange 3 meter x 5
   - Bakover gange 3 meter x 5

VARIGHET: 4-6 uker
REEVALUERING: Hver 2. uke (DVA, DHI, balanse)

FORVENTET OUTCOME: 70-80% bedring innen 6 uker', 'plan');

SELECT insert_template('Vestibulær Advanced', 'VRT Enhanced', 'VRT Chronic Unilateral Vestibulopathy',
'VESTIBULÆR REHABILITERING (VRT) - KRONISK FASE:

DIAGNOSE: Kronisk unilateral vestibulær hypofunction
FASE: Kronisk (> 6 uker)

GAZE STABILIZATION ØVELSER:
Dosering: 3-5 ganger daglig i minimum 20-40 minutter totalt

Øvelser:
1. X1 Viewing - Horisontal/Vertikal:
   - Frekvens: 2 Hz
   - Varighet: 2 min x 3 sett

2. VOR Adaptation:
   - Hoderotasjon mens fikserer target
   - Øk hastighet gradvis
   - Varighet: 3 min x 3 sett

3. Habituation for Spesifikke Triggere:
   - Identifiser pasientens triggere (f.eks. snu i seng)
   - Gjenta trigger-bevegelse 5 ganger, 3x daglig
   - Må provosere symptomer (men ikke overveldes)

BALANCE ØVELSER:
Dosering: Minimum 20 minutter daglig i 4-6 uker

Progresjon:
1. Statisk balanse (uke 1-2)
2. Dynamisk balanse (uke 3-4)
3. Dual-task balanse (uke 5-6)

ADAPTATION & SUBSTITUTION:
- Sakkadisk substitusjon trening
- Smooth pursuit trening
- Frekvens: 3-5x daglig, 10 minutter

HJEMMEPROGRAM:
□ Daglig logg (compliance viktig!)
□ Gradvis øke vanskelighetsgrad
□ Unngå "undertrening" (vanlig feil)

FORVENTET OUTCOME: 60-70% bedring ved god compliance', 'plan');

SELECT insert_template('Vestibulær Advanced', 'VRT Enhanced', 'VRT Bilateral Vestibulopathy',
'VESTIBULÆR REHABILITERING (VRT) - BILATERAL:

DIAGNOSE: Bilateral vestibulær hypofunction
FASE: Akutt/Kronisk

*** VIKTIG: Bilateral krever LENGRE behandling (6-9 uker) ***

GAZE STABILIZATION ØVELSER:
Dosering: 3-5 ganger daglig i 20-40 minutter totalt

Fokus på SUBSTITUTION (ikke adaptation):
1. Sakkadisk Substitusjon:
   - Trene raske øyebevegelser (sakkader)
   - Erstatte VOR med willkårlige sakkader
   - Varighet: 5 min x 4 sett daglig

2. Cervico-Ocular Reflex (COR) Trening:
   - Bruke nakke-propriosepsjon
   - Fiksere blikket under hodebevegelse
   - Varighet: 3 min x 3 sett

BALANCE ØVELSER:
Dosering: Minimum 20 minutter daglig i 6-9 uker

Bilateral = ØKT FALLRISIKO
Fokus:
□ Multi-sensorisk trening (vision + propriosepsjon)
□ Unngå mørke omgivelser (økt risiko)
□ Gange med walking stick ved behov

PROGNOSE:
- Bilateral kompenserer TREGERE enn unilateral
- Fullstendig kompensasjon sjelden
- Mål: Maksimere gjenværende funksjon + sikkerhet

FORVENTET OUTCOME: 40-60% bedring, vedvarende balanseproblemer', 'plan');

-- ============================================================================
-- TESTING SEQUENCE & ORDER EFFECT
-- ============================================================================

SELECT insert_template('Vestibulær Advanced', 'Testing Sequence', 'Anbefalt Testing Sequence 2025',
'ANBEFALT TESTING SEQUENCE (2025 Best Practice):

*** VIKTIG: UNNGÅ "ORDER EFFECT" ***

Problem: BPPV-manøvrer kan flytte krystaller til nye posisjoner
→ Påvirker etterfølgende tester
→ Feil diagnose

ANBEFALT REKKEFØLGE:

1. SUPINE ROLL TEST FØRST ✓
   (Test for horisontal buegang)
   Hvorfor først: Minst sannsynlig å forårsake kanal-konvertering

2. DIX-HALLPIKE (høyre, deretter venstre)
   (Test for bakre/fremre buegang)

3. DEEP HEAD HANG
   (Hvis Dix-Hallpike viser downbeat/upbeat)

4. LEAN TEST
   (Kun hvis Supine Roll positiv - for sidebestemmelse)

5. OCULOMOTOR TESTING
   (Etter posisjonelle tester)

6. BALANCE TESTING
   (Fukuda, Romberg, etc.)

RASJONALE:
- Standardisert sequence reduserer variabilitet
- Bedre diagnostisk nøyaktighet
- Enklere tolkning

Referanse: Cleveland Clinic Protocol 2025', 'objective');

SELECT insert_template('Vestibulær Advanced', 'Testing Sequence', 'Kanal-Konvertering Observert',
'KANAL-KONVERTERING / CANAL-SWITCH OBSERVERT:

INITIAL TEST:
- Supine Roll høyre: Geotropisk horisontal nystagmus ✓
  → DIAGNOSE: Horisontal BPPV høyre

SUBSEQUENT TEST (etter manøver):
- Dix-Hallpike høyre: Torsjonell geotropisk nystagmus ✓
  → NY OBSERVASJON: Bakre kanal BPPV høyre

TOLKNING:
*** KANAL-KONVERTERING ***
BBQ Roll-manøver har sannsynligvis flyttet krystaller fra
horisontal kanal til bakre kanal (samme side)

BEHANDLING:
1. Behandle bakre kanal først (Epleys høyre)
2. Re-teste etter 5 min
3. Behandle gjenværende horisontal BPPV hvis persistent

LÆRING:
- Kanal-switch er VANLIG (20-30% av tilfeller)
- Dette er GRUNNEN til at testing sequence er viktig
- Alltid re-teste etter behandling', 'assessment');

-- ============================================================================
-- OUTCOME MEASURES - ABC, VSR, Post-Concussion
-- ============================================================================

SELECT insert_template('Vestibulær Advanced', 'Outcome Measures', 'ABC Scale',
'ACTIVITIES-SPECIFIC BALANCE CONFIDENCE (ABC) SCALE:

Dato: __________
Total Score: ____ / 100

Tolkning:
> 80: Høy balanse-selvtillit
50-80: Moderat balanse-selvtillit
< 50: Lav balanse-selvtillit
< 67: ØKT FALLRISIKO (eldre)

Subscore (eksempler):
- Gå rundt i huset: ____/10
- Gå opp/ned trapper: ____/10
- Bøye seg og plukke opp: ____/10
- Strekke seg opp etter noe: ____/10
- Gå i folkemengde: ____/10

Oppfølging: Gjenta ABC etter ____ uker VRT', 'assessment');

SELECT insert_template('Vestibulær Advanced', 'Outcome Measures', 'Post-Concussion Vestibular',
'POST-CONCUSSION VESTIBULÆR VURDERING:

ANAMNESE:
Traume: __________ (dato)
Mekanisme: __________
Bevisstløshet: □ Ja □ Nei
Amnesi: □ Retrograd □ Anterograd

AKUTTE SYMPTOMER (0-7 dager):
□ Hodepine
□ Svimmelhet/vertigo
□ Kvalme
□ Balansevansker
□ Visuelle forstyrrelser
□ Lys-/lydømfintlighet
□ Kognitiv tåke

VEDVARENDE VESTIBULÆRE SYMPTOMER (> 7 dager):
□ Svimmelhet ved hodebevegelse
□ Ustøhet ved gange
□ Visual motion sensitivity
□ Spatial disorientering

TESTING:
- vHIT: __________ (ofte normal etter mTBI)
- DVA: __________ (ofte abnormal - sensitiv!)
- Balance: __________
- Oculomotor: __________ (pursuit/saccades ofte affisert)

POST-CONCUSSION SCORE: ____ / 100

BEHANDLING:
✓ Gradert VRT (start lavintensitet)
✓ Visual motion desensitization
✓ Gradert fysisk aktivitet (Buffalo Protocol)
✓ Tverrfaglig: Fysioterapeut + Nevropsykolog

PROGNOSE: Flertallet (80-90%) bedres innen 4 uker med VRT', 'assessment');

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION insert_template IS 'Helper function to insert clinical templates - requires norwegian_clinical_templates.sql and vestibular_templates.sql to be loaded first';
