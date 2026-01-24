-- ============================================================================
-- Spine Text Templates - Default Norwegian Palpation Findings
-- Quick-click text insertion for clinical documentation
-- ============================================================================

-- Clear existing default templates
DELETE FROM spine_text_templates WHERE is_default = true;

-- ============================================================================
-- CERVICAL SPINE
-- ============================================================================

-- Occiput-Atlas (C0-C1)
INSERT INTO spine_text_templates (segment, direction, finding_type, text_template, language, is_default, sort_order) VALUES
('C0-C1', 'left', 'palpation', 'Occiput-atlas (C0-C1) lateral til venstre. ', 'NO', true, 1),
('C0-C1', 'right', 'palpation', 'Occiput-atlas (C0-C1) lateral til høyre. ', 'NO', true, 2),
('C0-C1', 'posterior', 'palpation', 'Occiput-atlas (C0-C1) posterior. ', 'NO', true, 3),
('C0-C1', 'anterior', 'palpation', 'Occiput-atlas (C0-C1) anterior. ', 'NO', true, 4),
('C0-C1', 'bilateral', 'palpation', 'Occiput-atlas (C0-C1) bilateral restriksjon. ', 'NO', true, 5);

-- Atlas (C1)
INSERT INTO spine_text_templates (segment, direction, finding_type, text_template, language, is_default, sort_order) VALUES
('C1', 'left', 'palpation', 'Atlas (C1) lateral til venstre. ', 'NO', true, 10),
('C1', 'right', 'palpation', 'Atlas (C1) lateral til høyre. ', 'NO', true, 11),
('C1', 'posterior', 'palpation', 'Atlas (C1) posterior. ', 'NO', true, 12),
('C1', 'anterior', 'palpation', 'Atlas (C1) anterior. ', 'NO', true, 13),
('C1', 'superior', 'palpation', 'Atlas (C1) superior. ', 'NO', true, 14),
('C1', 'inferior', 'palpation', 'Atlas (C1) inferior. ', 'NO', true, 15);

-- Axis (C2)
INSERT INTO spine_text_templates (segment, direction, finding_type, text_template, language, is_default, sort_order) VALUES
('C2', 'left', 'palpation', 'Axis (C2) rotasjon til venstre. ', 'NO', true, 20),
('C2', 'right', 'palpation', 'Axis (C2) rotasjon til høyre. ', 'NO', true, 21),
('C2', 'posterior', 'palpation', 'Axis (C2) posterior. ', 'NO', true, 22),
('C2', 'anterior', 'palpation', 'Axis (C2) anterior. ', 'NO', true, 23),
('C2', 'bilateral', 'palpation', 'Axis (C2) bilateral restriksjon. ', 'NO', true, 24);

-- C3-C7 (Lower Cervical)
INSERT INTO spine_text_templates (segment, direction, finding_type, text_template, language, is_default, sort_order) VALUES
('C3', 'left', 'palpation', 'C3 segmentell dysfunksjon, lateral til venstre. ', 'NO', true, 30),
('C3', 'right', 'palpation', 'C3 segmentell dysfunksjon, lateral til høyre. ', 'NO', true, 31),
('C3', 'posterior', 'palpation', 'C3 posterior restriksjon. ', 'NO', true, 32),
('C3', 'bilateral', 'palpation', 'C3 bilateral restriksjon. ', 'NO', true, 33),

('C4', 'left', 'palpation', 'C4 segmentell dysfunksjon, lateral til venstre. ', 'NO', true, 40),
('C4', 'right', 'palpation', 'C4 segmentell dysfunksjon, lateral til høyre. ', 'NO', true, 41),
('C4', 'posterior', 'palpation', 'C4 posterior restriksjon. ', 'NO', true, 42),
('C4', 'bilateral', 'palpation', 'C4 bilateral restriksjon. ', 'NO', true, 43),

('C5', 'left', 'palpation', 'C5 segmentell dysfunksjon, lateral til venstre. ', 'NO', true, 50),
('C5', 'right', 'palpation', 'C5 segmentell dysfunksjon, lateral til høyre. ', 'NO', true, 51),
('C5', 'posterior', 'palpation', 'C5 posterior restriksjon. ', 'NO', true, 52),
('C5', 'bilateral', 'palpation', 'C5 bilateral restriksjon. ', 'NO', true, 53),

('C6', 'left', 'palpation', 'C6 segmentell dysfunksjon, lateral til venstre. ', 'NO', true, 60),
('C6', 'right', 'palpation', 'C6 segmentell dysfunksjon, lateral til høyre. ', 'NO', true, 61),
('C6', 'posterior', 'palpation', 'C6 posterior restriksjon. ', 'NO', true, 62),
('C6', 'bilateral', 'palpation', 'C6 bilateral restriksjon. ', 'NO', true, 63),

('C7', 'left', 'palpation', 'C7 segmentell dysfunksjon, lateral til venstre. ', 'NO', true, 70),
('C7', 'right', 'palpation', 'C7 segmentell dysfunksjon, lateral til høyre. ', 'NO', true, 71),
('C7', 'posterior', 'palpation', 'C7 posterior restriksjon. ', 'NO', true, 72),
('C7', 'bilateral', 'palpation', 'C7 bilateral restriksjon. ', 'NO', true, 73);

-- ============================================================================
-- THORACIC SPINE
-- ============================================================================

INSERT INTO spine_text_templates (segment, direction, finding_type, text_template, language, is_default, sort_order) VALUES
('T1', 'left', 'palpation', 'T1 segmentell dysfunksjon til venstre. ', 'NO', true, 100),
('T1', 'right', 'palpation', 'T1 segmentell dysfunksjon til høyre. ', 'NO', true, 101),
('T1', 'posterior', 'palpation', 'T1 posterior restriksjon. ', 'NO', true, 102),
('T1', 'bilateral', 'palpation', 'T1 bilateral restriksjon. ', 'NO', true, 103),

('T2', 'left', 'palpation', 'T2 segmentell dysfunksjon til venstre. ', 'NO', true, 110),
('T2', 'right', 'palpation', 'T2 segmentell dysfunksjon til høyre. ', 'NO', true, 111),
('T2', 'posterior', 'palpation', 'T2 posterior restriksjon. ', 'NO', true, 112),
('T2', 'bilateral', 'palpation', 'T2 bilateral restriksjon. ', 'NO', true, 113),

('T3', 'left', 'palpation', 'T3 segmentell dysfunksjon til venstre. ', 'NO', true, 120),
('T3', 'right', 'palpation', 'T3 segmentell dysfunksjon til høyre. ', 'NO', true, 121),
('T3', 'posterior', 'palpation', 'T3 posterior restriksjon. ', 'NO', true, 122),
('T3', 'bilateral', 'palpation', 'T3 bilateral restriksjon. ', 'NO', true, 123),

('T4', 'left', 'palpation', 'T4 segmentell dysfunksjon til venstre. ', 'NO', true, 130),
('T4', 'right', 'palpation', 'T4 segmentell dysfunksjon til høyre. ', 'NO', true, 131),
('T4', 'posterior', 'palpation', 'T4 posterior restriksjon. ', 'NO', true, 132),
('T4', 'bilateral', 'palpation', 'T4 bilateral restriksjon. ', 'NO', true, 133),

('T5', 'left', 'palpation', 'T5 segmentell dysfunksjon til venstre. ', 'NO', true, 140),
('T5', 'right', 'palpation', 'T5 segmentell dysfunksjon til høyre. ', 'NO', true, 141),
('T5', 'posterior', 'palpation', 'T5 posterior restriksjon. ', 'NO', true, 142),
('T5', 'bilateral', 'palpation', 'T5 bilateral restriksjon. ', 'NO', true, 143),

('T6', 'left', 'palpation', 'T6 segmentell dysfunksjon til venstre. ', 'NO', true, 150),
('T6', 'right', 'palpation', 'T6 segmentell dysfunksjon til høyre. ', 'NO', true, 151),
('T6', 'posterior', 'palpation', 'T6 posterior restriksjon. ', 'NO', true, 152),
('T6', 'bilateral', 'palpation', 'T6 bilateral restriksjon. ', 'NO', true, 153),

('T7', 'left', 'palpation', 'T7 segmentell dysfunksjon til venstre. ', 'NO', true, 160),
('T7', 'right', 'palpation', 'T7 segmentell dysfunksjon til høyre. ', 'NO', true, 161),
('T7', 'posterior', 'palpation', 'T7 posterior restriksjon. ', 'NO', true, 162),
('T7', 'bilateral', 'palpation', 'T7 bilateral restriksjon. ', 'NO', true, 163),

('T8', 'left', 'palpation', 'T8 segmentell dysfunksjon til venstre. ', 'NO', true, 170),
('T8', 'right', 'palpation', 'T8 segmentell dysfunksjon til høyre. ', 'NO', true, 171),
('T8', 'posterior', 'palpation', 'T8 posterior restriksjon. ', 'NO', true, 172),
('T8', 'bilateral', 'palpation', 'T8 bilateral restriksjon. ', 'NO', true, 173),

('T9', 'left', 'palpation', 'T9 segmentell dysfunksjon til venstre. ', 'NO', true, 180),
('T9', 'right', 'palpation', 'T9 segmentell dysfunksjon til høyre. ', 'NO', true, 181),
('T9', 'posterior', 'palpation', 'T9 posterior restriksjon. ', 'NO', true, 182),
('T9', 'bilateral', 'palpation', 'T9 bilateral restriksjon. ', 'NO', true, 183),

('T10', 'left', 'palpation', 'T10 segmentell dysfunksjon til venstre. ', 'NO', true, 190),
('T10', 'right', 'palpation', 'T10 segmentell dysfunksjon til høyre. ', 'NO', true, 191),
('T10', 'posterior', 'palpation', 'T10 posterior restriksjon. ', 'NO', true, 192),
('T10', 'bilateral', 'palpation', 'T10 bilateral restriksjon. ', 'NO', true, 193),

('T11', 'left', 'palpation', 'T11 segmentell dysfunksjon til venstre. ', 'NO', true, 200),
('T11', 'right', 'palpation', 'T11 segmentell dysfunksjon til høyre. ', 'NO', true, 201),
('T11', 'posterior', 'palpation', 'T11 posterior restriksjon. ', 'NO', true, 202),
('T11', 'bilateral', 'palpation', 'T11 bilateral restriksjon. ', 'NO', true, 203),

('T12', 'left', 'palpation', 'T12 segmentell dysfunksjon til venstre. ', 'NO', true, 210),
('T12', 'right', 'palpation', 'T12 segmentell dysfunksjon til høyre. ', 'NO', true, 211),
('T12', 'posterior', 'palpation', 'T12 posterior restriksjon. ', 'NO', true, 212),
('T12', 'bilateral', 'palpation', 'T12 bilateral restriksjon. ', 'NO', true, 213);

-- ============================================================================
-- LUMBAR SPINE
-- ============================================================================

INSERT INTO spine_text_templates (segment, direction, finding_type, text_template, language, is_default, sort_order) VALUES
('L1', 'left', 'palpation', 'L1 segmentell dysfunksjon til venstre. ', 'NO', true, 300),
('L1', 'right', 'palpation', 'L1 segmentell dysfunksjon til høyre. ', 'NO', true, 301),
('L1', 'posterior', 'palpation', 'L1 posterior restriksjon. ', 'NO', true, 302),
('L1', 'bilateral', 'palpation', 'L1 bilateral restriksjon. ', 'NO', true, 303),

('L2', 'left', 'palpation', 'L2 segmentell dysfunksjon til venstre. ', 'NO', true, 310),
('L2', 'right', 'palpation', 'L2 segmentell dysfunksjon til høyre. ', 'NO', true, 311),
('L2', 'posterior', 'palpation', 'L2 posterior restriksjon. ', 'NO', true, 312),
('L2', 'bilateral', 'palpation', 'L2 bilateral restriksjon. ', 'NO', true, 313),

('L3', 'left', 'palpation', 'L3 segmentell dysfunksjon til venstre. ', 'NO', true, 320),
('L3', 'right', 'palpation', 'L3 segmentell dysfunksjon til høyre. ', 'NO', true, 321),
('L3', 'posterior', 'palpation', 'L3 posterior restriksjon. ', 'NO', true, 322),
('L3', 'bilateral', 'palpation', 'L3 bilateral restriksjon. ', 'NO', true, 323),

('L4', 'left', 'palpation', 'L4 segmentell dysfunksjon til venstre. ', 'NO', true, 330),
('L4', 'right', 'palpation', 'L4 segmentell dysfunksjon til høyre. ', 'NO', true, 331),
('L4', 'posterior', 'palpation', 'L4 posterior restriksjon. ', 'NO', true, 332),
('L4', 'bilateral', 'palpation', 'L4 bilateral restriksjon. ', 'NO', true, 333),

('L5', 'left', 'palpation', 'L5 segmentell dysfunksjon til venstre. ', 'NO', true, 340),
('L5', 'right', 'palpation', 'L5 segmentell dysfunksjon til høyre. ', 'NO', true, 341),
('L5', 'posterior', 'palpation', 'L5 posterior restriksjon. ', 'NO', true, 342),
('L5', 'bilateral', 'palpation', 'L5 bilateral restriksjon. ', 'NO', true, 343),
('L5', 'anterior', 'palpation', 'L5 anterolistese. ', 'NO', true, 344);

-- ============================================================================
-- SACRAL & PELVIS
-- ============================================================================

INSERT INTO spine_text_templates (segment, direction, finding_type, text_template, language, is_default, sort_order) VALUES
-- Sacrum
('Sacrum', 'left', 'palpation', 'Sakrum rotasjon til venstre. ', 'NO', true, 400),
('Sacrum', 'right', 'palpation', 'Sakrum rotasjon til høyre. ', 'NO', true, 401),
('Sacrum', 'posterior', 'palpation', 'Sakrum posterior (nutasjon). ', 'NO', true, 402),
('Sacrum', 'anterior', 'palpation', 'Sakrum anterior (kontranutasjon). ', 'NO', true, 403),
('Sacrum', 'bilateral', 'palpation', 'Sakrum bilateral restriksjon. ', 'NO', true, 404),

-- SI Joint Left
('SI-L', 'posterior', 'palpation', 'Venstre SI-ledd posterior restriksjon. ', 'NO', true, 410),
('SI-L', 'anterior', 'palpation', 'Venstre SI-ledd anterior restriksjon. ', 'NO', true, 411),
('SI-L', 'superior', 'palpation', 'Venstre SI-ledd superior (upslip). ', 'NO', true, 412),
('SI-L', 'inferior', 'palpation', 'Venstre SI-ledd inferior (downslip). ', 'NO', true, 413),
('SI-L', 'inflare', 'palpation', 'Venstre ilium inflare. ', 'NO', true, 414),
('SI-L', 'outflare', 'palpation', 'Venstre ilium outflare. ', 'NO', true, 415),

-- SI Joint Right
('SI-R', 'posterior', 'palpation', 'Høyre SI-ledd posterior restriksjon. ', 'NO', true, 420),
('SI-R', 'anterior', 'palpation', 'Høyre SI-ledd anterior restriksjon. ', 'NO', true, 421),
('SI-R', 'superior', 'palpation', 'Høyre SI-ledd superior (upslip). ', 'NO', true, 422),
('SI-R', 'inferior', 'palpation', 'Høyre SI-ledd inferior (downslip). ', 'NO', true, 423),
('SI-R', 'inflare', 'palpation', 'Høyre ilium inflare. ', 'NO', true, 424),
('SI-R', 'outflare', 'palpation', 'Høyre ilium outflare. ', 'NO', true, 425),

-- Coccyx
('Coccyx', 'left', 'palpation', 'Coccyx lateral til venstre. ', 'NO', true, 430),
('Coccyx', 'right', 'palpation', 'Coccyx lateral til høyre. ', 'NO', true, 431),
('Coccyx', 'anterior', 'palpation', 'Coccyx anterior fleksjon. ', 'NO', true, 432),
('Coccyx', 'posterior', 'palpation', 'Coccyx posterior ekstensjon. ', 'NO', true, 433);

-- ============================================================================
-- ENGLISH TEMPLATES (for international users)
-- ============================================================================

-- Sample English templates (abbreviated set)
INSERT INTO spine_text_templates (segment, direction, finding_type, text_template, language, is_default, sort_order) VALUES
('C1', 'left', 'palpation', 'Atlas (C1) lateral to left. ', 'EN', true, 10),
('C1', 'right', 'palpation', 'Atlas (C1) lateral to right. ', 'EN', true, 11),
('C2', 'left', 'palpation', 'Axis (C2) rotation to left. ', 'EN', true, 20),
('C2', 'right', 'palpation', 'Axis (C2) rotation to right. ', 'EN', true, 21),
('L5', 'left', 'palpation', 'L5 segmental dysfunction to left. ', 'EN', true, 340),
('L5', 'right', 'palpation', 'L5 segmental dysfunction to right. ', 'EN', true, 341),
('SI-L', 'posterior', 'palpation', 'Left SI joint posterior restriction. ', 'EN', true, 410),
('SI-R', 'posterior', 'palpation', 'Right SI joint posterior restriction. ', 'EN', true, 420);

-- ============================================================================
-- MUSCLE TENSION/SPASM FINDINGS (Common palpation findings)
-- ============================================================================

INSERT INTO spine_text_templates (segment, direction, finding_type, text_template, language, is_default, sort_order) VALUES
-- Cervical muscle findings
('C-para', 'left', 'palpation', 'Muskelspasme i venstre cervikal paravertebral muskulatur. ', 'NO', true, 500),
('C-para', 'right', 'palpation', 'Muskelspasme i høyre cervikal paravertebral muskulatur. ', 'NO', true, 501),
('C-para', 'bilateral', 'palpation', 'Bilateral muskelspasme i cervikal paravertebral muskulatur. ', 'NO', true, 502),

-- Thoracic muscle findings
('T-para', 'left', 'palpation', 'Muskelspasme i venstre thorakal paravertebral muskulatur. ', 'NO', true, 510),
('T-para', 'right', 'palpation', 'Muskelspasme i høyre thorakal paravertebral muskulatur. ', 'NO', true, 511),
('T-para', 'bilateral', 'palpation', 'Bilateral muskelspasme i thorakal paravertebral muskulatur. ', 'NO', true, 512),

-- Lumbar muscle findings
('L-para', 'left', 'palpation', 'Muskelspasme i venstre lumbal paravertebral muskulatur. ', 'NO', true, 520),
('L-para', 'right', 'palpation', 'Muskelspasme i høyre lumbal paravertebral muskulatur. ', 'NO', true, 521),
('L-para', 'bilateral', 'palpation', 'Bilateral muskelspasme i lumbal paravertebral muskulatur. ', 'NO', true, 522),

-- QL findings
('QL', 'left', 'palpation', 'Ømhet og spenning i venstre quadratus lumborum. ', 'NO', true, 530),
('QL', 'right', 'palpation', 'Ømhet og spenning i høyre quadratus lumborum. ', 'NO', true, 531),
('QL', 'bilateral', 'palpation', 'Bilateral ømhet og spenning i quadratus lumborum. ', 'NO', true, 532),

-- Piriformis
('Piriformis', 'left', 'palpation', 'Triggerpunkt i venstre piriformis. ', 'NO', true, 540),
('Piriformis', 'right', 'palpation', 'Triggerpunkt i høyre piriformis. ', 'NO', true, 541),
('Piriformis', 'bilateral', 'palpation', 'Bilateral triggerpunkt i piriformis. ', 'NO', true, 542);
