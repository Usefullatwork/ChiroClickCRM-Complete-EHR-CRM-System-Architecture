-- Seed: Finding-Diagnosis Map
-- Common chiropractic diagnoses mapped to expected anatomy findings
-- Used by assessment-first workflow to auto-suggest findings when a diagnosis is selected

INSERT INTO finding_diagnosis_map (diagnosis_code, diagnosis_name, body_region, expected_findings, suggested_ortho_tests, confidence) VALUES
-- Cervical segmental dysfunction (M99.01)
('M99.01', 'Cervikal segmentdysfunksjon', 'C1', '[{"type":"palpation","severity_range":["mild","moderate"]}]', '{"cervical_rom","spurlings_test","distraction_test"}', 0.85),
('M99.01', 'Cervikal segmentdysfunksjon', 'C2', '[{"type":"palpation","severity_range":["mild","moderate"]}]', '{"cervical_rom","spurlings_test","distraction_test"}', 0.85),
('M99.01', 'Cervikal segmentdysfunksjon', 'C3', '[{"type":"palpation","severity_range":["mild","moderate"]}]', '{"cervical_rom","spurlings_test"}', 0.85),
('M99.01', 'Cervikal segmentdysfunksjon', 'C4', '[{"type":"palpation","severity_range":["mild","moderate"]}]', '{"cervical_rom","spurlings_test"}', 0.85),
('M99.01', 'Cervikal segmentdysfunksjon', 'C5', '[{"type":"palpation","severity_range":["mild","moderate"]}]', '{"cervical_rom","spurlings_test"}', 0.85),
('M99.01', 'Cervikal segmentdysfunksjon', 'C6', '[{"type":"palpation","severity_range":["mild","moderate"]}]', '{"cervical_rom","spurlings_test"}', 0.85),
('M99.01', 'Cervikal segmentdysfunksjon', 'C7', '[{"type":"palpation","severity_range":["mild","moderate"]}]', '{"cervical_rom","spurlings_test"}', 0.85),

-- Thoracic segmental dysfunction (M99.02)
('M99.02', 'Torakal segmentdysfunksjon', 'T1', '[{"type":"palpation","severity_range":["mild","moderate"]}]', '{"thoracic_rom","rib_spring_test"}', 0.80),
('M99.02', 'Torakal segmentdysfunksjon', 'T4', '[{"type":"palpation","severity_range":["mild","moderate"]}]', '{"thoracic_rom","rib_spring_test"}', 0.80),
('M99.02', 'Torakal segmentdysfunksjon', 'T6', '[{"type":"palpation","severity_range":["mild","moderate"]}]', '{"thoracic_rom","rib_spring_test"}', 0.80),
('M99.02', 'Torakal segmentdysfunksjon', 'T8', '[{"type":"palpation","severity_range":["mild","moderate"]}]', '{"thoracic_rom","rib_spring_test"}', 0.80),
('M99.02', 'Torakal segmentdysfunksjon', 'T12', '[{"type":"palpation","severity_range":["mild","moderate"]}]', '{"thoracic_rom","rib_spring_test"}', 0.80),

-- Lumbar segmental dysfunction (M99.03)
('M99.03', 'Lumbal segmentdysfunksjon', 'L1', '[{"type":"palpation","severity_range":["mild","moderate","severe"]}]', '{"lumbar_rom","slr_test","kemp_test"}', 0.90),
('M99.03', 'Lumbal segmentdysfunksjon', 'L2', '[{"type":"palpation","severity_range":["mild","moderate","severe"]}]', '{"lumbar_rom","slr_test","kemp_test"}', 0.90),
('M99.03', 'Lumbal segmentdysfunksjon', 'L3', '[{"type":"palpation","severity_range":["mild","moderate","severe"]}]', '{"lumbar_rom","slr_test","kemp_test"}', 0.90),
('M99.03', 'Lumbal segmentdysfunksjon', 'L4', '[{"type":"palpation","severity_range":["mild","moderate","severe"]}]', '{"lumbar_rom","slr_test","kemp_test"}', 0.90),
('M99.03', 'Lumbal segmentdysfunksjon', 'L5', '[{"type":"palpation","severity_range":["mild","moderate","severe"]}]', '{"lumbar_rom","slr_test","kemp_test"}', 0.90),

-- Cervicalgia (M54.2)
('M54.2', 'Cervikalgi', 'C3', '[{"type":"palpation","severity_range":["moderate","severe"]},{"type":"rom","laterality":"bilateral"}]', '{"cervical_rom","spurlings_test","valsalva"}', 0.85),
('M54.2', 'Cervikalgi', 'C4', '[{"type":"palpation","severity_range":["moderate","severe"]},{"type":"rom","laterality":"bilateral"}]', '{"cervical_rom","spurlings_test"}', 0.85),
('M54.2', 'Cervikalgi', 'C5', '[{"type":"palpation","severity_range":["moderate","severe"]},{"type":"rom","laterality":"bilateral"}]', '{"cervical_rom","spurlings_test"}', 0.85),
('M54.2', 'Cervikalgi', 'C6', '[{"type":"palpation","severity_range":["moderate","severe"]},{"type":"rom","laterality":"bilateral"}]', '{"cervical_rom","spurlings_test"}', 0.80),

-- Low back pain (M54.5)
('M54.5', 'Korsryggsmerte', 'L3', '[{"type":"palpation","severity_range":["moderate","severe"]},{"type":"rom","laterality":"bilateral"}]', '{"lumbar_rom","slr_test","kemp_test","mckenzie_assessment"}', 0.90),
('M54.5', 'Korsryggsmerte', 'L4', '[{"type":"palpation","severity_range":["moderate","severe"]},{"type":"rom","laterality":"bilateral"}]', '{"lumbar_rom","slr_test","kemp_test","mckenzie_assessment"}', 0.90),
('M54.5', 'Korsryggsmerte', 'L5', '[{"type":"palpation","severity_range":["moderate","severe"]},{"type":"rom","laterality":"bilateral"}]', '{"lumbar_rom","slr_test","kemp_test","mckenzie_assessment"}', 0.90),
('M54.5', 'Korsryggsmerte', 'S1', '[{"type":"palpation","severity_range":["moderate","severe"]}]', '{"lumbar_rom","slr_test","sacroiliac_tests"}', 0.80),

-- Rotator cuff syndrome (M75.1)
('M75.1', 'Rotator cuff-syndrom', 'left_shoulder', '[{"type":"palpation","severity_range":["moderate","severe"],"laterality":"left"},{"type":"rom","laterality":"left"}]', '{"neers_test","hawkins_kennedy","empty_can_test","drop_arm_test"}', 0.85),
('M75.1', 'Rotator cuff-syndrom', 'right_shoulder', '[{"type":"palpation","severity_range":["moderate","severe"],"laterality":"right"},{"type":"rom","laterality":"right"}]', '{"neers_test","hawkins_kennedy","empty_can_test","drop_arm_test"}', 0.85),

-- Panniculitis / trigger points (M79.3)
('M79.1', 'Myalgi', 'cervical_muscles', '[{"type":"trigger_point","severity_range":["moderate","severe"]}]', '{"palpation_trigger_points"}', 0.75),
('M79.1', 'Myalgi', 'thoracic_muscles', '[{"type":"trigger_point","severity_range":["moderate","severe"]}]', '{"palpation_trigger_points"}', 0.75),
('M79.1', 'Myalgi', 'lumbar_muscles', '[{"type":"trigger_point","severity_range":["moderate","severe"]}]', '{"palpation_trigger_points"}', 0.75),

-- Sacroiliac joint dysfunction (M53.3)
('M53.3', 'Sakroiliakal dysfunksjon', 'S1', '[{"type":"palpation","severity_range":["moderate","severe"]}]', '{"sacroiliac_tests","faber_test","gaenslen_test","thigh_thrust"}', 0.85),
('M53.3', 'Sakroiliakal dysfunksjon', 'left_hip', '[{"type":"palpation","laterality":"left"}]', '{"sacroiliac_tests","faber_test"}', 0.70),
('M53.3', 'Sakroiliakal dysfunksjon', 'right_hip', '[{"type":"palpation","laterality":"right"}]', '{"sacroiliac_tests","faber_test"}', 0.70)

ON CONFLICT DO NOTHING;
