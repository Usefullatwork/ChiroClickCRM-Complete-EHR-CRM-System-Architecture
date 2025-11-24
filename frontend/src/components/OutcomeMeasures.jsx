import React, { useState, useEffect } from 'react';

/**
 * Outcome Measures Tracking Component
 * Standardized patient-reported outcome measures for tracking clinical progress
 * Includes: Oswestry (ODI), Neck Disability Index (NDI), PSFS, NPRS, EQ-5D
 */
const OutcomeMeasures = ({ patientId, onSave }) => {
  const [activeScale, setActiveScale] = useState('oswestry');
  const [responses, setResponses] = useState({});
  const [score, setScore] = useState(null);
  const [interpretation, setInterpretation] = useState('');

  // Oswestry Disability Index (ODI) - Low Back Pain
  const oswestryQuestions = [
    {
      id: 'pain_intensity',
      question: '1. Pain Intensity',
      options: [
        { value: 0, label: 'I have no pain at the moment' },
        { value: 1, label: 'The pain is very mild at the moment' },
        { value: 2, label: 'The pain is moderate at the moment' },
        { value: 3, label: 'The pain is fairly severe at the moment' },
        { value: 4, label: 'The pain is very severe at the moment' },
        { value: 5, label: 'The pain is the worst imaginable at the moment' }
      ]
    },
    {
      id: 'personal_care',
      question: '2. Personal Care (Washing, Dressing, etc.)',
      options: [
        { value: 0, label: 'I can look after myself normally without causing extra pain' },
        { value: 1, label: 'I can look after myself normally but it causes extra pain' },
        { value: 2, label: 'It is painful to look after myself and I am slow and careful' },
        { value: 3, label: 'I need some help but manage most of my personal care' },
        { value: 4, label: 'I need help every day in most aspects of self-care' },
        { value: 5, label: 'I do not get dressed, wash with difficulty, and stay in bed' }
      ]
    },
    {
      id: 'lifting',
      question: '3. Lifting',
      options: [
        { value: 0, label: 'I can lift heavy weights without extra pain' },
        { value: 1, label: 'I can lift heavy weights but it gives extra pain' },
        { value: 2, label: 'Pain prevents me from lifting heavy weights off the floor, but I can manage if they are conveniently positioned' },
        { value: 3, label: 'Pain prevents me from lifting heavy weights but I can manage light to medium weights if they are conveniently positioned' },
        { value: 4, label: 'I can lift only very light weights' },
        { value: 5, label: 'I cannot lift or carry anything at all' }
      ]
    },
    {
      id: 'walking',
      question: '4. Walking',
      options: [
        { value: 0, label: 'Pain does not prevent me walking any distance' },
        { value: 1, label: 'Pain prevents me walking more than 1 mile' },
        { value: 2, label: 'Pain prevents me walking more than ½ mile' },
        { value: 3, label: 'Pain prevents me walking more than ¼ mile' },
        { value: 4, label: 'I can only walk using a stick or crutches' },
        { value: 5, label: 'I am in bed most of the time and have to crawl to the toilet' }
      ]
    },
    {
      id: 'sitting',
      question: '5. Sitting',
      options: [
        { value: 0, label: 'I can sit in any chair as long as I like' },
        { value: 1, label: 'I can only sit in my favorite chair as long as I like' },
        { value: 2, label: 'Pain prevents me sitting more than 1 hour' },
        { value: 3, label: 'Pain prevents me sitting more than ½ hour' },
        { value: 4, label: 'Pain prevents me sitting more than 10 minutes' },
        { value: 5, label: 'Pain prevents me from sitting at all' }
      ]
    },
    {
      id: 'standing',
      question: '6. Standing',
      options: [
        { value: 0, label: 'I can stand as long as I want without extra pain' },
        { value: 1, label: 'I can stand as long as I want but it gives me extra pain' },
        { value: 2, label: 'Pain prevents me from standing for more than 1 hour' },
        { value: 3, label: 'Pain prevents me from standing for more than ½ hour' },
        { value: 4, label: 'Pain prevents me from standing for more than 10 minutes' },
        { value: 5, label: 'Pain prevents me from standing at all' }
      ]
    },
    {
      id: 'sleeping',
      question: '7. Sleeping',
      options: [
        { value: 0, label: 'My sleep is never disturbed by pain' },
        { value: 1, label: 'My sleep is occasionally disturbed by pain' },
        { value: 2, label: 'Because of pain I have less than 6 hours sleep' },
        { value: 3, label: 'Because of pain I have less than 4 hours sleep' },
        { value: 4, label: 'Because of pain I have less than 2 hours sleep' },
        { value: 5, label: 'Pain prevents me from sleeping at all' }
      ]
    },
    {
      id: 'social_life',
      question: '8. Social Life',
      options: [
        { value: 0, label: 'My social life is normal and gives me no extra pain' },
        { value: 1, label: 'My social life is normal but increases the degree of pain' },
        { value: 2, label: 'Pain has no significant effect on my social life apart from limiting energetic interests' },
        { value: 3, label: 'Pain has restricted my social life and I do not go out as often' },
        { value: 4, label: 'Pain has restricted social life to my home' },
        { value: 5, label: 'I have no social life because of pain' }
      ]
    },
    {
      id: 'traveling',
      question: '9. Traveling',
      options: [
        { value: 0, label: 'I can travel anywhere without pain' },
        { value: 1, label: 'I can travel anywhere but it gives extra pain' },
        { value: 2, label: 'Pain is bad but I manage journeys over 2 hours' },
        { value: 3, label: 'Pain restricts me to journeys of less than 1 hour' },
        { value: 4, label: 'Pain restricts me to short necessary journeys under 30 minutes' },
        { value: 5, label: 'Pain prevents me from traveling except to receive treatment' }
      ]
    },
    {
      id: 'employment',
      question: '10. Employment/Homemaking',
      options: [
        { value: 0, label: 'My normal homemaking/job activities do not cause pain' },
        { value: 1, label: 'My normal homemaking/job activities increase my pain, but I can still perform all that is required of me' },
        { value: 2, label: 'I can perform most of my homemaking/job duties, but pain prevents me from performing more physically stressful activities' },
        { value: 3, label: 'Pain prevents me from doing anything but light duties' },
        { value: 4, label: 'Pain prevents me from doing even light duties' },
        { value: 5, label: 'Pain prevents me from performing any job or homemaking chores' }
      ]
    }
  ];

  // Neck Disability Index (NDI) - Neck Pain
  const ndiQuestions = [
    {
      id: 'pain_intensity',
      question: '1. Pain Intensity',
      options: [
        { value: 0, label: 'I have no pain at the moment' },
        { value: 1, label: 'The pain is very mild at the moment' },
        { value: 2, label: 'The pain is moderate at the moment' },
        { value: 3, label: 'The pain is fairly severe at the moment' },
        { value: 4, label: 'The pain is very severe at the moment' },
        { value: 5, label: 'The pain is the worst imaginable at the moment' }
      ]
    },
    {
      id: 'personal_care',
      question: '2. Personal Care (Washing, Dressing, etc.)',
      options: [
        { value: 0, label: 'I can look after myself normally without causing extra pain' },
        { value: 1, label: 'I can look after myself normally but it causes extra pain' },
        { value: 2, label: 'It is painful to look after myself and I am slow and careful' },
        { value: 3, label: 'I need some help but manage most of my personal care' },
        { value: 4, label: 'I need help every day in most aspects of self-care' },
        { value: 5, label: 'I do not get dressed, wash with difficulty, and stay in bed' }
      ]
    },
    {
      id: 'lifting',
      question: '3. Lifting',
      options: [
        { value: 0, label: 'I can lift heavy weights without extra pain' },
        { value: 1, label: 'I can lift heavy weights but it gives extra pain' },
        { value: 2, label: 'Pain prevents me from lifting heavy weights off the floor, but I can manage if they are conveniently positioned' },
        { value: 3, label: 'Pain prevents me from lifting heavy weights but I can manage light to medium weights if they are conveniently positioned' },
        { value: 4, label: 'I can lift only very light weights' },
        { value: 5, label: 'I cannot lift or carry anything at all' }
      ]
    },
    {
      id: 'reading',
      question: '4. Reading',
      options: [
        { value: 0, label: 'I can read as much as I want with no pain in my neck' },
        { value: 1, label: 'I can read as much as I want with slight pain in my neck' },
        { value: 2, label: 'I can read as much as I want with moderate pain in my neck' },
        { value: 3, label: 'I cannot read as much as I want because of moderate pain in my neck' },
        { value: 4, label: 'I cannot read as much as I want because of severe pain in my neck' },
        { value: 5, label: 'I cannot read at all because of pain in my neck' }
      ]
    },
    {
      id: 'headaches',
      question: '5. Headaches',
      options: [
        { value: 0, label: 'I have no headaches at all' },
        { value: 1, label: 'I have slight headaches which come infrequently' },
        { value: 2, label: 'I have moderate headaches which come infrequently' },
        { value: 3, label: 'I have moderate headaches which come frequently' },
        { value: 4, label: 'I have severe headaches which come frequently' },
        { value: 5, label: 'I have headaches almost all the time' }
      ]
    },
    {
      id: 'concentration',
      question: '6. Concentration',
      options: [
        { value: 0, label: 'I can concentrate fully when I want with no difficulty' },
        { value: 1, label: 'I can concentrate fully when I want with slight difficulty' },
        { value: 2, label: 'I have a fair degree of difficulty concentrating when I want' },
        { value: 3, label: 'I have a lot of difficulty concentrating when I want' },
        { value: 4, label: 'I have a great deal of difficulty concentrating when I want' },
        { value: 5, label: 'I cannot concentrate at all' }
      ]
    },
    {
      id: 'work',
      question: '7. Work',
      options: [
        { value: 0, label: 'I can do as much work as I want' },
        { value: 1, label: 'I can only do my usual work but no more' },
        { value: 2, label: 'I can only do most of my usual work but no more' },
        { value: 3, label: 'I cannot do my usual work' },
        { value: 4, label: 'I can hardly do any work at all' },
        { value: 5, label: 'I cannot do any work at all' }
      ]
    },
    {
      id: 'driving',
      question: '8. Driving',
      options: [
        { value: 0, label: 'I can drive my car without any neck pain' },
        { value: 1, label: 'I can drive my car as long as I want with slight neck pain' },
        { value: 2, label: 'I can drive my car as long as I want with moderate neck pain' },
        { value: 3, label: 'I cannot drive my car as long as I want because of moderate neck pain' },
        { value: 4, label: 'I can hardly drive at all because of severe neck pain' },
        { value: 5, label: 'I cannot drive my car at all because of neck pain' }
      ]
    },
    {
      id: 'sleeping',
      question: '9. Sleeping',
      options: [
        { value: 0, label: 'I have no trouble sleeping' },
        { value: 1, label: 'My sleep is slightly disturbed (less than 1 hour sleepless)' },
        { value: 2, label: 'My sleep is mildly disturbed (1-2 hours sleepless)' },
        { value: 3, label: 'My sleep is moderately disturbed (2-3 hours sleepless)' },
        { value: 4, label: 'My sleep is greatly disturbed (3-5 hours sleepless)' },
        { value: 5, label: 'My sleep is completely disturbed (5-7 hours sleepless)' }
      ]
    },
    {
      id: 'recreation',
      question: '10. Recreation',
      options: [
        { value: 0, label: 'I am able to engage in all my recreation activities without neck pain' },
        { value: 1, label: 'I am able to engage in all my usual recreation activities with some neck pain' },
        { value: 2, label: 'I am able to engage in most but not all my usual recreation activities because of neck pain' },
        { value: 3, label: 'I am only able to engage in a few of my usual recreation activities because of neck pain' },
        { value: 4, label: 'I can hardly do any recreation activities because of neck pain' },
        { value: 5, label: 'I cannot do any recreation activities at all' }
      ]
    }
  ];

  const calculateScore = () => {
    const questions = activeScale === 'oswestry' ? oswestryQuestions : ndiQuestions;
    const totalPoints = Object.values(responses).reduce((sum, val) => sum + val, 0);
    const maxPoints = questions.length * 5;
    const percentage = Math.round((totalPoints / maxPoints) * 100);

    setScore(percentage);

    // Interpretation
    let interp = '';
    if (percentage <= 20) {
      interp = 'Minimal Disability: Patient can cope with most activities of daily living. No treatment may be indicated except for suggestions on lifting, posture, diet, and exercise.';
    } else if (percentage <= 40) {
      interp = 'Moderate Disability: Patient experiences more pain and difficulty sitting, lifting, and standing. Travel and social life are more difficult. Patient may be disabled from work. Treatment should be considered.';
    } else if (percentage <= 60) {
      interp = 'Severe Disability: Pain remains the main problem, but activities of daily living are also affected. These patients require detailed investigation.';
    } else if (percentage <= 80) {
      interp = 'Crippled: Back or neck pain impinges on all aspects of the patient\'s life. Positive intervention is required.';
    } else {
      interp = 'Bed-bound or Exaggerating: Patient is either bed-bound or exaggerating symptoms. Careful assessment is needed.';
    }

    setInterpretation(interp);

    // Call parent save function
    if (onSave) {
      onSave({
        scale: activeScale,
        score: percentage,
        responses: responses,
        interpretation: interp,
        date: new Date().toISOString()
      });
    }
  };

  useEffect(() => {
    if (Object.keys(responses).length > 0) {
      calculateScore();
    }
  }, [responses, activeScale]);

  const handleResponse = (questionId, value) => {
    setResponses({
      ...responses,
      [questionId]: value
    });
  };

  const renderQuestions = (questions) => (
    <div className="questions-container">
      {questions.map((q, idx) => (
        <div key={q.id} className="question-block">
          <h4 className="question-text">{q.question}</h4>
          <div className="options-list">
            {q.options.map(opt => (
              <label key={opt.value} className="option-label">
                <input
                  type="radio"
                  name={q.id}
                  value={opt.value}
                  checked={responses[q.id] === opt.value}
                  onChange={() => handleResponse(q.id, opt.value)}
                  className="option-radio"
                />
                <span className="option-text">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="outcome-measures">
      <style>
        {`
          .outcome-measures {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
            background: white;
            border-radius: 8px;
          }

          .scale-selector {
            display: flex;
            gap: 10px;
            margin-bottom: 30px;
            border-bottom: 2px solid #e0e0e0;
          }

          .scale-btn {
            padding: 12px 24px;
            background: none;
            border: none;
            border-bottom: 3px solid transparent;
            cursor: pointer;
            font-size: 15px;
            font-weight: 600;
            color: #666;
            transition: all 0.2s;
          }

          .scale-btn:hover {
            color: #2196F3;
            background: #f5f5f5;
          }

          .scale-btn.active {
            color: #2196F3;
            border-bottom-color: #2196F3;
          }

          .questions-container {
            margin-bottom: 30px;
          }

          .question-block {
            margin-bottom: 25px;
            padding: 20px;
            background: #fafafa;
            border: 1px solid #e0e0e0;
            border-radius: 6px;
          }

          .question-text {
            margin: 0 0 15px 0;
            color: #1976D2;
            font-size: 16px;
            font-weight: 600;
          }

          .options-list {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }

          .option-label {
            display: flex;
            align-items: flex-start;
            padding: 10px;
            border-radius: 4px;
            cursor: pointer;
            transition: background 0.2s;
          }

          .option-label:hover {
            background: #e3f2fd;
          }

          .option-radio {
            margin-right: 10px;
            margin-top: 3px;
            cursor: pointer;
            flex-shrink: 0;
          }

          .option-text {
            flex: 1;
            color: #333;
            font-size: 14px;
            line-height: 1.5;
          }

          .score-display {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 25px;
            border-radius: 8px;
            margin-bottom: 20px;
            text-align: center;
          }

          .score-number {
            font-size: 48px;
            font-weight: 700;
            margin: 10px 0;
          }

          .score-label {
            font-size: 16px;
            opacity: 0.9;
            margin-bottom: 5px;
          }

          .interpretation-box {
            background: #FFF3E0;
            border-left: 4px solid #FF9800;
            padding: 20px;
            border-radius: 4px;
            margin-top: 20px;
          }

          .interpretation-title {
            color: #E65100;
            font-weight: 600;
            margin-bottom: 10px;
            font-size: 16px;
          }

          .interpretation-text {
            color: #333;
            line-height: 1.6;
            font-size: 14px;
          }

          .progress-indicator {
            margin-top: 15px;
            background: rgba(255,255,255,0.3);
            height: 12px;
            border-radius: 6px;
            overflow: hidden;
          }

          .progress-bar {
            height: 100%;
            background: white;
            transition: width 0.3s;
            border-radius: 6px;
          }

          .scale-description {
            background: #E3F2FD;
            border-left: 4px solid #2196F3;
            padding: 15px;
            margin-bottom: 25px;
            border-radius: 4px;
          }

          .scale-description h3 {
            margin: 0 0 8px 0;
            color: #1976D2;
            font-size: 18px;
          }

          .scale-description p {
            margin: 0;
            color: #555;
            font-size: 14px;
            line-height: 1.5;
          }
        `}
      </style>

      <h2 style={{ marginTop: 0, color: '#1976D2' }}>Patient-Reported Outcome Measures</h2>

      <div className="scale-selector">
        <button
          className={`scale-btn ${activeScale === 'oswestry' ? 'active' : ''}`}
          onClick={() => { setActiveScale('oswestry'); setResponses({}); setScore(null); }}
        >
          Oswestry (ODI) - Low Back
        </button>
        <button
          className={`scale-btn ${activeScale === 'ndi' ? 'active' : ''}`}
          onClick={() => { setActiveScale('ndi'); setResponses({}); setScore(null); }}
        >
          Neck Disability Index (NDI)
        </button>
      </div>

      {activeScale === 'oswestry' && (
        <div className="scale-description">
          <h3>Oswestry Disability Index (ODI)</h3>
          <p>
            The ODI is a validated questionnaire for assessing disability related to low back pain.
            It measures the impact of back pain on daily activities and quality of life.
            Scores range from 0-100%, with higher scores indicating greater disability.
          </p>
        </div>
      )}

      {activeScale === 'ndi' && (
        <div className="scale-description">
          <h3>Neck Disability Index (NDI)</h3>
          <p>
            The NDI is a validated questionnaire for assessing disability related to neck pain.
            It evaluates how neck pain affects daily activities, work, and quality of life.
            Scores range from 0-100%, with higher scores indicating greater disability.
          </p>
        </div>
      )}

      {score !== null && (
        <div className="score-display">
          <div className="score-label">Disability Score</div>
          <div className="score-number">{score}%</div>
          <div className="progress-indicator">
            <div className="progress-bar" style={{ width: `${score}%` }}></div>
          </div>
        </div>
      )}

      {activeScale === 'oswestry' && renderQuestions(oswestryQuestions)}
      {activeScale === 'ndi' && renderQuestions(ndiQuestions)}

      {interpretation && (
        <div className="interpretation-box">
          <div className="interpretation-title">Clinical Interpretation</div>
          <div className="interpretation-text">{interpretation}</div>
        </div>
      )}
    </div>
  );
};

export default OutcomeMeasures;
