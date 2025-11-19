-- Physiotherapy Clinical Templates (AMV)
-- Comprehensive SOPE templates for physiotherapy practice
-- Based on clinical documentation patterns from Arne Martin Vik

-- Helper function to insert templates
CREATE OR REPLACE FUNCTION insert_physio_template(
  p_category VARCHAR,
  p_subcategory VARCHAR,
  p_name VARCHAR,
  p_text TEXT,
  p_soap_section VARCHAR DEFAULT 'objective',
  p_language VARCHAR DEFAULT 'NO'
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
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SKULDER (SHOULDER)
-- ============================================================================

SELECT insert_physio_template('Skulder', 'Anamnese', 'Rotator Cuff Plage',
'Anamnese:
Har hatt vondt i skulderen og nakken. [Varighet: ____]
Lokalisering: [Venstre/Høyre] skulder, stråler [ut i armen/over skulderblad/____]
Provoserende: [Push-ups/Løfting/Belastning med vekter/____]
Lindrende: [Hvile/Nålebehandling/____]
Traume: [Ja/Nei] - [Beskrivelse hvis ja]
Søvn: [Våkner ofte/Vanskelig å ligge på siden/Normal]
Trening: [Type trening: ____ ] [Frekvens: ____ ganger/uke]
Tidligere skader: [Skulderen ute av ledd/Brudd/Ingen]

PSFS: ___/10 ved [aktivitet]', 'subjective');

SELECT insert_physio_template('Skulder', 'Undersøkelse', 'Rotator Cuff Undersøkelse',
'Undersøkelse:
Holdning/Observasjon:
- Scapulohumeral rytme: [Noe stivhet/Smerter i toppposisjon/Smertebue/UA]

AROM Skulder:
- Fleksjon: [___]° [ve/hø], [smertefri/ubehag/smerte]
- Abduksjon: [___]° [ve/hø], [smertefri/ubehag/smerte]
- Mangler [___] grader Flex ved full ABD bilateral

PROM: [Full/Nedsatt/____]

Muskelstyrke (Oxford skala):
- Serratus Anterior: [___]/5 [ve/hø]
- Pectoralis Major: [___]/5 [ve/hø]
- Pectoralis Minor: [___]/5 [ve/hø]
- Midtre Trapezius: [___]/5 bilateral
- Rhomboideus: [___]/5 bilateral
- Nedre Trapezius: [___]/5 bilateral
- Supraspinatus: [___]/5 [ve/hø]
- Infraspinatus: [___]/5 [ve/hø]
- Subscapularis: [___]/5 [ve/hø]
- Biceps/Triceps: [___]/5

Palpasjon:
- Ømt i: [Tx/Scap/Interscap/PecMin/____]
- Meget ømt over: [Rhomb/Teres Min/Teres Maj/____]', 'objective');

SELECT insert_physio_template('Skulder', 'Tiltak', 'Skulder Rehabilitering',
'Tiltak:
Behandling:
- Tpm: [Tx, Scap, Cx/____]
- MWM: [____]
- KT: [Supra/Infra/SubScap/TeresMin/TeresMaj] [ve/hø], [med/inf/sup] drag
- LT: [____]

Øvelser:
- Wallslide m/strikk
- Skuldertap i [Bear Crawl pos/Knestående Push-up pos/Slynge/mot benk]
- Around the world m/[strikk/2 kg vekt]
- Retraksjon m/strikk
- Y-press m/strikk
- 1arms Serratus Push-up mot benk
- Stående 90/90 UR m/strikk
- IR m/strikk
- Pike drag m/håndkle
- Liggende Pullover m/vekt

Råd:
- Tilpasse trening ift smerte
- Unngå [____]', 'plan');

SELECT insert_physio_template('Skulder', 'Diagnose', 'Rotator Cuff Relatert Skulderplage',
'Konklusjon/Diagnose:
Undersøkelsene tyder på at smertene kan komme av en Rotator cuff-relatert skulderplage [ve/hø] side.

Funn:
- [Nedsatt bevegelsesutslag/Smertebue/Svakhet i rotatorene]
- [Scapulohumeral dysfunksjon]
- [Økt tonus i muskulatur]

Bør bedres med kombinasjon av manuell behandling og styrketrening.', 'assessment');

SELECT insert_physio_template('Skulder', 'Diagnose', 'Frosen Skulder',
'Konklusjon/Diagnose:
Adhesiv Kapsulitt (Frosen Skulder) [ve/hø] side.

Funn:
- Betydelig nedsatt aktiv ROM: ABD [___]°, Flex [___]°
- Smerter i toppposisjon (+++)
- Smertebue (+++)
- Nedsatt styrke i Supra, Infra og Subscap

Varighet: [___] måneder
Vurdere: [Kortisoninjeksjon/Videre utredning]', 'assessment');

-- ============================================================================
-- NAKKE/CERVIKAL
-- ============================================================================

SELECT insert_physio_template('Nakke', 'Anamnese', 'Nakkesmerte',
'Anamnese:
Har hatt stivhet og smerte i nakken [ve/hø] side i [___] uker/måneder.
Lokalisering: [Nakke/Skulderblad/Stråler ned i arm]
Beskrivelse: [Stram muskulatur/Låsningsfølelse/Stikker/____]
Provoserende: [Sitte lenge/Bøye seg/Vri hodet/Se mot [ve/hø]/____]
Lindrende: [Hvile/Varme/Bevegelse/____]
Traume: [Nei/Ja - beskrivelse]
Søvn: [Våkner ofte/Må snu seg/Normal]
Radierende smerter: [Ja - oversiden/baksiden av arm/Nei]
Sensorisk/Motorisk: [Nummenhet i arm/finger/Ingen]
Hodepine: [Ja/Nei]

Arbeid: [____]
Stress: [Høyt/Moderat/Lavt]', 'subjective');

SELECT insert_physio_template('Nakke', 'Undersøkelse', 'Cervikal Undersøkelse',
'Undersøkelse:
AROM Cervikal:
- Fleksjon: [Normal/Nedsatt/Redusert]
- Ekstensjon: [Normal/Nedsatt/Sterkt nedsatt]
- Rotasjon ve/hø: [Normal/Nedsatt mot [ve/hø]/____]
- Lateralfleksjon ve/hø: [Normal/Nedsatt mot [ve/hø]/____]

PROM: [Normal/Nedsatt]

Muskelstyrke:
- Isometrisk kraft (fleksjon, ekstensjon, lateralfleksjon, rotasjon): [UA/Ubehag/Nedsatt]

Spesielle tester:
- Spurling''s prøve: [Negativ/Positiv - ubehag ved trykk [bilateral/ve/hø]]
- Doorbell sign: [Negativ/Positiv]
- Leddspill: [UA/Nedsatt]

Palpasjon:
- Ømt i: [Tx/Cx/Scap] [ve/hø] side
- Spesielt ømt i: [NedTrapz/Rhomb/Scalenii/PecMin/Suboccipital muskler]
- Forhøyet tonus: [____]', 'objective');

SELECT insert_physio_template('Nakke', 'Tiltak', 'Nakke Behandling',
'Tiltak:
Behandling:
- Tpm: [Tx, Cx, Scap]
- MWM Cx-LatFlex [ve/hø], SNAG [C3/C4/C5] [ve/hø]
- MWM Cx-Rot [ve/hø], SNAG [C3/C4/C5] [ve/hø]
- RNAG Tx-Rot, Th1-Th6
- Neurac Cx-behandling

Øvelser:
- Wallslide m/strikk
- Y-press m/rotasjon m/strikk
- HodeRetraksjon m/ball
- Rotasjon
- SelvMWM Cx-Rot
- Sideliggende Cx-LatFlex

KT/LT:
- [Spes. område]', 'plan');

SELECT insert_physio_template('Nakke', 'Diagnose', 'Biopsykososial Overbelastning Nakke',
'Konklusjon/Diagnose:
Pasientens plager virker å være relatert til en biopsykososial overbelastning rundt muskulaturen i nakken.

Funn:
- Redusert AROM i flere plan
- Forhøyet tonus i cervikal og thorakal muskulatur
- [Stressfaktorer]

Bør bedres med kombinasjon av manuell behandling og styrketrening.
Råd om stressmestring og ergonomi gitt.', 'assessment');

-- ============================================================================
-- KNE
-- ============================================================================

SELECT insert_physio_template('Kne', 'Anamnese', 'Hoffas Fettpute',
'Anamnese:
Vondt i [ve/hø] kne [under kneskåla/på innsiden/____]
Startet: [Dato/Aktivitet: ____]
Beskrivelse: [Låser seg/Henger seg opp/Som væske i kneet/____]
Provoserende: [Knebøy/Trapper/Hip thrust/____]
Lindrende: [Hvile/____]
Tidligere skader: [Menisk/Korsbånd på [ve/hø]/Ingen]
Trening: [Type: ____] [Frekvens: ___/uke]
Funksjon: [Markløft og utfall OK/Vanskelig med knebøy/____]

Observert: [Hevelse/Ingen synlige forandringer]', 'subjective');

SELECT insert_physio_template('Kne', 'Undersøkelse', 'Hoffas/Patellofemoral Undersøkelse',
'Undersøkelse:
Holdning/Observasjon:
- Hevelse: [Lett økt hevelse rundt [ve/hø] kne/Ingen]

AROM/PROM kne:
- Fleksjon: [Lett nedsatt/Normal] [bilateral/ve/hø]
- Ekstensjon: [Lett nedsatt/Normal/Ubehag ved full Ex]

Muskelstyrke:
- Knebøy 1 bens: [Økt ustabilitet [ve/hø]/Kompenserer/Ubehag ved ca [___] grader Flex]
- Quadriceps: [___]/5 [bilateral/ve/hø]
- Hamstrings: [___]/5

Spesielle tester:
- Grinding test: [Negativ/Ubehag [ve/hø]]
- Hoffas Squeeze test: [Negativ/Ubehag [ve/hø]]
- Patelar apprehension: [Negativ/Ubehag/Ekkel følelse [ve/hø]]

Palpasjon:
- Hoffas: [Negativ/Ubehag [ve/hø]]', 'objective');

SELECT insert_physio_template('Kne', 'Anamnese', 'Menisk',
'Anamnese:
Vondt i [ve/hø] kne.
Startet: [Akutt ved vridning/Gradvis/____]
Mekanisme: [Løp og fikk touch i kneet/Foten stod fast/____]
MR-funn: [____]
Beskrivelse: [Vondt å rette ut/bøye/Støtsmerte/____]
Lokalisering: [Innsiden/Utsiden/Bak i kneet]
Provoserende: [____]
Lindrende: [____]', 'subjective');

SELECT insert_physio_template('Kne', 'Undersøkelse', 'Menisk Undersøkelse',
'Undersøkelse:
AROM/PROM kne:
- Fleksjon: [Lett nedsatt/Vondt]
- Ekstensjon: [Lett nedsatt/Vondt]

Styrke:
- Quadriceps Femoris: [___]/5 [ve/hø]

Spesielle tester:
- McMurray: [Negativ/Noe motbevegelse/Positiv]
- Thessaly Test: [Negativ/Positiv]

Palpasjon av menisk:
- Medial menisk: [UA/Ubehag [ant/post]]
- Lateral menisk: [UA/Ubehag [ant/post]]', 'objective');

SELECT insert_physio_template('Kne', 'Tiltak', 'Kne Rehabilitering',
'Tiltak:
Behandling:
- LT Hoffas [ve/hø]
- Dynamic tape KneEx Power, lett strekk [ve/hø]
- Dynamic tape Patella Normal lat glide [ve/hø]
- MWM KneFlex [ve/hø] IR glide
- LT IR [ve/hø] kne

Øvelser:
- Sissy squat [m/støtte]
- Step-up
- Halvmåne
- Spanish squat
- Pistol squat
- Curtsy lunge
- Strak seteløft
- Sideliggende x-faktor
- HamsCurl m/håndkle
- Skøytehopp m/rotasjon
- Frontbøy
- 1bens Hip Thrust
- NordicQuads m/strikk
- Bekkenvipp i trapp

Råd:
- Explain pain (smertefysiologi, trening)
- Tilpasset belastning', 'plan');

SELECT insert_physio_template('Kne', 'Diagnose', 'Hoffas Fettpute',
'Konklusjon/Diagnose:
Sannsynligvis en irritasjon i Hoffas fettpute [ve/hø] side.

Funn:
- Positiv Hoffas Squeeze test
- [Grinding test positiv/negativ]
- [Nedsatt styrke i Quadriceps]

Bør bedres med styrketrening og tilpasset belastning.
Vurdere henvisning til ultralydsdiagnostikk ved ikke forventet fremgang.', 'assessment');

SELECT insert_physio_template('Kne', 'Diagnose', 'Menisk Ruptur',
'Konklusjon/Diagnose:
Sannsynligvis en partiell ruptur på [laterale/mediale] menisk på [ve/hø] [anteriore/posteriore] side.

MR-funn: [____]

Funn:
- [McMurray positiv]
- [Ubehag ved palpasjon av menisk]
- [Nedsatt ROM]

Plan: [Konservativ behandling/Vurdere ortoped-henvisning]', 'assessment');

SELECT insert_physio_template('Kne', 'Diagnose', 'Patellaluksasjon',
'Konklusjon/Diagnose:
[Første gangs/Gjentatt] patellaluksasjon [ve/hø] side.

Skademekanisme: [____]
RTG-funn: [Ingen ytterligere skader/____]

Funn:
- Positiv Patelar apprehension test
- Smerte under kneskål
- [Hoffas positiv]
- Redd for at det skal skli ut igjen

Fokus: Stabilisering og styrketrening av Quadriceps.', 'assessment');

-- ============================================================================
-- ANKEL/FOT
-- ============================================================================

SELECT insert_physio_template('Ankel', 'Anamnese', 'Ankelskade',
'Anamnese:
[Røket sene/Overtråkk/Vridning] i ankelen [ve/hø]
Startet: [Dato/____]
Mekanisme: [Fotball og overtråkk/____]
RTG-funn: [Ingen funn/____]
Aktuelt: [Vondt/Hoven/Stivt]
Provoserende: [Gå/Stå lenge/Trapper/____]
Funksjon: [Må halte/Blir veldig fort hoven/____]
Arbeid: [Står [___] timer om dagen/____]
Tidligere: [Aldri vært helt bra siden skaden/Første gang]', 'subjective');

SELECT insert_physio_template('Ankel', 'Undersøkelse', 'Ankelskade Undersøkelse',
'Undersøkelse:
Holdning/Observasjon:
- Hevelse: [Observerbar hevelse rundt ankelen [ve/hø]/Ingen]
- Pronasjon: [Økt pronasjon [ve/hø] fot/Normal]

AROM/PROM ankel:
- Dorsalfleksjon: [Lett nedsatt/Sterkt nedsatt/Normal] [ve/hø]
- Plantarfleksjon: [Lett nedsatt/Normal] [ve/hø]
- Inversjon: [Nedsatt/Normal] [ve/hø]
- Eversjon: [Nedsatt/Normal] [ve/hø]

Muskelstyrke:
- Plantarfleksjon: [Ubehag ved tåhev/Ustabilitetsfølelse/___/5]
- Dorsalfleksjon: [___]/5 [ve/hø]
- Inversjon: [___]/5 [ve/hø]
- Eversjon: [___]/5 [ve/hø]

Spesielle tester:
- Kne til vegg test: [___] cm [ve/hø]
- Y-test: [___] cm [ve/hø]
- Skuffetest ankel (ATFL): [Negativ/Meget ubehagelig/Økt laksitet] [ve/hø]
- Talar tilt test (CFL): [Negativ/Ubehag/Økt laksitet/CFL ikke palpabel] [ve/hø]
- Syndesmose Squeeze test: [Negativ/Ubehag distalt] [ve/hø]
- Cotton test: [Negativ/Økt laksitet] [ve/hø]

Palpasjon:
- Meget øm bilat ved [medialt/lateralt] trykk ved inseksjon på Calcaneus
- ATFL: [Palpabel/Ikke palpabel/Øm]
- CFL: [Palpabel/Ikke palpabel/Øm]', 'objective');

SELECT insert_physio_template('Ankel', 'Tiltak', 'Ankel Rehabilitering',
'Tiltak:
Behandling:
- KT Peron [ve/hø], [inf/sup] drag
- LT Fibula [ve/hø] [post glide]
- MWM AnkelDorsiFlex [ve/hø], Fibula post glide
- KT TibPost [ve/hø], sup drag

Øvelser:
- 1bens balanse på pute m/halvsirkel
- 1bens Balanse m/benbev [på matte]
- Inversjon m/strikk
- Eversjon m/strikk
- 1bens tåhev m/mynt på trinn
- 1bens GastrocTåhev i trapp
- 1bens SoleusTåhev i trapp
- 1bens EksGastrocTåhev fra gulv
- 1bens Tåløft m/rygg mot vegg
- Tåkrøll m/håndkle

Råd:
- [____]', 'plan');

SELECT insert_physio_template('Ankel', 'Diagnose', 'Ankelskade Grad 1-3',
'Konklusjon/Diagnose:
Sannsynligvis en grad [1/2/3] skade på Anterior Thalofibulare ligament (ATFL) og en grad [1/2/3] skade på Calcaneofibulare ligament (CFL) [ve/hø] side.
[Samt en skade på Syndesmosen på [ve/hø] side.]

Funn:
- [Skuffetest positiv/Økt laksitet i ATFL]
- [Talar tilt test positiv/CFL ikke palpabel]
- [Syndesmose Squeeze test positiv]
- [Observerbar hevelse]
- [Nedsatt AROM/PROM]

Forventet rehabiliteringstid: [6-8 uker/12-16 uker]', 'assessment');

SELECT insert_physio_template('Ankel', 'Anamnese', 'Severs (Hælsmerte)',
'Anamnese:
Har hatt veldig vondt i helene.
Alder: [___] år
Provoserende: [Løp/Mindre demping/____]
Lindrende: [Hvile/____]
Vekst: [Har vokst veldig mye det siste halve året/____]
Varighet: [___] måneder
Bilateral: [Ja, mest [ve/hø]/Kun [ve/hø]]
Traume: [Nei/Ja]
Søvn: [Bare etter trening/Vanskelig å sovne/Normal]
Trening: [Type: ____] [Frekvens: ___/uke]
Funksjon: [Har stått over treninger pga smerter/____]

PSFS: ___/10 ved løp', 'subjective');

SELECT insert_physio_template('Ankel', 'Diagnose', 'Severs Syndrom',
'Konklusjon/Diagnose:
Mistenker Severs syndrom [bilateral/ve/hø] (L17 Hælsmerte).

Funn:
- Meget øm bilateral ved medialt/lateralt trykk ved inseksjon på Calcaneus
- [Økt pronasjon]
- [Plantarfleksjon: Går opp noe på lat side av fot]

Råd:
- Tilpasse ift smerte for trening
- Redusere tøyning av ankel
- [Vurdere innlegg/støttende sko]', 'assessment');

-- ============================================================================
-- HOFTE/LYSKE
-- ============================================================================

SELECT insert_physio_template('Hofte', 'Anamnese', 'Hofte/Lyskesmerte',
'Anamnese:
Vondt i [hoften/lysken/innsiden av benet] [ve/hø]
Lokalisering: [____]
Beskrivelse: [Strekker veldig/Som noe drar seg over/____]
Provoserende: [Tøye/Hopp/Splitt/Kicks/Bøye seg/____]
Lindrende: [____]
Varighet: [___]
Tidligere aktivitet: [Dans/Turn/Golf/Fotball]
Tidligere skader: [____]
Funksjon: [____]', 'subjective');

SELECT insert_physio_template('Hofte', 'Undersøkelse', 'Hofte Undersøkelse',
'Undersøkelse:
AROM/PROM hofte:
- Fleksjon: [Normal/Redusert/Nedsatt] [ve/hø]
- Abduksjon: [Normal/Redusert] [ve/hø]
- Innadrotasjon: [Normal/Nedsatt] [ve/hø]
- Utadrotasjon: [Normal/Nedsatt] [ve/hø]

Muskelstyrke (Oxford skala):
- Psoas: [___]/5 [bilateral/ve/hø]
- Gluteus Maximus-Ekstensjonskomponent: [___]/5 [bilateral/ve/hø]
- Gluteus Medius: [___]/5 [bilateral/ve/hø]
- Piriformis: [___]/5 [bilateral/ve/hø]
- Quadriceps Femoris: [___]/5
- Hamstrings: [___]/5
- Adduktorer: [___]/5 [ve/hø]

Spesielle tester:
- FABER: [Negativ/Ubehag [ve/hø]]
- FADIR/FADDIR: [Negativ/Ubehag [ve/hø]]
- Thomas Test: [Negativ/Positiv - stramme hofteleddsbøyere]
- Ober''s Test: [Negativ/Positiv]
- Trendelenburg Test: [Negativ/Positiv [ve/hø]]

Palpasjon:
- Meget ømt i: [sete/adduktorer/Psoas/Piriformis/Glut Med] [ve/hø]', 'objective');

SELECT insert_physio_template('Hofte', 'Tiltak', 'Hofte Rehabilitering',
'Tiltak:
Behandling:
- Tpm Sete [ve/hø]
- Tpm Psoas [ve/hø]
- MWM HofteFlex liggende og stående [ve/hø], lat glide
- MWM BekkenFlex [ve/hø], kaud glide

Øvelser:
- Bekkenvipp m/vektarm (fokus på Pelvic tilt)
- Step-up
- Sideliggende Sumo
- Brannhydrant m/strikk
- Copenhagen lvl 2 i slynge/på benk
- Sideveis utfall m/strikk
- IsjiTensioner
- IsjiSlider
- Liggende IsjiSlider
- Hofterotasjon 90/90 (fokus på vinkel)
- 1bens Rumensk markløft m/vekt
- Hurtig ADD m/strikk
- Palof press m/strikk

Råd:
- [Tilpasse tøyning/Redusere kicks/____]', 'plan');

SELECT insert_physio_template('Hofte', 'Diagnose', 'Hofte/Lyske Problematikk',
'Konklusjon/Diagnose:
[Adduktor-relatert lyskesmerte/FAI-mistanke/Piriformis syndrom] [ve/hø] side.

Funn:
- [FABER positiv]
- [FADIR positiv]
- [Svakhet i Glut Med]
- [Ømt i adduktorer/sete]
- [Nedsatt ROM]

Bør bedres med styrketrening og tilpasset belastning.
[Vurdere videre utredning ved manglende fremgang.]', 'assessment');

-- ============================================================================
-- RYGG/KORSRYGG
-- ============================================================================

SELECT insert_physio_template('Rygg', 'Anamnese', 'Lumbago',
'Anamnese:
Vondt i [korsryggen/nedre del av ryggen]
Startet: [Dato/Aktivitet: ____]
Beskrivelse: [Rykk bak i ryggen/Krampe/Stiv/____]
Lokalisering: [Korsrygg/Stråler til [rumpe/ben]/____]
Provoserende: [Bøye seg fremover/bakover/Løfte/Sitte lenge/____]
Lindrende: [Hvile/Bevegelse/____]
Varighet: [Akutt/[___] uker/måneder]
Tidligere episoder: [Ja - til og fra siden [dato]/Nei]
MR/CT: [Nei/Ja - funn: ____]
Søvn: [Våkner mye/Vanskelig å snu seg/Normal]
Radierende smerter: [Nei/Ja - [ve/hø] side, [rumpe/bakside ben/____]]
Sensorisk/Motorisk: [Ingen/Nummenhet i [____]/Svakhet i [____]]

Røde flagg screenet: [Ingen feber, ingen vekttap, ingen nattsmerter, ingen inkontinens, ingen bilateral ben svakhet]', 'subjective');

SELECT insert_physio_template('Rygg', 'Undersøkelse', 'Lumbal Undersøkelse',
'Undersøkelse:
AROM Lumbal:
- Fleksjon: [Normal - kommer til [knærne/tærne]/Nedsatt/____]
- Ekstensjon: [Normal/Nedsatt/Ubehag]
- Lateralfleksjon: [Normal/Nedsatt/Ubehag ved LatFlex mot [ve/hø]]
- Rotasjon: [Normal/Nedsatt]

Schober''s Test: [Normal (>15cm)/Nedsatt: ___ cm]
Finger-to-Floor Distance: [___] cm

Muskelstyrke:
- Magefleksjon: [___]/5
- RyggExtensjon: [___]/5
- Psoas: [___]/5 [bilateral/ve/hø]

Neurodynamikk:
- Straight Leg Raise (SLR): [Negativ bilateral >70°/Positiv ved [___]°]
- Crossed SLR: [Negativ/Positiv]
- Slump Test: [Negativ/Positiv]

Palpasjon:
- Forhøyet tonus: [paraspinalt lumbal/QL/gluteal] [bilateral/ve/hø]
- Meget ømt: [Sete/GlutMed/QL/L[___]/____]', 'objective');

SELECT insert_physio_template('Rygg', 'Tiltak', 'Rygg Rehabilitering',
'Tiltak:
Behandling:
- Bvb/Tpm lumbal paraspinalt [bilateral/ve/hø]
- Tpm [gluteal/QL/Sete] [bilateral/ve/hø]
- MWM BekkenFlex [bilateral/ve/hø], kaud glide
- KT erector spinae
- KT Psoas [ve/hø], sup drag

Øvelser:
- Dead bug [m/korsryggsstrikk]
- Jefferson curl [m/vekt/m/bok]
- Bekkenvipp [på bok m/støtte/m/vektarm/i trapp]
- Lx-Ex mot vegg m/albuestøtte
- Kneløft m/strikk
- Palof press m/strikk
- Lx-Rot m/strikk
- Sittende GoodMornings
- 4fot Diagonalhev m/sidebev
- Tåløft m/ryggen mot veggen

Råd:
- Explain pain (smertefysiologi)
- Viktigheten av bevegelse og nok søvn
- God smertelindring
- Ergonomi', 'plan');

SELECT insert_physio_template('Rygg', 'Diagnose', 'Lumbago',
'Konklusjon/Diagnose:
Lumbago med muskulære spenninger.

Funn:
- [Nedsatt bevegelsesutslag]
- [Forhøyet tonus i lumbal/gluteal muskulatur]
- [Ingen nevrologiske utfall]
- [Ingen røde flagg]

Bør bedres med kombinasjon av manuell behandling, øvelser og aktivitetstilpasning.
Forventet bedring innen [2-6] uker.', 'assessment');

SELECT insert_physio_template('Rygg', 'Diagnose', 'Prolaps under utvikling',
'Konklusjon/Diagnose:
Sannsynligvis et prolaps under fremvekst i [L4/L5/L5/S1].

MR-funn: [____]

Funn:
- [SLR positiv]
- [Radierende smerter]
- [Nedsatt ROM]
- Svært plaget med nattsmerter

Råd:
- Viktigheten av bevegelse og nok søvn når det går
- God smertelindring
- [Vurdere henvisning til [ortoped/nevrolog]]', 'assessment');

-- ============================================================================
-- BEHANDLINGSTEKNIKKER
-- ============================================================================

SELECT insert_physio_template('Behandling', 'Manuell', 'Triggerpunkt Behandling',
'Behandling:
Triggerpunkt myofascial behandling (Tpm):
- [Tx, Scap, Cx/Sete, Lx, Quads/____]
- Bilateral/[ve/hø] side
- Slipper: [bra/moderat/dårlig]

Funn:
- [Økt tonus]
- [Triggerpunkter i [____]]
- [Stramhet]', 'plan');

SELECT insert_physio_template('Behandling', 'Manuell', 'MWM Mobilisering',
'Behandling:
Mulligan Mobilisation with Movement (MWM):
- [BekkenFlex/HofteFlex/KneFlex/AnkelDorsiFlex/Cx-LatFlex/Cx-Rot] [bilateral/ve/hø]
- Glide: [kaud/lat/post/____]
- [SNAG [C3/C4/C5/____] [ve/hø]]
- [RNAG Tx-Rot, Th1-Th6]

Respons: [God/Moderat/Ingen]', 'plan');

SELECT insert_physio_template('Behandling', 'Taping', 'Kinesiotape',
'Behandling:
Kinesiotape (KT):
- [Supra/Infra/SubScap/TeresMin/TeresMaj/VastLat/Peron/TibPost/HalluxABD/erector spinae/Psoas] [ve/hø]
- Drag: [med/inf/sup/prox/ingen]

Formål: [Støtte/Aktivering/Smertelindring/____]', 'plan');

SELECT insert_physio_template('Behandling', 'Taping', 'Leukotape',
'Behandling:
Leukotape (LT):
- [Hoffas/Fibula/IR kne] [ve/hø]
- [Post glide/____]

Formål: [Stabilisering/Støtte/____]', 'plan');

-- ============================================================================
-- ØVELSER - SKULDER
-- ============================================================================

SELECT insert_physio_template('Øvelser', 'Skulder', 'Skulder Styrke Grunnleggende',
'Øvelser:
1. Wallslide m/strikk
   - [___] repetisjoner x [___] sett

2. Skuldertap i [Bear Crawl pos/Knestående Push-up pos/slynge/mot benk]
   - [___] repetisjoner x [___] sett

3. Around the world m/[strikk/2 kg]
   - [___] repetisjoner x [___] sett

4. Y-press m/[strikk/rotasjon m/strikk]
   - [___] repetisjoner x [___] sett

Frekvens: [___] ganger/uke
Progresjon: [____]', 'plan');

SELECT insert_physio_template('Øvelser', 'Skulder', 'Rotator Cuff Spesifikk',
'Øvelser:
1. Stående 90/90 UR m/strikk
   - [___] repetisjoner x [___] sett

2. IR m/strikk
   - [___] repetisjoner x [___] sett

3. 1arms Serratus Push-up mot benk
   - [___] repetisjoner x [___] sett

4. Retraksjon m/strikk
   - [___] repetisjoner x [___] sett

5. Liggende Pullover m/vekt
   - [___] repetisjoner x [___] sett

Frekvens: [___] ganger/uke', 'plan');

-- ============================================================================
-- ØVELSER - KNE
-- ============================================================================

SELECT insert_physio_template('Øvelser', 'Kne', 'Kne Styrke',
'Øvelser:
1. Sissy squat [m/støtte]
   - [___] repetisjoner x [___] sett

2. Step-up
   - [___] repetisjoner x [___] sett hver side

3. Spanish squat
   - [___] sekunder hold x [___] sett

4. Halvmåne
   - [___] repetisjoner x [___] sett hver side

5. 1bens Hip Thrust
   - [___] repetisjoner x [___] sett

Frekvens: [___] ganger/uke', 'plan');

-- ============================================================================
-- ØVELSER - ANKEL
-- ============================================================================

SELECT insert_physio_template('Øvelser', 'Ankel', 'Ankel Rehabilitering',
'Øvelser:
1. 1bens balanse [på pute m/halvsirkel/m/benbev]
   - [___] sekunder x [___] sett hver side

2. 1bens GastrocTåhev i trapp
   - [___] repetisjoner x [___] sett hver side

3. 1bens SoleusTåhev i trapp
   - [___] repetisjoner x [___] sett hver side

4. Inversjon m/strikk
   - [___] repetisjoner x [___] sett

5. Eversjon m/strikk
   - [___] repetisjoner x [___] sett

Frekvens: Daglig', 'plan');

-- ============================================================================
-- ØVELSER - HOFTE
-- ============================================================================

SELECT insert_physio_template('Øvelser', 'Hofte', 'Hofte Styrke',
'Øvelser:
1. Sideliggende Sumo
   - [___] repetisjoner x [___] sett hver side

2. Step-up
   - [___] repetisjoner x [___] sett hver side

3. Bekkenvipp m/vektarm
   - [___] repetisjoner x [___] sett

4. 1bens Rumensk markløft m/vekt
   - [___] repetisjoner x [___] sett hver side

5. Hofterotasjon 90/90
   - [___] repetisjoner x [___] sett

Frekvens: [___] ganger/uke', 'plan');

-- ============================================================================
-- ØVELSER - RYGG
-- ============================================================================

SELECT insert_physio_template('Øvelser', 'Rygg', 'Rygg Stabilisering',
'Øvelser:
1. Dead bug [m/korsryggsstrikk]
   - [___] repetisjoner x [___] sett

2. Jefferson curl [m/vekt/m/bok]
   - [___] repetisjoner x [___] sett

3. Bekkenvipp [m/vektarm/på bok m/støtte]
   - [___] repetisjoner x [___] sett

4. 4fot Diagonalhev m/sidebev
   - [___] repetisjoner x [___] sett hver side

5. Palof press m/strikk
   - [___] repetisjoner x [___] sett

Frekvens: [___] ganger/uke', 'plan');

-- ============================================================================
-- SPESIELLE TILSTANDER
-- ============================================================================

SELECT insert_physio_template('Spesielle', 'Barn/Ungdom', 'Severs Protokoll',
'Severs Syndrom Rehabilitering:

Fase 1 (Uke 1-2): Smertedemping
- KT TibPost [ve/hø], sup drag
- 1bens balanse på pute m/halvsirkel: 3x30 sek
- Inversjon m/strikk: 3x15
- Tåkrøll m/håndkle: 3x10

Fase 2 (Uke 3-4): Progresjon
- 1bens tåhev m/mynt på trinn: 3x12 hver side
- Fortsett balanse og inversjon

Fase 3 (Uke 5+): Retur til aktivitet
- Gradvis økning av løpebelastning
- Fortsett øvelser 3x/uke

Råd:
- Tilpasse trening ift smerte
- Redusere tøyning av ankel
- God oppvarming før aktivitet', 'plan');

SELECT insert_physio_template('Spesielle', 'Idrett', 'Retur til Idrett Protokoll',
'Retur til Idrett - [Sport]:

Kriterier for retur:
- Minimal smerte ved daglige aktiviteter (VAS <2/10)
- [___]% styrke sammenlignet med frisk side
- Fullført alle øvelser uten kompensasjon
- Mestrer sportspesifikke bevegelser

Trinnvis plan:
Level 1-3: Grunnleggende styrke og bevegelse
Level 4-6: Sportspesifikke øvelser
Level 7-9: Full kontakt/konkurranse

Vurdering: [____]
Forventet tid til retur: [___] uker', 'plan');

-- ============================================================================
-- PASIENT-RAPPORTERTE UTFALL
-- ============================================================================

SELECT insert_physio_template('Utfall', 'PSFS', 'Patient Specific Functional Scale',
'Patient Specific Functional Scale (PSFS):

Aktivitet 1: [____]
Nåværende nivå: ___/10 (0=umulig, 10=normal)

Aktivitet 2: [____]
Nåværende nivå: ___/10

Aktivitet 3: [____]
Nåværende nivå: ___/10

Gjennomsnitt: ___/10

Mål: Forbedring på minimum 2 poeng per aktivitet', 'subjective');

SELECT insert_physio_template('Utfall', 'Oppfølging', 'Subjektiv Fremgang',
'Subjektiv fremgang siden sist:

Pasient rapporterer:
- [Mye bedre/Litt bedre/Uendret/Verre]
- [Beskrivelse av endringer]

Funksjonsnivå:
- [____]

Adherence til øvelser:
- [God/Moderat/Dårlig]
- Frekvens: [___] ganger siste uke

Barrierer:
- [Ingen/Smerte/Tid/____]

Plan fremover:
- [____]', 'subjective');

-- Clean up helper function
DROP FUNCTION insert_physio_template(VARCHAR, VARCHAR, VARCHAR, TEXT, VARCHAR, VARCHAR);
