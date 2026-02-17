import { useState } from 'react';
import {
  Calendar,
  _TrendingUp,
  Target,
  Clock,
  Edit2,
  Check,
  X,
  Plus,
  AlertTriangle,
} from 'lucide-react';

/**
 * TreatmentPlanTracker - Track treatment plan progress
 * Inspired by ChiroTouch's "Visit 14 out of projected 24 visits" display
 *
 * Features:
 * - Visual progress bar
 * - Phase tracking (P1, P2, P3)
 * - Visit frequency display
 * - Re-evaluation reminders
 * - Goal tracking
 */

export default function TreatmentPlanTracker({
  plan = null,
  currentVisit = 1,
  onChange,
  _onNewPlan,
  compact = false,
  className = '',
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedPlan, setEditedPlan] = useState(plan || getDefaultPlan());

  function getDefaultPlan() {
    return {
      phases: [
        {
          id: 'p1',
          name: 'Phase 1 - Acute Care',
          visitsPerWeek: 3,
          totalWeeks: 2,
          totalVisits: 6,
          goals: ['Pain reduction', 'Inflammation control', 'Restore basic function'],
        },
        {
          id: 'p2',
          name: 'Phase 2 - Corrective Care',
          visitsPerWeek: 2,
          totalWeeks: 4,
          totalVisits: 8,
          goals: ['Spinal correction', 'Postural improvement', 'Muscle strengthening'],
        },
        {
          id: 'p3',
          name: 'Phase 3 - Maintenance',
          visitsPerWeek: 1,
          totalWeeks: 4,
          totalVisits: 4,
          goals: ['Maintain improvements', 'Prevent recurrence', 'Wellness care'],
        },
      ],
      startDate: new Date().toISOString().split('T')[0],
      reEvalInterval: 12, // visits
      notes: '',
    };
  }

  const totalPlannedVisits = plan?.phases?.reduce((sum, p) => sum + p.totalVisits, 0) || 0;
  const progressPercent =
    totalPlannedVisits > 0 ? Math.min((currentVisit / totalPlannedVisits) * 100, 100) : 0;

  // Determine current phase
  const getCurrentPhase = () => {
    if (!plan?.phases) {
      return null;
    }
    let visitCount = 0;
    for (const phase of plan.phases) {
      visitCount += phase.totalVisits;
      if (currentVisit <= visitCount) {
        return phase;
      }
    }
    return plan.phases[plan.phases.length - 1];
  };

  const _currentPhase = getCurrentPhase();

  // Check if re-evaluation is due
  const isReEvalDue =
    plan?.reEvalInterval && currentVisit > 0 && currentVisit % plan.reEvalInterval === 0;

  // Calculate phase progress
  const getPhaseProgress = () => {
    if (!plan?.phases) {
      return [];
    }

    let visitCount = 0;
    return plan.phases.map((phase) => {
      const phaseStart = visitCount + 1;
      const phaseEnd = visitCount + phase.totalVisits;
      visitCount += phase.totalVisits;

      let status = 'upcoming';
      let phaseCurrentVisit = 0;

      if (currentVisit >= phaseStart && currentVisit <= phaseEnd) {
        status = 'current';
        phaseCurrentVisit = currentVisit - phaseStart + 1;
      } else if (currentVisit > phaseEnd) {
        status = 'completed';
        phaseCurrentVisit = phase.totalVisits;
      }

      return {
        ...phase,
        phaseStart,
        phaseEnd,
        status,
        phaseCurrentVisit,
      };
    });
  };

  const phaseProgress = getPhaseProgress();

  const savePlan = () => {
    onChange(editedPlan);
    setIsEditing(false);
  };

  const updatePhase = (phaseId, updates) => {
    setEditedPlan((prev) => ({
      ...prev,
      phases: prev.phases.map((p) => (p.id === phaseId ? { ...p, ...updates } : p)),
    }));
  };

  // Compact display for header
  if (compact) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium">
            Visit {currentVisit} of {totalPlannedVisits}
          </span>
        </div>
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-32">
          <div
            className="h-full bg-blue-600 rounded-full transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {isReEvalDue && (
          <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
            <AlertTriangle className="w-3 h-3" />
            Re-eval due
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 rounded-t-lg">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-white" />
          <h3 className="font-semibold text-white">Treatment Plan</h3>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <button
              onClick={() => {
                setEditedPlan(plan || getDefaultPlan());
                setIsEditing(true);
              }}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-white/20 text-white rounded hover:bg-white/30"
            >
              <Edit2 className="w-3 h-3" />
              Edit
            </button>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1 text-white/80 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={savePlan}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-white text-green-700 rounded hover:bg-green-50"
              >
                <Check className="w-3 h-3" />
                Save
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Progress Display */}
      {!isEditing && plan ? (
        <>
          {/* Visit Counter */}
          <div className="p-4 bg-green-50 border-b border-green-200">
            <div className="flex items-center justify-between mb-2">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-700">{currentVisit}</div>
                <div className="text-xs text-green-600">Current Visit</div>
              </div>
              <div className="text-center text-gray-400">of</div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-700">{totalPlannedVisits}</div>
                <div className="text-xs text-gray-500">Projected Visits</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 text-center mt-1">
              {Math.round(progressPercent)}% complete
            </div>
          </div>

          {/* Re-evaluation Alert */}
          {isReEvalDue && (
            <div className="px-4 py-3 bg-yellow-50 border-b border-yellow-200 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <div>
                <div className="text-sm font-medium text-yellow-800">Re-evaluation Due</div>
                <div className="text-xs text-yellow-600">
                  Every {plan.reEvalInterval} visits - Assess progress and adjust plan
                </div>
              </div>
            </div>
          )}

          {/* Phase Progress */}
          <div className="p-4 space-y-3">
            {phaseProgress.map((phase, index) => (
              <div
                key={phase.id}
                className={`p-3 rounded-lg border ${
                  phase.status === 'current'
                    ? 'bg-blue-50 border-blue-300'
                    : phase.status === 'completed'
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 text-xs font-bold rounded ${
                        phase.status === 'current'
                          ? 'bg-blue-600 text-white'
                          : phase.status === 'completed'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-400 text-white'
                      }`}
                    >
                      P{index + 1}
                    </span>
                    <span className="font-medium text-gray-900">{phase.name}</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {phase.status === 'current'
                      ? `${phase.phaseCurrentVisit}/${phase.totalVisits} visits`
                      : phase.status === 'completed'
                        ? 'Completed'
                        : `${phase.totalVisits} visits`}
                  </span>
                </div>

                {/* Phase details */}
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {phase.visitsPerWeek}x/week
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {phase.totalWeeks} weeks
                  </span>
                </div>

                {/* Goals */}
                {phase.status === 'current' && phase.goals && (
                  <div className="mt-2 pt-2 border-t border-blue-200">
                    <div className="text-xs font-medium text-blue-700 mb-1">Goals:</div>
                    <ul className="text-xs text-blue-600 space-y-0.5">
                      {phase.goals.map((goal, i) => (
                        <li key={i} className="flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-blue-400"></span>
                          {goal}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Summary Table (like ChiroTouch) */}
          <div className="px-4 pb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2">Phase</th>
                  <th className="pb-2 text-center">Freq</th>
                  <th className="pb-2 text-center">Weeks</th>
                  <th className="pb-2 text-right">Visits</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {plan.phases.map((phase, i) => (
                  <tr key={phase.id}>
                    <td className="py-2 font-medium">P{i + 1}</td>
                    <td className="py-2 text-center">{phase.visitsPerWeek}x/wk</td>
                    <td className="py-2 text-center">{phase.totalWeeks}W</td>
                    <td className="py-2 text-right font-medium">{phase.totalVisits}</td>
                  </tr>
                ))}
                <tr className="font-bold">
                  <td className="pt-2" colSpan="3">
                    Total
                  </td>
                  <td className="pt-2 text-right">{totalPlannedVisits}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      ) : isEditing ? (
        /* Edit Mode */
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
              <input
                type="date"
                value={editedPlan.startDate}
                onChange={(e) => setEditedPlan({ ...editedPlan, startDate: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Re-eval Every (visits)
              </label>
              <input
                type="number"
                value={editedPlan.reEvalInterval}
                onChange={(e) =>
                  setEditedPlan({ ...editedPlan, reEvalInterval: parseInt(e.target.value) })
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          {/* Phases */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-gray-700">Treatment Phases</div>
            {editedPlan.phases.map((phase, index) => (
              <div key={phase.id} className="p-3 bg-gray-50 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-xs font-bold bg-gray-600 text-white rounded">
                    P{index + 1}
                  </span>
                  <input
                    type="text"
                    value={phase.name}
                    onChange={(e) => updatePhase(phase.id, { name: e.target.value })}
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500">Visits/Week</label>
                    <input
                      type="number"
                      min="1"
                      max="7"
                      value={phase.visitsPerWeek}
                      onChange={(e) => {
                        const v = parseInt(e.target.value) || 1;
                        updatePhase(phase.id, {
                          visitsPerWeek: v,
                          totalVisits: v * phase.totalWeeks,
                        });
                      }}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500">Weeks</label>
                    <input
                      type="number"
                      min="1"
                      value={phase.totalWeeks}
                      onChange={(e) => {
                        const w = parseInt(e.target.value) || 1;
                        updatePhase(phase.id, {
                          totalWeeks: w,
                          totalVisits: phase.visitsPerWeek * w,
                        });
                      }}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500">Total Visits</label>
                    <input
                      type="number"
                      value={phase.totalVisits}
                      readOnly
                      className="w-full px-2 py-1 text-sm bg-gray-100 border border-gray-300 rounded"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
            <span className="font-medium text-gray-700">Total Projected Visits:</span>
            <span className="text-xl font-bold text-green-600">
              {editedPlan.phases.reduce((sum, p) => sum + p.totalVisits, 0)}
            </span>
          </div>
        </div>
      ) : (
        /* No Plan */
        <div className="p-6 text-center">
          <Target className="w-10 h-10 mx-auto mb-2 text-gray-300" />
          <p className="text-gray-500 mb-3">No treatment plan set</p>
          <button
            onClick={() => {
              setEditedPlan(getDefaultPlan());
              setIsEditing(true);
            }}
            className="flex items-center gap-1 mx-auto px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
          >
            <Plus className="w-4 h-4" />
            Create Treatment Plan
          </button>
        </div>
      )}
    </div>
  );
}

// Mini version showing just the visit counter
export function VisitCounter({ currentVisit, totalVisits, className = '' }) {
  const percent = totalVisits > 0 ? (currentVisit / totalVisits) * 100 : 0;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm font-medium text-gray-900">
        Visit <span className="text-blue-600">{currentVisit}</span> of {totalVisits}
      </span>
      <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 rounded-full"
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  );
}
