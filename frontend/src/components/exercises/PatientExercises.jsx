/**
 * Patient Exercises Component
 * View and manage a patient's exercise prescriptions and compliance
 */

import _React, { useState, _useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { exercisesAPI } from '../../services/api';
import {
  Activity,
  _Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  _Clock,
  Dumbbell,
  _Download,
  Edit2,
  Loader2,
  Mail,
  MoreVertical,
  _Pause,
  Play,
  Plus,
  Printer,
  _Star,
  _ThumbsUp,
  _Trash2,
  _TrendingUp,
  X,
  _AlertTriangle,
} from 'lucide-react';

// Status labels
const STATUS_LABELS = {
  active: 'Aktiv',
  completed: 'Fullført',
  discontinued: 'Avbrutt',
  paused: 'Pauset',
};

// Status colors
const STATUS_COLORS = {
  active: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  discontinued: 'bg-red-100 text-red-700',
  paused: 'bg-yellow-100 text-yellow-700',
};

// Frequency labels
const FREQUENCY_LABELS = {
  daily: 'Daglig',
  '2x_daily': '2x daglig',
  '3x_week': '3x/uke',
  weekly: 'Ukentlig',
};

/**
 * Compliance Calendar Component
 */
const ComplianceCalendar = ({ complianceLog, startDate, onLogCompliance }) => {
  const today = new Date();
  const start = new Date(startDate);
  const days = [];

  // Generate last 14 days
  for (let i = 13; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const log = complianceLog?.[dateStr];

    days.push({
      date: dateStr,
      dayOfWeek: date.toLocaleDateString('no-NO', { weekday: 'short' }).slice(0, 2),
      dayOfMonth: date.getDate(),
      completed: log?.completed,
      painLevel: log?.pain_level,
      isFuture: date > today,
      isBeforeStart: date < start,
    });
  }

  return (
    <div className="flex gap-1">
      {days.map((day) => (
        <button
          key={day.date}
          onClick={() => !day.isFuture && !day.isBeforeStart && onLogCompliance(day.date)}
          disabled={day.isFuture || day.isBeforeStart}
          className={`
            w-8 h-10 rounded flex flex-col items-center justify-center text-xs
            ${
              day.isFuture || day.isBeforeStart
                ? 'bg-slate-50 text-slate-300 cursor-not-allowed'
                : day.completed === true
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : day.completed === false
                    ? 'bg-red-100 text-red-700 border border-red-200'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200 cursor-pointer'
            }
          `}
          title={day.date}
        >
          <span className="text-[10px] font-medium">{day.dayOfWeek}</span>
          <span>{day.dayOfMonth}</span>
        </button>
      ))}
    </div>
  );
};

/**
 * Log Compliance Modal
 */
const LogComplianceModal = ({ prescription, date, onClose, onSave, isLoading }) => {
  const [completed, setCompleted] = useState(true);
  const [painLevel, setPainLevel] = useState(3);
  const [notes, setNotes] = useState('');
  const [setsCompleted, setSetsCompleted] = useState(prescription.sets || 3);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      date,
      completed,
      pain_level: painLevel,
      notes,
      sets_completed: setsCompleted,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="font-semibold">Logg fremgang</h2>
            <p className="text-sm text-slate-500">
              {prescription.exercise_name} - {date}
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Completed toggle */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={completed}
                onChange={() => setCompleted(true)}
                className="w-4 h-4 text-green-600"
              />
              <span className="text-sm font-medium text-green-700">Gjennomført</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={!completed}
                onChange={() => setCompleted(false)}
                className="w-4 h-4 text-red-600"
              />
              <span className="text-sm font-medium text-red-700">Ikke gjennomført</span>
            </label>
          </div>

          {completed && (
            <>
              {/* Sets completed */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Antall sett fullført
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="1"
                    max={prescription.sets || 5}
                    value={setsCompleted}
                    onChange={(e) => setSetsCompleted(parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="w-12 text-center font-medium">
                    {setsCompleted}/{prescription.sets || 3}
                  </span>
                </div>
              </div>

              {/* Pain level */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Smertenivå under øvelse (0-10)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={painLevel}
                    onChange={(e) => setPainLevel(parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span
                    className={`w-8 text-center font-medium ${
                      painLevel <= 3
                        ? 'text-green-600'
                        : painLevel <= 6
                          ? 'text-yellow-600'
                          : 'text-red-600'
                    }`}
                  >
                    {painLevel}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Notater (valgfritt)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              rows={2}
              placeholder="f.eks. Følte meg stiv, eller øvelsen var lettere i dag..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              Avbryt
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Lagrer...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Lagre
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * Exercise Prescription Card
 */
const PrescriptionCard = ({ prescription, onLogCompliance, onDiscontinue, onComplete, onEdit }) => {
  const [expanded, setExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const compliancePercent = prescription.compliance_percent || 0;
  const daysActive = Math.floor(
    (new Date() - new Date(prescription.start_date)) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center">
              {prescription.thumbnail_url ? (
                <img
                  src={prescription.thumbnail_url}
                  alt=""
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <Dumbbell className="w-6 h-6 text-slate-400" />
              )}
            </div>
            <div>
              <h3 className="font-medium text-slate-800">{prescription.exercise_name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[prescription.status]}`}
                >
                  {STATUS_LABELS[prescription.status]}
                </span>
                <span className="text-xs text-slate-500">
                  {prescription.sets}x{prescription.reps}
                  {prescription.hold_seconds && ` | Hold: ${prescription.hold_seconds}s`}
                </span>
              </div>
            </div>
          </div>

          {/* Actions menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded hover:bg-slate-100"
            >
              <MoreVertical className="w-4 h-4 text-slate-400" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border z-10">
                <button
                  onClick={() => {
                    onEdit(prescription);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Rediger dosering
                </button>
                {prescription.status === 'active' && (
                  <>
                    <button
                      onClick={() => {
                        onComplete(prescription);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2 text-blue-600"
                    >
                      <Check className="w-4 h-4" />
                      Merk som fullført
                    </button>
                    <button
                      onClick={() => {
                        onDiscontinue(prescription);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2 text-red-600"
                    >
                      <X className="w-4 h-4" />
                      Avbryt øvelse
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick stats */}
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="text-center">
            <span className="text-2xl font-bold text-slate-800">
              {Math.round(compliancePercent)}%
            </span>
            <p className="text-xs text-slate-500">Etterlevelse</p>
          </div>
          <div className="text-center">
            <span className="text-2xl font-bold text-slate-800">{daysActive}</span>
            <p className="text-xs text-slate-500">Dager aktiv</p>
          </div>
          <div className="text-center">
            <span className="text-2xl font-bold text-slate-800">
              {FREQUENCY_LABELS[prescription.frequency] || prescription.frequency}
            </span>
            <p className="text-xs text-slate-500">Frekvens</p>
          </div>
        </div>

        {/* Compliance calendar */}
        {prescription.status === 'active' && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-600">Siste 14 dager</span>
              <button
                onClick={() =>
                  onLogCompliance(prescription, new Date().toISOString().split('T')[0])
                }
                className="text-xs text-purple-600 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Logg i dag
              </button>
            </div>
            <ComplianceCalendar
              complianceLog={prescription.compliance_log}
              startDate={prescription.start_date}
              onLogCompliance={(date) => onLogCompliance(prescription, date)}
            />
          </div>
        )}
      </div>

      {/* Expandable details */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-2 bg-slate-50 border-t flex items-center justify-center gap-1 text-sm text-slate-500 hover:bg-slate-100"
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

      {expanded && (
        <div className="px-4 pb-4 border-t">
          {prescription.exercise_instructions && (
            <div className="mt-3">
              <h4 className="text-sm font-medium text-slate-700 mb-1">Instruksjoner</h4>
              <p className="text-sm text-slate-600">{prescription.exercise_instructions}</p>
            </div>
          )}
          {prescription.custom_instructions && (
            <div className="mt-3">
              <h4 className="text-sm font-medium text-slate-700 mb-1">Tilpassede instruksjoner</h4>
              <p className="text-sm text-slate-600">{prescription.custom_instructions}</p>
            </div>
          )}
          {prescription.video_url && (
            <a
              href={prescription.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 text-blue-600 hover:underline text-sm"
            >
              <Play className="w-4 h-4" />
              Se video
            </a>
          )}
        </div>
      )}
    </div>
  );
};

// Plus imported from lucide-react at top of file

/**
 * Main Patient Exercises Component
 */
export const PatientExercises = ({ patientId, patientName }) => {
  const queryClient = useQueryClient();

  // State
  const [statusFilter, setStatusFilter] = useState('active');
  const [loggingCompliance, setLoggingCompliance] = useState(null);
  const [_editingPrescription, setEditingPrescription] = useState(null);

  // Fetch patient exercises
  const { data: exercisesData, isLoading } = useQuery({
    queryKey: ['patient', patientId, 'exercises', statusFilter],
    queryFn: () =>
      exercisesAPI.getPatientExercises(patientId, {
        status: statusFilter === 'all' ? undefined : statusFilter,
        includeCompleted: statusFilter === 'all' || statusFilter === 'completed',
      }),
    enabled: !!patientId,
    staleTime: 1 * 60 * 1000,
  });

  // Log compliance mutation
  const logComplianceMutation = useMutation({
    mutationFn: ({ prescriptionId, data }) => exercisesAPI.logCompliance(prescriptionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['patient', patientId, 'exercises']);
      setLoggingCompliance(null);
    },
  });

  // Discontinue mutation
  const discontinueMutation = useMutation({
    mutationFn: ({ prescriptionId, reason }) =>
      exercisesAPI.discontinuePrescription(prescriptionId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries(['patient', patientId, 'exercises']);
    },
  });

  // Complete mutation
  const completeMutation = useMutation({
    mutationFn: (prescriptionId) => exercisesAPI.completePrescription(prescriptionId),
    onSuccess: () => {
      queryClient.invalidateQueries(['patient', patientId, 'exercises']);
    },
  });

  const prescriptions = exercisesData?.data?.data || [];
  const activeCount = prescriptions.filter((p) => p.status === 'active').length;

  const handleLogCompliance = (prescription, date) => {
    setLoggingCompliance({ prescription, date });
  };

  const handleDiscontinue = async (prescription) => {
    const reason = window.prompt('Årsak til avbrudd (valgfritt):');
    if (reason !== null) {
      discontinueMutation.mutate({
        prescriptionId: prescription.id,
        reason: reason || 'Avbrutt av behandler',
      });
    }
  };

  const handleComplete = async (prescription) => {
    if (window.confirm(`Merk "${prescription.exercise_name}" som fullført?`)) {
      completeMutation.mutate(prescription.id);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b bg-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Øvelsesprogram</h1>
            {patientName && <p className="text-sm text-slate-500 mt-1">{patientName}</p>}
          </div>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 text-sm font-medium text-slate-700 border rounded-lg hover:bg-slate-50 flex items-center gap-2">
              <Printer className="w-4 h-4" />
              Skriv ut
            </button>
            <button className="px-4 py-2 text-sm font-medium text-slate-700 border rounded-lg hover:bg-slate-50 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Send til pasient
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="p-4 bg-green-50 rounded-lg">
            <span className="text-2xl font-bold text-green-700">{activeCount}</span>
            <p className="text-sm text-green-600">Aktive øvelser</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <span className="text-2xl font-bold text-blue-700">
              {prescriptions.length > 0
                ? Math.round(
                    prescriptions.reduce((sum, p) => sum + (p.compliance_percent || 0), 0) /
                      prescriptions.length
                  )
                : 0}
              %
            </span>
            <p className="text-sm text-blue-600">Gj.snitt etterlevelse</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <span className="text-2xl font-bold text-purple-700">
              {prescriptions.filter((p) => p.status === 'completed').length}
            </span>
            <p className="text-sm text-purple-600">Fullførte</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg">
            <span className="text-2xl font-bold text-slate-700">{prescriptions.length}</span>
            <p className="text-sm text-slate-600">Totalt foreskrevet</p>
          </div>
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-2">
          {['active', 'completed', 'discontinued', 'all'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-1.5 text-sm rounded-lg transition-colors ${
                statusFilter === status
                  ? 'bg-purple-100 text-purple-700 font-medium'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status === 'all' ? 'Alle' : STATUS_LABELS[status]}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : prescriptions.length === 0 ? (
          <div className="text-center py-16">
            <Activity className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-600">Ingen øvelser</h3>
            <p className="text-sm text-slate-400 mt-1">
              {statusFilter === 'active'
                ? 'Pasienten har ingen aktive øvelser'
                : 'Ingen øvelser matcher filteret'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {prescriptions.map((prescription) => (
              <PrescriptionCard
                key={prescription.id}
                prescription={prescription}
                onLogCompliance={handleLogCompliance}
                onDiscontinue={handleDiscontinue}
                onComplete={handleComplete}
                onEdit={setEditingPrescription}
              />
            ))}
          </div>
        )}
      </div>

      {/* Log Compliance Modal */}
      {loggingCompliance && (
        <LogComplianceModal
          prescription={loggingCompliance.prescription}
          date={loggingCompliance.date}
          onClose={() => setLoggingCompliance(null)}
          onSave={(data) =>
            logComplianceMutation.mutate({
              prescriptionId: loggingCompliance.prescription.id,
              data,
            })
          }
          isLoading={logComplianceMutation.isPending}
        />
      )}
    </div>
  );
};

export default PatientExercises;
