-- Seed: 026_letter_templates.sql
-- Description: Default letter templates for Norwegian clinical documentation
-- Created: 2026-01-16

-- =============================================================================
-- SYSTEM LETTER TEMPLATES
-- These are default templates available to all organizations
-- =============================================================================

-- Medical Certificate (Medisinsk erklæring)
INSERT INTO letter_templates (
  organization_id, template_type, template_name, template_name_en,
  template_content, variables, language, category, description, is_system
) VALUES (
  NULL,
  'MEDICAL_CERTIFICATE',
  'Generell medisinsk erklæring',
  'General Medical Certificate',
  'MEDISINSK ERKLÆRING

Dato: {{current_date}}
Sted: {{clinic_name}}

Vedrørende: {{patient_name}}
Fødselsdato: {{patient_dob}}

Det bekreftes herved at ovennevnte er under behandling ved {{clinic_name}} for {{diagnosis}}.

BAKGRUNN:
{{clinical_findings}}

VURDERING:
Basert på klinisk undersøkelse og vurdering, er det min faglige oppfatning at pasienten {{functional_status}}.

ANBEFALING:
{{recommendations}}

Med vennlig hilsen,

{{provider_name}}
{{provider_title}}
HPR-nummer: {{provider_hpr}}

{{clinic_name}}
{{clinic_address}}
Telefon: {{clinic_phone}}',
  '[
    {"name": "patient_name", "label": "Pasientnavn", "required": true},
    {"name": "patient_dob", "label": "Fødselsdato", "required": true},
    {"name": "diagnosis", "label": "Diagnose", "required": true},
    {"name": "clinical_findings", "label": "Kliniske funn", "required": true},
    {"name": "functional_status", "label": "Funksjonsstatus", "required": true},
    {"name": "recommendations", "label": "Anbefalinger", "required": false}
  ]'::jsonb,
  'NO', 'GENERAL', 'Generell medisinsk erklæring for diverse formål', true
) ON CONFLICT DO NOTHING;

-- University Letter (Universitetsbrev)
INSERT INTO letter_templates (
  organization_id, template_type, template_name, template_name_en,
  template_content, variables, language, category, description, is_system
) VALUES (
  NULL,
  'UNIVERSITY_LETTER',
  'Utsatt eksamen - Universitetsbrev',
  'Exam Deferral - University Letter',
  'MEDISINSK ERKLÆRING - UTSATT EKSAMEN

{{current_date}}

Til: {{recipient_institution}}
Vedrørende: {{patient_name}}, f. {{patient_dob}}

Det bekreftes herved at ovennevnte student er under behandling ved {{clinic_name}} for {{diagnosis}}.

BAKGRUNN:
Pasienten oppsøkte klinikken {{treatment_start}} med følgende symptomer og plager:
{{clinical_findings}}

PÅVIRKNING PÅ STUDIEEVNE:
{{functional_status}}

VURDERING:
På bakgrunn av ovennevnte tilstand, er det min medisinske vurdering at pasienten ikke har vært i stand til å forberede seg til eksamen på en tilfredsstillende måte i den aktuelle perioden.

ANBEFALING:
Det anbefales at studenten innvilges utsatt eksamen. {{recommendations}}

Med vennlig hilsen,

{{provider_name}}
{{provider_title}}
HPR-nummer: {{provider_hpr}}

{{clinic_name}}
{{clinic_address}}
Telefon: {{clinic_phone}}',
  '[
    {"name": "patient_name", "label": "Studentnavn", "required": true},
    {"name": "patient_dob", "label": "Fødselsdato", "required": true},
    {"name": "recipient_institution", "label": "Universitet/Fakultet", "required": true},
    {"name": "diagnosis", "label": "Diagnose", "required": true},
    {"name": "treatment_start", "label": "Behandlingsstart", "required": true},
    {"name": "clinical_findings", "label": "Symptomer/funn", "required": true},
    {"name": "functional_status", "label": "Påvirkning på studieevne", "required": true},
    {"name": "recommendations", "label": "Tilleggsanbefaling", "required": false}
  ]'::jsonb,
  'NO', 'GENERAL', 'Medisinsk erklæring for utsatt eksamen ved universitet/høyskole', true
) ON CONFLICT DO NOTHING;

-- Vestibular Referral (Svimmelhet henvisning)
INSERT INTO letter_templates (
  organization_id, template_type, template_name, template_name_en,
  template_content, variables, language, category, description, is_system
) VALUES (
  NULL,
  'VESTIBULAR_REFERRAL',
  'Henvisning - Svimmelhet/BPPV',
  'Referral - Vertigo/BPPV',
  'HENVISNING - VESTIBULÆR UTREDNING

{{current_date}}

Til: {{recipient}}
{{recipient_institution}}

Vedrørende: {{patient_name}}
Fødselsdato: {{patient_dob}}
Adresse: {{patient_address}}
Telefon: {{patient_phone}}

ICPC-2: H82 Vestibulært syndrom

SYKEHISTORIE:
{{clinical_findings}}

VNG-FUNN:
{{vng_results}}

KLINISKE FUNN:
- Dix-Hallpike: {{dix_hallpike}}
- HIT (Head Impulse Test): {{hit_test}}
- Romberg: {{romberg}}
- Gait: {{gait}}

TENTATIV DIAGNOSE:
{{diagnosis}}

SPØRSMÅLSSTILLING:
Vennligst vurder pasienten med tanke på:
{{recommendations}}

Med vennlig hilsen,

{{provider_name}}
{{provider_title}}
HPR-nummer: {{provider_hpr}}

{{clinic_name}}
{{clinic_address}}
Telefon: {{clinic_phone}}',
  '[
    {"name": "patient_name", "label": "Pasientnavn", "required": true},
    {"name": "patient_dob", "label": "Fødselsdato", "required": true},
    {"name": "patient_address", "label": "Adresse", "required": false},
    {"name": "patient_phone", "label": "Telefon", "required": false},
    {"name": "recipient", "label": "Mottaker", "required": true},
    {"name": "recipient_institution", "label": "Avdeling/sykehus", "required": true},
    {"name": "clinical_findings", "label": "Sykehistorie", "required": true},
    {"name": "vng_results", "label": "VNG-resultater", "required": false},
    {"name": "dix_hallpike", "label": "Dix-Hallpike", "required": false, "default": "Ikke utført"},
    {"name": "hit_test", "label": "HIT-test", "required": false, "default": "Ikke utført"},
    {"name": "romberg", "label": "Romberg", "required": false, "default": "Ikke utført"},
    {"name": "gait", "label": "Gangfunksjon", "required": false},
    {"name": "diagnosis", "label": "Tentativ diagnose", "required": true},
    {"name": "recommendations", "label": "Spørsmålsstilling", "required": true}
  ]'::jsonb,
  'NO', 'VESTIBULAR', 'Henvisning for vestibulær utredning (svimmelhet, BPPV, vestibularisnevritt)', true
) ON CONFLICT DO NOTHING;

-- Headache Referral (Hodepine henvisning)
INSERT INTO letter_templates (
  organization_id, template_type, template_name, template_name_en,
  template_content, variables, language, category, description, is_system
) VALUES (
  NULL,
  'HEADACHE_REFERRAL',
  'Henvisning - Hodepineutredning',
  'Referral - Headache Investigation',
  'HENVISNING - HODEPINEUTREDNING

{{current_date}}

Til: Nevrologisk avdeling / Hodepineklinikk
{{recipient_institution}}

Vedrørende: {{patient_name}}
Fødselsdato: {{patient_dob}}
Adresse: {{patient_address}}

ICPC-2: N01 Hodepine

HODEPINEKARAKTERISTIKK:
- Type: {{headache_type}}
- Lokalisering: {{headache_location}}
- Frekvens: {{headache_frequency}}
- Intensitet: {{headache_intensity}}
- Varighet: {{headache_duration}}

TRIGGERE OG LEDSAGENDE SYMPTOMER:
{{triggers_symptoms}}

TIDLIGERE BEHANDLING OG MEDISINBRUK:
{{previous_treatment}}

RØDE FLAGG VURDERT:
{{red_flags}}

KLINISK UNDERSØKELSE:
{{clinical_findings}}

VURDERING:
{{diagnosis}}

SPØRSMÅLSSTILLING:
{{recommendations}}

Med vennlig hilsen,

{{provider_name}}
{{provider_title}}
HPR-nummer: {{provider_hpr}}

{{clinic_name}}
{{clinic_address}}',
  '[
    {"name": "patient_name", "label": "Pasientnavn", "required": true},
    {"name": "patient_dob", "label": "Fødselsdato", "required": true},
    {"name": "patient_address", "label": "Adresse", "required": false},
    {"name": "recipient_institution", "label": "Sykehus/klinikk", "required": true},
    {"name": "headache_type", "label": "Hodepinetype", "required": true},
    {"name": "headache_location", "label": "Lokalisering", "required": true},
    {"name": "headache_frequency", "label": "Frekvens", "required": true},
    {"name": "headache_intensity", "label": "Intensitet (VAS)", "required": false},
    {"name": "headache_duration", "label": "Varighet", "required": false},
    {"name": "triggers_symptoms", "label": "Triggere/ledsagende", "required": true},
    {"name": "previous_treatment", "label": "Tidligere behandling", "required": false},
    {"name": "red_flags", "label": "Røde flagg", "required": true, "default": "Ingen røde flagg identifisert"},
    {"name": "clinical_findings", "label": "Kliniske funn", "required": true},
    {"name": "diagnosis", "label": "Vurdering", "required": true},
    {"name": "recommendations", "label": "Spørsmålsstilling", "required": true}
  ]'::jsonb,
  'NO', 'HEADACHE', 'Henvisning for hodepineutredning inkludert migrene', true
) ON CONFLICT DO NOTHING;

-- Membership Freeze (Treningssentererklæring)
INSERT INTO letter_templates (
  organization_id, template_type, template_name, template_name_en,
  template_content, variables, language, category, description, is_system
) VALUES (
  NULL,
  'MEMBERSHIP_FREEZE',
  'Frys av treningsmedlemskap',
  'Gym Membership Freeze',
  'MEDISINSK ERKLÆRING - AKTIVITETSPAUSE

{{current_date}}

Til: {{recipient}}
Vedrørende: {{patient_name}}, f. {{patient_dob}}

Det bekreftes herved at ovennevnte er under behandling ved {{clinic_name}} for en tilstand som medfører behov for pause fra fysisk trening.

MEDISINSK BEGRUNNELSE:
Pasienten er under behandling for {{diagnosis}}. På grunn av denne tilstanden er det medisinsk tilrådelig med en pause fra fysisk aktivitet for å sikre optimal tilheling.

ANBEFALT VARIGHET:
Det anbefales frys av medlemskap i {{freeze_duration}}.

{{#if allowed_activities}}
TILLATTE AKTIVITETER:
Følgende aktiviteter kan eventuelt gjennomføres med forsiktighet:
{{allowed_activities}}
{{/if}}

OPPFØLGING:
Pasienten følges opp ved klinikken. Ved spørsmål kan undertegnede kontaktes.

Med vennlig hilsen,

{{provider_name}}
{{provider_title}}
HPR-nummer: {{provider_hpr}}

{{clinic_name}}
Telefon: {{clinic_phone}}',
  '[
    {"name": "patient_name", "label": "Medlemsnavn", "required": true},
    {"name": "patient_dob", "label": "Fødselsdato", "required": true},
    {"name": "recipient", "label": "Treningssenter", "required": true},
    {"name": "diagnosis", "label": "Tilstand (generell)", "required": true},
    {"name": "freeze_duration", "label": "Ønsket varighet", "required": true},
    {"name": "allowed_activities", "label": "Tillatte aktiviteter", "required": false}
  ]'::jsonb,
  'NO', 'GENERAL', 'Medisinsk erklæring for frys av treningsmedlemskap', true
) ON CONFLICT DO NOTHING;

-- Work Declaration (Arbeidsgivererklæring)
INSERT INTO letter_templates (
  organization_id, template_type, template_name, template_name_en,
  template_content, variables, language, category, description, is_system
) VALUES (
  NULL,
  'WORK_DECLARATION',
  'Erklæring til arbeidsgiver',
  'Employer Declaration',
  'ERKLÆRING TIL ARBEIDSGIVER

{{current_date}}

Vedrørende: {{patient_name}}
Fødselsdato: {{patient_dob}}

Det bekreftes at ovennevnte er under behandling ved {{clinic_name}} for en tilstand som påvirker arbeidsevnen.

FUNKSJONSVURDERING:
{{functional_status}}

ARBEIDSEVNE:
{{work_capacity}}

{{#if restrictions}}
TILRETTELEGGINGSBEHOV:
For å sikre optimal tilheling og unngå forverring, anbefales følgende tilrettelegging:
{{restrictions}}
{{/if}}

FORVENTET VARIGHET:
{{duration}}

OPPFØLGING:
Pasienten følges opp ved klinikken. Ved behov for ytterligere informasjon eller møte, vennligst ta kontakt.

Med vennlig hilsen,

{{provider_name}}
{{provider_title}}
HPR-nummer: {{provider_hpr}}

{{clinic_name}}
{{clinic_address}}
Telefon: {{clinic_phone}}

NB: Denne erklæringen inneholder kun arbeidsrelevant informasjon i tråd med taushetsplikten.',
  '[
    {"name": "patient_name", "label": "Arbeidstaker", "required": true},
    {"name": "patient_dob", "label": "Fødselsdato", "required": true},
    {"name": "functional_status", "label": "Funksjonsvurdering", "required": true},
    {"name": "work_capacity", "label": "Arbeidsevne", "required": true},
    {"name": "restrictions", "label": "Tilretteleggingsbehov", "required": false},
    {"name": "duration", "label": "Forventet varighet", "required": true}
  ]'::jsonb,
  'NO', 'WORK', 'Erklæring til arbeidsgiver om funksjon og tilrettelegging', true
) ON CONFLICT DO NOTHING;

-- Clinical Note (Klinisk notat)
INSERT INTO letter_templates (
  organization_id, template_type, template_name, template_name_en,
  template_content, variables, language, category, description, is_system
) VALUES (
  NULL,
  'CLINICAL_NOTE',
  'Klinisk notat til spesialist',
  'Clinical Note to Specialist',
  'KLINISK NOTAT

{{current_date}}

Til: {{recipient}}
{{recipient_institution}}

Vedrørende: {{patient_name}}
Fødselsdato: {{patient_dob}}

ANAMNESE:
{{history}}

KLINISKE FUNN:
{{clinical_findings}}

DIAGNOSEKODE(R):
{{diagnosis}}

UTFØRT BEHANDLING:
{{treatment}}

VURDERING:
{{assessment}}

VIDERE PLAN:
{{recommendations}}

Med vennlig hilsen,

{{provider_name}}
{{provider_title}}
HPR-nummer: {{provider_hpr}}

{{clinic_name}}
{{clinic_address}}
Telefon: {{clinic_phone}}',
  '[
    {"name": "patient_name", "label": "Pasientnavn", "required": true},
    {"name": "patient_dob", "label": "Fødselsdato", "required": true},
    {"name": "recipient", "label": "Mottaker", "required": false},
    {"name": "recipient_institution", "label": "Institusjon", "required": false},
    {"name": "history", "label": "Anamnese", "required": true},
    {"name": "clinical_findings", "label": "Kliniske funn", "required": true},
    {"name": "diagnosis", "label": "Diagnose", "required": true},
    {"name": "treatment", "label": "Behandling", "required": false},
    {"name": "assessment", "label": "Vurdering", "required": true},
    {"name": "recommendations", "label": "Videre plan", "required": false}
  ]'::jsonb,
  'NO', 'GENERAL', 'Detaljert klinisk notat til annen behandler eller spesialist', true
) ON CONFLICT DO NOTHING;

-- BPPV Protocol (Diagnostisk protokoll)
INSERT INTO letter_templates (
  organization_id, template_type, template_name, template_name_en,
  template_content, variables, language, category, description, is_system
) VALUES (
  NULL,
  'DIAGNOSTIC_PROTOCOL',
  'BPPV Protokoll og behandling',
  'BPPV Protocol and Treatment',
  'BPPV PROTOKOLL

Dato: {{current_date}}
Pasient: {{patient_name}}, f. {{patient_dob}}

DIAGNOSTISKE FUNN:

Dix-Hallpike test:
- Høyre: {{dix_hallpike_right}}
- Venstre: {{dix_hallpike_left}}

Supine Roll Test:
- Høyre: {{roll_test_right}}
- Venstre: {{roll_test_left}}

Nystagmus karakteristikk:
{{nystagmus_description}}

DIAGNOSE:
{{diagnosis}}
Affisert buegang: {{affected_canal}}
Type: {{bppv_type}}

BEHANDLING UTFØRT:
{{treatment}}

Antall repetisjoner: {{repetitions}}
Pasientrespons: {{response}}

HJEMMEØVELSER:
{{home_exercises}}

OPPFØLGING:
{{follow_up}}

{{provider_name}}
{{provider_title}}
HPR-nummer: {{provider_hpr}}',
  '[
    {"name": "patient_name", "label": "Pasientnavn", "required": true},
    {"name": "patient_dob", "label": "Fødselsdato", "required": true},
    {"name": "dix_hallpike_right", "label": "Dix-Hallpike høyre", "required": true},
    {"name": "dix_hallpike_left", "label": "Dix-Hallpike venstre", "required": true},
    {"name": "roll_test_right", "label": "Roll test høyre", "required": false},
    {"name": "roll_test_left", "label": "Roll test venstre", "required": false},
    {"name": "nystagmus_description", "label": "Nystagmus beskrivelse", "required": true},
    {"name": "diagnosis", "label": "Diagnose", "required": true},
    {"name": "affected_canal", "label": "Affisert buegang", "required": true},
    {"name": "bppv_type", "label": "BPPV type", "required": true, "default": "Kanalolithiasis"},
    {"name": "treatment", "label": "Behandling utført", "required": true},
    {"name": "repetitions", "label": "Antall repetisjoner", "required": false},
    {"name": "response", "label": "Pasientrespons", "required": false},
    {"name": "home_exercises", "label": "Hjemmeøvelser", "required": false},
    {"name": "follow_up", "label": "Oppfølging", "required": false}
  ]'::jsonb,
  'NO', 'VESTIBULAR', 'Dokumentasjonsprotokoll for BPPV diagnose og behandling', true
) ON CONFLICT DO NOTHING;

-- Confirm seed completed
DO $$
BEGIN
  RAISE NOTICE 'Letter templates seed completed. Templates added: %',
    (SELECT COUNT(*) FROM letter_templates WHERE is_system = true);
END $$;
