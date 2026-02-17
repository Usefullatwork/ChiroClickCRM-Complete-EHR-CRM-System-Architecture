/**
 * SOAPNoteForm - Extracted from ClinicalEncounter.jsx
 * Contains the four SOAP sections: Subjective, Objective, Assessment, Plan
 */
import { Activity, Target, Settings } from 'lucide-react';
import { EnhancedClinicalTextarea, SALTBanner } from '../clinical';
import {
  BodyChartPanel,
  AnatomicalBodyChart,
  ActivatorMethodPanel,
  FacialLinesChart,
} from '../examination';
import { ExercisePanel } from '../exercises';
import { DiagnosisPanel } from './DiagnosisPanel';
import { TaksterPanel } from './TaksterPanel';
import { ExamPanelManager } from './ExamPanelManager';

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
  // VAS
  // Objective section
  textAreaRefs,
  setActiveField,
  // Exam panel manager
  state,
  patientId,
  encounterId,
  handleOrthoExamChange,
  handleNeuroExamChange,
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
}) {
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

      {/* S - SUBJECTIVE */}
      <section
        data-testid="encounter-subjective"
        className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
      >
        <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-white border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <span className="bg-blue-600 text-white h-6 w-6 rounded-md flex items-center justify-center text-sm font-bold">
              S
            </span>
            Subjektivt
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">VAS Start:</span>
            <input
              type="range"
              min="0"
              max="10"
              value={encounterData.vas_pain_start || 0}
              onChange={(e) =>
                setEncounterData((prev) => ({
                  ...prev,
                  vas_pain_start: parseInt(e.target.value),
                }))
              }
              disabled={isSigned}
              className="w-20 h-1.5 accent-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <span className="text-sm font-semibold text-blue-600 w-6">
              {encounterData.vas_pain_start || 0}
            </span>
          </div>
        </div>
        <div className="p-4 space-y-3">
          <input
            type="text"
            placeholder="Hovedklage..."
            value={encounterData.subjective.chief_complaint}
            onChange={(e) => updateField('subjective', 'chief_complaint', e.target.value)}
            disabled={isSigned}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
          />
          <EnhancedClinicalTextarea
            value={encounterData.subjective.history}
            onChange={(val) => updateField('subjective', 'history', val)}
            placeholder="Anamnese og symptombeskrivelse..."
            label="Sykehistorie"
            section="subjective"
            field="history"
            quickPhrases={quickPhrases.subjective}
            disabled={isSigned}
            rows={4}
            showVoiceInput={true}
            showAIButton={false}
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Debut (n\u00E5r startet det?)"
              value={encounterData.subjective.onset}
              onChange={(e) => updateField('subjective', 'onset', e.target.value)}
              disabled={isSigned}
              className="px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
            />
            <input
              type="text"
              placeholder="Smertebeskrivelse"
              value={encounterData.subjective.pain_description}
              onChange={(e) => updateField('subjective', 'pain_description', e.target.value)}
              disabled={isSigned}
              className="px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </section>

      {/* O - OBJECTIVE */}
      <section
        data-testid="encounter-objective"
        className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
      >
        <div className="px-4 py-3 bg-gradient-to-r from-emerald-50 to-white border-b border-slate-100">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <span className="bg-emerald-600 text-white h-6 w-6 rounded-md flex items-center justify-center text-sm font-bold">
              O
            </span>
            Objektivt
          </h3>
        </div>
        <div className="p-4 space-y-4">
          {/* Observation & Palpation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <EnhancedClinicalTextarea
              value={encounterData.objective.observation}
              onChange={(val) => updateField('objective', 'observation', val)}
              placeholder="Observasjon (holdning, gange)..."
              label="Observasjon"
              section="objective"
              field="observation"
              disabled={isSigned}
              rows={3}
              showVoiceInput={true}
              showAIButton={false}
            />
            <EnhancedClinicalTextarea
              value={encounterData.objective.palpation}
              onChange={(val) => updateField('objective', 'palpation', val)}
              placeholder="Palpasjon (\u00F8mhet, spenninger)..."
              label="Palpasjon"
              section="objective"
              field="palpation"
              disabled={isSigned}
              rows={3}
              showVoiceInput={true}
              showAIButton={false}
            />
          </div>

          {/* ROM */}
          <textarea
            placeholder="Range of Motion (ROM)..."
            value={encounterData.objective.rom}
            onChange={(e) => updateField('objective', 'rom', e.target.value)}
            disabled={isSigned}
            className="w-full min-h-[60px] p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 resize-none text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
          />

          {/* All exam panels via ExamPanelManager */}
          <ExamPanelManager
            patientId={patientId}
            encounterId={encounterId}
            isSigned={isSigned}
            showOrthoExam={state.showOrthoExam}
            setShowOrthoExam={state.setShowOrthoExam}
            orthoExamData={state.orthoExamData}
            onOrthoExamChange={handleOrthoExamChange}
            showNeuroExam={state.showNeuroExam}
            setShowNeuroExam={state.setShowNeuroExam}
            neuroExamData={state.neuroExamData}
            onNeuroExamChange={handleNeuroExamChange}
            showROMTable={state.showROMTable}
            setShowROMTable={state.setShowROMTable}
            romTableData={state.romTableData}
            setRomTableData={state.setRomTableData}
            showBodyDiagram={state.showBodyDiagram}
            setShowBodyDiagram={state.setShowBodyDiagram}
            bodyDiagramMarkers={state.bodyDiagramMarkers}
            setBodyDiagramMarkers={state.setBodyDiagramMarkers}
            showExamProtocol={state.showExamProtocol}
            setShowExamProtocol={state.setShowExamProtocol}
            examProtocolData={state.examProtocolData}
            setExamProtocolData={state.setExamProtocolData}
            showClusterTests={state.showClusterTests}
            setShowClusterTests={state.setShowClusterTests}
            clusterTestData={state.clusterTestData}
            setClusterTestData={state.setClusterTestData}
            showRegionalExam={state.showRegionalExam}
            setShowRegionalExam={state.setShowRegionalExam}
            regionalExamData={state.regionalExamData}
            setRegionalExamData={state.setRegionalExamData}
            showNeurologicalExam={state.showNeurologicalExam}
            setShowNeurologicalExam={state.setShowNeurologicalExam}
            neurologicalExamData={state.neurologicalExamData}
            setNeurologicalExamData={state.setNeurologicalExamData}
            showOutcomeMeasures={state.showOutcomeMeasures}
            setShowOutcomeMeasures={state.setShowOutcomeMeasures}
            outcomeMeasureType={state.outcomeMeasureType}
            setOutcomeMeasureType={state.setOutcomeMeasureType}
            outcomeMeasureData={state.outcomeMeasureData}
            setOutcomeMeasureData={state.setOutcomeMeasureData}
            showMMT={state.showMMT}
            setShowMMT={state.setShowMMT}
            mmtData={state.mmtData}
            setMmtData={state.setMmtData}
            showDTR={state.showDTR}
            setShowDTR={state.setShowDTR}
            dtrData={state.dtrData}
            setDtrData={state.setDtrData}
            showSensoryExam={state.showSensoryExam}
            setShowSensoryExam={state.setShowSensoryExam}
            sensoryExamData={state.sensoryExamData}
            setSensoryExamData={state.setSensoryExamData}
            showCranialNerves={state.showCranialNerves}
            setShowCranialNerves={state.setShowCranialNerves}
            cranialNerveData={state.cranialNerveData}
            setCranialNerveData={state.setCranialNerveData}
            showCoordination={state.showCoordination}
            setShowCoordination={state.setShowCoordination}
            coordinationData={state.coordinationData}
            setCoordinationData={state.setCoordinationData}
            showNerveTension={state.showNerveTension}
            setShowNerveTension={state.setShowNerveTension}
            nerveTensionData={state.nerveTensionData}
            setNerveTensionData={state.setNerveTensionData}
            showRegionalDiagrams={state.showRegionalDiagrams}
            setShowRegionalDiagrams={state.setShowRegionalDiagrams}
            regionalDiagramData={state.regionalDiagramData}
            setRegionalDiagramData={state.setRegionalDiagramData}
            selectedRegion={state.selectedRegion}
            setSelectedRegion={state.setSelectedRegion}
            showPainAssessment={state.showPainAssessment}
            setShowPainAssessment={state.setShowPainAssessment}
            painAssessmentData={state.painAssessmentData}
            setPainAssessmentData={state.setPainAssessmentData}
            showHeadacheAssessment={state.showHeadacheAssessment}
            setShowHeadacheAssessment={state.setShowHeadacheAssessment}
            headacheData={state.headacheData}
            setHeadacheData={state.setHeadacheData}
            showTissueMarkers={state.showTissueMarkers}
            setShowTissueMarkers={state.setShowTissueMarkers}
            tissueMarkerData={state.tissueMarkerData}
            setTissueMarkerData={state.setTissueMarkerData}
            updateField={updateField}
            encounterData={encounterData}
          />

          <textarea
            ref={(el) => (textAreaRefs.current['objective.ortho_tests'] = el)}
            placeholder="Ortopediske tester (sammendrag)..."
            value={encounterData.objective.ortho_tests}
            onChange={(e) => updateField('objective', 'ortho_tests', e.target.value)}
            onFocus={() => setActiveField('objective.ortho_tests')}
            disabled={isSigned}
            className="w-full min-h-[60px] p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 resize-none text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
          />

          <textarea
            ref={(el) => (textAreaRefs.current['objective.neuro_tests'] = el)}
            placeholder="Nevrologiske tester (sammendrag)..."
            value={encounterData.objective.neuro_tests}
            onChange={(e) => updateField('objective', 'neuro_tests', e.target.value)}
            onFocus={() => setActiveField('objective.neuro_tests')}
            disabled={isSigned}
            className="w-full min-h-[60px] p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 resize-none text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
          />

          {!isSigned && (
            <div className="flex flex-wrap gap-1.5">
              {quickPhrases.objective.map((phrase) => (
                <button
                  key={phrase}
                  onClick={() => handleQuickPhrase(phrase, 'objective', 'ortho_tests')}
                  className="px-2.5 py-1 text-xs rounded-full bg-slate-100 text-slate-600 hover:bg-emerald-100 hover:text-emerald-700 transition-colors"
                >
                  + {phrase}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* A - ASSESSMENT / DIAGNOSIS */}
      <section
        data-testid="encounter-assessment"
        className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
      >
        <div className="px-4 py-3 bg-gradient-to-r from-amber-50 to-white border-b border-slate-100">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <span className="bg-amber-500 text-white h-6 w-6 rounded-md flex items-center justify-center text-sm font-bold">
              A
            </span>
            Vurdering & Diagnose
          </h3>
        </div>
        <div className="p-4 space-y-4">
          <DiagnosisPanel
            diagnosisSearch={diagnosisSearch}
            onSearchChange={setDiagnosisSearch}
            showDropdown={showDiagnosisDropdown}
            onShowDropdown={setShowDiagnosisDropdown}
            filteredDiagnoses={filteredDiagnoses}
            selectedCodes={encounterData.icpc_codes}
            onToggleDiagnosis={toggleDiagnosis}
            onRemoveCode={removeDiagnosisCode}
            isSigned={isSigned}
          />

          <EnhancedClinicalTextarea
            value={encounterData.assessment.clinical_reasoning}
            onChange={(val) => updateField('assessment', 'clinical_reasoning', val)}
            placeholder="Klinisk resonnering og vurdering..."
            label="Klinisk vurdering"
            section="assessment"
            field="clinical_reasoning"
            disabled={isSigned}
            rows={3}
            showVoiceInput={true}
            showAIButton={true}
            aiContext={{ soapData: encounterData, patientId }}
          />

          <input
            type="text"
            placeholder="Differensialdiagnoser..."
            value={encounterData.assessment.differential_diagnosis}
            onChange={(e) => updateField('assessment', 'differential_diagnosis', e.target.value)}
            disabled={isSigned}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-amber-500 text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
          />
        </div>
      </section>

      {/* P - PLAN & TREATMENT (TAKSTER) */}
      <section
        data-testid="encounter-plan"
        className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
      >
        <div className="px-4 py-3 bg-gradient-to-r from-purple-50 to-white border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <span className="bg-purple-600 text-white h-6 w-6 rounded-md flex items-center justify-center text-sm font-bold">
              P
            </span>
            Plan & Behandling
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">VAS Slutt:</span>
            <input
              type="range"
              min="0"
              max="10"
              value={encounterData.vas_pain_end || 0}
              onChange={(e) =>
                setEncounterData((prev) => ({
                  ...prev,
                  vas_pain_end: parseInt(e.target.value),
                }))
              }
              disabled={isSigned}
              className="w-20 h-1.5 accent-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <span className="text-sm font-semibold text-purple-600 w-6">
              {encounterData.vas_pain_end || 0}
            </span>
          </div>
        </div>
        <div className="p-4 space-y-4">
          {/* Treatment Notation Method Indicator */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700">Behandlingsnotasjon:</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-medium">
                <Target className="h-3 w-3" />
                {getNotationName()}
              </span>
            </div>
            <button
              onClick={() => navigate('/settings')}
              className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
            >
              <Settings className="h-3 w-3" />
              Endre i innstillinger
            </button>
          </div>

          {/* Treatment Performed - Conditional Rendering Based on Notation Method */}
          {isVisualNotation ? (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              {currentNotationMethod.id === 'body_chart' && (
                <BodyChartPanel
                  value={notationData}
                  onChange={setNotationData}
                  onGenerateNarrative={(narrative) => {
                    setNotationNarrative(narrative);
                    updateField('plan', 'treatment', narrative);
                  }}
                  lang={clinicalLang}
                  readOnly={isSigned}
                />
              )}
              {currentNotationMethod.id === 'anatomical_chart' && (
                <AnatomicalBodyChart
                  value={notationData}
                  onChange={setNotationData}
                  onGenerateNarrative={(narrative) => {
                    setNotationNarrative(narrative);
                    updateField('plan', 'treatment', narrative);
                  }}
                  lang={clinicalLang}
                  showDermatomes={clinicalPrefs.showDermatomes}
                  showTriggerPoints={clinicalPrefs.showTriggerPoints}
                  readOnly={isSigned}
                />
              )}
              {currentNotationMethod.id === 'activator_protocol' && (
                <ActivatorMethodPanel
                  value={notationData}
                  onChange={setNotationData}
                  onGenerateNarrative={(narrative) => {
                    setNotationNarrative(narrative);
                    updateField('plan', 'treatment', narrative);
                  }}
                  lang={clinicalLang}
                  readOnly={isSigned}
                />
              )}
              {currentNotationMethod.id === 'facial_lines' && (
                <FacialLinesChart
                  value={notationData}
                  onChange={setNotationData}
                  onGenerateNarrative={(narrative) => {
                    setNotationNarrative(narrative);
                    updateField('plan', 'treatment', narrative);
                  }}
                  lang={clinicalLang}
                  readOnly={isSigned}
                />
              )}
            </div>
          ) : (
            <EnhancedClinicalTextarea
              value={encounterData.plan.treatment}
              onChange={(val) => updateField('plan', 'treatment', val)}
              placeholder={
                currentNotationMethod.id === 'segment_listing'
                  ? 'Segmentlisting: f.eks. C5 PRS, T4-T6 anterior, L5 PLI...'
                  : currentNotationMethod.id === 'gonstead_listing'
                    ? 'Gonstead: f.eks. Atlas ASLA, C2 PRSA, L5 PLI-M...'
                    : currentNotationMethod.id === 'diversified_notation'
                      ? 'Diversifisert: beskriv manipulasjoner og mobiliseringer...'
                      : currentNotationMethod.id === 'soap_narrative'
                        ? 'SOAP narrativ: beskriv behandlingen i detalj...'
                        : 'Utf\u00F8rt behandling...'
              }
              label="Behandling"
              section="plan"
              field="treatment"
              disabled={isSigned}
              rows={3}
              showVoiceInput={true}
              showAIButton={false}
            />
          )}

          {/* Takster Panel */}
          <TaksterPanel
            selectedTakster={selectedTakster}
            onToggleTakst={toggleTakst}
            showTakster={showTakster}
            onToggleShow={() => setShowTakster(!showTakster)}
            totalPrice={totalPrice}
            isSigned={isSigned}
          />

          {/* Exercises & Advice */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Hjemme{'\u00F8'}velser</span>
              <button
                onClick={() => setShowExercisePanel(!showExercisePanel)}
                disabled={isSigned}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                <Activity className="w-3.5 h-3.5" />
                {showExercisePanel ? 'Skjul \u00F8velsesbibliotek' : 'Velg fra bibliotek'}
              </button>
            </div>
            {showExercisePanel && (
              <div className="border border-green-200 rounded-lg overflow-hidden">
                <ExercisePanel
                  patientId={patientId}
                  encounterId={encounterId}
                  onExercisesChange={(exercises) => {
                    const exerciseText = exercises
                      .map(
                        (e) =>
                          `${e.name_no || e.name_en}: ${e.sets || 3}x${e.reps || 10}, ${e.frequency || 'daglig'}`
                      )
                      .join('\n');
                    updateField('plan', 'exercises', exerciseText);
                  }}
                  compact={true}
                />
              </div>
            )}
            <EnhancedClinicalTextarea
              value={encounterData.plan.exercises}
              onChange={(val) => updateField('plan', 'exercises', val)}
              placeholder="Hjemme\u00F8velser og r\u00E5d... (eller velg fra biblioteket over)"
              label="Hjemme\u00F8velser"
              section="plan"
              field="exercises"
              disabled={isSigned}
              rows={3}
              showVoiceInput={true}
              showAIButton={false}
            />
          </div>

          {/* Follow-up */}
          <div className="flex items-center gap-4 pt-3 border-t border-slate-100">
            <span className="text-sm font-medium text-slate-700">Oppf{'\u00F8'}lging:</span>
            <input
              type="text"
              placeholder="f.eks. 1 uke, 3 behandlinger"
              value={encounterData.plan.follow_up}
              onChange={(e) => updateField('plan', 'follow_up', e.target.value)}
              disabled={isSigned}
              className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-purple-500 text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
