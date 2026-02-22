/**
 * PosturalAssessment - Observation, palpation, and ROM textareas
 * Extracted from ObjectiveSection.jsx
 */
import { useEncounter } from '../../../context/EncounterContext';

export default function PosturalAssessment({ onTextInputWithMacros }) {
  const { encounterData, isSigned, updateField } = useEncounter();

  return (
    <>
      {/* Observation & Palpation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <textarea
          aria-label="Observasjon"
          placeholder="Observasjon (holdning, gange)..."
          value={encounterData.objective.observation}
          onChange={(e) => {
            if (!onTextInputWithMacros(e, 'objective', 'observation')) {
              updateField('objective', 'observation', e.target.value);
            }
          }}
          disabled={isSigned}
          className="min-h-[80px] p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 resize-none text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
        />
        <textarea
          aria-label="Palpasjon"
          placeholder="Palpasjon (ømhet, spenninger)... (bruk .palp for makro)"
          value={encounterData.objective.palpation}
          onChange={(e) => {
            if (!onTextInputWithMacros(e, 'objective', 'palpation')) {
              updateField('objective', 'palpation', e.target.value);
            }
          }}
          disabled={isSigned}
          className="min-h-[80px] p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 resize-none text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
        />
      </div>

      {/* ROM */}
      <textarea
        aria-label="Range of Motion"
        placeholder="Range of Motion (ROM)..."
        value={encounterData.objective.rom}
        onChange={(e) => updateField('objective', 'rom', e.target.value)}
        disabled={isSigned}
        className="w-full min-h-[60px] p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 resize-none text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
      />
    </>
  );
}
