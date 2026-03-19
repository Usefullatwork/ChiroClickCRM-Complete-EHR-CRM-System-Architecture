// ClinicalEncounter — orchestrator: state + data fetching + handler composition + layout.
import { useState, useMemo, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { encountersAPI } from '../services/api';
import { useClinicalPreferences } from '../hooks';
import { useEncounterSave } from '../hooks/useEncounterSave';
import { useDiagnosisHandlers } from '../hooks/useDiagnosisHandlers';
import { useEncounterHandlers } from '../hooks/useEncounterHandlers';
import { useAutoCoding } from '../hooks/useAutoCoding';
import { useAISuggestions } from '../hooks/useAISuggestions';
import { useEncounterQueries } from '../hooks/useEncounterQueries';
import { useEncounterEffects } from '../hooks/useEncounterEffects';
import { useRedFlagScreening } from '../hooks/useRedFlagScreening';
import { useTranslation } from '../i18n';
import {
  macros,
  buildQuickPhrases,
  buildKeyboardShortcuts,
} from '../components/encounter/encounterConstants';

import { useClinicalEncounterState } from '../hooks/useClinicalEncounterState';
import { ExamPanelProvider } from '../context/ExamPanelContext';
import { PatientInfoSidebar } from '../components/encounter/PatientInfoSidebar';
import { taksterNorwegian } from '../components/encounter/TaksterPanel';
import { SOAPNoteForm } from '../components/encounter/SOAPNoteForm';
import { EncounterHeader } from '../components/encounter/EncounterHeader';
import { EncounterFooter } from '../components/encounter/EncounterFooter';
import { ClinicalEncounterModals } from '../components/encounter/ClinicalEncounterModals';

const QuickPalpationSpine = lazy(() => import('../components/clinical/QuickPalpationSpine'));

const AmendmentSection = lazy(() =>
  import('../components/encounter/AmendmentSection').then((m) => ({ default: m.AmendmentSection }))
);
const KeyboardShortcutsModal = lazy(() =>
  import('../components/encounter/KeyboardShortcutsModal').then((m) => ({
    default: m.KeyboardShortcutsModal,
  }))
);
const ComplianceScan = lazy(() => import('../components/clinical/Encounter/ComplianceScan'));

export default function ClinicalEncounter() {
  const { patientId, encounterId } = useParams();
  const { t } = useTranslation('clinical');

  const quickPhrases = useMemo(() => buildQuickPhrases(t), [t]);
  const keyboardShortcuts = useMemo(() => buildKeyboardShortcuts(t), [t]);

  const navigate = useNavigate();
  const state = useClinicalEncounterState(patientId);

  const {
    panels,
    examData,
    encounterData,
    setEncounterData,
    redFlagAlerts,
    setRedFlagAlerts,
    clinicalWarnings,
    aiSuggestions,
    setAiSuggestions,
    aiLoading,
    setAiLoading,
    activeField,
    setActiveField,
    diagnosisSearch,
    setDiagnosisSearch,
    currentMacroMatch,
    selectedTakster,
    setSelectedTakster,
    showTakster,
    setShowTakster,
    autoSaveStatus,
    setAutoSaveStatus,
    lastSaved,
    setLastSaved,
    elapsedTime,
    setElapsedTime,
    encounterStartTime,
    showAmendmentForm,
    setShowAmendmentForm,
    amendmentContent,
    setAmendmentContent,
    amendmentType,
    setAmendmentType,
    amendmentReason,
    setAmendmentReason,
    kioskDataApplied,
    setKioskDataApplied,
    textAreaRefs,
    palpationRef,
    autoSaveTimerRef,
    sectionRefs,
    timerIntervalRef,
  } = state;

  const {
    showDiagnosisDropdown,
    setShowDiagnosisDropdown,
    showAIAssistant,
    setShowAIAssistant,
    showTemplatePicker,
    setShowTemplatePicker,
    showKeyboardHelp,
    setShowKeyboardHelp,
    showMacroHint,
    showSALTBanner,
    setShowSALTBanner,
    saltBannerExpanded,
    setSaltBannerExpanded,
    showAIDiagnosisSidebar,
    setShowAIDiagnosisSidebar,
    showExercisePanel,
    setShowExercisePanel,
  } = panels;

  const { notationData, setNotationData, notationNarrative, setNotationNarrative } = examData;

  const [showComplianceScan, setShowComplianceScan] = useState(false);
  const [showRedFlagModal, setShowRedFlagModal] = useState(false);
  const [criticalFlagsForModal, setCriticalFlagsForModal] = useState([]);

  const { screenText: screenForRedFlags } = useRedFlagScreening({
    lang: 'no',
    autoScreen: false,
    onCriticalFlag: (criticalFlags) => {
      setCriticalFlagsForModal(criticalFlags);
      setShowRedFlagModal(true);
    },
  });

  const {
    preferences: clinicalPrefs,
    updatePreference,
    currentNotationMethod,
    getNotationName,
    isVisualNotation,
    language: clinicalLang,
  } = useClinicalPreferences();

  const { patient, patientLoading, commonDiagnoses, previousEncounters, latestAnatomyFindings } =
    useEncounterQueries({
      patientId,
      encounterId,
      setEncounterData,
      examData,
      setRedFlagAlerts,
      setClinicalWarnings: state.setClinicalWarnings,
      kioskDataApplied,
      setKioskDataApplied,
    });

  const { suggestedCMTCode, suggestedCodes } = useAutoCoding(examData.anatomySpineFindings);

  const isSigned = !!encounterData.signed_at;

  const { data: amendments, refetch: refetchAmendments } = useQuery({
    queryKey: ['amendments', encounterId],
    queryFn: () => encountersAPI.getAmendments(encounterId),
    enabled: !!encounterId && isSigned,
  });

  const {
    updateField,
    handleQuickPhrase,
    handleTemplateSelect,
    handleSpineTextInsert,
    handleCarryForward,
    handleNeuroExamChange,
    handleOrthoExamChange,
    applyEncounterTypeDefaults,
    handleSALT,
  } = useEncounterHandlers({
    encounterData,
    setEncounterData,
    examData,
    activeField,
    palpationRef,
    previousEncounters,
    latestAnatomyFindings,
    setRedFlagAlerts,
    setAutoSaveStatus,
    setSelectedTakster,
  });

  const {
    saveMutation,
    signMutation,
    createAmendmentMutation,
    signAmendmentMutation,
    handleSave,
    handlePreSign,
    handleSignAndLock,
    handleCreateAmendment,
  } = useEncounterSave({
    encounterId,
    patientId,
    encounterData,
    selectedTakster,
    isSigned,
    examData,
    navigate,
    setAutoSaveStatus,
    setLastSaved,
    setEncounterData,
    autoSaveTimerRef,
    amendmentContent,
    amendmentType,
    amendmentReason,
    setShowAmendmentForm,
    setAmendmentContent,
    setAmendmentReason,
    refetchAmendments,
    setShowComplianceScan,
  });

  const { toggleDiagnosis, removeDiagnosisCode, toggleTakst } = useDiagnosisHandlers({
    encounterData,
    setEncounterData,
    examData,
    panels,
    setDiagnosisSearch,
    setShowDiagnosisDropdown,
    setSelectedTakster,
  });

  const { getAISuggestions } = useAISuggestions({
    encounterData,
    patient,
    setAiSuggestions,
    setAiLoading,
  });

  useEncounterEffects({
    encounterStartTime,
    setElapsedTime,
    timerIntervalRef,
    isSigned,
    encounterId,
    handleSave,
    signMutation,
    sectionRefs,
    setShowTemplatePicker,
    setShowAIAssistant,
    setShowKeyboardHelp,
    setShowAmendmentForm,
    handleSALT,
    encounterData,
    screenForRedFlags,
  });

  const totalPrice = taksterNorwegian
    .filter((t) => selectedTakster.includes(t.id))
    .reduce((sum, t) => sum + t.price, 0);

  const patientData = patient?.data;
  const patientAge = patientData?.date_of_birth
    ? Math.floor((new Date() - new Date(patientData.date_of_birth)) / 31557600000)
    : null;
  const patientInitials = patientData
    ? `${patientData.first_name?.[0] || ''}${patientData.last_name?.[0] || ''}`.toUpperCase()
    : '??';
  const patientRedFlags = patientData?.red_flags || [];
  const patientContraindications = patientData?.contraindications || [];

  const allDiagnoses = commonDiagnoses?.data || [];
  const filteredDiagnoses = allDiagnoses.filter(
    (d) =>
      d.code?.toLowerCase().includes(diagnosisSearch.toLowerCase()) ||
      d.description_no?.toLowerCase().includes(diagnosisSearch.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* Quick Palpation Spine Sidebar */}
      <div className="fixed right-0 top-0 w-44 h-full z-20 shadow-lg">
        <Suspense fallback={<div className="animate-pulse bg-slate-100 rounded-lg h-full" />}>
          <QuickPalpationSpine onInsertText={handleSpineTextInsert} disabled={isSigned} />
        </Suspense>
      </div>

      <div className="flex flex-1 mr-44">
        {/* LEFT SIDEBAR */}
        <PatientInfoSidebar
          patientData={patientData}
          patientLoading={patientLoading}
          patientInitials={patientInitials}
          patientAge={patientAge}
          patientRedFlags={patientRedFlags}
          patientContraindications={patientContraindications}
          redFlagAlerts={redFlagAlerts}
          clinicalWarnings={clinicalWarnings}
          aiSuggestions={aiSuggestions}
          onNavigateBack={() => navigate(`/patients/${patientId}`)}
          onOpenAIAssistant={() => setShowAIAssistant(true)}
          onOpenTemplatePicker={() => setShowTemplatePicker(true)}
        />

        {/* MAIN CONTENT */}
        <main className="flex-1 flex flex-col h-full overflow-hidden">
          <EncounterHeader
            encounterData={encounterData}
            setEncounterData={setEncounterData}
            isSigned={isSigned}
            encounterId={encounterId}
            elapsedTime={elapsedTime}
            totalPrice={totalPrice}
            applyEncounterTypeDefaults={applyEncounterTypeDefaults}
            previousEncounters={previousEncounters}
            handleSALT={handleSALT}
            autoSaveStatus={autoSaveStatus}
            lastSaved={lastSaved}
            saveMutation={saveMutation}
            setShowKeyboardHelp={setShowKeyboardHelp}
          />

          <Suspense fallback={null}>
            <KeyboardShortcutsModal
              showKeyboardHelp={showKeyboardHelp}
              setShowKeyboardHelp={setShowKeyboardHelp}
              keyboardShortcuts={keyboardShortcuts}
              macros={macros}
            />
          </Suspense>

          {/* Macro hint tooltip */}
          {showMacroHint && currentMacroMatch && (
            <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 bg-slate-800 text-white text-xs px-3 py-1.5 rounded-full shadow-lg">
              {'\uD83D\uDCA1'} {currentMacroMatch}
            </div>
          )}

          {/* SOAP ORDER TOGGLE */}
          <div className="flex items-center justify-end px-6 pt-2">
            <button
              onClick={() => {
                const current = clinicalPrefs.soapSectionOrder || 'soap';
                const next = current === 'soap' ? 'asoap' : 'soap';
                updatePreference('soapSectionOrder', next);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full border border-slate-300 text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors"
              title={
                (clinicalPrefs.soapSectionOrder || 'soap') === 'soap'
                  ? t('switchToASOAP')
                  : t('switchToSOAP')
              }
            >
              <span className="font-bold">
                {(clinicalPrefs.soapSectionOrder || 'soap') === 'soap' ? 'SOAP' : 'ASOAP'}
              </span>
              <span className="text-slate-400 dark:text-slate-300">|</span>
              <span className="text-slate-400 dark:text-slate-300">
                {(clinicalPrefs.soapSectionOrder || 'soap') === 'soap' ? 'ASOAP' : 'SOAP'}
              </span>
            </button>
          </div>

          {/* CARRY-FORWARD ANATOMY FINDINGS BANNER */}
          {latestAnatomyFindings?.length > 0 && !encounterId && !isSigned && (
            <div className="mx-6 mt-2 space-y-1">
              <div className="p-3 bg-violet-50 border border-violet-200 rounded-lg flex items-center justify-between">
                <div className="text-sm text-violet-800">
                  <span className="font-medium">{latestAnatomyFindings.length} funn</span>
                  {' fra forrige konsultasjon tilgjengelig'}
                </div>
                <button
                  onClick={handleCarryForward}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-md transition-colors"
                >
                  Bruk forrige funn
                </button>
              </div>
              {/* Compliance guard: warn if previous findings were also carried forward */}
              {latestAnatomyFindings.some((f) => f.source === 'carried_forward') && (
                <div className="p-2 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-700">
                  Noen funn har blitt viderefort uten ny undersokelse i flere konsultasjoner. Vurder
                  a bekrefte eller oppdatere disse funnene.
                </div>
              )}
            </div>
          )}

          {/* SCROLLABLE SOAP FORM */}
          <div className="flex-1 overflow-y-auto">
            <ExamPanelProvider panels={panels} examData={examData}>
              <SOAPNoteForm
                encounterData={encounterData}
                setEncounterData={setEncounterData}
                isSigned={isSigned}
                updateField={updateField}
                quickPhrases={quickPhrases}
                handleQuickPhrase={handleQuickPhrase}
                previousEncounters={previousEncounters}
                showSALTBanner={showSALTBanner}
                setShowSALTBanner={setShowSALTBanner}
                saltBannerExpanded={saltBannerExpanded}
                setSaltBannerExpanded={setSaltBannerExpanded}
                handleSALT={handleSALT}
                textAreaRefs={textAreaRefs}
                setActiveField={setActiveField}
                patientId={patientId}
                encounterId={encounterId}
                handleOrthoExamChange={handleOrthoExamChange}
                handleNeuroExamChange={handleNeuroExamChange}
                onAnatomyInsertText={handleSpineTextInsert}
                diagnosisSearch={diagnosisSearch}
                setDiagnosisSearch={setDiagnosisSearch}
                showDiagnosisDropdown={showDiagnosisDropdown}
                setShowDiagnosisDropdown={setShowDiagnosisDropdown}
                filteredDiagnoses={filteredDiagnoses}
                toggleDiagnosis={toggleDiagnosis}
                removeDiagnosisCode={removeDiagnosisCode}
                clinicalPrefs={clinicalPrefs}
                currentNotationMethod={currentNotationMethod}
                getNotationName={getNotationName}
                isVisualNotation={isVisualNotation}
                clinicalLang={clinicalLang}
                notationData={notationData}
                setNotationData={setNotationData}
                notationNarrative={notationNarrative}
                setNotationNarrative={setNotationNarrative}
                navigate={navigate}
                selectedTakster={selectedTakster}
                toggleTakst={toggleTakst}
                showTakster={showTakster}
                setShowTakster={setShowTakster}
                totalPrice={totalPrice}
                showExercisePanel={showExercisePanel}
                setShowExercisePanel={setShowExercisePanel}
                setAutoSaveStatus={setAutoSaveStatus}
                sectionOrder={clinicalPrefs.soapSectionOrder || 'soap'}
                suggestedCodes={suggestedCodes}
                suggestedCMTCode={suggestedCMTCode}
              />

              {/* Amendments (signed encounters only) */}
              {isSigned && (
                <Suspense fallback={null}>
                  <div className="max-w-4xl mx-auto px-6 pb-6">
                    <AmendmentSection
                      isSigned={isSigned}
                      amendments={amendments}
                      showAmendmentForm={showAmendmentForm}
                      setShowAmendmentForm={setShowAmendmentForm}
                      amendmentContent={amendmentContent}
                      setAmendmentContent={setAmendmentContent}
                      amendmentType={amendmentType}
                      setAmendmentType={setAmendmentType}
                      amendmentReason={amendmentReason}
                      setAmendmentReason={setAmendmentReason}
                      handleCreateAmendment={handleCreateAmendment}
                      createAmendmentMutation={createAmendmentMutation}
                      signAmendmentMutation={signAmendmentMutation}
                    />
                  </div>
                </Suspense>
              )}
            </ExamPanelProvider>
          </div>

          <Suspense fallback={null}>
            <ComplianceScan
              encounterData={encounterData}
              selectedTakster={selectedTakster}
              redFlagAlerts={redFlagAlerts}
              visible={showComplianceScan}
              onDismiss={() => setShowComplianceScan(false)}
              onProceed={handleSignAndLock}
            />
          </Suspense>

          <EncounterFooter
            patientId={patientId}
            isSigned={isSigned}
            saveMutation={saveMutation}
            signMutation={signMutation}
            handleSave={handleSave}
            handleSignAndLock={handlePreSign}
            navigate={navigate}
          />
        </main>

        <ClinicalEncounterModals
          showAIAssistant={showAIAssistant}
          setShowAIAssistant={setShowAIAssistant}
          aiSuggestions={aiSuggestions}
          aiLoading={aiLoading}
          getAISuggestions={getAISuggestions}
          showAIDiagnosisSidebar={showAIDiagnosisSidebar}
          setShowAIDiagnosisSidebar={setShowAIDiagnosisSidebar}
          encounterData={encounterData}
          setEncounterData={setEncounterData}
          setAutoSaveStatus={setAutoSaveStatus}
          isSigned={isSigned}
          showTemplatePicker={showTemplatePicker}
          setShowTemplatePicker={setShowTemplatePicker}
          handleTemplateSelect={handleTemplateSelect}
          activeField={activeField}
          showRedFlagModal={showRedFlagModal}
          setShowRedFlagModal={setShowRedFlagModal}
          criticalFlagsForModal={criticalFlagsForModal}
          setRedFlagAlerts={setRedFlagAlerts}
          autoSaveStatus={autoSaveStatus}
          lastSaved={lastSaved}
        />
      </div>
    </div>
  );
}
