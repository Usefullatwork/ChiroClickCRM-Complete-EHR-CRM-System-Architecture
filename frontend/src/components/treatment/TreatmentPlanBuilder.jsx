/**
 * TreatmentPlanBuilder - Wizard for creating treatment plans via API
 *
 * Steps:
 * 1. Select template or custom
 * 2. Configure condition, frequency, sessions, goals
 * 3. Add milestones with outcome measures
 * 4. Review and save
 */

import React, { useState, _useEffect } from 'react';
import { treatmentPlansAPI } from '../../services/api';
import { PLAN_TEMPLATES } from './TreatmentPlan';

const STEPS = ['template', 'details', 'milestones', 'review'];

export default function TreatmentPlanBuilder({ patientId, onCreated, onCancel, lang = 'no' }) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    patientId,
    title: '',
    conditionDescription: '',
    diagnosisCode: '',
    frequency: '',
    totalSessions: 12,
    startDate: new Date().toISOString().split('T')[0],
    targetEndDate: '',
    goals: [],
    notes: '',
  });

  const [milestones, setMilestones] = useState([]);

  const t =
    lang === 'no'
      ? {
          selectTemplate: 'Velg mal',
          customPlan: 'Tilpasset plan',
          planDetails: 'Plandetaljer',
          milestonesTitle: 'Milepæler',
          review: 'Gjennomgang',
          title: 'Tittel',
          condition: 'Tilstand',
          diagnosisCode: 'Diagnosekode',
          frequency: 'Frekvens',
          totalSessions: 'Totalt antall besøk',
          startDate: 'Startdato',
          targetEndDate: 'Måldato',
          goals: 'Mål',
          addGoal: 'Legg til mål',
          notes: 'Notater',
          next: 'Neste',
          back: 'Tilbake',
          save: 'Lagre plan',
          cancel: 'Avbryt',
          milestoneTitle: 'Milepæltittel',
          milestoneDescription: 'Beskrivelse',
          targetDate: 'Måldato',
          outcomeMeasure: 'Utfallsmål',
          targetScore: 'Målscore',
          addMilestone: 'Legg til milepæl',
          removeMilestone: 'Fjern',
          removeGoal: 'Fjern',
          saving: 'Lagrer...',
          errorCreating: 'Kunne ikke opprette plan',
          perWeek: 'per uke',
          sessions: 'besøk',
          noMilestones: 'Ingen milepæler lagt til',
          optional: '(valgfritt)',
        }
      : {
          selectTemplate: 'Select Template',
          customPlan: 'Custom Plan',
          planDetails: 'Plan Details',
          milestonesTitle: 'Milestones',
          review: 'Review',
          title: 'Title',
          condition: 'Condition',
          diagnosisCode: 'Diagnosis Code',
          frequency: 'Frequency',
          totalSessions: 'Total Sessions',
          startDate: 'Start Date',
          targetEndDate: 'Target End Date',
          goals: 'Goals',
          addGoal: 'Add Goal',
          notes: 'Notes',
          next: 'Next',
          back: 'Back',
          save: 'Save Plan',
          cancel: 'Cancel',
          milestoneTitle: 'Milestone Title',
          milestoneDescription: 'Description',
          targetDate: 'Target Date',
          outcomeMeasure: 'Outcome Measure',
          targetScore: 'Target Score',
          addMilestone: 'Add Milestone',
          removeMilestone: 'Remove',
          removeGoal: 'Remove',
          saving: 'Saving...',
          errorCreating: 'Failed to create plan',
          perWeek: 'per week',
          sessions: 'sessions',
          noMilestones: 'No milestones added',
          optional: '(optional)',
        };

  const handleTemplateSelect = (template) => {
    if (template) {
      const templateGoals = template.phases.flatMap((phase) =>
        phase.goals.map((g) => g[lang] || g.en)
      );
      setFormData((prev) => ({
        ...prev,
        title: template.name[lang] || template.name.en,
        totalSessions: template.totalVisits,
        frequency: template.phases[0]?.frequency
          ? `${template.phases[0].frequency}x ${t.perWeek}`
          : '',
        goals: templateGoals,
      }));

      // Auto-create milestones from phases
      let _visitCount = 0;
      const autoMilestones = template.phases.map((phase, i) => {
        _visitCount += phase.weeks * phase.frequency;
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + phase.weeks * 7 * (i + 1));
        return {
          title: phase.name[lang] || phase.name.en,
          description: phase.goals.map((g) => g[lang] || g.en).join(', '),
          targetDate: targetDate.toISOString().split('T')[0],
          outcomeMeasure: '',
          targetScore: '',
        };
      });
      setMilestones(autoMilestones);
    }
    setStep(1);
  };

  const addGoal = () => {
    setFormData((prev) => ({ ...prev, goals: [...prev.goals, ''] }));
  };

  const updateGoal = (index, value) => {
    setFormData((prev) => ({
      ...prev,
      goals: prev.goals.map((g, i) => (i === index ? value : g)),
    }));
  };

  const removeGoal = (index) => {
    setFormData((prev) => ({
      ...prev,
      goals: prev.goals.filter((_, i) => i !== index),
    }));
  };

  const addMilestone = () => {
    setMilestones((prev) => [
      ...prev,
      {
        title: '',
        description: '',
        targetDate: '',
        outcomeMeasure: '',
        targetScore: '',
      },
    ]);
  };

  const updateMilestone = (index, field, value) => {
    setMilestones((prev) => prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)));
  };

  const removeMilestone = (index) => {
    setMilestones((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      // Create the plan
      const planResponse = await treatmentPlansAPI.createPlan({
        patientId: formData.patientId,
        title: formData.title,
        conditionDescription: formData.conditionDescription,
        diagnosisCode: formData.diagnosisCode,
        frequency: formData.frequency,
        totalSessions: formData.totalSessions,
        startDate: formData.startDate,
        targetEndDate: formData.targetEndDate || null,
        goals: formData.goals.filter((g) => g.trim()),
        notes: formData.notes,
      });

      const plan = planResponse.data;

      // Add milestones
      for (const milestone of milestones) {
        if (milestone.title.trim()) {
          await treatmentPlansAPI.addMilestone(plan.id, {
            title: milestone.title,
            description: milestone.description,
            targetDate: milestone.targetDate || null,
            outcomeMeasure: milestone.outcomeMeasure || null,
            targetScore: milestone.targetScore ? parseFloat(milestone.targetScore) : null,
          });
        }
      }

      // Pre-create session slots
      for (let i = 1; i <= formData.totalSessions; i++) {
        await treatmentPlansAPI.addSession(plan.id, {
          sessionNumber: i,
        });
      }

      if (onCreated) {
        onCreated(plan);
      }
    } catch (err) {
      setError(err.response?.data?.error || t.errorCreating);
    } finally {
      setSaving(false);
    }
  };

  // Step 0: Template selection
  if (step === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{t.selectTemplate}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.values(PLAN_TEMPLATES).map((template) => (
            <button
              key={template.id}
              onClick={() => handleTemplateSelect(template)}
              className="p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 text-left transition-all"
            >
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {template.name[lang] || template.name.en}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {template.description[lang] || template.description.en}
              </p>
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                <span>
                  {template.duration} {lang === 'no' ? 'uker' : 'weeks'}
                </span>
                <span>
                  {template.totalVisits} {t.sessions}
                </span>
              </div>
            </button>
          ))}

          <button
            onClick={() => handleTemplateSelect(null)}
            className="p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-500 text-left transition-all"
          >
            <h4 className="font-semibold text-gray-900 dark:text-white">{t.customPlan}</h4>
          </button>
        </div>

        {onCancel && (
          <button
            onClick={onCancel}
            className="mt-4 px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            {t.cancel}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      {/* Step indicator */}
      <div className="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          {STEPS.slice(1).map((s, i) => (
            <React.Fragment key={s}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  i + 1 < step
                    ? 'bg-green-500 text-white'
                    : i + 1 === step
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                }`}
              >
                {i + 1 < step ? '✓' : i + 1}
              </div>
              {i < STEPS.length - 2 && (
                <div
                  className={`flex-1 h-0.5 ${i + 1 < step ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {step === 1 ? t.planDetails : step === 2 ? t.milestonesTitle : t.review}
        </h2>
      </div>

      <div className="p-6 space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Step 1: Details */}
        {step === 1 && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t.title}
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.condition}
                </label>
                <input
                  type="text"
                  value={formData.conditionDescription}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, conditionDescription: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.diagnosisCode} {t.optional}
                </label>
                <input
                  type="text"
                  value={formData.diagnosisCode}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, diagnosisCode: e.target.value }))
                  }
                  placeholder="L03, L83..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.frequency}
                </label>
                <input
                  type="text"
                  value={formData.frequency}
                  onChange={(e) => setFormData((prev) => ({ ...prev, frequency: e.target.value }))}
                  placeholder={`2x ${t.perWeek}`}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.totalSessions}
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.totalSessions}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      totalSessions: parseInt(e.target.value) || 1,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.startDate}
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t.goals}
              </label>
              <div className="space-y-2">
                {formData.goals.map((goal, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="text"
                      value={goal}
                      onChange={(e) => updateGoal(i, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <button
                      onClick={() => removeGoal(i)}
                      className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      {t.removeGoal}
                    </button>
                  </div>
                ))}
                <button
                  onClick={addGoal}
                  className="px-4 py-2 text-sm border border-dashed border-gray-300 rounded-lg hover:border-blue-500 text-gray-600 hover:text-blue-600"
                >
                  + {t.addGoal}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t.notes} {t.optional}
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </>
        )}

        {/* Step 2: Milestones */}
        {step === 2 && (
          <>
            <div className="space-y-4">
              {milestones.map((m, i) => (
                <div
                  key={i}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">#{i + 1}</span>
                    <button
                      onClick={() => removeMilestone(i)}
                      className="text-sm text-red-500 hover:text-red-700"
                    >
                      {t.removeMilestone}
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      {t.milestoneTitle}
                    </label>
                    <input
                      type="text"
                      value={m.title}
                      onChange={(e) => updateMilestone(i, 'title', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        {t.targetDate}
                      </label>
                      <input
                        type="date"
                        value={m.targetDate}
                        onChange={(e) => updateMilestone(i, 'targetDate', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        {t.outcomeMeasure}
                      </label>
                      <select
                        value={m.outcomeMeasure}
                        onChange={(e) => updateMilestone(i, 'outcomeMeasure', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">--</option>
                        <option value="VAS">VAS</option>
                        <option value="NPRS">NPRS</option>
                        <option value="ODI">ODI</option>
                        <option value="NDI">NDI</option>
                        <option value="DASH">DASH</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        {t.targetScore}
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={m.targetScore}
                        onChange={(e) => updateMilestone(i, 'targetScore', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {milestones.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">{t.noMilestones}</p>
              )}

              <button
                onClick={addMilestone}
                className="w-full px-4 py-2 text-sm border border-dashed border-gray-300 rounded-lg hover:border-blue-500 text-gray-600 hover:text-blue-600"
              >
                + {t.addMilestone}
              </button>
            </div>
          </>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">{t.title}:</span>
                <p className="font-medium text-gray-900 dark:text-white">{formData.title}</p>
              </div>
              <div>
                <span className="text-gray-500">{t.condition}:</span>
                <p className="font-medium text-gray-900 dark:text-white">
                  {formData.conditionDescription || '-'}
                </p>
              </div>
              <div>
                <span className="text-gray-500">{t.frequency}:</span>
                <p className="font-medium text-gray-900 dark:text-white">
                  {formData.frequency || '-'}
                </p>
              </div>
              <div>
                <span className="text-gray-500">{t.totalSessions}:</span>
                <p className="font-medium text-gray-900 dark:text-white">
                  {formData.totalSessions}
                </p>
              </div>
              <div>
                <span className="text-gray-500">{t.startDate}:</span>
                <p className="font-medium text-gray-900 dark:text-white">{formData.startDate}</p>
              </div>
            </div>

            {formData.goals.length > 0 && (
              <div>
                <span className="text-sm text-gray-500">{t.goals}:</span>
                <ul className="mt-1 space-y-1">
                  {formData.goals
                    .filter((g) => g.trim())
                    .map((g, i) => (
                      <li
                        key={i}
                        className="text-sm text-gray-900 dark:text-white flex items-start gap-2"
                      >
                        <span className="text-gray-400 mt-0.5">-</span> {g}
                      </li>
                    ))}
                </ul>
              </div>
            )}

            {milestones.length > 0 && (
              <div>
                <span className="text-sm text-gray-500">
                  {t.milestonesTitle} ({milestones.length}):
                </span>
                <div className="mt-1 space-y-2">
                  {milestones
                    .filter((m) => m.title.trim())
                    .map((m, i) => (
                      <div key={i} className="text-sm p-2 bg-gray-50 dark:bg-gray-700 rounded">
                        <span className="font-medium">{m.title}</span>
                        {m.outcomeMeasure && (
                          <span className="ml-2 text-gray-500">
                            {m.outcomeMeasure} {m.targetScore ? `<= ${m.targetScore}` : ''}
                          </span>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <button
          onClick={step === 1 ? () => setStep(0) : () => setStep(step - 1)}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          {t.back}
        </button>

        <div className="flex gap-2">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              {t.cancel}
            </button>
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={step === 1 && !formData.title.trim()}
              className="px-6 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t.next}
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? t.saving : t.save}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
