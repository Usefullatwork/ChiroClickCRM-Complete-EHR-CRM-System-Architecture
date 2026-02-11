import {
  QuickCheckboxGrid,
  SmartTextInput,
  TREATMENT_OPTIONS,
  EXERCISE_OPTIONS,
  ADVICE_PHRASES,
  FOLLOW_UP_PHRASES,
} from '../assessment';

export default function PlanTab({
  encounterData,
  viewMode,
  language,
  aiAvailable,
  updateField,
  updateQuickSelect,
  buildAIContext,
}) {
  return (
    <div className="space-y-4">
      {viewMode === 'easy' ? (
        <>
          <QuickCheckboxGrid
            title="Treatment Performed"
            categories={TREATMENT_OPTIONS}
            selectedValues={encounterData.treatments_selected}
            onChange={(vals) => updateQuickSelect('treatments_selected', vals)}
            columns={4}
          />

          <QuickCheckboxGrid
            title="Home Exercises"
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
              label="Treatment"
              value={encounterData.plan.treatment}
              onChange={(val) => updateField('plan', 'treatment', val)}
              placeholder="Treatment performed..."
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
              label="Exercises"
              value={encounterData.plan.exercises}
              onChange={(val) => updateField('plan', 'exercises', val)}
              placeholder="Home exercises..."
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
            label="Advice"
            value={encounterData.plan.advice}
            onChange={(val) => updateField('plan', 'advice', val)}
            placeholder="Patient education..."
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
            label="Follow-up"
            value={encounterData.plan.follow_up}
            onChange={(val) => updateField('plan', 'follow_up', val)}
            placeholder="Next appointment..."
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
