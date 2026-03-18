import { lazy, Suspense } from 'react';
import EnhancedClinicalTextarea from '../clinical/EnhancedClinicalTextarea';
import AITextarea from '../clinical/AITextarea';

const ExamPanelManager = lazy(() =>
  import('./ExamPanelManager').then((m) => ({ default: m.ExamPanelManager }))
);

export function ObjectiveSection({
  encounterData,
  isSigned,
  updateField,
  quickPhrases,
  handleQuickPhrase,
  setActiveField,
  patientId,
  encounterId,
  handleOrthoExamChange,
  handleNeuroExamChange,
  onAnatomyInsertText,
}) {
  return (
    <section
      key="objective"
      data-testid="encounter-objective"
      className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
    >
      <div className="px-4 py-3 bg-gradient-to-r from-emerald-50 to-white border-b border-slate-100">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <span className="bg-emerald-600 text-white h-6 w-6 rounded-md flex items-center justify-center text-sm font-bold">
            O
          </span>
          Objektivt
        </h3>
      </div>
      <div className="p-4 space-y-4">
        {/* Observation & Palpation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <EnhancedClinicalTextarea
            value={encounterData.objective.observation}
            onChange={(val) => updateField('objective', 'observation', val)}
            placeholder="Observasjon (holdning, gange)..."
            label="Observasjon"
            section="objective"
            field="observation"
            disabled={isSigned}
            rows={3}
            showVoiceInput={true}
            showAIButton={false}
          />
          <EnhancedClinicalTextarea
            value={encounterData.objective.palpation}
            onChange={(val) => updateField('objective', 'palpation', val)}
            placeholder={`Palpasjon (\u00F8mhet, spenninger)...`}
            label="Palpasjon"
            section="objective"
            field="palpation"
            disabled={isSigned}
            rows={3}
            showVoiceInput={true}
            showAIButton={false}
          />
        </div>

        {/* ROM */}
        <AITextarea
          value={encounterData.objective.rom}
          onChange={(val) => updateField('objective', 'rom', val)}
          placeholder="Range of Motion (ROM)..."
          fieldType="rom"
          context={{ chiefComplaint: encounterData.subjective?.chief_complaint }}
          disabled={isSigned}
          rows={2}
        />

        {/* All exam panels via ExamPanelManager (lazy-loaded, reads state from ExamPanelContext) */}
        <Suspense fallback={<div className="animate-pulse bg-slate-100 rounded-lg h-16 m-4" />}>
          <ExamPanelManager
            patientId={patientId}
            encounterId={encounterId}
            isSigned={isSigned}
            onOrthoExamChange={handleOrthoExamChange}
            onNeuroExamChange={handleNeuroExamChange}
            onAnatomyInsertText={onAnatomyInsertText}
            updateField={updateField}
            encounterData={encounterData}
          />
        </Suspense>

        <AITextarea
          value={encounterData.objective.ortho_tests}
          onChange={(val) => updateField('objective', 'ortho_tests', val)}
          placeholder="Ortopediske tester (sammendrag)..."
          fieldType="ortho_tests"
          context={{ chiefComplaint: encounterData.subjective?.chief_complaint }}
          disabled={isSigned}
          rows={2}
          onFocus={() => setActiveField('objective.ortho_tests')}
        />

        <AITextarea
          value={encounterData.objective.neuro_tests}
          onChange={(val) => updateField('objective', 'neuro_tests', val)}
          placeholder="Nevrologiske tester (sammendrag)..."
          fieldType="neuro_tests"
          context={{ chiefComplaint: encounterData.subjective?.chief_complaint }}
          disabled={isSigned}
          rows={2}
          onFocus={() => setActiveField('objective.neuro_tests')}
        />

        {!isSigned && (
          <div className="flex flex-wrap gap-1.5">
            {quickPhrases.objective.map((phrase) => (
              <button
                key={phrase}
                onClick={() => handleQuickPhrase(phrase, 'objective', 'ortho_tests')}
                className="px-2.5 py-1 text-xs rounded-full bg-slate-100 text-slate-600 dark:text-slate-300 hover:bg-emerald-100 hover:text-emerald-700 transition-colors"
              >
                + {phrase}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
