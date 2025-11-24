import React, { useState } from 'react';

/**
 * Functional Movement Assessment Component
 * Comprehensive functional movement screening and scoring
 * Based on FMS and other validated functional assessment tools
 */
const FunctionalMovementAssessment = ({ onSave }) => {
  const [scores, setScores] = useState({});
  const [notes, setNotes] = useState({});
  const [totalScore, setTotalScore] = useState(0);

  // Functional Movement Screen (FMS) Tests
  const fmsTests = [
    {
      id: 'deep_squat',
      name: 'Deep Squat',
      description: 'Bilateral, symmetrical, functional mobility of hips, knees, and ankles',
      scoring: [
        { value: 3, label: '3 - Upper torso parallel with tibia, femur below horizontal, knees over feet, dowel aligned over feet' },
        { value: 2, label: '2 - Same as above with 2x6 board under heels' },
        { value: 1, label: '1 - Tibia and torso not parallel OR femur not below horizontal' },
        { value: 0, label: '0 - Pain during movement' }
      ],
      keyPoints: [
        'Heels must stay on floor',
        'Knees should track over toes',
        'Dowel should stay overhead',
        'Assess compensations'
      ]
    },
    {
      id: 'hurdle_step',
      name: 'Hurdle Step',
      description: 'Step and stride mechanics with stability and control',
      scoring: [
        { value: 3, label: '3 - Hips, knees, ankles aligned in sagittal plane, minimal torso movement, dowel stays level' },
        { value: 2, label: '2 - Alignment maintained with dowel/balance loss OR stepping foot contact' },
        { value: 1, label: '1 - Alignment not maintained OR loss of balance' },
        { value: 0, label: '0 - Pain during movement' }
      ],
      bilateral: true,
      keyPoints: [
        'Test both sides',
        'Score is lowest of two sides',
        'Watch for knee valgus',
        'Maintain upright posture'
      ]
    },
    {
      id: 'inline_lunge',
      name: 'In-Line Lunge',
      description: 'Rotary stability, deceleration, and lateral/medial stability',
      scoring: [
        { value: 3, label: '3 - Knee touches board behind heel, torso vertical, dowel remains vertical' },
        { value: 2, label: '2 - Alignment not maintained OR dowel not vertical OR loss of balance' },
        { value: 1, label: '1 - Unable to touch knee to board OR loss of balance' },
        { value: 0, label: '0 - Pain during movement' }
      ],
      bilateral: true,
      keyPoints: [
        'Test both sides',
        'Score is lowest of two sides',
        'Maintain vertical torso',
        'Watch for rotation'
      ]
    },
    {
      id: 'shoulder_mobility',
      name: 'Shoulder Mobility',
      description: 'Bilateral shoulder ROM - extension, internal/external rotation, adduction',
      scoring: [
        { value: 3, label: '3 - Fists within one hand length' },
        { value: 2, label: '2 - Fists within one and a half hand lengths' },
        { value: 1, label: '1 - Fists more than one and a half hand lengths apart' },
        { value: 0, label: '0 - Pain during movement' }
      ],
      bilateral: true,
      clearingTest: 'Shoulder Clearing Test (hand to opposite shoulder blade)',
      keyPoints: [
        'Test both sides',
        'Score is lowest of two sides',
        'Measure fist-to-fist distance',
        'Perform clearing test'
      ]
    },
    {
      id: 'active_slr',
      name: 'Active Straight Leg Raise',
      description: 'Functional hamstring and calf flexibility with pelvic stability',
      scoring: [
        { value: 3, label: '3 - Malleolus passes vertical line at mid-patella' },
        { value: 2, label: '2 - Malleolus passes vertical line between mid-patella and ASIS' },
        { value: 1, label: '1 - Malleolus does not reach mid-patella line' },
        { value: 0, label: '0 - Pain during movement' }
      ],
      bilateral: true,
      keyPoints: [
        'Test both sides',
        'Score is lowest of two sides',
        'Maintain opposite leg flat',
        'Keep knee extended'
      ]
    },
    {
      id: 'trunk_stability_pushup',
      name: 'Trunk Stability Push-Up',
      description: 'Trunk stability in sagittal plane during closed-chain upper extremity movement',
      scoring: [
        { value: 3, label: '3 - (M: thumbs at forehead, F: thumbs at clavicle) 1 rep, body lifts as unit' },
        { value: 2, label: '2 - (M: thumbs at chin, F: thumbs at forehead) 1 rep, body lifts as unit' },
        { value: 1, label: '1 - Unable to perform 1 rep with proper form' },
        { value: 0, label: '0 - Pain during movement' }
      ],
      keyPoints: [
        'Males: hands at forehead (score 3) or chin (score 2)',
        'Females: hands at clavicle (score 3) or forehead (score 2)',
        'Body must lift as one unit',
        'No hip hinging'
      ]
    },
    {
      id: 'rotary_stability',
      name: 'Rotary Stability',
      description: 'Multi-planar trunk stability during combined upper/lower extremity movement',
      scoring: [
        { value: 3, label: '3 - Diagonal pattern: one rep, unison movement, board contact maintained' },
        { value: 2, label: '2 - Ipsilateral pattern: one rep, unison movement' },
        { value: 1, label: '1 - Unable to perform ipsilateral pattern' },
        { value: 0, label: '0 - Pain during movement' }
      ],
      bilateral: true,
      clearingTest: 'Spinal Extension Clearing Test',
      keyPoints: [
        'Test both sides',
        'Score is lowest of two sides',
        'Attempt diagonal first',
        'Perform clearing test'
      ]
    }
  ];

  // Additional Functional Assessments
  const additionalTests = {
    posture: {
      name: 'Postural Assessment',
      items: [
        { id: 'forward_head', label: 'Forward Head Posture', options: ['Normal', 'Mild', 'Moderate', 'Severe'] },
        { id: 'shoulder_protraction', label: 'Shoulder Protraction', options: ['Normal', 'Mild', 'Moderate', 'Severe'] },
        { id: 'thoracic_kyphosis', label: 'Increased Thoracic Kyphosis', options: ['Normal', 'Mild', 'Moderate', 'Severe'] },
        { id: 'lumbar_lordosis', label: 'Lumbar Lordosis', options: ['Normal', 'Decreased', 'Increased'] },
        { id: 'pelvic_tilt', label: 'Pelvic Tilt', options: ['Neutral', 'Anterior', 'Posterior'] },
        { id: 'scoliosis', label: 'Scoliosis', options: ['None', 'Mild', 'Moderate', 'Severe'] }
      ]
    },
    gait: {
      name: 'Gait Analysis',
      items: [
        { id: 'heel_strike', label: 'Heel Strike', options: ['Normal', 'Absent', 'Heavy'] },
        { id: 'stance_phase', label: 'Stance Phase Stability', options: ['Normal', 'Unstable'] },
        { id: 'push_off', label: 'Push Off', options: ['Normal', 'Weak', 'Absent'] },
        { id: 'arm_swing', label: 'Arm Swing', options: ['Normal', 'Reduced', 'Asymmetric'] },
        { id: 'step_length', label: 'Step Length', options: ['Normal', 'Short', 'Asymmetric'] },
        { id: 'trendelenburg', label: 'Trendelenburg Sign', options: ['Negative', 'Positive Left', 'Positive Right', 'Bilateral'] }
      ]
    },
    balance: {
      name: 'Balance Assessment',
      items: [
        { id: 'single_leg_stance', label: 'Single Leg Stance (seconds)', type: 'number', bilateral: true },
        { id: 'tandem_stance', label: 'Tandem Stance (seconds)', type: 'number' },
        { id: 'star_excursion', label: 'Star Excursion Reach', type: 'number', bilateral: true }
      ]
    }
  };

  const handleScoreChange = (testId, value) => {
    const newScores = { ...scores, [testId]: parseInt(value) };
    setScores(newScores);
    calculateTotalScore(newScores);
  };

  const handleNoteChange = (testId, note) => {
    setNotes({ ...notes, [testId]: note });
  };

  const calculateTotalScore = (currentScores) => {
    const fmsScore = fmsTests.reduce((total, test) => {
      return total + (currentScores[test.id] || 0);
    }, 0);
    setTotalScore(fmsScore);

    // Save all data
    if (onSave) {
      onSave({
        fmsScore: fmsScore,
        scores: currentScores,
        notes: notes,
        date: new Date().toISOString(),
        interpretation: getInterpretation(fmsScore)
      });
    }
  };

  const getInterpretation = (score) => {
    if (score >= 21) {
      return 'Excellent functional movement patterns. Low injury risk.';
    } else if (score >= 18) {
      return 'Good functional movement. Minor asymmetries may be present.';
    } else if (score >= 15) {
      return 'Moderate dysfunction. Address movement limitations to reduce injury risk.';
    } else if (score >= 14) {
      return 'Significant movement dysfunction. High injury risk. Corrective exercise program recommended.';
    } else {
      return 'Severe movement limitations. Comprehensive corrective program required.';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 21) return '#4CAF50';
    if (score >= 18) return '#8BC34A';
    if (score >= 15) return '#FF9800';
    if (score >= 14) return '#FF5722';
    return '#F44336';
  };

  return (
    <div className="functional-assessment">
      <style>
        {`
          .functional-assessment {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 1000px;
            margin: 0 auto;
            padding: 20px;
            background: white;
            border-radius: 8px;
          }

          .score-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 8px;
            text-align: center;
            margin-bottom: 30px;
          }

          .total-score {
            font-size: 60px;
            font-weight: 700;
            margin: 10px 0;
          }

          .max-score {
            font-size: 20px;
            opacity: 0.9;
          }

          .interpretation {
            margin-top: 15px;
            padding: 15px;
            background: rgba(255,255,255,0.2);
            border-radius: 6px;
            font-size: 16px;
          }

          .test-section {
            margin-bottom: 30px;
          }

          .section-title {
            color: #1976D2;
            font-size: 24px;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e0e0e0;
          }

          .test-card {
            background: #FAFAFA;
            border: 1px solid #e0e0e0;
            border-radius: 6px;
            padding: 20px;
            margin-bottom: 20px;
          }

          .test-header {
            margin-bottom: 15px;
          }

          .test-name {
            font-size: 18px;
            font-weight: 600;
            color: #333;
            margin-bottom: 5px;
          }

          .test-description {
            color: #666;
            font-size: 14px;
            font-style: italic;
          }

          .bilateral-badge {
            background: #E3F2FD;
            color: #1976D2;
            padding: 4px 10px;
            border-radius: 3px;
            font-size: 12px;
            font-weight: 600;
            margin-left: 10px;
          }

          .scoring-options {
            margin: 15px 0;
          }

          .score-option {
            display: flex;
            align-items: flex-start;
            padding: 12px;
            margin-bottom: 8px;
            border-radius: 4px;
            border: 2px solid transparent;
            cursor: pointer;
            transition: all 0.2s;
          }

          .score-option:hover {
            background: #E3F2FD;
            border-color: #2196F3;
          }

          .score-option input[type="radio"] {
            margin-right: 12px;
            margin-top: 3px;
            cursor: pointer;
          }

          .score-option.selected {
            background: #E3F2FD;
            border-color: #2196F3;
          }

          .score-label {
            flex: 1;
            color: #333;
            font-size: 14px;
            line-height: 1.5;
          }

          .key-points {
            background: #FFF9C4;
            border-left: 4px solid #FDD835;
            padding: 12px;
            margin-top: 15px;
            border-radius: 4px;
          }

          .key-points-title {
            font-weight: 600;
            color: #F57F17;
            margin-bottom: 8px;
            font-size: 13px;
          }

          .key-points ul {
            margin: 0;
            padding-left: 20px;
          }

          .key-points li {
            color: #555;
            font-size: 13px;
            margin-bottom: 4px;
          }

          .test-notes {
            margin-top: 15px;
          }

          .test-notes textarea {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
            font-family: inherit;
            resize: vertical;
            min-height: 60px;
          }

          .clearing-test {
            background: #FFEBEE;
            border-left: 4px solid #F44336;
            padding: 10px;
            margin-top: 10px;
            border-radius: 4px;
            font-size: 13px;
            color: #C62828;
            font-weight: 600;
          }

          .current-score-badge {
            display: inline-block;
            background: white;
            color: #1976D2;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            margin-top: 10px;
          }

          .additional-assessments {
            margin-top: 40px;
          }

          .additional-test-grid {
            display: grid;
            gap: 15px;
          }

          .additional-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px;
            background: #FAFAFA;
            border: 1px solid #e0e0e0;
            border-radius: 4px;
          }

          .additional-item label {
            flex: 1;
            color: #333;
            font-size: 14px;
            font-weight: 500;
          }

          .additional-item select,
          .additional-item input {
            padding: 6px 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
            min-width: 150px;
          }

          .interpretation-box {
            background: #E8F5E9;
            border-left: 4px solid #4CAF50;
            padding: 20px;
            margin-top: 20px;
            border-radius: 4px;
          }

          .interpretation-title {
            color: #2E7D32;
            font-weight: 600;
            margin-bottom: 10px;
            font-size: 16px;
          }
        `}
      </style>

      <h1 style={{ marginTop: 0, color: '#1976D2' }}>Functional Movement Assessment</h1>

      {totalScore > 0 && (
        <div className="score-header" style={{ background: `linear-gradient(135deg, ${getScoreColor(totalScore)} 0%, ${getScoreColor(totalScore)}dd 100%)` }}>
          <div className="max-score">Functional Movement Screen Score</div>
          <div className="total-score">{totalScore}/21</div>
          <div className="interpretation">{getInterpretation(totalScore)}</div>
        </div>
      )}

      <div className="test-section">
        <h2 className="section-title">Functional Movement Screen (FMS)</h2>

        {fmsTests.map(test => (
          <div key={test.id} className="test-card">
            <div className="test-header">
              <div className="test-name">
                {test.name}
                {test.bilateral && <span className="bilateral-badge">BILATERAL - Score Lowest Side</span>}
                {scores[test.id] > 0 && (
                  <span className="current-score-badge">Score: {scores[test.id]}/3</span>
                )}
              </div>
              <div className="test-description">{test.description}</div>
            </div>

            <div className="scoring-options">
              {test.scoring.map(option => (
                <label
                  key={option.value}
                  className={`score-option ${scores[test.id] === option.value ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name={test.id}
                    value={option.value}
                    checked={scores[test.id] === option.value}
                    onChange={(e) => handleScoreChange(test.id, e.target.value)}
                  />
                  <span className="score-label">{option.label}</span>
                </label>
              ))}
            </div>

            {test.clearingTest && (
              <div className="clearing-test">
                ⚠️ Clearing Test: {test.clearingTest} - If positive (painful), score movement as 0
              </div>
            )}

            {test.keyPoints && (
              <div className="key-points">
                <div className="key-points-title">💡 Key Assessment Points:</div>
                <ul>
                  {test.keyPoints.map((point, idx) => (
                    <li key={idx}>{point}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="test-notes">
              <textarea
                placeholder="Clinical notes and observations..."
                value={notes[test.id] || ''}
                onChange={(e) => handleNoteChange(test.id, e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="additional-assessments">
        {Object.entries(additionalTests).map(([category, data]) => (
          <div key={category} className="test-section">
            <h2 className="section-title">{data.name}</h2>
            <div className="additional-test-grid">
              {data.items.map(item => (
                <div key={item.id} className="additional-item">
                  <label>{item.label}</label>
                  {item.options ? (
                    <select
                      value={scores[item.id] || ''}
                      onChange={(e) => handleScoreChange(item.id, e.target.value)}
                    >
                      <option value="">Select...</option>
                      {item.options.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={item.type || 'text'}
                      value={scores[item.id] || ''}
                      onChange={(e) => handleScoreChange(item.id, e.target.value)}
                      placeholder={item.bilateral ? 'L: ___ R: ___' : ''}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FunctionalMovementAssessment;
