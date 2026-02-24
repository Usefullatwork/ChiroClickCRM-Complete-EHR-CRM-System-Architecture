/**
 * AI Settings Component
 * Model selection, feature toggles, and connection testing for the AI system.
 * Persists settings via clinicalSettingsAPI and tests connection via aiAPI.
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiAPI, clinicalSettingsAPI } from '../services/api';

const AI_MODELS = [
  {
    id: 'chiro-fast',
    name: 'Chiro Fast',
    base: 'Qwen2.5-1.5B',
    purpose: 'Hurtig autofullføring',
    size: '~1GB',
  },
  {
    id: 'chiro-medical',
    name: 'Chiro Medical',
    base: 'Qwen2.5-3B',
    purpose: 'Klinisk resonnement',
    size: '~2GB',
  },
  {
    id: 'chiro-norwegian',
    name: 'Chiro Norwegian',
    base: 'Qwen2.5-7B',
    purpose: 'Norsk språk',
    size: '~4GB',
  },
  {
    id: 'chiro-no',
    name: 'Chiro Default',
    base: 'Qwen2.5-7B',
    purpose: 'Generell bruk',
    size: '~4GB',
  },
];

const DEFAULT_FEATURES = {
  spellCheck: true,
  soapSuggestions: true,
  diagnosisSuggestion: true,
  redFlagAnalysis: true,
  autoComplete: true,
  narrativeGeneration: true,
};

const AISettings = () => {
  const queryClient = useQueryClient();
  const [selectedModel, setSelectedModel] = useState('chiro-no');
  const [features, setFeatures] = useState(DEFAULT_FEATURES);
  const [testResult, setTestResult] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ['clinical-settings'],
    queryFn: () => clinicalSettingsAPI.getAll(),
    retry: false,
  });

  // Load saved AI settings when data arrives
  useEffect(() => {
    const ai = settingsData?.data?.ai || settingsData?.data?.settings?.ai;
    if (ai) {
      if (ai.model) setSelectedModel(ai.model);
      if (ai.features) setFeatures((prev) => ({ ...prev, ...ai.features }));
    }
  }, [settingsData]);

  const { data: aiStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['ai-status'],
    queryFn: () => aiAPI.getStatus(),
    retry: false,
  });

  const testMutation = useMutation({
    mutationFn: () => aiAPI.getStatus(),
    onSuccess: (response) => {
      setTestResult({ success: true, message: 'Tilkobling vellykket', data: response.data });
    },
    onError: (error) => {
      setTestResult({ success: false, message: error.message || 'Tilkobling feilet' });
    },
  });

  const saveMutation = useMutation({
    mutationFn: (settings) => clinicalSettingsAPI.update({ ai: settings }),
    onSuccess: () => {
      setHasUnsavedChanges(false);
      queryClient.invalidateQueries({ queryKey: ['clinical-settings'] });
    },
  });

  const toggleFeature = (feature) => {
    setFeatures((prev) => ({ ...prev, [feature]: !prev[feature] }));
    setHasUnsavedChanges(true);
  };

  const handleModelChange = (modelId) => {
    setSelectedModel(modelId);
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    saveMutation.mutate({ model: selectedModel, features });
  };

  const status = aiStatus?.data;
  const isConnected = status?.status === 'healthy' || status?.status === 'ok';

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="p-4 border rounded-lg bg-white shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-slate-800">AI-tilkobling</h3>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
              statusLoading
                ? 'bg-gray-100 text-gray-600'
                : isConnected
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                statusLoading ? 'bg-gray-400' : isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            {statusLoading ? 'Sjekker...' : isConnected ? 'Tilkoblet' : 'Frakoblet'}
          </span>
        </div>

        {status && (
          <div className="grid grid-cols-2 gap-2 text-sm text-slate-600 mb-3">
            <div>
              Ollama-versjon: <span className="font-medium">{status.ollamaVersion || '-'}</span>
            </div>
            <div>
              Aktiv modell:{' '}
              <span className="font-medium">{status.activeModel || selectedModel}</span>
            </div>
            <div>
              Modeller lastet: <span className="font-medium">{status.modelsLoaded || '-'}</span>
            </div>
            <div>
              GPU: <span className="font-medium">{status.gpuAvailable ? 'Ja' : 'Nei'}</span>
            </div>
          </div>
        )}

        <button
          onClick={() => testMutation.mutate()}
          disabled={testMutation.isPending}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 transition-colors"
        >
          {testMutation.isPending ? 'Tester...' : 'Test tilkobling'}
        </button>

        {testResult && (
          <div
            className={`mt-3 p-2 rounded text-sm ${
              testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}
          >
            {testResult.message}
          </div>
        )}
      </div>

      {/* Model Selection */}
      <div className="p-4 border rounded-lg bg-white shadow-sm">
        <h3 className="text-lg font-medium text-slate-800 mb-3">Modellvalg</h3>
        {settingsLoading ? (
          <div className="animate-pulse space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-slate-100 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {AI_MODELS.map((model) => (
              <label
                key={model.id}
                className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedModel === model.id
                    ? 'border-teal-500 bg-teal-50'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="aiModel"
                  value={model.id}
                  checked={selectedModel === model.id}
                  onChange={() => handleModelChange(model.id)}
                  className="mr-3 text-teal-600 focus:ring-teal-500"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-800">{model.name}</span>
                    <span className="text-xs text-slate-400">{model.size}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {model.base} - {model.purpose}
                  </p>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Feature Toggles */}
      <div className="p-4 border rounded-lg bg-white shadow-sm">
        <h3 className="text-lg font-medium text-slate-800 mb-3">AI-funksjoner</h3>
        <div className="space-y-3">
          {[
            { key: 'spellCheck', label: 'Stavekontroll', desc: 'Automatisk norsk stavekontroll' },
            {
              key: 'soapSuggestions',
              label: 'SOAP-forslag',
              desc: 'Foreslå tekst for SOAP-seksjoner',
            },
            {
              key: 'diagnosisSuggestion',
              label: 'Diagnoseanbefalinger',
              desc: 'Foreslå ICPC/ICD-10 koder',
            },
            {
              key: 'redFlagAnalysis',
              label: 'Røde flagg-analyse',
              desc: 'Automatisk klinisk risikovurdering',
            },
            {
              key: 'autoComplete',
              label: 'Autofullføring',
              desc: 'Fullfør setninger mens du skriver',
            },
            {
              key: 'narrativeGeneration',
              label: 'Narrativ-generering',
              desc: 'Generer klinisk narrativ fra data',
            },
          ].map((feature) => (
            <div key={feature.key} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700">{feature.label}</p>
                <p className="text-xs text-slate-500">{feature.desc}</p>
              </div>
              <button
                onClick={() => toggleFeature(feature.key)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  features[feature.key] ? 'bg-teal-600' : 'bg-slate-300'
                }`}
                role="switch"
                aria-checked={features[feature.key]}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    features[feature.key] ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      {hasUnsavedChanges && (
        <div className="sticky bottom-4 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="px-6 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium shadow-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
          >
            {saveMutation.isPending ? 'Lagrer...' : 'Lagre innstillinger'}
          </button>
          {saveMutation.isError && (
            <span className="ml-3 text-sm text-red-600 self-center">
              Kunne ikke lagre: {saveMutation.error?.message}
            </span>
          )}
          {saveMutation.isSuccess && (
            <span className="ml-3 text-sm text-green-600 self-center">Lagret!</span>
          )}
        </div>
      )}
    </div>
  );
};

export default AISettings;
