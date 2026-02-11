import React from 'react';
import {
  AlertTriangle,
  Activity,
  Phone,
  Mail,
  Sparkles,
  ArrowLeft,
  BookOpen,
  Loader2,
} from 'lucide-react';

/**
 * Patient context sidebar shown on the left side of the Clinical Encounter page.
 * Displays patient demographics, red flags, contraindications, warnings,
 * medical history, AI suggestion preview, and template picker button.
 */
export function PatientInfoSidebar({
  patientData,
  patientLoading,
  patientInitials,
  patientAge,
  patientRedFlags,
  patientContraindications,
  redFlagAlerts,
  clinicalWarnings,
  aiSuggestions,
  onNavigateBack,
  onOpenAIAssistant,
  onOpenTemplatePicker,
}) {
  return (
    <aside className="w-80 bg-white border-r border-slate-200 flex flex-col h-full shadow-sm z-10">
      {/* Back Button & Patient Header */}
      <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
        <button
          onClick={onNavigateBack}
          className="flex items-center text-sm text-slate-500 hover:text-slate-700 mb-3"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Tilbake til pasient
        </button>

        {patientLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
          </div>
        ) : (
          <>
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white font-semibold text-lg shadow-sm">
                {patientInitials}
              </div>
              <div>
                <h2 className="font-semibold text-lg text-slate-800">
                  {patientData?.first_name} {patientData?.last_name}
                </h2>
                <p className="text-sm text-slate-500">
                  {patientAge ? `${patientAge} ar` : ''}
                  {patientData?.national_id &&
                    ` \u2022 Fnr: ${patientData.national_id.substring(0, 6)}-*****`}
                </p>
              </div>
            </div>

            {/* Quick Contact */}
            <div className="flex gap-2 mt-3">
              <button className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 px-2 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                <Phone className="h-3 w-3" />
                Ring
              </button>
              <button className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 px-2 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                <Mail className="h-3 w-3" />
                SMS
              </button>
            </div>
          </>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* RED FLAG ALERTS */}
        {(redFlagAlerts.length > 0 || patientRedFlags.length > 0) && (
          <div className="rounded-lg bg-rose-50 border border-rose-200 p-3">
            <div className="flex items-center gap-2 text-rose-700 font-semibold text-sm mb-2">
              <AlertTriangle className="h-4 w-4" />
              Kliniske Varsler
            </div>
            <ul className="space-y-1">
              {patientRedFlags.map((flag, idx) => (
                <li key={`patient-${idx}`} className="text-sm text-rose-600 flex items-start gap-2">
                  <span className="text-rose-400 mt-1">{'\u2022'}</span>
                  {flag}
                </li>
              ))}
              {redFlagAlerts.map((alert, idx) => (
                <li key={`alert-${idx}`} className="text-sm text-rose-600 flex items-start gap-2">
                  <span className="text-rose-400 mt-1">{'\u2022'}</span>
                  {alert}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* CONTRAINDICATIONS */}
        {patientContraindications.length > 0 && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
            <div className="flex items-center gap-2 text-amber-700 font-semibold text-sm mb-2">
              <AlertTriangle className="h-4 w-4" />
              Kontraindikasjoner
            </div>
            <ul className="space-y-1">
              {patientContraindications.map((item, idx) => (
                <li key={idx} className="text-sm text-amber-600 flex items-start gap-2">
                  <span className="text-amber-400 mt-1">{'\u2022'}</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* CLINICAL WARNINGS */}
        {clinicalWarnings.length > 0 && (
          <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3">
            <div className="flex items-center gap-2 text-yellow-700 font-semibold text-sm mb-2">
              <AlertTriangle className="h-4 w-4" />
              Kliniske Advarsler
            </div>
            <ul className="space-y-1">
              {clinicalWarnings.map((warning, idx) => (
                <li key={idx} className="text-sm text-yellow-600 flex items-start gap-2">
                  <span className="text-yellow-400 mt-1">{'\u2022'}</span>
                  {warning}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* PATIENT MEDICAL HISTORY */}
        {patientData?.medical_history && (
          <div className="rounded-lg bg-white border border-slate-200 shadow-sm">
            <div className="px-3 py-2 border-b border-slate-100 bg-slate-50 rounded-t-lg">
              <h3 className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Activity className="h-4 w-4 text-teal-600" />
                Sykehistorie
              </h3>
            </div>
            <div className="p-3">
              <p className="text-sm text-slate-600 leading-relaxed">
                {patientData.medical_history}
              </p>
            </div>
          </div>
        )}

        {/* AI SUGGESTIONS PREVIEW */}
        <div className="rounded-lg bg-purple-50 border border-purple-200 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-purple-700 font-semibold text-sm">
              <Sparkles className="h-4 w-4" />
              AI-forslag
            </div>
            <button
              onClick={onOpenAIAssistant}
              className="text-xs text-purple-600 hover:text-purple-800"
            >
              {'\u00C5'}pne {'\u2192'}
            </button>
          </div>
          <p className="text-sm text-purple-600">
            {aiSuggestions?.clinicalReasoning ||
              'Klikk "\u00C5pne" for AI-assistert analyse basert p\u00E5 SOAP-notater.'}
          </p>
        </div>

        {/* TEMPLATE PICKER BUTTON */}
        <button
          onClick={onOpenTemplatePicker}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 transition-colors text-sm font-medium"
        >
          <BookOpen className="h-4 w-4" />
          Kliniske Maler
        </button>
      </div>
    </aside>
  );
}
