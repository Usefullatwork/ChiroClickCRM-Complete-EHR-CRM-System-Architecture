import { lazy, Suspense } from 'react';
import {
  Save,
  AlertTriangle,
  X,
  Sparkles,
  Globe,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  FileText,
  Printer,
  Copy,
  Shield,
  Grid,
  Command,
  Mic,
  Cpu,
} from 'lucide-react';
// Direct file imports to avoid barrel bundling all 40+ assessment modules
import ProblemList from '../components/assessment/ProblemList';
import TreatmentPlanTracker, { VisitCounter } from '../components/assessment/TreatmentPlanTracker';
import SALTButton from '../components/assessment/SALTButton';
import { ComplianceIndicator } from '../components/assessment/ComplianceEngine';
import { AIStatusIndicator } from '../components/assessment/AISettings';
const OutcomeAssessment = lazy(() => import('../components/assessment/OutcomeAssessment'));
const TemplatePicker = lazy(() => import('../components/TemplatePicker'));

// Lazy-load modal-only components (shown conditionally via state flags)
const MacroMatrix = lazy(() => import('../components/assessment/MacroMatrix'));
const BodyChart = lazy(() => import('../components/assessment/BodyChart'));
const TemplateLibrary = lazy(() => import('../components/assessment/TemplateLibrary'));
const CompliancePanel = lazy(() => import('../components/assessment/ComplianceEngine'));
const PrintPreview = lazy(() => import('../components/assessment/PrintPreview'));
const AIScribe = lazy(() => import('../components/assessment/AIScribe'));
const AISettings = lazy(() => import('../components/assessment/AISettings'));
const SlashCommandReference = lazy(() =>
  import('../components/assessment/SlashCommands').then((m) => ({
    default: m.SlashCommandReference,
  }))
);

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
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-full mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(`/patients/${patientId}`)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-lg font-bold text-gray-900">
                    {patient?.data?.first_name} {patient?.data?.last_name}
                  </h1>
                  {patient?.data?.date_of_birth && (
                    <span className="text-sm text-gray-500">
                      {Math.floor(
                        (new Date() - new Date(patient.data.date_of_birth)) / 31557600000
                      )}{' '}
                      yrs old
                    </span>
                  )}
                  <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded">
                    Active
                  </span>
                </div>
                {treatmentPlan && (
                  <VisitCounter
                    currentVisit={currentVisitNumber}
                    totalVisits={
                      treatmentPlan.phases?.reduce((sum, p) => sum + p.totalVisits, 0) || 0
                    }
                    className="mt-1"
                  />
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Language Selector */}
              <button
                onClick={() => setLanguage(language === 'en' ? 'no' : 'en')}
                className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                title={language === 'en' ? 'Switch to Norwegian' : 'Bytt til Engelsk'}
              >
                <Globe className="w-4 h-4" />
                {language === 'en' ? '\u{1F1EC}\u{1F1E7} EN' : '\u{1F1F3}\u{1F1F4} NO'}
              </button>

              <SALTButton previousEncounter={previousEncounter} onApply={handleSALTApply} />

              {/* AI Status & Controls */}
              <div className="flex items-center gap-1 border-l border-gray-200 pl-2 ml-1">
                <AIStatusIndicator language={language} onClick={() => setShowAISettings(true)} />
                <button
                  onClick={() => setShowAIScribe(true)}
                  className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                  title={language === 'en' ? 'AI Voice Scribe' : 'AI Stemmeskriver'}
                >
                  <Mic className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowAISettings(true)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                  title={language === 'en' ? 'AI Settings' : 'AI-innstillinger'}
                >
                  <Cpu className="w-4 h-4" />
                </button>
              </div>

              <ComplianceIndicator
                encounterData={encounterData}
                onClick={() => setShowCompliancePanel(true)}
              />

              <button
                onClick={() => setShowMacroMatrix(true)}
                className="flex items-center gap-1 px-3 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                title={language === 'en' ? 'Macro Matrix' : 'Makromatrise'}
              >
                <Grid className="w-4 h-4" />
              </button>

              {/* View Mode Toggle */}
              <div className="inline-flex rounded-lg border border-gray-300 bg-white p-0.5">
                {['easy', 'detailed', 'preview'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      viewMode === mode
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {mode === 'easy'
                      ? language === 'en'
                        ? 'Easy'
                        : 'Enkel'
                      : mode === 'detailed'
                        ? language === 'en'
                          ? 'Detailed'
                          : 'Detaljert'
                        : language === 'en'
                          ? 'Preview'
                          : 'Forh\u00E5ndsvisning'}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowPrintPreview(true)}
                className="flex items-center gap-1 px-3 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                title={language === 'en' ? 'Print Preview' : 'Forh\u00E5ndsvisning'}
              >
                <Printer className="w-4 h-4" />
              </button>

              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1 px-3 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                <Copy className="w-4 h-4" />
                {copiedToClipboard
                  ? language === 'en'
                    ? 'Copied!'
                    : 'Kopiert!'
                  : language === 'en'
                    ? 'Copy'
                    : 'Kopier'}
              </button>

              <button
                onClick={handleSave}
                disabled={saveMutation.isLoading}
                className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saveMutation.isLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>

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
                <label className="text-xs font-medium text-gray-500">Date:</label>
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
                <label className="text-xs font-medium text-gray-500">Type:</label>
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
                <label className="text-xs font-medium text-gray-500">Duration:</label>
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
                <span className="text-xs text-gray-500">min</span>
              </div>
              <div className="flex-1"></div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-gray-500">VAS Start:</label>
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
                  <label className="text-xs font-medium text-gray-500">VAS End:</label>
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
                          : 'text-gray-600 hover:bg-gray-100'
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
      <Suspense fallback={null}>
        {/* Outcome Assessment Modal */}
        {showOutcomeAssessment && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold">{outcomeType} Assessment</h3>
                <button
                  onClick={() => setShowOutcomeAssessment(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="overflow-y-auto max-h-[70vh] p-6">
                <OutcomeAssessment
                  type={outcomeType}
                  responses={encounterData.outcome_assessment?.responses || {}}
                  onChange={(responses) => {
                    const answered = Object.keys(responses).length;
                    const total = Object.values(responses).reduce((sum, val) => sum + val, 0);
                    const percentage =
                      answered > 0 ? Math.round((total / (answered * 5)) * 100) : null;
                    setEncounterData((prev) => ({
                      ...prev,
                      outcome_assessment: { type: outcomeType, responses, score: percentage },
                    }));
                  }}
                />
              </div>
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => setShowOutcomeAssessment(false)}
                  className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Template Picker */}
        <Suspense fallback={null}>
          <TemplatePicker
            isOpen={showTemplatePicker}
            onClose={() => setShowTemplatePicker(false)}
            onSelectTemplate={(text) => {
              if (activeTab === 'subjective') {
                updateField(
                  'subjective',
                  'history',
                  `${encounterData.subjective.history}\n${text}`
                );
              } else if (activeTab === 'objective') {
                updateField(
                  'objective',
                  'observation',
                  `${encounterData.objective.observation}\n${text}`
                );
              } else if (activeTab === 'assessment') {
                updateField(
                  'assessment',
                  'clinical_reasoning',
                  `${encounterData.assessment.clinical_reasoning}\n${text}`
                );
              } else if (activeTab === 'plan') {
                updateField('plan', 'treatment', `${encounterData.plan.treatment}\n${text}`);
              }
            }}
            soapSection={activeTab}
          />
        </Suspense>

        {/* Body Chart Modal */}
        {showBodyChart && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold">Body Chart - Annotate Pain Locations</h3>
                <button
                  onClick={() => setShowBodyChart(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="overflow-y-auto max-h-[70vh]">
                <BodyChart
                  initialView="front"
                  initialAnnotations={encounterData.body_chart?.annotations || []}
                  initialMarkers={encounterData.body_chart?.markers || []}
                  onSave={({ annotations, markers }) => {
                    setEncounterData((prev) => ({
                      ...prev,
                      body_chart: { annotations, markers },
                    }));
                    setShowBodyChart(false);
                  }}
                  showToolbar={true}
                  height={450}
                />
              </div>
            </div>
          </div>
        )}

        {/* Template Library Modal */}
        {showTemplateLibrary && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold">Chart Template Library</h3>
                <button
                  onClick={() => setShowTemplateLibrary(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="overflow-y-auto max-h-[75vh]">
                <TemplateLibrary
                  embedded={true}
                  showHeader={false}
                  onSelectTemplate={(template) => {
                    if (activeTab === 'subjective') {
                      if (template.content?.subjective) {
                        updateField(
                          'subjective',
                          'chief_complaint',
                          (encounterData.subjective.chief_complaint
                            ? `${encounterData.subjective.chief_complaint}\n`
                            : '') + template.content.subjective
                        );
                      }
                      if (template.content?.history) {
                        updateField(
                          'subjective',
                          'history',
                          (encounterData.subjective.history
                            ? `${encounterData.subjective.history}\n`
                            : '') + template.content.history
                        );
                      }
                    } else if (activeTab === 'objective') {
                      if (template.content?.objective) {
                        updateField(
                          'objective',
                          'observation',
                          (encounterData.objective.observation
                            ? `${encounterData.objective.observation}\n`
                            : '') + template.content.objective
                        );
                      }
                    } else if (activeTab === 'assessment') {
                      if (template.content?.assessment) {
                        updateField(
                          'assessment',
                          'clinical_reasoning',
                          (encounterData.assessment.clinical_reasoning
                            ? `${encounterData.assessment.clinical_reasoning}\n`
                            : '') + template.content.assessment
                        );
                      }
                    } else if (activeTab === 'plan') {
                      if (template.content?.plan) {
                        updateField(
                          'plan',
                          'treatment',
                          (encounterData.plan.treatment
                            ? `${encounterData.plan.treatment}\n`
                            : '') + template.content.plan
                        );
                      }
                    }
                    setShowTemplateLibrary(false);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Macro Matrix Modal */}
        {showMacroMatrix && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold">
                  {language === 'en'
                    ? 'Macro Matrix - Quick Insert'
                    : 'Makromatrise - Hurtiginnsetting'}
                </h3>
                <button
                  onClick={() => setShowMacroMatrix(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="overflow-y-auto max-h-[75vh] p-4">
                <MacroMatrix
                  onInsert={handleMacroInsert}
                  targetField={activeTab}
                  favorites={macroFavorites}
                  onFavoritesChange={setMacroFavorites}
                />
              </div>
            </div>
          </div>
        )}

        {/* Compliance Panel Modal */}
        {showCompliancePanel && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  {language === 'en' ? 'Compliance Check' : 'Samsvarskontroll'}
                </h3>
                <button
                  onClick={() => setShowCompliancePanel(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="overflow-y-auto max-h-[75vh]">
                <CompliancePanel
                  encounterData={encounterData}
                  onApplyAutoInsert={handleComplianceAutoFix}
                />
              </div>
            </div>
          </div>
        )}

        {/* Print Preview Modal */}
        <PrintPreview
          encounterData={encounterData}
          patientData={patient?.data}
          practiceInfo={{
            name: 'ChiroClick Clinic',
            address: 'Healthcare Center, Medical District',
            phone: '+47 400 00 000',
            provider: language === 'en' ? 'Provider Name, DC' : 'Behandler, DC',
            credentials: language === 'en' ? 'Doctor of Chiropractic' : 'Kiropraktor',
          }}
          isOpen={showPrintPreview}
          onClose={() => setShowPrintPreview(false)}
        />

        {/* Slash Command Reference Modal */}
        {showSlashReference && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Command className="w-5 h-5" />
                  {language === 'en' ? 'Slash Commands' : 'Skr\u00E5strek-kommandoer'}
                </h3>
                <button
                  onClick={() => setShowSlashReference(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="overflow-y-auto max-h-[70vh]">
                <SlashCommandReference />
              </div>
            </div>
          </div>
        )}

        {/* AI Scribe Modal */}
        {showAIScribe && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Mic className="w-5 h-5 text-blue-500" />
                  {language === 'en' ? 'AI Voice Scribe' : 'AI Stemmeskriver'}
                </h3>
                <button
                  onClick={() => setShowAIScribe(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="overflow-y-auto max-h-[75vh]">
                <AIScribe
                  language={language}
                  onApplySOAP={(sections) => {
                    if (sections.subjective) {
                      updateField(
                        'subjective',
                        'chief_complaint',
                        (encounterData.subjective.chief_complaint
                          ? `${encounterData.subjective.chief_complaint}\n`
                          : '') + sections.subjective
                      );
                    }
                    if (sections.objective) {
                      updateField(
                        'objective',
                        'observation',
                        (encounterData.objective.observation
                          ? `${encounterData.objective.observation}\n`
                          : '') + sections.objective
                      );
                    }
                    if (sections.assessment) {
                      updateField(
                        'assessment',
                        'clinical_reasoning',
                        (encounterData.assessment.clinical_reasoning
                          ? `${encounterData.assessment.clinical_reasoning}\n`
                          : '') + sections.assessment
                      );
                    }
                    if (sections.plan) {
                      updateField(
                        'plan',
                        'treatment',
                        (encounterData.plan.treatment ? `${encounterData.plan.treatment}\n` : '') +
                          sections.plan
                      );
                    }
                    setShowAIScribe(false);
                  }}
                  onApplyTranscript={(transcript) => {
                    if (activeTab === 'subjective') {
                      updateField(
                        'subjective',
                        'chief_complaint',
                        (encounterData.subjective.chief_complaint
                          ? `${encounterData.subjective.chief_complaint}\n`
                          : '') + transcript
                      );
                    } else if (activeTab === 'objective') {
                      updateField(
                        'objective',
                        'observation',
                        (encounterData.objective.observation
                          ? `${encounterData.objective.observation}\n`
                          : '') + transcript
                      );
                    } else if (activeTab === 'assessment') {
                      updateField(
                        'assessment',
                        'clinical_reasoning',
                        (encounterData.assessment.clinical_reasoning
                          ? `${encounterData.assessment.clinical_reasoning}\n`
                          : '') + transcript
                      );
                    } else if (activeTab === 'plan') {
                      updateField(
                        'plan',
                        'treatment',
                        (encounterData.plan.treatment ? `${encounterData.plan.treatment}\n` : '') +
                          transcript
                      );
                    }
                    setShowAIScribe(false);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* AI Settings Modal */}
        {showAISettings && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="max-w-2xl w-full">
              <AISettings language={language} onClose={() => setShowAISettings(false)} />
            </div>
          </div>
        )}
      </Suspense>

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
