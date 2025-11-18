-- Norwegian Takster (Treatment) Codes for Chiropractic Practice
-- Based on Norwegian Chiropractors Association (NKF) fee schedule
-- Prices as of 2024 (may need annual updates)

-- Primary Treatment Codes
INSERT INTO treatment_codes (code, category, description_no, description_en, default_price, insurance_reimbursement, duration_minutes, commonly_used, usage_count) VALUES
-- L2 Series: Chiropractic Consultation
('L214', 'KONSULTASJON', 'Kiropraktisk førstekonsultasjon', 'Chiropractic initial consultation', 750.00, 250.00, 45, true, 500),
('L215', 'KONSULTASJON', 'Kiropraktisk konsultasjon', 'Chiropractic consultation', 550.00, 200.00, 30, true, 1500),
('L216', 'KONSULTASJON', 'Kiropraktisk konsultasjon ekstra tid', 'Chiropractic consultation extended time', 200.00, 0.00, 15, true, 200),

-- L2 Series: Treatment Techniques
('L220', 'BEHANDLING', 'Mobilisering av virvelledd', 'Mobilization of spinal joint', 350.00, 100.00, 20, true, 800),
('L221', 'BEHANDLING', 'Manipulasjon av virvelledd (HVLA)', 'Manipulation of spinal joint (HVLA)', 450.00, 150.00, 20, true, 1200),
('L222', 'BEHANDLING', 'Manipulasjon av ekstremitetsledd', 'Manipulation of extremity joint', 400.00, 120.00, 15, true, 600),
('L223', 'BEHANDLING', 'Myofascial behandling', 'Myofascial treatment', 350.00, 80.00, 20, true, 700),
('L224', 'BEHANDLING', 'Triggerpunkt behandling', 'Trigger point therapy', 350.00, 80.00, 20, true, 500),
('L225', 'BEHANDLING', 'Tøyning og strekk', 'Stretching techniques', 250.00, 50.00, 15, true, 400),
('L226', 'BEHANDLING', 'Aktivering og stabilisering', 'Activation and stabilization', 350.00, 80.00, 20, true, 450),
('L227', 'BEHANDLING', 'Manuell trekk (traksjon)', 'Manual traction', 300.00, 70.00, 15, true, 300),

-- Modality Codes
('L230', 'MODALITET', 'Kald-/varmebehandling', 'Hot/cold therapy', 150.00, 30.00, 10, true, 600),
('L231', 'MODALITET', 'Ultralyd behandling', 'Ultrasound therapy', 200.00, 40.00, 10, true, 400),
('L232', 'MODALITET', 'Elektrisk stimulering (TENS/EMS)', 'Electrical stimulation', 200.00, 40.00, 10, true, 350),
('L233', 'MODALITET', 'Mekanisk traksjon', 'Mechanical traction', 250.00, 50.00, 15, true, 200),
('L234', 'MODALITET', 'Teip/taping (Kinesiologisk)', 'Kinesiology taping', 150.00, 0.00, 10, true, 500),
('L235', 'MODALITET', 'Laserbehandling', 'Laser therapy', 250.00, 50.00, 10, false, 150),

-- Dry Needling and Acupuncture
('L240', 'NÅLEBEHANDLING', 'Dry needling - kort', 'Dry needling - short', 350.00, 0.00, 15, true, 400),
('L241', 'NÅLEBEHANDLING', 'Dry needling - lang', 'Dry needling - extended', 500.00, 0.00, 30, true, 300),
('L242', 'NÅLEBEHANDLING', 'Akupunktur', 'Acupuncture', 500.00, 0.00, 30, true, 250),

-- Rehabilitation and Exercise
('L250', 'REHABILITERING', 'Individuell treningsveiledning', 'Individual exercise guidance', 400.00, 80.00, 30, true, 350),
('L251', 'REHABILITERING', 'Gruppetrening (per person)', 'Group exercise (per person)', 250.00, 50.00, 45, true, 200),
('L252', 'REHABILITERING', 'Ergonomi og arbeidsplassvurdering', 'Ergonomic workplace assessment', 800.00, 0.00, 60, false, 50),
('L253', 'REHABILITERING', 'Hjemmeøvelser - utlevering program', 'Home exercise program delivery', 200.00, 0.00, 15, true, 400),

-- Assessment and Evaluation
('L260', 'VURDERING', 'Spesiell nevrologisk undersøkelse', 'Special neurological examination', 400.00, 100.00, 30, false, 100),
('L261', 'VURDERING', 'Ortopedisk testing omfattende', 'Comprehensive orthopedic testing', 400.00, 100.00, 30, true, 200),
('L262', 'VURDERING', 'Postural analyse', 'Postural analysis', 300.00, 50.00, 20, true, 250),
('L263', 'VURDERING', 'Funksjonell bevegelsesanalyse', 'Functional movement assessment', 350.00, 80.00, 25, true, 180),
('L264', 'VURDERING', 'Røntgenbilde (med henvisning)', 'X-ray imaging (with referral)', 0.00, 0.00, 0, false, 50),

-- Specialized Treatments
('L270', 'SPESIALISERT', 'SOT (Sakro-Oksiput Teknikk)', 'SOT (Sacro Occipital Technique)', 550.00, 150.00, 30, false, 120),
('L271', 'SPESIALISERT', 'Applied Kinesiology', 'Applied Kinesiology', 550.00, 150.00, 30, false, 100),
('L272', 'SPESIALISERT', 'Thompson Drop teknikk', 'Thompson Drop technique', 450.00, 120.00, 20, false, 150),
('L273', 'SPESIALISERT', 'Activator metode', 'Activator method', 450.00, 120.00, 20, false, 140),
('L274', 'SPESIALISERT', 'Gonstead teknikk', 'Gonstead technique', 550.00, 150.00, 30, false, 110),
('L275', 'SPESIALISERT', 'Flexion-Distraction (Cox)', 'Flexion-Distraction (Cox)', 450.00, 120.00, 25, false, 90),
('L276', 'SPESIALISERT', 'Graston/IASTM teknikk', 'Graston/IASTM technique', 400.00, 80.00, 20, true, 200),

-- Documentation and Administrative
('L280', 'ADMINISTRASJON', 'Attest/erklæring enkel', 'Simple medical certificate', 250.00, 0.00, 10, true, 300),
('L281', 'ADMINISTRASJON', 'Attest/erklæring omfattende', 'Comprehensive medical certificate', 500.00, 0.00, 20, true, 150),
('L282', 'ADMINISTRASJON', 'Henvisning til spesialist', 'Referral to specialist', 200.00, 0.00, 15, true, 100),
('L283', 'ADMINISTRASJON', 'Journalkopi/elektronisk overføring', 'Medical record copy/transfer', 200.00, 0.00, 10, true, 80),
('L284', 'ADMINISTRASJON', 'Telefon/video konsultasjon kort', 'Phone/video consultation short', 300.00, 0.00, 15, true, 200),
('L285', 'ADMINISTRASJON', 'Telefon/video konsultasjon lang', 'Phone/video consultation extended', 500.00, 0.00, 30, true, 100),

-- Package Deals (Treatment Series)
('PKG10', 'PAKKE', '10-serie behandlinger (rabatt 10%)', '10-treatment package (10% discount)', 4950.00, 0.00, 0, true, 150),
('PKG5', 'PAKKE', '5-serie behandlinger (rabatt 5%)', '5-treatment package (5% discount)', 2612.50, 0.00, 0, true, 200),

-- NAV/HELFO Related
('NAV01', 'NAV', 'NAV serie - førstebesøk', 'NAV series - initial visit', 750.00, 250.00, 45, true, 300),
('NAV02', 'NAV', 'NAV serie - oppfølging', 'NAV series - follow-up', 550.00, 200.00, 30, true, 400),
('HELFO01', 'HELFO', 'HELFO refusjon - standard', 'HELFO reimbursement - standard', 0.00, 200.00, 0, true, 250);

-- Special Codes for Combination Treatments
INSERT INTO treatment_codes (code, category, description_no, description_en, default_price, insurance_reimbursement, duration_minutes, commonly_used, usage_count) VALUES
('COMB1', 'KOMBINASJON', 'Standard behandling (L215 + L221 + L223)', 'Standard treatment package', 800.00, 250.00, 40, true, 1000),
('COMB2', 'KOMBINASJON', 'Utvidet behandling med modalitet', 'Extended treatment with modality', 950.00, 280.00, 50, true, 600),
('COMB3', 'KOMBINASJON', 'Rehabilitering med trening', 'Rehabilitation with exercise', 900.00, 260.00, 50, true, 400);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_treatment_codes_category ON treatment_codes(category);
CREATE INDEX IF NOT EXISTS idx_treatment_codes_commonly_used ON treatment_codes(commonly_used);
CREATE INDEX IF NOT EXISTS idx_treatment_codes_search ON treatment_codes USING gin(to_tsvector('norwegian', description_no || ' ' || description_en));

-- Update counts
UPDATE treatment_codes SET usage_count = 0 WHERE usage_count IS NULL;

-- Add helpful notes
COMMENT ON TABLE treatment_codes IS 'Norwegian chiropractic treatment codes (Takster) based on NKF fee schedule';
COMMENT ON COLUMN treatment_codes.default_price IS 'Price in NOK - update annually based on NKF recommendations';
COMMENT ON COLUMN treatment_codes.insurance_reimbursement IS 'NAV/HELFO reimbursement amount in NOK';
