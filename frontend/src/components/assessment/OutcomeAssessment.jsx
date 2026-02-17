import { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle, AlertCircle } from 'lucide-react';

/**
 * OutcomeAssessment - Standardized outcome measure questionnaires
 * Inspired by ChiroTouch's electronic outcome assessments
 *
 * Features:
 * - Pre-built questionnaires (ODI, NDI, PSFS)
 * - Automatic scoring
 * - Progress tracking
 * - Patient-friendly interface
 */
export default function OutcomeAssessment({
  type = 'ODI', // 'ODI' | 'NDI' | 'PSFS' | 'custom'
  responses = {},
  onChange,
  showScore = true,
  className = '',
}) {
  const [expandedSections, setExpandedSections] = useState({});

  const questionnaires = {
    ODI: {
      name: 'Oswestry Disability Index',
      description: 'Low back pain disability assessment',
      sections: ODI_QUESTIONS,
    },
    NDI: {
      name: 'Neck Disability Index',
      description: 'Neck pain disability assessment',
      sections: NDI_QUESTIONS,
    },
    PSFS: {
      name: 'Patient-Specific Functional Scale',
      description: 'Custom functional limitation assessment',
      sections: PSFS_QUESTIONS,
    },
  };

  const questionnaire = questionnaires[type];

  const toggleSection = (sectionId) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const handleResponseChange = (questionId, value) => {
    onChange({
      ...responses,
      [questionId]: value,
    });
  };

  // Calculate score
  const calculateScore = () => {
    if (!questionnaire) {
      return null;
    }

    const questions = questionnaire.sections.flatMap((s) => s.questions);
    const answeredQuestions = questions.filter((q) => responses[q.id] !== undefined);

    if (answeredQuestions.length === 0) {
      return null;
    }

    const totalScore = answeredQuestions.reduce((sum, q) => sum + (responses[q.id] || 0), 0);
    const maxPossible = answeredQuestions.length * 5; // Each question max is 5

    return {
      raw: totalScore,
      percentage: Math.round((totalScore / maxPossible) * 100),
      answered: answeredQuestions.length,
      total: questions.length,
    };
  };

  const score = calculateScore();

  const getScoreInterpretation = (percentage) => {
    if (percentage <= 20) {
      return { text: 'Minimal disability', color: 'text-green-600 bg-green-50' };
    }
    if (percentage <= 40) {
      return { text: 'Moderate disability', color: 'text-yellow-600 bg-yellow-50' };
    }
    if (percentage <= 60) {
      return { text: 'Severe disability', color: 'text-orange-600 bg-orange-50' };
    }
    if (percentage <= 80) {
      return { text: 'Crippling disability', color: 'text-red-600 bg-red-50' };
    }
    return { text: 'Bed-bound', color: 'text-red-800 bg-red-100' };
  };

  if (!questionnaire) {
    return <div className="text-red-500">Unknown questionnaire type: {type}</div>;
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900">{questionnaire.name}</h3>
            <p className="text-sm text-gray-500">{questionnaire.description}</p>
          </div>

          {/* Score badge */}
          {showScore && score && (
            <div className="text-right">
              <div
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                  getScoreInterpretation(score.percentage).color
                }`}
              >
                {score.percentage}%
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {score.answered}/{score.total} answered
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Questions */}
      <div className="divide-y divide-gray-100">
        {questionnaire.sections.map((section, _sectionIndex) => {
          const isExpanded = expandedSections[section.id] !== false; // Default to expanded
          const sectionAnswered = section.questions.filter(
            (q) => responses[q.id] !== undefined
          ).length;
          const sectionComplete = sectionAnswered === section.questions.length;

          return (
            <div key={section.id}>
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {sectionComplete ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : sectionAnswered > 0 ? (
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                  )}
                  <span className="font-medium text-gray-900">{section.title}</span>
                  <span className="text-sm text-gray-500">
                    ({sectionAnswered}/{section.questions.length})
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {/* Section Questions */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-4">
                  {section.questions.map((question) => (
                    <div key={question.id} className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm font-medium text-gray-900 mb-3">{question.text}</p>
                      <div className="space-y-2">
                        {question.options.map((option, optionIndex) => (
                          <label
                            key={optionIndex}
                            className={`flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                              responses[question.id] === option.value
                                ? 'bg-blue-100 border border-blue-300'
                                : 'bg-white border border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            <input
                              type="radio"
                              name={question.id}
                              value={option.value}
                              checked={responses[question.id] === option.value}
                              onChange={() => handleResponseChange(question.id, option.value)}
                              className="mt-0.5 w-4 h-4 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">{option.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Score Interpretation */}
      {showScore && score && score.percentage !== null && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700">Interpretation: </span>
              <span
                className={`text-sm font-medium ${getScoreInterpretation(score.percentage).color.split(' ')[0]}`}
              >
                {getScoreInterpretation(score.percentage).text}
              </span>
            </div>
            <div className="text-sm text-gray-500">
              Raw score: {score.raw} / {score.answered * 5}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Oswestry Disability Index Questions
const ODI_QUESTIONS = [
  {
    id: 'pain_intensity',
    title: 'Pain Intensity',
    questions: [
      {
        id: 'odi_pain',
        text: 'How would you rate your pain today?',
        options: [
          { value: 0, label: 'I have no pain at the moment' },
          { value: 1, label: 'The pain is very mild at the moment' },
          { value: 2, label: 'The pain is moderate at the moment' },
          { value: 3, label: 'The pain is fairly severe at the moment' },
          { value: 4, label: 'The pain is very severe at the moment' },
          { value: 5, label: 'The pain is the worst imaginable at the moment' },
        ],
      },
    ],
  },
  {
    id: 'personal_care',
    title: 'Personal Care',
    questions: [
      {
        id: 'odi_personal_care',
        text: 'How does your pain affect your personal care (washing, dressing)?',
        options: [
          { value: 0, label: 'I can look after myself normally without causing extra pain' },
          { value: 1, label: 'I can look after myself normally but it causes extra pain' },
          { value: 2, label: 'It is painful to look after myself and I am slow and careful' },
          { value: 3, label: 'I need some help but can manage most of my personal care' },
          { value: 4, label: 'I need help every day in most aspects of self-care' },
          { value: 5, label: 'I do not get dressed, wash with difficulty and stay in bed' },
        ],
      },
    ],
  },
  {
    id: 'lifting',
    title: 'Lifting',
    questions: [
      {
        id: 'odi_lifting',
        text: 'How does your pain affect your ability to lift objects?',
        options: [
          { value: 0, label: 'I can lift heavy weights without extra pain' },
          { value: 1, label: 'I can lift heavy weights but it gives me extra pain' },
          { value: 2, label: 'Pain prevents me lifting heavy weights off the floor' },
          {
            value: 3,
            label:
              'Pain prevents me lifting heavy weights but I can manage if conveniently positioned',
          },
          { value: 4, label: 'I can only lift very light weights' },
          { value: 5, label: 'I cannot lift or carry anything' },
        ],
      },
    ],
  },
  {
    id: 'walking',
    title: 'Walking',
    questions: [
      {
        id: 'odi_walking',
        text: 'How does your pain affect your walking?',
        options: [
          { value: 0, label: 'Pain does not prevent me walking any distance' },
          { value: 1, label: 'Pain prevents me walking more than 1 mile' },
          { value: 2, label: 'Pain prevents me walking more than 1/2 mile' },
          { value: 3, label: 'Pain prevents me walking more than 100 yards' },
          { value: 4, label: 'I can only walk using a stick or crutches' },
          { value: 5, label: 'I am in bed most of the time' },
        ],
      },
    ],
  },
  {
    id: 'sitting',
    title: 'Sitting',
    questions: [
      {
        id: 'odi_sitting',
        text: 'How does your pain affect your sitting?',
        options: [
          { value: 0, label: 'I can sit in any chair as long as I like' },
          { value: 1, label: 'I can only sit in my favorite chair as long as I like' },
          { value: 2, label: 'Pain prevents me sitting more than 1 hour' },
          { value: 3, label: 'Pain prevents me sitting more than 30 minutes' },
          { value: 4, label: 'Pain prevents me sitting more than 10 minutes' },
          { value: 5, label: 'Pain prevents me from sitting at all' },
        ],
      },
    ],
  },
  {
    id: 'standing',
    title: 'Standing',
    questions: [
      {
        id: 'odi_standing',
        text: 'How does your pain affect your standing?',
        options: [
          { value: 0, label: 'I can stand as long as I want without extra pain' },
          { value: 1, label: 'I can stand as long as I want but it gives me extra pain' },
          { value: 2, label: 'Pain prevents me from standing for more than 1 hour' },
          { value: 3, label: 'Pain prevents me from standing for more than 30 minutes' },
          { value: 4, label: 'Pain prevents me from standing for more than 10 minutes' },
          { value: 5, label: 'Pain prevents me from standing at all' },
        ],
      },
    ],
  },
];

// Neck Disability Index Questions
const NDI_QUESTIONS = [
  {
    id: 'ndi_pain',
    title: 'Pain Intensity',
    questions: [
      {
        id: 'ndi_pain_intensity',
        text: 'How would you rate your neck pain today?',
        options: [
          { value: 0, label: 'I have no pain at the moment' },
          { value: 1, label: 'The pain is very mild at the moment' },
          { value: 2, label: 'The pain is moderate at the moment' },
          { value: 3, label: 'The pain is fairly severe at the moment' },
          { value: 4, label: 'The pain is very severe at the moment' },
          { value: 5, label: 'The pain is the worst imaginable at the moment' },
        ],
      },
    ],
  },
  {
    id: 'ndi_personal_care',
    title: 'Personal Care',
    questions: [
      {
        id: 'ndi_personal',
        text: 'How does your neck pain affect your personal care?',
        options: [
          { value: 0, label: 'I can look after myself normally without causing extra pain' },
          { value: 1, label: 'I can look after myself normally but it causes extra pain' },
          { value: 2, label: 'It is painful to look after myself and I am slow and careful' },
          { value: 3, label: 'I need some help but manage most of my personal care' },
          { value: 4, label: 'I need help every day in most aspects of self-care' },
          { value: 5, label: 'I do not get dressed, wash with difficulty and stay in bed' },
        ],
      },
    ],
  },
  {
    id: 'ndi_reading',
    title: 'Reading',
    questions: [
      {
        id: 'ndi_reading_q',
        text: 'How does your neck pain affect reading?',
        options: [
          { value: 0, label: 'I can read as much as I want with no pain in my neck' },
          { value: 1, label: 'I can read as much as I want with slight pain in my neck' },
          { value: 2, label: 'I can read as much as I want with moderate pain in my neck' },
          {
            value: 3,
            label: 'I cannot read as much as I want because of moderate pain in my neck',
          },
          { value: 4, label: 'I can hardly read at all because of severe pain in my neck' },
          { value: 5, label: 'I cannot read at all' },
        ],
      },
    ],
  },
  {
    id: 'ndi_headaches',
    title: 'Headaches',
    questions: [
      {
        id: 'ndi_headache_q',
        text: 'How do headaches affect you?',
        options: [
          { value: 0, label: 'I have no headaches at all' },
          { value: 1, label: 'I have slight headaches which come infrequently' },
          { value: 2, label: 'I have moderate headaches which come infrequently' },
          { value: 3, label: 'I have moderate headaches which come frequently' },
          { value: 4, label: 'I have severe headaches which come frequently' },
          { value: 5, label: 'I have headaches almost all the time' },
        ],
      },
    ],
  },
  {
    id: 'ndi_concentration',
    title: 'Concentration',
    questions: [
      {
        id: 'ndi_concentration_q',
        text: 'How does your neck pain affect concentration?',
        options: [
          { value: 0, label: 'I can concentrate fully when I want with no difficulty' },
          { value: 1, label: 'I can concentrate fully when I want with slight difficulty' },
          { value: 2, label: 'I have a fair degree of difficulty in concentrating when I want' },
          { value: 3, label: 'I have a lot of difficulty in concentrating when I want' },
          { value: 4, label: 'I have a great deal of difficulty in concentrating when I want' },
          { value: 5, label: 'I cannot concentrate at all' },
        ],
      },
    ],
  },
  {
    id: 'ndi_work',
    title: 'Work',
    questions: [
      {
        id: 'ndi_work_q',
        text: 'How does your neck pain affect work?',
        options: [
          { value: 0, label: 'I can do as much work as I want' },
          { value: 1, label: 'I can only do my usual work but no more' },
          { value: 2, label: 'I can do most of my usual work but no more' },
          { value: 3, label: 'I cannot do my usual work' },
          { value: 4, label: 'I can hardly do any work at all' },
          { value: 5, label: 'I cannot do any work at all' },
        ],
      },
    ],
  },
];

// Patient-Specific Functional Scale
const PSFS_QUESTIONS = [
  {
    id: 'psfs_activities',
    title: 'Functional Activities',
    questions: [
      {
        id: 'psfs_activity_1',
        text: 'Rate your ability to perform your most important activity affected by your condition:',
        options: [
          { value: 0, label: 'Unable to perform activity (0)' },
          { value: 1, label: 'Significant difficulty (1-2)' },
          { value: 2, label: 'Moderate difficulty (3-4)' },
          { value: 3, label: 'Mild difficulty (5-6)' },
          { value: 4, label: 'Minimal difficulty (7-8)' },
          { value: 5, label: 'Able to perform at prior level (9-10)' },
        ],
      },
      {
        id: 'psfs_activity_2',
        text: 'Rate your ability to perform your second most important activity:',
        options: [
          { value: 0, label: 'Unable to perform activity (0)' },
          { value: 1, label: 'Significant difficulty (1-2)' },
          { value: 2, label: 'Moderate difficulty (3-4)' },
          { value: 3, label: 'Mild difficulty (5-6)' },
          { value: 4, label: 'Minimal difficulty (7-8)' },
          { value: 5, label: 'Able to perform at prior level (9-10)' },
        ],
      },
      {
        id: 'psfs_activity_3',
        text: 'Rate your ability to perform your third most important activity:',
        options: [
          { value: 0, label: 'Unable to perform activity (0)' },
          { value: 1, label: 'Significant difficulty (1-2)' },
          { value: 2, label: 'Moderate difficulty (3-4)' },
          { value: 3, label: 'Mild difficulty (5-6)' },
          { value: 4, label: 'Minimal difficulty (7-8)' },
          { value: 5, label: 'Able to perform at prior level (9-10)' },
        ],
      },
    ],
  },
];

// Export questionnaire types for external use
export const QUESTIONNAIRE_TYPES = {
  ODI: 'ODI',
  NDI: 'NDI',
  PSFS: 'PSFS',
};
