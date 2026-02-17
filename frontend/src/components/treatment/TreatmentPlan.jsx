/**
 * Treatment Plan Component
 *
 * Comprehensive care plan management:
 * - Phase-based treatment protocols
 * - Goal setting and tracking
 * - Visit frequency recommendations
 * - Progress milestones
 * - Re-evaluation scheduling
 *
 * Bilingual: English/Norwegian
 */

import { useState, useMemo } from 'react';

// =============================================================================
// TRANSLATIONS
// =============================================================================

const TRANSLATIONS = {
  en: {
    treatmentPlan: 'Treatment Plan',
    newPlan: 'New Treatment Plan',
    editPlan: 'Edit Plan',
    activePlan: 'Active Plan',
    completedPlans: 'Completed Plans',
    noPlan: 'No active treatment plan',
    createPlan: 'Create Treatment Plan',
    diagnosis: 'Diagnosis',
    chiefComplaint: 'Chief Complaint',
    startDate: 'Start Date',
    expectedDuration: 'Expected Duration',
    weeks: 'weeks',
    totalVisits: 'Total Visits',
    visitsCompleted: 'Visits Completed',
    visitsRemaining: 'Visits Remaining',
    progress: 'Progress',
    phase: 'Phase',
    phases: 'Phases',
    goals: 'Goals',
    addGoal: 'Add Goal',
    goalDescription: 'Goal Description',
    targetDate: 'Target Date',
    achieved: 'Achieved',
    pending: 'Pending',
    frequency: 'Visit Frequency',
    perWeek: 'per week',
    nextReeval: 'Next Re-evaluation',
    notes: 'Notes',
    save: 'Save Plan',
    cancel: 'Cancel',
    delete: 'Delete Plan',
    complete: 'Mark Complete',
    reactivate: 'Reactivate',
    templates: 'Templates',
    useTemplate: 'Use Template',
    customPlan: 'Custom Plan',
    acuteCare: 'Acute Care',
    correctiveCare: 'Corrective Care',
    maintenanceCare: 'Maintenance Care',
    rehabilitative: 'Rehabilitative',
    painRelief: 'Pain Relief',
    functionRestoration: 'Function Restoration',
    stabilization: 'Stabilization',
    wellness: 'Wellness',
    initialIntensive: 'Initial/Intensive',
    corrective: 'Corrective',
    maintenance: 'Maintenance',
    dischargeCriteria: 'Discharge Criteria',
    contraindications: 'Contraindications',
    precautions: 'Precautions',
    homeExercises: 'Home Exercises',
    recommendations: 'Recommendations',
    visitHistory: 'Visit History',
    daysAgo: 'days ago',
    today: 'Today',
    tomorrow: 'Tomorrow',
    overdue: 'Overdue',
    onTrack: 'On Track',
    aheadOfSchedule: 'Ahead of Schedule',
    behindSchedule: 'Behind Schedule',
  },
  no: {
    treatmentPlan: 'Behandlingsplan',
    newPlan: 'Ny behandlingsplan',
    editPlan: 'Rediger plan',
    activePlan: 'Aktiv plan',
    completedPlans: 'Fullførte planer',
    noPlan: 'Ingen aktiv behandlingsplan',
    createPlan: 'Opprett behandlingsplan',
    diagnosis: 'Diagnose',
    chiefComplaint: 'Hovedplage',
    startDate: 'Startdato',
    expectedDuration: 'Forventet varighet',
    weeks: 'uker',
    totalVisits: 'Totale besøk',
    visitsCompleted: 'Besøk fullført',
    visitsRemaining: 'Besøk gjenstående',
    progress: 'Fremgang',
    phase: 'Fase',
    phases: 'Faser',
    goals: 'Mål',
    addGoal: 'Legg til mål',
    goalDescription: 'Målbeskrivelse',
    targetDate: 'Måldato',
    achieved: 'Oppnådd',
    pending: 'Venter',
    frequency: 'Besøksfrekvens',
    perWeek: 'per uke',
    nextReeval: 'Neste evaluering',
    notes: 'Notater',
    save: 'Lagre plan',
    cancel: 'Avbryt',
    delete: 'Slett plan',
    complete: 'Merk fullført',
    reactivate: 'Reaktiver',
    templates: 'Maler',
    useTemplate: 'Bruk mal',
    customPlan: 'Tilpasset plan',
    acuteCare: 'Akuttbehandling',
    correctiveCare: 'Korrigerende behandling',
    maintenanceCare: 'Vedlikeholdsbehandling',
    rehabilitative: 'Rehabilitering',
    painRelief: 'Smertelindring',
    functionRestoration: 'Funksjonsgjennoppretting',
    stabilization: 'Stabilisering',
    wellness: 'Velvære',
    initialIntensive: 'Initial/Intensiv',
    corrective: 'Korrigerende',
    maintenance: 'Vedlikehold',
    dischargeCriteria: 'Utskrivningskriterier',
    contraindications: 'Kontraindikasjoner',
    precautions: 'Forsiktighetsregler',
    homeExercises: 'Hjemmeøvelser',
    recommendations: 'Anbefalinger',
    visitHistory: 'Besøkshistorikk',
    daysAgo: 'dager siden',
    today: 'I dag',
    tomorrow: 'I morgen',
    overdue: 'Forsinket',
    onTrack: 'På skjema',
    aheadOfSchedule: 'Foran skjema',
    behindSchedule: 'Bak skjema',
  },
};

// =============================================================================
// PLAN TEMPLATES
// =============================================================================

export const PLAN_TEMPLATES = {
  acute: {
    id: 'acute',
    name: { en: 'Acute Care', no: 'Akuttbehandling' },
    description: {
      en: 'Short-term pain relief and symptom reduction',
      no: 'Kortsiktig smertelindring og symptomreduksjon',
    },
    duration: 2, // weeks
    phases: [
      {
        name: { en: 'Intensive', no: 'Intensiv' },
        weeks: 1,
        frequency: 3,
        goals: [
          { en: 'Reduce pain by 50%', no: 'Redusere smerte med 50%' },
          { en: 'Decrease inflammation', no: 'Redusere betennelse' },
        ],
      },
      {
        name: { en: 'Stabilization', no: 'Stabilisering' },
        weeks: 1,
        frequency: 2,
        goals: [
          { en: 'Maintain pain relief', no: 'Opprettholde smertelindring' },
          { en: 'Begin functional exercises', no: 'Starte funksjonelle øvelser' },
        ],
      },
    ],
    totalVisits: 5,
  },
  corrective: {
    id: 'corrective',
    name: { en: 'Corrective Care', no: 'Korrigerende behandling' },
    description: {
      en: 'Address underlying dysfunction and restore function',
      no: 'Behandle underliggende dysfunksjon og gjenopprette funksjon',
    },
    duration: 8,
    phases: [
      {
        name: { en: 'Initial Intensive', no: 'Initial intensiv' },
        weeks: 2,
        frequency: 3,
        goals: [
          { en: 'Reduce pain to manageable levels', no: 'Redusere smerte til håndterbare nivåer' },
          { en: 'Improve range of motion by 25%', no: 'Forbedre bevegelighet med 25%' },
        ],
      },
      {
        name: { en: 'Corrective', no: 'Korrigerende' },
        weeks: 4,
        frequency: 2,
        goals: [
          { en: 'Restore normal joint function', no: 'Gjenopprette normal leddfunksjon' },
          { en: 'Strengthen supporting muscles', no: 'Styrke støttemuskulatur' },
          { en: 'Improve posture', no: 'Forbedre holdning' },
        ],
      },
      {
        name: { en: 'Stabilization', no: 'Stabilisering' },
        weeks: 2,
        frequency: 1,
        goals: [
          { en: 'Maintain corrections', no: 'Opprettholde korreksjoner' },
          { en: 'Build endurance', no: 'Bygge utholdenhet' },
        ],
      },
    ],
    totalVisits: 16,
  },
  maintenance: {
    id: 'maintenance',
    name: { en: 'Maintenance Care', no: 'Vedlikeholdsbehandling' },
    description: {
      en: 'Prevent recurrence and maintain optimal function',
      no: 'Forhindre tilbakefall og opprettholde optimal funksjon',
    },
    duration: 12,
    phases: [
      {
        name: { en: 'Maintenance', no: 'Vedlikehold' },
        weeks: 12,
        frequency: 0.5, // Every 2 weeks
        goals: [
          { en: 'Prevent symptom recurrence', no: 'Forhindre symptomtilbakefall' },
          { en: 'Maintain spinal health', no: 'Opprettholde ryggradhelse' },
          { en: 'Support overall wellness', no: 'Støtte generell velvære' },
        ],
      },
    ],
    totalVisits: 6,
  },
  rehabilitative: {
    id: 'rehabilitative',
    name: { en: 'Rehabilitative', no: 'Rehabilitering' },
    description: {
      en: 'Post-injury or post-surgical rehabilitation',
      no: 'Rehabilitering etter skade eller operasjon',
    },
    duration: 12,
    phases: [
      {
        name: { en: 'Protection', no: 'Beskyttelse' },
        weeks: 2,
        frequency: 3,
        goals: [
          { en: 'Control pain and swelling', no: 'Kontrollere smerte og hevelse' },
          { en: 'Protect healing tissues', no: 'Beskytte helende vev' },
        ],
      },
      {
        name: { en: 'Controlled Motion', no: 'Kontrollert bevegelse' },
        weeks: 4,
        frequency: 2,
        goals: [
          { en: 'Restore range of motion', no: 'Gjenopprette bevegelighet' },
          { en: 'Begin gentle strengthening', no: 'Starte forsiktig styrking' },
        ],
      },
      {
        name: { en: 'Strengthening', no: 'Styrking' },
        weeks: 4,
        frequency: 2,
        goals: [
          { en: 'Build strength', no: 'Bygge styrke' },
          { en: 'Improve endurance', no: 'Forbedre utholdenhet' },
        ],
      },
      {
        name: { en: 'Return to Activity', no: 'Tilbake til aktivitet' },
        weeks: 2,
        frequency: 1,
        goals: [
          { en: 'Return to normal activities', no: 'Tilbake til normale aktiviteter' },
          { en: 'Sport-specific training', no: 'Idrettsspesifikk trening' },
        ],
      },
    ],
    totalVisits: 22,
  },
};

// =============================================================================
// COMPONENTS
// =============================================================================

/**
 * Phase Progress Card
 */
function PhaseCard({ phase, index, currentPhaseIndex, _visits, lang }) {
  const t = TRANSLATIONS[lang];
  const isActive = index === currentPhaseIndex;
  const isComplete = index < currentPhaseIndex;

  return (
    <div
      className={`p-4 rounded-lg border-2 transition-all ${
        isActive
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : isComplete
            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
            : 'border-gray-200 dark:border-gray-700'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              isComplete
                ? 'bg-green-500 text-white'
                : isActive
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}
          >
            {isComplete ? '✓' : index + 1}
          </span>
          <span className="font-semibold text-gray-900 dark:text-white">{phase.name[lang]}</span>
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {phase.weeks} {t.weeks}
        </span>
      </div>

      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
        {phase.frequency} × {t.perWeek}
      </div>

      <ul className="space-y-1">
        {phase.goals.map((goal, i) => (
          <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
            <span className="text-gray-400">•</span>
            {goal[lang]}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Goal Tracker
 */
function GoalTracker({ goals, onToggle, lang }) {
  const t = TRANSLATIONS[lang];

  return (
    <div className="space-y-3">
      {goals.map((goal) => (
        <div
          key={goal.id}
          className={`p-3 rounded-lg border flex items-start gap-3 cursor-pointer transition-all ${
            goal.achieved
              ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
          }`}
          onClick={() => onToggle(goal.id)}
        >
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
              goal.achieved
                ? 'bg-green-500 text-white'
                : 'border-2 border-gray-300 dark:border-gray-600'
            }`}
          >
            {goal.achieved && '✓'}
          </div>
          <div className="flex-1">
            <div
              className={`font-medium ${goal.achieved ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}`}
            >
              {goal.description}
            </div>
            {goal.targetDate && (
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {t.targetDate}:{' '}
                {new Date(goal.targetDate).toLocaleDateString(lang === 'no' ? 'nb-NO' : 'en-US')}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Visit Progress Bar
 */
function VisitProgress({ completed, total, lang }) {
  const t = TRANSLATIONS[lang];
  const percentage = (completed / total) * 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">
          {completed} / {total} {t.visitsCompleted.toLowerCase()}
        </span>
        <span className="font-medium text-gray-900 dark:text-white">{Math.round(percentage)}%</span>
      </div>
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Template Selector
 */
function TemplateSelector({ onSelect, lang }) {
  const t = TRANSLATIONS[lang];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Object.values(PLAN_TEMPLATES).map((template) => (
        <button
          key={template.id}
          onClick={() => onSelect(template)}
          className="p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 text-left transition-all"
        >
          <h4 className="font-semibold text-gray-900 dark:text-white">{template.name[lang]}</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {template.description[lang]}
          </p>
          <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
            <span>
              {template.duration} {t.weeks}
            </span>
            <span>
              {template.totalVisits} {t.totalVisits.toLowerCase()}
            </span>
            <span>
              {template.phases.length} {t.phases.toLowerCase()}
            </span>
          </div>
        </button>
      ))}

      <button
        onClick={() => onSelect(null)}
        className="p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-500 text-left transition-all"
      >
        <h4 className="font-semibold text-gray-900 dark:text-white">{t.customPlan}</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {lang === 'en'
            ? 'Create a fully customized treatment plan'
            : 'Opprett en helt tilpasset behandlingsplan'}
        </p>
      </button>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function TreatmentPlan({ _patientId, plan, onSave, _onDelete, lang = 'en' }) {
  const t = TRANSLATIONS[lang];
  const [isEditing, setIsEditing] = useState(!plan);
  const [showTemplates, setShowTemplates] = useState(!plan);
  const [formData, setFormData] = useState(
    plan || {
      diagnosis: '',
      chiefComplaint: '',
      startDate: new Date().toISOString().split('T')[0],
      phases: [],
      goals: [],
      totalVisits: 0,
      visitsCompleted: 0,
      notes: '',
    }
  );

  // Calculate current phase
  const currentPhaseIndex = useMemo(() => {
    if (!formData.phases || formData.phases.length === 0) {
      return 0;
    }

    let visitsInPhases = 0;
    for (let i = 0; i < formData.phases.length; i++) {
      visitsInPhases += formData.phases[i].weeks * formData.phases[i].frequency;
      if (formData.visitsCompleted < visitsInPhases) {
        return i;
      }
    }
    return formData.phases.length - 1;
  }, [formData.phases, formData.visitsCompleted]);

  // Handle template selection
  const handleTemplateSelect = (template) => {
    if (template) {
      setFormData({
        ...formData,
        phases: template.phases,
        totalVisits: template.totalVisits,
        goals: template.phases.flatMap((phase, phaseIndex) =>
          phase.goals.map((goal, goalIndex) => ({
            id: `${phaseIndex}-${goalIndex}`,
            description: goal[lang],
            phase: phaseIndex,
            achieved: false,
          }))
        ),
      });
    }
    setShowTemplates(false);
    setIsEditing(true);
  };

  // Handle goal toggle
  const handleGoalToggle = (goalId) => {
    setFormData((prev) => ({
      ...prev,
      goals: prev.goals.map((g) => (g.id === goalId ? { ...g, achieved: !g.achieved } : g)),
    }));
  };

  // Handle save
  const handleSave = () => {
    if (onSave) {
      onSave(formData);
    }
    setIsEditing(false);
  };

  // Show template selector
  if (showTemplates) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{t.newPlan}</h2>
        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">{t.templates}</h3>
        <TemplateSelector onSelect={handleTemplateSelect} lang={lang} />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t.treatmentPlan}</h2>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  {t.editPlan}
                </button>
                <button
                  onClick={() => setShowTemplates(true)}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {t.newPlan}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {t.save}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Diagnosis & Chief Complaint */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t.diagnosis}
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.diagnosis}
                onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            ) : (
              <p className="text-gray-900 dark:text-white">{formData.diagnosis || '-'}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t.chiefComplaint}
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.chiefComplaint}
                onChange={(e) => setFormData({ ...formData, chiefComplaint: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            ) : (
              <p className="text-gray-900 dark:text-white">{formData.chiefComplaint || '-'}</p>
            )}
          </div>
        </div>

        {/* Visit Progress */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{t.progress}</h3>
          <VisitProgress
            completed={formData.visitsCompleted}
            total={formData.totalVisits}
            lang={lang}
          />
        </div>

        {/* Phases */}
        {formData.phases && formData.phases.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{t.phases}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {formData.phases.map((phase, index) => (
                <PhaseCard
                  key={index}
                  phase={phase}
                  index={index}
                  currentPhaseIndex={currentPhaseIndex}
                  visits={formData.visitsCompleted}
                  lang={lang}
                />
              ))}
            </div>
          </div>
        )}

        {/* Goals */}
        {formData.goals && formData.goals.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{t.goals}</h3>
            <GoalTracker goals={formData.goals} onToggle={handleGoalToggle} lang={lang} />
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t.notes}
          </label>
          {isEditing ? (
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          ) : (
            <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
              {formData.notes || '-'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Named exports
export { PhaseCard, GoalTracker, VisitProgress, TemplateSelector };
