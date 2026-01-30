-- ============================================================================
-- Seed File: 025_extended_patient_data.sql
-- Description: Extended realistic Norwegian patient data (200+ patients)
-- Created: 2026-01-16
-- ============================================================================

-- Realistic Norwegian names, addresses, and clinical conditions
DO $$
DECLARE
    org_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

    -- Norwegian first names
    male_names TEXT[] := ARRAY['Erik', 'Lars', 'Ole', 'Magnus', 'Henrik', 'Anders', 'Thomas', 'Jonas', 'Per', 'Bjorn',
                                'Kristian', 'Marius', 'Fredrik', 'Eirik', 'Håkon', 'Stian', 'Vegard', 'Geir', 'Odd', 'Tor',
                                'Svein', 'Knut', 'Olav', 'Petter', 'Trond', 'Jon', 'Nils', 'Jan', 'Rune', 'Espen',
                                'Martin', 'Daniel', 'Simen', 'Alexander', 'Øyvind', 'Sindre', 'Emil', 'Oscar', 'William', 'Noah'];

    female_names TEXT[] := ARRAY['Ingrid', 'Kari', 'Silje', 'Emma', 'Anna', 'Sofie', 'Hanna', 'Julie', 'Marte', 'Liv',
                                  'Kristin', 'Helene', 'Maria', 'Sara', 'Thea', 'Nora', 'Ida', 'Maja', 'Emilie', 'Ella',
                                  'Linda', 'Gro', 'Marit', 'Anne', 'Berit', 'Randi', 'Astrid', 'Solveig', 'Inger', 'Eva',
                                  'Camilla', 'Tone', 'Heidi', 'Monica', 'Lene', 'Nina', 'Hege', 'Elisabeth', 'Marianne', 'Lise'];

    -- Norwegian last names
    last_names TEXT[] := ARRAY['Hansen', 'Johansen', 'Olsen', 'Larsen', 'Andersen', 'Pedersen', 'Nilsen', 'Kristiansen', 'Jensen', 'Karlsen',
                               'Berg', 'Haugen', 'Hagen', 'Lund', 'Dahl', 'Moen', 'Solberg', 'Strand', 'Eide', 'Bakke',
                               'Eriksen', 'Holm', 'Gulbrandsen', 'Lie', 'Amundsen', 'Nguyen', 'Iversen', 'Halvorsen', 'Sørensen', 'Martinsen',
                               'Jacobsen', 'Paulsen', 'Knutsen', 'Pettersen', 'Myhre', 'Ellingsen', 'Gundersen', 'Johnsen', 'Simonsen', 'Rasmussen'];

    -- Oslo streets
    streets TEXT[] := ARRAY['Karl Johans gate', 'Bogstadveien', 'Bygdøy Allé', 'Frognerveien', 'Majorstuen', 'Grensen',
                            'Thereses gate', 'Pilestredet', 'Ullevålsveien', 'Kirkeveien', 'Oscars gate', 'Drammensveien',
                            'Skovveien', 'Hegdehaugsveien', 'Parkveien', 'Gimleveien', 'Suhms gate', 'Josefines gate',
                            'Industrigata', 'Schweigaards gate', 'Tøyengata', 'Grünerløkka', 'Thorvald Meyers gate',
                            'Markveien', 'Akersgata', 'Storgata', 'Hausmanns gate', 'Urtegata', 'Fredensborgveien', 'Sandakerveien'];

    -- Oslo postal codes with areas
    postal_codes TEXT[] := ARRAY['0150', '0160', '0250', '0260', '0264', '0270', '0350', '0360', '0450', '0470',
                                  '0550', '0560', '0580', '0650', '0750', '0850', '0950', '1050', '1150', '1250'];

    -- Clinical conditions (Norwegian)
    conditions TEXT[] := ARRAY['Nakkesmerter', 'Korsryggsmerter', 'Skuldersmerter', 'Hodepine', 'Svimmelhet', 'Isjias',
                               'Tennisalbue', 'Kneesmerter', 'Hoftesmerter', 'Brystsmerter muskulært', 'Kjeveleddsproblemer',
                               'Bekkensmerter', 'Migrene', 'Spenningshodepine', 'Whiplash', 'Frozen shoulder',
                               'Løperknee', 'Akillestendinitt', 'Plantarfasciitt', 'Karpaltunnelsyndrom',
                               'Thoracic outlet syndrom', 'Facettleddssyndrom', 'SI-leddsdysfunksjon', 'Cervikogen hodepine'];

    -- Status distribution
    statuses TEXT[] := ARRAY['ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'INACTIVE', 'INACTIVE', 'PROSPECTIVE', 'ARCHIVED'];

    -- Categories
    categories TEXT[] := ARRAY['REGULAR', 'REGULAR', 'REGULAR', 'VIP', 'INSURANCE', 'FAMILY'];

    -- Email domains
    domains TEXT[] := ARRAY['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.no', 'online.no', 'telenor.no', 'icloud.com'];

    i INTEGER;
    gender TEXT;
    first_name TEXT;
    last_name TEXT;
    email TEXT;
    phone TEXT;
    dob DATE;
    street TEXT;
    postal TEXT;
    status TEXT;
    category TEXT;
    condition TEXT;
    created_date TIMESTAMP;

BEGIN
    -- Generate 200 patients
    FOR i IN 1..200 LOOP
        -- Determine gender and name
        IF RANDOM() > 0.48 THEN
            gender := 'MALE';
            first_name := male_names[1 + (RANDOM() * (array_length(male_names, 1) - 1))::INT];
        ELSE
            gender := 'FEMALE';
            first_name := female_names[1 + (RANDOM() * (array_length(female_names, 1) - 1))::INT];
        END IF;

        last_name := last_names[1 + (RANDOM() * (array_length(last_names, 1) - 1))::INT];

        -- Generate email (some patients might not have email)
        IF RANDOM() > 0.15 THEN
            email := LOWER(first_name) || '.' || LOWER(last_name) || (RANDOM() * 100)::INT || '@' || domains[1 + (RANDOM() * (array_length(domains, 1) - 1))::INT];
        ELSE
            email := NULL;
        END IF;

        -- Generate phone (Norwegian format)
        phone := '+47 9' || (1 + (RANDOM() * 8)::INT)::TEXT ||
                 LPAD((RANDOM() * 999999)::INT::TEXT, 6, '0');

        -- Generate birth date (ages 20-80)
        dob := DATE '1945-01-01' + (RANDOM() * 60 * 365)::INT;

        -- Address
        street := streets[1 + (RANDOM() * (array_length(streets, 1) - 1))::INT] || ' ' || (1 + (RANDOM() * 150)::INT)::TEXT;
        postal := postal_codes[1 + (RANDOM() * (array_length(postal_codes, 1) - 1))::INT];

        -- Status and category
        status := statuses[1 + (RANDOM() * (array_length(statuses, 1) - 1))::INT];
        category := categories[1 + (RANDOM() * (array_length(categories, 1) - 1))::INT];

        -- Clinical condition
        condition := conditions[1 + (RANDOM() * (array_length(conditions, 1) - 1))::INT];

        -- Created date (spread over last 3 years)
        created_date := NOW() - (RANDOM() * 1095)::INT * interval '1 day';

        -- Insert patient
        INSERT INTO patients (
            id, organization_id, first_name, last_name, email, phone,
            date_of_birth, gender, address_street, address_city, address_postal_code,
            status, category, main_problem, consent_sms, consent_email,
            total_visits, last_visit_date, created_at
        )
        VALUES (
            gen_random_uuid(), org_id, first_name, last_name, email, phone,
            dob, gender, street, 'Oslo', postal,
            status, category, condition,
            RANDOM() > 0.1, -- 90% consent SMS
            CASE WHEN email IS NOT NULL THEN RANDOM() > 0.15 ELSE false END, -- 85% consent email if has email
            (RANDOM() * 30)::INT, -- 0-30 visits
            CASE WHEN status = 'ACTIVE' THEN (NOW() - (RANDOM() * 90)::INT * interval '1 day')::DATE ELSE NULL END,
            created_date
        ) ON CONFLICT DO NOTHING;

    END LOOP;

    RAISE NOTICE 'Generated 200 patients';
END $$;

-- ============================================================================
-- ADD SAMPLE APPOINTMENTS
-- ============================================================================
DO $$
DECLARE
    org_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    admin_id UUID := 'b1ffcc99-9c0b-4ef8-bb6d-6bb9bd380a22';
    patient_rec RECORD;
    apt_date DATE;
    apt_time TIME;
    apt_status TEXT;
    statuses TEXT[] := ARRAY['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];
BEGIN
    -- Create appointments for active patients
    FOR patient_rec IN
        SELECT id FROM patients
        WHERE organization_id = org_id AND status = 'ACTIVE'
        LIMIT 100
    LOOP
        -- Create 1-5 appointments per patient
        FOR i IN 1..(1 + (RANDOM() * 4)::INT) LOOP
            apt_date := CURRENT_DATE - (RANDOM() * 60)::INT + (RANDOM() * 30)::INT;
            apt_time := TIME '08:00' + (RANDOM() * 10)::INT * interval '1 hour';

            IF apt_date < CURRENT_DATE THEN
                apt_status := statuses[3 + (RANDOM() * 4)::INT]; -- COMPLETED, CANCELLED, NO_SHOW
            ELSE
                apt_status := statuses[1 + (RANDOM() * 2)::INT]; -- SCHEDULED, CONFIRMED
            END IF;

            INSERT INTO appointments (
                id, organization_id, patient_id, provider_id,
                appointment_date, appointment_time, duration_minutes,
                appointment_type, status, created_at
            )
            VALUES (
                gen_random_uuid(), org_id, patient_rec.id, admin_id,
                apt_date, apt_time,
                CASE (RANDOM() * 2)::INT WHEN 0 THEN 30 WHEN 1 THEN 45 ELSE 60 END,
                CASE (RANDOM() * 3)::INT
                    WHEN 0 THEN 'INITIAL_CONSULTATION'
                    WHEN 1 THEN 'FOLLOW_UP'
                    WHEN 2 THEN 'TREATMENT'
                    ELSE 'CHECK_UP'
                END,
                apt_status,
                NOW() - (RANDOM() * 60)::INT * interval '1 day'
            ) ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;

    RAISE NOTICE 'Generated appointments for patients';
END $$;

-- ============================================================================
-- ADD MORE AI FEEDBACK DATA (for learning metrics)
-- ============================================================================
DO $$
DECLARE
    org_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    admin_id UUID := 'b1ffcc99-9c0b-4ef8-bb6d-6bb9bd380a22';

    suggestion_types TEXT[] := ARRAY['soap_subjective', 'soap_objective', 'soap_assessment', 'soap_plan',
                                      'diagnosis_code', 'red_flag', 'clinical_summary', 'spelling'];

    correction_types TEXT[] := ARRAY['accepted_as_is', 'accepted_as_is', 'accepted_as_is', 'minor_edit', 'major_edit', 'rejected'];

    sug_type TEXT;
    cor_type TEXT;
    conf_score DECIMAL;
    rating INTEGER;
    accepted BOOLEAN;
    decision_time INTEGER;
    created_date TIMESTAMP;

BEGIN
    -- Generate 500 feedback records over 90 days
    FOR i IN 1..500 LOOP
        sug_type := suggestion_types[1 + (RANDOM() * (array_length(suggestion_types, 1) - 1))::INT];
        cor_type := correction_types[1 + (RANDOM() * (array_length(correction_types, 1) - 1))::INT];

        -- Confidence score based on suggestion type
        CASE sug_type
            WHEN 'soap_subjective' THEN conf_score := 0.75 + RANDOM() * 0.2;
            WHEN 'soap_objective' THEN conf_score := 0.70 + RANDOM() * 0.25;
            WHEN 'diagnosis_code' THEN conf_score := 0.60 + RANDOM() * 0.35;
            WHEN 'red_flag' THEN conf_score := 0.85 + RANDOM() * 0.14;
            ELSE conf_score := 0.65 + RANDOM() * 0.3;
        END CASE;

        -- Accepted based on correction type
        accepted := cor_type IN ('accepted_as_is', 'minor_edit');

        -- Rating correlates with acceptance and confidence
        IF accepted THEN
            rating := 3 + (RANDOM() * 2)::INT;
        ELSE
            rating := 1 + (RANDOM() * 2)::INT;
        END IF;

        -- Decision time varies by type
        decision_time := 2000 + (RANDOM() * 15000)::INT;

        -- Spread over 90 days
        created_date := NOW() - (RANDOM() * 90)::INT * interval '1 day';

        INSERT INTO ai_feedback (
            id, organization_id, user_id, suggestion_type,
            original_suggestion, user_correction, accepted, correction_type,
            confidence_score, user_rating, time_to_decision, created_at
        )
        VALUES (
            gen_random_uuid(), org_id, admin_id, sug_type,
            CASE sug_type
                WHEN 'soap_subjective' THEN 'Pasienten beskriver ' ||
                    CASE (RANDOM() * 5)::INT
                        WHEN 0 THEN 'smerter i nakke/skulder med gradvis debut. Forverres ved skrivebordsarbeid.'
                        WHEN 1 THEN 'korsryggsmerter med utstråling til venstre ben. VAS 5/10.'
                        WHEN 2 THEN 'hodepine lokalisert frontalt, 3-4 episoder per uke.'
                        WHEN 3 THEN 'svimmelhet utløst av hodebevegelser, spesielt til høyre.'
                        ELSE 'skuldersmerter ved løft over hodet. Debut etter trening.'
                    END
                WHEN 'soap_objective' THEN
                    CASE (RANDOM() * 3)::INT
                        WHEN 0 THEN 'ROM cervikal: Fleksjon 45°, ekstensjon 50°, rotasjon 70° bilat. Palpasjon: Ømhet m. trapezius.'
                        WHEN 1 THEN 'SLR positiv venstre 40°. Styrke L4-S1: 5/5. Sensorikk intakt.'
                        ELSE 'Dix-Hallpike positiv høyre. Nystagmus rotatorisk, habituering etter 30 sek.'
                    END
                WHEN 'diagnosis_code' THEN
                    CASE (RANDOM() * 4)::INT
                        WHEN 0 THEN 'L01 Nakke symptom/plage'
                        WHEN 1 THEN 'L03 Korsrygg symptom/plage'
                        WHEN 2 THEN 'N01 Hodepine'
                        ELSE 'L86 Rygg syndrom med utstråling'
                    END
                WHEN 'red_flag' THEN
                    CASE (RANDOM() * 2)::INT
                        WHEN 0 THEN 'Ingen røde flagg identifisert.'
                        ELSE 'Rødt flagg: Nattsmerter som vekker pasienten. Videre utredning anbefales.'
                    END
                ELSE 'AI-generert klinisk forslag basert på symptompresentasjon.'
            END,
            CASE WHEN cor_type IN ('minor_edit', 'major_edit') THEN 'Korrigert versjon av forslaget' ELSE NULL END,
            accepted, cor_type, conf_score, rating, decision_time, created_date
        ) ON CONFLICT DO NOTHING;

    END LOOP;

    RAISE NOTICE 'Generated 500 AI feedback records';
END $$;

-- ============================================================================
-- ADD FOLLOW-UP TASKS
-- ============================================================================
DO $$
DECLARE
    org_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    admin_id UUID := 'b1ffcc99-9c0b-4ef8-bb6d-6bb9bd380a22';
    patient_rec RECORD;
    followup_types TEXT[] := ARRAY['RECALL_3M', 'RECALL_6M', 'CALL_BACK', 'REACTIVATION', 'CHECK_IN'];
BEGIN
    -- Create follow-ups for inactive patients
    FOR patient_rec IN
        SELECT id FROM patients
        WHERE organization_id = org_id AND status = 'INACTIVE'
        LIMIT 30
    LOOP
        INSERT INTO follow_ups (
            id, organization_id, patient_id, assigned_to,
            follow_up_type, due_date, priority, status, notes, created_at
        )
        VALUES (
            gen_random_uuid(), org_id, patient_rec.id, admin_id,
            followup_types[1 + (RANDOM() * (array_length(followup_types, 1) - 1))::INT],
            CURRENT_DATE + (RANDOM() * 30)::INT,
            CASE (RANDOM() * 2)::INT WHEN 0 THEN 'HIGH' WHEN 1 THEN 'MEDIUM' ELSE 'LOW' END,
            CASE (RANDOM() * 3)::INT WHEN 0 THEN 'PENDING' WHEN 1 THEN 'IN_PROGRESS' ELSE 'PENDING' END,
            'Automatisk generert oppfølging for inaktiv pasient',
            NOW() - (RANDOM() * 7)::INT * interval '1 day'
        ) ON CONFLICT DO NOTHING;
    END LOOP;

    RAISE NOTICE 'Generated follow-up tasks';
END $$;

-- ============================================================================
-- UPDATE DAILY METRICS
-- ============================================================================
-- Run the daily metrics function for the last 30 days
DO $$
DECLARE
    target_date DATE;
BEGIN
    FOR i IN 0..30 LOOP
        target_date := CURRENT_DATE - i;
        PERFORM update_daily_ai_metrics(target_date);
    END LOOP;
    RAISE NOTICE 'Updated daily AI metrics';
END $$;

-- ============================================================================
-- FINAL SUMMARY
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== EXTENDED DATA SUMMARY ===';
    RAISE NOTICE 'Total Patients: %', (SELECT COUNT(*) FROM patients WHERE organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
    RAISE NOTICE '  - Active: %', (SELECT COUNT(*) FROM patients WHERE organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' AND status = 'ACTIVE');
    RAISE NOTICE '  - Inactive: %', (SELECT COUNT(*) FROM patients WHERE organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' AND status = 'INACTIVE');
    RAISE NOTICE '  - Prospective: %', (SELECT COUNT(*) FROM patients WHERE organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' AND status = 'PROSPECTIVE');
    RAISE NOTICE 'Appointments: %', (SELECT COUNT(*) FROM appointments WHERE organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
    RAISE NOTICE 'AI Feedback Records: %', (SELECT COUNT(*) FROM ai_feedback WHERE organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
    RAISE NOTICE 'Daily Metrics Records: %', (SELECT COUNT(*) FROM ai_daily_metrics WHERE organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
    RAISE NOTICE 'Follow-up Tasks: %', (SELECT COUNT(*) FROM follow_ups WHERE organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
    RAISE NOTICE 'Message Templates: %', (SELECT COUNT(*) FROM message_templates WHERE organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
    RAISE NOTICE 'Automation Workflows: %', (SELECT COUNT(*) FROM automation_workflows WHERE organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
    RAISE NOTICE '';
END $$;
