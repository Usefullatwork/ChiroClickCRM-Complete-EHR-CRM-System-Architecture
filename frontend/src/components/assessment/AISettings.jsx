/**
 * AISettings Component
 *
 * Configuration panel for local Ollama AI integration.
 * Allows users to configure connection settings, select models,
 * and test the AI connection.
 *
 * Features:
 * - Ollama connection configuration
 * - Model selection from available models
 * - Connection testing
 * - Temperature and token settings
 * - Bilingual support (EN/NO)
 */

import { useState, useEffect } from 'react';
import {
  Settings,
  Wifi,
  WifiOff,
  RefreshCw,
  Check,
  AlertCircle,
  Server,
  Cpu,
  Thermometer,
  Hash,
  Save,
  RotateCcw,
  ExternalLink,
  Terminal,
  Download,
  ChevronDown,
  ChevronUp,
  Zap,
  _HardDrive,
} from 'lucide-react';
import {
  getAIConfig,
  saveAIConfig,
  checkOllamaStatus,
  _listModels,
  generateText,
} from '../../services/aiService';

// =============================================================================
// AI SETTINGS PANEL
// =============================================================================

export default function AISettings({ language = 'en', onClose, className = '' }) {
  const [config, setConfig] = useState(getAIConfig());
  const [status, setStatus] = useState({ connected: false, models: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setIsLoading(true);
    const result = await checkOllamaStatus();
    setStatus(result);
    setIsLoading(false);
  };

  const handleConfigChange = (key, value) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    saveAIConfig(config);
    setHasChanges(false);
    checkConnection();
  };

  const handleReset = () => {
    const defaultConfig = {
      baseUrl: 'http://localhost:11434',
      model: 'llama3.2',
      whisperModel: 'base',
      timeout: 60000,
      temperature: 0.3,
      maxTokens: 2048,
    };
    setConfig(defaultConfig);
    setHasChanges(true);
  };

  const testConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const result = await generateText('Say "Hello, ChiroClick!" in one sentence.', {
        model: config.model,
        temperature: 0.5,
        maxTokens: 50,
      });

      setTestResult({
        success: true,
        response: result.text,
        duration: result.totalDuration ? `${(result.totalDuration / 1e9).toFixed(2)}s` : 'N/A',
      });
    } catch (error) {
      setTestResult({
        success: false,
        error: error.message,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const labels = {
    en: {
      title: 'AI Settings',
      subtitle: 'Configure local Ollama integration',
      status: 'Connection Status',
      connected: 'Connected',
      disconnected: 'Disconnected',
      checkConnection: 'Check Connection',
      checking: 'Checking...',
      serverUrl: 'Ollama Server URL',
      serverUrlHelp: 'Default: http://localhost:11434',
      model: 'AI Model',
      modelHelp: 'Select from available models',
      noModels: 'No models found. Pull a model first.',
      temperature: 'Temperature',
      temperatureHelp: 'Lower = more focused, Higher = more creative',
      maxTokens: 'Max Tokens',
      maxTokensHelp: 'Maximum response length',
      timeout: 'Timeout (ms)',
      timeoutHelp: 'Maximum wait time for responses',
      advanced: 'Advanced Settings',
      whisperModel: 'Whisper Model',
      whisperHelp: 'For voice transcription (tiny, base, small, medium)',
      save: 'Save Settings',
      reset: 'Reset to Defaults',
      testConnection: 'Test AI',
      testing: 'Testing...',
      testSuccess: 'AI responded successfully',
      testFailed: 'Test failed',
      responseTime: 'Response time',
      setupGuide: 'Setup Guide',
      step1: '1. Install Ollama',
      step1desc: 'Download from ollama.ai',
      step2: '2. Start Ollama',
      step2desc: 'Run: ollama serve',
      step3: '3. Pull a model',
      step3desc: 'Run: ollama pull llama3.2',
      availableModels: 'Available Models',
      recommendedModels: 'Recommended Models',
      modelSize: 'Size',
      modelPurpose: 'Best for',
    },
    no: {
      title: 'AI-innstillinger',
      subtitle: 'Konfigurer lokal Ollama-integrasjon',
      status: 'Tilkoblingsstatus',
      connected: 'Tilkoblet',
      disconnected: 'Frakoblet',
      checkConnection: 'Sjekk Tilkobling',
      checking: 'Sjekker...',
      serverUrl: 'Ollama Server URL',
      serverUrlHelp: 'Standard: http://localhost:11434',
      model: 'AI-modell',
      modelHelp: 'Velg fra tilgjengelige modeller',
      noModels: 'Ingen modeller funnet. Pull en modell først.',
      temperature: 'Temperatur',
      temperatureHelp: 'Lavere = mer fokusert, Høyere = mer kreativ',
      maxTokens: 'Maks Tokens',
      maxTokensHelp: 'Maksimal responslengde',
      timeout: 'Timeout (ms)',
      timeoutHelp: 'Maksimal ventetid for svar',
      advanced: 'Avanserte Innstillinger',
      whisperModel: 'Whisper-modell',
      whisperHelp: 'For stemmetranskribering (tiny, base, small, medium)',
      save: 'Lagre Innstillinger',
      reset: 'Tilbakestill',
      testConnection: 'Test AI',
      testing: 'Tester...',
      testSuccess: 'AI svarte vellykket',
      testFailed: 'Test mislyktes',
      responseTime: 'Responstid',
      setupGuide: 'Oppsettguide',
      step1: '1. Installer Ollama',
      step1desc: 'Last ned fra ollama.ai',
      step2: '2. Start Ollama',
      step2desc: 'Kjør: ollama serve',
      step3: '3. Pull en modell',
      step3desc: 'Kjør: ollama pull llama3.2',
      availableModels: 'Tilgjengelige Modeller',
      recommendedModels: 'Anbefalte Modeller',
      modelSize: 'Størrelse',
      modelPurpose: 'Best for',
    },
  };

  const t = labels[language] || labels.en;

  const recommendedModels = [
    {
      name: 'llama3.2',
      size: '2GB',
      purpose: language === 'no' ? 'Generell bruk, rask' : 'General use, fast',
    },
    {
      name: 'llama3.2:7b',
      size: '4GB',
      purpose: language === 'no' ? 'Bedre kvalitet' : 'Better quality',
    },
    { name: 'mistral', size: '4GB', purpose: language === 'no' ? 'God balanse' : 'Good balance' },
    {
      name: 'medllama2',
      size: '4GB',
      purpose: language === 'no' ? 'Medisinsk terminologi' : 'Medical terminology',
    },
    {
      name: 'codellama',
      size: '4GB',
      purpose: language === 'no' ? 'Teknisk innhold' : 'Technical content',
    },
  ];

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 max-w-2xl ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Settings className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{t.title}</h3>
              <p className="text-sm text-gray-500">{t.subtitle}</p>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
              <span className="sr-only">Close</span>×
            </button>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Connection Status */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${status.connected ? 'bg-green-100' : 'bg-red-100'}`}>
              {status.connected ? (
                <Wifi className="w-5 h-5 text-green-600" />
              ) : (
                <WifiOff className="w-5 h-5 text-red-500" />
              )}
            </div>
            <div>
              <p className="font-medium text-gray-900">{t.status}</p>
              <p className={`text-sm ${status.connected ? 'text-green-600' : 'text-red-500'}`}>
                {status.connected ? t.connected : t.disconnected}
                {status.connected && status.models?.length > 0 && (
                  <span className="text-gray-500 ml-2">
                    ({status.models.length} {language === 'no' ? 'modeller' : 'models'})
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={checkConnection}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? t.checking : t.checkConnection}
          </button>
        </div>

        {/* Setup Guide (when disconnected) */}
        {!status.connected && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
            <h4 className="font-medium text-blue-900 mb-3">{t.setupGuide}</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <Download className="w-4 h-4 text-blue-500 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-800">{t.step1}</p>
                  <p className="text-blue-600">{t.step1desc}</p>
                  <a
                    href="https://ollama.ai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-700 hover:underline mt-1"
                  >
                    ollama.ai <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Terminal className="w-4 h-4 text-blue-500 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-800">{t.step2}</p>
                  <code className="text-xs bg-blue-100 px-2 py-1 rounded">
                    {t.step2desc.split(': ')[1]}
                  </code>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Cpu className="w-4 h-4 text-blue-500 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-800">{t.step3}</p>
                  <code className="text-xs bg-blue-100 px-2 py-1 rounded">
                    {t.step3desc.split(': ')[1]}
                  </code>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Server URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Server className="w-4 h-4 inline mr-1" />
            {t.serverUrl}
          </label>
          <input
            type="text"
            value={config.baseUrl}
            onChange={(e) => handleConfigChange('baseUrl', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="http://localhost:11434"
          />
          <p className="mt-1 text-xs text-gray-500">{t.serverUrlHelp}</p>
        </div>

        {/* Model Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Cpu className="w-4 h-4 inline mr-1" />
            {t.model}
          </label>
          {status.models?.length > 0 ? (
            <select
              value={config.model}
              onChange={(e) => handleConfigChange('model', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {status.models.map((model) => (
                <option key={model.name} value={model.name}>
                  {model.name} ({(model.size / 1e9).toFixed(1)}GB)
                </option>
              ))}
            </select>
          ) : (
            <div>
              <input
                type="text"
                value={config.model}
                onChange={(e) => handleConfigChange('model', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="llama3.2"
              />
              {status.connected && <p className="mt-1 text-xs text-amber-600">{t.noModels}</p>}
            </div>
          )}
          <p className="mt-1 text-xs text-gray-500">{t.modelHelp}</p>

          {/* Recommended Models */}
          <div className="mt-3">
            <p className="text-xs font-medium text-gray-500 mb-2">{t.recommendedModels}:</p>
            <div className="flex flex-wrap gap-2">
              {recommendedModels.map((model) => (
                <button
                  key={model.name}
                  onClick={() => handleConfigChange('model', model.name)}
                  className={`px-2 py-1 text-xs rounded border transition-colors
                    ${
                      config.model === model.name
                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  title={`${model.size} - ${model.purpose}`}
                >
                  {model.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Temperature & Max Tokens (inline) */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Thermometer className="w-4 h-4 inline mr-1" />
              {t.temperature}
            </label>
            <input
              type="number"
              min="0"
              max="2"
              step="0.1"
              value={config.temperature}
              onChange={(e) => handleConfigChange('temperature', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">{t.temperatureHelp}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Hash className="w-4 h-4 inline mr-1" />
              {t.maxTokens}
            </label>
            <input
              type="number"
              min="100"
              max="8192"
              step="100"
              value={config.maxTokens}
              onChange={(e) => handleConfigChange('maxTokens', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">{t.maxTokensHelp}</p>
          </div>
        </div>

        {/* Advanced Settings Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
        >
          {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {t.advanced}
        </button>

        {showAdvanced && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.timeout}</label>
              <input
                type="number"
                min="10000"
                max="600000"
                step="5000"
                value={config.timeout}
                onChange={(e) => handleConfigChange('timeout', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">{t.timeoutHelp}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.whisperModel}
              </label>
              <select
                value={config.whisperModel}
                onChange={(e) => handleConfigChange('whisperModel', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="tiny">tiny (39M)</option>
                <option value="base">base (74M)</option>
                <option value="small">small (244M)</option>
                <option value="medium">medium (769M)</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">{t.whisperHelp}</p>
            </div>
          </div>
        )}

        {/* Test Connection */}
        {status.connected && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">{t.testConnection}</span>
              <button
                onClick={testConnection}
                disabled={isTesting}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
              >
                {isTesting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    {t.testing}
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    {t.testConnection}
                  </>
                )}
              </button>
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-lg text-sm ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}
              >
                {testResult.success ? (
                  <>
                    <div className="flex items-center gap-2 text-green-700 font-medium mb-1">
                      <Check className="w-4 h-4" />
                      {t.testSuccess}
                    </div>
                    <p className="text-green-600 text-xs">{testResult.response}</p>
                    {testResult.duration && (
                      <p className="text-green-500 text-xs mt-1">
                        {t.responseTime}: {testResult.duration}
                      </p>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="w-4 h-4" />
                    {t.testFailed}: {testResult.error}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800"
        >
          <RotateCcw className="w-4 h-4" />
          {t.reset}
        </button>

        <button
          onClick={handleSave}
          disabled={!hasChanges}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          {t.save}
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// AI STATUS INDICATOR - Compact status badge
// =============================================================================

export function AIStatusIndicator({ onClick, language = 'en', className = '' }) {
  const [status, setStatus] = useState({ connected: false });

  useEffect(() => {
    checkOllamaStatus().then(setStatus);

    // Re-check every 30 seconds
    const interval = setInterval(() => {
      checkOllamaStatus().then(setStatus);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const labels = {
    en: { aiOnline: 'AI Online', aiOffline: 'AI Offline' },
    no: { aiOnline: 'AI Tilkoblet', aiOffline: 'AI Frakoblet' },
  };

  const t = labels[language] || labels.en;

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors
        ${
          status.connected
            ? 'bg-green-100 text-green-700 hover:bg-green-200'
            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
        }
        ${className}`}
      title={status.connected ? t.aiOnline : t.aiOffline}
    >
      {status.connected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
      {status.connected ? 'AI' : 'AI'}
    </button>
  );
}
