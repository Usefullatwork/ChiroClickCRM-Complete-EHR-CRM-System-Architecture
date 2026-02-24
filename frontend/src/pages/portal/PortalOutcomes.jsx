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
import { patientPortalAPI } from '../../services/api';
import logger from '../../utils/logger';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

const QUESTIONNAIRE_TYPES = {
  VAS: {
    label: 'Smerteskala (VAS)',
    description: 'Vurder smerteniva pa en skala fra 0-10',
    questions: [
      {
        id: 'pain_now',
        text: 'Hvordan er smerten akkurat na?',
        type: 'scale',
        min: 0,
        max: 10,
        minLabel: 'Ingen smerte',
        maxLabel: 'Verst tenkelig',
      },
      {
        id: 'pain_average',
        text: 'Gjennomsnittlig smerteniva siste uke?',
        type: 'scale',
        min: 0,
        max: 10,
        minLabel: 'Ingen smerte',
        maxLabel: 'Verst tenkelig',
      },
      {
        id: 'pain_worst',
        text: 'Verste smerteniva siste uke?',
        type: 'scale',
        min: 0,
        max: 10,
        minLabel: 'Ingen smerte',
        maxLabel: 'Verst tenkelig',
      },
    ],
  },
  NDI: {
    label: 'Nakkefunksjonsindeks (NDI)',
    description: 'Sporreskjema om nakkeplager og daglig funksjon',
    questions: [
      {
        id: 'pain_intensity',
        text: 'Smerteintensitet',
        type: 'choice',
        options: [
          'Ingen smerter na',
          'Svak smerte na',
          'Moderat smerte na',
          'Ganske sterk smerte',
          'Veldig sterk smerte',
          'Verst tenkelig smerte',
        ],
      },
      {
        id: 'personal_care',
        text: 'Personlig stell (vaske/kle seg)',
        type: 'choice',
        options: [
          'Klarer meg uten ekstra smerte',
          'Klarer meg, men det gir smerte',
          'Smertefull, men klarer mesteparten',
          'Trenger hjelp, klarer noe',
          'Trenger hjelp daglig',
          'Klarer ikke kle pa meg',
        ],
      },
      {
        id: 'lifting',
        text: 'Lofting',
        type: 'choice',
        options: [
          'Kan lofte tunge gjenstander',
          'Kan lofte, men gir ekstra smerte',
          'Smerte begrenser tunge lost',
          'Kan bare lofte lette gjenstander',
          'Kan bare lofte veldig lette ting',
          'Kan ikke lofte noe',
        ],
      },
      {
        id: 'reading',
        text: 'Lesing',
        type: 'choice',
        options: [
          'Kan lese sa mye jeg vil',
          'Kan lese, men gir lett smerte',
          'Kan lese med moderat smerte',
          'Kan ikke lese sa mye pga smerte',
          'Kan knapt lese pga smerte',
          'Kan ikke lese i det hele tatt',
        ],
      },
      {
        id: 'concentration',
        text: 'Konsentrasjon',
        type: 'choice',
        options: [
          'Full konsentrasjon',
          'Lett nedsatt konsentrasjon',
          'Moderat nedsatt',
          'Vanskelig a konsentrere seg',
          'Veldig vanskelig',
          'Kan ikke konsentrere meg',
        ],
      },
    ],
  },
  ODI: {
    label: 'Ryggfunksjonsindeks (ODI)',
    description: 'Sporreskjema om ryggplager og daglig funksjon',
    questions: [
      {
        id: 'pain_intensity',
        text: 'Smerteintensitet',
        type: 'choice',
        options: [
          'Ingen smerte na',
          'Svak smerte na',
          'Moderat smerte na',
          'Ganske sterk smerte',
          'Veldig sterk smerte',
          'Verst tenkelig smerte',
        ],
      },
      {
        id: 'personal_care',
        text: 'Personlig stell',
        type: 'choice',
        options: [
          'Normal uten ekstra smerte',
          'Normal, men smertefull',
          'Smertefull, ma ga sakte',
          'Trenger noe hjelp',
          'Trenger hjelp daglig',
          'Kan ikke kle pa meg',
        ],
      },
      {
        id: 'walking',
        text: 'Ga-funksjon',
        type: 'choice',
        options: [
          'Ubegrenset gangdistanse',
          'Smerte begrenser > 1 km',
          'Smerte begrenser > 500 m',
          'Smerte begrenser > 100 m',
          'Trenger stokk/krykker',
          'Sengeliggende mesteparten',
        ],
      },
      {
        id: 'sitting',
        text: 'Sitting',
        type: 'choice',
        options: [
          'Kan sitte sa lenge jeg vil',
          'Kan sitte sa lenge, men med smerte',
          'Smerte begrenser > 1 time',
          'Smerte begrenser > 30 min',
          'Smerte begrenser > 10 min',
          'Kan ikke sitte pga smerte',
        ],
      },
      {
        id: 'sleeping',
        text: 'Sovn',
        type: 'choice',
        options: [
          'Ingen sovnproblemer',
          'Lett forstyrret sovn',
          'Moderat forstyrret sovn',
          'Sovn forstyrret > halvparten',
          'Sover < 2 timer',
          'Kan ikke sove pga smerte',
        ],
      },
    ],
  },
};

export default function PortalOutcomes() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [pastResults, setPastResults] = useState([]);
  const [error, setError] = useState(null);
  const [activeQuestionnaire, setActiveQuestionnaire] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Pending questionnaires (could come from backend, static for now)
  const pendingTypes = useMemo(() => ['VAS', 'NDI', 'ODI'], []);

  useEffect(() => {
    loadPastResults();
  }, []);

  const loadPastResults = async () => {
    try {
      setLoading(true);
      // Try to fetch past results from the portal profile endpoint
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
    if (!activeQuestionnaire) return;

    try {
      setSubmitting(true);
      const questionnaire = QUESTIONNAIRE_TYPES[activeQuestionnaire];

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

      // Add to local past results
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
      setError('Kunne ikke sende skjemaet. Prov igjen.');
    } finally {
      setSubmitting(false);
    }
  };

  const questionnaire = activeQuestionnaire ? QUESTIONNAIRE_TYPES[activeQuestionnaire] : null;
  const allAnswered = questionnaire
    ? questionnaire.questions.every((q) => answers[q.id] !== undefined)
    : false;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
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
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="font-bold text-gray-900">
            {activeQuestionnaire ? questionnaire?.label : 'Sporreskjemaer'}
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
            <p className="text-sm text-gray-600 px-1">{questionnaire.description}</p>

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
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-1 px-1">
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
                  Sender...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send svar
                </>
              )}
            </button>
          </div>
        )}

        {/* Submitted confirmation */}
        {submitted && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Takk!</h2>
            <p className="text-gray-600 mb-6">Svarene dine er registrert.</p>
            <button
              onClick={() => {
                setActiveQuestionnaire(null);
                setSubmitted(false);
              }}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Tilbake til oversikt
            </button>
          </div>
        )}

        {/* Questionnaire list (when no active form) */}
        {!activeQuestionnaire && (
          <>
            <h2 className="text-sm font-medium text-gray-500 px-1">Tilgjengelige skjemaer</h2>
            {pendingTypes.map((type) => {
              const qt = QUESTIONNAIRE_TYPES[type];
              if (!qt) return null;
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
                    <p className="text-sm text-gray-500">{qt.description}</p>
                  </div>
                </button>
              );
            })}

            {/* Past results */}
            {pastResults.length > 0 && (
              <div className="mt-6">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 px-1 mb-3"
                >
                  <TrendingUp className="w-4 h-4" />
                  {showHistory ? (
                    <>
                      <ChevronUp className="w-4 h-4" /> Skjul
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" /> Vis
                    </>
                  )}{' '}
                  tidligere resultater ({pastResults.length})
                </button>
                {showHistory && (
                  <div className="space-y-2">
                    {pastResults.map((result, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-xl border border-gray-100 p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-700">
                              {result.label ||
                                QUESTIONNAIRE_TYPES[result.type]?.label ||
                                result.type}
                            </p>
                            <p className="text-xs text-gray-500">
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

      <footer className="max-w-2xl mx-auto px-4 py-8 text-center text-sm text-gray-400">
        <p>Dine svar er konfidensielle og deles kun med din behandler</p>
      </footer>
    </div>
  );
}
