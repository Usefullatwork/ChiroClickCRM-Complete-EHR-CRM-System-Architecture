import { useState } from 'react';

/**
 * Clinical Protocols and Care Plans Component
 * Evidence-based treatment protocols for common chiropractic conditions
 */
const ClinicalProtocols = ({ onSelectProtocol }) => {
  const [selectedCondition, setSelectedCondition] = useState(null);
  const [_customizations, _setCustomizations] = useState({});

  // Evidence-based clinical protocols
  const protocols = {
    acute_lbp: {
      id: 'acute_lbp',
      name: 'Acute Low Back Pain (< 6 weeks)',
      icd10: 'M54.5',
      icpc2: 'L03',
      description: 'Non-specific acute low back pain without radiculopathy',
      redFlags: [
        'Cauda equina syndrome (bowel/bladder dysfunction, saddle anesthesia)',
        'Fracture (trauma, osteoporosis, steroid use)',
        'Cancer (age >50, history of cancer, unexplained weight loss)',
        'Infection (fever, IV drug use, immunosuppression)',
        'Severe/progressive neurological deficit',
      ],
      assessment: {
        history: [
          'Onset and mechanism of injury',
          'Pain location, quality, radiation',
          'Aggravating and relieving factors',
          'Previous episodes and treatment response',
          'Occupational and lifestyle factors',
          'Screen for red flags',
        ],
        examination: [
          'Observation: posture, gait, listing',
          'Lumbar ROM (flexion, extension, lateral flexion, rotation)',
          'Palpation: tenderness, muscle spasm, trigger points',
          "Orthopedic tests: SLR, Kemp's, Milgram",
          'Neurological screening: L4, L5, S1 myotomes/dermatomes/reflexes',
          'SI joint provocation tests',
        ],
        imaging: [
          'NOT indicated in first 6 weeks unless red flags present',
          'X-ray if trauma, age >50, or suspicion of fracture',
          'MRI only if considering surgery or progressive neurological deficit',
        ],
      },
      treatment: {
        phase1: {
          name: 'Acute Phase (Week 1-2)',
          frequency: '2-3 visits per week',
          duration: '1-2 weeks',
          goals: ['Reduce pain and muscle spasm', 'Restore basic function', 'Prevent chronicity'],
          interventions: [
            'Spinal manipulation (HVLA) to restricted segments',
            'Soft tissue therapy: trigger point release, myofascial release',
            'Ice application (first 48-72 hours)',
            'Activity modification: avoid prolonged sitting, heavy lifting',
            'Gentle ROM exercises within pain tolerance',
            'Educate on proper body mechanics and ergonomics',
            'Reassurance and positive prognosis',
          ],
        },
        phase2: {
          name: 'Subacute Phase (Week 3-6)',
          frequency: '1-2 visits per week',
          duration: '3-4 weeks',
          goals: [
            'Continue pain reduction',
            'Restore full ROM',
            'Begin strengthening',
            'Return to normal activities',
          ],
          interventions: [
            'Continue spinal manipulation as needed',
            'Progress to heat therapy for muscle relaxation',
            'Active ROM exercises',
            'Core stabilization exercises (bird dog, dead bug, plank modifications)',
            'Hip and hamstring stretching',
            'Gradual return to work/activities',
            'Posture and ergonomic corrections',
          ],
        },
        phase3: {
          name: 'Rehabilitation Phase (Week 6+)',
          frequency: 'As needed',
          duration: 'Ongoing',
          goals: ['Prevent recurrence', 'Optimize function', 'Self-management'],
          interventions: [
            'Maintenance adjustments (monthly or as needed)',
            'Advanced core strengthening',
            'Functional movement training',
            'Weight management if applicable',
            'Regular exercise program',
            'Lifestyle modifications',
          ],
        },
      },
      homeExercises: [
        {
          name: 'Pelvic Tilts',
          sets: '2',
          reps: '10',
          frequency: 'Daily',
          description:
            'Lie on back with knees bent. Flatten low back to floor by tilting pelvis. Hold 5 seconds.',
        },
        {
          name: 'Cat-Cow Stretch',
          sets: '2',
          reps: '10',
          frequency: 'Daily',
          description:
            'On hands and knees, alternate between arching and rounding spine. Move slowly and gently.',
        },
        {
          name: 'Knee to Chest Stretch',
          sets: '2',
          reps: '5 each side',
          frequency: 'Daily',
          description:
            'Lie on back, pull one knee to chest. Hold 20-30 seconds. Keep other leg bent or straight.',
        },
        {
          name: 'Bird Dog',
          sets: '2',
          reps: '10 each side',
          frequency: 'Daily',
          description:
            'On hands and knees, extend opposite arm and leg. Hold 5 seconds. Keep core engaged.',
        },
      ],
      expectedOutcomes: {
        week2: '50-70% improvement in pain and function',
        week6: '80-90% recovery for most patients',
        week12: 'Full recovery expected for uncomplicated cases',
      },
      referralCriteria: [
        'No improvement after 4-6 weeks of conservative care',
        'Progressive neurological deficit',
        'Red flags develop',
        'Patient preference for additional consultation',
      ],
    },

    cervicogenic_headache: {
      id: 'cervicogenic_headache',
      name: 'Cervicogenic Headache',
      icd10: 'G44.841',
      icpc2: 'N01',
      description: 'Headache originating from cervical spine dysfunction',
      redFlags: [
        'Sudden onset "thunderclap" headache',
        'Headache with fever, stiff neck, altered mental status',
        'New headache in patient >50 years',
        'Progressive headache worsening over weeks/months',
        'Headache with neurological symptoms (vision changes, weakness)',
        'Headache triggered by cough, sneeze, or exertion',
      ],
      assessment: {
        history: [
          'Headache location (typically unilateral, neck to occiput to frontal)',
          'Frequency and duration of headaches',
          'Aggravating factors (neck movements, sustained postures)',
          'Associated symptoms (neck pain, shoulder pain, dizziness)',
          'Previous headache history and triggers',
          'Screen for migraines, tension-type headaches, cluster headaches',
        ],
        examination: [
          'Cervical ROM (typically reduced in rotation/extension)',
          'Palpation: upper cervical segments (C0-C2), suboccipital muscles',
          'Muscle examination: upper trapezius, levator scapulae, SCM',
          'Cervical segmental motion palpation',
          "Spurling's test (usually negative)",
          'Vertebral artery test (essential before upper cervical manipulation)',
          'Neurological screening',
        ],
        imaging: [
          'Not typically required',
          'X-ray if trauma or chronic headache',
          'MRI if red flags present or neurological symptoms',
        ],
      },
      treatment: {
        phase1: {
          name: 'Initial Phase (Week 1-4)',
          frequency: '2 visits per week',
          duration: '4 weeks',
          goals: [
            'Reduce headache frequency and intensity',
            'Improve cervical ROM',
            'Reduce muscle tension',
          ],
          interventions: [
            'Upper cervical spinal manipulation (C0-C2)',
            'Mid-cervical mobilization (C3-C6)',
            'Soft tissue therapy: suboccipital release, upper trap/levator release',
            'Postural correction (forward head posture)',
            'Trigger point therapy for referred pain patterns',
            'Ice to base of skull for acute headaches',
            'Ergonomic assessment of workstation',
          ],
        },
        phase2: {
          name: 'Progressive Phase (Week 5-12)',
          frequency: '1 visit per week',
          duration: '8 weeks',
          goals: [
            'Maintain headache reduction',
            'Improve neck strength and endurance',
            'Correct postural dysfunction',
          ],
          interventions: [
            'Maintenance adjustments',
            'Deep neck flexor strengthening',
            'Scapular stabilization exercises',
            'Cervical and thoracic mobility exercises',
            'Continued postural training',
            'Stress management techniques',
          ],
        },
      },
      homeExercises: [
        {
          name: 'Chin Tucks (Deep Neck Flexor Activation)',
          sets: '3',
          reps: '10',
          frequency: '2x daily',
          description:
            'Gently tuck chin straight back, creating double chin. Hold 5 seconds. Do NOT tilt head down.',
        },
        {
          name: 'Suboccipital Release (Self-massage)',
          sets: '1',
          reps: '2-3 minutes',
          frequency: 'As needed',
          description:
            'Lie on back with tennis balls at base of skull. Relax and allow gentle pressure. Turn head side to side.',
        },
        {
          name: 'Upper Trap Stretch',
          sets: '2',
          reps: '3 each side',
          frequency: '2x daily',
          description:
            'Sit tall, tilt ear toward shoulder, gently pull head with hand. Hold 30 seconds. Avoid lifting shoulder.',
        },
        {
          name: 'Cervical Rotation Stretch',
          sets: '2',
          reps: '5 each side',
          frequency: 'Daily',
          description:
            'Turn head to look over shoulder. Gently pull chin toward armpit with hand. Hold 15 seconds.',
        },
      ],
      expectedOutcomes: {
        week4: '40-60% reduction in headache frequency/intensity',
        week12: '70-80% improvement for most patients',
        maintenance: 'Periodic visits may be needed for chronic cases',
      },
      referralCriteria: [
        'No improvement after 8-12 weeks',
        'Red flags develop',
        'Suspected primary headache disorder requiring medical management',
        'Complex case requiring multidisciplinary approach',
      ],
    },

    shoulder_impingement: {
      id: 'shoulder_impingement',
      name: 'Subacromial Impingement Syndrome',
      icd10: 'M75.4',
      icpc2: 'L92',
      description: 'Pain due to compression of rotator cuff tendons in subacromial space',
      redFlags: [
        'Acute trauma with deformity (possible fracture/dislocation)',
        'Severe pain at rest (possible rotator cuff tear)',
        'Significant weakness (possible complete tear)',
        'Persistent night pain despite conservative care',
      ],
      assessment: {
        history: [
          'Pain with overhead activities',
          'Night pain (lying on affected shoulder)',
          'Occupational/sports activities (repetitive overhead work)',
          'Previous shoulder injuries',
          'Onset: gradual vs acute',
        ],
        examination: [
          'Observation: posture, scapular position',
          'Shoulder ROM: active and passive (painful arc 60-120°)',
          'Strength testing: rotator cuff muscles',
          "Special tests: Neer's, Hawkins-Kennedy, Empty Can",
          'Scapular dyskinesis assessment',
          'Cervical spine screening (referred pain)',
          'Thoracic outlet tests (differential diagnosis)',
        ],
        imaging: [
          'X-ray: if trauma or chronic symptoms (assess for bone spurs, AC joint arthritis)',
          'Ultrasound or MRI: if suspected rotator cuff tear or conservative care fails',
        ],
      },
      treatment: {
        phase1: {
          name: 'Pain Control Phase (Week 1-2)',
          frequency: '2-3 visits per week',
          duration: '2 weeks',
          goals: [
            'Reduce pain and inflammation',
            'Restore pain-free ROM',
            'Protect healing tissues',
          ],
          interventions: [
            'Activity modification: avoid overhead activities',
            'Ice application after aggravating activities',
            'Gentle glenohumeral mobilization',
            'Soft tissue therapy: rotator cuff, pectoralis, upper trap',
            'Scapular mobilization',
            'Thoracic spine manipulation (improve extension)',
            'Pendulum exercises for gentle ROM',
          ],
        },
        phase2: {
          name: 'Rehabilitation Phase (Week 3-8)',
          frequency: '1-2 visits per week',
          duration: '6 weeks',
          goals: [
            'Restore full ROM',
            'Strengthen rotator cuff',
            'Correct scapular dyskinesis',
            'Return to function',
          ],
          interventions: [
            'Progressive ROM exercises',
            'Rotator cuff strengthening (external rotation, internal rotation)',
            'Scapular stabilization exercises (serratus anterior, lower trap)',
            'Postural correction (thoracic extension)',
            'Stretching: pectoralis, posterior capsule',
            'Gradual return to overhead activities',
            'Sport/work-specific training',
          ],
        },
      },
      homeExercises: [
        {
          name: 'Pendulum Exercise',
          sets: '2',
          reps: '20 circles each direction',
          frequency: '2x daily',
          description:
            'Bend forward, let arm hang. Swing arm gently in circles. Relax shoulder completely.',
        },
        {
          name: 'External Rotation (Band)',
          sets: '3',
          reps: '12-15',
          frequency: 'Daily',
          description:
            'Elbow at 90°, band in hand. Rotate forearm outward keeping elbow at side. Slow and controlled.',
        },
        {
          name: 'Wall Slides',
          sets: '3',
          reps: '10',
          frequency: 'Daily',
          description:
            'Stand against wall, slide arms overhead keeping contact with wall. Focus on scapular control.',
        },
        {
          name: 'Scapular Squeezes',
          sets: '3',
          reps: '15',
          frequency: 'Daily',
          description:
            'Squeeze shoulder blades together. Hold 5 seconds. Keep shoulders down, away from ears.',
        },
      ],
      expectedOutcomes: {
        week2: 'Significant pain reduction with ADLs',
        week8: '70-80% improvement in most cases',
        week12: 'Full return to activities for uncomplicated cases',
      },
      referralCriteria: [
        'No improvement after 8-12 weeks of conservative care',
        'Suspected full-thickness rotator cuff tear',
        'Persistent severe pain or weakness',
        'Patient requests surgical consultation',
      ],
    },

    piriformis_syndrome: {
      id: 'piriformis_syndrome',
      name: 'Piriformis Syndrome',
      icd10: 'G57.00',
      icpc2: 'L86',
      description: 'Sciatica-like symptoms due to piriformis muscle compression of sciatic nerve',
      assessment: {
        history: [
          'Buttock pain with radiation down posterior thigh',
          'Worsens with prolonged sitting',
          'Pain with climbing stairs or inclines',
          'May have numbness/tingling in leg',
          'Usually unilateral',
        ],
        examination: [
          'Palpation: deep tenderness in piriformis belly',
          'FAIR test (Flexion, Adduction, Internal Rotation)',
          'Freiberg test (passive internal rotation)',
          'Beatty test (resisted hip abduction)',
          'SLR usually negative or mildly positive',
          'Neurological exam usually normal',
          'Hip ROM assessment',
        ],
        imaging: [
          'Lumbar X-ray or MRI to rule out disc herniation',
          'MRI can show piriformis hypertrophy',
        ],
      },
      treatment: {
        phase1: {
          name: 'Acute Phase (Week 1-4)',
          frequency: '2 visits per week',
          duration: '4 weeks',
          goals: [
            'Reduce piriformis spasm',
            'Relieve sciatic nerve compression',
            'Reduce inflammation',
          ],
          interventions: [
            'Piriformis muscle release (ischemic pressure, pin and stretch)',
            'Myofascial release of gluteal muscles',
            'SI joint and lumbar manipulation',
            'Hip mobilization',
            'Ice/heat as appropriate',
            'Activity modification: avoid prolonged sitting',
            'Piriformis and hip stretching',
          ],
        },
        phase2: {
          name: 'Rehabilitation Phase (Week 5-12)',
          frequency: '1 visit per week',
          duration: '8 weeks',
          goals: ['Maintain muscle length', 'Strengthen hip stabilizers', 'Prevent recurrence'],
          interventions: [
            'Continue soft tissue work as needed',
            'Hip strengthening: gluteus medius, gluteus maximus',
            'Core stabilization',
            'Postural and gait training',
            'Ergonomic modifications for sitting',
          ],
        },
      },
      homeExercises: [
        {
          name: 'Piriformis Stretch (Supine)',
          sets: '3',
          reps: '3 each side',
          frequency: '2x daily',
          description:
            'Lie on back, cross ankle over opposite knee. Pull thigh toward chest. Hold 30 seconds.',
        },
        {
          name: 'Figure 4 Stretch',
          sets: '2',
          reps: '3 each side',
          frequency: 'Daily',
          description:
            'Seated, place ankle on opposite knee. Lean forward from hips. Hold 30 seconds.',
        },
        {
          name: 'Hip Abduction (Side-lying)',
          sets: '3',
          reps: '15',
          frequency: 'Daily',
          description: 'Lie on side, lift top leg toward ceiling. Keep hips stacked. Lower slowly.',
        },
      ],
      expectedOutcomes: {
        week4: '50-60% improvement',
        week12: '80-90% resolution for most patients',
      },
      referralCriteria: [
        'No improvement after 12 weeks',
        'Progressive neurological deficit',
        'Suspected disc herniation',
      ],
    },
  };

  const handleSelectProtocol = (protocol) => {
    setSelectedCondition(protocol);
    if (onSelectProtocol) {
      onSelectProtocol(protocol);
    }
  };

  const renderProtocolOverview = (protocol) => (
    <div className="protocol-overview">
      <div className="protocol-header">
        <h2>{protocol.name}</h2>
        <div className="diagnosis-codes">
          <span className="code-badge">ICD-10: {protocol.icd10}</span>
          <span className="code-badge">ICPC-2: {protocol.icpc2}</span>
        </div>
        <p className="protocol-description">{protocol.description}</p>
      </div>

      {protocol.redFlags && (
        <div className="red-flags-section">
          <h3>🚨 Red Flags - Immediate Referral/Investigation</h3>
          <ul>
            {protocol.redFlags.map((flag, idx) => (
              <li key={idx} className="red-flag-item">
                {flag}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="assessment-section">
        <h3>📋 Clinical Assessment</h3>

        {protocol.assessment.history && (
          <div className="assessment-category">
            <h4>History</h4>
            <ul>
              {protocol.assessment.history.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {protocol.assessment.examination && (
          <div className="assessment-category">
            <h4>Physical Examination</h4>
            <ul>
              {protocol.assessment.examination.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {protocol.assessment.imaging && (
          <div className="assessment-category">
            <h4>Imaging</h4>
            <ul>
              {protocol.assessment.imaging.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="treatment-section">
        <h3>💊 Treatment Protocol</h3>

        {Object.entries(protocol.treatment).map(([phaseKey, phase]) => (
          <div key={phaseKey} className="treatment-phase">
            <div className="phase-header">
              <h4>{phase.name}</h4>
              <div className="phase-meta">
                <span className="frequency">📅 {phase.frequency}</span>
                <span className="duration">⏱️ {phase.duration}</span>
              </div>
            </div>

            {phase.goals && (
              <div className="phase-goals">
                <strong>Goals:</strong>
                <ul>
                  {phase.goals.map((goal, idx) => (
                    <li key={idx}>{goal}</li>
                  ))}
                </ul>
              </div>
            )}

            {phase.interventions && (
              <div className="phase-interventions">
                <strong>Interventions:</strong>
                <ul>
                  {phase.interventions.map((intervention, idx) => (
                    <li key={idx}>{intervention}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      {protocol.homeExercises && (
        <div className="exercises-section">
          <h3>🏃 Home Exercise Program</h3>
          <div className="exercise-grid">
            {protocol.homeExercises.map((exercise, idx) => (
              <div key={idx} className="exercise-card">
                <h4>{exercise.name}</h4>
                <div className="exercise-prescription">
                  <span className="ex-detail">
                    {exercise.sets} sets × {exercise.reps}
                  </span>
                  <span className="ex-detail">{exercise.frequency}</span>
                </div>
                <p className="exercise-description">{exercise.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {protocol.expectedOutcomes && (
        <div className="outcomes-section">
          <h3>📊 Expected Outcomes</h3>
          {Object.entries(protocol.expectedOutcomes).map(([timepoint, outcome]) => (
            <div key={timepoint} className="outcome-item">
              <strong>{timepoint.replace(/_/g, ' ').toUpperCase()}:</strong> {outcome}
            </div>
          ))}
        </div>
      )}

      {protocol.referralCriteria && (
        <div className="referral-section">
          <h3>🔄 Referral Criteria</h3>
          <ul>
            {protocol.referralCriteria.map((criteria, idx) => (
              <li key={idx}>{criteria}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  return (
    <div className="clinical-protocols">
      <style>
        {`
          .clinical-protocols {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 20px;
            background: #f5f5f5;
          }

          .protocol-selector {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 15px;
            margin-bottom: 30px;
          }

          .protocol-card {
            background: white;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            padding: 20px;
            cursor: pointer;
            transition: all 0.2s;
          }

          .protocol-card:hover {
            border-color: #2196F3;
            box-shadow: 0 4px 12px rgba(33,150,243,0.2);
            transform: translateY(-2px);
          }

          .protocol-card.selected {
            border-color: #2196F3;
            background: #E3F2FD;
          }

          .protocol-card h3 {
            margin: 0 0 10px 0;
            color: #1976D2;
            font-size: 16px;
          }

          .protocol-card p {
            margin: 0;
            color: #666;
            font-size: 13px;
            line-height: 1.4;
          }

          .protocol-overview {
            background: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }

          .protocol-header h2 {
            margin: 0 0 15px 0;
            color: #1976D2;
            font-size: 28px;
          }

          .diagnosis-codes {
            display: flex;
            gap: 10px;
            margin-bottom: 15px;
          }

          .code-badge {
            background: #E3F2FD;
            color: #1976D2;
            padding: 6px 12px;
            border-radius: 4px;
            font-size: 13px;
            font-weight: 600;
          }

          .protocol-description {
            color: #555;
            font-size: 15px;
            line-height: 1.6;
            margin: 0;
          }

          .red-flags-section {
            background: #FFEBEE;
            border-left: 4px solid #F44336;
            padding: 20px;
            margin: 25px 0;
            border-radius: 4px;
          }

          .red-flags-section h3 {
            margin: 0 0 15px 0;
            color: #C62828;
            font-size: 18px;
          }

          .red-flag-item {
            color: #333;
            margin-bottom: 8px;
            line-height: 1.5;
          }

          .assessment-section,
          .treatment-section,
          .exercises-section,
          .outcomes-section,
          .referral-section {
            margin: 30px 0;
          }

          .assessment-section h3,
          .treatment-section h3,
          .exercises-section h3,
          .outcomes-section h3,
          .referral-section h3 {
            color: #1976D2;
            font-size: 20px;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e0e0e0;
          }

          .assessment-category {
            margin-bottom: 20px;
          }

          .assessment-category h4 {
            color: #666;
            font-size: 16px;
            margin-bottom: 10px;
          }

          .assessment-category ul {
            list-style-type: disc;
            padding-left: 25px;
          }

          .assessment-category li {
            color: #333;
            margin-bottom: 6px;
            line-height: 1.5;
          }

          .treatment-phase {
            background: #FAFAFA;
            border: 1px solid #e0e0e0;
            border-radius: 6px;
            padding: 20px;
            margin-bottom: 20px;
          }

          .phase-header {
            margin-bottom: 15px;
          }

          .phase-header h4 {
            margin: 0 0 10px 0;
            color: #1976D2;
            font-size: 18px;
          }

          .phase-meta {
            display: flex;
            gap: 20px;
            font-size: 14px;
            color: #666;
          }

          .phase-goals,
          .phase-interventions {
            margin-top: 15px;
          }

          .phase-goals strong,
          .phase-interventions strong {
            color: #555;
            font-size: 15px;
          }

          .phase-goals ul,
          .phase-interventions ul {
            margin-top: 8px;
            padding-left: 25px;
          }

          .phase-goals li,
          .phase-interventions li {
            color: #333;
            margin-bottom: 6px;
            line-height: 1.5;
          }

          .exercise-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 15px;
          }

          .exercise-card {
            background: #FAFAFA;
            border: 1px solid #e0e0e0;
            border-radius: 6px;
            padding: 15px;
          }

          .exercise-card h4 {
            margin: 0 0 10px 0;
            color: #1976D2;
            font-size: 16px;
          }

          .exercise-prescription {
            display: flex;
            gap: 15px;
            margin-bottom: 10px;
          }

          .ex-detail {
            background: #E3F2FD;
            padding: 4px 10px;
            border-radius: 3px;
            font-size: 12px;
            font-weight: 600;
            color: #1976D2;
          }

          .exercise-description {
            color: #555;
            font-size: 14px;
            line-height: 1.5;
            margin: 0;
          }

          .outcomes-section {
            background: #E8F5E9;
            border-left: 4px solid #4CAF50;
            padding: 20px;
            border-radius: 4px;
          }

          .outcome-item {
            color: #333;
            margin-bottom: 10px;
            line-height: 1.5;
          }

          .outcome-item strong {
            color: #2E7D32;
          }

          .referral-section {
            background: #FFF3E0;
            border-left: 4px solid #FF9800;
            padding: 20px;
            border-radius: 4px;
          }

          .referral-section ul {
            padding-left: 25px;
          }

          .referral-section li {
            color: #333;
            margin-bottom: 8px;
            line-height: 1.5;
          }

          .back-button {
            background: #2196F3;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 20px;
          }

          .back-button:hover {
            background: #1976D2;
          }
        `}
      </style>

      <h1 style={{ marginTop: 0, color: '#1976D2' }}>Evidence-Based Clinical Protocols</h1>

      {!selectedCondition ? (
        <>
          <p style={{ color: '#666', marginBottom: '25px' }}>
            Select a condition to view the evidence-based treatment protocol and care plan.
          </p>
          <div className="protocol-selector">
            {Object.values(protocols).map((protocol) => (
              <div
                key={protocol.id}
                className="protocol-card"
                onClick={() => handleSelectProtocol(protocol)}
              >
                <h3>{protocol.name}</h3>
                <p>{protocol.description}</p>
                <div style={{ marginTop: '12px', fontSize: '12px', color: '#888' }}>
                  {protocol.icd10} | {protocol.icpc2}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <button className="back-button" onClick={() => setSelectedCondition(null)}>
            ← Back to Protocol List
          </button>
          {renderProtocolOverview(selectedCondition)}
        </>
      )}
    </div>
  );
};

export default ClinicalProtocols;
