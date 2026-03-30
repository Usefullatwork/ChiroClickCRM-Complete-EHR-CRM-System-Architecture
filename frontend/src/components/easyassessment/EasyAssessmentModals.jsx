import { lazy, Suspense } from 'react';
import { X, Shield, Command, Mic } from 'lucide-react';
import CompliancePanel from '../assessment/ComplianceEngine';

const OutcomeAssessment = lazy(() => import('../assessment/OutcomeAssessment'));
const TemplatePicker = lazy(() => import('../TemplatePicker'));
const MacroMatrix = lazy(() => import('../assessment/MacroMatrix'));
const BodyChart = lazy(() => import('../assessment/BodyChart'));
const TemplateLibrary = lazy(() => import('../assessment/TemplateLibrary'));
const PrintPreview = lazy(() => import('../assessment/PrintPreview'));
const AIScribe = lazy(() => import('../assessment/AIScribe'));
const AISettings = lazy(() => import('../assessment/AISettings'));
const SlashCommandReference = lazy(() =>
  import('../assessment/SlashCommands').then((m) => ({
    default: m.SlashCommandReference,
  }))
);

export function EasyAssessmentModals({
  // Modal visibility
  showOutcomeAssessment,
  setShowOutcomeAssessment,
  showTemplatePicker,
  setShowTemplatePicker,
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
  // Data & handlers
  outcomeType,
  encounterData,
  setEncounterData,
  activeTab,
  updateField,
  language,
  macroFavorites,
  setMacroFavorites,
  handleMacroInsert,
  handleComplianceAutoFix,
  patient,
}) {
  return (
    <Suspense fallback={null}>
      {/* Outcome Assessment Modal */}
      {showOutcomeAssessment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">{outcomeType} Assessment</h3>
              <button
                onClick={() => setShowOutcomeAssessment(false)}
                className="p-2 text-gray-400 dark:text-gray-300 hover:text-gray-600 rounded-lg"
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
              updateField('subjective', 'history', `${encounterData.subjective.history}\n${text}`);
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
                className="p-2 text-gray-400 dark:text-gray-300 hover:text-gray-600 rounded-lg"
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
                className="p-2 text-gray-400 dark:text-gray-300 hover:text-gray-600 rounded-lg"
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
                        (encounterData.plan.treatment ? `${encounterData.plan.treatment}\n` : '') +
                          template.content.plan
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
                className="p-2 text-gray-400 dark:text-gray-300 hover:text-gray-600 rounded-lg"
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
                className="p-2 text-gray-400 dark:text-gray-300 hover:text-gray-600 rounded-lg"
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
                className="p-2 text-gray-400 dark:text-gray-300 hover:text-gray-600 rounded-lg"
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
                className="p-2 text-gray-400 dark:text-gray-300 hover:text-gray-600 rounded-lg"
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
  );
}
