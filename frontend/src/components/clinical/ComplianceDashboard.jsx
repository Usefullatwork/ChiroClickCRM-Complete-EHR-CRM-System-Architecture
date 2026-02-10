import { useState, useEffect, useMemo } from 'react';
import { Activity, CheckCircle, Calendar, TrendingDown, AlertCircle, Loader2 } from 'lucide-react';
import { exercisesAPI } from '../../services/api';

/**
 * ComplianceDashboard - Shows patient exercise compliance overview
 *
 * Displays:
 * - Overall compliance percentage
 * - Active prescriptions with per-exercise compliance
 * - 30-day completion heatmap
 * - Pain level trend
 */
export default function ComplianceDashboard({ patientId }) {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!patientId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await exercisesAPI.getPatientExercises(patientId);
        setPrescriptions(res.data?.data || res.data || []);
      } catch (err) {
        setError('Failed to load exercise data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [patientId]);

  // Calculate overall compliance
  const overallCompliance = useMemo(() => {
    if (!prescriptions.length) return 0;
    const activePrescriptions = prescriptions.filter(
      (p) => p.status === 'active' || p.status === 'in_progress'
    );
    if (!activePrescriptions.length) return 0;
    const total = activePrescriptions.reduce(
      (sum, p) => sum + (p.compliance_percentage || p.compliancePercentage || 0),
      0
    );
    return Math.round(total / activePrescriptions.length);
  }, [prescriptions]);

  // Build 30-day completion map
  const completionDays = useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      let completed = false;
      for (const p of prescriptions) {
        const logs = p.compliance_logs || p.complianceLogs || [];
        if (logs.some((l) => l.date === dateStr || l.logged_at?.startsWith(dateStr))) {
          completed = true;
          break;
        }
      }

      days.push({
        date: dateStr,
        dayNum: date.getDate(),
        dayName: date.toLocaleDateString('nb-NO', { weekday: 'short' }),
        completed,
      });
    }
    return days;
  }, [prescriptions]);

  // Pain trend from prescription data
  const painTrend = useMemo(() => {
    const entries = [];
    for (const p of prescriptions) {
      const logs = p.compliance_logs || p.complianceLogs || [];
      for (const log of logs) {
        if (log.pain_level != null || log.painLevel != null) {
          entries.push({
            date: log.date || log.logged_at,
            level: log.pain_level ?? log.painLevel,
          });
        }
      }
    }
    entries.sort((a, b) => new Date(a.date) - new Date(b.date));
    return entries.slice(-10);
  }, [prescriptions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-500">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading compliance data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 p-4 text-red-600 bg-red-50 rounded-lg">
        <AlertCircle className="w-5 h-5" />
        {error}
      </div>
    );
  }

  if (!prescriptions.length) {
    return (
      <div className="text-center p-8 text-gray-500">
        <Activity className="w-8 h-8 mx-auto mb-2 text-gray-300" />
        <p className="text-sm">No exercise prescriptions yet</p>
      </div>
    );
  }

  const activePrescriptions = prescriptions.filter(
    (p) => p.status === 'active' || p.status === 'in_progress'
  );

  return (
    <div className="space-y-4">
      {/* Overall Compliance */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Overall Compliance
        </h3>
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20">
            <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={
                  overallCompliance >= 70
                    ? '#10b981'
                    : overallCompliance >= 40
                      ? '#f59e0b'
                      : '#ef4444'
                }
                strokeWidth="3"
                strokeDasharray={`${overallCompliance}, 100`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-gray-900">
              {overallCompliance}%
            </span>
          </div>
          <div className="text-sm text-gray-600">
            <p>
              <span className="font-medium text-gray-900">{activePrescriptions.length}</span> active
              prescription{activePrescriptions.length !== 1 ? 's' : ''}
            </p>
            <p>
              <span className="font-medium text-gray-900">{prescriptions.length}</span> total
            </p>
          </div>
        </div>
      </div>

      {/* Active Prescriptions */}
      {activePrescriptions.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Active Prescriptions
          </h3>
          <div className="space-y-3">
            {activePrescriptions.map((p) => {
              const compliance = p.compliance_percentage || p.compliancePercentage || 0;
              return (
                <div key={p.id} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {p.exercise_name || p.exerciseName || p.name || 'Exercise'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {p.sets && `${p.sets}x${p.reps || ''}`}
                      {p.frequency && ` - ${p.frequency}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          compliance >= 70
                            ? 'bg-green-500'
                            : compliance >= 40
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(compliance, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-600 w-10 text-right">
                      {compliance}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 30-Day Heatmap */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Last 30 Days
        </h3>
        <div className="grid grid-cols-10 gap-1">
          {completionDays.map((day) => (
            <div
              key={day.date}
              className={`w-full aspect-square rounded-sm flex items-center justify-center text-[10px] ${
                day.completed ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'
              }`}
              title={`${day.date}: ${day.completed ? 'Completed' : 'Missed'}`}
            >
              {day.dayNum}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-green-500 inline-block" /> Completed
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-gray-100 inline-block" /> Missed
          </span>
        </div>
      </div>

      {/* Pain Trend */}
      {painTrend.length > 1 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <TrendingDown className="w-4 h-4" />
            Pain Trend
          </h3>
          <div className="flex items-end gap-1 h-16">
            {painTrend.map((entry, i) => {
              const height = (entry.level / 10) * 100;
              return (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center"
                  title={`${entry.date}: ${entry.level}/10`}
                >
                  <div
                    className={`w-full rounded-t-sm ${
                      entry.level <= 3
                        ? 'bg-green-400'
                        : entry.level <= 6
                          ? 'bg-yellow-400'
                          : 'bg-red-400'
                    }`}
                    style={{ height: `${Math.max(height, 5)}%` }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 mt-1">
            <span>{painTrend[0]?.date?.slice(5)}</span>
            <span>{painTrend[painTrend.length - 1]?.date?.slice(5)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
