-- Norwegian Clinical Templates
-- Comprehensive examination protocols for chiropractic practice
-- These are system templates available to all organizations

-- Helper function to insert templates
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
-- VITALE FUNN (Vital Signs)
-- ============================================================================

SELECT insert_template('Vitale Funn', 'Generelt', 'Normal vekt og høyde',
'Vekt: ____ kg
Høyde: ____ cm
BMI: ____', 'objective');

SELECT insert_template('Vitale Funn', 'Blodtrykk', 'Normalt blodtrykk',
'BT sittende: ve: 120/80 mmHg, hø: 120/80 mmHg
BT stående: ve: 120/80 mmHg, hø: 120/80 mmHg
Hjertefrekvens: 72 SPM', 'objective');

SELECT insert_template('Vitale Funn', 'Respirasjon', 'Normal respirasjon',
'Pustefrekvens: 16-18 per minutt
O2 metning: 98-100%
Respirasjonslyder: Normale', 'objective');

SELECT insert_template('Vitale Funn', 'Auskultasjon', 'Normal auskultasjon',
'Bryst auskultasjon: Ingen gnister eller mumler
Respirasjonslyder: Normale
Fremmedlyder: Pipelyder, knatrelyder, Gnidningslyder ikke hørt
Cervikal auskultasjon: Ingen carotid bruit
Vertebrobasilar arterieinsuffiensmanøver: Ingen tydelig nystagmus, svimmelhet eller kvalme
Ingen synlige hevelser eller åreknuter
Radialpulser: symmetriske', 'objective');

-- ============================================================================
-- OBSERVASJON (Observation)
-- ============================================================================

SELECT insert_template('Observasjon', 'Generelt', 'Normal observasjon',
'Hodetilt: UA (uinauffallende)
Hypomomik: UA
Nasolabial fold asymmetri: UA
Nutritional state: Normal
Color: Normal', 'objective');

SELECT insert_template('Observasjon', 'Holdning', 'Normal holdning og gange',
'Posture: Normal alignment
Gait: Normal, symmetrisk armsving
Ingen antalgisk gange
Ingen endring ved mental utfordring', 'objective');

-- ============================================================================
-- CERVICAL SPINE (Nakke)
-- ============================================================================

SELECT insert_template('Cervical', 'ROM', 'Normal cervical ROM',
'Aktiv ROM:
- Fleksjon: Normal, smertefri
- Ekstensjon: Normal, smertefri
- Rotasjon ve/hø: Symmetrisk, smertefri
- Sidefleksjon ve/hø: Symmetrisk, smertefri

Passiv ROM: Normal
Resistert ROM: Ingen svakhet', 'objective');

SELECT insert_template('Cervical', 'Spesialtester', 'Cervical spesialtester negative',
'Maksimal cervical kompresjon: Negativ
Spurling test: Negativ bilateralt
Cervical distraksjon: Ingen symptomlindring
Doorbell sign: Negativ
Bakody's test (skulder abduksjon): Negativ
Skulder depresjonstest: Negativ
Lhermitte's tegn: Negativ', 'objective');

SELECT insert_template('Cervical', 'TOS Tester', 'TOS tester negative',
'TOS (Thoracic Outlet Syndrome) tester:
- Roo's test: Negativ
- Adson's test: Negativ bilateralt
- Reversed Adson's test: Negativ
- Hyperabduksjonstest: Negativ
- Kostoklavikulær test: Negativ', 'objective');

SELECT insert_template('Cervical', 'Palpasjon', 'Normal cervical palpasjon',
'Palpasjon bein:
- C0-C7: Ingen betydelig ømhet
- T1: Ingen ømhet

Palpasjon mykt vev:
- SCM (Sternocleidomastoid): Normal tonus, ingen ømhet
- Trapezius: Normal tonus bilateralt
- Splenius capitis/cervicis: Normale
- Suboccipital muskler: Minimal stramhet
- Cervical transversospinalis: Normale
- Anterior scalene: Ingen ømhet', 'objective');

-- ============================================================================
-- SHOULDER (Skulder)
-- ============================================================================

SELECT insert_template('Skulder', 'ROM', 'Normal skulder ROM',
'Aktiv ROM:
- Fleksjon: 0-180° bilateral symmetrisk
- Abduksjon: 0-180° bilateral symmetrisk
- Utadrotasjon: 0-90° bilateral symmetrisk
- Innadrotasjon: Normal bilateral
- Apley's Scratch Test: Normal bilateral

Passiv ROM: Full, smertefri
Resistert ROM: Sterk, smertefri', 'objective');

SELECT insert_template('Skulder', 'Impingement', 'Impingement tester negative',
'Neer's Test: Negativ bilateral
Hawkins-Kennedy Test: Negativ bilateral
Cross-Body Adduction Test: Negativ bilateral', 'objective');

SELECT insert_template('Skulder', 'Rotator Cuff', 'Rotator cuff tester normale',
'Empty Can / Jobe's Test (Supraspinatus): Negativ, full styrke
Drop Arm Test: Negativ bilateral
Lift-Off Test (Subscapularis): Negativ
Napoleon Test: Negativ
Bear Hug Test: Negativ', 'objective');

SELECT insert_template('Skulder', 'Instabilitet', 'Skulder instabilitet tester negative',
'Anterior Apprehension Test: Negativ
Posterior Apprehension Test: Negativ
Load & Shift Test: Negativ, normal bevegelse
Sulcus Sign: Negativ
O'Brien's Active Compression Test: Negativ
Speed's Test (Biceps): Negativ', 'objective');

-- ============================================================================
-- LUMBAR SPINE (Korsrygg)
-- ============================================================================

SELECT insert_template('Korsrygg', 'ROM', 'Normal lumbar ROM',
'Aktiv ROM:
- Fleksjon: Normal, smertefri
- Ekstensjon: Normal, smertefri
- Sidegliding ve/hø: Symmetrisk

Schober's Test: Normal (>15cm)
Finger-to-Floor Distance: ____ cm', 'objective');

SELECT insert_template('Korsrygg', 'Neurodynamikk', 'Negative neurodynamiske tester',
'Straight Leg Raise (SLR): Negativ bilateral >70°
Crossed SLR: Negativ bilateral
Slump Test: Negativ
Femoral Nerve Tension Test: Negativ bilateral', 'objective');

SELECT insert_template('Korsrygg', 'SIJ Tester', 'SIJ tester negative',
'Sacroiliac Joint (SIJ) tester:
- Gaenslen's Test: Negativ bilateral
- Thigh Thrust: Negativ
- SIJ Distraction: Negativ
- SIJ Compression (lateral): Negativ
- Sacral Thrust: Negativ
- FABER (Patrick's) Test: Negativ bilateral', 'objective');

SELECT insert_template('Korsrygg', 'Spesialtester', 'Lumbar spesialtester',
'Kemp's Test (Quadrant): Negativ bilateral
Waddell's Signs: 0/5 (ingen non-organiske tegn)
Single Leg Hyperextension: Negativ bilateral', 'objective');

-- ============================================================================
-- HIP (Hofte)
-- ============================================================================

SELECT insert_template('Hofte', 'ROM', 'Normal hofte ROM',
'Aktiv ROM:
- Fleksjon: 0-120° bilateral
- Ekstensjon: 0-20° bilateral
- Abduksjon: 0-45° bilateral
- Adduksjon: 0-30° bilateral
- Innadrotasjon: 0-45° bilateral
- Utadrotasjon: 0-45° bilateral

Passiv ROM: Full, smertefri
Drehmann Sign: Negativ', 'objective');

SELECT insert_template('Hofte', 'Funksjonelle Tester', 'Normale hofte funksjonelle tester',
'Trendelenburg Test: Negativ bilateral
Leg Length Measurement:
- True leg length: Symmetrisk
- Apparent leg length: Symmetrisk', 'objective');

SELECT insert_template('Hofte', 'Patologi Tester', 'Hofte patologi tester negative',
'Thomas Test (Hip Flexors): Negativ
FADIR Test (Anterior Impingement): Negativ
Posterior Impingement Test: Negativ
Scour / Quadrant Test: Negativ
FABER Test: Negativ bilateral
Log Roll Test: Negativ
Anvil Test: Negativ
Fulcrum Test: Negativ', 'objective');

SELECT insert_template('Hofte', 'Bløtvev/Nerve', 'Hofte bløtvev tester negative',
'Ober's Test (IT Band): Negativ bilateral
Ely's Test (Rectus Femoris): Negativ bilateral
Piriformis Test: Negativ bilateral
Meralgia Paresthetica Test: Negativ', 'objective');

-- ============================================================================
-- KNEE (Kne)
-- ============================================================================

SELECT insert_template('Kne', 'Ligamenter', 'Kne ligament tester negative',
'ACL Tester:
- Lachman's Test: Negativ bilateral, fast endpoint
- Anterior Drawer: Negativ bilateral
- Pivot Shift: Negativ bilateral

PCL Tester:
- Posterior Drawer: Negativ bilateral
- Posterior Sag Sign: Negativ bilateral

Kollaterale Ligamenter:
- Valgus Stress Test (MCL): Negativ bilateral
- Varus Stress Test (LCL): Negativ bilateral', 'objective');

SELECT insert_template('Kne', 'Menisk', 'Menisk tester negative',
'McMurray Test: Negativ bilateral
Thessaly Test: Negativ bilateral
Apley's Compression/Distraction: Negativ bilateral', 'objective');

SELECT insert_template('Kne', 'Patellofemoral', 'Patellofemoral tester normale',
'Patella Apprehension Test: Negativ
Patellofemoral Grind (Clarke's): Negativ
Q-Angle: Normal
Stroke Test (effusjon): Negativ', 'objective');

-- ============================================================================
-- ANKLE/FOOT (Ankel/Fot)
-- ============================================================================

SELECT insert_template('Ankel', 'Ligamenter', 'Ankel ligament tester negative',
'Anterior Drawer Test (ATFL): Negativ bilateral
Talar Tilt / Inversion Stress: Negativ bilateral
Eversion Stress (Deltoid): Negativ bilateral
Syndesmosis Stress / Squeeze Test: Negativ
Cotton Test: Negativ', 'objective');

SELECT insert_template('Ankel', 'Bløtvev/Nerve', 'Ankel bløtvev tester normale',
'Thompson Test (Achilles): Negativ bilateral
Windlass Test (Plantar Fascia): Negativ
Mulder's Sign (Morton's Neuroma): Negativ
Tinel's Sign (Tarsal Tunnel): Negativ
Dorsiflexion-Eversion Test: Negativ', 'objective');

-- ============================================================================
-- NEUROLOGICAL EXAM (Nevrologisk Undersøkelse)
-- ============================================================================

SELECT insert_template('Nevrologisk', 'Reflekser Øvre', 'Normale reflekser øvre ekstremitet',
'Reflekser øvre ekstremitet:
- Biceps (C5/6): 2/2 bilateral symmetrisk
- Brachioradialis (C5/6): 2/2 bilateral symmetrisk
- Triceps (C7): 2/2 bilateral symmetrisk
- Fingerbøyerne (C8): 2/2 bilateral symmetrisk

Hoffman's Reflex: Negativ bilateral', 'objective');

SELECT insert_template('Nevrologisk', 'Reflekser Nedre', 'Normale reflekser nedre ekstremitet',
'Reflekser nedre ekstremitet:
- Patella (L3/4): 2/2 bilateral symmetrisk
- Mediale hamstring (L5): 2/2 bilateral symmetrisk
- Akillesrefleks (S1): 2/2 bilateral symmetrisk
- Plantarrefleks: Nedadvendt bilateral (normal)

Klonus: Negativ bilateral', 'objective');

SELECT insert_template('Nevrologisk', 'Muskelstyrke Øvre', 'Normal muskelstyrke øvre ekstremitet',
'Muskelstyrke øvre ekstremitet (5/5 bilateral):
- m. rhomboides (C5/C6): 5/5
- m. deltoid (C5/C6): 5/5
- m. biceps brachii (C5/C6): 5/5
- m. triceps brachii (C7): 5/5
- Håndleddsbøyere (C7): 5/5
- Håndleddsstrekkere (C6): 5/5
- Fingerbøyerne (C8): 5/5
- Fingerstrekkerne (C7): 5/5
- Musculi interossei (T1): 5/5', 'objective');

SELECT insert_template('Nevrologisk', 'Muskelstyrke Nedre', 'Normal muskelstyrke nedre ekstremitet',
'Muskelstyrke nedre ekstremitet (5/5 bilateral):
- m. iliopsoas (L2/3): 5/5
- Hofteleddsbøyerne (L5/S1): 5/5
- Hofteleddsstrekkerne (L3/4): 5/5
- Knefleksjon (L5/S1): 5/5
- Kneekstensjon (L3/4): 5/5
- Ankel dorsalfleksjon + inversjon (L4/5): 5/5
- m. extensor hallucis longus (L5): 5/5
- Ankel plantarfleksjon + eversjon (S1): 5/5', 'objective');

SELECT insert_template('Nevrologisk', 'Sensasjon', 'Normal sensasjon',
'Sensasjon:
- Lett berøring: Symmetrisk bilateral, UA
- Pinwheel/nålestikk: Symmetrisk bilateral, UA
- Vibrasjon: Symmetrisk bilateral, intakt
- Joint Position Sense: Intakt bilateral
- Stereognosis: Normal
- Graphesthesia: Normal', 'objective');

SELECT insert_template('Nevrologisk', 'Koordinasjon', 'Normal koordinasjon',
'Koordinasjon:
- Finger-til-nese: Nøyaktig bilateral
- Fingertappe (pincer): Normal hastighet bilateral
- Rapid supination/pronation: Normal bilateral
- Hæl-til-skinnebein: Nøyaktig bilateral
- Romberg (øyne lukket): Stabil
- Romberg på pute: Stabil
- Tandem gange: Normal', 'objective');

-- ============================================================================
-- CRANIAL NERVES (Hjernene rver)
-- ============================================================================

SELECT insert_template('Cranial Nerves', 'CN 2-6 (Øyne)', 'Normale øyeundersøkelser',
'CN 2 (Optic):
- Visual Acuity: Intakt
- Visual Fields (Perimetry): Full bilateral
- Blind Spot: Normal

CN 2 & 3 (Pupils):
- Pupil størrelse/form: Normal, lik bilateral
- Direkte lysrefleks: Positiv bilateral
- Konsensuell lysrefleks: Positiv bilateral
- Akkomodasjon-konvergens: Normal

CN 3, 4, 6 (Øyebevegelser):
- EOMs 'H' pattern: Full ROM bilateral
- Pursuit movements: Normale
- Saccades: Nøyaktige bilateral
- Nystagmus: Ikke observert', 'objective');

SELECT insert_template('Cranial Nerves', 'CN 5,7 (Ansikt/Kjeve)', 'Normal ansikt og kjeve funksjon',
'CN 5 (Trigeminal):
- Ansiktsfølelse V1-V3: Symmetrisk bilateral
- Kjeve åpning/lukking: Normal kraft bilateral
- Kjeve jerk refleks: Normal
- Korneal refleks: Symmetrisk

CN 7 (Facial):
- Løft øyenbryn: Symmetrisk
- Lukk øyne mot motstand: Symmetrisk
- Smile/vis tenner: Symmetrisk
- Purse lips: Normal', 'objective');

SELECT insert_template('Cranial Nerves', 'CN 8 (Hørsel)', 'Normal hørsel',
'CN 8 (Vestibulocochlear):
- Finger Rub test: Hører bilateral
- Weber's Test: Ingen lateralisering
- Rinne's Test: Ingen sideforskjell', 'objective');

SELECT insert_template('Cranial Nerves', 'CN 9-12 (Nedre)', 'Normale nedre kraniale nerver',
'CN 9 & 10 (Glossopharyngeal/Vagus):
- "Ahh" test (uvula): Midtlinje, symmetrisk
- Gagg refleks: Normal
- Svelgning: Normal
- Stemme: Normal kvalitet

CN 11 (Accessory):
- SCM motstand: Symmetrisk kraft
- Trapezius (skulder trekk): Symmetrisk kraft

CN 12 (Hypoglossal):
- Tunge protrusion: Midtlinje
- Tunge atrofi/fascikulation: Ikke observert
- Tunge styrke: Normal', 'objective');

-- ============================================================================
-- BALANCE & VESTIBULAR (Balanse)
-- ============================================================================

SELECT insert_template('Balanse', 'BPPV Tester', 'BPPV tester negative',
'Dix-Hallpike Test:
- Høyre: Negativ, ingen nystagmus eller vertigo
- Venstre: Negativ, ingen nystagmus eller vertigo

Supine Roll Test:
- Høyre: Negativ
- Venstre: Negativ', 'objective');

SELECT insert_template('Balanse', 'Carrick Tester', 'Carrick balanse tester normale',
'Balance Error Scoring Test (BEES):
Gulv, øyne lukket, hender på hofter:
- Føttene samlet: 0 feil
- Enkel fot balanse (ikke-dominant): 0 feil
- Tandem (ikke-dominant bakerst): 0 feil

Romberg varianter:
- Romberg åpne øyne: Stabil
- Romberg lukkede øyne: Stabil
- Romberg på pute: Stabil
- Romberg med balanseutfordring: Stabil

Fukuda Step Test: Ingen betydelig rotasjon
Halmagyi (Head Impulse): Negativ bilateral', 'objective');

-- ============================================================================
-- HEADACHE EVALUATION (Hodepine)
-- ============================================================================

SELECT insert_template('Hodepine', 'Meningeal Tegn', 'Negative meningeal tegn',
'Meningeal irritasjon:
- Nuchal Rigidity: Negativ
- Kernig's Sign: Negativ bilateral
- Brudzinski's Sign: Negativ

Temporal Artery: Myk, ikke øm, god pulsasjon bilateral
Sinus Palpation: Ingen ømhet', 'objective');

-- ============================================================================
-- RESPIRATORY EXAM (Luftveier)
-- ============================================================================

SELECT insert_template('Luftveier', 'Inspeksjon', 'Normal respiratorisk inspeksjon',
'Inspeksjon:
- SOB: Ikke tilstede
- Hoste: Ikke tilstede
- Wheeze: Ikke hørt
- Stridor: Ikke tilstede
- Bruk av accessoriske muskler: Nei', 'objective');

SELECT insert_template('Luftveier', 'Palpasjon/Perkusjon', 'Normal respiratorisk palpasjon og perkusjon',
'Palpasjon:
- Trachea posisjon: Sentral
- Apex beat: 5. IC rom, midtklavikulær linje
- Chest Expansion: Symmetrisk bilateral
- Tactile Fremitus: Normal bilateral

Perkusjon:
- Clavicles: Resonant bilateral
- Anterior bryst (T6): Resonant bilateral
- Lateral bryst (T8): Resonant bilateral
- Posterior bryst/lungebaser (T10-12): Resonant bilateral', 'objective');

SELECT insert_template('Luftveier', 'Auskultasjon', 'Normal respiratorisk auskultasjon',
'Auskultasjon:
Breath sounds (vesicular):
- Fremre: Normal bilateral
- Side: Normal bilateral
- Bak: Normal bilateral

Adventitious lyder:
- Crackles: Ikke hørt
- Wheezes: Ikke hørt
- Rhonchi: Ikke hørt', 'objective');

-- ============================================================================
-- CARDIOVASCULAR EXAM (Hjerte-kar)
-- ============================================================================

SELECT insert_template('Hjerte-kar', 'Pulser', 'Normale pulser',
'Pulser (2/2 bilateral, symmetrisk):
- Carotid: 2/2, ingen bruit
- Brachial: 2/2
- Radial: 2/2
- Femoral: 2/2, ingen bruit
- Popliteal: 2/2
- Dorsalis Pedis: 2/2
- Posterior Tibial: 2/2

Capillary Refill: <2 sekunder
Ingen perifert ødem', 'objective');

SELECT insert_template('Hjerte-kar', 'Hjerteauskultasjon', 'Normal hjerteauskultasjon',
'Hjerteauskultasjon (med palpasjon av carotid puls):
- Aortic area: S1 S2, ingen murring
- Pulmonary area: S1 S2, ingen murring
- Tricuspid area: S1 S2, ingen murring
- Mitral area (apex): S1 S2, ingen murring

Rhythm: Regular
Rate: 72 BPM
Ingen S3/S4 gallop', 'objective');

SELECT insert_template('Hjerte-kar', 'Vaskulært', 'Normal vaskulær undersøkelse',
'AAA palpering: Ingen expansil pulsering, normal aorta størrelse
Peripheral ødem: Ingen
Varicose veins: Ingen observert
Buerger's Test: Normal reperfusjon', 'objective');

-- ============================================================================
-- TREATMENT PLAN TEMPLATES (Plan)
-- ============================================================================

SELECT insert_template('Plan', 'Behandling', 'Chiropractic manipulasjon',
'Behandling utført:
- HVLA manipulasjon: ____
- Mobilisering: ____
- Bløtvevsbehandling: ____
- Myofascial release: ____', 'plan');

SELECT insert_template('Plan', 'Øvelser', 'Hjemmeøvelser',
'Hjemmeøvelser foreskrevet:
- Tøyninger: ____
- Styrkeøvelser: ____
- Stabiliseringsøvelser: ____

Råd gitt:
- Ergonomi: ____
- Aktivitetsmodifikasjoner: ____', 'plan');

SELECT insert_template('Plan', 'Oppfølging', 'Standard oppfølging',
'Oppfølgingsplan:
- Re-evaluering om: ____ dager/uker
- Estimert antall behandlinger: ____
- Hjemmeprogram: Se ovenfor
- Forventet progresjon: ____', 'plan');

-- ============================================================================
-- ASSESSMENT TEMPLATES (Vurdering)
-- ============================================================================

SELECT insert_template('Assessment', 'Diagnose', 'Mekanisk ryggsmerte',
'Klinisk resonnement:
Basert på funn tyder dette på mekanisk korsryggsmerte med muskulær komponent.
Ingen røde flagg identifisert.
Ingen nevrologisk kompromittering.

Differensialdiagnoser vurdert:
- Mekanisk korsryggsmerte (mest sannsynlig)
- Facettledd dysfunksjon
- SI-ledd dysfunksjon

Prognose: God, forventet bedring innen 4-6 uker med behandling', 'assessment');

-- ============================================================================
-- SUBJECTIVE TEMPLATES (Subjektivt)
-- ============================================================================

SELECT insert_template('Subjektivt', 'Korsryggsmerte', 'Typisk korsryggsmerte anamnese',
'Pasient rapporterer korsryggsmerte som startet ____.
Smerten beskrives som ____.
Lokalisering: ____.
Ingen utstråling til ben.
Forverres ved: ____.
Lindres ved: ____.

VAS smerte: ___/10

Røde flagg screenet: Ingen feber, ingen vekttap, ingen nattsmerter, ingen inkontinens, ingen bilateral ben svakhet.', 'subjective');

SELECT insert_template('Subjektivt', 'Nakkesmerte', 'Typisk nakkesmerte anamnese',
'Pasient rapporterer nakkesmerte som startet ____.
Smerten beskrives som ____.
Lokalisering: ____.
Ingen utstråling til armer.
Forverres ved: ____.
Lindres ved: ____.

VAS smerte: ___/10

Ingen røde flagg: Ingen feber, ingen nattsmerter, ingen svakhet i armer.', 'subjective');

-- ============================================================================
-- WRIST & HAND (Håndledd og Hand)
-- ============================================================================

-- ROM Templates
SELECT insert_template('Håndledd/Hand', 'ROM', 'Normal håndledd ROM',
'Aktiv ROM Håndledd:
- Fleksjon: 0-80° bilateral symmetrisk
- Ekstensjon: 0-70° bilateral symmetrisk
- Ulnar deviasjon: 0-30° bilateral symmetrisk
- Radial deviasjon: 0-20° bilateral symmetrisk
- Pronasjon: 0-85° bilateral symmetrisk
- Supinasjon: 0-85° bilateral symmetrisk

Passiv ROM: Full, smertefri
Resistert ROM: Sterk, smertefri bilateral', 'objective');

SELECT insert_template('Håndledd/Hand', 'ROM', 'Normal finger ROM',
'Aktiv ROM Fingre (2-5):
- MCP fleksjon: 0-90° bilateral symmetrisk
- MCP ekstensjon: 0-40° bilateral symmetrisk
- MCP abduksjon: 0-20° bilateral symmetrisk
- MCP adduksjon: 0-20° bilateral symmetrisk
- PIP fleksjon: 0-100° bilateral symmetrisk
- PIP ekstensjon: 0° bilateral symmetrisk
- DIP fleksjon: 0-80° bilateral symmetrisk
- DIP ekstensjon: 0-10° bilateral symmetrisk

Passiv ROM: Full, smertefri
Resistert ROM: Sterk, smertefri', 'objective');

SELECT insert_template('Håndledd/Hand', 'ROM', 'Normal tommel ROM',
'Aktiv ROM Tommel (CMC, MCP, IP):
- CMC fleksjon/ekstensjon: Full, smertefri
- CMC abduksjon/adduksjon: Full, smertefri
- CMC opposisjon: Full, når lillefinger
- MCP fleksjon: 0-50° bilateral symmetrisk
- IP fleksjon: 0-80° bilateral symmetrisk

Passiv ROM: Full, smertefri
Resistert ROM: Sterk, smertefri', 'objective');

SELECT insert_template('Håndledd/Hand', 'ROM', 'Redusert håndledd ROM',
'Aktiv ROM Håndledd:
- Fleksjon: ____° (normal 80°) [ve/hø/bilateral]
- Ekstensjon: ____° (normal 70°) [ve/hø/bilateral]
- Ulnar deviasjon: ____° (normal 30°) [ve/hø/bilateral]
- Radial deviasjon: ____° (normal 20°) [ve/hø/bilateral]
- Pronasjon: ____° (normal 85°) [ve/hø/bilateral]
- Supinasjon: ____° (normal 85°) [ve/hø/bilateral]

Smertefull bevegelse: ____
End-feel: ____
Passiv ROM: ____
Resistert ROM: ____', 'objective');

-- Palpation Templates
SELECT insert_template('Håndledd/Hand', 'Palpasjon', 'Normal håndledd palpasjon',
'Palpasjon bein:
- Scaphoid (anatomisk snusdåse): Ingen ømhet
- Lunatum: Ingen ømhet
- Triquetrum: Ingen ømhet
- Pisiform: Ingen ømhet
- Hamate (krok): Ingen ømhet
- Capitate: Ingen ømhet
- Trapezium: Ingen ømhet
- Trapezoid: Ingen ømhet
- Lister''s tuberkel: Ingen ømhet
- Radial/ulnar styloid: Ingen ømhet
- Metacarpaler 1-5: Ingen ømhet

Palpasjon bløtvev:
- Håndleddsbøyere: Normal tonus, ingen ømhet
- Håndleddsstrekkere: Normal tonus, ingen ømhet
- Thenar muskulatur: Normal, ingen ømhet
- Hypothenar muskulatur: Normal, ingen ømhet
- Interossei: Normal tonus
- Karpaltunnel: Ingen ømhet
- Guyon''s kanal: Ingen ømhet
- Triangular fibrocartilage (TFC): Ingen ømhet', 'objective');

SELECT insert_template('Håndledd/Hand', 'Palpasjon', 'Positiv håndledd palpasjon',
'Palpasjon funn:
- Lokalisert ømhet: ____
- Hevelse: ____
- Varme: ____
- Palpabel masse/cyste: ____
- Triggerpunkter: ____
- Myospasme: ____

Spesifikke funn:
- Anatomisk snusdåse ømhet: ____ (mistenkt scaphoidfraktur)
- Karpaltunnel ømhet: ____ (mistenkt CTS)
- Guyon''s kanal ømhet: ____ (mistenkt ulnar neuropati)', 'objective');

-- Special Tests - Carpal Tunnel
SELECT insert_template('Håndledd/Hand', 'Spesialtester CTS', 'Karpaltunnel tester negative',
'Karpaltunnel Syndrom (CTS) tester:
- Phalen''s test: Negativ bilateral
- Reverse Phalen''s test: Negativ bilateral
- Median nerve kompresjon test: Negativ bilateral
- Tinel''s tegn (håndledd): Negativ bilateral
- Flick manøver: Negativ
- Durkan''s test (kompresjon): Negativ bilateral

Sensibilitet median nerve distribusjon: Intakt bilateral
Topoint diskriminering: Normal bilateral
Thenar atrofi: Ikke observert', 'objective');

SELECT insert_template('Håndledd/Hand', 'Spesialtester CTS', 'Karpaltunnel tester positive',
'Karpaltunnel Syndrom (CTS) tester:
- Phalen''s test: Positiv [ve/hø/bilateral] - parestesier i median distribusjon
- Reverse Phalen''s test: Positiv [ve/hø/bilateral]
- Median nerve kompresjon test: Positiv [ve/hø/bilateral]
- Tinel''s tegn (håndledd): Positiv [ve/hø/bilateral]
- Flick manøver: Positiv - pasient rister hendene for lindring
- Durkan''s test: Positiv [ve/hø/bilateral]

Sensibilitet median nerve distribusjon: Redusert [ve/hø/bilateral]
Topoint diskriminering: Økt >6mm [ve/hø/bilateral]
Thenar atrofi: [Observert/Ikke observert]

Vurdering: Funn konsistent med karpaltunnelsyndrom', 'objective');

-- Special Tests - Ligament/Instability
SELECT insert_template('Håndledd/Hand', 'Ligamenter', 'Håndledd ligament tester negative',
'Karpal instabilitet tester:
- Watson''s test (scapholunate): Negativ bilateral
- Lunatotriquetral ballottement: Negativ bilateral
- Bracelet test: Negativ bilateral
- Leddspill: Normal, ingen krepitasjon

Kollateral ligament stress:
- MCP valgus/varus stress: Negativ bilateral (alle fingre)
- PIP valgus/varus stress: Negativ bilateral
- DIP valgus/varus stress: Negativ bilateral
- Tommel UCL stress test: Negativ bilateral', 'objective');

SELECT insert_template('Håndledd/Hand', 'Ligamenter', 'Positiv UCL tommel (Gamekeeper)',
'Tommel UCL vurdering:
- Tommel abduksjon stress test: Positiv [ve/hø]
  - Laksitet: ____mm (>30° eller >15° sammenlignet med uaffisert side)
  - Endpunkt: [Fast/Tomt]
- Palpasjon over UCL: Øm [ve/hø]
- Hevelse: [Tilstede/Fraværende]
- Ekchymose: [Tilstede/Fraværende]
- Palpabel masse (Stener lesjon): [Ja/Nei]

Gripestyrke: Redusert [ve/hø]
Nøkkelgrep: Svakt [ve/hø]

Vurdering: Funn konsistent med UCL skade tommel (Gamekeeper''s/Skier''s thumb)', 'objective');

-- Special Tests - Tenosynovitis
SELECT insert_template('Håndledd/Hand', 'Spesialtester Sener', 'Tenosynovitis tester negative',
'De Quervain''s tenosynovitis:
- Finkelstein''s test: Negativ bilateral
- Eichhoff''s test: Negativ bilateral
- Ømhet over 1. dorsale kompartment: Negativ

Trigger finger tester:
- Aktiv fleksjon/ekstensjon: Jevn, ingen låsing
- Palpasjon A1 pulley: Ingen nodulus, ingen ømhet
- Krepitasjon: Fraværende

Intersection syndrom:
- Ømhet 4-6cm proksimalt for håndledd dorsalt: Negativ', 'objective');

SELECT insert_template('Håndledd/Hand', 'Spesialtester Sener', 'Positiv de Quervain''s',
'De Quervain''s tenosynovitis vurdering:
- Finkelstein''s test: Positiv [ve/hø] - skarp smerte over radial styloid
- Eichhoff''s test: Positiv [ve/hø]
- Ømhet over 1. dorsale kompartment: Positiv [ve/hø]
- Hevelse over 1. dorsale kompartment: [Ja/Nei]
- Krepitasjon med bevegelse: [Ja/Nei]

Forverres ved: Tommel bevegelser, ulnar deviasjon
Resistert tommel ekstensjon: Smertefull
Resistert tommel abduksjon: Smertefull

Vurdering: Funn konsistent med de Quervain''s tenosynovitis', 'objective');

-- Special Tests - Fracture
SELECT insert_template('Håndledd/Hand', 'Fraktur Tester', 'Fraktur screen negativ',
'Fraktur screening håndledd/hand:
- Anatomisk snusdåse ømhet: Negativ bilateral
- Scaphoid kompresjon (aksialt): Negativ bilateral
- Scaphoid tubercle ømhet: Negativ bilateral
- Vibrasjonstest (stemmegaffel 128Hz): Negativ
- Percussion test: Negativ
- Torsjon test: Negativ

Ottawa ankle/knee regler anvendt på håndledd: Negativ
Evne til å bære vekt/gripe: Intakt

Ingen indikasjoner for røntgen basert på kliniske funn.', 'objective');

SELECT insert_template('Håndledd/Hand', 'Fraktur Tester', 'Mistenkt scaphoid fraktur',
'Scaphoid fraktur vurdering:
- Mekanisme: Fall på utstrakt hånd (FOOSH)
- Anatomisk snusdåse ømhet: Positiv [ve/hø]
- Scaphoid tubercle ømhet: Positiv [ve/hø]
- Scaphoid kompresjon (aksialt tommel): Positiv [ve/hø]
- Vibrasjonstest: Positiv [ve/hø]
- Watson''s test: Smertefull [ve/hø]

Hevelse: [Mild/Moderat/Markant]
ROM reduksjon: Spesielt ekstensjon og radial deviasjon
Gripestyrke: Redusert [ve/hø]

VIKTIG: Ved klinisk mistanke om scaphoid fraktur, behandle som fraktur inntil bevist motsatt.
Anbefaling: Immobilisering og røntgen. Hvis initial røntgen negativ, MR eller ny røntgen etter 10-14 dager.', 'objective');

-- Special Tests - TFC/TFCC
SELECT insert_template('Håndledd/Hand', 'Spesialtester TFC', 'TFC tester negative',
'Triangular Fibrocartilage Complex (TFCC) tester:
- Press test: Negativ bilateral
- TFCC kompresjon/load test: Negativ bilateral
- TFC dorsal glide test: Negativ bilateral
- Ulnar fovea tegn: Negativ bilateral
- Piano key tegn: Negativ bilateral

Ulnar-sided håndledd ømhet: Fraværende
Klikking/snapping med pronasjon/supinasjon: Fraværende', 'objective');

SELECT insert_template('Håndledd/Hand', 'Spesialtester TFC', 'Positiv TFCC skade',
'Triangular Fibrocartilage Complex (TFCC) vurdering:
- Press test: Positiv [ve/hø] - smerte ved å løfte seg fra stol
- TFCC kompresjon/load test: Positiv [ve/hø] - smerte med ulnar deviasjon og aksial belastning
- TFC dorsal glide test: Positiv [ve/hø]
- Ulnar fovea tegn: Positiv [ve/hø]
- Piano key tegn: [Positiv/Negativ]

Ulnar-sided håndledd ømhet: Tilstede [ve/hø]
Klikking med pronasjon/supinasjon: [Ja/Nei]
Smerte forverres ved: Rotering, gripeaktiviteter

Vurdering: Funn konsistent med TFCC skade', 'objective');

-- Special Tests - Vascular
SELECT insert_template('Håndledd/Hand', 'Vaskulær', 'Normal vaskulær vurdering',
'Vaskulær vurdering hånd:
- Allen''s test: Normal bilateral - god kapillær refill begge arterier
- Radial puls: 2+ bilateral symmetrisk
- Ulnar puls: 2+ bilateral symmetrisk
- Kapillær refill: <2 sekunder alle fingre
- Hudfarge: Normal
- Hudtemperatur: Normal, lik bilateral
- Cyanose: Fraværende

Raynaud''s fenomen: Ingen anamnese, ingen tegn', 'objective');

-- Special Tests - Neurological
SELECT insert_template('Håndledd/Hand', 'Nevrologisk', 'Normal hand nevrologisk',
'Nevrologisk vurdering hånd:

Sensorisk:
- Median nerve (C6-T1): Intakt - thenar, volar 1-3.5 fingre
- Ulnar nerve (C8-T1): Intakt - hypothenar, volar/dorsal 4.5-5 fingre
- Radial nerve (C5-T1): Intakt - dorsal 1-3.5 fingre, anatomisk snusdåse
- Topoint diskriminering: <6mm alle fingre

Motorisk (5/5 bilateral):
- Thenar muskulatur (median): 5/5
- Hypothenar muskulatur (ulnar): 5/5
- Interossei (ulnar): 5/5
- Håndleddsbøyere (C7): 5/5
- Håndleddsstrekkere (C6): 5/5
- Fingerbøyere (C8): 5/5
- Fingerstrekkere (C7): 5/5

Reflekser:
- Brachioradialis (C5/6): 2/2 bilateral
- Hoffman''s tegn: Negativ bilateral', 'objective');

SELECT insert_template('Håndledd/Hand', 'Nevrologisk', 'Ulnar neuropati funn',
'Ulnar neuropati vurdering:

Tinel''s tegn:
- Ved håndledd (Guyon''s kanal): [Positiv/Negativ] [ve/hø]
- Ved albue (cubital tunnel): [Positiv/Negativ] [ve/hø]

Spesialtester:
- Froment''s test: [Positiv/Negativ] - tommel IP fleksjon ved papirgrep
- Wartenberg''s tegn: [Positiv/Negativ] - lillefinger abduksjon
- Finger kryss test: [Svakt/Normalt]

Sensorisk:
- Ulnar distribusjon (4.5-5 finger): [Redusert/Intakt]

Motorisk:
- Interossei styrke: ____/5
- Hypothenar styrke: ____/5
- Adductor pollicis: ____/5

Atrofi:
- Interossei: [Observert/Ikke observert]
- Hypothenar: [Observert/Ikke observert]
- Første dorsal interosseous: [Observert/Ikke observert]

Vurdering: Funn konsistent med ulnar neuropati ved [håndledd/albue]', 'objective');

-- Grip Strength
SELECT insert_template('Håndledd/Hand', 'Funksjon', 'Gripestyrke vurdering',
'Gripestyrke (Dynamometer):
- Høyre hånd: ____ kg
- Venstre hånd: ____ kg
- Forhold: ____% (normal: dominant hånd 5-10% sterkere)

Nøkkelgrep (lateral pinch):
- Høyre: ____ kg
- Venstre: ____ kg

Pinsettgrep (tip pinch):
- Høyre: ____ kg
- Venstre: ____ kg

Palmar grep (three-jaw chuck):
- Høyre: ____ kg
- Venstre: ____ kg

Rapid grip-release test: Normal hastighet og koordinasjon', 'objective');

-- Ganglion Cyst
SELECT insert_template('Håndledd/Hand', 'Spesialtester', 'Ganglion cyste vurdering',
'Ganglion cyste undersøkelse:
Lokalisasjon: [Dorsal håndledd/Volar håndledd/Annen: ____]
Side: [Venstre/Høyre]

Inspeksjon:
- Synlig masse: [Ja/Nei]
- Størrelse: ca. ____ cm
- Hevelse: [Tilstede/Fraværende]

Palpasjon:
- Konsistens: [Fast/Mykt/Fluktuerende]
- Ømhet: [Øm/Ikke øm]
- Mobil: [Ja/Nei - festet til dyp vev]
- Transilluminasjon: [Positiv/Negativ]

Finger ekstensjon test: [Positiv/Negativ]
Allen''s test (for volar cyster): [Normal/Unormal]

ROM affeksjon: [Ja/Nei]
Gripestyrke affeksjon: [Ja/Nei]
Nervekompresjon symptomer: [Ja/Nei]

Vurdering: Funn konsistent med ganglion cyste', 'objective');

-- Lunate Pathology
SELECT insert_template('Håndledd/Hand', 'Spesialtester', 'Lunatum vurdering',
'Lunatum patologi vurdering:

Lunatum dislokasjon:
- Ømhet over dorsalt lunatum: [Ja/Nei]
- Palpabel prominens dorsalt: [Ja/Nei]
- Sulcus dorsalt på håndledd: [Ja/Nei]
- ROM: [Redusert fleksjon/ekstensjon]
- Median nerve symptomer: [Ja/Nei] - akutt karpaltunnel

Kienböck''s sykdom (AVN lunatum):
- Dorsal sentral håndledd ømhet: [Ja/Nei]
- Hevelse: [Mild/Moderat/Markant]
- ROM reduksjon: [Ja/Nei]
- Gripestyrke: [Normal/Redusert]
- Krepitasjon med bevegelse: [Ja/Nei]

Ved mistanke om lunatum patologi: Henvisning for bildediagnostikk (røntgen, MR)', 'objective');

-- Contracture Tests
SELECT insert_template('Håndledd/Hand', 'Spesialtester', 'Kontraktur tester',
'Kontraktur vurdering:

Bunnell-Littler test (intrinsic tightness):
- Med MCP nøytral, passiv PIP fleksjon: ____
- Med MCP fleksjon, passiv PIP fleksjon: ____
- Resultat: [Normal/Intrinsic tightness]

Retinacular test (oblique retinacular ligament):
- Med PIP nøytral, passiv DIP fleksjon: ____
- Med PIP fleksjon, passiv DIP fleksjon: ____
- Resultat: [Normal/ORL tightness]

Dupuytren''s kontraktur:
- Palmar fascia fortykkelse: [Ja/Nei]
- Noduli: [Ja/Nei] Lokalisasjon: ____
- Finger kontraktur: [Ja/Nei] Fingre: ____
- MCP fleksjonskontraktur: ____°
- PIP fleksjonskontraktur: ____°

Trigger finger:
- Låsing ved fleksjon/ekstensjon: [Ja/Nei] Fingre: ____
- Palpabel nodulus A1 pulley: [Ja/Nei]
- Ømhet: [Ja/Nei]', 'objective');

-- ============================================================================
-- WRIST & HAND ENGLISH TEMPLATES
-- ============================================================================

SELECT insert_template('Wrist/Hand', 'ROM', 'Normal wrist ROM',
'Active ROM Wrist:
- Flexion: 0-80° bilateral symmetric
- Extension: 0-70° bilateral symmetric
- Ulnar deviation: 0-30° bilateral symmetric
- Radial deviation: 0-20° bilateral symmetric
- Pronation: 0-85° bilateral symmetric
- Supination: 0-85° bilateral symmetric

Passive ROM: Full, pain-free
Resisted ROM: Strong, pain-free bilateral', 'objective', 'EN');

SELECT insert_template('Wrist/Hand', 'ROM', 'Normal finger ROM',
'Active ROM Fingers (2-5):
- MCP flexion: 0-90° bilateral symmetric
- MCP extension: 0-40° bilateral symmetric
- MCP abduction: 0-20° bilateral symmetric
- MCP adduction: 0-20° bilateral symmetric
- PIP flexion: 0-100° bilateral symmetric
- PIP extension: 0° bilateral symmetric
- DIP flexion: 0-80° bilateral symmetric
- DIP extension: 0-10° bilateral symmetric

Passive ROM: Full, pain-free
Resisted ROM: Strong, pain-free', 'objective', 'EN');

SELECT insert_template('Wrist/Hand', 'ROM', 'Normal thumb ROM',
'Active ROM Thumb (CMC, MCP, IP):
- CMC flexion/extension: Full, pain-free
- CMC abduction/adduction: Full, pain-free
- CMC opposition: Full, reaches little finger
- MCP flexion: 0-50° bilateral symmetric
- IP flexion: 0-80° bilateral symmetric

Passive ROM: Full, pain-free
Resisted ROM: Strong, pain-free', 'objective', 'EN');

SELECT insert_template('Wrist/Hand', 'Palpation', 'Normal wrist palpation',
'Bony Palpation:
- Scaphoid (anatomical snuffbox): No tenderness
- Lunate: No tenderness
- Triquetrum: No tenderness
- Pisiform: No tenderness
- Hamate (hook): No tenderness
- Capitate: No tenderness
- Trapezium: No tenderness
- Trapezoid: No tenderness
- Lister''s tubercle: No tenderness
- Radial/ulnar styloid: No tenderness
- Metacarpals 1-5: No tenderness

Soft Tissue Palpation:
- Wrist flexors: Normal tone, no tenderness
- Wrist extensors: Normal tone, no tenderness
- Thenar muscles: Normal, no tenderness
- Hypothenar muscles: Normal, no tenderness
- Interossei: Normal tone
- Carpal tunnel: No tenderness
- Guyon''s canal: No tenderness
- Triangular fibrocartilage (TFC): No tenderness', 'objective', 'EN');

SELECT insert_template('Wrist/Hand', 'Special Tests CTS', 'Carpal tunnel tests negative',
'Carpal Tunnel Syndrome (CTS) Tests:
- Phalen''s test: Negative bilateral
- Reverse Phalen''s test: Negative bilateral
- Median nerve compression test: Negative bilateral
- Tinel''s sign (wrist): Negative bilateral
- Flick maneuver: Negative
- Durkan''s test (compression): Negative bilateral

Sensation median nerve distribution: Intact bilateral
Two-point discrimination: Normal bilateral
Thenar atrophy: Not observed', 'objective', 'EN');

SELECT insert_template('Wrist/Hand', 'Special Tests CTS', 'Carpal tunnel tests positive',
'Carpal Tunnel Syndrome (CTS) Tests:
- Phalen''s test: Positive [L/R/bilateral] - paresthesias in median distribution
- Reverse Phalen''s test: Positive [L/R/bilateral]
- Median nerve compression test: Positive [L/R/bilateral]
- Tinel''s sign (wrist): Positive [L/R/bilateral]
- Flick maneuver: Positive - patient shakes hands for relief
- Durkan''s test: Positive [L/R/bilateral]

Sensation median nerve distribution: Decreased [L/R/bilateral]
Two-point discrimination: Increased >6mm [L/R/bilateral]
Thenar atrophy: [Observed/Not observed]

Assessment: Findings consistent with carpal tunnel syndrome', 'objective', 'EN');

SELECT insert_template('Wrist/Hand', 'Ligaments', 'Wrist ligament tests negative',
'Carpal Instability Tests:
- Watson''s test (scapholunate): Negative bilateral
- Lunotriquetral ballottement: Negative bilateral
- Bracelet test: Negative bilateral
- Joint play: Normal, no crepitus

Collateral Ligament Stress:
- MCP valgus/varus stress: Negative bilateral (all fingers)
- PIP valgus/varus stress: Negative bilateral
- DIP valgus/varus stress: Negative bilateral
- Thumb UCL stress test: Negative bilateral', 'objective', 'EN');

SELECT insert_template('Wrist/Hand', 'Ligaments', 'Positive thumb UCL (Gamekeeper''s)',
'Thumb UCL Assessment:
- Thumb abduction stress test: Positive [L/R]
  - Laxity: ____mm (>30° or >15° compared to unaffected side)
  - Endpoint: [Firm/Empty]
- Palpation over UCL: Tender [L/R]
- Swelling: [Present/Absent]
- Ecchymosis: [Present/Absent]
- Palpable mass (Stener lesion): [Yes/No]

Grip strength: Decreased [L/R]
Key pinch: Weak [L/R]

Assessment: Findings consistent with thumb UCL injury (Gamekeeper''s/Skier''s thumb)', 'objective', 'EN');

SELECT insert_template('Wrist/Hand', 'Special Tests Tendons', 'Tenosynovitis tests negative',
'De Quervain''s Tenosynovitis:
- Finkelstein''s test: Negative bilateral
- Eichhoff''s test: Negative bilateral
- Tenderness over 1st dorsal compartment: Negative

Trigger Finger Tests:
- Active flexion/extension: Smooth, no locking
- Palpation A1 pulley: No nodule, no tenderness
- Crepitus: Absent

Intersection Syndrome:
- Tenderness 4-6cm proximal to wrist dorsally: Negative', 'objective', 'EN');

SELECT insert_template('Wrist/Hand', 'Special Tests Tendons', 'Positive de Quervain''s',
'De Quervain''s Tenosynovitis Assessment:
- Finkelstein''s test: Positive [L/R] - sharp pain over radial styloid
- Eichhoff''s test: Positive [L/R]
- Tenderness over 1st dorsal compartment: Positive [L/R]
- Swelling over 1st dorsal compartment: [Yes/No]
- Crepitus with movement: [Yes/No]

Aggravated by: Thumb movements, ulnar deviation
Resisted thumb extension: Painful
Resisted thumb abduction: Painful

Assessment: Findings consistent with de Quervain''s tenosynovitis', 'objective', 'EN');

SELECT insert_template('Wrist/Hand', 'Fracture Tests', 'Fracture screen negative',
'Wrist/Hand Fracture Screening:
- Anatomical snuffbox tenderness: Negative bilateral
- Scaphoid compression (axial): Negative bilateral
- Scaphoid tubercle tenderness: Negative bilateral
- Tuning fork test (128Hz): Negative
- Percussion test: Negative
- Torsion test: Negative

Ottawa rules applied to wrist: Negative
Ability to bear weight/grip: Intact

No indications for X-ray based on clinical findings.', 'objective', 'EN');

SELECT insert_template('Wrist/Hand', 'Fracture Tests', 'Suspected scaphoid fracture',
'Scaphoid Fracture Assessment:
- Mechanism: Fall on outstretched hand (FOOSH)
- Anatomical snuffbox tenderness: Positive [L/R]
- Scaphoid tubercle tenderness: Positive [L/R]
- Scaphoid compression (axial thumb): Positive [L/R]
- Tuning fork test: Positive [L/R]
- Watson''s test: Painful [L/R]

Swelling: [Mild/Moderate/Marked]
ROM reduction: Especially extension and radial deviation
Grip strength: Decreased [L/R]

IMPORTANT: With clinical suspicion of scaphoid fracture, treat as fracture until proven otherwise.
Recommendation: Immobilization and X-ray. If initial X-ray negative, MRI or repeat X-ray in 10-14 days.', 'objective', 'EN');

SELECT insert_template('Wrist/Hand', 'Special Tests TFC', 'TFCC tests negative',
'Triangular Fibrocartilage Complex (TFCC) Tests:
- Press test: Negative bilateral
- TFCC compression/load test: Negative bilateral
- TFC dorsal glide test: Negative bilateral
- Ulnar fovea sign: Negative bilateral
- Piano key sign: Negative bilateral

Ulnar-sided wrist tenderness: Absent
Clicking/snapping with pronation/supination: Absent', 'objective', 'EN');

SELECT insert_template('Wrist/Hand', 'Special Tests TFC', 'Positive TFCC injury',
'Triangular Fibrocartilage Complex (TFCC) Assessment:
- Press test: Positive [L/R] - pain when pushing up from chair
- TFCC compression/load test: Positive [L/R] - pain with ulnar deviation and axial load
- TFC dorsal glide test: Positive [L/R]
- Ulnar fovea sign: Positive [L/R]
- Piano key sign: [Positive/Negative]

Ulnar-sided wrist tenderness: Present [L/R]
Clicking with pronation/supination: [Yes/No]
Pain aggravated by: Rotation, gripping activities

Assessment: Findings consistent with TFCC injury', 'objective', 'EN');

SELECT insert_template('Wrist/Hand', 'Vascular', 'Normal vascular assessment',
'Vascular Assessment Hand:
- Allen''s test: Normal bilateral - good capillary refill both arteries
- Radial pulse: 2+ bilateral symmetric
- Ulnar pulse: 2+ bilateral symmetric
- Capillary refill: <2 seconds all fingers
- Skin color: Normal
- Skin temperature: Normal, equal bilateral
- Cyanosis: Absent

Raynaud''s phenomenon: No history, no signs', 'objective', 'EN');

SELECT insert_template('Wrist/Hand', 'Neurological', 'Normal hand neurological',
'Neurological Assessment Hand:

Sensory:
- Median nerve (C6-T1): Intact - thenar, volar digits 1-3.5
- Ulnar nerve (C8-T1): Intact - hypothenar, volar/dorsal digits 4.5-5
- Radial nerve (C5-T1): Intact - dorsal digits 1-3.5, anatomical snuffbox
- Two-point discrimination: <6mm all fingers

Motor (5/5 bilateral):
- Thenar muscles (median): 5/5
- Hypothenar muscles (ulnar): 5/5
- Interossei (ulnar): 5/5
- Wrist flexors (C7): 5/5
- Wrist extensors (C6): 5/5
- Finger flexors (C8): 5/5
- Finger extensors (C7): 5/5

Reflexes:
- Brachioradialis (C5/6): 2/2 bilateral
- Hoffman''s sign: Negative bilateral', 'objective', 'EN');

SELECT insert_template('Wrist/Hand', 'Neurological', 'Ulnar neuropathy findings',
'Ulnar Neuropathy Assessment:

Tinel''s Sign:
- At wrist (Guyon''s canal): [Positive/Negative] [L/R]
- At elbow (cubital tunnel): [Positive/Negative] [L/R]

Special Tests:
- Froment''s test: [Positive/Negative] - thumb IP flexion with paper grip
- Wartenberg''s sign: [Positive/Negative] - little finger abduction
- Finger cross test: [Weak/Normal]

Sensory:
- Ulnar distribution (digits 4.5-5): [Decreased/Intact]

Motor:
- Interossei strength: ____/5
- Hypothenar strength: ____/5
- Adductor pollicis: ____/5

Atrophy:
- Interossei: [Observed/Not observed]
- Hypothenar: [Observed/Not observed]
- First dorsal interosseous: [Observed/Not observed]

Assessment: Findings consistent with ulnar neuropathy at [wrist/elbow]', 'objective', 'EN');

SELECT insert_template('Wrist/Hand', 'Function', 'Grip strength assessment',
'Grip Strength (Dynamometer):
- Right hand: ____ kg
- Left hand: ____ kg
- Ratio: ____% (normal: dominant hand 5-10% stronger)

Key Pinch (lateral pinch):
- Right: ____ kg
- Left: ____ kg

Tip Pinch:
- Right: ____ kg
- Left: ____ kg

Palmar Pinch (three-jaw chuck):
- Right: ____ kg
- Left: ____ kg

Rapid grip-release test: Normal speed and coordination', 'objective', 'EN');

SELECT insert_template('Wrist/Hand', 'Special Tests', 'Ganglion cyst assessment',
'Ganglion Cyst Examination:
Location: [Dorsal wrist/Volar wrist/Other: ____]
Side: [Left/Right]

Inspection:
- Visible mass: [Yes/No]
- Size: approximately ____ cm
- Swelling: [Present/Absent]

Palpation:
- Consistency: [Firm/Soft/Fluctuant]
- Tenderness: [Tender/Non-tender]
- Mobile: [Yes/No - fixed to deep tissue]
- Transillumination: [Positive/Negative]

Finger extension test: [Positive/Negative]
Allen''s test (for volar cysts): [Normal/Abnormal]

ROM affected: [Yes/No]
Grip strength affected: [Yes/No]
Nerve compression symptoms: [Yes/No]

Assessment: Findings consistent with ganglion cyst', 'objective', 'EN');

SELECT insert_template('Wrist/Hand', 'Special Tests', 'Contracture tests',
'Contracture Assessment:

Bunnell-Littler Test (intrinsic tightness):
- With MCP neutral, passive PIP flexion: ____
- With MCP flexion, passive PIP flexion: ____
- Result: [Normal/Intrinsic tightness]

Retinacular Test (oblique retinacular ligament):
- With PIP neutral, passive DIP flexion: ____
- With PIP flexion, passive DIP flexion: ____
- Result: [Normal/ORL tightness]

Dupuytren''s Contracture:
- Palmar fascia thickening: [Yes/No]
- Nodules: [Yes/No] Location: ____
- Finger contracture: [Yes/No] Fingers: ____
- MCP flexion contracture: ____°
- PIP flexion contracture: ____°

Trigger Finger:
- Locking with flexion/extension: [Yes/No] Fingers: ____
- Palpable nodule A1 pulley: [Yes/No]
- Tenderness: [Yes/No]', 'objective', 'EN');

-- ============================================================================
-- WRIST & HAND CONDITION-SPECIFIC ASSESSMENT TEMPLATES
-- ============================================================================

SELECT insert_template('Assessment', 'Diagnose', 'Karpaltunnelsyndrom vurdering',
'Klinisk resonnement:
Basert på funn tyder dette på karpaltunnelsyndrom.

Kliniske funn:
- Positive provokasjonstester (Phalen''s, Tinel''s, kompresjon)
- Sensoriske endringer i median nerve distribusjon
- [Thenar svakhet/atrofi hvis tilstede]
- Nattlige symptomer, lindres ved å riste hånden

Alvorlighetsgrad: [Mild/Moderat/Alvorlig]

Differensialdiagnoser vurdert:
- Karpaltunnelsyndrom (mest sannsynlig)
- Cervikal radikulopati C6-C7
- Pronator teres syndrom
- Dobbel crush syndrom
- Thoracic outlet syndrom

Risikofaktorer identifisert: ____

Prognose: [God/Moderat/Guarded] med konservativ behandling
Anbefaling: [Konservativ behandling/Nevrofysiologisk testing/Ortopedisk henvisning]', 'assessment');

SELECT insert_template('Assessment', 'Diagnose', 'De Quervain tenosynovitt vurdering',
'Klinisk resonnement:
Basert på funn tyder dette på de Quervain''s tenosynovitt.

Kliniske funn:
- Positiv Finkelstein''s test
- Ømhet over 1. dorsale kompartment
- Smerte ved resistert tommel abduksjon/ekstensjon
- [Hevelse over radial styloid hvis tilstede]

Differensialdiagnoser vurdert:
- De Quervain''s tenosynovitt (mest sannsynlig)
- CMC artrose tommel
- Scaphoid patologi
- Intersection syndrom
- Wartenberg''s syndrom

Risikofaktorer identifisert: [Repetitive aktiviteter/Ny mor/Tekstbruk/Annet: ____]

Prognose: God med konservativ behandling
Anbefaling: Håndleddsskinne med tommelspica, aktivitetsmodifikasjon, anti-inflammatorisk', 'assessment');

SELECT insert_template('Assessment', 'Diagnose', 'Håndledd forstuing vurdering',
'Klinisk resonnement:
Basert på funn tyder dette på håndledd forstuing.

Skademekanisme: [Fall på utstrakt hånd/Tvisting/Annet: ____]
Grad: [I - Mild/II - Moderat/III - Alvorlig]

Kliniske funn:
- ROM reduksjon: ____
- Hevelse: [Mild/Moderat/Markant]
- Ømhet: ____
- Instabilitet: [Ja/Nei]

Fraktur utelukket basert på: [Klinisk undersøkelse/Røntgen]

Strukturer involvert: ____

Differensialdiagnoser vurdert:
- Ligament forstuing (mest sannsynlig)
- Scaphoid fraktur (utelukket)
- Karpal instabilitet
- TFCC skade

Prognose: [God - 2-4 uker/Moderat - 4-8 uker/Guarded - 8-12 uker]
Anbefaling: PRICE, skinne, gradvis mobilisering', 'assessment');

SELECT insert_template('Plan', 'Behandling', 'Håndledd behandlingsplan',
'Behandling utført:
- Leddmobilisering: ____
- Bløtvevsbehandling: ____
- Myofascial release: ____
- Ultralyd terapi: ____
- Taping/Skinne: ____

Hjemmeøvelser:
- Tøyninger: [Håndleddsbøyere/strekkere, fingerstrekkere]
- Styrkeøvelser: [Gripestyrke, pinsettgrep]
- Nevrale glideøvelser: [Median/Ulnar nerve glides]

Ergonomiske råd:
- Arbeidsplass tilpasning: ____
- Håndleddsposisjon: Nøytral posisjon
- Pauserutiner: Hver 30-60 minutter

Hjelpemidler:
- Håndleddsskinne: [Ja - natt/dag/kontinuerlig / Nei]
- Ergonomisk tastatur/mus: [Anbefalt/Ikke nødvendig]

Oppfølging: ____ dager/uker', 'plan');

-- Clean up helper function
DROP FUNCTION insert_template(VARCHAR, VARCHAR, VARCHAR, TEXT, VARCHAR, VARCHAR);
