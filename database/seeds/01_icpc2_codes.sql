-- ICPC-2 Diagnosis Codes for Chiropractic Practice
-- Focused on L (Musculoskeletal) and N (Neurological) chapters
-- These are the most commonly used codes in Norwegian chiropractic practice

-- L Chapter: Musculoskeletal System
INSERT INTO diagnosis_codes (system, code, chapter, description_no, description_en, commonly_used, usage_count) VALUES
('ICPC2', 'L01', 'L', 'Nakke symptom/plage', 'Neck symptom/complaint', true, 150),
('ICPC2', 'L02', 'L', 'Rygg symptom/plage', 'Back symptom/complaint', true, 200),
('ICPC2', 'L03', 'L', 'Korsrygg symptom/plage', 'Low back symptom/complaint', true, 300),
('ICPC2', 'L04', 'L', 'Bryst symptom/plage', 'Chest symptom/complaint', true, 80),
('ICPC2', 'L05', 'L', 'Flanke/rygg symptom/plage', 'Flank/lower back symptom/complaint', true, 90),
('ICPC2', 'L08', 'L', 'Skulder symptom/plage', 'Shoulder symptom/complaint', true, 120),
('ICPC2', 'L09', 'L', 'Arm symptom/plage', 'Arm symptom/complaint', true, 70),
('ICPC2', 'L10', 'L', 'Albue symptom/plage', 'Elbow symptom/complaint', true, 50),
('ICPC2', 'L11', 'L', 'Håndledd symptom/plage', 'Wrist symptom/complaint', true, 60),
('ICPC2', 'L12', 'L', 'Hånd/finger symptom/plage', 'Hand/finger symptom/complaint', true, 40),
('ICPC2', 'L13', 'L', 'Hofte symptom/plage', 'Hip symptom/complaint', true, 90),
('ICPC2', 'L14', 'L', 'Lår/bein symptom/plage', 'Leg symptom/complaint', true, 80),
('ICPC2', 'L15', 'L', 'Kne symptom/plage', 'Knee symptom/complaint', true, 100),
('ICPC2', 'L16', 'L', 'Ankel symptom/plage', 'Ankle symptom/complaint', true, 70),
('ICPC2', 'L17', 'L', 'Fot/tå symptom/plage', 'Foot/toe symptom/complaint', true, 60),
('ICPC2', 'L18', 'L', 'Muskelsmerte', 'Muscle pain', true, 110),
('ICPC2', 'L19', 'L', 'Muskel symptom/plage IKA', 'Muscle symptom/complaint NOS', true, 50),
('ICPC2', 'L20', 'L', 'Leddssymptom/plage IKA', 'Joint symptom/complaint NOS', true, 90),

-- Specific L diagnoses
('ICPC2', 'L83', 'L', 'Nakke syndrom', 'Neck syndrome', true, 180),
('ICPC2', 'L84', 'L', 'Rygg syndrom uten strålesmerter', 'Back syndrome without radiation', true, 150),
('ICPC2', 'L86', 'L', 'Rygg syndrom med strålesmerter', 'Back syndrome with radiation', true, 200),
('ICPC2', 'L87', 'L', 'Bursitt/tendinitt/synovitt IKA', 'Bursitis/tendinitis/synovitis NOS', true, 70),
('ICPC2', 'L88', 'L', 'Revmatoid/seropositivt artritt', 'Rheumatoid/seropositive arthritis', false, 10),
('ICPC2', 'L89', 'L', 'Hofteartrose', 'Osteoarthritis of hip', false, 15),
('ICPC2', 'L90', 'L', 'Kneartrose', 'Osteoarthritis of knee', false, 20),
('ICPC2', 'L91', 'L', 'Artrose IKA', 'Osteoarthritis NOS', true, 40),
('ICPC2', 'L92', 'L', 'Skulder syndrom', 'Shoulder syndrome', true, 140),
('ICPC2', 'L93', 'L', 'Albuesyndom (tennis/golf)', 'Tennis/golfer''s elbow', true, 60),
('ICPC2', 'L94', 'L', 'Osteokondrose', 'Osteochondrosis', false, 25),
('ICPC2', 'L95', 'L', 'Osteoporose', 'Osteoporosis', false, 20),
('ICPC2', 'L96', 'L', 'Akutt indre skade i kne', 'Acute internal derangement of knee', true, 45),
('ICPC2', 'L97', 'L', 'Kronisk indre skade i kne', 'Chronic internal derangement of knee', false, 30),
('ICPC2', 'L98', 'L', 'Ervervet deformitet', 'Acquired deformity', false, 15),
('ICPC2', 'L99', 'L', 'Muskelskjelettsykdom IKA', 'Musculoskeletal disease NOS', true, 50),

-- N Chapter: Neurological System
INSERT INTO diagnosis_codes (system, code, chapter, description_no, description_en, commonly_used, usage_count) VALUES
('ICPC2', 'N01', 'N', 'Hodepine', 'Headache', true, 130),
('ICPC2', 'N03', 'N', 'Ansiktssmerter', 'Face pain', true, 40),
('ICPC2', 'N04', 'N', 'Rastløse bein', 'Restless legs', false, 20),
('ICPC2', 'N05', 'N', 'Kribling i hender/føtter', 'Tingling fingers/feet', true, 90),
('ICPC2', 'N06', 'N', 'Annen unormal følelse', 'Other sensation disturbance', true, 60),
('ICPC2', 'N07', 'N', 'Kramper/spasmer', 'Convulsion/seizure', false, 15),
('ICPC2', 'N17', 'N', 'Svimmelhet/vertigo', 'Vertigo/dizziness', true, 70),
('ICPC2', 'N18', 'N', 'Lammelse/svakhet', 'Paralysis/weakness', true, 40),
('ICPC2', 'N19', 'N', 'Tale forstyrrelse', 'Speech disorder', false, 10),

-- Specific N diagnoses
('ICPC2', 'N89', 'N', 'Migrene', 'Migraine', true, 80),
('ICPC2', 'N90', 'N', 'Cluster hodepine', 'Cluster headache', false, 10),
('ICPC2', 'N91', 'N', 'Ansiktsneuralgi/trigeminusnevralgi', 'Facial neuralgia/trigeminal neuralgia', false, 15),
('ICPC2', 'N92', 'N', 'Trigeminusnevralgi', 'Trigeminal neuralgia', false, 12),
('ICPC2', 'N93', 'N', 'Karpaltunnelsyndrom', 'Carpal tunnel syndrome', true, 55),
('ICPC2', 'N94', 'N', 'Perifere nerveskader', 'Peripheral nerve damage', true, 50),
('ICPC2', 'N95', 'N', 'Spenningshodepine', 'Tension headache', true, 120),
('ICPC2', 'N99', 'N', 'Nevrologisk sykdom IKA', 'Neurological disease NOS', true, 30);

-- ICD-10 mappings for common chiropractic conditions
INSERT INTO diagnosis_codes (system, code, chapter, description_no, description_en, icpc2_mapping, commonly_used, usage_count) VALUES
('ICD10', 'M54.2', 'M', 'Cervikalgi (nakkesmerter)', 'Cervicalgia', 'L01,L83', true, 150),
('ICD10', 'M54.5', 'M', 'Korsryggssmerter', 'Low back pain', 'L03,L86', true, 300),
('ICD10', 'M54.4', 'M', 'Lumbago med isjias', 'Lumbago with sciatica', 'L86', true, 200),
('ICD10', 'M54.3', 'M', 'Isjias', 'Sciatica', 'L86', true, 180),
('ICD10', 'M53.0', 'M', 'Cervikocranial syndrom', 'Cervico-cranial syndrome', 'L83', true, 70),
('ICD10', 'M53.1', 'M', 'Cervikobrachial syndrom', 'Cervico-brachial syndrome', 'L83,L86', true, 80),
('ICD10', 'M75.1', 'M', 'Rotatorcuff syndrom', 'Rotator cuff syndrome', 'L92', true, 90),
('ICD10', 'M77.0', 'M', 'Medial/lateral epikondylitt', 'Medial/lateral epicondylitis', 'L93', true, 60),
('ICD10', 'M79.1', 'M', 'Myalgi', 'Myalgia', 'L18', true, 110),
('ICD10', 'M99.0', 'M', 'Segmentær og somatisk dysfunksjon', 'Segmental and somatic dysfunction', 'L84,L86', true, 200),
('ICD10', 'M99.1', 'M', 'Subluksasjonskompleks (vertebralt)', 'Subluxation complex (vertebral)', 'L84,L86', true, 150),
('ICD10', 'M99.2', 'M', 'Subluksasjon stenose nervekanalåpning', 'Subluxation stenosis of neural canal', 'L86', true, 80),
('ICD10', 'M99.3', 'M', 'Osteofyttisk stenose nervekanalåpning', 'Osseous stenosis of neural canal', 'L86', false, 40),
('ICD10', 'M99.4', 'M', 'Bindevevsstenose nervekanalåpning', 'Connective tissue stenosis of neural canal', 'L86', false, 30),
('ICD10', 'M99.5', 'M', 'Diskus intervertebr stenose nervekanalåpning', 'Intervertebral disc stenosis of neural canal', 'L86', true, 90),
('ICD10', 'M99.6', 'M', 'Stenose nervekanalåpning pga forstørret osteofytt', 'Osseous and subluxation stenosis of intervertebral foramina', 'L86', false, 50),
('ICD10', 'M99.7', 'M', 'Bindevevs- og diskusstenose nervekanalåpning', 'Connective tissue and disc stenosis of intervertebral foramina', 'L86', false, 40),
('ICD10', 'M99.8', 'M', 'Andre biomek. lesjoner', 'Other biomechanical lesions', 'L84,L86', true, 100),
('ICD10', 'M99.9', 'M', 'Biomek. lesjon uspesifisert', 'Biomechanical lesion, unspecified', 'L99', true, 80),
('ICD10', 'G44.2', 'G', 'Spenningshodepine', 'Tension-type headache', 'N95', true, 120),
('ICD10', 'G43.9', 'G', 'Migrene uspesifisert', 'Migraine, unspecified', 'N89', true, 80),
('ICD10', 'G56.0', 'G', 'Karpaltunnelsyndrom', 'Carpal tunnel syndrome', 'N93', true, 55);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_diagnosis_codes_system ON diagnosis_codes(system);
CREATE INDEX IF NOT EXISTS idx_diagnosis_codes_chapter ON diagnosis_codes(chapter);
CREATE INDEX IF NOT EXISTS idx_diagnosis_codes_commonly_used ON diagnosis_codes(commonly_used);
CREATE INDEX IF NOT EXISTS idx_diagnosis_codes_search ON diagnosis_codes USING gin(to_tsvector('norwegian', description_no || ' ' || description_en));

-- Update counts
UPDATE diagnosis_codes SET usage_count = 0 WHERE usage_count IS NULL;
