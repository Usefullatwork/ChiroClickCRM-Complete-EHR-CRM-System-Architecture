/**
 * SOAPNoteForm - Orchestrator for the four SOAP sections.
 * Each section is extracted to its own component for maintainability.
 */
import SALTBanner from '../clinical/SALTBanner';
import { SubjectiveSection } from './SubjectiveSection';
import { ObjectiveSection } from './ObjectiveSection';
import { AssessmentSection } from './AssessmentSection';
import { PlanSection } from './PlanSection';

export function SOAPNoteForm({
  encounterData,
  setEncounterData,
  isSigned,
  updateField,
  quickPhrases,
  handleQuickPhrase,
  // SALT
  previousEncounters,
  showSALTBanner,
  setShowSALTBanner,
  saltBannerExpanded,
  setSaltBannerExpanded,
  handleSALT,
  // Objective section
  textAreaRefs: _textAreaRefs,
  setActiveField,
  // Exam panel manager (explicit props — panel/exam state comes from ExamPanelContext)
  patientId,
  encounterId,
  handleOrthoExamChange,
  handleNeuroExamChange,
  onAnatomyInsertText,
  // Diagnosis
  diagnosisSearch,
  setDiagnosisSearch,
  showDiagnosisDropdown,
  setShowDiagnosisDropdown,
  filteredDiagnoses,
  toggleDiagnosis,
  removeDiagnosisCode,
  // Plan section
  clinicalPrefs,
  currentNotationMethod,
  getNotationName,
  isVisualNotation,
  clinicalLang,
  notationData,
  setNotationData,
  _notationNarrative,
  setNotationNarrative,
  navigate,
  // Takster
  selectedTakster,
  toggleTakst,
  showTakster,
  setShowTakster,
  totalPrice,
  // Exercise
  showExercisePanel,
  setShowExercisePanel,
  // Auto-save
  _setAutoSaveStatus,
  // Section order
  sectionOrder = 'soap',
  // Auto-coding suggestions
  suggestedCodes,
  suggestedCMTCode,
}) {
  const subjectiveSection = (
    <SubjectiveSection
      key="subjective"
      encounterData={encounterData}
      setEncounterData={setEncounterData}
      isSigned={isSigned}
      updateField={updateField}
      quickPhrases={quickPhrases}
    />
  );

  const objectiveSection = (
    <ObjectiveSection
      key="objective"
      encounterData={encounterData}
      isSigned={isSigned}
      updateField={updateField}
      quickPhrases={quickPhrases}
      handleQuickPhrase={handleQuickPhrase}
      setActiveField={setActiveField}
      patientId={patientId}
      encounterId={encounterId}
      handleOrthoExamChange={handleOrthoExamChange}
      handleNeuroExamChange={handleNeuroExamChange}
      onAnatomyInsertText={onAnatomyInsertText}
    />
  );

  const assessmentSection = (
    <AssessmentSection
      key="assessment"
      encounterData={encounterData}
      isSigned={isSigned}
      updateField={updateField}
      diagnosisSearch={diagnosisSearch}
      setDiagnosisSearch={setDiagnosisSearch}
      showDiagnosisDropdown={showDiagnosisDropdown}
      setShowDiagnosisDropdown={setShowDiagnosisDropdown}
      filteredDiagnoses={filteredDiagnoses}
      toggleDiagnosis={toggleDiagnosis}
      removeDiagnosisCode={removeDiagnosisCode}
      suggestedCodes={suggestedCodes}
      patientId={patientId}
    />
  );

  const planSection = (
    <PlanSection
      key="plan"
      encounterData={encounterData}
      setEncounterData={setEncounterData}
      isSigned={isSigned}
      updateField={updateField}
      clinicalPrefs={clinicalPrefs}
      currentNotationMethod={currentNotationMethod}
      getNotationName={getNotationName}
      isVisualNotation={isVisualNotation}
      clinicalLang={clinicalLang}
      notationData={notationData}
      setNotationData={setNotationData}
      setNotationNarrative={setNotationNarrative}
      navigate={navigate}
      selectedTakster={selectedTakster}
      toggleTakst={toggleTakst}
      showTakster={showTakster}
      setShowTakster={setShowTakster}
      totalPrice={totalPrice}
      showExercisePanel={showExercisePanel}
      setShowExercisePanel={setShowExercisePanel}
      patientId={patientId}
      encounterId={encounterId}
      suggestedCMTCode={suggestedCMTCode}
    />
  );

  const sections =
    sectionOrder === 'asoap'
      ? [assessmentSection, subjectiveSection, objectiveSection, planSection]
      : [subjectiveSection, objectiveSection, assessmentSection, planSection];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* SALT Banner */}
      {!isSigned && previousEncounters && showSALTBanner && (
        <SALTBanner
          previousEncounter={previousEncounters}
          onApplyAll={() => {
            handleSALT();
            setShowSALTBanner(false);
          }}
          onApplySection={(section) => handleSALT(section)}
          onDismiss={() => setShowSALTBanner(false)}
          isExpanded={saltBannerExpanded}
          onToggleExpand={() => setSaltBannerExpanded(!saltBannerExpanded)}
        />
      )}

      {sections}
    </div>
  );
}
