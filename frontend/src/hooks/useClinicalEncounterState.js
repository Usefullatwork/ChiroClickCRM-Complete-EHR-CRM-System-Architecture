import { useSOAPForm } from './useSOAPForm.js';
import { usePanelVisibility } from './usePanelVisibility.js';
import { useExamData } from './useExamData.js';
import { useAIState } from './useAIState.js';

/**
 * Composite hook that preserves the original API of useClinicalEncounterState.
 * Internally delegates to focused sub-hooks for better separation of concerns.
 *
 * Sub-hooks can also be imported directly by components that only need a subset:
 *   import { useSOAPForm } from './useSOAPForm';
 *   import { usePanelVisibility } from './usePanelVisibility';
 *   import { useExamData } from './useExamData';
 *   import { useAIState } from './useAIState';
 */
export function useClinicalEncounterState(patientId) {
  const soapForm = useSOAPForm(patientId);
  const panels = usePanelVisibility();
  const examData = useExamData();
  const aiState = useAIState();

  return {
    ...panels,
    ...aiState,
    ...examData,
    ...soapForm,
  };
}
