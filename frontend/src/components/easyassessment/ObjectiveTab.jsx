import {
  QuickCheckboxGrid,
  SmartTextInput,
  SpineDiagram,
  OBSERVATION_FINDINGS_OPTIONS,
  PALPATION_FINDINGS_OPTIONS,
  ROM_FINDINGS_OPTIONS,
  ORTHO_TESTS_OPTIONS,
  NEURO_TESTS_OPTIONS,
} from '../assessment';

export default function ObjectiveTab({
  encounterData,
  viewMode,
  language,
  aiAvailable,
  updateField,
  updateQuickSelect,
  buildAIContext,
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        {viewMode === 'easy' ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <QuickCheckboxGrid
                title="Observation"
                categories={OBSERVATION_FINDINGS_OPTIONS}
                selectedValues={encounterData.observation_findings}
                onChange={(vals) => updateQuickSelect('observation_findings', vals)}
                columns={2}
              />
              <QuickCheckboxGrid
                title="Palpation"
                categories={PALPATION_FINDINGS_OPTIONS}
                selectedValues={encounterData.palpation_findings}
                onChange={(vals) => updateQuickSelect('palpation_findings', vals)}
                columns={2}
              />
            </div>

            <QuickCheckboxGrid
              title="Range of Motion"
              categories={ROM_FINDINGS_OPTIONS}
              selectedValues={encounterData.rom_findings}
              onChange={(vals) => updateQuickSelect('rom_findings', vals)}
              columns={3}
            />

            <div className="grid grid-cols-2 gap-4">
              <QuickCheckboxGrid
                title="Orthopedic Tests"
                categories={ORTHO_TESTS_OPTIONS}
                selectedValues={encounterData.ortho_tests_selected}
                onChange={(vals) => updateQuickSelect('ortho_tests_selected', vals)}
                columns={2}
              />
              <QuickCheckboxGrid
                title="Neurological"
                categories={NEURO_TESTS_OPTIONS}
                selectedValues={encounterData.neuro_tests_selected}
                onChange={(vals) => updateQuickSelect('neuro_tests_selected', vals)}
                columns={2}
              />
            </div>
          </>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <SmartTextInput
                label="Observation"
                value={encounterData.objective.observation}
                onChange={(val) => updateField('objective', 'observation', val)}
                placeholder="Visual observations, gait, posture..."
                rows={3}
                aiEnabled={true}
                aiFieldType="observation"
                aiContext={buildAIContext('observation')}
                aiAvailable={aiAvailable}
                language={language}
              />
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <SmartTextInput
                label="Palpation"
                value={encounterData.objective.palpation}
                onChange={(val) => updateField('objective', 'palpation', val)}
                placeholder="Tenderness, muscle tension..."
                rows={3}
                aiEnabled={true}
                aiFieldType="palpation"
                aiContext={buildAIContext('palpation')}
                aiAvailable={aiAvailable}
                language={language}
              />
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <SmartTextInput
                label="Range of Motion"
                value={encounterData.objective.rom}
                onChange={(val) => updateField('objective', 'rom', val)}
                placeholder="ROM findings..."
                rows={3}
                aiEnabled={true}
                aiFieldType="rom"
                aiContext={buildAIContext('rom')}
                aiAvailable={aiAvailable}
                language={language}
              />
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <SmartTextInput
                label="Orthopedic Tests"
                value={encounterData.objective.ortho_tests}
                onChange={(val) => updateField('objective', 'ortho_tests', val)}
                placeholder="Test results..."
                rows={3}
              />
            </div>
          </div>
        )}
      </div>

      {/* Spine Diagram */}
      <div>
        <SpineDiagram
          findings={encounterData.spinal_findings}
          onChange={(findings) => updateQuickSelect('spinal_findings', findings)}
        />
      </div>
    </div>
  );
}
