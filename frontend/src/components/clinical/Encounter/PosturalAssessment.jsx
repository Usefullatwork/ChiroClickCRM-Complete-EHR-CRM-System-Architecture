/**
 * PosturalAssessment - Observation, palpation, and ROM textareas
 * Extracted from ObjectiveSection.jsx
 */
import { useEncounter } from '../../../context/EncounterContext';
import { useTranslation } from '../../../i18n';

export default function PosturalAssessment({ onTextInputWithMacros }) {
  const { t } = useTranslation('clinical');
  const { encounterData, isSigned, updateField } = useEncounter();

  return (
    <>
      {/* Observation & Palpation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <textarea
          aria-label={t('observation', 'Observasjon')}
          placeholder={t('observationPlaceholder', 'Observasjon (holdning, gange)...')}
          value={encounterData.objective.observation}
          onChange={(e) => {
            if (!onTextInputWithMacros(e, 'objective', 'observation')) {
              updateField('objective', 'observation', e.target.value);
            }
          }}
          disabled={isSigned}
          className="min-h-[80px] p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 resize-none text-sm disabled:bg-slate-50 disabled:text-slate-500 dark:text-slate-400 disabled:cursor-not-allowed"
        />
        <textarea
          aria-label={t('palpation', 'Palpasjon')}
          placeholder={t(
            'palpationPlaceholder',
            'Palpasjon (ømhet, spenninger)... (bruk .palp for makro)'
          )}
          value={encounterData.objective.palpation}
          onChange={(e) => {
            if (!onTextInputWithMacros(e, 'objective', 'palpation')) {
              updateField('objective', 'palpation', e.target.value);
            }
          }}
          disabled={isSigned}
          className="min-h-[80px] p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 resize-none text-sm disabled:bg-slate-50 disabled:text-slate-500 dark:text-slate-400 disabled:cursor-not-allowed"
        />
      </div>

      {/* ROM */}
      <textarea
        aria-label={t('rangeOfMotion', 'Range of Motion')}
        placeholder={t('romPlaceholder', 'Range of Motion (ROM)...')}
        value={encounterData.objective.rom}
        onChange={(e) => updateField('objective', 'rom', e.target.value)}
        disabled={isSigned}
        className="w-full min-h-[60px] p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 resize-none text-sm disabled:bg-slate-50 disabled:text-slate-500 dark:text-slate-400 disabled:cursor-not-allowed"
      />
    </>
  );
}
