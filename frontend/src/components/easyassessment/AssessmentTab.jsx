import SmartTextInput, { CLINICAL_REASONING_PHRASES } from '../assessment/SmartTextInput';
import { VASComparisonDisplay } from '../assessment/VASPainScale';
import { QUESTIONNAIRE_TYPES } from '../assessment/OutcomeAssessment';

export default function AssessmentTab({
  encounterData,
  _setEncounterData,
  language,
  aiAvailable,
  updateField,
  addDiagnosisCode,
  removeDiagnosisCode,
  commonDiagnoses,
  buildAIContext,
  _showOutcomeAssessment,
  setShowOutcomeAssessment,
  _outcomeType,
  setOutcomeType,
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Diagnosis (ICPC-2 / ICD-10)
          </label>
          <select
            onChange={(e) => {
              if (e.target.value) {
                addDiagnosisCode(e.target.value);
                e.target.value = '';
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
          >
            <option value="">Select diagnosis...</option>
            {commonDiagnoses?.data?.map((code) => (
              <option key={code.code} value={code.code}>
                {code.code} - {code.description_no || code.description_en}
              </option>
            ))}
          </select>
          <div className="flex flex-wrap gap-2">
            {encounterData.icpc_codes.map((code) => (
              <span
                key={code}
                className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
              >
                {code}
                <button onClick={() => removeDiagnosisCode(code)} className="hover:text-purple-600">
                  x
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <SmartTextInput
            label="Clinical Reasoning"
            value={encounterData.assessment.clinical_reasoning}
            onChange={(val) => updateField('assessment', 'clinical_reasoning', val)}
            placeholder="Your clinical reasoning..."
            quickPhrases={CLINICAL_REASONING_PHRASES}
            rows={4}
            aiEnabled={true}
            aiFieldType="clinical_reasoning"
            aiContext={buildAIContext('clinical_reasoning')}
            aiAvailable={aiAvailable}
            language={language}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <SmartTextInput
              label="Differential Diagnosis"
              value={encounterData.assessment.differential_diagnosis}
              onChange={(val) => updateField('assessment', 'differential_diagnosis', val)}
              placeholder="Other diagnoses considered..."
              rows={2}
              aiEnabled={true}
              aiFieldType="differential_diagnosis"
              aiContext={buildAIContext('differential_diagnosis')}
              aiAvailable={aiAvailable}
              language={language}
            />
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <SmartTextInput
              label="Prognosis"
              value={encounterData.assessment.prognosis}
              onChange={(val) => updateField('assessment', 'prognosis', val)}
              placeholder="Expected recovery..."
              rows={2}
              aiEnabled={true}
              aiFieldType="prognosis"
              aiContext={buildAIContext('prognosis')}
              aiAvailable={aiAvailable}
              language={language}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <VASComparisonDisplay
          startValue={encounterData.vas_pain_start}
          endValue={encounterData.vas_pain_end}
        />

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Outcome Assessment</h4>
          <div className="grid grid-cols-3 gap-2">
            {Object.values(QUESTIONNAIRE_TYPES).map((type) => (
              <button
                key={type}
                onClick={() => {
                  setOutcomeType(type);
                  setShowOutcomeAssessment(true);
                }}
                className="px-2 py-2 text-xs font-medium bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
