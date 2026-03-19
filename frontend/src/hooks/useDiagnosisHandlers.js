import { useCallback } from 'react';
import { encountersAPI } from '../services/api';

export function useDiagnosisHandlers({
  encounterData,
  setEncounterData,
  examData,
  panels,
  setDiagnosisSearch,
  setShowDiagnosisDropdown,
  setSelectedTakster,
}) {
  const toggleDiagnosis = useCallback(
    async (diagnosis) => {
      const isAdding = !encounterData.icpc_codes.includes(diagnosis.code);
      setEncounterData((prev) => {
        const exists = prev.icpc_codes.includes(diagnosis.code);
        return {
          ...prev,
          icpc_codes: exists
            ? prev.icpc_codes.filter((c) => c !== diagnosis.code)
            : [...prev.icpc_codes, diagnosis.code],
        };
      });
      setDiagnosisSearch('');
      setShowDiagnosisDropdown(false);

      // Assessment-first: when adding a diagnosis, auto-suggest anatomy findings
      if (isAdding) {
        try {
          const response = await encountersAPI.getDiagnosisFindings(diagnosis.code);
          const mappings = response?.data?.data || [];
          if (mappings.length > 0) {
            const suggestedFindings = {};
            for (const m of mappings) {
              if (!examData.anatomySpineFindings[m.body_region]) {
                suggestedFindings[m.body_region] = {
                  body_region: m.body_region,
                  finding_type: m.expected_findings?.[0]?.type || 'palpation',
                  severity: m.expected_findings?.[0]?.severity_range?.[0] || 'moderate',
                  laterality: m.expected_findings?.[0]?.laterality || 'bilateral',
                  source: 'ai_suggested',
                  confirmed: false,
                  confidence: m.confidence,
                };
              }
            }
            if (Object.keys(suggestedFindings).length > 0) {
              examData.setAnatomySpineFindings((prev) => ({ ...prev, ...suggestedFindings }));
              panels.setShowAnatomyPanel(true);
            }
          }
        } catch {
          // Non-blocking
        }
      }
    },
    [
      encounterData.icpc_codes,
      setEncounterData,
      setDiagnosisSearch,
      setShowDiagnosisDropdown,
      examData,
      panels,
    ]
  );

  const removeDiagnosisCode = useCallback(
    (code) => {
      setEncounterData((prev) => ({
        ...prev,
        icpc_codes: prev.icpc_codes.filter((c) => c !== code),
      }));
    },
    [setEncounterData]
  );

  const toggleTakst = useCallback(
    (takstId) => {
      setSelectedTakster((prev) =>
        prev.includes(takstId) ? prev.filter((t) => t !== takstId) : [...prev, takstId]
      );
    },
    [setSelectedTakster]
  );

  return { toggleDiagnosis, removeDiagnosisCode, toggleTakst };
}
