-- Realistic Clinical Templates
-- Based on actual clinical cases from experienced chiropractor
-- These templates reflect real-world clinical patterns and successful outcomes

-- Helper function (already exists, but included for completeness)
CREATE OR REPLACE FUNCTION insert_template(
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
-- KORSRYGG & BEKKEN - SUBJEKTIVE MALER
-- ============================================================================

SELECT insert_template('Korsrygg', 'Subjektivt', 'Akutt Lumbago - Typisk anamnese',
'Akutt vondt i korsryggen for ca [antall] dager siden. Kom i etterkant av [tunge løft/snømåking/brå bevegelse].
Smerte lokalisert i LS overgang, [sidelikhet/mer mot høyre/mer mot venstre].
Ingen utstråling i u.eks.
Smerte ved host/nys: [ja/nei]
Forverres av å sitte lenge, stivner til.
Lindres av bevegelse.
Tidligere episoder: [ja, tidligere/nei, første gang]

VAS smerte: ___/10', 'subjective');

SELECT insert_template('Korsrygg', 'Subjektivt', 'Bekkenleddsmerter (Gravid) - Typisk anamnese',
'Gravid uke [___]. Smerter i [høyre/venstre] setet, går rundt hofta/lysken.
Stråler av og på i posteriore lår til kne.
Svikter i hofta ved bæring.
Ilinger nedover.
Smerter ved snu seg i seng.
Forverres av: [gåing/standing/sittende].
Lindres av: [hvile/varme].

Tidligere graviditet: [ja/nei]
Tidligere bekkenplager: [ja/nei]

VAS smerte: ___/10', 'subjective');

SELECT insert_template('Korsrygg', 'Subjektivt', 'Isjias/Radikulopati - Typisk anamnese',
'Langvarige plager i korsrygg, akutt forverring [tidsangivelse].
Smerte LS overgang fra midtlinje og ut lateralt.
Stråling ned i bakside lår/legg [bilateral/høyre/venstre], verst [side].
Vanskelig med forflytning og fleksjon.
Ingen ridebukse parestesier.
Nattsmerter: [ja/nei]
Blære-/tarmfunksjon: [normal/forstyrret]

Røde flagg screenet: Ingen feber, ingen vekttap, ingen bilateral bensvakhet, ingen inkontinens.

VAS smerte: ___/10', 'subjective');

-- ============================================================================
-- KORSRYGG & BEKKEN - OBJEKTIVE FUNN
-- ============================================================================

SELECT insert_template('Korsrygg', 'Objektive funn', 'Akutt Lumbago - Typiske funn',
'Inspeksjon: Avvergestilling [retning]. Økt/normal lumbal lordose.

ROM LS columna:
- Fleksjon: Nedsatt og smertefull
- Ekstensjon: Nedsatt og smertefull
- Lateralfleksjon: Nedsatt bilateralt, [__] grader

Palpasjon:
- Hypomob. og palp.øm [L2/L3/L4/L5] spinoser
- Økt tonus bilat. QL, ES i nedre L col., gl.med.
- [Annet]

Ortopediske/Nevrologiske tester:
- SLR: Negativ bilat.
- Kemps test: Negativ bilat.
- Axial kompresjon: Negativ
- DTR patella: 2+/2+ symmetrisk
- DTR akilles: 2+/2+ symmetrisk', 'objective');

SELECT insert_template('Korsrygg', 'Objektive funn', 'Bekkenleddsmerter - Typiske funn',
'Inspeksjon: [Høyre/Venstre] skulder/glut.fold lavere. Anisomeli [side]>[side] ca [__] cm.

ROM: Generelt litt redusert ROM. Lett smerte i [høyre/venstre] IS ledd ved fleksjon i end range.

Palpasjon:
- Hypomob. og palp.øm [høyre/venstre] IS ledd (superior del)
- Økt tonus [høyre/venstre] piriformis, gl.med., gl.min.
- [Annet]

Ortopediske tester:
- P4 test: Positiv [høyre/venstre] for smerte i IS ledd
- ASLR: [Positiv/Negativ]
- Lateral kompresjon: [Positiv/Negativ]
- Hofte ekstensjon: [Positiv/Negativ]

Listing: [P-R sacrum / PI ilium høyre / PI ilium venstre]', 'objective');

SELECT insert_template('Korsrygg', 'Objektive funn', 'Isjias - Typiske funn',
'Inspeksjon: Beveger seg sakte, unngår fleksjon. Avvergestilling [retning].

ROM LS columna:
- Svært nedsatt alle plan
- Lateralfleksjon: 10-20 grader

Palpasjon:
- Hypomob. [L4/L5/L5/S1]
- Økt tonus piri, gl.med.

Ortopediske/Nevrologiske tester:
- SLR: [Positiv/Negativ] men stram hamstring
- Kemps: [Positiv/Negativ]
- Sensibilitet: [Lett nedsatt / Normal] [dermatome]
- Kraft: [Nedsatt / Normal] [myotome]
- DTR: [Beskrivelse]', 'objective');

-- ============================================================================
-- NAKKE - SUBJEKTIVE MALER
-- ============================================================================

SELECT insert_template('Nakke', 'Subjektivt', 'Tensjonshodepine - Typisk anamnese',
'Vondt i nakke/skuldre og hodepine siden [tidsangivelse].
[Stressrelatert/Arbeidsbetinget/Ukjent årsak].
Hodepinen brer seg fra occipitalt til panne/temporal (bånd).
Verst ved brå bevegelser eller statisk arbeid.

Nakke/skuldre:
- Lokalisering: [bilateral/høyre/venstre]
- Karakter: [stivhet/smerte/spenning]

Hodepine:
- Lokalisering: [occipital/temporal/frontal/bilateral]
- Karakter: [pressende/stikkende/dunkende]
- Intensitet: VAS ___/10
- Varighet: [konstant/episoder]

Forverres av: [stress/statisk arbeid/dårlig søvn]
Lindres av: [hvile/bevegelse/varme]', 'subjective');

SELECT insert_template('Nakke', 'Subjektivt', 'Akutt Torticollis (Kink) - Typisk anamnese',
'Våknet med akutt smerte [høyre/venstre] side nakke.
Avvergestilling [retning].
Ingen utstråling/hodepine.
Mulig utløsende faktor: [trampoline/sport/dårlig hodestilling ved søvn/ukjent]

Alder: [__ år]
Tidligere episoder: [ja/nei]', 'subjective');

SELECT insert_template('Nakke', 'Subjektivt', 'Kjeve (TMD) - Typisk anamnese',
'Smerter i kjeve, [klikking/låsing], spenninger.
Våkner med stiv kjeve (gnissing/pressing).
[Stressrelatert/langvarig].

Symptomer:
- Smerte ved tygging: [ja/nei]
- Begrenset gaping: [ja/nei]
- Klikking: [ja/nei]
- Låsinger: [ja/nei]
- Hodepine: [ja/nei]

Forverres av: [stress/tygging/gaping]', 'subjective');

-- ============================================================================
-- NAKKE - OBJEKTIVE FUNN
-- ============================================================================

SELECT insert_template('Nakke', 'Objektive funn', 'Tensjonshodepine - Typiske funn',
'ROM Cervical:
- Rotasjon: Nedsatt [høyre/venstre/bilateralt]
- Lateralfleksjon: Nedsatt [høyre/venstre/bilateralt]
- Fleksjon/Ekstensjon: [Normal/Nedsatt]

Palpasjon:
- Hypomob. og palp.øm [C2/C4/øvre torakalt]
- Økt tonus subocc. (stråler frontalt), øv.traps, lev.scap.
- Triggerpunkter: [lokalisering]

Ortopediske tester:
- Spurling''s: Negativ
- Axial kompresjon: Negativ
- Skulder depresjon: Negativ

Reproduserer hodepine ved: [palpasjon subocc/triggerpunkt øv.trap/annet]', 'objective');

SELECT insert_template('Nakke', 'Objektive funn', 'Akutt Torticollis - Typiske funn',
'Inspeksjon: Holder hodet i [høyre/venstre] lateralfleksjon.

ROM Cervical:
- Svært redusert rotasjon mot [høyre/venstre]
- Svært redusert lateralfleksjon mot [høyre/venstre]

Palpasjon:
- Svært øm [høyre/venstre] øv.traps, lev.scap.
- Ikke mulig å palpere ledd pga smerte

Ortopediske tester: Ikke gjennomført pga smerte', 'objective');

SELECT insert_template('Nakke', 'Objektive funn', 'TMD - Typiske funn',
'Funksjon kjeve:
- S-bevegelse ved gaping: [ja/nei]
- Maksimal gaping: [__] cm
- Klikking: [ved åpning/lukking/begge]

Palpasjon muskler:
- Masseter: Økt tonus og ømhet [bilateral/høyre/venstre]
- Temporalis: Økt tonus og ømhet [bilateral/høyre/venstre]
- Pterygoideus lat.: Økt tonus og ømhet [bilateral/høyre/venstre]
- Pterygoideus med.: Økt tonus og ømhet [bilateral/høyre/venstre]

Palpasjon ledd:
- TMJ: [Ømhet/Normal] [bilateral/høyre/venstre]

Cervikal columna:
- Hypomob. [C1-C2/annet]', 'objective');

-- ============================================================================
-- SKULDER - SUBJEKTIVE MALER
-- ============================================================================

SELECT insert_template('Skulder', 'Subjektivt', 'Frozen Shoulder (Kapsulitt) - Typisk anamnese',
'Smerter [høyre/venstre] skulder/overarm i [tidsangivelse].
Ingen traume. Gradvis stivere.
Smerte ved brå bevegelser.
Nattlige smerter, kan ikke ligge på skulder.

Stadium: [Freezing/Frozen/Thawing]

Forverres av: [bevegelse over 90 grader/nattestid]
Lindres av: [hvile/varme]

VAS smerte: ___/10', 'subjective');

SELECT insert_template('Skulder', 'Subjektivt', 'Lateral Epikondylitt (Tennisalbue) - Typisk anamnese',
'Smerter lateral side albue [tidsangivelse].
Jobb som [___], mye løft/griping.

Forverres av:
- Griping og løft
- Vridning av håndledd
- [Annet]

Tidligere behandling: [ingen/NSAID gel/fysioterapi]

VAS smerte: ___/10', 'subjective');

-- ============================================================================
-- SKULDER - OBJEKTIVE FUNN
-- ============================================================================

SELECT insert_template('Skulder', 'Objektive funn', 'Frozen Shoulder - Typiske funn',
'AROM [høyre/venstre] skulder:
- Fleksjon: [__] grader (normal: 180)
- Abduksjon: [__] grader (normal: 180)
- Utadrotasjon: [__] grader (normal: 90)
- Innadrotasjon: Til [nivå]

Kapsulært mønster: [ja/nei]

PROM: End-feel [hard/fast/tom]

Ortopediske tester:
- Hawkins: [Positiv/Negativ]
- Neer: [Positiv/Negativ]
- Empty can: [Positiv/Negativ]', 'objective');

SELECT insert_template('Skulder', 'Objektive funn', 'Tennisalbue - Typiske funn',
'Palpasjon:
- Distinkt ømhet lateral epikondyl ved seneutspring
- Økt tonus ECRL, ECRB, extensorer

Kraft:
- Smerte ved test ECRL/ECRB
- [Nedsatt/Normal] kraft

Lengde:
- Strekksmerter extensorer

Ortopediske tester:
- Cozen''s test: [Positiv/Negativ]
- Mill''s test: [Positiv/Negativ]', 'objective');

-- ============================================================================
-- VERTIGO (SVIMMELHET)
-- ============================================================================

SELECT insert_template('Vertigo', 'Subjektivt', 'BPPV - Typisk anamnese',
'Akutt rotatorisk svimmelhet ved å [snu seg i sengen/se opp/bøye seg ned].
Varighet: <30 sekunder.
Ingen nystagmus i ro.
Ingen hørselstap eller tinnitus.

Side: [høyre/venstre/ukjent]

Tidligere episoder: [ja/nei]', 'subjective');

SELECT insert_template('Vertigo', 'Objektive funn', 'BPPV - Typiske funn',
'Dix-Hallpike test:
- Høyre: [Positiv/Negativ]
  * Nystagmus: [Rotatorisk geotrop/Ingen]
  * Svimmelhet: [ja/nei]
  * Latenstid: [__] sekunder
  * Varighet: [__] sekunder
- Venstre: [Positiv/Negativ]

Pagnini-McClure-manøver:
- Høyre: [Positiv/Negativ]
- Venstre: [Positiv/Negativ]

Nevrologiske funn: UA

Konklusjon: BPPV [bakre/horisontale] buegang [høyre/venstre] side', 'objective');

SELECT insert_template('Vertigo', 'Subjektivt', 'Cervikogen svimmelhet - Typisk anamnese',
'Nautisk svimmelhet (båtdekk), ustøhet.
Konstant, ikke anfall.
Mye stiv i nakke/øvre rygg.
Stress: [ja/nei]

Forverres av: [nakkebevegelser/statisk arbeid]
Lindres av: [hvile/bevegelse]', 'subjective');

-- ============================================================================
-- FOT & ANKEL
-- ============================================================================

SELECT insert_template('Fot', 'Subjektivt', 'Plantar Fascitt - Typisk anamnese',
'Smerter under hæl, verst om morgenen og etter start på aktivitet.
Varighet: [tidsangivelse]

Forverres av: [standing/gåing/løping]
Lindres av: [hvile/varme]

Tidligere behandling: [ingen/NSAID/innleggssåler]

VAS smerte: ___/10', 'subjective');

SELECT insert_template('Fot', 'Objektive funn', 'Plantar Fascitt - Typiske funn',
'Palpasjon:
- Ømhet ved feste for plantar fascie på calcaneus medialt
- [Høyre/Venstre/Bilateralt]

Funksjon:
- Windlass test: [Positiv/Negativ]
- Tåhev: [Smertefull/Normal]

Inspeksjon:
- Fotbue: [Normal/Flat/Høy]
- Pronasjon: [ja/nei]', 'objective');

-- ============================================================================
-- BEHANDLINGS-TEMPLATES (PLAN)
-- ============================================================================

SELECT insert_template('Plan', 'Behandling', 'Korsrygg - Akutt lumbago',
'Behandling utført:
- Leddjustering: L5 [PL/PR], L4 [PL/PR] (PBpushpull)
- Trp/bvm: bilat. QL, ES i nedre L col., gl.med., gl.max.

Øvelser:
- Katt-kamel mobilisering
- Rotasjonsmobilisering i ryggleie
- Child''s pose
- McKenzie ekstensjon (ved bedring)

Råd:
- Bevegelse innen smertetoleranse
- Unngå langvarig sittende
- Varme/kulde etter behov

Oppfølging: [antall] dager', 'plan');

SELECT insert_template('Plan', 'Behandling', 'Bekkenleddsmerter (Gravid)',
'Behandling utført:
- Leddjustering: [høyre/venstre] PI ilium (PBpushpull ISD)
- Trp: [høyre/venstre] piri, gl.med., gl.min., QL

Øvelser for forebygging:
- Jane Fonda (hofte abduksjon i sideleie)
- Seteløft
- Firfot mage + diagonal
- Tøye sete (due-stilling)

Råd:
- Unngå asymmetriske belastninger
- Bekkenbelter ved behov
- Hvile ved smerte

Oppfølging: [antall] uker', 'plan');

SELECT insert_template('Plan', 'Behandling', 'Nakke - Tensjonshodepine',
'Behandling utført:
- Leddjustering: T5, T3 (prone), C4, C2 (sup)
- Trp/bvm: bilat. subocc. (stråler frontalt), øv.traps, lev.scap.
- Traksjon cervikalcolumna

Øvelser:
- Chin tucks
- Wall angels
- Aktive rotasjoner
- Accupointball på subocc/øv.trap

Råd:
- Mikropauser ved skjermarbeid
- Ergonomi-vurdering arbeidsplass
- Stressmestring

Oppfølging: [antall] dager', 'plan');

SELECT insert_template('Plan', 'Behandling', 'BPPV - Epleys manøver',
'Behandling utført:
- Epleys manøver [høyre/venstre] side x 2
- [Alternativt: BBQ manøver for horisontal kanal]

Råd:
- Sov med hevet hode (45 grader) neste 2 netter
- Unngå å ligge på den [berørte/ikke-berørte] siden i 48 timer
- Forventet bedring innen 24-48 timer

Oppfølging:
- Kontakt ved ingen bedring innen 3-4 dager
- Kan trenge repeterende behandling', 'plan');

SELECT insert_template('Plan', 'Behandling', 'Tennisalbue - ESWT + øvelser',
'Behandling utført:
- ESWT (Trykkbølge): 2000 skudd, 10Hz på lateral epikondyl
- Bvm extensorer
- Tverrfriksjon senefeste

Øvelser (viktig!):
- Eksentrisk håndleddsekstensjon: 3x15 reps, 2x daglig
- Tøying extensorer mellom sett
- Gradvis økning i belastning

Råd:
- Ergonomi ved arbeid/PC
- Unngå provoserende bevegelser i akutt fase
- Evt. albuestropp

Oppfølging: [antall] uker', 'plan');

-- ============================================================================
-- ASSESSMENT TEMPLATES (Vurdering/Konklusjon)
-- ============================================================================

SELECT insert_template('Assessment', 'Konklusjon', 'Fasettleddsdysfunksjon og myalgier',
'Klinisk resonnement:
Basert på funn tyder dette på fasettleddsdysfunksjon i [region] med sekundære myalgier.
Ingen røde flagg identifisert.
Ingen nevrologisk kompromittering.

Differensialdiagnoser:
- Fasettleddsdysfunksjon (mest sannsynlig)
- Myofascielle smerter
- [Annet]

Prognose: God, forventet bedring innen [tidsramme] med behandling og øvelser.

Plan:
- Behandling [frekvens]
- Hjemmeøvelser daglig
- Re-evaluering etter [antall] behandlinger', 'assessment');

SELECT insert_template('Assessment', 'Konklusjon', 'Bekkenleddsdysfunksjon',
'Klinisk resonnement:
Funn tyder på bekkenleddsdysfunksjon med [PI ilium/P-R sacrum] listing og sekundære myalgier i setemuskulatur.
[Svangerskapsrelatert / Relatert til asymmetrisk belastning]

Prognose: God med riktig behandling og forebyggende øvelser.

Plan:
- Leddjustering bekken
- Styrkeøvelser for stabilitet
- Ergonomi-råd
- Oppfølging etter behov', 'assessment');

-- Clean up
DROP FUNCTION IF EXISTS insert_template(VARCHAR, VARCHAR, VARCHAR, TEXT, VARCHAR, VARCHAR);
