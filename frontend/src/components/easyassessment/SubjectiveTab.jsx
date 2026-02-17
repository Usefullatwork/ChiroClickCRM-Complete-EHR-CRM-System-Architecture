import { Sparkles } from 'lucide-react';
import {
  QuickCheckboxGrid,
  SmartTextInput,
  BodyDiagram,
  QuickRegionSelect,
  BodyChartGallery,
  IntakeParserButton,
  PAIN_QUALITY_OPTIONS,
  AGGRAVATING_FACTORS_OPTIONS,
  RELIEVING_FACTORS_OPTIONS,
  CHIEF_COMPLAINT_PHRASES,
  ONSET_PHRASES,
  HISTORY_PHRASES,
} from '../assessment';

export default function SubjectiveTab({
  encounterData,
  viewMode,
  language,
  aiAvailable,
  updateField,
  updateQuickSelect,
  buildAIContext,
  setShowBodyChart,
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        {/* AI Generate from Intake Button */}
        <div className="flex items-center justify-between bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-3 border border-purple-100">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <span className="text-sm text-purple-700">
              {language === 'en'
                ? 'Generate Subjective from patient intake'
                : 'Generer Subjektiv fra pasientopptak'}
            </span>
          </div>
          <IntakeParserButton
            intakeData={{
              chiefComplaint: encounterData.subjective.chief_complaint,
              painLevel: encounterData.vas_pain_start,
              location: encounterData.pain_locations,
              painQuality: encounterData.pain_qualities,
              aggravatingFactors: encounterData.aggravating_factors_selected,
              relievingFactors: encounterData.relieving_factors_selected,
            }}
            language={language}
            onGenerate={(narrative, _source) => {
              updateField('subjective', 'chief_complaint', narrative);
            }}
          />
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <SmartTextInput
            label="Chief Complaint"
            value={encounterData.subjective.chief_complaint}
            onChange={(val) => updateField('subjective', 'chief_complaint', val)}
            placeholder="What brings you in today?"
            quickPhrases={CHIEF_COMPLAINT_PHRASES}
            rows={2}
            required
            aiEnabled={true}
            aiFieldType="chief_complaint"
            aiContext={buildAIContext('chief_complaint')}
            aiAvailable={aiAvailable}
            language={language}
          />
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <SmartTextInput
            label="History"
            value={encounterData.subjective.history}
            onChange={(val) => updateField('subjective', 'history', val)}
            placeholder="Describe how the problem developed..."
            quickPhrases={HISTORY_PHRASES}
            rows={3}
            aiEnabled={true}
            aiFieldType="history"
            aiContext={buildAIContext('history')}
            aiAvailable={aiAvailable}
            language={language}
          />
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <SmartTextInput
            label="Onset"
            value={encounterData.subjective.onset}
            onChange={(val) => updateField('subjective', 'onset', val)}
            placeholder="When did it start?"
            quickPhrases={ONSET_PHRASES}
            rows={1}
            aiEnabled={true}
            aiFieldType="onset"
            aiContext={buildAIContext('onset')}
            aiAvailable={aiAvailable}
            language={language}
          />
        </div>

        {viewMode === 'easy' && (
          <>
            <QuickCheckboxGrid
              title="Pain Quality"
              categories={PAIN_QUALITY_OPTIONS}
              selectedValues={encounterData.pain_qualities}
              onChange={(vals) => updateQuickSelect('pain_qualities', vals)}
              columns={3}
            />

            <div className="grid grid-cols-2 gap-4">
              <QuickCheckboxGrid
                title="Aggravating Factors"
                categories={AGGRAVATING_FACTORS_OPTIONS}
                selectedValues={encounterData.aggravating_factors_selected}
                onChange={(vals) => updateQuickSelect('aggravating_factors_selected', vals)}
                columns={2}
              />
              <QuickCheckboxGrid
                title="Relieving Factors"
                categories={RELIEVING_FACTORS_OPTIONS}
                selectedValues={encounterData.relieving_factors_selected}
                onChange={(vals) => updateQuickSelect('relieving_factors_selected', vals)}
                columns={2}
              />
            </div>
          </>
        )}
      </div>

      <div className="space-y-4">
        {/* Body Chart Gallery Preview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Body Chart</h4>
            <button
              onClick={() => setShowBodyChart(true)}
              className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Open Full Chart
            </button>
          </div>
          <BodyChartGallery
            markers={encounterData.body_chart?.markers || []}
            annotations={encounterData.body_chart?.annotations || []}
            onViewSelect={() => setShowBodyChart(true)}
          />
        </div>

        {/* Quick Region Select (fallback) */}
        <BodyDiagram
          selectedRegions={encounterData.pain_locations}
          onChange={(vals) => updateQuickSelect('pain_locations', vals)}
        />
        <QuickRegionSelect
          selectedRegions={encounterData.pain_locations}
          onChange={(vals) => updateQuickSelect('pain_locations', vals)}
        />
      </div>
    </div>
  );
}
