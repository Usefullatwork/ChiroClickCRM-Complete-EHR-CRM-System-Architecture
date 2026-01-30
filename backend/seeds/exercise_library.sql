-- ============================================================================
-- Exercise Library Seed Data
-- Common chiropractic and rehabilitation exercises in Norwegian
-- ============================================================================

-- First, insert global exercises (visible to all organizations)
-- Organization ID is NULL for global exercises

-- ============================================================================
-- CERVICAL (NAKKE) EXERCISES
-- ============================================================================

INSERT INTO exercise_library (
  organization_id, code, name_no, name_en, category, body_region, difficulty,
  instructions_no, instructions_en, contraindications, precautions,
  default_sets, default_reps, default_hold_seconds, default_frequency,
  equipment_needed, tags, is_global, source, image_url
) VALUES

-- Neck Stretches
(NULL, 'CERV-STRETCH-001', 'Nakke sidebøy tøyning', 'Neck Lateral Flexion Stretch',
 'stretching', 'cervical', 'beginner',
 'Sitt eller stå med rett rygg. Bøy hodet sakte mot skulderen til du kjenner en lett strekk på motsatt side av nakken. Hold i 20-30 sekunder. Gjenta på motsatt side. Unngå å løfte skulderen.',
 'Sit or stand with straight back. Slowly tilt head towards shoulder until you feel a gentle stretch on the opposite side of neck. Hold for 20-30 seconds. Repeat on opposite side.',
 'Akutt nakkeskade, ustabilitet i cervikalcolumna, akutt diskusprolaps',
 'Stopp hvis du får smerter som stråler ned i arm. Unngå overdreven kraft.',
 3, 3, 30, 'daily',
 ARRAY['none'], ARRAY['stretch', 'neck', 'basic'], true, 'custom',
 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/neck_stretch/images/0.jpg'),

(NULL, 'CERV-STRETCH-002', 'Nakke fleksjon tøyning', 'Neck Flexion Stretch',
 'stretching', 'cervical', 'beginner',
 'Sitt med rett rygg. Før haken forsiktig mot brystet. Plasser hendene bak hodet og gi et lett trykk nedover. Hold i 20-30 sekunder.',
 'Sit with straight back. Gently bring chin towards chest. Place hands behind head and apply gentle pressure downward. Hold for 20-30 seconds.',
 'Akutt nakkeskade, cervical stenose',
 'Ikke press for hardt. Stopp ved smerte.',
 3, 3, 30, 'daily',
 ARRAY['none'], ARRAY['stretch', 'neck', 'flexion'], true, 'custom',
 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/neck_stretch/images/1.jpg'),

(NULL, 'CERV-STRETCH-003', 'Øvre trapezius tøyning', 'Upper Trapezius Stretch',
 'stretching', 'cervical', 'beginner',
 'Sitt på en stol og hold fast i setet med høyre hånd. Bøy hodet mot venstre og roter lett mot høyre. Bruk venstre hånd til å gi et lett trykk. Hold i 30 sekunder. Bytt side.',
 'Sit on chair holding seat with right hand. Tilt head left and rotate slightly right. Use left hand to apply gentle pressure. Hold 30 seconds. Switch sides.',
 'Akutt nakkeskade',
 'Unngå rotasjon hvis det gir ubehag.',
 3, 3, 30, 'daily',
 ARRAY['chair'], ARRAY['stretch', 'neck', 'trapezius'], true, 'custom',
 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/side_neck_stretch/images/0.jpg'),

(NULL, 'CERV-STRETCH-004', 'Levator scapulae tøyning', 'Levator Scapulae Stretch',
 'stretching', 'cervical', 'intermediate',
 'Sitt med rett rygg. Drei hodet 45 grader til venstre. Bøy hodet ned mot venstre armhule. Bruk venstre hånd til å gi et lett trykk. Hold i 30 sekunder. Bytt side.',
 'Sit with straight back. Rotate head 45 degrees to left. Flex head down towards left armpit. Use left hand for gentle pressure. Hold 30 seconds. Switch sides.',
 'Akutt cervikalt traume',
 'Vær forsiktig med rotasjon og fleksjon kombinert.',
 3, 3, 30, 'daily',
 ARRAY['none'], ARRAY['stretch', 'neck', 'levator'], true, 'custom',
 NULL),

-- Neck Mobility
(NULL, 'CERV-MOB-001', 'Nakke rotasjon', 'Neck Rotation',
 'mobility', 'cervical', 'beginner',
 'Sitt eller stå med rett rygg. Drei hodet sakte mot høyre til du kjenner en lett strekk. Hold i 5 sekunder. Gjenta mot venstre. Gjør 10 repetisjoner til hver side.',
 'Sit or stand with straight back. Slowly rotate head to right until gentle stretch. Hold 5 seconds. Repeat to left. Do 10 reps each side.',
 'Akutt nakkeskade, vertebrobasilær insuffisiens',
 'Beveg deg langsomt og kontrollert. Stopp ved svimmelhet.',
 3, 10, 5, 'daily',
 ARRAY['none'], ARRAY['mobility', 'neck', 'rotation'], true, 'custom',
 NULL),

(NULL, 'CERV-MOB-002', 'Hakeinntrykk (chin tuck)', 'Chin Tuck',
 'posture', 'cervical', 'beginner',
 'Sitt eller stå med rett rygg. Trekk haken rett bakover som om du lager dobbelthake. Hold i 5-10 sekunder. Slapp av og gjenta. Dette er en viktig øvelse for god nakkeposisjon.',
 'Sit or stand with straight back. Draw chin straight back as if making a double chin. Hold 5-10 seconds. Relax and repeat. Important exercise for neck posture.',
 'Ingen spesifikke kontraindikasjoner',
 'Ikke trekk haken ned, bare rett bakover.',
 3, 10, 10, 'daily',
 ARRAY['none'], ARRAY['posture', 'neck', 'chin_tuck', 'mckenzie'], true, 'custom',
 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/chin-up/images/0.jpg'),

(NULL, 'CERV-MOB-003', 'Cat-cow for nakke', 'Cat-Cow for Neck',
 'mobility', 'cervical', 'beginner',
 'Stå på alle fire. Ved innpust, senk magen og løft hodet mot taket. Ved utpust, rund ryggen og før haken mot brystet. Gjør 10 repetisjoner.',
 'Start on all fours. On inhale, drop belly and lift head towards ceiling. On exhale, round back and bring chin to chest. Do 10 repetitions.',
 'Alvorlig nakkeskade',
 'Beveg deg i takt med pusten.',
 3, 10, null, 'daily',
 ARRAY['yoga_mat'], ARRAY['mobility', 'neck', 'cat_cow'], true, 'custom',
 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/cat_stretch/images/0.jpg'),

-- Neck Strengthening
(NULL, 'CERV-STR-001', 'Isometrisk nakke styrke', 'Isometric Neck Strengthening',
 'strengthening', 'cervical', 'beginner',
 'Sitt med rett rygg. Plasser hånd på pannen og press hodet mot hånden uten å bevege hodet. Hold i 5-10 sekunder. Gjenta mot høyre, venstre og bak. 5 repetisjoner hver retning.',
 'Sit with straight back. Place hand on forehead and push head against hand without moving head. Hold 5-10 seconds. Repeat right, left, and back. 5 reps each direction.',
 'Akutt nakkeskade',
 'Start med lett motstand og øk gradvis.',
 3, 5, 10, 'daily',
 ARRAY['none'], ARRAY['strength', 'neck', 'isometric'], true, 'custom',
 NULL),

(NULL, 'CERV-STR-002', 'Dyp nakkefleksor-aktivering', 'Deep Neck Flexor Activation',
 'strengthening', 'cervical', 'intermediate',
 'Ligg på ryggen med knærne bøyd. Trekk haken lett inn (chin tuck). Løft hodet bare 2-3 cm fra gulvet. Hold i 10 sekunder. Senk sakte ned. Gjenta 10 ganger.',
 'Lie on back with knees bent. Gently tuck chin. Lift head only 2-3 cm from floor. Hold 10 seconds. Lower slowly. Repeat 10 times.',
 'Alvorlig cervikalt syndrom',
 'Ikke løft hodet høyt opp. Fokuser på chin tuck først.',
 3, 10, 10, 'daily',
 ARRAY['yoga_mat'], ARRAY['strength', 'neck', 'deep_flexors'], true, 'custom',
 NULL),

-- ============================================================================
-- THORACIC (BRYSTSØYLE) EXERCISES
-- ============================================================================

(NULL, 'THOR-MOB-001', 'Thorakal rotasjon på side', 'Thoracic Rotation Side-Lying',
 'mobility', 'thoracic', 'beginner',
 'Ligg på venstre side med knær bøyd 90 grader. Strekk armene rett frem. Åpne høyre arm mot høyre og roter overkroppen. Følg hånden med blikket. Hold 2-3 sekunder. Gjenta 10 ganger. Bytt side.',
 'Lie on left side with knees bent 90 degrees. Arms straight forward. Open right arm right and rotate upper body. Follow hand with eyes. Hold 2-3 seconds. Repeat 10 times. Switch sides.',
 'Akutt costovertebralt syndrom',
 'Behold hofter og knær stabile.',
 3, 10, 3, 'daily',
 ARRAY['yoga_mat'], ARRAY['mobility', 'thoracic', 'rotation'], true, 'custom',
 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/spine_stretch/images/0.jpg'),

(NULL, 'THOR-MOB-002', 'Thorakal ekstensjon over skumrull', 'Thoracic Extension Over Foam Roller',
 'mobility', 'thoracic', 'intermediate',
 'Ligg på ryggen med skumrullen på tvers under øvre rygg. Støtt hodet med hendene. Bøy bakover over rullen med kontroll. Hold 3-5 sekunder. Flytt rullen litt opp eller ned og gjenta.',
 'Lie on back with foam roller across upper back. Support head with hands. Extend backward over roller with control. Hold 3-5 seconds. Move roller up or down and repeat.',
 'Alvorlig osteoporose, ustabilitet',
 'Ikke gå for langt ned i lumbalryggen.',
 3, 10, 5, 'daily',
 ARRAY['foam_roller'], ARRAY['mobility', 'thoracic', 'extension'], true, 'custom',
 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/foam_rolling_upper_back/images/0.jpg'),

(NULL, 'THOR-MOB-003', 'Brugger hvileposisjon', 'Brugger Relief Position',
 'posture', 'thoracic', 'beginner',
 'Sitt på kanten av stolen. Spre bena litt. Drei håndflatene utover. Drei skuldrene lett bakover og utover. Løft brystkassen. Hold i 30 sekunder. Gjenta flere ganger daglig.',
 'Sit on edge of chair. Spread legs slightly. Turn palms outward. Rotate shoulders slightly back and out. Lift chest. Hold 30 seconds. Repeat several times daily.',
 'Ingen spesifikke kontraindikasjoner',
 'Ikke hyperekstender nakken.',
 5, 1, 30, 'daily',
 ARRAY['chair'], ARRAY['posture', 'thoracic', 'brugger'], true, 'custom',
 NULL),

(NULL, 'THOR-MOB-004', 'Katt-ku (Cat-cow)', 'Cat-Cow',
 'mobility', 'thoracic', 'beginner',
 'Start på alle fire med hendene under skuldrene og knærne under hoftene. Ved innpust, senk magen mot gulvet og løft hodet og halen (ku). Ved utpust, rund ryggen mot taket og før haken mot brystet (katt). Gjenta 10-15 ganger.',
 'Start on all fours with hands under shoulders and knees under hips. On inhale, drop belly towards floor and lift head and tailbone (cow). On exhale, round back towards ceiling and bring chin to chest (cat). Repeat 10-15 times.',
 'Ingen spesifikke kontraindikasjoner',
 'Beveg deg langsomt og med pusten.',
 3, 15, null, 'daily',
 ARRAY['yoga_mat'], ARRAY['mobility', 'thoracic', 'lumbar', 'cat_cow'], true, 'custom',
 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/cat_stretch/images/1.jpg'),

(NULL, 'THOR-STR-001', 'Rhomboid styrke med elastikk', 'Rhomboid Strengthening with Band',
 'strengthening', 'thoracic', 'beginner',
 'Stå med elastikken festet i dørhåndtakshøyde. Hold i elastikken med begge hender. Trekk skulderblader sammen mens du trekker albuene bakover. Hold 2-3 sekunder. Slipp sakte ut. Gjenta 15 ganger.',
 'Stand with band fixed at door handle height. Hold band with both hands. Squeeze shoulder blades together while pulling elbows back. Hold 2-3 seconds. Release slowly. Repeat 15 times.',
 'Akutt skulderskade',
 'Ikke løft skuldrene mot ørene.',
 3, 15, 3, '3x_week',
 ARRAY['resistance_band'], ARRAY['strength', 'thoracic', 'rhomboids', 'posture'], true, 'custom',
 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/band_face_pull/images/0.jpg'),

-- ============================================================================
-- LUMBAR (KORSRYGG) EXERCISES
-- ============================================================================

-- McGill Big 3
(NULL, 'LUMB-STR-001', 'McGill curl-up', 'McGill Curl-Up',
 'strengthening', 'lumbar', 'beginner',
 'Ligg på ryggen med ett kne bøyd og ett ben strakt. Plasser hendene under korsryggen for å bevare naturlig lordose. Løft hodet og skuldrene lett fra gulvet uten å bøye nakken. Hold i 8-10 sekunder. Hvil og gjenta. Bytt benstilling halvveis.',
 'Lie on back with one knee bent and one leg straight. Place hands under lower back to maintain natural lordosis. Lift head and shoulders slightly off floor without bending neck. Hold 8-10 seconds. Rest and repeat. Switch leg position halfway.',
 'Akutt ryggprolaps',
 'Ikke flater ut korsryggen. Hold naturlig kurve.',
 3, 10, 10, 'daily',
 ARRAY['yoga_mat'], ARRAY['strength', 'core', 'mcgill', 'curl_up'], true, 'custom',
 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/crunch/images/0.jpg'),

(NULL, 'LUMB-STR-002', 'Sidebrett (side plank)', 'Side Plank',
 'strengthening', 'lumbar', 'intermediate',
 'Ligg på siden med albuen under skulderen. Løft hoften fra gulvet slik at kroppen danner en rett linje. Hold i 10-30 sekunder. For enklere versjon: ha knærne bøyd. For vanskeligere: strekk øverste arm mot taket.',
 'Lie on side with elbow under shoulder. Lift hip from floor so body forms straight line. Hold 10-30 seconds. Easier: keep knees bent. Harder: extend top arm towards ceiling.',
 'Skulderskade på støttesiden',
 'Ikke la hoften synke mot gulvet.',
 3, 3, 30, 'daily',
 ARRAY['yoga_mat'], ARRAY['strength', 'core', 'mcgill', 'side_plank'], true, 'custom',
 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/side_plank/images/0.jpg'),

(NULL, 'LUMB-STR-003', 'Bird-dog', 'Bird-Dog',
 'strengthening', 'lumbar', 'beginner',
 'Start på alle fire. Strekk høyre arm rett frem og venstre ben rett bak samtidig. Hold ryggen rett - ikke roter eller bøy. Hold i 8-10 sekunder. Vend tilbake til start. Gjenta på motsatt side.',
 'Start on all fours. Extend right arm forward and left leg back simultaneously. Keep back straight - no rotation or arching. Hold 8-10 seconds. Return to start. Repeat opposite side.',
 'Ingen spesifikke kontraindikasjoner',
 'Start med kun arm eller kun ben hvis vanskelig. Unngå å løfte for høyt.',
 3, 10, 10, 'daily',
 ARRAY['yoga_mat'], ARRAY['strength', 'core', 'mcgill', 'bird_dog'], true, 'custom',
 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/bird_dog/images/0.jpg'),

-- McKenzie Exercises
(NULL, 'LUMB-MOB-001', 'Liggende ekstensjon (McKenzie)', 'Prone Extension (McKenzie)',
 'mobility', 'lumbar', 'beginner',
 'Ligg på magen med hender under skuldrene. Press overkroppen opp mens hoften blir liggende på gulvet. Hold i 1-2 sekunder. Senk ned og gjenta. Start med 10 repetisjoner og øk gradvis.',
 'Lie face down with hands under shoulders. Press upper body up while hips stay on floor. Hold 1-2 seconds. Lower and repeat. Start with 10 reps and increase gradually.',
 'Spinal stenose, spondylolistese, akutt fasettleddssyndrom',
 'Stopp hvis smerten øker eller stråler lengre ned i bena.',
 3, 10, 2, 'daily',
 ARRAY['yoga_mat'], ARRAY['mobility', 'lumbar', 'mckenzie', 'extension'], true, 'custom',
 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/cobra_stretch/images/0.jpg'),

(NULL, 'LUMB-MOB-002', 'Stående ekstensjon (McKenzie)', 'Standing Extension (McKenzie)',
 'mobility', 'lumbar', 'beginner',
 'Stå med føttene skulderbreddes fra hverandre. Plasser hendene på korsryggen. Bøy forsiktig bakover. Hold i 1-2 sekunder. Vend tilbake til nøytral. Gjenta 10 ganger.',
 'Stand with feet shoulder-width apart. Place hands on lower back. Gently bend backward. Hold 1-2 seconds. Return to neutral. Repeat 10 times.',
 'Spinal stenose, spondylolistese',
 'Ikke overekstender. Kjenn strekk, ikke smerte.',
 3, 10, 2, '2x_daily',
 ARRAY['none'], ARRAY['mobility', 'lumbar', 'mckenzie', 'extension'], true, 'custom',
 NULL),

(NULL, 'LUMB-MOB-003', 'Kne til bryst tøyning', 'Knee to Chest Stretch',
 'stretching', 'lumbar', 'beginner',
 'Ligg på ryggen. Trekk ett kne mot brystet med begge hender. Hold i 20-30 sekunder. Bytt side. Kan også gjøres med begge knær samtidig.',
 'Lie on back. Pull one knee towards chest with both hands. Hold 20-30 seconds. Switch sides. Can also be done with both knees together.',
 'Akutt diskusprolaps',
 'Trekk forsiktig og hold hoften på gulvet.',
 3, 3, 30, 'daily',
 ARRAY['yoga_mat'], ARRAY['stretch', 'lumbar', 'flexion'], true, 'custom',
 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/knee_hug/images/0.jpg'),

(NULL, 'LUMB-MOB-004', 'Barn stilling (child pose)', 'Child Pose',
 'stretching', 'lumbar', 'beginner',
 'Start på alle fire. Sett deg tilbake på hælene mens du strekker armene frem langs gulvet. Slapp av nakken og pust rolig. Hold i 30-60 sekunder.',
 'Start on all fours. Sit back on heels while extending arms forward along floor. Relax neck and breathe calmly. Hold 30-60 seconds.',
 'Kneskade',
 'Legg en pute mellom hælene og setet hvis ubehagelig.',
 3, 1, 60, 'daily',
 ARRAY['yoga_mat'], ARRAY['stretch', 'lumbar', 'child_pose', 'flexion'], true, 'custom',
 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/childs_pose/images/0.jpg'),

-- ============================================================================
-- SHOULDER (SKULDER) EXERCISES
-- ============================================================================

(NULL, 'SHLD-STR-001', 'Pendel øvelse', 'Pendulum Exercise',
 'mobility', 'shoulder', 'beginner',
 'Bøy overkroppen fremover og la den smertefulle armen henge rett ned. Sving armen forsiktig i små sirkler - først med klokken, så mot klokken. Øk sirkelstørrelsen gradvis. 1 minutt hver retning.',
 'Bend forward and let affected arm hang straight down. Swing arm gently in small circles - clockwise then counterclockwise. Gradually increase circle size. 1 minute each direction.',
 'Akutt luksasjon',
 'Hold armen avslappet. Ikke bruk muskler for å bevege.',
 3, 1, 60, 'daily',
 ARRAY['none'], ARRAY['mobility', 'shoulder', 'pendulum'], true, 'custom',
 NULL),

(NULL, 'SHLD-STR-002', 'Ekstern rotasjon med elastikk', 'External Rotation with Band',
 'strengthening', 'shoulder', 'beginner',
 'Stå med albuen bøyd 90 grader og inntil kroppen. Hold elastikken med hånden. Drei underarmen utover mot motstand fra elastikken. Hold 2 sekunder. Vend sakte tilbake. 15 repetisjoner.',
 'Stand with elbow bent 90 degrees and close to body. Hold band in hand. Rotate forearm outward against band resistance. Hold 2 seconds. Return slowly. 15 repetitions.',
 'Akutt rotatorcuff-skade',
 'Hold albuen inntil kroppen gjennom hele bevegelsen.',
 3, 15, 2, '3x_week',
 ARRAY['resistance_band'], ARRAY['strength', 'shoulder', 'rotator_cuff', 'external_rotation'], true, 'custom',
 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/band_external_shoulder_rotation/images/0.jpg'),

(NULL, 'SHLD-STR-003', 'Intern rotasjon med elastikk', 'Internal Rotation with Band',
 'strengthening', 'shoulder', 'beginner',
 'Stå med albuen bøyd 90 grader og inntil kroppen. Hold elastikken festet på siden. Drei underarmen innover mot magen. Hold 2 sekunder. Vend sakte tilbake. 15 repetisjoner.',
 'Stand with elbow bent 90 degrees and close to body. Hold band fixed to side. Rotate forearm inward towards belly. Hold 2 seconds. Return slowly. 15 repetitions.',
 'Akutt rotatorcuff-skade',
 'Ikke kompenser med å løfte albuen.',
 3, 15, 2, '3x_week',
 ARRAY['resistance_band'], ARRAY['strength', 'shoulder', 'rotator_cuff', 'internal_rotation'], true, 'custom',
 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/band_internal_shoulder_rotation/images/0.jpg'),

(NULL, 'SHLD-STRETCH-001', 'Bryst/pectoralis tøyning', 'Chest/Pectoralis Stretch',
 'stretching', 'shoulder', 'beginner',
 'Stå i en døråpning med underarmen mot karmen, albuen i 90 grader. Ta et skritt frem til du kjenner strekk foran på skulder/bryst. Hold 30 sekunder. Gjenta på andre siden.',
 'Stand in doorway with forearm against frame, elbow at 90 degrees. Step forward until you feel stretch in front of shoulder/chest. Hold 30 seconds. Repeat other side.',
 'Akutt skulderskade',
 'Ikke overdriv strekket. Hold skulderen lavt.',
 3, 3, 30, 'daily',
 ARRAY['doorway'], ARRAY['stretch', 'shoulder', 'pectoralis', 'chest'], true, 'custom',
 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/chest_stretch/images/0.jpg'),

(NULL, 'SHLD-STRETCH-002', 'Sleeper stretch', 'Sleeper Stretch',
 'stretching', 'shoulder', 'intermediate',
 'Ligg på siden med skulderen du skal tøye nederst. Bøy albuen 90 grader. Bruk den andre hånden til å presse underarmen ned mot gulvet. Hold 30 sekunder.',
 'Lie on side with shoulder to stretch on bottom. Bend elbow 90 degrees. Use other hand to press forearm down towards floor. Hold 30 seconds.',
 'SLAP-lesjon, skulderinstabilitet',
 'Vær forsiktig. Stopp ved skarp smerte.',
 3, 3, 30, 'daily',
 ARRAY['yoga_mat'], ARRAY['stretch', 'shoulder', 'sleeper', 'posterior_capsule'], true, 'custom',
 NULL),

-- ============================================================================
-- HIP (HOFTE) EXERCISES
-- ============================================================================

(NULL, 'HIP-STRETCH-001', 'Hofteleddsbøyer tøyning (iliopsoas)', 'Hip Flexor Stretch',
 'stretching', 'hip', 'beginner',
 'Knestående utfall: Stå på ett kne med det andre foran deg i 90 grader. Skyv hoften forsiktig fremover til du kjenner strekk foran på hoften bak. Hold 30 sekunder. Bytt side.',
 'Kneeling lunge: Kneel on one knee with other foot in front at 90 degrees. Gently push hip forward until stretch in front of back hip. Hold 30 seconds. Switch sides.',
 'Akutt lyskeskade',
 'Hold overkroppen oppreist. Ikke bøy ryggen for mye bakover.',
 3, 3, 30, 'daily',
 ARRAY['yoga_mat'], ARRAY['stretch', 'hip', 'hip_flexor', 'iliopsoas'], true, 'custom',
 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/hip_flexor_stretch/images/0.jpg'),

(NULL, 'HIP-STRETCH-002', 'Piriformis tøyning', 'Piriformis Stretch',
 'stretching', 'hip', 'beginner',
 'Ligg på ryggen med knærne bøyd. Kryss høyre ankel over venstre kne. Grip bak venstre lår og trekk mot deg. Hold 30 sekunder. Bytt side.',
 'Lie on back with knees bent. Cross right ankle over left knee. Grip behind left thigh and pull towards you. Hold 30 seconds. Switch sides.',
 'Akutt hofte- eller lyskeskade',
 'Hold korsryggen på gulvet. Ikke trekk for hardt.',
 3, 3, 30, 'daily',
 ARRAY['yoga_mat'], ARRAY['stretch', 'hip', 'piriformis', 'glutes'], true, 'custom',
 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/pigeon_stretch/images/0.jpg'),

(NULL, 'HIP-STR-001', 'Gluteus aktivering (bro)', 'Glute Bridge',
 'strengthening', 'hip', 'beginner',
 'Ligg på ryggen med knærne bøyd og føttene i gulvet. Spenn setemuskulaturen og løft hoften mot taket. Hold 3-5 sekunder i toppen. Senk sakte ned. Gjenta 15 ganger.',
 'Lie on back with knees bent and feet on floor. Squeeze glutes and lift hips towards ceiling. Hold 3-5 seconds at top. Lower slowly. Repeat 15 times.',
 'Akutt ryggskade',
 'Ikke hyperekstender ryggen. Stopp når hoften er i linje med knær og skuldre.',
 3, 15, 5, 'daily',
 ARRAY['yoga_mat'], ARRAY['strength', 'hip', 'glute_bridge', 'core'], true, 'custom',
 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/glute_bridge/images/0.jpg'),

(NULL, 'HIP-STR-002', 'Clamshell', 'Clamshell',
 'strengthening', 'hip', 'beginner',
 'Ligg på siden med knærne bøyd 90 grader og hofter stablet. Hold føttene sammen og åpne øverste kne mot taket uten å rotere hoften. Senk sakte tilbake. Gjenta 15 ganger per side.',
 'Lie on side with knees bent 90 degrees and hips stacked. Keep feet together and open top knee towards ceiling without rotating hip. Lower slowly. Repeat 15 times per side.',
 'Akutt hoftesmerter',
 'Hold hoften stabil. Ikke rotér bekken bakover.',
 3, 15, null, 'daily',
 ARRAY['yoga_mat'], ARRAY['strength', 'hip', 'clamshell', 'glute_med'], true, 'custom',
 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/clamshell/images/0.jpg'),

-- ============================================================================
-- BALANCE EXERCISES
-- ============================================================================

(NULL, 'BAL-001', 'Ettbens stående', 'Single Leg Stand',
 'balance', 'lower_extremity', 'beginner',
 'Stå på ett ben i 30 sekunder. Hold noe å støtte deg på i nærheten. Bytt side. For progresjon: lukk øynene, stå på ustabilt underlag, eller beveg hodet.',
 'Stand on one leg for 30 seconds. Keep support nearby. Switch sides. Progress: close eyes, stand on unstable surface, or move head.',
 'Akutt ankelskade',
 'Start med støtte tilgjengelig. Ikke hopp over steg i progresjonen.',
 3, 3, 30, 'daily',
 ARRAY['none'], ARRAY['balance', 'proprioception', 'single_leg'], true, 'custom',
 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/single_leg_stand/images/0.jpg'),

(NULL, 'BAL-002', 'Tandem stand', 'Tandem Stand',
 'balance', 'lower_extremity', 'beginner',
 'Stå med en fot rett foran den andre, hæl til tå. Hold i 30 sekunder. Bytt hvilken fot som er foran. For progresjon: lukk øynene.',
 'Stand with one foot directly in front of the other, heel to toe. Hold 30 seconds. Switch which foot is in front. Progress: close eyes.',
 'Alvorlig balanseforstyrrelse',
 'Ha støtte i nærheten ved oppstart.',
 3, 3, 30, 'daily',
 ARRAY['none'], ARRAY['balance', 'proprioception', 'tandem'], true, 'custom',
 NULL),

-- ============================================================================
-- NERVE GLIDE EXERCISES
-- ============================================================================

(NULL, 'NERVE-001', 'Median nerve glide', 'Median Nerve Glide',
 'nerve_glide', 'upper_extremity', 'intermediate',
 'Strekk armen ut til siden med håndflaten opp. Bøy håndleddet bakover. Bøy og strekk albuen mens du holder håndleddet bøyd. 10 repetisjoner x 3 serier.',
 'Extend arm to side with palm up. Bend wrist back. Flex and extend elbow while keeping wrist bent. 10 reps x 3 sets.',
 'Akutt nerveskade, carpal tunnel i akutt fase',
 'Beveg deg langsomt og rolig. Stopp ved skarpe smerter eller nummenhet som forverres.',
 3, 10, null, 'daily',
 ARRAY['none'], ARRAY['nerve_glide', 'median', 'carpal_tunnel'], true, 'custom',
 NULL),

(NULL, 'NERVE-002', 'Ulnar nerve glide', 'Ulnar Nerve Glide',
 'nerve_glide', 'upper_extremity', 'intermediate',
 'Start med armen ned langs siden. Bøy albuen og før hånden til skulderen med håndflaten mot deg. Strekk håndleddet og fingrene bakover. Gjenta 10 ganger.',
 'Start with arm at side. Bend elbow and bring hand to shoulder with palm towards you. Extend wrist and fingers back. Repeat 10 times.',
 'Akutt nerveskade, cubital tunnel i akutt fase',
 'Beveg deg kontrollert. Stopp ved forverring av symptomer.',
 3, 10, null, 'daily',
 ARRAY['none'], ARRAY['nerve_glide', 'ulnar', 'cubital_tunnel'], true, 'custom',
 NULL),

(NULL, 'NERVE-003', 'Sciatic nerve glide', 'Sciatic Nerve Glide',
 'nerve_glide', 'lower_extremity', 'intermediate',
 'Sitt på en stol. Strekk ut det ene benet mens du bøyer foten oppover. Bøy samtidig nakken fremover. Senk foten og løft hodet. Gjenta 10 ganger. Bytt side.',
 'Sit on chair. Extend one leg while flexing foot upward. Simultaneously flex neck forward. Lower foot and lift head. Repeat 10 times. Switch sides.',
 'Akutt nerveskade, alvorlig diskusprolaps',
 'Bevegelsen skal være myk og kontrollert. Stopp ved økt smerte eller utstråling.',
 3, 10, null, 'daily',
 ARRAY['chair'], ARRAY['nerve_glide', 'sciatic', 'slump'], true, 'custom',
 NULL),

-- ============================================================================
-- BREATHING EXERCISES
-- ============================================================================

(NULL, 'BREATH-001', 'Diafragmapust', 'Diaphragmatic Breathing',
 'breathing', 'core', 'beginner',
 'Ligg på ryggen med en hånd på brystet og en på magen. Pust inn gjennom nesen slik at magen hever seg (ikke brystet). Pust sakte ut gjennom munnen. 10 dype pust.',
 'Lie on back with one hand on chest, one on belly. Breathe in through nose so belly rises (not chest). Exhale slowly through mouth. 10 deep breaths.',
 'Ingen spesifikke kontraindikasjoner',
 'Ikke press for hardt. La pusten være naturlig og avslappet.',
 3, 10, null, 'daily',
 ARRAY['yoga_mat'], ARRAY['breathing', 'core', 'diaphragm', 'relaxation'], true, 'custom',
 NULL),

(NULL, 'BREATH-002', '4-7-8 Pusteøvelse', '4-7-8 Breathing',
 'breathing', 'full_body', 'beginner',
 'Pust inn gjennom nesen i 4 sekunder. Hold pusten i 7 sekunder. Pust ut gjennom munnen i 8 sekunder. Gjenta 4 ganger.',
 'Breathe in through nose for 4 seconds. Hold breath for 7 seconds. Exhale through mouth for 8 seconds. Repeat 4 times.',
 'Akutt angst eller panikk',
 'Start med kortere intervaller hvis det er ubehagelig.',
 1, 4, null, 'daily',
 ARRAY['none'], ARRAY['breathing', 'relaxation', '4_7_8'], true, 'custom',
 NULL)

ON CONFLICT (organization_id, code) DO NOTHING;

-- ============================================================================
-- EXERCISE PROGRAMS (Templates)
-- ============================================================================

INSERT INTO exercise_programs (
  organization_id, name_no, name_en, description_no, description_en,
  target_condition, body_region, difficulty, exercises, duration_weeks, phases, is_global
) VALUES

-- Neck Pain Program
(NULL, 'Nakkesmerter - Grunnprogram', 'Neck Pain - Basic Program',
 'Et grunnleggende program for pasienter med kroniske eller subakutte nakkesmerter. Fokuserer på mobilitet, holdning og styrke.',
 'A basic program for patients with chronic or subacute neck pain. Focuses on mobility, posture, and strength.',
 'neck_pain', 'cervical', 'beginner',
 '[
   {"exercise_code": "CERV-MOB-002", "exercise_name": "Hakeinntrykk (chin tuck)", "order": 1, "sets": 3, "reps": 10, "hold_seconds": 10, "frequency": "daily", "phase": 1, "notes": "Viktig for holdningskorreksjon"},
   {"exercise_code": "CERV-STRETCH-001", "exercise_name": "Nakke sidebøy tøyning", "order": 2, "sets": 3, "reps": 3, "hold_seconds": 30, "frequency": "daily", "phase": 1},
   {"exercise_code": "CERV-STRETCH-003", "exercise_name": "Øvre trapezius tøyning", "order": 3, "sets": 3, "reps": 3, "hold_seconds": 30, "frequency": "daily", "phase": 1},
   {"exercise_code": "CERV-STR-001", "exercise_name": "Isometrisk nakke styrke", "order": 4, "sets": 3, "reps": 5, "hold_seconds": 10, "frequency": "daily", "phase": 2, "notes": "Legg til etter 1-2 uker"}
 ]',
 6, 2, true),

-- Low Back Pain Program
(NULL, 'Korsrygg - McGill Big 3', 'Low Back - McGill Big 3',
 'Dr. Stuart McGills tre kjerneøvelser for korsryggstabilitet. Trygt og effektivt for de fleste ryggpasienter.',
 'Dr. Stuart McGills three core exercises for low back stability. Safe and effective for most back patients.',
 'low_back_pain', 'lumbar', 'beginner',
 '[
   {"exercise_code": "LUMB-STR-001", "exercise_name": "McGill curl-up", "order": 1, "sets": 3, "reps": 10, "hold_seconds": 10, "frequency": "daily", "phase": 1},
   {"exercise_code": "LUMB-STR-002", "exercise_name": "Sidebrett (side plank)", "order": 2, "sets": 3, "reps": 3, "hold_seconds": 15, "frequency": "daily", "phase": 1, "notes": "Start med modifisert versjon"},
   {"exercise_code": "LUMB-STR-003", "exercise_name": "Bird-dog", "order": 3, "sets": 3, "reps": 10, "hold_seconds": 10, "frequency": "daily", "phase": 1}
 ]',
 8, 1, true),

-- Shoulder Rehab Program
(NULL, 'Skulder - Rotatorcuff rehabilitering', 'Shoulder - Rotator Cuff Rehabilitation',
 'Progressivt program for rotatorcuff-problematikk. Starter med mobilitet og går over til styrke.',
 'Progressive program for rotator cuff issues. Starts with mobility and progresses to strengthening.',
 'shoulder_impingement', 'shoulder', 'beginner',
 '[
   {"exercise_code": "SHLD-STR-001", "exercise_name": "Pendel øvelse", "order": 1, "sets": 3, "reps": 1, "hold_seconds": 60, "frequency": "daily", "phase": 1, "notes": "Smertelindring og mobilitet"},
   {"exercise_code": "SHLD-STRETCH-001", "exercise_name": "Bryst/pectoralis tøyning", "order": 2, "sets": 3, "reps": 3, "hold_seconds": 30, "frequency": "daily", "phase": 1},
   {"exercise_code": "SHLD-STR-002", "exercise_name": "Ekstern rotasjon med elastikk", "order": 3, "sets": 3, "reps": 15, "hold_seconds": 2, "frequency": "3x_week", "phase": 2, "notes": "Start med lett motstand"},
   {"exercise_code": "SHLD-STR-003", "exercise_name": "Intern rotasjon med elastikk", "order": 4, "sets": 3, "reps": 15, "hold_seconds": 2, "frequency": "3x_week", "phase": 2}
 ]',
 8, 2, true),

-- Posture Improvement
(NULL, 'Holdningskorrigering', 'Posture Correction',
 'Program for å forbedre holdning, spesielt for kontorarbeidere med fremskutt hode og runde skuldre.',
 'Program to improve posture, especially for office workers with forward head and rounded shoulders.',
 'poor_posture', 'full_body', 'beginner',
 '[
   {"exercise_code": "CERV-MOB-002", "exercise_name": "Hakeinntrykk (chin tuck)", "order": 1, "sets": 5, "reps": 10, "hold_seconds": 10, "frequency": "daily", "notes": "Gjør flere ganger daglig"},
   {"exercise_code": "THOR-MOB-003", "exercise_name": "Brugger hvileposisjon", "order": 2, "sets": 5, "reps": 1, "hold_seconds": 30, "frequency": "daily", "notes": "Hver time på jobb"},
   {"exercise_code": "SHLD-STRETCH-001", "exercise_name": "Bryst/pectoralis tøyning", "order": 3, "sets": 3, "reps": 3, "hold_seconds": 30, "frequency": "daily"},
   {"exercise_code": "THOR-STR-001", "exercise_name": "Rhomboid styrke med elastikk", "order": 4, "sets": 3, "reps": 15, "hold_seconds": 3, "frequency": "3x_week", "phase": 2}
 ]',
 6, 2, true),

-- Balance Program
(NULL, 'Balanse og propriosepsjon', 'Balance and Proprioception',
 'Grunnprogram for å forbedre balanse og kroppskontroll. Egner seg for eldre og de med ankelproblemer.',
 'Basic program to improve balance and body awareness. Suitable for elderly and those with ankle issues.',
 'balance_deficit', 'lower_extremity', 'beginner',
 '[
   {"exercise_code": "BAL-002", "exercise_name": "Tandem stand", "order": 1, "sets": 3, "reps": 3, "hold_seconds": 30, "frequency": "daily", "phase": 1},
   {"exercise_code": "BAL-001", "exercise_name": "Ettbens stående", "order": 2, "sets": 3, "reps": 3, "hold_seconds": 30, "frequency": "daily", "phase": 1},
   {"exercise_code": "HIP-STR-001", "exercise_name": "Gluteus aktivering (bro)", "order": 3, "sets": 3, "reps": 15, "hold_seconds": 5, "frequency": "daily", "phase": 1}
 ]',
 4, 1, true)

ON CONFLICT DO NOTHING;

-- ============================================================================
-- FOOT AND ANKLE EXERCISES
-- ============================================================================

INSERT INTO exercise_library (
  organization_id, code, name_no, name_en, category, body_region, difficulty,
  instructions_no, instructions_en, contraindications, precautions,
  default_sets, default_reps, default_hold_seconds, default_frequency,
  equipment_needed, tags, is_global, source, image_url
) VALUES

-- Foot intrinsic exercises
(NULL, 'FOOT-001', 'Håndkle-skrukking', 'Towel Scrunches',
 'strengthening', 'foot', 'beginner',
 'Sitt med føttene flate på gulvet med et håndkle under tærne. Bruk tærne til å skrukke håndkleet mot deg. Slapp av og gjenta. Gjør 3 sett med 15 repetisjoner.',
 'Sit with feet flat on floor with a towel under your toes. Use your toes to scrunch the towel towards you. Relax and repeat. Do 3 sets of 15 repetitions.',
 'Akutt fot- eller tåskade',
 'Start med lett motstand. Øk gradvis.',
 3, 15, null, 'daily',
 ARRAY['towel'], ARRAY['strength', 'foot', 'intrinsic', 'plantar_fascia'], true, 'custom',
 NULL),

(NULL, 'FOOT-002', 'Kuleplukking med tær', 'Marble Pickup',
 'strengthening', 'foot', 'beginner',
 'Plasser 10-20 kuler eller små gjenstander på gulvet. Bruk tærne til å plukke opp én om gangen og legg dem i en kopp. Gjør alle kulene med én fot, deretter bytt.',
 'Place 10-20 marbles or small objects on the floor. Use your toes to pick up one at a time and place in a cup. Complete all with one foot, then switch.',
 'Akutt fot- eller tåskade',
 'Sitt stabilt. Unngå å bøye deg for mye frem.',
 1, 20, null, 'daily',
 ARRAY['marbles'], ARRAY['strength', 'foot', 'intrinsic', 'dexterity'], true, 'custom',
 NULL),

(NULL, 'FOOT-003', 'Tåhev (calf raises)', 'Calf Raises',
 'strengthening', 'ankle', 'beginner',
 'Stå med føttene hoftebreddes fra hverandre. Løft deg opp på tærne så høyt du kan. Hold 2 sekunder i toppen. Senk sakte ned. Gjenta 15 ganger. For økt vanskelighet: stå på ett ben.',
 'Stand with feet hip-width apart. Rise up on your toes as high as you can. Hold 2 seconds at top. Lower slowly. Repeat 15 times. For progression: do single leg.',
 'Akutt achillestendinopati, akutt ankelskade',
 'Hold deg i noe for balanse ved behov. Kontroller ned-fasen.',
 3, 15, 2, 'daily',
 ARRAY['none'], ARRAY['strength', 'ankle', 'calf', 'gastrocnemius'], true, 'custom',
 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/calf_raise/images/0.jpg'),

(NULL, 'FOOT-004', 'Ettbens balanse', 'Single Leg Balance',
 'balance', 'ankle', 'beginner',
 'Stå på ett ben med kneet lett bøyd. Hold i 30 sekunder. Bytt side. Progresjon: lukk øynene, stå på ustabilt underlag, eller beveg hodet.',
 'Stand on one leg with knee slightly bent. Hold for 30 seconds. Switch sides. Progress: close eyes, stand on unstable surface, or move head.',
 'Akutt ankelskade, alvorlig balanseforstyrrelse',
 'Ha støtte tilgjengelig. Ikke hopp over steg i progresjonen.',
 3, 3, 30, 'daily',
 ARRAY['none'], ARRAY['balance', 'ankle', 'proprioception', 'single_leg'], true, 'custom',
 NULL),

(NULL, 'FOOT-005', 'Hælgang', 'Heel Walks',
 'strengthening', 'ankle', 'beginner',
 'Stå på hælene med tærne løftet fra gulvet. Gå fremover 10-15 meter mens du holder tærne oppe. Snu og gå tilbake. Gjenta 3 ganger.',
 'Stand on your heels with toes lifted off the floor. Walk forward 10-15 meters keeping toes up. Turn and walk back. Repeat 3 times.',
 'Akutt leggskade, fotdropp',
 'Hold deg i noe ved oppstart hvis ustabil.',
 3, 1, null, 'daily',
 ARRAY['none'], ARRAY['strength', 'ankle', 'tibialis_anterior', 'gait'], true, 'custom',
 NULL),

(NULL, 'FOOT-006', 'Tågang', 'Toe Walks',
 'strengthening', 'ankle', 'beginner',
 'Stå på tærne og gå fremover 10-15 meter. Hold hælene høyt oppe under hele gangen. Snu og gå tilbake. Gjenta 3 ganger.',
 'Stand on your toes and walk forward 10-15 meters. Keep heels high throughout. Turn and walk back. Repeat 3 times.',
 'Akutt achillestendinopati, ustabil ankel',
 'Start med korte avstander. Øk gradvis.',
 3, 1, null, 'daily',
 ARRAY['none'], ARRAY['strength', 'ankle', 'calf', 'gait'], true, 'custom',
 NULL),

(NULL, 'FOOT-007', 'Ankelstyrke med elastikk', 'Resisted Ankle Movements',
 'strengthening', 'ankle', 'intermediate',
 'Fest en elastikk rundt forfoten. Utfør plantarfleksjon (pek tå ned), dorsalfleksjon (trekk tå opp), inversjon (vri innover) og eversjon (vri utover). 15 reps i hver retning.',
 'Attach a resistance band around forefoot. Perform plantarflexion (point toe down), dorsiflexion (pull toe up), inversion (turn in) and eversion (turn out). 15 reps each direction.',
 'Akutt ligamentskade, ustabil ankel',
 'Start med lett motstand. Kontroller bevegelsen.',
 3, 15, null, '3x_week',
 ARRAY['resistance_band'], ARRAY['strength', 'ankle', 'all_directions', 'stability'], true, 'custom',
 NULL),

(NULL, 'FOOT-008', 'Plyometriske hopp', 'Plyometric Hops',
 'strengthening', 'ankle', 'advanced',
 'Start med begge føtter på gulvet. Hopp opp og land mykt på forfoten. Start med lave hopp og øk gradvis høyden. 3 sett med 10 hopp. Progresjon: ettbens hopp.',
 'Start with both feet on floor. Jump up and land softly on forefoot. Start with low hops and gradually increase height. 3 sets of 10 hops. Progress: single leg hops.',
 'Akutt ankelskade, akillestendinopati, operasjoner under tilheling',
 'Varm opp godt først. Land mykt med god teknikk.',
 3, 10, null, '3x_week',
 ARRAY['none'], ARRAY['strength', 'ankle', 'plyometric', 'power', 'advanced'], true, 'custom',
 NULL)

ON CONFLICT (organization_id, code) DO NOTHING;

-- ============================================================================
-- PROGRESSION PROGRAM TEMPLATES
-- ============================================================================

INSERT INTO exercise_programs (
  organization_id, name_no, name_en, description_no, description_en,
  target_condition, body_region, difficulty, exercises, duration_weeks, phases, is_global
) VALUES

-- Vestibular Gaze Stabilization Program (uses existing OPK exercises from bppv_exercise_library)
(NULL, 'Vestibulær blikk-stabilisering - 3 nivåer', 'Vestibular Gaze Stabilization - 3 Levels',
 'Progressivt program for vestibulær rehabilitering etter BPPV eller ved unilateral vestibulær svakhet. Bruker optokinetiske øvelser for å stimulere vestibulær kompensasjon.',
 'Progressive program for vestibular rehabilitation after BPPV or with unilateral vestibular weakness. Uses optokinetic exercises to stimulate vestibular compensation.',
 'vestibular_dysfunction', 'full_body', 'beginner',
 '[
   {"exercise_code": "OPK_HOYRE", "exercise_name": "OPK Høyre", "order": 1, "sets": 1, "reps": 1, "hold_seconds": 120, "frequency": "3x_daily", "phase": 1, "notes": "Start med 30 sek, øk til 2 min"},
   {"exercise_code": "OPK_VENSTRE", "exercise_name": "OPK Venstre", "order": 2, "sets": 1, "reps": 1, "hold_seconds": 120, "frequency": "3x_daily", "phase": 1, "notes": "Start med 30 sek, øk til 2 min"},
   {"exercise_code": "OPK_NED", "exercise_name": "OPK Ned", "order": 3, "sets": 1, "reps": 1, "hold_seconds": 120, "frequency": "3x_daily", "phase": 2, "notes": "Legg til etter uke 2"},
   {"exercise_code": "OPK_NED_HOYRE", "exercise_name": "OPK Ned Høyre", "order": 4, "sets": 1, "reps": 1, "hold_seconds": 120, "frequency": "3x_daily", "phase": 3, "notes": "Avansert - diagonal stimulering"}
 ]',
 6, 3, true),

-- Foot and Ankle Rehabilitation Program
(NULL, 'Fot og ankel rehabilitering - 3 nivåer', 'Foot and Ankle Rehabilitation - 3 Levels',
 'Progressivt program for fot- og ankelrehabilitering. Starter med grunnleggende styrke og balanse, progredierer til avanserte øvelser.',
 'Progressive program for foot and ankle rehabilitation. Starts with basic strength and balance, progresses to advanced exercises.',
 'ankle_sprain', 'ankle', 'beginner',
 '[
   {"exercise_code": "FOOT-001", "exercise_name": "Håndkle-skrukking", "order": 1, "sets": 3, "reps": 15, "frequency": "daily", "phase": 1, "notes": "Fase 1: Grunnleggende styrke"},
   {"exercise_code": "FOOT-002", "exercise_name": "Kuleplukking med tær", "order": 2, "sets": 1, "reps": 20, "frequency": "daily", "phase": 1},
   {"exercise_code": "FOOT-003", "exercise_name": "Tåhev", "order": 3, "sets": 3, "reps": 15, "hold_seconds": 2, "frequency": "daily", "phase": 1},
   {"exercise_code": "FOOT-004", "exercise_name": "Ettbens balanse", "order": 4, "sets": 3, "reps": 3, "hold_seconds": 30, "frequency": "daily", "phase": 2, "notes": "Fase 2: Balanse og propriosepsjon"},
   {"exercise_code": "FOOT-005", "exercise_name": "Hælgang", "order": 5, "sets": 3, "reps": 1, "frequency": "daily", "phase": 2},
   {"exercise_code": "FOOT-006", "exercise_name": "Tågang", "order": 6, "sets": 3, "reps": 1, "frequency": "daily", "phase": 2},
   {"exercise_code": "FOOT-007", "exercise_name": "Ankelstyrke med elastikk", "order": 7, "sets": 3, "reps": 15, "frequency": "3x_week", "phase": 3, "notes": "Fase 3: Avansert styrke"},
   {"exercise_code": "FOOT-008", "exercise_name": "Plyometriske hopp", "order": 8, "sets": 3, "reps": 10, "frequency": "3x_week", "phase": 3, "notes": "Kun når smerte- og hevningsfri"}
 ]',
 8, 3, true),

-- Low Back McGill Big 3 with Progression
(NULL, 'Korsrygg McGill Big 3 - Progressiv', 'Low Back McGill Big 3 - Progressive',
 'Dr. Stuart McGills tre kjerneøvelser med progressiv økning av holdetid og repetisjoner over 6 uker.',
 'Dr. Stuart McGills three core exercises with progressive increase in hold time and repetitions over 6 weeks.',
 'low_back_pain', 'lumbar', 'beginner',
 '[
   {"exercise_code": "LUMB-STR-001", "exercise_name": "McGill curl-up", "order": 1, "sets": 3, "reps": 6, "hold_seconds": 8, "frequency": "daily", "phase": 1, "notes": "Uke 1-2: 6 reps x 8 sek hold"},
   {"exercise_code": "LUMB-STR-002", "exercise_name": "Sidebrett (side plank)", "order": 2, "sets": 3, "reps": 3, "hold_seconds": 10, "frequency": "daily", "phase": 1, "notes": "Start modifisert på knær"},
   {"exercise_code": "LUMB-STR-003", "exercise_name": "Bird-dog", "order": 3, "sets": 3, "reps": 6, "hold_seconds": 8, "frequency": "daily", "phase": 1},
   {"exercise_code": "LUMB-STR-001", "exercise_name": "McGill curl-up", "order": 4, "sets": 3, "reps": 8, "hold_seconds": 10, "frequency": "daily", "phase": 2, "notes": "Uke 3-4: Øk til 8 reps x 10 sek"},
   {"exercise_code": "LUMB-STR-002", "exercise_name": "Sidebrett (side plank)", "order": 5, "sets": 3, "reps": 3, "hold_seconds": 20, "frequency": "daily", "phase": 2, "notes": "Full versjon med strake ben"},
   {"exercise_code": "LUMB-STR-003", "exercise_name": "Bird-dog", "order": 6, "sets": 3, "reps": 8, "hold_seconds": 10, "frequency": "daily", "phase": 2},
   {"exercise_code": "LUMB-STR-001", "exercise_name": "McGill curl-up", "order": 7, "sets": 4, "reps": 10, "hold_seconds": 12, "frequency": "daily", "phase": 3, "notes": "Uke 5-6: 10 reps x 12 sek, 4 sett"},
   {"exercise_code": "LUMB-STR-002", "exercise_name": "Sidebrett (side plank)", "order": 8, "sets": 3, "reps": 3, "hold_seconds": 30, "frequency": "daily", "phase": 3, "notes": "Mål: 30 sekunder hold"},
   {"exercise_code": "LUMB-STR-003", "exercise_name": "Bird-dog", "order": 9, "sets": 4, "reps": 10, "hold_seconds": 12, "frequency": "daily", "phase": 3}
 ]',
 6, 3, true)

ON CONFLICT DO NOTHING;

-- ============================================================================
-- SEED COMPLETE
-- ============================================================================
