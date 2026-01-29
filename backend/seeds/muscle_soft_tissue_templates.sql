-- Muscle and Soft Tissue Clinical Templates
-- Comprehensive myofascial assessment and treatment templates
-- Aligned with the new MuscleMap component

-- ============================================================================
-- MYOFASCIAL FINDINGS (Muscle Findings)
-- ============================================================================

SELECT insert_template('Myofascial', 'Trigger Points', 'Trigger points cervical',
'Trigger Points funnet:
- Øvre trapezius: Aktive TrP bilateralt, referert smerte til suboccipital region
- Levator scapulae: Latente TrP høyre side
- SCM: Aktive TrP venstre med hodepine referering
- Scalener: Tender til palpasjon, ingen aktiv utstråling', 'objective');

SELECT insert_template('Myofascial', 'Trigger Points', 'Trigger points thoracolumbar',
'Trigger Points funnet:
- Erector spinae T6-T10: Aktive TrP bilateralt
- Quadratus lumborum: Aktive TrP høyre > venstre
- Multifidus L4-S1: Latente TrP med lokal ømhet
- Gluteus medius: Aktive TrP med referering til lateral lår', 'objective');

SELECT insert_template('Myofascial', 'Trigger Points', 'Trigger points hofte/bekken',
'Trigger Points funnet:
- Iliopsoas: Stram/kort bilateralt, ømhet til palpasjon
- Piriformis: Aktive TrP høyre side med ischiasliknende smerte
- Gluteus maximus: Latente TrP
- TFL/ITB: Stram bilateralt, tender ved iliakristakam
- Hamstrings: Proksimal ømhet bilateralt', 'objective');

SELECT insert_template('Myofascial', 'Hypertonus', 'Cervical hypertonus mønster',
'Muskulær hypertonus:
- Øvre trapezius: Hypertont bilateralt (++høyre)
- Levator scapulae: Hypertont bilateralt
- Suboccipitaler: Markert hypertonus
- Sternocleidomastoid: Moderat spenning venstre
- Scalener: Lett økt tonus bilateralt

Assosiert med fremoverskutt hode og økt thorakal kyfose', 'objective');

SELECT insert_template('Myofascial', 'Hypertonus', 'Lumbal hypertonus mønster',
'Muskulær hypertonus:
- Erector spinae L1-S1: Hypertont bilateralt (+++venstre)
- Quadratus lumborum: Markert hypertonus høyre
- Multifidus: Økt tonus L4-L5 segment
- Iliopsoas: Kort og stram bilateralt
- Rectus femoris: Moderat forkortet

Konsistent med anterior bekkentilt og økt lumbal lordose', 'objective');

SELECT insert_template('Myofascial', 'Svakhet', 'Cervicoscapular svakhet',
'Muskelsvakhet identifisert:
- Dype nakkefleksorer: Svak (3/5), dårlig utholdenhet
- Nedre trapezius: Svak (3+/5), inhibert
- Rhomboidei: Moderat svak (4-/5)
- Serratus anterior: Lett scapular winging ved armfleksjon

Typisk upper crossed syndrom mønster', 'objective');

SELECT insert_template('Myofascial', 'Svakhet', 'Lumbopelvic svakhet',
'Muskelsvakhet identifisert:
- Gluteus maximus: Svak (3+/5), forsinket aktivering
- Gluteus medius: Svak (3/5), positiv Trendelenburg
- Transversus abdominis: Dårlig rekruttering
- Multifidus: Atrofisk L4-L5, dårlig segmentell kontroll
- Hamstrings dominans over glutealer

Typisk lower crossed syndrom mønster', 'objective');

-- ============================================================================
-- SOFT TISSUE TREATMENT (Bløtvevsbehandling)
-- ============================================================================

SELECT insert_template('Behandling', 'Soft Tissue', 'Myofascial release cervical',
'Behandling utført:
- Myofascial release øvre trapezius bilateralt
- Ischemic compression suboccipitale TrP
- Muscle energy technique SCM
- PIR stretching levator scapulae
- Cross-fiber friction scalener', 'plan');

SELECT insert_template('Behandling', 'Soft Tissue', 'Myofascial release thoracolumbar',
'Behandling utført:
- Myofascial release erector spinae T4-L5
- Ischemic compression QL trigger points
- Transverse friction multifidus
- Muscle stripping iliocostalis
- PIR technique for longissimus', 'plan');

SELECT insert_template('Behandling', 'Soft Tissue', 'Hip and pelvis soft tissue',
'Behandling utført:
- Myofascial release iliopsoas
- Contract-relax stretching piriformis
- Ischemic compression gluteus medius TrP
- ITB foam rolling veiledning
- Hip flexor MET stretching
- Gluteal activation exercises', 'plan');

SELECT insert_template('Behandling', 'Soft Tissue', 'Dry needling session',
'Dry needling utført:
Nåler: Sterile akupunkturnåler 0.25x40mm
Lokalisasjoner:
- Øvre trapezius: 2 nåler bilateralt
- Levator scapulae: 1 nål høyre
- Multifidus L4: 2 nåler bilateralt
Respons: Lokal twitch-respons oppnådd
Bivirkninger: Ingen umiddelbare reaksjoner
Post-prosedyre: Lett stølhet forventet 24-48 timer', 'plan');

SELECT insert_template('Behandling', 'Soft Tissue', 'IASTM treatment',
'IASTM (Instrument Assisted Soft Tissue Mobilization):
Instrument: Graston/IASTM tool
Områder behandlet:
- Thorakolumbal fascie
- ITB lateral lår
- Gastrocnemius/soleus
Intensitet: Moderat
Varighet: 3-5 minutter per område
Reaksjon: Hyperemi observert, godt tolerert', 'plan');

-- ============================================================================
-- MUSCLE CHAINS AND PATTERNS
-- ============================================================================

SELECT insert_template('Vurdering', 'Muskelmønstre', 'Upper crossed syndrome',
'Upper Crossed Syndrome identifisert:

Stramme/overaktive muskler:
- Øvre trapezius og levator scapulae
- Pectoralis major og minor
- Suboccipitaler
- SCM

Svake/inhiberte muskler:
- Dype nakkefleksorer
- Nedre og midtre trapezius
- Serratus anterior
- Rhomboidei

Postural konsekvens:
- Fremoverskutt hode
- Økt cervikal lordose
- Thorakal kyfose
- Skulder protrasjon', 'assessment');

SELECT insert_template('Vurdering', 'Muskelmønstre', 'Lower crossed syndrome',
'Lower Crossed Syndrome identifisert:

Stramme/overaktive muskler:
- Iliopsoas
- Rectus femoris
- Erector spinae (lumbal)
- TFL/ITB

Svake/inhiberte muskler:
- Gluteus maximus og medius
- Abdominal muskulatur
- Hamstrings (relativt)
- Dype kjernestabilisatorer

Postural konsekvens:
- Anterior bekkentilt
- Økt lumbal lordose
- Hip flexor dominans
- Gluteal amnesi', 'assessment');

SELECT insert_template('Vurdering', 'Muskelmønstre', 'Layer syndrome',
'Layer Syndrome identifisert:

Kombinert upper og lower crossed pattern med:
- Segmentvis alternering mellom hyper- og hypotont vev
- Dorsoventral ubalanse gjennom hele columna
- Kompromittert respirasjonsmønster
- Generell postural dekompensasjon

Kompleks behandlingstilnærming nødvendig', 'assessment');

-- ============================================================================
-- ENHANCED SPINAL FINDINGS
-- ============================================================================

SELECT insert_template('Spinal', 'Subluxation', 'Cervical subluxation complex',
'Cervical Subluxation Complex:

Segmentelle funn:
- C1 (Atlas): Lateral listing venstre, rotasjon høyre
- C2 (Axis): Posterior body, rotasjon venstre
- C5-C6: Posterior superior høyre (PSR)

Assosierte funn:
- Redusert intersegmentell bevegelse
- Fasettledds fiksasjon
- Paravertebral hypertonus
- Positiv motion palpation

Neurological involvement: Ingen radiculopati', 'objective');

SELECT insert_template('Spinal', 'Subluxation', 'Thoracic subluxation complex',
'Thoracic Subluxation Complex:

Segmentelle funn:
- T3-T4: Bilateral posterior med ekstensjon restriksjon
- T6-T7: Høyre rotasjon med costovertebral involvering
- T9: Posterior inferior venstre (PIL)

Assosierte funn:
- Intercostal hypertonus
- Respiratorisk bevegelsesreduksjon
- Referert smerte interskapulært
- Positiv springy end-feel', 'objective');

SELECT insert_template('Spinal', 'Subluxation', 'Lumbar subluxation complex',
'Lumbar Subluxation Complex:

Segmentelle funn:
- L3: Posterior høyre med rotasjon
- L4: Bilateral posterior (fixation in extension)
- L5: Anterior inferior bilateralt

Assosierte funn:
- Fasettledds låsning L4-L5
- Paravertebral spasme
- Positiv prone leg check (kort ben høyre)
- Redusert lordose

Disc involvement: Negativ på testing', 'objective');

SELECT insert_template('Spinal', 'Disc', 'Disc bulge findings',
'Disc Bulge Findings:

Segment: L4-L5
Type: Posterior-lateral høyre

Kliniske tegn:
- Positiv SLR høyre ved 40 grader
- Negativ krysset SLR
- Dermatomal hypestesi L5 høyre
- Mild svakhet EHL høyre (4/5)
- Positiv Slump test

Imaging korrelasjon: MR viser forenlig funn

Severity: Moderat, ikke-kirurgisk kandidat', 'objective');

SELECT insert_template('Spinal', 'Stenosis', 'Spinal stenosis findings',
'Lumbal Stenose Funn:

Symptomer:
- Nevrogen claudicatio
- Bedring ved fleksjon (shopping cart sign positiv)
- Bilateral baksidesmerte
- Gangdistanse: ca 200m før pause nødvendig

Kliniske funn:
- Økt symptomer ved ekstensjon
- Lindring ved fleksjon
- Stramme hamstrings og hoftefleksorer
- Moderat svakhet LE bilateralt

Imaging korrelasjon: CT/MR bekrefter sentral stenose L3-L5', 'objective');

-- ============================================================================
-- TREATMENT NARRATIVES (Spinal)
-- ============================================================================

SELECT insert_template('Behandling', 'Adjustment', 'Cervical adjustment narrative',
'Cervikal justering utført:

Segmenter justert:
- C1: Toggle recoil venstre lateral
- C2: Rotary adjustment høyre
- C5-C6: Diversified prone posterior superior

Teknikk: Diversified, moderat kraft
Pasientposisjon: Supine for øvre cervical, prone for nedre
Respons: Kavitasjon oppnådd, god toleranse
Bivirkninger: Ingen umiddelbare', 'plan');

SELECT insert_template('Behandling', 'Adjustment', 'Thoracic adjustment narrative',
'Thorakal justering utført:

Segmenter justert:
- T3-T4: Cross-arm anterior thoracic bilateral
- T6-T7: Prone diversified høyre rotasjon
- T9: Knee-chest bilateral posterior

Teknikk: Diversified og Thompson drop
Pasientposisjon: Supine og prone
Respons: Kavitasjon oppnådd i alle segmenter
Rib mobilisering: R6-R7 høyre inkludert', 'plan');

SELECT insert_template('Behandling', 'Adjustment', 'Lumbar adjustment narrative',
'Lumbal justering utført:

Segmenter justert:
- L3: Side-posture rotary høyre
- L4: Prone diversified bilateral
- L5: Flexion-distraction protokoll

Teknikk: Diversified og Cox flexion-distraction
Pasientposisjon: Side-posture og prone
Respons: Kavitasjon L3-L4, god mobilisering L5
Sacral: SI-joint mobilisering høyre inkludert', 'plan');

SELECT insert_template('Behandling', 'Adjustment', 'Full spine adjustment session',
'Helryggjustering utført:

Cervical:
- C1 toggle venstre, C5-C6 PSR

Thoracal:
- T4-T5 bilateral, T8 høyre rotasjon

Lumbar:
- L3-L4 side-posture, L5-S1 flexion-distraction

Pelvis:
- SI-joint høyre anterior

Total varighet: 15 minutter
Toleranse: God
Kavitasjon: Oppnådd i primære segmenter
Post-justering: Retest viser forbedret ROM og redusert smerte', 'plan');

-- ============================================================================
-- FUNCTIONAL ASSESSMENTS
-- ============================================================================

SELECT insert_template('Funksjon', 'Movement', 'Functional movement screen',
'Functional Movement Screen (FMS):

1. Deep Squat: 2/3 - Kompensasjon med økt lumbal lordose
2. Hurdle Step: 2/3 - Mild hofteshift venstre
3. Inline Lunge: 2/3 - Ustabilitet, knekollaps
4. Shoulder Mobility: 2/3 - Asymmetri høyre < venstre
5. Active SLR: 2/3 - Stramme hamstrings bilateralt
6. Trunk Stability Push-up: 2/3 - Mild lordose
7. Rotary Stability: 2/3 - Kompensasjon i bekken

Total score: 14/21
Clearing tests: Negative for smerte

Konklusjon: Moderat bevegelsesbegrensning, fokus på mobility og stabilitet', 'objective');

SELECT insert_template('Funksjon', 'Balance', 'Balance assessment',
'Balansetesting:

Romberg test: Negativ
Romberg sensitivert (øyne lukket): Mild svaing
Sharpened Romberg: Positiv etter 8 sekunder
Tandem stance: 25 sekunder (mål: 30s)
Single leg stance øyne åpne: H: 28s, V: 25s
Single leg stance øyne lukket: H: 12s, V: 8s

Y-balance test:
- Anterior: H: 65cm, V: 62cm
- Posterolateral: H: 78cm, V: 75cm
- Posteromedial: H: 82cm, V: 80cm

Konklusjon: Mild proprioseptiv dysfunksjon, asymmetri', 'objective');

SELECT insert_template('Funksjon', 'Core', 'Core stability assessment',
'Kjernestabilitetstesting:

Pressure biofeedback:
- Resting: 40 mmHg
- Abdominal drawing-in: Økning til 44 mmHg (suboptimal)
- Leg lift: Tap av trykk (positiv test)

Prone instability test: Positiv - smerte reduseres med muskelkontraksjon
Side plank hold: H: 35s, V: 28s (asymmetri)
Anterior plank: 45 sekunder (mål: 60s)
Dead bug: Kompensasjon ved kontralateral arm/ben

McGill endurance:
- Flexors: 85s
- Extensors: 60s
- Side bridge: H: 42s, V: 35s
- Flexor/Extensor ratio: 1.4 (mål: <1.0)

Konklusjon: Redusert kjernestabilitet med fleksor dominans', 'objective');

-- ============================================================================
-- EXERCISE PRESCRIPTIONS
-- ============================================================================

SELECT insert_template('Øvelser', 'Cervical', 'Cervical exercise prescription',
'Hjemmeøvelser - Cervical:

1. Chin tucks (dype nakkefleksjoner)
   - 10 reps x 10 sek hold, 3 sett daglig
   - Fokus: Dobbelhake-posisjon, trekk haken rett bakover

2. Upper trapezius stretch
   - 30 sek hold, 3 reps hver side, 2x daglig
   - Tilt hodet til siden, trekk motsatt skulder ned

3. Levator scapulae stretch
   - 30 sek hold, 3 reps, 2x daglig
   - 45 graders rotasjon, look into armpit

4. Thoracic extension over roller
   - 10 reps, 2 sett daglig
   - Hendene bak hodet, rull langsomt over thorakal columna

5. Scapular retraction
   - 15 reps x 5 sek hold, 2 sett daglig
   - Trekk skulderbladene sammen og ned', 'plan');

SELECT insert_template('Øvelser', 'Lumbar', 'Lumbar stabilization exercises',
'Hjemmeøvelser - Lumbal stabilisering:

1. Abdominal bracing
   - 10 reps x 10 sek, 3 sett daglig
   - Stram magen som om du forbereder deg på et slag

2. Dead bug progressjon
   - Start: 10 reps per side
   - Progrssjon: Legg til arm/ben bevegelse
   - Kritisk: Oppretthold nøytral rygg

3. Bird dog
   - 10 reps x 5 sek hold, per side
   - Langsom, kontrollert bevegelse
   - Unngå rotasjon i bekken

4. Glute bridge
   - 15 reps x 5 sek hold oppe
   - Progresjon: Single leg bridges
   - Fokus: Aktiver glutealer, ikke hamstrings

5. Side plank progresjon
   - Start: Fra knær, 30 sek
   - Progresjon: Rett ben, 45 sek
   - Mål: 60 sek per side

Frekvens: Daglig
Review: Oppfølging om 2 uker', 'plan');

SELECT insert_template('Øvelser', 'Hip', 'Hip mobility and strengthening',
'Hjemmeøvelser - Hofte:

Mobility:
1. Hip flexor stretch (kneeling lunge)
   - 45 sek hold, 3 reps per side, 2x daglig

2. Piriformis stretch (figure 4)
   - 30 sek hold, 3 reps per side

3. 90/90 hip stretch
   - 30 sek per posisjon, rotér mellom

Strengthening:
4. Clamshells
   - 15 reps, 2 sett, med motstandsbånd

5. Side-lying hip abduction
   - 15 reps, 2 sett per side

6. Single leg Romanian deadlift
   - 10 reps per side, fokus på kontroll

7. Monster walks med bånd
   - 20 skritt hver retning

Frekvens: 5x per uke minimum', 'plan');

-- ============================================================================
-- CLEAN UP
-- ============================================================================

-- Drop the helper function when done (optional)
-- DROP FUNCTION IF EXISTS insert_template(VARCHAR, VARCHAR, VARCHAR, TEXT, VARCHAR, VARCHAR);
