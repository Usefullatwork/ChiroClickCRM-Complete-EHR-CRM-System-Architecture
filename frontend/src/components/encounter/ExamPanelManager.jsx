import CoreExamPanels from './exam-panels/CoreExamPanels';
import ProtocolExamPanels from './exam-panels/ProtocolExamPanels';
import NeuroDetailPanels from './exam-panels/NeuroDetailPanels';
import RegionalPanels from './exam-panels/RegionalPanels';

/**
 * Manages the visibility and rendering of all examination panels in the Objective section.
 * Each panel is collapsible and independently toggleable.
 *
 * Panel visibility and exam data come from ExamPanelContext.
 * Only IDs, handlers, and SOAP-level state are passed as explicit props.
 */
export function ExamPanelManager({
  patientId,
  encounterId,
  isSigned,
  onOrthoExamChange,
  onNeuroExamChange,
  onAnatomyInsertText,
  updateField,
  encounterData,
}) {
  const sharedProps = { isSigned, updateField, encounterData };

  return (
    <>
      <CoreExamPanels
        patientId={patientId}
        encounterId={encounterId}
        onOrthoExamChange={onOrthoExamChange}
        onNeuroExamChange={onNeuroExamChange}
        onAnatomyInsertText={onAnatomyInsertText}
        {...sharedProps}
      />
      <ProtocolExamPanels {...sharedProps} />
      <NeuroDetailPanels {...sharedProps} />
      <RegionalPanels {...sharedProps} />
    </>
  );
}
