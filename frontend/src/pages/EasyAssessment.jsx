import { lazy, Suspense } from 'react';
import {
  AlertTriangle,
  Sparkles,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  FileText,
  Copy,
  Command,
} from 'lucide-react';
// Direct file imports to avoid barrel bundling all 40+ assessment modules
import ProblemList from '../components/assessment/ProblemList';
import TreatmentPlanTracker from '../components/assessment/TreatmentPlanTracker';
import EasyAssessmentHeader from '../components/easyassessment/EasyAssessmentHeader';
import { EasyAssessmentModals } from '../components/easyassessment/EasyAssessmentModals';

import useEasyAssessmentState from '../hooks/useEasyAssessmentState';

// Lazy-load SOAP tabs (only one visible at a time)
const SubjectiveTab = lazy(() => import('../components/easyassessment/SubjectiveTab'));
const ObjectiveTab = lazy(() => import('../components/easyassessment/ObjectiveTab'));
const AssessmentTab = lazy(() => import('../components/easyassessment/AssessmentTab'));
const PlanTab = lazy(() => import('../components/easyassessment/PlanTab'));

export default function EasyAssessment() {
  const state = useEasyAssessmentState();
  const {
    patientId,
    navigate,
    activeTab,
    setActiveTab,
    tabs,
    canGoBack,
    canGoForward,
    goToNextTab,
    goToPrevTab,
    viewMode,
    setViewMode,
    redFlagAlerts,
    clinicalWarnings,
    showTemplatePicker,
    setShowTemplatePicker,
    showOutcomeAssessment,
    setShowOutcomeAssessment,
    outcomeType,
    setOutcomeType,
    showBodyChart,
    setShowBodyChart,
    showTemplateLibrary,
    setShowTemplateLibrary,
    showMacroMatrix,
    setShowMacroMatrix,
    showCompliancePanel,
    setShowCompliancePanel,
    showPrintPreview,
    setShowPrintPreview,
    showSlashReference,
    setShowSlashReference,
    showAIScribe,
    setShowAIScribe,
    showAISettings,
    setShowAISettings,
    language,
    setLanguage,
    macroFavorites,
    setMacroFavorites,
    aiAvailable,
    encounterData,
    setEncounterData,
    problems,
    setProblems,
    treatmentPlan,
    setTreatmentPlan,
    currentVisitNumber,
    patient,
    previousEncounter,
    commonDiagnoses,
    copiedToClipboard,
    copyToClipboard,
    saveMutation,
    handleSave,
    updateField,
    updateQuickSelect,
    addDiagnosisCode,
    removeDiagnosisCode,
    handleSALTApply,
    handleMacroInsert,
    handleComplianceAutoFix,
    buildAIContext,
    generateNarrativeText,
  } = state;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <EasyAssessmentHeader
        patient={patient}
        treatmentPlan={treatmentPlan}
        currentVisitNumber={currentVisitNumber}
        patientId={patientId}
        navigate={navigate}
        language={language}
        setLanguage={setLanguage}
        previousEncounter={previousEncounter}
        handleSALTApply={handleSALTApply}
        setShowAISettings={setShowAISettings}
        setShowAIScribe={setShowAIScribe}
        setShowCompliancePanel={setShowCompliancePanel}
        setShowMacroMatrix={setShowMacroMatrix}
        viewMode={viewMode}
        setViewMode={setViewMode}
        setShowPrintPreview={setShowPrintPreview}
        copyToClipboard={copyToClipboard}
        copiedToClipboard={copiedToClipboard}
        handleSave={handleSave}
        saveMutation={saveMutation}
        encounterData={encounterData}
      />

      {/* Main Layout - ChiroTouch Style 3-Column */}
      <div className="flex h-[calc(100vh-64px)]">
        {/* Left Sidebar - Problem List */}
        <div className="w-72 bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0">
          <ProblemList
            problems={problems}
            onChange={setProblems}
            patientName={`${patient?.data?.first_name || ''} ${patient?.data?.last_name || ''}`}
            className="rounded-none border-0"
          />
          <TreatmentPlanTracker
            plan={treatmentPlan}
            currentVisit={currentVisitNumber}
            onChange={setTreatmentPlan}
            className="rounded-none border-0 border-t"
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto">
          {/* Alerts */}
          {(redFlagAlerts.length > 0 || clinicalWarnings.length > 0) && (
            <div className="px-4 py-2 space-y-2 bg-gray-50">
              {redFlagAlerts.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-2 flex items-start gap-2">
                  <AlertTriangle className="text-red-600 w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-red-700">{redFlagAlerts.join(', ')}</span>
                </div>
              )}
              {clinicalWarnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 flex items-start gap-2">
                  <AlertTriangle className="text-yellow-600 w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-yellow-700">{clinicalWarnings.join(', ')}</span>
                </div>
              )}
            </div>
          )}

          {/* Metadata Bar */}
          <div className="bg-white border-b border-gray-200 px-4 py-3">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Date:
                </label>
                <input
                  type="date"
                  value={encounterData.encounter_date}
                  onChange={(e) =>
                    setEncounterData((prev) => ({ ...prev, encounter_date: e.target.value }))
                  }
                  className="px-2 py-1 text-sm border border-gray-300 rounded"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Type:
                </label>
                <select
                  value={encounterData.encounter_type}
                  onChange={(e) =>
                    setEncounterData((prev) => ({ ...prev, encounter_type: e.target.value }))
                  }
                  className="px-2 py-1 text-sm border border-gray-300 rounded"
                >
                  <option value="INITIAL">Initial</option>
                  <option value="FOLLOWUP">Follow-up</option>
                  <option value="REEXAM">Re-exam</option>
                  <option value="EMERGENCY">Emergency</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Duration:
                </label>
                <input
                  type="number"
                  value={encounterData.duration_minutes}
                  onChange={(e) =>
                    setEncounterData((prev) => ({
                      ...prev,
                      duration_minutes: parseInt(e.target.value),
                    }))
                  }
                  className="w-16 px-2 py-1 text-sm border border-gray-300 rounded"
                />
                <span className="text-xs text-gray-500 dark:text-gray-400">min</span>
              </div>
              <div className="flex-1"></div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    VAS Start:
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={encounterData.vas_pain_start ?? ''}
                    onChange={(e) =>
                      setEncounterData((prev) => ({
                        ...prev,
                        vas_pain_start: e.target.value ? parseInt(e.target.value) : null,
                      }))
                    }
                    className="w-14 px-2 py-1 text-sm border border-gray-300 rounded text-center"
                    placeholder="0-10"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    VAS End:
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={encounterData.vas_pain_end ?? ''}
                    onChange={(e) =>
                      setEncounterData((prev) => ({
                        ...prev,
                        vas_pain_end: e.target.value ? parseInt(e.target.value) : null,
                      }))
                    }
                    className="w-14 px-2 py-1 text-sm border border-gray-300 rounded text-center"
                    placeholder="0-10"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Preview Mode */}
          {viewMode === 'preview' && (
            <div className="p-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Chart Notes</h2>
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Copy className="w-4 h-4" />
                    {copiedToClipboard ? 'Copied!' : 'Copy to Clipboard'}
                  </button>
                </div>
                <pre className="whitespace-pre-wrap font-sans text-sm bg-gray-50 p-4 rounded-lg leading-relaxed">
                  {generateNarrativeText()}
                </pre>
              </div>
            </div>
          )}

          {/* Easy/Detailed Mode */}
          {viewMode !== 'preview' && (
            <div className="p-4">
              {/* Tab Navigation */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={goToPrevTab}
                  disabled={!canGoBack}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg font-medium ${
                    canGoBack
                      ? 'text-gray-700 hover:bg-gray-200'
                      : 'text-gray-300 cursor-not-allowed'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>

                <div className="flex gap-1 bg-white rounded-lg p-1 shadow-sm">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                        activeTab === tab.id
                          ? 'bg-blue-600 text-white shadow'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      <span>{tab.icon}</span>
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>

                <button
                  onClick={goToNextTab}
                  disabled={!canGoForward}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg font-medium ${
                    canGoForward
                      ? 'text-gray-700 hover:bg-gray-200'
                      : 'text-gray-300 cursor-not-allowed'
                  }`}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <Suspense fallback={<div className="animate-pulse bg-gray-50 rounded-lg h-64" />}>
                {activeTab === 'subjective' && (
                  <SubjectiveTab
                    encounterData={encounterData}
                    viewMode={viewMode}
                    language={language}
                    aiAvailable={aiAvailable}
                    updateField={updateField}
                    updateQuickSelect={updateQuickSelect}
                    buildAIContext={buildAIContext}
                    setShowBodyChart={setShowBodyChart}
                  />
                )}

                {activeTab === 'objective' && (
                  <ObjectiveTab
                    encounterData={encounterData}
                    viewMode={viewMode}
                    language={language}
                    aiAvailable={aiAvailable}
                    updateField={updateField}
                    updateQuickSelect={updateQuickSelect}
                    buildAIContext={buildAIContext}
                  />
                )}

                {activeTab === 'assessment' && (
                  <AssessmentTab
                    encounterData={encounterData}
                    setEncounterData={setEncounterData}
                    language={language}
                    aiAvailable={aiAvailable}
                    updateField={updateField}
                    addDiagnosisCode={addDiagnosisCode}
                    removeDiagnosisCode={removeDiagnosisCode}
                    commonDiagnoses={commonDiagnoses}
                    buildAIContext={buildAIContext}
                    showOutcomeAssessment={showOutcomeAssessment}
                    setShowOutcomeAssessment={setShowOutcomeAssessment}
                    outcomeType={outcomeType}
                    setOutcomeType={setOutcomeType}
                  />
                )}

                {activeTab === 'plan' && (
                  <PlanTab
                    encounterData={encounterData}
                    viewMode={viewMode}
                    language={language}
                    aiAvailable={aiAvailable}
                    updateField={updateField}
                    updateQuickSelect={updateQuickSelect}
                    buildAIContext={buildAIContext}
                  />
                )}
              </Suspense>
            </div>
          )}
        </div>

        {/* Right Sidebar - Chart Notes Preview */}
        <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto flex-shrink-0">
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Chart Notes
            </h3>
          </div>
          <div className="p-4">
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-xs text-gray-700 leading-relaxed">
                {generateNarrativeText()}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* === MODALS === */}
      <EasyAssessmentModals
        showOutcomeAssessment={showOutcomeAssessment}
        setShowOutcomeAssessment={setShowOutcomeAssessment}
        showTemplatePicker={showTemplatePicker}
        setShowTemplatePicker={setShowTemplatePicker}
        showBodyChart={showBodyChart}
        setShowBodyChart={setShowBodyChart}
        showTemplateLibrary={showTemplateLibrary}
        setShowTemplateLibrary={setShowTemplateLibrary}
        showMacroMatrix={showMacroMatrix}
        setShowMacroMatrix={setShowMacroMatrix}
        showCompliancePanel={showCompliancePanel}
        setShowCompliancePanel={setShowCompliancePanel}
        showPrintPreview={showPrintPreview}
        setShowPrintPreview={setShowPrintPreview}
        showSlashReference={showSlashReference}
        setShowSlashReference={setShowSlashReference}
        showAIScribe={showAIScribe}
        setShowAIScribe={setShowAIScribe}
        showAISettings={showAISettings}
        setShowAISettings={setShowAISettings}
        outcomeType={outcomeType}
        encounterData={encounterData}
        setEncounterData={setEncounterData}
        activeTab={activeTab}
        updateField={updateField}
        language={language}
        macroFavorites={macroFavorites}
        setMacroFavorites={setMacroFavorites}
        handleMacroInsert={handleMacroInsert}
        handleComplianceAutoFix={handleComplianceAutoFix}
        patient={patient}
      />

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3">
        <button
          onClick={() => setShowSlashReference(true)}
          className="w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 flex items-center justify-center"
          title={language === 'en' ? 'Slash Commands Reference' : 'Kommandoreferanse'}
        >
          <Command className="w-5 h-5" />
        </button>
        <button
          onClick={() => setShowTemplateLibrary(true)}
          className="w-12 h-12 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 flex items-center justify-center"
          title={language === 'en' ? 'Template Library' : 'Malbibliotek'}
        >
          <Sparkles className="w-5 h-5" />
        </button>
        <button
          onClick={() => setShowTemplatePicker(true)}
          className="w-12 h-12 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 flex items-center justify-center"
          title={language === 'en' ? 'Quick Templates' : 'Hurtigmaler'}
        >
          <BookOpen className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
