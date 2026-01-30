-- Exercise Library System
-- Provides exercise prescription, delivery, and patient portal functionality
-- Norwegian healthcare compliance (Pasientjournalloven)

-- ============================================================================
-- EXERCISE LIBRARY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS exercise_library (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Exercise details
    name VARCHAR(255) NOT NULL,
    name_norwegian VARCHAR(255),
    description TEXT,
    description_norwegian TEXT,

    -- Categorization
    category VARCHAR(100) NOT NULL, -- 'Cervical', 'Lumbar', 'Shoulder', 'Hip', 'Knee', 'Balance', 'Core', etc.
    subcategory VARCHAR(100), -- 'Stretching', 'Strengthening', 'Mobility', 'Stability', etc.
    body_region VARCHAR(100), -- 'Neck', 'Upper Back', 'Lower Back', 'Shoulder', etc.
    difficulty_level VARCHAR(20) DEFAULT 'beginner', -- 'beginner', 'intermediate', 'advanced'

    -- Instructions
    instructions TEXT NOT NULL,
    instructions_norwegian TEXT,
    sets_default INTEGER DEFAULT 3,
    reps_default INTEGER DEFAULT 10,
    hold_seconds INTEGER,
    frequency_per_day INTEGER DEFAULT 1,
    frequency_per_week INTEGER DEFAULT 7,
    duration_weeks INTEGER DEFAULT 4,

    -- Media
    image_url TEXT,
    video_url TEXT,
    thumbnail_url TEXT,

    -- Contraindications and precautions
    contraindications TEXT[],
    precautions TEXT[],

    -- Metadata
    is_active BOOLEAN DEFAULT true,
    is_system BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    display_order INTEGER DEFAULT 0,
    tags TEXT[],

    -- Audit
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- EXERCISE PRESCRIPTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS exercise_prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Patient and encounter
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    encounter_id UUID REFERENCES clinical_encounters(id) ON DELETE SET NULL,

    -- Prescription details
    prescribed_by UUID NOT NULL REFERENCES users(id),
    prescribed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,

    -- Status
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'cancelled', 'paused'

    -- Notes
    clinical_notes TEXT,
    patient_instructions TEXT,

    -- Delivery
    delivery_method VARCHAR(50) DEFAULT 'portal', -- 'portal', 'email', 'print', 'sms_link'
    email_sent_at TIMESTAMP WITH TIME ZONE,
    email_delivered BOOLEAN DEFAULT false,

    -- Portal access
    portal_access_token UUID DEFAULT gen_random_uuid(),
    portal_expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '90 days'),
    portal_last_accessed TIMESTAMP WITH TIME ZONE,
    portal_view_count INTEGER DEFAULT 0,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PRESCRIBED EXERCISES (Junction table)
-- ============================================================================

CREATE TABLE IF NOT EXISTS prescribed_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID NOT NULL REFERENCES exercise_prescriptions(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercise_library(id) ON DELETE CASCADE,

    -- Custom parameters (override library defaults)
    sets INTEGER,
    reps INTEGER,
    hold_seconds INTEGER,
    frequency_per_day INTEGER,
    frequency_per_week INTEGER,

    -- Custom instructions
    custom_instructions TEXT,

    -- Order
    display_order INTEGER DEFAULT 0,

    -- Status tracking
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- EXERCISE PROGRESS TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS exercise_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID NOT NULL REFERENCES exercise_prescriptions(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercise_library(id) ON DELETE CASCADE,

    -- Progress entry
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sets_completed INTEGER,
    reps_completed INTEGER,

    -- Feedback
    difficulty_rating INTEGER CHECK (difficulty_rating BETWEEN 1 AND 5),
    pain_rating INTEGER CHECK (pain_rating BETWEEN 0 AND 10),
    notes TEXT,

    -- Source
    source VARCHAR(20) DEFAULT 'portal' -- 'portal', 'clinician', 'app'
);

-- ============================================================================
-- AUTO-ACCEPT SETTINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS auto_accept_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Appointment auto-accept
    auto_accept_appointments BOOLEAN DEFAULT false,
    appointment_accept_delay_minutes INTEGER DEFAULT 0,
    appointment_types_included TEXT[], -- NULL means all types
    appointment_types_excluded TEXT[],
    appointment_max_daily_limit INTEGER, -- NULL means no limit
    appointment_business_hours_only BOOLEAN DEFAULT true,

    -- Referral auto-accept
    auto_accept_referrals BOOLEAN DEFAULT false,
    referral_accept_delay_minutes INTEGER DEFAULT 0,
    referral_sources_included TEXT[], -- Specific referral sources to auto-accept
    referral_sources_excluded TEXT[],
    referral_require_complete_info BOOLEAN DEFAULT true,

    -- Notifications
    notify_on_auto_accept BOOLEAN DEFAULT true,
    notification_email TEXT,
    notification_sms TEXT,

    -- Audit
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(organization_id)
);

-- ============================================================================
-- AUTO-ACCEPT LOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS auto_accept_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- What was auto-accepted
    resource_type VARCHAR(50) NOT NULL, -- 'appointment', 'referral'
    resource_id UUID NOT NULL,

    -- Status
    action VARCHAR(20) NOT NULL, -- 'accepted', 'rejected', 'pending'
    reason TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- USER MACRO PREFERENCES (for macro reordering)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_macro_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Category ordering
    category_order JSONB DEFAULT '[]'::jsonb,

    -- Hidden categories
    hidden_categories TEXT[] DEFAULT '{}',

    -- Custom categories
    custom_categories JSONB DEFAULT '[]'::jsonb,

    -- Favorite macros order
    favorite_macro_order UUID[] DEFAULT '{}',

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id, organization_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Exercise library indexes
CREATE INDEX idx_exercise_lib_org ON exercise_library(organization_id);
CREATE INDEX idx_exercise_lib_category ON exercise_library(organization_id, category, subcategory);
CREATE INDEX idx_exercise_lib_body_region ON exercise_library(organization_id, body_region);
CREATE INDEX idx_exercise_lib_active ON exercise_library(organization_id, is_active) WHERE is_active = true;
CREATE INDEX idx_exercise_lib_tags ON exercise_library USING GIN(tags);

-- Full-text search for exercises
CREATE INDEX idx_exercise_lib_search ON exercise_library
USING GIN (to_tsvector('norwegian', COALESCE(name_norwegian, name) || ' ' || COALESCE(description_norwegian, description, '')));

-- Prescription indexes
CREATE INDEX idx_prescriptions_patient ON exercise_prescriptions(patient_id, status);
CREATE INDEX idx_prescriptions_encounter ON exercise_prescriptions(encounter_id);
CREATE INDEX idx_prescriptions_org ON exercise_prescriptions(organization_id);
CREATE INDEX idx_prescriptions_portal_token ON exercise_prescriptions(portal_access_token);
CREATE INDEX idx_prescriptions_active ON exercise_prescriptions(patient_id, status) WHERE status = 'active';

-- Prescribed exercises indexes
CREATE INDEX idx_prescribed_exercises_prescription ON prescribed_exercises(prescription_id);
CREATE INDEX idx_prescribed_exercises_exercise ON prescribed_exercises(exercise_id);

-- Progress tracking indexes
CREATE INDEX idx_progress_patient ON exercise_progress(patient_id, completed_at DESC);
CREATE INDEX idx_progress_prescription ON exercise_progress(prescription_id, completed_at DESC);

-- Auto-accept indexes
CREATE INDEX idx_auto_accept_settings_org ON auto_accept_settings(organization_id);
CREATE INDEX idx_auto_accept_log_org ON auto_accept_log(organization_id, created_at DESC);
CREATE INDEX idx_auto_accept_log_resource ON auto_accept_log(resource_type, resource_id);

-- User macro preferences
CREATE INDEX idx_user_macro_prefs ON user_macro_preferences(user_id, organization_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update timestamp triggers
CREATE OR REPLACE FUNCTION update_exercise_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_exercise_lib_timestamp
BEFORE UPDATE ON exercise_library
FOR EACH ROW
EXECUTE FUNCTION update_exercise_timestamp();

CREATE TRIGGER trigger_prescription_timestamp
BEFORE UPDATE ON exercise_prescriptions
FOR EACH ROW
EXECUTE FUNCTION update_exercise_timestamp();

CREATE TRIGGER trigger_auto_accept_timestamp
BEFORE UPDATE ON auto_accept_settings
FOR EACH ROW
EXECUTE FUNCTION update_exercise_timestamp();

CREATE TRIGGER trigger_macro_prefs_timestamp
BEFORE UPDATE ON user_macro_preferences
FOR EACH ROW
EXECUTE FUNCTION update_exercise_timestamp();

-- ============================================================================
-- SEED EXERCISE LIBRARY (Norwegian chiropractic exercises)
-- ============================================================================

CREATE OR REPLACE FUNCTION seed_exercise_library(p_organization_id UUID)
RETURNS void AS $$
BEGIN
    INSERT INTO exercise_library (
        organization_id, name, name_norwegian, category, subcategory, body_region,
        difficulty_level, instructions, instructions_norwegian,
        sets_default, reps_default, hold_seconds, is_system, display_order
    ) VALUES
    -- Cervical/Neck Exercises
    (p_organization_id, 'Chin Tucks', 'Hakeinndragning', 'Cervical', 'Strengthening', 'Neck',
     'beginner',
     'Sit or stand with good posture. Gently draw your chin back as if making a double chin. Hold for 5 seconds, then relax. Keep your eyes level - do not look down.',
     'Sitt eller stå med god holdning. Trekk haken forsiktig inn som om du lager dobbelhake. Hold i 5 sekunder, slipp så av. Hold blikket rett frem - ikke se ned.',
     3, 10, 5, true, 1),

    (p_organization_id, 'Neck Rotation Stretch', 'Nakkerotasjon tøyning', 'Cervical', 'Stretching', 'Neck',
     'beginner',
     'Sit tall with shoulders relaxed. Slowly turn your head to look over one shoulder. Hold for 15-30 seconds. Return to center and repeat on the other side.',
     'Sitt oppreist med avslappede skuldre. Drei hodet sakte for å se over den ene skulderen. Hold i 15-30 sekunder. Gå tilbake til midten og gjenta på andre siden.',
     2, 3, 20, true, 2),

    (p_organization_id, 'Levator Scapulae Stretch', 'Tøyning av levator scapulae', 'Cervical', 'Stretching', 'Neck',
     'beginner',
     'Sit tall. Turn your head 45 degrees to one side. Gently tilt your head down as if looking at your pocket. Use your hand to apply gentle pressure. Hold for 30 seconds.',
     'Sitt oppreist. Drei hodet 45 grader til en side. Bøy hodet forsiktig ned som om du ser ned i lommen. Bruk hånden til å legge lett press. Hold i 30 sekunder.',
     2, 3, 30, true, 3),

    -- Thoracic/Upper Back Exercises
    (p_organization_id, 'Thoracic Extension over Foam Roller', 'Thorakal ekstensjon over skumrulle', 'Thoracic', 'Mobility', 'Upper Back',
     'intermediate',
     'Lie on your back with a foam roller under your upper back. Support your head with your hands. Gently extend backward over the roller. Move the roller to different levels of the spine.',
     'Ligg på ryggen med en skumrulle under øvre rygg. Støtt hodet med hendene. Strekk forsiktig bakover over rullen. Flytt rullen til ulike nivåer av ryggraden.',
     3, 10, 3, true, 10),

    (p_organization_id, 'Cat-Cow Stretch', 'Katt-ku tøyning', 'Thoracic', 'Mobility', 'Upper Back',
     'beginner',
     'Start on hands and knees. Arch your back up toward the ceiling (cat). Then let your belly drop toward the floor while lifting your head (cow). Move slowly between positions.',
     'Start på alle fire. Krum ryggen opp mot taket (katt). La så magen synke mot gulvet mens du løfter hodet (ku). Beveg deg sakte mellom posisjonene.',
     3, 10, 3, true, 11),

    -- Lumbar/Lower Back Exercises
    (p_organization_id, 'Pelvic Tilts', 'Bekkenvipp', 'Lumbar', 'Stability', 'Lower Back',
     'beginner',
     'Lie on your back with knees bent, feet flat on floor. Flatten your lower back against the floor by tightening your abdominal muscles and tilting your pelvis slightly. Hold for 5 seconds.',
     'Ligg på ryggen med bøyde knær, føttene flatt på gulvet. Press korsryggen mot gulvet ved å spenne magemusklene og vippe bekkenet lett. Hold i 5 sekunder.',
     3, 15, 5, true, 20),

    (p_organization_id, 'Bird Dog', 'Fuglehund', 'Lumbar', 'Stability', 'Lower Back',
     'intermediate',
     'Start on hands and knees. Extend one arm forward and the opposite leg backward. Keep your back flat and core engaged. Hold for 5 seconds, then switch sides.',
     'Start på alle fire. Strekk en arm fremover og motsatt ben bakover. Hold ryggen flat og kjernen aktivert. Hold i 5 sekunder, bytt så side.',
     3, 10, 5, true, 21),

    (p_organization_id, 'McKenzie Extension', 'McKenzie ekstensjon', 'Lumbar', 'Mobility', 'Lower Back',
     'beginner',
     'Lie face down with hands under shoulders. Push your upper body up while keeping your hips on the floor. Hold briefly, then lower. Progress by holding longer.',
     'Ligg på magen med hendene under skuldrene. Press overkroppen opp mens hoftene er på gulvet. Hold kort, senk så ned. Progresjon ved å holde lenger.',
     3, 10, 3, true, 22),

    (p_organization_id, 'Knee to Chest Stretch', 'Kne til bryst tøyning', 'Lumbar', 'Stretching', 'Lower Back',
     'beginner',
     'Lie on your back. Bring one knee to your chest, holding behind the thigh. Keep the other leg straight or bent. Hold for 30 seconds. Repeat on the other side.',
     'Ligg på ryggen. Trekk ett kne mot brystet, hold bak låret. Hold det andre benet rett eller bøyd. Hold i 30 sekunder. Gjenta på andre siden.',
     2, 3, 30, true, 23),

    -- Shoulder Exercises
    (p_organization_id, 'Pendulum Exercise', 'Pendelbevegelese', 'Shoulder', 'Mobility', 'Shoulder',
     'beginner',
     'Lean forward supporting yourself with one hand on a table. Let your affected arm hang down. Gently swing your arm in small circles, then in a forward-backward motion.',
     'Len deg fremover og støtt deg med en hånd på et bord. La den affiserte armen henge ned. Sving armen forsiktig i små sirkler, deretter frem og tilbake.',
     3, 20, 0, true, 30),

    (p_organization_id, 'External Rotation with Band', 'Utadrotasjon med strikk', 'Shoulder', 'Strengthening', 'Shoulder',
     'intermediate',
     'Hold a resistance band with elbows bent 90 degrees and tucked at sides. Rotate forearms outward keeping elbows at sides. Return slowly.',
     'Hold en treningsstrikk med albuene bøyd 90 grader og inntil sidene. Roter underarmene utover mens albuene holdes ved sidene. Gå sakte tilbake.',
     3, 15, 0, true, 31),

    -- Hip Exercises
    (p_organization_id, 'Clamshells', 'Muslingøvelse', 'Hip', 'Strengthening', 'Hip',
     'beginner',
     'Lie on your side with knees bent. Keeping feet together, lift your top knee like a clamshell opening. Keep your pelvis stable. Lower slowly.',
     'Ligg på siden med bøyde knær. Hold føttene sammen og løft det øverste kneet som en musling som åpner seg. Hold bekkenet stabilt. Senk sakte.',
     3, 15, 0, true, 40),

    (p_organization_id, 'Hip Flexor Stretch', 'Hoftefleksor tøyning', 'Hip', 'Stretching', 'Hip',
     'beginner',
     'Kneel on one knee with the other foot in front. Push your hips forward while keeping your back straight. You should feel a stretch in the front of your hip.',
     'Knekne på ett kne med den andre foten foran. Press hoftene fremover mens ryggen holdes rett. Du skal kjenne en strekk foran i hoften.',
     2, 3, 30, true, 41),

    -- Core/Stability Exercises
    (p_organization_id, 'Dead Bug', 'Død bille', 'Core', 'Stability', 'Core',
     'intermediate',
     'Lie on your back with arms extended toward ceiling, knees bent 90 degrees. Slowly lower opposite arm and leg toward floor while keeping your back flat. Return and repeat on other side.',
     'Ligg på ryggen med armene strukket mot taket, knærne bøyd 90 grader. Senk sakte motsatt arm og ben mot gulvet mens ryggen holdes flat. Gå tilbake og gjenta på andre siden.',
     3, 10, 0, true, 50),

    (p_organization_id, 'Plank', 'Planke', 'Core', 'Strengthening', 'Core',
     'intermediate',
     'Start in a push-up position on forearms. Keep your body in a straight line from head to heels. Engage your core and hold. Do not let your hips sag or pike up.',
     'Start i en armhevingsposisjon på underarmene. Hold kroppen i en rett linje fra hodet til hælene. Aktiver kjernemuskulaturen og hold. Ikke la hoftene synke eller stikke opp.',
     3, 1, 30, true, 51),

    (p_organization_id, 'Side Plank', 'Sideplanke', 'Core', 'Strengthening', 'Core',
     'intermediate',
     'Lie on your side with forearm on the floor. Lift your hips to create a straight line from head to feet. Keep your core engaged. Hold, then switch sides.',
     'Ligg på siden med underarmen på gulvet. Løft hoftene for å skape en rett linje fra hodet til føttene. Hold kjernemuskulaturen aktivert. Hold, bytt så side.',
     3, 1, 20, true, 52),

    -- Balance Exercises
    (p_organization_id, 'Single Leg Stance', 'Stå på ett ben', 'Balance', 'Stability', 'Balance',
     'beginner',
     'Stand on one leg near a wall or chair for support if needed. Try to balance for 30 seconds. Progress by closing your eyes or standing on an unstable surface.',
     'Stå på ett ben nær en vegg eller stol for støtte om nødvendig. Prøv å balansere i 30 sekunder. Progresjon ved å lukke øynene eller stå på ustabilt underlag.',
     3, 3, 30, true, 60),

    (p_organization_id, 'Tandem Stance', 'Tandem-stående', 'Balance', 'Stability', 'Balance',
     'beginner',
     'Stand with one foot directly in front of the other, heel to toe. Hold this position for 30 seconds. Switch feet and repeat.',
     'Stå med en fot rett foran den andre, hæl mot tå. Hold denne posisjonen i 30 sekunder. Bytt fot og gjenta.',
     3, 3, 30, true, 61)

    ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE exercise_library IS 'Library of exercises for prescription to patients';
COMMENT ON TABLE exercise_prescriptions IS 'Exercise programs prescribed to patients';
COMMENT ON TABLE prescribed_exercises IS 'Individual exercises in a prescription';
COMMENT ON TABLE exercise_progress IS 'Patient-reported exercise completion and feedback';
COMMENT ON TABLE auto_accept_settings IS 'Settings for automatic acceptance of appointments and referrals';
COMMENT ON TABLE auto_accept_log IS 'Log of auto-accept actions for auditing';
COMMENT ON TABLE user_macro_preferences IS 'User-specific macro ordering and customization preferences';
