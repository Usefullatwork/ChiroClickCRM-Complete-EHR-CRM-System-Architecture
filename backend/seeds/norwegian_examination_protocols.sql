-- Norwegian Orthopedic and Neurological Examination Protocols
-- Comprehensive clinical examination protocols for ChiroClick CRM
-- Language: Norwegian (NO) with English references

-- ============================================================================
-- CERVICAL SPINE (Cervikalcolumna og cervikobrakialgi)
-- ============================================================================

INSERT INTO examination_protocols (body_region, category, test_name, test_name_no, description_no, positive_indication_no, language, is_system, display_order) VALUES

-- Observation
('Cervical', 'Observation', 'Observation & Posture', 'Observasjon & positur',
'Observer tegn til alvorlig patologi',
'Alvorlig Cx ulykke, neoplasme, fraktur, hematom, atrofi, fascikulasjoner, tremor',
'NO', true, 1),

-- Gait
('Cervical', 'Gait', 'Gait Analysis', 'Gange',
'Tegn til myelopati',
'Tap av balanse, stivhet, ustøhet, tap av kraft i U.E, bred gange, skraping av tær, hyperrefleksi, positiv finger test og plantarrefleks',
'NO', true, 2),

-- Palpation
('Cervical', 'Palpation', 'Bone and Soft Tissue Palpation', 'Palpasjon',
'Palper cervikalcolumna for ømhet og patologi',
'Bein og bløtvev ømhet',
'NO', true, 3),

-- Percussion & Vibration
('Cervical', 'Palpation', 'Percussion & Vibration', 'Perkusjon & vibrasjon',
'Test for fraktur eller nerveaffeksjon',
'Fraktur, nerveaffeksjon/skade',
'NO', true, 4),

-- ROM Tests
('Cervical', 'ROM', 'Active ROM', 'Aktiv ROM',
'Måler bevegelsesutslag i cervikalcolumna',
'Begrenset bevegelighet kan indikere patologi',
'NO', true, 5),

('Cervical', 'ROM', 'Passive ROM & Isometric Testing', 'Passiv ROM, isometrisk testing',
'Test passiv bevegelighet og isometrisk styrke',
'Redusert ROM eller smerte ved motstand',
'NO', true, 6),

-- Special Tests
('Cervical', 'Special_Tests', 'Spurling Test', 'Spurling´s test',
'Cervikal axial kompresjonstest',
'Økt smerte indikerer muskel/ligament ruptur. Redusert smerte indikerer nerveaffeksjon/irritasjon',
'NO', true, 7),

('Cervical', 'Special_Tests', 'Cervical Distraction Test', 'Cervikal distraksjonstest',
'Test for cervikal radikulopati',
'Cervikal radikulopati/skive prolaps',
'NO', true, 8),

('Cervical', 'Special_Tests', 'Foraminal Compression Test', 'Foraminal kompresjonstest',
'Test for nerverot irritasjon',
'Nerverot irritasjon',
'NO', true, 9),

('Cervical', 'Special_Tests', 'Bakody Test', 'Bakody´s test (skulder abduksjonstest)',
'Test for radikulær irritasjon',
'Radikulær irritasjon',
'NO', true, 10),

('Cervical', 'Special_Tests', 'Shoulder Depression Test', 'Skulder depresjonstest',
'Test for radikulær irritasjon',
'Radikulær irritasjon',
'NO', true, 11),

('Cervical', 'Special_Tests', 'Lhermitte Test', 'Lhermitte´s test',
'Test for spinal patologi',
'Patologi i columna, cervikal traume, akutt myelitt',
'NO', true, 12),

('Cervical', 'Special_Tests', 'Roos Test', 'Roo´s test',
'Test for thoracic outlet syndrome',
'Thoracic outlet syndrome (TOS)',
'NO', true, 13),

('Cervical', 'Special_Tests', 'Adson Test', 'Adson´s test & reversert Adson´s test',
'Test for TOS og plexus brachialis affeksjon',
'TOS. Redusert puls kan indikere plexus brachialis affeksjon',
'NO', true, 14),

('Cervical', 'Special_Tests', 'Hyperabduction Test', 'Hyperabduksjon test skulder',
'Test for TOS',
'TOS; plexus brachialis affeksjon',
'NO', true, 15),

('Cervical', 'Special_Tests', 'Costoclavicular Test', 'Costoclavicular test',
'Test for TOS',
'TOS; plexus brachialis affeksjon',
'NO', true, 16);

-- ============================================================================
-- SHOULDER (Skulder)
-- ============================================================================

INSERT INTO examination_protocols (body_region, category, test_name, test_name_no, description_no, positive_indication_no, language, is_system, display_order) VALUES

-- Observation
('Shoulder', 'Observation', 'Observation & Posture', 'Observasjon & positur (+ sulcus tegn)',
'Observer glenohumeral instabilitet, positur, scapula',
'Glenohumeral instabilitet, skapula alatal/vingeskapula, AC-ledd seperasjon, atrofi, biceps sene rift/ruptur',
'NO', true, 1),

-- Palpation
('Shoulder', 'Palpation', 'Bone and Soft Tissue Palpation', 'Palpasjon',
'Palper skulder for ømhet',
'Bein og bløtvev ømhet',
'NO', true, 2),

('Shoulder', 'Palpation', 'Percussion & Vibration', 'Perkusjon & vibrasjon',
'Test for fraktur',
'Fraktur/nerveaffeksjon',
'NO', true, 3),

-- Instability Tests
('Shoulder', 'Special_Tests', 'Sulcus Sign', 'Sulcus tegn',
'Test for glenohumeral instabilitet',
'Anterior inferior dislokasjon',
'NO', true, 4),

('Shoulder', 'Special_Tests', 'Anterior Apprehension Test', 'Fremre apprehension test',
'Test for anterior instabilitet',
'Anterior instabilitet, Bankart lesjon',
'NO', true, 5),

('Shoulder', 'Special_Tests', 'Posterior Apprehension Test', 'Posterior apprehension test',
'Test for posterior instabilitet',
'Posterior instabilitet',
'NO', true, 6),

('Shoulder', 'Special_Tests', 'Load and Shift Test', 'Translokasjonstest',
'Test for instabilitet',
'Med caudal instabilitet vil man se et søkk subacromialt (sulcus tegn). Kan også antyde Bankart lesjon',
'NO', true, 7),

-- ROM
('Shoulder', 'ROM', 'ROM (+ Appley test)', 'ROM (+ Appley test)',
'Måler bevegelsesutslag i skulder',
'Begrenset ROM kan indikere patologi',
'NO', true, 8),

-- Impingement Tests
('Shoulder', 'Special_Tests', 'Modified Hawkin-Kennedy', 'Modifisert Hawkin-Kennedy',
'Test for supraspinatus impingement',
'Supraspinatus sene impingement',
'NO', true, 9),

('Shoulder', 'Special_Tests', 'Neer Test', 'Neer´s test',
'Test for subacromial impingement',
'Subacromial impingement, Rotator cuff patologi',
'NO', true, 10),

-- Rotator Cuff Tests
('Shoulder', 'Special_Tests', 'Speed Test', 'Speeds test',
'Test for supraspinatus og labrum',
'Supraspinatus rift/ruptur, labrum ruptur',
'NO', true, 11),

('Shoulder', 'Special_Tests', 'Active Compression Test', 'Aktiv kompresjonstest',
'Test for biceps og SLAP lesjon',
'Biceps patologi og superior labrum anterior posterior (SLAP) lesjon',
'NO', true, 12),

('Shoulder', 'Special_Tests', 'Cross Body Test', 'Cross body test',
'Test for AC/SC ledd patologi',
'AC ledd og SC ledd patologi, labrum patologi',
'NO', true, 13),

('Shoulder', 'Special_Tests', 'Beighton Hypermobility Test', 'Beighton hypermobilitetstest',
'Test for generell hypermobilitet',
'Hypermobilitet (5+)',
'NO', true, 14),

('Shoulder', 'Special_Tests', 'Passive Distraction Test', 'Passiv distraksjonstest (PDT)',
'Test for labrum patologi',
'Labrum patologi – SLAP lesjon',
'NO', true, 15),

-- Subscapularis Tests
('Shoulder', 'Special_Tests', 'Lift Off Test', 'Lift off test',
'Test for subscapularis patologi',
'Dysfunksjon/rift/ruptur av m. subscapularis',
'NO', true, 16),

('Shoulder', 'Special_Tests', 'Napoleon Test', 'Napoleon test',
'Test for subscapularis ruptur',
'm. subscapularis ruptur',
'NO', true, 17),

('Shoulder', 'Special_Tests', 'Bear Hug Test', 'Bear hug test',
'Test for full tykkelse ruptur',
'm. subscapularis full tykkelse ruptur',
'NO', true, 18),

('Shoulder', 'Special_Tests', 'O''Brien Test', 'O´Brien´s',
'Test for SLAP lesjon',
'SLAP lesjon',
'NO', true, 19),

('Shoulder', 'Special_Tests', 'Rent Test', 'Rent´s test',
'Test for full tykkelse ruptur',
'Kan indikere full tykkelse ruptur',
'NO', true, 20);

-- ============================================================================
-- ELBOW (Albue)
-- ============================================================================

INSERT INTO examination_protocols (body_region, category, test_name, test_name_no, description_no, positive_indication_no, language, is_system, display_order) VALUES

('Elbow', 'Observation', 'Observation & Posture', 'Observasjon & positur',
'Observer holdning, bærevinkel, patologi',
'Holdning av Ø.E, bærevinkel, subkutan endring, caput radii patologi, olecranonbursitt, RA knuter, feilstilling',
'NO', true, 1),

('Elbow', 'Palpation', 'Bone and Soft Tissue Palpation', 'Palpasjon',
'Palper albue for ømhet',
'Bein og bløtvev ømhet',
'NO', true, 2),

('Elbow', 'ROM', 'AROM & Elbow Extension Test', 'AROM & albue ekstensjonstest',
'Test bevegelighet og patologi',
'Albue fraktur, hydrops, osteokondritt, fritt bein legeme',
'NO', true, 3),

('Elbow', 'Palpation', 'Percussion & Vibration', 'Perkusjon og vibrasjon',
'Test for fraktur',
'Fraktur',
'NO', true, 4),

('Elbow', 'Special_Tests', 'Valgus Stress Test', 'Valgus stress test',
'Test for MCL integritet',
'Mediale kollaterale ligament (MCL) albue skade',
'NO', true, 5),

('Elbow', 'Special_Tests', 'Varus Stress Test', 'Varus stress test',
'Test for LCL integritet',
'Laterale kollaterale ligament (LCL) albue skade',
'NO', true, 6),

('Elbow', 'Special_Tests', 'Cozen Test', 'Lateral epikondylitt test/Cozen´s test',
'Test for tennis albue',
'Lateral epikondyalgi/epikondylitt',
'NO', true, 7),

('Elbow', 'Special_Tests', 'Grip Strength', 'Greps styrke',
'Test for ekstensor tendinopati',
'Tendinopati av ekstensorgruppen/lateral epikondyalgi',
'NO', true, 8),

('Elbow', 'Special_Tests', 'Medial Epicondylitis Test', 'Medial epikondylitt test (golf albue)',
'Test for golf albue',
'Medial epikondyalgi/epikondylitt',
'NO', true, 9),

('Elbow', 'Special_Tests', 'Pronator Teres Syndrome Test', 'Pronator teres syndrom provokasjonstest',
'Test for nervus medianus avklemming',
'Nervus medianus avklemming – pronator teres syndrom',
'NO', true, 10),

('Elbow', 'Special_Tests', 'Pinch Sign Test', 'Klype tegn',
'Test for n. interosseus anterior syndrom',
'N. interosseus anterior syndrom – positivt klypetegn + "Benediction tegn"',
'NO', true, 11),

('Elbow', 'Special_Tests', 'Pronator Quadratus Strength', 'M. pronator quadratus styrke test',
'Test for n. interosseus anterior syndrom',
'N. interosseus anterior syndrom',
'NO', true, 12),

('Elbow', 'Special_Tests', 'Tinel Sign (Ulnar)', 'Tinnel',
'Test for n. ulnaris affeksjon',
'N. ulnaris affeksjon',
'NO', true, 13),

('Elbow', 'Special_Tests', 'Froment Sign', 'Fromment´s tegn',
'Test for n. ulnaris affeksjon',
'N. ulnaris affeksjon',
'NO', true, 14),

('Elbow', 'Special_Tests', 'Arcade of Frohse Test', 'Arcade of froshe',
'Test for n. interosseus posterior syndrom',
'N. interosseus posterior syndrom. Ingen sensibilitetstap',
'NO', true, 15),

('Elbow', 'Special_Tests', 'Pivot Shift (Elbow)', 'Pivot shift (albue)',
'Test for posterolateral instabilitet',
'Posterolateral instabilitet – fall på utstrakt hånd',
'NO', true, 16);

-- ============================================================================
-- HAND AND WRIST (Hånd og håndledd)
-- ============================================================================

INSERT INTO examination_protocols (body_region, category, test_name, test_name_no, description_no, positive_indication_no, language, is_system, display_order) VALUES

('Hand_Wrist', 'Observation', 'Observation & Posture', 'Observasjon & positur',
'Observer tegn til deformitet',
'Herberdens knuter (OA), apehånd (n. medianus), svanenakke (RA), droppfinger, jersey finger, Bouchard´s knuter (RA), krokfinger, biskophånd, klohånd (n. ulnaris)',
'NO', true, 1),

('Hand_Wrist', 'Palpation', 'Scaphoid Fracture Assessment', 'Utredning for skafoidfraktur',
'Palper for skafoidfraktur',
'Palpasjon for skafoidfraktur (snusdåsen/tuberkelen, aksial tommel kompresjon). Vær obs på okkult fraktur av skafoid',
'NO', true, 2),

('Hand_Wrist', 'Palpation', 'Bone and Soft Tissue Palpation', 'Palpasjon',
'Palper hånd og håndledd',
'Bein og bløtvev ømhet',
'NO', true, 3),

('Hand_Wrist', 'Palpation', 'Percussion & Vibration', 'Perkusjon og vibrasjon',
'Test for fraktur',
'Fraktur',
'NO', true, 4),

('Hand_Wrist', 'Special_Tests', 'TFCC Stress Test', 'Triangular fibrocartilage complex (TFCC) belastningstest',
'Test for TFCC ruptur',
'TFCC ruptur/instabilitet',
'NO', true, 5),

('Hand_Wrist', 'Special_Tests', 'Press Test', 'Press test',
'Test for TFCC patologi',
'Reproduserer fokal smerte. Proprioseptiv ruptur',
'NO', true, 6),

('Hand_Wrist', 'Special_Tests', 'UCL Thumb Test', 'Ulnar collateral ligament (UCL) skade (tommel)',
'Test for UCL patologi',
'Ruptur/patologi av UCL',
'NO', true, 7),

('Hand_Wrist', 'Special_Tests', 'Watson Test', 'Watson test',
'Test for skafoid lunatum instabilitet',
'Skafoid lunatum (SL) instabilitet',
'NO', true, 8),

('Hand_Wrist', 'Special_Tests', 'Finger Extension Test', 'Finger ekstensjonstest',
'Test for instabilitet',
'Instabilitet/patologi',
'NO', true, 9),

('Hand_Wrist', 'Special_Tests', 'Finkelstein Test', 'Finkelstein´s test',
'Test for De Quervain tenosynovitt',
'Tenosynovitt (m. extensor pollicis brevis & m. abductor pollicis brevis – De Quervain´s seneskjedebetennelse)',
'NO', true, 10),

('Hand_Wrist', 'Special_Tests', 'Intersection Syndrome Test', 'Intersection syndrom test',
'Test for intersection syndrom',
'Intersection syndrom',
'NO', true, 11),

('Hand_Wrist', 'Special_Tests', 'Tinel Sign (Carpal/Guyon)', 'Tinnel',
'Test for nervekompresjon',
'Karpaltunnelsyndrom og Guyons kanalsyndrom',
'NO', true, 12),

('Hand_Wrist', 'Special_Tests', 'Carpal Tunnel Compression Test', 'Karpaltunnel kompresjon test',
'Test for karpaltunnelsyndrom',
'Karpaltunnelsyndrom (CTS)',
'NO', true, 13),

('Hand_Wrist', 'Special_Tests', 'Phalen Test', 'Phalen´s test',
'Test for karpaltunnelsyndrom',
'Karpaltunnelsyndrom (CTS)',
'NO', true, 14),

('Hand_Wrist', 'Special_Tests', 'Allen Test', 'Allen´s test',
'Test for vaskulær insuffisiens',
'Vaskulær insuffisiens',
'NO', true, 15),

('Hand_Wrist', 'Special_Tests', 'Finger Capillary Refill', 'Sirkulasjon fingre',
'Test sirkulasjon i fingre',
'Ved trykk på negleplaten skal farge returnere innen ≤3 sekunder',
'NO', true, 16);

-- ============================================================================
-- THORACIC SPINE (Thorakalcolumna)
-- ============================================================================

INSERT INTO examination_protocols (body_region, category, test_name, test_name_no, description_no, positive_indication_no, language, is_system, display_order) VALUES

('Thoracic', 'Observation', 'Observation & Posture', 'Observasjon & positur',
'Observer symmetri, arr, posisjon',
'Symmetri, arr, hudfolder, posisjon av skulderblad (skapula alatal/vingeskapula), muskel spasmer, atrofi',
'NO', true, 1),

('Thoracic', 'ROM', 'AROM (+ Adam Test)', 'AROM (+ Adam test)',
'Test for strukturell/funksjonell skoliose',
'Strukturell/funksjonell skoliose',
'NO', true, 2),

('Thoracic', 'Special_Tests', 'Ott Sign', 'O´s tegn',
'Test leddutslag thorakalcolumna',
'Leddutslag thorakalcolumna – degenerativ inflammasjonsprosess',
'NO', true, 3),

('Thoracic', 'Gait', 'Gait Analysis', 'Gange',
'Observer gange',
'Gangforstyrrelser',
'NO', true, 4),

('Thoracic', 'Palpation', 'Bone and Soft Tissue Palpation', 'Palpasjon',
'Palper thorakalcolumna',
'Bein (proc. spinosus, ribbein) og bløtvev ømhet',
'NO', true, 5),

('Thoracic', 'Palpation', 'Percussion & Vibration', 'Perkusjon og vibrasjon',
'Test for fraktur',
'Fraktur',
'NO', true, 6),

('Thoracic', 'Special_Tests', 'Chest Expansion', 'Brystutvidelse',
'Test for ankyloserende spondylitt',
'Ankyloserende spondylitt (5+ cm)',
'NO', true, 7),

('Thoracic', 'Special_Tests', 'Fist Percussion', 'Knyttneveperkusjon',
'Test for kompresjonsfraktur',
'Kompresjonsfraktur',
'NO', true, 8),

('Thoracic', 'Special_Tests', 'Supine Sign', 'Supine sign',
'Test for kompresjonsfraktur',
'Kompresjonsfraktur',
'NO', true, 9),

('Thoracic', 'Special_Tests', 'Maigne Syndrome Test', 'Test for Maigne syndrom/falsk isjialgi',
'Test for Maigne syndrom',
'Maigne syndrom',
'NO', true, 10),

('Thoracic', 'Neurological', 'Sensibility Testing', 'Sensibilitet',
'Test nerveaffeksjon',
'Nerveaffeksjon (T4, T7, T10, T12)',
'NO', true, 11),

('Thoracic', 'Neurological', 'Beevor Test', 'Bevor´s test',
'Test for nevrologisk patologi',
'Nevrologisk patologi',
'NO', true, 12),

('Thoracic', 'Neurological', 'Abdominal Reflex', 'Abdominalrefleks',
'Test for nerveaffeksjon',
'Nerveaffeksjon',
'NO', true, 13),

('Thoracic', 'Palpation', 'Abdominal Palpation', 'Palpasjonsøm buk',
'Test for visceral irritasjon',
'Kan indikere irritasjon i viscera/bukvegg',
'NO', true, 14);

-- ============================================================================
-- LUMBAR SPINE & SI JOINT (Lumbalcolumna og iliosakralledet)
-- ============================================================================

INSERT INTO examination_protocols (body_region, category, test_name, test_name_no, description_no, positive_indication_no, language, is_system, display_order, is_red_flag, red_flag_criteria) VALUES

('Lumbar', 'Observation', 'Observation & Posture', 'Observasjon & positur',
'Observer lateral deviasjon, lumbal lordose, bekkenhevning',
'Lateral deviasjon, lumbal lordose, bekkenhevning, thorakolumbal hypertrofi/myalgi, step off defekt, avvergeholdning',
'NO', true, 1, false, null),

('Lumbar', 'Gait', 'Gait Analysis', 'Gange',
'Observer gange for tegn til patologi',
'Gangforstyrrelser: tap av balanse, stivhet, ustabilitet og krafttap i ben. Bred gange, skraping av storetåen',
'NO', true, 2, false, null),

('Lumbar', 'ROM', 'Finger to Floor Test', 'Finger til gulv',
'Måler lumbal fleksjon',
'Begrenset fleksjon',
'NO', true, 3, false, null),

('Lumbar', 'Special_Tests', 'Schober Test', 'Schober´s test',
'Test for lumbal fleksjon',
'Mangelfull lumbal fleksjon – Ankyloserende spondylitt. Normal test >5 cm økning',
'NO', true, 4, false, null),

('Lumbar', 'Special_Tests', 'Single Leg Hyperextension Test', 'Et-bens-hyperekstensjonstest',
'Test for spondylose og fasettleddsmerter',
'Spondylose, fasettleddsmerter lumbalcolumna',
'NO', true, 5, false, null),

('Lumbar', 'Special_Tests', 'Kemp Test', 'Kemp´s test',
'Test for fasettleddsmerter',
'Fasettleddsmerter lumbalcolumna',
'NO', true, 6, false, null),

('Lumbar', 'Special_Tests', 'Waddell Signs', 'Waddel´s test',
'Psykologisk komponent',
'Identifisere pasienter med dårlig prognose',
'NO', true, 7, false, null),

('Lumbar', 'Special_Tests', 'McKenzie Protocol', 'McKenzie',
'Provokasjonstest: fleksjon, ekstensjon, lateralfleksjon',
'Provokasjon av symptomer',
'NO', true, 8, false, null),

('Lumbar', 'Palpation', 'Bone and Soft Tissue Palpation', 'Palpasjon',
'Palper lumbalcolumna',
'Bein og bløtvev ømhet',
'NO', true, 9, false, null),

('Lumbar', 'ROM', 'Passive ROM', 'PROM',
'Test passiv bevegelighet',
'Begrenset ROM',
'NO', true, 10, false, null),

('Lumbar', 'Special_Tests', 'Straight Leg Raise', 'Strak beinhevning (Lasègues prøve)',
'Test for nerverotaffeksjon',
'10° (Demianoff tegn) = lumbago. 0-60° = nerverotaffeksjon/utstråling. 40+° = korsryggsmerter (myalgi hamstring)',
'NO', true, 11, false, null),

('Lumbar', 'Special_Tests', 'Crossed Straight Leg Raise', 'Krysset strak beinhevning',
'Test for skiveprolaps',
'Isjas grunnet posteromedial skiveprolaps',
'NO', true, 12, false, null),

('Lumbar', 'Special_Tests', 'Gaenslen Test', 'Gaenslen test',
'Test for iliosakralledd affeksjon',
'Iliosakralledd affeksjon',
'NO', true, 13, false, null),

('Lumbar', 'Special_Tests', 'SI Joint Distraction', 'Iliosakralledd distraksjon',
'Test for SI ledd patologi',
'Iliosakralledd affeksjon',
'NO', true, 14, false, null),

('Lumbar', 'Special_Tests', 'SI Joint Compression (Side-lying)', 'Iliosakralledd kompresjon (sideliggende)',
'Test for SI ledd patologi',
'Iliosakralledd affeksjon',
'NO', true, 15, false, null),

('Lumbar', 'Special_Tests', 'Thigh Thrust', 'Thigh thrust',
'Test for SI ledd patologi',
'Iliosakralledd affeksjon',
'NO', true, 16, false, null),

('Lumbar', 'Special_Tests', 'FABER Test', 'FABER test',
'Test for hofteledd patologi',
'Hofteledd patologi',
'NO', true, 17, false, null),

('Lumbar', 'Special_Tests', 'Leg Length Discrepancy', 'Bein lengde',
'Måler beinlengdeforskjell',
'Anatomisk beinlengdeforskjell',
'NO', true, 18, false, null),

('Lumbar', 'Palpation', 'Abdominal Aorta Palpation', 'Aorta (Bukaorta)',
'Sjekk for abdominalt aortaaneurisme',
'AAA - Abdominalt aortaaneurisme. Ekspansiv pulserende følelse',
'NO', true, 19, true, 'Pulserende ekspansiv masse i abdomen'),

('Lumbar', 'Palpation', 'Percussion & Vibration', 'Perkusjon & vibrasjon',
'Test for fraktur',
'Patologi og fraktur i lumbalcolumna; pars interartikularis fraktur, patologisk fraktur (metastase)',
'NO', true, 20, true, 'Fraktur med minimal traume kan indikere metastase'),

('Lumbar', 'Special_Tests', 'SI Joint Compression (Prone)', 'Iliosakralledd kompresjon (mageliggende)',
'Test for SI ledd patologi',
'Iliosakralledd affeksjon',
'NO', true, 21, false, null),

('Lumbar', 'Special_Tests', 'Pheasant Test', 'Pheasant´s test',
'Test for lumbal spinal stenose',
'Lumbal spinal stenose',
'NO', true, 22, false, null);

-- ============================================================================
-- HIP (Hofteleddet articulatio coxae)
-- ============================================================================

INSERT INTO examination_protocols (body_region, category, test_name, test_name_no, description_no, positive_indication_no, language, is_system, display_order) VALUES

('Hip', 'Observation', 'Observation & Posture', 'Observasjon & positur',
'Observer avvergeholdning og utoverrotert U.E',
'Avvergeholdning, utover rotert U.E',
'NO', true, 1),

('Hip', 'Gait', 'Gait Analysis', 'Gange',
'Observer gange',
'Avvergegange/halting, ganglengde, elevasjon av hofte',
'NO', true, 2),

('Hip', 'ROM', 'Active ROM', 'AROM',
'Måler bevegelsesutslag i hofte',
'Ved hofteleddsartrose er fleksjon og innoverrotasjon innskrenket og kan være smertefull',
'NO', true, 3),

('Hip', 'Palpation', 'Hernia Palpation', 'Palpasjon for brokk/hernier',
'Palper for inguinalhernie',
'Inguainalhernie/lyskebrokk',
'NO', true, 4),

('Hip', 'Special_Tests', 'Trendelenburg Test', 'Trendelenburg test',
'Test for gluteal svakhet',
'Avdekker svakheter i de små sete musklene (spesielt m. gluteus medius men også m. gluteus minimus)',
'NO', true, 5),

('Hip', 'Special_Tests', 'Pectineus Stretch Test', 'M. pectineus strekk test',
'Test for n. obturatorius affeksjon',
'N. obturatorius affeksjon',
'NO', true, 6),

('Hip', 'Special_Tests', 'Fulcrum Test', 'Fulcrum test',
'Test for femoral stress fraktur',
'Tretthetsbrudd av lårhals/Collum femoris fraktur/collumfraktur/lårhalsbrudd; forkortet og lateral rotert hofte',
'NO', true, 7),

('Hip', 'Special_Tests', 'Tibial Rotation', 'Tibiarotasjon',
'Test for femoral anteversjon',
'Femoral anteversjon (inntåing, innoverrotert lårbein)',
'NO', true, 8),

('Hip', 'Palpation', 'Bone and Soft Tissue Palpation', 'Palpasjon',
'Palper hofte',
'Ben og bløtvev ømhet',
'NO', true, 9),

('Hip', 'Special_Tests', 'Leg Length Measurement', 'Bein lengde',
'Måler anatomisk beinlengde',
'Anatomisk legg lengde forskjell',
'NO', true, 10),

('Hip', 'Special_Tests', 'Allis Test', 'Allis test',
'Test for beinlengdeforskjell på lårbein',
'Beinlengdeforskjell på lårbein',
'NO', true, 11),

('Hip', 'ROM', 'Passive ROM', 'PROM',
'Test passiv ROM',
'Begrenset ROM',
'NO', true, 12),

('Hip', 'Special_Tests', 'Drehmann Sign', 'Drehmann',
'Test for epifysiolyse',
'Epifysiolyse av lårbenshodet',
'NO', true, 13),

('Hip', 'Special_Tests', 'Thomas Test', 'Thomas',
'Test for iliopsoas kontraktur',
'Fleksjon av motsatt hofte = stram m. iliopsoas',
'NO', true, 14),

('Hip', 'Special_Tests', 'Flexion-Adduction Test', 'Fleksjon-Adduksjon test',
'Test for tidlig hoftesykdom',
'Oppdage tidlig tegn på hoftesykdom hos eldre barn og unge voksne',
'NO', true, 15),

('Hip', 'Special_Tests', 'FADIR Test', 'FADIR test',
'Test for anterior impingement og labrum',
'Fleksjon, abduksjon, intern rotasjon. Dyp smerte i lysken. Fremre impingement og labrumskade. (FAI)',
'NO', true, 16),

('Hip', 'Special_Tests', 'Posterior Impingement Test', 'Bakre impingement test',
'Test for posterior impingement',
'Labral impingement/FAI',
'NO', true, 17),

('Hip', 'Special_Tests', 'Quadrant Test', 'Quadrant-test',
'Test for hoftepatologi',
'Hoftepatologi: hofteartrose, FAI',
'NO', true, 18),

('Hip', 'Special_Tests', 'FABER Test', 'Fabers test',
'Test for bakre impingement',
'Fleksjon, abduksjon, ekstern rotasjon. Dyp smerte i lysken. Test for bakre impingement, generell hoftepatologi',
'NO', true, 19),

('Hip', 'Special_Tests', 'Leg Rolling Test', 'Leg rolling test',
'Test for hoftefraktur',
'Hoftefraktur. Intraartikulær patologi',
'NO', true, 20),

('Hip', 'Special_Tests', 'Anvil Test', 'Anvil test',
'Test for lårbeinsfraktur',
'Lårbeinsfraktur. Hoftepatologi',
'NO', true, 21),

('Hip', 'Special_Tests', 'Tinel Test (Lateral Femoral Cutaneous)', 'Tinel´s test',
'Test for nervus cutaneus femoris lateralis',
'Nervus cutaneus femoris lateralis - sanseinntrykk fra forsiden og yttersiden av låret',
'NO', true, 22),

('Hip', 'Palpation', 'Lower Extremity Pulses', 'Underekstremitetspulser',
'Sjekk sirkulasjon',
'Claudicatio intermittens',
'NO', true, 23),

('Hip', 'Special_Tests', 'Duncan Ely Test', 'Duncan Ely (Rec fem kontraktur test)',
'Test for rectus femoris lengde',
'Teste lengden av m. Rectus Femoris',
'NO', true, 24),

('Hip', 'Special_Tests', 'Ober Test', 'Ober´s test (ITB kontraktur)',
'Test for ITB kontraktur',
'Kontraktur av tractus iliotibialis (ITB) og/eller hyperton tensor fascia latae. Trokanterbursitt, snapping hip syndrom, løperkne',
'NO', true, 25),

('Hip', 'Special_Tests', 'Meralgia Paresthetica Test', 'Meralgia paresthetica test',
'Test for lateral femoral cutaneous nerve',
'Nervus cutaneus femoris lateralis, nummenhet på utsiden av låret',
'NO', true, 26),

('Hip', 'Special_Tests', 'Piriformis Syndrome Test', 'Piriformis Syndrom test',
'Test for piriformis syndrome',
'Dersom Piriformis er for stram, kan den klemme på isjasnerven',
'NO', true, 27);

-- ============================================================================
-- KNEE (Kne)
-- ============================================================================

INSERT INTO examination_protocols (body_region, category, test_name, test_name_no, description_no, positive_indication_no, language, is_system, display_order) VALUES

('Knee', 'Observation', 'Observation & Posture', 'Observasjon & positur',
'Observer tegn til deformitet',
'Deformitet: Osgood-Schlatter, hematom eller hevelse (bursitt, Baker cyste), muskelatrofi, fascikulasjoner',
'NO', true, 1),

('Knee', 'Gait', 'Gait Analysis', 'Gange',
'Observer gange',
'Avvergingsgange, ganglengde',
'NO', true, 2),

('Knee', 'Palpation', 'Bone and Soft Tissue Palpation', 'Palpasjon',
'Palper for Baker cyste og ømhet',
'Bein og bløtvev. Palper for Bakers cyste, og generell ømhet rundt kneleddet',
'NO', true, 3),

('Knee', 'ROM', 'Active ROM', 'AROM',
'Fleksjon og ekstensjon',
'Begrenset ROM',
'NO', true, 4),

('Knee', 'Special_Tests', 'Thessaly Test', 'Thessaly test',
'Test for meniskruptur',
'Meniskruptur',
'NO', true, 5),

('Knee', 'Special_Tests', 'Q-Angle Measurement', 'Q-vinkel',
'Måler Q-vinkel',
'Økt vinkel: kondromalasi, sublukserende patella, patellofemoral smertesyndrom, genu valgum. Redusert vinkel: kondromalasi og høytstående patella',
'NO', true, 6),

('Knee', 'Special_Tests', 'Osteochondritis Dissecans Test', 'Ostochondritis dissecans test',
'Test for OCD',
'Osteochondritis dissecans (beinvev under leddbrusk blir skadet/får lite blodtilførsel)',
'NO', true, 7),

('Knee', 'Special_Tests', 'Plica Stutter Test', 'Plica stutter test',
'Test for plica syndrome',
'Plica syndrome (Plicae = Synovial thickenings)',
'NO', true, 8),

('Knee', 'Special_Tests', 'Stroke Test', 'Stroke test',
'Test for ledd effusjon',
'Joint effusion (Synovial fluid)',
'NO', true, 9),

('Knee', 'ROM', 'Passive and Resistive ROM', 'PROM and RROM',
'Test passiv og resistiv ROM',
'Begrenset ROM eller smerte',
'NO', true, 10),

('Knee', 'Special_Tests', 'Tibial Sagging', 'Tibial sagging',
'Test for PCL ruptur',
'PCL ruptur. Går tibia bakover uten kraftpåvirkning?',
'NO', true, 11),

('Knee', 'Special_Tests', 'Lachman Test', 'Lachmanns test',
'Test for ACL integritet',
'Svakt endepunkt på den ene siden tyder på ACL skade',
'NO', true, 12),

('Knee', 'Special_Tests', 'Anterior Drawer Test', 'Anterior draw test',
'Test for ACL ruptur',
'ACL tear',
'NO', true, 13),

('Knee', 'Special_Tests', 'Pivot Shift Test', 'Pivot shift test',
'Test for ACL patologi',
'Innoverrotasjon og appliser valguskraft. ACL patologi. Positiv hvis tibia sublukserer bakover ved 30-40 graders fleksjon',
'NO', true, 14),

('Knee', 'Special_Tests', 'Posterior Drawer Test', 'Bakre skuffetest',
'Test for PCL patologi',
'PCL patologi. Positiv test hvis mer enn 5mm translasjon',
'NO', true, 15),

('Knee', 'Special_Tests', 'Valgus Stress Test', 'Valgus stress test',
'Test for MCL integritet',
'MCL stress-test. Ser etter sulcus medialt på kneet samt smerter',
'NO', true, 16),

('Knee', 'Special_Tests', 'Varus Stress Test', 'Varus stress test',
'Test for LCL integritet',
'LCL stress test. Ser etter sulcus lateral på kneet samt smerter',
'NO', true, 17),

('Knee', 'Special_Tests', 'McMurray Test', 'McMurray test',
'Test for meniskruptur',
'Meniskruptur. Positiv ved klikkelyder og smerter. Lateral menisk: 90° fleksjon, roter tibia utover og appliser valgusstress. Medial menisk: 90° fleksjon, roter tibia innover og appliser varusstress',
'NO', true, 18),

('Knee', 'Special_Tests', 'Patellofemoral Grind Test', 'Patellar femoral grind test',
'Test for kondromalasi',
'Kondromalasi, artrose, patellofemoral smertesyndrom. Positiv hvis krepitasjon og ubehag',
'NO', true, 19),

('Knee', 'Special_Tests', 'Patellar Apprehension Test', 'Patella apprehension test',
'Test for patellar instabilitet',
'Instabilitet, patella var nær ved å subluksere dersom det er sterkt ubehag eller pasienten kontraherer m. quadriceps',
'NO', true, 20),

('Knee', 'Observation', 'Quadriceps Measurement', 'Quadriceps mål',
'Måler omkrets for atrofi/hevelse',
'Atrofi, hevelse',
'NO', true, 21);

-- ============================================================================
-- ANKLE & FOOT (Ankel og fot)
-- ============================================================================

INSERT INTO examination_protocols (body_region, category, test_name, test_name_no, description_no, positive_indication_no, language, is_system, display_order) VALUES

('Ankle_Foot', 'Observation', 'Observation & Posture', 'Observasjon & positur',
'Observer fottøy og positur',
'Fottøy avvik, deformiteter',
'NO', true, 1),

('Ankle_Foot', 'Gait', 'Gait Analysis', 'Gange',
'Observer gange',
'Gangavvik',
'NO', true, 2),

('Ankle_Foot', 'Palpation', 'Bone and Soft Tissue Palpation', 'Palpasjon',
'Palper ankel og fot',
'Bein og bløtvev ømhet',
'NO', true, 3),

('Ankle_Foot', 'Special_Tests', 'Ankle Proprioception Test', 'Ankel propriosepsjon/leddsans',
'Test for leddsans',
'Redusert propriosepsjon',
'NO', true, 4),

('Ankle_Foot', 'Special_Tests', 'Syndesmosis Stress Test', 'Syndesmose stress test/lateral rotasjon test',
'Test for syndesmoseskade',
'Syndesmoseskade',
'NO', true, 5),

('Ankle_Foot', 'ROM', 'Passive and Resistive ROM', 'PROM & RROM',
'Test passiv og resistiv ROM',
'Begrenset ROM eller smerte',
'NO', true, 6),

('Ankle_Foot', 'Special_Tests', 'Anterior Drawer Test', 'Fremre skuffe test',
'Test for ligament instabilitet',
'Ligament instabilitet; anterior talofibulære ligament (ATFL), anterolaterale kapsel; fotballankel; repetitive strekkskader i laterale leddkapsel ankel',
'NO', true, 7),

('Ankle_Foot', 'Special_Tests', 'Talar Tilt Test', 'Talar tilt test',
'Test for inversjonstraume ligamenter',
'Inversjonstraume ligamenter ankel; kalkaneofibulære ligament (CFL), anterior talofibulære ligament (ATFL). 90% av overtråkk gir inversjonstraume',
'NO', true, 8),

('Ankle_Foot', 'Special_Tests', 'Deltoid Ligament Stress Test', 'Ligamentum deltiodeum stress test',
'Test for eversjonsstraume',
'Eversjonsstraume; fremre del av lig. deltiodeum',
'NO', true, 9),

('Ankle_Foot', 'Palpation', 'Circulation - Dorsalis Pedis', 'Sirkulasjon U.E - A. dorsalis pedis',
'Palper puls',
'Vaskulær insuffisiens',
'NO', true, 10),

('Ankle_Foot', 'Palpation', 'Circulation - Posterior Tibial', 'Sirkulasjon U.E - A. tibialis posterior',
'Palper puls',
'Vaskulær insuffisiens',
'NO', true, 11),

('Ankle_Foot', 'Special_Tests', 'Mulder Test', 'Test for Morton nevrom/Mulder´s test',
'Test for Morton nevrom',
'Positive med reproduksjon av smerte eller parestesier. Mulder´s tegn = hørbart "klikk"',
'NO', true, 12),

('Ankle_Foot', 'Special_Tests', 'Tarsal Tunnel Test', 'Dorsalfleksjon-eversjon av ankel',
'Test for tarsal tunnel syndrom',
'Tarsal tunnel syndrom',
'NO', true, 13),

('Ankle_Foot', 'Palpation', 'Toe Capillary Refill', 'Sirkulasjon tær',
'Test sirkulasjon i tær',
'Ved trykk på negleplaten skal farge returnere innen ≤3 sekunder',
'NO', true, 14),

('Ankle_Foot', 'Special_Tests', 'Buerger Test', 'Buerger´s test',
'Test for vaskulær insuffisiens',
'Vaskulær insuffisiens',
'NO', true, 15),

('Ankle_Foot', 'Special_Tests', 'Thompson Test', 'Thomas test/squeeze test',
'Test for Achilles sene ruptur',
'Achilles sene ruptur',
'NO', true, 16),

('Ankle_Foot', 'Special_Tests', 'Cotton Test', 'Cotton test',
'Test for Pott fraktur',
'Pott´s fraktur',
'NO', true, 17),

('Ankle_Foot', 'Special_Tests', 'Squeeze Test', 'Squeeze test',
'Test for syndesmoseskade',
'Syndesmoseskade',
'NO', true, 18);

-- ============================================================================
-- CRANIAL NERVES - CN 2, 3, 4, 6 (Vision & Eye Movements)
-- ============================================================================

INSERT INTO examination_protocols (body_region, category, test_name, test_name_no, description_no, positive_indication_no, language, is_system, display_order) VALUES

('Cranial_Nerves', 'CN_2_3_4_6', 'Observation', 'Observasjon',
'Observer øyne for tegn til patologi',
'Tegn til ptose, anisokori (ulik pupillstørrelse), sidelike pupiller, strabisme/skjeling, skleral injeksjon, farge på iris, exophthalmus/enophthalmus',
'NO', true, 1),

('Cranial_Nerves', 'CN_2', 'Peripheral Visual Field', 'Perifert synsfelt (Donders prøve)',
'Test perifer synsfelt',
'Synsutfall i perifert synsfelt',
'NO', true, 2),

('Cranial_Nerves', 'CN_2', 'Scotoma Assessment', 'Synsutfall (Skotom)',
'Kartlegg eventuelle synsutfall',
'Skotom - synsutfall',
'NO', true, 3),

('Cranial_Nerves', 'CN_2', 'Visual Field Defect Examination', 'Synsfelt utfall undersøkelse',
'Sirkulær bevegelse av pin hodet',
'Synsfeltutfall',
'NO', true, 4),

('Cranial_Nerves', 'CN_2', 'Fundoscopy', 'Fundoskopi',
'Undersøk fundus',
'Papilleødem, retinopati, andre patologier',
'NO', true, 5),

('Cranial_Nerves', 'CN_2_3', 'Pupillary Response', 'Pupille respons',
'Test pupillereaksjon til lys',
'Noter størrelse (miose/konstringert og myadriasis), form, egalitet. Normalt funn er når begge pupiller konstringerer ved lys',
'NO', true, 6),

('Cranial_Nerves', 'CN_3_4_6', 'H-Test (Eye Movements)', 'H-test (følgebevegelser øyne)',
'Test øyebevegelser',
'Diplopi, strabisme/blikkparese, nystagmus. N. oculomotorius: endret pupillerespons, ptose, diplopi. N. trochlearis: avvik ved blikk nedover. N. abducens: svekket evne til å se utover',
'NO', true, 7),

('Cranial_Nerves', 'CN_2_3', 'Accommodation & Convergence', 'Nærstillingsrespons',
'Test akkomodasjon',
'Pupillekonstriksjon når blikk er rettet fra distalt til nærliggende objekt (normalt funn)',
'NO', true, 8),

('Cranial_Nerves', 'CN_3_4_6', 'Cross Test (Eye Movements)', '+ test (følgebevegelser øyne)',
'Test vertikale og horisontale blikkretninger',
'Observer etter konjugert bevegelse mellom øynene',
'NO', true, 9),

('Cranial_Nerves', 'CN_3_4_6', 'Saccades Test', 'Test av Sakkader',
'Test sakkader',
'Vekslende blikk mellom rød pin og nese',
'NO', true, 10);

-- ============================================================================
-- CRANIAL NERVES - CN 5 & 7 (Face & Jaw)
-- ============================================================================

INSERT INTO examination_protocols (body_region, category, test_name, test_name_no, description_no, positive_indication_no, language, is_system, display_order) VALUES

('Cranial_Nerves', 'CN_5_7', 'Observation', 'Observasjon',
'Observer ansikt for tegn til patologi',
'Tegn til muskel atrofi, facialparese, hudfolder, blunking, fascikulasjoner, hudlesjoner, asymmetri',
'NO', true, 1),

('Cranial_Nerves', 'CN_5', 'Sensibility Testing', 'Sensibilitet (stikk og berøring)',
'Kartlegg sensibilitet i trigeminus divisjoner',
'Sensibilitetstap i N. ophtalmicus, N. maxillaris, N. mandibularis. Påvirker distribusjonen en divisjon av N. trigeminus eller truncus cerebri',
'NO', true, 2),

('Cranial_Nerves', 'CN_5', 'Jaw Opening (Muscle Strength)', 'Kjeve åpning (muskelstyrke)',
'Test kjeve bevegelighet',
'Kartlegg bevegelighet og eventuelle deviasjoner av kjeve. Palper m. masseter & temporalis',
'NO', true, 3),

('Cranial_Nerves', 'CN_5', 'Jaw Reflex', 'Kjeverefleks',
'Test kjeverefleks',
'Et lite rykk = normalt funn. Økt rykk = bilateral øvre motorneuronlesjon',
'NO', true, 4),

('Cranial_Nerves', 'CN_5_7', 'Corneal Reflex', 'Cornea refleks',
'Test cornealrefleks',
'Observer for direkte og konsensuell respons – blunk respons burde skje bilateralt. Afferent: n. ophtalmicus (V1), Efferent: n. facialis (VII). Sensitiv indikator på lesjon i nervus trigeminus',
'NO', true, 5),

('Cranial_Nerves', 'CN_7', 'Active Facial Movements', 'Aktive ansiktsbevegelser',
'Test aktiv ansiktsbevegelse',
'Observer til tegn etter muskelsvinn og fortynning av m. temporalis. Svekket styrke m. pterygoideus = kjeve deviasjon til påvirket side',
'NO', true, 6),

('Cranial_Nerves', 'CN_7', 'Isometric Facial Movements', 'Isometriske ansiktsbevegelser',
'Test isometrisk ansiktsstyrke',
'Hevede øyenbryn – eksaminator prøver å dytte ned. Lukkede øyne – eksaminator prøver å åpne. Sammenknepete lepper – eksaminator prøver å åpne',
'NO', true, 7);

-- ============================================================================
-- CRANIAL NERVE - CN 8 (Hearing)
-- ============================================================================

INSERT INTO examination_protocols (body_region, category, test_name, test_name_no, description_no, positive_indication_no, language, is_system, display_order) VALUES

('Cranial_Nerves', 'CN_8', 'Hearing Assessment', 'Kartlegging av hørsel',
'Kartlegg hørsel',
'Hvis hørsel er svekket, undersøk meatus acusticus externus og membrana tympanica med otoskop',
'NO', true, 1),

('Cranial_Nerves', 'CN_8', 'Weber Test', 'Webber´s prøve',
'Test for hørselstap type',
'Normal: likestilt hørsel. Ledende hørselstap: lyd forsterket i påvirket øre. Sensorinevralt hørselstap: lyd forsterket i upåvirket øre. Mulige årsaker: Menières sykdom, legemiddel bivirkning, svulst',
'NO', true, 2),

('Cranial_Nerves', 'CN_8', 'Rinne Test', 'Rinne´s prøve',
'Test bein vs luftledning',
'Normal: lyd skal høres foran øret etter at lyd har opphørt fra processus mastoideus (luftledning > beinledning). Ledende hørselstap: beinledning > luftledning. Sensorinevralt hørselstap: både beinledning og luftledning svekket',
'NO', true, 3);

-- ============================================================================
-- NEUROLOGICAL - Reflexes
-- ============================================================================

INSERT INTO examination_protocols (body_region, category, test_name, test_name_no, description_no, positive_indication_no, language, is_system, display_order) VALUES

('Neurological', 'Reflexes', 'Biceps Reflex', 'Biceps',
'C5/6 nervus musculocutanous',
'Hyperrefleksi kan indikere øvre motorneuronlesjon. Hyporefleksi kan indikere nedre motorneuronlesjon',
'NO', true, 1),

('Neurological', 'Reflexes', 'Brachioradialis Reflex', 'Brachioradialis',
'C5/6 nervus radialis',
'Hyperrefleksi kan indikere øvre motorneuronlesjon. Hyporefleksi kan indikere nedre motorneuronlesjon',
'NO', true, 2),

('Neurological', 'Reflexes', 'Triceps Reflex', 'Triceps',
'C7 nervus radialis',
'Hyperrefleksi kan indikere øvre motorneuronlesjon. Hyporefleksi kan indikere nedre motorneuronlesjon',
'NO', true, 3),

('Neurological', 'Reflexes', 'Finger Flexors Reflex', 'Fingerbøyerne',
'C8 nervus medianus & ulnaris',
'Hyperrefleksi kan indikere øvre motorneuronlesjon. Hyporefleksi kan indikere nedre motorneuronlesjon',
'NO', true, 4),

('Neurological', 'Reflexes', 'Patellar Reflex', 'Patella',
'L4 nervus femoralis',
'Hyperrefleksi kan indikere øvre motorneuronlesjon. Hyporefleksi kan indikere nedre motorneuronlesjon',
'NO', true, 5),

('Neurological', 'Reflexes', 'Medial Hamstring Reflex', 'Mediale hamstring',
'L5 nervus tibialis',
'Hyperrefleksi kan indikere øvre motorneuronlesjon. Hyporefleksi kan indikere nedre motorneuronlesjon',
'NO', true, 6),

('Neurological', 'Reflexes', 'Achilles Reflex', 'Akillesrefleks',
'S1 nervus tibialis',
'Hyperrefleksi kan indikere øvre motorneuronlesjon. Hyporefleksi kan indikere nedre motorneuronlesjon',
'NO', true, 7),

('Neurological', 'Reflexes', 'Plantar Reflex', 'Plantarrefleks',
'Babinski tegn',
'Stortåen bøyes nedover (normal). Invertert plantarrefleks er patologisk funn. Kan framkalles inntil 18 måneders alder',
'NO', true, 8),

('Neurological', 'Reflexes', 'Abdominal Reflex', 'Abdominalrefleks',
'Test abdominalrefleks',
'Fraværende refleks kan indikere nevrologisk patologi',
'NO', true, 9),

('Neurological', 'Reflexes', 'Hoffman Test', 'Fingerrefleks (Hoffman test)',
'Test for cervikal myelopati',
'Positiv test indikerer cervikal myelopati',
'NO', true, 10),

('Neurological', 'Reflexes', 'Clonus', 'Klonus Ø.E/U.E',
'Test for clonus',
'Normalt: Ø.E = 0 slag, U.E = 2 slag. Mer enn dette kan indikere øvre motorneuronlesjon',
'NO', true, 11),

('Neurological', 'Reflexes', 'Grasp Reflex', 'Gripe refleks',
'Primitiv refleks',
'Sees i spedbarn 3-4 måneder gammel',
'NO', true, 12);

-- ============================================================================
-- NEUROLOGICAL - Sensibility Testing
-- ============================================================================

INSERT INTO examination_protocols (body_region, category, test_name, test_name_no, description_no, positive_indication_no, language, is_system, display_order) VALUES

('Neurological', 'Sensibility', 'Pin Prick & Light Touch', 'Stikk & berøring',
'Kartlegging av sensibilitetstap',
'Potensielle ulikheter mellom smerte- og temperaturbaner versus generelle sensibilitetsbaner',
'NO', true, 1),

('Neurological', 'Sensibility', 'Vibration', 'Vibrasjon',
'Test vibrasjonssans',
'Tidlig tegn; demyeliniserende sykdom og perifer nevropati',
'NO', true, 2),

('Neurological', 'Sensibility', 'Passive Joint Position', 'Passiv ledd posisjon (Ø.E & U.E)',
'Test propriosepsjon',
'Nedsatt posisjonssans kan indikere nevrologisk patologi',
'NO', true, 3),

('Neurological', 'Sensibility', 'Touch Localization', 'Berøringslokalisering',
'Test evne til å lokalisere berøring',
'Nedsatt evne kan indikere kortikal lesjon',
'NO', true, 4),

('Neurological', 'Sensibility', 'Stereognosis', 'Stereognosis',
'Evnen til å gjenkjenne objekter plassert i håndflaten',
'Nedsatt stereognosis kan indikere kortikal lesjon',
'NO', true, 5),

('Neurological', 'Sensibility', 'Graphesthesia', 'Graphesthesia',
'Evnen til å gjenkjenne nummer/bokstaver skrevet i håndflaten',
'Nedsatt graphesthesia kan indikere kortikal lesjon',
'NO', true, 6),

('Neurological', 'Sensibility', 'Barognosis', 'Barognosis',
'Differensiering av vekt lagt i håndflaten',
'Nedsatt barognosis kan indikere kortikal lesjon',
'NO', true, 7);

-- ============================================================================
-- NEUROLOGICAL - Muscle Tone
-- ============================================================================

INSERT INTO examination_protocols (body_region, category, test_name, test_name_no, description_no, positive_indication_no, language, is_system, display_order) VALUES

('Neurological', 'Muscle_Tone', 'Upper Extremity Tone', 'Øvre ekstremitet (Ø.E)',
'Test muskeltonus i overekstremitet',
'Økt tonus: Spastisitet (clasp knife - ØMNL) eller Rigiditet (cog wheel/lead pipe - Parkinson)',
'NO', true, 1),

('Neurological', 'Muscle_Tone', 'Elbow Flexion/Extension', 'Albue fleksjon/ekstensjon',
'Test tonus i albue',
'Spastisitet eller rigiditet',
'NO', true, 2),

('Neurological', 'Muscle_Tone', 'Pronation/Supination', 'Pronasjon/supinasjon',
'Test tonus i underarm',
'Spastisitet eller rigiditet',
'NO', true, 3),

('Neurological', 'Muscle_Tone', 'Wrist Flexion/Extension', 'Håndleddfleksjon/ekstensjon',
'Test tonus i håndledd',
'Spastisitet eller rigiditet',
'NO', true, 4),

('Neurological', 'Muscle_Tone', 'Lower Extremity Tone', 'Under ekstremitet (U.E)',
'Test muskeltonus i underekstremitet',
'Økt tonus kan indikere øvre motorneuronlesjon',
'NO', true, 5),

('Neurological', 'Muscle_Tone', 'Leg Rolling', 'Legg rulling',
'Test tonus i ben',
'Økt motstand kan indikere spastisitet',
'NO', true, 6),

('Neurological', 'Muscle_Tone', 'Knee Lift', 'Kne løft',
'Test tonus i hofte/kne',
'Økt motstand kan indikere spastisitet',
'NO', true, 7),

('Neurological', 'Muscle_Tone', 'Passive Knee Flexion', 'Passiv kne fleksjon',
'Test tonus i kne',
'Økt motstand kan indikere spastisitet',
'NO', true, 8);

-- ============================================================================
-- NEUROLOGICAL - Coordination
-- ============================================================================

INSERT INTO examination_protocols (body_region, category, test_name, test_name_no, description_no, positive_indication_no, language, is_system, display_order) VALUES

('Neurological', 'Coordination', 'Normal Gait', 'Normal gange',
'Observer normal gange',
'Lengde og bredde på steg, høye trinn, Trendelenburg, instabilitet, fotsmell',
'NO', true, 1),

('Neurological', 'Coordination', 'Tandem Gait', 'Tandem gange',
'Test for cerebellar ataksi',
'Ustabilitet, avvik fra rett linje',
'NO', true, 2),

('Neurological', 'Coordination', 'Standing Balance Test', 'Stående balansetest med utstrakte armer',
'Test for pronator drift',
'Cerebellar ataksi = pose svai',
'NO', true, 3),

('Neurological', 'Coordination', 'Finger to Nose', 'Nese - finger',
'Test for in-koordinasjon (dysmetri)',
'Tremor, dysmetri (avstand til mål over/undervurderes)',
'NO', true, 4),

('Neurological', 'Coordination', 'Finger-Nose-Finger', 'Nese - finger - nese',
'Test for nøyaktighet og tremor',
'Dysmetri, tremor, dysdiadokokinese',
'NO', true, 5),

('Neurological', 'Coordination', 'Rapid Alternating Movements', 'Raske gjentatte bevegelser',
'Test for dysdiadokokinese',
'Nedsatt evne til å utføre raske alternerende bevegelser',
'NO', true, 6),

('Neurological', 'Coordination', 'Rapid Pronation-Supination', 'Rask pronasjon-supinasjon av hender',
'Test for dysdiadokokinese',
'Observer rytme, hastighet og nøyaktighet',
'NO', true, 7),

('Neurological', 'Coordination', 'Fine Motor Fingers', 'Fin motorikk fingre',
'Test for fin motorikk',
'Observer rytme, hastighet og nøyaktighet',
'NO', true, 8),

('Neurological', 'Coordination', 'Rapid Alternating Movements LE', 'Raske gjentatte bevegelser',
'Test for dysdiadokokinese i underekstremitet',
'Nedsatt evne til å utføre raske alternerende bevegelser',
'NO', true, 9),

('Neurological', 'Coordination', 'Heel to Shin', 'Hæl til legg',
'Test for koordinasjon',
'Observer nøyaktighet, glatthet og tegn til tremor',
'NO', true, 10);

-- ============================================================================
-- NEUROLOGICAL - Muscle Strength (Myotomes)
-- ============================================================================

INSERT INTO examination_protocols (body_region, category, test_name, test_name_no, description_no, positive_indication_no, language, is_system, display_order) VALUES

('Neurological', 'Muscle_Strength', 'Rhomboids', 'M. romboides',
'C5/C6 – nervus axillaris',
'Svakhet kan indikere C5/C6 radikulopati',
'NO', true, 1),

('Neurological', 'Muscle_Strength', 'Biceps Brachii', 'M. biceps brachii',
'C5/C6 - nervus musculocutanous',
'Svakhet kan indikere C5/C6 radikulopati',
'NO', true, 2),

('Neurological', 'Muscle_Strength', 'Brachioradialis', 'M. brachioradialis',
'C5/C6 – nervus radialis',
'Svakhet kan indikere C5/C6 radikulopati',
'NO', true, 3),

('Neurological', 'Muscle_Strength', 'Triceps Brachii', 'M. triceps brachii',
'C7 – nervus radialis',
'Svakhet kan indikere C7 radikulopati',
'NO', true, 4),

('Neurological', 'Muscle_Strength', 'Wrist Flexors', 'Håndleddsbøyere',
'C7 – nervus medianus & ulnaris',
'Svakhet kan indikere C7 radikulopati',
'NO', true, 5),

('Neurological', 'Muscle_Strength', 'Wrist Extensors', 'Håndleddsstrekkere',
'C7 – nervus radialis',
'Svakhet kan indikere C7 radikulopati',
'NO', true, 6),

('Neurological', 'Muscle_Strength', 'Finger Flexors', 'Fingerbøyerne',
'C8 – nervus medianus & ulnaris',
'Svakhet kan indikere C8 radikulopati',
'NO', true, 7),

('Neurological', 'Muscle_Strength', 'Finger Extensors', 'Fingerstrekkerne',
'C7 - nervus ulnaris',
'Svakhet kan indikere C7 radikulopati',
'NO', true, 8),

('Neurological', 'Muscle_Strength', 'Interossei', 'Musculi interossei',
'T1 - nervus ulnaris',
'Svakhet kan indikere T1 radikulopati',
'NO', true, 9),

('Neurological', 'Muscle_Strength', 'Abdominals', 'Abdomen',
'T7-T11 – thorakoadominal',
'Svakhet kan indikere thorakal radikulopati',
'NO', true, 10),

('Neurological', 'Muscle_Strength', 'Iliopsoas', 'M. iliopsoas',
'L2/3 – ramus anterior & nervus femoralis',
'Svakhet kan indikere L2/L3 radikulopati',
'NO', true, 11),

('Neurological', 'Muscle_Strength', 'Hip Flexors', 'Hofteleddsbøyerne',
'L5/S1 – nervus ischiadicus',
'Svakhet kan indikere L5/S1 radikulopati',
'NO', true, 12),

('Neurological', 'Muscle_Strength', 'Hip Extensors', 'Hofteleddsstrekkerne',
'L3/4 – nervus peroneus',
'Svakhet kan indikere L3/L4 radikulopati',
'NO', true, 13),

('Neurological', 'Muscle_Strength', 'Ankle Dorsiflexion + Inversion', 'Ankel dorsalfleksjon + inversjon',
'L5 – nervus peroneus',
'Svakhet kan indikere L5 radikulopati',
'NO', true, 14),

('Neurological', 'Muscle_Strength', 'Extensor Hallucis Longus', 'M. extensor hallucis longus',
'L5 – nervus peroneus',
'Svakhet kan indikere L5 radikulopati',
'NO', true, 15),

('Neurological', 'Muscle_Strength', 'Ankle Plantarflexion + Eversion', 'Ankel plantarfleksjon + eversjon',
'S1 – nervus tibialis',
'Svakhet kan indikere S1 radikulopati',
'NO', true, 16),

('Neurological', 'Muscle_Strength', 'Pronator Drift', 'Pronator Drift',
'Test for pyramidal svakhet',
'Den svake armen pronerer gradvis og driver nedover - nedsatt funksjon kortikospinale nervebaner kontralaterale hjernehalvdel (øvre motorneuronlesjon)',
'NO', true, 17);

-- ============================================================================
-- INTERNAL MEDICINE - Abdominal Examination
-- ============================================================================

INSERT INTO examination_protocols (body_region, category, test_name, test_name_no, description_no, positive_indication_no, language, is_system, display_order) VALUES

('Abdomen', 'Observation', 'General Inspection', 'Inspeksjon Generelt',
'Observer ernæringsstatus og farge',
'Ernæringsstatus, farge',
'NO', true, 1),

('Abdomen', 'Observation', 'Face Inspection', 'Ansikt',
'Observer for anemi og gulsott',
'Anemi (blekere farge i konjunktiva og under tunge, glossit, angulær cheilitt). Gulsott (i sklera)',
'NO', true, 2),

('Abdomen', 'Observation', 'Hands Inspection', 'Hender',
'Observer for anemi og leversykdom',
'Anemi (negler - koilonychia, trommestikkfingre/clubbing). Leversykdom: Erytema/røde håndflater',
'NO', true, 3),

('Abdomen', 'Observation', 'Chest Inspection', 'Bryst',
'Observer for leversykdom tegn',
'5 Spider nevi, gynekomastia',
'NO', true, 4),

('Abdomen', 'Observation', 'Abdomen Inspection', 'Abdomen',
'Observer for arr og distensjon',
'Arr, Abdominal distensjon (5 F\'er: Flatus, fetus, feces, fluid, fat)',
'NO', true, 5),

('Abdomen', 'Palpation', 'Abdominal Aorta', 'Aorta (Bukaorta)',
'Sjekk for AAA',
'AAA - Abdominalt aortaaneurisme. Start vidt, 10 cm over navle og palper innover, føl etter ekspansiv pulserende følelse',
'NO', true, 6),

('Abdomen', 'Palpation', 'Light Palpation', 'Lett palpasjon',
'Palper 9 regioner',
'Palpasjonsøm eller tegn til "guarding"',
'NO', true, 7),

('Abdomen', 'Palpation', 'Deep Palpation', 'Dyp palpasjon',
'Observer fjeset til pasient',
'Tegn til splenomegali, hydronefrose',
'NO', true, 8),

('Abdomen', 'Special_Tests', 'Murphy Sign', 'Murphy´s',
'Test for kolecystitt',
'Kolecystitt',
'NO', true, 9),

('Abdomen', 'Percussion', 'Abdominal Percussion', 'Perkusjon',
'Test for ascites',
'Abdominal distensjon: Hvis magen er utvidet, se etter væske. Test for ascites (skiftende dempning)',
'NO', true, 10),

('Abdomen', 'Palpation', 'Regional Lymph Nodes', 'Regionale lymfeknuter',
'Palper supraklavikulære fossa',
'Virchow´s triade - Forandringer i blodets sammensetning, endotelskade og redusert eller endret blodstrøm',
'NO', true, 11),

('Abdomen', 'Auscultation', 'Bowel Sounds', 'Auskultasjon - Tarmlyder',
'Vurder hyppighet og karakter',
'Livlige tarmlyder er ofte hørt ved diaré, mens trege eller fraværende tarmlyder ofte er forstoppelse',
'NO', true, 12);

-- ============================================================================
-- INTERNAL MEDICINE - Cardiovascular Examination
-- ============================================================================

INSERT INTO examination_protocols (body_region, category, test_name, test_name_no, description_no, positive_indication_no, language, is_system, display_order) VALUES

('Cardiovascular', 'Observation', 'General Inspection', 'Inspeksjon Generelt',
'Observer kortpustethet og farge',
'Kortpustethet, farge',
'NO', true, 1),

('Cardiovascular', 'Observation', 'Face Inspection', 'Ansikt',
'Observer for anemi, hyperlipidemi, cyanose',
'Anemi (blekere farge i konjunktiva og under tunge, glossit, angulær cheilitt). Hyperlipidemi (Xantelasme, arcus senilis). Sentral Cyanose (lepper og undersiden av tunga)',
'NO', true, 2),

('Cardiovascular', 'Observation', 'Hands Inspection', 'Hender',
'Observer for anemi, cyanose, hyperlipidemi',
'Anemi (håndflate linjer, koilonychia, clubbing), Perifer Cyanose (fingre), Hyperlipidemi (Xantomer)',
'NO', true, 3),

('Cardiovascular', 'Observation', 'Chest Inspection', 'Bryst',
'Observer for arr',
'Arr',
'NO', true, 4),

('Cardiovascular', 'Palpation', 'Mediastinal Shift', 'Mediastenalt skift',
'Sjekk om luftrøret er sentralt',
'Er luftrøret sentralt? Sjekk "Apex beat" (mellom 5. og 6. ribbein, midtklavikulære linje)',
'NO', true, 5),

('Cardiovascular', 'Palpation', 'Pulse', 'Puls',
'Måler puls hastighet og rytme',
'Hastighet og rytme i radial (Carotis, Brakial, Radialis, Bukaorta, Femoralis, Poplitea, Dorsalis Pedis, Tibialis posterior)',
'NO', true, 6),

('Cardiovascular', 'Palpation', 'Aorta', 'Aorta',
'Palper bukaorta for AAA',
'AAA',
'NO', true, 7),

('Cardiovascular', 'Palpation', 'Peripheral Edema', 'Perifert ødem',
'Sjekk for ødem',
'Claudicatio intermittens',
'NO', true, 8),

('Cardiovascular', 'Measurement', 'Blood Pressure', 'Blodtrykk',
'Måler blodtrykk',
'Hypertensjon eller hypotensjon',
'NO', true, 9),

('Cardiovascular', 'Auscultation', 'Heart Auscultation', 'Auskultasjon - Hjerte',
'Lytt til hjertelyder',
'Aortaklaffen, Pulmonalklaffen, Trikuspidalklaffen, mitralklaffen. Palper over carotis samtidig',
'NO', true, 10),

('Cardiovascular', 'Auscultation', 'Vascular Bruits', 'Hjertelyder ("bruits")',
'Lytt etter stenoselyder',
'Carotis, Femoralis, Bukaorta. Lytt etter stenoselyder',
'NO', true, 11),

('Cardiovascular', 'Auscultation', 'Lung Bases', 'Lungebaser (T10-12)',
'Lytt til lungebaser',
'Knatrelyd',
'NO', true, 12);

-- ============================================================================
-- INTERNAL MEDICINE - Respiratory Examination
-- ============================================================================

INSERT INTO examination_protocols (body_region, category, test_name, test_name_no, description_no, positive_indication_no, language, is_system, display_order) VALUES

('Respiratory', 'Observation', 'General Inspection', 'Inspeksjon Generelt',
'Observer kortpustethet, farge, hoste',
'Kortpustethet, farge, hoste, hvesing, stridor',
'NO', true, 1),

('Respiratory', 'Observation', 'Face Inspection', 'Ansikt',
'Observer for anemi, cyanose, Horner syndrom',
'Anemi (blekere farge i konjunktiva og under tunge, glossit, angulær cheilitt). Sentral Cyanose (lepper og undersiden av tunga), Horner´s syndrom (ensidig ptose, miose, hemifacial anihidrose, enophthalmus)',
'NO', true, 2),

('Respiratory', 'Observation', 'Hands Inspection', 'Hender',
'Observer for anemi, cyanose, clubbing',
'Anemi (håndflate linjer, negler - koilonychia, trommestikkfingre/clubbing), Perifer Cyanose (fingre), gule negler (nikotin)',
'NO', true, 3),

('Respiratory', 'Observation', 'Chest Inspection', 'Bryst',
'Observer arr, form, respirasjonsfrekvens',
'Arr, form, respirasjonsfrekvens',
'NO', true, 4),

('Respiratory', 'Measurement', 'Temperature', 'Temperatur',
'Måler temperatur',
'Feber?',
'NO', true, 5),

('Respiratory', 'Palpation', 'Thyroid Gland', 'Skjoldbruskkjertelen',
'Observer, palper, svelg',
'Dersom det er hevelse på skjoldbruskkjertelen, vil den bevege seg ved svelging',
'NO', true, 6),

('Respiratory', 'Palpation', 'Regional Lymph Nodes', 'Regionale lymfeknuter',
'Palper lymfeknuter',
'Palper etter lymfeknuter på hals, supraklavikulært, infraklavikulært og i aksillene',
'NO', true, 7),

('Respiratory', 'Palpation', 'Mediastinal Shift', 'Mediastenalt skift',
'Sjekk om luftrøret er sentralt',
'Er luftrøret sentralt? Sjekk "Apex beat" (mellom 5. og 6. ribbein, midtklavikulære linje)',
'NO', true, 8),

('Respiratory', 'Palpation', 'Chest Expansion', 'Bryst ekspansjon',
'Måler brystekspansjon',
'Lateral (nedre ribbein, tomler over brystrygg), A-P (over kragebein)',
'NO', true, 9),

('Respiratory', 'Percussion', 'Lung Percussion', 'Perkusjon',
'Perkuter systematisk på lunge',
'For resonans: Kragebein, lungebaser (T10-12), Bryst (<T6), Side (<T8), Rygg (<T12). Perkusjonslyd: Sonor (normal). Økt resonans/Hypersonor (Pneumotoraks/KOLS/Astma/Emfysem). Nedsatt resonans/dempning (pneumoni, atelektase, tumor, pleuravæske)',
'NO', true, 10),

('Respiratory', 'Auscultation', 'Lung Auscultation', 'Auskultasjon - Pustelyder',
'Askulter systematisk lungeflatene',
'Supraklavikulære fossa, lungebaser (T10-12), Bryst (<T6), Side (<T8), Rygg (<T12). Lyder: knatrelyd (pneumoni/KOLS/hjertesvikt), pipelyd (astma/KOLS/slimplager), gnidningslyder (pleuritt)',
'NO', true, 11);

-- ============================================================================
-- SPECIALIZED - Headache Examination
-- ============================================================================

INSERT INTO examination_protocols (body_region, category, test_name, test_name_no, description_no, positive_indication_no, language, is_system, display_order, is_red_flag, red_flag_criteria) VALUES

('Headache', 'Gait', 'Gait Analysis', 'Gange',
'Observer for avvergeholdning',
'Tegn til avvergeholdning',
'NO', true, 1, false, null),

('Headache', 'Observation', 'Posture & Romberg', 'Holdning + Romberg',
'Observer etter tegn til svaiende holdning',
'Svaiende holdning',
'NO', true, 2, false, null),

('Headache', 'Observation', 'Posture', 'Positur',
'Observer hodepositur',
'Overdreven fremoverlent hodepositur',
'NO', true, 3, false, null),

('Headache', 'Measurement', 'Temperature & Blood Pressure', 'Temperatur og blodtrykk',
'Måler temperatur og blodtrykk',
'Temperatur over 37.5 kan øke mistanke for infeksjonsutløst årsak. Blodtrykk ≥180/110 = hypertensiv krise',
'NO', true, 4, true, 'Temperatur >37.5°C eller BT ≥180/110'),

('Headache', 'Observation', 'Skin Inspection', 'Observasjon',
'Kartlegg tegn til utslett',
'Ved funn øker mistanke for meningitt',
'NO', true, 5, true, 'Utslett kan indikere meningitt'),

('Headache', 'Cranial_Nerves', 'Cranial Nerve Examination', 'Hjerne nerve utredning',
'Test hjernenerver',
'Tegn til ptose, anisokori, pupille respons, nærstillingsrespons, følgebevegelser øyne',
'NO', true, 6, true, 'Cranial nerve defects kan indikere intrakranial patologi'),

('Headache', 'Ophthalmology', 'Fundoscopy', 'Fundoskopi',
'Undersøk fundus',
'Tegn til papilleødem, diabetes, infeksjon',
'NO', true, 7, true, 'Papilleødem kan indikere økt intrakranialt trykk'),

('Headache', 'TMJ', 'Temporomandibular Joint Exam', 'Tempomandibulær ledd undersøkelse',
'Undersøk TMJ',
'Observasjon og palpasjon, åpning/lukking, AROM & PROM, palpasjon av relevante muskler for myalgi',
'NO', true, 8, false, null),

('Headache', 'ENT', 'Otoscopy', 'Otoskopi',
'Undersøk trommehinnen',
'Sykdommer i trommehinnen. Rød trommehinne kan indikere infeksjon',
'NO', true, 9, false, null),

('Headache', 'Cervical', 'Cervical Spine Examination', 'Cervikalcolumna',
'Undersøk cervikalcolumna',
'Palpasjon, ROM, end feel, maksimum kompresjon, distraksjon',
'NO', true, 10, false, null),

('Headache', 'Palpation', 'Palpation', 'Palpasjon',
'Palper relevante strukturer',
'Lymfeknuter, skalleømhet, a. temporalis, bihuler',
'NO', true, 11, true, 'Temporal artery tenderness kan indikere temporal arteritt'),

('Headache', 'Neurological', 'UE Reflexes & Strength', 'Dype sene reflekser og styrke Ø.E',
'Test reflekser og styrke i overekstremitet',
'Pyramidal svakhet?',
'NO', true, 12, true, 'Fokale nevrologiske funn'),

('Headache', 'Neurological', 'LE Reflexes & Strength', 'Dype sene reflekser og styrke U.E',
'Test reflekser og styrke i underekstremitet',
'Pyramidal svakhet? Husk plantarrefleks',
'NO', true, 13, true, 'Fokale nevrologiske funn'),

('Headache', 'Special_Tests', 'Nuchal Rigidity', 'Nuchal rigidity',
'Test for meningeal irritasjon',
'Hjernehinnebetennelse. Kernig´s: Motstand mot passiv ekstensjon av kne i 90/90. Brudzinski´s: Passiv nakke fleksjon forårsaker fleksjon i hofte/kne',
'NO', true, 14, true, 'Meningeal irritasjon kan indikere meningitt/subaraknoidal blødning');

-- ============================================================================
-- SPECIALIZED - Dizziness/Vertigo Examination
-- ============================================================================

INSERT INTO examination_protocols (body_region, category, test_name, test_name_no, description_no, positive_indication_no, language, is_system, display_order, is_red_flag, red_flag_criteria) VALUES

('Dizziness', 'History', 'Vertigo Characterization', 'Karakter',
'Kartlegg type svimmelhet',
'Gyratorisk vertigo ("karusell svimmelhet" - vær obs på spontan nystagmus - DDx: BPPV, vestibularisnevritt, hjerneblødning/cerebellar lesjon), nautisk svimmelhet ("båtdekk svimmelhet" - nakke/hode/muskel og skjelettplager), landgangesyndrom (Mal de Debarquement Syndrom), nærsynkope',
'NO', true, 1, true, 'Akutt vertigo med fokale nevrologiske tegn kan indikere stroke'),

('Dizziness', 'Measurement', 'Blood Pressure & Vitals', 'Blodtrykk + annet vitalia',
'Måler blodtrykk og vitalia',
'Normalt blodtrykk: <130/<85 mm/Hg. Høyt normalt: 130-139/85-89 mm/Hg. Mild hypertensjon: 140-159/90-99 mm/Hg. Moderat: 160-179/100-109 mm/Hg. Alvorlig: >180/<110',
'NO', true, 2, false, null),

('Dizziness', 'Gait', 'Gait & Romberg', 'Gange: Romberg test',
'Test balanse og koordinasjon',
'Romberg test, stående balansetest med utstrakte armer (pronator drift)',
'NO', true, 3, false, null),

('Dizziness', 'Observation', 'Spontaneous Nystagmus', 'Observer etter spontan nystagmus',
'Observer for nystagmus',
'Spontan nystagmus, potensielt utfør "nei-nei" test',
'NO', true, 4, false, null),

('Dizziness', 'Special_Tests', 'Head Impulse Test', 'Hodeimpulstest',
'Test for vestibulær funksjon',
'Positiv test kan indikere vestibulær patologi',
'NO', true, 5, true, 'Negativ head impulse test med vertigo kan indikere sentralt problem (stroke)'),

('Dizziness', 'Special_Tests', 'Cover Test', 'Avdekkingstest/test for vertikal blikkdeviasjon',
'Test for vertikal blikkdeviasjon',
'Vertikal diplopi',
'NO', true, 6, true, 'Vertikal diplopi kan indikere stroke'),

('Dizziness', 'Observation', 'Nystagmus Evaluation', 'Nystagmus',
'Evaluer nystagmus',
'Retning og type av nystagmus',
'NO', true, 7, true, 'Nystagmus som endrer retning ved sideblikk kan indikere stroke'),

('Dizziness', 'Special_Tests', 'Hyperventilation Test', 'Hyperventilasjon test',
'Test for hyperventilasjon syndrom',
'Reproduksjon av symptomer',
'NO', true, 8, false, null),

('Dizziness', 'Coordination', 'Finger-Nose-Finger', 'Finger-nese-finger test',
'Test for cerebellar funksjon',
'Raske gjentatte, pronasjon-supinasjon bevegelser for tegn til Dysdiadokokinese',
'NO', true, 9, true, 'Cerebellar tegn kan indikere stroke'),

('Dizziness', 'Sensibility', 'Vibration Sense', 'Sensibilitet test for vibrasjonssans',
'Test vibrasjonssans',
'Nedsatt vibrasjonssans',
'NO', true, 10, false, null),

('Dizziness', 'Neurological', 'Muscle Strength & Sensibility', 'Muskelstyrke, sensibilitet, dype sene reflekser',
'Nevrologisk undersøkelse',
'Fokale nevrologiske funn',
'NO', true, 11, true, 'Fokale nevrologiske funn med vertigo kan indikere stroke'),

('Dizziness', 'Neurological', 'Joint Position Sense', 'Ledd posisjon sensibilitet',
'Test propriosepsjon',
'Nedsatt propriosepsjon',
'NO', true, 12, false, null),

('Dizziness', 'Cranial_Nerves', 'Cranial Nerves', 'Hjernenerver',
'Undersøk hjernenerver',
'Cranial nerve defects',
'NO', true, 13, true, 'Cranial nerve defects med vertigo kan indikere stroke');

-- ============================================================================
-- END OF EXAMINATION PROTOCOLS
-- ============================================================================
