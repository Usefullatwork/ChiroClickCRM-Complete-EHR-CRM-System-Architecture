/**
 * Extracted modal/overlay JSX from ClinicalEncounter render section:
 * AIAssistantPanel, AIDiagnosisSidebar, TemplatePicker, RedFlagModal, ConnectionStatus.
 */
import { lazy, Suspense } from 'react';
import ConnectionStatus from '../common/ConnectionStatus';
import RedFlagModal from '../clinical/RedFlagModal';

const TemplatePicker = lazy(() => import('../TemplatePicker'));
const AIDiagnosisSidebar = lazy(() => import('../clinical/AIDiagnosisSidebar'));
const AIAssistantPanel = lazy(() =>
  import('./AIAssistantPanel').then((m) => ({ default: m.AIAssistantPanel }))
);

export function ClinicalEncounterModals({
  showAIAssistant,
  setShowAIAssistant,
  aiSuggestions,
  aiLoading,
  getAISuggestions,
  showAIDiagnosisSidebar,
  setShowAIDiagnosisSidebar,
  encounterData,
  setEncounterData,
  setAutoSaveStatus,
  isSigned,
  showTemplatePicker,
  setShowTemplatePicker,
  handleTemplateSelect,
  activeField,
  showRedFlagModal,
  setShowRedFlagModal,
  criticalFlagsForModal,
  setRedFlagAlerts,
  autoSaveStatus,
  lastSaved,
}) {
  return (
    <>
      {/* AI ASSISTANT PANEL */}
      <Suspense fallback={null}>
        <AIAssistantPanel
          showAIAssistant={showAIAssistant}
          setShowAIAssistant={setShowAIAssistant}
          aiSuggestions={aiSuggestions}
          aiLoading={aiLoading}
          getAISuggestions={getAISuggestions}
        />
      </Suspense>

      {/* AI DIAGNOSIS SIDEBAR */}
      <Suspense fallback={<div className="animate-pulse bg-slate-100 rounded-lg h-full" />}>
        <AIDiagnosisSidebar
          soapData={encounterData}
          onSelectCode={(suggestion) => {
            if (suggestion.code && !encounterData.icpc_codes.includes(suggestion.code)) {
              setEncounterData((prev) => ({
                ...prev,
                icpc_codes: [...prev.icpc_codes, suggestion.code],
              }));
              setAutoSaveStatus('unsaved');
            }
          }}
          isCollapsed={!showAIDiagnosisSidebar}
          onToggle={() => setShowAIDiagnosisSidebar(!showAIDiagnosisSidebar)}
          disabled={isSigned}
        />
      </Suspense>

      {/* TEMPLATE PICKER SIDEBAR */}
      <Suspense fallback={<div className="animate-pulse bg-slate-100 rounded-lg h-full" />}>
        <TemplatePicker
          isOpen={showTemplatePicker}
          onClose={() => setShowTemplatePicker(false)}
          onSelectTemplate={handleTemplateSelect}
          soapSection={activeField?.split('.')[0] || 'subjective'}
        />
      </Suspense>

      {/* RED FLAG BLOCKING MODAL */}
      <RedFlagModal
        isOpen={showRedFlagModal}
        onClose={() => setShowRedFlagModal(false)}
        criticalFlags={criticalFlagsForModal}
        onAcknowledge={(flags) => {
          const flagAlerts = flags.map((f) => `RED_FLAG: ${f.description}`);
          setRedFlagAlerts((prev) => [...prev, ...flagAlerts]);
        }}
        lang="no"
      />

      {/* CONNECTION STATUS INDICATOR */}
      <ConnectionStatus
        pendingChanges={autoSaveStatus === 'unsaved' ? 1 : 0}
        lastSyncTime={lastSaved}
        syncError={null}
        position="bottom-left"
      />
    </>
  );
}
