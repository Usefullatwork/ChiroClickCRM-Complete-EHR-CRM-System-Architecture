/**
 * ObjectiveSection - Orchestrator for objective clinical findings
 *
 * Delegates rendering to sub-components:
 * - PosturalAssessment: observation, palpation, ROM textareas
 * - SpecialTests: orthopedic exam, neuro compact, ROM table, body diagram, etc.
 * - NeurologicalFindings: full neuro, DTR, sensory, cranial, coordination, nerve tension
 * - PainAndTissue: pain assessment, headache, tissue markers
 */
import { useEncounter } from '../../../context/EncounterContext';
import PosturalAssessment from './PosturalAssessment';
import SpecialTests from './SpecialTests';
import NeurologicalFindings from './NeurologicalFindings';
import PainAndTissue from './PainAndTissue';

export default function ObjectiveSection({
  onTextInputWithMacros,
  onSetActiveField,
  quickPhrases,
}) {
  const {
    encounterData,
    isSigned,
    updateField,
    setOrthoExamData,
    setNeuroExamData,
    setRedFlagAlerts,
  } = useEncounter();

  // Handlers re-implemented for Context usage
  const handleNeuroExamChange = (examData) => {
    setNeuroExamData(examData);
    if (examData?.narrative) {
      updateField('objective', 'neuro_tests', examData.narrative);
    }
    if (examData?.redFlags?.length > 0) {
      const neuroRedFlags = examData.redFlags.map(
        (rf) => `NEURO: ${rf.description} - ${rf.action}`
      );
      setRedFlagAlerts((prev) => [
        ...prev.filter((a) => !a.startsWith('NEURO:')),
        ...neuroRedFlags,
      ]);
    }
  };

  const handleOrthoExamChange = (examData) => {
    setOrthoExamData(examData);
    if (examData?.narrative) {
      updateField('objective', 'ortho_tests', examData.narrative);
    }
    if (examData?.redFlags?.length > 0) {
      const orthoRedFlags = examData.redFlags.map(
        (rf) => `ORTHO: ${rf.testName?.no || rf.clusterName?.no} - ${rf.action}`
      );
      setRedFlagAlerts((prev) => [
        ...prev.filter((a) => !a.startsWith('ORTHO:')),
        ...orthoRedFlags,
      ]);
    }
  };

  const handleQuickPhrase = (phrase, field) => {
    const currentValue = encounterData.objective[field] || '';
    const newValue = `${currentValue + (currentValue ? '\n' : '')}• ${phrase}`;
    updateField('objective', field, newValue);
  };

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-gradient-to-r from-emerald-50 to-white border-b border-slate-100">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <span className="bg-emerald-600 text-white h-6 w-6 rounded-md flex items-center justify-center text-sm font-bold">
            O
          </span>
          Objektivt
        </h3>
      </div>
      <div className="p-4 space-y-4">
        <PosturalAssessment onTextInputWithMacros={onTextInputWithMacros} />

        {/* --- ACCORDION PANELS --- */}
        <div className="space-y-2">
          <SpecialTests
            handleOrthoExamChange={handleOrthoExamChange}
            handleNeuroExamChange={handleNeuroExamChange}
          />
          <NeurologicalFindings />
          <PainAndTissue />
        </div>

        {quickPhrases && !isSigned && (
          <div className="flex flex-wrap gap-1.5">
            {quickPhrases.objective?.map((phrase) => (
              <button
                key={phrase}
                onClick={() => handleQuickPhrase(phrase, 'ortho_tests')}
                className="px-2.5 py-1 text-xs rounded-full bg-slate-100 text-slate-600 hover:bg-emerald-100 hover:text-emerald-700 transition-colors"
              >
                + {phrase}
              </button>
            ))}
          </div>
        )}

        <textarea
          aria-label="Ytterligere objektive funn"
          placeholder="Ytterligere objektive funn..."
          value={encounterData.objective.neuro_tests}
          onChange={(e) => {
            if (!onTextInputWithMacros(e, 'objective', 'neuro_tests')) {
              updateField('objective', 'neuro_tests', e.target.value);
            }
          }}
          onFocus={() => onSetActiveField('objective.neuro_tests')}
          disabled={isSigned}
          className="w-full min-h-[60px] p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 resize-none text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
        />
      </div>
    </section>
  );
}
