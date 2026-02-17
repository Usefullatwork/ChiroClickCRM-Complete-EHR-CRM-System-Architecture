import _React, { useState } from 'react';

/**
 * Comprehensive Orthopedic and Neurological Testing Component
 * Provides structured clinical examination documentation
 */
const OrthopedicNeurologicalTests = ({ onUpdate, initialData = {} }) => {
  const [testResults, setTestResults] = useState(initialData);

  // Orthopedic Tests Database
  const orthoTests = {
    cervical: [
      { id: 'spurlings', name: "Spurling's Test", description: 'Cervical radiculopathy' },
      {
        id: 'distraction',
        name: 'Cervical Distraction',
        description: 'Nerve root compression relief',
      },
      { id: 'compression', name: 'Cervical Compression', description: 'Nerve root irritation' },
      { id: 'valsalva', name: 'Valsalva Test', description: 'Increased intrathecal pressure' },
      {
        id: 'shoulder_depression',
        name: 'Shoulder Depression Test',
        description: 'Brachial plexus tension',
      },
      { id: 'adson', name: "Adson's Test", description: 'Thoracic outlet syndrome' },
      {
        id: 'vertebral_artery',
        name: 'Vertebral Artery Test',
        description: 'Vertebrobasilar insufficiency',
      },
    ],
    lumbar: [
      {
        id: 'slr',
        name: 'Straight Leg Raise (SLR)',
        description: 'Sciatic nerve tension, disc herniation',
      },
      { id: 'braggard', name: "Braggard's Test", description: 'SLR with dorsiflexion' },
      {
        id: 'well_leg_raise',
        name: 'Well Leg Raise',
        description: 'Crossed SLR - large disc herniation',
      },
      { id: 'bowstring', name: 'Bowstring Test', description: 'Sciatic nerve tension' },
      { id: 'kemps', name: "Kemp's Test", description: 'Facet joint/foraminal stenosis' },
      { id: 'nachlas', name: 'Nachlas Test', description: 'Femoral nerve stretch' },
      { id: 'ely', name: "Ely's Test", description: 'Rectus femoris tightness' },
      { id: 'milgram', name: "Milgram's Test", description: 'Intrathecal/space-occupying lesion' },
      { id: 'valsalva_lumbar', name: 'Valsalva (Lumbar)', description: 'Disc herniation' },
      { id: 'minor_sign', name: "Minor's Sign", description: 'Lumbar disc involvement' },
    ],
    thoracic: [
      { id: 'adam_forward_bend', name: 'Adam Forward Bend', description: 'Scoliosis screening' },
      {
        id: 'rib_compression',
        name: 'Rib Compression',
        description: 'Rib fracture/costochondritis',
      },
      { id: 'chest_expansion', name: 'Chest Expansion', description: 'Ankylosing spondylitis' },
    ],
    shoulder: [
      { id: 'apley_scratch', name: 'Apley Scratch Test', description: 'Shoulder ROM' },
      { id: 'neer', name: "Neer's Impingement", description: 'Subacromial impingement' },
      { id: 'hawkins_kennedy', name: 'Hawkins-Kennedy', description: 'Subacromial impingement' },
      { id: 'empty_can', name: 'Empty Can (Jobe)', description: 'Supraspinatus tear' },
      { id: 'drop_arm', name: 'Drop Arm Test', description: 'Rotator cuff tear' },
      { id: 'speed', name: "Speed's Test", description: 'Biceps tendinopathy' },
      { id: 'yergason', name: "Yergason's Test", description: 'Biceps tendon instability' },
      {
        id: 'apprehension',
        name: 'Apprehension Test',
        description: 'Anterior shoulder instability',
      },
      { id: 'sulcus', name: 'Sulcus Sign', description: 'Inferior shoulder instability' },
      { id: 'cross_arm', name: 'Cross-Arm Adduction', description: 'AC joint pathology' },
    ],
    hip: [
      { id: 'faber', name: 'FABER (Patrick)', description: 'Hip/SI joint pathology' },
      { id: 'fadir', name: 'FADIR', description: 'Hip impingement' },
      { id: 'thomas', name: 'Thomas Test', description: 'Hip flexor contracture' },
      { id: 'ober', name: "Ober's Test", description: 'IT band tightness' },
      { id: 'trendelenburg', name: 'Trendelenburg Test', description: 'Hip abductor weakness' },
    ],
    knee: [
      { id: 'lachman', name: 'Lachman Test', description: 'ACL tear' },
      { id: 'anterior_drawer', name: 'Anterior Drawer', description: 'ACL tear' },
      { id: 'posterior_drawer', name: 'Posterior Drawer', description: 'PCL tear' },
      { id: 'mcmurray', name: "McMurray's Test", description: 'Meniscal tear' },
      { id: 'apley_compression', name: 'Apley Compression', description: 'Meniscal tear' },
      { id: 'valgus_stress', name: 'Valgus Stress', description: 'MCL tear' },
      { id: 'varus_stress', name: 'Varus Stress', description: 'LCL tear' },
      {
        id: 'patellar_apprehension',
        name: 'Patellar Apprehension',
        description: 'Patellar instability',
      },
    ],
    ankle: [
      { id: 'anterior_drawer_ankle', name: 'Anterior Drawer (Ankle)', description: 'ATFL tear' },
      { id: 'talar_tilt', name: 'Talar Tilt', description: 'CFL tear' },
      { id: 'thompson', name: 'Thompson Test', description: 'Achilles tendon rupture' },
      { id: 'squeeze', name: 'Squeeze Test', description: 'Syndesmosis injury' },
    ],
    special: [
      { id: 'si_compression', name: 'SI Compression', description: 'SI joint dysfunction' },
      { id: 'si_distraction', name: 'SI Distraction', description: 'SI joint dysfunction' },
      { id: 'gaenslen', name: "Gaenslen's Test", description: 'SI joint dysfunction' },
      { id: 'yeoman', name: "Yeoman's Test", description: 'SI joint dysfunction' },
    ],
  };

  // Neurological Tests Database
  const neuroTests = {
    reflexes: [
      { id: 'biceps_c5_c6', level: 'C5-C6', name: 'Biceps', location: 'Arm' },
      { id: 'brachioradialis_c6', level: 'C6', name: 'Brachioradialis', location: 'Forearm' },
      { id: 'triceps_c7', level: 'C7', name: 'Triceps', location: 'Arm' },
      { id: 'patellar_l4', level: 'L4', name: 'Patellar (Knee)', location: 'Knee' },
      { id: 'achilles_s1', level: 'S1', name: 'Achilles (Ankle)', location: 'Ankle' },
      { id: 'babinski', level: 'UMN', name: 'Babinski', location: 'Foot' },
      { id: 'hoffmann', level: 'UMN', name: "Hoffmann's Sign", location: 'Hand' },
    ],
    myotomes: [
      { id: 'c5_shoulder_abd', level: 'C5', muscle: 'Deltoid', action: 'Shoulder Abduction' },
      { id: 'c6_elbow_flex', level: 'C6', muscle: 'Biceps', action: 'Elbow Flexion' },
      { id: 'c6_wrist_ext', level: 'C6', muscle: 'Wrist Extensors', action: 'Wrist Extension' },
      { id: 'c7_elbow_ext', level: 'C7', muscle: 'Triceps', action: 'Elbow Extension' },
      { id: 'c7_wrist_flex', level: 'C7', muscle: 'Wrist Flexors', action: 'Wrist Flexion' },
      { id: 'c8_thumb_ext', level: 'C8', muscle: 'Thumb Extensors', action: 'Thumb Extension' },
      { id: 't1_finger_abd', level: 'T1', muscle: 'Interossei', action: 'Finger Abduction' },
      { id: 'l2_hip_flex', level: 'L2', muscle: 'Iliopsoas', action: 'Hip Flexion' },
      { id: 'l3_knee_ext', level: 'L3', muscle: 'Quadriceps', action: 'Knee Extension' },
      { id: 'l4_ankle_df', level: 'L4', muscle: 'Tibialis Anterior', action: 'Ankle Dorsiflexion' },
      { id: 'l5_toe_ext', level: 'L5', muscle: 'EHL', action: 'Great Toe Extension' },
      { id: 's1_ankle_pf', level: 'S1', muscle: 'Gastrocnemius', action: 'Ankle Plantarflexion' },
    ],
    dermatomes: [
      { id: 'c5_lateral_arm', level: 'C5', area: 'Lateral Arm (Badge Area)' },
      { id: 'c6_thumb', level: 'C6', area: 'Thumb & Radial Forearm' },
      { id: 'c7_middle_finger', level: 'C7', area: 'Middle Finger' },
      { id: 'c8_little_finger', level: 'C8', area: 'Little Finger & Ulnar Forearm' },
      { id: 't1_medial_arm', level: 'T1', area: 'Medial Arm' },
      { id: 'l1_groin', level: 'L1', area: 'Groin' },
      { id: 'l2_anterior_thigh', level: 'L2', area: 'Anterior Thigh' },
      { id: 'l3_medial_knee', level: 'L3', area: 'Medial Knee' },
      { id: 'l4_medial_ankle', level: 'L4', area: 'Medial Ankle' },
      { id: 'l5_dorsal_foot', level: 'L5', area: 'Dorsal Foot (1st web space)' },
      { id: 's1_lateral_foot', level: 'S1', area: 'Lateral Foot' },
      { id: 's2_posterior_thigh', level: 'S2', area: 'Posterior Thigh' },
    ],
    coordination: [
      { id: 'finger_to_nose', name: 'Finger to Nose', cerebellar: true },
      { id: 'heel_to_shin', name: 'Heel to Shin', cerebellar: true },
      { id: 'rapid_alternating', name: 'Rapid Alternating Movements', cerebellar: true },
      { id: 'romberg', name: 'Romberg Test', proprioception: true },
      { id: 'tandem_gait', name: 'Tandem Gait', cerebellar: true },
    ],
  };

  // Test result options
  const testResultOptions = [
    { value: 'negative', label: 'Negative (Normal)', color: 'green' },
    { value: 'positive', label: 'Positive (Abnormal)', color: 'red' },
    { value: 'equivocal', label: 'Equivocal', color: 'yellow' },
    { value: 'not_tested', label: 'Not Tested', color: 'gray' },
  ];

  const reflexGrades = [
    { value: '0', label: '0 - Absent' },
    { value: '1+', label: '1+ - Diminished' },
    { value: '2+', label: '2+ - Normal' },
    { value: '3+', label: '3+ - Brisk' },
    { value: '4+', label: '4+ - Very Brisk (Clonus)' },
  ];

  const strengthGrades = [
    { value: '0/5', label: '0/5 - No Contraction' },
    { value: '1/5', label: '1/5 - Trace' },
    { value: '2/5', label: '2/5 - Gravity Eliminated' },
    { value: '3/5', label: '3/5 - Against Gravity' },
    { value: '4/5', label: '4/5 - Against Resistance (Weak)' },
    { value: '5/5', label: '5/5 - Normal Strength' },
  ];

  const sensationOptions = [
    { value: 'normal', label: 'Normal (Intact)' },
    { value: 'decreased', label: 'Decreased (Hypoesthesia)' },
    { value: 'increased', label: 'Increased (Hyperesthesia)' },
    { value: 'absent', label: 'Absent (Anesthesia)' },
    { value: 'paresthesia', label: 'Paresthesia (Tingling)' },
  ];

  const handleTestChange = (category, testId, field, value) => {
    const updated = {
      ...testResults,
      [category]: {
        ...testResults[category],
        [testId]: {
          ...testResults[category]?.[testId],
          [field]: value,
        },
      },
    };
    setTestResults(updated);
    onUpdate?.(updated);
  };

  const renderOrthoTestSection = (region, tests) => (
    <div key={region} className="test-section">
      <h3 className="test-section-title">{region.charAt(0).toUpperCase() + region.slice(1)}</h3>
      <div className="test-grid">
        {tests.map((test) => (
          <div key={test.id} className="test-item">
            <div className="test-header">
              <strong>{test.name}</strong>
              <span className="test-description">{test.description}</span>
            </div>
            <div className="test-controls">
              <select
                value={testResults[region]?.[test.id]?.result || 'not_tested'}
                onChange={(e) => handleTestChange(region, test.id, 'result', e.target.value)}
                className={`test-select result-${testResults[region]?.[test.id]?.result || 'not_tested'}`}
              >
                {testResultOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Notes (e.g., pain at 45°, reproduction of symptoms)"
                value={testResults[region]?.[test.id]?.notes || ''}
                onChange={(e) => handleTestChange(region, test.id, 'notes', e.target.value)}
                className="test-notes"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderNeuroSection = (type, tests) => {
    if (type === 'reflexes') {
      return (
        <div key={type} className="test-section">
          <h3 className="test-section-title">Deep Tendon Reflexes</h3>
          <div className="neuro-grid">
            {tests.map((test) => (
              <div key={test.id} className="neuro-item">
                <div className="neuro-label">
                  <strong>{test.name}</strong>
                  <span className="neuro-level">{test.level}</span>
                </div>
                <div className="neuro-bilateral">
                  <div className="side-input">
                    <label>Left</label>
                    <select
                      value={testResults.reflexes?.[test.id]?.left || '2+'}
                      onChange={(e) =>
                        handleTestChange('reflexes', test.id, 'left', e.target.value)
                      }
                      className="reflex-select"
                    >
                      {reflexGrades.map((grade) => (
                        <option key={grade.value} value={grade.value}>
                          {grade.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="side-input">
                    <label>Right</label>
                    <select
                      value={testResults.reflexes?.[test.id]?.right || '2+'}
                      onChange={(e) =>
                        handleTestChange('reflexes', test.id, 'right', e.target.value)
                      }
                      className="reflex-select"
                    >
                      {reflexGrades.map((grade) => (
                        <option key={grade.value} value={grade.value}>
                          {grade.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (type === 'myotomes') {
      return (
        <div key={type} className="test-section">
          <h3 className="test-section-title">Myotomes (Motor Strength)</h3>
          <div className="neuro-grid">
            {tests.map((test) => (
              <div key={test.id} className="neuro-item">
                <div className="neuro-label">
                  <strong>
                    {test.level}: {test.action}
                  </strong>
                  <span className="neuro-muscle">{test.muscle}</span>
                </div>
                <div className="neuro-bilateral">
                  <div className="side-input">
                    <label>Left</label>
                    <select
                      value={testResults.myotomes?.[test.id]?.left || '5/5'}
                      onChange={(e) =>
                        handleTestChange('myotomes', test.id, 'left', e.target.value)
                      }
                      className="strength-select"
                    >
                      {strengthGrades.map((grade) => (
                        <option key={grade.value} value={grade.value}>
                          {grade.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="side-input">
                    <label>Right</label>
                    <select
                      value={testResults.myotomes?.[test.id]?.right || '5/5'}
                      onChange={(e) =>
                        handleTestChange('myotomes', test.id, 'right', e.target.value)
                      }
                      className="strength-select"
                    >
                      {strengthGrades.map((grade) => (
                        <option key={grade.value} value={grade.value}>
                          {grade.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (type === 'dermatomes') {
      return (
        <div key={type} className="test-section">
          <h3 className="test-section-title">Dermatomes (Sensation)</h3>
          <div className="neuro-grid">
            {tests.map((test) => (
              <div key={test.id} className="neuro-item">
                <div className="neuro-label">
                  <strong>
                    {test.level}: {test.area}
                  </strong>
                </div>
                <div className="neuro-bilateral">
                  <div className="side-input">
                    <label>Left</label>
                    <select
                      value={testResults.dermatomes?.[test.id]?.left || 'normal'}
                      onChange={(e) =>
                        handleTestChange('dermatomes', test.id, 'left', e.target.value)
                      }
                      className="sensation-select"
                    >
                      {sensationOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="side-input">
                    <label>Right</label>
                    <select
                      value={testResults.dermatomes?.[test.id]?.right || 'normal'}
                      onChange={(e) =>
                        handleTestChange('dermatomes', test.id, 'right', e.target.value)
                      }
                      className="sensation-select"
                    >
                      {sensationOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (type === 'coordination') {
      return (
        <div key={type} className="test-section">
          <h3 className="test-section-title">Coordination & Balance</h3>
          <div className="test-grid">
            {tests.map((test) => (
              <div key={test.id} className="test-item">
                <div className="test-header">
                  <strong>{test.name}</strong>
                  <span className="test-description">
                    {test.cerebellar && '(Cerebellar)'} {test.proprioception && '(Proprioception)'}
                  </span>
                </div>
                <div className="test-controls">
                  <select
                    value={testResults.coordination?.[test.id]?.result || 'not_tested'}
                    onChange={(e) =>
                      handleTestChange('coordination', test.id, 'result', e.target.value)
                    }
                    className={`test-select result-${testResults.coordination?.[test.id]?.result || 'not_tested'}`}
                  >
                    {testResultOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Notes"
                    value={testResults.coordination?.[test.id]?.notes || ''}
                    onChange={(e) =>
                      handleTestChange('coordination', test.id, 'notes', e.target.value)
                    }
                    className="test-notes"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
  };

  return (
    <div className="ortho-neuro-tests">
      <style>
        {`
          .ortho-neuro-tests {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 20px;
            background: white;
            border-radius: 8px;
          }

          .test-section {
            margin-bottom: 30px;
            border: 1px solid #e0e0e0;
            border-radius: 6px;
            padding: 20px;
            background: #fafafa;
          }

          .test-section-title {
            margin: 0 0 15px 0;
            padding-bottom: 10px;
            border-bottom: 2px solid #2196F3;
            color: #1976D2;
            font-size: 18px;
            font-weight: 600;
          }

          .test-grid {
            display: grid;
            gap: 12px;
          }

          .test-item {
            background: white;
            border: 1px solid #e0e0e0;
            border-radius: 4px;
            padding: 12px;
          }

          .test-header {
            margin-bottom: 8px;
          }

          .test-header strong {
            display: block;
            color: #333;
            font-size: 14px;
          }

          .test-description {
            display: block;
            color: #666;
            font-size: 12px;
            font-style: italic;
            margin-top: 2px;
          }

          .test-controls {
            display: flex;
            gap: 10px;
            align-items: center;
          }

          .test-select {
            padding: 6px 10px;
            border: 2px solid #ddd;
            border-radius: 4px;
            font-size: 13px;
            font-weight: 500;
            min-width: 180px;
            transition: all 0.2s;
          }

          .test-select.result-negative {
            border-color: #4CAF50;
            background: #E8F5E9;
            color: #2E7D32;
          }

          .test-select.result-positive {
            border-color: #F44336;
            background: #FFEBEE;
            color: #C62828;
          }

          .test-select.result-equivocal {
            border-color: #FF9800;
            background: #FFF3E0;
            color: #E65100;
          }

          .test-select.result-not_tested {
            border-color: #9E9E9E;
            background: #F5F5F5;
            color: #616161;
          }

          .test-notes {
            flex: 1;
            padding: 6px 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 13px;
          }

          .neuro-grid {
            display: grid;
            gap: 10px;
          }

          .neuro-item {
            background: white;
            border: 1px solid #e0e0e0;
            border-radius: 4px;
            padding: 10px;
          }

          .neuro-label {
            margin-bottom: 8px;
          }

          .neuro-label strong {
            display: block;
            color: #333;
            font-size: 13px;
          }

          .neuro-level,
          .neuro-muscle {
            display: block;
            color: #666;
            font-size: 12px;
            margin-top: 2px;
          }

          .neuro-bilateral {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }

          .side-input label {
            display: block;
            font-size: 11px;
            color: #666;
            margin-bottom: 4px;
            font-weight: 600;
            text-transform: uppercase;
          }

          .reflex-select,
          .strength-select,
          .sensation-select {
            width: 100%;
            padding: 5px 8px;
            border: 1px solid #ddd;
            border-radius: 3px;
            font-size: 12px;
          }

          .tabs {
            display: flex;
            border-bottom: 2px solid #e0e0e0;
            margin-bottom: 20px;
          }

          .tab {
            padding: 12px 24px;
            background: none;
            border: none;
            border-bottom: 3px solid transparent;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            color: #666;
            transition: all 0.2s;
          }

          .tab:hover {
            color: #2196F3;
            background: #f5f5f5;
          }

          .tab.active {
            color: #2196F3;
            border-bottom-color: #2196F3;
          }
        `}
      </style>

      <h2 style={{ marginTop: 0, color: '#1976D2' }}>Clinical Examination Tests</h2>

      <div className="tabs">
        <button className="tab active">Orthopedic Tests</button>
        <button className="tab">Neurological Exam</button>
      </div>

      <div className="ortho-tests-container">
        <h2 style={{ color: '#1976D2', marginBottom: '20px' }}>Orthopedic Special Tests</h2>
        {Object.entries(orthoTests).map(([region, tests]) => renderOrthoTestSection(region, tests))}
      </div>

      <div className="neuro-tests-container" style={{ marginTop: '40px' }}>
        <h2 style={{ color: '#1976D2', marginBottom: '20px' }}>Neurological Examination</h2>
        {Object.entries(neuroTests).map(([type, tests]) => renderNeuroSection(type, tests))}
      </div>
    </div>
  );
};

export default OrthopedicNeurologicalTests;
