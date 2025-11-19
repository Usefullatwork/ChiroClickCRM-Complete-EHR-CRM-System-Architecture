-- Vestibular & Neurology Clinical Templates
-- Norwegian language templates for vestibular assessments
-- Created: 2025-11-19

-- Assumes insert_template function exists from norwegian_clinical_templates.sql

-- ============================================================================
-- ANAMNESE - SVIMMELHET (Subjective)
-- ============================================================================

SELECT insert_template('Vestibulær', 'Anamnese', 'Karusellsvimmelhet',
'SVIMMELHET:
Type: Karusellsvimmelhet / Rotatorisk vertigo
Beskrivelse: "Gikk trill rundt", "Rommet spinner"
Debut: __________
Varighet: __________
Triggere: Posisjonsendringer (snu seg i seng, se opp/ned)

Tilleggsplager:
□ Kvalme
□ Oppkast
□ Falltendens
□ Tinnitus (hø/ve/bilat)
□ Trykk i øret', 'subjective');

SELECT insert_template('Vestibulær', 'Anamnese', 'Nautisk svimmelhet',
'SVIMMELHET:
Type: Nautisk / "Båtfølelse"
Beskrivelse: "Gynget", "Sjøgang", "Uggen", "Småfull"
Debut: __________
Varighet: __________
Triggere: Visuelle stimuli (skjermbruk, kjøpesenter, rulletrapp)

Tilleggsplager:
□ Lysømfintlig
□ Lydømfintlig
□ Hjernetåke
□ Nakkesmerter/stivhet', 'subjective');

SELECT insert_template('Vestibulær', 'Anamnese', 'BPPV debut traume',
'DEBUT:
Akutt oppstått: __________ (dato)
Utløsende hendelse: Traume
Detaljer: □ Fall på ski/is
         □ Slag mot hodet
         □ Hjernerystelse
         □ "Fikk albue i tinning"

Symptomer siden debut:
- Varighet: ____ dager/uker
- Forverring ved: Posisjonsendringer
- Bedring ved: Stillhet, lukke øynene', 'subjective');

SELECT insert_template('Vestibulær', 'Anamnese', 'BPPV debut virus',
'DEBUT:
Akutt oppstått: __________ (dato)
Utløsende hendelse: Sykdom
Detaljer: □ Virus/influensa
         □ COVID-19
         □ Ørebetennelse
         □ Forkjølelse
         □ "Helvetesild"

Symptomer siden debut:
- Varighet: ____ dager/uker
- Forverring ved: Bevegelse, snu seg i seng
- Bedring ved: Holde hodet stille', 'subjective');

SELECT insert_template('Vestibulær', 'Anamnese', 'Tilleggsplager komplett',
'TILLEGGSPLAGER:

Hode/Nakke:
□ Hodepine (spenning/migrene/trykk i pannen/bakhodet)
□ Nakkesmerter/stivhet
□ "Låsning" i nakken
□ Kjevesmerter (klikkelyd, gnissing)

Øre:
□ Tinnitus: □ hø □ ve □ bilat (sus/piping)
□ "Dotter i ørene"
□ Trykk i øret
□ Nedsatt hørsel

Autonome:
□ Kvalme
□ Oppkast
□ Kaldsvetting
□ Hjertebank

Nevrologiske:
□ Nummenhet/stråling (arm/ben/ansikt)
□ Kraftsvikt
□ Synsforstyrrelser ("flirring", "bokstaver beveger seg")', 'subjective');

-- ============================================================================
-- UNDERSØKELSE - CEREBELLARE/BALANSE (Objective)
-- ============================================================================

SELECT insert_template('Vestibulær', 'Balanse', 'Cerebellare tester normale',
'CEREBELLARE/BALANSE TESTER:

Fukuda''s Test (Step test):
- Resultat: ua
- Rotasjon: Ingen signifikant rotasjon
- Avstand: Minimal forskyvning

Rhomberg''s Test:
- Fast underlag: Stabil
- Balansepute: Stabil
- Øyne lukket: Stabil

Tandem Rhomberg''s: Stabil

Parietal (Arm test): Ingen drift

KOORDINASJON:
- Finger-to-nose (FTN): ua bilateral
- Diadochokinesi ("Piano fingre"): ua
- Dyspraxi: Ingen', 'objective');

SELECT insert_template('Vestibulær', 'Balanse', 'Fukuda positiv',
'Fukuda''s Test (Step test):
- Resultat: Positiv
- Rotasjon: ____ gr rotasjon mot □ hø □ ve
- Avstand: ____ cm forskyvning
- Interpretasjon: Indikerer vestibulær asymmetri', 'objective');

SELECT insert_template('Vestibulær', 'Balanse', 'Rhomberg ustabil',
'Rhomberg''s Test:
- Fast underlag: □ Stabil □ Ustø
- Balansepute: □ Ustø
- Øyne lukket: □ Falltendens mot □ hø □ ve
- Interpretasjon: ___________', 'objective');

-- ============================================================================
-- OCULOMOTORISKE TESTER (Objective)
-- ============================================================================

SELECT insert_template('Vestibulær', 'Øyebevegelser', 'Oculomotoriske tester normale',
'OCULOMOTORISKE TESTER:

Sakkader:
- Horisontalt: ua, raske og presise
- Vertikalt: ua, raske og presise

Smooth Pursuits (Følgebevegelser):
- Horisontalt: ua, glatte bevegelser
- Vertikalt: ua, glatte bevegelser

Konvergens: ua, normal rekkevidde

Blikkretningsnystagmus: Ingen

Halmagyi (HIT - Hode impulstest): ua bilateral', 'objective');

SELECT insert_template('Vestibulær', 'Øyebevegelser', 'Pursuits saccadic',
'Smooth Pursuits (Følgebevegelser):
- Horisontalt: "Saccadic" (rykkvise bevegelser)
- Catch-up sakkader observert
- Vertikalt: "Saccadic"

Interpretasjon: Kan indikere cerebellær dysfunksjon eller vestibulær svakhet', 'objective');

SELECT insert_template('Vestibulær', 'Øyebevegelser', 'HIT positiv',
'Halmagyi (HIT - Hode impulstest):
- Høyre: □ Positiv □ Negativ
- Venstre: □ Positiv □ Negativ
- Funn: Catch-up sakkade observert ved impuls mot ____ side

Interpretasjon: Positiv HIT indikerer perifer vestibulær svakhet på testet side', 'objective');

-- ============================================================================
-- BPPV TESTING (Objective)
-- ============================================================================

SELECT insert_template('Vestibulær', 'BPPV', 'Alle BPPV tester negative',
'BPPV TESTING MED VNG-BRILLER:

Dix-Hallpike:
- Høyre: Ingen nystagmus
- Venstre: Ingen nystagmus

Supine Roll Test (Horisontal):
- Høyre: Ingen nystagmus
- Venstre: Ingen nystagmus

Deep Head Hang (Fremre): Ingen nystagmus

KONKLUSJON: Ingen tegn til BPPV', 'objective');

SELECT insert_template('Vestibulær', 'BPPV', 'BPPV bakre buegang høyre',
'BPPV TESTING MED VNG-BRILLER:

Dix-Hallpike Høyre:
✓ Positiv test
- Nystagmus: Torsjonell geotropisk
- Intensitet: Kraftig
- Karakter: Uttrettbar (kanalithiasis)
- Delay: Kort latens
- Varighet: ~20 sekunder

Dix-Hallpike Venstre: Ingen nystagmus

DIAGNOSE: BPPV bakre buegang høyre side', 'objective');

SELECT insert_template('Vestibulær', 'BPPV', 'BPPV bakre buegang venstre',
'BPPV TESTING MED VNG-BRILLER:

Dix-Hallpike Venstre:
✓ Positiv test
- Nystagmus: Torsjonell geotropisk
- Intensitet: Kraftig
- Karakter: Uttrettbar (kanalithiasis)
- Delay: Kort latens
- Varighet: ~20 sekunder

Dix-Hallpike Høyre: Ingen nystagmus

DIAGNOSE: BPPV bakre buegang venstre side', 'objective');

SELECT insert_template('Vestibulær', 'BPPV', 'BPPV horisontal geotrop høyre',
'BPPV TESTING MED VNG-BRILLER:

Supine Roll Test:
- Høyre rotasjon:
  ✓ Horisontal GEOTROPISK nystagmus
  Intensitet: Kraftig

- Venstre rotasjon:
  ✓ Horisontal geotropisk nystagmus
  Intensitet: Moderat

Høyre side gir STERKEST respons

Lean Test:
- Bow: Nystagmus mot høyre
- Lean: Nystagmus mot venstre

DIAGNOSE: BPPV horisontal buegang høyre (geotrop kanalithiasis)', 'objective');

SELECT insert_template('Vestibulær', 'BPPV', 'BPPV horisontal geotrop venstre',
'BPPV TESTING MED VNG-BRILLER:

Supine Roll Test:
- Høyre rotasjon:
  ✓ Horisontal geotropisk nystagmus
  Intensitet: Moderat

- Venstre rotasjon:
  ✓ Horisontal GEOTROPISK nystagmus
  Intensitet: Kraftig

Venstre side gir STERKEST respons

Lean Test:
- Bow: Nystagmus mot venstre
- Lean: Nystagmus mot høyre

DIAGNOSE: BPPV horisontal buegang venstre (geotrop kanalithiasis)', 'objective');

SELECT insert_template('Vestibulær', 'BPPV', 'BPPV horisontal apogeotrop',
'BPPV TESTING MED VNG-BRILLER:

Supine Roll Test:
- Høyre rotasjon:
  ✓ Horisontal APOGEOTROPISK nystagmus

- Venstre rotasjon:
  ✓ Horisontal APOGEOTROPISK nystagmus

____ side gir sterkest respons
Karakter: Vedvarende (>60 sek)

DIAGNOSE: BPPV horisontal buegang ____ side
Type: Apogeotrop (cupololithiasis - krystaller festet til cupula)', 'objective');

SELECT insert_template('Vestibulær', 'BPPV', 'BPPV fremre buegang',
'BPPV TESTING MED VNG-BRILLER:

Deep Head Hang:
✓ Positiv test
- Nystagmus: DOWNBEAT vertikal
- Intensitet: Kraftig/Moderat
- Varighet: ~15-30 sekunder

Dix-Hallpike: Kan vise upbeat nystagmus

DIAGNOSE: BPPV fremre buegang (sjelden variant)', 'objective');

SELECT insert_template('Vestibulær', 'BPPV', 'BPPV bilateral/multikanal',
'BPPV TESTING MED VNG-BRILLER:

Funn:
✓ Dix-Hallpike høyre: Torsjonell geotropisk nystagmus
✓ Dix-Hallpike venstre: Torsjonell geotropisk nystagmus

ELLER

✓ Supine Roll bilateral positiv
✓ Kombinasjon av ulike kanaler

DIAGNOSE: BPPV bilateral / Multikanal BPPV
Kompleks presentasjon, krever sekvensielt behandling', 'objective');

-- ============================================================================
-- VNG (Videonystagmografi) (Objective)
-- ============================================================================

SELECT insert_template('Vestibulær', 'VNG', 'VNG normal',
'VIDEONYSTAGMOGRAFI (VNG):

Spontan Nystagmus: Ingen (m/u fokus)

Gaze (Blikkhold):
- Horisontalt: ua, stabil
- Vertikalt: ua, stabil

Sakkader:
- Horisontalt: Normale hastighet og presisjon
- Vertikalt: Normale hastighet og presisjon

Pursuits (Følgebevegelser):
- Horisontalt: Glatte, ingen sakkader
- Vertikalt: Glatte, ingen sakkader

OPK (Optokinetisk):
- Horisontalt: Symmetrisk respons
- Vertikalt: Normal respons

Kalorisk Prøve: Symmetrisk respons bilateralt
- Canal paresis: <25% (normalt)

KONKLUSJON: Normal vestibulær funksjon bilateralt', 'objective');

SELECT insert_template('Vestibulær', 'VNG', 'VNG kalorisk svakhet',
'VIDEONYSTAGMOGRAFI (VNG):

Spontan Nystagmus: □ ua □ Mot ____ side

Gaze, Sakkader, Pursuits: ua

Kalorisk Prøve:
✓ ABNORMAL
- Høyre øre: ____ grad respons
- Venstre øre: ____ grad respons
- Canal paresis: ____% svakere på □ hø □ ve side

KONKLUSJON: Perifer vestibulær svakhet på ____ side
Differensialdiagnose: Vestibularis nevritt, labyrintitt, Ménières', 'objective');

SELECT insert_template('Vestibulær', 'VNG', 'VNG pursuits saccadic',
'VIDEONYSTAGMOGRAFI (VNG):

Spontan Nystagmus: ua

Pursuits (Følgebevegelser):
✓ ABNORMAL
- Horisontalt: Saccadic (rykkvise)
- Catch-up sakkader
- Back-up sakkader/SW jerks
- Vertikalt: Saccadic

OPK (Optokinetisk):
- Nedsatt respons

KONKLUSJON: Cerebellær dysfunksjon eller bilateral vestibulær svakhet
Anbefaler videre utredning', 'objective');

-- ============================================================================
-- BEHANDLING (Plan)
-- ============================================================================

SELECT insert_template('Vestibulær', 'Behandling', 'Epleys manøver høyre',
'BEHANDLING UTFØRT:

Epleys Manøver Høyre Side:
- Lokasjon: □ Benk □ TRV-stol
- Variant: □ Standard □ Loaded Epleys
- Antall repetisjoner: ____
- Respons: Nystagmus observert ved reposisjon
- Resultat: □ Vellykket □ Delvis □ Ingen bedring

HJEMMERÅD:
- Hold hodet oppreist i 48 timer
- Unngå å ligge på høyre side første natt
- Sov med ekstra pute
- Kontakt ved forverring

Oppfølging: Kontroll om ____ dager', 'plan');

SELECT insert_template('Vestibulær', 'Behandling', 'Epleys manøver venstre',
'BEHANDLING UTFØRT:

Epleys Manøver Venstre Side:
- Lokasjon: □ Benk □ TRV-stol
- Variant: □ Standard □ Loaded Epleys
- Antall repetisjoner: ____
- Respons: Nystagmus observert ved reposisjon
- Resultat: □ Vellykket □ Delvis □ Ingen bedring

HJEMMERÅD:
- Hold hodet oppreist i 48 timer
- Unngå å ligge på venstre side første natt
- Sov med ekstra pute
- Kontakt ved forverring

Oppfølging: Kontroll om ____ dager', 'plan');

SELECT insert_template('Vestibulær', 'Behandling', 'BBQ Roll høyre',
'BEHANDLING UTFØRT:

BBQ Roll (Lempert) Høyre Side:
- Lokasjon: □ Benk □ TRV-stol
- Variant: □ Dynamisk □ Vitton (langsom)
- Antall runder: ____
- Respons: Nystagmus observert under rotasjon
- Resultat: □ Vellykket □ Delvis □ Ingen bedring

HJEMMERÅD:
- Hold hodet oppreist resten av dagen
- Sov halvt sittende første natt
- Gjenta hjemme-BBQ om ____ timer ved behov
- Unngå hodebevegelser først 24 timer

Oppfølging: Kontroll om ____ dager', 'plan');

SELECT insert_template('Vestibulær', 'Behandling', 'BBQ Roll venstre',
'BEHANDLING UTFØRT:

BBQ Roll (Lempert) Venstre Side:
- Lokasjon: □ Benk □ TRV-stol
- Variant: □ Dynamisk □ Vitton (langsom)
- Antall runder: ____
- Respons: Nystagmus observert under rotasjon
- Resultat: □ Vellykket □ Delvis □ Ingen bedring

HJEMMERÅD:
- Hold hodet oppreist resten av dagen
- Sov halvt sittende første natt
- Gjenta hjemme-BBQ om ____ timer ved behov
- Unngå hodebevegelser først 24 timer

Oppfølging: Kontroll om ____ dager', 'plan');

SELECT insert_template('Vestibulær', 'Behandling', 'Deep Head Hang fremre',
'BEHANDLING UTFØRT:

Deep Head Hang Manøver (Fremre buegang):
- Lokasjon: □ Benk □ TRV-stol
- Variant: □ Standard □ Med "salto"
- Antall repetisjoner: ____
- Respons: Konvertering av downbeat til upbeat nystagmus
- Resultat: □ Vellykket □ Delvis □ Ingen bedring

HJEMMERÅD:
- Hold hodet oppreist i 48 timer
- Sov med 2-3 puter
- Unngå å bøye hodet fremover/bakover
- Obs for økt svimmelhet (normalt)

Oppfølging: Kontroll om ____ dager', 'plan');

SELECT insert_template('Vestibulær', 'Behandling', 'Semont manøver',
'BEHANDLING UTFØRT:

Semont Manøver:
- Side: □ Høyre □ Venstre
- Variant: □ Standard □ Brå □ Med vibrasjon
- Antall repetisjoner: ____
- Respons: ___________
- Resultat: □ Vellykket □ Delvis □ Ingen bedring

Indikasjon: Cupololithiasis (vedvarende nystagmus)

HJEMMERÅD:
- Hold hodet oppreist i 48 timer
- Unngå å ligge på affisert side
- Kan oppleve økt svimmelhet første 24 timer

Oppfølging: Kontroll om ____ dager', 'plan');

SELECT insert_template('Vestibulær', 'Behandling', 'Gufoni horisontal cupololithiasis',
'BEHANDLING UTFØRT:

Gufoni Manøver (Horisontal cupololithiasis):
- Side: □ Høyre □ Venstre
- Type: Apogeotrop variant
- Antall repetisjoner: ____
- Respons: Konvertering til geotrop eller eliminering av nystagmus
- Resultat: □ Vellykket □ Delvis

HJEMMERÅD:
- Hold hodet oppreist resten av dagen
- Sov med ekstra pute
- Kan følges av BBQ Roll om nødvendig

Oppfølging: Kontroll om ____ dager', 'plan');

SELECT insert_template('Vestibulær', 'Behandling', 'VRT - Vestibulær Rehabilitering',
'VESTIBULÆR REHABILITERING (VRT):

GAZE STABILITY ØVELSER:
1. Hode-rotasjon med fiksert blikk (X1 viewing)
   - Horisontal: 2 x 1 min daglig
   - Vertikal: 2 x 1 min daglig

2. Target 0 Velocity (T0V):
   - Følg mål med øynene mens hodet roterer
   - 2 x 1 min daglig

BALANSETRENING:
1. Rhomberg (øyne åpne → lukket)
2. En fot (30 sek hver side)
3. Tandem gang
4. Balansepute progresjon

OPK-STIMULERING:
- YouTube/POP app 10 min daglig
- Optokinetisk trening

HABITUERINGS-ØVELSER:
- Brandt-Daroff (ved BPPV residual)
- Gradvis eksponering for triggere

Varighet: ____ uker
Oppfølging: Om 2 uker for evaluering', 'plan');

SELECT insert_template('Vestibulær', 'Behandling', 'Manuell behandling + Vestibulær',
'MANUELL BEHANDLING:

Justeringer:
□ C0-C1 (Atlas)
□ C2 (Axis)
□ C7-T1 overgang
□ Sacrum

Bløtvevsbehandling:
□ Triggerpunkter Trapezius
□ Suboccipitales
□ SCM (Sternocleidomastoideus)
□ Levator scapulae

Kjevebehandling (ved TMJ-involvering):
□ Reponering TMJ
□ Intraoral massasje (Pterygoideus)
□ "Dobbelthake øvelse"

KOMBINERT MED VESTIBULÆR BEHANDLING:
(Se separat notat for reposisjonsmanøvrer)

Rasjonale: Cervikogen komponent til svimmelheten', 'plan');

-- ============================================================================
-- OPPFØLGING OG OUTCOME MEASURES
-- ============================================================================

SELECT insert_template('Vestibulær', 'Outcome', 'DHI - Dizziness Handicap Inventory',
'DIZZINESS HANDICAP INVENTORY (DHI):

Dato: __________
Total Score: ____ / 100

Subscore:
- Fysisk: ____ / 28
- Emosjonell: ____ / 36
- Funksjonell: ____ / 36

Tolkning:
0-30: Mild funksjonsnedsettelse
31-60: Moderat funksjonsnedsettelse
61-100: Alvorlig funksjonsnedsettelse

Oppfølging: Gjenta DHI om ____ uker for å evaluere progresjon', 'assessment');

SELECT insert_template('Vestibulær', 'Oppfølging', 'BPPV oppfølgingsplan',
'OPPFØLGINGSPLAN - BPPV:

Behandling i dag: ___________

Forventet forløp:
- 60-80% bedring etter 1 behandling
- 20-40% trenger 2-3 behandlinger
- Residual ustøhet kan vare 1-2 uker

Neste kontroll: Om ____ dager

RØDE FLAGG - Kontakt ved:
□ Plutselig hodepine (verst noensinne)
□ Dobbeltsyn
□ Taleproblemer
□ Nummenhet/kraftsvikt
□ Hørselstap
□ Vedvarende oppkast

Anbefaling ved manglende bedring:
→ Henvisning til ØNH/Nevrolog etter ____ uker', 'plan');

-- ============================================================================
-- DIFFERENSIALDIAGNOSER
-- ============================================================================

SELECT insert_template('Vestibulær', 'Vurdering', 'Differensialdiagnoser svimmelhet',
'DIFFERENSIALDIAGNOSER SVIMMELHET:

PERIFERT VESTIBULÆRT:
□ BPPV (mest vanlig - 20-30%)
□ Vestibularis nevritt (virus)
□ Labyrintitt
□ Ménières sykdom
□ Perilymfatisk fistel

SENTRALT:
□ Vestibulær migrene
□ TIA / Cerebrovaskulært
□ Cerebellær patologi
□ Multippel sklerose

ANNET:
□ Cervikogen svimmelhet
□ PPPD (Persistent Postural-Perceptual Dizziness)
□ Ortostatisk hypotensjon
□ Medikamentbivirkning
□ Angst/Panikk

RØDE FLAGG (krever akutt henvisning):
□ Akutt hodepine + nakkestivhet
□ Fokale nevrologiske utfall
□ Plutselig hørselstap
□ Dobbeltsyn
□ Ataksi', 'assessment');

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION insert_template IS 'Helper function to insert clinical templates - requires norwegian_clinical_templates.sql to be loaded first';
