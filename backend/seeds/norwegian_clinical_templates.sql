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

-- Clean up helper function
DROP FUNCTION insert_template(VARCHAR, VARCHAR, VARCHAR, TEXT, VARCHAR, VARCHAR);
