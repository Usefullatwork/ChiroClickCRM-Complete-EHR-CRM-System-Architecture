/**
 * TreatmentPlanProgress - Shows plan progress with session tracking and milestone checklist
 */

import { useState, useEffect } from 'react';
import {
  Target,
  Calendar,
  CheckCircle2,
  Circle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { treatmentPlansAPI } from '../../services/api';

const STATUS_ICONS = {
  pending: <Circle className="w-4 h-4 text-gray-400" />,
  in_progress: <Clock className="w-4 h-4 text-blue-500" />,
  achieved: <CheckCircle2 className="w-4 h-4 text-green-500" />,
  missed: <XCircle className="w-4 h-4 text-red-500" />,
};

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-700',
  active: 'bg-teal-100 text-teal-700',
  paused: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

function ProgressBar({ completed, total }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-500">
        <span>
          {completed} / {total} sessions
        </span>
        <span>{pct}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-teal-600 h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function PlanCard({ plan, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadDetail = async () => {
    if (detail) {
      setExpanded(!expanded);
      return;
    }
    setLoading(true);
    try {
      const res = await treatmentPlansAPI.getPlan(plan.id);
      setDetail(res.data);
      setExpanded(true);
    } catch {
      // Silently fail — user can retry
    } finally {
      setLoading(false);
    }
  };

  const handleMilestoneToggle = async (milestone) => {
    const newStatus = milestone.status === 'achieved' ? 'pending' : 'achieved';
    try {
      await treatmentPlansAPI.updateMilestone(milestone.id, { status: newStatus });
      // Refresh detail
      const res = await treatmentPlansAPI.getPlan(plan.id);
      setDetail(res.data);
      if (onUpdate) {
        onUpdate();
      }
    } catch {
      // Silently fail
    }
  };

  const formatDate = (d) => {
    if (!d) {
      return '';
    }
    return new Date(d).toLocaleDateString('nb-NO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={loadDetail}
        className="w-full p-3 flex items-center gap-3 hover:bg-gray-50 text-left"
      >
        <Target className="w-5 h-5 text-teal-600 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-800 truncate">{plan.title}</span>
            <span className={`px-2 py-0.5 text-xs rounded-full ${STATUS_COLORS[plan.status]}`}>
              {plan.status}
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            {plan.completed_sessions || 0}/{plan.total_sessions || '?'} sessions
            {plan.start_date && ` | Started ${formatDate(plan.start_date)}`}
          </div>
        </div>
        <ProgressBar completed={plan.completed_sessions || 0} total={plan.total_sessions || 1} />
        {loading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-teal-600 border-t-transparent" />
        ) : expanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {/* Detail */}
      {expanded && detail && (
        <div className="border-t border-gray-100 p-3 space-y-4">
          {/* Plan info */}
          {detail.condition_description && (
            <p className="text-sm text-gray-600">{detail.condition_description}</p>
          )}

          {/* Goals */}
          {detail.goals && detail.goals.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold text-gray-500 uppercase mb-1">Goals</h5>
              <ul className="space-y-1">
                {(typeof detail.goals === 'string' ? JSON.parse(detail.goals) : detail.goals).map(
                  (g, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500 flex-shrink-0" />
                      {g}
                    </li>
                  )
                )}
              </ul>
            </div>
          )}

          {/* Milestones */}
          {detail.milestones && detail.milestones.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold text-gray-500 uppercase mb-1">Milestones</h5>
              <ul className="space-y-2">
                {detail.milestones.map((ms) => (
                  <li
                    key={ms.id}
                    className="flex items-start gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded"
                    onClick={() => handleMilestoneToggle(ms)}
                  >
                    {STATUS_ICONS[ms.status]}
                    <div className="flex-1">
                      <span
                        className={`${ms.status === 'achieved' ? 'line-through text-gray-400' : 'text-gray-700'}`}
                      >
                        {ms.title}
                      </span>
                      {ms.outcome_measure && (
                        <span className="text-xs text-gray-400 ml-2">
                          {ms.outcome_measure}
                          {ms.target_score && ` <= ${ms.target_score}`}
                          {ms.actual_score !== null &&
                            ms.actual_score !== undefined &&
                            ` (actual: ${ms.actual_score})`}
                        </span>
                      )}
                    </div>
                    {ms.target_date && (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(ms.target_date)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Sessions */}
          {detail.sessions && detail.sessions.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold text-gray-500 uppercase mb-1">
                Sessions ({detail.sessions.filter((s) => s.status === 'completed').length}/
                {detail.sessions.length})
              </h5>
              <div className="flex flex-wrap gap-1">
                {detail.sessions.map((session) => (
                  <div
                    key={session.id}
                    className={`w-7 h-7 rounded flex items-center justify-center text-xs font-medium ${
                      session.status === 'completed'
                        ? 'bg-teal-100 text-teal-700'
                        : session.status === 'cancelled'
                          ? 'bg-red-100 text-red-700 line-through'
                          : session.status === 'no_show'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-500'
                    }`}
                    title={`Session ${session.session_number}: ${session.status}`}
                  >
                    {session.session_number}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function TreatmentPlanProgress({ patientId }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadPlans = async () => {
    if (!patientId) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await treatmentPlansAPI.getPatientPlans(patientId);
      setPlans(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, [patientId]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Treatment Plans</h3>
        <div className="flex items-center justify-center py-8 text-gray-400">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-teal-600 border-t-transparent" />
          <span className="ml-2">Loading plans...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Treatment Plans</h3>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      {plans.length === 0 ? (
        <p className="text-sm text-gray-500">No treatment plans created yet.</p>
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} onUpdate={loadPlans} />
          ))}
        </div>
      )}
    </div>
  );
}
