import { Save, Globe, ChevronLeft, Printer, Copy, Grid, Mic, Cpu } from 'lucide-react';
import { VisitCounter } from '../assessment/TreatmentPlanTracker';
import SALTButton from '../assessment/SALTButton';
import { ComplianceIndicator } from '../assessment/ComplianceEngine';
import { AIStatusIndicator } from '../assessment/AISettings';
import { useTranslation } from '../../i18n';

export default function EasyAssessmentHeader({
  patient,
  treatmentPlan,
  currentVisitNumber,
  patientId,
  navigate,
  language,
  setLanguage,
  previousEncounter,
  handleSALTApply,
  setShowAISettings,
  setShowAIScribe,
  setShowCompliancePanel,
  setShowMacroMatrix,
  viewMode,
  setViewMode,
  setShowPrintPreview,
  copyToClipboard,
  copiedToClipboard,
  handleSave,
  saveMutation,
  encounterData,
}) {
  const { t } = useTranslation();
  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-full mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/patients/${patientId}`)}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-lg font-bold text-gray-900">
                  {patient?.data?.first_name} {patient?.data?.last_name}
                </h1>
                {patient?.data?.date_of_birth && (
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {Math.floor((new Date() - new Date(patient.data.date_of_birth)) / 31557600000)}{' '}
                    {t('yrsOld')}
                  </span>
                )}
                <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded">
                  {t('active')}
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
              className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 rounded-lg hover:bg-gray-200"
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
                className="p-1.5 text-gray-400 dark:text-gray-300 hover:text-gray-600 rounded-lg hover:bg-gray-100"
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
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100'
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
              {saveMutation.isLoading ? t('saving') : t('save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
