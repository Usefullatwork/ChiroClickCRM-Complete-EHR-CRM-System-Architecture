/**
 * IntakeParser Component
 *
 * Converts patient intake form data into professional Subjective narratives
 * using local Ollama AI. Inspired by ChiroTouch Rheo's "Intake-to-Note" feature.
 *
 * Features:
 * - One-click conversion of intake data to narrative
 * - Fallback generation when AI is unavailable
 * - Bilingual support (EN/NO)
 * - Preview and edit before applying
 */

import { useState, useEffect } from 'react';
import {
  Sparkles,
  RefreshCw,
  Check,
  AlertCircle,
  Wifi,
  WifiOff,
  ChevronDown,
  ChevronUp,
  Edit3,
  Copy,
  Zap,
} from 'lucide-react';
import { checkOllamaStatus, parseIntakeToSubjective, getAIConfig } from '../../services/aiService';

// =============================================================================
// INTAKE PARSER BUTTON - Compact trigger button
// =============================================================================

export function IntakeParserButton({
  intakeData,
  onGenerate,
  language = 'en',
  disabled = false,
  className = '',
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState({ connected: false });

  useEffect(() => {
    checkOllamaStatus().then(setAiStatus);
  }, []);

  const handleGenerate = async () => {
    if (!intakeData || isLoading) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await parseIntakeToSubjective(intakeData, language);
      if (result.success) {
        onGenerate?.(result.narrative, 'ai');
      } else if (result.fallback) {
        onGenerate?.(result.fallback, 'fallback');
      }
    } catch (error) {
      console.error('Intake parsing error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const labels = {
    en: {
      generate: 'AI Generate',
      generating: 'Generating...',
      offline: 'AI Offline',
    },
    no: {
      generate: 'AI Generer',
      generating: 'Genererer...',
      offline: 'AI Frakoblet',
    },
  };

  const t = labels[language] || labels.en;

  return (
    <button
      onClick={handleGenerate}
      disabled={disabled || isLoading || !intakeData}
      className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors
        ${
          aiStatus.connected
            ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600'
            : 'bg-gray-100 text-gray-500'
        }
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}`}
      title={aiStatus.connected ? '' : 'Ollama not connected'}
    >
      {isLoading ? (
        <RefreshCw className="w-4 h-4 animate-spin" />
      ) : aiStatus.connected ? (
        <Sparkles className="w-4 h-4" />
      ) : (
        <WifiOff className="w-4 h-4" />
      )}
      {isLoading ? t.generating : aiStatus.connected ? t.generate : t.offline}
    </button>
  );
}

// =============================================================================
// INTAKE PARSER PANEL - Full panel with preview
// =============================================================================

export default function IntakeParser({
  intakeData,
  onApply,
  onCancel,
  language = 'en',
  className = '',
}) {
  const [narrative, setNarrative] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [aiStatus, setAiStatus] = useState({ connected: false, models: [] });
  const [source, setSource] = useState(null); // 'ai' | 'fallback' | 'edited'
  const [isEditing, setIsEditing] = useState(false);
  const [showIntakeData, setShowIntakeData] = useState(false);

  useEffect(() => {
    checkOllamaStatus().then(setAiStatus);
  }, []);

  const handleGenerate = async () => {
    if (!intakeData) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await parseIntakeToSubjective(intakeData, language);

      if (result.success) {
        setNarrative(result.narrative);
        setSource('ai');
      } else if (result.fallback) {
        setNarrative(result.fallback);
        setSource('fallback');
        setError(result.error);
      } else {
        setError(result.error || 'Failed to generate narrative');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (narrative) {
      onApply?.(narrative, source);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(narrative);
  };

  const labels = {
    en: {
      title: 'AI Intake Parser',
      subtitle: 'Convert intake form to Subjective narrative',
      status: 'AI Status',
      connected: 'Connected',
      disconnected: 'Disconnected',
      model: 'Model',
      generate: 'Generate Narrative',
      regenerate: 'Regenerate',
      generating: 'Generating...',
      preview: 'Preview',
      edit: 'Edit',
      apply: 'Apply to Note',
      cancel: 'Cancel',
      copy: 'Copy',
      sourceAI: 'Generated by AI',
      sourceFallback: 'Template-based (AI offline)',
      sourceEdited: 'Manually edited',
      noData: 'No intake data available',
      viewIntake: 'View Intake Data',
      hideIntake: 'Hide Intake Data',
      ollama: 'Ollama',
      setupRequired: 'Setup Required',
      setupInstructions: 'Run Ollama locally to enable AI features',
    },
    no: {
      title: 'AI Opptaksparser',
      subtitle: 'Konverter opptaksskjema til Subjektiv narrativ',
      status: 'AI-status',
      connected: 'Tilkoblet',
      disconnected: 'Frakoblet',
      model: 'Modell',
      generate: 'Generer Narrativ',
      regenerate: 'Regenerer',
      generating: 'Genererer...',
      preview: 'Forhåndsvisning',
      edit: 'Rediger',
      apply: 'Bruk i Notat',
      cancel: 'Avbryt',
      copy: 'Kopier',
      sourceAI: 'Generert av AI',
      sourceFallback: 'Malbasert (AI frakoblet)',
      sourceEdited: 'Manuelt redigert',
      noData: 'Ingen opptaksdata tilgjengelig',
      viewIntake: 'Vis Opptaksdata',
      hideIntake: 'Skjul Opptaksdata',
      ollama: 'Ollama',
      setupRequired: 'Oppsett Kreves',
      setupInstructions: 'Kjør Ollama lokalt for å aktivere AI-funksjoner',
    },
  };

  const t = labels[language] || labels.en;
  const config = getAIConfig();

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{t.title}</h3>
              <p className="text-sm text-gray-500">{t.subtitle}</p>
            </div>
          </div>

          {/* AI Status Badge */}
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
              ${aiStatus.connected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
            >
              {aiStatus.connected ? (
                <Wifi className="w-3.5 h-3.5" />
              ) : (
                <WifiOff className="w-3.5 h-3.5" />
              )}
              {aiStatus.connected ? t.connected : t.disconnected}
            </div>
          </div>
        </div>

        {/* Model info */}
        {aiStatus.connected && (
          <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" />
              {t.model}: <span className="font-medium text-gray-700">{config.model}</span>
            </span>
            <span>{aiStatus.models?.length || 0} models available</span>
          </div>
        )}

        {/* Setup instructions when offline */}
        {!aiStatus.connected && (
          <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
            <p className="text-xs text-amber-800">
              <strong>{t.setupRequired}:</strong> {t.setupInstructions}
            </p>
            <code className="block mt-1 text-xs text-amber-700 font-mono">
              ollama serve && ollama pull llama3.2
            </code>
          </div>
        )}
      </div>

      {/* Intake Data Toggle */}
      {intakeData && (
        <div className="border-b border-gray-100">
          <button
            onClick={() => setShowIntakeData(!showIntakeData)}
            className="w-full px-6 py-3 flex items-center justify-between text-sm text-gray-600 hover:bg-gray-50"
          >
            <span>{showIntakeData ? t.hideIntake : t.viewIntake}</span>
            {showIntakeData ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {showIntakeData && (
            <div className="px-6 pb-4">
              <div className="bg-gray-50 rounded-lg p-4 text-sm">
                <IntakeDataDisplay data={intakeData} language={language} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {!intakeData ? (
          <div className="text-center py-8 text-gray-500">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>{t.noData}</p>
          </div>
        ) : (
          <>
            {/* Generate Button */}
            {!narrative && (
              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="w-full py-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg font-medium
                  hover:from-purple-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    {t.generating}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    {t.generate}
                  </>
                )}
              </button>
            )}

            {/* Error Display */}
            {error && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                <AlertCircle className="w-4 h-4 inline mr-2" />
                {error}
              </div>
            )}

            {/* Narrative Preview/Edit */}
            {narrative && (
              <div className="space-y-4">
                {/* Source Badge */}
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                    ${
                      source === 'ai'
                        ? 'bg-purple-100 text-purple-700'
                        : source === 'fallback'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {source === 'ai' ? (
                      <Sparkles className="w-3 h-3" />
                    ) : source === 'fallback' ? (
                      <AlertCircle className="w-3 h-3" />
                    ) : (
                      <Edit3 className="w-3 h-3" />
                    )}
                    {source === 'ai'
                      ? t.sourceAI
                      : source === 'fallback'
                        ? t.sourceFallback
                        : t.sourceEdited}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
                      title={t.edit}
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleCopy}
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
                      title={t.copy}
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleGenerate}
                      disabled={isLoading}
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
                      title={t.regenerate}
                    >
                      <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Narrative Text */}
                {isEditing ? (
                  <textarea
                    value={narrative}
                    onChange={(e) => {
                      setNarrative(e.target.value);
                      setSource('edited');
                    }}
                    className="w-full h-48 p-4 border border-gray-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                ) : (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {narrative}
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer Actions */}
      {narrative && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3">
          {onCancel && (
            <button onClick={onCancel} className="px-4 py-2 text-gray-600 hover:text-gray-800">
              {t.cancel}
            </button>
          )}
          <button
            onClick={handleApply}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            {t.apply}
          </button>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// INTAKE DATA DISPLAY - Formatted view of intake data
// =============================================================================

function IntakeDataDisplay({ data, language = 'en' }) {
  const labels = {
    en: {
      chiefComplaint: 'Chief Complaint',
      painLevel: 'Pain Level',
      onset: 'Onset',
      duration: 'Duration',
      painQuality: 'Pain Quality',
      aggravatingFactors: 'Aggravating Factors',
      relievingFactors: 'Relieving Factors',
      location: 'Location',
      radiation: 'Radiation',
      previousTreatment: 'Previous Treatment',
      medicalHistory: 'Medical History',
      medications: 'Medications',
      goals: 'Goals',
    },
    no: {
      chiefComplaint: 'Hovedklage',
      painLevel: 'Smertenivå',
      onset: 'Debut',
      duration: 'Varighet',
      painQuality: 'Smertekvalitet',
      aggravatingFactors: 'Forverrende',
      relievingFactors: 'Lindrende',
      location: 'Lokalisering',
      radiation: 'Utstråling',
      previousTreatment: 'Tidligere behandling',
      medicalHistory: 'Sykehistorie',
      medications: 'Medisiner',
      goals: 'Mål',
    },
  };

  const t = labels[language] || labels.en;

  const renderField = (key, value) => {
    if (!value || (Array.isArray(value) && value.length === 0)) {
      return null;
    }

    return (
      <div key={key} className="flex gap-2">
        <span className="text-gray-500 font-medium min-w-[120px]">{t[key] || key}:</span>
        <span className="text-gray-700">{Array.isArray(value) ? value.join(', ') : value}</span>
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {renderField('chiefComplaint', data.chiefComplaint)}
      {renderField('painLevel', data.painLevel ? `${data.painLevel}/10` : null)}
      {renderField('location', data.location)}
      {renderField('onset', data.onset)}
      {renderField('duration', data.duration)}
      {renderField('painQuality', data.painQuality)}
      {renderField('aggravatingFactors', data.aggravatingFactors)}
      {renderField('relievingFactors', data.relievingFactors)}
      {renderField('radiation', data.radiation)}
      {renderField('previousTreatment', data.previousTreatment)}
      {renderField('medicalHistory', data.medicalHistory)}
      {renderField('medications', data.medications)}
      {renderField('goals', data.goals)}
    </div>
  );
}

// =============================================================================
// INLINE INTAKE PARSER - Compact inline version
// =============================================================================

export function IntakeParserInline({
  intakeData,
  currentValue,
  onUpdate,
  language = 'en',
  className = '',
}) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!intakeData || isGenerating) {
      return;
    }

    setIsGenerating(true);
    try {
      const result = await parseIntakeToSubjective(intakeData, language);
      const text = result.success ? result.narrative : result.fallback;

      if (text) {
        // Append to current value or replace
        const newValue = currentValue ? `${currentValue}\n\n${text}` : text;
        onUpdate?.(newValue);
      }
    } catch (error) {
      console.error('Generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const labels = {
    en: { generate: 'Generate from Intake' },
    no: { generate: 'Generer fra Opptak' },
  };

  return (
    <button
      onClick={handleGenerate}
      disabled={!intakeData || isGenerating}
      className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-purple-600
        bg-purple-50 rounded hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed
        ${className}`}
    >
      {isGenerating ? (
        <RefreshCw className="w-3 h-3 animate-spin" />
      ) : (
        <Sparkles className="w-3 h-3" />
      )}
      {labels[language]?.generate || labels.en.generate}
    </button>
  );
}
