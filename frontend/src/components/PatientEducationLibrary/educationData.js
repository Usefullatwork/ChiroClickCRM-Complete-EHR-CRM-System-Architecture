/**
 * Education materials data for PatientEducationLibrary
 */

export const educationMaterials = [
  {
    id: 'lbp_acute',
    category: 'Low Back Pain',
    title: 'Understanding Acute Low Back Pain',
    readingLevel: 'Basic',
    estimatedTime: '5 min',
    content: {
      overview:
        'Acute low back pain is very common and usually improves within a few weeks with appropriate care. Most cases are non-specific, meaning there is no serious underlying condition.',
      whatIsIt: [
        'Sudden onset back pain lasting less than 6 weeks',
        'Often caused by muscle strain, ligament sprain, or joint dysfunction',
        'Usually mechanical in nature (related to movement or posture)',
        'Generally has a favorable prognosis with proper treatment',
      ],
      causes: [
        'Poor lifting technique or heavy lifting',
        'Sudden awkward movements or twisting',
        'Poor posture during sitting or standing',
        'Muscle weakness or imbalance',
        'Previous episodes of back pain',
        'Sedentary lifestyle and deconditioning',
      ],
      symptoms: [
        'Pain in the lower back, sometimes spreading to buttocks or thighs',
        'Muscle spasm or stiffness',
        'Difficulty with certain movements (bending, twisting, lifting)',
        'Pain that changes with position',
        'Usually worse in the morning or after prolonged sitting',
      ],
      treatment: [
        'Chiropractic spinal manipulation to restore joint mobility',
        'Soft tissue therapy to reduce muscle tension',
        'Ice therapy in first 48-72 hours',
        'Gentle stretching and movement exercises',
        'Gradual return to normal activities',
        'Postural and ergonomic corrections',
        'Core strengthening exercises',
      ],
      selfCare: [
        'Stay active - bed rest is NOT recommended',
        'Apply ice for 15-20 minutes every 2-3 hours (first 2-3 days)',
        'Avoid prolonged sitting - stand and walk every 30 minutes',
        'Sleep on your side with a pillow between knees',
        'Practice proper body mechanics when lifting',
        'Maintain good posture throughout the day',
        'Perform prescribed home exercises regularly',
      ],
      whenToSeek: [
        'Severe pain not improving after a few days',
        'Pain spreading down both legs',
        'Numbness or weakness in legs',
        'Loss of bowel or bladder control (EMERGENCY)',
        'Fever, unexplained weight loss, or night sweats',
        'History of cancer, recent trauma, or osteoporosis',
      ],
      prevention: [
        'Maintain regular physical activity and exercise',
        'Practice proper lifting techniques',
        'Strengthen core and back muscles',
        'Maintain healthy body weight',
        'Use ergonomic furniture and workstation setup',
        'Take breaks during prolonged sitting',
        'Stay flexible through regular stretching',
      ],
      expectedRecovery:
        'Most people see significant improvement within 2-4 weeks. Full recovery typically occurs within 6-12 weeks with appropriate treatment and self-care.',
    },
  },
  {
    id: 'neck_pain',
    category: 'Neck Pain',
    title: 'Managing Neck Pain and Stiffness',
    readingLevel: 'Basic',
    estimatedTime: '5 min',
    content: {
      overview:
        'Neck pain is extremely common in modern society, often related to posture, stress, and prolonged screen time. Most neck pain responds well to conservative chiropractic care.',
      whatIsIt: [
        'Pain, stiffness, or discomfort in the cervical spine (neck)',
        'May include headaches and shoulder pain',
        'Can be acute (sudden onset) or chronic (lasting months)',
        'Often mechanical, related to posture and muscle tension',
      ],
      causes: [
        'Poor posture, especially "tech neck" or forward head posture',
        'Prolonged computer or phone use',
        'Sleeping in awkward positions',
        'Stress and muscle tension',
        'Previous injuries or whiplash',
        'Arthritis or disc degeneration',
        'Muscle weakness in neck and upper back',
      ],
      symptoms: [
        'Neck pain and stiffness, worse with movement',
        'Reduced range of motion (difficulty turning head)',
        'Headaches, especially at base of skull',
        'Shoulder and upper back pain',
        'Muscle tenderness and knots',
        'Sometimes tingling or numbness in arms (if nerves affected)',
      ],
      treatment: [
        'Cervical spinal adjustments to restore mobility',
        'Soft tissue therapy for tight muscles',
        'Postural correction and ergonomic advice',
        'Strengthening exercises for deep neck flexors',
        'Stretching for tight muscles (upper traps, levator scapulae)',
        'Heat or ice therapy as appropriate',
        'Stress reduction techniques',
      ],
      selfCare: [
        'Take frequent breaks from computer work (every 30 minutes)',
        'Maintain neutral head position - avoid forward head posture',
        'Use a supportive pillow that keeps neck aligned',
        'Apply heat for chronic stiffness, ice for acute flare-ups',
        'Perform gentle neck stretches throughout the day',
        'Practice "chin tucks" to strengthen deep neck muscles',
        'Manage stress through relaxation techniques',
        'Avoid prolonged phone use with head bent down',
      ],
      exercises: [
        {
          name: 'Chin Tucks',
          description:
            'Gently tuck chin straight back (make a double chin). Hold 5 seconds. Repeat 10 times.',
        },
        {
          name: 'Upper Trap Stretch',
          description:
            'Tilt ear toward shoulder, gently pull head with hand. Hold 30 seconds each side.',
        },
        {
          name: 'Neck Rotations',
          description: 'Slowly turn head to look over shoulder. Hold 10 seconds each side.',
        },
      ],
      whenToSeek: [
        'Severe pain following trauma or injury',
        'Numbness, tingling, or weakness in arms or hands',
        'Difficulty walking or loss of balance',
        'Fever with neck stiffness',
        'Pain radiating down arm with specific patterns',
        'No improvement after 2-3 weeks of conservative care',
      ],
      prevention: [
        'Set up ergonomic workstation (monitor at eye level)',
        'Take regular movement breaks',
        'Strengthen neck and upper back muscles',
        'Maintain good posture throughout day',
        'Use supportive pillow for sleeping',
        'Manage stress levels',
        'Stay physically active with regular exercise',
      ],
      expectedRecovery:
        'Acute neck pain typically improves within 2-4 weeks. Chronic neck pain may take 6-12 weeks to resolve with consistent treatment and lifestyle modifications.',
    },
  },
  {
    id: 'cervicogenic_headache',
    category: 'Headaches',
    title: 'Cervicogenic Headaches: When Your Neck Causes Your Headache',
    readingLevel: 'Intermediate',
    estimatedTime: '6 min',
    content: {
      overview:
        'Cervicogenic headaches originate from problems in the neck but cause pain felt in the head. They are often misdiagnosed as migraines or tension headaches but respond very well to chiropractic treatment.',
      whatIsIt: [
        'Headaches caused by neck dysfunction',
        'Pain typically starts in neck/base of skull and spreads forward',
        'Often one-sided (unilateral)',
        'Triggered or worsened by neck movements or sustained postures',
        'Different from migraines or tension-type headaches',
      ],
      causes: [
        'Upper cervical joint dysfunction (especially C0-C2)',
        'Muscle tension in neck and base of skull',
        'Poor posture (forward head posture)',
        'Previous neck injury or whiplash',
        'Prolonged computer work or desk jobs',
        'Stress and muscle tension',
      ],
      symptoms: [
        'One-sided head pain starting at neck/back of head',
        'Pain that spreads from neck to eye/forehead on one side',
        'Reduced neck range of motion',
        'Headache triggered by neck movements or pressure on neck',
        'Neck pain and stiffness',
        'Sometimes dizziness or nausea',
        'NOT throbbing (unlike migraines)',
        'NOT associated with sensitivity to light/sound (unlike migraines)',
      ],
      treatment: [
        'Specific upper cervical chiropractic adjustments',
        'Mobilization of mid-cervical spine',
        'Soft tissue therapy to suboccipital muscles',
        'Postural correction (especially forward head posture)',
        'Deep neck flexor strengthening exercises',
        'Ergonomic modifications for workstation',
        'Stress management techniques',
      ],
      selfCare: [
        'Maintain proper posture - avoid forward head position',
        'Take frequent breaks from desk work',
        'Apply ice to base of skull during acute headache',
        'Practice relaxation techniques to reduce muscle tension',
        'Sleep with proper neck support',
        'Perform prescribed neck exercises regularly',
        'Avoid prolonged static postures',
        'Manage stress through meditation or deep breathing',
      ],
      exercises: [
        {
          name: 'Suboccipital Release',
          description:
            'Lie on back with tennis balls at base of skull. Relax 2-3 minutes. Turn head side to side gently.',
        },
        {
          name: 'Deep Neck Flexor Activation',
          description:
            'Chin tucks: Gently tuck chin straight back. Hold 5 seconds. Do NOT tilt head down. Repeat 10 times.',
        },
        {
          name: 'Upper Cervical Mobility',
          description:
            'Gentle neck rotation and side-bending. Move slowly through pain-free range. 10 reps each direction.',
        },
      ],
      whenToSeek: [
        'First-time severe headache ("worst headache of life")',
        'Sudden onset "thunderclap" headache',
        'Headache with fever, stiff neck, confusion',
        'Progressive worsening over weeks',
        'New headache if over age 50',
        'Headache with neurological symptoms (vision changes, weakness)',
        'No improvement after 8-12 weeks of treatment',
      ],
      prevention: [
        'Maintain excellent posture, especially at computer',
        'Strengthen deep neck muscles regularly',
        'Take movement breaks every 30 minutes',
        'Use ergonomic workstation setup',
        'Practice stress management',
        'Maintain regular chiropractic care',
        'Stay physically active',
      ],
      expectedRecovery:
        'Most patients experience 40-60% reduction in headache frequency and intensity within 4 weeks. Significant improvement (70-80%) typically achieved by 12 weeks with consistent treatment.',
    },
  },
  {
    id: 'posture',
    category: 'Prevention',
    title: 'The Importance of Good Posture',
    readingLevel: 'Basic',
    estimatedTime: '4 min',
    content: {
      overview:
        'Good posture is essential for spinal health and overall wellbeing. Poor posture is a major contributor to neck pain, back pain, and headaches.',
      whatIsIt: [
        'Optimal alignment of body parts supported by right muscle tension',
        'Ears over shoulders, shoulders over hips',
        'Natural spinal curves maintained',
        'Balanced muscle activity with minimal strain',
      ],
      whyItMatters: [
        'Reduces strain on muscles, ligaments, and joints',
        'Prevents pain and injury',
        'Improves breathing and circulation',
        'Enhances energy levels and reduces fatigue',
        'Projects confidence and positive body language',
        'Prevents long-term spinal degeneration',
      ],
      commonProblems: [
        'Forward head posture ("tech neck")',
        'Rounded shoulders',
        'Increased thoracic curve (hunched upper back)',
        'Loss of lumbar curve (flat lower back)',
        'Anterior pelvic tilt',
        'Uneven shoulders or hips',
      ],
      sittingPosture: [
        'Sit back in chair with lumbar support',
        'Feet flat on floor or footrest',
        'Knees at 90\u00b0 angle, level with or slightly below hips',
        "Computer monitor at eye level, arm's length away",
        'Elbows at 90\u00b0, close to body',
        'Take standing/walking breaks every 30 minutes',
        'Avoid crossing legs for prolonged periods',
      ],
      standingPosture: [
        'Weight evenly distributed on both feet',
        'Feet shoulder-width apart',
        'Knees slightly bent, not locked',
        "Tuck pelvis slightly (don't arch lower back)",
        'Pull shoulders back and down',
        'Chin level, ears over shoulders',
        'Engage core muscles gently',
      ],
      sleepingPosture: [
        'Side sleeping: pillow between knees, pillow supporting neck',
        'Back sleeping: pillow under knees, supportive pillow for neck',
        'AVOID stomach sleeping (strains neck)',
        'Use mattress that supports natural spinal curves',
        'Replace pillows every 1-2 years',
      ],
      exercises: [
        {
          name: 'Wall Angels',
          description:
            'Stand against wall, slide arms overhead keeping contact with wall. Strengthens postural muscles.',
        },
        {
          name: 'Scapular Squeezes',
          description: 'Squeeze shoulder blades together. Hold 5 seconds. Repeat 15 times.',
        },
        {
          name: 'Chin Tucks',
          description:
            'Gently tuck chin straight back. Hold 5 seconds. Counters forward head posture.',
        },
      ],
      tips: [
        'Set hourly reminders to check posture',
        'Use smartphone at eye level (not bent over)',
        'Invest in ergonomic furniture',
        'Strengthen core and back muscles',
        'Stay aware of posture throughout day',
        'Regular chiropractic adjustments',
        'Practice yoga or Pilates',
      ],
    },
  },
  {
    id: 'home_exercises',
    category: 'Exercise',
    title: 'Essential Home Exercises for Spinal Health',
    readingLevel: 'Basic',
    estimatedTime: '7 min',
    content: {
      overview:
        'Regular exercise is crucial for maintaining spinal health, preventing pain, and supporting recovery from injuries. These exercises can be done at home with minimal equipment.',
      benefits: [
        'Strengthens muscles that support the spine',
        'Improves flexibility and range of motion',
        'Reduces pain and prevents recurrence',
        'Enhances posture and body mechanics',
        'Increases blood flow and healing',
        'Improves overall function and quality of life',
      ],
      coreExercises: [
        {
          name: 'Bird Dog',
          description:
            'On hands and knees, extend opposite arm and leg. Hold 5 seconds. 10 reps each side.',
          level: 'Beginner',
          focus: 'Core stability, balance',
        },
        {
          name: 'Dead Bug',
          description:
            'Lie on back, arms up, knees bent. Lower opposite arm and leg. 10 reps each side.',
          level: 'Beginner',
          focus: 'Core stability, coordination',
        },
        {
          name: 'Plank',
          description:
            'Forearms and toes, body in straight line. Hold 20-60 seconds. Build up gradually.',
          level: 'Intermediate',
          focus: 'Full core strength',
        },
        {
          name: 'Side Plank',
          description: 'On side, forearm and feet. Lift hips. Hold 20-45 seconds each side.',
          level: 'Intermediate',
          focus: 'Lateral core, obliques',
        },
      ],
      lowerBackExercises: [
        {
          name: 'Pelvic Tilts',
          description:
            'Lie on back, knees bent. Flatten lower back to floor. Hold 5 seconds. 10 reps.',
          level: 'Beginner',
          focus: 'Lumbar mobility, core awareness',
        },
        {
          name: 'Cat-Cow Stretch',
          description: 'On hands and knees, alternate arching and rounding spine. 10 reps slowly.',
          level: 'Beginner',
          focus: 'Spinal mobility',
        },
        {
          name: 'Knee to Chest',
          description: 'Lie on back, pull one knee to chest. Hold 20-30 seconds. 3 reps each side.',
          level: 'Beginner',
          focus: 'Lower back stretch',
        },
        {
          name: 'Bridge',
          description: 'Lie on back, knees bent. Lift hips off floor. Hold 5 seconds. 10-15 reps.',
          level: 'Intermediate',
          focus: 'Glutes, hamstrings, lower back',
        },
      ],
      neckExercises: [
        {
          name: 'Chin Tucks',
          description: 'Gently tuck chin straight back (double chin). Hold 5 seconds. 10 reps.',
          level: 'Beginner',
          focus: 'Deep neck flexors, posture',
        },
        {
          name: 'Neck Rotations',
          description: 'Slowly turn head to look over shoulder. Hold 10 seconds each side. 5 reps.',
          level: 'Beginner',
          focus: 'Neck mobility',
        },
        {
          name: 'Upper Trap Stretch',
          description:
            'Tilt ear to shoulder, gently pull with hand. Hold 30 seconds. 3 reps each side.',
          level: 'Beginner',
          focus: 'Upper trapezius flexibility',
        },
      ],
      guidelines: [
        'Warm up before exercising (5-10 minutes of light activity)',
        'Start slowly and progress gradually',
        'Stop if you experience sharp pain',
        "Breathe normally - don't hold your breath",
        'Focus on proper form over number of repetitions',
        'Exercise on both sides equally',
        'Consistency is more important than intensity',
        'Aim for daily exercise, even just 10-15 minutes',
      ],
      safety: [
        'Consult your chiropractor before starting new exercises',
        'Never exercise through sharp pain',
        'Some mild discomfort is normal when starting',
        'Progress exercises as tolerated',
        'If unsure about technique, ask for demonstration',
        'Avoid exercises that aggravate your condition',
      ],
    },
  },
  {
    id: 'ergonomics',
    category: 'Prevention',
    title: 'Workplace Ergonomics: Setting Up Your Workspace',
    readingLevel: 'Basic',
    estimatedTime: '5 min',
    content: {
      overview:
        'Proper workplace ergonomics can prevent neck pain, back pain, headaches, and repetitive strain injuries. Small adjustments to your workspace can make a significant difference.',
      computerSetup: [
        "Monitor at eye level, arm's length away (20-26 inches)",
        'Top of screen at or slightly below eye level',
        'Screen directly in front, not off to side',
        'Keyboard and mouse close, at same height',
        'Elbows at 90\u00b0 angle when typing',
        'Wrists neutral (straight), not bent up or down',
        'Use document holder at same height as screen',
      ],
      chairSetup: [
        'Adjustable chair with good lumbar support',
        'Seat height: feet flat on floor or footrest',
        'Knees at 90\u00b0 angle, level with or slightly below hips',
        'Sit back in chair - use full backrest',
        'Armrests support elbows at 90\u00b0',
        '2-3 finger width gap between seat edge and back of knees',
        'Adjust lumbar support to fit curve of lower back',
      ],
      deskSetup: [
        'Desk height allows elbows at 90\u00b0 when typing',
        'Adequate legroom under desk',
        'Frequently used items within easy reach',
        'Phone within reach (use headset if on phone frequently)',
        'Clear workspace - avoid clutter',
        'Good lighting - avoid glare on screen',
      ],
      movementBreaks: [
        'Stand up and move every 30 minutes',
        'Look away from screen every 20 minutes (20 feet away, 20 seconds)',
        'Perform stretches at desk hourly',
        'Walk during phone calls when possible',
        'Take lunch away from desk',
        'Use stairs instead of elevator',
        'Consider sit-stand desk or desk converter',
      ],
      phoneTabletUse: [
        'Hold phone at eye level, not bent over',
        'Use voice-to-text when possible',
        'Take breaks from scrolling',
        'Use tablet stand or prop up on pillow',
        'Avoid prolonged phone use',
        'Consider larger device if using frequently',
      ],
      exercises: [
        {
          name: 'Desk Shoulder Rolls',
          description: 'Roll shoulders backward 10 times. Do every hour.',
        },
        {
          name: 'Seated Spinal Twist',
          description: 'Sit tall, rotate upper body to side. Hold 15 seconds each side.',
        },
        {
          name: 'Neck Stretches',
          description: 'Tilt head side to side and rotation. Hold each 10 seconds.',
        },
        {
          name: 'Standing Back Bend',
          description: 'Stand, hands on lower back, gently arch backward. Hold 10 seconds.',
        },
      ],
      tips: [
        'Set up ergonomic workspace from day one',
        'Take photos of proper setup for reference',
        'Request ergonomic assessment from employer if needed',
        'Invest in quality chair - you spend hours in it daily',
        'Use reminders/apps to prompt movement breaks',
        'Stay hydrated - encourages bathroom breaks',
        'Practice good posture even with perfect setup',
      ],
    },
  },
];
