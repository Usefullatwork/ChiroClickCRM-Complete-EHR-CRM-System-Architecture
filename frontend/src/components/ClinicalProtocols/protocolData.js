/**
 * Evidence-based clinical protocols data
 */

export const protocols = {
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
        'Shoulder ROM: active and passive (painful arc 60-120\u00b0)',
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
        goals: ['Reduce pain and inflammation', 'Restore pain-free ROM', 'Protect healing tissues'],
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
          'Elbow at 90\u00b0, band in hand. Rotate forearm outward keeping elbow at side. Slow and controlled.',
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
