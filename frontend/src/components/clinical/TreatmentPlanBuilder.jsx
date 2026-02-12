/**
 * TreatmentPlanBuilder - Wizard-style form for creating treatment plans
 * Steps: Condition -> Schedule -> Goals -> Milestones -> Review
 */

import React, { useState, useCallback } from 'react';
import { FileText, ChevronRight, ChevronLeft, Check, Plus, X } from 'lucide-react';
import { treatmentPlansAPI } from '../../services/api';

const STEPS = ['Condition', 'Schedule', 'Goals', 'Milestones', 'Review'];

const FREQUENCY_OPTIONS = [
  '1x per week',
  '2x per week',
  '3x per week',
  'Every other week',
  '1x per month',
  'As needed',
];

const OUTCOME_TYPES = ['ODI', 'NDI', 'VAS', 'DASH', 'NPRS'];

function StepIndicator({ currentStep }) {
  return (
    <div className="flex items-center justify-between mb-6">
      {STEPS.map((step, idx) => (
        <React.Fragment key={step}>
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                idx < currentStep
                  ? 'bg-teal-600 text-white'
                  : idx === currentStep
                    ? 'bg-teal-100 text-teal-700 border-2 border-teal-600'
                    : 'bg-gray-100 text-gray-400'
              }`}
            >
              {idx < currentStep ? <Check className="w-4 h-4" /> : idx + 1}
            </div>
            <span
              className={`text-sm hidden sm:inline ${
                idx === currentStep ? 'text-teal-700 font-medium' : 'text-gray-400'
              }`}
            >
              {step}
            </span>
          </div>
          {idx < STEPS.length - 1 && (
            <div
              className={`flex-1 h-0.5 mx-2 ${idx < currentStep ? 'bg-teal-600' : 'bg-gray-200'}`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function TreatmentPlanBuilder({ patientId, onCreated, onCancel }) {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    title: '',
    conditionDescription: '',
    diagnosisCode: '',
    frequency: '2x per week',
    totalSessions: 12,
    startDate: new Date().toISOString().split('T')[0],
    targetEndDate: '',
    notes: '',
    goals: [],
    milestones: [],
  });

  const [newGoal, setNewGoal] = useState('');
  const [newMilestone, setNewMilestone] = useState({
    title: '',
    targetDate: '',
    outcomeMeasure: '',
    targetScore: '',
  });

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const addGoal = () => {
    if (!newGoal.trim()) return;
    updateForm('goals', [...form.goals, newGoal.trim()]);
    setNewGoal('');
  };

  const removeGoal = (idx) => {
    updateForm(
      'goals',
      form.goals.filter((_, i) => i !== idx)
    );
  };

  const addMilestone = () => {
    if (!newMilestone.title.trim()) return;
    updateForm('milestones', [...form.milestones, { ...newMilestone }]);
    setNewMilestone({ title: '', targetDate: '', outcomeMeasure: '', targetScore: '' });
  };

  const removeMilestone = (idx) => {
    updateForm(
      'milestones',
      form.milestones.filter((_, i) => i !== idx)
    );
  };

  const canAdvance = () => {
    switch (step) {
      case 0:
        return form.title.trim().length > 0;
      case 1:
        return form.startDate && form.totalSessions > 0;
      default:
        return true;
    }
  };

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    setError(null);

    try {
      // Create the plan
      const planRes = await treatmentPlansAPI.createPlan({
        patientId,
        title: form.title,
        conditionDescription: form.conditionDescription,
        diagnosisCode: form.diagnosisCode,
        frequency: form.frequency,
        totalSessions: form.totalSessions,
        startDate: form.startDate,
        targetEndDate: form.targetEndDate || null,
        goals: form.goals,
        notes: form.notes,
        status: 'active',
      });

      const planId = planRes.data.id;

      // Add milestones
      for (const ms of form.milestones) {
        await treatmentPlansAPI.addMilestone(planId, {
          title: ms.title,
          targetDate: ms.targetDate || null,
          outcomeMeasure: ms.outcomeMeasure || null,
          targetScore: ms.targetScore ? parseFloat(ms.targetScore) : null,
        });
      }

      // Pre-generate sessions
      for (let i = 1; i <= form.totalSessions; i++) {
        await treatmentPlansAPI.addSession(planId, {
          sessionNumber: i,
        });
      }

      if (onCreated) onCreated(planRes.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setSubmitting(false);
    }
  }, [patientId, form, onCreated]);

  const renderStep = () => {
    switch (step) {
      case 0: // Condition
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plan Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => updateForm('title', e.target.value)}
                placeholder="e.g. Low Back Pain Rehabilitation"
                className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Condition Description
              </label>
              <textarea
                value={form.conditionDescription}
                onChange={(e) => updateForm('conditionDescription', e.target.value)}
                rows={3}
                placeholder="Describe the patient's condition..."
                className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Diagnosis Code (ICD/ICPC)
              </label>
              <input
                type="text"
                value={form.diagnosisCode}
                onChange={(e) => updateForm('diagnosisCode', e.target.value)}
                placeholder="e.g. M54.5"
                className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
          </div>
        );

      case 1: // Schedule
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
              <select
                value={form.frequency}
                onChange={(e) => updateForm('frequency', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                {FREQUENCY_OPTIONS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Sessions *
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={form.totalSessions}
                onChange={(e) => updateForm('totalSessions', parseInt(e.target.value) || 0)}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => updateForm('startDate', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target End Date
                </label>
                <input
                  type="date"
                  value={form.targetEndDate}
                  onChange={(e) => updateForm('targetEndDate', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => updateForm('notes', e.target.value)}
                rows={2}
                placeholder="Additional notes..."
                className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
          </div>
        );

      case 2: // Goals
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Define treatment goals for this plan:</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addGoal()}
                placeholder="e.g. Reduce pain to 3/10"
                className="flex-1 p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
              <button
                type="button"
                onClick={addGoal}
                className="px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {form.goals.length > 0 ? (
              <ul className="space-y-2">
                {form.goals.map((goal, idx) => (
                  <li key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <span className="flex-1 text-sm">{goal}</span>
                    <button
                      type="button"
                      onClick={() => removeGoal(idx)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400 italic">No goals added yet (optional)</p>
            )}
          </div>
        );

      case 3: // Milestones
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Add measurable milestones to track progress:</p>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={newMilestone.title}
                onChange={(e) => setNewMilestone((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Milestone title"
                className="p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
              />
              <input
                type="date"
                value={newMilestone.targetDate}
                onChange={(e) =>
                  setNewMilestone((prev) => ({ ...prev, targetDate: e.target.value }))
                }
                className="p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
              />
              <select
                value={newMilestone.outcomeMeasure}
                onChange={(e) =>
                  setNewMilestone((prev) => ({ ...prev, outcomeMeasure: e.target.value }))
                }
                className="p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Outcome measure (optional)</option>
                {OUTCOME_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={newMilestone.targetScore}
                  onChange={(e) =>
                    setNewMilestone((prev) => ({ ...prev, targetScore: e.target.value }))
                  }
                  placeholder="Target score"
                  className="flex-1 p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                />
                <button
                  type="button"
                  onClick={addMilestone}
                  disabled={!newMilestone.title.trim()}
                  className="px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            {form.milestones.length > 0 ? (
              <ul className="space-y-2">
                {form.milestones.map((ms, idx) => (
                  <li key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="text-sm font-medium">{ms.title}</div>
                      <div className="text-xs text-gray-500">
                        {ms.targetDate && `By ${ms.targetDate}`}
                        {ms.outcomeMeasure && ` | ${ms.outcomeMeasure}`}
                        {ms.targetScore && ` <= ${ms.targetScore}`}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMilestone(idx)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400 italic">No milestones added yet (optional)</p>
            )}
          </div>
        );

      case 4: // Review
        return (
          <div className="space-y-4 text-sm">
            <h4 className="font-semibold text-gray-800">Plan Summary</h4>
            <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="text-gray-500">Title:</span>{' '}
                <span className="font-medium">{form.title}</span>
              </div>
              <div>
                <span className="text-gray-500">Diagnosis:</span> {form.diagnosisCode || 'N/A'}
              </div>
              <div>
                <span className="text-gray-500">Frequency:</span> {form.frequency}
              </div>
              <div>
                <span className="text-gray-500">Sessions:</span> {form.totalSessions}
              </div>
              <div>
                <span className="text-gray-500">Start:</span> {form.startDate}
              </div>
              <div>
                <span className="text-gray-500">Target End:</span> {form.targetEndDate || 'N/A'}
              </div>
            </div>
            {form.conditionDescription && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-500">Condition:</span> {form.conditionDescription}
              </div>
            )}
            {form.goals.length > 0 && (
              <div>
                <span className="text-gray-500 font-medium">Goals ({form.goals.length}):</span>
                <ul className="mt-1 list-disc list-inside">
                  {form.goals.map((g, i) => (
                    <li key={i}>{g}</li>
                  ))}
                </ul>
              </div>
            )}
            {form.milestones.length > 0 && (
              <div>
                <span className="text-gray-500 font-medium">
                  Milestones ({form.milestones.length}):
                </span>
                <ul className="mt-1 list-disc list-inside">
                  {form.milestones.map((ms, i) => (
                    <li key={i}>
                      {ms.title}
                      {ms.outcomeMeasure && ` (${ms.outcomeMeasure} <= ${ms.targetScore})`}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-teal-600" />
        <h3 className="text-lg font-semibold text-gray-800">New Treatment Plan</h3>
      </div>

      <StepIndicator currentStep={step} />

      {renderStep()}

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
        <div>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canAdvance()}
              className="flex items-center gap-1 px-4 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-1 px-4 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Creating...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" /> Create Plan
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
