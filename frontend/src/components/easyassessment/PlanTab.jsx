import { useTranslation } from '../../i18n';
import QuickCheckboxGrid, {
  TREATMENT_OPTIONS,
  EXERCISE_OPTIONS,
} from '../assessment/QuickCheckboxGrid';
import SmartTextInput, { ADVICE_PHRASES, FOLLOW_UP_PHRASES } from '../assessment/SmartTextInput';

export default function PlanTab({
  encounterData,
  viewMode,
  language,
  aiAvailable,
  updateField,
  updateQuickSelect,
  buildAIContext,
}) {
  const { t } = useTranslation('clinical');
  return (
    <div className="space-y-4">
      {viewMode === 'easy' ? (
        <>
          <QuickCheckboxGrid
            title={t('treatmentPerformed', 'Utf\u00f8rt behandling')}
            categories={TREATMENT_OPTIONS}
            selectedValues={encounterData.treatments_selected}
            onChange={(vals) => updateQuickSelect('treatments_selected', vals)}
            columns={4}
          />

          <QuickCheckboxGrid
            title={t('homeExercises', 'Hjemme\u00f8velser')}
            categories={EXERCISE_OPTIONS}
            selectedValues={encounterData.exercises_selected}
            onChange={(vals) => updateQuickSelect('exercises_selected', vals)}
            columns={4}
          />
        </>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <SmartTextInput
              label={t('treatment', 'Behandling')}
              value={encounterData.plan.treatment}
              onChange={(val) => updateField('plan', 'treatment', val)}
              placeholder={t('treatmentPerformedPlaceholder', 'Utf\u00f8rt behandling...')}
              rows={4}
              aiEnabled={true}
              aiFieldType="treatment"
              aiContext={buildAIContext('treatment')}
              aiAvailable={aiAvailable}
              language={language}
            />
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <SmartTextInput
              label={t('exercises', '\u00d8velser')}
              value={encounterData.plan.exercises}
              onChange={(val) => updateField('plan', 'exercises', val)}
              placeholder={t('homeExercisesPlaceholder2', 'Hjemme\u00f8velser...')}
              rows={4}
              aiEnabled={true}
              aiFieldType="exercises"
              aiContext={buildAIContext('exercises')}
              aiAvailable={aiAvailable}
              language={language}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <SmartTextInput
            label={t('advice', 'R\u00e5d')}
            value={encounterData.plan.advice}
            onChange={(val) => updateField('plan', 'advice', val)}
            placeholder={t('patientEducationPlaceholder2', 'Pasientoppl\u00e6ring...')}
            quickPhrases={ADVICE_PHRASES}
            rows={3}
            aiEnabled={true}
            aiFieldType="advice"
            aiContext={buildAIContext('advice')}
            aiAvailable={aiAvailable}
            language={language}
          />
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <SmartTextInput
            label={t('followUp', 'Oppf\u00f8lging')}
            value={encounterData.plan.follow_up}
            onChange={(val) => updateField('plan', 'follow_up', val)}
            placeholder={t('nextAppointmentPlaceholder2', 'Neste avtale...')}
            quickPhrases={FOLLOW_UP_PHRASES}
            rows={3}
            aiEnabled={true}
            aiFieldType="follow_up"
            aiContext={buildAIContext('follow_up')}
            aiAvailable={aiAvailable}
            language={language}
          />
        </div>
      </div>
    </div>
  );
}
