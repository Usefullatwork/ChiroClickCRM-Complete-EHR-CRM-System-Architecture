import { lazy, Suspense } from 'react';
import { Activity, Target, Settings } from 'lucide-react';
import EnhancedClinicalTextarea from '../clinical/EnhancedClinicalTextarea';
import { TaksterPanel } from './TaksterPanel';
import { useFeatureModule } from '../../context/FeatureModuleContext';
import { useTranslation } from '../../i18n/useTranslation';

const BodyChartPanel = lazy(() => import('../examination/BodyChartPanel'));
const AnatomicalBodyChart = lazy(() => import('../examination/AnatomicalBodyChart'));
const ActivatorMethodPanel = lazy(() => import('../examination/ActivatorMethodPanel'));
const FacialLinesChart = lazy(() => import('../examination/FacialLinesChart'));
const ExercisePanel = lazy(() => import('../exercises/ExercisePanel'));

export function PlanSection({
  encounterData,
  setEncounterData,
  isSigned,
  updateField,
  clinicalPrefs,
  currentNotationMethod,
  getNotationName,
  isVisualNotation,
  clinicalLang,
  notationData,
  setNotationData,
  setNotationNarrative,
  navigate,
  selectedTakster,
  toggleTakst,
  showTakster,
  setShowTakster,
  totalPrice,
  showExercisePanel,
  setShowExercisePanel,
  patientId,
  encounterId,
  suggestedCMTCode,
}) {
  const { isModuleEnabled } = useFeatureModule();
  const { t } = useTranslation('clinical');

  return (
    <section
      key="plan"
      data-testid="encounter-plan"
      className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
    >
      <div className="px-4 py-3 bg-gradient-to-r from-purple-50 to-white border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <span className="bg-purple-600 text-white h-6 w-6 rounded-md flex items-center justify-center text-sm font-bold">
            P
          </span>
          {t('planAndTreatment', 'Plan & Behandling')}
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 dark:text-slate-400">VAS Slutt:</span>
          <input
            type="range"
            min="0"
            max="10"
            value={encounterData.vas_pain_end || 0}
            onChange={(e) =>
              setEncounterData((prev) => ({
                ...prev,
                vas_pain_end: parseInt(e.target.value),
              }))
            }
            disabled={isSigned}
            className="w-20 h-1.5 accent-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <span className="text-sm font-semibold text-purple-600 w-6">
            {encounterData.vas_pain_end || 0}
          </span>
        </div>
      </div>
      <div className="p-4 space-y-4">
        {/* Treatment Notation Method Indicator */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700">
              {t('treatmentNotation', 'Behandlingsnotasjon:')}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-medium">
              <Target className="h-3 w-3" />
              {getNotationName()}
            </span>
          </div>
          <button
            onClick={() => navigate('/settings')}
            className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 flex items-center gap-1"
          >
            <Settings className="h-3 w-3" />
            {t('changeInSettings', 'Endre i innstillinger')}
          </button>
        </div>

        {/* CMT code suggestion from anatomy findings */}
        {suggestedCMTCode && !isSigned && (
          <div className="p-3 bg-purple-50 border border-purple-100 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-purple-700">
                {t('treatmentCode', 'Behandlingskode:')}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                {suggestedCMTCode.code}
              </span>
              <span className="text-xs text-purple-600">
                {suggestedCMTCode.name} ({suggestedCMTCode.regions} spinalregioner)
              </span>
            </div>
          </div>
        )}

        {/* Treatment Performed - Conditional Rendering Based on Notation Method */}
        {isVisualNotation ? (
          <Suspense fallback={<div className="animate-pulse h-64 bg-gray-100 rounded" />}>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              {currentNotationMethod.id === 'body_chart' && (
                <BodyChartPanel
                  value={notationData}
                  onChange={setNotationData}
                  onGenerateNarrative={(narrative) => {
                    setNotationNarrative(narrative);
                    updateField('plan', 'treatment', narrative);
                  }}
                  lang={clinicalLang}
                  readOnly={isSigned}
                />
              )}
              {currentNotationMethod.id === 'anatomical_chart' && (
                <AnatomicalBodyChart
                  value={notationData}
                  onChange={setNotationData}
                  onGenerateNarrative={(narrative) => {
                    setNotationNarrative(narrative);
                    updateField('plan', 'treatment', narrative);
                  }}
                  lang={clinicalLang}
                  showDermatomes={clinicalPrefs.showDermatomes}
                  showTriggerPoints={clinicalPrefs.showTriggerPoints}
                  readOnly={isSigned}
                />
              )}
              {currentNotationMethod.id === 'activator_protocol' && (
                <ActivatorMethodPanel
                  value={notationData}
                  onChange={setNotationData}
                  onGenerateNarrative={(narrative) => {
                    setNotationNarrative(narrative);
                    updateField('plan', 'treatment', narrative);
                  }}
                  lang={clinicalLang}
                  readOnly={isSigned}
                />
              )}
              {currentNotationMethod.id === 'facial_lines' && (
                <FacialLinesChart
                  value={notationData}
                  onChange={setNotationData}
                  onGenerateNarrative={(narrative) => {
                    setNotationNarrative(narrative);
                    updateField('plan', 'treatment', narrative);
                  }}
                  lang={clinicalLang}
                  readOnly={isSigned}
                />
              )}
            </div>
          </Suspense>
        ) : (
          <EnhancedClinicalTextarea
            value={encounterData.plan.treatment}
            onChange={(val) => updateField('plan', 'treatment', val)}
            placeholder={
              currentNotationMethod.id === 'segment_listing'
                ? 'Segmentlisting: f.eks. C5 PRS, T4-T6 anterior, L5 PLI...'
                : currentNotationMethod.id === 'gonstead_listing'
                  ? 'Gonstead: f.eks. Atlas ASLA, C2 PRSA, L5 PLI-M...'
                  : currentNotationMethod.id === 'diversified_notation'
                    ? 'Diversifisert: beskriv manipulasjoner og mobiliseringer...'
                    : currentNotationMethod.id === 'soap_narrative'
                      ? 'SOAP narrativ: beskriv behandlingen i detalj...'
                      : 'Utf\u00F8rt behandling...'
            }
            label={t('treatment', 'Behandling')}
            section="plan"
            field="treatment"
            disabled={isSigned}
            rows={3}
            showVoiceInput={true}
            showAIButton={false}
          />
        )}

        {/* Takster Panel */}
        <TaksterPanel
          selectedTakster={selectedTakster}
          onToggleTakst={toggleTakst}
          showTakster={showTakster}
          onToggleShow={() => setShowTakster(!showTakster)}
          totalPrice={totalPrice}
          isSigned={isSigned}
        />

        {/* Exercises & Advice */}
        {isModuleEnabled('exercise_rx') && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">
                {t('homeExercises', 'Hjemmeøvelser')}
              </span>
              <button
                onClick={() => setShowExercisePanel(!showExercisePanel)}
                disabled={isSigned}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                <Activity className="w-3.5 h-3.5" />
                {showExercisePanel
                  ? t('hideExerciseLibrary', 'Skjul øvelsesbibliotek')
                  : t('chooseFromLibrary', 'Velg fra bibliotek')}
              </button>
            </div>
            {showExercisePanel && (
              <Suspense
                fallback={
                  <div className="animate-pulse bg-green-50 rounded-lg h-24 border border-green-200" />
                }
              >
                <div className="border border-green-200 rounded-lg overflow-hidden">
                  <ExercisePanel
                    patientId={patientId}
                    encounterId={encounterId}
                    onExercisesChange={(exercises) => {
                      const exerciseText = exercises
                        .map(
                          (e) =>
                            `${e.name_no || e.name_en}: ${e.sets || 3}x${e.reps || 10}, ${e.frequency || 'daglig'}`
                        )
                        .join('\n');
                      updateField('plan', 'exercises', exerciseText);
                    }}
                    compact={true}
                  />
                </div>
              </Suspense>
            )}
            <EnhancedClinicalTextarea
              value={encounterData.plan.exercises}
              onChange={(val) => updateField('plan', 'exercises', val)}
              placeholder={t(
                'homeExercisesPlaceholder',
                'Hjemmeøvelser og råd... (eller velg fra biblioteket over)'
              )}
              label={t('homeExercises', 'Hjemmeøvelser')}
              section="plan"
              field="exercises"
              disabled={isSigned}
              rows={3}
              showVoiceInput={true}
              showAIButton={false}
            />
          </div>
        )}

        {/* Follow-up */}
        <div className="flex items-center gap-4 pt-3 border-t border-slate-100">
          <span className="text-sm font-medium text-slate-700">{t('followUp', 'Oppfølging:')}</span>
          <input
            type="text"
            placeholder="f.eks. 1 uke, 3 behandlinger"
            value={encounterData.plan.follow_up}
            onChange={(e) => updateField('plan', 'follow_up', e.target.value)}
            disabled={isSigned}
            className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-purple-500 text-sm disabled:bg-slate-50 disabled:text-slate-500 dark:text-slate-400 disabled:cursor-not-allowed"
          />
        </div>
      </div>
    </section>
  );
}
