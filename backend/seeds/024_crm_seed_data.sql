-- ============================================================================
-- Seed File: 024_crm_seed_data.sql
-- Description: Comprehensive seed data for CRM, AI feedback, and automation
-- Created: 2026-01-16
-- ============================================================================

-- Default organization ID
DO $$
DECLARE
    org_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    admin_id UUID := 'b1ffcc99-9c0b-4ef8-bb6d-6bb9bd380a22';
BEGIN

-- ============================================================================
-- ORGANIZATION & ADMIN USER
-- ============================================================================
INSERT INTO organizations (id, name, org_number, email, phone, address_street, address_city, address_postal_code, created_at)
VALUES (
    org_id,
    'Oslo Kiropraktorklinikk',
    '923456789',
    'post@oslokiropraktor.no',
    '+47 22 33 44 55',
    'Karl Johans gate 45',
    'Oslo',
    '0162',
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email;

INSERT INTO users (id, organization_id, email, first_name, last_name, role, is_active, created_at)
VALUES (
    admin_id,
    org_id,
    'admin@oslokiropraktor.no',
    'Admin',
    'Bruker',
    'ADMIN',
    true,
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SAMPLE PATIENTS (100 Norwegian patients)
-- ============================================================================
INSERT INTO patients (id, organization_id, first_name, last_name, email, phone, date_of_birth, gender, address_street, address_city, address_postal_code, status, category, main_problem, consent_sms, consent_email, created_at)
VALUES
    -- Active patients with various conditions
    (gen_random_uuid(), org_id, 'Erik', 'Hansen', 'erik.hansen@gmail.com', '+47 91234567', '1985-03-15', 'MALE', 'Bygdoy Alle 23', 'Oslo', '0265', 'ACTIVE', 'VIP', 'Nakkesmerter', true, true, NOW() - interval '2 years'),
    (gen_random_uuid(), org_id, 'Ingrid', 'Olsen', 'ingrid.o@outlook.com', '+47 92345678', '1978-07-22', 'FEMALE', 'Frognerveien 12', 'Oslo', '0263', 'ACTIVE', 'REGULAR', 'Korsryggsmerter', true, true, NOW() - interval '18 months'),
    (gen_random_uuid(), org_id, 'Lars', 'Johansen', 'lars.j@hotmail.com', '+47 93456789', '1990-11-08', 'MALE', 'Grensen 5', 'Oslo', '0159', 'ACTIVE', 'REGULAR', 'Skulderplager', true, false, NOW() - interval '1 year'),
    (gen_random_uuid(), org_id, 'Kari', 'Nilsen', 'kari.nilsen@gmail.com', '+47 94567890', '1982-05-30', 'FEMALE', 'Majorstuen 8', 'Oslo', '0367', 'ACTIVE', 'VIP', 'Svimmelhet', true, true, NOW() - interval '6 months'),
    (gen_random_uuid(), org_id, 'Ole', 'Pedersen', 'ole.p@icloud.com', '+47 95678901', '1975-09-12', 'MALE', 'Aker Brygge 15', 'Oslo', '0250', 'ACTIVE', 'REGULAR', 'Hodepine', true, true, NOW() - interval '3 months'),
    (gen_random_uuid(), org_id, 'Silje', 'Berg', 'silje.berg@yahoo.no', '+47 96789012', '1995-01-25', 'FEMALE', 'Holmenkollen 3', 'Oslo', '0787', 'ACTIVE', 'REGULAR', 'Tennisalbue', true, true, NOW() - interval '1 month'),
    (gen_random_uuid(), org_id, 'Magnus', 'Larsen', 'magnus@firma.no', '+47 97890123', '1988-06-18', 'MALE', 'Sagene 22', 'Oslo', '0458', 'ACTIVE', 'INSURANCE', 'Isjias', true, true, NOW() - interval '2 weeks'),
    (gen_random_uuid(), org_id, 'Emma', 'Kristiansen', 'emma.k@gmail.com', '+47 98901234', '1992-12-03', 'FEMALE', 'Torshov 7', 'Oslo', '0476', 'ACTIVE', 'REGULAR', 'Bekkensmerter', true, true, NOW() - interval '1 week'),

    -- Inactive patients needing follow-up
    (gen_random_uuid(), org_id, 'Henrik', 'Andersen', 'henrik.a@online.no', '+47 90123456', '1970-04-20', 'MALE', 'Gronland 45', 'Oslo', '0190', 'INACTIVE', 'REGULAR', 'Nakkesmerter', true, true, NOW() - interval '4 months'),
    (gen_random_uuid(), org_id, 'Marte', 'Solberg', 'marte.s@gmail.com', '+47 91234568', '1983-08-14', 'FEMALE', 'Tøyen 12', 'Oslo', '0578', 'INACTIVE', 'REGULAR', 'Ryggplager', true, false, NOW() - interval '5 months'),
    (gen_random_uuid(), org_id, 'Bjorn', 'Haugen', 'bjorn.h@telenor.no', '+47 92345679', '1965-02-28', 'MALE', 'Sentrum 1', 'Oslo', '0101', 'INACTIVE', 'VIP', 'Artrose', true, true, NOW() - interval '6 months'),

    -- Prospective patients (leads)
    (gen_random_uuid(), org_id, 'Anna', 'Lund', 'anna.lund@gmail.com', '+47 93456780', '1998-10-05', 'FEMALE', 'Blindern 8', 'Oslo', '0371', 'PROSPECTIVE', 'REGULAR', 'Akutte ryggsmerter', true, true, NOW() - interval '3 days'),
    (gen_random_uuid(), org_id, 'Thomas', 'Vik', 'thomas.vik@outlook.com', '+47 94567891', '1987-07-17', 'MALE', 'Ullevaal 23', 'Oslo', '0855', 'PROSPECTIVE', 'REGULAR', 'Nakkestivhet', true, true, NOW() - interval '1 day'),

    -- More active patients with birthdays this month
    (gen_random_uuid(), org_id, 'Liv', 'Moen', 'liv.moen@gmail.com', '+47 95678902', '1980-01-20', 'FEMALE', 'Frogner 5', 'Oslo', '0264', 'ACTIVE', 'REGULAR', 'Kroniske smerter', true, true, NOW() - interval '8 months'),
    (gen_random_uuid(), org_id, 'Per', 'Dahl', 'per.dahl@firma.no', '+47 96789013', '1972-01-25', 'MALE', 'Lysaker 12', 'Bærum', '1366', 'ACTIVE', 'VIP', 'Skulder/arm', true, true, NOW() - interval '14 months'),

    -- Patients from different areas
    (gen_random_uuid(), org_id, 'Hanna', 'Strom', 'hanna.s@icloud.com', '+47 97890124', '1993-09-30', 'FEMALE', 'Asker Sentrum 8', 'Asker', '1384', 'ACTIVE', 'REGULAR', 'Spenningshodepine', true, true, NOW() - interval '2 months'),
    (gen_random_uuid(), org_id, 'Jonas', 'Hagen', 'jonas.hagen@gmail.com', '+47 98901235', '1984-11-11', 'MALE', 'Sandvika 15', 'Bærum', '1337', 'ACTIVE', 'REGULAR', 'Kjeveproblemer', true, false, NOW() - interval '5 weeks'),
    (gen_random_uuid(), org_id, 'Sofie', 'Aasen', 'sofie.aasen@yahoo.no', '+47 90123457', '1996-03-08', 'FEMALE', 'Drammen Gate 22', 'Drammen', '3017', 'ACTIVE', 'REGULAR', 'Løperknee', true, true, NOW() - interval '3 weeks'),
    (gen_random_uuid(), org_id, 'Anders', 'Brekke', 'anders.b@online.no', '+47 91234569', '1979-06-25', 'MALE', 'Ski Stasjon 5', 'Ski', '1400', 'ACTIVE', 'INSURANCE', 'Whiplash', true, true, NOW() - interval '6 weeks'),
    (gen_random_uuid(), org_id, 'Julie', 'Lien', 'julie.lien@gmail.com', '+47 92345680', '1991-12-15', 'FEMALE', 'Kolbotn 8', 'Kolbotn', '1410', 'ACTIVE', 'REGULAR', 'Gravidrelatert', true, true, NOW() - interval '4 weeks')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- MESSAGE TEMPLATES (SMS & Email)
-- ============================================================================
INSERT INTO message_templates (id, organization_id, name, type, subject, content, language, category, is_active, created_by, created_at)
VALUES
    -- Appointment reminders
    (gen_random_uuid(), org_id, 'Timepåminnelse SMS', 'SMS', NULL,
     'Hei {firstName}! Påminnelse om din time hos Oslo Kiropraktorklinikk {appointmentDate} kl {appointmentTime}. Avbestilling minst 24t før. Mvh {clinicName}',
     'NO', 'APPOINTMENT', true, admin_id, NOW()),

    (gen_random_uuid(), org_id, 'Appointment Reminder Email', 'EMAIL', 'Påminnelse: Din time {appointmentDate}',
     'Kjære {firstName} {lastName},

Dette er en påminnelse om din kommende time:

Dato: {appointmentDate}
Tid: {appointmentTime}
Sted: {clinicAddress}

Vennligst gi beskjed minst 24 timer før hvis du må avbestille.

Med vennlig hilsen,
{clinicName}
Tlf: {clinicPhone}',
     'NO', 'APPOINTMENT', true, admin_id, NOW()),

    -- Recall messages
    (gen_random_uuid(), org_id, 'Recall 3 måneder SMS', 'SMS', NULL,
     'Hei {firstName}! Det er nå 3 måneder siden ditt siste besøk hos oss. Book gjerne en oppfølgingstime på {clinicPhone}. Mvh {clinicName}',
     'NO', 'RECALL', true, admin_id, NOW()),

    (gen_random_uuid(), org_id, 'Recall 6 måneder Email', 'EMAIL', 'Vi savner deg - tid for oppfølging?',
     'Kjære {firstName},

Det er nå 6 måneder siden ditt siste besøk hos oss. Vi anbefaler regelmessig oppfølging for å vedlikeholde din fremgang.

Har du fortsatt plager, eller ønsker du en forebyggende sjekk?

Book time enkelt på vår nettside eller ring oss på {clinicPhone}.

Med vennlig hilsen,
{clinicName}',
     'NO', 'RECALL', true, admin_id, NOW()),

    -- Birthday messages
    (gen_random_uuid(), org_id, 'Bursdagshilsen SMS', 'SMS', NULL,
     'Gratulerer med dagen, {firstName}! Vi i {clinicName} ønsker deg en fantastisk bursdag! 🎂',
     'NO', 'BIRTHDAY', true, admin_id, NOW()),

    (gen_random_uuid(), org_id, 'Bursdagshilsen Email', 'EMAIL', 'Gratulerer med dagen! 🎉',
     'Kjære {firstName},

Alle oss i {clinicName} ønsker deg en riktig god bursdag!

Vi setter pris på at du er pasient hos oss.

Beste hilsener,
{clinicName}',
     'NO', 'BIRTHDAY', true, admin_id, NOW()),

    -- Welcome messages
    (gen_random_uuid(), org_id, 'Velkommen ny pasient', 'EMAIL', 'Velkommen til {clinicName}!',
     'Kjære {firstName},

Velkommen som ny pasient hos {clinicName}!

Vi ser frem til å hjelpe deg. Her er litt praktisk informasjon:

📍 Adresse: {clinicAddress}
📞 Telefon: {clinicPhone}
✉️ E-post: {clinicEmail}

Før første konsultasjon:
- Fyll gjerne ut helseskjema på forhånd (link sendes separat)
- Ta med evt. røntgenbilder eller journaler fra tidligere behandling
- Beregn ca 45-60 minutter for første konsultasjon

Vi gleder oss til å se deg!

Med vennlig hilsen,
{clinicName}',
     'NO', 'WELCOME', true, admin_id, NOW()),

    -- Follow-up messages
    (gen_random_uuid(), org_id, 'Oppfølging etter behandling', 'SMS', NULL,
     'Hei {firstName}! Håper du har det bra etter behandlingen. Har du spørsmål, ta kontakt. Mvh {clinicName} {clinicPhone}',
     'NO', 'FOLLOW_UP', true, admin_id, NOW()),

    -- Re-activation campaign
    (gen_random_uuid(), org_id, 'Reaktivering inaktiv pasient', 'EMAIL', 'Vi savner deg!',
     'Kjære {firstName},

Det er en stund siden sist du var hos oss.

Visste du at regelmessig vedlikeholdsbehandling kan forebygge tilbakefall og holde deg i god form?

Som en verdifull pasient ønsker vi å tilby deg en oppfølgingskonsultasjon.

Ring oss på {clinicPhone} eller book online.

Med vennlig hilsen,
{clinicName}',
     'NO', 'REACTIVATION', true, admin_id, NOW()),

    -- No-show message
    (gen_random_uuid(), org_id, 'Uteble fra time', 'SMS', NULL,
     'Hei {firstName}. Vi savnet deg i dag. Trenger du ny time? Ring {clinicPhone}. Mvh {clinicName}',
     'NO', 'NO_SHOW', true, admin_id, NOW())
ON CONFLICT DO NOTHING;

-- ============================================================================
-- AUTOMATION WORKFLOWS
-- ============================================================================
INSERT INTO automation_workflows (id, organization_id, name, description, is_active, trigger_type, trigger_config, conditions, actions, run_at_time, timezone, max_per_day, created_by, created_at)
VALUES
    -- Birthday automation
    (gen_random_uuid(), org_id, 'Bursdagshilsen', 'Send automatisk bursdagshilsen til aktive pasienter', true,
     'BIRTHDAY', '{"days_before": 0}'::jsonb,
     '{"patient_status": ["ACTIVE"], "has_phone": true}'::jsonb,
     '[{"type": "SEND_SMS", "template_name": "Bursdagshilsen SMS", "delay_minutes": 0}]'::jsonb,
     '09:00', 'Europe/Oslo', 50, admin_id, NOW()),

    -- 90-day recall
    (gen_random_uuid(), org_id, 'Recall 90 dager', 'Automatisk påminnelse etter 90 dager uten besøk', true,
     'DAYS_SINCE_VISIT', '{"days": 90}'::jsonb,
     '{"patient_status": ["ACTIVE", "INACTIVE"], "has_phone": true, "consent_sms": true}'::jsonb,
     '[{"type": "SEND_SMS", "template_name": "Recall 3 måneder SMS", "delay_minutes": 0}]'::jsonb,
     '10:00', 'Europe/Oslo', 30, admin_id, NOW()),

    -- 180-day recall with email
    (gen_random_uuid(), org_id, 'Recall 6 måneder', 'Email påminnelse etter 6 måneder', true,
     'DAYS_SINCE_VISIT', '{"days": 180}'::jsonb,
     '{"patient_status": ["ACTIVE", "INACTIVE"], "has_email": true, "consent_email": true}'::jsonb,
     '[{"type": "SEND_EMAIL", "template_name": "Recall 6 måneder Email", "delay_minutes": 0}]'::jsonb,
     '11:00', 'Europe/Oslo', 50, admin_id, NOW()),

    -- Welcome new patient
    (gen_random_uuid(), org_id, 'Velkommen ny pasient', 'Send velkomst-email til nye pasienter', true,
     'PATIENT_CREATED', '{}'::jsonb,
     '{"has_email": true, "consent_email": true}'::jsonb,
     '[{"type": "SEND_EMAIL", "template_name": "Velkommen ny pasient", "delay_minutes": 60}]'::jsonb,
     NULL, 'Europe/Oslo', 100, admin_id, NOW()),

    -- Post-treatment follow-up
    (gen_random_uuid(), org_id, 'Oppfølging etter behandling', 'SMS dag etter behandling', true,
     'APPOINTMENT_COMPLETED', '{}'::jsonb,
     '{"has_phone": true, "consent_sms": true}'::jsonb,
     '[{"type": "SEND_SMS", "template_name": "Oppfølging etter behandling", "delay_minutes": 1440}]'::jsonb,
     '10:00', 'Europe/Oslo', 50, admin_id, NOW()),

    -- No-show follow-up
    (gen_random_uuid(), org_id, 'Oppfølging ikke møtt', 'Kontakt pasient som ikke møtte', true,
     'APPOINTMENT_MISSED', '{}'::jsonb,
     '{"has_phone": true}'::jsonb,
     '[{"type": "SEND_SMS", "template_name": "Uteble fra time", "delay_minutes": 120}, {"type": "CREATE_FOLLOW_UP", "follow_up_type": "CONTACT_PATIENT", "delay_minutes": 0}]'::jsonb,
     NULL, 'Europe/Oslo', 20, admin_id, NOW())
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SAMPLE AI FEEDBACK DATA
-- ============================================================================
-- Insert sample AI feedback to demonstrate the learning system
INSERT INTO ai_feedback (id, organization_id, user_id, suggestion_type, original_suggestion, user_correction, accepted, correction_type, confidence_score, user_rating, time_to_decision, created_at)
VALUES
    -- SOAP suggestions - mostly accepted
    (gen_random_uuid(), org_id, admin_id, 'soap_subjective',
     'Pasienten rapporterer nakke- og skuldersmerter med debut for 2 uker siden. Smertene forverres ved skrivebordsarbeid og bedres ved bevegelse.',
     NULL, true, 'accepted_as_is', 0.92, 5, 3500, NOW() - interval '30 days'),

    (gen_random_uuid(), org_id, admin_id, 'soap_subjective',
     'Pasienten beskriver hodepine lokalisert til høyre tinning, med varighet 3-4 timer.',
     'Pasienten beskriver hodepine lokalisert til høyre tinning og nakke, med varighet 3-4 timer. Forverres av stress.',
     true, 'minor_edit', 0.85, 4, 8200, NOW() - interval '28 days'),

    (gen_random_uuid(), org_id, admin_id, 'soap_objective',
     'Palpasjon avdekker myofascielle triggerpunkter i m. trapezius bilateralt. Cervikal ROM: Fleksjon 40°, ekstensjon 45°, lateral fleksjon 35° bilat.',
     NULL, true, 'accepted_as_is', 0.88, 5, 4100, NOW() - interval '25 days'),

    (gen_random_uuid(), org_id, admin_id, 'soap_assessment',
     'M54.2 Cervicalgi. Sannsynlig myogen komponent med referert hodepine.',
     NULL, true, 'accepted_as_is', 0.90, 5, 2800, NOW() - interval '22 days'),

    (gen_random_uuid(), org_id, admin_id, 'soap_plan',
     'Plan: 1) Manuell behandling cervikalt, 2) Hjemmeøvelser for nakkemuskulatur, 3) Ergonomisk veiledning, 4) Kontroll om 1 uke.',
     'Plan: 1) Manuell behandling cervikalt, 2) Hjemmeøvelser for nakkemuskulatur (instruksjonsark vedlagt), 3) Ergonomisk veiledning - anbefalt heve/senke pult, 4) Kontroll om 1 uke.',
     true, 'minor_edit', 0.82, 4, 12500, NOW() - interval '20 days'),

    -- Diagnosis suggestions
    (gen_random_uuid(), org_id, admin_id, 'diagnosis_code',
     'L01 Nakke symptom/plage',
     NULL, true, 'accepted_as_is', 0.94, 5, 1500, NOW() - interval '18 days'),

    (gen_random_uuid(), org_id, admin_id, 'diagnosis_code',
     'L03 Korsrygg symptom/plage',
     'L86 Rygg syndrom med utstråling',
     true, 'major_edit', 0.65, 3, 15000, NOW() - interval '15 days'),

    -- Red flag analysis
    (gen_random_uuid(), org_id, admin_id, 'red_flag',
     'Ingen røde flagg identifisert. Symptombildet er konsistent med mekanisk nakkeproblem.',
     NULL, true, 'accepted_as_is', 0.95, 5, 2200, NOW() - interval '12 days'),

    (gen_random_uuid(), org_id, admin_id, 'red_flag',
     'Rødt flagg: Uforklart vekttap rapportert. Anbefaler henvisning til fastlege for videre utredning.',
     NULL, true, 'accepted_as_is', 0.98, 5, 1800, NOW() - interval '10 days'),

    -- Some rejected suggestions for learning
    (gen_random_uuid(), org_id, admin_id, 'soap_subjective',
     'Pasienten har ryggsmerter.',
     'For generisk forslag - mangler detaljer om lokalisasjon, varighet, forverrende faktorer.',
     false, 'rejected', 0.45, 1, 5000, NOW() - interval '8 days'),

    (gen_random_uuid(), org_id, admin_id, 'diagnosis_code',
     'L99 Andre/uspesifiserte muskel-skjelett sykdommer',
     NULL, false, 'rejected', 0.35, 2, 3000, NOW() - interval '5 days'),

    -- More recent feedback
    (gen_random_uuid(), org_id, admin_id, 'soap_subjective',
     'Pasienten kommer med korsryggsmerter som stråler ned i venstre ben til kneet. VAS 6/10. Ingen nummenhet eller svakhet.',
     NULL, true, 'accepted_as_is', 0.91, 5, 3200, NOW() - interval '3 days'),

    (gen_random_uuid(), org_id, admin_id, 'soap_objective',
     'SLR positiv venstre 45°, negativ høyre. Lasegue negativ. Styrke L4-S1 dermatomer 5/5 bilateralt. Sensorikk intakt.',
     NULL, true, 'accepted_as_is', 0.89, 5, 4500, NOW() - interval '2 days'),

    (gen_random_uuid(), org_id, admin_id, 'clinical_summary',
     'Pasient med 3 behandlinger siste måned for cervikogen hodepine. God fremgang. Smerteintensitet redusert fra VAS 7 til VAS 3. Anbefaler vedlikeholdsbehandling månedlig.',
     NULL, true, 'accepted_as_is', 0.87, 4, 6800, NOW() - interval '1 day')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SAMPLE CLINICAL ENCOUNTERS (for AI context)
-- ============================================================================
-- Note: This requires existing patient IDs, so we use a subquery
DO $$
DECLARE
    patient_rec RECORD;
    enc_id UUID;
BEGIN
    FOR patient_rec IN SELECT id FROM patients WHERE organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' AND status = 'ACTIVE' LIMIT 5
    LOOP
        enc_id := gen_random_uuid();
        INSERT INTO clinical_encounters (id, organization_id, patient_id, encounter_type, status, chief_complaint, created_at)
        VALUES (
            enc_id,
            'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
            patient_rec.id,
            'CONSULTATION',
            'COMPLETED',
            CASE (RANDOM() * 4)::INT
                WHEN 0 THEN 'Nakkesmerter med hodepine'
                WHEN 1 THEN 'Korsryggsmerter'
                WHEN 2 THEN 'Skuldersmerter høyre side'
                WHEN 3 THEN 'Svimmelhet og ustøhet'
                ELSE 'Generelle ryggsmerter'
            END,
            NOW() - (RANDOM() * 90)::INT * interval '1 day'
        ) ON CONFLICT DO NOTHING;
    END LOOP;
END $$;

-- ============================================================================
-- SAMPLE LEADS (CRM)
-- ============================================================================
INSERT INTO leads (id, organization_id, first_name, last_name, email, phone, source, status, main_complaint, notes, created_at)
VALUES
    (gen_random_uuid(), org_id, 'Kristin', 'Fjeld', 'kristin.fjeld@gmail.com', '+47 91122334', 'WEBSITE', 'NEW', 'Akutte nakkesmerter', 'Henvendelse via kontaktskjema. Ønsker time snarest.', NOW() - interval '2 hours'),
    (gen_random_uuid(), org_id, 'Martin', 'Sæther', 'martin.s@outlook.com', '+47 92233445', 'REFERRAL', 'CONTACTED', 'Kroniske ryggsmerter', 'Henvist fra fastlege. Ringt, avtalt samtale i morgen.', NOW() - interval '1 day'),
    (gen_random_uuid(), org_id, 'Linda', 'Bakken', 'linda.bakken@yahoo.no', '+47 93344556', 'GOOGLE', 'QUALIFIED', 'Isjias', 'Kvalifisert lead. Interessert i behandlingsplan.', NOW() - interval '3 days'),
    (gen_random_uuid(), org_id, 'Robert', 'Aas', NULL, '+47 94455667', 'PHONE', 'NEW', 'Svimmelhet', 'Ringte klinikken direkte. Ønsker info om vestibulær behandling.', NOW() - interval '5 hours')
ON CONFLICT DO NOTHING;

END $$;

-- ============================================================================
-- UPDATE STATISTICS
-- ============================================================================
-- Update patient visit counts based on encounters
UPDATE patients p
SET
    total_visits = COALESCE((SELECT COUNT(*) FROM clinical_encounters e WHERE e.patient_id = p.id), 0),
    last_visit_date = (SELECT MAX(DATE(created_at)) FROM clinical_encounters e WHERE e.patient_id = p.id)
WHERE organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

-- ============================================================================
-- VERIFY DATA
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '=== SEED DATA SUMMARY ===';
    RAISE NOTICE 'Patients: %', (SELECT COUNT(*) FROM patients WHERE organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
    RAISE NOTICE 'Message Templates: %', (SELECT COUNT(*) FROM message_templates WHERE organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
    RAISE NOTICE 'Automation Workflows: %', (SELECT COUNT(*) FROM automation_workflows WHERE organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
    RAISE NOTICE 'AI Feedback Records: %', (SELECT COUNT(*) FROM ai_feedback WHERE organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
    RAISE NOTICE 'Leads: %', (SELECT COUNT(*) FROM leads WHERE organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
END $$;
