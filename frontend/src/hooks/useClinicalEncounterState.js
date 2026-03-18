import { useSOAPForm } from './useSOAPForm.js';
import { usePanelVisibility } from './usePanelVisibility.js';
import { useExamData } from './useExamData.js';
import { useAIState } from './useAIState.js';

/**
 * Composite hook for ClinicalEncounter state.
 *
 * Returns `panels` and `examData` as nested objects so they can be passed
 * directly to ExamPanelProvider. AI and SOAP state remain flat-spread
 * because ClinicalEncounter consumes them directly.
 */
export function useClinicalEncounterState(patientId) {
  const soapForm = useSOAPForm(patientId);
  const panels = usePanelVisibility();
  const examData = useExamData();
  const aiState = useAIState();

  return {
    panels,
    examData,
    ...aiState,
    ...soapForm,
  };
}
