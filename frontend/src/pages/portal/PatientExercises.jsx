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
 * Authentication: PIN or magic link (no Clerk required)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  Play,
  Check,
  X,
  Calendar,
  Clock,
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
  ExternalLink
} from 'lucide-react';

// API base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

// Norwegian labels
const FREQUENCY_LABELS = {
  daily: 'Daglig',
  '2x_daily': '2 ganger daglig',
  '3x_week': '3 ganger per uke',
  weekly: 'Ukentlig'
};

const BODY_REGION_LABELS = {
  cervical: 'Nakke',
  thoracic: 'Brystsøyle',
  lumbar: 'Korsrygg',
  shoulder: 'Skulder',
  hip: 'Hofte',
  knee: 'Kne',
  ankle: 'Ankel',
  core: 'Kjerne',
  full_body: 'Helkropp',
  upper_extremity: 'Overekstremitet',
  lower_extremity: 'Underekstremitet'
};

/**
 * PIN Entry Component
 */
const PinEntry = ({ onSubmit, error, isLoading }) => {
  const [pin, setPin] = useState(['', '', '', '']);
  const inputRefs = [React.useRef(), React.useRef(), React.useRef(), React.useRef()];

  const handlePinChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }

    // Auto-submit when complete
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Dumbbell className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Mine øvelser</h1>
          <p className="text-slate-500 mt-2">Skriv inn din 4-sifrede kode for å se øvelsene dine</p>
        </div>

        <div className="flex justify-center gap-3 mb-6">
          {pin.map((digit, index) => (
            <input
              key={index}
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
            <span>Laster øvelser...</span>
          </div>
        )}

        <p className="text-center text-xs text-slate-400 mt-6">
          Du finner koden din på utskriften fra kiropraktoren din
        </p>
      </div>
    </div>
  );
};

/**
 * Exercise Card Component
 */
const ExerciseCard = ({ prescription, onLogCompliance, onRate, todayCompleted }) => {
  const [expanded, setExpanded] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [painLevel, setPainLevel] = useState(0);
  const [notes, setNotes] = useState('');

  const compliancePercent = useMemo(() => {
    if (!prescription.compliance_log) return 0;
    const entries = Object.values(prescription.compliance_log);
    if (entries.length === 0) return 0;
    const completed = entries.filter(e => e.completed).length;
    return Math.round((completed / entries.length) * 100);
  }, [prescription.compliance_log]);

  const handleComplete = async () => {
    await onLogCompliance(prescription.id, {
      completed: true,
      pain_level: painLevel || null,
      notes: notes || null
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
            <h3 className="font-semibold text-slate-800 text-lg">
              {prescription.exercise_name}
            </h3>
            <div className="flex flex-wrap gap-2 mt-1">
              {prescription.body_region && (
                <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                  {BODY_REGION_LABELS[prescription.body_region] || prescription.body_region}
                </span>
              )}
            </div>
            <div className="mt-2 text-sm text-slate-500">
              <span className="font-medium text-slate-700">
                {prescription.sets || 3} x {prescription.reps || 10}
              </span>
              {prescription.hold_seconds && (
                <span> &bull; Hold {prescription.hold_seconds}s</span>
              )}
              <span> &bull; {FREQUENCY_LABELS[prescription.frequency] || prescription.frequency}</span>
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
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Gjennomføring</span>
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
        className="w-full px-4 py-2 bg-slate-50 text-sm text-slate-600 hover:bg-slate-100 flex items-center justify-center gap-1 transition-colors"
      >
        {expanded ? (
          <>
            <ChevronUp className="w-4 h-4" />
            Skjul detaljer
          </>
        ) : (
          <>
            <ChevronDown className="w-4 h-4" />
            Vis instruksjoner
          </>
        )}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          {/* Instructions */}
          {prescription.exercise_instructions && (
            <div className="mb-4">
              <h4 className="font-medium text-slate-700 mb-2">Instruksjoner</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                {prescription.exercise_instructions}
              </p>
            </div>
          )}

          {/* Custom instructions from practitioner */}
          {prescription.custom_instructions && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-1">Fra din behandler</h4>
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
              Se video
              <ExternalLink className="w-3 h-3" />
            </a>
          )}

          {/* Pain level input */}
          <div className="mb-4">
            <h4 className="font-medium text-slate-700 mb-2">Smertenivå under øvelsen</h4>
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
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>Ingen smerte</span>
              <span>Verst tenkelig</span>
            </div>
          </div>

          {/* Notes */}
          <div className="mb-4">
            <h4 className="font-medium text-slate-700 mb-2">Notater (valgfritt)</h4>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Hvordan føltes øvelsen i dag?"
              className="w-full p-3 border border-slate-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              rows={2}
            />
          </div>

          {/* Rating */}
          <div className="mb-4">
            <h4 className="font-medium text-slate-700 mb-2">Hvor nyttig er denne øvelsen?</h4>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => onRate(prescription.id, star)}
                  className="p-1"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      (prescription.patient_rating || 0) >= star
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-slate-300 hover:text-yellow-300'
                    }`}
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
              Merk som gjennomført i dag
            </button>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Main Patient Exercises Portal Component
 */
const PatientExercises = () => {
  const { patientId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token'); // Magic link token

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [patientInfo, setPatientInfo] = useState(null);

  // Check for magic link token on mount
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
        body: JSON.stringify({ token: magicToken })
      });

      if (!response.ok) {
        throw new Error('Ugyldig eller utløpt lenke');
      }

      const data = await response.json();
      setPatientInfo(data.patient);
      await loadExercises(data.patient.id, data.sessionToken);
      setIsAuthenticated(true);
    } catch (err) {
      setError(err.message || 'Kunne ikke validere tilgang');
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
        body: JSON.stringify({ patientId, pin })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Feil kode');
      }

      const data = await response.json();
      setPatientInfo(data.patient);
      localStorage.setItem('portal_session', data.sessionToken);
      await loadExercises(patientId, data.sessionToken);
      setIsAuthenticated(true);
    } catch (err) {
      setError(err.message || 'Kunne ikke logge inn');
    } finally {
      setIsLoading(false);
    }
  };

  const loadExercises = async (pId, sessionToken) => {
    try {
      const response = await fetch(`${API_URL}/patient-portal/exercises?patientId=${pId}`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Kunne ikke laste øvelser');
      }

      const data = await response.json();
      setPrescriptions(data.data || []);
    } catch (err) {
      console.error('Failed to load exercises:', err);
      setError(err.message);
    }
  };

  const handleLogCompliance = async (prescriptionId, complianceData) => {
    const sessionToken = localStorage.getItem('portal_session');
    try {
      const response = await fetch(`${API_URL}/patient-portal/compliance`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prescriptionId,
          ...complianceData,
          date: new Date().toISOString().split('T')[0]
        })
      });

      if (!response.ok) {
        throw new Error('Kunne ikke lagre');
      }

      // Update local state
      setPrescriptions(prev =>
        prev.map(p => {
          if (p.id === prescriptionId) {
            const today = new Date().toISOString().split('T')[0];
            return {
              ...p,
              compliance_log: {
                ...p.compliance_log,
                [today]: complianceData
              }
            };
          }
          return p;
        })
      );
    } catch (err) {
      console.error('Failed to log compliance:', err);
      setError('Kunne ikke lagre gjennomføring');
    }
  };

  const handleRate = async (prescriptionId, rating) => {
    const sessionToken = localStorage.getItem('portal_session');
    try {
      await fetch(`${API_URL}/patient-portal/rate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prescriptionId, rating })
      });

      // Update local state
      setPrescriptions(prev =>
        prev.map(p =>
          p.id === prescriptionId ? { ...p, patient_rating: rating } : p
        )
      );
    } catch (err) {
      console.error('Failed to rate exercise:', err);
    }
  };

  const handleDownloadPDF = async () => {
    const sessionToken = localStorage.getItem('portal_session');
    try {
      const response = await fetch(
        `${API_URL}/patient-portal/exercises/pdf?patientId=${patientInfo?.id || patientId}`,
        {
          headers: {
            'Authorization': `Bearer ${sessionToken}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Kunne ikke laste ned');
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
      console.error('Failed to download PDF:', err);
      setError('Kunne ikke laste ned PDF');
    }
  };

  // Check if exercise was completed today
  const isCompletedToday = (prescription) => {
    if (!prescription.compliance_log) return false;
    const today = new Date().toISOString().split('T')[0];
    return prescription.compliance_log[today]?.completed === true;
  };

  // Show PIN entry if not authenticated
  if (!isAuthenticated && !token) {
    return (
      <PinEntry
        onSubmit={validatePin}
        error={error}
        isLoading={isLoading}
      />
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-green-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Laster øvelser...</p>
        </div>
      </div>
    );
  }

  // Error state (for token validation)
  if (error && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-800 mb-2">Noe gikk galt</h1>
          <p className="text-slate-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            Prøv igjen
          </button>
        </div>
      </div>
    );
  }

  // Calculate stats
  const totalExercises = prescriptions.length;
  const completedToday = prescriptions.filter(isCompletedToday).length;
  const overallCompliance = useMemo(() => {
    if (prescriptions.length === 0) return 0;
    let total = 0;
    let completed = 0;
    prescriptions.forEach(p => {
      const entries = Object.values(p.compliance_log || {});
      total += entries.length;
      completed += entries.filter(e => e.completed).length;
    });
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }, [prescriptions]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h1 className="font-bold text-slate-800">Mine øvelser</h1>
                {patientInfo && (
                  <p className="text-sm text-slate-500">Hei, {patientInfo.first_name}!</p>
                )}
              </div>
            </div>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Last ned</span>
            </button>
          </div>
        </div>
      </header>

      {/* Stats cards */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
              <Activity className="w-3.5 h-3.5" />
              I dag
            </div>
            <div className="text-2xl font-bold text-slate-800">
              {completedToday}/{totalExercises}
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
              <TrendingUp className="w-3.5 h-3.5" />
              Totalt
            </div>
            <div className="text-2xl font-bold text-green-600">
              {overallCompliance}%
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
              <Calendar className="w-3.5 h-3.5" />
              Øvelser
            </div>
            <div className="text-2xl font-bold text-slate-800">
              {totalExercises}
            </div>
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
                <h3 className="font-bold">Flott jobbet!</h3>
                <p className="text-sm text-green-100">Du har gjennomført alle øvelsene i dag</p>
              </div>
            </div>
          </div>
        )}

        {/* Exercise list */}
        <div className="space-y-4">
          {prescriptions.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center shadow-sm">
              <Dumbbell className="w-16 h-16 text-slate-200 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-700">Ingen øvelser ennå</h3>
              <p className="text-slate-500 mt-2">
                Din behandler har ikke lagt til øvelser for deg ennå.
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
              />
            ))
          )}
        </div>

        {/* Refresh button */}
        <div className="mt-6 text-center">
          <button
            onClick={() => loadExercises(patientInfo?.id || patientId, localStorage.getItem('portal_session'))}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Oppdater
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="max-w-2xl mx-auto px-4 py-8 text-center text-sm text-slate-400">
        <p>Ved spørsmål, kontakt din behandler</p>
        <p className="mt-1">ChiroClick CRM</p>
      </footer>
    </div>
  );
};

export default PatientExercises;
