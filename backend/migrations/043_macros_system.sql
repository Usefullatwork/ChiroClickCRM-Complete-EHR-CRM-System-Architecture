-- Clinical Macros System
-- Provides rapid text insertion for SOAP documentation
-- Target: <100ms insertion time

-- ============================================================================
-- CLINICAL MACROS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS clinical_macros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Organization
    category VARCHAR(100) NOT NULL, -- 'Cervical', 'Lumbar', 'Vitals', 'Plan', etc.
    subcategory VARCHAR(100), -- 'ROM', 'Palpation', 'Special Tests', etc.
    macro_name VARCHAR(255) NOT NULL,
    macro_text TEXT NOT NULL,

    -- Shortcuts and categorization
    shortcut_key VARCHAR(10), -- e.g., 'F1', 'Ctrl+1', 'crom' (text expansion)
    soap_section VARCHAR(20), -- 'subjective', 'objective', 'assessment', 'plan'

    -- Status and usage
    is_active BOOLEAN DEFAULT true,
    is_system BOOLEAN DEFAULT false, -- System-provided vs user-created
    is_favorite BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    display_order INTEGER DEFAULT 0,

    -- Audit
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- USER MACRO FAVORITES (per-user customization)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_macro_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    macro_id UUID NOT NULL REFERENCES clinical_macros(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, macro_id)
);

-- ============================================================================
-- MACRO USAGE LOG (for analytics)
-- ============================================================================

CREATE TABLE IF NOT EXISTS macro_usage_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    macro_id UUID NOT NULL REFERENCES clinical_macros(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    encounter_id UUID REFERENCES clinical_encounters(id) ON DELETE SET NULL,
    soap_section VARCHAR(20),
    used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Fast macro lookup
CREATE INDEX idx_macros_org_category ON clinical_macros(organization_id, category, display_order);
CREATE INDEX idx_macros_org_active ON clinical_macros(organization_id, is_active) WHERE is_active = true;
CREATE INDEX idx_macros_soap ON clinical_macros(organization_id, soap_section) WHERE is_active = true;
CREATE INDEX idx_macros_shortcut ON clinical_macros(organization_id, shortcut_key) WHERE shortcut_key IS NOT NULL;
CREATE INDEX idx_macros_favorites ON clinical_macros(organization_id, is_favorite) WHERE is_favorite = true;

-- User favorites lookup
CREATE INDEX idx_user_favorites ON user_macro_favorites(user_id, display_order);

-- Usage analytics
CREATE INDEX idx_macro_usage_date ON macro_usage_log(used_at DESC);
CREATE INDEX idx_macro_usage_macro ON macro_usage_log(macro_id, used_at DESC);

-- Full-text search
CREATE INDEX idx_macros_search ON clinical_macros
USING GIN (to_tsvector('norwegian', macro_name || ' ' || macro_text));

-- ============================================================================
-- TRIGGER: Update timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_macro_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_macro_timestamp
BEFORE UPDATE ON clinical_macros
FOR EACH ROW
EXECUTE FUNCTION update_macro_timestamp();

-- ============================================================================
-- SEED SYSTEM MACROS (Norwegian chiropractic templates)
-- ============================================================================

-- Function to insert system macros for an organization
CREATE OR REPLACE FUNCTION seed_system_macros(p_organization_id UUID)
RETURNS void AS $$
BEGIN
    -- SUBJECTIVE SECTION MACROS
    INSERT INTO clinical_macros (organization_id, category, subcategory, macro_name, macro_text, soap_section, is_system, display_order)
    VALUES
    -- Pain descriptions
    (p_organization_id, 'Smertebeskrivelse', 'Karakter', 'Stikkende smerter', 'Pasienten beskriver smertene som stikkende/skjærende av karakter.', 'subjective', true, 1),
    (p_organization_id, 'Smertebeskrivelse', 'Karakter', 'Verkende smerter', 'Pasienten beskriver smertene som verkende/dump av karakter.', 'subjective', true, 2),
    (p_organization_id, 'Smertebeskrivelse', 'Karakter', 'Brennende smerter', 'Pasienten beskriver smertene som brennende av karakter.', 'subjective', true, 3),
    (p_organization_id, 'Smertebeskrivelse', 'Intensitet', 'VAS 3-4', 'Smerteintensitet VAS 3-4/10 (lett til moderat).', 'subjective', true, 4),
    (p_organization_id, 'Smertebeskrivelse', 'Intensitet', 'VAS 5-6', 'Smerteintensitet VAS 5-6/10 (moderat).', 'subjective', true, 5),
    (p_organization_id, 'Smertebeskrivelse', 'Intensitet', 'VAS 7-8', 'Smerteintensitet VAS 7-8/10 (moderat til alvorlig).', 'subjective', true, 6),

    -- OBJECTIVE SECTION MACROS
    -- Cervical
    (p_organization_id, 'Cervical', 'ROM', 'Normal cervikal ROM', 'Cervikal ROM: Fleksjon og ekstensjon normal. Rotasjon og lateralfleksjon bilateral normal og symmetrisk. Ingen smerteprovokasjon ved bevegelse.', 'objective', true, 10),
    (p_organization_id, 'Cervical', 'ROM', 'Redusert cervikal ROM', 'Cervikal ROM: Redusert {{retning}} med smerteprovokasjon ved endegradig bevegelse.', 'objective', true, 11),
    (p_organization_id, 'Cervical', 'Palpasjon', 'Cervikal palpasjon normal', 'Palpasjon: Ingen ømhet paravertebralt cervikalt. Normal muskeltonus i trapezius og levator scapulae bilateralt.', 'objective', true, 12),
    (p_organization_id, 'Cervical', 'Palpasjon', 'Cervikal ømhet', 'Palpasjon: Ømhet og økt muskeltonus over {{nivå}} paravertebralt {{side}}. Triggerpunkter i {{muskel}}.', 'objective', true, 13),
    (p_organization_id, 'Cervical', 'Spesialtester', 'Spurling negativ', 'Spurling''s test: Negativ bilateralt.', 'objective', true, 14),
    (p_organization_id, 'Cervical', 'Spesialtester', 'Spurling positiv', 'Spurling''s test: Positiv {{side}} med utstråling til {{område}}.', 'objective', true, 15),

    -- Lumbar
    (p_organization_id, 'Lumbal', 'ROM', 'Normal lumbal ROM', 'Lumbal ROM: Fleksjon, ekstensjon, rotasjon og lateralfleksjon innen normale grenser uten smerteprovokasjon.', 'objective', true, 20),
    (p_organization_id, 'Lumbal', 'ROM', 'Redusert lumbal ROM', 'Lumbal ROM: Redusert {{retning}} med smerteprovokasjon. Antalgisk holdning observert.', 'objective', true, 21),
    (p_organization_id, 'Lumbal', 'Palpasjon', 'Lumbal palpasjon normal', 'Palpasjon: Ingen ømhet over lumbale fasettledd eller sakroiliakaledd bilateralt. Normal muskeltonus paravertebralt.', 'objective', true, 22),
    (p_organization_id, 'Lumbal', 'Spesialtester', 'SLR negativ', 'Straight leg raise (SLR): Negativ bilateralt.', 'objective', true, 23),
    (p_organization_id, 'Lumbal', 'Spesialtester', 'SLR positiv', 'Straight leg raise (SLR): Positiv {{side}} ved {{grader}}° med utstråling til {{område}}.', 'objective', true, 24),

    -- Neurological
    (p_organization_id, 'Nevrologisk', 'Reflekser', 'Reflekser normale', 'Reflekser: Biceps (C5-6), triceps (C7), patella (L3-4), achilles (S1) normale og symmetriske bilateralt.', 'objective', true, 30),
    (p_organization_id, 'Nevrologisk', 'Sensibilitet', 'Sensibilitet normal', 'Sensibilitet: Lett berøring og stikk intakt i alle dermatomer.', 'objective', true, 31),
    (p_organization_id, 'Nevrologisk', 'Kraft', 'Kraft normal', 'Kraft: Myotomtesting 5/5 bilateralt i øvre og nedre ekstremiteter.', 'objective', true, 32),

    -- ASSESSMENT SECTION MACROS
    (p_organization_id, 'Vurdering', 'Generell', 'Biomekanisk dysfunksjon', 'Funnene er forenlig med biomekanisk dysfunksjon i {{område}} med assosiert muskulær komponent.', 'assessment', true, 40),
    (p_organization_id, 'Vurdering', 'Generell', 'God prognose', 'Prognosen vurderes som god gitt fravær av røde flagg og pasientens ellers gode allmenntilstand.', 'assessment', true, 41),
    (p_organization_id, 'Vurdering', 'Differensial', 'Utelukket radikulopati', 'Nevrologisk undersøkelse uten tegn til radikulopati.', 'assessment', true, 42),

    -- PLAN SECTION MACROS
    (p_organization_id, 'Plan', 'Behandling', 'Standard kiropraktisk', 'Behandling: Manipulasjon/mobilisering av affiserte segmenter. Myofascielle teknikker til affisert muskulatur. Råd om aktiv rehabilitering.', 'plan', true, 50),
    (p_organization_id, 'Plan', 'Oppfølging', 'Kontroll om 1 uke', 'Kontroll om 1 uke for evaluering av behandlingsrespons.', 'plan', true, 51),
    (p_organization_id, 'Plan', 'Oppfølging', 'Kontroll etter behov', 'Pasienten tar kontakt ved behov eller forverring av symptomer.', 'plan', true, 52),
    (p_organization_id, 'Plan', 'Øvelser', 'Hjemmeøvelser gitt', 'Hjemmeøvelser gjennomgått og demonstrert. Skriftlig øvelsesprogram utlevert.', 'plan', true, 53),
    (p_organization_id, 'Plan', 'Henvisning', 'MR vurderes', 'Ved manglende bedring etter {{antall}} behandlinger vurderes henvisning til MR.', 'plan', true, 54)

    ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE clinical_macros IS 'Clinical text macros for rapid SOAP documentation';
COMMENT ON COLUMN clinical_macros.shortcut_key IS 'Keyboard shortcut or text expansion trigger';
COMMENT ON COLUMN clinical_macros.macro_text IS 'Template text with {{variable}} placeholders';
