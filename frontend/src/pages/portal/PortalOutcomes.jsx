/**
 * Portal Outcomes - Questionnaire filling for patients
 * List pending questionnaires, fill forms, view past results
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Send,
} from 'lucide-react';
import { useTranslation } from '../../i18n';
import logger from '../../utils/logger';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

function getQuestionnaireTypes(t) {
  return {
    VAS: {
      label: t('vasLabel'),
      description: t('vasDescription'),
      questions: [
        {
          id: 'pain_now',
          text: t('vasPainNowQ'),
          type: 'scale',
          min: 0,
          max: 10,
          minLabel: t('scaleNoPain'),
          maxLabel: t('scaleWorstPain'),
        },
        {
          id: 'pain_average',
          text: t('vasPainAverage'),
          type: 'scale',
          min: 0,
          max: 10,
          minLabel: t('scaleNoPain'),
          maxLabel: t('scaleWorstPain'),
        },
        {
          id: 'pain_worst',
          text: t('vasPainWorst'),
          type: 'scale',
          min: 0,
          max: 10,
          minLabel: t('scaleNoPain'),
          maxLabel: t('scaleWorstPain'),
        },
      ],
    },
    NDI: {
      label: t('ndiLabel'),
      description: t('ndiDescription'),
      questions: [
        {
          id: 'pain_intensity',
          text: t('ndiPainIntensity'),
          type: 'choice',
          options: [
            t('ndiPainOpt0'),
            t('ndiPainOpt1'),
            t('ndiPainOpt2'),
            t('ndiPainOpt3'),
            t('ndiPainOpt4'),
            t('ndiPainOpt5'),
          ],
        },
        {
          id: 'personal_care',
          text: t('ndiPersonalCare'),
          type: 'choice',
          options: [
            t('ndiCareOpt0'),
            t('ndiCareOpt1'),
            t('ndiCareOpt2'),
            t('ndiCareOpt3'),
            t('ndiCareOpt4'),
            t('ndiCareOpt5'),
          ],
        },
        {
          id: 'lifting',
          text: t('ndiLifting'),
          type: 'choice',
          options: [
            t('ndiLiftOpt0'),
            t('ndiLiftOpt1'),
            t('ndiLiftOpt2'),
            t('ndiLiftOpt3'),
            t('ndiLiftOpt4'),
            t('ndiLiftOpt5'),
          ],
        },
        {
          id: 'reading',
          text: t('ndiReading'),
          type: 'choice',
          options: [
            t('ndiReadOpt0'),
            t('ndiReadOpt1'),
            t('ndiReadOpt2'),
            t('ndiReadOpt3'),
            t('ndiReadOpt4'),
            t('ndiReadOpt5'),
          ],
        },
        {
          id: 'concentration',
          text: t('ndiConcentration'),
          type: 'choice',
          options: [
            t('ndiConcOpt0'),
            t('ndiConcOpt1'),
            t('ndiConcOpt2'),
            t('ndiConcOpt3'),
            t('ndiConcOpt4'),
            t('ndiConcOpt5'),
          ],
        },
      ],
    },
    ODI: {
      label: t('odiLabel'),
      description: t('odiDescription'),
      questions: [
        {
          id: 'pain_intensity',
          text: t('odiPainIntensity'),
          type: 'choice',
          options: [
            t('odiPainOpt0'),
            t('odiPainOpt1'),
            t('odiPainOpt2'),
            t('odiPainOpt3'),
            t('odiPainOpt4'),
            t('odiPainOpt5'),
          ],
        },
        {
          id: 'personal_care',
          text: t('odiPersonalCare'),
          type: 'choice',
          options: [
            t('odiCareOpt0'),
            t('odiCareOpt1'),
            t('odiCareOpt2'),
            t('odiCareOpt3'),
            t('odiCareOpt4'),
            t('odiCareOpt5'),
          ],
        },
        {
          id: 'walking',
          text: t('odiWalking'),
          type: 'choice',
          options: [
            t('odiWalkOpt0'),
            t('odiWalkOpt1'),
            t('odiWalkOpt2'),
            t('odiWalkOpt3'),
            t('odiWalkOpt4'),
            t('odiWalkOpt5'),
          ],
        },
        {
          id: 'sitting',
          text: t('odiSitting'),
          type: 'choice',
          options: [
            t('odiSitOpt0'),
            t('odiSitOpt1'),
            t('odiSitOpt2'),
            t('odiSitOpt3'),
            t('odiSitOpt4'),
            t('odiSitOpt5'),
          ],
        },
        {
          id: 'sleeping',
          text: t('odiSleeping'),
          type: 'choice',
          options: [
            t('odiSleepOpt0'),
            t('odiSleepOpt1'),
            t('odiSleepOpt2'),
            t('odiSleepOpt3'),
            t('odiSleepOpt4'),
            t('odiSleepOpt5'),
          ],
        },
      ],
    },
  };
}

export default function PortalOutcomes() {
  const navigate = useNavigate();
  const { t } = useTranslation('clinical');
  const { t: tPortal } = useTranslation('portal');
  const [loading, setLoading] = useState(true);
  const [pastResults, setPastResults] = useState([]);
  const [error, setError] = useState(null);
  const [activeQuestionnaire, setActiveQuestionnaire] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const questionnaireTypes = useMemo(() => getQuestionnaireTypes(t), [t]);

  const pendingTypes = useMemo(() => ['VAS', 'NDI', 'ODI'], []);

  useEffect(() => {
    loadPastResults();
  }, []);

  const loadPastResults = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/patient-portal/outcomes`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setPastResults(data.outcomes || []);
      }
    } catch (err) {
      logger.error('Failed to load past outcomes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuestionnaire = (type) => {
    setActiveQuestionnaire(type);
    setAnswers({});
    setSubmitted(false);
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    if (!activeQuestionnaire) {
      return;
    }

    try {
      setSubmitting(true);
      const questionnaire = questionnaireTypes[activeQuestionnaire];

      await fetch(`${API_URL}/patient-portal/outcomes`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: activeQuestionnaire,
          answers,
          completedAt: new Date().toISOString(),
        }),
      });

      setSubmitted(true);

      setPastResults((prev) => [
        {
          type: activeQuestionnaire,
          label: questionnaire.label,
          answers,
          completed_at: new Date().toISOString(),
        },
        ...prev,
      ]);
    } catch (err) {
      logger.error('Failed to submit questionnaire:', err);
      setError(t('questionnaireCouldNotSend'));
    } finally {
      setSubmitting(false);
    }
  };

  const questionnaire = activeQuestionnaire ? questionnaireTypes[activeQuestionnaire] : null;
  const allAnswered = questionnaire
    ? questionnaire.questions.every((q) => answers[q.id] !== undefined)
    : false;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => {
              if (activeQuestionnaire && !submitted) {
                setActiveQuestionnaire(null);
              } else {
                navigate('/portal');
              }
            }}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <h1 className="font-bold text-gray-900">
            {activeQuestionnaire ? questionnaire?.label : t('questionnaireTitle')}
          </h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl border border-red-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Questionnaire form */}
        {activeQuestionnaire && !submitted && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300 px-1">
              {questionnaire.description}
            </p>

            {questionnaire.questions.map((q, idx) => (
              <div key={q.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <p className="font-medium text-gray-900 mb-3">
                  {idx + 1}. {q.text}
                </p>

                {q.type === 'scale' && (
                  <div>
                    <div className="flex gap-1 justify-between">
                      {Array.from({ length: q.max - q.min + 1 }, (_, i) => q.min + i).map((val) => (
                        <button
                          key={val}
                          onClick={() => handleAnswerChange(q.id, val)}
                          className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                            answers[q.id] === val
                              ? val <= 3
                                ? 'bg-green-500 text-white'
                                : val <= 6
                                  ? 'bg-yellow-500 text-white'
                                  : 'bg-red-500 text-white'
                              : 'bg-gray-100 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 dark:text-gray-300 mt-1 px-1">
                      <span>{q.minLabel}</span>
                      <span>{q.maxLabel}</span>
                    </div>
                  </div>
                )}

                {q.type === 'choice' && (
                  <div className="space-y-2">
                    {q.options.map((opt, optIdx) => (
                      <button
                        key={optIdx}
                        onClick={() => handleAnswerChange(q.id, optIdx)}
                        className={`w-full text-left p-3 rounded-lg border text-sm transition-all ${
                          answers[q.id] === optIdx
                            ? 'border-purple-500 bg-purple-50 text-purple-800'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <button
              onClick={handleSubmit}
              disabled={!allAnswered || submitting}
              className="w-full py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('questionnaireSending')}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  {t('questionnaireSendAnswers')}
                </>
              )}
            </button>
          </div>
        )}

        {/* Submitted confirmation */}
        {submitted && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">{t('questionnaireThankYou')}</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {t('questionnaireAnswersRecorded')}
            </p>
            <button
              onClick={() => {
                setActiveQuestionnaire(null);
                setSubmitted(false);
              }}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              {t('questionnaireBackToOverview')}
            </button>
          </div>
        )}

        {/* Questionnaire list (when no active form) */}
        {!activeQuestionnaire && (
          <>
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 px-1">
              {t('availableForms')}
            </h2>
            {pendingTypes.map((type) => {
              const qt = questionnaireTypes[type];
              if (!qt) {
                return null;
              }
              return (
                <button
                  key={type}
                  onClick={() => handleStartQuestionnaire(type)}
                  className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <ClipboardList className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{qt.label}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{qt.description}</p>
                  </div>
                </button>
              );
            })}

            {/* Past results */}
            {pastResults.length > 0 && (
              <div className="mt-6">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 px-1 mb-3"
                >
                  <TrendingUp className="w-4 h-4" />
                  {showHistory ? (
                    <>
                      <ChevronUp className="w-4 h-4" /> {t('questionnaireHidePast')}
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" /> {t('questionnaireShowPast')}
                    </>
                  )}{' '}
                  {t('questionnairePastResults')} ({pastResults.length})
                </button>
                {showHistory && (
                  <div className="space-y-2">
                    {pastResults.map((result, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-xl border border-gray-100 p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-700">
                              {result.label ||
                                questionnaireTypes[result.type]?.label ||
                                result.type}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(result.completed_at).toLocaleDateString('nb-NO', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </p>
                          </div>
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <footer className="max-w-2xl mx-auto px-4 py-8 text-center text-sm text-gray-400 dark:text-gray-300">
        <p>{tPortal('confidentialityNotice')}</p>
      </footer>
    </div>
  );
}
