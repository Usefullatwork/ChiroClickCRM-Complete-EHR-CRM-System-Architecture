/**
 * Patient Portal - Exercise View
 *
 * Public-facing page for patients to:
 * - View their assigned exercises with videos/images
 * - Mark daily compliance
 * - Rate exercise effectiveness
 * - View progress over time
 * - Download PDF handout
 *
 * Authentication: PIN or magic link
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from '../../i18n';
import logger from '../../utils/logger';
import {
  Play,
  Check,
  Calendar,
  Download,
  Star,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Loader2,
  Activity,
  TrendingUp,
  Dumbbell,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

const PinEntry = ({ onSubmit, error, isLoading, t }) => {
  const [pin, setPin] = useState(['', '', '', '']);
  const inputRefs = [React.useRef(), React.useRef(), React.useRef(), React.useRef()];

  const handlePinChange = (index, value) => {
    if (!/^\d*$/.test(value)) {
      return;
    }

    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);

    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }

    if (index === 3 && value) {
      const fullPin = newPin.join('');
      if (fullPin.length === 4) {
        onSubmit(fullPin);
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Dumbbell className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">{t('portalMyExercises')}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">{t('portalEnterCode')}</p>
        </div>

        <div className="flex justify-center gap-3 mb-6">
          {pin.map((digit, index) => (
            <input
              key={`pin-${index}`}
              ref={inputRefs[index]}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handlePinChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-14 h-16 text-center text-2xl font-bold border-2 border-slate-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
              disabled={isLoading}
            />
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg mb-4">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center gap-2 text-green-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>{t('portalLoadingExercises')}</span>
          </div>
        )}

        <p className="text-center text-xs text-slate-400 dark:text-slate-300 mt-6">
          {t('portalCodeFromPractitioner')}
        </p>
      </div>
    </div>
  );
};

const ExerciseCard = ({
  prescription,
  onLogCompliance,
  onRate,
  todayCompleted,
  t,
  frequencyLabels,
  bodyRegionLabels,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [_showRating, _setShowRating] = useState(false);
  const [painLevel, setPainLevel] = useState(0);
  const [notes, setNotes] = useState('');

  const compliancePercent = useMemo(() => {
    if (!prescription.compliance_log) {
      return 0;
    }
    const entries = Object.values(prescription.compliance_log);
    if (entries.length === 0) {
      return 0;
    }
    const completed = entries.filter((e) => e.completed).length;
    return Math.round((completed / entries.length) * 100);
  }, [prescription.compliance_log]);

  const handleComplete = async () => {
    await onLogCompliance(prescription.id, {
      completed: true,
      pain_level: painLevel || null,
      notes: notes || null,
    });
    setPainLevel(0);
    setNotes('');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Thumbnail */}
          <div className="w-20 h-20 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden">
            {prescription.thumbnail_url || prescription.image_url ? (
              <img
                src={prescription.thumbnail_url || prescription.image_url}
                alt={prescription.exercise_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Dumbbell className="w-8 h-8 text-slate-300" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-800 text-lg">{prescription.exercise_name}</h3>
            <div className="flex flex-wrap gap-2 mt-1">
              {prescription.body_region && (
                <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 dark:text-slate-300 rounded-full">
                  {bodyRegionLabels[prescription.body_region] || prescription.body_region}
                </span>
              )}
            </div>
            <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              <span className="font-medium text-slate-700">
                {prescription.sets || 3} x {prescription.reps || 10}
              </span>
              {prescription.hold_seconds && <span> &bull; Hold {prescription.hold_seconds}s</span>}
              <span>
                {' '}
                &bull; {frequencyLabels[prescription.frequency] || prescription.frequency}
              </span>
            </div>
          </div>

          {/* Completion status */}
          <div className="flex-shrink-0">
            {todayCompleted ? (
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="w-6 h-6 text-green-600" />
              </div>
            ) : (
              <button
                onClick={handleComplete}
                className="w-12 h-12 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition-colors shadow-lg shadow-green-200"
              >
                <Check className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>{t('portalCompletion')}</span>
            <span>{compliancePercent}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-500"
              style={{ width: `${compliancePercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Expand/collapse button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-2 bg-slate-50 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 flex items-center justify-center gap-1 transition-colors"
      >
        {expanded ? (
          <>
            <ChevronUp className="w-4 h-4" />
            {t('portalHideDetails')}
          </>
        ) : (
          <>
            <ChevronDown className="w-4 h-4" />
            {t('portalShowInstructions')}
          </>
        )}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          {/* Instructions */}
          {prescription.exercise_instructions && (
            <div className="mb-4">
              <h4 className="font-medium text-slate-700 mb-2">{t('portalInstructions')}</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {prescription.exercise_instructions}
              </p>
            </div>
          )}

          {/* Custom instructions from practitioner */}
          {prescription.custom_instructions && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-1">{t('portalFromPractitioner')}</h4>
              <p className="text-sm text-blue-700">{prescription.custom_instructions}</p>
            </div>
          )}

          {/* Video link */}
          {prescription.video_url && (
            <a
              href={prescription.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors mb-4"
            >
              <Play className="w-4 h-4" />
              {t('portalWatchVideo')}
              <ExternalLink className="w-3 h-3" />
            </a>
          )}

          {/* Pain level input */}
          <div className="mb-4">
            <h4 className="font-medium text-slate-700 mb-2">{t('portalPainDuringExercise')}</h4>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                <button
                  key={level}
                  onClick={() => setPainLevel(level)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                    painLevel === level
                      ? level <= 3
                        ? 'bg-green-500 text-white'
                        : level <= 6
                          ? 'bg-yellow-500 text-white'
                          : 'bg-red-500 text-white'
                      : 'bg-slate-100 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-slate-400 dark:text-slate-300 mt-1">
              <span>{t('portalNoPain')}</span>
              <span>{t('portalWorstPain')}</span>
            </div>
          </div>

          {/* Notes */}
          <div className="mb-4">
            <h4 className="font-medium text-slate-700 mb-2">{t('portalNotesOptional')}</h4>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('portalHowDidItFeel')}
              className="w-full p-3 border border-slate-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              rows={2}
            />
          </div>

          {/* Rating */}
          <div className="mb-4">
            <h4 className="font-medium text-slate-700 mb-2">{t('portalHowUseful')}</h4>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => onRate(prescription.id, star)}
                  className="p-1"
                  aria-label={`${star} av 5 stjerner`}
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      (prescription.patient_rating || 0) >= star
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-slate-300 hover:text-yellow-300'
                    }`}
                    aria-hidden="true"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Complete button */}
          {!todayCompleted && (
            <button
              onClick={handleComplete}
              className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              {t('portalMarkCompleted')}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const PatientExercises = () => {
  const { patientId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { t } = useTranslation('exercises');

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [patientInfo, setPatientInfo] = useState(null);

  const FREQUENCY_LABELS = useMemo(
    () => ({
      daily: t('portalFreqDaily'),
      '2x_daily': t('portalFreq2xDaily'),
      '3x_week': t('portalFreq3xWeek'),
      weekly: t('portalFreqWeekly'),
    }),
    [t]
  );

  const BODY_REGION_LABELS = useMemo(
    () => ({
      cervical: t('portalRegionCervical'),
      thoracic: t('portalRegionThoracic'),
      lumbar: t('portalRegionLumbar'),
      shoulder: t('portalRegionShoulder'),
      hip: t('portalRegionHip'),
      knee: t('portalRegionKnee'),
      ankle: t('portalRegionAnkle'),
      core: t('portalRegionCore'),
      full_body: t('portalRegionFullBody'),
      upper_extremity: t('portalRegionUpperExtremity'),
      lower_extremity: t('portalRegionLowerExtremity'),
    }),
    [t]
  );

  useEffect(() => {
    if (token) {
      validateToken(token);
    }
  }, [token]);

  const validateToken = async (magicToken) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/patient-portal/validate-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: magicToken }),
      });

      if (!response.ok) {
        throw new Error(t('portalInvalidLink'));
      }

      const data = await response.json();
      setPatientInfo(data.patient);
      await loadExercises(data.patient.id, data.sessionToken);
      setIsAuthenticated(true);
    } catch (err) {
      setError(err.message || t('portalCouldNotValidate'));
    } finally {
      setIsLoading(false);
    }
  };

  const validatePin = async (pin) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/patient-portal/validate-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, pin }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || t('portalWrongCode'));
      }

      const data = await response.json();
      setPatientInfo(data.patient);
      localStorage.setItem('portal_session', data.sessionToken);
      await loadExercises(patientId, data.sessionToken);
      setIsAuthenticated(true);
    } catch (err) {
      setError(err.message || t('portalCouldNotLogin'));
    } finally {
      setIsLoading(false);
    }
  };

  const loadExercises = async (pId, sessionToken) => {
    try {
      const response = await fetch(`${API_URL}/patient-portal/exercises?patientId=${pId}`, {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(t('portalCouldNotLoadExercises'));
      }

      const data = await response.json();
      setPrescriptions(data.data || []);
    } catch (err) {
      logger.error('Failed to load exercises:', err);
      setError(err.message);
    }
  };

  const handleLogCompliance = async (prescriptionId, complianceData) => {
    const sessionToken = localStorage.getItem('portal_session');
    try {
      const response = await fetch(`${API_URL}/patient-portal/compliance`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prescriptionId,
          ...complianceData,
          date: new Date().toISOString().split('T')[0],
        }),
      });

      if (!response.ok) {
        throw new Error(t('portalCouldNotSave'));
      }

      setPrescriptions((prev) =>
        prev.map((p) => {
          if (p.id === prescriptionId) {
            const today = new Date().toISOString().split('T')[0];
            return {
              ...p,
              compliance_log: {
                ...p.compliance_log,
                [today]: complianceData,
              },
            };
          }
          return p;
        })
      );
    } catch (err) {
      logger.error('Failed to log compliance:', err);
      setError(t('portalCouldNotSaveCompliance'));
    }
  };

  const handleRate = async (prescriptionId, rating) => {
    const sessionToken = localStorage.getItem('portal_session');
    try {
      await fetch(`${API_URL}/patient-portal/rate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prescriptionId, rating }),
      });

      setPrescriptions((prev) =>
        prev.map((p) => (p.id === prescriptionId ? { ...p, patient_rating: rating } : p))
      );
    } catch (err) {
      logger.error('Failed to rate exercise:', err);
    }
  };

  const handleDownloadPDF = async () => {
    const sessionToken = localStorage.getItem('portal_session');
    try {
      const response = await fetch(
        `${API_URL}/patient-portal/exercises/pdf?patientId=${patientInfo?.id || patientId}`,
        {
          headers: {
            Authorization: `Bearer ${sessionToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(t('portalCouldNotDownloadPDF'));
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mine-ovelser-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      logger.error('Failed to download PDF:', err);
      setError(t('portalCouldNotDownloadPDF'));
    }
  };

  const isCompletedToday = (prescription) => {
    if (!prescription.compliance_log) {
      return false;
    }
    const today = new Date().toISOString().split('T')[0];
    return prescription.compliance_log[today]?.completed === true;
  };

  const overallCompliance = useMemo(() => {
    if (prescriptions.length === 0) {
      return 0;
    }
    let total = 0;
    let completed = 0;
    prescriptions.forEach((p) => {
      const entries = Object.values(p.compliance_log || {});
      total += entries.length;
      completed += entries.filter((e) => e.completed).length;
    });
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }, [prescriptions]);

  if (!isAuthenticated && !token) {
    return <PinEntry onSubmit={validatePin} error={error} isLoading={isLoading} t={t} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-green-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-300">{t('portalLoadingExercises')}</p>
        </div>
      </div>
    );
  }

  if (error && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-800 mb-2">{t('portalSomethingWentWrong')}</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            {t('portalTryAgain')}
          </button>
        </div>
      </div>
    );
  }

  const totalExercises = prescriptions.length;
  const completedToday = prescriptions.filter(isCompletedToday).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h1 className="font-bold text-slate-800">{t('portalMyExercises')}</h1>
                {patientInfo && (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {t('portalGreeting').replace('{name}', patientInfo.first_name)}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">{t('portalDownload')}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Stats cards */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs mb-1">
              <Activity className="w-3.5 h-3.5" />
              {t('portalToday')}
            </div>
            <div className="text-2xl font-bold text-slate-800">
              {completedToday}/{totalExercises}
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs mb-1">
              <TrendingUp className="w-3.5 h-3.5" />
              {t('portalTotal')}
            </div>
            <div className="text-2xl font-bold text-green-600">{overallCompliance}%</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs mb-1">
              <Calendar className="w-3.5 h-3.5" />
              {t('portalExercisesCount')}
            </div>
            <div className="text-2xl font-bold text-slate-800">{totalExercises}</div>
          </div>
        </div>

        {/* Encouragement message */}
        {completedToday === totalExercises && totalExercises > 0 && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl p-4 mb-6 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Check className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold">{t('portalGreatJob')}</h3>
                <p className="text-sm text-green-100">{t('portalAllCompletedToday')}</p>
              </div>
            </div>
          </div>
        )}

        {/* Exercise list */}
        <div className="space-y-4">
          {prescriptions.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center shadow-sm">
              <Dumbbell className="w-16 h-16 text-slate-200 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-700">{t('portalNoExercisesYet')}</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-2">
                {t('portalPractitionerNotAdded')}
              </p>
            </div>
          ) : (
            prescriptions.map((prescription) => (
              <ExerciseCard
                key={prescription.id}
                prescription={prescription}
                onLogCompliance={handleLogCompliance}
                onRate={handleRate}
                todayCompleted={isCompletedToday(prescription)}
                t={t}
                frequencyLabels={FREQUENCY_LABELS}
                bodyRegionLabels={BODY_REGION_LABELS}
              />
            ))
          )}
        </div>

        {/* Refresh button */}
        <div className="mt-6 text-center">
          <button
            onClick={() =>
              loadExercises(patientInfo?.id || patientId, localStorage.getItem('portal_session'))
            }
            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            {t('portalRefresh')}
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="max-w-2xl mx-auto px-4 py-8 text-center text-sm text-slate-400 dark:text-slate-300">
        <p>{t('portalFooterContact')}</p>
        <p className="mt-1">{t('portalFooterBrand')}</p>
      </footer>
    </div>
  );
};

export default PatientExercises;
