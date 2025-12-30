-- =====================================================
-- BPPV EXERCISE LIBRARY AND TREATMENT PROTOCOLS
-- =====================================================
-- Comprehensive BPPV maneuver library with YouTube video references
-- Organized by canal affected and pathology type
-- Norwegian terminology integrated
-- Created: 2025-11-22

-- =====================================================
-- 1. BPPV EXERCISE VIDEO LIBRARY
-- =====================================================

CREATE TABLE IF NOT EXISTS bppv_exercise_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_code VARCHAR(100) UNIQUE NOT NULL,
  exercise_name_no VARCHAR(200) NOT NULL,  -- Norwegian name
  exercise_name_en VARCHAR(200) NOT NULL,  -- English name
  canal_affected VARCHAR(50) NOT NULL,     -- 'posterior', 'horizontal', 'anterior', 'diagnostic'
  pathology_type VARCHAR(50),              -- 'canalithiasis', 'cupulolithiasis', NULL for diagnostic
  laterality VARCHAR(20) NOT NULL,         -- 'left', 'right', 'bilateral', 'general'
  youtube_url VARCHAR(500) NOT NULL,
  duration_per_position VARCHAR(50) NOT NULL,
  frequency_per_day INTEGER NOT NULL,
  total_repetitions_per_session INTEGER DEFAULT 1,
  clinical_indications TEXT,
  contraindications TEXT,
  patient_instructions_no TEXT,
  special_notes TEXT,
  educational_link VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for quick lookup
CREATE INDEX IF NOT EXISTS idx_bppv_exercises_canal ON bppv_exercise_videos(canal_affected);
CREATE INDEX IF NOT EXISTS idx_bppv_exercises_laterality ON bppv_exercise_videos(laterality);
CREATE INDEX IF NOT EXISTS idx_bppv_exercises_pathology ON bppv_exercise_videos(pathology_type);

-- =====================================================
-- 2. INSERT DIAGNOSTIC MANEUVERS
-- =====================================================

-- Dix-Hallpike Test
INSERT INTO bppv_exercise_videos (
  exercise_code,
  exercise_name_no,
  exercise_name_en,
  canal_affected,
  pathology_type,
  laterality,
  youtube_url,
  duration_per_position,
  frequency_per_day,
  clinical_indications,
  patient_instructions_no,
  educational_link
) VALUES (
  'DIX_HALLPIKE_TEST',
  'Dix-Hallpike Test',
  'Dix-Hallpike Test',
  'diagnostic',
  NULL,
  'bilateral',
  'https://www.youtube.com/watch?v=wgWOmuB1VFY',
  '30-60 sekunder',
  1,
  'Diagnostisk test for posterior kanal BPPV. Positiv test viser rotatorisk-vertikal nystagmus med latens 1-5 sek.',
  'Pasienten sitter på benken, legges raskt bakover med hodet hengende 30° og rotert 45° til siden. Observér for nystagmus og svimmelhet.',
  'www.theBackROM.com/education/Clickup/dix-hallpike-test'
);

-- =====================================================
-- 3. POSTERIOR CANAL BPPV - CANALITHIASIS
-- =====================================================

-- Left Epley's Maneuver
INSERT INTO bppv_exercise_videos (
  exercise_code,
  exercise_name_no,
  exercise_name_en,
  canal_affected,
  pathology_type,
  laterality,
  youtube_url,
  duration_per_position,
  frequency_per_day,
  clinical_indications,
  contraindications,
  patient_instructions_no,
  special_notes,
  educational_link
) VALUES (
  'EPLEY_LEFT',
  'Venstre Epley''s Manøver',
  'Left Epley''s Maneuver',
  'posterior',
  'canalithiasis',
  'left',
  'https://www.youtube.com/watch?v=aC7x161MHhU',
  '1 minutt i hver posisjon',
  2,
  'Venstre posterior kanal BPPV (canalithiasis). Positiv venstre Dix-Hallpike med geotorsjonell nystagmus.',
  'Nakkeproblemer, severe kyfose, carotis stenose, ustabil hjertesykdom',
  E'1. Sitt på sengen\n2. Legg deg raskt tilbake med hodet hengende 30° og rotert 45° til VENSTRE (Dix-Hallpike posisjon) - VENT 1 MINUTT\n3. Roter hodet 90° til HØYRE - VENT 1 MINUTT\n4. Rull hele kroppen til høyre side (nese mot gulvet) - VENT 1 MINUTT\n5. Sett deg sakte opp\n6. Gjenta 2 ganger daglig',
  'Effektivitet: 80-90% etter 1-3 behandlinger. Kan gi forbigående økt svimmelhet første 24-48 timer.',
  'www.theBackROM.com/education/Clickup/epley-maneuver-left'
);

-- Right Epley's Maneuver
INSERT INTO bppv_exercise_videos (
  exercise_code,
  exercise_name_no,
  exercise_name_en,
  canal_affected,
  pathology_type,
  laterality,
  youtube_url,
  duration_per_position,
  frequency_per_day,
  clinical_indications,
  contraindications,
  patient_instructions_no,
  special_notes,
  educational_link
) VALUES (
  'EPLEY_RIGHT',
  'Høyre Epley''s Manøver',
  'Right Epley''s Maneuver',
  'posterior',
  'canalithiasis',
  'right',
  'https://www.youtube.com/watch?v=SkBFlOc2fp8',
  '1 minutt i hver posisjon',
  2,
  'Høyre posterior kanal BPPV (canalithiasis). Positiv høyre Dix-Hallpike med geotorsjonell nystagmus.',
  'Nakkeproblemer, severe kyfose, carotis stenose, ustabil hjertesykdom',
  E'1. Sitt på sengen\n2. Legg deg raskt tilbake med hodet hengende 30° og rotert 45° til HØYRE (Dix-Hallpike posisjon) - VENT 1 MINUTT\n3. Roter hodet 90° til VENSTRE - VENT 1 MINUTT\n4. Rull hele kroppen til venstre side (nese mot gulvet) - VENT 1 MINUTT\n5. Sett deg sakte opp\n6. Gjenta 2 ganger daglig',
  'Effektivitet: 80-90% etter 1-3 behandlinger. Kan gi forbigående økt svimmelhet første 24-48 timer.',
  'www.theBackROM.com/education/Clickup/epley-maneuver-right'
);

-- =====================================================
-- 4. SEMONT MANEUVER (Alternative to Epley)
-- =====================================================

-- Left Semont
INSERT INTO bppv_exercise_videos (
  exercise_code,
  exercise_name_no,
  exercise_name_en,
  canal_affected,
  pathology_type,
  laterality,
  youtube_url,
  duration_per_position,
  frequency_per_day,
  clinical_indications,
  patient_instructions_no,
  special_notes,
  educational_link
) VALUES (
  'SEMONT_LEFT',
  'Venstre Semont Manøver',
  'Left Semont Maneuver',
  'posterior',
  'canalithiasis',
  'left',
  'https://www.youtube.com/watch?v=z2KUrQoZ-sU',
  '1 minutt i hver posisjon',
  2,
  'Venstre posterior kanal BPPV. Alternativ til Epley, brukes ofte når Epley ikke tolereres eller er vanskelig å utføre.',
  E'1. Sitt på sengen med bena hengende\n2. Legg deg raskt til HØYRE side med hodet rotert 45° opp mot taket - VENT 1 MINUTT\n3. Uten å endre hodeposisjon, snu RASKT til motsatt side (venstre) - VENT 1 MINUTT\n4. Sett deg sakte opp\n5. Gjenta 2 ganger daglig',
  'Krever raskere bevegelser enn Epley. Effektivitet: 70-90%. Kan være mer ubehagelig enn Epley.',
  'www.theBackROM.com/education/Clickup/semont-left'
);

-- Right Semont
INSERT INTO bppv_exercise_videos (
  exercise_code,
  exercise_name_no,
  exercise_name_en,
  canal_affected,
  pathology_type,
  laterality,
  youtube_url,
  duration_per_position,
  frequency_per_day,
  clinical_indications,
  patient_instructions_no,
  special_notes,
  educational_link
) VALUES (
  'SEMONT_RIGHT',
  'Høyre Semont Manøver',
  'Right Semont Maneuver',
  'posterior',
  'canalithiasis',
  'right',
  'https://www.youtube.com/watch?v=A72UjulJSzE',
  '1 minutt i hver posisjon',
  2,
  'Høyre posterior kanal BPPV. Alternativ til Epley, brukes ofte når Epley ikke tolereres eller er vanskelig å utføre.',
  E'1. Sitt på sengen med bena hengende\n2. Legg deg raskt til VENSTRE side med hodet rotert 45° opp mot taket - VENT 1 MINUTT\n3. Uten å endre hodeposisjon, snu RASKT til motsatt side (høyre) - VENT 1 MINUTT\n4. Sett deg sakte opp\n5. Gjenta 2 ganger daglig',
  'Krever raskere bevegelser enn Epley. Effektivitet: 70-90%. Kan være mer ubehagelig enn Epley.',
  'www.theBackROM.com/education/Clickup/semont-right'
);

-- =====================================================
-- 5. DEMI-SEMONT (Modified Semont)
-- =====================================================

-- Right Demi-Semont
INSERT INTO bppv_exercise_videos (
  exercise_code,
  exercise_name_no,
  exercise_name_en,
  canal_affected,
  pathology_type,
  laterality,
  youtube_url,
  duration_per_position,
  frequency_per_day,
  clinical_indications,
  patient_instructions_no,
  special_notes,
  educational_link
) VALUES (
  'DEMI_SEMONT_RIGHT',
  'Høyre Demi-Semont',
  'Right Demi-Semont',
  'posterior',
  'canalithiasis',
  'right',
  'https://www.youtube.com/watch?v=5q9fjBYzmGw',
  '1 minutt i hver posisjon',
  2,
  'Høyre posterior kanal BPPV. Modifisert Semont for pasienter som ikke tåler full Semont eller har mobilitetsbegrensninger.',
  E'1. Modifisert versjon av Semont manøver\n2. 1 minutt i hver posisjon\n3. Gjenta 2 ganger daglig\n4. Mildere variant for eldre eller pasienter med mobilitetsproblemer',
  'Gentler alternative to full Semont. Bedre tolerert av eldre pasienter.',
  'www.theBackROM.com/education/Clickup/demi-semont-right'
);

-- Left Demi-Semont
INSERT INTO bppv_exercise_videos (
  exercise_code,
  exercise_name_no,
  exercise_name_en,
  canal_affected,
  pathology_type,
  laterality,
  youtube_url,
  duration_per_position,
  frequency_per_day,
  clinical_indications,
  patient_instructions_no,
  special_notes,
  educational_link
) VALUES (
  'DEMI_SEMONT_LEFT',
  'Venstre Demi-Semont',
  'Left Demi-Semont',
  'posterior',
  'canalithiasis',
  'left',
  'https://www.youtube.com/watch?v=RTkJlfGE6ZQ',
  '1 minutt i hver posisjon',
  2,
  'Venstre posterior kanal BPPV. Modifisert Semont for pasienter som ikke tåler full Semont eller har mobilitetsbegrensninger.',
  E'1. Modifisert versjon av Semont manøver\n2. 1 minutt i hver posisjon\n3. Gjenta 2 ganger daglig\n4. Mildere variant for eldre eller pasienter med mobilitetsproblemer',
  'Gentler alternative to full Semont. Bedre tolerert av eldre pasienter.',
  'www.theBackROM.com/education/Clickup/demi-semont-left'
);

-- =====================================================
-- 6. HORIZONTAL CANAL BPPV - CANALITHIASIS (BBQ ROLL)
-- =====================================================

-- Left BBQ Roll
INSERT INTO bppv_exercise_videos (
  exercise_code,
  exercise_name_no,
  exercise_name_en,
  canal_affected,
  pathology_type,
  laterality,
  youtube_url,
  duration_per_position,
  frequency_per_day,
  clinical_indications,
  patient_instructions_no,
  special_notes,
  educational_link
) VALUES (
  'BBQ_ROLL_LEFT',
  'Venstre BBQ Roll',
  'Left BBQ Roll (Log Roll)',
  'horizontal',
  'canalithiasis',
  'left',
  'https://www.youtube.com/watch?v=KNBOASk7Ny8',
  '30 sekunder i hver posisjon',
  2,
  'Venstre lateral kanal BPPV (canalithiasis). Positiv Supine Roll Test med geotropisk nystagmus sterkest når hodet roteres til VENSTRE.',
  E'1. Legg deg på ryggen - VENT 30 SEKUNDER\n2. Rull 90° til HØYRE side - VENT 30 SEKUNDER\n3. Rull videre 90° til mageposisjon - VENT 30 SEKUNDER\n4. Rull videre 90° til VENSTRE side - VENT 30 SEKUNDER\n5. Rull til ryggposisjon og sitt opp\n6. Gjenta 2 ganger daglig',
  'BBQ Roll = Barbecue Roll. Effektivitet: 75-90%. Roterer 360° i retning motsatt av affisert øre.',
  'www.theBackROM.com/education/Clickup/bbq-roll-left'
);

-- Right BBQ Roll
INSERT INTO bppv_exercise_videos (
  exercise_code,
  exercise_name_no,
  exercise_name_en,
  canal_affected,
  pathology_type,
  laterality,
  youtube_url,
  duration_per_position,
  frequency_per_day,
  clinical_indications,
  patient_instructions_no,
  special_notes,
  educational_link
) VALUES (
  'BBQ_ROLL_RIGHT',
  'Høyre BBQ Roll',
  'Right BBQ Roll (Log Roll)',
  'horizontal',
  'canalithiasis',
  'right',
  'https://www.youtube.com/watch?v=pyN_QN931hE',
  '30 sekunder i hver posisjon',
  2,
  'Høyre lateral kanal BPPV (canalithiasis). Positiv Supine Roll Test med geotropisk nystagmus sterkest når hodet roteres til HØYRE.',
  E'1. Legg deg på ryggen - VENT 30 SEKUNDER\n2. Rull 90° til VENSTRE side - VENT 30 SEKUNDER\n3. Rull videre 90° til mageposisjon - VENT 30 SEKUNDER\n4. Rull videre 90° til HØYRE side - VENT 30 SEKUNDER\n5. Rull til ryggposisjon og sitt opp\n6. Gjenta 2 ganger daglig',
  'BBQ Roll = Barbecue Roll. Effektivitet: 75-90%. Roterer 360° i retning motsatt av affisert øre.',
  'www.theBackROM.com/education/Clickup/bbq-roll-right'
);

-- =====================================================
-- 7. HORIZONTAL CANAL - GUFONI MANEUVER
-- =====================================================

-- Right Gufoni - Canalithiasis
INSERT INTO bppv_exercise_videos (
  exercise_code,
  exercise_name_no,
  exercise_name_en,
  canal_affected,
  pathology_type,
  laterality,
  youtube_url,
  duration_per_position,
  frequency_per_day,
  clinical_indications,
  patient_instructions_no,
  special_notes,
  educational_link
) VALUES (
  'GUFONI_RIGHT_CANALO',
  'Høyre Gufoni - Canalithiasis',
  'Right Gufoni - Canalolithiasis',
  'horizontal',
  'canalithiasis',
  'right',
  'https://www.youtube.com/watch?v=DgKaWSuvpRs',
  '2 minutter i hver posisjon',
  2,
  'Høyre lateral kanal BPPV (canalithiasis - GEOTROPISK nystagmus). Alternativ til BBQ Roll.',
  E'1. Sitt på benken\n2. Legg deg raskt til HØYRE side (affisert øre ned) - VENT 2 MINUTTER\n3. Roter hodet 45° NED mot gulvet - VENT 2 MINUTTER\n4. Sett deg sakte opp\n5. Gjenta 2 ganger daglig',
  'Brukes ved GEOTROPISK nystagmus (canalithiasis). Kortere behandlingstid enn BBQ Roll. Effektivitet: 70-85%.',
  'www.theBackROM.com/education/Clickup/gufoni-right-canalo'
);

-- Left Gufoni - Canalithiasis
INSERT INTO bppv_exercise_videos (
  exercise_code,
  exercise_name_no,
  exercise_name_en,
  canal_affected,
  pathology_type,
  laterality,
  youtube_url,
  duration_per_position,
  frequency_per_day,
  clinical_indications,
  patient_instructions_no,
  special_notes,
  educational_link
) VALUES (
  'GUFONI_LEFT_CANALO',
  'Venstre Gufoni - Canalithiasis',
  'Left Gufoni - Canalolithiasis',
  'horizontal',
  'canalithiasis',
  'left',
  'https://www.youtube.com/watch?v=3VfgHZtgx_s',
  '2 minutter i hver posisjon',
  2,
  'Venstre lateral kanal BPPV (canalithiasis - GEOTROPISK nystagmus). Alternativ til BBQ Roll.',
  E'1. Sitt på benken\n2. Legg deg raskt til VENSTRE side (affisert øre ned) - VENT 2 MINUTTER\n3. Roter hodet 45° NED mot gulvet - VENT 2 MINUTTER\n4. Sett deg sakte opp\n5. Gjenta 2 ganger daglig',
  'Brukes ved GEOTROPISK nystagmus (canalithiasis). Kortere behandlingstid enn BBQ Roll. Effektivitet: 70-85%.',
  'www.theBackROM.com/education/Clickup/gufoni-left-canalo'
);

-- Right Gufoni - Cupulolithiasis
INSERT INTO bppv_exercise_videos (
  exercise_code,
  exercise_name_no,
  exercise_name_en,
  canal_affected,
  pathology_type,
  laterality,
  youtube_url,
  duration_per_position,
  frequency_per_day,
  clinical_indications,
  patient_instructions_no,
  special_notes,
  educational_link
) VALUES (
  'GUFONI_RIGHT_CUPULO',
  'Høyre Gufoni - Cupulolithiasis',
  'Right Gufoni - Cupulolithiasis',
  'horizontal',
  'cupulolithiasis',
  'right',
  'https://www.youtube.com/watch?v=oi8NRXrtu7k',
  '2 minutter i hver posisjon',
  2,
  'Høyre lateral kanal BPPV (cupulolithiasis - APOGEOTROPISK nystagmus).',
  E'1. Sitt på benken\n2. Legg deg raskt til VENSTRE side (IKKE-affisert øre ned) - VENT 2 MINUTTER\n3. Roter hodet 45° OPP mot taket - VENT 2 MINUTTER\n4. Sett deg sakte opp\n5. Gjenta 2 ganger daglig',
  'Brukes ved APOGEOTROPISK nystagmus (cupulolithiasis). Merk: Legger seg til MOTSATT side! Vanskeligere å behandle enn canalithiasis.',
  'www.theBackROM.com/education/Clickup/gufoni-right-cupulo'
);

-- =====================================================
-- 8. ANTERIOR CANAL BPPV (RARE)
-- =====================================================

-- Reverse Epley's - Left
INSERT INTO bppv_exercise_videos (
  exercise_code,
  exercise_name_no,
  exercise_name_en,
  canal_affected,
  pathology_type,
  laterality,
  youtube_url,
  duration_per_position,
  frequency_per_day,
  clinical_indications,
  patient_instructions_no,
  special_notes,
  educational_link
) VALUES (
  'REVERSE_EPLEY_LEFT',
  'Motsatt Epley''s Venstre (Anterior Kanal)',
  'Reverse Epley''s Left (Anterior Canal)',
  'anterior',
  'canalithiasis',
  'left',
  'https://www.youtube.com/watch?v=lKNI315n1r0',
  '1 minutt i hver posisjon',
  2,
  'Venstre anterior kanal BPPV (SJELDEN - 1-3% av tilfeller). Ned-slående nystagmus ved Dix-Hallpike.',
  E'1. Sitt på benken\n2. Utfør manøvrene i motsatt rekkefølge av vanlig Epley\n3. 1 minutt i hver posisjon\n4. Gjenta 2 ganger daglig',
  'SJELDEN diagnose (<3% av BPPV). Ofte feildiagnostisert som posterior kanal BPPV. Vurder andre årsaker til ned-slående nystagmus (CNS patologi).',
  'www.theBackROM.com/education/Clickup/reverse-epley-left'
);

-- Reverse Epley's - Right
INSERT INTO bppv_exercise_videos (
  exercise_code,
  exercise_name_no,
  exercise_name_en,
  canal_affected,
  pathology_type,
  laterality,
  youtube_url,
  duration_per_position,
  frequency_per_day,
  clinical_indications,
  patient_instructions_no,
  special_notes,
  educational_link
) VALUES (
  'REVERSE_EPLEY_RIGHT',
  'Motsatt Epley''s Høyre (Anterior Kanal)',
  'Reverse Epley''s Right (Anterior Canal)',
  'anterior',
  'canalithiasis',
  'right',
  'https://www.youtube.com/watch?v=8LoTIvFcJKs',
  '1 minutt i hver posisjon',
  2,
  'Høyre anterior kanal BPPV (SJELDEN - 1-3% av tilfeller). Ned-slående nystagmus ved Dix-Hallpike.',
  E'1. Sitt på benken\n2. Utfør manøvrene i motsatt rekkefølge av vanlig Epley\n3. 1 minutt i hver posisjon\n4. Gjenta 2 ganger daglig',
  'SJELDEN diagnose (<3% av BPPV). Ofte feildiagnostisert som posterior kanal BPPV. Vurder andre årsaker til ned-slående nystagmus (CNS patologi).',
  'www.theBackROM.com/education/Clickup/reverse-epley-right'
);

-- Deep Head Hanging Maneuver
INSERT INTO bppv_exercise_videos (
  exercise_code,
  exercise_name_no,
  exercise_name_en,
  canal_affected,
  pathology_type,
  laterality,
  youtube_url,
  duration_per_position,
  frequency_per_day,
  clinical_indications,
  patient_instructions_no,
  special_notes,
  educational_link
) VALUES (
  'DEEP_HEAD_HANGING',
  'Deep Head Hanging Manøver',
  'Deep Head Hanging Maneuver',
  'anterior',
  'canalithiasis',
  'bilateral',
  'https://www.youtube.com/watch?v=qw1QciZWfP0',
  '1 minutt i hver posisjon',
  2,
  'Anterior kanal BPPV eller multi-kanal BPPV. Kan også brukes når diagnosen er uklar.',
  E'1. Legg deg på ryggen med hodet hengende dypt over sengekanten\n2. Hold posisjonen i 1 minutt\n3. Roter hodet til hver side\n4. Sett deg sakte opp\n5. Gjenta 2 ganger daglig',
  'Brukes når anterior kanal eller flere kanaler er involvert. Kan være ubehagelig - vurder kontraindikasjoner (nakkeproblemer, vertebral artery insufficiency).',
  'www.theBackROM.com/education/Clickup/deep-head-hanging'
);

-- =====================================================
-- 9. DIAS MANEUVER (Alternative technique)
-- =====================================================

-- Left Dias
INSERT INTO bppv_exercise_videos (
  exercise_code,
  exercise_name_no,
  exercise_name_en,
  canal_affected,
  pathology_type,
  laterality,
  youtube_url,
  duration_per_position,
  frequency_per_day,
  clinical_indications,
  patient_instructions_no,
  special_notes,
  educational_link
) VALUES (
  'DIAS_LEFT',
  'Venstre Dias Manøver',
  'Left Dias Maneuver',
  'posterior',
  'canalithiasis',
  'left',
  'https://www.youtube.com/watch?v=y7Zy2tyFvls',
  '1 minutt i hver posisjon',
  2,
  'Venstre posterior kanal BPPV. Alternativ teknikk til Epley.',
  E'1. Utfør Dias manøver for venstre side\n2. 1 minutt i hver posisjon\n3. Gjenta 2 ganger daglig',
  'Alternativ metode til Epley. Mindre kjent, men kan være nyttig når Epley ikke fungerer.',
  'www.theBackROM.com/education/Clickup/dias-left'
);

-- Right Dias
INSERT INTO bppv_exercise_videos (
  exercise_code,
  exercise_name_no,
  exercise_name_en,
  canal_affected,
  pathology_type,
  laterality,
  youtube_url,
  duration_per_position,
  frequency_per_day,
  clinical_indications,
  patient_instructions_no,
  special_notes,
  educational_link
) VALUES (
  'DIAS_RIGHT',
  'Høyre Dias Manøver',
  'Right Dias Maneuver',
  'posterior',
  'canalithiasis',
  'right',
  'https://www.youtube.com/shorts/jOLRf1HbyAA',
  '1 minutt i hver posisjon',
  2,
  'Høyre posterior kanal BPPV. Alternativ teknikk til Epley.',
  E'1. Utfør Dias manøver for høyre side\n2. 1 minutt i hver posisjon\n3. Gjenta 2 ganger daglig',
  'Alternativ metode til Epley. Mindre kjent, men kan være nyttig når Epley ikke fungerer.',
  'www.theBackROM.com/education/Clickup/dias-right'
);

-- =====================================================
-- 10. SELF-TREATMENT OPTIONS
-- =====================================================

-- Half Somersault
INSERT INTO bppv_exercise_videos (
  exercise_code,
  exercise_name_no,
  exercise_name_en,
  canal_affected,
  pathology_type,
  laterality,
  youtube_url,
  duration_per_position,
  frequency_per_day,
  clinical_indications,
  patient_instructions_no,
  special_notes,
  educational_link
) VALUES (
  'HALF_SOMERSAULT',
  'Half Somersault',
  'Half Somersault Maneuver',
  'posterior',
  'canalithiasis',
  'general',
  'https://www.youtube.com/watch?v=_8ucpWIIC3g',
  'Varierer',
  2,
  'Posterior kanal BPPV. Selvbehandlingsteknikk som pasienter kan gjøre hjemme uten hjelp.',
  E'1. Start på alle fire\n2. Se opp mot taket i 30 sekunder\n3. Bøy hodet raskt ned (som å se på navlen)\n4. Snu hodet mot affisert øre\n5. Løft hodet raskt til ryggnivå mens du er på alle fire\n6. Løft hodet til helt oppreist posisjon\n7. Gjenta ved behov',
  'POPULÆR selvbehandlingsteknikk. Lettere for pasienter å utføre alene enn Epley. Foster et al. 2012 viste 70% suksess.',
  'www.theBackROM.com/education/Clickup/half-somersault'
);

-- =====================================================
-- 11. VESTIBULAR REHABILITATION - OPK EXERCISES
-- =====================================================

-- OPK Right
INSERT INTO bppv_exercise_videos (
  exercise_code,
  exercise_name_no,
  exercise_name_en,
  canal_affected,
  pathology_type,
  laterality,
  youtube_url,
  duration_per_position,
  frequency_per_day,
  clinical_indications,
  patient_instructions_no,
  special_notes,
  educational_link
) VALUES (
  'OPK_HOYRE',
  'OPK Høyre (Optokinetisk)',
  'OPK Right (Optokinetic)',
  'diagnostic',
  NULL,
  'right',
  'https://www.youtube.com/watch?v=bMDIsVSQZLk',
  '2-3 minutter',
  3,
  'Vestibulær rehabilitering. Forbedrer vestibulær kompensasjon etter BPPV behandling eller ved unilateral vestibular weakness.',
  E'1. Følg de bevegelige stripene på skjermen som beveger seg til HØYRE\n2. Hold øynene fokusert på stripene\n3. 2-3 minutter om gangen\n4. Gjenta 3 ganger daglig\n5. Kan gi svimmelhet - dette er normalt og terapeutisk',
  'OPK = Optokinetisk nystagmus trening. Stimulerer vestibulær tilpasning og kompensasjon. Brukes ETTER BPPV behandling for raskere bedring.',
  'www.theBackROM.com/education/Clickup/opk-right'
);

-- OPK Left
INSERT INTO bppv_exercise_videos (
  exercise_code,
  exercise_name_no,
  exercise_name_en,
  canal_affected,
  pathology_type,
  laterality,
  youtube_url,
  duration_per_position,
  frequency_per_day,
  clinical_indications,
  patient_instructions_no,
  special_notes,
  educational_link
) VALUES (
  'OPK_VENSTRE',
  'OPK Venstre (Optokinetisk)',
  'OPK Left (Optokinetic)',
  'diagnostic',
  NULL,
  'left',
  'https://www.youtube.com/watch?v=WB61GjYY95E',
  '2-3 minutter',
  3,
  'Vestibulær rehabilitering. Forbedrer vestibulær kompensasjon etter BPPV behandling eller ved unilateral vestibular weakness.',
  E'1. Følg de bevegelige stripene på skjermen som beveger seg til VENSTRE\n2. Hold øynene fokusert på stripene\n3. 2-3 minutter om gangen\n4. Gjenta 3 ganger daglig\n5. Kan gi svimmelhet - dette er normalt og terapeutisk',
  'OPK = Optokinetisk nystagmus trening. Stimulerer vestibulær tilpasning og kompensasjon. Brukes ETTER BPPV behandling for raskere bedring.',
  'www.theBackROM.com/education/Clickup/opk-left'
);

-- OPK Down
INSERT INTO bppv_exercise_videos (
  exercise_code,
  exercise_name_no,
  exercise_name_en,
  canal_affected,
  pathology_type,
  laterality,
  youtube_url,
  duration_per_position,
  frequency_per_day,
  clinical_indications,
  patient_instructions_no,
  special_notes,
  educational_link
) VALUES (
  'OPK_NED',
  'OPK Ned (Optokinetisk)',
  'OPK Down (Optokinetic)',
  'diagnostic',
  NULL,
  'bilateral',
  'https://www.youtube.com/watch?v=IUHZTanTW-8',
  '2-3 minutter',
  3,
  'Vestibulær rehabilitering. Vertikal OPK for komplett vestibulær stimulering.',
  E'1. Følg de bevegelige stripene på skjermen som beveger seg NEDOVER\n2. Hold øynene fokusert på stripene\n3. 2-3 minutter om gangen\n4. Gjenta 3 ganger daglig',
  'Vertikal OPK stimulering. Brukes sammen med horisontal OPK for komplett rehabilitering.',
  'www.theBackROM.com/education/Clickup/opk-down'
);

-- OPK Down Right
INSERT INTO bppv_exercise_videos (
  exercise_code,
  exercise_name_no,
  exercise_name_en,
  canal_affected,
  pathology_type,
  laterality,
  youtube_url,
  duration_per_position,
  frequency_per_day,
  clinical_indications,
  patient_instructions_no,
  special_notes,
  educational_link
) VALUES (
  'OPK_NED_HOYRE',
  'OPK Ned Høyre (Optokinetisk)',
  'OPK Down Right (Optokinetic)',
  'diagnostic',
  NULL,
  'right',
  'https://www.youtube.com/watch?v=BeHRDIHapmo',
  '2-3 minutter',
  3,
  'Vestibulær rehabilitering. Diagonal OPK for avansert vestibulær stimulering.',
  E'1. Følg de bevegelige stripene som beveger seg DIAGONALT ned til høyre\n2. Hold øynene fokusert på stripene\n3. 2-3 minutter om gangen\n4. Gjenta 3 ganger daglig',
  'Diagonal OPK - mer avansert øvelse. Kombinerer horisontal og vertikal stimulering.',
  'www.theBackROM.com/education/Clickup/opk-down-right'
);

-- =====================================================
-- 12. BPPV TREATMENT PROTOCOLS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS bppv_treatment_protocols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_name VARCHAR(200) NOT NULL,
  diagnosis_code VARCHAR(50),  -- ICD-10
  canal_affected VARCHAR(50) NOT NULL,
  pathology_type VARCHAR(50),
  primary_maneuver_id UUID REFERENCES bppv_exercise_videos(id),
  alternative_maneuver_ids UUID[],
  rehabilitation_exercise_ids UUID[],
  treatment_duration_days INTEGER,
  expected_success_rate_percent INTEGER,
  follow_up_schedule TEXT,
  post_treatment_instructions_no TEXT,
  when_to_refer TEXT,
  clinical_pearls TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 13. PATIENT EXERCISE PRESCRIPTIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS patient_bppv_prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  encounter_id UUID,
  prescribed_date DATE DEFAULT CURRENT_DATE,
  exercise_video_id UUID REFERENCES bppv_exercise_videos(id),
  custom_duration_per_position VARCHAR(50),
  custom_frequency_per_day INTEGER,
  start_date DATE,
  end_date DATE,
  compliance_tracking JSONB,  -- {"2025-01-15": {"completed": true, "times": 2, "notes": "litt svimmel"}}
  effectiveness_rating INTEGER CHECK (effectiveness_rating BETWEEN 1 AND 10),
  patient_notes TEXT,
  clinician_notes TEXT,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'discontinued', 'modified')),
  created_by UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_patient_bppv_prescriptions_patient ON patient_bppv_prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_bppv_prescriptions_status ON patient_bppv_prescriptions(status);

-- =====================================================
-- 14. EDUCATIONAL RESOURCES FOR BPPV
-- =====================================================

-- Insert comprehensive BPPV education
INSERT INTO educational_resources (
  code,
  title,
  category,
  description,
  content_type,
  url,
  target_audience
) VALUES
(
  'BPPV_OVERVIEW',
  'BPPV - Benign Paroxysmal Positional Vertigo Oversikt',
  'Vestibular Disorders',
  'Omfattende guide til BPPV diagnostikk og behandling med alle manøvre',
  'interactive_guide',
  'www.theBackROM.com/education/Clickup/bppv-complete-guide',
  'clinicians'
),
(
  'BPPV_PATIENT_GUIDE',
  'Pasientveiledning - BPPV og Hjemmeøvelser',
  'Vestibular Disorders',
  'Pasientvennlig guide til BPPV med instruksjoner for hjemmeøvelser',
  'patient_handout',
  'www.theBackROM.com/education/Clickup/bppv-patient-guide',
  'patients'
),
(
  'HORIZONTAL_CANAL_BPPV',
  'Lateral Kanal BPPV - Diagnostikk og Behandling',
  'Vestibular Disorders',
  'Spesialisert guide for lateral kanal BPPV: BBQ Roll, Gufoni, geotropisk vs apogeotropisk',
  'clinical_protocol',
  'www.theBackROM.com/education/Clickup/horizontal-canal-bppv',
  'clinicians'
),
(
  'VESTIBULAR_REHAB_POST_BPPV',
  'Vestibulær Rehabilitering Etter BPPV',
  'Vestibular Rehabilitation',
  'OPK øvelser og vestibulær rehabilitering for raskere tilheling etter BPPV behandling',
  'exercise_program',
  'www.theBackROM.com/education/Clickup/vestibular-rehab-post-bppv',
  'both'
);

-- =====================================================
-- 15. HELPER FUNCTIONS
-- =====================================================

-- Function to get recommended exercises based on diagnosis
CREATE OR REPLACE FUNCTION get_bppv_exercise_recommendation(
  p_canal VARCHAR,
  p_pathology VARCHAR,
  p_laterality VARCHAR
)
RETURNS TABLE (
  exercise_code VARCHAR,
  exercise_name VARCHAR,
  youtube_url VARCHAR,
  instructions TEXT,
  clinical_notes TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    bev.exercise_code,
    bev.exercise_name_no,
    bev.youtube_url,
    bev.patient_instructions_no,
    bev.special_notes
  FROM bppv_exercise_videos bev
  WHERE
    bev.canal_affected = p_canal
    AND (p_pathology IS NULL OR bev.pathology_type = p_pathology)
    AND (bev.laterality = p_laterality OR bev.laterality = 'bilateral' OR bev.laterality = 'general')
  ORDER BY
    CASE
      WHEN bev.laterality = p_laterality THEN 1
      ELSE 2
    END;
END;
$$ LANGUAGE plpgsql;

-- Function to generate patient exercise handout
CREATE OR REPLACE FUNCTION generate_bppv_exercise_handout(
  p_patient_id UUID,
  p_exercise_code VARCHAR
)
RETURNS TEXT AS $$
DECLARE
  v_patient_name TEXT;
  v_exercise RECORD;
  v_handout TEXT;
BEGIN
  -- Get patient name (adjust based on your patients table structure)
  SELECT COALESCE(first_name || ' ' || last_name, 'Pasient') INTO v_patient_name
  FROM patients WHERE id = p_patient_id;

  -- Get exercise details
  SELECT * INTO v_exercise FROM bppv_exercise_videos WHERE exercise_code = p_exercise_code;

  -- Generate handout
  v_handout := E'╔══════════════════════════════════════════════════════════════╗\n';
  v_handout := v_handout || '║          HJEMMEØVELSE FOR BPPV - ' || UPPER(v_exercise.exercise_name_no) || E'          ║\n';
  v_handout := v_handout || E'╚══════════════════════════════════════════════════════════════╝\n\n';
  v_handout := v_handout || 'Pasient: ' || v_patient_name || E'\n';
  v_handout := v_handout || 'Dato: ' || TO_CHAR(CURRENT_DATE, 'DD.MM.YYYY') || E'\n\n';
  v_handout := v_handout || E'━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
  v_handout := v_handout || E'INSTRUKSJONER:\n';
  v_handout := v_handout || E'━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
  v_handout := v_handout || v_exercise.patient_instructions_no || E'\n\n';
  v_handout := v_handout || E'━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
  v_handout := v_handout || E'DOSERING:\n';
  v_handout := v_handout || E'━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
  v_handout := v_handout || '⏱️  Varighet: ' || v_exercise.duration_per_position || E' per posisjon\n';
  v_handout := v_handout || '🔄 Frekvens: ' || v_exercise.frequency_per_day || E' ganger daglig\n\n';

  IF v_exercise.special_notes IS NOT NULL THEN
    v_handout := v_handout || E'━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    v_handout := v_handout || E'VIKTIG Å VITE:\n';
    v_handout := v_handout || E'━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
    v_handout := v_handout || v_exercise.special_notes || E'\n\n';
  END IF;

  v_handout := v_handout || E'━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
  v_handout := v_handout || E'VIDEO DEMONSTRASJON:\n';
  v_handout := v_handout || E'━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
  v_handout := v_handout || '🎥 ' || v_exercise.youtube_url || E'\n\n';
  v_handout := v_handout || E'━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
  v_handout := v_handout || E'KONTAKT OSS:\n';
  v_handout := v_handout || E'━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
  v_handout := v_handout || E'📞 Hvis symptomene forverres eller ikke bedres etter 1 uke,\n';
  v_handout := v_handout || E'   vennligst kontakt klinikken for oppfølging.\n\n';
  v_handout := v_handout || E'⚠️  Hvis du opplever hodepine, dobbeltsyn, nummenhet, eller\n';
  v_handout := v_handout || E'   talevansker - kontakt lege UMIDDELBART.\n';

  RETURN v_handout;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SUMMARY AND USAGE EXAMPLES
-- =====================================================

-- Example 1: Get all exercises for right posterior canal BPPV
-- SELECT * FROM get_bppv_exercise_recommendation('posterior', 'canalithiasis', 'right');

-- Example 2: Generate patient handout
-- SELECT generate_bppv_exercise_handout('patient-uuid-here', 'EPLEY_RIGHT');

-- Example 3: Prescribe exercise to patient
-- INSERT INTO patient_bppv_prescriptions (patient_id, exercise_video_id, start_date)
-- SELECT 'patient-uuid', id, CURRENT_DATE
-- FROM bppv_exercise_videos
-- WHERE exercise_code = 'EPLEY_RIGHT';

-- Example 4: Find all horizontal canal exercises
-- SELECT exercise_name_no, laterality, pathology_type, youtube_url
-- FROM bppv_exercise_videos
-- WHERE canal_affected = 'horizontal'
-- ORDER BY pathology_type, laterality;

COMMENT ON TABLE bppv_exercise_videos IS 'Comprehensive BPPV exercise library with YouTube video references organized by canal and pathology type';
COMMENT ON TABLE bppv_treatment_protocols IS 'Evidence-based treatment protocols for different BPPV presentations';
COMMENT ON TABLE patient_bppv_prescriptions IS 'Patient-specific exercise prescriptions with compliance tracking';
